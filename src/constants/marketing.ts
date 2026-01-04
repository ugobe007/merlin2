/**
 * Marketing Constants
 * ====================
 *
 * Static display values for marketing materials, landing pages, and demos.
 * These are NOT used for actual quote calculations - use QuoteEngine for that.
 *
 * @module marketing
 * @version 1.0.0
 */

/**
 * Hero section display statistics
 * Used for eye-catching numbers on landing pages
 */
export const HERO_STATS = {
  /** Average savings percentage shown to users */
  averageSavingsPercent: 30,
  /** Typical payback period for marketing */
  typicalPaybackYears: 5,
  /** Approximate homes powered per MW (for visualization) */
  homesPerMW: 200,
} as const;

/**
 * Simplified pricing for display-only calculations
 * These are ballpark figures for UI previews - actual quotes use QuoteEngine
 */
export const DISPLAY_PRICING = {
  /** Approximate $/kWh for battery systems (display only) */
  batteryPerKWh: 200,
  /** Approximate $/MW for PCS (display only) */
  pcsPerMW: 80000,
  /** Approximate $/MW for transformers (display only) */
  transformersPerMW: 25000,
  /** Approximate $/MW for inverters (display only) */
  invertersPerMW: 15000,
  /** Approximate $/MW for switchgear (display only) */
  switchgearPerMW: 20000,
  /** Microgrid controls base cost */
  microgridControlsBase: 50000,
} as const;

/**
 * Use case showcase examples for the landing page
 * These are pre-defined demo configurations
 */
export const SHOWCASE_USE_CASES = [
  {
    industry: "Hotel & Hospitality",
    systemSizeMW: 0.5,
    duration: 4,
    systemSize: "0.5 MW / 2 MWh",
  },
  {
    industry: "Manufacturing",
    systemSizeMW: 2.0,
    duration: 4,
    systemSize: "2.0 MW / 8 MWh",
  },
  {
    industry: "Car Wash",
    systemSizeMW: 1.5,
    duration: 4,
    systemSize: "1.5 MW / 6 MWh",
  },
  {
    industry: "Data Center",
    systemSizeMW: 5.0,
    duration: 4,
    systemSize: "5.0 MW / 20 MWh",
  },
  {
    industry: "EV Charging Hub",
    systemSizeMW: 4.0,
    duration: 4,
    systemSize: "4.0 MW / 16 MWh",
  },
  {
    industry: "Office Building",
    systemSizeMW: 1.2,
    duration: 4,
    systemSize: "1.2 MW / 4.8 MWh",
  },
] as const;

/**
 * Percentage multipliers for cost estimation (display only)
 */
export const COST_MULTIPLIERS = {
  tariffPercent: 5,
  shippingPercent: 3,
  defaultBosPercent: 15,
  defaultEpcPercent: 20,
} as const;
