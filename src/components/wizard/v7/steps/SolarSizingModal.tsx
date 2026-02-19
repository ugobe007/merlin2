/**
 * SOLAR SIZING MODAL — Two-Panel Layout
 * ======================================
 * Interactive popup that helps users size their solar installation
 * based on their industry and building characteristics.
 *
 * Layout: LEFT (configure) ↔ RIGHT (live results)
 * No scrolling required — everything visible at once.
 * Mobile: stacks vertically (configure on top, results below).
 *
 * Triggered from Step 3's solar section via "☀️ Size My Solar" button.
 * Uses solarFootprintLibrary.ts as the calculation engine.
 *
 * Created: February 18, 2026
 * Redesigned: February 18, 2026 — Two-panel layout
 * Part of TrueQuote™ Solar Sizing Assistant
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  X,
  Sun,
  Building2,
  Zap,
  DollarSign,
  ArrowRight,
  Info,
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
        <div
          className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Solar Sizing Assistant</h2>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  {initialEstimate.industryLabel} • Based on your Step 3 answers
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close solar sizing"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Two-Panel Body ── */}
          <div className="flex flex-col md:flex-row flex-1 min-h-0">

            {/* ════════ MOBILE: Compact Results Strip (md:hidden) ════════ */}
            <div className="md:hidden px-4 py-3 bg-gradient-to-r from-emerald-950/30 to-slate-900 border-b border-slate-700/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-2xl font-black text-emerald-400 tabular-nums leading-none">
                      {fmt(effectiveKW)}
                      <span className="text-sm font-semibold text-emerald-500/50 ml-0.5">kW</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-green-400">{fmtCurrency(annualSavings)}</div>
                    <div className="text-[9px] text-slate-500">savings/yr</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-white">{fmtCurrency(estimatedCost)}</div>
                    <div className="text-[9px] text-slate-500">est. cost</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ════════ LEFT: Configure ════════ */}
            <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto md:border-r border-slate-700/30">
              {/* Auto-detected summary */}
              <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                <img
                  src={merlinIcon}
                  alt="Merlin"
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex-shrink-0 mt-0.5"
                />
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Based on your{" "}
                  <span className="font-semibold text-white">
                    {initialEstimate.sizeDriver}
                  </span>{" "}
                  ({fmt(initialEstimate.unitsUsed)} {initialEstimate.sizeDriver}), your
                  building is ~{" "}
                  <span className="font-semibold text-emerald-300">
                    {fmt(initialEstimate.buildingSqFt)} sq ft
                  </span>{" "}
                  with{" "}
                  <span className="font-semibold text-emerald-300">
                    {fmt(initialEstimate.usableRoofSqFt)} sq ft
                  </span>{" "}
                  usable roof.
                  {initialEstimate.roofNote && (
                    <span className="block mt-1 text-xs text-slate-500 italic">
                      {initialEstimate.roofNote}
                    </span>
                  )}
                </p>
              </div>

              {/* Building Footprint */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Building Footprint
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={buildingSqFt}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") { setBuildingSqFt(0); setCustomKW(null); return; }
                      const v = Number(raw);
                      if (Number.isFinite(v) && v >= 0) { setBuildingSqFt(Math.min(v, 1000000)); setCustomKW(null); }
                    }}
                    onBlur={() => {
                      if (buildingSqFt < 100) setBuildingSqFt(100);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm pr-14 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    sq ft
                  </span>
                </div>
              </div>

              {/* Roof Utilization Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    Usable Roof Area
                    <span className="group relative">
                      <Info className="w-3 h-3 text-slate-600 cursor-help" />
                      <span className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden group-hover:block w-44 p-2 bg-slate-700 text-xs text-slate-300 rounded-lg shadow-lg z-10">
                        Roof % usable for solar after HVAC, vents, skylights, setbacks
                      </span>
                    </span>
                  </label>
                  <span className="text-sm font-bold text-emerald-400">
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
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>10% obstructed</span>
                  <span>90% clear flat roof</span>
                </div>
              </div>

              {/* Canopy Solar Toggle */}
              {profile && profile.canopyKWPerUnit > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-slate-200">
                        {initialEstimate.canopyLabel}
                      </label>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {initialEstimate.canopyIsPrimary
                          ? "Primary solar option for this building"
                          : "Additional solar from parking/canopy"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIncludeCanopy(!includeCanopy);
                        setCustomKW(null);
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        includeCanopy ? "bg-emerald-500" : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          includeCanopy ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                  {includeCanopy && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500">Capacity:</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={canopyKW}
                          onChange={(e) => {
                            setCanopyKW(Math.max(0, Number(e.target.value) || 0));
                            setCustomKW(null);
                          }}
                          className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm text-right pr-9 focus:border-emerald-500 outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                          kW
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ════════ RIGHT: Live Results (hidden on mobile — compact strip shown above) ════════ */}
            <div className="hidden md:flex flex-1 p-6 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900 flex-col justify-center">
              {/* Hero kW */}
              <div className="text-center mb-6">
                <div className="text-5xl font-black text-emerald-400 tabular-nums">
                  {fmt(effectiveKW)}
                  <span className="text-xl font-semibold text-emerald-500/50 ml-1">kW</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  {calculation.maxRoofSolarKW > 0 && (
                    <span>{fmt(calculation.maxRoofSolarKW)} kW roof</span>
                  )}
                  {includeCanopy && canopyKW > 0 && calculation.maxRoofSolarKW > 0 && (
                    <span> + </span>
                  )}
                  {includeCanopy && canopyKW > 0 && (
                    <span>{fmt(canopyKW)} kW canopy</span>
                  )}
                </p>
              </div>

              {/* 2×2 Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Production
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {fmt(effectiveProduction)}{" "}
                    <span className="text-xs font-normal text-slate-500">kWh/yr</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Savings
                    </span>
                  </div>
                  <div className="text-sm font-bold text-green-400">
                    {fmtCurrency(annualSavings)}
                    <span className="text-xs font-normal text-green-500/50">/yr</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      System Cost
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">{fmtCurrency(estimatedCost)}</div>
                  <div className="text-[10px] text-slate-600">${costPerWatt.toFixed(2)}/W</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Panels
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {fmt(calculation.panelsNeeded)}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    {SOLAR_PANEL_CONSTANTS.PANEL_WATTS}W each
                  </div>
                </div>
              </div>

              {/* Custom kW override */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <span className="text-xs text-slate-500 whitespace-nowrap">Or set custom:</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={customKW ?? ""}
                    onChange={(e) => {
                      const v = e.target.value ? Math.max(1, Number(e.target.value)) : null;
                      setCustomKW(v);
                    }}
                    placeholder={`${calculation.totalSolarKW}`}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm text-right pr-9 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none placeholder:text-slate-700"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    kW
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80">
            <p className="text-[10px] text-slate-600 max-w-xs hidden sm:block">
              {initialEstimate.source} • {SOLAR_PANEL_CONSTANTS.PANEL_WATTS}W panels at{" "}
              {SOLAR_PANEL_CONSTANTS.SQFT_PER_KW} sqft/kW
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Sun className="w-4 h-4" />
                Use {fmt(effectiveKW)} kW
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
