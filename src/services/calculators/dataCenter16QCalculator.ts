/**
 * DATA CENTER 16Q CALCULATOR SERVICE
 */


export interface DataCenter16QInput {
  dataCenterTier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  itLoadCapacity: string;
  electricalServiceSize: string;
  upsConfiguration: string;
  coolingType: string;
  rackPowerDensity: string;
  itUtilization: string;
  workloadProfile: string;
  growthRate: string;
  currentPUE: string;
  uptimeRequirement: string;
  monthlyElectricitySpend: string;
  utilityRateStructure: 'flat' | 'tou' | 'demand' | 'tou_demand' | 'not_sure';
  powerQualityIssues: string[];
  outageCost: string;
  expansionPlans: string[];
}

export interface DataCenter16QResult {
  peakKW: number;
  baseLoadKW: number;
  bessKWh: number;
  bessMW: number;
  durationHours: number;
  confidence: number;
  methodology: string;
  auditTrail: Array<{ standard: string; value: number; description: string; url: string }>;
  loadProfile: { baseLoadKW: number; peakHour: number; dailyKWh: number; pue: number };
  estimatedSavings: { demandChargeReduction: number; arbitragePotential: number; annualSavings: number };
  warnings: string[];
  recommendations: string[];
}

const TIER_PUE = { tier1: 2.0, tier2: 1.8, tier3: 1.5, tier4: 1.3 };

export function calculateDataCenter16Q(input: DataCenter16QInput): DataCenter16QResult {
  const itLoad = parseITLoad(input.itLoadCapacity);
  const pue = parsePUE(input.currentPUE) || TIER_PUE[input.dataCenterTier];
  const totalLoad = itLoad * pue;
  
  const utilization = parseUtilization(input.itUtilization);
  const peakKW = Math.round(totalLoad * utilization);
  const baseLoadKW = Math.round(peakKW * 0.95);
  
  const bessRatio = input.dataCenterTier === 'tier4' ? 1.0 : input.dataCenterTier === 'tier3' ? 0.80 : 0.60;
  const bessMW = (peakKW * bessRatio) / 1000;
  const durationHours = input.dataCenterTier === 'tier4' ? 8 : 4;
  const bessKWh = Math.round(bessMW * 1000 * durationHours);
  
  const dailyKWh = Math.round(baseLoadKW * 24);
  const demandChargeReduction = Math.round(bessMW * 1000 * 30 * 12);
  const arbitragePotential = Math.round(bessKWh * 0.12 * 365 * 0.3);
  
  let confidence = 0.80;
  if (input.currentPUE !== 'not_sure') confidence += 0.05;
  if (input.itUtilization !== 'not_sure') confidence += 0.05;
  confidence = Math.min(0.90, confidence);
  
  const methodology = `Data center ${input.dataCenterTier}: ${itLoad} kW IT load × ${pue.toFixed(2)} PUE × ${(utilization * 100).toFixed(0)}% utilization = ${peakKW} kW. BESS at ${(bessRatio * 100).toFixed(0)}% for ${input.dataCenterTier} uptime.`;
  
  return {
    peakKW, baseLoadKW, bessKWh, bessMW, durationHours, confidence, methodology,
    auditTrail: [{ standard: 'Uptime Institute Tier Standard', value: bessRatio, description: `${input.dataCenterTier} backup requirement`, url: 'https://uptimeinstitute.com' }],
    loadProfile: { baseLoadKW, peakHour: 0, dailyKWh, pue },
    estimatedSavings: { demandChargeReduction, arbitragePotential, annualSavings: demandChargeReduction + arbitragePotential },
    warnings: [], recommendations: [`${input.dataCenterTier} requires ${durationHours}-hour backup for certification.`],
  };
}

function parseITLoad(range: string): number {
  const map: Record<string, number> = { '100-500': 300, '500-1000': 750, '1000-2500': 1750, '2500-5000': 3750, '5000+': 7500 };
  return map[range] || 1000;
}

function parsePUE(val: string): number {
  const map: Record<string, number> = { '<1.3': 1.2, '1.3-1.5': 1.4, '1.5-1.8': 1.65, '1.8-2.0': 1.9, '>2.0': 2.2 };
  return map[val] || 0;
}

function parseUtilization(val: string): number {
  const map: Record<string, number> = { '<40%': 0.35, '40-60%': 0.50, '60-80%': 0.70, '80-95%': 0.87, '>95%': 0.97 };
  return map[val] || 0.70;
}
