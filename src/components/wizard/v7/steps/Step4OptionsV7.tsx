/**
 * STEP 4: OPTIONS — System Add-Ons Configuration
 * ================================================
 * User configures solar, generators, EV chargers before MagicFit.
 * Thin wrapper around SystemAddOnsCards with clear navigation.
 *
 * Flow: Step 3 (Profile) → Step 4 (Options) → Step 5 (MagicFit)
 *
 * Updated Feb 11, 2026:
 * - Pulls all data from Merlin Memory (not state.quote file paths)
 * - Supabase-style inline intro text at top
 * - Cards render in full expanded display by default
 */

import React, { useCallback } from "react";
import {
  Loader2,
  Sun,
  Zap,
  Shield,
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
import { getIndustryMeta } from "@/wizard/v7/industryMeta";

type Props = {
  state: WizardV7State;
  actions: {
    goBack: () => void;
    goToStep: (step: WizardStep) => Promise<void>;
    recalculateWithAddOns?: (addOns: SystemAddOns) => Promise<{ ok: boolean; error?: string }>;
  };
};

export default function Step4OptionsV7({ state, actions }: Props) {
  // ✅ MERLIN MEMORY: All data from Memory — no direct state.quote reads
  const data = useMerlinData(state);
  const pricingStatus: PricingStatus = state.pricingStatus ?? "idle";

  const handleAddOnsConfirmed = useCallback(async (addOns: SystemAddOns) => {
    if (actions.recalculateWithAddOns) {
      const result = await actions.recalculateWithAddOns(addOns);
      return result;
    }
    return { ok: true };
  }, [actions]);

  const peakKW = data.peakLoadKW;
  const industryMeta = getIndustryMeta(data.industry);
  const industryLabel = (industryMeta.label as string) || "Commercial";
  const isPricingPending = pricingStatus === "pending" || pricingStatus === "idle";

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Supabase-style inline intro ── */}
      <div className="space-y-3">
        <p className="text-[15px] leading-relaxed text-slate-300">
          Based on your <span className="text-purple-400 font-semibold">{industryLabel}</span> profile
          {peakKW > 0 && (
            <> with <span className="text-white font-semibold">~{Math.round(peakKW)} kW</span> peak demand</>
          )}, Merlin has pre-configured three optional add-ons below.
          Each one shows tiered options — pick a tier that fits your budget, or skip entirely.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><Sun className="w-3 h-3 text-amber-400" /> Solar offsets energy costs</span>
          <span className="text-slate-700">·</span>
          <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3 text-cyan-400" /> EV chargers generate revenue</span>
          <span className="text-slate-700">·</span>
          <span className="inline-flex items-center gap-1"><Shield className="w-3 h-3 text-red-400" /> Generators protect uptime</span>
          <span className="text-slate-700">·</span>
          <span className="text-slate-500">All optional — skip to continue</span>
        </div>
      </div>

      {/* Pricing status indicator */}
      {isPricingPending && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
          <span className="text-sm text-purple-300 font-medium">Calculating your system sizing…</span>
        </div>
      )}

      {/* System Add-Ons Cards — pulls from Merlin Memory via merlinData prop */}
      <SystemAddOnsCards
        state={state}
        currentAddOns={state.step4AddOns ?? DEFAULT_ADD_ONS}
        onRecalculate={handleAddOnsConfirmed}
        pricingStatus={pricingStatus}
        showGenerateButton={false}
        merlinData={data}
      />

      {/* Navigation handled by shell bottom nav — "See MagicFit →" */}
    </div>
  );
}
