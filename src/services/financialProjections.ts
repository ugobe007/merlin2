/**
 * TRUEQUOTE FINANCIAL PROJECTIONS
 * ================================
 * 
 * Multi-year financial analysis for BESS + Solar + Generator investments.
 * Provides year-by-year cash flows, NPV, IRR, and break-even analysis.
 * 
 * @author Noah Energy Solutions
 * @date January 2026
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface FinancialInputs {
  // Equipment costs
  totalInvestment: number;      // Total upfront cost
  federalITC: number;           // Federal ITC amount (30%)
  netInvestment: number;        // After ITC
  
  // Annual values
  annualSavings: number;        // Year 1 savings
  annualMaintenanceCost?: number; // Optional O&M cost
  
  // System specs (for degradation)
  bessKWh?: number;
  solarKW?: number;
  
  // Optional parameters
  electricityEscalationRate?: number;  // Annual electricity price increase (default 3%)
  discountRate?: number;               // For NPV calculation (default 8%)
  batteryCyclesPerYear?: number;       // For degradation (default 250)
  solarDegradationRate?: number;       // Annual solar output decline (default 0.5%)
  batteryDegradationRate?: number;     // Annual battery capacity decline (default 2%)
  inflationRate?: number;              // General inflation (default 2.5%)
}

export interface YearlyProjection {
  year: number;
  
  // Savings
  grossSavings: number;           // Before degradation adjustments
  degradationFactor: number;      // Combined degradation multiplier
  netSavings: number;             // After degradation
  
  // Costs
  maintenanceCost: number;
  
  // Cash flow
  cashFlow: number;               // Net savings - maintenance
  cumulativeCashFlow: number;     // Running total
  
  // Value metrics
  presentValue: number;           // Discounted cash flow
  cumulativePV: number;           // Running total of PV
  
  // Status
  isBreakEven: boolean;           // Did we break even this year?
}

export interface FinancialProjection {
  // Summary metrics
  summary: {
    paybackYears: number;         // Simple payback
    discountedPaybackYears: number; // Payback using NPV
    npv: number;                  // Net Present Value
    irr: number;                  // Internal Rate of Return (%)
    roi: number;                  // Total ROI (%)
    lifetimeSavings: number;      // Total savings over projection period
    lifetimeNetBenefit: number;   // Savings - Investment
    savingsToInvestmentRatio: number; // SIR
  };
  
  // Year-by-year breakdown
  yearlyProjections: YearlyProjection[];
  
  // Inputs used (for reference)
  inputs: FinancialInputs;
  
  // Metadata
  projectionYears: number;
  generatedAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const FINANCIAL_DEFAULTS = {
  electricityEscalationRate: 0.03,    // 3% annual electricity price increase
  discountRate: 0.08,                  // 8% discount rate for NPV
  batteryCyclesPerYear: 250,           // Typical C&I cycling
  solarDegradationRate: 0.005,         // 0.5% per year
  batteryDegradationRate: 0.02,        // 2% per year (capacity fade)
  inflationRate: 0.025,                // 2.5% general inflation
  maintenanceCostPercent: 0.01,        // 1% of system cost annually
  batteryReplacementYear: 12,          // When battery might need replacement
  batteryReplacementCostPercent: 0.40, // 40% of original battery cost
};

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate multi-year financial projections
 * 
 * @param inputs - Financial inputs from TrueQuote calculation
 * @param years - Number of years to project (default 10)
 * @returns Complete financial projection with yearly breakdown
 */
export function calculateFinancialProjection(
  inputs: FinancialInputs,
  years: number = 10
): FinancialProjection {
  
  // Apply defaults
  const electricityEscalation = inputs.electricityEscalationRate ?? FINANCIAL_DEFAULTS.electricityEscalationRate;
  const discountRate = inputs.discountRate ?? FINANCIAL_DEFAULTS.discountRate;
  const solarDegradation = inputs.solarDegradationRate ?? FINANCIAL_DEFAULTS.solarDegradationRate;
  const batteryDegradation = inputs.batteryDegradationRate ?? FINANCIAL_DEFAULTS.batteryDegradationRate;
  const inflationRate = inputs.inflationRate ?? FINANCIAL_DEFAULTS.inflationRate;
  
  // Calculate annual maintenance cost if not provided
  const baseMaintenance = inputs.annualMaintenanceCost ?? 
    (inputs.totalInvestment * FINANCIAL_DEFAULTS.maintenanceCostPercent);
  
  // Year-by-year calculations
  const yearlyProjections: YearlyProjection[] = [];
  let cumulativeCashFlow = -inputs.netInvestment; // Start negative (initial investment)
  let cumulativePV = -inputs.netInvestment;
  let breakEvenYear = 0;
  let discountedBreakEvenYear = 0;
  
  for (let year = 1; year <= years; year++) {
    // Calculate degradation factor
    // Combines battery degradation and solar degradation
    const batteryFactor = Math.pow(1 - batteryDegradation, year - 1);
    const solarFactor = inputs.solarKW ? Math.pow(1 - solarDegradation, year - 1) : 1;
    
    // Weighted degradation (assume 60% of savings from BESS, 40% from solar if both exist)
    const hasSolar = (inputs.solarKW ?? 0) > 0;
    const degradationFactor = hasSolar 
      ? (batteryFactor * 0.6 + solarFactor * 0.4)
      : batteryFactor;
    
    // Calculate electricity price escalation factor
    const escalationFactor = Math.pow(1 + electricityEscalation, year - 1);
    
    // Gross savings = base savings × escalation (electricity prices going up = more savings)
    const grossSavings = inputs.annualSavings * escalationFactor;
    
    // Net savings = gross × degradation factor
    const netSavings = Math.round(grossSavings * degradationFactor);
    
    // Maintenance cost increases with inflation
    const maintenanceCost = Math.round(baseMaintenance * Math.pow(1 + inflationRate, year - 1));
    
    // Cash flow = savings - maintenance
    const cashFlow = netSavings - maintenanceCost;
    cumulativeCashFlow += cashFlow;
    
    // Present value calculation
    const discountFactor = Math.pow(1 + discountRate, year);
    const presentValue = Math.round(cashFlow / discountFactor);
    cumulativePV += presentValue;
    
    // Check for break-even
    const isBreakEven = cumulativeCashFlow >= 0 && (yearlyProjections.length === 0 || 
      yearlyProjections[yearlyProjections.length - 1].cumulativeCashFlow < 0);
    
    if (isBreakEven && breakEvenYear === 0) {
      // Calculate fractional break-even year
      const prevCumulative = yearlyProjections.length > 0 
        ? yearlyProjections[yearlyProjections.length - 1].cumulativeCashFlow 
        : -inputs.netInvestment;
      const fraction = Math.abs(prevCumulative) / cashFlow;
      breakEvenYear = year - 1 + fraction;
    }
    
    // Check for discounted break-even
    if (cumulativePV >= 0 && discountedBreakEvenYear === 0) {
      const prevCumulativePV = yearlyProjections.length > 0 
        ? yearlyProjections[yearlyProjections.length - 1].cumulativePV 
        : -inputs.netInvestment;
      const fraction = Math.abs(prevCumulativePV) / presentValue;
      discountedBreakEvenYear = year - 1 + fraction;
    }
    
    yearlyProjections.push({
      year,
      grossSavings: Math.round(grossSavings),
      degradationFactor: Math.round(degradationFactor * 1000) / 1000,
      netSavings,
      maintenanceCost,
      cashFlow,
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      presentValue,
      cumulativePV: Math.round(cumulativePV),
      isBreakEven,
    });
  }
  
  // Calculate summary metrics
  const totalSavings = yearlyProjections.reduce((sum, y) => sum + y.netSavings, 0);
  const totalMaintenance = yearlyProjections.reduce((sum, y) => sum + y.maintenanceCost, 0);
  const lifetimeSavings = totalSavings - totalMaintenance;
  const lifetimeNetBenefit = lifetimeSavings - inputs.netInvestment;
  const npv = cumulativePV;
  const roi = inputs.netInvestment > 0 ? (lifetimeNetBenefit / inputs.netInvestment) * 100 : 0;
  const sir = inputs.netInvestment > 0 ? lifetimeSavings / inputs.netInvestment : 0;
  
  // Calculate IRR using Newton-Raphson method
  const irr = calculateIRR(inputs.netInvestment, yearlyProjections.map(y => y.cashFlow));
  
  return {
    summary: {
      paybackYears: breakEvenYear > 0 
        ? Math.round(breakEvenYear * 10) / 10 
        : inputs.annualSavings > 0 
          ? Math.round((inputs.netInvestment / inputs.annualSavings) * 10) / 10 
          : 0,
      discountedPaybackYears: Math.round(discountedBreakEvenYear * 10) / 10,
      npv: Math.round(npv),
      irr: Math.round(irr * 10) / 10,
      roi: Math.round(roi),
      lifetimeSavings: Math.round(lifetimeSavings),
      lifetimeNetBenefit: Math.round(lifetimeNetBenefit),
      savingsToInvestmentRatio: Math.round(sir * 100) / 100,
    },
    yearlyProjections,
    inputs,
    projectionYears: years,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// IRR CALCULATION (Newton-Raphson Method)
// ============================================================================

/**
 * Calculate Internal Rate of Return using Newton-Raphson iteration
 */
function calculateIRR(initialInvestment: number, cashFlows: number[], maxIterations = 100, tolerance = 0.0001): number {
  // Initial guess
  let rate = 0.10; // Start with 10%
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = -initialInvestment;
    let dnpv = 0; // Derivative of NPV
    
    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t + 1);
      npv += cashFlows[t] / factor;
      dnpv -= (t + 1) * cashFlows[t] / Math.pow(1 + rate, t + 2);
    }
    
    // Newton-Raphson step
    const newRate = rate - npv / dnpv;
    
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100; // Return as percentage
    }
    
    rate = newRate;
    
    // Guard against divergence
    if (rate < -0.99 || rate > 10) {
      break;
    }
  }
  
  return rate * 100;
}

// ============================================================================
// QUICK PROJECTION FUNCTIONS
// ============================================================================

/**
 * Get a quick 5-year summary for display in wizard
 */
export function getQuickProjection(inputs: FinancialInputs): {
  year1: { savings: number; cumulative: number };
  year3: { savings: number; cumulative: number };
  year5: { savings: number; cumulative: number };
  year10: { savings: number; cumulative: number };
  breakEvenYear: number;
  lifetimeROI: number;
} {
  const projection = calculateFinancialProjection(inputs, 10);
  
  const getYearData = (year: number) => {
    const yearData = projection.yearlyProjections.find(y => y.year === year);
    return {
      savings: yearData?.netSavings ?? 0,
      cumulative: yearData?.cumulativeCashFlow ?? 0,
    };
  };
  
  return {
    year1: getYearData(1),
    year3: getYearData(3),
    year5: getYearData(5),
    year10: getYearData(10),
    breakEvenYear: projection.summary.paybackYears,
    lifetimeROI: projection.summary.roi,
  };
}

/**
 * Format projection for display in UI
 */
export function formatProjectionForDisplay(projection: FinancialProjection): {
  summaryCards: Array<{ label: string; value: string; subtext?: string }>;
  yearlyTable: Array<{ year: number; savings: string; cumulative: string; status: string }>;
} {
  const { summary, yearlyProjections } = projection;
  
  const summaryCards = [
    {
      label: 'Simple Payback',
      value: `${summary.paybackYears.toFixed(1)} years`,
      subtext: 'Time to recover investment',
    },
    {
      label: 'Net Present Value',
      value: `$${(summary.npv / 1000).toFixed(0)}K`,
      subtext: `At ${(projection.inputs.discountRate ?? 0.08) * 100}% discount rate`,
    },
    {
      label: 'Internal Rate of Return',
      value: `${summary.irr}%`,
      subtext: 'Annualized return on investment',
    },
    {
      label: `${projection.projectionYears}-Year ROI`,
      value: `${summary.roi}%`,
      subtext: `$${(summary.lifetimeNetBenefit / 1000).toFixed(0)}K net benefit`,
    },
    {
      label: 'Lifetime Savings',
      value: `$${(summary.lifetimeSavings / 1000).toFixed(0)}K`,
      subtext: `Over ${projection.projectionYears} years`,
    },
    {
      label: 'Savings-to-Investment',
      value: `${summary.savingsToInvestmentRatio}x`,
      subtext: 'Total savings ÷ net cost',
    },
  ];
  
  const yearlyTable = yearlyProjections.map(y => ({
    year: y.year,
    savings: `$${(y.netSavings / 1000).toFixed(0)}K`,
    cumulative: y.cumulativeCashFlow >= 0 
      ? `+$${(y.cumulativeCashFlow / 1000).toFixed(0)}K`
      : `-$${(Math.abs(y.cumulativeCashFlow) / 1000).toFixed(0)}K`,
    status: y.cumulativeCashFlow >= 0 ? '✅ Profit' : '📈 Recovering',
  }));
  
  return { summaryCards, yearlyTable };
}

// ============================================================================
// SENSITIVITY ANALYSIS
// ============================================================================

export interface SensitivityResult {
  scenario: string;
  paybackYears: number;
  npv: number;
  irr: number;
  change: string;
}

/**
 * Run sensitivity analysis on key variables
 */
export function runSensitivityAnalysis(inputs: FinancialInputs): SensitivityResult[] {
  const baseProjection = calculateFinancialProjection(inputs, 10);
  const results: SensitivityResult[] = [];
  
  // Base case
  results.push({
    scenario: 'Base Case',
    paybackYears: baseProjection.summary.paybackYears,
    npv: baseProjection.summary.npv,
    irr: baseProjection.summary.irr,
    change: '—',
  });
  
  // Electricity prices +5%/year
  const highEscalation = calculateFinancialProjection({
    ...inputs,
    electricityEscalationRate: 0.05,
  }, 10);
  results.push({
    scenario: 'High Electricity Escalation (5%/yr)',
    paybackYears: highEscalation.summary.paybackYears,
    npv: highEscalation.summary.npv,
    irr: highEscalation.summary.irr,
    change: `NPV +$${((highEscalation.summary.npv - baseProjection.summary.npv) / 1000).toFixed(0)}K`,
  });
  
  // Electricity prices +1%/year (low)
  const lowEscalation = calculateFinancialProjection({
    ...inputs,
    electricityEscalationRate: 0.01,
  }, 10);
  results.push({
    scenario: 'Low Electricity Escalation (1%/yr)',
    paybackYears: lowEscalation.summary.paybackYears,
    npv: lowEscalation.summary.npv,
    irr: lowEscalation.summary.irr,
    change: `NPV $${((lowEscalation.summary.npv - baseProjection.summary.npv) / 1000).toFixed(0)}K`,
  });
  
  // Higher degradation
  const highDegradation = calculateFinancialProjection({
    ...inputs,
    batteryDegradationRate: 0.03,
  }, 10);
  results.push({
    scenario: 'Higher Battery Degradation (3%/yr)',
    paybackYears: highDegradation.summary.paybackYears,
    npv: highDegradation.summary.npv,
    irr: highDegradation.summary.irr,
    change: `NPV $${((highDegradation.summary.npv - baseProjection.summary.npv) / 1000).toFixed(0)}K`,
  });
  
  // Lower discount rate (more favorable)
  const lowDiscount = calculateFinancialProjection({
    ...inputs,
    discountRate: 0.05,
  }, 10);
  results.push({
    scenario: 'Lower Discount Rate (5%)',
    paybackYears: lowDiscount.summary.paybackYears,
    npv: lowDiscount.summary.npv,
    irr: lowDiscount.summary.irr,
    change: `NPV +$${((lowDiscount.summary.npv - baseProjection.summary.npv) / 1000).toFixed(0)}K`,
  });
  
  return results;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  calculateFinancialProjection,
  getQuickProjection,
  formatProjectionForDisplay,
  runSensitivityAnalysis,
  FINANCIAL_DEFAULTS,
};
