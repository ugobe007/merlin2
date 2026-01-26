/**
 * CAR WASH 16Q CALCULATOR SERVICE
 * 
 * Bottom-up load reconstruction from 16 standardized questions
 * Feeds WizardV6 and WizardV7 with accurate BESS sizing
 * 
 * Engineering Approach:
 * 1. Topology anchor (type + bay count)
 * 2. Equipment inventory (pumps, blowers, etc.)
 * 3. Concurrency factor (simultaneous operation)
 * 4. Duty cycle (throughput + wash duration)
 * 5. BESS sizing (IEEE 4538388 ratio + TrueQuote™)
 */

import { BESS_POWER_RATIOS } from '@/components/wizard/v6/constants';

// =============================================================================
// TYPES
// =============================================================================

export interface CarWash16QInput {
  // Topology (Q1-Q2)
  carWashType: 'self_serve' | 'automatic_inbay' | 'conveyor_tunnel' | 'combination' | 'other';
  bayTunnelCount: '1' | '2-3' | '4-6' | '7+';
  
  // Infrastructure (Q3-Q4)
  electricalServiceSize: '200' | '400' | '600' | '800+' | 'not_sure';
  voltageLevel: '208' | '240' | '277_480' | 'mixed' | 'not_sure';
  
  // Equipment (Q5-Q6)
  primaryEquipment: string[]; // Array of equipment values
  largestMotorSize: '<10' | '10-25' | '25-50' | '50-100' | '100+' | 'not_sure';
  
  // Operations (Q7-Q11)
  simultaneousEquipment: '1-2' | '3-4' | '5-7' | '8+';
  averageWashesPerDay: '<30' | '30-75' | '75-150' | '150-300' | '300+';
  peakHourThroughput: '<10' | '10-25' | '25-50' | '50+';
  washCycleDuration: '<3' | '3-5' | '5-8' | '8-12' | '12+';
  operatingHours: '<8' | '8-12' | '12-18' | '18-24';
  
  // Financial (Q12-Q13)
  monthlyElectricitySpend: '<1000' | '1000-3000' | '3000-7500' | '7500-15000' | '15000+' | 'not_sure';
  utilityRateStructure: 'flat' | 'tou' | 'demand' | 'tou_demand' | 'not_sure';
  
  // Resilience (Q14-Q15)
  powerQualityIssues?: string[]; // Optional multi-select
  outageSensitivity: 'operations_stop' | 'partial_operations' | 'minor_disruption' | 'no_impact';
  
  // Planning (Q16)
  expansionPlans?: string[]; // Optional multi-select
}

export interface CarWash16QResult {
  // Core sizing
  peakKW: number;           // Peak electrical demand
  bessKWh: number;          // Battery capacity recommended
  bessMW: number;           // Battery power rating
  durationHours: number;    // Battery duration
  
  // Confidence + audit
  confidence: number;       // 0.0-1.0 (how confident in sizing)
  methodology: string;      // Human-readable explanation
  auditTrail: Source[];     // TrueQuote™ sources
  
  // Load profile
  loadProfile: {
    baseLoadKW: number;     // Minimum continuous load
    peakHour: number;       // Hour of peak (0-23)
    dailyKWh: number;       // Daily energy consumption
    dutyCycle: number;      // 0.0-1.0
  };
  
  // Financial preview
  estimatedSavings: {
    demandChargeReduction: number;
    arbitragePotential: number;
    annualSavings: number;
  };
  
  // Metadata
  warnings: string[];       // Sizing warnings
  recommendations: string[]; // Engineering recommendations
}

interface Source {
  standard: string;
  value: string | number;
  description: string;
  url?: string;
}

// =============================================================================
// EQUIPMENT POWER DATABASE (kW per unit)
// =============================================================================

const EQUIPMENT_POWER: Record<string, number> = {
  high_pressure_pumps: 20,
  conveyor_motor: 15,
  blowers_dryers: 40,
  ro_system: 10,
  water_heaters_electric: 50,
  lighting: 5,
  vacuum_stations: 15,
  pos_controls: 2,
  air_compressors: 10,
};

// =============================================================================
// TOPOLOGY BASELINE LOAD (kW for single bay/tunnel)
// =============================================================================

const TOPOLOGY_BASELINE: Record<string, number> = {
  self_serve: 30,          // Lower load, customer-operated
  automatic_inbay: 60,     // Moderate load, automated
  conveyor_tunnel: 100,    // High load, continuous operation
  combination: 75,         // Average of multiple types
  other: 60,              // Default to in-bay
};

// =============================================================================
// MAIN CALCULATOR FUNCTION
// =============================================================================

export function calculateCarWash16Q(input: CarWash16QInput): CarWash16QResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const auditTrail: Source[] = [];
  
  // Step 1: Calculate base load from topology
  const topologyBaseKW = TOPOLOGY_BASELINE[input.carWashType] || 60;
  
  // Step 2: Calculate equipment load (bottom-up)
  let equipmentKW = 0;
  if (input.primaryEquipment && Array.isArray(input.primaryEquipment)) {
    input.primaryEquipment.forEach(equip => {
      equipmentKW += EQUIPMENT_POWER[equip] || 0;
    });
  }
  
  // Step 3: Get concurrency factor (not all equipment runs at once)
  const concurrencyMap = {
    '1-2': 0.5,
    '3-4': 0.75,
    '5-7': 0.9,
    '8+': 1.0,
  };
  const concurrency = concurrencyMap[input.simultaneousEquipment] || 0.75;
  
  // Step 4: Calculate nameplate peak
  const nameplateKW = Math.max(topologyBaseKW, equipmentKW);
  const truePeakKW = nameplateKW * concurrency;
  
  // Step 5: Apply bay/tunnel multiplier
  const bayMultiplierMap = {
    '1': 1.0,
    '2-3': 1.8,   // Not 2x (shared infrastructure)
    '4-6': 3.5,   // Economies of scale
    '7+': 6.0,    // Large facility
  };
  const bayMultiplier = bayMultiplierMap[input.bayTunnelCount] || 1.0;
  const peakKW = truePeakKW * bayMultiplier;
  
  // Step 6: Check against electrical service constraint
  const serviceKWMap = {
    '200': 48,
    '400': 96,
    '600': 144,
    '800+': 192,
    'not_sure': 96,
  };
  const serviceKW = serviceKWMap[input.electricalServiceSize] || 96;
  
  if (peakKW > serviceKW) {
    warnings.push(`Calculated peak (${Math.round(peakKW)} kW) exceeds service rating (${serviceKW} kW). Electrical upgrade may be required.`);
  }
  
  // Step 7: BESS sizing using IEEE 4538388 ratio
  const bessRatio = BESS_POWER_RATIOS.peak_shaving || 0.40;
  const bessMW = (peakKW / 1000) * bessRatio;
  
  auditTrail.push({
    standard: 'IEEE 4538388, MDPI Energies 11(8):2048',
    value: bessRatio,
    description: 'BESS/Peak ratio for commercial peak shaving (40%)',
    url: 'https://ieeexplore.ieee.org/document/4538388',
  });
  
  // Step 8: Duration sizing (4 hours standard for peak shaving)
  const durationHours = 4;
  const bessKWh = bessMW * 1000 * durationHours;
  
  // Step 9: Calculate duty cycle
  const washesPerDayMap = {
    '<30': 20,
    '30-75': 50,
    '75-150': 110,
    '150-300': 220,
    '300+': 400,
  };
  const washesPerDay = washesPerDayMap[input.averageWashesPerDay] || 110;
  
  const cycleDurationMap = {
    '<3': 2,
    '3-5': 4,
    '5-8': 6,
    '8-12': 10,
    '12+': 15,
  };
  const cycleDuration = cycleDurationMap[input.washCycleDuration] || 4;
  
  const operatingHoursMap = {
    '<8': 6,
    '8-12': 10,
    '12-18': 15,
    '18-24': 21,
  };
  const operatingHours = operatingHoursMap[input.operatingHours] || 10;
  
  const dutyCycle = (washesPerDay * cycleDuration) / (operatingHours * 60);
  const dailyKWh = peakKW * dutyCycle * 24;
  
  // Step 10: Calculate savings potential
  const rateMultiplierMap = {
    'flat': 0.5,
    'tou': 0.8,
    'demand': 1.0,
    'tou_demand': 1.2,
    'not_sure': 0.8,
  };
  const rateMultiplier = rateMultiplierMap[input.utilityRateStructure] || 1.0;
  
  const demandChargeReduction = peakKW * 15 * 12 * rateMultiplier; // $15/kW/month avg
  const arbitragePotential = bessKWh * 0.10 * 365 * 0.5; // $0.10/kWh delta, 50% cycles
  const annualSavings = demandChargeReduction + arbitragePotential;
  
  // Step 11: Confidence scoring
  let confidence = 0.70; // Base confidence
  
  // Increase confidence if we have electrical service size
  if (input.electricalServiceSize !== 'not_sure') {
    confidence += 0.05;
  }
  
  // Increase confidence if we have monthly bill (validates calculations)
  if (input.monthlyElectricitySpend !== 'not_sure') {
    confidence += 0.05;
  }
  
  // Increase confidence if equipment list is detailed
  if (input.primaryEquipment && input.primaryEquipment.length >= 4) {
    confidence += 0.05;
  }
  
  // Increase confidence if we know utility rate structure
  if (input.utilityRateStructure !== 'not_sure') {
    confidence += 0.05;
  }
  
  // Decrease confidence for "other" or complex configurations
  if (input.carWashType === 'other' || input.carWashType === 'combination') {
    confidence -= 0.05;
  }
  
  // Step 12: Recommendations
  if (input.utilityRateStructure === 'demand' || input.utilityRateStructure === 'tou_demand') {
    recommendations.push('Excellent BESS ROI potential with demand charges. Peak shaving will provide immediate savings.');
  }
  
  if (input.expansionPlans && input.expansionPlans.includes('add_bay_tunnel')) {
    recommendations.push('Consider oversizing BESS by 25% to accommodate planned expansion.');
    warnings.push('Expansion plans detected. Review sizing before finalizing.');
  }
  
  if (dutyCycle > 0.8) {
    recommendations.push('High duty cycle detected. Consider solar + BESS for maximum savings.');
  }
  
  // Generate methodology string
  const methodology = `Bottom-up load reconstruction: ${input.carWashType} (${topologyBaseKW} kW base) × ${bayMultiplier}x bays × ${concurrency} concurrency = ${Math.round(peakKW)} kW peak. BESS sized at ${(bessRatio * 100).toFixed(0)}% of peak per IEEE 4538388 standard.`;
  
  return {
    peakKW: Math.round(peakKW * 10) / 10,
    bessKWh: Math.round(bessKWh),
    bessMW: Math.round(bessMW * 100) / 100,
    durationHours,
    confidence: Math.round(confidence * 100) / 100,
    methodology,
    auditTrail,
    loadProfile: {
      baseLoadKW: Math.round(peakKW * 0.2), // Assume 20% base load
      peakHour: 14, // 2 PM typical peak for car washes
      dailyKWh: Math.round(dailyKWh),
      dutyCycle: Math.round(dutyCycle * 100) / 100,
    },
    estimatedSavings: {
      demandChargeReduction: Math.round(demandChargeReduction),
      arbitragePotential: Math.round(arbitragePotential),
      annualSavings: Math.round(annualSavings),
    },
    warnings,
    recommendations,
  };
}

// =============================================================================
// QUICK ESTIMATE (for UI previews without full 16Q)
// =============================================================================

export function estimateCarWashQuick(
  carWashType: string,
  bayCount: string,
): { peakKW: number; bessKWh: number; confidence: number } {
  const baseKW = TOPOLOGY_BASELINE[carWashType] || 60;
  const bayMultiplier = bayCount === '1' ? 1.0 : bayCount === '2-3' ? 1.8 : 3.5;
  const peakKW = baseKW * bayMultiplier;
  const bessKWh = peakKW * 0.40 * 4; // 40% ratio × 4 hours
  
  return {
    peakKW: Math.round(peakKW),
    bessKWh: Math.round(bessKWh),
    confidence: 0.60, // Lower confidence without full questionnaire
  };
}
