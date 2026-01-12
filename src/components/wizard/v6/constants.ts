/**
 * Wizard V6 Constants
 *
 * Replaces deprecated wizardConstants from v4
 */

// ============================================================================
// BESS SIZING RATIOS
// ============================================================================

export const BESS_POWER_RATIOS = {
  peak_shaving: 0.4, // 40% - optimal economic sizing for demand charge reduction
  arbitrage: 0.5, // 50% - peak shaving + time-of-use shifting
  resilience: 0.7, // 70% - cover critical loads during outages
  microgrid: 1.0, // 100% - full island capability
  demand_response: 0.5, // 50% - utility DR program participation
  default: 0.4, // Default to peak_shaving (most common use case)
};

export const getBESSPowerRatio = (useCase: string): number => {
  return BESS_POWER_RATIOS[useCase as keyof typeof BESS_POWER_RATIOS] || BESS_POWER_RATIOS.default;
};

export const SOLAR_TO_BESS_RATIO = 0.6; // Solar should be ~60% of BESS capacity for optimal pairing

// ============================================================================
// INDUSTRY LOAD PROFILES (simplified)
// ============================================================================

export const INDUSTRY_BESS_RATIOS: Record<string, number> = {
  hotel: 0.5,
  hospital: 0.6,
  "data-center": 0.7,
  manufacturing: 0.45,
  warehouse: 0.35,
  retail: 0.4,
  "car-wash": 0.45,
  "ev-charging": 0.55,
  casino: 0.55,
  airport: 0.5,
  office: 0.4,
  default: 0.4,
};

export const getIndustryLoadProfile = (industry: string) => {
  return {
    bessRatio: INDUSTRY_BESS_RATIOS[industry] || INDUSTRY_BESS_RATIOS.default,
    peakLoadFactor: 0.8, // Default peak load factor
    touOverlapScore: 0.6, // Default TOU overlap score
  };
};

export const getIndustryBESSRatio = (industry: string): number => {
  return INDUSTRY_BESS_RATIOS[industry] || INDUSTRY_BESS_RATIOS.default;
};

export const getRegionalTOUSchedule = (_region: string) => {
  // Simplified TOU schedule - can be expanded later
  return {
    peak: { start: 16, end: 21 }, // 4 PM - 9 PM
    offPeak: { start: 21, end: 16 }, // 9 PM - 4 PM
  };
};

/**
 * ⚠️ DEPRECATED: calculateArbitrageSavings
 *
 * This function was removed because it violates SSOT by computing annualSavings
 * using arithmetic instead of reading from TrueQuote results.
 *
 * If you need annualSavings, read from:
 * - state.calculations.selected.annualSavings (after Step 5)
 * - TrueQuoteAuthenticatedResult.options[tier].financials.annualSavings
 *
 * This function has been moved to /legacy/ for reference only.
 *
 * @deprecated Use TrueQuote results instead. See Step5MagicFit.tsx for the authoritative path.
 */
// export const calculateArbitrageSavings = ... // REMOVED - SSOT violation
