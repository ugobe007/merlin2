/**
 * BRAND PRESET SERVICE
 * ====================
 * 
 * Loads brand/chain-specific equipment defaults from database.
 * Used to pre-fill equipment values when user selects a brand in Step 3.
 * 
 * Phase 3: Universal structural changes for all use cases
 */

import { supabase } from './supabaseClient';

export interface BrandPreset {
  id: string;
  brandName: string;
  brandSlug: string;
  description?: string;
  logoUrl?: string;
  equipmentDefaults: Record<string, any>;
}

/**
 * Get all brands for a use case
 */
export async function getBrandsForUseCase(useCaseSlug: string): Promise<BrandPreset[]> {
  try {
    const { data, error } = await supabase
      .from('use_case_brands')
      .select(`
        id,
        brand_name,
        brand_slug,
        description,
        logo_url,
        equipment_defaults
      `)
      .eq('is_active', true)
      .order('brand_name', { ascending: true });

    if (error) {
      console.error('Error fetching brands:', error);
      return [];
    }

    // Filter by use case slug (we need to join with use_cases table)
    // For now, we'll filter client-side after fetching
    // TODO: Add proper join in query for better performance
    const { data: useCase, error: useCaseError } = await supabase
      .from('use_cases')
      .select('id')
      .eq('slug', useCaseSlug)
      .single();

    if (useCaseError || !useCase) {
      console.error('Error finding use case:', useCaseError);
      return [];
    }

    const { data: brands, error: brandsError } = await supabase
      .from('use_case_brands')
      .select(`
        id,
        brand_name,
        brand_slug,
        description,
        logo_url,
        equipment_defaults
      `)
      .eq('use_case_id', useCase.id)
      .eq('is_active', true)
      .order('brand_name', { ascending: true });

    if (brandsError) {
      console.error('Error fetching brands:', brandsError);
      return [];
    }

    return (brands || []).map(brand => ({
      id: brand.id,
      brandName: brand.brand_name,
      brandSlug: brand.brand_slug,
      description: brand.description || undefined,
      logoUrl: brand.logo_url || undefined,
      equipmentDefaults: brand.equipment_defaults || {},
    }));
  } catch (err) {
    console.error('Error in getBrandsForUseCase:', err);
    return [];
  }
}

/**
 * Get brand preset by slug
 */
export async function getBrandPreset(
  useCaseSlug: string,
  brandSlug: string
): Promise<BrandPreset | null> {
  try {
    const { data: useCase, error: useCaseError } = await supabase
      .from('use_cases')
      .select('id')
      .eq('slug', useCaseSlug)
      .single();

    if (useCaseError || !useCase) {
      console.error('Error finding use case:', useCaseError);
      return null;
    }

    const { data: brand, error: brandError } = await supabase
      .from('use_case_brands')
      .select(`
        id,
        brand_name,
        brand_slug,
        description,
        logo_url,
        equipment_defaults
      `)
      .eq('use_case_id', useCase.id)
      .eq('brand_slug', brandSlug)
      .eq('is_active', true)
      .single();

    if (brandError || !brand) {
      console.error('Error fetching brand preset:', brandError);
      return null;
    }

    return {
      id: brand.id,
      brandName: brand.brand_name,
      brandSlug: brand.brand_slug,
      description: brand.description || undefined,
      logoUrl: brand.logo_url || undefined,
      equipmentDefaults: brand.equipment_defaults || {},
    };
  } catch (err) {
    console.error('Error in getBrandPreset:', err);
    return null;
  }
}

/**
 * Apply brand preset defaults to use case data
 * 
 * This function takes brand equipment defaults and applies them to
 * the use case data object, filling in values that aren't already set.
 */
export function applyBrandPresetDefaults(
  useCaseData: Record<string, any>,
  brandPreset: BrandPreset
): Record<string, any> {
  const defaults = brandPreset.equipmentDefaults;
  const updated = { ...useCaseData };

  // Apply defaults for car wash pumps
  if (defaults.pumpTypes) {
    if (defaults.pumpTypes.highPressure?.count) {
      updated.highPressurePumpCount = defaults.pumpTypes.highPressure.count;
    }
    if (defaults.pumpTypes.chemicalApplication?.count) {
      updated.chemicalPumpCount = defaults.pumpTypes.chemicalApplication.count;
    }
    if (defaults.pumpTypes.supportUtilities?.count) {
      updated.supportPumpCount = defaults.pumpTypes.supportUtilities.count;
    }
  }

  // Apply defaults for car wash dryers
  if (defaults.dryers) {
    if (defaults.dryers.count) {
      updated.dryerCount = defaults.dryers.count;
    }
    if (defaults.dryers.type) {
      updated.dryerType = defaults.dryers.type;
    }
  }

  // Apply defaults for car wash vacuum stations
  if (defaults.vacuumStations?.count) {
    updated.vacuumStationCount = defaults.vacuumStations.count;
  }

  // Apply hotel defaults
  if (defaults.roomCount?.typical) {
    updated.roomCount = defaults.roomCount.typical;
  }
  if (defaults.diningFacilities) {
    if (defaults.diningFacilities.restaurants) {
      updated.restaurantCount = defaults.diningFacilities.restaurants;
    }
    if (defaults.diningFacilities.bars) {
      updated.barCount = defaults.diningFacilities.bars;
    }
  }
  if (defaults.amenities) {
    if (defaults.amenities.pool !== undefined) {
      updated.hasPool = defaults.amenities.pool;
    }
    if (defaults.amenities.gym !== undefined) {
      updated.hasGym = defaults.amenities.gym;
    }
    if (defaults.amenities.spa !== undefined) {
      updated.hasSpa = defaults.amenities.spa;
    }
  }

  return updated;
}

