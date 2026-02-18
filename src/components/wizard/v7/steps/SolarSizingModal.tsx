/**
 * SOLAR SIZING MODAL
 * ==================
 * Interactive popup that helps users size their solar installation
 * based on their industry and building characteristics.
 *
 * Triggered from Step 3's solar section via "☀️ Size My Solar" button.
 * Uses solarFootprintLibrary.ts as the calculation engine.
 *
 * Created: February 18, 2026
 * Part of TrueQuote™ Solar Sizing Assistant
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  X,
  Sun,
  Building2,
  Ruler,
  Zap,
  DollarSign,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import merlinIcon from "@/assets/images/new_small_profile_.png";
import {
  estimateBuildingFootprint,
  calculateCustomSolarCapacity,
  estimateSolarSavings,
  getSolarCostPerWatt,
  SOLAR_PANEL_CONSTANTS,
  INDUSTRY_FOOTPRINT_PROFILES,
} from "@/services/solarFootprintLibrary";

// ============================================================================
// TYPES
// ============================================================================

export interface SolarSizingResult {
  /** Recommended solar capacity in kW */
  solarKW: number;
  /** Includes canopy solar */
  includesCanopy: boolean;
  /** Roof solar portion */
  roofSolarKW: number;
  /** Canopy solar portion */
  canopySolarKW: number;
  /** Estimated annual production */
  annualProductionKWh: number;
  /** Estimated annual savings */
  annualSavings: number;
  /** Estimated system cost */
  estimatedCost: number;
  /** Building footprint used */
  buildingSqFt: number;
  /** Roof utilization used */
  roofUtilization: number;
}

interface SolarSizingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: SolarSizingResult) => void;
  industry: string;
  step3Answers: Record<string, unknown>;
  state?: string; // US state abbreviation
  electricityRate?: number; // $/kWh
}

// ============================================================================
// HELPER: Format number with commas
// ============================================================================
function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(2)}M`;
  }
  if (n >= 1_000) {
    return `$${(n / 1_000).toFixed(0)}K`;
  }
  return `$${n.toLocaleString("en-US")}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SolarSizingModal({
  isOpen,
  onClose,
  onApply,
  industry,
  step3Answers,
  state,
  electricityRate = 0.12,
}: SolarSizingModalProps) {
  // Get initial estimate from Step 3 answers
  const initialEstimate = useMemo(
    () => estimateBuildingFootprint(industry, step3Answers, state),
    [industry, step3Answers, state]
  );

  // Adjustable state (user can tweak the estimate)
  const [buildingSqFt, setBuildingSqFt] = useState(initialEstimate.buildingSqFt);
  const [roofUtilization, setRoofUtilization] = useState(initialEstimate.roofUtilization);
  const [includeCanopy, setIncludeCanopy] = useState(initialEstimate.canopyPotentialKW > 0);
  const [canopyKW, setCanopyKW] = useState(initialEstimate.canopyPotentialKW);
  const [customKW, setCustomKW] = useState<number | null>(null);

  // Reset when modal opens with new data
  React.useEffect(() => {
    if (isOpen) {
      setBuildingSqFt(initialEstimate.buildingSqFt);
      setRoofUtilization(initialEstimate.roofUtilization);
      setIncludeCanopy(initialEstimate.canopyPotentialKW > 0);
      setCanopyKW(initialEstimate.canopyPotentialKW);
      setCustomKW(null);
    }
  }, [isOpen, initialEstimate]);

  // Live calculation
  const calculation = useMemo(() => {
    return calculateCustomSolarCapacity(
      buildingSqFt,
      roofUtilization,
      includeCanopy,
      canopyKW,
      state
    );
  }, [buildingSqFt, roofUtilization, includeCanopy, canopyKW, state]);

  const effectiveKW = customKW ?? calculation.totalSolarKW;
  const effectiveProduction = customKW
    ? Math.round(customKW * (calculation.annualProductionKWh / (calculation.totalSolarKW || 1)))
    : calculation.annualProductionKWh;
  const annualSavings = estimateSolarSavings(effectiveProduction, electricityRate);
  const costPerWatt = getSolarCostPerWatt(effectiveKW);
  const estimatedCost = Math.round(effectiveKW * 1000 * costPerWatt);

  // Profile lookup for display
  const slug = industry.replace(/_/g, "-").toLowerCase();
  const profile = INDUSTRY_FOOTPRINT_PROFILES[slug];

  const handleApply = useCallback(() => {
    const roofKW = customKW
      ? Math.min(customKW, calculation.maxRoofSolarKW)
      : calculation.maxRoofSolarKW;
    const canopy = customKW
      ? Math.max(0, customKW - calculation.maxRoofSolarKW)
      : includeCanopy
        ? canopyKW
        : 0;

    onApply({
      solarKW: effectiveKW,
      includesCanopy: includeCanopy || canopy > 0,
      roofSolarKW: roofKW,
      canopySolarKW: canopy,
      annualProductionKWh: effectiveProduction,
      annualSavings,
      estimatedCost,
      buildingSqFt,
      roofUtilization,
    });
  }, [
    effectiveKW,
    includeCanopy,
    canopyKW,
    effectiveProduction,
    annualSavings,
    estimatedCost,
    buildingSqFt,
    roofUtilization,
    calculation,
    customKW,
    onApply,
  ]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="relative px-6 pt-6 pb-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-orange-950/20 to-transparent">
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close solar sizing"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Solar Sizing Assistant</h2>
                <p className="text-sm text-amber-200/70 mt-0.5">
                  {initialEstimate.industryLabel} • Based on your Step 3 answers
                </p>
              </div>
            </div>
          </div>

          {/* ── Scrollable Content ── */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {/* Auto-detected summary */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <img src={merlinIcon} alt="Merlin" className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="text-sm text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">
                  Based on your {initialEstimate.sizeDriver}
                </span>{" "}
                ({fmt(initialEstimate.unitsUsed)} {initialEstimate.sizeDriver}), I estimate your
                building is about{" "}
                <span className="font-semibold text-amber-300">
                  {fmt(initialEstimate.buildingSqFt)} sq ft
                </span>{" "}
                with{" "}
                <span className="font-semibold text-amber-300">
                  {fmt(initialEstimate.usableRoofSqFt)} sq ft
                </span>{" "}
                of usable roof for solar.
                <span className="block mt-1 text-xs text-slate-400 italic">
                  {initialEstimate.roofNote}
                </span>
              </div>
            </div>

            {/* ── Adjustable Inputs ── */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Ruler className="w-4 h-4 text-amber-400" />
                Adjust Your Building
              </h3>

              {/* Building Sqft */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-300">Building Footprint</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={buildingSqFt}
                      onChange={(e) => {
                        const v = Math.max(100, Math.min(1000000, Number(e.target.value) || 0));
                        setBuildingSqFt(v);
                        setCustomKW(null); // Reset custom override
                      }}
                      className="w-28 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm text-right focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
                    />
                    <span className="text-xs text-slate-400 w-10">sq ft</span>
                  </div>
                </div>
              </div>

              {/* Roof Utilization Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-300 flex items-center gap-1.5">
                    Usable Roof Area
                    <span className="group relative">
                      <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-700 text-xs text-slate-300 rounded-lg shadow-lg z-10">
                        Percentage of roof usable for solar after accounting for HVAC, vents,
                        skylights, setbacks, etc.
                      </span>
                    </span>
                  </label>
                  <span className="text-sm font-semibold text-amber-300">
                    {Math.round(roofUtilization * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={Math.round(roofUtilization * 100)}
                  onChange={(e) => {
                    setRoofUtilization(Number(e.target.value) / 100);
                    setCustomKW(null);
                  }}
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>10% (obstructed)</span>
                  <span>90% (clear flat roof)</span>
                </div>
              </div>

              {/* Canopy Solar Toggle */}
              {profile && profile.canopyKWPerUnit > 0 && (
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-slate-200">
                        {initialEstimate.canopyLabel}
                      </label>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {initialEstimate.canopyIsPrimary
                          ? "This is your primary solar option for this building type"
                          : "Additional solar capacity from parking/canopy structures"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIncludeCanopy(!includeCanopy);
                        setCustomKW(null);
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        includeCanopy ? "bg-amber-500" : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          includeCanopy ? "translate-x-6" : ""
                        }`}
                      />
                    </button>
                  </div>
                  {includeCanopy && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Canopy capacity:</label>
                      <input
                        type="number"
                        value={canopyKW}
                        onChange={(e) => {
                          setCanopyKW(Math.max(0, Number(e.target.value) || 0));
                          setCustomKW(null);
                        }}
                        className="w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm text-right focus:border-amber-500 outline-none"
                      />
                      <span className="text-xs text-slate-400">kW</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Results Panel ── */}
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/30 to-slate-950/60 overflow-hidden">
              <div className="px-5 py-3 border-b border-amber-500/20 bg-amber-950/40">
                <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Solar Estimate
                </h3>
              </div>

              <div className="p-5 space-y-4">
                {/* Main number */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-300">
                    {fmt(effectiveKW)} <span className="text-lg text-amber-400/60">kW</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {calculation.maxRoofSolarKW > 0 && (
                      <span>{fmt(calculation.maxRoofSolarKW)} kW rooftop</span>
                    )}
                    {includeCanopy && canopyKW > 0 && calculation.maxRoofSolarKW > 0 && (
                      <span> + </span>
                    )}
                    {includeCanopy && canopyKW > 0 && <span>{fmt(canopyKW)} kW canopy</span>}
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/40">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs text-slate-400">Annual Production</span>
                    </div>
                    <div className="text-sm font-bold text-white">
                      {fmt(effectiveProduction)} kWh
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/40">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-xs text-slate-400">Annual Savings</span>
                    </div>
                    <div className="text-sm font-bold text-green-400">
                      {fmtCurrency(annualSavings)}/yr
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/40">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs text-slate-400">System Cost</span>
                    </div>
                    <div className="text-sm font-bold text-white">{fmtCurrency(estimatedCost)}</div>
                    <div className="text-xs text-slate-500">${costPerWatt.toFixed(2)}/W</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/40">
                    <div className="flex items-center gap-2 mb-1">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs text-slate-400">Panels Needed</span>
                    </div>
                    <div className="text-sm font-bold text-white">
                      {fmt(calculation.panelsNeeded)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {SOLAR_PANEL_CONSTANTS.PANEL_WATTS}W each
                    </div>
                  </div>
                </div>

                {/* Custom kW override */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <span className="text-xs text-slate-400 whitespace-nowrap">Or enter custom:</span>
                  <input
                    type="number"
                    value={customKW ?? ""}
                    onChange={(e) => {
                      const v = e.target.value ? Math.max(1, Number(e.target.value)) : null;
                      setCustomKW(v);
                    }}
                    placeholder={`${calculation.totalSolarKW} kW`}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm text-right focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none placeholder:text-slate-600"
                  />
                  <span className="text-xs text-slate-400">kW</span>
                </div>

                {/* Source citation */}
                <p className="text-xs text-slate-500 text-center italic">
                  Building estimates: {initialEstimate.source} • {SOLAR_PANEL_CONSTANTS.PANEL_WATTS}
                  W panels at {SOLAR_PANEL_CONSTANTS.SQFT_PER_KW} sqft/kW
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="p-5 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Sun className="w-4 h-4" />
              Use {fmt(effectiveKW)} kW Solar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
