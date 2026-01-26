/**
 * =============================================================================
 * @deprecated LEGACY FILE - DO NOT USE
 * =============================================================================
 * 
 * This file is DEPRECATED as of Jan 23, 2026.
 * 
 * USE INSTEAD: @/services/calculators/carWashIntegration.ts
 * 
 * Step3Integration.tsx imports from the canonical location:
 *   import { calculateCarWashFromAnswers } from "@/services/calculators/carWashIntegration";
 * 
 * This file remains for backward compatibility but will be removed.
 * =============================================================================
 */

/**
 * =============================================================================
 * CAR WASH 16Q INTEGRATION LAYER (LEGACY)
 * =============================================================================
 * 
 * Connects CompleteStep3Component answers to calculateCarWash16Q()
 * Updates WizardV6 power metrics in real-time
 * 
 * This file maps the 16 car wash questions from the database to the
 * calculator input format and provides power/BESS recommendations.
 */

import { calculateCarWash16Q, type CarWash16QInput, type CarWash16QResult } from '@/services/carWash16QCalculator';

/**
 * Maps CompleteStep3Component answers to CarWash16Q calculator input
 * 
 * @param answers - Raw answers from Step 3 questionnaire
 * @returns Formatted input for calculateCarWash16Q()
 */
export function mapAnswersToCarWash16QInput(
  answers: Record<string, unknown>
): CarWash16QInput {
  // Helper to safely get string value
  const getString = (key: string, fallback: string): string => {
    const val = answers[key];
    return typeof val === 'string' ? val : fallback;
  };

  // Helper to safely get array value
  const getArray = (key: string, fallback: string[] = []): string[] => {
    const val = answers[key];
    if (Array.isArray(val)) return val as string[];
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  return {
    // Q1-2: Topology
    carWashType: getString('carWashType', 'automatic_inbay') as CarWash16QInput['carWashType'],
    bayTunnelCount: getString('bayTunnelCount', '1') as CarWash16QInput['bayTunnelCount'],
    
    // Q3-4: Infrastructure
    electricalServiceSize: getString('electricalServiceSize', '400') as CarWash16QInput['electricalServiceSize'],
    voltageLevel: getString('voltageLevel', '277_480') as CarWash16QInput['voltageLevel'],
    
    // Q5-6: Equipment
    primaryEquipment: getArray('primaryEquipment', ['high_pressure_pumps', 'blowers_dryers', 'lighting', 'pos_controls']),
    largestMotorSize: getString('largestMotorSize', '10-25') as CarWash16QInput['largestMotorSize'],
    
    // Q7: Concurrency
    simultaneousEquipment: getString('simultaneousEquipment', '3-4') as CarWash16QInput['simultaneousEquipment'],
    
    // Q8-11: Operations
    averageWashesPerDay: getString('averageWashesPerDay', '75-150') as CarWash16QInput['averageWashesPerDay'],
    peakHourThroughput: getString('peakHourThroughput', '10-25') as CarWash16QInput['peakHourThroughput'],
    washCycleDuration: getString('washCycleDuration', '3-5') as CarWash16QInput['washCycleDuration'],
    operatingHours: getString('operatingHours', '8-12') as CarWash16QInput['operatingHours'],
    
    // Q12-13: Financial
    monthlyElectricitySpend: getString('monthlyElectricitySpend', '3000-7500') as CarWash16QInput['monthlyElectricitySpend'],
    utilityRateStructure: getString('utilityRateStructure', 'demand') as CarWash16QInput['utilityRateStructure'],
    
    // Q14-15: Resilience
    powerQualityIssues: getArray('powerQualityIssues', ['none']),
    outageSensitivity: getString('outageSensitivity', 'operations_stop') as CarWash16QInput['outageSensitivity'],
    
    // Q16: Expansion
    expansionPlans: getArray('expansionPlans', ['none']),
  };
}

/**
 * Calculate car wash power metrics from Step 3 answers
 * 
 * @param answers - Raw answers from Step 3 questionnaire
 * @returns Full calculator result with power, energy, BESS sizing, financial metrics
 */
export function calculateCarWashMetrics(
  answers: Record<string, unknown>
): CarWash16QResult | null {
  try {
    const input = mapAnswersToCarWash16QInput(answers);
    const result = calculateCarWash16Q(input);
    
    console.log('🚗 Car Wash 16Q Calculator Result:', {
      peakDemandKW: result.peakDemandKW,
      bessRecommendedKW: result.bessRecommendedKW,
      bessRecommendedKWh: result.bessRecommendedKWh,
      confidence: result.confidence,
      totalAnnualSavings: result.totalAnnualSavings,
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error calculating car wash metrics:', error);
    return null;
  }
}

/**
 * Extract simple power metrics for WizardV6 power gauge
 * 
 * @param result - Full calculator result
 * @returns Simple metrics for power gauge display
 */
export function extractPowerMetrics(result: CarWash16QResult | null): {
  peakDemandKW: number;
  dailyEnergyKWh: number;
  serviceUtilization: number;
  serviceLimitReached: boolean;
} {
  if (!result) {
    return {
      peakDemandKW: 0,
      dailyEnergyKWh: 0,
      serviceUtilization: 0,
      serviceLimitReached: false,
    };
  }
  
  return {
    peakDemandKW: result.peakDemandKW,
    dailyEnergyKWh: result.dailyEnergyKWh,
    serviceUtilization: result.serviceUtilization,
    serviceLimitReached: result.serviceLimitReached,
  };
}

/**
 * Extract BESS recommendations for Step 4/5
 * 
 * @param result - Full calculator result
 * @returns BESS sizing recommendations
 */
export function extractBESSRecommendations(result: CarWash16QResult | null): {
  bessKW: number;
  bessKWh: number;
  bessDurationHours: number;
  backupRuntimeHours: number;
} {
  if (!result) {
    return {
      bessKW: 0,
      bessKWh: 0,
      bessDurationHours: 0,
      backupRuntimeHours: 0,
    };
  }
  
  return {
    bessKW: result.bessRecommendedKW,
    bessKWh: result.bessRecommendedKWh,
    bessDurationHours: result.bessDurationHours,
    backupRuntimeHours: result.backupRuntimeHours,
  };
}
