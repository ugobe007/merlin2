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
// TrueQuote™ Sources:
// - NREL Commercial Rooftop PV Technical Potential (2016)
// - ICA 2024 Industry Study (car wash footprints)
// - ASHRAE 90.1 / CBECS 2018 (building sizes)
// - SEIA Solar Means Business Report (2024)
//
// KEY: typicalFootprintSqFt is the BUILDING footprint (not total site).
//      defaultRoofUtilization is % of that footprint usable for solar.
//      Max rooftop kW ≈ footprint × roofUtil × 15 W/sqft / 1000.
//      canopyPotentialKW is additional solar from parking/canopy structures.
const INDUSTRY_SOLAR_CONFIG: Record<string, {
  recommended: boolean;
  targetCoveragePercent: number;
  defaultRoofUtilization: number;    // % of building footprint usable for solar
  typicalFootprintSqFt: number;      // Typical building footprint (NOT total site)
  canopyPotentialKW: number;         // Additional solar from parking canopies/carports
  rationale: string;
}> = {
  // Car Wash: 5,500 sqft bldg × 45% usable = 2,475 sqft → ~37 kW rooftop max
  // Vineet confirmed: 30-40 kW realistic roof; canopy solar is must-have for chains
  car_wash:      { recommended: true, targetCoveragePercent: 50, defaultRoofUtilization: 0.45, typicalFootprintSqFt: 5500,   canopyPotentialKW: 50,  rationale: 'Peak wash hours align with solar production. ⚠️ Roof limited to ~37 kW — canopy solar recommended for additional capacity' },
  // Hotel: 20,000 sqft footprint × 35% usable (HVAC, pools, penthouses) = 7,000 sqft → ~105 kW
  hotel:         { recommended: true, targetCoveragePercent: 40, defaultRoofUtilization: 0.35, typicalFootprintSqFt: 20000,  canopyPotentialKW: 120, rationale: 'Excellent daytime load match with guest services. Parking canopy adds capacity' },
  // Office: 15,000 sqft footprint × 40% (multi-story, HVAC) = 6,000 sqft → ~90 kW
  office:        { recommended: true, targetCoveragePercent: 45, defaultRoofUtilization: 0.40, typicalFootprintSqFt: 15000,  canopyPotentialKW: 100, rationale: 'Daytime occupancy aligns with solar. Multi-story limits roof area' },
  // Data Center: 40,000 sqft × 30% (heavy HVAC, generators, switchgear) = 12,000 → ~180 kW
  data_center:   { recommended: true, targetCoveragePercent: 30, defaultRoofUtilization: 0.30, typicalFootprintSqFt: 40000,  canopyPotentialKW: 120, rationale: 'Consistent 24/7 load benefits from solar + BESS. Roof equipment limits capacity' },
  // Hospital: 80,000 sqft × 25% (helipad, cooling towers, exhaust stacks) = 20,000 → ~300 kW
  hospital:      { recommended: true, targetCoveragePercent: 25, defaultRoofUtilization: 0.25, typicalFootprintSqFt: 80000,  canopyPotentialKW: 200, rationale: 'Reduces grid dependence for critical facility. Roof limited by medical equipment' },
  // Manufacturing: 75,000 sqft × 60% (large flat, some exhaust/cranes) = 45,000 → ~675 kW
  manufacturing: { recommended: true, targetCoveragePercent: 35, defaultRoofUtilization: 0.60, typicalFootprintSqFt: 75000,  canopyPotentialKW: 150, rationale: 'Large roof area, daytime production shift. Excellent solar candidate' },
  // Retail: 50,000 sqft × 70% (big box, clean roofs) = 35,000 → ~525 kW
  retail:        { recommended: true, targetCoveragePercent: 50, defaultRoofUtilization: 0.70, typicalFootprintSqFt: 50000,  canopyPotentialKW: 250, rationale: 'Business hours match solar production. Large clean roofs + parking canopy' },
  // Warehouse: 100,000 sqft × 80% (cleanest roofs in commercial) = 80,000 → ~1,200 kW
  warehouse:     { recommended: true, targetCoveragePercent: 60, defaultRoofUtilization: 0.80, typicalFootprintSqFt: 100000, canopyPotentialKW: 50,  rationale: 'Excellent roof area for maximum solar. Best roof-to-load ratio' },
  // Restaurant: 3,500 sqft × 45% (kitchen exhaust, grease traps) = 1,575 → ~24 kW
  restaurant:    { recommended: true, targetCoveragePercent: 30, defaultRoofUtilization: 0.45, typicalFootprintSqFt: 3500,   canopyPotentialKW: 15,  rationale: 'Lunch peak matches solar production. Small roof limits capacity' },
  // College: 50,000 sqft × 40% (multiple buildings) = 20,000 → ~300 kW
  college:       { recommended: true, targetCoveragePercent: 35, defaultRoofUtilization: 0.40, typicalFootprintSqFt: 50000,  canopyPotentialKW: 300, rationale: 'Multiple buildings, educational showcase. Large parking canopy potential' },
  university:    { recommended: true, targetCoveragePercent: 35, defaultRoofUtilization: 0.40, typicalFootprintSqFt: 50000,  canopyPotentialKW: 300, rationale: 'Multiple buildings, educational showcase. Large parking canopy potential' },
  // EV Charging: 2,000 sqft building × 40% = 800 → ~12 kW rooftop. Canopy is PRIMARY!
  ev_charging:   { recommended: true, targetCoveragePercent: 70, defaultRoofUtilization: 0.40, typicalFootprintSqFt: 2000,   canopyPotentialKW: 150, rationale: 'Solar canopy over charging stalls is primary. Roof is secondary' },
  // Cold Storage: 60,000 sqft × 75% (large flat roofs) = 45,000 → ~675 kW
  cold_storage:  { recommended: true, targetCoveragePercent: 40, defaultRoofUtilization: 0.75, typicalFootprintSqFt: 60000,  canopyPotentialKW: 50,  rationale: 'Large flat roofs, consistent refrigeration load' },
  // Casino: 120,000 sqft × 50% (signage, HVAC, decorative) = 60,000 → ~900 kW
  casino:        { recommended: true, targetCoveragePercent: 35, defaultRoofUtilization: 0.50, typicalFootprintSqFt: 120000, canopyPotentialKW: 400, rationale: '24/7 load pairs well with BESS. Large parking canopy potential' },
  // Apartment: 12,000 sqft × 30% (multi-story) = 3,600 → ~54 kW
  apartment:     { recommended: true, targetCoveragePercent: 30, defaultRoofUtilization: 0.30, typicalFootprintSqFt: 12000,  canopyPotentialKW: 80,  rationale: 'Common area and EV charging potential. Multi-story limits roof' },
  // Gas Station: 3,000 sqft × 55% = 1,650 → ~25 kW. Pump canopy is key!
  gas_station:   { recommended: true, targetCoveragePercent: 40, defaultRoofUtilization: 0.55, typicalFootprintSqFt: 3000,   canopyPotentialKW: 40,  rationale: 'Pump canopy solar provides shade + power. 24/7 lighting load' },
  // Shopping Center: 200,000 sqft × 65% = 130,000 → ~1,950 kW
  shopping_center: { recommended: true, targetCoveragePercent: 45, defaultRoofUtilization: 0.65, typicalFootprintSqFt: 200000, canopyPotentialKW: 500, rationale: 'Massive roof + parking. Among best commercial solar candidates' },
  // Airport: 200,000 sqft × 20% (complex roofs, security) = 40,000 → ~600 kW
  airport:       { recommended: true, targetCoveragePercent: 20, defaultRoofUtilization: 0.20, typicalFootprintSqFt: 200000, canopyPotentialKW: 500, rationale: 'Huge parking areas for canopy solar. Complex roof limits rooftop' },
  // Indoor Farm: 40,000 sqft × 25% (may need natural light) = 10,000 → ~150 kW
  indoor_farm:   { recommended: true, targetCoveragePercent: 30, defaultRoofUtilization: 0.25, typicalFootprintSqFt: 40000,  canopyPotentialKW: 30,  rationale: 'May need translucent roof sections for crops. BESS helps with grow lights' },
  // Government: 30,000 sqft × 40% = 12,000 → ~180 kW
  government:    { recommended: true, targetCoveragePercent: 35, defaultRoofUtilization: 0.40, typicalFootprintSqFt: 30000,  canopyPotentialKW: 120, rationale: 'Federal sustainability mandates. Executive Order 14057 net-zero by 2050' },
  // Residential: 2,000 sqft × 60% = 1,200 → ~18 kW
  residential:   { recommended: true, targetCoveragePercent: 80, defaultRoofUtilization: 0.60, typicalFootprintSqFt: 2000,   canopyPotentialKW: 5,   rationale: 'Rooftop solar offsets most residential consumption. Carport adds capacity' },
  // Agricultural: 20,000 sqft (barn/shed) × 70% = 14,000 → ~210 kW
  agricultural:  { recommended: true, targetCoveragePercent: 40, defaultRoofUtilization: 0.70, typicalFootprintSqFt: 20000,  canopyPotentialKW: 50,  rationale: 'Barn/shed roofs ideal for solar. Irrigation load alignment' },
  // Microgrid: 10,000 sqft × 50% = 5,000 → ~75 kW
  microgrid:     { recommended: true, targetCoveragePercent: 50, defaultRoofUtilization: 0.50, typicalFootprintSqFt: 10000,  canopyPotentialKW: 50,  rationale: 'Solar essential for islanded operation. Ground mount also common' },
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
    if (import.meta.env.DEV) console.log(`🏠 [solarCalculator] Using explicit roof area: ${explicitRoof} sq ft`);
    return explicitRoof;
  }
  
  return null; // No explicit roof area provided
}

/**
 * Extract site/facility size from useCaseData
 * Uses industry-specific building footprint as fallback (not generic 50,000 sqft)
 */
function extractFacilitySize(useCaseData: Record<string, any>, industry?: string): number {
  const explicit = 
    useCaseData.siteSqFt ||             // Generic site area
    useCaseData.squareFootage ||        // Generic
    useCaseData.totalSqFt ||            // Alternative
    useCaseData.totalSiteArea ||        // Car wash uses this field name
    useCaseData.facilitySize ||         // Descriptive
    useCaseData.buildingSize ||         // Alternative
    useCaseData.buildingFootprint ||    // Explicit footprint
    useCaseData.buildingSqFt;           // Alternative

  if (explicit && explicit > 0) {
    return explicit;
  }

  // Use industry-specific building footprint as fallback
  if (industry) {
    const config = INDUSTRY_SOLAR_CONFIG[industry];
    if (config?.typicalFootprintSqFt) {
      if (import.meta.env.DEV) console.log(`🏠 [solarCalculator] Using industry footprint fallback for ${industry}: ${config.typicalFootprintSqFt} sq ft`);
      return config.typicalFootprintSqFt;
    }
  }

  return 15000; // Conservative generic fallback (was 50,000 — caused inflated solar sizing)
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
  // Uses industry-specific building footprint constraints (Feb 2026 fix)
  // TrueQuote™: Every number traceable to building footprint × usable %
  // ========================================================================
  const explicitRoofArea = extractRoofArea(input.useCaseData, input.industry);
  const facilitySize = extractFacilitySize(input.useCaseData, input.industry);
  
  let availableRoofSqFt: number;
  let roofSource: string;
  
  if (explicitRoofArea !== null) {
    // User provided explicit roof area - apply usable percentage
    availableRoofSqFt = explicitRoofArea * constants.USABLE_ROOF_PERCENT;
    roofSource = `explicit roof (${explicitRoofArea} × ${constants.USABLE_ROOF_PERCENT * 100}% usable)`;
  } else {
    // Fallback: use building footprint × industry-specific roof utilization
    // typicalFootprintSqFt = building footprint, defaultRoofUtilization = % usable for solar
    const buildingFootprint = config.typicalFootprintSqFt || facilitySize;
    availableRoofSqFt = buildingFootprint * config.defaultRoofUtilization;
    roofSource = `industry footprint (${buildingFootprint.toLocaleString()} sqft × ${(config.defaultRoofUtilization * 100).toFixed(0)}% usable)`;
  }
  
  // Calculate max solar that fits on ROOFTOP only
  // Formula: available sq ft ÷ sq ft per kW = max kW
  const maxRoofCapacityKW = Math.round(availableRoofSqFt / constants.SQFT_PER_KW);
  // Additional solar possible from parking canopy/carport structures
  const canopyPotentialKW = config.canopyPotentialKW || 0;

  if (import.meta.env.DEV) console.log(`☀️ [solarCalculator] Roof constraint calculation:`, {
    industry: input.industry,
    explicitRoofArea,
    facilitySize,
    availableRoofSqFt,
    roofSource,
    sqftPerKw: constants.SQFT_PER_KW,
    maxRoofCapacityKW,
    canopyPotentialKW,
    totalPotentialKW: maxRoofCapacityKW + canopyPotentialKW,
    idealCapacityKW,
  });

  // ========================================================================
  // STEP 3: Determine final capacity and gap
  // Rooftop-only is the hard constraint; canopy is additional opportunity
  // ========================================================================
  const isRoofConstrained = maxRoofCapacityKW < idealCapacityKW;
  const finalCapacityKW = Math.min(idealCapacityKW, maxRoofCapacityKW);
  const solarGapKW = isRoofConstrained ? idealCapacityKW - maxRoofCapacityKW : 0;
  // How much of the gap can be covered by canopy solar
  const canopyRecommendedKW = Math.min(solarGapKW, canopyPotentialKW);

  // If rooftop is less than minimum, check if canopy brings it over threshold
  if (finalCapacityKW < constants.MIN_SIZE_KW) {
    if (finalCapacityKW + canopyRecommendedKW >= constants.MIN_SIZE_KW) {
      // Canopy can make it viable — note this in the rationale
      const totalWithCanopy = finalCapacityKW + canopyRecommendedKW;
      return buildResult(totalWithCanopy, idealCapacityKW, maxRoofCapacityKW, solarGapKW, true, effectiveCapacityFactor, input, config, constants, stateData, `Roof area alone insufficient (${maxRoofCapacityKW} kW). Adding ${canopyRecommendedKW} kW solar canopy to reach viable system size.`);
    }
    return buildResult(0, idealCapacityKW, maxRoofCapacityKW, solarGapKW, true, effectiveCapacityFactor, input, config, constants, stateData, `Roof area insufficient for commercial solar (${maxRoofCapacityKW} kW max). Consider ground-mount or canopy solar.`);
  }

  // Build rationale
  let rationale = config.rationale;
  if (isRoofConstrained) {
    const canopyNote = canopyPotentialKW > 0
      ? ` Solar canopy/carport can add up to ${canopyPotentialKW} kW (covering ${Math.min(solarGapKW, canopyPotentialKW)} kW of the gap).`
      : ` Consider ground-mount solar for additional ${solarGapKW} kW.`;
    rationale = `⚠️ Rooftop limited to ${maxRoofCapacityKW} kW (${Math.round(availableRoofSqFt).toLocaleString()} usable sq ft). Ideal would be ${idealCapacityKW} kW.${canopyNote}`;
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
