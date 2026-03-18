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
  const [isGeneratingTiers, setIsGeneratingTiers] = React.useState(false);

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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-purple-400 uppercase tracking-[0.3em] text-sm font-medium mb-3">
          Step 3.5 of 5
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold text-white mb-3"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Configure Your Add-ons
        </h1>
        <p className="text-slate-400 text-lg">
          Fine-tune your solar, EV charging, and backup generator
        </p>
      </div>

      {/* Configuration Cards */}
      <div className="space-y-6">
        {/* Solar Configuration */}
        {showSolar && (
          <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-6 shadow-xl shadow-amber-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-500/10 p-3 rounded-xl">
                <Sun className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">Solar PV Array</h3>
                <p className="text-slate-400 text-sm">
                  Industry: {industry || "Commercial"} • Peak Load: {Math.round(peakLoadKW)} kW
                </p>
                <p className="text-amber-400/70 text-xs mt-0.5">
                  Typical roof space: {Math.round(solarGuidance.maxSize)} kW capacity • Recommended:{" "}
                  {Math.round(solarGuidance.recommended)} kW
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

            <div className="space-y-4">
              {/* Solar Capacity Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-300">Solar Capacity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        actions.setAddonConfig({
                          solarKW: Math.max(solarGuidance.minSize, state.solarKW - 50),
                        })
                      }
                      className="w-10 h-10 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-2xl font-bold transition-all border border-amber-500/30"
                    >
                      −
                    </button>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                          {state.solarKW.toLocaleString()} kW
                          <svg
                            className="w-5 h-5 text-emerald-400"
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
                        <div className="text-xs text-slate-500">
                          {((state.solarKW / peakLoadKW) * 100).toFixed(0)}% of peak load
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        actions.setAddonConfig({
                          solarKW: Math.min(solarGuidance.maxSize, state.solarKW + 50),
                        })
                      }
                      className="w-10 h-10 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-2xl font-bold transition-all border border-amber-500/30"
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
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                  <span>
                    {solarGuidance.minSize} kW
                    <br />
                    <span className="text-slate-600">Min (80%)</span>
                  </span>
                  <button
                    onClick={() => actions.setAddonConfig({ solarKW: solarGuidance.recommended })}
                    className="px-3 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 font-medium"
                  >
                    ⭐ {solarGuidance.recommended} kW (Recommended)
                  </button>
                  <span className="text-right">
                    {solarGuidance.maxSize} kW
                    <br />
                    <span className="text-slate-600">Max (2.5x)</span>
                  </span>
                </div>
              </div>
              {/* Solar Confirm Button */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setSolarConfirmed(true)}
                  disabled={solarConfirmed}
                  className={`
                    px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200
                    flex items-center gap-2
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
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <div className="flex gap-2 text-sm">
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-slate-300 leading-relaxed">
                    <strong className="text-amber-400">Sizing Guidance:</strong> Based on NREL ATB
                    2024, commercial facilities typically install 1.4x their peak load (ILR). This
                    accounts for solar production curves, panel degradation, and energy storage
                    coupling.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EV Charging Configuration - Simple Yes/No */}
        {wantsEVCharging && (
          <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-2 border-cyan-500/40 rounded-2xl p-6 shadow-xl shadow-cyan-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/10 p-3 rounded-xl">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Add EV Charging?</h3>
                  <p className="text-slate-400 text-sm">Employee and customer charging stations</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => actions.setAddonPreference("ev", true)}
                  className={`
                    px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200
                    ${
                      state.wantsEVCharging
                        ? "bg-emerald-500/30 border-2 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20"
                        : "bg-slate-800/50 border-2 border-slate-700 text-slate-400 hover:border-emerald-500/50"
                    }
                  `}
                >
                  Yes
                </button>
                <button
                  onClick={() => actions.setAddonPreference("ev", false)}
                  className={`
                    px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200
                    ${
                      !state.wantsEVCharging
                        ? "bg-red-500/30 border-2 border-red-500 text-red-300 shadow-lg shadow-red-500/20"
                        : "bg-slate-800/50 border-2 border-slate-700 text-slate-400 hover:border-red-500/50"
                    }
                  `}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generator Configuration */}
        {wantsGenerator && (
          <div className="bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border-2 border-red-500/40 rounded-2xl p-6 shadow-xl shadow-red-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-500/10 p-3 rounded-xl">
                <Fuel className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Backup Generator</h3>
                <p className="text-slate-400 text-sm">Critical load protection</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Generator Capacity Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-300">Generator Capacity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        actions.setAddonConfig({
                          generatorKW: Math.max(
                            Math.round(peakLoadKW * 0.5),
                            state.generatorKW - 50
                          ),
                        })
                      }
                      className="w-10 h-10 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-2xl font-bold transition-all border border-orange-500/30"
                    >
                      −
                    </button>
                    <span className="text-2xl font-bold text-orange-400 flex items-center gap-2">
                      {state.generatorKW.toLocaleString()} kW
                      <svg
                        className="w-5 h-5 text-emerald-400"
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
