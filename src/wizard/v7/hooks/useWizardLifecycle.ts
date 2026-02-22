/**
 * useWizardLifecycle.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Lifecycle & Session Management Hook
 *
 * Extracted from useWizardV7.ts (Op1d - Feb 22, 2026)
 *
 * Responsibilities:
 * - Hydration from localStorage (with fresh start contract)
 * - Persistence to localStorage
 * - ZIP divergence detection (auto-unconfirm)
 * - Session management (reset, setStep, goBack)
 * - Core utilities (setBusy, setError, clearError, abortOngoing)
 *
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useCallback, useRef } from "react";
import type { WizardState, WizardStep, WizardError } from "./useWizardV7";
import { merlinMemory } from "@/wizard/v7/memory";
import { devLog } from "@/wizard/v7/debug/devLog";

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "wizard_v7_state";

// ──────────────────────────────────────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────────────────────────────────────

function safeJsonParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function normalizeZip5(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.slice(0, 5);
}

function createSessionId(): string {
  return `v7-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type LifecycleAction =
  | { type: "HYDRATE_START" }
  | { type: "HYDRATE_SUCCESS"; payload: Partial<WizardState> }
  | { type: "RESET_SESSION"; sessionId: string }
  | { type: "SET_STEP"; step: WizardStep; reason?: string }
  | { type: "PUSH_HISTORY"; step: WizardStep }
  | { type: "GO_BACK" }
  | { type: "SET_BUSY"; isBusy: boolean; busyLabel?: string }
  | { type: "SET_ERROR"; error: WizardError }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOCATION_CONFIRMED"; confirmed: boolean }
  | { type: "DEBUG_TAG"; [key: string]: unknown };

export interface UseWizardLifecycleDependencies {
  // State
  state: WizardState;
  // Actions
  dispatch: (action: LifecycleAction) => void;
  // Refs
  abortRef: React.MutableRefObject<AbortController | null>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Hook Implementation
// ──────────────────────────────────────────────────────────────────────────────

export function useWizardLifecycle(deps: UseWizardLifecycleDependencies) {
  const { state, dispatch, abortRef } = deps;

  // ============================================================
  // Core Utilities
  // ============================================================

  /**
   * abortOngoing - Cancel any in-flight API requests
   */
  const abortOngoing = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, [abortRef]);

  /**
   * setBusy - Set loading state with optional label
   */
  const setBusy = useCallback(
    (isBusy: boolean, busyLabel?: string) => {
      dispatch({ type: "SET_BUSY", isBusy, busyLabel });
    },
    [dispatch]
  );

  /**
   * setError - Set error state
   */
  const setError = useCallback(
    (err: unknown) => {
      dispatch({ type: "SET_ERROR", error: err as WizardError });
    },
    [dispatch]
  );

  /**
   * clearError - Clear error state
   */
  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), [dispatch]);

  // ============================================================
  // Session Management
  // ============================================================

  /**
   * resetSession - Clear all state and start fresh
   */
  const resetSession = useCallback(() => {
    abortOngoing();
    const newId = createSessionId();
    localStorage.removeItem(STORAGE_KEY);
    // Also clear the fresh-start latch so next visit starts clean
    sessionStorage.removeItem("v7_fresh_start_done");
    dispatch({ type: "RESET_SESSION", sessionId: newId });
  }, [abortOngoing, dispatch]);

  /**
   * setStep - Navigate to a specific step with reason tracking
   */
  const setStep = useCallback(
    (step: WizardStep, reason?: string) => {
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
          lastActiveAt: now,
        });
      }
    },
    [dispatch]
  );

  /**
   * goBack - Navigate to previous step
   */
  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, [dispatch]);

  // ============================================================
  // Effect: Hydration (localStorage)
  // ============================================================

  /* ✅ FRESH START CONTRACT (Feb 2, 2026):
     - Default /wizard ALWAYS starts fresh at Step 1
     - Only ?resume=1 allows hydrating from localStorage
     - This prevents "landing on step 3" bug */
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
          devLog("[V7 SSOT] Fresh start (once per tab) — cleared storage, starting at location");
        }
      } else {
        if (import.meta.env.DEV) {
          devLog(
            "[V7 SSOT] Fresh start skipped (HMR remount) — keeping current storage, NOT hydrating"
          );
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
      devLog("[V7 SSOT] Resetting to location - incomplete session detected");
      safePayload.step = "location";
      safePayload.stepHistory = ["location"];
    }

    if (import.meta.env.DEV) {
      devLog("[V7 SSOT] Resume mode - hydrated state, step:", safePayload.step);
    }

    dispatch({ type: "HYDRATE_SUCCESS", payload: safePayload });
  }, [dispatch]);

  // ============================================================
  // Effect: Persistence (localStorage)
  // ============================================================

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
    state.step3AnswersMeta,
    state.step3Complete,
    state.step3Status,
    state.step3PartIndex,
    state.step3DefaultsAppliedParts,
    state.pricingFreeze,
    state.quote,
    state.debug,
  ]);

  // ============================================================
  // Effect: ZIP Divergence Detection
  // ============================================================

  /* Two-phase design prevents flicker loops:
       Phase 1: Snapshot ONLY on the false→true transition of locationConfirmed
       Phase 2: Unconfirm if locationRawInput diverges from snapshot
     The snapshot must NOT update on every rawInput change while confirmed,
     otherwise it would chase the user's keystrokes and never detect divergence. */
  const confirmedZipRef = useRef<string>("");
  const wasConfirmedRef = useRef<boolean>(false);

  // Phase 1: Snapshot ZIP on the exact moment confirmation transitions false→true
  useEffect(() => {
    if (state.locationConfirmed && !wasConfirmedRef.current) {
      // false→true transition: lock in the confirmed ZIP
      confirmedZipRef.current = normalizeZip5(state.locationRawInput ?? "");
      if (import.meta.env.DEV) {
        devLog(`[V7 SSOT] ZIP confirmed — snapshot locked: "${confirmedZipRef.current}"`);
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
        devLog(
          `[V7 SSOT] ZIP diverged ("${confirmedZipRef.current}" → "${currentZip}") — auto-unconfirmed`
        );
      }
    }
  }, [state.locationRawInput, dispatch, state.locationConfirmed]);

  // ============================================================
  // Return
  // ============================================================

  return {
    // Core utilities
    abortOngoing,
    setBusy,
    setError,
    clearError,

    // Session management
    resetSession,
    setStep,
    goBack,
  };
}
