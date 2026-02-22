/**
 * RenewablesSection - Complete renewable energy integration wrapper
 * Contains: Solar PV, Wind Turbines, Fuel Cells, Generators, EV Chargers
 * Orchestrates all 5 sub-components with unified summary panel
 */

import React from "react";
import { Sparkles } from "lucide-react";
import { MerlinTip } from "../../Shared/MerlinTip";
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
  includeRenewables,
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
  durationHours,
}: RenewablesSectionProps) {
  // Calculate total renewable power for summary
  const totalRenewableKW =
    (solarPVIncluded ? solarCapacityKW : 0) +
    (windTurbineIncluded ? windCapacityKW : 0) +
    (fuelCellIncluded ? fuelCellCapacityKW : 0) +
    (generatorIncluded ? generatorCapacityKW : 0) +
    (evChargersIncluded
      ? evLevel2Count * 7.2 + evDCFCCount * 150 + evHPCCount * 250 + evAdditionalPowerKW
      : 0);

  // Calculate recommended BESS sizing based on renewable capacity
  const recommendedBESSKW = Math.round(totalRenewableKW * 0.6); // 60% of renewable capacity
  const recommendedBESSKWh = recommendedBESSKW * durationHours;

  return (
    <div
      data-section="renewables"
      className="rounded-xl p-8 scroll-mt-24"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Section Header with Master Toggle */}
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
          {/* Merlin's Strategic Tip */}
          <MerlinTip
            tip={
              solarPVIncluded && solarCapacityKW > 0
                ? `Solar + BESS is the sweet spot. Your ${solarCapacityKW} kW solar array pairs well with ${(storageSizeMW * 1000).toFixed(0)} kW BESS for maximum self-consumption and ITC stacking.`
                : "Solar PV paired with BESS can qualify for 30-50% ITC under IRA 2022. DC-coupled systems with ILR 1.3-1.5 maximize battery utilization."
            }
            context="IRA 2022 Section 48E + NREL ATB 2024 PV-Plus-Battery guidance"
          />

          {/* Solar PV Configuration */}
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
          />

          {/* Wind Turbine Configuration */}
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

          {/* Fuel Cell Configuration */}
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

          {/* Generator Configuration */}
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
          />

          {/* EV Chargers Configuration */}
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

          {/* Combined Summary Panel */}
          {totalRenewableKW > 0 && (
            <div
              className="rounded-xl p-6 mt-6"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                ⚡ Combined Renewable System Summary
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className="text-xs font-semibold mb-1"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Total Renewable Capacity
                  </p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {totalRenewableKW.toLocaleString()} kW
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs font-semibold mb-1"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Recommended BESS Sizing
                  </p>
                  <p className="text-2xl font-bold text-blue-400">
                    {recommendedBESSKW.toLocaleString()} kW / {recommendedBESSKWh.toLocaleString()}{" "}
                    kWh
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs font-semibold mb-1"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Current BESS
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {(storageSizeMW * 1000).toLocaleString()} kW /{" "}
                    {(storageSizeMW * 1000 * durationHours).toLocaleString()} kWh
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs font-semibold mb-1"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Sizing Status
                  </p>
                  <p
                    className="text-lg font-semibold"
                    style={{
                      color:
                        storageSizeMW * 1000 >= recommendedBESSKW * 0.9
                          ? "rgb(16,185,129)"
                          : "rgb(251,146,60)",
                    }}
                  >
                    {storageSizeMW * 1000 >= recommendedBESSKW * 0.9
                      ? "✓ Well-sized"
                      : "⚠️ Consider increasing"}
                  </p>
                </div>
              </div>
              <p
                className="text-xs mt-4 p-3 rounded-lg"
                style={{
                  color: "rgba(255,255,255,0.7)",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                💡 <strong>Tip:</strong> BESS sizing at 60% of renewable capacity optimizes for peak
                shaving while maintaining grid independence. Your current configuration{" "}
                {storageSizeMW * 1000 >= recommendedBESSKW * 0.9
                  ? "aligns with best practices"
                  : `is ${Math.round(((recommendedBESSKW - storageSizeMW * 1000) / recommendedBESSKW) * 100)}% below recommended sizing`}
                .
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
