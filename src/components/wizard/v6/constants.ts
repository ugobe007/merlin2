/**
 * Wizard V6 Constants
 * 
 * Replaces deprecated wizardConstants from v4
 */

// ============================================================================
// BESS SIZING RATIOS
// ============================================================================

export const BESS_POWER_RATIOS = {
  peak_shaving: 0.40,     // 40% - optimal economic sizing for demand charge reduction
  arbitrage: 0.50,        // 50% - peak shaving + time-of-use shifting
  resilience: 0.70,       // 70% - cover critical loads during outages
  microgrid: 1.00,        // 100% - full island capability
  demand_response: 0.50,  // 50% - utility DR program participation
  default: 0.40,          // Default to peak_shaving (most common use case)
};

export const getBESSPowerRatio = (useCase: string): number => {
  return BESS_POWER_RATIOS[useCase as keyof typeof BESS_POWER_RATIOS] || BESS_POWER_RATIOS.default;
};

export const SOLAR_TO_BESS_RATIO = 0.60; // Solar should be ~60% of BESS capacity for optimal pairing

// ============================================================================
// INDUSTRY LOAD PROFILES (simplified)
// ============================================================================

export const INDUSTRY_BESS_RATIOS: Record<string, number> = {
  hotel: 0.50,
  hospital: 0.60,
  'data-center': 0.70,
  manufacturing: 0.45,
  warehouse: 0.35,
  retail: 0.40,
  'car-wash': 0.45,
  'ev-charging': 0.55,
  casino: 0.55,
  airport: 0.50,
  office: 0.40,
  default: 0.40,
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

export const getRegionalTOUSchedule = (region: string) => {
  // Simplified TOU schedule - can be expanded later
  return {
    peak: { start: 16, end: 21 }, // 4 PM - 9 PM
    offPeak: { start: 21, end: 16 }, // 9 PM - 4 PM
  };
};

export const calculateArbitrageSavings = (
  dailyKWh: number,
  industryType: string,
  state: string,
  electricityRate: number
): {
  annualSavings: number;
  touOverlapScore: number;
  [key: string]: any;
} => {
  // Simplified arbitrage calculation
  const rateSpread = electricityRate * 0.3; // Assume 30% spread between peak/off-peak
  const annualSavings = dailyKWh * rateSpread * 365;
  
  return {
    annualSavings,
    touOverlapScore: 0.6, // Default TOU overlap score
  };
};
