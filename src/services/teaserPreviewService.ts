/**
 * TEASER PREVIEW SERVICE
 * ======================
 * 
 * Purpose: Generate quick "Sneak Peek" estimates for Step 1 (Location + Goals)
 * 
 * ⚠️ CRITICAL RULES:
 * 1. This is NOT SSOT - estimates only!
 * 2. NEVER use words "TrueQuote", "Verified", or show TrueQuote badge
 * 3. Results stored in state.teaserPreview (separate from state.calculations)
 * 4. Always show disclaimer: "Estimate only — not TrueQuote Verified"
 * 5. Use ranges, not exact numbers ("5-6 years" not "5.2 years")
 * 
 * 🔒 6 INVARIANTS (DO NOT BREAK):
 * 1. Step 1 uses ONLY teaserPreviewService (never SSOT, never snapshot)
 * 2. Teaser writes ONLY to state.teaserPreview (never calculations)
 * 3. Teaser ALWAYS publishes with mode:'estimate'
 * 4. ROI and savings are ALWAYS safe (no Infinity/NaN, no uncapped ROI)
 * 5. Step 5 quote effect depends on quote inputs ONLY (not whole state)
 * 6. "Verified" language appears ONLY Step 5+ (UI lint rule if possible)
 * 
 * 🔒 LOCKED CONTRACT (Jan 16, 2026):
 * - TeaserPreview schema (incl. capped flags + teaserHash)
 * - 6 invariants above
 * - mode semantics (estimate vs verified)
 * - Step 5 quoteKey dependency rule
 * - Publishing API payload structure
 * 
 * ✅ ALLOWED ITERATION:
 * - Wording in card bodies
 * - Disclaimer text styling (not content)
 * - Confidence badge UI
 * 
 * Created: January 16, 2026
 * Updated: January 16, 2026 - Added safety guards, capped flags, teaserHash
 * Locked: January 16, 2026 - Interface frozen
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TeaserInput {
  // From address lookup (Step 1)
  zipCode: string;
  state: string;
  city: string;
  
  // From business identification (optional)
  industrySlug?: string; // 'hotel', 'car-wash', 'ev-charging', etc.
  businessSizeTier?: 'small' | 'medium' | 'large'; // from employees/sqft
  
  // From utility lookup (if available)
  electricityRate?: number; // $/kWh, fallback to state average
  demandCharge?: number;     // $/kW, fallback to $15
  sunHours?: number;         // hrs/day, fallback to state average
  
  // From Step 1 goals (if selected)
  goals?: string[]; // ['reduce-costs', 'backup-power', 'solar', etc.]
}

export interface TeaserPreview {
  // Scenario 1: BESS + Solar (save money)
  solarBess: {
    annualSavings: number;        // $/year
    roiYears: number;             // payback years
    monthlyPayment: number;       // if financed
    systemSize: string;           // "500 kW battery + 250 kW solar"
    roiCapped: boolean;           // ⚠️ true if ROI hit safety cap (show qualitative instead)
    savingsCapped: boolean;       // ⚠️ true if savings below threshold (unreliable)
  };
  
  // Scenario 2: BESS + Generator (resilience)
  generatorBess: {
    annualSavings: number;        // $/year (from peak shaving)
    roiYears: number;             // payback years
    monthlyPayment: number;       // if financed
    systemSize: string;           // "500 kW battery + 300 kW generator"
    resilienceHours: number;      // hours of backup power
    roiCapped: boolean;           // ⚠️ true if ROI hit safety cap (show qualitative instead)
    savingsCapped: boolean;       // ⚠️ true if savings below threshold (unreliable)
  };
  
  // Transparency
  assumptions: string[];          // ["Based on 1.8M kWh/year", "State avg rate: $0.12/kWh"]
  disclaimer: string;             // Standard disclaimer text
  confidence: 'low' | 'medium' | 'high'; // Based on available data
  
  // Metadata
  createdAt: string;              // ISO timestamp
  version: string;                // "teaser-v1"
  teaserHash: string;             // Hash of inputs (prevents recompute churn)
}

// ============================================================================
// INDUSTRY BASELINE ESTIMATES
// ============================================================================

/**
 * Rough industry-based annual usage estimates
 * These are VERY approximate - real numbers come from SSOT in Step 3+
 */
const INDUSTRY_BASELINE_USAGE: Record<string, number> = {
  'hotel': 1_500_000,        // 150-room hotel baseline
  'car-wash': 300_000,       // 4-bay car wash
  'ev-charging': 500_000,    // 10-charger hub
  'office': 800_000,         // 50k sqft office
  'retail': 600_000,         // 20k sqft retail
  'warehouse': 1_200_000,    // 200k sqft warehouse
  'data-center': 5_000_000,  // Small data center
  'hospital': 8_000_000,     // 200-bed hospital
  'manufacturing': 3_000_000, // 100k sqft facility
  'apartment': 1_000_000,    // 100-unit apartment
  'shopping-center': 2_500_000, // Medium mall
  'college': 10_000_000,     // University campus
  'airport': 15_000_000,     // Regional airport
  'casino': 8_000_000,       // Gaming facility
  'agricultural': 1_500_000, // Farm operations
  'cold-storage': 4_000_000, // Refrigerated warehouse
  'indoor-farm': 2_000_000,  // Vertical farm
  'gas-station': 400_000,    // Gas station with convenience store
  'government': 5_000_000,   // Government facility
  'microgrid': 3_000_000,    // Commercial microgrid
  'residential': 12_000,     // Single home (much smaller)
};

/**
 * Size tier multipliers
 */
const SIZE_MULTIPLIERS = {
  small: 0.6,
  medium: 1.0,
  large: 1.5,
};

/**
 * State average electricity rates (EIA 2024)
 * Commercial rates in $/kWh
 */
const STATE_AVERAGE_RATES: Record<string, number> = {
  'CA': 0.2794, 'NY': 0.1882, 'TX': 0.1318, 'FL': 0.1340,
  'NV': 0.1420, 'AZ': 0.1387, 'WA': 0.1099, 'OR': 0.1189,
  'MA': 0.1950, 'CT': 0.2180, 'NJ': 0.1590, 'PA': 0.1280,
  'IL': 0.1140, 'OH': 0.1260, 'MI': 0.1410, 'WI': 0.1350,
  'MN': 0.1180, 'CO': 0.1220, 'UT': 0.1090, 'NM': 0.1380,
  'ID': 0.0950, 'MT': 0.1110, 'WY': 0.1050, 'ND': 0.1090,
  'SD': 0.1120, 'NE': 0.1080, 'KS': 0.1240, 'OK': 0.1050,
  'AR': 0.1020, 'LA': 0.1050, 'MS': 0.1150, 'AL': 0.1240,
  'TN': 0.1180, 'KY': 0.1090, 'WV': 0.1150, 'VA': 0.1210,
  'NC': 0.1140, 'SC': 0.1260, 'GA': 0.1250, 'HI': 0.3150,
  'AK': 0.2240, 'ME': 0.1680, 'NH': 0.1920, 'VT': 0.1790,
  'RI': 0.1980, 'DE': 0.1340, 'MD': 0.1380, 'DC': 0.1450,
  'MO': 0.1090, 'IA': 0.1130, 'IN': 0.1190,
};

/**
 * Regional sun hours (average peak sun hours per day)
 */
const REGIONAL_SUN_HOURS: Record<string, number> = {
  'CA': 5.5, 'AZ': 6.5, 'NV': 6.2, 'NM': 6.0, 'TX': 5.2,
  'FL': 5.0, 'HI': 5.8, 'CO': 5.3, 'UT': 5.6,
  // Northeast (lower)
  'NY': 3.8, 'MA': 3.7, 'CT': 3.8, 'NJ': 4.0, 'PA': 3.9,
  'ME': 3.7, 'NH': 3.8, 'VT': 3.7, 'RI': 3.9,
  // Pacific Northwest (lower)
  'WA': 3.5, 'OR': 4.0, 'ID': 4.5,
  // Default for others
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Estimate annual usage from industry + size tier
 */
function estimateUsageFromIndustry(
  slug: string, 
  tier?: 'small' | 'medium' | 'large'
): number {
  const baseUsage = INDUSTRY_BASELINE_USAGE[slug] || 1_000_000;
  const multiplier = tier ? SIZE_MULTIPLIERS[tier] : 1.0;
  return baseUsage * multiplier;
}

/**
 * Fallback: estimate from zip code (generic commercial)
 */
function estimateUsageFromZipCode(_zip: string): number {
  // Placeholder: could enhance with climate zone lookup
  return 1_000_000; // Generic 1M kWh baseline
}

/**
 * Get state average electricity rate
 */
function getStateAverageRate(state: string): number {
  return STATE_AVERAGE_RATES[state] || 0.12; // US average fallback
}

/**
 * Get regional sun hours
 */
function getRegionalSunHours(state: string): number {
  return REGIONAL_SUN_HOURS[state] || 4.5; // US average fallback
}

/**
 * Compute teaser hash from inputs (prevents recompute churn)
 * If hash unchanged, UI can skip recalculation and just republish
 */
export function computeTeaserHash(input: TeaserInput): string {
  const key = [
    input.zipCode,
    input.state,
    input.industrySlug || 'unknown',
    input.businessSizeTier || 'medium',
    (input.electricityRate || 0).toFixed(4),
    (input.demandCharge || 0).toFixed(2),
    (input.sunHours || 0).toFixed(1),
    (input.goals || []).slice().sort().join(','),
  ].join('|');
  
  // Simple hash (good enough for cache key)
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0; // force 32-bit int
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate teaser preview with two scenarios:
 * 1. BESS + Solar (cost savings focus)
 * 2. BESS + Generator (resilience focus)
 * 
 * ⚠️ These are ROUGH estimates for Step 1 preview only!
 */
export function calculateTeaserPreview(input: TeaserInput): TeaserPreview {
  // 1. Estimate annual usage (if industry known)
  const annualUsageKWh = input.industrySlug 
    ? estimateUsageFromIndustry(input.industrySlug, input.businessSizeTier)
    : estimateUsageFromZipCode(input.zipCode);
  
  // 2. Estimate peak demand (load factor ~40% typical for commercial)
  // ⚠️ HEURISTIC: This is arbitrary theater math for teaser only!
  // Real peak demand requires actual facility data (Step 3+)
  const peakDemandKW = annualUsageKWh / 8760 * 2.5; // Rough estimate
  
  // 3. Get utility rates
  const rate = input.electricityRate || getStateAverageRate(input.state);
  const demand = input.demandCharge || 15; // Typical $15/kW
  
  // 4. Get sun hours for solar estimate
  const sunHours = input.sunHours || getRegionalSunHours(input.state);
  
  // ========================================================================
  // SCENARIO 1: BESS + Solar (30% coverage typical)
  // ========================================================================
  
  // Solar sizing: cover 30% of annual usage
  const solarKW = (annualUsageKWh * 0.3) / (sunHours * 365);
  
  // BESS sizing: 4-hour system (typical for arbitrage + peak shaving)
  const bessKWh = peakDemandKW * 0.4 * 4; // 40% of peak, 4 hours
  
  // Cost estimates (rough, not SSOT pricing)
  const solarCost = solarKW * 950; // SSOT: $0.95/W commercial = $950/kW (Q1 2026)
  const bessCost = bessKWh * 125; // ~$125/kWh (Dec 2025 market)
  const solarBessCost = solarCost + bessCost;
  
  // Savings: energy arbitrage + peak shaving + solar offset
  const solarEnergySavings = annualUsageKWh * 0.3 * rate;
  const peakShavingSavings = peakDemandKW * 0.3 * demand * 12;
  const solarBessSavings = solarEnergySavings + peakShavingSavings;
  
  // ROI calculation (with safety guard)
  // ⚠️ If savings are too low, cap ROI to prevent Infinity/NaN
  const MIN_SAVINGS_THRESHOLD = 5000; // $5k/year minimum
  const solarBessSavingsCapped = solarBessSavings < MIN_SAVINGS_THRESHOLD;
  const solarBessROI = solarBessSavingsCapped 
    ? 99 // Cap at 99 years if savings too low
    : solarBessCost / solarBessSavings;
  const solarBessROICapped = solarBessSavingsCapped || solarBessROI > 25; // Also cap if > 25 years
  
  // Monthly payment (7% loan, 15 years)
  const solarBessMonthlyPayment = solarBessCost * 0.009; // Rough estimate
  
  // ========================================================================
  // SCENARIO 2: BESS + Generator (resilience + peak shaving)
  // ========================================================================
  
  // Generator sizing: 50% of peak (typical for backup)
  const generatorKW = peakDemandKW * 0.5;
  
  // BESS sizing: same as scenario 1
  // (Note: In reality, generator config might size BESS differently)
  
  // Cost estimates
  const generatorCost = generatorKW * 700; // ~$700/kW for natural gas
  const genBessCost = bessCost + generatorCost;
  
  // Savings: peak shaving only (generator is backup, not primary revenue)
  // ⚠️ NOTE: Generator value is primarily RESILIENCE, not cost savings!
  // This savings estimate is conservative (demand management only)
  const genBessSavings = peakDemandKW * 0.4 * demand * 12;
  
  // ROI calculation (with safety guard)
  const genBessSavingsCapped = genBessSavings < MIN_SAVINGS_THRESHOLD;
  const genBessROI = genBessSavingsCapped 
    ? 99 // Cap at 99 years if savings too low
    : genBessCost / genBessSavings;
  const genBessROICapped = genBessSavingsCapped || genBessROI > 25; // Also cap if > 25 years
  
  // Monthly payment (7% loan, 15 years)
  const genBessMonthlyPayment = genBessCost * 0.009;
  
  // Resilience hours (how long BESS can power facility)
  const resilienceHours = bessKWh / (peakDemandKW * 0.6); // 60% load during outage
  
  // ========================================================================
  // BUILD RESULT
  // ========================================================================
  
  // Determine confidence level
  // ✅ HIGH: Industry + size tier + utility rate known
  // ⚠️ MEDIUM: Industry known, but missing size tier or utility rate
  // ❌ LOW: Generic zip-based estimate only
  let confidence: 'low' | 'medium' | 'high' = 'low';
  
  if (input.industrySlug) {
    if (input.businessSizeTier && input.electricityRate) {
      confidence = 'high'; // ✅ All key data points available
    } else {
      confidence = 'medium'; // ⚠️ Industry known, but missing details
    }
  }
  // else: stays 'low' (zip-based only)
  
  // Build assumptions list
  const assumptions: string[] = [
    `Estimated usage: ${(annualUsageKWh / 1_000_000).toFixed(1)}M kWh/year`,
    `Electricity rate: $${rate.toFixed(2)}/kWh`,
    `Demand charge: $${demand}/kW`,
  ];
  
  if (input.industrySlug) {
    assumptions.push(`Industry: ${INDUSTRY_BASELINE_USAGE[input.industrySlug] ? input.industrySlug : 'generic commercial'}`);
  } else {
    assumptions.push('Zip-based estimate');
  }
  
  // Standard disclaimer
  const disclaimer = "Estimate only — not TrueQuote Verified. This sneak peek uses benchmarks and public averages. Your TrueQuote Verified results are calculated in Step 5 after you answer facility details.";
  
  // Compute hash to prevent recompute churn
  const teaserHash = computeTeaserHash(input);
  
  return {
    solarBess: {
      annualSavings: Math.round(solarBessSavings),
      roiYears: Math.round(solarBessROI * 10) / 10,
      monthlyPayment: Math.round(solarBessMonthlyPayment),
      systemSize: `${Math.round(bessKWh / 100) * 100} kWh battery + ${Math.round(solarKW)} kW solar`,
      roiCapped: solarBessROICapped,
      savingsCapped: solarBessSavingsCapped,
    },
    generatorBess: {
      annualSavings: Math.round(genBessSavings),
      roiYears: Math.round(genBessROI * 10) / 10,
      monthlyPayment: Math.round(genBessMonthlyPayment),
      systemSize: `${Math.round(bessKWh / 100) * 100} kWh battery + ${Math.round(generatorKW)} kW generator`,
      resilienceHours: Math.round(resilienceHours * 10) / 10,
      roiCapped: genBessROICapped,
      savingsCapped: genBessSavingsCapped,
    },
    assumptions,
    disclaimer,
    confidence,
    createdAt: new Date().toISOString(),
    version: "teaser-v1",
    teaserHash,
  };
}

/**
 * Format ROI range for UI display (uses ranges, not exact numbers)
 * 
 * ⚠️ IMPORTANT: Check roiCapped flag before calling this!
 * If roiCapped=true, use formatCappedROI() instead.
 */
export function formatROIRange(roiYears: number): string {
  const low = Math.floor(roiYears);
  const high = Math.ceil(roiYears);
  
  if (low === high) {
    return `~${low} years`;
  }
  
  return `${low}-${high} years`;
}

/**
 * Format capped ROI for UI display (qualitative instead of fake precision)
 * Use this when roiCapped=true to avoid showing "99 years"
 */
export function formatCappedROI(): string {
  return 'Payback >20 years (estimate)';
}

/**
 * Smart ROI formatter that checks capped flag automatically
 * 
 * ⚠️ UI RULE: Never show both "savings" and "payback" if capped!
 * If roiCapped=true, show EITHER:
 *   - "Typical savings: $Xk/year" OR
 *   - "Payback >20 years (estimate)"
 * NOT BOTH (reads contradictory to humans)
 */
export function formatROISmart(roiYears: number, roiCapped: boolean): string {
  if (roiCapped) {
    return formatCappedROI();
  }
  return formatROIRange(roiYears);
}

/**
 * Format savings as "Typical" prefix (emphasizes estimate)
 */
export function formatTypicalSavings(amount: number): string {
  const thousands = Math.round(amount / 1000);
  return `Typical savings: $${thousands}k/year`;
}
