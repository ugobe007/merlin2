/**
 * SolarPVConfig - Solar PV System configuration
 * Installation types, panel specs, tracking, space calculator
 * Part of Renewables section
 */

import React from "react";
import { calculateSolarSizing } from "@/services/useCasePowerCalculations";

interface SolarPVConfigProps {
  // State
  solarPVIncluded: boolean;
  setSolarPVIncluded: (value: boolean) => void;
  solarCapacityKW: number;
  setSolarCapacityKW: (value: number) => void;
  solarInstallType: "rooftop" | "canopy" | "ground-mount" | "mixed";
  setSolarInstallType: (value: "rooftop" | "canopy" | "ground-mount" | "mixed") => void;
  solarRoofSpaceSqFt: number;
  setSolarRoofSpaceSqFt: (value: number) => void;
  solarCanopySqFt: number;
  setSolarCanopySqFt: (value: number) => void;
  solarGroundAcres: number;
  setSolarGroundAcres: (value: number) => void;
  solarPeakSunHours: number;
  setSolarPeakSunHours: (value: number) => void;
  solarPanelType: string;
  setSolarPanelType: (value: string) => void;
  solarPanelEfficiency: number;
  setSolarPanelEfficiency: (value: number) => void;
  solarInverterType: string;
  setSolarInverterType: (value: string) => void;
  solarTrackingType: "fixed" | "single-axis" | "dual-axis";
  setSolarTrackingType: (value: "fixed" | "single-axis" | "dual-axis") => void;
}

export const SolarPVConfig = React.memo(function SolarPVConfig({
  solarPVIncluded,
  setSolarPVIncluded,
  solarCapacityKW,
  setSolarCapacityKW,
  solarInstallType,
  setSolarInstallType,
  solarRoofSpaceSqFt,
  setSolarRoofSpaceSqFt,
  solarCanopySqFt,
  setSolarCanopySqFt,
  solarGroundAcres,
  setSolarGroundAcres,
  solarPeakSunHours,
  setSolarPeakSunHours,
  solarPanelType,
  setSolarPanelType,
  solarPanelEfficiency,
  setSolarPanelEfficiency,
  solarInverterType,
  setSolarInverterType,
  solarTrackingType,
  setSolarTrackingType,
}: SolarPVConfigProps) {
  // Calculate solar sizing and space constraints
  const solarSizing = calculateSolarSizing({
    solarCapacityKW,
    panelType: solarPanelType,
    panelEfficiency: solarPanelEfficiency,
    region: "midwest",
  });

  const panelAreaSqFt = 21.5; // 400W panel footprint
  const panelWattage = 400;
  const availableSqFt =
    solarInstallType === "rooftop"
      ? solarRoofSpaceSqFt
      : solarInstallType === "canopy"
        ? solarCanopySqFt
        : solarInstallType === "ground-mount"
          ? solarGroundAcres * 43560
          : solarRoofSpaceSqFt + solarCanopySqFt + solarGroundAcres * 43560;

  const maxPanelsFromSpace = Math.floor(availableSqFt / panelAreaSqFt);
  const maxSolarKWFromSpace = Math.round((maxPanelsFromSpace * panelWattage) / 1000);

  const trackingBoost =
    solarTrackingType === "single-axis" ? 1.25 : solarTrackingType === "dual-axis" ? 1.35 : 1.0;
  const adjustedAnnualKWh = Math.round(solarSizing.annualKWh * trackingBoost);

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "rgba(16,185,129,0.05)",
        border: "1px solid rgba(16,185,129,0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-base font-semibold flex items-center gap-2 text-white">
          ☀️ Solar PV System
        </h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={solarPVIncluded}
            onChange={(e) => setSolarPVIncluded(e.target.checked)}
            className="w-5 h-5 rounded border-2 border-white/20 text-emerald-500 focus:ring-emerald-500/40 bg-transparent"
          />
          <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            Include Solar
          </span>
        </label>
      </div>

      {solarPVIncluded && (
        <div className="space-y-5">
          {/* Installation Type */}
          <div>
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Installation Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(
                [
                  { value: "rooftop", label: "🏢 Rooftop", desc: "Building roof" },
                  { value: "canopy", label: "🅿️ Parking Canopy", desc: "Covered parking" },
                  { value: "ground-mount", label: "🌾 Ground Mount", desc: "Open land" },
                  { value: "mixed", label: "🔀 Mixed", desc: "Multiple locations" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSolarInstallType(opt.value)}
                  className="p-3 rounded-lg text-left transition-all"
                  style={{
                    background:
                      solarInstallType === opt.value
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(255,255,255,0.04)",
                    border:
                      solarInstallType === opt.value
                        ? "1px solid rgba(16,185,129,0.4)"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span className="text-sm font-semibold text-white">{opt.label}</span>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Available Space - conditional on install type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(solarInstallType === "rooftop" || solarInstallType === "mixed") && (
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Available Roof Space (sq ft)
                </label>
                <input
                  type="number"
                  value={solarRoofSpaceSqFt}
                  onChange={(e) => setSolarRoofSpaceSqFt(parseFloat(e.target.value) || 0)}
                  step="500"
                  min="0"
                  className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            )}
            {(solarInstallType === "canopy" || solarInstallType === "mixed") && (
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Parking Canopy Area (sq ft)
                </label>
                <input
                  type="number"
                  value={solarCanopySqFt}
                  onChange={(e) => setSolarCanopySqFt(parseFloat(e.target.value) || 0)}
                  step="500"
                  min="0"
                  className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            )}
            {(solarInstallType === "ground-mount" || solarInstallType === "mixed") && (
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Available Land (acres)
                </label>
                <input
                  type="number"
                  value={solarGroundAcres}
                  onChange={(e) => setSolarGroundAcres(parseFloat(e.target.value) || 0)}
                  step="0.5"
                  min="0"
                  className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            )}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Peak Sun Hours (daily avg)
              </label>
              <input
                type="number"
                value={solarPeakSunHours}
                onChange={(e) => setSolarPeakSunHours(parseFloat(e.target.value) || 4)}
                step="0.5"
                min="2"
                max="8"
                className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                Southwest: 6-7h | Midwest: 4-5h | Northeast: 3-4h
              </p>
            </div>
          </div>

          {/* Solar Sizing Tool - recommendation banner */}
          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-300">🔧 Solar Sizing Tool</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Your available space supports up to{" "}
                  <strong className="text-emerald-200">
                    {maxSolarKWFromSpace.toLocaleString()} kW
                  </strong>{" "}
                  ({maxPanelsFromSpace.toLocaleString()} panels)
                </p>
              </div>
              {solarCapacityKW !== maxSolarKWFromSpace && maxSolarKWFromSpace > 0 && (
                <button
                  onClick={() => setSolarCapacityKW(maxSolarKWFromSpace)}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(16,185,129,0.35)",
                    color: "#34d399",
                  }}
                >
                  Use Max
                </button>
              )}
            </div>
            {solarCapacityKW > maxSolarKWFromSpace && maxSolarKWFromSpace > 0 && (
              <p className="text-xs mt-2 text-red-400">
                ⚠️ Selected capacity ({solarCapacityKW} kW) exceeds available space (
                {maxSolarKWFromSpace} kW)
              </p>
            )}
          </div>

          {/* Core Solar Config */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Solar Capacity (kW)
              </label>
              <input
                type="number"
                value={solarCapacityKW}
                onChange={(e) => setSolarCapacityKW(parseFloat(e.target.value) || 0)}
                step="50"
                min="0"
                className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Panel Type
              </label>
              <select
                value={solarPanelType}
                onChange={(e) => setSolarPanelType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <option value="monocrystalline">Monocrystalline (20-22%)</option>
                <option value="polycrystalline">Polycrystalline (15-17%)</option>
                <option value="thin-film">Thin-Film (10-12%)</option>
                <option value="bifacial">Bifacial (22-24%)</option>
                <option value="perc">PERC (21-23%)</option>
              </select>
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Panel Efficiency (%)
              </label>
              <input
                type="number"
                value={solarPanelEfficiency}
                onChange={(e) => setSolarPanelEfficiency(parseFloat(e.target.value) || 15)}
                min="10"
                max="25"
                step="0.5"
                className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>
          </div>

          {/* Inverter & Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Inverter Type
              </label>
              <select
                value={solarInverterType}
                onChange={(e) => setSolarInverterType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <option value="string">String Inverter</option>
                <option value="micro">Micro-Inverters</option>
                <option value="power-optimizer">Power Optimizers</option>
                <option value="central">Central Inverter</option>
              </select>
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Tracking System
              </label>
              <select
                value={solarTrackingType}
                onChange={(e) =>
                  setSolarTrackingType(e.target.value as "fixed" | "single-axis" | "dual-axis")
                }
                className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <option value="fixed">Fixed Tilt (lowest cost)</option>
                <option value="single-axis">Single-Axis Tracker (+25% output)</option>
                <option value="dual-axis">Dual-Axis Tracker (+35% output)</option>
              </select>
            </div>
          </div>

          {/* Production Estimate */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.15)",
            }}
          >
            <p className="text-sm text-emerald-300 font-bold mb-2">
              ☀️ Estimated Annual Production:{" "}
              <strong className="text-emerald-200">
                {adjustedAnnualKWh.toLocaleString()} kWh/year
              </strong>{" "}
              ({solarSizing.sunHours} sun-hrs/yr
              {solarTrackingType !== "fixed" ? ` + ${solarTrackingType} tracking` : ""})
            </p>
            <p className="text-sm mt-2 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Array: ~{solarSizing.arrayAreaSqFt.toLocaleString()} sq ft (~
              {solarSizing.arrayAreaAcres} acres) | ~{solarSizing.panelsNeeded} panels @{" "}
              {solarSizing.panelWattage}W
            </p>
            <p className="text-sm mt-1 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              ILR: {solarSizing.ilr} (DC-coupled, NREL ATB 2024) | BESS should store{" "}
              {Math.round(solarCapacityKW * 0.3)} kW for solar smoothing
            </p>
            <p className="text-xs mt-2 italic" style={{ color: "rgba(255,255,255,0.35)" }}>
              {solarSizing.citation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
