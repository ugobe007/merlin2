/**
 * ===========================================================================
 * MERLIN ENERGY -- SINGLE SOURCE OF TRUTH CONSTANTS
 * ===========================================================================
 * 
 * This file is the canonical source for ALL shared data between:
 *   - EnergyWizard_A_Steps_1_to_3_FIXED_v2.jsx
 *   - EnergyWizard_B_Step_4_to_7_FIXED_v5.jsx
 *   - MerlinSSOTTracker.jsx
 *   - Merlin_SSOT_Phase_Tracker.jsx
 *   - DataService.js
 * 
 * RULE: If a value appears in more than one file, it MUST be defined here.
 * Both wizard files reference this as "Source: merlinConstants.js SSOT".
 * 
 * Last Updated: February 10, 2026
 * Fix Count: 200+ cumulative (Phases 1-5: 160, CVR: 26, Post-ITC: 1, v3-v5 fixes: 13+)
 * Supplier Count: 74 (11 solar, 7 inverter, 10 BESS, 10 generator, 16 racking, 10 EV, 10 monitor)
 * ===========================================================================
 */

// ===========================================================================
// SECTION 1: FEDERAL TAX & INCENTIVE CONSTANTS
// ===========================================================================

/** ITC rate under IRA Sec48E (technology-neutral clean energy credit) */
export const ITC_RATE = 0.30;

/** Domestic content bonus (IRA Sec48E(a)(2)) -- additive if domestic content met */
export const ITC_DOMESTIC_BONUS = 0.10;

/** ITC basis reduction for depreciation (50% of ITC reduces depreciable basis) */
export const ITC_BASIS_HAIRCUT = 0.50;

/** MACRS depreciation schedule -- 5-year property, half-year convention */
export const MACRS_SCHEDULE = [0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576];

/** Bonus depreciation rate for assets placed in service in 2026 
 *  OBBBA Sec70301 (PL 119-21, July 4 2025): Permanent 100% bonus depreciation
 *  for property acquired and placed in service after January 19, 2025.
 *  Supersedes TCJA phasedown schedule. */
export const BONUS_DEPRECIATION_RATE = 1.00;

/** Assumed corporate tax rate for depreciation benefit calculation */
export const ASSUMED_TAX_RATE = 0.265;

/** Sec30C Alternative Fuel Vehicle Refueling Property Credit (EV charger) */
export const EV_CHARGER_CREDIT_RATE = 0.30;
export const EV_CHARGER_CREDIT_MAX = 100000; // Per location

/** Prevailing wage threshold -- projects > 1 MW must pay prevailing wages for full ITC */
export const PREVAILING_WAGE_THRESHOLD_MW = 1.0;

/** IRA safe harbor: begin construction deadline for 2026 rates */
export const IRA_SAFE_HARBOR_DEADLINE = '2026-07-04';

// ===========================================================================
// SECTION 2: FINANCING CONSTANTS
// ===========================================================================

/** Merlin Energy margin on equipment/labor (applied to gross cost) */
export const MERLIN_MARGIN_RATE = 0.18;

/** Commercial solar loan APR by term length */
export const LOAN_RATES = { 7: 5.5, 10: 5.9, 15: 6.2, 20: 6.5 };

/** Default loan parameters */
export const LOAN_DEFAULTS = { term: 15, downPct: 0 };

/** Lease parameters */
export const LEASE_DEFAULTS = { term: 15, escalator: 2.5, type: 'operating' };

/** PPA parameters */
export const PPA_DEFAULTS = { term: 25, rateType: 'fixed', escalator: 2.5 };

/** Utility rate escalation -- used for 25-year cashflow projections */
export const DEFAULT_RATE_ESCALATION = 0.035;

// ===========================================================================
// SECTION 3: SOLAR COST -- SIZE-TIERED (FIX F6: NREL 2025 ATB aligned)
// ===========================================================================

/** Solar installed cost per kW (roof-mount) by system size tier
 *  Source: NREL Annual Technology Baseline 2025 + Wood Mackenzie US Solar Market Insight
 *  Small systems have higher soft costs (permitting, design, overhead) per watt */
export const SOLAR_COST_PER_KW_TIERS = [
  { maxKW: 20,  costPerW: 3.20, note: 'Small commercial (<20kW) -- high soft costs' },
  { maxKW: 50,  costPerW: 2.80, note: 'Mid commercial (20-50kW)' },
  { maxKW: 200, costPerW: 2.50, note: 'Large commercial (50-200kW) -- benchmark' },
  { maxKW: Infinity, costPerW: 2.20, note: 'Utility-scale (>200kW) -- economies of scale' },
];

/** Carport solar structural premium over roof-mount */
export const CARPORT_COST_PER_W = 4.00; // $4.00/W = $2.50 base + $1.50 structural

/** Helper: get roof-mount solar cost/W for a given system size */
export const getSolarCostPerW = (systemKW) => {
  const tier = SOLAR_COST_PER_KW_TIERS.find(t => systemKW <= t.maxKW);
  return tier ? tier.costPerW : 2.50;
};

// ===========================================================================
// SECTION 4: BESS COST -- SIZE-TIERED
// ===========================================================================

/** BESS installed cost per kWh by capacity tier */
export const BESS_COST_PER_KWH_TIERS = [
  { maxKWh: 50,  costPerKWh: 750, note: 'Small (<50 kWh)' },
  { maxKWh: 100, costPerKWh: 480, note: 'Medium (50-100 kWh)' },
  { maxKWh: 500, costPerKWh: 350, note: 'Large (100-500 kWh)' },
  { maxKWh: Infinity, costPerKWh: 160, note: 'Utility-scale (>500 kWh)' },
];

/** Helper: get BESS cost/kWh for a given capacity */
export const getBessCostPerKWh = (capacityKWh) => {
  const tier = BESS_COST_PER_KWH_TIERS.find(t => capacityKWh <= t.maxKWh);
  return tier ? tier.costPerKWh : 350;
};

/** Generator cost per kW (natural gas, commercial) */
export const GENERATOR_COST_PER_KW = 550;

// ===========================================================================
// SECTION 5: SELF-CONSUMPTION RATE -- CONTINUOUS CURVE (FIX F3)
// ===========================================================================

/** Self-consumption rate as a function of solar offset percentage
 *  FIX F3: Replaced step function (which had value-destroying cliffs at 50%/80%/100%)
 *  with smooth linear interpolation between anchor points.
 *  
 *  Anchor points: 0%->98%, 50%->91%, 80%->81%, 100%->68%, 130%+->55% floor
 *  
 *  @param {number} solarKWh - Annual solar production
 *  @param {number} usageKWh - Annual facility consumption
 *  @returns {number} Self-consumption rate (0.55 to 0.98) */
export const getSelfConsumptionRate = (solarKWh, usageKWh) => {
  if (usageKWh <= 0) return 0.85;
  const offset = solarKWh / usageKWh;
  if (offset <= 0) return 0.98;
  if (offset <= 0.50) return 0.98 - (offset / 0.50) * 0.07;           // 98% -> 91%
  if (offset <= 0.80) return 0.91 - ((offset - 0.50) / 0.30) * 0.10;  // 91% -> 81%
  if (offset <= 1.00) return 0.81 - ((offset - 0.80) / 0.20) * 0.13;  // 81% -> 68%
  return Math.max(0.55, 0.68 - (offset - 1.00) * 0.43);               // 68% -> 55% floor
};

// ===========================================================================
// SECTION 6: STATE DATA -- 50 States + DC
// ===========================================================================

/** State incentives -- DSIRE database + state energy office programs (Feb 2026)
 *  FIX M1: Authoritative 50-state table (replaced A's 15-state subset) */
export const STATE_INCENTIVES = {
  // Northeast
  CT: { solarPerKW: 150, bessPerKWh: 200, maxBess: 50000, notes: 'RSIP residential + commercial' },
  DC: { solarPerKW: 100, bessPerKWh: 0, maxBess: 0, notes: 'DCSEU SREC program' },
  MA: { solarPerKW: 100, bessPerKWh: 250, maxBess: 75000, notes: 'SMART program + storage' },
  MD: { solarPerKW: 100, bessPerKWh: 150, maxBess: 30000, notes: 'SEIF + MEA programs' },
  ME: { solarPerKW: 30, bessPerKWh: 50, maxBess: 15000, notes: 'Efficiency Maine' },
  NH: { solarPerKW: 25, bessPerKWh: 0, maxBess: 0, notes: 'Commercial solar rebate (limited)' },
  NJ: { solarPerKW: 85, bessPerKWh: 100, maxBess: 30000, notes: 'SuSI + storage incentive' },
  NY: { solarPerKW: 200, bessPerKWh: 200, maxBess: 50000, notes: 'NY-Sun + storage adders' },
  PA: { solarPerKW: 25, bessPerKWh: 50, maxBess: 15000, notes: 'SREC + some utilities' },
  RI: { solarPerKW: 75, bessPerKWh: 100, maxBess: 20000, notes: 'REF commercial incentives' },
  VT: { solarPerKW: 50, bessPerKWh: 100, maxBess: 20000, notes: 'Bring Your Own Device' },
  // Southeast
  AL: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'TVA programs only' },
  AR: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Net metering only' },
  DE: { solarPerKW: 25, bessPerKWh: 0, maxBess: 0, notes: 'Green Energy Fund (limited)' },
  FL: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Net metering, no state rebate' },
  GA: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Limited state programs' },
  KY: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  LA: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Tax credit expired 2025' },
  MS: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  NC: { solarPerKW: 25, bessPerKWh: 0, maxBess: 0, notes: 'Duke Energy rebates' },
  SC: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'State tax credit 25%' },
  TN: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'TVA Green Connect' },
  VA: { solarPerKW: 0, bessPerKWh: 50, maxBess: 15000, notes: 'Grid transformation' },
  WV: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  // Midwest
  IA: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'Utility rebates vary' },
  IL: { solarPerKW: 50, bessPerKWh: 50, maxBess: 20000, notes: 'Illinois Shines' },
  IN: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Net metering reduced' },
  KS: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  MI: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'DTE/Consumers programs' },
  MN: { solarPerKW: 40, bessPerKWh: 50, maxBess: 15000, notes: 'Made in Minnesota solar' },
  MO: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Utility rebates only' },
  ND: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  NE: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Public power -- check utility' },
  OH: { solarPerKW: 0, bessPerKWh: 25, maxBess: 10000, notes: 'Limited programs' },
  OK: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  SD: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  WI: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'Focus on Energy rebate' },
  // West
  AZ: { solarPerKW: 0, bessPerKWh: 75, maxBess: 20000, notes: 'APS/SRP storage rebates' },
  CA: { solarPerKW: 0, bessPerKWh: 150, maxBess: 100000, notes: 'SGIP still active for storage' },
  CO: { solarPerKW: 50, bessPerKWh: 100, maxBess: 40000, notes: 'Xcel rebates, EnergySmart' },
  HI: { solarPerKW: 0, bessPerKWh: 200, maxBess: 50000, notes: 'Strong storage support' },
  ID: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  MT: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'Alternative energy credit' },
  NM: { solarPerKW: 30, bessPerKWh: 50, maxBess: 15000, notes: 'Solar Market Development' },
  NV: { solarPerKW: 0, bessPerKWh: 50, maxBess: 15000, notes: 'NV Energy programs' },
  OR: { solarPerKW: 50, bessPerKWh: 100, maxBess: 25000, notes: 'Energy Trust of Oregon' },
  TX: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Utility programs only' },
  UT: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'State tax credit (reduced)' },
  WA: { solarPerKW: 30, bessPerKWh: 50, maxBess: 15000, notes: 'Utility programs vary' },
  WY: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  // Territories
  AK: { solarPerKW: 0, bessPerKWh: 50, maxBess: 10000, notes: 'Rural microgrid grants' },
  default: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Check local utility' }
};

/** State solar production (kWh/kW/year) -- PVWATTS + state solar resource data */
export const STATE_SOLAR_PRODUCTION = {
  AZ: 1860, NV: 1770, NM: 1800, CA: 1650, UT: 1590, CO: 1560,
  TX: 1560, FL: 1530, GA: 1440, NC: 1350, SC: 1440, AL: 1350, MS: 1440, LA: 1440,
  VA: 1290, MD: 1230, DE: 1230, NJ: 1200, PA: 1140, NY: 1140, CT: 1140, RI: 1140, MA: 1140, DC: 1200,
  IL: 1230, IN: 1200, OH: 1140, MI: 1200, WI: 1200, MN: 1230, IA: 1260, MO: 1320, KS: 1500, NE: 1440,
  MT: 1350, WY: 1500, ID: 1440, WA: 1080, OR: 1200, VT: 1110, NH: 1140, ME: 1140,
  HI: 1560, AK: 840, TN: 1320, KY: 1260, WV: 1200, OK: 1500, AR: 1320, SD: 1350, ND: 1290,
  default: 1350
};

/** State utility rate escalation (10-yr CAGR, EIA commercial sector data) */
export const STATE_ESCALATION_RATES = {
  CA: 0.058, HI: 0.055, CT: 0.052, NH: 0.048, MA: 0.047, RI: 0.047, ME: 0.046, VT: 0.045,
  NY: 0.044, NJ: 0.043, AK: 0.042, MD: 0.040, IL: 0.040, PA: 0.039, DE: 0.038, OH: 0.037,
  MI: 0.035, WI: 0.035, MN: 0.034, IN: 0.034, VA: 0.033, NC: 0.032, SC: 0.031, GA: 0.030,
  CO: 0.030, AZ: 0.029, NV: 0.028, OR: 0.028, WA: 0.027, TN: 0.026, AL: 0.025, MS: 0.025,
  TX: 0.024, OK: 0.024, KS: 0.023, MO: 0.023, AR: 0.023, LA: 0.022, FL: 0.021, NM: 0.022,
  ID: 0.021, UT: 0.021, MT: 0.020, WY: 0.020, NE: 0.020, SD: 0.019, ND: 0.019, IA: 0.020,
  KY: 0.024, WV: 0.023, DC: 0.041, default: 0.030
};

/** Sales tax exempt states for solar equipment */
export const SOLAR_TAX_EXEMPT_STATES = new Set([
  'NJ','NY','CT','MA','MD','PA','RI','VT','AZ','CO','FL','IA','MN','MT','NV','NM','OH','OR','TX','VA','WA','WY'
]);

// ===========================================================================
// SECTION 7: WEATHER RISK DATA -- All 50 States + DC (scores 0-5)
// ===========================================================================

export const WEATHER_RISK_DATA = {
  AL: { hail: 2, wind: 3, tornado: 3, hurricane: 3, lightning: 4, snow: 1, cold: 1, heat: 4, wildfire: 2, flood: 3, earthquake: 1, drought: 2, grid: 3 },
  AK: { hail: 1, wind: 3, tornado: 0, hurricane: 0, lightning: 1, snow: 5, cold: 5, heat: 1, wildfire: 3, flood: 2, earthquake: 5, drought: 1, grid: 2 },
  AZ: { hail: 2, wind: 2, tornado: 1, hurricane: 0, lightning: 3, snow: 1, cold: 1, heat: 5, wildfire: 4, flood: 2, earthquake: 2, drought: 5, grid: 4 },
  AR: { hail: 3, wind: 3, tornado: 4, hurricane: 1, lightning: 4, snow: 2, cold: 2, heat: 4, wildfire: 2, flood: 3, earthquake: 3, drought: 2, grid: 3 },
  CA: { hail: 1, wind: 2, tornado: 1, hurricane: 0, lightning: 1, snow: 1, cold: 1, heat: 4, wildfire: 5, flood: 2, earthquake: 5, drought: 5, grid: 3 },
  CO: { hail: 4, wind: 3, tornado: 2, hurricane: 0, lightning: 3, snow: 4, cold: 3, heat: 2, wildfire: 4, flood: 2, earthquake: 2, drought: 3, grid: 4 },
  CT: { hail: 2, wind: 2, tornado: 1, hurricane: 2, lightning: 2, snow: 3, cold: 3, heat: 2, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  DE: { hail: 2, wind: 2, tornado: 1, hurricane: 2, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  DC: { hail: 2, wind: 2, tornado: 1, hurricane: 1, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 4 },
  FL: { hail: 2, wind: 3, tornado: 2, hurricane: 5, lightning: 5, snow: 0, cold: 1, heat: 4, wildfire: 3, flood: 4, earthquake: 0, drought: 2, grid: 3 },
  GA: { hail: 2, wind: 3, tornado: 3, hurricane: 3, lightning: 4, snow: 1, cold: 1, heat: 4, wildfire: 2, flood: 3, earthquake: 1, drought: 2, grid: 3 },
  HI: { hail: 1, wind: 2, tornado: 0, hurricane: 2, lightning: 2, snow: 0, cold: 0, heat: 2, wildfire: 3, flood: 3, earthquake: 4, drought: 2, grid: 3 },
  ID: { hail: 2, wind: 2, tornado: 1, hurricane: 0, lightning: 2, snow: 4, cold: 4, heat: 2, wildfire: 4, flood: 2, earthquake: 3, drought: 3, grid: 4 },
  IL: { hail: 3, wind: 3, tornado: 4, hurricane: 0, lightning: 3, snow: 3, cold: 4, heat: 3, wildfire: 1, flood: 3, earthquake: 2, drought: 1, grid: 3 },
  IN: { hail: 3, wind: 3, tornado: 3, hurricane: 0, lightning: 3, snow: 3, cold: 3, heat: 3, wildfire: 1, flood: 3, earthquake: 2, drought: 1, grid: 3 },
  IA: { hail: 4, wind: 3, tornado: 4, hurricane: 0, lightning: 3, snow: 4, cold: 4, heat: 3, wildfire: 1, flood: 3, earthquake: 1, drought: 2, grid: 4 },
  KS: { hail: 5, wind: 4, tornado: 5, hurricane: 0, lightning: 4, snow: 3, cold: 3, heat: 4, wildfire: 2, flood: 2, earthquake: 2, drought: 3, grid: 3 },
  KY: { hail: 2, wind: 2, tornado: 3, hurricane: 0, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 2, flood: 3, earthquake: 3, drought: 1, grid: 3 },
  LA: { hail: 2, wind: 3, tornado: 3, hurricane: 5, lightning: 4, snow: 1, cold: 1, heat: 5, wildfire: 2, flood: 4, earthquake: 1, drought: 1, grid: 2 },
  ME: { hail: 1, wind: 3, tornado: 1, hurricane: 1, lightning: 2, snow: 5, cold: 5, heat: 1, wildfire: 2, flood: 2, earthquake: 1, drought: 1, grid: 2 },
  MD: { hail: 2, wind: 2, tornado: 1, hurricane: 2, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  MA: { hail: 2, wind: 3, tornado: 1, hurricane: 2, lightning: 2, snow: 4, cold: 3, heat: 2, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  MI: { hail: 2, wind: 2, tornado: 2, hurricane: 0, lightning: 3, snow: 4, cold: 4, heat: 2, wildfire: 2, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  MN: { hail: 3, wind: 3, tornado: 3, hurricane: 0, lightning: 3, snow: 5, cold: 5, heat: 2, wildfire: 2, flood: 2, earthquake: 1, drought: 1, grid: 4 },
  MS: { hail: 2, wind: 3, tornado: 4, hurricane: 4, lightning: 4, snow: 1, cold: 1, heat: 5, wildfire: 2, flood: 3, earthquake: 2, drought: 1, grid: 2 },
  MO: { hail: 4, wind: 3, tornado: 4, hurricane: 0, lightning: 4, snow: 2, cold: 3, heat: 4, wildfire: 1, flood: 3, earthquake: 4, drought: 2, grid: 3 },
  MT: { hail: 3, wind: 3, tornado: 1, hurricane: 0, lightning: 2, snow: 4, cold: 5, heat: 2, wildfire: 4, flood: 2, earthquake: 3, drought: 2, grid: 3 },
  NE: { hail: 5, wind: 4, tornado: 4, hurricane: 0, lightning: 4, snow: 3, cold: 4, heat: 3, wildfire: 2, flood: 2, earthquake: 1, drought: 3, grid: 4 },
  NV: { hail: 1, wind: 2, tornado: 1, hurricane: 0, lightning: 2, snow: 2, cold: 2, heat: 5, wildfire: 4, flood: 2, earthquake: 3, drought: 5, grid: 4 },
  NH: { hail: 2, wind: 2, tornado: 1, hurricane: 1, lightning: 2, snow: 4, cold: 4, heat: 1, wildfire: 2, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  NJ: { hail: 2, wind: 2, tornado: 1, hurricane: 2, lightning: 3, snow: 3, cold: 2, heat: 3, wildfire: 1, flood: 3, earthquake: 1, drought: 1, grid: 3 },
  NM: { hail: 3, wind: 3, tornado: 1, hurricane: 0, lightning: 3, snow: 2, cold: 2, heat: 4, wildfire: 4, flood: 2, earthquake: 2, drought: 4, grid: 4 },
  NY: { hail: 2, wind: 2, tornado: 1, hurricane: 2, lightning: 2, snow: 4, cold: 4, heat: 2, wildfire: 1, flood: 2, earthquake: 2, drought: 1, grid: 3 },
  NC: { hail: 2, wind: 3, tornado: 3, hurricane: 4, lightning: 4, snow: 2, cold: 2, heat: 4, wildfire: 2, flood: 3, earthquake: 2, drought: 2, grid: 3 },
  ND: { hail: 4, wind: 4, tornado: 3, hurricane: 0, lightning: 3, snow: 5, cold: 5, heat: 2, wildfire: 2, flood: 3, earthquake: 1, drought: 2, grid: 3 },
  OH: { hail: 2, wind: 2, tornado: 3, hurricane: 0, lightning: 3, snow: 3, cold: 3, heat: 3, wildfire: 1, flood: 2, earthquake: 2, drought: 1, grid: 3 },
  OK: { hail: 5, wind: 5, tornado: 5, hurricane: 1, lightning: 5, snow: 2, cold: 2, heat: 5, wildfire: 3, flood: 3, earthquake: 3, drought: 3, grid: 3 },
  OR: { hail: 1, wind: 2, tornado: 1, hurricane: 0, lightning: 1, snow: 2, cold: 2, heat: 2, wildfire: 5, flood: 2, earthquake: 4, drought: 2, grid: 3 },
  PA: { hail: 2, wind: 2, tornado: 2, hurricane: 1, lightning: 3, snow: 3, cold: 3, heat: 2, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  RI: { hail: 2, wind: 3, tornado: 1, hurricane: 2, lightning: 2, snow: 3, cold: 3, heat: 2, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  SC: { hail: 2, wind: 3, tornado: 3, hurricane: 4, lightning: 4, snow: 1, cold: 1, heat: 4, wildfire: 2, flood: 3, earthquake: 2, drought: 2, grid: 3 },
  SD: { hail: 4, wind: 4, tornado: 3, hurricane: 0, lightning: 3, snow: 4, cold: 5, heat: 2, wildfire: 2, flood: 2, earthquake: 1, drought: 2, grid: 3 },
  TN: { hail: 3, wind: 3, tornado: 4, hurricane: 1, lightning: 4, snow: 2, cold: 2, heat: 4, wildfire: 2, flood: 3, earthquake: 4, drought: 1, grid: 3 },
  TX: { hail: 4, wind: 4, tornado: 5, hurricane: 4, lightning: 4, snow: 1, cold: 1, heat: 5, wildfire: 4, flood: 3, earthquake: 2, drought: 4, grid: 2 },
  UT: { hail: 2, wind: 2, tornado: 1, hurricane: 0, lightning: 2, snow: 3, cold: 3, heat: 3, wildfire: 4, flood: 2, earthquake: 3, drought: 4, grid: 4 },
  VT: { hail: 2, wind: 2, tornado: 1, hurricane: 1, lightning: 2, snow: 5, cold: 5, heat: 1, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 2 },
  VA: { hail: 2, wind: 2, tornado: 2, hurricane: 2, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 2, flood: 2, earthquake: 2, drought: 1, grid: 3 },
  WA: { hail: 1, wind: 2, tornado: 1, hurricane: 0, lightning: 1, snow: 2, cold: 2, heat: 2, wildfire: 5, flood: 2, earthquake: 4, drought: 2, grid: 3 },
  WV: { hail: 2, wind: 2, tornado: 1, hurricane: 0, lightning: 3, snow: 3, cold: 3, heat: 2, wildfire: 2, flood: 3, earthquake: 1, drought: 1, grid: 2 },
  WI: { hail: 3, wind: 2, tornado: 2, hurricane: 0, lightning: 3, snow: 4, cold: 5, heat: 2, wildfire: 2, flood: 2, earthquake: 1, drought: 1, grid: 4 },
  WY: { hail: 3, wind: 4, tornado: 1, hurricane: 0, lightning: 3, snow: 4, cold: 4, heat: 2, wildfire: 3, flood: 2, earthquake: 2, drought: 2, grid: 3 },
  default: { hail: 2, wind: 2, tornado: 2, hurricane: 1, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 2, flood: 2, earthquake: 2, drought: 2, grid: 3 }
};

// ===========================================================================
// SECTION 8: INDUSTRY PROFILES
// ===========================================================================

export const INDUSTRY_IDS = [
  'carwash', 'hospital', 'datacenter', 'retail', 'warehouse',
  'manufacturing', 'restaurant', 'gasstation', 'office', 'evcharging',
  'hotel', 'indoorfarm'
];

export const INDUSTRY_OPERATING_HOURS = {
  carwash: 12, hospital: 24, datacenter: 24, retail: 14, warehouse: 16,
  manufacturing: 16, restaurant: 14, gasstation: 24, office: 12, evcharging: 24,
  hotel: 24, indoorfarm: 18
};

// ===========================================================================
// SECTION 9: SUPPLIER DATABASE METADATA (v14 -- Feb 2026, 74 suppliers)
// ===========================================================================
// Full supplier specs are in EnergyWizard_B. This section tracks counts and
// public companies for SEC EDGAR financial health monitoring.

export const SUPPLIER_COUNTS = {
  solar: 11,     // Qcells, Canadian Solar, JinkoSolar, Silfab, First Solar, LONGi, Trina, REC, Maxeon, Heliene, Mission Solar
  inverter: 7,   // SolarEdge, Enphase, SMA, Sigenergy, Sungrow, Fronius, GoodWe
  bess: 10,      // Tesla, BYD, Enphase, Sungrow, Sigenergy, Fortress Power, SimpliPhi, Sonnen, Samsung SDI, EG4
  generator: 10, // Generac x2, Kohler, Cummins x2, Caterpillar, Briggs & Stratton, MTU, Gillette, Hipower
  racking: 16,   // IronRidge, Unirac, SnapNrack, Quick Mount PV, Schletter, GameChange, NextPower, K2, PanelClaw, EcoFasten, S:FLEX, Array Technologies, Trina Tracker, Arctech, Soltec, Flexrack
  evCharger: 10, // ChargePoint, Wallbox, Enel X, Grizzl-E, Emporia, Autel, ABB, Blink, Tesla, Siemens
  monitor: 10,   // Span, Sense, Emporia, Schneider, Leviton, Enphase, SolarEdge, Curb, Iotawatt, Rainforest
  total: 74
};

/** Public companies tracked via SEC EDGAR for live financial health scoring */
export const PUBLIC_SUPPLIERS = [
  'SolarEdge', 'Enphase', 'Tesla', 'Canadian Solar', 'JinkoSolar',
  'Generac', 'ChargePoint', 'First Solar', 'Maxeon', 'Sungrow', 'BYD',
  'ABB', 'Blink', 'Siemens', 'Briggs & Stratton', 'Schneider Electric', 'Caterpillar'
];

/** Supplier scorecard weight categories (16 categories, sum = 100%) */
export const SCORECARD_WEIGHTS = {
  reliability: 12, warranty: 10, efficiency: 10, bankability: 8,
  usMade: 8, ira: 8, tariffRisk: 7, feoc: 7,
  leadTime: 5, serviceNetwork: 5, techInnovation: 5, scalability: 4,
  certifications: 4, environmental: 3, priceValue: 2, customerSat: 2
};

// ===========================================================================
// SECTION 10: SSOT TRACKING METADATA
// ===========================================================================

export const SSOT_VERSION = {
  version: '6.0',
  lastUpdated: '2026-02-11',
  totalFixes: 232,
  phases: [
    { phase: 1, name: 'Legal & ITC', fixes: 14, status: 'complete' },
    { phase: 2, name: 'Data Accuracy', fixes: 28, status: 'complete' },
    { phase: 3, name: 'Financial Engine', fixes: 42, status: 'complete' },
    { phase: 4, name: 'Supplier & Compliance', fixes: 48, status: 'complete' },
    { phase: 5, name: 'Stress Test & Supplier Expansion', fixes: 28, status: 'complete' },
  ],
  knownFlaws: [
    { id: 'F1', title: 'Consumption is state-independent', severity: 'medium', status: 'fixed' },
    { id: 'F2', title: 'Peak demand is state-independent', severity: 'low-medium', status: 'fixed' },
    { id: 'F3', title: 'Self-consumption cliff', severity: 'medium', status: 'fixed' },
    { id: 'F4', title: 'Default 300 vehicles for all wash types', severity: 'medium', status: 'fixed' },
    { id: 'F5', title: 'BESS flat 30% regardless of demand charge', severity: 'low-medium', status: 'fixed' },
    { id: 'F6', title: 'Flat solar $/W', severity: 'medium', status: 'fixed' },
    { id: 'F7', title: 'Generator always in gross cost', severity: 'low', status: 'fixed' },
  ],
  testHarness: {
    scenarios102: { errors: 0, warnings: 0, anomalies: 0, lastRun: '2026-02-09' },
    scenarios1294: { errors: 0, warnings: 2, anomalies: 0, lastRun: '2026-02-09' },
  }
};

// ===========================================================================
// DEFAULT EXPORT -- All constants as a single object
// ===========================================================================

// === SSOT #27: Silver cost impact on solar panel pricing (BloombergNEF 2026) ===
export const SILVER_COST_PCT_OF_PANEL = 0.29; // 29% of panel mfg cost as of 2026 (up from 3% in 2023)
export const SILVER_SPOT_USD_OZ = 33.50; // Approximate spot price Feb 2026

// === SSOT #26: BESS degradation defaults (overridden by supplier cycle_life) ===
export const BESS_DEGRADATION_DEFAULT = 0.02; // 2%/yr fallback when supplier data missing
export const BESS_DEGRADATION_FROM_CYCLES = (cycles) => {
  // Derive annual degradation from cycle life: assumes 365 cycles/yr (C&I typical)
  if (!cycles || cycles <= 0) return BESS_DEGRADATION_DEFAULT;
  const effectiveYears = cycles / 365;
  return Math.max(0.005, Math.min(0.04, 0.20 / effectiveYears));
};

// === M-6: Carbon credit pricing (Verra VCUs voluntary market) ===
export const CARBON_CREDIT_PRICE = 12; // $/tCO2 -- Verra VCUs $8-15, Gold Standard $10-25; conservative baseline

// === CQ-3: Extracted magic numbers -- central reference for financial engine ===
export const SYSTEM_LOSSES_PCT = 0.14; // 14% PVWatts system losses (industry standard commercial)
export const DEFAULT_ELECTRIC_RATE = 0.19; // $/kWh fallback rate when API unavailable
export const DEFAULT_DEMAND_CHARGE = 15; // $/kW fallback demand charge
export const BILL_RECONCILIATION_THRESHOLD = 0.30; // 30% divergence triggers auto-sync
export const INVERTER_REPLACE_YEAR = 12; // Year inverter replacement occurs
export const BESS_REPLACE_YEAR = 15; // Year BESS replacement occurs
export const PROJECT_LIFETIME_YEARS = 25; // Standard commercial project analysis period
export const DC_AC_RATIO = 1.2; // Standard DC/AC ratio for commercial solar
export const DEFAULT_TILT = 20; // Default roof tilt angle (degrees)
export const MIN_ANNUAL_BILL = 6000; // Minimum annual bill clamp
export const MAX_ANNUAL_BILL = 300000; // Maximum annual bill clamp
export const PVWATTS_MODULE_TYPES = { standard: 0, premium: 1, thinFilm: 2 }; // M-5: PVWatts module type mapping

// ═══ SHARED CLIMATE & GAS STRUCTURES (extracted from WizA/WizB to eliminate duplication) ═══
export const STATE_CLIMATE = {
  'AL': { hdd: 2600, climateZone: 'hot', heatingMonths: 3 },
  'AK': { hdd: 10500, climateZone: 'cold', heatingMonths: 8 },
  'AZ': { hdd: 1400, climateZone: 'hot', heatingMonths: 2 },
  'AR': { hdd: 3200, climateZone: 'moderate', heatingMonths: 4 },
  'CA': { hdd: 3000, climateZone: 'moderate', heatingMonths: 4 },
  'CO': { hdd: 6200, climateZone: 'cold', heatingMonths: 6 },
  'CT': { hdd: 5800, climateZone: 'cold', heatingMonths: 6 },
  'DE': { hdd: 4600, climateZone: 'moderate', heatingMonths: 5 },
  'FL': { hdd: 700, climateZone: 'hot', heatingMonths: 1 },
  'GA': { hdd: 2800, climateZone: 'hot', heatingMonths: 3 },
  'HI': { hdd: 0, climateZone: 'hot', heatingMonths: 0 },
  'ID': { hdd: 5800, climateZone: 'cold', heatingMonths: 6 },
  'IL': { hdd: 6200, climateZone: 'cold', heatingMonths: 6 },
  'IN': { hdd: 5600, climateZone: 'cold', heatingMonths: 6 },
  'IA': { hdd: 6600, climateZone: 'cold', heatingMonths: 6 },
  'KS': { hdd: 5000, climateZone: 'moderate', heatingMonths: 5 },
  'KY': { hdd: 4400, climateZone: 'moderate', heatingMonths: 5 },
  'LA': { hdd: 1600, climateZone: 'hot', heatingMonths: 2 },
  'ME': { hdd: 7500, climateZone: 'cold', heatingMonths: 7 },
  'MD': { hdd: 4600, climateZone: 'moderate', heatingMonths: 5 },
  'MA': { hdd: 5800, climateZone: 'cold', heatingMonths: 6 },
  'MI': { hdd: 6400, climateZone: 'cold', heatingMonths: 6 },
  'MN': { hdd: 7900, climateZone: 'cold', heatingMonths: 7 },
  'MS': { hdd: 2400, climateZone: 'hot', heatingMonths: 3 },
  'MO': { hdd: 4800, climateZone: 'moderate', heatingMonths: 5 },
  'MT': { hdd: 7200, climateZone: 'cold', heatingMonths: 7 },
  'NE': { hdd: 6200, climateZone: 'cold', heatingMonths: 6 },
  'NV': { hdd: 3500, climateZone: 'hot', heatingMonths: 4 },
  'NH': { hdd: 7200, climateZone: 'cold', heatingMonths: 7 },
  'NJ': { hdd: 5000, climateZone: 'moderate', heatingMonths: 5 },
  'NM': { hdd: 4400, climateZone: 'moderate', heatingMonths: 5 },
  'NY': { hdd: 5800, climateZone: 'cold', heatingMonths: 6 },
  'NC': { hdd: 3600, climateZone: 'moderate', heatingMonths: 4 },
  'ND': { hdd: 8600, climateZone: 'cold', heatingMonths: 7 },
  'OH': { hdd: 5600, climateZone: 'cold', heatingMonths: 6 },
  'OK': { hdd: 3600, climateZone: 'moderate', heatingMonths: 4 },
  'OR': { hdd: 4800, climateZone: 'moderate', heatingMonths: 5 },
  'PA': { hdd: 5400, climateZone: 'cold', heatingMonths: 6 },
  'RI': { hdd: 5600, climateZone: 'cold', heatingMonths: 6 },
  'SC': { hdd: 2800, climateZone: 'hot', heatingMonths: 3 },
  'SD': { hdd: 7200, climateZone: 'cold', heatingMonths: 7 },
  'TN': { hdd: 3800, climateZone: 'moderate', heatingMonths: 4 },
  'TX': { hdd: 2200, climateZone: 'hot', heatingMonths: 3 },
  'UT': { hdd: 5600, climateZone: 'cold', heatingMonths: 6 },
  'VT': { hdd: 7400, climateZone: 'cold', heatingMonths: 7 },
  'VA': { hdd: 4200, climateZone: 'moderate', heatingMonths: 5 },
  'WA': { hdd: 5200, climateZone: 'moderate', heatingMonths: 5 },
  'WV': { hdd: 4800, climateZone: 'moderate', heatingMonths: 5 },
  'WI': { hdd: 7200, climateZone: 'cold', heatingMonths: 7 },
  'WY': { hdd: 7400, climateZone: 'cold', heatingMonths: 7 },
  'default': { hdd: 5000, climateZone: 'moderate', heatingMonths: 5 }
};

export const CAR_WASH_CLIMATE_ADJUSTMENTS = {
  hot: {
    waterTemp: { inlet: 72, target: 110, delta: 38, heaterMultiplier: 0.7 },
    dryerEfficiency: 1.15, evaporationRate: 0.18,
    peakDemandMultiplier: 1.25, hvacLoad: 12,
    chemicalAdjustment: 1.1, waterUsageMultiplier: 1.15,
    description: 'Hot climate: lower heating demand, higher cooling/evaporation'
  },
  moderate: {
    waterTemp: { inlet: 55, target: 110, delta: 55, heaterMultiplier: 1.0 },
    dryerEfficiency: 1.0, evaporationRate: 0.12,
    peakDemandMultiplier: 1.0, hvacLoad: 8,
    chemicalAdjustment: 1.0, waterUsageMultiplier: 1.0,
    description: 'Moderate climate: baseline heating and drying demands'
  },
  cold: {
    waterTemp: { inlet: 42, target: 120, delta: 78, heaterMultiplier: 1.45 },
    dryerEfficiency: 0.82, evaporationRate: 0.06,
    peakDemandMultiplier: 1.35, hvacLoad: 18,
    chemicalAdjustment: 1.15, waterUsageMultiplier: 0.85,
    sumpHeater: 2.5, pitHeater: 1.5,
    description: 'Cold climate: high heating demand, reduced drying efficiency, freeze protection'
  }
};

export const getClimateAdjustments = (state) => {
  const stateClimate = STATE_CLIMATE[state] || STATE_CLIMATE['default'];
  const zone = stateClimate.climateZone;
  return {
    ...CAR_WASH_CLIMATE_ADJUSTMENTS[zone] || CAR_WASH_CLIMATE_ADJUSTMENTS.moderate,
    climateZone: zone,
    hdd: stateClimate.hdd,
    state
  };
};

export const BUSINESS_GAS_PROFILES = {
  'carwash_express': {
    baseTherm: 150, hotWaterMultiplier: 1.8, heatingMultiplier: 0.8,
    processGas: 20, description: 'Express tunnel — high hot water, moderate space heat'
  },
  'carwash_fullService': {
    baseTherm: 250, hotWaterMultiplier: 2.2, heatingMultiplier: 1.0,
    processGas: 30, description: 'Full-service — very high hot water + detail area heating'
  },
  'carwash_mini': {
    baseTherm: 100, hotWaterMultiplier: 1.5, heatingMultiplier: 0.7,
    processGas: 15, description: 'Mini-tunnel — moderate hot water, smaller footprint'
  },
  'carwash_iba': {
    baseTherm: 80, hotWaterMultiplier: 1.2, heatingMultiplier: 0.6,
    processGas: 10, description: 'In-bay auto — single bay, lower throughput'
  },
  'carwash_self': {
    baseTherm: 40, hotWaterMultiplier: 0.5, heatingMultiplier: 0.4,
    processGas: 5, description: 'Self-serve — minimal hot water, wand bays only'
  },
  'hotel': {
    baseTherm: 200, hotWaterMultiplier: 2.0, heatingMultiplier: 1.2,
    processGas: 40, description: 'High hot water + laundry demand'
  },
  'indoorfarm': {
    baseTherm: 60, hotWaterMultiplier: 0.3, heatingMultiplier: 0.5,
    processGas: 30, description: 'CO2 supplementation, climate control assist'
  },
  'default': {
    baseTherm: 120, hotWaterMultiplier: 1.0, heatingMultiplier: 1.0,
    processGas: 15, description: 'Generic commercial — baseline gas usage'
  }
};

const merlinConstants = {
  // Federal
  ITC_RATE, ITC_DOMESTIC_BONUS, ITC_BASIS_HAIRCUT,
  MACRS_SCHEDULE, BONUS_DEPRECIATION_RATE, ASSUMED_TAX_RATE,
  EV_CHARGER_CREDIT_RATE, EV_CHARGER_CREDIT_MAX,
  PREVAILING_WAGE_THRESHOLD_MW, IRA_SAFE_HARBOR_DEADLINE,
  // Financing
  MERLIN_MARGIN_RATE, LOAN_RATES, LOAN_DEFAULTS, LEASE_DEFAULTS, PPA_DEFAULTS,
  DEFAULT_RATE_ESCALATION,
  // Solar cost
  SOLAR_COST_PER_KW_TIERS, CARPORT_COST_PER_W, getSolarCostPerW,
  // BESS cost
  BESS_COST_PER_KWH_TIERS, getBessCostPerKWh, GENERATOR_COST_PER_KW,
  // Self-consumption
  getSelfConsumptionRate,
  // State data
  STATE_INCENTIVES, STATE_SOLAR_PRODUCTION, STATE_ESCALATION_RATES, SOLAR_TAX_EXEMPT_STATES,
  // Weather
  WEATHER_RISK_DATA,
  // Industries
  INDUSTRY_IDS, INDUSTRY_OPERATING_HOURS,
  // Suppliers
  SUPPLIER_COUNTS, PUBLIC_SUPPLIERS, SCORECARD_WEIGHTS,
  // SSOT #27: Silver cost impact on panel pricing (BloombergNEF 2026)
  SILVER_COST_PCT_OF_PANEL, SILVER_SPOT_USD_OZ,
  // SSOT #26: BESS degradation (supplier-derived)
  BESS_DEGRADATION_DEFAULT, BESS_DEGRADATION_FROM_CYCLES,
  // M-6: Carbon credit pricing
  CARBON_CREDIT_PRICE,
  // Shared climate & gas (extracted from WizA/WizB)
  STATE_CLIMATE, CAR_WASH_CLIMATE_ADJUSTMENTS, getClimateAdjustments, BUSINESS_GAS_PROFILES,
  // Meta
  SSOT_VERSION,
};

export default merlinConstants;


