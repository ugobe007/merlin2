/**
 * HOSPITAL / HEALTHCARE INDUSTRY PROFILE
 * ======================================
 *
 * Data-driven sizing calculations and question tiers for Healthcare facilities.
 * Based on industry workup by Bob Christopher & Vineet Kapila, December 2025.
 *
 * KEY INSIGHT: Hospitals are life safety environments. Uptime isn't about
 * money — it's about patients. This changes everything.
 *
 * KEY SIZING DRIVERS:
 * 1. Facility Type & Beds - Primary load driver
 * 2. Critical Services - OR, ICU, ER determine backup needs
 * 3. High-Draw Equipment - MRI, CT create massive peaks
 * 4. Regulatory Requirements - Joint Commission, CMS mandate backup
 * 5. Existing Generator Infrastructure - Most hospitals already have some
 *
 * UNIQUE FACTORS:
 * - 24/7/365 operation - No "off" hours
 * - Life safety systems - Non-negotiable backup
 * - Mixed criticality - ICU vs cafeteria very different
 * - Power quality matters - Medical equipment is sensitive
 */

// ============================================================================
// FACILITY TYPE PROFILES
// ============================================================================

export const HOSPITAL_PROFILES = {
  clinic: {
    label: "Clinic / Urgent Care",
    description: "Outpatient only, no overnight stays",

    typicalBeds: 0,
    typicalSqFt: { min: 5000, max: 25000 },
    kwhPerSqFtYear: { min: 25, max: 35 },
    defaultKwhPerSqFt: 30,

    typicalPeakKw: { min: 50, max: 150 },
    typicalAnnualKwh: { min: 200000, max: 500000 },

    bessKwh: { min: 100, max: 300 },
    solarKw: { min: 50, max: 150 },
    generatorKw: { min: 75, max: 200 },

    backupRequirement: "recommended",
    criticalLoadPercent: 0.5,

    questionTier: 1,
    questionsShown: 10,
  },

  ambulatorySurgery: {
    label: "Ambulatory Surgery Center",
    description: "Same-day procedures, no inpatient",

    typicalBeds: 0,
    typicalSqFt: { min: 10000, max: 50000 },
    kwhPerSqFtYear: { min: 30, max: 40 },
    defaultKwhPerSqFt: 35,

    typicalPeakKw: { min: 100, max: 400 },
    typicalAnnualKwh: { min: 400000, max: 1500000 },

    bessKwh: { min: 200, max: 600 },
    solarKw: { min: 75, max: 250 },
    generatorKw: { min: 150, max: 500 },

    backupRequirement: "required",
    criticalLoadPercent: 0.7,

    questionTier: 2,
    questionsShown: 12,
  },

  smallCommunity: {
    label: "Small Community Hospital",
    description: "Under 100 beds, basic services",

    typicalBeds: { min: 25, max: 100 },
    typicalSqFt: { min: 50000, max: 150000 },
    kwhPerSqFtYear: { min: 30, max: 40 },
    defaultKwhPerSqFt: 35,

    typicalPeakKw: { min: 500, max: 1500 },
    typicalAnnualKwh: { min: 3000000, max: 8000000 },

    bessKwh: { min: 500, max: 1500 },
    solarKw: { min: 150, max: 400 },
    generatorKw: { min: 500, max: 1500 },

    backupRequirement: "mandatory",
    criticalLoadPercent: 0.6,

    questionTier: 2,
    questionsShown: 14,
  },

  regional: {
    label: "Regional Hospital",
    description: "100-300 beds, full services",

    typicalBeds: { min: 100, max: 300 },
    typicalSqFt: { min: 150000, max: 400000 },
    kwhPerSqFtYear: { min: 35, max: 45 },
    defaultKwhPerSqFt: 40,

    typicalPeakKw: { min: 1500, max: 4000 },
    typicalAnnualKwh: { min: 10000000, max: 25000000 },

    bessKwh: { min: 1500, max: 4000 },
    solarKw: { min: 400, max: 1000 },
    generatorKw: { min: 1500, max: 4000 },

    backupRequirement: "mandatory",
    criticalLoadPercent: 0.65,

    questionTier: 3,
    questionsShown: 15,
  },

  largeMedicalCenter: {
    label: "Large Medical Center",
    description: "300-600 beds, specialty services",

    typicalBeds: { min: 300, max: 600 },
    typicalSqFt: { min: 400000, max: 800000 },
    kwhPerSqFtYear: { min: 40, max: 50 },
    defaultKwhPerSqFt: 45,

    typicalPeakKw: { min: 4000, max: 10000 },
    typicalAnnualKwh: { min: 30000000, max: 70000000 },

    bessKwh: { min: 4000, max: 10000 },
    solarKw: { min: 1000, max: 3000 },
    generatorKw: { min: 5000, max: 15000 },

    backupRequirement: "mandatory",
    criticalLoadPercent: 0.7,
    redundancyRequired: true,

    questionTier: 3,
    questionsShown: 15,
  },

  academicMedicalCenter: {
    label: "Academic Medical Center / Teaching Hospital",
    description: "500+ beds, research, training",

    typicalBeds: { min: 500, max: 1500 },
    typicalSqFt: { min: 800000, max: 2000000 },
    kwhPerSqFtYear: { min: 45, max: 55 },
    defaultKwhPerSqFt: 50,

    typicalPeakKw: { min: 10000, max: 25000 },
    typicalAnnualKwh: { min: 80000000, max: 200000000 },

    bessKwh: { min: 10000, max: 30000 },
    solarKw: { min: 2000, max: 5000 },
    generatorKw: { min: 15000, max: 30000 },

    backupRequirement: "mandatory",
    criticalLoadPercent: 0.75,
    redundancyRequired: true,

    questionTier: 3,
    questionsShown: 15,
  },

  longTermCare: {
    label: "Long-term Care / Skilled Nursing",
    description: "Residential care, lower acuity",

    typicalBeds: { min: 50, max: 200 },
    typicalSqFt: { min: 30000, max: 150000 },
    kwhPerSqFtYear: { min: 20, max: 30 },
    defaultKwhPerSqFt: 25,

    typicalPeakKw: { min: 150, max: 600 },
    typicalAnnualKwh: { min: 1000000, max: 4000000 },

    bessKwh: { min: 200, max: 800 },
    solarKw: { min: 100, max: 400 },
    generatorKw: { min: 200, max: 750 },

    backupRequirement: "required",
    criticalLoadPercent: 0.5,

    questionTier: 2,
    questionsShown: 12,
  },

  medicalOffice: {
    label: "Medical Office Building",
    description: "Physician offices, outpatient services",

    typicalBeds: 0,
    typicalSqFt: { min: 10000, max: 100000 },
    kwhPerSqFtYear: { min: 20, max: 30 },
    defaultKwhPerSqFt: 25,

    typicalPeakKw: { min: 75, max: 500 },
    typicalAnnualKwh: { min: 300000, max: 2000000 },

    bessKwh: { min: 100, max: 500 },
    solarKw: { min: 50, max: 300 },
    generatorKw: { min: 100, max: 600 },

    backupRequirement: "recommended",
    criticalLoadPercent: 0.4,

    questionTier: 1,
    questionsShown: 10,
  },
};

// ============================================================================
// CRITICAL LOAD TIERS (How Hospitals Think)
// ============================================================================

export const CRITICAL_LOAD_TIERS = {
  lifeSafety: {
    label: "Life Safety",
    description: "Emergency lighting, fire alarms, nurse call, exit signs",
    backupRequirement: "Immediate (UPS + generator)",
    typicalPercent: 0.05, // 5% of total load
    priority: 1,
  },

  criticalBranch: {
    label: "Critical Branch",
    description: "ICU, OR, ER, labor & delivery, pharmacy, blood bank",
    backupRequirement: "10 seconds to generator",
    typicalPercent: 0.25, // 25% of total load
    priority: 2,
  },

  equipmentBranch: {
    label: "Equipment Branch",
    description: "Imaging (MRI, CT, X-ray), dialysis, lab equipment",
    backupRequirement: "10 seconds to generator",
    typicalPercent: 0.2, // 20% of total load
    priority: 3,
  },

  essential: {
    label: "Essential",
    description: "Patient rooms, nurses stations, essential HVAC",
    backupRequirement: "Generator within 10 seconds",
    typicalPercent: 0.3, // 30% of total load
    priority: 4,
  },

  nonEssential: {
    label: "Non-Essential",
    description: "Cafeteria, admin offices, gift shop, parking",
    backupRequirement: "Can shed during outage",
    typicalPercent: 0.2, // 20% of total load
    priority: 5,
  },
};

// ============================================================================
// CRITICAL SERVICES
// ============================================================================

export const CRITICAL_SERVICES = {
  emergencyDept: {
    label: "Emergency Department",
    icon: "🚨",
    powerImpact: "High",
    typicalKw: { min: 100, max: 500 },
    whyItMatters: "24/7, unpredictable surges",
    loadTier: "criticalBranch",
  },

  operatingRooms: {
    label: "Operating Rooms",
    icon: "🏥",
    powerImpact: "Very High",
    typicalKwPerOR: 50,
    whyItMatters: "Precise power, can't interrupt",
    loadTier: "criticalBranch",
  },

  icu: {
    label: "Intensive Care Unit (ICU/CCU)",
    icon: "💓",
    powerImpact: "High",
    typicalKwPerBed: 5,
    whyItMatters: "Life support equipment",
    loadTier: "criticalBranch",
  },

  laborDelivery: {
    label: "Labor & Delivery",
    icon: "👶",
    powerImpact: "High",
    typicalKw: { min: 75, max: 200 },
    whyItMatters: "Emergency C-sections",
    loadTier: "criticalBranch",
  },

  mri: {
    label: "Imaging (MRI)",
    icon: "🧲",
    powerImpact: "Very High",
    typicalKwPerUnit: { min: 50, max: 150 },
    whyItMatters: "50-150 kW per machine, very sensitive",
    loadTier: "equipmentBranch",
    powerQualitySensitive: true,
  },

  ctXray: {
    label: "Imaging (CT/X-ray)",
    icon: "📡",
    powerImpact: "High",
    typicalKwPerUnit: { min: 30, max: 80 },
    whyItMatters: "30-80 kW spikes",
    loadTier: "equipmentBranch",
  },

  dialysis: {
    label: "Dialysis Center",
    icon: "🩸",
    powerImpact: "Moderate",
    typicalKwPerStation: 3,
    whyItMatters: "Long treatment sessions",
    loadTier: "equipmentBranch",
  },

  laboratory: {
    label: "Laboratory",
    icon: "🔬",
    powerImpact: "Moderate",
    typicalKw: { min: 50, max: 200 },
    whyItMatters: "Refrigeration critical",
    loadTier: "equipmentBranch",
  },

  pharmacy: {
    label: "Pharmacy",
    icon: "💊",
    powerImpact: "Moderate",
    typicalKw: { min: 25, max: 75 },
    whyItMatters: "Refrigeration for meds",
    loadTier: "criticalBranch",
  },

  dataCenter: {
    label: "Data Center / IT",
    icon: "🖥️",
    powerImpact: "High",
    typicalKw: { min: 50, max: 500 },
    whyItMatters: "EHR systems, can't go down",
    loadTier: "criticalBranch",
  },

  centralSterile: {
    label: "Central Sterile Processing",
    icon: "🧼",
    powerImpact: "Moderate",
    typicalKw: { min: 50, max: 150 },
    whyItMatters: "Sterilizers, autoclaves",
    loadTier: "equipmentBranch",
  },

  kitchen: {
    label: "Kitchen / Food Service",
    icon: "🍽️",
    powerImpact: "Moderate",
    typicalKw: { min: 75, max: 300 },
    whyItMatters: "Patient meals",
    loadTier: "essential",
  },

  laundry: {
    label: "Laundry",
    icon: "🧺",
    powerImpact: "High",
    typicalKw: { min: 100, max: 400 },
    whyItMatters: "If on-site, high load",
    loadTier: "essential",
  },
};

// ============================================================================
// HIGH-DRAW EQUIPMENT
// ============================================================================

export const HIGH_DRAW_EQUIPMENT = {
  mri: {
    label: "MRI machines",
    typicalKw: { min: 50, max: 150 },
    unit: "each",
    powerQualitySensitive: true,
  },

  ct: {
    label: "CT scanners",
    typicalKw: { min: 30, max: 80 },
    unit: "each",
  },

  linearAccelerator: {
    label: "Linear accelerator (radiation therapy)",
    typicalKw: { min: 100, max: 200 },
    unit: "each",
  },

  cathLab: {
    label: "Cath lab",
    typicalKw: { min: 50, max: 100 },
    unit: "each",
  },

  autoclaves: {
    label: "Large autoclaves",
    typicalKw: { min: 30, max: 75 },
    unit: "each",
  },
};

// ============================================================================
// BACKUP POWER OPTIONS
// ============================================================================

export const HOSPITAL_BACKUP_OPTIONS = {
  diesel: { label: "Diesel generator(s)", note: "Most common", fuelType: "diesel" },
  naturalGas: {
    label: "Natural gas generator(s)",
    note: "Cleaner, pipeline dependent",
    fuelType: "naturalGas",
  },
  dualFuel: { label: "Dual-fuel generator(s)", note: "Flexibility", fuelType: "dualFuel" },
  ups: { label: "UPS systems (battery)", note: "Short-term bridge" },
  bess: { label: "BESS (battery energy storage)", note: "Newer installations" },
  none: { label: "None / Inadequate", note: "Need full solution" },
  notSure: { label: "Not sure", note: "We'll assess" },
};

// ============================================================================
// BACKUP ISSUES
// ============================================================================

export const BACKUP_ISSUES = {
  aging: { label: "Aging equipment, needs replacement", severity: "high" },
  capacity: { label: "Not enough capacity for current loads", severity: "high" },
  fuelConcerns: { label: "Diesel fuel storage/delivery concerns", severity: "medium" },
  emissions: { label: "Emissions or permit restrictions", severity: "medium" },
  slowTransfer: { label: "Slow transfer time (>10 seconds)", severity: "high" },
  maintenanceCosts: { label: "Maintenance costs too high", severity: "medium" },
  failedRecently: { label: "Failed during recent outage", severity: "critical" },
  needMoreRuntime: { label: "Need more runtime", severity: "medium" },
  noIssues: { label: "No major issues", severity: "none" },
};

// ============================================================================
// COMPLIANCE REQUIREMENTS
// ============================================================================

export const COMPLIANCE_REQUIREMENTS = {
  jointCommission: { label: "Joint Commission survey coming up", urgency: "high" },
  stateHealth: { label: "State health dept inspection", urgency: "high" },
  cms: { label: "CMS Conditions of Participation", urgency: "high" },
  emissions: { label: "Local emissions regulations", urgency: "medium" },
  seismic: { label: "Seismic upgrade requirements", urgency: "medium" },
  none: { label: "None that I'm aware of", urgency: "none" },
};

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const HOSPITAL_QUESTIONS = {
  // SECTION 1: Your Facility
  section1: [
    {
      id: "facilityType",
      question: "What type of healthcare facility is this?",
      type: "select",
      options: [
        {
          value: "clinic",
          label: "Clinic / Urgent Care",
          description: "Outpatient only, no overnight stays",
        },
        {
          value: "ambulatorySurgery",
          label: "Ambulatory Surgery Center",
          description: "Same-day procedures, no inpatient",
        },
        {
          value: "smallCommunity",
          label: "Small Community Hospital",
          description: "Under 100 beds, basic services",
        },
        {
          value: "regional",
          label: "Regional Hospital",
          description: "100-300 beds, full services",
        },
        {
          value: "largeMedicalCenter",
          label: "Large Medical Center",
          description: "300-600 beds, specialty services",
        },
        {
          value: "academicMedicalCenter",
          label: "Academic Medical Center / Teaching Hospital",
          description: "500+ beds, research, training",
        },
        {
          value: "longTermCare",
          label: "Long-term Care / Skilled Nursing",
          description: "Residential care, lower acuity",
        },
        {
          value: "medicalOffice",
          label: "Medical Office Building",
          description: "Physician offices, outpatient services",
        },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "bedCount",
      question: "How many beds?",
      type: "slider",
      min: 0,
      max: 1500,
      step: 10,
      default: 100,
      showIf: {
        facilityType: [
          "smallCommunity",
          "regional",
          "largeMedicalCenter",
          "academicMedicalCenter",
          "longTermCare",
        ],
      },
      required: true,
      impactLevel: "critical",
    },
    {
      id: "facilitySqFt",
      question: "What's your approximate square footage?",
      type: "slider",
      min: 5000,
      max: 2000000,
      step: 5000,
      default: 100000,
      presets: [
        { value: 15000, label: "Small", description: "Under 25,000 - Clinic, urgent care" },
        { value: 60000, label: "Medium", description: "25,000 - 100,000 - Small hospital, ASC" },
        { value: 250000, label: "Large", description: "100,000 - 500,000 - Regional hospital" },
        {
          value: 700000,
          label: "Very Large",
          description: "500,000 - 1,000,000 - Large medical center",
        },
        { value: 1500000, label: "Campus", description: "1,000,000+ - Academic medical center" },
      ],
      required: true,
      impactLevel: "critical",
    },
  ],

  // SECTION 2: Critical Services
  section2: [
    {
      id: "criticalServices",
      question: "Which critical services do you operate?",
      type: "multiselect",
      options: [
        { value: "emergencyDept", label: "Emergency Department", icon: "🚨", powerImpact: "High" },
        { value: "operatingRooms", label: "Operating Rooms", icon: "🏥", powerImpact: "Very High" },
        { value: "icu", label: "Intensive Care Unit (ICU/CCU)", icon: "💓", powerImpact: "High" },
        { value: "laborDelivery", label: "Labor & Delivery", icon: "👶", powerImpact: "High" },
        { value: "mri", label: "Imaging (MRI)", icon: "🧲", powerImpact: "Very High" },
        { value: "ctXray", label: "Imaging (CT/X-ray)", icon: "📡", powerImpact: "High" },
        { value: "dialysis", label: "Dialysis Center", icon: "🩸", powerImpact: "Moderate" },
        { value: "laboratory", label: "Laboratory", icon: "🔬", powerImpact: "Moderate" },
        { value: "pharmacy", label: "Pharmacy", icon: "💊", powerImpact: "Moderate" },
        { value: "dataCenter", label: "Data Center / IT", icon: "🖥️", powerImpact: "High" },
        {
          value: "centralSterile",
          label: "Central Sterile Processing",
          icon: "🧼",
          powerImpact: "Moderate",
        },
        { value: "kitchen", label: "Kitchen / Food Service", icon: "🍽️", powerImpact: "Moderate" },
        { value: "laundry", label: "Laundry", icon: "🧺", powerImpact: "High" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "highDrawEquipment",
      question: "Do you have any of these high-draw equipment?",
      type: "multiselect",
      options: [
        { value: "mri", label: "MRI machines", typicalKw: "50-150 kW each" },
        { value: "ct", label: "CT scanners", typicalKw: "30-80 kW each" },
        {
          value: "linearAccelerator",
          label: "Linear accelerator (radiation therapy)",
          typicalKw: "100-200 kW",
        },
        { value: "cathLab", label: "Cath lab", typicalKw: "50-100 kW" },
        { value: "autoclaves", label: "Large autoclaves", typicalKw: "30-75 kW each" },
      ],
      impactLevel: "high",
    },
    {
      id: "mriCount",
      question: "How many MRI machines?",
      type: "number",
      min: 0,
      max: 10,
      showIf: { highDrawEquipment: ["mri"] },
      impactLevel: "high",
    },
    {
      id: "ctCount",
      question: "How many CT scanners?",
      type: "number",
      min: 0,
      max: 20,
      showIf: { highDrawEquipment: ["ct"] },
      impactLevel: "high",
    },
    {
      id: "orCount",
      question: "How many operating rooms?",
      type: "number",
      min: 0,
      max: 50,
      showIf: { criticalServices: ["operatingRooms"] },
      impactLevel: "high",
    },
    {
      id: "icuBeds",
      question: "How many ICU beds?",
      type: "number",
      min: 0,
      max: 200,
      showIf: { criticalServices: ["icu"] },
      impactLevel: "high",
    },
  ],

  // SECTION 3: Current Backup Power
  section3: [
    {
      id: "currentBackup",
      question: "What backup power do you have today?",
      type: "multiselect",
      options: [
        { value: "diesel", label: "Diesel generator(s)", note: "Most common" },
        {
          value: "naturalGas",
          label: "Natural gas generator(s)",
          note: "Cleaner, pipeline dependent",
        },
        { value: "dualFuel", label: "Dual-fuel generator(s)", note: "Flexibility" },
        { value: "ups", label: "UPS systems (battery)", note: "Short-term bridge" },
        { value: "bess", label: "BESS (battery energy storage)", note: "Newer installations" },
        { value: "none", label: "None / Inadequate", note: "Need full solution" },
        { value: "notSure", label: "Not sure", note: "We'll assess" },
      ],
      required: true,
      impactLevel: "critical",
    },
    {
      id: "generatorCapacityKw",
      question: "Total generator capacity (kW)",
      type: "number",
      min: 0,
      max: 50000,
      showIf: { currentBackup: ["diesel", "naturalGas", "dualFuel"] },
      impactLevel: "high",
    },
    {
      id: "generatorCount",
      question: "Number of generators",
      type: "number",
      min: 1,
      max: 20,
      showIf: { currentBackup: ["diesel", "naturalGas", "dualFuel"] },
      impactLevel: "medium",
    },
    {
      id: "generatorFuel",
      question: "Fuel type",
      type: "select",
      options: [
        { value: "diesel", label: "Diesel" },
        { value: "naturalGas", label: "Natural Gas" },
        { value: "propane", label: "Propane" },
        { value: "dualFuel", label: "Dual-fuel" },
      ],
      showIf: { currentBackup: ["diesel", "naturalGas", "dualFuel"] },
      impactLevel: "medium",
    },
    {
      id: "generatorAge",
      question: "Generator age",
      type: "select",
      options: [
        { value: "under5", label: "Under 5 years" },
        { value: "5to15", label: "5-15 years" },
        { value: "over15", label: "Over 15 years" },
      ],
      showIf: { currentBackup: ["diesel", "naturalGas", "dualFuel"] },
      impactLevel: "medium",
    },
    {
      id: "fuelStorageHours",
      question: "Fuel storage runtime (hours)",
      type: "number",
      min: 0,
      max: 500,
      showIf: { currentBackup: ["diesel", "dualFuel"] },
      impactLevel: "medium",
    },
    {
      id: "generatorCoverage",
      question: "What does your generator currently back up?",
      type: "select",
      options: [
        { value: "full", label: "Full facility (100%)" },
        { value: "critical", label: "Critical systems only (50-70%)" },
        { value: "lifeSafety", label: "Life safety minimum (30-50%)" },
        { value: "notSure", label: "Not sure" },
      ],
      showIf: { currentBackup: ["diesel", "naturalGas", "dualFuel"] },
      impactLevel: "high",
    },
    {
      id: "backupIssues",
      question: "Any issues with your current backup?",
      type: "multiselect",
      options: [
        { value: "aging", label: "Aging equipment, needs replacement" },
        { value: "capacity", label: "Not enough capacity for current loads" },
        { value: "fuelConcerns", label: "Diesel fuel storage/delivery concerns" },
        { value: "emissions", label: "Emissions or permit restrictions" },
        { value: "slowTransfer", label: "Slow transfer time (>10 seconds)" },
        { value: "maintenanceCosts", label: "Maintenance costs too high" },
        { value: "failedRecently", label: "Failed during recent outage" },
        { value: "needMoreRuntime", label: "Need more runtime" },
        { value: "noIssues", label: "No major issues" },
      ],
      impactLevel: "high",
    },
  ],

  // SECTION 4: Reliability & Compliance
  section4: [
    {
      id: "outageFrequency",
      question: "How often do you experience power outages?",
      type: "select",
      options: [
        { value: "rarely", label: "Rarely", description: "Less than once per year" },
        { value: "occasionally", label: "Occasionally", description: "1-3 times per year" },
        { value: "frequently", label: "Frequently", description: "Monthly or more" },
        {
          value: "majorEvents",
          label: "Major events",
          description: "Hurricane zone, wildfire risk, etc.",
        },
      ],
      required: true,
      impactLevel: "high",
    },
    {
      id: "currentRuntimeHours",
      question: "Current backup runtime (hours)",
      type: "number",
      min: 0,
      max: 500,
      helpText: "Most states require 96 hours fuel storage minimum",
      impactLevel: "high",
    },
    {
      id: "targetRuntimeHours",
      question: "Target backup runtime (hours)",
      type: "number",
      min: 0,
      max: 500,
      helpText: "How long do you want to be able to operate on backup?",
      impactLevel: "high",
    },
    {
      id: "complianceRequirements",
      question: "Any upcoming compliance requirements?",
      type: "multiselect",
      options: [
        { value: "jointCommission", label: "Joint Commission survey coming up" },
        { value: "stateHealth", label: "State health dept inspection" },
        { value: "cms", label: "CMS Conditions of Participation" },
        { value: "emissions", label: "Local emissions regulations" },
        { value: "seismic", label: "Seismic upgrade requirements" },
        { value: "none", label: "None that I'm aware of" },
      ],
      impactLevel: "medium",
    },
  ],

  // SECTION 5: Sustainability & Costs
  section5: [
    {
      id: "energyGoals",
      question: "What are your energy goals?",
      type: "multiselect",
      options: [
        { value: "reduceCosts", label: "Reduce energy costs" },
        { value: "lowerCarbon", label: "Lower carbon footprint" },
        { value: "healthSystemTargets", label: "Meet health system sustainability targets" },
        { value: "reduceDiesel", label: "Reduce diesel dependency" },
        { value: "improveReliability", label: "Improve power reliability" },
        { value: "gridInstability", label: "Prepare for grid instability" },
        { value: "addRenewable", label: "Add renewable energy" },
        { value: "incentives", label: "Qualify for incentives/rebates" },
      ],
      impactLevel: "medium",
    },
    {
      id: "solarPotential",
      question: "Do you have space for solar?",
      type: "select",
      options: [
        { value: "none", label: "No", description: "Urban, limited roof, shading" },
        { value: "limited", label: "Limited", description: "Some rooftop, under 20,000 sq ft" },
        { value: "moderate", label: "Moderate", description: "Rooftop + parking structures" },
        {
          value: "significant",
          label: "Significant",
          description: "Large campus, multiple buildings",
        },
        { value: "notSure", label: "Not sure", description: "We can assess" },
      ],
      impactLevel: "medium",
    },
    {
      id: "monthlyEnergySpend",
      question: "What's your approximate monthly energy spend?",
      type: "select",
      options: [
        { value: 12500, label: "Under $25,000" },
        { value: 50000, label: "$25,000 - $75,000" },
        { value: 112500, label: "$75,000 - $150,000" },
        { value: 225000, label: "$150,000 - $300,000" },
        { value: 400000, label: "$300,000 - $500,000" },
        { value: 750000, label: "Over $500,000" },
        { value: 0, label: "Prefer not to say" },
      ],
      impactLevel: "high",
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
          value: "patientSafety",
          label: "Patient safety / Uptime",
          description: "Can't compromise on backup",
        },
        {
          value: "compliance",
          label: "Regulatory compliance",
          description: "Meet Joint Commission, CMS",
        },
        {
          value: "costReduction",
          label: "Energy cost reduction",
          description: "Operating budget relief",
        },
        {
          value: "sustainability",
          label: "Sustainability / Carbon",
          description: "Health system ESG goals",
        },
        {
          value: "reduceDiesel",
          label: "Reduce diesel reliance",
          description: "Fuel logistics, emissions",
        },
        {
          value: "modernize",
          label: "Modernize aging equipment",
          description: "Replace old generators",
        },
        {
          value: "expandCoverage",
          label: "Expand backup coverage",
          description: "More systems protected",
        },
        { value: "speed", label: "Speed of implementation", description: "Need solution fast" },
      ],
      required: true,
      impactLevel: "high",
    },
  ],
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export interface HospitalInputs {
  facilityType: string;
  bedCount?: number;
  facilitySqFt: number;
  criticalServices: string[];
  highDrawEquipment?: string[];
  mriCount?: number;
  ctCount?: number;
  orCount?: number;
  icuBeds?: number;
  currentBackup: string[];
  generatorCapacityKw?: number;
  generatorCount?: number;
  generatorFuel?: string;
  generatorAge?: string;
  fuelStorageHours?: number;
  generatorCoverage?: string;
  backupIssues?: string[];
  outageFrequency: string;
  currentRuntimeHours?: number;
  targetRuntimeHours?: number;
  complianceRequirements?: string[];
  energyGoals?: string[];
  solarPotential?: string;
  monthlyEnergySpend?: number;
  priorities: string[];
}

export interface HospitalCalculations {
  // Load estimates
  estimatedPeakKw: number;
  estimatedAnnualKwh: number;
  estimatedAnnualSpend: number;

  // Critical load breakdown
  lifeSafetyKw: number;
  criticalBranchKw: number;
  equipmentBranchKw: number;
  essentialKw: number;
  totalCriticalKw: number;

  // System recommendations
  recommendedBessKwh: number;
  recommendedSolarKw: number;
  recommendedGeneratorKw: number;

  // Backup analysis
  currentBackupAdequate: boolean;
  backupGapKw: number;
  bessCanBridge: boolean;

  // Savings
  annualSavings: number;
  demandChargeSavings: number;
  solarSavings: number;

  // Compliance
  meetsCodeRequirements: boolean;
  complianceGaps: string[];

  // Confidence
  confidenceLevel: "low" | "medium" | "high";
  warnings: string[];
  recommendations: string[];
}

export function calculateHospitalProfile(inputs: HospitalInputs): HospitalCalculations {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const complianceGaps: string[] = [];

  // Get facility profile
  const profile = HOSPITAL_PROFILES[inputs.facilityType as keyof typeof HOSPITAL_PROFILES];

  // Calculate base load from sq ft
  const kwhPerSqFt = profile?.defaultKwhPerSqFt || 40;
  const estimatedAnnualKwh = inputs.facilitySqFt * kwhPerSqFt;

  // Peak calculation (hospitals run 24/7 with ~70% load factor)
  let estimatedPeakKw = estimatedAnnualKwh / (8760 * 0.7);

  // Add high-draw equipment
  if (inputs.mriCount && inputs.mriCount > 0) {
    estimatedPeakKw += inputs.mriCount * 100; // 100 kW avg per MRI
    recommendations.push("MRI machines require clean power — BESS improves power quality");
  }
  if (inputs.ctCount && inputs.ctCount > 0) {
    estimatedPeakKw += inputs.ctCount * 50; // 50 kW avg per CT
  }
  if (inputs.orCount && inputs.orCount > 0) {
    estimatedPeakKw += inputs.orCount * 50; // 50 kW per OR
  }
  if (inputs.icuBeds && inputs.icuBeds > 0) {
    estimatedPeakKw += inputs.icuBeds * 5; // 5 kW per ICU bed
  }

  // Critical load breakdown
  const lifeSafetyKw = Math.round(estimatedPeakKw * 0.05);
  const criticalBranchKw = Math.round(estimatedPeakKw * 0.25);
  const equipmentBranchKw = Math.round(estimatedPeakKw * 0.2);
  const essentialKw = Math.round(estimatedPeakKw * 0.3);
  const totalCriticalKw = lifeSafetyKw + criticalBranchKw + equipmentBranchKw + essentialKw;

  // Backup analysis
  const currentGenCapacity = inputs.generatorCapacityKw || 0;
  const currentBackupAdequate = currentGenCapacity >= totalCriticalKw;
  const backupGapKw = Math.max(0, totalCriticalKw - currentGenCapacity);

  if (!currentBackupAdequate) {
    warnings.push(
      `Current generator capacity (${currentGenCapacity} kW) is below critical load (${totalCriticalKw} kW)`
    );
  }

  // Check for aging equipment
  if (inputs.generatorAge === "over15") {
    warnings.push("Generator over 15 years old — consider replacement or BESS supplement");
  }

  // Check for backup issues
  if (inputs.backupIssues?.includes("failedRecently")) {
    warnings.push("Recent backup failure — immediate attention required");
  }
  if (inputs.backupIssues?.includes("slowTransfer")) {
    recommendations.push("BESS provides instant transfer (< 20ms) vs generator (10+ seconds)");
  }

  // Runtime analysis
  const currentRuntime = inputs.currentRuntimeHours || inputs.fuelStorageHours || 0;
  const targetRuntime = inputs.targetRuntimeHours || 96; // 96 hour code minimum

  if (currentRuntime < 96) {
    complianceGaps.push("Fuel storage below 96-hour code minimum");
  }

  // BESS sizing
  // Size for: (1) instant transfer bridge, (2) peak shaving, (3) diesel reduction
  let bessMultiplier = 2; // 2 hours of critical load baseline

  if (inputs.priorities.includes("patientSafety")) bessMultiplier = 4;
  if (inputs.priorities.includes("reduceDiesel")) bessMultiplier = 4;
  if (inputs.outageFrequency === "frequently" || inputs.outageFrequency === "majorEvents") {
    bessMultiplier = 6;
  }

  const recommendedBessKwh = Math.round(totalCriticalKw * bessMultiplier);
  const bessCanBridge = recommendedBessKwh >= totalCriticalKw * 0.5; // Can bridge for 30 min

  // Solar sizing
  let recommendedSolarKw = 0;
  if (inputs.solarPotential === "significant") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.25);
  } else if (inputs.solarPotential === "moderate") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.15);
  } else if (inputs.solarPotential === "limited") {
    recommendedSolarKw = Math.round(estimatedPeakKw * 0.08);
  }

  // Generator sizing
  const redundancyRequired = (profile as any)?.redundancyRequired || false;
  const generatorMultiplier = redundancyRequired ? 1.5 : 1.0; // N+1 for larger facilities

  const recommendedGeneratorKw = Math.round(totalCriticalKw * generatorMultiplier);

  // Cost estimates
  let estimatedAnnualSpend: number;
  if (inputs.monthlyEnergySpend && inputs.monthlyEnergySpend > 0) {
    estimatedAnnualSpend = inputs.monthlyEnergySpend * 12;
  } else {
    const energyRate = 0.1; // $/kWh healthcare avg
    const demandRate = 15; // $/kW
    estimatedAnnualSpend = estimatedAnnualKwh * energyRate + estimatedPeakKw * demandRate * 12;
  }

  // Savings
  const demandChargeSavings = Math.round(estimatedPeakKw * 15 * 12 * 0.25); // 25% demand reduction
  const solarSavings = Math.round(recommendedSolarKw * 400);
  const annualSavings = demandChargeSavings + solarSavings;

  // Compliance check
  let meetsCodeRequirements = true;
  if (currentRuntime < 96) meetsCodeRequirements = false;
  if (!currentBackupAdequate) meetsCodeRequirements = false;

  if (inputs.complianceRequirements?.includes("jointCommission")) {
    recommendations.push(
      "Joint Commission survey upcoming — ensure backup documentation is current"
    );
  }

  // Confidence level
  let confidenceLevel: "low" | "medium" | "high" = "medium";
  if (inputs.monthlyEnergySpend && inputs.generatorCapacityKw) {
    confidenceLevel = "high";
  }
  if (
    !inputs.bedCount &&
    inputs.facilityType !== "clinic" &&
    inputs.facilityType !== "medicalOffice"
  ) {
    confidenceLevel = "low";
  }

  return {
    estimatedPeakKw: Math.round(estimatedPeakKw),
    estimatedAnnualKwh: Math.round(estimatedAnnualKwh),
    estimatedAnnualSpend: Math.round(estimatedAnnualSpend),
    lifeSafetyKw,
    criticalBranchKw,
    equipmentBranchKw,
    essentialKw,
    totalCriticalKw,
    recommendedBessKwh,
    recommendedSolarKw,
    recommendedGeneratorKw,
    currentBackupAdequate,
    backupGapKw,
    bessCanBridge,
    annualSavings,
    demandChargeSavings,
    solarSavings,
    meetsCodeRequirements,
    complianceGaps,
    confidenceLevel,
    warnings,
    recommendations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQuestionsForHospital(facilityType?: string) {
  return HOSPITAL_QUESTIONS;
}

export default {
  HOSPITAL_PROFILES,
  CRITICAL_LOAD_TIERS,
  CRITICAL_SERVICES,
  HIGH_DRAW_EQUIPMENT,
  HOSPITAL_BACKUP_OPTIONS,
  BACKUP_ISSUES,
  COMPLIANCE_REQUIREMENTS,
  HOSPITAL_QUESTIONS,
  calculateHospitalProfile,
  getQuestionsForHospital,
};
