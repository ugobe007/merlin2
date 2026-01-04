/**
 * RESTAURANT INDUSTRY PROFILE
 * ===========================
 *
 * Data-driven sizing calculations and question tiers for Restaurants.
 * Based on industry workup by Bob Christopher & Vineet Kapila, December 2025.
 *
 * KEY INSIGHT: Restaurants are energy-intensive per square foot — kitchens are
 * power hogs. Type of cuisine and service model matter significantly.
 *
 * KEY SIZING DRIVERS:
 * 1. Restaurant Type - QSR vs Fine Dining = 2x difference
 * 2. Kitchen Fuel - Gas vs Electric = very different profiles
 * 3. Cooking Equipment - 50-70% of total load
 * 4. Refrigeration - Walk-ins, reach-ins always running
 * 5. Operating Hours - Breakfast-lunch vs dinner-only vs 24/7
 *
 * UNIQUE FACTORS:
 * - High energy density per sq ft
 * - Peak demand during lunch/dinner rushes
 * - Exhaust/ventilation runs constantly during service
 * - Food spoilage risk during outages
 */

// ============================================================================
// RESTAURANT SUB-TYPES
// ============================================================================

export const RESTAURANT_TYPES = {
  qsr: {
    label: "Quick Service (QSR)",
    examples: ["McDonald's", "Taco Bell", "Chick-fil-A"],

    typicalSqFt: { min: 1500, max: 4500 },
    kwhPerSqFtYear: { min: 60, max: 100 },
    defaultKwhPerSqFt: 80,

    typicalPeakKw: { min: 50, max: 175 },
    typicalAnnualKwh: { min: 100000, max: 400000 },

    bessKwh: { min: 50, max: 300 },
    solarKw: { min: 25, max: 150 },
    generatorKw: { min: 50, max: 150 },

    kitchenPercent: 60,
    hasDriveThru: true,

    questionTier: 1,
    questionsShown: 14,
  },

  fastCasual: {
    label: "Fast Casual",
    examples: ["Chipotle", "Panera", "Five Guys"],

    typicalSqFt: { min: 2500, max: 4000 },
    kwhPerSqFtYear: { min: 50, max: 80 },
    defaultKwhPerSqFt: 65,

    typicalPeakKw: { min: 75, max: 150 },
    typicalAnnualKwh: { min: 150000, max: 300000 },

    bessKwh: { min: 75, max: 200 },
    solarKw: { min: 40, max: 120 },
    generatorKw: { min: 50, max: 125 },

    kitchenPercent: 55,

    questionTier: 1,
    questionsShown: 14,
  },

  casualDining: {
    label: "Casual Dining",
    examples: ["Applebee's", "Olive Garden", "Chili's"],

    typicalSqFt: { min: 4000, max: 8000 },
    kwhPerSqFtYear: { min: 40, max: 60 },
    defaultKwhPerSqFt: 50,

    typicalPeakKw: { min: 100, max: 250 },
    typicalAnnualKwh: { min: 250000, max: 500000 },

    bessKwh: { min: 150, max: 400 },
    solarKw: { min: 75, max: 200 },
    generatorKw: { min: 100, max: 200 },

    kitchenPercent: 50,

    questionTier: 2,
    questionsShown: 16,
  },

  fineDining: {
    label: "Fine Dining",
    examples: ["High-end, full service"],

    typicalSqFt: { min: 3000, max: 6000 },
    kwhPerSqFtYear: { min: 35, max: 50 },
    defaultKwhPerSqFt: 42,

    typicalPeakKw: { min: 75, max: 175 },
    typicalAnnualKwh: { min: 150000, max: 350000 },

    bessKwh: { min: 100, max: 300 },
    solarKw: { min: 50, max: 150 },
    generatorKw: { min: 75, max: 150 },

    kitchenPercent: 45,
    powerQualityImportant: true,

    questionTier: 2,
    questionsShown: 16,
  },

  cafe: {
    label: "Cafe / Coffee Shop",
    examples: ["Starbucks", "Independent cafe"],

    typicalSqFt: { min: 1000, max: 2500 },
    kwhPerSqFtYear: { min: 30, max: 50 },
    defaultKwhPerSqFt: 40,

    typicalPeakKw: { min: 30, max: 75 },
    typicalAnnualKwh: { min: 50000, max: 150000 },

    bessKwh: { min: 30, max: 100 },
    solarKw: { min: 20, max: 60 },
    generatorKw: { min: 25, max: 75 },

    kitchenPercent: 35,
    espressoHeavy: true,

    questionTier: 1,
    questionsShown: 12,
  },

  barNightclub: {
    label: "Bar / Brewery / Nightclub",
    examples: ["Drinks-focused, limited food"],

    typicalSqFt: { min: 3000, max: 10000 },
    kwhPerSqFtYear: { min: 35, max: 55 },
    defaultKwhPerSqFt: 45,

    typicalPeakKw: { min: 100, max: 300 },
    typicalAnnualKwh: { min: 200000, max: 600000 },

    bessKwh: { min: 100, max: 400 },
    solarKw: { min: 50, max: 200 },
    generatorKw: { min: 75, max: 250 },

    kitchenPercent: 25,
    hvacHeavy: true,
    lightingHeavy: true,

    questionTier: 2,
    questionsShown: 14,
  },

  ghostKitchen: {
    label: "Ghost Kitchen / Delivery Only",
    examples: ["No customer seating"],

    typicalSqFt: { min: 1000, max: 3000 },
    kwhPerSqFtYear: { min: 80, max: 120 },
    defaultKwhPerSqFt: 100,

    typicalPeakKw: { min: 75, max: 200 },
    typicalAnnualKwh: { min: 150000, max: 400000 },

    bessKwh: { min: 150, max: 500 },
    solarKw: { min: 75, max: 250 },
    generatorKw: { min: 100, max: 200 },

    kitchenPercent: 75, // All kitchen, no FOH

    questionTier: 2,
    questionsShown: 14,
  },

  bakery: {
    label: "Bakery / Dessert",
    examples: ["Ovens, pastry focus"],

    typicalSqFt: { min: 1000, max: 3000 },
    kwhPerSqFtYear: { min: 50, max: 75 },
    defaultKwhPerSqFt: 62,

    typicalPeakKw: { min: 50, max: 150 },
    typicalAnnualKwh: { min: 75000, max: 250000 },

    bessKwh: { min: 50, max: 200 },
    solarKw: { min: 30, max: 100 },
    generatorKw: { min: 50, max: 125 },

    kitchenPercent: 65,
    ovenHeavy: true,
    earlyHours: true,

    questionTier: 1,
    questionsShown: 14,
  },

  pizza: {
    label: "Pizza",
    examples: ["Domino's", "Independent pizzeria"],

    typicalSqFt: { min: 1200, max: 3000 },
    kwhPerSqFtYear: { min: 55, max: 85 },
    defaultKwhPerSqFt: 70,

    typicalPeakKw: { min: 60, max: 150 },
    typicalAnnualKwh: { min: 100000, max: 300000 },

    bessKwh: { min: 75, max: 250 },
    solarKw: { min: 40, max: 125 },
    generatorKw: { min: 50, max: 150 },

    kitchenPercent: 60,
    ovenHeavy: true,

    questionTier: 1,
    questionsShown: 14,
  },

  foodHall: {
    label: "Food Hall / Multi-Vendor",
    examples: ["Shared space, multiple concepts"],

    typicalSqFt: { min: 5000, max: 20000 },
    kwhPerSqFtYear: { min: 50, max: 70 },
    defaultKwhPerSqFt: 60,

    typicalPeakKw: { min: 150, max: 500 },
    typicalAnnualKwh: { min: 400000, max: 1200000 },

    bessKwh: { min: 250, max: 750 },
    solarKw: { min: 100, max: 400 },
    generatorKw: { min: 150, max: 400 },

    kitchenPercent: 55,
    multiVendor: true,

    questionTier: 2,
    questionsShown: 16,
  },
};

// ============================================================================
// COOKING FUEL TYPES
// ============================================================================

export const COOKING_FUEL = {
  allElectric: {
    label: "All electric",
    impact: "Higher electrical load, good for solar/BESS",
    electricMultiplier: 1.3,
  },
  mostlyGas: {
    label: "Mostly gas",
    impact: "Lower electrical, gas for cooking",
    electricMultiplier: 0.7,
  },
  hybrid: {
    label: "Hybrid",
    impact: "Mix of gas and electric",
    electricMultiplier: 1.0,
  },
  induction: {
    label: "Induction",
    impact: "Electric but very efficient",
    electricMultiplier: 1.1,
  },
};

// ============================================================================
// KITCHEN EQUIPMENT
// ============================================================================

export const KITCHEN_EQUIPMENT = {
  fryers: { label: "Fryers", kwEach: { gas: 0, electric: 15 }, typical: 2 },
  grillsGriddles: { label: "Grills / Griddles", kwEach: { gas: 0, electric: 12 }, typical: 1 },
  ovensStandard: { label: "Ovens (standard)", kwEach: { gas: 1, electric: 10 }, typical: 1 },
  ovensConvection: { label: "Convection ovens", kwEach: { gas: 1, electric: 12 }, typical: 1 },
  ovensPizza: { label: "Pizza ovens", kwEach: { gas: 2, electric: 20 }, typical: 1 },
  ovensCombi: { label: "Combi ovens", kwEach: { gas: 0, electric: 18 }, typical: 1 },
  steamEquipment: { label: "Steam equipment", kwEach: { gas: 1, electric: 15 }, typical: 1 },
  wokRange: { label: "Wok range", kwEach: { gas: 0, electric: 0 }, typical: 1 }, // Gas only
  charbroiler: { label: "Charbroiler", kwEach: { gas: 0, electric: 10 }, typical: 1 },
};

// ============================================================================
// REFRIGERATION EQUIPMENT
// ============================================================================

export const REFRIGERATION_EQUIPMENT = {
  walkInCooler: { label: "Walk-in cooler", kwEach: 3, typical: 1 },
  walkInFreezer: { label: "Walk-in freezer", kwEach: 5, typical: 1 },
  reachInRefrig: { label: "Reach-in refrigerators", kwEach: 1, typical: 3 },
  reachInFreezer: { label: "Reach-in freezers", kwEach: 1.5, typical: 2 },
  prepTables: { label: "Prep tables (refrigerated)", kwEach: 0.5, typical: 2 },
  displayCases: { label: "Display cases", kwEach: 1.5, typical: 1 },
  iceMachines: { label: "Ice machines", kwEach: 1.5, typical: 1 },
};

// ============================================================================
// OPERATING HOURS & PEAKS
// ============================================================================

export const MEAL_PERIODS = {
  breakfast: { label: "Breakfast", typicalHours: "6 AM - 10 AM", peakIncrease: 0.4 },
  lunch: { label: "Lunch", typicalHours: "11 AM - 2 PM", peakIncrease: 0.6 },
  dinner: { label: "Dinner", typicalHours: "5 PM - 9 PM", peakIncrease: 0.75 },
  lateNight: { label: "Late Night", typicalHours: "10 PM - 2 AM", peakIncrease: 0.3 },
  twentyFourSeven: { label: "24/7", typicalHours: "Always open", peakIncrease: 0.5 },
};

export const PEAK_TIMES = {
  breakfastRush: { label: "Breakfast rush", time: "7-9 AM", increase: "30-50% above base" },
  lunchRush: { label: "Lunch rush", time: "11 AM - 1 PM", increase: "50-75% above base" },
  dinnerRush: { label: "Dinner rush", time: "6-8 PM", increase: "50-100% above base" },
  lateNight: { label: "Late night", time: "10 PM - 2 AM", increase: "Varies" },
  weekendBrunch: { label: "Weekend brunch", time: "Sat/Sun AM", increase: "Can be highest" },
};

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const RESTAURANT_QUESTIONS = {
  // SECTION 1: Your Restaurant
  section1: [
    {
      id: "restaurantType",
      question: "What type of restaurant is this?",
      type: "select",
      options: [
        {
          value: "qsr",
          label: "Quick Service (QSR)",
          examples: "McDonald's, Taco Bell, Chick-fil-A",
        },
        { value: "fastCasual", label: "Fast Casual", examples: "Chipotle, Panera, Five Guys" },
        {
          value: "casualDining",
          label: "Casual Dining",
          examples: "Applebee's, Olive Garden, Chili's",
        },
        { value: "fineDining", label: "Fine Dining", examples: "High-end, full service" },
        { value: "cafe", label: "Cafe / Coffee Shop", examples: "Starbucks, independent cafe" },
        {
          value: "barNightclub",
          label: "Bar / Brewery / Nightclub",
          examples: "Drinks-focused, limited food",
        },
        {
          value: "ghostKitchen",
          label: "Ghost Kitchen / Delivery Only",
          examples: "No customer seating",
        },
        { value: "bakery", label: "Bakery / Dessert", examples: "Ovens, pastry focus" },
        { value: "pizza", label: "Pizza", examples: "Domino's, independent pizzeria" },
        {
          value: "foodHall",
          label: "Food Hall / Multi-Vendor",
          examples: "Shared space, multiple concepts",
        },
        { value: "other", label: "Other", examples: "Describe" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "restaurantSqFt",
      question: "What's your restaurant size?",
      type: "slider",
      min: 500,
      max: 15000,
      step: 100,
      default: 3000,
      unit: "sq ft",
      required: true,
      impactLevel: "critical",
    },
    {
      id: "ownershipType",
      question: "Single location or chain?",
      type: "select",
      options: [
        { value: "independent", label: "Independent", description: "Single owner" },
        {
          value: "franchiseSingle",
          label: "Franchise (single)",
          description: "One franchise location",
        },
        {
          value: "franchiseMulti",
          label: "Franchise (multi-unit)",
          description: "Multiple locations",
        },
        { value: "corporateChain", label: "Corporate chain", description: "Company-owned" },
      ],
      impactLevel: "low",
    },
  ],

  // SECTION 2: Kitchen & Equipment
  section2: [
    {
      id: "cookingFuel",
      question: "What's your primary cooking fuel?",
      type: "select",
      options: [
        {
          value: "allElectric",
          label: "All electric",
          impact: "Higher electrical load, good for solar/BESS",
        },
        { value: "mostlyGas", label: "Mostly gas", impact: "Lower electrical, gas for cooking" },
        { value: "hybrid", label: "Hybrid", impact: "Mix of gas and electric" },
        { value: "induction", label: "Induction", impact: "Electric but very efficient" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "kitchenEquipment",
      question: "What major kitchen equipment do you have?",
      type: "multiselect",
      options: [
        { value: "fryers", label: "Fryers" },
        { value: "grillsGriddles", label: "Grills / Griddles" },
        { value: "ovensStandard", label: "Ovens (standard)" },
        { value: "ovensConvection", label: "Convection ovens" },
        { value: "ovensPizza", label: "Pizza ovens" },
        { value: "ovensCombi", label: "Combi ovens" },
        { value: "steamEquipment", label: "Steam equipment" },
        { value: "wokRange", label: "Wok range" },
        { value: "charbroiler", label: "Charbroiler" },
      ],
      impactLevel: "high",
    },
    {
      id: "refrigerationEquipment",
      question: "What refrigeration do you have?",
      type: "multiselect",
      options: [
        { value: "walkInCooler", label: "Walk-in cooler" },
        { value: "walkInFreezer", label: "Walk-in freezer" },
        { value: "reachInRefrig", label: "Reach-in refrigerators" },
        { value: "reachInFreezer", label: "Reach-in freezers" },
        { value: "prepTables", label: "Prep tables (refrigerated)" },
        { value: "displayCases", label: "Display cases" },
        { value: "iceMachines", label: "Ice machines" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "otherEquipment",
      question: "Other significant equipment?",
      type: "multiselect",
      options: [
        { value: "espressoMachines", label: "Espresso machines" },
        { value: "dishwasher", label: "Dishwasher (commercial)" },
        { value: "driveThru", label: "Drive-thru equipment" },
        { value: "heatLamps", label: "Heat lamps / Warming stations" },
        { value: "beverageDispensers", label: "Beverage dispensers" },
        { value: "draftBeer", label: "Draft beer system" },
        { value: "ventilationHood", label: "Ventilation / Hood system" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 3: Operations
  section3: [
    {
      id: "mealPeriods",
      question: "What are your operating hours?",
      type: "multiselect",
      options: [
        { value: "breakfast", label: "Breakfast" },
        { value: "lunch", label: "Lunch" },
        { value: "dinner", label: "Dinner" },
        { value: "lateNight", label: "Late Night" },
        { value: "twentyFourSeven", label: "24/7" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "peakTimes",
      question: "What are your peak service times?",
      type: "multiselect",
      options: [
        {
          value: "breakfastRush",
          label: "Breakfast rush",
          time: "7-9 AM",
          increase: "30-50% above base",
        },
        {
          value: "lunchRush",
          label: "Lunch rush",
          time: "11 AM - 1 PM",
          increase: "50-75% above base",
        },
        {
          value: "dinnerRush",
          label: "Dinner rush",
          time: "6-8 PM",
          increase: "50-100% above base",
        },
        { value: "lateNight", label: "Late night", time: "10 PM - 2 AM", increase: "Varies" },
        { value: "weekendBrunch", label: "Weekend brunch", increase: "Can be highest" },
      ],
      impactLevel: "medium",
    },
    {
      id: "hasDriveThru",
      question: "Do you have a drive-thru?",
      type: "select",
      options: [
        { value: "single", label: "Yes — single lane" },
        { value: "double", label: "Yes — double lane" },
        { value: "no", label: "No" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 4: Current Power Situation
  section4: [
    {
      id: "monthlyEnergySpend",
      question: "What's your approximate monthly energy spend?",
      type: "select",
      options: [
        { value: 750, label: "Under $1,500" },
        { value: 2250, label: "$1,500 - $3,000" },
        { value: 4500, label: "$3,000 - $6,000" },
        { value: 9000, label: "$6,000 - $12,000" },
        { value: 18500, label: "$12,000 - $25,000" },
        { value: 35000, label: "Over $25,000" },
        { value: 0, label: "Prefer not to say" },
      ],
      impactLevel: "high",
    },
    {
      id: "currentBackup",
      question: "Do you have backup power today?",
      type: "select",
      options: [
        { value: "none", label: "None" },
        { value: "refrigerationOnly", label: "Small generator (refrigeration only)" },
        { value: "fullKitchen", label: "Full kitchen backup" },
        { value: "upsOnly", label: "UPS for POS only" },
        { value: "notSure", label: "Not sure" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "outageImpact",
      question: "What happens when power goes out?",
      type: "multiselect",
      options: [
        { value: "immediateClosure", label: "Immediate closure" },
        { value: "finishOrders", label: "Can finish current orders, then close" },
        { value: "foodSpoilage", label: "Food spoilage (walk-ins, freezers)" },
        { value: "safetyConcerns", label: "Safety concerns (ventilation, lighting)" },
        { value: "continueOperating", label: "We have backup, can continue operating" },
      ],
      impactLevel: "high",
    },
  ],

  // SECTION 5: Space & Property
  section5: [
    {
      id: "propertyType",
      question: "Do you own or lease?",
      type: "select",
      options: [
        { value: "own", label: "Own building", impact: "Full control" },
        { value: "leaseNNN", label: "Lease — NNN", impact: "Tenant pays utilities" },
        { value: "leaseGross", label: "Lease — Gross", impact: "Landlord pays" },
        {
          value: "stripMallFoodCourt",
          label: "Strip mall / Food court",
          impact: "Shared building",
        },
      ],
      impactLevel: "medium",
    },
    {
      id: "solarPotential",
      question: "Do you have space for solar?",
      type: "select",
      options: [
        { value: "ownRoof", label: "Own roof", description: "Full access" },
        { value: "sharedRoof", label: "Shared roof", description: "Multi-tenant, need approval" },
        { value: "parkingPatio", label: "Parking lot / Patio", description: "Canopy potential" },
        { value: "none", label: "No space", description: "Urban, limited" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 6: Goals & Priorities
  section6: [
    {
      id: "energyGoals",
      question: "What are your energy goals?",
      type: "multiselect",
      options: [
        { value: "reduceCosts", label: "Reduce energy costs" },
        { value: "protectOutages", label: "Protect against outages" },
        { value: "protectRefrigeration", label: "Keep refrigeration running during outages" },
        { value: "franchiseRequirements", label: "Meet franchise sustainability requirements" },
        { value: "reduceDemand", label: "Reduce demand charges" },
        { value: "addEvCharging", label: "Add EV charging for customers" },
        { value: "electrifyKitchen", label: "Electrify kitchen (replace gas)" },
        { value: "incentives", label: "Qualify for incentives/rebates" },
      ],
      impactLevel: "medium",
    },
    {
      id: "priorities",
      question: "Rank what matters most (Select top 3)",
      type: "ranking",
      maxSelections: 3,
      options: [
        {
          value: "reduceCosts",
          label: "Reduce operating costs",
          description: "Lower utility bills",
        },
        {
          value: "protectInventory",
          label: "Protect food inventory",
          description: "Refrigeration backup",
        },
        {
          value: "keepKitchenRunning",
          label: "Keep kitchen running",
          description: "Backup power for cooking",
        },
        { value: "quickPayback", label: "Quick payback", description: "ROI within 2-3 years" },
        {
          value: "sustainability",
          label: "Sustainability",
          description: "Corporate/franchise requirements",
        },
        {
          value: "minimalDisruption",
          label: "Minimal disruption",
          description: "Can't close for installation",
        },
      ],
      required: true,
      impactLevel: "high",
    },
  ],
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export interface RestaurantInputs {
  restaurantType: string;
  restaurantSqFt: number;
  ownershipType?: string;
  cookingFuel: string;
  kitchenEquipment?: string[];
  refrigerationEquipment: string[];
  otherEquipment?: string[];
  mealPeriods: string[];
  peakTimes?: string[];
  hasDriveThru?: string;
  monthlyEnergySpend?: number;
  currentBackup: string;
  outageImpact?: string[];
  propertyType?: string;
  solarPotential?: string;
  energyGoals?: string[];
  priorities: string[];
}

export interface RestaurantCalculations {
  // Load estimates
  estimatedPeakKw: number;
  estimatedAnnualKwh: number;
  estimatedAnnualSpend: number;

  // Load breakdown
  kitchenKw: number;
  refrigerationKw: number;
  hvacKw: number;
  lightingKw: number;

  // System recommendations
  recommendedBessKwh: number;
  recommendedSolarKw: number;
  recommendedGeneratorKw: number;

  // Peak analysis
  peakDemandMultiplier: number;

  // Food safety
  refrigerationBackupHours: number;
  foodSpoilageRisk: number;

  // Savings
  annualSavings: number;
  demandChargeSavings: number;

  // Confidence
  confidenceLevel: "low" | "medium" | "high";
  warnings: string[];
  recommendations: string[];
}

export function calculateRestaurantProfile(inputs: RestaurantInputs): RestaurantCalculations {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Get restaurant type profile
  const profile = RESTAURANT_TYPES[inputs.restaurantType as keyof typeof RESTAURANT_TYPES];
  const fuel = COOKING_FUEL[inputs.cookingFuel as keyof typeof COOKING_FUEL];

  // Calculate base load from sq ft
  const kwhPerSqFt = profile?.defaultKwhPerSqFt || 60;
  let estimatedAnnualKwh = inputs.restaurantSqFt * kwhPerSqFt;

  // Adjust for cooking fuel
  const electricMultiplier = fuel?.electricMultiplier || 1.0;
  estimatedAnnualKwh *= electricMultiplier;

  // Calculate operating hours factor
  let hoursPerDay = 10; // Default
  if (inputs.mealPeriods.includes("twentyFourSeven")) {
    hoursPerDay = 24;
  } else {
    hoursPerDay = inputs.mealPeriods.length * 4; // ~4 hours per meal period
  }
  const loadFactor = hoursPerDay / 24;

  // Peak calculation
  const estimatedPeakKw = estimatedAnnualKwh / (365 * hoursPerDay);

  // Kitchen load (50-75% of total)
  const kitchenPercent = profile?.kitchenPercent || 55;
  const kitchenKw = Math.round(estimatedPeakKw * (kitchenPercent / 100));

  // Refrigeration load
  let refrigerationKw = 0;
  if (inputs.refrigerationEquipment.includes("walkInCooler")) refrigerationKw += 3;
  if (inputs.refrigerationEquipment.includes("walkInFreezer")) refrigerationKw += 5;
  refrigerationKw += (inputs.refrigerationEquipment.length - 2) * 1; // Other items ~1 kW each
  refrigerationKw = Math.max(refrigerationKw, estimatedPeakKw * 0.15); // At least 15%

  // HVAC load
  const hvacKw = Math.round(estimatedPeakKw * 0.2); // ~20% for restaurants

  // Lighting
  const lightingKw = Math.round(estimatedPeakKw * 0.08); // ~8%

  // Peak demand multiplier during rushes
  let peakDemandMultiplier = 1.0;
  if (inputs.peakTimes?.includes("dinnerRush")) peakDemandMultiplier = 1.75;
  else if (inputs.peakTimes?.includes("lunchRush")) peakDemandMultiplier = 1.5;
  else if (inputs.peakTimes?.includes("breakfastRush")) peakDemandMultiplier = 1.4;

  // Energy spend
  let estimatedAnnualSpend: number;
  if (inputs.monthlyEnergySpend && inputs.monthlyEnergySpend > 0) {
    estimatedAnnualSpend = inputs.monthlyEnergySpend * 12;
  } else {
    const energyRate = 0.14; // $/kWh restaurant rate (higher than avg)
    const demandRate = 15; // $/kW
    estimatedAnnualSpend =
      estimatedAnnualKwh * energyRate + estimatedPeakKw * peakDemandMultiplier * demandRate * 12;
  }

  // BESS sizing
  // Key drivers: refrigeration backup, peak shaving during rushes
  let bessHours = 3; // Default 3 hours

  if (inputs.priorities.includes("protectInventory")) {
    bessHours = 4;
    recommendations.push("BESS sized for 4+ hours refrigeration backup");
  }
  if (inputs.priorities.includes("keepKitchenRunning")) {
    bessHours = 2; // Shorter but covers more load
    recommendations.push("BESS can keep kitchen running during short outages");
  }

  // Size BESS for refrigeration + essential loads
  const essentialLoadKw = refrigerationKw + estimatedPeakKw * 0.3; // Refrig + 30% essential
  const recommendedBessKwh = Math.round(essentialLoadKw * bessHours);

  // Refrigeration backup hours
  const refrigerationBackupHours = recommendedBessKwh / (refrigerationKw || 1);

  // Food spoilage risk
  let foodSpoilageRisk = 0;
  if (inputs.outageImpact?.includes("foodSpoilage")) {
    foodSpoilageRisk = inputs.restaurantSqFt * 15; // ~$15/sq ft at risk
    warnings.push(
      `Food spoilage risk: ~$${foodSpoilageRisk.toLocaleString()} inventory at risk per extended outage`
    );
  }

  // Solar sizing
  let recommendedSolarKw = 0;
  if (inputs.solarPotential === "ownRoof") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.5);
  } else if (inputs.solarPotential === "parkingPatio") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.3);
  } else if (inputs.solarPotential === "sharedRoof") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.2);
  }

  // Generator sizing
  let recommendedGeneratorKw = 0;
  if (inputs.currentBackup === "none") {
    recommendedGeneratorKw = Math.round(refrigerationKw * 2); // Cover refrig + buffer
    if (inputs.priorities.includes("keepKitchenRunning")) {
      recommendedGeneratorKw = Math.round(estimatedPeakKw * 0.7); // 70% of peak for kitchen
    }
  }

  // Demand charge savings (peak shaving during rushes)
  const demandChargeSavings = Math.round(estimatedPeakKw * peakDemandMultiplier * 15 * 12 * 0.35); // 35% reduction
  const annualSavings = demandChargeSavings + recommendedSolarKw * 350;

  // Confidence level
  let confidenceLevel: "low" | "medium" | "high" = "medium";
  if (inputs.monthlyEnergySpend && inputs.monthlyEnergySpend > 0 && inputs.kitchenEquipment) {
    confidenceLevel = "high";
  }
  if (!inputs.cookingFuel) {
    confidenceLevel = "low";
  }

  return {
    estimatedPeakKw: Math.round(estimatedPeakKw),
    estimatedAnnualKwh: Math.round(estimatedAnnualKwh),
    estimatedAnnualSpend: Math.round(estimatedAnnualSpend),
    kitchenKw,
    refrigerationKw: Math.round(refrigerationKw),
    hvacKw,
    lightingKw,
    recommendedBessKwh,
    recommendedSolarKw,
    recommendedGeneratorKw,
    peakDemandMultiplier,
    refrigerationBackupHours: Math.round(refrigerationBackupHours * 10) / 10,
    foodSpoilageRisk,
    annualSavings,
    demandChargeSavings,
    confidenceLevel,
    warnings,
    recommendations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQuestionsForRestaurant(restaurantType?: string) {
  return RESTAURANT_QUESTIONS;
}

export default {
  RESTAURANT_TYPES,
  COOKING_FUEL,
  KITCHEN_EQUIPMENT,
  REFRIGERATION_EQUIPMENT,
  MEAL_PERIODS,
  PEAK_TIMES,
  RESTAURANT_QUESTIONS,
  calculateRestaurantProfile,
  getQuestionsForRestaurant,
};
