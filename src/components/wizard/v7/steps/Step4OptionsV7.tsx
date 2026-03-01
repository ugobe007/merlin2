/**
 * STEP 4: BACKUP POWER — Optional Generator Configuration
 * =========================================================
 * BESS quote is built from Steps 1-3. Step 4 lets the user optionally add
 * a backup generator to the core quote (affects total cost + resilience).
 *
 * Solar, Wind, EV Chargers are post-quote add-ons shown in Step 6
 * ("Maximize Your Savings") AFTER the user sees their BESS savings.
 *
 * Flow: Step 3 (Profile) → Step 4 (Backup Power) → Step 5 (MagicFit) → Step 6 (Quote + Upgrades)
 */

import React, { useCallback, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type {
  WizardState as WizardV7State,
  WizardStep,
  PricingStatus,
  SystemAddOns,
  ITCBonuses,
} from "@/wizard/v7/hooks/useWizardV7";
import { DEFAULT_ADD_ONS, DEFAULT_ITC_BONUSES } from "@/wizard/v7/hooks/useWizardV7";
import { GeneratorCard } from "./GeneratorCard";
import ITCBonusCard from "../shared/ITCBonusCard";
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

  // ITC bonus qualifications state (IRA 2022)
  const [itcBonuses, setItcBonuses] = useState<ITCBonuses>(
    () => state.step4AddOns?.itcBonuses ?? DEFAULT_ITC_BONUSES
  );

  // Wrap callback to always include ITC bonuses in add-ons
  const handleAddOnsConfirmed = useCallback(
    async (addOns: SystemAddOns) => {
      if (actions.recalculateWithAddOns) {
        const result = await actions.recalculateWithAddOns({ ...addOns, itcBonuses });
        return result;
      }
      return { ok: true };
    },
    [actions, itcBonuses]
  );

  // When ITC bonuses change, trigger recalculation
  const handleITCChange = useCallback(
    (newBonuses: ITCBonuses) => {
      setItcBonuses(newBonuses);
      if (actions.recalculateWithAddOns) {
        const currentAddOns = state.step4AddOns ?? DEFAULT_ADD_ONS;
        actions.recalculateWithAddOns({ ...currentAddOns, itcBonuses: newBonuses });
      }
    },
    [actions, state.step4AddOns]
  );

  const peakKW = data.peakLoadKW;
  const industryMeta = getIndustryMeta(data.industry);
  const industryLabel = (industryMeta.label as string) || "Commercial";
  const isPricingPending = pricingStatus === "pending" || pricingStatus === "idle";

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ── Intro ── */}
      <div className="space-y-2.5">
        <p className="text-sm leading-relaxed text-slate-400">
          Your <span className="text-slate-200 font-medium">{industryLabel}</span> BESS quote
          {peakKW > 0 && <span className="text-slate-500"> · {Math.round(peakKW)} kW peak</span>} is
          ready. Add a backup generator if you need power during outages.
        </p>
        <p className="text-xs text-slate-500">
          Skip this step if BESS alone meets your needs. Solar and EV add-ons are available after
          you see your quote.
        </p>
      </div>

      {/* Pricing status indicator */}
      {isPricingPending && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3ECF8E]/[0.08] border border-[#3ECF8E]/15">
          <Loader2 className="w-4 h-4 text-[#3ECF8E] animate-spin" />
          <span className="text-sm text-[#3ECF8E] font-medium">
            Calculating your system sizing…
          </span>
        </div>
      )}
      {/* Generator — optional backup power, included in core quote */}
      <GeneratorCard
        state={state}
        peakLoadKW={peakKW}
        currentAddOns={state.step4AddOns ?? DEFAULT_ADD_ONS}
        onRecalculate={handleAddOnsConfirmed}
      />

      {/* ── ITC Bonus Qualifications (IRA 2022) ── */}
      <ITCBonusCard
        bonuses={itcBonuses}
        onChange={handleITCChange}
        capacityMW={peakKW > 0 ? (peakKW / 1000) * 0.4 : 1}
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
