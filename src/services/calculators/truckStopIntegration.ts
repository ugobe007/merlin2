/**
 * TRUCK STOP 16Q INTEGRATION LAYER
 * 
 * Connects wizard answers → calculator service → wizard display
 */

import { calculateTruckStop16Q, type TruckStop16QInput, type TruckStop16QResult } from './truckStop16QCalculator';

export function mapTruckStopAnswers(answers: Record<string, unknown>): TruckStop16QInput {
  const get = (camelCase: string, snake_case: string): string => {
    return (answers[camelCase] || answers[snake_case] || '') as string;
  };
  
  const parseArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  
  return {
    truckStopType: get('truckStopType', 'truck_stop_type') as any || 'travel_center',
    fuelingPositions: get('fuelingPositions', 'fueling_positions') || '5-8',
    electricalServiceSize: get('electricalServiceSize', 'electrical_service_size') as any || '1600',
    voltageLevel: get('voltageLevel', 'voltage_level') as any || '480_3phase',
    majorFacilities: parseArray(get('majorFacilities', 'major_facilities')) as string[],
    refrigerationLoad: get('refrigerationLoad', 'refrigeration_load') as any || 'moderate',
    largestLoad: get('largestLoad', 'largest_load') || '100-250',
    dailyTrafficVolume: get('dailyTrafficVolume', 'daily_traffic_volume') || '250-500',
    peakTrafficHours: get('peakTrafficHours', 'peak_traffic_hours') || 'midday',
    operatingHours: get('operatingHours', 'operating_hours') as any || '24/7_full',
    reeferUtilization: get('reeferUtilization', 'reefer_utilization') || '25-50%',
    monthlyElectricitySpend: get('monthlyElectricitySpend', 'monthly_electricity_spend') || '25000-50000',
    utilityRateStructure: get('utilityRateStructure', 'utility_rate_structure') as any || 'demand',
    powerQualityIssues: parseArray(get('powerQualityIssues', 'power_quality_issues')) as string[],
    outageSensitivity: get('outageSensitivity', 'outage_sensitivity') as any || 'high',
    expansionPlans: parseArray(get('expansionPlans', 'expansion_plans')) as string[],
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateTruckStopFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: any; pricingConfig?: unknown; pricingStatus?: string }
): TruckStop16QResult | null {
  try {
    const input = mapTruckStopAnswers(answers);
    const result = calculateTruckStop16Q(input);
    
    console.log('🚛 Truck Stop 16Q Calculator Result:', {
      peakKW: result.peakKW,
      bessKWh: result.bessKWh,
      bessMW: result.bessMW,
      confidence: result.confidence,
      annualSavings: result.estimatedSavings.annualSavings,
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error calculating truck stop metrics:', error);
    return null;
  }
}

export function validateTruckStopAnswers(answers: Record<string, unknown>): {
  valid: boolean;
  missingFields: string[];
} {
  const requiredFields = [
    'truckStopType',
    'fuelingPositions',
    'electricalServiceSize',
    'majorFacilities',
    'refrigerationLoad',
    'dailyTrafficVolume',
    'operatingHours',
    'monthlyElectricitySpend',
    'utilityRateStructure',
    'outageSensitivity',
  ];
  
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    const snake_case = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (!answers[field] && !answers[snake_case]) {
      missingFields.push(field);
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

export function getTruckStopCompletionPct(answers: Record<string, unknown>): number {
  const validation = validateTruckStopAnswers(answers);
  const totalFields = 10;
  const completedFields = totalFields - validation.missingFields.length;
  return Math.round((completedFields / totalFields) * 100);
}
