/**
 * WindTurbineConfig - Wind turbine system configuration
 * Turbine specs, hub height, terrain, wind class
 * Part of Renewables section
 */

import React from "react";

interface WindTurbineConfigProps {
  // State
  windTurbineIncluded: boolean;
  setWindTurbineIncluded: (value: boolean) => void;
  windCapacityKW: number;
  setWindCapacityKW: (value: number) => void;
  windTurbineType: string;
  setWindTurbineType: (value: string) => void;
  windTurbineCount: number;
  setWindTurbineCount: (value: number) => void;
  windHubHeight: number;
  setWindHubHeight: (value: number) => void;
  windTerrain: "open" | "suburban" | "coastal" | "complex";
  setWindTerrain: (value: "open" | "suburban" | "coastal" | "complex") => void;
  windClassRating: 1 | 2 | 3 | 4;
  setWindClassRating: (value: 1 | 2 | 3 | 4) => void;
}

export const WindTurbineConfig = React.memo(function WindTurbineConfig({
  windTurbineIncluded,
  setWindTurbineIncluded,
  windCapacityKW,
  setWindCapacityKW,
  windTurbineType,
  setWindTurbineType,
  windTurbineCount,
  setWindTurbineCount,
  windHubHeight,
  setWindHubHeight,
  windTerrain,
  setWindTerrain,
  windClassRating,
  setWindClassRating,
}: WindTurbineConfigProps) {
  // Calculate wind production estimate
  const terrainFactor =
    windTerrain === "open"
      ? 1.0
      : windTerrain === "coastal"
        ? 1.05
        : windTerrain === "suburban"
          ? 0.7
          : 0.85;
  const classFactor =
    windClassRating === 1 ? 0.35 : windClassRating === 2 ? 0.3 : windClassRating === 3 ? 0.25 : 0.2;
  const heightFactor =
    windHubHeight >= 100 ? 1.1 : windHubHeight >= 80 ? 1.0 : windHubHeight >= 50 ? 0.9 : 0.75;
  const effectiveCF = classFactor * terrainFactor * heightFactor;
  const annualWindKWh = Math.round(windCapacityKW * 8760 * effectiveCF);

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "rgba(34,211,238,0.05)",
        border: "1px solid rgba(34,211,238,0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold flex items-center gap-2 text-white">
          💨 Wind Turbine System
        </h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={windTurbineIncluded}
            onChange={(e) => setWindTurbineIncluded(e.target.checked)}
            className="w-5 h-5 rounded border-white/20 text-cyan-500 focus:ring-cyan-500/40 bg-transparent"
          />
          <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            Include Wind
          </span>
        </label>
      </div>

      {windTurbineIncluded && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Total Wind Capacity (kW)
              </label>
              <input
                type="number"
                value={windCapacityKW}
                onChange={(e) => setWindCapacityKW(parseFloat(e.target.value) || 0)}
                step="50"
                min="0"
                className="w-full px-4 py-3 rounded-lg text-white font-semibold focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
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
                Turbine Type
              </label>
              <select
                value={windTurbineType}
                onChange={(e) => setWindTurbineType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-white font-semibold focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <option value="horizontal">Horizontal Axis (HAWT) — Utility scale</option>
                <option value="vertical">Vertical Axis (VAWT) — Urban / rooftop</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Number of Turbines
              </label>
              <input
                type="number"
                value={windTurbineCount}
                onChange={(e) => setWindTurbineCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="50"
                className="w-full px-4 py-3 rounded-lg text-white font-semibold focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                {Math.round(windCapacityKW / Math.max(1, windTurbineCount))} kW per turbine
              </p>
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Hub Height (m)
              </label>
              <select
                value={windHubHeight}
                onChange={(e) => setWindHubHeight(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-lg text-white font-semibold focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <option value="30">30m — Small / distributed</option>
                <option value="50">50m — Community scale</option>
                <option value="80">80m — Standard commercial</option>
                <option value="100">100m — Large commercial</option>
                <option value="120">120m — Utility scale</option>
              </select>
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Site Terrain
              </label>
              <select
                value={windTerrain}
                onChange={(e) =>
                  setWindTerrain(e.target.value as "open" | "suburban" | "coastal" | "complex")
                }
                className="w-full px-4 py-3 rounded-lg text-white font-semibold focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <option value="open">Open Terrain (best)</option>
                <option value="coastal">Coastal (strong, consistent)</option>
                <option value="suburban">Suburban (reduced)</option>
                <option value="complex">Complex Terrain (ridges, valleys)</option>
              </select>
            </div>
          </div>

          {/* Wind Class */}
          <div>
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              IEC Wind Class
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { value: 1, label: "Class I", desc: "10+ m/s", color: "rgba(34,211,238,0.3)" },
                  {
                    value: 2,
                    label: "Class II",
                    desc: "8.5-10 m/s",
                    color: "rgba(34,211,238,0.22)",
                  },
                  {
                    value: 3,
                    label: "Class III",
                    desc: "7.5-8.5 m/s",
                    color: "rgba(34,211,238,0.15)",
                  },
                  { value: 4, label: "Class IV", desc: "<7.5 m/s", color: "rgba(34,211,238,0.08)" },
                ] as const
              ).map((cls) => (
                <button
                  key={cls.value}
                  onClick={() => setWindClassRating(cls.value)}
                  className="p-3 rounded-lg text-center transition-all"
                  style={{
                    background:
                      windClassRating === cls.value ? cls.color : "rgba(255,255,255,0.04)",
                    border:
                      windClassRating === cls.value
                        ? "1px solid rgba(34,211,238,0.4)"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span className="text-sm font-bold text-white">{cls.label}</span>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {cls.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Wind Production Estimate */}
          <div
            className="rounded p-4"
            style={{
              background: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.15)",
            }}
          >
            <p className="text-sm text-cyan-300 font-bold">
              💨 Estimated Annual Production:{" "}
              <strong className="text-cyan-200">{annualWindKWh.toLocaleString()} kWh/year</strong> (
              {(effectiveCF * 100).toFixed(0)}% capacity factor)
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              {windTurbineCount} × {Math.round(windCapacityKW / Math.max(1, windTurbineCount))} kW
              turbines | {windHubHeight}m hub height | {windTerrain} terrain
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              BESS should store {Math.round(windCapacityKW * 0.4)} kW for wind variability smoothing
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
