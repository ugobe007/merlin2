/**
 * Database-Backed Calculation Service
 * Wraps existing calculation functions to use database as single source of truth
 * Maintains backward compatibility with existing code
 * Version: 1.0.0
 * Date: November 10, 2025
 */

import { useCaseService } from './useCaseService';
import type { PricingConfiguration } from './pricingConfigService';

// Fallback default values (used only if database is unavailable)
const FALLBACK_BESS_PRICING = {
  smallSystemPerKWh: 580,
  mediumSystemPerKWh: 450,
  mediumLargeSystemPerKWh: 350,
  largeSystemPerKWh: 280,
  smallSystemSizeMWh: 1,
  mediumSystemSizeMWh: 5,
  largeSystemSizeMWh: 15,
  degradationRate: 0.02,
  warrantyYears: 10,
  roundTripEfficiency: 0.85
};

const FALLBACK_POWER_ELECTRONICS = {
  inverterPerKW: 120,
  transformerPerKVA: 80,
  switchgearPerKW: 50,
  protectionRelaysPerUnit: 5000
};

const FALLBACK_BALANCE_OF_PLANT = {
  bopPercentage: 0.12,
  epcPercentage: 0.08,
  laborCostPerHour: 85,
  shippingCostPercentage: 0.03,
  contingencyPercentage: 0.05,
  urbanLaborPremium: 0.15,
  skillLaborPremiumPercentage: 0.10
};

// Regional pricing factors
const COUNTRY_FACTORS: Record<string, number> = {
  'United States': 1.0,
  'Canada': 1.05,
  'United Kingdom': 1.15,
  'Germany': 1.18,
  'France': 1.12,
  'Australia': 1.20,
  'China': 0.75,
  'India': 0.70,
  'Japan': 1.25,
  'South Korea': 1.10,
  'Brazil': 0.95,
  'Mexico': 0.85,
  'Middle East': 1.10,
  'Singapore': 1.30,
  'South Africa': 0.90
};

export interface BESSPricingResult {
  batteryPrice: number;
  pcsPrice: number;
  adjustedBatteryPrice: number;
  adjustedPcsPrice: number;
  marketFactors: {
    countryFactor: number;
    volumeFactor: number;
    technologyFactor: number;
    durationFactor?: number;
  };
  dataSource: string;
}

export interface SystemCostResult {
  totalCost: number;
  batterySystemCost: number;
  pcsInverterCost: number;
  bosCost: number;
  epcCost: number;
  breakdown: {
    components: Record<string, number>;
    labor: number;
    overhead: number;
  };
  dataSource: string;
}

/**
 * Calculate BESS pricing using database configuration
 * Falls back to hardcoded values if database is unavailable
 */
export async function calculateBESSPricingDB(
  powerMW: number,
  durationHours: number,
  country: string,
  includeDetailedBreakdown: boolean = false
): Promise<BESSPricingResult> {
  try {
    // Fetch pricing config from database
    const bessPricingConfig = await useCaseService.getPricingConfig('bess_pricing_2025');
    const powerElectronicsConfig = await useCaseService.getPricingConfig('power_electronics_2025');

    // Use database values or fallback
    const bessConfig = bessPricingConfig || FALLBACK_BESS_PRICING;
    const peConfig = powerElectronicsConfig || FALLBACK_POWER_ELECTRONICS;

    const energyMWh = powerMW * durationHours;
    const powerKW = powerMW * 1000;

    // Determine battery price per kWh based on system size (4-tier pricing)
    let batteryPricePerKWh: number;
    if (energyMWh < bessConfig.smallSystemSizeMWh) {
      batteryPricePerKWh = bessConfig.smallSystemPerKWh;
    } else if (energyMWh < bessConfig.mediumSystemSizeMWh) {
      batteryPricePerKWh = bessConfig.mediumSystemPerKWh;
    } else if (energyMWh < bessConfig.largeSystemSizeMWh) {
      batteryPricePerKWh = bessConfig.mediumLargeSystemPerKWh;
    } else {
      batteryPricePerKWh = bessConfig.largeSystemPerKWh;
    }

    // Apply country factor
    const countryFactor = COUNTRY_FACTORS[country] || 1.0;
    
    // Volume factor (larger systems get better pricing)
    const volumeFactor = energyMWh >= 10 ? 0.95 : energyMWh >= 5 ? 0.98 : 1.0;
    
    // Duration factor (longer duration has slight premium for higher energy density)
    const durationFactor = durationHours >= 6 ? 1.05 : durationHours >= 4 ? 1.0 : 0.98;

    // Calculate adjusted prices
    const adjustedBatteryPrice = batteryPricePerKWh * countryFactor * volumeFactor * durationFactor;
    const adjustedPcsPrice = peConfig.inverterPerKW * countryFactor;

    const dataSource = bessPricingConfig ? 'Database (pricing_configurations)' : 'Fallback defaults';

    return {
      batteryPrice: batteryPricePerKWh,
      pcsPrice: peConfig.inverterPerKW,
      adjustedBatteryPrice,
      adjustedPcsPrice,
      marketFactors: {
        countryFactor,
        volumeFactor,
        technologyFactor: 1.0, // LFP standard
        durationFactor
      },
      dataSource
    };

  } catch (error) {
    console.error('Error calculating BESS pricing from database:', error);
    
    // Return fallback calculation
    const energyMWh = powerMW * durationHours;
    let batteryPricePerKWh: number;
    if (energyMWh < 1) batteryPricePerKWh = 580;
    else if (energyMWh < 5) batteryPricePerKWh = 450;
    else if (energyMWh < 15) batteryPricePerKWh = 350;
    else batteryPricePerKWh = 280;

    const countryFactor = COUNTRY_FACTORS[country] || 1.0;
    
    return {
      batteryPrice: batteryPricePerKWh,
      pcsPrice: FALLBACK_POWER_ELECTRONICS.inverterPerKW,
      adjustedBatteryPrice: batteryPricePerKWh * countryFactor,
      adjustedPcsPrice: FALLBACK_POWER_ELECTRONICS.inverterPerKW * countryFactor,
      marketFactors: {
        countryFactor,
        volumeFactor: 1.0,
        technologyFactor: 1.0
      },
      dataSource: 'Fallback (database unavailable)'
    };
  }
}

/**
 * Calculate total system cost using database configuration
 */
export async function calculateSystemCostDB(
  powerMW: number,
  durationHours: number,
  country: string,
  includeDetailedBreakdown: boolean = false,
  useCase: string = 'general'
): Promise<SystemCostResult> {
  try {
    // Fetch configurations from database
    const bopConfig = await useCaseService.getPricingConfig('balance_of_plant_2025');
    
    // Get pricing from database-backed function
    const pricing = await calculateBESSPricingDB(powerMW, durationHours, country, includeDetailedBreakdown);

    // Use database values or fallback
    const bop = bopConfig || FALLBACK_BALANCE_OF_PLANT;

    const energyMWh = powerMW * durationHours;
    const energyKWh = energyMWh * 1000;
    const powerKW = powerMW * 1000;

    // Calculate component costs
    const batterySystemCost = energyKWh * pricing.adjustedBatteryPrice;
    const pcsInverterCost = powerKW * pricing.adjustedPcsPrice;

    // Balance of System (cables, cooling, fire suppression, containers, etc.)
    const subtotalBeforeBOS = batterySystemCost + pcsInverterCost;
    const bosCost = subtotalBeforeBOS * bop.bopPercentage;

    // EPC (Engineering, Procurement, Construction)
    const subtotalBeforeEPC = subtotalBeforeBOS + bosCost;
    const epcCost = subtotalBeforeEPC * bop.epcPercentage;

    // Total system cost
    const totalCost = subtotalBeforeEPC + epcCost;

    // Detailed breakdown
    const breakdown = {
      components: {
        battery: batterySystemCost,
        pcs_inverter: pcsInverterCost,
        balance_of_system: bosCost,
        epc: epcCost
      },
      labor: epcCost * 0.6, // Rough estimate: 60% of EPC is labor
      overhead: epcCost * 0.4 + bosCost * 0.3 // Overhead in EPC and BOS
    };

    const dataSource = bopConfig ? 'Database (pricing_configurations)' : 'Fallback defaults';

    return {
      totalCost,
      batterySystemCost,
      pcsInverterCost,
      bosCost,
      epcCost,
      breakdown,
      dataSource
    };

  } catch (error) {
    console.error('Error calculating system cost from database:', error);
    
    // Return fallback calculation
    const pricing = await calculateBESSPricingDB(powerMW, durationHours, country, false);
    const energyMWh = powerMW * durationHours;
    const energyKWh = energyMWh * 1000;
    const powerKW = powerMW * 1000;

    const batterySystemCost = energyKWh * pricing.adjustedBatteryPrice;
    const pcsInverterCost = powerKW * pricing.adjustedPcsPrice;
    const subtotal = batterySystemCost + pcsInverterCost;
    const bosCost = subtotal * 0.12;
    const epcCost = (subtotal + bosCost) * 0.08;
    const totalCost = subtotal + bosCost + epcCost;

    return {
      totalCost,
      batterySystemCost,
      pcsInverterCost,
      bosCost,
      epcCost,
      breakdown: {
        components: {
          battery: batterySystemCost,
          pcs_inverter: pcsInverterCost,
          balance_of_system: bosCost,
          epc: epcCost
        },
        labor: epcCost * 0.6,
        overhead: epcCost * 0.4 + bosCost * 0.3
      },
      dataSource: 'Fallback (database unavailable)'
    };
  }
}

/**
 * Calculate ROI using database formula
 */
export async function calculateROIDB(
  totalInvestment: number,
  annualSavings: number,
  lifetimeYears: number = 20
): Promise<{
  roi: number;
  paybackPeriod: number;
  totalSavings: number;
  netProfit: number;
  formula: string;
  dataSource: string;
}> {
  try {
    // Fetch formulas from database
    const roiFormula = await useCaseService.getCalculationFormula('roi_percentage');
    const paybackFormula = await useCaseService.getCalculationFormula('simple_payback_period');

    const totalSavings = annualSavings * lifetimeYears;
    const netProfit = totalSavings - totalInvestment;
    const roi = (netProfit / totalInvestment) * 100;
    const paybackPeriod = totalInvestment / annualSavings;

    const dataSource = roiFormula ? 'Database (calculation_formulas)' : 'Standard financial formulas';

    return {
      roi,
      paybackPeriod,
      totalSavings,
      netProfit,
      formula: roiFormula?.formula_expression || 'roi = ((totalSavings - totalInvestment) / totalInvestment) * 100',
      dataSource
    };

  } catch (error) {
    console.error('Error calculating ROI from database:', error);
    
    // Fallback calculation
    const totalSavings = annualSavings * lifetimeYears;
    const netProfit = totalSavings - totalInvestment;
    const roi = (netProfit / totalInvestment) * 100;
    const paybackPeriod = totalInvestment / annualSavings;

    return {
      roi,
      paybackPeriod,
      totalSavings,
      netProfit,
      formula: 'roi = ((totalSavings - totalInvestment) / totalInvestment) * 100',
      dataSource: 'Fallback (database unavailable)'
    };
  }
}

/**
 * Legacy compatibility exports
 * These maintain the exact same interface as the old functions
 */
export const calculateBESSPricing = calculateBESSPricingDB;
export const calculateSystemCost = calculateSystemCostDB;
export const calculateROI = calculateROIDB;

// Default export
export default {
  calculateBESSPricing: calculateBESSPricingDB,
  calculateSystemCost: calculateSystemCostDB,
  calculateROI: calculateROIDB
};
