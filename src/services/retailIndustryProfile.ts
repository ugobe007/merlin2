/**
 * RETAIL / COMMERCIAL INDUSTRY PROFILE
 * =====================================
 *
 * Data-driven sizing calculations and question tiers for Retail facilities.
 * Based on industry workup by Bob Christopher & Vineet Kapila, December 2025.
 *
 * KEY INSIGHT: Retail is highly diverse — a 7-Eleven is nothing like a Costco.
 * Sub-type matters enormously.
 *
 * KEY SIZING DRIVERS:
 * 1. Retail Sub-Type - Convenience store vs big box = 3x difference
 * 2. Refrigeration - Grocery = 40-60% of load
 * 3. Operating Hours - 8-12 hrs vs 24/7 = 2-3x difference
 * 4. HVAC - Non-refrigerated retail = 40-50% HVAC
 * 5. Ownership - NNN leases complicate who pays/decides
 *
 * UNIQUE FACTORS:
 * - Tenant vs Owner dynamics
 * - Parking lots = solar canopy opportunity
 * - Refrigeration backup is critical (inventory loss)
 * - High visibility for EV charging amenity
 */

// ============================================================================
// RETAIL SUB-TYPES
// ============================================================================

export const RETAIL_TYPES = {
  convenienceStore: {
    label: "Convenience Store",
    examples: ["7-Eleven", "Circle K", "Wawa"],

    typicalSqFt: { min: 2000, max: 5000 },
    kwhPerSqFtYear: { min: 50, max: 80 },
    defaultKwhPerSqFt: 65,

    typicalPeakKw: { min: 30, max: 75 },
    typicalAnnualKwh: { min: 100000, max: 300000 },

    bessKwh: { min: 50, max: 150 },
    solarKw: { min: 25, max: 75 },
    generatorKw: { min: 30, max: 75 },

    refrigerationPercent: 50,
    operatingHours: "24/7",

    questionTier: 1,
    questionsShown: 10,
  },

  gasStationCStore: {
    label: "Gas Station / C-Store",
    examples: ["Fuel + convenience combo"],

    typicalSqFt: { min: 2500, max: 6000 },
    kwhPerSqFtYear: { min: 40, max: 60 },
    defaultKwhPerSqFt: 50,

    typicalPeakKw: { min: 40, max: 100 },
    typicalAnnualKwh: { min: 150000, max: 400000 },

    bessKwh: { min: 75, max: 200 },
    solarKw: { min: 30, max: 100 },
    generatorKw: { min: 50, max: 125 },

    refrigerationPercent: 40,
    operatingHours: "24/7",
    hasFuelCanopy: true,

    questionTier: 1,
    questionsShown: 12,
  },

  smallGrocery: {
    label: "Small Grocery",
    examples: ["Trader Joe's", "Aldi", "Regional chains"],

    typicalSqFt: { min: 10000, max: 25000 },
    kwhPerSqFtYear: { min: 45, max: 60 },
    defaultKwhPerSqFt: 52,

    typicalPeakKw: { min: 100, max: 300 },
    typicalAnnualKwh: { min: 500000, max: 1500000 },

    bessKwh: { min: 200, max: 500 },
    solarKw: { min: 100, max: 250 },
    generatorKw: { min: 100, max: 200 },

    refrigerationPercent: 45,
    operatingHours: "extended",

    questionTier: 2,
    questionsShown: 12,
  },

  largeGrocery: {
    label: "Large Grocery / Supermarket",
    examples: ["Kroger", "Safeway", "Whole Foods"],

    typicalSqFt: { min: 40000, max: 60000 },
    kwhPerSqFtYear: { min: 50, max: 70 },
    defaultKwhPerSqFt: 60,

    typicalPeakKw: { min: 300, max: 600 },
    typicalAnnualKwh: { min: 2000000, max: 4000000 },

    bessKwh: { min: 500, max: 1500 },
    solarKw: { min: 250, max: 600 },
    generatorKw: { min: 250, max: 500 },

    refrigerationPercent: 55,
    operatingHours: "extended",

    questionTier: 2,
    questionsShown: 14,
  },

  warehouseClub: {
    label: "Warehouse Club",
    examples: ["Costco", "Sam's Club", "BJ's"],

    typicalSqFt: { min: 120000, max: 180000 },
    kwhPerSqFtYear: { min: 35, max: 55 },
    defaultKwhPerSqFt: 45,

    typicalPeakKw: { min: 600, max: 1200 },
    typicalAnnualKwh: { min: 4000000, max: 8000000 },

    bessKwh: { min: 1000, max: 3000 },
    solarKw: { min: 1000, max: 2500 },
    generatorKw: { min: 500, max: 1000 },

    refrigerationPercent: 35,
    operatingHours: "standard",
    largeRoofPotential: true,

    questionTier: 2,
    questionsShown: 14,
  },

  bigBoxNonGrocery: {
    label: "Big Box (Non-Grocery)",
    examples: ["Target", "Walmart", "Home Depot", "Best Buy"],

    typicalSqFt: { min: 80000, max: 150000 },
    kwhPerSqFtYear: { min: 20, max: 35 },
    defaultKwhPerSqFt: 27,

    typicalPeakKw: { min: 400, max: 1000 },
    typicalAnnualKwh: { min: 2000000, max: 5000000 },

    bessKwh: { min: 500, max: 2000 },
    solarKw: { min: 500, max: 1500 },
    generatorKw: { min: 250, max: 500 },

    refrigerationPercent: 10, // Minimal
    operatingHours: "standard",
    largeRoofPotential: true,

    questionTier: 2,
    questionsShown: 12,
  },

  stripMall: {
    label: "Strip Mall / Shopping Center",
    examples: ["Multi-tenant retail center"],

    typicalSqFt: { min: 20000, max: 100000 },
    kwhPerSqFtYear: { min: 15, max: 30 },
    defaultKwhPerSqFt: 22,

    typicalPeakKw: { min: 100, max: 500 },
    typicalAnnualKwh: { min: 500000, max: 2000000 },

    bessKwh: { min: 200, max: 750 },
    solarKw: { min: 150, max: 500 },
    generatorKw: { min: 100, max: 300 },

    refrigerationPercent: 15, // Varies by tenant mix
    operatingHours: "standard",
    multiTenant: true,

    questionTier: 2,
    questionsShown: 14,
  },

  regionalMall: {
    label: "Regional Mall",
    examples: ["Enclosed mall with anchors"],

    typicalSqFt: { min: 500000, max: 1500000 },
    kwhPerSqFtYear: { min: 20, max: 35 },
    defaultKwhPerSqFt: 27,

    typicalPeakKw: { min: 2000, max: 6000 },
    typicalAnnualKwh: { min: 10000000, max: 40000000 },

    bessKwh: { min: 2000, max: 8000 },
    solarKw: { min: 1000, max: 4000 },
    generatorKw: { min: 1000, max: 3000 },

    refrigerationPercent: 10,
    operatingHours: "extended",
    multiTenant: true,
    microgridCandidate: true,

    questionTier: 3,
    questionsShown: 14,
  },

  specialtyRetail: {
    label: "Specialty Retail",
    examples: ["Boutiques", "Jewelry", "Apparel"],

    typicalSqFt: { min: 1000, max: 10000 },
    kwhPerSqFtYear: { min: 15, max: 25 },
    defaultKwhPerSqFt: 20,

    typicalPeakKw: { min: 10, max: 50 },
    typicalAnnualKwh: { min: 20000, max: 200000 },

    bessKwh: { min: 20, max: 100 },
    solarKw: { min: 10, max: 50 },
    generatorKw: { min: 15, max: 75 },

    refrigerationPercent: 0,
    operatingHours: "standard",

    questionTier: 1,
    questionsShown: 10,
  },

  autoDealership: {
    label: "Auto Dealership",
    examples: ["New/used car sales + service"],

    typicalSqFt: { min: 20000, max: 80000 },
    kwhPerSqFtYear: { min: 20, max: 35 },
    defaultKwhPerSqFt: 27,

    typicalPeakKw: { min: 100, max: 400 },
    typicalAnnualKwh: { min: 500000, max: 2000000 },

    bessKwh: { min: 150, max: 600 },
    solarKw: { min: 100, max: 400 },
    generatorKw: { min: 75, max: 300 },

    refrigerationPercent: 0,
    operatingHours: "standard",
    hasServiceBays: true,
    largeParkingLot: true,

    questionTier: 2,
    questionsShown: 12,
  },

  pharmacy: {
    label: "Pharmacy",
    examples: ["CVS", "Walgreens", "Independent"],

    typicalSqFt: { min: 8000, max: 15000 },
    kwhPerSqFtYear: { min: 25, max: 40 },
    defaultKwhPerSqFt: 32,

    typicalPeakKw: { min: 50, max: 120 },
    typicalAnnualKwh: { min: 250000, max: 500000 },

    bessKwh: { min: 75, max: 200 },
    solarKw: { min: 50, max: 125 },
    generatorKw: { min: 50, max: 150 },

    refrigerationPercent: 25, // Meds + beverages
    operatingHours: "extended",

    questionTier: 1,
    questionsShown: 12,
  },
};

// ============================================================================
// OPERATING HOURS
// ============================================================================

export const OPERATING_HOURS = {
  standard: {
    label: "Standard retail",
    hours: "9 AM - 9 PM (12 hrs)",
    hoursPerDay: 12,
    impact: "Moderate",
    loadFactor: 0.5,
  },
  extended: {
    label: "Extended hours",
    hours: "6 AM - 12 AM (18 hrs)",
    hoursPerDay: 18,
    impact: "Higher",
    loadFactor: 0.65,
  },
  twentyFourSeven: {
    label: "24/7",
    hours: "Always open",
    hoursPerDay: 24,
    impact: "Highest",
    loadFactor: 0.8,
  },
  limited: {
    label: "Limited",
    hours: "10 AM - 6 PM (8 hrs)",
    hoursPerDay: 8,
    impact: "Lower",
    loadFactor: 0.35,
  },
};

// ============================================================================
// REFRIGERATION LEVELS
// ============================================================================

export const REFRIGERATION_LEVELS = {
  none: {
    label: "None / Minimal",
    description: "Standard retail",
    percentOfLoad: 0,
    backupCritical: false,
  },
  beverageOnly: {
    label: "Beverage coolers only",
    description: "Convenience, pharmacy",
    percentOfLoad: 15,
    backupCritical: true,
  },
  moderate: {
    label: "Moderate — reach-in cases",
    description: "Small grocery, C-store",
    percentOfLoad: 30,
    backupCritical: true,
  },
  significant: {
    label: "Significant — walk-in + cases",
    description: "Grocery, warehouse",
    percentOfLoad: 45,
    backupCritical: true,
  },
  heavy: {
    label: "Heavy — full refrigerated/frozen aisles",
    description: "Large grocery",
    percentOfLoad: 55,
    backupCritical: true,
  },
};

// ============================================================================
// OWNERSHIP TYPES
// ============================================================================

export const OWNERSHIP_TYPES = {
  own: {
    label: "Own building",
    impact: "Full control, can modify",
    solarEasier: true,
  },
  leaseNNN: {
    label: "Lease — NNN",
    impact: "Tenant pays utilities, may need landlord approval",
    solarEasier: false,
  },
  leaseGross: {
    label: "Lease — Gross",
    impact: "Landlord pays utilities, less incentive",
    solarEasier: false,
  },
  ownLandLeaseBldg: {
    label: "Own land, lease building",
    impact: "Depends on lease terms",
    solarEasier: "partial",
  },
};

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const RETAIL_QUESTIONS = {
  // SECTION 1: Your Facility
  section1: [
    {
      id: "retailType",
      question: "What type of retail facility is this?",
      type: "select",
      options: [
        {
          value: "convenienceStore",
          label: "Convenience Store",
          examples: "7-Eleven, Circle K, Wawa",
        },
        {
          value: "gasStationCStore",
          label: "Gas Station / C-Store",
          examples: "Fuel + convenience combo",
        },
        {
          value: "smallGrocery",
          label: "Small Grocery",
          examples: "Trader Joe's, Aldi, regional chains",
        },
        {
          value: "largeGrocery",
          label: "Large Grocery / Supermarket",
          examples: "Kroger, Safeway, Whole Foods",
        },
        { value: "warehouseClub", label: "Warehouse Club", examples: "Costco, Sam's Club, BJ's" },
        {
          value: "bigBoxNonGrocery",
          label: "Big Box (Non-Grocery)",
          examples: "Target, Walmart, Home Depot, Best Buy",
        },
        {
          value: "stripMall",
          label: "Strip Mall / Shopping Center",
          examples: "Multi-tenant retail center",
        },
        { value: "regionalMall", label: "Regional Mall", examples: "Enclosed mall with anchors" },
        {
          value: "specialtyRetail",
          label: "Specialty Retail",
          examples: "Boutiques, jewelry, apparel",
        },
        {
          value: "autoDealership",
          label: "Auto Dealership",
          examples: "New/used car sales + service",
        },
        { value: "pharmacy", label: "Pharmacy", examples: "CVS, Walgreens, independent" },
        { value: "other", label: "Other", examples: "Describe" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "storeSqFt",
      question: "What's your store size?",
      type: "slider",
      min: 1000,
      max: 200000,
      step: 1000,
      default: 25000,
      unit: "sq ft",
      required: true,
      impactLevel: "critical",
    },
    {
      id: "chainSize",
      question: "Single location or chain?",
      type: "select",
      options: [
        { value: "single", label: "Single location", description: "Independent or franchise" },
        { value: "smallChain", label: "Small chain (2-10 locations)", description: "Regional" },
        {
          value: "mediumChain",
          label: "Medium chain (10-50 locations)",
          description: "Multi-state",
        },
        { value: "largeChain", label: "Large chain (50+ locations)", description: "National" },
      ],
      impactLevel: "low",
    },
  ],

  // SECTION 2: Operations Profile
  section2: [
    {
      id: "operatingHours",
      question: "What are your operating hours?",
      type: "select",
      options: [
        {
          value: "standard",
          label: "Standard retail",
          hours: "9 AM - 9 PM (12 hrs)",
          impact: "Moderate",
        },
        {
          value: "extended",
          label: "Extended hours",
          hours: "6 AM - 12 AM (18 hrs)",
          impact: "Higher",
        },
        { value: "twentyFourSeven", label: "24/7", hours: "Always open", impact: "Highest" },
        { value: "limited", label: "Limited", hours: "10 AM - 6 PM (8 hrs)", impact: "Lower" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "refrigerationLevel",
      question: "Do you have significant refrigeration?",
      type: "select",
      options: [
        { value: "none", label: "None / Minimal", description: "Standard retail" },
        {
          value: "beverageOnly",
          label: "Beverage coolers only",
          description: "Convenience, pharmacy",
        },
        {
          value: "moderate",
          label: "Moderate — reach-in cases",
          description: "Small grocery, C-store",
        },
        {
          value: "significant",
          label: "Significant — walk-in + cases",
          description: "Grocery, warehouse",
        },
        {
          value: "heavy",
          label: "Heavy — full refrigerated/frozen aisles",
          description: "Large grocery",
        },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "refrigeratedCaseFeet",
      question: "Approximate linear feet of refrigerated cases",
      type: "number",
      min: 0,
      max: 1000,
      showIf: { refrigerationLevel: ["moderate", "significant", "heavy"] },
      impactLevel: "high",
    },
    {
      id: "walkInCooler",
      question: "Walk-in cooler?",
      type: "boolean",
      showIf: { refrigerationLevel: ["moderate", "significant", "heavy"] },
      impactLevel: "medium",
    },
    {
      id: "walkInFreezer",
      question: "Walk-in freezer?",
      type: "boolean",
      showIf: { refrigerationLevel: ["moderate", "significant", "heavy"] },
      impactLevel: "medium",
    },
    {
      id: "otherEquipment",
      question: "What other major equipment do you have?",
      type: "multiselect",
      options: [
        {
          value: "kitchen",
          label: "Commercial kitchen / Food prep",
          notes: "Deli, bakery, prepared foods",
        },
        { value: "hvacRtu", label: "HVAC rooftop units" },
        { value: "signage", label: "Large exterior signage", notes: "Illuminated" },
        { value: "parkingLighting", label: "Parking lot lighting" },
        { value: "evCharging", label: "EV charging (existing)" },
        { value: "fuelPumps", label: "Fuel pumps / Canopy", notes: "Gas station" },
        { value: "serviceBays", label: "Auto service bays", notes: "Dealership, tire shop" },
        { value: "carWash", label: "Car wash", notes: "If on-site" },
      ],
      impactLevel: "medium",
    },
    {
      id: "hvacRtuCount",
      question: "How many rooftop HVAC units?",
      type: "number",
      min: 0,
      max: 50,
      showIf: { otherEquipment: ["hvacRtu"] },
      impactLevel: "medium",
    },
    {
      id: "evPortCount",
      question: "How many EV charging ports?",
      type: "number",
      min: 0,
      max: 50,
      showIf: { otherEquipment: ["evCharging"] },
      impactLevel: "medium",
    },
  ],

  // SECTION 3: Current Power Situation
  section3: [
    {
      id: "monthlyEnergySpend",
      question: "What's your approximate monthly energy spend?",
      type: "select",
      options: [
        { value: 1000, label: "Under $2,000" },
        { value: 3500, label: "$2,000 - $5,000" },
        { value: 10000, label: "$5,000 - $15,000" },
        { value: 22500, label: "$15,000 - $30,000" },
        { value: 52500, label: "$30,000 - $75,000" },
        { value: 100000, label: "Over $75,000" },
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
        { value: "fullBuilding", label: "Full building generator" },
        { value: "upsOnly", label: "UPS for POS/registers only" },
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
        { value: "storeCloses", label: "Store closes immediately" },
        { value: "operateBriefly", label: "Can operate briefly on backup" },
        { value: "productLoss", label: "Major product loss (refrigeration)" },
        { value: "safetyConcerns", label: "Safety concerns (lighting, security)" },
        { value: "minimalImpact", label: "We have full backup, minimal impact" },
      ],
      impactLevel: "high",
    },
  ],

  // SECTION 4: Space & Property
  section4: [
    {
      id: "ownershipType",
      question: "Do you own or lease?",
      type: "select",
      options: [
        { value: "own", label: "Own building", impact: "Full control, can modify" },
        {
          value: "leaseNNN",
          label: "Lease — NNN",
          impact: "Tenant pays utilities, may need landlord approval",
        },
        {
          value: "leaseGross",
          label: "Lease — Gross",
          impact: "Landlord pays utilities, less incentive",
        },
        {
          value: "ownLandLeaseBldg",
          label: "Own land, lease building",
          impact: "Depends on lease terms",
        },
      ],
      impactLevel: "medium",
    },
    {
      id: "solarPotential",
      question: "Do you have space for solar?",
      type: "select",
      options: [
        {
          value: "largeRoof",
          label: "Large flat roof",
          description: "Big box, warehouse — excellent",
        },
        {
          value: "moderateRoof",
          label: "Moderate roof",
          description: "Strip mall, grocery — good",
        },
        {
          value: "limitedRoof",
          label: "Limited roof",
          description: "High-rise retail, shared roof",
        },
        {
          value: "parkingCanopy",
          label: "Parking lot / Canopy potential",
          description: "Large lot available",
        },
        { value: "none", label: "No space", description: "Urban, shared building" },
      ],
      impactLevel: "medium",
    },
    {
      id: "parkingSpaces",
      question: "Approximate parking spaces",
      type: "number",
      min: 0,
      max: 5000,
      showIf: { solarPotential: ["parkingCanopy"] },
      impactLevel: "medium",
    },
    {
      id: "plannedChanges",
      question: "Are you planning any changes?",
      type: "multiselect",
      options: [
        { value: "addEvCharging", label: "Adding EV charging" },
        { value: "expandRefrigeration", label: "Expanding refrigeration" },
        { value: "renovation", label: "Renovation / Remodel" },
        { value: "newLocations", label: "New location(s)" },
        { value: "electrifyFleet", label: "Electrifying fleet vehicles" },
        { value: "noChanges", label: "No major changes planned" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 5: Goals & Priorities
  section5: [
    {
      id: "energyGoals",
      question: "What are your energy goals?",
      type: "multiselect",
      options: [
        { value: "reduceCosts", label: "Reduce energy costs" },
        { value: "protectRefrigeration", label: "Protect against outages (refrigeration)" },
        { value: "sustainability", label: "Meet corporate sustainability targets" },
        { value: "addEvCharging", label: "Add EV charging for customers" },
        { value: "reduceDemand", label: "Reduce demand charges" },
        { value: "resilience", label: "Improve store resilience" },
        { value: "gridInstability", label: "Prepare for grid instability" },
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
          description: "Lower energy bills",
        },
        {
          value: "protectInventory",
          label: "Protect inventory",
          description: "Refrigeration backup",
        },
        {
          value: "customerExperience",
          label: "Customer experience",
          description: "Reliable operations",
        },
        {
          value: "sustainability",
          label: "Sustainability / ESG",
          description: "Corporate or franchise requirements",
        },
        { value: "quickPayback", label: "Quick payback", description: "ROI within 2-4 years" },
        { value: "addEvCharging", label: "Add EV charging", description: "Customer amenity" },
        {
          value: "minimalDisruption",
          label: "Minimal disruption",
          description: "Don't impact operations",
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

export interface RetailInputs {
  retailType: string;
  storeSqFt: number;
  chainSize?: string;
  operatingHours: string;
  refrigerationLevel: string;
  refrigeratedCaseFeet?: number;
  walkInCooler?: boolean;
  walkInFreezer?: boolean;
  otherEquipment?: string[];
  hvacRtuCount?: number;
  evPortCount?: number;
  monthlyEnergySpend?: number;
  currentBackup: string;
  outageImpact?: string[];
  ownershipType?: string;
  solarPotential?: string;
  parkingSpaces?: number;
  plannedChanges?: string[];
  energyGoals?: string[];
  priorities: string[];
}

export interface RetailCalculations {
  // Load estimates
  estimatedPeakKw: number;
  estimatedAnnualKwh: number;
  estimatedAnnualSpend: number;

  // Load breakdown
  refrigerationKw: number;
  hvacKw: number;
  lightingKw: number;
  otherKw: number;

  // System recommendations
  recommendedBessKwh: number;
  recommendedSolarKw: number;
  recommendedGeneratorKw: number;

  // Refrigeration backup
  refrigerationBackupHours: number;
  inventoryRiskCost: number;

  // Savings
  annualSavings: number;
  demandChargeSavings: number;
  solarSavings: number;

  // Confidence
  confidenceLevel: "low" | "medium" | "high";
  warnings: string[];
  recommendations: string[];
}

export function calculateRetailProfile(inputs: RetailInputs): RetailCalculations {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Get retail type profile
  const profile = RETAIL_TYPES[inputs.retailType as keyof typeof RETAIL_TYPES];
  const hours = OPERATING_HOURS[inputs.operatingHours as keyof typeof OPERATING_HOURS];
  const refrigeration =
    REFRIGERATION_LEVELS[inputs.refrigerationLevel as keyof typeof REFRIGERATION_LEVELS];

  // Calculate base load from sq ft
  const kwhPerSqFt = profile?.defaultKwhPerSqFt || 30;
  let estimatedAnnualKwh = inputs.storeSqFt * kwhPerSqFt;

  // Adjust for operating hours
  const loadFactor = hours?.loadFactor || 0.5;
  estimatedAnnualKwh *= loadFactor / 0.5; // Normalize to 50% baseline

  // Peak calculation
  let estimatedPeakKw = estimatedAnnualKwh / (8760 * loadFactor);

  // Refrigeration load
  const refrigerationPercent = refrigeration?.percentOfLoad || 0;
  const refrigerationKw = Math.round(estimatedPeakKw * (refrigerationPercent / 100));

  // Add walk-in loads
  if (inputs.walkInCooler) {
    estimatedPeakKw += 5; // ~5 kW for walk-in cooler
  }
  if (inputs.walkInFreezer) {
    estimatedPeakKw += 10; // ~10 kW for walk-in freezer
  }

  // HVAC load (typically 40-50% of non-refrigerated)
  const nonRefrigPercent = 100 - refrigerationPercent;
  const hvacKw = Math.round(estimatedPeakKw * (nonRefrigPercent / 100) * 0.45);

  // Lighting (typically 10-15%)
  const lightingKw = Math.round(estimatedPeakKw * 0.12);

  // Other loads
  const otherKw = Math.round(estimatedPeakKw - refrigerationKw - hvacKw - lightingKw);

  // Energy spend
  let estimatedAnnualSpend: number;
  if (inputs.monthlyEnergySpend && inputs.monthlyEnergySpend > 0) {
    estimatedAnnualSpend = inputs.monthlyEnergySpend * 12;
  } else {
    const energyRate = 0.12; // $/kWh retail rate
    const demandRate = 15; // $/kW
    estimatedAnnualSpend = estimatedAnnualKwh * energyRate + estimatedPeakKw * demandRate * 12;
  }

  // BESS sizing
  // Key driver: refrigeration backup
  let bessHours = 2; // Default 2 hours

  if (refrigeration?.backupCritical) {
    bessHours = 4; // 4 hours for refrigeration protection
    recommendations.push("BESS sized to protect refrigerated inventory during outages");
  }
  if (inputs.priorities.includes("protectInventory")) {
    bessHours = 6;
  }

  // Size BESS to cover refrigeration + essential loads
  const essentialLoadKw = refrigerationKw + estimatedPeakKw * 0.2; // Refrig + 20% essential
  const recommendedBessKwh = Math.round(essentialLoadKw * bessHours);

  // Refrigeration backup hours
  const refrigerationBackupHours = recommendedBessKwh / (refrigerationKw || 1);

  // Inventory risk cost
  let inventoryRiskCost = 0;
  if (refrigerationPercent > 0) {
    // Estimate based on store size and refrigeration level
    const inventoryPerSqFt = refrigerationPercent > 40 ? 50 : 25; // $/sq ft
    inventoryRiskCost = inputs.storeSqFt * inventoryPerSqFt * 0.1; // 10% at risk per outage

    if (inputs.outageImpact?.includes("productLoss")) {
      warnings.push(
        `Refrigeration failure risk: ~$${inventoryRiskCost.toLocaleString()} inventory at risk per extended outage`
      );
    }
  }

  // Solar sizing
  let recommendedSolarKw = 0;
  if (inputs.solarPotential === "largeRoof") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.6);
    recommendations.push("Large roof = excellent solar potential");
  } else if (inputs.solarPotential === "parkingCanopy") {
    const canopyKw = (inputs.parkingSpaces || 100) * 3; // ~3 kW per parking space
    recommendedSolarKw = Math.round(Math.min(canopyKw, estimatedPeakKw * 0.5));
    recommendations.push("Parking canopy provides shade + power");
  } else if (inputs.solarPotential === "moderateRoof") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.3);
  } else if (inputs.solarPotential === "limitedRoof") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.1);
  }

  // Generator sizing
  let recommendedGeneratorKw = 0;
  if (inputs.currentBackup === "none" && refrigerationPercent > 0) {
    recommendedGeneratorKw = Math.round(refrigerationKw * 1.5); // Refrig + buffer
    recommendations.push("Generator recommended for extended refrigeration backup");
  }

  // Ownership impact
  if (inputs.ownershipType === "leaseNNN") {
    recommendations.push("NNN lease: You pay utilities — solar/BESS reduces your costs directly");
  } else if (inputs.ownershipType === "leaseGross") {
    warnings.push("Gross lease: Landlord may need to be involved in energy decisions");
  }

  // Savings
  const demandChargeSavings = Math.round(estimatedPeakKw * 15 * 12 * 0.3); // 30% reduction
  const solarSavings = Math.round(recommendedSolarKw * 400); // SSOT: DEFAULTS.Preview.solarSavingsPerKW
  const annualSavings = demandChargeSavings + solarSavings;

  // Confidence level
  let confidenceLevel: "low" | "medium" | "high" = "medium";
  if (inputs.monthlyEnergySpend && inputs.monthlyEnergySpend > 0) {
    confidenceLevel = "high";
  }
  if (!inputs.refrigerationLevel) {
    confidenceLevel = "low";
  }

  return {
    estimatedPeakKw: Math.round(estimatedPeakKw),
    estimatedAnnualKwh: Math.round(estimatedAnnualKwh),
    estimatedAnnualSpend: Math.round(estimatedAnnualSpend),
    refrigerationKw,
    hvacKw,
    lightingKw,
    otherKw,
    recommendedBessKwh,
    recommendedSolarKw,
    recommendedGeneratorKw,
    refrigerationBackupHours: Math.round(refrigerationBackupHours * 10) / 10,
    inventoryRiskCost: Math.round(inventoryRiskCost),
    annualSavings,
    demandChargeSavings,
    solarSavings,
    confidenceLevel,
    warnings,
    recommendations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQuestionsForRetail(retailType?: string) {
  return RETAIL_QUESTIONS;
}

export default {
  RETAIL_TYPES,
  OPERATING_HOURS,
  REFRIGERATION_LEVELS,
  OWNERSHIP_TYPES,
  RETAIL_QUESTIONS,
  calculateRetailProfile,
  getQuestionsForRetail,
};
