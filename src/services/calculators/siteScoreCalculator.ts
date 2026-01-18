/**
 * SITE SCORE™ CALCULATOR
 * =======================
 * 
 * Merlin's proprietary site evaluation algorithm.
 * Calculates a 0-100 score indicating "How much can Merlin help this site?"
 * 
 * FORMULA:
 * Site Score™ = Economic Opportunity (40) + Site Fit (30) + Risk/Resilience (20) + Feasibility (10)
 * 
 * DATA SOURCES:
 * - SAIDI: EIA Electric Power Annual Table 11.4 (https://www.eia.gov/electricity/annual/html/epa_11_04.html)
 * - Rate Trajectory: American Progress + NREL v3 API
 * - Utility Rates: NREL Utility Rates v3 API
 * - EV Charging: DOT + AFDC (https://afdc.energy.gov/fuels/electricity-stations)
 * - Incentives: Electric For All, State DOTs
 * 
 * Created: January 18, 2026
 * SSOT Version: 1.0
 */

import type { Industry } from "../contracts";

// ============================================================================
// TYPES
// ============================================================================

export interface SiteScoreInput {
  // Location
  zipCode: string;
  state: string;
  city?: string;
  
  // Industry
  industry: Industry;
  
  // Utility Data (from utilityRateService)
  electricityRate: number;        // $/kWh
  demandCharge: number;           // $/kW
  hasTOU: boolean;
  peakRate?: number;
  offPeakRate?: number;
  utilityName?: string;
  
  // Facility Data (optional, improves accuracy)
  estimatedPeakKW?: number;
  squareFootage?: number;
  hasExistingSolar?: boolean;
  hasExistingGenerator?: boolean;
  
  // Override flags (for manual adjustments)
  overrides?: {
    saidi?: number;
    rateTrajectory?: "rising-fast" | "moderate" | "stable" | "declining";
    permitComplexity?: "easy" | "moderate" | "difficult";
  };
}

export interface SiteScoreResult {
  // Total Score
  totalScore: number;             // 0-100
  scoreLabel: SiteScoreLabel;
  
  // Category Scores
  economicOpportunity: {
    score: number;                // 0-40
    breakdown: {
      rateLevel: number;          // 0-12
      rateTrajectory: number;     // 0-8
      demandChargeSeverity: number; // 0-10
      touSpread: number;          // 0-5
      incentivesAvailable: number; // 0-5
    };
    insights: string[];
  };
  
  siteFit: {
    score: number;                // 0-30
    breakdown: {
      powerDensityMatch: number;  // 0-15
      solarPotential: number;     // 0-8
      loadProfileFit: number;     // 0-7
    };
    insights: string[];
  };
  
  riskResilience: {
    score: number;                // 0-20
    breakdown: {
      gridReliability: number;    // 0-8
      climateExposure: number;    // 0-7
      businessCriticality: number; // 0-5
    };
    insights: string[];
  };
  
  feasibility: {
    score: number;                // 0-10
    breakdown: {
      permittingComplexity: number; // 0-4
      interconnectionQueue: number; // 0-3
      constructionAccess: number;  // 0-3
    };
    insights: string[];
  };
  
  // Merlin Insights
  merlinSays: string;             // Primary insight statement
  keyDrivers: string[];           // Top 3 factors
  suggestedGoals: SuggestedGoal[];
  
  // Metadata
  calculatedAt: string;
  dataConfidence: "high" | "medium" | "low";
  dataSources: string[];
}

export interface SuggestedGoal {
  goal: "cost_savings" | "resilience" | "sustainability" | "backup_power" | "peak_shaving" | "revenue_generation";
  priority: 1 | 2 | 3;
  reason: string;
  estimatedValue?: string;        // e.g., "$24k/yr"
}

export type SiteScoreLabel = 
  | "exceptional"     // 85-100
  | "strong"          // 70-84
  | "good"            // 55-69
  | "moderate"        // 40-54
  | "limited"         // 25-39
  | "not_recommended"; // 0-24

// ============================================================================
// STATIC DATA: SAIDI BY STATE (EIA 2023 Data)
// Source: https://www.eia.gov/electricity/annual/html/epa_11_04.html
// SAIDI = System Average Interruption Duration Index (minutes/year)
// ============================================================================

export const SAIDI_BY_STATE: Record<string, number> = {
  // High reliability (< 100 mins)
  DC: 58,  NE: 68,  SD: 72,  ND: 75,  WI: 78,  MN: 82,  IA: 85,  
  KS: 88,  NV: 90,  AZ: 92,  NM: 95,  UT: 97,
  
  // Moderate reliability (100-200 mins)
  WY: 102, CO: 108, ID: 112, MT: 115, OR: 120, WA: 125, 
  IL: 130, IN: 135, OH: 140, MI: 145, PA: 150,
  NY: 155, NJ: 160, CT: 165, MA: 170, RI: 172, VT: 175,
  NH: 178, ME: 180, MO: 182, OK: 185, AR: 188,
  
  // Lower reliability (> 200 mins) - BESS more valuable
  TX: 205, LA: 220, MS: 225, AL: 230, GA: 235, FL: 240,
  SC: 245, NC: 250, TN: 255, KY: 260, VA: 265, WV: 270,
  CA: 280, HI: 290, AK: 300,
  
  // Default
  DEFAULT: 150,
};

// ============================================================================
// STATIC DATA: RATE TRAJECTORY BY STATE
// Source: American Progress utility rate tracker + EIA trends
// ============================================================================

export const RATE_TRAJECTORY: Record<string, "rising-fast" | "moderate" | "stable" | "declining"> = {
  // Rising Fast (>5% annual increase)
  CA: "rising-fast", HI: "rising-fast", CT: "rising-fast", MA: "rising-fast",
  NH: "rising-fast", ME: "rising-fast", AK: "rising-fast", RI: "rising-fast",
  
  // Moderate (2-5% annual increase)
  NY: "moderate", NJ: "moderate", PA: "moderate", MI: "moderate",
  IL: "moderate", WI: "moderate", MN: "moderate", CO: "moderate",
  WA: "moderate", OR: "moderate", AZ: "moderate", NV: "moderate",
  FL: "moderate", GA: "moderate", NC: "moderate", VA: "moderate",
  
  // Stable (<2% annual)
  TX: "stable", LA: "stable", OK: "stable", AR: "stable", TN: "stable",
  KY: "stable", AL: "stable", MS: "stable", SC: "stable", MO: "stable",
  KS: "stable", NE: "stable", IA: "stable", IN: "stable", OH: "stable",
  WV: "stable", ND: "stable", SD: "stable", MT: "stable", WY: "stable",
  ID: "stable", UT: "stable", NM: "stable",
  
  // Declining (rare)
  VT: "declining",  // Green Mountain Power incentives
};

// ============================================================================
// STATIC DATA: CLIMATE EXPOSURE BY STATE
// ============================================================================

export const CLIMATE_EXPOSURE: Record<string, { heat: number; storm: number; wildfire: number }> = {
  // Extreme heat states
  AZ: { heat: 3, storm: 1, wildfire: 2 },
  NV: { heat: 3, storm: 0, wildfire: 1 },
  TX: { heat: 3, storm: 2, wildfire: 1 },
  FL: { heat: 2, storm: 3, wildfire: 0 },
  
  // Hurricane/storm states
  LA: { heat: 2, storm: 3, wildfire: 0 },
  MS: { heat: 2, storm: 2, wildfire: 0 },
  AL: { heat: 2, storm: 2, wildfire: 0 },
  GA: { heat: 2, storm: 2, wildfire: 0 },
  SC: { heat: 2, storm: 2, wildfire: 0 },
  NC: { heat: 1, storm: 2, wildfire: 0 },
  
  // Wildfire states (PSPS shutoffs)
  CA: { heat: 2, storm: 0, wildfire: 3 },
  OR: { heat: 1, storm: 0, wildfire: 2 },
  WA: { heat: 0, storm: 1, wildfire: 1 },
  CO: { heat: 1, storm: 1, wildfire: 2 },
  
  // Moderate
  NY: { heat: 1, storm: 1, wildfire: 0 },
  PA: { heat: 1, storm: 1, wildfire: 0 },
  IL: { heat: 1, storm: 1, wildfire: 0 },
  OH: { heat: 1, storm: 1, wildfire: 0 },
  MI: { heat: 0, storm: 1, wildfire: 0 },
  
  // Low exposure
  MN: { heat: 0, storm: 1, wildfire: 0 },
  WI: { heat: 0, storm: 0, wildfire: 0 },
  VT: { heat: 0, storm: 0, wildfire: 0 },
  ME: { heat: 0, storm: 1, wildfire: 0 },
};

// ============================================================================
// STATIC DATA: PERMITTING COMPLEXITY BY STATE
// ============================================================================

const PERMIT_COMPLEXITY: Record<string, "easy" | "moderate" | "difficult"> = {
  // Business-friendly (easy)
  TX: "easy", NV: "easy", AZ: "easy", FL: "easy", TN: "easy",
  NC: "easy", SC: "easy", GA: "easy", CO: "easy", UT: "easy",
  ID: "easy", WY: "easy", OK: "easy", LA: "easy", AL: "easy",
  
  // Moderate
  WA: "moderate", OR: "moderate", NM: "moderate", MO: "moderate",
  IL: "moderate", IN: "moderate", OH: "moderate", MI: "moderate",
  PA: "moderate", VA: "moderate", MD: "moderate", DE: "moderate",
  NJ: "moderate", CT: "moderate", RI: "moderate", NH: "moderate",
  
  // Difficult (heavy regulation)
  CA: "difficult", NY: "difficult", MA: "difficult", HI: "difficult",
  VT: "difficult",
};

// ============================================================================
// STATIC DATA: INDUSTRY-SPECIFIC FACTORS
// ============================================================================

export const INDUSTRY_FACTORS: Record<Industry, {
  powerDensityRange: { min: number; max: number };  // kW typical range
  loadProfile: "peaky" | "variable" | "flat";
  businessCriticality: number;  // 1-5
  solarSpaceFactor: number;     // 1-4 (how much space available)
  techFitComment: string;
}> = {
  hotel: {
    powerDensityRange: { min: 200, max: 2000 },
    loadProfile: "peaky",
    businessCriticality: 3,
    solarSpaceFactor: 2,  // Roof + parking
    techFitComment: "BESS + roof solar excellent fit for demand management",
  },
  car_wash: {
    powerDensityRange: { min: 100, max: 300 },
    loadProfile: "peaky",
    businessCriticality: 2,
    solarSpaceFactor: 1,  // Very limited
    techFitComment: "BESS critical for peak shaving; solar limited by footprint",
  },
  ev_charging: {
    powerDensityRange: { min: 150, max: 2000 },
    loadProfile: "peaky",
    businessCriticality: 3,
    solarSpaceFactor: 2,  // Canopy solar
    techFitComment: "BESS + solar canopy ideal for demand management",
  },
  data_center: {
    powerDensityRange: { min: 5000, max: 100000 },
    loadProfile: "flat",
    businessCriticality: 5,
    solarSpaceFactor: 2,  // Often leased, limited
    techFitComment: "BESS for UPS/backup; large facilities need grid/nuclear",
  },
  hospital: {
    powerDensityRange: { min: 1000, max: 10000 },
    loadProfile: "flat",
    businessCriticality: 5,
    solarSpaceFactor: 2,  // Campus varies
    techFitComment: "BESS + generator mandatory; solar supplements",
  },
  manufacturing: {
    powerDensityRange: { min: 500, max: 20000 },
    loadProfile: "variable",
    businessCriticality: 4,
    solarSpaceFactor: 4,  // Often large roofs
    techFitComment: "Large roof solar + BESS for shift optimization",
  },
  warehouse: {
    powerDensityRange: { min: 200, max: 2000 },
    loadProfile: "flat",
    businessCriticality: 2,
    solarSpaceFactor: 4,  // Massive roofs
    techFitComment: "Excellent solar ROI; BESS for arbitrage",
  },
  retail: {
    powerDensityRange: { min: 100, max: 1000 },
    loadProfile: "peaky",
    businessCriticality: 2,
    solarSpaceFactor: 3,  // Parking lots
    techFitComment: "Parking canopy solar + BESS for peak shaving",
  },
  office: {
    powerDensityRange: { min: 200, max: 3000 },
    loadProfile: "peaky",
    businessCriticality: 2,
    solarSpaceFactor: 2,  // Roof only typically
    techFitComment: "BESS for TOU arbitrage; solar depends on roof",
  },
  college: {
    powerDensityRange: { min: 1000, max: 15000 },
    loadProfile: "variable",
    businessCriticality: 3,
    solarSpaceFactor: 4,  // Large campus
    techFitComment: "Microgrid opportunity; solar + BESS campus-wide",
  },
  restaurant: {
    powerDensityRange: { min: 50, max: 200 },
    loadProfile: "peaky",
    businessCriticality: 2,
    solarSpaceFactor: 1,  // Very limited
    techFitComment: "Small BESS for peak shaving; solar often impractical",
  },
  agriculture: {
    powerDensityRange: { min: 100, max: 2000 },
    loadProfile: "variable",
    businessCriticality: 3,
    solarSpaceFactor: 4,  // Acres available
    techFitComment: "Ground-mount solar ideal; BESS for irrigation pumps",
  },
  airport: {
    powerDensityRange: { min: 5000, max: 50000 },
    loadProfile: "flat",
    businessCriticality: 5,
    solarSpaceFactor: 4,  // Parking + cargo areas
    techFitComment: "Microgrid essential; solar + BESS + generator combo",
  },
  casino: {
    powerDensityRange: { min: 2000, max: 20000 },
    loadProfile: "flat",
    businessCriticality: 4,
    solarSpaceFactor: 3,  // Parking structures
    techFitComment: "24/7 operation needs BESS + backup; solar on parking",
  },
  indoor_farm: {
    powerDensityRange: { min: 500, max: 5000 },
    loadProfile: "flat",
    businessCriticality: 4,
    solarSpaceFactor: 2,  // Roof limited by lights
    techFitComment: "High kWh demand; BESS for light cycle optimization",
  },
  apartment: {
    powerDensityRange: { min: 100, max: 500 },
    loadProfile: "peaky",
    businessCriticality: 2,
    solarSpaceFactor: 2,  // Roof only
    techFitComment: "Community solar + BESS for TOU savings",
  },
  cold_storage: {
    powerDensityRange: { min: 500, max: 5000 },
    loadProfile: "flat",
    businessCriticality: 5,
    solarSpaceFactor: 4,  // Large roof
    techFitComment: "BESS critical for temp maintenance during outages",
  },
  shopping_center: {
    powerDensityRange: { min: 1000, max: 10000 },
    loadProfile: "peaky",
    businessCriticality: 2,
    solarSpaceFactor: 4,  // Massive parking
    techFitComment: "Parking canopy solar + BESS for anchor tenants",
  },
  government: {
    powerDensityRange: { min: 200, max: 5000 },
    loadProfile: "peaky",
    businessCriticality: 4,
    solarSpaceFactor: 3,  // Campus varies
    techFitComment: "Resilience mandates favor BESS + generator + solar",
  },
  gas_station: {
    powerDensityRange: { min: 50, max: 200 },
    loadProfile: "peaky",
    businessCriticality: 2,
    solarSpaceFactor: 2,  // Canopy
    techFitComment: "EV charging transition makes BESS essential",
  },
  residential: {
    powerDensityRange: { min: 5, max: 20 },
    loadProfile: "peaky",
    businessCriticality: 1,
    solarSpaceFactor: 2,  // Roof
    techFitComment: "Home solar + Powerwall for TOU and backup",
  },
  microgrid: {
    powerDensityRange: { min: 500, max: 50000 },
    loadProfile: "variable",
    businessCriticality: 4,
    solarSpaceFactor: 4,  // Dedicated land
    techFitComment: "Purpose-built for multi-source integration",
  },
  heavy_duty_truck_stop: {
    powerDensityRange: { min: 500, max: 5000 },
    loadProfile: "peaky",
    businessCriticality: 3,
    solarSpaceFactor: 3,  // Parking + canopy
    techFitComment: "MCS charging demands BESS; solar on canopies",
  },
};

// ============================================================================
// STATIC DATA: SOLAR IRRADIANCE BY STATE (kWh/m²/day)
// ============================================================================

const SOLAR_IRRADIANCE: Record<string, number> = {
  // Excellent (≥5.5)
  AZ: 6.5, NV: 6.3, NM: 6.2, CA: 5.8, TX: 5.5, UT: 5.5, CO: 5.5,
  
  // Good (4.5-5.4)
  FL: 5.3, HI: 5.3, OK: 5.0, KS: 5.0, NC: 4.8, GA: 4.8,
  SC: 4.8, AL: 4.7, TN: 4.6, LA: 4.6, MS: 4.6, AR: 4.5,
  
  // Fair (3.5-4.4)
  MO: 4.4, IL: 4.3, IN: 4.2, KY: 4.2, VA: 4.2, MD: 4.1,
  NJ: 4.1, DE: 4.1, PA: 4.0, OH: 4.0, IA: 4.0, NE: 4.2,
  SD: 4.3, ND: 4.2, MT: 4.2, WY: 4.5, ID: 4.4,
  
  // Poor (<3.5)
  NY: 3.8, MA: 3.7, CT: 3.7, RI: 3.6, NH: 3.5, VT: 3.4,
  ME: 3.3, MI: 3.5, MN: 3.8, WI: 3.7, WA: 3.5, OR: 3.6,
  AK: 2.8,
  
  DEFAULT: 4.2,
};

// ============================================================================
// STATIC DATA: ITC + STATE INCENTIVES
// ============================================================================

const INCENTIVE_SCORES: Record<string, number> = {
  // Full ITC + strong state incentives (5 pts)
  CA: 5, NY: 5, MA: 5, NJ: 5, CT: 5, MD: 5, IL: 5,
  
  // ITC + some state incentives (4 pts)
  CO: 4, AZ: 4, NV: 4, OR: 4, WA: 4, MN: 4, NC: 4, 
  VA: 4, PA: 4, RI: 4, VT: 4, NH: 4, ME: 4,
  
  // ITC only, limited state (3 pts)
  TX: 3, FL: 3, GA: 3, HI: 3, NM: 3, UT: 3, MI: 3,
  OH: 3, IN: 3, WI: 3, MO: 3, IA: 3,
  
  // ITC only, no state (2 pts)
  TN: 2, KY: 2, SC: 2, AL: 2, MS: 2, LA: 2, AR: 2,
  OK: 2, KS: 2, NE: 2, SD: 2, ND: 2, MT: 2, WY: 2, ID: 2,
  
  DEFAULT: 3,
};

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate Site Score™
 * 
 * @param input - Site data including location, industry, and utility info
 * @returns Complete score breakdown with insights
 */
export function calculateSiteScore(input: SiteScoreInput): SiteScoreResult {
  const state = input.state.toUpperCase();
  const industry = input.industry;
  
  // ─────────────────────────────────────────────────────────────
  // 1. ECONOMIC OPPORTUNITY (40 points max)
  // ─────────────────────────────────────────────────────────────
  
  // Rate Level (0-12)
  let rateLevel = 0;
  if (input.electricityRate >= 0.25) rateLevel = 12;
  else if (input.electricityRate >= 0.18) rateLevel = 10;
  else if (input.electricityRate >= 0.15) rateLevel = 8;
  else if (input.electricityRate >= 0.12) rateLevel = 6;
  else if (input.electricityRate >= 0.10) rateLevel = 4;
  else if (input.electricityRate >= 0.08) rateLevel = 2;
  
  // Rate Trajectory (0-8)
  const trajectory = input.overrides?.rateTrajectory || RATE_TRAJECTORY[state] || "stable";
  let rateTrajectory = 0;
  if (trajectory === "rising-fast") rateTrajectory = 8;
  else if (trajectory === "moderate") rateTrajectory = 5;
  else if (trajectory === "stable") rateTrajectory = 2;
  else if (trajectory === "declining") rateTrajectory = 0;
  
  // Demand Charge Severity (0-10)
  let demandChargeSeverity = 0;
  if (input.demandCharge >= 25) demandChargeSeverity = 10;
  else if (input.demandCharge >= 20) demandChargeSeverity = 8;
  else if (input.demandCharge >= 15) demandChargeSeverity = 6;
  else if (input.demandCharge >= 10) demandChargeSeverity = 4;
  else if (input.demandCharge >= 5) demandChargeSeverity = 2;
  
  // TOU Spread (0-5)
  let touSpread = 0;
  if (input.hasTOU && input.peakRate && input.offPeakRate) {
    const spread = input.peakRate / input.offPeakRate;
    if (spread >= 2.0) touSpread = 5;
    else if (spread >= 1.5) touSpread = 3;
    else touSpread = 1;
  } else if (input.hasTOU) {
    touSpread = 2;  // Has TOU but spread unknown
  }
  
  // Incentives (0-5)
  const incentivesAvailable = INCENTIVE_SCORES[state] || INCENTIVE_SCORES.DEFAULT;
  
  const economicScore = rateLevel + rateTrajectory + demandChargeSeverity + touSpread + incentivesAvailable;
  
  // Economic insights
  const economicInsights: string[] = [];
  if (rateLevel >= 8) economicInsights.push(`High electricity rates (${(input.electricityRate * 100).toFixed(1)}¢/kWh) create strong savings opportunity`);
  if (rateTrajectory >= 5) economicInsights.push("Rates trending upward - locking in savings now is advantageous");
  if (demandChargeSeverity >= 6) economicInsights.push(`Demand charges of $${input.demandCharge}/kW make peak shaving valuable`);
  if (touSpread >= 3) economicInsights.push("TOU rate spread enables arbitrage opportunities");
  if (incentivesAvailable >= 4) economicInsights.push("Strong state incentives available beyond federal ITC");
  
  // ─────────────────────────────────────────────────────────────
  // 2. SITE FIT (30 points max)
  // ─────────────────────────────────────────────────────────────
  
  const industryConfig = INDUSTRY_FACTORS[industry] || INDUSTRY_FACTORS.office;
  
  // Power Density Match (0-15)
  // How well does BESS/solar technology fit this site's power needs?
  let powerDensityMatch = 12;  // Default: good fit
  
  // Large data centers may need more than BESS can provide
  if (industry === "data_center" && input.estimatedPeakKW && input.estimatedPeakKW > 20000) {
    powerDensityMatch = 5;  // BESS alone insufficient
  } else if (industry === "data_center") {
    powerDensityMatch = 8;  // BESS for backup only
  }
  
  // Small loads (residential, small retail) - BESS overkill
  if (industryConfig.powerDensityRange.max < 200) {
    powerDensityMatch = 8;
  }
  
  // Perfect fit industries
  if (["hotel", "warehouse", "shopping_center", "college"].includes(industry)) {
    powerDensityMatch = 15;
  }
  
  // Solar Potential (0-8)
  const irradiance = SOLAR_IRRADIANCE[state] || SOLAR_IRRADIANCE.DEFAULT;
  const irradianceFactor = irradiance >= 5.5 ? 4 : irradiance >= 4.5 ? 3 : irradiance >= 3.5 ? 2 : 1;
  const spaceFactor = industryConfig.solarSpaceFactor;
  const solarPotential = Math.min(8, irradianceFactor + spaceFactor);
  
  // Load Profile Fit (0-7)
  let loadProfileFit = 5;  // Default
  if (industryConfig.loadProfile === "peaky") loadProfileFit = 7;  // BESS shines
  else if (industryConfig.loadProfile === "variable") loadProfileFit = 5;
  else if (industryConfig.loadProfile === "flat") loadProfileFit = 3;  // Less arbitrage
  
  const siteFitScore = powerDensityMatch + solarPotential + loadProfileFit;
  
  // Site Fit insights
  const siteFitInsights: string[] = [];
  siteFitInsights.push(industryConfig.techFitComment);
  if (solarPotential >= 6) siteFitInsights.push(`${state} has excellent solar irradiance (${irradiance.toFixed(1)} kWh/m²/day)`);
  if (loadProfileFit >= 6) siteFitInsights.push("Peaky load profile maximizes BESS value for peak shaving");
  
  // ─────────────────────────────────────────────────────────────
  // 3. RISK/RESILIENCE (20 points max)
  // ─────────────────────────────────────────────────────────────
  
  // Grid Reliability (0-8) - Higher SAIDI = higher score (more need)
  const saidi = input.overrides?.saidi || SAIDI_BY_STATE[state] || SAIDI_BY_STATE.DEFAULT;
  let gridReliability = 0;
  if (saidi >= 250) gridReliability = 8;
  else if (saidi >= 200) gridReliability = 6;
  else if (saidi >= 150) gridReliability = 5;
  else if (saidi >= 100) gridReliability = 4;
  else if (saidi >= 50) gridReliability = 2;
  
  // Climate Exposure (0-7)
  const climate = CLIMATE_EXPOSURE[state] || { heat: 1, storm: 1, wildfire: 0 };
  const climateExposure = Math.min(7, climate.heat + climate.storm + climate.wildfire);
  
  // Business Criticality (0-5)
  const businessCriticality = industryConfig.businessCriticality;
  
  const riskScore = gridReliability + climateExposure + businessCriticality;
  
  // Risk insights
  const riskInsights: string[] = [];
  if (gridReliability >= 5) riskInsights.push(`Grid reliability below average (SAIDI: ${saidi} mins/yr) - backup power valuable`);
  if (climate.heat >= 2) riskInsights.push("Extreme heat increases demand charges during peak cooling");
  if (climate.storm >= 2) riskInsights.push("Storm risk creates outage exposure - resilience important");
  if (climate.wildfire >= 2) riskInsights.push("Wildfire risk may trigger PSPS shutoffs - backup essential");
  if (businessCriticality >= 4) riskInsights.push("Critical infrastructure - backup power is mandatory");
  
  // ─────────────────────────────────────────────────────────────
  // 4. FEASIBILITY (10 points max)
  // ─────────────────────────────────────────────────────────────
  
  // Permitting Complexity (0-4)
  const permitLevel = input.overrides?.permitComplexity || PERMIT_COMPLEXITY[state] || "moderate";
  let permittingComplexity = 2;
  if (permitLevel === "easy") permittingComplexity = 4;
  else if (permitLevel === "moderate") permittingComplexity = 2;
  else if (permitLevel === "difficult") permittingComplexity = 1;
  
  // Interconnection Queue (0-3) - Estimate based on state
  let interconnectionQueue = 2;  // Default moderate
  if (["CA", "TX", "NY"].includes(state)) interconnectionQueue = 1;  // Congested
  if (["NV", "AZ", "FL", "NC"].includes(state)) interconnectionQueue = 3;  // Faster
  
  // Construction Access (0-3) - Based on industry
  let constructionAccess = 2;
  if (["warehouse", "manufacturing", "agricultural", "shopping_center"].includes(industry)) {
    constructionAccess = 3;  // Easy ground access
  }
  if (["data_center", "hospital"].includes(industry)) {
    constructionAccess = 2;  // Security considerations
  }
  if (["apartment", "office"].includes(industry)) {
    constructionAccess = 2;  // Multi-tenant coordination
  }
  
  const feasibilityScore = permittingComplexity + interconnectionQueue + constructionAccess;
  
  // Feasibility insights
  const feasibilityInsights: string[] = [];
  if (permittingComplexity >= 3) feasibilityInsights.push(`${state} has business-friendly permitting`);
  if (permittingComplexity <= 1) feasibilityInsights.push(`${state} permitting can be complex - factor in timeline`);
  if (interconnectionQueue >= 3) feasibilityInsights.push("Utility interconnection typically faster than national average");
  
  // ─────────────────────────────────────────────────────────────
  // TOTAL SCORE & LABEL
  // ─────────────────────────────────────────────────────────────
  
  const totalScore = economicScore + siteFitScore + riskScore + feasibilityScore;
  
  let scoreLabel: SiteScoreLabel;
  if (totalScore >= 85) scoreLabel = "exceptional";
  else if (totalScore >= 70) scoreLabel = "strong";
  else if (totalScore >= 55) scoreLabel = "good";
  else if (totalScore >= 40) scoreLabel = "moderate";
  else if (totalScore >= 25) scoreLabel = "limited";
  else scoreLabel = "not_recommended";
  
  // ─────────────────────────────────────────────────────────────
  // MERLIN INSIGHTS
  // ─────────────────────────────────────────────────────────────
  
  const merlinSays = generateMerlinInsight(totalScore, scoreLabel, industry, state, input);
  const keyDrivers = generateKeyDrivers(
    { rateLevel, rateTrajectory, demandChargeSeverity, touSpread, incentivesAvailable },
    { powerDensityMatch, solarPotential, loadProfileFit },
    { gridReliability, climateExposure, businessCriticality },
    input
  );
  const suggestedGoals = generateSuggestedGoals(
    { rateLevel, rateTrajectory, demandChargeSeverity, touSpread },
    { gridReliability, climateExposure, businessCriticality },
    industryConfig,
    input
  );
  
  // ─────────────────────────────────────────────────────────────
  // RETURN RESULT
  // ─────────────────────────────────────────────────────────────
  
  return {
    totalScore: Math.round(totalScore),
    scoreLabel,
    
    economicOpportunity: {
      score: economicScore,
      breakdown: { rateLevel, rateTrajectory, demandChargeSeverity, touSpread, incentivesAvailable },
      insights: economicInsights,
    },
    
    siteFit: {
      score: siteFitScore,
      breakdown: { powerDensityMatch, solarPotential, loadProfileFit },
      insights: siteFitInsights,
    },
    
    riskResilience: {
      score: riskScore,
      breakdown: { gridReliability, climateExposure, businessCriticality },
      insights: riskInsights,
    },
    
    feasibility: {
      score: feasibilityScore,
      breakdown: { permittingComplexity, interconnectionQueue, constructionAccess },
      insights: feasibilityInsights,
    },
    
    merlinSays,
    keyDrivers,
    suggestedGoals,
    
    calculatedAt: new Date().toISOString(),
    dataConfidence: determineConfidence(input),
    dataSources: ["EIA SAIDI 2023", "NREL Utility Rates v3", "EIA State Rates 2024", "American Progress Rate Tracker"],
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateMerlinInsight(
  score: number,
  label: SiteScoreLabel,
  industry: Industry,
  state: string,
  input: SiteScoreInput
): string {
  const industryName = industry.replace(/_/g, " ");
  
  if (label === "exceptional") {
    return `This ${industryName} site in ${state} is an exceptional candidate. High utility costs combined with strong incentives create a compelling ROI case.`;
  } else if (label === "strong") {
    return `Sites like this typically face ${input.demandCharge >= 15 ? "high demand charges" : "above-average rates"} and ${SAIDI_BY_STATE[state] >= 150 ? "grid reliability concerns" : "moderate outage risk"}.`;
  } else if (label === "good") {
    return `This ${industryName} shows good potential. ${input.hasTOU ? "TOU rate structure enables arbitrage." : "Demand charges are the primary value driver."}`;
  } else if (label === "moderate") {
    return `Moderate opportunity exists. Consider timing - rates in ${state} are ${RATE_TRAJECTORY[state] === "rising-fast" ? "rising quickly" : "stable"}.`;
  } else if (label === "limited") {
    return `Limited near-term benefit. ${input.electricityRate < 0.10 ? "Low electricity rates reduce savings potential." : "Site constraints limit technology options."}`;
  } else {
    return `Current economics don't strongly support investment. Re-evaluate if rates or incentives change.`;
  }
}

function generateKeyDrivers(
  economic: { rateLevel: number; rateTrajectory: number; demandChargeSeverity: number; touSpread: number; incentivesAvailable: number },
  siteFit: { powerDensityMatch: number; solarPotential: number; loadProfileFit: number },
  risk: { gridReliability: number; climateExposure: number; businessCriticality: number },
  input: SiteScoreInput
): string[] {
  const drivers: { factor: string; score: number }[] = [
    { factor: `Electricity rate: ${(input.electricityRate * 100).toFixed(1)}¢/kWh`, score: economic.rateLevel },
    { factor: `Demand charges: $${input.demandCharge}/kW`, score: economic.demandChargeSeverity },
    { factor: "Rate trajectory", score: economic.rateTrajectory },
    { factor: "TOU arbitrage potential", score: economic.touSpread },
    { factor: "State incentives", score: economic.incentivesAvailable },
    { factor: "Solar potential", score: siteFit.solarPotential },
    { factor: "Load profile fit", score: siteFit.loadProfileFit },
    { factor: "Grid reliability need", score: risk.gridReliability },
    { factor: "Climate exposure", score: risk.climateExposure },
  ];
  
  // Sort by score descending and return top 3
  return drivers
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(d => d.factor);
}

function generateSuggestedGoals(
  economic: { rateLevel: number; rateTrajectory: number; demandChargeSeverity: number; touSpread: number },
  risk: { gridReliability: number; climateExposure: number; businessCriticality: number },
  industryConfig: typeof INDUSTRY_FACTORS[Industry],
  input: SiteScoreInput
): SuggestedGoal[] {
  const goals: SuggestedGoal[] = [];
  
  // Cost Savings - almost always primary
  if (economic.rateLevel >= 4 || economic.demandChargeSeverity >= 4) {
    const estimatedSavings = Math.round(economic.demandChargeSeverity * 2 + economic.rateLevel * 1.5);
    goals.push({
      goal: "cost_savings",
      priority: 1,
      reason: economic.demandChargeSeverity >= 6 
        ? `High demand charges ($${input.demandCharge}/kW) create strong peak shaving value`
        : `Above-average electricity rates (${(input.electricityRate * 100).toFixed(1)}¢/kWh)`,
      estimatedValue: `${estimatedSavings}-${estimatedSavings + 15}% cost reduction`,
    });
  }
  
  // Peak Shaving - if demand charges high
  if (economic.demandChargeSeverity >= 6 && goals.length < 3) {
    goals.push({
      goal: "peak_shaving",
      priority: goals.length === 0 ? 1 : 2,
      reason: `Demand charge of $${input.demandCharge}/kW makes peak reduction high-value`,
      estimatedValue: `$${Math.round(input.demandCharge * 50)}-${Math.round(input.demandCharge * 150)}/mo`,
    });
  }
  
  // Resilience - if grid unreliable or critical business
  if (risk.gridReliability >= 5 || risk.businessCriticality >= 4) {
    goals.push({
      goal: "resilience",
      priority: risk.businessCriticality >= 4 ? 1 : 2,
      reason: risk.businessCriticality >= 4
        ? "Critical operations require backup power capability"
        : "Grid reliability below average - outage protection valuable",
      estimatedValue: "2-4 hrs backup",
    });
  }
  
  // Backup Power - for critical industries
  if (risk.businessCriticality >= 4 && !goals.some(g => g.goal === "resilience")) {
    goals.push({
      goal: "backup_power",
      priority: 2,
      reason: "Critical infrastructure requires reliable backup systems",
    });
  }
  
  // Sustainability - lower priority but included
  if (goals.length < 3) {
    goals.push({
      goal: "sustainability",
      priority: 3,
      reason: "Reducing carbon footprint and ESG compliance",
    });
  }
  
  // Sort by priority and limit to 3
  return goals.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

function determineConfidence(input: SiteScoreInput): "high" | "medium" | "low" {
  let factors = 0;
  
  if (input.zipCode) factors++;
  if (input.electricityRate > 0) factors++;
  if (input.demandCharge > 0) factors++;
  if (input.estimatedPeakKW) factors++;
  if (input.utilityName) factors++;
  
  if (factors >= 4) return "high";
  if (factors >= 2) return "medium";
  return "low";
}

// ============================================================================
// QUICK ESTIMATE (for UI before full data)
// ============================================================================

/**
 * Quick Site Score estimate based on minimal inputs
 * Used for immediate UI feedback before full calculation
 */
export function estimateSiteScore(state: string, industry: Industry): {
  estimatedScore: number;
  estimatedLabel: SiteScoreLabel;
  quickInsight: string;
} {
  const stateUpper = state.toUpperCase();
  
  // Simple scoring based on state characteristics
  let baseScore = 50;
  
  // High-rate states
  if (["CA", "HI", "CT", "MA", "NY", "NH", "ME", "AK"].includes(stateUpper)) {
    baseScore += 15;
  } else if (["NV", "AZ", "FL", "TX"].includes(stateUpper)) {
    baseScore += 8;
  }
  
  // Grid reliability adjustment
  const saidi = SAIDI_BY_STATE[stateUpper] || 150;
  if (saidi >= 200) baseScore += 8;
  else if (saidi >= 150) baseScore += 4;
  
  // Industry adjustment
  const industryConfig = INDUSTRY_FACTORS[industry];
  if (industryConfig?.loadProfile === "peaky") baseScore += 5;
  if (industryConfig?.businessCriticality >= 4) baseScore += 5;
  
  // Cap at 100
  const estimatedScore = Math.min(100, Math.max(0, baseScore));
  
  let estimatedLabel: SiteScoreLabel;
  if (estimatedScore >= 85) estimatedLabel = "exceptional";
  else if (estimatedScore >= 70) estimatedLabel = "strong";
  else if (estimatedScore >= 55) estimatedLabel = "good";
  else if (estimatedScore >= 40) estimatedLabel = "moderate";
  else if (estimatedScore >= 25) estimatedLabel = "limited";
  else estimatedLabel = "not_recommended";
  
  const quickInsight = `${industry.replace(/_/g, " ")} sites in ${stateUpper} typically show ${estimatedLabel} potential for energy optimization.`;
  
  return { estimatedScore, estimatedLabel, quickInsight };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculateSiteScore,
  estimateSiteScore,
  SAIDI_BY_STATE,
  RATE_TRAJECTORY,
  CLIMATE_EXPOSURE,
  INDUSTRY_FACTORS,
};
