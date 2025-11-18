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
import { USE_CASE_TEMPLATES } from '../data/useCaseTemplates';
import type { UseCaseTemplate } from '../types/useCase.types';

export interface BaselineCalculationResult {
  powerMW: number;
  durationHrs: number;
  solarMW: number;
  description?: string;
  dataSource?: string;
  // Grid and generation requirements
  gridConnection?: string;
  gridCapacity?: number;
  peakDemandMW?: number;
  generationRequired?: boolean;
  generationRecommendedMW?: number;
  generationReason?: string;
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
    if (import.meta.env.DEV) {
      console.log(`✅ [Cache HIT] ${templateKey} (scale: ${scale})`);
    }
    return cached;
  }
  
  if (import.meta.env.DEV) {
    console.log(`❌ [Cache MISS] ${templateKey} (scale: ${scale}) - Calculating...`);
  }
  
  try {
    if (import.meta.env.DEV) {
      console.log(`🔍 [BaselineService] Fetching configuration for: ${templateKey}`, { scale, useCaseData });
      console.log(`🔍 [BaselineService] useCaseData keys:`, useCaseData ? Object.keys(useCaseData) : 'null/undefined');
      console.log(`🔍 [BaselineService] useCaseData values:`, useCaseData);
    }
    
    // Special case: EV Charging uses charger-specific calculation
    if (templateKey === 'ev-charging' && useCaseData) {
      if (import.meta.env.DEV) {
        console.log(`🔌 [BaselineService] Calling calculateEVChargingBaseline with:`, useCaseData);
      }
      const evResult = calculateEVChargingBaseline(useCaseData);
      if (import.meta.env.DEV) {
        console.log(`🔌 [BaselineService] EV Charging calculated:`, evResult);
      }
      
      // Cache the result
      baselineCache.set(cacheKey, evResult);
      return evResult;
    }
    
    // Special case: Datacenter uses tier-based calculation
    if ((templateKey === 'datacenter' || templateKey === 'data-center') && useCaseData) {
      const dcResult = calculateDatacenterBaseline(useCaseData, scale);
      if (import.meta.env.DEV) {
        console.log(`🖥️ [BaselineService] Datacenter calculated:`, dcResult);
      }
      
      // Cache the result
      baselineCache.set(cacheKey, dcResult);
      return dcResult;
    }
    
    // **CRITICAL FIX**: Check if user explicitly provided peak load
    // If user entered peakLoad in MW, use that value directly instead of database/fallback
    if (useCaseData && typeof useCaseData.peakLoad === 'number' && useCaseData.peakLoad > 0) {
      const userPowerMW = useCaseData.peakLoad;
      const durationHrs = useCaseData.operatingHours ? Math.round(useCaseData.operatingHours / 5) : 4; // Default 4 hours
      const solarMW = Math.round(userPowerMW * 0.8 * 10) / 10; // 80% solar sizing
      
      if (import.meta.env.DEV) {
        console.log(`👤 [BaselineService] Using user's explicit peak load input: ${userPowerMW} MW`);
        console.log(`👤 [BaselineService] User inputs:`, { 
          peakLoad: useCaseData.peakLoad,
          facilitySize: useCaseData.facilitySize,
          operatingHours: useCaseData.operatingHours 
        });
        console.log(`👤 [BaselineService] Cache key: "${cacheKey}"`);
        console.log(`👤 [BaselineService] Template: "${templateKey}", Scale: ${scale}`);
      }
      
      const userResult = {
        powerMW: userPowerMW,
        durationHrs,
        solarMW,
        description: `User-specified peak load: ${userPowerMW} MW`,
        dataSource: 'User Input (Step 2)'
      };
      
      // Validate sizing (user's input should always be valid since they provided it)
      const validation = validateBessSizing(userPowerMW, userPowerMW);
      if (import.meta.env.DEV) {
        console.log(`✅ [Validation] Using user's explicit peak load: ${userPowerMW} MW (ratio: ${validation.ratio.toFixed(2)}x)`);
      }      
      // Cache the user-specified result
      baselineCache.set(cacheKey, userResult);
      if (import.meta.env.DEV) {
        console.log(`💾 [BaselineService] Cached user result with key: "${cacheKey}"`);
      }
      return userResult;
    }
    
    // Query database for use case configuration
    if (import.meta.env.DEV) {
      console.log(`📡 [BaselineService] Querying database for slug: "${templateKey}"...`);
    }
    const useCase = await useCaseService.getUseCaseBySlug(templateKey);
    if (import.meta.env.DEV) {
      console.log(`📡 [BaselineService] Database response:`, { 
        found: !!useCase, 
        hasConfigs: !!useCase?.configurations,
      configCount: useCase?.configurations?.length || 0 
      });
    }
    
    if (!useCase || !useCase.configurations || useCase.configurations.length === 0) {
      console.warn(`⚠️ [BaselineService] No database configuration found for ${templateKey}, using fallback`);
      if (import.meta.env.DEV) {
        console.warn(`⚠️ [BaselineService] useCase object:`, useCase);
        console.warn(`⚠️ [BaselineService] Template: "${templateKey}", Scale: ${scale}`);
        console.warn(`⚠️ [BaselineService] Cache key: "${cacheKey}"`);
      }
      const fallback = getFallbackBaseline(templateKey);
      
      // Cache fallback result (shorter TTL)
      baselineCache.set(cacheKey, fallback, 5 * 60 * 1000); // 5 minutes
      return fallback;
    }

    // Use the default configuration or first available
    const defaultConfig = useCase.configurations.find(c => c.is_default) || useCase.configurations[0];
    
    if (import.meta.env.DEV) {
      console.log(`✅ [BaselineService] Using database configuration for ${templateKey}:`, {
        config_name: defaultConfig.config_name,
      typical_load_kw: defaultConfig.typical_load_kw,
      preferred_duration_hours: defaultConfig.preferred_duration_hours
      });
    }
    
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
      
      if (import.meta.env.DEV) {
        console.log(`🏨 [Hotel Calculation] Reference: ${referenceRooms} rooms @ ${defaultConfig.typical_load_kw} kW = ${kWPerRoom.toFixed(2)} kW/room`);
        console.log(`🏨 [Hotel Calculation] Actual: ${actualRooms} rooms × ${kWPerRoom.toFixed(2)} kW/room = ${basePowerMW.toFixed(3)} MW`);
      }
      
    } else {
      // Fallback to simple scale multiplication for other use cases
      // SPECIAL CASE: For datacenters, scale represents total MW capacity directly
      if (templateKey === 'datacenter' || templateKey === 'data-center') {
        basePowerMW = scale; // Use scale directly as the datacenter capacity in MW
        if (import.meta.env.DEV) {
          console.log(`🖥️ [Data Center Calculation] Direct capacity: ${scale} MW (scale = capacity)`);
        }
      } else {
        basePowerMW = (defaultConfig.typical_load_kw / 1000) * scale;
        if (import.meta.env.DEV) {
          console.log(`📊 [Generic Calculation] ${defaultConfig.typical_load_kw} kW × ${scale} scale = ${basePowerMW.toFixed(3)} MW`);
        }
      }
    }
    
    // Round to nearest 0.01 MW (10 kW precision) for better accuracy
    // This prevents 440 kW from rounding down to 400 kW (was rounding to 0.1 MW)
    // Minimum of 0.2 MW (200 kW) for small facilities
    let powerMW = Math.max(0.2, Math.round(basePowerMW * 100) / 100);
    
    // Add amenity loads from customQuestions marked with impactType: 'power_add'
    // This reads power values directly from the template (single source of truth)
    if (useCaseData) {
      // Find the template from useCaseTemplates.ts (single source of truth)
      const templateObj: UseCaseTemplate | undefined = USE_CASE_TEMPLATES.find(
        (t: UseCaseTemplate) => t.slug === templateKey || t.id === templateKey
      );
      
      if (templateObj?.customQuestions) {
        let amenityLoadKW = 0;
        
        for (const question of templateObj.customQuestions) {
          if (question.impactType !== 'power_add') continue;
          
          const userValue = useCaseData[question.id];
          if (!userValue) continue;
          
          // Handle select questions with powerKw in options
          if (question.type === 'select' && question.options) {
            const selectedOption = question.options.find((opt: any) => 
              typeof opt === 'object' && opt.value === userValue
            );
            if (selectedOption && typeof selectedOption === 'object' && 'powerKw' in selectedOption) {
              amenityLoadKW += (selectedOption as any).powerKw;
              if (import.meta.env.DEV) {
                console.log(`  ➕ ${question.id}: +${(selectedOption as any).powerKw} kW (${userValue})`);
              }
            }
          }
          
          // Handle multiselect questions with powerKw in options
          if ((question.type === 'multiselect' || question.type === 'multi-select') && 
              Array.isArray(userValue) && question.options) {
            userValue.forEach((value: string) => {
              const selectedOption = question.options!.find((opt: any) => 
                typeof opt === 'object' && opt.value === value
              );
              if (selectedOption && typeof selectedOption === 'object' && 'powerKw' in selectedOption) {
                amenityLoadKW += (selectedOption as any).powerKw;
                if (import.meta.env.DEV) {
                  console.log(`  ➕ ${question.id}: +${(selectedOption as any).powerKw} kW (${value})`);
                }
              }
            });
          }
          
          // Handle number inputs with additionalLoadKw multiplier
          if (question.type === 'number' && question.additionalLoadKw && typeof userValue === 'number') {
            const calculatedLoad = userValue * question.additionalLoadKw;
            amenityLoadKW += calculatedLoad;
            if (import.meta.env.DEV) {
              console.log(`  ➕ ${question.id}: +${calculatedLoad} kW (${userValue} × ${question.additionalLoadKw} kW)`);
            }
          }
        }
        
        
        if (amenityLoadKW > 0) {
          const amenityLoadMW = amenityLoadKW / 1000;
          powerMW += amenityLoadMW;
          if (import.meta.env.DEV) {
            console.log(`✨ [Amenities] Total additional load: ${amenityLoadKW} kW (${amenityLoadMW.toFixed(2)} MW)`);
            console.log(`📊 [Final Power] Base + Amenities: ${powerMW.toFixed(2)} MW`);
          }
        }
      }
    }    if (import.meta.env.DEV) {
      console.log(`📊 [Power Calculation] Final: ${powerMW.toFixed(3)} MW`);
    }
    
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
        if (import.meta.env.DEV) {
          console.log(`✅ [Validation] BESS sizing OK: ${powerMW} MW is ${validation.ratio.toFixed(2)}x user's peak load (${useCaseData.peakLoad} MW)`);
        }
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
 * Calculate datacenter baseline from user inputs
 * Handles capacity from rack count × power per rack or direct capacity input
 */
function calculateDatacenterBaseline(useCaseData: Record<string, any>, scale: number): BaselineCalculationResult {
  // FIXED: Use template field names (rackCount, tierClassification, powerUsageEffectiveness)
  let capacity = 0;
  
  // Priority 1: Calculate from rackCount (matches template question)
  const rackCount = parseInt(useCaseData.rackCount) || 0;
  const powerPerRack = 5; // 5kW per rack (matches template multiplierValue: 0.005 MW)
  
  if (rackCount > 0) {
    const itLoadMW = (rackCount * powerPerRack) / 1000; // IT equipment load
    const pue = parseFloat(useCaseData.powerUsageEffectiveness) || 1.6; // Default PUE 1.6
    capacity = itLoadMW * pue; // Total facility load including cooling
    
    if (import.meta.env.DEV) {
      console.log(`🖥️ [Data Center] Calculated from racks:`, {
        rackCount,
        powerPerRack: powerPerRack + ' kW',
        itLoadMW: itLoadMW.toFixed(3) + ' MW',
        pue,
        totalCapacity: capacity.toFixed(3) + ' MW (IT + cooling)'
      });
    }
  }
  
  // Priority 2: Direct capacity input (if no rackCount)
  if (!capacity) {
    capacity = parseFloat(useCaseData.capacity) || 0;
    if (capacity > 0 && import.meta.env.DEV) {
      console.log(`🖥️ [Data Center] Using direct capacity input: ${capacity} MW`);
    }
  }
  
  // Priority 3: Calculate from square footage
  const squareFootage = parseFloat(useCaseData.squareFootage) || parseFloat(useCaseData.facilitySize) || 0;
  if (!capacity && squareFootage > 0) {
    capacity = (squareFootage * 150) / 1000000; // 150 W/sq ft standard
    if (import.meta.env.DEV) {
      console.log(`🖥️ [Data Center] Calculated ${capacity.toFixed(3)} MW from ${squareFootage} sq ft`);
    }
  }
  
  // Priority 4: Use scale parameter (from wizard)
  if (!capacity && scale > 0) {
    capacity = scale;
    if (import.meta.env.DEV) {
      console.log(`🖥️ [Data Center] Using scale as capacity: ${capacity} MW`);
    }
  }
  
  // Default to 2MW if nothing provided (matches template default 400 racks × 5kW × 1.6 PUE)
  if (!capacity) {
    capacity = 3.2; // 400 racks × 5kW × 1.6 PUE = 3.2 MW
    if (import.meta.env.DEV) {
      console.log(`🖥️ [Data Center] No input, using default: ${capacity} MW (400 racks)`);
    }
  }
  
  // Get tier classification (matches template field name)
  const tierClass = useCaseData.tierClassification || 'tier_3';
  const tier = tierClass.replace('_', ''); // Convert tier_3 to tier3
  
  // Calculate BESS sizing based on tier and facility size
  let bessMultiplier = 0.5; // Default 50% of capacity
  let duration = 4; // Default 4 hours
  let description = 'Tier III';
  
  if (tier === 'tier4') {
    bessMultiplier = 0.7; // 70% for Tier IV (fault tolerant)
    duration = 6;
    description = 'Tier IV (Fault Tolerant)';
  } else if (tier === 'tier3') {
    bessMultiplier = 0.5; // 50% for Tier III (concurrently maintainable)
    duration = 4;
    description = 'Tier III (Concurrently Maintainable)';
  } else if (tier === 'tier2') {
    bessMultiplier = 0.4; // 40% for Tier II
    duration = 3;
    description = 'Tier II (Redundant Components)';
  } else if (tier === 'tier1') {
    bessMultiplier = 0.3; // 30% for Tier I
    duration = 2;
    description = 'Tier I (Basic Capacity)';
  }
  
  const powerMW = Math.max(0.5, Math.round(capacity * bessMultiplier * 100) / 100);
  
  if (import.meta.env.DEV) {
    console.log(`🔋 [Data Center BESS] ${description}:`, {
      facilityCapacity: capacity.toFixed(3) + ' MW',
      bessMultiplier: (bessMultiplier * 100) + '%',
      bessSize: powerMW.toFixed(3) + ' MW',
      duration: duration + ' hours'
    });
  }
  
  // Calculate solar (limited for datacenters due to 24/7 operation)
  const solarMW = Math.max(0, Math.round(powerMW * 0.3 * 10) / 10); // 30% of BESS size
  
  return {
    powerMW,
    durationHrs: duration,
    solarMW,
    description: `${description}: ${capacity.toFixed(1)}MW facility → ${powerMW.toFixed(1)}MW BESS`,
    dataSource: 'Calculated from rack count and tier classification'
  };
}

/**
 * Calculate datacenter BESS sizing based on tier requirements
 * Uses database-backed multipliers for consistency
 * 
 * @param capacity - Datacenter capacity in MW
 * @param uptimeRequirement - Tier III, Tier IV, etc.
 * @param gridConnection - single, redundant, microgrid, limited
 * @param config - Database configuration with load_profile_data containing multipliers
 * @returns Recommended BESS configuration
 */
export function calculateDatacenterBESS(
  capacity: number,
  uptimeRequirement: string = 'tier3',
  gridConnection: string = 'single',
  config?: any
): { powerMW: number; durationHours: number; description: string } {
  
  // Default multipliers (fallback if not in database)
  const defaultMultipliers = {
    tier3: { power: 0.5, duration: 3 },
    tier4: { power: 0.6, duration: 4 },
    microgrid: { power: 0.8, duration: 6 },
    limited: { power: 0.8, duration: 6 }
  };
  
  // Try to get multipliers from database config
  let multipliers = defaultMultipliers;
  if (config?.load_profile_data?.datacenter_multipliers) {
    multipliers = { ...defaultMultipliers, ...config.load_profile_data.datacenter_multipliers };
    if (import.meta.env.DEV) {
      console.log('🖥️ [Datacenter] Using database multipliers:', multipliers);
    }
  } else if (import.meta.env.DEV) {
    console.log('🖥️ [Datacenter] Using default multipliers (not found in database)');
  }
  
  // Determine sizing based on grid connection and tier
  let powerMultiplier: number;
  let duration: number;
  let description: string;
  
  if (gridConnection === 'microgrid' || gridConnection === 'limited') {
    const config = multipliers.microgrid || multipliers.limited;
    powerMultiplier = config.power;
    duration = config.duration;
    description = `Microgrid/Limited Grid: ${(powerMultiplier * 100).toFixed(0)}% capacity, ${duration}hr backup`;
  } else if (uptimeRequirement === 'tier4') {
    const config = multipliers.tier4;
    powerMultiplier = config.power;
    duration = config.duration;
    description = `Tier IV: ${(powerMultiplier * 100).toFixed(0)}% capacity, ${duration}hr backup`;
  } else {
    // Default to Tier III
    const config = multipliers.tier3;
    powerMultiplier = config.power;
    duration = config.duration;
    description = `Tier III: ${(powerMultiplier * 100).toFixed(0)}% capacity, ${duration}hr backup`;
  }
  
  const powerMW = capacity * powerMultiplier;
  
  if (import.meta.env.DEV) {
    console.log(`🖥️ [Datacenter Sizing] ${capacity}MW × ${powerMultiplier} = ${powerMW}MW / ${duration}hr`);
  }
  
  return {
    powerMW: Math.round(powerMW * 100) / 100, // Round to 0.01 MW
    durationHours: duration,
    description
  };
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
  // FIXED: Match template field names (numberOfDCFastChargers, numberOfLevel2Chargers)
  const level2Count = parseInt(useCaseData.numberOfLevel2Chargers || useCaseData.level2Chargers) || 0;
  const level2Power = parseFloat(useCaseData.level2Power) || 19.2; // kW (commercial Level 2 standard)
  const dcFastCount = parseInt(useCaseData.numberOfDCFastChargers || useCaseData.dcFastChargers) || 0;
  const dcFastPower = parseFloat(useCaseData.dcFastPower) || 150; // kW (DC fast charger standard)
  const concurrency = Math.min(parseInt(useCaseData.peakConcurrency) || 70, 80) / 100; // 70% default
  
  const totalLevel2 = (level2Count * level2Power) / 1000; // MW
  const totalDCFast = (dcFastCount * dcFastPower) / 1000; // MW
  const totalCharging = totalLevel2 + totalDCFast;
  
  if (import.meta.env.DEV) {
    console.log('🔌 [EV Charging Calculation] Field mapping check:', {
      rawData: useCaseData,
      numberOfLevel2Chargers: useCaseData.numberOfLevel2Chargers,
      numberOfDCFastChargers: useCaseData.numberOfDCFastChargers
    });
    console.log('🔌 [EV Charging Calculation] Power breakdown:', {
      level2Count,
      level2Power,
      level2Total: totalLevel2.toFixed(3) + ' MW',
      dcFastCount,
      dcFastPower,
      dcFastTotal: totalDCFast.toFixed(3) + ' MW',
      concurrency: (concurrency * 100) + '%',
      totalCharging: totalCharging.toFixed(3) + ' MW'
    });
  }
  
  // Battery sized for peak demand management 
  // Use 100% of total charging capacity with concurrency factor
  const powerMW = Math.max(0.2, totalCharging * concurrency);
  const roundedPowerMW = Math.round(powerMW * 100) / 100; // Round to 0.01 MW precision
  
  // GENERATION LOGIC: Determine if solar/generation is required
  const gridConnection = useCaseData.gridConnection || 'reliable';
  const gridCapacity = parseFloat(useCaseData.gridCapacity) || 0; // 0 = unlimited
  const peakDemandMW = totalCharging; // Peak when all chargers active
  
  let generationRequired = false;
  let generationRecommendedMW = 0;
  let generationReason = '';
  
  if (gridConnection === 'off_grid') {
    // OFF-GRID: Must generate 100% of power
    generationRequired = true;
    generationRecommendedMW = Math.round(peakDemandMW * 1.2 * 10) / 10; // 120% for headroom
    generationReason = 'Off-grid location requires 100% generation capacity';
  } else if (gridConnection === 'limited' && gridCapacity > 0 && peakDemandMW > gridCapacity) {
    // LIMITED GRID: Generate the gap
    const gridGap = peakDemandMW - gridCapacity;
    generationRequired = true;
    generationRecommendedMW = Math.round(gridGap * 1.1 * 10) / 10; // 110% gap coverage
    generationReason = `Peak demand (${peakDemandMW.toFixed(1)}MW) exceeds grid capacity (${gridCapacity}MW) by ${gridGap.toFixed(1)}MW`;
  } else if (gridConnection === 'limited') {
    // LIMITED BUT NO CAPACITY ENTERED: Recommend generation
    generationRequired = false; // Not required without specific capacity
    generationRecommendedMW = Math.round(peakDemandMW * 0.5 * 10) / 10; // 50% as backup
    generationReason = 'Limited grid capacity - recommend 50% generation for reliability';
  } else if (gridConnection === 'unreliable') {
    // UNRELIABLE: Recommend backup generation
    generationRecommendedMW = Math.round(peakDemandMW * 0.3 * 10) / 10; // 30% for outages
    generationReason = 'Unreliable grid - recommend 30% generation for backup during outages';
  } else if (gridConnection === 'microgrid') {
    // MICROGRID: Need generation for islanding
    generationRecommendedMW = Math.round(peakDemandMW * 0.8 * 10) / 10; // 80% for islanding
    generationReason = 'Microgrid operation requires generation for grid independence';
  }
  
  if (import.meta.env.DEV) {
    console.log('🔋 [EV Charging] Recommended Battery Size:', roundedPowerMW, 'MW');
    console.log('🔋 [EV Charging] Calculation: ' + totalCharging.toFixed(3) + ' MW × ' + (concurrency * 100) + '% = ' + powerMW.toFixed(3) + ' MW');
    console.log('☀️ [Generation Analysis]:', {
      gridConnection,
      gridCapacity: gridCapacity || 'unlimited',
      peakDemand: peakDemandMW.toFixed(2) + ' MW',
      generationRequired,
      generationRecommended: generationRecommendedMW + ' MW',
      reason: generationReason
    });
  }
  
  return {
    powerMW: roundedPowerMW,
    durationHrs: 2, // Short duration for demand management
    solarMW: Math.round(roundedPowerMW * 1.0 * 10) / 10,
    description: `EV Charging: ${level2Count} Level 2 (${(totalLevel2 * 1000).toFixed(0)}kW) + ${dcFastCount} DC Fast (${(totalDCFast * 1000).toFixed(0)}kW)`,
    dataSource: 'Calculated from charger specifications',
    gridConnection,
    gridCapacity,
    peakDemandMW,
    generationRequired,
    generationRecommendedMW,
    generationReason
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
  
  if (import.meta.env.DEV) {
    console.log(`⚠️ [BaselineService] Using fallback for ${template}:`, fallback);
  }
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
