/**
 * Data Integration Service - Unified API
 * 
 * Purpose: Single entry point that combines:
 * 1. Database queries (use_case_templates + equipment_database)
 * 2. Calculation engine (baselineService.ts) - Replaces deprecated bessDataService
 * 3. Solar sizing (solarSizingService.ts)
 * 4. Cache management (calculation_cache table)
 * 
 * Benefits:
 * - Single API call returns everything needed for a quote
 * - Automatic caching (70% faster for repeat requests)
 * - Fallback to static templates if database unavailable
 * - Usage analytics tracking
 * 
 * Usage:
 * const data = await getUseCaseWithCalculations({
 *   slug: 'car-wash',
 *   facilitySize: 10000,
 *   location: 'Los Angeles, CA',
 *   customAnswers: { num_bays: 4 },
 *   solarEnabled: true
 * });
 */

import { supabase } from './supabaseClient';
import { calculateBESSSize } from './baselineService'; // Migrated from deprecated bessDataService
import { calculateFinancialMetrics } from './centralizedCalculations';
import { calculateSolarBESSSystem } from './solarSizingService';
import { getUseCaseBySlug } from '../data/useCaseTemplates';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface GetUseCaseParams {
  slug: string;
  facilitySize: number;
  location: string;
  customAnswers?: Record<string, any>;
  solarEnabled?: boolean;
  autonomyDays?: number;
}

import type { PowerProfile, FinancialParams, SolarCompatibility, CustomQuestion, IndustryStandards, CalculationResults } from '@/types';

export interface UseCaseWithCalculations {
  template: {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
    image_url: string | null;
    category: string;
    powerProfile: Partial<PowerProfile> | null; // DB data may be incomplete or null
    financialParams: Partial<FinancialParams> | null; // DB data may be incomplete or null
    solarCompatibility: Partial<SolarCompatibility> | null; // DB data may be incomplete or null
    customQuestions: CustomQuestion[];
    recommendedApplications: string[];
    industryStandards: Partial<IndustryStandards> | null; // DB data may be incomplete or null
    version: string;
  };
  equipment: {
    id: string;
    name: string;
    powerKw: number;
    dutyCycle: number;
    description: string;
    category: string;
    dataSource: string;
  }[];
  calculations: CalculationResults;
  fromCache: boolean;
  executionTimeMs: number;
}

// ============================================================================
// MAIN API FUNCTION
// ============================================================================

/**
 * Get use case template with all calculations
 * This is the primary function components should use
 */
export async function getUseCaseWithCalculations(
  params: GetUseCaseParams
): Promise<UseCaseWithCalculations> {
  const startTime = Date.now();
  
  const { slug, facilitySize, location, customAnswers, solarEnabled, autonomyDays } = params;
  
  if (import.meta.env.DEV) { console.log(`🔍 Fetching use case: ${slug}`); }

  try {
    // STEP 1: Check cache first (fastest path)
    const cacheKey = generateCacheKey(params);
    const cached = await checkCalculationCache(cacheKey);
    
    if (cached && cached.calculation_version === '2.1.0') {
      const executionTime = Date.now() - startTime;
      if (import.meta.env.DEV) { console.log(`✅ Cache hit! (${executionTime}ms)`); }
      
      return {
        ...cached.calculation_results,
        fromCache: true,
        executionTimeMs: executionTime
      };
    }

    // STEP 2: Fetch template from database
    if (import.meta.env.DEV) { console.log('📥 Fetching from database...'); }
    const { data: templateData, error: templateError } = await supabase
      .from('use_case_templates')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (templateError) {
      console.warn('⚠️  Database fetch failed, using static fallback');
      return await fetchFromStaticTemplates(params);
    }

    if (!templateData) {
      throw new Error(`Template not found: ${slug}`);
    }

    // STEP 3: Fetch equipment
    const { data: equipmentData, error: equipmentError } = await supabase
      .from('equipment_database')
      .select('*')
      .eq('use_case_template_id', templateData.id)
      .eq('is_active', true)
      .order('display_order');

    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
    }

    // Transform database format to component format
    const template = {
      id: templateData.id,
      slug: templateData.slug,
      name: templateData.name,
      description: templateData.description,
      icon: templateData.icon,
      image_url: templateData.image_url,
      category: templateData.category,
      powerProfile: templateData.power_profile,
      financialParams: templateData.financial_params,
      solarCompatibility: templateData.solar_compatibility,
      customQuestions: templateData.custom_questions || [],
      recommendedApplications: templateData.recommended_applications || [],
      industryStandards: templateData.industry_standards || {},
      version: templateData.version
    };

    const equipment = (equipmentData || []).map(eq => ({
      id: eq.id,
      name: eq.name,
      powerKw: eq.power_kw,
      dutyCycle: eq.duty_cycle,
      description: eq.description || '',
      category: eq.category || '',
      dataSource: eq.data_source || ''
    }));

    // STEP 4: Run calculations
    if (import.meta.env.DEV) { console.log('🧮 Running calculations...'); }
    
    // ✅ SINGLE SOURCE OF TRUTH: Use centralizedCalculations.calculateFinancialMetrics()
    const powerRatingMW = template.powerProfile.peakLoadKw / 1000;
    const durationHours = 4; // Default, can be customized
    
    // Use centralized financial metrics calculator (database-driven)
    const financialMetrics = await calculateFinancialMetrics({
      storageSizeMW: powerRatingMW,
      durationHours,
      location: location || 'United States', // Use provided location or default
      electricityRate: 0.12, // Default rate, can be region-specific
      solarMW: 0, // Will be added in step 5 if enabled
      includeNPV: true
    });

    const sizing = calculateBESSSize({
      peakDemandkW: template.powerProfile.peakLoadKw,
      averageDemandkW: template.powerProfile.avgLoadKw || template.powerProfile.peakLoadKw * 0.5,
      dailyEnergyConsumptionkWh: template.powerProfile.dailyLoadkWh || template.powerProfile.peakLoadKw * template.powerProfile.dailyOperatingHours,
      useCase: template.slug,
      primaryObjective: 'all'
    });

    // STEP 5: Add solar if enabled
    let solarCalculations = null;
    if (solarEnabled && template.solarCompatibility?.recommended) {
      if (import.meta.env.DEV) { console.log('☀️  Calculating solar integration...'); }
      
      solarCalculations = calculateSolarBESSSystem({
        dailyLoadkWh: (sizing.recommendedCapacityMWh * 1000) / template.powerProfile.dailyOperatingHours,
        peakLoadkW: sizing.recommendedPowerMW * 1000,
        location,
        autonomyDays: autonomyDays || template.solarCompatibility.autonomyDays || 3,
        systemVoltage: 480,
        temperatureC: 20
      });
    }

    const results = {
      template: templateData,
      equipment,
      calculations: {
        financial: {
          netCapex: financialMetrics.netCost,
          annualRevenue: financialMetrics.annualSavings,
          annualSavings: financialMetrics.annualSavings,
          paybackYears: financialMetrics.paybackYears,
          roi: financialMetrics.roi10Year,
          npv: financialMetrics.npv || 0,
          irr: financialMetrics.irr || 0,
        },
        sizing: {
          batteryMW: sizing.recommendedPowerMW,
          durationHours: sizing.recommendedDurationHours,
          energyMWh: sizing.recommendedCapacityMWh,
          solarMW: 0, // TODO: Extract from solarCalculations when structure is fixed
          windMW: 0,
          generatorMW: 0,
        },
        performance: {
          cyclesPerYear: 365,
          degradationRate: 0.02,
          roundtripEfficiency: 0.85,
          capacityFactor: 0.25,
        },
      },
      fromCache: false,
      executionTimeMs: Date.now() - startTime
    } as UseCaseWithCalculations;

    // STEP 6: Cache results
    await saveToCalculationCache(cacheKey, results, Date.now() - startTime);

    // STEP 7: Update usage stats
    await incrementTemplateUsage(templateData.id);

    if (import.meta.env.DEV) { console.log(`✅ Complete! (${results.executionTimeMs}ms)`); }
    return results;

  } catch (error) {
    console.error('❌ Error in getUseCaseWithCalculations:', error);
    
    // Fallback to static templates
    if (import.meta.env.DEV) { console.log('🔄 Falling back to static templates...'); }
    return await fetchFromStaticTemplates(params);
  }
}

// ============================================================================
// CACHE FUNCTIONS
// ============================================================================

/**
 * Generate MD5 hash cache key from parameters
 */
function generateCacheKey(params: GetUseCaseParams): string {
  // Sort keys for consistent hashing
  const sortedParams = {
    slug: params.slug,
    facilitySize: params.facilitySize,
    location: params.location,
    customAnswers: JSON.stringify(params.customAnswers || {}),
    solarEnabled: params.solarEnabled || false,
    autonomyDays: params.autonomyDays || 3
  };
  
  const str = JSON.stringify(sortedParams, Object.keys(sortedParams).sort());
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Check if cached calculation exists and is valid
 */
async function checkCalculationCache(inputHash: string) {
  try {
    const { data, error } = await supabase
      .from('calculation_cache')
      .select('*')
      .eq('input_hash', inputHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Cache check error:', error);
    return null;
  }
}

/**
 * Save calculation results to cache
 */
async function saveToCalculationCache(
  inputHash: string,
  results: any,
  executionTimeMs: number
) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await supabase
      .from('calculation_cache')
      .upsert({
        input_hash: inputHash,
        calculation_type: 'unified',
        input_data: { hash: inputHash },
        calculation_results: results,
        calculation_version: '2.1.0',
        execution_time_ms: executionTimeMs,
        expires_at: expiresAt.toISOString()
      });

    if (import.meta.env.DEV) { console.log('💾 Results cached for 7 days'); }
  } catch (error) {
    console.error('Cache save error:', error);
    // Non-fatal - continue without caching
  }
}

/**
 * Clear expired cache entries (call from admin panel or cron job)
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('calculation_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      console.error('Error clearing cache:', error);
      return 0;
    }

    const count = data?.length || 0;
    if (import.meta.env.DEV) { console.log(`🗑️  Cleared ${count} expired cache entries`); }
    return count;
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return 0;
  }
}

/**
 * Clear all cache (use with caution)
 */
export async function clearAllCache(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('calculation_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select();

    if (error) {
      console.error('Error clearing cache:', error);
      return 0;
    }

    const count = data?.length || 0;
    if (import.meta.env.DEV) { console.log(`🗑️  Cleared ALL ${count} cache entries`); }
    return count;
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return 0;
  }
}

// ============================================================================
// FALLBACK TO STATIC TEMPLATES
// ============================================================================

/**
 * Fallback to useCaseTemplates.ts if database unavailable
 */
async function fetchFromStaticTemplates(
  params: GetUseCaseParams
): Promise<UseCaseWithCalculations> {
  const startTime = Date.now();
  const { slug, facilitySize, location, customAnswers, solarEnabled } = params;

  if (import.meta.env.DEV) { console.log('📄 Using static templates fallback...'); }

  const staticTemplate = getUseCaseBySlug(slug);
  if (!staticTemplate) {
    throw new Error(`Template not found in static files: ${slug}`);
  }

  // Transform to expected format
  const template = {
    id: staticTemplate.id,
    slug: staticTemplate.slug,
    name: staticTemplate.name,
    description: staticTemplate.description,
    icon: staticTemplate.icon,
    image_url: staticTemplate.image || null,
    category: staticTemplate.category,
    powerProfile: staticTemplate.powerProfile,
    financialParams: staticTemplate.financialParams,
    solarCompatibility: null, // Not in static templates yet
    customQuestions: staticTemplate.customQuestions || [],
    recommendedApplications: staticTemplate.recommendedApplications || [],
    industryStandards: {},
    version: '1.0.0'
  };

  const equipment = (staticTemplate.equipment || []).map((eq, index) => ({
    id: `static-${index}`,
    name: eq.name,
    powerKw: eq.powerKw,
    dutyCycle: eq.dutyCycle,
    description: eq.description || '',
    category: '',
    dataSource: ''
  }));

  // ✅ SINGLE SOURCE OF TRUTH: Use centralizedCalculations.calculateFinancialMetrics()
  const financialMetrics = await calculateFinancialMetrics({
    storageSizeMW: template.powerProfile.peakLoadKw / 1000,
    durationHours: 4,
    location: location || 'United States', // Use provided location or default
    electricityRate: 0.12, // Default rate
    solarMW: 0,
    includeNPV: true
  });

  const sizing = calculateBESSSize({
    peakDemandkW: template.powerProfile.peakLoadKw,
    averageDemandkW: template.powerProfile.typicalLoadKw,
    dailyEnergyConsumptionkWh: template.powerProfile.typicalLoadKw * template.powerProfile.dailyOperatingHours,
    useCase: template.slug,
    primaryObjective: 'all'
  });

  let solarCalculations = null;
  if (solarEnabled) {
    solarCalculations = calculateSolarBESSSystem({
      dailyLoadkWh: (sizing.recommendedCapacityMWh * 1000) / template.powerProfile.dailyOperatingHours,
      peakLoadkW: sizing.recommendedPowerMW * 1000,
      location,
      autonomyDays: 3,
      systemVoltage: 480,
      temperatureC: 20
    });
  }

  return {
    template,
    equipment,
    calculations: {
      financial: {
        netCapex: financialMetrics.netCost,
        annualRevenue: financialMetrics.annualSavings,
        annualSavings: financialMetrics.annualSavings,
        paybackYears: financialMetrics.paybackYears,
        roi: financialMetrics.roi10Year,
        npv: financialMetrics.npv || 0,
        irr: financialMetrics.irr || 0,
      },
      sizing: {
        batteryMW: sizing.recommendedPowerMW,
        durationHours: sizing.recommendedDurationHours,
        energyMWh: sizing.recommendedCapacityMWh,
        solarMW: 0, // TODO: Extract from solarCalculations when structure is fixed
        windMW: 0,
        generatorMW: 0,
      },
      performance: {
        cyclesPerYear: 365,
        degradationRate: 0.02,
        roundtripEfficiency: 0.85,
        capacityFactor: 0.25,
      },
    },
    fromCache: false,
    executionTimeMs: Date.now() - startTime
  } as UseCaseWithCalculations;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Increment usage counter for a template
 */
async function incrementTemplateUsage(templateId: string) {
  try {
    await supabase.rpc('increment_template_usage', { 
      template_id: templateId 
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    // Non-fatal
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const { data, error } = await supabase
      .from('calculation_cache')
      .select('calculation_type, execution_time_ms, created_at');

    if (error) {
      return null;
    }

    const total = data?.length || 0;
    const avgTime = data?.reduce((sum, item) => sum + (item.execution_time_ms || 0), 0) / total || 0;

    return {
      total,
      avgExecutionTimeMs: Math.round(avgTime),
      oldestEntry: data?.[0]?.created_at,
      newestEntry: data?.[data.length - 1]?.created_at
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}
