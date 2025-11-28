// @ts-nocheck
/**
 * Pricing Repository
 * ==================
 * Infrastructure layer - All database access for pricing data.
 * 
 * This repository handles fetching equipment pricing, configurations,
 * and pricing scenarios from the database.
 * 
 * Part of the infrastructure layer - handles data persistence only.
 */

import { supabase } from '@/services/supabaseClient';
import type { Database } from '@/types/database.types';
import type {
  BatteryPricing,
  InverterPricing,
  TransformerPricing,
  SolarPricing,
  WindPricing,
  GeneratorPricing
} from '@/core/domain';

// Database row types
// type PricingConfigurationRow = Database['public']['Tables']['pricing_configurations']['Row'];
// type CalculationFormulaRow = Database['public']['Tables']['calculation_formulas']['Row'];

/**
 * Repository for Pricing data access
 */
export class PricingRepository {
  
  /**
   * Get battery pricing from database
   */
  async getBatteryPricing(options?: {
    location?: string;
    capacityMWh?: number;
    chemistry?: string;
  }): Promise<BatteryPricing | null> {
    let query = supabase
      .from('pricing_configurations')
      .select('*')
      .eq('equipment_type', 'battery')
      .eq('is_active', true);

    if (options?.location) {
      query = query.eq('region', options.location);
    }

    if (options?.chemistry) {
      query = query.eq('metadata->>chemistry', options.chemistry);
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) return null;

    return this.mapToBatteryPricing(data);
  }

  /**
   * Get inverter pricing from database
   */
  async getInverterPricing(options?: {
    location?: string;
    powerKW?: number;
  }): Promise<InverterPricing | null> {
    let query = supabase
      .from('pricing_configurations')
      .select('*')
      .eq('equipment_type', 'inverter')
      .eq('is_active', true);

    if (options?.location) {
      query = query.eq('region', options.location);
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) return null;

    return this.mapToInverterPricing(data);
  }

  /**
   * Get transformer pricing from database
   */
  async getTransformerPricing(options?: {
    location?: string;
    powerMVA?: number;
  }): Promise<TransformerPricing | null> {
    let query = supabase
      .from('pricing_configurations')
      .select('*')
      .eq('equipment_type', 'transformer')
      .eq('is_active', true);

    if (options?.location) {
      query = query.eq('region', options.location);
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) return null;

    return this.mapToTransformerPricing(data);
  }

  /**
   * Get solar pricing from database
   */
  async getSolarPricing(options?: {
    location?: string;
    capacityMW?: number;
  }): Promise<SolarPricing | null> {
    let query = supabase
      .from('pricing_configurations')
      .select('*')
      .eq('equipment_type', 'solar')
      .eq('is_active', true);

    if (options?.location) {
      query = query.eq('region', options.location);
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) return null;

    return this.mapToSolarPricing(data);
  }

  /**
   * Get wind pricing from database
   */
  async getWindPricing(options?: {
    location?: string;
    capacityMW?: number;
  }): Promise<WindPricing | null> {
    let query = supabase
      .from('pricing_configurations')
      .select('*')
      .eq('equipment_type', 'wind')
      .eq('is_active', true);

    if (options?.location) {
      query = query.eq('region', options.location);
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) return null;

    return this.mapToWindPricing(data);
  }

  /**
   * Get generator pricing from database
   */
  async getGeneratorPricing(options?: {
    location?: string;
    powerKW?: number;
    fuelType?: string;
  }): Promise<GeneratorPricing | null> {
    let query = supabase
      .from('pricing_configurations')
      .select('*')
      .eq('equipment_type', 'generator')
      .eq('is_active', true);

    if (options?.location) {
      query = query.eq('region', options.location);
    }

    if (options?.fuelType) {
      query = query.eq('metadata->>fuel_type', options.fuelType);
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) return null;

    return this.mapToGeneratorPricing(data);
  }

  async getPricingConfigurationById(id: string): Promise<PricingConfigurationRow | null> {
    const { data, error } = await supabase
      .from('pricing_configurations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get all pricing configurations by equipment type
   */
  async getPricingConfigurationsByType(equipmentType: string): Promise<PricingConfigurationRow[]> {
    const { data, error } = await supabase
      .from('pricing_configurations')
      .select('*')
      .eq('equipment_type', equipmentType)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pricing configurations:', error);
      return [];
    }

    return data || [];
  }

  // ============================================
  // PRIVATE MAPPING METHODS
  // ============================================

  private mapToBatteryPricing(row: PricingConfigurationRow): BatteryPricing {
    const metadata = row.metadata as any || {};
    return {
      pricePerKWh: row.price_per_unit,
      manufacturer: metadata.manufacturer || 'Generic',
      model: metadata.model || 'Standard',
      chemistry: metadata.chemistry || 'LFP',
      warrantyYears: metadata.warranty_years || 10,
      cycleLife: metadata.cycle_life || 6000,
      efficiency: metadata.efficiency || 95,
      dataSource: 'database',
      lastUpdated: new Date(row.updated_at),
      confidence: 'high'
    };
  }

  private mapToInverterPricing(row: PricingConfigurationRow): InverterPricing {
    const metadata = row.metadata as any || {};
    return {
      pricePerKW: row.price_per_unit,
      manufacturer: metadata.manufacturer || 'Generic',
      model: metadata.model || 'Standard',
      efficiency: metadata.efficiency || 98,
      warrantyYears: metadata.warranty_years || 10,
      dataSource: 'database',
      lastUpdated: new Date(row.updated_at)
    };
  }

  private mapToTransformerPricing(row: PricingConfigurationRow): TransformerPricing {
    const metadata = row.metadata as any || {};
    return {
      pricePerMVA: row.price_per_unit,
      manufacturer: metadata.manufacturer || 'Generic',
      voltage: metadata.voltage || '690V/400V',
      efficiency: metadata.efficiency || 98,
      dataSource: 'database',
      lastUpdated: new Date(row.updated_at)
    };
  }

  private mapToSolarPricing(row: PricingConfigurationRow): SolarPricing {
    const metadata = row.metadata as any || {};
    return {
      pricePerWatt: row.price_per_unit,
      manufacturer: metadata.manufacturer || 'Generic',
      model: metadata.model || 'Standard',
      efficiency: metadata.efficiency || 20,
      warrantyYears: metadata.warranty_years || 25,
      dataSource: 'database',
      lastUpdated: new Date(row.updated_at)
    };
  }

  private mapToWindPricing(row: PricingConfigurationRow): WindPricing {
    const metadata = row.metadata as any || {};
    return {
      pricePerKW: row.price_per_unit,
      manufacturer: metadata.manufacturer || 'Generic',
      model: metadata.model || 'Standard',
      capacityFactor: metadata.capacity_factor || 0.35,
      dataSource: 'database',
      lastUpdated: new Date(row.updated_at)
    };
  }

  private mapToGeneratorPricing(row: PricingConfigurationRow): GeneratorPricing {
    const metadata = row.metadata as any || {};
    return {
      pricePerKW: row.price_per_unit,
      manufacturer: metadata.manufacturer || 'Generic',
      model: metadata.model || 'Standard',
      fuelType: metadata.fuel_type || 'diesel',
      efficiency: metadata.efficiency || 35,
      dataSource: 'database',
      lastUpdated: new Date(row.updated_at)
    };
  }
}

// Export singleton instance
export const pricingRepository = new PricingRepository();
