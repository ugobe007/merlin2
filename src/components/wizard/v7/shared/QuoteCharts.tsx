/**
 * QuoteCharts.tsx — Financial Visualizations (T3 — Feb 2026)
 *
 * Pure CSS/SVG charts — no charting library dependency.
 *
 * Panels:
 *   1. Monthly Cash Flow (bar chart) — solar production + savings vs costs
 *   2. Cumulative Savings Timeline (area) — break-even visualization
 *   3. Monte Carlo Risk Bands (range bars) — P10/P50/P90 NPV/IRR/Payback
 *   4. Battery Degradation Curve (line) — capacity over 25 years
 *   5. Monthly Solar Production (bar) — if PVWatts monthly data available
 *
 * Data sourced from DisplayQuote.metadata — no extra API calls.
 */
import React, { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Battery,
  Sun,
  Activity,
  ChevronDown,
} from "lucide-react";
import type { DisplayQuote } from "@/wizard/v7/utils/pricingSanity";

type Metadata = NonNullable<DisplayQuote["metadata"]>;

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function fmtUSD(n?: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function fmtKWh(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${Math.round(n)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ═══════════════════════════════════════════════════════════════════════════
// 1. CUMULATIVE SAVINGS TIMELINE — Break-even visualization
// ═══════════════════════════════════════════════════════════════════════════

function CumulativeSavingsChart({
  annualSavings,
  netCost,
  paybackYears,
}: {
  annualSavings: number;
  netCost: number;
  paybackYears: number | null;
}) {
  const years = 25;
  const dataPoints = useMemo(() => {
    const points: { year: number; cumulative: number; positive: boolean }[] = [];
    for (let y = 0; y <= years; y++) {
      const cumulative = annualSavings * y - netCost;
      points.push({ year: y, cumulative, positive: cumulative >= 0 });
    }
    return points;
  }, [annualSavings, netCost]);

  const maxVal = Math.max(...dataPoints.map((d) => Math.abs(d.cumulative)));
  const svgW = 400;
  const svgH = 160;
  const padL = 55;
  const padR = 10;
  const padT = 10;
  const padB = 25;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  // Scale functions
  const xScale = (year: number) => padL + (year / years) * chartW;
  const yScale = (val: number) => padT + ((maxVal - val) / (2 * maxVal)) * chartH;
  const zeroY = yScale(0);

  // Build SVG path
  const pathD = dataPoints
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(d.year).toFixed(1)} ${yScale(d.cumulative).toFixed(1)}`)
    .join(" ");

  // Area fill below the line to zero
  const areaD = `${pathD} L ${xScale(years).toFixed(1)} ${zeroY.toFixed(1)} L ${xScale(0).toFixed(1)} ${zeroY.toFixed(1)} Z`;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
          Cumulative Cash Flow (25 years)
        </span>
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <line x1={padL} y1={zeroY} x2={svgW - padR} y2={zeroY} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        {/* Y axis labels */}
        <text x={padL - 5} y={padT + 5} fill="#6b7280" fontSize="8" textAnchor="end">
          {fmtUSD(maxVal)}
        </text>
        <text x={padL - 5} y={zeroY + 3} fill="#6b7280" fontSize="8" textAnchor="end">
          $0
        </text>
        <text x={padL - 5} y={svgH - padB + 5} fill="#6b7280" fontSize="8" textAnchor="end">
          {fmtUSD(-maxVal)}
        </text>

        {/* Area fill — green above zero, red below */}
        <defs>
          <linearGradient id="cashFlowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.05" />
            <stop offset="51%" stopColor="#ef4444" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#cashFlowGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2" />

        {/* Payback marker */}
        {paybackYears !== null && paybackYears > 0 && paybackYears <= years && (
          <>
            <line
              x1={xScale(paybackYears)}
              y1={padT}
              x2={xScale(paybackYears)}
              y2={svgH - padB}
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.6"
            />
            <text
              x={xScale(paybackYears)}
              y={padT - 2}
              fill="#10b981"
              fontSize="8"
              textAnchor="middle"
              fontWeight="bold"
            >
              Break-even: {paybackYears.toFixed(1)}yr
            </text>
          </>
        )}

        {/* X axis labels */}
        {[0, 5, 10, 15, 20, 25].map((y) => (
          <text key={y} x={xScale(y)} y={svgH - 5} fill="#6b7280" fontSize="8" textAnchor="middle">
            {y}yr
          </text>
        ))}
      </svg>

      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>Net investment: {fmtUSD(netCost)}</span>
        <span>Annual savings: {fmtUSD(annualSavings)}/yr</span>
        <span className="text-emerald-400 font-semibold">
          25yr total: {fmtUSD(annualSavings * 25 - netCost)}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. MONTE CARLO RISK BANDS
// ═══════════════════════════════════════════════════════════════════════════

function RiskBandsChart({
  data,
}: {
  data: NonNullable<NonNullable<Metadata["advancedAnalysis"]>["riskAnalysis"]>;
}) {
  const metrics = [
    {
      label: "NPV",
      p10: data.npvP10,
      p50: data.npvP50,
      p90: data.npvP90,
      fmt: fmtUSD,
      color: "emerald",
    },
    {
      label: "IRR",
      p10: data.irrP10,
      p50: data.irrP50,
      p90: data.irrP90,
      fmt: (n: number) => `${n.toFixed(1)}%`,
      color: "violet",
    },
    {
      label: "Payback",
      p10: data.paybackP90, // Reversed: P90 payback = worst case
      p50: data.paybackP50,
      p90: data.paybackP10, // P10 payback = best case
      fmt: (n: number) => `${n.toFixed(1)}yr`,
      color: "blue",
      inverse: true,
    },
  ];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
          Risk Analysis (Monte Carlo)
        </span>
      </div>

      <div className="space-y-4">
        {metrics.map((m) => {
          const min = Math.min(m.p10, m.p90);
          const max = Math.max(m.p10, m.p90);
          const range = max - min || 1;
          const p50Pos = ((m.p50 - min) / range) * 100;
          const colorMap: Record<string, { bar: string; dot: string; label: string }> = {
            emerald: { bar: "bg-emerald-500/20", dot: "bg-emerald-400", label: "text-emerald-400" },
            violet: { bar: "bg-violet-500/20", dot: "bg-violet-400", label: "text-violet-400" },
            blue: { bar: "bg-blue-500/20", dot: "bg-blue-400", label: "text-blue-400" },
          };
          const colors = colorMap[m.color] ?? colorMap.emerald;

          return (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">{m.label}</span>
                <span className={`text-xs font-bold tabular-nums ${colors.label}`}>
                  {m.fmt(m.p50)}
                </span>
              </div>
              {/* Band bar */}
              <div className="relative h-6">
                <div className={`absolute inset-y-1.5 left-0 right-0 ${colors.bar} rounded-full`} />
                {/* P50 marker */}
                <div
                  className={`absolute top-0 w-3 h-6 ${colors.dot} rounded-full shadow-lg`}
                  style={{ left: `calc(${p50Pos}% - 6px)` }}
                  title={`P50: ${m.fmt(m.p50)}`}
                />
              </div>
              {/* Labels */}
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>{m.inverse ? "Worst" : "Downside"}: {m.fmt(m.p10)}</span>
                <span>{m.inverse ? "Best" : "Upside"}: {m.fmt(m.p90)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Probability badge */}
      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-[10px] text-slate-500">Probability of Positive NPV</span>
        <span
          className={`text-sm font-bold tabular-nums ${
            data.probabilityPositiveNPV >= 80
              ? "text-emerald-400"
              : data.probabilityPositiveNPV >= 60
                ? "text-amber-400"
                : "text-red-400"
          }`}
        >
          {data.probabilityPositiveNPV.toFixed(1)}%
        </span>
      </div>
      {data.valueAtRisk95 !== null && data.valueAtRisk95 !== undefined && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-slate-500">Value at Risk (95%)</span>
          <span className="text-xs font-semibold text-slate-300 tabular-nums">
            {fmtUSD(data.valueAtRisk95)}
          </span>
        </div>
      )}

      <div className="text-[10px] text-slate-600 mt-2">{data.source}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. MONTHLY SOLAR PRODUCTION BAR CHART
// ═══════════════════════════════════════════════════════════════════════════

function MonthlySolarChart({
  monthlyKWh,
  annualKWh,
  source,
}: {
  monthlyKWh: number[];
  annualKWh: number;
  source: string;
}) {
  const maxMonth = Math.max(...monthlyKWh);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sun className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
          Monthly Solar Production
        </span>
        <span className="ml-auto text-[10px] text-slate-600">
          {source === "pvwatts" ? "NREL PVWatts" : "Regional est."}
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-24">
        {monthlyKWh.map((kwh, i) => {
          const pct = maxMonth > 0 ? (kwh / maxMonth) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-amber-500/40 rounded-t-sm hover:bg-amber-500/60 transition-colors"
                style={{ height: `${Math.max(pct, 3)}%` }}
                title={`${MONTHS[i]}: ${fmtKWh(kwh)} kWh`}
              />
            </div>
          );
        })}
      </div>
      {/* X axis labels */}
      <div className="flex gap-1 mt-1">
        {MONTHS.map((m, i) => (
          <div key={i} className="flex-1 text-center text-[8px] text-slate-600">
            {m}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-[10px] text-slate-500">Annual Total</span>
        <span className="text-sm font-bold text-amber-400 tabular-nums">
          {fmtKWh(annualKWh)} kWh/yr
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. BATTERY DEGRADATION CURVE (compact sparkline chart)
// ═══════════════════════════════════════════════════════════════════════════

function DegradationChart({ yearlyPct, warrantyYears }: { yearlyPct: number[]; warrantyYears: number }) {
  if (yearlyPct.length < 2) return null;

  const svgW = 400;
  const svgH = 100;
  const padL = 35;
  const padR = 10;
  const padT = 10;
  const padB = 20;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const minPct = Math.min(...yearlyPct.filter((p) => p > 0));
  const maxPct = 100;

  const xScale = (i: number) => padL + (i / (yearlyPct.length - 1)) * chartW;
  const yScale = (pct: number) => padT + ((maxPct - pct) / (maxPct - minPct + 5)) * chartH;

  const pathD = yearlyPct
    .map((pct, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(pct).toFixed(1)}`)
    .join(" ");

  // 80% warranty threshold line
  const warrantyY = yScale(80);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Battery className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
          Capacity Degradation Curve
        </span>
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* 80% warranty threshold */}
        <line
          x1={padL}
          y1={warrantyY}
          x2={svgW - padR}
          y2={warrantyY}
          stroke="#f59e0b"
          strokeWidth="0.5"
          strokeDasharray="3,2"
          opacity="0.5"
        />
        <text x={svgW - padR + 2} y={warrantyY + 3} fill="#f59e0b" fontSize="7" opacity="0.6">
          80%
        </text>

        {/* Warranty boundary */}
        {warrantyYears < yearlyPct.length && (
          <line
            x1={xScale(warrantyYears)}
            y1={padT}
            x2={xScale(warrantyYears)}
            y2={svgH - padB}
            stroke="#8b5cf6"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.4"
          />
        )}

        {/* Curve */}
        <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2" />

        {/* Start/end dots */}
        <circle cx={xScale(0)} cy={yScale(yearlyPct[0])} r="3" fill="#8b5cf6" />
        <circle cx={xScale(yearlyPct.length - 1)} cy={yScale(yearlyPct[yearlyPct.length - 1])} r="3" fill="#8b5cf6" opacity="0.6" />

        {/* Y axis labels */}
        <text x={padL - 3} y={padT + 5} fill="#6b7280" fontSize="7" textAnchor="end">100%</text>
        <text x={padL - 3} y={yScale(minPct) + 3} fill="#6b7280" fontSize="7" textAnchor="end">
          {Math.round(minPct)}%
        </text>

        {/* X axis */}
        {[0, 5, 10, 15, 20, 25].filter((y) => y < yearlyPct.length).map((y) => (
          <text key={y} x={xScale(y)} y={svgH - 3} fill="#6b7280" fontSize="7" textAnchor="middle">
            {y}yr
          </text>
        ))}
      </svg>

      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
        <span>Year 0: 100%</span>
        <span className="text-violet-400">Warranty: {warrantyYears}yr</span>
        <span>Year {yearlyPct.length - 1}: {yearlyPct[yearlyPct.length - 1]?.toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — Collapsible charts section
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  quote: DisplayQuote;
}

export default function QuoteCharts({ quote }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const meta = quote.metadata;
  const hasAnyChart =
    (quote.annualSavingsUSD !== null && quote.capexUSD !== null) ||
    meta?.advancedAnalysis?.riskAnalysis ||
    meta?.solarProduction?.monthlyProductionKWh?.length === 12 ||
    (meta?.degradation?.yearlyCapacityPct?.length ?? 0) > 2;

  if (!hasAnyChart) return null;

  // Compute net cost for cash flow chart
  const netCost =
    quote.grossCost !== null && quote.itcAmount !== null
      ? quote.grossCost - quote.itcAmount
      : quote.capexUSD ?? 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
            Financial Charts & Visualizations
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {/* 1. Cumulative Cash Flow */}
          {quote.annualSavingsUSD !== null && netCost > 0 && (
            <CumulativeSavingsChart
              annualSavings={quote.annualSavingsUSD}
              netCost={netCost}
              paybackYears={quote.paybackYears}
            />
          )}

          {/* 2. Monte Carlo Risk Bands */}
          {meta?.advancedAnalysis?.riskAnalysis && (
            <RiskBandsChart data={meta.advancedAnalysis.riskAnalysis} />
          )}

          {/* 3. Monthly Solar Production */}
          {meta?.solarProduction?.monthlyProductionKWh?.length === 12 && (
            <MonthlySolarChart
              monthlyKWh={meta.solarProduction.monthlyProductionKWh}
              annualKWh={meta.solarProduction.annualProductionKWh}
              source={meta.solarProduction.source}
            />
          )}

          {/* 4. Battery Degradation Curve */}
          {meta?.degradation?.yearlyCapacityPct && meta.degradation.yearlyCapacityPct.length > 2 && (
            <DegradationChart
              yearlyPct={meta.degradation.yearlyCapacityPct}
              warrantyYears={meta.degradation.warrantyPeriod}
            />
          )}
        </div>
      )}
    </div>
  );
}
