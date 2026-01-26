import { calculateOffice16Q, type Office16QInput, type Office16QResult } from './office16QCalculator';

export function mapOfficeAnswers(answers: Record<string, unknown>): Office16QInput {
  const get = (c: string, s: string) => (answers[c] || answers[s] || '') as string;
  const parseArray = (v: unknown): string[] => Array.isArray(v) ? v : typeof v === 'string' ? (JSON.parse(v) || []) : [];
  
  return {
    officeType: get('officeType', 'office_type') as any || 'corporate_hq',
    squareFootage: get('squareFootage', 'square_footage') || '50000-150000',
    electricalServiceSize: get('electricalServiceSize', 'electrical_service_size') || '800',
    voltageLevel: get('voltageLevel', 'voltage_level') || '277_480',
    hvacType: get('hvacType', 'hvac_type') || 'central_vav',
    additionalLoads: parseArray(get('additionalLoads', 'additional_loads')) as string[],
    occupancyDensity: get('occupancyDensity', 'occupancy_density') || '150-250',
    occupancyRate: get('occupancyRate', 'occupancy_rate') || '70-85%',
    workdaySchedule: get('workdaySchedule', 'workday_schedule') || '8am-6pm',
    remoteWorkPercentage: get('remoteWorkPercentage', 'remote_work_percentage') || '10-25%',
    offHoursUsage: get('offHoursUsage', 'off_hours_usage') || 'minimal',
    monthlyElectricitySpend: get('monthlyElectricitySpend', 'monthly_electricity_spend') || '15000-30000',
    utilityRateStructure: get('utilityRateStructure', 'utility_rate_structure') as any || 'demand',
    powerQualityIssues: parseArray(get('powerQualityIssues', 'power_quality_issues')) as string[],
    outageSensitivity: get('outageSensitivity', 'outage_sensitivity') as any || 'moderate',
    expansionPlans: parseArray(get('expansionPlans', 'expansion_plans')) as string[],
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateOfficeFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: any; pricingConfig?: unknown; pricingStatus?: string }
): Office16QResult | null {
  try {
    const result = calculateOffice16Q(mapOfficeAnswers(answers));
    console.log('🏢 Office 16Q:', { peakKW: result.peakKW, bessKWh: result.bessKWh, confidence: result.confidence });
    return result;
  } catch (e) {
    console.error('❌ Office calc error:', e);
    return null;
  }
}
