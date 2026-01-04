/**
 * CALCULATION CONSTANTS - SSOT
 * ============================
 * 
 * Single Source of Truth for all calculation constants.
 * 
 * Priority order:
 * 1. Database (calculation_constants table via calculationConstantsService)
 * 2. These fallback values
 * 
 * Migrated from: TrueQuoteEngine.ts TRUEQUOTE_CONSTANTS
 */

import { getConstant } from '../calculationConstantsService';

// ============================================================================
// TRUEQUOTE CONSTANTS (migrated from TrueQuoteEngine.ts)
// ============================================================================

export const TRUEQUOTE_CONSTANTS = {
  // BESS
  BESS_COST_PER_KWH: 350,
  BESS_EFFICIENCY: 0.85,
  BESS_DEGRADATION_ANNUAL: 0.025,
  BESS_LIFETIME_YEARS: 15,
  
  // Solar
  SOLAR_COST_PER_KWP: 1200,
  SOLAR_PANEL_WATTS: 500,
  SOLAR_CAPACITY_FACTOR: 0.2,
  SOLAR_DEGRADATION_ANNUAL: 0.005,
  SOLAR_LIFETIME_YEARS: 25,
  
  // Generator
  GENERATOR_COST_PER_KW: 800,
  GENERATOR_FUEL_COST: 4.0,
  GENERATOR_EFFICIENCY: 0.35,
  
  // EV Charging
  EV_LEVEL2_KW: 19.2,
  EV_LEVEL2_COST: 6000,
  EV_DCFAST_KW: 150,
  EV_DCFAST_COST: 50000,
  EV_ULTRAFAST_KW: 350,
  EV_ULTRAFAST_COST: 150000,
  
  // Financial
  INSTALLATION_PERCENT: 0.15,
  FEDERAL_ITC_RATE: 0.3,
  DISCOUNT_RATE: 0.08,
  ELECTRICITY_ESCALATION: 0.03,
  PROJECT_LIFETIME_YEARS: 25,
  
  // Savings
  PEAK_SHAVING_PERCENT: 0.25,
  ARBITRAGE_CYCLES_YEAR: 250,
  ARBITRAGE_SPREAD: 0.06,
  
  // Environmental
  CO2_KG_PER_KWH: 0.4,
  CO2_PER_TREE_YEAR: 22,
  CO2_PER_CAR_YEAR: 4600,
  
  // Validation
  DEVIATION_WARN_PERCENT: 15,
  DEVIATION_CRITICAL_PERCENT: 50,
} as const;

// ============================================================================
// DEFAULTS (structured format for calculators)
// ============================================================================

export const DEFAULTS = {
  BESS: {
    costPerKWh: TRUEQUOTE_CONSTANTS.BESS_COST_PER_KWH,
    costPerKW: 150,
    efficiency: TRUEQUOTE_CONSTANTS.BESS_EFFICIENCY,
    degradationRate: TRUEQUOTE_CONSTANTS.BESS_DEGRADATION_ANNUAL,
    warrantyYears: TRUEQUOTE_CONSTANTS.BESS_LIFETIME_YEARS,
    roundTripEfficiency: 0.85,
  },
  Solar: {
    costPerWatt: TRUEQUOTE_CONSTANTS.SOLAR_COST_PER_KWP / 1000, // Convert to $/W
    panelWatts: TRUEQUOTE_CONSTANTS.SOLAR_PANEL_WATTS,
    capacityFactor: TRUEQUOTE_CONSTANTS.SOLAR_CAPACITY_FACTOR,
    degradationRate: TRUEQUOTE_CONSTANTS.SOLAR_DEGRADATION_ANNUAL,
    lifetimeYears: TRUEQUOTE_CONSTANTS.SOLAR_LIFETIME_YEARS,
    sqftPerKW: 70,
  },
  Generator: {
    dieselCostPerKW: TRUEQUOTE_CONSTANTS.GENERATOR_COST_PER_KW,
    natgasCostPerKW: 650,
    maintenancePercent: 0.03,
    fuelCostPerGallon: TRUEQUOTE_CONSTANTS.GENERATOR_FUEL_COST,
    efficiency: TRUEQUOTE_CONSTANTS.GENERATOR_EFFICIENCY,
    runtimeHours: 24,
  },
  EV: {
    l2PowerKW: TRUEQUOTE_CONSTANTS.EV_LEVEL2_KW,
    l2Cost: TRUEQUOTE_CONSTANTS.EV_LEVEL2_COST,
    dcfcPowerKW: TRUEQUOTE_CONSTANTS.EV_DCFAST_KW,
    dcfcCost: TRUEQUOTE_CONSTANTS.EV_DCFAST_COST,
    ultraFastPowerKW: TRUEQUOTE_CONSTANTS.EV_ULTRAFAST_KW,
    ultraFastCost: TRUEQUOTE_CONSTANTS.EV_ULTRAFAST_COST,
    installationMultiplier: 1.3,
    utilizationRate: 0.15,
  },
  Financial: {
    federalITC: TRUEQUOTE_CONSTANTS.FEDERAL_ITC_RATE,
    installationPercent: TRUEQUOTE_CONSTANTS.INSTALLATION_PERCENT,
    discountRate: TRUEQUOTE_CONSTANTS.DISCOUNT_RATE,
    electricityEscalation: TRUEQUOTE_CONSTANTS.ELECTRICITY_ESCALATION,
    projectLifetimeYears: TRUEQUOTE_CONSTANTS.PROJECT_LIFETIME_YEARS,
    peakShavingPercent: TRUEQUOTE_CONSTANTS.PEAK_SHAVING_PERCENT,
    arbitrageCyclesPerYear: TRUEQUOTE_CONSTANTS.ARBITRAGE_CYCLES_YEAR,
    arbitrageSpread: TRUEQUOTE_CONSTANTS.ARBITRAGE_SPREAD,
  },
  Environmental: {
    co2PerKWh: TRUEQUOTE_CONSTANTS.CO2_KG_PER_KWH,
    co2PerTreeYear: TRUEQUOTE_CONSTANTS.CO2_PER_TREE_YEAR,
    co2PerCarYear: TRUEQUOTE_CONSTANTS.CO2_PER_CAR_YEAR,
  },
  Validation: {
    deviationWarnPercent: TRUEQUOTE_CONSTANTS.DEVIATION_WARN_PERCENT,
    deviationCriticalPercent: TRUEQUOTE_CONSTANTS.DEVIATION_CRITICAL_PERCENT,
    maxBessScale: 2.5,
    maxSolarScale: 2.5,
    maxGeneratorScale: 3.0,
    maxPaybackYears: 50,
    paybackTolerance: 1.0,
    roiTolerance: 20,
    minCostPerKWh: 200,
    maxCostPerKWh: 600,
  },
} as const;

// ============================================================================
// HIGH-RISK STATES (for generator recommendations)
// ============================================================================

export const HIGH_RISK_STATES = [
  'FL', 'LA', 'TX', 'NC', 'SC', 'GA', 'AL', 'MS', 'PR', 'VI'
] as const;

// ============================================================================
// STANDARD GENERATOR SIZES (kW)
// ============================================================================

export const STANDARD_GENERATOR_SIZES = [
  50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600, 750, 1000, 
  1250, 1500, 1750, 2000, 2500, 3000
] as const;

// ============================================================================
// STATE SUN HOURS (peak sun hours per day)
// ============================================================================

export const STATE_SUN_HOURS: Record<string, number> = {
  AZ: 6.5, NV: 6.4, NM: 6.2, CA: 5.8, UT: 5.8, CO: 5.5, TX: 5.5, 
  FL: 5.6, HI: 5.5, GA: 5.2, NC: 5.0, SC: 5.1, AL: 5.0, LA: 5.1, 
  OK: 5.4, KS: 5.2, MO: 4.8, AR: 5.0, MS: 5.0, TN: 4.8, KY: 4.4,
  VA: 4.7, MD: 4.5, DC: 4.5, PA: 4.2, NJ: 4.4, NY: 4.2, CT: 4.3,
  MA: 4.3, RI: 4.2, NH: 4.1, VT: 4.0, ME: 4.0, OH: 4.0, IN: 4.3,
  IL: 4.5, MI: 4.0, WI: 4.2, MN: 4.3, IA: 4.5, NE: 4.9, SD: 4.8,
  ND: 4.6, MT: 4.8, WY: 5.5, ID: 5.0, WA: 4.0, OR: 4.2, AK: 3.5,
};

// ============================================================================
// STATE CAPACITY FACTORS (kWh/kW/year for solar)
// ============================================================================

export const STATE_CAPACITY_FACTORS: Record<string, number> = {
  AZ: 1800, NV: 1750, NM: 1700, CA: 1650, UT: 1600, CO: 1550, TX: 1500,
  FL: 1500, HI: 1550, GA: 1450, NC: 1400, SC: 1420, AL: 1400, LA: 1420,
  OK: 1480, KS: 1450, MO: 1350, AR: 1400, MS: 1400, TN: 1350, KY: 1300,
  VA: 1350, MD: 1320, DC: 1320, PA: 1280, NJ: 1300, NY: 1250, CT: 1280,
  MA: 1300, RI: 1280, NH: 1250, VT: 1220, ME: 1250, OH: 1250, IN: 1280,
  IL: 1320, MI: 1220, WI: 1250, MN: 1280, IA: 1320, NE: 1380, SD: 1350,
  ND: 1320, MT: 1350, WY: 1450, ID: 1400, WA: 1200, OR: 1250, AK: 1000,
};

// ============================================================================
// STATE INCENTIVE RATES (additional state ITC or rebates as decimal)
// ============================================================================

export const STATE_INCENTIVE_RATES: Record<string, number> = {
  CA: 0.00, NY: 0.00, MA: 0.00, NJ: 0.00, CT: 0.00, MD: 0.00,
  // Most states don't have additional ITC on top of federal
  // This is for state-specific solar/storage incentives
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a constant with database fallback
 * Tries to fetch from database first, falls back to DEFAULTS
 */
export async function getConstantWithFallback(
  dbKey: string,
  fallbackCategory: keyof typeof DEFAULTS,
  fallbackKey: string
): Promise<number> {
  try {
    const dbValue = await getConstant(dbKey);
    if (dbValue !== null && typeof dbValue === 'number') {
      return dbValue;
    }
  } catch (error) {
    console.warn(`[constants] Failed to fetch ${dbKey} from database, using fallback`);
  }
  
  const category = DEFAULTS[fallbackCategory] as Record<string, number>;
  return category[fallbackKey] ?? 0;
}

/**
 * Get sun hours for a state
 */
export function getSunHours(stateCode: string): number {
  return STATE_SUN_HOURS[stateCode.toUpperCase()] || 4.5; // Default to US average
}

/**
 * Get solar capacity factor for a state
 */
export function getCapacityFactor(stateCode: string): number {
  return STATE_CAPACITY_FACTORS[stateCode.toUpperCase()] || 1400; // Default to US average
}

/**
 * Check if state is high-risk for outages
 */
export function isHighRiskState(stateCode: string): boolean {
  return HIGH_RISK_STATES.includes(stateCode.toUpperCase() as typeof HIGH_RISK_STATES[number]);
}

/**
 * Round to nearest standard generator size
 */
export function roundToStandardGeneratorSize(kw: number): number {
  let closest: number = STANDARD_GENERATOR_SIZES[0];
  let minDiff = Math.abs(kw - closest);
  
  for (const size of STANDARD_GENERATOR_SIZES) {
    const diff = Math.abs(kw - size);
    if (diff < minDiff) {
      minDiff = diff;
      closest = size;
    }
  }
  
  return closest;
}
