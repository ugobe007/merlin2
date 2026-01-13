/**
 * UNIVERSITY / CAMPUS INDUSTRY PROFILE
 * ====================================
 *
 * Data-driven sizing calculations and question tiers for Universities & Campuses.
 * Based on industry workup by Bob Christopher & Vineet Kapila, December 2025.
 *
 * KEY INSIGHT: Universities are mini-cities — diverse building types, multiple
 * stakeholders, long planning horizons, and increasingly aggressive sustainability
 * commitments driven by students, faculty, and donors.
 *
 * KEY SIZING DRIVERS:
 * 1. Campus Type & Size - Community college to major research university
 * 2. Building Mix - Labs, dorms, athletics all very different
 * 3. Academic Calendar - Summer = 40-60% of peak
 * 4. High-Impact Facilities - Research labs, medical, data centers
 * 5. Climate Commitments - Often aggressive carbon neutral targets
 *
 * UNIQUE FACTORS:
 * - Diverse building portfolio
 * - Legacy infrastructure (often 50-100+ years old)
 * - Tax-exempt financing options
 * - Long planning horizons (10-30 year master plans)
 * - High public/student visibility
 */

// ============================================================================
// CAMPUS TYPE PROFILES
// ============================================================================

export const CAMPUS_PROFILES = {
  communityCollege: {
    label: "Community College",
    description: "2-year, primarily commuter",

    typicalStudents: { min: 1000, max: 15000 },
    typicalSqFt: { min: 200000, max: 1000000 },
    typicalPeakMw: { min: 0.5, max: 3 },
    typicalAnnualMwh: { min: 2000, max: 15000 },
    kwhPerSqFtYear: { min: 15, max: 25 },

    bessMwh: { min: 0.5, max: 2 },
    solarMw: { min: 0.3, max: 1 },
    generatorMw: { min: 0.25, max: 1 },

    loadVariability: "high", // Daytime only
    residentialLoad: false,
    researchIntensity: "low",

    questionTier: 1,
    questionsShown: 15,
  },

  smallPrivate: {
    label: "Small Private College",
    description: "Under 5,000 students, liberal arts focus",

    typicalStudents: { min: 1000, max: 5000 },
    typicalSqFt: { min: 500000, max: 3000000 },
    typicalPeakMw: { min: 2, max: 8 },
    typicalAnnualMwh: { min: 10000, max: 40000 },
    kwhPerSqFtYear: { min: 25, max: 35 },

    bessMwh: { min: 2, max: 8 },
    solarMw: { min: 0.5, max: 3 },
    generatorMw: { min: 0.5, max: 2 },

    loadVariability: "medium",
    residentialLoad: true,
    researchIntensity: "low",

    questionTier: 2,
    questionsShown: 18,
  },

  regionalPublic: {
    label: "Regional Public University",
    description: "5,000-20,000 students, teaching focus",

    typicalStudents: { min: 5000, max: 20000 },
    typicalSqFt: { min: 2000000, max: 10000000 },
    typicalPeakMw: { min: 5, max: 20 },
    typicalAnnualMwh: { min: 30000, max: 120000 },
    kwhPerSqFtYear: { min: 25, max: 40 },

    bessMwh: { min: 5, max: 20 },
    solarMw: { min: 2, max: 8 },
    generatorMw: { min: 2, max: 8 },

    loadVariability: "medium",
    residentialLoad: true,
    researchIntensity: "medium",

    questionTier: 2,
    questionsShown: 20,
  },

  largeState: {
    label: "Large State University",
    description: "20,000+ students, research + athletics",

    typicalStudents: { min: 20000, max: 50000 },
    typicalSqFt: { min: 10000000, max: 25000000 },
    typicalPeakMw: { min: 30, max: 100 },
    typicalAnnualMwh: { min: 200000, max: 600000 },
    kwhPerSqFtYear: { min: 30, max: 50 },

    bessMwh: { min: 20, max: 75 },
    solarMw: { min: 10, max: 30 },
    generatorMw: { min: 10, max: 30 },

    loadVariability: "medium",
    residentialLoad: true,
    researchIntensity: "high",
    hasAthletics: true,

    questionTier: 3,
    questionsShown: 23,
  },

  majorResearch: {
    label: "Major Research University",
    description: "R1 classification, medical center, extensive research",

    typicalStudents: { min: 30000, max: 70000 },
    typicalSqFt: { min: 20000000, max: 50000000 },
    typicalPeakMw: { min: 75, max: 200 },
    typicalAnnualMwh: { min: 500000, max: 1500000 },
    kwhPerSqFtYear: { min: 40, max: 60 },

    bessMwh: { min: 50, max: 150 },
    solarMw: { min: 20, max: 75 },
    generatorMw: { min: 25, max: 75 },

    loadVariability: "low", // More consistent due to research
    residentialLoad: true,
    researchIntensity: "very-high",
    hasAthletics: true,
    hasMedicalCenter: true,

    questionTier: 3,
    questionsShown: 23,
  },

  technical: {
    label: "Technical / Specialized",
    description: "Engineering, art, music, etc.",

    typicalStudents: { min: 2000, max: 15000 },
    typicalSqFt: { min: 1000000, max: 8000000 },
    typicalPeakMw: { min: 3, max: 25 },
    typicalAnnualMwh: { min: 20000, max: 150000 },
    kwhPerSqFtYear: { min: 30, max: 50 },

    bessMwh: { min: 3, max: 25 },
    solarMw: { min: 1, max: 10 },
    generatorMw: { min: 1, max: 10 },

    loadVariability: "medium",
    residentialLoad: "varies",
    researchIntensity: "high",

    questionTier: 2,
    questionsShown: 20,
  },

  multiCampus: {
    label: "Multi-Campus System",
    description: "We'll focus on one campus",

    // Will inherit from selected campus type
    typicalStudents: { min: 5000, max: 100000 },
    typicalSqFt: { min: 2000000, max: 50000000 },
    typicalPeakMw: { min: 5, max: 200 },
    typicalAnnualMwh: { min: 30000, max: 1500000 },
    kwhPerSqFtYear: { min: 25, max: 50 },

    bessMwh: { min: 5, max: 150 },
    solarMw: { min: 2, max: 75 },
    generatorMw: { min: 2, max: 75 },

    questionTier: 3,
    questionsShown: 23,
  },

  urban: {
    label: "Urban Campus",
    description: "Vertical, space-constrained, mixed with city",

    typicalStudents: { min: 5000, max: 50000 },
    typicalSqFt: { min: 1000000, max: 15000000 },
    typicalPeakMw: { min: 5, max: 50 },
    typicalAnnualMwh: { min: 30000, max: 300000 },
    kwhPerSqFtYear: { min: 30, max: 50 },

    bessMwh: { min: 5, max: 50 },
    solarMw: { min: 0.5, max: 10 }, // Limited space
    generatorMw: { min: 3, max: 25 },

    loadVariability: "medium",
    residentialLoad: true,
    spaceConstrained: true,

    questionTier: 2,
    questionsShown: 20,
  },
};

// ============================================================================
// BUILDING TYPES
// ============================================================================

export const BUILDING_TYPES = {
  classroom: {
    label: "Classroom / Academic",
    percentOfCampus: { min: 15, max: 25 },
    is24x7: false,
    backupPriority: "medium",
    kwhPerSqFtYear: 25,
  },

  researchLabs: {
    label: "Research Laboratories",
    percentOfCampus: { min: 15, max: 30 },
    is24x7: true,
    backupPriority: "high",
    kwhPerSqFtYear: 60,
    notes: "Fume hoods, precise equipment",
  },

  residenceHalls: {
    label: "Residence Halls",
    percentOfCampus: { min: 15, max: 25 },
    is24x7: "semester", // Empty during breaks
    backupPriority: "medium-high",
    kwhPerSqFtYear: 20,
  },

  library: {
    label: "Library",
    percentOfCampus: { min: 5, max: 10 },
    is24x7: "extended",
    backupPriority: "medium",
    kwhPerSqFtYear: 30,
  },

  studentCenter: {
    label: "Student Center / Dining",
    percentOfCampus: { min: 5, max: 10 },
    is24x7: "extended",
    backupPriority: "low-medium",
    kwhPerSqFtYear: 40,
    notes: "Food service peaks",
  },

  athletic: {
    label: "Athletic / Recreation",
    percentOfCampus: { min: 5, max: 15 },
    is24x7: false,
    backupPriority: "low",
    kwhPerSqFtYear: 35,
    notes: "Intermittent peaks during events",
  },

  administrative: {
    label: "Administrative / Offices",
    percentOfCampus: { min: 5, max: 10 },
    is24x7: false,
    backupPriority: "medium-high",
    kwhPerSqFtYear: 20,
    notes: "Data centers within",
  },

  medical: {
    label: "Medical / Health Center",
    percentOfCampus: { min: 5, max: 15 },
    is24x7: true,
    backupPriority: "critical",
    kwhPerSqFtYear: 50,
    notes: "Life safety if hospital",
  },

  performingArts: {
    label: "Performing Arts / Auditorium",
    percentOfCampus: { min: 2, max: 5 },
    is24x7: false,
    backupPriority: "low",
    kwhPerSqFtYear: 25,
    notes: "Event-driven peaks",
  },

  parking: {
    label: "Parking Structures",
    percentOfCampus: { min: 2, max: 8 },
    is24x7: "minimal",
    backupPriority: "low",
    kwhPerSqFtYear: 5,
  },

  centralPlant: {
    label: "Central Plant",
    percentOfCampus: { min: 1, max: 3 },
    is24x7: true,
    backupPriority: "critical",
    kwhPerSqFtYear: 200,
    notes: "Chillers, boilers",
  },

  dataCenter: {
    label: "Data Center / IT",
    percentOfCampus: { min: 1, max: 3 },
    is24x7: true,
    backupPriority: "critical",
    kwhPerSqFtYear: 250,
  },

  stadium: {
    label: "Stadium / Arena",
    percentOfCampus: { min: 2, max: 10 },
    is24x7: false,
    backupPriority: "low",
    kwhPerSqFtYear: 15,
    notes: "Massive intermittent peaks",
  },
};

// ============================================================================
// HIGH-IMPACT FACILITIES
// ============================================================================

export const HIGH_IMPACT_FACILITIES = {
  fumeHoods: {
    label: "Research labs with fume hoods",
    powerImpact: "High — 24/7 HVAC",
    kwPerHood: 3, // ~3 kW per fume hood for HVAC
    countQuestion: "Approx. how many fume hoods?",
  },

  medicalSchool: {
    label: "Medical school / Teaching hospital",
    powerImpact: "Very High — life safety",
    kwhPerBed: 50000, // Annual kWh per bed
    countQuestion: "Beds",
  },

  dataCenter: {
    label: "Large data center",
    powerImpact: "High — 24/7, critical",
    countQuestion: "Approx. size (kW)",
  },

  stadium: {
    label: "Major athletic stadium",
    powerImpact: "Intermittent peaks",
    kwPer1000Seats: 50,
    countQuestion: "Capacity (seats)",
  },

  arena: {
    label: "Indoor arena / Fieldhouse",
    powerImpact: "Intermittent peaks",
    kwPer1000Seats: 75,
    countQuestion: "Capacity (seats)",
  },

  chillerPlant: {
    label: "Central chiller plant",
    powerImpact: "High — seasonal",
    kwPerTon: 0.7,
    countQuestion: "Cooling capacity (tons)",
  },

  heatingPlant: {
    label: "Central heating plant",
    powerImpact: "High — seasonal",
    fuelTypes: ["Gas", "Oil", "Electric"],
  },

  vivarium: {
    label: "Vivarium / Animal research",
    powerImpact: "High — 24/7, critical",
    kwPerSqFt: 0.1,
  },

  cleanRooms: {
    label: "Clean rooms",
    powerImpact: "Very High — precise",
    kwPerSqFt: 0.15,
  },

  supercomputing: {
    label: "Supercomputing / HPC",
    powerImpact: "Very High — 24/7",
    directKwQuestion: true,
  },
};

// ============================================================================
// ACADEMIC CALENDAR IMPACT
// ============================================================================

export const CALENDAR_PERIODS = {
  fallSpring: {
    label: "Fall/Spring semester",
    loadPercent: 100,
    description: "Baseline (100%)",
  },
  summerSession: {
    label: "Summer session",
    loadPercent: { default: 60, range: [50, 70] },
    description: "Typically 50-70%",
  },
  winterBreak: {
    label: "Winter break",
    loadPercent: { default: 40, range: [30, 50] },
    description: "Typically 30-50%",
  },
  summerBreak: {
    label: "Summer break",
    loadPercent: { default: 50, range: [40, 60] },
    description: "Typically 40-60%",
  },
};

// ============================================================================
// CLIMATE COMMITMENTS
// ============================================================================

export const CLIMATE_COMMITMENTS = {
  carbonNeutral: { label: "Carbon neutral" },
  netZero: { label: "Net zero" },
  renewable100: { label: "100% renewable electricity" },
  scienceBased: { label: "Science-based targets" },
  secondNature: { label: "Second Nature / Presidents' Climate Commitment" },
  aasheStars: { label: "AASHE STARS rating target" },
  stateMandate: { label: "State/System mandate" },
  none: { label: "No formal commitment yet" },
};

// ============================================================================
// FUNDING SOURCES
// ============================================================================

export const FUNDING_SOURCES = {
  capitalBudget: { label: "Capital budget" },
  operatingBudget: { label: "Operating budget" },
  greenRevolvingFund: { label: "Green revolving fund" },
  donorGift: { label: "Donor / Gift funding" },
  stateAppropriations: { label: "State appropriations" },
  bonds: { label: "Bonds" },
  ppa: { label: "PPA / Third-party ownership" },
  leasing: { label: "Leasing / Financing" },
  grants: { label: "Grants" },
  esco: { label: "ESCO / Performance contract" },
};

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const UNIVERSITY_QUESTIONS = {
  // SECTION 1: Your Campus
  section1: [
    {
      id: "campusType",
      question: "What type of institution is this?",
      type: "select",
      options: [
        {
          value: "communityCollege",
          label: "Community College",
          description: "2-year, primarily commuter",
        },
        {
          value: "smallPrivate",
          label: "Small Private College",
          description: "Under 5,000 students, liberal arts focus",
        },
        {
          value: "regionalPublic",
          label: "Regional Public University",
          description: "5,000-20,000 students, teaching focus",
        },
        {
          value: "largeState",
          label: "Large State University",
          description: "20,000+ students, research + athletics",
        },
        {
          value: "majorResearch",
          label: "Major Research University",
          description: "R1 classification, medical center, extensive research",
        },
        {
          value: "technical",
          label: "Technical / Specialized",
          description: "Engineering, art, music, etc.",
        },
        {
          value: "multiCampus",
          label: "Multi-Campus System",
          description: "We'll focus on one campus",
        },
        {
          value: "urban",
          label: "Urban Campus",
          description: "Vertical, space-constrained, mixed with city",
        },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "studentCount",
      question: "How many students (headcount)?",
      type: "slider",
      min: 500,
      max: 75000,
      step: 500,
      default: 10000,
      presets: [
        { value: 1500, label: "Small", description: "Under 2,500" },
        { value: 6000, label: "Medium", description: "2,500 - 10,000" },
        { value: 20000, label: "Large", description: "10,000 - 30,000" },
        { value: 40000, label: "Very Large", description: "30,000 - 50,000" },
        { value: 60000, label: "Mega", description: "50,000+" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "campusSqFt",
      question: "What's your total campus square footage?",
      type: "slider",
      min: 100000,
      max: 50000000,
      step: 100000,
      default: 5000000,
      presets: [
        { value: 500000, label: "Small", description: "Under 1 million" },
        { value: 3000000, label: "Medium", description: "1 - 5 million" },
        { value: 10000000, label: "Large", description: "5 - 15 million" },
        { value: 22000000, label: "Very Large", description: "15 - 30 million" },
        { value: 40000000, label: "Major", description: "30 million+" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "buildingCount",
      question: "How many buildings?",
      type: "slider",
      min: 5,
      max: 500,
      step: 5,
      default: 50,
      impactLevel: "medium",
    },
  ],

  // SECTION 2: Campus Composition
  section2: [
    {
      id: "buildingTypes",
      question: "What building types do you have?",
      type: "multiselect",
      helpText: "Don't know percentages? Just check which types exist.",
      options: [
        { value: "classroom", label: "Classroom / Academic", is24x7: "No" },
        { value: "researchLabs", label: "Research Laboratories", is24x7: "Yes" },
        { value: "residenceHalls", label: "Residence Halls", is24x7: "Semester" },
        { value: "library", label: "Library", is24x7: "Extended" },
        { value: "studentCenter", label: "Student Center / Dining", is24x7: "Extended" },
        { value: "athletic", label: "Athletic / Recreation", is24x7: "Varies" },
        { value: "administrative", label: "Administrative / Offices", is24x7: "No" },
        { value: "medical", label: "Medical / Health Center", is24x7: "Yes" },
        { value: "performingArts", label: "Performing Arts / Auditorium", is24x7: "Events" },
        { value: "parking", label: "Parking Structures", is24x7: "Minimal" },
        { value: "centralPlant", label: "Central Plant", is24x7: "Yes" },
        { value: "dataCenter", label: "Data Center / IT", is24x7: "Yes" },
        { value: "stadium", label: "Stadium / Arena", is24x7: "Events" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "highImpactFacilities",
      question: "Do you have any of these high-impact facilities?",
      type: "multiselect",
      options: [
        { value: "fumeHoods", label: "Research labs with fume hoods", impact: "High — 24/7 HVAC" },
        {
          value: "medicalSchool",
          label: "Medical school / Teaching hospital",
          impact: "Very High — life safety",
        },
        { value: "dataCenter", label: "Large data center", impact: "High — 24/7, critical" },
        { value: "stadium", label: "Major athletic stadium", impact: "Intermittent peaks" },
        { value: "arena", label: "Indoor arena / Fieldhouse", impact: "Intermittent peaks" },
        { value: "chillerPlant", label: "Central chiller plant", impact: "High — seasonal" },
        { value: "heatingPlant", label: "Central heating plant", impact: "High — seasonal" },
        { value: "vivarium", label: "Vivarium / Animal research", impact: "High — 24/7, critical" },
        { value: "cleanRooms", label: "Clean rooms", impact: "Very High — precise" },
        { value: "supercomputing", label: "Supercomputing / HPC", impact: "Very High — 24/7" },
      ],
      impactLevel: "high",
    },
    {
      id: "fumeHoodCount",
      question: "Approx. how many fume hoods?",
      type: "number",
      min: 0,
      max: 2000,
      showIf: { highImpactFacilities: ["fumeHoods"] },
      impactLevel: "high",
    },
    {
      id: "hospitalBeds",
      question: "Hospital beds",
      type: "number",
      min: 0,
      max: 2000,
      showIf: { highImpactFacilities: ["medicalSchool"] },
      impactLevel: "critical",
    },
    {
      id: "dataCenterKw",
      question: "Data center size (kW)",
      type: "number",
      min: 0,
      max: 50000,
      showIf: { highImpactFacilities: ["dataCenter"] },
      impactLevel: "high",
    },
    {
      id: "stadiumCapacity",
      question: "Stadium capacity (seats)",
      type: "number",
      min: 0,
      max: 120000,
      showIf: { highImpactFacilities: ["stadium"] },
      impactLevel: "medium",
    },
    {
      id: "chillerTons",
      question: "Chiller plant capacity (tons)",
      type: "number",
      min: 0,
      max: 100000,
      showIf: { highImpactFacilities: ["chillerPlant"] },
      impactLevel: "high",
    },
  ],

  // SECTION 3: Current Infrastructure
  section3: [
    {
      id: "currentPower",
      question: "How is your campus powered?",
      type: "multiselect",
      options: [
        { value: "gridOnly", label: "Grid utility only" },
        { value: "chpCogen", label: "Grid + on-site generation (CHP/cogen)" },
        { value: "existingSolar", label: "Grid + solar (existing)" },
        { value: "existingBess", label: "Grid + BESS (existing)" },
        { value: "districtEnergy", label: "District energy system (campus-owned)" },
        { value: "microgrid", label: "Campus microgrid" },
        { value: "ppa", label: "PPA / Third-party solar" },
        { value: "notSure", label: "Not sure" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "onsiteGenCapacityMw",
      question: "On-site generation capacity (MW)",
      type: "number",
      min: 0,
      max: 100,
      step: 0.5,
      showIf: { currentPower: ["chpCogen", "existingSolar", "microgrid"] },
      impactLevel: "high",
    },
    {
      id: "currentBackup",
      question: "What backup power do you have?",
      type: "multiselect",
      options: [
        { value: "buildingDiesel", label: "Building-level diesel generators" },
        { value: "buildingNg", label: "Building-level natural gas generators" },
        { value: "centralPlantBackup", label: "Central plant backup" },
        { value: "upsCritical", label: "UPS systems for critical loads only" },
        { value: "bess", label: "BESS (battery energy storage)" },
        { value: "limited", label: "Limited / Inadequate backup" },
        { value: "none", label: "None" },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "totalGenCapacityMw",
      question: "Total campus generator capacity (MW)",
      type: "number",
      min: 0,
      max: 100,
      step: 0.5,
      showIf: { currentBackup: ["buildingDiesel", "buildingNg", "centralPlantBackup"] },
      impactLevel: "high",
    },
    {
      id: "backupCoveragePercent",
      question: "What percentage of campus is backed up?",
      type: "slider",
      min: 0,
      max: 100,
      step: 5,
      unit: "%",
      showIf: { currentBackup: ["buildingDiesel", "buildingNg", "centralPlantBackup"] },
      impactLevel: "high",
    },
    {
      id: "generatorAge",
      question: "Average generator age",
      type: "select",
      options: [
        { value: "under10", label: "Under 10 years" },
        { value: "10to20", label: "10-20 years" },
        { value: "over20", label: "Over 20 years" },
      ],
      showIf: { currentBackup: ["buildingDiesel", "buildingNg", "centralPlantBackup"] },
      impactLevel: "medium",
    },
    {
      id: "infrastructureAge",
      question: "Age of main electrical distribution",
      type: "select",
      options: [
        { value: "under10", label: "Under 10 years" },
        { value: "10to25", label: "10-25 years" },
        { value: "25to50", label: "25-50 years" },
        { value: "over50", label: "Over 50 years" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 4: Operations & Calendar
  section4: [
    {
      id: "summerLoadPercent",
      question: "Summer session load (% of peak)",
      type: "slider",
      min: 30,
      max: 80,
      step: 5,
      default: 60,
      unit: "%",
      helpText: "Typically 50-70%",
      impactLevel: "medium",
    },
    {
      id: "winterBreakLoadPercent",
      question: "Winter break load (% of peak)",
      type: "slider",
      min: 20,
      max: 60,
      step: 5,
      default: 40,
      unit: "%",
      helpText: "Typically 30-50%",
      impactLevel: "medium",
    },
    {
      id: "majorEvents",
      question: "Do you host major events?",
      type: "multiselect",
      options: [
        { value: "football", label: "Football games", peakImpact: "Very High" },
        { value: "basketball", label: "Basketball / Arena events", peakImpact: "High" },
        { value: "commencement", label: "Commencement", peakImpact: "High" },
        { value: "concerts", label: "Concerts / Large gatherings", peakImpact: "High" },
        { value: "conferences", label: "Conferences", peakImpact: "Moderate" },
        { value: "summerCamps", label: "Summer camps", peakImpact: "Moderate" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 5: Energy & Costs
  section5: [
    {
      id: "annualEnergySpend",
      question: "What's your annual energy spend?",
      type: "select",
      options: [
        { value: 500000, label: "Under $1 million" },
        { value: 3000000, label: "$1 - $5 million" },
        { value: 10000000, label: "$5 - $15 million" },
        { value: 22500000, label: "$15 - $30 million" },
        { value: 52500000, label: "$30 - $75 million" },
        { value: 100000000, label: "Over $75 million" },
        { value: 0, label: "Prefer not to say" },
      ],
      impactLevel: "high",
    },
    {
      id: "demandChargeAwareness",
      question: "Do you know your demand charges?",
      type: "select",
      options: [
        { value: "dontKnow", label: "Don't know / Don't have" },
        { value: "knowPercent", label: "Yes — roughly ___% of our bill" },
        { value: "knowAmount", label: "Yes — approximately $___/month" },
        { value: "specialRate", label: "We have a special rate / Contract" },
      ],
      impactLevel: "high",
    },
    {
      id: "energyPainPoints",
      question: "Any current energy pain points?",
      type: "multiselect",
      options: [
        { value: "highCosts", label: "High energy costs impacting budget" },
        { value: "agingInfrastructure", label: "Aging infrastructure needs replacement" },
        { value: "demandCharges", label: "Demand charges are significant" },
        { value: "peakEvents", label: "Peak events strain the grid" },
        { value: "reliability", label: "Reliability issues / Outages affecting research" },
        { value: "generatorAging", label: "Generators aging / Maintenance costs" },
        { value: "sustainability", label: "Not meeting sustainability commitments" },
        { value: "capacityLimit", label: "Grid capacity limiting campus growth" },
        { value: "noIssues", label: "No major issues" },
      ],
      impactLevel: "high",
    },
  ],

  // SECTION 6: Sustainability & Climate Commitments
  section6: [
    {
      id: "climateCommitments",
      question: "Does your institution have climate commitments?",
      type: "multiselect",
      options: [
        { value: "carbonNeutral", label: "Carbon neutral" },
        { value: "netZero", label: "Net zero" },
        { value: "renewable100", label: "100% renewable electricity" },
        { value: "scienceBased", label: "Science-based targets" },
        { value: "secondNature", label: "Second Nature / Presidents' Climate Commitment" },
        { value: "aasheStars", label: "AASHE STARS rating target" },
        { value: "stateMandate", label: "State/System mandate" },
        { value: "none", label: "No formal commitment yet" },
      ],
      impactLevel: "high",
    },
    {
      id: "commitmentTargetYear",
      question: "Target year for climate commitment",
      type: "number",
      min: 2025,
      max: 2060,
      showIf: { climateCommitments: ["carbonNeutral", "netZero", "renewable100", "scienceBased"] },
      impactLevel: "medium",
    },
    {
      id: "sustainabilityDrivers",
      question: "What's driving your sustainability efforts?",
      type: "multiselect",
      options: [
        { value: "boardMandate", label: "Board / Administration mandate" },
        { value: "studentPressure", label: "Student pressure / Expectations" },
        { value: "facultyAdvocacy", label: "Faculty advocacy" },
        { value: "donorInterest", label: "Donor interest / Naming opportunity" },
        { value: "stateRequirements", label: "State / System requirements" },
        { value: "costSavings", label: "Cost savings" },
        { value: "competitivePositioning", label: "Competitive positioning / Rankings" },
        { value: "riskManagement", label: "Risk management / Resilience" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 7: Space & Expansion
  section7: [
    {
      id: "solarPotential",
      question: "Do you have space for solar?",
      type: "multiselect",
      options: [
        { value: "rooftops", label: "Building rooftops" },
        { value: "parkingCanopies", label: "Parking structures / Canopies" },
        { value: "groundMount", label: "Ground mount (campus land)" },
        { value: "offCampus", label: "Off-campus land owned" },
        { value: "limited", label: "Limited / Constrained" },
        { value: "historic", label: "Historic buildings restrict options" },
      ],
      impactLevel: "medium",
    },
    {
      id: "expansionPlans",
      question: "What campus changes are planned?",
      type: "multiselect",
      options: [
        { value: "newAcademic", label: "New academic buildings" },
        { value: "newResidence", label: "New residence halls" },
        { value: "newResearch", label: "New research facilities" },
        { value: "newAthletic", label: "New athletic facilities" },
        { value: "majorRenovation", label: "Major renovation projects" },
        { value: "electrification", label: "Electrification (replacing gas)" },
        { value: "evFleet", label: "EV fleet / Campus vehicles" },
        { value: "evCharging", label: "Student EV charging expansion" },
        { value: "noChanges", label: "No major changes planned" },
      ],
      impactLevel: "medium",
    },
    {
      id: "expansionTimeframe",
      question: "Timeframe for planned changes",
      type: "select",
      showIf: {
        expansionPlans: [
          "newAcademic",
          "newResidence",
          "newResearch",
          "newAthletic",
          "majorRenovation",
          "electrification",
        ],
      },
      options: [
        { value: "1to3", label: "Within 1-3 years" },
        { value: "3to5", label: "Within 3-5 years" },
        { value: "5to10", label: "Within 5-10 years" },
        { value: "over10", label: "Over 10 years" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 8: Priorities & Decision Making
  section8: [
    {
      id: "priorities",
      question: "Rank what matters most (Select top 3)",
      type: "ranking",
      maxSelections: 3,
      options: [
        {
          value: "reduceCosts",
          label: "Reduce energy costs",
          description: "Budget relief for operations",
        },
        {
          value: "climateCommitments",
          label: "Meet climate commitments",
          description: "Carbon neutral / Net zero goals",
        },
        {
          value: "resilience",
          label: "Improve resilience / Reliability",
          description: "Protect research, critical facilities",
        },
        {
          value: "replaceAging",
          label: "Replace aging infrastructure",
          description: "Generators, electrical systems",
        },
        {
          value: "enableGrowth",
          label: "Enable campus growth",
          description: "Avoid utility upgrade costs",
        },
        {
          value: "stakeholderExpectations",
          label: "Student / Stakeholder expectations",
          description: "Visible sustainability action",
        },
        {
          value: "demandReduction",
          label: "Demand charge reduction",
          description: "Cut peak power costs",
        },
        {
          value: "revenueGeneration",
          label: "Revenue generation",
          description: "Grid services, demand response",
        },
        {
          value: "quickWins",
          label: "Quick wins / Visible progress",
          description: "Build momentum",
        },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "fundingSources",
      question: "How are energy projects typically funded?",
      type: "multiselect",
      options: [
        { value: "capitalBudget", label: "Capital budget" },
        { value: "operatingBudget", label: "Operating budget" },
        { value: "greenRevolvingFund", label: "Green revolving fund" },
        { value: "donorGift", label: "Donor / Gift funding" },
        { value: "stateAppropriations", label: "State appropriations" },
        { value: "bonds", label: "Bonds" },
        { value: "ppa", label: "PPA / Third-party ownership" },
        { value: "leasing", label: "Leasing / Financing" },
        { value: "grants", label: "Grants" },
        { value: "esco", label: "ESCO / Performance contract" },
      ],
      impactLevel: "medium",
    },
    {
      id: "approvalThreshold",
      question: "Board of Trustees approval required for projects over",
      type: "select",
      options: [
        { value: 500000, label: "$500,000" },
        { value: 1000000, label: "$1 million" },
        { value: 5000000, label: "$5 million" },
        { value: 10000000, label: "$10 million" },
        { value: 25000000, label: "$25 million" },
        { value: 0, label: "Not sure" },
      ],
      impactLevel: "low",
    },
  ],
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export interface UniversityInputs {
  campusType: string;
  studentCount: number;
  campusSqFt: number;
  buildingCount?: number;
  buildingTypes: string[];
  highImpactFacilities?: string[];
  fumeHoodCount?: number;
  hospitalBeds?: number;
  dataCenterKw?: number;
  stadiumCapacity?: number;
  chillerTons?: number;
  currentPower: string[];
  onsiteGenCapacityMw?: number;
  currentBackup: string[];
  totalGenCapacityMw?: number;
  backupCoveragePercent?: number;
  summerLoadPercent?: number;
  winterBreakLoadPercent?: number;
  majorEvents?: string[];
  annualEnergySpend?: number;
  energyPainPoints?: string[];
  climateCommitments?: string[];
  commitmentTargetYear?: number;
  solarPotential?: string[];
  expansionPlans?: string[];
  priorities: string[];
  fundingSources?: string[];
}

export interface UniversityCalculations {
  // Load estimates
  estimatedPeakMw: number;
  estimatedAnnualMwh: number;
  estimatedAnnualSpend: number;

  // Load breakdown
  baseLoadMw: number;
  researchLoadMw: number;
  residentialLoadMw: number;
  peakEventLoadMw: number;

  // System recommendations
  recommendedBessMwh: number;
  recommendedSolarMw: number;
  recommendedGeneratorMw: number;

  // Calendar analysis
  summerLoadMw: number;
  winterBreakLoadMw: number;

  // Savings
  annualSavings: number;
  demandChargeSavings: number;
  solarSavings: number;

  // Climate
  renewableGapMwh: number; // To meet 100% renewable
  carbonReductionPotential: number; // Tons CO2/year

  // Confidence
  confidenceLevel: "low" | "medium" | "high";
  warnings: string[];
  recommendations: string[];
}

export function calculateUniversityProfile(inputs: UniversityInputs): UniversityCalculations {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Get campus profile
  const profile = CAMPUS_PROFILES[inputs.campusType as keyof typeof CAMPUS_PROFILES];

  // Calculate base load from sq ft
  const kwhPerSqFt = (profile?.kwhPerSqFtYear?.min + profile?.kwhPerSqFtYear?.max) / 2 || 35;
  let estimatedAnnualMwh = (inputs.campusSqFt * kwhPerSqFt) / 1000; // Convert to MWh

  // Peak calculation (universities average 50% load factor due to calendar)
  let estimatedPeakMw = estimatedAnnualMwh / (8760 * 0.5) / 1000; // Convert to MW

  // Add high-impact facilities
  let researchLoadMw = 0;

  if (inputs.fumeHoodCount && inputs.fumeHoodCount > 0) {
    const fumeHoodKw = inputs.fumeHoodCount * 3; // 3 kW per hood
    researchLoadMw += fumeHoodKw / 1000;
    estimatedPeakMw += fumeHoodKw / 1000;
    recommendations.push(
      `${inputs.fumeHoodCount} fume hoods = ~${Math.round(fumeHoodKw)} kW constant load`
    );
  }

  if (inputs.hospitalBeds && inputs.hospitalBeds > 0) {
    const hospitalMwh = inputs.hospitalBeds * 50; // 50 MWh/bed/year
    estimatedAnnualMwh += hospitalMwh;
    estimatedPeakMw += (inputs.hospitalBeds * 5) / 1000; // ~5 kW/bed
    warnings.push("Medical center requires life-safety backup power");
  }

  if (inputs.dataCenterKw && inputs.dataCenterKw > 0) {
    estimatedPeakMw += inputs.dataCenterKw / 1000;
    estimatedAnnualMwh += (inputs.dataCenterKw * 8760) / 1000;
    recommendations.push("Data center is critical load — requires UPS + backup");
  }

  if (inputs.chillerTons && inputs.chillerTons > 0) {
    const chillerKw = inputs.chillerTons * 0.7; // 0.7 kW/ton
    estimatedPeakMw += chillerKw / 1000;
  }

  // Stadium/event peaks
  let peakEventLoadMw = 0;
  if (inputs.stadiumCapacity && inputs.stadiumCapacity > 0) {
    peakEventLoadMw = (inputs.stadiumCapacity / 1000) * 0.05; // 50 kW per 1000 seats
  }
  if (inputs.majorEvents?.includes("football")) {
    peakEventLoadMw = Math.max(peakEventLoadMw, estimatedPeakMw * 0.2); // +20% during games
    recommendations.push("Football game days create significant peak demand");
  }

  // Calculate residential load
  let residentialLoadMw = 0;
  if (inputs.buildingTypes.includes("residenceHalls")) {
    residentialLoadMw = estimatedPeakMw * 0.2; // Typically 20% of load
  }

  // Calendar adjustments
  const summerPercent = inputs.summerLoadPercent || 60;
  const winterBreakPercent = inputs.winterBreakLoadPercent || 40;
  const summerLoadMw = estimatedPeakMw * (summerPercent / 100);
  const winterBreakLoadMw = estimatedPeakMw * (winterBreakPercent / 100);

  // Base load (24/7 research, data centers, etc.)
  const baseLoadMw = estimatedPeakMw * 0.4; // ~40% base load typical

  // Energy spend
  let estimatedAnnualSpend: number;
  if (inputs.annualEnergySpend && inputs.annualEnergySpend > 0) {
    estimatedAnnualSpend = inputs.annualEnergySpend;
  } else {
    const energyRate = 0.08; // $/kWh institutional rate
    const demandRate = 12; // $/kW
    estimatedAnnualSpend =
      estimatedAnnualMwh * 1000 * energyRate + estimatedPeakMw * 1000 * demandRate * 12;
  }

  // BESS sizing
  // Universities benefit from: peak shaving, demand response, resilience
  let bessMwhMultiplier = 2; // 2 hours of peak

  if (inputs.priorities.includes("resilience")) bessMwhMultiplier = 4;
  if (
    inputs.climateCommitments &&
    inputs.climateCommitments.length > 0 &&
    !inputs.climateCommitments.includes("none")
  ) {
    bessMwhMultiplier = Math.max(bessMwhMultiplier, 3);
  }
  if (inputs.energyPainPoints?.includes("demandCharges")) {
    recommendations.push("High demand charges make BESS very attractive for peak shaving");
  }

  const recommendedBessMwh = Math.round(estimatedPeakMw * bessMwhMultiplier * 10) / 10;

  // Solar sizing
  let recommendedSolarMw = 0;
  if (
    inputs.solarPotential?.includes("groundMount") ||
    inputs.solarPotential?.includes("offCampus")
  ) {
    recommendedSolarMw = estimatedPeakMw * 0.4; // 40% of peak
  } else if (inputs.solarPotential?.includes("parkingCanopies")) {
    recommendedSolarMw = estimatedPeakMw * 0.25;
  } else if (inputs.solarPotential?.includes("rooftops")) {
    recommendedSolarMw = estimatedPeakMw * 0.15;
  }

  if (inputs.solarPotential?.includes("historic")) {
    recommendations.push("Historic buildings may require alternative solar locations");
  }

  // Generator sizing
  const backupCoverage = inputs.backupCoveragePercent || 50;
  const currentGenMw = inputs.totalGenCapacityMw || 0;

  // Target 70% critical load coverage
  const targetCriticalMw = estimatedPeakMw * 0.7;
  const recommendedGeneratorMw = Math.max(0, targetCriticalMw - currentGenMw);

  // Savings
  const demandChargeSavings = Math.round(estimatedPeakMw * 1000 * 12 * 12 * 0.3); // 30% reduction
  const solarSavings = Math.round(recommendedSolarMw * 1000 * 400); // SSOT: $400/kW (DEFAULTS.Preview.solarSavingsPerKW)
  const annualSavings = demandChargeSavings + solarSavings;

  // Climate analysis
  let renewableGapMwh = 0;
  if (inputs.climateCommitments?.includes("renewable100")) {
    const existingSolarMwh = (inputs.onsiteGenCapacityMw || 0) * 1500; // 1500 capacity factor
    renewableGapMwh = Math.max(0, estimatedAnnualMwh - existingSolarMwh);

    if (renewableGapMwh > 0) {
      recommendations.push(
        `Gap to 100% renewable: ${Math.round(renewableGapMwh).toLocaleString()} MWh/year`
      );
    }
  }

  // Carbon reduction potential
  const carbonFactor = 0.4; // Tons CO2 per MWh (grid average)
  const carbonReductionPotential = Math.round(recommendedSolarMw * 1500 * carbonFactor);

  // Confidence level
  let confidenceLevel: "low" | "medium" | "high" = "medium";
  if (inputs.annualEnergySpend && inputs.totalGenCapacityMw) {
    confidenceLevel = "high";
  }
  if (!inputs.campusSqFt || inputs.buildingTypes.length < 3) {
    confidenceLevel = "low";
  }

  return {
    estimatedPeakMw: Math.round(estimatedPeakMw * 10) / 10,
    estimatedAnnualMwh: Math.round(estimatedAnnualMwh),
    estimatedAnnualSpend: Math.round(estimatedAnnualSpend),
    baseLoadMw: Math.round(baseLoadMw * 10) / 10,
    researchLoadMw: Math.round(researchLoadMw * 10) / 10,
    residentialLoadMw: Math.round(residentialLoadMw * 10) / 10,
    peakEventLoadMw: Math.round(peakEventLoadMw * 10) / 10,
    recommendedBessMwh,
    recommendedSolarMw: Math.round(recommendedSolarMw * 10) / 10,
    recommendedGeneratorMw: Math.round(recommendedGeneratorMw * 10) / 10,
    summerLoadMw: Math.round(summerLoadMw * 10) / 10,
    winterBreakLoadMw: Math.round(winterBreakLoadMw * 10) / 10,
    annualSavings,
    demandChargeSavings,
    solarSavings,
    renewableGapMwh,
    carbonReductionPotential,
    confidenceLevel,
    warnings,
    recommendations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQuestionsForUniversity(campusType?: string) {
  return UNIVERSITY_QUESTIONS;
}

export default {
  CAMPUS_PROFILES,
  BUILDING_TYPES,
  HIGH_IMPACT_FACILITIES,
  CALENDAR_PERIODS,
  CLIMATE_COMMITMENTS,
  FUNDING_SOURCES,
  UNIVERSITY_QUESTIONS,
  calculateUniversityProfile,
  getQuestionsForUniversity,
};
