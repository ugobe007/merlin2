/**
 * CURATED FIELDS RESOLVER (Phase 1: Step 3 Magic Restoration)
 *
 * Created: February 2, 2026
 *
 * PURPOSE:
 * ========
 * This resolver is the SINGLE SOURCE OF TRUTH for Step 3 field schemas.
 * It replaces the broken templateMapping that collapsed 14 industries into 3.
 *
 * DOCTRINE:
 * - Templates can exist for copy/sections/order
 * - But the FIELD SET comes from this curated schema
 * - Each industry has its own lovingly-crafted question definitions
 * - Icons, validation, conditional logic, Merlin tips - all preserved
 *
 * ARCHITECTURE:
 * - resolveStep3Schema(industry) → returns curated fields list
 * - Step 3 uses this, NOT the backend template's questions
 * - Backend templates are "thin" (sections, order) - NOT the field definitions
 */

import type { Question as CarWashQuestion } from "@/data/carwash-questions-complete.config";
import {
  carWashQuestionsComplete,
  carWashSections,
} from "@/data/carwash-questions-complete.config";
import type { Question as HotelQuestion } from "@/data/hotel-questions-complete.config";
import { hotelQuestionsComplete, hotelSections } from "@/data/hotel-questions-complete.config";
import type { Question as EVChargingQuestion } from "@/data/evcharging-questions-complete.config";
import {
  evChargingQuestionsComplete,
  evChargingSections,
} from "@/data/evcharging-questions-complete.config";
import {
  datacenterQuestionsComplete,
  datacenterSections,
} from "@/data/datacenter-questions-complete.config";
import {
  hospitalQuestionsComplete,
  hospitalSections,
} from "@/data/hospital-questions-complete.config";
import { officeQuestionsComplete, officeSections } from "@/data/office-questions-complete.config";
import {
  manufacturingQuestionsComplete,
  manufacturingSections,
} from "@/data/manufacturing-questions-complete.config";
import {
  warehouseQuestionsComplete,
  warehouseSections,
} from "@/data/warehouse-questions-complete.config";
import { retailQuestionsComplete, retailSections } from "@/data/retail-questions-complete.config";
import {
  gasStationQuestionsComplete,
  gasStationSections,
} from "@/data/gasstation-questions-complete.config";
import {
  airportQuestionsComplete,
  airportSections,
} from "@/data/airport-questions-complete.config";
import { casinoQuestionsComplete, casinoSections } from "@/data/casino-questions-complete.config";
import {
  apartmentQuestionsComplete,
  apartmentSections,
} from "@/data/apartment-questions-complete.config";
import {
  collegeQuestionsComplete,
  collegeSections,
} from "@/data/college-questions-complete.config";
import {
  coldStorageQuestionsComplete,
  coldStorageSections,
} from "@/data/coldstorage-questions-complete.config";
import {
  indoorFarmQuestionsComplete,
  indoorFarmSections,
} from "@/data/indoorfarm-questions-complete.config";
import {
  agricultureQuestionsComplete,
  agricultureSections,
} from "@/data/agriculture-questions-complete.config";
import {
  residentialQuestionsComplete,
  residentialSections,
} from "@/data/residential-questions-complete.config";
import {
  governmentQuestionsComplete,
  governmentSections,
} from "@/data/government-questions-complete.config";
import {
  restaurantQuestionsComplete,
  restaurantSections,
} from "@/data/restaurant-questions-complete.config";
import {
  industryQuestionnaires,
  type Question as LegacyQuestion,
} from "@/data/industryQuestionnaires";
import { resolveIndustryContext } from "@/wizard/v7/industry";
import { devLog } from "@/wizard/v7/debug/devLog";

// ============================================================================
// TIER 1 BLOCKERS — Single Source of Truth for Step 3 Gating
// ============================================================================

/**
 * Tier 1 Blockers: Questions that MUST be answered for "definitive" load profile.
 *
 * Principle: Keep this 6-10 max per industry.
 * - If a question materially changes peak kW, duty cycle, or energy per unit → Tier 1
 * - If only used for solar/roof, incentives, layout, features → Tier 2 (recommended)
 *
 * Tier 2 questions remain required in schema for UI emphasis, but don't gate navigation.
 *
 * Updated: Feb 3, 2026 — Car wash reduced from 24 to 8 blockers
 */
const TIER1_BLOCKERS: Record<string, string[]> = {
  "car-wash": [
    "facilityType", // Core: tunnel vs IBA vs self-serve
    "tunnelOrBayCount", // Core: primary capacity driver
    "operatingHours", // Core: duty cycle
    "daysPerWeek", // Core: annual energy driver
    "dailyVehicles", // Core: throughput proxy
    "waterHeaterType", // Load driver: 10-30 kW continuous
    "dryerConfiguration", // CRITICAL: 40-50% of bill
    "pumpConfiguration", // CRITICAL: 20-30% of bill
  ],
  hotel: [
    "hotelCategory", // Core: class drives HVAC + amenity intensity
    "numRooms", // Core: primary capacity driver
    "occupancyRate", // Core: baseload vs peak ratio
    "poolOnSite", // Load driver: 30-80 kW pumps + heating
    "restaurantOnSite", // Load driver: 80-200 kW full kitchen
    "spaOnSite", // Load driver: 40-100 kW water + HVAC
    "gridConnection", // Architecture: on-grid vs off-grid
  ],
  "ev-charging": [
    "stationType", // Core: utilization profile driver
    "level2Chargers", // Core: L2 count (adapter requiredInput)
    "level2Power", // Core: kW per L2 port
    "dcFastChargers", // Core: DCFC count (adapter requiredInput)
    "dcFastPower", // Core: kW per DCFC port
    "gridConnection", // Architecture: on-grid vs limited vs off-grid
    "operatingHours", // Core: duty cycle driver
  ],
  datacenter: [
    "dataCenterTier", // Core: redundancy & power density
    "itLoadCapacity", // Core: primary power driver (MW)
    "currentPUE", // Core: total facility power = IT × PUE
    "itUtilization", // Core: actual IT load percentage
    "coolingSystem", // Load driver: cooling is 30-40% of total
    "squareFootage", // Secondary: facility size context
    "gridConnection", // Architecture
  ],
  hospital: [
    "facilityType", // Core: hospital vs clinic vs specialty
    "bedCount", // Core: primary capacity driver
    "criticalSystems", // Load driver: which systems are critical
    "operatingRooms", // Load driver: high-power surgical suites
    "gridConnection", // Architecture
    "existingGenerator", // Hybrid system design
    "backupDuration", // Sizing: backup hours needed
  ],
  office: [
    "buildingClass", // Core: Class A/B/C drives power density
    "squareFootage", // Core: primary area-based calculation
    "floors", // Core: elevator/HVAC scaling
    "hvacSystem", // Load driver: 40-60% of energy
    "operatingHours", // Core: duty cycle
    "gridConnection", // Architecture
  ],
  manufacturing: [
    "facilityType", // Core: light vs heavy vs process
    "squareFootage", // Core: primary area driver
    "shifts", // Core: duty cycle driver
    "processLoads", // Load driver: motors, presses, etc.
    "heavyMachinery", // Load driver: large motors
    "gridConnection", // Architecture
    "powerQuality", // Sizing: power quality needs
  ],
  warehouse: [
    "warehouseType", // Core: dry vs cold vs automated
    "squareFootage", // Core: primary area driver
    "refrigeration", // Load driver: cold chain storage
    "automationLevel", // Load driver: automated material handling
    "operatingHours", // Core: duty cycle
    "gridConnection", // Architecture
  ],
  retail: [
    "retailType", // Core: grocery vs dept store vs mall
    "squareFootage", // Core: primary area driver
    "refrigerationLevel", // Load driver: grocery/food retail
    "operatingHours", // Core: duty cycle
    "gridConnection", // Architecture
    "demandCharges", // Sizing: peak shaving opportunity
  ],
  "gas-station": [
    "stationType", // Core: basic vs convenience vs truck stop
    "fuelPumps", // Core: canopy/pump electrical load
    "convenienceStore", // Load driver: refrigeration + HVAC
    "foodService", // Load driver: kitchen equipment
    "evChargers", // Load driver: EV charging adds significant load
    "gridConnection", // Architecture
  ],
  airport: [
    "airportClass", // Core: commercial vs regional vs GA
    "annualPassengers", // Core: primary capacity driver
    "terminalSqFt", // Core: area-based calculation
    "jetBridges", // Load driver: 50-75 kW each
    "gridConnection", // Architecture
    "existingGenerator", // Hybrid system design
  ],
  casino: [
    "casinoType", // Core: casino-only vs resort
    "gamingFloorSqft", // Core: primary load driver
    "totalPropertySqFt", // Core: total area
    "hotelRooms", // Load driver: integrated hotel
    "restaurants", // Load driver: F&B operations
    "gridConnection", // Architecture
  ],
  apartment: [
    "propertyType", // Core: garden vs midrise vs highrise
    "unitCount", // Core: primary capacity driver
    "avgUnitSize", // Core: per-unit consumption
    "hvacType", // Load driver: central vs individual HVAC
    "commonAmenities", // Load driver: pool, gym, etc.
    "gridConnection", // Architecture
  ],
  college: [
    "institutionType", // Core: community vs research university
    "campusSqFt", // Core: primary area driver
    "enrollment", // Core: capacity/occupancy factor
    "researchLabs", // Load driver: high-power lab equipment
    "studentHousing", // Load driver: residential load component
    "gridConnection", // Architecture
  ],
  "cold-storage": [
    "facilityType", // Core: frozen vs cooled vs multi-temp
    "squareFootage", // Core: primary area driver
    "temperatureZones", // Core: number/type of temperature zones
    "compressorSystem", // Load driver: compressor technology
    "operatingHours", // Core: 24/7 vs shift-based
    "gridConnection", // Architecture
  ],
  "indoor-farm": [
    "farmType", // Core: vertical vs greenhouse vs hybrid
    "squareFootage", // Core: primary area driver
    "growingLevels", // Core: vertical stacking multiplier
    "lightingSystem", // Load driver: lighting is 40-60% of energy
    "lightSchedule", // Core: photoperiod duty cycle
    "hvacDehumidification", // Load driver: climate control
    "gridConnection", // Architecture
  ],
  agriculture: [
    "farmType", // Core: crop vs livestock vs dairy
    "acreage", // Core: primary scale driver
    "irrigationType", // Load driver: pumping energy
    "coldStorage", // Load driver: post-harvest cooling
    "processing", // Load driver: on-site processing
    "gridConnection", // Architecture
  ],
  residential: [
    "homeType", // Core: single family vs townhome
    "squareFootage", // Core: primary area driver
    "hvacType", // Load driver: heat pump vs conventional
    "evCharging", // Load driver: EV adds 30-40% consumption
    "waterHeater", // Load driver: tankless electric = huge peaks
    "gridConnection", // Architecture
  ],
  government: [
    "facilityType", // Core: office vs public safety vs water
    "squareFootage", // Core: primary area driver
    "criticalOperations", // Core: FEMA tier for backup sizing
    "operatingHours", // Core: 24/7 vs business hours
    "dataCenter", // Load driver: server room/comms
    "gridConnection", // Architecture
  ],
  restaurant: [
    "restaurantType", // Core: service model drives kitchen intensity
    "seatingCapacity", // Core: primary capacity driver
    "kitchenType", // Load driver: kitchen complexity
    "operatingHours", // Core: duty cycle driver
    "cookingEquipment", // Load driver: electric vs gas kitchen
    "gridConnection", // Architecture
  ],
};

/**
 * Get Tier 1 blocker question IDs for an industry.
 * Uses resolveIndustryContext() → ctx.schemaKey so industries that borrow
 * schemas (e.g., restaurant → hotel) inherit the donor's blockers.
 */
export function getTier1Blockers(industry: string): string[] {
  const ctx = resolveIndustryContext(industry);
  return TIER1_BLOCKERS[ctx.schemaKey] || [];
}

/**
 * Check if a question is a Tier 1 blocker (gates Step 3 completion)
 */
export function isBlockerQuestion(industry: string, questionId: string): boolean {
  const blockers = getTier1Blockers(industry);
  return blockers.includes(questionId);
}

// ============================================================================
// TYPES
// ============================================================================

export interface CuratedField {
  id: string;
  type: string;
  section: string;
  title: string;
  subtitle?: string;
  label?: string;
  helpText?: string;
  merlinTip?: string;
  options?: Array<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
    disabled?: boolean;
  }>;
  range?: {
    min: number;
    max: number;
    step: number;
  };
  unit?: string;
  suffix?: string;
  placeholder?: string;
  smartDefault?: unknown;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
  };
  conditionalLogic?: {
    dependsOn: string;
    showIf: (value: unknown) => boolean;
    modifyOptions?: (value: unknown) => CuratedField["options"];
  };
  impactsCalculations?: string[];
  // Required flag (derived from validation or explicit)
  required?: boolean;
}

export interface CuratedSection {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  questionIds?: string[];
}

export interface CuratedSchema {
  industry: string;
  displayName: string;
  icon: string;
  questions: CuratedField[];
  sections: CuratedSection[];
  // Metadata
  questionCount: number;
  requiredCount: number;
  source: "curated-complete" | "curated-legacy" | "fallback";
}

// ============================================================================
// INDUSTRY DISPLAY NAMES + ICONS
// ============================================================================

// CANONICAL KEYS ONLY - these are the normalized slugs returned by normalizeIndustrySlug()
const INDUSTRY_META: Record<string, { displayName: string; icon: string }> = {
  // Primary (complete curated questionnaire)
  "car-wash": { displayName: "Car Wash", icon: "🚗" },

  // Legacy-supported (industryQuestionnaires.ts)
  hotel: { displayName: "Hotel / Hospitality", icon: "🏨" },
  "ev-charging": { displayName: "EV Charging Station", icon: "🔌" },
  datacenter: { displayName: "Data Center", icon: "🖥️" },
  hospital: { displayName: "Healthcare Facility", icon: "🏥" },
  airport: { displayName: "Airport", icon: "✈️" },
  casino: { displayName: "Casino & Gaming", icon: "🎰" },
  warehouse: { displayName: "Warehouse / Logistics", icon: "📦" },
  retail: { displayName: "Retail / Shopping", icon: "🏪" },
  "gas-station": { displayName: "Gas / Truck Stop", icon: "⛽" },

  // Fallback industries (use generic schema)
  office: { displayName: "Office Building", icon: "🏢" },
  manufacturing: { displayName: "Manufacturing", icon: "🏭" },
  restaurant: { displayName: "Restaurant", icon: "🍽️" },
  college: { displayName: "College / University", icon: "🎓" },
  agriculture: { displayName: "Agriculture", icon: "🌾" },
  "cold-storage": { displayName: "Cold Storage", icon: "❄️" },
  apartment: { displayName: "Apartment Complex", icon: "🏠" },
  residential: { displayName: "Residential", icon: "🏡" },
  "indoor-farm": { displayName: "Indoor Farm", icon: "🌱" },
  government: { displayName: "Government & Public", icon: "🏛️" },

  // Default
  other: { displayName: "Commercial Facility", icon: "🏗️" },
  auto: { displayName: "Your Facility", icon: "⚡" },
};

// Export canonical keys as const array for type enforcement
export const CANONICAL_INDUSTRY_KEYS = [
  "car-wash",
  "hotel",
  "ev-charging",
  "datacenter",
  "hospital",
  "airport",
  "casino",
  "warehouse",
  "retail",
  "gas-station",
  "office",
  "manufacturing",
  "restaurant",
  "college",
  "agriculture",
  "cold-storage",
  "apartment",
  "residential",
  "indoor-farm",
  "government",
  "other",
  "auto",
] as const;

// Type for canonical industry keys (compile-time enforcement)
export type CanonicalIndustryKey = (typeof CANONICAL_INDUSTRY_KEYS)[number];

// ============================================================================
// FORMAT CONVERSION (internal — not a resolver)
// ============================================================================

/**
 * Convert a slug to canonical hyphen-format key.
 * PURE FORMAT CONVERSION — no alias resolution.
 * For alias resolution, use resolveIndustryContext() from the industry catalog.
 *
 * @internal Only used within this module for INDUSTRY_META / COMPLETE_SCHEMAS lookups.
 */
function normalizeIndustrySlug(slug: string): CanonicalIndustryKey {
  const hyphenated = slug.toLowerCase().replace(/_/g, "-");
  return CANONICAL_INDUSTRY_KEYS.includes(hyphenated as CanonicalIndustryKey)
    ? (hyphenated as CanonicalIndustryKey)
    : "other";
}

// ============================================================================
// INDUSTRY SMART DEFAULTS (Pre-fill answers with industry-typical values)
// ============================================================================

/**
 * Industry-standard default values for each question.
 * Sources: ASHRAE, CBECS, Energy Star, NREL ATB 2024, IEEE, LADWP.
 *
 * These get pre-filled into the form so users just REVIEW & ADJUST
 * instead of answering from scratch. Dramatically reduces friction.
 */
const INDUSTRY_SMART_DEFAULTS: Record<string, Record<string, unknown>> = {
  // EV Charging — based on typical public urban deployment
  "ev-charging": {
    stationType: "public-urban",
    level2Chargers: 12,
    level2Power: "11",
    dcFastChargers: 8,
    dcFastPower: "150",
    utilizationProfile: "medium",
    peakConcurrency: "50",
    gridConnection: "on-grid",
    operatingHours: "24-7",
  },
  // Hotel — based on SSOT 150-room midscale (ASHRAE/CBECS)
  hotel: {
    numRooms: 150,
    hotelCategory: "3-star",
    squareFootage: 75000,
    gridConnection: "on-grid",
    occupancyRate: "medium",
    amenities: ["pool", "restaurant", "hvac"],
    evChargers: "no",
    utilityRate: "no",
    gridReliability: "reliable",
  },
  // Data Center — based on SSOT small/mid colo (Uptime Institute)
  datacenter: {
    squareFootage: 50000,
    capacity: 2,
    gridConnection: "redundant",
    uptimeRequirement: "tier3",
    coolingSystem: "air",
  },
  // Hospital — based on SSOT 200-bed facility (NEC 517, NFPA 99)
  hospital: {
    bedCount: 200,
    gridConnection: "on-grid",
    criticalSystems: ["icu", "surgery", "imaging"],
    backupPower: "ups-generator",
    backupDuration: "8hr",
  },
  // Airport — based on medium regional airport (FAA standards)
  airport: {
    facilityType: "terminal",
    operationSize: "medium",
    criticalLoads: ["lighting", "security", "baggage"],
  },
  // Casino — based on mid-size tribal casino (IEEE 446)
  casino: {
    squareFootage: 75000,
    facilitySize: "medium",
    gridConnection: "on-grid",
    amenities: ["hotel", "restaurants", "entertainment"],
    operations: "24-7",
    backupCritical: "mission-critical",
  },
  // Warehouse / Logistics — based on SSOT 200K sqft (ASHRAE)
  warehouse: {
    squareFootage: 200000,
    facilityType: "warehouse",
    facilitySize: "medium",
    gridConnection: "on-grid",
    operations: "2-shift",
    criticalLoads: ["automation", "sorting"],
  },
  // Retail / Shopping Center — based on typical community center (CBECS)
  retail: {
    squareFootage: 250000,
    centerSize: "community",
    numTenants: 25,
    gridConnection: "on-grid",
    anchorTenants: ["grocery", "restaurant"],
    hvacLoad: "medium",
  },
  // Gas Station / Truck Stop — based on typical gas+c-store (CBECS)
  "gas-station": {
    stationType: "with-cstore",
    numPumps: 8,
    gridConnection: "on-grid",
    operations: "24-7",
    additionalServices: ["refrigeration"],
  },
  // Car Wash (legacy format — complete config has its own smartDefaults)
  "car-wash": {
    numBays: 4,
    washType: "automatic",
    gridConnection: "on-grid",
    operatingHours: 12,
    heatedWater: "yes",
  },
  // Restaurant — based on CBECS 2018 food service (100-seat full-service)
  restaurant: {
    restaurantType: "full-service",
    seatingCapacity: 100,
    squareFootage: 3000,
    kitchenType: "standard",
    operatingHours: "lunch-dinner",
    cookingEquipment: "gas-primary",
    refrigeration: "standard",
    exhaustHood: "standard",
    dishwasher: "under-counter",
    barArea: "none",
    gridConnection: "on-grid",
    gridReliability: "reliable",
    existingGenerator: "none",
    existingSolar: "no",
    primaryGoal: "cost-savings",
    budgetTimeline: "exploring",
  },
};

// ============================================================================
// CONVERT LEGACY QUESTION FORMAT → CURATED FIELD
// ============================================================================

function convertLegacyQuestion(
  q: LegacyQuestion,
  sectionId: string,
  industryKey?: string
): CuratedField {
  // Use legacy metadata if present, otherwise default to required
  const required = (q as unknown as Record<string, unknown>).required !== false;

  // Look up smart default from industry defaults map
  const industryDefaults = industryKey ? INDUSTRY_SMART_DEFAULTS[industryKey] : undefined;
  const smartDefault = industryDefaults?.[q.id];

  return {
    id: q.id,
    type: q.type === "multi-select" || q.type === "multiselect" ? "multiselect" : q.type,
    section: sectionId,
    title: q.label || q.question || q.id,
    label: q.label || q.question,
    placeholder: q.placeholder,
    helpText: q.helpText,
    smartDefault,
    options: q.options?.map((opt) =>
      typeof opt === "string"
        ? { value: opt, label: opt }
        : { value: String(opt.value), label: opt.label, description: opt.description }
    ),
    unit: q.suffix || q.unit,
    suffix: q.suffix || q.unit,
    required,
    validation: { required },
    conditionalLogic: q.conditional
      ? {
          dependsOn: q.conditional.field || q.conditional.dependsOn || "",
          showIf: (value: unknown) => {
            if (q.conditional?.operator === ">") return Number(value) > Number(q.conditional.value);
            if (q.conditional?.operator === "==") return value === q.conditional.value;
            if (q.conditional?.operator === "<") return Number(value) < Number(q.conditional.value);
            if (q.conditional?.dependsOn) return value === q.conditional.value;
            return true;
          },
        }
      : undefined,
  };
}

// ============================================================================
// CONVERT COMPLETE QUESTION FORMAT → CURATED FIELD
// ============================================================================

/**
 * Convert any *-questions-complete.config.ts Question to CuratedField.
 * All industry configs import the same Question interface from hotel config,
 * so HotelQuestion is the canonical shared type.
 */
function convertCompleteQuestion(
  q: CarWashQuestion | HotelQuestion | EVChargingQuestion
): CuratedField {
  // For range_buttons: synthesize button options from rangeConfig.ranges
  // so the standard button renderer can display them (hotel squareFootage, etc.)
  let options = q.options;
  if (q.type === "range_buttons" && !options?.length && q.rangeConfig) {
    const rc = q.rangeConfig;
    if (rc?.ranges) {
      options = rc.ranges.map((r) => ({
        value: String(r.min),
        label: r.label,
      }));
    }
  }

  return {
    id: q.id,
    type: q.type,
    section: q.section,
    title: q.title,
    subtitle: q.subtitle,
    helpText: q.helpText,
    merlinTip: q.merlinTip,
    options,
    range: q.range,
    unit: q.unit,
    suffix: q.suffix,
    smartDefault: q.smartDefault,
    validation: q.validation,
    conditionalLogic: q.conditionalLogic,
    impactsCalculations: q.impactsCalculations,
    required: q.validation?.required ?? true,
  };
}

// ============================================================================
// LEGACY QUESTIONNAIRE KEY MAPPING (SSOT)
// ============================================================================

/**
 * Maps canonical normalized industry keys to industryQuestionnaires.ts keys.
 * This is the SINGLE SOURCE OF TRUTH for legacy schema lookup.
 * Used by both resolveLegacySchema() and hasCuratedSchema().
 */
function getLegacyQuestionnaireKey(industryKey: string): string | null {
  const keyMap: Record<string, string> = {
    "ev-charging": "ev-charging",
    hotel: "hotel",
    datacenter: "datacenter",
    hospital: "hospital",
    airport: "airport",
    casino: "tribal-casino",
    warehouse: "logistics-center",
    retail: "shopping-center",
    "gas-station": "gas-station",
    "car-wash": "car-wash",
  };
  return keyMap[industryKey] ?? null;
}

// ============================================================================
// SCHEMA RESOLVERS BY INDUSTRY
// ============================================================================

/**
 * Generic resolver factory — creates a resolver function for any industry
 * with a *-questions-complete.config.ts file.
 * All config files share the same Question type (imported from hotel config).
 */
function makeCompleteResolver(
  industry: string,
  displayName: string,
  icon: string,
  questions: HotelQuestion[],
  sections: Array<{ id: string; title: string; description?: string; icon?: string }>
): () => CuratedSchema {
  return () => {
    const convertedQuestions = questions.map(convertCompleteQuestion);
    const convertedSections = sections.map((s) => ({
      id: s.id,
      label: s.title,
      description: s.description,
      icon: s.icon,
    }));
    return {
      industry,
      displayName,
      icon,
      questions: convertedQuestions,
      sections: convertedSections,
      questionCount: convertedQuestions.length,
      requiredCount: convertedQuestions.filter((q) => q.required).length,
      source: "curated-complete" as const,
    };
  };
}

/**
 * COMPLETE_SCHEMAS registry — Unified lookup for all industries with rich
 * *-questions-complete.config.ts files (19 industries).
 *
 * To add a new industry:
 * 1. Create src/data/{industry}-questions-complete.config.ts
 * 2. Import questions + sections above
 * 3. Register here with makeCompleteResolver()
 *
 * NOTE: This is a FUNCTION (not const object) to avoid TDZ errors.
 * Module-level const initialization can fail if imports aren't ready.
 */
function getCOMPLETE_SCHEMAS(): Record<string, () => CuratedSchema> {
  return {
  "car-wash": makeCompleteResolver(
    "car-wash",
    "Car Wash",
    "🚗",
    carWashQuestionsComplete,
    carWashSections
  ),
  hotel: makeCompleteResolver("hotel", "Hotel", "🏨", hotelQuestionsComplete, hotelSections),
  "ev-charging": makeCompleteResolver(
    "ev-charging",
    "EV Charging Station",
    "⚡",
    evChargingQuestionsComplete,
    evChargingSections
  ),
  datacenter: makeCompleteResolver(
    "datacenter",
    "Data Center",
    "🖥️",
    datacenterQuestionsComplete,
    datacenterSections
  ),
  hospital: makeCompleteResolver(
    "hospital",
    "Healthcare Facility",
    "🏥",
    hospitalQuestionsComplete,
    hospitalSections
  ),
  office: makeCompleteResolver(
    "office",
    "Office Building",
    "🏢",
    officeQuestionsComplete,
    officeSections
  ),
  manufacturing: makeCompleteResolver(
    "manufacturing",
    "Manufacturing",
    "🏭",
    manufacturingQuestionsComplete,
    manufacturingSections
  ),
  warehouse: makeCompleteResolver(
    "warehouse",
    "Warehouse / Logistics",
    "📦",
    warehouseQuestionsComplete,
    warehouseSections
  ),
  retail: makeCompleteResolver(
    "retail",
    "Retail / Shopping",
    "🏪",
    retailQuestionsComplete,
    retailSections
  ),
  "gas-station": makeCompleteResolver(
    "gas-station",
    "Gas / Truck Stop",
    "⛽",
    gasStationQuestionsComplete,
    gasStationSections
  ),
  airport: makeCompleteResolver(
    "airport",
    "Airport",
    "✈️",
    airportQuestionsComplete,
    airportSections
  ),
  casino: makeCompleteResolver(
    "casino",
    "Casino & Gaming",
    "🎰",
    casinoQuestionsComplete,
    casinoSections
  ),
  apartment: makeCompleteResolver(
    "apartment",
    "Apartment Complex",
    "🏠",
    apartmentQuestionsComplete,
    apartmentSections
  ),
  college: makeCompleteResolver(
    "college",
    "College / University",
    "🎓",
    collegeQuestionsComplete,
    collegeSections
  ),
  "cold-storage": makeCompleteResolver(
    "cold-storage",
    "Cold Storage",
    "❄️",
    coldStorageQuestionsComplete,
    coldStorageSections
  ),
  "indoor-farm": makeCompleteResolver(
    "indoor-farm",
    "Indoor Farm",
    "🌱",
    indoorFarmQuestionsComplete,
    indoorFarmSections
  ),
  agriculture: makeCompleteResolver(
    "agriculture",
    "Agriculture",
    "🌾",
    agricultureQuestionsComplete,
    agricultureSections
  ),
  residential: makeCompleteResolver(
    "residential",
    "Residential",
    "🏡",
    residentialQuestionsComplete,
    residentialSections
  ),
  government: makeCompleteResolver(
    "government",
    "Government & Public",
    "🏛️",
    governmentQuestionsComplete,
    governmentSections
  ),
  restaurant: makeCompleteResolver(
    "restaurant",
    "Restaurant",
    "🍽️",
    restaurantQuestionsComplete as HotelQuestion[],
    restaurantSections
  ),
  };
}

function resolveLegacySchema(industryKey: string): CuratedSchema | null {
  // Use SSOT helper for key mapping
  const questKey = getLegacyQuestionnaireKey(industryKey);
  const questionnaire = questKey ? industryQuestionnaires[questKey] : null;

  if (!questionnaire) return null;

  const questions = questionnaire.questions.map((q) =>
    convertLegacyQuestion(q, "general", industryKey)
  );

  // Auto-generate sections from question flow
  const sections: CuratedSection[] = [
    { id: "general", label: "Facility Details", icon: "🏢" },
    { id: "operations", label: "Operations", icon: "⚙️" },
    { id: "energy", label: "Energy & Grid", icon: "⚡" },
  ];

  const meta = INDUSTRY_META[industryKey] || INDUSTRY_META["other"];

  return {
    industry: industryKey,
    displayName: meta.displayName,
    icon: meta.icon,
    questions,
    sections,
    questionCount: questions.length,
    requiredCount: questions.filter((q) => q.required).length,
    source: "curated-legacy",
  };
}

// ============================================================================
// FALLBACK SCHEMA (Generic Commercial)
// ============================================================================

function resolveFallbackSchema(industry: string): CuratedSchema {
  const meta = INDUSTRY_META[industry] || INDUSTRY_META["other"];

  const questions: CuratedField[] = [
    {
      id: "facilitySize",
      type: "select",
      section: "facility",
      title: "Facility Size",
      label: "How large is your facility?",
      smartDefault: "medium",
      options: [
        { value: "small", label: "Small", icon: "🟢", description: "< 10,000 sq ft" },
        { value: "medium", label: "Medium", icon: "🟡", description: "10,000 - 50,000 sq ft" },
        { value: "large", label: "Large", icon: "🟠", description: "50,000 - 200,000 sq ft" },
        { value: "enterprise", label: "Enterprise", icon: "🔴", description: "> 200,000 sq ft" },
      ],
      required: true,
      validation: { required: true },
    },
    {
      id: "operatingHours",
      type: "select",
      section: "operations",
      title: "Operating Hours",
      label: "What are your operating hours?",
      smartDefault: "business",
      options: [
        { value: "business", label: "Business Hours", icon: "🏢", description: "8 AM - 6 PM" },
        { value: "extended", label: "Extended", icon: "🌅", description: "6 AM - 10 PM" },
        { value: "24-7", label: "24/7", icon: "🌙", description: "Always Open" },
      ],
      required: true,
      validation: { required: true },
    },
    {
      id: "gridConnection",
      type: "select",
      section: "energy",
      title: "Grid Connection",
      label: "What is your grid connection status?",
      smartDefault: "on-grid",
      options: [
        { value: "on-grid", label: "On-Grid", icon: "🔌", description: "Full utility connection" },
        { value: "limited", label: "Limited", icon: "⚠️", description: "Capacity constraints" },
        { value: "off-grid", label: "Off-Grid", icon: "🏝️", description: "Remote location" },
      ],
      required: true,
      validation: { required: true },
    },
    {
      id: "criticalLoadPct",
      type: "select",
      section: "energy",
      title: "Critical Load",
      label: "What percentage of your load is critical (must not lose power)?",
      smartDefault: "50",
      options: [
        { value: "25", label: "25%", description: "Basic lighting & security" },
        { value: "50", label: "50%", description: "Core operations" },
        { value: "75", label: "75%", description: "Most systems" },
        { value: "100", label: "100%", description: "All systems critical" },
      ],
      required: true,
      validation: { required: true },
    },
    {
      id: "peakDemandKW",
      type: "number",
      section: "energy",
      title: "Peak Demand",
      label: "Estimated peak demand (if known)",
      placeholder: "e.g., 500",
      suffix: "kW",
      required: false,
      validation: { required: false },
    },
    {
      id: "monthlyKWH",
      type: "number",
      section: "energy",
      title: "Monthly Usage",
      label: "Monthly electricity usage (if known)",
      placeholder: "e.g., 50000",
      suffix: "kWh",
      required: false,
      validation: { required: false },
    },
    {
      id: "existingSolar",
      type: "select",
      section: "solar",
      title: "Existing Solar",
      label: "Do you currently have solar installed?",
      smartDefault: "none",
      options: [
        { value: "none", label: "No Solar Yet", icon: "🔌", description: "BESS alone still provides savings" },
        { value: "partial", label: "Some Solar", icon: "☀️", description: "Covers part of your load" },
        { value: "full", label: "Full Solar Array", icon: "🌞", description: "Covers most of your load" },
      ],
      required: true,
      validation: { required: true },
    },
    {
      id: "solarCapacityKW",
      type: "number",
      section: "solar",
      title: "Solar System Size",
      label: "How large is your solar installation?",
      placeholder: "e.g., 200",
      suffix: "kW",
      smartDefault: undefined,
      helpText: "Enter the rated capacity of your solar system. Check your inverter or solar monitoring app.",
      required: false,
      validation: { required: false, min: 1, max: 50000 },
      conditionalLogic: {
        dependsOn: "existingSolar",
        showIf: (value: unknown) => value === "partial" || value === "full",
      },
    },
    {
      id: "primaryGoal",
      type: "select",
      section: "goals",
      title: "Primary Goal",
      label: "What is your primary goal for energy storage?",
      smartDefault: "cost-savings",
      options: [
        {
          value: "cost-savings",
          label: "Cost Savings",
          icon: "💰",
          description: "Reduce utility bills",
        },
        {
          value: "backup-power",
          label: "Backup Power",
          icon: "🔋",
          description: "Resilience during outages",
        },
        {
          value: "peak-shaving",
          label: "Peak Shaving",
          icon: "📉",
          description: "Reduce demand charges",
        },
        {
          value: "sustainability",
          label: "Sustainability",
          icon: "🌍",
          description: "Environmental goals",
        },
      ],
      required: true,
      validation: { required: true },
    },
  ];

  const sections: CuratedSection[] = [
    { id: "facility", label: "Facility", icon: "🏢" },
    { id: "operations", label: "Operations", icon: "⚙️" },
    { id: "energy", label: "Energy & Grid", icon: "⚡" },
    { id: "solar", label: "Solar", icon: "☀️" },
    { id: "goals", label: "Goals", icon: "🎯" },
  ];

  return {
    industry,
    displayName: meta.displayName,
    icon: meta.icon,
    questions,
    sections,
    questionCount: questions.length,
    requiredCount: questions.filter((q) => q.required).length,
    source: "fallback",
  };
}

// ============================================================================
// MAIN RESOLVER
// ============================================================================

/**
 * Resolve Step 3 schema for a given industry.
 *
 * Resolution pathway (single, deterministic):
 *   resolveIndustryContext(industry) → ctx.schemaKey → normalizeIndustrySlug
 *   → COMPLETE_SCHEMAS || resolveLegacySchema || resolveFallbackSchema
 *
 * Borrowing is automatic: ctx.schemaKey encodes the borrow
 * (e.g., restaurant → ctx.schemaKey = "hotel" → COMPLETE_SCHEMAS["hotel"]).
 *
 * @param industry - Any industry slug (e.g., 'car_wash', 'hotel', 'ev-charging', 'restaurant')
 * @returns CuratedSchema with all questions, sections, and metadata
 */
export function resolveStep3Schema(industry: string): CuratedSchema {
  const ctx = resolveIndustryContext(industry);
  const effectiveSchemaKey = normalizeIndustrySlug(ctx.schemaKey);

  // Priority 1: Complete curated schemas (best)
  const complete = getCOMPLETE_SCHEMAS()[effectiveSchemaKey];
  if (complete) {
    const schema = complete();
    if (import.meta.env.DEV) {
      const borrowed =
        ctx.schemaKey !== ctx.canonicalSlug ? ` (borrowed from ${ctx.schemaKey})` : "";
      devLog(
        `[CuratedResolver] ✅ COMPLETE schema for "${industry}"${borrowed} (${schema.questionCount}Q)`
      );
    }
    return schema;
  }

  // Priority 2: Legacy curated schemas (acceptable)
  const legacy = resolveLegacySchema(effectiveSchemaKey);
  if (legacy) {
    if (import.meta.env.DEV) {
      devLog(
        `[CuratedResolver] ✅ LEGACY schema for "${industry}" (${legacy.questionCount}Q)`
      );
    }
    return legacy;
  }

  // Priority 3: Fallback generic schema (always works)
  if (import.meta.env.DEV) {
    devLog(`[CuratedResolver] ⚠️ FALLBACK schema for "${industry}"`);
  }
  return resolveFallbackSchema(effectiveSchemaKey);
}

/**
 * Get display metadata for an industry (name, icon).
 * Resolves through industryCatalog; prefers own display name, falls back to schema owner.
 */
export function getIndustryMeta(industry: string): { displayName: string; icon: string } {
  const ctx = resolveIndustryContext(industry);
  const ownKey = normalizeIndustrySlug(ctx.canonicalSlug);
  return INDUSTRY_META[ownKey] || INDUSTRY_META[ctx.schemaKey] || INDUSTRY_META["other"];
}

/**
 * Check if industry has a curated schema (vs fallback).
 * Shares the same resolution pathway as resolveStep3Schema():
 *   resolveIndustryContext → ctx.schemaKey → normalizeIndustrySlug → lookup
 */
export function hasCuratedSchema(industry: string): boolean {
  const ctx = resolveIndustryContext(industry);
  const effectiveKey = normalizeIndustrySlug(ctx.schemaKey);

  // Complete schemas (unified registry — includes borrowed schemas via ctx.schemaKey)
  if (getCOMPLETE_SCHEMAS()[effectiveKey]) return true;

  // Legacy schemas — single path through effectiveKey, no double-try
  const legacyKey = getLegacyQuestionnaireKey(effectiveKey);
  return !!(legacyKey && industryQuestionnaires[legacyKey]);
}

// ============================================================================
// DEV DIAGNOSTICS (call explicitly, not at module load)
// ============================================================================

export function debugCuratedResolver(): void {
  if (!import.meta.env.DEV) return;

  const allIndustries = Object.keys(INDUSTRY_META);
  const withCurated = allIndustries.filter(hasCuratedSchema);
  const withFallback = allIndustries.filter((i) => !hasCuratedSchema(i));

  devLog("[CuratedResolver] Diagnostics:");
  devLog(`  - Curated: ${withCurated.join(", ")}`);
  devLog(`  - Fallback: ${withFallback.join(", ")}`);
}

export default resolveStep3Schema;
