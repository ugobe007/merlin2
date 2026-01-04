/**
 * DATA CENTER INDUSTRY PROFILE
 * ============================
 *
 * Data-driven sizing calculations and question tiers for Data Centers.
 * Based on industry workup by Bob Christopher & Vineet Kapila, December 2025.
 *
 * KEY INSIGHT: Users think in RACKS and UPTIME, not kW and PUE. We translate.
 *
 * KEY SIZING DRIVERS:
 * 1. Rack Count - Primary load driver
 * 2. Workload Type - Standard (5-8 kW/rack) vs AI/GPU (30-80 kW/rack) = 10x difference
 * 3. Uptime Requirements - Determines backup sizing
 * 4. Cooling Method - 30-50% of total load, drives PUE
 * 5. Expansion Plans - Right-size for growth
 *
 * USER TYPES:
 * - IT Director / CTO: Knows racks, workload, uptime SLA
 * - Facilities Manager: Knows power, cooling, generators
 * - Real Estate / Developer: Knows building specs, budget
 * - Colo Operator: Full specs, customer mix
 */

// ============================================================================
// FACILITY TYPE PROFILES
// ============================================================================

export const DATACENTER_PROFILES = {
  serverRoom: {
    label: "Server Room",
    description: "IT closet or small dedicated room",
    youMightBe: "Small business, branch office",

    typicalRacks: { min: 2, max: 10 },
    typicalKwPerRack: 5,
    typicalPUE: 1.8,

    typicalPeakKw: { min: 10, max: 50 },
    typicalAnnualKwh: { min: 87600, max: 438000 },

    bessKwh: { min: 20, max: 100 },
    solarKw: { min: 0, max: 25 },
    generatorKw: { min: 15, max: 75 },

    questionTier: 1,
    questionsShown: 8,
  },

  edgeSite: {
    label: "Edge Site",
    description: "Remote location, minimal staff",
    youMightBe: "Retail, telecom, IoT",

    typicalRacks: { min: 2, max: 20 },
    typicalKwPerRack: 6,
    typicalPUE: 1.6,

    typicalPeakKw: { min: 12, max: 120 },
    typicalAnnualKwh: { min: 105000, max: 1050000 },

    bessKwh: { min: 50, max: 250 },
    solarKw: { min: 10, max: 50 },
    generatorKw: { min: 25, max: 150 },

    questionTier: 1,
    questionsShown: 10,
  },

  enterprise: {
    label: "Enterprise Data Center",
    description: "Company-owned, single tenant",
    youMightBe: "Mid-large corporation",

    typicalRacks: { min: 20, max: 200 },
    typicalKwPerRack: 8,
    typicalPUE: 1.5,

    typicalPeakKw: { min: 240, max: 2400 },
    typicalAnnualKwh: { min: 2100000, max: 21000000 },

    bessKwh: { min: 500, max: 5000 },
    solarKw: { min: 100, max: 1000 },
    generatorKw: { min: 300, max: 3000 },

    questionTier: 2,
    questionsShown: 13,
  },

  colocation: {
    label: "Colocation",
    description: "Multi-tenant, you lease space",
    youMightBe: "Colo provider or tenant",

    typicalRacks: { min: 50, max: 500 },
    typicalKwPerRack: 10,
    typicalPUE: 1.4,

    typicalPeakKw: { min: 700, max: 7000 },
    typicalAnnualKwh: { min: 6130000, max: 61300000 },

    bessKwh: { min: 1500, max: 15000 },
    solarKw: { min: 250, max: 2500 },
    generatorKw: { min: 1000, max: 10000 },

    questionTier: 3,
    questionsShown: 15,
  },

  newBuild: {
    label: "New Build / Planned",
    description: "Not yet constructed",
    youMightBe: "Developer, expanding company",

    typicalRacks: { min: 20, max: 500 },
    typicalKwPerRack: 12, // Design for higher density
    typicalPUE: 1.3, // Modern design target

    typicalPeakKw: { min: 312, max: 7800 },
    typicalAnnualKwh: { min: 2700000, max: 68000000 },

    bessKwh: { min: 500, max: 20000 },
    solarKw: { min: 200, max: 3000 },
    generatorKw: { min: 400, max: 10000 },

    questionTier: 3,
    questionsShown: 17,
  },
};

// ============================================================================
// WORKLOAD TYPE POWER PROFILES
// ============================================================================

export const WORKLOAD_TYPES = {
  standard: {
    label: "Standard IT",
    description: "Email, file servers, databases, web",
    kwPerRack: { min: 5, max: 8 },
    defaultKwPerRack: 6,
    examples: ["Email servers", "File storage", "Databases", "Web servers"],
  },

  virtualized: {
    label: "Virtualized / Cloud",
    description: "VMs, containers, consolidated workloads",
    kwPerRack: { min: 8, max: 15 },
    defaultKwPerRack: 10,
    examples: ["VMware", "Kubernetes", "Private cloud", "Consolidated workloads"],
  },

  highPerformance: {
    label: "High Performance",
    description: "Scientific computing, rendering, simulations",
    kwPerRack: { min: 15, max: 25 },
    defaultKwPerRack: 20,
    examples: ["HPC clusters", "Rendering farms", "Simulations", "Research"],
  },

  aiGpu: {
    label: "AI / GPU Intensive",
    description: "Machine learning training, inference",
    kwPerRack: { min: 30, max: 80 },
    defaultKwPerRack: 50,
    examples: ["ML training", "AI inference", "GPU clusters", "Deep learning"],
    requiresLiquidCooling: true,
  },

  mixed: {
    label: "Mixed Environment",
    description: "Combination of above",
    kwPerRack: { min: 8, max: 30 },
    defaultKwPerRack: 12,
    requiresBreakdown: true, // Need Q4b to specify GPU rack count
  },
};

// ============================================================================
// CRITICALITY / UPTIME LEVELS
// ============================================================================

export const CRITICALITY_LEVELS = {
  devTest: {
    label: "Development / Test",
    acceptableDowntime: "Hours to days",
    examples: ["Dev servers", "Staging", "Backups"],
    backupHours: 0.5, // 30 min graceful shutdown
    redundancy: "N",
  },

  businessOps: {
    label: "Business Operations",
    acceptableDowntime: "Few hours",
    examples: ["Internal apps", "Email", "File shares"],
    backupHours: 2,
    redundancy: "N",
  },

  customerFacing: {
    label: "Customer-Facing",
    acceptableDowntime: "Minutes to 1 hour",
    examples: ["E-commerce", "SaaS", "Customer portals"],
    backupHours: 4,
    redundancy: "N+1",
  },

  missionCritical: {
    label: "Mission Critical",
    acceptableDowntime: "Minutes only",
    examples: ["Financial", "Healthcare", "911", "Core infrastructure"],
    backupHours: 8,
    redundancy: "N+1",
  },

  zeroTolerance: {
    label: "Zero Tolerance",
    acceptableDowntime: "Seconds",
    examples: ["Trading systems", "Life safety", "Critical infrastructure"],
    backupHours: 24,
    redundancy: "2N",
  },
};

// ============================================================================
// COOLING METHODS
// ============================================================================

export const COOLING_METHODS = {
  standardAC: {
    label: "Standard AC / CRAC units",
    efficiency: "Lower",
    pueImpact: 1.8,
    notes: "Traditional, most common",
  },

  hotColdAisle: {
    label: "Hot/cold aisle containment",
    efficiency: "Better",
    pueImpact: 1.5,
    notes: "Organized airflow",
  },

  economizer: {
    label: "Economizer / Free cooling",
    efficiency: "Good",
    pueImpact: 1.4,
    notes: "Uses outside air when possible",
  },

  inRow: {
    label: "In-row or rear-door cooling",
    efficiency: "Better",
    pueImpact: 1.35,
    notes: "Closer to heat source",
  },

  directLiquid: {
    label: "Direct liquid cooling",
    efficiency: "Best",
    pueImpact: 1.2,
    notes: "Required for high-density AI",
  },

  immersion: {
    label: "Immersion cooling",
    efficiency: "Best",
    pueImpact: 1.1,
    notes: "Cutting edge, AI-focused",
  },

  notSure: {
    label: "Not sure / New build",
    efficiency: "TBD",
    pueImpact: 1.5, // Conservative estimate
    notes: "We'll recommend",
  },
};

// ============================================================================
// PUE (Power Usage Effectiveness)
// ============================================================================

export const PUE_RANGES = {
  unknown: {
    label: "Don't know / Not built yet",
    pue: 1.5,
    description: "We'll estimate based on cooling",
  },
  typical: { label: "Typical (1.5 - 1.8)", pue: 1.65, description: "Average existing facility" },
  good: { label: "Good (1.3 - 1.5)", pue: 1.4, description: "Well-optimized" },
  excellent: { label: "Excellent (1.2 - 1.3)", pue: 1.25, description: "Modern, efficient design" },
  bestInClass: {
    label: "Best in class (under 1.2)",
    pue: 1.15,
    description: "Hyperscale-level efficiency",
  },
};

// ============================================================================
// BACKUP POWER OPTIONS
// ============================================================================

export const BACKUP_OPTIONS = {
  none: { label: "None — grid only", hasUPS: false, hasGenerator: false },
  upsOnly: { label: "UPS only (batteries for 10-30 min)", hasUPS: true, hasGenerator: false },
  upsDiesel: {
    label: "UPS + Diesel generator",
    hasUPS: true,
    hasGenerator: true,
    fuelType: "diesel",
  },
  upsNaturalGas: {
    label: "UPS + Natural gas generator",
    hasUPS: true,
    hasGenerator: true,
    fuelType: "naturalGas",
  },
  upsBess: { label: "UPS + BESS (battery system)", hasUPS: true, hasBESS: true },
  fullRedundant: {
    label: "Full redundant backup (N+1 or 2N)",
    hasUPS: true,
    hasGenerator: true,
    redundant: true,
  },
  notSure: { label: "Not sure", hasUPS: null, hasGenerator: null },
};

export const BACKUP_CAPABILITY_TARGETS = {
  gracefulShutdown: {
    label: "Graceful shutdown",
    hours: 0.5,
    description: "15-30 minutes to safely power down",
  },
  rideThrough: {
    label: "Ride through typical outages",
    hours: 4,
    description: "2-4 hours covers 95% of grid events",
  },
  extended: {
    label: "Extended operation",
    hours: 12,
    description: "8-24 hours for longer outages",
  },
  fullIndependence: {
    label: "Full independence",
    hours: 48,
    description: "24-72+ hours, minimal grid reliance",
  },
};

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const DATACENTER_QUESTIONS = {
  // SECTION 1: Your Facility
  section1: [
    {
      id: "facilityType",
      question: "What best describes your data center?",
      type: "select",
      options: [
        {
          value: "serverRoom",
          label: "Server Room",
          description: "IT closet or small dedicated room",
          youMightBe: "Small business, branch office",
        },
        {
          value: "edgeSite",
          label: "Edge Site",
          description: "Remote location, minimal staff",
          youMightBe: "Retail, telecom, IoT",
        },
        {
          value: "enterprise",
          label: "Enterprise Data Center",
          description: "Company-owned, single tenant",
          youMightBe: "Mid-large corporation",
        },
        {
          value: "colocation",
          label: "Colocation",
          description: "Multi-tenant, you lease space",
          youMightBe: "Colo provider or tenant",
        },
        {
          value: "newBuild",
          label: "New Build / Planned",
          description: "Not yet constructed",
          youMightBe: "Developer, expanding company",
        },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "location",
      question: "Where is this facility located?",
      type: "location",
      helpText: "Affects grid reliability, utility rates, and regulations",
      required: true,
      impactLevel: "high",
    },
  ],

  // SECTION 2: Your IT Load
  section2: [
    {
      id: "rackCount",
      question: "How many racks do you have (or plan)?",
      type: "slider",
      min: 2,
      max: 500,
      step: 1,
      default: 20,
      presets: [
        { value: 10, label: "Small (5-20)", description: "Server room, edge" },
        { value: 35, label: "Medium (20-50)", description: "Small data center" },
        { value: 100, label: "Large (50-200)", description: "Enterprise" },
        { value: 300, label: "Very Large (200-500)", description: "Large enterprise, colo" },
        { value: 500, label: "Massive (500+)", description: "Hyperscale" },
      ],
      required: true,
      impactLevel: "critical",
      alternativeInput: {
        label: "I know my IT load",
        type: "number",
        unit: "kW or MW",
      },
    },
    {
      id: "workloadType",
      question: "What type of computing do you run?",
      type: "select",
      helpText: "This dramatically affects power per rack",
      options: [
        {
          value: "standard",
          label: "Standard IT",
          description: "Email, file servers, databases, web",
          powerImpact: "5-8 kW/rack",
        },
        {
          value: "virtualized",
          label: "Virtualized / Cloud",
          description: "VMs, containers, consolidated workloads",
          powerImpact: "8-15 kW/rack",
        },
        {
          value: "highPerformance",
          label: "High Performance",
          description: "Scientific computing, rendering, simulations",
          powerImpact: "15-25 kW/rack",
        },
        {
          value: "aiGpu",
          label: "AI / GPU Intensive",
          description: "Machine learning training, inference",
          powerImpact: "30-80 kW/rack",
        },
        {
          value: "mixed",
          label: "Mixed Environment",
          description: "Combination of above",
          powerImpact: "We'll calculate",
        },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "gpuRackCount",
      question: "How many racks are high-density (AI/GPU)?",
      type: "slider",
      min: 0,
      max: 500, // Will be capped to rackCount
      step: 1,
      showIf: { workloadType: ["aiGpu", "mixed"] },
      impactLevel: "critical",
    },
    {
      id: "gpuPowerLevel",
      question: "Power per GPU rack",
      type: "select",
      options: [
        { value: 40, label: "30-50 kW", description: "Standard GPU servers" },
        { value: 65, label: "50-80 kW", description: "High-density GPU" },
        { value: 100, label: "80+ kW", description: "Maximum density AI" },
      ],
      default: 40,
      showIf: { workloadType: ["aiGpu", "mixed"] },
      impactLevel: "high",
    },
  ],

  // SECTION 3: Uptime Requirements
  section3: [
    {
      id: "criticality",
      question: "How critical is this facility?",
      type: "select",
      helpText: "Think about: What happens if it goes down?",
      options: [
        {
          value: "devTest",
          label: "Development / Test",
          downtime: "Hours to days",
          examples: "Dev servers, staging, backups",
        },
        {
          value: "businessOps",
          label: "Business Operations",
          downtime: "Few hours",
          examples: "Internal apps, email",
        },
        {
          value: "customerFacing",
          label: "Customer-Facing",
          downtime: "Minutes to 1 hour",
          examples: "E-commerce, SaaS",
        },
        {
          value: "missionCritical",
          label: "Mission Critical",
          downtime: "Minutes only",
          examples: "Financial, healthcare, 911",
        },
        {
          value: "zeroTolerance",
          label: "Zero Tolerance",
          downtime: "Seconds",
          examples: "Trading systems, life safety",
        },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "currentBackup",
      question: "What's your backup power situation today?",
      type: "multiselect",
      options: [
        { value: "none", label: "None — grid only" },
        { value: "upsOnly", label: "UPS only (batteries for 10-30 min)" },
        { value: "upsDiesel", label: "UPS + Diesel generator" },
        { value: "upsNaturalGas", label: "UPS + Natural gas generator" },
        { value: "upsBess", label: "UPS + BESS (battery system)" },
        { value: "fullRedundant", label: "Full redundant backup (N+1 or 2N)" },
        { value: "notSure", label: "Not sure" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "generatorFuel",
      question: "Generator fuel type",
      type: "select",
      options: [
        { value: "diesel", label: "Diesel" },
        { value: "naturalGas", label: "Natural Gas" },
        { value: "propane", label: "Propane" },
        { value: "biFuel", label: "Bi-fuel" },
      ],
      showIf: { currentBackup: ["upsDiesel", "upsNaturalGas", "fullRedundant"] },
      impactLevel: "medium",
    },
    {
      id: "generatorCapacityKw",
      question: "Generator capacity (kW)",
      type: "number",
      min: 0,
      max: 50000,
      optional: true,
      showIf: { currentBackup: ["upsDiesel", "upsNaturalGas", "fullRedundant"] },
      impactLevel: "medium",
    },
    {
      id: "generatorRuntimeHours",
      question: "How long can you run on generator?",
      type: "number",
      min: 0,
      max: 168,
      unit: "hours",
      optional: true,
      showIf: { currentBackup: ["upsDiesel", "upsNaturalGas", "fullRedundant"] },
      impactLevel: "medium",
    },
    {
      id: "backupTarget",
      question: "What backup capability do you WANT?",
      type: "select",
      options: [
        {
          value: "gracefulShutdown",
          label: "Graceful shutdown",
          description: "15-30 minutes to safely power down",
        },
        {
          value: "rideThrough",
          label: "Ride through typical outages",
          description: "2-4 hours covers 95% of grid events",
        },
        {
          value: "extended",
          label: "Extended operation",
          description: "8-24 hours for longer outages",
        },
        {
          value: "fullIndependence",
          label: "Full independence",
          description: "24-72+ hours, minimal grid reliance",
        },
      ],
      required: true,
      impactLevel: "critical",
    },
  ],

  // SECTION 4: Cooling & Efficiency
  section4: [
    {
      id: "coolingMethod",
      question: "How is your facility cooled?",
      type: "select",
      options: [
        {
          value: "standardAC",
          label: "Standard AC / CRAC units",
          efficiency: "Lower",
          notes: "Traditional, most common",
        },
        {
          value: "hotColdAisle",
          label: "Hot/cold aisle containment",
          efficiency: "Better",
          notes: "Organized airflow",
        },
        {
          value: "economizer",
          label: "Economizer / Free cooling",
          efficiency: "Good",
          notes: "Uses outside air when possible",
        },
        {
          value: "inRow",
          label: "In-row or rear-door cooling",
          efficiency: "Better",
          notes: "Closer to heat source",
        },
        {
          value: "directLiquid",
          label: "Direct liquid cooling",
          efficiency: "Best",
          notes: "Required for high-density AI",
        },
        {
          value: "immersion",
          label: "Immersion cooling",
          efficiency: "Best",
          notes: "Cutting edge, AI-focused",
        },
        {
          value: "notSure",
          label: "Not sure / New build",
          efficiency: "TBD",
          notes: "We'll recommend",
        },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "pueLevel",
      question: "Do you know your PUE?",
      type: "select",
      helpText: "PUE = Total facility power ÷ IT equipment power. Lower is better.",
      options: [
        { value: "unknown", label: "Don't know / Not built yet" },
        {
          value: "typical",
          label: "Typical (1.5 - 1.8)",
          description: "Average existing facility",
        },
        { value: "good", label: "Good (1.3 - 1.5)", description: "Well-optimized" },
        {
          value: "excellent",
          label: "Excellent (1.2 - 1.3)",
          description: "Modern, efficient design",
        },
        {
          value: "bestInClass",
          label: "Best in class (under 1.2)",
          description: "Hyperscale-level efficiency",
        },
      ],
      impactLevel: "high",
    },
    {
      id: "pueCustom",
      question: "Enter your measured/target PUE",
      type: "number",
      min: 1.0,
      max: 3.0,
      step: 0.05,
      optional: true,
      impactLevel: "high",
    },
  ],

  // SECTION 5: Sustainability & Future
  section5: [
    {
      id: "sustainabilityGoals",
      question: "What are your sustainability goals?",
      type: "multiselect",
      options: [
        { value: "reduceEnergyCosts", label: "Reduce energy costs" },
        { value: "lowerCarbon", label: "Lower carbon footprint" },
        { value: "esgTargets", label: "Meet corporate ESG targets" },
        { value: "reduceDiesel", label: "Reduce diesel dependency" },
        { value: "renewableTarget", label: "Achieve renewable energy target" },
        { value: "prepareRegulations", label: "Prepare for regulations" },
        { value: "none", label: "No specific sustainability goals" },
      ],
      impactLevel: "medium",
    },
    {
      id: "solarPotential",
      question: "Do you have space for on-site solar?",
      type: "select",
      options: [
        { value: "none", label: "No", description: "Urban location, small roof, shading issues" },
        { value: "limited", label: "Limited", description: "Rooftop only, under 10,000 sq ft" },
        { value: "moderate", label: "Moderate", description: "Rooftop 10,000-50,000 sq ft" },
        {
          value: "significant",
          label: "Significant",
          description: "Large roof or adjacent land, 50,000+ sq ft",
        },
        { value: "notSure", label: "Not sure", description: "We can assess" },
      ],
      impactLevel: "medium",
    },
    {
      id: "expansionPlan",
      question: "Are you planning to expand?",
      type: "select",
      options: [
        { value: "none", label: "No expansion planned" },
        { value: "1year", label: "Within 1 year" },
        { value: "3years", label: "Within 3 years" },
        { value: "5years", label: "Within 5 years" },
      ],
      impactLevel: "medium",
    },
    {
      id: "expansionAmount",
      question: "Additional capacity",
      type: "select",
      showIf: { expansionPlan: ["1year", "3years", "5years"] },
      options: [
        { value: 25, label: "+25%" },
        { value: 50, label: "+50%" },
        { value: 100, label: "+100% (double)" },
        { value: 200, label: "+200% or more" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 6: Your Priorities
  section6: [
    {
      id: "priorities",
      question: "Rank what matters most to you (select top 3)",
      type: "multiselect",
      maxSelections: 3,
      options: [
        { value: "uptime", label: "Uptime / Reliability", why: "Can't afford any downtime" },
        {
          value: "costReduction",
          label: "Energy cost reduction",
          why: "Operating costs are a concern",
        },
        {
          value: "reduceDiesel",
          label: "Reduce diesel reliance",
          why: "Regulations, ESG, or fuel logistics",
        },
        {
          value: "sustainability",
          label: "Sustainability / Carbon",
          why: "Corporate commitments, customer demands",
        },
        {
          value: "avoidCapex",
          label: "Avoid capital expense",
          why: "Prefer OpEx, leasing, or financing",
        },
        { value: "futureProof", label: "Future-proof for growth", why: "Building for expansion" },
        { value: "speed", label: "Speed of deployment", why: "Need solution fast" },
      ],
      required: true,
      impactLevel: "high",
    },
  ],

  // SECTION 7: Advanced Details (Optional)
  section7: [
    {
      id: "gridReliability",
      question: "What's your grid situation?",
      type: "select",
      options: [
        {
          value: "reliable",
          label: "Reliable",
          description: "Under 4 outages/year, short duration",
        },
        { value: "average", label: "Average", description: "4-12 outages/year" },
        {
          value: "challenging",
          label: "Challenging",
          description: "Frequent outages, rural, constrained",
        },
        { value: "newConnection", label: "New connection pending" },
      ],
      optional: true,
      impactLevel: "medium",
    },
    {
      id: "dieselRestrictions",
      question: "Any diesel restrictions in your area?",
      type: "select",
      options: [
        { value: "none", label: "No restrictions" },
        { value: "runtimeLimits", label: "Runtime limits (e.g., California 50 hr/year)" },
        { value: "emissionsReporting", label: "Emissions reporting required" },
        { value: "eliminatingDiesel", label: "Planning to eliminate diesel" },
        { value: "notSure", label: "Not sure" },
      ],
      optional: true,
      impactLevel: "medium",
    },
    {
      id: "monthlyEnergySpend",
      question: "Current monthly energy spend?",
      type: "select",
      options: [
        { value: 25000, label: "Under $25,000" },
        { value: 62500, label: "$25,000 - $100,000" },
        { value: 300000, label: "$100,000 - $500,000" },
        { value: 750000, label: "$500,000 - $1,000,000" },
        { value: 1500000, label: "Over $1,000,000" },
        { value: 0, label: "Prefer not to say" },
      ],
      optional: true,
      impactLevel: "high",
    },
  ],
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export interface DataCenterInputs {
  facilityType: string;
  location?: { country?: string; state?: string; zip?: string };
  rackCount: number;
  workloadType: string;
  gpuRackCount?: number;
  gpuPowerLevel?: number;
  criticality: string;
  currentBackup: string[];
  generatorFuel?: string;
  generatorCapacityKw?: number;
  generatorRuntimeHours?: number;
  backupTarget: string;
  coolingMethod: string;
  pueLevel?: string;
  pueCustom?: number;
  sustainabilityGoals?: string[];
  solarPotential?: string;
  expansionPlan?: string;
  expansionAmount?: number;
  priorities: string[];
  gridReliability?: string;
  dieselRestrictions?: string;
  monthlyEnergySpend?: number;
}

export interface DataCenterCalculations {
  // Load calculations
  itLoadKw: number;
  totalFacilityLoadKw: number;
  annualKwh: number;
  pueUsed: number;

  // System recommendations
  recommendedBessKwh: number;
  recommendedSolarKw: number;
  recommendedGeneratorKw: number;

  // Backup analysis
  currentBackupHours: number;
  targetBackupHours: number;
  bessBackupHours: number;

  // Cost analysis
  estimatedAnnualSpend: number;
  annualSavings: number;
  demandChargeSavings: number;

  // Expansion
  futureLoadKw: number;
  systemSizedForGrowth: boolean;

  // Confidence
  confidenceLevel: "low" | "medium" | "high";
  warnings: string[];
  recommendations: string[];
}

export function calculateDataCenterProfile(inputs: DataCenterInputs): DataCenterCalculations {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Get workload power density
  const workload = WORKLOAD_TYPES[inputs.workloadType as keyof typeof WORKLOAD_TYPES];
  const kwPerRack = workload?.defaultKwPerRack || 8;

  // Handle mixed/GPU workloads
  let itLoadKw: number;
  if (inputs.workloadType === "aiGpu" || inputs.workloadType === "mixed") {
    const gpuRacks = inputs.gpuRackCount || 0;
    const standardRacks = inputs.rackCount - gpuRacks;
    const gpuKwPerRack = inputs.gpuPowerLevel || 50;

    itLoadKw = standardRacks * 8 + gpuRacks * gpuKwPerRack;

    if (
      gpuRacks > 0 &&
      inputs.coolingMethod !== "directLiquid" &&
      inputs.coolingMethod !== "immersion"
    ) {
      warnings.push("High-density GPU racks typically require liquid or immersion cooling");
    }
  } else {
    itLoadKw = inputs.rackCount * kwPerRack;
  }

  // Determine PUE
  let pueUsed: number;
  if (inputs.pueCustom) {
    pueUsed = inputs.pueCustom;
  } else if (inputs.pueLevel && PUE_RANGES[inputs.pueLevel as keyof typeof PUE_RANGES]) {
    pueUsed = PUE_RANGES[inputs.pueLevel as keyof typeof PUE_RANGES].pue;
  } else if (
    inputs.coolingMethod &&
    COOLING_METHODS[inputs.coolingMethod as keyof typeof COOLING_METHODS]
  ) {
    pueUsed = COOLING_METHODS[inputs.coolingMethod as keyof typeof COOLING_METHODS].pueImpact;
  } else {
    pueUsed = 1.5; // Conservative default
  }

  // Total facility load
  const totalFacilityLoadKw = Math.round(itLoadKw * pueUsed);
  const annualKwh = totalFacilityLoadKw * 8760; // 24/7 operation

  // Backup target hours
  const backupTarget =
    BACKUP_CAPABILITY_TARGETS[inputs.backupTarget as keyof typeof BACKUP_CAPABILITY_TARGETS];
  const targetBackupHours = backupTarget?.hours || 4;

  // Current backup assessment
  let currentBackupHours = 0;
  if (inputs.currentBackup.includes("upsOnly")) currentBackupHours = 0.5;
  if (
    inputs.currentBackup.includes("upsDiesel") ||
    inputs.currentBackup.includes("upsNaturalGas")
  ) {
    currentBackupHours = inputs.generatorRuntimeHours || 8;
  }
  if (inputs.currentBackup.includes("upsBess")) currentBackupHours = 4;
  if (inputs.currentBackup.includes("fullRedundant")) currentBackupHours = 24;

  // BESS sizing
  // Size for backup duration + peak shaving
  const bessForBackup = totalFacilityLoadKw * targetBackupHours;
  const bessForPeakShaving = totalFacilityLoadKw * 0.5; // 30 min of peak shaving
  let recommendedBessKwh = Math.round(Math.max(bessForBackup, bessForPeakShaving));

  // Calculate BESS backup hours
  const bessBackupHours = recommendedBessKwh / totalFacilityLoadKw;

  // Expansion planning
  let futureLoadKw = totalFacilityLoadKw;
  let systemSizedForGrowth = false;
  if (inputs.expansionPlan && inputs.expansionPlan !== "none" && inputs.expansionAmount) {
    futureLoadKw = Math.round(totalFacilityLoadKw * (1 + inputs.expansionAmount / 100));
    recommendedBessKwh = Math.round(recommendedBessKwh * (1 + inputs.expansionAmount / 100));
    systemSizedForGrowth = true;
    recommendations.push(`System sized for ${inputs.expansionAmount}% growth`);
  }

  // Solar sizing
  let recommendedSolarKw = 0;
  if (inputs.solarPotential === "significant") {
    recommendedSolarKw = Math.round(totalFacilityLoadKw * 0.2); // 20% offset
  } else if (inputs.solarPotential === "moderate") {
    recommendedSolarKw = Math.round(totalFacilityLoadKw * 0.1);
  } else if (inputs.solarPotential === "limited") {
    recommendedSolarKw = Math.round(totalFacilityLoadKw * 0.05);
  }

  // Generator sizing
  const criticality = CRITICALITY_LEVELS[inputs.criticality as keyof typeof CRITICALITY_LEVELS];
  let generatorMultiplier = 1.0;
  if (criticality?.redundancy === "2N") generatorMultiplier = 2.0;
  else if (criticality?.redundancy === "N+1") generatorMultiplier = 1.25;

  const recommendedGeneratorKw = Math.round(totalFacilityLoadKw * generatorMultiplier);

  // Cost estimates
  const energyRate = 0.1; // $/kWh
  const demandRate = 15; // $/kW
  const estimatedAnnualSpend = inputs.monthlyEnergySpend
    ? inputs.monthlyEnergySpend * 12
    : annualKwh * energyRate + totalFacilityLoadKw * demandRate * 12;

  // Savings
  const demandChargeSavings = Math.round(totalFacilityLoadKw * demandRate * 12 * 0.3); // 30% reduction
  const solarSavings = Math.round(recommendedSolarKw * 400);
  const annualSavings = demandChargeSavings + solarSavings;

  // Diesel restrictions warning
  if (
    inputs.dieselRestrictions === "runtimeLimits" ||
    inputs.dieselRestrictions === "eliminatingDiesel"
  ) {
    recommendations.push("BESS can reduce diesel runtime and help meet regulatory requirements");
  }

  // Priority-based recommendations
  if (inputs.priorities.includes("uptime")) {
    recommendations.push("Sizing BESS for maximum reliability");
  }
  if (inputs.priorities.includes("reduceDiesel")) {
    recommendations.push("BESS can replace diesel for routine outages, reducing runtime 80%+");
  }

  // Confidence level
  let confidenceLevel: "low" | "medium" | "high" = "medium";
  if (inputs.monthlyEnergySpend && inputs.pueCustom) {
    confidenceLevel = "high";
  }
  if (!inputs.rackCount || (inputs.workloadType === "mixed" && !inputs.gpuRackCount)) {
    confidenceLevel = "low";
  }

  return {
    itLoadKw: Math.round(itLoadKw),
    totalFacilityLoadKw,
    annualKwh,
    pueUsed,
    recommendedBessKwh,
    recommendedSolarKw,
    recommendedGeneratorKw,
    currentBackupHours,
    targetBackupHours,
    bessBackupHours: Math.round(bessBackupHours * 10) / 10,
    estimatedAnnualSpend: Math.round(estimatedAnnualSpend),
    annualSavings,
    demandChargeSavings,
    futureLoadKw,
    systemSizedForGrowth,
    confidenceLevel,
    warnings,
    recommendations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQuestionsForDataCenter(facilityType?: string) {
  return DATACENTER_QUESTIONS;
}

export default {
  DATACENTER_PROFILES,
  WORKLOAD_TYPES,
  CRITICALITY_LEVELS,
  COOLING_METHODS,
  PUE_RANGES,
  BACKUP_OPTIONS,
  BACKUP_CAPABILITY_TARGETS,
  DATACENTER_QUESTIONS,
  calculateDataCenterProfile,
  getQuestionsForDataCenter,
};
