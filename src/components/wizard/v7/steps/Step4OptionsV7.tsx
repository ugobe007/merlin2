/**
 * STEP 4: OPTIONS — System Add-Ons Configuration
 * ================================================
 * User configures solar, generators, EV chargers before MagicFit.
 * Thin wrapper around SystemAddOnsCards with clear navigation.
 *
 * Flow: Step 3 (Profile) → Step 4 (Options) → Step 5 (MagicFit)
 *
 * SSOT: SystemAddOnsCards handles all calculation via step4PreviewService.
 * This component only handles layout and navigation.
 *
 * Updated Feb 11, 2026: Always render cards (no peakKW gate) — pricing runs
 * async after step3 submit, so peakKW may not be available immediately.
 * SystemAddOnsCards has its own fallback (300 kW default).
 */

import React, { useCallback } from "react";
import {
  Sparkles,
  Loader2,
} from "lucide-react";
import type {
  WizardState as WizardV7State,
  WizardStep,
  PricingStatus,
  SystemAddOns,
} from "@/wizard/v7/hooks/useWizardV7";
import { DEFAULT_ADD_ONS } from "@/wizard/v7/hooks/useWizardV7";
import { SystemAddOnsCards } from "./SystemAddOnsCards";
import { useMerlinData } from "@/wizard/v7/memory";

type Props = {
  state: WizardV7State;
  actions: {
    goBack: () => void;
    goToStep: (step: WizardStep) => Promise<void>;
    recalculateWithAddOns?: (addOns: SystemAddOns) => Promise<{ ok: boolean; error?: string }>;
  };
};

export default function Step4OptionsV7({ state, actions }: Props) {
  // ✅ MERLIN MEMORY: Read cross-step data from Memory first, fall back to state
  const data = useMerlinData(state);
  const pricingStatus: PricingStatus = state.pricingStatus ?? "idle";

  const handleAddOnsConfirmed = useCallback(async (addOns: SystemAddOns) => {
    if (actions.recalculateWithAddOns) {
      const result = await actions.recalculateWithAddOns(addOns);
      return result;
    }
    return { ok: true };
  }, [actions]);

  const peakKW = data.peakLoadKW || state.quote?.peakLoadKW || 0;
  const isPricingPending = pricingStatus === "pending" || pricingStatus === "idle";

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-purple-400" />
          Enhance Your System
        </h1>
        <p className="text-slate-400 text-sm mt-1.5">
          {peakKW > 0
            ? `Your facility uses ~${Math.round(peakKW)} kW peak. Adding solar or backup generation can improve savings and resilience.`
            : "Add solar panels, backup generators, or EV chargers to maximize your investment."}
        </p>
        <p className="text-slate-500 text-xs mt-1">
          These are <strong className="text-slate-400">optional</strong> — you can skip to see Merlin's recommendations.
        </p>
      </div>

      {/* Pricing status indicator */}
      {isPricingPending && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
          <span className="text-sm text-purple-300 font-medium">Calculating your system sizing…</span>
        </div>
      )}

      {/* System Add-Ons Cards — always render (SystemAddOnsCards has its own fallbacks) */}
      <SystemAddOnsCards
        state={state}
        currentAddOns={state.step4AddOns ?? DEFAULT_ADD_ONS}
        onRecalculate={handleAddOnsConfirmed}
        pricingStatus={pricingStatus}
        showGenerateButton={false}
      />

      {/* Navigation handled by shell bottom nav — "See MagicFit →" */}
    </div>
  );
}
