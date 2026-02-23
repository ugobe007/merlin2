// src/wizard/v7/hooks/useWizardV7.ts
import { useCallback, useMemo, useRef } from "react";
import { getTier1Blockers } from "@/wizard/v7/schema/curatedFieldsResolver";

// Industry Context — SSOT resolver (Feb 7, 2026)

// SSOT Pricing Bridge (Feb 3, 2026)

// ✅ MERLIN MEMORY (Feb 11, 2026): Persistent store for cross-step data
// Steps are momentary — memory is persistent. No more cross-step flag dependencies.
import { merlinMemory } from "@/wizard/v7/memory";
import { useWizardLocation } from "./useWizardLocation";
import { useWizardStep3 } from "./useWizardStep3";
import { useWizardAddOns } from "./useWizardAddOns";
import { useWizardLifecycle } from "./useWizardLifecycle";

// ✅ Op1e-1 (Feb 22, 2026): Extracted core state management
import { useWizardReducer } from "./useWizardCore";

// ✅ Op1e-2 (Feb 22, 2026): Extracted Step 2 industry selection
import { useWizardStep2 } from "./useWizardStep2";

// ✅ Op1e-3 (Feb 22, 2026): Extracted pricing engine
import { useWizardPricing } from "./useWizardPricing";

// ✅ Op1e-4 (Feb 22, 2026): Extracted navigation logic
import {
  useWizardNavigation,
  buildMinimalLocationFromZip,
  stepCanProceed,
} from "./useWizardNavigation";

// ✅ Wizard API (Feb 22, 2026): External service integrations
import { wizardAPI as api } from "@/wizard/v7/api/wizardAPI";

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
export type ITCBonuses = {
  prevailingWage: boolean;
  energyCommunity: boolean | "coal-closure" | "brownfield" | "fossil-fuel-employment";
  domesticContent: boolean;
  lowIncome: boolean | "located-in" | "serves";
};

export type SystemAddOns = {
  includeSolar: boolean;
  solarKW: number;
  includeGenerator: boolean;
  generatorKW: number;
  generatorFuelType: "natural-gas" | "diesel" | "dual-fuel";
  includeWind: boolean;
  windKW: number;
  /** ITC bonus qualifications (IRA 2022) — drives dynamic ITC rate */
  itcBonuses?: ITCBonuses;
};

export const DEFAULT_ITC_BONUSES: ITCBonuses = {
  prevailingWage: true, // Most commercial projects meet PWA
  energyCommunity: false,
  domesticContent: false,
  lowIncome: false,
};

export const DEFAULT_ADD_ONS: SystemAddOns = {
  includeSolar: false,
  solarKW: 0,
  includeGenerator: false,
  generatorKW: 0,
  generatorFuelType: "natural-gas",
  includeWind: false,
  windKW: 0,
  itcBonuses: DEFAULT_ITC_BONUSES,
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
  capexUSD?: number; // Net cost (after ITC)
  grossCost?: number; // Total project cost BEFORE ITC
  itcAmount?: number; // ITC credit dollar amount
  itcRate?: number; // ITC rate applied (e.g. 0.30)
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

  // Equipment cost breakdown (from Layer B) — for unit economics display
  equipmentCosts?: {
    batteryCost?: number; // Total battery cost
    batteryPerKWh?: number; // $/kWh for battery pack
    inverterCost?: number; // Total inverter/PCS cost
    inverterPerKW?: number; // $/kW for PCS
    transformerCost?: number; // Total transformer cost
    switchgearCost?: number; // Total switchgear cost
    solarCost?: number; // Total solar cost
    solarPerWatt?: number; // $/W for solar
    generatorCost?: number; // Total generator cost
    generatorPerKW?: number; // $/kW for generator
    installationCost?: number; // Total installation/BOS/EPC
    totalEquipmentCost?: number; // Sum of all equipment (pre-margin)
    allInPerKW?: number; // Total $/kW (grossCost / powerKW)
    allInPerKWh?: number; // Total $/kWh (grossCost / energyKWh)
  };

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

  // ─── Rich metadata from SSOT (Feb 2026) ───
  metadata?: {
    itcDetails?: {
      totalRate: number;
      baseRate: number;
      creditAmount: number;
      qualifications: {
        prevailingWage: boolean;
        energyCommunity: boolean;
        domesticContent: boolean;
        lowIncome: boolean;
      };
      source: string;
    };
    utilityRates?: {
      electricityRate: number;
      demandCharge: number;
      utilityName?: string;
      rateName?: string;
      source: string;
      confidence: string;
      zipCode?: string;
      state?: string;
    };
    degradation?: {
      chemistry: string;
      yearlyCapacityPct: number[];
      year10CapacityPct: number;
      year25CapacityPct: number;
      warrantyPeriod: number;
      expectedWarrantyCapacity: number;
      financialImpactPct: number;
      source: string;
    };
    solarProduction?: {
      annualProductionKWh: number;
      capacityFactorPct: number;
      source: string;
      arrayType?: string;
      state?: string;
      monthlyProductionKWh?: number[];
    };
    advancedAnalysis?: {
      hourlySimulation?: {
        annualSavings: number;
        touArbitrageSavings: number;
        peakShavingSavings: number;
        solarSelfConsumptionSavings: number;
        demandChargeSavings: number;
        equivalentCycles: number;
        capacityFactor: number;
        source: string;
      };
      riskAnalysis?: {
        npvP10: number;
        npvP50: number;
        npvP90: number;
        irrP10: number;
        irrP50: number;
        irrP90: number;
        paybackP10: number;
        paybackP50: number;
        paybackP90: number;
        probabilityPositiveNPV: number;
        valueAtRisk95: number;
        source: string;
      };
    };
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
  | "lower_bills"
  | "backup_power"
  | "reduce_carbon"
  | "energy_independence"
  | "reduce_demand_charges";

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

export type Intent =
  | { type: "HYDRATE_START" }
  | { type: "HYDRATE_SUCCESS"; payload: Partial<WizardState> }
  | { type: "HYDRATE_FAIL"; error: WizardError }
  | { type: "SET_BUSY"; isBusy: boolean; busyLabel?: string }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_ERROR"; error: WizardError }
  | { type: "SET_STEP"; step: WizardStep; reason?: string }
  | { type: "PUSH_HISTORY"; step: WizardStep }
  | { type: "GO_BACK" }
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
  | { type: "SET_SOLAR_SIZING"; solarKW: number }
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
   Core State Management - EXTRACTED (Op1e-1 - Feb 22, 2026)
   ============================================================
   The following have been moved to useWizardCore.ts:
   - STORAGE_KEY constant + safeJsonParse/createSessionId/nowISO helpers
   - runContractQuote function (~263 lines) - Layer A calculator execution
   - initialState function (~70 lines) - Initial wizard state factory
   - reduce function (~716 lines) - Main reducer with 44 intent types
   - useWizardReducer hook - Wraps useReducer with core functions
   
   Total extracted: ~1,094 lines (3,369 → 2,275 lines)
============================================================ */

/* ============================================================
   Validation & Gate Helpers
============================================================ */

/**
 * getNormalizedZip - Extract and normalize ZIP code from wizard state
 *
 * Priority order:
 * 1. state.location.postalCode (confirmed location)
 * 2. state.locationRawInput (user typing)
 *
 * Returns: 5-digit ZIP (or fewer if incomplete)
 *
 * This prevents "ZIP value drift" between state.location.zip/postalCode/locationRawInput
 */
/* ============================================================
   Hook
============================================================ */

/* ============================================================
   Op1e-4 EXTRACTION (Feb 22, 2026):
   Navigation logic extracted to useWizardNavigation.ts
   
   EXTRACTED:
   - getNormalizedZip (exported helper)
   - normalizeZip5, _isZip5, _hasState (internal helpers)
   - hasValidLocation, getStateFromZipPrefix, buildMinimalLocationFromZip
   - stepCanProceed (gate validation)
   - goToStep callback (~142 lines)
   - nextStep callback (~13 lines)
   
   TOTAL EXTRACTED: ~323 lines
   
   NOW IN: useWizardNavigation.ts
============================================================ */

export function useWizardV7() {
  // ✅ Op1e-1 (Feb 22, 2026): Use extracted core reducer
  const [state, dispatch] = useWizardReducer();

  // Abort controllers for side-effects
  const abortRef = useRef<AbortController | null>(null);

  // ============================================================
  // Lifecycle & Session Management: Hook Invocation (Op1d - Feb 22, 2026)
  // ============================================================
  const lifecycleActions = useWizardLifecycle({
    state,
    dispatch: dispatch as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    abortRef,
  });

  // Extract actions for use in other hooks and callbacks
  const { abortOngoing, setBusy, setError, clearError, resetSession, setStep, goBack } =
    lifecycleActions;

  // ============================================================
  // Step 1: Location (extracted to useWizardLocation hook)
  // ============================================================
  const locationActions = useWizardLocation({
    state: {
      locationRawInput: state.locationRawInput,
      location: state.location,
      locationConfirmed: state.locationConfirmed,
      locationIntel: state.locationIntel,
      businessDraft: state.businessDraft,
      businessCard: state.businessCard,
      businessConfirmed: state.businessConfirmed,
      goalsConfirmed: state.goalsConfirmed,
      step: state.step,
    },
    dispatch,
    clearError,
    setError,
    setBusy,
    abortOngoing,
    setStep,
    abortRef,
    api,
  });

  // ============================================================
  // Step 2: Industry Selection (Op1e-2 - Extracted Feb 22, 2026)
  // ============================================================
  // Extracted ~188 lines to useWizardStep2.ts
  // - Template loading and validation
  // - Schema + template + intel + business defaults merging
  // - Fallback recovery path
  // - Merlin Memory integration
  // ============================================================

  const step2Actions = useWizardStep2({
    location: state.location,
    locationIntel: state.locationIntel,
    businessCard: state.businessCard,
    dispatch,
    clearError,
    setBusy,
    setError,
    setStep,
    abortOngoing,
    abortRef,
  });

  const { selectIndustry } = step2Actions;

  const pricingActions = useWizardPricing({
    industry: state.industry,
    step3Answers: state.step3Answers,
    step3AnswersMeta: state.step3AnswersMeta,
    step3Template: state.step3Template,
    location: state.location,
    locationIntel: state.locationIntel,
    templateMode: state.templateMode,
    step4AddOns: state.step4AddOns,
    dispatch,
    setBusy,
    abortRef,
  });

  const { runPricingSafe, retryPricing, retryTemplate } = pricingActions;

  // ============================================================
  // Navigation & Gate Validation
  // ============================================================
  // Step 3: Hook Invocation (Op1b - Feb 22, 2026)
  // ============================================================
  const step3Actions = useWizardStep3({
    state: {
      step: state.step,
      industry: state.industry,
      step3Answers: state.step3Answers,
      step3AnswersMeta: state.step3AnswersMeta,
      step3Template: state.step3Template || undefined,
      step3DefaultsAppliedParts: state.step3DefaultsAppliedParts,
      locationIntel: state.locationIntel || undefined,
      businessCard: state.businessCard || undefined,
      location: state.location || undefined,
      locationConfirmed: state.locationConfirmed,
      goalsConfirmed: state.goalsConfirmed,
      step3Complete: state.step3Complete,
      pricingStatus: state.pricingStatus,
      step4AddOns: state.step4AddOns,
    },
    dispatch: dispatch as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    api: api as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    clearError,
    setError,
    abortOngoing,
    setStep: setStep as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    runPricingSafe,
    buildMinimalLocationFromZip: (minState) =>
      buildMinimalLocationFromZip({ ...state, ...minState }),
  });

  // ============================================================
  // Goals & Add-ons: Hook Invocation (Op1c - Feb 22, 2026)
  // ============================================================
  const addOnsActions = useWizardAddOns({
    state: {
      goals: state.goals,
      industry: state.industry,
      step3Answers: state.step3Answers,
      location: state.location,
      locationIntel: state.locationIntel,
    },
    dispatch: dispatch as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    runPricingSafe,
  });

  // ============================================================
  // Navigation: goToStep + nextStep (extracted to useWizardNavigation hook - Op1e-4 Feb 22, 2026)
  // ============================================================
  const navigationActions = useWizardNavigation({
    state,
    dispatch,
    clearError,
    setBusy,
    setError,
    setStep,
    abortRef,
  });

  const { goToStep, nextStep } = navigationActions;

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
      currentStep === "profile" ||
      currentStep === "options" ||
      currentStep === "magicfit" ||
      currentStep === "results"
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

    // step 1: location (from useWizardLocation hook)
    ...locationActions,

    // step 1: goals & step 4: add-ons (extracted to useWizardAddOns hook - Op1c Feb 22, 2026)
    ...addOnsActions,

    // step 2
    selectIndustry,

    // step 3 (extracted to useWizardStep3 hook - Op1b Feb 22, 2026)
    ...step3Actions,

    // step 4: pricing (Phase 6: non-blocking)
    retryPricing, // Retry pricing from Results page
    retryTemplate, // Retry industry template load (upgrade fallback → industry)
    // recalculateWithAddOns now in addOnsActions (Op1c - Feb 22, 2026)

    // step 5: MagicFit tier selection → update wizard quote
    updateQuote: useCallback(
      (partial: Partial<QuoteOutput>) => {
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
      },
      [state.quote, dispatch]
    ),

    // misc
    clearError,
    abortOngoing,

    // nextStep: computed helper for next step (from navigationActions)
    nextStep,
  };
}

/* ============================================================
   Helpers
============================================================ */

function _normalizeError(err: unknown): WizardError {
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

function _isAbort(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  return ("name" in err && err.name === "AbortError") || ("code" in err && err.code === "ABORTED");
}

function _validateStep3(
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
