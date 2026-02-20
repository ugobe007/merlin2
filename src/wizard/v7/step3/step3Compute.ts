/**
 * STEP 3 COMPUTE — THE SINGLE ORCHESTRATOR
 * ==========================================
 *
 * Created: February 8, 2026
 * Purpose: The ONE function that runs the full Step 3 pipeline.
 *
 * PIPELINE:
 *   1. Resolve industry context (catalog + aliases)
 *   2. Look up industry adapter (or use generic fallback)
 *   3. Map answers → NormalizedLoadInputs (adapter)
 *   4. Run calculator (SSOT)
 *   5. Build contributors from CalcValidation envelope
 *   6. Compute confidence from Tier-1 blocker coverage
 *   7. Run invariant checks
 *   8. Seal and return LoadProfileEnvelope
 *
 * RULES:
 *   - This function is PURE (no side effects, no DOM, no DB)
 *   - This function is SYNCHRONOUS (no async — calculators are sync)
 *   - The returned envelope is the ONLY thing Steps 4/5/6 may consume
 *   - No step may modify the envelope after creation
 *
 * ENTRY POINT:
 *   import { step3Compute } from '@/wizard/v7/step3/step3Compute';
 *
 *   const envelope = step3Compute({
 *     industry: 'hotel',        // or alias like 'hospitality'
 *     answers: { numRooms: 200, hotelCategory: 'upscale', ... },
 *   });
 */

import { resolveIndustryContext } from "../industry/resolveIndustryContext";
import { CALCULATORS_BY_ID } from "../calculators/registry";
import { getTier1Blockers } from "../schema/curatedFieldsResolver";
import type { CalcInputs, CalcRunResult, CalcValidation, ContributorKeys } from "../calculators/contract";
import type {
  LoadProfileEnvelope,
  LoadContributor,
  NormalizedLoadInputs,
  IndustryAdapter,
  ProvenanceConflict,
} from "./loadProfile";
import { checkEnvelopeInvariants, computeConfidence } from "./loadProfile";
import { PolicyEventCollector } from "./policyTaxonomy";
import { getCalculatorContract } from "./calculatorContracts";

// ============================================================================
// Adapter Registry
// ============================================================================

/**
 * Registry of industry adapters.
 *
 * Each adapter knows how to translate raw questionnaire answers
 * into NormalizedLoadInputs for its specific industry.
 *
 * Industries without a registered adapter use the GENERIC_ADAPTER.
 */
const ADAPTER_REGISTRY = new Map<string, IndustryAdapter>();

/**
 * Register an industry adapter.
 * Called by each adapter module at import time.
 */
export function registerAdapter(adapter: IndustryAdapter): void {
  ADAPTER_REGISTRY.set(adapter.industrySlug, adapter);
}

/**
 * Get the adapter for an industry (or null for generic fallback).
 */
export function getAdapter(industrySlug: string): IndustryAdapter | null {
  return ADAPTER_REGISTRY.get(industrySlug) ?? null;
}

/**
 * List all registered adapter slugs (for testing).
 */
export function listAdapterSlugs(): string[] {
  return [...ADAPTER_REGISTRY.keys()];
}

// ============================================================================
// Generic Fallback Adapter
// ============================================================================

/**
 * Generic adapter for industries without a specialized adapter.
 *
 * Reads common fields (facilitySize, operatingHours, gridConnection, peakDemandKW)
 * and produces conservative NormalizedLoadInputs.
 */
function genericMapAnswers(
  answers: Record<string, unknown>,
  _schemaKey: string
): NormalizedLoadInputs {
  const peakKW = Number(answers.peakDemandKW) || undefined;
  const sqft = Number(answers.facilitySize) || 50000;
  const hours = Number(answers.operatingHours) || 10;

  return {
    industrySlug: "other",
    schedule: {
      hoursPerDay: Math.min(24, Math.max(1, hours)),
      daysPerWeek: 7,
      profileType: "commercial",
    },
    scale: {
      kind: "sqft",
      value: sqft,
    },
    hvac: { class: "medium" },
    processLoads: [],
    architecture: {
      gridConnection: String(answers.gridConnection || "on-grid") as "on-grid",
      criticality: "none",
      existingSolarKW: Number(answers.existingSolar) || 0,
    },
    peakDemandOverrideKW: peakKW,
    monthlyEnergyKWh: Number(answers.monthlyKWH) || undefined,
  };
}

// ============================================================================
// Core Orchestrator
// ============================================================================

export type Step3ComputeInput = {
  /** Industry identifier (canonical slug, alias, or hyphen form — all work) */
  industry: string;

  /** Raw Step 3 answers (question.id → user value) */
  answers: Record<string, unknown>;
};

/**
 * THE STEP 3 COMPUTE FUNCTION
 *
 * This is the single entry point for Step 3 calculation.
 * It replaces all ad-hoc calculator invocations.
 *
 * SELF-HEALING: If the specialized adapter throws, we fall back to
 * generic adapter → fallback envelope (never a crash).
 */
export function step3Compute(input: Step3ComputeInput): LoadProfileEnvelope {
  const { industry, answers } = input;

  // ── 1. Resolve industry context ──────────────────────────────────────
  const ctx = resolveIndustryContext(industry);

  // ── 1b. Initialize policy event collector ────────────────────────────
  const policy = new PolicyEventCollector(ctx.canonicalSlug, ctx.calculatorId);

  // ── 1c. Detect borrowed schema ───────────────────────────────────────
  if (ctx.schemaKey !== ctx.canonicalSlug) {
    policy.borrowedSchema(ctx.canonicalSlug, ctx.schemaKey);
  }

  // ── 2. Get adapter (specialized or generic) ──────────────────────────
  const adapter = ADAPTER_REGISTRY.get(ctx.canonicalSlug);

  // ── 3. Map answers → NormalizedLoadInputs (with self-healing) ────────
  let normalizedInputs: NormalizedLoadInputs;
  let adapterWarning: string | undefined;

  if (adapter) {
    try {
      normalizedInputs = adapter.mapAnswers(answers, ctx.schemaKey);
    } catch (err) {
      // Self-healing: adapter threw → fall through to generic
      const errMsg = err instanceof Error ? err.message : String(err);
      adapterWarning = `Adapter "${ctx.canonicalSlug}" threw: ${errMsg}. Falling back to generic.`;
      policy.adapterFallback(ctx.canonicalSlug, errMsg);
      normalizedInputs = genericMapAnswers(answers, ctx.schemaKey);
      normalizedInputs.industrySlug = ctx.canonicalSlug;
    }
  } else {
    normalizedInputs = genericMapAnswers(answers, ctx.schemaKey);
    normalizedInputs.industrySlug = ctx.canonicalSlug;
  }

  // ── 4. Run calculator ────────────────────────────────────────────────
  const calc = CALCULATORS_BY_ID[ctx.calculatorId];
  if (!calc) {
    policy.calculatorFallback(ctx.calculatorId, "Calculator not found");
    const fb = buildFallbackEnvelope(ctx, `Calculator "${ctx.calculatorId}" not found`, policy);
    if (adapterWarning) fb.warnings.push(adapterWarning);
    return fb;
  }

  // Convert normalized inputs back to CalcInputs for the existing calculator
  // This is the bridge layer — adapters produce normalized, calculators consume flat
  const { flat: calcInputs, conflicts } = flattenForCalculator(normalizedInputs, answers, policy);
  calcInputs._industrySlug = ctx.canonicalSlug;

  // ── 4b. Validate inputs against contract ─────────────────────────────
  const contract = getCalculatorContract(ctx.calculatorId);
  if (contract) {
    for (const key of contract.requiredFlatKeys) {
      if (calcInputs[key] == null || calcInputs[key] === "") {
        // Check synonyms too
        const synMatch = Object.entries(contract.acceptedSynonyms).find(
          ([syn, canonical]) => canonical === key && calcInputs[syn] != null && calcInputs[syn] !== ""
        );
        if (!synMatch) {
          policy.missingInput(key, "(calculator default)");
        }
      }
    }
    // Range checks
    for (const [key, range] of Object.entries(contract.expectedRanges)) {
      const val = calcInputs[key];
      if (val != null && val !== "") {
        const num = Number(val);
        if (!Number.isFinite(num)) {
          policy.nanSanitized(key, val, "(calculator default)");
        } else if (num < range.min || num > range.max) {
          policy.rangeClamped(key, num, Math.max(range.min, Math.min(range.max, num)), [range.min, range.max]);
        }
      }
    }
  }

  let calcResult: CalcRunResult;
  try {
    calcResult = calc.compute(calcInputs as CalcInputs);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    // Self-healing: calculator threw → try generic SSOT adapter as backup
    const genericCalc = CALCULATORS_BY_ID["generic_ssot_v1"];
    if (genericCalc && genericCalc !== calc) {
      try {
        calcResult = genericCalc.compute(calcInputs as CalcInputs);
        policy.calculatorFallback(ctx.calculatorId, errMsg);
        adapterWarning = (adapterWarning ?? "") +
          ` Calculator "${ctx.calculatorId}" threw: ${errMsg}. Used generic fallback.`;
      } catch {
        policy.calculatorFallback(ctx.calculatorId, errMsg);
        const fb = buildFallbackEnvelope(ctx, `Calculator threw: ${errMsg}`, policy);
        if (adapterWarning) fb.warnings.push(adapterWarning);
        return fb;
      }
    } else {
      policy.calculatorFallback(ctx.calculatorId, errMsg);
      const fb = buildFallbackEnvelope(ctx, `Calculator threw: ${errMsg}`, policy);
      if (adapterWarning) fb.warnings.push(adapterWarning);
      return fb;
    }
  }

  // ── 5. Extract load metrics ──────────────────────────────────────────
  const peakKW = calcResult.peakLoadKW ?? 250;
  const baseLoadKW = calcResult.baseLoadKW ?? peakKW * 0.4;
  const energyKWhPerDay = calcResult.energyKWhPerDay ?? peakKW * normalizedInputs.schedule.hoursPerDay * 0.5;

  const dutyCycle = peakKW > 0 ? baseLoadKW / peakKW : 0;

  // ── 6. Build contributors from CalcValidation ────────────────────────
  const contributors = buildContributors(calcResult.validation, peakKW);
  const contributorSumKW = contributors.reduce((sum, c) => sum + c.kW, 0);
  const contributorDriftPct = peakKW > 0
    ? Math.abs(contributorSumKW - peakKW) / peakKW
    : 0;

  // ── 7. Compute confidence ────────────────────────────────────────────
  const tier1Blockers = getTier1Blockers(ctx.canonicalSlug);
  const answeredKeys = new Set(Object.keys(answers).filter((k) => answers[k] != null && answers[k] !== ""));
  const missingTier1 = tier1Blockers.filter((b) => !answeredKeys.has(b));
  const hasWarnings = (calcResult.warnings?.length ?? 0) > 0;
  const confidence = computeConfidence(missingTier1.length, tier1Blockers.length, hasWarnings);

  // ── 8. Build pre-invariant envelope ──────────────────────────────────
  const allWarnings = [...(calcResult.warnings ?? [])];
  if (adapterWarning) allWarnings.push(adapterWarning);

  const preEnvelope = {
    peakKW: Math.round(peakKW),
    avgKW: Math.round(baseLoadKW),
    dutyCycle: Math.round(dutyCycle * 1000) / 1000,
    energyKWhPerDay: Math.round(energyKWhPerDay),
    energyKWhPerYear: Math.round(energyKWhPerDay * 365),

    contributors,
    contributorSumKW: Math.round(contributorSumKW),
    contributorDriftPct: Math.round(contributorDriftPct * 10000) / 10000,

    confidence,
    missingTier1,
    assumptions: calcResult.assumptions ?? [],
    warnings: allWarnings,

    trace: ctx.trace,
    calculatorId: ctx.calculatorId,
    industrySlug: ctx.canonicalSlug,
    schemaKey: ctx.schemaKey,
    templateKey: ctx.templateKey,

    // Will be filled by invariant check
    schedule: normalizedInputs.schedule,
    conflicts,
    policyEvents: [],
  };

  // ── 9. Run invariant checks ──────────────────────────────────────────
  const invariants = checkEnvelopeInvariants(preEnvelope);
  const invariantsAllPassed = invariants.every((inv) => inv.passed);

  // Emit policy events for failed invariants
  for (const inv of invariants) {
    if (!inv.passed) {
      policy.invariantFailed(inv.rule, inv.detail);
    }
  }

  // ── 10. Seal envelope ────────────────────────────────────────────────
  const envelope: LoadProfileEnvelope = {
    ...preEnvelope,
    invariants,
    invariantsAllPassed,
    conflicts,
    policyEvents: policy.seal(),
    createdAt: new Date().toISOString(),
  };

  return envelope;
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Convert NormalizedLoadInputs back to flat CalcInputs for existing calculators.
 *
 * This is a BRIDGE — it exists because the current calculators expect flat
 * key-value inputs, not structured bundles. Over time, calculators should
 * migrate to consuming NormalizedLoadInputs directly.
 *
 * PROVENANCE TRACKING (Feb 2026):
 * When _rawExtensions overwrites a raw answer, the conflict is recorded.
 * Adapter wins, but the overwrite is NEVER silent.
 */
function flattenForCalculator(
  normalized: NormalizedLoadInputs,
  rawAnswers: Record<string, unknown>,
  policy: PolicyEventCollector
): { flat: Record<string, unknown>; conflicts: ProvenanceConflict[] } {
  const flat: Record<string, unknown> = {};
  const conflicts: ProvenanceConflict[] = [];

  // Pass through raw answers (calculator expects these field names)
  for (const [key, value] of Object.entries(rawAnswers)) {
    if (value != null && value !== "") {
      flat[key] = value;
    }
  }

  // Pass through _rawExtensions with conflict detection
  if (normalized._rawExtensions) {
    for (const [key, adapterValue] of Object.entries(normalized._rawExtensions)) {
      if (adapterValue == null || adapterValue === "") continue;

      // Check if raw answers already had this key
      const rawValue = rawAnswers[key];
      if (rawValue != null && rawValue !== "" && rawValue !== adapterValue) {
        // CONFLICT: adapter is overwriting a user-provided answer
        conflicts.push({
          key,
          rawValue,
          adapterValue,
          chosen: "adapter",
          reason: `Adapter _rawExtensions overrides raw answer for "${key}"`,
        });
        // Emit policy event for telemetry
        policy.conflict(key, rawValue, adapterValue);
      }

      // Adapter always wins (but conflict is recorded)
      flat[key] = adapterValue;
    }
  }

  // Overlay normalized bundle values (these take precedence)
  flat._industrySlug = normalized.industrySlug;

  // Scale
  switch (normalized.scale.kind) {
    case "rooms": flat.roomCount = normalized.scale.value; break;
    case "beds": flat.bedCount = normalized.scale.value; break;
    case "bays": flat.bayTunnelCount = normalized.scale.value; break;
    case "racks": flat.rackCount = normalized.scale.value; break;
    case "seats":
      flat.seatingCapacity = normalized.scale.value; // restaurant_load_v1 reads seatingCapacity
      flat.seatCount = normalized.scale.value;        // alias for compatibility
      break;
    case "pumps":
      flat.fuelPumps = normalized.scale.value;       // gas_station_load_v1 reads fuelPumps
      flat.fuelDispensers = normalized.scale.value;  // alias for compatibility
      break;
    case "chargers": flat.totalChargers = normalized.scale.value; break;
    case "units": flat.unitCount = normalized.scale.value; break;
    case "passengers": flat.annualPassengers = normalized.scale.value; break;
    case "sqft": // fallthrough
    default: flat.squareFootage = normalized.scale.value; break;
  }

  if (normalized.scale.subType) {
    flat.subType = normalized.scale.subType;
  }

  // Schedule
  flat.operatingHours = normalized.schedule.hoursPerDay;
  flat.daysPerWeek = normalized.schedule.daysPerWeek;
  if (normalized.schedule.shiftPattern) {
    flat.shiftPattern = normalized.schedule.shiftPattern;
  }

  // Architecture
  flat.gridConnection = normalized.architecture.gridConnection;
  if (normalized.architecture.existingSolarKW) {
    flat.existingSolar = normalized.architecture.existingSolarKW;
  }
  if (normalized.architecture.existingGeneratorKW) {
    flat.existingGenerator = normalized.architecture.existingGeneratorKW;
  }
  if (normalized.architecture.criticalLoadPct != null) {
    flat.criticalLoadPct = normalized.architecture.criticalLoadPct;
  }

  // Override
  if (normalized.peakDemandOverrideKW != null) {
    flat.peakDemandKW = normalized.peakDemandOverrideKW;
  }

  return { flat, conflicts };
}

/**
 * Build LoadContributor[] from CalcValidation envelope.
 *
 * Falls back to a single "total" contributor if no validation present.
 */
function buildContributors(
  validation: CalcValidation | undefined,
  peakKW: number
): LoadContributor[] {
  if (!validation?.kWContributors) {
    // No TrueQuote envelope — return single opaque contributor
    return [
      {
        key: "other",
        label: "Total estimated load",
        kW: Math.round(peakKW),
        share: 1.0,
      },
    ];
  }

  const CONTRIBUTOR_LABELS: Record<ContributorKeys, string> = {
    hvac: "HVAC / Climate Control",
    lighting: "Lighting",
    controls: "Controls / BMS",
    process: "Process Equipment",
    itLoad: "IT Equipment",
    cooling: "Dedicated Cooling",
    charging: "EV Charging",
    other: "Other / Miscellaneous",
  };

  const entries = Object.entries(validation.kWContributors) as [ContributorKeys, number][];
  const total = entries.reduce((sum, [, kw]) => sum + kw, 0) || 1;

  return entries
    .filter(([, kw]) => kw > 0)
    .map(([key, kw]) => ({
      key,
      label: CONTRIBUTOR_LABELS[key] ?? key,
      kW: Math.round(kw),
      share: Math.round((kw / total) * 1000) / 1000,
    }))
    .sort((a, b) => b.kW - a.kW); // Largest first
}

/**
 * Build a fallback envelope when something goes wrong.
 */
function buildFallbackEnvelope(
  ctx: ReturnType<typeof resolveIndustryContext>,
  errorMessage: string,
  policy: PolicyEventCollector
): LoadProfileEnvelope {
  const peakKW = 250;
  const avgKW = 100;

  policy.invariantFailed("fallback-used", errorMessage);

  return {
    peakKW,
    avgKW,
    dutyCycle: 0.4,
    energyKWhPerDay: 2400,
    energyKWhPerYear: 876000,

    contributors: [{ key: "other", label: "Fallback estimate", kW: peakKW, share: 1.0 }],
    contributorSumKW: peakKW,
    contributorDriftPct: 0,

    confidence: "fallback",
    missingTier1: [],
    assumptions: ["Fallback estimate — insufficient data"],
    warnings: [errorMessage],

    trace: ctx.trace,
    calculatorId: ctx.calculatorId,
    industrySlug: ctx.canonicalSlug,
    schemaKey: ctx.schemaKey,
    templateKey: ctx.templateKey,

    schedule: { hoursPerDay: 10, daysPerWeek: 7, profileType: "commercial" },

    invariants: [{
      rule: "fallback-used",
      passed: false,
      detail: errorMessage,
    }],
    invariantsAllPassed: false,
    conflicts: [],
    policyEvents: policy.seal(),
    createdAt: new Date().toISOString(),
  };
}
