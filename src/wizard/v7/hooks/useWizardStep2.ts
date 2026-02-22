// src/wizard/v7/hooks/useWizardStep2.ts
/**
 * ============================================================
 * WizardV7 - Step 2: Industry Selection Hook
 * ============================================================
 * Extracted from useWizardV7.ts - Op1e-2 (Feb 22, 2026)
 *
 * Responsibilities:
 * - Handle industry selection callback
 * - Load industry-specific template from API
 * - Merge schema defaults + template baseline + intel patches
 * - Activate fallback template on load failure (never block)
 * - Integrate with Merlin Memory for persistence
 * - Transition to profile step (Step 3)
 *
 * Dependencies:
 * - wizardAPI: loadStep3Template, computeSmartDefaults, buildIntelPatch, buildBusinessPatch
 * - curatedFieldsResolver: resolveStep3Schema
 * - merlinMemory: persist industry selection
 * - templateIndex: getFallbackTemplate (recovery path)
 *
 * Architecture:
 * - Merges defaults from 4 sources (priority: schema < template < intel < business)
 * - Schema provides ALL question defaults (completeness)
 * - Template provides industry-specific baselines (accuracy)
 * - Intel/Business patches provide context-aware overrides (intelligence)
 */

import { useCallback } from "react";
import { resolveStep3Schema } from "@/wizard/v7/schema/curatedFieldsResolver";
import { merlinMemory } from "@/wizard/v7/memory";
import { wizardAPI as api } from "@/wizard/v7/api/wizardAPI";
import { devLog, devWarn, devError } from "@/wizard/v7/debug/devLog";

// Import types from main hook
import type {
  IndustrySlug,
  LocationCard,
  LocationIntel,
  BusinessCard,
  Step3Template,
  Intent,
  WizardStep,
} from "./useWizardV7";

/**
 * Hook parameters - all state and callbacks come from parent
 */
export interface UseWizardStep2Params {
  // State
  location: LocationCard | null;
  locationIntel?: LocationIntel | null;
  businessCard?: BusinessCard | null;

  // Callbacks from parent
  dispatch: (intent: Intent) => void;
  clearError: () => void;
  setBusy: (busy: boolean, status?: string) => void;
  setError: (error: unknown) => void;
  setStep: (step: WizardStep, reason?: string) => void;
  abortOngoing: () => void;

  // Abort controller ref
  abortRef: React.MutableRefObject<AbortController | null>;
}

/**
 * Hook return type
 */
export interface UseWizardStep2Result {
  selectIndustry: (industry: IndustrySlug) => Promise<void>;
}

/**
 * Helper: Check if error is AbortError
 */
function isAbort(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AbortError" ||
      (err as { code?: string }).code === "ERR_CANCELED" ||
      (err as { code?: string }).code === "ECONNABORTED")
  );
}

/**
 * useWizardStep2 Hook
 *
 * Provides Step 2 industry selection logic.
 *
 * @param params - State and callbacks from parent hook
 * @returns selectIndustry callback
 */
export function useWizardStep2(params: UseWizardStep2Params): UseWizardStep2Result {
  const {
    location,
    locationIntel,
    businessCard,
    dispatch,
    clearError,
    setBusy,
    setError,
    setStep,
    abortOngoing,
    abortRef,
  } = params;

  /**
   * selectIndustry - SSOT industry selection callback
   *
   * Flow:
   * 1. Validate location exists (Step 1 required)
   * 2. Load industry-specific template from API
   * 3. Resolve curated schema for selected industry
   * 4. Merge defaults: schema → template → intel → business
   * 5. Persist industry selection to Merlin Memory
   * 6. Transition to profile step (Step 3)
   *
   * Recovery:
   * - If template load fails, activate generic fallback template
   * - User still proceeds to Step 3 (wizard never blocks)
   *
   * @param industry - Selected industry slug
   */
  const selectIndustry = useCallback(
    async (industry: IndustrySlug) => {
      clearError();
      abortOngoing();
      dispatch({ type: "DEBUG_TAG", lastAction: "selectIndustry" });

      // Validation: Location required
      if (!location) {
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

        devLog("[V7 SSOT] selectIndustry: calling loadStep3Template for", industry);
        const template = await api.loadStep3Template(industry, controller.signal);
        devLog("[V7 SSOT] selectIndustry: template loaded", template?.id);
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
        const intelPatch = api.buildIntelPatch(locationIntel ?? null);
        const businessPatch = api.buildBusinessPatch(businessCard ?? null);

        // 4) Merge: schema → template → intel → business (later wins)
        const mergedAnswers = {
          ...schemaDefaults,
          ...baselineAnswers,
          ...intelPatch,
          ...businessPatch,
        };

        devLog(
          "[V7 SSOT] selectIndustry: applied baseline + intel + business patches (SCHEMA-aligned)",
          {
            industry,
            effectiveIndustry,
            schemaQ: schema.questions.length,
            schemaDefaultsCount: Object.keys(schemaDefaults).length,
            baselineCount: Object.keys(baselineAnswers).length,
            intelCount: Object.keys(intelPatch).length,
            businessCount: Object.keys(businessPatch).length,
            mergedCount: Object.keys(mergedAnswers).length,
          }
        );

        dispatch({
          type: "SET_STEP3_ANSWERS",
          answers: mergedAnswers,
          source: "template_default",
        });

        setStep("profile", "industry_selected");
        devLog("[V7 SSOT] selectIndustry: transitioned to profile step");
      } catch (err: unknown) {
        devError("[V7 SSOT] selectIndustry ERROR:", err);

        // AbortError = user navigated away — just surface it
        if (isAbort(err)) {
          setError({ code: "ABORTED", message: "Request cancelled." });
          return; // finally still runs
        }

        // ──────────────────────────────────────────────────────────
        // RECOVERY: Template load failed → load generic fallback and
        // navigate to Step 3 anyway. Merlin never gets stuck.
        // ──────────────────────────────────────────────────────────
        devWarn("[V7 SSOT] selectIndustry: template load failed — activating fallback path");
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

          devLog("[V7 SSOT] selectIndustry: fallback template loaded, navigating to profile");
          setStep("profile", "industry_selected_fallback");
        } catch (fallbackErr: unknown) {
          // Even the fallback import failed — surface the original error
          devError("[V7 SSOT] selectIndustry: fallback also failed", fallbackErr);
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
      location,
      locationIntel,
      businessCard,
      dispatch,
      abortRef,
    ]
  );

  return { selectIndustry };
}
