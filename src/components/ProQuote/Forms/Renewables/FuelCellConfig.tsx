/**
 * FuelCellConfig - Fuel cell system configuration
 * Capacity, fuel cell type, fuel type
 * Part of Renewables section
 */

import React from "react";
import { Cpu } from "lucide-react";

interface FuelCellConfigProps {
  // State
  fuelCellIncluded: boolean;
  setFuelCellIncluded: (value: boolean) => void;
  fuelCellCapacityKW: number;
  setFuelCellCapacityKW: (value: number) => void;
  fuelCellType: string;
  setFuelCellType: (value: string) => void;
  fuelType: string;
  setFuelType: (value: string) => void;
}

export const FuelCellConfig = React.memo(function FuelCellConfig({
  fuelCellIncluded,
  setFuelCellIncluded,
  fuelCellCapacityKW,
  setFuelCellCapacityKW,
  fuelCellType,
  setFuelCellType,
  fuelType,
  setFuelType,
}: FuelCellConfigProps) {
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
          <Cpu className="w-5 h-5 text-blue-400" />
          Fuel Cell System
        </h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={fuelCellIncluded}
            onChange={(e) => setFuelCellIncluded(e.target.checked)}
            className="w-5 h-5 rounded border-white/20 text-blue-500 focus:ring-blue-500/40 bg-transparent"
          />
          <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            Include Fuel Cell
          </span>
        </label>
      </div>

      {fuelCellIncluded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Fuel Cell Capacity (kW)
            </label>
            <input
              type="number"
              value={fuelCellCapacityKW}
              onChange={(e) => setFuelCellCapacityKW(parseFloat(e.target.value) || 0)}
              step="25"
              min="0"
              className="w-full px-4 py-2 rounded-lg text-white font-medium focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
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
              Fuel Cell Type
            </label>
            <select
              value={fuelCellType}
              onChange={(e) => setFuelCellType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-white font-medium focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <option value="pem">PEM (Proton Exchange Membrane)</option>
              <option value="sofc">SOFC (Solid Oxide)</option>
              <option value="mcfc">MCFC (Molten Carbonate)</option>
              <option value="pafc">PAFC (Phosphoric Acid)</option>
            </select>
          </div>
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Fuel Type
            </label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-white font-medium focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <option value="hydrogen">Hydrogen (H₂)</option>
              <option value="natural-gas">Natural Gas</option>
              <option value="biogas">Biogas</option>
              <option value="methanol">Methanol</option>
            </select>
          </div>
          <div
            className="rounded p-3"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.15)",
            }}
          >
            <p className="text-sm text-blue-300 font-bold">
              ⚡ Efficiency: <strong className="text-blue-200">45-60%</strong>
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Clean, quiet, continuous power
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
