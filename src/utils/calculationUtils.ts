/**
 * BESS Project Cost Calculation Utilities
 * 
 * This module contains calculation functions extracted from BessQuoteBuilder
 * to separate business logic from UI components.
 */

import { calculateBESSPricing, calculateSystemCost } from './bessPricing';
import { UTILITY_RATES } from './energyCalculations';

export interface SystemConfiguration {
  powerMW: number;
  standbyHours: number;
  selectedCountry: string;
  useCase: string;
  gridMode: string;
  batteryKwh: number;
  pcsKw: number;
  bosPercent: number;
  epcPercent: number;
  generatorMW: number;
  solarMWp: number;
  windMW: number;
  genKw: number;
  solarKwp: number;
  windKw: number;
  onGridPcsFactor: number;
  offGridPcsFactor: number;
}

export interface CostBreakdown {
  batterySubtotal: number;
  pcsSubtotal: number;
  bosAmount: number;
  epcAmount: number;
  bessCapEx: number;
  generatorSubtotal: number;
  solarSubtotal: number;
  windSubtotal: number;
  batteryTariff: number;
  otherTariff: number;
  totalTariffs: number;
  grandCapEx: number;
}

export interface ROIAnalysis {
  totalMWh: number;
  actualDuration: number;
  annualEnergyMWh: number;
  peakShavingSavings: number;
  demandChargeSavings: number;
  annualSavings: number;
  roiYears: number;
  utilityData: any;
}

export interface QuickCalculationResult {
  totalMWh: number;
  pcsKW: number;
  adjustedBatteryPrice: number;
  adjustedPcsPrice: number;
  batterySubtotal: number;
  pcsSubtotal: number;
  bosAmount: number;
  epcAmount: number;
  bessCapEx: number;
  generatorSubtotal: number;
  solarSubtotal: number;
  windSubtotal: number;
  batteryTariff: number;
  otherTariff: number;
  totalTariffs: number;
  grandCapEx: number;
  annualSavings: number;
  roiYears: number;
}

/**
 * Calculate complete system costs and ROI analysis
 * This is the comprehensive calculation used throughout the application
 */
export function calculateComprehensiveSystemCosts(config: SystemConfiguration): {
  costs: CostBreakdown;
  roi: ROIAnalysis;
} {
  // Get realistic system sizing based on application requirements
  const systemCost = calculateSystemCost(config.powerMW, config.standbyHours, config.selectedCountry, true, config.useCase.toLowerCase().replace(/\s+/g, '-'));
  const totalMWh = systemCost.capacityMWh; // Use realistic energy capacity instead of power × time
  const actualDuration = systemCost.actualDuration; // Real duration: Energy/Power
  const pcsKW = config.powerMW * 1000;
  const actualPcsFactor = config.gridMode === 'Off-grid' ? config.offGridPcsFactor : config.onGridPcsFactor;
  const adjustedPcsKw = pcsKW * actualPcsFactor;
  
  // Use dynamic pricing system based on market data
  const dynamicPricing = calculateBESSPricing(config.powerMW, config.standbyHours, config.selectedCountry, false);
  const dynamicBatteryKwh = dynamicPricing.contractAveragePerKWh;
  
  // Use dynamic pricing unless manually overridden to a much higher value
  const effectiveBatteryKwh = config.batteryKwh > 160 ? config.batteryKwh : dynamicBatteryKwh;
  
  const batterySubtotal = totalMWh * 1000 * effectiveBatteryKwh;
  const pcsSubtotal = pcsKW * config.pcsKw;
  const bosAmount = (batterySubtotal + pcsSubtotal) * config.bosPercent;
  const epcAmount = (batterySubtotal + pcsSubtotal + bosAmount) * config.epcPercent;
  const bessCapEx = batterySubtotal + pcsSubtotal + bosAmount + epcAmount;
  
  const generatorSubtotal = config.generatorMW * 1000 * config.genKw;
  const solarSubtotal = config.solarMWp * 1000 * (config.solarKwp / 1000);
  const windSubtotal = config.windMW * 1000 * (config.windKw / 1000);
  
  const batteryTariff = bessCapEx * 0.21;
  const otherTariff = (generatorSubtotal + solarSubtotal + windSubtotal) * 0.06;
  const totalTariffs = batteryTariff + otherTariff;
  
  const grandCapEx = bessCapEx + generatorSubtotal + solarSubtotal + windSubtotal + totalTariffs;
  
  // Use realistic utility rates for ROI calculation
  const utilityData = UTILITY_RATES['United States']; // Default to US rates
  const dailyCycles = 1; // 1 full charge/discharge cycle per day
  const annualEnergyMWh = totalMWh * dailyCycles * 365;
  
  const peakShavingValue = (utilityData.peakRateKWh - utilityData.offPeakRateKWh);
  const peakShavingSavings = annualEnergyMWh * 1000 * peakShavingValue * 0.7; // 70% efficiency factor
  const demandChargeSavings = (config.powerMW * 1000) * utilityData.demandChargeKW * 12;
  const annualSavings = peakShavingSavings + demandChargeSavings;
  const roiYears = annualSavings > 0 ? grandCapEx / annualSavings : Infinity;

  return {
    costs: {
      batterySubtotal,
      pcsSubtotal,
      bosAmount,
      epcAmount,
      bessCapEx,
      generatorSubtotal,
      solarSubtotal,
      windSubtotal,
      batteryTariff,
      otherTariff,
      totalTariffs,
      grandCapEx
    },
    roi: {
      totalMWh,
      actualDuration,
      annualEnergyMWh,
      peakShavingSavings,
      demandChargeSavings,
      annualSavings,
      roiYears,
      utilityData
    }
  };
}

/**
 * Quick calculation for simple cost estimates
 * This is the simplified calculation used in quick estimate functions
 */
export function calculateQuickEstimate(
  powerMW: number,
  standbyHours: number,
  batteryKwh: number,
  pcsKw: number,
  bosPercent: number,
  epcPercent: number,
  generatorMW: number,
  solarMWp: number,
  windMW: number,
  genKw: number,
  solarKwp: number,
  windKw: number
): QuickCalculationResult {
  const totalMWh = powerMW * standbyHours;
  const pcsKW = powerMW * 1000;
  
  // Dynamic pricing based on system size (industry standards)
  let adjustedBatteryPrice = batteryKwh;
  let adjustedPcsPrice = pcsKw;
  
  // Large scale pricing adjustments (economies of scale)
  if (powerMW >= 5) {
    // Large scale (≥5MW): Use utility-scale pricing
    adjustedBatteryPrice = Math.min(batteryKwh, 120); // BNEF large scale rate
    adjustedPcsPrice = Math.min(pcsKw, 140); // Bulk PCS pricing
  } else if (powerMW >= 2) {
    // Medium scale (≥2MW): Moderate discount
    adjustedBatteryPrice = Math.min(batteryKwh, 130);
    adjustedPcsPrice = Math.min(pcsKw, 145);
  }
  // Small scale (<2MW): Use default pricing
  
  const batterySubtotal = totalMWh * 1000 * adjustedBatteryPrice;
  const pcsSubtotal = pcsKW * adjustedPcsPrice;
  const bosAmount = (batterySubtotal + pcsSubtotal) * bosPercent;
  const epcAmount = (batterySubtotal + pcsSubtotal + bosAmount) * epcPercent;
  const bessCapEx = batterySubtotal + pcsSubtotal + bosAmount + epcAmount;
  
  const generatorSubtotal = generatorMW * 1000 * genKw;
  const solarSubtotal = solarMWp * 1000 * (solarKwp / 1000);
  const windSubtotal = windMW * 1000 * (windKw / 1000);
  
  const batteryTariff = bessCapEx * 0.21;
  const otherTariff = (generatorSubtotal + solarSubtotal + windSubtotal) * 0.06;
  const totalTariffs = batteryTariff + otherTariff;
  
  const grandCapEx = bessCapEx + generatorSubtotal + solarSubtotal + windSubtotal + totalTariffs;
  
  // Use same realistic ROI calculation
  const utilityData = UTILITY_RATES['United States'];
  const dailyCycles = 1;
  const annualEnergyMWh = totalMWh * dailyCycles * 365;
  const peakShavingValue = (utilityData.peakRateKWh - utilityData.offPeakRateKWh);
  const peakShavingSavings = annualEnergyMWh * 1000 * peakShavingValue * 0.7;
  const demandChargeSavings = (powerMW * 1000) * utilityData.demandChargeKW * 12;
  const annualSavings = peakShavingSavings + demandChargeSavings;
  const roiYears = annualSavings > 0 ? grandCapEx / annualSavings : Infinity;

  return {
    totalMWh,
    pcsKW,
    adjustedBatteryPrice,
    adjustedPcsPrice,
    batterySubtotal,
    pcsSubtotal,
    bosAmount,
    epcAmount,
    bessCapEx,
    generatorSubtotal,
    solarSubtotal,
    windSubtotal,
    batteryTariff,
    otherTariff,
    totalTariffs,
    grandCapEx,
    annualSavings,
    roiYears
  };
}

/**
 * Calculate system costs for specific configuration parameters
 * Used for component sizing and cost estimation
 */
export function calculateSystemComponents(config: {
  powerMW: number;
  energyMWh: number;
  batteryKwh: number;
  pcsKw: number;
  bosPercent: number;
  epcPercent: number;
}): {
  batterySystemCost: number;
  pcsCost: number;
  transformersCost: number;
  switchgearCost: number;
  microgridControlsCost: number;
  equipmentSubtotal: number;
  bosCost: number;
  epcCost: number;
  totalSystemCost: number;
} {
  // Calculate all cost components
  const batterySystemCost = config.energyMWh * 1000 * config.batteryKwh;
  const pcsKW = config.powerMW * 1000;
  const pcsCost = pcsKW * config.pcsKw; // PCS already includes inverter functionality
  const transformersCost = pcsKW * 50; // Standard $50/kW for transformers
  const switchgearCost = pcsKW * 35; // Reduced $35/kW for switchgear (more realistic)
  
  // Scale microgrid controls cost based on system size
  const microgridControlsCost = Math.min(50000, Math.max(15000, config.powerMW * 8000)); // $15k-50k based on size
  
  const equipmentSubtotal = batterySystemCost + pcsCost + transformersCost + switchgearCost + microgridControlsCost;
  const bosCost = equipmentSubtotal * config.bosPercent;
  const epcCost = (equipmentSubtotal + bosCost) * config.epcPercent;
  
  const totalSystemCost = equipmentSubtotal + bosCost + epcCost;

  return {
    batterySystemCost,
    pcsCost,
    transformersCost,
    switchgearCost,
    microgridControlsCost,
    equipmentSubtotal,
    bosCost,
    epcCost,
    totalSystemCost
  };
}

/**
 * Utility function to format numbers as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Utility function to format large numbers with appropriate units
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toString();
}