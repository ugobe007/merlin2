import { calculateHospital16Q, type Hospital16QInput, type Hospital16QResult } from './hospital16QCalculator';

export function mapHospitalAnswers(answers: Record<string, unknown>): Hospital16QInput {
  const get = (c: string, s: string) => (answers[c] || answers[s] || '') as string;
  const parseArray = (v: unknown): string[] => Array.isArray(v) ? v : typeof v === 'string' ? (JSON.parse(v) || []) : [];
  
  return {
    facilityType: get('facilityType', 'facility_type') as any || 'regional',
    bedCount: get('bedCount', 'bed_count') || '100-200',
    electricalServiceSize: get('electricalServiceSize', 'electrical_service_size') || '2000',
    generatorCapacity: get('generatorCapacity', 'generator_capacity') || '1000-2000',
    criticalSystems: parseArray(get('criticalSystems', 'critical_systems')) as string[],
    hvacType: get('hvacType', 'hvac_type') || 'central_vav',
    occupancyRate: get('occupancyRate', 'occupancy_rate') || '70-85%',
    surgicalVolume: get('surgicalVolume', 'surgical_volume') || '10-25',
    imagingVolume: get('imagingVolume', 'imaging_volume') || 'moderate',
    operatingSchedule: get('operatingSchedule', 'operating_schedule') || '24/7',
    peakDemandPeriod: get('peakDemandPeriod', 'peak_demand_period') || 'afternoon',
    monthlyElectricitySpend: get('monthlyElectricitySpend', 'monthly_electricity_spend') || '50000-100000',
    utilityRateStructure: get('utilityRateStructure', 'utility_rate_structure') as any || 'demand',
    powerQualityIssues: parseArray(get('powerQualityIssues', 'power_quality_issues')) as string[],
    outageSensitivity: get('outageSensitivity', 'outage_sensitivity') as any || 'critical',
    expansionPlans: parseArray(get('expansionPlans', 'expansion_plans')) as string[],
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateHospitalFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: any; pricingConfig?: unknown; pricingStatus?: string }
): Hospital16QResult | null {
  try {
    const result = calculateHospital16Q(mapHospitalAnswers(answers));
    console.log('🏥 Hospital 16Q:', { peakKW: result.peakKW, bessKWh: result.bessKWh, confidence: result.confidence });
    return result;
  } catch (e) {
    console.error('❌ Hospital calc error:', e);
    return null;
  }
}
