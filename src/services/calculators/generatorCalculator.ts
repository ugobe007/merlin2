/**
 * GENERATOR CALCULATOR
 * Calculates backup generator sizing and costs
 * 
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 */

import type { Industry, GeneratorFuel } from '../contracts';

export interface GeneratorCalculationInput {
  peakDemandKW: number;
  bessKW: number;
  industry: Industry;
  state: string;
  useCaseData: Record<string, any>;
  userInterested: boolean;
  customSizeKw?: number;
  fuelType?: GeneratorFuel;
}

export interface GeneratorCalculationResult {
  recommended: boolean;
  required: boolean;  // Mandatory for this facility type
  reason?: string;
  capacityKW: number;
  fuelType: GeneratorFuel;
  runtimeHours: number;  // At full load with standard tank
  estimatedCost: number;
  costPerKw: number;
  annualMaintenanceCost: number;
  sizingRationale: string;
  breakdown: {
    component: string;
    cost: number;
  }[];
}

// Generator constants
const GENERATOR_CONSTANTS = {
  COST_PER_KW_DIESEL: 800,
  COST_PER_KW_NATGAS: 650,
  MAINTENANCE_PERCENT: 0.03,  // 3% of capital per year
  MIN_SIZE_KW: 50,
  MAX_SIZE_KW: 10000,
  STANDARD_RUNTIME_HOURS: 24,  // With standard fuel tank
};

// High-risk weather states (hurricanes, severe storms)
const HIGH_RISK_STATES = ['FL', 'LA', 'TX', 'NC', 'SC', 'GA', 'AL', 'MS', 'PR', 'VI'];

// Industry-specific generator configurations
const INDUSTRY_GENERATOR_CONFIG: Record<string, {
  required: boolean;
  recommendedIfNoSolar: boolean;
  criticalLoadPercent: number;  // % of peak load generator should cover
  preferredFuel: GeneratorFuel;
  rationale: string;
}> = {
  hotel: {
    required: false,
    recommendedIfNoSolar: true,
    criticalLoadPercent: 0.50,
    preferredFuel: 'natural-gas',
    rationale: 'Guest safety and elevator operation',
  },
  car_wash: {
    required: false,
    recommendedIfNoSolar: true,
    criticalLoadPercent: 0.30,
    preferredFuel: 'diesel',  // Often no gas line available
    rationale: 'Business continuity during outages',
  },
  data_center: {
    required: true,  // Mandatory
    recommendedIfNoSolar: true,
    criticalLoadPercent: 1.0,  // Full load + redundancy
    preferredFuel: 'diesel',
    rationale: 'Critical infrastructure - required by Tier standards',
  },
  hospital: {
    required: true,  // Mandatory by code
    recommendedIfNoSolar: true,
    criticalLoadPercent: 1.0,
    preferredFuel: 'diesel',
    rationale: 'Life safety - required by healthcare codes',
  },
  manufacturing: {
    required: false,
    recommendedIfNoSolar: true,
    criticalLoadPercent: 0.40,
    preferredFuel: 'natural-gas',
    rationale: 'Production continuity and equipment protection',
  },
  retail: {
    required: false,
    recommendedIfNoSolar: false,
    criticalLoadPercent: 0.30,
    preferredFuel: 'natural-gas',
    rationale: 'POS and refrigeration backup',
  },
  office: {
    required: false,
    recommendedIfNoSolar: false,
    criticalLoadPercent: 0.25,
    preferredFuel: 'natural-gas',
    rationale: 'IT systems and elevator backup',
  },
  warehouse: {
    required: false,
    recommendedIfNoSolar: false,
    criticalLoadPercent: 0.35,
    preferredFuel: 'diesel',
    rationale: 'Cold storage and material handling',
  },
  restaurant: {
    required: false,
    recommendedIfNoSolar: true,
    criticalLoadPercent: 0.50,
    preferredFuel: 'natural-gas',
    rationale: 'Food safety and refrigeration',
  },
  college: {
    required: false,
    recommendedIfNoSolar: true,
    criticalLoadPercent: 0.40,
    preferredFuel: 'natural-gas',
    rationale: 'Research continuity and student safety',
  },
  ev_charging: {
    required: false,
    recommendedIfNoSolar: false,
    criticalLoadPercent: 0.20,
    preferredFuel: 'natural-gas',
    rationale: 'Optional backup for high-reliability stations',
  },
  cold_storage: {
    required: true,  // Product protection
    recommendedIfNoSolar: true,
    criticalLoadPercent: 0.80,
    preferredFuel: 'diesel',
    rationale: 'Temperature-sensitive inventory protection',
  },
  airport: {
    required: true,
    recommendedIfNoSolar: true,
    criticalLoadPercent: 0.70,
    preferredFuel: 'diesel',
    rationale: 'FAA requirements for critical systems',
  },
};

/**
 * Calculate generator sizing
 */
export function calculateGenerator(input: GeneratorCalculationInput): GeneratorCalculationResult {
  const config = INDUSTRY_GENERATOR_CONFIG[input.industry] || {
    required: false,
    recommendedIfNoSolar: false,
    criticalLoadPercent: 0.40,
    preferredFuel: 'natural-gas' as GeneratorFuel,
    rationale: 'Standard backup power',
  };

  const isHighRiskState = HIGH_RISK_STATES.includes(input.state);
  const fuelType = input.fuelType || config.preferredFuel;
  const costPerKw = fuelType === 'diesel' 
    ? GENERATOR_CONSTANTS.COST_PER_KW_DIESEL 
    : GENERATOR_CONSTANTS.COST_PER_KW_NATGAS;

  // If user provided custom size, use it
  if (input.customSizeKw !== undefined && input.customSizeKw > 0) {
    return buildResult(input.customSizeKw, fuelType, costPerKw, config, input, 
      'User specified size', true, config.required);
  }

  // Determine if generator should be recommended
  let shouldRecommend = config.required;
  let reason = config.rationale;

  if (!shouldRecommend && isHighRiskState) {
    shouldRecommend = true;
    reason = `High-risk weather zone (${input.state}). ${config.rationale}`;
  }

  if (!shouldRecommend && config.recommendedIfNoSolar && !input.userInterested) {
    // User declined solar, recommend generator instead
    shouldRecommend = true;
    reason = `Recommended as alternative to solar. ${config.rationale}`;
  }

  if (!shouldRecommend && input.userInterested) {
    shouldRecommend = true;
    reason = config.rationale;
  }

  // If not recommending, return zero
  if (!shouldRecommend) {
    return buildResult(0, fuelType, costPerKw, config, input, 'Not required for this application', false, false);
  }

  // Calculate size based on critical load
  let capacityKW = Math.round(input.peakDemandKW * config.criticalLoadPercent);

  // For critical facilities, ensure generator can handle full BESS charging
  if (config.required) {
    const bessChargingKW = input.bessKW * 0.5;  // 50% charge rate
    capacityKW = Math.max(capacityKW, input.peakDemandKW * config.criticalLoadPercent + bessChargingKW);
  }

  // Apply min/max limits
  capacityKW = Math.max(GENERATOR_CONSTANTS.MIN_SIZE_KW, Math.min(GENERATOR_CONSTANTS.MAX_SIZE_KW, capacityKW));

  // Round to standard sizes (50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, etc.)
  capacityKW = roundToStandardSize(capacityKW);

  return buildResult(capacityKW, fuelType, costPerKw, config, input, reason, true, config.required);
}

/**
 * Round to standard generator sizes
 */
function roundToStandardSize(kw: number): number {
  const standardSizes = [50, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 500, 600, 750, 
                        1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000, 7500, 10000];
  
  // Find closest standard size
  let closest = standardSizes[0];
  let minDiff = Math.abs(kw - closest);
  
  for (const size of standardSizes) {
    const diff = Math.abs(kw - size);
    if (diff < minDiff) {
      minDiff = diff;
      closest = size;
    }
  }
  
  // If we're significantly above the closest, go to next size up
  if (kw > closest * 1.1) {
    const idx = standardSizes.indexOf(closest);
    if (idx < standardSizes.length - 1) {
      closest = standardSizes[idx + 1];
    }
  }
  
  return closest;
}

/**
 * Build result object
 */
function buildResult(
  capacityKW: number,
  fuelType: GeneratorFuel,
  costPerKw: number,
  config: typeof INDUSTRY_GENERATOR_CONFIG[string],
  input: GeneratorCalculationInput,
  rationale: string,
  recommended: boolean,
  required: boolean
): GeneratorCalculationResult {
  const totalCost = capacityKW * costPerKw;
  const annualMaintenanceCost = totalCost * GENERATOR_CONSTANTS.MAINTENANCE_PERCENT;

  return {
    recommended,
    required,
    reason: recommended ? rationale : undefined,
    capacityKW,
    fuelType,
    runtimeHours: GENERATOR_CONSTANTS.STANDARD_RUNTIME_HOURS,
    estimatedCost: Math.round(totalCost),
    costPerKw,
    annualMaintenanceCost: Math.round(annualMaintenanceCost),
    sizingRationale: rationale,
    breakdown: capacityKW > 0 ? [
      { component: 'Generator Unit', cost: Math.round(totalCost * 0.60) },
      { component: 'Transfer Switch', cost: Math.round(totalCost * 0.15) },
      { component: 'Fuel System', cost: Math.round(totalCost * 0.10) },
      { component: 'Installation', cost: Math.round(totalCost * 0.15) },
    ] : [],
  };
}

/**
 * Check if state is high-risk for weather
 */
export function isHighRiskWeatherState(state: string): boolean {
  return HIGH_RISK_STATES.includes(state);
}

/**
 * Get recommended fuel type for state/industry
 */
export function getRecommendedFuelType(industry: Industry, state: string): GeneratorFuel {
  const config = INDUSTRY_GENERATOR_CONFIG[industry];
  
  // Car washes often lack gas lines
  if (industry === 'car_wash') return 'diesel';
  
  // Critical facilities prefer diesel for reliability
  if (config?.required) return 'diesel';
  
  // Default to config or natural gas
  return config?.preferredFuel || 'natural-gas';
}

// ============================================================================
// GENERATOR PRESET TIERS - For Recommended options in Step 4
// ============================================================================

export interface GeneratorPresetTier {
  id: 'standard' | 'enhanced' | 'full';
  name: string;
  description: string;
  capacityKW: number;
  coveragePercent: number;
  estimatedCost: number;
  annualMaintenance: number;
  rationale: string;
}

/**
 * Generate 3 preset tiers for generator based on industry and fuel type
 * Used by Step 4 "Recommended" option
 */
export function getGeneratorPresetTiers(
  industry: Industry,
  peakDemandKW: number,
  fuelType: GeneratorFuel,
  state: string
): GeneratorPresetTier[] {
  const config = INDUSTRY_GENERATOR_CONFIG[industry] || {
    required: false,
    recommendedIfNoSolar: false,
    criticalLoadPercent: 0.40,
    preferredFuel: 'natural-gas' as GeneratorFuel,
    rationale: 'Standard backup power',
  };
  
  const costPerKw = fuelType === 'diesel' 
    ? GENERATOR_CONSTANTS.COST_PER_KW_DIESEL 
    : GENERATOR_CONSTANTS.COST_PER_KW_NATGAS;
  
  const isHighRisk = HIGH_RISK_STATES.includes(state);
  
  // Calculate sizes for each tier
  const standardKW = roundToStandardSize(Math.round(peakDemandKW * config.criticalLoadPercent));
  const enhancedKW = roundToStandardSize(Math.round(peakDemandKW * Math.min(config.criticalLoadPercent * 1.5, 0.80)));
  const fullKW = roundToStandardSize(Math.round(peakDemandKW * 1.0));
  
  const tiers: GeneratorPresetTier[] = [
    {
      id: 'standard',
      name: 'Standard Backup',
      description: `Critical loads only (${Math.round(config.criticalLoadPercent * 100)}%)`,
      capacityKW: standardKW,
      coveragePercent: config.criticalLoadPercent,
      estimatedCost: Math.round(standardKW * costPerKw),
      annualMaintenance: Math.round(standardKW * costPerKw * GENERATOR_CONSTANTS.MAINTENANCE_PERCENT),
      rationale: config.rationale,
    },
    {
      id: 'enhanced',
      name: 'Enhanced Backup',
      description: isHighRisk ? 'Recommended for hurricane zone' : 'Extended coverage',
      capacityKW: enhancedKW,
      coveragePercent: Math.min(config.criticalLoadPercent * 1.5, 0.80),
      estimatedCost: Math.round(enhancedKW * costPerKw),
      annualMaintenance: Math.round(enhancedKW * costPerKw * GENERATOR_CONSTANTS.MAINTENANCE_PERCENT),
      rationale: isHighRisk 
        ? `High-risk weather zone (${state}). Extended backup recommended.`
        : 'Additional capacity for comfort loads',
    },
    {
      id: 'full',
      name: 'Full Backup',
      description: '100% facility coverage',
      capacityKW: fullKW,
      coveragePercent: 1.0,
      estimatedCost: Math.round(fullKW * costPerKw),
      annualMaintenance: Math.round(fullKW * costPerKw * GENERATOR_CONSTANTS.MAINTENANCE_PERCENT),
      rationale: 'Complete facility backup - zero interruption capability',
    },
  ];
  
  return tiers;
}
