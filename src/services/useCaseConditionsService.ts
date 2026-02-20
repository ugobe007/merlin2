/**
 * Use Case Conditions Service
 * ============================
 * 
 * Loads ALL template variables for a use case into a single "conditions" object.
 * Acts as a buffer between database and wizard/calculator.
 * 
 * Benefits:
 * - Single DB query per use case (performance)
 * - Cached for 15 minutes (reduces DB load)
 * - Easy to verify (all conditions in one place)
 * - Easy to edit (change DB, conditions auto-update)
 * - Versioned for cache invalidation
 * - Error handling with fallbacks (no breaking changes)
 * 
 * Usage:
 * ```typescript
 * const conditions = await loadUseCaseConditions('car-wash');
 * const roofFactor = conditions.solarFactors.roofUsableFactor; // 0.65
 * const itcRate = conditions.financialConstants.federalITCRate; // 0.30
 * ```
 * 
 * @module useCaseConditionsService
 * @version 1.0.0
 * @date January 7, 2025
 */

import { getConstant } from './calculationConstantsService';
import { getSolarTemplate } from './solarTemplates';
import { getIndustryTemplate } from './industryTemplates';
import { UseCaseService } from './useCaseService';

// ============================================================================
// TYPES
// ============================================================================

export interface UseCaseConditions {
  // Use case metadata
  useCaseSlug: string;
  industry: string;
  version: string; // Conditions version (for cache invalidation)
  
  // Load calculation factors (from calculation_constants)
  loadFactors: {
    baseFactor: number;        // kW per unit (room, sqft, etc.)
    loadFactor: number;         // Diversity factor (0-1)
    peakDemandMultiplier: number;
    source: string;
  };
  
  // Solar factors (from solarTemplates.ts or DB)
  solarFactors: {
    roofUsableFactor: number;   // 0.65 for car_wash
    carportUsableFactor: number; // 1.0
    solarDensity: number;       // 0.020 kW/sqft
    source: string;
  };
  
  // Financial constants (from calculation_constants)
  financialConstants: {
    federalITCRate: number;     // 0.30
    discountRate: number;        // 0.08
    projectLifetimeYears: number; // 25
    source: string;
  };
  
  // Equipment factors (from use_case_configurations)
  equipmentFactors: Record<string, number>;
  
  // Question defaults (from custom_questions)
  questionDefaults: Record<string, any>;
  
  // Caching metadata
  loadedAt: Date;
  source: 'database' | 'fallback';
  errors?: string[]; // Track any errors during loading
}

interface CachedConditions {
  data: UseCaseConditions;
  expiresAt: Date;
  version: string;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

const conditionsCache = new Map<string, CachedConditions>();
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const CONDITIONS_VERSION = '1.0.0'; // Increment to invalidate all caches

/**
 * Clear the conditions cache (force refresh on next request)
 */
export function clearConditionsCache(useCaseSlug?: string): void {
  if (useCaseSlug) {
    conditionsCache.delete(useCaseSlug);
    if (import.meta.env.DEV) {
      console.log(`🔄 Cleared conditions cache for: ${useCaseSlug}`);
    }
  } else {
    conditionsCache.clear();
    if (import.meta.env.DEV) {
      console.log('🔄 Cleared all conditions cache');
    }
  }
}

/**
 * Check if cached conditions are valid
 */
function isCacheValid(cached: CachedConditions): boolean {
  const now = new Date();
  const isNotExpired = cached.expiresAt > now;
  const isCorrectVersion = cached.version === CONDITIONS_VERSION;
  return isNotExpired && isCorrectVersion;
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Load all conditions for a use case
 * This is the SINGLE ENTRY POINT for use case configuration
 * 
 * @param useCaseSlug - Use case slug (e.g., 'car-wash', 'hotel')
 * @param forceRefresh - Force reload from database (ignore cache)
 * @returns Use case conditions with all factors and constants
 */
export async function loadUseCaseConditions(
  useCaseSlug: string,
  forceRefresh = false
): Promise<UseCaseConditions> {
  // Check cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cached = conditionsCache.get(useCaseSlug);
    if (cached && isCacheValid(cached)) {
      if (import.meta.env.DEV) {
        console.log(`✅ [Conditions Cache HIT] ${useCaseSlug}`);
      }
      return cached.data;
    }
  }
  
  if (import.meta.env.DEV) {
    console.log(`📥 [Loading Conditions] ${useCaseSlug}...`);
  }
  
  const errors: string[] = [];
  
  try {
    // Load all conditions in parallel
    const [
      useCase,
      loadFactors,
      solarFactors,
      financialConstants,
      equipmentFactors,
      questionDefaults
    ] = await Promise.allSettled([
      // 1. Use case metadata
      loadUseCaseMetadata(useCaseSlug),
      
      // 2. Load factors (from calculation_constants)
      loadLoadFactors(useCaseSlug),
      
      // 3. Solar factors (from solarTemplates.ts or DB)
      loadSolarFactors(useCaseSlug),
      
      // 4. Financial constants (from calculation_constants)
      loadFinancialConstants(),
      
      // 5. Equipment factors (from use_case_configurations)
      loadEquipmentFactors(useCaseSlug),
      
      // 6. Question defaults (from custom_questions)
      loadQuestionDefaults(useCaseSlug)
    ]);
    
    // Extract results (handle failures gracefully)
    const useCaseData = useCase.status === 'fulfilled' ? useCase.value : null;
    const loadFactorsData = loadFactors.status === 'fulfilled' ? loadFactors.value : getFallbackLoadFactors();
    const solarFactorsData = solarFactors.status === 'fulfilled' ? solarFactors.value : getFallbackSolarFactors();
    const financialConstantsData = financialConstants.status === 'fulfilled' ? financialConstants.value : getFallbackFinancialConstants();
    const equipmentFactorsData = equipmentFactors.status === 'fulfilled' ? equipmentFactors.value : {};
    const questionDefaultsData = questionDefaults.status === 'fulfilled' ? questionDefaults.value : {};
    
    // Track errors
    if (useCase.status === 'rejected') errors.push(`Use case metadata: ${useCase.reason}`);
    if (loadFactors.status === 'rejected') errors.push(`Load factors: ${loadFactors.reason}`);
    if (solarFactors.status === 'rejected') errors.push(`Solar factors: ${solarFactors.reason}`);
    if (financialConstants.status === 'rejected') errors.push(`Financial constants: ${financialConstants.reason}`);
    if (equipmentFactors.status === 'rejected') errors.push(`Equipment factors: ${equipmentFactors.reason}`);
    if (questionDefaults.status === 'rejected') errors.push(`Question defaults: ${questionDefaults.reason}`);
    
    const conditions: UseCaseConditions = {
      useCaseSlug,
      industry: useCaseData?.industry || useCaseSlug.split('-')[0] || useCaseSlug,
      version: CONDITIONS_VERSION,
      loadFactors: loadFactorsData,
      solarFactors: solarFactorsData,
      financialConstants: financialConstantsData,
      equipmentFactors: equipmentFactorsData,
      questionDefaults: questionDefaultsData,
      loadedAt: new Date(),
      source: errors.length === 0 ? 'database' : 'fallback',
      ...(errors.length > 0 && { errors })
    };
    
    // Cache for 15 minutes
    conditionsCache.set(useCaseSlug, {
      data: conditions,
      expiresAt: new Date(Date.now() + CACHE_DURATION_MS),
      version: CONDITIONS_VERSION
    });
    
    if (import.meta.env.DEV) {
      if (errors.length > 0) {
        console.warn(`⚠️ [Conditions Loaded with Errors] ${useCaseSlug}:`, errors);
      } else {
        console.log(`✅ [Conditions Loaded] ${useCaseSlug} (${conditions.source})`);
      }
    }
    
    return conditions;
  } catch (error) {
    console.error(`❌ [Conditions Load Failed] ${useCaseSlug}:`, error);
    
    // Return fallback conditions (ensures wizard still works)
    const fallbackConditions: UseCaseConditions = {
      useCaseSlug,
      industry: useCaseSlug.split('-')[0] || useCaseSlug,
      version: CONDITIONS_VERSION,
      loadFactors: getFallbackLoadFactors(),
      solarFactors: getFallbackSolarFactors(),
      financialConstants: getFallbackFinancialConstants(),
      equipmentFactors: {},
      questionDefaults: {},
      loadedAt: new Date(),
      source: 'fallback',
      errors: [error instanceof Error ? error.message : String(error)]
    };
    
    return fallbackConditions;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load use case metadata
 */
async function loadUseCaseMetadata(useCaseSlug: string) {
  const useCaseService = new UseCaseService();
  const useCase = await useCaseService.getUseCaseBySlug(useCaseSlug);
  
  if (!useCase) {
    throw new Error(`Use case not found: ${useCaseSlug}`);
  }
  
  return {
    industry: (useCase as any)?.industry || useCaseSlug.split('-')[0] || useCaseSlug,
    useCase
  };
}

/**
 * Load load calculation factors
 */
async function loadLoadFactors(useCaseSlug: string) {
  const industry = useCaseSlug.split('-')[0]; // e.g., 'car-wash' -> 'car'
  const industryKey = useCaseSlug.replace(/-/g, '_'); // e.g., 'car-wash' -> 'car_wash'
  
  // Try multiple key formats
  const baseFactor = await getConstant(`${industryKey}_kw_per_unit`) ||
                     await getConstant(`${industryKey}_peak_demand_per_unit_kw`) ||
                     await getConstant(`${industry}_kw_per_unit`) ||
                     await getConstant(`${industry}_peak_demand_per_unit_kw`) ||
                     null;
  
  const loadFactor = await getConstant(`${industryKey}_load_factor`) ||
                     await getConstant(`${industry}_load_factor`) ||
                     null;
  
  const peakMultiplier = await getConstant(`${industryKey}_peak_multiplier`) ||
                         await getConstant(`${industry}_peak_multiplier`) ||
                         null;
  
  // Try to get from industry template as fallback
  let templateFactors = null;
  try {
    const template = await getIndustryTemplate(industryKey);
    templateFactors = {
      baseFactor: template.baseFactor,
      loadFactor: template.loadFactor,
      peakDemandMultiplier: 1.2 // Default
    };
  } catch {
    // Ignore template errors
  }
  
  return {
    baseFactor: baseFactor || templateFactors?.baseFactor || 2.0,
    loadFactor: loadFactor || templateFactors?.loadFactor || 0.45,
    peakDemandMultiplier: peakMultiplier || templateFactors?.peakDemandMultiplier || 1.2,
    source: baseFactor ? 'calculation_constants' : (templateFactors ? 'industry_template' : 'fallback')
  };
}

/**
 * Load solar factors
 */
async function loadSolarFactors(useCaseSlug: string) {
  try {
    // Try to get from solarTemplates.ts first (SSOT)
    const template = getSolarTemplate(useCaseSlug);
    return {
      roofUsableFactor: template.roofUsableFactor,
      carportUsableFactor: template.carportUsableFactor,
      solarDensity: template.solarDensity,
      source: 'solarTemplates'
    };
  } catch (error) {
    // Fallback to database constants
    const roofFactor = await getConstant(`${useCaseSlug}_roof_usable_factor`) ||
                       await getConstant('default_roof_usable_factor') ||
                       0.65;
    
    const carportFactor = await getConstant(`${useCaseSlug}_carport_usable_factor`) ||
                          await getConstant('default_carport_usable_factor') ||
                          1.0;
    
    const solarDensity = await getConstant(`${useCaseSlug}_solar_density`) ||
                         await getConstant('default_solar_density') ||
                         0.020;
    
    return {
      roofUsableFactor: roofFactor,
      carportUsableFactor: carportFactor,
      solarDensity: solarDensity,
      source: 'calculation_constants'
    };
  }
}

/**
 * Load financial constants (shared across all use cases)
 */
async function loadFinancialConstants() {
  const [itcRate, discountRate, lifetime, escalationRate] = await Promise.all([
    getConstant('federal_itc_rate'),
    getConstant('discount_rate'),
    getConstant('project_lifetime_years'),
    getConstant('electricity_escalation_rate')
  ]);
  
  return {
    federalITCRate: itcRate || 0.30,
    discountRate: discountRate || 0.08,
    projectLifetimeYears: lifetime || 25,
    escalationRate: escalationRate || 0.03,
    source: itcRate ? 'calculation_constants' : 'fallback'
  };
}

/**
 * Load equipment factors
 */
async function loadEquipmentFactors(useCaseSlug: string) {
  try {
    const useCaseService = new UseCaseService();
    const useCase = await useCaseService.getUseCaseBySlug(useCaseSlug);
    const config = (useCase as any)?.default_configuration;
    
    if (!config) return {};
    
    // Extract equipment factors from use_case_configurations
    // This depends on your database schema - adjust as needed
    return (config.equipment_factors || config.load_profile?.equipment_factors || {}) as Record<string, number>;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ Failed to load equipment factors for ${useCaseSlug}:`, error);
    }
    return {};
  }
}

/**
 * Load question defaults
 */
async function loadQuestionDefaults(useCaseSlug: string) {
  try {
    const useCaseService = new UseCaseService();
    const useCase = await useCaseService.getUseCaseBySlug(useCaseSlug);
    const questions = useCase?.custom_questions || [];
    
    const defaults: Record<string, any> = {};
    questions.forEach((q: any) => {
      const fieldName = q.field_name || q.question_key;
      if (fieldName && q.default_value !== null && q.default_value !== undefined) {
        try {
          // Try to parse JSON if it's a string
          if (typeof q.default_value === 'string' && 
              (q.default_value.startsWith('{') || q.default_value.startsWith('['))) {
            defaults[fieldName] = JSON.parse(q.default_value);
          } else {
            defaults[fieldName] = q.default_value;
          }
        } catch {
          // If parsing fails, use as-is
          defaults[fieldName] = q.default_value;
        }
      }
    });
    
    return defaults;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ Failed to load question defaults for ${useCaseSlug}:`, error);
    }
    return {};
  }
}

// ============================================================================
// FALLBACK VALUES
// ============================================================================

function getFallbackLoadFactors() {
  return {
    baseFactor: 2.0,
    loadFactor: 0.45,
    peakDemandMultiplier: 1.2,
    source: 'fallback'
  };
}

function getFallbackSolarFactors() {
  return {
    roofUsableFactor: 0.65,
    carportUsableFactor: 1.0,
    solarDensity: 0.020,
    source: 'fallback'
  };
}

function getFallbackFinancialConstants() {
  return {
    federalITCRate: 0.30,
    discountRate: 0.08,
    projectLifetimeYears: 25,
    escalationRate: 0.03,
    source: 'fallback'
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get conditions version (for cache invalidation)
 */
export function getConditionsVersion(): string {
  return CONDITIONS_VERSION;
}

/**
 * Check if conditions need refresh (version mismatch)
 */
export function needsRefresh(useCaseSlug: string): boolean {
  const cached = conditionsCache.get(useCaseSlug);
  if (!cached) return true;
  return cached.version !== CONDITIONS_VERSION;
}
