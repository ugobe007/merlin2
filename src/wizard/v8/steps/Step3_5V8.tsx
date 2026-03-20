/**
 * WIZARD V8 — STEP 3.5: ADDON CONFIGURATION
 * ============================================================================
 * Conditional step shown ONLY if user selected addons in Step 1
 *
 * Configures:
 * - Solar capacity (kW)
 * - Generator capacity (kW) + fuel type
 * - EV charger counts (L2 / DCFC / HPC)
 *
 * Smart Defaults:
 * - Based on facility size and peak load from Step 3
 * - Industry-appropriate sizing
 * ============================================================================
 */

import React, { useEffect } from "react";
import type { WizardState, WizardActions } from "../wizardState";
import { hasSolarAddonOpportunity } from "../addonIntent";
import { Sun, Zap, Fuel, Info } from "lucide-react";
import { EQUIPMENT_UNIT_COSTS } from "@/services/pricingServiceV45";

interface Props {
  state: WizardState;
  actions: WizardActions;
}

export default function Step3_5V8({ state, actions }: Props) {
  console.log("[Step3_5V8] Component rendering, state:", {
    step: state.step,
    wantsSolar: state.wantsSolar,
    wantsGenerator: state.wantsGenerator,
    wantsEVCharging: state.wantsEVCharging,
    peakLoadKW: state.peakLoadKW,
    industry: state.industry,
  });

  const { wantsSolar, wantsEVCharging, wantsGenerator, peakLoadKW, criticalLoadKW, industry } =
    state;
  const showSolar = hasSolarAddonOpportunity(
    wantsSolar,
    state.intel?.solarFeasible ?? false,
    state.solarPhysicalCapKW
  );

  // Local confirmation states
  const [solarConfirmed, setSolarConfirmed] = React.useState(false);
  const [generatorConfirmed, setGeneratorConfirmed] = React.useState(false);
  const [evConfirmed, setEvConfirmed] = React.useState(false);
  const [isGeneratingTiers, setIsGeneratingTiers] = React.useState(false);

  // Real-time cost estimates helper
  const calculateAddonCosts = () => {
    const costs = {
      solar: state.solarKW * EQUIPMENT_UNIT_COSTS.solar.pricePerWatt * 1000,
      generator: state.generatorKW * EQUIPMENT_UNIT_COSTS.generator.pricePerKW,
      evCharging:
        state.level2Chargers * EQUIPMENT_UNIT_COSTS.evCharging.level2 +
        state.dcfcChargers * EQUIPMENT_UNIT_COSTS.evCharging.dcfc +
        state.hpcChargers * EQUIPMENT_UNIT_COSTS.evCharging.hpc,
    };
    costs.total = costs.solar + costs.generator + costs.evCharging;
    return costs;
  };

  const addonCosts = calculateAddonCosts();

  // Solar sizing guidance based on industry with physical space constraints
  const getSolarGuidance = () => {
    // Industry-specific maximum based on physical space
    const INDUSTRY_SOLAR_CAPS: Record<string, number> = {
      "car-wash": 100, // Limited bay roof space
      car_wash: 100, // Alternate slug format
      "gas-station": 120, // Canopy space
      gas_station: 120,
      retail: 150, // Limited roof area
      office: 250, // Medium roof space
      warehouse: 400, // Large flat roofs
      manufacturing: 600, // Industrial roofs
      hotel: 200, // Multi-story with rooftop
      hospital: 300, // Hospital roof space
      "data-center": 200, // Data center roof
      data_center: 200,
    };

    const physicalCap = industry
      ? INDUSTRY_SOLAR_CAPS[industry] || peakLoadKW * 1.0
      : peakLoadKW * 1.0;

    const minSize = Math.round(Math.min(peakLoadKW * 0.5, physicalCap * 0.5));
    const recommended = Math.round(Math.min(peakLoadKW * 0.8, physicalCap * 0.85)); // Reduced from 1.4x
    const maxSize = Math.round(Math.min(peakLoadKW * 1.0, physicalCap));

    return {
      minSize,
      recommended,
      maxSize,
      label:
        state.solarKW < minSize
          ? "Undersized"
          : state.solarKW > maxSize
            ? "Oversized"
            : Math.abs(state.solarKW - recommended) < recommended * 0.2
              ? "Optimal"
              : "Good",
    };
  };

  const solarGuidance = getSolarGuidance();

  // Smart defaults based on facility peak load - SET TO RECOMMENDED VALUES
  useEffect(() => {
    const updates: Record<string, unknown> = {};

    // Solar: Set to recommended value from guidance (respects physical constraints)
    if (showSolar && state.solarKW === 0) {
      updates.solarKW = solarGuidance.recommended;

      if (import.meta.env.DEV) {
        console.log("[Step3_5V8] Solar sizing:", {
          industry,
          peakLoadKW,
          physicalCap: solarGuidance.maxSize,
          recommended: solarGuidance.recommended,
          minSize: solarGuidance.minSize,
          showSolar,
          currentSolarKW: state.solarKW,
        });
      }
    } else if (import.meta.env.DEV) {
      console.log("[Step3_5V8] Solar NOT set:", {
        showSolar,
        currentSolarKW: state.solarKW,
        wantsSolar: state.wantsSolar,
        solarFeasible: state.intel?.solarFeasible,
        solarPhysicalCapKW: state.solarPhysicalCapKW,
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Generator: Use CRITICAL LOAD for non-critical facilities (car wash, retail, office)
    // Use FULL LOAD for critical facilities (hospital, data center, cold storage)
    // ══════════════════════════════════════════════════════════════════════════
    if (wantsGenerator && state.generatorKW === 0) {
      // Determine if this is a critical facility
      const criticalFacilities = [
        "hospital",
        "healthcare",
        "data-center",
        "data_center",
        "cold-storage",
        "cold_storage",
        "manufacturing",
      ];
      const isCritical = industry ? criticalFacilities.includes(industry) : false;

      // Use critical load if available and facility is non-critical
      const targetLoadKW =
        !isCritical && criticalLoadKW && criticalLoadKW > 0 ? criticalLoadKW : peakLoadKW;

      // Apply 1.25x reserve margin per NREL/WPP Guide
      updates.generatorKW = Math.round(targetLoadKW * 1.25);

      if (import.meta.env.DEV) {
        console.log("[Step3_5V8] Generator sizing:", {
          industry,
          isCritical,
          peakLoadKW,
          criticalLoadKW,
          targetLoadKW,
          generatorKW: updates.generatorKW,
          strategy: isCritical ? "full backup" : "critical loads only",
          savingsVsFullBackup: isCritical ? 0 : Math.round((peakLoadKW - criticalLoadKW) * 1.25),
        });
      }
    }

    // EV Chargers: Default split based on facility size
    if (wantsEVCharging && state.level2Chargers === 0 && state.dcfcChargers === 0) {
      if (peakLoadKW < 500) {
        updates.level2Chargers = 4;
      } else if (peakLoadKW < 1500) {
        updates.level2Chargers = 8;
        updates.dcfcChargers = 2;
      } else {
        updates.level2Chargers = 12;
        updates.dcfcChargers = 4;
        updates.hpcChargers = 2;
      }
    }

    if (Object.keys(updates).length > 0) {
      actions.setAddonConfig(updates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showSolar,
    wantsEVCharging,
    wantsGenerator,
    peakLoadKW,
    criticalLoadKW,
    industry,
    state.solarKW,
    state.generatorKW,
    state.level2Chargers,
    state.dcfcChargers,
    solarGuidance.recommended,
  ]);

  return (
    <div className="space-y-6">
      {/* Configuration Summary Card - Floating */}
      {(showSolar || wantsGenerator || wantsEVCharging) && (
        <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900/95 to-slate-950/95 border-2 border-emerald-500/30 rounded-xl p-4 shadow-xl shadow-emerald-500/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🧙‍♂️</div>
              <div>
                <h3 className="text-sm font-bold text-emerald-400">Your Configuration</h3>
                <p className="text-[10px] text-slate-400">
                  {state.location?.city || "Location"} •{" "}
                  {state.industry?.replace(/_/g, " ") || "Industry"} • {Math.round(peakLoadKW)} kW
                  peak
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Estimated Investment</div>
              <div className="text-lg font-bold text-emerald-400">
                ${Math.round(addonCosts.total / 1000)}K
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {showSolar && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                <div className="text-xs text-amber-400 font-medium mb-0.5">☀️ Solar</div>
                <div className="text-sm font-bold text-white">{state.solarKW} kW</div>
                <div className="text-[9px] text-slate-400">
                  ~${Math.round(addonCosts.solar / 1000)}K
                </div>
              </div>
            )}
            {wantsGenerator && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
                <div className="text-xs text-orange-400 font-medium mb-0.5">🔥 Generator</div>
                <div className="text-sm font-bold text-white">{state.generatorKW} kW</div>
                <div className="text-[9px] text-slate-400">
                  ~${Math.round(addonCosts.generator / 1000)}K
                </div>
              </div>
            )}
            {wantsEVCharging && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2">
                <div className="text-xs text-cyan-400 font-medium mb-0.5">⚡ EV Charging</div>
                <div className="text-sm font-bold text-white">
                  {state.level2Chargers + state.dcfcChargers + state.hpcChargers} ports
                </div>
                <div className="text-[9px] text-slate-400">
                  ~${Math.round(addonCosts.evCharging / 1000)}K
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <p className="text-purple-400 uppercase tracking-[0.3em] text-xs font-medium mb-2">
          Step 3.5 of 5
        </p>
        <h1
          className="text-3xl md:text-4xl font-bold text-white mb-2"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Configure Your Add-ons
        </h1>
        <p className="text-slate-400 text-sm">Fine-tune solar, EV charging, and backup generator</p>
      </div>

      {/* Configuration Cards */}
      <div className="space-y-4">
        {/* Solar Configuration */}
        {showSolar && (
          <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-xl p-4 shadow-xl shadow-amber-500/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-amber-500/10 p-2 rounded-lg">
                <Sun className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Solar PV Array</h3>
                <p className="text-slate-400 text-xs">
                  {Math.round(peakLoadKW)} kW peak • Max: {Math.round(solarGuidance.maxSize)} kW
                </p>
              </div>
              <div
                className={`
                px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide
                ${
                  solarGuidance.label === "Optimal"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                    : solarGuidance.label === "Good"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                      : solarGuidance.label === "Undersized"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                        : "bg-red-500/20 text-red-400 border border-red-500/50"
                }
              `}
              >
                {solarGuidance.label}
              </div>
            </div>

            <div className="space-y-3">
              {/* Solar Capacity Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-slate-300">Solar Capacity</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        actions.setAddonConfig({
                          solarKW: Math.max(solarGuidance.minSize, state.solarKW - 50),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xl font-bold transition-all border border-amber-500/30"
                    >
                      −
                    </button>
                    <div className="text-right flex items-center gap-1.5">
                      <div>
                        <div className="text-xl font-bold text-amber-400 flex items-center gap-1.5">
                          {state.solarKW.toLocaleString()} kW
                          <svg
                            className="w-4 h-4 text-emerald-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {((state.solarKW / peakLoadKW) * 100).toFixed(0)}%
                        </div>
                        <div className="text-[10px] font-medium text-emerald-400">
                          +${Math.round(addonCosts.solar / 1000)}K
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        actions.setAddonConfig({
                          solarKW: Math.min(solarGuidance.maxSize, state.solarKW + 50),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xl font-bold transition-all border border-amber-500/30"
                    >
                      +
                    </button>
                  </div>
                </div>
                <style>
                  {`
                    .solar-slider::-webkit-slider-thumb {
                      appearance: none;
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                      cursor: pointer;
                      border: 3px solid #0f172a;
                      box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3), 0 4px 12px rgba(0,0,0,0.5);
                    }
                    .solar-slider::-moz-range-thumb {
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                      cursor: pointer;
                      border: 3px solid #0f172a;
                      box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3), 0 4px 12px rgba(0,0,0,0.5);
                    }
                    .solar-slider::-webkit-slider-runnable-track {
                      height: 8px;
                      border-radius: 4px;
                      background: linear-gradient(to right, 
                        #1e293b 0%, 
                        rgba(251, 191, 36, 0.3) ${((state.solarKW - solarGuidance.minSize) / (solarGuidance.maxSize - solarGuidance.minSize)) * 100}%, 
                        #1e293b ${((state.solarKW - solarGuidance.minSize) / (solarGuidance.maxSize - solarGuidance.minSize)) * 100}%
                      );
                    }
                  `}
                </style>
                <input
                  type="range"
                  min={solarGuidance.minSize}
                  max={solarGuidance.maxSize}
                  step={5}
                  value={state.solarKW}
                  onChange={(e) => actions.setAddonConfig({ solarKW: Number(e.target.value) })}
                  className="solar-slider w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5">
                  <span>{solarGuidance.minSize} kW</span>
                  <button
                    onClick={() => actions.setAddonConfig({ solarKW: solarGuidance.recommended })}
                    className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-medium"
                  >
                    ⭐ {solarGuidance.recommended} kW
                  </button>
                  <span>{solarGuidance.maxSize} kW</span>
                </div>
              </div>
              {/* Solar Confirm Button */}
              <div className="flex justify-center mt-3">
                <button
                  onClick={() => setSolarConfirmed(true)}
                  disabled={solarConfirmed}
                  className={`
                    px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200
                    flex items-center gap-1.5
                    ${
                      solarConfirmed
                        ? "bg-emerald-500/30 border-2 border-emerald-500 text-emerald-300 cursor-default scale-95"
                        : "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30 hover:scale-105 active:scale-95"
                    }
                    shadow-lg
                  `}
                >
                  {solarConfirmed ? (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Solar Confirmed
                    </>
                  ) : (
                    "Confirm Solar Capacity"
                  )}
                </button>
              </div>
              {/* Sizing Info */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <div className="flex gap-2 text-xs">
                  <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-slate-300 leading-snug">
                    <strong className="text-amber-400">
                      🧙‍♂️ Merlin: {solarGuidance.recommended.toLocaleString()} kW recommended
                    </strong>
                    <span className="text-slate-400">
                      {" "}
                      based on {Math.round(solarGuidance.maxSize)} kW roof space and{" "}
                      {Math.round(peakLoadKW)} kW peak load.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EV Charging Configuration */}
        {wantsEVCharging && (
          <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-2 border-cyan-500/40 rounded-xl p-4 shadow-xl shadow-cyan-500/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-cyan-500/10 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">EV Charging</h3>
                <p className="text-slate-400 text-xs">Employee & customer charging</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Merlin's EV Charging Recommendation - At the top for visibility */}
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                <div className="flex gap-2 text-xs">
                  <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="text-slate-300 leading-snug">
                    <strong className="text-cyan-400">
                      🧙‍♂️ Merlin: {state.level2Chargers} L2 chargers recommended
                    </strong>
                    <span className="text-slate-400"> for employee daily charging.</span>
                  </div>
                </div>
              </div>
              {/* Level 2 Chargers */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Level 2 (7-22 kW)</label>
                  <span className="text-base font-bold text-cyan-400">{state.level2Chargers}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={state.level2Chargers}
                  onChange={(e) =>
                    actions.setAddonConfig({ level2Chargers: Number(e.target.value) })
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
              {/* DCFC Chargers */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">DC Fast (50-150 kW)</label>
                  <span className="text-base font-bold text-purple-400">{state.dcfcChargers}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={state.dcfcChargers}
                  onChange={(e) => actions.setAddonConfig({ dcfcChargers: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              {/* HPC Chargers */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    High Power (250-350 kW)
                  </label>
                  <span className="text-base font-bold text-fuchsia-400">{state.hpcChargers}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={state.hpcChargers}
                  onChange={(e) => actions.setAddonConfig({ hpcChargers: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
              </div>
              {/* Total Power Summary */}
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-cyan-300">Total Capacity:</span>
                  <span className="text-base font-bold text-cyan-400">
                    {(
                      state.level2Chargers * 11 +
                      state.dcfcChargers * 150 +
                      state.hpcChargers * 350
                    ).toLocaleString()}{" "}
                    kW
                  </span>
                </div>
              </div>
              {/* Confirmation Button */}
              <button
                onClick={() => setEvConfirmed(true)}
                disabled={evConfirmed}
                className={`
                  w-full px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider
                  flex items-center justify-center gap-1.5
                  ${
                    evConfirmed
                      ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 scale-95 cursor-default"
                      : "bg-transparent border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 hover:scale-105 active:scale-95"
                  }
                  transition-all duration-200
                `}
              >
                {evConfirmed ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    EV Charging Confirmed
                  </>
                ) : (
                  "Confirm EV Charging"
                )}
              </button>{" "}
            </div>
          </div>
        )}

        {/* Generator Configuration */}
        {wantsGenerator && (
          <div className="bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border-2 border-red-500/40 rounded-xl p-4 shadow-xl shadow-red-500/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-orange-500/10 p-2 rounded-lg">
                <Fuel className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Backup Generator</h3>
                <p className="text-slate-400 text-xs">Critical load protection</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Generator Capacity Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-slate-300">Generator Capacity</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        actions.setAddonConfig({
                          generatorKW: Math.max(
                            Math.round(peakLoadKW * 0.5),
                            state.generatorKW - 50
                          ),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xl font-bold transition-all border border-orange-500/30"
                    >
                      −
                    </button>
                    <span className="text-xl font-bold text-orange-400 flex items-center gap-1.5">
                      {state.generatorKW.toLocaleString()} kW
                      <svg
                        className="w-4 h-4 text-emerald-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <div className="text-[10px] font-medium text-emerald-400 text-right mr-2">
                      +${Math.round(addonCosts.generator / 1000)}K
                    </div>
                    <button
                      onClick={() =>
                        actions.setAddonConfig({
                          generatorKW: Math.min(Math.round(peakLoadKW * 2), state.generatorKW + 50),
                        })
                      }
                      className="w-10 h-10 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-2xl font-bold transition-all border border-orange-500/30"
                    >
                      +
                    </button>
                  </div>
                </div>
                <style>
                  {`
                    .generator-slider::-webkit-slider-thumb {
                      appearance: none;
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
                      cursor: pointer;
                      border: 3px solid #0f172a;
                      box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3), 0 4px 12px rgba(0,0,0,0.5);
                    }
                    .generator-slider::-moz-range-thumb {
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
                      cursor: pointer;
                      border: 3px solid #0f172a;
                      box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3), 0 4px 12px rgba(0,0,0,0.5);
                    }
                    .generator-slider::-webkit-slider-runnable-track {
                      height: 8px;
                      border-radius: 4px;
                      background: linear-gradient(to right, 
                        #1e293b 0%, 
                        rgba(249, 115, 22, 0.3) ${((state.generatorKW - Math.round(peakLoadKW * 0.5)) / (Math.round(peakLoadKW * 2) - Math.round(peakLoadKW * 0.5))) * 100}%, 
                        #1e293b ${((state.generatorKW - Math.round(peakLoadKW * 0.5)) / (Math.round(peakLoadKW * 2) - Math.round(peakLoadKW * 0.5))) * 100}%
                      );
                    }
                  `}
                </style>
                <input
                  type="range"
                  min={Math.round(peakLoadKW * 0.5)}
                  max={Math.round(peakLoadKW * 2)}
                  step={10}
                  value={state.generatorKW}
                  onChange={(e) => actions.setAddonConfig({ generatorKW: Number(e.target.value) })}
                  className="generator-slider w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{Math.round(peakLoadKW * 0.5)} kW (50% of peak)</span>
                  <span>{Math.round(peakLoadKW * 2)} kW (2x peak)</span>
                </div>
              </div>

              {/* Fuel Type Selector */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">Fuel Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["diesel", "natural-gas", "dual-fuel"] as const).map((fuelType) => {
                    const isSelected = state.generatorFuelType === fuelType;
                    return (
                      <button
                        key={fuelType}
                        type="button"
                        onClick={() => {
                          console.log("🔥 Fuel type clicked:", fuelType);
                          actions.setAddonConfig({ generatorFuelType: fuelType });
                        }}
                        className={`
                          relative py-4 px-4 rounded-xl font-semibold text-sm transition-all duration-200
                          ${
                            isSelected
                              ? "bg-orange-500/30 border-2 border-orange-500 text-orange-200 shadow-lg shadow-orange-500/20 scale-105"
                              : "bg-white/5 border-2 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-white/10"
                          }
                        `}
                      >
                        {/* Selection Checkmark */}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-lg">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        )}

                        <div className={`transition-transform ${isSelected ? "scale-105" : ""}`}>
                          {fuelType === "diesel" && "⛽ Diesel"}
                          {fuelType === "natural-gas" && "🔥 Natural Gas"}
                          {fuelType === "dual-fuel" && "⚡ Dual Fuel"}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {state.generatorFuelType === "diesel" &&
                    "Traditional backup power • High reliability"}
                  {state.generatorFuelType === "natural-gas" &&
                    "Cleaner emissions • Lower operating cost"}
                  {state.generatorFuelType === "dual-fuel" &&
                    "Maximum flexibility • Best resilience"}
                </p>
              </div>

              {/* Generator Confirm Button */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setGeneratorConfirmed(true)}
                  disabled={generatorConfirmed}
                  className={`
                    px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200
                    flex items-center gap-2
                    ${
                      generatorConfirmed
                        ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 cursor-default scale-95"
                        : "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30 hover:scale-105 active:scale-95"
                    }
                    shadow-lg
                  `}
                >
                  {generatorConfirmed ? (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Generator Confirmed
                    </>
                  ) : (
                    "Confirm Generator Setup"
                  )}
                </button>
              </div>

              {/* Sizing Info - Explains critical load vs full load strategy */}
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                <div className="flex gap-2 text-sm">
                  <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="text-slate-300 leading-relaxed">
                    {criticalLoadKW && criticalLoadKW < peakLoadKW ? (
                      <>
                        <div className="mb-2">
                          <strong className="text-orange-400">
                            🧙‍♂️ Merlin suggests {Math.round(criticalLoadKW * 1.25).toLocaleString()}{" "}
                            kW for power generation
                          </strong>
                          <span className="text-slate-400">
                            {" "}
                            to cover your {criticalLoadKW.toLocaleString()} kW critical loads with
                            reserve margin.
                          </span>
                        </div>
                        <strong className="text-orange-400">Critical Loads Sizing:</strong> This
                        facility can operate without full backup power during outages. Generator
                        sized for{" "}
                        <strong className="text-orange-300">
                          {criticalLoadKW.toLocaleString()} kW critical loads
                        </strong>{" "}
                        (payment systems, security, emergency lighting, office equipment) vs{" "}
                        {peakLoadKW.toLocaleString()} kW full facility load. This saves ~$
                        {Math.round((peakLoadKW - criticalLoadKW) * 0.7).toLocaleString()}K on
                        generator costs.
                      </>
                    ) : (
                      <>
                        <div className="mb-2">
                          <strong className="text-orange-400">
                            🧙‍♂️ Merlin suggests {Math.round(peakLoadKW * 1.25).toLocaleString()} kW
                            for power generation
                          </strong>
                          <span className="text-slate-400">
                            {" "}
                            to cover your {peakLoadKW.toLocaleString()} kW peak load with 1.25x
                            reserve margin.
                          </span>
                        </div>
                        <strong className="text-orange-400">Full Backup Sizing:</strong> Generator
                        sized with 1.25x reserve margin per NREL/WPP guidelines. This facility
                        requires full backup power for critical operations (life-safety, data
                        integrity, or process continuity).
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={() => actions.goBack()}
          disabled={isGeneratingTiers}
          className="px-6 py-3 bg-white/5 text-slate-300 rounded-xl hover:bg-white/10 transition-all border border-white/10 disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={() => {
            setIsGeneratingTiers(true);
            // ⚡ CRITICAL FIX: Reset tiers status to 'idle' to force rebuild with addon values
            // Tiers were built in background after Step 3, but addon values are set in Step 3.5
            // We need to rebuild tiers with the configured solar/generator/EV values
            console.log("[Step3_5V8] Resetting tiers status to force rebuild with addon values");
            actions.setTiersStatus("idle");
            // Small delay to show loading state before navigating
            setTimeout(() => actions.goToStep(5), 100);
          }}
          disabled={isGeneratingTiers}
          className={`
            px-6 py-3 rounded-xl font-semibold transition-all shadow-lg
            ${
              isGeneratingTiers
                ? "bg-emerald-500/50 text-emerald-200 cursor-wait border-2 border-emerald-400"
                : "bg-transparent border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 shadow-emerald-500/20"
            }
          `}
        >
          {isGeneratingTiers ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating Your Tiers...
            </span>
          ) : (
            "Continue to MagicFit →"
          )}
        </button>
      </div>
    </div>
  );
}
