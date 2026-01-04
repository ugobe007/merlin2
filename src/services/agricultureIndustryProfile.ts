/**
 * AGRICULTURE / FARMING INDUSTRY PROFILE
 * ======================================
 *
 * Data-driven sizing calculations and question tiers for Agriculture/Farming operations.
 * Based on industry workup by Bob Christopher, December 2025.
 *
 * KEY SIZING DRIVERS:
 * 1. Operation Type - Row crops vs livestock vs controlled environment
 * 2. Irrigation Load - Can be 50-80% of total during peak season
 * 3. Seasonal Variation - 5-10x difference between irrigation and off-season
 * 4. Critical Loads - Livestock ventilation, milk cooling, refrigeration
 * 5. Land Availability - Excellent solar potential (ground mount)
 * 6. Rural Grid Quality - Frequent outages, voltage sags
 */

// ============================================================================
// AGRICULTURE OPERATION TYPE PROFILES
// ============================================================================

export const AGRICULTURE_PROFILES = {
  rowCropsIrrigated: {
    label: "Row Crops — Irrigated",
    description: "Corn, soybeans, cotton, vegetables with irrigation",
    examples: ["Corn", "Soybeans", "Cotton", "Vegetables"],

    // Load characteristics
    kwhPerAcreYear: 800, // Annual kWh per irrigated acre
    peakKwPerAcre: 0.4, // Peak kW per acre (irrigation season)
    baseLoadKw: 20, // Base load (off-season)
    seasonalMultiplier: 8, // Peak season is 8x off-season

    // Typical ranges
    typicalAcres: { min: 100, max: 2000 },
    typicalPeakKw: { min: 50, max: 750 },
    typicalAnnualKwh: { min: 100000, max: 1500000 },

    // Cost benchmarks
    annualEnergySpend: { min: 12000, max: 180000 },
    costPerAcreYear: { min: 120, max: 90 },

    // Recommended system sizes
    bessKwhPerAcre: 0.5, // kWh BESS per acre
    solarKwPerAcre: 0.3, // kW solar per acre
    generatorKwPerAcre: 0.2, // kW generator per acre

    // Question depth
    questionTier: 2,
    questionsShown: 6,
  },

  rowCropsDryland: {
    label: "Row Crops — Dryland",
    description: "Wheat, grain sorghum, minimal irrigation",
    examples: ["Wheat", "Grain Sorghum", "Barley"],

    kwhPerAcreYear: 100,
    peakKwPerAcre: 0.05,
    baseLoadKw: 15,
    seasonalMultiplier: 2,

    typicalAcres: { min: 500, max: 5000 },
    typicalPeakKw: { min: 25, max: 250 },
    typicalAnnualKwh: { min: 50000, max: 500000 },

    annualEnergySpend: { min: 5000, max: 60000 },
    costPerAcreYear: { min: 10, max: 12 },

    bessKwhPerAcre: 0.1,
    solarKwPerAcre: 0.1,
    generatorKwPerAcre: 0.05,

    questionTier: 1,
    questionsShown: 4,
  },

  orchards: {
    label: "Orchards / Tree Crops",
    description: "Almonds, citrus, apples, stone fruit",
    examples: ["Almonds", "Citrus", "Apples", "Stone Fruit"],

    kwhPerAcreYear: 500,
    peakKwPerAcre: 0.3,
    baseLoadKw: 30,
    seasonalMultiplier: 5,

    typicalAcres: { min: 50, max: 1000 },
    typicalPeakKw: { min: 30, max: 300 },
    typicalAnnualKwh: { min: 25000, max: 500000 },

    annualEnergySpend: { min: 3000, max: 60000 },
    costPerAcreYear: { min: 60, max: 60 },

    bessKwhPerAcre: 0.4,
    solarKwPerAcre: 0.25,
    generatorKwPerAcre: 0.15,

    questionTier: 2,
    questionsShown: 6,
  },

  vineyards: {
    label: "Vineyards",
    description: "Wine grapes, table grapes",
    examples: ["Wine Grapes", "Table Grapes"],

    kwhPerAcreYear: 400,
    peakKwPerAcre: 0.25,
    baseLoadKw: 25,
    seasonalMultiplier: 4,

    typicalAcres: { min: 20, max: 500 },
    typicalPeakKw: { min: 10, max: 125 },
    typicalAnnualKwh: { min: 8000, max: 200000 },

    annualEnergySpend: { min: 1000, max: 24000 },
    costPerAcreYear: { min: 50, max: 48 },

    bessKwhPerAcre: 0.3,
    solarKwPerAcre: 0.2,
    generatorKwPerAcre: 0.1,

    questionTier: 2,
    questionsShown: 6,
  },

  dairy: {
    label: "Dairy",
    description: "Milk production, milking, cooling",
    examples: ["Dairy Farm", "Milk Production"],

    kwhPerCowYear: 1200, // Annual kWh per cow
    peakKwPerCow: 0.15, // Peak kW per cow
    baseLoadKw: 50,
    seasonalMultiplier: 1.2, // Relatively constant

    typicalCows: { min: 100, max: 5000 },
    typicalPeakKw: { min: 75, max: 1000 },
    typicalAnnualKwh: { min: 150000, max: 6000000 },

    annualEnergySpend: { min: 18000, max: 720000 },
    costPerCowYear: { min: 180, max: 144 },

    bessKwhPerCow: 0.3, // Critical load backup
    solarKwPerCow: 0.2,
    generatorKwPerCow: 0.15,

    questionTier: 3,
    questionsShown: 8,
  },

  beefCattle: {
    label: "Beef Cattle",
    description: "Feedlot, cow-calf operations",
    examples: ["Feedlot", "Cow-Calf"],

    kwhPerHeadYear: 50,
    peakKwPerHead: 0.01,
    baseLoadKw: 20,
    seasonalMultiplier: 1.5,

    typicalHead: { min: 100, max: 10000 },
    typicalPeakKw: { min: 25, max: 120 },
    typicalAnnualKwh: { min: 5000, max: 500000 },

    annualEnergySpend: { min: 600, max: 60000 },
    costPerHeadYear: { min: 6, max: 6 },

    bessKwhPerHead: 0.05,
    solarKwPerHead: 0.03,
    generatorKwPerHead: 0.02,

    questionTier: 1,
    questionsShown: 4,
  },

  poultry: {
    label: "Poultry",
    description: "Broilers, layers, turkeys",
    examples: ["Broilers", "Layers", "Turkeys"],

    kwhPerBirdYear: 1.5, // Annual kWh per bird
    peakKwPerBird: 0.0002, // Peak kW per bird
    baseLoadKw: 30,
    seasonalMultiplier: 1.3,

    typicalBirds: { min: 10000, max: 500000 },
    typicalPeakKw: { min: 100, max: 400 },
    typicalAnnualKwh: { min: 300000, max: 1000000 },

    annualEnergySpend: { min: 36000, max: 120000 },
    costPerBirdYear: { min: 0.12, max: 0.24 },

    bessKwhPerBird: 0.0003, // Ventilation critical
    solarKwPerBird: 0.0002,
    generatorKwPerBird: 0.0001,

    questionTier: 3,
    questionsShown: 8,
  },

  hogs: {
    label: "Hogs / Swine",
    description: "Farrow-to-finish, nursery",
    examples: ["Farrow-to-Finish", "Nursery"],

    kwhPerHeadYear: 30,
    peakKwPerHead: 0.005,
    baseLoadKw: 25,
    seasonalMultiplier: 1.4,

    typicalHead: { min: 500, max: 10000 },
    typicalPeakKw: { min: 50, max: 200 },
    typicalAnnualKwh: { min: 15000, max: 300000 },

    annualEnergySpend: { min: 1800, max: 36000 },
    costPerHeadYear: { min: 3.6, max: 3.6 },

    bessKwhPerHead: 0.08,
    solarKwPerHead: 0.05,
    generatorKwPerHead: 0.03,

    questionTier: 2,
    questionsShown: 6,
  },

  greenhouse: {
    label: "Greenhouse / Nursery",
    description: "Ornamentals, vegetables, seedlings",
    examples: ["Greenhouse", "Nursery"],

    kwhPerSqFtYear: 60, // Annual kWh per sq ft
    peakKwPerSqFt: 0.008, // Peak kW per sq ft
    baseLoadKw: 40,
    seasonalMultiplier: 2,

    typicalSqFt: { min: 10000, max: 200000 },
    typicalPeakKw: { min: 200, max: 1000 },
    typicalAnnualKwh: { min: 500000, max: 3000000 },

    annualEnergySpend: { min: 60000, max: 360000 },
    costPerSqFtYear: { min: 0.12, max: 0.12 },

    bessKwhPerSqFt: 0.01,
    solarKwPerSqFt: 0.006,
    generatorKwPerSqFt: 0.004,

    questionTier: 3,
    questionsShown: 8,
  },

  indoorVertical: {
    label: "Indoor / Vertical Farming",
    description: "Leafy greens, herbs, controlled environment",
    examples: ["Vertical Farm", "Indoor Farm"],

    kwhPerSqFtYear: 300, // Very high - LED lighting
    peakKwPerSqFt: 0.04, // Peak kW per sq ft
    baseLoadKw: 50,
    seasonalMultiplier: 1.1, // Constant operation

    typicalSqFt: { min: 5000, max: 50000 },
    typicalPeakKw: { min: 500, max: 2500 },
    typicalAnnualKwh: { min: 2000000, max: 10000000 },

    annualEnergySpend: { min: 240000, max: 1200000 },
    costPerSqFtYear: { min: 0.12, max: 0.12 },

    bessKwhPerSqFt: 0.05, // Demand charge management
    solarKwPerSqFt: 0.03,
    generatorKwPerSqFt: 0.02,

    questionTier: 3,
    questionsShown: 8,
  },

  cannabisOutdoor: {
    label: "Cannabis — Outdoor",
    description: "Sun-grown cannabis",
    examples: ["Outdoor Cannabis"],

    kwhPerAcreYear: 300,
    peakKwPerAcre: 0.2,
    baseLoadKw: 30,
    seasonalMultiplier: 3,

    typicalAcres: { min: 1, max: 100 },
    typicalPeakKw: { min: 30, max: 200 },
    typicalAnnualKwh: { min: 300, max: 30000 },

    annualEnergySpend: { min: 36, max: 3600 },
    costPerAcreYear: { min: 36, max: 36 },

    bessKwhPerAcre: 0.25,
    solarKwPerAcre: 0.15,
    generatorKwPerAcre: 0.1,

    questionTier: 2,
    questionsShown: 6,
  },

  cannabisIndoor: {
    label: "Cannabis — Indoor / Greenhouse",
    description: "Controlled environment, high intensity",
    examples: ["Indoor Cannabis", "Greenhouse Cannabis"],

    kwhPerSqFtYear: 200, // Very high - lighting + HVAC
    peakKwPerSqFt: 0.03,
    baseLoadKw: 60,
    seasonalMultiplier: 1.1,

    typicalSqFt: { min: 5000, max: 50000 },
    typicalPeakKw: { min: 500, max: 2000 },
    typicalAnnualKwh: { min: 2000000, max: 10000000 },

    annualEnergySpend: { min: 240000, max: 1200000 },
    costPerSqFtYear: { min: 0.12, max: 0.12 },

    bessKwhPerSqFt: 0.04,
    solarKwPerSqFt: 0.025,
    generatorKwPerSqFt: 0.015,

    questionTier: 3,
    questionsShown: 8,
  },

  packingProcessing: {
    label: "Packing / Processing",
    description: "Post-harvest handling, processing",
    examples: ["Packing Shed", "Processing Facility"],

    kwhPerSqFtYear: 35,
    peakKwPerSqFt: 0.004,
    baseLoadKw: 50,
    seasonalMultiplier: 3,

    typicalSqFt: { min: 10000, max: 100000 },
    typicalPeakKw: { min: 200, max: 1000 },
    typicalAnnualKwh: { min: 800000, max: 4000000 },

    annualEnergySpend: { min: 96000, max: 480000 },
    costPerSqFtYear: { min: 0.12, max: 0.12 },

    bessKwhPerSqFt: 0.008,
    solarKwPerSqFt: 0.005,
    generatorKwPerSqFt: 0.003,

    questionTier: 2,
    questionsShown: 6,
  },

  coldStorage: {
    label: "Cold Storage",
    description: "Refrigerated warehouse",
    examples: ["Cold Storage", "Refrigerated Warehouse"],

    kwhPerSqFtYear: 45,
    peakKwPerSqFt: 0.005,
    baseLoadKw: 60,
    seasonalMultiplier: 1.2,

    typicalSqFt: { min: 20000, max: 100000 },
    typicalPeakKw: { min: 200, max: 1000 },
    typicalAnnualKwh: { min: 800000, max: 4000000 },

    annualEnergySpend: { min: 96000, max: 480000 },
    costPerSqFtYear: { min: 0.12, max: 0.12 },

    bessKwhPerSqFt: 0.01, // Refrigeration backup critical
    solarKwPerSqFt: 0.006,
    generatorKwPerSqFt: 0.004,

    questionTier: 3,
    questionsShown: 8,
  },

  aquaculture: {
    label: "Aquaculture",
    description: "Fish, shrimp farming",
    examples: ["Fish Farm", "Shrimp Farm"],

    kwhPerAcreYear: 5000, // Continuous pumping
    peakKwPerAcre: 2.0,
    baseLoadKw: 40,
    seasonalMultiplier: 1.1,

    typicalAcres: { min: 1, max: 50 },
    typicalPeakKw: { min: 50, max: 3000 },
    typicalAnnualKwh: { min: 5000, max: 250000 },

    annualEnergySpend: { min: 600, max: 30000 },
    costPerAcreYear: { min: 600, max: 600 },

    bessKwhPerAcre: 1.0,
    solarKwPerAcre: 0.5,
    generatorKwPerAcre: 0.3,

    questionTier: 2,
    questionsShown: 6,
  },

  mixedOperation: {
    label: "Mixed Operation",
    description: "Multiple enterprises",
    examples: ["Mixed Farm"],

    kwhPerAcreYear: 400,
    peakKwPerAcre: 0.25,
    baseLoadKw: 50,
    seasonalMultiplier: 4,

    typicalAcres: { min: 100, max: 5000 },
    typicalPeakKw: { min: 100, max: 1500 },
    typicalAnnualKwh: { min: 100000, max: 2000000 },

    annualEnergySpend: { min: 12000, max: 240000 },
    costPerAcreYear: { min: 120, max: 48 },

    bessKwhPerAcre: 0.3,
    solarKwPerAcre: 0.2,
    generatorKwPerAcre: 0.1,

    questionTier: 2,
    questionsShown: 6,
  },
};

// ============================================================================
// IRRIGATION TYPES
// ============================================================================

export const IRRIGATION_TYPES = {
  centerPivot: {
    label: "Center Pivot",
    kwhPerAcreYear: 200,
    peakKwPerAcre: 0.15,
  },
  dripMicro: {
    label: "Drip / Micro",
    kwhPerAcreYear: 100,
    peakKwPerAcre: 0.08,
  },
  floodFurrow: {
    label: "Flood / Furrow",
    kwhPerAcreYear: 150,
    peakKwPerAcre: 0.12,
  },
  sprinkler: {
    label: "Sprinkler (Other)",
    kwhPerAcreYear: 180,
    peakKwPerAcre: 0.14,
  },
  subsurfaceDrip: {
    label: "Sub-surface Drip",
    kwhPerAcreYear: 90,
    peakKwPerAcre: 0.07,
  },
};

// ============================================================================
// WATER SOURCES
// ============================================================================

export const WATER_SOURCES = {
  groundwater: {
    label: "Groundwater Wells",
    liftRequired: true,
    typicalLift: 100, // feet
    kwhPerAcreFoot: 1200,
  },
  surface: {
    label: "Surface Water (Canal, River)",
    liftRequired: false,
    typicalLift: 20,
    kwhPerAcreFoot: 200,
  },
  municipal: {
    label: "Municipal / District Water",
    liftRequired: false,
    typicalLift: 0,
    kwhPerAcreFoot: 50,
  },
  pond: {
    label: "Pond / Reservoir",
    liftRequired: true,
    typicalLift: 50,
    kwhPerAcreFoot: 600,
  },
  recycled: {
    label: "Recycled Water",
    liftRequired: true,
    typicalLift: 30,
    kwhPerAcreFoot: 400,
  },
};

// ============================================================================
// INPUT INTERFACE
// ============================================================================

export interface AgricultureInputs {
  // Section 1: Your Operation
  operationType: string; // e.g., 'rowCropsIrrigated', 'dairy'
  totalAcres?: number;
  irrigatedAcres?: number;
  greenhouseSqFt?: number;
  livestockSqFt?: number;
  numberOfAnimals?: number; // Cows, birds, head
  coldStorageSqFt?: number;
  yearsOperating?: string;

  // Section 2: Irrigation & Pumping
  irrigationTypes?: string[]; // Array of irrigation types
  irrigationAcres?: Record<string, number>; // Acres per type
  waterSource?: string;
  numberOfWells?: number;
  largestPumpHp?: number;
  totalPumpHp?: number;
  pumpDepth?: number;
  pumpingHoursPerDay?: number;
  irrigationSeasonStart?: string;
  irrigationSeasonEnd?: string;
  pumpEnergySource?: string;

  // Section 3: Livestock & Controlled Environment
  milkingParlor?: boolean;
  milkingStalls?: number;
  milkCoolingCapacity?: number; // Gallons
  freestallBarnSqFt?: number;
  poultryHouses?: number;
  poultryHouseSqFt?: number;
  hogBarns?: number;
  hogBarnSqFt?: number;
  feedlotCapacity?: number;
  eggProcessing?: number; // Eggs per day
  ventilationFanHp?: number;

  greenhouseType?: string;
  greenhouseSqFt2?: number; // Separate from Section 1
  highTunnelSqFt?: number;
  verticalFarmSqFt?: number;
  cannabisFlowerSqFt?: number;
  cannabisVegSqFt?: number;
  propagationSqFt?: number;

  exhaustFanHp?: number;
  evaporativeCooling?: boolean;
  hvacTons?: number;
  gasHeaterBtu?: number;
  electricHeaterKw?: number;
  dehumidifiers?: number;
  co2Supplementation?: boolean;
  growLightsHps?: number; // kW
  growLightsLed?: number; // kW

  // Section 4: Other Facilities & Equipment
  shopSqFt?: number;
  officeResidenceSqFt?: number;
  packingShedSqFt?: number;
  coldStorageSqFt2?: number; // Separate from Section 1
  freezerSqFt?: number;
  grainBins?: number; // Bushels
  grainDryerBtu?: number;
  grainDryerKw?: number;
  processingSqFt?: number;
  wineryCapacity?: number; // Gallons
  tastingRoomSqFt?: number;

  electricVehicles?: number;
  electricTractors?: number;
  evChargingPorts?: number;
  weldingEquipment?: boolean;
  compressorsHp?: number;
  conveyorSystems?: boolean;
  sortingGrading?: boolean;
  frostProtectionWind?: number;
  frostProtectionSprinklers?: number; // Acres

  // Section 5: Current Power Situation
  utilityName?: string;
  rateSchedule?: string;
  agriculturalRate?: boolean;
  hasTOU?: boolean;
  hasDemandCharges?: boolean;
  netMetering?: string; // 'yes', 'no', 'limited', 'notSure'
  standbyCharges?: boolean;

  monthlyBillPeak?: number;
  monthlyBillOffSeason?: number;
  annualEnergySpend?: number;
  peakDemandKw?: number;

  currentBackup?: string; // 'none', 'portable', 'diesel', etc.
  backupKw?: number;
  existingBattery?: number; // kWh
  existingSolar?: number; // kW

  outageFrequency?: string;
  outageImpact?: string[]; // Array of impacts

  // Section 6: Land & Solar Potential
  groundMountAcres?: number;
  rooftopSqFt?: number;
  parkingSqFt?: number;
  agrivoltaicsAcres?: number;
  canalPondAcres?: number;

  landConstraints?: string[]; // Array of constraints

  // Section 7: Goals & Priorities
  energyGoals?: string[]; // Array of goals
  priorities?: string[]; // Top 3 priorities
  financingPreference?: string;
}

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const AGRICULTURE_QUESTIONS = [
  // Section 1: Your Operation
  {
    id: "operationType",
    section: 1,
    sectionTitle: "Your Operation",
    type: "select",
    label: "What type of agricultural operation is this?",
    required: true,
    options: [
      { value: "rowCropsIrrigated", label: "Row Crops — Irrigated" },
      { value: "rowCropsDryland", label: "Row Crops — Dryland" },
      { value: "orchards", label: "Orchards / Tree Crops" },
      { value: "vineyards", label: "Vineyards" },
      { value: "dairy", label: "Dairy" },
      { value: "beefCattle", label: "Beef Cattle" },
      { value: "poultry", label: "Poultry" },
      { value: "hogs", label: "Hogs / Swine" },
      { value: "greenhouse", label: "Greenhouse / Nursery" },
      { value: "indoorVertical", label: "Indoor / Vertical Farming" },
      { value: "cannabisOutdoor", label: "Cannabis — Outdoor" },
      { value: "cannabisIndoor", label: "Cannabis — Indoor / Greenhouse" },
      { value: "packingProcessing", label: "Packing / Processing" },
      { value: "coldStorage", label: "Cold Storage" },
      { value: "aquaculture", label: "Aquaculture" },
      { value: "mixedOperation", label: "Mixed Operation" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "totalAcres",
    section: 1,
    type: "number",
    label: "Total acres farmed",
    required: false,
    conditional: {
      field: "operationType",
      values: [
        "rowCropsIrrigated",
        "rowCropsDryland",
        "orchards",
        "vineyards",
        "cannabisOutdoor",
        "aquaculture",
        "mixedOperation",
      ],
    },
    min: 1,
    max: 50000,
  },
  {
    id: "irrigatedAcres",
    section: 1,
    type: "number",
    label: "Irrigated acres",
    required: false,
    conditional: {
      field: "operationType",
      values: ["rowCropsIrrigated", "orchards", "vineyards", "mixedOperation"],
    },
    min: 0,
  },
  {
    id: "greenhouseSqFt",
    section: 1,
    type: "number",
    label: "Greenhouse / Indoor square feet",
    required: false,
    conditional: {
      field: "operationType",
      values: ["greenhouse", "indoorVertical", "cannabisIndoor"],
    },
    min: 0,
  },
  {
    id: "livestockSqFt",
    section: 1,
    type: "number",
    label: "Livestock buildings square feet",
    required: false,
    conditional: { field: "operationType", values: ["dairy", "beefCattle", "poultry", "hogs"] },
    min: 0,
  },
  {
    id: "numberOfAnimals",
    section: 1,
    type: "number",
    label: "Number of animals",
    required: false,
    conditional: { field: "operationType", values: ["dairy", "beefCattle", "poultry", "hogs"] },
    min: 0,
    helpText: "Cows, birds, or head depending on operation type",
  },
  {
    id: "coldStorageSqFt",
    section: 1,
    type: "number",
    label: "Cold storage square feet",
    required: false,
    conditional: { field: "operationType", values: ["coldStorage", "packingProcessing"] },
    min: 0,
  },
  {
    id: "yearsOperating",
    section: 1,
    type: "select",
    label: "How many years have you operated here?",
    required: false,
    options: [
      { value: "under2", label: "Under 2 years" },
      { value: "2to5", label: "2-5 years" },
      { value: "5to20", label: "5-20 years" },
      { value: "over20", label: "Over 20 years" },
      { value: "new", label: "New operation (planning stage)" },
    ],
  },

  // Section 2: Irrigation & Pumping
  {
    id: "irrigationTypes",
    section: 2,
    sectionTitle: "Irrigation & Pumping",
    type: "multiselect",
    label: "What type of irrigation do you use?",
    required: false,
    conditional: {
      field: "operationType",
      values: ["rowCropsIrrigated", "orchards", "vineyards", "mixedOperation"],
    },
    options: [
      { value: "centerPivot", label: "Center Pivot" },
      { value: "dripMicro", label: "Drip / Micro" },
      { value: "floodFurrow", label: "Flood / Furrow" },
      { value: "sprinkler", label: "Sprinkler (Other)" },
      { value: "subsurfaceDrip", label: "Sub-surface Drip" },
      { value: "none", label: "None" },
    ],
  },
  {
    id: "waterSource",
    section: 2,
    type: "select",
    label: "What's your water source?",
    required: false,
    conditional: { field: "irrigationTypes", notEmpty: true },
    options: [
      { value: "groundwater", label: "Groundwater Wells" },
      { value: "surface", label: "Surface Water (Canal, River)" },
      { value: "municipal", label: "Municipal / District Water" },
      { value: "pond", label: "Pond / Reservoir" },
      { value: "recycled", label: "Recycled Water" },
    ],
  },
  {
    id: "numberOfWells",
    section: 2,
    type: "number",
    label: "How many wells?",
    required: false,
    conditional: { field: "waterSource", value: "groundwater" },
    min: 0,
  },
  {
    id: "largestPumpHp",
    section: 2,
    type: "number",
    label: "Largest pump (HP)",
    required: false,
    conditional: { field: "irrigationTypes", notEmpty: true },
    min: 0,
  },
  {
    id: "totalPumpHp",
    section: 2,
    type: "number",
    label: "Total connected pump HP",
    required: false,
    conditional: { field: "irrigationTypes", notEmpty: true },
    min: 0,
  },
  {
    id: "pumpDepth",
    section: 2,
    type: "number",
    label: "Pump depth (if wells, in feet)",
    required: false,
    conditional: { field: "waterSource", value: "groundwater" },
    min: 0,
  },
  {
    id: "pumpingHoursPerDay",
    section: 2,
    type: "number",
    label: "Typical pumping hours/day (peak season)",
    required: false,
    conditional: { field: "irrigationTypes", notEmpty: true },
    min: 0,
    max: 24,
  },
  {
    id: "irrigationSeasonStart",
    section: 2,
    type: "select",
    label: "Irrigation season start month",
    required: false,
    conditional: { field: "irrigationTypes", notEmpty: true },
    options: [
      { value: "jan", label: "January" },
      { value: "feb", label: "February" },
      { value: "mar", label: "March" },
      { value: "apr", label: "April" },
      { value: "may", label: "May" },
      { value: "jun", label: "June" },
      { value: "jul", label: "July" },
      { value: "aug", label: "August" },
      { value: "sep", label: "September" },
      { value: "oct", label: "October" },
      { value: "nov", label: "November" },
      { value: "dec", label: "December" },
    ],
  },
  {
    id: "irrigationSeasonEnd",
    section: 2,
    type: "select",
    label: "Irrigation season end month",
    required: false,
    conditional: { field: "irrigationTypes", notEmpty: true },
    options: [
      { value: "jan", label: "January" },
      { value: "feb", label: "February" },
      { value: "mar", label: "March" },
      { value: "apr", label: "April" },
      { value: "may", label: "May" },
      { value: "jun", label: "June" },
      { value: "jul", label: "July" },
      { value: "aug", label: "August" },
      { value: "sep", label: "September" },
      { value: "oct", label: "October" },
      { value: "nov", label: "November" },
      { value: "dec", label: "December" },
    ],
  },
  {
    id: "pumpEnergySource",
    section: 2,
    type: "select",
    label: "What's your pump energy source?",
    required: false,
    conditional: { field: "irrigationTypes", notEmpty: true },
    options: [
      { value: "electric", label: "Electric (Utility)" },
      { value: "solar", label: "Electric (On-site Solar/Wind)" },
      { value: "diesel", label: "Diesel" },
      { value: "naturalGas", label: "Natural Gas" },
      { value: "propane", label: "Propane" },
      { value: "mix", label: "Mix" },
    ],
  },

  // Section 3: Livestock & Controlled Environment
  {
    id: "milkingParlor",
    section: 3,
    sectionTitle: "Livestock & Controlled Environment",
    type: "boolean",
    label: "Do you have a milking parlor?",
    required: false,
    conditional: { field: "operationType", value: "dairy" },
  },
  {
    id: "milkingStalls",
    section: 3,
    type: "number",
    label: "Number of milking stalls",
    required: false,
    conditional: { field: "milkingParlor", value: true },
    min: 0,
  },
  {
    id: "milkCoolingCapacity",
    section: 3,
    type: "number",
    label: "Milk cooling / Bulk tank capacity (gallons)",
    required: false,
    conditional: { field: "operationType", value: "dairy" },
    min: 0,
  },
  {
    id: "poultryHouses",
    section: 3,
    type: "number",
    label: "Number of poultry houses",
    required: false,
    conditional: { field: "operationType", value: "poultry" },
    min: 0,
  },
  {
    id: "poultryHouseSqFt",
    section: 3,
    type: "number",
    label: "Poultry house square feet (each)",
    required: false,
    conditional: { field: "poultryHouses", min: 1 },
    min: 0,
  },
  {
    id: "ventilationFanHp",
    section: 3,
    type: "number",
    label: "Livestock ventilation fans total HP",
    required: false,
    conditional: { field: "operationType", values: ["dairy", "poultry", "hogs", "beefCattle"] },
    min: 0,
  },
  {
    id: "greenhouseType",
    section: 3,
    type: "select",
    label: "Greenhouse type",
    required: false,
    conditional: { field: "operationType", values: ["greenhouse", "cannabisIndoor"] },
    options: [
      { value: "glass", label: "Glass" },
      { value: "poly", label: "Poly/Film" },
      { value: "highTunnel", label: "High Tunnel / Hoop House" },
    ],
  },
  {
    id: "growLightsLed",
    section: 3,
    type: "number",
    label: "Grow lights LED (kW)",
    required: false,
    conditional: {
      field: "operationType",
      values: ["greenhouse", "indoorVertical", "cannabisIndoor"],
    },
    min: 0,
  },
  {
    id: "growLightsHps",
    section: 3,
    type: "number",
    label: "Grow lights HPS (kW)",
    required: false,
    conditional: {
      field: "operationType",
      values: ["greenhouse", "indoorVertical", "cannabisIndoor"],
    },
    min: 0,
  },
  {
    id: "hvacTons",
    section: 3,
    type: "number",
    label: "HVAC units (tons)",
    required: false,
    conditional: {
      field: "operationType",
      values: ["greenhouse", "indoorVertical", "cannabisIndoor"],
    },
    min: 0,
  },

  // Section 4: Other Facilities & Equipment
  {
    id: "shopSqFt",
    section: 4,
    sectionTitle: "Other Facilities & Equipment",
    type: "number",
    label: "Shop / Equipment barn square feet",
    required: false,
    min: 0,
  },
  {
    id: "coldStorageSqFt2",
    section: 4,
    type: "number",
    label: "Cold storage / Cooler square feet",
    required: false,
    min: 0,
  },
  {
    id: "grainBins",
    section: 4,
    type: "number",
    label: "Grain handling / Bins (bushels)",
    required: false,
    min: 0,
  },
  {
    id: "grainDryerKw",
    section: 4,
    type: "number",
    label: "Grain dryer (kW)",
    required: false,
    min: 0,
  },
  {
    id: "electricVehicles",
    section: 4,
    type: "number",
    label: "Electric vehicles / UTVs",
    required: false,
    min: 0,
  },
  {
    id: "evChargingPorts",
    section: 4,
    type: "number",
    label: "EV charging ports (existing)",
    required: false,
    min: 0,
  },

  // Section 5: Current Power Situation
  {
    id: "hasTOU",
    section: 5,
    sectionTitle: "Current Power Situation",
    type: "boolean",
    label: "Time-of-use rate?",
    required: false,
  },
  {
    id: "hasDemandCharges",
    section: 5,
    type: "boolean",
    label: "Demand charges?",
    required: false,
  },
  {
    id: "monthlyBillPeak",
    section: 5,
    type: "select",
    label: "Monthly bill (peak season)",
    required: false,
    options: [
      { value: "under5k", label: "Under $5,000" },
      { value: "5kto15k", label: "$5,000 - $15,000" },
      { value: "15kto30k", label: "$15,000 - $30,000" },
      { value: "30kto60k", label: "$30,000 - $60,000" },
      { value: "60kto100k", label: "$60,000 - $100,000" },
      { value: "over100k", label: "Over $100,000" },
    ],
  },
  {
    id: "annualEnergySpend",
    section: 5,
    type: "select",
    label: "Annual electricity spend",
    required: false,
    options: [
      { value: "under50k", label: "Under $50,000" },
      { value: "50kto150k", label: "$50,000 - $150,000" },
      { value: "150kto300k", label: "$150,000 - $300,000" },
      { value: "300kto600k", label: "$300,000 - $600,000" },
      { value: "over600k", label: "Over $600,000" },
    ],
  },
  {
    id: "currentBackup",
    section: 5,
    type: "select",
    label: "Do you have backup power today?",
    required: false,
    options: [
      { value: "none", label: "None" },
      { value: "portable", label: "Portable Generator" },
      { value: "diesel", label: "Stationary Diesel Generator" },
      { value: "pto", label: "PTO Generator (Tractor)" },
      { value: "propane", label: "Propane Generator" },
      { value: "naturalGas", label: "Natural Gas Generator" },
      { value: "battery", label: "Battery Backup (Existing)" },
      { value: "solar", label: "Solar (Existing)" },
    ],
  },
  {
    id: "backupKw",
    section: 5,
    type: "number",
    label: "Backup generator capacity (kW)",
    required: false,
    conditional: { field: "currentBackup", notValue: "none" },
    min: 0,
  },
  {
    id: "outageFrequency",
    section: 5,
    type: "select",
    label: "How often do you experience power outages?",
    required: false,
    options: [
      { value: "rarely", label: "Rarely (less than once/year)" },
      { value: "occasionally", label: "Occasionally (1-3 times/year)" },
      { value: "frequently", label: "Frequently (monthly)" },
      { value: "veryFrequently", label: "Very Frequently (weekly in some seasons)" },
      { value: "psps", label: "PSPS / Fire Shutoffs Affect Us" },
    ],
  },
  {
    id: "outageImpact",
    section: 5,
    type: "multiselect",
    label: "What happens when power goes out?",
    required: false,
    options: [
      { value: "irrigationStops", label: "Irrigation stops — crop stress" },
      { value: "livestockAtRisk", label: "Livestock at risk (ventilation)" },
      { value: "milkSpoilage", label: "Milk spoilage / Dumping" },
      { value: "productLoss", label: "Product loss (cold storage)" },
      { value: "animalDeaths", label: "Animal deaths possible" },
      { value: "processingStops", label: "Processing / Packing stops" },
      { value: "minimalImpact", label: "Minimal impact — can wait" },
      { value: "hasBackup", label: "We have backup — can continue" },
    ],
  },

  // Section 6: Land & Solar Potential
  {
    id: "groundMountAcres",
    section: 6,
    sectionTitle: "Land & Solar Potential",
    type: "number",
    label: "Open land available for ground mount (acres)",
    required: false,
    min: 0,
  },
  {
    id: "rooftopSqFt",
    section: 6,
    type: "number",
    label: "Building rooftops available (sq ft)",
    required: false,
    min: 0,
  },
  {
    id: "agrivoltaicsAcres",
    section: 6,
    type: "number",
    label: "Agrivoltaics potential (dual-use with crops, acres)",
    required: false,
    min: 0,
  },

  // Section 7: Goals & Priorities
  {
    id: "energyGoals",
    section: 7,
    sectionTitle: "Goals & Priorities",
    type: "multiselect",
    label: "What are your energy goals?",
    required: false,
    options: [
      { value: "reduceCosts", label: "Reduce energy costs" },
      { value: "shiftIrrigation", label: "Shift irrigation to off-peak hours" },
      { value: "protectLivestock", label: "Protect livestock / Critical loads" },
      { value: "eliminateOutages", label: "Eliminate outage risk" },
      { value: "reduceDiesel", label: "Reduce diesel / Propane use" },
      { value: "sustainability", label: "Meet sustainability requirements" },
      { value: "preparePSPS", label: "Prepare for PSPS / Fire shutoffs" },
      { value: "electrify", label: "Electrify equipment (tractors, vehicles)" },
      { value: "maxNetMetering", label: "Maximize net metering value" },
      { value: "qualifyIncentives", label: "Qualify for USDA / State incentives" },
      { value: "reduceCarbon", label: "Reduce carbon footprint" },
    ],
  },
  {
    id: "priorities",
    section: 7,
    type: "ranking",
    label: "Rank what matters most (select top 3)",
    required: false,
    maxSelections: 3,
    options: [
      { value: "reduceCosts", label: "Reduce operating costs" },
      { value: "protectCritical", label: "Protect critical loads" },
      { value: "eliminateOutages", label: "Eliminate outages" },
      { value: "shiftPumping", label: "Shift to off-peak pumping" },
      { value: "sustainability", label: "Sustainability / Carbon" },
      { value: "electrify", label: "Electrify equipment" },
      { value: "quickPayback", label: "Quick payback" },
      { value: "maxIncentives", label: "Maximize incentives" },
    ],
  },
  {
    id: "financingPreference",
    section: 7,
    type: "select",
    label: "How would you prefer to finance?",
    required: false,
    options: [
      { value: "cash", label: "Cash Purchase" },
      { value: "loan", label: "Loan / Financing" },
      { value: "usdaReap", label: "USDA REAP Grant + Loan" },
      { value: "lease", label: "Lease" },
      { value: "ppa", label: "PPA (Third-party Ownership)" },
      { value: "notSure", label: "Not Sure — Need Guidance" },
    ],
  },
];

// ============================================================================
// CALCULATION FUNCTION
// ============================================================================

export interface AgricultureProfileResult {
  estimatedPeakKw: number;
  estimatedAnnualKwh: number;
  seasonalVariation: number;
  criticalLoadKw: number;
  recommendedBessKwh: number;
  recommendedSolarKw: number;
  recommendedGeneratorKw: number;
  irrigationLoadKw: number;
  livestockLoadKw: number;
  controlledEnvironmentLoadKw: number;
  otherLoadKw: number;
  touSavingsPotential: number;
  backupHoursRequired: number;
}

export function calculateAgricultureProfile(inputs: AgricultureInputs): AgricultureProfileResult {
  const profile = AGRICULTURE_PROFILES[inputs.operationType as keyof typeof AGRICULTURE_PROFILES];

  if (!profile) {
    // Default fallback
    return {
      estimatedPeakKw: 100,
      estimatedAnnualKwh: 200000,
      seasonalVariation: 3,
      criticalLoadKw: 50,
      recommendedBessKwh: 200,
      recommendedSolarKw: 100,
      recommendedGeneratorKw: 75,
      irrigationLoadKw: 0,
      livestockLoadKw: 0,
      controlledEnvironmentLoadKw: 0,
      otherLoadKw: 100,
      touSavingsPotential: 0,
      backupHoursRequired: 4,
    };
  }

  let estimatedPeakKw = profile.baseLoadKw || 20;
  let estimatedAnnualKwh = 0;
  let irrigationLoadKw = 0;
  let livestockLoadKw = 0;
  let controlledEnvironmentLoadKw = 0;
  let otherLoadKw = 0;
  let criticalLoadKw = 0;

  const profileAny = profile as any; // Type assertion for dynamic property access

  // Calculate based on operation type
  if (
    inputs.operationType === "rowCropsIrrigated" ||
    inputs.operationType === "rowCropsDryland" ||
    inputs.operationType === "orchards" ||
    inputs.operationType === "vineyards" ||
    inputs.operationType === "cannabisOutdoor" ||
    inputs.operationType === "aquaculture" ||
    inputs.operationType === "mixedOperation"
  ) {
    // Acreage-based calculation
    const acres = inputs.totalAcres || inputs.irrigatedAcres || 100;
    estimatedPeakKw = (profileAny.peakKwPerAcre || 0.3) * acres;
    estimatedAnnualKwh = (profileAny.kwhPerAcreYear || 400) * acres;

    // Add irrigation load if applicable
    if (
      inputs.irrigationTypes &&
      inputs.irrigationTypes.length > 0 &&
      !inputs.irrigationTypes.includes("none")
    ) {
      const irrigatedAcres = inputs.irrigatedAcres || acres * 0.7;

      // Calculate pump load
      if (inputs.totalPumpHp) {
        // 1 HP ≈ 0.746 kW, but with motor efficiency ~0.9, use 0.8 kW/HP
        irrigationLoadKw = inputs.totalPumpHp * 0.8;
      } else if (inputs.largestPumpHp) {
        irrigationLoadKw = inputs.largestPumpHp * 0.8;
      } else {
        // Estimate from acres
        irrigationLoadKw = irrigatedAcres * 0.3;
      }

      estimatedPeakKw = Math.max(estimatedPeakKw, irrigationLoadKw);
    }
  }

  // Livestock-based calculations
  if (inputs.operationType === "dairy") {
    const cows = inputs.numberOfAnimals || 200;
    estimatedPeakKw = (profileAny.peakKwPerCow || 0.15) * cows;
    estimatedAnnualKwh = (profileAny.kwhPerCowYear || 1200) * cows;

    // Add milking and cooling loads
    if (inputs.milkingParlor) {
      livestockLoadKw += 30; // Milking parlor base
    }
    if (inputs.milkCoolingCapacity) {
      livestockLoadKw += Math.max(20, inputs.milkCoolingCapacity / 100); // Cooling load
    }
    if (inputs.ventilationFanHp) {
      livestockLoadKw += inputs.ventilationFanHp * 0.8;
    }

    criticalLoadKw = livestockLoadKw; // Critical for dairy
  }

  if (inputs.operationType === "poultry") {
    const birds = inputs.numberOfAnimals || 50000;
    estimatedPeakKw = (profileAny.peakKwPerBird || 0.0002) * birds;
    estimatedAnnualKwh = (profileAny.kwhPerBirdYear || 1.5) * birds;

    // Ventilation is critical
    if (inputs.ventilationFanHp) {
      livestockLoadKw = inputs.ventilationFanHp * 0.8;
      criticalLoadKw = livestockLoadKw;
    } else {
      // Estimate from birds
      livestockLoadKw = birds * 0.00015; // ~0.15 kW per 1000 birds
      criticalLoadKw = livestockLoadKw;
    }
  }

  if (inputs.operationType === "beefCattle" || inputs.operationType === "hogs") {
    const head = inputs.numberOfAnimals || 1000;
    const headMultiplier =
      inputs.operationType === "beefCattle"
        ? profileAny.peakKwPerHead || 0.01
        : profileAny.peakKwPerHead || 0.005;
    estimatedPeakKw = headMultiplier * head;
    estimatedAnnualKwh = (profileAny.kwhPerHeadYear || 30) * head;

    if (inputs.ventilationFanHp) {
      livestockLoadKw = inputs.ventilationFanHp * 0.8;
      criticalLoadKw = livestockLoadKw * 0.5; // Partial critical load
    }
  }

  // Controlled environment calculations
  if (
    inputs.operationType === "greenhouse" ||
    inputs.operationType === "indoorVertical" ||
    inputs.operationType === "cannabisIndoor"
  ) {
    const sqFt = inputs.greenhouseSqFt || inputs.greenhouseSqFt2 || 10000;
    estimatedPeakKw = (profileAny.peakKwPerSqFt || 0.008) * sqFt;
    estimatedAnnualKwh = (profileAny.kwhPerSqFtYear || 60) * sqFt;

    // Add lighting load
    if (inputs.growLightsLed) {
      controlledEnvironmentLoadKw += inputs.growLightsLed;
    }
    if (inputs.growLightsHps) {
      controlledEnvironmentLoadKw += inputs.growLightsHps * 1.1; // HPS includes ballast
    }

    // Add HVAC load
    if (inputs.hvacTons) {
      controlledEnvironmentLoadKw += inputs.hvacTons * 3.5; // ~3.5 kW per ton
    }

    // Add other climate control
    if (inputs.exhaustFanHp) {
      controlledEnvironmentLoadKw += inputs.exhaustFanHp * 0.8;
    }
    if (inputs.electricHeaterKw) {
      controlledEnvironmentLoadKw += inputs.electricHeaterKw;
    }

    estimatedPeakKw = Math.max(estimatedPeakKw, controlledEnvironmentLoadKw);
  }

  // Cold storage / Processing
  if (inputs.operationType === "coldStorage" || inputs.operationType === "packingProcessing") {
    const sqFt = inputs.coldStorageSqFt || inputs.coldStorageSqFt2 || 20000;
    estimatedPeakKw = (profileAny.peakKwPerSqFt || 0.005) * sqFt;
    estimatedAnnualKwh = (profileAny.kwhPerSqFtYear || 45) * sqFt;

    // Refrigeration is critical
    criticalLoadKw = estimatedPeakKw * 0.7; // 70% is refrigeration
  }

  // Add other facility loads
  if (inputs.shopSqFt) {
    otherLoadKw += inputs.shopSqFt * 0.002; // 2 W/sq ft
  }
  if (inputs.grainDryerKw) {
    otherLoadKw += inputs.grainDryerKw;
  }
  if (inputs.compressorsHp) {
    otherLoadKw += inputs.compressorsHp * 0.8;
  }

  // Total peak demand
  estimatedPeakKw = Math.max(
    estimatedPeakKw,
    irrigationLoadKw + livestockLoadKw + controlledEnvironmentLoadKw + otherLoadKw
  );

  // Apply seasonal variation
  const seasonalMultiplier = profileAny.seasonalMultiplier || 3;
  const peakSeasonKw = estimatedPeakKw * seasonalMultiplier;

  // Calculate annual kWh with seasonal variation
  const peakSeasonMonths =
    inputs.irrigationSeasonStart && inputs.irrigationSeasonEnd
      ? calculateSeasonMonths(inputs.irrigationSeasonStart, inputs.irrigationSeasonEnd)
      : 6;
  const offSeasonMonths = 12 - peakSeasonMonths;

  const peakSeasonKwh = peakSeasonKw * peakSeasonMonths * 730; // 730 hours per month
  const offSeasonKwh = estimatedPeakKw * offSeasonMonths * 730;
  estimatedAnnualKwh = peakSeasonKwh + offSeasonKwh;

  // If annual kWh wasn't calculated from profile, estimate from peak
  if (estimatedAnnualKwh === 0) {
    estimatedAnnualKwh = estimatedPeakKw * 8760 * 0.4; // 40% capacity factor
  }

  // Determine backup hours based on critical loads
  let backupHoursRequired = 4; // Default
  if (inputs.outageImpact) {
    if (inputs.outageImpact.includes("animalDeaths")) {
      backupHoursRequired = 24; // Critical for livestock
    } else if (
      inputs.outageImpact.includes("milkSpoilage") ||
      inputs.outageImpact.includes("productLoss")
    ) {
      backupHoursRequired = 12;
    } else if (inputs.outageImpact.includes("irrigationStops")) {
      backupHoursRequired = 8;
    }
  }

  // Calculate TOU savings potential
  let touSavingsPotential = 0;
  if (inputs.hasTOU && irrigationLoadKw > 0) {
    // Assume 30% of irrigation can be shifted to off-peak
    const shiftableKw = irrigationLoadKw * 0.3;
    const peakRate = 0.25; // $/kWh peak
    const offPeakRate = 0.1; // $/kWh off-peak
    const savingsPerKwh = peakRate - offPeakRate;
    const shiftableKwh = shiftableKw * peakSeasonMonths * 730;
    touSavingsPotential = shiftableKwh * savingsPerKwh;
  }

  // System sizing recommendations
  let recommendedBessKwh = 0;
  let recommendedSolarKw = 0;
  let recommendedGeneratorKw = 0;

  if (
    inputs.operationType === "rowCropsIrrigated" ||
    inputs.operationType === "rowCropsDryland" ||
    inputs.operationType === "orchards" ||
    inputs.operationType === "vineyards" ||
    inputs.operationType === "cannabisOutdoor" ||
    inputs.operationType === "aquaculture" ||
    inputs.operationType === "mixedOperation"
  ) {
    const acres = inputs.totalAcres || inputs.irrigatedAcres || 100;
    recommendedBessKwh = (profileAny.bessKwhPerAcre || 0.3) * acres;
    recommendedSolarKw = (profileAny.solarKwPerAcre || 0.2) * acres;
    recommendedGeneratorKw = (profileAny.generatorKwPerAcre || 0.1) * acres;
  } else if (inputs.operationType === "dairy") {
    const cows = inputs.numberOfAnimals || 200;
    recommendedBessKwh = (profileAny.bessKwhPerCow || 0.3) * cows;
    recommendedSolarKw = (profileAny.solarKwPerCow || 0.2) * cows;
    recommendedGeneratorKw = (profileAny.generatorKwPerCow || 0.15) * cows;
  } else if (inputs.operationType === "poultry") {
    const birds = inputs.numberOfAnimals || 50000;
    recommendedBessKwh = (profileAny.bessKwhPerBird || 0.0003) * birds;
    recommendedSolarKw = (profileAny.solarKwPerBird || 0.0002) * birds;
    recommendedGeneratorKw = (profileAny.generatorKwPerBird || 0.0001) * birds;
  } else if (
    inputs.operationType === "greenhouse" ||
    inputs.operationType === "indoorVertical" ||
    inputs.operationType === "cannabisIndoor"
  ) {
    const sqFt = inputs.greenhouseSqFt || inputs.greenhouseSqFt2 || 10000;
    recommendedBessKwh = (profileAny.bessKwhPerSqFt || 0.01) * sqFt;
    recommendedSolarKw = (profileAny.solarKwPerSqFt || 0.006) * sqFt;
    recommendedGeneratorKw = (profileAny.generatorKwPerSqFt || 0.004) * sqFt;
  } else if (
    inputs.operationType === "coldStorage" ||
    inputs.operationType === "packingProcessing"
  ) {
    const sqFt = inputs.coldStorageSqFt || inputs.coldStorageSqFt2 || 20000;
    recommendedBessKwh = (profileAny.bessKwhPerSqFt || 0.01) * sqFt;
    recommendedSolarKw = (profileAny.solarKwPerSqFt || 0.006) * sqFt;
    recommendedGeneratorKw = (profileAny.generatorKwPerSqFt || 0.004) * sqFt;
  }

  // Adjust BESS for backup requirements
  if (backupHoursRequired > 4) {
    recommendedBessKwh = Math.max(recommendedBessKwh, criticalLoadKw * backupHoursRequired);
  }

  // Adjust solar based on land availability
  if (inputs.groundMountAcres) {
    // ~1 MW per 5 acres for ground mount
    const maxSolarFromLand = inputs.groundMountAcres * 200; // kW
    recommendedSolarKw = Math.min(recommendedSolarKw, maxSolarFromLand);
  }

  return {
    estimatedPeakKw: Math.round(estimatedPeakKw),
    estimatedAnnualKwh: Math.round(estimatedAnnualKwh),
    seasonalVariation: seasonalMultiplier,
    criticalLoadKw: Math.round(criticalLoadKw),
    recommendedBessKwh: Math.round(recommendedBessKwh),
    recommendedSolarKw: Math.round(recommendedSolarKw),
    recommendedGeneratorKw: Math.round(recommendedGeneratorKw),
    irrigationLoadKw: Math.round(irrigationLoadKw),
    livestockLoadKw: Math.round(livestockLoadKw),
    controlledEnvironmentLoadKw: Math.round(controlledEnvironmentLoadKw),
    otherLoadKw: Math.round(otherLoadKw),
    touSavingsPotential: Math.round(touSavingsPotential),
    backupHoursRequired,
  };
}

// Helper function to calculate season months
function calculateSeasonMonths(start: string, end: string): number {
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const startIdx = months.indexOf(start);
  const endIdx = months.indexOf(end);

  if (startIdx === -1 || endIdx === -1) return 6; // Default 6 months

  if (endIdx >= startIdx) {
    return endIdx - startIdx + 1;
  } else {
    // Wraps around year
    return 12 - startIdx + endIdx + 1;
  }
}

// ============================================================================
// GET QUESTIONS FUNCTION
// ============================================================================

export function getQuestionsForAgriculture(operationType?: string): typeof AGRICULTURE_QUESTIONS {
  if (!operationType) {
    // Return all questions
    return AGRICULTURE_QUESTIONS;
  }

  // Filter questions based on operation type and conditionals
  return AGRICULTURE_QUESTIONS.filter((q) => {
    // Always show questions without conditionals
    if (!q.conditional) return true;

    const cond = q.conditional;

    // Handle field value conditions
    if ("field" in cond && "value" in cond) {
      // This would need to be checked against actual inputs
      // For now, return all questions and let the UI handle conditional display
      return true;
    }

    // Handle field values array
    if ("field" in cond && "values" in cond) {
      // This would need to be checked against actual inputs
      return true;
    }

    // Handle notEmpty
    if ("notEmpty" in cond) {
      // This would need to be checked against actual inputs
      return true;
    }

    return true;
  }) as typeof AGRICULTURE_QUESTIONS;
}
