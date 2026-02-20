/**
 * UI CONFIGURATION SERVICE - Single Source of Truth for UI Limits
 * ================================================================
 *
 * All UI input constraints (min/max values) are fetched from the database
 * to ensure consistency across the application. No hardcoded limits!
 *
 * Usage:
 *   const limits = await getUILimits('car_wash_ui_limits');
 *   <input min={limits.numberOfBays.min} max={limits.numberOfBays.max} />
 *
 * Created: November 30, 2025
 */

import { supabase } from "./supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export interface UIFieldLimit {
  min: number;
  max: number;
  default: number;
  step: number;
  label: string;
  unit?: string;
  powerKW?: number; // For equipment that has power rating
}

export interface CarWashUILimits {
  numberOfBays: UIFieldLimit;
  carsPerDay: UIFieldLimit;
  tunnelLength: UIFieldLimit;
  standardBlowers: UIFieldLimit;
  vacuumStations: UIFieldLimit;
  highPressurePumps: UIFieldLimit;
  topBrushes: UIFieldLimit;
  wrapAroundBrushes: UIFieldLimit;
  mitterCurtains: UIFieldLimit;
  wheelBrushes: UIFieldLimit;
  chemicalStations: UIFieldLimit;
  airCompressorHP: UIFieldLimit;
  solarRoofArea: UIFieldLimit;
  hoursPerDay: UIFieldLimit;
  daysPerWeek: UIFieldLimit;
  targetSavingsPercent: UIFieldLimit;
  currentMonthlyBill: UIFieldLimit;
}

export interface BESSUILimits {
  storageSizeMW: UIFieldLimit;
  durationHours: UIFieldLimit;
  electricityRate: UIFieldLimit;
  demandChargeRate: UIFieldLimit;
  solarMW: UIFieldLimit;
  projectLifeYears: UIFieldLimit;
  discountRate: UIFieldLimit;
}

// ============================================================================
// DEFAULT VALUES (Fallback when database unavailable)
// ============================================================================

const DEFAULT_CAR_WASH_LIMITS: CarWashUILimits = {
  numberOfBays: { min: 1, max: 20, default: 4, step: 1, label: "Number of Wash Bays" },
  carsPerDay: { min: 25, max: 1000, default: 150, step: 25, label: "Cars Washed per Day" },
  tunnelLength: { min: 60, max: 300, default: 120, step: 10, unit: "ft", label: "Tunnel Length" },
  standardBlowers: {
    min: 0,
    max: 20,
    default: 6,
    step: 1,
    powerKW: 7.5,
    label: "Standard Blowers",
  },
  vacuumStations: { min: 0, max: 40, default: 8, step: 1, powerKW: 3, label: "Vacuum Stations" },
  highPressurePumps: {
    min: 0,
    max: 8,
    default: 2,
    step: 1,
    powerKW: 11,
    label: "High-Pressure Pump Stations",
  },
  topBrushes: { min: 0, max: 6, default: 2, step: 1, powerKW: 4, label: "Top Brushes" },
  wrapAroundBrushes: {
    min: 0,
    max: 8,
    default: 4,
    step: 1,
    powerKW: 3.7,
    label: "Wrap-Around Brushes",
  },
  mitterCurtains: { min: 0, max: 6, default: 2, step: 1, powerKW: 1, label: "Mitter Curtains" },
  wheelBrushes: { min: 0, max: 8, default: 4, step: 1, powerKW: 0.6, label: "Wheel Brushes" },
  chemicalStations: {
    min: 0,
    max: 8,
    default: 4,
    step: 1,
    powerKW: 1.5,
    label: "Chemical Pump Stations",
  },
  airCompressorHP: { min: 5, max: 50, default: 10, step: 5, label: "Air Compressor (HP)" },
  solarRoofArea: {
    min: 0,
    max: 50000,
    default: 5000,
    step: 500,
    unit: "sqft",
    label: "Available Roof Area for Solar",
  },
  hoursPerDay: { min: 6, max: 24, default: 12, step: 1, label: "Operating Hours per Day" },
  daysPerWeek: { min: 5, max: 7, default: 7, step: 1, label: "Operating Days per Week" },
  targetSavingsPercent: {
    min: 10,
    max: 80,
    default: 40,
    step: 5,
    label: "Target Demand Reduction %",
  },
  currentMonthlyBill: {
    min: 500,
    max: 50000,
    default: 5000,
    step: 100,
    label: "Current Monthly Electric Bill",
  },
};

const DEFAULT_BESS_LIMITS: BESSUILimits = {
  storageSizeMW: { min: 0.05, max: 100, default: 1, step: 0.05, label: "Storage Size (MW)" },
  durationHours: { min: 1, max: 8, default: 4, step: 1, label: "Duration (Hours)" },
  electricityRate: {
    min: 0.05,
    max: 0.5,
    default: 0.12,
    step: 0.01,
    unit: "$/kWh",
    label: "Electricity Rate",
  },
  demandChargeRate: {
    min: 5,
    max: 50,
    default: 15,
    step: 1,
    unit: "$/kW",
    label: "Demand Charge Rate",
  },
  solarMW: { min: 0, max: 50, default: 0, step: 0.1, label: "Solar Capacity (MW)" },
  projectLifeYears: { min: 10, max: 30, default: 25, step: 5, label: "Project Life (Years)" },
  discountRate: { min: 0.04, max: 0.15, default: 0.08, step: 0.01, label: "Discount Rate" },
};

// ============================================================================
// CACHE
// ============================================================================

const uiLimitsCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Fetch UI limits from database with caching
 */
export async function getUILimits<T = Record<string, UIFieldLimit>>(configKey: string): Promise<T> {
  // Check cache first
  const cached = uiLimitsCache.get(configKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  try {
    const { data, error } = await supabase
      .from("pricing_configurations")
      .select("config_data")
      .eq("config_key", configKey)
      .eq("is_active", true)
      .single();

    if (error || !data?.config_data) {
      console.warn(`[UIConfigService] Config '${configKey}' not found, using defaults`);
      return getDefaultLimits(configKey) as T;
    }

    // Cache the result
    uiLimitsCache.set(configKey, { data: data.config_data, timestamp: Date.now() });
    if (import.meta.env.DEV) console.log(`✅ [UIConfigService] Loaded '${configKey}' from database`);

    return data.config_data as T;
  } catch (error) {
    console.error(`[UIConfigService] Error fetching '${configKey}':`, error);
    return getDefaultLimits(configKey) as T;
  }
}

/**
 * Get default limits when database is unavailable
 */
function getDefaultLimits(configKey: string): any {
  switch (configKey) {
    case "car_wash_ui_limits":
      return DEFAULT_CAR_WASH_LIMITS;
    case "bess_ui_limits":
      return DEFAULT_BESS_LIMITS;
    case "state_electricity_rates":
      return DEFAULT_STATE_RATES;
    default:
      console.warn(`[UIConfigService] No defaults for '${configKey}'`);
      return {};
  }
}

/**
 * Get car wash UI limits specifically (typed)
 */
export async function getCarWashUILimits(): Promise<CarWashUILimits> {
  return getUILimits<CarWashUILimits>("car_wash_ui_limits");
}

/**
 * Get BESS UI limits specifically (typed)
 */
export async function getBESSUILimits(): Promise<BESSUILimits> {
  return getUILimits<BESSUILimits>("bess_ui_limits");
}

// ============================================================================
// STATE ELECTRICITY RATES
// ============================================================================

export interface StateRateData {
  rate: number; // $/kWh base rate
  demandCharge: number; // $/kW demand charge
  peakRate: number; // $/kWh peak rate
}

export type StateRates = Record<string, StateRateData>;

const DEFAULT_STATE_RATES: StateRates = {
  California: { rate: 0.22, demandCharge: 25, peakRate: 0.35 },
  Texas: { rate: 0.12, demandCharge: 15, peakRate: 0.18 },
  Florida: { rate: 0.14, demandCharge: 12, peakRate: 0.2 },
  "New York": { rate: 0.2, demandCharge: 22, peakRate: 0.32 },
  Arizona: { rate: 0.13, demandCharge: 18, peakRate: 0.22 },
  Nevada: { rate: 0.11, demandCharge: 16, peakRate: 0.18 },
  Colorado: { rate: 0.12, demandCharge: 14, peakRate: 0.19 },
  Washington: { rate: 0.1, demandCharge: 10, peakRate: 0.14 },
  Oregon: { rate: 0.11, demandCharge: 11, peakRate: 0.15 },
  Georgia: { rate: 0.12, demandCharge: 13, peakRate: 0.17 },
  Other: { rate: 0.13, demandCharge: 15, peakRate: 0.19 },
};

/**
 * Get state electricity rates from database
 */
export async function getStateElectricityRates(): Promise<StateRates> {
  return getUILimits<StateRates>("state_electricity_rates");
}

/**
 * Get rate data for a specific state
 */
export async function getStateRateData(state: string): Promise<StateRateData> {
  const rates = await getStateElectricityRates();
  return rates[state] || rates["Other"] || DEFAULT_STATE_RATES["Other"];
}

/**
 * Hook for state electricity rates
 */
export function useStateRates() {
  return useUILimits<StateRates>("state_electricity_rates");
}

/**
 * Clear the UI limits cache (useful after admin updates)
 */
export function clearUILimitsCache(): void {
  uiLimitsCache.clear();
  if (import.meta.env.DEV) console.log("[UIConfigService] Cache cleared");
}

/**
 * Preload commonly used limits
 */
export async function preloadUILimits(): Promise<void> {
  await Promise.all([getCarWashUILimits(), getBESSUILimits(), getStateElectricityRates()]);
  if (import.meta.env.DEV) console.log("[UIConfigService] Common limits preloaded");
}

// ============================================================================
// REACT HOOK (for easier component usage)
// ============================================================================

import { useState, useEffect } from "react";

/**
 * React hook to fetch UI limits
 *
 * Usage:
 *   const { limits, loading } = useUILimits<CarWashUILimits>('car_wash_ui_limits');
 *   if (loading) return <Spinner />;
 *   return <input min={limits.numberOfBays.min} max={limits.numberOfBays.max} />;
 */
export function useUILimits<T = Record<string, UIFieldLimit>>(
  configKey: string
): {
  limits: T | null;
  loading: boolean;
  error: Error | null;
} {
  const [limits, setLimits] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchLimits() {
      try {
        const data = await getUILimits<T>(configKey);
        if (mounted) {
          setLimits(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch UI limits"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchLimits();
    return () => {
      mounted = false;
    };
  }, [configKey]);

  return { limits, loading, error };
}

/**
 * Specialized hook for car wash limits
 */
export function useCarWashLimits() {
  return useUILimits<CarWashUILimits>("car_wash_ui_limits");
}

/**
 * Specialized hook for BESS limits
 */
export function useBESSLimits() {
  return useUILimits<BESSUILimits>("bess_ui_limits");
}
