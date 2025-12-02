/**
 * PROFESSIONAL FINANCIAL MODEL SERVICE
 * =====================================
 * 
 * Bank/Investor-Ready BESS Financial Modeling
 * 
 * Implements industry-standard financial analysis for:
 * - Project finance lenders
 * - Equity investors
 * - Developer pro formas
 * 
 * Key Features:
 * 1. 3-Statement Model (Income Statement, Balance Sheet, Cash Flow)
 * 2. DSCR (Debt Service Coverage Ratio) - Required by banks
 * 3. Levered vs Unlevered IRR
 * 4. EBITDA Calculation
 * 5. MACRS Depreciation Schedule + ITC
 * 6. Revenue Stacking (Arbitrage + Ancillary + Capacity)
 * 7. Debt Amortization Schedule
 * 
 * Based on industry standards from:
 * - NREL BESS Cost Benchmarks
 * - eFinancialModels BESS templates
 * - Acelerex revenue modeling
 * - Standard project finance conventions
 * 
 * Version: 1.0.0
 * Date: November 29, 2025
 */

import { calculateFinancialMetrics, getCalculationConstants, type FinancialCalculationInput } from './centralizedCalculations';
import { calculateQuote, type QuoteInput } from './unifiedQuoteCalculator';
import { getBatteryPricing } from './unifiedPricingService';

// ============================================
// INTERFACES
// ============================================

export interface ProfessionalModelInput {
  // System Configuration
  storageSizeMW: number;
  durationHours: number;
  solarMW?: number;
  windMW?: number;
  
  // Location & Market
  location: string;
  isoRegion?: 'CAISO' | 'ERCOT' | 'PJM' | 'NYISO' | 'ISO-NE' | 'MISO' | 'SPP' | 'OTHER';
  electricityRate: number; // $/kWh
  demandChargeRate?: number; // $/kW-month
  
  // Revenue Configuration
  revenueStreams: {
    energyArbitrage: boolean;
    demandChargeReduction: boolean;
    frequencyRegulation: boolean;
    spinningReserve: boolean;
    capacityPayments: boolean;
    resourceAdequacy: boolean;
  };
  
  // Project Finance
  projectLifeYears?: number; // Default: 25
  constructionPeriodMonths?: number; // Default: 12
  
  // Capital Structure
  debtEquityRatio?: number; // Default: 70/30 (0.7 debt)
  interestRate?: number; // Default: 6%
  loanTermYears?: number; // Default: 15
  
  // Tax & Incentives
  federalTaxRate?: number; // Default: 21%
  stateTaxRate?: number; // Default: 8%
  itcRate?: number; // Default: 30%
  useMACRS?: boolean; // Default: true (5-year MACRS)
  
  // Operating Assumptions
  annualDegradation?: number; // Default: 2%
  omCostPerKWhYear?: number; // Default: $5/kWh-year
  insurancePercentCapex?: number; // Default: 0.5%
  landLeaseAnnual?: number; // Default: $0 (often included in PPA)
  
  // Escalation Rates
  revenueEscalation?: number; // Default: 2%
  omEscalation?: number; // Default: 2.5%
}

export interface RevenueBreakdown {
  year: number;
  energyArbitrage: number;
  demandChargeReduction: number;
  frequencyRegulation: number;
  spinningReserve: number;
  capacityPayments: number;
  resourceAdequacy: number;
  totalRevenue: number;
}

export interface IncomeStatement {
  year: number;
  totalRevenue: number;
  omCosts: number;
  insurance: number;
  landLease: number;
  totalOpex: number;
  ebitda: number;
  depreciation: number;
  interestExpense: number;
  ebt: number; // Earnings Before Tax
  incomeTax: number;
  netIncome: number;
}

export interface CashFlowStatement {
  year: number;
  netIncome: number;
  addBackDepreciation: number;
  changeInWorkingCapital: number;
  capex: number;
  operatingCashFlow: number;
  debtDrawdown: number;
  principalRepayment: number;
  financingCashFlow: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  freeCashFlowToEquity: number;
  freeCashFlowToFirm: number;
}

export interface BalanceSheet {
  year: number;
  // Assets
  cash: number;
  propertyPlantEquipment: number;
  accumulatedDepreciation: number;
  netPPE: number;
  totalAssets: number;
  // Liabilities
  currentDebt: number;
  longTermDebt: number;
  totalLiabilities: number;
  // Equity
  commonEquity: number;
  retainedEarnings: number;
  totalEquity: number;
}

export interface DebtSchedule {
  year: number;
  beginningBalance: number;
  interestPayment: number;
  principalPayment: number;
  totalPayment: number;
  endingBalance: number;
  dscr: number; // Debt Service Coverage Ratio
}

export interface DepreciationSchedule {
  year: number;
  beginningBasis: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBasis: number;
}

export interface ProfessionalModelResult {
  // Executive Summary
  summary: {
    projectName: string;
    totalCapex: number;
    equityInvestment: number;
    debtAmount: number;
    totalAnnualRevenue: number;
    simplePayback: number;
    discountedPayback: number;
    unleveredIRR: number;
    leveredIRR: number;
    npv: number;
    averageDSCR: number;
    minimumDSCR: number;
    ebitdaYear1: number;
    moic: number; // Multiple on Invested Capital
    lcos: number; // Levelized Cost of Storage ($/MWh) - NREL/Sandia standard
    capacityFactorEffective: number; // Effective capacity factor after degradation
  };
  
  // Financial Statements
  revenueProjection: RevenueBreakdown[];
  incomeStatements: IncomeStatement[];
  cashFlowStatements: CashFlowStatement[];
  balanceSheets: BalanceSheet[];
  
  // Supporting Schedules
  debtSchedule: DebtSchedule[];
  depreciationSchedule: DepreciationSchedule[];
  
  // Key Metrics by Year
  keyMetrics: {
    year: number;
    revenue: number;
    ebitda: number;
    netIncome: number;
    freeCashFlow: number;
    dscr: number;
    debtBalance: number;
    cumulativeROI: number;
  }[];
  
  // Sensitivity Analysis
  sensitivityMatrix?: {
    parameter: string;
    values: number[];
    leveredIRRs: number[];
    npvs: number[];
    dscrs: number[];
  }[];
  
  // Meta
  assumptions: Record<string, any>;
  modelDate: Date;
  version: string;
}

// ============================================
// MACRS DEPRECIATION TABLES
// ============================================

// 5-Year MACRS Schedule for Energy Storage (IRS Publication 946)
const MACRS_5_YEAR = [0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576];

// 7-Year MACRS Schedule (alternative)
const MACRS_7_YEAR = [0.1429, 0.2449, 0.1749, 0.1249, 0.0893, 0.0892, 0.0893, 0.0446];

// ============================================
// REVENUE CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate energy arbitrage revenue
 * Based on price spread between peak and off-peak
 */
function calculateArbitrageRevenue(
  capacityMWh: number,
  efficiency: number,
  cyclesPerYear: number,
  avgPriceSpread: number, // $/MWh spread between peak and off-peak
  degradation: number,
  year: number
): number {
  const effectiveCapacity = capacityMWh * Math.pow(1 - degradation, year - 1);
  return effectiveCapacity * efficiency * cyclesPerYear * avgPriceSpread / 1000; // Convert to $
}

/**
 * Calculate demand charge reduction revenue
 */
function calculateDemandChargeReduction(
  powerMW: number,
  demandChargeRate: number, // $/kW-month
  reliabilityFactor: number = 0.85 // Probability of capturing peak
): number {
  return powerMW * 1000 * demandChargeRate * 12 * reliabilityFactor;
}

/**
 * Calculate frequency regulation revenue
 * Based on ISO market rates
 */
function calculateFrequencyRegulationRevenue(
  powerMW: number,
  isoRegion: string,
  hoursPerDay: number = 8 // Available hours for FR
): number {
  // Average FR capacity prices by ISO ($/MW-hour)
  const frRates: Record<string, number> = {
    'CAISO': 12,
    'ERCOT': 8,
    'PJM': 20,
    'NYISO': 18,
    'ISO-NE': 15,
    'MISO': 10,
    'SPP': 7,
    'OTHER': 10
  };
  
  const rate = frRates[isoRegion] || 10;
  return powerMW * rate * hoursPerDay * 365;
}

/**
 * Calculate spinning reserve revenue
 */
function calculateSpinningReserveRevenue(
  powerMW: number,
  isoRegion: string,
  hoursPerDay: number = 12
): number {
  // Average spinning reserve prices by ISO ($/MW-hour)
  const srRates: Record<string, number> = {
    'CAISO': 5,
    'ERCOT': 15, // ERCOT tends to have higher ancillary prices
    'PJM': 8,
    'NYISO': 7,
    'ISO-NE': 6,
    'MISO': 4,
    'SPP': 3,
    'OTHER': 5
  };
  
  const rate = srRates[isoRegion] || 5;
  return powerMW * rate * hoursPerDay * 365;
}

/**
 * Calculate capacity payment revenue
 * Based on ISO/utility capacity market rates
 */
function calculateCapacityPayments(
  powerMW: number,
  isoRegion: string
): number {
  // Capacity market rates ($/MW-year)
  const capacityRates: Record<string, number> = {
    'CAISO': 45000, // Resource Adequacy
    'ERCOT': 0, // No capacity market
    'PJM': 55000,
    'NYISO': 60000,
    'ISO-NE': 50000,
    'MISO': 20000,
    'SPP': 15000,
    'OTHER': 30000
  };
  
  const rate = capacityRates[isoRegion] || 30000;
  return powerMW * rate;
}

/**
 * Calculate resource adequacy payments (California specific)
 */
function calculateResourceAdequacy(
  powerMW: number,
  durationHours: number,
  location: string
): number {
  // RA payments typically $5-8/kW-month for 4-hour storage
  // Prorated for duration
  const baseRate = 6000; // $/MW-month for 4-hour
  const durationFactor = Math.min(durationHours / 4, 1); // Max value at 4 hours
  const isCA = location.toLowerCase().includes('california') || location.toLowerCase().includes('ca');
  
  return isCA ? powerMW * baseRate * 12 * durationFactor : 0;
}

// ============================================
// DEBT SERVICE CALCULATION
// ============================================

/**
 * Calculate annual debt payment (principal + interest)
 * Using standard amortization formula
 */
function calculateAnnualDebtPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (annualRate === 0) return principal / termYears;
  
  const monthlyRate = annualRate / 12;
  const numPayments = termYears * 12;
  
  // PMT formula
  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return monthlyPayment * 12;
}

/**
 * Build complete debt amortization schedule
 */
function buildDebtSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
  projectLifeYears: number,
  cashAvailableForDebtService: number[]
): DebtSchedule[] {
  const schedule: DebtSchedule[] = [];
  let balance = principal;
  
  for (let year = 1; year <= projectLifeYears; year++) {
    if (year <= termYears && balance > 0) {
      const interestPayment = balance * annualRate;
      const annualPayment = calculateAnnualDebtPayment(principal, annualRate, termYears);
      const principalPayment = Math.min(annualPayment - interestPayment, balance);
      const totalPayment = interestPayment + principalPayment;
      const endingBalance = Math.max(0, balance - principalPayment);
      
      // DSCR = Cash Available for Debt Service / Total Debt Service
      const cads = cashAvailableForDebtService[year - 1] || 0;
      const dscr = totalPayment > 0 ? cads / totalPayment : 999;
      
      schedule.push({
        year,
        beginningBalance: balance,
        interestPayment,
        principalPayment,
        totalPayment,
        endingBalance,
        dscr: Math.round(dscr * 100) / 100
      });
      
      balance = endingBalance;
    } else {
      schedule.push({
        year,
        beginningBalance: 0,
        interestPayment: 0,
        principalPayment: 0,
        totalPayment: 0,
        endingBalance: 0,
        dscr: 999
      });
    }
  }
  
  return schedule;
}

// ============================================
// DEPRECIATION CALCULATION
// ============================================

/**
 * Build MACRS depreciation schedule
 */
function buildDepreciationSchedule(
  capex: number,
  itcRate: number,
  projectLifeYears: number,
  use5Year: boolean = true
): DepreciationSchedule[] {
  // ITC reduces depreciable basis by 50% of ITC
  // (e.g., 30% ITC reduces basis by 15%)
  const basisReduction = itcRate * 0.5;
  const depreciableBasis = capex * (1 - basisReduction);
  
  const macrsRates = use5Year ? MACRS_5_YEAR : MACRS_7_YEAR;
  const schedule: DepreciationSchedule[] = [];
  let accumulatedDep = 0;
  
  for (let year = 1; year <= projectLifeYears; year++) {
    const yearIndex = year - 1;
    const macrsRate = yearIndex < macrsRates.length ? macrsRates[yearIndex] : 0;
    const depreciationExpense = depreciableBasis * macrsRate;
    accumulatedDep += depreciationExpense;
    
    schedule.push({
      year,
      beginningBasis: depreciableBasis - (accumulatedDep - depreciationExpense),
      depreciationExpense,
      accumulatedDepreciation: accumulatedDep,
      endingBasis: Math.max(0, depreciableBasis - accumulatedDep)
    });
  }
  
  return schedule;
}

// ============================================
// LCOS CALCULATION (NREL/Sandia Standard)
// ============================================

/**
 * Calculate Levelized Cost of Storage (LCOS)
 * 
 * Based on NREL SAM methodology and Sandia ESS guidelines
 * LCOS = (Total Lifetime Costs) / (Total Lifetime Energy Discharged)
 * 
 * Formula: LCOS = (CAPEX + NPV(OPEX) + NPV(Charging Costs)) / NPV(Energy Discharged)
 * 
 * Reference: https://sam.nrel.gov/battery-storage.html
 * Reference: Sandia SAND2020-0830 ESS Financial Model
 */
function calculateLCOS(
  capex: number,
  annualOpex: number,
  chargingCostPerMWh: number,
  capacityMWh: number,
  cyclesPerYear: number,
  efficiency: number,
  degradationRate: number,
  projectLifeYears: number,
  discountRate: number
): number {
  let npvOpex = 0;
  let npvChargingCosts = 0;
  let npvEnergyDischarged = 0;
  
  for (let year = 1; year <= projectLifeYears; year++) {
    const discountFactor = Math.pow(1 + discountRate, year);
    const capacityRetention = Math.pow(1 - degradationRate, year - 1);
    
    // Effective capacity after degradation
    const effectiveCapacity = capacityMWh * capacityRetention;
    
    // Annual energy discharged (MWh)
    const annualDischarge = effectiveCapacity * cyclesPerYear;
    
    // Charging energy needed (accounting for round-trip efficiency)
    const chargingEnergy = annualDischarge / efficiency;
    
    // NPV of OPEX (escalates at 2.5%/year)
    const escalatedOpex = annualOpex * Math.pow(1.025, year - 1);
    npvOpex += escalatedOpex / discountFactor;
    
    // NPV of charging costs
    const chargingCost = chargingEnergy * chargingCostPerMWh;
    npvChargingCosts += chargingCost / discountFactor;
    
    // NPV of energy discharged
    npvEnergyDischarged += annualDischarge / discountFactor;
  }
  
  // LCOS ($/MWh)
  const lcos = (capex + npvOpex + npvChargingCosts) / npvEnergyDischarged;
  
  return Math.round(lcos * 100) / 100;
}

/**
 * Calculate effective capacity factor over project life
 * Accounts for degradation and cycling patterns
 */
function calculateEffectiveCapacityFactor(
  cyclesPerYear: number,
  degradationRate: number,
  projectLifeYears: number,
  maxCyclesPerYear: number = 365
): number {
  let totalCycles = 0;
  let maxPossibleCycles = 0;
  
  for (let year = 1; year <= projectLifeYears; year++) {
    const capacityRetention = Math.pow(1 - degradationRate, year - 1);
    totalCycles += cyclesPerYear * capacityRetention;
    maxPossibleCycles += maxCyclesPerYear;
  }
  
  return Math.round((totalCycles / maxPossibleCycles) * 10000) / 100;
}

// ============================================
// IRR CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate IRR using Newton-Raphson method
 */
function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
  const maxIterations = 100;
  const tolerance = 0.0001;
  let rate = guess;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;
    
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      if (t > 0) {
        derivative -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
      }
    }
    
    if (Math.abs(derivative) < 1e-10) break;
    
    const newRate = rate - npv / derivative;
    
    if (Math.abs(newRate - rate) < tolerance) {
      return Math.round(newRate * 10000) / 100; // Return as percentage
    }
    
    rate = newRate;
  }
  
  return Math.round(rate * 10000) / 100;
}

/**
 * Calculate NPV
 */
function calculateNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((npv, cf, t) => {
    return npv + cf / Math.pow(1 + discountRate, t);
  }, 0);
}

// ============================================
// MAIN MODEL FUNCTION
// ============================================

/**
 * Generate Complete Professional Financial Model
 * 
 * This produces bank/investor-ready financial projections including:
 * - 3-Statement Model
 * - DSCR Analysis
 * - Levered/Unlevered IRR
 * - Revenue Stacking
 */
export async function generateProfessionalModel(
  input: ProfessionalModelInput
): Promise<ProfessionalModelResult> {
  
  console.log('📊 [ProfessionalFinancialModel] Generating bank-ready model...');
  
  // Apply defaults
  const config = {
    projectLifeYears: input.projectLifeYears ?? 25,
    constructionPeriodMonths: input.constructionPeriodMonths ?? 12,
    debtEquityRatio: input.debtEquityRatio ?? 0.7,
    interestRate: input.interestRate ?? 0.06,
    loanTermYears: input.loanTermYears ?? 15,
    federalTaxRate: input.federalTaxRate ?? 0.21,
    stateTaxRate: input.stateTaxRate ?? 0.08,
    itcRate: input.itcRate ?? 0.30,
    useMACRS: input.useMACRS ?? true,
    annualDegradation: input.annualDegradation ?? 0.02,
    omCostPerKWhYear: input.omCostPerKWhYear ?? 5,
    insurancePercentCapex: input.insurancePercentCapex ?? 0.005,
    landLeaseAnnual: input.landLeaseAnnual ?? 0,
    revenueEscalation: input.revenueEscalation ?? 0.02,
    omEscalation: input.omEscalation ?? 0.025,
    isoRegion: input.isoRegion ?? 'OTHER',
    demandChargeRate: input.demandChargeRate ?? 15, // $/kW-month
  };
  
  const combinedTaxRate = config.federalTaxRate + config.stateTaxRate * (1 - config.federalTaxRate);
  
  // Get equipment costs from unified quote calculator
  const quote = await calculateQuote({
    storageSizeMW: input.storageSizeMW,
    durationHours: input.durationHours,
    solarMW: input.solarMW,
    windMW: input.windMW,
    location: input.location,
    electricityRate: input.electricityRate
  });
  
  const totalCapex = quote.costs.totalProjectCost;
  const capacityMWh = input.storageSizeMW * input.durationHours;
  const capacityKWh = capacityMWh * 1000;
  
  // Calculate ITC benefit
  const itcBenefit = totalCapex * config.itcRate;
  
  // Capital structure
  const debtAmount = totalCapex * config.debtEquityRatio;
  const equityAmount = totalCapex * (1 - config.debtEquityRatio);
  
  console.log(`💰 Total CAPEX: $${(totalCapex / 1000000).toFixed(2)}M`);
  console.log(`💵 Debt: $${(debtAmount / 1000000).toFixed(2)}M | Equity: $${(equityAmount / 1000000).toFixed(2)}M`);
  
  // Get battery efficiency
  const constants = await getCalculationConstants();
  const efficiency = constants.ROUND_TRIP_EFFICIENCY;
  const annualCycles = constants.ANNUAL_CYCLES;
  
  // ==========================================
  // BUILD REVENUE PROJECTION
  // ==========================================
  
  const revenueProjection: RevenueBreakdown[] = [];
  
  for (let year = 1; year <= config.projectLifeYears; year++) {
    const escalationFactor = Math.pow(1 + config.revenueEscalation, year - 1);
    const degradationFactor = Math.pow(1 - config.annualDegradation, year - 1);
    
    // Price spread for arbitrage (assume $30/MWh average spread)
    const avgPriceSpread = 30 * escalationFactor;
    
    let arbitrage = 0;
    let demandCharge = 0;
    let frequencyReg = 0;
    let spinningReserve = 0;
    let capacity = 0;
    let ra = 0;
    
    if (input.revenueStreams.energyArbitrage) {
      arbitrage = calculateArbitrageRevenue(
        capacityMWh, efficiency, annualCycles * 0.8, avgPriceSpread, config.annualDegradation, year
      );
    }
    
    if (input.revenueStreams.demandChargeReduction) {
      demandCharge = calculateDemandChargeReduction(
        input.storageSizeMW * degradationFactor,
        config.demandChargeRate
      ) * escalationFactor;
    }
    
    if (input.revenueStreams.frequencyRegulation) {
      frequencyReg = calculateFrequencyRegulationRevenue(
        input.storageSizeMW * degradationFactor,
        config.isoRegion,
        6 // Available 6 hours/day for FR
      ) * escalationFactor;
    }
    
    if (input.revenueStreams.spinningReserve) {
      spinningReserve = calculateSpinningReserveRevenue(
        input.storageSizeMW * degradationFactor,
        config.isoRegion,
        8
      ) * escalationFactor;
    }
    
    if (input.revenueStreams.capacityPayments) {
      capacity = calculateCapacityPayments(
        input.storageSizeMW * degradationFactor,
        config.isoRegion
      ) * escalationFactor;
    }
    
    if (input.revenueStreams.resourceAdequacy) {
      ra = calculateResourceAdequacy(
        input.storageSizeMW * degradationFactor,
        input.durationHours,
        input.location
      ) * escalationFactor;
    }
    
    revenueProjection.push({
      year,
      energyArbitrage: Math.round(arbitrage),
      demandChargeReduction: Math.round(demandCharge),
      frequencyRegulation: Math.round(frequencyReg),
      spinningReserve: Math.round(spinningReserve),
      capacityPayments: Math.round(capacity),
      resourceAdequacy: Math.round(ra),
      totalRevenue: Math.round(arbitrage + demandCharge + frequencyReg + spinningReserve + capacity + ra)
    });
  }
  
  // ==========================================
  // BUILD DEPRECIATION SCHEDULE
  // ==========================================
  
  const depreciationSchedule = buildDepreciationSchedule(
    totalCapex,
    config.itcRate,
    config.projectLifeYears,
    config.useMACRS
  );
  
  // ==========================================
  // BUILD INCOME STATEMENTS
  // ==========================================
  
  const incomeStatements: IncomeStatement[] = [];
  const cashAvailableForDebtService: number[] = [];
  
  for (let year = 1; year <= config.projectLifeYears; year++) {
    const revenue = revenueProjection[year - 1].totalRevenue;
    const omEscalation = Math.pow(1 + config.omEscalation, year - 1);
    
    const omCosts = capacityKWh * config.omCostPerKWhYear * omEscalation;
    const insurance = totalCapex * config.insurancePercentCapex * omEscalation;
    const landLease = config.landLeaseAnnual * omEscalation;
    const totalOpex = omCosts + insurance + landLease;
    
    const ebitda = revenue - totalOpex;
    const depreciation = depreciationSchedule[year - 1].depreciationExpense;
    
    // Interest will be calculated after debt schedule
    // For now, estimate
    const estimatedInterest = year <= config.loanTermYears 
      ? debtAmount * config.interestRate * (1 - (year - 1) / config.loanTermYears) 
      : 0;
    
    const ebit = ebitda - depreciation;
    const ebt = ebit - estimatedInterest;
    const incomeTax = ebt > 0 ? ebt * combinedTaxRate : 0;
    const netIncome = ebt - incomeTax;
    
    // CADS = EBITDA - Taxes (cash taxes, not accounting taxes)
    // Simplified: EBITDA - (EBITDA - Depreciation - Interest) * TaxRate
    const cashTaxes = Math.max(0, (ebitda - depreciation - estimatedInterest) * combinedTaxRate);
    cashAvailableForDebtService.push(ebitda - cashTaxes);
    
    incomeStatements.push({
      year,
      totalRevenue: Math.round(revenue),
      omCosts: Math.round(omCosts),
      insurance: Math.round(insurance),
      landLease: Math.round(landLease),
      totalOpex: Math.round(totalOpex),
      ebitda: Math.round(ebitda),
      depreciation: Math.round(depreciation),
      interestExpense: Math.round(estimatedInterest),
      ebt: Math.round(ebt),
      incomeTax: Math.round(incomeTax),
      netIncome: Math.round(netIncome)
    });
  }
  
  // ==========================================
  // BUILD DEBT SCHEDULE
  // ==========================================
  
  const debtSchedule = buildDebtSchedule(
    debtAmount,
    config.interestRate,
    config.loanTermYears,
    config.projectLifeYears,
    cashAvailableForDebtService
  );
  
  // Update income statements with actual interest
  for (let year = 1; year <= config.projectLifeYears; year++) {
    const interest = debtSchedule[year - 1].interestPayment;
    const is = incomeStatements[year - 1];
    is.interestExpense = Math.round(interest);
    is.ebt = is.ebitda - is.depreciation - interest;
    is.incomeTax = is.ebt > 0 ? Math.round(is.ebt * combinedTaxRate) : 0;
    is.netIncome = Math.round(is.ebt - is.incomeTax);
  }
  
  // ==========================================
  // BUILD CASH FLOW STATEMENTS
  // ==========================================
  
  const cashFlowStatements: CashFlowStatement[] = [];
  let cumulativeCash = -equityAmount; // Initial equity investment
  const unleveredCashFlows: number[] = [-totalCapex + itcBenefit]; // Year 0
  const leveredCashFlows: number[] = [-equityAmount + itcBenefit]; // Year 0
  
  for (let year = 1; year <= config.projectLifeYears; year++) {
    const is = incomeStatements[year - 1];
    const ds = debtSchedule[year - 1];
    
    const addBackDepreciation = is.depreciation;
    const operatingCashFlow = is.netIncome + addBackDepreciation;
    
    const capex = year === 1 ? 0 : 0; // All CAPEX in Year 0
    const debtDrawdown = 0; // All debt drawn at closing
    const principalRepayment = ds.principalPayment;
    const financingCashFlow = debtDrawdown - principalRepayment;
    
    const netCashFlow = operatingCashFlow + financingCashFlow - capex;
    cumulativeCash += netCashFlow;
    
    // Free Cash Flow to Firm (FCFF) = EBITDA - Taxes - CapEx - Change in WC
    const fcff = is.ebitda - is.incomeTax;
    
    // Free Cash Flow to Equity (FCFE) = Net Income + Depreciation - Principal
    const fcfe = is.netIncome + addBackDepreciation - principalRepayment;
    
    cashFlowStatements.push({
      year,
      netIncome: Math.round(is.netIncome),
      addBackDepreciation: Math.round(addBackDepreciation),
      changeInWorkingCapital: 0,
      capex: 0,
      operatingCashFlow: Math.round(operatingCashFlow),
      debtDrawdown: 0,
      principalRepayment: Math.round(principalRepayment),
      financingCashFlow: Math.round(financingCashFlow),
      netCashFlow: Math.round(netCashFlow),
      cumulativeCashFlow: Math.round(cumulativeCash),
      freeCashFlowToEquity: Math.round(fcfe),
      freeCashFlowToFirm: Math.round(fcff)
    });
    
    unleveredCashFlows.push(fcff);
    leveredCashFlows.push(fcfe);
  }
  
  // ==========================================
  // BUILD BALANCE SHEETS
  // ==========================================
  
  const balanceSheets: BalanceSheet[] = [];
  let retainedEarnings = 0;
  
  for (let year = 1; year <= config.projectLifeYears; year++) {
    const is = incomeStatements[year - 1];
    const ds = debtSchedule[year - 1];
    const deps = depreciationSchedule[year - 1];
    const cf = cashFlowStatements[year - 1];
    
    retainedEarnings += is.netIncome;
    
    balanceSheets.push({
      year,
      cash: cf.cumulativeCashFlow + equityAmount, // Add back initial investment for balance
      propertyPlantEquipment: totalCapex,
      accumulatedDepreciation: deps.accumulatedDepreciation,
      netPPE: totalCapex - deps.accumulatedDepreciation,
      totalAssets: Math.round(cf.cumulativeCashFlow + equityAmount + totalCapex - deps.accumulatedDepreciation),
      currentDebt: year < config.loanTermYears ? Math.round(ds.principalPayment * 1.0) : 0,
      longTermDebt: Math.round(ds.endingBalance),
      totalLiabilities: Math.round(ds.endingBalance),
      commonEquity: Math.round(equityAmount),
      retainedEarnings: Math.round(retainedEarnings),
      totalEquity: Math.round(equityAmount + retainedEarnings)
    });
  }
  
  // ==========================================
  // CALCULATE SUMMARY METRICS
  // ==========================================
  
  // IRR calculations
  const unleveredIRR = calculateIRR(unleveredCashFlows);
  const leveredIRR = calculateIRR(leveredCashFlows);
  
  // NPV at 8% discount rate
  const npv = calculateNPV(unleveredCashFlows, 0.08);
  
  // DSCR metrics
  const dscrValues = debtSchedule
    .filter(d => d.year <= config.loanTermYears)
    .map(d => d.dscr)
    .filter(d => d < 100); // Filter out 999 placeholders
  
  const avgDSCR = dscrValues.length > 0 
    ? dscrValues.reduce((a, b) => a + b, 0) / dscrValues.length 
    : 0;
  const minDSCR = dscrValues.length > 0 
    ? Math.min(...dscrValues) 
    : 0;
  
  // Simple and discounted payback
  let simplePayback = config.projectLifeYears;
  let cumulativeUnlevered = -totalCapex + itcBenefit;
  for (let i = 1; i < unleveredCashFlows.length; i++) {
    cumulativeUnlevered += unleveredCashFlows[i];
    if (cumulativeUnlevered >= 0) {
      simplePayback = i - (cumulativeUnlevered / unleveredCashFlows[i]);
      break;
    }
  }
  
  let discountedPayback = config.projectLifeYears;
  let cumulativeDiscounted = -totalCapex + itcBenefit;
  for (let i = 1; i < unleveredCashFlows.length; i++) {
    const discountedCF = unleveredCashFlows[i] / Math.pow(1.08, i);
    cumulativeDiscounted += discountedCF;
    if (cumulativeDiscounted >= 0) {
      discountedPayback = i - (cumulativeDiscounted / discountedCF);
      break;
    }
  }
  
  // MOIC (Multiple on Invested Capital)
  const totalEquityReturns = leveredCashFlows.reduce((sum, cf) => sum + Math.max(0, cf), 0);
  const moic = equityAmount > 0 ? totalEquityReturns / equityAmount : 0;
  
  // ==========================================
  // CALCULATE LCOS (Levelized Cost of Storage)
  // ==========================================
  
  // Estimate charging cost (off-peak electricity rate)
  const chargingCostPerMWh = input.electricityRate * 0.6 * 1000; // 60% of retail rate, convert to $/MWh
  const annualOpex = capacityKWh * config.omCostPerKWhYear + totalCapex * config.insurancePercentCapex;
  
  const lcos = calculateLCOS(
    totalCapex,
    annualOpex,
    chargingCostPerMWh,
    capacityMWh,
    annualCycles * 0.8, // 80% effective cycling
    efficiency,
    config.annualDegradation,
    config.projectLifeYears,
    0.08 // 8% discount rate
  );
  
  const capacityFactorEffective = calculateEffectiveCapacityFactor(
    annualCycles * 0.8,
    config.annualDegradation,
    config.projectLifeYears
  );
  
  // ==========================================
  // BUILD KEY METRICS TABLE
  // ==========================================
  
  const keyMetrics = revenueProjection.map((rev, idx) => ({
    year: rev.year,
    revenue: rev.totalRevenue,
    ebitda: incomeStatements[idx].ebitda,
    netIncome: incomeStatements[idx].netIncome,
    freeCashFlow: cashFlowStatements[idx].freeCashFlowToFirm,
    dscr: debtSchedule[idx].dscr,
    debtBalance: debtSchedule[idx].endingBalance,
    cumulativeROI: Math.round(((cashFlowStatements[idx].cumulativeCashFlow + equityAmount) / equityAmount - 1) * 100)
  }));
  
  console.log('✅ [ProfessionalFinancialModel] Model complete');
  console.log(`📈 Unlevered IRR: ${unleveredIRR.toFixed(1)}% | Levered IRR: ${leveredIRR.toFixed(1)}%`);
  console.log(`📊 NPV: $${(npv / 1000000).toFixed(2)}M | Min DSCR: ${minDSCR.toFixed(2)}x | LCOS: $${lcos}/MWh`);
  
  return {
    summary: {
      projectName: `${input.storageSizeMW} MW / ${input.durationHours}h BESS - ${input.location}`,
      totalCapex: Math.round(totalCapex),
      equityInvestment: Math.round(equityAmount),
      debtAmount: Math.round(debtAmount),
      totalAnnualRevenue: revenueProjection[0].totalRevenue,
      simplePayback: Math.round(simplePayback * 10) / 10,
      discountedPayback: Math.round(discountedPayback * 10) / 10,
      unleveredIRR,
      leveredIRR,
      npv: Math.round(npv),
      averageDSCR: Math.round(avgDSCR * 100) / 100,
      minimumDSCR: Math.round(minDSCR * 100) / 100,
      ebitdaYear1: incomeStatements[0].ebitda,
      moic: Math.round(moic * 100) / 100,
      lcos, // NREL/Sandia standard metric
      capacityFactorEffective
    },
    revenueProjection,
    incomeStatements,
    cashFlowStatements,
    balanceSheets,
    debtSchedule,
    depreciationSchedule,
    keyMetrics,
    assumptions: {
      ...config,
      systemSize: `${input.storageSizeMW} MW / ${input.durationHours}h`,
      totalCapacityMWh: capacityMWh,
      roundTripEfficiency: efficiency,
      annualCycles,
      combinedTaxRate,
      revenueStreams: input.revenueStreams
    },
    modelDate: new Date(),
    version: '1.0.0'
  };
}

// ============================================
// SENSITIVITY ANALYSIS FOR PRO MODEL
// ============================================

/**
 * Generate sensitivity matrix for professional model
 */
export async function generateSensitivityMatrix(
  baseInput: ProfessionalModelInput,
  parameters: ('electricityRate' | 'capex' | 'interestRate' | 'degradation')[]
): Promise<{
  parameter: string;
  values: number[];
  leveredIRRs: number[];
  npvs: number[];
  minDSCRs: number[];
}[]> {
  const results = [];
  
  for (const param of parameters) {
    const variations = [-0.2, -0.1, 0, 0.1, 0.2]; // ±20%
    const values: number[] = [];
    const leveredIRRs: number[] = [];
    const npvs: number[] = [];
    const minDSCRs: number[] = [];
    
    for (const variation of variations) {
      const modifiedInput = { ...baseInput };
      
      switch (param) {
        case 'electricityRate':
          modifiedInput.electricityRate *= (1 + variation);
          values.push(modifiedInput.electricityRate);
          break;
        case 'interestRate':
          modifiedInput.interestRate = (modifiedInput.interestRate ?? 0.06) * (1 + variation);
          values.push(modifiedInput.interestRate ?? 0.06);
          break;
        case 'degradation':
          modifiedInput.annualDegradation = (modifiedInput.annualDegradation ?? 0.02) * (1 + variation);
          values.push(modifiedInput.annualDegradation ?? 0.02);
          break;
      }
      
      const model = await generateProfessionalModel(modifiedInput);
      leveredIRRs.push(model.summary.leveredIRR);
      npvs.push(model.summary.npv);
      minDSCRs.push(model.summary.minimumDSCR);
    }
    
    results.push({
      parameter: param,
      values,
      leveredIRRs,
      npvs,
      minDSCRs
    });
  }
  
  return results;
}

// ============================================
// QUICK ESTIMATES FOR UI
// ============================================

/**
 * Quick DSCR estimate for UI (without full model generation)
 */
export function estimateDSCR(
  annualRevenue: number,
  annualOpex: number,
  debtAmount: number,
  interestRate: number,
  loanTermYears: number
): number {
  const ebitda = annualRevenue - annualOpex;
  const annualDebtService = calculateAnnualDebtPayment(debtAmount, interestRate, loanTermYears);
  return annualDebtService > 0 ? ebitda / annualDebtService : 999;
}

/**
 * Quick Levered IRR estimate
 */
export function estimateLeveredIRR(
  equityInvestment: number,
  annualCashFlow: number,
  projectLifeYears: number
): number {
  // Simplified: assumes constant annual cash flow
  const cashFlows = [-equityInvestment, ...Array(projectLifeYears).fill(annualCashFlow)];
  return calculateIRR(cashFlows);
}

// ============================================
// EXPORT
// ============================================

export default {
  generateProfessionalModel,
  generateSensitivityMatrix,
  estimateDSCR,
  estimateLeveredIRR
};
