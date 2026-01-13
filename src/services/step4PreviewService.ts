/**
 * STEP 4 PREVIEW SERVICE
 * ======================
 * 
 * Provides SSOT-compliant preview estimates for Step 4 Options.
 * Uses the same constants as TrueQuoteEngineV2 for consistency.
 * 
 * NOTE: These are ESTIMATES for UI preview only.
 * Final values come from Step 5 MagicFit via TrueQuote.
 */

import { TRUEQUOTE_CONSTANTS, DEFAULTS } from './data/constants';

// ============================================================================
// SOLAR PREVIEW
// ============================================================================

export interface SolarPreviewInput {
  annualUsageKwh: number;
  sunHoursPerDay: number;
  coveragePercent: number;  // 0.15, 0.30, 0.50
}

export interface SolarPreviewResult {
  name: string;
  sizeKw: number;
  sizeLabel: string;
  coveragePercent: number;
  panelCount: number;
  annualProductionKwh: number;
  annualSavings: number;
  installCost: number;
  netCostAfterITC: number;
  paybackYears: number;
  co2OffsetTons: number;
}

/**
 * Calculate solar preview using SSOT constants
 */
export function calculateSolarPreview(
  input: SolarPreviewInput,
  tierName: string
): SolarPreviewResult {
  const { annualUsageKwh, sunHoursPerDay, coveragePercent } = input;
  
  // Use SSOT constants
  const solarCostPerWatt = DEFAULTS.Solar.costPerWatt;
  const federalITCRate = TRUEQUOTE_CONSTANTS.FEDERAL_ITC_RATE;
  const degradationFactor = 0.85;
  const electricityRate = 0.12; // Will be refined in Step 5 with actual utility rate
  const co2PerKwh = 0.0004; // tons CO2 per kWh
  
  // Size calculation (same formula used in TrueQuote)
  const targetKwh = annualUsageKwh * coveragePercent;
  const capacityFactor = sunHoursPerDay / 24 * degradationFactor;
  const sizeKw = Math.round(targetKwh / (capacityFactor * 8760) / 5) * 5; // Round to nearest 5kW
  
  // Production
  const annualProductionKwh = sizeKw * sunHoursPerDay * 365 * degradationFactor;
  
  // Costs (using SSOT pricing)
  const installCost = sizeKw * 1000 * solarCostPerWatt;
  const netCostAfterITC = installCost * (1 - federalITCRate);
  
  // Savings
  const annualSavings = annualProductionKwh * electricityRate;
  const paybackYears = annualSavings > 0 ? netCostAfterITC / annualSavings : 0;
  
  // Environmental
  const co2OffsetTons = annualProductionKwh * co2PerKwh;
  
  return {
    name: tierName,
    sizeKw,
    sizeLabel: `${sizeKw} kW`,
    coveragePercent,
    panelCount: Math.ceil((sizeKw * 1000) / 500), // ~500W per panel
    annualProductionKwh: Math.round(annualProductionKwh),
    annualSavings: Math.round(annualSavings),
    installCost: Math.round(installCost),
    netCostAfterITC: Math.round(netCostAfterITC),
    paybackYears: Math.round(paybackYears * 10) / 10,
    co2OffsetTons: Math.round(co2OffsetTons * 10) / 10,
  };
}

// ============================================================================
// EV CHARGING PREVIEW
// ============================================================================

export interface EvPreviewInput {
  l2Count: number;
  dcfcCount: number;
}

export interface EvPreviewResult {
  name: string;
  l2Count: number;
  dcfcCount: number;
  totalPowerKw: number;
  chargersLabel: string;
  carsPerDay: string;
  monthlyRevenue: number;
  installCost: number;
  tenYearRevenue: number;
}

/**
 * Calculate EV charging preview using SSOT constants
 */
export function calculateEvPreview(
  input: EvPreviewInput,
  tierName: string
): EvPreviewResult {
  const { l2Count, dcfcCount } = input;
  
  // Use SSOT constants from DEFAULTS
  const evL2Cost = DEFAULTS.EV.l2Cost;
  const evDcfcCost = DEFAULTS.EV.dcfcCost;
  const evL2PowerKw = DEFAULTS.EV.l2PowerKW;
  const evDcfcPowerKw = DEFAULTS.EV.dcfcPowerKW;
  
  // Revenue assumptions (conservative)
  const l2SessionsPerDay = 2;
  const dcfcSessionsPerDay = 8;
  const l2RevenuePerSession = 5;   // $5 per L2 session
  const dcfcRevenuePerSession = 15; // $15 per DCFC session
  
  const totalPowerKw = l2Count * evL2PowerKw + dcfcCount * evDcfcPowerKw;
  const carsPerDayMin = Math.round((l2Count * l2SessionsPerDay + dcfcCount * dcfcSessionsPerDay) * 0.6);
  const carsPerDayMax = l2Count * l2SessionsPerDay + dcfcCount * dcfcSessionsPerDay;
  
  const dailyRevenue = 
    l2Count * l2SessionsPerDay * l2RevenuePerSession +
    dcfcCount * dcfcSessionsPerDay * dcfcRevenuePerSession;
  const monthlyRevenue = dailyRevenue * 30;
  
  const installCost = l2Count * evL2Cost + dcfcCount * evDcfcCost;
  
  return {
    name: tierName,
    l2Count,
    dcfcCount,
    totalPowerKw: Math.round(totalPowerKw),
    chargersLabel: dcfcCount > 0 ? `${l2Count} L2 + ${dcfcCount} DC Fast` : `${l2Count} Level 2`,
    carsPerDay: `${carsPerDayMin}-${carsPerDayMax}`,
    monthlyRevenue: Math.round(monthlyRevenue),
    installCost: Math.round(installCost),
    tenYearRevenue: Math.round(monthlyRevenue * 12 * 10),
  };
}

// ============================================================================
// GENERATOR PREVIEW
// ============================================================================

export interface GeneratorPreviewInput {
  sizeKw: number;
  fuelType: 'diesel' | 'natural-gas';
}

export interface GeneratorPreviewResult {
  name: string;
  sizeKw: number;
  sizeLabel: string;
  fuelType: string;
  runtimeHours: number;
  installCost: number;
  netCostAfterITC: number;
  annualMaintenance: number;
  coverage: string;
}

/**
 * Calculate generator preview using SSOT constants
 */
export function calculateGeneratorPreview(
  input: GeneratorPreviewInput,
  tierName: string
): GeneratorPreviewResult {
  const { sizeKw, fuelType } = input;
  
  // Use SSOT constants from DEFAULTS
  const dieselCostPerKw = DEFAULTS.Generator.dieselCostPerKW;
  const natgasCostPerKw = DEFAULTS.Generator.natgasCostPerKW;
  const federalITCRate = TRUEQUOTE_CONSTANTS.FEDERAL_ITC_RATE;
  
  const costPerKw = fuelType === 'diesel' ? dieselCostPerKw : natgasCostPerKw;
  const installMultiplier = 1.4; // Installation adds 40%
  const maintenanceRate = 0.02; // 2% of install cost annually
  
  // Fuel consumption estimate (gallons per hour at full load)
  const fuelConsumptionRate = fuelType === 'diesel' ? 0.07 : 0.10; // per kW
  const tankCapacityGallons = 500;
  const runtimeHours = Math.round(tankCapacityGallons / (sizeKw * fuelConsumptionRate));
  
  const installCost = sizeKw * costPerKw * installMultiplier;
  const netCostAfterITC = installCost * (1 - federalITCRate * 0.3); // Generators get partial ITC
  const annualMaintenance = installCost * maintenanceRate;
  
  // Coverage description
  let coverage: string;
  if (sizeKw >= 400) coverage = 'Full facility backup';
  else if (sizeKw >= 200) coverage = 'Critical loads + HVAC';
  else if (sizeKw >= 100) coverage = 'Critical loads only';
  else coverage = 'Emergency lighting only';
  
  return {
    name: tierName,
    sizeKw,
    sizeLabel: `${sizeKw} kW`,
    fuelType: fuelType === 'diesel' ? 'Diesel' : 'Natural Gas',
    runtimeHours,
    installCost: Math.round(installCost),
    netCostAfterITC: Math.round(netCostAfterITC),
    annualMaintenance: Math.round(annualMaintenance),
    coverage,
  };
}

// ============================================================================
// COMBINED PREVIEW (for stats bar)
// ============================================================================

export interface CombinedPreviewResult {
  totalInstallCost: number;
  totalAnnualSavings: number;
  simplePaybackYears: number;
  tenYearNetBenefit: number;
}

export function calculateCombinedPreview(
  solar: SolarPreviewResult | null,
  ev: EvPreviewResult | null,
  generator: GeneratorPreviewResult | null
): CombinedPreviewResult {
  const totalInstallCost = 
    (solar?.netCostAfterITC || 0) + 
    (ev?.installCost || 0) + 
    (generator?.netCostAfterITC || 0);
  
  const totalAnnualSavings = 
    (solar?.annualSavings || 0) + 
    (ev?.monthlyRevenue || 0) * 12;
  
  const simplePaybackYears = totalAnnualSavings > 0 
    ? totalInstallCost / totalAnnualSavings 
    : 0;
  
  const tenYearNetBenefit = totalAnnualSavings * 10 - totalInstallCost;
  
  return {
    totalInstallCost: Math.round(totalInstallCost),
    totalAnnualSavings: Math.round(totalAnnualSavings),
    simplePaybackYears: Math.round(simplePaybackYears * 10) / 10,
    tenYearNetBenefit: Math.round(tenYearNetBenefit),
  };
}
