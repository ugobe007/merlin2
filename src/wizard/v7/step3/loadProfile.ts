/**
 * STEP 3 — NORMALIZED LOAD PROFILE TYPES
 * =======================================
 *
 * Created: February 8, 2026
 * Purpose: The canonical "Step 3 contract" — the SINGLE type boundary
 *          between the questionnaire UX layer and the calculation engine.
 *
 * ARCHITECTURE:
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │  Layer A: UX / Questionnaire                                       │
 *   │  (per-industry schemas, curated questions, templates)              │
 *   └───────────────────────────────┬───────────────────────────────────┘
 *                                   │ answers: Record<string, unknown>
 *                                   ▼
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │  Industry Adapter                                                   │
 *   │  mapAnswersToNormalizedInputs(answers, ctx) → NormalizedLoadInputs │
 *   └───────────────────────────────┬───────────────────────────────────┘
 *                                   │
 *                                   ▼
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │  Layer B: Calculation Engine                                        │
 *   │  step3Compute(inputs) → LoadProfileEnvelope                        │
 *   │                                                                     │
 *   │  Internally: runs calculator, validates envelope, emits invariants │
 *   └───────────────────────────────┬───────────────────────────────────┘
 *                                   │
 *                                   ▼
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │  LoadProfileEnvelope (sealed output — consumed by Steps 4/5/6)     │
 *   │  peakKW, avgKW, dutyCycle, contributors[], confidence, invariants  │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 * DESIGN PRINCIPLES:
 *   1. UI can remain industry-specific (because UX matters)
 *   2. The engine must be bundle-normalized (because SSOT integrity matters)
 *   3. Normalization lives BETWEEN answers and calculation
 *   4. Every industry maps into the SAME NormalizedLoadInputs shape
 *   5. LoadProfileEnvelope is the ONLY output Step 4+ may consume
 *
 * WHY TWO LAYERS:
 *   - A hotel has "rooms" and "amenities" — that's great UX
 *   - The engine sees "scale.value=150, scale.kind='rooms', processLoads=[...]"
 *   - The adapter bridges these two worlds with explicit mapping
 *   - If the mapping breaks, the harness catches it immediately
 */

import type { ResolutionTrace } from "../industry/industryCatalog";
import type { PolicyEvent } from "./policyTaxonomy";

// ============================================================================
// LAYER A: Normalized Load Inputs (what the engine receives)
// ============================================================================

/**
 * Bundle 1: Operations & Schedule
 *
 * Captures temporal usage patterns. Every facility has operating hours,
 * and seasonality affects HVAC/process loads.
 */
export type ScheduleBundle = {
  /** Operating hours per day (1-24) */
  hoursPerDay: number;

  /** Operating days per week (1-7) */
  daysPerWeek: number;

  /**
   * Load profile shape — determines hour-by-hour demand curve.
   * 
   * 'flat' = constant load (data centers, hospitals)
   * 'commercial' = 8am-6pm peak (offices, retail)
   * 'evening-peak' = 5pm-10pm peak (hotels, residential)
   * 'dual-peak' = morning + evening peaks (restaurants)
   * 'industrial' = shift-based (manufacturing, warehouses)
   */
  profileType: "flat" | "commercial" | "evening-peak" | "dual-peak" | "industrial";

  /** Seasonal multiplier: 1.0 = no seasonality, 1.3 = 30% summer peak */
  seasonalityFactor?: number;

  /** Shift pattern (manufacturing/industrial) */
  shiftPattern?: "1-shift" | "2-shift" | "3-shift" | "24-7";
};

/**
 * Bundle 2: Facility Scale
 *
 * The primary sizing driver — what makes one facility bigger than another.
 * Every industry has a "scale unit" (rooms, bays, racks, sqft, chargers, etc.)
 */
export type ScaleBundle = {
  /**
   * The kind of scale unit.
   * This determines how the engine interprets `value`.
   */
  kind:
    | "sqft"      // office, retail, warehouse, manufacturing
    | "rooms"     // hotel
    | "beds"      // hospital
    | "bays"      // car wash
    | "chargers"  // EV charging (total charger count)
    | "racks"     // data center
    | "seats"     // restaurant
    | "pumps"     // gas station
    | "units"     // apartment (dwelling units)
    | "passengers" // airport (annual)
    | "generic";  // fallback (use with peakDemandKW override)

  /** Numeric scale value */
  value: number;

  /** Optional secondary scale (e.g., hotel sqft alongside room count) */
  secondaryValue?: number;
  secondaryKind?: string;

  /**
   * Industry sub-type that affects per-unit power intensity.
   * 
   * Examples:
   *   hotel: "economy" | "midscale" | "upscale" | "luxury"
   *   car-wash: "self-service" | "automatic" | "tunnel" | "full-service"
   *   data-center: "tier_2" | "tier_3" | "tier_4"
   *   manufacturing: "light" | "medium" | "heavy" | "electronics" | "food"
   *   hospital: "community" | "regional" | "academic" | "specialty"
   *   office: "standard" | "corporate" | "tech" | "medical"
   */
  subType?: string;
};

/**
 * Bundle 3: HVAC / Thermal Intensity
 *
 * Climate control is the #1 or #2 load in most commercial buildings.
 * Rather than asking complex HVAC questions, we capture the intensity class.
 */
export type HVACBundle = {
  /**
   * HVAC intensity class:
   *   'none' = outdoor/uncontrolled (car wash bays, parking lots)
   *   'low' = basic heating/cooling (warehouses, gas stations)
   *   'medium' = standard commercial (offices, retail, hotels)
   *   'high' = precision climate (data centers, hospitals, clean rooms)
   */
  class: "none" | "low" | "medium" | "high";

  /** Heating type (affects gas vs electric load split) */
  heatingType?: "electric" | "gas" | "heat-pump" | "none";

  /** Cooling type */
  coolingType?: "central-ac" | "split-system" | "chilled-water" | "evaporative" | "none";

  /** Age factor: older systems use more energy */
  systemAge?: "new" | "standard" | "aging";
};

/**
 * Bundle 4: Process Loads
 *
 * Industry-specific equipment that draws significant power.
 * This is the "flexible" bundle — each industry contributes different items.
 *
 * The adapter maps industry-specific answers into this normalized array.
 * Examples:
 *   Hotel: kitchen=80kW, laundry=45kW, pool_pump=15kW
 *   Car wash: dryers=120kW, pumps=50kW, vacuums=20kW
 *   EV charging: level2_array=86kW, dcfc_array=1200kW
 *   Data center: it_load=475kW, ups_losses=24kW
 */
export type ProcessLoad = {
  /** Canonical load category (maps to kWContributor key) */
  category: "process" | "lighting" | "hvac" | "cooling" | "charging" | "itLoad" | "controls" | "other";

  /** Human-readable label for audit trail */
  label: string;

  /** Total kW for this process load */
  kW: number;

  /** Duty cycle for this specific load [0, 1] */
  dutyCycle?: number;

  /** Number of units (for explainability: "4 dryers × 30 kW each") */
  quantity?: number;

  /** Per-unit kW (for explainability) */
  kWPerUnit?: number;
};

/**
 * Bundle 5: Power Architecture & Constraints
 *
 * Grid connection, backup requirements, and existing infrastructure
 * that constrain or modify the BESS sizing recommendation.
 */
export type ArchitectureBundle = {
  /** Grid connection type */
  gridConnection: "on-grid" | "off-grid" | "limited" | "redundant";

  /**
   * Criticality level — drives backup duration and generator sizing.
   *   'none' = no backup requirement
   *   'standard' = 4-hour backup recommended
   *   'mission-critical' = continuous power required (hospitals, data centers)
   */
  criticality: "none" | "standard" | "mission-critical";

  /** Critical load percentage (0-1): what fraction MUST stay powered */
  criticalLoadPct?: number;

  /** Existing solar capacity in kW (0 if none) */
  existingSolarKW?: number;

  /** Existing generator capacity in kW (0 if none) */
  existingGeneratorKW?: number;

  /** Existing battery storage in kWh (0 if none) */
  existingStorageKWh?: number;
};

/**
 * THE CANONICAL STEP 3 SSOT INPUT
 *
 * Every industry questionnaire maps into this shape.
 * Calculators consume this — never raw questionnaire answers.
 *
 * This is the hard boundary between UX and engine.
 */
export type NormalizedLoadInputs = {
  /** Which industry (canonical slug, underscore format) */
  industrySlug: string;

  /** Bundle 1: Schedule */
  schedule: ScheduleBundle;

  /** Bundle 2: Scale */
  scale: ScaleBundle;

  /** Bundle 3: HVAC */
  hvac: HVACBundle;

  /** Bundle 4: Process Loads (industry-specific equipment) */
  processLoads: ProcessLoad[];

  /** Bundle 5: Architecture */
  architecture: ArchitectureBundle;

  /**
   * Override: explicit peak demand in kW (bypasses calculator estimation).
   * Used when the user knows their actual demand from utility bills.
   */
  peakDemandOverrideKW?: number;

  /**
   * Override: monthly energy in kWh (for crosscheck / confidence boost).
   */
  monthlyEnergyKWh?: number;

  /**
   * Raw answers pass-through for calculators that need industry-specific
   * fields not captured in the bundles above. Adapters should minimize use.
   */
  _rawExtensions?: Record<string, unknown>;
};

// ============================================================================
// LAYER B: Load Profile Envelope (what Step 4+ receives)
// ============================================================================

/**
 * Confidence level of the load estimate.
 *
 * Driven by how many Tier-1 blocker questions were answered
 * and whether the answers produced reasonable kW values.
 */
export type ConfidenceLevel = "high" | "medium" | "low" | "fallback";

/**
 * A single kW contributor — one "slice" of the load breakdown.
 *
 * TrueQuote requires every kW to be explainable.
 */
export type LoadContributor = {
  /** Canonical key (must be one of ContributorKeys from contract.ts) */
  key: "hvac" | "lighting" | "controls" | "process" | "itLoad" | "cooling" | "charging" | "other";

  /** Human-readable label */
  label: string;

  /** kW attributed to this contributor */
  kW: number;

  /** Share of total peak (0-1) */
  share: number;

  /** Source citation for TrueQuote (e.g., "ASHRAE 90.1", "Energy Star") */
  source?: string;
};

/**
 * A provenance conflict — records when _rawExtensions overwrites a raw answer.
 *
 * COVENANT: Adapter wins, but overwrite is NEVER silent. Every overwrite
 * produces a ProvenanceConflict record so auditors can trace the decision.
 */
export type ProvenanceConflict = {
  /** The key that was overwritten */
  key: string;

  /** The value from raw user answers */
  rawValue: unknown;

  /** The value from the adapter's _rawExtensions */
  adapterValue: unknown;

  /** Which value was used (always "adapter" for now) */
  chosen: "adapter" | "raw";

  /** Why the adapter overrode (optional explanation) */
  reason?: string;
};

/**
 * An invariant check result — TrueQuote sanity validation.
 */
export type EnvelopeInvariant = {
  /** What was checked */
  rule: string;

  /** Did it pass? */
  passed: boolean;

  /** Human-readable detail */
  detail: string;
};

/**
 * THE LOAD PROFILE ENVELOPE
 *
 * This is the SINGLE output of Step 3. Everything else is support.
 * Steps 4, 5, and 6 consume ONLY this envelope.
 *
 * It is immutable after creation — no step may modify it.
 */
export type LoadProfileEnvelope = {
  // --- Core load metrics ---

  /** Peak demand in kW */
  peakKW: number;

  /** Average (base) load in kW */
  avgKW: number;

  /** Duty cycle [0, 1.25]: avgKW / peakKW */
  dutyCycle: number;

  /** Daily energy consumption in kWh */
  energyKWhPerDay: number;

  /** Annual energy consumption in kWh */
  energyKWhPerYear: number;

  // --- Explainability (TrueQuote) ---

  /** kW breakdown by contributor */
  contributors: LoadContributor[];

  /** Sum of all contributor kW (for sanity check against peakKW) */
  contributorSumKW: number;

  /** Maximum contributor share divergence from peakKW (0 = perfect) */
  contributorDriftPct: number;

  // --- Confidence & completeness ---

  /** How confident is this estimate? */
  confidence: ConfidenceLevel;

  /** Tier-1 blocker question IDs that were NOT answered */
  missingTier1: string[];

  /** Assumptions made by the calculator */
  assumptions: string[];

  /** Warnings about data quality or input issues */
  warnings: string[];

  // --- Schedule metadata (for invariant checks & downstream use) ---

  /** Operating schedule from normalized inputs (read-only provenance) */
  schedule: ScheduleBundle;

  // --- Provenance & traceability ---

  /** Resolution trace (which catalog entry, how resolved) */
  trace: ResolutionTrace;

  /** Which calculator produced this */
  calculatorId: string;

  /** Industry slug (canonical) */
  industrySlug: string;

  /** Schema key used for questionnaire */
  schemaKey: string;

  /** Template key used for mapping */
  templateKey: string;

  // --- TrueQuote invariants ---

  /** Invariant check results */
  invariants: EnvelopeInvariant[];

  /** Did ALL invariants pass? */
  invariantsAllPassed: boolean;

  // --- Provenance conflicts ---

  /**
   * Records every case where _rawExtensions overwrote a raw answer.
   * Empty array = no conflicts (clean provenance chain).
   */
  conflicts: ProvenanceConflict[];

  /**
   * TrueQuote™ policy events — persistence-ready telemetry.
   *
   * Every "thing that happened" during the pipeline is classified:
   *   SSOT_INPUT_MISSING, SEMANTIC_CONFLICT, NAN_SANITIZED,
   *   RANGE_CLAMPED, FLOOR_APPLIED, BORROWED_SCHEMA, etc.
   *
   * Dashboards aggregate by policyCode to spot systemic issues.
   */
  policyEvents: readonly PolicyEvent[];

  /** Timestamp of envelope creation */
  createdAt: string;
};

// ============================================================================
// INDUSTRY ADAPTER INTERFACE
// ============================================================================

/**
 * Every industry must implement this interface to participate in Step 3.
 *
 * The adapter is the ONLY place where industry-specific UX knowledge
 * (question IDs, answer formats, domain semantics) is translated into
 * the normalized engine input.
 *
 * RULES:
 *   1. Adapters may import from their industry's SSOT constants
 *   2. Adapters must NOT call calculators directly
 *   3. Adapters must NOT produce LoadProfileEnvelope — only NormalizedLoadInputs
 *   4. Missing answers must fall back to getDefaultInputs() values
 *   5. Adapters must be pure functions (no side effects, no async)
 */
export type IndustryAdapter = {
  /** Which industry this adapter handles (canonical slug) */
  industrySlug: string;

  /**
   * Map raw questionnaire answers into normalized engine inputs.
   *
   * @param answers - Raw Step 3 answers (question.id → value)
   * @param schemaKey - The schema key used to render the questionnaire
   * @returns Normalized inputs ready for the calculation engine
   */
  mapAnswers: (
    answers: Record<string, unknown>,
    schemaKey: string
  ) => NormalizedLoadInputs;

  /**
   * Default inputs when no answers have been provided yet.
   * Used for:
   *   - Live preview before user answers questions
   *   - Confidence calculation (what's missing vs what we have)
   *   - Test harness golden values
   */
  getDefaultInputs: () => NormalizedLoadInputs;

  /**
   * Which answer keys this adapter reads.
   * Used by the harness to detect unused questions (dead fields).
   */
  consumedAnswerKeys: readonly string[];
};

// ============================================================================
// DEFAULTS & HELPERS
// ============================================================================

/** Standard schedule bundles for common patterns */
export const SCHEDULE_PRESETS = {
  "24-7": { hoursPerDay: 24, daysPerWeek: 7, profileType: "flat" as const },
  "commercial": { hoursPerDay: 10, daysPerWeek: 6, profileType: "commercial" as const },
  "retail": { hoursPerDay: 12, daysPerWeek: 7, profileType: "commercial" as const },
  "restaurant": { hoursPerDay: 14, daysPerWeek: 7, profileType: "dual-peak" as const },
  "office": { hoursPerDay: 10, daysPerWeek: 5, profileType: "commercial" as const },
  "industrial-1": { hoursPerDay: 8, daysPerWeek: 5, profileType: "industrial" as const },
  "industrial-2": { hoursPerDay: 16, daysPerWeek: 6, profileType: "industrial" as const },
  "industrial-3": { hoursPerDay: 24, daysPerWeek: 7, profileType: "industrial" as const },
} as const;

/** Standard HVAC bundles for common patterns */
export const HVAC_PRESETS = {
  "none": { class: "none" as const },
  "warehouse": { class: "low" as const, heatingType: "gas" as const, coolingType: "evaporative" as const },
  "commercial": { class: "medium" as const, heatingType: "gas" as const, coolingType: "central-ac" as const },
  "precision": { class: "high" as const, heatingType: "heat-pump" as const, coolingType: "chilled-water" as const },
} as const;

/** Standard architecture bundles */
export const ARCHITECTURE_PRESETS = {
  "grid-standard": { gridConnection: "on-grid" as const, criticality: "none" as const },
  "grid-backup": { gridConnection: "on-grid" as const, criticality: "standard" as const },
  "mission-critical": { gridConnection: "redundant" as const, criticality: "mission-critical" as const, criticalLoadPct: 1.0 },
  "off-grid": { gridConnection: "off-grid" as const, criticality: "mission-critical" as const, criticalLoadPct: 1.0 },
} as const;

/**
 * Compute confidence level from missing Tier-1 blockers.
 */
export function computeConfidence(
  missingTier1Count: number,
  totalTier1Count: number,
  hasWarnings: boolean
): ConfidenceLevel {
  if (totalTier1Count === 0) return "medium"; // No blockers defined = medium by default
  // Round to avoid JS floating-point boundary errors (e.g., 1 - 8/10 = 0.19999...)
  const answeredPct = Math.round((1 - missingTier1Count / totalTier1Count) * 100) / 100;

  if (answeredPct >= 0.85 && !hasWarnings) return "high";
  if (answeredPct >= 0.50) return "medium";
  if (answeredPct >= 0.20) return "low";
  return "fallback";
}

/**
 * Run invariant checks on a load profile envelope.
 *
 * These are the TrueQuote sanity checks that catch silent drift.
 */
export function checkEnvelopeInvariants(
  envelope: Omit<LoadProfileEnvelope, "invariants" | "invariantsAllPassed" | "createdAt">
): EnvelopeInvariant[] {
  const invariants: EnvelopeInvariant[] = [];

  // INV-1: peakKW must be positive
  invariants.push({
    rule: "peak-positive",
    passed: envelope.peakKW > 0,
    detail: `peakKW = ${envelope.peakKW}`,
  });

  // INV-2: avgKW must be ≤ peakKW
  invariants.push({
    rule: "avg-lte-peak",
    passed: envelope.avgKW <= envelope.peakKW * 1.01, // 1% tolerance for rounding
    detail: `avgKW (${envelope.avgKW}) ≤ peakKW (${envelope.peakKW})`,
  });

  // INV-3: dutyCycle in [0, 1.25]
  invariants.push({
    rule: "duty-cycle-range",
    passed: envelope.dutyCycle >= 0 && envelope.dutyCycle <= 1.25,
    detail: `dutyCycle = ${envelope.dutyCycle}`,
  });

  // INV-4: No NaN or Infinity in core metrics
  const coreValues = [envelope.peakKW, envelope.avgKW, envelope.dutyCycle, envelope.energyKWhPerDay];
  const allFinite = coreValues.every(Number.isFinite);
  invariants.push({
    rule: "no-nan-infinity",
    passed: allFinite,
    detail: `Core metrics: [${coreValues.join(", ")}]`,
  });

  // INV-5: Contributor sum within 10% of peakKW (if contributors present)
  if (envelope.contributors.length > 0) {
    invariants.push({
      rule: "contributor-sum-sanity",
      passed: envelope.contributorDriftPct <= 0.10,
      detail: `Contributor drift: ${(envelope.contributorDriftPct * 100).toFixed(1)}% (sum=${envelope.contributorSumKW.toFixed(0)}, peak=${envelope.peakKW.toFixed(0)})`,
    });
  }

  // INV-6: At least 1 contributor with kW > 0
  if (envelope.contributors.length > 0) {
    const hasNonZero = envelope.contributors.some((c) => c.kW > 0);
    invariants.push({
      rule: "has-nonzero-contributor",
      passed: hasNonZero,
      detail: `${envelope.contributors.filter((c) => c.kW > 0).length} non-zero contributors`,
    });
  }

  // INV-7: No negative contributor kW
  const negativeContrib = envelope.contributors.find((c) => c.kW < 0);
  invariants.push({
    rule: "no-negative-contributors",
    passed: !negativeContrib,
    detail: negativeContrib
      ? `Negative contributor: ${negativeContrib.key} = ${negativeContrib.kW}`
      : "All contributors ≥ 0",
  });

  // INV-8: energyKWhPerDay is consistent with peakKW and dutyCycle
  if (allFinite && envelope.peakKW > 0) {
    const expectedEnergy = envelope.avgKW * envelope.schedule.hoursPerDay;
    const energyRatio = envelope.energyKWhPerDay / expectedEnergy;
    invariants.push({
      rule: "energy-consistency",
      passed: energyRatio >= 0.5 && energyRatio <= 2.0,
      detail: `energy ratio: ${energyRatio.toFixed(2)} (actual=${envelope.energyKWhPerDay.toFixed(0)}, expected≈${expectedEnergy.toFixed(0)})`,
    });
  }

  return invariants;
}
