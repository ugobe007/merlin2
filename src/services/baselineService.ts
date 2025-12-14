/**
 * BASELINE CALCULATION SERVICE
 * 
 * Single source of truth for industry baseline calculations.
 * Used by StreamlinedWizard and AI optimization.
 * 
 * This service queries the Supabase database for use case configurations
 * and calculates recommended BESS sizing based on actual data.
 * 
 * Performance: Uses in-memory caching to reduce database queries.
 * 
 * ✅ SSOT COMPLIANT (Dec 2025):
 * - Uses useCaseService.getCustomQuestionsByUseCaseId() for custom questions
 * - NO longer imports from deprecated useCaseTemplates.ts
 */

import { useCaseService, type CustomQuestionRow } from './useCaseService';
import { baselineCache } from './cacheService';
import { DATACENTER_TIER_STANDARDS, AMENITY_POWER_STANDARDS } from './useCasePowerCalculations';

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
  // Grid strategy savings (for limited grid / off-grid scenarios)
  gridSavingsGoal?: string;
  gridImportLimitKW?: number;
  annualGridFees?: number;
  gridFeeSavings?: number;
  gridStrategy?: {
    strategy: string;
    savingsReason: string;
    annualSavings: number;
    requiresGeneration: boolean;
    recommendedSolarMW: number;
  };
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
      if (import.meta.env.DEV) { console.log(`🔍 [BaselineService] useCaseData keys:`, useCaseData ? Object.keys(useCaseData) : 'null/undefined'); }
      if (import.meta.env.DEV) { console.log(`🔍 [BaselineService] useCaseData values:`, useCaseData); }
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
    
    // Special case: Agriculture uses acreage-based calculation
    // Scale is already calculated as MW in the wizard, so use it directly
    if ((templateKey === 'agriculture' || templateKey === 'agricultural') && useCaseData) {
      // If user specified irrigation load, add it
      const irrigationKW = parseFloat(useCaseData.irrigationLoad) || 0;
      
      // Scale from wizard is already in MW (acreage × 0.4 kW/acre / 1000)
      // Add irrigation load if specified
      const totalPowerMW = scale + (irrigationKW / 1000);
      
      // Use reasonable duration for agricultural operations (backup during irrigation season)
      const durationHrs = 4;
      
      if (import.meta.env.DEV) {
        console.log(`🚜 [BaselineService] Agriculture calculation:`);
        if (import.meta.env.DEV) { console.log(`   Scale (from acreage): ${scale.toFixed(3)} MW`); }
        if (import.meta.env.DEV) { console.log(`   Irrigation load: ${irrigationKW} kW = ${(irrigationKW/1000).toFixed(3)} MW`); }
        if (import.meta.env.DEV) { console.log(`   Total power: ${totalPowerMW.toFixed(3)} MW`); }
      }
      
      const agResult = {
        powerMW: Math.max(0.2, Math.round(totalPowerMW * 100) / 100), // Minimum 200 kW
        durationHrs,
        solarMW: 0, // Let user control solar preference
        description: `Agricultural baseline: ${scale.toFixed(2)} MW from acreage + ${(irrigationKW/1000).toFixed(2)} MW irrigation`,
        dataSource: 'Wizard (acreage × 0.4 kW/acre)'
      };
      
      baselineCache.set(cacheKey, agResult);
      return agResult;
    }
    
    // **CRITICAL FIX**: Check if user explicitly provided peak load
    // If user entered peakLoad in MW, use that value directly instead of database/fallback
    if (useCaseData && typeof useCaseData.peakLoad === 'number' && useCaseData.peakLoad > 0) {
      const userPowerMW = useCaseData.peakLoad;
      const durationHrs = useCaseData.operatingHours ? Math.round(useCaseData.operatingHours / 5) : 4; // Default 4 hours
      // ✅ FIXED: Don't auto-calculate solar - let user control via wantsSolar preference
      const solarMW = 0;
      
      if (import.meta.env.DEV) {
        console.log(`👤 [BaselineService] Using user's explicit peak load input: ${userPowerMW} MW`);
        console.log(`👤 [BaselineService] User inputs:`, { 
          peakLoad: useCaseData.peakLoad,
          facilitySize: useCaseData.facilitySize,
          operatingHours: useCaseData.operatingHours 
        });
        if (import.meta.env.DEV) { console.log(`👤 [BaselineService] Cache key: "${cacheKey}"`); }
        if (import.meta.env.DEV) { console.log(`👤 [BaselineService] Template: "${templateKey}", Scale: ${scale}`); }
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
        if (import.meta.env.DEV) { console.log(`🏨 [Hotel Calculation] Actual: ${actualRooms} rooms × ${kWPerRoom.toFixed(2)} kW/room = ${basePowerMW.toFixed(3)} MW`); }
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
    
    // Add amenity loads from customQuestions marked with impactType: 'power_add' or 'additionalLoad'
    // ✅ SSOT: Now queries database instead of hardcoded templates
    if (useCaseData) {
      // Get custom questions from database (SSOT)
      let customQuestions: CustomQuestionRow[] = [];
      try {
        // First try to get use case by slug
        const useCase = await useCaseService.getUseCaseBySlug(templateKey);
        if (useCase?.id) {
          customQuestions = await useCaseService.getCustomQuestionsByUseCaseId(useCase.id);
        }
      } catch (error) {
        console.warn('[baselineService] Could not fetch custom questions from DB:', error);
      }
      
      if (customQuestions.length > 0) {
        let amenityLoadKW = 0;
        
        for (const question of customQuestions) {
          // DB uses 'additionalLoad' for power add impacts
          if (question.impact_type !== 'additionalLoad') continue;
          
          // Use question_key (DB column) to look up user value
          const userValue = useCaseData[question.question_key];
          if (!userValue) continue;
          
          // Handle select questions with powerKw in select_options
          if (question.question_type === 'select' && question.select_options) {
            const options = Array.isArray(question.select_options) ? question.select_options : [];
            const selectedOption = options.find((opt: any) => 
              typeof opt === 'object' && opt.value === userValue
            );
            if (selectedOption && typeof selectedOption === 'object' && 'powerKw' in selectedOption) {
              amenityLoadKW += (selectedOption as any).powerKw;
              if (import.meta.env.DEV) {
                console.log(`  ➕ ${question.question_key}: +${(selectedOption as any).powerKw} kW (${userValue})`);
              }
            }
          }
          
          // Handle number inputs - check impact_calculation for additional load value
          if (question.question_type === 'number' && typeof userValue === 'number') {
            const impactCalc = question.impact_calculation as any;
            const additionalLoadKw = impactCalc?.additionalLoadKw || impactCalc?.powerKw || 0;
            if (additionalLoadKw > 0) {
              const calculatedLoad = userValue * additionalLoadKw;
              amenityLoadKW += calculatedLoad;
              if (import.meta.env.DEV) {
                console.log(`  ➕ ${question.question_key}: +${calculatedLoad} kW (${userValue} × ${additionalLoadKw} kW)`);
              }
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
    
    // ✅ FIXED: Don't auto-calculate solar - let user control via wantsSolar preference
    // Solar should be 0 by default; SmartWizard will set it based on user's answers
    const solarMW = 0;
    
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
  
  // ✅ USE SSOT: Get tier standards from useCasePowerCalculations.ts
  const tierKey = tier as keyof typeof DATACENTER_TIER_STANDARDS;
  const tierStandards = DATACENTER_TIER_STANDARDS[tierKey] || DATACENTER_TIER_STANDARDS.tier3;
  
  const bessMultiplier = tierStandards.bessMultiplier;
  const duration = tierStandards.durationHours;
  const description = tierStandards.name;
  
  const powerMW = Math.max(0.5, Math.round(capacity * bessMultiplier * 100) / 100);
  
  if (import.meta.env.DEV) {
    console.log(`🔋 [Data Center BESS] ${description}:`, {
      facilityCapacity: capacity.toFixed(3) + ' MW',
      bessMultiplier: (bessMultiplier * 100) + '%',
      bessSize: powerMW.toFixed(3) + ' MW',
      duration: duration + ' hours'
    });
  }
  
  // ✅ FIXED: Don't auto-calculate solar - let user control via wantsSolar preference
  const solarMW = 0;
  
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
 * Calculate Grid Strategy Savings
 * 
 * For European and other markets where grid fees are significant,
 * calculates potential savings from:
 * - Going off-grid (avoiding all grid fees)
 * - Limiting grid access (reducing capacity charges)
 * - Grid-optimized (reducing peak demand charges)
 * 
 * @param useCaseData - User inputs including grid connection settings
 * @param peakDemandMW - Peak power demand of the facility
 * @returns Grid strategy analysis with savings calculations
 */
export function calculateGridStrategySavings(
  useCaseData: Record<string, any>,
  peakDemandMW: number
): BaselineCalculationResult['gridStrategy'] | undefined {
  const gridConnection = useCaseData.gridConnection || 'full_grid';
  const gridSavingsGoal = useCaseData.gridSavingsGoal || 'cost_reduction';
  const annualGridFees = parseFloat(useCaseData.annualGridFees) || 0;
  const gridImportLimitKW = parseFloat(useCaseData.gridImportLimit) || 0;
  
  // If no special grid strategy, return undefined
  if (gridConnection === 'full_grid' || gridConnection === 'reliable') {
    return undefined;
  }
  
  let strategy = '';
  let savingsReason = '';
  let annualSavings = 0;
  let requiresGeneration = false;
  let recommendedSolarMW = 0;
  
  switch (gridConnection) {
    case 'off_grid':
      // Off-grid: Save 100% of grid fees, but need 100% generation
      strategy = 'Complete Grid Independence';
      savingsReason = 'Eliminating grid connection saves all capacity charges and connection fees';
      annualSavings = annualGridFees; // Save 100% of grid fees
      requiresGeneration = true;
      recommendedSolarMW = peakDemandMW * 1.3; // 130% of peak for reliability
      break;
      
    case 'grid_backup':
      // Grid as backup: Save ~80% of grid fees, need ~80% generation
      strategy = 'Grid as Emergency Backup';
      savingsReason = 'Minimal grid reliance reduces capacity charges significantly';
      annualSavings = annualGridFees * 0.8; // Save 80% of grid fees
      requiresGeneration = true;
      recommendedSolarMW = peakDemandMW * 1.0; // 100% of peak
      break;
      
    case 'grid_limited':
      // Limited grid: Save based on import limit reduction
      strategy = 'Limited Grid Import';
      if (gridImportLimitKW > 0) {
        const limitMW = gridImportLimitKW / 1000;
        const reductionPercent = Math.max(0, Math.min(1, 1 - (limitMW / peakDemandMW)));
        savingsReason = `Limiting grid import to ${gridImportLimitKW}kW reduces capacity charges by ${(reductionPercent * 100).toFixed(0)}%`;
        annualSavings = annualGridFees * reductionPercent;
        requiresGeneration = limitMW < peakDemandMW * 0.5;
        recommendedSolarMW = Math.max(0, (peakDemandMW - limitMW) * 0.8);
      } else {
        savingsReason = 'Limiting grid dependency reduces capacity charges and connection fees';
        annualSavings = annualGridFees * 0.5; // Estimate 50% savings
        recommendedSolarMW = peakDemandMW * 0.5;
      }
      break;
      
    case 'grid_optimized':
      // Grid-optimized: Use BESS to reduce peak demand charges
      strategy = 'Grid-Optimized (Peak Shaving)';
      savingsReason = 'Using BESS for peak shaving reduces demand charges by 20-40%';
      annualSavings = annualGridFees * 0.3; // Conservative 30% demand charge reduction
      requiresGeneration = false;
      recommendedSolarMW = peakDemandMW * 0.3; // Optional solar for arbitrage
      break;
      
    case 'microgrid':
      // Microgrid: Community/campus independence
      strategy = 'Microgrid Operation';
      savingsReason = 'Microgrid islanding capability reduces grid dependency and charges';
      annualSavings = annualGridFees * 0.6; // 60% savings from islanding
      requiresGeneration = true;
      recommendedSolarMW = peakDemandMW * 0.8;
      break;
      
    default:
      return undefined;
  }
  
  // Add savings motivation context
  if (gridSavingsGoal === 'avoid_grid_fees' && annualGridFees > 0) {
    savingsReason += ` (€${annualGridFees.toLocaleString()}/year in grid fees)`;
  } else if (gridSavingsGoal === 'energy_independence') {
    savingsReason += ' with focus on energy self-sufficiency';
  } else if (gridSavingsGoal === 'carbon_reduction') {
    savingsReason += ' while maximizing clean energy use';
  }
  
  if (import.meta.env.DEV) {
    console.log('⚡ [Grid Strategy] Calculated savings:', {
      gridConnection,
      gridSavingsGoal,
      annualGridFees,
      gridImportLimitKW,
      peakDemandMW,
      strategy,
      annualSavings,
      recommendedSolarMW,
      requiresGeneration
    });
  }
  
  return {
    strategy,
    savingsReason,
    annualSavings,
    requiresGeneration,
    recommendedSolarMW
  };
}

/**
 * Calculate EV charging baseline based on charger specifications
 * 
 * This handles the complex calculation for EV charging stations based on:
 * - Number and power of Level 2 chargers (7-22 kW)
 * - Number and power of DC Fast chargers (50-150 kW)
 * - Number and power of HPC chargers (350 kW)
 * - Number and power of Megawatt chargers (1 MW+)
 * - Peak concurrency factor
 * 
 * ✅ FIXED Dec 14, 2025: Support NEW database field names:
 * - level2Chargers, dcfc50kwChargers, dcfc150kwChargers, dcfc350kwChargers, megawattChargers
 * - concurrentChargingSessions (not peakConcurrency)
 */
function calculateEVChargingBaseline(useCaseData: Record<string, any>): BaselineCalculationResult {
  // ============================================
  // LEVEL 2 AC CHARGERS (7-22 kW)
  // ============================================
  // Database field: level2Chargers (NEW Dec 2025)
  // Legacy fields: level2Count, numberOfLevel2Chargers
  const level2Count = parseInt(
    useCaseData.level2Chargers || 
    useCaseData.level2Count || 
    useCaseData.numberOfLevel2Chargers || 
    useCaseData.level2_chargers ||
    useCaseData.l2Chargers
  ) || 0;
  const level2Power = parseFloat(useCaseData.level2Power) || 19.2; // kW (default commercial Level 2)
  const totalLevel2 = (level2Count * level2Power) / 1000; // MW
  
  // ============================================
  // DC FAST CHARGERS (50-150 kW)
  // ============================================
  // Database fields: dcfc50kwChargers, dcfc150kwChargers (NEW Dec 2025)
  // Legacy fields: dcfastCount, numberOfDCFastChargers
  const dcfc50Count = parseInt(useCaseData.dcfc50kwChargers || 0) || 0;
  const dcfc150Count = parseInt(useCaseData.dcfc150kwChargers || 0) || 0;
  const dcFastCountLegacy = parseInt(
    useCaseData.dcfastCount || 
    useCaseData.numberOfDCFastChargers || 
    useCaseData.dcFastChargers
  ) || 0;
  
  // If legacy dcFastCount exists but no granular data, assume all 150kW
  const totalDcfc50 = (dcfc50Count * 50) / 1000; // MW
  const totalDcfc150 = ((dcfc150Count + (dcFastCountLegacy && !dcfc50Count && !dcfc150Count ? dcFastCountLegacy : 0)) * 150) / 1000; // MW
  const totalDCFast = totalDcfc50 + totalDcfc150;
  
  // ============================================
  // HPC CHARGERS (350 kW)
  // ============================================
  // Database field: dcfc350kwChargers (NEW Dec 2025)
  const hpc350Count = parseInt(useCaseData.dcfc350kwChargers || 0) || 0;
  const totalHPC = (hpc350Count * 350) / 1000; // MW
  
  // ============================================
  // MEGAWATT CHARGERS (1 MW+)
  // ============================================
  // Database field: megawattChargers (NEW Dec 2025)
  const megawattCount = parseInt(useCaseData.megawattChargers || 0) || 0;
  const totalMegawatt = megawattCount * 1.0; // MW (1 MW per charger)
  
  // ============================================
  // TOTAL CHARGING CAPACITY
  // ============================================
  const totalCharging = totalLevel2 + totalDCFast + totalHPC + totalMegawatt;
  
  // ============================================
  // CONCURRENCY FACTOR
  // ============================================
  // Database field: concurrentChargingSessions (NEW Dec 2025)
  // Legacy field: peakConcurrency
  const concurrency = Math.min(
    parseInt(useCaseData.concurrentChargingSessions || useCaseData.peakConcurrency) || 60, 
    90
  ) / 100; // Default 60%, max 90%
  
  if (import.meta.env.DEV) {
    console.log('🔌 [EV Charging Baseline] Field mapping check:', {
      rawDataKeys: Object.keys(useCaseData || {}),
      // Level 2
      level2Chargers_raw: useCaseData.level2Chargers,
      level2Count_legacy: useCaseData.level2Count,
      resolved_level2: level2Count,
      // DC Fast
      dcfc50kwChargers_raw: useCaseData.dcfc50kwChargers,
      dcfc150kwChargers_raw: useCaseData.dcfc150kwChargers,
      dcfastCount_legacy: dcFastCountLegacy,
      resolved_dcfc50: dcfc50Count,
      resolved_dcfc150: dcfc150Count,
      // HPC
      dcfc350kwChargers_raw: useCaseData.dcfc350kwChargers,
      resolved_hpc350: hpc350Count,
      // Megawatt
      megawattChargers_raw: useCaseData.megawattChargers,
      resolved_megawatt: megawattCount,
      // Concurrency
      concurrentChargingSessions_raw: useCaseData.concurrentChargingSessions,
      peakConcurrency_legacy: useCaseData.peakConcurrency,
      resolved_concurrency: (concurrency * 100) + '%'
    });
    console.log('🔌 [EV Charging Baseline] Power breakdown:', {
      level2: {
        count: level2Count,
        power: level2Power + ' kW',
        total: totalLevel2.toFixed(3) + ' MW'
      },
      dcfc50: {
        count: dcfc50Count,
        power: '50 kW',
        total: totalDcfc50.toFixed(3) + ' MW'
      },
      dcfc150: {
        count: dcfc150Count + (dcFastCountLegacy && !dcfc50Count && !dcfc150Count ? dcFastCountLegacy : 0),
        power: '150 kW',
        total: totalDcfc150.toFixed(3) + ' MW'
      },
      hpc350: {
        count: hpc350Count,
        power: '350 kW',
        total: totalHPC.toFixed(3) + ' MW'
      },
      megawatt: {
        count: megawattCount,
        power: '1000 kW',
        total: totalMegawatt.toFixed(3) + ' MW'
      },
      concurrency: (concurrency * 100) + '%',
      totalCharging: totalCharging.toFixed(3) + ' MW',
      peakDemand: (totalCharging * concurrency).toFixed(3) + ' MW'
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
    if (import.meta.env.DEV) { console.log('🔋 [EV Charging] Calculation: ' + totalCharging.toFixed(3) + ' MW × ' + (concurrency * 100) + '% = ' + powerMW.toFixed(3) + ' MW'); }
    console.log('☀️ [Generation Analysis]:', {
      gridConnection,
      gridCapacity: gridCapacity || 'unlimited',
      peakDemand: peakDemandMW.toFixed(2) + ' MW',
      generationRequired,
      generationRecommended: generationRecommendedMW + ' MW',
      reason: generationReason
    });
  }
  
  // Calculate grid strategy savings (for European off-grid/limited-grid scenarios)
  const gridStrategy = calculateGridStrategySavings(useCaseData, peakDemandMW);
  
  // Build detailed description showing all charger types
  const descParts: string[] = [];
  if (level2Count > 0) descParts.push(`${level2Count} Level 2 (${(totalLevel2 * 1000).toFixed(0)}kW)`);
  if (dcfc50Count > 0) descParts.push(`${dcfc50Count} DCFC-50 (${(totalDcfc50 * 1000).toFixed(0)}kW)`);
  const dcfc150Total = dcfc150Count + (dcFastCountLegacy && !dcfc50Count && !dcfc150Count ? dcFastCountLegacy : 0);
  if (dcfc150Total > 0) descParts.push(`${dcfc150Total} DCFC-150 (${(totalDcfc150 * 1000).toFixed(0)}kW)`);
  if (hpc350Count > 0) descParts.push(`${hpc350Count} HPC-350 (${(totalHPC * 1000).toFixed(0)}kW)`);
  if (megawattCount > 0) descParts.push(`${megawattCount} MW-Chargers (${(totalMegawatt * 1000).toFixed(0)}kW)`);
  
  const description = descParts.length > 0 
    ? `EV Charging: ${descParts.join(' + ')}` 
    : 'EV Charging Station';
  
  return {
    powerMW: roundedPowerMW,
    durationHrs: 2, // Short duration for demand management
    solarMW: 0, // ✅ FIXED: Don't auto-add solar - let user decide
    description,
    dataSource: 'Calculated from charger specifications',
    gridConnection,
    gridCapacity,
    peakDemandMW,
    generationRequired,
    generationRecommendedMW,
    generationReason,
    gridSavingsGoal: useCaseData.gridSavingsGoal,
    gridImportLimitKW: parseFloat(useCaseData.gridImportLimit) || 0,
    annualGridFees: parseFloat(useCaseData.annualGridFees) || 0,
    gridFeeSavings: gridStrategy?.annualSavings || 0,
    gridStrategy
  };
}

/**
 * Fallback baseline calculations when database is unavailable
 * 
 * These are based on industry standards (CBECS, NREL, ASHRAE)
 * but should only be used as a last resort.
 */
function getFallbackBaseline(template: string): BaselineCalculationResult {
  // ✅ FIXED: All fallbacks now have solarMW: 0 - let user control via preferences
  const fallbacks: Record<string, BaselineCalculationResult> = {
    'hotel': {
      powerMW: 2.0,
      durationHrs: 4,
      solarMW: 0,
      description: 'Fallback: Standard hotel configuration',
      dataSource: 'Fallback (CBECS 2018)'
    },
    'ev-charging': {
      powerMW: 2.0,
      durationHrs: 2,
      solarMW: 0,
      description: 'Fallback: Standard EV charging station',
      dataSource: 'Fallback (DOE Alt Fuels Data)'
    },
    'data-center': {
      powerMW: 5.0,
      durationHrs: 8,
      solarMW: 0,
      description: 'Fallback: Standard data center',
      dataSource: 'Fallback (Uptime Institute)'
    },
    'manufacturing': {
      powerMW: 3.0,
      durationHrs: 6,
      solarMW: 0,
      description: 'Fallback: Standard manufacturing facility',
      dataSource: 'Fallback (DOE Industrial)'
    },
    'hospital': {
      powerMW: 4.0,
      durationHrs: 8,
      solarMW: 0,
      description: 'Fallback: Standard hospital',
      dataSource: 'Fallback (CBECS Healthcare)'
    }
  };
  
  const fallback = fallbacks[template] || {
    powerMW: 2.0,
    durationHrs: 4,
    solarMW: 0,
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

// ============================================================================
// LEGACY COMPATIBILITY - calculateBESSSize
// ============================================================================

/**
 * @deprecated Use calculateDatabaseBaseline() for new code
 * 
 * This function maintains backward compatibility with dataIntegrationService.ts
 * which previously imported from bessDataService.ts.
 */
export interface BESSSizingParameters {
  peakDemandkW: number;
  averageDemandkW: number;
  dailyEnergyConsumptionkWh: number;
  peakDemandReductionTargetPercent: number;
  recommendedPowerMW: number;
  recommendedDurationHours: number;
  recommendedCapacityMWh: number;
  estimatedAnnualSavings: number;
}

export function calculateBESSSize(params: {
  peakDemandkW: number;
  averageDemandkW: number;
  dailyEnergyConsumptionkWh: number;
  useCase: string;
  primaryObjective: 'peak-shaving' | 'backup' | 'arbitrage' | 'all';
}): BESSSizingParameters {
  const { peakDemandkW, averageDemandkW, dailyEnergyConsumptionkWh, primaryObjective } = params;
  
  let recommendedPowerMW: number;
  let recommendedDurationHours: number;
  let peakShavingPercent = 30;
  
  switch (primaryObjective) {
    case 'peak-shaving':
      recommendedPowerMW = (peakDemandkW * 0.30) / 1000; // 30% peak shaving
      recommendedDurationHours = 2;
      peakShavingPercent = 30;
      break;
      
    case 'backup':
      recommendedPowerMW = (averageDemandkW * 1.2) / 1000; // 120% of average
      recommendedDurationHours = 4;
      peakShavingPercent = 0;
      break;
      
    case 'arbitrage':
      recommendedPowerMW = (peakDemandkW * 0.6) / 1000;
      recommendedDurationHours = 6;
      peakShavingPercent = 20;
      break;
      
    case 'all':
    default:
      recommendedPowerMW = (peakDemandkW * 0.4) / 1000;
      recommendedDurationHours = 4;
      peakShavingPercent = 25;
      break;
  }
  
  const recommendedCapacityMWh = recommendedPowerMW * recommendedDurationHours;
  
  // Estimate savings: peak shaving typically saves $100-200/kW/year
  const estimatedAnnualSavings = peakDemandkW * (peakShavingPercent / 100) * 150;
  
  return {
    peakDemandkW,
    averageDemandkW,
    dailyEnergyConsumptionkWh,
    peakDemandReductionTargetPercent: peakShavingPercent,
    recommendedPowerMW,
    recommendedDurationHours,
    recommendedCapacityMWh,
    estimatedAnnualSavings
  };
}
