/**
 * FINANCIAL CALCULATOR
 * Calculates ROI, payback, NPV, and all financial metrics
 * 
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 */

export interface FinancialCalculationInput {
  // Costs
  bessCost: number;
  solarCost: number;
  generatorCost: number;
  evCost: number;
  
  // System specs
  bessKW: number;
  bessKWh: number;
  solarKW: number;
  solarAnnualKWh: number;
  generatorKW: number;
  
  // Utility rates
  electricityRate: number;   // $/kWh
  demandCharge: number;      // $/kW
  
  // Location
  state: string;
}

export interface FinancialCalculationResult {
  // Costs
  totalEquipmentCost: number;
  installationCost: number;
  totalInvestment: number;
  
  // Incentives
  federalITC: number;
  federalITCRate: number;
  itcEligibleCost: number;
  estimatedStateIncentives: number;
  totalIncentives: number;
  
  // Net cost
  netCost: number;
  
  // Savings breakdown
  demandChargeSavings: number;
  arbitrageSavings: number;
  solarSavings: number;
  annualSavings: number;
  
  // Key metrics
  simplePaybackYears: number;
  tenYearROI: number;
  twentyFiveYearNPV: number;
  irr: number;
  lcoe: number;  // Levelized cost of energy ($/kWh)
  
  // Monthly/Annual projections
  monthlyPayment?: number;  // If financed
  yearOneNetSavings: number;
  tenYearNetSavings: number;
  lifetimeNetSavings: number;
}

// Financial constants
const FINANCIAL_CONSTANTS = {
  INSTALLATION_PERCENT: 0.15,
  FEDERAL_ITC_RATE: 0.30,
  DISCOUNT_RATE: 0.08,
  ELECTRICITY_ESCALATION: 0.03,  // 3% annual increase
  PROJECT_LIFETIME_YEARS: 25,
  PEAK_SHAVING_PERCENT: 0.25,
  ARBITRAGE_CYCLES_YEAR: 250,
  ARBITRAGE_SPREAD: 0.06,
  BESS_DEGRADATION_ANNUAL: 0.025,
  SOLAR_DEGRADATION_ANNUAL: 0.005,
};

// State incentive estimates (simplified - real values from stateIncentivesService)
const STATE_INCENTIVE_RATES: Record<string, number> = {
  'CA': 0.10,  // 10% state incentive
  'MA': 0.08,
  'NY': 0.07,
  'NJ': 0.06,
  'CT': 0.05,
  'MD': 0.05,
  'OR': 0.04,
  'CO': 0.04,
  'AZ': 0.03,
  'TX': 0.02,
};

/**
 * Calculate all financial metrics
 */
export function calculateFinancials(input: FinancialCalculationInput): FinancialCalculationResult {
  // Equipment and installation costs
  const totalEquipmentCost = input.bessCost + input.solarCost + input.generatorCost + input.evCost;
  const installationCost = totalEquipmentCost * FINANCIAL_CONSTANTS.INSTALLATION_PERCENT;
  const totalInvestment = totalEquipmentCost + installationCost;

  // Federal ITC (only on BESS + Solar)
  const itcEligibleCost = input.bessCost + input.solarCost;
  const federalITC = Math.round(itcEligibleCost * FINANCIAL_CONSTANTS.FEDERAL_ITC_RATE);

  // State incentives (estimate)
  const stateRate = STATE_INCENTIVE_RATES[input.state] || 0;
  const estimatedStateIncentives = Math.round(itcEligibleCost * stateRate);

  const totalIncentives = federalITC + estimatedStateIncentives;
  const netCost = totalInvestment - totalIncentives;

  // Annual savings calculation
  const demandChargeSavings = calculateDemandSavings(input.bessKW, input.demandCharge);
  const arbitrageSavings = calculateArbitrageSavings(input.bessKWh);
  const solarSavings = calculateSolarSavings(input.solarAnnualKWh, input.electricityRate);
  const annualSavings = demandChargeSavings + arbitrageSavings + solarSavings;

  // Key metrics
  const simplePaybackYears = annualSavings > 0 ? netCost / annualSavings : 99;
  const tenYearROI = annualSavings > 0 
    ? ((annualSavings * 10 - netCost) / netCost) * 100 
    : 0;

  // NPV calculation with degradation and escalation
  const twentyFiveYearNPV = calculateNPV(
    netCost,
    annualSavings,
    FINANCIAL_CONSTANTS.PROJECT_LIFETIME_YEARS,
    FINANCIAL_CONSTANTS.DISCOUNT_RATE,
    FINANCIAL_CONSTANTS.ELECTRICITY_ESCALATION,
    input.solarKW > 0 ? FINANCIAL_CONSTANTS.SOLAR_DEGRADATION_ANNUAL : 0,
    input.bessKWh > 0 ? FINANCIAL_CONSTANTS.BESS_DEGRADATION_ANNUAL : 0
  );

  // IRR calculation
  const irr = calculateIRR(netCost, annualSavings, FINANCIAL_CONSTANTS.PROJECT_LIFETIME_YEARS);

  // LCOE (Levelized Cost of Energy)
  const totalLifetimeEnergy = input.solarAnnualKWh * FINANCIAL_CONSTANTS.PROJECT_LIFETIME_YEARS * 0.9; // 90% avg
  const lcoe = totalLifetimeEnergy > 0 ? netCost / totalLifetimeEnergy : 0;

  // Projections
  const yearOneNetSavings = annualSavings;
  const tenYearNetSavings = calculateCumulativeSavings(annualSavings, 10, FINANCIAL_CONSTANTS.ELECTRICITY_ESCALATION) - netCost;
  const lifetimeNetSavings = calculateCumulativeSavings(annualSavings, 25, FINANCIAL_CONSTANTS.ELECTRICITY_ESCALATION) - netCost;

  return {
    totalEquipmentCost: Math.round(totalEquipmentCost),
    installationCost: Math.round(installationCost),
    totalInvestment: Math.round(totalInvestment),
    federalITC,
    federalITCRate: FINANCIAL_CONSTANTS.FEDERAL_ITC_RATE,
    itcEligibleCost: Math.round(itcEligibleCost),
    estimatedStateIncentives,
    totalIncentives,
    netCost: Math.round(netCost),
    demandChargeSavings: Math.round(demandChargeSavings),
    arbitrageSavings: Math.round(arbitrageSavings),
    solarSavings: Math.round(solarSavings),
    annualSavings: Math.round(annualSavings),
    simplePaybackYears: Math.round(simplePaybackYears * 10) / 10,
    tenYearROI: Math.round(tenYearROI * 10) / 10,
    twentyFiveYearNPV: Math.round(twentyFiveYearNPV),
    irr: Math.round(irr * 10) / 10,
    lcoe: Math.round(lcoe * 1000) / 1000,
    yearOneNetSavings: Math.round(yearOneNetSavings),
    tenYearNetSavings: Math.round(tenYearNetSavings),
    lifetimeNetSavings: Math.round(lifetimeNetSavings),
  };
}

/**
 * Calculate demand charge savings from peak shaving
 */
function calculateDemandSavings(bessKW: number, demandCharge: number): number {
  // Assume BESS can shave 25% of peak demand
  const peakReductionKW = bessKW * FINANCIAL_CONSTANTS.PEAK_SHAVING_PERCENT;
  const monthlyDemandSavings = peakReductionKW * demandCharge;
  return monthlyDemandSavings * 12;
}

/**
 * Calculate arbitrage savings from buying low/selling high
 */
function calculateArbitrageSavings(bessKWh: number): number {
  // Assume 250 arbitrage cycles per year with $0.06 spread
  return bessKWh * FINANCIAL_CONSTANTS.ARBITRAGE_CYCLES_YEAR * FINANCIAL_CONSTANTS.ARBITRAGE_SPREAD;
}

/**
 * Calculate solar savings from avoided electricity purchases
 */
function calculateSolarSavings(annualKWh: number, electricityRate: number): number {
  return annualKWh * electricityRate;
}

/**
 * Calculate NPV with degradation and escalation
 */
function calculateNPV(
  initialCost: number,
  annualSavings: number,
  years: number,
  discountRate: number,
  escalationRate: number,
  solarDegradation: number,
  bessDegradation: number
): number {
  let npv = -initialCost;
  const avgDegradation = (solarDegradation + bessDegradation) / 2;

  for (let year = 1; year <= years; year++) {
    // Savings increase with electricity escalation
    const escalatedSavings = annualSavings * Math.pow(1 + escalationRate, year - 1);
    
    // But system degrades over time
    const degradedSavings = escalatedSavings * Math.pow(1 - avgDegradation, year - 1);
    
    // Discount to present value
    const pv = degradedSavings / Math.pow(1 + discountRate, year);
    npv += pv;
  }

  return npv;
}

/**
 * Calculate cumulative savings over years
 */
function calculateCumulativeSavings(annualSavings: number, years: number, escalationRate: number): number {
  let total = 0;
  for (let year = 1; year <= years; year++) {
    total += annualSavings * Math.pow(1 + escalationRate, year - 1);
  }
  return total;
}

/**
 * Calculate IRR using Newton-Raphson method
 */
function calculateIRR(initialCost: number, annualCashFlow: number, years: number): number {
  if (annualCashFlow <= 0) return 0;

  // Create cash flow array
  const cashFlows = [-initialCost];
  for (let i = 0; i < years; i++) {
    cashFlows.push(annualCashFlow);
  }

  // Newton-Raphson iteration
  let irr = 0.1; // Initial guess
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const discountFactor = Math.pow(1 + irr, t);
      npv += cashFlows[t] / discountFactor;
      if (t > 0) {
        derivative -= (t * cashFlows[t]) / Math.pow(1 + irr, t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) break;
    if (derivative === 0) break;

    irr = irr - npv / derivative;

    // Bound IRR to reasonable range
    if (irr < -0.99) irr = -0.99;
    if (irr > 1) irr = 1;
  }

  return irr * 100; // Return as percentage
}

/**
 * Calculate monthly payment for financed system
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;
  
  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return Math.round(payment);
}

/**
 * Get financial summary for display
 */
export function getFinancialSummary(result: FinancialCalculationResult): {
  headline: string;
  metrics: { label: string; value: string; highlight?: boolean }[];
} {
  const headline = result.simplePaybackYears <= 3 
    ? '🚀 Excellent Investment!'
    : result.simplePaybackYears <= 5
    ? '✅ Strong Returns'
    : result.simplePaybackYears <= 7
    ? '👍 Good Investment'
    : '📊 Long-term Value';

  return {
    headline,
    metrics: [
      { label: 'Total Investment', value: `$${result.totalInvestment.toLocaleString()}` },
      { label: 'Net Cost (after incentives)', value: `$${result.netCost.toLocaleString()}`, highlight: true },
      { label: 'Annual Savings', value: `$${result.annualSavings.toLocaleString()}` },
      { label: 'Payback Period', value: `${result.simplePaybackYears} years`, highlight: result.simplePaybackYears <= 5 },
      { label: '10-Year ROI', value: `${result.tenYearROI}%`, highlight: result.tenYearROI > 100 },
      { label: '25-Year NPV', value: `$${result.twentyFiveYearNPV.toLocaleString()}` },
    ],
  };
}
