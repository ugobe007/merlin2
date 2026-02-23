// src/wizard/v7/hooks/useWizardV7.ts
import { useCallback, useEffect, useMemo, useRef } from "react";
import { getTemplate } from "@/wizard/v7/templates/templateIndex";
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
import { devLog, devWarn, devError } from "@/wizard/v7/debug/devLog";
import { useWizardLocation } from "./useWizardLocation";
import { useWizardStep3 } from "./useWizardStep3";
import { useWizardAddOns } from "./useWizardAddOns";
import { useWizardLifecycle } from "./useWizardLifecycle";

// ✅ Op1e-1 (Feb 22, 2026): Extracted core state management
import { useWizardReducer, runContractQuote, type ContractQuoteResult as CoreContractResult } from "./useWizardCore";

// ✅ Op1e-2 (Feb 22, 2026): Extracted Step 2 industry selection
import { useWizardStep2 } from "./useWizardStep2";

// ✅ Op1e-3 (Feb 22, 2026): Extracted pricing engine
import { useWizardPricing, retry as retryWithBackoff } from "./useWizardPricing";

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
export function getNormalizedZip(state: WizardState): string {
  const raw = state.location?.postalCode ?? state.locationRawInput ?? "";
  return raw.replace(/\D/g, "").slice(0, 5);
}

/** Strip to exactly 5 digits (or fewer if input is short). */
function normalizeZip5(s: string): string {
  return (s ?? "").replace(/\D/g, "").slice(0, 5);
}

/** True when the string contains a valid US 5-digit ZIP. */
function _isZip5(s: string): boolean {
  return normalizeZip5(s).length === 5;
}

function _hasState(location: LocationCard | null): boolean {
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
  if ((prefix >= 300 && prefix <= 319) || prefix === 398 || prefix === 399) return "GA";
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
  if ((prefix >= 750 && prefix <= 799) || (prefix >= 885 && prefix <= 888)) return "TX";
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
                solarMW:
                  addOns?.includeSolar && addOns.solarKW > 0 ? addOns.solarKW / 1000 : undefined,
                generatorMW:
                  addOns?.includeGenerator && addOns.generatorKW > 0
                    ? addOns.generatorKW / 1000
                    : undefined,
                generatorFuelType: addOns?.includeGenerator ? addOns.generatorFuelType : undefined,
                windMW: addOns?.includeWind && addOns.windKW > 0 ? addOns.windKW / 1000 : undefined,
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
            // Advanced analysis enabled — 8760 + Monte Carlo + degradation (Feb 2026)
            includeAdvancedAnalysis: true,
            // ITC bonus qualifications from Step 4 (IRA 2022)
            itcBonuses: addOns?.itcBonuses ?? undefined,
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
          devWarn("[V7 Pricing] Layer B error (non-blocking):", errMsg);
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
                // Equipment cost breakdown for unit economics (Feb 2026)
                equipmentCosts: (() => {
                  const bd = pricingResult.data.breakdown;
                  if (!bd) return undefined;
                  const bessKWh = bd.batteries
                    ? bd.batteries.unitEnergyMWh * bd.batteries.quantity * 1000
                    : 0;
                  const bessKW = bd.batteries
                    ? bd.batteries.unitPowerMW * bd.batteries.quantity * 1000
                    : 0;
                  const gross = pricingResult.data.grossCost;
                  return {
                    batteryCost: bd.batteries?.totalCost,
                    batteryPerKWh:
                      bessKWh > 0 ? Math.round(bd.batteries.totalCost / bessKWh) : undefined,
                    inverterCost: bd.inverters?.totalCost,
                    inverterPerKW:
                      bessKW > 0 ? Math.round(bd.inverters.totalCost / bessKW) : undefined,
                    transformerCost: bd.transformers?.totalCost,
                    switchgearCost: bd.switchgear?.totalCost,
                    solarCost: bd.solar?.totalCost,
                    solarPerWatt: bd.solar?.costPerWatt,
                    generatorCost: bd.generators?.totalCost,
                    generatorPerKW: bd.generators?.costPerKW,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    installationCost: (pricingResult.data as any).financials?.installationCost,
                    totalEquipmentCost: pricingResult.data.baseCost,
                    allInPerKW: bessKW > 0 ? Math.round(gross / bessKW) : undefined,
                    allInPerKWh: bessKWh > 0 ? Math.round(gross / bessKWh) : undefined,
                  };
                })(),
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
                // Rich metadata from SSOT (Feb 2026)
                metadata: pricingResult.data.metadata ?? undefined,
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
            (template?.industry as string) === "generic" ||
            (template?._effectiveTemplate as string) === "generic"
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
          devWarn(
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
            totalProjectCost: pd.grossCost, // gross before ITC (from pricingBridge)
            taxCredit: pd.itcAmount, // dynamic ITC from IRA 2022 calculator
            netCost: pd.capexUSD,
            annualSavings: pd.annualSavingsUSD,
            demandChargeSavings: mergedQuote.demandChargeSavings,
            paybackYears: pd.roiYears,
            roi10Year: fin?.roi10Year ?? 0,
            roi25Year: fin?.roi25Year ?? 0,
            npv: fin?.npv ?? 0,
            irr: fin?.irr ?? 0,
            itcRate: pd.itcRate, // dynamic ITC rate from IRA 2022 calculator
            itcAmount: pd.itcAmount,
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

        devError("[V7 Pricing] Error:", errMsg, err);

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
      devWarn("[V7] Cannot retry pricing: industry not set");
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
  }, [
    runPricingSafe,
    state.industry,
    state.step3Answers,
    state.location,
    state.locationIntel,
    state.step4AddOns,
  ]);

  // recalculateWithAddOns extracted to useWizardAddOns (Op1c - Feb 22, 2026)

  /**
   * retryTemplate — Attempt to reload an industry-specific template when currently in fallback mode.
   * Exposed to Step 4 so users can upgrade from "Estimate" → "TrueQuote™" without restarting.
   */
  const retryTemplate = useCallback(async () => {
    if (state.industry === "auto") {
      devWarn("[V7] Cannot retry template: industry not set");
      return;
    }
    if (state.templateMode === "industry") {
      devLog("[V7] Already have industry template — skipping retry");
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

      devLog(
        "[V7] Template retry result:",
        (template.industry as string) === "generic" ? "fallback" : "industry"
      );
    } catch (err) {
      devWarn("[V7] Template retry failed:", err instanceof Error ? err.message : err);
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

  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  };

  const _retry = async <T>(
    fn: () => Promise<T>,
    options: { attempts?: number; baseDelayMs?: number; timeoutMs?: number } = {}
  ): Promise<T> => {
    const { attempts = 3, baseDelayMs = 250, timeoutMs = 9000 } = options;
    let lastError: Error | null = null;

    for (let i = 0; i < attempts; i++) {
      try {
        devLog(`[V7 SSOT] Attempt ${i + 1}/${attempts}`);
        return await withTimeout(fn(), timeoutMs);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        devWarn(`[V7 SSOT] Attempt ${i + 1} failed:`, lastError.message);

        if (i < attempts - 1) {
          const delay = baseDelayMs * Math.pow(2, i); // Exponential backoff: 250ms, 500ms, 1000ms
          devLog(`[V7 SSOT] Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  };

  // ============================================================
  // Pricing Engine (Op1e-3 - Extracted Feb 22, 2026)
  // ============================================================
  // Extracted ~560 lines to useWizardPricing.ts
  // - runPricingSafe (Layer A + Layer B with timeout/retry)
  // - retryPricing (retry from Results page)
  // - retryTemplate (upgrade from fallback to industry template)
  // - Request key generation for stale-write protection
  // - Confidence scoring
  // - Merlin Memory persistence
  // ============================================================

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
          setError({
            code: "STATE",
            message: "Step 3 incomplete. Please answer all required questions.",
          });
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
      [state.quote]
    ),

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
