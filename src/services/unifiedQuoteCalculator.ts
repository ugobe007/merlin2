/**
 * UNIFIED QUOTE CALCULATOR
 * ========================
 * 
 * ⚠️ THIS IS THE ONLY FILE THAT SHOULD CALCULATE QUOTES ⚠️
 * 
 * ALL quote calculations MUST go through this module:
 * - Equipment costs
 * - Financial metrics (NPV, IRR, payback, ROI)
 * - Annual savings
 * 
 * DO NOT:
 * - Calculate payback anywhere else
 * - Calculate equipment costs anywhere else
 * - Use hardcoded pricing anywhere else
 * 
 * This module orchestrates:
 * 1. equipmentCalculations.ts - Equipment breakdown & pricing
 * 2. centralizedCalculations.ts - Financial metrics
 * 3. unifiedPricingService.ts - Battery pricing
 * 
 * Version: 1.0.0
 * Date: November 28, 2025
 */

import { calculateEquipmentBreakdown, type EquipmentBreakdown } from '@/utils/equipmentCalculations';
import { calculateFinancialMetrics, type FinancialCalculationResult } from './centralizedCalculations';
import { getBatteryPricing } from './unifiedPricingService';

// ============================================
// INTERFACES
// ============================================

// Import types from equipmentCalculations for consistency
import type { GeneratorFuelType, FuelCellType, EquipmentBreakdownOptions } from '@/utils/equipmentCalculations';

export interface QuoteInput {
  // System sizing
  storageSizeMW: number;
  durationHours: number;
  
  // Optional renewables
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  
  // Generator fuel type (NEW - Dec 2025)
  generatorFuelType?: GeneratorFuelType;
  
  // Fuel cell configuration (NEW - Dec 2025)
  fuelCellMW?: number;
  fuelCellType?: FuelCellType;
  
  // Location & rates
  location?: string;
  electricityRate?: number;  // $/kWh (default 0.15)
  
  // Grid connection
  gridConnection?: 'on-grid' | 'off-grid' | 'limited';
  
  // Use case context (for appropriate savings model)
  useCase?: string;
  industryData?: any;
}

export interface QuoteResult {
  // Equipment breakdown
  equipment: EquipmentBreakdown;
  
  // Cost summary
  costs: {
    equipmentCost: number;
    installationCost: number;
    totalProjectCost: number;
    taxCredit: number;
    netCost: number;
  };
  
  // Financial metrics
  financials: {
    annualSavings: number;
    paybackYears: number;
    roi10Year: number;
    roi25Year: number;
    npv: number;
    irr: number;
  };
  
  // Metadata
  metadata: {
    calculatedAt: Date;
    pricingSource: string;
    systemCategory: 'residential' | 'commercial' | 'utility';
  };
}

// ============================================
// SYSTEM CATEGORIZATION
// ============================================

function getSystemCategory(storageSizeMW: number): 'residential' | 'commercial' | 'utility' {
  if (storageSizeMW < 0.05) return 'residential';  // < 50 kW
  if (storageSizeMW < 1.0) return 'commercial';     // < 1 MW (C&I)
  return 'utility';                                  // >= 1 MW
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate a complete quote with equipment breakdown and financial metrics.
 * 
 * THIS IS THE ONLY FUNCTION THAT SHOULD BE USED FOR QUOTE CALCULATIONS.
 * 
 * @param input - Quote input parameters
 * @returns Complete quote with costs and financials
 */
export async function calculateQuote(input: QuoteInput): Promise<QuoteResult> {
  const {
    storageSizeMW,
    durationHours,
    solarMW = 0,
    windMW = 0,
    generatorMW = 0,
    generatorFuelType = 'diesel',  // NEW: Default to diesel
    fuelCellMW = 0,                 // NEW: Default to 0 (no fuel cell)
    fuelCellType = 'hydrogen',      // NEW: Default to hydrogen PEM
    location = 'California',
    electricityRate = 0.15,
    gridConnection = 'on-grid',
    useCase,
    industryData
  } = input;
  
  // Validate inputs
  if (storageSizeMW <= 0 || durationHours <= 0) {
    throw new Error('Invalid system size: storageSizeMW and durationHours must be positive');
  }
  
  const systemCategory = getSystemCategory(storageSizeMW);
  
  if (import.meta.env.DEV) {
    console.log(`📊 [UnifiedQuoteCalculator] Calculating quote:`, {
      storageSizeMW,
      durationHours,
      systemCategory,
      location,
      electricityRate,
      generatorFuelType: generatorMW > 0 ? generatorFuelType : 'none',
      fuelCellType: fuelCellMW > 0 ? fuelCellType : 'none'
    });
  }
  
  // Build equipment options (NEW - Dec 2025)
  const equipmentOptions: EquipmentBreakdownOptions = {
    generatorFuelType,
    fuelCellMW,
    fuelCellType
  };
  
  // Step 1: Get equipment breakdown (uses proper small-system pricing)
  const equipment = await calculateEquipmentBreakdown(
    storageSizeMW,
    durationHours,
    solarMW,
    windMW,
    generatorMW,
    industryData ? { selectedIndustry: useCase, useCaseData: industryData } : undefined,
    gridConnection,
    location,
    equipmentOptions  // NEW: Pass extended options
  );
  
  // Step 2: Extract costs from equipment breakdown
  const equipmentCost = equipment.totals.equipmentCost;
  const installationCost = equipment.totals.installationCost;
  const totalProjectCost = equipment.totals.totalProjectCost;
  const taxCredit = totalProjectCost * 0.30; // 30% ITC
  const netCost = totalProjectCost - taxCredit;
  
  if (import.meta.env.DEV) {
    console.log(`💰 [UnifiedQuoteCalculator] Equipment costs:`, {
      equipmentCost,
      installationCost,
      totalProjectCost,
      netCost
    });
  }
  
  // Step 3: Calculate financial metrics using centralized service
  const financials = await calculateFinancialMetrics({
    storageSizeMW,
    durationHours,
    solarMW,
    windMW,
    electricityRate,
    equipmentCost,
    installationCost,
    location,
    includeNPV: true
  });
  
  // Step 4: Recalculate payback using ACTUAL costs from equipment breakdown
  // This ensures consistency between displayed costs and payback
  const actualPayback = financials.annualSavings > 0 
    ? netCost / financials.annualSavings 
    : 999;
  
  if (import.meta.env.DEV) {
    console.log(`📈 [UnifiedQuoteCalculator] Financial metrics:`, {
      annualSavings: financials.annualSavings,
      paybackYears: actualPayback,
      npv: financials.npv,
      irr: financials.irr
    });
  }
  
  return {
    equipment,
    costs: {
      equipmentCost,
      installationCost,
      totalProjectCost,
      taxCredit,
      netCost
    },
    financials: {
      annualSavings: financials.annualSavings,
      paybackYears: actualPayback,
      roi10Year: financials.roi10Year,
      roi25Year: financials.roi25Year,
      npv: financials.npv ?? 0,
      irr: financials.irr ?? 0
    },
    metadata: {
      calculatedAt: new Date(),
      pricingSource: equipment.batteries.marketIntelligence?.dataSource || 'NREL ATB 2024',
      systemCategory
    }
  };
}

/**
 * Quick payback estimate without full equipment breakdown.
 * Use for UI previews only - NOT for final quotes.
 */
export async function estimatePayback(
  storageSizeMW: number,
  durationHours: number,
  electricityRate: number = 0.15
): Promise<{ paybackYears: number; annualSavings: number; estimatedCost: number }> {
  // Get battery pricing
  const pricing = await getBatteryPricing(storageSizeMW, durationHours);
  const totalKWh = storageSizeMW * durationHours * 1000;
  
  // Estimate costs (simplified)
  const equipmentCost = totalKWh * pricing.pricePerKWh;
  const totalCost = equipmentCost * 1.23; // 23% markup for installation/BOS
  const netCost = totalCost * 0.70; // After 30% ITC
  
  // Quick savings estimate
  const totalEnergyMWh = storageSizeMW * durationHours;
  const peakShaving = totalEnergyMWh * 365 * (electricityRate - 0.05) * 1000;
  const demandCharge = storageSizeMW * 12 * 15000;
  const annualSavings = peakShaving + demandCharge;
  
  const paybackYears = annualSavings > 0 ? netCost / annualSavings : 999;
  
  return {
    paybackYears,
    annualSavings,
    estimatedCost: netCost
  };
}

// Re-export types for convenience
export type { EquipmentBreakdown, GeneratorFuelType, FuelCellType, EquipmentBreakdownOptions } from '@/utils/equipmentCalculations';
export type { FinancialCalculationResult } from './centralizedCalculations';
