import React, { useState } from "react";
import {
  Battery,
  DollarSign,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  Activity,
  PiggyBank,
  BarChart3,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import type { FinancialCalculationResult } from "@/services/centralizedCalculations";

/* ─── types ─── */
interface RunningCalculatorProps {
  /* Core BESS */
  storageSizeMW: number;
  durationHours: number;

  /* Renewables / generators */
  solarIncluded: boolean;
  solarCapacityKW: number;
  windIncluded: boolean;
  windCapacityKW: number;
  fuelCellIncluded: boolean;
  fuelCellCapacityKW: number;
  dieselGenIncluded: boolean;
  dieselGenCapacityKW: number;
  naturalGasGenIncluded: boolean;
  naturalGasCapacityKW: number;

  /* Financial inputs */
  utilityRate: number;
  demandCharge: number;
  chemistry: string;
  useCase: string;

  /* Electrical */
  totalKW: number;
  maxAmpsAC: number;
  maxAmpsDC: number;
  systemVoltage: number;
  dcVoltage: number;
  numberOfInverters: number;
  inverterRating: number;

  /* SSOT results */
  financialMetrics: FinancialCalculationResult | null;
  isCalculating: boolean;
}

/* ─── helpers ─── */
const fmt = (n: number, decimals = 0) =>
  n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });

const fmtDollar = (n: number | undefined | null) => {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtPct = (n: number | undefined | null) => {
  if (n == null || isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
};

/* ─── metric row ─── */
function MetricRow({
  label,
  value,
  unit,
  accent,
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5 group">
      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
        {label}
      </span>
      <span className="text-right">
        <span className="text-sm font-semibold tabular-nums" style={{ color: accent || "#fff" }}>
          {value}
        </span>
        {unit && (
          <span className="text-[10px] ml-1 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
            {unit}
          </span>
        )}
        {sub && (
          <span className="block text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}

/* ─── collapsible section ─── */
function CalcSection({
  title,
  icon,
  accent,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: accent }}>
          {title}
        </span>
        <span className="ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── delta indicator ─── */
function DeltaIndicator({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0;
  const isZero = value === 0;
  return (
    <div className="flex items-center gap-1">
      {isZero ? (
        <Minus className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
      ) : isPositive ? (
        <ArrowUpRight className="w-3 h-3 text-emerald-400" />
      ) : (
        <ArrowDownRight className="w-3 h-3 text-red-400" />
      )}
      <span
        className="text-[10px] font-medium"
        style={{ color: isZero ? "rgba(255,255,255,0.3)" : isPositive ? "#34d399" : "#f87171" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function ProQuoteRunningCalculator({
  storageSizeMW,
  durationHours,
  solarIncluded,
  solarCapacityKW,
  windIncluded,
  windCapacityKW,
  fuelCellIncluded,
  fuelCellCapacityKW,
  dieselGenIncluded,
  dieselGenCapacityKW,
  naturalGasGenIncluded,
  naturalGasCapacityKW,
  utilityRate,
  demandCharge,
  chemistry,
  useCase,
  totalKW,
  maxAmpsAC,
  maxAmpsDC,
  systemVoltage,
  dcVoltage,
  numberOfInverters,
  inverterRating,
  financialMetrics,
  isCalculating,
}: RunningCalculatorProps) {
  const fm = financialMetrics;
  const storageMWh = storageSizeMW * durationHours;

  /* ── derived values ── */
  const totalSolarKW = solarIncluded ? solarCapacityKW : 0;
  const totalWindKW = windIncluded ? windCapacityKW : 0;
  const totalFuelCellKW = fuelCellIncluded ? fuelCellCapacityKW : 0;
  const totalGenKW =
    (dieselGenIncluded ? dieselGenCapacityKW : 0) +
    (naturalGasGenIncluded ? naturalGasCapacityKW : 0);
  const totalSystemKW = totalKW + totalSolarKW + totalWindKW + totalFuelCellKW + totalGenKW;

  const projectCost = fm?.totalProjectCost ?? 0;
  const netCost = fm?.netCost ?? 0;
  const taxCredit = fm?.taxCredit ?? 0;
  const annualSavings = fm?.annualSavings ?? 0;
  const lifetimeSavings = annualSavings * 25;
  const netReturn = lifetimeSavings - netCost;

  /* ── cost per kWh ── */
  const costPerKWh = storageMWh > 0 ? projectCost / (storageMWh * 1000) : 0;
  const costPerKW = storageSizeMW > 0 ? projectCost / (storageSizeMW * 1000) : 0;

  /* ── cost breakdown % ── */
  const equipPct = projectCost > 0 ? ((fm?.equipmentCost ?? 0) / projectCost) * 100 : 0;
  const installPct = projectCost > 0 ? ((fm?.installationCost ?? 0) / projectCost) * 100 : 0;
  const _otherPct = Math.max(0, 100 - equipPct - installPct);

  /* ── loading shimmer ── */
  const shimmer = isCalculating ? "animate-pulse" : "";

  /* ── chemistry labels ── */
  const chemLabel: Record<string, string> = {
    lfp: "LFP",
    nmc: "NMC",
    lto: "LTO",
    "sodium-ion": "Na-ion",
  };

  const useCaseLabel: Record<string, string> = {
    "peak-shaving": "Peak Shaving",
    arbitrage: "Arbitrage",
    backup: "Backup",
    "solar-shifting": "Solar+Storage",
    "frequency-regulation": "Freq. Reg.",
    "renewable-smoothing": "RE Smoothing",
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* ─── HEADER ─── */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(251,191,36,0.12)" }}
          >
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Running Calculator</h3>
            <p className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
              Real-time • SSOT Engine
            </p>
          </div>
        </div>
      </div>

      {/* ─── HERO METRIC ─── */}
      <div className={`mx-3 rounded-xl p-3 ${shimmer}`} style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">
            Total Project Cost
          </span>
          {taxCredit > 0 && (
            <span className="text-[10px] font-medium text-emerald-400">
              -{fmtDollar(taxCredit)} ITC
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tabular-nums text-white">
            {isCalculating ? "—" : fmtDollar(projectCost)}
          </span>
        </div>
        {netCost > 0 && netCost !== projectCost && (
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
              After ITC
            </span>
            <span className="text-sm font-bold text-emerald-400">{fmtDollar(netCost)}</span>
          </div>
        )}
      </div>

      {/* ─── QUICK STATS ROW ─── */}
      <div className="mx-3 grid grid-cols-3 gap-1.5">
        {[
          { label: "Payback", value: fm?.paybackYears != null ? `${fm.paybackYears.toFixed(1)}` : "—", unit: "yrs", color: "#34d399" },
          { label: "$/kWh", value: costPerKWh > 0 ? `$${costPerKWh.toFixed(0)}` : "—", unit: "", color: "#38bdf8" },
          { label: "Savings/yr", value: annualSavings > 0 ? fmtDollar(annualSavings) : "—", unit: "", color: "#a78bfa" },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-lg px-2 py-2 text-center ${shimmer}`}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
              {s.label}
            </p>
            <p className="text-sm font-bold tabular-nums" style={{ color: s.color }}>
              {isCalculating ? "—" : s.value}
              {s.unit && (
                <span className="text-[9px] ml-0.5 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {s.unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* ─── SCROLLABLE SECTIONS ─── */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10">

        {/* SYSTEM OVERVIEW */}
        <CalcSection
          title="System Overview"
          icon={<Battery className="w-3.5 h-3.5" />}
          accent="#60a5fa"
        >
          <MetricRow label="BESS Power" value={`${(storageSizeMW ?? 0).toFixed(1)}`} unit="MW" accent="#60a5fa" sub={`${fmt(totalKW)} kW`} />
          <MetricRow label="Duration" value={`${durationHours ?? 0}`} unit="hrs" accent="#818cf8" />
          <MetricRow label="Capacity" value={`${(storageMWh ?? 0).toFixed(1)}`} unit="MWh" accent="#34d399" sub={`${fmt((storageMWh ?? 0) * 1000)} kWh`} />
          <MetricRow label="Chemistry" value={chemLabel[chemistry] || chemistry} accent="#c4b5fd" />
          <MetricRow label="Use Case" value={useCaseLabel[useCase] || useCase} accent="#c4b5fd" />
          <div className="mt-1 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <MetricRow label="R/T Efficiency" value="90" unit="%" accent="rgba(255,255,255,0.5)" />
          </div>

          {/* Renewables / Gen */}
          {(totalSolarKW > 0 || totalWindKW > 0 || totalFuelCellKW > 0 || totalGenKW > 0) && (
            <div className="mt-2 pt-2 space-y-0" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              {totalSolarKW > 0 && (
                <MetricRow label="Solar PV" value={fmt(totalSolarKW)} unit="kW" accent="#fbbf24" />
              )}
              {totalWindKW > 0 && (
                <MetricRow label="Wind" value={fmt(totalWindKW)} unit="kW" accent="#22d3ee" />
              )}
              {totalFuelCellKW > 0 && (
                <MetricRow label="Fuel Cell" value={fmt(totalFuelCellKW)} unit="kW" accent="#60a5fa" />
              )}
              {totalGenKW > 0 && (
                <MetricRow label="Generator" value={fmt(totalGenKW)} unit="kW" accent="#fb923c" />
              )}
              <div className="mt-1 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <MetricRow label="Total System" value={fmt(totalSystemKW)} unit="kW" accent="#e2e8f0" />
              </div>
            </div>
          )}
        </CalcSection>

        {/* COST BREAKDOWN */}
        <CalcSection
          title="Cost Breakdown"
          icon={<DollarSign className="w-3.5 h-3.5" />}
          accent="#fbbf24"
        >
          <MetricRow
            label="Equipment"
            value={fmtDollar(fm?.equipmentCost)}
            accent="#fbbf24"
            sub={equipPct > 0 ? `${equipPct.toFixed(0)}% of total` : undefined}
          />
          <MetricRow
            label="Installation"
            value={fmtDollar(fm?.installationCost)}
            accent="#fb923c"
            sub={installPct > 0 ? `${installPct.toFixed(0)}% of total` : undefined}
          />
          {(fm?.shippingCost ?? 0) + (fm?.tariffCost ?? 0) > 0 && (
            <MetricRow
              label="Shipping & Tariff"
              value={fmtDollar((fm?.shippingCost ?? 0) + (fm?.tariffCost ?? 0))}
              accent="#f87171"
            />
          )}
          <div className="mt-1 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <MetricRow
              label="Project Total"
              value={fmtDollar(projectCost)}
              accent="#e2e8f0"
            />
            {taxCredit > 0 && (
              <MetricRow
                label="ITC Credit (30%)"
                value={`-${fmtDollar(taxCredit)}`}
                accent="#34d399"
              />
            )}
            {netCost > 0 && netCost !== projectCost && (
              <MetricRow label="Net Cost" value={fmtDollar(netCost)} accent="#34d399" />
            )}
          </div>

          {/* Cost ratios */}
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <MetricRow label="Cost / kWh" value={costPerKWh > 0 ? `$${costPerKWh.toFixed(0)}` : "—"} unit="/kWh" accent="#38bdf8" />
            <MetricRow label="Cost / kW" value={costPerKW > 0 ? `$${costPerKW.toFixed(0)}` : "—"} unit="/kW" accent="#38bdf8" />
          </div>
        </CalcSection>

        {/* REVENUE STREAMS */}
        <CalcSection
          title="Revenue & Savings"
          icon={<PiggyBank className="w-3.5 h-3.5" />}
          accent="#34d399"
        >
          <MetricRow
            label="Peak Shaving"
            value={fmtDollar(fm?.peakShavingSavings)}
            unit="/yr"
            accent="#34d399"
          />
          <MetricRow
            label="Demand Charge"
            value={fmtDollar(fm?.demandChargeSavings)}
            unit="/yr"
            accent="#34d399"
          />
          {(fm?.gridServiceRevenue ?? 0) > 0 && (
            <MetricRow
              label="Grid Services"
              value={fmtDollar(fm!.gridServiceRevenue)}
              unit="/yr"
              accent="#a78bfa"
            />
          )}
          {(fm?.solarSavings ?? 0) > 0 && (
            <MetricRow
              label="Solar Savings"
              value={fmtDollar(fm!.solarSavings)}
              unit="/yr"
              accent="#fbbf24"
            />
          )}
          {(fm?.windSavings ?? 0) > 0 && (
            <MetricRow
              label="Wind Savings"
              value={fmtDollar(fm!.windSavings)}
              unit="/yr"
              accent="#22d3ee"
            />
          )}
          <div className="mt-1 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <MetricRow
              label="Annual Total"
              value={annualSavings > 0 ? fmtDollar(annualSavings) : "—"}
              unit="/yr"
              accent="#e2e8f0"
            />
            <MetricRow
              label="25-Year Total"
              value={lifetimeSavings > 0 ? fmtDollar(lifetimeSavings) : "—"}
              accent="#a78bfa"
            />
          </div>
        </CalcSection>

        {/* FINANCIAL RETURNS */}
        <CalcSection
          title="Financial Returns"
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          accent="#a78bfa"
        >
          <MetricRow
            label="Simple Payback"
            value={fm?.paybackYears != null ? `${fm.paybackYears.toFixed(1)}` : "—"}
            unit="years"
            accent="#34d399"
          />
          <MetricRow
            label="10-Year ROI"
            value={fmtPct(fm?.roi10Year)}
            accent="#a78bfa"
          />
          <MetricRow
            label="25-Year ROI"
            value={fmtPct(fm?.roi25Year)}
            accent="#a78bfa"
          />
          {fm?.npv != null && (
            <MetricRow label="NPV" value={fmtDollar(fm.npv)} accent="#34d399" />
          )}
          {fm?.irr != null && (
            <MetricRow label="IRR" value={fmtPct(fm.irr)} accent="#fbbf24" />
          )}
          {fm?.discountedPayback != null && (
            <MetricRow
              label="Disc. Payback"
              value={`${fm.discountedPayback.toFixed(1)}`}
              unit="years"
              accent="#818cf8"
            />
          )}
          {fm?.levelizedCostOfStorage != null && (
            <MetricRow
              label="LCOS"
              value={`$${fm.levelizedCostOfStorage.toFixed(0)}`}
              unit="/MWh"
              accent="#38bdf8"
            />
          )}
          {netReturn !== 0 && (
            <div className="mt-1 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <MetricRow
                label="Net Return (25yr)"
                value={fmtDollar(netReturn)}
                accent={netReturn > 0 ? "#34d399" : "#f87171"}
              />
              <DeltaIndicator
                value={netReturn}
                label={netReturn > 0 ? `${fmtDollar(netReturn)} profit` : `${fmtDollar(Math.abs(netReturn))} deficit`}
              />
            </div>
          )}
        </CalcSection>

        {/* ELECTRICAL */}
        <CalcSection
          title="Electrical"
          icon={<Zap className="w-3.5 h-3.5" />}
          accent="#c084fc"
          defaultOpen={false}
        >
          <MetricRow label="AC Voltage" value={`${fmt(systemVoltage)}`} unit="V" accent="#818cf8" />
          <MetricRow label="DC Voltage" value={`${fmt(dcVoltage)}`} unit="V" accent="#60a5fa" />
          <MetricRow label="AC Current" value={`${fmt(maxAmpsAC)}`} unit="A" accent="#818cf8" />
          <MetricRow label="DC Current" value={`${fmt(maxAmpsDC)}`} unit="A" accent="#60a5fa" />
          <MetricRow label="Inverters" value={`${numberOfInverters}× ${fmt(inverterRating)}`} unit="kW" accent="#c4b5fd" />
        </CalcSection>

        {/* INPUTS SUMMARY */}
        <CalcSection
          title="Your Inputs"
          icon={<BarChart3 className="w-3.5 h-3.5" />}
          accent="#94a3b8"
          defaultOpen={false}
        >
          <MetricRow label="Utility Rate" value={`$${(utilityRate ?? 0).toFixed(2)}`} unit="/kWh" accent="#fbbf24" />
          <MetricRow label="Demand Charge" value={`$${(demandCharge ?? 0).toFixed(0)}`} unit="/kW" accent="#fb923c" />
          <MetricRow label="Chemistry" value={chemLabel[chemistry] || chemistry} accent="#c4b5fd" />
          <MetricRow label="Use Case" value={useCaseLabel[useCase] || useCase} accent="#94a3b8" />
        </CalcSection>

        {/* DATA SOURCE BADGE */}
        <div className="mt-1 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>
              Powered by TrueQuote™ Engine • {fm?.dataSource === "database" ? "DB" : "Fallback"} •{" "}
              {fm?.formulaVersion ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
