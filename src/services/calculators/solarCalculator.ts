/**
 * SOLAR CALCULATOR
 * ================
 * Calculates solar PV system sizing and production
 * 
 * SSOT: Pulls state data from database via stateSolarService
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 * 
 * Updated: January 2026 - Database integration
 */

import type { Industry, SolarType } from '../contracts';
import { getStateSolarData, type StateSolarData } from '../stateSolarService';
import { getConstant } from '../calculationConstantsService';

export interface SolarCalculationInput {
  peakDemandKW: number;
  annualConsumptionKWh: number;
  industry: Industry;
  useCaseData: Record<string, any>;
  state: string;
  sunHoursPerDay?: number;  // Optional override
  userInterested: boolean;
  customSizeKw?: number;
  mountType?: 'rooftop' | 'ground' | 'carport';
  useTrackers?: boolean;
  useBifacial?: boolean;
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
  coveragePercent: number;
  sizingRationale: string;
  stateData: {
    sunHours: number;
    rating: string;
    capacityFactorKwhPerKw: number;
    optimalTilt: number | null;
  };
  breakdown: {
    component: string;
    cost: number;
  }[];
}

// Fallback constants (used if DB unavailable)
const FALLBACK_CONSTANTS = {
  COST_PER_WATT: 1.20,
  PANEL_WATTS: 500,
  SQFT_PER_KW: 70,
  MIN_SIZE_KW: 25,
  MAX_SIZE_KW: 10000,
  SYSTEM_LOSSES: 0.14,
  GROUND_MOUNT_ADDER: 0.15,
  CARPORT_ADDER: 0.40,
  TRACKER_ADDER: 0.25,
  TRACKER_BOOST: 0.25,
  BIFACIAL_BOOST: 0.10,
};

// Fallback state data
const FALLBACK_STATE_DATA: Record<string, { sunHours: number; capacityFactor: number; rating: string }> = {
  'AZ': { sunHours: 6.58, capacityFactor: 1850, rating: 'A' },
  'NV': { sunHours: 6.41, capacityFactor: 1780, rating: 'A' },
  'CA': { sunHours: 5.82, capacityFactor: 1680, rating: 'A' },
  'TX': { sunHours: 5.64, capacityFactor: 1580, rating: 'A' },
  'FL': { sunHours: 5.45, capacityFactor: 1520, rating: 'B' },
  'NY': { sunHours: 4.32, capacityFactor: 1205, rating: 'C' },
  'WA': { sunHours: 3.95, capacityFactor: 1105, rating: 'D' },
};

// Industry-specific solar configurations
const INDUSTRY_SOLAR_CONFIG: Record<string, {
  recommended: boolean;
  targetCoveragePercent: number;
  roofUtilization: number;
  rationale: string;
}> = {
  hotel: { recommended: true, targetCoveragePercent: 40, roofUtilization: 0.60, rationale: 'Excellent daytime load match with guest services' },
  car_wash: { recommended: true, targetCoveragePercent: 50, roofUtilization: 0.30, rationale: 'Peak wash hours align with solar production' },
  data_center: { recommended: true, targetCoveragePercent: 30, roofUtilization: 0.50, rationale: 'Consistent load benefits from solar + BESS' },
  hospital: { recommended: true, targetCoveragePercent: 25, roofUtilization: 0.40, rationale: 'Reduces grid dependence for critical facility' },
  manufacturing: { recommended: true, targetCoveragePercent: 35, roofUtilization: 0.70, rationale: 'Large roof area, daytime production shift' },
  retail: { recommended: true, targetCoveragePercent: 50, roofUtilization: 0.65, rationale: 'Business hours match solar production' },
  office: { recommended: true, targetCoveragePercent: 45, roofUtilization: 0.50, rationale: 'Daytime occupancy aligns with solar' },
  warehouse: { recommended: true, targetCoveragePercent: 60, roofUtilization: 0.80, rationale: 'Excellent roof area for maximum solar' },
  restaurant: { recommended: true, targetCoveragePercent: 30, roofUtilization: 0.40, rationale: 'Lunch peak matches solar production' },
  college: { recommended: true, targetCoveragePercent: 35, roofUtilization: 0.45, rationale: 'Multiple buildings, educational showcase' },
  university: { recommended: true, targetCoveragePercent: 35, roofUtilization: 0.45, rationale: 'Multiple buildings, educational showcase' },
  ev_charging: { recommended: true, targetCoveragePercent: 70, roofUtilization: 0.80, rationale: 'Solar + storage + EV is optimal combination' },
  cold_storage: { recommended: true, targetCoveragePercent: 40, roofUtilization: 0.75, rationale: 'Large flat roofs, consistent load' },
  casino: { recommended: true, targetCoveragePercent: 35, roofUtilization: 0.55, rationale: '24/7 load pairs well with BESS' },
  apartment: { recommended: true, targetCoveragePercent: 30, roofUtilization: 0.45, rationale: 'Common area and EV charging potential' },
};

/**
 * Calculate solar PV system sizing (async - uses database)
 */
export async function calculateSolarAsync(input: SolarCalculationInput): Promise<SolarCalculationResult> {
  // Get state data from database
  const stateData = await getStateSolarData(input.state);
  
  // Get constants from database
  const [costPerWatt, sqftPerKw, groundAdder, carportAdder, trackerAdder, trackerBoost, bifacialBoost] = await Promise.all([
    getConstant('SOLAR_COST_PER_WATT'),
    getConstant('SOLAR_SQFT_PER_KW'),
    getConstant('SOLAR_GROUND_MOUNT_COST_ADDER'),
    getConstant('SOLAR_CARPORT_COST_ADDER'),
    getConstant('SOLAR_TRACKER_COST_ADDER'),
    getConstant('SOLAR_TRACKER_PRODUCTION_BOOST'),
    getConstant('SOLAR_BIFACIAL_BOOST'),
  ]);

  const constants = {
    costPerWatt: costPerWatt || FALLBACK_CONSTANTS.COST_PER_WATT,
    sqftPerKw: sqftPerKw || FALLBACK_CONSTANTS.SQFT_PER_KW,
    groundAdder: groundAdder || FALLBACK_CONSTANTS.GROUND_MOUNT_ADDER,
    carportAdder: carportAdder || FALLBACK_CONSTANTS.CARPORT_ADDER,
    trackerAdder: trackerAdder || FALLBACK_CONSTANTS.TRACKER_ADDER,
    trackerBoost: trackerBoost || FALLBACK_CONSTANTS.TRACKER_BOOST,
    bifacialBoost: bifacialBoost || FALLBACK_CONSTANTS.BIFACIAL_BOOST,
  };

  return calculateSolarInternal(input, stateData, constants);
}

/**
 * Calculate solar PV system sizing (sync - uses fallbacks)
 * For backward compatibility
 */
export function calculateSolar(input: SolarCalculationInput): SolarCalculationResult {
  const fallback = FALLBACK_STATE_DATA[input.state] || { sunHours: 5.0, capacityFactor: 1500, rating: 'C' };
  const stateData: StateSolarData = {
    stateCode: input.state,
    stateName: input.state,
    peakSunHours: fallback.sunHours,
    capacityFactorKwhPerKw: fallback.capacityFactor,
    avgIrradianceKwhM2Day: null,
    solarRating: fallback.rating as 'A' | 'B' | 'C' | 'D',
    avgElectricityRate: null,
    avgDemandCharge: null,
    bestTiltAngle: null,
  };
  return calculateSolarInternal(input, stateData, FALLBACK_CONSTANTS);
}

/**
 * Internal calculation logic
 */
function calculateSolarInternal(
  input: SolarCalculationInput,
  stateData: StateSolarData | null,
  constants: typeof FALLBACK_CONSTANTS
): SolarCalculationResult {
  const config = INDUSTRY_SOLAR_CONFIG[input.industry] || {
    recommended: true,
    targetCoveragePercent: 40,
    roofUtilization: 0.50,
    rationale: 'Standard commercial solar application',
  };

  // Use database state data or fallback
  const sunHours = input.sunHoursPerDay || stateData?.peakSunHours || 5.0;
  const capacityFactor = stateData?.capacityFactorKwhPerKw || 1500;
  const solarRating = stateData?.solarRating || 'C';
  const optimalTilt = stateData?.bestTiltAngle || null;

  // If user provided custom size, use it
  if (input.customSizeKw !== undefined && input.customSizeKw > 0) {
    return buildResult(input.customSizeKw, capacityFactor, input, config, constants, stateData, 'User specified size');
  }

  // If user not interested and not recommended, return zero
  if (!input.userInterested && !config.recommended) {
    return buildResult(0, capacityFactor, input, config, constants, stateData, 'Not recommended for this application');
  }

  // Calculate target size based on consumption coverage
  let targetAnnualKWh = input.annualConsumptionKWh * (config.targetCoveragePercent / 100);
  
  // Apply production boosts for trackers/bifacial
  let effectiveCapacityFactor = capacityFactor;
  if (input.useTrackers) {
    effectiveCapacityFactor *= (1 + constants.trackerBoost);
  }
  if (input.useBifacial) {
    effectiveCapacityFactor *= (1 + constants.bifacialBoost);
  }

  let targetKW = targetAnnualKWh / effectiveCapacityFactor;

  // Check roof area constraint
  const facilitySize = input.useCaseData.squareFootage || input.useCaseData.totalSqFt || 50000;
  const availableRoofSqFt = facilitySize * config.roofUtilization;
  const maxKWByRoof = availableRoofSqFt / constants.sqftPerKw;

  // Use the smaller of target or roof-constrained size
  let capacityKW = Math.min(targetKW, maxKWByRoof);

  // Apply min/max limits
  capacityKW = Math.max(FALLBACK_CONSTANTS.MIN_SIZE_KW, Math.min(FALLBACK_CONSTANTS.MAX_SIZE_KW, capacityKW));

  // Round to nearest 25 kW
  capacityKW = Math.round(capacityKW / 25) * 25;

  // If size is less than minimum, don't recommend
  if (capacityKW < FALLBACK_CONSTANTS.MIN_SIZE_KW) {
    return buildResult(0, effectiveCapacityFactor, input, config, constants, stateData, 'Roof area insufficient for commercial solar');
  }

  const rationale = capacityKW < targetKW
    ? `${config.rationale}. Limited by available roof area.`
    : config.rationale;

  return buildResult(capacityKW, effectiveCapacityFactor, input, config, constants, stateData, rationale);
}

/**
 * Build the result object
 */
function buildResult(
  capacityKW: number,
  capacityFactor: number,
  input: SolarCalculationInput,
  config: typeof INDUSTRY_SOLAR_CONFIG[string],
  constants: typeof FALLBACK_CONSTANTS,
  stateData: StateSolarData | null,
  rationale: string
): SolarCalculationResult {
  const annualProductionKWh = capacityKW * capacityFactor;
  const coveragePercent = input.annualConsumptionKWh > 0
    ? Math.round((annualProductionKWh / input.annualConsumptionKWh) * 100)
    : 0;
  const roofAreaSqFt = capacityKW * constants.sqftPerKw;

  // Calculate cost with mount type adders
  let costPerWatt = constants.costPerWatt;
  if (input.mountType === 'ground') {
    costPerWatt *= (1 + constants.groundAdder);
  } else if (input.mountType === 'carport') {
    costPerWatt *= (1 + constants.carportAdder);
  }
  if (input.useTrackers) {
    costPerWatt *= (1 + constants.trackerAdder);
  }

  const totalCost = capacityKW * 1000 * costPerWatt;

  return {
    recommended: capacityKW > 0,
    capacityKW,
    type: 'monocrystalline',
    annualProductionKWh: Math.round(annualProductionKWh),
    capacityFactor: capacityFactor / 8760,
    estimatedCost: Math.round(totalCost),
    costPerWatt: Math.round(costPerWatt * 100) / 100,
    roofAreaSqFt: Math.round(roofAreaSqFt),
    coveragePercent,
    sizingRationale: rationale,
    stateData: {
      sunHours: stateData?.peakSunHours || 5.0,
      rating: stateData?.solarRating || 'C',
      capacityFactorKwhPerKw: capacityFactor,
      optimalTilt: stateData?.bestTiltAngle || null,
    },
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
 * Get sun hours for a state (async - uses database)
 */
export async function getSunHoursForStateAsync(state: string): Promise<number> {
  const data = await getStateSolarData(state);
  return data?.peakSunHours || 5.0;
}

/**
 * Get sun hours for a state (sync fallback)
 */
export function getSunHoursForState(state: string): number {
  const fallback = FALLBACK_STATE_DATA[state];
  return fallback?.sunHours || 5.0;
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
