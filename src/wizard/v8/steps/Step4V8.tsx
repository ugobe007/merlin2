/**
 * WIZARD V8 — STEP 4: MAGICFIT
 * ============================================================================
 * Three savings-optimized configurations with bold visual design
 *
 * Design: STARTER / PERFECT FIT / BEAST MODE
 * Source: Adapted from V6 Step5MagicFit.tsx
 *
 * Features:
 * - Gradient headlines that POP
 * - Annual Savings as HERO number
 * - Equipment strip with emoji icons (🔋 ☀️ ⚡ 🔥)
 * - Full financial summary (Investment, ITC, Net Cost)
 * - ROI metrics (Payback, 10-Year ROI, 25-Year Profit)
 * - Card hover animations + click feedback
 * - Selected state glow
 * ============================================================================
 */

import React from "react";
import type { WizardState, WizardActions } from "../wizardState";
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { calculateSystemCosts, EQUIPMENT_UNIT_COSTS } from "@/services/pricingServiceV45";

// ============================================================================
// TIER DESIGN CONFIG
// ============================================================================
const TIER_CONFIG = {
  0: {
    // STARTER
    name: "STARTER",
    tagline: "Fast payback, solid foundation",
    headlineClass: "headline-starter",
    cardBorder: "border-slate-700/50",
    cardBg: "bg-gradient-to-b from-slate-900 to-slate-950",
    cardHover: "card-starter",
    accentColor: "text-emerald-400",
    chipBg: "bg-white/5 border-white/10",
    chipText: "text-slate-300",
    buttonClass:
      "text-emerald-400 bg-transparent border-emerald-500/70 hover:bg-emerald-500/10 font-bold",
    metricBg: "bg-white/5",
  },
  1: {
    // RECOMMENDED
    name: "Recommended",
    tagline: "Best ROI · Most popular",
    headlineClass: "headline-perfect",
    cardBorder: "border-emerald-400/70",
    cardBg: "bg-gradient-to-b from-emerald-900/70 via-slate-900/90 to-slate-950",
    cardHover: "card-perfect card-recommended",
    accentColor: "text-emerald-300",
    chipBg: "bg-emerald-500/15 border-emerald-400/50",
    chipText: "text-emerald-100",
    buttonClass:
      "text-emerald-300 bg-transparent border-emerald-400 hover:bg-emerald-500/15 font-bold",
    metricBg: "bg-emerald-500/10",
  },
  2: {
    // COMPLETE
    name: "Complete",
    tagline: "Maximum resilience & coverage",
    headlineClass: "headline-beast",
    cardBorder: "border-amber-500/50",
    cardBg: "bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950",
    cardHover: "card-beast",
    accentColor: "text-amber-400",
    chipBg: "bg-amber-500/10 border-amber-500/30",
    chipText: "text-amber-200",
    buttonClass:
      "text-amber-400 bg-transparent border-amber-500/70 hover:bg-amber-500/10 font-bold",
    metricBg: "bg-amber-500/10",
  },
} as const;

// ============================================================================
// CUSTOM STYLES
// ============================================================================
const customStyles = `
  /* Card hover transitions + CLICK FEEDBACK */
  .card-starter, .card-perfect, .card-beast {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .card-starter:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.18);
  }
  .card-starter:active {
    transform: translateY(-1px) scale(0.99);
  }

  .card-perfect:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 0 2px rgba(52,211,153,0.6), 0 35px 70px -12px rgba(52,211,153,0.5);
    animation: none;
  }
  .card-perfect:active {
    transform: translateY(-2px) scale(0.99);
  }

  .card-beast:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 40px -15px rgba(245, 158, 11, 0.28);
  }
  .card-beast:active {
    transform: translateY(-1px) scale(0.99);
  }

  /* BEST VALUE — persistent breathing glow */
  @keyframes recommendedGlow {
    0%, 100% {
      box-shadow: 0 0 0 2px rgba(52,211,153,0.25), 0 20px 50px -12px rgba(52,211,153,0.25);
    }
    50% {
      box-shadow: 0 0 0 2px rgba(52,211,153,0.55), 0 28px 65px -12px rgba(52,211,153,0.42);
    }
  }
  .card-recommended {
    animation: recommendedGlow 2.8s ease-in-out infinite;
    position: relative;
    z-index: 10;
  }

  /* SELECTED STATE — override any animation */
  .card-selected {
    box-shadow: 0 0 0 2px rgba(52,211,153,0.6), 0 0 40px 0px rgba(52,211,153,0.25) !important;
    animation: none !important;
  }

  /* CHECKMARK ANIMATION */
  .checkmark-appear { animation: checkmarkFade 0.25s ease-out; }
  @keyframes checkmarkFade {
    0%   { transform: scale(0.7); opacity: 0; }
    100% { transform: scale(1);   opacity: 1; }
  }

  /* SAVINGS NUMBER */
  @keyframes savingsFade {
    0%   { opacity: 0; }
    100% { opacity: 1; }
  }
  .savings-number { animation: savingsFade 0.4s ease-out; }

  /* STARTER */
  .headline-starter {
    background: linear-gradient(135deg, #3ECF8E 0%, #2aad70 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  /* BEST VALUE */
  .headline-perfect {
    background: linear-gradient(135deg, #6ee7b7 0%, #34d399 45%, #059669 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  /* MAX POWER */
  .headline-beast {
    background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 55%, #d97706 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  /* Savings glow */
  .savings-glow-starter { text-shadow: 0 0 20px rgba(16,185,129,0.2); }
  .savings-glow-perfect { text-shadow: 0 0 28px rgba(52,211,153,0.4); }
  .savings-glow-beast   { text-shadow: 0 0 20px rgba(245,158,11,0.25); }

  /* Equipment chips */
  .equipment-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 12px; border-radius: 10px;
    font-size: 12px; font-weight: 700;
    white-space: nowrap; border-width: 2px !important;
  }
  .equipment-chip span:first-child { font-size: 15px; }

  .recommended-glow { opacity: 1; }
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// ============================================================================
// GOAL RANKINGS PANEL
// ============================================================================

type TierTuple = [
  import("../wizardState").QuoteTier,
  import("../wizardState").QuoteTier,
  import("../wizardState").QuoteTier,
];

interface GoalRankingsPanelProps {
  tiers: TierTuple;
}

const GOALS = [
  { id: "cost", label: "Cost Reduction", icon: "💰", desc: "Bill savings vs. baseline" },
  { id: "resilience", label: "Resilience", icon: "🛡️", desc: "Backup duration at peak load" },
  { id: "solar", label: "Sustainability", icon: "☀️", desc: "Solar offset of facility load" },
  { id: "revenue", label: "Revenue Generation", icon: "📈", desc: "EV charging income stream" },
  { id: "demand", label: "Demand Management", icon: "⚡", desc: "Peak demand shaving capacity" },
  {
    id: "independence",
    label: "Grid Independence",
    icon: "🔌",
    desc: "Combined solar + storage coverage",
  },
] as const;

function GoalRankingsPanel({ tiers }: GoalRankingsPanelProps) {
  // Use recommended (index 1) tier for scoring
  const rec = tiers[1];
  const peak = Math.max(rec.bessKW, 1);

  function score(goalId: string): number {
    switch (goalId) {
      case "cost":
        return Math.min(
          100,
          Math.round((rec.annualSavings / Math.max(rec.grossCost, 1)) * 100 * 5)
        );
      case "resilience":
        return Math.min(100, Math.round((rec.bessKWh / (peak * 4)) * 100));
      case "solar":
        return rec.solarKW > 0 ? Math.min(100, Math.round((rec.solarKW / peak) * 100)) : 0;
      case "revenue":
        return rec.evChargerKW > 0
          ? Math.min(100, Math.round((rec.evChargerKW / peak) * 80 + 20))
          : 0;
      case "demand":
        return Math.min(100, Math.round((rec.bessKW / peak) * 80 + 20));
      case "independence":
        return Math.min(100, Math.round(((rec.solarKW + rec.bessKW * 0.5) / peak) * 80));
      default:
        return 50;
    }
  }

  const scored = GOALS.map((g) => ({ ...g, pct: score(g.id) })).sort((a, b) => b.pct - a.pct);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 mx-2 md:mx-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          What Merlin Optimized For
        </span>
        <span className="text-[10px] text-slate-600">— based on your Recommended tier</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
        {scored.map((g, i) => (
          <div key={g.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{g.icon}</span>
                <span className="text-[11px] font-semibold text-slate-300">{g.label}</span>
                {i === 0 && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1 py-0.5">
                    Top
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-200 tabular-nums">{g.pct}%</span>
            </div>
            <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${g.pct}%`,
                  background: g.pct >= 75 ? "#3ECF8E" : g.pct >= 45 ? "#F59E0B" : "#64748b",
                }}
              />
            </div>
            <span className="text-[9px] text-slate-600 leading-tight">{g.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
  actions: WizardActions;
}

// ============================================================================
// PHASE 1 + 3: SIZING INTELLIGENCE PANEL
// Collapsible per-tier panel showing the full load→BESS→solar→gen chain.
// Mirrors the exact formulas in step4Logic.ts (do not edit independently).
// ============================================================================

const BESS_APP_LABELS: Record<string, string> = {
  peak_shaving: "Peak shaving",
  backup_power: "Backup power",
  energy_arbitrage: "Energy arbitrage",
  demand_response: "Demand response",
  load_shifting: "Load shifting",
  resilience: "Resilience",
  stacked: "Multi-use (stacked)",
};

const BESS_RATIO_META: Record<string, { ratio: number; source: string }> = {
  peak_shaving: { ratio: 0.4, source: "IEEE 4538388 · MDPI 11(8):2048" },
  demand_response: { ratio: 0.4, source: "IEEE 4538388" },
  stacked: { ratio: 0.4, source: "IEEE 4538388 (conservative)" },
  energy_arbitrage: { ratio: 0.5, source: "Industry benchmark" },
  load_shifting: { ratio: 0.5, source: "Industry benchmark" },
  backup_power: { ratio: 0.7, source: "IEEE 446-1995 Orange Book" },
  resilience: { ratio: 0.7, source: "IEEE 446-1995 Orange Book" },
};

const TIER_BESS_SCALE: Record<string, number> = {
  Starter: 0.55,
  Recommended: 1.0,
  Complete: 1.5,
};

interface SizingIntelligencePanelProps {
  tier: import("../wizardState").QuoteTier;
  state: WizardState;
  isPerfectFit: boolean;
}

function SizingIntelligencePanel({ tier, state, isPerfectFit }: SizingIntelligencePanelProps) {
  const [open, setOpen] = React.useState(false);

  const { baseLoadKW, peakLoadKW, criticalLoadPct, intel, solarPhysicalCapKW } = state;
  const criticalKW = Math.round(peakLoadKW * criticalLoadPct);
  const sunHours = intel?.peakSunHours ?? 0;
  const sunFactor = Math.max(0.4, Math.min(1.0, (sunHours - 2.5) / 2.0));
  const application =
    (state.step3Answers?.primaryBESSApplication as string | undefined) ?? "peak_shaving";
  const { ratio: bessRatio, source: bessSource } = BESS_RATIO_META[application] ?? {
    ratio: 0.4,
    source: "IEEE standard",
  };
  const tierScale = TIER_BESS_SCALE[tier.label] ?? 1.0;

  const solarCapPct =
    (solarPhysicalCapKW ?? 0) > 0 && tier.solarKW > 0
      ? Math.round((tier.solarKW / (solarPhysicalCapKW ?? 1)) * 100)
      : 0;

  const genIncluded = tier.generatorKW > 0;
  const linearGenKW = tier.linearGeneratorKW ?? 0;
  const genNeed = state.step3Answers?.generatorNeed as string | undefined;

  const genReason = genIncluded
    ? genNeed === "full_backup"
      ? "User requested full backup"
      : genNeed === "resilience"
        ? "User requested resilience"
        : criticalLoadPct >= 0.5
          ? `Critical load ≥ 50% (${Math.round(criticalLoadPct * 100)}%)`
          : "Included per goal policy"
    : genNeed === "none" || !genNeed
      ? "Not requested"
      : criticalLoadPct < 0.5
        ? `Critical load ${Math.round(criticalLoadPct * 100)}% < 50% threshold`
        : "Excluded for ROI";

  const accentCls = isPerfectFit ? "text-emerald-400" : "text-slate-400";
  const borderCls = isPerfectFit
    ? "border-emerald-500/20 bg-emerald-900/[0.07]"
    : "border-slate-700/40 bg-slate-900/30";

  if (!open) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 mb-2 rounded-lg transition-all border ${borderCls} hover:opacity-80`}
      >
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${accentCls}`}>
          <span>🧮</span>
          <span>How Merlin sized this</span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>
    );
  }

  return (
    <div
      className={`mb-3 rounded-lg border text-[11px] leading-relaxed ${borderCls}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setOpen(false)}
        className="w-full flex items-center justify-between p-3 pb-2"
      >
        <span className={`flex items-center gap-1.5 font-bold text-xs ${accentCls}`}>
          <span>🧮</span> How Merlin sized this
        </span>
        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
      </button>

      <div className="px-3 pb-3 space-y-3">
        {/* ── Load Profile ── */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500 mb-1.5 font-bold">
            Load Profile
          </p>
          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Base load</span>
              <span className="text-slate-300 font-medium tabular-nums">
                {baseLoadKW} kW <span className="text-slate-600 text-[9px]">avg continuous</span>
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400 font-semibold">Peak load</span>
              <span className="text-white font-semibold tabular-nums">
                {peakLoadKW} kW <span className="text-emerald-500/70 text-[9px]">← BESS basis</span>
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Critical load</span>
              <span className="text-slate-300 font-medium tabular-nums">
                {criticalKW} kW{" "}
                <span className="text-slate-600 text-[9px]">
                  {Math.round(criticalLoadPct * 100)}% · IEEE 446
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Battery Storage ── */}
        <div className="border-t border-white/[0.05] pt-2.5">
          <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500 mb-1.5 font-bold">
            Battery Storage
          </p>
          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Application</span>
              <span className="text-slate-300 font-medium">
                {BESS_APP_LABELS[application] ?? application}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">IEEE sizing ratio</span>
              <span className="text-slate-300 font-medium tabular-nums">
                {bessRatio} <span className="text-slate-600 text-[9px]">({bessSource})</span>
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Tier scale</span>
              <span className="text-slate-300 font-medium tabular-nums">
                ×{tierScale} <span className="text-slate-600 text-[9px]">({tier.label})</span>
              </span>
            </div>
            <div className="flex justify-between items-baseline border-t border-white/[0.04] pt-1 mt-0.5">
              <span className={accentCls}>Result</span>
              <span className={`font-bold tabular-nums ${accentCls}`}>
                {tier.bessKW} kW / {tier.bessKWh} kWh
                <span className="text-slate-500 font-normal text-[9px]"> 2h C2 std</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Solar (Phase 3 transparency) ── */}
        {intel?.solarFeasible && (solarPhysicalCapKW ?? 0) > 0 && (
          <div className="border-t border-white/[0.05] pt-2.5">
            <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500 mb-1.5 font-bold">
              Solar ☀️
            </p>
            <div className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Location</span>
                <span className="text-slate-300 font-medium tabular-nums">
                  {sunHours.toFixed(1)} PSH · grade {intel.solarGrade}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Sun quality factor</span>
                <span className="text-slate-300 font-medium tabular-nums">
                  {Math.round(sunFactor * 100)}%{" "}
                  <span className="text-slate-600 text-[9px]">NREL methodology</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Roof capacity</span>
                <span className="text-slate-300 font-medium tabular-nums">
                  {solarPhysicalCapKW} kW available
                </span>
              </div>
              <div className="flex justify-between items-baseline border-t border-white/[0.04] pt-1 mt-0.5">
                <span className={accentCls}>Sized</span>
                <span
                  className={`font-bold tabular-nums ${tier.solarKW > 0 ? accentCls : "text-slate-500 italic"}`}
                >
                  {tier.solarKW > 0
                    ? `${tier.solarKW} kW · ${solarCapPct}% of cap (best ROI)`
                    : "Not included"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Power Generation ── */}
        <div className="border-t border-white/[0.05] pt-2.5">
          <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500 mb-1.5 font-bold">
            Power Generation
          </p>
          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Rotary generator</span>
              <span
                className={`font-medium tabular-nums ${genIncluded ? accentCls : "text-slate-500 italic"}`}
              >
                {genIncluded
                  ? `${tier.generatorKW} kW${tier.generatorFuelType ? ` · ${tier.generatorFuelType}` : ""}`
                  : "Excluded"}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Reason</span>
              <span className="text-slate-400 text-right" style={{ maxWidth: 180 }}>
                {genReason}
              </span>
            </div>
            {linearGenKW > 0 && (
              <>
                <div className="flex justify-between items-baseline border-t border-white/[0.04] pt-1 mt-0.5">
                  <span className="text-slate-500">Linear generator</span>
                  <span className={`font-bold tabular-nums ${accentCls}`}>
                    {linearGenKW} kW continuous
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Role</span>
                  <span className="text-slate-400">Trickle-charge BESS · 72h endurance</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-baseline border-t border-white/[0.04] pt-1 mt-0.5">
              <span className="text-slate-600 italic">Wind</span>
              <span className="text-slate-600 italic text-[9px]">
                Merlin Network · coming 2026 💨
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── State-level incentive lookup (quantifiable programs only) ────────────────
// Estimates are conservative midpoints based on current program rates.
// CA SGIP: ~$200/kWh  |  NY NYSERDA: ~$150/kWh  |  MA SMART: ~$1,200/kW AC
// NJ: ~$100/kWh  |  IL SREC: ~$1,000/kW  |  OR ETF: ~$100/kWh  |  CO Xcel: ~$500/kW
const STATE_INCENTIVES: Record<
  string,
  { label: string; estimate: (bessKWh: number, solarKW: number) => number; note: string }
> = {
  CA: {
    label: "SGIP — CA Battery Storage Rebate",
    estimate: (kWh) => Math.round(kWh * 200),
    note: "Est. ~$200/kWh; subject to CPUC program availability",
  },
  NY: {
    label: "NYSERDA — NY Clean Energy Storage",
    estimate: (kWh) => Math.round(kWh * 150),
    note: "Est. ~$150/kWh; varies by utility zone",
  },
  MA: {
    label: "SMART Program — MA Solar Incentive",
    estimate: (_, kW) => Math.round(kW * 1200),
    note: "Est. ~$1,200/kW AC; 10-yr incentive stream NPV",
  },
  NJ: {
    label: "NJ Clean Energy Incentive",
    estimate: (kWh) => Math.round(kWh * 100),
    note: "Est. ~$100/kWh; JCP&L / PSE&G zones",
  },
  IL: {
    label: "Illinois Shines — SREC",
    estimate: (_, kW) => Math.round(kW * 1000),
    note: "Est. ~$1,000/kW; varies by REC batch",
  },
  OR: {
    label: "Energy Trust of Oregon Rebate",
    estimate: (kWh) => Math.round(kWh * 100),
    note: "Est. ~$100/kWh battery storage rebate",
  },
  CO: {
    label: "Xcel Energy — Renewable Rebate",
    estimate: (_, kW) => Math.round(kW * 500),
    note: "Est. ~$500/kW; subject to program year cap",
  },
};

export default function Step4V8({ state, actions }: Props) {
  const { tiers, tiersStatus, selectedTierIndex } = state;
  const [loadingStep, setLoadingStep] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [selectionConfirmation, setSelectionConfirmation] = React.useState<string | null>(null);
  const [expandedCostBreakdown, setExpandedCostBreakdown] = React.useState<number | null>(null);
  const [expandedITCTier, setExpandedITCTier] = React.useState<number | null>(null);

  // Log only when tiersStatus changes, not on every render
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[Step4V8] State:", {
        tiersStatus,
        selectedTierIndex,
        hasTiers: !!tiers,
        tierCount: tiers?.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiersStatus]);

  // Track tier selection changes (debug only)
  React.useEffect(() => {
    if (import.meta.env.DEV && selectedTierIndex !== null) {
      console.log("[Step4V8] selectedTierIndex changed to:", selectedTierIndex);
    }
  }, [selectedTierIndex]);

  // Keyboard navigation for tiers
  React.useEffect(() => {
    if (!tiers) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        // Skip STARTER (0) — only navigate between 1 and 2
        if (selectedTierIndex === null || selectedTierIndex <= 1) {
          actions.selectTier(1);
        } else {
          actions.selectTier((selectedTierIndex - 1) as 0 | 1 | 2);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedTierIndex === null || selectedTierIndex >= 2) {
          actions.selectTier(2);
        } else {
          actions.selectTier((selectedTierIndex + 1) as 0 | 1 | 2);
        }
      } else if (e.key === "Enter" && selectedTierIndex !== null) {
        e.preventDefault();
        actions.goToStep(6);
      } else if (e.key === "1") {
        e.preventDefault();
        actions.selectTier(1); // Recommended
      } else if (e.key === "2") {
        e.preventDefault();
        actions.selectTier(2); // Complete
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedTierIndex, tiers, actions]);

  // Loading steps for status bar
  const loadingSteps = [
    "Analyzing facility power profile...",
    "Sizing battery & solar arrays...",
    "Calculating equipment costs...",
    "Applying ITC tax credits...",
    "Running 25-year financial model...",
    "Generating 2 optimized configurations...",
  ];
  const loadingStepCount = loadingSteps.length;

  // Simulate progress during loading
  React.useEffect(() => {
    if (tiersStatus !== "fetching") return;

    setLoadingStep(0);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2; // Progress bar moves 2% every 50ms = ~2.5 seconds total
      });
    }, 50);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= loadingStepCount - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 400); // Change step every 400ms

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [tiersStatus, loadingStepCount]);

  React.useEffect(() => {
    if (selectedTierIndex === null || !tiers) {
      setSelectionConfirmation(null);
      return;
    }

    const selectedName = TIER_CONFIG[selectedTierIndex].name;
    setSelectionConfirmation(`${selectedName} selected. Continue when you're ready.`);

    const timeout = window.setTimeout(() => {
      setSelectionConfirmation(null);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [selectedTierIndex, tiers]);

  // === LOADING STATE ===
  if (tiersStatus === "fetching") {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-2xl mx-auto">
        {/* Spinner */}
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-6" />

        {/* Main message */}
        <h3 className="text-xl font-semibold text-white mb-2">Generating Your MagicFit Options</h3>
        <p className="text-slate-400 mb-8">Building 2 optimized configurations for your facility</p>

        {/* Progress bar */}
        <div className="w-full space-y-3">
          {/* Bar container */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current step */}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-emerald-400 font-medium">{loadingSteps[loadingStep]}</p>
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-6 gap-2 mt-4">
            {loadingSteps.map((step, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx <= loadingStep ? "bg-emerald-500" : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Percentage */}
          <p className="text-center text-slate-500 text-sm mt-2">
            {Math.round(progress)}% complete
          </p>
        </div>
      </div>
    );
  }

  // === ERROR STATE ===
  if (tiersStatus === "error" || !tiers) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-300 mb-2">Unable to Generate Tiers</h3>
        <p className="text-red-400/80 mb-6">
          {tiersStatus === "error"
            ? "Failed to calculate configurations"
            : "No tier data available"}
        </p>
        <button
          onClick={() => actions.goBack()}
          className="px-6 py-3 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-all border border-red-500/30"
        >
          Go Back
        </button>
      </div>
    );
  }

  // === MAIN RENDER ===
  return (
    <div className="space-y-8">
      {/* Inject custom styles */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* Mobile sticky selected-tier summary bar */}
      {selectedTierIndex !== null &&
        tiers &&
        (() => {
          const sel = tiers[selectedTierIndex];
          const cfg = TIER_CONFIG[selectedTierIndex];
          return (
            <div
              className="sticky top-0 z-30 lg:hidden -mx-4 px-4 py-2.5 backdrop-blur-md border-b border-white/[0.07]"
              style={{ background: "rgba(10,16,38,0.92)" }}
            >
              <div className="flex items-center justify-between max-w-sm mx-auto">
                <span className={`text-xs font-bold uppercase tracking-wider ${cfg.accentColor}`}>
                  {cfg.name}
                </span>
                <span className="text-sm font-extrabold text-white">
                  {formatCurrency(sel.netCost)}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Selected
                </span>
              </div>
            </div>
          );
        })()}

      {/* Header */}
      <div className="text-center">
        <p className="text-emerald-500/60 uppercase tracking-[0.3em] text-xs font-medium mb-3">
          MagicFit™ — 2 Configurations
        </p>
        <h1
          className="text-2xl md:text-3xl font-bold text-white mb-3"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Select Your Configuration
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          {selectedTierIndex === null
            ? "Each configuration is sized to your facility profile. Select one to continue."
            : 'Selection confirmed. Review the details and click "See your quote" to proceed.'}
        </p>
        {selectedTierIndex === null && (
          <div className="mt-3 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg inline-block">
            <p className="text-purple-300 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Select your preferred configuration to continue
            </p>
          </div>
        )}
        {selectionConfirmation && (
          <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-500/12 px-5 py-3 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-emerald-200">{selectionConfirmation}</p>
          </div>
        )}
      </div>

      {/* Goal Rankings - context before choices */}
      <GoalRankingsPanel tiers={tiers} />

      {/* Cards Grid — 2 options: Recommended + Complete (Starter reserved for future) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full px-2 md:px-4 max-w-4xl mx-auto">
        {tiers.map((tier, index) => {
          const tierIndex = index as 0 | 1 | 2;
          // 2-tier policy — Starter reserved for future release
          if (tierIndex === 0) return null;
          const config = TIER_CONFIG[tierIndex];
          const isSelected = selectedTierIndex === tierIndex;
          const isPerfectFit = tierIndex === 1;

          // Use real financials from SSOT + margin policy
          const totalInvestment = tier.grossCost;
          const federalITC = tier.itcAmount;
          const netCost = tier.netCost;
          const tenYearROI = tier.roi10Year;

          return (
            <div
              key={tierIndex}
              onClick={() => {
                actions.selectTier(tierIndex);
              }}
              className={`
                relative rounded-2xl overflow-hidden cursor-pointer
                ${config.cardBg} border-2 ${config.cardHover}
                ${isSelected ? "border-emerald-500/60 card-selected" : config.cardBorder}
                transition-all duration-300
              `}
            >
              {/* SELECTED CHECKMARK BADGE */}
              {isSelected && (
                <div className="absolute top-4 right-4 z-20 checkmark-appear">
                  <div className="bg-emerald-500 rounded-full p-1.5 shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* SELECTION OVERLAY */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/6 via-transparent to-transparent pointer-events-none" />
              )}

              {/* BEST VALUE Banner (Perfect Fit only) */}
              {isPerfectFit && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 px-5 py-1.5 rounded-b-lg text-[11px] font-black tracking-[0.15em] shadow-lg">
                      ⭐ RECOMMENDED
                    </div>
                  </div>
                </>
              )}

              {/* Top Section - Responsive padding */}
              <div className={`p-3 md:p-4 ${isPerfectFit ? "pt-7 md:pt-8" : ""}`}>
                {/* HEADLINE */}
                <div className="text-center mb-2 md:mb-3">
                  <h2
                    className={`text-2xl md:text-3xl font-black tracking-tight ${config.headlineClass}`}
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    {config.name}
                  </h2>
                  <p
                    className={`text-xs uppercase tracking-widest mt-1 ${isPerfectFit ? "text-emerald-300/90" : "text-slate-500"}`}
                  >
                    {config.tagline}
                  </p>
                </div>

                {/* HERO: Annual Savings - Responsive sizing */}
                <div className="text-center py-2 md:py-3">
                  <p
                    className={`text-[10px] uppercase tracking-widest mb-1 ${isPerfectFit ? "text-emerald-400/50" : "text-slate-500"}`}
                  >
                    Annual Savings
                  </p>
                  <p
                    className={`text-3xl md:text-4xl font-bold ${config.accentColor} savings-number`}
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    {/* When EV revenue > $500/yr, headline shows energy-only savings; EV is a separate line */}
                    {(tier.evRevenuePerYear ?? 0) > 500
                      ? formatCurrency(tier.annualSavings - (tier.evRevenuePerYear ?? 0))
                      : formatCurrency(tier.annualSavings)}
                  </p>
                  {/* ── Savings breakdown ─────────────────────────────────── */}
                  {(tier.evRevenuePerYear ?? 0) > 500 ? (
                    /* Two-business-case split: energy savings vs EV revenue */
                    <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                        Savings breakdown
                      </p>
                      {(tier.demandChargeSavings ?? 0) > 500 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">⚡ Demand charge reduction</span>
                          <span className="text-emerald-400 font-medium">
                            {formatCurrency(tier.demandChargeSavings!)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">☀️ Solar + TOU savings</span>
                        <span className="text-emerald-400 font-medium">
                          {formatCurrency(
                            (tier.energySavings ??
                              tier.annualSavings - (tier.evRevenuePerYear ?? 0)) -
                              (tier.demandChargeSavings ?? 0)
                          )}
                        </span>
                      </div>
                      <div className="border-t border-white/10 pt-1 flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">Energy savings subtotal</span>
                        <span className="text-emerald-300">
                          {formatCurrency(tier.annualSavings - (tier.evRevenuePerYear ?? 0))}
                        </span>
                      </div>
                      <div className="border-t border-blue-500/20 pt-1 flex justify-between text-xs">
                        <span className="text-blue-400">⚡ EV charging revenue*</span>
                        <span className="text-blue-300 font-medium">
                          {formatCurrency(tier.evRevenuePerYear!)}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-600 leading-tight">
                        *Net of demand charges, network fees &amp; maintenance. Separate business
                        case — verify with local utilization data.
                        {tier.dcfcDemandPenalty && tier.dcfcDemandPenalty > 0
                          ? ` DCFC demand penalty: −${formatCurrency(tier.dcfcDemandPenalty)}/yr already deducted.`
                          : ""}
                      </p>
                    </div>
                  ) : (tier.demandChargeSavings ?? 0) > 500 ? (
                    /* No EV: show demand vs solar split */
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[10px] text-emerald-400/70">
                        ⚡ {formatCurrency(tier.demandChargeSavings!)} demand reduction
                      </p>
                      <p className="text-[10px] text-slate-500">
                        + {formatCurrency(tier.annualSavings - (tier.demandChargeSavings ?? 0))}{" "}
                        solar / TOU
                      </p>
                    </div>
                  ) : null}
                  <p
                    className={`text-[10px] uppercase tracking-widest mb-2 text-center ${isPerfectFit ? "text-emerald-400/50" : "text-slate-500"}`}
                  >
                    System Configuration
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {/* BESS - Always shown */}
                    <div className={`equipment-chip ${config.chipBg} border`}>
                      <span>🔋</span>
                      <span className={config.chipText}>
                        {tier.bessKWh >= 1000
                          ? `${(tier.bessKWh / 1000).toFixed(1)} MWh`
                          : `${Math.round(tier.bessKWh)} kWh`}
                        {` / ${tier.durationHours ?? 2}hr`}
                      </span>
                    </div>

                    {/* Hybrid coverage badge — shows effective coverage beyond 2h spec */}
                    {tier.hybridCoverage && tier.hybridCoverage.strategy !== "bess_only" && (
                      <div
                        className={`equipment-chip ${config.chipBg} border border-emerald-500/30`}
                      >
                        <span>
                          {tier.hybridCoverage.strategy === "full_hybrid"
                            ? "⚡"
                            : tier.hybridCoverage.strategy === "solar_boost"
                              ? "☀️"
                              : "🔌"}
                        </span>
                        <span className={`${config.chipText} text-emerald-400`}>
                          {tier.hybridCoverage.strategy === "full_hybrid"
                            ? `Hybrid · ${tier.hybridCoverage.dailyPeakCoverageHours}h daily peaks · 24h outage`
                            : tier.hybridCoverage.strategy === "solar_boost"
                              ? `Solar recharge · ${tier.hybridCoverage.dailyPeakCoverageHours}h daily peaks`
                              : `Gen bridge · 24h outage`}
                        </span>
                      </div>
                    )}

                    {/* Solar */}
                    {tier.solarKW >= 1 && (
                      <div className={`equipment-chip ${config.chipBg} border`}>
                        <span>☀️</span>
                        <span className={config.chipText}>{Math.round(tier.solarKW)} kW Solar</span>
                      </div>
                    )}

                    {/* EV Chargers */}
                    {tier.evChargerKW >= 1 && (
                      <div className={`equipment-chip ${config.chipBg} border`}>
                        <span>⚡</span>
                        <span className={config.chipText}>
                          {state.level2Chargers + state.dcfcChargers + state.hpcChargers} EV
                          Chargers
                        </span>
                      </div>
                    )}

                    {/* Generator */}
                    {tier.generatorKW >= 1 && (
                      <div className={`equipment-chip ${config.chipBg} border`}>
                        <span>🔥</span>
                        <span className={config.chipText}>
                          {Math.round(tier.generatorKW)} kW{" "}
                          {tier.generatorFuelType === "natural-gas"
                            ? "Gas Gen"
                            : tier.generatorFuelType === "dual-fuel"
                              ? "Dual-Fuel Gen"
                              : "Diesel Gen"}
                        </span>
                      </div>
                    )}

                    {/* Linear Generator — Phase 2 */}
                    {(tier.linearGeneratorKW ?? 0) >= 1 && (
                      <div className={`equipment-chip ${config.chipBg} border border-cyan-500/30`}>
                        <span>🔄</span>
                        <span className={`${config.chipText} text-cyan-300`}>
                          {Math.round(tier.linearGeneratorKW ?? 0)} kW Linear Gen
                        </span>
                      </div>
                    )}

                    {/* Wind — coming soon (Phase 4) */}
                    <div
                      className="equipment-chip border border-dashed border-slate-700 bg-slate-900/40 opacity-40 cursor-not-allowed select-none"
                      title="Wind energy — coming to Merlin Network Q3 2026"
                    >
                      <span>💨</span>
                      <span className="text-slate-500 text-[11px] font-medium">Wind · 2026</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary - Responsive padding and spacing */}
              <div
                className={`border-t p-3 md:p-4 ${isPerfectFit ? "bg-slate-950/60 border-emerald-400/35" : "bg-slate-950/80 border-slate-800"}`}
              >
                <p
                  className={`text-[10px] uppercase tracking-widest mb-2 text-center ${isPerfectFit ? "text-emerald-400/50" : "text-slate-500"}`}
                >
                  Financial Summary
                </p>

                <div className="space-y-1.5 text-xs md:text-sm mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      Merlin Procurement Cost
                      <span
                        title="AI-optimized equipment pricing vs. traditional EPC markup. Calibrated to NREL ATB 2024."
                        className="cursor-help opacity-40 hover:opacity-70 text-[10px]"
                      >
                        ⓘ
                      </span>
                    </span>
                    <span className="text-slate-300 font-medium">
                      {formatCurrency(totalInvestment)}
                    </span>
                  </div>
                  {(tier.installationLaborCost ?? 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">+ Installation &amp; Labor</span>
                      <span className="text-slate-400 font-medium">
                        {formatCurrency(tier.installationLaborCost ?? 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">
                      {(tier.installationLaborCost ?? 0) > 0
                        ? "= Total Project Cost"
                        : "Total Project Cost"}
                    </span>
                    <span className="text-slate-200 font-medium">
                      {formatCurrency(tier.totalProjectCost ?? totalInvestment)}
                    </span>
                  </div>
                  {/* Federal ITC line with expandable basis breakdown */}
                  <div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedITCTier(expandedITCTier === tierIndex ? null : tierIndex);
                        }}
                        className="flex items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-colors text-left"
                      >
                        <span>Federal ITC (30%)</span>
                        <Info className="w-3 h-3 opacity-60" />
                        {expandedITCTier === tierIndex ? (
                          <ChevronUp className="w-3 h-3 opacity-50" />
                        ) : (
                          <ChevronDown className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                      <span className="text-emerald-400 font-medium">
                        −{formatCurrency(federalITC)}
                      </span>
                    </div>

                    {/* ITC Basis Breakdown — expands on click */}
                    {expandedITCTier === tierIndex && tier.itcBasisBreakdown && (
                      <div
                        className="mt-2 mb-1 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3 text-[11px] space-y-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-emerald-400/70 uppercase tracking-widest text-[9px] mb-2 font-semibold">
                          ITC-Eligible Basis (§48 / IRA 2022)
                        </p>
                        {tier.itcBasisBreakdown.solarEligible > 0 && (
                          <div className="flex justify-between text-slate-400">
                            <span>☀️ Solar equipment &amp; labor</span>
                            <span>{formatCurrency(tier.itcBasisBreakdown.solarEligible)}</span>
                          </div>
                        )}
                        {tier.itcBasisBreakdown.bessEligible > 0 && (
                          <div className="flex justify-between text-slate-400">
                            <span>🔋 Battery storage (BESS)</span>
                            <span>{formatCurrency(tier.itcBasisBreakdown.bessEligible)}</span>
                          </div>
                        )}
                        {tier.itcBasisBreakdown.siteEligible > 0 && (
                          <div className="flex justify-between text-slate-400">
                            <span>🔧 Site engineering &amp; labor (prorated)</span>
                            <span>{formatCurrency(tier.itcBasisBreakdown.siteEligible)}</span>
                          </div>
                        )}
                        <div className="border-t border-emerald-500/15 pt-1 mt-1 flex justify-between text-slate-300 font-medium">
                          <span>Eligible basis</span>
                          <span>{formatCurrency(tier.itcBasisBreakdown.totalEligible)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-semibold">
                          <span>× 30% Federal ITC</span>
                          <span>= {formatCurrency(federalITC)}</span>
                        </div>
                        {(tier.itcBasisBreakdown.generatorCost > 0 ||
                          tier.itcBasisBreakdown.evChargingCost > 0) && (
                          <p className="text-slate-600 text-[9px] mt-2 leading-relaxed">
                            Excluded: generators
                            {tier.itcBasisBreakdown.evChargingCost > 0
                              ? ", EV infrastructure"
                              : ""}{" "}
                            — not eligible per §48
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* State incentive line items (quantifiable programs only) */}
                  {(() => {
                    const stateCode = state.location?.state?.toUpperCase() ?? "";
                    const program = STATE_INCENTIVES[stateCode];
                    if (!program) return null;
                    const amount = program.estimate(tier.bessKWh, tier.solarKW);
                    if (amount <= 0) return null;
                    return (
                      <div className="flex justify-between items-center" title={program.note}>
                        <span className="flex items-center gap-1 text-emerald-500">
                          {program.label}
                          <span className="text-[9px] text-slate-600 uppercase tracking-wide">
                            est.
                          </span>
                        </span>
                        <span className="text-emerald-400 font-medium">
                          −{formatCurrency(amount)}
                        </span>
                      </div>
                    );
                  })()}
                  <div
                    className={`h-px my-2 ${isPerfectFit ? "bg-emerald-500/20" : "bg-white/5"}`}
                  />
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-white">Net Cost</span>
                    <span
                      className={`text-base md:text-lg ${config.accentColor}`}
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      {formatCurrency(netCost)}
                    </span>
                  </div>
                </div>

                {/* Generator advisory — only for non-hospital (hospitals get $60K/yr avoided downtime credit) */}
                {tier.generatorKW >= 1 && state.industry !== "hospital" && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/[0.06] border border-amber-500/20 flex items-start gap-2 text-[10px]">
                    <span className="mt-0.5 text-amber-400">🏭</span>
                    <div className="leading-relaxed text-amber-300/70">
                      <span className="font-semibold text-amber-300/90">
                        {Math.round(tier.generatorKW)} kW generator
                      </span>
                      {" · resilience investment (24h backup protection) · "}
                      <span className="text-amber-400/80">$0 annual energy savings</span>
                      {
                        " — adds to project cost without improving payback. Add only if continuous uptime is required."
                      }
                    </div>
                  </div>
                )}

                {/* Merlin vs Traditional EPC savings */}
                {(() => {
                  // Base on gross total project cost (EPC quotes pre-ITC, includes install)
                  const epcBase = tier.totalProjectCost ?? totalInvestment;
                  const epcNetLow = Math.round((epcBase * 1.35 * 0.7) / 1000);
                  const epcNetHigh = Math.round((epcBase * 1.6 * 0.7) / 1000);
                  const epcNetMid = epcBase * 1.475 * 0.7;
                  const savingsPct = Math.round(((epcNetMid - netCost) / epcNetMid) * 100);
                  return (
                    <div className="mt-1 mb-3 px-3 py-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center justify-between text-xs">
                      <div className="leading-snug">
                        <p className="text-slate-400 font-medium">vs. Traditional EPC</p>
                        <p className="text-slate-500 text-[10px]">
                          est. ${epcNetLow}K–${epcNetHigh}K after ITC
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-sm">
                          {savingsPct > 0 ? savingsPct : 0}% less
                        </p>
                        <p className="text-slate-500 text-[10px]">Merlin advantage</p>
                      </div>
                    </div>
                  );
                })()}

                {/* ROI Metrics - Responsive grid */}
                <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-3">
                  <div className={`text-center p-1.5 md:p-2 rounded-lg ${config.metricBg}`}>
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Payback
                    </p>
                    <p className={`text-base md:text-lg font-bold ${config.accentColor}`}>
                      {tier.paybackYears.toFixed(1)}y
                    </p>
                  </div>
                  <div className={`text-center p-1.5 md:p-2 rounded-lg ${config.metricBg}`}>
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      10-Yr ROI
                    </p>
                    <p className={`text-base md:text-lg font-bold ${config.accentColor}`}>
                      {tenYearROI.toFixed(0)}%
                    </p>
                  </div>
                  <div className={`text-center p-1.5 md:p-2 rounded-lg ${config.metricBg}`}>
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      25-Yr NPV
                    </p>
                    <p
                      className={`text-base md:text-lg font-bold ${tier.npv >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {formatCurrency(tier.npv)}
                    </p>
                  </div>
                </div>

                {/* EPC / full cost stack CTA */}
                <div className="mb-3 text-center">
                  <p className="text-[11px] text-slate-500">
                    EPC or contractor?{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCostBreakdown(
                          expandedCostBreakdown === tierIndex ? null : tierIndex
                        );
                      }}
                      className="text-slate-400 underline underline-offset-2 hover:text-slate-200 transition-colors"
                    >
                      See full cost stack →
                    </button>
                  </p>
                </div>

                {/* ROI Guardrail notice */}
                {tier.guardrail?.applied && (
                  <div
                    className="mb-3 flex items-start gap-2 px-3 py-2.5 rounded-lg text-[11px] leading-snug"
                    style={{
                      background: "rgba(245, 158, 11, 0.07)",
                      border: "1px solid rgba(245, 158, 11, 0.28)",
                    }}
                  >
                    <span className="text-amber-400 mt-0.5 shrink-0">⚡</span>
                    <div>
                      <span className="font-semibold text-amber-300">ROI Optimized</span>
                      <span className="text-slate-400 ml-1">
                        {" "}
                        — payback improved from{" "}
                        <span className="text-amber-300">
                          {Math.round(tier.guardrail.originalPaybackYears)} yrs
                        </span>{" "}
                        to{" "}
                        <span className="text-emerald-400">{tier.paybackYears.toFixed(1)} yrs</span>
                        .{" "}
                        {tier.guardrail.removedComponents.some((c) => c.startsWith("BESS"))
                          ? "BESS right-sized for this location's economics."
                          : "Generator moved to resilience scope (see quote details)."}
                      </span>
                    </div>
                  </div>
                )}
                {tier.guardrail &&
                  !tier.guardrail.applied &&
                  tier.guardrail.originalPaybackYears > 7 && (
                    <div
                      className="mb-3 flex items-start gap-2 px-3 py-2.5 rounded-lg text-[11px] leading-snug"
                      style={{
                        background: "rgba(245, 158, 11, 0.07)",
                        border: "1px solid rgba(245, 158, 11, 0.28)",
                      }}
                    >
                      <span className="text-amber-400 mt-0.5 shrink-0">⚡</span>
                      <div className="text-slate-400">
                        <span className="font-semibold text-amber-300">Extended payback</span> —{" "}
                        {tier.guardrail.originalPaybackYears.toFixed(0)}-yr est. at this location's
                        rates.{" "}
                        {tier.solarKW > 0
                          ? "Increase solar capacity in Step 3.5 or verify demand charges with your utility to improve ROI."
                          : "Add solar in Step 3.5 to improve ROI."}
                        {tier.generatorKW > 0 && (
                          <span className="block mt-1 text-slate-500">
                            💡 Generator ($
                            {Math.round((tier as { generatorKW: number }).generatorKW / 100) * 100 >
                            0
                              ? "included"
                              : ""}
                            {tier.generatorKW} kW) adds resilience but extends payback — it doesn't
                            generate direct savings. Remove it in Step 3.5 to reduce net cost.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                {/* Phase 1: Sizing Intelligence Panel */}
                <SizingIntelligencePanel tier={tier} state={state} isPerfectFit={isPerfectFit} />

                {/* V4.5 Cost Breakdown - Expandable */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCostBreakdown(
                      expandedCostBreakdown === tierIndex ? null : tierIndex
                    );
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 mb-2 rounded-lg transition-all ${
                    isPerfectFit
                      ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                      : "bg-white/5 hover:bg-white/8"
                  }`}
                >
                  <span className="text-sm text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    Detailed Cost Breakdown
                  </span>
                  {expandedCostBreakdown === tierIndex ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Expanded Cost Details */}
                {expandedCostBreakdown === tierIndex &&
                  (() => {
                    // Calculate v4.5 detailed costs for this tier
                    const v45Costs = calculateSystemCosts({
                      solarKW: tier.solarKW,
                      bessKW: tier.bessKW,
                      bessKWh: tier.bessKWh,
                      generatorKW: tier.generatorKW,
                      generatorFuelType: tier.generatorFuelType ?? "diesel",
                      level2Chargers: state.level2Chargers || 0,
                      dcfcChargers: state.dcfcChargers || 0,
                      hpcChargers: state.hpcChargers || 0,
                    });

                    return (
                      <div
                        className={`mb-3 p-3 rounded-lg space-y-2 text-xs ${
                          isPerfectFit
                            ? "bg-emerald-950/30 border border-emerald-500/20"
                            : "bg-slate-900/50 border border-slate-700/30"
                        }`}
                      >
                        {/* Equipment Costs */}
                        <div className="pb-2 border-b border-slate-700/50">
                          <p className="text-[11px] uppercase tracking-wider text-emerald-400 mb-1.5 font-bold">
                            Equipment Costs
                          </p>
                          {v45Costs.solarCost > 0 && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1">
                                <span className="text-amber-400">☀️</span>
                                <span>
                                  Solar PV ({tier.solarKW.toFixed(0)}kW @ $
                                  {EQUIPMENT_UNIT_COSTS.solar.pricePerWatt}/W)
                                </span>
                              </span>
                              <span className="font-medium">
                                {formatCurrency(v45Costs.solarCost)}
                              </span>
                            </div>
                          )}
                          {v45Costs.bessCost > 0 && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1">
                                <span>🔋</span>
                                <span>BESS + Hybrid Inverter ({tier.bessKWh.toFixed(0)}kWh)</span>
                              </span>
                              <span className="font-medium">
                                {formatCurrency(v45Costs.bessCost)}
                              </span>
                            </div>
                          )}
                          {v45Costs.generatorCost > 0 && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1">
                                <span className="text-orange-400">🔥</span>
                                <span>Generator ({tier.generatorKW.toFixed(0)}kW)</span>
                              </span>
                              <span className="font-medium">
                                {formatCurrency(v45Costs.generatorCost)}
                              </span>
                            </div>
                          )}
                          {v45Costs.evChargingCost > 0 && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1">
                                <span className="text-cyan-400">⚡</span>
                                <span>EV Chargers</span>
                              </span>
                              <span className="font-medium">
                                {formatCurrency(v45Costs.evChargingCost)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-slate-200 font-semibold mt-1.5 pt-1.5 border-t border-slate-700/30">
                            <span>Equipment Subtotal</span>
                            <span>{formatCurrency(v45Costs.equipmentSubtotal)}</span>
                          </div>
                        </div>

                        {/* Engineering & Permits */}
                        <div className="pb-2 border-b border-slate-700/50">
                          <p className="text-[11px] uppercase tracking-wider text-emerald-400 mb-1.5 font-bold">
                            Engineering &amp; Permits
                          </p>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Engineering, Permits &amp; Monitoring</span>
                            <span className="font-medium">
                              {formatCurrency(v45Costs.siteEngineering)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Construction Contingency (7.5%)</span>
                            <span className="font-medium">
                              {formatCurrency(v45Costs.constructionContingency)}
                            </span>
                          </div>
                        </div>

                        {/* Installation & Field Labor — Additional Costs */}
                        <div className="pb-2 border-b border-slate-700/50">
                          <p className="text-[11px] uppercase tracking-wider text-amber-400 mb-1 font-bold">
                            Installation &amp; Field Labor
                          </p>
                          <p className="text-[10px] text-slate-500 mb-1.5 italic">
                            Additional Costs — billed separately, not included in equipment quote
                          </p>
                          <div className="flex justify-between items-center text-slate-400">
                            <span>Foundation, Trenching, Conduit &amp; Commissioning</span>
                            <span className="font-medium">
                              {formatCurrency(v45Costs.installationLaborCost)}
                            </span>
                          </div>
                        </div>

                        {/* Merlin AI Services */}
                        <div className="pb-2 border-b border-slate-700/50">
                          <p className="text-[11px] uppercase tracking-wider text-emerald-400 mb-1.5 font-bold">
                            Merlin AI Services
                          </p>
                          <div className="flex justify-between items-center text-slate-200 font-semibold">
                            <span>&#9672; Design, Procurement &amp; Software</span>
                            <span>{formatCurrency(v45Costs.merlinFees.totalFee)}</span>
                          </div>
                        </div>

                        {/* Annual Operating Reserves */}
                        <div className="pb-2">
                          <p className="text-[11px] uppercase tracking-wider text-emerald-400 mb-1.5 font-bold">
                            Annual Operating Reserves
                          </p>
                          <div className="flex justify-between items-center text-amber-300">
                            <span>Insurance + Inverter + BESS Reserves</span>
                            <span className="font-medium">
                              -{formatCurrency(v45Costs.annualReserves)}/yr
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500 mt-1 italic">
                            Deducted from gross annual savings for honest TCO
                          </p>
                        </div>

                        {/* Pricing Notes */}
                        <div
                          className={`p-2 rounded text-[10px] ${
                            isPerfectFit ? "bg-emerald-900/20" : "bg-slate-800/50"
                          }`}
                        >
                          <p className="text-slate-400 leading-relaxed">
                            <span className="font-semibold text-slate-300">Equipment Quote:</span>{" "}
                            NREL ATB 2024 pricing, 7.5% contingency, Merlin AI services included.
                            Installation labor billed separately. Payback{" "}
                            {tier.paybackYears.toFixed(1)}yr based on total project cost after ITC.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                {/* Select Button with Visual Confirmation */}
                <button
                  onClick={() => actions.selectTier(tierIndex)}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.18em] transition-all border-2 ${
                    isSelected
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 border-emerald-300 text-slate-950 shadow-[0_0_28px_rgba(16,185,129,0.4)] scale-[0.99]"
                      : config.buttonClass
                  }`}
                >
                  {isSelected ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Confirmed
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <span>{`Choose ${config.name}`}</span>
                      <span className="text-lg leading-none">→</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
