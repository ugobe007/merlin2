/**
 * SOLAR CALCULATOR
 * Calculates solar PV system sizing and production
 * 
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 */

import type { Industry, SolarType } from '../contracts';

export interface SolarCalculationInput {
  peakDemandKW: number;
  annualConsumptionKWh: number;
  industry: Industry;
  useCaseData: Record<string, any>;
  state: string;
  sunHoursPerDay: number;
  userInterested: boolean;
  customSizeKw?: number;
}

export interface SolarCalculationResult {
  recommended: boolean;
  capacityKW: number;
  type: SolarType;
  annualProductionKWh: number;
  capacityFactor: number;
  estimatedCost: number;
  costPerWatt: number;
  roofAreaSqFt: number;
  coveragePercent: number;  // % of annual consumption covered
  sizingRationale: string;
  breakdown: {
    component: string;
    cost: number;
  }[];
}

// Solar constants
const SOLAR_CONSTANTS = {
  COST_PER_WATT: 1.20,           // $/W installed (commercial scale)
  PANEL_WATTS: 500,               // Watts per panel (modern panels)
  SQFT_PER_KW: 70,                // Roof area needed per kW
  DEGRADATION_ANNUAL: 0.005,      // 0.5% per year
  LIFETIME_YEARS: 25,
  MIN_SIZE_KW: 25,
  MAX_SIZE_KW: 10000,
};

// State solar capacity factors (annual kWh per kW installed)
const STATE_CAPACITY_FACTORS: Record<string, number> = {
  'AZ': 1800, 'NV': 1750, 'CA': 1650, 'NM': 1700, 'TX': 1550,
  'FL': 1500, 'CO': 1600, 'UT': 1650, 'HI': 1600, 'OR': 1300,
  'WA': 1200, 'NY': 1350, 'MA': 1400, 'IL': 1400, 'GA': 1450,
  'NC': 1450, 'PA': 1350, 'OH': 1350, 'MI': 1300,
};
const DEFAULT_CAPACITY_FACTOR = 1500; // kWh/kW/year

// Industry-specific solar configurations
const INDUSTRY_SOLAR_CONFIG: Record<string, {
  recommended: boolean;
  targetCoveragePercent: number;
  roofUtilization: number;  // % of roof that can have panels
  rationale: string;
}> = {
  hotel: {
    recommended: true,
    targetCoveragePercent: 40,
    roofUtilization: 0.60,
    rationale: 'Excellent daytime load match with guest services',
  },
  car_wash: {
    recommended: true,
    targetCoveragePercent: 50,
    roofUtilization: 0.30,  // Limited roof, but carport opportunity
    rationale: 'Peak wash hours align with solar production',
  },
  data_center: {
    recommended: true,
    targetCoveragePercent: 30,
    roofUtilization: 0.50,
    rationale: 'Consistent load benefits from solar + BESS',
  },
  hospital: {
    recommended: true,
    targetCoveragePercent: 25,
    roofUtilization: 0.40,
    rationale: 'Reduces grid dependence for critical facility',
  },
  manufacturing: {
    recommended: true,
    targetCoveragePercent: 35,
    roofUtilization: 0.70,  // Large flat roofs
    rationale: 'Large roof area, daytime production shift',
  },
  retail: {
    recommended: true,
    targetCoveragePercent: 50,
    roofUtilization: 0.65,
    rationale: 'Business hours match solar production',
  },
  office: {
    recommended: true,
    targetCoveragePercent: 45,
    roofUtilization: 0.50,
    rationale: 'Daytime occupancy aligns with solar',
  },
  warehouse: {
    recommended: true,
    targetCoveragePercent: 60,
    roofUtilization: 0.80,  // Very large flat roofs
    rationale: 'Excellent roof area for maximum solar',
  },
  restaurant: {
    recommended: true,
    targetCoveragePercent: 30,
    roofUtilization: 0.40,
    rationale: 'Lunch peak matches solar production',
  },
  college: {
    recommended: true,
    targetCoveragePercent: 35,
    roofUtilization: 0.45,
    rationale: 'Multiple buildings, educational showcase',
  },
  ev_charging: {
    recommended: true,
    targetCoveragePercent: 70,
    roofUtilization: 0.80,  // Carport canopy opportunity
    rationale: 'Solar + storage + EV is optimal combination',
  },
  cold_storage: {
    recommended: true,
    targetCoveragePercent: 40,
    roofUtilization: 0.75,
    rationale: 'Large flat roofs, consistent load',
  },
};

/**
 * Calculate solar PV system sizing
 */
export function calculateSolar(input: SolarCalculationInput): SolarCalculationResult {
  const config = INDUSTRY_SOLAR_CONFIG[input.industry] || {
    recommended: true,
    targetCoveragePercent: 40,
    roofUtilization: 0.50,
    rationale: 'Standard commercial solar application',
  };

  // Get state-specific capacity factor
  const capacityFactor = STATE_CAPACITY_FACTORS[input.state] || DEFAULT_CAPACITY_FACTOR;

  // If user provided custom size, use it
  if (input.customSizeKw !== undefined && input.customSizeKw > 0) {
    return buildResult(input.customSizeKw, capacityFactor, input, config, 'User specified size');
  }

  // If user not interested, return zero
  if (!input.userInterested && !config.recommended) {
    return buildResult(0, capacityFactor, input, config, 'Not recommended for this application');
  }

  // Calculate target size based on consumption coverage
  const targetAnnualKWh = input.annualConsumptionKWh * (config.targetCoveragePercent / 100);
  let targetKW = targetAnnualKWh / capacityFactor;

  // Check roof area constraint
  const availableRoofSqFt = (input.useCaseData.squareFootage || input.useCaseData.totalSqFt || 50000) * config.roofUtilization;
  const maxKWByRoof = availableRoofSqFt / SOLAR_CONSTANTS.SQFT_PER_KW;

  // Use the smaller of target or roof-constrained size
  let capacityKW = Math.min(targetKW, maxKWByRoof);

  // Apply min/max limits
  capacityKW = Math.max(SOLAR_CONSTANTS.MIN_SIZE_KW, Math.min(SOLAR_CONSTANTS.MAX_SIZE_KW, capacityKW));

  // Round to nearest 25 kW
  capacityKW = Math.round(capacityKW / 25) * 25;

  // If size is less than minimum, don't recommend
  if (capacityKW < SOLAR_CONSTANTS.MIN_SIZE_KW) {
    return buildResult(0, capacityFactor, input, config, 'Roof area insufficient for commercial solar');
  }

  const rationale = capacityKW < targetKW
    ? `${config.rationale}. Limited by available roof area.`
    : config.rationale;

  return buildResult(capacityKW, capacityFactor, input, config, rationale);
}

/**
 * Build the result object
 */
function buildResult(
  capacityKW: number,
  capacityFactor: number,
  input: SolarCalculationInput,
  config: typeof INDUSTRY_SOLAR_CONFIG[string],
  rationale: string
): SolarCalculationResult {
  const annualProductionKWh = capacityKW * capacityFactor;
  const coveragePercent = input.annualConsumptionKWh > 0
    ? Math.round((annualProductionKWh / input.annualConsumptionKWh) * 100)
    : 0;
  const roofAreaSqFt = capacityKW * SOLAR_CONSTANTS.SQFT_PER_KW;
  const totalCost = capacityKW * 1000 * SOLAR_CONSTANTS.COST_PER_WATT;

  return {
    recommended: capacityKW > 0,
    capacityKW,
    type: 'monocrystalline',
    annualProductionKWh: Math.round(annualProductionKWh),
    capacityFactor: capacityFactor / 8760, // Convert to ratio
    estimatedCost: Math.round(totalCost),
    costPerWatt: SOLAR_CONSTANTS.COST_PER_WATT,
    roofAreaSqFt: Math.round(roofAreaSqFt),
    coveragePercent,
    sizingRationale: rationale,
    breakdown: capacityKW > 0 ? [
      { component: 'Solar Panels', cost: Math.round(totalCost * 0.45) },
      { component: 'Inverters', cost: Math.round(totalCost * 0.15) },
      { component: 'Racking & Mounting', cost: Math.round(totalCost * 0.15) },
      { component: 'Electrical & Wiring', cost: Math.round(totalCost * 0.10) },
      { component: 'Installation Labor', cost: Math.round(totalCost * 0.15) },
    ] : [],
  };
}

/**
 * Get sun hours for a state
 */
export function getSunHoursForState(state: string): number {
  const SUN_HOURS: Record<string, number> = {
    'AZ': 6.5, 'NV': 6.3, 'CA': 5.8, 'NM': 6.2, 'TX': 5.5,
    'FL': 5.6, 'CO': 5.5, 'UT': 5.8, 'HI': 5.5, 'OR': 4.5,
    'WA': 4.2, 'NY': 4.5, 'MA': 4.6, 'IL': 4.8, 'GA': 5.2,
    'NC': 5.0, 'PA': 4.6, 'OH': 4.5, 'MI': 4.4,
  };
  return SUN_HOURS[state] || 5.0;
}

/**
 * Get solar rating (A-D) based on sun hours
 */
export function getSolarRating(sunHours: number): 'A' | 'B' | 'C' | 'D' {
  if (sunHours >= 6.0) return 'A';
  if (sunHours >= 5.0) return 'B';
  if (sunHours >= 4.0) return 'C';
  return 'D';
}
