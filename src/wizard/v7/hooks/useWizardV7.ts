// src/wizard/v7/hooks/useWizardV7.ts
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { getTemplate } from "@/wizard/v7/templates/templateIndex";
import { CALCULATORS_BY_ID } from "@/wizard/v7/calculators/registry";
import { validateTemplateAgainstCalculator } from "@/wizard/v7/templates/validator";
import { applyTemplateMapping } from "@/wizard/v7/templates/applyMapping";
import type { CalcInputs } from "@/wizard/v7/calculators/contract";

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

export type LocationIntel = {
  peakSunHours?: number;
  utilityRate?: number;
  weatherRisk?: number;
  solarGrade?: string;
  // extend as needed
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

export type Step3Template = {
  industry: IndustrySlug;
  version: string; // e.g. "v7.0"
  questions: Array<{
    id: string;
    label: string;
    type: "number" | "text" | "select" | "boolean" | "multiselect";
    required?: boolean;
    options?: string[];
    unit?: string;
    hint?: string;
    // for scoring / validation (optional)
    min?: number;
    max?: number;
  }>;
};

export type Step3Answers = Record<string, unknown>;

export type QuoteOutput = {
  // You can expand this to match your QuoteEngine output
  capexUSD?: number;
  annualSavingsUSD?: number;
  roiYears?: number;
  notes?: string[];
  // etc...
};

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

  // Step 2: industry
  industry: IndustrySlug; // may be inferred
  industryLocked: boolean; // if inferred with high confidence, lock & skip

  // Step 3: profile template + answers
  step3Template: Step3Template | null;
  step3Answers: Step3Answers;
  step3Complete: boolean;

  // Pricing freeze (SSOT snapshot)
  pricingFreeze: PricingFreeze | null;

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
  | { type: "SET_INDUSTRY"; industry: IndustrySlug; locked?: boolean }
  | { type: "SET_STEP3_TEMPLATE"; template: Step3Template | null }
  | { type: "SET_STEP3_ANSWER"; id: string; value: unknown }
  | { type: "SET_STEP3_ANSWERS"; answers: Step3Answers }
  | { type: "SET_STEP3_COMPLETE"; complete: boolean }
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
 * Run contract-based quote generation
 * - Load template for industry
 * - Validate template vs calculator contract
 * - Apply mapping transforms
 * - Compute quote via calculator
 * - Return freeze + outputs
 */
function runContractQuote(params: { industry: string; answers: Record<string, unknown> }): {
  freeze: PricingFreeze;
  quote: QuoteOutput;
} {
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

  // 3. Validate template vs calculator (hard fail on mismatch)
  const validation = validateTemplateAgainstCalculator(tpl, calc, {
    minQuestions: 16,
    maxQuestions: 18,
  });
  if (!validation.ok) {
    const errorMsg = validation.issues.map((i) => `${i.level}:${i.code}:${i.message}`).join(" | ");
    throw { code: "VALIDATION", message: `Template validation failed: ${errorMsg}` };
  }

  // 4. Apply mapping (answers → canonical calculator inputs)
  const inputs = applyTemplateMapping(tpl, params.answers);

  // 5. Run calculator
  const computed = calc.compute(inputs as CalcInputs);

  // 6. Build pricing freeze (SSOT snapshot)
  const freeze: PricingFreeze = {
    powerMW: computed.peakLoadKW ? computed.peakLoadKW / 1000 : undefined,
    hours: undefined, // TODO: extract from answers if needed
    mwh: computed.energyKWhPerDay ? computed.energyKWhPerDay / 1000 : undefined,
    useCase: tpl.industry,
    createdAtISO: nowISO(),
  };

  // 7. Build quote output
  const quote: QuoteOutput = {
    notes: [...(computed.assumptions ?? []), ...(computed.warnings ?? []).map((w) => `⚠️ ${w}`)],
  };

  return { freeze, quote };
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

  // Infer industry from location/business card (if you do it)
  async inferIndustry(
    _location: LocationCard,
    _signal?: AbortSignal
  ): Promise<{ industry: IndustrySlug; confidence: number }> {
    // Replace with your classifier.
    return { industry: "auto", confidence: 0 };
  },

  // Load Step 3 template by industry
  async loadStep3Template(industry: IndustrySlug, signal?: AbortSignal): Promise<Step3Template> {
    // Import API helper
    const { apiCall, API_ENDPOINTS } = await import("@/config/api");

    // Call backend template loader
    const response = await apiCall<{
      ok: boolean;
      template?: Step3Template;
      reason?: string;
      notes?: string[];
    }>(API_ENDPOINTS.TEMPLATE_LOAD, {
      method: "POST",
      body: JSON.stringify({ industry }),
      signal,
    });

    // Handle rejection
    if (!response.ok || !response.template) {
      throw {
        code: "API",
        message: response.notes?.join(" ") || `Template not found for ${industry}`,
      };
    }

    console.log(`[V7 SSOT] Loaded template: ${industry} ${response.template.version}`);
    return response.template;
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

    industry: "auto",
    industryLocked: false,

    step3Template: null,
    step3Answers: {},
    step3Complete: false,

    pricingFreeze: null,
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
      return {
        ...state,
        location: intent.location,
        // reset downstream on location changes
        locationIntel: intent.location ? state.locationIntel : null,
        industry: intent.location ? state.industry : "auto",
        industryLocked: intent.location ? state.industryLocked : false,
        step3Template: intent.location ? state.step3Template : null,
        step3Answers: intent.location ? state.step3Answers : {},
        step3Complete: intent.location ? state.step3Complete : false,
        pricingFreeze: intent.location ? state.pricingFreeze : null,
        quote: intent.location ? state.quote : null,
      };

    case "SET_LOCATION_INTEL":
      return { ...state, locationIntel: intent.intel };

    case "SET_INDUSTRY":
      return {
        ...state,
        industry: intent.industry,
        industryLocked: typeof intent.locked === "boolean" ? intent.locked : state.industryLocked,
      };

    case "SET_STEP3_TEMPLATE":
      return { ...state, step3Template: intent.template };

    case "SET_STEP3_ANSWER":
      return { ...state, step3Answers: { ...state.step3Answers, [intent.id]: intent.value } };

    case "SET_STEP3_ANSWERS":
      return { ...state, step3Answers: intent.answers };

    case "SET_STEP3_COMPLETE":
      return { ...state, step3Complete: intent.complete };

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

function hasState(location: LocationCard | null): boolean {
  // your bug: "STATE never confirms"
  return !!location?.state && location.state.trim().length >= 2;
}

function stepCanProceed(state: WizardState, step: WizardStep): { ok: boolean; reason?: string } {
  if (step === "location") {
    if (!state.location) return { ok: false, reason: "Location not set." };
    // We don't hard-require state for all countries, but if in US flows, you likely do.
    // Keep soft gate: if formattedAddress includes ", " but no state, warn.
    return { ok: true };
  }
  if (step === "industry") {
    if (!state.location) return { ok: false, reason: "Location missing." };
    if (state.industry === "auto")
      return { ok: false, reason: "Industry not selected or inferred." };
    return { ok: true };
  }
  if (step === "profile") {
    if (!state.location) return { ok: false, reason: "Location missing." };
    if (state.industry === "auto") return { ok: false, reason: "Industry missing." };
    if (!state.step3Template) return { ok: false, reason: "Step 3 template missing." };
    return { ok: true };
  }
  if (step === "results") {
    if (!state.step3Complete) return { ok: false, reason: "Step 3 incomplete." };
    if (!state.pricingFreeze || !state.quote) return { ok: false, reason: "Quote not generated." };
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
  ---------------------------- */
  useEffect(() => {
    dispatch({ type: "HYDRATE_START" });

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

    // Never hydrate busy flags
    const payload: Partial<WizardState> = {
      ...saved,
      isHydrating: false,
      isBusy: false,
      busyLabel: undefined,
      error: null,
    };

    dispatch({ type: "HYDRATE_SUCCESS", payload });
  }, []);

  /* ----------------------------
     Persist
  ---------------------------- */
  useEffect(() => {
    if (state.isHydrating) return;

    // persist only stable state (no transient flags)
    const persist: Partial<WizardState> = {
      schemaVersion: state.schemaVersion,
      sessionId: state.sessionId,
      step: state.step,
      stepHistory: state.stepHistory,

      locationRawInput: state.locationRawInput,
      location: state.location,
      locationIntel: state.locationIntel,

      industry: state.industry,
      industryLocked: state.industryLocked,

      step3Template: state.step3Template,
      step3Answers: state.step3Answers,
      step3Complete: state.step3Complete,

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
    state.industry,
    state.industryLocked,
    state.step3Template,
    state.step3Answers,
    state.step3Complete,
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

  // Step 1: submit location (SSOT validates + populates intel)
  const submitLocation = useCallback(
    async (rawInput?: string) => {
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

        // Fetch intel (non-blocking to proceed; but we do it now)
        setBusy(true, "Fetching location intelligence...");
        dispatch({ type: "DEBUG_TAG", lastApi: "fetchLocationIntel" });
        const intel = await api.fetchLocationIntel(location, controller.signal);
        dispatch({ type: "SET_LOCATION_INTEL", intel });

        // Infer industry (optional) and decide whether to skip Step 2
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

        const template = await api.loadStep3Template(industry, controller.signal);
        dispatch({ type: "SET_STEP3_TEMPLATE", template });

        setStep("profile", "industry_selected");
      } catch (err: unknown) {
        if (isAbort(err)) setError({ code: "ABORTED", message: "Request cancelled." });
        else setError(err);
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [abortOngoing, clearError, setBusy, setError, setStep, state.location]
  );

  // Step 3: answer updates (SSOT)
  const setStep3Answer = useCallback((id: string, value: unknown) => {
    dispatch({ type: "DEBUG_TAG", lastAction: "setStep3Answer" });
    dispatch({ type: "SET_STEP3_ANSWER", id, value });

    // Completion can be computed and applied later (explicit submit)
  }, []);

  const setStep3Answers = useCallback((answers: Step3Answers) => {
    dispatch({ type: "DEBUG_TAG", lastAction: "setStep3Answers" });
    dispatch({ type: "SET_STEP3_ANSWERS", answers });
  }, []);

  // Step 3: validate + run quote engine + go results
  const submitStep3 = useCallback(
    async (answersOverride?: Step3Answers) => {
      clearError();
      abortOngoing();
      dispatch({ type: "DEBUG_TAG", lastAction: "submitStep3" });

      const location = state.location;
      if (!location) {
        setError({ code: "STATE", message: "Location missing. Go back to Step 1." });
        return;
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

      try {
        setBusy(true, "Running TrueQuote™ Calculator...");
        dispatch({ type: "DEBUG_TAG", lastApi: "runContractQuote" });

        // Use V7 contract layer for quote generation
        const { freeze, quote } = runContractQuote({
          industry: state.industry,
          answers,
        });

        dispatch({ type: "SET_STEP3_COMPLETE", complete: true });
        dispatch({ type: "SET_PRICING_FREEZE", freeze });
        dispatch({ type: "SET_QUOTE", quote });

        // Add debug note about contract usage
        dispatch({
          type: "DEBUG_NOTE",
          note: `Contract quote: industry=${state.industry}, template validated, calculator executed`,
        });

        setStep("results", "quote_ready");
      } catch (err: unknown) {
        if (isAbort(err)) setError({ code: "ABORTED", message: "Request cancelled." });
        else setError(err);
      } finally {
        setBusy(false);
      }
    },
    [
      abortOngoing,
      clearError,
      setBusy,
      setError,
      setStep,
      state.location,
      state.industry,
      state.step3Template,
      state.step3Answers,
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
        if (!state.location) {
          setError({ code: "STATE", message: "Location missing." });
          return;
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
     Return
  ============================================================ */

  return {
    state,
    progress,
    gates,

    // core controls
    resetSession,
    goBack,
    goToStep,

    // step 1
    updateLocationRaw,
    submitLocation,

    // step 2
    selectIndustry,

    // step 3
    setStep3Answer,
    setStep3Answers,
    submitStep3,

    // misc
    clearError,
    abortOngoing,
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
  for (const q of template.questions) {
    if (!q.required) continue;
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
