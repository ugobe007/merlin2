/**
 * BASELINE CALCULATION SERVICE
 * 
 * Single source of truth for industry baseline calculations.
 * Used by both SmartWizardV2 and AI optimization.
 * 
 * This service queries the Supabase database for use case configurations
 * and calculates recommended BESS sizing based on actual data.
 * 
 * Performance: Uses in-memory caching to reduce database queries.
 */

import { useCaseService } from './useCaseService';
import { baselineCache } from './cacheService';

export interface BaselineCalculationResult {
  powerMW: number;
  durationHrs: number;
  solarMW: number;
  description?: string;
  dataSource?: string;
}

/**
 * Calculate industry baseline from database
 * 
 * This replaces the hardcoded utility function with database-driven calculations.
 * Ensures consistency between wizard and AI recommendations.
 * 
 * Performance: Results are cached for 10 minutes to reduce database load.
 * 
 * @param template - Use case slug (e.g., 'ev-charging', 'hotel')
 * @param scale - Scale factor for sizing (number of rooms, sq ft, etc.)
 * @param useCaseData - Additional data for complex calculations (EV chargers, etc.)
 * @returns Recommended BESS configuration
 */
export async function calculateDatabaseBaseline(
  template: string | string[],
  scale: number = 1,
  useCaseData?: Record<string, any>
): Promise<BaselineCalculationResult> {
  const templateKey = Array.isArray(template) ? template[0] : template;
  
  // Generate stable cache key by sorting object keys
  // This prevents cache misses from object key ordering differences
  let cacheKeyData = '';
  if (useCaseData) {
    const sortedKeys = Object.keys(useCaseData).sort();
    const sortedData: Record<string, any> = {};
    sortedKeys.forEach(key => {
      sortedData[key] = useCaseData[key];
    });
    cacheKeyData = JSON.stringify(sortedData);
  }
  
  const cacheKey = `baseline:${templateKey}:${scale}:${cacheKeyData}`;
  
  // Check cache first
  const cached = baselineCache.get<BaselineCalculationResult>(cacheKey);
  if (cached) {
    console.log(`✅ [Cache HIT] ${templateKey} (scale: ${scale})`);
    return cached;
  }
  
  console.log(`❌ [Cache MISS] ${templateKey} (scale: ${scale}) - Calculating...`);
  
  try {
    console.log(`🔍 [BaselineService] Fetching configuration for: ${templateKey}`, { scale, useCaseData });
    
    // Special case: EV Charging uses charger-specific calculation
    if (templateKey === 'ev-charging' && useCaseData) {
      const evResult = calculateEVChargingBaseline(useCaseData);
      console.log(`🔌 [BaselineService] EV Charging calculated:`, evResult);
      
      // Cache the result
      baselineCache.set(cacheKey, evResult);
      return evResult;
    }
    
    // **CRITICAL FIX**: Check if user explicitly provided peak load
    // If user entered peakLoad in MW, use that value directly instead of database/fallback
    if (useCaseData && typeof useCaseData.peakLoad === 'number' && useCaseData.peakLoad > 0) {
      const userPowerMW = useCaseData.peakLoad;
      const durationHrs = useCaseData.operatingHours ? Math.round(useCaseData.operatingHours / 5) : 4; // Default 4 hours
      const solarMW = Math.round(userPowerMW * 0.8 * 10) / 10; // 80% solar sizing
      
      console.log(`👤 [BaselineService] Using user's explicit peak load input: ${userPowerMW} MW`);
      console.log(`👤 [BaselineService] User inputs:`, { 
        peakLoad: useCaseData.peakLoad,
        facilitySize: useCaseData.facilitySize,
        operatingHours: useCaseData.operatingHours 
      });
      console.log(`👤 [BaselineService] Cache key: "${cacheKey}"`);
      console.log(`👤 [BaselineService] Template: "${templateKey}", Scale: ${scale}`);
      
      const userResult = {
        powerMW: userPowerMW,
        durationHrs,
        solarMW,
        description: `User-specified peak load: ${userPowerMW} MW`,
        dataSource: 'User Input (Step 2)'
      };
      
      // Validate sizing (user's input should always be valid since they provided it)
      const validation = validateBessSizing(userPowerMW, userPowerMW);
      console.log(`✅ [Validation] Using user's explicit peak load: ${userPowerMW} MW (ratio: ${validation.ratio.toFixed(2)}x)`);
      
      // Cache the user-specified result
      baselineCache.set(cacheKey, userResult);
      console.log(`💾 [BaselineService] Cached user result with key: "${cacheKey}"`);
      return userResult;
    }
    
    // Query database for use case configuration
    console.log(`📡 [BaselineService] Querying database for slug: "${templateKey}"...`);
    const useCase = await useCaseService.getUseCaseBySlug(templateKey);
    console.log(`📡 [BaselineService] Database response:`, { 
      found: !!useCase, 
      hasConfigs: !!useCase?.configurations,
      configCount: useCase?.configurations?.length || 0 
    });
    
    if (!useCase || !useCase.configurations || useCase.configurations.length === 0) {
      console.warn(`⚠️ [BaselineService] No database configuration found for ${templateKey}, using fallback`);
      console.warn(`⚠️ [BaselineService] useCase object:`, useCase);
      console.warn(`⚠️ [BaselineService] Template: "${templateKey}", Scale: ${scale}`);
      console.warn(`⚠️ [BaselineService] Cache key: "${cacheKey}"`);
      const fallback = getFallbackBaseline(templateKey);
      
      // Cache fallback result (shorter TTL)
      baselineCache.set(cacheKey, fallback, 5 * 60 * 1000); // 5 minutes
      return fallback;
    }

    // Use the default configuration or first available
    const defaultConfig = useCase.configurations.find(c => c.is_default) || useCase.configurations[0];
    
    console.log(`✅ [BaselineService] Using database configuration for ${templateKey}:`, {
      config_name: defaultConfig.config_name,
      typical_load_kw: defaultConfig.typical_load_kw,
      preferred_duration_hours: defaultConfig.preferred_duration_hours
    });
    
    // Calculate power based on typical load (kW) converted to MW
    // Scale represents the actual facility size relative to the reference
    // For hotel: scale = actual_rooms / 100 (e.g., 100 rooms → scale 1.0)
    // Database baseline: 440 kW for 150 rooms (from config_name "Standard Hotel (150 rooms)")
    // 
    // CORRECTED CALCULATION:
    // Extract reference size from config_name (e.g., "150" from "Standard Hotel (150 rooms)")
    // Then calculate: (baseline_kW / reference_size) * actual_size
    let basePowerMW: number;
    
    // Parse reference size from config_name (format: "X rooms", "X beds", etc.)
    const referenceMatch = defaultConfig.config_name?.match(/\((\d+)\s+(rooms|beds|sqft|chargers|bays)\)/i);
    
    if (referenceMatch && templateKey === 'hotel') {
      // Hotel-specific: Extract reference room count
      const referenceRooms = parseInt(referenceMatch[1]); // e.g., 150
      const actualRooms = scale * 100; // Convert scale back to actual rooms
      
      // Calculate per-room kW, then multiply by actual rooms
      const kWPerRoom = defaultConfig.typical_load_kw / referenceRooms;
      basePowerMW = (kWPerRoom * actualRooms) / 1000;
      
      console.log(`🏨 [Hotel Calculation] Reference: ${referenceRooms} rooms @ ${defaultConfig.typical_load_kw} kW = ${kWPerRoom.toFixed(2)} kW/room`);
      console.log(`🏨 [Hotel Calculation] Actual: ${actualRooms} rooms × ${kWPerRoom.toFixed(2)} kW/room = ${basePowerMW.toFixed(3)} MW`);
      
    } else {
      // Fallback to simple scale multiplication for other use cases
      basePowerMW = (defaultConfig.typical_load_kw / 1000) * scale;
      console.log(`📊 [Generic Calculation] ${defaultConfig.typical_load_kw} kW × ${scale} scale = ${basePowerMW.toFixed(3)} MW`);
    }
    
    // Round to nearest 0.01 MW (10 kW precision) for better accuracy
    // This prevents 440 kW from rounding down to 400 kW (was rounding to 0.1 MW)
    // Minimum of 0.2 MW (200 kW) for small facilities
    const powerMW = Math.max(0.2, Math.round(basePowerMW * 100) / 100);
    
    console.log(`📊 [Power Calculation] Raw: ${basePowerMW.toFixed(3)} MW → Rounded: ${powerMW} MW`);
    
    // Use preferred duration from configuration
    const durationHrs = Math.max(2, Math.round((defaultConfig.preferred_duration_hours || 4) * 2) / 2);
    
    // Calculate solar based on power size
    // Use 1:1 ratio as default (can be customized per use case later)
    const solarRatio = 1.0;
    const solarMW = Math.max(0, Math.round(powerMW * solarRatio * 10) / 10);
    
    const result = {
      powerMW,
      durationHrs,
      solarMW,
      description: `Database configuration: ${defaultConfig.config_name}`,
      dataSource: 'Supabase use_case_configurations'
    };
    
    // Validate BESS sizing if user provided peak load
    if (useCaseData && useCaseData.peakLoad) {
      const validation = validateBessSizing(powerMW, useCaseData.peakLoad);
      if (!validation.isValid && validation.warning) {
        console.error(validation.warning);
        // Optionally: could adjust powerMW to not exceed 2x user's input
        // For now, just warn but allow it
      } else if (validation.ratio > 0) {
        console.log(`✅ [Validation] BESS sizing OK: ${powerMW} MW is ${validation.ratio.toFixed(2)}x user's peak load (${useCaseData.peakLoad} MW)`);
      }
    }
    
    // Cache the successful result
    baselineCache.set(cacheKey, result);
    
    return result;
    
  } catch (error) {
    console.error(`❌ [BaselineService] Error fetching configuration for ${templateKey}:`, error);
    const fallback = getFallbackBaseline(templateKey);
    
    // Cache fallback result (shorter TTL)
    baselineCache.set(cacheKey, fallback, 5 * 60 * 1000); // 5 minutes
    
    return fallback;
  }
}

/**
 * Calculate EV charging baseline based on charger specifications
 * 
 * This handles the complex calculation for EV charging stations based on:
 * - Number and power of Level 2 chargers
 * - Number and power of DC Fast chargers
 * - Peak concurrency factor
 */
function calculateEVChargingBaseline(useCaseData: Record<string, any>): BaselineCalculationResult {
  const level2Count = parseInt(useCaseData.level2Chargers) || 0;
  const level2Power = parseFloat(useCaseData.level2Power) || 11; // kW
  const dcFastCount = parseInt(useCaseData.dcFastChargers) || 0;
  const dcFastPower = parseFloat(useCaseData.dcFastPower) || 150; // kW
  const concurrency = Math.min(parseInt(useCaseData.peakConcurrency) || 50, 80) / 100;
  
  const totalLevel2 = (level2Count * level2Power) / 1000; // MW
  const totalDCFast = (dcFastCount * dcFastPower) / 1000; // MW
  const totalCharging = totalLevel2 + totalDCFast;
  
  console.log('🔌 [BaselineService] EV Charging Calculation:', {
    level2Count,
    level2Power,
    dcFastCount,
    dcFastPower,
    concurrency,
    totalLevel2,
    totalDCFast,
    totalCharging
  });
  
  // Battery sized for demand management (60-70% of peak with concurrency)
  const powerMW = Math.max(0.5, Math.min(totalCharging * concurrency * 0.7, totalCharging * 0.8));
  const roundedPowerMW = Math.round(powerMW * 10) / 10;
  
  console.log('🔋 [BaselineService] Recommended Battery Size:', roundedPowerMW, 'MW');
  
  return {
    powerMW: roundedPowerMW,
    durationHrs: 2, // Short duration for demand management
    solarMW: Math.round(roundedPowerMW * 1.0 * 10) / 10,
    description: `EV Charging: ${level2Count} L2 + ${dcFastCount} DC Fast chargers`,
    dataSource: 'Calculated from charger specifications'
  };
}

/**
 * Fallback baseline calculations when database is unavailable
 * 
 * These are based on industry standards (CBECS, NREL, ASHRAE)
 * but should only be used as a last resort.
 */
function getFallbackBaseline(template: string): BaselineCalculationResult {
  const fallbacks: Record<string, BaselineCalculationResult> = {
    'hotel': {
      powerMW: 2.0,
      durationHrs: 4,
      solarMW: 2.0,
      description: 'Fallback: Standard hotel configuration',
      dataSource: 'Fallback (CBECS 2018)'
    },
    'ev-charging': {
      powerMW: 2.0,
      durationHrs: 2,
      solarMW: 2.0,
      description: 'Fallback: Standard EV charging station',
      dataSource: 'Fallback (DOE Alt Fuels Data)'
    },
    'data-center': {
      powerMW: 5.0,
      durationHrs: 8,
      solarMW: 3.0,
      description: 'Fallback: Standard data center',
      dataSource: 'Fallback (Uptime Institute)'
    },
    'manufacturing': {
      powerMW: 3.0,
      durationHrs: 6,
      solarMW: 3.5,
      description: 'Fallback: Standard manufacturing facility',
      dataSource: 'Fallback (DOE Industrial)'
    },
    'hospital': {
      powerMW: 4.0,
      durationHrs: 8,
      solarMW: 4.0,
      description: 'Fallback: Standard hospital',
      dataSource: 'Fallback (CBECS Healthcare)'
    }
  };
  
  const fallback = fallbacks[template] || {
    powerMW: 2.0,
    durationHrs: 4,
    solarMW: 2.0,
    description: 'Fallback: Generic configuration',
    dataSource: 'Fallback (Generic)'
  };
  
  console.log(`⚠️ [BaselineService] Using fallback for ${template}:`, fallback);
  return fallback;
}

/**
 * Get human-readable scale unit description
 */
export function getScaleUnitDescription(template: string): string {
  const unitMap: Record<string, string> = {
    'hotel': 'rooms',
    'apartment': 'units',
    'car-wash': 'bays',
    'hospital': 'beds',
    'college': 'students (thousands)',
    'data-center': 'MW IT load',
    'airport': 'million passengers',
    'manufacturing': 'production lines',
    'warehouse': 'thousand sq ft',
    'retail': 'thousand sq ft',
    'office': 'thousand sq ft',
    'ev-charging': 'chargers',
    'casino': 'gaming floor sq ft',
    'agricultural': 'acres',
    'indoor-farm': 'growing area sq ft',
    'cold-storage': 'storage volume'
  };
  
  return unitMap[template] || 'units';
}

/**
 * Validate BESS sizing against user's stated peak load
 * Prevents oversizing without explicit justification
 * 
 * @returns { isValid: boolean, warning?: string, ratio: number }
 */
export function validateBessSizing(
  recommendedMW: number,
  userPeakLoadMW?: number
): { isValid: boolean; warning?: string; ratio: number } {
  
  // If user didn't provide peak load, can't validate
  if (!userPeakLoadMW || userPeakLoadMW <= 0) {
    return { isValid: true, ratio: 0 };
  }
  
  const ratio = recommendedMW / userPeakLoadMW;
  
  // Allow up to 2x oversizing (common for peak shaving + backup)
  if (ratio <= 2.0) {
    return { isValid: true, ratio };
  }
  
  // Warn if recommendation exceeds 2x user's peak load
  const warning = `⚠️ SIZING WARNING: Recommended BESS (${recommendedMW} MW) is ${ratio.toFixed(1)}x your stated peak load (${userPeakLoadMW} MW). This may indicate an error in configuration. Typical BESS sizing is 1-2x peak load. Please review your inputs.`;
  
  console.warn(warning);
  
  return {
    isValid: false,
    warning,
    ratio
  };
}
