/**
 * Pricing Service v4.5 - Centralized Cost Logic
 * ==============================================
 *
 * Single source of truth for all equipment costs based on Step 5 v4.5 validated architecture.
 *
 * Key Changes from v4.0:
 * - Fixed inverter double-counting ($0.19/W deducted from solar)
 * - Added site engineering & construction costs ($25,800 baseline)
 * - Added 7.5% construction contingency
 * - Added annual operating reserves (insurance, inverter, BESS degradation)
 * - Implemented tiered margin structure (20% → 14% → 13%)
 * - Honest financial projections (4.5yr payback vs fabricated 4.0yr)
 *
 * Data Sources:
 * - NREL ATB 2024/2025 (battery, solar, wind)
 * - Industry benchmarks (generator, EV charging, site work)
 * - Government APIs (merlinDataService.js)
 *
 * Version: 4.5.0
 * Date: March 19, 2026
 * Author: Merlin Energy Systems
 */

// ============================================================================
// EQUIPMENT UNIT PRICING ($/unit)
// ============================================================================

export const EQUIPMENT_UNIT_COSTS = {
  // Solar PV - Net cost after inverter deduction
  solar: {
    pricePerWatt: 1.51, // $/W net (inverter cost removed: $1.70/W - $0.19/W)
    inverterDeduction: 0.19, // $/W (inverter now in BESS hybrid system)
    grossPricePerWatt: 1.7, // $/W gross before inverter deduction
    source: "NREL ATB 2024",
    notes: "Modules, racking, BOS wiring, installation labor, basic permits. Inverter EXCLUDED.",
  },

  // Battery Energy Storage System (BESS)
  bess: {
    pricePerKWh: 350, // $/kWh installed (LFP chemistry)
    pricePerKW: 150, // $/kW for hybrid inverter (handles solar+battery+EV)
    source: "NREL ATB 2024, BloombergNEF",
    notes: "Includes hybrid inverter, BMS, thermal management, enclosure, installation",
  },

  // Backup Generator
  generator: {
    pricePerKW: 690, // $/kW for diesel/natural gas genset
    fuelTankCost: 15000, // 24-48 hour runtime tank
    transferSwitchCost: 8000, // Automatic transfer switch
    source: "Industry benchmarks 2024",
    notes: "Industrial-grade genset with ATS and fuel storage",
  },

  // EV Charging Infrastructure
  evCharging: {
    level2: 7000, // $/unit for 7.2kW Level 2 charger
    dcfc: 50000, // $/unit for 50kW DC Fast Charger
    hpc: 150000, // $/unit for 350kW High Power Charger
    source: "DOE Alternative Fuels Data Center",
    notes: "Includes equipment, installation, electrical service upgrades",
  },
} as const;

// ============================================================================
// SITE WORK & SOFT COSTS
// ============================================================================

export const SITE_WORK_COSTS = {
  structuralEngineering: 3500,
  monitoringHardware: 4000,
  interconnectionStudy: 2500,
  concretePad: 5000, // For BESS + generator
  trenchingConduit: 5000,
  commissioning: 3500,
  asBuiltDrawings: 1500,
  necSignage: 800,

  // Total baseline site work
  get total(): number {
    return (
      this.structuralEngineering +
      this.monitoringHardware +
      this.interconnectionStudy +
      this.concretePad +
      this.trenchingConduit +
      this.commissioning +
      this.asBuiltDrawings +
      this.necSignage
    );
  },
} as const;

export const CONSTRUCTION_CONTINGENCY_RATE = 0.075; // 7.5% industry standard

// ============================================================================
// ANNUAL OPERATING RESERVES (Honest TCO)
// ============================================================================

export const ANNUAL_RESERVES = {
  insuranceRider: 1250, // $/year for property insurance rider
  inverterReplacementReserve: (solarKW: number) => solarKW * 1000 * 0.01, // $0.01/W/yr
  bessLegradationReserve: 500, // $/year for capacity fade accounting

  // Calculate total annual reserves
  total: (solarKW: number): number => {
    return (
      ANNUAL_RESERVES.insuranceRider +
      ANNUAL_RESERVES.inverterReplacementReserve(solarKW) +
      ANNUAL_RESERVES.bessLegradationReserve
    );
  },
} as const;

// ============================================================================
// MERLIN AI SERVICES - TIERED MARGIN STRUCTURE
// ============================================================================

/**
 * Calculate Merlin service fees based on equipment subtotal
 * Implements tiered margin: 20% (small) → 14% (medium) → 13% (large)
 */
export function calculateMerlinFees(equipmentSubtotal: number): {
  designIntelligence: number;
  procurementSourcing: number;
  pmConstruction: number;
  incentiveFiling: number;
  totalFee: number;
  annualMonitoring: number;
  effectiveMargin: number;
} {
  // Determine margin tier based on project size
  let marginRate: number;
  if (equipmentSubtotal < 200000) {
    marginRate = 0.2; // 20% for small projects (<$200K)
  } else if (equipmentSubtotal < 800000) {
    marginRate = 0.14; // 14% for medium projects ($200K-$800K)
  } else {
    marginRate = 0.13; // 13% for large projects (>$800K)
  }

  const totalFee = equipmentSubtotal * marginRate;

  // Breakdown of fees (approximate distribution)
  const designIntelligence = totalFee * 0.14; // ~14% of total fee
  const procurementSourcing = totalFee * 0.65; // ~65% of total fee (largest component)
  const pmConstruction = totalFee * 0.16; // ~16% of total fee
  const incentiveFiling = totalFee * 0.05; // ~5% of total fee

  return {
    designIntelligence: Math.round(designIntelligence),
    procurementSourcing: Math.round(procurementSourcing),
    pmConstruction: Math.round(pmConstruction),
    incentiveFiling: Math.round(incentiveFiling),
    totalFee: Math.round(totalFee),
    annualMonitoring: 580, // Fixed annual monitoring fee
    effectiveMargin: marginRate,
  };
}

// ============================================================================
// FINANCIAL CALCULATIONS
// ============================================================================

export const FEDERAL_ITC_RATE = 0.3; // 30% Investment Tax Credit (IRA 2022)

/**
 * Calculate Federal ITC for equipment
 */
export function calculateFederalITC(costs: {
  solar?: number;
  bess?: number;
  generator?: number;
  evCharging?: number;
}): number {
  // ITC applies to solar and BESS (standalone storage qualifies as of IRA 2022)
  const itcEligible = (costs.solar || 0) + (costs.bess || 0);
  return itcEligible * FEDERAL_ITC_RATE;
}

/**
 * Calculate construction contingency (7.5% of hard costs)
 */
export function calculateConstructionContingency(hardCosts: number): number {
  return hardCosts * CONSTRUCTION_CONTINGENCY_RATE;
}

// ============================================================================
// COMPLETE COST CALCULATION
// ============================================================================

export interface EquipmentConfig {
  solarKW?: number;
  bessKW?: number;
  bessKWh?: number;
  generatorKW?: number;
  level2Chargers?: number;
  dcfcChargers?: number;
  hpcChargers?: number;
}

export interface CostBreakdown {
  // Equipment costs
  solarCost: number;
  bessCost: number;
  generatorCost: number;
  evChargingCost: number;
  equipmentSubtotal: number;

  // Site work & soft costs
  siteEngineering: number;
  constructionContingency: number;

  // Subtotal before Merlin fees
  subtotalBeforeMerlin: number;

  // Merlin AI services
  merlinFees: ReturnType<typeof calculateMerlinFees>;

  // Total investment
  totalInvestment: number;

  // Incentives
  federalITC: number;
  netInvestment: number;

  // Annual operating reserves
  annualReserves: number;
}

/**
 * Calculate complete cost breakdown with v4.5 validated logic
 */
export function calculateSystemCosts(config: EquipmentConfig): CostBreakdown {
  // Validation: check for negative values
  if (
    (config.solarKW || 0) < 0 ||
    (config.bessKW || 0) < 0 ||
    (config.bessKWh || 0) < 0 ||
    (config.generatorKW || 0) < 0 ||
    (config.level2Chargers || 0) < 0 ||
    (config.dcfcChargers || 0) < 0 ||
    (config.hpcChargers || 0) < 0
  ) {
    throw new Error("Equipment quantities cannot be negative");
  }

  // Equipment costs
  const solarCost = (config.solarKW || 0) * EQUIPMENT_UNIT_COSTS.solar.pricePerWatt * 1000;

  const bessCost =
    (config.bessKWh || 0) * EQUIPMENT_UNIT_COSTS.bess.pricePerKWh +
    (config.bessKW || 0) * EQUIPMENT_UNIT_COSTS.bess.pricePerKW;

  const generatorCost =
    (config.generatorKW || 0) * EQUIPMENT_UNIT_COSTS.generator.pricePerKW +
    (config.generatorKW ? EQUIPMENT_UNIT_COSTS.generator.fuelTankCost : 0) +
    (config.generatorKW ? EQUIPMENT_UNIT_COSTS.generator.transferSwitchCost : 0);

  const evChargingCost =
    (config.level2Chargers || 0) * EQUIPMENT_UNIT_COSTS.evCharging.level2 +
    (config.dcfcChargers || 0) * EQUIPMENT_UNIT_COSTS.evCharging.dcfc +
    (config.hpcChargers || 0) * EQUIPMENT_UNIT_COSTS.evCharging.hpc;

  const equipmentSubtotal = solarCost + bessCost + generatorCost + evChargingCost;

  // Site work
  const siteEngineering = SITE_WORK_COSTS.total;

  // Construction contingency (7.5% of equipment + site work)
  const constructionContingency = calculateConstructionContingency(
    equipmentSubtotal + siteEngineering
  );

  const subtotalBeforeMerlin = equipmentSubtotal + siteEngineering + constructionContingency;

  // Merlin AI services (tiered margin)
  const merlinFees = calculateMerlinFees(equipmentSubtotal);

  // Total investment
  const totalInvestment = subtotalBeforeMerlin + merlinFees.totalFee;

  // Federal ITC
  const federalITC = calculateFederalITC({
    solar: solarCost,
    bess: bessCost,
  });

  const netInvestment = totalInvestment - federalITC;

  // Annual operating reserves
  const annualReserves = ANNUAL_RESERVES.total(config.solarKW || 0);

  return {
    solarCost: Math.round(solarCost),
    bessCost: Math.round(bessCost),
    generatorCost: Math.round(generatorCost),
    evChargingCost: Math.round(evChargingCost),
    equipmentSubtotal: Math.round(equipmentSubtotal),
    siteEngineering: Math.round(siteEngineering),
    constructionContingency: Math.round(constructionContingency),
    subtotalBeforeMerlin: Math.round(subtotalBeforeMerlin),
    merlinFees,
    totalInvestment: Math.round(totalInvestment),
    federalITC: Math.round(federalITC),
    netInvestment: Math.round(netInvestment),
    annualReserves: Math.round(annualReserves),
  };
}

// ============================================================================
// SAVINGS CALCULATIONS (Honest projections)
// ============================================================================

export interface SavingsInputs {
  // Equipment configuration
  bessKW: number;
  bessKWh: number;
  solarKW: number;
  generatorKW: number;
  evChargers: number;

  // Utility rates
  electricityRate: number; // $/kWh
  demandCharge: number; // $/kW
  peakRate?: number; // $/kWh for TOU arbitrage
  hasTOU?: boolean;

  // Operating parameters
  sunHoursPerDay?: number; // Average for location
  cyclesPerYear?: number; // Battery cycles
}

export interface SavingsBreakdown {
  // Annual savings by source
  demandChargeSavings: number;
  touArbitrageSavings: number;
  solarSavings: number;
  evChargingRevenue: number;
  generatorBackupValue: number;
  grossAnnualSavings: number;

  // Annual costs/reserves
  annualReserves: number;
  netAnnualSavings: number;
}

/**
 * Calculate annual savings with honest reserves deduction
 */
export function calculateAnnualSavings(inputs: SavingsInputs, solarKW: number): SavingsBreakdown {
  // BESS Demand Charge Savings
  // Assume 30% reduction of demand charges
  const demandChargeSavings = inputs.bessKW * inputs.demandCharge * 12 * 0.3;

  // BESS TOU Arbitrage (if applicable)
  let touArbitrageSavings = 0;
  if (inputs.hasTOU && inputs.peakRate) {
    const spread = inputs.peakRate - inputs.electricityRate;
    const cyclesPerYear = inputs.cyclesPerYear || 250;
    const dod = 0.8; // Depth of discharge
    touArbitrageSavings = inputs.bessKWh * dod * spread * cyclesPerYear;
  }

  // Solar Savings
  const sunHoursPerDay = inputs.sunHoursPerDay || 5;
  const productionDaysPerYear = 300; // Account for weather
  const systemEfficiency = 0.85; // Inverter losses, soiling, etc.
  const solarKWhProduced =
    inputs.solarKW * sunHoursPerDay * productionDaysPerYear * systemEfficiency;
  const solarSavings = solarKWhProduced * inputs.electricityRate;

  // EV Charging Revenue (if applicable)
  // Assume $8/session average, 2 sessions/charger/day, 300 days/year
  const evChargingRevenue = inputs.evChargers * 8 * 2 * 300;

  // Generator Backup Value (avoided downtime costs)
  // This is harder to quantify, typically not included in simple ROI
  const generatorBackupValue = 0;

  const grossAnnualSavings =
    demandChargeSavings +
    touArbitrageSavings +
    solarSavings +
    evChargingRevenue +
    generatorBackupValue;

  // Deduct annual operating reserves for honest TCO
  const annualReserves = ANNUAL_RESERVES.total(solarKW);
  const netAnnualSavings = grossAnnualSavings - annualReserves;

  return {
    demandChargeSavings: Math.round(demandChargeSavings),
    touArbitrageSavings: Math.round(touArbitrageSavings),
    solarSavings: Math.round(solarSavings),
    evChargingRevenue: Math.round(evChargingRevenue),
    generatorBackupValue: Math.round(generatorBackupValue),
    grossAnnualSavings: Math.round(grossAnnualSavings),
    annualReserves: Math.round(annualReserves),
    netAnnualSavings: Math.round(netAnnualSavings),
  };
}

// ============================================================================
// ROI CALCULATIONS (Honest financial metrics)
// ============================================================================

export interface ROIMetrics {
  paybackYears: number;
  year1ROI: number; // First year ROI %
  roi10Year: number; // 10-year ROI %
  roi25Year: number; // 25-year ROI %
  npv25Year: number; // Net Present Value over 25 years
}

/**
 * Calculate financial metrics with honest projections
 */
export function calculateROI(
  netInvestment: number,
  netAnnualSavings: number,
  discountRate: number = 0.05 // 5% discount rate for NPV
): ROIMetrics {
  // Validation: prevent division by zero and negative values
  if (netInvestment <= 0) {
    console.warn("⚠️ Invalid netInvestment (<=0), returning default metrics");
    return {
      paybackYears: 999,
      year1ROI: 0,
      roi10Year: 0,
      roi25Year: 0,
      npv25Year: -netInvestment,
    };
  }

  if (netAnnualSavings <= 0) {
    console.warn("⚠️ Invalid netAnnualSavings (<=0), system will not pay back");
    return {
      paybackYears: 999,
      year1ROI: -100,
      roi10Year: -100,
      roi25Year: -100,
      npv25Year: -netInvestment,
    };
  }

  // Simple payback
  const paybackYears = netInvestment / netAnnualSavings;

  // Year 1 ROI
  const year1ROI = (netAnnualSavings / netInvestment) * 100;

  // 10-Year ROI
  const savings10Year = netAnnualSavings * 10;
  const roi10Year = ((savings10Year - netInvestment) / netInvestment) * 100;

  // 25-Year ROI
  const savings25Year = netAnnualSavings * 25;
  const roi25Year = ((savings25Year - netInvestment) / netInvestment) * 100;

  // 25-Year NPV (discounted cash flow)
  let npv25Year = -netInvestment;
  for (let year = 1; year <= 25; year++) {
    npv25Year += netAnnualSavings / Math.pow(1 + discountRate, year);
  }

  return {
    paybackYears: Math.round(paybackYears * 10) / 10, // 1 decimal place
    year1ROI: Math.round(year1ROI),
    roi10Year: Math.round(roi10Year),
    roi25Year: Math.round(roi25Year),
    npv25Year: Math.round(npv25Year),
  };
}

// ============================================================================
// CONVENIENCE EXPORT - Complete calculation
// ============================================================================

export interface CompleteFinancialAnalysis {
  costs: CostBreakdown;
  savings: SavingsBreakdown;
  roi: ROIMetrics;
}

/**
 * One-stop function for complete financial analysis
 */
export function calculateCompleteFinancials(
  equipment: EquipmentConfig,
  savingsInputs: SavingsInputs
): CompleteFinancialAnalysis {
  const costs = calculateSystemCosts(equipment);
  const savings = calculateAnnualSavings(savingsInputs, equipment.solarKW || 0);
  const roi = calculateROI(costs.netInvestment, savings.netAnnualSavings);

  return {
    costs,
    savings,
    roi,
  };
}
