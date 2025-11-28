/**
 * Equipment Repository
 * ====================
 * Infrastructure layer - All database access for equipment data.
 * 
 * This repository handles fetching equipment templates, specifications,
 * and configuration equipment from the database.
 * 
 * Part of the infrastructure layer - handles data persistence only.
 */

import { supabase } from '@/services/supabaseClient';
import type { Database } from '@/types/database.types';

// Database row types
type EquipmentTemplateRow = Database['public']['Tables']['equipment_templates']['Row'];
type ConfigurationEquipmentRow = Database['public']['Tables']['configuration_equipment']['Row'];

/**
 * Repository for Equipment data access
 */
export class EquipmentRepository {
  
  /**
   * Get equipment template by ID
   */
  async findById(id: string): Promise<EquipmentTemplateRow | null> {
    const { data, error } = await supabase
      .from('equipment_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching equipment template:', error);
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all equipment templates for a use case
   */
  async findByUseCaseId(useCaseId: string): Promise<EquipmentTemplateRow[]> {
    const { data, error } = await supabase
      .from('equipment_templates')
      .select('*')
      .eq('use_case_id', useCaseId)
      .order('display_order');

    if (error) {
      console.error('Error fetching equipment templates:', error);
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get equipment for a specific configuration
   */
  async findByConfigurationId(configurationId: string): Promise<Array<ConfigurationEquipmentRow & {
    equipment_template: EquipmentTemplateRow;
  }>> {
    const { data, error } = await supabase
      .from('configuration_equipment')
      .select(`
        *,
        equipment_template:equipment_templates(*)
      `)
      .eq('configuration_id', configurationId)
      .order('display_order');

    if (error) {
      console.error('Error fetching configuration equipment:', error);
      throw new Error(`Failed to fetch configuration equipment: ${error.message}`);
    }

    return data as any || [];
  }

  /**
   * Get equipment templates by category
   */
  async findByCategory(category: string): Promise<EquipmentTemplateRow[]> {
    const { data, error } = await supabase
      .from('equipment_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching equipment by category:', error);
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all active equipment templates
   */
  async findAll(includeInactive = false): Promise<EquipmentTemplateRow[]> {
    let query = supabase
      .from('equipment_templates')
      .select('*')
      .order('display_order');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching equipment templates:', error);
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search equipment templates by name or description
   */
  async search(searchTerm: string): Promise<EquipmentTemplateRow[]> {
    const { data, error } = await supabase
      .from('equipment_templates')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error searching equipment:', error);
      throw new Error(`Failed to search equipment: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get equipment statistics
   */
  async getStatistics(): Promise<{
    totalEquipment: number;
    byCategory: Record<string, number>;
    averagePowerKw: number;
    totalNameplateCapacityKw: number;
  }> {
    const { data, error } = await supabase
      .from('equipment_templates')
      .select('category, nameplate_power_kw')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching equipment statistics:', error);
      return {
        totalEquipment: 0,
        byCategory: {},
        averagePowerKw: 0,
        totalNameplateCapacityKw: 0
      };
    }

    const stats = {
      totalEquipment: data.length,
      byCategory: {} as Record<string, number>,
      averagePowerKw: 0,
      totalNameplateCapacityKw: 0
    };

    data.forEach(item => {
      // Count by category
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
      
      // Sum power
      stats.totalNameplateCapacityKw += item.nameplate_power_kw || 0;
    });

    stats.averagePowerKw = data.length > 0 
      ? stats.totalNameplateCapacityKw / data.length 
      : 0;

    return stats;
  }
}

// Export singleton instance
export const equipmentRepository = new EquipmentRepository();
