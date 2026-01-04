/**
 * Industry-Standard BESS Calculation Formulas
 * Validated against NREL ATB 2024, GSL Energy 2025, and industry best practices
 * Last Updated: November 8, 2025
 */

// ============================================
// NREL ATB 2024 OFFICIAL FORMULAS
// ============================================

export interface NRELCalculationInputs {
  batteryPackCostPerKWh: number; // $/kWh - Battery cells and modules
  bosCostPerKW: number; // $/kW - Balance of system (power-related costs)
  durationHours: number; // Storage duration in hours
  powerMW: number; // System power rating
  roundTripEfficiency?: number; // Default: 0.85 (NREL standard)
  cyclesPerYear?: number; // Default: 365 (1 cycle/day)
  systemLifeYears?: number; // Default: 15 years
}

/**
 * NREL ATB 2024 Official CAPEX Formula
 * Total System Cost ($/kW) = Battery Pack Cost ($/kWh) × Duration (hr) + BOS Cost ($/kW)
 */
export const calculateNRELCapex = (
  inputs: NRELCalculationInputs
): {
  totalSystemCostPerKW: number;
  totalSystemCostPerKWh: number;
  totalSystemCost: number;
  breakdown: {
    batteryPackCost: number;
    bosCost: number;
    energyRelatedCost: number;
    powerRelatedCost: number;
  };
} => {
  const { batteryPackCostPerKWh, bosCostPerKW, durationHours, powerMW } = inputs;

  // NREL Formula: Total System Cost ($/kW) = Battery Pack Cost ($/kWh) × Duration (hr) + BOS Cost ($/kW)
  const totalSystemCostPerKW = batteryPackCostPerKWh * durationHours + bosCostPerKW;

  // Calculate per kWh cost
  const totalSystemCostPerKWh = totalSystemCostPerKW / durationHours;

  // Calculate total project cost
  const powerKW = powerMW * 1000;
  const totalSystemCost = totalSystemCostPerKW * powerKW;

  // Energy vs Power breakdown
  const energyRelatedCost = batteryPackCostPerKWh * durationHours * powerKW;
  const powerRelatedCost = bosCostPerKW * powerKW;

  return {
    totalSystemCostPerKW,
    totalSystemCostPerKWh,
    totalSystemCost,
    breakdown: {
      batteryPackCost: batteryPackCostPerKWh * durationHours * powerKW,
      bosCost: bosCostPerKW * powerKW,
      energyRelatedCost,
      powerRelatedCost,
    },
  };
};

/**
 * NREL ATB 2024 Capacity Factor Calculation
 * For battery storage: CF = (Duration × Cycles/Day) / 24 hours
 */
export const calculateCapacityFactor = (
  durationHours: number,
  cyclesPerDay: number = 1
): number => {
  return (durationHours * cyclesPerDay) / 24;
};

/**
 * NREL ATB 2024 O&M Cost Calculation
 * Fixed O&M = 2.5% of CAPEX annually (includes battery augmentation)
 */
export const calculateOMCosts = (
  capexPerKW: number
): {
  fixedOMPerKW: number; // $/kW-year
  variableOM: number; // $0 (NREL assumes no VOM)
} => {
  return {
    fixedOMPerKW: capexPerKW * 0.025, // 2.5% of CAPEX
    variableOM: 0, // NREL assumes no variable O&M
  };
};

// ============================================
// 2025 COMMERCIAL COST MODELS (GSL Energy Data)
// ============================================

export interface CommercialPricingInputs {
  systemSizeKWh: number;
  isContainerized?: boolean;
  region?: "US" | "EU" | "ASIA" | "OTHER";
  includesInstallation?: boolean;
  certificationLevel?: "BASIC" | "PREMIUM"; // UL1973, UL9540A, etc.
}

/**
 * 2025 Commercial BESS Pricing (Based on GSL Energy Market Data)
 */
export const calculateCommercialPricing = (
  inputs: CommercialPricingInputs
): {
  costPerKWh: number;
  totalSystemCost: number;
  priceRange: { min: number; max: number };
  breakdown: {
    batteryPack: number;
    bms: number;
    inverter: number;
    installation: number;
    certification: number;
  };
} => {
  const {
    systemSizeKWh,
    isContainerized = false,
    region = "US",
    includesInstallation = true,
    certificationLevel = "BASIC",
  } = inputs;

  // Base pricing per GSL Energy 2025 data
  let baseCostPerKWh: number;

  if (systemSizeKWh >= 100) {
    // Large containerized systems
    baseCostPerKWh = isContainerized ? 240 : 280; // $180-300 → Average $240
  } else {
    // Smaller systems
    baseCostPerKWh = 380; // $280-580 → Average $380
  }

  // Regional multipliers
  const regionalMultipliers = {
    US: 1.0,
    EU: 1.15,
    ASIA: 0.85,
    OTHER: 1.1,
  };

  // Certification cost adder
  const certificationAdder = certificationLevel === "PREMIUM" ? 25 : 10; // $/kWh

  // Calculate final cost
  const adjustedCostPerKWh = baseCostPerKWh * regionalMultipliers[region] + certificationAdder;
  const totalSystemCost = adjustedCostPerKWh * systemSizeKWh;

  // Component breakdown (typical percentages)
  const batteryPackCost = totalSystemCost * 0.6; // 60% battery pack
  const bmsCost = totalSystemCost * 0.1; // 10% BMS
  const inverterCost = totalSystemCost * 0.15; // 15% inverter/PCS
  const installationCost = includesInstallation ? totalSystemCost * 0.1 : 0; // 10% installation
  const certificationCost = totalSystemCost * 0.05; // 5% certification & compliance

  return {
    costPerKWh: adjustedCostPerKWh,
    totalSystemCost,
    priceRange: {
      min: adjustedCostPerKWh * 0.85,
      max: adjustedCostPerKWh * 1.15,
    },
    breakdown: {
      batteryPack: batteryPackCost,
      bms: bmsCost,
      inverter: inverterCost,
      installation: installationCost,
      certification: certificationCost,
    },
  };
};

// ============================================
// FINANCIAL ANALYSIS - INDUSTRY STANDARD
// ============================================

export interface FinancialInputs {
  capitalCost: number; // Total upfront cost
  annualSavings: number; // Annual energy savings
  omCostAnnual: number; // Annual O&M costs
  discountRate?: number; // Default: 6% (typical commercial)
  analysisYears?: number; // Default: 20 years
  degradationRate?: number; // Default: 2.5% per year
  electricityEscalation?: number; // Default: 2% per year
}

/**
 * Industry-Standard Financial Analysis
 * NPV, IRR, Payback Period calculations
 *
 * @deprecated This function is deprecated and will be removed in v2.0
 * Please use `calculateFinancialMetrics()` from `services/centralizedCalculations.ts` instead.
 *
 * @example
 * // DEPRECATED:
 * import { calculateFinancialMetrics } from './utils/industryStandardFormulas';
 *
 * // USE INSTEAD:
 * import { calculateFinancialMetrics } from './services/centralizedCalculations';
 * const result = await calculateFinancialMetrics({ ... });
 */
export const calculateFinancialMetrics = (
  inputs: FinancialInputs
): {
  npv: number;
  irr: number;
  paybackYears: number;
  lcoe: number; // Levelized Cost of Energy
  roiPercent: number;
  yearByYearCashFlow: Array<{ year: number; cashFlow: number; cumulativeCashFlow: number }>;
} => {
  // DEPRECATION WARNING
  if (import.meta.env.DEV) {
    console.warn(
      "⚠️ DEPRECATED: industryStandardFormulas.calculateFinancialMetrics() is deprecated.\n" +
        "Please use calculateFinancialMetrics() from services/centralizedCalculations.ts instead."
    );
  }

  const {
    capitalCost,
    annualSavings,
    omCostAnnual,
    discountRate = 0.06,
    analysisYears = 20,
    degradationRate = 0.025,
    electricityEscalation = 0.02,
  } = inputs;

  let cumulativeCashFlow = -capitalCost;
  let paybackYears = 0;
  let npv = -capitalCost;
  const cashFlows = [{ year: 0, cashFlow: -capitalCost, cumulativeCashFlow }];

  // Calculate year-by-year cash flows
  for (let year = 1; year <= analysisYears; year++) {
    // Degraded savings with electricity escalation
    const degradationFactor = Math.pow(1 - degradationRate, year);
    const escalationFactor = Math.pow(1 + electricityEscalation, year);
    const yearSavings = annualSavings * degradationFactor * escalationFactor;

    const yearCashFlow = yearSavings - omCostAnnual;
    cumulativeCashFlow += yearCashFlow;

    // NPV calculation
    const discountedCashFlow = yearCashFlow / Math.pow(1 + discountRate, year);
    npv += discountedCashFlow;

    // Payback calculation
    if (paybackYears === 0 && cumulativeCashFlow > 0) {
      paybackYears = year - 1 + Math.abs(cashFlows[year - 1].cumulativeCashFlow) / yearCashFlow;
    }

    cashFlows.push({ year, cashFlow: yearCashFlow, cumulativeCashFlow });
  }

  // IRR calculation (simplified Newton-Raphson method)
  const irr = calculateIRR([-capitalCost, ...cashFlows.slice(1).map((cf) => cf.cashFlow)]);

  // LCOE calculation
  const totalEnergyDelivered = annualSavings * analysisYears; // Simplified
  const lcoe = capitalCost / totalEnergyDelivered;

  // ROI calculation
  const totalReturn = cumulativeCashFlow + capitalCost;
  const roiPercent = (totalReturn / capitalCost) * 100;

  return {
    npv,
    irr,
    paybackYears,
    lcoe,
    roiPercent,
    yearByYearCashFlow: cashFlows,
  };
};

/**
 * IRR Calculation using Newton-Raphson method
 */
function calculateIRR(cashFlows: number[]): number {
  let rate = 0.1; // Initial guess
  const tolerance = 0.0001;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j);
      dnpv -= (j * cashFlows[j]) / Math.pow(1 + rate, j + 1);
    }

    if (Math.abs(npv) < tolerance) break;
    rate = rate - npv / dnpv;
  }

  return rate;
}

// ============================================
// DEGRADATION MODELS - IEEE STANDARDS
// ============================================

export interface BatteryDegradationInputs {
  initialCapacityKWh: number;
  cyclesPerYear: number;
  operatingYears: number;
  averageDoD?: number; // Depth of Discharge, default 0.8
  averageTemperatureC?: number; // Default 25°C
  chemistry?: "LFP" | "NMC"; // Default LFP
}

/**
 * IEEE Standard Battery Degradation Model
 * Accounts for both cycling and calendar aging
 */
export const calculateBatteryDegradation = (
  inputs: BatteryDegradationInputs
): {
  finalCapacityKWh: number;
  capacityRetention: number;
  totalCycles: number;
  cyclingDegradation: number;
  calendarDegradation: number;
} => {
  const {
    initialCapacityKWh,
    cyclesPerYear,
    operatingYears,
    averageDoD = 0.8,
    averageTemperatureC = 25,
    chemistry = "LFP",
  } = inputs;

  // Degradation parameters by chemistry
  const degradationParams = {
    LFP: {
      cyclingDegradationPerCycle: 0.00005, // 0.005% per cycle
      calendarDegradationPerYear: 0.02, // 2% per year
      temperatureCoefficient: 0.001, // Additional degradation per °C above 25°C
    },
    NMC: {
      cyclingDegradationPerCycle: 0.00008, // 0.008% per cycle
      calendarDegradationPerYear: 0.025, // 2.5% per year
      temperatureCoefficient: 0.0015, // Higher temperature sensitivity
    },
  };

  const params = degradationParams[chemistry];
  const totalCycles = cyclesPerYear * operatingYears;

  // Cycling degradation (depends on depth of discharge)
  const dodFactor = Math.pow(averageDoD, 1.2); // DoD stress factor
  const cyclingDegradation = totalCycles * params.cyclingDegradationPerCycle * dodFactor;

  // Calendar degradation (depends on temperature)
  const tempFactor = 1 + (averageTemperatureC - 25) * params.temperatureCoefficient;
  const calendarDegradation = operatingYears * params.calendarDegradationPerYear * tempFactor;

  // Combined degradation (not simply additive)
  const totalDegradation = 1 - (1 - cyclingDegradation) * (1 - calendarDegradation);

  const capacityRetention = 1 - totalDegradation;
  const finalCapacityKWh = initialCapacityKWh * capacityRetention;

  return {
    finalCapacityKWh,
    capacityRetention,
    totalCycles,
    cyclingDegradation,
    calendarDegradation,
  };
};

// Functions are already exported individually above
