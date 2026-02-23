/**
 * @fileoverview useWizardCore - Reducer, Initial State, and Contract Quote Runner
 * @module wizard/v7/hooks/useWizardCore
 *
 * Extracted from useWizardV7.ts (Op1e-1 - Feb 22, 2026)
 *
 * Contains the core state management infrastructure:
 * - initialState(): Factory for initial WizardState
 * - reduce(): Main reducer function (716 lines, 44 intent types)
 * - runContractQuote(): Contract quote runner (Layer A)
 *
 * This allows useWizardV7.ts to focus on hook orchestration while
 * keeping the state machine logic separate and testable.
 */

import { useReducer } from "react";
// Import types from main hook (defined there to avoid circular dependency)
import type {
  WizardState,
  Intent,
  Step3Answers,
  Step3AnswersMeta,
  AnswerSource,
  LocationCard,
} from "./useWizardV7";
import { devLog, devWarn } from "@/wizard/v7/debug/devLog";
import { merlinMemory } from "@/wizard/v7/memory";

import { getStateFromZipPrefix } from "./zipPrefixMap";
export { runContractQuote } from "./runContractQuote";
export type { ContractQuoteResult } from "./runContractQuote";

/* ============================================================
   Helper Functions
============================================================ */

function createSessionId(): string {
  return `wiz_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Initial wizard state factory
 *
 * Returns a clean slate for a new wizard session.
 * Used by:
 * - useWizardV7 hook initialization
 * - RESET_SESSION reducer intent
 */
export function initialState(): WizardState {
  // Initialize Merlin Memory session
  const sessionId = createSessionId();
  merlinMemory.set("session", {
    startedAt: Date.now(),
    stepHistory: [{ step: "location", enteredAt: Date.now() }],
    totalStepsCompleted: 0,
    quoteGenerations: 0,
    addOnChanges: 0,
    lastActiveAt: Date.now(),
  });

  return {
    schemaVersion: "7.0.0",
    sessionId,
    step: "location",
    stepHistory: ["location"],
    isHydrating: false,
    isBusy: false,
    error: null,

    // Step 1: Location
    locationRawInput: "",
    location: null,
    locationIntel: null,
    locationConfirmed: false,

    // Step 1: Business Detection
    businessDraft: { name: "", address: "" },
    business: null,
    businessCard: null,
    businessConfirmed: false,

    // Step 1: Goals
    goals: [],
    goalsConfirmed: false,
    goalsModalRequested: false,

    // Step 2: Industry
    industry: "auto",
    industryLocked: false,
    templateMode: "industry", // Default: use industry template

    // Step 3: Profile
    step3Template: null,
    step3Answers: {},
    step3AnswersMeta: {}, // Provenance tracking
    step3Complete: false,
    // FSM state
    step3Status: "idle",
    step3PartIndex: 0,
    step3DefaultsAppliedParts: [],

    // Step 4: Add-ons
    includeSolar: false,
    includeGenerator: false,
    includeEV: false,
    addOnsConfirmed: false,
    step4AddOns: {
      includeSolar: false,
      solarKW: 0,
      includeGenerator: false,
      generatorKW: 0,
      generatorFuelType: "natural-gas",
      includeWind: false,
      windKW: 0,
    },

    // Pricing (Phase 6: non-blocking)
    pricingStatus: "idle",
    pricingError: null,
    pricingWarnings: [],
    pricingRequestKey: null,
    pricingUpdatedAt: null,
    pricingFreeze: null,
    quote: null,

    // Debug
    debug: {
      lastAction: undefined,
      lastTransition: undefined,
      lastApi: undefined,
      notes: ["Initial state created."],
    },
  };
}

/**
 * Main wizard reducer
 *
 * Handles 44 intent types across all wizard steps:
 * - Hydration (3 intents)
 * - Session management (5 intents)
 * - Location (5 intents)
 * - Goals (4 intents)
 * - Business (4 intents)
 * - Industry (1 intent)
 * - Step 3 (9 intents + 6 FSM intents)
 * - Step 4 Add-ons (4 intents)
 * - Pricing (5 intents)
 * - Debug (2 intents)
 *
 * Total: 716 lines, 44 intent types
 */
export function reduce(state: WizardState, intent: Intent): WizardState {
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
      devLog("[Wizard] step transition", { from: prev, to: next, reason });

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

    case "GO_BACK": {
      // Go back to previous step in history
      if (state.stepHistory.length <= 1) {
        devWarn("[V7] Cannot go back - already at first step");
        return state;
      }
      const newHistory = state.stepHistory.slice(0, -1);
      const prevStep = newHistory[newHistory.length - 1];
      devLog("[V7] Going back", { from: state.step, to: prevStep });
      return {
        ...state,
        step: prevStep,
        stepHistory: newHistory,
        debug: {
          ...state.debug,
          lastTransition: `${state.step} → ${prevStep} (goBack)`,
        },
      };
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
      const skipIndustry =
        canAdvance &&
        state.industryLocked &&
        !!state.industry &&
        state.industry !== "auto" &&
        !!state.step3Template; // Safety: template must be loaded before skipping to profile

      const nextStep = canAdvance ? (skipIndustry ? "profile" : "industry") : state.step;

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

    case "SET_SOLAR_SIZING":
      return {
        ...state,
        includeSolar: intent.solarKW > 0,
        step4AddOns: {
          ...state.step4AddOns,
          includeSolar: intent.solarKW > 0,
          solarKW: intent.solarKW,
        },
      };

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
        devWarn(
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
          devLog(`[V7 Provenance] Skipping patch for ${id} - user already edited`);
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

      devLog(
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
          notes: ["Submitting Step 3 answers with retry logic"],
        },
      };

    case "SUBMIT_STEP3_SUCCESS":
      devLog("[V7 Reducer] SUBMIT_STEP3_SUCCESS → transitioning step='profile' to step='options'");
      return {
        ...state,
        isBusy: false,
        step3Complete: true,
        step: "options", // Step 3 → Step 4 Options (add-ons)
        // FIX (Feb 11, 2026): Push 'profile' to stepHistory so goBack from Options
        // correctly returns to profile instead of skipping over it
        stepHistory:
          state.stepHistory[state.stepHistory.length - 1] === "profile"
            ? state.stepHistory
            : [...state.stepHistory, "profile"],
        debug: {
          ...state.debug,
          lastAction: "SUBMIT_STEP3_SUCCESS",
          lastTransition: "profile → options (step3_complete)",
          notes: ["Step 3 submission successful, advanced to options step"],
        },
      };

    case "SUBMIT_STEP3_FAILED":
      return {
        ...state,
        isBusy: false,
        error: {
          code: "UNKNOWN",
          message: intent.error.message,
          detail: { retries: intent.error.retries },
        },
        debug: {
          ...state.debug,
          lastAction: "SUBMIT_STEP3_FAILED",
          notes: [
            `Step 3 submission failed after ${intent.error.retries || 0} retries: ${intent.error.message}`,
          ],
        },
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
        devLog(`[V7 FSM] Defaults already applied for ${key}, skipping`);
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
        devWarn(`[V7 FSM] Cannot advance part from status: ${state.step3Status}`);
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
        devWarn(`[V7 FSM] Cannot request quote from status: ${state.step3Status}`);
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
        devWarn(
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
        devWarn(
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

/**
 * Custom hook for wizard state management
 *
 * Wraps useReducer with initialState and reduce functions.
 * Returns [state, dispatch] tuple.
 */
export function useWizardReducer() {
  return useReducer(reduce, undefined, initialState);
}
