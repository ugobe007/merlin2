/**
 * Unified Pricing Service
 * =======================
 * 
 * Single source of truth for equipment pricing in the Merlin energy storage system.
 * 
 * Data Sources (in priority order):
 * 1. Database (Supabase) - Admin-configured pricing for specific industries/locations
 * 2. NREL ATB 2024 - National Renewable Energy Laboratory Annual Technology Baseline
 * 
 * This service provides intelligent fallback from database to NREL standards,
 * ensuring accurate pricing for both custom configurations and standard systems.
 * 
 * Usage:
 * ```typescript
 * const pricing = await getBatteryPricing(powerMW, durationHours, location);
 * const pricing = await getEquipmentPricing('battery', powerMW, durationHours);
 * ```
 * 
 * For large utility-scale systems (>10MW), also consider using Grid-Synk validation
 * from @/services/pricingService to verify pricing against industry standards.
 * 
 * Version: 1.0.0
 * Date: November 17, 2025
 */

import { supabase } from './supabaseClient';
import type {
  BatteryPricing,
  InverterPricing,
  TransformerPricing,
  SolarPricing,
  WindPricing,
  GeneratorPricing,
  UnifiedPricingCache
} from '@/core/domain';

// Re-export types for backward compatibility
export type {
  BatteryPricing,
  InverterPricing,
  TransformerPricing,
  SolarPricing,
  WindPricing,
  GeneratorPricing,
  UnifiedPricingCache
} from '@/core/domain';

// ============================================
// CACHE MANAGEMENT
// ============================================

let pricingCache: UnifiedPricingCache = {
  battery: null,
  inverter: null,
  transformer: null,
  solar: null,
  wind: null,
  generator: null,
  lastCacheUpdate: new Date(0), // Epoch = never cached
  cacheExpiryMinutes: 60 // 1 hour cache
};

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  const now = new Date();
  const cacheAge = (now.getTime() - pricingCache.lastCacheUpdate.getTime()) / 1000 / 60; // minutes
  return cacheAge < pricingCache.cacheExpiryMinutes;
}

/**
 * Clear the pricing cache (force refresh)
 */
export function clearPricingCache(): void {
  pricingCache = {
    battery: null,
    inverter: null,
    transformer: null,
    solar: null,
    wind: null,
    generator: null,
    lastCacheUpdate: new Date(0),
    cacheExpiryMinutes: 60
  };
  console.log('💾 Unified pricing cache cleared');
}

// ============================================
// NREL ATB 2024 FALLBACK DATA
// ============================================

const NREL_ATB_2024_BATTERY: BatteryPricing = {
  pricePerKWh: 155, // NREL ATB 2024 Moderate scenario
  manufacturer: 'Various (NREL ATB 2024)',
  model: 'Utility-Scale LFP',
  chemistry: 'LFP',
  warrantyYears: 10,
  cycleLife: 4000,
  efficiency: 0.85,
  dataSource: 'nrel',
  lastUpdated: new Date('2024-11-01'),
  confidence: 'high'
};

const NREL_INVERTER_PRICING: InverterPricing = {
  pricePerKW: 80, // $80/kW for utility-scale
  manufacturer: 'Various (Industry Standard)',
  model: 'Grid-Scale Inverter',
  efficiency: 0.97,
  warrantyYears: 10,
  dataSource: 'nrel',
  lastUpdated: new Date('2024-11-01')
};

const NREL_TRANSFORMER_PRICING: TransformerPricing = {
  pricePerMVA: 50000, // $50k per MVA
  manufacturer: 'Various (Industry Standard)',
  voltage: '34.5kV',
  efficiency: 0.99,
  dataSource: 'nrel',
  lastUpdated: new Date('2024-11-01')
};

const NREL_SOLAR_PRICING: SolarPricing = {
  pricePerWatt: 0.85, // $0.85/W for utility-scale
  manufacturer: 'Various (NREL ATB 2024)',
  model: 'Utility-Scale Solar',
  efficiency: 0.20,
  warrantyYears: 25,
  dataSource: 'nrel',
  lastUpdated: new Date('2024-11-01')
};

const NREL_WIND_PRICING: WindPricing = {
  pricePerKW: 1200, // $1,200/kW for land-based wind
  manufacturer: 'Various (NREL ATB 2024)',
  model: 'Land-Based Wind Turbine',
  capacityFactor: 0.35,
  dataSource: 'nrel',
  lastUpdated: new Date('2024-11-01')
};

const NREL_GENERATOR_PRICING: GeneratorPricing = {
  pricePerKW: 500, // $500/kW for diesel generator
  manufacturer: 'Various (Industry Standard)',
  model: 'Diesel Generator',
  fuelType: 'diesel',
  efficiency: 0.35,
  dataSource: 'nrel',
  lastUpdated: new Date('2024-11-01')
};

// ============================================
// DATABASE FETCH FUNCTIONS
// ============================================

/**
 * Fetch battery pricing from database with intelligent fallback
 */
async function fetchBatteryPricingFromDB(
  powerMW: number,
  durationHours: number,
  location: string = 'United States'
): Promise<BatteryPricing> {
  try {
    // Try to fetch from database (silently fail if table doesn't exist)
    const { data, error } = await supabase
      .from('equipment_pricing')
      .select('*')
      .eq('equipment_type', 'battery')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    // Silently fall back to NREL if database unavailable (404/400 errors are expected)
    if (error || !data) {
      // Only log if it's NOT a missing table error
      if (error && !error.message?.includes('relation') && !error.message?.includes('does not exist')) {
        console.log('⚠️  Database pricing unavailable, using NREL ATB 2024');
      }
      return NREL_ATB_2024_BATTERY;
    }

    // Calculate size-based adjustments
    const energyMWh = powerMW * durationHours;
    let pricingData = NREL_ATB_2024_BATTERY;

    // Size-based pricing (economies of scale)
    if (energyMWh >= 100) {
      // Utility-scale (100+ MWh)
      pricingData = {
        pricePerKWh: data.price_per_kwh || 135,
        manufacturer: data.manufacturer || 'CATL/BYD',
        model: data.model || 'Utility Scale LFP',
        chemistry: 'LFP',
        warrantyYears: 10,
        cycleLife: 4000,
        efficiency: 0.85,
        dataSource: 'database',
        lastUpdated: new Date(data.updated_at),
        confidence: 'high'
      };
    } else if (energyMWh >= 20) {
      // Commercial-scale (20-100 MWh)
      pricingData = {
        pricePerKWh: data.price_per_kwh ? data.price_per_kwh * 1.15 : 155,
        manufacturer: data.manufacturer || 'Great Power',
        model: data.model || 'Commercial Container',
        chemistry: 'LFP',
        warrantyYears: 10,
        cycleLife: 4000,
        efficiency: 0.85,
        dataSource: 'database',
        lastUpdated: new Date(data.updated_at),
        confidence: 'high'
      };
    } else {
      // Small commercial (< 20 MWh)
      pricingData = {
        pricePerKWh: data.price_per_kwh ? data.price_per_kwh * 1.4 : 200,
        manufacturer: data.manufacturer || 'LiON Energy',
        model: data.model || 'Small Commercial',
        chemistry: 'LFP',
        warrantyYears: 10,
        cycleLife: 4000,
        efficiency: 0.85,
        dataSource: 'database',
        lastUpdated: new Date(data.updated_at),
        confidence: 'medium'
      };
    }

    console.log(`💾 Battery pricing from database: $${pricingData.pricePerKWh}/kWh (${pricingData.manufacturer})`);
    return pricingData;

  } catch (error: any) {
    // Silently fall back for missing tables (404/400 errors expected in dev)
    if (!error?.message?.includes('relation') && !error?.message?.includes('does not exist')) {
      console.error('❌ Database fetch failed:', error);
    }
    return NREL_ATB_2024_BATTERY;
  }
}

/**
 * Fetch inverter pricing from database
 */
async function fetchInverterPricingFromDB(powerMW: number): Promise<InverterPricing> {
  try {
    const { data, error } = await supabase
      .from('equipment_pricing')
      .select('*')
      .eq('equipment_type', 'inverter')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NREL_INVERTER_PRICING;
    }

    return {
      pricePerKW: data.price_per_kw || 80,
      manufacturer: data.manufacturer || 'Various',
      model: data.model || 'Grid-Scale Inverter',
      efficiency: 0.97,
      warrantyYears: 10,
      dataSource: 'database',
      lastUpdated: new Date(data.updated_at)
    };
  } catch (error) {
    return NREL_INVERTER_PRICING;
  }
}

/**
 * Fetch solar pricing from database
 */
async function fetchSolarPricingFromDB(): Promise<SolarPricing> {
  try {
    const { data, error } = await supabase
      .from('equipment_pricing')
      .select('*')
      .eq('equipment_type', 'solar')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NREL_SOLAR_PRICING;
    }

    return {
      pricePerWatt: data.price_per_watt || 0.85,
      manufacturer: data.manufacturer || 'Various',
      model: data.model || 'Utility-Scale Solar',
      efficiency: 0.20,
      warrantyYears: 25,
      dataSource: 'database',
      lastUpdated: new Date(data.updated_at)
    };
  } catch (error) {
    return NREL_SOLAR_PRICING;
  }
}

/**
 * Fetch wind pricing from database
 */
async function fetchWindPricingFromDB(): Promise<WindPricing> {
  try {
    const { data, error } = await supabase
      .from('equipment_pricing')
      .select('*')
      .eq('equipment_type', 'wind')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NREL_WIND_PRICING;
    }

    return {
      pricePerKW: data.price_per_kw || 1200,
      manufacturer: data.manufacturer || 'Various',
      model: data.model || 'Land-Based Wind',
      capacityFactor: 0.35,
      dataSource: 'database',
      lastUpdated: new Date(data.updated_at)
    };
  } catch (error) {
    return NREL_WIND_PRICING;
  }
}

/**
 * Fetch generator pricing from database
 */
async function fetchGeneratorPricingFromDB(): Promise<GeneratorPricing> {
  try {
    const { data, error } = await supabase
      .from('equipment_pricing')
      .select('*')
      .eq('equipment_type', 'generator')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NREL_GENERATOR_PRICING;
    }

    return {
      pricePerKW: data.price_per_kw || 500,
      manufacturer: data.manufacturer || 'Various',
      model: data.model || 'Diesel Generator',
      fuelType: 'diesel',
      efficiency: 0.35,
      dataSource: 'database',
      lastUpdated: new Date(data.updated_at)
    };
  } catch (error) {
    return NREL_GENERATOR_PRICING;
  }
}

/**
 * Fetch transformer pricing from database
 */
async function fetchTransformerPricingFromDB(): Promise<TransformerPricing> {
  try {
    const { data, error } = await supabase
      .from('equipment_pricing')
      .select('*')
      .eq('equipment_type', 'transformer')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NREL_TRANSFORMER_PRICING;
    }

    return {
      pricePerMVA: data.price_per_mva || 50000,
      manufacturer: data.manufacturer || 'Various',
      voltage: data.voltage || '34.5kV',
      efficiency: 0.99,
      dataSource: 'database',
      lastUpdated: new Date(data.updated_at)
    };
  } catch (error) {
    return NREL_TRANSFORMER_PRICING;
  }
}

// ============================================
// PUBLIC API - SINGLE SOURCE OF TRUTH
// ============================================

/**
 * Get battery pricing - SINGLE SOURCE OF TRUTH
 * All battery pricing requests should use this function
 */
export async function getBatteryPricing(
  powerMW: number,
  durationHours: number,
  location: string = 'United States'
): Promise<BatteryPricing> {
  // Check cache first
  if (isCacheValid() && pricingCache.battery) {
    console.log('💾 Using cached battery pricing');
    return pricingCache.battery;
  }

  // Fetch fresh data
  const pricing = await fetchBatteryPricingFromDB(powerMW, durationHours, location);
  
  // Update cache
  pricingCache.battery = pricing;
  pricingCache.lastCacheUpdate = new Date();
  
  return pricing;
}

/**
 * Get inverter pricing - SINGLE SOURCE OF TRUTH
 */
export async function getInverterPricing(powerMW: number): Promise<InverterPricing> {
  if (isCacheValid() && pricingCache.inverter) {
    return pricingCache.inverter;
  }

  const pricing = await fetchInverterPricingFromDB(powerMW);
  pricingCache.inverter = pricing;
  pricingCache.lastCacheUpdate = new Date();
  
  return pricing;
}

/**
 * Get transformer pricing - SINGLE SOURCE OF TRUTH
 */
export async function getTransformerPricing(): Promise<TransformerPricing> {
  if (isCacheValid() && pricingCache.transformer) {
    return pricingCache.transformer;
  }

  const pricing = await fetchTransformerPricingFromDB();
  pricingCache.transformer = pricing;
  pricingCache.lastCacheUpdate = new Date();
  
  return pricing;
}

/**
 * Get solar pricing - SINGLE SOURCE OF TRUTH
 */
export async function getSolarPricing(): Promise<SolarPricing> {
  if (isCacheValid() && pricingCache.solar) {
    return pricingCache.solar;
  }

  const pricing = await fetchSolarPricingFromDB();
  pricingCache.solar = pricing;
  pricingCache.lastCacheUpdate = new Date();
  
  return pricing;
}

/**
 * Get wind pricing - SINGLE SOURCE OF TRUTH
 */
export async function getWindPricing(): Promise<WindPricing> {
  if (isCacheValid() && pricingCache.wind) {
    return pricingCache.wind;
  }

  const pricing = await fetchWindPricingFromDB();
  pricingCache.wind = pricing;
  pricingCache.lastCacheUpdate = new Date();
  
  return pricing;
}

/**
 * Get generator pricing - SINGLE SOURCE OF TRUTH
 */
export async function getGeneratorPricing(): Promise<GeneratorPricing> {
  if (isCacheValid() && pricingCache.generator) {
    return pricingCache.generator;
  }

  const pricing = await fetchGeneratorPricingFromDB();
  pricingCache.generator = pricing;
  pricingCache.lastCacheUpdate = new Date();
  
  return pricing;
}

/**
 * Get all equipment pricing at once (batch operation)
 * Useful for loading complete system quotes
 */
export async function getAllEquipmentPricing(
  powerMW: number,
  durationHours: number,
  location: string = 'United States'
): Promise<UnifiedPricingCache> {
  const [battery, inverter, transformer, solar, wind, generator] = await Promise.all([
    getBatteryPricing(powerMW, durationHours, location),
    getInverterPricing(powerMW),
    getTransformerPricing(),
    getSolarPricing(),
    getWindPricing(),
    getGeneratorPricing()
  ]);

  return {
    battery,
    inverter,
    transformer,
    solar,
    wind,
    generator,
    lastCacheUpdate: new Date(),
    cacheExpiryMinutes: 60
  };
}

/**
 * Prefetch and cache all pricing data
 * Call this on app startup or when admin updates pricing
 */
export async function prefetchAllPricing(): Promise<void> {
  console.log('🔄 Prefetching all equipment pricing...');
  await getAllEquipmentPricing(5, 4); // Use typical 5MW/4hr system for cache
  console.log('✅ All equipment pricing cached');
}

/**
 * Get cache status (useful for admin dashboard)
 */
export function getCacheStatus(): {
  isValid: boolean;
  lastUpdate: Date;
  cacheAge: number;
  cachedItems: string[];
} {
  const now = new Date();
  const cacheAge = (now.getTime() - pricingCache.lastCacheUpdate.getTime()) / 1000 / 60;
  const cachedItems = Object.entries(pricingCache)
    .filter(([key, value]) => key !== 'lastCacheUpdate' && key !== 'cacheExpiryMinutes' && value !== null)
    .map(([key]) => key);

  return {
    isValid: isCacheValid(),
    lastUpdate: pricingCache.lastCacheUpdate,
    cacheAge,
    cachedItems
  };
}
