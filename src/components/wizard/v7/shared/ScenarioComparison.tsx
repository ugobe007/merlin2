/**
 * ScenarioComparison.tsx — Multi-Quote Scenario Comparison (T3 — Feb 2026)
 *
 * Generates 3 preset scenarios from the current quote data and displays
 * them side-by-side for easy comparison:
 *   1. Conservative — Smaller system, safer assumptions
 *   2. Balanced — Current quote (highlighted)
 *   3. Aggressive — Larger system, maximize savings
 *
 * Data is derived purely from the current DisplayQuote — no extra API calls.
 * Each scenario applies multipliers to key parameters to show trade-offs.
 */
import React, { useMemo, useState } from "react";
import {
  Shield,
  Zap,
  Rocket,
  ChevronDown,
  Check,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import type { DisplayQuote } from "@/wizard/v7/utils/pricingSanity";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Scenario {
  id: "conservative" | "balanced" | "aggressive";
  label: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  borderColor: string;
  // Derived financials
  bessKWh: number | null;
  bessKW: number | null;
  capex: number | null;
  annualSavings: number | null;
  paybackYears: number | null;
  npv: number | null;
  irr: number | null;
  itcCredit: number | null;
  netCost: number | null;
  roi10Year: number | null;
}

interface Props {
  quote: DisplayQuote;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function fmtUSD(n?: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(2)}M`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n?: number | null, decimals = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `${n.toFixed(decimals)}%`;
}

function fmtNum(n?: number | null, unit?: string): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  return unit ? `${formatted} ${unit}` : formatted;
}

function safe(n: number | null, multiplier: number): number | null {
  if (n === null || !Number.isFinite(n)) return null;
  return n * multiplier;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO BUILDER
// ═══════════════════════════════════════════════════════════════════════════

function buildScenarios(q: DisplayQuote): Scenario[] {
  const itcRate = q.itcRate ?? 0.30;

  // Conservative: 75% sizing → lower capex, lower savings, longer payback
  const consCapex = safe(q.capexUSD, 0.75);
  const consSavings = safe(q.annualSavingsUSD, 0.70); // Savings don't scale linearly (demand charges)
  const consItc = consCapex !== null ? consCapex * itcRate : null;
  const consNet = consCapex !== null && consItc !== null ? consCapex - consItc : null;
  const consPayback =
    consNet !== null && consSavings !== null && consSavings > 0
      ? consNet / consSavings
      : null;
  const consNpv = safe(q.npv, 0.65);
  const consIrr = q.irr !== null ? q.irr * 0.85 : null;
  const consRoi = consNet !== null && consSavings !== null && consNet > 0
    ? ((consSavings * 10 - consNet) / consNet) * 100
    : null;

  // Balanced: current quote (1:1)
  const balNet = q.grossCost !== null && q.itcAmount !== null
    ? q.grossCost - q.itcAmount
    : q.capexUSD;
  const balRoi = balNet !== null && q.annualSavingsUSD !== null && balNet > 0
    ? ((q.annualSavingsUSD * 10 - balNet) / balNet) * 100
    : null;

  // Aggressive: 130% sizing → higher capex, higher savings, faster payback per $
  const aggCapex = safe(q.capexUSD, 1.30);
  const aggSavings = safe(q.annualSavingsUSD, 1.40); // Larger systems capture more demand charge savings
  const aggItc = aggCapex !== null ? aggCapex * itcRate : null;
  const aggNet = aggCapex !== null && aggItc !== null ? aggCapex - aggItc : null;
  const aggPayback =
    aggNet !== null && aggSavings !== null && aggSavings > 0
      ? aggNet / aggSavings
      : null;
  const aggNpv = safe(q.npv, 1.45);
  const aggIrr = q.irr !== null ? q.irr * 1.15 : null;
  const aggRoi = aggNet !== null && aggSavings !== null && aggNet > 0
    ? ((aggSavings * 10 - aggNet) / aggNet) * 100
    : null;

  return [
    {
      id: "conservative",
      label: "Conservative",
      description: "Smaller system, lower risk",
      icon: <Shield className="w-4 h-4" />,
      accentColor: "text-blue-400",
      accentBg: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      bessKWh: safe(q.bessKWh, 0.75),
      bessKW: safe(q.bessKW, 0.75),
      capex: consCapex,
      annualSavings: consSavings,
      paybackYears: consPayback,
      npv: consNpv,
      irr: consIrr,
      itcCredit: consItc,
      netCost: consNet,
      roi10Year: consRoi,
    },
    {
      id: "balanced",
      label: "Balanced",
      description: "Recommended — your quote",
      icon: <Zap className="w-4 h-4" />,
      accentColor: "text-emerald-400",
      accentBg: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      bessKWh: q.bessKWh,
      bessKW: q.bessKW,
      capex: q.capexUSD,
      annualSavings: q.annualSavingsUSD,
      paybackYears: q.paybackYears,
      npv: q.npv,
      irr: q.irr,
      itcCredit: q.itcAmount,
      netCost: balNet,
      roi10Year: balRoi,
    },
    {
      id: "aggressive",
      label: "Aggressive",
      description: "Maximize savings potential",
      icon: <Rocket className="w-4 h-4" />,
      accentColor: "text-amber-400",
      accentBg: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      bessKWh: safe(q.bessKWh, 1.30),
      bessKW: safe(q.bessKW, 1.30),
      capex: aggCapex,
      annualSavings: aggSavings,
      paybackYears: aggPayback,
      npv: aggNpv,
      irr: aggIrr,
      itcCredit: aggItc,
      netCost: aggNet,
      roi10Year: aggRoi,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO CARD
// ═══════════════════════════════════════════════════════════════════════════

function ScenarioCard({
  scenario,
  isRecommended,
  isExpanded,
  onToggle,
}: {
  scenario: Scenario;
  isRecommended: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`relative rounded-xl border ${
        isRecommended
          ? `${scenario.borderColor} ring-1 ring-emerald-500/20 bg-white/[0.04]`
          : "border-white/[0.06] bg-white/[0.02]"
      } overflow-hidden transition-all`}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg">
          <Check className="w-2.5 h-2.5 inline mr-0.5" />
          Recommended
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className={`${scenario.accentBg} p-1.5 rounded-lg ${scenario.accentColor}`}>
            {scenario.icon}
          </div>
          <div>
            <h4 className={`text-sm font-bold ${scenario.accentColor}`}>
              {scenario.label}
            </h4>
            <p className="text-[10px] text-slate-500">{scenario.description}</p>
          </div>
        </div>

        {/* System size */}
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-bold text-white tabular-nums">
            {fmtNum(scenario.bessKWh)}
          </span>
          <span className="text-xs text-slate-500">kWh</span>
          <span className="text-slate-600 mx-1">·</span>
          <span className="text-sm font-semibold text-slate-300 tabular-nums">
            {fmtNum(scenario.bessKW)}
          </span>
          <span className="text-xs text-slate-500">kW</span>
        </div>

        {/* Key metric: Net cost */}
        <div className="mt-3 bg-white/[0.03] rounded-lg p-2.5">
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            Net Investment (after ITC)
          </div>
          <div className="text-xl font-bold text-white tabular-nums mt-0.5">
            {fmtUSD(scenario.netCost)}
          </div>
          {scenario.itcCredit !== null && (
            <div className="text-[10px] text-emerald-400 mt-0.5">
              ITC saves {fmtUSD(scenario.itcCredit)}
            </div>
          )}
        </div>

        {/* Key metrics grid */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MetricCell label="Annual Savings" value={fmtUSD(scenario.annualSavings)} />
          <MetricCell
            label="Payback"
            value={scenario.paybackYears !== null ? `${scenario.paybackYears.toFixed(1)} yr` : "—"}
          />
          <MetricCell label="NPV (25yr)" value={fmtUSD(scenario.npv)} />
          <MetricCell label="IRR" value={fmtPct(scenario.irr)} />
        </div>

        {/* Expandable details */}
        <button
          onClick={onToggle}
          className="mt-3 w-full flex items-center justify-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors py-1"
        >
          <span>{isExpanded ? "Less" : "More details"}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-white/[0.04] space-y-1.5">
            <DetailRow label="Gross CAPEX" value={fmtUSD(scenario.capex)} />
            <DetailRow
              label="10-Year ROI"
              value={scenario.roi10Year !== null ? `${scenario.roi10Year.toFixed(0)}%` : "—"}
              accent={scenario.roi10Year !== null && scenario.roi10Year > 0}
            />
            <DetailRow label="System Size" value={`${fmtNum(scenario.bessKWh)} kWh / ${fmtNum(scenario.bessKW)} kW`} />
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.02] rounded-lg p-2">
      <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold text-white tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span
        className={`text-xs font-semibold tabular-nums ${
          accent ? "text-emerald-400" : "text-slate-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default function ScenarioComparison({ quote }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const scenarios = useMemo(() => buildScenarios(quote), [quote]);

  // Only show if we have meaningful pricing data
  const hasData = quote.capexUSD !== null && quote.annualSavingsUSD !== null;
  if (!hasData) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
            Scenario Comparison
          </span>
          <span className="text-[10px] text-slate-500 ml-1">
            Conservative · Balanced · Aggressive
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-xs text-slate-500 mb-4">
            Compare different system sizes to find the right balance of investment and return.
            The <span className="text-emerald-400 font-semibold">Balanced</span> option matches your current configuration.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                isRecommended={s.id === "balanced"}
                isExpanded={expandedId === s.id}
                onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
              />
            ))}
          </div>

          {/* Quick comparison bar */}
          <div className="mt-4 bg-white/[0.02] rounded-lg border border-white/[0.04] p-3">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-2">
              Quick Comparison
            </div>
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div className="text-slate-500 font-medium">Metric</div>
              {scenarios.map((s) => (
                <div key={s.id} className={`font-semibold ${s.accentColor} text-center`}>
                  {s.label}
                </div>
              ))}
              {/* Net Cost row */}
              <div className="text-slate-400 py-1 border-t border-white/[0.04]">Net Cost</div>
              {scenarios.map((s) => (
                <div key={s.id} className="text-white font-semibold text-center py-1 border-t border-white/[0.04] tabular-nums">
                  {fmtUSD(s.netCost)}
                </div>
              ))}
              {/* Annual Savings row */}
              <div className="text-slate-400 py-1 border-t border-white/[0.04]">Savings/yr</div>
              {scenarios.map((s) => (
                <div key={s.id} className="text-emerald-400 font-semibold text-center py-1 border-t border-white/[0.04] tabular-nums">
                  {fmtUSD(s.annualSavings)}
                </div>
              ))}
              {/* Payback row */}
              <div className="text-slate-400 py-1 border-t border-white/[0.04]">Payback</div>
              {scenarios.map((s) => (
                <div key={s.id} className="text-white font-semibold text-center py-1 border-t border-white/[0.04] tabular-nums">
                  {s.paybackYears !== null ? `${s.paybackYears.toFixed(1)}yr` : "—"}
                </div>
              ))}
              {/* NPV row */}
              <div className="text-slate-400 py-1 border-t border-white/[0.04]">NPV</div>
              {scenarios.map((s) => (
                <div key={s.id} className="text-white font-semibold text-center py-1 border-t border-white/[0.04] tabular-nums">
                  {fmtUSD(s.npv)}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-600">
            <ArrowUpRight className="w-3 h-3" />
            Scenarios are derived from your current configuration. Contact sales for a custom proposal.
          </div>
        </div>
      )}
    </div>
  );
}
