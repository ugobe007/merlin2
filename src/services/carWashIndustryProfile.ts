/**
 * CAR WASH INDUSTRY PROFILE
 * =========================
 *
 * Data-driven sizing calculations and question tiers for Car Wash industry.
 * Based on Merlin Energy Car Wash Industry Strategic Analysis, December 2025.
 *
 * KEY FINDINGS FROM RESEARCH:
 * - ZERO BESS deployment across industry
 * - <1% solar penetration
 * - 67% of sites have natural gas infrastructure
 * - Annual electricity: $36K-$96K per location
 * - Typical system: 100-200 kWh BESS, 50-100 kW solar, 80-150 kW generator
 *
 * KEY SIZING DRIVERS:
 * 1. Wash Type (Express/Full-service/Self-serve)
 * 2. Tunnel Length (drives motor/blower kW)
 * 3. Cars per Hour (peak demand)
 * 4. Water Heating (NG vs Electric - 60-70% use NG)
 * 5. Climate Zone (floor heat, space heat needs)
 */

// ============================================================================
// CAR WASH TYPE PROFILES
// ============================================================================

export const CARWASH_PROFILES = {
  selfServe: {
    label: "Self-Serve",
    description: "Coin-op bays, minimal equipment",
    examples: ["Local self-serve", "Coin-op chains"],

    // Load characteristics
    kwhPerBayYear: 15000, // Annual kWh per bay
    peakKwPerBay: 5, // Peak demand per bay
    baseLoadKw: 10, // Minimum base load

    // Typical ranges
    typicalBays: { min: 4, max: 12 },
    typicalPeakKw: { min: 30, max: 70 },
    typicalAnnualKwh: { min: 60000, max: 180000 },

    // Cost benchmarks
    annualEnergySpend: { min: 8000, max: 25000 },

    // Recommended system sizes
    bessKwh: { min: 50, max: 100 },
    solarKw: { min: 25, max: 50 },
    generatorKw: { min: 30, max: 50 },

    // Question depth
    questionTier: 1,
    questionsShown: 3,
  },

  expressTunnel: {
    label: "Express Tunnel",
    description: "Conveyor wash, high volume, membership model",
    examples: ["Whistle Express", "Quick Quack", "Tidal Wave", "Mister Car Wash"],

    kwhPerTunnelFtYear: 3000, // kWh per foot of tunnel per year
    peakKwPerTunnelFt: 2, // Peak kW per tunnel foot
    baseLoadKw: 50,

    typicalTunnelLength: { min: 100, max: 200 },
    typicalCarsPerHour: { min: 80, max: 150 },
    typicalPeakKw: { min: 200, max: 500 },
    typicalAnnualKwh: { min: 300000, max: 700000 },

    annualEnergySpend: { min: 36000, max: 96000 },

    bessKwh: { min: 100, max: 200 },
    solarKw: { min: 50, max: 100 },
    generatorKw: { min: 80, max: 150 },

    questionTier: 2,
    questionsShown: 6,
  },

  fullService: {
    label: "Full-Service",
    description: "Express + detail bays + interior cleaning",
    examples: ["Autobell", "Delta Sonic", "Premium chains"],

    kwhPerTunnelFtYear: 3500,
    peakKwPerTunnelFt: 2.5,
    baseLoadKw: 75,

    // Additional loads
    detailBayKwh: 25000, // Per detail bay per year
    vacuumIslandKwh: 15000, // Per vacuum island per year

    typicalTunnelLength: { min: 120, max: 200 },
    typicalPeakKw: { min: 300, max: 600 },
    typicalAnnualKwh: { min: 500000, max: 1000000 },

    annualEnergySpend: { min: 60000, max: 130000 },

    bessKwh: { min: 150, max: 300 },
    solarKw: { min: 75, max: 150 },
    generatorKw: { min: 100, max: 200 },

    questionTier: 3,
    questionsShown: 10,
  },
};

// ============================================================================
// EQUIPMENT LOAD PROFILES
// ============================================================================

export const CARWASH_EQUIPMENT = {
  // Tunnel equipment
  conveyorMotor: {
    label: "Conveyor Motor",
    kw: 15,
    runningHoursPerWash: 0.05,
  },
  highPressurePumps: {
    label: "High Pressure Pumps",
    kw: 30,
    perTunnel: true,
  },
  blowerDryers: {
    label: "Blower/Dryers",
    kwEach: 25,
    typicalCount: { min: 4, max: 8 },
  },

  // Water heating (major load or NG)
  waterHeatingElectric: {
    label: "Electric Water Heating",
    btuRange: { min: 199000, max: 960000 },
    kw: { min: 58, max: 280 },
  },
  waterHeatingNG: {
    label: "Natural Gas Water Heating",
    btuRange: { min: 199000, max: 960000 },
    electricKw: 2, // Just controls
  },

  // Climate-dependent
  tunnelSpaceHeating: {
    label: "Tunnel Space Heating",
    btuRange: { min: 200000, max: 400000 },
    climates: ["cold", "veryCold"],
    ngPenetration: 0.9, // 90% use NG
  },
  floorHeat: {
    label: "Floor Heat (Freeze Protection)",
    btuRange: { min: 500000, max: 1200000 },
    climates: ["cold", "veryCold"],
    ngPenetration: 0.75,
  },

  // Ancillary
  vacuumSystem: {
    label: "Vacuum System",
    kwPerIsland: 5,
    typicalIslands: { min: 6, max: 20 },
  },
  lighting: {
    label: "Lighting",
    kwPer1000SqFt: 2,
    operatingHours: 14, // Typical daily hours
  },
  waterReclaim: {
    label: "Water Reclaim System",
    kw: 10,
    savesWaterPercent: 0.8,
  },
};

// ============================================================================
// NATURAL GAS INFRASTRUCTURE
// ============================================================================

export const NG_PENETRATION = {
  byClimate: {
    veryHigh: {
      label: "Very High NG (85-95%)",
      regions: ["Midwest", "Northeast", "Upper Mountain"],
      chains: ["Splash", "Jax Kar Wash", "Delta Sonic", "EWC/Club"],
      penetration: 0.9,
    },
    high: {
      label: "High NG (75-85%)",
      regions: ["Great Lakes", "Northern Plains"],
      chains: ["Mister (MW/NE)", "Tommy's", "Rocket"],
      penetration: 0.8,
    },
    moderate: {
      label: "Moderate NG (55-65%)",
      regions: ["Mid-Atlantic", "Central"],
      chains: ["Whistle Express", "Tidal Wave", "ZIPS", "WhiteWater"],
      penetration: 0.6,
    },
    lowMod: {
      label: "Low-Mod NG (45-55%)",
      regions: ["Sun Belt mixed"],
      chains: ["Quick Quack", "Spotless", "Caliber"],
      penetration: 0.5,
    },
    veryLow: {
      label: "Very Low NG (20-30%)",
      regions: ["Florida", "Arizona", "Southern California"],
      chains: ["El Car Wash"],
      penetration: 0.25,
    },
  },

  applications: {
    hotWater: { penetration: 0.65, allClimates: true },
    tunnelSpaceHeat: { penetration: 0.9, coldClimateOnly: true },
    floorHeat: { penetration: 0.75, coldClimateOnly: true },
    vacuumAreaHeat: { penetration: 0.55, coldClimateOnly: true },
  },
};

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const CARWASH_QUESTIONS = {
  // SECTION 1: Your Facility
  section1: [
    {
      id: "washType",
      question: "What type of car wash?",
      type: "select",
      options: ["selfServe", "expressTunnel", "fullService"],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "bayCount",
      question: "Number of wash bays",
      type: "slider",
      min: 2,
      max: 16,
      step: 1,
      default: 6,
      showIf: { washType: ["selfServe"] },
      required: true,
      impactLevel: "critical",
    },
    {
      id: "tunnelLength",
      question: "Tunnel length (feet)?",
      type: "slider",
      min: 80,
      max: 250,
      step: 10,
      default: 120,
      showIf: { washType: ["expressTunnel", "fullService", "flexServe"] },
      impactLevel: "high",
    },
    {
      id: "carsPerDay",
      question: "Average cars washed per day?",
      type: "slider",
      min: 50,
      max: 1500,
      step: 50,
      default: 300,
      impactLevel: "high",
    },
  ],

  // SECTION 2: Equipment
  section2: [
    {
      id: "dryerType",
      question: "What type of dryers?",
      type: "select",
      options: [
        { value: "standard", label: "Standard blowers" },
        { value: "highVelocity", label: "High-velocity (30+ HP)" },
        { value: "heated", label: "Heated dryers" },
        { value: "none", label: "No dryers / Towel dry" },
      ],
      impactLevel: "high",
    },
    {
      id: "dryerCount",
      question: "How many dryer units?",
      type: "number",
      min: 0,
      max: 20,
      showIf: { dryerType: ["standard", "highVelocity", "heated"] },
      impactLevel: "medium",
    },
    {
      id: "vacuumStations",
      question: "Number of vacuum stations?",
      type: "number",
      min: 0,
      max: 40,
      impactLevel: "medium",
    },
    {
      id: "waterHeatingFuel",
      question: "Water heating fuel?",
      type: "select",
      options: [
        { value: "gas", label: "Natural gas" },
        { value: "electric", label: "Electric" },
        { value: "propane", label: "Propane" },
        { value: "none", label: "Cold water only" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "waterReclaim",
      question: "Do you have water reclaim?",
      type: "boolean",
      impactLevel: "low",
    },
    {
      id: "otherEquipment",
      question: "Other equipment?",
      type: "multiselect",
      options: [
        { value: "lighting", label: "LED tunnel lighting" },
        { value: "signage", label: "Large illuminated signage" },
        { value: "evCharging", label: "EV charging stations" },
        { value: "conveyorHeat", label: "Heated conveyor (freeze protection)" },
        { value: "airCompressors", label: "Air compressors" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 3: Operations
  section3: [
    {
      id: "operatingHours",
      question: "Operating hours per day?",
      type: "select",
      options: [
        { value: "8", label: "8 hours (7am-3pm)" },
        { value: "12", label: "12 hours (7am-7pm)" },
        { value: "14", label: "14 hours (6am-8pm)" },
        { value: "24", label: "24/7" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "peakDays",
      question: "Busiest days?",
      type: "multiselect",
      options: [
        { value: "saturday", label: "Saturday" },
        { value: "sunday", label: "Sunday" },
        { value: "weekdays", label: "Weekdays" },
        { value: "evenDistribution", label: "Fairly even" },
      ],
      impactLevel: "low",
    },
    {
      id: "climateZone",
      question: "Climate zone",
      type: "select",
      options: [
        { value: "hot", label: "Hot (AZ, NV, FL, TX)" },
        { value: "warm", label: "Warm (CA, GA, NC)" },
        { value: "temperate", label: "Temperate (OR, WA, Mid-Atlantic)" },
        { value: "cold", label: "Cold (IL, MI, NY, MN)" },
      ],
      helpText: "Affects heating loads and floor heat requirements",
      impactLevel: "high",
    },
  ],

  // SECTION 4: Current Power
  section4: [
    {
      id: "monthlyEnergySpend",
      question: "Monthly energy spend?",
      type: "select",
      options: [
        { value: 2000, label: "Under $3,000" },
        { value: 5000, label: "$3,000 - $7,000" },
        { value: 10000, label: "$7,000 - $15,000" },
        { value: 20000, label: "$15,000 - $25,000" },
        { value: 35000, label: "Over $25,000" },
        { value: 0, label: "Prefer not to say" },
      ],
      impactLevel: "high",
    },
    {
      id: "currentBackup",
      question: "Do you have backup power?",
      type: "select",
      options: [
        { value: "none", label: "None" },
        { value: "partial", label: "Partial (POS, gates only)" },
        { value: "full", label: "Full generator" },
        { value: "notSure", label: "Not sure" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "outageImpact",
      question: "What happens during power outage?",
      type: "select",
      options: [
        { value: "immediateClose", label: "Close immediately" },
        { value: "finishQueue", label: "Finish cars in tunnel, then close" },
        { value: "continueOperating", label: "Continue on backup" },
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
        { value: "protectOutages", label: "Protect against outages" },
        { value: "reduceDemand", label: "Reduce demand charges" },
        { value: "addEvCharging", label: "Add EV charging" },
        { value: "sustainability", label: "Sustainability" },
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
        { value: "reduceCosts", label: "Reduce energy costs", description: "Dryers are expensive" },
        {
          value: "stayOpen",
          label: "Stay open during outages",
          description: "Lost revenue = $500+/hour",
        },
        { value: "demandCharges", label: "Reduce demand charges", description: "Peak spikes hurt" },
        { value: "quickPayback", label: "Quick payback", description: "ROI within 2-3 years" },
        {
          value: "sustainability",
          label: "Sustainability",
          description: "Marketing, customer appeal",
        },
        { value: "evCharging", label: "Add EV charging", description: "Customer amenity" },
      ],
      required: true,
      impactLevel: "high",
    },
  ],
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export interface CarWashInputs {
  washType: "selfServe" | "expressTunnel" | "fullService";
  bayCount?: number;
  tunnelLength?: number;
  carsPerDay?: number;
  carsPerHour?: number;
  dryerType?: "standard" | "highVelocity" | "heated" | "none";
  dryerCount?: number;
  vacuumStations?: number;
  waterHeatingFuel: "gas" | "electric" | "propane" | "none";
  waterReclaim?: boolean;
  otherEquipment?: string[];
  operatingHours?: "8" | "12" | "14" | "24";
  peakDays?: string[];
  climateZone?: "hot" | "warm" | "temperate" | "cold";
  monthlyEnergySpend?: number;
  currentBackup: "none" | "partial" | "full" | "notSure";
  outageImpact?: "immediateClose" | "finishQueue" | "continueOperating";
  energyGoals?: string[];
  priorities: string[];
}

export interface CarWashCalculations {
  estimatedAnnualKwh: number;
  estimatedPeakKw: number;
  estimatedAnnualSpend: number;

  recommendedBessKwh: number;
  recommendedSolarKw: number;
  recommendedGeneratorKw: number;
  generatorFuelRecommendation: "diesel" | "naturalGas";

  annualSavings: number;
  demandChargeSavings: number;
  solarSavings: number;

  hasNaturalGas: boolean;
  ngConfidence: "likely" | "possible" | "unlikely";

  confidenceLevel: "low" | "medium" | "high";
}

export function calculateCarWashProfile(inputs: CarWashInputs): CarWashCalculations {
  const profile = CARWASH_PROFILES[inputs.washType];
  let estimatedAnnualKwh = 0;
  let estimatedPeakKw = profile.baseLoadKw;

  // Calculate based on wash type
  if (inputs.washType === "selfServe") {
    const selfServeProfile = profile as typeof CARWASH_PROFILES.selfServe;
    const bays = inputs.bayCount || 6;
    estimatedAnnualKwh = bays * selfServeProfile.kwhPerBayYear;
    estimatedPeakKw += bays * selfServeProfile.peakKwPerBay;
  } else {
    // Express or Full-Service tunnel
    const tunnelProfile = profile as typeof CARWASH_PROFILES.expressTunnel;
    const tunnelLength = inputs.tunnelLength || 140;
    const dryerCount = inputs.dryerCount || 6;

    estimatedAnnualKwh = tunnelLength * tunnelProfile.kwhPerTunnelFtYear;
    estimatedPeakKw += tunnelLength * tunnelProfile.peakKwPerTunnelFt;

    // Add dryer load
    estimatedPeakKw += dryerCount * CARWASH_EQUIPMENT.blowerDryers.kwEach;

    // Full-service additions - use vacuumStations if provided
    if (inputs.washType === "fullService" && inputs.vacuumStations) {
      estimatedPeakKw += inputs.vacuumStations * CARWASH_EQUIPMENT.vacuumSystem.kwPerIsland;
    }
  }

  // Add vacuum stations load if provided
  if (inputs.vacuumStations) {
    estimatedPeakKw += inputs.vacuumStations * CARWASH_EQUIPMENT.vacuumSystem.kwPerIsland;
  }

  // Water heating adjustment (electric adds significant load)
  if (inputs.waterHeatingFuel === "electric") {
    estimatedAnnualKwh += 150000; // ~150,000 kWh/year for electric water heating
    estimatedPeakKw += 100; // ~100 kW peak
  }

  // Climate adjustment (cold climate adds heating loads if no NG)
  if (inputs.climateZone === "cold" && inputs.waterHeatingFuel === "electric") {
    estimatedAnnualKwh *= 1.25; // 25% more for electric heating in cold
    estimatedPeakKw *= 1.2;
  }

  // Operating hours adjustment
  const opHoursStr = inputs.operatingHours || "14";
  const opHours = Number(opHoursStr);
  const hoursMultiplier = opHours / 14; // Normalize to 14-hour baseline
  estimatedAnnualKwh *= hoursMultiplier;

  // Energy spend
  const utilityRate = 0.12;
  const demandRate = 15;
  const estimatedAnnualSpend =
    inputs.monthlyEnergySpend && inputs.monthlyEnergySpend > 0
      ? inputs.monthlyEnergySpend * 12
      : estimatedAnnualKwh * utilityRate + estimatedPeakKw * demandRate * 12;

  // System recommendations (from research: 100-200 kWh BESS, 50-100 kW solar, 80-150 kW gen)
  const recommendedBessKwh = Math.round(
    ((profile.bessKwh.min + profile.bessKwh.max) / 2) *
      (estimatedPeakKw /
        ((profile.typicalPeakKw?.min || 100 + profile.typicalPeakKw?.max || 300) / 2))
  );

  const recommendedSolarKw = Math.round((profile.solarKw.min + profile.solarKw.max) / 2);

  const recommendedGeneratorKw = Math.round(
    (profile.generatorKw.min + profile.generatorKw.max) / 2
  );

  // Natural gas assessment
  const hasNaturalGas = inputs.waterHeatingFuel === "gas";
  let ngConfidence: "likely" | "possible" | "unlikely" = "possible";

  if (inputs.climateZone === "cold") {
    ngConfidence = "likely"; // 80-95% in cold climates
  } else if (inputs.climateZone === "hot") {
    ngConfidence = "unlikely"; // 20-40% in hot climates
  }

  // Generator fuel recommendation
  const generatorFuelRecommendation =
    hasNaturalGas || ngConfidence === "likely" ? "naturalGas" : "diesel";

  // Savings
  const demandChargeSavings = Math.round(estimatedPeakKw * demandRate * 12 * 0.6);
  const solarSavings = Math.round(recommendedSolarKw * 400); // SSOT: DEFAULTS.Preview.solarSavingsPerKW
  const annualSavings = demandChargeSavings + solarSavings;

  // Confidence
  let confidenceLevel: "low" | "medium" | "high" = "medium";
  if (inputs.monthlyEnergySpend && inputs.monthlyEnergySpend > 0) confidenceLevel = "high";
  if (inputs.washType === "selfServe" && !inputs.bayCount) confidenceLevel = "low";

  return {
    estimatedAnnualKwh: Math.round(estimatedAnnualKwh),
    estimatedPeakKw: Math.round(estimatedPeakKw),
    estimatedAnnualSpend: Math.round(estimatedAnnualSpend),
    recommendedBessKwh,
    recommendedSolarKw,
    recommendedGeneratorKw,
    generatorFuelRecommendation,
    annualSavings,
    demandChargeSavings,
    solarSavings,
    hasNaturalGas,
    ngConfidence,
    confidenceLevel,
  };
}

// ============================================================================
// HELPER: Get questions for wash type
// ============================================================================

export function getQuestionsForWashType(washType?: keyof typeof CARWASH_PROFILES): any[] {
  // Return all sections - the frontend will handle conditional display
  return [
    ...CARWASH_QUESTIONS.section1,
    ...CARWASH_QUESTIONS.section2,
    ...CARWASH_QUESTIONS.section3,
    ...CARWASH_QUESTIONS.section4,
    ...CARWASH_QUESTIONS.section5,
  ];
}

export default {
  CARWASH_PROFILES,
  CARWASH_EQUIPMENT,
  NG_PENETRATION,
  CARWASH_QUESTIONS,
  calculateCarWashProfile,
  getQuestionsForWashType,
};
