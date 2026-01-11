/**
 * Financial Domain Types
 * ======================
 * Core types for financial calculations, ROI analysis, and investment metrics.
 * 
 * These types define the contracts for all financial calculations in the system.
 * Part of the core domain layer - no dependencies on infrastructure or UI.
 */

// ============================================
// CALCULATION CONSTANTS
// ============================================

export interface CalculationConstants {
  // Financial Constants
  PEAK_SHAVING_MULTIPLIER: number;           // Energy arbitrage multiplier
  DEMAND_CHARGE_MONTHLY_PER_MW: number;      // $/MW-month
  GRID_SERVICE_REVENUE_PER_MW: number;       // $/MW-year
  BACKUP_POWER_VALUE_PER_MW: number;         // $/MW-year (business continuity value)
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

// ============================================
// FINANCIAL CALCULATION INPUTS & OUTPUTS
// ============================================

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
  demandChargeRate?: number;  // Optional: $/kW-month (overrides default)
  includeBackupValue?: boolean;  // Optional: Include business continuity value (default: true)
  
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
  backupPowerValue: number;
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
// ADVANCED FINANCIAL ANALYSIS
// ============================================

export interface SensitivityAnalysisResult {
  parameters: Record<string, {
    baseValue: number;
    variations: number[];
    npvImpact: number[];
    irrImpact: number[];
    elasticity: number; // % change in NPV per % change in parameter
  }>;
  tornadoChart: Array<{
    parameter: string;
    parameterLabel: string;
    impact: number;
    direction: 'positive' | 'negative';
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
