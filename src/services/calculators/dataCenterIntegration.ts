import { calculateDataCenter16Q, type DataCenter16QInput, type DataCenter16QResult } from './dataCenter16QCalculator';

export function mapDataCenterAnswers(answers: Record<string, unknown>): DataCenter16QInput {
  const get = (c: string, s: string) => (answers[c] || answers[s] || '') as string;
  const parseArray = (v: unknown): string[] => Array.isArray(v) ? v : typeof v === 'string' ? (JSON.parse(v) || []) : [];
  
  return {
    dataCenterTier: get('dataCenterTier', 'data_center_tier') as any || 'tier3',
    itLoadCapacity: get('itLoadCapacity', 'it_load_capacity') || '500-1000',
    electricalServiceSize: get('electricalServiceSize', 'electrical_service_size') || '2000',
    upsConfiguration: get('upsConfiguration', 'ups_configuration') || 'n+1',
    coolingType: get('coolingType', 'cooling_type') || 'crac',
    rackPowerDensity: get('rackPowerDensity', 'rack_power_density') || '5-10',
    itUtilization: get('itUtilization', 'it_utilization') || '60-80%',
    workloadProfile: get('workloadProfile', 'workload_profile') || 'steady',
    growthRate: get('growthRate', 'growth_rate') || '10-20',
    currentPUE: get('currentPUE', 'current_pue') || '1.5-1.8',
    uptimeRequirement: get('uptimeRequirement', 'uptime_requirement') || '99.99',
    monthlyElectricitySpend: get('monthlyElectricitySpend', 'monthly_electricity_spend') || '50000-100000',
    utilityRateStructure: get('utilityRateStructure', 'utility_rate_structure') as any || 'demand',
    powerQualityIssues: parseArray(get('powerQualityIssues', 'power_quality_issues')) as string[],
    outageCost: get('outageCost', 'outage_cost') || '10000-50000',
    expansionPlans: parseArray(get('expansionPlans', 'expansion_plans')) as string[],
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateDataCenterFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: any; pricingConfig?: unknown; pricingStatus?: string }
): DataCenter16QResult | null {
  try {
    const result = calculateDataCenter16Q(mapDataCenterAnswers(answers));
    console.log('💻 Data Center 16Q:', { peakKW: result.peakKW, bessKWh: result.bessKWh, confidence: result.confidence });
    return result;
  } catch (e) {
    console.error('❌ Data center calc error:', e);
    return null;
  }
}
