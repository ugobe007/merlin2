/**
 * EV CHARGING HUB INDUSTRY PROFILE
 * =================================
 *
 * Data-driven sizing calculations and question tiers for EV Charging infrastructure.
 * Based on industry workup by Bob Christopher & Vineet Kapila, December 2025.
 *
 * KEY INSIGHT: Demand charges can be 50-70% of bill — BESS is essential
 * CRITICAL: Grid upgrades = $500K-2M+ and 12-24 month wait — BESS can avoid
 *
 * KEY SIZING DRIVERS:
 * 1. Number of Chargers - Direct load driver
 * 2. Charger Mix (L2/DCFC) - L2=7-19kW vs DCFC=50-350kW
 * 3. Utilization Rate - 20% vs 60% = 3x demand difference
 * 4. Co-location Type - Standalone vs Retail vs Fleet vs Highway
 * 5. Grid Connection - Existing service capacity often THE constraint
 *
 * USER TYPES:
 * - Property owner adding chargers to existing site
 * - Fleet manager electrifying delivery vehicles
 * - Charge network operator (ChargePoint, EVgo, independent)
 * - Developer building new charging-focused site
 */

// ============================================================================
// HUB TYPE PROFILES
// ============================================================================

export const EV_HUB_PROFILES = {
  smallRetail: {
    label: "Small Retail",
    description: "Grocery, mall, restaurant — convenience charging",
    examples: ["Grocery store", "Shopping mall", "Restaurant", "Coffee shop"],

    // Typical configuration
    typicalL2: { min: 4, max: 8 },
    typicalDCFC: { min: 1, max: 2 },

    // Load characteristics
    typicalPeakKw: { min: 150, max: 300 },
    typicalAnnualKwh: { min: 200000, max: 500000 },

    // Cost benchmarks
    annualEnergySpend: { min: 25000, max: 75000 },
    costPerChargerYear: { min: 5000, max: 10000 },

    // Recommended system sizes
    bessKwh: { min: 250, max: 500 },
    solarKw: { min: 50, max: 150 },
    generatorKw: { min: 0, max: 100 }, // Often optional

    // Characteristics
    dwellTime: "1-2 hours",
    primaryUse: "Convenience charging while shopping",
    bessUseCase: "Demand charge elimination",

    questionTier: 1,
    questionsShown: 4,
  },

  urbanHub: {
    label: "Urban Hub",
    description: "City charging station — high turnover, rideshare",
    examples: ["Downtown parking garage", "Rideshare hub", "Urban charging plaza"],

    typicalL2: { min: 4, max: 8 },
    typicalDCFC: { min: 8, max: 16 },

    typicalPeakKw: { min: 800, max: 2000 },
    typicalAnnualKwh: { min: 1000000, max: 3000000 },

    annualEnergySpend: { min: 150000, max: 400000 },
    costPerChargerYear: { min: 15000, max: 25000 },

    bessKwh: { min: 1000, max: 2500 },
    solarKw: { min: 200, max: 500 },
    generatorKw: { min: 100, max: 250 },

    dwellTime: "20-45 minutes",
    primaryUse: "Quick top-off, rideshare drivers",
    bessUseCase: "Peak shaving + resilience",

    questionTier: 2,
    questionsShown: 7,
  },

  highwayCorridor: {
    label: "Highway Corridor",
    description: "Travel center — fast turnaround, high power",
    examples: ["Highway rest stop", "Travel center", "Truck stop"],

    typicalL2: { min: 0, max: 4 },
    typicalDCFC: { min: 8, max: 24 },
    dcfcPowerLevel: { min: 150, max: 350 }, // Higher power for highway

    typicalPeakKw: { min: 2000, max: 6000 },
    typicalAnnualKwh: { min: 3000000, max: 10000000 },

    annualEnergySpend: { min: 400000, max: 1500000 },
    costPerChargerYear: { min: 30000, max: 50000 },

    bessKwh: { min: 2500, max: 6000 },
    solarKw: { min: 500, max: 1500 },
    generatorKw: { min: 500, max: 1000 },

    dwellTime: "15-30 minutes",
    primaryUse: "Long-distance travel, fast turnaround",
    bessUseCase: "Grid constraint mitigation",
    gridUpgradeLikely: true,

    questionTier: 3,
    questionsShown: 10,
  },

  fleetDepot: {
    label: "Fleet Depot",
    description: "Delivery fleet, buses, commercial vehicles",
    examples: ["Amazon delivery station", "UPS depot", "Transit bus yard", "School bus depot"],

    typicalL2: { min: 20, max: 100 },
    typicalDCFC: { min: 2, max: 20 },

    typicalPeakKw: { min: 1000, max: 5000 },
    typicalAnnualKwh: { min: 2000000, max: 15000000 },

    annualEnergySpend: { min: 300000, max: 2000000 },
    costPerChargerYear: { min: 10000, max: 20000 },

    bessKwh: { min: 2000, max: 8000 },
    solarKw: { min: 500, max: 2000 },
    generatorKw: { min: 500, max: 1500 },

    dwellTime: "Overnight + daytime top-off",
    primaryUse: "Fleet electrification, scheduled charging",
    bessUseCase: "Load shifting to off-peak",

    questionTier: 3,
    questionsShown: 10,
  },

  megaHub: {
    label: "Mega Hub",
    description: "Tesla Supercharger scale — destination charging",
    examples: ["Tesla Supercharger", "Electrify America flagship", "Charging plaza"],

    typicalL2: { min: 0, max: 10 },
    typicalDCFC: { min: 40, max: 100 },
    dcfcPowerLevel: { min: 250, max: 350 },

    typicalPeakKw: { min: 5000, max: 15000 },
    typicalAnnualKwh: { min: 10000000, max: 30000000 },

    annualEnergySpend: { min: 1500000, max: 5000000 },
    costPerChargerYear: { min: 25000, max: 40000 },

    bessKwh: { min: 5000, max: 15000 },
    solarKw: { min: 1000, max: 3000 },
    generatorKw: { min: 1000, max: 3000 },

    dwellTime: "20-40 minutes",
    primaryUse: "Destination / flagship charging",
    bessUseCase: "Grid independence + revenue stacking",
    gridUpgradeLikely: true,

    questionTier: 3,
    questionsShown: 12,
  },
};

// ============================================================================
// CHARGER SPECIFICATIONS
// ============================================================================

export const CHARGER_SPECS = {
  l2: {
    label: "Level 2",
    powerLevels: [
      { kw: 7.2, label: "7 kW (32A)", typical: "Residential, workplace" },
      { kw: 11, label: "11 kW (48A)", typical: "Commercial standard" },
      { kw: 19.2, label: "19 kW (80A)", typical: "High-power L2" },
    ],
    defaultKw: 11,
    chargeTime: "4-8 hours for full charge",
    typicalUse: "Workplace, retail, overnight",
    annualKwhPerCharger: { min: 15000, max: 40000 },
    utilizationDefault: 0.25, // 25% typical
  },

  dcfc: {
    label: "DC Fast Charging",
    powerLevels: [
      { kw: 50, label: "50 kW", typical: "Entry DCFC, older vehicles" },
      { kw: 150, label: "150 kW", typical: "Standard DCFC" },
      { kw: 250, label: "250 kW", typical: "High-power DCFC" },
      { kw: 350, label: "350 kW", typical: "Ultra-fast (Porsche, new EVs)" },
    ],
    defaultKw: 150,
    chargeTime: "20-45 minutes for 80%",
    typicalUse: "Highway, quick turnaround",
    annualKwhPerCharger: { min: 75000, max: 200000 },
    utilizationDefault: 0.15, // 15% typical (higher turnover)
  },
};

// ============================================================================
// LOCATION TYPE CHARACTERISTICS
// ============================================================================

export const LOCATION_TYPES = {
  retail: {
    label: "Retail / Shopping Center",
    icon: "🛒",
    typicalDwell: "1-2 hours",
    recommendedMix: "Mostly L2, few DCFC",
    solarPotential: "moderate", // Parking canopies
    gridTypical: "400-800A",
  },
  restaurant: {
    label: "Restaurant / Convenience Store",
    icon: "🍔",
    typicalDwell: "30-60 minutes",
    recommendedMix: "Mixed L2 + DCFC",
    solarPotential: "limited",
    gridTypical: "200-400A",
  },
  parkingGarage: {
    label: "Parking Garage",
    icon: "🅿️",
    typicalDwell: "2-8 hours",
    recommendedMix: "Mostly L2",
    solarPotential: "rooftop only",
    gridTypical: "400-1600A",
  },
  fleetDepot: {
    label: "Fleet Depot / Warehouse",
    icon: "🚚",
    typicalDwell: "Overnight + top-off",
    recommendedMix: "Many L2, some DCFC",
    solarPotential: "significant", // Large roof
    gridTypical: "800-2000A+",
  },
  highway: {
    label: "Highway / Travel Center",
    icon: "🛣️",
    typicalDwell: "15-30 minutes",
    recommendedMix: "All DCFC, high power",
    solarPotential: "significant", // Open land
    gridTypical: "1600A+",
  },
  standalone: {
    label: "Standalone Charging Station",
    icon: "⚡",
    typicalDwell: "20-45 minutes",
    recommendedMix: "All DCFC",
    solarPotential: "varies",
    gridTypical: "New service required",
  },
};

// ============================================================================
// ELECTRICAL SERVICE CAPACITY
// ============================================================================

export const SERVICE_CAPACITY = {
  unknown: { label: "I don't know", amps: 0, estimatedKw: 0 },
  small: { label: "Under 200 amps (small retail)", amps: 200, estimatedKw: 48 },
  typical: { label: "200-400 amps (typical commercial)", amps: 400, estimatedKw: 96 },
  larger: { label: "400-800 amps (larger commercial)", amps: 800, estimatedKw: 192 },
  industrial: { label: "800+ amps (industrial/large retail)", amps: 1600, estimatedKw: 384 },
  newConstruction: { label: "New construction (no service yet)", amps: 0, estimatedKw: 0 },
};

// ============================================================================
// GRID UPGRADE SCENARIOS
// ============================================================================

export const GRID_UPGRADE_STATUS = {
  notContacted: {
    label: "No, haven't contacted them",
    cost: 0,
    timeline: "Unknown",
    bessValue: "high", // BESS can avoid surprise costs
  },
  noUpgradeNeeded: {
    label: "Yes — no upgrade needed",
    cost: 0,
    timeline: "None",
    bessValue: "medium", // Still good for demand charges
  },
  minorUpgrade: {
    label: "Yes — minor upgrade ($10K-50K)",
    cost: { min: 10000, max: 50000 },
    timeline: "1-3 months",
    bessValue: "medium",
  },
  majorUpgrade: {
    label: "Yes — major upgrade ($100K+)",
    cost: { min: 100000, max: 2000000 },
    timeline: "6-12 months",
    bessValue: "very high", // BESS can defer or eliminate
  },
  significantWait: {
    label: "Yes — significant wait time (12+ months)",
    cost: { min: 500000, max: 5000000 },
    timeline: "12-24+ months",
    bessValue: "critical", // BESS may be only option
  },
};

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const EV_HUB_QUESTIONS = {
  // SECTION 1: Your Site (Everyone answers)
  section1: [
    {
      id: "locationType",
      question: "What type of location is this?",
      type: "select",
      options: [
        { value: "retail", label: "Retail / Shopping Center", icon: "🛒" },
        { value: "restaurant", label: "Restaurant / Convenience Store", icon: "🍔" },
        { value: "parkingGarage", label: "Parking Garage", icon: "🅿️" },
        { value: "fleetDepot", label: "Fleet Depot / Warehouse", icon: "🚚" },
        { value: "highway", label: "Highway / Travel Center", icon: "🛣️" },
        { value: "standalone", label: "Standalone Charging Station", icon: "⚡" },
        { value: "other", label: "Other", icon: "📍" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "chargingSpaces",
      question: "How many EV charging spaces do you need?",
      type: "slider",
      min: 2,
      max: 100,
      step: 1,
      default: 8,
      presets: [
        { value: 6, label: "Small (4-8)" },
        { value: 14, label: "Medium (8-20)" },
        { value: 35, label: "Large (20-50)" },
        { value: 75, label: "Hub (50+)" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "chargerType",
      question: "What charger types do you need?",
      type: "select",
      options: [
        {
          value: "l2Only",
          label: "Level 2 only",
          description: "7-19 kW, 4-8 hour charge",
          typical: "Workplace, retail, overnight",
        },
        {
          value: "dcfcOnly",
          label: "DCFC only",
          description: "50-350 kW, 20-60 min charge",
          typical: "Highway, quick turnaround",
        },
        {
          value: "mixed",
          label: "Mixed (recommended)",
          description: "L2 + DCFC",
          typical: "Most flexible",
        },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "l2Count",
      question: "How many Level 2 chargers?",
      type: "slider",
      min: 0,
      max: 100,
      step: 1,
      default: 6,
      showIf: { chargerType: ["l2Only", "mixed"] },
      impactLevel: "critical",
    },
    {
      id: "dcfcCount",
      question: "How many DC Fast Chargers?",
      type: "slider",
      min: 0,
      max: 50,
      step: 1,
      default: 2,
      showIf: { chargerType: ["dcfcOnly", "mixed"] },
      impactLevel: "critical",
    },
    {
      id: "dcfcPowerLevel",
      question: "DCFC power level",
      type: "select",
      options: [
        { value: 50, label: "50 kW", description: "Entry DCFC, older vehicles" },
        { value: 150, label: "150 kW", description: "Standard DCFC (most common)" },
        { value: 250, label: "250 kW", description: "High-power DCFC" },
        { value: 350, label: "350 kW", description: "Ultra-fast (newest EVs)" },
      ],
      default: 150,
      showIf: { chargerType: ["dcfcOnly", "mixed"] },
      impactLevel: "high",
    },
  ],

  // SECTION 2: Your Power Situation
  section2: [
    {
      id: "electricalService",
      question: "What's your current electrical service?",
      type: "select",
      options: [
        { value: "unknown", label: "I don't know" },
        { value: "small", label: "Under 200 amps (small retail)" },
        { value: "typical", label: "200-400 amps (typical commercial)" },
        { value: "larger", label: "400-800 amps (larger commercial)" },
        { value: "industrial", label: "800+ amps (industrial/large retail)" },
        { value: "newConstruction", label: "New construction (no service yet)" },
      ],
      impactLevel: "high",
      helpText: "This determines if grid upgrade may be needed",
    },
    {
      id: "gridUpgradeStatus",
      question: "Has your utility discussed a grid upgrade?",
      type: "select",
      options: [
        { value: "notContacted", label: "No, haven't contacted them" },
        { value: "noUpgradeNeeded", label: "Yes — no upgrade needed" },
        { value: "minorUpgrade", label: "Yes — minor upgrade ($10K-50K)" },
        { value: "majorUpgrade", label: "Yes — major upgrade ($100K+)" },
        { value: "significantWait", label: "Yes — significant wait time (12+ months)" },
      ],
      impactLevel: "critical",
      helpText: "BESS can often eliminate or defer grid upgrades",
    },
    {
      id: "solarPotential",
      question: "Do you have space for solar?",
      type: "select",
      options: [
        { value: "none", label: "No / Very limited (urban, shaded, leased)" },
        { value: "rooftopOnly", label: "Some — rooftop only" },
        { value: "moderate", label: "Moderate — could install canopies over parking" },
        { value: "significant", label: "Significant — large open lot or warehouse roof" },
      ],
      impactLevel: "medium",
    },
    {
      id: "solarAreaSqFt",
      question: "Estimated canopy/roof area (sq ft)",
      type: "number",
      min: 0,
      max: 500000,
      default: 0,
      showIf: { solarPotential: ["rooftopOnly", "moderate", "significant"] },
      optional: true,
      impactLevel: "medium",
    },
  ],

  // SECTION 3: Your Goals
  section3: [
    {
      id: "goals",
      question: "What are your goals? (Select all that apply)",
      type: "multiselect",
      options: [
        {
          value: "avoidGridUpgrade",
          label: "⚡ Avoid grid upgrade costs",
          description: "Use BESS to stay within existing service",
        },
        {
          value: "reduceDemandCharges",
          label: "💰 Reduce demand charges",
          description: "Shave peaks to lower monthly bills",
        },
        {
          value: "futureExpansion",
          label: "🔋 Future expansion",
          description: "Install infrastructure now for growth",
        },
        { value: "addSolar", label: "☀️ Add solar", description: "Generate on-site power" },
        {
          value: "revenueOptimization",
          label: "🏆 Revenue optimization",
          description: "Maximize $/kWh margin",
        },
        {
          value: "sustainability",
          label: "🌍 Sustainability/ESG",
          description: "Meet corporate carbon targets",
        },
        {
          value: "gridIndependence",
          label: "🔌 Grid independence",
          description: "Reduce reliance on utility",
        },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 4: Advanced (Collapsible)
  section4: [
    {
      id: "utilization",
      question: "What's your expected utilization?",
      type: "select",
      options: [
        { value: "low", label: "Low — under 30%", description: "New site, uncertain demand" },
        { value: "medium", label: "Medium — 30-60%", description: "Established location" },
        { value: "high", label: "High — over 60%", description: "High-traffic, fleet" },
      ],
      default: "medium",
      impactLevel: "high",
    },
    {
      id: "peakDemandTarget",
      question: "Peak demand target",
      type: "select",
      options: [
        { value: "optimize", label: "Let Merlin optimize" },
        { value: "custom", label: "Stay under specific kW limit" },
        { value: "serviceLimit", label: "Must stay under current service capacity" },
      ],
      impactLevel: "high",
    },
    {
      id: "peakDemandKw",
      question: "Maximum peak demand (kW)",
      type: "number",
      min: 50,
      max: 10000,
      showIf: { peakDemandTarget: ["custom"] },
      impactLevel: "critical",
    },
    {
      id: "revenueModel",
      question: "Revenue model",
      type: "select",
      options: [
        { value: "costRecovery", label: "Cost recovery — break even on charging" },
        { value: "profitCenter", label: "Profit center — charging is a business" },
        { value: "fleetInternal", label: "Fleet internal — cost center for operations" },
        { value: "amenity", label: "Amenity — free/subsidized for customers" },
      ],
      impactLevel: "medium",
    },
  ],
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export interface EVHubInputs {
  locationType: string;
  chargingSpaces: number;
  chargerType: "l2Only" | "dcfcOnly" | "mixed";
  l2Count?: number;
  dcfcCount?: number;
  dcfcPowerLevel?: number;
  electricalService?: string;
  gridUpgradeStatus?: string;
  solarPotential?: string;
  solarAreaSqFt?: number;
  goals?: string[];
  utilization?: "low" | "medium" | "high";
  peakDemandTarget?: string;
  peakDemandKw?: number;
  revenueModel?: string;
}

export interface EVHubCalculations {
  // Load estimates
  estimatedPeakKw: number;
  estimatedAnnualKwh: number;
  estimatedAnnualSpend: number;
  demandChargesPortion: number; // % of bill from demand

  // Recommended system
  recommendedBessKwh: number;
  recommendedSolarKw: number;
  recommendedGeneratorKw: number;

  // Grid analysis
  gridUpgradeNeeded: boolean;
  estimatedGridUpgradeCost: number;
  bessCanAvoidUpgrade: boolean;

  // Savings & value
  annualSavings: number;
  demandChargeSavings: number;
  solarSavings: number;
  gridUpgradeAvoided: number;

  // Charger summary
  totalL2: number;
  totalDCFC: number;
  totalChargers: number;

  // Confidence
  confidenceLevel: "low" | "medium" | "high";
  warnings: string[];
  recommendations: string[];
}

export function calculateEVHubProfile(inputs: EVHubInputs): EVHubCalculations {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Determine charger counts
  let totalL2 = 0;
  let totalDCFC = 0;
  const dcfcPower = inputs.dcfcPowerLevel || 150;
  const l2Power = 11; // Default L2 power

  if (inputs.chargerType === "l2Only") {
    totalL2 = inputs.l2Count || inputs.chargingSpaces;
    totalDCFC = 0;
  } else if (inputs.chargerType === "dcfcOnly") {
    totalL2 = 0;
    totalDCFC = inputs.dcfcCount || inputs.chargingSpaces;
  } else {
    // mixed
    totalL2 = inputs.l2Count || Math.round(inputs.chargingSpaces * 0.7);
    totalDCFC = inputs.dcfcCount || Math.round(inputs.chargingSpaces * 0.3);
  }

  const totalChargers = totalL2 + totalDCFC;

  // Calculate peak demand
  // Assume diversity factor: not all chargers peak simultaneously
  const l2DiversityFactor = 0.7; // 70% of L2 may charge at once
  const dcfcDiversityFactor = 0.5; // 50% of DCFC may charge at once (higher turnover)

  const l2PeakKw = totalL2 * l2Power * l2DiversityFactor;
  const dcfcPeakKw = totalDCFC * dcfcPower * dcfcDiversityFactor;
  const estimatedPeakKw = Math.round(l2PeakKw + dcfcPeakKw);

  // Calculate annual kWh based on utilization
  const utilizationRates = { low: 0.2, medium: 0.4, high: 0.6 };
  const utilization = utilizationRates[inputs.utilization || "medium"];

  const l2AnnualKwh = totalL2 * l2Power * 8760 * utilization * 0.25; // L2 lower duty cycle
  const dcfcAnnualKwh = totalDCFC * dcfcPower * 8760 * utilization * 0.15; // DCFC even lower
  const estimatedAnnualKwh = Math.round(l2AnnualKwh + dcfcAnnualKwh);

  // Energy costs
  const energyRate = 0.12; // $/kWh
  const demandRate = 20; // $/kW - higher for EV due to peaks

  const energyCost = estimatedAnnualKwh * energyRate;
  const demandCost = estimatedPeakKw * demandRate * 12;
  const estimatedAnnualSpend = Math.round(energyCost + demandCost);
  const demandChargesPortion = Math.round((demandCost / estimatedAnnualSpend) * 100);

  if (demandChargesPortion > 50) {
    warnings.push(`Demand charges are ${demandChargesPortion}% of your bill — BESS is essential`);
  }

  // Grid upgrade analysis
  const serviceCapacity =
    SERVICE_CAPACITY[inputs.electricalService as keyof typeof SERVICE_CAPACITY];
  const availableKw = serviceCapacity?.estimatedKw || 0;
  const gridUpgradeNeeded = availableKw > 0 && estimatedPeakKw > availableKw * 0.8;

  let estimatedGridUpgradeCost = 0;
  if (inputs.gridUpgradeStatus === "majorUpgrade") {
    estimatedGridUpgradeCost = 500000; // Conservative estimate
  } else if (inputs.gridUpgradeStatus === "significantWait") {
    estimatedGridUpgradeCost = 1000000;
  } else if (inputs.gridUpgradeStatus === "minorUpgrade") {
    estimatedGridUpgradeCost = 30000;
  }

  // BESS sizing
  // Size BESS to handle peak shaving and potentially avoid grid upgrade
  let recommendedBessKwh: number;

  if (
    gridUpgradeNeeded ||
    inputs.gridUpgradeStatus === "majorUpgrade" ||
    inputs.gridUpgradeStatus === "significantWait"
  ) {
    // Size to avoid upgrade: need to shave peak down to available capacity
    const peakReductionNeeded = estimatedPeakKw - (availableKw || estimatedPeakKw * 0.5);
    recommendedBessKwh = Math.round(peakReductionNeeded * 2); // 2 hours of peak shaving
    recommendations.push("BESS sized to avoid grid upgrade — significant cost savings");
  } else {
    // Size for demand charge reduction (shave 50-60% of peak)
    recommendedBessKwh = Math.round(estimatedPeakKw * 0.6 * 1.5); // 1.5 hours of 60% peak
  }

  // Ensure minimum sizing
  recommendedBessKwh = Math.max(recommendedBessKwh, 250);

  // Can BESS avoid upgrade?
  const bessCanAvoidUpgrade =
    gridUpgradeNeeded && recommendedBessKwh >= (estimatedPeakKw - availableKw) * 2;

  if (bessCanAvoidUpgrade) {
    recommendations.push(
      `BESS can eliminate need for $${estimatedGridUpgradeCost.toLocaleString()} grid upgrade`
    );
  }

  // Solar sizing
  let recommendedSolarKw = 0;
  if (inputs.solarPotential === "significant") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.3); // 30% of peak
  } else if (inputs.solarPotential === "moderate") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.15);
  } else if (inputs.solarPotential === "rooftopOnly") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.08);
  }

  if (inputs.solarAreaSqFt && inputs.solarAreaSqFt > 0) {
    // ~15 watts per sq ft for solar panels
    const solarFromArea = Math.round(inputs.solarAreaSqFt * 0.015);
    recommendedSolarKw = Math.min(recommendedSolarKw, solarFromArea);
  }

  // Generator sizing (for resilience, if needed)
  const wantsResilience = inputs.goals?.includes("gridIndependence");
  const recommendedGeneratorKw = wantsResilience ? Math.round(estimatedPeakKw * 0.5) : 0;

  // Savings calculations
  const demandChargeSavings = Math.round(estimatedPeakKw * demandRate * 12 * 0.6); // 60% reduction
  const solarSavings = Math.round(recommendedSolarKw * 400); // $400/kW/year
  const gridUpgradeAvoided = bessCanAvoidUpgrade ? estimatedGridUpgradeCost : 0;
  const annualSavings = demandChargeSavings + solarSavings;

  // Confidence level
  let confidenceLevel: "low" | "medium" | "high" = "medium";
  if (inputs.electricalService === "unknown" || !inputs.gridUpgradeStatus) {
    confidenceLevel = "low";
    warnings.push("Contact your utility to confirm service capacity and upgrade requirements");
  }
  if (
    inputs.utilization &&
    inputs.gridUpgradeStatus &&
    inputs.gridUpgradeStatus !== "notContacted"
  ) {
    confidenceLevel = "high";
  }

  return {
    estimatedPeakKw,
    estimatedAnnualKwh,
    estimatedAnnualSpend,
    demandChargesPortion,
    recommendedBessKwh,
    recommendedSolarKw,
    recommendedGeneratorKw,
    gridUpgradeNeeded,
    estimatedGridUpgradeCost,
    bessCanAvoidUpgrade,
    annualSavings,
    demandChargeSavings,
    solarSavings,
    gridUpgradeAvoided,
    totalL2,
    totalDCFC,
    totalChargers,
    confidenceLevel,
    warnings,
    recommendations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQuestionsForEVHub(locationType?: string): typeof EV_HUB_QUESTIONS {
  // For now, return all questions - could filter by location type later
  return EV_HUB_QUESTIONS;
}

export function getHubProfileFromLocation(locationType: string): keyof typeof EV_HUB_PROFILES {
  const mapping: Record<string, keyof typeof EV_HUB_PROFILES> = {
    retail: "smallRetail",
    restaurant: "smallRetail",
    parkingGarage: "urbanHub",
    fleetDepot: "fleetDepot",
    highway: "highwayCorridor",
    standalone: "urbanHub",
  };
  return mapping[locationType] || "smallRetail";
}

export default {
  EV_HUB_PROFILES,
  CHARGER_SPECS,
  LOCATION_TYPES,
  SERVICE_CAPACITY,
  GRID_UPGRADE_STATUS,
  EV_HUB_QUESTIONS,
  calculateEVHubProfile,
  getQuestionsForEVHub,
  getHubProfileFromLocation,
};
