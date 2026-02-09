/**
 * SHARED STATE UTILITY RATES
 * ===========================
 * 
 * Single source of truth for state-level electricity rates and demand charges.
 * Previously duplicated across CarWashEnergy, HotelEnergy, and EVChargingEnergy.
 * 
 * These are UI fallback rates used when ZIP-based dynamic rates are unavailable.
 * The dynamic utilityRateService.ts (via useUtilityRates hook) takes precedence.
 * 
 * Sources: EIA State Average Rates (2024), commercial tariff schedules
 * 
 * Created: Feb 7, 2026
 */

export interface StateRateData {
  /** Commercial electricity rate ($/kWh) */
  rate: number;
  /** Commercial demand charge ($/kW/month) */
  demandCharge: number;
}

/**
 * Base commercial electricity rates by state.
 * Demand charges represent typical commercial demand rates.
 * 
 * For vertical-specific overrides (e.g., higher EV demand charges),
 * use getVerticalDemandCharge() with the adjustment factor.
 */
export const STATE_RATES: Record<string, StateRateData> = {
  'Alabama':        { rate: 0.13, demandCharge: 12 },
  'Alaska':         { rate: 0.22, demandCharge: 16 },
  'Arizona':        { rate: 0.13, demandCharge: 18 },
  'Arkansas':       { rate: 0.10, demandCharge: 11 },
  'California':     { rate: 0.22, demandCharge: 25 },
  'Colorado':       { rate: 0.12, demandCharge: 14 },
  'Connecticut':    { rate: 0.21, demandCharge: 20 },
  'Delaware':       { rate: 0.12, demandCharge: 14 },
  'Florida':        { rate: 0.14, demandCharge: 13 },
  'Georgia':        { rate: 0.12, demandCharge: 13 },
  'Hawaii':         { rate: 0.34, demandCharge: 30 },
  'Idaho':          { rate: 0.10, demandCharge: 10 },
  'Illinois':       { rate: 0.13, demandCharge: 14 },
  'Indiana':        { rate: 0.12, demandCharge: 12 },
  'Iowa':           { rate: 0.11, demandCharge: 11 },
  'Kansas':         { rate: 0.12, demandCharge: 13 },
  'Kentucky':       { rate: 0.11, demandCharge: 11 },
  'Louisiana':      { rate: 0.10, demandCharge: 12 },
  'Maine':          { rate: 0.17, demandCharge: 16 },
  'Maryland':       { rate: 0.14, demandCharge: 15 },
  'Massachusetts':  { rate: 0.22, demandCharge: 20 },
  'Michigan':       { rate: 0.16, demandCharge: 16 },
  'Minnesota':      { rate: 0.13, demandCharge: 13 },
  'Mississippi':    { rate: 0.11, demandCharge: 11 },
  'Missouri':       { rate: 0.11, demandCharge: 12 },
  'Montana':        { rate: 0.11, demandCharge: 11 },
  'Nebraska':       { rate: 0.10, demandCharge: 11 },
  'Nevada':         { rate: 0.11, demandCharge: 16 },
  'New Hampshire':  { rate: 0.19, demandCharge: 18 },
  'New Jersey':     { rate: 0.16, demandCharge: 17 },
  'New Mexico':     { rate: 0.12, demandCharge: 13 },
  'New York':       { rate: 0.20, demandCharge: 22 },
  'North Carolina': { rate: 0.11, demandCharge: 12 },
  'North Dakota':   { rate: 0.10, demandCharge: 10 },
  'Ohio':           { rate: 0.12, demandCharge: 13 },
  'Oklahoma':       { rate: 0.10, demandCharge: 11 },
  'Oregon':         { rate: 0.11, demandCharge: 12 },
  'Pennsylvania':   { rate: 0.14, demandCharge: 14 },
  'Rhode Island':   { rate: 0.21, demandCharge: 20 },
  'South Carolina': { rate: 0.12, demandCharge: 12 },
  'South Dakota':   { rate: 0.11, demandCharge: 11 },
  'Tennessee':      { rate: 0.11, demandCharge: 11 },
  'Texas':          { rate: 0.12, demandCharge: 15 },
  'Utah':           { rate: 0.10, demandCharge: 12 },
  'Vermont':        { rate: 0.18, demandCharge: 16 },
  'Virginia':       { rate: 0.12, demandCharge: 13 },
  'Washington':     { rate: 0.10, demandCharge: 10 },
  'West Virginia':  { rate: 0.11, demandCharge: 11 },
  'Wisconsin':      { rate: 0.13, demandCharge: 13 },
  'Wyoming':        { rate: 0.10, demandCharge: 10 },
  'Other':          { rate: 0.13, demandCharge: 15 },
};

/** All state names (sorted) for select dropdowns */
export const STATE_NAMES = Object.keys(STATE_RATES).filter(s => s !== 'Other').sort();

/**
 * Get rate data for a state, with fallback to 'Other'
 */
export function getStateRate(state: string): StateRateData {
  return STATE_RATES[state] || STATE_RATES['Other'];
}

/**
 * Get demand charge with a vertical-specific multiplier.
 * EV charging stations face higher demand charges due to spike patterns.
 * Hotels and car washes are closer to base commercial rates.
 */
export function getVerticalDemandCharge(
  state: string,
  verticalMultiplier: number = 1.0
): number {
  const base = getStateRate(state);
  return Math.round(base.demandCharge * verticalMultiplier);
}
