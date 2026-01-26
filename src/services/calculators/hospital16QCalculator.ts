/**
 * HOSPITAL 16Q CALCULATOR SERVICE
 */

import { BESS_POWER_RATIOS } from '@/components/wizard/v6/constants';

export interface Hospital16QInput {
  facilityType: 'community' | 'regional' | 'teaching' | 'specialty' | 'critical_access';
  bedCount: string;
  electricalServiceSize: string;
  generatorCapacity: string;
  criticalSystems: string[];
  hvacType: string;
  occupancyRate: string;
  surgicalVolume: string;
  imagingVolume: string;
  operatingSchedule: string;
  peakDemandPeriod: string;
  monthlyElectricitySpend: string;
  utilityRateStructure: 'flat' | 'tou' | 'demand' | 'tou_demand' | 'not_sure';
  powerQualityIssues: string[];
  outageSensitivity: 'critical' | 'high' | 'moderate' | 'low';
  expansionPlans: string[];
}

export interface Hospital16QResult {
  peakKW: number;
  baseLoadKW: number;
  bessKWh: number;
  bessMW: number;
  durationHours: number;
  confidence: number;
  methodology: string;
  auditTrail: Array<{ standard: string; value: number; description: string; url: string }>;
  loadProfile: { baseLoadKW: number; peakHour: number; dailyKWh: number; criticalLoadPct: number };
  estimatedSavings: { demandChargeReduction: number; arbitragePotential: number; annualSavings: number };
  warnings: string[];
  recommendations: string[];
}

const BED_POWER = { community: 8, regional: 10, teaching: 12, specialty: 15, critical_access: 6 };

export function calculateHospital16Q(input: Hospital16QInput): Hospital16QResult {
  const bedCount = parseBeds(input.bedCount);
  const kWPerBed = BED_POWER[input.facilityType] || 10;
  const baseLoad = bedCount * kWPerBed;
  
  const criticalFactor = input.criticalSystems.length * 0.15 + 1.0;
  const peakKW = Math.round(baseLoad * criticalFactor * 1.4);
  const baseLoadKW = Math.round(peakKW * 0.85);
  
  // BESS sizing ratio (higher for backup power use case)
  const bessRatio = BESS_POWER_RATIOS.resilience || 0.70;  // Use resilience ratio for backup power
  const bessMW = (peakKW * bessRatio) / 1000;
  const durationHours = 6;
  const bessKWh = Math.round(bessMW * 1000 * durationHours);
  
  const dailyKWh = Math.round(baseLoadKW * 24);
  const demandChargeReduction = Math.round(bessMW * 1000 * 25 * 12);
  const arbitragePotential = Math.round(bessKWh * 0.11 * 365 * 0.4);
  
  let confidence = 0.75;
  if (input.electricalServiceSize !== 'not_sure') confidence += 0.05;
  if (input.criticalSystems.length >= 5) confidence += 0.05;
  confidence = Math.min(0.90, confidence);
  
  const methodology = `Hospital: ${input.facilityType} (${kWPerBed} kW/bed × ${bedCount} beds) × ${criticalFactor.toFixed(2)}x critical systems = ${peakKW} kW. BESS sized at 70% for critical backup.`;
  
  return {
    peakKW, baseLoadKW, bessKWh, bessMW, durationHours, confidence, methodology,
    auditTrail: [{ standard: 'NEC 517, NFPA 99', value: bessRatio, description: 'Critical backup requirement (70%)', url: 'https://www.nfpa.org/99' }],
    loadProfile: { baseLoadKW, peakHour: 14, dailyKWh, criticalLoadPct: 85 },
    estimatedSavings: { demandChargeReduction, arbitragePotential, annualSavings: demandChargeReduction + arbitragePotential },
    warnings: [], recommendations: ['Hospital critical loads require NEC 517 compliance and 6+ hour backup.'],
  };
}

function parseBeds(range: string): number {
  const map: Record<string, number> = { '50-100': 75, '100-200': 150, '200-400': 300, '400-800': 600, '800+': 1000 };
  return map[range] || 200;
}
