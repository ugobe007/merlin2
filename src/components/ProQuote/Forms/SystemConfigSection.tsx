/**
 * System Configuration Section
 * Phase 1G Part 2c Operation 2 (Feb 2026)
 * 
 * Core BESS parameters configuration form
 * Extracted from AdvancedQuoteBuilder.tsx (~263 lines)
 * 
 * Features:
 * - Power capacity slider (0.1-10 MW) with numeric input
 * - Duration slider (0.5-12 hrs) with numeric input
 * - Battery chemistry selector (LFP, NMC, LTO, Sodium-Ion)
 * - Installation type selector (Outdoor, Indoor, Rooftop)
 * - Grid connection selector (AC/DC/Hybrid/Off-grid)
 * - Inverter efficiency input (85-99%)
 * - MerlinTip with intelligent sizing guidance
 */

import { Battery } from "lucide-react";
import { MerlinTip } from "@/components/ProQuote/Shared/MerlinTip";

export interface SystemConfigSectionProps {
  storageSizeMW: number;
  durationHours: number;
  storageSizeMWh: number;
  chemistry: string;
  installationType: string;
  gridConnection: string;
  inverterEfficiency: number;
  onStorageSizeChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  setChemistry: (value: string) => void;
  setInstallationType: (value: string) => void;
  setGridConnection: (value: string) => void;
  setInverterEfficiency: (value: number) => void;
}

export default function SystemConfigSection({
  storageSizeMW,
  durationHours,
  storageSizeMWh,
  chemistry,
  installationType,
  gridConnection,
  inverterEfficiency,
  onStorageSizeChange,
  onDurationChange,
  setChemistry,
  setInstallationType,
  setGridConnection,
  setInverterEfficiency,
}: SystemConfigSectionProps) {
  return (
    <div
      data-section="system"
      className="scroll-mt-48 rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Section Header */}
      <div
        className="px-6 py-4"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: "rgba(59,130,246,0.1)" }}
          >
            <Battery className="w-5 h-5 text-blue-400" />
          </div>
          System Configuration
          <span
            className="text-xs font-normal ml-auto"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Core BESS Parameters
          </span>
        </h3>
        <MerlinTip
          tip={
            storageSizeMW < 0.5
              ? "Start with your peak demand. Most commercial sites need 500 kW – 2 MW of BESS power with 2-4 hour duration."
              : `${(storageSizeMW * 1000).toFixed(0)} kW / ${durationHours}h = ${storageSizeMWh.toFixed(1)} MWh is a solid configuration. Adjust duration for more energy shifting or backup runtime.`
          }
          context="Based on NREL ATB 2024 commercial BESS sizing benchmarks"
        />
      </div>

      {/* Section Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Power Capacity - Full Width Slider */}
          <div
            className="lg:col-span-2 rounded-xl p-5"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <label
                className="text-sm font-semibold"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Power Capacity
              </label>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md"
                style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}
              >
                {(storageSizeMW * 1000).toFixed(0)} kW
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={storageSizeMW}
                onChange={(e) => onStorageSizeChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500"
                style={{
                  background: `linear-gradient(to right, #3b82f6 ${((storageSizeMW - 0.1) / 9.9) * 100}%, rgba(255,255,255,0.08) ${((storageSizeMW - 0.1) / 9.9) * 100}%)`,
                }}
              />
              <div className="relative">
                <input
                  type="number"
                  value={storageSizeMW}
                  onChange={(e) =>
                    onStorageSizeChange(parseFloat(e.target.value) || 0.1)
                  }
                  step="0.1"
                  min="0.1"
                  max="50"
                  className="w-28 pl-3 pr-10 py-2.5 text-white rounded-lg text-right font-bold text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  MW
                </span>
              </div>
            </div>
          </div>

          {/* Duration - Full Width Slider */}
          <div
            className="lg:col-span-2 rounded-xl p-5"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <label
                className="text-sm font-semibold"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Duration
              </label>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md"
                style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
              >
                {(storageSizeMW * durationHours).toFixed(1)} MWh total
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="12"
                step="0.5"
                value={durationHours}
                onChange={(e) => onDurationChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                style={{
                  background: `linear-gradient(to right, #6366f1 ${((durationHours - 0.5) / 11.5) * 100}%, rgba(255,255,255,0.08) ${((durationHours - 0.5) / 11.5) * 100}%)`,
                }}
              />
              <div className="relative">
                <input
                  type="number"
                  value={durationHours}
                  onChange={(e) =>
                    onDurationChange(parseFloat(e.target.value) || 0.5)
                  }
                  step="0.5"
                  min="0.5"
                  max="24"
                  className="w-28 pl-3 pr-10 py-2.5 text-white rounded-lg text-right font-bold text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  hrs
                </span>
              </div>
            </div>
          </div>

          {/* Battery Chemistry */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Battery Chemistry
            </label>
            <select
              value={chemistry}
              onChange={(e) => setChemistry(e.target.value)}
              className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <option value="lfp">LiFePO4 (LFP) - Long life, safe</option>
              <option value="nmc">NMC - High energy density</option>
              <option value="lto">LTO - Ultra-long life</option>
              <option value="sodium-ion">Sodium-Ion - Low cost</option>
            </select>
          </div>

          {/* Installation Type */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Installation Type
            </label>
            <select
              value={installationType}
              onChange={(e) => setInstallationType(e.target.value)}
              className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <option value="outdoor">Outdoor (Containerized)</option>
              <option value="indoor">Indoor (Room/Vault)</option>
              <option value="rooftop">Rooftop</option>
            </select>
          </div>

          {/* Grid Connection */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Grid Connection
            </label>
            <select
              value={gridConnection}
              onChange={(e) => setGridConnection(e.target.value)}
              className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <option value="ac-coupled">AC-Coupled (Grid-tied)</option>
              <option value="dc-coupled">DC-Coupled (with Solar)</option>
              <option value="hybrid">Hybrid (AC+DC)</option>
              <option value="off-grid">Off-Grid/Island Mode</option>
            </select>
          </div>

          {/* Inverter Efficiency */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Inverter Efficiency (%)
            </label>
            <input
              type="number"
              value={inverterEfficiency}
              onChange={(e) =>
                setInverterEfficiency(parseFloat(e.target.value) || 90)
              }
              min="85"
              max="99"
              step="0.5"
              className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
