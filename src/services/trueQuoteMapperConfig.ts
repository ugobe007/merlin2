/**
 * TrueQuote Engine Mapping Configuration
 * ======================================
 * SINGLE SOURCE OF TRUTH for all mappings between:
 * - Database field names → TrueQuote Engine field names
 * - Database subtype values → TrueQuote Engine subtypes
 *
 * This configuration is derived from TrueQuoteEngine.INDUSTRY_CONFIGS
 * and should be validated against the database at build/test time.
 */

import { INDUSTRY_CONFIGS } from "./TrueQuoteEngine";

// ─────────────────────────────────────────────────────────────────────────────
// VALID SUBTYPES (Extracted from TrueQuote Engine)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all valid subtypes for each industry from TrueQuote Engine
 * This is the SINGLE SOURCE OF TRUTH for valid subtypes
 */
export function getValidSubtypes(): Record<string, string[]> {
  const subtypes: Record<string, string[]> = {};

  for (const [industry, config] of Object.entries(INDUSTRY_CONFIGS)) {
    if (config.subtypes && !subtypes[config.slug]) {
      subtypes[config.slug] = Object.keys(config.subtypes);
    }
  }

  return subtypes;
}

/**
 * Valid subtypes per industry (extracted from TrueQuote Engine)
 * This should match INDUSTRY_CONFIGS exactly
 */
export const VALID_SUBTYPES: Record<string, string[]> = {
  "data-center": ["tier_1", "tier_2", "tier_3", "tier_4", "hyperscale"],
  hospital: ["clinic", "community", "regional", "teaching"],
  hotel: ["budget", "midscale", "upscale", "luxury"],
  "ev-charging": ["small", "medium", "large"],
  "car-wash": ["self-service", "express", "full-service"],
  manufacturing: ["lightAssembly", "heavyManufacturing", "foodProcessing", "pharmaceutical"],
  retail: [
    "convenienceStore",
    "gasStationCStore",
    "smallGrocery",
    "largeGrocery",
    "warehouseClub",
    "departmentStore",
    "specialtyRetail",
  ],
  restaurant: ["qsr", "fastCasual", "casualDining", "fineDining", "cafe"],
  office: ["smallOffice", "mediumOffice", "largeOffice", "corporateCampus"],
  university: ["communityCollege", "regionalPublic", "largeState", "majorResearch"],
  agriculture: ["rowCrops", "livestock", "greenhouse", "processing"],
  warehouse: ["general", "coldStorage", "distribution", "fulfillment"],
  casino: ["default"],
  apartment: ["default"],
  "cold-storage": ["default"],
  "shopping-center": ["default"],
  "indoor-farm": ["default"],
  government: ["default"],
};

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE → TRUQUOTE SUBTYPE MAPPINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps database subtype values to TrueQuote Engine subtypes
 * Key: Industry slug
 * Value: Object mapping database values → TrueQuote Engine values
 */
export const SUBTYPE_MAPPINGS: Record<string, Record<string, string>> = {
  "data-center": {
    tier1: "tier_1",
    tier2: "tier_2",
    tier3: "tier_3",
    tier4: "tier_4",
    tier_1: "tier_1",
    tier_2: "tier_2",
    tier_3: "tier_3",
    tier_4: "tier_4",
    hyperscale: "hyperscale",
  },

  hospital: {
    "acute-care": "regional",
    acute_care: "regional",
    "acute care": "regional",
    clinic: "clinic",
    outpatient: "clinic",
    community: "community",
    general: "community",
    regional: "regional",
    "medical-center": "regional",
    teaching: "teaching",
    academic: "teaching",
    "university-hospital": "teaching",
    specialty: "regional", // Specialty hospitals are typically regional
    "specialty-hospital": "regional",
    "critical-access": "community", // Critical access hospitals are small community hospitals
    critical_access: "community",
    rehabilitation: "clinic", // Rehab hospitals are more like clinics
    rehab: "clinic",
  },

  hotel: {
    budget: "budget",
    economy: "budget",
    "1-star": "budget",
    "1_star": "budget",
    midscale: "midscale",
    "select-service": "midscale",
    selectservice: "midscale",
    upscale: "upscale",
    "upper-scale": "upscale",
    upper_scale: "upscale",
    "full-service": "upscale",
    fullservice: "upscale",
    luxury: "luxury",
    resort: "luxury",
    "5-star": "luxury",
    "5_star": "luxury",
    boutique: "upscale", // Boutique hotels are upscale
    "extended-stay": "midscale", // Extended stay is typically midscale
    extended_stay: "midscale",
  },

  "ev-charging": {
    small: "small",
    medium: "medium",
    large: "large",
    public: "small", // Public chargers typically smaller
    fleet: "medium", // Fleet operations medium size
    destination: "small", // Destination chargers smaller
    corridor: "large", // Corridor chargers for highways, larger
    mixed: "medium", // Mixed use, medium size
  },

  "car-wash": {
    "self-service": "self-service",
    self_service: "self-service",
    "self-serve": "self-service",
    express: "express",
    "full-service": "full-service",
    full_service: "full-service",
    tunnel: "full-service",
    "flex-serve": "full-service", // Flex-serve combines self-service and full-service
    flex_serve: "full-service",
    "in-bay": "express", // In-bay automatic is express/tunnel style
    in_bay: "express",
  },

  manufacturing: {
    lightAssembly: "lightAssembly",
    "light-assembly": "lightAssembly",
    heavyAssembly: "heavyAssembly",
    "heavy-assembly": "heavyAssembly",
    processChemical: "processChemical",
    "process-chemical": "processChemical",
    foodBeverage: "foodBeverage",
    "food-beverage": "foodBeverage",
    foodProcessing: "foodBeverage",
    metalsFoundry: "metalsFoundry",
    "metals-foundry": "metalsFoundry",
    plasticsRubber: "plasticsRubber",
    "plastics-rubber": "plasticsRubber",
    pharmaceutical: "pharmaceutical",
    semiconductor: "semiconductor",
    textileApparel: "textileApparel",
    "textile-apparel": "textileApparel",
    woodPaper: "woodPaper",
    "wood-paper": "woodPaper",
    other: "other",
    discrete: "lightAssembly", // Discrete manufacturing is typically light assembly
    process: "processChemical", // Process manufacturing
    mixed: "other", // Mixed manufacturing
    assembly: "lightAssembly", // Assembly work
    machining: "heavyAssembly", // Machining is heavy manufacturing
    cleanroom: "pharmaceutical", // Cleanroom often used for pharma/biotech
  },

  retail: {
    convenienceStore: "convenienceStore",
    "convenience-store": "convenienceStore",
    convenience: "convenienceStore",
    gasStationCStore: "gasStationCStore",
    "gas-station": "gasStationCStore",
    smallGrocery: "smallGrocery",
    "small-grocery": "smallGrocery",
    largeGrocery: "largeGrocery",
    "large-grocery": "largeGrocery",
    grocery: "largeGrocery", // Default to large grocery
    warehouseClub: "warehouseClub",
    "warehouse-club": "warehouseClub",
    departmentStore: "departmentStore",
    "department-store": "departmentStore",
    department: "departmentStore",
    specialtyRetail: "specialtyRetail",
    "specialty-retail": "specialtyRetail",
    specialty: "specialtyRetail",
    bigBox: "warehouseClub", // Large format retail
    "big-box": "warehouseClub",
    mall: "departmentStore", // Map to department store
    "strip-center": "convenienceStore", // Strip centers often convenience stores
    strip_center: "convenienceStore",
  },

  restaurant: {
    qsr: "qsr",
    "quick-service": "qsr",
    fastCasual: "fastCasual",
    "fast-casual": "fastCasual",
    casualDining: "casualDining",
    "casual-dining": "casualDining",
    casual: "casualDining", // Map to casual dining
    fineDining: "fineDining",
    "fine-dining": "fineDining",
    cafe: "cafe",
    "coffee-shop": "cafe",
  },

  office: {
    smallOffice: "smallOffice",
    "small-office": "smallOffice",
    mediumOffice: "mediumOffice",
    "medium-office": "mediumOffice",
    largeOffice: "largeOffice",
    "large-office": "largeOffice",
    corporateCampus: "corporateCampus",
    "corporate-campus": "corporateCampus",
  },

  university: {
    communityCollege: "communityCollege",
    "community-college": "communityCollege",
    community: "communityCollege",
    regionalPublic: "regionalPublic",
    "regional-public": "regionalPublic",
    largeState: "largeState",
    "large-state": "largeState",
    majorResearch: "majorResearch",
    "major-research": "majorResearch",
    "liberal-arts": "regionalPublic", // Liberal arts colleges typically regional
    liberal_arts: "regionalPublic",
    "state-university": "largeState",
    state_university: "largeState",
    "private-university": "regionalPublic", // Private universities typically regional
    private_university: "regionalPublic",
    research: "majorResearch",
    technical: "regionalPublic", // Technical schools typically regional
  },

  agriculture: {
    rowCrops: "rowCrops",
    "row-crops": "rowCrops",
    livestock: "livestock",
    greenhouse: "greenhouse",
    processing: "processing",
    dairy: "livestock",
    orchard: "rowCrops", // Orchard crops
    vegetable: "rowCrops",
    mixed: "rowCrops", // Default to row crops
  },

  warehouse: {
    general: "general",
    coldStorage: "coldStorage",
    "cold-storage": "coldStorage",
    distribution: "distribution",
    fulfillment: "fulfillment",
    manufacturing: "general", // Manufacturing warehouses are general
    "cross-dock": "distribution", // Cross-dock is distribution
    cross_dock: "distribution",
  },

  // Industries with no subtypes (use 'default')
  casino: {
    "destination-resort": "default",
    destination_resort: "default",
    regional: "default",
    tribal: "default",
    riverboat: "default",
    racino: "default",
    "card-room": "default",
    card_room: "default",
  },
  apartment: {
    "garden-style": "default",
    garden_style: "default",
    "mid-rise": "default",
    mid_rise: "default",
    "high-rise": "default",
    high_rise: "default",
    "mixed-use": "default",
    mixed_use: "default",
    townhome: "default",
    senior: "default",
  },
  "cold-storage": {
    "public-warehouse": "default",
    public_warehouse: "default",
    private: "default",
    distribution: "default",
    "food-processing": "default",
    food_processing: "default",
    pharma: "default",
    "blast-freezer": "default",
    blast_freezer: "default",
  },
  "shopping-center": {
    "regional-mall": "default",
    regional_mall: "default",
    "super-regional": "default",
    super_regional: "default",
    lifestyle: "default",
    "power-center": "default",
    power_center: "default",
    outlet: "default",
    community: "default",
  },
  "indoor-farm": {
    "vertical-farm": "default",
    vertical_farm: "default",
    greenhouse: "default",
    container: "default",
    warehouse: "default",
    hybrid: "default",
    cannabis: "default",
  },
  government: {
    "city-hall": "default",
    city_hall: "default",
    courthouse: "default",
    "public-safety": "default",
    public_safety: "default",
    library: "default",
    "community-center": "default",
    community_center: "default",
    transit: "default",
    "water-wastewater": "default",
    water_wastewater: "default",
    "multi-use": "default",
    multi_use: "default",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FIELD NAME MAPPINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps database field names to TrueQuote Engine field names
 * This handles variations in naming conventions
 */
export const FIELD_NAME_MAPPINGS: Record<string, Record<string, string>> = {
  // Hospital fields
  hospital: {
    bedCount: "bedCount",
    beds: "bedCount",
    numberOfBeds: "bedCount",
    icuBeds: "icuBeds",
    operatingRooms: "operatingRooms",
    imagingEquipment: "imagingEquipment",
    hospitalType: "hospitalType",
    hospital_type: "hospitalType",
  },

  // Hotel fields
  hotel: {
    roomCount: "roomCount",
    rooms: "roomCount",
    numberOfRooms: "roomCount",
    numRooms: "roomCount",
    hotelCategory: "hotelCategory",
    hotelType: "hotelCategory",
    hotel_type: "hotelCategory",
    foodBeverage: "foodBeverage",
    spaServices: "spaServices",
    poolType: "poolType",
    meetingSpace: "meetingSpace",
    laundryType: "laundryType",
    fitnessCenter: "fitnessCenter",
  },

  // Data center fields
  "data-center": {
    rackCount: "rackCount",
    racks: "rackCount",
    numberOfRacks: "rackCount",
    dataCenterTier: "dataCenterTier",
    tierClassification: "dataCenterTier",
    powerUsageEffectiveness: "powerUsageEffectiveness",
    targetPUE: "powerUsageEffectiveness",
  },

  // Car wash fields
  "car-wash": {
    bayCount: "bayCount",
    bays: "bayCount",
    numberOfBays: "bayCount",
    tunnelCount: "tunnelCount",
    washType: "washType",
    wash_type: "washType",
  },

  // EV charging fields
  "ev-charging": {
    level2Count: "level2Count",
    dcFastCount: "dcFastCount",
    ultraFastCount: "ultraFastCount",
    dcfc150kwChargers: "dcFastCount",
    dcfc350kwChargers: "ultraFastCount",
  },

  // Common fields (applies to all industries)
  _common: {
    squareFootage: "squareFootage",
    squareFeet: "squareFootage",
    facilitySqFt: "squareFootage",
    buildingSqFt: "squareFootage",
    totalSqFt: "squareFootage",
    storeSqFt: "squareFootage",
    warehouseSqFt: "squareFootage",
    gamingFloorSize: "squareFootage",
    growingAreaSqFt: "squareFootage",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SUBTYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default subtype to use if mapping fails
 */
export const DEFAULT_SUBTYPES: Record<string, string> = {
  "data-center": "tier_3",
  hospital: "community",
  hotel: "midscale",
  "ev-charging": "small",
  "car-wash": "express",
  manufacturing: "lightAssembly",
  retail: "convenienceStore",
  restaurant: "qsr",
  office: "smallOffice",
  university: "regionalPublic",
  agriculture: "rowCrops",
  warehouse: "general",
  casino: "default",
  apartment: "default",
  "cold-storage": "default",
  "shopping-center": "default",
  "indoor-farm": "default",
  government: "default",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map database subtype value to TrueQuote Engine subtype
 */
export function mapSubtype(industry: string, dbValue: string | undefined | null): string {
  if (!dbValue) {
    return DEFAULT_SUBTYPES[industry] || "default";
  }

  const mappings = SUBTYPE_MAPPINGS[industry];
  if (!mappings) {
    return DEFAULT_SUBTYPES[industry] || "default";
  }

  const normalized = String(dbValue).toLowerCase().trim();
  return mappings[normalized] || DEFAULT_SUBTYPES[industry] || "default";
}

/**
 * Map database field name to TrueQuote Engine field name
 */
export function mapFieldName(industry: string, dbFieldName: string): string {
  // Check industry-specific mappings first
  const industryMappings = FIELD_NAME_MAPPINGS[industry];
  if (industryMappings && industryMappings[dbFieldName]) {
    return industryMappings[dbFieldName];
  }

  // Check common mappings
  const commonMappings = FIELD_NAME_MAPPINGS["_common"];
  if (commonMappings && commonMappings[dbFieldName]) {
    return commonMappings[dbFieldName];
  }

  // Return as-is if no mapping found
  return dbFieldName;
}

/**
 * Validate that a subtype is valid for an industry
 */
export function isValidSubtype(industry: string, subtype: string): boolean {
  const valid = VALID_SUBTYPES[industry];
  if (!valid) return false;
  return valid.includes(subtype);
}
