/**
 * BESS CALCULATOR
 * Calculates Battery Energy Storage System sizing and costs
 * 
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 */

import type { Industry, BatteryChemistry } from '../contracts';

export interface BESSCalculationInput {
  peakDemandKW: number;
  annualConsumptionKWh: number;
  industry: Industry;
  useCaseData: Record<string, any>;
  goals: string[];
}

export interface BESSCalculationResult {
  powerKW: number;
  energyKWh: number;
  durationHours: number;
  chemistry: BatteryChemistry;
  efficiency: number;
  warrantyYears: number;
  estimatedCost: number;
  costPerKwh: number;
  sizingRationale: string;
  breakdown: {
    component: string;
    cost: number;
  }[];
}

// BESS constants
const BESS_CONSTANTS = {
  COST_PER_KWH: 350,          // $/kWh installed
  COST_PER_KW: 150,           // $/kW for power electronics
  EFFICIENCY: 0.85,           // Round-trip efficiency
  DEGRADATION_ANNUAL: 0.025,  // 2.5% per year
  WARRANTY_YEARS: 15,
  MIN_POWER_KW: 50,
  MAX_POWER_KW: 50000,
  MIN_DURATION_HOURS: 2,
  MAX_DURATION_HOURS: 8,
};

// Industry-specific BESS configurations
const INDUSTRY_BESS_CONFIG: Record<string, {
  durationHours: number;
  criticalLoadPercent: number;  // What % of peak load BESS should cover
  chemistry: BatteryChemistry;
  rationale: string;
}> = {
  hotel: {
    durationHours: 4,
    criticalLoadPercent: 0.60,
    chemistry: 'LFP',
    rationale: 'Peak shaving + 4hr backup for guest services',
  },
  car_wash: {
    durationHours: 2,
    criticalLoadPercent: 0.50,
    chemistry: 'LFP',
    rationale: 'Demand charge management during peak wash hours',
  },
  data_center: {
    durationHours: 4,
    criticalLoadPercent: 1.0,
    chemistry: 'LFP',
    rationale: 'Full load backup + UPS bridge to generator',
  },
  hospital: {
    durationHours: 4,
    criticalLoadPercent: 0.80,
    chemistry: 'LFP',
    rationale: 'Critical systems backup + generator bridge',
  },
  manufacturing: {
    durationHours: 2,
    criticalLoadPercent: 0.40,
    chemistry: 'LFP',
    rationale: 'Peak shaving + process continuity',
  },
  retail: {
    durationHours: 2,
    criticalLoadPercent: 0.50,
    chemistry: 'LFP',
    rationale: 'Demand charge reduction + POS backup',
  },
  office: {
    durationHours: 2,
    criticalLoadPercent: 0.40,
    chemistry: 'LFP',
    rationale: 'Peak shaving + IT systems backup',
  },
  warehouse: {
    durationHours: 2,
    criticalLoadPercent: 0.35,
    chemistry: 'LFP',
    rationale: 'Cold storage protection + demand management',
  },
  restaurant: {
    durationHours: 2,
    criticalLoadPercent: 0.60,
    chemistry: 'LFP',
    rationale: 'Kitchen equipment + refrigeration backup',
  },
  college: {
    durationHours: 4,
    criticalLoadPercent: 0.50,
    chemistry: 'LFP',
    rationale: 'Campus-wide demand reduction + research continuity',
  },
  ev_charging: {
    durationHours: 2,
    criticalLoadPercent: 0.70,
    chemistry: 'LFP',
    rationale: 'Peak demand buffering + grid services',
  },
  cold_storage: {
    durationHours: 6,
    criticalLoadPercent: 0.80,
    chemistry: 'LFP',
    rationale: 'Extended backup for temperature-sensitive goods',
  },
  airport: {
    durationHours: 4,
    criticalLoadPercent: 0.60,
    chemistry: 'LFP',
    rationale: 'Critical systems + passenger services backup',
  },
};

/**
 * Calculate BESS sizing based on facility load and industry requirements
 */
export function calculateBESS(input: BESSCalculationInput): BESSCalculationResult {
  const config = INDUSTRY_BESS_CONFIG[input.industry] || {
    durationHours: 2,
    criticalLoadPercent: 0.50,
    chemistry: 'LFP' as BatteryChemistry,
    rationale: 'Standard commercial application',
  };

  // Adjust based on goals
  let adjustedDuration = config.durationHours;
  let adjustedCriticalLoad = config.criticalLoadPercent;

  if (input.goals.includes('backup_power')) {
    adjustedDuration = Math.max(adjustedDuration, 4);
    adjustedCriticalLoad = Math.max(adjustedCriticalLoad, 0.70);
  }
  if (input.goals.includes('grid_independence')) {
    adjustedDuration = Math.max(adjustedDuration, 6);
    adjustedCriticalLoad = Math.max(adjustedCriticalLoad, 0.80);
  }
  if (input.goals.includes('peak_shaving')) {
    adjustedCriticalLoad = Math.max(adjustedCriticalLoad, 0.50);
  }

  // Calculate power and energy
  let powerKW = Math.round(input.peakDemandKW * adjustedCriticalLoad);
  powerKW = Math.max(BESS_CONSTANTS.MIN_POWER_KW, Math.min(BESS_CONSTANTS.MAX_POWER_KW, powerKW));
  
  // Round to nearest 50 kW for standard equipment sizes
  powerKW = Math.round(powerKW / 50) * 50;

  let energyKWh = powerKW * adjustedDuration;
  // Round to nearest 100 kWh
  energyKWh = Math.round(energyKWh / 100) * 100;

  // Recalculate actual duration
  const actualDuration = energyKWh / powerKW;

  // Calculate costs
  const energyCost = energyKWh * BESS_CONSTANTS.COST_PER_KWH;
  const powerCost = powerKW * BESS_CONSTANTS.COST_PER_KW;
  const totalCost = energyCost + powerCost;

  return {
    powerKW,
    energyKWh,
    durationHours: Math.round(actualDuration * 10) / 10,
    chemistry: config.chemistry,
    efficiency: BESS_CONSTANTS.EFFICIENCY,
    warrantyYears: BESS_CONSTANTS.WARRANTY_YEARS,
    estimatedCost: Math.round(totalCost),
    costPerKwh: BESS_CONSTANTS.COST_PER_KWH,
    sizingRationale: `${config.rationale}. ${Math.round(adjustedCriticalLoad * 100)}% critical load × ${adjustedDuration}hr duration.`,
    breakdown: [
      { component: 'Battery Modules', cost: Math.round(energyCost * 0.65) },
      { component: 'Power Electronics', cost: Math.round(powerCost) },
      { component: 'BMS & Controls', cost: Math.round(energyCost * 0.15) },
      { component: 'Enclosure & Thermal', cost: Math.round(energyCost * 0.20) },
    ],
  };
}

/**
 * Validate BESS configuration
 */
export function validateBESSConfig(config: BESSCalculationResult): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (config.powerKW < BESS_CONSTANTS.MIN_POWER_KW) {
    errors.push(`Power ${config.powerKW}kW below minimum ${BESS_CONSTANTS.MIN_POWER_KW}kW`);
  }
  if (config.powerKW > BESS_CONSTANTS.MAX_POWER_KW) {
    errors.push(`Power ${config.powerKW}kW exceeds maximum ${BESS_CONSTANTS.MAX_POWER_KW}kW`);
  }
  if (config.durationHours < BESS_CONSTANTS.MIN_DURATION_HOURS) {
    warnings.push(`Duration ${config.durationHours}hr below recommended ${BESS_CONSTANTS.MIN_DURATION_HOURS}hr`);
  }
  if (config.durationHours > BESS_CONSTANTS.MAX_DURATION_HOURS) {
    warnings.push(`Duration ${config.durationHours}hr exceeds typical ${BESS_CONSTANTS.MAX_DURATION_HOURS}hr - consider phased deployment`);
  }
  if (config.efficiency < 0.80) {
    warnings.push(`Efficiency ${config.efficiency} below industry standard 0.85`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
