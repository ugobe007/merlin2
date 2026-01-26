import { calculateEVCharging16Q, type EVCharging16QInput, type EVCharging16QResult } from './evCharging16QCalculator';

export function mapEVChargingAnswers(answers: Record<string, unknown>): EVCharging16QInput {
  const get = (c: string, s: string) => (answers[c] || answers[s] || '') as string;
  const parseArray = (v: unknown): string[] => Array.isArray(v) ? v : typeof v === 'string' ? (JSON.parse(v) || []) : [];
  
  return {
    chargingHubType: get('chargingHubType', 'charging_hub_type') as any || 'retail',
    chargerCounts: get('chargerCounts', 'charger_counts') || '{"level2":12,"dcfc":4,"hpc":2}',
    electricalServiceSize: get('electricalServiceSize', 'electrical_service_size') as any || '1600',
    voltageLevel: get('voltageLevel', 'voltage_level') as any || '480_3phase',
    additionalLoads: parseArray(get('additionalLoads', 'additional_loads')) as string[],
    loadManagement: get('loadManagement', 'load_management') as any || 'dynamic_smart',
    utilizationRate: get('utilizationRate', 'utilization_rate') as any || '50-75%',
    sessionsPerDay: get('sessionsPerDay', 'sessions_per_day') || '50-100',
    peakChargingHours: get('peakChargingHours', 'peak_charging_hours') || 'evening',
    sessionDuration: get('sessionDuration', 'session_duration') || '30-60',
    operatingHours: get('operatingHours', 'operating_hours') || '24/7',
    monthlyElectricitySpend: get('monthlyElectricitySpend', 'monthly_electricity_spend') || '25000-50000',
    utilityRateStructure: get('utilityRateStructure', 'utility_rate_structure') as any || 'demand',
    gridCapacityIssues: parseArray(get('gridCapacityIssues', 'grid_capacity_issues')) as string[],
    outageSensitivity: get('outageSensitivity', 'outage_sensitivity') as any || 'moderate',
    expansionPlans: parseArray(get('expansionPlans', 'expansion_plans')) as string[],
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateEVChargingFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: any; pricingConfig?: unknown; pricingStatus?: string }
): EVCharging16QResult | null {
  try {
    const result = calculateEVCharging16Q(mapEVChargingAnswers(answers));
    console.log('⚡ EV Charging 16Q:', { peakKW: result.peakKW, bessKWh: result.bessKWh, confidence: result.confidence });
    return result;
  } catch (e) {
    console.error('❌ EV charging calc error:', e);
    return null;
  }
}
