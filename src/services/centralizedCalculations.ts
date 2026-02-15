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
 * - calculation_constants: Simple key-value constants (NEW - SMB platform)
 * - calculation_formulas: Complex calculation formulas
 * - pricing_configurations: Stores equipment pricing
 *
 * Priority for fetching constants:
 * 1. calculation_constants table (SMB platform - simple key-value)
 * 2. calculation_formulas table (legacy - complex formulas)
 * 3. TypeScript fallbacks (if database unavailable)
 *
 * Usage:
 * import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
 * const results = await calculateFinancialMetrics({ powerMW, durationHours, ...config });
 *
 * Version: 2.0.0 - Now integrates with calculation_constants table
 * Date: November 30, 2025
 */

import { supabase } from "./supabaseClient";
import { getBatteryPricing } from "./unifiedPricingService";
import { getConstant } from "./calculationConstantsService";

// ============================================
// INTERFACES
// ============================================

export interface CalculationConstants {
  // Financial Constants
  PEAK_SHAVING_MULTIPLIER: number; // Energy arbitrage multiplier
  DEMAND_CHARGE_MONTHLY_PER_MW: number; // $/MW-month
  GRID_SERVICE_REVENUE_PER_MW: number; // $/MW-year
  SOLAR_CAPACITY_FACTOR: number; // Annual production factor
  WIND_CAPACITY_FACTOR: number; // Annual production factor
  FEDERAL_TAX_CREDIT_RATE: number; // ITC percentage (0.30 = 30%)

  // Operational Constants
  ANNUAL_CYCLES: number; // Battery cycles per year
  ROUND_TRIP_EFFICIENCY: number; // Battery efficiency (0.85 = 85%)
  DEGRADATION_RATE_ANNUAL: number; // Battery degradation per year
  OM_COST_PERCENT: number; // O&M as % of CAPEX

  // Formula metadata
  lastUpdated: Date;
  dataSource: "database" | "fallback";
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
  electricityRate: number; // $/kWh

  // Equipment costs (if already calculated)
  equipmentCost?: number;
  installationCost?: number;
  shippingCost?: number;
  tariffCost?: number;

  // Advanced financial parameters (optional)
  projectLifetimeYears?: number; // Default: 25
  discountRate?: number; // Default: 8% (WACC)
  priceEscalationRate?: number; // Default: 2% (inflation)
  includeNPV?: boolean; // Default: true
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
  npv?: number; // Net Present Value
  irr?: number; // Internal Rate of Return (%)
  discountedPayback?: number; // Payback with time value of money
  levelizedCostOfStorage?: number; // LCOS ($/MWh)

  // Metadata
  calculationDate: Date;
  formulaVersion: string;
  dataSource: "database" | "fallback";
  constantsUsed: CalculationConstants;
}

// ============================================
// ADVANCED FINANCIAL ANALYSIS INTERFACES
// ============================================

export interface SensitivityAnalysisResult {
  parameters: Record<
    string,
    {
      baseValue: number;
      variations: number[];
      npvImpact: number[];
      irrImpact: number[];
      elasticity: number; // % change in NPV per % change in parameter
    }
  >;
  tornadoChart: Array<{
    parameter: string;
    parameterLabel: string;
    impact: number;
    direction: "positive" | "negative";
  }>;
  mostSensitiveParameters: string[];
}

export interface RiskAnalysisResult {
  statistics: {
    meanNPV: number;
    medianNPV: number;
    stdDevNPV: number;
    coefficientOfVariation: number;
    meanIRR: number;
    stdDevIRR: number;
  };
  valueAtRisk: {
    var95: number; // 95% confidence level - worst case at 95% probability
    var99: number; // 99% confidence level
    expectedShortfall: number; // Average loss beyond VaR95
  };
  probabilityOfSuccess: number; // P(NPV > 0)
  scenarios: {
    best: { npv: number; irr: number };
    worst: { npv: number; irr: number };
    median: { npv: number; irr: number };
  };
  distributionData: Array<{ npv: number; frequency: number }>; // For histogram
}

export interface ScenarioAnalysisResult {
  optimistic: {
    assumptions: string[];
    npv: number;
    irr: number;
    paybackYears: number;
    roi25Year: number;
  };
  base: {
    assumptions: string[];
    npv: number;
    irr: number;
    paybackYears: number;
    roi25Year: number;
  };
  pessimistic: {
    assumptions: string[];
    npv: number;
    irr: number;
    paybackYears: number;
    roi25Year: number;
  };
  comparisons: {
    npvSpread: number;
    irrSpread: number;
    paybackSpread: number;
  };
}

export interface AdvancedFinancialMetrics extends FinancialCalculationResult {
  // Add advanced metrics to existing result interface
  mirr?: number; // Modified Internal Rate of Return
  sensitivityAnalysis?: SensitivityAnalysisResult;
  riskAnalysis?: RiskAnalysisResult;
  scenarioAnalysis?: ScenarioAnalysisResult;
  degradationProfile?: {
    yearlyCapacityRetention: number[];
    effectiveLifeYears: number;
    averageAnnualDegradation: number;
  };
}

// ============================================
// DATABASE CONSTANTS FETCHER
// ============================================

/**
 * Fetch all calculation constants from the database
 * This is the SINGLE SOURCE OF TRUTH
 *
 * Priority:
 * 1. calculation_constants table (SMB platform - simple, admin-editable)
 * 2. calculation_formulas table (legacy - complex formulas)
 * 3. TypeScript fallbacks
 */
export async function getCalculationConstants(): Promise<CalculationConstants> {
  try {
    // PRIORITY 1: Try calculation_constants table (new SMB platform SSOT)
    const [itcRate, discountRate, degradationRate] = await Promise.all([
      getConstant("federal_itc_rate"),
      getConstant("discount_rate"),
      getConstant("battery_degradation_rate"),
    ]);

    // If we got values from calculation_constants, build from there
    const hasNewConstants = itcRate !== null || discountRate !== null;

    // PRIORITY 2: Try calculation_formulas table (legacy)
    const { data: formulas, error } = await supabase
      .from("calculation_formulas")
      .select("*")
      .in("formula_key", [
        "peak_shaving_multiplier",
        "demand_charge_monthly_per_mw",
        "grid_service_revenue_per_mw",
        "solar_capacity_factor",
        "wind_capacity_factor",
        "federal_tax_credit_rate",
        "annual_cycles",
        "round_trip_efficiency",
        "degradation_rate_annual",
        "om_cost_percent",
      ]);

    if (error && !error.message?.includes("does not exist")) {
      console.warn("⚠️ calculation_formulas query error:", error.message);
    }

    // Build constants object - prefer calculation_constants, fallback to formulas
    const constants: CalculationConstants = {
      PEAK_SHAVING_MULTIPLIER: extractConstant(formulas, "peak_shaving_multiplier", 365),
      DEMAND_CHARGE_MONTHLY_PER_MW: extractConstant(
        formulas,
        "demand_charge_monthly_per_mw",
        15000
      ),
      GRID_SERVICE_REVENUE_PER_MW: extractConstant(formulas, "grid_service_revenue_per_mw", 30000),
      SOLAR_CAPACITY_FACTOR: extractConstant(formulas, "solar_capacity_factor", 1500),
      WIND_CAPACITY_FACTOR: extractConstant(formulas, "wind_capacity_factor", 2500),
      // Use calculation_constants values if available, otherwise fallback
      FEDERAL_TAX_CREDIT_RATE: itcRate ?? extractConstant(formulas, "federal_tax_credit_rate", 0.3),
      ANNUAL_CYCLES: extractConstant(formulas, "annual_cycles", 365),
      ROUND_TRIP_EFFICIENCY: extractConstant(formulas, "round_trip_efficiency", 0.85),
      DEGRADATION_RATE_ANNUAL:
        degradationRate ?? extractConstant(formulas, "degradation_rate_annual", 0.02),
      OM_COST_PERCENT: extractConstant(formulas, "om_cost_percent", 0.025),
      lastUpdated: new Date(),
      dataSource: hasNewConstants
        ? "database"
        : formulas && formulas.length > 0
          ? "database"
          : "fallback",
    };

    if (import.meta.env.DEV) {
      console.log("✅ Calculation constants loaded:", constants.dataSource);
      if (hasNewConstants) {
        console.log("📊 Using calculation_constants table (ITC:", itcRate, ")");
      }
    }
    return constants;
  } catch (error) {
    console.error("❌ Error fetching calculation constants from database:", error);

    // Return fallback constants
    return {
      PEAK_SHAVING_MULTIPLIER: 365,
      DEMAND_CHARGE_MONTHLY_PER_MW: 15000,
      GRID_SERVICE_REVENUE_PER_MW: 30000,
      SOLAR_CAPACITY_FACTOR: 1500,
      WIND_CAPACITY_FACTOR: 2500,
      FEDERAL_TAX_CREDIT_RATE: 0.3,
      ANNUAL_CYCLES: 365,
      ROUND_TRIP_EFFICIENCY: 0.85,
      DEGRADATION_RATE_ANNUAL: 0.02,
      OM_COST_PERCENT: 0.025,
      lastUpdated: new Date(),
      dataSource: "fallback",
    };
  }
}

/**
 * Helper function to extract constant value from formula record
 */
function extractConstant(
  formulas: any[] | null,
  formulaName: string,
  fallbackValue: number
): number {
  if (!formulas) return fallbackValue;
  const formula = formulas.find((f) => f.formula_key === formulaName);
  if (!formula) return fallbackValue;

  // Try to extract numeric value from formula_expression or variables
  if (formula.variables && typeof formula.variables === "object") {
    // Check if there's a 'value' or 'default_value' in variables
    if (formula.variables.value !== undefined) return Number(formula.variables.value);
    if (formula.variables.default_value !== undefined)
      return Number(formula.variables.default_value);
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
    tariffCost = 0,
  } = input;

  // ===================================
  // 1. CALCULATE COSTS
  // ===================================
  const totalEnergyMWh = storageSizeMW * durationHours;
  const totalEnergyKWh = totalEnergyMWh * 1000;

  // If costs not provided, fetch real pricing from unifiedPricingService
  let finalEquipmentCost = equipmentCost;
  let finalInstallationCost = installationCost;
  let finalShippingCost = shippingCost;
  let finalTariffCost = tariffCost;

  if (equipmentCost === 0) {
    // ✅ FIX: Fetch battery pack pricing ($130/kWh 2026 market) via unifiedPricingService
    const batteryPricing = await getBatteryPricing(storageSizeMW, durationHours);
    finalEquipmentCost = totalEnergyKWh * batteryPricing.pricePerKWh;
    finalInstallationCost = finalEquipmentCost * 0.15; // 15% installation (industry standard)
    finalShippingCost = finalEquipmentCost * 0.03; // 3% shipping
    finalTariffCost = finalEquipmentCost * 0.05; // 5% tariff (reduced from 10%)

    if (import.meta.env.DEV) {
      console.log(
        `💰 [Pricing] Using NREL ATB 2024: $${batteryPricing.pricePerKWh}/kWh × ${totalEnergyKWh} kWh = $${finalEquipmentCost.toLocaleString()}`
      );
    }
  }

  const totalProjectCost =
    finalEquipmentCost + finalInstallationCost + finalShippingCost + finalTariffCost;
  const taxCredit = totalProjectCost * constants.FEDERAL_TAX_CREDIT_RATE;
  const netCost = totalProjectCost - taxCredit;

  // ===================================
  // 2. CALCULATE ANNUAL SAVINGS
  // ===================================

  // Peak shaving / energy arbitrage
  const peakShavingSavings =
    totalEnergyMWh * constants.PEAK_SHAVING_MULTIPLIER * (electricityRate - 0.05) * 1000;

  // Demand charge reduction
  const demandChargeSavings = storageSizeMW * 12 * constants.DEMAND_CHARGE_MONTHLY_PER_MW;

  // Grid services revenue
  const gridServiceRevenue = storageSizeMW * constants.GRID_SERVICE_REVENUE_PER_MW;

  // Solar savings
  const solarSavings =
    solarMW > 0 ? solarMW * constants.SOLAR_CAPACITY_FACTOR * electricityRate * 1000 : 0;

  // Wind savings
  const windSavings =
    windMW > 0 ? windMW * constants.WIND_CAPACITY_FACTOR * electricityRate * 1000 : 0;

  const annualSavings =
    peakShavingSavings + demandChargeSavings + gridServiceRevenue + solarSavings + windSavings;

  // Debugging: Log the breakdown (DEV only)
  if (import.meta.env.DEV) {
    console.log("📊 Savings breakdown:", {
      peakShavingSavings: peakShavingSavings.toFixed(0),
      demandChargeSavings: demandChargeSavings.toFixed(0),
      gridServiceRevenue: gridServiceRevenue.toFixed(0),
      solarSavings: solarSavings.toFixed(0),
      windSavings: windSavings.toFixed(0),
      annualSavings: annualSavings.toFixed(0),
      netCost: netCost.toFixed(0),
    });
  }

  // ===================================
  // 3. CALCULATE ROI METRICS
  // ===================================

  // Prevent division by zero or invalid results
  const paybackYears = annualSavings > 0 ? netCost / annualSavings : 999;
  const roi10Year = annualSavings > 0 ? ((annualSavings * 10 - netCost) / netCost) * 100 : 0;
  const roi25Year = annualSavings > 0 ? ((annualSavings * 25 - netCost) / netCost) * 100 : 0;

  if (import.meta.env.DEV) {
    console.log("💰 Payback calculation:", {
      netCost,
      annualSavings,
      paybackYears,
      calculation: `${netCost} / ${annualSavings} = ${paybackYears.toFixed(2)}`,
    });
  }

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
      if (!discountedPayback && cumulativeDiscountedCashFlow + netCost > 0) {
        discountedPayback = year;
      }

      // Track total energy for LCOS
      totalLifetimeEnergy += totalEnergyMWh * degradationFactor;
    }

    // IRR Approximation (simplified calculation)
    // For exact IRR, we'd need iterative solver (Newton-Raphson)
    const totalUndiscountedCashFlows = annualSavings * projectYears;
    irr = netCost > 0 ? ((totalUndiscountedCashFlows / netCost - 1) / projectYears) * 100 : 0;

    // Levelized Cost of Storage (LCOS)
    const totalLifetimeCosts = netCost + netCost * constants.OM_COST_PERCENT * projectYears;
    levelizedCostOfStorage = totalLifetimeEnergy > 0 ? totalLifetimeCosts / totalLifetimeEnergy : 0;

    if (import.meta.env.DEV) {
      console.log("📈 Advanced metrics:", {
        npv: npv.toFixed(0),
        irr: irr.toFixed(2) + "%",
        discountedPayback: discountedPayback?.toFixed(1) + " years",
        lcos: levelizedCostOfStorage.toFixed(2) + " $/MWh",
      });
    }
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
    formulaVersion: "2.0.0", // Updated to include NPV/IRR
    dataSource: constants.dataSource,
    constantsUsed: constants,
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

  if (cachedConstants && now - cacheTimestamp < CACHE_TTL) {
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
}

// ============================================
// ADVANCED FINANCIAL ANALYSIS FUNCTIONS
// ============================================

/**
 * Calculate Modified Internal Rate of Return (MIRR)
 * More realistic than IRR because it assumes reinvestment at a specified rate
 */
export function calculateMIRR(
  cashFlows: number[],
  financeRate: number,
  reinvestmentRate: number
): number {
  const n = cashFlows.length - 1;

  // Calculate present value of negative cash flows (financing cost)
  const pvNegative = cashFlows
    .map((cf, i) => (cf < 0 ? cf / Math.pow(1 + financeRate, i) : 0))
    .reduce((sum, pv) => sum + pv, 0);

  // Calculate future value of positive cash flows (reinvestment)
  const fvPositive = cashFlows
    .map((cf, i) => (cf > 0 ? cf * Math.pow(1 + reinvestmentRate, n - i) : 0))
    .reduce((sum, fv) => sum + fv, 0);

  if (pvNegative === 0) return 0;

  return Math.pow(fvPositive / Math.abs(pvNegative), 1 / n) - 1;
}

/**
 * Perform Sensitivity Analysis
 * Shows how changes in key parameters affect NPV and IRR
 */
export async function performSensitivityAnalysis(
  baseInputs: FinancialCalculationInput,
  parametersToTest: string[] = [
    "electricityRate",
    "storageSizeMW",
    "discountRate",
    "projectLifetimeYears",
  ],
  variationPercent: number = 0.2 // ±20% by default
): Promise<SensitivityAnalysisResult> {
  const variationRange = [
    -variationPercent,
    -variationPercent / 2,
    0,
    variationPercent / 2,
    variationPercent,
  ];
  const results: Record<string, any> = {};
  const tornadoData: Array<any> = [];

  // Calculate base case
  const baseResult = await calculateFinancialMetrics(baseInputs);

  for (const paramName of parametersToTest) {
    const npvImpacts: number[] = [];
    const irrImpacts: number[] = [];
    let baseValue = 0;

    for (const variation of variationRange) {
      const modifiedInputs = { ...baseInputs };

      switch (paramName) {
        case "electricityRate":
          baseValue = baseInputs.electricityRate;
          modifiedInputs.electricityRate = baseValue * (1 + variation);
          break;
        case "storageSizeMW":
          baseValue = baseInputs.storageSizeMW;
          modifiedInputs.storageSizeMW = baseValue * (1 + variation);
          break;
        case "discountRate":
          baseValue = baseInputs.discountRate || 0.08;
          modifiedInputs.discountRate = baseValue * (1 + variation);
          break;
        case "projectLifetimeYears":
          baseValue = baseInputs.projectLifetimeYears || 25;
          modifiedInputs.projectLifetimeYears = Math.round(baseValue * (1 + variation));
          break;
        case "priceEscalationRate":
          baseValue = baseInputs.priceEscalationRate || 0.02;
          modifiedInputs.priceEscalationRate = baseValue * (1 + variation);
          break;
      }

      const result = await calculateFinancialMetrics(modifiedInputs);
      npvImpacts.push(result.npv || 0);
      irrImpacts.push(result.irr || 0);
    }

    // Calculate elasticity (% change in NPV per % change in parameter)
    const baseNPV = baseResult.npv || 0;
    const elasticity =
      baseNPV !== 0 ? (npvImpacts[3] - npvImpacts[1]) / baseNPV / variationPercent : 0;

    results[paramName] = {
      baseValue,
      variations: variationRange,
      npvImpact: npvImpacts,
      irrImpact: irrImpacts,
      elasticity,
    };

    // Calculate tornado chart impact (range of NPV swing)
    const maxNPV = Math.max(...npvImpacts);
    const minNPV = Math.min(...npvImpacts);
    const impact = maxNPV - minNPV;

    tornadoData.push({
      parameter: paramName,
      parameterLabel: formatParameterLabel(paramName),
      impact,
      direction: npvImpacts[4] > npvImpacts[0] ? ("positive" as const) : ("negative" as const),
    });
  }

  // Sort tornado chart by impact magnitude (most sensitive first)
  tornadoData.sort((a, b) => b.impact - a.impact);

  return {
    parameters: results,
    tornadoChart: tornadoData,
    mostSensitiveParameters: tornadoData.slice(0, 3).map((d) => d.parameter),
  };
}

/**
 * Perform Risk Analysis using Monte Carlo Simulation
 * Generates probability distribution of financial outcomes
 */
export async function performRiskAnalysis(
  baseInputs: FinancialCalculationInput,
  numSimulations: number = 1000
): Promise<RiskAnalysisResult> {
  const npvResults: number[] = [];
  const irrResults: number[] = [];

  // Run Monte Carlo simulation
  for (let i = 0; i < numSimulations; i++) {
    // Generate random variations (±30% for most parameters)
    const modifiedInputs: FinancialCalculationInput = {
      ...baseInputs,
      electricityRate: baseInputs.electricityRate * (0.7 + Math.random() * 0.6),
      storageSizeMW: baseInputs.storageSizeMW * (0.9 + Math.random() * 0.2),
      discountRate: Math.max(0.03, (baseInputs.discountRate || 0.08) * (0.8 + Math.random() * 0.4)),
      priceEscalationRate: Math.max(
        0,
        (baseInputs.priceEscalationRate || 0.02) * (0.5 + Math.random() * 1.0)
      ),
    };

    const result = await calculateFinancialMetrics(modifiedInputs);
    npvResults.push(result.npv || 0);
    irrResults.push(result.irr || 0);
  }

  // Sort results for percentile calculations
  const sortedNPV = [...npvResults].sort((a, b) => a - b);
  const sortedIRR = [...irrResults].sort((a, b) => a - b);

  // Calculate statistics
  const meanNPV = npvResults.reduce((sum, val) => sum + val, 0) / numSimulations;
  const meanIRR = irrResults.reduce((sum, val) => sum + val, 0) / numSimulations;
  const medianNPV = sortedNPV[Math.floor(numSimulations / 2)];
  const medianIRR = sortedIRR[Math.floor(numSimulations / 2)];

  const varianceNPV =
    npvResults.reduce((sum, val) => sum + Math.pow(val - meanNPV, 2), 0) / numSimulations;
  const stdDevNPV = Math.sqrt(varianceNPV);
  const varianceIRR =
    irrResults.reduce((sum, val) => sum + Math.pow(val - meanIRR, 2), 0) / numSimulations;
  const stdDevIRR = Math.sqrt(varianceIRR);

  const coefficientOfVariation = meanNPV !== 0 ? stdDevNPV / Math.abs(meanNPV) : 0;

  // Value at Risk calculations
  const var95Index = Math.floor(numSimulations * 0.05);
  const var99Index = Math.floor(numSimulations * 0.01);
  const var95 = sortedNPV[var95Index];
  const var99 = sortedNPV[var99Index];

  // Expected Shortfall (average of worst 5%)
  const expectedShortfall =
    sortedNPV.slice(0, var95Index).reduce((sum, val) => sum + val, 0) / var95Index;

  // Probability of success (NPV > 0)
  const successCount = npvResults.filter((npv) => npv > 0).length;
  const probabilityOfSuccess = successCount / numSimulations;

  // Create histogram data (20 bins)
  const numBins = 20;
  const minNPV = Math.min(...npvResults);
  const maxNPV = Math.max(...npvResults);
  const binSize = (maxNPV - minNPV) / numBins;
  const distributionData: Array<{ npv: number; frequency: number }> = [];

  for (let i = 0; i < numBins; i++) {
    const binStart = minNPV + i * binSize;
    const binEnd = binStart + binSize;
    const count = npvResults.filter((npv) => npv >= binStart && npv < binEnd).length;
    distributionData.push({
      npv: binStart + binSize / 2,
      frequency: count / numSimulations,
    });
  }

  return {
    statistics: {
      meanNPV,
      medianNPV,
      stdDevNPV,
      coefficientOfVariation,
      meanIRR,
      stdDevIRR,
    },
    valueAtRisk: {
      var95,
      var99,
      expectedShortfall,
    },
    probabilityOfSuccess,
    scenarios: {
      best: {
        npv: sortedNPV[numSimulations - 1],
        irr: sortedIRR[numSimulations - 1],
      },
      worst: {
        npv: sortedNPV[0],
        irr: sortedIRR[0],
      },
      median: {
        npv: medianNPV,
        irr: medianIRR,
      },
    },
    distributionData,
  };
}

/**
 * Perform Scenario Analysis
 * Compare optimistic, base, and pessimistic cases
 */
export async function performScenarioAnalysis(
  baseInputs: FinancialCalculationInput
): Promise<ScenarioAnalysisResult> {
  // Base case
  const baseResult = await calculateFinancialMetrics(baseInputs);

  // Optimistic case: +20% revenue factors, -10% costs
  const optimisticInputs: FinancialCalculationInput = {
    ...baseInputs,
    electricityRate: baseInputs.electricityRate * 1.2,
    storageSizeMW: baseInputs.storageSizeMW * 1.1,
    priceEscalationRate: (baseInputs.priceEscalationRate || 0.02) * 1.3,
    equipmentCost: baseInputs.equipmentCost ? baseInputs.equipmentCost * 0.9 : undefined,
  };
  const optimisticResult = await calculateFinancialMetrics(optimisticInputs);

  // Pessimistic case: -20% revenue factors, +10% costs
  const pessimisticInputs: FinancialCalculationInput = {
    ...baseInputs,
    electricityRate: baseInputs.electricityRate * 0.8,
    storageSizeMW: baseInputs.storageSizeMW * 0.9,
    priceEscalationRate: (baseInputs.priceEscalationRate || 0.02) * 0.7,
    equipmentCost: baseInputs.equipmentCost ? baseInputs.equipmentCost * 1.1 : undefined,
  };
  const pessimisticResult = await calculateFinancialMetrics(pessimisticInputs);

  return {
    optimistic: {
      assumptions: [
        "+20% electricity rates (favorable market)",
        "+10% system efficiency",
        "+30% price escalation",
        "-10% equipment costs",
      ],
      npv: optimisticResult.npv || 0,
      irr: optimisticResult.irr || 0,
      paybackYears: optimisticResult.paybackYears,
      roi25Year: optimisticResult.roi25Year,
    },
    base: {
      assumptions: [
        "Current electricity rates",
        "Standard system efficiency",
        "Normal price escalation (2-3%)",
        "Current market equipment costs",
      ],
      npv: baseResult.npv || 0,
      irr: baseResult.irr || 0,
      paybackYears: baseResult.paybackYears,
      roi25Year: baseResult.roi25Year,
    },
    pessimistic: {
      assumptions: [
        "-20% electricity rates (unfavorable market)",
        "-10% system efficiency",
        "-30% price escalation",
        "+10% equipment costs",
      ],
      npv: pessimisticResult.npv || 0,
      irr: pessimisticResult.irr || 0,
      paybackYears: pessimisticResult.paybackYears,
      roi25Year: pessimisticResult.roi25Year,
    },
    comparisons: {
      npvSpread: (optimisticResult.npv || 0) - (pessimisticResult.npv || 0),
      irrSpread: (optimisticResult.irr || 0) - (pessimisticResult.irr || 0),
      paybackSpread: pessimisticResult.paybackYears - optimisticResult.paybackYears,
    },
  };
}

/**
 * Enhanced Financial Analysis with All Advanced Metrics
 * This is the main entry point for professional financial modeling
 */
export async function calculateAdvancedFinancialMetrics(
  input: FinancialCalculationInput,
  options: {
    includeMIRR?: boolean;
    includeSensitivity?: boolean;
    includeRiskAnalysis?: boolean;
    includeScenarios?: boolean;
    numMonteCarloSims?: number;
    sensitivityParameters?: string[];
  } = {}
): Promise<AdvancedFinancialMetrics> {
  // 1. Get basic metrics
  const baseMetrics = await calculateFinancialMetrics(input);

  const result: AdvancedFinancialMetrics = { ...baseMetrics };

  // 2. Add MIRR if requested
  if (options.includeMIRR) {
    const projectLife = input.projectLifetimeYears || 25;
    const annualSavings = baseMetrics.annualSavings;
    const initialCost = baseMetrics.totalProjectCost;

    // Build cash flow array: [initial investment, year 1 savings, year 2 savings, ...]
    const cashFlows = [-initialCost, ...Array(projectLife).fill(annualSavings)];

    result.mirr = calculateMIRR(cashFlows, input.discountRate || 0.08, input.discountRate || 0.08);
  }

  // 3. Add sensitivity analysis if requested
  if (options.includeSensitivity) {
    result.sensitivityAnalysis = await performSensitivityAnalysis(
      input,
      options.sensitivityParameters || [
        "electricityRate",
        "storageSizeMW",
        "discountRate",
        "projectLifetimeYears",
      ],
      0.2 // ±20% variation
    );
  }

  // 4. Add risk analysis if requested
  if (options.includeRiskAnalysis) {
    result.riskAnalysis = await performRiskAnalysis(input, options.numMonteCarloSims || 1000);
  }

  // 5. Add scenario analysis if requested
  if (options.includeScenarios) {
    result.scenarioAnalysis = await performScenarioAnalysis(input);
  }

  // 6. Add degradation profile
  const constants = await getCachedConstants();
  const projectLife = input.projectLifetimeYears || 25;
  const yearlyRetention: number[] = [];

  for (let year = 0; year <= projectLife; year++) {
    const retention = Math.pow(1 - constants.DEGRADATION_RATE_ANNUAL, year);
    yearlyRetention.push(retention);
  }

  result.degradationProfile = {
    yearlyCapacityRetention: yearlyRetention,
    effectiveLifeYears: yearlyRetention.findIndex((r) => r < 0.8) || projectLife,
    averageAnnualDegradation: constants.DEGRADATION_RATE_ANNUAL,
  };

  return result;
}

// Helper function for parameter labels
function formatParameterLabel(paramName: string): string {
  const labels: Record<string, string> = {
    electricityRate: "Electricity Rate ($/kWh)",
    storageSizeMW: "Storage Size (MW)",
    discountRate: "Discount Rate (%)",
    projectLifetimeYears: "Project Lifetime (years)",
    priceEscalationRate: "Price Escalation (%)",
  };
  return labels[paramName] || paramName;
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  calculateFinancialMetrics,
  getCalculationConstants,
  getCachedConstants,
  refreshConstantsCache,
};
