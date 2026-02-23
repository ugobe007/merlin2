/**
 * useWizardStep3.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Step 3 orchestration hook - Profile questionnaire management
 *
 * Extracted from useWizardV7.ts (Op1b - Feb 22, 2026)
 *
 * Responsibilities:
 * - Answer management (set, patch, reset)
 * - Intel patch application (location, business)
 * - Step 3 FSM actions (parts navigation)
 * - Defaults management (apply, check, get)
 * - Step 3 submission (full, partial)
 *
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useCallback } from "react";
import type {
  Step3Answers,
  Step3Template,
  LocationCard,
  LocationIntel,
  SystemAddOns,
  WizardStep,
} from "./useWizardV7";
import { devLog, devWarn, devError } from "@/wizard/v7/debug/devLog";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type AnswerSource =
  | "user"
  | "template_default"
  | "question_default"
  | "location_intel"
  | "business_detection";

type Step3Action =
  | { type: "DEBUG_TAG"; lastAction: string }
  | { type: "DEBUG_NOTE"; note: string }
  | { type: "SET_STEP3_ANSWER"; id: string; value: unknown; source: AnswerSource }
  | { type: "SET_STEP3_ANSWERS"; answers: Step3Answers; source: AnswerSource }
  | { type: "PATCH_STEP3_ANSWERS"; patch: Step3Answers; source: AnswerSource }
  | { type: "RESET_STEP3_TO_DEFAULTS"; scope: "all" | { partId: string } }
  | { type: "STEP3_DEFAULTS_APPLIED"; partId: string; templateId: string }
  | { type: "STEP3_PART_NEXT" }
  | { type: "STEP3_PART_PREV" }
  | { type: "STEP3_PART_SET"; index: number }
  | { type: "SET_STEP3_COMPLETE"; complete: boolean }
  | { type: "SET_LOCATION"; location: LocationCard }
  | { type: "PRICING_START"; requestKey: string }
  | { type: "PRICING_SUCCESS"; output: unknown }
  | { type: "PRICING_ERROR"; error: { code: string; message: string } };

interface UseWizardStep3Dependencies {
  // State
  state: {
    step: string;
    industry: string;
    step3Answers: Step3Answers;
    step3AnswersMeta?: Record<string, { source?: AnswerSource; timestamp?: string }>;
    step3Template?: Step3Template;
    step3DefaultsAppliedParts: string[];
    locationIntel?: LocationIntel;
    businessCard?: unknown;
    location?: LocationCard;
    locationConfirmed?: boolean;
    goalsConfirmed?: boolean;
    step3Complete?: boolean;
    pricingStatus?: string;
    step4AddOns?: SystemAddOns;
  };
  // Actions
  dispatch: (action: Step3Action) => void;
  // Dependencies
  api: {
    buildIntelPatch: (locationIntel?: LocationIntel | null) => Step3Answers;
    buildBusinessPatch: (businessCard?: unknown) => Step3Answers;
    runPricingQuote: (contract: unknown, config: unknown) => Promise<unknown>;
  };
  // External actions
  clearError: () => void;
  setError: (error: { code: string; message: string }) => void;
  abortOngoing: () => void;
  setStep: (step: string | WizardStep, reason?: string) => void;
  runPricingSafe: (params: {
    industry: string;
    answers: Record<string, unknown>;
    location: LocationCard;
    locationIntel?: LocationIntel;
    addOns?: SystemAddOns;
  }) => Promise<{
    ok: boolean;
    error?: string;
    freeze?: unknown;
    quote?: unknown;
    warnings?: string[];
  }>;
  buildMinimalLocationFromZip: (state: {
    location?: LocationCard;
    step3Answers?: Step3Answers;
  }) => LocationCard | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Hook Implementation
// ──────────────────────────────────────────────────────────────────────────────

export function useWizardStep3(deps: UseWizardStep3Dependencies) {
  const {
    state,
    dispatch,
    api,
    clearError,
    setError,
    abortOngoing,
    setStep,
    runPricingSafe,
    buildMinimalLocationFromZip,
  } = deps;

  // ============================================================
  // Answer Management
  // ============================================================

  /**
   * setStep3Answer - Set a single answer (user edit)
   */
  const setStep3Answer = useCallback(
    (id: string, value: unknown) => {
      dispatch({ type: "DEBUG_TAG", lastAction: "setStep3Answer" });
      dispatch({ type: "SET_STEP3_ANSWER", id, value, source: "user" });
    },
    [dispatch]
  );

  /**
   * setStep3Answers - Set multiple answers at once
   */
  const setStep3Answers = useCallback(
    (answers: Step3Answers, source: AnswerSource = "user") => {
      dispatch({ type: "DEBUG_TAG", lastAction: "setStep3Answers" });
      dispatch({ type: "SET_STEP3_ANSWERS", answers, source });
    },
    [dispatch]
  );

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
  }, [state.locationIntel, api, dispatch]);

  /**
   * resetToDefaults - User explicitly requests "reset to defaults"
   *
   * This WILL overwrite user edits because user asked for it.
   * Provenance is rewritten to template_default/question_default.
   *
   * @param scope - "all" or { partId: string } for partial reset
   */
  const resetToDefaults = useCallback(
    (scope: "all" | { partId: string } = "all") => {
      dispatch({ type: "RESET_STEP3_TO_DEFAULTS", scope });
      dispatch({ type: "DEBUG_NOTE", note: `User reset to defaults: ${JSON.stringify(scope)}` });
    },
    [dispatch]
  );

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
    [state.step3Template?.id, dispatch]
  );

  /**
   * goToNextPart - Advance to next part in Step 3
   * Guarded by FSM - only works from part_active state
   */
  const goToNextPart = useCallback(() => {
    dispatch({ type: "STEP3_PART_NEXT" });
  }, [dispatch]);

  /**
   * goToPrevPart - Go back to previous part in Step 3
   */
  const goToPrevPart = useCallback(() => {
    dispatch({ type: "STEP3_PART_PREV" });
  }, [dispatch]);

  /**
   * setPartIndex - Jump to specific part index
   */
  const setPartIndex = useCallback(
    (index: number) => {
      dispatch({ type: "STEP3_PART_SET", index });
    },
    [dispatch]
  );

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

  // ============================================================
  // Step 3 Submission
  // ============================================================

  /**
   * submitStep3 - Complete Step 3 and navigate to Results
   *
   * Validation:
   * - Location must be confirmed (prerequisite)
   * - Goals must be confirmed (prerequisite)
   * - All required template questions must have answers
   *
   * On success:
   * - Marks step3Complete = true
   * - Navigates to "results" step
   * - Triggers pricing calculation (fire-and-forget)
   */
  const submitStep3 = useCallback(
    async (answersOverride?: Step3Answers) => {
      // Diagnostic log (Step3→Step4 root cause analysis)
      devLog("[submitStep3] start", {
        step: state.step,
        locationConfirmed: state.locationConfirmed,
        goalsConfirmed: state.goalsConfirmed,
        step3Complete: state.step3Complete,
      });

      // ✅ FIX (Feb 10, 2026): Check prerequisites and guide user to fix missing steps
      if (!state.locationConfirmed) {
        devError("[submitStep3] ❌ Blocked: Location not confirmed");
        setError({
          code: "PREREQUISITE",
          message: "Please confirm your location on Step 1 first.",
        });
        setStep("location", "prerequisite_missing");
        return;
      }

      if (!state.goalsConfirmed) {
        devError("[submitStep3] ❌ Blocked: Goals not confirmed");
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
      /* eslint-disable @typescript-eslint/no-explicit-any */
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
      /* eslint-enable @typescript-eslint/no-explicit-any */

      devLog("[V7] submitStep3 called (TEMPLATE SSOT)", {
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
        devWarn("[V7] submitStep3 blocked: pricing already pending");
        return;
      }

      // ✅ FIX (Feb 5, 2026): Accept ZIP-only minimal location
      let location = state.location;
      if (!location) {
        const minCard = buildMinimalLocationFromZip(state);
        location = minCard ?? undefined;
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
        devWarn("[V7] submitStep3 blocked (TEMPLATE validation)", {
          effectiveIndustry,
          reason: "Missing required fields",
          missingIds,
          answersCount: Object.keys(answers ?? {}).length,
          templateQ: templateQuestionCount,
          templateRequiredCount: templateRequiredIds.length,
          answers,
        });

        setError({
          code: "VALIDATION",
          message: `Please answer all required questions (${missingIds.length} missing).`,
        });
        return;
      }

      // ✅ Mark complete and navigate to next step (options)
      dispatch({ type: "SET_STEP3_COMPLETE", complete: true });
      setStep("options", "step3_complete");

      devLog("[V7] submitStep3 success - navigating to options (Step 4)", {
        answersCount: Object.keys(answers).length,
        templateQ: templateQuestionCount,
      });

      // Fire-and-forget pricing (non-blocking)
      runPricingSafe({
        industry: state.industry,
        answers,
        location: location || undefined,
        locationIntel: state.locationIntel ?? undefined,
        addOns: state.step4AddOns,
      }).catch((err) => {
        devLog("[V7] Pricing failed (non-fatal):", err);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state intentionally excluded (only uses specific fields)
    [
      abortOngoing,
      buildMinimalLocationFromZip,
      clearError,
      dispatch,
      runPricingSafe,
      setError,
      setStep,
      state.goalsConfirmed,
      state.industry,
      state.location,
      state.locationConfirmed,
      state.locationIntel,
      state.pricingStatus,
      state.step,
      state.step3Answers,
      state.step3Complete,
      state.step3Template,
      state.step4AddOns,
    ]
  );

  /**
   * submitStep3Partial - Navigate to Results with incomplete answers (NON-BLOCKING)
   *
   * Doctrine: Founders never get trapped. This allows progression even with gaps.
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
        devWarn("[V7] submitStep3Partial blocked: pricing already pending");
        return;
      }

      // ✅ FIX (Feb 5, 2026): Accept ZIP-only minimal location
      let location = state.location;
      if (!location) {
        const minCard = buildMinimalLocationFromZip(state);
        location = minCard ?? undefined;
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

      // ── PROVISIONAL PRICING: merge defaults + partial answers ──
      // Build a complete answer set by filling gaps with defaults.
      // Priority: user answer > template.defaults > question.defaultValue
      const mergedAnswers: Record<string, unknown> = {};

      // 1. Seed from template-level defaults
      if (state.step3Template.defaults) {
        for (const [key, val] of Object.entries(state.step3Template.defaults)) {
          if (val !== undefined && val !== null) mergedAnswers[key] = val;
        }
      }

      // 2. Overlay per-question defaultValues (slightly higher priority)
      for (const q of state.step3Template.questions ?? []) {
        if (q.defaultValue !== undefined && q.defaultValue !== null && !(q.id in mergedAnswers)) {
          mergedAnswers[q.id] = q.defaultValue;
        }
      }

      // 3. Overlay actual user answers (highest priority)
      for (const [key, val] of Object.entries(state.step3Answers ?? {})) {
        if (val !== undefined && val !== null) mergedAnswers[key] = val;
      }

      devLog("[V7] Partial submit - merged defaults + user answers, running provisional pricing");

      // Fire-and-forget provisional pricing (non-blocking, user already on results page)
      runPricingSafe({
        industry: state.industry,
        answers: mergedAnswers,
        location: location || undefined,
        locationIntel: state.locationIntel ?? undefined,
        addOns: state.step4AddOns,
      }).catch((err) => {
        devLog("[V7] Provisional pricing failed (non-fatal):", err);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state intentionally excluded (only uses specific fields)
    [
      abortOngoing,
      buildMinimalLocationFromZip,
      clearError,
      dispatch,
      runPricingSafe,
      setError,
      setStep,
      state.industry,
      state.location,
      state.locationIntel,
      state.pricingStatus,
      state.step3Answers,
      state.step3Template,
      state.step4AddOns,
    ]
  );

  // ============================================================
  // Return Actions
  // ============================================================

  return {
    // Answer management
    setStep3Answer,
    setStep3Answers,
    applyIntelPatch,
    resetToDefaults,
    // FSM actions
    markDefaultsApplied,
    goToNextPart,
    goToPrevPart,
    setPartIndex,
    hasDefaultsApplied,
    // Defaults helpers
    partHasAnyDefaults,
    canApplyDefaults,
    canResetToDefaults,
    getDefaultForQuestion,
    // Submission
    submitStep3,
    submitStep3Partial,
  };
}
