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
 * Updated Feb 11, 2026: Clearer header, better navigation visibility
 */

import React, { useCallback } from "react";
import {
  Sparkles,
  ArrowRight,
  SkipForward,
} from "lucide-react";
import type {
  WizardState as WizardV7State,
  WizardStep,
  PricingStatus,
  SystemAddOns,
} from "@/wizard/v7/hooks/useWizardV7";
import { DEFAULT_ADD_ONS } from "@/wizard/v7/hooks/useWizardV7";
import { SystemAddOnsCards } from "./SystemAddOnsCards";

type Props = {
  state: WizardV7State;
  actions: {
    goBack: () => void;
    goToStep: (step: WizardStep) => Promise<void>;
    recalculateWithAddOns?: (addOns: SystemAddOns) => Promise<{ ok: boolean; error?: string }>;
  };
};

export default function Step4OptionsV7({ state, actions }: Props) {
  const pricingStatus: PricingStatus = state.pricingStatus ?? "idle";

  const handleAddOnsConfirmed = useCallback(async (addOns: SystemAddOns) => {
    if (actions.recalculateWithAddOns) {
      const result = await actions.recalculateWithAddOns(addOns);
      return result;
    }
    return { ok: true };
  }, [actions]);

  const handleContinue = useCallback(() => {
    actions.goToStep("magicfit");
  }, [actions]);

  const peakKW = state.quote?.peakLoadKW;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-purple-400" />
          Enhance Your System
        </h1>
        <p className="text-slate-400 text-sm mt-1.5">
          {peakKW
            ? `Your facility uses ~${Math.round(peakKW)} kW peak. Adding solar or backup generation can improve savings and resilience.`
            : "Add solar panels, backup generators, or EV chargers to maximize your investment."}
        </p>
        <p className="text-slate-500 text-xs mt-1">
          These are <strong className="text-slate-400">optional</strong> — you can skip to see Merlin's recommendations.
        </p>
      </div>

      {/* System Add-Ons Cards */}
      {peakKW != null && (
        <SystemAddOnsCards
          state={state}
          currentAddOns={state.step4AddOns ?? DEFAULT_ADD_ONS}
          onRecalculate={handleAddOnsConfirmed}
          pricingStatus={pricingStatus}
          showGenerateButton={false}
        />
      )}

      {/* Navigation — Sticky at bottom for visibility */}
      <div className="sticky bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-6 pb-2 -mx-4 px-4">
        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/[0.06] bg-slate-900/80 backdrop-blur-sm">
          <button
            type="button"
            onClick={handleContinue}
            className="text-sm text-slate-400 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Skip — keep base system
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
          >
            Continue to MagicFit
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
