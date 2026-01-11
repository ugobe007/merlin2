/**
 * @deprecated This file is being phased out in favor of the Porsche 911 Architecture.
 * 
 * NEW ARCHITECTURE (use these instead):
 * - MerlinOrchestrator.ts - General contractor
 * - TrueQuoteEngineV2.ts - Prime sub contractor (SSOT)
 * - calculators/*.ts - Modular calculation functions
 * - MagicFit.ts - Option generation
 * - validators/proposalValidator.ts - Authentication
 * 
 * This file is kept temporarily for:
 * - useTrueQuote.ts hook (powers TrueQuoteVerifyBadge)
 * - TRUEQUOTE_CONSTANTS (being moved to data/constants.ts)
 * - INDUSTRY_CONFIGS (being moved to data/industryConfigs.ts)
 * 
 * Migration target: Q1 2026
 */

/**
 * TRUEQUOTE™ CALCULATION ENGINE v2.0.0
 * THE SINGLE SOURCE OF TRUTH FOR ALL MERLIN CALCULATIONS
 * @author Merlin Energy
 * @version 2.0.0
 * @date January 2026
 */

// Slug aliases for industry type normalization
const SLUG_ALIASES: Record<string, string> = {
  "college": "university",
  "agricultural": "agriculture",
  "hotel-hospitality": "hotel",
  "backup-critical-infrastructure": "data-center",
  "peak-shaving-commercial": "manufacturing",
  "energy-arbitrage-utility": "data-center",
};

export const TRUEQUOTE_CONSTANTS = {
  BESS_COST_PER_KWH: 350,
  BESS_EFFICIENCY: 0.85,
  BESS_DEGRADATION_ANNUAL: 0.025,
  BESS_LIFETIME_YEARS: 15,
  SOLAR_COST_PER_KWP: 1200,
  SOLAR_PANEL_WATTS: 500,
  SOLAR_CAPACITY_FACTOR: 0.2,
  SOLAR_DEGRADATION_ANNUAL: 0.005,
  SOLAR_LIFETIME_YEARS: 25,
  GENERATOR_COST_PER_KW: 800,
  GENERATOR_FUEL_COST: 4.0,
  GENERATOR_EFFICIENCY: 0.35,
  EV_LEVEL2_KW: 19.2,
  EV_LEVEL2_COST: 6000,
  EV_DCFAST_KW: 150,
  EV_DCFAST_COST: 50000,
  EV_ULTRAFAST_KW: 350,
  EV_ULTRAFAST_COST: 150000,
  INSTALLATION_PERCENT: 0.15,
  FEDERAL_ITC_RATE: 0.3,
  DISCOUNT_RATE: 0.08,
  ELECTRICITY_ESCALATION: 0.03,
  PROJECT_LIFETIME_YEARS: 25,
  PEAK_SHAVING_PERCENT: 0.25,
  ARBITRAGE_CYCLES_YEAR: 250,
  ARBITRAGE_SPREAD: 0.06,
  CO2_KG_PER_KWH: 0.4,
  CO2_PER_TREE_YEAR: 22,
  CO2_PER_CAR_YEAR: 4600,
  DEVIATION_WARN_PERCENT: 15,
  DEVIATION_CRITICAL_PERCENT: 50,
} as const;

// INTERFACES
export interface IndustryConfig {
  slug: string;
  name: string;
  subtypes: Record<string, SubtypeConfig>;
  powerCalculation: PowerCalculationConfig;
  bessDefaults: BESSDefaults;
  financialDefaults: FinancialDefaults;
  recommendations: RecommendationRules;
}

export interface SubtypeConfig {
  name: string;
  bessMultiplier: number;
  criticalLoadPercent: number;
  durationHours: number;
  generatorRequired: boolean;
  generatorSizing?: number;
  description?: string;
}

export interface PowerCalculationConfig {
  method: "per_unit" | "per_sqft" | "fixed" | "charger_sum";
  unitName?: string;
  wattsPerUnit?: number;
  wattsPerSqft?: number;
  baseLoadKW?: number;
  modifiers?: PowerModifier[];
}

export interface PowerModifier {
  name: string;
  trigger: string;
  multiplier: number;
}

export interface BESSDefaults {
  minPowerKW: number;
  maxPowerKW: number;
  defaultDurationHours: number;
}

export interface FinancialDefaults {
  peakShavingPercent: number;
  arbitrageSpread: number;
}

export interface RecommendationRules {
  solarRecommended: boolean;
  solarCondition?: string;
  generatorCondition?: string;
}

export interface TrueQuoteInput {
  location: { zipCode: string; state?: string };
  industry: { type: string; subtype: string; facilityData: Record<string, any> };
  options: {
    solarEnabled?: boolean;
    evChargingEnabled?: boolean;
    generatorEnabled?: boolean;
    level2Chargers?: number;
    dcFastChargers?: number;
    ultraFastChargers?: number;
  };
}

export interface TrueQuoteResult {
  quoteId: string;
  generatedAt: string;
  engineVersion: string;
  inputs: {
    location: LocationData;
    industry: { type: string; typeName: string; subtype: string; subtypeName: string; facilityData: Record<string, any> };
    options: TrueQuoteInput["options"];
  };
  results: {
    peakDemandKW: number;
    bess: { powerKW: number; energyKWh: number; durationHours: number; cost: number };
    solar?: { capacityKWp: number; annualProductionKWh: number; cost: number };
    evCharging?: { level2Count: number; dcFastCount: number; ultraFastCount: number; totalPowerKW: number; cost: number };
    generator?: { capacityKW: number; required: boolean; cost: number };
    financial: {
      totalInvestment: number; federalITC: number; stateIncentives: number; netCost: number;
      annualSavings: number; paybackYears: number; fiveYearROI: number; twentyFiveYearNPV: number;
    };
    emissions: { annualCO2OffsetKg: number; equivalentTreesPlanted: number; equivalentCarsRemoved: number };
  };
  calculationSteps: CalculationStep[];
  sources: SourceCitation[];
}

export interface CalculationStep {
  stepNumber: number;
  category: string;
  name: string;
  description: string;
  formula: string;
  calculation: string;
  inputs: { name: string; value: any; unit?: string; source: string }[];
  output: { name: string; value: number; unit: string };
  benchmark?: { source: string; range: string; status: "pass" | "warn" | "fail" };
  notes?: string;
}

export interface SourceCitation {
  id: string;
  shortName: string;
  fullName: string;
  url?: string;
  description?: string;
  dataPoints?: string[];
  organization?: string;
  year?: number;
  usedFor?: string[];
}

interface LocationData {
  state: string;
  electricityRate: number;
  demandChargeRate: number;
  sunHours: number;
  utilityName: string;
}

// INDUSTRY CONFIGS
const DATA_CENTER_CONFIG: IndustryConfig = {
  slug: "data-center", name: "Data Center",
  subtypes: {
    tier_1: { name: "Tier I (Basic)", bessMultiplier: 0.3, criticalLoadPercent: 1.0, durationHours: 4, generatorRequired: false },
    tier_2: { name: "Tier II (Redundant)", bessMultiplier: 0.4, criticalLoadPercent: 1.0, durationHours: 4, generatorRequired: true, generatorSizing: 1.15 },
    tier_3: { name: "Tier III (Maintainable)", bessMultiplier: 0.5, criticalLoadPercent: 1.0, durationHours: 4, generatorRequired: true, generatorSizing: 1.25 },
    tier_4: { name: "Tier IV (Fault Tolerant)", bessMultiplier: 0.6, criticalLoadPercent: 1.0, durationHours: 4, generatorRequired: true, generatorSizing: 1.5 },
    hyperscale: { name: "Hyperscale", bessMultiplier: 0.4, criticalLoadPercent: 1.0, durationHours: 4, generatorRequired: true, generatorSizing: 1.25 },
  },
  powerCalculation: {
    method: "per_unit", unitName: "racks", wattsPerUnit: 5000,
    modifiers: [
      { name: "PUE", trigger: "currentPUE", multiplier: 1.6 },
      { name: "High Density", trigger: "highDensity", multiplier: 3.0 },
      { name: "GPU/AI Workloads", trigger: "hasGPU", multiplier: 8.0 },
    ],
  },
  bessDefaults: { minPowerKW: 100, maxPowerKW: 50000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.25, arbitrageSpread: 0.06 },
  recommendations: { solarRecommended: true, generatorCondition: "tier_2,tier_3,tier_4,hyperscale" },
};

const HOSPITAL_CONFIG: IndustryConfig = {
  slug: "hospital", name: "Hospital / Healthcare",
  subtypes: {
    clinic: { name: "Clinic / Urgent Care", bessMultiplier: 0.4, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
    community: { name: "Community Hospital", bessMultiplier: 0.5, criticalLoadPercent: 0.85, durationHours: 4, generatorRequired: true, generatorSizing: 1.25 },
    regional: { name: "Regional Hospital", bessMultiplier: 0.5, criticalLoadPercent: 0.85, durationHours: 4, generatorRequired: true, generatorSizing: 1.25 },
    teaching: { name: "Teaching Hospital", bessMultiplier: 0.6, criticalLoadPercent: 0.9, durationHours: 4, generatorRequired: true, generatorSizing: 1.5 },
  },
  powerCalculation: {
    method: "per_unit", unitName: "beds", wattsPerUnit: 5000, // ASHRAE standard: 4-6 kW/bed, use 5 kW (5000W) as default
    modifiers: [
      { name: "ICU", trigger: "icuBeds", multiplier: 1.1 },
      { name: "Operating Rooms", trigger: "operatingRooms", multiplier: 1.05 },
      { name: "MRI/Imaging", trigger: "imagingEquipment", multiplier: 1.05 },
    ],
  },
  bessDefaults: { minPowerKW: 50, maxPowerKW: 10000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.2, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true, generatorCondition: "community,regional,teaching" },
};

const HOTEL_CONFIG: IndustryConfig = {
  slug: "hotel", name: "Hotel / Hospitality",
  subtypes: {
    budget: { name: "Budget / Economy", bessMultiplier: 0.4, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false },
    midscale: { name: "Midscale", bessMultiplier: 0.4, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
    upscale: { name: "Upscale", bessMultiplier: 0.5, criticalLoadPercent: 0.6, durationHours: 4, generatorRequired: true, generatorSizing: 1.2 },
    luxury: { name: "Luxury / Resort", bessMultiplier: 0.5, criticalLoadPercent: 0.7, durationHours: 4, generatorRequired: true, generatorSizing: 1.25 },
  },
  powerCalculation: {
    method: "per_unit", unitName: "rooms", wattsPerUnit: 3500, // Industry standard: 3-4 kW/room peak, use 3.5 kW (3500W) as default
    modifiers: [
      { name: "Restaurant", trigger: "foodBeverage", multiplier: 1.15 },
      { name: "Spa", trigger: "spaServices", multiplier: 1.1 },
      { name: "Pool", trigger: "poolType", multiplier: 1.05 },
      { name: "Conference Center", trigger: "meetingSpace", multiplier: 1.2 },
    ],
  },
  bessDefaults: { minPowerKW: 25, maxPowerKW: 5000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.25, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true, generatorCondition: "upscale,luxury" },
};

const EV_CHARGING_CONFIG: IndustryConfig = {
  slug: "ev-charging", name: "EV Charging Hub",
  subtypes: {
    small: { name: "Small (<10 chargers)", bessMultiplier: 0.6, criticalLoadPercent: 0.3, durationHours: 2, generatorRequired: false },
    medium: { name: "Medium (10-50 chargers)", bessMultiplier: 0.6, criticalLoadPercent: 0.3, durationHours: 2, generatorRequired: false },
    large: { name: "Large (50+ chargers)", bessMultiplier: 0.5, criticalLoadPercent: 0.3, durationHours: 2, generatorRequired: false },
  },
  powerCalculation: { method: "charger_sum" },
  bessDefaults: { minPowerKW: 50, maxPowerKW: 20000, defaultDurationHours: 2 },
  financialDefaults: { peakShavingPercent: 0.4, arbitrageSpread: 0.08 },
  recommendations: { solarRecommended: true },
};

const CAR_WASH_CONFIG: IndustryConfig = {
  slug: "car-wash", name: "Car Wash",
  subtypes: {
    "self-service": { name: "Self-Service", bessMultiplier: 0.35, criticalLoadPercent: 0.3, durationHours: 4, generatorRequired: false },
    express: { name: "Express / Tunnel", bessMultiplier: 0.4, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
    "full-service": { name: "Full Service", bessMultiplier: 0.45, criticalLoadPercent: 0.6, durationHours: 4, generatorRequired: false },
  },
  powerCalculation: {
    method: "per_unit", unitName: "bays", wattsPerUnit: 50000,
    modifiers: [
      { name: "Vacuums", trigger: "vacuumStations", multiplier: 1.15 },
      { name: "Dryers", trigger: "dryerBlowers", multiplier: 1.15 },
    ],
  },
  bessDefaults: { minPowerKW: 25, maxPowerKW: 1000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.3, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true },
};

// MORE INDUSTRY CONFIGS
const MANUFACTURING_CONFIG: IndustryConfig = {
  slug: "manufacturing", name: "Manufacturing",
  subtypes: {
    lightAssembly: { name: "Light Assembly", bessMultiplier: 0.4, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false },
    heavyAssembly: { name: "Heavy Assembly", bessMultiplier: 0.45, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
    processChemical: { name: "Process / Chemical", bessMultiplier: 0.5, criticalLoadPercent: 0.8, durationHours: 4, generatorRequired: true, generatorSizing: 1.25 },
    foodBeverage: { name: "Food & Beverage", bessMultiplier: 0.45, criticalLoadPercent: 0.6, durationHours: 4, generatorRequired: true, generatorSizing: 1.2 },
    pharmaceutical: { name: "Pharmaceutical", bessMultiplier: 0.5, criticalLoadPercent: 0.85, durationHours: 4, generatorRequired: true, generatorSizing: 1.3 },
    other: { name: "Other Manufacturing", bessMultiplier: 0.4, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false },
  },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 15.0, modifiers: [{ name: "Large Motors", trigger: "largeLoads", multiplier: 1.2 }] },
  bessDefaults: { minPowerKW: 100, maxPowerKW: 10000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.3, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true },
};

const RETAIL_CONFIG: IndustryConfig = {
  slug: "retail", name: "Retail / Commercial",
  subtypes: {
    convenienceStore: { name: "Convenience Store", bessMultiplier: 0.4, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false },
    smallGrocery: { name: "Small Grocery", bessMultiplier: 0.45, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
    largeGrocery: { name: "Large Grocery", bessMultiplier: 0.45, criticalLoadPercent: 0.55, durationHours: 4, generatorRequired: false },
    departmentStore: { name: "Department Store", bessMultiplier: 0.4, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false },
  },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 8.0, modifiers: [{ name: "Walk-in Cooler", trigger: "walkInCooler", multiplier: 1.1 }, { name: "Walk-in Freezer", trigger: "walkInFreezer", multiplier: 1.2 }] },
  bessDefaults: { minPowerKW: 25, maxPowerKW: 5000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.25, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true },
};

const RESTAURANT_CONFIG: IndustryConfig = {
  slug: "restaurant", name: "Restaurant",
  subtypes: {
    qsr: { name: "Quick Service (QSR)", bessMultiplier: 0.4, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false },
    fastCasual: { name: "Fast Casual", bessMultiplier: 0.4, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false },
    casualDining: { name: "Casual Dining", bessMultiplier: 0.45, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
    fineDining: { name: "Fine Dining", bessMultiplier: 0.45, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
  },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 2.0, modifiers: [{ name: "Drive-Thru", trigger: "hasDriveThru", multiplier: 1.05 }] },
  bessDefaults: { minPowerKW: 25, maxPowerKW: 2000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.3, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true },
};

const OFFICE_CONFIG: IndustryConfig = {
  slug: "office", name: "Office Building",
  subtypes: {
    smallOffice: { name: "Small Office", bessMultiplier: 0.35, criticalLoadPercent: 0.3, durationHours: 4, generatorRequired: false },
    midRise: { name: "Mid-Rise", bessMultiplier: 0.4, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false },
    highRise: { name: "High-Rise", bessMultiplier: 0.45, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: true, generatorSizing: 1.2 },
    medicalOffice: { name: "Medical Office", bessMultiplier: 0.45, criticalLoadPercent: 0.6, durationHours: 4, generatorRequired: true, generatorSizing: 1.25 },
  },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 6.0, modifiers: [{ name: "Data Center", trigger: "dataCenterKw", multiplier: 1.2 }, { name: "Elevators", trigger: "elevatorCount", multiplier: 1.05 }] },
  bessDefaults: { minPowerKW: 25, maxPowerKW: 5000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.2, arbitrageSpread: 0.04 },
  recommendations: { solarRecommended: true, generatorCondition: "highRise,medicalOffice" },
};

const UNIVERSITY_CONFIG: IndustryConfig = {
  slug: "university", name: "University / Campus",
  subtypes: {
    communityCollege: { name: "Community College", bessMultiplier: 0.4, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false },
    smallPrivate: { name: "Small Private", bessMultiplier: 0.45, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
    regionalPublic: { name: "Regional Public", bessMultiplier: 0.45, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: true, generatorSizing: 1.2 },
    largeState: { name: "Large State", bessMultiplier: 0.5, criticalLoadPercent: 0.6, durationHours: 4, generatorRequired: true, generatorSizing: 1.25 },
    majorResearch: { name: "Major Research", bessMultiplier: 0.5, criticalLoadPercent: 0.7, durationHours: 4, generatorRequired: true, generatorSizing: 1.3 },
  },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 0.8, modifiers: [{ name: "Research", trigger: "facilityTypes", multiplier: 1.3 }, { name: "Housing", trigger: "facilityTypes", multiplier: 1.2 }, { name: "Athletics", trigger: "facilityTypes", multiplier: 1.1 }] },
  bessDefaults: { minPowerKW: 100, maxPowerKW: 50000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.25, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true, generatorCondition: "regionalPublic,largeState,majorResearch" },
};

const AGRICULTURE_CONFIG: IndustryConfig = {
  slug: "agriculture", name: "Agriculture / Farming",
  subtypes: {
    rowCrops: { name: "Row Crops (Irrigated)", bessMultiplier: 0.4, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
    dairy: { name: "Dairy", bessMultiplier: 0.45, criticalLoadPercent: 0.6, durationHours: 4, generatorRequired: false },
    greenhouse: { name: "Greenhouse", bessMultiplier: 0.45, criticalLoadPercent: 0.6, durationHours: 4, generatorRequired: false },
  },
  powerCalculation: { method: "fixed", baseLoadKW: 100 }, // Uses calculateAgriculturePower() via facilityData.peakDemandKW (based on acres × kW/acre + irrigationKW)
  bessDefaults: { minPowerKW: 50, maxPowerKW: 5000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.35, arbitrageSpread: 0.06 },
  recommendations: { solarRecommended: true },
};

const WAREHOUSE_CONFIG: IndustryConfig = {
  slug: "warehouse", name: "Warehouse / Logistics",
  subtypes: {
    general: { name: "General Storage", bessMultiplier: 0.35, criticalLoadPercent: 0.3, durationHours: 4, generatorRequired: false },
    climateControlled: { name: "Climate-Controlled", bessMultiplier: 0.4, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
    refrigerated: { name: "Refrigerated", bessMultiplier: 0.45, criticalLoadPercent: 0.6, durationHours: 4, generatorRequired: true, generatorSizing: 1.25 },
    frozen: { name: "Frozen", bessMultiplier: 0.5, criticalLoadPercent: 0.7, durationHours: 4, generatorRequired: true, generatorSizing: 1.3 },
  },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 2.0, modifiers: [{ name: "Electric Forklifts", trigger: "fleetElectrification", multiplier: 1.1 }] },
  bessDefaults: { minPowerKW: 50, maxPowerKW: 10000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.3, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true, generatorCondition: "refrigerated,frozen" },
};

// SIMPLE INDUSTRY CONFIGS + REGISTRY
const CASINO_CONFIG: IndustryConfig = {
  slug: "casino", name: "Casino / Gaming",
  subtypes: { default: { name: "Casino", bessMultiplier: 0.5, criticalLoadPercent: 0.6, durationHours: 4, generatorRequired: true, generatorSizing: 1.3 } },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 18 },
  bessDefaults: { minPowerKW: 200, maxPowerKW: 50000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.4, arbitrageSpread: 0.08 },
  recommendations: { solarRecommended: true },
};

const APARTMENT_CONFIG: IndustryConfig = {
  slug: "apartment", name: "Apartment Building",
  subtypes: { default: { name: "Apartment Complex", bessMultiplier: 0.35, criticalLoadPercent: 0.3, durationHours: 4, generatorRequired: false } },
  powerCalculation: { method: "per_unit", unitName: "units", wattsPerUnit: 1800 },
  bessDefaults: { minPowerKW: 50, maxPowerKW: 5000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.25, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true },
};

const COLD_STORAGE_CONFIG: IndustryConfig = {
  slug: "cold-storage", name: "Cold Storage",
  subtypes: { default: { name: "Cold Storage", bessMultiplier: 0.6, criticalLoadPercent: 0.8, durationHours: 8, generatorRequired: true, generatorSizing: 1.4 } },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 8 },
  bessDefaults: { minPowerKW: 100, maxPowerKW: 20000, defaultDurationHours: 8 },
  financialDefaults: { peakShavingPercent: 0.35, arbitrageSpread: 0.06 },
  recommendations: { solarRecommended: false },
};

const SHOPPING_CENTER_CONFIG: IndustryConfig = {
  slug: "shopping-center", name: "Shopping Center / Mall",
  subtypes: { default: { name: "Shopping Center", bessMultiplier: 0.45, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false } },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 10 },
  bessDefaults: { minPowerKW: 100, maxPowerKW: 30000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.35, arbitrageSpread: 0.07 },
  recommendations: { solarRecommended: true },
};

const INDOOR_FARM_CONFIG: IndustryConfig = {
  slug: "indoor-farm", name: "Indoor Farm / Vertical Farm",
  subtypes: { default: { name: "Indoor Farm", bessMultiplier: 0.55, criticalLoadPercent: 0.7, durationHours: 6, generatorRequired: true, generatorSizing: 1.35, description: "High-intensity grow lights + HVAC: 40-60 W/sq ft peak" } },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 50.0 }, // POWER_DENSITY_STANDARDS: 40-60 W/sq ft, use 50 W/sq ft
  bessDefaults: { minPowerKW: 100, maxPowerKW: 20000, defaultDurationHours: 6 },
  financialDefaults: { peakShavingPercent: 0.4, arbitrageSpread: 0.08 },
  recommendations: { solarRecommended: true },
};

const GOVERNMENT_CONFIG: IndustryConfig = {
  slug: "government", name: "Government Building",
  subtypes: { default: { name: "Government Facility", bessMultiplier: 0.6, criticalLoadPercent: 0.7, durationHours: 8, generatorRequired: true, generatorSizing: 1.4, description: "FEMP benchmark: 1.5 W/sq ft for public buildings" } },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 1.5 },
  bessDefaults: { minPowerKW: 100, maxPowerKW: 30000, defaultDurationHours: 8 },
  financialDefaults: { peakShavingPercent: 0.3, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true },
};

const TRUCK_STOP_CONFIG: IndustryConfig = {
  slug: "heavy_duty_truck_stop", name: "Heavy Duty Truck Stop / Travel Center",
  subtypes: {
    default: { name: "Truck Stop / Travel Center", bessMultiplier: 0.5, criticalLoadPercent: 0.7, durationHours: 6, generatorRequired: true, generatorSizing: 1.3, description: "High-voltage nodes with extreme demand profiles from MW-class charging, heavy industrial equipment, and 24/7 hospitality operations" },
    loves_travel_stops: { name: "Love's Travel Stop", bessMultiplier: 0.5, criticalLoadPercent: 0.7, durationHours: 6, generatorRequired: true, generatorSizing: 1.3 },
    pilot_flying_j: { name: "Pilot Flying J", bessMultiplier: 0.5, criticalLoadPercent: 0.7, durationHours: 6, generatorRequired: true, generatorSizing: 1.3 },
    ta_petro: { name: "TA Petro", bessMultiplier: 0.5, criticalLoadPercent: 0.7, durationHours: 6, generatorRequired: true, generatorSizing: 1.3 },
    travel_centers_of_america: { name: "Travel Centers of America", bessMultiplier: 0.5, criticalLoadPercent: 0.7, durationHours: 6, generatorRequired: true, generatorSizing: 1.3 },
    independent_truck_plaza: { name: "Independent Truck Plaza", bessMultiplier: 0.5, criticalLoadPercent: 0.7, durationHours: 6, generatorRequired: true, generatorSizing: 1.3 },
  },
  powerCalculation: { method: "fixed", baseLoadKW: 1000 }, // Will use custom calculator via facilityData.peakDemandKW if available
  bessDefaults: { minPowerKW: 200, maxPowerKW: 20000, defaultDurationHours: 6 },
  financialDefaults: { peakShavingPercent: 0.35, arbitrageSpread: 0.07 },
  recommendations: { solarRecommended: true, generatorCondition: "default" },
};

const AIRPORT_CONFIG: IndustryConfig = {
  slug: "airport", name: "Airport / Aviation",
  subtypes: {
    default: { name: "Small Regional Airport", bessMultiplier: 0.5, criticalLoadPercent: 0.75, durationHours: 2, generatorRequired: true, generatorSizing: 1.3, description: "Based on annual passengers: <1M = 2-6MW" },
    smallRegional: { name: "Small Regional (<1M passengers)", bessMultiplier: 0.5, criticalLoadPercent: 0.75, durationHours: 2, generatorRequired: true, generatorSizing: 1.3 },
    mediumRegional: { name: "Medium Regional (1-5M passengers)", bessMultiplier: 0.5, criticalLoadPercent: 0.75, durationHours: 2, generatorRequired: true, generatorSizing: 1.3 },
    largeRegional: { name: "Large Regional (5-15M passengers)", bessMultiplier: 0.5, criticalLoadPercent: 0.75, durationHours: 2, generatorRequired: true, generatorSizing: 1.3 },
    majorHub: { name: "Major Hub (15-50M passengers)", bessMultiplier: 0.5, criticalLoadPercent: 0.8, durationHours: 2, generatorRequired: true, generatorSizing: 1.4 },
    megaHub: { name: "Mega Hub (50M+ passengers)", bessMultiplier: 0.5, criticalLoadPercent: 0.85, durationHours: 2, generatorRequired: true, generatorSizing: 1.4 },
  },
  powerCalculation: { method: "fixed", baseLoadKW: 2000 }, // Uses calculateAirportPower() via facilityData.peakDemandKW (based on annualPassengersMillions)
  bessDefaults: { minPowerKW: 125, maxPowerKW: 250000, defaultDurationHours: 2 },
  financialDefaults: { peakShavingPercent: 0.3, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true, generatorCondition: "default" },
};

const GAS_STATION_CONFIG: IndustryConfig = {
  slug: "gas_station", name: "Gas Station / Convenience Store",
  subtypes: {
    default: { name: "Gas Station with C-Store", bessMultiplier: 0.4, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false, description: "NACS benchmark: 1.5 kW/dispenser + 15 kW store" },
    "gas-only": { name: "Gas Only (No Store)", bessMultiplier: 0.35, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false },
    "with-cstore": { name: "Gas Station with C-Store", bessMultiplier: 0.4, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
    "truck-stop": { name: "Truck Stop", bessMultiplier: 0.5, criticalLoadPercent: 0.7, durationHours: 6, generatorRequired: true, generatorSizing: 1.3 },
  },
  powerCalculation: { method: "fixed", baseLoadKW: 50 }, // Uses calculateGasStationPower() via facilityData.peakDemandKW (based on dispenserCount + hasConvenienceStore)
  bessDefaults: { minPowerKW: 10, maxPowerKW: 2000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.3, arbitrageSpread: 0.05 },
  recommendations: { solarRecommended: true },
};

const RESIDENTIAL_CONFIG: IndustryConfig = {
  slug: "residential", name: "Residential",
  subtypes: {
    default: { name: "Single Family Home", bessMultiplier: 0.3, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false, description: "RECS benchmark: 5 W/sq ft peak demand" },
    "single-family": { name: "Single Family Home", bessMultiplier: 0.3, criticalLoadPercent: 0.4, durationHours: 4, generatorRequired: false },
    "multi-family": { name: "Multi-Family Building", bessMultiplier: 0.35, criticalLoadPercent: 0.5, durationHours: 4, generatorRequired: false },
  },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 5.0 }, // RECS benchmark: 5 W/sq ft peak
  bessDefaults: { minPowerKW: 5, maxPowerKW: 100, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.25, arbitrageSpread: 0.04 },
  recommendations: { solarRecommended: true },
};

const MICROGRID_CONFIG: IndustryConfig = {
  slug: "microgrid", name: "Microgrid / Renewable Energy",
  subtypes: {
    default: { name: "Grid-Tied Microgrid", bessMultiplier: 0.5, criticalLoadPercent: 0.6, durationHours: 4, generatorRequired: false, description: "Mixed-load benchmark: 8 W/sq ft for grid-tied systems" },
    "grid-tied": { name: "Grid-Tied Microgrid", bessMultiplier: 0.5, criticalLoadPercent: 0.6, durationHours: 4, generatorRequired: false },
    "islanded": { name: "Islanded Microgrid", bessMultiplier: 0.7, criticalLoadPercent: 1.0, durationHours: 12, generatorRequired: true, generatorSizing: 1.5, description: "Islanded systems require full backup capacity and longer duration" },
  },
  powerCalculation: { method: "per_sqft", wattsPerSqft: 8.0, modifiers: [{ name: "Renewable Integration", trigger: "renewableCapacity", multiplier: 1.2 }] },
  bessDefaults: { minPowerKW: 100, maxPowerKW: 10000, defaultDurationHours: 4 },
  financialDefaults: { peakShavingPercent: 0.4, arbitrageSpread: 0.08 },
  recommendations: { solarRecommended: true, generatorCondition: "islanded" },
};

// INDUSTRY REGISTRY
export const INDUSTRY_CONFIGS: Record<string, IndustryConfig> = {
  "data-center": DATA_CENTER_CONFIG, data_center: DATA_CENTER_CONFIG,
  hospital: HOSPITAL_CONFIG,
  hotel: HOTEL_CONFIG,
  "ev-charging": EV_CHARGING_CONFIG, ev_charging: EV_CHARGING_CONFIG,
  "car-wash": CAR_WASH_CONFIG, car_wash: CAR_WASH_CONFIG,
  manufacturing: MANUFACTURING_CONFIG,
  retail: RETAIL_CONFIG,
  restaurant: RESTAURANT_CONFIG,
  office: OFFICE_CONFIG,
  university: UNIVERSITY_CONFIG, college: UNIVERSITY_CONFIG,
  agriculture: AGRICULTURE_CONFIG,
  warehouse: WAREHOUSE_CONFIG,
  casino: CASINO_CONFIG,
  apartment: APARTMENT_CONFIG, apartments: APARTMENT_CONFIG, "apartment-building": APARTMENT_CONFIG,
  "cold-storage": COLD_STORAGE_CONFIG, cold_storage: COLD_STORAGE_CONFIG,
  "shopping-center": SHOPPING_CENTER_CONFIG, "shopping-mall": SHOPPING_CENTER_CONFIG,
  "indoor-farm": INDOOR_FARM_CONFIG, indoor_farm: INDOOR_FARM_CONFIG,
  government: GOVERNMENT_CONFIG, "public-building": GOVERNMENT_CONFIG,
  "heavy-duty-truck-stop": TRUCK_STOP_CONFIG, "heavy_duty_truck_stop": TRUCK_STOP_CONFIG, "truck-stop": TRUCK_STOP_CONFIG, "truck_stop": TRUCK_STOP_CONFIG,
  airport: AIRPORT_CONFIG,
  "gas-station": GAS_STATION_CONFIG, gas_station: GAS_STATION_CONFIG,
  residential: RESIDENTIAL_CONFIG,
  microgrid: MICROGRID_CONFIG,
};

// STATE DATA + HELPER FUNCTIONS
const STATE_DATA: Record<string, LocationData> = {
  NV: { state: "NV", electricityRate: 0.0934, demandChargeRate: 12.5, sunHours: 6.4, utilityName: "NV Energy" },
  CA: { state: "CA", electricityRate: 0.225, demandChargeRate: 22.0, sunHours: 5.8, utilityName: "PG&E/SCE/SDG&E" },
  AZ: { state: "AZ", electricityRate: 0.115, demandChargeRate: 11.0, sunHours: 6.6, utilityName: "APS/SRP" },
  TX: { state: "TX", electricityRate: 0.118, demandChargeRate: 10.5, sunHours: 5.5, utilityName: "ERCOT" },
  FL: { state: "FL", electricityRate: 0.128, demandChargeRate: 11.0, sunHours: 5.4, utilityName: "FPL/Duke" },
  NY: { state: "NY", electricityRate: 0.195, demandChargeRate: 18.0, sunHours: 4.2, utilityName: "ConEd/PSEG" },
  CO: { state: "CO", electricityRate: 0.128, demandChargeRate: 13.0, sunHours: 5.5, utilityName: "Xcel" },
  WA: { state: "WA", electricityRate: 0.098, demandChargeRate: 8.5, sunHours: 4.0, utilityName: "PSE/Avista" },
  MA: { state: "MA", electricityRate: 0.22, demandChargeRate: 16.0, sunHours: 4.3, utilityName: "National Grid" },
  IL: { state: "IL", electricityRate: 0.135, demandChargeRate: 12.0, sunHours: 4.5, utilityName: "ComEd" },
};

const DEFAULT_LOCATION: LocationData = { state: "US", electricityRate: 0.12, demandChargeRate: 12.0, sunHours: 5.0, utilityName: "National Average" };

function getStateFromZip(zipCode: string): string {
  const zip = parseInt(zipCode);
  if (zip >= 89000 && zip <= 89899) return "NV";
  if (zip >= 90000 && zip <= 96199) return "CA";
  if (zip >= 85000 && zip <= 86599) return "AZ";
  if (zip >= 75000 && zip <= 79999) return "TX";
  if (zip >= 32000 && zip <= 34999) return "FL";
  if (zip >= 10000 && zip <= 14999) return "NY";
  if (zip >= 80000 && zip <= 81699) return "CO";
  if (zip >= 98000 && zip <= 99499) return "WA";
  if (zip >= 1000 && zip <= 2799) return "MA";
  if (zip >= 60000 && zip <= 62999) return "IL";
  return "US";
}

// THE ENGINE CLASS
export class TrueQuoteEngine {
  private static instance: TrueQuoteEngine;
  private constructor() {}

  public static getInstance(): TrueQuoteEngine {
    if (!TrueQuoteEngine.instance) {
      TrueQuoteEngine.instance = new TrueQuoteEngine();
    }
    return TrueQuoteEngine.instance;
  }

  public calculate(input: TrueQuoteInput): TrueQuoteResult {
    const steps: CalculationStep[] = [];
    let stepNum = 1;

    // DEBUG: Log input data
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("🔍 TrueQuote Engine - INPUT DATA");
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("Industry Type:", input.industry.type);
    console.log("Industry Subtype:", input.industry.subtype);
    console.log("Facility Data Keys:", Object.keys(input.industry.facilityData || {}));
    console.log("Facility Data:", JSON.stringify(input.industry.facilityData, null, 2));
    console.log("Location:", JSON.stringify(input.location, null, 2));
    console.log("Options:", JSON.stringify(input.options, null, 2));
    console.log("═══════════════════════════════════════════════════════════════════");

    // 1. RESOLVE LOCATION
    const state = input.location.state || getStateFromZip(input.location.zipCode);
    const locationData = STATE_DATA[state] || DEFAULT_LOCATION;

    // 2. GET INDUSTRY CONFIG
    const normalizedIndustryType = SLUG_ALIASES[input.industry.type] || input.industry.type;
    const industryConfig = INDUSTRY_CONFIGS[normalizedIndustryType];
    if (!industryConfig) {
      throw new Error(`Unknown industry type: ${input.industry.type} (normalized: ${normalizedIndustryType})`);
    }

    const subtypeConfig = industryConfig.subtypes[input.industry.subtype];
    if (!subtypeConfig) {
      throw new Error(`Unknown subtype: ${input.industry.subtype} for ${input.industry.type}`);
    }

    // 3. CALCULATE PEAK DEMAND
    const { peakDemandKW, powerSteps } = this.calculatePeakDemand(industryConfig, input.industry.facilityData, stepNum);

    // DEBUG: Log peak demand results
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("📊 TrueQuote Engine - PEAK DEMAND RESULTS");
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("Peak Demand kW:", peakDemandKW);
    console.log("Power Steps Count:", powerSteps.length);
    powerSteps.forEach(s => console.log(`  Step ${s.stepNumber}: ${s.name} → Output: ${s.output?.value} ${s.output?.unit}`));
    console.log("═══════════════════════════════════════════════════════════════════");

    steps.push(...powerSteps);
    stepNum += powerSteps.length;

    // 4. CALCULATE BESS
    const bessMultiplier = subtypeConfig.bessMultiplier;
    const bessPowerKW = Math.round(peakDemandKW * bessMultiplier);
    const durationHours = subtypeConfig.durationHours;
    const bessEnergyKWh = bessPowerKW * durationHours;
    const bessCost = bessEnergyKWh * TRUEQUOTE_CONSTANTS.BESS_COST_PER_KWH;

    steps.push({
      stepNumber: stepNum++, category: "bess_sizing", name: "Calculate BESS Power",
      description: `Size battery for ${subtypeConfig.name} requirements`,
      formula: "BESS Power = Peak Demand × BESS Multiplier",
      calculation: `${peakDemandKW.toLocaleString()} kW × ${bessMultiplier * 100}% = ${bessPowerKW.toLocaleString()} kW`,
      inputs: [
        { name: "Peak Demand", value: peakDemandKW, unit: "kW", source: "Previous step" },
        { name: "BESS Multiplier", value: `${bessMultiplier * 100}%`, source: `${subtypeConfig.name} standard` },
      ],
      output: { name: "BESS Power", value: bessPowerKW, unit: "kW" },
    });

    steps.push({
      stepNumber: stepNum++, category: "bess_sizing", name: "Calculate BESS Energy",
      description: "Calculate storage capacity",
      formula: "BESS Energy = BESS Power × Duration",
      calculation: `${bessPowerKW.toLocaleString()} kW × ${durationHours} hrs = ${bessEnergyKWh.toLocaleString()} kWh`,
      inputs: [
        { name: "BESS Power", value: bessPowerKW, unit: "kW", source: "Previous step" },
        { name: "Duration", value: durationHours, unit: "hours", source: "C&I standard" },
      ],
      output: { name: "BESS Energy", value: bessEnergyKWh, unit: "kWh" },
    });

    // 5. CALCULATE GENERATOR
    let generator: TrueQuoteResult["results"]["generator"] | undefined;
    const generatorRequired = subtypeConfig.generatorRequired;
    const generatorEnabled = input.options.generatorEnabled || generatorRequired;

    if (generatorEnabled) {
      const generatorSizing = subtypeConfig.generatorSizing || 1.25;
      const criticalLoad = peakDemandKW * subtypeConfig.criticalLoadPercent;
      const generatorKW = Math.round(criticalLoad * generatorSizing);
      const generatorCost = generatorKW * TRUEQUOTE_CONSTANTS.GENERATOR_COST_PER_KW;
      generator = { capacityKW: generatorKW, required: generatorRequired, cost: generatorCost };

      steps.push({
        stepNumber: stepNum++, category: "generator", name: "Calculate Generator Size",
        description: generatorRequired ? `${subtypeConfig.name} REQUIRES backup generation` : "Size backup generator",
        formula: "Generator = Critical Load × Reserve Margin",
        calculation: `${criticalLoad.toLocaleString()} kW × ${generatorSizing} = ${generatorKW.toLocaleString()} kW`,
        inputs: [
          { name: "Critical Load", value: criticalLoad, unit: "kW", source: `${subtypeConfig.criticalLoadPercent * 100}% of peak` },
          { name: "Reserve Margin", value: `${generatorSizing}x`, source: "NFPA 110" },
        ],
        output: { name: "Generator Capacity", value: generatorKW, unit: "kW" },
        notes: generatorRequired ? "Generator is REQUIRED for this facility type" : undefined,
      });
    }

    // 6. CALCULATE SOLAR
    let solar: TrueQuoteResult["results"]["solar"] | undefined;
    if (input.options.solarEnabled) {
      const solarRatio = 0.4;
      const solarKWp = Math.round(peakDemandKW * solarRatio);
      const annualProductionKWh = Math.round(solarKWp * locationData.sunHours * 365 * 0.85);
      const solarCost = solarKWp * TRUEQUOTE_CONSTANTS.SOLAR_COST_PER_KWP;
      solar = { capacityKWp: solarKWp, annualProductionKWh, cost: solarCost };

      steps.push({
        stepNumber: stepNum++, category: "solar_sizing", name: "Calculate Solar Capacity",
        description: "Size solar array",
        formula: "Solar = Peak Demand × Solar Ratio",
        calculation: `${peakDemandKW.toLocaleString()} kW × 40% = ${solarKWp.toLocaleString()} kWp`,
        inputs: [
          { name: "Peak Demand", value: peakDemandKW, unit: "kW", source: "Previous step" },
          { name: "Solar Ratio", value: "40%", source: "NREL guidelines" },
        ],
        output: { name: "Solar Capacity", value: solarKWp, unit: "kWp" },
      });
    }

    // 7. CALCULATE EV CHARGING
    let evCharging: TrueQuoteResult["results"]["evCharging"] | undefined;
    if (input.options.evChargingEnabled || input.industry.type === "ev-charging" || input.industry.type === "ev_charging") {
      const l2 = input.options.level2Chargers || input.industry.facilityData.level2Chargers || input.industry.facilityData.evL2Chargers || 0;
      const dcFast = input.options.dcFastChargers || input.industry.facilityData.dcFastChargers || input.industry.facilityData.evDCFastChargers || 0;
      const ultraFast = input.options.ultraFastChargers || input.industry.facilityData.ultraFastChargers || 0;

      const l2Power = l2 * TRUEQUOTE_CONSTANTS.EV_LEVEL2_KW;
      const dcFastPower = dcFast * TRUEQUOTE_CONSTANTS.EV_DCFAST_KW;
      const ultraFastPower = ultraFast * TRUEQUOTE_CONSTANTS.EV_ULTRAFAST_KW;
      const totalPowerKW = l2Power + dcFastPower + ultraFastPower;

      const evCost = l2 * TRUEQUOTE_CONSTANTS.EV_LEVEL2_COST + dcFast * TRUEQUOTE_CONSTANTS.EV_DCFAST_COST + ultraFast * TRUEQUOTE_CONSTANTS.EV_ULTRAFAST_COST;
      evCharging = { level2Count: l2, dcFastCount: dcFast, ultraFastCount: ultraFast, totalPowerKW, cost: evCost };

      if (totalPowerKW > 0) {
        steps.push({
          stepNumber: stepNum++, category: "ev_charging", name: "Calculate EV Charging Load",
          description: "Sum all charger capacities",
          formula: "(L2 × 19.2kW) + (DCFC × 150kW) + (Ultra × 350kW)",
          calculation: `(${l2} × 19.2) + (${dcFast} × 150) + (${ultraFast} × 350) = ${totalPowerKW.toLocaleString()} kW`,
          inputs: [
            { name: "Level 2", value: l2, source: "User input" },
            { name: "DC Fast", value: dcFast, source: "User input" },
            { name: "Ultra-Fast", value: ultraFast, source: "User input" },
          ],
          output: { name: "EV Charging Power", value: totalPowerKW, unit: "kW" },
        });
      }
    }

    // 8. CALCULATE FINANCIALS
    const equipmentCost = bessCost + (solar?.cost || 0) + (generator?.cost || 0) + (evCharging?.cost || 0);
    const installationCost = equipmentCost * TRUEQUOTE_CONSTANTS.INSTALLATION_PERCENT;
    const totalInvestment = equipmentCost + installationCost;
    const itcEligible = bessCost + (solar?.cost || 0);
    const federalITC = itcEligible * TRUEQUOTE_CONSTANTS.FEDERAL_ITC_RATE;
    const netCost = totalInvestment - federalITC;

    const demandSavings = bessPowerKW * TRUEQUOTE_CONSTANTS.PEAK_SHAVING_PERCENT * locationData.demandChargeRate * 12;
    const arbitrageSavings = bessEnergyKWh * TRUEQUOTE_CONSTANTS.ARBITRAGE_CYCLES_YEAR * TRUEQUOTE_CONSTANTS.ARBITRAGE_SPREAD;
    const solarSavings = solar ? solar.annualProductionKWh * locationData.electricityRate : 0;
    const annualSavings = demandSavings + arbitrageSavings + solarSavings;
    const paybackYears = netCost / annualSavings;
    // 5-year ROI with 3% annual increase (5.15x multiplier)
    const fiveYearROI = annualSavings > 0 && netCost > 0 ? ((annualSavings * 5.15 - netCost) / netCost) * 100 : 0;

    const npvCashFlows = Array.from({ length: 25 }, (_, i) => annualSavings / Math.pow(1 + TRUEQUOTE_CONSTANTS.DISCOUNT_RATE, i + 1));
    const twentyFiveYearNPV = npvCashFlows.reduce((sum, cf) => sum + cf, 0) - netCost;

    steps.push({
      stepNumber: stepNum++, category: "financial", name: "Calculate Total Investment",
      description: "Sum equipment and installation",
      formula: "Total = Equipment + Installation (15%)",
      calculation: `$${(equipmentCost / 1000).toFixed(0)}K + $${(installationCost / 1000).toFixed(0)}K = $${(totalInvestment / 1000).toFixed(0)}K`,
      inputs: [
        { name: "BESS", value: `$${(bessCost / 1000).toFixed(0)}K`, source: `${bessEnergyKWh} kWh × $${TRUEQUOTE_CONSTANTS.BESS_COST_PER_KWH}/kWh` },
        { name: "Solar", value: solar ? `$${(solar.cost / 1000).toFixed(0)}K` : "$0", source: "NREL ATB 2024" },
        { name: "Generator", value: generator ? `$${(generator.cost / 1000).toFixed(0)}K` : "$0", source: "RSMeans 2024" },
      ],
      output: { name: "Total Investment", value: totalInvestment, unit: "$" },
    });

    steps.push({
      stepNumber: stepNum++, category: "financial", name: "Calculate Annual Savings",
      description: "Sum all savings sources",
      formula: "Savings = Demand + Arbitrage + Solar",
      calculation: `$${(demandSavings / 1000).toFixed(0)}K + $${(arbitrageSavings / 1000).toFixed(0)}K + $${(solarSavings / 1000).toFixed(0)}K = $${(annualSavings / 1000).toFixed(0)}K/yr`,
      inputs: [
        { name: "Demand Savings", value: `$${demandSavings.toLocaleString()}`, source: "25% peak shaving" },
        { name: "Arbitrage", value: `$${arbitrageSavings.toLocaleString()}`, source: "250 cycles × $0.06" },
        { name: "Solar", value: `$${solarSavings.toLocaleString()}`, source: "Avoided grid" },
      ],
      output: { name: "Annual Savings", value: annualSavings, unit: "$/year" },
    });

    steps.push({
      stepNumber: stepNum++, category: "financial", name: "Calculate Payback",
      description: "Time to recover investment",
      formula: "Payback = Net Cost ÷ Annual Savings",
      calculation: `$${(netCost / 1000).toFixed(0)}K ÷ $${(annualSavings / 1000).toFixed(0)}K = ${paybackYears.toFixed(1)} years`,
      inputs: [
        { name: "Net Cost", value: netCost, unit: "$", source: "Total - ITC" },
        { name: "Annual Savings", value: annualSavings, unit: "$/yr", source: "Previous step" },
      ],
      output: { name: "Payback Period", value: Math.round(paybackYears * 10) / 10, unit: "years" },
      benchmark: { source: "Industry standard", range: "3-10 years", status: paybackYears >= 3 && paybackYears <= 10 ? "pass" : "warn" },
    });

    // 9. CALCULATE EMISSIONS
    const solarCO2 = (solar?.annualProductionKWh || 0) * TRUEQUOTE_CONSTANTS.CO2_KG_PER_KWH;
    const bessCO2 = bessEnergyKWh * 250 * 0.5 * TRUEQUOTE_CONSTANTS.CO2_KG_PER_KWH;
    const annualCO2OffsetKg = Math.round(solarCO2 + bessCO2);
    const equivalentTreesPlanted = Math.round(annualCO2OffsetKg / TRUEQUOTE_CONSTANTS.CO2_PER_TREE_YEAR);
    const equivalentCarsRemoved = Math.round((annualCO2OffsetKg / TRUEQUOTE_CONSTANTS.CO2_PER_CAR_YEAR) * 10) / 10;

    // 10. BUILD RESULT
    return {
      quoteId: this.generateQuoteId(),
      generatedAt: new Date().toISOString(),
      engineVersion: "2.0.0",
      inputs: {
        location: locationData,
        industry: { type: input.industry.type, typeName: industryConfig.name, subtype: input.industry.subtype, subtypeName: subtypeConfig.name, facilityData: input.industry.facilityData },
        options: input.options,
      },
      results: {
        peakDemandKW,
        bess: { powerKW: bessPowerKW, energyKWh: bessEnergyKWh, durationHours, cost: bessCost },
        solar, evCharging, generator,
        financial: {
          totalInvestment: Math.round(totalInvestment), federalITC: Math.round(federalITC), stateIncentives: 0, netCost: Math.round(netCost),
          annualSavings: Math.round(annualSavings), paybackYears: Math.round(paybackYears * 10) / 10, fiveYearROI: Math.round(fiveYearROI * 10) / 10, twentyFiveYearNPV: Math.round(twentyFiveYearNPV),
        },
        emissions: { annualCO2OffsetKg, equivalentTreesPlanted, equivalentCarsRemoved },
      },
      calculationSteps: steps,
      sources: [
        { id: "nrel_atb", shortName: "NREL ATB 2024", fullName: "Annual Technology Baseline", organization: "NREL", year: 2024, url: "https://atb.nrel.gov", usedFor: ["BESS costs", "Solar costs"] },
        { id: "eia", shortName: "EIA 2024", fullName: "State Electricity Profiles", organization: "EIA", year: 2024, url: "https://www.eia.gov/electricity/state/", usedFor: ["Electricity rates", "Demand charges"] },
        { id: "uptime", shortName: "Uptime Institute", fullName: "Tier Standard: Topology", organization: "Uptime Institute", year: 2024, usedFor: ["Data center tiers"] },
        { id: "ashrae", shortName: "ASHRAE", fullName: "HVAC Applications Handbook", organization: "ASHRAE", year: 2023, usedFor: ["Power benchmarks", "PUE"] },
        { id: "nfpa", shortName: "NFPA 110", fullName: "Emergency Power Standard", organization: "NFPA", year: 2022, usedFor: ["Generator requirements"] },
        { id: "irs", shortName: "IRS 48E", fullName: "Investment Tax Credit", organization: "IRS", year: 2022, usedFor: ["Federal ITC (30%)"] },
      ],
    };
  }

  // PRIVATE METHODS
  private calculatePeakDemand(config: IndustryConfig, facilityData: Record<string, any>, startStep: number): { peakDemandKW: number; powerSteps: CalculationStep[] } {
    const steps: CalculationStep[] = [];
    let stepNum = startStep;
    const powerCalc = config.powerCalculation;
    let basePowerKW = 0;

    // Check if peakDemandKW is already calculated (e.g., from custom calculator like truck stops)
    if (facilityData.peakDemandKW !== undefined && typeof facilityData.peakDemandKW === 'number' && facilityData.peakDemandKW > 0) {
      basePowerKW = facilityData.peakDemandKW;
      steps.push({
        stepNumber: stepNum++, category: "power_demand", name: "Use Pre-calculated Peak Demand",
        description: "Peak demand calculated by industry-specific calculator",
        formula: "Peak Demand = Industry Calculator Result",
        calculation: `${basePowerKW.toLocaleString()} kW (from ${config.name} calculator)`,
        inputs: [
          { name: "Calculation Method", value: "Industry-specific calculator", source: `${config.name} load calculator` },
        ],
        output: { name: "Peak Demand", value: basePowerKW, unit: "kW" },
      });
      return { peakDemandKW: Math.round(basePowerKW), powerSteps: steps };
    }

    // Handle "fixed" method - use baseLoadKW or fallback to 0
    if (powerCalc.method === "fixed") {
      basePowerKW = powerCalc.baseLoadKW || 0;
      if (basePowerKW > 0) {
        steps.push({
          stepNumber: stepNum++, category: "power_demand", name: "Fixed Base Load",
          description: "Using fixed base load for this industry type",
          formula: "Peak Demand = Fixed Base Load",
          calculation: `${basePowerKW.toLocaleString()} kW`,
          inputs: [
            { name: "Base Load", value: basePowerKW, unit: "kW", source: "Industry standard" },
          ],
          output: { name: "Peak Demand", value: basePowerKW, unit: "kW" },
        });
      }
    } else if (powerCalc.method === "per_unit" && powerCalc.unitName && powerCalc.wattsPerUnit) {
      const unitCount = this.extractUnitCount(facilityData, powerCalc.unitName);
      let effectiveWattsPerUnit = powerCalc.wattsPerUnit;

      // Hotel special handling
      if (config.slug === "hotel" && facilityData.hotelCategory) {
        const category = facilityData.hotelCategory.toLowerCase();
        if (category === "upscale" || category === "full-service") effectiveWattsPerUnit = 5500;
        else if (category === "luxury" || category === "resort") effectiveWattsPerUnit = 7000;
        else if (category === "midscale" || category === "select-service") effectiveWattsPerUnit = 4000;
        else effectiveWattsPerUnit = 3000;
      }

      basePowerKW = (unitCount * effectiveWattsPerUnit) / 1000;
      steps.push({
        stepNumber: stepNum++, category: "power_demand", name: "Calculate Base Load",
        description: `Calculate base power from ${powerCalc.unitName}`,
        formula: `Base Load = ${powerCalc.unitName} Count × Power per unit`,
        calculation: `${unitCount} × ${effectiveWattsPerUnit / 1000} kW = ${basePowerKW.toLocaleString()} kW`,
        inputs: [
          { name: `${powerCalc.unitName} Count`, value: unitCount, source: "User input" },
          { name: "Power per unit", value: `${effectiveWattsPerUnit / 1000} kW`, source: "Industry standard" },
        ],
        output: { name: "Base Load", value: basePowerKW, unit: "kW" },
      });

      // Fallback: Parse peakDemand string
      if (basePowerKW === 0 && facilityData.peakDemand) {
        const peakDemandStr = String(facilityData.peakDemand).toLowerCase();
        const mwMatch = peakDemandStr.match(/(\d+(?:\.\d+)?)\s*-?\s*(\d+(?:\.\d+)?)?\s*mw/);
        const kwMatch = peakDemandStr.match(/(\d+(?:\.\d+)?)\s*-?\s*(\d+(?:\.\d+)?)?\s*kw/);
        if (mwMatch) {
          const low = parseFloat(mwMatch[1]) * 1000;
          const high = mwMatch[2] ? parseFloat(mwMatch[2]) * 1000 : low;
          basePowerKW = (low + high) / 2;
        } else if (kwMatch) {
          const low = parseFloat(kwMatch[1]);
          const high = kwMatch[2] ? parseFloat(kwMatch[2]) : low;
          basePowerKW = (low + high) / 2;
        }
        if (basePowerKW > 0) {
          steps.push({
            stepNumber: stepNum++, category: "power_demand", name: "Parse Peak Demand from User Input",
            description: "Using user-provided peak demand estimate",
            formula: "Peak Demand = User-specified range midpoint",
            calculation: `"${facilityData.peakDemand}" → ${basePowerKW.toLocaleString()} kW`,
            inputs: [{ name: "User Input", value: facilityData.peakDemand, source: "User input" }],
            output: { name: "Peak Demand", value: basePowerKW, unit: "kW" },
          });
        }
      }
    } else if (powerCalc.method === "per_sqft") {
      const sqftFields = ["facilitySqFt", "squareFootage", "squareFeet", "sqft", "sqFt", "storeSqFt", "restaurantSqFt", "buildingSqFt", "warehouseSqFt", "totalSqFt", "gamingFloorSqFt", "glaSqFt", "growingAreaSqFt", "whitespaceSquareFeet", "terminalSqFt", "siteSqFt", "refrigeratedSqFt"];
      let sqft = 0;
      for (const field of sqftFields) {
        if (facilityData[field] !== undefined) {
          sqft = parseFloat(String(facilityData[field])) || 0;
          if (sqft > 0) break;
        }
      }
      if (sqft > 0 && powerCalc.wattsPerSqft) {
        basePowerKW = (sqft * powerCalc.wattsPerSqft) / 1000;
        steps.push({
          stepNumber: stepNum++, category: "power_demand", name: "Calculate Base Load from Square Footage",
          description: "Calculate power from facility size",
          formula: `Base Load = Square Feet × ${powerCalc.wattsPerSqft} W/sqft`,
          calculation: `${sqft.toLocaleString()} sqft × ${powerCalc.wattsPerSqft} W/sqft = ${basePowerKW.toLocaleString()} kW`,
          inputs: [
            { name: "Square Feet", value: sqft, unit: "sqft", source: "User input" },
            { name: "Power Density", value: `${powerCalc.wattsPerSqft} W/sqft`, source: "Industry standard" },
          ],
          output: { name: "Base Load", value: basePowerKW, unit: "kW" },
        });
      }
    } else if (powerCalc.method === "charger_sum") {
      const l2 = facilityData.level2Chargers || facilityData.evL2Chargers || facilityData.level2Count || 0;
      const dcFast = facilityData.dcFastChargers || facilityData.evDCFastChargers || facilityData.dcfc50Count || facilityData.dcfcHighCount || 0;
      const ultraFast = facilityData.ultraFastChargers || facilityData.megawattCount || 0;
      basePowerKW = l2 * TRUEQUOTE_CONSTANTS.EV_LEVEL2_KW + dcFast * TRUEQUOTE_CONSTANTS.EV_DCFAST_KW + ultraFast * TRUEQUOTE_CONSTANTS.EV_ULTRAFAST_KW;
      steps.push({
        stepNumber: stepNum++, category: "power_demand", name: "Sum Charger Capacities",
        description: "Calculate total charging capacity",
        formula: "(L2 × 19.2kW) + (DCFC × 150kW) + (Ultra × 350kW)",
        calculation: `(${l2} × 19.2) + (${dcFast} × 150) + (${ultraFast} × 350) = ${basePowerKW.toLocaleString()} kW`,
        inputs: [
          { name: "Level 2", value: l2, source: "User input" },
          { name: "DC Fast", value: dcFast, source: "User input" },
          { name: "Ultra-Fast", value: ultraFast, source: "User input" },
        ],
        output: { name: "Total Charging Capacity", value: basePowerKW, unit: "kW" },
      });
    }

    // Apply modifiers
    let totalPowerKW = basePowerKW;
    if (powerCalc.modifiers) {
      for (const mod of powerCalc.modifiers) {
        if (this.shouldApplyModifier(facilityData, mod.trigger)) {
          const isPUE = mod.trigger === "currentPUE" || mod.trigger === "powerUsageEffectiveness" || mod.trigger === "pue";
          let modValue = facilityData[mod.trigger];
          if (isPUE && modValue === undefined) {
            modValue = facilityData["currentPUE"] || facilityData["powerUsageEffectiveness"] || facilityData["pue"] || facilityData["targetPUE"];
          }
          const multiplier = isPUE && modValue !== undefined && parseFloat(modValue) > 1 ? parseFloat(modValue) : mod.multiplier;
          const previousPower = totalPowerKW;
          totalPowerKW *= multiplier;
          steps.push({
            stepNumber: stepNum++, category: "power_demand", name: `Apply ${mod.name}`,
            description: `Add ${mod.name} overhead`,
            formula: `Total = Previous × ${mod.name}`,
            calculation: `${previousPower.toLocaleString()} kW × ${multiplier} = ${totalPowerKW.toLocaleString()} kW`,
            inputs: [
              { name: "Previous Load", value: previousPower, unit: "kW", source: "Previous step" },
              { name: mod.name, value: multiplier, source: "User input / Standard" },
            ],
            output: { name: "Total Load", value: Math.round(totalPowerKW), unit: "kW" },
          });
        }
      }
    }

    return { peakDemandKW: Math.round(totalPowerKW), powerSteps: steps };
  }

  private extractUnitCount(facilityData: Record<string, any>, unitName: string): number {
    const fieldMappings: Record<string, string[]> = {
      racks: ["rackCount", "racks", "numberOfRacks"],
      beds: ["bedCount", "beds", "numberOfBeds", "icuBeds", "totalBeds"],
      rooms: ["roomCount", "rooms", "numberOfRooms", "numRooms", "hotelRooms"],
      bays: ["bayCount", "bays", "numberOfBays", "washBays", "tunnelCount", "num_bays", "tunnelBayCount"],
      units: ["unitCount", "units", "numberOfUnits", "numUnits", "totalUnits"],
    };
    const possibleFields = fieldMappings[unitName] || [unitName];
    for (const field of possibleFields) {
      if (facilityData[field] !== undefined) {
        const value = parseInt(facilityData[field]) || 0;
        if (value > 0) return value;
      }
    }
    return 0;
  }

  private shouldApplyModifier(facilityData: Record<string, any>, trigger: string): boolean {
    let value = facilityData[trigger];

    // PUE special handling
    if (trigger === "powerUsageEffectiveness" || trigger === "pue" || trigger === "currentPUE") {
      if (value === undefined) {
        value = facilityData["currentPUE"] || facilityData["powerUsageEffectiveness"] || facilityData["pue"] || facilityData["targetPUE"];
      }
      return value !== undefined && parseFloat(value) > 1;
    }

    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "number") return value > 0;
    if (typeof value === "string") {
      if (!isNaN(Number(value)) && value.trim() !== "") return Number(value) > 0;
      return value.trim() !== "" && value.toLowerCase() !== "none" && value.toLowerCase() !== "no";
    }
    return value === true;
  }

  private generateQuoteId(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let id = "MQ-";
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
}

// EXPORTS
export const trueQuoteEngine = TrueQuoteEngine.getInstance();

export function calculateTrueQuote(input: TrueQuoteInput): TrueQuoteResult {
  return trueQuoteEngine.calculate(input);
}

export default TrueQuoteEngine;
