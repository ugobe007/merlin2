/**
 * Complete Restaurant Questionnaire Configuration
 *
 * 16 questions across 4 sections — matching gold-standard format.
 * All question IDs align with the RESTAURANT_LOAD_V1_SSOT calculator adapter
 * in registry.ts (requiredInputs: seatingCapacity).
 *
 * Sections:
 *   1. Facility (Q1-5)    — restaurantType, seatingCapacity, squareFootage, kitchenType, operatingHours
 *   2. Equipment (Q6-10)  — cookingEquipment, refrigeration, exhaustHood, dishwasher, barArea
 *   3. Energy (Q11-13)    — gridConnection, gridReliability, existingGenerator
 *   4. Solar & Goals (Q14-16) — existingSolar, primaryGoal, budgetTimeline
 *
 * Calculator mapping:
 *   restaurantType → restaurantType (direct: full-service, fast-food, cafe, casual, fine-dining, buffet, food-hall)
 *   seatingCapacity → seatingCapacity (direct: numeric)
 *
 * Created: Feb 2026
 */

import type { Question, Section } from "./hotel-questions-complete.config";

// ============================================================================
// SECTIONS
// ============================================================================

export const restaurantSections: Section[] = [
  {
    id: "facility",
    title: "Restaurant Profile",
    description: "Type, size, and capacity",
    icon: "🍽️",
  },
  {
    id: "equipment",
    title: "Kitchen & Equipment",
    description: "Cooking, refrigeration, and dishwashing",
    icon: "👨‍🍳",
  },
  {
    id: "energy",
    title: "Energy & Grid",
    description: "Grid connection and reliability",
    icon: "⚡",
  },
  {
    id: "solar",
    title: "Solar & Goals",
    description: "Renewable interest and project goals",
    icon: "☀️",
  },
];

// ============================================================================
// SECTION 1: FACILITY (Q1-Q5)
// ============================================================================

export const restaurantQuestionsComplete: Question[] = [
  {
    id: "restaurantType",
    type: "buttons",
    section: "facility",
    title: "Type of restaurant",
    subtitle: "Service model defines kitchen intensity, hours, and energy profile",
    helpText:
      "Full-service restaurants use 2-3x more energy than quick-service due to extensive kitchen equipment, HVAC demands from cooking heat, and longer operating hours.",
    options: [
      {
        value: "fast-food",
        label: "Quick Service / Fast Food",
        icon: "🍔",
        description: "Drive-thru, fryers, grills, high throughput",
      },
      {
        value: "cafe",
        label: "Café / Coffee Shop",
        icon: "☕",
        description: "Espresso, pastry display, light cooking",
      },
      {
        value: "casual",
        label: "Casual Dining",
        icon: "🍕",
        description: "Mid-range kitchen, bar, full HVAC",
      },
      {
        value: "full-service",
        label: "Full-Service Restaurant",
        icon: "🍽️",
        description: "Full kitchen, hood exhaust, dining HVAC",
      },
      {
        value: "fine-dining",
        label: "Fine Dining",
        icon: "🥂",
        description: "Intensive kitchen, wine storage, ambience",
      },
      {
        value: "buffet",
        label: "Buffet / Food Hall",
        icon: "🥘",
        description: "Steam tables, large refrigeration, high HVAC",
      },
    ],
    smartDefault: "full-service",
    merlinTip:
      "Fine dining uses ~550 W/seat (wine storage, intensive kitchen, ambience lighting). Quick-service uses ~200 W/seat but runs more hours.",
    validation: { required: true },
    impactsCalculations: ["peakDemand", "dutyCycle", "equipmentLoad"],
  },
  {
    id: "seatingCapacity",
    type: "slider",
    section: "facility",
    title: "Seating capacity",
    subtitle: "Total number of seats (indoor + patio)",
    helpText:
      "Seating capacity is the primary driver of kitchen equipment sizing, HVAC load, and power demand. Even small restaurants have significant fixed kitchen infrastructure.",
    range: { min: 10, max: 500, step: 5 },
    smartDefault: 100,
    unit: " seats",
    merlinTip:
      "Kitchen base load is fixed at 15-60 kW regardless of seats (walk-in, hood, dishwasher). Seats add ~200-550 W each depending on type.",
    validation: { required: true, min: 10, max: 500 },
    impactsCalculations: ["peakDemand", "kitchenLoad", "hvacLoad"],
  },
  {
    id: "squareFootage",
    type: "slider",
    section: "facility",
    title: "Total square footage",
    subtitle: "Include kitchen, dining, storage, and restrooms",
    range: { min: 500, max: 20000, step: 100 },
    smartDefault: 3000,
    unit: " sq ft",
    merlinTip:
      "CBECS median restaurant: ~20 sq ft per seat. Kitchen typically 30-40% of total area.",
    validation: { required: true, min: 500, max: 20000 },
    impactsCalculations: ["hvacLoad", "lightingLoad"],
  },
  {
    id: "kitchenType",
    type: "buttons",
    section: "facility",
    title: "Kitchen complexity",
    subtitle: "How intensive is your kitchen equipment?",
    options: [
      {
        value: "light",
        label: "Light Prep",
        icon: "🥗",
        description: "Sandwiches, salads, minimal cooking",
      },
      {
        value: "standard",
        label: "Standard Kitchen",
        icon: "🍳",
        description: "Grill, oven, fryer, standard hood",
      },
      {
        value: "heavy",
        label: "Heavy / Commercial",
        icon: "🔥",
        description: "Multiple stations, charbroiler, wok, pizza oven",
      },
    ],
    smartDefault: "standard",
    validation: { required: true },
    impactsCalculations: ["peakDemand", "equipmentLoad"],
  },
  {
    id: "operatingHours",
    type: "buttons",
    section: "facility",
    title: "Operating hours",
    subtitle: "When are you open for service?",
    options: [
      {
        value: "breakfast-lunch",
        label: "Breakfast + Lunch",
        icon: "🌅",
        description: "6 AM - 3 PM (daytime only)",
      },
      {
        value: "lunch-dinner",
        label: "Lunch + Dinner",
        icon: "🌆",
        description: "11 AM - 10 PM",
      },
      {
        value: "dinner-only",
        label: "Dinner Only",
        icon: "🌙",
        description: "4 PM - 11 PM (fine dining typical)",
      },
      {
        value: "full-day",
        label: "Full Day",
        icon: "☀️",
        description: "6 AM - 11 PM (all meals)",
      },
      {
        value: "24-7",
        label: "24/7",
        icon: "🌐",
        description: "Always open (diner, fast food)",
      },
    ],
    smartDefault: "lunch-dinner",
    merlinTip:
      "Longer hours = higher energy but lower peak-to-average ratio (better for BESS economics).",
    validation: { required: true },
    impactsCalculations: ["dutyCycle", "annualConsumption"],
  },

  // ============================================================================
  // SECTION 2: KITCHEN & EQUIPMENT (Q6-Q10)
  // ============================================================================

  {
    id: "cookingEquipment",
    type: "buttons",
    section: "equipment",
    title: "Primary cooking fuel",
    subtitle: "Electric kitchens have higher electrical demand",
    options: [
      {
        value: "all-electric",
        label: "All-Electric",
        icon: "⚡",
        description: "Electric ovens, induction, no gas",
      },
      {
        value: "gas-primary",
        label: "Gas Primary",
        icon: "🔥",
        description: "Gas range/oven, electric for specialty",
      },
      {
        value: "mixed",
        label: "Mixed Gas + Electric",
        icon: "🔄",
        description: "Some gas, some electric appliances",
      },
    ],
    smartDefault: "gas-primary",
    merlinTip:
      "All-electric kitchens draw 40-80% more electrical power but qualify for electrification incentives.",
    validation: { required: true },
    impactsCalculations: ["peakDemand"],
  },
  {
    id: "refrigeration",
    type: "buttons",
    section: "equipment",
    title: "Refrigeration setup",
    subtitle: "Walk-in coolers and freezers are significant always-on loads",
    options: [
      {
        value: "minimal",
        label: "Minimal",
        icon: "🟢",
        description: "Reach-in only, small display case",
      },
      {
        value: "standard",
        label: "Standard",
        icon: "🟡",
        description: "Walk-in cooler + reach-in units",
      },
      {
        value: "extensive",
        label: "Extensive",
        icon: "🔴",
        description: "Walk-in cooler + freezer + display cases",
      },
    ],
    smartDefault: "standard",
    merlinTip: "Walk-in coolers run 24/7 and draw 3-8 kW. This is your biggest overnight baseload.",
    validation: { required: true },
    impactsCalculations: ["baseLoad", "annualConsumption"],
  },
  {
    id: "exhaustHood",
    type: "buttons",
    section: "equipment",
    title: "Kitchen exhaust hood system",
    subtitle: "Hood exhaust fans are one of the largest single electrical loads",
    options: [
      {
        value: "none",
        label: "No Hood",
        icon: "❌",
        description: "Café/prep only, no cooking",
      },
      {
        value: "standard",
        label: "Standard Hood",
        icon: "💨",
        description: "Single hood over cooking line",
      },
      {
        value: "large",
        label: "Large / Multiple",
        icon: "🌪️",
        description: "Multiple hoods, charbroiler hoods",
      },
    ],
    smartDefault: "standard",
    merlinTip:
      "A single commercial hood draws 2-5 HP (1.5-3.7 kW). Charbroiler hoods can draw 10+ HP.",
    validation: { required: true },
    impactsCalculations: ["peakDemand"],
  },
  {
    id: "dishwasher",
    type: "buttons",
    section: "equipment",
    title: "Dishwashing system",
    subtitle: "Commercial dishwashers use significant hot water and electricity",
    options: [
      {
        value: "none",
        label: "None / Disposable",
        icon: "🥤",
        description: "Disposable serviceware (fast food)",
      },
      {
        value: "under-counter",
        label: "Under-Counter",
        icon: "🍽️",
        description: "Small commercial unit",
      },
      {
        value: "conveyor",
        label: "Conveyor / Flight",
        icon: "🏭",
        description: "High-capacity continuous wash",
      },
    ],
    smartDefault: "under-counter",
    validation: { required: true },
    impactsCalculations: ["peakDemand", "waterHeating"],
  },
  {
    id: "barArea",
    type: "buttons",
    section: "equipment",
    title: "Bar or beverage area",
    subtitle: "Bars add ice machines, glass washers, and display refrigeration",
    options: [
      {
        value: "none",
        label: "No Bar",
        icon: "❌",
        description: "No bar service",
      },
      {
        value: "small",
        label: "Small Bar",
        icon: "🍺",
        description: "Beer/wine, basic cocktails",
      },
      {
        value: "full",
        label: "Full Bar",
        icon: "🍸",
        description: "Full cocktail bar, ice machine, glass washer",
      },
    ],
    smartDefault: "none",
    validation: { required: false },
    impactsCalculations: ["baseLoad"],
  },

  // ============================================================================
  // SECTION 3: ENERGY & GRID (Q11-Q13)
  // ============================================================================

  {
    id: "gridConnection",
    type: "buttons",
    section: "energy",
    title: "Grid connection status",
    subtitle: "Your utility connection affects BESS sizing and economics",
    options: [
      {
        value: "on-grid",
        label: "On-Grid",
        icon: "🔌",
        description: "Full utility connection, reliable grid",
      },
      {
        value: "limited",
        label: "Limited Capacity",
        icon: "⚠️",
        description: "Panel at capacity, can't add more load",
      },
      {
        value: "off-grid",
        label: "Off-Grid",
        icon: "🏝️",
        description: "Remote location, no utility available",
      },
    ],
    smartDefault: "on-grid",
    validation: { required: true },
    impactsCalculations: ["systemSizing", "batteryConfig"],
  },
  {
    id: "gridReliability",
    type: "buttons",
    section: "energy",
    title: "Grid reliability",
    subtitle: "How often do you experience outages?",
    options: [
      {
        value: "reliable",
        label: "Reliable",
        icon: "✅",
        description: "Rarely loses power",
      },
      {
        value: "moderate",
        label: "Occasional Issues",
        icon: "⚠️",
        description: "Few outages per year",
      },
      {
        value: "unreliable",
        label: "Frequent Outages",
        icon: "🔴",
        description: "Regular power interruptions",
      },
    ],
    smartDefault: "reliable",
    validation: { required: true },
    impactsCalculations: ["backupSizing"],
  },
  {
    id: "existingGenerator",
    type: "buttons",
    section: "energy",
    title: "Existing backup generator",
    options: [
      {
        value: "diesel",
        label: "Diesel Generator",
        icon: "⛽",
        description: "Traditional backup power",
      },
      {
        value: "natural-gas",
        label: "Natural Gas Generator",
        icon: "🔥",
        description: "Cleaner backup power",
      },
      {
        value: "none",
        label: "No Generator",
        icon: "❌",
        description: "No backup power currently",
      },
    ],
    smartDefault: "none",
    merlinTip:
      "BESS can replace or supplement generators with faster response time and zero emissions.",
    validation: { required: true },
    impactsCalculations: ["backupSizing", "generatorIntegration"],
  },

  // ============================================================================
  // SECTION 4: SOLAR & GOALS (Q14-Q16)
  // ============================================================================

  {
    id: "existingSolar",
    type: "buttons",
    section: "solar",
    title: "Existing or planned solar",
    options: [
      {
        value: "yes",
        label: "Have Solar",
        icon: "☀️",
        description: "Already installed",
      },
      {
        value: "planned",
        label: "Planning Solar",
        icon: "📋",
        description: "In planning stages",
      },
      {
        value: "no",
        label: "No Solar",
        icon: "❌",
        description: "Not considering solar",
      },
    ],
    smartDefault: "no",
    validation: { required: true },
    impactsCalculations: ["solarIntegration"],
  },
  {
    id: "primaryGoal",
    type: "buttons",
    section: "solar",
    title: "Primary goal for energy storage",
    subtitle: "What matters most to your business?",
    options: [
      {
        value: "cost-savings",
        label: "Reduce Bills",
        icon: "💰",
        description: "Lower demand charges and energy costs",
      },
      {
        value: "backup-power",
        label: "Backup Power",
        icon: "🔋",
        description: "Keep kitchen running during outages",
      },
      {
        value: "peak-shaving",
        label: "Peak Shaving",
        icon: "📉",
        description: "Reduce demand charge spikes",
      },
      {
        value: "sustainability",
        label: "Sustainability",
        icon: "🌍",
        description: "Environmental commitment",
      },
    ],
    smartDefault: "cost-savings",
    validation: { required: true },
    impactsCalculations: ["bessApplication"],
  },
  {
    id: "budgetTimeline",
    type: "buttons",
    section: "solar",
    title: "Project timeline",
    subtitle: "When are you looking to implement?",
    options: [
      {
        value: "immediate",
        label: "ASAP",
        icon: "🚀",
        description: "Ready to move forward now",
      },
      {
        value: "6-months",
        label: "3-6 Months",
        icon: "📅",
        description: "Planning phase",
      },
      {
        value: "1-year",
        label: "6-12 Months",
        icon: "📆",
        description: "Budgeting for next year",
      },
      {
        value: "exploring",
        label: "Just Exploring",
        icon: "🔍",
        description: "Early research phase",
      },
    ],
    smartDefault: "exploring",
    validation: { required: false },
    impactsCalculations: [],
  },
];
