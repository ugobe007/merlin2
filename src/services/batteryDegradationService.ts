/**
 * ============================================================================
 * BATTERY DEGRADATION SERVICE
 * ============================================================================
 * 
 * Created: January 14, 2026
 * Purpose: Model battery capacity degradation over project lifetime
 * 
 * ADDRESSES GAP: "Missing battery degradation in financial projections"
 * - Previous: Flat capacity assumed over 25 years
 * - Now: Cycle + calendar aging per NREL/PNNL research
 * 
 * DEGRADATION MODELS:
 * 1. Calendar Aging - Capacity loss over time (even without cycling)
 * 2. Cycle Aging - Capacity loss per charge/discharge cycle
 * 3. Temperature Effects - Accelerated aging at high temperatures
 * 
 * DATA SOURCES (TrueQuote™ compliant):
 * - NREL ATB 2024: 2.5%/year typical degradation
 * - PNNL Battery Degradation Study (2023)
 * - DOE/Sandia Energy Storage Handbook
 * - Manufacturer warranty curves (Tesla, CATL, BYD)
 * 
 * CHEMISTRY-SPECIFIC PARAMETERS:
 * - LFP (LiFePO4): 80% capacity @ 4000+ cycles, excellent calendar life
 * - NMC: 80% capacity @ 2000-3000 cycles, moderate calendar life
 * - NCA: Similar to NMC but higher energy density
 * - Flow (VRB): Minimal cycle degradation, 20+ year life
 * ============================================================================
 */

// ============================================================================
// TYPES
// ============================================================================

export type BatteryChemistry = 'lfp' | 'nmc' | 'nca' | 'flow-vrb' | 'sodium-ion';

export interface DegradationInput {
  /** Battery chemistry type */
  chemistry: BatteryChemistry;
  /** Initial capacity in kWh */
  initialCapacityKWh: number;
  /** Average cycles per year */
  cyclesPerYear: number;
  /** Average depth of discharge (0-1) */
  averageDoD: number;
  /** Average operating temperature (°C) */
  averageTemperatureC?: number;
  /** Project lifetime in years */
  projectYears?: number;
  /** Warranty guarantee (% of initial capacity) */
  warrantyCapacityPct?: number;
}

export interface DegradationResult {
  /** Year-by-year capacity values */
  yearlyCapacity: Array<{
    year: number;
    capacityKWh: number;
    capacityPct: number;
    effectiveCycles: number;
    annualDegradation: number;
  }>;
  /** End-of-life metrics */
  endOfLife: {
    finalCapacityPct: number;
    totalCycleEquivalents: number;
    effectiveLifeYears: number; // When capacity drops below 70%
    warrantyCompliant: boolean;
  };
  /** Lifetime energy delivered */
  lifetimeMetrics: {
    totalEnergyMWh: number;
    averageRoundTripEfficiency: number;
    levelizedDegradationCost: number; // $/MWh additional cost due to degradation
  };
  /** TrueQuote™ attribution */
  audit: {
    chemistry: BatteryChemistry;
    model: string;
    sources: string[];
    methodology: string;
    assumptions: Record<string, number>;
  };
}

export interface DegradationParameters {
  /** Base calendar aging rate (%/year) */
  calendarAgingPctPerYear: number;
  /** Cycle aging rate (%/1000 cycles at 100% DoD) */
  cycleAgingPctPer1000Cycles: number;
  /** Cycles to 80% capacity at 100% DoD */
  cyclesTo80Pct: number;
  /** DoD factor exponent (higher DoD = more degradation) */
  dodExponent: number;
  /** Temperature acceleration factor (per 10°C above 25°C) */
  temperatureAccelerationFactor: number;
  /** Warranty years */
  warrantyYears: number;
  /** Warranty capacity guarantee */
  warrantyCapacityPct: number;
  /** Sources */
  sources: string[];
}

// ============================================================================
// CHEMISTRY-SPECIFIC DEGRADATION PARAMETERS
// ============================================================================

/**
 * Degradation parameters by battery chemistry
 * Sources: NREL ATB 2024, PNNL, manufacturer data sheets
 */
export const DEGRADATION_PARAMETERS: Record<BatteryChemistry, DegradationParameters> = {
  'lfp': {
    calendarAgingPctPerYear: 1.5,
    cycleAgingPctPer1000Cycles: 4.0, // Very stable chemistry
    cyclesTo80Pct: 4000,
    dodExponent: 1.2, // Less sensitive to DoD than NMC
    temperatureAccelerationFactor: 1.5,
    warrantyYears: 15,
    warrantyCapacityPct: 70,
    sources: [
      'NREL ATB 2024: LFP utility-scale parameters',
      'CATL EnerOne specifications (2024)',
      'BYD Battery-Box warranty terms',
      'PNNL Battery Degradation Study (2023)',
    ],
  },
  'nmc': {
    calendarAgingPctPerYear: 2.0,
    cycleAgingPctPer1000Cycles: 7.0,
    cyclesTo80Pct: 2500,
    dodExponent: 1.5, // More sensitive to deep discharge
    temperatureAccelerationFactor: 2.0,
    warrantyYears: 10,
    warrantyCapacityPct: 70,
    sources: [
      'NREL ATB 2024: NMC parameters',
      'Samsung SDI ESS specifications',
      'DOE/Sandia Energy Storage Handbook',
    ],
  },
  'nca': {
    calendarAgingPctPerYear: 2.2,
    cycleAgingPctPer1000Cycles: 8.0,
    cyclesTo80Pct: 2000,
    dodExponent: 1.6,
    temperatureAccelerationFactor: 2.2,
    warrantyYears: 10,
    warrantyCapacityPct: 70,
    sources: [
      'Tesla Megapack specifications (2024)',
      'NREL energy storage analysis',
    ],
  },
  'flow-vrb': {
    calendarAgingPctPerYear: 0.5, // Minimal calendar aging
    cycleAgingPctPer1000Cycles: 0.2, // Electrolyte can be replaced
    cyclesTo80Pct: 20000, // Essentially unlimited
    dodExponent: 1.0, // Linear with DoD
    temperatureAccelerationFactor: 1.1,
    warrantyYears: 20,
    warrantyCapacityPct: 80,
    sources: [
      'Sumitomo Electric VRB specifications',
      'ESS Inc. Energy Warehouse specs',
      'DOE Long Duration Energy Storage report',
    ],
  },
  'sodium-ion': {
    calendarAgingPctPerYear: 2.5, // Still maturing technology
    cycleAgingPctPer1000Cycles: 5.5,
    cyclesTo80Pct: 3000,
    dodExponent: 1.3,
    temperatureAccelerationFactor: 1.3, // Better high-temp performance
    warrantyYears: 10,
    warrantyCapacityPct: 70,
    sources: [
      'CATL First-Gen Sodium-Ion specs (2023)',
      'BYD Na-ion development data',
      'Industry early adoption data',
    ],
  },
};

// ============================================================================
// MAIN DEGRADATION CALCULATION
// ============================================================================

/**
 * Calculate battery capacity degradation over project lifetime
 * 
 * Uses combined calendar + cycle aging model:
 * - Calendar aging: Linear capacity loss over time
 * - Cycle aging: Capacity loss proportional to equivalent full cycles
 * - Temperature: Arrhenius-type acceleration at high temps
 * - DoD: Power-law relationship (deeper cycles = more wear)
 * 
 * @param input - Degradation calculation inputs
 * @returns Detailed year-by-year degradation projection
 */
export function calculateDegradation(input: DegradationInput): DegradationResult {
  const {
    chemistry,
    initialCapacityKWh,
    cyclesPerYear,
    averageDoD,
    averageTemperatureC = 25,
    projectYears = 25,
    warrantyCapacityPct,
  } = input;

  const params = DEGRADATION_PARAMETERS[chemistry];
  if (!params) {
    throw new Error(`Unknown battery chemistry: ${chemistry}`);
  }

  const yearlyCapacity: DegradationResult['yearlyCapacity'] = [];
  let currentCapacityPct = 100;
  let totalCycles = 0;
  let totalEnergyMWh = 0;

  // Temperature acceleration factor (Arrhenius approximation)
  const tempAbove25 = Math.max(0, averageTemperatureC - 25);
  const tempFactor = Math.pow(params.temperatureAccelerationFactor, tempAbove25 / 10);

  // DoD stress factor (power law)
  const dodFactor = Math.pow(averageDoD, params.dodExponent);

  // Effective cycle degradation per 1000 cycles at actual DoD
  const effectiveCycleDegradation = params.cycleAgingPctPer1000Cycles * dodFactor * tempFactor;

  for (let year = 1; year <= projectYears; year++) {
    // Calendar aging for this year (adjusted for temperature)
    const calendarDegradation = params.calendarAgingPctPerYear * tempFactor;

    // Cycle aging for this year
    const yearCycles = cyclesPerYear;
    const cycleDegradation = (yearCycles / 1000) * effectiveCycleDegradation;

    // Combined degradation (not strictly additive, use max + 50% of min)
    const maxDeg = Math.max(calendarDegradation, cycleDegradation);
    const minDeg = Math.min(calendarDegradation, cycleDegradation);
    const annualDegradation = maxDeg + 0.5 * minDeg;

    // Update capacity
    currentCapacityPct = Math.max(0, currentCapacityPct - annualDegradation);
    totalCycles += yearCycles;

    // Energy delivered this year (adjusted for capacity fade)
    const avgCapacityThisYear = (currentCapacityPct + annualDegradation / 2) / 100;
    const energyThisYear = initialCapacityKWh * avgCapacityThisYear * yearCycles * averageDoD / 1000;
    totalEnergyMWh += energyThisYear;

    yearlyCapacity.push({
      year,
      capacityKWh: initialCapacityKWh * (currentCapacityPct / 100),
      capacityPct: Math.round(currentCapacityPct * 10) / 10,
      effectiveCycles: totalCycles,
      annualDegradation: Math.round(annualDegradation * 100) / 100,
    });
  }

  // Find effective life (when capacity drops below 70%)
  const eolThreshold = 70;
  const eolYear = yearlyCapacity.find(y => y.capacityPct < eolThreshold)?.year || projectYears;

  // Warranty compliance check
  const warrantyGuarantee = warrantyCapacityPct ?? params.warrantyCapacityPct;
  const warrantyYearCapacity = yearlyCapacity.find(y => y.year === params.warrantyYears);
  const warrantyCompliant = (warrantyYearCapacity?.capacityPct ?? 100) >= warrantyGuarantee;

  // Levelized degradation cost (approximate $/MWh impact)
  // Assumes battery cost of $150/kWh baseline
  const batteryCostPerKWh = 150;
  const degradedCapacityLoss = initialCapacityKWh * (100 - currentCapacityPct) / 100;
  const degradationCostTotal = degradedCapacityLoss * batteryCostPerKWh;
  const levelizedDegradationCost = totalEnergyMWh > 0 
    ? degradationCostTotal / totalEnergyMWh 
    : 0;

  return {
    yearlyCapacity,
    endOfLife: {
      finalCapacityPct: currentCapacityPct,
      totalCycleEquivalents: totalCycles,
      effectiveLifeYears: eolYear,
      warrantyCompliant,
    },
    lifetimeMetrics: {
      totalEnergyMWh: Math.round(totalEnergyMWh * 10) / 10,
      averageRoundTripEfficiency: chemistry === 'flow-vrb' ? 0.75 : 0.87,
      levelizedDegradationCost: Math.round(levelizedDegradationCost * 100) / 100,
    },
    audit: {
      chemistry,
      model: 'Combined Calendar + Cycle Aging (NREL/PNNL)',
      sources: params.sources,
      methodology: `Linear calendar aging (${params.calendarAgingPctPerYear}%/yr base) + ` +
        `cycle aging (${params.cycleAgingPctPer1000Cycles}%/1000 cycles at 100% DoD) + ` +
        `temperature acceleration (${params.temperatureAccelerationFactor}x per 10°C above 25°C)`,
      assumptions: {
        calendarAgingPctPerYear: params.calendarAgingPctPerYear,
        cycleAgingPctPer1000Cycles: params.cycleAgingPctPer1000Cycles,
        dodExponent: params.dodExponent,
        temperatureAccelerationFactor: params.temperatureAccelerationFactor,
        averageTemperatureC,
        averageDoD,
        cyclesPerYear,
      },
    },
  };
}

// ============================================================================
// SIMPLIFIED DEGRADATION ESTIMATE
// ============================================================================

/**
 * Quick degradation estimate for UI previews
 * Uses simplified linear model with NREL ATB default rate
 * 
 * @param chemistry - Battery chemistry type
 * @param years - Years to project
 * @param cyclesPerYear - Annual cycles (default: 365 for daily cycling)
 * @returns Simple capacity retention percentage by year
 */
export function estimateDegradation(
  chemistry: BatteryChemistry = 'lfp',
  years: number = 25,
  cyclesPerYear: number = 365
): { year: number; capacityPct: number }[] {
  const params = DEGRADATION_PARAMETERS[chemistry];
  const annualRate = params.calendarAgingPctPerYear + 
    (cyclesPerYear / 1000) * params.cycleAgingPctPer1000Cycles * 0.5; // 50% DoD assumed

  const result: { year: number; capacityPct: number }[] = [];
  let capacity = 100;

  for (let year = 0; year <= years; year++) {
    result.push({ year, capacityPct: Math.round(capacity * 10) / 10 });
    capacity = Math.max(0, capacity - annualRate);
  }

  return result;
}

// ============================================================================
// FINANCIAL IMPACT CALCULATION
// ============================================================================

/**
 * Calculate financial impact of degradation on project economics
 * 
 * @param degradation - Degradation result from calculateDegradation
 * @param annualRevenueYear1 - First year revenue/savings
 * @param discountRate - Discount rate for NPV (default 8%)
 * @returns Financial impact metrics
 */
export function calculateDegradationFinancialImpact(
  degradation: DegradationResult,
  annualRevenueYear1: number,
  discountRate: number = 0.08
): {
  noDegradationNPV: number;
  withDegradationNPV: number;
  degradationImpact: number;
  degradationImpactPct: number;
  adjustedYearlyRevenue: number[];
} {
  const projectYears = degradation.yearlyCapacity.length;
  let noDegradationNPV = 0;
  let withDegradationNPV = 0;
  const adjustedYearlyRevenue: number[] = [];

  for (let i = 0; i < projectYears; i++) {
    const year = i + 1;
    const discountFactor = Math.pow(1 + discountRate, -year);
    
    // Without degradation (flat capacity)
    noDegradationNPV += annualRevenueYear1 * discountFactor;
    
    // With degradation (capacity-adjusted revenue)
    const capacityFactor = degradation.yearlyCapacity[i].capacityPct / 100;
    const adjustedRevenue = annualRevenueYear1 * capacityFactor;
    adjustedYearlyRevenue.push(adjustedRevenue);
    withDegradationNPV += adjustedRevenue * discountFactor;
  }

  const degradationImpact = noDegradationNPV - withDegradationNPV;
  const degradationImpactPct = (degradationImpact / noDegradationNPV) * 100;

  return {
    noDegradationNPV: Math.round(noDegradationNPV),
    withDegradationNPV: Math.round(withDegradationNPV),
    degradationImpact: Math.round(degradationImpact),
    degradationImpactPct: Math.round(degradationImpactPct * 10) / 10,
    adjustedYearlyRevenue,
  };
}

// ============================================================================
// AUGMENTATION STRATEGY
// ============================================================================

/**
 * Calculate when battery augmentation is needed to maintain capacity
 * 
 * Many contracts require maintaining a minimum capacity (e.g., 80% of initial).
 * This calculates when augmentation is needed and estimated cost.
 * 
 * @param degradation - Degradation projection
 * @param minimumCapacityPct - Minimum capacity to maintain (default 80%)
 * @param augmentationCostPerKWh - Cost to add capacity (default $150/kWh)
 */
export function calculateAugmentationStrategy(
  degradation: DegradationResult,
  minimumCapacityPct: number = 80,
  augmentationCostPerKWh: number = 150
): {
  augmentationsNeeded: Array<{
    year: number;
    capacityToAdd: number;
    cost: number;
    newTotalCapacity: number;
  }>;
  totalAugmentationCost: number;
  totalCapacityAdded: number;
} {
  const augmentations: Array<{
    year: number;
    capacityToAdd: number;
    cost: number;
    newTotalCapacity: number;
  }> = [];

  const initialCapacity = degradation.yearlyCapacity[0]?.capacityKWh || 0;
  if (initialCapacity === 0) {
    return { augmentationsNeeded: [], totalAugmentationCost: 0, totalCapacityAdded: 0 };
  }

  let addedCapacity = 0;
  const minCapacity = initialCapacity * (minimumCapacityPct / 100);

  for (const yearData of degradation.yearlyCapacity) {
    const effectiveCapacity = yearData.capacityKWh + addedCapacity * (yearData.capacityPct / 100);
    
    if (effectiveCapacity < minCapacity) {
      // Need augmentation
      const shortfall = minCapacity - effectiveCapacity;
      const capacityToAdd = Math.ceil(shortfall / 100) * 100; // Round up to 100 kWh increments
      const cost = capacityToAdd * augmentationCostPerKWh;
      addedCapacity += capacityToAdd;

      augmentations.push({
        year: yearData.year,
        capacityToAdd,
        cost,
        newTotalCapacity: initialCapacity + addedCapacity,
      });
    }
  }

  return {
    augmentationsNeeded: augmentations,
    totalAugmentationCost: augmentations.reduce((sum, a) => sum + a.cost, 0),
    totalCapacityAdded: addedCapacity,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculateDegradation,
  estimateDegradation,
  calculateDegradationFinancialImpact,
  calculateAugmentationStrategy,
  DEGRADATION_PARAMETERS,
};
