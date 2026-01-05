/**
 * STATE SOLAR DATA SERVICE
 * =========================
 * Fetches state-specific solar irradiance and production data from database.
 * Part of SSOT Architecture.
 */

import { supabase } from './supabaseClient';

export interface StateSolarData {
  stateCode: string;
  stateName: string;
  peakSunHours: number;
  capacityFactorKwhPerKw: number;
  avgIrradianceKwhM2Day: number | null;
  solarRating: 'A' | 'B' | 'C' | 'D';
  avgElectricityRate: number | null;
  avgDemandCharge: number | null;
  bestTiltAngle: number | null;
}

// Cache for state solar data
let solarDataCache: Map<string, StateSolarData> = new Map();
let cacheTimestamp: Date | null = null;
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Load all state solar data into cache
 */
async function loadStateSolarData(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('state_solar_data')
      .select('*')
      .order('state_code');

    if (error) {
      console.warn('⚠️ Failed to load state_solar_data:', error.message);
      return false;
    }

    if (data && data.length > 0) {
      solarDataCache.clear();
      data.forEach((row: any) => {
        solarDataCache.set(row.state_code, {
          stateCode: row.state_code,
          stateName: row.state_name,
          peakSunHours: Number(row.peak_sun_hours),
          capacityFactorKwhPerKw: Number(row.capacity_factor_kwh_per_kw),
          avgIrradianceKwhM2Day: row.avg_irradiance_kwh_m2_day ? Number(row.avg_irradiance_kwh_m2_day) : null,
          solarRating: row.solar_rating as 'A' | 'B' | 'C' | 'D',
          avgElectricityRate: row.avg_electricity_rate ? Number(row.avg_electricity_rate) : null,
          avgDemandCharge: row.avg_demand_charge ? Number(row.avg_demand_charge) : null,
          bestTiltAngle: row.best_tilt_angle ? Number(row.best_tilt_angle) : null,
        });
      });
      cacheTimestamp = new Date();
      console.log(`✅ Loaded ${data.length} states solar data from database`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('⚠️ Error loading state solar data:', err);
    return false;
  }
}

function isCacheValid(): boolean {
  if (!cacheTimestamp || solarDataCache.size === 0) return false;
  return (Date.now() - cacheTimestamp.getTime()) < CACHE_DURATION_MS;
}

/**
 * Get solar data for a specific state
 */
export async function getStateSolarData(stateCode: string): Promise<StateSolarData | null> {
  if (!isCacheValid()) {
    await loadStateSolarData();
  }
  return solarDataCache.get(stateCode.toUpperCase()) || null;
}

/**
 * Get all state solar data
 */
export async function getAllStateSolarData(): Promise<StateSolarData[]> {
  if (!isCacheValid()) {
    await loadStateSolarData();
  }
  return Array.from(solarDataCache.values());
}

/**
 * Get capacity factor for a state (kWh/kW/year)
 */
export async function getCapacityFactor(stateCode: string): Promise<number> {
  const data = await getStateSolarData(stateCode);
  return data?.capacityFactorKwhPerKw || 1500; // Default
}

/**
 * Get peak sun hours for a state
 */
export async function getPeakSunHours(stateCode: string): Promise<number> {
  const data = await getStateSolarData(stateCode);
  return data?.peakSunHours || 5.0; // Default
}

/**
 * Get solar rating for a state
 */
export async function getSolarRating(stateCode: string): Promise<'A' | 'B' | 'C' | 'D'> {
  const data = await getStateSolarData(stateCode);
  return data?.solarRating || 'C'; // Default
}

/**
 * Get optimal tilt angle for a state
 */
export async function getOptimalTiltAngle(stateCode: string): Promise<number> {
  const data = await getStateSolarData(stateCode);
  return data?.bestTiltAngle || 30; // Default
}

/**
 * Clear the cache (force refresh on next request)
 */
export function clearStateSolarCache(): void {
  solarDataCache.clear();
  cacheTimestamp = null;
}
