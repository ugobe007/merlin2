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

import { useCaseService, type CustomQuestionRow } from "./useCaseService";
import { baselineCache } from "./cacheService";
import { DATACENTER_TIER_STANDARDS } from "./useCasePowerCalculations";

// ============================================================================
// HELPER: Parse scale string to numeric value
// ============================================================================
// Handles cases where scale comes as a string like "50,000 - 100,000 sq ft"
// Returns a numeric multiplier for power calculations
// ============================================================================
function parseScaleToNumber(scale: string | number | undefined): number {
  // If already a number, return it
  if (typeof scale === "number") return scale;

  // If undefined or empty, return default
  if (!scale) return 1;

  // Parse strings like "50,000 - 100,000 sq ft" → take midpoint
  const cleanedScale = String(scale)
    .replace(/,/g, "")
    .replace(/sq\s*ft/gi, "")
    .trim();

  // Check for range (e.g., "50000 - 100000")
  const rangeMatch = cleanedScale.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1], 10);
    const high = parseInt(rangeMatch[2], 10);
    // Return midpoint normalized to 50,000 sq ft baseline
    return (low + high) / 2 / 50000;
  }

  // Check for single number with optional suffix
  const numberMatch = cleanedScale.match(/(\d+)/);
  if (numberMatch) {
    // Normalize to 50,000 sq ft baseline
    return parseInt(numberMatch[1], 10) / 50000;
  }

  // Default fallback (1.0 = 50,000 sq ft baseline)
  return 1;
}

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
 * @param scale - Scale factor for sizing (number of rooms, sq ft, or string like "50,000 - 100,000 sq ft")
 * @param useCaseData - Additional data for complex calculations (EV chargers, etc.)
 * @returns Recommended BESS configuration
 */
export async function calculateDatabaseBaseline(
  template: string | string[],
  scale: number | string = 1,
  useCaseData?: Record<string, any>
): Promise<BaselineCalculationResult> {
  const templateKey = Array.isArray(template) ? template[0] : template;

  // Generate stable cache key by sorting object keys
  // This prevents cache misses from object key ordering differences
  let cacheKeyData = "";
  if (useCaseData) {
    const sortedKeys = Object.keys(useCaseData).sort();
    const sortedData: Record<string, any> = {};
    sortedKeys.forEach((key) => {
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
      console.log(`🔍 [BaselineService] Fetching configuration for: ${templateKey}`, {
        scale,
        useCaseData,
      });
      if (import.meta.env.DEV) {
        console.log(
          `🔍 [BaselineService] useCaseData keys:`,
          useCaseData ? Object.keys(useCaseData) : "null/undefined"
        );
      }
      if (import.meta.env.DEV) {
        console.log(`🔍 [BaselineService] useCaseData values:`, useCaseData);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SPECIAL CASE HANDLERS - Industry-specific calculation logic
    // Each handler takes useCaseData and returns BaselineCalculationResult
    // ═══════════════════════════════════════════════════════════════════════

    // Special case: EV Charging uses charger-specific calculation
    if (templateKey === "ev-charging" && useCaseData) {
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
    if ((templateKey === "datacenter" || templateKey === "data-center") && useCaseData) {
      const dcResult = calculateDatacenterBaseline(useCaseData, scale);
      if (import.meta.env.DEV) {
        console.log(`🖥️ [BaselineService] Datacenter calculated:`, dcResult);
      }

      // Cache the result
      baselineCache.set(cacheKey, dcResult);
      return dcResult;
    }

    // Special case: College/University uses enrollment and facility-based calculation
    if (templateKey === "college" && useCaseData) {
      const collegeResult = calculateCollegeBaseline(useCaseData);
      if (import.meta.env.DEV) {
        console.log(`🎓 [BaselineService] College calculated:`, collegeResult);
      }

      // Cache the result
      baselineCache.set(cacheKey, collegeResult);
      return collegeResult;
    }

    // Special case: Hospital uses bed count and facility type
    if (templateKey === "hospital" && useCaseData) {
      const hospitalResult = calculateHospitalBaseline(useCaseData);
      if (import.meta.env.DEV) {
        console.log(`🏥 [BaselineService] Hospital calculated:`, hospitalResult);
      }
      baselineCache.set(cacheKey, hospitalResult);
      return hospitalResult;
    }

    // Special case: Hotel uses room count and amenities
    if (templateKey === "hotel" && useCaseData) {
      const hotelResult = calculateHotelBaseline(useCaseData, String(scale));
      if (import.meta.env.DEV) {
        console.log(`🏨 [BaselineService] Hotel calculated:`, hotelResult);
      }
      baselineCache.set(cacheKey, hotelResult);
      return hotelResult;
    }

    // Special case: Car wash uses bay count and equipment type
    if (templateKey === "car-wash" && useCaseData) {
      const carWashResult = calculateCarWashBaseline(useCaseData);
      if (import.meta.env.DEV) {
        console.log(`🚗 [BaselineService] Car Wash calculated:`, carWashResult);
      }
      baselineCache.set(cacheKey, carWashResult);
      return carWashResult;
    }

    // Special case: Warehouse uses square footage and cold storage
    if (templateKey === "warehouse" && useCaseData) {
      const warehouseResult = calculateWarehouseBaseline(useCaseData);
      if (import.meta.env.DEV) {
        console.log(`📦 [BaselineService] Warehouse calculated:`, warehouseResult);
      }
      baselineCache.set(cacheKey, warehouseResult);
      return warehouseResult;
    }

    // Special case: Manufacturing uses square footage and equipment type
    if (templateKey === "manufacturing" && useCaseData) {
      const mfgResult = calculateManufacturingBaseline(useCaseData);
      if (import.meta.env.DEV) {
        console.log(`🏭 [BaselineService] Manufacturing calculated:`, mfgResult);
      }
      baselineCache.set(cacheKey, mfgResult);
      return mfgResult;
    }

    // Special case: Airport uses terminal size and passenger volume
    if (templateKey === "airport" && useCaseData) {
      const airportResult = calculateAirportBaseline(useCaseData);
      if (import.meta.env.DEV) {
        console.log(`✈️ [BaselineService] Airport calculated:`, airportResult);
      }
      baselineCache.set(cacheKey, airportResult);
      return airportResult;
    }

    // Special case: Retail uses square footage and store type
    if (templateKey === "retail" && useCaseData) {
      const retailResult = calculateRetailBaseline(useCaseData);
      if (import.meta.env.DEV) {
        console.log(`🏪 [BaselineService] Retail calculated:`, retailResult);
      }
      baselineCache.set(cacheKey, retailResult);
      return retailResult;
    }

    // Special case: Office uses square footage and building class
    if (templateKey === "office" && useCaseData) {
      const officeResult = calculateOfficeBaseline(useCaseData);
      if (import.meta.env.DEV) {
        console.log(`🏢 [BaselineService] Office calculated:`, officeResult);
      }
      baselineCache.set(cacheKey, officeResult);
      return officeResult;
    }

    // Special case: Agriculture uses acreage-based calculation
    // Scale is already calculated as MW in the wizard, so use it directly
    if ((templateKey === "agriculture" || templateKey === "agricultural") && useCaseData) {
      // If user specified irrigation load, add it
      const irrigationKW = parseFloat(useCaseData.irrigationLoad) || 0;

      // Parse scale to number (handles both numeric and string inputs)
      const numericScale = parseScaleToNumber(scale);

      // Scale from wizard is already in MW (acreage × 0.4 kW/acre / 1000)
      // Add irrigation load if specified
      const totalPowerMW = numericScale + irrigationKW / 1000;

      // Use reasonable duration for agricultural operations (backup during irrigation season)
      const durationHrs = 4;

      if (import.meta.env.DEV) {
        console.log(`🚜 [BaselineService] Agriculture calculation:`);
        console.log(`   Scale (from acreage): ${numericScale.toFixed(3)} MW`);
        console.log(
          `   Irrigation load: ${irrigationKW} kW = ${(irrigationKW / 1000).toFixed(3)} MW`
        );
        console.log(`   Total power: ${totalPowerMW.toFixed(3)} MW`);
      }

      const agResult = {
        powerMW: Math.max(0.2, Math.round(totalPowerMW * 100) / 100), // Minimum 200 kW
        durationHrs,
        solarMW: 0, // Let user control solar preference
        description: `Agricultural baseline: ${numericScale.toFixed(2)} MW from acreage + ${(irrigationKW / 1000).toFixed(2)} MW irrigation`,
        dataSource: "Wizard (acreage × 0.4 kW/acre)",
      };

      baselineCache.set(cacheKey, agResult);
      return agResult;
    }

    // **CRITICAL FIX**: Check if user explicitly provided peak load
    // If user entered peakLoad in MW, use that value directly instead of database/fallback
    if (useCaseData && typeof useCaseData.peakLoad === "number" && useCaseData.peakLoad > 0) {
      const userPowerMW = useCaseData.peakLoad;
      const durationHrs = useCaseData.operatingHours
        ? Math.round(useCaseData.operatingHours / 5)
        : 4; // Default 4 hours
      // ✅ FIXED: Don't auto-calculate solar - let user control via wantsSolar preference
      const solarMW = 0;

      if (import.meta.env.DEV) {
        console.log(
          `👤 [BaselineService] Using user's explicit peak load input: ${userPowerMW} MW`
        );
        console.log(`👤 [BaselineService] User inputs:`, {
          peakLoad: useCaseData.peakLoad,
          facilitySize: useCaseData.facilitySize,
          operatingHours: useCaseData.operatingHours,
        });
        if (import.meta.env.DEV) {
          console.log(`👤 [BaselineService] Cache key: "${cacheKey}"`);
        }
        if (import.meta.env.DEV) {
          console.log(`👤 [BaselineService] Template: "${templateKey}", Scale: ${scale}`);
        }
      }

      const userResult = {
        powerMW: userPowerMW,
        durationHrs,
        solarMW,
        description: `User-specified peak load: ${userPowerMW} MW`,
        dataSource: "User Input (Step 2)",
      };

      // Validate sizing (user's input should always be valid since they provided it)
      const validation = validateBessSizing(userPowerMW, userPowerMW);
      if (import.meta.env.DEV) {
        console.log(
          `✅ [Validation] Using user's explicit peak load: ${userPowerMW} MW (ratio: ${validation.ratio.toFixed(2)}x)`
        );
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
        configCount: useCase?.configurations?.length || 0,
      });
    }

    if (!useCase || !useCase.configurations || useCase.configurations.length === 0) {
      console.warn(
        `⚠️ [BaselineService] No database configuration found for ${templateKey}, using fallback`
      );
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
    const defaultConfig =
      useCase.configurations.find((c) => c.is_default) || useCase.configurations[0];

    if (import.meta.env.DEV) {
      console.log(`✅ [BaselineService] Using database configuration for ${templateKey}:`, {
        config_name: defaultConfig.config_name,
        typical_load_kw: defaultConfig.typical_load_kw,
        preferred_duration_hours: defaultConfig.preferred_duration_hours,
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
    const referenceMatch = defaultConfig.config_name?.match(
      /\((\d+)\s+(rooms|beds|sqft|chargers|bays)\)/i
    );

    if (referenceMatch && templateKey === "hotel") {
      // Hotel-specific: Extract reference room count
      const referenceRooms = parseInt(referenceMatch[1]); // e.g., 150
      const numericScale = parseScaleToNumber(scale);
      const actualRooms = numericScale * 100; // Convert scale back to actual rooms

      // Calculate per-room kW, then multiply by actual rooms
      const kWPerRoom = defaultConfig.typical_load_kw / referenceRooms;
      basePowerMW = (kWPerRoom * actualRooms) / 1000;

      if (import.meta.env.DEV) {
        console.log(
          `🏨 [Hotel Calculation] Reference: ${referenceRooms} rooms @ ${defaultConfig.typical_load_kw} kW = ${kWPerRoom.toFixed(2)} kW/room`
        );
        console.log(
          `🏨 [Hotel Calculation] Actual: ${actualRooms} rooms × ${kWPerRoom.toFixed(2)} kW/room = ${basePowerMW.toFixed(3)} MW`
        );
      }
    } else {
      // Fallback to simple scale multiplication for other use cases
      // SPECIAL CASE: For datacenters, scale represents total MW capacity directly
      if (templateKey === "datacenter" || templateKey === "data-center") {
        const numericScale = parseScaleToNumber(scale);
        basePowerMW = numericScale; // Use scale directly as the datacenter capacity in MW
        if (import.meta.env.DEV) {
          console.log(
            `🖥️ [Data Center Calculation] Direct capacity: ${numericScale} MW (scale = capacity)`
          );
        }
      } else {
        // Parse scale to handle both numeric and string values (e.g., "50,000 - 100,000 sq ft")
        const numericScale = parseScaleToNumber(scale);
        basePowerMW = (defaultConfig.typical_load_kw / 1000) * numericScale;
        if (import.meta.env.DEV) {
          console.log(
            `📊 [Generic Calculation] ${defaultConfig.typical_load_kw} kW × ${numericScale.toFixed(2)} scale (from: ${scale}) = ${basePowerMW.toFixed(3)} MW`
          );
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
        console.warn("[baselineService] Could not fetch custom questions from DB:", error);
      }

      if (customQuestions.length > 0) {
        let amenityLoadKW = 0;

        for (const question of customQuestions) {
          // DB uses 'additionalLoad' for power add impacts
          if (question.impact_type !== "additionalLoad") continue;

          // Use question_key (DB column) to look up user value
          const userValue = useCaseData[question.question_key];
          if (!userValue) continue;

          // Handle select questions with powerKw in select_options
          if (question.question_type === "select" && question.select_options) {
            const options = Array.isArray(question.select_options) ? question.select_options : [];
            const selectedOption = options.find(
              (opt: any) => typeof opt === "object" && opt.value === userValue
            );
            if (
              selectedOption &&
              typeof selectedOption === "object" &&
              "powerKw" in selectedOption
            ) {
              amenityLoadKW += (selectedOption as any).powerKw;
              if (import.meta.env.DEV) {
                console.log(
                  `  ➕ ${question.question_key}: +${(selectedOption as any).powerKw} kW (${userValue})`
                );
              }
            }
          }

          // Handle number inputs - check impact_calculation for additional load value
          if (question.question_type === "number" && typeof userValue === "number") {
            const impactCalc = question.impact_calculation as any;
            const additionalLoadKw = impactCalc?.additionalLoadKw || impactCalc?.powerKw || 0;
            if (additionalLoadKw > 0) {
              const calculatedLoad = userValue * additionalLoadKw;
              amenityLoadKW += calculatedLoad;
              if (import.meta.env.DEV) {
                console.log(
                  `  ➕ ${question.question_key}: +${calculatedLoad} kW (${userValue} × ${additionalLoadKw} kW)`
                );
              }
            }
          }
        }

        if (amenityLoadKW > 0) {
          const amenityLoadMW = amenityLoadKW / 1000;
          powerMW += amenityLoadMW;
          if (import.meta.env.DEV) {
            console.log(
              `✨ [Amenities] Total additional load: ${amenityLoadKW} kW (${amenityLoadMW.toFixed(2)} MW)`
            );
            console.log(`📊 [Final Power] Base + Amenities: ${powerMW.toFixed(2)} MW`);
          }
        }
      }
    }
    if (import.meta.env.DEV) {
      console.log(`📊 [Power Calculation] Final: ${powerMW.toFixed(3)} MW`);
    }

    // Use preferred duration from configuration
    const durationHrs = Math.max(
      2,
      Math.round((defaultConfig.preferred_duration_hours || 4) * 2) / 2
    );

    // ✅ FIXED: Don't auto-calculate solar - let user control via wantsSolar preference
    // Solar should be 0 by default; SmartWizard will set it based on user's answers
    const solarMW = 0;

    const result = {
      powerMW,
      durationHrs,
      solarMW,
      description: `Database configuration: ${defaultConfig.config_name}`,
      dataSource: "Supabase use_case_configurations",
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
          console.log(
            `✅ [Validation] BESS sizing OK: ${powerMW} MW is ${validation.ratio.toFixed(2)}x user's peak load (${useCaseData.peakLoad} MW)`
          );
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
function calculateDatacenterBaseline(
  useCaseData: Record<string, any>,
  scale: number | string
): BaselineCalculationResult {
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
        powerPerRack: powerPerRack + " kW",
        itLoadMW: itLoadMW.toFixed(3) + " MW",
        pue,
        totalCapacity: capacity.toFixed(3) + " MW (IT + cooling)",
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
  const squareFootage =
    parseFloat(useCaseData.squareFootage) || parseFloat(useCaseData.facilitySize) || 0;
  if (!capacity && squareFootage > 0) {
    capacity = (squareFootage * 150) / 1000000; // 150 W/sq ft standard
    if (import.meta.env.DEV) {
      console.log(
        `🖥️ [Data Center] Calculated ${capacity.toFixed(3)} MW from ${squareFootage} sq ft`
      );
    }
  }

  // Priority 4: Use scale parameter (from wizard)
  const numericScale = parseScaleToNumber(scale);
  if (!capacity && numericScale > 0) {
    capacity = numericScale;
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
  const tierClass = useCaseData.tierClassification || "tier_3";
  const tier = tierClass.replace("_", ""); // Convert tier_3 to tier3

  // ✅ USE SSOT: Get tier standards from useCasePowerCalculations.ts
  const tierKey = tier as keyof typeof DATACENTER_TIER_STANDARDS;
  const tierStandards = DATACENTER_TIER_STANDARDS[tierKey] || DATACENTER_TIER_STANDARDS.tier3;

  const bessMultiplier = tierStandards.bessMultiplier;
  const duration = tierStandards.durationHours;
  const description = tierStandards.name;

  const powerMW = Math.max(0.5, Math.round(capacity * bessMultiplier * 100) / 100);

  if (import.meta.env.DEV) {
    console.log(`🔋 [Data Center BESS] ${description}:`, {
      facilityCapacity: capacity.toFixed(3) + " MW",
      bessMultiplier: bessMultiplier * 100 + "%",
      bessSize: powerMW.toFixed(3) + " MW",
      duration: duration + " hours",
    });
  }

  // ✅ FIXED: Don't auto-calculate solar - let user control via wantsSolar preference
  const solarMW = 0;

  return {
    powerMW,
    durationHrs: duration,
    solarMW,
    description: `${description}: ${capacity.toFixed(1)}MW facility → ${powerMW.toFixed(1)}MW BESS`,
    dataSource: "Calculated from rack count and tier classification",
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
  uptimeRequirement: string = "tier3",
  gridConnection: string = "single",
  config?: any
): { powerMW: number; durationHours: number; description: string } {
  // Default multipliers (fallback if not in database)
  const defaultMultipliers = {
    tier3: { power: 0.5, duration: 4 }, // Aligned to V7 industryCatalog data_center=4h
    tier4: { power: 0.7, duration: 4 }, // Aligned to V7 hospital ratio=0.7, 4h
    microgrid: { power: 0.8, duration: 6 },
    limited: { power: 0.8, duration: 6 },
  };

  // Try to get multipliers from database config
  let multipliers = defaultMultipliers;
  if (config?.load_profile_data?.datacenter_multipliers) {
    multipliers = { ...defaultMultipliers, ...config.load_profile_data.datacenter_multipliers };
    if (import.meta.env.DEV) {
      console.log("🖥️ [Datacenter] Using database multipliers:", multipliers);
    }
  } else if (import.meta.env.DEV) {
    console.log("🖥️ [Datacenter] Using default multipliers (not found in database)");
  }

  // Determine sizing based on grid connection and tier
  let powerMultiplier: number;
  let duration: number;
  let description: string;

  if (gridConnection === "microgrid" || gridConnection === "limited") {
    const config = multipliers.microgrid || multipliers.limited;
    powerMultiplier = config.power;
    duration = config.duration;
    description = `Microgrid/Limited Grid: ${(powerMultiplier * 100).toFixed(0)}% capacity, ${duration}hr backup`;
  } else if (uptimeRequirement === "tier4") {
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
    console.log(
      `🖥️ [Datacenter Sizing] ${capacity}MW × ${powerMultiplier} = ${powerMW}MW / ${duration}hr`
    );
  }

  return {
    powerMW: Math.round(powerMW * 100) / 100, // Round to 0.01 MW
    durationHours: duration,
    description,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// USE CASE SPECIFIC CALCULATION FUNCTIONS
// Each function takes useCaseData and returns BaselineCalculationResult
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate hospital baseline from bed count and facility type
 *
 * Power demand reference (ASHRAE/Healthcare):
 * - Small clinic: 50-100 kW (< 25 beds)
 * - Community hospital: 500-2000 kW (25-200 beds)
 * - Regional hospital: 2-5 MW (200-500 beds)
 * - Major medical center: 5-15 MW (500+ beds)
 *
 * Power per bed: 8-15 kW depending on facility type
 */
function calculateHospitalBaseline(useCaseData: Record<string, any>): BaselineCalculationResult {
  // Priority 1: Direct peakDemandKW from presets
  const directPeakKW = parseFloat(useCaseData.peakDemandKW) || 0;
  if (directPeakKW > 0) {
    const powerMW = directPeakKW / 1000;
    return {
      powerMW: Math.max(0.1, Math.round(powerMW * 100) / 100),
      durationHrs: 8, // Critical facilities need longer backup
      solarMW: 0,
      peakDemandMW: powerMW,
      description: `Hospital: ${directPeakKW.toLocaleString()} kW peak demand (preset)`,
      dataSource: "Direct input from hospital preset",
    };
  }

  // Priority 2: Calculate from bed count
  const bedCount =
    parseInt(useCaseData.bedCount || useCaseData.beds || useCaseData.numberOfBeds) || 0;
  const hospitalType =
    useCaseData.facilitySubtype ||
    useCaseData.hospitalType ||
    useCaseData.facilityType ||
    "community";

  // kW per bed varies by facility type
  const kWPerBed: Record<string, number> = {
    clinic: 4, // Outpatient only
    community: 8, // Standard inpatient
    regional: 10, // More specialized equipment
    teaching: 12, // Research + treatment
    major: 15, // Full service + research
    trauma: 15, // High intensity care
  };

  const perBed = kWPerBed[hospitalType] || 10;
  let calculatedKW = bedCount > 0 ? bedCount * perBed : 0;
  let calcMethod = bedCount > 0 ? `${bedCount} beds × ${perBed} kW/bed` : "";

  // Priority 3: Square footage fallback
  if (calculatedKW === 0) {
    const sqFt =
      parseInt(useCaseData.totalSqFt || useCaseData.squareFootage || useCaseData.facilitySize) || 0;
    if (sqFt > 0) {
      calculatedKW = sqFt * 0.025; // 25 W/sqft for hospitals (higher than office)
      calcMethod = `${sqFt.toLocaleString()} sqft × 25 W/sqft`;
    }
  }

  // Add modifiers for special departments
  if (
    (useCaseData.icuBeds && parseInt(useCaseData.icuBeds) > 0) ||
    useCaseData.hasICU === "true" ||
    (useCaseData.icuBeds && parseInt(useCaseData.icuBeds) > 0) ||
    useCaseData.hasICU === true
  ) {
    calculatedKW += calculatedKW * 0.15; // +15% for ICU
    calcMethod += " +15% ICU";
  }
  if (
    (useCaseData.operatingRooms && parseInt(useCaseData.operatingRooms) > 0) ||
    useCaseData.hasOR === "true" ||
    (useCaseData.operatingRooms && parseInt(useCaseData.operatingRooms) > 0) ||
    useCaseData.hasOR === true ||
    useCaseData.hasSurgery === "true"
  ) {
    calculatedKW += calculatedKW * 0.1; // +10% for operating rooms
    calcMethod += " +10% OR";
  }
  if (
    (useCaseData.imagingEquipment && useCaseData.imagingEquipment !== "none") ||
    useCaseData.hasImagingCenter === "true" ||
    (useCaseData.imagingEquipment && useCaseData.imagingEquipment !== "none") ||
    useCaseData.hasImagingCenter === true
  ) {
    calculatedKW += 300; // MRI, CT scanners
    calcMethod += " +300kW imaging";
  }

  const finalKW = calculatedKW > 0 ? calculatedKW : 1000; // 1 MW minimum for hospitals
  const powerMW = Math.max(0.5, Math.round((finalKW / 1000) * 100) / 100);

  if (import.meta.env.DEV) {
    console.log(`🏥 [Hospital Calculation]:`, {
      bedCount,
      hospitalType,
      calculatedKW,
      finalKW,
      powerMW,
      method: calcMethod,
    });
  }

  return {
    powerMW,
    durationHrs: 8, // Hospitals need longer backup for critical care
    solarMW: 0,
    peakDemandMW: powerMW,
    description: `Hospital: ${calcMethod || "Estimated"} → ${powerMW} MW`,
    dataSource: "Calculated from hospital characteristics",
  };
}

/**
 * Calculate hotel baseline from room count and amenities
 *
 * Power demand reference (ASHRAE/Hospitality):
 * - Budget motel: 0.5-1.5 kW/room
 * - Midscale hotel: 1.5-3 kW/room
 * - Upscale hotel: 3-5 kW/room
 * - Luxury resort: 5-10 kW/room
 */
function calculateHotelBaseline(
  useCaseData: Record<string, any>,
  scale?: string
): BaselineCalculationResult {
  // Priority 1: Direct peakDemandKW or gridConnectionKW
  const directPeakKW = parseFloat(useCaseData.peakDemandKW || useCaseData.gridConnectionKW) || 0;
  if (directPeakKW > 0) {
    const powerMW = directPeakKW / 1000;
    return {
      powerMW: Math.max(0.1, Math.round(powerMW * 100) / 100),
      durationHrs: 4,
      solarMW: 0,
      peakDemandMW: powerMW,
      description: `Hotel: ${directPeakKW.toLocaleString()} kW peak demand (direct input)`,
      dataSource: "Direct input from hotel configuration",
    };
  }

  // Priority 2: Calculate from hotel category and amenities
  const hotelCategory = useCaseData.hotelCategory || "midscale";
  const amenities = useCaseData.amenities || [];
  const foodBeverage = useCaseData.foodBeverage || [];
  const meetingSpace = useCaseData.meetingSpace || "none";
  const laundryOperations = useCaseData.laundryOperations || "none";
  const parking = useCaseData.parking || "surface";
  const guestServices = useCaseData.guestServices || [];

  // Base load by hotel category (kW)
  const categoryBaseLoad: Record<string, number> = {
    "1-star": 75,
    "2-star": 100,
    "3-star": 175,
    "4-star": 300,
    "5-star": 500,
    boutique: 200,
    resort: 600,
    "extended-stay": 150,
    budget: 75,
    economy: 100,
    midscale: 175,
    upscale: 300,
    luxury: 500,
  };

  let calculatedKW = categoryBaseLoad[hotelCategory] || 175;
  const calcDetails: string[] = [`Base (${hotelCategory}): ${calculatedKW}kW`];

  // Add amenities load
  const amenityLoads: Record<string, number> = {
    outdoor_pool: 30,
    indoor_pool: 75,
    fitness_small: 15,
    fitness_large: 40,
    spa: 60,
    business_center: 10,
    guest_laundry: 20,
    ev_charging: 50,
  };

  if (Array.isArray(amenities)) {
    amenities.forEach((amenity: string) => {
      const load = amenityLoads[amenity] || 0;
      if (load > 0) {
        calculatedKW += load;
        calcDetails.push(`+${amenity}: ${load}kW`);
      }
    });
  }

  // Add food & beverage load
  const fbLoads: Record<string, number> = {
    breakfast: 25,
    coffee_shop: 15,
    casual_dining: 75,
    fine_dining: 100,
    bar_lounge: 30,
    room_service: 40,
    banquet: 120,
  };

  if (Array.isArray(foodBeverage)) {
    foodBeverage.forEach((fb: string) => {
      const load = fbLoads[fb] || 0;
      if (load > 0) {
        calculatedKW += load;
        calcDetails.push(`+${fb}: ${load}kW`);
      }
    });
  }

  // Add meeting space load
  const meetingLoads: Record<string, number> = {
    small: 25,
    medium: 75,
    large: 150,
    convention: 300,
    none: 0,
  };
  calculatedKW += meetingLoads[meetingSpace] || 0;
  if (meetingLoads[meetingSpace] > 0) {
    calcDetails.push(`+meeting (${meetingSpace}): ${meetingLoads[meetingSpace]}kW`);
  }

  // Add laundry load
  const laundryLoads: Record<string, number> = {
    commercial: 100,
    guest_laundry: 20,
    outsourced: 0,
    none: 0,
  };
  calculatedKW += laundryLoads[laundryOperations] || 0;
  if (laundryLoads[laundryOperations] > 0) {
    calcDetails.push(`+laundry (${laundryOperations}): ${laundryLoads[laundryOperations]}kW`);
  }

  // Add parking load (for EV charging potential)
  const parkingLoads: Record<string, number> = {
    garage: 30,
    covered: 20,
    surface: 10,
    valet: 5,
    none: 0,
  };
  calculatedKW += parkingLoads[parking] || 0;

  // Add guest services load
  const serviceLoads: Record<string, number> = {
    concierge: 5,
    valet: 5,
    bellhop: 5,
    shuttle: 15,
    rental_car: 10,
  };

  if (Array.isArray(guestServices)) {
    guestServices.forEach((service: string) => {
      const load = serviceLoads[service] || 0;
      if (load > 0) {
        calculatedKW += load;
      }
    });
  }

  const powerMW = Math.max(0.1, Math.round((calculatedKW / 1000) * 100) / 100);

  if (import.meta.env.DEV) {
    console.log("🏨 [Hotel Calculation]:", {
      hotelCategory,
      amenities,
      foodBeverage,
      meetingSpace,
      calculatedKW,
      powerMW,
      details: calcDetails.join(", "),
    });
  }

  return {
    powerMW,
    durationHrs: 4,
    solarMW: 0,
    peakDemandMW: powerMW,
    description: `Hotel (${hotelCategory}): ${calculatedKW.toLocaleString()} kW - ${calcDetails.slice(0, 3).join(", ")}`,
    dataSource: "Calculated from hotel category and amenities",
  };
}

/**
 * Calculate car wash baseline from bay count and equipment type
 *
 * Power demand reference (Industry):
 * - Self-service bay: 8-12 kW
 * - Automatic in-bay: 30-50 kW
 * - Tunnel entrance: 50-75 kW per unit
 * - Full service with drying: 75-100 kW
 */
function calculateCarWashBaseline(useCaseData: Record<string, any>): BaselineCalculationResult {
  // Priority 1: Direct peakDemandKW from presets
  const directPeakKW = parseFloat(useCaseData.peakDemandKW) || 0;
  if (directPeakKW > 0) {
    const powerMW = directPeakKW / 1000;
    return {
      powerMW: Math.max(0.05, Math.round(powerMW * 1000) / 1000),
      durationHrs: 4,
      solarMW: 0,
      peakDemandMW: powerMW,
      description: `Car Wash: ${directPeakKW.toLocaleString()} kW peak demand (preset)`,
      dataSource: "Direct input from car wash preset",
    };
  }

  // Priority 2: Calculate from bay count
  const bayCount =
    parseInt(
      useCaseData.washBays || useCaseData.bayCount || useCaseData.bays || useCaseData.numberOfBays
    ) || 0;
  const washType =
    useCaseData.facilitySubtype || useCaseData.washType || useCaseData.carWashType || "automatic";

  const kWPerBay: Record<string, number> = {
    "self-service": 10,
    automatic: 40,
    "in-bay": 40,
    tunnel: 60,
    express: 50,
    "full-service": 80,
  };

  const perBay = kWPerBay[washType] || 40;
  let calculatedKW = bayCount > 0 ? bayCount * perBay : 0;
  let calcMethod = bayCount > 0 ? `${bayCount} bays × ${perBay} kW/bay (${washType})` : "";

  // Add extras
  if (useCaseData.hasVacuums === "true" || useCaseData.hasVacuums === true) {
    const vacuumCount =
      parseInt(useCaseData.vacuumStations || useCaseData.vacuumCount) || bayCount * 2;
    calculatedKW += vacuumCount * 3; // 3 kW per vacuum station
    calcMethod += ` +${vacuumCount * 3}kW vacuums`;
  }
  if (useCaseData.hasDetailCenter === "true" || useCaseData.hasDetailCenter === true) {
    calculatedKW += 20; // Detail equipment
    calcMethod += " +20kW detail";
  }
  if (useCaseData.hasWaterReclaim === "true" || useCaseData.hasWaterReclaim === true) {
    calculatedKW += 15; // Reclaim pumps
    calcMethod += " +15kW reclaim";
  }

  const finalKW = calculatedKW > 0 ? calculatedKW : 50; // Minimum
  const powerMW = Math.max(0.03, Math.round((finalKW / 1000) * 1000) / 1000);

  if (import.meta.env.DEV) {
    console.log(`🚗 [Car Wash Calculation]:`, {
      bayCount,
      washType,
      calculatedKW,
      finalKW,
      powerMW,
      method: calcMethod,
    });
  }

  return {
    powerMW,
    durationHrs: 4,
    solarMW: 0,
    peakDemandMW: powerMW,
    description: `Car Wash: ${calcMethod || "Estimated"} → ${(powerMW * 1000).toFixed(0)} kW`,
    dataSource: "Calculated from car wash characteristics",
  };
}

/**
 * Calculate warehouse baseline from square footage and operations
 *
 * Power demand reference (ASHRAE/Industrial):
 * - Basic storage: 3-5 W/sqft
 * - Distribution center: 5-8 W/sqft
 * - Cold storage: 15-25 W/sqft
 * - High-automation: 8-15 W/sqft
 */
function calculateWarehouseBaseline(useCaseData: Record<string, any>): BaselineCalculationResult {
  // Priority 1: Direct peakDemandKW from presets
  const directPeakKW = parseFloat(useCaseData.peakDemandKW) || 0;
  if (directPeakKW > 0) {
    const powerMW = directPeakKW / 1000;
    return {
      powerMW: Math.max(0.1, Math.round(powerMW * 100) / 100),
      durationHrs: 4,
      solarMW: 0,
      peakDemandMW: powerMW,
      description: `Warehouse: ${directPeakKW.toLocaleString()} kW peak demand (preset)`,
      dataSource: "Direct input from warehouse preset",
    };
  }

  // Priority 2: Calculate from square footage
  const sqFt =
    parseInt(
      useCaseData.warehouseSqFt ||
        useCaseData.squareFootage ||
        useCaseData.totalSqFt ||
        useCaseData.facilitySize
    ) || 0;
  const warehouseType = useCaseData.warehouseType || useCaseData.facilityType || "distribution";

  const wattsPerSqFt: Record<string, number> = {
    storage: 4,
    distribution: 6,
    fulfillment: 8,
    "cold-storage": 20,
    refrigerated: 20,
    "high-automation": 12,
    "e-commerce": 10,
  };

  const perSqFt = wattsPerSqFt[warehouseType] || 6;
  let calculatedKW = sqFt > 0 ? (sqFt * perSqFt) / 1000 : 0;
  let calcMethod =
    sqFt > 0 ? `${sqFt.toLocaleString()} sqft × ${perSqFt} W/sqft (${warehouseType})` : "";

  // Add equipment
  if (useCaseData.hasForkliftCharging === "true" || useCaseData.hasForkliftCharging === true) {
    const forkliftCount = parseInt(useCaseData.forkliftCount) || Math.ceil(sqFt / 50000);
    calculatedKW += forkliftCount * 15; // 15 kW per charger
    calcMethod += ` +${forkliftCount * 15}kW forklifts`;
  }
  if (useCaseData.hasDockDoors === "true" || useCaseData.hasDockDoors === true) {
    const dockCount =
      parseInt(useCaseData.dockDoors || useCaseData.dockDoorCount) || Math.ceil(sqFt / 25000);
    calculatedKW += dockCount * 3; // Dock levelers, lights
    calcMethod += ` +${dockCount * 3}kW docks`;
  }
  if (useCaseData.hasConveyors === "true" || useCaseData.hasConveyors === true) {
    calculatedKW += calculatedKW * 0.2; // +20% for conveyor systems
    calcMethod += " +20% conveyors";
  }

  const finalKW = calculatedKW > 0 ? calculatedKW : 300; // Minimum
  const powerMW = Math.max(0.1, Math.round((finalKW / 1000) * 100) / 100);

  if (import.meta.env.DEV) {
    console.log(`📦 [Warehouse Calculation]:`, {
      sqFt,
      warehouseType,
      calculatedKW,
      finalKW,
      powerMW,
      method: calcMethod,
    });
  }

  return {
    powerMW,
    durationHrs: 4,
    solarMW: 0,
    peakDemandMW: powerMW,
    description: `Warehouse: ${calcMethod || "Estimated"} → ${powerMW} MW`,
    dataSource: "Calculated from warehouse characteristics",
  };
}

/**
 * Calculate manufacturing baseline from square footage and production type
 *
 * Power demand reference (ASHRAE/Industrial):
 * - Light assembly: 10-20 W/sqft
 * - Heavy manufacturing: 30-50 W/sqft
 * - Process industry: 50-100+ W/sqft
 * - Clean room/semiconductor: 100-200 W/sqft
 */
function calculateManufacturingBaseline(
  useCaseData: Record<string, any>
): BaselineCalculationResult {
  // Priority 1: Direct peakDemandKW from presets
  const directPeakKW = parseFloat(useCaseData.peakDemandKW) || 0;
  if (directPeakKW > 0) {
    const powerMW = directPeakKW / 1000;
    return {
      powerMW: Math.max(0.2, Math.round(powerMW * 100) / 100),
      durationHrs: 4,
      solarMW: 0,
      peakDemandMW: powerMW,
      description: `Manufacturing: ${directPeakKW.toLocaleString()} kW peak demand (preset)`,
      dataSource: "Direct input from manufacturing preset",
    };
  }

  // Priority 2: Calculate from square footage
  const sqFt =
    parseInt(
      useCaseData.warehouseSqFt ||
        useCaseData.squareFootage ||
        useCaseData.totalSqFt ||
        useCaseData.facilitySize
    ) || 0;
  const mfgType =
    useCaseData.manufacturingType ||
    useCaseData.facilityType ||
    useCaseData.industryType ||
    "general";

  const wattsPerSqFt: Record<string, number> = {
    "light-assembly": 15,
    assembly: 15,
    general: 25,
    heavy: 40,
    process: 60,
    pharmaceutical: 50,
    "food-processing": 35,
    "clean-room": 120,
    semiconductor: 150,
    automotive: 45,
  };

  const perSqFt = wattsPerSqFt[mfgType] || 25;
  let calculatedKW = sqFt > 0 ? (sqFt * perSqFt) / 1000 : 0;
  let calcMethod = sqFt > 0 ? `${sqFt.toLocaleString()} sqft × ${perSqFt} W/sqft (${mfgType})` : "";

  // Add for production capacity
  const shifts = parseInt(useCaseData.operatingShifts || useCaseData.shifts) || 1;
  if (shifts > 1) {
    calcMethod += ` (${shifts} shifts)`;
  }

  // Add equipment modifiers
  if (useCaseData.hasCompressedAir === "true" || useCaseData.hasCompressedAir === true) {
    calculatedKW += calculatedKW * 0.15; // +15% for compressors
    calcMethod += " +15% compressed air";
  }
  if (useCaseData.hasCNCMachines === "true" || useCaseData.hasCNCMachines === true) {
    const cncCount = parseInt(useCaseData.cncCount) || 5;
    calculatedKW += cncCount * 25; // 25 kW average per CNC
    calcMethod += ` +${cncCount * 25}kW CNC`;
  }
  if (useCaseData.hasWelding === "true" || useCaseData.hasWelding === true) {
    calculatedKW += calculatedKW * 0.2; // +20% for welding
    calcMethod += " +20% welding";
  }

  const finalKW = calculatedKW > 0 ? calculatedKW : 500; // Minimum for manufacturing
  const powerMW = Math.max(0.2, Math.round((finalKW / 1000) * 100) / 100);

  if (import.meta.env.DEV) {
    console.log(`🏭 [Manufacturing Calculation]:`, {
      sqFt,
      mfgType,
      calculatedKW,
      finalKW,
      powerMW,
      method: calcMethod,
    });
  }

  return {
    powerMW,
    durationHrs: 4,
    solarMW: 0,
    peakDemandMW: powerMW,
    description: `Manufacturing: ${calcMethod || "Estimated"} → ${powerMW} MW`,
    dataSource: "Calculated from manufacturing characteristics",
  };
}

/**
 * Calculate airport baseline from terminal size and operations
 *
 * Power demand reference (FAA/ASHRAE):
 * - Small regional: 2-5 MW
 * - Medium commercial: 10-30 MW
 * - Large hub: 50-150 MW
 * - Major international: 150-300+ MW
 */
function calculateAirportBaseline(useCaseData: Record<string, any>): BaselineCalculationResult {
  // Priority 1: Direct peakDemandKW from presets
  const directPeakKW = parseFloat(useCaseData.peakDemandKW) || 0;
  if (directPeakKW > 0) {
    const powerMW = directPeakKW / 1000;
    return {
      powerMW: Math.max(1, Math.round(powerMW * 100) / 100),
      durationHrs: 8, // Critical infrastructure
      solarMW: 0,
      peakDemandMW: powerMW,
      description: `Airport: ${directPeakKW.toLocaleString()} kW peak demand (preset)`,
      dataSource: "Direct input from airport preset",
    };
  }

  // Priority 2: Calculate from annual passengers
  const passengers = parseInt(useCaseData.annualPassengers || useCaseData.passengerCount) || 0;
  const terminalSqFt =
    parseInt(useCaseData.terminalSqFt || useCaseData.terminalSize || useCaseData.squareFootage) ||
    0;

  let calculatedKW = 0;
  let calcMethod = "";

  // Calculate from passengers (roughly 0.5-1 W per annual passenger)
  if (passengers > 0) {
    calculatedKW = passengers * 0.0008; // 0.8 W per annual passenger
    calcMethod = `${(passengers / 1000000).toFixed(1)}M passengers × 0.8 kW/1000`;
  } else if (terminalSqFt > 0) {
    calculatedKW = (terminalSqFt * 30) / 1000; // 30 W/sqft for terminals
    calcMethod = `${terminalSqFt.toLocaleString()} sqft × 30 W/sqft`;
  }

  // Add for critical systems
  if (useCaseData.hasRunwayLighting === "true" || useCaseData.hasRunwayLighting === true) {
    calculatedKW += 500; // Runway and taxiway lighting
    calcMethod += " +500kW runway";
  }
  if (useCaseData.hasAirTrafficControl === "true" || useCaseData.hasAirTrafficControl === true) {
    calculatedKW += 200; // ATC systems
    calcMethod += " +200kW ATC";
  }
  if (useCaseData.hasJetBridges === "true" || useCaseData.hasJetBridges === true) {
    const bridges = parseInt(useCaseData.gateCount || useCaseData.jetBridgeCount) || 10;
    calculatedKW += bridges * 25; // 25 kW per jet bridge
    calcMethod += ` +${bridges * 25}kW bridges`;
  }

  const finalKW = calculatedKW > 0 ? calculatedKW : 5000; // 5 MW minimum for any airport
  const powerMW = Math.max(2, Math.round((finalKW / 1000) * 100) / 100);

  if (import.meta.env.DEV) {
    console.log(`✈️ [Airport Calculation]:`, {
      passengers,
      terminalSqFt,
      calculatedKW,
      finalKW,
      powerMW,
      method: calcMethod,
    });
  }

  return {
    powerMW,
    durationHrs: 8, // Critical infrastructure needs longer backup
    solarMW: 0,
    peakDemandMW: powerMW,
    description: `Airport: ${calcMethod || "Estimated"} → ${powerMW} MW`,
    dataSource: "Calculated from airport characteristics",
  };
}

/**
 * Calculate retail baseline from square footage and store type
 *
 * Power demand reference (ASHRAE/CBECS):
 * - Small retail: 15-25 W/sqft
 * - Grocery store: 40-60 W/sqft (refrigeration)
 * - Department store: 20-30 W/sqft
 * - Shopping mall: 25-35 W/sqft
 */
function calculateRetailBaseline(useCaseData: Record<string, any>): BaselineCalculationResult {
  // Priority 1: Direct peakDemandKW from presets
  const directPeakKW = parseFloat(useCaseData.peakDemandKW) || 0;
  if (directPeakKW > 0) {
    const powerMW = directPeakKW / 1000;
    return {
      powerMW: Math.max(0.05, Math.round(powerMW * 1000) / 1000),
      durationHrs: 4,
      solarMW: 0,
      peakDemandMW: powerMW,
      description: `Retail: ${directPeakKW.toLocaleString()} kW peak demand (preset)`,
      dataSource: "Direct input from retail preset",
    };
  }

  // Priority 2: Calculate from square footage
  const sqFt =
    parseInt(
      useCaseData.warehouseSqFt ||
        useCaseData.squareFootage ||
        useCaseData.totalSqFt ||
        useCaseData.storeSize
    ) || 0;
  const retailType = useCaseData.retailType || useCaseData.storeType || "general";

  const wattsPerSqFt: Record<string, number> = {
    convenience: 30,
    general: 20,
    specialty: 22,
    grocery: 50,
    supermarket: 50,
    department: 25,
    "big-box": 22,
    mall: 30,
    "strip-mall": 25,
  };

  const perSqFt = wattsPerSqFt[retailType] || 22;
  let calculatedKW = sqFt > 0 ? (sqFt * perSqFt) / 1000 : 0;
  let calcMethod =
    sqFt > 0 ? `${sqFt.toLocaleString()} sqft × ${perSqFt} W/sqft (${retailType})` : "";

  // Add extras
  if (useCaseData.hasRefrigeration === "true" || useCaseData.hasRefrigeration === true) {
    calculatedKW += calculatedKW * 0.3; // +30% for refrigeration
    calcMethod += " +30% refrigeration";
  }
  if (useCaseData.hasKitchen === "true" || useCaseData.hasKitchen === true) {
    calculatedKW += 50; // Food prep
    calcMethod += " +50kW kitchen";
  }
  if (useCaseData.hasSignage === "true" || useCaseData.hasSignage === true) {
    calculatedKW += 25; // Digital signage, displays
    calcMethod += " +25kW signage";
  }

  const finalKW = calculatedKW > 0 ? calculatedKW : 100; // Minimum
  const powerMW = Math.max(0.05, Math.round((finalKW / 1000) * 1000) / 1000);

  if (import.meta.env.DEV) {
    console.log(`🏪 [Retail Calculation]:`, {
      sqFt,
      retailType,
      calculatedKW,
      finalKW,
      powerMW,
      method: calcMethod,
    });
  }

  return {
    powerMW,
    durationHrs: 4,
    solarMW: 0,
    peakDemandMW: powerMW,
    description: `Retail: ${calcMethod || "Estimated"} → ${(powerMW * 1000).toFixed(0)} kW`,
    dataSource: "Calculated from retail characteristics",
  };
}

/**
 * Calculate office baseline from square footage and building class
 *
 * Power demand reference (ASHRAE/CBECS):
 * - Class C: 12-18 W/sqft
 * - Class B: 15-22 W/sqft
 * - Class A: 20-30 W/sqft
 * - High-tech: 25-40 W/sqft
 */
function calculateOfficeBaseline(useCaseData: Record<string, any>): BaselineCalculationResult {
  // Priority 1: Direct peakDemandKW from presets
  const directPeakKW = parseFloat(useCaseData.peakDemandKW) || 0;
  if (directPeakKW > 0) {
    const powerMW = directPeakKW / 1000;
    return {
      powerMW: Math.max(0.1, Math.round(powerMW * 100) / 100),
      durationHrs: 4,
      solarMW: 0,
      peakDemandMW: powerMW,
      description: `Office: ${directPeakKW.toLocaleString()} kW peak demand (preset)`,
      dataSource: "Direct input from office preset",
    };
  }

  // Priority 2: Calculate from square footage
  // Check multiple possible field names from DB and legacy
  const sqFt =
    parseInt(
      useCaseData.squareFeet ||
        useCaseData.warehouseSqFt ||
        useCaseData.squareFootage ||
        useCaseData.totalSqFt ||
        useCaseData.facilitySize
    ) || 0;
  // Building class can be 'class_a', 'class_b', 'class_c' from DB, or 'A', 'B', 'C' from legacy
  const rawBuildingClass =
    useCaseData.facilitySubtype || useCaseData.buildingClass || useCaseData.officeType || "class_b";
  // Normalize: 'class_a' → 'A', 'class_b' → 'B', etc.
  const buildingClass = rawBuildingClass.replace("class_", "").toUpperCase();

  const wattsPerSqFt: Record<string, number> = {
    C: 15,
    B: 18,
    A: 25,
    PREMIUM: 30,
    "HIGH-TECH": 35,
    "MIXED-USE": 20,
  };

  const perSqFt = wattsPerSqFt[buildingClass] || 18;
  let calculatedKW = sqFt > 0 ? (sqFt * perSqFt) / 1000 : 0;
  let calcMethod =
    sqFt > 0 ? `${sqFt.toLocaleString()} sqft × ${perSqFt} W/sqft (Class ${buildingClass})` : "";

  // Add for features - check DB field names
  if (
    useCaseData.hasServerRoom === "true" ||
    useCaseData.hasServerRoom === true ||
    useCaseData.hasDataRoom === "true" ||
    useCaseData.hasDataRoom === true
  ) {
    calculatedKW += 100; // Server room
    calcMethod += " +100kW server room";
  }
  if (useCaseData.hasGym === "true" || useCaseData.hasGym === true) {
    calculatedKW += 30; // Fitness equipment
    calcMethod += " +30kW gym";
  }
  if (useCaseData.hasCafeteria === "true" || useCaseData.hasCafeteria === true) {
    calculatedKW += 75; // Commercial kitchen
    calcMethod += " +75kW cafeteria";
  }
  if (
    useCaseData.wantsEVCharging === true ||
    useCaseData.wantsEVCharging === "true" ||
    useCaseData.hasEVCharging === "true" ||
    useCaseData.hasEVCharging === true
  ) {
    const existingChargers = parseInt(useCaseData.existingEVChargers) || 0;
    const wantsMore =
      useCaseData.wantsMoreEVCharging === true || useCaseData.wantsMoreEVCharging === "true";
    const chargers = wantsMore ? Math.max(4, existingChargers + 4) : Math.max(4, existingChargers);
    calculatedKW += chargers * 7; // L2 chargers
    calcMethod += ` +${chargers * 7}kW EV`;
  }

  // Add for elevators
  if (useCaseData.elevatorCount) {
    const elevators = parseInt(useCaseData.elevatorCount) || 0;
    if (elevators > 0) {
      calculatedKW += elevators * 15; // ~15 kW per elevator
      calcMethod += ` +${elevators * 15}kW elevators`;
    }
  }

  const finalKW = calculatedKW > 0 ? calculatedKW : 200; // Minimum
  const powerMW = Math.max(0.1, Math.round((finalKW / 1000) * 100) / 100);

  if (import.meta.env.DEV) {
    console.log(`🏢 [Office Calculation]:`, {
      sqFt,
      rawBuildingClass,
      buildingClass,
      calculatedKW,
      finalKW,
      powerMW,
      method: calcMethod,
    });
  }

  return {
    powerMW,
    durationHrs: 4,
    solarMW: 0,
    peakDemandMW: powerMW,
    description: `Office: ${calcMethod || "Estimated"} → ${powerMW} MW`,
    dataSource: "Calculated from office characteristics",
  };
}

/**
 * Calculate college/university baseline from user inputs
 * Uses enrollment, building sq ft, and facility characteristics
 *
 * Power demand reference (ASHRAE/Campus guidelines):
 * - Small liberal arts: 1-3 MW (< 3,000 students, < 500k sq ft)
 * - Medium college: 3-10 MW (3,000-15,000 students, 500k-2M sq ft)
 * - Large university: 10-30 MW (15,000-50,000 students, 2M-5M sq ft)
 * - Major research: 30-100+ MW (50,000+ students, 5M+ sq ft)
 */
function calculateCollegeBaseline(useCaseData: Record<string, any>): BaselineCalculationResult {
  if (import.meta.env.DEV) {
    console.log(`🎓 [College] Input data:`, useCaseData);
  }

  // Priority 1: Direct peak demand input (from presets or user)
  const peakDemandKW =
    parseFloat(useCaseData.peakDemandKW) || parseFloat(useCaseData.peakDemand) || 0;
  if (peakDemandKW > 0) {
    const powerMW = peakDemandKW / 1000;
    const durationHrs = 4; // Standard backup duration for campus

    if (import.meta.env.DEV) {
      console.log(`🎓 [College] Using direct peak demand: ${peakDemandKW} kW = ${powerMW} MW`);
    }

    return {
      powerMW: Math.max(0.5, Math.round(powerMW * 100) / 100),
      durationHrs,
      solarMW: 0, // Let user configure
      peakDemandMW: powerMW,
      description: `Campus baseline: ${powerMW.toFixed(1)} MW peak demand`,
      dataSource: "User/Preset peak demand input",
    };
  }

  // Priority 2: Calculate from building square footage
  const sqftMapping: Record<string, number> = {
    under_500k: 300000,
    "500k_1_million": 750000,
    "1_3_million": 2000000,
    "3_5_million": 4000000,
    "5_10_million": 7500000,
    over_10_million: 12000000,
  };

  const sqftKey = useCaseData.totalBuildingSqFt || useCaseData.squareFootage || "";
  let totalSqFt = sqftMapping[sqftKey] || 0;

  // Try to parse if numeric
  if (!totalSqFt && sqftKey) {
    const numMatch = String(sqftKey).replace(/[^0-9]/g, "");
    if (numMatch) {
      totalSqFt = parseInt(numMatch, 10);
    }
  }

  // Priority 3: Estimate from student enrollment
  const enrollmentMapping: Record<string, number> = {
    under_1k: 500,
    "1_3k": 2000,
    "3_5k": 4000,
    "5_15k": 10000,
    "15_35k": 25000,
    "35_50k": 42500,
    over_50k: 60000,
  };

  const enrollmentKey = useCaseData.dormitoryBeds || useCaseData.studentEnrollment || "";
  const students = enrollmentMapping[enrollmentKey] || 0;

  // Calculate power demand
  let calculatedKW = 0;
  let calcMethod = "";

  if (totalSqFt > 0) {
    // Campus buildings: ~15-25 W/sq ft average (mix of classrooms, labs, dorms)
    const wattsPerSqFt = 18; // Conservative average
    calculatedKW = (totalSqFt * wattsPerSqFt) / 1000;
    calcMethod = `${(totalSqFt / 1000000).toFixed(1)}M sq ft × ${wattsPerSqFt} W/sqft`;
  } else if (students > 0) {
    // Estimate: ~0.5-1.5 kW per student (depends on facilities)
    const kwPerStudent = 0.8;
    calculatedKW = students * kwPerStudent;
    calcMethod = `${students.toLocaleString()} students × ${kwPerStudent} kW/student`;
  }

  // Add facility-specific loads
  let additionalKW = 0;

  // Research facilities (labs, clean rooms)
  if (
    (useCaseData.researchFacilities && useCaseData.researchFacilities !== "none") ||
    useCaseData.hasResearchFacilities === "true" ||
    (useCaseData.researchFacilities && useCaseData.researchFacilities !== "none") ||
    useCaseData.hasResearchFacilities === true
  ) {
    additionalKW += calculatedKW * 0.15; // +15% for research loads
    calcMethod += " +15% research";
  }

  // Medical facilities (hospital, health center)
  if (
    (useCaseData.medicalFacilities && useCaseData.medicalFacilities !== "none") ||
    useCaseData.hasMedicalFacilities === "true" ||
    (useCaseData.medicalFacilities && useCaseData.medicalFacilities !== "none") ||
    useCaseData.hasMedicalFacilities === true
  ) {
    additionalKW += calculatedKW * 0.1; // +10% for medical
    calcMethod += " +10% medical";
  }

  // Stadium (event days)
  if (
    (useCaseData.athleticFacilities && useCaseData.athleticFacilities !== "none") ||
    useCaseData.hasStadium === "true" ||
    (useCaseData.athleticFacilities && useCaseData.athleticFacilities !== "none") ||
    useCaseData.hasStadium === true
  ) {
    additionalKW += 2000; // ~2 MW for stadium operations
    calcMethod += " +2MW stadium";
  }

  // Data center on campus
  const dcSize =
    (useCaseData.dataCenterSize && useCaseData.dataCenterSize !== "none") ||
    useCaseData.hasDataCenter;
  if (dcSize === "small") additionalKW += 500;
  else if (dcSize === "medium") additionalKW += 2000;
  else if (dcSize === "large") additionalKW += 5000;

  const totalKW = calculatedKW + additionalKW;

  // If still no calculation, use fallback based on building count
  const buildingCount = parseInt(useCaseData.buildingCount) || 0;
  const finalKW = totalKW > 0 ? totalKW : buildingCount > 0 ? buildingCount * 50 : 2000;

  const powerMW = Math.max(0.5, Math.round((finalKW / 1000) * 100) / 100);
  const durationHrs = 4; // Standard campus backup

  if (import.meta.env.DEV) {
    console.log(`🎓 [College Calculation]:`, {
      sqftKey,
      totalSqFt,
      enrollmentKey,
      students,
      calculatedKW,
      additionalKW,
      finalKW,
      powerMW,
      method: calcMethod,
    });
  }

  return {
    powerMW,
    durationHrs,
    solarMW: 0,
    peakDemandMW: powerMW,
    description: `Campus: ${calcMethod || "Estimated"} → ${powerMW} MW`,
    dataSource: "Calculated from facility characteristics",
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
): BaselineCalculationResult["gridStrategy"] | undefined {
  const gridConnection = useCaseData.gridConnection || "full_grid";
  const gridSavingsGoal = useCaseData.gridSavingsGoal || "cost_reduction";
  const annualGridFees = parseFloat(useCaseData.annualGridFees) || 0;
  const gridImportLimitKW = parseFloat(useCaseData.gridImportLimit) || 0;

  // If no special grid strategy, return undefined
  if (gridConnection === "full_grid" || gridConnection === "reliable") {
    return undefined;
  }

  let strategy = "";
  let savingsReason = "";
  let annualSavings = 0;
  let requiresGeneration = false;
  let recommendedSolarMW = 0;

  switch (gridConnection) {
    case "off_grid":
      // Off-grid: Save 100% of grid fees, but need 100% generation
      strategy = "Complete Grid Independence";
      savingsReason = "Eliminating grid connection saves all capacity charges and connection fees";
      annualSavings = annualGridFees; // Save 100% of grid fees
      requiresGeneration = true;
      recommendedSolarMW = peakDemandMW * 1.3; // 130% of peak for reliability
      break;

    case "grid_backup":
      // Grid as backup: Save ~80% of grid fees, need ~80% generation
      strategy = "Grid as Emergency Backup";
      savingsReason = "Minimal grid reliance reduces capacity charges significantly";
      annualSavings = annualGridFees * 0.8; // Save 80% of grid fees
      requiresGeneration = true;
      recommendedSolarMW = peakDemandMW * 1.0; // 100% of peak
      break;

    case "grid_limited":
      // Limited grid: Save based on import limit reduction
      strategy = "Limited Grid Import";
      if (gridImportLimitKW > 0) {
        const limitMW = gridImportLimitKW / 1000;
        const reductionPercent = Math.max(0, Math.min(1, 1 - limitMW / peakDemandMW));
        savingsReason = `Limiting grid import to ${gridImportLimitKW}kW reduces capacity charges by ${(reductionPercent * 100).toFixed(0)}%`;
        annualSavings = annualGridFees * reductionPercent;
        requiresGeneration = limitMW < peakDemandMW * 0.5;
        recommendedSolarMW = Math.max(0, (peakDemandMW - limitMW) * 0.8);
      } else {
        savingsReason = "Limiting grid dependency reduces capacity charges and connection fees";
        annualSavings = annualGridFees * 0.5; // Estimate 50% savings
        recommendedSolarMW = peakDemandMW * 0.5;
      }
      break;

    case "grid_optimized":
      // Grid-optimized: Use BESS to reduce peak demand charges
      strategy = "Grid-Optimized (Peak Shaving)";
      savingsReason = "Using BESS for peak shaving reduces demand charges by 20-40%";
      annualSavings = annualGridFees * 0.3; // Conservative 30% demand charge reduction
      requiresGeneration = false;
      recommendedSolarMW = peakDemandMW * 0.3; // Optional solar for arbitrage
      break;

    case "microgrid":
      // Microgrid: Community/campus independence
      strategy = "Microgrid Operation";
      savingsReason = "Microgrid islanding capability reduces grid dependency and charges";
      annualSavings = annualGridFees * 0.6; // 60% savings from islanding
      requiresGeneration = true;
      recommendedSolarMW = peakDemandMW * 0.8;
      break;

    default:
      return undefined;
  }

  // Add savings motivation context
  if (gridSavingsGoal === "avoid_grid_fees" && annualGridFees > 0) {
    savingsReason += ` (€${annualGridFees.toLocaleString()}/year in grid fees)`;
  } else if (gridSavingsGoal === "energy_independence") {
    savingsReason += " with focus on energy self-sufficiency";
  } else if (gridSavingsGoal === "carbon_reduction") {
    savingsReason += " while maximizing clean energy use";
  }

  if (import.meta.env.DEV) {
    console.log("⚡ [Grid Strategy] Calculated savings:", {
      gridConnection,
      gridSavingsGoal,
      annualGridFees,
      gridImportLimitKW,
      peakDemandMW,
      strategy,
      annualSavings,
      recommendedSolarMW,
      requiresGeneration,
    });
  }

  return {
    strategy,
    savingsReason,
    annualSavings,
    requiresGeneration,
    recommendedSolarMW,
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
  const level2Count =
    parseInt(
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
  const dcFastCountLegacy =
    parseInt(
      useCaseData.dcfastCount || useCaseData.numberOfDCFastChargers || useCaseData.dcFastChargers
    ) || 0;

  // If legacy dcFastCount exists but no granular data, assume all 150kW
  const totalDcfc50 = (dcfc50Count * 50) / 1000; // MW
  const totalDcfc150 =
    ((dcfc150Count + (dcFastCountLegacy && !dcfc50Count && !dcfc150Count ? dcFastCountLegacy : 0)) *
      150) /
    1000; // MW
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
  const concurrency =
    Math.min(
      parseInt(useCaseData.concurrentChargingSessions || useCaseData.peakConcurrency) || 60,
      90
    ) / 100; // Default 60%, max 90%

  if (import.meta.env.DEV) {
    console.log("🔌 [EV Charging Baseline] Field mapping check:", {
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
      resolved_concurrency: concurrency * 100 + "%",
    });
    console.log("🔌 [EV Charging Baseline] Power breakdown:", {
      level2: {
        count: level2Count,
        power: level2Power + " kW",
        total: totalLevel2.toFixed(3) + " MW",
      },
      dcfc50: {
        count: dcfc50Count,
        power: "50 kW",
        total: totalDcfc50.toFixed(3) + " MW",
      },
      dcfc150: {
        count:
          dcfc150Count +
          (dcFastCountLegacy && !dcfc50Count && !dcfc150Count ? dcFastCountLegacy : 0),
        power: "150 kW",
        total: totalDcfc150.toFixed(3) + " MW",
      },
      hpc350: {
        count: hpc350Count,
        power: "350 kW",
        total: totalHPC.toFixed(3) + " MW",
      },
      megawatt: {
        count: megawattCount,
        power: "1000 kW",
        total: totalMegawatt.toFixed(3) + " MW",
      },
      concurrency: concurrency * 100 + "%",
      totalCharging: totalCharging.toFixed(3) + " MW",
      peakDemand: (totalCharging * concurrency).toFixed(3) + " MW",
    });
  }

  // Battery sized for peak demand management
  // Use 100% of total charging capacity with concurrency factor
  const powerMW = Math.max(0.2, totalCharging * concurrency);
  const roundedPowerMW = Math.round(powerMW * 100) / 100; // Round to 0.01 MW precision

  // GENERATION LOGIC: Determine if solar/generation is required
  const gridConnection = useCaseData.gridConnection || "reliable";
  const gridCapacity = parseFloat(useCaseData.gridCapacity) || 0; // 0 = unlimited
  const peakDemandMW = totalCharging; // Peak when all chargers active

  let generationRequired = false;
  let generationRecommendedMW = 0;
  let generationReason = "";

  if (gridConnection === "off_grid") {
    // OFF-GRID: Must generate 100% of power
    generationRequired = true;
    generationRecommendedMW = Math.round(peakDemandMW * 1.2 * 10) / 10; // 120% for headroom
    generationReason = "Off-grid location requires 100% generation capacity";
  } else if (gridConnection === "limited" && gridCapacity > 0 && peakDemandMW > gridCapacity) {
    // LIMITED GRID: Generate the gap
    const gridGap = peakDemandMW - gridCapacity;
    generationRequired = true;
    generationRecommendedMW = Math.round(gridGap * 1.1 * 10) / 10; // 110% gap coverage
    generationReason = `Peak demand (${peakDemandMW.toFixed(1)}MW) exceeds grid capacity (${gridCapacity}MW) by ${gridGap.toFixed(1)}MW`;
  } else if (gridConnection === "limited") {
    // LIMITED BUT NO CAPACITY ENTERED: Recommend generation
    generationRequired = false; // Not required without specific capacity
    generationRecommendedMW = Math.round(peakDemandMW * 0.5 * 10) / 10; // 50% as backup
    generationReason = "Limited grid capacity - recommend 50% generation for reliability";
  } else if (gridConnection === "unreliable") {
    // UNRELIABLE: Recommend backup generation
    generationRecommendedMW = Math.round(peakDemandMW * 0.3 * 10) / 10; // 30% for outages
    generationReason = "Unreliable grid - recommend 30% generation for backup during outages";
  } else if (gridConnection === "microgrid") {
    // MICROGRID: Need generation for islanding
    generationRecommendedMW = Math.round(peakDemandMW * 0.8 * 10) / 10; // 80% for islanding
    generationReason = "Microgrid operation requires generation for grid independence";
  }

  if (import.meta.env.DEV) {
    console.log("🔋 [EV Charging] Recommended Battery Size:", roundedPowerMW, "MW");
    if (import.meta.env.DEV) {
      console.log(
        "🔋 [EV Charging] Calculation: " +
          totalCharging.toFixed(3) +
          " MW × " +
          concurrency * 100 +
          "% = " +
          powerMW.toFixed(3) +
          " MW"
      );
    }
    console.log("☀️ [Generation Analysis]:", {
      gridConnection,
      gridCapacity: gridCapacity || "unlimited",
      peakDemand: peakDemandMW.toFixed(2) + " MW",
      generationRequired,
      generationRecommended: generationRecommendedMW + " MW",
      reason: generationReason,
    });
  }

  // Calculate grid strategy savings (for European off-grid/limited-grid scenarios)
  const gridStrategy = calculateGridStrategySavings(useCaseData, peakDemandMW);

  // Build detailed description showing all charger types
  const descParts: string[] = [];
  if (level2Count > 0)
    descParts.push(`${level2Count} Level 2 (${(totalLevel2 * 1000).toFixed(0)}kW)`);
  if (dcfc50Count > 0)
    descParts.push(`${dcfc50Count} DCFC-50 (${(totalDcfc50 * 1000).toFixed(0)}kW)`);
  const dcfc150Total =
    dcfc150Count + (dcFastCountLegacy && !dcfc50Count && !dcfc150Count ? dcFastCountLegacy : 0);
  if (dcfc150Total > 0)
    descParts.push(`${dcfc150Total} DCFC-150 (${(totalDcfc150 * 1000).toFixed(0)}kW)`);
  if (hpc350Count > 0) descParts.push(`${hpc350Count} HPC-350 (${(totalHPC * 1000).toFixed(0)}kW)`);
  if (megawattCount > 0)
    descParts.push(`${megawattCount} MW-Chargers (${(totalMegawatt * 1000).toFixed(0)}kW)`);

  const description =
    descParts.length > 0 ? `EV Charging: ${descParts.join(" + ")}` : "EV Charging Station";

  return {
    powerMW: roundedPowerMW,
    durationHrs: 2, // Short duration for demand management
    solarMW: 0, // ✅ FIXED: Don't auto-add solar - let user decide
    description,
    dataSource: "Calculated from charger specifications",
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
    gridStrategy,
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
    hotel: {
      powerMW: 2.0,
      durationHrs: 4,
      solarMW: 0,
      description: "Fallback: Standard hotel configuration",
      dataSource: "Fallback (CBECS 2018)",
    },
    "ev-charging": {
      powerMW: 2.0,
      durationHrs: 2,
      solarMW: 0,
      description: "Fallback: Standard EV charging station",
      dataSource: "Fallback (DOE Alt Fuels Data)",
    },
    "data-center": {
      powerMW: 5.0,
      durationHrs: 8,
      solarMW: 0,
      description: "Fallback: Standard data center",
      dataSource: "Fallback (Uptime Institute)",
    },
    manufacturing: {
      powerMW: 3.0,
      durationHrs: 6,
      solarMW: 0,
      description: "Fallback: Standard manufacturing facility",
      dataSource: "Fallback (DOE Industrial)",
    },
    hospital: {
      powerMW: 4.0,
      durationHrs: 8,
      solarMW: 0,
      description: "Fallback: Standard hospital",
      dataSource: "Fallback (CBECS Healthcare)",
    },
  };

  const fallback = fallbacks[template] || {
    powerMW: 2.0,
    durationHrs: 4,
    solarMW: 0,
    description: "Fallback: Generic configuration",
    dataSource: "Fallback (Generic)",
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
    hotel: "rooms",
    apartment: "units",
    "car-wash": "bays",
    hospital: "beds",
    college: "students (thousands)",
    "data-center": "MW IT load",
    airport: "million passengers",
    manufacturing: "production lines",
    warehouse: "thousand sq ft",
    retail: "thousand sq ft",
    office: "thousand sq ft",
    "ev-charging": "chargers",
    casino: "gaming floor sq ft",
    agricultural: "acres",
    "indoor-farm": "growing area sq ft",
    "cold-storage": "storage volume",
  };

  return unitMap[template] || "units";
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
    ratio,
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
  primaryObjective: "peak-shaving" | "backup" | "arbitrage" | "all";
}): BESSSizingParameters {
  const { peakDemandkW, averageDemandkW, dailyEnergyConsumptionkWh, primaryObjective } = params;

  let recommendedPowerMW: number;
  let recommendedDurationHours: number;
  let peakShavingPercent = 30;

  switch (primaryObjective) {
    case "peak-shaving":
      recommendedPowerMW = (peakDemandkW * 0.4) / 1000; // 40% peak shaving (NREL/IEEE standard)
      recommendedDurationHours = 4; // NREL ATB 2024 C&I standard
      peakShavingPercent = 40;
      break;

    case "backup":
      recommendedPowerMW = (averageDemandkW * 1.2) / 1000; // 120% of average
      recommendedDurationHours = 4;
      peakShavingPercent = 0;
      break;

    case "arbitrage":
      recommendedPowerMW = (peakDemandkW * 0.6) / 1000;
      recommendedDurationHours = 6;
      peakShavingPercent = 20;
      break;

    case "all":
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
    estimatedAnnualSavings,
  };
}
