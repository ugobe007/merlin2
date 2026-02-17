// src/wizard/v7/hooks/useWizardV7.ts
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { getTemplate } from "@/wizard/v7/templates/templateIndex";
import { CALCULATORS_BY_ID } from "@/wizard/v7/calculators/registry";
import { validateTemplateAgainstCalculator } from "@/wizard/v7/templates/validator";
import { applyTemplateMapping } from "@/wizard/v7/templates/applyMapping";
import type { CalcInputs } from "@/wizard/v7/calculators/contract";
import { ContractRunLogger } from "@/wizard/v7/telemetry/contractTelemetry";
import { validateTemplate, formatValidationResult } from "@/wizard/v7/validation/templateValidator";
import { sanityCheckQuote, type PricingSanity } from "@/wizard/v7/utils/pricingSanity";
import { getTier1Blockers, resolveStep3Schema } from "@/wizard/v7/schema/curatedFieldsResolver";

// Industry Context — SSOT resolver (Feb 7, 2026)
import { resolveIndustryContext } from "@/wizard/v7/industry";

// SSOT Pricing Bridge (Feb 3, 2026)
import {
  runPricingQuote,
  getSizingDefaults,
  generatePricingSnapshotId,
  type ContractQuoteResult,
  type PricingQuoteResult,
  type PricingConfig,
} from "@/wizard/v7/pricing/pricingBridge";

// ✅ MERLIN MEMORY (Feb 11, 2026): Persistent store for cross-step data
// Steps are momentary — memory is persistent. No more cross-step flag dependencies.
import { merlinMemory } from "@/wizard/v7/memory";

// Quota enforcement moved to export-only (Step 6). Previews are never metered.

/**
 * ============================================================
 * Wizard V7 — SSOT Orchestrator (useWizardV7.ts)
 * ============================================================
 * Doctrine:
 * - Web-page V7: no shell assumptions (works standalone on any route)
 * - Single SSOT hook: ALL step logic / transitions live here
 * - Steps are dumb: they render state + emit intents
 * - No nested parsing logic inside extractors/steps that competes with parser
 * - Orchestrator is the only gatekeeper (SSOT) for acceptance/rejection + notes
 *
 * Primary responsibilities:
 * - Own the canonical state
 * - Run side-effects (API calls, persistence, prefetch)
 * - Enforce step gating & transitions
 * - Provide actions for UI to call
 */

/* ============================================================
   Types
============================================================ */

export type WizardStep =
  | "location" // Step 1
  | "industry" // Step 2
  | "profile" // Step 3 (questions + template)
  | "options" // Step 4 (system add-ons: solar/EV/generator)
  | "magicfit" // Step 5 (3-tier system recommendations)
  | "results"; // Step 6 (final quote, outputs, export)

export type IndustrySlug =
  | "auto" // unknown/unset
  | "car_wash"
  | "hotel"
  | "ev_charging"
  | "retail"
  | "restaurant"
  | "warehouse"
  | "manufacturing"
  | "office"
  | "healthcare"
  | "data_center"
  | "other";

export type GridMode = "grid_tied" | "islanded" | "hybrid";

export type WizardError = {
  code: "NONE" | "NETWORK" | "VALIDATION" | "API" | "ABORTED" | "STATE" | "UNKNOWN";
  message: string;
  detail?: unknown;
};

export type LocationCard = {
  formattedAddress: string;
  city?: string;
  state?: string; // IMPORTANT: you flagged missing STATE; SSOT requires it.
  postalCode?: string;
  country?: string;
  countryCode?: string; // ISO country code (e.g., "US")
  lat?: number;
  lng?: number;
  placeId?: string;
};

export type FetchStatus = "idle" | "fetching" | "ready" | "error";

export type LocationIntel = {
  // Values
  peakSunHours?: number;
  utilityRate?: number;
  demandCharge?: number;
  utilityProvider?: string;
  weatherRisk?: string; // "Frequent heatwaves", "Harsh winters", etc.
  weatherProfile?: string; // "Hot & Humid", "Cold & Dry", "Temperate", etc.
  solarGrade?: string;

  // Per-source fetch status (enables progressive hydration)
  utilityStatus?: FetchStatus;
  solarStatus?: FetchStatus;
  weatherStatus?: FetchStatus;

  // Per-source errors
  utilityError?: string;
  solarError?: string;
  weatherError?: string;

  // Timestamp for staleness checks
  updatedAt?: number;
};

export type BusinessCard = {
  name?: string;
  address?: string;
  formattedAddress?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  city?: string;
  stateCode?: string;
  postal?: string;

  // Industry inference results
  inferredIndustry?: IndustrySlug;
  industryConfidence?: number;
  industryEvidence?: string[];

  // Timestamp
  resolvedAt?: number;
};

export type PricingFreeze = {
  // The "frozen" inputs used for pricing
  powerMW?: number;
  hours?: number;
  mwh?: number;
  voltage?: number;
  gridMode?: GridMode;
  useCase?: string;
  certifications?: string[];
  // hybrid options
  generatorMW?: number;
  solarMWp?: number;
  windMW?: number;
  // derived
  createdAtISO: string;
};

/**
 * Step 4 system add-ons — user-configurable enhancements to the BESS quote.
 *
 * These are PRESCRIPTIVE ("what to quote") vs Step 3's DIAGNOSTIC ("what you have").
 * Values flow: Step 4 UI → recalculateWithAddOns → pricingBridge → calculateQuote()
 */
export type SystemAddOns = {
  includeSolar: boolean;
  solarKW: number;
  includeGenerator: boolean;
  generatorKW: number;
  generatorFuelType: 'natural-gas' | 'diesel' | 'dual-fuel';
  includeWind: boolean;
  windKW: number;
};

export const DEFAULT_ADD_ONS: SystemAddOns = {
  includeSolar: false,
  solarKW: 0,
  includeGenerator: false,
  generatorKW: 0,
  generatorFuelType: 'natural-gas',
  includeWind: false,
  windKW: 0,
};

// Options can be strings or {value, label} objects (server templates use the latter)
export type OptionItem = string | { value: string; label: string };

export type Step3Template = {
  /**
   * Stable template identity (for keying defaults, touched state)
   * - DB templates: UUID from database
   * - JSON templates: deterministic string like "hotel.v1.0.0"
   */
  id?: string;

  /**
   * Industry slug of the ACTUAL template loaded (truth)
   * This is what the questions and calculator mapping belong to.
   * e.g., if user selected "manufacturing" but we loaded data_center template,
   * this will be "data_center".
   */
  industry: IndustrySlug;

  /**
   * Industry slug the USER selected (for UI display)
   * This is what the user sees in headers/badges.
   * e.g., "manufacturing" even though template is data_center.
   */
  selectedIndustry?: IndustrySlug;

  version: string; // e.g. "v7.0"
  questions: Array<{
    id: string;
    label: string;
    type: "number" | "text" | "select" | "boolean" | "multiselect";
    required?: boolean;
    options?: OptionItem[];
    unit?: string;
    hint?: string;
    // for scoring / validation (optional)
    min?: number;
    max?: number;
    // Autofill support
    defaultValue?: string | number | boolean | string[];
  }>;

  /**
   * Template-level defaults (canonical source from JSON/DB)
   * Applied per-part in Step3GatedV7
   */
  defaults?: Record<string, unknown>;

  /** Debug: effective template slug (redundant with industry, for logging) */
  _effectiveTemplate?: string;
};

export type Step3Answers = Record<string, unknown>;

/**
 * Provenance source for Step 3 answer values.
 * Forensic clarity for debugging quote accuracy.
 */
export type AnswerSource =
  | "template_default" // From template.defaults (canonical JSON/DB)
  | "question_default" // From question.defaultValue (legacy per-question)
  | "location_intel" // From locationIntel (utility rates, solar, weather)
  | "business_detection" // From businessDetectionService (Places API evidence)
  | "user"; // User explicitly edited

/**
 * Metadata for a single Step 3 answer value.
 * Tracks who set it and when (forensic audit trail).
 */
export type AnswerMeta = {
  source: AnswerSource;
  at: string; // ISO timestamp
  /** Optional: previous value before this mutation */
  prev?: unknown;
};

/**
 * Provenance map: questionId → metadata
 * Enables forensic debugging of quote inputs.
 */
export type Step3AnswersMeta = Record<string, AnswerMeta>;

/**
 * QuoteConfidence — Recovery Strategy Pillar 3: Late Accuracy Lock
 *
 * Transparency object: tells the user (and Merlin narration) how
 * confident we are in each data dimension.
 *
 * - "exact": Data confirmed from authoritative source
 * - "regional": Inferred from state/region averages
 * - "default": Using template defaults (user didn't provide)
 * - "fallback": Generic fallback (no industry-specific data)
 */
export type ConfidenceLevel = "exact" | "regional" | "default" | "fallback";

export type QuoteConfidence = {
  /** Location data quality */
  location: ConfidenceLevel;
  /** Industry template source */
  industry: "v1" | "fallback";
  /** How complete the Step 3 profile is (0–100%) */
  profileCompleteness: number;
  /** How many fields used defaults vs user input */
  defaultsUsed: number;
  /** How many fields the user explicitly set */
  userInputs: number;
  /** Overall confidence label for UI display */
  overall: "high" | "medium" | "low";
};

export type QuoteOutput = {
  // Load profile (from Layer A - physics/contract)
  baseLoadKW?: number;
  peakLoadKW?: number;
  energyKWhPerDay?: number;

  // Sizing hints (for Layer B - pricing)
  storageToPeakRatio?: number;
  durationHours?: number;

  // Financial outputs (from Layer B - pricing bridge)
  capexUSD?: number;           // Net cost (after ITC)
  grossCost?: number;          // Total project cost BEFORE ITC
  itcAmount?: number;          // ITC credit dollar amount
  itcRate?: number;            // ITC rate applied (e.g. 0.30)
  annualSavingsUSD?: number;
  roiYears?: number;
  npv?: number;
  irr?: number;
  paybackYears?: number;
  demandChargeSavings?: number;

  // Equipment breakdown (from Layer B)
  bessKWh?: number;
  bessKW?: number;
  solarKW?: number;
  generatorKW?: number;

  // Audit / notes
  notes?: string[];
  pricingSnapshotId?: string;

  // Status flags
  pricingComplete?: boolean;
  isProvisional?: boolean; // True when generated from incomplete Step 3

  // Input transparency
  missingInputs?: string[]; // List of missing required field IDs
  inputFallbacks?: {
    electricityRate?: { value: number; reason: string };
    demandCharge?: { value: number; reason: string };
    location?: { value: string; reason: string };
  };

  // Confidence scoring (Recovery Strategy Pillar 3)
  confidence?: QuoteConfidence;

  // TrueQuote™ validation envelope (kW contributors, duty cycle, assumptions)
  // Populated from CalcValidation in Layer A — used by export templates
  trueQuoteValidation?: {
    version: "v1";
    dutyCycle?: number;
    kWContributors?: Record<string, number>;
    kWContributorsTotalKW?: number;
    kWContributorShares?: Record<string, number>;
    assumptions?: string[];
  };

  // Margin policy (Feb 2026) — sell price commercialization
  margin?: {
    sellPriceTotal: number;
    baseCostTotal: number;
    marginDollars: number;
    marginPercent: number;
    marginBand: string;
    policyVersion: string;
    needsReview: boolean;
    warnings: string[];
  };
};

export type BusinessDraft = {
  name: string;
  address: string;
};

/**
 * Step 3 FSM status (explicit state machine for questionnaire flow)
 */
export type Step3Status =
  | "idle" // No template loaded
  | "template_loading" // Template fetch in progress
  | "template_ready" // Template loaded, awaiting defaults
  | "defaults_applying" // Applying baseline defaults
  | "part_active" // User is filling out a part
  | "validating" // Validating current part
  | "quote_generating" // Quote engine running
  | "complete" // Quote generated successfully
  | "error"; // Something went wrong

/**
 * Pricing FSM status (Phase 6: non-blocking pricing)
 *
 * DOCTRINE:
 * - Pricing failures NEVER block navigation
 * - Bad math becomes visible warnings, not errors
 * - User can retry from Results page
 */
export type PricingStatus =
  | "idle" // No pricing run yet
  | "pending" // Pricing in progress
  | "ok" // Pricing succeeded (may have warnings)
  | "error" // Pricing failed (retryable)
  | "timed_out"; // Pricing exceeded timeout threshold

export type EnergyGoal = 
  | 'lower_bills'
  | 'backup_power'
  | 'reduce_carbon'
  | 'energy_independence'
  | 'reduce_demand_charges';

export type WizardState = {
  // meta
  schemaVersion: "7.0.0";
  sessionId: string;

  // routing / progress
  step: WizardStep;
  stepHistory: WizardStep[];

  // Step 1: location
  locationRawInput: string;
  location: LocationCard | null;
  locationIntel: LocationIntel | null;
  locationConfirmed: boolean; // user has confirmed location (ZIP resolved)

  // Step 1: goals (added Feb 10, 2026 - user's energy objectives)
  goals: EnergyGoal[];
  goalsConfirmed: boolean; // user has selected goals (or skipped)
  goalsModalRequested: boolean; // bridge: WizardV7Page handleNext → Step1 goals modal

  // Step 3.5: add-ons (smart recommendations after profile)
  includeSolar: boolean;
  includeGenerator: boolean;
  includeEV: boolean;
  addOnsConfirmed: boolean; // user has chosen add-ons (or skipped)

  // Step 1: business (V6 parity)
  businessDraft: BusinessDraft; // typed draft fields (cleared on refresh unless confirmed)
  business: BusinessCard | null; // resolved business from Places API
  businessCard: BusinessCard | null; // LEGACY: alias for business (deprecated)
  businessConfirmed: boolean; // user must confirm or skip business before Step 2

  // Step 2: industry
  industry: IndustrySlug; // may be inferred
  industryLocked: boolean; // if inferred with high confidence, lock & skip

  // Step 3: profile template + answers
  step3Template: Step3Template | null;
  templateMode: "industry" | "fallback"; // Whether using real industry template or generic fallback
  step3Answers: Step3Answers;
  step3AnswersMeta: Step3AnswersMeta; // Provenance tracking
  step3Complete: boolean;

  // Step 3 FSM tracking
  step3Status: Step3Status; // Current FSM state
  step3PartIndex: number; // Current part (0-indexed)
  step3DefaultsAppliedParts: string[]; // Parts that have had defaults applied (by templateId.partId)

  // Pricing (Phase 6: non-blocking with stale-write protection)
  pricingStatus: PricingStatus; // FSM for pricing state
  pricingFreeze: PricingFreeze | null; // Frozen inputs snapshot
  pricingWarnings: string[]; // Math sanity warnings (non-fatal)
  pricingError: string | null; // Fatal pricing error message
  pricingUpdatedAt: number | null; // Timestamp of last pricing run
  pricingRequestKey: string | null; // Stale-write guard: hash of inputs when pricing started

  // Output / results
  quote: QuoteOutput | null;

  // Step 4: System add-ons (solar, generator, wind — user-configurable)
  step4AddOns: SystemAddOns;

  // statuses
  isHydrating: boolean;
  isBusy: boolean;
  busyLabel?: string;

  // errors
  error: WizardError | null;

  // diagnostics
  debug: {
    lastAction?: string;
    lastTransition?: string;
    lastApi?: string;
    notes: string[];
  };
};

type Intent =
  | { type: "HYDRATE_START" }
  | { type: "HYDRATE_SUCCESS"; payload: Partial<WizardState> }
  | { type: "HYDRATE_FAIL"; error: WizardError }
  | { type: "SET_BUSY"; isBusy: boolean; busyLabel?: string }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_ERROR"; error: WizardError }
  | { type: "SET_STEP"; step: WizardStep; reason?: string }
  | { type: "PUSH_HISTORY"; step: WizardStep }
  | { type: "RESET_SESSION"; sessionId: string }
  | { type: "SET_LOCATION_RAW"; value: string }
  | { type: "SET_LOCATION"; location: LocationCard | null }
  | { type: "SET_LOCATION_INTEL"; intel: LocationIntel | null }
  | { type: "PATCH_LOCATION_INTEL"; patch: Partial<LocationIntel> }
  | { type: "SET_LOCATION_CONFIRMED"; confirmed: boolean }
  | { type: "SET_GOALS"; goals: EnergyGoal[] }
  | { type: "TOGGLE_GOAL"; goal: EnergyGoal }
  | { type: "SET_GOALS_CONFIRMED"; confirmed: boolean }
  | { type: "REQUEST_GOALS_MODAL" }
  | { type: "TOGGLE_SOLAR" }
  | { type: "TOGGLE_GENERATOR" }
  | { type: "TOGGLE_EV" }
  | { type: "SET_ADDONS_CONFIRMED"; confirmed: boolean }
  | { type: "SET_BUSINESS_DRAFT"; patch: Partial<BusinessDraft> }
  | { type: "SET_BUSINESS"; business: BusinessCard | null }
  | { type: "SET_BUSINESS_CARD"; card: BusinessCard | null }
  | { type: "SET_BUSINESS_CONFIRMED"; confirmed: boolean }
  | { type: "SET_INDUSTRY"; industry: IndustrySlug; locked?: boolean }
  | { type: "SET_STEP3_TEMPLATE"; template: Step3Template | null }
  | { type: "SET_TEMPLATE_MODE"; mode: "industry" | "fallback" }
  | { type: "SET_STEP3_ANSWER"; id: string; value: unknown; source?: AnswerSource }
  | { type: "SET_STEP3_ANSWERS"; answers: Step3Answers; source?: AnswerSource }
  | { type: "PATCH_STEP3_ANSWERS"; patch: Step3Answers; source: AnswerSource } // Intel/detection patches
  | { type: "RESET_STEP3_TO_DEFAULTS"; scope: "all" | { partId: string } } // Explicit reset with provenance rewrite
  | { type: "SET_STEP3_COMPLETE"; complete: boolean }
  | { type: "SUBMIT_STEP3_STARTED" }
  | { type: "SUBMIT_STEP3_SUCCESS" }
  | { type: "SUBMIT_STEP3_FAILED"; error: { message: string; retries?: number } }
  // Step 3 FSM events
  | { type: "STEP3_TEMPLATE_REQUESTED" }
  | { type: "STEP3_TEMPLATE_READY"; templateId: string }
  | { type: "STEP3_DEFAULTS_APPLIED"; partId: string; templateId: string }
  | { type: "STEP3_PART_NEXT" } // Advance to next part (guarded)
  | { type: "STEP3_PART_PREV" } // Go back to previous part
  | { type: "STEP3_PART_SET"; index: number } // Jump to specific part
  | { type: "STEP3_QUOTE_REQUESTED" }
  | { type: "STEP3_QUOTE_DONE" }
  | { type: "STEP3_ERROR"; message: string }
  // Pricing FSM (Phase 6: non-blocking with stale-write protection)
  | { type: "PRICING_START"; requestKey: string }
  | {
      type: "PRICING_SUCCESS";
      freeze: PricingFreeze;
      quote: QuoteOutput;
      warnings: string[];
      requestKey: string;
    }
  | { type: "PRICING_ERROR"; error: string; requestKey: string }
  | { type: "PRICING_RETRY" }
  // Step 4 system add-ons
  | { type: "SET_STEP4_ADDONS"; addOns: SystemAddOns }
  // Legacy (deprecated but kept for compatibility)
  | { type: "SET_PRICING_FREEZE"; freeze: PricingFreeze | null }
  | { type: "SET_QUOTE"; quote: QuoteOutput | null }
  | { type: "DEBUG_NOTE"; note: string }
  | { type: "DEBUG_TAG"; lastAction?: string; lastTransition?: string; lastApi?: string };

/* ============================================================
   Persistence
============================================================ */

const STORAGE_KEY = "merlin_wizard_v7_state";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function createSessionId(): string {
  // deterministic enough for client-side session
  return `v7_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

/* ============================================================
   Contract Quote Runner (V7 SSOT Integration)
============================================================ */

/**
 * Run contract-based quote generation (LAYER A: Physics + Load Profile)
 *
 * This function is DETERMINISTIC and PRICING-AGNOSTIC:
 * - Load template for industry
 * - Validate template vs calculator contract
 * - Apply mapping transforms
 * - Compute quote via calculator
 * - Return load profile + sizing hints
 * - Log telemetry for production monitoring
 *
 * The output feeds into runPricingQuote() (Layer B) for financial calculations.
 */
function runContractQuote(params: {
  industry: string;
  answers: Record<string, unknown>;
  location?: LocationCard;
  locationIntel?: LocationIntel;
}): ContractQuoteResult & { freeze: PricingFreeze; quote: QuoteOutput; sessionId: string } {
  // Initialize telemetry logger
  let logger: ContractRunLogger | undefined;

  try {
    // 1. Resolve industry context (SSOT — replaces scattered alias maps)
    const ctx = resolveIndustryContext(params.industry);

    // 2. Load template using resolved templateKey
    const tpl = getTemplate(ctx.templateKey);
    if (!tpl) {
      throw { code: "STATE", message: `No template found for industry "${params.industry}" (templateKey: "${ctx.templateKey}")` };
    }

    // 3. Get calculator contract using resolved calculatorId
    const calc = CALCULATORS_BY_ID[ctx.calculatorId];
    if (!calc) {
      throw { code: "STATE", message: `No calculator registered for id "${ctx.calculatorId}" (industry: "${params.industry}")` };
    }

    // Initialize logger with context
    logger = new ContractRunLogger(params.industry, tpl.version, ctx.calculatorId);

    // Log start event
    logger.logStart(tpl.questions.length);

    // 3. Validate template vs calculator (hard fail on mismatch)
    //    SKIP validation when industry borrows another industry's template
    //    (e.g., gas_station borrows hotel template but uses gas_station_load_v1 calculator)
    const isBorrowedTemplate = ctx.templateKey !== ctx.canonicalSlug;

    if (!isBorrowedTemplate) {
      const validation = validateTemplateAgainstCalculator(tpl, calc, {
        minQuestions: 16,
        maxQuestions: 18,
      });

      if (!validation.ok) {
        const issues = validation.issues.map((i) => `${i.level}:${i.code}:${i.message}`);

        // Log validation failure
        logger.logValidationFailed(issues);

        const errorMsg = issues.join(" | ");
        throw { code: "VALIDATION", message: `Template validation failed: ${errorMsg}` };
      }
    }

    // 4. Apply mapping (answers → canonical calculator inputs)
    const mappedInputs = applyTemplateMapping(tpl, params.answers);
    
    // 4a. Bridge: pass raw answers underneath mapped inputs.
    // This ensures legacy curated-schema field names (e.g., "capacity",
    // "uptimeRequirement") are visible to calculator adapters even when
    // the template mapping doesn't reference them. Mapped values win.
    const inputs = { ...params.answers, ...mappedInputs };

    // 5. Run calculator
    const computed = calc.compute(inputs as CalcInputs);

    // 6. Extract load profile (Layer A output)
    const loadProfile = {
      baseLoadKW: computed.baseLoadKW ?? 0,
      peakLoadKW: computed.peakLoadKW ?? 0,
      energyKWhPerDay: computed.energyKWhPerDay ?? 0,
    };

    // ============================================================
    // LOAD PROFILE CONSISTENCY CHECK (TrueQuote validation)
    // ============================================================
    if (import.meta.env.DEV) {
      console.group(`[TrueQuote] Load Profile Consistency: ${tpl.industry}`);
      console.log("Template:", {
        industry: tpl.industry,
        version: tpl.version,
        calculator: tpl.calculator.id,
      });
      console.log("Inputs Used:", inputs);
      console.log("Load Profile:", loadProfile);
      console.log("Duty Cycle:", (computed as Record<string, unknown>).dutyCycle || "not provided");
      console.log(
        "kW Contributors:",
        (computed as Record<string, unknown>).kWContributors || "not provided"
      );

      // Sanity checks
      const warnings: string[] = [];
      if (loadProfile.peakLoadKW === 0) warnings.push("⚠️ Peak load is ZERO");
      if (loadProfile.peakLoadKW < loadProfile.baseLoadKW)
        warnings.push("⚠️ Peak < Base (impossible)");
      if (loadProfile.energyKWhPerDay === 0) warnings.push("⚠️ Daily energy is ZERO");
      if (loadProfile.energyKWhPerDay > loadProfile.peakLoadKW * 24) {
        warnings.push("⚠️ Daily energy > peak×24h (impossible)");
      }

      if (warnings.length > 0) {
        console.warn("Load Profile Sanity Issues:", warnings);
      } else {
        console.log("✅ Load profile passes sanity checks");
      }
      console.groupEnd();
    }

    // 7. Get sizing hints (industry-specific defaults + input-based)
    // ✅ FIX (Feb 14, 2026): Use ctx.sizingDefaults (canonical industry) instead of
    // getSizingDefaults(tpl.industry). When gas_station borrows hotel's template,
    // tpl.industry = "hotel" (hours=4) but gas_station needs hours=2.
    const sizingDefaults = ctx.sizingDefaults ?? getSizingDefaults(ctx.canonicalSlug);
    const sizingHints = {
      storageToPeakRatio: sizingDefaults.ratio,
      durationHours: sizingDefaults.hours,
      source: "industry-default" as const,
    };

    // 8. Collect inputs used for pricing (for audit trail)
    const locationIntel = params.locationIntel;
    const inputsUsed = {
      electricityRate: locationIntel?.utilityRate ?? 0.12,
      demandCharge: locationIntel?.demandCharge ?? 15,
      location: {
        state: params.location?.state ?? "unknown",
        zip: params.location?.postalCode,
        city: params.location?.city,
      },
      // ✅ FIX (Feb 14, 2026): Use canonical slug, not borrowed template industry.
      // gas_station borrowing hotel template should pass "gas-station" to pricing, not "hotel".
      industry: ctx.canonicalSlug.replace(/_/g, "-"),
      gridMode: (params.answers.gridMode as GridMode) ?? "grid_tied",
    };

    // 9. Build pricing freeze (SSOT snapshot)
    const freeze: PricingFreeze = {
      powerMW: loadProfile.peakLoadKW ? loadProfile.peakLoadKW / 1000 : undefined,
      hours: sizingHints.durationHours,
      mwh: loadProfile.energyKWhPerDay ? loadProfile.energyKWhPerDay / 1000 : undefined,
      useCase: ctx.canonicalSlug.replace(/_/g, "-"),
      createdAtISO: nowISO(),
    };

    // 10. Build base quote output (load profile only - no financials yet)
    const computedAny = computed as Record<string, unknown>;
    const quote: QuoteOutput = {
      baseLoadKW: loadProfile.baseLoadKW,
      peakLoadKW: loadProfile.peakLoadKW,
      energyKWhPerDay: loadProfile.energyKWhPerDay,
      storageToPeakRatio: sizingHints.storageToPeakRatio,
      durationHours: sizingHints.durationHours,
      notes: [...(computed.assumptions ?? []), ...(computed.warnings ?? []).map((w) => `⚠️ ${w}`)],
      pricingComplete: false, // Will be set true after Layer B

      // TrueQuote™ validation envelope — persisted for export/audit
      trueQuoteValidation: computed.validation
        ? {
            version: computed.validation.version,
            dutyCycle: computed.validation.dutyCycle,
            kWContributors: computed.validation.kWContributors as
              | Record<string, number>
              | undefined,
            kWContributorsTotalKW: computed.validation.kWContributorsTotalKW,
            kWContributorShares: computed.validation.kWContributorShares,
            assumptions: computed.assumptions,
          }
        : computedAny.kWContributors
          ? {
              version: "v1" as const,
              kWContributors: computedAny.kWContributors as Record<string, number>,
              dutyCycle: computedAny.dutyCycle as number | undefined,
              assumptions: computed.assumptions,
            }
          : undefined,
    };

    // 11. Log success telemetry
    logger.logSuccess({
      baseLoadKW: computed.baseLoadKW,
      peakLoadKW: computed.peakLoadKW,
      energyKWhPerDay: computed.energyKWhPerDay,
      warningsCount: computed.warnings?.length ?? 0,
      assumptionsCount: computed.assumptions?.length ?? 0,
      missingInputs: computed.warnings
        ?.filter((w) => w.toLowerCase().includes("missing"))
        .map((w) => w.split(":")[0].trim()),
    });

    // Log warnings separately if present
    if (computed.warnings && computed.warnings.length > 0) {
      logger.logWarnings(computed.warnings);
    }

    // ============================================================
    // QUOTE SANITY CHECKS (TrueQuote validation)
    // ============================================================
    if (import.meta.env.DEV) {
      const quoteSanityWarnings: string[] = [];

      // Check sizing hints
      if (!sizingHints.storageToPeakRatio || sizingHints.storageToPeakRatio <= 0) {
        quoteSanityWarnings.push("⚠️ Storage-to-peak ratio invalid or zero");
      }
      if (!sizingHints.durationHours || sizingHints.durationHours <= 0) {
        quoteSanityWarnings.push("⚠️ Duration hours invalid or zero");
      }

      // Check pricing inputs
      if (inputsUsed.electricityRate === 0.12) {
        quoteSanityWarnings.push("ℹ️ Using default electricity rate (0.12 $/kWh)");
      }
      if (inputsUsed.demandCharge === 15) {
        quoteSanityWarnings.push("ℹ️ Using default demand charge (15 $/kW)");
      }
      if (inputsUsed.location.state === "unknown") {
        quoteSanityWarnings.push("⚠️ Location unknown - using generic pricing");
      }

      if (quoteSanityWarnings.length > 0) {
        console.group("[TrueQuote] Quote Sanity Warnings");
        quoteSanityWarnings.forEach((w) => console.warn(w));
        console.log("Sizing Hints:", sizingHints);
        console.log("Inputs Used:", inputsUsed);
        console.groupEnd();
      }
    }

    return {
      freeze,
      quote,
      sessionId: logger.getSessionId(),
      // Layer A outputs for Layer B
      loadProfile,
      sizingHints,
      inputsUsed,
    };
  } catch (err) {
    // Log failure telemetry
    if (logger) {
      logger.logFailure({
        code: (err as { code?: string }).code || "UNKNOWN",
        message: (err as { message?: string }).message || "Contract execution failed",
      });
    }

    // Re-throw for caller
    throw err;
  }
}

/* ============================================================
   API (wire your real endpoints here)
============================================================ */

const api = {
  // Resolve user location input -> LocationCard
  async resolveLocation(input: string, signal?: AbortSignal): Promise<LocationCard> {
    const trimmed = input.trim();
    if (!trimmed) {
      throw { code: "VALIDATION", message: "Location input is empty." };
    }

    // Import API helper
    const { apiCall, API_ENDPOINTS } = await import("@/config/api");

    // Call backend location resolve endpoint
    const response = await apiCall<{
      ok: boolean;
      location?: LocationCard;
      source?: string;
      confidence?: number;
      evidence?: {
        source: string;
        placeId?: string;
        locationType?: string;
        components?: string[];
      };
      reason?: string;
      notes?: string[];
    }>(API_ENDPOINTS.LOCATION_RESOLVE, {
      method: "POST",
      body: JSON.stringify({ query: trimmed }),
      signal,
    });

    // Handle rejection from backend
    if (!response.ok) {
      const errorMsg = response.notes?.join(" ") || response.reason || "Location not found";

      // Log evidence for debugging if present
      if (response.evidence && import.meta.env.DEV) {
        console.log("[V7 SSOT] Location rejection evidence:", response.evidence);
      }

      throw { code: "VALIDATION", message: errorMsg };
    }

    // Log confidence + evidence for audit trail
    const confidence = response.confidence ?? 0.7;
    const evidence = response.evidence;

    if (import.meta.env.DEV) {
      console.log(`[V7 SSOT] Location resolved with confidence: ${confidence}`, {
        source: evidence?.source,
        placeId: evidence?.placeId,
        components: evidence?.components,
      });
    }

    // Soft-gate: Warn about low confidence but allow through
    if (confidence < 0.7) {
      console.warn(
        `[V7 SSOT] Low confidence location (${confidence}): ${response.location?.formattedAddress}`
      );
    }

    // Validate state field for US locations (SSOT requirement)
    let location = response.location!;
    if (location.countryCode === "US" && !location.state) {
      throw {
        code: "VALIDATION",
        message:
          "Location found, but no state detected. Please add state to your search (e.g., 'San Francisco, CA').",
      };
    }

    // ✅ FIX Feb 7, 2026: Guarantee postalCode is populated when input is a ZIP.
    // Many geocoders return lat/lng + formattedAddress but omit postalCode for ZIP lookups.
    const zip5 = trimmed.replace(/\D/g, "").slice(0, 5);
    if (zip5.length === 5 && /^\d{3,10}$/.test(trimmed) && !location.postalCode) {
      location = { ...location, postalCode: zip5 };
      if (import.meta.env.DEV) {
        console.log(`[V7 SSOT] resolveLocation: injected postalCode=${zip5} (geocoder omitted it)`);
      }
    }

    return location;
  },

  // ❌ fetchLocationIntel REMOVED (Feb 7, 2026)
  // SSOT: primeLocationIntel() is now the SINGLE enrichment path.
  // Both typing (debounced) and submit use the same function.

  // Progressive hydration: fetch utility data by ZIP
  async fetchUtility(
    zipOrInput: string
  ): Promise<{ rate?: number; demandCharge?: number; provider?: string }> {
    const zip = zipOrInput.replace(/\D/g, "").slice(0, 5);
    if (!zip || zip.length < 5) {
      return { rate: undefined, demandCharge: undefined, provider: undefined };
    }

    try {
      // Wire to real utilityRateService
      const { getCommercialRateByZip } = await import("@/services/utilityRateService");
      const data = await getCommercialRateByZip(zip);

      if (!data) {
        console.warn("[V7] No utility data for ZIP:", zip);
        return { rate: undefined, demandCharge: undefined, provider: undefined };
      }

      return {
        rate: data.rate,
        demandCharge: data.demandCharge,
        provider: data.utilityName,
      };
    } catch (e) {
      console.error("[V7] Utility rate fetch error:", e);
      throw e;
    }
  },

  // Progressive hydration: fetch solar data by ZIP
  async fetchSolar(zipOrInput: string): Promise<{ peakSunHours?: number; grade?: string }> {
    const zip = zipOrInput.replace(/\D/g, "").slice(0, 5);
    if (!zip || zip.length < 5) {
      return { peakSunHours: undefined, grade: undefined };
    }

    try {
      // Wire to real pvWattsService
      const { estimateSolarProduction: _estimateSolarProduction, REGIONAL_CAPACITY_FACTORS } =
        await import("@/services/pvWattsService");
      const { getUtilityRatesByZip } = await import("@/services/utilityRateService");

      // Get state from ZIP for capacity factor lookup
      const utilityData = await getUtilityRatesByZip(zip);
      const stateCode = utilityData?.stateCode || "CA";

      // Get capacity factor and calculate peak sun hours
      const capacityFactor = REGIONAL_CAPACITY_FACTORS[stateCode] ?? 0.17;
      // Peak sun hours ≈ capacity factor × 24 (simplified)
      const peakSunHours = capacityFactor * 24;

      // Solar grade based on capacity factor
      let grade: string;
      if (capacityFactor >= 0.21) grade = "A";
      else if (capacityFactor >= 0.18) grade = "A-";
      else if (capacityFactor >= 0.16) grade = "B+";
      else if (capacityFactor >= 0.14) grade = "B";
      else grade = "C";

      return {
        peakSunHours: Math.round(peakSunHours * 10) / 10,
        grade,
      };
    } catch (e) {
      console.error("[V7] Solar data fetch error:", e);
      throw e;
    }
  },

  // Progressive hydration: fetch weather data by ZIP
  async fetchWeather(zipOrInput: string): Promise<{ risk?: string; profile?: string }> {
    const zip = zipOrInput.replace(/\D/g, "").slice(0, 5);
    if (!zip || zip.length < 5) {
      return { risk: undefined, profile: undefined };
    }

    try {
      // Wire to real weatherService
      const { getWeatherData } = await import("@/services/weatherService");
      const data = await getWeatherData(zip);

      if (!data) {
        console.warn("[V7] No weather data for ZIP:", zip);
        return { risk: undefined, profile: undefined };
      }

      return {
        risk: data.extremes, // "Frequent heatwaves", "Harsh winters", etc.
        profile: data.profile, // "Hot & Humid", "Cold & Dry", "Temperate", etc.
      };
    } catch (e) {
      console.error("[V7] Weather fetch error:", e);
      throw e;
    }
  },

  // Infer industry from location/business card
  async inferIndustry(
    location: LocationCard,
    _signal?: AbortSignal,
    businessCard?: BusinessCard | null
  ): Promise<{ industry: IndustrySlug; confidence: number }> {
    // If businessCard has inferred industry, use it
    if (businessCard?.inferredIndustry && businessCard.inferredIndustry !== "auto") {
      const confidence = businessCard.industryConfidence ?? 0.9;
      console.log(
        `[V7 SSOT] Using business card industry: ${businessCard.inferredIndustry} (${confidence})`
      );
      return { industry: businessCard.inferredIndustry, confidence };
    }

    // Fallback: try to infer from location name, address, AND business card keywords
    // ✅ FIX Feb 7, 2026: Include businessCard.name + address so "dash car wash" matches car_wash
    const searchText = [
      businessCard?.name,
      businessCard?.address,
      location.formattedAddress,
      location.city,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // Simple keyword matching for common industries
    const industryKeywords: Record<IndustrySlug, string[]> = {
      car_wash: ["car wash", "carwash", "auto wash", "auto spa"],
      hotel: ["hotel", "motel", "inn", "resort", "suites", "lodge", "hospitality"],
      ev_charging: ["ev charging", "charging station", "supercharger", "electrify"],
      retail: ["retail", "store", "shop", "mall", "outlet"],
      restaurant: ["restaurant", "cafe", "diner", "grill", "kitchen", "bistro", "eatery"],
      warehouse: ["warehouse", "logistics", "distribution", "fulfillment", "storage"],
      manufacturing: ["manufacturing", "factory", "industrial", "plant", "production", "xtreme"],
      office: ["office", "corporate", "headquarters", "plaza"],
      healthcare: ["hospital", "clinic", "medical", "health", "care"],
      data_center: ["data center", "datacenter", "colocation", "colo"],
      auto: [],
      other: [],
    };

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some((kw) => searchText.includes(kw))) {
        // ✅ FIX Feb 7, 2026: Business name keyword match gets 0.92 confidence
        // (clears the 0.85 threshold for auto-skip to Step 3).
        // Location-only keyword match stays at 0.75 (user picks industry manually).
        const fromBusiness = businessCard?.name && keywords.some((kw) =>
          (businessCard.name ?? "").toLowerCase().includes(kw)
        );
        const conf = fromBusiness ? 0.92 : 0.75;
        console.log(`[V7 SSOT] Inferred industry from keywords: ${industry} (conf=${conf}, fromBusiness=${fromBusiness})`);
        return { industry: industry as IndustrySlug, confidence: conf };
      }
    }

    // No match
    return { industry: "auto", confidence: 0 };
  },

  /**
   * computeSmartDefaults - BASELINE BUILDER for Step 3 initial load
   *
   * TEMPLATE-DRIVEN (no hardcoded industryDefaults magic object).
   *
   * Sources (in priority order, last wins within each category):
   * 1. template.defaults (canonical defaults from JSON/DB)
   * 2. question.defaultValue (legacy per-question defaults)
   *
   * IMPORTANT: Does NOT include locationIntel or businessDetection.
   * Those are "override patches" applied separately via PATCH_STEP3_ANSWERS
   * to avoid stomping user edits on re-hydration.
   *
   * Returns: { answers, meta } with provenance tracking
   */
  computeSmartDefaults(
    template: Step3Template,
    _locationIntel: LocationIntel | null, // Reserved for future (not used in baseline)
    _businessCard: BusinessCard | null // Reserved for future (not used in baseline)
  ): { answers: Step3Answers; meta: Step3AnswersMeta } {
    const answers: Step3Answers = {};
    const meta: Step3AnswersMeta = {};
    const ts = nowISO();

    // 1. Apply template-level defaults first (canonical source from JSON/DB)
    if (template.defaults && typeof template.defaults === "object") {
      for (const [key, value] of Object.entries(template.defaults)) {
        answers[key] = value;
        meta[key] = { source: "template_default", at: ts };
      }
    }

    // 2. Apply per-question defaultValue (legacy format, overwrites template.defaults)
    for (const q of template.questions) {
      if (q.defaultValue !== undefined) {
        const prev = answers[q.id];
        answers[q.id] = q.defaultValue;
        meta[q.id] = { source: "question_default", at: ts, prev };
      }
    }

    console.log(
      `[V7 SSOT] Computed baseline defaults: ${Object.keys(answers).length} fields from template.id=${template.id || "?"}`
    );
    return { answers, meta };
  },

  /**
   * buildIntelPatch - Build a patch object from locationIntel
   *
   * Maps intel fields to Step 3 question IDs.
   * Returns only the fields that have data (sparse patch).
   *
   * This is applied via PATCH_STEP3_ANSWERS with source="location_intel"
   * so it won't stomp user edits.
   */
  buildIntelPatch(locationIntel: LocationIntel | null): Step3Answers {
    if (!locationIntel) return {};

    const patch: Step3Answers = {};

    // Map locationIntel fields to Step 3 question IDs
    if (locationIntel.demandCharge !== undefined) {
      patch["demand_charge_rate"] = locationIntel.demandCharge;
    }
    if (locationIntel.utilityRate !== undefined) {
      patch["electricity_rate"] = locationIntel.utilityRate;
    }
    // Future: Add more mappings as needed (e.g., peak_sun_hours → solar questions)

    if (Object.keys(patch).length > 0) {
      console.log(`[V7 SSOT] Built intel patch: ${Object.keys(patch).join(", ")}`);
    }

    return patch;
  },

  /**
   * buildBusinessPatch - Build a patch object from businessCard detection
   *
   * Maps business detection fields to Step 3 question IDs.
   * Returns only the fields that have data (sparse patch).
   *
   * This is applied via PATCH_STEP3_ANSWERS with source="business_detection"
   * so it won't stomp user edits.
   */
  buildBusinessPatch(businessCard: BusinessCard | null): Step3Answers {
    if (!businessCard) return {};

    const patch: Step3Answers = {};

    // Map businessCard fields to Step 3 question IDs
    // (These would come from businessDetectionService / Places API)
    // Example: if business detection found operating hours
    // patch["operating_hours"] = businessCard.operatingHours;

    // For now, this is a placeholder for future businessDetectionService integration

    if (Object.keys(patch).length > 0) {
      console.log(`[V7 SSOT] Built business patch: ${Object.keys(patch).join(", ")}`);
    }

    return patch;
  },

  // Load Step 3 template by industry
  // RESILIENCE: API is an enhancement, not a dependency.
  // If the backend is down (ECONNREFUSED / 500), fall back to local JSON templates.
  async loadStep3Template(industry: IndustrySlug, signal?: AbortSignal): Promise<Step3Template> {
    // Resolve industry context via SSOT catalog (replaces inline templateMapping)
    const ctx = resolveIndustryContext(industry);
    const selected = industry;
    const effective = ctx.templateKey as IndustrySlug;

    console.log(`[V7 SSOT] Step3 template resolved: selected=${selected} effective=${effective} (via industryCatalog)`);

    // ============================================================
    // Phase 1: Try remote API (preferred — freshest data)
    // ============================================================
    let remoteTemplate: Step3Template | null = null;
    let _apiError: unknown = null;

    try {
      const { apiCall, API_ENDPOINTS } = await import("@/config/api");

      const response = await apiCall<{
        ok: boolean;
        template?: Step3Template;
        reason?: string;
        notes?: string[];
        requestedIndustry?: string;
        availableIndustries?: string[];
      }>(API_ENDPOINTS.TEMPLATE_LOAD, {
        method: "POST",
        body: JSON.stringify({ industry: effective }),
        signal,
      });

      if (response.ok && response.template) {
        remoteTemplate = response.template;
      } else {
        _apiError = {
          code: "API",
          message: response.notes?.join(" ") || `Template not found for ${selected}`,
          reason: response.reason,
        };

        if (import.meta.env.DEV) {
          console.warn(
            `[V7 SSOT] Template API returned {ok:false}:`,
            `reason=${response.reason}`,
            `industry=${response.requestedIndustry ?? effective}`,
            `available=[${response.availableIndustries?.join(", ") ?? "?"}]`
          );
        }
      }
    } catch (err: unknown) {
      // AbortError should propagate immediately — user navigated away
      if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
        throw err;
      }
      _apiError = err;
      console.warn(
        `[V7 SSOT] Template API failed (will try local fallback):`,
        err instanceof Error ? err.message : err
      );
    }

    // ============================================================
    // Phase 2: Resolve template (remote OR local fallback OR generic)
    // ============================================================
    let sourceLabel: "api" | "local" | "generic-fallback" = "api";

    if (!remoteTemplate) {
      // Fallback 1: load from bundled JSON templates (industry-specific)
      const { getTemplate, getFallbackTemplate } =
        await import("@/wizard/v7/templates/templateIndex");
      const localTpl = getTemplate(effective);

      if (!localTpl) {
        // Fallback 2: Universal generic template (works for ANY facility)
        // Recovery Strategy: Never hard-fail — always give user a path forward
        console.warn(`[V7 SSOT] No template for "${effective}" — using generic facility fallback`);
        const genericTpl = getFallbackTemplate();

        remoteTemplate = {
          id: genericTpl.id ?? `${genericTpl.industry}.${genericTpl.version}`,
          industry: genericTpl.industry as IndustrySlug,
          selectedIndustry: selected as IndustrySlug, // Preserve what user actually picked
          version: genericTpl.version,
          questions: genericTpl.questions.map((q) => ({
            id: q.id,
            label: q.label,
            type: q.type as Step3Template["questions"][number]["type"],
            required: q.required,
            options: q.options as Step3Template["questions"][number]["options"],
            unit: q.unit,
            hint: q.hint,
            min: q.min,
            max: q.max,
            defaultValue: genericTpl.defaults?.[q.id] as
              | string
              | number
              | boolean
              | string[]
              | undefined,
          })),
          defaults: genericTpl.defaults,
        };
        sourceLabel = "generic-fallback";
      } else {
        // Convert IndustryTemplateV1 → Step3Template shape
        remoteTemplate = {
          id: localTpl.id ?? `${localTpl.industry}.${localTpl.version}`,
          industry: localTpl.industry as IndustrySlug,
          version: localTpl.version,
          questions: localTpl.questions.map((q) => ({
            id: q.id,
            label: q.label,
            type: q.type as Step3Template["questions"][number]["type"],
            required: q.required,
            options: q.options as Step3Template["questions"][number]["options"],
            unit: q.unit,
            hint: q.hint,
            min: q.min,
            max: q.max,
            defaultValue: localTpl.defaults?.[q.id] as
              | string
              | number
              | boolean
              | string[]
              | undefined,
          })),
          defaults: localTpl.defaults,
        };
        sourceLabel = "local";
      }

      if (import.meta.env.DEV) {
        console.warn(
          `[V7 SSOT] ⚠ Using ${sourceLabel.toUpperCase()} template for "${effective}" (API unavailable)`
        );
      }
    }

    // ============================================================
    // Phase 3: Stamp identity fields + validate
    // ============================================================

    // Generate deterministic template ID if not provided
    const templateId =
      (remoteTemplate as Record<string, unknown>).id ?? `${effective}.${remoteTemplate.version}`;

    // Build final template with proper identity fields
    const finalTemplate: Step3Template = {
      ...remoteTemplate,

      // Stable identity for keying
      id: templateId as string,

      // Internal truth: what the questions/mapping actually belong to
      industry: effective,

      // UI display: what user selected (for headers, badges)
      selectedIndustry: selected,

      // Debug field (redundant but useful for logging)
      _effectiveTemplate: effective,
    };

    // ============================================================
    // SSOT Contract Validation (invariant enforcement)
    // ============================================================
    const validation = validateTemplate(finalTemplate, {
      minQuestions: 8,
      maxQuestions: 24,
      strictMode: false,
    });

    if (!validation.ok) {
      // Log detailed validation failure
      console.error("[V7 SSOT] Template validation FAILED:", formatValidationResult(validation));

      // Hard fail - don't return a broken template that would produce garbage quotes
      throw {
        code: "VALIDATION",
        message: `Template contract violation: ${validation.issues
          .filter((i) => i.level === "error")
          .map((i) => i.message)
          .join("; ")}`,
        _validationResult: validation,
      };
    }

    // Log warnings in DEV (non-blocking)
    if (validation.summary.warnings > 0 && import.meta.env.DEV) {
      console.warn("[V7 SSOT] Template validation warnings:", formatValidationResult(validation));
    }

    console.log(
      `[V7 SSOT] Loaded Step3 template: selected=${selected} effective=${effective} source=${sourceLabel} v=${remoteTemplate.version} id=${templateId} questions=${finalTemplate.questions.length} ✓`
    );

    return finalTemplate;
  },

  // Pricing API integration
  async runPricingQuote(
    contract: import("@/wizard/v7/pricing/pricingBridge").ContractQuoteResult,
    config: PricingConfig
  ): Promise<PricingQuoteResult> {
    // Implementation delegated to pricingBridge.ts
    const { runPricingQuote } = await import("@/wizard/v7/pricing/pricingBridge");
    return runPricingQuote(contract, config);
  },
};

/* ============================================================
   Reducer
============================================================ */

function initialState(): WizardState {
  return {
    schemaVersion: "7.0.0",
    sessionId: createSessionId(),

    step: "location",
    stepHistory: ["location"],

    locationRawInput: "",
    location: null,
    locationIntel: null,
    locationConfirmed: false,

    // Goals (added Feb 10, 2026)
    goals: [],
    goalsConfirmed: false,
    goalsModalRequested: false,

    // Add-ons (smart recommendations after Step 3 profile)
    includeSolar: false,
    includeGenerator: false,
    includeEV: false,
    addOnsConfirmed: false,

    // V6 parity: business draft + resolved business
    businessDraft: { name: "", address: "" },
    business: null,
    businessCard: null, // LEGACY alias
    businessConfirmed: false,

    industry: "auto",
    industryLocked: false,

    step3Template: null,
    templateMode: "industry",
    step3Answers: {},
    step3AnswersMeta: {}, // Provenance tracking
    step3Complete: false,

    // Step 3 FSM
    step3Status: "idle",
    step3PartIndex: 0,
    step3DefaultsAppliedParts: [],

    // Pricing (Phase 6: non-blocking with stale-write protection)
    pricingStatus: "idle",
    pricingFreeze: null,
    pricingWarnings: [],
    pricingError: null,
    pricingUpdatedAt: null,
    pricingRequestKey: null,

    quote: null,

    // Step 4 system add-ons
    step4AddOns: { ...DEFAULT_ADD_ONS },

    isHydrating: true,
    isBusy: false,
    busyLabel: undefined,

    error: null,

    debug: {
      lastAction: undefined,
      lastTransition: undefined,
      lastApi: undefined,
      notes: [],
    },
  };
}

function reduce(state: WizardState, intent: Intent): WizardState {
  switch (intent.type) {
    case "HYDRATE_START":
      return { ...state, isHydrating: true, error: null };

    case "HYDRATE_SUCCESS":
      return {
        ...state,
        ...intent.payload,
        isHydrating: false,
        debug: { ...state.debug, notes: [...state.debug.notes, "Hydrate success."] },
      };

    case "HYDRATE_FAIL":
      return { ...state, isHydrating: false, error: intent.error };

    case "SET_BUSY":
      return { ...state, isBusy: intent.isBusy, busyLabel: intent.busyLabel };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "SET_ERROR":
      return { ...state, error: intent.error };

    case "SET_STEP": {
      const prev = state.step;
      const next = intent.step;
      const reason = intent.reason || "unknown";
      
      // Diagnostic log (Step3→Step4 root cause analysis)
      console.log("[Wizard] step transition", { from: prev, to: next, reason });
      
      return {
        ...state,
        step: intent.step,
        debug: { ...state.debug, lastTransition: `${prev} → ${next} (${reason})` },
      };
    }

    case "PUSH_HISTORY": {
      const prev = state.stepHistory[state.stepHistory.length - 1];
      if (prev === intent.step) return state;
      return { ...state, stepHistory: [...state.stepHistory, intent.step] };
    }

    case "RESET_SESSION":
      return {
        ...initialState(),
        sessionId: intent.sessionId,
        isHydrating: false,
        debug: {
          lastAction: "RESET_SESSION",
          lastTransition: undefined,
          lastApi: undefined,
          notes: ["Session reset."],
        },
      };

    case "SET_LOCATION_RAW": {
      const raw = intent.value;
      const digits = raw.replace(/\D/g, "").slice(0, 5);
      // ✅ FIX Feb 7, 2026: When user types a pure 5-digit ZIP, pre-populate a minimal
      // location card with postalCode + state. This ensures state.location.postalCode is
      // available immediately for gates, persistence, and downstream services.
      // NOTE: This does NOT trigger the full downstream reset that SET_LOCATION does.
      const isPureZipInput = /^\d{3,10}$/.test(raw.trim());
      if (isPureZipInput && digits.length === 5) {
        const stateCode = getStateFromZipPrefix(digits);
        // ✅ FIX Feb 11: Edit-clears-confirmation behavior
        // When user types a NEW ZIP that differs from confirmed ZIP, clear confirmation
        const confirmedZip = state.location?.postalCode || "";
        const zipChanged = digits !== confirmedZip;
        return {
          ...state,
          locationRawInput: raw,
          location: {
            ...(state.location ?? { formattedAddress: digits }),
            postalCode: digits,
            ...(stateCode && !state.location?.state ? { state: stateCode } : {}),
          } as LocationCard,
          // Clear confirmation ONLY if ZIP changed
          locationConfirmed: zipChanged ? false : state.locationConfirmed,
        };
      }
      // For incomplete ZIPs or text input, just update raw input (don't change confirmation)
      return { ...state, locationRawInput: raw };
    }

    case "SET_LOCATION":
      // ✅ FIX Jan 31: ALWAYS reset downstream when setting a location (prevents stale intel/template)
      // If location is null, we're clearing; if it's set, we're changing - either way, reset downstream
      return {
        ...state,
        location: intent.location,
        // Always clear downstream to prevent stale data
        locationIntel: null,
        industry: "auto",
        industryLocked: false,
        step3Template: null,
        step3Answers: {},
        step3AnswersMeta: {}, // Clear provenance on location change
        step3Complete: false,
        // Reset FSM
        step3Status: "idle",
        step3PartIndex: 0,
        step3DefaultsAppliedParts: [],
        pricingFreeze: null,
        quote: null,
      };

    case "SET_LOCATION_INTEL":
      return { ...state, locationIntel: intent.intel };

    case "PATCH_LOCATION_INTEL":
      return {
        ...state,
        locationIntel: {
          ...(state.locationIntel ?? {}),
          ...intent.patch,
          updatedAt: Date.now(),
        },
      };

    case "SET_LOCATION_CONFIRMED":
      return { ...state, locationConfirmed: intent.confirmed };

    case "SET_GOALS":
      return { ...state, goals: intent.goals };

    case "TOGGLE_GOAL": {
      const hasGoal = state.goals.includes(intent.goal);
      const newGoals = hasGoal
        ? state.goals.filter((g) => g !== intent.goal)
        : [...state.goals, intent.goal];
      return { ...state, goals: newGoals };
    }

    case "REQUEST_GOALS_MODAL":
      return { ...state, goalsModalRequested: true };

    case "SET_GOALS_CONFIRMED": {
      const goalsConfirmed = intent.confirmed;
      
      // ✅ FIX Feb 12: Business is auto-confirmed on search, so no businessPending gate needed
      const onLocationStep = state.step === "location";
      const locationReady = state.locationConfirmed === true;
      
      // Advance when goals confirmed + location ready
      const canAdvance = goalsConfirmed && onLocationStep && locationReady;
      
      // ✅ FIX Feb 11: Skip industry step when already locked AND template is loaded
      // Goals inform the wizard, they don't instruct it — routing is based on industry detection
      const skipIndustry = canAdvance
        && state.industryLocked
        && !!state.industry && state.industry !== "auto"
        && !!state.step3Template; // Safety: template must be loaded before skipping to profile
      
      const nextStep = canAdvance
        ? (skipIndustry ? "profile" : "industry")
        : state.step;
      
      return {
        ...state,
        goalsConfirmed,
        goalsModalRequested: false, // clear the request
        step: nextStep,
        debug: {
          ...state.debug,
          notes: [
            ...state.debug.notes,
            goalsConfirmed
              ? canAdvance
                ? skipIndustry
                  ? "Goals confirmed - skipping industry (locked) → profile"
                  : "Goals confirmed - advancing to industry step"
                : "Goals confirmed - waiting for location"
              : "Goals skipped",
          ],
        },
      };
    }

    case "TOGGLE_SOLAR":
      return { ...state, includeSolar: !state.includeSolar };

    case "TOGGLE_GENERATOR":
      return { ...state, includeGenerator: !state.includeGenerator };

    case "TOGGLE_EV":
      return { ...state, includeEV: !state.includeEV };

    case "SET_ADDONS_CONFIRMED":
      return { ...state, addOnsConfirmed: intent.confirmed };

    case "SET_BUSINESS_DRAFT":
      return {
        ...state,
        businessDraft: {
          ...state.businessDraft,
          ...intent.patch,
        },
        // Reset confirmation when draft changes
        businessConfirmed: false,
      };

    case "SET_BUSINESS":
      return {
        ...state,
        business: intent.business,
        businessCard: intent.business, // Keep legacy alias in sync
        businessConfirmed: false, // Reset confirmation when business changes
      };

    case "SET_BUSINESS_CARD":
      return {
        ...state,
        businessCard: intent.card ? { ...intent.card, resolvedAt: Date.now() } : null,
        business: intent.card ? { ...intent.card, resolvedAt: Date.now() } : null, // Keep in sync
        // Reset confirmation when business card changes
        businessConfirmed: false,
      };

    case "SET_BUSINESS_CONFIRMED":
      return {
        ...state,
        businessConfirmed: intent.confirmed,
      };

    case "SET_INDUSTRY":
      return {
        ...state,
        industry: intent.industry,
        industryLocked: typeof intent.locked === "boolean" ? intent.locked : state.industryLocked,
      };

    case "SET_STEP3_TEMPLATE":
      return { ...state, step3Template: intent.template };

    case "SET_TEMPLATE_MODE":
      return { ...state, templateMode: intent.mode };

    case "SET_STEP3_ANSWER": {
      // Single answer mutation with provenance tracking
      const source = intent.source ?? "user"; // Default to "user" if not specified
      const ts = nowISO();
      const prevValue = state.step3Answers[intent.id];

      return {
        ...state,
        step3Answers: { ...state.step3Answers, [intent.id]: intent.value },
        step3AnswersMeta: {
          ...state.step3AnswersMeta,
          [intent.id]: {
            source,
            at: ts,
            prev: prevValue,
          },
        },
      };
    }

    case "SET_STEP3_ANSWERS": {
      // Bulk answer replacement with provenance tracking
      // ⚠️ HARDENING: This should ONLY be used for baseline initialization or explicit reset
      // Runtime updates from intel/business MUST use PATCH_STEP3_ANSWERS
      const source = intent.source ?? "template_default";
      const ts = nowISO();

      // Safety check: warn if overwriting user edits (indicates misuse)
      const hasUserEdits = Object.values(state.step3AnswersMeta).some((m) => m.source === "user");
      if (hasUserEdits && source !== "user" && import.meta.env.DEV) {
        console.warn(
          "[V7 SSOT] ⚠️ SET_STEP3_ANSWERS called with existing user edits. " +
            "Consider using PATCH_STEP3_ANSWERS or RESET_STEP3_TO_DEFAULTS instead."
        );
      }

      // Build meta for all keys being set
      const newMeta: Step3AnswersMeta = {};
      for (const id of Object.keys(intent.answers)) {
        newMeta[id] = {
          source,
          at: ts,
          prev: state.step3Answers[id],
        };
      }

      return {
        ...state,
        step3Answers: intent.answers,
        step3AnswersMeta: newMeta, // Replace (not merge) for full resets
      };
    }

    case "PATCH_STEP3_ANSWERS": {
      // Patch (merge) answers WITHOUT stomping user edits
      // Used for intel/detection patches that arrive after initial load
      const source = intent.source;
      const ts = nowISO();

      // Only apply patch for keys that are NOT already "user" sourced
      const patchedAnswers = { ...state.step3Answers };
      const patchedMeta = { ...state.step3AnswersMeta };

      for (const [id, value] of Object.entries(intent.patch)) {
        const existingMeta = state.step3AnswersMeta[id];

        // Skip if user has already touched this field
        if (existingMeta?.source === "user") {
          console.log(`[V7 Provenance] Skipping patch for ${id} - user already edited`);
          continue;
        }

        // Apply the patch
        patchedAnswers[id] = value;
        patchedMeta[id] = {
          source,
          at: ts,
          prev: state.step3Answers[id],
        };
      }

      return {
        ...state,
        step3Answers: patchedAnswers,
        step3AnswersMeta: patchedMeta,
      };
    }

    case "RESET_STEP3_TO_DEFAULTS": {
      // Explicit reset with provenance rewrite (user requested "reset to defaults")
      // This DOES overwrite user values because user explicitly asked for it
      const template = state.step3Template;
      if (!template) return state;

      const ts = nowISO();
      const resetAnswers: Step3Answers = {};
      const resetMeta: Step3AnswersMeta = {};

      // Determine which question IDs to reset
      let questionIdsToReset: string[];
      if (intent.scope === "all") {
        questionIdsToReset = template.questions.map((q) => q.id);
      } else {
        // Reset only questions in the specified part
        // For now, treat partId as a prefix filter (e.g., "part1_" questions)
        // In practice, this should use template.parts structure
        const scopeObj = intent.scope as { partId: string };
        questionIdsToReset = template.questions
          .filter((q) => q.id.startsWith(scopeObj.partId))
          .map((q) => q.id);
      }

      // Apply template.defaults first, then question.defaultValue
      for (const qid of questionIdsToReset) {
        const q = template.questions.find((qu) => qu.id === qid);
        if (!q) continue;

        // Priority: template.defaults > question.defaultValue > undefined
        let value: unknown = undefined;
        let source: AnswerSource = "template_default";

        if (template.defaults && qid in template.defaults) {
          value = template.defaults[qid];
          source = "template_default";
        } else if (q.defaultValue !== undefined) {
          value = q.defaultValue;
          source = "question_default";
        }

        if (value !== undefined) {
          resetAnswers[qid] = value;
          resetMeta[qid] = {
            source,
            at: ts,
            prev: state.step3Answers[qid], // Keep audit trail of what was reset
          };
        }
      }

      // Merge reset values into existing answers (only reset specified scope)
      const finalAnswers =
        intent.scope === "all" ? resetAnswers : { ...state.step3Answers, ...resetAnswers };
      const finalMeta =
        intent.scope === "all" ? resetMeta : { ...state.step3AnswersMeta, ...resetMeta };

      // Clear defaults-applied tracking for reset scope
      let newDefaultsApplied = state.step3DefaultsAppliedParts;
      if (intent.scope === "all") {
        newDefaultsApplied = [];
      } else {
        newDefaultsApplied = state.step3DefaultsAppliedParts.filter(
          (p) => !p.includes((intent.scope as { partId: string }).partId)
        );
      }

      console.log(
        `[V7 FSM] Reset to defaults: scope=${JSON.stringify(intent.scope)}, fields=${Object.keys(resetAnswers).length}`
      );

      return {
        ...state,
        step3Answers: finalAnswers,
        step3AnswersMeta: finalMeta,
        step3DefaultsAppliedParts: newDefaultsApplied,
      };
    }

    case "SET_STEP3_COMPLETE":
      return { ...state, step3Complete: intent.complete };

    case "SUBMIT_STEP3_STARTED":
      return {
        ...state,
        isBusy: true,
        error: null,
        debug: {
          ...state.debug,
          lastAction: "SUBMIT_STEP3_STARTED",
          notes: ["Submitting Step 3 answers with retry logic"]
        }
      };

    case "SUBMIT_STEP3_SUCCESS":
      console.log("[V7 Reducer] SUBMIT_STEP3_SUCCESS → transitioning step='profile' to step='options'");
      return {
        ...state,
        isBusy: false,
        step3Complete: true,
        step: "options", // Step 3 → Step 4 Options (add-ons)
        // FIX (Feb 11, 2026): Push 'profile' to stepHistory so goBack from Options
        // correctly returns to profile instead of skipping over it
        stepHistory: state.stepHistory[state.stepHistory.length - 1] === "profile"
          ? state.stepHistory
          : [...state.stepHistory, "profile"],
        debug: {
          ...state.debug,
          lastAction: "SUBMIT_STEP3_SUCCESS",
          lastTransition: "profile → options (step3_complete)",
          notes: ["Step 3 submission successful, advanced to options step"]
        }
      };

    case "SUBMIT_STEP3_FAILED":
      return {
        ...state,
        isBusy: false,
        error: {
          code: "UNKNOWN",
          message: intent.error.message,
          detail: { retries: intent.error.retries }
        },
        debug: {
          ...state.debug,
          lastAction: "SUBMIT_STEP3_FAILED",
          notes: [`Step 3 submission failed after ${intent.error.retries || 0} retries: ${intent.error.message}`]
        }
      };

    // ============================================================
    // Step 3 FSM Events
    // ============================================================

    case "STEP3_TEMPLATE_REQUESTED":
      return {
        ...state,
        step3Status: "template_loading",
        debug: { ...state.debug, notes: [...state.debug.notes, "Template load requested"] },
      };

    case "STEP3_TEMPLATE_READY":
      return {
        ...state,
        step3Status: "template_ready",
        debug: {
          ...state.debug,
          notes: [...state.debug.notes, `Template ready: ${intent.templateId}`],
        },
      };

    case "STEP3_DEFAULTS_APPLIED": {
      const key = `${intent.templateId}.${intent.partId}`;
      // Guard: don't re-apply defaults for same template+part
      if (state.step3DefaultsAppliedParts.includes(key)) {
        console.log(`[V7 FSM] Defaults already applied for ${key}, skipping`);
        return state;
      }
      return {
        ...state,
        step3Status: "part_active",
        step3DefaultsAppliedParts: [...state.step3DefaultsAppliedParts, key],
        debug: { ...state.debug, notes: [...state.debug.notes, `Defaults applied: ${key}`] },
      };
    }

    case "STEP3_PART_NEXT": {
      // Guard: can only advance from part_active
      if (state.step3Status !== "part_active") {
        console.warn(`[V7 FSM] Cannot advance part from status: ${state.step3Status}`);
        return state;
      }
      return {
        ...state,
        step3PartIndex: state.step3PartIndex + 1,
        step3Status: "part_active", // Next part becomes active
      };
    }

    case "STEP3_PART_PREV": {
      if (state.step3PartIndex <= 0) return state;
      return {
        ...state,
        step3PartIndex: state.step3PartIndex - 1,
      };
    }

    case "STEP3_PART_SET":
      return {
        ...state,
        step3PartIndex: Math.max(0, intent.index),
      };

    case "STEP3_QUOTE_REQUESTED": {
      // Guard: can only request quote from part_active when on final part
      if (state.step3Status !== "part_active") {
        console.warn(`[V7 FSM] Cannot request quote from status: ${state.step3Status}`);
        return state;
      }
      return {
        ...state,
        step3Status: "quote_generating",
      };
    }

    case "STEP3_QUOTE_DONE":
      return {
        ...state,
        step3Status: "complete",
        step3Complete: true,
      };

    case "STEP3_ERROR":
      return {
        ...state,
        step3Status: "error",
        error: { code: "STATE", message: intent.message },
      };

    // ============================================================
    // Pricing FSM (Phase 6: non-blocking)
    // ============================================================

    case "PRICING_START":
      return {
        ...state,
        pricingStatus: "pending",
        pricingError: null,
        pricingWarnings: [],
        pricingRequestKey: intent.requestKey,
        debug: {
          ...state.debug,
          notes: [...state.debug.notes, `Pricing started: ${intent.requestKey.slice(0, 8)}`],
        },
      };

    case "PRICING_SUCCESS": {
      // STALE-WRITE GUARD: Only accept if requestKey matches current request
      if (state.pricingRequestKey !== intent.requestKey) {
        console.warn(
          `[V7 Pricing] Ignoring stale success: expected ${state.pricingRequestKey?.slice(0, 8)}, got ${intent.requestKey.slice(0, 8)}`
        );
        return {
          ...state,
          debug: {
            ...state.debug,
            notes: [
              ...state.debug.notes,
              `Pricing stale-write blocked: ${intent.requestKey.slice(0, 8)}`,
            ],
          },
        };
      }
      return {
        ...state,
        pricingStatus: "ok",
        pricingFreeze: intent.freeze,
        quote: intent.quote,
        pricingWarnings: intent.warnings,
        pricingError: null,
        pricingUpdatedAt: Date.now(),
        debug: {
          ...state.debug,
          notes: [
            ...state.debug.notes,
            `Pricing ok: ${intent.warnings.length} warnings (key: ${intent.requestKey.slice(0, 8)})`,
          ],
        },
      };
    }

    case "PRICING_ERROR": {
      // STALE-WRITE GUARD: Only accept if requestKey matches current request
      if (state.pricingRequestKey !== intent.requestKey) {
        console.warn(
          `[V7 Pricing] Ignoring stale error: expected ${state.pricingRequestKey?.slice(0, 8)}, got ${intent.requestKey.slice(0, 8)}`
        );
        return {
          ...state,
          debug: {
            ...state.debug,
            notes: [
              ...state.debug.notes,
              `Pricing stale-error blocked: ${intent.requestKey.slice(0, 8)}`,
            ],
          },
        };
      }

      // Detect timeout errors and use "timed_out" status
      const isTimeout =
        intent.error.toLowerCase().includes("timeout") ||
        intent.error.toLowerCase().includes("timed out") ||
        intent.error.toLowerCase().includes("exceeded");

      return {
        ...state,
        pricingStatus: isTimeout ? "timed_out" : "error",
        pricingError: intent.error,
        pricingUpdatedAt: Date.now(),
        debug: {
          ...state.debug,
          notes: [
            ...state.debug.notes,
            `Pricing ${isTimeout ? "timed_out" : "error"}: ${intent.error} (key: ${intent.requestKey.slice(0, 8)})`,
          ],
        },
      };
    }

    case "PRICING_RETRY":
      return {
        ...state,
        pricingStatus: "idle",
        pricingError: null,
        pricingWarnings: [],
        debug: { ...state.debug, notes: [...state.debug.notes, "Pricing retry requested"] },
      };

    case "SET_STEP4_ADDONS":
      return {
        ...state,
        step4AddOns: intent.addOns,
        debug: { ...state.debug, notes: [...state.debug.notes, "Step 4 add-ons updated"] },
      };

    // Legacy handlers (deprecated, use PRICING_* intents)
    case "SET_PRICING_FREEZE":
      return { ...state, pricingFreeze: intent.freeze };

    case "SET_QUOTE":
      return { ...state, quote: intent.quote };

    case "DEBUG_NOTE":
      return { ...state, debug: { ...state.debug, notes: [...state.debug.notes, intent.note] } };

    case "DEBUG_TAG":
      return {
        ...state,
        debug: {
          ...state.debug,
          lastAction: intent.lastAction ?? state.debug.lastAction,
          lastTransition: intent.lastTransition ?? state.debug.lastTransition,
          lastApi: intent.lastApi ?? state.debug.lastApi,
        },
      };

    default:
      return state;
  }
}

/* ============================================================
   Validators / Gates (SSOT)
============================================================ */

/**
 * Canonical ZIP normalization (single source of truth)
 *
 * Usage:
 * - Step 1 UI for validation
 * - stepCanProceed gate logic
 * - Intel fetch calls
 * - Anywhere ZIP is checked
 *
 * This prevents "ZIP value drift" between state.location.zip/postalCode/locationRawInput
 */
export function getNormalizedZip(state: WizardState): string {
  const raw =
    state.location?.postalCode ?? state.locationRawInput ?? "";
  return raw.replace(/\D/g, "").slice(0, 5);
}

/** Strip to exactly 5 digits (or fewer if input is short). */
function normalizeZip5(s: string): string {
  return (s ?? "").replace(/\D/g, "").slice(0, 5);
}

/** True when the string contains a valid US 5-digit ZIP. */
function isZip5(s: string): boolean {
  return normalizeZip5(s).length === 5;
}

function hasState(location: LocationCard | null): boolean {
  // your bug: "STATE never confirms"
  return !!location?.state && location.state.trim().length >= 2;
}

/**
 * ✅ FIX (Feb 5, 2026): ZIP is location. City/state are enrichment.
 * Returns true if we have a LocationCard OR a valid 5-digit ZIP.
 * Prevents "Location missing" when geocode hasn't resolved yet.
 */
function hasValidLocation(state: WizardState): boolean {
  if (state.location) return true;
  return getNormalizedZip(state).length >= 5;
}

/**
 * Basic ZIP prefix → state code lookup (synchronous, no DB needed).
 * Uses US Postal Service ZIP prefix assignment table.
 * This ensures buildMinimalLocationFromZip always returns a state when possible.
 */
function getStateFromZipPrefix(zip: string): string | undefined {
  const prefix = parseInt(zip.substring(0, 3), 10);
  if (isNaN(prefix)) return undefined;

  // US ZIP prefix ranges → state codes
  if (prefix >= 995 && prefix <= 999) return "AK";
  if (prefix >= 35 && prefix <= 36) return "AL";
  if (prefix >= 716 && prefix <= 729) return "AR";
  if (prefix >= 850 && prefix <= 865) return "AZ";
  if (prefix >= 900 && prefix <= 961) return "CA";
  if (prefix >= 800 && prefix <= 816) return "CO";
  if (prefix >= 60 && prefix <= 69) return "CT";
  if (prefix === 200 || prefix === 202 || (prefix >= 203 && prefix <= 205)) return "DC";
  if (prefix === 197 || prefix === 198 || prefix === 199) return "DE";
  if (prefix >= 320 && prefix <= 349) return "FL";
  if (prefix >= 300 && prefix <= 319 || prefix === 398 || prefix === 399) return "GA";
  if (prefix >= 967 && prefix <= 968) return "HI";
  if (prefix >= 500 && prefix <= 528) return "IA";
  if (prefix >= 832 && prefix <= 838) return "ID";
  if (prefix >= 600 && prefix <= 629) return "IL";
  if (prefix >= 460 && prefix <= 479) return "IN";
  if (prefix >= 660 && prefix <= 679) return "KS";
  if (prefix >= 400 && prefix <= 427) return "KY";
  if (prefix >= 700 && prefix <= 714) return "LA";
  if (prefix >= 10 && prefix <= 27) return "MA";
  if (prefix >= 206 && prefix <= 219) return "MD";
  if (prefix >= 39 && prefix <= 49) return "ME";
  if (prefix >= 480 && prefix <= 499) return "MI";
  if (prefix >= 550 && prefix <= 567) return "MN";
  if (prefix >= 630 && prefix <= 658) return "MO";
  if (prefix >= 386 && prefix <= 397) return "MS";
  if (prefix >= 590 && prefix <= 599) return "MT";
  if (prefix >= 270 && prefix <= 289) return "NC";
  if (prefix >= 580 && prefix <= 588) return "ND";
  if (prefix >= 680 && prefix <= 693) return "NE";
  if (prefix >= 30 && prefix <= 38) return "NH";
  if (prefix >= 70 && prefix <= 89) return "NJ";
  if (prefix >= 870 && prefix <= 884) return "NM";
  if (prefix >= 889 && prefix <= 898) return "NV";
  if (prefix >= 100 && prefix <= 149) return "NY";
  if (prefix >= 430 && prefix <= 459) return "OH";
  if (prefix >= 730 && prefix <= 749) return "OK";
  if (prefix >= 970 && prefix <= 979) return "OR";
  if (prefix >= 150 && prefix <= 196) return "PA";
  if (prefix >= 28 && prefix <= 29) return "RI";
  if (prefix >= 290 && prefix <= 299) return "SC";
  if (prefix >= 570 && prefix <= 577) return "SD";
  if (prefix >= 370 && prefix <= 385) return "TN";
  if (prefix >= 750 && prefix <= 799 || (prefix >= 885 && prefix <= 888)) return "TX";
  if (prefix >= 840 && prefix <= 847) return "UT";
  if (prefix >= 220 && prefix <= 246) return "VA";
  if (prefix >= 50 && prefix <= 59) return "VT";
  if (prefix >= 980 && prefix <= 994) return "WA";
  if (prefix >= 530 && prefix <= 549) return "WI";
  if (prefix >= 247 && prefix <= 268) return "WV";
  if (prefix >= 820 && prefix <= 831) return "WY";

  return undefined;
}

/**
 * Build a minimal LocationCard from ZIP when geocode hasn't resolved.
 * ✅ FIX Feb 2026: Now includes state code from ZIP prefix lookup.
 * Downstream services accept this gracefully (city optional, state preferred).
 */
function buildMinimalLocationFromZip(state: WizardState): LocationCard | null {
  const zip = getNormalizedZip(state);
  if (zip.length < 5) return null;

  // Synchronous state lookup from ZIP prefix (no DB, no async)
  const stateCode = getStateFromZipPrefix(zip);
  const city: string | undefined = undefined; // City requires geocoding

  return {
    formattedAddress: zip,
    postalCode: zip,
    city,
    state: stateCode,
    countryCode: "US",
  };
}

function stepCanProceed(state: WizardState, step: WizardStep): { ok: boolean; reason?: string } {
  if (step === "location") {
    // Check for valid ZIP (5+ digits) OR location object with address
    // Business name and address are OPTIONAL - ZIP alone is sufficient
    const normalizedZip = getNormalizedZip(state);

    // Valid ZIP is always sufficient (5+ digits for US, 3+ for international)
    if (normalizedZip.length >= 5) {
      return { ok: true };
    }

    // Also allow if location resolved (from address lookup) even without ZIP
    if (state.location?.formattedAddress) {
      return { ok: true };
    }

    return { ok: false, reason: "Please enter a valid ZIP/postal code." };
  }
  if (step === "industry") {
    // ✅ FIX (Feb 5, 2026): ZIP is location — don't require geocoded LocationCard
    if (!hasValidLocation(state)) return { ok: false, reason: "ZIP code missing." };
    if (state.industry === "auto")
      return { ok: false, reason: "Industry not selected or inferred." };
    return { ok: true };
  }
  if (step === "profile") {
    // ✅ FIX (Feb 5, 2026): ZIP is location — don't require geocoded LocationCard
    if (!hasValidLocation(state)) return { ok: false, reason: "ZIP code missing." };
    if (state.industry === "auto") return { ok: false, reason: "Industry missing." };
    if (!state.step3Template) return { ok: false, reason: "Step 3 template missing." };
    return { ok: true };
  }
  if (step === "results") {
    // Phase 6: Only require step3Complete. Pricing is non-blocking.
    // Results page will show spinner/banner based on pricingStatus.
    if (!state.step3Complete) return { ok: false, reason: "Step 3 incomplete." };
    return { ok: true };
  }
  if (step === "options") {
    // Options step requires profile to be complete
    if (!state.step3Complete) return { ok: false, reason: "Step 3 incomplete." };
    return { ok: true };
  }
  if (step === "magicfit") {
    // MagicFit requires options step visited (step3Complete is sufficient)
    if (!state.step3Complete) return { ok: false, reason: "Step 3 incomplete." };
    return { ok: true };
  }
  return { ok: false, reason: "Unknown step." };
}

/* ============================================================
   Hook
============================================================ */

export function useWizardV7() {
  const [state, dispatch] = useReducer(reduce, undefined, initialState);

  // Abort controllers for side-effects
  const abortRef = useRef<AbortController | null>(null);

  const abortOngoing = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const setBusy = useCallback((isBusy: boolean, busyLabel?: string) => {
    dispatch({ type: "SET_BUSY", isBusy, busyLabel });
  }, []);

  const setError = useCallback((err: unknown) => {
    const normalized: WizardError = normalizeError(err);
    dispatch({ type: "SET_ERROR", error: normalized });
  }, []);

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  /* ----------------------------
     Hydration (localStorage)
     
     ✅ FRESH START CONTRACT (Feb 2, 2026):
     - Default /wizard ALWAYS starts fresh at Step 1
     - Only ?resume=1 allows hydrating from localStorage
     - This prevents "landing on step 3" bug
  ---------------------------- */
  useEffect(() => {
    dispatch({ type: "HYDRATE_START" });

    // ✅ FRESH START CHECK: Only hydrate if ?resume=1 is explicitly set
    const params = new URLSearchParams(window.location.search);
    const allowResume = params.get("resume") === "1";

    if (!allowResume) {
      // ✅ IMPORTANT: In dev, Vite HMR remounts this component.
      // We must only clear storage ONCE per tab session, or confirmations will keep resetting.
      // But we NEVER hydrate from LS without ?resume=1 (fresh start contract).
      const didFreshStartKey = "v7_fresh_start_done";
      const alreadyFreshStarted = sessionStorage.getItem(didFreshStartKey) === "1";

      if (!alreadyFreshStarted) {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.setItem(didFreshStartKey, "1");
        if (import.meta.env.DEV) {
          console.log("[V7 SSOT] Fresh start (once per tab) — cleared storage, starting at location");
        }
      } else {
        if (import.meta.env.DEV) {
          console.log("[V7 SSOT] Fresh start skipped (HMR remount) — keeping current storage, NOT hydrating");
        }
        // ✅ CONTRACT: Do NOT read from LS here. The persist effect writes to LS
        // on every state change, so in-memory state is already correct.
        // We just skip the destructive removeItem to preserve it across HMR.
      }

      dispatch({ type: "HYDRATE_SUCCESS", payload: {} });
      return;
    }

    // Resume mode: hydrate from localStorage
    const saved = safeJsonParse<Partial<WizardState>>(localStorage.getItem(STORAGE_KEY));
    if (!saved) {
      dispatch({ type: "HYDRATE_SUCCESS", payload: {} });
      return;
    }

    // Minimal safety: ignore if schema mismatch
    if ((saved as { schemaVersion?: string }).schemaVersion !== "7.0.0") {
      dispatch({ type: "HYDRATE_SUCCESS", payload: {} });
      return;
    }

    // ✅ FIX: Clear draft fields if business is not confirmed
    // This prevents "WOW Car Wash" from reappearing after refresh
    const safePayload: Partial<WizardState> = {
      ...saved,
      isHydrating: false,
      isBusy: false,
      busyLabel: undefined,
      error: null,
    };

    // ✅ Critical: If business NOT confirmed, clear draft search fields
    if (!safePayload.businessConfirmed) {
      safePayload.businessDraft = { name: "", address: "" };
      safePayload.business = null;
      safePayload.businessCard = null;
    }

    // ✅ FIX Jan 31: Reset to step 1 if location is missing (prevents landing on step 2+ without data)
    if (!safePayload.location && safePayload.step !== "location") {
      safePayload.step = "location";
      safePayload.stepHistory = ["location"];
    }

    // ✅ FIX Jan 31: Also reset if on industry step but no business confirmed and no industry locked
    // This prevents landing on step 2 after a partial session
    if (
      safePayload.step === "industry" &&
      !safePayload.businessConfirmed &&
      !safePayload.industryLocked
    ) {
      console.log("[V7 SSOT] Resetting to location - incomplete session detected");
      safePayload.step = "location";
      safePayload.stepHistory = ["location"];
    }

    if (import.meta.env.DEV) {
      console.log("[V7 SSOT] Resume mode - hydrated state, step:", safePayload.step);
    }

    dispatch({ type: "HYDRATE_SUCCESS", payload: safePayload });
  }, []);

  /* ----------------------------
     Persist
  ---------------------------- */
  useEffect(() => {
    if (state.isHydrating) return;

    // persist only stable state (no transient flags)
    // ✅ CRITICAL: Only persist draft fields if businessConfirmed === true
    const safeBusinessDraft = state.businessConfirmed
      ? state.businessDraft
      : { name: "", address: "" };

    const safeBusiness = state.businessConfirmed ? state.business : null;
    const safeBusinessCard = state.businessConfirmed ? state.businessCard : null;

    const persist: Partial<WizardState> = {
      schemaVersion: state.schemaVersion,
      sessionId: state.sessionId,
      step: state.step,
      stepHistory: state.stepHistory,

      // Location is always persisted (ZIP should survive)
      locationRawInput: state.locationRawInput,
      location: state.location,
      locationIntel: state.locationIntel,
      locationConfirmed: state.locationConfirmed,

      // ✅ Business draft only persists if confirmed
      businessDraft: safeBusinessDraft,
      business: safeBusiness,
      businessCard: safeBusinessCard,
      businessConfirmed: state.businessConfirmed,

      industry: state.industry,
      industryLocked: state.industryLocked,

      step3Template: state.step3Template,
      step3Answers: state.step3Answers,
      step3AnswersMeta: state.step3AnswersMeta, // Persist provenance
      step3Complete: state.step3Complete,
      // Persist FSM state
      step3Status: state.step3Status,
      step3PartIndex: state.step3PartIndex,
      step3DefaultsAppliedParts: state.step3DefaultsAppliedParts,

      pricingFreeze: state.pricingFreeze,
      quote: state.quote,

      debug: state.debug,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    } catch {
      // ignore storage failures
    }
  }, [
    state.isHydrating,
    state.schemaVersion,
    state.sessionId,
    state.step,
    state.stepHistory,
    state.locationRawInput,
    state.location,
    state.locationIntel,
    state.locationConfirmed,
    state.businessDraft,
    state.business,
    state.businessCard,
    state.businessConfirmed,
    state.industry,
    state.industryLocked,
    state.step3Template,
    state.step3Answers,
    state.step3AnswersMeta, // Track provenance changes
    state.step3Complete,
    state.step3Status, // FSM state
    state.step3PartIndex, // FSM part index
    state.step3DefaultsAppliedParts, // FSM defaults tracking
    state.pricingFreeze,
    state.quote,
    state.debug,
  ]);

  /* ----------------------------
     ZIP divergence → auto-unconfirm
     Covers programmatic / rehydration ZIP changes that bypass onChange.

     Two-phase design prevents flicker loops:
       Phase 1: Snapshot ONLY on the false→true transition of locationConfirmed
       Phase 2: Unconfirm if locationRawInput diverges from snapshot
     The snapshot must NOT update on every rawInput change while confirmed,
     otherwise it would chase the user's keystrokes and never detect divergence.
  ---------------------------- */
  const confirmedZipRef = useRef<string>("");
  const wasConfirmedRef = useRef<boolean>(false);

  // Phase 1: Snapshot ZIP on the exact moment confirmation transitions false→true
  useEffect(() => {
    if (state.locationConfirmed && !wasConfirmedRef.current) {
      // false→true transition: lock in the confirmed ZIP
      confirmedZipRef.current = normalizeZip5(state.locationRawInput ?? "");
      if (import.meta.env.DEV) {
        console.log(`[V7 SSOT] ZIP confirmed — snapshot locked: "${confirmedZipRef.current}"`);
      }
    }
    wasConfirmedRef.current = state.locationConfirmed;
  }, [state.locationConfirmed, state.locationRawInput]);

  // Phase 2: If the raw ZIP diverges from the locked snapshot, unconfirm
  useEffect(() => {
    if (!state.locationConfirmed) return;
    if (!confirmedZipRef.current) return; // no snapshot yet (shouldn't happen)
    const currentZip = normalizeZip5(state.locationRawInput ?? "");
    if (currentZip !== confirmedZipRef.current) {
      dispatch({ type: "SET_LOCATION_CONFIRMED", confirmed: false });
      if (import.meta.env.DEV) {
        console.log(
          `[V7 SSOT] ZIP diverged ("${confirmedZipRef.current}" → "${currentZip}") — auto-unconfirmed`
        );
      }
    }
  }, [state.locationRawInput]); // ← intentionally ONLY watches rawInput, not locationConfirmed

  /* ============================================================
     Public Actions (UI calls these)
  ============================================================ */

  const resetSession = useCallback(() => {
    abortOngoing();
    const newId = createSessionId();
    localStorage.removeItem(STORAGE_KEY);
    // Also clear the fresh-start latch so next visit starts clean
    sessionStorage.removeItem("v7_fresh_start_done");
    dispatch({ type: "RESET_SESSION", sessionId: newId });
  }, [abortOngoing]);

  const setStep = useCallback((step: WizardStep, reason?: string) => {
    dispatch({ type: "SET_STEP", step, reason });
    dispatch({ type: "PUSH_HISTORY", step });

    // ✅ MERLIN MEMORY (Feb 11, 2026): Track step transitions
    const now = Date.now();
    const session = merlinMemory.get("session");
    if (session) {
      // Close previous step's exit time
      const history = [...session.stepHistory];
      if (history.length > 0 && !history[history.length - 1].exitedAt) {
        history[history.length - 1] = { ...history[history.length - 1], exitedAt: now };
      }
      // Add new step entry
      history.push({ step, enteredAt: now });
      merlinMemory.patch("session", {
        stepHistory: history,
        totalStepsCompleted: Math.max(session.totalStepsCompleted, history.filter(h => h.exitedAt).length),
        lastActiveAt: now,
      });
    } else {
      // First step — initialize session
      merlinMemory.set("session", {
        startedAt: now,
        stepHistory: [{ step, enteredAt: now }],
        totalStepsCompleted: 0,
        quoteGenerations: 0,
        addOnChanges: 0,
        lastActiveAt: now,
      });
    }
  }, []);

  const goBack = useCallback(() => {
    const hist = state.stepHistory;
    if (hist.length <= 1) return;
    const prev = hist[hist.length - 2];
    // do not mutate history here; just step back (history remains a trace)
    setStep(prev, "back");
  }, [state.stepHistory, setStep]);

  // Step 1: location input typing
  const updateLocationRaw = useCallback((value: string) => {
    dispatch({ type: "SET_LOCATION_RAW", value });
  }, []);

  /**
   * confirmLocation - User confirms their location (ZIP resolved)
   * @param value - true = confirmed, false = reset
   */
  const confirmLocation = useCallback((value: boolean) => {
    dispatch({ type: "SET_LOCATION_CONFIRMED", confirmed: value });
    dispatch({ type: "DEBUG_NOTE", note: `Location ${value ? "confirmed" : "reset"} by user` });
  }, []);

  /**
   * setGoals - Set all goals at once
   */
  const setGoals = useCallback((goals: EnergyGoal[]) => {
    dispatch({ type: "SET_GOALS", goals });
  }, []);

  /**
   * toggleGoal - Toggle a single goal on/off
   */
  const toggleGoal = useCallback((goal: EnergyGoal) => {
    dispatch({ type: "TOGGLE_GOAL", goal });
  }, []);

  /**
   * confirmGoals - User confirms goals selection (or skips)
   */
  const confirmGoals = useCallback((value: boolean) => {
    dispatch({ type: "SET_GOALS_CONFIRMED", confirmed: value });
    dispatch({ type: "DEBUG_NOTE", note: `Goals ${value ? "confirmed" : "skipped"} by user` });

    // ✅ MERLIN MEMORY (Feb 11, 2026): Persist goals
    if (value) {
      merlinMemory.set("goals", {
        selected: state.goals,
        confirmedAt: Date.now(),
      });
    }
  }, [state.goals]);

  /**
   * toggleSolar - Toggle solar add-on
   */
  const toggleSolar = useCallback(() => {
    dispatch({ type: "TOGGLE_SOLAR" });
  }, []);

  /**
   * toggleGenerator - Toggle generator add-on
   */
  const toggleGenerator = useCallback(() => {
    dispatch({ type: "TOGGLE_GENERATOR" });
  }, []);

  /**
   * toggleEV - Toggle EV charging add-on
   */
  const toggleEV = useCallback(() => {
    dispatch({ type: "TOGGLE_EV" });
  }, []);

  /**
   * confirmAddOns - User confirms add-ons selection (or skips)
   */
  const confirmAddOns = useCallback((value: boolean) => {
    dispatch({ type: "SET_ADDONS_CONFIRMED", confirmed: value });
    dispatch({ type: "DEBUG_NOTE", note: `Add-ons ${value ? "confirmed" : "skipped"} by user` });
  }, []);

  /**
   * setBusinessDraft - Update draft business fields (name/address)
   * This is ephemeral input that should NOT persist unless confirmed.
   */
  const setBusinessDraft = useCallback((patch: Partial<{ name: string; address: string }>) => {
    dispatch({ type: "SET_BUSINESS_DRAFT", patch });
  }, []);

  /**
   * primeLocationIntel - SINGLE SOURCE OF TRUTH for location enrichment
   *
   * ✅ UNIFIED (Feb 7, 2026): Both debounced typing AND submitLocation use this function.
   * - Fires 3 parallel fetches (utility, solar, weather)
   * - Dispatches PATCH_LOCATION_INTEL as each resolves (progressive UI hydration)
   * - Returns the assembled Partial<LocationIntel> so callers can use it immediately
   *   (without waiting for React state to propagate)
   *
   * @param zipOrInput - ZIP code or raw input string
   * @returns Partial<LocationIntel> with whatever data was successfully fetched
   */
  const primeLocationIntel = useCallback(async (zipOrInput: string): Promise<Partial<LocationIntel>> => {
    const input = zipOrInput.trim();
    if (!input || input.length < 3) return {};

    dispatch({ type: "DEBUG_TAG", lastAction: "primeLocationIntel" });

    // Set all to fetching (progressive UI feedback)
    dispatch({
      type: "PATCH_LOCATION_INTEL",
      patch: {
        utilityStatus: "fetching",
        solarStatus: "fetching",
        weatherStatus: "fetching",
        utilityError: undefined,
        solarError: undefined,
        weatherError: undefined,
      },
    });

    // Fire all 3 in parallel with Promise.allSettled (fail-soft per service)
    const [utilityRes, solarRes, weatherRes] = await Promise.allSettled([
      api.fetchUtility(input),
      api.fetchSolar(input),
      api.fetchWeather(input),
    ]);

    // Assemble the intel object from settled results
    const intel: Partial<LocationIntel> = { updatedAt: Date.now() };

    if (utilityRes.status === "fulfilled") {
      intel.utilityRate = utilityRes.value.rate;
      intel.demandCharge = utilityRes.value.demandCharge;
      intel.utilityProvider = utilityRes.value.provider;
      intel.utilityStatus = "ready";
    } else {
      intel.utilityStatus = "error";
      intel.utilityError = String(utilityRes.reason?.message ?? utilityRes.reason);
    }

    if (solarRes.status === "fulfilled") {
      intel.peakSunHours = solarRes.value.peakSunHours;
      intel.solarGrade = solarRes.value.grade;
      intel.solarStatus = "ready";
    } else {
      intel.solarStatus = "error";
      intel.solarError = String(solarRes.reason?.message ?? solarRes.reason);
    }

    if (weatherRes.status === "fulfilled") {
      intel.weatherRisk = weatherRes.value.risk;
      intel.weatherProfile = weatherRes.value.profile;
      intel.weatherStatus = "ready";
    } else {
      intel.weatherStatus = "error";
      intel.weatherError = String(weatherRes.reason?.message ?? weatherRes.reason);
    }

    // Dispatch final merged state (one atomic patch with all results)
    dispatch({ type: "PATCH_LOCATION_INTEL", patch: intel });

    // ✅ MERLIN MEMORY (Feb 11, 2026): Persist weather data
    if (weatherRes.status === "fulfilled" && (weatherRes.value.risk || weatherRes.value.profile)) {
      // Lazy-import the full weather data to get HDD/CDD if available
      merlinMemory.set("weather", {
        profile: weatherRes.value.profile,
        extremes: weatherRes.value.risk,
        source: "cache",
        fetchedAt: Date.now(),
      });
    }

    // ✅ MERLIN MEMORY (Feb 11, 2026): Persist solar resource data
    if (solarRes.status === "fulfilled" && solarRes.value.peakSunHours) {
      merlinMemory.set("solar", {
        peakSunHours: solarRes.value.peakSunHours,
        grade: solarRes.value.grade,
        // Derive capacity factor from peak sun hours (PSH / 24)
        capacityFactor: solarRes.value.peakSunHours ? solarRes.value.peakSunHours / 24 : undefined,
        source: "regional-estimate",
        fetchedAt: Date.now(),
      });
    }

    // ✅ MERLIN MEMORY: Also patch location with utility rates
    if (intel.utilityRate != null || intel.demandCharge != null) {
      merlinMemory.patch("location", {
        utilityRate: intel.utilityRate,
        demandCharge: intel.demandCharge,
        peakSunHours: intel.peakSunHours,
      });
    }

    if (import.meta.env.DEV) {
      const ready = [intel.utilityStatus, intel.solarStatus, intel.weatherStatus].filter(s => s === "ready").length;
      console.log(`[V7 SSOT] primeLocationIntel complete: ${ready}/3 services ready for "${input}"`);
    }

    return intel;
  }, []);

  // Step 1: submit location (SSOT validates + populates intel)
  // ✅ FIX Jan 31: Accept businessInfo directly from Step1 (not stale state.businessDraft)
  const submitLocation = useCallback(
    async (rawInput?: string, businessInfo?: { name?: string; address?: string }) => {
      clearError();
      abortOngoing();

      const input = (rawInput ?? state.locationRawInput).trim();
      if (import.meta.env.DEV) {
        console.log("[V7] submitLocation called", { rawInput, stateRaw: state.locationRawInput, input });
      }
      dispatch({ type: "DEBUG_TAG", lastAction: "submitLocation" });

      const normalizedZip = normalizeZip5(input);

      // ✅ GUARD: Prevent double-submit loop when already confirmed for same ZIP
      if (
        state.locationConfirmed &&
        normalizedZip &&
        state.location?.postalCode === normalizedZip &&
        state.step !== "location"
      ) {
        if (import.meta.env.DEV) {
          console.log("[V7] submitLocation: Already confirmed for this ZIP, skipping re-submit");
        }
        return;
      }

      if (!input) {
        setError({ code: "VALIDATION", message: "Please enter an address or business name." });
        return;
      }

      // ✅ CONFIRMATION DOCTRINE (Feb 10): confirmation is a USER intent state
      // - If user clicked Continue and we can derive a ZIP5, confirm immediately
      // - Resolve/prime are best-effort and MUST NOT clear confirmation
      const canConfirm = normalizedZip.length === 5;
      if (canConfirm) {
        dispatch({ type: "SET_LOCATION_CONFIRMED", confirmed: true });
        if (import.meta.env.DEV) {
          console.log("[V7 SSOT] Location confirmed by user (Continue clicked)", { zip: normalizedZip });
        }
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setBusy(true, "Resolving location...");
        dispatch({ type: "DEBUG_TAG", lastApi: "resolveLocation" });

        let location: LocationCard;

        try {
          location = await api.resolveLocation(input, controller.signal);
        } catch (resolveErr) {
          // ✅ Non-blocking fallback: proceed with ZIP-only location card
          console.warn("[V7 SSOT] resolveLocation failed, using ZIP fallback:", resolveErr);
          const minCard = buildMinimalLocationFromZip(state);
          if (!minCard) throw resolveErr;

          location = minCard;
          dispatch({
            type: "DEBUG_NOTE",
            note: `Geocode failed — using ZIP-only location (${minCard.postalCode})`,
          });

          // ✅ IMPORTANT: do NOT clear confirmation here (keep user intent)
          dispatch({ type: "SET_LOCATION", location: minCard });
        }

        // ✅ FIX Feb 7, 2026: Guarantee postalCode is populated when input is a ZIP.
        // Many geocoders return lat/lng + formattedAddress but omit postalCode for ZIP lookups.
        const zip5 = normalizeZip5(input);
        if (isZip5(input) && !location.postalCode) {
          location = { ...location, postalCode: zip5 };
          dispatch({
            type: "DEBUG_NOTE",
            note: `Resolved location missing postalCode; injected ZIP ${zip5} from raw input`,
          });
        }

        // Also inject state from ZIP prefix if geocoder didn't return it
        if (!hasState(location) && isZip5(input)) {
          const stateFromZip = getStateFromZipPrefix(zip5);
          if (stateFromZip) {
            location = { ...location, state: stateFromZip };
            dispatch({
              type: "DEBUG_NOTE",
              note: `Resolved location missing state; injected ${stateFromZip} from ZIP prefix`,
            });
          }
        }

        // SSOT: allow location but note missing state if expected
        if (!hasState(location)) {
          dispatch({
            type: "DEBUG_NOTE",
            note: "Location resolved but state missing. Ensure geocoder returns state for US addresses.",
          });
        }

        dispatch({ type: "SET_LOCATION", location });

        // ✅ FIX Jan 31: Use businessInfo passed directly (not stale state.businessDraft)
        // Create businessCard when business name is provided
        const businessName = businessInfo?.name?.trim();
        const businessAddress = businessInfo?.address?.trim();
        const hasBusiness = !!businessName || !!businessAddress;

        let newBusinessCard: BusinessCard | null = null;
        if (hasBusiness) {
          newBusinessCard = {
            name: businessName || undefined,
            address: businessAddress || undefined,
            formattedAddress: location.formattedAddress,
            city: location.city,
            stateCode: location.state,
            postal: location.postalCode,
            lat: location.lat,
            lng: location.lng,
            placeId: location.placeId,
            resolvedAt: Date.now(),
          };
          dispatch({ type: "SET_BUSINESS_CARD", card: newBusinessCard });
          dispatch({ type: "SET_BUSINESS_CONFIRMED", confirmed: true }); // ✅ Auto-confirm (Feb 12): no friction gate
          dispatch({
            type: "DEBUG_NOTE",
            note: `Business card created + auto-confirmed: ${newBusinessCard.name || newBusinessCard.address}`,
          });
        }

        // ✅ UNIFIED ENRICHMENT (Feb 7, 2026): Use primeLocationIntel — SINGLE path
        // primeLocationIntel dispatches progressive PATCH_LOCATION_INTEL AND returns the intel.
        // We await it so we have LOCAL intel for buildIntelPatch (no stale state reads).
        setBusy(true, "Fetching location intelligence...");
        dispatch({ type: "DEBUG_TAG", lastApi: "primeLocationIntel" });
        const zip = normalizeZip5(location.postalCode || input);
        let intel: Partial<LocationIntel> = {};
        try {
          intel = await primeLocationIntel(zip || input);

          // ✅ RUNTIME PROBE (Feb 7, 2026): Log exactly what came back so we can tell
          // if the problem is in the enrichment pipeline vs upstream services
          if (import.meta.env.DEV) {
            const definedKeys = Object.keys(intel).filter(
              (k) => (intel as Record<string, unknown>)[k] !== undefined
            );
            console.log(
              `[V7 Step1] submitLocation intel keys: [${definedKeys.join(", ")}]`,
              `| utilityRate=${intel.utilityRate} | peakSunHours=${intel.peakSunHours} | solarGrade=${intel.solarGrade} | weatherRisk=${intel.weatherRisk}`
            );
          }
        } catch (enrichErr) {
          // Enrichment failure is NEVER fatal — proceed with empty intel
          console.warn("[V7 Step1] primeLocationIntel failed (non-blocking):", enrichErr);
          dispatch({
            type: "DEBUG_NOTE",
            note: `Location intel failed (non-blocking): ${(enrichErr as { message?: string })?.message ?? enrichErr}`,
          });
        }

        // ✅ NOTE: locationConfirmed was already set to true at the start of submitLocation
        // Intel failures (if any) are shown as status banners, not blockers

        // ✅ MERLIN MEMORY (Feb 11, 2026): Persist location for downstream steps
        merlinMemory.set("location", {
          zip: location.postalCode || normalizedZip,
          state: location.state,
          city: location.city,
          lat: location.lat,
          lng: location.lng,
          formattedAddress: location.formattedAddress,
          utilityRate: (intel as Record<string, unknown>).utilityRate as number | undefined,
          demandCharge: (intel as Record<string, unknown>).demandCharge as number | undefined,
          peakSunHours: (intel as Record<string, unknown>).peakSunHours as number | undefined,
        });
        if (newBusinessCard) {
          merlinMemory.set("business", {
            name: newBusinessCard.name,
            address: newBusinessCard.address,
            placeId: newBusinessCard.placeId,
          });
        }

        // ✅ FIX Feb 12: Business is auto-confirmed on creation (no confirm gate).
        // If we created a business card, run industry inference before stopping for goals.
        if (newBusinessCard) {
          try {
            setBusy(true, "Inferring industry...");
            dispatch({ type: "DEBUG_TAG", lastApi: "inferIndustry" });
            const inferred = await api.inferIndustry(location, controller.signal, newBusinessCard);

            if (inferred.industry !== "auto" && inferred.confidence >= 0.85) {
              dispatch({ type: "SET_INDUSTRY", industry: inferred.industry, locked: true });
              dispatch({
                type: "DEBUG_NOTE",
                note: `Industry inferred from business: ${inferred.industry} (locked)`,
              });

              merlinMemory.set("industry", {
                slug: inferred.industry,
                inferred: true,
                confidence: inferred.confidence,
              });

              // Preload step 3 template immediately
              setBusy(true, "Loading profile template...");
              dispatch({ type: "DEBUG_TAG", lastApi: "loadStep3Template" });
              const template = await api.loadStep3Template(inferred.industry, controller.signal);
              dispatch({ type: "SET_STEP3_TEMPLATE", template });
              dispatch({
                type: "SET_TEMPLATE_MODE",
                mode: (template.industry as string) === "generic" ? "fallback" : "industry",
              });

              const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
              dispatch({
                type: "SET_STEP3_ANSWERS",
                answers: baselineAnswers,
                source: "template_default",
              });

              const intelPatch = api.buildIntelPatch(intel as LocationIntel);
              if (Object.keys(intelPatch).length > 0) {
                dispatch({ type: "PATCH_STEP3_ANSWERS", patch: intelPatch, source: "location_intel" });
              }

              const businessPatch = api.buildBusinessPatch(newBusinessCard);
              if (Object.keys(businessPatch).length > 0) {
                dispatch({ type: "PATCH_STEP3_ANSWERS", patch: businessPatch, source: "business_detection" });
              }
            } else {
              dispatch({ type: "SET_INDUSTRY", industry: "auto", locked: false });
            }
          } catch (inferErr) {
            console.warn("[V7] Industry inference failed (non-blocking):", inferErr);
            dispatch({ type: "SET_INDUSTRY", industry: "auto", locked: false });
          }
        }

        // ✅ GOALS MODAL CHECK (Feb 10, 2026)
        // Location is now confirmed - check if goals modal should show
        // If goals not yet confirmed, stop here - UI will show goals modal via useEffect
        if (!state.goalsConfirmed) {
          dispatch({
            type: "DEBUG_NOTE",
            note: "Location confirmed - waiting for goals selection",
          });
          setBusy(false);
          abortRef.current = null;
          return;
        }

        // ✅ FIX Feb 10: Goals already confirmed - proceed to industry inference
        // NOTE: Step transition happens in SET_GOALS_CONFIRMED reducer, not here

        // Goals already confirmed - proceed to industry inference
        setBusy(true, "Inferring industry...");
        dispatch({ type: "DEBUG_TAG", lastApi: "inferIndustry" });
        const inferred = await api.inferIndustry(location, controller.signal);

        if (inferred.industry !== "auto" && inferred.confidence >= 0.85) {
          dispatch({ type: "SET_INDUSTRY", industry: inferred.industry, locked: true });
          dispatch({
            type: "DEBUG_NOTE",
            note: `Industry inferred: ${inferred.industry} (locked)`,
          });

          // ✅ MERLIN MEMORY (Feb 11, 2026): Persist auto-inferred industry
          merlinMemory.set("industry", {
            slug: inferred.industry,
            inferred: true,
            confidence: inferred.confidence,
          });
          
          // ❌ REMOVED (Feb 10, 2026): Do NOT auto-confirm goals
          // Goals modal MUST show to user even when business inference succeeds
          // User expects to see and confirm their energy goals before proceeding to Step 3

          // Preload step 3 template immediately
          setBusy(true, "Loading profile template...");
          dispatch({ type: "DEBUG_TAG", lastApi: "loadStep3Template" });
          const template = await api.loadStep3Template(inferred.industry, controller.signal);
          dispatch({ type: "SET_STEP3_TEMPLATE", template });
          dispatch({
            type: "SET_TEMPLATE_MODE",
            mode: (template.industry as string) === "generic" ? "fallback" : "industry",
          });

          // ✅ PROVENANCE: Apply baseline defaults (template + question defaults)
          const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
          dispatch({
            type: "SET_STEP3_ANSWERS",
            answers: baselineAnswers,
            source: "template_default",
          });

          // ✅ PROVENANCE: Apply intel patches using LOCAL intel (not stale state.locationIntel)
          const intelPatch = api.buildIntelPatch(intel as LocationIntel);
          if (Object.keys(intelPatch).length > 0) {
            dispatch({ type: "PATCH_STEP3_ANSWERS", patch: intelPatch, source: "location_intel" });
          }

          // ✅ FIX Feb 11: Goals already confirmed — advance to profile (skip industry, it's locked)
          console.log("[V7 SSOT] Business + industry inferred + goals confirmed → profile");
          setStep("profile", "industry_locked_goals_confirmed");
        } else {
          dispatch({ type: "SET_INDUSTRY", industry: "auto", locked: false });
          setStep("industry", "needs_industry");
        }
      } catch (err: unknown) {
        if (isAbort(err)) {
          setError({ code: "ABORTED", message: "Request cancelled." });
        } else {
          setError(err);
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primeLocationIntel is stable (empty deps)
    [abortOngoing, clearError, setError, setBusy, setStep, state.locationRawInput, primeLocationIntel]
  );

  /**
   * skipBusiness - User skips/dismisses the detected business card
   * Clears the business card AND draft, then proceeds based on remaining sub-gates
   */
  const skipBusiness = useCallback(() => {
    // ✅ FIX Jan 31: Clear businessDraft to prevent stale draft persisting
    dispatch({ type: "SET_BUSINESS_DRAFT", patch: { name: "", address: "" } });
    dispatch({ type: "SET_BUSINESS_CARD", card: null });
    dispatch({ type: "SET_BUSINESS_CONFIRMED", confirmed: true }); // Mark as "handled" even if skipped
    dispatch({ type: "DEBUG_NOTE", note: "Business skipped by user - draft cleared" });
    dispatch({ type: "SET_INDUSTRY", industry: "auto", locked: false });
    
    // ✅ FIX Feb 11: Don't jump to industry if goals aren't confirmed yet
    // Stay on location so the goals modal can render
    if (!state.goalsConfirmed) {
      dispatch({ type: "DEBUG_NOTE", note: "Business skipped - staying on location for goals modal" });
      // Goals modal useEffect will fire now that businessPending is cleared
      return;
    }
    setStep("industry", "business_skipped");
  }, [setStep, state.goalsConfirmed]);

  /**
   * confirmBusiness - User confirms or skips the detected business card
   * @param value - true = confirm business, false = skip (delegates to skipBusiness)
   */
  const confirmBusiness = useCallback(
    async (value: boolean) => {
      // If false, delegate to skipBusiness and return early
      if (!value) {
        skipBusiness();
        return;
      }

      dispatch({ type: "SET_BUSINESS_CONFIRMED", confirmed: true });
      dispatch({ type: "DEBUG_NOTE", note: "Business confirmed by user" });

      // Now proceed to industry selection/inference
      if (!state.location) {
        setError({ code: "VALIDATION", message: "No location set." });
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setBusy(true, "Inferring industry...");
        dispatch({ type: "DEBUG_TAG", lastApi: "inferIndustry" });
        const inferred = await api.inferIndustry(
          state.location,
          controller.signal,
          state.businessCard
        );

        if (inferred.industry !== "auto" && inferred.confidence >= 0.85) {
          dispatch({ type: "SET_INDUSTRY", industry: inferred.industry, locked: true });
          dispatch({
            type: "DEBUG_NOTE",
            note: `Industry inferred: ${inferred.industry} (locked)`,
          });

          // ✅ MERLIN MEMORY (Feb 11, 2026): Persist business-inferred industry
          merlinMemory.set("industry", {
            slug: inferred.industry,
            inferred: true,
            confidence: inferred.confidence,
          });

          // Preload step 3 template immediately
          setBusy(true, "Loading profile template...");
          dispatch({ type: "DEBUG_TAG", lastApi: "loadStep3Template" });
          const template = await api.loadStep3Template(inferred.industry, controller.signal);
          dispatch({ type: "SET_STEP3_TEMPLATE", template });
          dispatch({
            type: "SET_TEMPLATE_MODE",
            mode: (template.industry as string) === "generic" ? "fallback" : "industry",
          });

          // ✅ PROVENANCE: Apply baseline defaults (template + question defaults)
          const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
          dispatch({
            type: "SET_STEP3_ANSWERS",
            answers: baselineAnswers,
            source: "template_default",
          });

          // ✅ PROVENANCE: Apply intel patches separately (won't stomp user edits later)
          const intelPatch = api.buildIntelPatch(state.locationIntel);
          if (Object.keys(intelPatch).length > 0) {
            dispatch({ type: "PATCH_STEP3_ANSWERS", patch: intelPatch, source: "location_intel" });
          }

          // ✅ PROVENANCE: Apply business detection patches separately
          const businessPatch = api.buildBusinessPatch(state.businessCard);
          if (Object.keys(businessPatch).length > 0) {
            dispatch({
              type: "PATCH_STEP3_ANSWERS",
              patch: businessPatch,
              source: "business_detection",
            });
          }

          // ✅ FIX (Feb 10, 2026): Do NOT auto-skip to Step 3
          // Stay on location step so goals modal can render
          // User will proceed to Step 3 after confirming goals
          console.log("[V7 SSOT] Business confirmed, staying on location for goals modal");
        } else {
          dispatch({ type: "SET_INDUSTRY", industry: "auto", locked: false });
          // ✅ FIX Feb 11: Don't jump to industry if goals aren't confirmed yet
          if (!state.goalsConfirmed) {
            dispatch({ type: "DEBUG_NOTE", note: "Industry not inferred - staying on location for goals modal" });
          } else {
            setStep("industry", "needs_industry");
          }
        }
      } catch (err: unknown) {
        if (isAbort(err)) {
          setError({ code: "ABORTED", message: "Request cancelled." });
        } else {
          setError(err);
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- locationIntel intentionally excluded (causes re-render loops)
    [skipBusiness, setError, setBusy, setStep, state.location, state.businessCard]
  );

  // Step 2: user selects industry (SSOT)
  const selectIndustry = useCallback(
    async (industry: IndustrySlug) => {
      clearError();
      abortOngoing();
      dispatch({ type: "DEBUG_TAG", lastAction: "selectIndustry" });

      if (!state.location) {
        setError({ code: "STATE", message: "Location is missing. Go back to Step 1." });
        return;
      }
      if (!industry || industry === "auto") {
        setError({ code: "VALIDATION", message: "Please select an industry." });
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setBusy(true, "Loading profile template...");
        dispatch({ type: "SET_INDUSTRY", industry, locked: false });
        dispatch({ type: "DEBUG_TAG", lastApi: "loadStep3Template" });

        // ✅ MERLIN MEMORY (Feb 11, 2026): Persist industry selection
        merlinMemory.set("industry", {
          slug: industry,
          inferred: false,
        });

        console.log("[V7 SSOT] selectIndustry: calling loadStep3Template for", industry);
        const template = await api.loadStep3Template(industry, controller.signal);
        console.log("[V7 SSOT] selectIndustry: template loaded", template?.id);
        dispatch({ type: "SET_STEP3_TEMPLATE", template });
        dispatch({ type: "SET_TEMPLATE_MODE", mode: "industry" });

        // ✅ SSOT FIX (Feb 10, 2026): Seed defaults from BOTH template AND schema
        // Template provides industry-specific defaults (e.g., 18 questions)
        // Schema provides ALL curated fields (e.g., 27 questions)
        // Merge ensures no question ID is left undefined
        
        const effectiveIndustry =
          (template as Record<string, unknown>).effectiveIndustry ||
          template.selectedIndustry ||
          industry;
        
        const schema = resolveStep3Schema(String(effectiveIndustry));
        
        // 1) Schema defaults (all questions get some value)
        const schemaDefaults: Record<string, unknown> = {};
        schema.questions.forEach((q) => {
          if (q.smartDefault !== undefined) {
            schemaDefaults[q.id] = q.smartDefault;
          } else if (q.type === "select" || q.type === "button_cards") {
            // Default to first option if no explicit default
            if (q.options && q.options.length > 0) {
              schemaDefaults[q.id] = q.options[0].value;
            }
          } else if (q.type === "number" || q.type === "number_stepper") {
            // Default to min or 0
            schemaDefaults[q.id] = q.validation?.min ?? 0;
          } else if (q.type === "toggle") {
            schemaDefaults[q.id] = false;
          }
        });
        
        // 2) Template baseline defaults (industry-specific, may be subset)
        const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
        
        // 3) Intelligent defaults from location/business intel
        const intelPatch = api.buildIntelPatch(state.locationIntel);
        const businessPatch = api.buildBusinessPatch(state.businessCard);
        
        // 4) Merge: schema → template → intel → business (later wins)
        const mergedAnswers = {
          ...schemaDefaults,
          ...baselineAnswers,
          ...intelPatch,
          ...businessPatch,
        };
        
        console.log("[V7 SSOT] selectIndustry: applied baseline + intel + business patches (SCHEMA-aligned)", {
          industry,
          effectiveIndustry,
          schemaQ: schema.questions.length,
          schemaDefaultsCount: Object.keys(schemaDefaults).length,
          baselineCount: Object.keys(baselineAnswers).length,
          intelCount: Object.keys(intelPatch).length,
          businessCount: Object.keys(businessPatch).length,
          mergedCount: Object.keys(mergedAnswers).length,
        });
        
        dispatch({
          type: "SET_STEP3_ANSWERS",
          answers: mergedAnswers,
          source: "template_default",
        });

        setStep("profile", "industry_selected");
        console.log("[V7 SSOT] selectIndustry: transitioned to profile step");
      } catch (err: unknown) {
        console.error("[V7 SSOT] selectIndustry ERROR:", err);

        // AbortError = user navigated away — just surface it
        if (isAbort(err)) {
          setError({ code: "ABORTED", message: "Request cancelled." });
          return; // finally still runs
        }

        // ──────────────────────────────────────────────────────────
        // RECOVERY: Template load failed → load generic fallback and
        // navigate to Step 3 anyway. Merlin never gets stuck.
        // ──────────────────────────────────────────────────────────
        console.warn("[V7 SSOT] selectIndustry: template load failed — activating fallback path");
        try {
          const { getFallbackTemplate } = await import("@/wizard/v7/templates/templateIndex");
          const genericTpl = getFallbackTemplate();

          const fallbackTemplate: Step3Template = {
            id: `generic.fallback`,
            industry: "other" as IndustrySlug,
            selectedIndustry: industry,
            version: genericTpl.version,
            questions: genericTpl.questions.map((q) => ({
              id: q.id,
              label: q.label,
              type: q.type as Step3Template["questions"][number]["type"],
              required: q.required,
              options: q.options as Step3Template["questions"][number]["options"],
              unit: q.unit,
              hint: q.hint,
              min: q.min,
              max: q.max,
              defaultValue: genericTpl.defaults?.[q.id] as
                | string
                | number
                | boolean
                | string[]
                | undefined,
            })),
            defaults: genericTpl.defaults,
            _effectiveTemplate: "generic",
          };

          dispatch({ type: "SET_STEP3_TEMPLATE", template: fallbackTemplate });
          dispatch({ type: "SET_TEMPLATE_MODE", mode: "fallback" });

          // Apply generic defaults
          const { answers: fallbackAnswers } = api.computeSmartDefaults(
            fallbackTemplate,
            null,
            null
          );
          dispatch({
            type: "SET_STEP3_ANSWERS",
            answers: fallbackAnswers,
            source: "template_default",
          });

          console.log("[V7 SSOT] selectIndustry: fallback template loaded, navigating to profile");
          setStep("profile", "industry_selected_fallback");
        } catch (fallbackErr: unknown) {
          // Even the fallback import failed — surface the original error
          console.error("[V7 SSOT] selectIndustry: fallback also failed", fallbackErr);
          setError(err);
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [
      abortOngoing,
      clearError,
      setBusy,
      setError,
      setStep,
      state.location,
      state.locationIntel,
      state.businessCard,
    ]
  );

  // Step 3: answer updates (SSOT) - User edits are source="user"
  const setStep3Answer = useCallback((id: string, value: unknown) => {
    dispatch({ type: "DEBUG_TAG", lastAction: "setStep3Answer" });
    dispatch({ type: "SET_STEP3_ANSWER", id, value, source: "user" });

    // Completion can be computed and applied later (explicit submit)
  }, []);

  const setStep3Answers = useCallback((answers: Step3Answers, source: AnswerSource = "user") => {
    dispatch({ type: "DEBUG_TAG", lastAction: "setStep3Answers" });
    dispatch({ type: "SET_STEP3_ANSWERS", answers, source });
  }, []);

  /**
   * applyIntelPatch - Apply location intel updates at runtime
   *
   * Called when locationIntel changes AFTER Step 3 is already loaded.
   * Uses PATCH_STEP3_ANSWERS so it won't stomp user edits.
   */
  const applyIntelPatch = useCallback(() => {
    const patch = api.buildIntelPatch(state.locationIntel);
    if (Object.keys(patch).length > 0) {
      dispatch({ type: "PATCH_STEP3_ANSWERS", patch, source: "location_intel" });
      dispatch({
        type: "DEBUG_NOTE",
        note: `Applied intel patch: ${Object.keys(patch).join(", ")}`,
      });
    }
  }, [state.locationIntel]);

  /**
   * resetToDefaults - User explicitly requests "reset to defaults"
   *
   * This WILL overwrite user edits because user asked for it.
   * Provenance is rewritten to template_default/question_default.
   *
   * @param scope - "all" or { partId: string } for partial reset
   */
  const resetToDefaults = useCallback((scope: "all" | { partId: string } = "all") => {
    dispatch({ type: "RESET_STEP3_TO_DEFAULTS", scope });
    dispatch({ type: "DEBUG_NOTE", note: `User reset to defaults: ${JSON.stringify(scope)}` });
  }, []);

  // ============================================================
  // Step 3 FSM Actions
  // ============================================================

  /**
   * markDefaultsApplied - Record that defaults have been applied for a part
   * Guards against re-applying defaults on re-render
   */
  const markDefaultsApplied = useCallback(
    (partId: string) => {
      const templateId = state.step3Template?.id || "unknown";
      dispatch({ type: "STEP3_DEFAULTS_APPLIED", partId, templateId });
    },
    [state.step3Template?.id]
  );

  /**
   * goToNextPart - Advance to next part in Step 3
   * Guarded by FSM - only works from part_active state
   */
  const goToNextPart = useCallback(() => {
    dispatch({ type: "STEP3_PART_NEXT" });
  }, []);

  /**
   * goToPrevPart - Go back to previous part in Step 3
   */
  const goToPrevPart = useCallback(() => {
    dispatch({ type: "STEP3_PART_PREV" });
  }, []);

  /**
   * setPartIndex - Jump to specific part index
   */
  const setPartIndex = useCallback((index: number) => {
    dispatch({ type: "STEP3_PART_SET", index });
  }, []);

  /**
   * hasDefaultsApplied - Check if defaults have been applied for a part
   */
  const hasDefaultsApplied = useCallback(
    (partId: string): boolean => {
      const templateId = state.step3Template?.id || "unknown";
      const key = `${templateId}.${partId}`;
      return state.step3DefaultsAppliedParts.includes(key);
    },
    [state.step3Template?.id, state.step3DefaultsAppliedParts]
  );

  // ============================================================
  // Step 3 Defaults Helpers (SSOT-authoritative)
  // ============================================================

  /**
   * partHasAnyDefaults - Check if a part has any defaults from any source
   *
   * Sources checked (in priority order):
   * 1. template.defaults[questionId] - bulk template defaults
   * 2. question.defaultValue - per-question fallback
   *
   * This is the SSOT-authoritative function. UI should NEVER reimplement this check.
   */
  const partHasAnyDefaults = useCallback(
    (_partId: string): boolean => {
      const template = state.step3Template;
      if (!template) return false;

      // Get questions for this part
      // For "profile" (single-page view), all questions belong to that part
      const questions = template.questions;
      if (!questions || questions.length === 0) return false;

      const templateDefaults = template.defaults ?? {};

      // Check if ANY question has a default from either source
      return questions.some(
        (q) => templateDefaults[q.id] !== undefined || q.defaultValue !== undefined
      );
    },
    [state.step3Template]
  );

  /**
   * canApplyDefaults - Check if defaults can be applied (not yet applied)
   *
   * Returns true if:
   * 1. Part has any defaults (from template.defaults or q.defaultValue)
   * 2. Defaults haven't been applied yet for this templateId+partId
   */
  const canApplyDefaults = useCallback(
    (partId: string): boolean => {
      return partHasAnyDefaults(partId) && !hasDefaultsApplied(partId);
    },
    [partHasAnyDefaults, hasDefaultsApplied]
  );

  /**
   * canResetToDefaults - Check if reset button should be shown
   *
   * Returns true if part has any defaults (from either source).
   * Unlike canApplyDefaults, this doesn't check if already applied
   * because user can always reset even after defaults were applied.
   */
  const canResetToDefaults = useCallback(
    (partId: string): boolean => {
      return partHasAnyDefaults(partId);
    },
    [partHasAnyDefaults]
  );

  /**
   * getDefaultForQuestion - Get the default value for a specific question
   *
   * Priority:
   * 1. template.defaults[questionId] (explicit template default)
   * 2. question.defaultValue (per-question fallback)
   * 3. null (no default)
   */
  const getDefaultForQuestion = useCallback(
    (questionId: string): unknown => {
      const template = state.step3Template;
      if (!template) return null;

      const templateDefaults = template.defaults ?? {};
      if (templateDefaults[questionId] !== undefined) {
        return templateDefaults[questionId];
      }

      const question = template.questions.find((q) => q.id === questionId);
      if (question?.defaultValue !== undefined) {
        return question.defaultValue;
      }

      return null;
    },
    [state.step3Template]
  );

  /**
   * runPricingSafe - Phase 6: Non-blocking pricing with sanity checks
   *
   * ARCHITECTURE (Feb 3, 2026):
   * - Layer A: runContractQuote() → Load profile + sizing hints (physics)
   * - Layer B: runPricingQuote() → Financial metrics (SSOT pricing bridge)
   *
   * DOCTRINE:
   * - Pricing failures NEVER block navigation
   * - Bad math (NaN/Infinity) becomes warnings, not errors
   * - User can retry from Results page
   *
   * Flow:
   * 1. Dispatch PRICING_START
   * 2. Run Layer A: runContractQuote (load profile)
   * 3. Run Layer B: runPricingQuote (financial metrics via SSOT)
   * 4. Merge outputs into final QuoteOutput
   * 5. Run sanityCheckQuote on result
   * 6. Dispatch PRICING_SUCCESS (with warnings) or PRICING_ERROR
   *
   * This method is FIRE-AND-FORGET. Navigation proceeds regardless.
   *
   * WATCHDOG: If pricing takes >15s, auto-error (prevents "pending forever")
   */
  const PRICING_TIMEOUT_MS = 15_000;

  /**
   * Generate a deterministic request key for stale-write protection.
   * Same inputs → same key (within the same session).
   */
  const generateRequestKey = (args: {
    industry: string;
    answers: Record<string, unknown>;
    location?: LocationCard;
  }): string => {
    // Hash the essential inputs that affect pricing
    const keyParts = [
      args.industry,
      args.location?.state ?? "unknown",
      args.location?.postalCode ?? "00000",
      // Include a subset of answers that affect sizing (not all answers for performance)
      JSON.stringify({
        peakDemandKW: args.answers.peakDemandKW,
        monthlyKWh: args.answers.monthlyKWh,
        annualKWh: args.answers.annualKWh,
        gridMode: args.answers.gridMode,
        batteryDuration: args.answers.batteryDuration,
      }),
    ];
    // Simple hash (deterministic within session)
    const str = keyParts.join("|");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `req_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
  };

  const runPricingSafe = useCallback(
    async (args: {
      industry: string;
      answers: Record<string, unknown>;
      location?: LocationCard;
      locationIntel?: LocationIntel;
      addOns?: SystemAddOns;
    }) => {
      // Generate request key for stale-write protection
      const requestKey = generateRequestKey({
        industry: args.industry,
        answers: args.answers,
        location: args.location,
      });

      // 1. Signal pricing started (with request key)
      dispatch({ type: "PRICING_START", requestKey });
      dispatch({ type: "DEBUG_TAG", lastApi: "runPricingSafe" });

      // ── NOTE (Feb 2026 redesign) ──
      // Pricing is a PREVIEW, not a delivered quote. Quota is only
      // tracked when the user actually EXPORTS (PDF/Word/Excel) in Step 6.
      // Guest users get 3 exports per session; authenticated users follow plan limits.
      // No quota check here — let pricing always proceed.

      // Timeout watchdog - prevents "pending forever" states
      const withTimeout = <T>(fn: () => T | Promise<T>, ms: number): Promise<T> =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`Pricing timeout after ${ms}ms`)), ms);
          try {
            const result = fn();
            // Handle both sync and async
            if (result instanceof Promise) {
              result
                .then((v) => {
                  clearTimeout(timer);
                  resolve(v);
                })
                .catch((e) => {
                  clearTimeout(timer);
                  reject(e);
                });
            } else {
              clearTimeout(timer);
              resolve(result);
            }
          } catch (e) {
            clearTimeout(timer);
            reject(e);
          }
        });

      try {
        // 2. LAYER A: Run contract quote (physics + load profile)
        const contractResult = await withTimeout(
          () =>
            runContractQuote({
              industry: args.industry,
              answers: args.answers,
              location: args.location,
              locationIntel: args.locationIntel,
            }),
          PRICING_TIMEOUT_MS / 2 // Half time for Layer A
        );

        const {
          freeze,
          quote: baseQuote,
          sessionId,
          loadProfile,
          sizingHints,
          inputsUsed,
        } = contractResult;

        // ✅ FIX (Feb 14, 2026): Immediately persist load profile to Memory after Layer A.
        // This ensures Steps 4/5/6 always have the latest peakLoadKW, even if Layer B
        // (pricing) fails or times out. Previously, Memory profile was only written in
        // submitStep3 BEFORE pricing, leaving peakLoadKW as undefined/stale.
        merlinMemory.patch("profile", {
          peakLoadKW: loadProfile.peakLoadKW,
          avgLoadKW: loadProfile.baseLoadKW,
          energyKWhPerDay: loadProfile.energyKWhPerDay,
        });

        // 3. LAYER B: Run pricing bridge (financial metrics via SSOT)
        let pricingResult: PricingQuoteResult | null = null;
        const allWarnings: string[] = [
          ...(baseQuote.notes?.filter((n) => n.startsWith("⚠️")) ?? []),
        ];

        try {
          // Build ContractQuoteResult for Layer B
          // Merge Step 4 add-ons into inputsUsed so they flow to pricingBridge → calculateQuote()
          const addOns = args.addOns;
          const contractForPricing: import("@/wizard/v7/pricing/pricingBridge").ContractQuoteResult =
            {
              loadProfile,
              sizingHints: {
                ...sizingHints,
                source: sizingHints.source as "industry-default" | "user-config" | "template",
              },
              inputsUsed: {
                electricityRate: inputsUsed.electricityRate,
                demandCharge: inputsUsed.demandCharge,
                location: inputsUsed.location,
                industry: inputsUsed.industry,
                gridMode: inputsUsed.gridMode,
                // System add-ons (Step 4 → pricingBridge → calculateQuote)
                solarMW: addOns?.includeSolar && addOns.solarKW > 0
                  ? addOns.solarKW / 1000
                  : undefined,
                generatorMW: addOns?.includeGenerator && addOns.generatorKW > 0
                  ? addOns.generatorKW / 1000
                  : undefined,
                generatorFuelType: addOns?.includeGenerator
                  ? addOns.generatorFuelType
                  : undefined,
                windMW: addOns?.includeWind && addOns.windKW > 0
                  ? addOns.windKW / 1000
                  : undefined,
              },
              assumptions: baseQuote.notes?.filter((n) => !n.startsWith("⚠️")),
              warnings: baseQuote.notes
                ?.filter((n) => n.startsWith("⚠️"))
                .map((n) => n.replace("⚠️ ", "")),
            };

          // Generate deterministic snapshot ID
          const snapshotId = generatePricingSnapshotId({
            peakLoadKW: loadProfile.peakLoadKW,
            storageToPeakRatio: sizingHints.storageToPeakRatio,
            durationHours: sizingHints.durationHours,
            industry: inputsUsed.industry,
            state: inputsUsed.location.state,
            electricityRate: inputsUsed.electricityRate,
          });

          // Build pricing config
          const pricingConfig: PricingConfig = {
            snapshotId,
            includeAdvancedAnalysis: false, // Can be enabled for Pro mode
          };

          pricingResult = await withTimeout(
            () => runPricingQuote(contractForPricing, pricingConfig),
            PRICING_TIMEOUT_MS / 2 // Half time for Layer B
          );

          if (!pricingResult.ok) {
            allWarnings.push(`⚠️ Pricing: ${pricingResult.error ?? "Unknown error"}`);
          }
        } catch (pricingErr) {
          // Layer B failure is NON-BLOCKING
          const errMsg =
            (pricingErr as { message?: string })?.message ?? "Pricing calculation failed";
          allWarnings.push(`⚠️ Pricing failed: ${errMsg}`);
          console.warn("[V7 Pricing] Layer B error (non-blocking):", errMsg);
        }

        // 4. Merge Layer A + Layer B into final QuoteOutput (MONOTONIC: never partial populate)
        // Track input fallbacks for transparency
        const inputFallbacks: QuoteOutput["inputFallbacks"] = {};

        // Track what defaults were used
        const locationIntel = args.locationIntel;
        if (!locationIntel?.utilityRate) {
          inputFallbacks.electricityRate = {
            value: inputsUsed.electricityRate ?? 0,
            reason: "Default rate (no utility data)",
          };
        }
        if (!locationIntel?.demandCharge) {
          inputFallbacks.demandCharge = {
            value: inputsUsed.demandCharge ?? 0,
            reason: "Default demand charge (no utility data)",
          };
        }
        if (!args.location?.state) {
          inputFallbacks.location = {
            value: inputsUsed.location.state ?? "unknown",
            reason: "Location not resolved",
          };
        }

        const mergedQuote: QuoteOutput = {
          // Layer A: Load profile (ALWAYS present once contract runs)
          baseLoadKW: loadProfile.baseLoadKW,
          peakLoadKW: loadProfile.peakLoadKW,
          energyKWhPerDay: loadProfile.energyKWhPerDay,
          storageToPeakRatio: sizingHints.storageToPeakRatio,
          durationHours: sizingHints.durationHours,

          // Layer B: Financial metrics — MONOTONIC: ALL or NONE (never partial)
          ...(pricingResult?.ok && pricingResult.data
            ? {
                capexUSD: pricingResult.data.capexUSD,
                grossCost: pricingResult.data.grossCost,
                itcAmount: pricingResult.data.itcAmount,
                itcRate: pricingResult.data.itcRate,
                annualSavingsUSD: pricingResult.data.annualSavingsUSD,
                roiYears: pricingResult.data.roiYears,
                npv: pricingResult.data.financials?.npv,
                irr: pricingResult.data.financials?.irr,
                paybackYears: pricingResult.data.financials?.paybackYears,
                demandChargeSavings: (
                  pricingResult.data.financials as Record<string, unknown> | undefined
                )?.demandChargeSavings as number | undefined,
                bessKWh: pricingResult.data.breakdown?.batteries
                  ? pricingResult.data.breakdown.batteries.unitEnergyMWh *
                    pricingResult.data.breakdown.batteries.quantity *
                    1000
                  : undefined,
                bessKW: pricingResult.data.breakdown?.batteries
                  ? pricingResult.data.breakdown.batteries.unitPowerMW *
                    pricingResult.data.breakdown.batteries.quantity *
                    1000
                  : undefined,
                solarKW: pricingResult.data.breakdown?.solar
                  ? pricingResult.data.breakdown.solar.totalMW * 1000
                  : undefined,
                generatorKW: pricingResult.data.breakdown?.generators
                  ? pricingResult.data.breakdown.generators.unitPowerMW *
                    pricingResult.data.breakdown.generators.quantity *
                    1000
                  : undefined,
                pricingSnapshotId: pricingResult.data.pricingSnapshotId,
                pricingComplete: true,
                // Margin policy (Feb 2026)
                margin: pricingResult.data.margin
                  ? {
                      sellPriceTotal: pricingResult.data.margin.sellPriceTotal,
                      baseCostTotal: pricingResult.data.margin.baseCostTotal,
                      marginDollars: pricingResult.data.margin.marginDollars,
                      marginPercent: pricingResult.data.margin.marginPercent,
                      marginBand: pricingResult.data.margin.marginBand,
                      policyVersion: pricingResult.data.margin.policyVersion,
                      needsReview: pricingResult.data.margin.needsReview,
                      warnings: pricingResult.data.margin.warnings,
                    }
                  : undefined,
              }
            : {
                // MONOTONIC: pricingComplete=false means NO financial fields populated
                pricingComplete: false,
              }),

          // Input fallbacks for transparency
          inputFallbacks: Object.keys(inputFallbacks).length > 0 ? inputFallbacks : undefined,

          // TrueQuote™ validation envelope (carried from Layer A)
          trueQuoteValidation: baseQuote.trueQuoteValidation,

          // Notes (merged from both layers)
          notes: [...(baseQuote.notes?.filter((n) => !n.startsWith("⚠️")) ?? []), ...allWarnings],
        };

        // 4b. Confidence scoring (Recovery Strategy Pillar 3)
        {
          const template = state.step3Template;
          const answers = args.answers;
          const meta = state.step3AnswersMeta;

          // Location confidence
          const locConf: ConfidenceLevel = locationIntel?.utilityRate
            ? "exact"
            : args.location?.state
              ? "regional"
              : "default";

          // Industry template quality
          const industryConf: "v1" | "fallback" =
            (template?.industry as string) === "generic" || (template?._effectiveTemplate as string) === "generic"
              ? "fallback"
              : "v1";

          // Profile completeness
          const totalQs = template?.questions?.length ?? 0;
          const answeredQs = Object.keys(answers).filter(
            (k) => answers[k] != null && answers[k] !== ""
          ).length;
          const profileCompleteness = totalQs > 0 ? Math.round((answeredQs / totalQs) * 100) : 0;

          // Count defaults vs user inputs via provenance metadata
          let defaultsUsed = 0;
          let userInputs = 0;
          for (const key of Object.keys(answers)) {
            const m = meta[key];
            if (m?.source === "user") userInputs++;
            else defaultsUsed++;
          }

          // Overall confidence
          const overall: "high" | "medium" | "low" =
            locConf === "exact" && industryConf === "v1" && profileCompleteness >= 70
              ? "high"
              : locConf !== "default" && profileCompleteness >= 30
                ? "medium"
                : "low";

          mergedQuote.confidence = {
            location: locConf,
            industry: industryConf,
            profileCompleteness,
            defaultsUsed,
            userInputs,
            overall,
          };
        }

        // 5. Sanity check the result (NaN/Infinity/negative totals)
        const sanity: PricingSanity = sanityCheckQuote(mergedQuote);

        if (sanity.warnings.length > 0) {
          console.warn(
            `[V7 Pricing] Quote has ${sanity.warnings.length} sanity warnings:`,
            sanity.warnings
          );
        }

        // Update freeze with sizing info from Layer A + Layer B equipment
        const enrichedFreeze: PricingFreeze = {
          ...freeze,
          hours: sizingHints.durationHours,
          // Populate solar/generator from pricing breakdown (Layer B)
          solarMWp: mergedQuote.solarKW ? mergedQuote.solarKW / 1000 : undefined,
          generatorMW: mergedQuote.generatorKW ? mergedQuote.generatorKW / 1000 : undefined,
        };

        // 6. Success! (with stale-write key for guard)
        dispatch({
          type: "PRICING_SUCCESS",
          freeze: enrichedFreeze,
          quote: mergedQuote,
          warnings: [...allWarnings, ...sanity.warnings],
          requestKey,
        });

        dispatch({
          type: "DEBUG_NOTE",
          note: `Pricing ok: sessionId=${sessionId}, pricingComplete=${mergedQuote.pricingComplete}, key=${requestKey.slice(0, 8)}`,
        });

        // ✅ MERLIN MEMORY (Feb 11, 2026): Persist full financial model
        if (pricingResult?.ok && pricingResult.data) {
          const pd = pricingResult.data;
          const fin = pd.financials;

          merlinMemory.set("financials", {
            equipmentCost: pd.breakdown?.batteries
              ? Object.values(pd.breakdown).reduce(
                  (sum, eq) => sum + ((eq as { totalCost?: number })?.totalCost ?? 0),
                  0
                )
              : pd.capexUSD,
            installationCost: 0, // included in capexUSD
            totalProjectCost: pd.capexUSD / (1 - 0.30), // gross before ITC
            taxCredit: pd.capexUSD / (1 - 0.30) * 0.30, // estimated ITC
            netCost: pd.capexUSD,
            annualSavings: pd.annualSavingsUSD,
            demandChargeSavings: mergedQuote.demandChargeSavings,
            paybackYears: pd.roiYears,
            roi10Year: fin?.roi10Year ?? 0,
            roi25Year: fin?.roi25Year ?? 0,
            npv: fin?.npv ?? 0,
            irr: fin?.irr ?? 0,
            itcRate: 0.30, // TODO: pull from metadata.itcDetails when available
            itcAmount: pd.capexUSD / (1 - 0.30) * 0.30,
            pricingSnapshotId: pd.pricingSnapshotId,
            calculatedAt: Date.now(),
          });

          // Also update session telemetry
          const session = merlinMemory.get("session");
          if (session) {
            merlinMemory.patch("session", {
              quoteGenerations: (session.quoteGenerations ?? 0) + 1,
              lastActiveAt: Date.now(),
            });
          }
        }

        return {
          ok: true as const,
          freeze: enrichedFreeze,
          quote: mergedQuote,
          warnings: [...allWarnings, ...sanity.warnings],
        };
      } catch (err: unknown) {
        // 7. Error path - capture but DON'T block (with stale-write key)
        const errMsg = (err as { message?: string })?.message ?? "Pricing calculation failed";

        console.error("[V7 Pricing] Error:", errMsg, err);

        dispatch({ type: "PRICING_ERROR", error: errMsg, requestKey });

        return { ok: false as const, error: errMsg };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state accessed for confidence scoring
    []
  );

  /**
   * retryPricing - Retry pricing from Results page
   *
   * Uses current state.step3Answers, state.industry, state.location, state.locationIntel.
   * Passes current step4AddOns to include solar/generator/wind in the quote.
   */
  const retryPricing = useCallback(async () => {
    if (state.industry === "auto") {
      console.warn("[V7] Cannot retry pricing: industry not set");
      return { ok: false as const, error: "Industry not set" };
    }
    dispatch({ type: "PRICING_RETRY" });
    return runPricingSafe({
      industry: state.industry,
      answers: state.step3Answers,
      location: state.location ?? undefined,
      locationIntel: state.locationIntel ?? undefined,
      addOns: state.step4AddOns,
    });
  }, [runPricingSafe, state.industry, state.step3Answers, state.location, state.locationIntel, state.step4AddOns]);

  /**
   * recalculateWithAddOns - Re-run pricing with new add-on configuration from Step 4.
   *
   * Flow: User toggles solar/generator/EV in Step 4 → saves add-ons → re-runs pricing.
   * Layer A (load profile) is re-computed (no cache), Layer B (pricing) gets add-on values.
   */
  const recalculateWithAddOns = useCallback(async (addOns: SystemAddOns) => {
    if (state.industry === "auto") {
      console.warn("[V7] Cannot recalculate: industry not set");
      return { ok: false as const, error: "Industry not set" };
    }
    // 1. Persist add-ons to state
    dispatch({ type: "SET_STEP4_ADDONS", addOns });

    // ✅ MERLIN MEMORY (Feb 11, 2026): Persist add-ons configuration
    // ✅ MERLIN MEMORY: Bump add-on change counter for session telemetry
    const sessionForAddOns = merlinMemory.get("session");
    if (sessionForAddOns) {
      merlinMemory.patch("session", {
        addOnChanges: (sessionForAddOns.addOnChanges ?? 0) + 1,
        lastActiveAt: Date.now(),
      });
    }
    merlinMemory.set("addOns", {
      includeSolar: addOns.includeSolar,
      solarKW: addOns.solarKW,
      includeGenerator: addOns.includeGenerator,
      generatorKW: addOns.generatorKW,
      generatorFuelType: addOns.generatorFuelType,
      includeWind: addOns.includeWind,
      windKW: addOns.windKW,
      updatedAt: Date.now(),
    });

    // 2. Re-run pricing with new add-ons
    dispatch({ type: "PRICING_RETRY" });
    return runPricingSafe({
      industry: state.industry,
      answers: state.step3Answers,
      location: state.location ?? undefined,
      locationIntel: state.locationIntel ?? undefined,
      addOns,
    });
  }, [runPricingSafe, state.industry, state.step3Answers, state.location, state.locationIntel]);

  /**
   * retryTemplate — Attempt to reload an industry-specific template when currently in fallback mode.
   * Exposed to Step 4 so users can upgrade from "Estimate" → "TrueQuote™" without restarting.
   */
  const retryTemplate = useCallback(async () => {
    if (state.industry === "auto") {
      console.warn("[V7] Cannot retry template: industry not set");
      return;
    }
    if (state.templateMode === "industry") {
      console.log("[V7] Already have industry template — skipping retry");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setBusy(true, "Retrying industry template...");
      const template = await api.loadStep3Template(state.industry, controller.signal);
      dispatch({ type: "SET_STEP3_TEMPLATE", template });
      dispatch({
        type: "SET_TEMPLATE_MODE",
        mode: (template.industry as string) === "generic" ? "fallback" : "industry",
      });

      // Re-apply defaults from the new template without stomping user answers
      const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
      // Only fill in blanks — don't overwrite user-provided answers
      const patch: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(baselineAnswers)) {
        if (state.step3Answers[key] == null || state.step3Answers[key] === "") {
          patch[key] = val;
        }
      }
      if (Object.keys(patch).length > 0) {
        dispatch({ type: "PATCH_STEP3_ANSWERS", patch, source: "template_default" });
      }

      console.log(
        "[V7] Template retry result:",
        (template.industry as string) === "generic" ? "fallback" : "industry"
      );
    } catch (err) {
      console.warn("[V7] Template retry failed:", err instanceof Error ? err.message : err);
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setBusy is stable (useState setter)
  }, [state.industry, state.templateMode, state.step3Answers]);

  // Step 3: validate + go to results (pricing is NON-BLOCKING)
  //
  // Phase 6 Doctrine:
  // - Validation failures BLOCK (user must fix)
  // - Pricing failures DO NOT BLOCK (shown as banner in Results)
  // - Navigation proceeds regardless of pricing outcome
  
  /* ============================================================
     Helper Functions: Retry Logic with Exponential Backoff
  ============================================================ */
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  };

  const retry = async <T,>(
    fn: () => Promise<T>,
    options: { attempts?: number; baseDelayMs?: number; timeoutMs?: number } = {}
  ): Promise<T> => {
    const { attempts = 3, baseDelayMs = 250, timeoutMs = 9000 } = options;
    let lastError: Error | null = null;

    for (let i = 0; i < attempts; i++) {
      try {
        console.log(`[V7 SSOT] Attempt ${i + 1}/${attempts}`);
        return await withTimeout(fn(), timeoutMs);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[V7 SSOT] Attempt ${i + 1} failed:`, lastError.message);

        if (i < attempts - 1) {
          const delay = baseDelayMs * Math.pow(2, i); // Exponential backoff: 250ms, 500ms, 1000ms
          console.log(`[V7 SSOT] Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  };

  const submitStep3 = useCallback(
    async (answersOverride?: Step3Answers) => {
      // Diagnostic log (Step3→Step4 root cause analysis)
      console.log("[submitStep3] start", {
        step: state.step,
        locationConfirmed: state.locationConfirmed,
        goalsConfirmed: state.goalsConfirmed,
        step3Complete: state.step3Complete,
      });
      
      // ✅ FIX (Feb 10, 2026): Check prerequisites and guide user to fix missing steps
      if (!state.locationConfirmed) {
        console.error("[submitStep3] ❌ Blocked: Location not confirmed");
        setError({
          code: "PREREQUISITE",
          message: "Please confirm your location on Step 1 first.",
        });
        setStep("location", "prerequisite_missing");
        return;
      }
      
      if (!state.goalsConfirmed) {
        console.error("[submitStep3] ❌ Blocked: Goals not confirmed");
        setError({
          code: "PREREQUISITE",
          message: "Please complete the goals section on Step 1 first.",
        });
        setStep("location", "prerequisite_missing");
        return;
      }
      
      clearError();
      abortOngoing();
      dispatch({ type: "DEBUG_TAG", lastAction: "submitStep3" });

      // ✅ SSOT FIX (Feb 10, 2026): Use TEMPLATE as SSOT for validation
      // Template questions are what we rendered + seeded defaults for
      const effectiveIndustry =
        (state.step3Template as any)?.effectiveIndustry ||
        (state.step3Template as any)?.selectedIndustry ||
        state.industry;
      
      // ✅ SSOT: Get template questions (what was actually rendered)
      const templateQuestions = (state.step3Template as any)?.questions ?? [];
      const templateQuestionCount = templateQuestions.length;
      
      // Required IDs from template (use template.required flag, or treat all as required)
      const templateRequiredIds = templateQuestions
        .filter((q: { required?: boolean }) => q.required !== false) // Default to required unless explicitly false
        .map((q: { id: string }) => q.id);
      
      console.log("[V7] submitStep3 called (TEMPLATE SSOT)", {
        step: state.step,
        industry: state.industry,
        effectiveIndustry,
        answersCount: Object.keys(state.step3Answers ?? {}).length,
        templateQ: templateQuestionCount,
        templateRequiredCount: templateRequiredIds.length,
        step3Complete: state.step3Complete,
        pricingStatus: state.pricingStatus,
      });
      
      // Guard: prevent double-submission while pricing is in flight
      if (state.pricingStatus === "pending") {
        console.warn("[V7] submitStep3 blocked: pricing already pending");
        return;
      }
      
      // ✅ FIX (Feb 5, 2026): Accept ZIP-only minimal location
      let location = state.location;
      if (!location) {
        location = buildMinimalLocationFromZip(state);
        if (!location) {
          setError({ code: "STATE", message: "ZIP code missing. Go back to Step 1." });
          return;
        }
        // Hydrate so future checks pass
        dispatch({ type: "SET_LOCATION", location });
      }
      if (state.industry === "auto") {
        setError({ code: "STATE", message: "Industry missing. Go back to Step 2." });
        return;
      }
      if (!state.step3Template || templateQuestionCount === 0) {
        setError({ code: "STATE", message: "Profile template missing. Reload Step 3." });
        return;
      }
      
      // ✅ SSOT: Validate against TEMPLATE (what we actually rendered)
      const answers = answersOverride ?? state.step3Answers;
      const missingIds = templateRequiredIds.filter((id: string) => {
        const val = answers?.[id];
        // Empty answer check
        return val == null || val === "" || (Array.isArray(val) && val.length === 0);
      });
      
      if (missingIds.length > 0) {
        // ✅ ENHANCED DEBUG: Log complete validation context
        console.warn("[V7] submitStep3 blocked (TEMPLATE validation)", {
          effectiveIndustry,
          reason: "Missing required fields",
          missingIds,
          answersCount: Object.keys(answers ?? {}).length,
          templateQ: templateQuestionCount,
          templateRequiredCount: templateRequiredIds.length,
          step: state.step,
          step3Complete: state.step3Complete,
        });
        
        const fieldNames = missingIds.map((id: string) => {
          const q = templateQuestions.find((tq: { id: string }) => tq.id === id);
          return q?.label || id;
        }).join(", ");
        
        setError({ code: "VALIDATION", message: `Please complete required fields: ${fieldNames}` });
        return;
      }

      console.log("[V7] submitStep3 validation PASSED ✅", {
        effectiveIndustry,
        answersCount: Object.keys(answers ?? {}).length,
        willAdvanceTo: "results",
      });

      // ✅ Dispatch SUBMIT_STEP3_STARTED to signal retry attempt
      dispatch({ type: "SUBMIT_STEP3_STARTED" });

      try {
        // Optional: Submit answers to backend with retry logic
        // If api.submitStep3Answers exists, use it; otherwise skip
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (api as any)?.submitStep3Answers === "function") {
          await retry(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            () => (api as any).submitStep3Answers({ industry: state.industry, answers }),
            { attempts: 3, baseDelayMs: 250, timeoutMs: 9000 }
          );
        }

        // ✅ Dispatch SUCCESS to transition to options step (6-step flow)
        dispatch({ type: "SUBMIT_STEP3_SUCCESS" });
        console.log("[V7] submitStep3 SUCCESS dispatched → reducer sets step='options'");
        console.log("[submitStep3] end -> setting step", { nextStep: "options" });

        // ✅ MERLIN MEMORY (Feb 11, 2026): Persist profile + sizing for Steps 4-6
        // ⚠️ Use || undefined (not ?? 0) — state.quote may not have pricing yet
        // (pricing runs async after this). Writing 0 would block the
        // useMerlinData fallback chain from reading state.quote later.
        const quoteOutput = state.quote;
        merlinMemory.set("profile", {
          answers: answers as Record<string, unknown>,
          peakLoadKW: quoteOutput?.peakLoadKW ?? 0,
          avgLoadKW: quoteOutput?.baseLoadKW || undefined,
          energyKWhPerDay: quoteOutput?.energyKWhPerDay || undefined,
        });
        if (quoteOutput?.bessKWh) {
          merlinMemory.set("sizing", {
            bessKWh: quoteOutput.bessKWh,
            bessKW: quoteOutput.bessKW ?? 0,
            durationHours: quoteOutput.durationHours ?? 4,
            solarKW: quoteOutput.solarKW,
            generatorKW: quoteOutput.generatorKW,
          });
        }

        // ✅ Run pricing in background (non-blocking)
        // MagicFit will use these results to generate 3 tiers
        runPricingSafe({
          industry: state.industry,
          answers,
          location: state.location ?? undefined,
          locationIntel: state.locationIntel ?? undefined,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("[V7 SSOT] submitStep3 failed after retries:", errorMessage);
        
        // ✅ Dispatch FAILED but still allow progression (non-blocking)
        dispatch({ 
          type: "SUBMIT_STEP3_FAILED", 
          error: { message: errorMessage, retries: 3 } 
        });

        // ✅ Still transition to options even if backend submission failed
        // (Local calculation can proceed without backend — user still sees Options + MagicFit)
        dispatch({ type: "SET_STEP3_COMPLETE", complete: true });
        setStep("options", "step3_complete_fallback");

        // ✅ Run pricing in background regardless
        runPricingSafe({
          industry: state.industry,
          answers,
          location: state.location ?? undefined,
          locationIntel: state.locationIntel ?? undefined,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- individual state fields listed for performance
    [
      abortOngoing,
      clearError,
      runPricingSafe,
      setError,
      setStep,
      state.location,
      state.locationIntel,
      state.industry,
      state.step3Template,
      state.step3Answers,
      state.step3AnswersMeta,
      state.pricingStatus,
    ]
  );

  /**
   * submitStep3Partial - Escape hatch for incomplete Step 3
   *
   * Allows navigation to results with incomplete answers.
   * - Runs Layer A with defaults + partial answers
   * - Shows "provisional results" warning in Step 4
   * - Keeps pricing disabled until minimum set is met
   *
   * This preserves non-blocking doctrine: founders never get trapped.
   */
  const submitStep3Partial = useCallback(
    async () => {
      clearError();
      abortOngoing();
      dispatch({ type: "DEBUG_TAG", lastAction: "submitStep3Partial" });

      // Guard: prevent double-submission while pricing is in flight
      if (state.pricingStatus === "pending") {
        console.warn("[V7] submitStep3Partial blocked: pricing already pending");
        return;
      }

      // ✅ FIX (Feb 5, 2026): Accept ZIP-only minimal location
      let location = state.location;
      if (!location) {
        location = buildMinimalLocationFromZip(state);
        if (!location) {
          setError({ code: "STATE", message: "ZIP code missing. Go back to Step 1." });
          return;
        }
        dispatch({ type: "SET_LOCATION", location });
      }
      if (state.industry === "auto") {
        setError({ code: "STATE", message: "Industry missing. Go back to Step 2." });
        return;
      }
      if (!state.step3Template) {
        setError({ code: "STATE", message: "Profile template missing. Reload Step 3." });
        return;
      }

      // ✅ Mark as partial (not complete) but allow navigation
      dispatch({ type: "SET_STEP3_COMPLETE", complete: false });

      // ✅ Navigate to Results IMMEDIATELY (non-blocking)
      setStep("results", "step3_partial");

      // ⚠️ PROVISIONAL MODE: Run Layer A only (no pricing)
      // Pricing requires complete inputs for confident financials.
      // User must "Complete Step 3" to enable pricing.

      // TODO: Implement Layer A-only contract quote call here
      // For now, we navigate and show the warning banner.
      // The "Complete Step 3 →" link brings them back to finish.

      console.log("[V7] Partial submit - Layer A only, pricing disabled");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state intentionally excluded (only uses specific fields)
    [
      abortOngoing,
      clearError,
      setError,
      setStep,
      state.location,
      state.locationIntel,
      state.industry,
      state.step3Template,
      state.step3Answers,
      state.pricingStatus,
    ]
  );

  // Optional: hard jump with gate checks
  const goToStep = useCallback(
    async (target: WizardStep) => {
      clearError();
      dispatch({ type: "DEBUG_TAG", lastAction: "goToStep" });

      // enforce monotonic gating: you can go back freely, but forward must be valid
      if (target === "location") {
        setStep("location", "nav");
        return;
      }

      if (target === "industry") {
        // ✅ FIX (Feb 5, 2026): ZIP is location — auto-create minimal LocationCard if needed
        if (!state.location) {
          const minCard = buildMinimalLocationFromZip(state);
          if (!minCard) {
            setError({ code: "STATE", message: "Please enter a valid ZIP code." });
            return;
          }
          // Hydrate location from ZIP so downstream gates pass
          dispatch({ type: "SET_LOCATION", location: minCard });
          dispatch({
            type: "DEBUG_NOTE",
            note: "Auto-created minimal LocationCard from ZIP (geocode pending)",
          });
        }
        setStep("industry", "nav");
        return;
      }

      if (target === "profile") {
        const okIndustry = stepCanProceed(state, "industry");
        if (!okIndustry.ok) {
          setError({ code: "STATE", message: okIndustry.reason ?? "Cannot proceed to Step 3." });
          return;
        }
        // Ensure template loaded
        if (!state.step3Template) {
          const controller = new AbortController();
          abortRef.current = controller;
          try {
            setBusy(true, "Loading profile template...");
            const template = await api.loadStep3Template(state.industry, controller.signal);
            dispatch({ type: "SET_STEP3_TEMPLATE", template });
            dispatch({
              type: "SET_TEMPLATE_MODE",
              mode: (template.industry as string) === "generic" ? "fallback" : "industry",
            });

            // ✅ PROVENANCE: Apply baseline defaults on navigation too
            const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
            dispatch({
              type: "SET_STEP3_ANSWERS",
              answers: baselineAnswers,
              source: "template_default",
            });

            // ✅ PROVENANCE: Apply intel patches separately
            const intelPatch = api.buildIntelPatch(state.locationIntel);
            if (Object.keys(intelPatch).length > 0) {
              dispatch({
                type: "PATCH_STEP3_ANSWERS",
                patch: intelPatch,
                source: "location_intel",
              });
            }

            // ✅ PROVENANCE: Apply business detection patches separately
            const businessPatch = api.buildBusinessPatch(state.businessCard);
            if (Object.keys(businessPatch).length > 0) {
              dispatch({
                type: "PATCH_STEP3_ANSWERS",
                patch: businessPatch,
                source: "business_detection",
              });
            }
          } catch (err: unknown) {
            if (isAbort(err)) setError({ code: "ABORTED", message: "Request cancelled." });
            else setError(err);
            return;
          } finally {
            setBusy(false);
            abortRef.current = null;
          }
        }
        setStep("profile", "nav");
        return;
      }

      if (target === "results") {
        // ✅ FIX (Feb 10, 2026): Check prerequisites before allowing Results step
        // This prevents Step3→Step4 with invalid state (locationConfirmed=false, etc.)
        if (!state.locationConfirmed) {
          setError({ code: "STATE", message: "Location not confirmed. Please complete Step 1." });
          setStep("location", "prereq_missing");
          return;
        }
        if (!state.goalsConfirmed) {
          setError({ code: "STATE", message: "Goals not confirmed. Please complete Step 1." });
          setStep("location", "prereq_missing");
          return;
        }
        if (!state.step3Complete) {
          setError({ code: "STATE", message: "Step 3 incomplete. Please answer all required questions." });
          setStep("profile", "prereq_missing");
          return;
        }
        
        const ok = stepCanProceed(state, "results");
        if (!ok.ok) {
          setError({ code: "STATE", message: ok.reason ?? "Cannot proceed to Results." });
          return;
        }
        setStep("results", "nav");
        return;
      }

      if (target === "options") {
        if (!state.step3Complete) {
          setError({ code: "STATE", message: "Please complete Step 3 first." });
          return;
        }
        setStep("options", "nav");
        return;
      }

      if (target === "magicfit") {
        if (!state.step3Complete) {
          setError({ code: "STATE", message: "Please complete Step 3 first." });
          return;
        }
        setStep("magicfit", "nav");
        return;
      }
    },
    [clearError, setBusy, setError, setStep, state]
  );

  /* ============================================================
     Derived Values (safe for UI)
  ============================================================ */

  const progress = useMemo(() => {
    const STEPS = ["location", "industry", "profile", "options", "magicfit", "results"];
    const idx = STEPS.indexOf(state.step);
    const stepIndex = Math.max(0, idx);
    return {
      stepIndex,
      stepCount: STEPS.length,
      percent: Math.round(((stepIndex + 1) / STEPS.length) * 100),
    };
  }, [state.step]);

  const gates = useMemo(() => {
    // ✅ FIX (Feb 10, 2026): Only evaluate gates for current step or forward transitions
    // This prevents "Step 3 with locationConfirmed=false" gate spam that fights UI state
    const currentStep = state.step;
    
    // Only check location gate if we're ON location step or ABOUT TO leave it
    const canGoIndustry = 
      currentStep === "location" || currentStep === "industry"
        ? stepCanProceed(state, "location").ok
        : true; // Don't block if we're past it
    
    // Only check industry gate if we're ON industry step or ABOUT TO leave it
    const canGoProfile = 
      currentStep === "industry" || currentStep === "profile"
        ? stepCanProceed(state, "industry").ok
        : true; // Don't block if we're past it
    
    // Only check results gate if we're TRYING to enter results
    const canGoResults = 
      currentStep === "profile" || currentStep === "options" || currentStep === "magicfit" || currentStep === "results"
        ? stepCanProceed(state, "results").ok
        : true;
    
    return {
      canGoIndustry,
      canGoProfile,
      canGoResults,
    };
  }, [state]);

  /* ============================================================
     Life Signals (Three Laws of LifeForms)
     
     Law 1: Understand and learn from environment
     Law 2: Feel and express understanding (not fake emotions)
     Law 3: Evolve over time
     
     These are computed truths about Merlin's internal state.
     UI uses these to modulate visual weight, not personality.
     
     Elegance = appropriate response, not decoration.
  ============================================================ */

  const lifeSignals = useMemo(() => {
    const meta = state.step3AnswersMeta;
    const answers = state.step3Answers;
    const template = state.step3Template;

    // === LAW 1: Environmental Awareness ===
    // What does Merlin know vs. what is it guessing?

    const totalFields = Object.keys(meta).length;
    const sourceBreakdown = {
      user: 0,
      location_intel: 0,
      business_detection: 0,
      template_default: 0,
      question_default: 0,
    };

    for (const m of Object.values(meta)) {
      sourceBreakdown[m.source]++;
    }

    // Grounded = data from real sources (user, intel, detection)
    const groundedCount =
      sourceBreakdown.user + sourceBreakdown.location_intel + sourceBreakdown.business_detection;
    // Assumed = data from defaults (guessing)
    const assumedCount = sourceBreakdown.template_default + sourceBreakdown.question_default;

    // Confidence: 0-1, higher when more grounded data
    // Formula: weighted average (user=1.0, intel=0.8, detection=0.7, defaults=0.3)
    const weights = {
      user: 1.0,
      location_intel: 0.8,
      business_detection: 0.7,
      template_default: 0.3,
      question_default: 0.3,
    };
    const weightedSum = Object.entries(sourceBreakdown).reduce(
      (sum, [source, count]) => sum + count * weights[source as AnswerSource],
      0
    );
    const confidence = totalFields > 0 ? weightedSum / totalFields : 0;

    // Required fields coverage (if template loaded)
    const requiredFields = template?.questions.filter((q) => q.required).map((q) => q.id) ?? [];
    const requiredFilled = requiredFields.filter((id) => {
      const v = answers[id];
      return v !== undefined && v !== null && v !== "";
    }).length;
    const completeness = requiredFields.length > 0 ? requiredFilled / requiredFields.length : 0;

    // === LAW 2: Understanding (expressed as certainty levels) ===
    // Not emotions—appropriate confidence in each field

    // Fields where Merlin is certain (user confirmed or high-quality intel)
    const certainFieldsArray = Object.entries(meta)
      .filter(([, m]) => m.source === "user" || m.source === "location_intel")
      .map(([id]) => id);

    // Fields where Merlin is guessing (defaults only)
    const uncertainFieldsArray = Object.entries(meta)
      .filter(([, m]) => m.source === "template_default" || m.source === "question_default")
      .map(([id]) => id);

    // Fields that came from external observation (intel, detection)
    const observedFieldsArray = Object.entries(meta)
      .filter(([, m]) => m.source === "location_intel" || m.source === "business_detection")
      .map(([id]) => id);

    // === Performance: Convert to Sets for O(1) lookups ===
    const certainFieldsSet = new Set(certainFieldsArray);
    const uncertainFieldsSet = new Set(uncertainFieldsArray);
    const observedFieldsSet = new Set(observedFieldsArray);

    // === LAW 3: Evolution / Learning ===
    // What changed? What was corrected?

    // Fields with prev values (something changed)
    const changedFields = Object.entries(meta)
      .filter(([, m]) => m.prev !== undefined)
      .map(([id, m]) => ({ id, prev: m.prev, source: m.source }));

    // User corrections: fields where user overwrote something else
    const userCorrectionsArray = changedFields.filter((c) => {
      const currentMeta = meta[c.id];
      return currentMeta?.source === "user" && c.prev !== undefined;
    });
    const userCorrectionsSet = new Set(userCorrectionsArray.map((c) => c.id));

    // === Composite Signals ===

    // Overall readiness: are we ready to generate a trustworthy quote?
    // High when: completeness high + confidence reasonable + no errors
    const readiness = completeness * 0.6 + confidence * 0.4;

    // Humility level: how tentative should Merlin's presentation be?
    // High when confidence is low (more assumptions, less grounded data)
    const humility = 1 - confidence;

    // Phase awareness (from FSM)
    const phase = state.step3Status;
    const isObserving = phase === "template_loading" || phase === "defaults_applying";
    const isActive = phase === "part_active";
    const isProcessing = phase === "quote_generating" || phase === "validating";
    const isComplete = phase === "complete";

    return {
      // Law 1: Environment
      confidence, // 0-1: how grounded is our data?
      completeness, // 0-1: required fields filled
      groundedCount, // fields from real sources
      assumedCount, // fields from defaults (guessing)
      sourceBreakdown, // detailed source counts

      // Law 2: Understanding (arrays for iteration, Sets for O(1) lookup)
      certainFields: certainFieldsArray, // field IDs where we're confident
      uncertainFields: uncertainFieldsArray, // field IDs where we're guessing
      observedFields: observedFieldsArray, // field IDs from external observation

      // Law 3: Evolution
      changedFields, // fields that changed (with prev values)
      userCorrections: userCorrectionsArray, // fields user explicitly corrected
      hasLearned: userCorrectionsArray.length > 0, // has user taught us something?

      // Composite
      readiness, // 0-1: ready for quote?
      humility, // 0-1: how tentative should presentation be?

      // Phase (FSM pulse)
      phase,
      isObserving,
      isActive,
      isProcessing,
      isComplete,

      // === O(1) Lookup Helpers (use Sets internally) ===

      // Check if field is uncertain (O(1))
      isFieldUncertain: (fieldId: string): boolean => uncertainFieldsSet.has(fieldId),

      // Check if field was user-corrected (O(1))
      isFieldUserCorrected: (fieldId: string): boolean => userCorrectionsSet.has(fieldId),

      // Check if field is observed (O(1))
      isFieldObserved: (fieldId: string): boolean => observedFieldsSet.has(fieldId),

      // Check if field is certain (O(1))
      isFieldCertain: (fieldId: string): boolean => certainFieldsSet.has(fieldId),

      // Helper: get certainty for a specific field (O(1) via meta lookup)
      getFieldCertainty: (fieldId: string): "certain" | "observed" | "assumed" | "unknown" => {
        const m = meta[fieldId];
        if (!m) return "unknown";
        if (m.source === "user") return "certain";
        if (m.source === "location_intel" || m.source === "business_detection") return "observed";
        return "assumed";
      },

      // Helper: get human-readable attribution for a field (O(1))
      getFieldAttribution: (fieldId: string): string | null => {
        const m = meta[fieldId];
        if (!m) return null;
        switch (m.source) {
          case "user":
            return null; // User's own input—no attribution needed
          case "location_intel":
            return "From utility data for your area";
          case "business_detection":
            return "Detected from business profile";
          case "template_default":
            return "Typical for this industry";
          case "question_default":
            return "Standard assumption";
          default:
            return null;
        }
      },
    };
  }, [state.step3AnswersMeta, state.step3Answers, state.step3Template, state.step3Status]);

  /* ============================================================
     Return
  ============================================================ */

  return {
    state,
    progress,
    gates,
    lifeSignals, // Three Laws: environment, understanding, evolution

    // core controls
    resetSession,
    goBack,
    goToStep,

    // step 1: location
    updateLocationRaw,
    submitLocation,
    confirmLocation,
    primeLocationIntel,

    // step 1: goals
    setGoals,
    toggleGoal,
    confirmGoals,
    requestGoalsModal: useCallback(() => {
      dispatch({ type: "REQUEST_GOALS_MODAL" });
    }, []),

    // step 3.5: add-ons
    toggleSolar,
    toggleGenerator,
    toggleEV,
    confirmAddOns,

    // step 1: business (V6 parity)
    setBusinessDraft,
    confirmBusiness,
    skipBusiness,

    // step 2
    selectIndustry,

    // step 3
    setStep3Answer,
    setStep3Answers,
    applyIntelPatch, // Runtime intel updates (won't stomp user edits)
    resetToDefaults, // Explicit reset with provenance rewrite
    submitStep3,
    submitStep3Partial, // Escape hatch: navigate with incomplete answers

    // step 3 FSM controls
    markDefaultsApplied, // Record defaults applied for a part
    hasDefaultsApplied, // Check if defaults applied for a part
    goToNextPart, // Advance to next part (guarded)
    goToPrevPart, // Go back to previous part
    setPartIndex, // Jump to specific part

    // step 3 defaults helpers (SSOT-authoritative)
    partHasAnyDefaults, // Check if part has ANY defaults (template or question)
    canApplyDefaults, // partHasAnyDefaults && !hasDefaultsApplied
    canResetToDefaults, // partHasAnyDefaults (always show reset if defaults exist)
    getDefaultForQuestion, // Get default value for a specific question

    // step 4: pricing (Phase 6: non-blocking)
    retryPricing, // Retry pricing from Results page
    retryTemplate, // Retry industry template load (upgrade fallback → industry)
    recalculateWithAddOns, // Re-run pricing with new add-on config (solar/gen/wind)

    // step 5: MagicFit tier selection → update wizard quote
    updateQuote: useCallback((partial: Partial<QuoteOutput>) => {
      const merged: QuoteOutput = { ...state.quote, ...partial };
      dispatch({ type: "SET_QUOTE", quote: merged });

      // ✅ MERLIN MEMORY (Feb 11, 2026): Persist quote snapshot
      merlinMemory.set("quote", {
        peakLoadKW: merged.peakLoadKW,
        bessKWh: merged.bessKWh,
        bessMW: merged.bessKW ? merged.bessKW / 1000 : undefined,
        capexUSD: merged.capexUSD,
        totalCost: merged.capexUSD,
        netCost: merged.capexUSD,
        annualSavingsUSD: merged.annualSavingsUSD,
        annualSavings: merged.annualSavingsUSD,
        paybackYears: merged.paybackYears ?? merged.roiYears,
        npv: merged.npv,
        irr: merged.irr,
        generatedAt: Date.now(),
      });
    }, [state.quote]),

    // misc
    clearError,
    abortOngoing,

    // Computed helpers for next step
    // 6-step flow: location → industry → profile → options → magicfit → results
    nextStep: useCallback(() => {
      if (state.step === "location") {
        // Skip industry if already locked
        if (state.industryLocked && state.industry && state.industry !== "auto") {
          return "profile";
        }
        return "industry";
      }
      if (state.step === "industry") return "profile";
      if (state.step === "profile") return "options";
      if (state.step === "options") return "magicfit";
      if (state.step === "magicfit") return "results";
      return null;
    }, [state.step, state.industryLocked, state.industry]),
  };
}

/* ============================================================
   Helpers
============================================================ */

function normalizeError(err: unknown): WizardError {
  if (!err) return { code: "UNKNOWN", message: "Unknown error." };

  // Type guard for object with properties
  if (typeof err === "object" && "code" in err && "message" in err && err.code && err.message) {
    return {
      code: err.code as WizardError["code"],
      message: String(err.message),
      detail: "detail" in err ? err.detail : err,
    };
  }

  // Common fetch error shape
  if (typeof err === "object" && "name" in err && err.name === "AbortError") {
    return { code: "ABORTED", message: "Request aborted." };
  }

  return {
    code: "UNKNOWN",
    message: typeof err === "string" ? err : "Something went wrong.",
    detail: err,
  };
}

function isAbort(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  return ("name" in err && err.name === "AbortError") || ("code" in err && err.code === "ABORTED");
}

function validateStep3(
  template: Step3Template,
  answers: Step3Answers
): { ok: boolean; reason?: string } {
  // Get industry from template metadata
  const industry = String(
    (template as Record<string, unknown>).industry ??
    (template as Record<string, unknown>).industryId ??
    ""
  );

  // Get Tier 1 blockers for this industry (if configured)
  const blockerIds = getTier1Blockers(industry);

  // If no blockers configured, fall back to all required questions
  const questionsToCheck =
    blockerIds.length > 0
      ? template.questions.filter((q) => blockerIds.includes(q.id))
      : template.questions.filter((q) => q.required);

  for (const q of questionsToCheck) {
    const v = answers[q.id];
    const empty =
      v === null ||
      v === undefined ||
      (typeof v === "string" && v.trim() === "") ||
      (Array.isArray(v) && v.length === 0);
    if (empty) return { ok: false, reason: `Missing required: ${q.label}` };
  }
  return { ok: true };
}

/* ============================================================
   Exported Types (SSOT Contract)
   
   Use these Pick<> types in Step components to prevent drift:
   - Step1Actions = Pick<WizardV7Controller, "updateLocationRaw" | ...>
   - Step2Actions = Pick<WizardV7Controller, "goBack" | "selectIndustry">
   etc.
============================================================ */

export type WizardV7Controller = ReturnType<typeof useWizardV7>;
export type WizardV7State = WizardV7Controller["state"];
export type WizardV7Progress = WizardV7Controller["progress"];
export type WizardV7Gates = WizardV7Controller["gates"];
export type WizardV7LifeSignals = WizardV7Controller["lifeSignals"];
