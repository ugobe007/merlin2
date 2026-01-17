/**
 * Unified Pricing Service
 * =======================
 * 
 * Single source of truth for equipment pricing in the Merlin energy storage system.
 * 
 * Data Sources (in priority order):
 * 1. Database `calculation_constants` table - Admin-configurable, no deploy needed
 * 2. Database `equipment_pricing` table - Vendor-specific pricing
 * 3. NREL ATB 2024 - National Renewable Energy Laboratory Annual Technology Baseline
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
 * Version: 2.0.0 - Now uses database-driven calculation_constants as primary SSOT
 * Date: November 30, 2025
 * Updated: December 10, 2025 - Added market data integration
 */

import { supabase } from '../supabaseClient';
import { 
  getConstant,
  clearConstantsCache 
} from '../constants/calculationConstantsService';
import { 
  getMarketAdjustedPrice,
  clearMarketDataCache
} from './marketDataIntegrationService';


import type {
  BatteryPricing,
  InverterPricing,
  TransformerPricing,
  SolarPricing,
  WindPricing,
  GeneratorPricing,
  UnifiedPricingCache
} from '../types/equipment.types';

// Re-export types for backward compatibility
export type {
  BatteryPricing,
  InverterPricing,
  TransformerPricing,
  SolarPricing,
  WindPricing,
  GeneratorPricing,
  UnifiedPricingCache
} from '../types/equipment.types';

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
  if (import.meta.env.DEV) { console.log('💾 Unified pricing cache cleared'); }
}

/**
 * Clear ALL caches (pricing + calculation constants + market data)
 * Call this after admin updates pricing in database
 */
export function clearAllPricingCaches(): void {
  clearPricingCache();
  clearConstantsCache();
  clearMarketDataCache();
  if (import.meta.env.DEV) { console.log('🔄 All pricing caches cleared - will fetch fresh from database + market data'); }
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
  pricePerKW: 700, // $700/kW for natural gas generator
  manufacturer: 'Various (Industry Standard)',
  model: 'Natural Gas Generator',
  fuelType: 'natural-gas',
  efficiency: 0.40,
  dataSource: 'nrel',
  lastUpdated: new Date('2024-11-01')
};

// ============================================
// DATABASE FETCH FUNCTIONS
// ============================================

/**
 * Fetch battery pricing from database with intelligent fallback
 * 
 * Priority:
 * 1. Vendor pricing (approved vendor products - highest confidence)
 * 2. calculation_constants table (size-tiered pricing)
 * 3. equipment_pricing table (vendor-specific, synced)
 * 4. Market data integration (RSS/web sources)
 * 5. NREL ATB 2024 fallback constants
 */
async function fetchBatteryPricingFromDB(
  powerMW: number,
  durationHours: number,
  location: string = 'United States'
): Promise<BatteryPricing> {
  const energyMWh = powerMW * durationHours;
  const energyKWh = energyMWh * 1000;
  
  try {
    // PRIORITY 1: Try vendor pricing (approved vendor products)
    // TODO: Add vendor pricing integration when vendor service is extracted
    // const vendorPricing = await getVendorPricing('bess', energyKWh, powerMW * 1000);
    // if (vendorPricing && vendorPricing.pricePerKwh) {
    //   if (process.env.NODE_ENV === "development") {
    //     console.log(`🏢 Battery pricing from VENDOR: $${vendorPricing.pricePerKwh}/kWh (${vendorPricing.manufacturer} ${vendorPricing.model})`);
    //   }
    //   ...
    // }
    
    // PRIORITY 2: Try calculation_constants table (database SSOT)
    let pricePerKWh: number | null = null;
    const dataSource: 'database' | 'nrel' = 'database';
    
    if (energyKWh >= 10000) {
      // 10+ MWh = large utility scale
      pricePerKWh = await getConstant('battery_cost_per_kwh_large');
    } else if (energyKWh >= 1000) {
      // 1-10 MWh = commercial scale
      pricePerKWh = await getConstant('battery_cost_per_kwh_medium');
    } else {
      // < 1 MWh = small/SMB scale
      pricePerKWh = await getConstant('battery_cost_per_kwh_small');
    }
    
    // If we got a value from calculation_constants, use it
    if (pricePerKWh !== null) {
      if (import.meta.env.DEV) {
        console.log(`💾 Battery pricing from calculation_constants: $${pricePerKWh}/kWh (${energyKWh.toFixed(0)} kWh system)`);
      }
      return {
        pricePerKWh,
        manufacturer: energyKWh >= 10000 ? 'CATL/BYD' : energyKWh >= 1000 ? 'Great Power' : 'LiON Energy',
        model: energyKWh >= 10000 ? 'Utility Scale LFP' : energyKWh >= 1000 ? 'Commercial Container' : 'Small Commercial',
        chemistry: 'LFP',
        warrantyYears: 10,
        cycleLife: 4000,
        efficiency: 0.85,
        dataSource: 'database',
        lastUpdated: new Date(),
        confidence: 'high'
      };
    }
    
    // PRIORITY 2: Try equipment_pricing table (vendor-specific)
    const { data, error } = await supabase
      .from('equipment_pricing')
      .select('*')
      .eq('equipment_type', 'battery')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      // Size-based adjustments from vendor pricing
      let vendorPrice = data.price_per_kwh || NREL_ATB_2024_BATTERY.pricePerKWh;
      
      if (energyMWh >= 100) {
        // Utility-scale discount
        vendorPrice = vendorPrice * 0.85;
      } else if (energyMWh < 20) {
        // Small system premium
        vendorPrice = vendorPrice * 1.3;
      }
      
      if (import.meta.env.DEV) {
        console.log(`💾 Battery pricing from equipment_pricing: $${vendorPrice.toFixed(0)}/kWh (${data.manufacturer})`);
      }
      
      return {
        pricePerKWh: Math.round(vendorPrice),
        manufacturer: data.manufacturer || 'Various',
        model: data.model || 'Commercial LFP',
        chemistry: 'LFP',
        warrantyYears: 10,
        cycleLife: 4000,
        efficiency: 0.85,
        dataSource: 'database',
        lastUpdated: new Date(data.updated_at),
        confidence: 'high'
      };
    }
    
    // PRIORITY 3: Try MARKET DATA INTEGRATION (scraped from RSS/web sources)
    // This uses the daily market scraper for real-time pricing intelligence
    const marketData = await getMarketAdjustedPrice('bess', NREL_ATB_2024_BATTERY.pricePerKWh, location);
    
    if (marketData.source === 'market' && marketData.confidence !== 'low') {
      if (import.meta.env.DEV) {
        console.log(`📈 Battery pricing from MARKET DATA: $${marketData.price}/kWh (${marketData.confidence} confidence, ${marketData.dataPoints || 0} data points)`);
        if (marketData.marketTrend) {
          console.log(`   Market trend: ${marketData.marketTrend}`);
        }
      }
      
      return {
        pricePerKWh: Math.round(marketData.price),
        manufacturer: 'Various (Market Intelligence)',
        model: energyKWh >= 10000 ? 'Utility Scale LFP' : energyKWh >= 1000 ? 'Commercial Container' : 'Small Commercial',
        chemistry: 'LFP',
        warrantyYears: 10,
        cycleLife: 4000,
        efficiency: 0.85,
        dataSource: 'database',
        lastUpdated: new Date(),
        confidence: marketData.confidence
      };
    }
    
    // PRIORITY 4: Fall back to NREL constants
    if (import.meta.env.DEV) {
      console.log(`📦 Battery pricing from NREL fallback: $${NREL_ATB_2024_BATTERY.pricePerKWh}/kWh`);
    }
    return NREL_ATB_2024_BATTERY;

  } catch (error: any) {
    // Silently fall back for missing tables (expected in dev)
    if (!error?.message?.includes('relation') && !error?.message?.includes('does not exist')) {
      console.warn('⚠️ Database fetch failed:', error);
    }
    return NREL_ATB_2024_BATTERY;
  }
}

/**
 * Fetch inverter pricing from database
 * Priority: calculation_constants → equipment_pricing → NREL
 */
async function fetchInverterPricingFromDB(powerMW: number): Promise<InverterPricing> {
  try {
    // PRIORITY 1: Try calculation_constants
    const pricePerKW = await getConstant('inverter_cost_per_kw');
    if (pricePerKW !== null) {
      return {
        pricePerKW,
        manufacturer: 'Various (Industry Standard)',
        model: 'Grid-Scale Inverter',
        efficiency: 0.97,
        warrantyYears: 10,
        dataSource: 'database',
        lastUpdated: new Date()
      };
    }
    
    // PRIORITY 2: Try equipment_pricing
    const { data, error } = await supabase
      .from('equipment_pricing')
      .select('*')
      .eq('equipment_type', 'inverter')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      return {
        pricePerKW: data.price_per_kw || 80,
        manufacturer: data.manufacturer || 'Various',
        model: data.model || 'Grid-Scale Inverter',
        efficiency: 0.97,
        warrantyYears: 10,
        dataSource: 'database',
        lastUpdated: new Date(data.updated_at)
      };
    }
    
    // PRIORITY 3: NREL fallback
    return NREL_INVERTER_PRICING;
  } catch (error) {
    return NREL_INVERTER_PRICING;
  }
}

/**
 * Fetch solar pricing from database
 * Priority: pricing_configurations.solar_default (scale-based) → NREL fallback
 * 
 * ⚠️ UPDATED Dec 2025: Now uses scale-based pricing to match calculateEquipmentBreakdown()
 * - < 5 MW: commercial_per_watt (default $0.85/W)
 * - ≥ 5 MW: utility_scale_per_watt (default $0.65/W)
 * 
 * @param solarMW - Optional solar capacity in MW for scale-based pricing
 */
async function fetchSolarPricingFromDB(solarMW?: number): Promise<SolarPricing> {
  try {
    // PRIORITY 1: Try pricing_configurations for scale-based pricing (matches calculateEquipmentBreakdown)
    const { data: configData, error: configError } = await supabase
      .from('pricing_configurations')
      .select('config_data')
      .eq('config_key', 'solar_default')
      .eq('is_active', true)
      .single();
    
    if (!configError && configData?.config_data) {
      const solarConfig = configData.config_data as {
        utility_scale_per_watt?: number;
        commercial_per_watt?: number;
        small_scale_per_watt?: number;
      };
      
      // Determine scale-based pricing
      const isUtilityScale = solarMW !== undefined && solarMW >= 5; // 5MW+ is utility scale
      let pricePerWatt: number;
      let model: string;
      
      if (isUtilityScale) {
        pricePerWatt = solarConfig.utility_scale_per_watt ?? 0.65;
        model = 'Utility-Scale Solar (>5 MW)';
      } else {
        pricePerWatt = solarConfig.commercial_per_watt ?? 0.85;
        model = 'Commercial Solar (<5 MW)';
      }
      
      if (import.meta.env.DEV) {
        console.log(`☀️ Solar pricing from solar_default: $${pricePerWatt}/W (${model})`);
      }
      
      return {
        pricePerWatt,
        manufacturer: 'Various (NREL ATB 2024)',
        model,
        efficiency: 0.20,
        warrantyYears: 25,
        dataSource: 'database',
        lastUpdated: new Date()
      };
    }
    
    // PRIORITY 2: Try equipment_pricing table as fallback
    const { data, error } = await supabase
      .from('equipment_pricing')
      .select('*')
      .eq('equipment_type', 'solar')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      return {
        pricePerWatt: data.price_per_watt || 0.85,
        manufacturer: data.manufacturer || 'Various',
        model: data.model || 'Commercial Solar',
        efficiency: 0.20,
        warrantyYears: 25,
        dataSource: 'database',
        lastUpdated: new Date(data.updated_at)
      };
    }
    
    // PRIORITY 3: NREL fallback with scale-based pricing
    const isUtilityScale = solarMW !== undefined && solarMW >= 5;
    return {
      ...NREL_SOLAR_PRICING,
      pricePerWatt: isUtilityScale ? 0.65 : 0.85,
      model: isUtilityScale ? 'Utility-Scale Solar (>5 MW)' : 'Commercial Solar (<5 MW)'
    };
  } catch (error) {
    // FALLBACK: Use NREL with scale-based pricing
    const isUtilityScale = solarMW !== undefined && solarMW >= 5;
    return {
      ...NREL_SOLAR_PRICING,
      pricePerWatt: isUtilityScale ? 0.65 : 0.85,
      model: isUtilityScale ? 'Utility-Scale Solar (>5 MW)' : 'Commercial Solar (<5 MW)'
    };
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
      pricePerKW: data.price_per_kw || 700,
      manufacturer: data.manufacturer || 'Various',
      model: data.model || 'Natural Gas Generator',
      fuelType: 'natural-gas',
      efficiency: 0.40,
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
    if (import.meta.env.DEV) { console.log('💾 Using cached battery pricing'); }
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
 * 
 * ⚠️ UPDATED Dec 2025: Now supports scale-based pricing
 * - Pass solarMW to get appropriate pricing for your system size
 * - < 5 MW: commercial pricing (~$0.85/W)
 * - ≥ 5 MW: utility-scale pricing (~$0.65/W)
 * 
 * @param solarMW - Optional solar capacity in MW for scale-based pricing
 */
export async function getSolarPricing(solarMW?: number): Promise<SolarPricing> {
  // For scale-based pricing, always fetch fresh to get correct tier
  if (solarMW !== undefined) {
    return await fetchSolarPricingFromDB(solarMW);
  }
  
  // For default (no size), use cache
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
 * 
 * @param powerMW - Storage power in MW
 * @param durationHours - Storage duration hours
 * @param location - Location/country
 * @param solarMW - Optional solar capacity for scale-based pricing
 */
export async function getAllEquipmentPricing(
  powerMW: number,
  durationHours: number,
  location: string = 'United States',
  solarMW?: number
): Promise<UnifiedPricingCache> {
  const [battery, inverter, transformer, solar, wind, generator] = await Promise.all([
    getBatteryPricing(powerMW, durationHours, location),
    getInverterPricing(powerMW),
    getTransformerPricing(),
    getSolarPricing(solarMW),  // Pass solar size for scale-based pricing
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
  if (import.meta.env.DEV) { console.log('🔄 Prefetching all equipment pricing...'); }
  await getAllEquipmentPricing(5, 4); // Use typical 5MW/4hr system for cache
  if (import.meta.env.DEV) { console.log('✅ All equipment pricing cached'); }
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
