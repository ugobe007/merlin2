/**
 * SOLAR CALCULATOR
 * ================
 * Calculates solar PV system sizing and production
 * 
 * SSOT: Pulls state data from database via stateSolarService
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 * 
 * Updated: January 6, 2026
 * - FIXED: Now reads roofSqFt field from useCaseData (Vineet's car wash bug)
 * - Solar sizing is capped by physical roof constraints
 * - Returns solarGapKW when roof can't fit ideal solar size
 */

import type { Industry, SolarType } from '../contracts';
import { getStateSolarData, type StateSolarData } from '../stateSolarService';
import { getConstant } from '../calculationConstantsService';
import { DEFAULTS } from '../data/constants';

export interface SolarCalculationInput {
  peakDemandKW: number;
  annualConsumptionKWh: number;
  industry: Industry;
  useCaseData: Record<string, any>;
  state: string;
  sunHoursPerDay?: number;
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
  // NEW: Roof constraint fields
  idealCapacityKW: number;        // What we'd recommend without roof constraints
  maxRoofCapacityKW: number;      // Max solar that fits on roof
  solarGapKW: number;             // Shortfall that needs carport/other solution
  isRoofConstrained: boolean;     // True if roof limits solar size
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

// Solar constants - uses SSOT from data/constants.ts
const SOLAR_CONSTANTS = {
  // NOTE: COST_PER_WATT is now size-aware - use getSolarCostPerWatt(systemKW)
  COST_PER_WATT: DEFAULTS.Solar.costPerWatt,  // $0.95/W (commercial default)
  PANEL_WATTS: 500,
  SQFT_PER_KW: 50,              // Updated: 500W panels need ~50 sq ft per kW
  USABLE_ROOF_PERCENT: 0.60,    // 60% of roof is typically usable
  DEGRADATION_ANNUAL: 0.005,
  LIFETIME_YEARS: 25,
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
  defaultRoofUtilization: number;  // Renamed for clarity - only used as fallback
  rationale: string;
}> = {
  hotel: { recommended: true, targetCoveragePercent: 40, defaultRoofUtilization: 0.60, rationale: 'Excellent daytime load match with guest services' },
  car_wash: { recommended: true, targetCoveragePercent: 50, defaultRoofUtilization: 0.30, rationale: 'Peak wash hours align with solar production' },
  data_center: { recommended: true, targetCoveragePercent: 30, defaultRoofUtilization: 0.50, rationale: 'Consistent load benefits from solar + BESS' },
  hospital: { recommended: true, targetCoveragePercent: 25, defaultRoofUtilization: 0.40, rationale: 'Reduces grid dependence for critical facility' },
  manufacturing: { recommended: true, targetCoveragePercent: 35, defaultRoofUtilization: 0.70, rationale: 'Large roof area, daytime production shift' },
  retail: { recommended: true, targetCoveragePercent: 50, defaultRoofUtilization: 0.65, rationale: 'Business hours match solar production' },
  office: { recommended: true, targetCoveragePercent: 45, defaultRoofUtilization: 0.50, rationale: 'Daytime occupancy aligns with solar' },
  warehouse: { recommended: true, targetCoveragePercent: 60, defaultRoofUtilization: 0.80, rationale: 'Excellent roof area for maximum solar' },
  restaurant: { recommended: true, targetCoveragePercent: 30, defaultRoofUtilization: 0.40, rationale: 'Lunch peak matches solar production' },
  college: { recommended: true, targetCoveragePercent: 35, defaultRoofUtilization: 0.45, rationale: 'Multiple buildings, educational showcase' },
  university: { recommended: true, targetCoveragePercent: 35, defaultRoofUtilization: 0.45, rationale: 'Multiple buildings, educational showcase' },
  ev_charging: { recommended: true, targetCoveragePercent: 70, defaultRoofUtilization: 0.80, rationale: 'Solar + storage + EV is optimal combination' },
  cold_storage: { recommended: true, targetCoveragePercent: 40, defaultRoofUtilization: 0.75, rationale: 'Large flat roofs, consistent load' },
  casino: { recommended: true, targetCoveragePercent: 35, defaultRoofUtilization: 0.55, rationale: '24/7 load pairs well with BESS' },
  apartment: { recommended: true, targetCoveragePercent: 30, defaultRoofUtilization: 0.45, rationale: 'Common area and EV charging potential' },
};

/**
 * Extract roof area from useCaseData
 * Checks multiple possible field names for compatibility
 */
function extractRoofArea(useCaseData: Record<string, any>, industry: string): number | null {
  // Check explicit roof area fields (from Supabase questions)
  const explicitRoof = 
    useCaseData.roofSqFt ||           // Car wash uses this
    useCaseData.roofArea ||           // Generic
    useCaseData.roofAreaSqFt ||       // Alternative naming
    useCaseData.availableRoofArea ||  // Descriptive
    useCaseData.roofSize;             // Simple
  
  if (explicitRoof && explicitRoof > 0) {
    console.log(`🏠 [solarCalculator] Using explicit roof area: ${explicitRoof} sq ft`);
    return explicitRoof;
  }
  
  return null; // No explicit roof area provided
}

/**
 * Extract site/facility size from useCaseData
 */
function extractFacilitySize(useCaseData: Record<string, any>): number {
  return (
    useCaseData.siteSqFt ||           // Car wash uses this
    useCaseData.squareFootage ||      // Generic
    useCaseData.totalSqFt ||          // Alternative
    useCaseData.facilitySize ||       // Descriptive
    useCaseData.buildingSize ||       // Alternative
    50000                             // Fallback
  );
}

/**
 * Calculate solar PV system sizing (async - uses database)
 */
export async function calculateSolarAsync(input: SolarCalculationInput): Promise<SolarCalculationResult> {
  // Get state data from database
  const stateData = await getStateSolarData(input.state);
  
  // Get constants from database (with fallbacks)
  const [costPerWatt, sqftPerKw, groundAdder, carportAdder, trackerAdder, trackerBoost, bifacialBoost] = await Promise.all([
    getConstant('SOLAR_COST_PER_WATT'),
    getConstant('SOLAR_SQFT_PER_KW'),
    getConstant('SOLAR_GROUND_MOUNT_COST_ADDER'),
    getConstant('SOLAR_CARPORT_COST_ADDER'),
    getConstant('SOLAR_TRACKER_COST_ADDER'),
    getConstant('SOLAR_TRACKER_PRODUCTION_BOOST'),
    getConstant('SOLAR_BIFACIAL_BOOST'),
  ]);

  // Build constants with DB values or fallbacks
  const constants = {
    ...SOLAR_CONSTANTS,
    COST_PER_WATT: costPerWatt || SOLAR_CONSTANTS.COST_PER_WATT,
    SQFT_PER_KW: sqftPerKw || SOLAR_CONSTANTS.SQFT_PER_KW,
    GROUND_MOUNT_ADDER: groundAdder || SOLAR_CONSTANTS.GROUND_MOUNT_ADDER,
    CARPORT_ADDER: carportAdder || SOLAR_CONSTANTS.CARPORT_ADDER,
    TRACKER_ADDER: trackerAdder || SOLAR_CONSTANTS.TRACKER_ADDER,
    TRACKER_BOOST: trackerBoost || SOLAR_CONSTANTS.TRACKER_BOOST,
    BIFACIAL_BOOST: bifacialBoost || SOLAR_CONSTANTS.BIFACIAL_BOOST,
  };

  return calculateSolarInternal(input, stateData, constants);
}

/**
 * Calculate solar PV system sizing (sync - uses fallbacks)
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
  return calculateSolarInternal(input, stateData, SOLAR_CONSTANTS);
}

/**
 * Internal calculation logic
 * UPDATED: Now properly handles roof constraints
 */
function calculateSolarInternal(
  input: SolarCalculationInput,
  stateData: StateSolarData | null,
  constants: typeof SOLAR_CONSTANTS
): SolarCalculationResult {
  const config = INDUSTRY_SOLAR_CONFIG[input.industry] || {
    recommended: true,
    targetCoveragePercent: 40,
    defaultRoofUtilization: 0.50,
    rationale: 'Standard commercial solar application',
  };

  // Use database state data or fallback
  const capacityFactor = stateData?.capacityFactorKwhPerKw || 1500;

  // If user provided custom size, use it (skip all constraints)
  if (input.customSizeKw !== undefined && input.customSizeKw > 0) {
    return buildResult(input.customSizeKw, input.customSizeKw, input.customSizeKw, 0, false, capacityFactor, input, config, constants, stateData, 'User specified size');
  }

  // If user not interested and not recommended, return zero
  if (!input.userInterested && !config.recommended) {
    return buildResult(0, 0, 0, 0, false, capacityFactor, input, config, constants, stateData, 'Not recommended for this application');
  }

  // ========================================================================
  // STEP 1: Calculate IDEAL solar size based on energy needs
  // ========================================================================
  const targetAnnualKWh = input.annualConsumptionKWh * (config.targetCoveragePercent / 100);
  
  // Apply production boosts for trackers/bifacial
  let effectiveCapacityFactor = capacityFactor;
  if (input.useTrackers) {
    effectiveCapacityFactor *= (1 + constants.TRACKER_BOOST);
  }
  if (input.useBifacial) {
    effectiveCapacityFactor *= (1 + constants.BIFACIAL_BOOST);
  }

  let idealCapacityKW = targetAnnualKWh / effectiveCapacityFactor;
  
  // Round to nearest 25 kW
  idealCapacityKW = Math.round(idealCapacityKW / 25) * 25;
  
  // Apply min/max limits to ideal
  idealCapacityKW = Math.max(constants.MIN_SIZE_KW, Math.min(constants.MAX_SIZE_KW, idealCapacityKW));

  // ========================================================================
  // STEP 2: Calculate MAX solar that fits on available roof
  // ========================================================================
  const explicitRoofArea = extractRoofArea(input.useCaseData, input.industry);
  const facilitySize = extractFacilitySize(input.useCaseData);
  
  let availableRoofSqFt: number;
  let roofSource: string;
  
  if (explicitRoofArea !== null) {
    // User provided explicit roof area - apply usable percentage
    availableRoofSqFt = explicitRoofArea * constants.USABLE_ROOF_PERCENT;
    roofSource = `explicit roof (${explicitRoofArea} × ${constants.USABLE_ROOF_PERCENT * 100}% usable)`;
  } else {
    // Fallback: estimate roof from facility size × industry utilization factor
    availableRoofSqFt = facilitySize * config.defaultRoofUtilization;
    roofSource = `estimated from site (${facilitySize} × ${config.defaultRoofUtilization * 100}%)`;
  }
  
  // Calculate max solar that fits on roof
  // Formula: available sq ft ÷ sq ft per kW = max kW
  const maxRoofCapacityKW = Math.round(availableRoofSqFt / constants.SQFT_PER_KW);

  console.log(`☀️ [solarCalculator] Roof constraint calculation:`, {
    industry: input.industry,
    explicitRoofArea,
    facilitySize,
    availableRoofSqFt,
    roofSource,
    sqftPerKw: constants.SQFT_PER_KW,
    maxRoofCapacityKW,
    idealCapacityKW,
  });

  // ========================================================================
  // STEP 3: Determine final capacity and gap
  // ========================================================================
  const isRoofConstrained = maxRoofCapacityKW < idealCapacityKW;
  const finalCapacityKW = Math.min(idealCapacityKW, maxRoofCapacityKW);
  const solarGapKW = isRoofConstrained ? idealCapacityKW - maxRoofCapacityKW : 0;

  // If size is less than minimum, don't recommend
  if (finalCapacityKW < constants.MIN_SIZE_KW) {
    return buildResult(0, idealCapacityKW, maxRoofCapacityKW, solarGapKW, true, effectiveCapacityFactor, input, config, constants, stateData, 'Roof area insufficient for commercial solar');
  }

  // Build rationale
  let rationale = config.rationale;
  if (isRoofConstrained) {
    rationale = `${config.rationale}. ⚠️ Limited to ${maxRoofCapacityKW} kW by available roof area (${Math.round(availableRoofSqFt).toLocaleString()} usable sq ft). Ideal size would be ${idealCapacityKW} kW - consider carport solar for additional ${solarGapKW} kW.`;
  }

  return buildResult(finalCapacityKW, idealCapacityKW, maxRoofCapacityKW, solarGapKW, isRoofConstrained, effectiveCapacityFactor, input, config, constants, stateData, rationale);
}

/**
 * Build the result object
 * UPDATED: Includes roof constraint fields
 */
function buildResult(
  capacityKW: number,
  idealCapacityKW: number,
  maxRoofCapacityKW: number,
  solarGapKW: number,
  isRoofConstrained: boolean,
  capacityFactor: number,
  input: SolarCalculationInput,
  config: typeof INDUSTRY_SOLAR_CONFIG[string],
  constants: typeof SOLAR_CONSTANTS,
  stateData: StateSolarData | null,
  rationale: string
): SolarCalculationResult {
  const annualProductionKWh = capacityKW * capacityFactor;
  const coveragePercent = input.annualConsumptionKWh > 0
    ? Math.round((annualProductionKWh / input.annualConsumptionKWh) * 100)
    : 0;
  const roofAreaSqFt = capacityKW * constants.SQFT_PER_KW;

  // Calculate cost with mount type adders
  let costPerWatt = constants.COST_PER_WATT;
  if (input.mountType === 'ground') {
    costPerWatt *= (1 + constants.GROUND_MOUNT_ADDER);
  } else if (input.mountType === 'carport') {
    costPerWatt *= (1 + constants.CARPORT_ADDER);
  }
  if (input.useTrackers) {
    costPerWatt *= (1 + constants.TRACKER_ADDER);
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
    // NEW: Roof constraint fields
    idealCapacityKW,
    maxRoofCapacityKW,
    solarGapKW,
    isRoofConstrained,
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
