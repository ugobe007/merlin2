/**
 * STEP 4: Options - Add-on Selection (Solar, EV, Generator)
 * =========================================================
 * MERLIN DARK THEME REDESIGN - January 2026
 *
 * Design System:
 * - Background: Dark slate (slate-800/900) with purple gradients
 * - Borders: Purple (purple-500/30) or slate (slate-700)
 * - Accents: Purple/violet for primary, emerald for positive, amber for highlights
 * - Text: White for headers, slate-300/400 for secondary
 *
 * SSOT: Uses step4PreviewService for all preview calculations
 */

import React, { useState, useMemo } from "react";
import {
  Sun,
  Zap,
  Fuel,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  Star,
  TrendingUp,
} from "lucide-react";
import type { WizardState } from "../types";
import {
  calculateSolarPreview,
  calculateEvPreview,
  calculateGeneratorPreview,
} from "@/services/step4PreviewService";

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  step3Snapshot?: unknown;
}

// UI display types (standalone types that include formatted strings)
interface SolarTier {
  name: string;
  sizeKw: number;
  sizeLabel: string;
  coveragePercent: number;
  panelCount: number;
  annualProductionKwh: number;
  annualSavings: number; // raw number from service
  installCost: number; // raw number from service
  netCostAfterITC: number;
  paybackYears: number;
  co2OffsetTons: number;
  // Display strings
  size: string;
  coverage: string;
  panels: number;
  annualProduction: string;
  annualSavingsStr: string;
  annualSavingsRaw: number;
  installCostStr: string;
  installCostRaw: number;
  netCost: string;
  netCostRaw: number;
  payback: string;
  co2Offset: string;
  tag?: string;
}

interface EvTier {
  name: string;
  l2Count: number;
  dcfcCount: number;
  totalPowerKw: number;
  chargersLabel: string;
  carsPerDay: string;
  monthlyRevenue: number;
  installCost: number;
  tenYearRevenue: number;
  // Display strings
  chargers: string;
  power: string;
  monthlyRevenueStr: string;
  monthlyRevenueRaw: number;
  installCostStr: string;
  installCostRaw: number;
  guestAppeal: string;
  tag?: string;
}

interface GeneratorTier {
  name: string;
  sizeKw: number;
  sizeLabel: string;
  fuelType: string;
  runtimeHours: number;
  installCost: number;
  netCostAfterITC: number;
  annualMaintenance: number;
  coverage: string;
  // Display strings
  size: string;
  runtime: string;
  installCostStr: string;
  netCostStr: string;
  annualMaintenanceStr: string;
  tag?: string;
}

// SSOT-compliant calculation wrappers that format for UI display
function calcSolar(name: string, pct: number, usage: number, sun: number): SolarTier {
  const result = calculateSolarPreview(
    { annualUsageKwh: usage, sunHoursPerDay: sun, coveragePercent: pct },
    name
  );
  return {
    name: result.name,
    sizeKw: result.sizeKw,
    sizeLabel: result.sizeLabel,
    coveragePercent: result.coveragePercent,
    panelCount: result.panelCount,
    annualProductionKwh: result.annualProductionKwh,
    annualSavings: result.annualSavings,
    installCost: result.installCost,
    netCostAfterITC: result.netCostAfterITC,
    paybackYears: result.paybackYears,
    co2OffsetTons: result.co2OffsetTons,
    // Display strings
    size: result.sizeLabel,
    coverage: `${Math.round(pct * 100)}%`,
    panels: result.panelCount,
    annualProduction: result.annualProductionKwh.toLocaleString(),
    annualSavingsStr: `$${result.annualSavings.toLocaleString()}`,
    annualSavingsRaw: result.annualSavings,
    installCostStr: `$${result.installCost.toLocaleString()}`,
    installCostRaw: result.installCost,
    netCost: `$${result.netCostAfterITC.toLocaleString()}`,
    netCostRaw: result.netCostAfterITC,
    payback: `${result.paybackYears} years`,
    co2Offset: `${result.co2OffsetTons} tons/yr`,
  };
}

function calcEv(name: string, l2: number, dc: number): EvTier {
  const result = calculateEvPreview({ l2Count: l2, dcfcCount: dc }, name);
  const stars = dc > 0 ? (dc >= 4 ? "★★★★★" : "★★★★☆") : "★★★☆☆";
  return {
    ...result,
    chargers: result.chargersLabel,
    power: `${result.totalPowerKw} kW`,
    monthlyRevenueStr: `$${result.monthlyRevenue.toLocaleString()}`,
    monthlyRevenueRaw: result.monthlyRevenue,
    installCostStr: `$${result.installCost.toLocaleString()}`,
    installCostRaw: result.installCost,
    guestAppeal: stars,
  };
}

function calcGen(name: string, kw: number, fuel: "diesel" | "natural-gas"): GeneratorTier {
  const result = calculateGeneratorPreview({ sizeKw: kw, fuelType: fuel }, name);
  return {
    ...result,
    size: result.sizeLabel,
    runtime: `${result.runtimeHours} hrs`,
    installCostStr: `$${result.installCost.toLocaleString()}`,
    netCostStr: `$${result.netCostAfterITC.toLocaleString()}`,
    annualMaintenanceStr: `$${result.annualMaintenance.toLocaleString()}/yr`,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

const Step4Options = ({ state, updateState }: Props) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    state.selectedOptions || ["solar"]
  );
  const [solarTier, setSolarTier] = useState<string | null>(state.solarTier || "recommended");
  const [evTier, setEvTier] = useState<string | null>(state.evTier || null);
  const [generatorTier, setGeneratorTier] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>("solar");

  // Access inputs from useCaseData.inputs
  const inputs = (state.useCaseData?.inputs as Record<string, unknown>) || {};

  const loc = {
    city: state.city || "Las Vegas",
    state: state.state || "NV",
    sunHours: state.solarData?.sunHours || 6.3,
  };
  const ind = {
    type: state.industryName || "Hotel / Hospitality",
    rooms: (inputs.roomCount as number) || 150,
  };
  // Get usage/peak from calculations (SSOT) or estimate from industry
  const usage = state.calculations?.base?.annualConsumptionKWh || 1850000;
  const peak = state.calculations?.base?.peakDemandKW || Math.round((usage / 8760) * 1.5);

  const solarOpts = useMemo(
    () => ({
      starter: calcSolar("Starter", 0.15, usage, loc.sunHours),
      recommended: { ...calcSolar("Recommended", 0.3, usage, loc.sunHours), tag: "Best ROI" },
      maximum: { ...calcSolar("Maximum", 0.5, usage, loc.sunHours), tag: "Max Savings" },
    }),
    [usage, loc.sunHours]
  );

  const evOpts = useMemo(
    () => ({
      basic: calcEv("Basic", 4, 0),
      standard: { ...calcEv("Standard", 6, 2), tag: "Most Popular" },
      premium: { ...calcEv("Premium", 8, 4), tag: "EV Destination" },
    }),
    []
  );

  const genOpts = useMemo(
    () => ({
      essential: calcGen("Essential", 150, "diesel"),
      standard: { ...calcGen("Standard", 300, "diesel"), tag: "Recommended" },
      full: {
        ...calcGen("Full Backup", Math.round((peak * 1.1) / 50) * 50, "natural-gas"),
        tag: "Full Coverage",
      },
    }),
    [peak]
  );

  const curSolar = solarTier ? solarOpts[solarTier as keyof typeof solarOpts] : null;
  const curEv = evTier ? evOpts[evTier as keyof typeof evOpts] : null;
  const curGen = generatorTier ? genOpts[generatorTier as keyof typeof genOpts] : null;
  const tenYr =
    (selectedOptions.includes("solar") && curSolar ? curSolar.annualSavingsRaw * 10 : 0) +
    (selectedOptions.includes("ev") && curEv ? curEv.tenYearRevenue : 0);
  const maxSolar = solarOpts.maximum.annualSavingsRaw;
  const _maxEvRevenue = evOpts.premium.monthlyRevenueRaw;

  const sync = (opts: string[], sol: string | null, ev: string | null) =>
    updateState({ selectedOptions: opts, solarTier: sol, evTier: ev });

  const toggle = (id: string) => {
    const opts = selectedOptions.includes(id)
      ? selectedOptions.filter((o) => o !== id)
      : [...selectedOptions, id];
    let sol = solarTier,
      ev = evTier;
    if (id === "solar") sol = selectedOptions.includes(id) ? null : "recommended";
    if (id === "ev") ev = selectedOptions.includes(id) ? null : "standard";
    if (id === "generator") setGeneratorTier(selectedOptions.includes(id) ? null : "standard");
    setSelectedOptions(opts);
    setSolarTier(sol);
    setEvTier(ev);
    sync(opts, sol, ev);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="relative">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm font-medium text-purple-300 mb-4">
            <Star className="w-4 h-4 text-amber-400" />
            Personalized Recommendations
          </span>
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Boost Your Energy ROI
          </h1>
          <p className="text-slate-400">
            Based on your <span className="text-cyan-400 font-semibold">{loc.state}</span> location
            and <span className="text-purple-400 font-semibold">{ind.type}</span> profile
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-center gap-6 p-5 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl mb-6">
          <div className="text-center px-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Annual Usage</div>
            <div className="text-xl font-bold text-white">{(usage / 1e6).toFixed(2)}M kWh</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="text-center px-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Sun Hours/Day
            </div>
            <div className="text-xl font-bold text-amber-400">☀️ {loc.sunHours}</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="text-center px-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Property Size
            </div>
            <div className="text-xl font-bold text-white">{ind.rooms} rooms</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="text-center px-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Potential Savings
            </div>
            <div className="text-xl font-bold text-emerald-400">
              ${Math.round((maxSolar + evOpts.premium.monthlyRevenueRaw * 12) / 1000)}k+/yr
            </div>
          </div>
        </div>

        {/* Option Cards */}
        <div className="space-y-4">
          {/* SOLAR CARD */}
          <OptionCard
            id="solar"
            icon={<Sun className="w-6 h-6" />}
            iconBg="from-amber-500 to-orange-500"
            title="Add Solar Array"
            subtitle="Hotels with solar see 15% boost in eco-conscious bookings"
            badge="High Opportunity"
            badgeColor="emerald"
            value={curSolar ? curSolar.annualSavingsStr : `$${maxSolar.toLocaleString()}`}
            valueLabel={curSolar ? "Selected" : "Up to"}
            valueSuffix="/yr"
            isSelected={selectedOptions.includes("solar")}
            isExpanded={expandedCard === "solar"}
            onToggle={() => toggle("solar")}
            onExpand={() => setExpandedCard(expandedCard === "solar" ? null : "solar")}
            accentColor="amber"
          >
            <div className="p-5 border-t border-slate-700/50">
              <div className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Choose configuration based on {(usage / 1e6).toFixed(2)}M kWh usage:
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(solarOpts).map(([k, o]) => (
                  <TierCard
                    key={k}
                    tier={o}
                    isSelected={solarTier === k}
                    onClick={() => {
                      setSolarTier(k);
                      sync(selectedOptions, k, evTier);
                    }}
                    accentColor="amber"
                    metrics={[
                      { label: "Coverage", value: o.coverage },
                      { label: "Production", value: `${o.annualProduction} kWh` },
                      { label: "Savings", value: o.annualSavingsStr, highlight: true },
                      { label: "Payback", value: o.payback },
                      { label: "Cost", value: o.installCostStr },
                      { label: "After ITC", value: o.netCost, highlight: true, color: "purple" },
                    ]}
                  />
                ))}
              </div>
            </div>
          </OptionCard>

          {/* EV CARD */}
          <OptionCard
            id="ev"
            icon={<Zap className="w-6 h-6" />}
            iconBg="from-cyan-500 to-blue-500"
            title="Add EV Charging"
            subtitle="Properties with EV charging report 23% higher occupancy"
            badge="High Opportunity"
            badgeColor="emerald"
            value={
              curEv
                ? `$${Math.round(curEv.tenYearRevenue / 1000)}k`
                : `$${Math.round(evOpts.premium.tenYearRevenue / 1000)}k+`
            }
            valueLabel={curEv ? "Selected" : "10yr Revenue"}
            isSelected={selectedOptions.includes("ev")}
            isExpanded={expandedCard === "ev"}
            onToggle={() => toggle("ev")}
            onExpand={() => setExpandedCard(expandedCard === "ev" ? null : "ev")}
            accentColor="cyan"
          >
            <div className="p-5 border-t border-slate-700/50">
              <div className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Choose charging setup for {ind.rooms}-room property:
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(evOpts).map(([k, o]) => (
                  <TierCard
                    key={k}
                    tier={o}
                    isSelected={evTier === k}
                    onClick={() => {
                      setEvTier(k);
                      sync(selectedOptions, solarTier, k);
                    }}
                    accentColor="cyan"
                    sizeLabel={o.chargers}
                    metrics={[
                      { label: "Power", value: o.power },
                      { label: "Cars/Day", value: o.carsPerDay },
                      { label: "Monthly Rev", value: o.monthlyRevenueStr, highlight: true },
                      { label: "Install Cost", value: o.installCostStr },
                      {
                        label: "10yr Revenue",
                        value: `$${(o.tenYearRevenue / 1000).toFixed(0)}k`,
                        highlight: true,
                        color: "cyan",
                      },
                      { label: "Guest Appeal", value: o.guestAppeal, color: "amber" },
                    ]}
                  />
                ))}
              </div>
              {/* Charger Types Info */}
              <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <div className="text-xs font-semibold text-slate-300 mb-3">⚡ Charger Types</div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-cyan-400">Level 2 (L2)</div>
                    <div className="text-slate-500">7.7 kW • 4-8 hr charge</div>
                  </div>
                  <div>
                    <div className="font-semibold text-cyan-400">DC Fast (DCFC)</div>
                    <div className="text-slate-500">62.5 kW • 30-60 min</div>
                  </div>
                  <div>
                    <div className="font-semibold text-cyan-400">Revenue</div>
                    <div className="text-slate-500">L2: ~$150/mo • DCFC: ~$800/mo</div>
                  </div>
                </div>
              </div>
            </div>
          </OptionCard>

          {/* GENERATOR CARD */}
          <OptionCard
            id="generator"
            icon={<Fuel className="w-6 h-6" />}
            iconBg="from-red-500 to-orange-600"
            title="Backup Generator"
            subtitle="Protect against outages • Critical for 24/7 operations"
            badge="Business Continuity"
            badgeColor="amber"
            value={curGen ? curGen.netCostStr : "$73k"}
            valueLabel={curGen ? "Selected" : "From"}
            isSelected={selectedOptions.includes("generator")}
            isExpanded={expandedCard === "generator"}
            onToggle={() => toggle("generator")}
            onExpand={() => setExpandedCard(expandedCard === "generator" ? null : "generator")}
            accentColor="red"
          >
            <div className="p-5 border-t border-slate-700/50">
              <div className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-red-400" />
                Choose backup power (Peak: ~{peak} kW):
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(genOpts).map(([k, o]) => (
                  <TierCard
                    key={k}
                    tier={o}
                    isSelected={generatorTier === k}
                    onClick={() => setGeneratorTier(k)}
                    accentColor="red"
                    metrics={[
                      { label: "Coverage", value: o.coverage },
                      { label: "Fuel", value: o.fuelType },
                      { label: "Runtime", value: o.runtime },
                      { label: "Install", value: o.installCostStr },
                      {
                        label: "After Credits",
                        value: o.netCostStr,
                        highlight: true,
                        color: "purple",
                      },
                      { label: "Maintenance", value: o.annualMaintenanceStr },
                    ]}
                  />
                ))}
              </div>
              {/* Why Backup Info */}
              <div className="mt-4 p-4 bg-slate-800/50 border border-red-500/20 rounded-xl">
                <div className="text-xs font-semibold text-red-300 mb-2">⚠️ Why Backup Power?</div>
                <div className="text-xs text-slate-400">
                  Hotels lose $5,000-15,000/hour during outages. A properly sized generator provides
                  peace of mind and can qualify for insurance discounts.
                </div>
              </div>
            </div>
          </OptionCard>
        </div>

        {/* Summary */}
        {selectedOptions.length > 0 && (curSolar || curEv || curGen) && (
          <div className="mt-6 p-5 bg-gradient-to-r from-emerald-500/10 via-slate-800/80 to-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4">
              📋 Your Selections
            </div>
            <div className="flex gap-6 items-center flex-wrap">
              {selectedOptions.includes("solar") && curSolar && (
                <div className="flex-1 min-w-[160px]">
                  <div className="text-xs text-slate-500">Solar Array</div>
                  <div className="text-lg font-bold text-white">
                    {curSolar.size} — {curSolar.name}
                  </div>
                  <div className="text-sm font-semibold text-emerald-400">
                    {curSolar.annualSavingsStr}/year
                  </div>
                </div>
              )}
              {selectedOptions.includes("ev") && curEv && (
                <div className="flex-1 min-w-[160px]">
                  <div className="text-xs text-slate-500">EV Charging</div>
                  <div className="text-lg font-bold text-white">
                    {curEv.chargers} — {curEv.name}
                  </div>
                  <div className="text-sm font-semibold text-cyan-400">
                    {curEv.monthlyRevenueStr}/month
                  </div>
                </div>
              )}
              {selectedOptions.includes("generator") && curGen && (
                <div className="flex-1 min-w-[160px]">
                  <div className="text-xs text-slate-500">Generator</div>
                  <div className="text-lg font-bold text-white">
                    {curGen.size} — {curGen.name}
                  </div>
                  <div className="text-sm font-semibold text-red-400">{curGen.coverage}</div>
                </div>
              )}
              <div className="border-l-2 border-emerald-500/30 pl-6 text-right">
                <div className="text-xs text-slate-500">Combined 10-Year Value</div>
                <div
                  className="text-3xl font-bold text-emerald-400"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  ${Math.round(tenYr / 1000).toLocaleString()}k
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface OptionCardProps {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: "emerald" | "amber" | "purple";
  value: string;
  valueLabel: string;
  valueSuffix?: string;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  accentColor: "amber" | "cyan" | "red";
  children: React.ReactNode;
}

const badgeColors = {
  emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const accentColors = {
  amber: {
    ring: "ring-amber-500/50",
    text: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  cyan: {
    ring: "ring-cyan-500/50",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
  },
  red: {
    ring: "ring-red-500/50",
    text: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
  },
};

function OptionCard({
  icon,
  iconBg,
  title,
  subtitle,
  badge,
  badgeColor,
  value,
  valueLabel,
  valueSuffix,
  isSelected,
  isExpanded,
  onToggle,
  onExpand,
  accentColor,
  children,
}: OptionCardProps) {
  const accent = accentColors[accentColor];

  return (
    <div
      className={`
        bg-slate-800/80 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300
        border ${isSelected ? accent.border + " ring-2 " + accent.ring : "border-slate-700/50"}
      `}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${isSelected ? accent.bg : "hover:bg-slate-800"}`}
        onClick={onExpand}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center text-white shadow-lg`}
          >
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${badgeColors[badgeColor]}`}
              >
                {badge} ⭐
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right mr-2">
            <div className="text-xs text-slate-500">{valueLabel}</div>
            <div className={`text-xl font-bold ${isSelected ? "text-emerald-400" : accent.text}`}>
              {value}
              {valueSuffix && (
                <span className="text-sm font-normal text-slate-400">{valueSuffix}</span>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`
              px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${
                isSelected
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }
            `}
          >
            {isSelected ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Added
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add
              </span>
            )}
          </button>
          <div className="text-slate-500">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && isSelected && children}
    </div>
  );
}

interface TierCardProps {
  tier: { name: string; size?: string; tag?: string };
  isSelected: boolean;
  onClick: () => void;
  accentColor: "amber" | "cyan" | "red";
  sizeLabel?: string;
  metrics: Array<{
    label: string;
    value: string;
    highlight?: boolean;
    color?: "emerald" | "purple" | "cyan" | "amber";
  }>;
}

const tagColors: Record<string, string> = {
  "Best ROI": "bg-purple-500",
  "Max Savings": "bg-cyan-500",
  "Most Popular": "bg-purple-500",
  "EV Destination": "bg-cyan-500",
  Recommended: "bg-purple-500",
  "Full Coverage": "bg-red-500",
};

function TierCard({ tier, isSelected, onClick, accentColor, sizeLabel, metrics }: TierCardProps) {
  const accent = accentColors[accentColor];
  const highlightColors: Record<string, string> = {
    emerald: "text-emerald-400",
    purple: "text-purple-400",
    cyan: "text-cyan-400",
    amber: "text-amber-400",
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-xl cursor-pointer transition-all
        ${
          isSelected
            ? `bg-slate-700/80 border-2 ${accent.border} shadow-lg`
            : "bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50"
        }
      `}
    >
      {/* Tag */}
      {tier.tag && (
        <div
          className={`absolute -top-2.5 right-3 px-2.5 py-1 ${tagColors[tier.tag] || "bg-purple-500"} rounded-md text-[10px] font-bold text-white shadow-lg`}
        >
          {tier.tag}
        </div>
      )}

      {/* Name & Size */}
      <div className="text-sm font-semibold text-slate-400">{tier.name}</div>
      <div
        className={`text-2xl font-bold ${accent.text} my-2`}
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        {sizeLabel || tier.size}
      </div>

      {/* Metrics */}
      <div className="space-y-1.5 text-xs">
        {metrics.map((m, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-slate-500">{m.label}</span>
            <span
              className={`font-semibold ${m.highlight ? highlightColors[m.color || "emerald"] : "text-slate-300"}`}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Step4Options };
export default Step4Options;
