/**
 * CAR WASH INTEGRATION LAYER
 * 
 * Connects car wash 16Q questions → calculator service → wizard display
 * Maps database question answers to calculator input format
 * 
 * This is the bridge between:
 * - CompleteStep3Component (renders questions)
 * - carWash16QCalculator (does math)
 * - WizardV6/V7 (displays results)
 */

import { calculateCarWash16Q, type CarWash16QInput, type CarWash16QResult } from '@/services/calculators/carWash16QCalculator';

// =============================================================================
// ANSWER MAPPING (Database → Calculator)
// =============================================================================

/**
 * Maps raw wizard answers to typed calculator input
 * Handles both snake_case (old) and camelCase (new) field names
 */
export function mapCarWashAnswers(answers: Record<string, any>): CarWash16QInput {
  // Helper to get value (try camelCase first, then snake_case)
  const get = (camel: string, snake?: string): any => {
    return answers[camel] ?? (snake ? answers[snake] : undefined);
  };
  
  return {
    // Topology
    carWashType: get('carWashType', 'car_wash_type') || 'automatic_inbay',
    bayTunnelCount: get('bayTunnelCount', 'bay_tunnel_count') || '1',
    
    // Infrastructure
    electricalServiceSize: get('electricalServiceSize', 'electrical_service_size') || '400',
    voltageLevel: get('voltageLevel', 'voltage_level') || '277_480',
    
    // Equipment
    primaryEquipment: parseArray(get('primaryEquipment', 'primary_equipment')) as string[],
    largestMotorSize: get('largestMotorSize', 'largest_motor_size') || '10-25',
    
    // Operations
    simultaneousEquipment: get('simultaneousEquipment', 'simultaneous_equipment') || '3-4',
    averageWashesPerDay: get('averageWashesPerDay', 'average_washes_per_day') || '75-150',
    peakHourThroughput: get('peakHourThroughput', 'peak_hour_throughput') || '10-25',
    washCycleDuration: get('washCycleDuration', 'wash_cycle_duration') || '3-5',
    operatingHours: get('operatingHours', 'operating_hours') || '8-12',
    
    // Financial
    monthlyElectricitySpend: get('monthlyElectricitySpend', 'monthly_electricity_spend') || '3000-7500',
    utilityRateStructure: get('utilityRateStructure', 'utility_rate_structure') || 'demand',
    
    // Resilience
    powerQualityIssues: parseArray(get('powerQualityIssues', 'power_quality_issues')) as string[],
    outageSensitivity: get('outageSensitivity', 'outage_sensitivity') || 'operations_stop',
    
    // Planning
    expansionPlans: parseArray(get('expansionPlans', 'expansion_plans')) as string[],
  };
}

/**
 * Parse array values (handles JSON strings, arrays, or undefined)
 */
function parseArray(value: any): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  }
  return undefined;
}

// =============================================================================
// MAIN INTEGRATION FUNCTION
// =============================================================================

/**
 * ✅ Step 3 Compute Context (Jan 23, 2026)
 * Optional context passed from Step3Integration for enhanced calculations
 */
export type Step3ComputeContext = {
  template?: any;           // Industry template from DB
  pricingConfig?: unknown;  // Frozen pricing config
  pricingStatus?: string;   // 'ready' | 'fallback'
};

/**
 * Calculate car wash BESS sizing from wizard answers
 * This is called by Step3Integration.tsx or QuoteEngine
 * 
 * @param answers - Raw wizard answers (from CompleteStep3Component)
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateCarWashFromAnswers(
  answers: Record<string, any>,
  _ctx?: Step3ComputeContext
): CarWash16QResult {
  const input = mapCarWashAnswers(answers);
  const result = calculateCarWash16Q(input);
  
  // TODO: Future enhancement - use _ctx.template for confidence boosting
  // if (_ctx?.template?.loadProfile?.baseline_kw) { ... }
  
  if (import.meta.env.DEV) {
    console.log('[CarWash Integration] Input:', input);
    console.log('[CarWash Integration] Result:', result);
  }
  
  return result;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if all required car wash questions are answered
 */
export function validateCarWashAnswers(answers: Record<string, any>): {
  valid: boolean;
  missingFields: string[];
} {
  const requiredFields = [
    'carWashType',
    'bayTunnelCount',
    'electricalServiceSize',
    'voltageLevel',
    'primaryEquipment',
    'largestMotorSize',
    'simultaneousEquipment',
    'averageWashesPerDay',
    'peakHourThroughput',
    'washCycleDuration',
    'operatingHours',
    'monthlyElectricitySpend',
    'utilityRateStructure',
    'outageSensitivity',
  ];
  
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    // Check both camelCase and snake_case
    const snake = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (!answers[field] && !answers[snake]) {
      missingFields.push(field);
    }
  });
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get completion percentage for car wash questionnaire
 */
export function getCarWashCompletionPct(answers: Record<string, any>): number {
  const totalQuestions = 16;
  const answeredCount = Object.keys(answers).filter(key => {
    const value = answers[key];
    return value !== null && value !== undefined && value !== '';
  }).length;
  
  return Math.round((answeredCount / totalQuestions) * 100);
}
