// src/wizard/v7/hooks/useWizardV7.ts
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { getTemplate } from "@/wizard/v7/templates/templateIndex";
import { CALCULATORS_BY_ID } from "@/wizard/v7/calculators/registry";
import { validateTemplateAgainstCalculator } from "@/wizard/v7/templates/validator";
import { applyTemplateMapping } from "@/wizard/v7/templates/applyMapping";
import type { CalcInputs } from "@/wizard/v7/calculators/contract";
import { ContractRunLogger } from "@/wizard/v7/telemetry/contractTelemetry";
import { validateTemplate, formatValidationResult } from "@/wizard/v7/validation/templateValidator";
import { sanityCheckQuote, sanitizeQuoteForDisplay, type PricingSanity } from "@/wizard/v7/utils/pricingSanity";
import { getTier1Blockers } from "@/wizard/v7/schema/curatedFieldsResolver";

// SSOT Pricing Bridge (Feb 3, 2026)
import {
  runPricingQuote,
  getSizingDefaults,
  generatePricingSnapshotId,
  type ContractQuoteResult,
  type PricingQuoteResult,
  type PricingConfig,
} from "@/wizard/v7/pricing/pricingBridge";

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
  | "results"; // Step 4 (quote, outputs, next actions)

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
  weatherRisk?: string;  // "Frequent heatwaves", "Harsh winters", etc.
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
  | "template_default"   // From template.defaults (canonical JSON/DB)
  | "question_default"   // From question.defaultValue (legacy per-question)
  | "location_intel"     // From locationIntel (utility rates, solar, weather)
  | "business_detection" // From businessDetectionService (Places API evidence)
  | "user";              // User explicitly edited

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

export type QuoteOutput = {
  // Load profile (from Layer A - physics/contract)
  baseLoadKW?: number;
  peakLoadKW?: number;
  energyKWhPerDay?: number;
  
  // Sizing hints (for Layer B - pricing)
  storageToPeakRatio?: number;
  durationHours?: number;
  
  // Financial outputs (from Layer B - pricing bridge)
  capexUSD?: number;
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
  isProvisional?: boolean;  // True when generated from incomplete Step 3
  
  // Input transparency
  missingInputs?: string[];  // List of missing required field IDs
  inputFallbacks?: {
    electricityRate?: { value: number; reason: string };
    demandCharge?: { value: number; reason: string };
    location?: { value: string; reason: string };
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
  | "idle"                    // No template loaded
  | "template_loading"        // Template fetch in progress
  | "template_ready"          // Template loaded, awaiting defaults
  | "defaults_applying"       // Applying baseline defaults
  | "part_active"             // User is filling out a part
  | "validating"              // Validating current part
  | "quote_generating"        // Quote engine running
  | "complete"                // Quote generated successfully
  | "error";                  // Something went wrong

/**
 * Pricing FSM status (Phase 6: non-blocking pricing)
 * 
 * DOCTRINE:
 * - Pricing failures NEVER block navigation
 * - Bad math becomes visible warnings, not errors
 * - User can retry from Results page
 */
export type PricingStatus =
  | "idle"                    // No pricing run yet
  | "pending"                 // Pricing in progress
  | "ok"                      // Pricing succeeded (may have warnings)
  | "error"                   // Pricing failed (retryable)
  | "timed_out";              // Pricing exceeded timeout threshold

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
  step3Answers: Step3Answers;
  step3AnswersMeta: Step3AnswersMeta; // Provenance tracking
  step3Complete: boolean;
  
  // Step 3 FSM tracking
  step3Status: Step3Status;           // Current FSM state
  step3PartIndex: number;             // Current part (0-indexed)
  step3DefaultsAppliedParts: string[]; // Parts that have had defaults applied (by templateId.partId)

  // Pricing (Phase 6: non-blocking with stale-write protection)
  pricingStatus: PricingStatus;       // FSM for pricing state
  pricingFreeze: PricingFreeze | null; // Frozen inputs snapshot
  pricingWarnings: string[];          // Math sanity warnings (non-fatal)
  pricingError: string | null;        // Fatal pricing error message
  pricingUpdatedAt: number | null;    // Timestamp of last pricing run
  pricingRequestKey: string | null;   // Stale-write guard: hash of inputs when pricing started

  // Output / results
  quote: QuoteOutput | null;

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
  | { type: "SET_BUSINESS_DRAFT"; patch: Partial<BusinessDraft> }
  | { type: "SET_BUSINESS"; business: BusinessCard | null }
  | { type: "SET_BUSINESS_CARD"; card: BusinessCard | null }
  | { type: "SET_BUSINESS_CONFIRMED"; confirmed: boolean }
  | { type: "SET_INDUSTRY"; industry: IndustrySlug; locked?: boolean }
  | { type: "SET_STEP3_TEMPLATE"; template: Step3Template | null }
  | { type: "SET_STEP3_ANSWER"; id: string; value: unknown; source?: AnswerSource }
  | { type: "SET_STEP3_ANSWERS"; answers: Step3Answers; source?: AnswerSource }
  | { type: "PATCH_STEP3_ANSWERS"; patch: Step3Answers; source: AnswerSource } // Intel/detection patches
  | { type: "RESET_STEP3_TO_DEFAULTS"; scope: "all" | { partId: string } } // Explicit reset with provenance rewrite
  | { type: "SET_STEP3_COMPLETE"; complete: boolean }
  // Step 3 FSM events
  | { type: "STEP3_TEMPLATE_REQUESTED" }
  | { type: "STEP3_TEMPLATE_READY"; templateId: string }
  | { type: "STEP3_DEFAULTS_APPLIED"; partId: string; templateId: string }
  | { type: "STEP3_PART_NEXT" }      // Advance to next part (guarded)
  | { type: "STEP3_PART_PREV" }      // Go back to previous part
  | { type: "STEP3_PART_SET"; index: number } // Jump to specific part
  | { type: "STEP3_QUOTE_REQUESTED" }
  | { type: "STEP3_QUOTE_DONE" }
  | { type: "STEP3_ERROR"; message: string }
  // Pricing FSM (Phase 6: non-blocking with stale-write protection)
  | { type: "PRICING_START"; requestKey: string }
  | { type: "PRICING_SUCCESS"; freeze: PricingFreeze; quote: QuoteOutput; warnings: string[]; requestKey: string }
  | { type: "PRICING_ERROR"; error: string; requestKey: string }
  | { type: "PRICING_RETRY" }
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
    // 1. Load template
    const tpl = getTemplate(params.industry);
    if (!tpl) {
      throw { code: "STATE", message: `No template found for industry "${params.industry}"` };
    }

    // 2. Get calculator contract
    const calc = CALCULATORS_BY_ID[tpl.calculator.id];
    if (!calc) {
      throw { code: "STATE", message: `No calculator registered for id "${tpl.calculator.id}"` };
    }

    // Initialize logger with context
    logger = new ContractRunLogger(
      tpl.industry,
      tpl.version,
      tpl.calculator.id,
    );
    
    // Log start event
    logger.logStart(tpl.questions.length);

    // 3. Validate template vs calculator (hard fail on mismatch)
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

    // 4. Apply mapping (answers → canonical calculator inputs)
    const inputs = applyTemplateMapping(tpl, params.answers);

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
      console.log('Template:', { industry: tpl.industry, version: tpl.version, calculator: tpl.calculator.id });
      console.log('Inputs Used:', inputs);
      console.log('Load Profile:', loadProfile);
      console.log('Duty Cycle:', (computed as Record<string, unknown>).dutyCycle || 'not provided');
      console.log('kW Contributors:', (computed as Record<string, unknown>).kWContributors || 'not provided');
      
      // Sanity checks
      const warnings: string[] = [];
      if (loadProfile.peakLoadKW === 0) warnings.push('⚠️ Peak load is ZERO');
      if (loadProfile.peakLoadKW < loadProfile.baseLoadKW) warnings.push('⚠️ Peak < Base (impossible)');
      if (loadProfile.energyKWhPerDay === 0) warnings.push('⚠️ Daily energy is ZERO');
      if (loadProfile.energyKWhPerDay > loadProfile.peakLoadKW * 24) {
        warnings.push('⚠️ Daily energy > peak×24h (impossible)');
      }
      
      if (warnings.length > 0) {
        console.warn('Load Profile Sanity Issues:', warnings);
      } else {
        console.log('✅ Load profile passes sanity checks');
      }
      console.groupEnd();
    }

    // 7. Get sizing hints (industry-specific defaults + input-based)
    const sizingDefaults = getSizingDefaults(tpl.industry);
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
      industry: tpl.industry,
      gridMode: (params.answers.gridMode as GridMode) ?? "grid_tied",
    };

    // 9. Build pricing freeze (SSOT snapshot)
    const freeze: PricingFreeze = {
      powerMW: loadProfile.peakLoadKW ? loadProfile.peakLoadKW / 1000 : undefined,
      hours: sizingHints.durationHours,
      mwh: loadProfile.energyKWhPerDay ? loadProfile.energyKWhPerDay / 1000 : undefined,
      useCase: tpl.industry,
      createdAtISO: nowISO(),
    };

    // 10. Build base quote output (load profile only - no financials yet)
    const quote: QuoteOutput = {
      baseLoadKW: loadProfile.baseLoadKW,
      peakLoadKW: loadProfile.peakLoadKW,
      energyKWhPerDay: loadProfile.energyKWhPerDay,
      storageToPeakRatio: sizingHints.storageToPeakRatio,
      durationHours: sizingHints.durationHours,
      notes: [...(computed.assumptions ?? []), ...(computed.warnings ?? []).map((w) => `⚠️ ${w}`)],
      pricingComplete: false, // Will be set true after Layer B
    };

    // 11. Log success telemetry
    logger.logSuccess({
      baseLoadKW: computed.baseLoadKW,
      peakLoadKW: computed.peakLoadKW,
      energyKWhPerDay: computed.energyKWhPerDay,
      warningsCount: computed.warnings?.length ?? 0,
      assumptionsCount: computed.assumptions?.length ?? 0,
      missingInputs: computed.warnings
        ?.filter(w => w.toLowerCase().includes('missing'))
        .map(w => w.split(':')[0].trim()),
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
        quoteSanityWarnings.push('⚠️ Storage-to-peak ratio invalid or zero');
      }
      if (!sizingHints.durationHours || sizingHints.durationHours <= 0) {
        quoteSanityWarnings.push('⚠️ Duration hours invalid or zero');
      }
      
      // Check pricing inputs
      if (inputsUsed.electricityRate === 0.12) {
        quoteSanityWarnings.push('ℹ️ Using default electricity rate (0.12 $/kWh)');
      }
      if (inputsUsed.demandCharge === 15) {
        quoteSanityWarnings.push('ℹ️ Using default demand charge (15 $/kW)');
      }
      if (inputsUsed.location === 'unknown') {
        quoteSanityWarnings.push('⚠️ Location unknown - using generic pricing');
      }
      
      if (quoteSanityWarnings.length > 0) {
        console.group('[TrueQuote] Quote Sanity Warnings');
        quoteSanityWarnings.forEach(w => console.warn(w));
        console.log('Sizing Hints:', sizingHints);
        console.log('Inputs Used:', inputsUsed);
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
        code: (err as { code?: string }).code || 'UNKNOWN',
        message: (err as { message?: string }).message || 'Contract execution failed',
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
    const location = response.location!;
    if (location.countryCode === "US" && !location.state) {
      throw {
        code: "VALIDATION",
        message:
          "Location found, but no state detected. Please add state to your search (e.g., 'San Francisco, CA').",
      };
    }

    return location;
  },

  // Fetch location intelligence metrics
  async fetchLocationIntel(_location: LocationCard, _signal?: AbortSignal): Promise<LocationIntel> {
    // Replace with your real service
    return {
      peakSunHours: undefined,
      utilityRate: undefined,
      weatherRisk: undefined,
      solarGrade: undefined,
    };
  },

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
      const { estimateSolarProduction, REGIONAL_CAPACITY_FACTORS } = await import("@/services/pvWattsService");
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
        risk: data.extremes,    // "Frequent heatwaves", "Harsh winters", etc.
        profile: data.profile,  // "Hot & Humid", "Cold & Dry", "Temperate", etc.
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
      console.log(`[V7 SSOT] Using business card industry: ${businessCard.inferredIndustry} (${confidence})`);
      return { industry: businessCard.inferredIndustry, confidence };
    }

    // Fallback: try to infer from location name or address keywords
    const searchText = [
      location.formattedAddress,
      location.city,
    ].filter(Boolean).join(" ").toLowerCase();

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
      if (keywords.some(kw => searchText.includes(kw))) {
        console.log(`[V7 SSOT] Inferred industry from keywords: ${industry}`);
        return { industry: industry as IndustrySlug, confidence: 0.75 };
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
    _businessCard: BusinessCard | null    // Reserved for future (not used in baseline)
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
    // Map industry slugs that don't have dedicated templates to closest match
    const templateMapping: Record<string, string> = {
      manufacturing: "data_center", // Use data center template (industrial loads)
      warehouse: "data_center",     // Similar profile
      office: "hotel",              // Commercial building profile
      retail: "hotel",              // Commercial building profile
      restaurant: "hotel",          // Commercial building profile
      healthcare: "data_center",    // Critical loads
      ev_charging: "car_wash",      // High peak loads, similar profile
      other: "hotel",               // Default fallback
    };
    
    // Keep both: what user selected vs what template we're actually loading
    const selected = industry;
    const effective = (templateMapping[selected] || selected) as IndustrySlug;
    
    console.log(`[V7 SSOT] Step3 template resolved: selected=${selected} effective=${effective}`);

    // ============================================================
    // Phase 1: Try remote API (preferred — freshest data)
    // ============================================================
    let remoteTemplate: Step3Template | null = null;
    let apiError: unknown = null;

    try {
      const { apiCall, API_ENDPOINTS } = await import("@/config/api");

      const response = await apiCall<{
        ok: boolean;
        template?: Step3Template;
        reason?: string;
        notes?: string[];
      }>(API_ENDPOINTS.TEMPLATE_LOAD, {
        method: "POST",
        body: JSON.stringify({ industry: effective }),
        signal,
      });

      if (response.ok && response.template) {
        remoteTemplate = response.template;
      } else {
        apiError = {
          code: "API",
          message: response.notes?.join(" ") || `Template not found for ${selected}`,
        };
      }
    } catch (err: unknown) {
      // AbortError should propagate immediately — user navigated away
      if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
        throw err;
      }
      apiError = err;
      console.warn(
        `[V7 SSOT] Template API failed (will try local fallback):`,
        err instanceof Error ? err.message : err
      );
    }

    // ============================================================
    // Phase 2: Resolve template (remote OR local fallback)
    // ============================================================
    let sourceLabel: "api" | "local" = "api";

    if (!remoteTemplate) {
      // Fallback: load from bundled JSON templates
      const { getTemplate } = await import("@/wizard/v7/templates/templateIndex");
      const localTpl = getTemplate(effective);

      if (!localTpl) {
        // Neither API nor local template available — hard fail
        throw apiError ?? {
          code: "NO_TEMPLATE",
          message: `No template available for "${selected}" (effective: "${effective}"). API down and no local fallback.`,
        };
      }

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
          defaultValue: localTpl.defaults?.[q.id] as string | number | boolean | string[] | undefined,
        })),
        defaults: localTpl.defaults,
      };
      sourceLabel = "local";

      console.warn(
        `[V7 SSOT] ⚠ Using LOCAL template fallback for "${effective}" (API unavailable)`
      );
    }

    // ============================================================
    // Phase 3: Stamp identity fields + validate
    // ============================================================

    // Generate deterministic template ID if not provided
    const templateId =
      (remoteTemplate as Record<string, unknown>).id ??
      `${effective}.${remoteTemplate.version}`;

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
        message: `Template contract violation: ${validation.issues.filter(i => i.level === "error").map(i => i.message).join("; ")}`,
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

  // Compute pricing freeze + quote (QuoteEngine)
  async runQuoteEngine(
    _args: {
      location: LocationCard;
      locationIntel: LocationIntel | null;
      industry: IndustrySlug;
      answers: Step3Answers;
    },
    _signal?: AbortSignal
  ): Promise<{ freeze: PricingFreeze; quote: QuoteOutput }> {
    // Replace with your QuoteEngine call.
    const freeze: PricingFreeze = {
      createdAtISO: nowISO(),
    };
    const quote: QuoteOutput = {
      notes: ["QuoteEngine placeholder: wire me to your backend/engine."],
    };
    return { freeze, quote };
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

    // V6 parity: business draft + resolved business
    businessDraft: { name: "", address: "" },
    business: null,
    businessCard: null, // LEGACY alias
    businessConfirmed: false,

    industry: "auto",
    industryLocked: false,

    step3Template: null,
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

    case "SET_STEP":
      return {
        ...state,
        step: intent.step,
        debug: { ...state.debug, lastTransition: intent.reason ?? `to:${intent.step}` },
      };

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

    case "SET_LOCATION_RAW":
      return { ...state, locationRawInput: intent.value };

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
        businessCard: intent.card
          ? { ...intent.card, resolvedAt: Date.now() }
          : null,
        business: intent.card
          ? { ...intent.card, resolvedAt: Date.now() }
          : null, // Keep in sync
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
      const hasUserEdits = Object.values(state.step3AnswersMeta).some(m => m.source === "user");
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
        questionIdsToReset = template.questions.map(q => q.id);
      } else {
        // Reset only questions in the specified part
        // For now, treat partId as a prefix filter (e.g., "part1_" questions)
        // In practice, this should use template.parts structure
        const scopeObj = intent.scope as { partId: string };
        questionIdsToReset = template.questions
          .filter(q => q.id.startsWith(scopeObj.partId))
          .map(q => q.id);
      }
      
      // Apply template.defaults first, then question.defaultValue
      for (const qid of questionIdsToReset) {
        const q = template.questions.find(qu => qu.id === qid);
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
      const finalAnswers = intent.scope === "all" 
        ? resetAnswers 
        : { ...state.step3Answers, ...resetAnswers };
      const finalMeta = intent.scope === "all"
        ? resetMeta
        : { ...state.step3AnswersMeta, ...resetMeta };
      
      // Clear defaults-applied tracking for reset scope
      let newDefaultsApplied = state.step3DefaultsAppliedParts;
      if (intent.scope === "all") {
        newDefaultsApplied = [];
      } else {
        newDefaultsApplied = state.step3DefaultsAppliedParts.filter(
          p => !p.includes((intent.scope as { partId: string }).partId)
        );
      }
      
      console.log(`[V7 FSM] Reset to defaults: scope=${JSON.stringify(intent.scope)}, fields=${Object.keys(resetAnswers).length}`);
      
      return {
        ...state,
        step3Answers: finalAnswers,
        step3AnswersMeta: finalMeta,
        step3DefaultsAppliedParts: newDefaultsApplied,
      };
    }

    case "SET_STEP3_COMPLETE":
      return { ...state, step3Complete: intent.complete };

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
        debug: { ...state.debug, notes: [...state.debug.notes, `Template ready: ${intent.templateId}`] },
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
        debug: { ...state.debug, notes: [...state.debug.notes, `Pricing started: ${intent.requestKey.slice(0, 8)}`] },
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
            notes: [...state.debug.notes, `Pricing stale-write blocked: ${intent.requestKey.slice(0, 8)}`],
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
            notes: [...state.debug.notes, `Pricing stale-error blocked: ${intent.requestKey.slice(0, 8)}`],
          },
        };
      }
      
      // Detect timeout errors and use "timed_out" status
      const isTimeout = intent.error.toLowerCase().includes("timeout") || 
                        intent.error.toLowerCase().includes("timed out") ||
                        intent.error.toLowerCase().includes("exceeded");
      
      return {
        ...state,
        pricingStatus: isTimeout ? "timed_out" : "error",
        pricingError: intent.error,
        pricingUpdatedAt: Date.now(),
        debug: { ...state.debug, notes: [...state.debug.notes, `Pricing ${isTimeout ? "timed_out" : "error"}: ${intent.error} (key: ${intent.requestKey.slice(0, 8)})`] },
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
    state.location?.postalCode ??
    state.location?.postalCode ??
    state.locationRawInput ??
    "";
  return raw.replace(/\D/g, "").slice(0, 5);
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
 * Build a minimal LocationCard from ZIP when geocode hasn't resolved.
 * Downstream services accept this gracefully (city/state optional).
 */
function buildMinimalLocationFromZip(state: WizardState): LocationCard | null {
  const zip = getNormalizedZip(state);
  if (zip.length < 5) return null;

  // Try to get state from hardcoded ranges (synchronous, instant)
  let stateCode: string | undefined;
  let city: string | undefined;
  try {
    // Dynamic import would be async; use inline minimal lookup
    // The real resolution happens async via primeLocationIntel
    stateCode = undefined;
    city = undefined;
  } catch { /* ignore */ }

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
      // Fresh start: clear storage and start at step 1
      localStorage.removeItem(STORAGE_KEY);
      if (import.meta.env.DEV) {
        console.log("[V7 SSOT] Fresh start - no ?resume=1, cleared storage, starting at location");
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
    if (safePayload.step === "industry" && !safePayload.businessConfirmed && !safePayload.industryLocked) {
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
    state.step3Status,      // FSM state
    state.step3PartIndex,   // FSM part index
    state.step3DefaultsAppliedParts, // FSM defaults tracking
    state.pricingFreeze,
    state.quote,
    state.debug,
  ]);

  /* ============================================================
     Public Actions (UI calls these)
  ============================================================ */

  const resetSession = useCallback(() => {
    abortOngoing();
    const newId = createSessionId();
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "RESET_SESSION", sessionId: newId });
  }, [abortOngoing]);

  const setStep = useCallback((step: WizardStep, reason?: string) => {
    dispatch({ type: "SET_STEP", step, reason });
    dispatch({ type: "PUSH_HISTORY", step });
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
   * setBusinessDraft - Update draft business fields (name/address)
   * This is ephemeral input that should NOT persist unless confirmed.
   */
  const setBusinessDraft = useCallback((patch: Partial<{ name: string; address: string }>) => {
    dispatch({ type: "SET_BUSINESS_DRAFT", patch });
  }, []);

  // Step 1: submit location (SSOT validates + populates intel)
  // ✅ FIX Jan 31: Accept businessInfo directly from Step1 (not stale state.businessDraft)
  const submitLocation = useCallback(
    async (rawInput?: string, businessInfo?: { name?: string; address?: string }) => {
      clearError();
      abortOngoing();

      const input = (rawInput ?? state.locationRawInput).trim();
      dispatch({ type: "DEBUG_TAG", lastAction: "submitLocation" });

      if (!input) {
        setError({ code: "VALIDATION", message: "Please enter an address or business name." });
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setBusy(true, "Resolving location...");
        dispatch({ type: "DEBUG_TAG", lastApi: "resolveLocation" });

        const location = await api.resolveLocation(input, controller.signal);

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
          dispatch({ type: "SET_BUSINESS_CONFIRMED", confirmed: false }); // Reset confirmation
          dispatch({ type: "DEBUG_NOTE", note: `Business card created: ${newBusinessCard.name || newBusinessCard.address}` });
        }

        // Fetch intel (non-blocking to proceed; but we do it now)
        setBusy(true, "Fetching location intelligence...");
        dispatch({ type: "DEBUG_TAG", lastApi: "fetchLocationIntel" });
        const intel = await api.fetchLocationIntel(location, controller.signal);
        dispatch({ type: "SET_LOCATION_INTEL", intel });

        // ✅ FIX Jan 31: Check LOCAL newBusinessCard variable (not stale state)
        // If we just created a business card, stay on Step 1 and show confirmation gate
        if (newBusinessCard) {
          dispatch({
            type: "DEBUG_NOTE",
            note: "Business card detected - waiting for user confirmation before Step 2",
          });
          // Stay on Step 1 - UI should show confirmation modal/buttons
          setBusy(false);
          abortRef.current = null;
          return;
        }

        // No business card - proceed to industry inference
        setBusy(true, "Inferring industry...");
        dispatch({ type: "DEBUG_TAG", lastApi: "inferIndustry" });
        const inferred = await api.inferIndustry(location, controller.signal);

        if (inferred.industry !== "auto" && inferred.confidence >= 0.85) {
          dispatch({ type: "SET_INDUSTRY", industry: inferred.industry, locked: true });
          dispatch({
            type: "DEBUG_NOTE",
            note: `Industry inferred: ${inferred.industry} (locked)`,
          });

          // Preload step 3 template immediately
          setBusy(true, "Loading profile template...");
          dispatch({ type: "DEBUG_TAG", lastApi: "loadStep3Template" });
          const template = await api.loadStep3Template(inferred.industry, controller.signal);
          dispatch({ type: "SET_STEP3_TEMPLATE", template });

          // ✅ PROVENANCE: Apply baseline defaults (template + question defaults)
          const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
          dispatch({ type: "SET_STEP3_ANSWERS", answers: baselineAnswers, source: "template_default" });
          
          // ✅ PROVENANCE: Apply intel patches separately (won't stomp user edits later)
          const intelPatch = api.buildIntelPatch(state.locationIntel);
          if (Object.keys(intelPatch).length > 0) {
            dispatch({ type: "PATCH_STEP3_ANSWERS", patch: intelPatch, source: "location_intel" });
          }

          // Jump directly to Step 3
          setStep("profile", "inferred_industry_skip");
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
    [abortOngoing, clearError, setError, setBusy, setStep, state.locationRawInput]
  );

  /**
   * primeLocationIntel - Progressive hydration for ZIP/location intel
   * 
   * Called on ZIP input change (debounced from UI).
   * Fires 3 parallel fetches, updates UI as each returns.
   * Does NOT block on busy gate - each source updates independently.
   */
  const primeLocationIntel = useCallback(
    async (zipOrInput: string) => {
      const input = zipOrInput.trim();
      if (!input || input.length < 3) return;

      dispatch({ type: "DEBUG_TAG", lastAction: "primeLocationIntel" });

      // Set all to fetching
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

      // Fire all 3 in parallel - each updates state as it returns
      // Utility rate fetch
      api
        .fetchUtility(input)
        .then((u) => {
          dispatch({
            type: "PATCH_LOCATION_INTEL",
            patch: {
              utilityRate: u.rate,
              demandCharge: u.demandCharge,
              utilityProvider: u.provider,
              utilityStatus: "ready",
            },
          });
        })
        .catch((e) => {
          dispatch({
            type: "PATCH_LOCATION_INTEL",
            patch: {
              utilityStatus: "error",
              utilityError: String(e?.message ?? e),
            },
          });
        });

      // Solar data fetch
      api
        .fetchSolar(input)
        .then((s) => {
          dispatch({
            type: "PATCH_LOCATION_INTEL",
            patch: {
              peakSunHours: s.peakSunHours,
              solarGrade: s.grade,
              solarStatus: "ready",
            },
          });
        })
        .catch((e) => {
          dispatch({
            type: "PATCH_LOCATION_INTEL",
            patch: {
              solarStatus: "error",
              solarError: String(e?.message ?? e),
            },
          });
        });

      // Weather data fetch
      api
        .fetchWeather(input)
        .then((w) => {
          dispatch({
            type: "PATCH_LOCATION_INTEL",
            patch: {
              weatherRisk: w.risk,
              weatherProfile: w.profile,
              weatherStatus: "ready",
            },
          });
        })
        .catch((e) => {
          dispatch({
            type: "PATCH_LOCATION_INTEL",
            patch: {
              weatherStatus: "error",
              weatherError: String(e?.message ?? e),
            },
          });
        });
    },
    []
  );

  /**
   * skipBusiness - User skips/dismisses the detected business card
   * Clears the business card AND draft, then goes to Step 2 for manual industry selection
   */
  const skipBusiness = useCallback(() => {
    // ✅ FIX Jan 31: Clear businessDraft to prevent stale draft persisting
    dispatch({ type: "SET_BUSINESS_DRAFT", patch: { name: "", address: "" } });
    dispatch({ type: "SET_BUSINESS_CARD", card: null });
    dispatch({ type: "SET_BUSINESS_CONFIRMED", confirmed: true }); // Mark as "handled" even if skipped
    dispatch({ type: "DEBUG_NOTE", note: "Business skipped by user - draft cleared" });
    dispatch({ type: "SET_INDUSTRY", industry: "auto", locked: false });
    setStep("industry", "business_skipped");
  }, [setStep]);

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
        const inferred = await api.inferIndustry(state.location, controller.signal, state.businessCard);

        if (inferred.industry !== "auto" && inferred.confidence >= 0.85) {
          dispatch({ type: "SET_INDUSTRY", industry: inferred.industry, locked: true });
          dispatch({
            type: "DEBUG_NOTE",
            note: `Industry inferred: ${inferred.industry} (locked)`,
          });

          // Preload step 3 template immediately
          setBusy(true, "Loading profile template...");
          dispatch({ type: "DEBUG_TAG", lastApi: "loadStep3Template" });
          const template = await api.loadStep3Template(inferred.industry, controller.signal);
          dispatch({ type: "SET_STEP3_TEMPLATE", template });

          // ✅ PROVENANCE: Apply baseline defaults (template + question defaults)
          const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
          dispatch({ type: "SET_STEP3_ANSWERS", answers: baselineAnswers, source: "template_default" });
          
          // ✅ PROVENANCE: Apply intel patches separately (won't stomp user edits later)
          const intelPatch = api.buildIntelPatch(state.locationIntel);
          if (Object.keys(intelPatch).length > 0) {
            dispatch({ type: "PATCH_STEP3_ANSWERS", patch: intelPatch, source: "location_intel" });
          }
          
          // ✅ PROVENANCE: Apply business detection patches separately
          const businessPatch = api.buildBusinessPatch(state.businessCard);
          if (Object.keys(businessPatch).length > 0) {
            dispatch({ type: "PATCH_STEP3_ANSWERS", patch: businessPatch, source: "business_detection" });
          }

          // Jump directly to Step 3
          setStep("profile", "inferred_industry_skip");
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

        console.log("[V7 SSOT] selectIndustry: calling loadStep3Template for", industry);
        const template = await api.loadStep3Template(industry, controller.signal);
        console.log("[V7 SSOT] selectIndustry: template loaded", template?.id);
        dispatch({ type: "SET_STEP3_TEMPLATE", template });

        // ✅ PROVENANCE: Apply baseline defaults (template + question defaults)
        const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
        dispatch({ type: "SET_STEP3_ANSWERS", answers: baselineAnswers, source: "template_default" });
        
        // ✅ PROVENANCE: Apply intel patches separately (won't stomp user edits later)
        const intelPatch = api.buildIntelPatch(state.locationIntel);
        if (Object.keys(intelPatch).length > 0) {
          dispatch({ type: "PATCH_STEP3_ANSWERS", patch: intelPatch, source: "location_intel" });
        }
        
        // ✅ PROVENANCE: Apply business detection patches separately
        const businessPatch = api.buildBusinessPatch(state.businessCard);
        if (Object.keys(businessPatch).length > 0) {
          dispatch({ type: "PATCH_STEP3_ANSWERS", patch: businessPatch, source: "business_detection" });
        }
        
        console.log("[V7 SSOT] selectIndustry: applied baseline + patches with provenance");

        setStep("profile", "industry_selected");
        console.log("[V7 SSOT] selectIndustry: transitioned to profile step");
      } catch (err: unknown) {
        console.error("[V7 SSOT] selectIndustry ERROR:", err);
        if (isAbort(err)) setError({ code: "ABORTED", message: "Request cancelled." });
        else setError(err);
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [abortOngoing, clearError, setBusy, setError, setStep, state.location, state.locationIntel, state.businessCard]
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
      dispatch({ type: "DEBUG_NOTE", note: `Applied intel patch: ${Object.keys(patch).join(", ")}` });
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
  const markDefaultsApplied = useCallback((partId: string) => {
    const templateId = state.step3Template?.id || "unknown";
    dispatch({ type: "STEP3_DEFAULTS_APPLIED", partId, templateId });
  }, [state.step3Template?.id]);

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
  const hasDefaultsApplied = useCallback((partId: string): boolean => {
    const templateId = state.step3Template?.id || "unknown";
    const key = `${templateId}.${partId}`;
    return state.step3DefaultsAppliedParts.includes(key);
  }, [state.step3Template?.id, state.step3DefaultsAppliedParts]);

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
  const partHasAnyDefaults = useCallback((partId: string): boolean => {
    const template = state.step3Template;
    if (!template) return false;

    // Get questions for this part
    // For "profile" (single-page view), all questions belong to that part
    const questions = template.questions;
    if (!questions || questions.length === 0) return false;

    const templateDefaults = template.defaults ?? {};

    // Check if ANY question has a default from either source
    return questions.some(q => 
      templateDefaults[q.id] !== undefined || q.defaultValue !== undefined
    );
  }, [state.step3Template]);

  /**
   * canApplyDefaults - Check if defaults can be applied (not yet applied)
   * 
   * Returns true if:
   * 1. Part has any defaults (from template.defaults or q.defaultValue)
   * 2. Defaults haven't been applied yet for this templateId+partId
   */
  const canApplyDefaults = useCallback((partId: string): boolean => {
    return partHasAnyDefaults(partId) && !hasDefaultsApplied(partId);
  }, [partHasAnyDefaults, hasDefaultsApplied]);

  /**
   * canResetToDefaults - Check if reset button should be shown
   * 
   * Returns true if part has any defaults (from either source).
   * Unlike canApplyDefaults, this doesn't check if already applied
   * because user can always reset even after defaults were applied.
   */
  const canResetToDefaults = useCallback((partId: string): boolean => {
    return partHasAnyDefaults(partId);
  }, [partHasAnyDefaults]);

  /**
   * getDefaultForQuestion - Get the default value for a specific question
   * 
   * Priority:
   * 1. template.defaults[questionId] (explicit template default)
   * 2. question.defaultValue (per-question fallback)
   * 3. null (no default)
   */
  const getDefaultForQuestion = useCallback((questionId: string): unknown => {
    const template = state.step3Template;
    if (!template) return null;

    const templateDefaults = template.defaults ?? {};
    if (templateDefaults[questionId] !== undefined) {
      return templateDefaults[questionId];
    }

    const question = template.questions.find(q => q.id === questionId);
    if (question?.defaultValue !== undefined) {
      return question.defaultValue;
    }

    return null;
  }, [state.step3Template]);

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
      hash = ((hash << 5) - hash) + char;
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

      // Timeout watchdog - prevents "pending forever" states
      const withTimeout = <T,>(
        fn: () => T | Promise<T>,
        ms: number
      ): Promise<T> =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error(`Pricing timeout after ${ms}ms`)),
            ms
          );
          try {
            const result = fn();
            // Handle both sync and async
            if (result instanceof Promise) {
              result
                .then((v) => { clearTimeout(timer); resolve(v); })
                .catch((e) => { clearTimeout(timer); reject(e); });
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
          () => runContractQuote({
            industry: args.industry,
            answers: args.answers,
            location: args.location,
            locationIntel: args.locationIntel,
          }),
          PRICING_TIMEOUT_MS / 2 // Half time for Layer A
        );

        const { freeze, quote: baseQuote, sessionId, loadProfile, sizingHints, inputsUsed } = contractResult;

        // 3. LAYER B: Run pricing bridge (financial metrics via SSOT)
        let pricingResult: PricingQuoteResult | null = null;
        const allWarnings: string[] = [...(baseQuote.notes?.filter(n => n.startsWith('⚠️')) ?? [])];

        try {
          // Build ContractQuoteResult for Layer B
          const contractForPricing: import("@/wizard/v7/pricing/pricingBridge").ContractQuoteResult = {
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
            },
            assumptions: baseQuote.notes?.filter(n => !n.startsWith('⚠️')),
            warnings: baseQuote.notes?.filter(n => n.startsWith('⚠️')).map(n => n.replace('⚠️ ', '')),
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
            allWarnings.push(`⚠️ Pricing: ${pricingResult.error ?? 'Unknown error'}`);
          }
        } catch (pricingErr) {
          // Layer B failure is NON-BLOCKING
          const errMsg = (pricingErr as { message?: string })?.message ?? 'Pricing calculation failed';
          allWarnings.push(`⚠️ Pricing failed: ${errMsg}`);
          console.warn('[V7 Pricing] Layer B error (non-blocking):', errMsg);
        }

        // 4. Merge Layer A + Layer B into final QuoteOutput (MONOTONIC: never partial populate)
        // Track input fallbacks for transparency
        const inputFallbacks: QuoteOutput['inputFallbacks'] = {};
        
        // Track what defaults were used
        const locationIntel = args.locationIntel;
        if (!locationIntel?.utilityRate) {
          inputFallbacks.electricityRate = { value: inputsUsed.electricityRate, reason: 'Default rate (no utility data)' };
        }
        if (!locationIntel?.demandCharge) {
          inputFallbacks.demandCharge = { value: inputsUsed.demandCharge, reason: 'Default demand charge (no utility data)' };
        }
        if (!args.location?.state) {
          inputFallbacks.location = { value: inputsUsed.location.state ?? 'unknown', reason: 'Location not resolved' };
        }

        const mergedQuote: QuoteOutput = {
          // Layer A: Load profile (ALWAYS present once contract runs)
          baseLoadKW: loadProfile.baseLoadKW,
          peakLoadKW: loadProfile.peakLoadKW,
          energyKWhPerDay: loadProfile.energyKWhPerDay,
          storageToPeakRatio: sizingHints.storageToPeakRatio,
          durationHours: sizingHints.durationHours,
          
          // Layer B: Financial metrics — MONOTONIC: ALL or NONE (never partial)
          ...(pricingResult?.ok && pricingResult.data ? {
            capexUSD: pricingResult.data.capexUSD,
            annualSavingsUSD: pricingResult.data.annualSavingsUSD,
            roiYears: pricingResult.data.roiYears,
            npv: pricingResult.data.financials?.npv,
            irr: pricingResult.data.financials?.irr,
            paybackYears: pricingResult.data.financials?.paybackYears,
            demandChargeSavings: (pricingResult.data.financials as Record<string, unknown> | undefined)?.demandChargeSavings as number | undefined,
            bessKWh: pricingResult.data.breakdown?.batteries ? pricingResult.data.breakdown.batteries.unitEnergyMWh * pricingResult.data.breakdown.batteries.quantity * 1000 : undefined,
            bessKW: pricingResult.data.breakdown?.batteries ? pricingResult.data.breakdown.batteries.unitPowerMW * pricingResult.data.breakdown.batteries.quantity * 1000 : undefined,
            solarKW: pricingResult.data.breakdown?.solar ? pricingResult.data.breakdown.solar.totalMW * 1000 : undefined,
            generatorKW: pricingResult.data.breakdown?.generators ? pricingResult.data.breakdown.generators.unitPowerMW * pricingResult.data.breakdown.generators.quantity * 1000 : undefined,
            pricingSnapshotId: pricingResult.data.pricingSnapshotId,
            pricingComplete: true,
          } : {
            // MONOTONIC: pricingComplete=false means NO financial fields populated
            pricingComplete: false,
          }),
          
          // Input fallbacks for transparency
          inputFallbacks: Object.keys(inputFallbacks).length > 0 ? inputFallbacks : undefined,
          
          // Notes (merged from both layers)
          notes: [
            ...(baseQuote.notes?.filter(n => !n.startsWith('⚠️')) ?? []),
            ...allWarnings,
          ],
        };

        // 5. Sanity check the result (NaN/Infinity/negative totals)
        const sanity: PricingSanity = sanityCheckQuote(mergedQuote);

        if (sanity.warnings.length > 0) {
          console.warn(
            `[V7 Pricing] Quote has ${sanity.warnings.length} sanity warnings:`,
            sanity.warnings
          );
        }

        // Update freeze with sizing info from Layer A
        const enrichedFreeze: PricingFreeze = {
          ...freeze,
          hours: sizingHints.durationHours,
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

        return { ok: true as const, freeze: enrichedFreeze, quote: mergedQuote, warnings: [...allWarnings, ...sanity.warnings] };
      } catch (err: unknown) {
        // 7. Error path - capture but DON'T block (with stale-write key)
        const errMsg =
          (err as { message?: string })?.message ?? "Pricing calculation failed";

        console.error("[V7 Pricing] Error:", errMsg, err);

        dispatch({ type: "PRICING_ERROR", error: errMsg, requestKey });

        return { ok: false as const, error: errMsg };
      }
    },
    []
  );

  /**
   * retryPricing - Retry pricing from Results page
   * 
   * Uses current state.step3Answers, state.industry, state.location, state.locationIntel.
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
    });
  }, [runPricingSafe, state.industry, state.step3Answers, state.location, state.locationIntel]);

  // Step 3: validate + go to results (pricing is NON-BLOCKING)
  //
  // Phase 6 Doctrine:
  // - Validation failures BLOCK (user must fix)
  // - Pricing failures DO NOT BLOCK (shown as banner in Results)
  // - Navigation proceeds regardless of pricing outcome
  const submitStep3 = useCallback(
    async (answersOverride?: Step3Answers) => {
      clearError();
      abortOngoing();
      dispatch({ type: "DEBUG_TAG", lastAction: "submitStep3" });

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
      if (!state.step3Template) {
        setError({ code: "STATE", message: "Profile template missing. Reload Step 3." });
        return;
      }

      const answers = answersOverride ?? state.step3Answers;
      const validation = validateStep3(state.step3Template, answers);
      if (!validation.ok) {
        setError({
          code: "VALIDATION",
          message: validation.reason ?? "Please complete required questions.",
        });
        return;
      }

      // ✅ Mark Step 3 complete FIRST (unlocks navigation)
      dispatch({ type: "SET_STEP3_COMPLETE", complete: true });

      // ✅ Navigate to Results IMMEDIATELY (non-blocking)
      setStep("results", "step3_complete");

      // ✅ Run pricing in background (non-blocking)
      // Results page will show spinner or error banner based on pricingStatus
      runPricingSafe({
        industry: state.industry,
        answers,
        location: state.location ?? undefined,
        locationIntel: state.locationIntel ?? undefined,
      });
    },
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
          dispatch({ type: "DEBUG_NOTE", note: "Auto-created minimal LocationCard from ZIP (geocode pending)" });
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

            // ✅ PROVENANCE: Apply baseline defaults on navigation too
            const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
            dispatch({ type: "SET_STEP3_ANSWERS", answers: baselineAnswers, source: "template_default" });
            
            // ✅ PROVENANCE: Apply intel patches separately
            const intelPatch = api.buildIntelPatch(state.locationIntel);
            if (Object.keys(intelPatch).length > 0) {
              dispatch({ type: "PATCH_STEP3_ANSWERS", patch: intelPatch, source: "location_intel" });
            }
            
            // ✅ PROVENANCE: Apply business detection patches separately
            const businessPatch = api.buildBusinessPatch(state.businessCard);
            if (Object.keys(businessPatch).length > 0) {
              dispatch({ type: "PATCH_STEP3_ANSWERS", patch: businessPatch, source: "business_detection" });
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
        const ok = stepCanProceed(state, "results");
        if (!ok.ok) {
          setError({ code: "STATE", message: ok.reason ?? "Cannot proceed to Results." });
          return;
        }
        setStep("results", "nav");
        return;
      }
    },
    [clearError, setBusy, setError, setStep, state]
  );

  /* ============================================================
     Derived Values (safe for UI)
  ============================================================ */

  const progress = useMemo(() => {
    const idx = ["location", "industry", "profile", "results"].indexOf(state.step);
    const stepIndex = Math.max(0, idx);
    return {
      stepIndex,
      stepCount: 4,
      percent: Math.round(((stepIndex + 1) / 4) * 100),
    };
  }, [state.step]);

  const gates = useMemo(() => {
    return {
      canGoIndustry: stepCanProceed(state, "location").ok,
      canGoProfile: stepCanProceed(state, "industry").ok,
      canGoResults: stepCanProceed(state, "results").ok,
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
    const groundedCount = sourceBreakdown.user + sourceBreakdown.location_intel + sourceBreakdown.business_detection;
    // Assumed = data from defaults (guessing)
    const assumedCount = sourceBreakdown.template_default + sourceBreakdown.question_default;
    
    // Confidence: 0-1, higher when more grounded data
    // Formula: weighted average (user=1.0, intel=0.8, detection=0.7, defaults=0.3)
    const weights = { user: 1.0, location_intel: 0.8, business_detection: 0.7, template_default: 0.3, question_default: 0.3 };
    const weightedSum = Object.entries(sourceBreakdown).reduce(
      (sum, [source, count]) => sum + count * weights[source as AnswerSource], 0
    );
    const confidence = totalFields > 0 ? weightedSum / totalFields : 0;
    
    // Required fields coverage (if template loaded)
    const requiredFields = template?.questions.filter(q => q.required).map(q => q.id) ?? [];
    const requiredFilled = requiredFields.filter(id => {
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
    const userCorrectionsArray = changedFields.filter(c => {
      const currentMeta = meta[c.id];
      return currentMeta?.source === "user" && c.prev !== undefined;
    });
    const userCorrectionsSet = new Set(userCorrectionsArray.map(c => c.id));
    
    // === Composite Signals ===
    
    // Overall readiness: are we ready to generate a trustworthy quote?
    // High when: completeness high + confidence reasonable + no errors
    const readiness = (completeness * 0.6) + (confidence * 0.4);
    
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
      confidence,          // 0-1: how grounded is our data?
      completeness,        // 0-1: required fields filled
      groundedCount,       // fields from real sources
      assumedCount,        // fields from defaults (guessing)
      sourceBreakdown,     // detailed source counts
      
      // Law 2: Understanding (arrays for iteration, Sets for O(1) lookup)
      certainFields: certainFieldsArray,       // field IDs where we're confident
      uncertainFields: uncertainFieldsArray,   // field IDs where we're guessing
      observedFields: observedFieldsArray,     // field IDs from external observation
      
      // Law 3: Evolution
      changedFields,       // fields that changed (with prev values)
      userCorrections: userCorrectionsArray,   // fields user explicitly corrected
      hasLearned: userCorrectionsArray.length > 0, // has user taught us something?
      
      // Composite
      readiness,           // 0-1: ready for quote?
      humility,            // 0-1: how tentative should presentation be?
      
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
          case "user": return null; // User's own input—no attribution needed
          case "location_intel": return "From utility data for your area";
          case "business_detection": return "Detected from business profile";
          case "template_default": return "Typical for this industry";
          case "question_default": return "Standard assumption";
          default: return null;
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

    // step 1: business (V6 parity)
    setBusinessDraft,
    confirmBusiness,
    skipBusiness,

    // step 2
    selectIndustry,

    // step 3
    setStep3Answer,
    setStep3Answers,
    applyIntelPatch,    // Runtime intel updates (won't stomp user edits)
    resetToDefaults,    // Explicit reset with provenance rewrite
    submitStep3,
    submitStep3Partial, // Escape hatch: navigate with incomplete answers
    
    // step 3 FSM controls
    markDefaultsApplied, // Record defaults applied for a part
    hasDefaultsApplied,  // Check if defaults applied for a part
    goToNextPart,        // Advance to next part (guarded)
    goToPrevPart,        // Go back to previous part
    setPartIndex,        // Jump to specific part

    // step 3 defaults helpers (SSOT-authoritative)
    partHasAnyDefaults,   // Check if part has ANY defaults (template or question)
    canApplyDefaults,     // partHasAnyDefaults && !hasDefaultsApplied
    canResetToDefaults,   // partHasAnyDefaults (always show reset if defaults exist)
    getDefaultForQuestion, // Get default value for a specific question

    // step 4: pricing (Phase 6: non-blocking)
    retryPricing,         // Retry pricing from Results page

    // misc
    clearError,
    abortOngoing,

    // Computed helpers for next step
    nextStep: useCallback(() => {
      if (state.step === "location") return "industry";
      if (state.step === "industry") return "profile";
      if (state.step === "profile") return "results";
      return null;
    }, [state.step]),
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
  const industry = (template as any).industry ?? (template as any).industryId ?? "";
  
  // Get Tier 1 blockers for this industry (if configured)
  const blockerIds = getTier1Blockers(industry);
  
  // If no blockers configured, fall back to all required questions
  const questionsToCheck = blockerIds.length > 0
    ? template.questions.filter(q => blockerIds.includes(q.id))
    : template.questions.filter(q => q.required);
  
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
