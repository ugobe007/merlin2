/**
 * Depreciation Schedule Service
 * =============================
 * Database-driven MACRS depreciation schedules and calculations
 *
 * Table: depreciation_schedules
 * Update Frequency: Annual (when IRS updates tax code)
 * Source: IRS Publication 946, Tax code
 */

import { supabase } from "./supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export interface DepreciationSchedule {
  id: string;
  asset_type: "BESS" | "Solar_PV" | "EV_Chargers" | "General_Equipment";
  macrs_class: 5 | 7 | 15 | 20;
  half_year_convention: boolean;
  year_1: number;
  year_2: number;
  year_3: number;
  year_4: number;
  year_5: number;
  year_6: number;
  year_7: number | null;
  year_8: number | null;
  year_9: number | null;
  year_10: number | null;
  year_11: number | null;
  year_12: number | null;
  year_13: number | null;
  year_14: number | null;
  year_15: number | null;
  year_16: number | null;
  year_17: number | null;
  year_18: number | null;
  year_19: number | null;
  year_20: number | null;
  year_21: number | null;
  bonus_depreciation_eligible: boolean;
  bonus_depreciation_2024: number;
  bonus_depreciation_2025: number;
  bonus_depreciation_2026: number;
  itc_eligible: boolean;
  itc_rate_2024: number;
  depreciation_basis_reduction: number;
  data_source: string;
  effective_date: string;
}

export interface DepreciationCalculation {
  assetType: string;
  assetCost: number;
  placedInServiceYear: number;
  macrsBenefit: number;
  bonusDepreciationAmount: number;
  itcAmount: number;
  netDepreciableBasis: number;
  yearlyDepreciation: YearlyDepreciation[];
  totalDepreciation: number;
  npvOfDepreciation: number;
  effectiveTaxBenefit: number;
}

export interface YearlyDepreciation {
  year: number;
  depreciationPercent: number;
  depreciationAmount: number;
  cumulativeDepreciation: number;
  bookValue: number;
  taxShield: number;
}

// ============================================================================
// CACHE
// ============================================================================

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const cache: Map<string, { data: unknown; timestamp: number }> = new Map();

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

/**
 * Get depreciation schedule by asset type
 */
export async function getDepreciationSchedule(
  assetType: "BESS" | "Solar_PV" | "EV_Chargers" | "General_Equipment"
): Promise<DepreciationSchedule | null> {
  const cacheKey = `depreciation_${assetType}`;
  const cached = getCached<DepreciationSchedule>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from("depreciation_schedules")
      .select("*")
      .eq("asset_type", assetType)
      .single();

    if (error) {
      console.error("Error fetching depreciation schedule:", error);
      return null;
    }

    const schedule = data as unknown as DepreciationSchedule;
    setCache(cacheKey, schedule);
    return schedule;
  } catch (err) {
    console.error("Failed to fetch depreciation schedule:", err);
    return null;
  }
}

/**
 * Get all depreciation schedules
 */
export async function getAllDepreciationSchedules(): Promise<DepreciationSchedule[]> {
  const cacheKey = "all_depreciation_schedules";
  const cached = getCached<DepreciationSchedule[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from("depreciation_schedules")
      .select("*")
      .order("macrs_class", { ascending: true });

    if (error) {
      console.error("Error fetching depreciation schedules:", error);
      return [];
    }

    const schedules = data as unknown as DepreciationSchedule[];
    setCache(cacheKey, schedules);
    return schedules;
  } catch (err) {
    console.error("Failed to fetch depreciation schedules:", err);
    return [];
  }
}

// ============================================================================
// DEPRECIATION CALCULATIONS
// ============================================================================

/**
 * Get current bonus depreciation rate based on year
 */
export function getBonusDepreciationRate(year: number): number {
  // Bonus depreciation phasedown per IRS
  if (year <= 2022) return 1.0; // 100%
  if (year === 2023) return 0.8; // 80%
  if (year === 2024) return 0.6; // 60%
  if (year === 2025) return 0.4; // 40%
  if (year === 2026) return 0.2; // 20%
  return 0; // No bonus depreciation after 2026
}

/**
 * Get yearly depreciation percentages from schedule
 */
function getYearlyPercentages(schedule: DepreciationSchedule): number[] {
  const percentages: number[] = [
    schedule.year_1,
    schedule.year_2,
    schedule.year_3,
    schedule.year_4,
    schedule.year_5,
    schedule.year_6,
  ];

  // Add years 7+ based on MACRS class
  if (schedule.macrs_class >= 7 && schedule.year_7) {
    percentages.push(schedule.year_7);
    if (schedule.year_8) percentages.push(schedule.year_8);
  }

  if (schedule.macrs_class >= 15) {
    for (let i = 9; i <= 16; i++) {
      const yearValue = schedule[`year_${i}` as keyof DepreciationSchedule] as number | null;
      if (yearValue) percentages.push(yearValue);
    }
  }

  if (schedule.macrs_class >= 20) {
    for (let i = 17; i <= 21; i++) {
      const yearValue = schedule[`year_${i}` as keyof DepreciationSchedule] as number | null;
      if (yearValue) percentages.push(yearValue);
    }
  }

  return percentages;
}

/**
 * Calculate full depreciation schedule for an asset
 */
export async function calculateDepreciation(params: {
  assetType: "BESS" | "Solar_PV" | "EV_Chargers" | "General_Equipment";
  assetCost: number;
  placedInServiceYear: number;
  claimITC?: boolean;
  marginalTaxRate?: number;
  discountRate?: number;
}): Promise<DepreciationCalculation | null> {
  const {
    assetType,
    assetCost,
    placedInServiceYear,
    claimITC = true,
    marginalTaxRate = 0.25,
    discountRate = 0.08,
  } = params;

  const schedule = await getDepreciationSchedule(assetType);
  if (!schedule) {
    console.error("No depreciation schedule found for:", assetType);
    return null;
  }

  // Calculate ITC if applicable
  let itcAmount = 0;
  let depreciableBasis = assetCost;

  if (claimITC && schedule.itc_eligible) {
    itcAmount = assetCost * schedule.itc_rate_2024;
    // ITC reduces depreciable basis by half the ITC amount (per IRC Section 50(c))
    depreciableBasis = assetCost - itcAmount * schedule.depreciation_basis_reduction;
  }

  // Calculate bonus depreciation
  let bonusDepreciationAmount = 0;
  let remainingBasis = depreciableBasis;

  if (schedule.bonus_depreciation_eligible) {
    const bonusRate = getBonusDepreciationRate(placedInServiceYear);
    bonusDepreciationAmount = depreciableBasis * bonusRate;
    remainingBasis = depreciableBasis - bonusDepreciationAmount;
  }

  // Calculate yearly MACRS depreciation on remaining basis
  const yearlyPercentages = getYearlyPercentages(schedule);
  const yearlyDepreciation: YearlyDepreciation[] = [];
  let cumulativeDepreciation = bonusDepreciationAmount;

  for (let i = 0; i < yearlyPercentages.length; i++) {
    const depreciationPercent = yearlyPercentages[i];
    const depreciationAmount = remainingBasis * depreciationPercent;
    cumulativeDepreciation += depreciationAmount;
    const bookValue = assetCost - cumulativeDepreciation;
    const taxShield = depreciationAmount * marginalTaxRate;

    yearlyDepreciation.push({
      year: placedInServiceYear + i,
      depreciationPercent,
      depreciationAmount,
      cumulativeDepreciation,
      bookValue: Math.max(0, bookValue),
      taxShield,
    });
  }

  // Calculate totals
  const totalDepreciation = depreciableBasis;
  const macrsBenefit = remainingBasis;

  // Calculate NPV of depreciation tax shields
  let npvOfDepreciation = 0;

  // Add bonus depreciation benefit (year 0)
  npvOfDepreciation += bonusDepreciationAmount * marginalTaxRate;

  // Add yearly depreciation benefits (discounted)
  for (let i = 0; i < yearlyDepreciation.length; i++) {
    const yearlyBenefit = yearlyDepreciation[i].taxShield;
    const discountFactor = Math.pow(1 + discountRate, -(i + 1));
    npvOfDepreciation += yearlyBenefit * discountFactor;
  }

  // Total effective tax benefit (ITC + depreciation NPV)
  const effectiveTaxBenefit = itcAmount + npvOfDepreciation;

  return {
    assetType,
    assetCost,
    placedInServiceYear,
    macrsBenefit,
    bonusDepreciationAmount,
    itcAmount,
    netDepreciableBasis: depreciableBasis,
    yearlyDepreciation,
    totalDepreciation,
    npvOfDepreciation,
    effectiveTaxBenefit,
  };
}

/**
 * Calculate simple first-year depreciation benefit
 */
export async function calculateFirstYearBenefit(params: {
  assetType: "BESS" | "Solar_PV" | "EV_Chargers" | "General_Equipment";
  assetCost: number;
  placedInServiceYear?: number;
  claimITC?: boolean;
  marginalTaxRate?: number;
}): Promise<{
  itcAmount: number;
  bonusDepreciationAmount: number;
  firstYearMACRS: number;
  totalFirstYearBenefit: number;
  effectiveDiscountPercent: number;
}> {
  const {
    assetType,
    assetCost,
    placedInServiceYear = new Date().getFullYear(),
    claimITC = true,
    marginalTaxRate = 0.25,
  } = params;

  const schedule = await getDepreciationSchedule(assetType);

  // Default values if no schedule found
  if (!schedule) {
    return {
      itcAmount: 0,
      bonusDepreciationAmount: 0,
      firstYearMACRS: 0,
      totalFirstYearBenefit: 0,
      effectiveDiscountPercent: 0,
    };
  }

  // ITC
  const itcAmount = claimITC && schedule.itc_eligible ? assetCost * schedule.itc_rate_2024 : 0;

  // Depreciable basis after ITC
  const depreciableBasis = assetCost - itcAmount * schedule.depreciation_basis_reduction;

  // Bonus depreciation
  const bonusRate = getBonusDepreciationRate(placedInServiceYear);
  const bonusDepreciationAmount = schedule.bonus_depreciation_eligible
    ? depreciableBasis * bonusRate
    : 0;

  // First year MACRS on remaining basis
  const remainingBasis = depreciableBasis - bonusDepreciationAmount;
  const firstYearMACRS = remainingBasis * schedule.year_1;

  // Total first year tax benefit
  const depreciationTaxBenefit = (bonusDepreciationAmount + firstYearMACRS) * marginalTaxRate;
  const totalFirstYearBenefit = itcAmount + depreciationTaxBenefit;

  // Effective discount
  const effectiveDiscountPercent = (totalFirstYearBenefit / assetCost) * 100;

  return {
    itcAmount,
    bonusDepreciationAmount,
    firstYearMACRS,
    totalFirstYearBenefit,
    effectiveDiscountPercent,
  };
}

/**
 * Compare tax benefits between asset types
 */
export async function compareTaxBenefits(
  assetCost: number,
  placedInServiceYear: number = new Date().getFullYear()
): Promise<
  Array<{
    assetType: string;
    itcAmount: number;
    bonusDepreciation: number;
    macrsBenefit: number;
    totalBenefit: number;
    effectiveRate: number;
  }>
> {
  const assetTypes: Array<"BESS" | "Solar_PV" | "EV_Chargers" | "General_Equipment"> = [
    "BESS",
    "Solar_PV",
    "EV_Chargers",
    "General_Equipment",
  ];

  const comparisons = await Promise.all(
    assetTypes.map(async (assetType) => {
      const result = await calculateFirstYearBenefit({
        assetType,
        assetCost,
        placedInServiceYear,
      });

      return {
        assetType,
        itcAmount: result.itcAmount,
        bonusDepreciation: result.bonusDepreciationAmount,
        macrsBenefit: result.firstYearMACRS * 0.25, // Tax shield
        totalBenefit: result.totalFirstYearBenefit,
        effectiveRate: result.effectiveDiscountPercent,
      };
    })
  );

  return comparisons;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getDepreciationSchedule,
  getAllDepreciationSchedules,
  getBonusDepreciationRate,
  calculateDepreciation,
  calculateFirstYearBenefit,
  compareTaxBenefits,
};
