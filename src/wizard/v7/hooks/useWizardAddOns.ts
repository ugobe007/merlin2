/**
 * useWizardAddOns.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Add-ons & Goals orchestration hook
 *
 * Extracted from useWizardV7.ts (Op1c - Feb 22, 2026)
 *
 * Responsibilities:
 * - Goals management (set, toggle, confirm)
 * - Add-ons toggles (solar, generator, EV)
 * - Add-ons sizing (solar sizing modal results)
 * - Add-ons confirmation
 * - Pricing recalculation with add-ons
 *
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useCallback } from "react";
import type { EnergyGoal, SystemAddOns, LocationCard, LocationIntel, Step3Answers } from "./useWizardV7";
import { merlinMemory } from "@/wizard/v7/memory";
import { devWarn } from "@/wizard/v7/debug/devLog";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type AddOnsAction =
  | { type: "SET_GOALS"; goals: EnergyGoal[] }
  | { type: "TOGGLE_GOAL"; goal: EnergyGoal }
  | { type: "SET_GOALS_CONFIRMED"; confirmed: boolean }
  | { type: "TOGGLE_SOLAR" }
  | { type: "SET_SOLAR_SIZING"; solarKW: number }
  | { type: "TOGGLE_GENERATOR" }
  | { type: "TOGGLE_EV" }
  | { type: "SET_ADDONS_CONFIRMED"; confirmed: boolean }
  | { type: "SET_STEP4_ADDONS"; addOns: SystemAddOns }
  | { type: "PRICING_RETRY" }
  | { type: "REQUEST_GOALS_MODAL" }
  | { type: "DEBUG_NOTE"; note: string };

export interface UseWizardAddOnsDependencies {
  // State
  state: {
    goals: EnergyGoal[];
    industry: string;
    step3Answers: Step3Answers;
    location?: LocationCard | null;
    locationIntel?: LocationIntel | null;
  };
  // Actions
  dispatch: (action: AddOnsAction) => void;
  // External actions
  runPricingSafe: (params: {
    industry: string;
    answers: Record<string, unknown>;
    location?: LocationCard;
    locationIntel?: LocationIntel;
    addOns?: SystemAddOns;
  }) => Promise<{ ok: boolean; error?: string; freeze?: unknown; quote?: unknown; warnings?: string[] }>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Hook Implementation
// ──────────────────────────────────────────────────────────────────────────────

export function useWizardAddOns(deps: UseWizardAddOnsDependencies) {
  const { state, dispatch, runPricingSafe } = deps;

  // ============================================================
  // Goals Management
  // ============================================================

  /**
   * setGoals - Set all goals at once
   */
  const setGoals = useCallback(
    (goals: EnergyGoal[]) => {
      dispatch({ type: "SET_GOALS", goals });
    },
    [dispatch]
  );

  /**
   * toggleGoal - Toggle a single goal on/off
   */
  const toggleGoal = useCallback(
    (goal: EnergyGoal) => {
      dispatch({ type: "TOGGLE_GOAL", goal });
    },
    [dispatch]
  );

  /**
   * confirmGoals - User confirms goals selection (or skips)
   */
  const confirmGoals = useCallback(
    (value: boolean) => {
      dispatch({ type: "SET_GOALS_CONFIRMED", confirmed: value });
      dispatch({ type: "DEBUG_NOTE", note: `Goals ${value ? "confirmed" : "skipped"} by user` });

      // ✅ MERLIN MEMORY (Feb 11, 2026): Persist goals
      if (value) {
        merlinMemory.set("goals", {
          selected: state.goals,
          confirmedAt: Date.now(),
        });
      }
    },
    [state.goals, dispatch]
  );

  /**
   * requestGoalsModal - Request goals modal to be shown
   */
  const requestGoalsModal = useCallback(() => {
    dispatch({ type: "REQUEST_GOALS_MODAL" });
  }, [dispatch]);

  // ============================================================
  // Add-ons Toggles
  // ============================================================

  /**
   * toggleSolar - Toggle solar add-on
   */
  const toggleSolar = useCallback(() => {
    dispatch({ type: "TOGGLE_SOLAR" });
  }, [dispatch]);

  /**
   * setSolarSizing - Apply solar sizing result from SolarSizingModal (Feb 18, 2026)
   * Sets includeSolar=true and populates solarKW in step4AddOns
   */
  const setSolarSizing = useCallback(
    (solarKW: number) => {
      dispatch({ type: "SET_SOLAR_SIZING", solarKW });
      dispatch({
        type: "DEBUG_NOTE",
        note: `Solar sizing applied: ${solarKW} kW from SolarSizingModal`,
      });
    },
    [dispatch]
  );

  /**
   * toggleGenerator - Toggle generator add-on
   */
  const toggleGenerator = useCallback(() => {
    dispatch({ type: "TOGGLE_GENERATOR" });
  }, [dispatch]);

  /**
   * toggleEV - Toggle EV charging add-on
   */
  const toggleEV = useCallback(() => {
    dispatch({ type: "TOGGLE_EV" });
  }, [dispatch]);

  /**
   * confirmAddOns - User confirms add-ons selection (or skips)
   */
  const confirmAddOns = useCallback((value: boolean) => {
    dispatch({ type: "SET_ADDONS_CONFIRMED", confirmed: value });
    dispatch({ type: "DEBUG_NOTE", note: `Add-ons ${value ? "confirmed" : "skipped"} by user` });
  }, [dispatch]);

  // ============================================================
  // Pricing Recalculation
  // ============================================================

  /**
   * recalculateWithAddOns - Re-run pricing with new add-on configuration from Step 4.
   *
   * Flow: User toggles solar/generator/EV in Step 4 → saves add-ons → re-runs pricing.
   * Layer A (load profile) is re-computed (no cache), Layer B (pricing) gets add-on values.
   */
  const recalculateWithAddOns = useCallback(
    async (addOns: SystemAddOns) => {
      if (state.industry === "auto") {
        devWarn("[V7] Cannot recalculate: industry not set");
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
        // itcBonuses: addOns.itcBonuses, // DISABLED
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
    },
    [dispatch, runPricingSafe, state.industry, state.step3Answers, state.location, state.locationIntel]
  );

  // ============================================================
  // Return
  // ============================================================

  return {
    // Goals
    setGoals,
    toggleGoal,
    confirmGoals,
    requestGoalsModal,

    // Add-ons
    toggleSolar,
    setSolarSizing,
    toggleGenerator,
    toggleEV,
    confirmAddOns,
    recalculateWithAddOns,
  };
}
