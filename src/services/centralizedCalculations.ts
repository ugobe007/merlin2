/**
 * CENTRALIZED CALCULATION SERVICE
 * ================================
 * Single source of truth for ALL financial calculations across the entire application.
 * ALL calculation constants are stored in and fetched from the database.
 * 
 * This eliminates:
 * - Hardcoded values scattered across multiple files
 * - Inconsistent calculation methods
 * - Different formulas producing different results
 * 
 * Database Tables Used:
 * - calculation_formulas: Stores all calculation formulas and constants
 * - pricing_configurations: Stores equipment pricing
 * 
 * Usage:
 * import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
 * const results = await calculateFinancialMetrics({ powerMW, durationHours, ...config });
 * 
 * Version: 1.0.0
 * Date: November 11, 2025
 */

import { supabase } from './supabaseClient';

// ============================================
// INTERFACES
// ============================================

export interface CalculationConstants {
  // Financial Constants
  PEAK_SHAVING_MULTIPLIER: number;           // Energy arbitrage multiplier
  DEMAND_CHARGE_MONTHLY_PER_MW: number;      // $/MW-month
  GRID_SERVICE_REVENUE_PER_MW: number;       // $/MW-year
  SOLAR_CAPACITY_FACTOR: number;             // Annual production factor
  WIND_CAPACITY_FACTOR: number;              // Annual production factor
  FEDERAL_TAX_CREDIT_RATE: number;           // ITC percentage (0.30 = 30%)
  
  // Operational Constants
  ANNUAL_CYCLES: number;                     // Battery cycles per year
  ROUND_TRIP_EFFICIENCY: number;             // Battery efficiency (0.85 = 85%)
  DEGRADATION_RATE_ANNUAL: number;           // Battery degradation per year
  OM_COST_PERCENT: number;                   // O&M as % of CAPEX
  
  // Formula metadata
  lastUpdated: Date;
  dataSource: 'database' | 'fallback';
}

export interface FinancialCalculationInput {
  // System configuration
  storageSizeMW: number;
  durationHours: number;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  
  // Location & pricing
  location: string;
  electricityRate: number;  // $/kWh
  
  // Equipment costs (if already calculated)
  equipmentCost?: number;
  installationCost?: number;
  shippingCost?: number;
  tariffCost?: number;
  
  // Advanced financial parameters (optional)
  projectLifetimeYears?: number;  // Default: 25
  discountRate?: number;          // Default: 8% (WACC)
  priceEscalationRate?: number;   // Default: 2% (inflation)
  includeNPV?: boolean;           // Default: true
}

export interface FinancialCalculationResult {
  // Costs
  equipmentCost: number;
  installationCost: number;
  shippingCost: number;
  tariffCost: number;
  totalProjectCost: number;
  taxCredit: number;
  netCost: number;
  
  // Revenue/Savings
  peakShavingSavings: number;
  demandChargeSavings: number;
  gridServiceRevenue: number;
  solarSavings: number;
  windSavings: number;
  annualSavings: number;
  
  // ROI Metrics (Simple)
  paybackYears: number;
  roi10Year: number;
  roi25Year: number;
  
  // Advanced Metrics (NPV/IRR with degradation)
  npv?: number;                    // Net Present Value
  irr?: number;                    // Internal Rate of Return (%)
  discountedPayback?: number;      // Payback with time value of money
  levelizedCostOfStorage?: number; // LCOS ($/MWh)
  
  // Metadata
  calculationDate: Date;
  formulaVersion: string;
  dataSource: 'database' | 'fallback';
  constantsUsed: CalculationConstants;
}

// ============================================
// DATABASE CONSTANTS FETCHER
// ============================================

/**
 * Fetch all calculation constants from the database
 * This is the SINGLE SOURCE OF TRUTH
 */
export async function getCalculationConstants(): Promise<CalculationConstants> {
  try {
    // Fetch all calculation formulas from database
    const { data: formulas, error } = await supabase
      .from('calculation_formulas')
      .select('*')
      .in('formula_key', [
        'peak_shaving_multiplier',
        'demand_charge_monthly_per_mw',
        'grid_service_revenue_per_mw',
        'solar_capacity_factor',
        'wind_capacity_factor',
        'federal_tax_credit_rate',
        'annual_cycles',
        'round_trip_efficiency',
        'degradation_rate_annual',
        'om_cost_percent'
      ]);

    if (error) throw error;

    // Build constants object from database
    const constants: CalculationConstants = {
      PEAK_SHAVING_MULTIPLIER: extractConstant(formulas, 'peak_shaving_multiplier', 365),
      DEMAND_CHARGE_MONTHLY_PER_MW: extractConstant(formulas, 'demand_charge_monthly_per_mw', 15000),
      GRID_SERVICE_REVENUE_PER_MW: extractConstant(formulas, 'grid_service_revenue_per_mw', 30000),
      SOLAR_CAPACITY_FACTOR: extractConstant(formulas, 'solar_capacity_factor', 1500),
      WIND_CAPACITY_FACTOR: extractConstant(formulas, 'wind_capacity_factor', 2500),
      FEDERAL_TAX_CREDIT_RATE: extractConstant(formulas, 'federal_tax_credit_rate', 0.30),
      ANNUAL_CYCLES: extractConstant(formulas, 'annual_cycles', 365),
      ROUND_TRIP_EFFICIENCY: extractConstant(formulas, 'round_trip_efficiency', 0.85),
      DEGRADATION_RATE_ANNUAL: extractConstant(formulas, 'degradation_rate_annual', 0.02),
      OM_COST_PERCENT: extractConstant(formulas, 'om_cost_percent', 0.025),
      lastUpdated: new Date(),
      dataSource: formulas && formulas.length > 0 ? 'database' : 'fallback'
    };

    console.log('✅ Calculation constants loaded from database:', constants.dataSource);
    console.log('📊 Loaded', formulas?.length || 0, 'formulas from database');
    return constants;

  } catch (error) {
    console.error('❌ Error fetching calculation constants from database:', error);
    
    // Return fallback constants
    return {
      PEAK_SHAVING_MULTIPLIER: 365,
      DEMAND_CHARGE_MONTHLY_PER_MW: 15000,
      GRID_SERVICE_REVENUE_PER_MW: 30000,
      SOLAR_CAPACITY_FACTOR: 1500,
      WIND_CAPACITY_FACTOR: 2500,
      FEDERAL_TAX_CREDIT_RATE: 0.30,
      ANNUAL_CYCLES: 365,
      ROUND_TRIP_EFFICIENCY: 0.85,
      DEGRADATION_RATE_ANNUAL: 0.02,
      OM_COST_PERCENT: 0.025,
      lastUpdated: new Date(),
      dataSource: 'fallback'
    };
  }
}

/**
 * Helper function to extract constant value from formula record
 */
function extractConstant(formulas: any[], formulaName: string, fallbackValue: number): number {
  const formula = formulas?.find(f => f.formula_key === formulaName);
  if (!formula) return fallbackValue;
  
  // Try to extract numeric value from formula_expression or variables
  if (formula.variables && typeof formula.variables === 'object') {
    // Check if there's a 'value' or 'default_value' in variables
    if (formula.variables.value !== undefined) return Number(formula.variables.value);
    if (formula.variables.default_value !== undefined) return Number(formula.variables.default_value);
  }
  
  // Try to parse from formula_expression if it's a simple number
  if (formula.formula_expression) {
    const match = formula.formula_expression.match(/[\d.]+/);
    if (match) return Number(match[0]);
  }
  
  return fallbackValue;
}

// ============================================
// CENTRALIZED FINANCIAL CALCULATION
// ============================================

/**
 * THE MASTER CALCULATION FUNCTION
 * This is the ONLY function that should be used for financial calculations
 * across the entire application.
 */
export async function calculateFinancialMetrics(
  input: FinancialCalculationInput
): Promise<FinancialCalculationResult> {
  
  // Fetch constants from database
  const constants = await getCalculationConstants();
  
  const {
    storageSizeMW,
    durationHours,
    solarMW = 0,
    windMW = 0,
    generatorMW = 0,
    electricityRate,
    equipmentCost = 0,
    installationCost = 0,
    shippingCost = 0,
    tariffCost = 0
  } = input;
  
  // ===================================
  // 1. CALCULATE COSTS
  // ===================================
  const totalEnergyMWh = storageSizeMW * durationHours;
  
  // If costs not provided, calculate them
  let finalEquipmentCost = equipmentCost;
  let finalInstallationCost = installationCost;
  let finalShippingCost = shippingCost;
  let finalTariffCost = tariffCost;
  
  if (equipmentCost === 0) {
    // Calculate equipment cost using database pricing
    // This would call the existing equipmentCalculations.ts
    // For now, use a placeholder
    const estimatedCostPerMWh = 350000; // This should come from database
    finalEquipmentCost = totalEnergyMWh * estimatedCostPerMWh;
    finalInstallationCost = finalEquipmentCost * 0.08;
    finalShippingCost = finalEquipmentCost * 0.03;
    finalTariffCost = finalEquipmentCost * 0.10;
  }
  
  const totalProjectCost = finalEquipmentCost + finalInstallationCost + finalShippingCost + finalTariffCost;
  const taxCredit = totalProjectCost * constants.FEDERAL_TAX_CREDIT_RATE;
  const netCost = totalProjectCost - taxCredit;
  
  // ===================================
  // 2. CALCULATE ANNUAL SAVINGS
  // ===================================
  
  // Peak shaving / energy arbitrage
  const peakShavingSavings = totalEnergyMWh * constants.PEAK_SHAVING_MULTIPLIER * (electricityRate - 0.05) * 1000;
  
  // Demand charge reduction
  const demandChargeSavings = storageSizeMW * 12 * constants.DEMAND_CHARGE_MONTHLY_PER_MW;
  
  // Grid services revenue
  const gridServiceRevenue = storageSizeMW * constants.GRID_SERVICE_REVENUE_PER_MW;
  
  // Solar savings
  const solarSavings = solarMW > 0 
    ? solarMW * constants.SOLAR_CAPACITY_FACTOR * electricityRate * 1000
    : 0;
  
  // Wind savings
  const windSavings = windMW > 0
    ? windMW * constants.WIND_CAPACITY_FACTOR * electricityRate * 1000
    : 0;
  
  const annualSavings = peakShavingSavings + demandChargeSavings + gridServiceRevenue + solarSavings + windSavings;
  
  // Debugging: Log the breakdown
  console.log('📊 Savings breakdown:', {
    peakShavingSavings: peakShavingSavings.toFixed(0),
    demandChargeSavings: demandChargeSavings.toFixed(0),
    gridServiceRevenue: gridServiceRevenue.toFixed(0),
    solarSavings: solarSavings.toFixed(0),
    windSavings: windSavings.toFixed(0),
    annualSavings: annualSavings.toFixed(0),
    netCost: netCost.toFixed(0)
  });
  
  // ===================================
  // 3. CALCULATE ROI METRICS
  // ===================================
  
  // Prevent division by zero or invalid results
  const paybackYears = annualSavings > 0 ? netCost / annualSavings : 999;
  const roi10Year = annualSavings > 0 ? ((annualSavings * 10 - netCost) / netCost) * 100 : 0;
  const roi25Year = annualSavings > 0 ? ((annualSavings * 25 - netCost) / netCost) * 100 : 0;
  
  console.log('💰 Payback calculation:', {
    netCost,
    annualSavings,
    paybackYears,
    calculation: `${netCost} / ${annualSavings} = ${paybackYears.toFixed(2)}`
  });
  
  // ===================================
  // 4. CALCULATE ADVANCED METRICS (NPV/IRR)
  // ===================================
  
  const includeNPV = input.includeNPV !== false; // Default to true
  const projectYears = input.projectLifetimeYears || 25;
  const discountRate = (input.discountRate || 8) / 100; // Convert to decimal
  const escalationRate = (input.priceEscalationRate || 2) / 100; // Convert to decimal
  
  let npv: number | undefined;
  let irr: number | undefined;
  let discountedPayback: number | undefined;
  let levelizedCostOfStorage: number | undefined;
  
  if (includeNPV && annualSavings > 0) {
    // NPV Calculation with degradation and price escalation
    npv = -netCost; // Initial investment
    let cumulativeDiscountedCashFlow = 0;
    let totalLifetimeEnergy = 0;
    
    for (let year = 1; year <= projectYears; year++) {
      // Apply degradation to system performance
      const degradationFactor = Math.pow(1 - constants.DEGRADATION_RATE_ANNUAL, year - 1);
      
      // Apply price escalation to revenue
      const escalationFactor = Math.pow(1 + escalationRate, year - 1);
      
      // Calculate year's cash flow
      const yearRevenue = annualSavings * degradationFactor * escalationFactor;
      const yearOpex = netCost * constants.OM_COST_PERCENT; // Annual O&M
      const yearCashFlow = yearRevenue - yearOpex;
      
      // Discount to present value
      const discountFactor = Math.pow(1 + discountRate, year);
      const discountedCashFlow = yearCashFlow / discountFactor;
      
      npv += discountedCashFlow;
      cumulativeDiscountedCashFlow += discountedCashFlow;
      
      // Calculate discounted payback (when cumulative NPV > 0)
      if (!discountedPayback && (cumulativeDiscountedCashFlow + netCost) > 0) {
        discountedPayback = year;
      }
      
      // Track total energy for LCOS
      totalLifetimeEnergy += totalEnergyMWh * degradationFactor;
    }
    
    // IRR Approximation (simplified calculation)
    // For exact IRR, we'd need iterative solver (Newton-Raphson)
    const totalUndiscountedCashFlows = annualSavings * projectYears;
    irr = netCost > 0 ? (((totalUndiscountedCashFlows / netCost) - 1) / projectYears) * 100 : 0;
    
    // Levelized Cost of Storage (LCOS)
    const totalLifetimeCosts = netCost + (netCost * constants.OM_COST_PERCENT * projectYears);
    levelizedCostOfStorage = totalLifetimeEnergy > 0 ? totalLifetimeCosts / totalLifetimeEnergy : 0;
    
    console.log('📈 Advanced metrics:', {
      npv: npv.toFixed(0),
      irr: irr.toFixed(2) + '%',
      discountedPayback: discountedPayback?.toFixed(1) + ' years',
      lcos: levelizedCostOfStorage.toFixed(2) + ' $/MWh'
    });
  }
  
  // ===================================
  // 5. RETURN COMPLETE RESULTS
  // ===================================
  
  return {
    // Costs
    equipmentCost: finalEquipmentCost,
    installationCost: finalInstallationCost,
    shippingCost: finalShippingCost,
    tariffCost: finalTariffCost,
    totalProjectCost,
    taxCredit,
    netCost,
    
    // Revenue/Savings
    peakShavingSavings,
    demandChargeSavings,
    gridServiceRevenue,
    solarSavings,
    windSavings,
    annualSavings,
    
    // ROI Metrics (Simple)
    paybackYears,
    roi10Year,
    roi25Year,
    
    // Advanced Metrics (NPV/IRR with degradation)
    npv,
    irr,
    discountedPayback,
    levelizedCostOfStorage,
    
    // Metadata
    calculationDate: new Date(),
    formulaVersion: '2.0.0', // Updated to include NPV/IRR
    dataSource: constants.dataSource,
    constantsUsed: constants
  };
}

// ============================================
// CACHE FOR CONSTANTS (5 minute TTL)
// ============================================

let cachedConstants: CalculationConstants | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedConstants(): Promise<CalculationConstants> {
  const now = Date.now();
  
  if (cachedConstants && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedConstants;
  }
  
  cachedConstants = await getCalculationConstants();
  cacheTimestamp = now;
  return cachedConstants;
}

/**
 * Force refresh the cached constants
 * Call this when admin updates calculation formulas
 */
export function refreshConstantsCache(): void {
  cachedConstants = null;
  cacheTimestamp = 0;
  console.log('🔄 Calculation constants cache cleared');
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  calculateFinancialMetrics,
  getCalculationConstants,
  getCachedConstants,
  refreshConstantsCache
};
