/**
 * RenewablesSection - Renewables and alternative power sources
 * Solar PV, Wind, Fuel Cells, Generators, EV Chargers
 * Part of Custom Config view
 *
 * NOTE: This is a placeholder component. The full 2,400-line implementation
 * with all sub-components (SolarPVConfig, WindConfig, FuelCellConfig,
 * GeneratorConfig, EVChargerConfig) will be extracted in Phase 1C-part5.
 */

import React from "react";
import { Sparkles } from "lucide-react";
import { MerlinTip } from "../../Shared/MerlinTip";

interface RenewablesSectionProps {
  includeRenewables: boolean;
  setIncludeRenewables: (value: boolean) => void;
  storageSizeMW: number;
  // Solar state
  solarPVIncluded: boolean;
  setSolarPVIncluded: (value: boolean) => void;
  solarCapacityKW: number;
  // ... (100+ more props will be needed for full implementation)
}

export const RenewablesSection = React.memo(function RenewablesSection({
  includeRenewables,
  setIncludeRenewables,
  storageSizeMW,
  solarPVIncluded,
  setSolarPVIncluded,
  solarCapacityKW,
}: RenewablesSectionProps) {
  return (
    <div
      data-section="renewables"
      className="rounded-xl p-8 scroll-mt-24"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="text-white">Renewables & Alternative Power</span>
        </h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
            Include Renewables
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={includeRenewables}
              onChange={(e) => setIncludeRenewables(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
          </div>
        </label>
      </div>

      {includeRenewables && (
        <div className="space-y-6">
          <MerlinTip
            tip={
              solarPVIncluded && solarCapacityKW > 0
                ? `Solar + BESS is the sweet spot. Your ${solarCapacityKW} kW solar array pairs well with ${(storageSizeMW * 1000).toFixed(0)} kW BESS for maximum self-consumption and ITC stacking.`
                : "Solar PV paired with BESS can qualify for 30-50% ITC under IRA 2022. DC-coupled systems with ILR 1.3-1.5 maximize battery utilization."
            }
            context="IRA 2022 Section 48E + NREL ATB 2024 PV-Plus-Battery guidance"
          />

          {/* Placeholder for sub-components */}
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: "rgba(16,185,129,0.05)",
              border: "1px solid rgba(16,185,129,0.15)",
            }}
          >
            <p className="text-lg font-semibold text-white mb-2">
              🚧 Renewables Configuration (In Progress)
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              This section contains 2,400+ lines of complex configuration for:
            </p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-3xl mx-auto">
              {[
                { icon: "☀️", label: "Solar PV", lines: "~500 lines" },
                { icon: "💨", label: "Wind Turbines", lines: "~400 lines" },
                { icon: "⚡", label: "Fuel Cells", lines: "~300 lines" },
                { icon: "🔌", label: "Generators", lines: "~400 lines" },
                { icon: "🚗", label: "EV Chargers", lines: "~300 lines" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                  <div className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {item.lines}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-6" style={{ color: "rgba(255,255,255,0.5)" }}>
              These sub-components will be extracted in Phase 1C-part5.
              <br />
              For now, renewables configuration remains in AdvancedQuoteBuilder.tsx (lines
              3486-6900).
            </p>
          </div>

          {/* Show active solar config if enabled */}
          {solarPVIncluded && (
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">☀️</span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Solar PV Active: {solarCapacityKW} kW
                  </p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Full configuration in main component
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
