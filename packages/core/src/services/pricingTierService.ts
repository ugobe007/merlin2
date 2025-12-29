/**
 * Pricing Tier Service
 * ====================
 * 
 * Service for querying size-based pricing tiers from the pricing_configurations table.
 * Supports both kW and MWh units for system sizing.
 * 
 * Features:
 * - Size-based pricing tiers (different prices for different system sizes)
 * - 5 pricing levels: low, low_plus, mid, mid_plus, high
 * - Dual unit support: kW for most systems, MWh for very large systems
 * - Source tracking and confidence levels for TrueQuote compliance
 * 
 * Usage:
 * ```typescript
 * const pricing = await getPricingTier('bess', 5000, null, 'mid');
 * // Returns pricing tier for 5 MW BESS system with mid-level pricing
 * ```
 * 
 * Date: December 25, 2025
 */

import { supabase } from '../supabaseClient';

/**
 * Pricing tier price levels
 */
export type PriceLevel = 'low' | 'low_plus' | 'mid' | 'mid_plus' | 'high';

/**
 * Pricing tier result from database
 */
export interface PricingTier {
  id: string;
  config_key: string;
  config_category: string;
  config_data: {
    price_low: number;
    price_low_plus: number;
    price_mid: number;
    price_mid_plus: number;
    price_high: number;
    price_unit: string;
    equipment_pct?: number;
    bos_pct?: number;
    labor_pct?: number;
    soft_costs_pct?: number;
    annual_om_pct?: number;
    source_type?: string;
    source_name?: string;
    source_date?: string;
    notes?: string;
  };
  size_min_kw: number | null;
  size_max_kw: number | null;
  size_min_mwh: number | null;
  size_max_mwh: number | null;
  data_source: string | null;
  confidence_level: 'high' | 'medium' | 'low' | null;
  description: string | null;
  effective_date: string;
  expires_at: string | null;
}

/**
 * Get pricing tier for a system size
 * 
 * @param category - Technology category ('bess', 'solar', 'wind', etc.)
 * @param sizeKW - System size in kW (use for systems < 50 MW)
 * @param sizeMWh - System size in MWh (use for very large systems, e.g., 300 MW = 300 MWh at 1 hour)
 * @param priceLevel - Price level to return (default: 'mid')
 * @returns Pricing tier with selected price level, or null if no tier found
 */
export async function getPricingTier(
  category: string,
  sizeKW?: number | null,
  sizeMWh?: number | null,
  priceLevel: PriceLevel = 'mid'
): Promise<{ price: number; unit: string; tier: PricingTier } | null> {
  try {
    // Try using database function first (more reliable)
    if (sizeKW !== null && sizeKW !== undefined) {
      const { data: funcData, error: funcError } = await supabase.rpc('get_pricing_tier', {
        p_category: category,
        p_size_kw: sizeKW,
        p_size_mwh: null
      });
      
      if (!funcError && funcData && funcData.length > 0) {
        const tierData = funcData[0];
        const configData = tierData.config_data as PricingTier['config_data'];
        
        let price: number = configData.price_mid;
        if (priceLevel === 'low') price = configData.price_low;
        else if (priceLevel === 'low_plus') price = configData.price_low_plus;
        else if (priceLevel === 'mid') price = configData.price_mid;
        else if (priceLevel === 'mid_plus') price = configData.price_mid_plus;
        else if (priceLevel === 'high') price = configData.price_high;
        
        return {
          price,
          unit: configData.price_unit || '$/kWh',
          tier: tierData as PricingTier
        };
      }
    } else if (sizeMWh !== null && sizeMWh !== undefined) {
      const { data: funcData, error: funcError } = await supabase.rpc('get_pricing_tier', {
        p_category: category,
        p_size_kw: null,
        p_size_mwh: sizeMWh
      });
      
      if (!funcError && funcData && funcData.length > 0) {
        const tierData = funcData[0];
        const configData = tierData.config_data as PricingTier['config_data'];
        
        let price: number = configData.price_mid;
        if (priceLevel === 'low') price = configData.price_low;
        else if (priceLevel === 'low_plus') price = configData.price_low_plus;
        else if (priceLevel === 'mid') price = configData.price_mid;
        else if (priceLevel === 'mid_plus') price = configData.price_mid_plus;
        else if (priceLevel === 'high') price = configData.price_high;
        
        return {
          price,
          unit: configData.price_unit || '$/kWh',
          tier: tierData as PricingTier
        };
      }
    }
    
    // Fallback: Manual query with proper filtering
    let query = supabase
      .from('pricing_configurations')
      .select('*')
      .eq('config_category', category)
      .eq('is_active', true);

    if (sizeKW !== null && sizeKW !== undefined) {
      // Filter: size_min_kw <= sizeKW AND (size_max_kw >= sizeKW OR size_max_kw IS NULL)
      query = query
        .or(`size_min_kw.is.null,size_min_kw.lte.${sizeKW}`)
        .or(`size_max_kw.is.null,size_max_kw.gte.${sizeKW}`);
    } else if (sizeMWh !== null && sizeMWh !== undefined) {
      query = query
        .or(`size_min_mwh.is.null,size_min_mwh.lte.${sizeMWh}`)
        .or(`size_max_mwh.is.null,size_max_mwh.gte.${sizeMWh}`);
    }

    const orderBy = sizeKW !== null && sizeKW !== undefined ? 'size_min_kw' : 'size_min_mwh';
    const { data, error } = await query
      .order(orderBy, { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(`⚠️ [PricingTierService] Database query error:`, error);
      return null;
    }

    if (!data) {
      return null;
    }

    const configData = data.config_data as PricingTier['config_data'];
    
    let price: number = configData.price_mid;
    if (priceLevel === 'low') price = configData.price_low;
    else if (priceLevel === 'low_plus') price = configData.price_low_plus;
    else if (priceLevel === 'mid') price = configData.price_mid;
    else if (priceLevel === 'mid_plus') price = configData.price_mid_plus;
    else if (priceLevel === 'high') price = configData.price_high;

    return {
      price,
      unit: configData.price_unit || '$/kWh',
      tier: data as PricingTier
    };
  } catch (error) {
    console.error(`❌ [PricingTierService] Error getting pricing tier:`, error);
    return null;
  }
}

/**
 * Get all pricing tiers for a category
 * 
 * @param category - Technology category ('bess', 'solar', etc.)
 * @returns Array of all active pricing tiers for the category
 */
export async function getAllPricingTiers(category?: string): Promise<PricingTier[]> {
  try {
    let query = supabase
      .from('pricing_configurations')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('config_category', category);
    }

    const { data, error } = await query.order('size_min_kw', { ascending: true, nullsFirst: false });

    if (error) {
      console.warn(`⚠️ [PricingTierService] Error getting all pricing tiers:`, error);
      return [];
    }

    return (data || []) as PricingTier[];
  } catch (error) {
    console.error(`❌ [PricingTierService] Error getting all pricing tiers:`, error);
    return [];
  }
}

/**
 * Get pricing tier by config key
 * 
 * @param configKey - Configuration key (e.g., 'bess-utility-3-10mw')
 * @returns Pricing tier, or null if not found
 */
export async function getPricingTierByKey(configKey: string): Promise<PricingTier | null> {
  try {
    const { data, error } = await supabase
      .from('pricing_configurations')
      .select('*')
      .eq('config_key', configKey)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.warn(`⚠️ [PricingTierService] Error getting pricing tier by key:`, error);
      return null;
    }

    return data as PricingTier | null;
  } catch (error) {
    console.error(`❌ [PricingTierService] Error getting pricing tier by key:`, error);
    return null;
  }
}

/**
 * Helper function to determine whether to use kW or MWh for a given system size
 * 
 * @param sizeMW - System size in MW
 * @returns 'kW' for systems < 50 MW, 'MWh' for larger systems
 */
export function getSizeUnits(sizeMW: number): 'kW' | 'MWh' {
  return sizeMW >= 50 ? 'MWh' : 'kW';
}


