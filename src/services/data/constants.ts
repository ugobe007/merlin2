/**
 * MERLIN CONSTANTS
 * 
 * This file re-exports constants from calculationConstantsService.
 * The DATABASE is the single source of truth.
 * 
 * For async database values, use:
 *   import { getConstant, getFinancialConstant } from '@/services/calculationConstantsService';
 * 
 * For synchronous fallback values (used when DB not available), use:
 *   import { DEFAULTS } from '@/services/data/constants';
 * 
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 */

// ============================================================================
// SYNCHRONOUS DEFAULTS (TypeScript fallbacks when DB unavailable)
// These MUST match the database values - database is authoritative
// ============================================================================

export const DEFAULTS = {
  // BESS
  BESS_COST_PER_KWH: 350,
  BESS_COST_PER_KW: 150,
  BESS_EFFICIENCY: 0.85,
  BESS_DEGRADATION_ANNUAL: 0.025,
  BESS_WARRANTY_YEARS: 15,
  BESS_MIN_POWER_KW: 50,
  BESS_MAX_POWER_KW: 50000,
  BESS_MIN_DURATION_HOURS: 2,
  BESS_MAX_DURATION_HOURS: 8,

  // Solar
  SOLAR_COST_PER_WATT: 1.20,
  SOLAR_COST_PER_KWP: 1200,
  SOLAR_PANEL_WATTS: 500,
  SOLAR_SQFT_PER_KW: 70,
  SOLAR_CAPACITY_FACTOR: 0.20,
  SOLAR_DEGRADATION_ANNUAL: 0.005,
  SOLAR_LIFETIME_YEARS: 25,
  SOLAR_MIN_SIZE_KW: 25,
  SOLAR_MAX_SIZE_KW: 10000,

  // Generator
  GENERATOR_COST_PER_KW_DIESEL: 800,
  GENERATOR_COST_PER_KW_NATGAS: 650,
  GENERATOR_FUEL_COST_PER_GAL: 4.00,
  GENERATOR_EFFICIENCY: 0.35,
  GENERATOR_MAINTENANCE_PERCENT: 0.03,
  GENERATOR_RUNTIME_HOURS: 24,

  // EV Charging
  EV_L2_POWER_KW: 19.2,
  EV_L2_COST: 6000,
  EV_DCFC_POWER_KW: 150,
  EV_DCFC_COST: 75000,
  EV_ULTRAFAST_POWER_KW: 350,
  EV_ULTRAFAST_COST: 150000,
  EV_INSTALLATION_MULTIPLIER: 1.3,

  // Financial
  INSTALLATION_PERCENT: 0.15,
  FEDERAL_ITC_RATE: 0.30,
  DISCOUNT_RATE: 0.08,
  ELECTRICITY_ESCALATION: 0.03,
  PROJECT_LIFETIME_YEARS: 25,
  PEAK_SHAVING_PERCENT: 0.25,
  ARBITRAGE_CYCLES_YEAR: 250,
  ARBITRAGE_SPREAD: 0.06,

  // Environmental
  CO2_KG_PER_KWH: 0.40,
  CO2_PER_TREE_YEAR: 22,
  CO2_PER_CAR_YEAR: 4600,

  // Validation
  MAX_BESS_SCALE: 2.5,
  MAX_SOLAR_SCALE: 2.5,
  MAX_GENERATOR_SCALE: 3.0,
  MIN_SYSTEM_SIZE: 0.5,
  MAX_PAYBACK_YEARS: 50,
  PAYBACK_TOLERANCE: 1.0,
  ROI_TOLERANCE: 20,
} as const;

// ============================================================================
// STATIC DATA (not in database - rarely changes)
// ============================================================================

export const HIGH_RISK_STATES = [
  'FL', 'LA', 'TX', 'NC', 'SC', 'GA', 'AL', 'MS', 'PR', 'VI'
] as const;

export const STANDARD_GENERATOR_SIZES = [
  50, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 500,
  600, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000, 7500, 10000
] as const;

export const STATE_SUN_HOURS: Record<string, number> = {
  'AZ': 6.5, 'NV': 6.3, 'CA': 5.8, 'NM': 6.2, 'TX': 5.5,
  'FL': 5.6, 'CO': 5.5, 'UT': 5.8, 'HI': 5.5, 'OR': 4.5,
  'WA': 4.2, 'NY': 4.5, 'MA': 4.6, 'IL': 4.8, 'GA': 5.2,
  'NC': 5.0, 'PA': 4.6, 'OH': 4.5, 'MI': 4.4,
};

export const STATE_CAPACITY_FACTORS: Record<string, number> = {
  'AZ': 1800, 'NV': 1750, 'CA': 1650, 'NM': 1700, 'TX': 1550,
  'FL': 1500, 'CO': 1600, 'UT': 1650, 'HI': 1600, 'OR': 1300,
  'WA': 1200, 'NY': 1350, 'MA': 1400, 'IL': 1400, 'GA': 1450,
  'NC': 1450, 'PA': 1350, 'OH': 1350, 'MI': 1300,
};

export const STATE_INCENTIVE_RATES: Record<string, number> = {
  'CA': 0.10, 'MA': 0.08, 'NY': 0.07, 'NJ': 0.06, 'CT': 0.05,
  'MD': 0.05, 'OR': 0.04, 'CO': 0.04, 'AZ': 0.03, 'TX': 0.02,
};

// ============================================================================
// HELPER: Get constant with database fallback
// ============================================================================

import { getConstant } from '../calculationConstantsService';

/**
 * Get a constant value, trying database first, then fallback
 * @param key - The constant key (e.g., 'federal_itc_rate')
 * @param fallbackKey - The key in DEFAULTS object
 */
export async function getConstantWithFallback(
  dbKey: string,
  fallbackKey: keyof typeof DEFAULTS
): Promise<number> {
  try {
    const dbValue = await getConstant(dbKey);
    if (dbValue !== null && dbValue !== undefined) {
      return dbValue;
    }
  } catch (error) {
    console.warn(`[Constants] DB lookup failed for ${dbKey}, using fallback`);
  }
  return DEFAULTS[fallbackKey];
}
