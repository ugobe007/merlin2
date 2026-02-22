import { useState } from "react";

/**
 * RENEWABLES STATE HOOK
 *
 * Manages all renewable energy and alternative power state including:
 * - Solar PV configuration
 * - Wind turbine configuration
 * - Fuel cell configuration
 * - Generator configuration (diesel/natural gas/dual-fuel)
 * - EV charger configuration
 *
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 1G, Feb 2026)
 */

export function useRenewablesState() {
  // ═══ General Renewables Toggle ═══
  const [includeRenewables, setIncludeRenewables] = useState(true);

  // ═══ Solar PV Configuration ═══
  const [solarPVIncluded, setSolarPVIncluded] = useState(true);
  const [solarCapacityKW, setSolarCapacityKW] = useState(1000);
  const [solarPanelType, setSolarPanelType] = useState("monocrystalline");
  const [solarPanelEfficiency, setSolarPanelEfficiency] = useState(21);
  const [solarInverterType, setSolarInverterType] = useState("string");
  const [solarInstallType, setSolarInstallType] = useState<
    "rooftop" | "canopy" | "ground-mount" | "mixed"
  >("rooftop");
  const [solarRoofSpaceSqFt, setSolarRoofSpaceSqFt] = useState(10000);
  const [solarCanopySqFt, setSolarCanopySqFt] = useState(5000);
  const [solarGroundAcres, setSolarGroundAcres] = useState(2);
  const [solarPeakSunHours, setSolarPeakSunHours] = useState(5);
  const [solarTrackingType, setSolarTrackingType] = useState<"fixed" | "single-axis" | "dual-axis">(
    "fixed"
  );

  // ═══ Wind Turbine Configuration ═══
  const [windTurbineIncluded, setWindTurbineIncluded] = useState(true);
  const [windCapacityKW, setWindCapacityKW] = useState(500);
  const [windTurbineType, setWindTurbineType] = useState("horizontal");
  const [windClassRating, setWindClassRating] = useState(3);
  const [windTurbineCount, setWindTurbineCount] = useState(1);
  const [windHubHeight, setWindHubHeight] = useState(80);
  const [windTerrain, setWindTerrain] = useState<"open" | "suburban" | "coastal" | "complex">(
    "open"
  );

  // ═══ Fuel Cell Configuration ═══
  const [fuelCellIncluded, setFuelCellIncluded] = useState(true);
  const [fuelCellCapacityKW, setFuelCellCapacityKW] = useState(250);
  const [fuelCellType, setFuelCellType] = useState("pem");
  const [fuelType, setFuelType] = useState("hydrogen");

  // ═══ Generator Configuration (Unified: diesel/natural-gas/dual-fuel) ═══
  const [generatorIncluded, setGeneratorIncluded] = useState(true);
  const [generatorCapacityKW, setGeneratorCapacityKW] = useState(500);
  const [generatorFuelTypeSelected, setGeneratorFuelTypeSelected] = useState<string>("natural-gas");
  const [generatorUseCases, setGeneratorUseCases] = useState<string[]>(["backup"]);
  const [generatorRedundancy, setGeneratorRedundancy] = useState(false);
  const [generatorSpaceAvailable, setGeneratorSpaceAvailable] = useState(true);

  // ═══ EV Charger Configuration ═══
  const [evChargersIncluded, setEvChargersIncluded] = useState(true);
  const [evLevel2Count, setEvLevel2Count] = useState(8);
  const [evDCFCCount, setEvDCFCCount] = useState(4);
  const [evHPCCount, setEvHPCCount] = useState(0);
  const [evChargersPerStation, setEvChargersPerStation] = useState<number>(2);
  const [evAdditionalPowerKW, setEvAdditionalPowerKW] = useState(0);

  return {
    // General Toggle
    includeRenewables,
    setIncludeRenewables,

    // Solar PV
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

    // Wind Turbine
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
  };
}
