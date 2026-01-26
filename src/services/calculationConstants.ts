/**
 * SSOT Calculation Constants
 * January 21, 2026
 * 
 * Centralized constants for all calculation logic.
 * These should eventually come from database or SSOT services.
 */

// TODO: SSOT-001 - Move to database (calculation_constants table)
// Priority: High | Est: 30 min | Ticket: MERLIN-XXX
export const SAVINGS_BREAKDOWN_DEFAULTS = {
  PEAK_SHAVING: 0.45,        // 45% - Source: NREL ATB 2024
  ARBITRAGE: 0.25,           // 25% - Source: Industry standard
  SOLAR_INTEGRATION: 0.30,   // 30% - Source: SEIA 2024
  DEMAND_RESPONSE: 0.10,     // 10% - Source: Grid operator data
} as const;

// TODO: SSOT-002 - Replace with utilityRateService.getCommercialRateByZip()
// Priority: High | Est: 15 min | Ticket: MERLIN-XXX
export const DEFAULT_ELECTRICITY_RATE = 0.12; // $/kWh - US commercial average
export const DEFAULT_DEMAND_CHARGE = 15;      // $/kW/month - US commercial average

// Solar capacity factors by region
// TODO: SSOT-003 - Use PVWatts API for location-specific values
export const SOLAR_CAPACITY_FACTORS = {
  DEFAULT: 0.20,
  SOUTHWEST: 0.23,  // AZ, NM, NV
  CALIFORNIA: 0.21,
  TEXAS: 0.19,
  FLORIDA: 0.18,
  NORTHEAST: 0.14,
  PACIFIC_NW: 0.13,
} as const;

export const PROJECTION_YEARS = {
  SHORT_TERM: 10,
  LONG_TERM: 25,
} as const;
