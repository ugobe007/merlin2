/**
 * Complete Hotel Questionnaire Configuration
 *
 * 16 questions across 4 sections — focused on technical facility profile.
 * All question IDs align with the HOTEL_LOAD_V1_SSOT calculator adapter
 * in registry.ts (requiredInputs: roomCount, hotelClass, occupancyRate).
 *
 * Sections:
 *   1. Facility (Q1-5)   — hotelCategory, numRooms, squareFootage, occupancyRate, buildingAge
 *   2. Amenities (Q6-10) — poolOnSite, restaurantOnSite, spaOnSite, laundryOnSite, evChargingForGuests
 *   3. Energy (Q11-13)   — gridConnection, gridReliability, existingGenerator
 *   4. Solar (Q14-16) — roofArea, canopyInterest, existingSolar, (solarCapacityKW conditional)
 *
 * NOTE: Business goals (primaryGoal, budgetTimeline) moved to Step 3.5 (Add-ons) intro screen.
 *
 * Calculator mapping:
 *   hotelCategory → hotelClass (via option value mapping)
 *   numRooms → roomCount
 *   occupancyRate → occupancyRate (mapped to %)
 *   poolOnSite → pool_on_site boolean
 *   restaurantOnSite → restaurant_on_site boolean
 *   spaOnSite → spa_on_site boolean
 *   laundryOnSite → laundry_on_site boolean
 *
 * Created: Feb 2026
 */

export interface Question {
  id: string;
  type:
    | 'buttons'
    | 'auto_confirm'
    | 'slider'
    | 'number_input'
    | 'toggle'
    | 'conditional_buttons'
    | 'type_then_quantity'
    | 'existing_then_planned'
    | 'increment_box'
    | 'wheel'
    | 'multiselect'
    | 'hours_grid'
    | 'range_buttons';
  rangeConfig?: {
    ranges: Array<{ label: string; min: number; max: number | null }>;
    suffix?: string;
  };
  fieldName?: string;
  section: string;
  title: string;
  subtitle?: string;
  helpText?: string;
  merlinTip?: string;
  options?: Array<{
    value: string;
    label: string;
    icon?: string | any;
    description?: string;
    disabled?: boolean;
  }>;
  range?: {
    min: number;
    max: number;
    step: number;
  };
  unit?: string;
  suffix?: string;
  placeholder?: string;
  smartDefault?: any;
  validation?: {
    required: boolean;
    min?: number;
    max?: number;
    customRule?: (value: any) => boolean | string;
  };
  conditionalLogic?: {
    dependsOn: string;
    showIf: (value: any) => boolean;
    modifyOptions?: (value: any) => any;
  };
  quantityOptions?: Array<{
    value: string;
    label: string;
    icon?: string | any;
    description?: string;
    quantityRange?: { min: number; max: number; step: number };
  }>;
  existingOptions?: Array<{
    value: string;
    label: string;
    icon?: string | any;
    description?: string;
  }>;
  plannedOptions?: Array<{
    value: string;
    label: string;
    icon?: string | any;
    description?: string;
  }>;
  impactsCalculations?: string[];
  questionTier?: string;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

// ============================================================================
// SECTIONS
// ============================================================================

export const hotelSections: Section[] = [
  {
    id: 'facility',
    title: 'Facility Details',
    description: 'Hotel classification and size',
    icon: '🏨',
  },
  {
    id: 'amenities',
    title: 'Amenities & Services',
    description: 'Energy-intensive amenities on-site',
    icon: '🛎️',
  },
  {
    id: 'energy',
    title: 'Energy & Grid',
    description: 'Grid connection and reliability',
    icon: '⚡',
  },
  {
    id: 'solar',
    title: 'Solar & Renewables',
    description: 'Renewable energy interest and existing systems',
    icon: '☀️',
  },
];

// ============================================================================
// SECTION 1: FACILITY DETAILS (Q1-Q5)
// ============================================================================

export const hotelQuestionsComplete: Question[] = [
  {
    id: 'hotelCategory',
    type: 'buttons',
    section: 'facility',
    title: 'Hotel category and service level',
    subtitle: 'Star rating defines service level, facilities, and energy intensity',
    helpText:
      'Hotel category affects HVAC sizing, lighting density, and amenity power requirements. Higher categories use significantly more energy per room.',
    options: [
      {
        value: '1-star',
        label: '⭐ 1-Star',
        icon: '⭐',
        description: 'Basic accommodation, essential needs only',
      },
      {
        value: '2-star',
        label: '⭐⭐ 2-Star',
        icon: '⭐',
        description: 'Budget hotel, private bathroom, daily housekeeping',
      },
      {
        value: '3-star',
        label: '⭐⭐⭐ 3-Star',
        icon: '⭐',
        description: 'Mid-range, 24hr reception, restaurant, room service',
      },
      {
        value: '4-star',
        label: '⭐⭐⭐⭐ 4-Star',
        icon: '⭐',
        description: 'Upscale — concierge, fitness, pool, multiple dining',
      },
      {
        value: '5-star',
        label: '🌟 5-Star',
        icon: '🌟',
        description: 'Luxury — spa, fine dining, high staff-to-guest ratio',
      },
      {
        value: 'boutique',
        label: '🎨 Boutique',
        icon: '🎨',
        description: 'Experience-driven, unique design, personalized service',
      },
    ],
    smartDefault: '3-star',
    merlinTip:
      '5-star hotels use 2-3× more energy per room than budget properties. Category drives HVAC, lighting, and amenity sizing.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'hvacLoad', 'amenityPower'],
  },
  {
    id: 'numRooms',
    type: 'slider',
    section: 'facility',
    title: 'How many guest rooms?',
    subtitle: 'Total number of bookable rooms',
    range: { min: 10, max: 1000, step: 5 },
    smartDefault: 150,
    unit: ' rooms',
    merlinTip:
      'Economy hotels average 50-100 rooms. Mid-range: 100-300. Full-service resorts: 300-1,000+.',
    validation: { required: true, min: 10, max: 1000 },
    impactsCalculations: ['peakDemand', 'hvacLoad', 'lightingLoad'],
  },
  {
    id: 'squareFootage',
    type: 'range_buttons',
    section: 'facility',
    title: 'Total facility size (approximate)',
    subtitle: 'Includes lobby, corridors, back-of-house — not just rooms',
    rangeConfig: {
      ranges: [
        { label: 'Small (< 25K)', min: 10000, max: 25000 },
        { label: 'Medium (25-75K)', min: 25000, max: 75000 },
        { label: 'Large (75-200K)', min: 75000, max: 200000 },
        { label: 'Resort (200K+)', min: 200000, max: null },
      ],
      suffix: ' sq ft',
    },
    smartDefault: '75000',
    merlinTip:
      'Rule of thumb: ~500 sq ft per room for mid-range, ~800+ sq ft per room for luxury/resort.',
    validation: { required: false },
    impactsCalculations: ['hvacLoad', 'lightingLoad'],
  },
  {
    id: 'occupancyRate',
    type: 'buttons',
    section: 'facility',
    title: 'Average annual occupancy rate',
    subtitle: 'Affects baseload vs peak energy profile',
    options: [
      {
        value: 'high',
        label: 'High (75-100%)',
        icon: '📈',
        description: 'Convention hotels, downtown locations',
      },
      {
        value: 'medium',
        label: 'Medium (50-75%)',
        icon: '📊',
        description: 'Standard year-round operation',
      },
      {
        value: 'seasonal',
        label: 'Seasonal',
        icon: '🍂',
        description: 'Resort, beach, or ski properties',
      },
      {
        value: 'low',
        label: 'Low (< 50%)',
        icon: '📉',
        description: 'New properties or secondary markets',
      },
    ],
    smartDefault: 'medium',
    merlinTip:
      'Higher occupancy = higher consistent baseload. Seasonal properties benefit most from storage to manage peak-to-trough swings.',
    validation: { required: true },
    impactsCalculations: ['annualConsumption', 'peakDemand'],
  },
  {
    id: 'buildingAge',
    type: 'buttons',
    section: 'facility',
    title: 'Building age / renovation status',
    subtitle: 'Older buildings typically have higher energy intensity',
    options: [
      {
        value: 'new',
        label: 'New Build',
        icon: '🏗️',
        description: 'Built in last 5 years',
      },
      {
        value: 'renovated',
        label: 'Recently Renovated',
        icon: '🔧',
        description: 'Major systems upgraded in last 10 years',
      },
      {
        value: 'aging',
        label: 'Aging Property',
        icon: '🏚️',
        description: '20+ years, original systems',
      },
    ],
    smartDefault: 'renovated',
    validation: { required: false },
    impactsCalculations: ['hvacLoad', 'lightingLoad'],
  },

  // ============================================================================
  // SECTION 2: AMENITIES & SERVICES (Q6-Q10)
  // ============================================================================
  {
    id: 'poolOnSite',
    type: 'buttons',
    section: 'amenities',
    title: 'Pool or hot tub on-site?',
    subtitle: 'Pools add 30-80 kW of pump, heating, and filtration load',
    options: [
      {
        value: 'indoor',
        label: 'Indoor Pool',
        icon: '🏊',
        description: 'Year-round heated, higher energy use',
      },
      {
        value: 'outdoor',
        label: 'Outdoor Pool',
        icon: '☀️',
        description: 'Seasonal, solar-assisted heating',
      },
      {
        value: 'both',
        label: 'Both',
        icon: '🏊‍♀️',
        description: 'Indoor + outdoor facilities',
      },
      {
        value: 'none',
        label: 'No Pool',
        icon: '❌',
        description: 'No aquatic facilities',
      },
    ],
    smartDefault: 'outdoor',
    merlinTip:
      'Indoor pools add 50-80 kW for heating, dehumidification, and filtration. Outdoor pools: 30-50 kW seasonal.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'amenityPower'],
  },
  {
    id: 'restaurantOnSite',
    type: 'buttons',
    section: 'amenities',
    title: 'Restaurant or commercial kitchen?',
    subtitle: 'Commercial kitchens are the 2nd-highest energy consumer in hotels',
    options: [
      {
        value: 'full-service',
        label: 'Full-Service Restaurant',
        icon: '🍽️',
        description: 'Full kitchen, breakfast + dinner service',
      },
      {
        value: 'breakfast-only',
        label: 'Breakfast/Café Only',
        icon: '☕',
        description: 'Continental or hot breakfast service',
      },
      {
        value: 'bar-lounge',
        label: 'Bar/Lounge',
        icon: '🍸',
        description: 'Bar service, light food only',
      },
      {
        value: 'none',
        label: 'No F&B',
        icon: '❌',
        description: 'No food or beverage facilities',
      },
    ],
    smartDefault: 'breakfast-only',
    merlinTip:
      'A full-service restaurant kitchen can add 80-200 kW. Breakfast-only: 20-40 kW. Bar/lounge: 10-20 kW.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'processLoad'],
  },
  {
    id: 'spaOnSite',
    type: 'buttons',
    section: 'amenities',
    title: 'Spa or fitness center?',
    subtitle: 'Spas have high HVAC and hot water demands',
    options: [
      {
        value: 'full-spa',
        label: 'Full Spa',
        icon: '💆',
        description: 'Treatment rooms, sauna, steam, hot tubs',
      },
      {
        value: 'fitness-only',
        label: 'Fitness Center Only',
        icon: '🏋️',
        description: 'Gym equipment, minimal water use',
      },
      {
        value: 'both',
        label: 'Spa + Fitness',
        icon: '🧖',
        description: 'Full wellness complex',
      },
      {
        value: 'none',
        label: 'Neither',
        icon: '❌',
        description: 'No spa or fitness amenities',
      },
    ],
    smartDefault: 'fitness-only',
    merlinTip:
      'Full spa facilities add 40-100 kW for hot water, HVAC zoning, sauna/steam, and treatment equipment.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'amenityPower'],
  },
  {
    id: 'laundryOnSite',
    type: 'buttons',
    section: 'amenities',
    title: 'On-site commercial laundry?',
    subtitle: 'Laundry is a major energy consumer: 15-50 kW depending on volume',
    options: [
      {
        value: 'full',
        label: 'Full Laundry',
        icon: '🧺',
        description: 'All linens processed on-site',
      },
      {
        value: 'partial',
        label: 'Partial',
        icon: '👕',
        description: 'Some items outsourced',
      },
      {
        value: 'outsourced',
        label: 'Fully Outsourced',
        icon: '🚛',
        description: 'All laundry sent off-site',
      },
    ],
    smartDefault: 'partial',
    merlinTip:
      'Full on-site laundry for 150-room hotel: ~30-50 kW. Water heating is the dominant cost. Consider solar thermal.',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'processLoad'],
  },
  {
    id: 'evChargingForGuests',
    type: 'buttons',
    section: 'amenities',
    title: 'EV charging for guests?',
    subtitle: 'Tells us about your current load. You can add EV charging infrastructure in the results step.',
    options: [
      {
        value: 'existing',
        label: 'Already Have',
        icon: '⚡',
        description: 'Chargers installed and operational',
      },
      {
        value: 'planned',
        label: 'Planning to Add',
        icon: '📋',
        description: 'In next 12 months',
      },
      {
        value: 'interested',
        label: 'Interested',
        icon: '🤔',
        description: 'Exploring options',
      },
      {
        value: 'no',
        label: 'Not Interested',
        icon: '❌',
        description: 'Not a priority',
      },
    ],
    conditionalLogic: {
      dependsOn: 'hotelCategory',
      showIf: () => true,
    },
    smartDefault: 'interested',
    merlinTip:
      'Hotels adding EV chargers see 10-20% higher booking rates from EV-driving guests. Pairing with BESS avoids demand charge spikes.',
    validation: { required: false },
    impactsCalculations: ['chargingLoad', 'peakDemand'],
  },

  // ============================================================================
  // SECTION 3: ENERGY & GRID (Q11-Q13)
  // ============================================================================
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection status',
    subtitle: 'How is the property connected to the utility grid?',
    options: [
      {
        value: 'on-grid',
        label: 'On-Grid',
        icon: '🔌',
        description: 'Full utility connection, reliable supply',
      },
      {
        value: 'limited',
        label: 'Limited Grid',
        icon: '⚠️',
        description: 'Capacity constraints or frequent curtailment',
      },
      {
        value: 'off-grid',
        label: 'Off-Grid',
        icon: '🏝️',
        description: 'Remote location, no utility connection',
      },
    ],
    smartDefault: 'on-grid',
    validation: { required: true },
    impactsCalculations: ['systemArchitecture', 'generatorSizing'],
  },
  {
    id: 'gridReliability',
    type: 'buttons',
    section: 'energy',
    title: 'Grid reliability in your area',
    subtitle: 'How often do you experience power outages?',
    options: [
      {
        value: 'reliable',
        label: 'Reliable',
        icon: '✅',
        description: 'Rare outages (< 2/year)',
      },
      {
        value: 'moderate',
        label: 'Moderate',
        icon: '⚠️',
        description: 'Occasional outages (2-6/year)',
      },
      {
        value: 'unreliable',
        label: 'Unreliable',
        icon: '❌',
        description: 'Frequent outages (monthly or more)',
      },
    ],
    smartDefault: 'reliable',
    merlinTip:
      'Hotels with unreliable grids should size BESS for 4-8 hours of critical load backup. Guest experience during outages is a major brand risk.',
    validation: { required: false },
    impactsCalculations: ['backupDuration', 'generatorSizing'],
  },
  {
    id: 'existingGenerator',
    type: 'buttons',
    section: 'energy',
    title: 'Existing backup generator?',
    subtitle: 'BESS can augment or replace aging generators',
    options: [
      {
        value: 'diesel',
        label: 'Diesel Generator',
        icon: '⛽',
        description: 'Traditional backup, fuel-dependent',
      },
      {
        value: 'natural-gas',
        label: 'Natural Gas',
        icon: '🔥',
        description: 'Cleaner, continuous fuel supply',
      },
      {
        value: 'none',
        label: 'No Generator',
        icon: '❌',
        description: 'No existing backup power',
      },
    ],
    smartDefault: 'none',
    merlinTip:
      'Aging diesel generators (10+ years) are expensive to maintain. BESS provides instant switchover — no 10-30 second gap like generators.',
    validation: { required: false },
    impactsCalculations: ['generatorSizing', 'systemArchitecture'],
  },

  // ============================================================================
  // SECTION 4: SOLAR & GOALS (Q14-Q18)
  // ============================================================================
  {
    id: 'roofArea',
    type: 'slider',
    section: 'solar',
    title: 'Approximate building roof area?',
    subtitle: 'Building footprint / roof space — we\'ll calculate usable solar area',
    range: { min: 0, max: 75000, step: 500 },
    smartDefault: 20000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 75000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over guest parking?',
    subtitle: 'Guest parking shade structures generate solar power — perfect for hotels with large lots',
    options: [
      { value: 'yes', label: 'Yes, Interested', icon: '🏗️', description: 'Generates solar + provides shade' },
      { value: 'learn_more', label: 'Tell Me More', icon: '💡', description: 'Want to learn the benefits' },
      { value: 'no', label: 'Not Now', icon: '❌', description: 'Roof solar only for now' },
    ],
    smartDefault: 'learn_more',
    validation: { required: false },
    impactsCalculations: ['carportSolar', 'solarCapacity'],
  },
  {
    id: 'existingSolar',
    type: 'buttons',
    section: 'solar',
    title: 'Existing solar installation?',
    subtitle: 'Understanding your current solar helps us design the optimal BESS pairing.',
    options: [
      {
        value: 'yes',
        label: 'Yes — On-Site Solar',
        icon: '☀️',
        description: 'Already generating solar power',
      },
      {
        value: 'planned',
        label: 'Planning Solar',
        icon: '📋',
        description: 'Solar + BESS together saves 15-20% more',
      },
      {
        value: 'no',
        label: 'No Solar Yet',
        icon: '🔌',
        description: 'BESS alone still cuts demand charges 20-40%',
      },
    ],
    smartDefault: 'no',
    merlinTip:
      'Hotels with flat rooftops are ideal for solar. A 150-room hotel typically has space for 100-250 kW of rooftop solar.',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'financials'],
  },
  {
    id: 'solarCapacityKW',
    type: 'number_input',
    section: 'solar',
    title: 'Existing solar system size',
    subtitle: 'Approximate capacity of your current solar installation',
    placeholder: 'e.g., 100',
    suffix: 'kW',
    smartDefault: 100,
    helpText: 'Check your solar inverter or installer documentation for the rated capacity. Typical hotel rooftop systems range from 50-500 kW.',
    validation: { required: false, min: 1, max: 5000 },
    impactsCalculations: ['solarSizing', 'bessMode'],
    conditionalLogic: {
      dependsOn: 'existingSolar',
      showIf: (value: unknown) => value === 'yes',
    },
  },
];

