/**
 * Industry Power Profiles Service
 * =================================
 * 
 * Fetches industry-specific power defaults from the database.
 * Used by SMB vertical sites (carwashenergy.com, etc.) for accurate sizing.
 * 
 * @module industryPowerProfilesService
 * @version 1.0.0
 * @date November 30, 2025
 */

import { supabase } from './supabaseClient';

// ============================================
// TYPES
// ============================================

export interface IndustryPowerProfile {
  industry_slug: string;
  typical_peak_demand_kw: number;
  typical_monthly_kwh: number;
  peak_demand_timing: string;
  load_profile_type: string;
  recommended_battery_kwh_per_unit: number;
  recommended_backup_hours: number;
  recommended_solar_kw_per_unit: number;
  unit_name: string;
  unit_plural: string;
  avg_electricity_rate: number;
  avg_demand_charge: number;
  typical_payback_years: number;
  data_source: string;
}

// ============================================
// FALLBACK DATA (if DB unavailable)
// ============================================

const FALLBACK_PROFILES: Record<string, IndustryPowerProfile> = {
  'car-wash': {
    industry_slug: 'car-wash',
    typical_peak_demand_kw: 150,
    typical_monthly_kwh: 25000,
    peak_demand_timing: 'Weekends 10am-4pm, Weekdays 4-7pm',
    load_profile_type: 'daytime_heavy',
    recommended_battery_kwh_per_unit: 50,
    recommended_backup_hours: 4,
    recommended_solar_kw_per_unit: 25,
    unit_name: 'bay',
    unit_plural: 'bays',
    avg_electricity_rate: 0.14,
    avg_demand_charge: 15.00,
    typical_payback_years: 5.5,
    data_source: 'Merlin Energy Industry Analysis 2024',
  },
  'ev-charging-hub': {
    industry_slug: 'ev-charging-hub',
    typical_peak_demand_kw: 500,
    typical_monthly_kwh: 75000,
    peak_demand_timing: 'Commute hours 7-9am, 4-7pm; Weekend afternoons',
    load_profile_type: 'commute_peaks',
    recommended_battery_kwh_per_unit: 100,
    recommended_backup_hours: 2,
    recommended_solar_kw_per_unit: 30,
    unit_name: 'port',
    unit_plural: 'ports',
    avg_electricity_rate: 0.15,
    avg_demand_charge: 25.00,
    typical_payback_years: 4.5,
    data_source: 'Merlin Energy EV Analysis 2024 + SAE J1772',
  },
  'hotel': {
    industry_slug: 'hotel',
    typical_peak_demand_kw: 300,
    typical_monthly_kwh: 120000,
    peak_demand_timing: 'Check-in 3-6pm, Morning 6-9am HVAC surge',
    load_profile_type: 'hospitality_24_7',
    recommended_battery_kwh_per_unit: 3,
    recommended_backup_hours: 4,
    recommended_solar_kw_per_unit: 1.5,
    unit_name: 'room',
    unit_plural: 'rooms',
    avg_electricity_rate: 0.13,
    avg_demand_charge: 18.00,
    typical_payback_years: 6.0,
    data_source: 'Merlin Energy Hospitality Analysis 2024 + ASHRAE 90.1',
  },
  'laundromat': {
    industry_slug: 'laundromat',
    typical_peak_demand_kw: 100,
    typical_monthly_kwh: 18000,
    peak_demand_timing: 'Evenings 5-9pm, Weekends all day',
    load_profile_type: 'evening_heavy',
    recommended_battery_kwh_per_unit: 15,
    recommended_backup_hours: 4,
    recommended_solar_kw_per_unit: 10,
    unit_name: 'machine',
    unit_plural: 'machines',
    avg_electricity_rate: 0.14,
    avg_demand_charge: 12.00,
    typical_payback_years: 6.0,
    data_source: 'Merlin Energy Industry Analysis 2024',
  },
  'restaurant': {
    industry_slug: 'restaurant',
    typical_peak_demand_kw: 80,
    typical_monthly_kwh: 15000,
    peak_demand_timing: 'Lunch 11am-2pm, Dinner 5-9pm',
    load_profile_type: 'meal_peaks',
    recommended_battery_kwh_per_unit: 25,
    recommended_backup_hours: 4,
    recommended_solar_kw_per_unit: 15,
    unit_name: 'seat',
    unit_plural: 'seats',
    avg_electricity_rate: 0.15,
    avg_demand_charge: 14.00,
    typical_payback_years: 5.0,
    data_source: 'Merlin Energy Industry Analysis 2024',
  },
};

// ============================================
// CACHE
// ============================================

let profilesCache: Map<string, IndustryPowerProfile> = new Map();
let cacheLastUpdated = new Date(0);
const CACHE_EXPIRY_MINUTES = 30;

function isCacheValid(): boolean {
  const ageMinutes = (Date.now() - cacheLastUpdated.getTime()) / 1000 / 60;
  return profilesCache.size > 0 && ageMinutes < CACHE_EXPIRY_MINUTES;
}

// ============================================
// DATABASE FETCH
// ============================================

async function loadProfilesFromDB(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('industry_power_profiles')
      .select('*');

    if (error) {
      if (!error.message?.includes('does not exist')) {
        console.warn('⚠️ Failed to load industry_power_profiles:', error.message);
      }
      return false;
    }

    if (data && data.length > 0) {
      profilesCache.clear();
      data.forEach((row: IndustryPowerProfile) => {
        profilesCache.set(row.industry_slug, row);
      });
      cacheLastUpdated = new Date();
      
      if (import.meta.env.DEV) {
        console.log(`✅ Loaded ${data.length} industry power profiles from database`);
      }
      return true;
    }

    return false;
  } catch (err) {
    console.warn('⚠️ Database connection error for industry profiles:', err);
    return false;
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get power profile for a specific industry
 * 
 * @param industrySlug - Industry identifier (e.g., 'car-wash', 'laundromat')
 * @returns Industry power profile or null
 */
export async function getIndustryProfile(
  industrySlug: string
): Promise<IndustryPowerProfile | null> {
  if (!isCacheValid()) {
    await loadProfilesFromDB();
  }

  // Try database first
  const dbProfile = profilesCache.get(industrySlug);
  if (dbProfile) {
    return dbProfile;
  }

  // Fall back to hardcoded
  return FALLBACK_PROFILES[industrySlug] || null;
}

/**
 * Get all available industry profiles
 */
export async function getAllIndustryProfiles(): Promise<IndustryPowerProfile[]> {
  if (!isCacheValid()) {
    await loadProfilesFromDB();
  }

  // Merge database and fallback profiles
  const allProfiles = new Map<string, IndustryPowerProfile>();
  
  // Add fallbacks first
  Object.values(FALLBACK_PROFILES).forEach(profile => {
    allProfiles.set(profile.industry_slug, profile);
  });
  
  // Override with database values
  profilesCache.forEach((profile, slug) => {
    allProfiles.set(slug, profile);
  });

  return Array.from(allProfiles.values());
}

/**
 * Calculate recommended BESS size for an industry
 * 
 * @param industrySlug - Industry identifier
 * @param unitCount - Number of units (bays, machines, seats, etc.)
 * @returns Recommended battery size in kWh
 */
export async function getRecommendedBatterySize(
  industrySlug: string,
  unitCount: number
): Promise<number> {
  const profile = await getIndustryProfile(industrySlug);
  if (!profile) {
    return unitCount * 50; // Default 50 kWh per unit
  }
  return unitCount * profile.recommended_battery_kwh_per_unit;
}

/**
 * Calculate recommended solar size for an industry
 * 
 * @param industrySlug - Industry identifier
 * @param unitCount - Number of units
 * @returns Recommended solar size in kW
 */
export async function getRecommendedSolarSize(
  industrySlug: string,
  unitCount: number
): Promise<number> {
  const profile = await getIndustryProfile(industrySlug);
  if (!profile) {
    return unitCount * 10; // Default 10 kW per unit
  }
  return unitCount * profile.recommended_solar_kw_per_unit;
}

/**
 * Get the unit terminology for an industry
 * 
 * @param industrySlug - Industry identifier
 * @returns Object with singular and plural unit names
 */
export async function getIndustryUnits(
  industrySlug: string
): Promise<{ singular: string; plural: string }> {
  const profile = await getIndustryProfile(industrySlug);
  if (!profile) {
    return { singular: 'unit', plural: 'units' };
  }
  return { singular: profile.unit_name, plural: profile.unit_plural };
}

/**
 * Clear the profiles cache
 */
export function clearProfilesCache(): void {
  profilesCache.clear();
  cacheLastUpdated = new Date(0);
  if (import.meta.env.DEV) { console.log('🔄 Industry profiles cache cleared'); }
}
