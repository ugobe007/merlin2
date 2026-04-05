/**
 * RenewablesSection - Complete renewable energy integration wrapper
 * Contains: Solar PV, Wind Turbines, Fuel Cells, Generators, EV Chargers
 * Orchestrates all 5 sub-components with unified summary panel
 */

import React, { useState } from "react";
import { Sparkles, ChevronDown, CheckCircle2, Plus } from "lucide-react";
import { SolarPVConfig } from "./SolarPVConfig";
import { WindTurbineConfig } from "./WindTurbineConfig";
import { FuelCellConfig } from "./FuelCellConfig";
import { GeneratorConfig } from "./GeneratorConfig";
import { EVChargersConfig } from "./EVChargersConfig";

interface RenewablesSectionProps {
  // Master toggle
  includeRenewables: boolean;
  setIncludeRenewables: (value: boolean) => void;

  // Solar PV (13 props)
  solarPVIncluded: boolean;
  setSolarPVIncluded: (value: boolean) => void;
  solarCapacityKW: number;
  setSolarCapacityKW: (value: number) => void;
  solarPanelType: string;
  setSolarPanelType: (value: string) => void;
  solarPanelEfficiency: number;
  setSolarPanelEfficiency: (value: number) => void;
  solarInverterType: string;
  setSolarInverterType: (value: string) => void;
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
  solarTrackingType: "fixed" | "single-axis" | "dual-axis";
  setSolarTrackingType: (value: "fixed" | "single-axis" | "dual-axis") => void;

  // Wind Turbine (7 props)
  windTurbineIncluded: boolean;
  setWindTurbineIncluded: (value: boolean) => void;
  windCapacityKW: number;
  setWindCapacityKW: (value: number) => void;
  windTurbineType: string;
  setWindTurbineType: (value: string) => void;
  windClassRating: 1 | 2 | 3 | 4;
  setWindClassRating: (value: 1 | 2 | 3 | 4) => void;
  windTurbineCount: number;
  setWindTurbineCount: (value: number) => void;
  windHubHeight: number;
  setWindHubHeight: (value: number) => void;
  windTerrain: "open" | "suburban" | "coastal" | "complex";
  setWindTerrain: (value: "open" | "suburban" | "coastal" | "complex") => void;

  // Fuel Cell (4 props)
  fuelCellIncluded: boolean;
  setFuelCellIncluded: (value: boolean) => void;
  fuelCellCapacityKW: number;
  setFuelCellCapacityKW: (value: number) => void;
  fuelCellType: string;
  setFuelCellType: (value: string) => void;
  fuelType: string;
  setFuelType: (value: string) => void;

  // Generator (6 props)
  generatorIncluded: boolean;
  setGeneratorIncluded: (value: boolean) => void;
  generatorCapacityKW: number;
  setGeneratorCapacityKW: (value: number) => void;
  generatorFuelTypeSelected: string;
  setGeneratorFuelTypeSelected: (value: string) => void;
  generatorUseCases: string[];
  setGeneratorUseCases: (value: string[] | ((prev: string[]) => string[])) => void;
  generatorRedundancy: boolean;
  setGeneratorRedundancy: (value: boolean) => void;
  generatorSpaceAvailable: boolean;
  setGeneratorSpaceAvailable: (value: boolean) => void;

  // EV Chargers (6 props)
  evChargersIncluded: boolean;
  setEvChargersIncluded: (value: boolean) => void;
  evLevel2Count: number;
  setEvLevel2Count: (value: number) => void;
  evDCFCCount: number;
  setEvDCFCCount: (value: number) => void;
  evHPCCount: number;
  setEvHPCCount: (value: number) => void;
  evChargersPerStation: number;
  setEvChargersPerStation: (value: number) => void;
  evAdditionalPowerKW: number;
  setEvAdditionalPowerKW: (value: number) => void;

  // Context for calculations
  storageSizeMW: number;
  durationHours: number;
}

export const RenewablesSection = React.memo(function RenewablesSection({
  includeRenewables: _includeRenewables,
  setIncludeRenewables,
  // Solar
  solarPVIncluded,
  setSolarPVIncluded,
  solarCapacityKW,
  setSolarCapacityKW,
  solarPanelType,
  setSolarPanelType,
  solarPanelEfficiency,
  setSolarPanelEfficiency,
  solarInverterType,
  setSolarInverterType,
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
  solarTrackingType,
  setSolarTrackingType,
  // Wind
  windTurbineIncluded,
  setWindTurbineIncluded,
  windCapacityKW,
  setWindCapacityKW,
  windTurbineType,
  setWindTurbineType,
  windClassRating,
  setWindClassRating,
  windTurbineCount,
  setWindTurbineCount,
  windHubHeight,
  setWindHubHeight,
  windTerrain,
  setWindTerrain,
  // Fuel Cell
  fuelCellIncluded,
  setFuelCellIncluded,
  fuelCellCapacityKW,
  setFuelCellCapacityKW,
  fuelCellType,
  setFuelCellType,
  fuelType,
  setFuelType,
  // Generator
  generatorIncluded,
  setGeneratorIncluded,
  generatorCapacityKW,
  setGeneratorCapacityKW,
  generatorFuelTypeSelected,
  setGeneratorFuelTypeSelected,
  generatorUseCases,
  setGeneratorUseCases,
  generatorRedundancy,
  setGeneratorRedundancy,
  generatorSpaceAvailable,
  setGeneratorSpaceAvailable,
  // EV Chargers
  evChargersIncluded,
  setEvChargersIncluded,
  evLevel2Count,
  setEvLevel2Count,
  evDCFCCount,
  setEvDCFCCount,
  evHPCCount,
  setEvHPCCount,
  evChargersPerStation,
  setEvChargersPerStation,
  evAdditionalPowerKW,
  setEvAdditionalPowerKW,
  // Context
  storageSizeMW,
  durationHours: _durationHours,
}: RenewablesSectionProps) {
  // Which add-on config panel is currently expanded
  const [expandedAddon, setExpandedAddon] = useState<string | null>(null);

  const toggleExpand = (key: string) => setExpandedAddon((prev) => (prev === key ? null : key));

  // Enable an add-on: flip its Included flag, open master toggle, auto-expand config
  const enableAddon = (key: string, setter: (v: boolean) => void) => {
    setter(true);
    setIncludeRenewables(true);
    setExpandedAddon(key);
  };

  const disableAddon = (key: string, setter: (v: boolean) => void) => {
    setter(false);
    if (expandedAddon === key) setExpandedAddon(null);
    // Turn off master toggle if nothing else is active
    const others = [
      key !== "solar" && solarPVIncluded,
      key !== "wind" && windTurbineIncluded,
      key !== "generator" && generatorIncluded,
      key !== "ev" && evChargersIncluded,
      key !== "fuelcell" && fuelCellIncluded,
    ].some(Boolean);
    if (!others) setIncludeRenewables(false);
  };

  const activeCount = [
    solarPVIncluded,
    windTurbineIncluded,
    generatorIncluded,
    evChargersIncluded,
    fuelCellIncluded,
  ].filter(Boolean).length;

  const totalAddedKW =
    (solarPVIncluded ? solarCapacityKW : 0) +
    (windTurbineIncluded ? windCapacityKW : 0) +
    (generatorIncluded ? generatorCapacityKW : 0) +
    (fuelCellIncluded ? fuelCellCapacityKW : 0) +
    (evChargersIncluded
      ? evLevel2Count * 7.2 + evDCFCCount * 150 + evHPCCount * 250 + evAdditionalPowerKW
      : 0);

  // Phase 5: Merlin shared engine — suggest sizing from BESS context
  // IEEE 446-1995 Orange Book: generator reserve = BESS kW × 0.70
  // NREL sun-quality: solar BESS offset ≈ BESS kW × 0.40 × sunFactor (default PSH 4.5 → factor 1.0)
  const bessKW = storageSizeMW * 1000;
  const merlinSuggestedGenKW = bessKW > 0 ? Math.round(bessKW * 0.7) : 0;
  const _sunFactor = Math.max(0.4, Math.min(1.0, (solarPeakSunHours - 2.5) / 2.0));
  const merlinSuggestedSolarKW = bessKW > 0 ? Math.round(bessKW * 0.4 * _sunFactor) : 0;

  // Card definition for each add-on
  const addonCards = [
    {
      key: "solar",
      emoji: "☀️",
      label: "Solar PV",
      priceSig: "$0.85/W commercial · ITC stackable",
      included: solarPVIncluded,
      badge: solarPVIncluded ? `${solarCapacityKW.toLocaleString()} kW` : null,
      onEnable: () => enableAddon("solar", setSolarPVIncluded),
      onDisable: () => disableAddon("solar", setSolarPVIncluded),
      config: (
        <SolarPVConfig
          solarPVIncluded={solarPVIncluded}
          setSolarPVIncluded={setSolarPVIncluded}
          solarCapacityKW={solarCapacityKW}
          setSolarCapacityKW={setSolarCapacityKW}
          solarPanelType={solarPanelType}
          setSolarPanelType={setSolarPanelType}
          solarPanelEfficiency={solarPanelEfficiency}
          setSolarPanelEfficiency={setSolarPanelEfficiency}
          solarInverterType={solarInverterType}
          setSolarInverterType={setSolarInverterType}
          solarInstallType={solarInstallType}
          setSolarInstallType={setSolarInstallType}
          solarRoofSpaceSqFt={solarRoofSpaceSqFt}
          setSolarRoofSpaceSqFt={setSolarRoofSpaceSqFt}
          solarCanopySqFt={solarCanopySqFt}
          setSolarCanopySqFt={setSolarCanopySqFt}
          solarGroundAcres={solarGroundAcres}
          setSolarGroundAcres={setSolarGroundAcres}
          solarPeakSunHours={solarPeakSunHours}
          setSolarPeakSunHours={setSolarPeakSunHours}
          solarTrackingType={solarTrackingType}
          setSolarTrackingType={setSolarTrackingType}
          merlinSuggestedKW={merlinSuggestedSolarKW}
        />
      ),
    },
    {
      key: "wind",
      emoji: "💨",
      label: "Wind Turbines",
      priceSig: "$1.5M/MW installed · best for rural/coastal",
      included: windTurbineIncluded,
      badge: windTurbineIncluded ? `${windCapacityKW.toLocaleString()} kW` : null,
      onEnable: () => enableAddon("wind", setWindTurbineIncluded),
      onDisable: () => disableAddon("wind", setWindTurbineIncluded),
      config: (
        <WindTurbineConfig
          windTurbineIncluded={windTurbineIncluded}
          setWindTurbineIncluded={setWindTurbineIncluded}
          windCapacityKW={windCapacityKW}
          setWindCapacityKW={setWindCapacityKW}
          windTurbineType={windTurbineType}
          setWindTurbineType={setWindTurbineType}
          windClassRating={windClassRating}
          setWindClassRating={setWindClassRating}
          windTurbineCount={windTurbineCount}
          setWindTurbineCount={setWindTurbineCount}
          windHubHeight={windHubHeight}
          setWindHubHeight={setWindHubHeight}
          windTerrain={windTerrain}
          setWindTerrain={setWindTerrain}
        />
      ),
    },
    {
      key: "generator",
      emoji: "⚡",
      label: "Generator",
      priceSig: "$700/kW natural gas · diesel/dual-fuel available",
      included: generatorIncluded,
      badge: generatorIncluded ? `${generatorCapacityKW.toLocaleString()} kW` : null,
      onEnable: () => enableAddon("generator", setGeneratorIncluded),
      onDisable: () => disableAddon("generator", setGeneratorIncluded),
      config: (
        <GeneratorConfig
          generatorIncluded={generatorIncluded}
          setGeneratorIncluded={setGeneratorIncluded}
          generatorCapacityKW={generatorCapacityKW}
          setGeneratorCapacityKW={setGeneratorCapacityKW}
          generatorFuelTypeSelected={generatorFuelTypeSelected}
          setGeneratorFuelTypeSelected={setGeneratorFuelTypeSelected}
          generatorUseCases={generatorUseCases}
          setGeneratorUseCases={setGeneratorUseCases}
          generatorRedundancy={generatorRedundancy}
          setGeneratorRedundancy={setGeneratorRedundancy}
          generatorSpaceAvailable={generatorSpaceAvailable}
          setGeneratorSpaceAvailable={setGeneratorSpaceAvailable}
          merlinSuggestedKW={merlinSuggestedGenKW}
        />
      ),
    },
    {
      key: "ev",
      emoji: "🔌",
      label: "EV Charging",
      priceSig: "$8K–35K/port · revenue-generating asset",
      included: evChargersIncluded,
      badge: evChargersIncluded ? `${evLevel2Count + evDCFCCount + evHPCCount} ports` : null,
      onEnable: () => enableAddon("ev", setEvChargersIncluded),
      onDisable: () => disableAddon("ev", setEvChargersIncluded),
      config: (
        <EVChargersConfig
          evChargersIncluded={evChargersIncluded}
          setEvChargersIncluded={setEvChargersIncluded}
          evLevel2Count={evLevel2Count}
          setEvLevel2Count={setEvLevel2Count}
          evDCFCCount={evDCFCCount}
          setEvDCFCCount={setEvDCFCCount}
          evHPCCount={evHPCCount}
          setEvHPCCount={setEvHPCCount}
          evChargersPerStation={evChargersPerStation}
          setEvChargersPerStation={setEvChargersPerStation}
          evAdditionalPowerKW={evAdditionalPowerKW}
          setEvAdditionalPowerKW={setEvAdditionalPowerKW}
          storageSizeMW={storageSizeMW}
        />
      ),
    },
    {
      key: "fuelcell",
      emoji: "🔬",
      label: "Fuel Cell",
      priceSig: "$2.5M/MW · zero-emission continuous generation",
      included: fuelCellIncluded,
      badge: fuelCellIncluded ? `${fuelCellCapacityKW.toLocaleString()} kW` : null,
      onEnable: () => enableAddon("fuelcell", setFuelCellIncluded),
      onDisable: () => disableAddon("fuelcell", setFuelCellIncluded),
      config: (
        <FuelCellConfig
          fuelCellIncluded={fuelCellIncluded}
          setFuelCellIncluded={setFuelCellIncluded}
          fuelCellCapacityKW={fuelCellCapacityKW}
          setFuelCellCapacityKW={setFuelCellCapacityKW}
          fuelCellType={fuelCellType}
          setFuelCellType={setFuelCellType}
          fuelType={fuelType}
          setFuelType={setFuelType}
        />
      ),
    },
  ];

  return (
    <div
      data-section="renewables"
      className="rounded-xl scroll-mt-24"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* ─── Section header ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-base font-semibold text-white leading-tight">Optional Add-Ons</h3>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Solar, wind, generators, EV charging &amp; fuel cells —{" "}
              <strong style={{ color: "rgba(52,211,153,0.75)" }}>not included</strong> in your base
              BESS quote
            </p>
          </div>
        </div>
        {/* Counter badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
          style={
            activeCount > 0
              ? {
                  background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.35)",
                  color: "#6ee7b7",
                }
              : {
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.35)",
                }
          }
        >
          {activeCount > 0 ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              {activeCount} of 5 added &middot; {totalAddedKW.toLocaleString()} kW
            </>
          ) : (
            "0 of 5 · none added"
          )}
        </div>
      </div>

      {/* ─── Add-on card grid ────────────────────────────────────────── */}
      <div className="p-5">
        {activeCount === 0 && (
          <p className="text-[12px] mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            Your current quote is{" "}
            <strong style={{ color: "rgba(255,255,255,0.55)" }}>BESS only</strong>. Click any card
            below to include it in the quote.
          </p>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {addonCards.map((addon) => {
            const active = addon.included;
            const open = expandedAddon === addon.key;
            return (
              <div key={addon.key}>
                {/* Toggle card */}
                <div
                  className="rounded-xl p-4 cursor-pointer transition-all duration-150 select-none"
                  style={{
                    border: active
                      ? "1.5px solid rgba(52,211,153,0.65)"
                      : "1px solid rgba(255,255,255,0.11)",
                    background: active ? "rgba(52,211,153,0.05)" : "transparent",
                    boxShadow: active ? "0 0 12px rgba(52,211,153,0.08)" : "none",
                  }}
                  onClick={() => (active ? addon.onDisable() : addon.onEnable())}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-base leading-none">{addon.emoji}</span>
                        <span
                          className="text-sm font-semibold truncate"
                          style={{ color: active ? "#6ee7b7" : "rgba(255,255,255,0.75)" }}
                        >
                          {addon.label}
                        </span>
                      </div>
                      {active && addon.badge ? (
                        <span className="text-[11px] font-bold" style={{ color: "#34d399" }}>
                          {addon.badge} configured
                        </span>
                      ) : (
                        <span
                          className="text-[10px] leading-snug"
                          style={{ color: "rgba(255,255,255,0.28)" }}
                        >
                          {addon.priceSig}
                        </span>
                      )}
                    </div>
                    {active ? (
                      <CheckCircle2
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: "#34d399" }}
                      />
                    ) : (
                      <Plus
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: "rgba(255,255,255,0.28)" }}
                      />
                    )}
                  </div>
                </div>

                {/* Configure link (only when active) */}
                {active && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(addon.key);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 mt-1 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: open ? "rgba(52,211,153,0.07)" : "transparent",
                      border: "1px solid rgba(52,211,153,0.22)",
                      color: "#6ee7b7",
                    }}
                  >
                    <span>{open ? "Collapse" : "Configure"}</span>
                    <ChevronDown
                      className="w-3.5 h-3.5 transition-transform duration-200"
                      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </button>
                )}

                {/* Expanded config panel */}
                {active && open && (
                  <div
                    className="mt-2 rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(52,211,153,0.18)" }}
                  >
                    {addon.config}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Combined summary when 2+ add-ons active ─────────────── */}
        {activeCount >= 2 && (
          <div
            className="mt-5 rounded-xl p-4"
            style={{
              background: "rgba(52,211,153,0.05)",
              border: "1px solid rgba(52,211,153,0.18)",
            }}
          >
            <p className="text-xs font-bold mb-3" style={{ color: "#6ee7b7" }}>
              ⚡ Combined Add-On Summary
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Total Added Capacity
                </p>
                <p className="text-xl font-bold text-emerald-400">
                  {totalAddedKW.toLocaleString()} kW
                </p>
              </div>
              <div>
                <p
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  BESS System
                </p>
                <p className="text-xl font-bold text-white">
                  {(storageSizeMW * 1000).toLocaleString()} kW
                </p>
              </div>
              <div>
                <p
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Total System
                </p>
                <p className="text-xl font-bold text-blue-400">
                  {(storageSizeMW * 1000 + totalAddedKW).toLocaleString()} kW
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
