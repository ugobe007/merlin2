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

import React, { useCallback, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
import ProQuoteHowItWorksModal from "@/components/shared/ProQuoteHowItWorksModal";

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
  const [showProQuoteModal, setShowProQuoteModal] = useState(false);

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

      {/* ── Inline guidance ── */}
      <div className="space-y-2.5">
        <p className="text-sm leading-relaxed text-slate-400">
          Optional add-ons for your{" "}
          <span className="text-slate-200 font-medium">{industryLabel}</span> site
          {peakKW > 0 && (
            <span className="text-slate-500">{" "}· {Math.round(peakKW)} kW peak</span>
          )}
          {data.peakSunHours > 0 && (
            <span className="text-slate-500">{" "}· {data.peakSunHours} sun hrs/day</span>
          )}
        </p>
        <p className="text-xs text-slate-500">
          Toggle any card to include it, choose a tier, or skip to continue.
        </p>
      </div>

      {/* Pricing status indicator */}
      {isPricingPending && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3ECF8E]/[0.08] border border-[#3ECF8E]/15">
          <Loader2 className="w-4 h-4 text-[#3ECF8E] animate-spin" />
          <span className="text-sm text-[#3ECF8E] font-medium">Calculating your system sizing…</span>
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

      {/* ── ProQuote™ upsell — Merlin as salesman ── */}
      <button
        type="button"
        onClick={() => setShowProQuoteModal(true)}
        className="group w-full flex items-center justify-between gap-3 px-5 py-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-[#3ECF8E]/20 hover:bg-[#3ECF8E]/[0.03] transition-all"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-[#3ECF8E] opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="text-left">
            <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
              Need full control?
            </span>
            <span className="text-sm text-slate-500 ml-1.5">
              Open in ProQuote™ for advanced configuration
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#3ECF8E]/60 group-hover:text-[#3ECF8E] tracking-wide uppercase transition-colors">
          Learn more →
        </span>
      </button>

      {/* ProQuote™ explainer modal */}
      <ProQuoteHowItWorksModal
        isOpen={showProQuoteModal}
        onClose={() => setShowProQuoteModal(false)}
        onOpenProQuote={() => {
          setShowProQuoteModal(false);
          window.location.href = "/quote-builder";
        }}
      />

      {/* Navigation handled by shell bottom nav — "See MagicFit →" */}
    </div>
  );
}
