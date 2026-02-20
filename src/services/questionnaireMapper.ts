/**
 * QUESTIONNAIRE MAPPER - Phase 3 Hotel Questionnaire
 * December 15, 2025
 *
 * Converts rich questionnaire answers → SSOT calculation inputs.
 * This is the bridge between the UX (14 hotel questions) and the
 * calculation engine (calculateHotelPower).
 *
 * SSOT COMPLIANCE:
 * - This file does NOT contain calculations
 * - It only transforms/maps data to formats expected by SSOT functions
 * - All actual calculations happen in useCasePowerCalculations.ts
 */

import type { HotelAmenity } from "./useCasePowerCalculations";

// ════════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════════

/** Raw questionnaire answers from wizardState.useCaseData */
export interface HotelQuestionnaireAnswers {
  // Q1: Property classification (select)
  hotelClassification?: string;

  // Q2: Number of guest rooms (number)
  roomCount?: number;

  // Q3: Total square footage (number, optional)
  squareFeet?: number;

  // Q4: Average occupancy rate (slider, 20-100)
  avgOccupancy?: number;

  // Q5: Property amenities (multiselect - stored as string[])
  amenities?: string[];

  // Q6: Food & beverage (compound - stored as object)
  foodBeverage?: Record<string, { enabled: boolean; amount?: number }>;

  // Q7: Meeting space (compound)
  meetingSpace?: Record<string, { enabled: boolean; amount?: number }>;

  // Q8: Parking (compound)
  parking?: Record<string, { enabled: boolean; amount?: number }>;

  // Q9: Existing solar (compound)
  existingSolar?: Record<string, { enabled: boolean; amount?: number }>;

  // Q10: Solar interest (compound)
  solarInterest?: Record<string, { enabled: boolean; amount?: number }>;

  // Q11: Existing EV charging (compound)
  existingEV?: Record<string, { enabled: boolean; amount?: number }>;

  // Q12: EV interest (compound)
  evInterest?: Record<string, { enabled: boolean; amount?: number }>;

  // Q13: Backup requirements (compound)
  backupRequirements?: Record<string, { enabled: boolean; amount?: number }>;

  // Q14: Energy goals (compound)
  energyGoals?: Record<string, { enabled: boolean; amount?: number }>;
}

/** SSOT-compatible hotel power input (matches calculateHotelPower signature) */
export interface HotelSSOTInput {
  roomCount: number;
  hotelClass: "economy" | "midscale" | "upscale" | "luxury";
  amenities: Partial<Record<HotelAmenity, boolean>>;
}

/** Additional extracted data for quote generation */
export interface HotelExtractedData {
  existingSolarKW: number;
  wantsSolar: boolean;
  targetSolarKW: number;
  existingEVChargers: number;
  wantsEVCharging: boolean;
  targetEVChargers: number;
  backupDurationHours: number;
  hasExistingGenerator: boolean;
  existingGeneratorKW: number;
  monthlyBill: number;
  peakDemandKW: number;
  meetingSpaceSqFt: number;
  parkingSpaces: number;
  hasSurfaceParking: boolean; // For solar canopy potential
}

// ════════════════════════════════════════════════════════════════════════════════
// CLASSIFICATION MAPPING
// Maps Claude's 10 hotel classifications → SSOT's 4 classes
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Maps questionnaire classification values to SSOT hotel classes.
 *
 * Claude's 10 options map to our 4 validated classes:
 * - economy: Budget, Inn/B&B
 * - midscale: Midscale, Upper Midscale, Boutique, Extended Stay
 * - upscale: Upscale, Upper Upscale
 * - luxury: Luxury, Resort
 *
 * SSOT validation: Marriott Lancaster 133 rooms = 384 kW = 2.89 kW/room
 * → midscale (4.0 kW/room × 0.75 = 3.0 kW/room)
 */
const CLASSIFICATION_TO_SSOT: Record<string, "economy" | "midscale" | "upscale" | "luxury"> = {
  budget: "economy",
  "inn-bb": "economy",
  midscale: "midscale",
  "upper-midscale": "midscale",
  boutique: "midscale",
  "extended-stay": "midscale",
  upscale: "upscale",
  "upper-upscale": "upscale",
  luxury: "luxury",
  resort: "luxury",
};

// ════════════════════════════════════════════════════════════════════════════════
// AMENITY MAPPING
// Maps questionnaire amenity values → SSOT amenity booleans
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Maps questionnaire amenity values to SSOT amenity keys.
 * Uses ssotField from the database options where available.
 */
const AMENITY_TO_SSOT: Record<string, HotelAmenity | null> = {
  // Pool variants → pool
  indoor_pool: "pool",
  outdoor_pool: "pool",
  pool_unheated: "pool",

  // Spa variants → spa
  hot_tub: "spa",
  full_spa: "spa",

  // Fitness variants → fitnessCenter
  fitness_small: "fitnessCenter",
  fitness_large: "fitnessCenter",

  // Laundry variants → laundry
  guest_laundry: "laundry",
  commercial_laundry: "laundry",

  // No SSOT mapping (power handled separately)
  business_center: null,
  gift_shop: null,
  courts: null,
  none: null,
};

/**
 * Maps F&B compound selections to restaurant amenity.
 * Any kitchen/restaurant facility triggers SSOT restaurant amenity.
 */
const FB_TO_RESTAURANT: string[] = [
  "breakfast",
  "casual_dining",
  "fine_dining",
  "bar",
  "room_service",
  "banquet",
  "coffee_shop",
  "pool_bar",
];

/**
 * Maps meeting space selections to conference center amenity.
 */
const MEETING_TO_CONFERENCE: string[] = ["small", "medium", "large", "convention"];

// ════════════════════════════════════════════════════════════════════════════════
// MAIN MAPPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Maps hotel questionnaire answers to SSOT-compatible input.
 *
 * @param answers - Raw answers from wizardState.useCaseData
 * @returns HotelSSOTInput ready for calculateHotelPower()
 *
 * @example
 * ```typescript
 * const ssotInput = mapHotelQuestionnaireToSSOT(wizardState.useCaseData);
 * const result = calculateHotelPower(ssotInput.roomCount, {
 *   hotelClass: ssotInput.hotelClass,
 *   amenities: ssotInput.amenities,
 * });
 * ```
 */
export function mapHotelQuestionnaireToSSOT(answers: HotelQuestionnaireAnswers): HotelSSOTInput {
  // Q2: Room count
  // ⚠️ SSOT VIOLATION: Using default fallback instead of requiring user-provided value
  // TODO: Remove default - user must provide roomCount (database is SSOT)
  const roomCount = answers.roomCount || 150;

  // Q1: Hotel classification → SSOT class
  const classification = answers.hotelClassification || "midscale";
  const hotelClass = CLASSIFICATION_TO_SSOT[classification] || "midscale";

  // Build amenities object from multiple questions
  const amenities: Partial<Record<HotelAmenity, boolean>> = {};

  // Q5: Property amenities (multiselect)
  if (answers.amenities && Array.isArray(answers.amenities)) {
    for (const amenityValue of answers.amenities) {
      const ssotKey = AMENITY_TO_SSOT[amenityValue];
      if (ssotKey) {
        amenities[ssotKey] = true;
      }
    }
  }

  // Q6: Food & beverage → restaurant amenity
  if (answers.foodBeverage) {
    const hasAnyFB = FB_TO_RESTAURANT.some((key) => answers.foodBeverage?.[key]?.enabled === true);
    if (hasAnyFB) {
      amenities.restaurant = true;
    }
  }

  // Q7: Meeting space → conferenceCenter amenity
  if (answers.meetingSpace) {
    const hasAnyMeeting = MEETING_TO_CONFERENCE.some(
      (key) => answers.meetingSpace?.[key]?.enabled === true
    );
    if (hasAnyMeeting) {
      amenities.conferenceCenter = true;
    }
  }

  // Q11: Existing EV charging → evCharging amenity
  if (answers.existingEV) {
    const hasEV = ["level2", "dcfc", "ultra"].some(
      (key) => answers.existingEV?.[key]?.enabled === true
    );
    if (hasEV) {
      amenities.evCharging = true;
    }
  }

  if (import.meta.env.DEV) console.log("🗺️ [mapHotelQuestionnaireToSSOT] Mapping complete:", {
    inputClassification: classification,
    outputClass: hotelClass,
    roomCount,
    inputAmenities: answers.amenities,
    outputAmenities: Object.keys(amenities),
  });

  return {
    roomCount,
    hotelClass,
    amenities,
  };
}

/**
 * Extracts additional data from questionnaire for quote generation.
 * This includes solar, EV, backup, and financial data that doesn't
 * go directly into calculateHotelPower() but is needed for full quotes.
 *
 * @param answers - Raw answers from wizardState.useCaseData
 * @returns HotelExtractedData with solar, EV, backup, and financial info
 */
export function extractHotelQuestionnaireData(
  answers: HotelQuestionnaireAnswers
): HotelExtractedData {
  // Q9: Existing solar
  let existingSolarKW = 0;
  if (answers.existingSolar) {
    if (answers.existingSolar.operational?.enabled) {
      existingSolarKW = answers.existingSolar.operational.amount || 100;
    } else if (answers.existingSolar.under_construction?.enabled) {
      existingSolarKW = answers.existingSolar.under_construction.amount || 150;
    } else if (answers.existingSolar.approved?.enabled) {
      existingSolarKW = answers.existingSolar.approved.amount || 100;
    }
  }

  // Q10: Solar interest
  let wantsSolar = false;
  let targetSolarKW = 0;
  if (answers.solarInterest) {
    if (answers.solarInterest.active?.enabled) {
      wantsSolar = true;
      targetSolarKW = answers.solarInterest.active.amount || 200;
    } else if (answers.solarInterest.exploring?.enabled) {
      wantsSolar = true;
    } else if (answers.solarInterest.maybe?.enabled) {
      wantsSolar = true;
    }
  }

  // Q11: Existing EV charging
  let existingEVChargers = 0;
  if (answers.existingEV) {
    if (answers.existingEV.level2?.enabled) {
      existingEVChargers += answers.existingEV.level2.amount || 4;
    }
    if (answers.existingEV.dcfc?.enabled) {
      existingEVChargers += answers.existingEV.dcfc.amount || 2;
    }
    if (answers.existingEV.ultra?.enabled) {
      existingEVChargers += answers.existingEV.ultra.amount || 1;
    }
  }

  // Q12: EV interest
  let wantsEVCharging = false;
  let targetEVChargers = 0;
  if (answers.evInterest) {
    if (answers.evInterest.high?.enabled) {
      wantsEVCharging = true;
      targetEVChargers = answers.evInterest.high.amount || 8;
    } else if (answers.evInterest.moderate?.enabled) {
      wantsEVCharging = true;
      targetEVChargers = answers.evInterest.moderate.amount || 4;
    } else if (answers.evInterest.exploring?.enabled) {
      wantsEVCharging = true;
    }
  }

  // Q13: Backup requirements
  let backupDurationHours = 4; // Default
  let hasExistingGenerator = false;
  let existingGeneratorKW = 0;
  if (answers.backupRequirements) {
    if (answers.backupRequirements.critical?.enabled) {
      backupDurationHours = answers.backupRequirements.critical.amount || 24;
    } else if (answers.backupRequirements.important?.enabled) {
      backupDurationHours = answers.backupRequirements.important.amount || 8;
    } else if (answers.backupRequirements.nice_to_have?.enabled) {
      backupDurationHours = answers.backupRequirements.nice_to_have.amount || 4;
    }

    if (answers.backupRequirements.has_generator?.enabled) {
      hasExistingGenerator = true;
      existingGeneratorKW = answers.backupRequirements.has_generator.amount || 500;
    }
  }

  // Q14: Energy goals - extract financial data
  let monthlyBill = 25000; // Default
  let peakDemandKW = 500; // Default
  if (answers.energyGoals) {
    if (answers.energyGoals.reduce_costs?.enabled) {
      monthlyBill = answers.energyGoals.reduce_costs.amount || 25000;
    }
    if (answers.energyGoals.reduce_demand?.enabled) {
      peakDemandKW = answers.energyGoals.reduce_demand.amount || 500;
    }
  }

  // Q7: Meeting space square footage
  let meetingSpaceSqFt = 0;
  if (answers.meetingSpace) {
    if (answers.meetingSpace.small?.enabled) {
      meetingSpaceSqFt += answers.meetingSpace.small.amount || 500;
    }
    if (answers.meetingSpace.medium?.enabled) {
      meetingSpaceSqFt += answers.meetingSpace.medium.amount || 2500;
    }
    if (answers.meetingSpace.large?.enabled) {
      meetingSpaceSqFt += answers.meetingSpace.large.amount || 10000;
    }
    if (answers.meetingSpace.convention?.enabled) {
      meetingSpaceSqFt += answers.meetingSpace.convention.amount || 30000;
    }
  }

  // Q8: Parking
  let parkingSpaces = 0;
  let hasSurfaceParking = false;
  if (answers.parking) {
    if (answers.parking.surface?.enabled) {
      parkingSpaces += answers.parking.surface.amount || 150;
      hasSurfaceParking = true;
    }
    if (answers.parking.structure?.enabled) {
      parkingSpaces += answers.parking.structure.amount || 200;
    }
  }

  if (import.meta.env.DEV) console.log("🗺️ [extractHotelQuestionnaireData] Extraction complete:", {
    existingSolarKW,
    wantsSolar,
    targetSolarKW,
    existingEVChargers,
    wantsEVCharging,
    targetEVChargers,
    backupDurationHours,
    hasExistingGenerator,
    existingGeneratorKW,
    monthlyBill,
    peakDemandKW,
    meetingSpaceSqFt,
    parkingSpaces,
    hasSurfaceParking,
  });

  return {
    existingSolarKW,
    wantsSolar,
    targetSolarKW,
    existingEVChargers,
    wantsEVCharging,
    targetEVChargers,
    backupDurationHours,
    hasExistingGenerator,
    existingGeneratorKW,
    monthlyBill,
    peakDemandKW,
    meetingSpaceSqFt,
    parkingSpaces,
    hasSurfaceParking,
  };
}

/**
 * Full hotel questionnaire mapper - combines SSOT input + extracted data.
 * Use this when generating complete quotes.
 *
 * @param answers - Raw answers from wizardState.useCaseData
 * @returns Combined object with SSOT input and extracted data
 */
export function mapHotelQuestionnaire(answers: HotelQuestionnaireAnswers): {
  ssotInput: HotelSSOTInput;
  extractedData: HotelExtractedData;
  avgOccupancy: number;
  squareFeet: number;
} {
  const ssotInput = mapHotelQuestionnaireToSSOT(answers);
  const extractedData = extractHotelQuestionnaireData(answers);

  return {
    ssotInput,
    extractedData,
    avgOccupancy: answers.avgOccupancy || 65,
    squareFeet: answers.squareFeet || 100000,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// GENERIC USE CASE MAPPER (Future expansion)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Generic questionnaire mapper that routes to use-case-specific mappers.
 * Expand this as we add questionnaires for other use cases.
 *
 * @param useCaseSlug - The use case identifier (e.g., 'hotel', 'car-wash')
 * @param answers - Raw answers from wizardState.useCaseData
 * @returns Mapped data ready for SSOT calculations
 */
export function mapQuestionnaireToSSOT(
  useCaseSlug: string,
  answers: Record<string, any>
): { ssotInput: any; extractedData: any } {
  switch (useCaseSlug) {
    case "hotel":
    case "hotel-hospitality":
      return {
        ssotInput: mapHotelQuestionnaireToSSOT(answers as HotelQuestionnaireAnswers),
        extractedData: extractHotelQuestionnaireData(answers as HotelQuestionnaireAnswers),
      };

    // TODO: Add mappers for other use cases as we build their questionnaires
    // case 'car-wash':
    //   return mapCarWashQuestionnaireToSSOT(answers);
    // case 'ev-charging':
    //   return mapEVChargingQuestionnaireToSSOT(answers);

    default:
      // Return raw answers for use cases without custom mappers
      return {
        ssotInput: answers,
        extractedData: {},
      };
  }
}
