/**
 * STEP 4: OPTIONS — System Add-Ons Configuration
 * ================================================
 * User configures solar, generators, EV chargers before MagicFit.
 * Thin wrapper around SystemAddOnsCards with navigation.
 *
 * Flow: Step 3 (Profile) → Step 4 (Options) → Step 5 (MagicFit)
 *
 * SSOT: SystemAddOnsCards handles all calculation via step4PreviewService.
 * This component only handles layout and navigation.
 */

import React, { useCallback } from "react";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Zap,
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

  const peakKW = state.peakLoadKW ?? state.quote?.peakLoadKW;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-purple-400" />
            System Options
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Because your facility uses {peakKW ? `${Math.round(peakKW)} kW peak` : "significant power"},
            adding renewables can cut costs and improve resilience.
          </p>
        </div>
        <button
          onClick={actions.goBack}
          className="h-9 px-3.5 rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] font-bold text-sm flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>

      {/* Guidance Banner */}
      <div className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.06] p-4">
        <div className="flex items-start gap-2.5">
          <Zap className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-purple-300 text-sm">Enhance Your System</div>
            <p className="text-purple-200/70 text-xs mt-1">
              Add solar panels, backup generators, or EV chargers to maximize savings.
              Configure below, or skip to see recommendations.
            </p>
          </div>
        </div>
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

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={handleContinue}
          className="text-sm text-slate-400 hover:text-slate-300 underline underline-offset-2 transition-colors"
        >
          Skip — keep base system →
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
        >
          Continue to MagicFit
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
