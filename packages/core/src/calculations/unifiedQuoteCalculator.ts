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
 * 4. benchmarkSources.ts - Source attribution & audit metadata (NEW - Dec 2025)
 * 
 * BENCHMARK-BACKED QUOTING:
 * Every number in a Merlin quote is traceable to a documented, authoritative source.
 * Primary sources: NREL ATB 2024, NREL StoreFAST, DOE/Sandia
 * 
 * Version: 1.1.0
 * Date: December 10, 2025
 */

import { calculateEquipmentBreakdown, type EquipmentBreakdown } from './equipmentCalculations';
import { calculateFinancialMetrics, type FinancialCalculationResult } from './centralizedCalculations';
import { getBatteryPricing } from '../pricing/unifiedPricingService';
import { 
  AUTHORITATIVE_SOURCES, 
  PRICING_BENCHMARKS, 
  METHODOLOGY_REFERENCES,
  CURRENT_BENCHMARK_VERSION,
  getSourceAttribution,
  generateQuoteAuditMetadata,
  type QuoteAuditMetadata,
  type BenchmarkSource
} from '../validation/benchmarkSources';

// ============================================
// INTERFACES
// ============================================

// Import types from equipmentCalculations for consistency
import type { GeneratorFuelType, FuelCellType, EquipmentBreakdownOptions } from './equipmentCalculations';

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
  gridConnection?: 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive';
  
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
  
  // Benchmark Attribution (NEW - Dec 2025)
  // Every number is traceable to authoritative sources
  benchmarkAudit: {
    version: string;
    methodology: string;
    sources: Array<{
      component: string;
      benchmarkId: string;
      value: number;
      unit: string;
      source: string;
      vintage: string;
      citation: string;
    }>;
    assumptions: {
      discountRate: number;
      projectLifeYears: number;
      degradationRate: number;
      itcRate: number;
    };
    deviations: Array<{
      lineItem: string;
      benchmarkValue: number;
      appliedValue: number;
      reason: string;
    }>;
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
    generatorFuelType = 'natural-gas',  // Default to natural-gas for all use cases
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
  
  // Build benchmark audit trail (NEW - Dec 2025)
  const bessCategory = systemCategory === 'utility' ? 'bess-lfp-utility-scale' : 'bess-lfp-commercial';
  const solarCategory = solarMW >= 5 ? 'solar-utility-scale' : 'solar-commercial';
  const inverterCategory = systemCategory === 'utility' ? 'inverter-utility' : 'inverter-commercial';
  
  const benchmarkSources: QuoteResult['benchmarkAudit']['sources'] = [
    {
      component: 'Battery Energy Storage',
      benchmarkId: bessCategory,
      value: PRICING_BENCHMARKS[bessCategory]?.value || 155,
      unit: PRICING_BENCHMARKS[bessCategory]?.unit || '$/kWh',
      source: AUTHORITATIVE_SOURCES['nrel-atb-2024']?.name || 'NREL ATB 2024',
      vintage: AUTHORITATIVE_SOURCES['nrel-atb-2024']?.vintage || '2024',
      citation: `${AUTHORITATIVE_SOURCES['nrel-atb-2024']?.name} (${AUTHORITATIVE_SOURCES['nrel-atb-2024']?.vintage}), ${AUTHORITATIVE_SOURCES['nrel-atb-2024']?.organization}`
    },
    {
      component: 'Power Conversion System',
      benchmarkId: inverterCategory,
      value: PRICING_BENCHMARKS[inverterCategory]?.value || 80,
      unit: PRICING_BENCHMARKS[inverterCategory]?.unit || '$/kW',
      source: AUTHORITATIVE_SOURCES['nrel-atb-2024']?.name || 'NREL ATB 2024',
      vintage: AUTHORITATIVE_SOURCES['nrel-atb-2024']?.vintage || '2024',
      citation: `${AUTHORITATIVE_SOURCES['nrel-atb-2024']?.name}, Power Electronics section`
    }
  ];
  
  // Add solar benchmark if applicable
  if (solarMW > 0) {
    benchmarkSources.push({
      component: 'Solar PV Array',
      benchmarkId: solarCategory,
      value: PRICING_BENCHMARKS[solarCategory]?.value || 0.85,
      unit: PRICING_BENCHMARKS[solarCategory]?.unit || '$/W',
      source: AUTHORITATIVE_SOURCES['nrel-cost-benchmark-2024']?.name || 'NREL Cost Benchmark Q1 2024',
      vintage: 'Q1 2024',
      citation: `NREL U.S. Solar Photovoltaic System Cost Benchmarks Q1 2024`
    });
  }
  
  // Add wind benchmark if applicable
  if (windMW > 0) {
    benchmarkSources.push({
      component: 'Wind Turbines',
      benchmarkId: 'wind-land-based',
      value: PRICING_BENCHMARKS['wind-land-based']?.value || 1200,
      unit: PRICING_BENCHMARKS['wind-land-based']?.unit || '$/kW',
      source: AUTHORITATIVE_SOURCES['nrel-atb-2024']?.name || 'NREL ATB 2024',
      vintage: '2024',
      citation: `NREL ATB 2024 Land-Based Wind, Class 4 resource area`
    });
  }
  
  // Add generator benchmark if applicable
  if (generatorMW > 0) {
    const genBenchmarkId = generatorFuelType === 'diesel' ? 'generator-diesel' : 'generator-natural-gas';
    benchmarkSources.push({
      component: `${generatorFuelType === 'diesel' ? 'Diesel' : 'Natural Gas'} Generator`,
      benchmarkId: genBenchmarkId,
      value: PRICING_BENCHMARKS[genBenchmarkId]?.value || 700,
      unit: PRICING_BENCHMARKS[genBenchmarkId]?.unit || '$/kW',
      source: AUTHORITATIVE_SOURCES['eia-electricity']?.name || 'EIA Electric Power Monthly',
      vintage: 'October 2024',
      citation: `EIA capacity addition costs for ${generatorFuelType} generators`
    });
  }
  
  // Track any deviations from benchmarks
  const deviations: QuoteResult['benchmarkAudit']['deviations'] = [];
  const actualBessPrice = equipment.batteries.pricePerKWh;
  const benchmarkBessPrice = PRICING_BENCHMARKS[bessCategory]?.value || 155;
  
  if (Math.abs(actualBessPrice - benchmarkBessPrice) / benchmarkBessPrice > 0.15) {
    deviations.push({
      lineItem: 'Battery pack $/kWh',
      benchmarkValue: benchmarkBessPrice,
      appliedValue: actualBessPrice,
      reason: actualBessPrice > benchmarkBessPrice 
        ? 'Market conditions reflect higher C&I pricing for smaller systems'
        : 'Competitive vendor quote below NREL baseline'
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
    },
    benchmarkAudit: {
      version: CURRENT_BENCHMARK_VERSION.version,
      methodology: CURRENT_BENCHMARK_VERSION.methodology,
      sources: benchmarkSources,
      assumptions: {
        discountRate: 0.08,       // 8% per NREL StoreFAST
        projectLifeYears: 25,     // Standard BESS project life
        degradationRate: 0.025,   // 2.5% annual per NREL ATB
        itcRate: 0.30             // 30% Investment Tax Credit
      },
      deviations
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
export type { EquipmentBreakdown, GeneratorFuelType, FuelCellType, EquipmentBreakdownOptions } from './equipmentCalculations';
export type { FinancialCalculationResult } from './centralizedCalculations';
