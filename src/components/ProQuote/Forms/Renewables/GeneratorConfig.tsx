/**
 * GeneratorConfig - Generator system configuration
 * Fuel type, capacity, redundancy, primary use cases
 * Part of Renewables section
 */

import React from "react";
import { GitBranch } from "lucide-react";

interface GeneratorConfigProps {
  // State
  generatorIncluded: boolean;
  setGeneratorIncluded: (value: boolean) => void;
  generatorCapacityKW: number;
  setGeneratorCapacityKW: (value: number) => void;
  generatorFuelTypeSelected: string;
  setGeneratorFuelTypeSelected: (value: string) => void;
  generatorSpaceAvailable: boolean;
  setGeneratorSpaceAvailable: (value: boolean) => void;
  generatorUseCases: string[];
  setGeneratorUseCases: (value: string[] | ((prev: string[]) => string[])) => void;
  generatorRedundancy: boolean;
  setGeneratorRedundancy: (value: boolean) => void;
}

export const GeneratorConfig = React.memo(function GeneratorConfig({
  generatorIncluded,
  setGeneratorIncluded,
  generatorCapacityKW,
  setGeneratorCapacityKW,
  generatorFuelTypeSelected,
  setGeneratorFuelTypeSelected,
  generatorSpaceAvailable,
  setGeneratorSpaceAvailable,
  generatorUseCases,
  setGeneratorUseCases,
  generatorRedundancy,
  setGeneratorRedundancy,
}: GeneratorConfigProps) {
  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "rgba(59,130,246,0.05)",
        border: "1px solid rgba(59,130,246,0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold flex items-center gap-2 text-white">
          <GitBranch className="w-5 h-5 text-emerald-400" />
          Generator System
        </h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={generatorIncluded}
            onChange={(e) => setGeneratorIncluded(e.target.checked)}
            className="w-5 h-5 rounded border-white/20 text-emerald-500 focus:ring-emerald-500/40 bg-transparent"
          />
          <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            Include Generator
          </span>
        </label>
      </div>

      {generatorIncluded && (
        <div className="space-y-4">
          {/* Fuel Type Selector */}
          <div>
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Fuel Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(
                [
                  {
                    value: "natural-gas",
                    label: "🔥 Natural Gas",
                    desc: "Clean, continuous",
                  },
                  {
                    value: "diesel",
                    label: "🛢️ Diesel",
                    desc: "Proven reliability",
                  },
                  {
                    value: "dual-fuel",
                    label: "⚡ Dual-Fuel",
                    desc: "Gas + diesel backup",
                  },
                  {
                    value: "linear",
                    label: "🔄 Linear (Mainspring)",
                    desc: "Low emissions, quiet",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGeneratorFuelTypeSelected(opt.value)}
                  className="p-3 rounded-lg text-left transition-all"
                  style={{
                    background:
                      generatorFuelTypeSelected === opt.value
                        ? "rgba(59,130,246,0.15)"
                        : "rgba(255,255,255,0.04)",
                    border:
                      generatorFuelTypeSelected === opt.value
                        ? "1px solid rgba(59,130,246,0.4)"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span className="text-sm font-bold text-white">{opt.label}</span>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Generator Capacity (kW)
              </label>
              <input
                type="number"
                value={generatorCapacityKW}
                onChange={(e) => setGeneratorCapacityKW(parseFloat(e.target.value) || 0)}
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
                Space Available
              </label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setGeneratorSpaceAvailable(true)}
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: generatorSpaceAvailable
                      ? "rgba(16,185,129,0.15)"
                      : "rgba(255,255,255,0.04)",
                    border: generatorSpaceAvailable
                      ? "1px solid rgba(16,185,129,0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: generatorSpaceAvailable ? "#6ee7b7" : "rgba(255,255,255,0.5)",
                  }}
                >
                  ✓ Yes
                </button>
                <button
                  onClick={() => setGeneratorSpaceAvailable(false)}
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: !generatorSpaceAvailable
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(255,255,255,0.04)",
                    border: !generatorSpaceAvailable
                      ? "1px solid rgba(239,68,68,0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: !generatorSpaceAvailable ? "#fca5a5" : "rgba(255,255,255,0.5)",
                  }}
                >
                  ✗ Constrained
                </button>
              </div>
            </div>
          </div>

          {/* Generator Use Case */}
          <div>
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Primary Use Cases <span className="text-xs font-normal">(select all that apply)</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                {
                  value: "backup",
                  label: "🔋 Backup Power",
                  desc: "Outage protection",
                },
                {
                  value: "ups",
                  label: "⚡ UPS / Bridge",
                  desc: "Instant switchover",
                },
                {
                  value: "peak-shaving",
                  label: "📉 Peak Shaving",
                  desc: "Reduce demand charges",
                },
                {
                  value: "grid-stability",
                  label: "🔌 Grid Stability",
                  desc: "Frequency / voltage",
                },
                {
                  value: "augment",
                  label: "💪 Augment Power",
                  desc: "Supplement grid capacity",
                },
                {
                  value: "island",
                  label: "🏝️ Island Mode",
                  desc: "Off-grid operation",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setGeneratorUseCases((prev) =>
                      prev.includes(opt.value)
                        ? prev.filter((v) => v !== opt.value)
                        : [...prev, opt.value]
                    );
                  }}
                  className="p-3 rounded-lg text-left transition-all"
                  style={{
                    background: generatorUseCases.includes(opt.value)
                      ? "rgba(59,130,246,0.12)"
                      : "rgba(255,255,255,0.04)",
                    border: generatorUseCases.includes(opt.value)
                      ? "1px solid rgba(59,130,246,0.35)"
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

          {/* N+1 Redundancy */}
          <div
            className="flex items-center justify-between rounded-lg p-4"
            style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.12)",
            }}
          >
            <div>
              <p className="text-sm font-semibold text-white">N+1 Redundancy</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Add redundant unit for critical loads (2 × {generatorCapacityKW} kW)
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generatorRedundancy}
                onChange={(e) => setGeneratorRedundancy(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 text-emerald-500 focus:ring-emerald-500/40 bg-transparent"
              />
            </label>
          </div>

          {/* Generator Info */}
          <div
            className="rounded p-3"
            style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.1)",
            }}
          >
            <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              💡{" "}
              <strong className="text-white">
                {generatorFuelTypeSelected === "linear"
                  ? "Mainspring"
                  : generatorFuelTypeSelected === "natural-gas"
                    ? "Natural Gas"
                    : generatorFuelTypeSelected === "dual-fuel"
                      ? "Dual-Fuel"
                      : "Diesel"}
                :
              </strong>{" "}
              {generatorFuelTypeSelected === "natural-gas"
                ? "Cleaner than diesel, continuous runtime with utility gas connection. Lower emissions, quieter operation."
                : generatorFuelTypeSelected === "diesel"
                  ? "Proven reliability for critical backup. Fuel: ~0.3 gal/kWh. Runtime: 8-24 hrs at 50% load."
                  : generatorFuelTypeSelected === "dual-fuel"
                    ? "Starts on diesel, switches to natural gas. Best of both worlds for reliability + emissions."
                    : "Linear generator (Mainspring Flex). Ultra-low emissions, fuel-flexible, quiet. Ideal for distributed generation + BESS hybrid."}{" "}
              Best paired with BESS for instant response + generator ramp-up.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
