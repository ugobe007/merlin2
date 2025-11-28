import { useMemo, useEffect } from 'react';
import type { ElectricalConfiguration } from './useElectricalConfiguration';
import type { RenewablesConfiguration } from './useRenewablesConfiguration';

/**
 * Advanced System Calculations Hook
 * 
 * Performs electrical calculations and cost estimates for BESS systems:
 * - Electrical calculations (watts, amps, inverters, transformers)
 * - System cost calculations based on capacity and pricing tiers
 * - Renewable energy integration costs
 * 
 * ⚠️ NOTE: This hook uses simplified pricing for AdvancedQuoteBuilder.
 * For accurate quotes, use equipmentCalculations.ts with database pricing.
 * 
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 3.2)
 */

export interface SystemCalculations {
  // Storage Capacity
  storageSizeMWh: number;
  
  // Electrical Calculations
  calculatedWatts: number;
  totalWatts: number;
  totalKW: number;
  calculatedAmpsAC: number;
  maxAmpsAC: number;
  calculatedAmpsDC: number;
  maxAmpsDC: number;
  numberOfInverters: number;
  requiredTransformerKVA: number;
  
  // Cost Breakdown
  systemCost: number;
  bessCapEx: number;
  solarCost: number;
  windCost: number;
  fuelCellCost: number;
  dieselCost: number;
  naturalGasCost: number;
  pricePerKwh: number;
}

interface UseAdvancedSystemCalculationsProps {
  storageSizeMW: number;
  durationHours: number;
  electricalConfig: ElectricalConfiguration;
  renewablesConfig: RenewablesConfiguration;
  onSystemCostChange?: (cost: number) => void;
}

/**
 * BESS pricing per kWh based on system size (Q4 2025 pricing)
 * 
 * ⚠️ WARNING: These are simplified estimates for the Advanced Quote Builder UI.
 * For accurate quotes, use equipmentCalculations.ts which fetches from database.
 * 
 * Database pricing keys:
 * - 'bess_pricing_2025' for battery costs
 * - 'power_electronics_2025' for inverters
 * 
 * @deprecated For accurate pricing, use calculateEquipmentBreakdown() from equipmentCalculations.ts
 */
function getBESSPricePerKwh(capacityKWh: number): number {
  // These are rough estimates aligned with market intelligence
  // Actual pricing should come from database via equipmentCalculations.ts
  if (capacityKWh >= 10000) {
    return 280; // Utility scale (>10 MWh): ~$280/kWh (NREL ATB 2024)
  } else if (capacityKWh >= 1000) {
    return 350; // Medium systems (1-10 MWh): ~$350/kWh
  }
  return 450; // Small systems (<1 MWh): ~$450/kWh
}

/**
 * Renewable energy cost per kW (installed)
 * 
 * ⚠️ WARNING: These are simplified estimates.
 * For accurate pricing, use equipmentCalculations.ts with database lookup.
 */
const RENEWABLE_COSTS = {
  solar: 850, // $850/kWp (commercial scale, includes installation)
  wind: 1500, // $1500/kW (onshore)
  fuelCell: 2000, // $2000/kW
  diesel: 800, // $800/kW
  naturalGas: 1000, // $1000/kW
};

/**
 * Balance of System and EPC multipliers
 */
const BOS_MULTIPLIER = 1.15; // 15% BOS costs
const EPC_MULTIPLIER = 1.10; // 10% EPC costs

export function useAdvancedSystemCalculations({
  storageSizeMW,
  durationHours,
  electricalConfig,
  renewablesConfig,
  onSystemCostChange,
}: UseAdvancedSystemCalculationsProps): SystemCalculations {
  
  // Storage capacity in MWh
  const storageSizeMWh = useMemo(() => {
    return storageSizeMW * durationHours;
  }, [storageSizeMW, durationHours]);
  
  // Electrical calculations
  const calculations = useMemo(() => {
    const calculatedWatts = storageSizeMW * 1000000; // Convert MW to W
    const totalWatts = electricalConfig.systemWattsInput !== '' 
      ? electricalConfig.systemWattsInput 
      : calculatedWatts;
    const totalKW = totalWatts / 1000; // Convert W to kW
    
    // 3-phase AC current calculation
    const calculatedAmpsAC = (totalWatts / electricalConfig.systemVoltage) / Math.sqrt(3);
    const maxAmpsAC = electricalConfig.systemAmpsACInput !== '' 
      ? electricalConfig.systemAmpsACInput 
      : calculatedAmpsAC;
    
    // DC current calculation
    const calculatedAmpsDC = totalWatts / electricalConfig.dcVoltage;
    const maxAmpsDC = electricalConfig.systemAmpsDCInput !== '' 
      ? electricalConfig.systemAmpsDCInput 
      : calculatedAmpsDC;
    
    // Number of inverters required
    const numberOfInverters = electricalConfig.numberOfInvertersInput || 
      Math.ceil(totalKW / electricalConfig.inverterRating);
    
    // Required transformer capacity with 25% safety factor
    const requiredTransformerKVA = totalKW * 1.25;
    
    return {
      calculatedWatts,
      totalWatts,
      totalKW,
      calculatedAmpsAC,
      maxAmpsAC,
      calculatedAmpsDC,
      maxAmpsDC,
      numberOfInverters,
      requiredTransformerKVA,
    };
  }, [
    storageSizeMW,
    electricalConfig.systemWattsInput,
    electricalConfig.systemAmpsACInput,
    electricalConfig.systemAmpsDCInput,
    electricalConfig.systemVoltage,
    electricalConfig.dcVoltage,
    electricalConfig.numberOfInvertersInput,
    electricalConfig.inverterRating,
  ]);
  
  // Cost calculations
  const costs = useMemo(() => {
    const effectiveBatteryKwh = storageSizeMWh * 1000;
    
    // Get BESS pricing based on system size
    const pricePerKwh = getBESSPricePerKwh(effectiveBatteryKwh);
    
    // Calculate base BESS cost
    const bessCapEx = effectiveBatteryKwh * pricePerKwh;
    
    // Calculate renewable costs if included
    const solarCost = renewablesConfig.solarPVIncluded 
      ? renewablesConfig.solarCapacityKW * RENEWABLE_COSTS.solar 
      : 0;
    const windCost = renewablesConfig.windTurbineIncluded 
      ? renewablesConfig.windCapacityKW * RENEWABLE_COSTS.wind 
      : 0;
    const fuelCellCost = renewablesConfig.fuelCellIncluded 
      ? renewablesConfig.fuelCellCapacityKW * RENEWABLE_COSTS.fuelCell 
      : 0;
    const dieselCost = renewablesConfig.dieselGenIncluded 
      ? renewablesConfig.dieselGenCapacityKW * RENEWABLE_COSTS.diesel 
      : 0;
    const naturalGasCost = renewablesConfig.naturalGasGenIncluded 
      ? renewablesConfig.naturalGasCapacityKW * RENEWABLE_COSTS.naturalGas 
      : 0;
    
    // Total system cost with BOS and EPC
    const systemCost = (bessCapEx * BOS_MULTIPLIER * EPC_MULTIPLIER) + 
      solarCost + windCost + fuelCellCost + dieselCost + naturalGasCost;
    
    return {
      systemCost,
      bessCapEx,
      solarCost,
      windCost,
      fuelCellCost,
      dieselCost,
      naturalGasCost,
      pricePerKwh,
    };
  }, [storageSizeMWh, renewablesConfig]);
  
  // Notify parent component when system cost changes
  useEffect(() => {
    if (onSystemCostChange) {
      onSystemCostChange(costs.systemCost);
    }
  }, [costs.systemCost, onSystemCostChange]);
  
  return {
    storageSizeMWh,
    ...calculations,
    ...costs,
  };
}
