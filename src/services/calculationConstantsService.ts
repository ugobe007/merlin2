/**
 * Calculation Constants Service
 * ==============================
 *
 * DATABASE-DRIVEN SINGLE SOURCE OF TRUTH
 *
 * This service reads calculation constants from the `calculation_constants` table
 * in Supabase, making the database the authoritative source for all constants.
 *
 * Priority:
 * 1. Database (`calculation_constants` table) - Admin-configurable, no deploy needed
 * 2. TypeScript fallbacks - Used if database unavailable
 *
 * Usage:
 * ```typescript
 * const batteryPrice = await getConstant('battery_cost_per_kwh_medium');
 * const constants = await getConstantsByCategory('pricing');
 * const itcRate = await getFinancialConstant('federal_itc_rate');
 * ```
 *
 * @module calculationConstantsService
 * @version 1.0.0
 * @date November 30, 2025
 */

import { supabase } from "./supabaseClient";

// ============================================
// TYPES
// ============================================

export interface CalculationConstant {
  key: string;
  category: string;
  value_numeric: number | null;
  value_text: string | null;
  value_json: Record<string, unknown> | null;
  value_type: "number" | "string" | "json" | "boolean";
  description: string | null;
  source: string | null;
  effective_date: string | null;
  expiration_date: string | null;
}

export interface ConstantsCache {
  data: Map<string, CalculationConstant>;
  lastUpdated: Date;
  expiryMinutes: number;
}

// ============================================
// TYPESCRIPT FALLBACKS (Used if DB unavailable)
// ============================================

const FALLBACK_CONSTANTS: Record<string, { value: number; source: string }> = {
  // Pricing - Q1 2026 Market
  battery_cost_per_kwh_small: { value: 150, source: "Q1 2026 Battery Pack (<100kW)" },
  battery_cost_per_kwh_medium: { value: 130, source: "Q1 2026 Battery Pack (100kW-3MW)" },
  battery_cost_per_kwh_large: { value: 115, source: "Q1 2026 Market (≥3MW)" },
  solar_cost_per_watt: { value: 0.95, source: "Q1 2026 Market (commercial)" },
  inverter_cost_per_kw: { value: 150, source: "Industry average" },
  installation_percentage: { value: 0.15, source: "Industry standard" },

  // Financial
  federal_itc_rate: { value: 0.3, source: "IRS 2024" },
  discount_rate: { value: 0.08, source: "Industry standard" },
  project_lifetime_years: { value: 25, source: "Industry standard" },
  battery_degradation_rate: { value: 0.02, source: "LFP industry standard" },
  electricity_escalation_rate: { value: 0.03, source: "EIA forecast" },

  // Sizing
  peak_shaving_target_percent: { value: 0.3, source: "Best practice" },
  backup_hours_minimum: { value: 2, source: "Industry standard" },
  backup_hours_recommended: { value: 4, source: "Industry standard" },
  solar_to_storage_ratio: { value: 0.25, source: "NREL guidance" },
};

// ============================================
// CACHE MANAGEMENT
// ============================================

let constantsCache: ConstantsCache = {
  data: new Map(),
  lastUpdated: new Date(0),
  expiryMinutes: 15, // Refresh every 15 minutes
};

function isCacheValid(): boolean {
  const now = new Date();
  const cacheAge = (now.getTime() - constantsCache.lastUpdated.getTime()) / 1000 / 60;
  return constantsCache.data.size > 0 && cacheAge < constantsCache.expiryMinutes;
}

/**
 * Clear the constants cache (force refresh on next request)
 */
export function clearConstantsCache(): void {
  constantsCache = {
    data: new Map(),
    lastUpdated: new Date(0),
    expiryMinutes: 15,
  };
  console.log("🔄 Calculation constants cache cleared");
}

// ============================================
// DATABASE FETCH
// ============================================

/**
 * Load all constants from database into cache
 */
async function loadConstantsFromDB(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("calculation_constants")
      .select("*")
      .order("category", { ascending: true });

    if (error) {
      // Silently fail for missing table (expected on fresh installs)
      if (!error.message?.includes("does not exist")) {
        console.warn("⚠️ Failed to load calculation_constants:", error.message);
      }
      return false;
    }

    if (data && data.length > 0) {
      constantsCache.data.clear();
      (data as any[]).forEach((row: CalculationConstant) => {
        constantsCache.data.set(row.key, row);
      });
      constantsCache.lastUpdated = new Date();

      if (import.meta.env.DEV) {
        console.log(`✅ Loaded ${data.length} constants from database`);
      }
      return true;
    }

    return false;
  } catch (err) {
    console.warn("⚠️ Database connection error for constants:", err);
    return false;
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get a single constant value by key
 *
 * @param key - The constant key (e.g., 'battery_cost_per_kwh_medium')
 * @returns The numeric value, or null if not found
 *
 * @example
 * const batteryPrice = await getConstant('battery_cost_per_kwh_medium');
 * // Returns: 300
 */
export async function getConstant(key: string): Promise<number | null> {
  // Check cache first
  if (!isCacheValid()) {
    await loadConstantsFromDB();
  }

  // Try database cache
  const dbConstant = constantsCache.data.get(key);
  if (dbConstant?.value_numeric !== null && dbConstant?.value_numeric !== undefined) {
    return dbConstant.value_numeric;
  }

  // Fall back to TypeScript constants
  const fallback = FALLBACK_CONSTANTS[key];
  if (fallback) {
    if (import.meta.env.DEV) {
      console.log(`📦 Using fallback for ${key}: ${fallback.value} (${fallback.source})`);
    }
    return fallback.value;
  }

  return null;
}

/**
 * Get a constant with full metadata
 *
 * @param key - The constant key
 * @returns Full constant object including source, description, etc.
 */
export async function getConstantWithMetadata(key: string): Promise<CalculationConstant | null> {
  if (!isCacheValid()) {
    await loadConstantsFromDB();
  }

  return constantsCache.data.get(key) || null;
}

/**
 * Get all constants in a category
 *
 * @param category - Category name ('pricing', 'financial', 'sizing', 'equipment')
 * @returns Map of key -> value for all constants in category
 *
 * @example
 * const pricingConstants = await getConstantsByCategory('pricing');
 * // Returns: Map { 'battery_cost_per_kwh_small' => 350, ... }
 */
export async function getConstantsByCategory(category: string): Promise<Map<string, number>> {
  if (!isCacheValid()) {
    await loadConstantsFromDB();
  }

  const result = new Map<string, number>();

  // Add from database cache
  constantsCache.data.forEach((constant, key) => {
    if (constant.category === category && constant.value_numeric !== null) {
      result.set(key, constant.value_numeric);
    }
  });

  // Add fallbacks for missing keys
  Object.entries(FALLBACK_CONSTANTS).forEach(([key, data]) => {
    if (!result.has(key)) {
      // Infer category from key prefix
      const inferredCategory =
        key.includes("battery") ||
        key.includes("solar") ||
        key.includes("inverter") ||
        key.includes("installation")
          ? "pricing"
          : key.includes("itc") ||
              key.includes("discount") ||
              key.includes("lifetime") ||
              key.includes("degradation") ||
              key.includes("escalation")
            ? "financial"
            : "sizing";

      if (inferredCategory === category) {
        result.set(key, data.value);
      }
    }
  });

  return result;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Get battery pricing based on system size
 *
 * @param energyKWh - Total energy storage in kWh
 * @returns Price per kWh for the appropriate tier
 */
export async function getBatteryPricePerKWh(energyKWh: number): Promise<number> {
  if (energyKWh >= 10000) {
    // 10+ MWh = large utility scale
    return (await getConstant("battery_cost_per_kwh_large")) || 250;
  } else if (energyKWh >= 1000) {
    // 1-10 MWh = commercial scale
    return (await getConstant("battery_cost_per_kwh_medium")) || 300;
  } else {
    // < 1 MWh = small/SMB scale
    return (await getConstant("battery_cost_per_kwh_small")) || 350;
  }
}

/**
 * Get the federal ITC rate
 */
export async function getITCRate(): Promise<number> {
  return (await getConstant("federal_itc_rate")) || 0.3;
}

/**
 * Get the default discount rate for NPV calculations
 */
export async function getDiscountRate(): Promise<number> {
  return (await getConstant("discount_rate")) || 0.08;
}

/**
 * Get recommended backup hours
 */
export async function getRecommendedBackupHours(): Promise<number> {
  return (await getConstant("backup_hours_recommended")) || 4;
}

/**
 * Get all pricing constants as a simple object
 *
 * @returns Object with all pricing values
 */
export async function getPricingConstants(): Promise<{
  batterySmall: number;
  batteryMedium: number;
  batteryLarge: number;
  solarPerWatt: number;
  inverterPerKW: number;
  installationPercent: number;
}> {
  const [
    batterySmall,
    batteryMedium,
    batteryLarge,
    solarPerWatt,
    inverterPerKW,
    installationPercent,
  ] = await Promise.all([
    getConstant("battery_cost_per_kwh_small"),
    getConstant("battery_cost_per_kwh_medium"),
    getConstant("battery_cost_per_kwh_large"),
    getConstant("solar_cost_per_watt"),
    getConstant("inverter_cost_per_kw"),
    getConstant("installation_percentage"),
  ]);

  return {
    batterySmall: batterySmall || 350,
    batteryMedium: batteryMedium || 300,
    batteryLarge: batteryLarge || 250,
    solarPerWatt: solarPerWatt || 2.5,
    inverterPerKW: inverterPerKW || 150,
    installationPercent: installationPercent || 0.15,
  };
}

/**
 * Get all financial constants as a simple object
 */
export async function getFinancialConstants(): Promise<{
  itcRate: number;
  discountRate: number;
  projectLifetimeYears: number;
  batteryDegradationRate: number;
  electricityEscalationRate: number;
}> {
  const [
    itcRate,
    discountRate,
    projectLifetimeYears,
    batteryDegradationRate,
    electricityEscalationRate,
  ] = await Promise.all([
    getConstant("federal_itc_rate"),
    getConstant("discount_rate"),
    getConstant("project_lifetime_years"),
    getConstant("battery_degradation_rate"),
    getConstant("electricity_escalation_rate"),
  ]);

  return {
    itcRate: itcRate || 0.3,
    discountRate: discountRate || 0.08,
    projectLifetimeYears: projectLifetimeYears || 25,
    batteryDegradationRate: batteryDegradationRate || 0.02,
    electricityEscalationRate: electricityEscalationRate || 0.03,
  };
}

// ============================================
// ADMIN FUNCTIONS (for future admin panel)
// ============================================

/**
 * Update a constant value (requires admin privileges)
 *
 * @param key - The constant key to update
 * @param value - New numeric value
 * @returns Success boolean
 */
export async function updateConstant(key: string, value: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("calculation_constants")
      .update({
        value_numeric: value,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key);

    if (error) {
      console.error("❌ Failed to update constant:", error.message);
      return false;
    }

    // Clear cache to force refresh
    clearConstantsCache();
    return true;
  } catch (err) {
    console.error("❌ Error updating constant:", err);
    return false;
  }
}

/**
 * Get the source/citation for a constant
 */
export async function getConstantSource(key: string): Promise<string | null> {
  const constant = await getConstantWithMetadata(key);
  if (constant?.source) {
    return constant.source;
  }
  return FALLBACK_CONSTANTS[key]?.source || null;
}
