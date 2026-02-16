/**
 * Equipment Pricing Tiers Service
 * 
 * ✅ SSOT for ALL equipment pricing across Merlin
 * ✅ Integrates with TrueQuote™ for source attribution
 * ✅ Market data sync from collected_market_prices
 * ✅ Connected to equipmentCalculations.ts (main SSOT)
 * 
 * PRICING PRIORITY ORDER:
 * 1. Live market data (collected_market_prices with is_verified=true)
 * 2. Database tiers (equipment_pricing_tiers - admin editable)
 * 3. Hardcoded fallbacks (only if database unavailable)
 * 
 * @created 2026-01-14
 * @updated 2026-01-14 - Added market data integration, SSOT connection
 */

import { supabase } from '@/services/supabaseClient';

// ============================================================================
// CACHE FOR PERFORMANCE
// ============================================================================
interface PriceCache {
  data: Map<string, EquipmentPrice>;
  expiry: number;
}

const priceCache: PriceCache = {
  data: new Map(),
  expiry: 0
};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// TYPES
// ============================================================================

export type EquipmentType = 
  | 'bess'
  | 'solar'
  | 'inverter_pcs'
  | 'transformer'
  | 'switchgear'
  | 'microgrid_controller'
  | 'dc_patch_panel'
  | 'ac_patch_panel'
  | 'bms'
  | 'ess_enclosure'
  | 'scada'
  | 'ems_software'
  | 'ev_charger'
  | 'generator'
  | 'fuel_cell'
  | 'wind';

export type PricingTier = 'economy' | 'standard' | 'premium' | 'enterprise';
export type PriceUnit = 'per_kWh' | 'per_kW' | 'per_W' | 'per_unit' | 'per_kVA' | 'per_point' | 'flat';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'estimate';

export interface EquipmentPricingTier {
  id: string;
  equipment_type: EquipmentType;
  tier_name: PricingTier;
  manufacturer: string | null;
  model: string | null;
  base_price: number;
  price_unit: PriceUnit;
  size_min: number | null;
  size_max: number | null;
  size_unit: string | null;
  specifications: Record<string, unknown>;
  data_source: string;
  source_url: string | null;
  source_date: string | null;
  confidence_level: ConfidenceLevel;
  is_active: boolean;
  effective_date: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

export interface PricingQuery {
  equipmentType: EquipmentType;
  tier?: PricingTier;
  size?: number;
  manufacturer?: string;
}

export interface TrueQuoteAttribution {
  source: string;
  sourceUrl?: string;
  sourceDate?: string;
  confidence: ConfidenceLevel;
  methodology: string;
}

export interface EquipmentPrice {
  price: number;          // Base cost price
  priceWithMarkup: number; // Price with Merlin markup (customer-facing)
  markupPercentage: number; // Applied markup %
  unit: PriceUnit;
  tier: PricingTier;
  manufacturer?: string;
  model?: string;
  trueQuote: TrueQuoteAttribution;
  sourceType: 'market_data' | 'database_tier' | 'fallback';
}

// ============================================================================
// MARKUP CONFIGURATION CACHE
// ============================================================================
interface MarkupConfig {
  data: Map<string, number>;
  expiry: number;
  tableUnavailable?: boolean; // ✅ Flag to stop repeated 404 attempts
}

const markupCache: MarkupConfig = {
  data: new Map(),
  expiry: 0,
  tableUnavailable: false
};

// ✅ FIX Feb 7, 2026: Deduplication lock prevents parallel calls from ALL hitting DB
let markupProbeInFlight: Promise<boolean> | null = null;

/**
 * Probe whether the pricing_markup_config table exists (single attempt, cached).
 * Returns true if table is available, false if not.
 */
async function probeMarkupTable(): Promise<boolean> {
  if (markupCache.tableUnavailable) return false;
  if (markupProbeInFlight) return markupProbeInFlight;

  markupProbeInFlight = (async () => {
    try {
      const { error } = await supabase
        .from('pricing_markup_config')
        .select('config_key')
        .limit(1);

      if (error) {
        if (import.meta.env.DEV) {
          console.debug('[MarkupService] pricing_markup_config table unavailable, using defaults');
        }
        markupCache.tableUnavailable = true;
        return false;
      }
      return true;
    } catch {
      markupCache.tableUnavailable = true;
      return false;
    } finally {
      markupProbeInFlight = null;
    }
  })();

  return markupProbeInFlight;
}

/**
 * Get markup percentage for equipment type
 * Priority: item-specific > equipment-type > global default
 * 
 * ✅ FIX Feb 7, 2026: Probes table existence ONCE; all parallel calls share result.
 * Eliminates 404 spam when pricing_markup_config table doesn't exist.
 */
export async function getMarkupPercentage(
  equipmentType: EquipmentType,
  itemMarkup?: number | null
): Promise<number> {
  // Item-specific markup takes priority
  if (itemMarkup !== undefined && itemMarkup !== null) {
    return itemMarkup;
  }
  
  // Check cache
  if (Date.now() < markupCache.expiry && markupCache.data.has(equipmentType)) {
    return markupCache.data.get(equipmentType)!;
  }
  
  const DEFAULT_MARKUP = 15;

  // ✅ Probe table existence (deduplicated — only ONE network request ever)
  const tableExists = await probeMarkupTable();
  if (!tableExists) {
    markupCache.data.set(equipmentType, DEFAULT_MARKUP);
    markupCache.expiry = Date.now() + CACHE_DURATION_MS;
    return DEFAULT_MARKUP;
  }
  
  try {
    // Try equipment-specific markup first
    const { data: typeMarkup, error: typeError } = await supabase
      .from('pricing_markup_config')
      .select('markup_percentage')
      .eq('config_key', equipmentType)
      .eq('is_active', true)
      .single();
    
    if (!typeError && typeMarkup) {
      markupCache.data.set(equipmentType, typeMarkup.markup_percentage);
      markupCache.expiry = Date.now() + CACHE_DURATION_MS;
      return typeMarkup.markup_percentage;
    }
    
    // Fall back to global default
    const { data: globalMarkup } = await supabase
      .from('pricing_markup_config')
      .select('markup_percentage')
      .eq('config_key', 'global_default')
      .eq('is_active', true)
      .single();
    
    const markup = globalMarkup?.markup_percentage ?? DEFAULT_MARKUP;
    markupCache.data.set(equipmentType, markup);
    markupCache.expiry = Date.now() + CACHE_DURATION_MS;
    return markup;
    
  } catch (error) {
    // Silently fail - these are optional features
    if (import.meta.env.DEV) {
      console.debug(`[MarkupService] Optional pricing table unavailable, using ${DEFAULT_MARKUP}% default`);
    }
    markupCache.tableUnavailable = true;
    return DEFAULT_MARKUP;
  }
}

/**
 * Apply markup to a base price
 */
export function applyMarkup(basePrice: number, markupPercentage: number): number {
  return Math.round(basePrice * (1 + markupPercentage / 100) * 100) / 100;
}

/**
 * Update markup configuration (admin only)
 */
export async function updateMarkupConfig(
  configKey: string,
  markupPercentage: number,
  description?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pricing_markup_config')
      .upsert({
        config_key: configKey,
        markup_percentage: markupPercentage,
        description: description,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'config_key'
      });
    
    if (error) throw error;
    
    // Clear cache
    markupCache.data.clear();
    markupCache.expiry = 0;
    
    return true;
  } catch (error) {
    console.error('[MarkupService] Error updating markup:', error);
    return false;
  }
}

/**
 * Get all markup configurations (for admin panel)
 */
export async function getAllMarkupConfigs(): Promise<Array<{
  config_key: string;
  markup_percentage: number;
  description: string | null;
  is_active: boolean | null;
}>> {
  try {
    const { data, error } = await supabase
      .from('pricing_markup_config')
      .select('config_key, markup_percentage, description, is_active')
      .order('config_key');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[MarkupService] Error fetching markup configs:', error);
    return [];
  }
}

// ============================================================================
// HARDCODED FALLBACKS (ONLY USED IF DATABASE UNAVAILABLE)
// These are NOT the source of truth - just safety nets
// ============================================================================
const FALLBACK_PRICING: Partial<Record<EquipmentType, { price: number; unit: PriceUnit }>> = {
  microgrid_controller: { price: 15000, unit: 'per_unit' },
  dc_patch_panel: { price: 4500, unit: 'per_unit' },
  ac_patch_panel: { price: 3500, unit: 'per_unit' },
  bms: { price: 15000, unit: 'per_unit' },
  ess_enclosure: { price: 35000, unit: 'per_unit' },
  scada: { price: 45000, unit: 'flat' },
  ems_software: { price: 15000, unit: 'per_unit' },
  transformer: { price: 55, unit: 'per_kVA' },
  inverter_pcs: { price: 95, unit: 'per_kW' },
  switchgear: { price: 150, unit: 'per_kW' },
  bess: { price: 125, unit: 'per_kWh' },
  solar: { price: 0.85, unit: 'per_W' },
  ev_charger: { price: 35000, unit: 'per_unit' },
  generator: { price: 700, unit: 'per_kW' },
  fuel_cell: { price: 2500, unit: 'per_kW' },
  wind: { price: 1200, unit: 'per_kW' },
};

// ============================================================================
// EQUIPMENT TYPE METADATA
// ============================================================================

export const EQUIPMENT_TYPE_META: Record<EquipmentType, { 
  label: string; 
  description: string; 
  icon: string;
  defaultUnit: PriceUnit;
}> = {
  bess: { 
    label: 'Battery Energy Storage', 
    description: 'BESS cells, modules, and racks',
    icon: '🔋',
    defaultUnit: 'per_kWh'
  },
  solar: { 
    label: 'Solar PV', 
    description: 'Solar panels and mounting',
    icon: '☀️',
    defaultUnit: 'per_W'
  },
  inverter_pcs: { 
    label: 'Inverter / PCS', 
    description: 'Power conversion systems',
    icon: '⚡',
    defaultUnit: 'per_kW'
  },
  transformer: { 
    label: 'Transformer', 
    description: 'Step-up/step-down transformers',
    icon: '🔌',
    defaultUnit: 'per_kVA'
  },
  switchgear: { 
    label: 'Switchgear', 
    description: 'Medium/high voltage switchgear',
    icon: '🔲',
    defaultUnit: 'per_kW'
  },
  microgrid_controller: { 
    label: 'Microgrid Controller', 
    description: 'Microgrid management systems',
    icon: '🎛️',
    defaultUnit: 'per_unit'
  },
  dc_patch_panel: { 
    label: 'DC Patch Panel', 
    description: 'DC distribution and switching',
    icon: '📊',
    defaultUnit: 'per_unit'
  },
  ac_patch_panel: { 
    label: 'AC Patch Panel', 
    description: 'AC distribution panels',
    icon: '📈',
    defaultUnit: 'per_unit'
  },
  bms: { 
    label: 'Battery Management System', 
    description: 'BMS hardware and software',
    icon: '🖥️',
    defaultUnit: 'per_unit'
  },
  ess_enclosure: { 
    label: 'ESS Enclosure', 
    description: 'Containers and cabinets',
    icon: '📦',
    defaultUnit: 'per_unit'
  },
  scada: { 
    label: 'SCADA System', 
    description: 'Supervisory control systems',
    icon: '📡',
    defaultUnit: 'flat'
  },
  ems_software: { 
    label: 'EMS Software', 
    description: 'Energy management software',
    icon: '💻',
    defaultUnit: 'per_unit'
  },
  ev_charger: { 
    label: 'EV Charger', 
    description: 'Electric vehicle charging equipment',
    icon: '🚗',
    defaultUnit: 'per_unit'
  },
  generator: { 
    label: 'Generator', 
    description: 'Backup power generators',
    icon: '⛽',
    defaultUnit: 'per_kW'
  },
  fuel_cell: { 
    label: 'Fuel Cell', 
    description: 'Hydrogen and natural gas fuel cells',
    icon: '🔬',
    defaultUnit: 'per_kW'
  },
  wind: { 
    label: 'Wind Turbine', 
    description: 'Wind power generation',
    icon: '💨',
    defaultUnit: 'per_kW'
  }
};

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get all pricing tiers for an equipment type
 */
export async function getEquipmentPricing(
  equipmentType: EquipmentType,
  options?: { includeInactive?: boolean }
): Promise<EquipmentPricingTier[]> {
  try {
    let query = supabase
      .from('equipment_pricing_tiers')
      .select('*')
      .eq('equipment_type', equipmentType)
      .order('tier_name')
      .order('size_min', { nullsFirst: true });
    
    if (!options?.includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as unknown as EquipmentPricingTier[];
  } catch (error) {
    console.error(`[EquipmentPricingService] Error fetching ${equipmentType} pricing:`, error);
    return [];
  }
}

/**
 * Get best matching price for equipment based on tier and size
 */
export async function getEquipmentPrice(query: PricingQuery): Promise<EquipmentPrice | null> {
  try {
    let dbQuery = supabase
      .from('equipment_pricing_tiers')
      .select('*')
      .eq('equipment_type', query.equipmentType)
      .eq('is_active', true);
    
    // Filter by tier if specified
    if (query.tier) {
      dbQuery = dbQuery.eq('tier_name', query.tier);
    }
    
    // Filter by manufacturer if specified
    if (query.manufacturer) {
      dbQuery = dbQuery.ilike('manufacturer', `%${query.manufacturer}%`);
    }
    
    const { data: rawData, error } = await dbQuery.order('tier_name');
    
    if (error) throw error;
    if (!rawData || rawData.length === 0) return null;
    
    const data = rawData as unknown as EquipmentPricingTier[];
    
    // Find best match based on size
    let bestMatch: EquipmentPricingTier | undefined;
    
    if (query.size !== undefined) {
      // Find tier that matches the size range
      bestMatch = data.find((tier) => {
        const min = tier.size_min ?? 0;
        const max = tier.size_max ?? Infinity;
        return query.size! >= min && query.size! <= max;
      });
    }
    
    // Fall back to first matching tier if no size match
    if (!bestMatch) {
      bestMatch = data[0];
    }
    
    // At this point bestMatch is guaranteed to exist because data.length > 0
    const match = bestMatch as EquipmentPricingTier;
    
    // Get markup for this equipment type (check item-level override first)
    const itemMarkup = (match as EquipmentPricingTier & { markup_percentage?: number }).markup_percentage;
    const markupPct = await getMarkupPercentage(query.equipmentType, itemMarkup);
    
    return {
      price: match.base_price,
      priceWithMarkup: applyMarkup(match.base_price, markupPct),
      markupPercentage: markupPct,
      unit: match.price_unit as PriceUnit,
      tier: match.tier_name as PricingTier,
      manufacturer: match.manufacturer || undefined,
      model: match.model || undefined,
      sourceType: 'database_tier' as const,
      trueQuote: {
        source: match.data_source,
        sourceUrl: match.source_url || undefined,
        sourceDate: match.source_date || undefined,
        confidence: match.confidence_level as ConfidenceLevel,
        methodology: generateMethodologyText(match)
      }
    };
  } catch (error) {
    console.error(`[EquipmentPricingService] Error getting price for ${query.equipmentType}:`, error);
    return null;
  }
}

/**
 * Calculate total cost for equipment
 */
export async function calculateEquipmentCost(
  equipmentType: EquipmentType,
  quantity: number,
  tier: PricingTier = 'standard',
  sizeKw?: number
): Promise<{ 
  totalCost: number; 
  unitPrice: number; 
  unit: PriceUnit;
  trueQuote: TrueQuoteAttribution;
} | null> {
  const priceData = await getEquipmentPrice({
    equipmentType,
    tier,
    size: sizeKw
  });
  
  if (!priceData) return null;
  
  let totalCost: number;
  
  switch (priceData.unit) {
    case 'per_kWh':
      totalCost = priceData.price * quantity; // quantity in kWh
      break;
    case 'per_kW':
    case 'per_kVA':
      totalCost = priceData.price * quantity; // quantity in kW or kVA
      break;
    case 'per_W':
      totalCost = priceData.price * quantity * 1000; // quantity in kW, price per W
      break;
    case 'per_unit':
      totalCost = priceData.price * Math.ceil(quantity);
      break;
    case 'flat':
      totalCost = priceData.price;
      break;
    default:
      totalCost = priceData.price * quantity;
  }
  
  return {
    totalCost: Math.round(totalCost * 100) / 100,
    unitPrice: priceData.price,
    unit: priceData.unit,
    trueQuote: priceData.trueQuote
  };
}

/**
 * Get all equipment types with their latest pricing
 */
export async function getAllEquipmentPricing(): Promise<Record<EquipmentType, EquipmentPricingTier[]>> {
  try {
    const { data, error } = await supabase
      .from('equipment_pricing_tiers')
      .select('*')
      .eq('is_active', true)
      .order('equipment_type')
      .order('tier_name');
    
    if (error) throw error;
    
    // Group by equipment type
    const grouped: Record<string, EquipmentPricingTier[]> = {};
    
    for (const tier of (data || []) as unknown as EquipmentPricingTier[]) {
      if (!grouped[tier.equipment_type]) {
        grouped[tier.equipment_type] = [];
      }
      grouped[tier.equipment_type].push(tier);
    }
    
    return grouped as Record<EquipmentType, EquipmentPricingTier[]>;
  } catch (error) {
    console.error('[EquipmentPricingService] Error fetching all pricing:', error);
    return {} as Record<EquipmentType, EquipmentPricingTier[]>;
  }
}

/**
 * Update equipment pricing tier
 */
export async function updateEquipmentPricing(
  id: string,
  updates: Partial<Omit<EquipmentPricingTier, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('equipment_pricing_tiers')
      .update(updates as any)
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[EquipmentPricingService] Error updating pricing:', error);
    return false;
  }
}

/**
 * Create new equipment pricing tier
 */
export async function createEquipmentPricing(
  tier: Omit<EquipmentPricingTier, 'id' | 'created_at' | 'updated_at'>
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('equipment_pricing_tiers')
      .insert(tier as any)
      .select('id')
      .single();
    
    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('[EquipmentPricingService] Error creating pricing:', error);
    return null;
  }
}

/**
 * Delete equipment pricing tier (soft delete)
 */
export async function deleteEquipmentPricing(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('equipment_pricing_tiers')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[EquipmentPricingService] Error deleting pricing:', error);
    return false;
  }
}

// ============================================================================
// INTEGRATION WITH MARKET DATA
// ============================================================================

/**
 * ✅ MASTER SSOT FUNCTION: Get equipment price with market data priority
 * 
 * PRIORITY ORDER:
 * 1. Live market data (collected_market_prices, verified, recent)
 * 2. Database pricing tiers (equipment_pricing_tiers)
 * 3. Hardcoded fallbacks (only if database unavailable)
 * 
 * This is the function that equipmentCalculations.ts should call.
 */
export async function getMarketAdjustedPrice(
  equipmentType: EquipmentType,
  options?: {
    tier?: PricingTier;
    sizeKw?: number;
    region?: string;
    manufacturer?: string;
    maxAgedays?: number;
  }
): Promise<EquipmentPrice> {
  const cacheKey = `${equipmentType}-${options?.tier || 'standard'}-${options?.sizeKw || 0}`;
  
  // Check cache first
  if (Date.now() < priceCache.expiry && priceCache.data.has(cacheKey)) {
    return priceCache.data.get(cacheKey)!;
  }
  
  const tier = options?.tier || 'standard';
  const maxAgeDays = options?.maxAgedays || 30;
  
  // Step 1: Try live market data first (optional table)
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    
    const { data: marketPrices, error: marketError } = await supabase
      .from('collected_market_prices')
      .select('*')
      .eq('equipment_type', equipmentType)
      .eq('is_verified', true)
      .gte('price_date', cutoffDate.toISOString())
      .order('price_date', { ascending: false })
      .limit(5);
    
    // Silently handle missing table - this is an optional market intelligence feature
    if (marketError && (marketError.code === 'PGRST116' || marketError.message?.includes('404') || marketError.message?.includes('400'))) {
      // Table doesn't exist or bad request - skip to fallback pricing
      if (import.meta.env.DEV) {
        console.debug('[PricingService] Market pricing table not available, using fallback');
      }
      // Fall through to Step 2 (database pricing tables)
    } else if (!marketError && marketPrices && marketPrices.length > 0) {
      // Calculate weighted average from market data
      interface MarketPrice { price: number; confidence?: number; price_date: string; source_name?: string; }
      const prices = marketPrices as unknown as MarketPrice[];
      
      // Weight by recency (newer = higher weight)
      let totalWeight = 0;
      let weightedSum = 0;
      
      prices.forEach((p, index) => {
        const weight = 1 / (index + 1); // First result gets weight 1, second gets 0.5, etc.
        totalWeight += weight;
        weightedSum += p.price * weight;
      });
      
      const avgPrice = weightedSum / totalWeight;
      const latestSource = prices[0];
      
      // Get markup for this equipment type
      const markupPct = await getMarkupPercentage(equipmentType);
      const basePrice = Math.round(avgPrice * 100) / 100;
      
      const result: EquipmentPrice = {
        price: basePrice,
        priceWithMarkup: applyMarkup(basePrice, markupPct),
        markupPercentage: markupPct,
        unit: EQUIPMENT_TYPE_META[equipmentType].defaultUnit,
        tier: tier,
        sourceType: 'market_data',
        trueQuote: {
          source: `Market data (${prices.length} sources)`,
          sourceDate: latestSource.price_date?.split('T')[0],
          confidence: prices.length >= 3 ? 'high' : 'medium',
          methodology: `Weighted average from ${prices.length} verified market sources, most recent: ${latestSource.source_name || 'Unknown'}`
        }
      };
      
      // Update cache
      priceCache.data.set(cacheKey, result);
      priceCache.expiry = Date.now() + CACHE_DURATION_MS;
      
      return result;
    }
  } catch (error) {
    console.warn(`[EquipmentPricingService] Market data lookup failed for ${equipmentType}:`, error);
  }
  
  // Step 2: Try database pricing tiers
  const dbPrice = await getEquipmentPrice({
    equipmentType,
    tier,
    size: options?.sizeKw,
    manufacturer: options?.manufacturer
  });
  
  if (dbPrice) {
    priceCache.data.set(cacheKey, dbPrice);
    priceCache.expiry = Date.now() + CACHE_DURATION_MS;
    return dbPrice;
  }
  
  // Step 3: Hardcoded fallback (last resort)
  console.warn(`[EquipmentPricingService] Using fallback pricing for ${equipmentType} - database unavailable`);
  
  const fallback = FALLBACK_PRICING[equipmentType] || { price: 10000, unit: 'per_unit' as PriceUnit };
  
  // Get markup even for fallback
  const markupPct = await getMarkupPercentage(equipmentType);
  
  const fallbackResult: EquipmentPrice = {
    price: fallback.price,
    priceWithMarkup: applyMarkup(fallback.price, markupPct),
    markupPercentage: markupPct,
    unit: fallback.unit,
    tier: 'standard',
    sourceType: 'fallback',
    trueQuote: {
      source: 'Hardcoded fallback',
      confidence: 'estimate',
      methodology: 'Fallback pricing used due to database unavailability'
    }
  };
  
  return fallbackResult;
}

/**
 * Sync pricing from market data sources
 * Called by daily scraper job
 */
export async function syncPricingFromMarketData(
  equipmentType: EquipmentType
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;
  
  try {
    // Get latest market prices
    const { data: marketPrices, error: marketError } = await supabase
      .from('collected_market_prices')
      .select('*')
      .eq('equipment_type', equipmentType)
      .eq('is_verified', true)
      .order('price_date', { ascending: false })
      .limit(10);
    
    if (marketError) {
      errors.push(`Market data fetch error: ${marketError.message}`);
      return { updated, errors };
    }
    
    if (!marketPrices || marketPrices.length === 0) {
      return { updated, errors: ['No verified market prices found'] };
    }
    
    // Calculate weighted average
    interface MarketPrice { price: number; [key: string]: unknown; }
    const avgPrice = (marketPrices as unknown as MarketPrice[]).reduce((sum, p) => sum + p.price, 0) / marketPrices.length;
    
    // Update standard tier pricing
    const { error: updateError } = await supabase
      .from('equipment_pricing_tiers')
      .update({
        base_price: Math.round(avgPrice * 100) / 100,
        data_source: `Market average (${marketPrices.length} sources)`,
        source_date: new Date().toISOString().split('T')[0],
        confidence_level: marketPrices.length >= 5 ? 'high' : 'medium'
      })
      .eq('equipment_type', equipmentType)
      .eq('tier_name', 'standard')
      .is('size_min', null);
    
    if (updateError) {
      errors.push(`Update error: ${updateError.message}`);
    } else {
      updated++;
    }
    
  } catch (error) {
    errors.push(`Sync error: ${error}`);
  }
  
  return { updated, errors };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateMethodologyText(tier: EquipmentPricingTier): string {
  const parts: string[] = [];
  
  if (tier.manufacturer && tier.model) {
    parts.push(`Based on ${tier.manufacturer} ${tier.model} pricing`);
  }
  
  if (tier.source_date) {
    const date = new Date(tier.source_date);
    parts.push(`as of ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
  }
  
  if (tier.confidence_level === 'high') {
    parts.push('(verified manufacturer pricing)');
  } else if (tier.confidence_level === 'estimate') {
    parts.push('(industry estimate)');
  }
  
  return parts.join(' ') || 'Standard industry pricing';
}

/**
 * Get pricing summary for TrueQuote™ display
 */
export function formatPriceForDisplay(
  price: number,
  unit: PriceUnit
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
  
  const unitLabels: Record<PriceUnit, string> = {
    per_kWh: '/kWh',
    per_kW: '/kW',
    per_W: '/W',
    per_kVA: '/kVA',
    per_unit: ' each',
    per_point: '/point',
    flat: ' (one-time)'
  };
  
  return `${formatted}${unitLabels[unit]}`;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  // Core pricing functions
  getEquipmentPricing,
  getEquipmentPrice,
  getMarketAdjustedPrice,  // ✅ NEW: Master SSOT function with market data
  calculateEquipmentCost,
  getAllEquipmentPricing,
  
  // Admin functions
  updateEquipmentPricing,
  createEquipmentPricing,
  deleteEquipmentPricing,
  
  // Market data sync
  syncPricingFromMarketData,
  
  // Display helpers
  formatPriceForDisplay,
  
  // Metadata
  EQUIPMENT_TYPE_META,
  FALLBACK_PRICING
};

// ============================================================================
// CONVENIENCE EXPORTS FOR equipmentCalculations.ts SSOT INTEGRATION
// ============================================================================

/**
 * Get microgrid controller price (NEW equipment type)
 */
export async function getMicrogridControllerPrice(tier: PricingTier = 'standard'): Promise<number> {
  const result = await getMarketAdjustedPrice('microgrid_controller', { tier });
  return result.price;
}

/**
 * Get BMS price by system size
 */
export async function getBMSPrice(systemKWh: number, tier: PricingTier = 'standard'): Promise<number> {
  const result = await getMarketAdjustedPrice('bms', { tier, sizeKw: systemKWh });
  return result.price;
}

/**
 * Get SCADA system price
 */
export async function getSCADAPrice(tier: PricingTier = 'standard'): Promise<number> {
  const result = await getMarketAdjustedPrice('scada', { tier });
  return result.price;
}

/**
 * Get EMS software price
 */
export async function getEMSSoftwarePrice(tier: PricingTier = 'standard'): Promise<number> {
  const result = await getMarketAdjustedPrice('ems_software', { tier });
  return result.price;
}

/**
 * Get DC patch panel price
 */
export async function getDCPatchPanelPrice(tier: PricingTier = 'standard'): Promise<number> {
  const result = await getMarketAdjustedPrice('dc_patch_panel', { tier });
  return result.price;
}

/**
 * Get AC patch panel price
 */
export async function getACPatchPanelPrice(tier: PricingTier = 'standard'): Promise<number> {
  const result = await getMarketAdjustedPrice('ac_patch_panel', { tier });
  return result.price;
}

/**
 * Get ESS enclosure price by capacity
 */
export async function getESSEnclosurePrice(capacityKWh: number, tier: PricingTier = 'standard'): Promise<number> {
  const result = await getMarketAdjustedPrice('ess_enclosure', { tier, sizeKw: capacityKWh });
  return result.price;
}

/**
 * Get transformer price per kVA
 */
export async function getTransformerPricePerKVA(sizeKVA: number, tier: PricingTier = 'standard'): Promise<number> {
  const result = await getMarketAdjustedPrice('transformer', { tier, sizeKw: sizeKVA });
  return result.price;
}

/**
 * Get inverter/PCS price per kW
 */
export async function getInverterPricePerKW(sizeKW: number, tier: PricingTier = 'standard'): Promise<number> {
  const result = await getMarketAdjustedPrice('inverter_pcs', { tier, sizeKw: sizeKW });
  return result.price;
}

/**
 * Get switchgear price per kW
 */
export async function getSwitchgearPricePerKW(tier: PricingTier = 'standard'): Promise<number> {
  const result = await getMarketAdjustedPrice('switchgear', { tier });
  return result.price;
}

/**
 * Clear pricing cache (call after admin updates)
 */
export function clearPriceCache(): void {
  priceCache.data.clear();
  priceCache.expiry = 0;
  console.log('[EquipmentPricingService] Price cache cleared');
}
