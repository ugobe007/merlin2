/**
 * @deprecated This file has been moved to @/core/calculations/sizing/
 *
 * MIGRATION NOTICE (Stage 4 - Completed):
 * This file is now located at: src/core/calculations/sizing/bessCalculator.ts
 *
 * Please update your imports to:
 * import { ... } from '@/core/calculations/sizing';
 *
 * This file will be removed in a future cleanup phase.
 *
 * ---
 *
 * Grid-Synk Industry-Standard BESS Calculations
 * Source: https://grid-synk.com/bess-roi-calculator/
 * LinkedIn: https://www.linkedin.com/posts/yitming_bess-roi-epc-activity-7393855508987863040-Juaq
 *
 * Industry-standard formulas for BESS sizing, efficiency, and equipment selection
 * Based on real-world deployments and manufacturer specifications
 */

// ============================================================================
// BATTERY PERFORMANCE PARAMETERS (Industry Standards)
// ============================================================================

export interface BatteryPerformanceParams {
  depthOfDischarge: number; // DoD % (typically 90%)
  staticEfficiency: number; // % (self-discharge, BMS standby - typically 90%)
  cycleEfficiency: number; // % (PCS conversion, internal resistance - typically 95%)
  cycleLife: number; // cycles (typically 6000 cycles)
  cyclesPerDay: number; // typically 1
  equivalentYears: number; // cycleLife / (cyclesPerDay * 365)
}

export const DEFAULT_BATTERY_PERFORMANCE: BatteryPerformanceParams = {
  depthOfDischarge: 90, // 90% DoD is industry standard
  staticEfficiency: 90, // Accounts for self-discharge, BMS standby consumption
  cycleEfficiency: 95, // PCS conversion efficiency and battery internal resistance
  cycleLife: 6000, // 6000 cycles
  cyclesPerDay: 1, // 1 cycle per day
  equivalentYears: 20, // 6000 cycles / (1 cycle/day * 365 days) ≈ 16-20 years
};

// ============================================================================
// C-RATE PARAMETERS (Charging/Discharging Rate)
// ============================================================================

export interface CRateParams {
  customerCRate: number; // Customer specified C-Rate (max 0.5C recommended)
  maxCRate: number; // Maximum safe C-Rate (0.5C for most applications)
}

export const DEFAULT_CRATE: CRateParams = {
  customerCRate: 0.25, // 0.25C = 4 hour charge/discharge
  maxCRate: 0.5, // 0.5C maximum for safety and battery life
};

// ============================================================================
// STANDARD BATTERY MODELS (Based on Grid-Synk Industry Data)
// ============================================================================

export interface BatteryModel {
  name: string;
  capacityKWh: number;
  ratedPowerKW: number;
  voltage: string;
  chemistry: string;
  manufacturer?: string;
}

export const STANDARD_BATTERY_MODELS: BatteryModel[] = [
  {
    name: "261kWh Battery Model",
    capacityKWh: 261,
    ratedPowerKW: 130, // 0.5C max
    voltage: "400V",
    chemistry: "LFP",
  },
  {
    name: "3727.36kWh Battery Model",
    capacityKWh: 3727.36,
    ratedPowerKW: 1863, // 0.5C max
    voltage: "690V",
    chemistry: "LFP",
  },
  {
    name: "5015.9kWh Battery Model",
    capacityKWh: 5015.9,
    ratedPowerKW: 2508, // 0.5C max
    voltage: "690V",
    chemistry: "LFP",
  },
];

// ============================================================================
// PCS (Power Conversion System) MODELS
// ============================================================================

export interface PCSModel {
  name: string;
  ratedPowerMW: number;
  outputVoltage: string;
  efficiency: number;
  type: string;
}

export const STANDARD_PCS_MODELS: PCSModel[] = [
  {
    name: "PCS 1.25MW",
    ratedPowerMW: 1.25,
    outputVoltage: "0.69kV",
    efficiency: 98.5,
    type: "Grid-Following, Bi-Directional, IP65",
  },
  {
    name: "PCS 1.5MW",
    ratedPowerMW: 1.5,
    outputVoltage: "0.69kV",
    efficiency: 98.5,
    type: "Grid-Following, Bi-Directional, IP65",
  },
  {
    name: "PCS 1.75MW",
    ratedPowerMW: 1.75,
    outputVoltage: "0.69kV",
    efficiency: 98.5,
    type: "Grid-Following, Bi-Directional, IP65",
  },
  {
    name: "PCS 2MW",
    ratedPowerMW: 2.0,
    outputVoltage: "0.69kV",
    efficiency: 98.5,
    type: "Grid-Following, Bi-Directional, IP65",
  },
  {
    name: "PCS 2.5MW",
    ratedPowerMW: 2.5,
    outputVoltage: "0.69kV",
    efficiency: 98.5,
    type: "Grid-Following, Bi-Directional, IP65",
  },
  {
    name: "PCS 5MW",
    ratedPowerMW: 5.0,
    outputVoltage: "0.69kV",
    efficiency: 98.5,
    type: "Grid-Following, Bi-Directional, IP65",
  },
];

// ============================================================================
// TRANSFORMER MODELS
// ============================================================================

export interface TransformerModel {
  name: string;
  ratedPowerMVA: number;
  primaryVoltage: string;
  secondaryVoltage: string;
  type: string;
}

export const STANDARD_TRANSFORMER_MODELS: TransformerModel[] = [
  {
    name: "1.25MVA Transformer",
    ratedPowerMVA: 1.25,
    primaryVoltage: "0.69kV",
    secondaryVoltage: "0.4kV",
    type: "Dry-Type, Step-Down",
  },
  {
    name: "1.5MVA Transformer",
    ratedPowerMVA: 1.5,
    primaryVoltage: "0.69kV",
    secondaryVoltage: "0.4kV",
    type: "Dry-Type, Step-Down",
  },
  {
    name: "1.75MVA Transformer",
    ratedPowerMVA: 1.75,
    primaryVoltage: "0.69kV",
    secondaryVoltage: "0.4kV",
    type: "Dry-Type, Step-Down",
  },
  {
    name: "2MVA Transformer",
    ratedPowerMVA: 2.0,
    primaryVoltage: "0.69kV",
    secondaryVoltage: "0.4kV",
    type: "Dry-Type, Step-Down",
  },
  {
    name: "2.5MVA Transformer",
    ratedPowerMVA: 2.5,
    primaryVoltage: "0.69kV",
    secondaryVoltage: "0.4kV",
    type: "Dry-Type, Step-Down",
  },
  {
    name: "3.5MVA Transformer",
    ratedPowerMVA: 3.5,
    primaryVoltage: "0.69kV",
    secondaryVoltage: "0.4kV",
    type: "Dry-Type, Step-Down",
  },
  {
    name: "5MVA Transformer",
    ratedPowerMVA: 5.0,
    primaryVoltage: "0.69kV",
    secondaryVoltage: "0.4kV",
    type: "Dry-Type, Step-Down",
  },
];

// ============================================================================
// BESS SIZING CALCULATIONS (Grid-Synk Method)
// ============================================================================

export interface BESSSizingInput {
  customerLoadMW: number; // Load that BESS must support
  durationHours: number; // How long BESS must discharge
  customerCRate?: number; // Optional C-Rate (defaults to 0.25C)
  dod?: number; // Optional DoD (defaults to 90%)
  staticEfficiency?: number; // Optional (defaults to 90%)
  cycleEfficiency?: number; // Optional (defaults to 95%)
}

export interface BESSSizingResult {
  // Battery Requirements
  initialBatteryCapacityMWh: number;
  afterDoDMWh: number;
  afterStaticEfficiencyMWh: number;
  afterCycleEfficiencyMWh: number;
  requiredBatteryCapacityMWh: number;
  usableBatteryCapacityMWh: number;

  // Discharge Parameters
  requiredDischargingPowerMW: number;
  customerCRate: number;
  batterySizeBasedOnCRateMW: number;
  cRateSufficient: boolean;

  // Charging Parameters
  maxChargePowerMW: number;
  fullChargeTimeHours: number;

  // Equipment Recommendations
  recommendedBatteryModels: Array<{
    model: string;
    quantity: number;
    totalCapacityMWh: number;
  }>;
  recommendedPCS: {
    model: string;
    quantity: number;
    totalPowerMW: number;
  };
  recommendedTransformer: {
    model: string;
    quantity: number;
    totalPowerMVA: number;
  };
}

/**
 * Calculate BESS sizing using Grid-Synk industry-standard methodology
 *
 * Formula breakdown:
 * 1. Initial Capacity = Customer Load (MW) × Duration (hours)
 * 2. After DoD = Initial Capacity / (DoD %)
 * 3. After Static Efficiency = After DoD / (Static Efficiency %)
 * 4. After Cycle Efficiency = After Static Efficiency / (Cycle Efficiency %)
 * 5. Required Capacity = After Cycle Efficiency (this is what you must buy)
 */
export function calculateBESSSizing(input: BESSSizingInput): BESSSizingResult {
  // Use defaults or provided values
  const dod = (input.dod || DEFAULT_BATTERY_PERFORMANCE.depthOfDischarge) / 100;
  const staticEff = (input.staticEfficiency || DEFAULT_BATTERY_PERFORMANCE.staticEfficiency) / 100;
  const cycleEff = (input.cycleEfficiency || DEFAULT_BATTERY_PERFORMANCE.cycleEfficiency) / 100;
  const cRate = input.customerCRate || DEFAULT_CRATE.customerCRate;

  // Step 1: Calculate initial battery capacity (energy needed)
  const initialBatteryCapacityMWh = input.customerLoadMW * input.durationHours;

  // Step 2: Account for Depth of Discharge
  // If DoD = 90%, we can only use 90% of battery, so we need more capacity
  const afterDoDMWh = initialBatteryCapacityMWh / dod;

  // Step 3: Account for Static Efficiency (self-discharge, BMS standby)
  const afterStaticEfficiencyMWh = afterDoDMWh / staticEff;

  // Step 4: Account for Cycle Efficiency (PCS conversion, internal resistance)
  const afterCycleEfficiencyMWh = afterStaticEfficiencyMWh / cycleEff;

  // Step 5: Required Battery Capacity (what you must purchase)
  const requiredBatteryCapacityMWh = afterCycleEfficiencyMWh;

  // Usable capacity after factoring in DoD
  const usableBatteryCapacityMWh = requiredBatteryCapacityMWh * dod;

  // Discharge Parameters
  const requiredDischargingPowerMW = input.customerLoadMW;
  const batterySizeBasedOnCRateMW = usableBatteryCapacityMWh * cRate;
  const cRateSufficient = batterySizeBasedOnCRateMW >= requiredDischargingPowerMW;

  // Charging Parameters
  const maxChargePowerMW = usableBatteryCapacityMWh * cRate;
  const fullChargeTimeHours = usableBatteryCapacityMWh / maxChargePowerMW;

  // Equipment Recommendations
  const recommendedBatteryModels = selectBatteryModels(requiredBatteryCapacityMWh);
  const recommendedPCS = selectPCS(maxChargePowerMW);
  const recommendedTransformer = selectTransformer(recommendedPCS.totalPowerMW);

  return {
    initialBatteryCapacityMWh,
    afterDoDMWh,
    afterStaticEfficiencyMWh,
    afterCycleEfficiencyMWh,
    requiredBatteryCapacityMWh,
    usableBatteryCapacityMWh,
    requiredDischargingPowerMW,
    customerCRate: cRate,
    batterySizeBasedOnCRateMW,
    cRateSufficient,
    maxChargePowerMW,
    fullChargeTimeHours,
    recommendedBatteryModels,
    recommendedPCS,
    recommendedTransformer,
  };
}

/**
 * Select optimal battery models based on required capacity
 */
function selectBatteryModels(
  requiredCapacityMWh: number
): Array<{ model: string; quantity: number; totalCapacityMWh: number }> {
  const results = [];

  // Try 5015.9kWh model (larger)
  const largeModelQty = Math.ceil((requiredCapacityMWh * 1000) / 5015.9);
  results.push({
    model: "5015.9kWh Battery",
    quantity: largeModelQty,
    totalCapacityMWh: (largeModelQty * 5015.9) / 1000,
  });

  // Try 3727.36kWh model (smaller)
  const smallModelQty = Math.ceil((requiredCapacityMWh * 1000) / 3727.36);
  results.push({
    model: "3727.36kWh Battery",
    quantity: smallModelQty,
    totalCapacityMWh: (smallModelQty * 3727.36) / 1000,
  });

  return results;
}

/**
 * Select optimal PCS based on required power
 */
function selectPCS(requiredPowerMW: number): {
  model: string;
  quantity: number;
  totalPowerMW: number;
} {
  // Find smallest PCS that can handle the load
  for (const pcs of STANDARD_PCS_MODELS) {
    const qty = Math.ceil(requiredPowerMW / pcs.ratedPowerMW);
    if (qty * pcs.ratedPowerMW >= requiredPowerMW) {
      return {
        model: pcs.name,
        quantity: qty,
        totalPowerMW: qty * pcs.ratedPowerMW,
      };
    }
  }

  // Default to 5MW if nothing fits
  const qty = Math.ceil(requiredPowerMW / 5.0);
  return {
    model: "PCS 5MW",
    quantity: qty,
    totalPowerMW: qty * 5.0,
  };
}

/**
 * Select optimal transformer based on PCS power
 */
function selectTransformer(pcsPowerMW: number): {
  model: string;
  quantity: number;
  totalPowerMVA: number;
} {
  // Transformer MVA rating should be ≥ PCS MW rating / power factor
  const powerFactor = 0.95;
  const requiredMVA = pcsPowerMW / powerFactor;

  // Find smallest transformer
  for (const transformer of STANDARD_TRANSFORMER_MODELS) {
    const qty = Math.ceil(requiredMVA / transformer.ratedPowerMVA);
    if (qty * transformer.ratedPowerMVA >= requiredMVA) {
      return {
        model: transformer.name,
        quantity: qty,
        totalPowerMVA: qty * transformer.ratedPowerMVA,
      };
    }
  }

  // Default to 5MVA
  const qty = Math.ceil(requiredMVA / 5.0);
  return {
    model: "5MVA Transformer",
    quantity: qty,
    totalPowerMVA: qty * 5.0,
  };
}

// ============================================================================
// SOLAR + INVERTER DESIGN (From Grid-Synk Calculator)
// ============================================================================

export interface SolarDesignParams {
  vdcMax: number; // Inverter Maximum DC Input Voltage (V)
  voc: number; // Solar Module Open-Circuit Voltage at STC (V)
  tempMin: number; // Minimum Expected Site Temperature (°C)
  kv: number; // Temperature Coefficient of Voc (%/°C)
  vpm: number; // Solar Module Maximum Power Point Voltage at STC (V)
  tempMax: number; // Maximum Expected Site Temperature (°C)
  kvPrime: number; // Temperature Coefficient of Vmp (%/°C)
  vmpptMax: number; // Inverter MPPT Maximum Operating Window (V)
  vmpptMin: number; // Inverter MPPT Minimum Operating Window (V)
}

export interface SolarDesignResult {
  maxSeriesModules: number;
  minSeriesModules: number;
  recommendedSeriesModules: number;
}

/**
 * Calculate optimal solar module series configuration
 * Based on Grid-Synk formula
 */
export function calculateSolarModuleSeries(params: SolarDesignParams): SolarDesignResult {
  // Formula 1: Maximum number of series modules (based on Voc at cold temp)
  const vocAtCold = params.voc * (1 + (params.tempMin - 25) * (params.kv / 100));
  const maxSeriesModules = Math.floor(params.vdcMax / vocAtCold);

  // Formula 2: Minimum series modules for MPPT range (based on Vmp at hot temp)
  const vmpAtHot = params.vpm * (1 + (params.tempMax - 25) * (params.kvPrime / 100));
  const minSeriesModules = Math.ceil(params.vmpptMin / vmpAtHot);

  // Recommended: Take the stricter (lower) number to satisfy both conditions
  const recommendedSeriesModules = Math.min(maxSeriesModules, 20); // 20 is typical maximum

  return {
    maxSeriesModules,
    minSeriesModules,
    recommendedSeriesModules: Math.max(
      minSeriesModules,
      Math.min(recommendedSeriesModules, maxSeriesModules)
    ),
  };
}
