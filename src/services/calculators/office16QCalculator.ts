/**
 * OFFICE 16Q CALCULATOR SERVICE
 */

import { BESS_POWER_RATIOS } from '@/components/wizard/v6/constants';

export interface Office16QInput {
  officeType: 'small_business' | 'corporate_hq' | 'coworking' | 'mixed_use' | 'high_rise';
  squareFootage: string;
  electricalServiceSize: string;
  voltageLevel: string;
  hvacType: string;
  additionalLoads: string[];
  occupancyDensity: string;
  occupancyRate: string;
  workdaySchedule: string;
  remoteWorkPercentage: string;
  offHoursUsage: string;
  monthlyElectricitySpend: string;
  utilityRateStructure: 'flat' | 'tou' | 'demand' | 'tou_demand' | 'not_sure';
  powerQualityIssues: string[];
  outageSensitivity: 'critical' | 'high' | 'moderate' | 'low';
  expansionPlans: string[];
}

export interface Office16QResult {
  peakKW: number;
  baseLoadKW: number;
  bessKWh: number;
  bessMW: number;
  durationHours: number;
  confidence: number;
  methodology: string;
  auditTrail: Array<{ standard: string; value: number; description: string; url: string }>;
  loadProfile: { baseLoadKW: number; peakHour: number; dailyKWh: number; occupancyFactor: number };
  estimatedSavings: { demandChargeReduction: number; arbitragePotential: number; annualSavings: number };
  warnings: string[];
  recommendations: string[];
}

const OFFICE_W_PER_SF = { small_business: 3.5, corporate_hq: 5.0, coworking: 4.0, mixed_use: 4.5, high_rise: 6.0 };

export function calculateOffice16Q(input: Office16QInput): Office16QResult {
  const sqft = parseSqFt(input.squareFootage);
  const wPerSF = OFFICE_W_PER_SF[input.officeType];
  const baseLoad = (sqft * wPerSF) / 1000;
  
  const occupancy = parseOccupancyRate(input.occupancyRate);
  const remoteWork = parseRemoteWork(input.remoteWorkPercentage);
  const effectiveOccupancy = occupancy * (1 - remoteWork);
  
  const additionalLoad = input.additionalLoads.length * 25;
  const peakKW = Math.round((baseLoad * effectiveOccupancy + additionalLoad) * 1.3);
  const baseLoadKW = Math.round(peakKW * 0.4);
  
  const bessRatio = BESS_POWER_RATIOS.peak_shaving || 0.40;
  const bessMW = (peakKW * bessRatio) / 1000;
  const durationHours = 4;
  const bessKWh = Math.round(bessMW * 1000 * durationHours);
  
  const dailyKWh = Math.round(baseLoadKW * 24 + (peakKW - baseLoadKW) * 10);
  const demandChargeReduction = Math.round(bessMW * 1000 * 18 * 12);
  const arbitragePotential = Math.round(bessKWh * 0.10 * 365 * 0.5);
  
  let confidence = 0.70;
  if (input.electricalServiceSize !== 'not_sure') confidence += 0.05;
  if (input.monthlyElectricitySpend !== 'not_sure') confidence += 0.05;
  if (input.occupancyDensity !== 'not_sure') confidence += 0.05;
  confidence = Math.min(0.90, confidence);
  
  const methodology = `Office ${input.officeType}: ${sqft.toLocaleString()} SF × ${wPerSF} W/SF × ${(effectiveOccupancy * 100).toFixed(0)}% occupancy (${(remoteWork * 100).toFixed(0)}% remote) = ${peakKW} kW peak.`;
  
  return {
    peakKW, baseLoadKW, bessKWh, bessMW, durationHours, confidence, methodology,
    auditTrail: [{ standard: 'ASHRAE 90.1, CBECS', value: wPerSF, description: `${input.officeType} power density (${wPerSF} W/SF)`, url: 'https://www.ashrae.org' }],
    loadProfile: { baseLoadKW, peakHour: 14, dailyKWh, occupancyFactor: effectiveOccupancy },
    estimatedSavings: { demandChargeReduction, arbitragePotential, annualSavings: demandChargeReduction + arbitragePotential },
    warnings: [], recommendations: remoteWork > 0.3 ? ['High remote work reduces BESS ROI. Consider energy efficiency first.'] : [],
  };
}

function parseSqFt(range: string): number {
  const map: Record<string, number> = { '5000-15000': 10000, '15000-50000': 32500, '50000-150000': 100000, '150000-500000': 325000, '500000+': 750000 };
  return map[range] || 50000;
}

function parseOccupancyRate(val: string): number {
  const map: Record<string, number> = { '<50%': 0.40, '50-70%': 0.60, '70-85%': 0.77, '85-95%': 0.90, '>95%': 0.97 };
  return map[val] || 0.77;
}

function parseRemoteWork(val: string): number {
  const map: Record<string, number> = { '<10%': 0.05, '10-25%': 0.17, '25-50%': 0.37, '50-75%': 0.62, '>75%': 0.85 };
  return map[val] || 0.17;
}
