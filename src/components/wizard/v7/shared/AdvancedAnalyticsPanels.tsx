/**
 * AdvancedAnalyticsPanels.tsx — Rich metadata display panels (Feb 2026)
 *
 * Surfaces the previously-hidden metadata from unifiedQuoteCalculator:
 * - Battery degradation curve
 * - ITC bonus breakdown (IRA 2022)
 * - Utility rate attribution
 * - Solar production analysis
 * - 8760 hourly savings breakdown
 * - Monte Carlo P10/P50/P90 risk bands
 *
 * These panels appear in Step6ResultsV7 when metadata is available.
 * All data flows through the typed DisplayQuote.metadata path.
 */
import React, { useState } from "react";
import {
  Battery,
  Sun,
  Zap,
  Shield,
  TrendingDown,
  ChevronDown,
  Info,
  BarChart3,
  Activity,
  MapPin,
  Clock,
} from "lucide-react";
import type { DisplayQuote } from "@/wizard/v7/utils/pricingSanity";

type Metadata = NonNullable<DisplayQuote["metadata"]>;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER — Safe formatters
// ═══════════════════════════════════════════════════════════════════════════

function fmtUSD(n?: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
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

function fmtNum(n?: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

// ═══════════════════════════════════════════════════════════════════════════
// BATTERY DEGRADATION PANEL
// ═══════════════════════════════════════════════════════════════════════════

function DegradationPanel({ data }: { data: NonNullable<Metadata["degradation"]> }) {
  const chemistryLabel: Record<string, string> = {
    lfp: "LFP (Lithium Iron Phosphate)",
    nmc: "NMC (Nickel Manganese Cobalt)",
    nca: "NCA (Nickel Cobalt Aluminum)",
    "flow-vrb": "Vanadium Redox Flow",
    "sodium-ion": "Sodium-Ion",
  };

  // Build mini sparkline from yearlyCapacityPct
  const years = data.yearlyCapacityPct ?? [];
  const maxPct = 100;
  const minPct = Math.min(...years.filter((y) => y > 0), 50);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Battery className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
            Battery Degradation
          </span>
          <span className="ml-auto text-[10px] text-slate-600">{data.source}</span>
        </div>

        {/* Chemistry + warranty */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-bold text-white">
            {chemistryLabel[data.chemistry] ?? data.chemistry.toUpperCase()}
          </span>
          <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
            {data.warrantyPeriod}yr warranty
          </span>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
              Year 10
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {fmtPct(data.year10CapacityPct)}
            </div>
            <div className="text-[10px] text-slate-600">capacity</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
              Year 25
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {fmtPct(data.year25CapacityPct)}
            </div>
            <div className="text-[10px] text-slate-600">capacity</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
              NPV Impact
            </div>
            <div className={`text-lg font-bold tabular-nums ${data.financialImpactPct > 10 ? "text-amber-400" : "text-emerald-400"}`}>
              −{fmtPct(data.financialImpactPct)}
            </div>
            <div className="text-[10px] text-slate-600">revenue loss</div>
          </div>
        </div>

        {/* Mini capacity curve visualization */}
        {years.length > 0 && (
          <div className="mt-2">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-2">
              Capacity Curve (25 years)
            </div>
            <div className="flex items-end gap-[2px] h-12">
              {years.map((pct, i) => {
                const height = ((pct - minPct + 10) / (maxPct - minPct + 10)) * 100;
                const isWarranty = i < data.warrantyPeriod;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm transition-all ${
                      isWarranty ? "bg-violet-500/40" : "bg-violet-500/20"
                    }`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`Year ${i}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
              <span>Year 0</span>
              <span>Year {data.warrantyPeriod} (warranty)</span>
              <span>Year 25</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ITC BREAKDOWN PANEL (IRA 2022)
// ═══════════════════════════════════════════════════════════════════════════

function ITCBreakdownPanel({ data }: { data: NonNullable<Metadata["itcDetails"]> }) {
  const quals = data.qualifications;
  const bonuses = [
    { label: "Base Rate", value: data.baseRate, active: true, desc: "All qualifying projects" },
    {
      label: "Prevailing Wage & Apprenticeship",
      value: quals.prevailingWage ? 0.24 : 0,
      active: quals.prevailingWage,
      desc: "Davis-Bacon compliance (≥1 MW projects)",
    },
    {
      label: "Energy Community",
      value: quals.energyCommunity ? 0.10 : 0,
      active: quals.energyCommunity,
      desc: "Coal closure / brownfield / fossil fuel area",
    },
    {
      label: "Domestic Content",
      value: quals.domesticContent ? 0.10 : 0,
      active: quals.domesticContent,
      desc: "100% US steel, 40%+ US manufactured",
    },
    {
      label: "Low-Income Community",
      value: quals.lowIncome ? 0.10 : 0,
      active: quals.lowIncome,
      desc: "Located in or serving low-income area (<5 MW)",
    },
  ];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            ITC Breakdown (IRA 2022)
          </span>
          <span className="ml-auto text-[10px] text-slate-600">{data.source}</span>
        </div>

        {/* Total ITC rate hero */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-emerald-400 tabular-nums">
            {Math.round(data.totalRate * 100)}%
          </span>
          <span className="text-sm text-slate-400">
            = {fmtUSD(data.creditAmount)} credit
          </span>
        </div>

        {/* Bonus breakdown */}
        <div className="space-y-2">
          {bonuses.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                  b.active
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/[0.04] text-slate-600"
                }`}
              >
                {b.active ? "✓" : "—"}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${b.active ? "text-slate-300" : "text-slate-600"}`}>
                    {b.label}
                  </span>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      b.active ? "text-emerald-400" : "text-slate-600"
                    }`}
                  >
                    +{Math.round(b.value * 100)}%
                  </span>
                </div>
                {b.active && (
                  <div className="text-[10px] text-slate-500 mt-0.5">{b.desc}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY RATE ATTRIBUTION PANEL
// ═══════════════════════════════════════════════════════════════════════════

function UtilityRatePanel({ data }: { data: NonNullable<Metadata["utilityRates"]> }) {
  const confidenceColor: Record<string, string> = {
    high: "text-emerald-400",
    medium: "text-amber-400",
    low: "text-red-400",
  };

  const sourceLabel: Record<string, string> = {
    nrel: "NREL URDB",
    eia: "EIA State Average",
    manual: "User Input",
    cache: "Cached Data",
    default: "Regional Default",
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
          Utility Rate
        </span>
        <span
          className={`ml-auto text-[10px] font-semibold ${confidenceColor[data.confidence] ?? "text-slate-500"}`}
        >
          {data.confidence} confidence
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
            Electricity Rate
          </div>
          <div className="text-lg font-bold text-white tabular-nums">
            ${data.electricityRate?.toFixed(4)}<span className="text-xs text-slate-500">/kWh</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
            Demand Charge
          </div>
          <div className="text-lg font-bold text-white tabular-nums">
            ${data.demandCharge?.toFixed(2)}<span className="text-xs text-slate-500">/kW</span>
          </div>
        </div>
      </div>

      {data.utilityName && (
        <div className="mt-3 pt-2 border-t border-white/[0.04]">
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{data.utilityName}</span>
            {data.rateName && <span className="text-slate-500"> · {data.rateName}</span>}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            Source: {sourceLabel[data.source] ?? data.source}
            {data.zipCode && ` · ZIP ${data.zipCode}`}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SOLAR PRODUCTION PANEL
// ═══════════════════════════════════════════════════════════════════════════

function SolarProductionPanel({ data }: { data: NonNullable<Metadata["solarProduction"]> }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sun className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
          Solar Production
        </span>
        <span className="ml-auto text-[10px] text-slate-600">
          {data.source === "pvwatts" ? "NREL PVWatts" : "Regional estimate"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
            Annual Production
          </div>
          <div className="text-lg font-bold text-white tabular-nums">
            {fmtNum(data.annualProductionKWh)}
            <span className="text-xs text-slate-500 ml-1">kWh</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
            Capacity Factor
          </div>
          <div className="text-lg font-bold text-amber-400 tabular-nums">
            {fmtPct(data.capacityFactorPct)}
          </div>
        </div>
      </div>

      {data.state && (
        <div className="text-[10px] text-slate-600 mt-2">
          Based on {data.state} solar irradiance
          {data.arrayType && ` · ${data.arrayType}`}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 8760 SAVINGS BREAKDOWN PANEL
// ═══════════════════════════════════════════════════════════════════════════

function HourlySavingsPanel({
  data,
}: {
  data: NonNullable<NonNullable<Metadata["advancedAnalysis"]>["hourlySimulation"]>;
}) {
  const categories = [
    { label: "TOU Arbitrage", value: data.touArbitrageSavings, color: "bg-blue-400", icon: <Clock className="w-3 h-3" /> },
    { label: "Peak Shaving", value: data.peakShavingSavings, color: "bg-violet-400", icon: <TrendingDown className="w-3 h-3" /> },
    { label: "Demand Charges", value: data.demandChargeSavings, color: "bg-cyan-400", icon: <Zap className="w-3 h-3" /> },
    { label: "Solar Self-Consumption", value: data.solarSelfConsumptionSavings, color: "bg-amber-400", icon: <Sun className="w-3 h-3" /> },
  ].filter((c) => c.value > 0);

  const total = categories.reduce((s, c) => s + c.value, 0);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
            Savings Breakdown (8760 Hourly)
          </span>
        </div>

        {/* Total + source */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-emerald-400 tabular-nums">
            {fmtUSD(data.annualSavings)}
          </span>
          <span className="text-xs text-slate-500">/year</span>
        </div>

        {/* Stacked bar */}
        {total > 0 && (
          <div className="flex h-3 rounded-full overflow-hidden mb-3">
            {categories.map((c) => (
              <div
                key={c.label}
                className={`${c.color} opacity-60 transition-all`}
                style={{ width: `${(c.value / total) * 100}%` }}
                title={`${c.label}: ${fmtUSD(c.value)}`}
              />
            ))}
          </div>
        )}

        {/* Breakdown list */}
        <div className="space-y-1.5">
          {categories.map((c) => (
            <div key={c.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${c.color} opacity-60`} />
                <span className="text-xs text-slate-400">{c.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tabular-nums">{fmtUSD(c.value)}</span>
                <span className="text-[10px] text-slate-600 tabular-nums w-8 text-right">
                  {Math.round((c.value / total) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Operational metrics */}
        <div className="mt-3 pt-3 border-t border-white/[0.04] flex gap-4">
          <div>
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              Cycles/yr
            </div>
            <div className="text-sm font-bold text-white tabular-nums">
              {fmtNum(data.equivalentCycles)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              Capacity Factor
            </div>
            <div className="text-sm font-bold text-white tabular-nums">
              {fmtPct(data.capacityFactor)}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-600 mt-2">{data.source}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MONTE CARLO RISK PANEL (P10/P50/P90)
// ═══════════════════════════════════════════════════════════════════════════

function RiskAnalysisPanel({
  data,
}: {
  data: NonNullable<NonNullable<Metadata["advancedAnalysis"]>["riskAnalysis"]>;
}) {
  // Helper: 3-bar band display
  function Band({
    label,
    p10,
    p50,
    p90,
    fmt,
    unit,
    inverse,
  }: {
    label: string;
    p10: number;
    p50: number;
    p90: number;
    fmt: (n: number) => string;
    unit?: string;
    inverse?: boolean; // true = lower is better (payback years)
  }) {
    const worst = inverse ? p10 : p10;
    const best = inverse ? p90 : p90;
    return (
      <div>
        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1.5">
          {label}
        </div>
        <div className="flex items-center gap-2">
          {/* P10 — worst case */}
          <div className="text-right w-20">
            <div className="text-[10px] text-slate-600">P10</div>
            <div className="text-xs font-bold text-red-400/70 tabular-nums">
              {fmt(worst)}
              {unit && <span className="text-[10px] text-slate-600 ml-0.5">{unit}</span>}
            </div>
          </div>
          {/* Band bar */}
          <div className="flex-1 relative h-6 flex items-center">
            <div className="absolute inset-x-0 h-2 rounded-full bg-white/[0.06]" />
            <div
              className="absolute h-2 rounded-full bg-gradient-to-r from-red-500/30 via-emerald-500/40 to-emerald-500/30"
              style={{ left: "10%", right: "10%" }}
            />
            {/* P50 marker */}
            <div
              className="absolute w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-lg"
              style={{ left: "50%", transform: "translateX(-50%)" }}
            />
          </div>
          {/* P90 — best case */}
          <div className="w-20">
            <div className="text-[10px] text-slate-600">P90</div>
            <div className="text-xs font-bold text-emerald-400 tabular-nums">
              {fmt(best)}
              {unit && <span className="text-[10px] text-slate-600 ml-0.5">{unit}</span>}
            </div>
          </div>
        </div>
        {/* P50 center label */}
        <div className="text-center mt-0.5">
          <span className="text-[10px] text-slate-500">P50: </span>
          <span className="text-xs font-bold text-white tabular-nums">
            {fmt(p50)}
            {unit && <span className="text-[10px] text-slate-500 ml-0.5">{unit}</span>}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            Risk Analysis (Parametric)
          </span>
        </div>

        {/* Probability of positive NPV — hero number */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-white/[0.03] rounded-lg">
          <div
            className={`text-2xl font-bold tabular-nums ${
              data.probabilityPositiveNPV >= 90
                ? "text-emerald-400"
                : data.probabilityPositiveNPV >= 70
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {data.probabilityPositiveNPV?.toFixed(1)}%
          </div>
          <div>
            <div className="text-xs text-slate-300 font-semibold">Probability of Positive NPV</div>
            <div className="text-[10px] text-slate-500">
              VaR (95%): {fmtUSD(data.valueAtRisk95)}
            </div>
          </div>
        </div>

        {/* P10/P50/P90 bands */}
        <div className="space-y-4">
          <Band label="NPV (25yr)" p10={data.npvP10} p50={data.npvP50} p90={data.npvP90} fmt={fmtUSD} />
          <Band
            label="IRR"
            p10={data.irrP10}
            p50={data.irrP50}
            p90={data.irrP90}
            fmt={(n) => `${n.toFixed(1)}%`}
          />
          <Band
            label="Payback Period"
            p10={data.paybackP10}
            p50={data.paybackP50}
            p90={data.paybackP90}
            fmt={(n) => n.toFixed(1)}
            unit="yrs"
            inverse
          />
        </div>

        <div className="text-[10px] text-slate-600 mt-3">{data.source}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS TEASER STRIP — Always visible above the fold (Feb 2026 P1b)
// Shows key metrics at a glance without needing to expand
// ═══════════════════════════════════════════════════════════════════════════

function AnalyticsTeaserStrip({ metadata, hasSolar }: { metadata: Metadata; hasSolar?: boolean }) {
  const risk = metadata.advancedAnalysis?.riskAnalysis;
  const hourly = metadata.advancedAnalysis?.hourlySimulation;
  const itc = metadata.itcDetails;
  const utility = metadata.utilityRates;

  const chips: { label: string; value: string; color: string }[] = [];

  // NPV probability
  if (risk?.probabilityPositiveNPV != null) {
    const pct = risk.probabilityPositiveNPV;
    chips.push({
      label: "Positive NPV",
      value: `${pct.toFixed(0)}%`,
      color: pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400",
    });
  }

  // 8760 savings
  if (hourly?.annualSavings != null && hourly.annualSavings > 0) {
    chips.push({
      label: "8760 Savings",
      value: fmtUSD(hourly.annualSavings) + "/yr",
      color: "text-emerald-400",
    });
  }

  // ITC rate
  if (itc?.totalRate != null) {
    chips.push({
      label: "ITC Rate",
      value: `${Math.round(itc.totalRate * 100)}%`,
      color: itc.totalRate > 0.3 ? "text-indigo-400" : "text-slate-300",
    });
  }

  // Utility name + rate
  if (utility?.utilityName && utility.electricityRate) {
    chips.push({
      label: utility.utilityName,
      value: `$${utility.electricityRate.toFixed(4)}/kWh`,
      color: "text-sky-400",
    });
  }

  // Solar capacity factor
  if (hasSolar && metadata.solarProduction?.capacityFactorPct != null) {
    chips.push({
      label: "Solar CF",
      value: `${metadata.solarProduction.capacityFactorPct.toFixed(1)}%`,
      color: "text-amber-400",
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/[0.05] p-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex items-center gap-1.5 mr-1">
        <Activity className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Analytics</span>
      </div>
      {chips.map((chip, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-medium">{chip.label}</span>
          <span className={`text-xs font-bold tabular-nums ${chip.color}`}>{chip.value}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — Orchestrator component
// ═══════════════════════════════════════════════════════════════════════════

type Props = {
  metadata: Metadata;
  hasSolar?: boolean;
};

export default function AdvancedAnalyticsPanels({ metadata, hasSolar }: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasContent =
    metadata.degradation ||
    metadata.itcDetails ||
    metadata.utilityRates ||
    metadata.solarProduction ||
    metadata.advancedAnalysis?.hourlySimulation ||
    metadata.advancedAnalysis?.riskAnalysis;

  if (!hasContent) return null;

  return (
    <div className="space-y-2">
      {/* Above-the-fold teaser strip — always visible (P1b — Feb 2026) */}
      <AnalyticsTeaserStrip metadata={metadata} hasSolar={hasSolar} />

      {/* Full analytics panels — collapsed by default */}
      <details
        className="group"
        open={expanded}
        onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1.5 font-semibold">
          <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          Advanced Analytics
          <span className="text-[10px] text-indigo-400/60 ml-1 font-normal">
            Degradation · ITC · Rates · 8760 · Risk
          </span>
        </summary>

        <div className="mt-3 space-y-3">
          {/* Row 1: Utility Rate + Solar Production (side by side if both exist) */}
          {(metadata.utilityRates || (metadata.solarProduction && hasSolar)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {metadata.utilityRates && <UtilityRatePanel data={metadata.utilityRates} />}
              {metadata.solarProduction && hasSolar && (
                <SolarProductionPanel data={metadata.solarProduction} />
              )}
            </div>
          )}

          {/* Row 2: ITC Breakdown */}
          {metadata.itcDetails && <ITCBreakdownPanel data={metadata.itcDetails} />}

          {/* Row 3: Battery Degradation */}
          {metadata.degradation && <DegradationPanel data={metadata.degradation} />}

          {/* Row 4: 8760 Hourly Savings */}
          {metadata.advancedAnalysis?.hourlySimulation && (
            <HourlySavingsPanel data={metadata.advancedAnalysis.hourlySimulation} />
          )}

          {/* Row 5: Risk Analysis (Parametric) */}
          {metadata.advancedAnalysis?.riskAnalysis && (
            <RiskAnalysisPanel data={metadata.advancedAnalysis.riskAnalysis} />
          )}

          {/* Source footnote */}
          <div className="flex items-start gap-1.5 text-[10px] text-slate-600 pt-1">
            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>
              Analytics powered by NREL PVWatts, EIA utility data, DOE 8760 load profiles, and
              parametric risk modeling with NREL uncertainty ranges. Battery degradation modeled per
              NREL/PNNL cycle + calendar aging research.
            </span>
          </div>
        </div>
      </details>
    </div>
  );
}
