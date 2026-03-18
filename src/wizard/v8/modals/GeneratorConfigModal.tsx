/**
 * WIZARD V8 — GENERATOR CONFIGURATION MODAL
 * ============================================================================
 * Allows user to configure backup generator capacity and fuel type.
 *
 * SSOT Sources:
 * - criticalLoadKW: getCriticalLoadWithSource() → benchmarkSources.ts (IEEE 446)
 * - reserveMargin: getGeneratorReserveMarginWithSource() → benchmarkSources.ts (NEC/LADWP)
 * - Generator costs: unifiedQuoteCalculator.ts
 * ============================================================================
 */

import React, { useState } from "react";
import { X, Fuel, Info, Shield } from "lucide-react";
import type { WizardState } from "../wizardState";

interface Props {
  state: WizardState;
  onSave: (generatorKW: number, fuelType: "diesel" | "natural-gas" | "dual-fuel") => void;
  onClose: () => void;
}

type FuelType = "natural-gas" | "diesel" | "dual-fuel";

interface FuelOption {
  id: FuelType;
  name: string;
  description: string;
  costPerKWh: number;
  pros: string[];
  cons: string[];
}

const FUEL_OPTIONS: FuelOption[] = [
  {
    id: "natural-gas",
    name: "Natural Gas",
    description: "Clean, cost-effective, requires utility connection",
    costPerKWh: 0.08,
    pros: ["Lowest fuel cost", "Cleanest emissions", "No on-site storage"],
    cons: ["Requires gas utility", "Grid-dependent fuel supply"],
  },
  {
    id: "diesel",
    name: "Diesel",
    description: "Independent, reliable, higher fuel costs",
    costPerKWh: 0.18,
    pros: ["Complete independence", "High energy density", "Proven reliability"],
    cons: ["Higher fuel cost", "On-site storage required", "More emissions"],
  },
  {
    id: "dual-fuel",
    name: "Dual-Fuel",
    description: "Maximum flexibility with gas + diesel backup",
    costPerKWh: 0.1,
    pros: ["Best of both worlds", "Automatic fuel switching", "Maximum redundancy"],
    cons: ["Higher upfront cost", "More complex maintenance"],
  },
];

const T = {
  accent: "#3ECF8E",
  accentSoft: "rgba(62,207,142,0.10)",
  textPrimary: "rgba(232,235,243,0.98)",
  textSecondary: "rgba(232,235,243,0.64)",
  panel: "rgba(255,255,255,0.03)",
  panelBorder: "rgba(255,255,255,0.08)",
  warning: "#f59e0b",
};

export default function GeneratorConfigModal({ state, onSave, onClose }: Props) {
  const { criticalLoadKW, peakLoadKW, criticalLoadPct } = state;

  // SSOT: Reserve margin from benchmarkSources (NEC/LADWP: 1.25x)
  const reserveMargin = 1.25;
  const optimalKW = Math.round((criticalLoadKW * reserveMargin) / 25) * 25; // Round to 25kW increments

  const minKW = Math.round((criticalLoadKW * 1.0) / 25) * 25;
  const maxKW = Math.round((peakLoadKW * 1.25) / 25) * 25;

  const [selectedKW, setSelectedKW] = useState(
    state.generatorKW > 0 ? state.generatorKW : optimalKW
  );
  const [selectedFuel, setSelectedFuel] = useState<FuelType>(
    state.generatorFuelType || "natural-gas"
  );

  // Financial calculations
  const installCostPerKW = 600; // Base cost per kW
  const fuelMultiplier =
    selectedFuel === "natural-gas" ? 1.0 : selectedFuel === "diesel" ? 1.15 : 1.3; // dual-fuel

  const installCost = selectedKW * installCostPerKW * fuelMultiplier;

  // Estimated runtime per year (based on grid reliability from Step 1)
  const runtimeHoursPerYear =
    state.gridReliability === "unreliable"
      ? 200
      : state.gridReliability === "frequent-outages"
        ? 100
        : state.gridReliability === "occasional-outages"
          ? 40
          : 20; // reliable

  const selectedFuelOption = FUEL_OPTIONS.find((f) => f.id === selectedFuel)!;
  const annualFuelCost = selectedKW * runtimeHoursPerYear * selectedFuelOption.costPerKWh;
  const annualMaintenanceCost = selectedKW * 15; // $15/kW/year for maintenance

  // Runtime estimate during outage (assume diesel tank or gas supply available)
  const runtimeDuringOutage = selectedFuel === "diesel" ? "8-12 hours" : "Continuous";

  // Urgency coloring based on critical load percentage
  const urgencyColor =
    criticalLoadPct >= 0.75
      ? "#ef4444" // High critical loads = urgent
      : criticalLoadPct >= 0.5
        ? "#f59e0b" // Moderate critical loads
        : "#10b981"; // Low critical loads

  const handleSave = () => {
    onSave(selectedKW, selectedFuel);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{
          backgroundColor: "#0D0D0D",
          border: `1px solid ${T.panelBorder}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
          style={{
            backgroundColor: "#0D0D0D",
            borderColor: T.panelBorder,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${urgencyColor}20` }}>
              <Fuel size={24} style={{ color: urgencyColor }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: T.textPrimary }}>
                Configure Backup Generator
              </h2>
              <p className="text-sm" style={{ color: T.textSecondary }}>
                Priority:{" "}
                {criticalLoadPct >= 0.75 ? "HIGH" : criticalLoadPct >= 0.5 ? "MODERATE" : "LOW"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: T.textSecondary }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Merlin's Guidance */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: `${urgencyColor}10`,
              borderColor: urgencyColor,
            }}
          >
            <div className="flex items-start gap-3">
              <Info size={20} style={{ color: urgencyColor, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="font-semibold mb-1" style={{ color: urgencyColor }}>
                  🧠 MERLIN'S GUIDANCE
                </p>
                <p className="text-sm" style={{ color: T.textPrimary }}>
                  Your critical loads represent{" "}
                  <strong>{(criticalLoadPct * 100).toFixed(0)}%</strong> of your {peakLoadKW}kW peak
                  demand (<strong>{criticalLoadKW}kW</strong>). Industry standard (NEC/LADWP)
                  recommends 25% reserve margin for generator sizing. We recommend{" "}
                  <strong>{optimalKW}kW</strong> capacity.
                </p>
              </div>
            </div>
          </div>

          {/* Fuel Type Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block" style={{ color: T.textPrimary }}>
              FUEL TYPE
            </label>
            <div className="space-y-3">
              {FUEL_OPTIONS.map((fuel) => (
                <button
                  key={fuel.id}
                  onClick={() => setSelectedFuel(fuel.id)}
                  className="w-full p-4 rounded-lg border text-left transition-all"
                  style={{
                    backgroundColor: selectedFuel === fuel.id ? T.accentSoft : T.panel,
                    borderColor: selectedFuel === fuel.id ? T.accent : T.panelBorder,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor: selectedFuel === fuel.id ? T.accent : T.panelBorder,
                          }}
                        >
                          {selectedFuel === fuel.id && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: T.accent }}
                            />
                          )}
                        </div>
                        <div className="font-semibold" style={{ color: T.textPrimary }}>
                          {fuel.name}
                        </div>
                        <div
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: T.accentSoft,
                            color: T.accent,
                          }}
                        >
                          ${fuel.costPerKWh}/kWh
                        </div>
                      </div>
                      <div className="text-sm mb-2" style={{ color: T.textSecondary }}>
                        {fuel.description}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="font-medium mb-1" style={{ color: "#10b981" }}>
                            Pros:
                          </div>
                          <ul className="space-y-0.5" style={{ color: T.textSecondary }}>
                            {fuel.pros.map((pro, i) => (
                              <li key={i}>• {pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-medium mb-1" style={{ color: "#ef4444" }}>
                            Cons:
                          </div>
                          <ul className="space-y-0.5" style={{ color: T.textSecondary }}>
                            {fuel.cons.map((con, i) => (
                              <li key={i}>• {con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generator Size Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium" style={{ color: T.textPrimary }}>
                GENERATOR CAPACITY (kW)
              </label>
              <span className="text-2xl font-bold" style={{ color: T.accent }}>
                {selectedKW} kW
              </span>
            </div>
            <input
              type="range"
              min={minKW}
              max={maxKW}
              step={25}
              value={selectedKW}
              onChange={(e) => setSelectedKW(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${T.accent} 0%, ${T.accent} ${((selectedKW - minKW) / (maxKW - minKW)) * 100}%, rgba(255,255,255,0.1) ${((selectedKW - minKW) / (maxKW - minKW)) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div
              className="flex items-center justify-between mt-2 text-xs"
              style={{ color: T.textSecondary }}
            >
              <span>{minKW} kW MIN</span>
              <span
                className="px-2 py-1 rounded"
                style={{ backgroundColor: T.accentSoft, color: T.accent }}
              >
                {optimalKW} kW RECOMMENDED
              </span>
              <span>{maxKW} kW MAX</span>
            </div>
          </div>

          {/* Performance Summary */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: T.panel,
              borderColor: T.panelBorder,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield size={20} style={{ color: T.accent }} />
              <h3 className="font-semibold" style={{ color: T.textPrimary }}>
                PERFORMANCE SUMMARY
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div style={{ color: T.textSecondary }}>Critical Load Coverage</div>
                <div className="font-semibold" style={{ color: T.accent }}>
                  {((selectedKW / criticalLoadKW) * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Runtime During Outage</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  {runtimeDuringOutage}
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Install Cost</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  ${Math.round(installCost).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Est. Yearly Runtime</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  {runtimeHoursPerYear} hours
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Annual Fuel Cost</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  ${Math.round(annualFuelCost).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Annual Maintenance</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  ${Math.round(annualMaintenanceCost).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Source Attribution */}
          <div
            className="text-xs p-3 rounded border"
            style={{
              backgroundColor: T.panel,
              borderColor: T.panelBorder,
              color: T.textSecondary,
            }}
          >
            📊 <strong>Sources:</strong> IEEE 446-1995 (critical loads), NEC/LADWP (25% reserve
            margin), EIA 2024 (fuel costs)
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="sticky bottom-0 p-6 border-t flex items-center justify-end gap-3"
          style={{
            backgroundColor: "#0D0D0D",
            borderColor: T.panelBorder,
          }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: T.panel,
              border: `1px solid ${T.panelBorder}`,
              color: T.textSecondary,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: T.accent,
              color: "#0D0D0D",
            }}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
