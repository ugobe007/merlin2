// @ts-nocheck
/**
 * Use Case Repository
 * ===================
 * Infrastructure layer - All database access for use cases.
 * 
 * This repository encapsulates ALL Supabase queries for use cases,
 * configurations, equipment, and custom questions.
 * 
 * Part of the infrastructure layer - handles data persistence only.
 */

import { supabase } from '@/services/supabaseClient';
import type { Database } from '@/types/database.types';
import type { 
  UseCaseRow,
  UseCaseWithConfiguration,
  DetailedUseCase
} from '@/core/domain';

// Database row types
type UseCaseConfigurationRow = Database['public']['Tables']['use_case_configurations']['Row'];
type CustomQuestionRow = Database['public']['Tables']['custom_questions']['Row'];
type RecommendedApplicationRow = Database['public']['Tables']['recommended_applications']['Row'];

/**
 * Repository for Use Case data access
 */
export class UseCaseRepository {
  
  /**
   * Get all use cases with optional filters
   */
  async findAll(options?: {
    includeInactive?: boolean;
    category?: string;
    tier?: string;
  }): Promise<UseCaseRow[]> {
    let query = supabase
      .from('use_cases')
      .select('*')
      .order('display_order', { ascending: true });

    if (!options?.includeInactive) {
      query = query.eq('is_active', true);
    }

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.tier) {
      query = query.eq('required_tier', options.tier);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching use cases:', error);
      throw new Error(`Failed to fetch use cases: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get use case by ID
   */
  async findById(id: string): Promise<UseCaseRow | null> {
    const { data, error } = await supabase
      .from('use_cases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching use case by ID:', error);
      throw new Error(`Failed to fetch use case: ${error.message}`);
    }

    return data;
  }

  /**
   * Get use case by slug
   */
  async findBySlug(slug: string): Promise<UseCaseRow | null> {
    const { data, error } = await supabase
      .from('use_cases')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching use case by slug:', error);
      throw new Error(`Failed to fetch use case: ${error.message}`);
    }

    return data;
  }

  /**
   * Get detailed use case by slug with all related data
   * (configurations, questions, applications)
   */
  async findDetailedBySlug(slug: string): Promise<DetailedUseCase | null> {
    // First get the use case
    const useCase = await this.findBySlug(slug);
    if (!useCase) return null;

    // Fetch all related data in parallel
    const [configurationsResult, questionsResult, applicationsResult] = await Promise.allSettled([
      this.findConfigurationsByUseCaseId(useCase.id),
      this.findCustomQuestions(useCase.id),
      this.findRecommendedApplications(useCase.id)
    ]);

    return {
      ...useCase,
      configurations: configurationsResult.status === 'fulfilled' ? configurationsResult.value : [],
      customQuestions: questionsResult.status === 'fulfilled' ? questionsResult.value : [],
      recommended_applications: applicationsResult.status === 'fulfilled' ? applicationsResult.value : []
    };
  }

  /**
   * Get detailed use case with all relationships
   */
  async findDetailedById(id: string): Promise<DetailedUseCase | null> {
    const { data, error } = await supabase
      .from('use_cases')
      .select(`
        *,
        configurations:use_case_configurations(*),
        custom_questions(*),
        recommended_applications(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching detailed use case:', error);
      throw new Error(`Failed to fetch detailed use case: ${error.message}`);
    }

    return data as unknown as DetailedUseCase;
  }

  /**
   * Get configurations for a use case
   */
  async findConfigurationsByUseCaseId(useCaseId: string): Promise<UseCaseConfigurationRow[]> {
    const { data, error } = await supabase
      .from('use_case_configurations')
      .select('*')
      .eq('use_case_id', useCaseId)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching configurations:', error);
      throw new Error(`Failed to fetch configurations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get default configuration for a use case
   */
  async findDefaultConfiguration(useCaseId: string): Promise<UseCaseConfigurationRow | null> {
    const { data, error } = await supabase
      .from('use_case_configurations')
      .select('*')
      .eq('use_case_id', useCaseId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching default configuration:', error);
      throw new Error(`Failed to fetch default configuration: ${error.message}`);
    }

    return data;
  }

  /**
   * Get custom questions for a use case
   */
  async findCustomQuestions(useCaseId: string): Promise<CustomQuestionRow[]> {
    const { data, error } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('use_case_id', useCaseId)
      .order('display_order');

    if (error) {
      console.error('Error fetching custom questions:', error);
      throw new Error(`Failed to fetch custom questions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get recommended applications for a use case
   */
  async findRecommendedApplications(useCaseId: string): Promise<RecommendedApplicationRow[]> {
    const { data, error } = await supabase
      .from('recommended_applications')
      .select('*')
      .eq('use_case_id', useCaseId);

    if (error) {
      console.error('Error fetching recommended applications:', error);
      throw new Error(`Failed to fetch recommended applications: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Increment usage count for a use case
   */
  async incrementUsageCount(useCaseId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_use_case_usage', {
      use_case_id: useCaseId
    });

    if (error) {
      console.error('Error incrementing usage count:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Update use case analytics
   */
  async updateAnalytics(useCaseId: string, updates: {
    averageRoi?: number;
    averagePaybackYears?: number;
  }): Promise<void> {
    const { error } = await supabase
      .from('use_cases')
      .update({
        average_roi: updates.averageRoi,
        average_payback_years: updates.averagePaybackYears,
        last_used: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', useCaseId);

    if (error) {
      console.error('Error updating analytics:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Get use case statistics
   */
  async getStatistics(): Promise<{
    totalUseCases: number;
    totalConfigurations: number;
    totalEquipmentTemplates: number;
    mostPopularUseCases: Array<{ id: string; name: string; usage_count: number }>;
  }> {
    const [useCasesResult, configurationsResult, equipmentResult] = await Promise.all([
      supabase.from('use_cases').select('id, usage_count, name', { count: 'exact' }),
      supabase.from('use_case_configurations').select('id', { count: 'exact' }),
      supabase.from('equipment_templates').select('id', { count: 'exact' })
    ]);

    const mostPopular = (useCasesResult.data || [])
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 5);

    return {
      totalUseCases: useCasesResult.count || 0,
      totalConfigurations: configurationsResult.count || 0,
      totalEquipmentTemplates: equipmentResult.count || 0,
      mostPopularUseCases: mostPopular
    };
  }
}

// Export singleton instance
export const useCaseRepository = new UseCaseRepository();
