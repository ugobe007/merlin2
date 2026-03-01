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

import React, { useCallback, useEffect, useState } from "react";
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
import { getCriticalLoadWithSource } from "@/services/benchmarkSources";
import { TrueQuoteTemp } from "@/wizard/v7/trueQuoteTemp";
import ProQuoteHowItWorksModal from "@/components/shared/ProQuoteHowItWorksModal";

// ── Industry Power Resilience Narrative ─────────────────────────────────────
// Each industry's urgency level and risk copy is grounded in IEEE 446, NEC,
// and LADWP guidelines — the same sources that back the critical load %.

const INDUSTRY_URGENCY: Record<string, { label: string; badgeClass: string; headline: string }> = {
  hospital: {
    label: "CRITICAL",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/25",
    headline:
      "Life safety systems require uninterrupted power. NEC Article 700 mandates emergency backup for all patient care facilities.",
  },
  healthcare: {
    label: "CRITICAL",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/25",
    headline:
      "Life safety systems require uninterrupted power. NEC Article 700 mandates emergency backup for all patient care facilities.",
  },
  data_center: {
    label: "CRITICAL",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/25",
    headline:
      "Every minute of downtime carries SLA penalties and reputational damage. BESS bridges micro-outages — a generator sustains operation through extended grid events.",
  },
  airport: {
    label: "HIGH",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/25",
    headline:
      "FAA regulations require backup power for safety-critical navigation and security systems. Disruption affects hundreds of passengers simultaneously.",
  },
  manufacturing: {
    label: "HIGH",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/25",
    headline:
      "Unplanned production stoppages multiply costs fast — restart procedures, scrap, and missed shipments can exceed a generator's entire lifecycle cost in a single incident.",
  },
  cold_storage: {
    label: "HIGH",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/25",
    headline:
      "Temperature chain disruption means product loss. A 4-hour outage can spoil inventory worth more than the generator itself.",
  },
  hotel: {
    label: "MODERATE",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    headline:
      "Guests expect lights, elevators, and climate control around the clock. Outages trigger early checkouts, negative reviews, and potential liability.",
  },
  casino: {
    label: "MODERATE",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    headline:
      "Gaming floors, security systems, and hotel operations must stay online. Outages expose significant regulatory and revenue risk.",
  },
  office: {
    label: "MODERATE",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    headline:
      "Server rooms, access control, and emergency lighting are non-negotiable. Most general lighting and HVAC can be shed — your critical systems cannot.",
  },
  government: {
    label: "MODERATE",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    headline:
      "Continuity of operations is often mandated, not optional. Public safety functions must remain available regardless of grid status.",
  },
  retail: {
    label: "LOWER",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    headline:
      "POS systems and refrigeration are the priority. BESS alone may cover short outages — a generator extends protection beyond battery duration.",
  },
  warehouse: {
    label: "LOWER",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    headline:
      "Operations can pause — but cold storage and security cannot. A generator protects the critical subset of loads that can't stop.",
  },
  car_wash: {
    label: "OPTIONAL",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/25",
    headline:
      "A car wash can close during an outage. A generator is an operational upgrade — it keeps you open and earning when competitors go dark.",
  },
  ev_charging: {
    label: "LOWER",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    headline:
      "EV charging is convenience infrastructure. Backup power keeps priority chargers available and protects your grid interconnection equipment.",
  },
};

function getUrgencyConfig(industry: string) {
  const key = industry.toLowerCase().replace(/-/g, "_");
  return (
    INDUSTRY_URGENCY[key] ?? {
      label: "MODERATE",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/25",
      headline:
        "Adding backup generation to your BESS system provides resilience when the grid goes down for an extended period.",
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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

  // Clear stale Solar / EV / Wind from TrueQuoteTemp on Step 4 mount.
  // Step 4 now only owns the generator; if a previous session had Solar or EV
  // toggled on (via the old SystemAddOnsCards), those values persist in
  // sessionStorage and bleed into Step 5's snapshot, showing equipment the
  // user never selected.  Zero them out immediately on entry.
  useEffect(() => {
    TrueQuoteTemp.writeAddOns({
      includeSolar: false,
      solarKW: 0,
      includeWind: false,
      windKW: 0,
      includeEV: false,
      evChargerKW: 0,
      evInstallCost: 0,
      evMonthlyRevenue: 0,
      // generator fields are preserved by GeneratorCard on first interaction
      includeGenerator: TrueQuoteTemp.get().includeGenerator,
      generatorKW: TrueQuoteTemp.get().generatorKW,
      generatorFuelType: TrueQuoteTemp.get().generatorFuelType,
    });
  }, []); // once on mount

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
  const isPricingPending = pricingStatus === "pending";

  // ── Power risk analysis — TrueQuote™ sourced ──
  // getCriticalLoadWithSource() traces critical load % back to IEEE 446, NEC,
  // and LADWP — the same authoritative sources shown in the TrueQuote audit.
  const criticalLoadInfo = getCriticalLoadWithSource(data.industry || "default");
  const criticalLoadPct = criticalLoadInfo.percentage;
  const criticalLoadKW = peakKW > 0 ? Math.max(0, Math.round(peakKW * criticalLoadPct)) : 0;
  const recommendedGenKW =
    criticalLoadKW > 0 ? Math.max(100, Math.round((criticalLoadKW * 1.25) / 50) * 50) : 0;
  const urgency = getUrgencyConfig(data.industry || "default");

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ── Power Risk Assessment ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-start gap-3">
          <span className="text-2xl shrink-0 leading-none mt-0.5">
            {typeof industryMeta.icon === "string" ? industryMeta.icon : "⚡"}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-slate-100">
                {industryLabel} · Power Resilience
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  urgency.badgeClass
                }`}
              >
                {urgency.label}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{urgency.headline}</p>
          </div>
        </div>

        {/* Critical load metrics — only once data is available */}
        {peakKW > 0 && (
          <div className="grid grid-cols-3 divide-x divide-white/[0.04] border-t border-white/[0.04]">
            {[
              {
                label: "Facility Peak",
                value: `${Math.round(peakKW).toLocaleString()} kW`,
                sub: "from your profile",
                accent: "text-slate-100",
              },
              {
                label: "Critical Load",
                value: `${criticalLoadKW.toLocaleString()} kW`,
                sub: `${Math.round(criticalLoadPct * 100)}% of peak · ${
                  criticalLoadInfo.source?.name || "IEEE 446"
                }`,
                accent: "text-amber-400",
              },
              {
                label: "Merlin Recommends",
                value: recommendedGenKW > 0 ? `${recommendedGenKW.toLocaleString()} kW` : "—",
                sub: "critical load + 25% reserve",
                accent: "text-[#3ECF8E]",
              },
            ].map((m) => (
              <div key={m.label} className="px-5 py-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {m.label}
                </div>
                <div className={`text-lg font-bold tabular-nums ${m.accent}`}>{m.value}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>
        )}
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
        criticalLoadKW={criticalLoadKW}
        industryType={data.industry || "default"}
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
