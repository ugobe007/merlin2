/**
 * OFFICE BUILDING INDUSTRY PROFILE
 * =================================
 *
 * Data-driven sizing calculations and question tiers for Office Buildings.
 * Based on industry workup by Bob Christopher & Vineet Kapila, December 2025.
 *
 * KEY INSIGHT: Office buildings are HVAC-dominated — 40-60% of load is heating/cooling.
 * Occupancy patterns post-COVID have shifted dramatically.
 *
 * KEY SIZING DRIVERS:
 * 1. Building Type & Class - Class A Trophy vs Class C = 2x difference
 * 2. HVAC System - Central plant vs RTUs, age matters
 * 3. Occupancy - Post-COVID hybrid = 40-70% of pre-pandemic
 * 4. Tenant Mix - 24/7 tenants, data centers change profile
 * 5. Lease Structure - NNN vs Gross determines who benefits
 *
 * UNIQUE FACTORS:
 * - Core hours (8 AM - 6 PM) = peak, evenings/weekends = base
 * - Elevator backup is critical for high-rise
 * - EV charging is growing tenant amenity expectation
 * - Building performance standards driving upgrades
 */

// ============================================================================
// OFFICE BUILDING SUB-TYPES
// ============================================================================

export const OFFICE_TYPES = {
  smallOffice: {
    label: "Small Office",
    description: "1-3 stories, under 25,000 sq ft",

    typicalSqFt: { min: 5000, max: 25000 },
    typicalFloors: { min: 1, max: 3 },
    kwhPerSqFtYear: { min: 12, max: 20 },
    defaultKwhPerSqFt: 16,

    typicalPeakKw: { min: 25, max: 125 },
    typicalAnnualKwh: { min: 75000, max: 400000 },

    bessKwh: { min: 50, max: 200 },
    solarKw: { min: 25, max: 100 },
    generatorKw: { min: 25, max: 75 },

    hvacPercent: 45,

    questionTier: 1,
    questionsShown: 12,
  },

  midRise: {
    label: "Mid-Rise",
    description: "4-10 stories",

    typicalSqFt: { min: 50000, max: 200000 },
    typicalFloors: { min: 4, max: 10 },
    kwhPerSqFtYear: { min: 18, max: 28 },
    defaultKwhPerSqFt: 23,

    typicalPeakKw: { min: 200, max: 800 },
    typicalAnnualKwh: { min: 1000000, max: 5000000 },

    bessKwh: { min: 200, max: 750 },
    solarKw: { min: 100, max: 400 },
    generatorKw: { min: 100, max: 300 },

    hvacPercent: 50,
    hasElevators: true,

    questionTier: 2,
    questionsShown: 15,
  },

  highRise: {
    label: "High-Rise",
    description: "10+ stories",

    typicalSqFt: { min: 200000, max: 500000 },
    typicalFloors: { min: 10, max: 50 },
    kwhPerSqFtYear: { min: 22, max: 35 },
    defaultKwhPerSqFt: 28,

    typicalPeakKw: { min: 800, max: 2500 },
    typicalAnnualKwh: { min: 5000000, max: 15000000 },

    bessKwh: { min: 500, max: 2500 },
    solarKw: { min: 200, max: 750 },
    generatorKw: { min: 300, max: 1000 },

    hvacPercent: 55,
    hasElevators: true,
    elevatorBackupCritical: true,

    questionTier: 3,
    questionsShown: 17,
  },

  officeCampus: {
    label: "Office Park / Campus",
    description: "Multiple buildings",

    typicalSqFt: { min: 500000, max: 2000000 },
    typicalFloors: { min: 1, max: 10 },
    kwhPerSqFtYear: { min: 18, max: 30 },
    defaultKwhPerSqFt: 24,

    typicalPeakKw: { min: 2000, max: 8000 },
    typicalAnnualKwh: { min: 12000000, max: 50000000 },

    bessKwh: { min: 2000, max: 10000 },
    solarKw: { min: 1000, max: 5000 },
    generatorKw: { min: 1000, max: 4000 },

    hvacPercent: 50,
    microgridCandidate: true,

    questionTier: 3,
    questionsShown: 17,
  },

  medicalOffice: {
    label: "Medical Office Building",
    description: "Healthcare tenants",

    typicalSqFt: { min: 20000, max: 100000 },
    typicalFloors: { min: 2, max: 8 },
    kwhPerSqFtYear: { min: 25, max: 38 },
    defaultKwhPerSqFt: 31,

    typicalPeakKw: { min: 150, max: 750 },
    typicalAnnualKwh: { min: 600000, max: 3000000 },

    bessKwh: { min: 200, max: 1000 },
    solarKw: { min: 100, max: 500 },
    generatorKw: { min: 150, max: 500 },

    hvacPercent: 45,
    extendedHours: true,
    medicalEquipment: true,

    questionTier: 2,
    questionsShown: 15,
  },

  flexCreative: {
    label: "Flex / Creative",
    description: "Open plans, tech/creative tenants",

    typicalSqFt: { min: 20000, max: 150000 },
    typicalFloors: { min: 1, max: 6 },
    kwhPerSqFtYear: { min: 18, max: 28 },
    defaultKwhPerSqFt: 23,

    typicalPeakKw: { min: 100, max: 600 },
    typicalAnnualKwh: { min: 500000, max: 3500000 },

    bessKwh: { min: 150, max: 750 },
    solarKw: { min: 75, max: 400 },
    generatorKw: { min: 75, max: 300 },

    hvacPercent: 45,
    highDensity: true,

    questionTier: 2,
    questionsShown: 14,
  },

  government: {
    label: "Government / Institutional",
    description: "Public sector",

    typicalSqFt: { min: 50000, max: 500000 },
    typicalFloors: { min: 2, max: 15 },
    kwhPerSqFtYear: { min: 22, max: 32 },
    defaultKwhPerSqFt: 27,

    typicalPeakKw: { min: 200, max: 2000 },
    typicalAnnualKwh: { min: 1500000, max: 12000000 },

    bessKwh: { min: 300, max: 2500 },
    solarKw: { min: 150, max: 1000 },
    generatorKw: { min: 200, max: 1500 },

    hvacPercent: 50,
    securitySystems: true,
    dataCenterLikely: true,

    questionTier: 2,
    questionsShown: 15,
  },

  coworking: {
    label: "Coworking / Shared",
    description: "WeWork-style",

    typicalSqFt: { min: 10000, max: 100000 },
    typicalFloors: { min: 1, max: 10 },
    kwhPerSqFtYear: { min: 20, max: 30 },
    defaultKwhPerSqFt: 25,

    typicalPeakKw: { min: 75, max: 500 },
    typicalAnnualKwh: { min: 300000, max: 2500000 },

    bessKwh: { min: 100, max: 600 },
    solarKw: { min: 50, max: 300 },
    generatorKw: { min: 75, max: 300 },

    hvacPercent: 45,
    highChurn: true,
    amenityHeavy: true,

    questionTier: 2,
    questionsShown: 14,
  },

  mixedUse: {
    label: "Mixed-Use",
    description: "Office + retail/residential",

    typicalSqFt: { min: 50000, max: 500000 },
    typicalFloors: { min: 3, max: 30 },
    kwhPerSqFtYear: { min: 20, max: 32 },
    defaultKwhPerSqFt: 26,

    typicalPeakKw: { min: 250, max: 2000 },
    typicalAnnualKwh: { min: 1500000, max: 12000000 },

    bessKwh: { min: 300, max: 2500 },
    solarKw: { min: 150, max: 1000 },
    generatorKw: { min: 200, max: 1200 },

    hvacPercent: 50,
    complexMetering: true,

    questionTier: 3,
    questionsShown: 17,
  },

  classATrophy: {
    label: "Class A Trophy",
    description: "Premium, newest, best amenities",

    typicalSqFt: { min: 300000, max: 1000000 },
    typicalFloors: { min: 15, max: 60 },
    kwhPerSqFtYear: { min: 28, max: 40 },
    defaultKwhPerSqFt: 34,

    typicalPeakKw: { min: 1200, max: 4000 },
    typicalAnnualKwh: { min: 8000000, max: 35000000 },

    bessKwh: { min: 1000, max: 4000 },
    solarKw: { min: 300, max: 1000 },
    generatorKw: { min: 500, max: 2000 },

    hvacPercent: 55,
    hasElevators: true,
    elevatorBackupCritical: true,
    premiumAmenities: true,

    questionTier: 3,
    questionsShown: 17,
  },
};

// ============================================================================
// BUILDING CLASS
// ============================================================================

export const BUILDING_CLASS = {
  classA: {
    label: "Class A",
    description: "Premium, newest, best amenities",
    energyMultiplier: 1.2,
    tenantExpectations: "high",
  },
  classB: {
    label: "Class B",
    description: "Good quality, competitive",
    energyMultiplier: 1.0,
    tenantExpectations: "moderate",
  },
  classC: {
    label: "Class C",
    description: "Older, functional, value-oriented",
    energyMultiplier: 0.85,
    tenantExpectations: "basic",
  },
  notSure: {
    label: "Not sure",
    description: "We'll estimate",
    energyMultiplier: 1.0,
  },
};

// ============================================================================
// HVAC SYSTEMS
// ============================================================================

export const HVAC_SYSTEMS = {
  centralPlant: {
    label: "Central plant (chiller + boiler)",
    efficiency: "varies",
    complexity: "high",
    typicalBuildings: "Large commercial",
  },
  rooftopUnits: {
    label: "Rooftop units (RTUs)",
    efficiency: "moderate",
    complexity: "low",
    typicalBuildings: "Small-mid office",
  },
  vrf: {
    label: "Variable refrigerant flow (VRF)",
    efficiency: "high",
    complexity: "moderate",
    typicalBuildings: "Modern office",
  },
  splitSystems: {
    label: "Split systems",
    efficiency: "moderate",
    complexity: "low",
    typicalBuildings: "Small office",
  },
  waterSourceHeatPumps: {
    label: "Water-source heat pumps",
    efficiency: "high",
    complexity: "moderate",
    typicalBuildings: "Multi-tenant",
  },
  districtHeatingCooling: {
    label: "District heating/cooling",
    efficiency: "varies",
    complexity: "low (for building)",
    typicalBuildings: "Urban, campus",
  },
  notSure: {
    label: "Not sure",
    efficiency: "unknown",
  },
};

// ============================================================================
// LEASE STRUCTURES
// ============================================================================

export const LEASE_STRUCTURES = {
  ownerPaysAll: {
    label: "Owner pays all",
    impact: "Full control and savings",
    savingsBenefit: "owner",
  },
  nnnTenantsDirect: {
    label: "NNN — Tenants pay directly",
    impact: "Tenants benefit from savings",
    savingsBenefit: "tenants",
  },
  nnnOwnerBills: {
    label: "NNN — Owner bills tenants",
    impact: "Pass-through possible",
    savingsBenefit: "shared",
  },
  grossLease: {
    label: "Gross lease — included in rent",
    impact: "Owner absorbs costs",
    savingsBenefit: "owner",
  },
  modifiedGross: {
    label: "Modified gross",
    impact: "Mixed",
    savingsBenefit: "shared",
  },
};

// ============================================================================
// BACKUP POWER LEVELS
// ============================================================================

export const BACKUP_LEVELS = {
  none: { label: "None" },
  lifeSafetyOnly: { label: "Life safety only (emergency lighting, fire)" },
  lifeSafetyElevators: { label: "Life safety + elevators" },
  criticalSystems: { label: "Critical systems (+ data, security)" },
  fullBuilding: { label: "Full building backup" },
  notSure: { label: "Not sure" },
};

// ============================================================================
// SUSTAINABILITY CERTIFICATIONS
// ============================================================================

export const SUSTAINABILITY_CERTS = {
  leed: { label: "LEED certification", levels: ["Certified", "Silver", "Gold", "Platinum"] },
  energyStar: { label: "Energy Star rating", range: [1, 100] },
  bomaBest: { label: "BOMA BEST", levels: ["Certified", "Silver", "Gold", "Platinum"] },
  carbonNeutral: { label: "Carbon neutral commitment" },
  localBPS: { label: "Local building performance standard" },
  tenantRequirements: { label: "Tenant requirements" },
  corporateESG: { label: "Corporate ESG goals" },
  none: { label: "None currently" },
};

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const OFFICE_QUESTIONS = {
  // SECTION 1: Your Building
  section1: [
    {
      id: "officeType",
      question: "What type of office building is this?",
      type: "select",
      options: [
        {
          value: "smallOffice",
          label: "Small Office",
          description: "1-3 stories, under 25,000 sq ft",
        },
        { value: "midRise", label: "Mid-Rise", description: "4-10 stories" },
        { value: "highRise", label: "High-Rise", description: "10+ stories" },
        { value: "officeCampus", label: "Office Park / Campus", description: "Multiple buildings" },
        {
          value: "medicalOffice",
          label: "Medical Office Building",
          description: "Healthcare tenants",
        },
        {
          value: "flexCreative",
          label: "Flex / Creative",
          description: "Open plans, tech/creative tenants",
        },
        { value: "government", label: "Government / Institutional", description: "Public sector" },
        { value: "coworking", label: "Coworking / Shared", description: "WeWork-style" },
        { value: "mixedUse", label: "Mixed-Use", description: "Office + retail/residential" },
        { value: "classATrophy", label: "Class A Trophy", description: "Premium, full amenities" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "buildingSqFt",
      question: "Total square footage",
      type: "slider",
      min: 5000,
      max: 2000000,
      step: 5000,
      default: 100000,
      unit: "sq ft",
      required: true,
      impactLevel: "critical",
    },
    {
      id: "floorCount",
      question: "Number of floors",
      type: "number",
      min: 1,
      max: 100,
      default: 5,
      impactLevel: "medium",
    },
    {
      id: "buildingCount",
      question: "Number of buildings (if campus)",
      type: "number",
      min: 1,
      max: 50,
      default: 1,
      showIf: { officeType: ["officeCampus"] },
      impactLevel: "medium",
    },
    {
      id: "buildingClass",
      question: "What class is the building?",
      type: "select",
      options: [
        { value: "classA", label: "Class A", description: "Premium, newest, best amenities" },
        { value: "classB", label: "Class B", description: "Good quality, competitive" },
        { value: "classC", label: "Class C", description: "Older, functional, value-oriented" },
        { value: "notSure", label: "Not sure", description: "We'll estimate" },
      ],
      impactLevel: "medium",
    },
    {
      id: "tenancy",
      question: "Single tenant or multi-tenant?",
      type: "select",
      options: [
        { value: "single", label: "Single tenant", description: "One company occupies" },
        { value: "multi", label: "Multi-tenant", description: "Multiple companies" },
        { value: "ownerOccupied", label: "Owner-occupied", description: "You use the building" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 2: Building Systems
  section2: [
    {
      id: "hvacSystem",
      question: "What's your HVAC system type?",
      type: "multiselect",
      options: [
        { value: "centralPlant", label: "Central plant (chiller + boiler)" },
        { value: "rooftopUnits", label: "Rooftop units (RTUs)" },
        { value: "vrf", label: "Variable refrigerant flow (VRF)" },
        { value: "splitSystems", label: "Split systems" },
        { value: "waterSourceHeatPumps", label: "Water-source heat pumps" },
        { value: "districtHeatingCooling", label: "District heating/cooling" },
        { value: "notSure", label: "Not sure" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "chillerTons",
      question: "Chiller capacity (tons)",
      type: "number",
      min: 0,
      max: 10000,
      showIf: { hvacSystem: ["centralPlant"] },
      impactLevel: "high",
    },
    {
      id: "chillerAge",
      question: "Chiller age",
      type: "select",
      options: [
        { value: "under10", label: "Under 10 years" },
        { value: "10to20", label: "10-20 years" },
        { value: "over20", label: "Over 20 years" },
      ],
      showIf: { hvacSystem: ["centralPlant"] },
      impactLevel: "medium",
    },
    {
      id: "buildingSystems",
      question: "Do you have any of these systems?",
      type: "multiselect",
      options: [
        { value: "bms", label: "Building Management System (BMS)" },
        { value: "ledLighting", label: "LED lighting" },
        { value: "parkingGarage", label: "Parking garage" },
        { value: "tenantDataCenter", label: "Tenant data center / Server rooms" },
        { value: "elevators", label: "Elevators" },
        { value: "emergencyGenerator", label: "Emergency generator" },
        { value: "evCharging", label: "EV charging (existing)" },
        { value: "conferenceCenter", label: "Conference / Event center" },
        { value: "fitnessCenter", label: "Fitness center" },
        { value: "cafeteria", label: "Cafeteria / Food service" },
      ],
      impactLevel: "medium",
    },
    {
      id: "ledPercent",
      question: "LED lighting (% complete)",
      type: "slider",
      min: 0,
      max: 100,
      step: 10,
      unit: "%",
      showIf: { buildingSystems: ["ledLighting"] },
      impactLevel: "low",
    },
    {
      id: "elevatorCount",
      question: "How many elevators?",
      type: "number",
      min: 0,
      max: 50,
      showIf: { buildingSystems: ["elevators"] },
      impactLevel: "medium",
    },
    {
      id: "generatorKw",
      question: "Generator capacity (kW)",
      type: "number",
      min: 0,
      max: 10000,
      showIf: { buildingSystems: ["emergencyGenerator"] },
      impactLevel: "high",
    },
    {
      id: "dataCenterKw",
      question: "Estimated data center/server room load (kW)",
      type: "number",
      min: 0,
      max: 5000,
      showIf: { buildingSystems: ["tenantDataCenter"] },
      impactLevel: "high",
    },
  ],

  // SECTION 3: Occupancy & Operations
  section3: [
    {
      id: "leasedPercent",
      question: "Leased percentage",
      type: "slider",
      min: 0,
      max: 100,
      step: 5,
      default: 85,
      unit: "%",
      impactLevel: "medium",
    },
    {
      id: "physicalOccupancy",
      question: "Average physical occupancy (daily)",
      type: "slider",
      min: 0,
      max: 100,
      step: 5,
      default: 60,
      unit: "%",
      helpText: "Post-COVID hybrid work typically 40-70%",
      impactLevel: "high",
    },
    {
      id: "coreHoursStart",
      question: "Core business hours start",
      type: "select",
      options: [
        { value: "6", label: "6 AM" },
        { value: "7", label: "7 AM" },
        { value: "8", label: "8 AM" },
        { value: "9", label: "9 AM" },
      ],
      default: "8",
      impactLevel: "medium",
    },
    {
      id: "coreHoursEnd",
      question: "Core business hours end",
      type: "select",
      options: [
        { value: "17", label: "5 PM" },
        { value: "18", label: "6 PM" },
        { value: "19", label: "7 PM" },
        { value: "20", label: "8 PM" },
      ],
      default: "18",
      impactLevel: "medium",
    },
    {
      id: "twentyFourSevenAccess",
      question: "24/7 access available?",
      type: "boolean",
      impactLevel: "low",
    },
    {
      id: "specialTenants",
      question: "Do you have tenants with special needs?",
      type: "multiselect",
      options: [
        { value: "twentyFourSeven", label: "24/7 operations", notes: "Call center, trading, etc." },
        {
          value: "highDensityServers",
          label: "High-density server rooms",
          notes: "Data-intensive",
        },
        { value: "medical", label: "Medical / Healthcare", notes: "Extended hours" },
        { value: "labRD", label: "Lab / R&D", notes: "Special HVAC" },
        { value: "broadcast", label: "Broadcast / Studio", notes: "Power quality sensitive" },
        { value: "financial", label: "Financial / Trading", notes: "Uptime critical" },
      ],
      impactLevel: "high",
    },
  ],

  // SECTION 4: Current Power Situation
  section4: [
    {
      id: "annualEnergySpend",
      question: "What's your approximate annual energy spend?",
      type: "select",
      options: [
        { value: 25000, label: "Under $50,000" },
        { value: 100000, label: "$50,000 - $150,000" },
        { value: 275000, label: "$150,000 - $400,000" },
        { value: 700000, label: "$400,000 - $1,000,000" },
        { value: 2000000, label: "$1,000,000 - $3,000,000" },
        { value: 5000000, label: "Over $3,000,000" },
        { value: 0, label: "Prefer not to say" },
      ],
      impactLevel: "high",
    },
    {
      id: "leaseStructure",
      question: "How are utilities structured?",
      type: "select",
      options: [
        { value: "ownerPaysAll", label: "Owner pays all", impact: "Full control and savings" },
        {
          value: "nnnTenantsDirect",
          label: "NNN — Tenants pay directly",
          impact: "Tenants benefit from savings",
        },
        {
          value: "nnnOwnerBills",
          label: "NNN — Owner bills tenants",
          impact: "Pass-through possible",
        },
        {
          value: "grossLease",
          label: "Gross lease — included in rent",
          impact: "Owner absorbs costs",
        },
        { value: "modifiedGross", label: "Modified gross", impact: "Mixed" },
      ],
      impactLevel: "high",
    },
    {
      id: "currentBackup",
      question: "Do you have backup power today?",
      type: "select",
      options: [
        { value: "none", label: "None" },
        { value: "lifeSafetyOnly", label: "Life safety only (emergency lighting, fire)" },
        { value: "lifeSafetyElevators", label: "Life safety + elevators" },
        { value: "criticalSystems", label: "Critical systems (+ data, security)" },
        { value: "fullBuilding", label: "Full building backup" },
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
      ],
      showIf: { buildingSystems: ["emergencyGenerator"] },
      impactLevel: "low",
    },
    {
      id: "generatorAge",
      question: "Generator age",
      type: "select",
      options: [
        { value: "under10", label: "Under 10 years" },
        { value: "10to20", label: "10-20 years" },
        { value: "over20", label: "Over 20 years" },
      ],
      showIf: { buildingSystems: ["emergencyGenerator"] },
      impactLevel: "medium",
    },
  ],

  // SECTION 5: Space & Sustainability
  section5: [
    {
      id: "solarPotential",
      question: "Do you have space for solar?",
      type: "multiselect",
      options: [
        { value: "flatRoof", label: "Flat roof" },
        { value: "parkingStructure", label: "Parking structure" },
        { value: "surfaceParking", label: "Surface parking (canopy potential)" },
        { value: "adjacentLand", label: "Adjacent land" },
        { value: "limited", label: "Limited / None" },
      ],
      impactLevel: "medium",
    },
    {
      id: "roofSqFt",
      question: "Approximate roof area (sq ft)",
      type: "number",
      min: 0,
      max: 500000,
      showIf: { solarPotential: ["flatRoof"] },
      impactLevel: "medium",
    },
    {
      id: "parkingSpaces",
      question: "Parking spaces (canopy potential)",
      type: "number",
      min: 0,
      max: 5000,
      showIf: { solarPotential: ["parkingStructure", "surfaceParking"] },
      impactLevel: "medium",
    },
    {
      id: "sustainabilityRequirements",
      question: "Do you have sustainability requirements?",
      type: "multiselect",
      options: [
        { value: "leed", label: "LEED certification" },
        { value: "energyStar", label: "Energy Star rating" },
        { value: "bomaBest", label: "BOMA BEST" },
        { value: "carbonNeutral", label: "Carbon neutral commitment" },
        { value: "localBPS", label: "Local building performance standard" },
        { value: "tenantRequirements", label: "Tenant requirements" },
        { value: "corporateESG", label: "Corporate ESG goals" },
        { value: "none", label: "None currently" },
      ],
      impactLevel: "medium",
    },
    {
      id: "carbonNeutralYear",
      question: "Carbon neutral target year",
      type: "number",
      min: 2025,
      max: 2060,
      showIf: { sustainabilityRequirements: ["carbonNeutral"] },
      impactLevel: "medium",
    },
    {
      id: "plannedChanges",
      question: "What building changes are planned?",
      type: "multiselect",
      options: [
        { value: "majorRenovation", label: "Major renovation" },
        { value: "hvacReplacement", label: "HVAC replacement" },
        { value: "addEvCharging", label: "Adding EV charging" },
        { value: "ledUpgrade", label: "LED lighting upgrade" },
        { value: "electrification", label: "Electrification (remove gas)" },
        { value: "addAmenities", label: "Adding amenities" },
        { value: "noChanges", label: "No major changes" },
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
        { value: "reduceOperatingCosts", label: "Reduce operating costs" },
        { value: "improveNOI", label: "Improve NOI / Cap rate" },
        { value: "attractTenants", label: "Attract / Retain tenants" },
        { value: "meetSustainability", label: "Meet sustainability requirements" },
        { value: "addEvCharging", label: "Add EV charging amenity" },
        { value: "improveBackup", label: "Improve backup power" },
        { value: "reduceDemandCharges", label: "Reduce demand charges" },
        { value: "prepareRegulations", label: "Prepare for local regulations" },
        { value: "qualifyIncentives", label: "Qualify for incentives" },
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
          value: "reduceOperatingCosts",
          label: "Reduce operating costs",
          description: "Lower utility bills",
        },
        {
          value: "improvePropertyValue",
          label: "Improve property value",
          description: "NOI, cap rate, ESG score",
        },
        {
          value: "tenantAttraction",
          label: "Tenant attraction",
          description: "Competitive amenity",
        },
        {
          value: "meetRegulations",
          label: "Meet regulations",
          description: "Building performance standards",
        },
        { value: "sustainability", label: "Sustainability", description: "Carbon reduction, ESG" },
        { value: "backupPower", label: "Backup power", description: "Elevator, critical systems" },
        { value: "quickPayback", label: "Quick payback", description: "ROI within 3-5 years" },
        {
          value: "minimalDisruption",
          label: "Minimal tenant disruption",
          description: "Implementation ease",
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

export interface OfficeInputs {
  officeType: string;
  buildingSqFt: number;
  floorCount?: number;
  buildingCount?: number;
  buildingClass?: string;
  tenancy?: string;
  hvacSystem: string[];
  chillerTons?: number;
  chillerAge?: string;
  buildingSystems?: string[];
  elevatorCount?: number;
  generatorKw?: number;
  dataCenterKw?: number;
  leasedPercent?: number;
  physicalOccupancy?: number;
  specialTenants?: string[];
  annualEnergySpend?: number;
  leaseStructure?: string;
  currentBackup: string;
  solarPotential?: string[];
  roofSqFt?: number;
  parkingSpaces?: number;
  sustainabilityRequirements?: string[];
  plannedChanges?: string[];
  energyGoals?: string[];
  priorities: string[];
}

export interface OfficeCalculations {
  // Load estimates
  estimatedPeakKw: number;
  estimatedAnnualKwh: number;
  estimatedAnnualSpend: number;

  // Load breakdown
  hvacKw: number;
  lightingKw: number;
  plugLoadKw: number;
  elevatorKw: number;
  dataCenterKw: number;

  // System recommendations
  recommendedBessKwh: number;
  recommendedSolarKw: number;
  recommendedGeneratorKw: number;

  // Occupancy analysis
  occupancyAdjustedLoad: number;

  // Savings
  annualSavings: number;
  demandChargeSavings: number;

  // Lease impact
  savingsBeneficiary: string;

  // Confidence
  confidenceLevel: "low" | "medium" | "high";
  warnings: string[];
  recommendations: string[];
}

export function calculateOfficeProfile(inputs: OfficeInputs): OfficeCalculations {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Get office type profile
  const profile = OFFICE_TYPES[inputs.officeType as keyof typeof OFFICE_TYPES];
  const buildingClass = BUILDING_CLASS[inputs.buildingClass as keyof typeof BUILDING_CLASS];

  // Calculate base load from sq ft
  const kwhPerSqFt = profile?.defaultKwhPerSqFt || 23;
  let estimatedAnnualKwh = inputs.buildingSqFt * kwhPerSqFt;

  // Adjust for building class
  const classMultiplier = buildingClass?.energyMultiplier || 1.0;
  estimatedAnnualKwh *= classMultiplier;

  // Adjust for occupancy (post-COVID reality)
  const occupancy = inputs.physicalOccupancy || 60;
  const occupancyFactor = 0.5 + (occupancy / 100) * 0.5; // 50% base + 50% variable
  const occupancyAdjustedLoad = estimatedAnnualKwh * occupancyFactor;

  // Peak calculation (office = ~50% load factor during business hours)
  let estimatedPeakKw = estimatedAnnualKwh / (8760 * 0.35); // 35% overall load factor

  // HVAC load
  const hvacPercent = profile?.hvacPercent || 50;
  const hvacKw = Math.round(estimatedPeakKw * (hvacPercent / 100));

  // Lighting (15-20% typical)
  const lightingKw = Math.round(estimatedPeakKw * 0.17);

  // Plug loads (20-25%)
  const plugLoadKw = Math.round(estimatedPeakKw * 0.22);

  // Elevator load
  let elevatorKw = 0;
  if (inputs.elevatorCount && inputs.elevatorCount > 0) {
    elevatorKw = inputs.elevatorCount * 25; // ~25 kW per elevator during peak
    estimatedPeakKw += elevatorKw * 0.3; // Add 30% for diversity
  }

  // Data center load
  const dataCenterKw = inputs.dataCenterKw || 0;
  if (dataCenterKw > 0) {
    estimatedPeakKw += dataCenterKw;
    estimatedAnnualKwh += dataCenterKw * 8760; // 24/7 operation
    recommendations.push("Tenant data center adds significant 24/7 base load");
  }

  // Special tenant adjustments
  if (inputs.specialTenants?.includes("twentyFourSeven")) {
    estimatedAnnualKwh *= 1.3; // 30% increase for 24/7 operations
    warnings.push("24/7 tenants significantly increase base load");
  }
  if (inputs.specialTenants?.includes("financial")) {
    recommendations.push("Financial tenants require high uptime — consider redundant backup");
  }

  // Energy spend
  let estimatedAnnualSpend: number;
  if (inputs.annualEnergySpend && inputs.annualEnergySpend > 0) {
    estimatedAnnualSpend = inputs.annualEnergySpend;
  } else {
    const energyRate = 0.12; // $/kWh commercial rate
    const demandRate = 15; // $/kW
    estimatedAnnualSpend = estimatedAnnualKwh * energyRate + estimatedPeakKw * demandRate * 12;
  }

  // BESS sizing
  // Key drivers: demand charges, elevator backup, tenant amenity
  let bessHours = 2; // Default 2 hours

  if ((profile as any)?.elevatorBackupCritical) {
    bessHours = 4;
    recommendations.push("BESS sized for 4-hour elevator backup capability");
  }
  if (inputs.priorities.includes("backupPower")) {
    bessHours = Math.max(bessHours, 4);
  }

  // Size for peak shaving + backup
  const recommendedBessKwh = Math.round(estimatedPeakKw * bessHours * 0.5); // 50% of peak

  // Solar sizing
  let recommendedSolarKw = 0;
  if (inputs.solarPotential?.includes("flatRoof") && inputs.roofSqFt) {
    recommendedSolarKw = Math.round(inputs.roofSqFt * 0.015); // 15 W/sq ft
  } else if (inputs.solarPotential?.includes("parkingStructure") && inputs.parkingSpaces) {
    recommendedSolarKw = Math.round(inputs.parkingSpaces * 3); // 3 kW per space
  } else if (inputs.solarPotential?.includes("surfaceParking") && inputs.parkingSpaces) {
    recommendedSolarKw = Math.round(inputs.parkingSpaces * 2.5);
  }
  recommendedSolarKw = Math.min(recommendedSolarKw, estimatedPeakKw * 0.5); // Cap at 50% of peak

  // Generator sizing
  let recommendedGeneratorKw = 0;
  if (inputs.currentBackup === "none" || inputs.currentBackup === "lifeSafetyOnly") {
    // Size for elevators + critical
    recommendedGeneratorKw = (elevatorKw || 50) + (dataCenterKw || 0) + 100; // Buffer
    if (inputs.floorCount && inputs.floorCount > 10) {
      recommendations.push("High-rise requires elevator backup — generator recommended");
    }
  }

  // Lease structure impact
  const lease = LEASE_STRUCTURES[inputs.leaseStructure as keyof typeof LEASE_STRUCTURES];
  const savingsBeneficiary = lease?.savingsBenefit || "shared";

  if (savingsBeneficiary === "tenants") {
    recommendations.push(
      "NNN lease: Energy savings benefit tenants — consider green lease provisions"
    );
  } else if (savingsBeneficiary === "owner") {
    recommendations.push("Owner pays utilities — direct benefit from energy savings");
  }

  // Sustainability requirements
  if (inputs.sustainabilityRequirements?.includes("localBPS")) {
    warnings.push("Local building performance standard may require upgrades");
    recommendations.push("BESS + solar can help meet building performance standards");
  }

  // Savings
  const demandChargeSavings = Math.round(estimatedPeakKw * 15 * 12 * 0.3); // 30% reduction
  const solarSavings = Math.round(recommendedSolarKw * 375); // $375/kW commercial
  const annualSavings = demandChargeSavings + solarSavings;

  // Confidence level
  let confidenceLevel: "low" | "medium" | "high" = "medium";
  if (inputs.annualEnergySpend && inputs.annualEnergySpend > 0 && inputs.hvacSystem.length > 0) {
    confidenceLevel = "high";
  }
  if (inputs.buildingClass === "notSure" && !inputs.annualEnergySpend) {
    confidenceLevel = "low";
  }

  return {
    estimatedPeakKw: Math.round(estimatedPeakKw),
    estimatedAnnualKwh: Math.round(estimatedAnnualKwh),
    estimatedAnnualSpend: Math.round(estimatedAnnualSpend),
    hvacKw,
    lightingKw,
    plugLoadKw,
    elevatorKw,
    dataCenterKw,
    recommendedBessKwh,
    recommendedSolarKw,
    recommendedGeneratorKw,
    occupancyAdjustedLoad: Math.round(occupancyAdjustedLoad),
    annualSavings,
    demandChargeSavings,
    savingsBeneficiary,
    confidenceLevel,
    warnings,
    recommendations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQuestionsForOffice(officeType?: string) {
  return OFFICE_QUESTIONS;
}

export default {
  OFFICE_TYPES,
  BUILDING_CLASS,
  HVAC_SYSTEMS,
  LEASE_STRUCTURES,
  BACKUP_LEVELS,
  SUSTAINABILITY_CERTS,
  OFFICE_QUESTIONS,
  calculateOfficeProfile,
  getQuestionsForOffice,
};
