import { useState, useCallback } from "react";

/**
 * Renewables Configuration Hook
 *
 * Manages renewable energy and backup generation configuration:
 * - Solar PV systems
 * - Wind turbines
 * - Fuel cells
 * - Diesel generators
 * - Natural gas generators
 *
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 3.2)
 */

export interface RenewablesConfiguration {
  // General Renewables Toggle
  includeRenewables: boolean;

  // Solar PV Configuration
  solarPVIncluded: boolean;
  solarCapacityKW: number;
  solarPanelType: string; // 'monocrystalline', 'polycrystalline', 'thin-film'
  solarPanelEfficiency: number; // Percentage
  solarInverterType: string; // 'string', 'microinverter', 'central'

  // Wind Turbine Configuration
  windTurbineIncluded: boolean;
  windCapacityKW: number;
  windTurbineType: string; // 'horizontal', 'vertical'

  // Fuel Cell Configuration
  fuelCellIncluded: boolean;
  fuelCellCapacityKW: number;
  fuelCellType: string; // 'pem', 'sofc', 'pafc', 'mcfc'
  fuelType: string; // 'hydrogen', 'natural-gas', 'biogas'

  // Diesel Generator Configuration
  dieselGenIncluded: boolean;
  dieselGenCapacityKW: number;

  // Natural Gas Generator Configuration
  naturalGasGenIncluded: boolean;
  naturalGasCapacityKW: number;
}

export interface RenewablesConfigurationSetters {
  setIncludeRenewables: (value: boolean) => void;
  setSolarPVIncluded: (value: boolean) => void;
  setSolarCapacityKW: (value: number) => void;
  setSolarPanelType: (value: string) => void;
  setSolarPanelEfficiency: (value: number) => void;
  setSolarInverterType: (value: string) => void;
  setWindTurbineIncluded: (value: boolean) => void;
  setWindCapacityKW: (value: number) => void;
  setWindTurbineType: (value: string) => void;
  setFuelCellIncluded: (value: boolean) => void;
  setFuelCellCapacityKW: (value: number) => void;
  setFuelCellType: (value: string) => void;
  setFuelType: (value: string) => void;
  setDieselGenIncluded: (value: boolean) => void;
  setDieselGenCapacityKW: (value: number) => void;
  setNaturalGasGenIncluded: (value: boolean) => void;
  setNaturalGasCapacityKW: (value: number) => void;
}

export interface UseRenewablesConfigurationReturn {
  config: RenewablesConfiguration;
  setters: RenewablesConfigurationSetters;
  resetToDefaults: () => void;
  getTotalRenewableCapacityKW: () => number;
  getActiveRenewableSources: () => string[];
}

const DEFAULT_CONFIG: RenewablesConfiguration = {
  includeRenewables: false,
  solarPVIncluded: false,
  solarCapacityKW: 1000,
  solarPanelType: "monocrystalline",
  solarPanelEfficiency: 21,
  solarInverterType: "string",
  windTurbineIncluded: false,
  windCapacityKW: 500,
  windTurbineType: "horizontal",
  fuelCellIncluded: false,
  fuelCellCapacityKW: 250,
  fuelCellType: "pem",
  fuelType: "hydrogen",
  dieselGenIncluded: false,
  dieselGenCapacityKW: 500,
  naturalGasGenIncluded: false,
  naturalGasCapacityKW: 750,
};

export function useRenewablesConfiguration(
  initialConfig?: Partial<RenewablesConfiguration>
): UseRenewablesConfigurationReturn {
  // Merge initial config with defaults
  const initial = { ...DEFAULT_CONFIG, ...initialConfig };

  // General Toggle
  const [includeRenewables, setIncludeRenewables] = useState(initial.includeRenewables);

  // Solar PV
  const [solarPVIncluded, setSolarPVIncluded] = useState(initial.solarPVIncluded);
  const [solarCapacityKW, setSolarCapacityKW] = useState(initial.solarCapacityKW);
  const [solarPanelType, setSolarPanelType] = useState(initial.solarPanelType);
  const [solarPanelEfficiency, setSolarPanelEfficiency] = useState(initial.solarPanelEfficiency);
  const [solarInverterType, setSolarInverterType] = useState(initial.solarInverterType);

  // Wind Turbine
  const [windTurbineIncluded, setWindTurbineIncluded] = useState(initial.windTurbineIncluded);
  const [windCapacityKW, setWindCapacityKW] = useState(initial.windCapacityKW);
  const [windTurbineType, setWindTurbineType] = useState(initial.windTurbineType);

  // Fuel Cell
  const [fuelCellIncluded, setFuelCellIncluded] = useState(initial.fuelCellIncluded);
  const [fuelCellCapacityKW, setFuelCellCapacityKW] = useState(initial.fuelCellCapacityKW);
  const [fuelCellType, setFuelCellType] = useState(initial.fuelCellType);
  const [fuelType, setFuelType] = useState(initial.fuelType);

  // Diesel Generator
  const [dieselGenIncluded, setDieselGenIncluded] = useState(initial.dieselGenIncluded);
  const [dieselGenCapacityKW, setDieselGenCapacityKW] = useState(initial.dieselGenCapacityKW);

  // Natural Gas Generator
  const [naturalGasGenIncluded, setNaturalGasGenIncluded] = useState(initial.naturalGasGenIncluded);
  const [naturalGasCapacityKW, setNaturalGasCapacityKW] = useState(initial.naturalGasCapacityKW);

  // Reset all values to defaults
  const resetToDefaults = useCallback(() => {
    setIncludeRenewables(DEFAULT_CONFIG.includeRenewables);
    setSolarPVIncluded(DEFAULT_CONFIG.solarPVIncluded);
    setSolarCapacityKW(DEFAULT_CONFIG.solarCapacityKW);
    setSolarPanelType(DEFAULT_CONFIG.solarPanelType);
    setSolarPanelEfficiency(DEFAULT_CONFIG.solarPanelEfficiency);
    setSolarInverterType(DEFAULT_CONFIG.solarInverterType);
    setWindTurbineIncluded(DEFAULT_CONFIG.windTurbineIncluded);
    setWindCapacityKW(DEFAULT_CONFIG.windCapacityKW);
    setWindTurbineType(DEFAULT_CONFIG.windTurbineType);
    setFuelCellIncluded(DEFAULT_CONFIG.fuelCellIncluded);
    setFuelCellCapacityKW(DEFAULT_CONFIG.fuelCellCapacityKW);
    setFuelCellType(DEFAULT_CONFIG.fuelCellType);
    setFuelType(DEFAULT_CONFIG.fuelType);
    setDieselGenIncluded(DEFAULT_CONFIG.dieselGenIncluded);
    setDieselGenCapacityKW(DEFAULT_CONFIG.dieselGenCapacityKW);
    setNaturalGasGenIncluded(DEFAULT_CONFIG.naturalGasGenIncluded);
    setNaturalGasCapacityKW(DEFAULT_CONFIG.naturalGasCapacityKW);
  }, []);

  // Calculate total renewable capacity
  const getTotalRenewableCapacityKW = useCallback(() => {
    let total = 0;
    if (solarPVIncluded) total += solarCapacityKW;
    if (windTurbineIncluded) total += windCapacityKW;
    if (fuelCellIncluded) total += fuelCellCapacityKW;
    if (dieselGenIncluded) total += dieselGenCapacityKW;
    if (naturalGasGenIncluded) total += naturalGasCapacityKW;
    return total;
  }, [
    solarPVIncluded,
    solarCapacityKW,
    windTurbineIncluded,
    windCapacityKW,
    fuelCellIncluded,
    fuelCellCapacityKW,
    dieselGenIncluded,
    dieselGenCapacityKW,
    naturalGasGenIncluded,
    naturalGasCapacityKW,
  ]);

  // Get list of active renewable sources
  const getActiveRenewableSources = useCallback(() => {
    const sources: string[] = [];
    if (solarPVIncluded) sources.push("Solar PV");
    if (windTurbineIncluded) sources.push("Wind");
    if (fuelCellIncluded) sources.push("Fuel Cell");
    if (dieselGenIncluded) sources.push("Diesel Generator");
    if (naturalGasGenIncluded) sources.push("Natural Gas Generator");
    return sources;
  }, [
    solarPVIncluded,
    windTurbineIncluded,
    fuelCellIncluded,
    dieselGenIncluded,
    naturalGasGenIncluded,
  ]);

  return {
    config: {
      includeRenewables,
      solarPVIncluded,
      solarCapacityKW,
      solarPanelType,
      solarPanelEfficiency,
      solarInverterType,
      windTurbineIncluded,
      windCapacityKW,
      windTurbineType,
      fuelCellIncluded,
      fuelCellCapacityKW,
      fuelCellType,
      fuelType,
      dieselGenIncluded,
      dieselGenCapacityKW,
      naturalGasGenIncluded,
      naturalGasCapacityKW,
    },
    setters: {
      setIncludeRenewables,
      setSolarPVIncluded,
      setSolarCapacityKW,
      setSolarPanelType,
      setSolarPanelEfficiency,
      setSolarInverterType,
      setWindTurbineIncluded,
      setWindCapacityKW,
      setWindTurbineType,
      setFuelCellIncluded,
      setFuelCellCapacityKW,
      setFuelCellType,
      setFuelType,
      setDieselGenIncluded,
      setDieselGenCapacityKW,
      setNaturalGasGenIncluded,
      setNaturalGasCapacityKW,
    },
    resetToDefaults,
    getTotalRenewableCapacityKW,
    getActiveRenewableSources,
  };
}
