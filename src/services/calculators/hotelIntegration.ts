/**
 * HOTEL 16Q INTEGRATION LAYER
 * 
 * Connects wizard answers → calculator service → wizard display
 * Handles field name mapping and validation
 */

import { calculateHotel16Q, type Hotel16QInput, type Hotel16QResult } from './hotel16QCalculator';

/**
 * Map wizard answers to typed calculator input
 */
export function mapHotelAnswers(answers: Record<string, unknown>): Hotel16QInput {
  // Helper to get field with both naming conventions
  const get = (camelCase: string, snake_case: string): string => {
    return (answers[camelCase] || answers[snake_case] || '') as string;
  };
  
  // Helper to parse array values (handles JSON strings or arrays)
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
    // Topology
    hotelClass: get('hotelClass', 'hotel_class') as any || 'midscale',
    roomCount: get('roomCount', 'room_count') || '100-150',
    
    // Infrastructure
    electricalServiceSize: get('electricalServiceSize', 'electrical_service_size') as any || '800',
    voltageLevel: get('voltageLevel', 'voltage_level') as any || '277_480',
    
    // Equipment
    majorAmenities: parseArray(get('majorAmenities', 'major_amenities')) as string[],
    hvacSystem: get('hvacSystem', 'hvac_system') as any || 'central_ac',
    waterHeating: get('waterHeating', 'water_heating') as any || 'electric_tank',
    
    // Operations
    averageOccupancy: get('averageOccupancy', 'average_occupancy') as any || '70-85%',
    peakSeasonMonths: get('peakSeasonMonths', 'peak_season_months') || '5-6',
    operatingHours: get('operatingHours', 'operating_hours') as any || 'full_service_24hr',
    peakCheckInTime: get('peakCheckInTime', 'peak_check_in_time') as any || 'afternoon',
    
    // Financial
    monthlyElectricitySpend: get('monthlyElectricitySpend', 'monthly_electricity_spend') || '15000-30000',
    utilityRateStructure: get('utilityRateStructure', 'utility_rate_structure') as any || 'demand',
    
    // Resilience
    backupPowerNeeds: parseArray(get('backupPowerNeeds', 'backup_power_needs')) as string[],
    outageSensitivity: get('outageSensitivity', 'outage_sensitivity') as any || 'high',
    
    // Planning
    expansionPlans: parseArray(get('expansionPlans', 'expansion_plans')) as string[],
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateHotelFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: any; pricingConfig?: unknown; pricingStatus?: string }
): Hotel16QResult | null {
  try {
    const input = mapHotelAnswers(answers);
    const result = calculateHotel16Q(input);
    
    console.log('🏨 Hotel 16Q Calculator Result:', {
      peakKW: result.peakKW,
      bessKWh: result.bessKWh,
      bessMW: result.bessMW,
      confidence: result.confidence,
      annualSavings: result.estimatedSavings.annualSavings,
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error calculating hotel metrics:', error);
    return null;
  }
}

/**
 * Validate that required fields are present
 */
export function validateHotelAnswers(answers: Record<string, unknown>): {
  valid: boolean;
  missingFields: string[];
} {
  const requiredFields = [
    'hotelClass',
    'roomCount',
    'electricalServiceSize',
    'voltageLevel',
    'majorAmenities',
    'hvacSystem',
    'waterHeating',
    'averageOccupancy',
    'monthlyElectricitySpend',
    'utilityRateStructure',
    'backupPowerNeeds',
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

/**
 * Get completion percentage for progress UI
 */
export function getHotelCompletionPct(answers: Record<string, unknown>): number {
  const validation = validateHotelAnswers(answers);
  const totalFields = 12; // Required fields
  const completedFields = totalFields - validation.missingFields.length;
  return Math.round((completedFields / totalFields) * 100);
}
