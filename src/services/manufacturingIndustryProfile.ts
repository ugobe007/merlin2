/**
 * MANUFACTURING INDUSTRY PROFILE
 * ==============================
 *
 * Data-driven sizing calculations and question tiers for Manufacturing.
 * Based on industry workup by Bob Christopher & Vineet Kapila, December 2025.
 *
 * KEY INSIGHT: Manufacturing is incredibly diverse. A semiconductor fab is
 * nothing like a food processor. We identify sub-type first.
 *
 * KEY SIZING DRIVERS:
 * 1. Manufacturing Sub-Type - Energy intensity varies 10x+
 * 2. Production Schedule - 24/7 vs single shift = 3x difference
 * 3. Equipment Mix - Motors often 60-80% of load
 * 4. Demand Spikes - Large motor startups = massive peaks
 * 5. Process Criticality - Some processes can't stop mid-cycle
 *
 * UNIQUE FACTORS:
 * - Compressed air: Hidden energy hog (20-30% in some plants)
 * - Power quality: Some equipment needs clean, stable power
 * - Waste heat: Opportunity for recovery
 * - Motor loads: Inrush current 5-7x normal
 */

// ============================================================================
// MANUFACTURING SUB-TYPES
// ============================================================================

export const MANUFACTURING_TYPES = {
  lightAssembly: {
    label: "Light Assembly / Electronics",
    examples: ["Circuit boards", "Consumer products", "Furniture"],
    kwhPerSqFtYear: { min: 15, max: 30 },
    defaultKwhPerSqFt: 22,
    peakKwPer1000SqFt: 3,
    demandIntensity: "low",
    motorLoad: 0.4, // 40% of load is motors
    characteristics: ["Low heat processes", "Precision work", "Clean assembly"],
  },

  heavyAssembly: {
    label: "Heavy Assembly / Automotive",
    examples: ["Vehicles", "Aerospace", "Heavy equipment"],
    kwhPerSqFtYear: { min: 30, max: 50 },
    defaultKwhPerSqFt: 40,
    peakKwPer1000SqFt: 5,
    demandIntensity: "medium",
    motorLoad: 0.65,
    characteristics: ["Welding", "Robotics", "Large motors", "Paint booths"],
  },

  processChemical: {
    label: "Process / Chemical",
    examples: ["Chemicals", "Refineries", "Continuous flow"],
    kwhPerSqFtYear: { min: 50, max: 100 },
    defaultKwhPerSqFt: 75,
    peakKwPer1000SqFt: 10,
    demandIntensity: "high",
    motorLoad: 0.7,
    characteristics: ["24/7 operation", "Reactors", "High heat", "Can't stop mid-process"],
  },

  foodBeverage: {
    label: "Food & Beverage",
    examples: ["Food processing", "Breweries", "Bottling"],
    kwhPerSqFtYear: { min: 40, max: 80 },
    defaultKwhPerSqFt: 55,
    peakKwPer1000SqFt: 7,
    demandIntensity: "medium-high",
    motorLoad: 0.5,
    refrigerationLoad: 0.25, // 25% refrigeration
    characteristics: ["Refrigeration", "Cooking", "Packaging", "Sanitation"],
  },

  metalsFoundry: {
    label: "Metals / Foundry",
    examples: ["Casting", "Forging", "Steel", "Aluminum"],
    kwhPerSqFtYear: { min: 100, max: 300 },
    defaultKwhPerSqFt: 180,
    peakKwPer1000SqFt: 25,
    demandIntensity: "very-high",
    motorLoad: 0.3,
    furnaceLoad: 0.5, // 50% furnaces
    characteristics: ["Furnaces", "Extreme heat", "Massive peaks", "Arc welding"],
  },

  plasticsRubber: {
    label: "Plastics / Rubber",
    examples: ["Injection molding", "Extrusion"],
    kwhPerSqFtYear: { min: 40, max: 70 },
    defaultKwhPerSqFt: 55,
    peakKwPer1000SqFt: 8,
    demandIntensity: "medium-high",
    motorLoad: 0.6,
    characteristics: ["Injection molding", "Extrusion", "Heating", "Cyclic loads"],
  },

  pharmaceutical: {
    label: "Pharmaceutical / Biotech",
    examples: ["Drug manufacturing", "Clean rooms"],
    kwhPerSqFtYear: { min: 60, max: 120 },
    defaultKwhPerSqFt: 85,
    peakKwPer1000SqFt: 12,
    demandIntensity: "high",
    motorLoad: 0.3,
    hvacLoad: 0.5, // 50% HVAC for clean rooms
    characteristics: ["Clean rooms", "HVAC-intensive", "Precision", "Regulatory"],
  },

  semiconductor: {
    label: "Semiconductor / High-Tech",
    examples: ["Chips", "Displays", "Precision electronics"],
    kwhPerSqFtYear: { min: 100, max: 500 },
    defaultKwhPerSqFt: 250,
    peakKwPer1000SqFt: 35,
    demandIntensity: "very-high",
    motorLoad: 0.2,
    hvacLoad: 0.6, // 60% for ultra-clean rooms
    characteristics: ["Ultra-clean rooms", "Precision equipment", "Extremely sensitive"],
  },

  textileApparel: {
    label: "Textile / Apparel",
    examples: ["Clothing", "Fabrics", "Leather"],
    kwhPerSqFtYear: { min: 10, max: 25 },
    defaultKwhPerSqFt: 18,
    peakKwPer1000SqFt: 2.5,
    demandIntensity: "low",
    motorLoad: 0.5,
    characteristics: ["Sewing", "Cutting", "Low power", "Labor intensive"],
  },

  woodPaper: {
    label: "Wood / Paper / Printing",
    examples: ["Lumber", "Pulp", "Packaging", "Printing"],
    kwhPerSqFtYear: { min: 30, max: 50 },
    defaultKwhPerSqFt: 40,
    peakKwPer1000SqFt: 5,
    demandIntensity: "medium",
    motorLoad: 0.6,
    characteristics: ["Motors", "Drying", "Dust collection", "Presses"],
  },

  other: {
    label: "Other",
    examples: ["Various"],
    kwhPerSqFtYear: { min: 25, max: 60 },
    defaultKwhPerSqFt: 40,
    peakKwPer1000SqFt: 5,
    demandIntensity: "medium",
    motorLoad: 0.5,
    characteristics: [],
  },
};

// ============================================================================
// FACILITY SIZE PROFILES
// ============================================================================

export const FACILITY_SIZES = {
  small: {
    label: "Small",
    sqFt: { min: 10000, max: 50000 },
    typicalPeakKw: { min: 100, max: 500 },
    typicalAnnualKwh: { min: 300000, max: 1500000 },
    notes: "Single shift typical",
    bessKwh: { min: 200, max: 500 },
    solarKw: { min: 100, max: 300 },
    generatorKw: { min: 100, max: 300 },
  },

  medium: {
    label: "Medium",
    sqFt: { min: 50000, max: 200000 },
    typicalPeakKw: { min: 500, max: 2000 },
    typicalAnnualKwh: { min: 1500000, max: 8000000 },
    notes: "Multi-shift common",
    bessKwh: { min: 500, max: 2000 },
    solarKw: { min: 300, max: 1000 },
    generatorKw: { min: 300, max: 1000 },
  },

  large: {
    label: "Large",
    sqFt: { min: 200000, max: 500000 },
    typicalPeakKw: { min: 2000, max: 5000 },
    typicalAnnualKwh: { min: 8000000, max: 25000000 },
    notes: "24/7 operations",
    bessKwh: { min: 2000, max: 5000 },
    solarKw: { min: 1000, max: 3000 },
    generatorKw: { min: 1000, max: 3000 },
  },

  veryLarge: {
    label: "Very Large",
    sqFt: { min: 500000, max: 1000000 },
    typicalPeakKw: { min: 5000, max: 15000 },
    typicalAnnualKwh: { min: 25000000, max: 75000000 },
    notes: "Industrial campus",
    bessKwh: { min: 5000, max: 15000 },
    solarKw: { min: 3000, max: 10000 },
    generatorKw: { min: 3000, max: 10000 },
  },

  megaPlant: {
    label: "Mega Plant",
    sqFt: { min: 1000000, max: 5000000 },
    typicalPeakKw: { min: 15000, max: 50000 },
    typicalAnnualKwh: { min: 75000000, max: 300000000 },
    notes: "Auto plants, fabs",
    bessKwh: { min: 15000, max: 50000 },
    solarKw: { min: 10000, max: 30000 },
    generatorKw: { min: 10000, max: 30000 },
  },
};

// ============================================================================
// PRODUCTION SCHEDULES
// ============================================================================

export const PRODUCTION_SCHEDULES = {
  singleShift: {
    label: "Single shift",
    hoursPerDay: 9,
    daysPerWeek: 5,
    annualHours: 2340,
    loadFactor: 0.27, // % of year at full load
    impact: "Lower base load",
  },

  doubleShift: {
    label: "Double shift",
    hoursPerDay: 17,
    daysPerWeek: 5.5,
    annualHours: 4862,
    loadFactor: 0.55,
    impact: "Higher utilization",
  },

  continuous: {
    label: "24/7 continuous",
    hoursPerDay: 24,
    daysPerWeek: 7,
    annualHours: 8760,
    loadFactor: 0.85, // Some downtime for maintenance
    impact: "Highest load, most savings potential",
  },

  seasonal: {
    label: "Seasonal",
    hoursPerDay: null,
    daysPerWeek: null,
    annualHours: 4000, // Estimate
    loadFactor: 0.45,
    impact: "Peak seasons matter",
  },

  batch: {
    label: "Batch / Intermittent",
    hoursPerDay: null,
    daysPerWeek: null,
    annualHours: 3000, // Estimate
    loadFactor: 0.35,
    impact: "Unpredictable peaks",
  },
};

// ============================================================================
// EQUIPMENT CATEGORIES
// ============================================================================

export const EQUIPMENT_CATEGORIES = {
  motors: {
    label: "Electric motors / Pumps",
    icon: "⚙️",
    typicalLoadPercent: { min: 20, max: 70 },
    inrushMultiplier: 6, // 6x startup current
    demandImpact: "high",
  },

  compressedAir: {
    label: "Compressed air systems",
    icon: "💨",
    typicalLoadPercent: { min: 10, max: 30 },
    hiddenEnergyHog: true,
    demandImpact: "medium",
  },

  hvac: {
    label: "HVAC / Climate control",
    icon: "❄️",
    typicalLoadPercent: { min: 10, max: 40 },
    demandImpact: "medium",
  },

  refrigeration: {
    label: "Refrigeration / Freezers",
    icon: "🧊",
    typicalLoadPercent: { min: 15, max: 40 },
    constant: true,
    demandImpact: "medium",
  },

  furnaces: {
    label: "Electric furnaces / Ovens",
    icon: "🔥",
    typicalLoadPercent: { min: 20, max: 60 },
    demandImpact: "very-high",
  },

  welding: {
    label: "Welding equipment",
    icon: "⚡",
    typicalLoadPercent: { min: 5, max: 30 },
    demandImpact: "high",
    spiky: true,
  },

  cnc: {
    label: "CNC machines / Robotics",
    icon: "🤖",
    typicalLoadPercent: { min: 10, max: 40 },
    demandImpact: "medium",
  },

  molding: {
    label: "Injection molding / Extrusion",
    icon: "🏭",
    typicalLoadPercent: { min: 30, max: 70 },
    cyclic: true,
    demandImpact: "high",
  },

  lighting: {
    label: "Lighting",
    icon: "💡",
    typicalLoadPercent: { min: 5, max: 15 },
    demandImpact: "low",
  },

  cleanRoom: {
    label: "Clean room HVAC",
    icon: "🧪",
    typicalLoadPercent: { min: 30, max: 60 },
    constant: true,
    demandImpact: "high",
  },
};

// ============================================================================
// LARGE LOAD EQUIPMENT
// ============================================================================

export const LARGE_LOADS = {
  largeMotors: {
    label: "Large motors (100+ HP)",
    typicalKw: { min: 75, max: 500 },
    inrushMultiplier: 6,
    startupImpact: "5-7x inrush current",
  },

  arcFurnace: {
    label: "Electric arc furnace",
    typicalKw: { min: 1000, max: 50000 },
    startupImpact: "Extreme spikes",
    powerQualityIssue: true,
  },

  largeCompressors: {
    label: "Large compressors",
    typicalKw: { min: 50, max: 500 },
    inrushMultiplier: 5,
    startupImpact: "High inrush",
  },

  industrialChillers: {
    label: "Industrial chillers",
    typicalKw: { min: 100, max: 1000 },
    cyclic: true,
    startupImpact: "Cycling load",
  },

  injectionMolding: {
    label: "Injection molding machines",
    typicalKw: { min: 50, max: 500 },
    cyclic: true,
    startupImpact: "Cyclic peaks",
  },
};

// ============================================================================
// OUTAGE IMPACTS
// ============================================================================

export const OUTAGE_IMPACTS = {
  easyRestart: {
    label: "Production stops, restarts easily",
    severity: "low",
    costPerHour: 5000,
  },

  significantRestart: {
    label: "Production stops, significant restart time/cost",
    severity: "medium",
    costPerHour: 25000,
  },

  productRuined: {
    label: "Product in process is ruined/scrapped",
    severity: "high",
    costPerHour: 75000,
  },

  equipmentDamage: {
    label: "Equipment can be damaged",
    severity: "very-high",
    costPerHour: 150000,
  },

  safetyAffected: {
    label: "Safety systems affected",
    severity: "critical",
    costPerHour: 250000,
  },

  minimalImpact: {
    label: "We have backup, minimal impact",
    severity: "none",
    costPerHour: 1000,
  },
};

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const MANUFACTURING_QUESTIONS = {
  // SECTION 1: Your Facility
  section1: [
    {
      id: "manufacturingType",
      question: "What type of manufacturing do you do?",
      type: "select",
      options: [
        {
          value: "lightAssembly",
          label: "Light Assembly / Electronics",
          examples: "Circuit boards, consumer products, furniture",
        },
        {
          value: "heavyAssembly",
          label: "Heavy Assembly / Automotive",
          examples: "Vehicles, aerospace, heavy equipment",
        },
        {
          value: "processChemical",
          label: "Process / Chemical",
          examples: "Chemicals, refineries, continuous flow",
        },
        {
          value: "foodBeverage",
          label: "Food & Beverage",
          examples: "Food processing, breweries, bottling",
        },
        {
          value: "metalsFoundry",
          label: "Metals / Foundry",
          examples: "Casting, forging, steel, aluminum",
        },
        {
          value: "plasticsRubber",
          label: "Plastics / Rubber",
          examples: "Injection molding, extrusion",
        },
        {
          value: "pharmaceutical",
          label: "Pharmaceutical / Biotech",
          examples: "Drug manufacturing, clean rooms",
        },
        {
          value: "semiconductor",
          label: "Semiconductor / High-Tech",
          examples: "Chips, displays, precision electronics",
        },
        {
          value: "textileApparel",
          label: "Textile / Apparel",
          examples: "Clothing, fabrics, leather",
        },
        {
          value: "woodPaper",
          label: "Wood / Paper / Printing",
          examples: "Lumber, pulp, packaging, printing",
        },
        { value: "other", label: "Other", examples: "Describe: ___" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "facilitySqFt",
      question: "What's your facility size?",
      type: "slider",
      min: 10000,
      max: 2000000,
      step: 5000,
      default: 100000,
      unit: "sq ft",
      required: true,
      impactLevel: "critical",
    },
    {
      id: "buildingCount",
      question: "How many buildings / facilities?",
      type: "select",
      options: [
        { value: "single", label: "Single building" },
        { value: "multipleSameSite", label: "Multiple buildings, same site" },
        { value: "multipleSites", label: "Multiple sites (we'll focus on one)" },
      ],
      impactLevel: "low",
    },
  ],

  // SECTION 2: Operations Profile
  section2: [
    {
      id: "productionSchedule",
      question: "What's your production schedule?",
      type: "select",
      options: [
        {
          value: "singleShift",
          label: "Single shift",
          hours: "8-10 hrs",
          days: "5 days",
          impact: "Lower base load",
        },
        {
          value: "doubleShift",
          label: "Double shift",
          hours: "16-18 hrs",
          days: "5-6 days",
          impact: "Higher utilization",
        },
        {
          value: "continuous",
          label: "24/7 continuous",
          hours: "24 hrs",
          days: "7 days",
          impact: "Highest load, most savings potential",
        },
        {
          value: "seasonal",
          label: "Seasonal",
          hours: "Varies",
          days: "Varies",
          impact: "Peak seasons matter",
        },
        {
          value: "batch",
          label: "Batch / Intermittent",
          hours: "Varies",
          days: "Varies",
          impact: "Unpredictable peaks",
        },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "mainEquipment",
      question: "What are your main power-consuming equipment?",
      type: "multiselect",
      helpText: "Select all that apply. Don't know percentages? That's fine.",
      options: [
        { value: "motors", label: "Electric motors / Pumps", icon: "⚙️" },
        { value: "compressedAir", label: "Compressed air systems", icon: "💨" },
        { value: "hvac", label: "HVAC / Climate control", icon: "❄️" },
        { value: "refrigeration", label: "Refrigeration / Freezers", icon: "🧊" },
        { value: "furnaces", label: "Electric furnaces / Ovens", icon: "🔥" },
        { value: "welding", label: "Welding equipment", icon: "⚡" },
        { value: "cnc", label: "CNC machines / Robotics", icon: "🤖" },
        { value: "molding", label: "Injection molding / Extrusion", icon: "🏭" },
        { value: "lighting", label: "Lighting", icon: "💡" },
        { value: "cleanRoom", label: "Clean room HVAC", icon: "🧪" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "largeLoads",
      question: "Do you have any of these large loads?",
      type: "multiselect",
      options: [
        { value: "largeMotors", label: "Large motors (100+ HP)", impact: "5-7x inrush current" },
        { value: "arcFurnace", label: "Electric arc furnace", impact: "Extreme spikes" },
        { value: "largeCompressors", label: "Large compressors", impact: "High inrush" },
        { value: "industrialChillers", label: "Industrial chillers", impact: "Cycling load" },
        { value: "injectionMolding", label: "Injection molding machines", impact: "Cyclic peaks" },
      ],
      impactLevel: "high",
    },
    {
      id: "largeLoadCount",
      question: "How many large motors/equipment?",
      type: "number",
      min: 0,
      max: 100,
      showIf: {
        largeLoads: ["largeMotors", "largeCompressors", "industrialChillers", "injectionMolding"],
      },
      impactLevel: "medium",
    },
  ],

  // SECTION 3: Current Power Situation
  section3: [
    {
      id: "electricalService",
      question: "What's your current electrical service?",
      type: "select",
      options: [
        { value: "under500", label: "Under 500 kW", description: "Small facility" },
        { value: "500to1000", label: "500 kW - 1 MW", description: "Medium facility" },
        { value: "1to3mw", label: "1 - 3 MW", description: "Large facility" },
        { value: "3to10mw", label: "3 - 10 MW", description: "Very large facility" },
        { value: "over10mw", label: "Over 10 MW", description: "Industrial campus" },
        { value: "notSure", label: "Not sure", description: "We'll estimate" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "currentBackup",
      question: "Do you have backup power today?",
      type: "multiselect",
      options: [
        { value: "none", label: "None" },
        { value: "dieselGen", label: "Diesel generator(s)" },
        { value: "ngGen", label: "Natural gas generator(s)" },
        { value: "upsCritical", label: "UPS for critical equipment only" },
        { value: "bess", label: "BESS (battery system)" },
        { value: "chp", label: "On-site generation (CHP, cogen)" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "generatorCapacity",
      question: "Total generator capacity (kW)",
      type: "number",
      min: 0,
      max: 50000,
      showIf: { currentBackup: ["dieselGen", "ngGen"] },
      impactLevel: "medium",
    },
    {
      id: "generatorCoverage",
      question: "What does it back up?",
      type: "select",
      showIf: { currentBackup: ["dieselGen", "ngGen"] },
      options: [
        { value: "fullPlant", label: "Full plant" },
        { value: "criticalOnly", label: "Critical only" },
        { value: "safetyOnly", label: "Safety systems only" },
      ],
      impactLevel: "medium",
    },
    {
      id: "outageImpact",
      question: "What happens when power goes out?",
      type: "multiselect",
      options: [
        { value: "easyRestart", label: "Production stops, restarts easily" },
        { value: "significantRestart", label: "Production stops, significant restart time/cost" },
        { value: "productRuined", label: "Product in process is ruined/scrapped" },
        { value: "equipmentDamage", label: "Equipment can be damaged" },
        { value: "safetyAffected", label: "Safety systems affected" },
        { value: "minimalImpact", label: "We have backup, minimal impact" },
      ],
      required: true,
      impactLevel: "critical",
    },
  ],

  // SECTION 4: Energy Costs & Demand
  section4: [
    {
      id: "monthlyEnergySpend",
      question: "What's your approximate monthly energy spend?",
      type: "select",
      options: [
        { value: 5000, label: "Under $10,000" },
        { value: 17500, label: "$10,000 - $25,000" },
        { value: 50000, label: "$25,000 - $75,000" },
        { value: 112500, label: "$75,000 - $150,000" },
        { value: 325000, label: "$150,000 - $500,000" },
        { value: 750000, label: "Over $500,000" },
        { value: 0, label: "Prefer not to say" },
      ],
      impactLevel: "high",
    },
    {
      id: "demandChargeAwareness",
      question: "Do you know your demand charges?",
      type: "select",
      helpText: "Demand charges are based on your peak power usage, not total consumption",
      options: [
        { value: "dontKnow", label: "Don't know what demand charges are" },
        { value: "haveButUnknown", label: "We have them but don't know the amount" },
        { value: "knowPercent", label: "Roughly ___% of our bill" },
        { value: "knowAmount", label: "Approximately $___ /month" },
        { value: "none", label: "We don't have demand charges" },
      ],
      impactLevel: "high",
    },
    {
      id: "demandChargePercent",
      question: "Demand charges as % of bill",
      type: "slider",
      min: 0,
      max: 70,
      step: 5,
      unit: "%",
      showIf: { demandChargeAwareness: ["knowPercent"] },
      impactLevel: "high",
    },
    {
      id: "demandChargeAmount",
      question: "Monthly demand charges ($)",
      type: "number",
      min: 0,
      max: 500000,
      showIf: { demandChargeAwareness: ["knowAmount"] },
      impactLevel: "high",
    },
    {
      id: "demandIssues",
      question: "Do you have any of these demand issues?",
      type: "multiselect",
      options: [
        { value: "highDemandCharges", label: "High demand charges (>30% of bill)" },
        { value: "peakSpikes", label: "Peak spikes from equipment startup" },
        { value: "powerFactor", label: "Power factor penalties" },
        { value: "utilityPressure", label: "Utility asking us to reduce peak usage" },
        { value: "touRates", label: "Time-of-use rates hurting us" },
        { value: "capacityLimit", label: "Approaching service capacity limit" },
        { value: "noIssues", label: "No major issues" },
      ],
      impactLevel: "high",
    },
  ],

  // SECTION 5: Sustainability & Future
  section5: [
    {
      id: "energyGoals",
      question: "What are your energy goals?",
      type: "multiselect",
      options: [
        { value: "reduceCosts", label: "Reduce energy costs" },
        { value: "lowerDemand", label: "Lower demand charges" },
        { value: "improveReliability", label: "Improve power reliability" },
        { value: "reduceCarbon", label: "Reduce carbon footprint" },
        { value: "customerRequirements", label: "Meet customer sustainability requirements" },
        { value: "gridInstability", label: "Prepare for grid instability" },
        { value: "addRenewable", label: "Add renewable energy" },
        { value: "reduceDiesel", label: "Reduce diesel/fuel dependency" },
        { value: "incentives", label: "Qualify for incentives/rebates" },
      ],
      impactLevel: "medium",
    },
    {
      id: "sustainabilityTargets",
      question: "Do you have sustainability targets?",
      type: "select",
      options: [
        { value: "none", label: "No specific targets" },
        { value: "customerRequired", label: "Customer-required (Scope 3)" },
        { value: "corporate", label: "Corporate sustainability goals" },
        { value: "scienceBased", label: "Science-based targets" },
        { value: "netZero", label: "Net zero commitment" },
        { value: "iso50001", label: "ISO 50001 certification" },
      ],
      impactLevel: "medium",
    },
    {
      id: "solarPotential",
      question: "Do you have space for solar?",
      type: "select",
      options: [
        { value: "none", label: "No", description: "Urban, limited roof, structural issues" },
        { value: "rooftopOnly", label: "Rooftop only", description: "Building roof available" },
        {
          value: "rooftopParking",
          label: "Rooftop + parking",
          description: "Roof + canopy potential",
        },
        {
          value: "significantLand",
          label: "Significant land",
          description: "Ground mount possible",
        },
        {
          value: "largeCampus",
          label: "Large campus",
          description: "Multiple buildings, extensive options",
        },
      ],
      impactLevel: "medium",
    },
    {
      id: "expansionPlans",
      question: "Are you planning expansion or changes?",
      type: "multiselect",
      options: [
        { value: "addCapacity", label: "Adding production capacity" },
        { value: "newEquipment", label: "Adding new equipment" },
        { value: "electrifying", label: "Electrifying (replacing gas/fuel)" },
        { value: "evFleet", label: "Adding EV fleet/charging" },
        { value: "noChanges", label: "No major changes planned" },
      ],
      impactLevel: "medium",
    },
    {
      id: "expansionTimeframe",
      question: "Timeframe for changes",
      type: "select",
      showIf: { expansionPlans: ["addCapacity", "newEquipment", "electrifying", "evFleet"] },
      options: [
        { value: "1year", label: "Within 1 year" },
        { value: "3years", label: "Within 3 years" },
        { value: "5years", label: "Within 5 years" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 6: Priorities
  section6: [
    {
      id: "priorities",
      question: "Rank what matters most (Select top 3)",
      type: "ranking",
      maxSelections: 3,
      options: [
        {
          value: "reduceCosts",
          label: "Reduce energy costs",
          description: "Lower operating expenses",
        },
        { value: "cutDemand", label: "Cut demand charges", description: "Target peak power costs" },
        {
          value: "improveReliability",
          label: "Improve reliability",
          description: "Avoid production disruptions",
        },
        { value: "addBackup", label: "Add backup power", description: "Protect against outages" },
        {
          value: "sustainability",
          label: "Meet sustainability targets",
          description: "Customer or corporate requirements",
        },
        {
          value: "avoidCapex",
          label: "Avoid capital expense",
          description: "Prefer financing/leasing",
        },
        { value: "quickPayback", label: "Quick payback", description: "ROI within 3-5 years" },
        {
          value: "futureProof",
          label: "Future-proof for growth",
          description: "Build for expansion",
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

export interface ManufacturingInputs {
  manufacturingType: string;
  facilitySqFt: number;
  buildingCount?: string;
  productionSchedule: string;
  mainEquipment: string[];
  largeLoads?: string[];
  largeLoadCount?: number;
  electricalService: string;
  currentBackup: string[];
  generatorCapacity?: number;
  generatorCoverage?: string;
  outageImpact: string[];
  monthlyEnergySpend?: number;
  demandChargeAwareness?: string;
  demandChargePercent?: number;
  demandChargeAmount?: number;
  demandIssues?: string[];
  energyGoals?: string[];
  sustainabilityTargets?: string;
  solarPotential?: string;
  expansionPlans?: string[];
  priorities: string[];
}

export interface ManufacturingCalculations {
  // Load estimates
  estimatedPeakKw: number;
  estimatedAnnualKwh: number;
  estimatedAnnualSpend: number;
  demandChargeEstimate: number;

  // System recommendations
  recommendedBessKwh: number;
  recommendedSolarKw: number;
  recommendedGeneratorKw: number;

  // Savings
  annualSavings: number;
  demandChargeSavings: number;
  solarSavings: number;

  // Risk/value
  outageRiskCost: number; // Annual exposure

  // Confidence
  confidenceLevel: "low" | "medium" | "high";
  warnings: string[];
  recommendations: string[];
}

export function calculateManufacturingProfile(
  inputs: ManufacturingInputs
): ManufacturingCalculations {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Get manufacturing type profile
  const mfgType = MANUFACTURING_TYPES[inputs.manufacturingType as keyof typeof MANUFACTURING_TYPES];
  const schedule =
    PRODUCTION_SCHEDULES[inputs.productionSchedule as keyof typeof PRODUCTION_SCHEDULES];

  // Calculate base load from sq ft and type
  const kwhPerSqFt = mfgType?.defaultKwhPerSqFt || 40;
  const peakKwPer1000SqFt = mfgType?.peakKwPer1000SqFt || 5;

  let estimatedAnnualKwh = inputs.facilitySqFt * kwhPerSqFt;
  let estimatedPeakKw = (inputs.facilitySqFt / 1000) * peakKwPer1000SqFt;

  // Adjust for production schedule
  const loadFactor = schedule?.loadFactor || 0.5;
  estimatedAnnualKwh *= loadFactor / 0.5; // Normalize to 50% baseline

  // Large loads add to peak
  if (inputs.largeLoads && inputs.largeLoads.length > 0) {
    const largeLoadCount = inputs.largeLoadCount || inputs.largeLoads.length;

    if (inputs.largeLoads.includes("arcFurnace")) {
      estimatedPeakKw *= 2; // Arc furnaces dramatically increase peak
      warnings.push("Electric arc furnace creates extreme demand spikes — BESS essential");
    }
    if (inputs.largeLoads.includes("largeMotors")) {
      estimatedPeakKw += largeLoadCount * 150; // Add for motor inrush
      recommendations.push("BESS can reduce motor startup peaks by 50%+");
    }
  }

  // Demand issues
  if (inputs.demandIssues?.includes("highDemandCharges")) {
    recommendations.push("High demand charges indicate strong BESS ROI");
  }
  if (inputs.demandIssues?.includes("capacityLimit")) {
    recommendations.push("BESS can defer costly utility service upgrade");
    warnings.push("Approaching service limit — plan for capacity needs");
  }

  // Energy spend
  let estimatedAnnualSpend: number;
  if (inputs.monthlyEnergySpend && inputs.monthlyEnergySpend > 0) {
    estimatedAnnualSpend = inputs.monthlyEnergySpend * 12;
  } else {
    const energyRate = 0.08; // $/kWh industrial
    const demandRate = 12; // $/kW
    estimatedAnnualSpend = estimatedAnnualKwh * energyRate + estimatedPeakKw * demandRate * 12;
  }

  // Demand charges
  let demandChargeEstimate: number;
  if (inputs.demandChargeAmount && inputs.demandChargeAmount > 0) {
    demandChargeEstimate = inputs.demandChargeAmount * 12;
  } else if (inputs.demandChargePercent) {
    demandChargeEstimate = estimatedAnnualSpend * (inputs.demandChargePercent / 100);
  } else {
    demandChargeEstimate = estimatedAnnualSpend * 0.35; // 35% default
  }

  // BESS sizing
  // Based on peak shaving potential and outage protection needs
  let bessMultiplier = 1.0;

  if (
    inputs.outageImpact.includes("productRuined") ||
    inputs.outageImpact.includes("equipmentDamage")
  ) {
    bessMultiplier = 1.5;
    recommendations.push("Sizing BESS for extended outage protection due to high outage costs");
  }
  if (inputs.outageImpact.includes("safetyAffected")) {
    bessMultiplier = 2.0;
    warnings.push("Safety systems require reliable backup power");
  }

  const recommendedBessKwh = Math.round(estimatedPeakKw * 2 * bessMultiplier); // 2 hours baseline

  // Solar sizing
  let recommendedSolarKw = 0;
  if (inputs.solarPotential === "largeCampus") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.4);
  } else if (inputs.solarPotential === "significantLand") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.3);
  } else if (inputs.solarPotential === "rooftopParking") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.2);
  } else if (inputs.solarPotential === "rooftopOnly") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.1);
  }

  // Generator sizing
  let generatorMultiplier = 0.5; // 50% of load baseline
  if (inputs.generatorCoverage === "fullPlant") generatorMultiplier = 1.0;
  if (inputs.priorities.includes("improveReliability") || inputs.priorities.includes("addBackup")) {
    generatorMultiplier = Math.max(generatorMultiplier, 0.75);
  }

  const recommendedGeneratorKw =
    inputs.generatorCapacity || Math.round(estimatedPeakKw * generatorMultiplier);

  // Savings calculations
  const demandChargeSavings = Math.round(demandChargeEstimate * 0.4); // 40% reduction
  const solarSavings = Math.round(recommendedSolarKw * 400); // SSOT: $400/kW (DEFAULTS.Preview.solarSavingsPerKW)
  const annualSavings = demandChargeSavings + solarSavings;

  // Outage risk cost
  let outageRiskCost = 0;
  const avgOutagesPerYear = 4;
  const avgOutageHours = 3;

  for (const impact of inputs.outageImpact) {
    const impactData = OUTAGE_IMPACTS[impact as keyof typeof OUTAGE_IMPACTS];
    if (impactData) {
      outageRiskCost += impactData.costPerHour * avgOutageHours * avgOutagesPerYear;
    }
  }

  // Confidence level
  let confidenceLevel: "low" | "medium" | "high" = "medium";
  if (inputs.monthlyEnergySpend && inputs.monthlyEnergySpend > 0 && inputs.demandChargeAmount) {
    confidenceLevel = "high";
  }
  if (inputs.electricalService === "notSure" && !inputs.monthlyEnergySpend) {
    confidenceLevel = "low";
  }

  return {
    estimatedPeakKw: Math.round(estimatedPeakKw),
    estimatedAnnualKwh: Math.round(estimatedAnnualKwh),
    estimatedAnnualSpend: Math.round(estimatedAnnualSpend),
    demandChargeEstimate: Math.round(demandChargeEstimate),
    recommendedBessKwh,
    recommendedSolarKw,
    recommendedGeneratorKw,
    annualSavings,
    demandChargeSavings,
    solarSavings,
    outageRiskCost: Math.round(outageRiskCost),
    confidenceLevel,
    warnings,
    recommendations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQuestionsForManufacturing(manufacturingType?: string) {
  return MANUFACTURING_QUESTIONS;
}

export default {
  MANUFACTURING_TYPES,
  FACILITY_SIZES,
  PRODUCTION_SCHEDULES,
  EQUIPMENT_CATEGORIES,
  LARGE_LOADS,
  OUTAGE_IMPACTS,
  MANUFACTURING_QUESTIONS,
  calculateManufacturingProfile,
  getQuestionsForManufacturing,
};
