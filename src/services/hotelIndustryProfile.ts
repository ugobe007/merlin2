/**
 * HOTEL INDUSTRY PROFILE
 * =======================
 *
 * Data-driven sizing calculations and question tiers for Hotel/Hospitality.
 * Based on industry workup by Bob Christopher & Vineet Kapila, December 2025.
 *
 * KEY SIZING DRIVERS:
 * 1. Guest Rooms - Primary load driver
 * 2. Climate Zone - Hot = 2-3x HVAC load
 * 3. Amenities Mix - Pool, spa, restaurant, laundry
 * 4. Occupancy Rate - 90% vs 50% = ~40% load difference
 * 5. Service Level - Budget vs Luxury energy intensity
 */

// ============================================================================
// HOTEL TYPE PROFILES
// ============================================================================

export const HOTEL_PROFILES = {
  budget: {
    label: "Budget (1-2★)",
    description: "Motel 6, Super 8, economy lodging",
    examples: ["Motel 6", "Super 8", "Red Roof Inn", "Days Inn"],

    // Load characteristics
    kwhPerRoomYear: 5500, // Annual kWh per room
    peakKwPerRoom: 1.5, // Peak demand per room
    baseLoadKw: 50, // Minimum base load (kW)

    // Typical ranges
    typicalRooms: { min: 50, max: 100 },
    typicalPeakKw: { min: 75, max: 150 },
    typicalAnnualKwh: { min: 300000, max: 600000 },

    // Cost benchmarks
    annualEnergySpend: { min: 30000, max: 75000 },
    costPerRoomYear: { min: 500, max: 750 },

    // Recommended system sizes
    bessKwhPerRoom: 2.0, // kWh BESS per room
    solarKwPerRoom: 1.0, // kW solar per room
    generatorKwPerRoom: 1.0, // kW generator per room

    // Question depth
    questionTier: 1,
    questionsShown: 4,
  },

  midscale: {
    label: "Midscale (3★)",
    description: "Hampton Inn, Holiday Inn, select-service",
    examples: ["Hampton Inn", "Holiday Inn Express", "Fairfield Inn", "La Quinta"],

    kwhPerRoomYear: 7500,
    peakKwPerRoom: 2.0,
    baseLoadKw: 75,

    typicalRooms: { min: 100, max: 200 },
    typicalPeakKw: { min: 200, max: 400 },
    typicalAnnualKwh: { min: 800000, max: 1500000 },

    annualEnergySpend: { min: 80000, max: 200000 },
    costPerRoomYear: { min: 800, max: 1000 },

    bessKwhPerRoom: 2.5,
    solarKwPerRoom: 1.25,
    generatorKwPerRoom: 1.0,

    questionTier: 2,
    questionsShown: 6,
  },

  fullService: {
    label: "Full-Service (4★)",
    description: "Marriott, Hilton, full amenities",
    examples: ["Marriott", "Hilton", "Sheraton", "Hyatt Regency"],

    kwhPerRoomYear: 10000,
    peakKwPerRoom: 2.5,
    baseLoadKw: 150,

    typicalRooms: { min: 200, max: 400 },
    typicalPeakKw: { min: 500, max: 1000 },
    typicalAnnualKwh: { min: 2000000, max: 4000000 },

    annualEnergySpend: { min: 250000, max: 600000 },
    costPerRoomYear: { min: 1200, max: 1500 },

    bessKwhPerRoom: 3.75,
    solarKwPerRoom: 1.25,
    generatorKwPerRoom: 1.25,

    questionTier: 3,
    questionsShown: 8,
  },

  luxury: {
    label: "Luxury/Resort (5★)",
    description: "Four Seasons, Ritz-Carlton, full-service resort",
    examples: ["Four Seasons", "Ritz-Carlton", "St. Regis", "Waldorf Astoria", "Shangri-La"],

    kwhPerRoomYear: 17500,
    peakKwPerRoom: 4.0,
    baseLoadKw: 300,

    typicalRooms: { min: 300, max: 600 },
    typicalPeakKw: { min: 1000, max: 2500 },
    typicalAnnualKwh: { min: 5000000, max: 12000000 },

    annualEnergySpend: { min: 750000, max: 2000000 },
    costPerRoomYear: { min: 2000, max: 3500 },

    bessKwhPerRoom: 6.67,
    solarKwPerRoom: 2.5,
    generatorKwPerRoom: 1.67,

    questionTier: 4,
    questionsShown: 12,
  },
};

// ============================================================================
// AMENITY LOAD IMPACTS
// ============================================================================
// Updated December 31, 2025 with validated ranges from industry data

export const AMENITY_LOADS = {
  pool: {
    label: "Pool / Hot Tub",
    icon: "🏊",
    peakKw: { min: 50, max: 150 },
    annualKwh: { min: 100000, max: 300000 },
    description: "Gas or electric heating, year-round vs seasonal",
    defaultPeakKw: 75,
    defaultAnnualKwh: 150000,
    heatedYearRoundMultiplier: 2.0,
    indoorMultiplier: 1.5,
  },

  restaurant: {
    label: "Restaurant / Full Kitchen",
    icon: "🍽️",
    peakKw: { min: 100, max: 300 },
    annualKwh: { min: 200000, max: 500000 },
    description: "Full-service kitchen vs grab-and-go",
    defaultPeakKw: 150,
    defaultAnnualKwh: 300000,
    breakfastOnlyMultiplier: 0.3,
    grabAndGoMultiplier: 0.2,
    isSignificant: true,
  },

  spa: {
    label: "Spa / Wellness Center",
    icon: "💆",
    peakKw: { min: 30, max: 75 },
    annualKwh: { min: 50000, max: 150000 },
    description: "Saunas, steam rooms, treatment equipment",
    defaultPeakKw: 50,
    defaultAnnualKwh: 100000,
  },

  fitness: {
    label: "Fitness Center",
    icon: "🏋️",
    peakKw: { min: 15, max: 40 },
    annualKwh: { min: 30000, max: 80000 },
    description: "HVAC + equipment for workout area",
    defaultPeakKw: 25,
    defaultAnnualKwh: 50000,
  },

  laundry: {
    label: "On-Site Laundry",
    icon: "🧺",
    peakKw: { min: 75, max: 200 },
    annualKwh: { min: 150000, max: 400000 },
    description: "Commercial laundry - massive load if full-service",
    defaultPeakKw: 125,
    defaultAnnualKwh: 250000,
    isSignificant: true,
    warningText: "On-site laundry can be 15-20% of total facility load",
  },

  conference: {
    label: "Conference Center / Ballroom",
    icon: "🎤",
    peakKw: { min: 100, max: 400 },
    annualKwh: { min: 150000, max: 500000 },
    description: "AV, lighting, HVAC for large ballrooms",
    defaultPeakKw: 200,
    defaultAnnualKwh: 300000,
    isSignificant: true,
    bessCandidate: true, // Great for peak shaving during events
    notes: "Massive HVAC swings (empty vs 500 people), intermittent high peaks",
  },

  entertainment: {
    label: "Entertainment Venue",
    icon: "🎰",
    peakKw: { min: 150, max: 500 },
    annualKwh: { min: 200000, max: 600000 },
    description: "Casino floor, theater, nightclub, concert space",
    defaultPeakKw: 300,
    defaultAnnualKwh: 400000,
    isSignificant: true,
    subtypes: {
      casino: {
        peakKw: 300,
        annualKwh: 500000,
        notes: "24/7 operation, gaming compliance requires backup power",
      },
      theater: {
        peakKw: 200,
        annualKwh: 250000,
        notes: "Extreme peak-to-average ratios",
      },
      nightclub: {
        peakKw: 150,
        annualKwh: 200000,
        notes: "Lighting rigs, sound systems, late-night peaks",
      },
    },
    backupPowerRequired: true, // Gaming compliance
  },

  evCharging: {
    label: "EV Charging (Existing)",
    icon: "⚡",
    peakKw: { min: 20, max: 400 },
    annualKwh: { min: 30000, max: 500000 },
    description: "Existing EV charging infrastructure",
    defaultPeakKw: 50,
    defaultAnnualKwh: 75000,
    perL2Charger: { peakKw: 7, annualKwh: 10000 },
    perDCFC: { peakKw: 150, annualKwh: 100000 },
    isGrowthOpportunity: true,
    notes: "Often undersized - guests increasingly expect charging",
  },

  parking: {
    label: "Parking Structure",
    icon: "🅿️",
    peakKw: { min: 20, max: 50 },
    annualKwh: { min: 30000, max: 80000 },
    description: "Garage lighting, ventilation, elevators",
    defaultPeakKw: 30,
    defaultAnnualKwh: 50000,
  },
};

// ============================================================================
// CLIMATE ZONE MULTIPLIERS
// ============================================================================

export const CLIMATE_ZONES = {
  hot: {
    label: "Hot (AZ, NV, FL, TX)",
    hvacMultiplier: 2.5,
    solarMultiplier: 1.3, // Better solar production
    examples: ["Phoenix", "Las Vegas", "Miami", "Houston"],
  },
  warmMixed: {
    label: "Warm/Mixed (CA, GA, NC)",
    hvacMultiplier: 1.5,
    solarMultiplier: 1.15,
    examples: ["Los Angeles", "Atlanta", "Charlotte"],
  },
  temperate: {
    label: "Temperate (OR, WA, Mid-Atlantic)",
    hvacMultiplier: 1.0,
    solarMultiplier: 1.0,
    examples: ["Portland", "Seattle", "Philadelphia"],
  },
  cold: {
    label: "Cold (IL, MI, NY, MN)",
    hvacMultiplier: 1.3, // Heating load
    solarMultiplier: 0.8,
    examples: ["Chicago", "Detroit", "Minneapolis", "Buffalo"],
  },
};

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const HOTEL_QUESTIONS = {
  // SECTION 1: Your Hotel
  section1: [
    {
      id: "hotelType",
      question: "What type of hotel?",
      type: "select",
      options: ["budget", "midscale", "fullService", "luxury"],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "roomCount",
      question: "How many rooms?",
      type: "slider",
      min: 10,
      max: 500,
      step: 10,
      default: 100,
      required: true,
      impactLevel: "critical",
    },
  ],

  // SECTION 2: Amenities
  section2: [
    {
      id: "amenities",
      question: "What amenities does your property have?",
      type: "multiselect",
      options: [
        { value: "pool", label: "Swimming pool (heated)" },
        { value: "spa", label: "Spa / Hot tub" },
        { value: "restaurant", label: "On-site restaurant" },
        { value: "banquet", label: "Banquet / Conference facilities" },
        { value: "laundry", label: "On-site laundry" },
        { value: "fitness", label: "Fitness center" },
        { value: "evCharging", label: "EV charging stations" },
        { value: "kitchen", label: "Commercial kitchen" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "poolType",
      question: "Pool type?",
      type: "select",
      options: [
        { value: "indoorHeated", label: "Indoor heated" },
        { value: "outdoorHeated", label: "Outdoor heated" },
        { value: "outdoorUnheated", label: "Outdoor unheated" },
      ],
      showIf: { amenities: ["pool"] },
      impactLevel: "medium",
    },
    {
      id: "restaurantSeats",
      question: "Restaurant seating capacity?",
      type: "number",
      min: 20,
      max: 500,
      showIf: { amenities: ["restaurant"] },
      impactLevel: "medium",
    },
    {
      id: "evPortCount",
      question: "How many EV charging ports?",
      type: "number",
      min: 1,
      max: 50,
      showIf: { amenities: ["evCharging"] },
      impactLevel: "medium",
    },
  ],

  // SECTION 3: Building Systems
  section3: [
    {
      id: "hvacType",
      question: "What HVAC system do you have?",
      type: "select",
      options: [
        { value: "ptac", label: "PTAC units (through-wall)" },
        { value: "central", label: "Central plant (chiller/boiler)" },
        { value: "vrf", label: "VRF / Mini-split" },
        { value: "rooftop", label: "Rooftop units" },
        { value: "notSure", label: "Not sure" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "waterHeatingFuel",
      question: "Water heating fuel?",
      type: "select",
      options: [
        { value: "gas", label: "Natural gas" },
        { value: "electric", label: "Electric" },
        { value: "propane", label: "Propane" },
        { value: "solar", label: "Solar thermal" },
        { value: "notSure", label: "Not sure" },
      ],
      impactLevel: "medium",
    },
    {
      id: "currentBackup",
      question: "Do you have backup power today?",
      type: "select",
      options: [
        { value: "none", label: "None" },
        { value: "lifeSafety", label: "Life safety only (emergency lights)" },
        { value: "partial", label: "Partial (front desk, some rooms)" },
        { value: "full", label: "Full building generator" },
        { value: "notSure", label: "Not sure" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "generatorKw",
      question: "Generator capacity (kW)?",
      type: "number",
      min: 0,
      max: 2000,
      showIf: { currentBackup: ["partial", "full"] },
      impactLevel: "medium",
    },
  ],

  // SECTION 4: Operations
  section4: [
    {
      id: "occupancyRate",
      question: "Average occupancy rate",
      type: "slider",
      min: 40,
      max: 95,
      step: 5,
      default: 70,
      suffix: "%",
      impactLevel: "medium",
    },
    {
      id: "floors",
      question: "Number of floors",
      type: "slider",
      min: 1,
      max: 50,
      step: 1,
      default: 4,
      helpText: "Affects roof space for solar",
      impactLevel: "low",
    },
  ],

  // SECTION 5: Current Power Situation
  section5: [
    {
      id: "monthlyEnergySpend",
      question: "Monthly energy spend (if known)",
      type: "currency",
      min: 0,
      max: 250000,
      optional: true,
      helpText: "Helps us validate our estimates",
      impactLevel: "medium",
    },
    {
      id: "brandAffiliation",
      question: "Brand affiliation",
      type: "select",
      options: [
        { value: "marriott", label: "Marriott International" },
        { value: "hilton", label: "Hilton Worldwide" },
        { value: "ihg", label: "IHG Hotels" },
        { value: "hyatt", label: "Hyatt Hotels" },
        { value: "accor", label: "Accor" },
        { value: "independent", label: "Independent" },
        { value: "other", label: "Other" },
      ],
      helpText: "Brand standards may affect equipment specs",
      impactLevel: "low",
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
        { value: "sustainability", label: "Meet sustainability targets" },
        { value: "addEvCharging", label: "Add EV charging" },
        { value: "reduceDemand", label: "Reduce demand charges" },
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
        { value: "reduceCosts", label: "Reduce energy costs", description: "Lower utility bills" },
        {
          value: "guestExperience",
          label: "Guest experience",
          description: "Reliable power, EV charging",
        },
        {
          value: "sustainability",
          label: "Sustainability",
          description: "Brand requirements, guest expectations",
        },
        { value: "backup", label: "Backup power", description: "Keep operating during outages" },
        { value: "quickPayback", label: "Quick payback", description: "ROI within 2-4 years" },
        { value: "evCharging", label: "Add EV charging", description: "Guest amenity" },
      ],
      required: true,
      impactLevel: "high",
    },
  ],
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export interface HotelInputs {
  hotelType: "budget" | "midscale" | "fullService" | "luxury";
  roomCount: number;
  amenities: string[];
  poolType?: "indoorHeated" | "outdoorHeated" | "outdoorUnheated";
  restaurantSeats?: number;
  evPortCount?: number;
  hvacType: "ptac" | "central" | "vrf" | "rooftop" | "notSure";
  waterHeatingFuel?: "gas" | "electric" | "propane" | "solar" | "notSure";
  currentBackup: "none" | "lifeSafety" | "partial" | "full" | "notSure";
  generatorKw?: number;
  occupancyRate?: number;
  floors?: number;
  monthlyEnergySpend?: number;
  brandAffiliation?: string;
  energyGoals?: string[];
  priorities: string[];
}

export interface HotelCalculations {
  // Load estimates
  estimatedAnnualKwh: number;
  estimatedPeakKw: number;
  estimatedAnnualSpend: number;

  // Recommended system
  recommendedBessKwh: number;
  recommendedSolarKw: number;
  recommendedGeneratorKw: number;

  // Savings projections
  annualSavings: number;
  demandChargeSavings: number;
  solarSavings: number;

  // Breakdown
  baseLoadKwh: number;
  amenityLoadKwh: number;

  // Confidence
  confidenceLevel: "low" | "medium" | "high";
  confidenceFactors: string[];
}

export function calculateHotelProfile(inputs: HotelInputs): HotelCalculations {
  const profile = HOTEL_PROFILES[inputs.hotelType];
  const climateZone = CLIMATE_ZONES.temperate; // Default to temperate if not specified

  // Base load from rooms
  let baseLoadKwh = inputs.roomCount * profile.kwhPerRoomYear;
  let peakKw = inputs.roomCount * profile.peakKwPerRoom + profile.baseLoadKw;

  // Apply climate multiplier (affects HVAC portion, roughly 40% of load)
  const hvacPortion = 0.4;
  const climateAdjustment = 1 + hvacPortion * (climateZone.hvacMultiplier - 1);
  baseLoadKwh *= climateAdjustment;
  peakKw *= climateAdjustment;

  // Add amenity loads
  let amenityLoadKwh = 0;
  for (const amenity of inputs.amenities) {
    const amenityData = AMENITY_LOADS[amenity as keyof typeof AMENITY_LOADS];
    if (amenityData) {
      // Use default values from the updated structure
      amenityLoadKwh +=
        amenityData.defaultAnnualKwh ||
        ((amenityData.annualKwh as any).min + (amenityData.annualKwh as any).max) / 2;
      peakKw +=
        amenityData.defaultPeakKw ||
        ((amenityData.peakKw as any).min + (amenityData.peakKw as any).max) / 2;
    }
  }

  // Pool type adjustment
  if (inputs.amenities.includes("pool") && inputs.poolType) {
    const poolLoad = AMENITY_LOADS.pool;
    if (inputs.poolType === "indoorHeated") {
      amenityLoadKwh += poolLoad.defaultAnnualKwh * (poolLoad.indoorMultiplier || 1.5);
    }
  }

  // Occupancy adjustment (default 70%)
  const occupancy = (inputs.occupancyRate || 70) / 100;
  const occupancyMultiplier = 0.6 + 0.4 * occupancy; // 60% base + 40% variable
  baseLoadKwh *= occupancyMultiplier;

  // Total annual kWh
  const estimatedAnnualKwh = Math.round(baseLoadKwh + amenityLoadKwh);
  const estimatedPeakKw = Math.round(peakKw);

  // Energy spend estimate (use provided or calculate)
  const utilityRate = 0.12; // $/kWh average
  const demandRate = 15; // $/kW average
  const estimatedAnnualSpend = inputs.monthlyEnergySpend
    ? inputs.monthlyEnergySpend * 12
    : estimatedAnnualKwh * utilityRate + estimatedPeakKw * demandRate * 12;

  // System recommendations
  const recommendedBessKwh = Math.round(inputs.roomCount * profile.bessKwhPerRoom);
  const recommendedSolarKw = Math.round(
    inputs.roomCount * profile.solarKwPerRoom * climateZone.solarMultiplier
  );

  // Generator sizing based on current backup
  let generatorMultiplier = 0.5; // Life safety default
  if (inputs.currentBackup === "partial") generatorMultiplier = 0.75;
  if (inputs.currentBackup === "full") generatorMultiplier = 1.0;
  // Use provided generatorKw if available, otherwise calculate
  const recommendedGeneratorKw =
    inputs.generatorKw || Math.round(estimatedPeakKw * generatorMultiplier);

  // Savings calculations
  const demandChargeSavings = Math.round(estimatedPeakKw * demandRate * 12 * 0.6); // 60% demand reduction
  const solarSavings = Math.round(recommendedSolarKw * 400); // $400/kW/year
  const annualSavings = demandChargeSavings + solarSavings;

  // Confidence assessment
  const confidenceFactors: string[] = [];
  let confidenceLevel: "low" | "medium" | "high" = "medium";

  if (inputs.monthlyEnergySpend) {
    confidenceFactors.push("Actual energy spend provided");
    confidenceLevel = "high";
  }
  if (inputs.occupancyRate) {
    confidenceFactors.push("Occupancy rate specified");
  }
  if (!inputs.amenities.length) {
    confidenceFactors.push("No amenities selected - using base estimate");
    confidenceLevel = "low";
  }

  return {
    estimatedAnnualKwh,
    estimatedPeakKw,
    estimatedAnnualSpend: Math.round(estimatedAnnualSpend),
    recommendedBessKwh,
    recommendedSolarKw,
    recommendedGeneratorKw,
    annualSavings,
    demandChargeSavings,
    solarSavings,
    baseLoadKwh: Math.round(baseLoadKwh),
    amenityLoadKwh: Math.round(amenityLoadKwh),
    confidenceLevel,
    confidenceFactors,
  };
}

// ============================================================================
// HELPER: Get questions for hotel type
// ============================================================================

export function getQuestionsForHotelType(hotelType?: keyof typeof HOTEL_PROFILES): any[] {
  // Return all sections - the frontend will handle conditional display
  return [
    ...HOTEL_QUESTIONS.section1,
    ...HOTEL_QUESTIONS.section2,
    ...HOTEL_QUESTIONS.section3,
    ...HOTEL_QUESTIONS.section4,
    ...HOTEL_QUESTIONS.section5,
    ...HOTEL_QUESTIONS.section6,
  ];
}

export default {
  HOTEL_PROFILES,
  AMENITY_LOADS,
  CLIMATE_ZONES,
  HOTEL_QUESTIONS,
  calculateHotelProfile,
  getQuestionsForHotelType,
};
