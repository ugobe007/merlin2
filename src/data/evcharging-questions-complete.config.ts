/**
 * Complete EV Charging Station Questionnaire Configuration
 *
 * 18 questions across 4 sections — matching car wash gold-standard format.
 * All question IDs align with the EV_CHARGING_LOAD_V1_SSOT calculator adapter
 * in registry.ts (requiredInputs: level2Chargers, dcfcChargers).
 *
 * Sections:
 *   1. Site (Q1-4)              — stationType, operatingHours, siteSize, parkingSpaces
 *   2. Chargers (Q5-10)         — level2Chargers, level2Power, dcFastChargers, dcFastPower, hpcChargers, utilizationProfile
 *   3. Grid & Demand (Q11-13)   — gridConnection, peakConcurrency, siteDemandCap
 *   4. Solar & Goals (Q14-18)   — roofArea, canopyInterest, existingSolar, primaryGoal, budgetTimeline
 *
 * Calculator mapping:
 *   level2Chargers → level2Chargers (adapter) → numberOfLevel2Chargers (SSOT)
 *   level2Power → level2PowerKW (adapter)
 *   dcFastChargers → dcfcChargers (adapter) → numberOfDCFastChargers (SSOT)
 *   dcFastPower → (informational — adapter uses 150kW default)
 *   hpcChargers → hpcChargers (adapter, adds 250kW contribution)
 *   peakConcurrency → (informational — SSOT handles concurrency internally)
 *   siteDemandCap → siteDemandCapKW (adapter, enforces proportional scaling)
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
  section: 'site' | 'chargers' | 'grid' | 'solar';
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

export const evChargingSections: Section[] = [
  {
    id: 'site',
    title: 'Site Details',
    description: 'Station type and operating profile',
    icon: '📍',
  },
  {
    id: 'chargers',
    title: 'Charger Configuration',
    description: 'Level 2, DCFC, and HPC charger counts and power',
    icon: '🔌',
  },
  {
    id: 'grid',
    title: 'Grid & Demand',
    description: 'Grid connection, concurrency, and demand limits',
    icon: '⚡',
  },
  {
    id: 'solar',
    title: 'Solar & Goals',
    description: 'Renewable interest and project goals',
    icon: '☀️',
  },
];

// ============================================================================
// SECTION 1: SITE DETAILS (Q1-Q4)
// ============================================================================

export const evChargingQuestionsComplete: Question[] = [
  {
    id: 'stationType',
    type: 'buttons',
    section: 'site',
    title: 'What type of charging station?',
    subtitle: 'Station type determines utilization patterns and sizing approach',
    options: [
      {
        value: 'public-highway',
        label: 'Highway / Travel Center',
        icon: '🛣️',
        description: 'High-throughput, fast turnaround (20-30 min)',
      },
      {
        value: 'public-urban',
        label: 'Urban / City Center',
        icon: '🏙️',
        description: 'Mixed Level 2 + DCFC, moderate dwell time',
      },
      {
        value: 'workplace',
        label: 'Workplace / Corporate',
        icon: '🏢',
        description: 'Primarily Level 2, long dwell time (8+ hrs)',
      },
      {
        value: 'retail',
        label: 'Retail / Shopping',
        icon: '🛒',
        description: 'Level 2 + DCFC, 1-3 hour dwell',
      },
      {
        value: 'fleet',
        label: 'Fleet / Depot',
        icon: '🚛',
        description: 'Scheduled overnight or shift-based charging',
      },
      {
        value: 'destination',
        label: 'Destination (Hotel/Resort)',
        icon: '🏨',
        description: 'Overnight Level 2, some DCFC for day visitors',
      },
      {
        value: 'multifamily',
        label: 'Multi-Family Residential',
        icon: '🏠',
        description: 'Overnight Level 2 for apartment/condo residents',
      },
    ],
    smartDefault: 'public-urban',
    merlinTip:
      'Highway stations need mostly DCFC/HPC for fast turnaround. Workplace and residential sites are Level 2 dominated.',
    validation: { required: true },
    impactsCalculations: ['utilizationProfile', 'chargerMix', 'peakDemand'],
  },
  {
    id: 'operatingHours',
    type: 'buttons',
    section: 'site',
    title: 'Operating schedule',
    subtitle: 'When are chargers available for use?',
    options: [
      {
        value: '24-7',
        label: '24/7',
        icon: '🌙',
        description: 'Always available — highway, fleet, public',
      },
      {
        value: 'extended',
        label: 'Extended Hours',
        icon: '🌅',
        description: '6 AM - 11 PM',
      },
      {
        value: 'business',
        label: 'Business Hours',
        icon: '🏢',
        description: '8 AM - 6 PM (workplace/retail)',
      },
      {
        value: 'overnight',
        label: 'Overnight Only',
        icon: '🌃',
        description: '6 PM - 8 AM (residential/fleet)',
      },
    ],
    smartDefault: '24-7',
    merlinTip:
      '24/7 stations benefit most from BESS — off-peak charging + peak-shaving cuts demand charges by 40-60%.',
    validation: { required: true },
    impactsCalculations: ['utilizationProfile', 'annualConsumption'],
  },
  {
    id: 'siteSize',
    type: 'buttons',
    section: 'site',
    title: 'Site size classification',
    subtitle: 'Total charger-ready parking area',
    options: [
      {
        value: 'small',
        label: 'Small',
        icon: '🟢',
        description: '< 10 spaces, neighborhood location',
      },
      {
        value: 'medium',
        label: 'Medium',
        icon: '🟡',
        description: '10-30 spaces, commercial site',
      },
      {
        value: 'large',
        label: 'Large',
        icon: '🟠',
        description: '30-100 spaces, major hub',
      },
      {
        value: 'mega',
        label: 'Mega Hub',
        icon: '🔴',
        description: '100+ spaces, highway supercharger',
      },
    ],
    smartDefault: 'medium',
    validation: { required: false },
    impactsCalculations: ['siteCapacity'],
  },
  {
    id: 'parkingSpaces',
    type: 'slider',
    section: 'site',
    title: 'Total parking spaces with charging capability',
    subtitle: 'Include spaces planned for charger installation',
    range: { min: 2, max: 200, step: 2 },
    smartDefault: 20,
    unit: ' spaces',
    merlinTip:
      'Plan for 20-30% EV penetration growth per year. Size infrastructure for 5-year demand.',
    validation: { required: false, min: 2, max: 200 },
    impactsCalculations: ['siteCapacity'],
  },

  // ============================================================================
  // SECTION 2: CHARGER CONFIGURATION (Q5-Q10)
  // ============================================================================
  {
    id: 'level2Chargers',
    type: 'slider',
    section: 'chargers',
    title: 'Number of Level 2 chargers',
    subtitle: 'Level 2: 7-19 kW per port, 4-8 hour full charge',
    helpText: 'Best for: workplace, residential, retail, and destination charging with 2+ hour dwell time',
    range: { min: 0, max: 100, step: 1 },
    smartDefault: 12,
    unit: ' chargers',
    merlinTip:
      'Level 2 chargers are the workhorses of most sites. Low per-unit cost, manageable power demand, and high utilization for long-dwell locations.',
    validation: { required: true, min: 0, max: 100 },
    impactsCalculations: ['peakDemand', 'annualConsumption', 'chargingLoad'],
  },
  {
    id: 'level2Power',
    type: 'buttons',
    section: 'chargers',
    title: 'Level 2 charger power rating',
    subtitle: 'Higher power = faster charge, but more demand per port',
    options: [
      {
        value: '7',
        label: '7 kW',
        icon: '🔋',
        description: 'Basic L2 — 30 mi/hr',
      },
      {
        value: '11',
        label: '11 kW',
        icon: '🔋',
        description: 'Standard L2 — 45 mi/hr',
      },
      {
        value: '19',
        label: '19 kW',
        icon: '⚡',
        description: 'High-Power L2 — 65 mi/hr',
      },
    ],
    conditionalLogic: {
      dependsOn: 'level2Chargers',
      showIf: (value: any) => Number(value) > 0,
    },
    smartDefault: '7',
    merlinTip:
      '7 kW is standard for overnight/workplace. 11-19 kW for retail and destination with shorter dwell times.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'chargingLoad'],
  },
  {
    id: 'dcFastChargers',
    type: 'slider',
    section: 'chargers',
    title: 'Number of DC Fast Chargers (DCFC)',
    subtitle: 'DCFC: 50-150 kW per port, 20-60 min for 80% charge',
    helpText: 'Essential for highway corridors, urban hubs, and fleet depots. Creates significant demand spikes.',
    range: { min: 0, max: 50, step: 1 },
    smartDefault: 8,
    unit: ' chargers',
    merlinTip:
      '🚨 Each DCFC charger can draw 50-150 kW. BESS is critical for peak demand management — without it, demand charges can exceed $10,000/month.',
    validation: { required: true, min: 0, max: 50 },
    impactsCalculations: ['peakDemand', 'annualConsumption', 'chargingLoad'],
  },
  {
    id: 'dcFastPower',
    type: 'buttons',
    section: 'chargers',
    title: 'DCFC power rating per charger',
    subtitle: 'Higher power = faster charges but steeper demand spikes',
    options: [
      {
        value: '50',
        label: '50 kW',
        icon: '⚡',
        description: 'Standard DCFC — 20-40 min',
      },
      {
        value: '150',
        label: '150 kW',
        icon: '⚡⚡',
        description: 'High-Power DCFC — 15-25 min',
      },
    ],
    conditionalLogic: {
      dependsOn: 'dcFastChargers',
      showIf: (value: any) => Number(value) > 0,
    },
    smartDefault: '150',
    merlinTip:
      '150 kW chargers are the new standard. BESS buffers the demand spike — a single 150 kW charger can trigger $3,000/month in demand charges.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'chargingLoad'],
  },
  {
    id: 'hpcChargers',
    type: 'slider',
    section: 'chargers',
    title: 'High-Power Chargers (HPC: 250-350 kW)',
    subtitle: 'Ultra-fast charging for highway corridors and premium sites',
    helpText: 'Not yet in SSOT legacy path — adapter handles HPC contribution at 40% concurrency.',
    range: { min: 0, max: 20, step: 1 },
    smartDefault: 0,
    unit: ' chargers',
    merlinTip:
      '250-350 kW chargers can charge 200+ miles in 15 minutes. BESS is essentially mandatory — without it, grid upgrades can cost $500K+.',
    validation: { required: false, min: 0, max: 20 },
    impactsCalculations: ['peakDemand', 'chargingLoad'],
  },
  {
    id: 'utilizationProfile',
    type: 'buttons',
    section: 'chargers',
    title: 'Expected utilization pattern',
    subtitle: 'Average daily utilization across all chargers',
    options: [
      {
        value: 'low',
        label: 'Low (10-25%)',
        icon: '📉',
        description: 'New site ramp-up, rural location',
      },
      {
        value: 'medium',
        label: 'Medium (25-50%)',
        icon: '📊',
        description: 'Established urban or retail site',
      },
      {
        value: 'high',
        label: 'High (50-75%)',
        icon: '📈',
        description: 'Highway corridor, high-demand area',
      },
      {
        value: 'very-high',
        label: 'Very High (75%+)',
        icon: '🔥',
        description: 'Fleet depot, captive demand',
      },
    ],
    smartDefault: 'medium',
    merlinTip:
      'Fleet depots: 75%+. Highway: 50-75%. Urban/retail: 25-50%. Workplace: 15-30%. Higher utilization = better BESS ROI.',
    validation: { required: false },
    impactsCalculations: ['annualConsumption', 'financials'],
  },

  // ============================================================================
  // SECTION 3: GRID & DEMAND (Q11-Q13)
  // ============================================================================
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'grid',
    title: 'Grid connection status',
    subtitle: 'EV charging sites often have grid capacity constraints',
    options: [
      {
        value: 'on-grid',
        label: 'On-Grid',
        icon: '🔌',
        description: 'Full utility connection, adequate capacity',
      },
      {
        value: 'limited',
        label: 'Limited Grid',
        icon: '⚠️',
        description: 'Capacity constraints — BESS essential',
      },
      {
        value: 'off-grid',
        label: 'Off-Grid',
        icon: '🏝️',
        description: 'Remote — solar + BESS + generator required',
      },
      {
        value: 'microgrid',
        label: 'Microgrid',
        icon: '🔄',
        description: 'Local generation + storage island',
      },
    ],
    smartDefault: 'on-grid',
    merlinTip:
      'Over 40% of planned DCFC sites face grid capacity constraints. BESS allows deployment without expensive grid upgrades ($200K-$1M+ for transformer upgrades).',
    validation: { required: true },
    impactsCalculations: ['systemArchitecture', 'generatorSizing'],
  },
  {
    id: 'peakConcurrency',
    type: 'buttons',
    section: 'grid',
    title: 'Peak simultaneous charging',
    subtitle: 'What percentage of chargers will be in use at peak times?',
    options: [
      {
        value: '30',
        label: '30%',
        icon: '🌾',
        description: 'Rural / low-traffic site',
      },
      {
        value: '50',
        label: '50%',
        icon: '🏘️',
        description: 'Suburban / medium-traffic',
      },
      {
        value: '70',
        label: '70%',
        icon: '🏙️',
        description: 'Urban / high-traffic',
      },
      {
        value: '85',
        label: '85%',
        icon: '🛣️',
        description: 'Highway / travel center',
      },
      {
        value: '100',
        label: '100%',
        icon: '🚛',
        description: 'Fleet depot — all at once',
      },
    ],
    smartDefault: '50',
    merlinTip:
      'DCFC concurrency drives demand charges. At 70%+ concurrency with 8 DCFC chargers, monthly demand charges can exceed $8,000. BESS cuts this by 50-80%.',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'demandCharges'],
  },
  {
    id: 'siteDemandCap',
    type: 'buttons',
    section: 'grid',
    title: 'Site demand cap (if applicable)',
    subtitle: 'Utility or transformer limit on total site power draw',
    options: [
      {
        value: 'none',
        label: 'No Cap',
        icon: '♾️',
        description: 'Unlimited grid capacity',
      },
      {
        value: '200',
        label: '200 kW',
        icon: '📊',
        description: 'Small commercial transformer',
      },
      {
        value: '500',
        label: '500 kW',
        icon: '📈',
        description: 'Standard commercial service',
      },
      {
        value: '1000',
        label: '1 MW',
        icon: '⚡',
        description: 'Large commercial / industrial',
      },
      {
        value: '2000',
        label: '2 MW+',
        icon: '🏭',
        description: 'Dedicated substation',
      },
    ],
    smartDefault: 'none',
    merlinTip:
      'If your utility has imposed a demand cap, BESS is essential for operating within limits while still serving all chargers. Ask your utility for your service capacity.',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'systemArchitecture'],
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
    range: { min: 0, max: 15000, step: 100 },
    smartDefault: 2000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 15000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over charging stations?',
    subtitle: 'Solar canopy is the primary generation source for EV stations — essential for net-zero charging',
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
    subtitle: 'This helps us understand your current setup. You can add solar to your quote in the results step.',
    options: [
      {
        value: 'yes',
        label: 'Yes — On-Site Solar',
        icon: '☀️',
        description: 'Already generating solar power',
      },
      {
        value: 'canopy',
        label: 'Solar Canopy Planned',
        icon: '⛱️',
        description: 'EV parking canopies with solar panels',
      },
      {
        value: 'planned',
        label: 'Planning Solar',
        icon: '📋',
        description: 'Roof or ground mount planned',
      },
      {
        value: 'no',
        label: 'No Solar Yet',
        icon: '🔌',
        description: 'BESS alone provides grid services + demand savings',
      },
    ],
    smartDefault: 'no',
    merlinTip:
      'Solar canopies over EV parking are a brand statement + revenue generator. Typical canopy: 50-200 kW. Offsets 20-40% of charging energy cost.',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'financials'],
  },
  {
    id: 'solarCapacityKW',
    type: 'number',
    section: 'solar',
    title: 'Existing solar system size',
    subtitle: 'Approximate capacity of your current solar or canopy installation',
    placeholder: 'e.g., 150',
    suffix: 'kW',
    smartDefault: 150,
    helpText: 'EV charging solar canopies typically range from 50-200 kW. Ground or roof-mount systems can be larger.',
    validation: { required: false, min: 1, max: 10000 },
    impactsCalculations: ['solarSizing', 'bessMode'],
    conditionalLogic: {
      dependsOn: 'existingSolar',
      showIf: (value: unknown) => value === 'yes' || value === 'canopy',
    },
  },
  {
    id: 'primaryGoal',
    type: 'buttons',
    section: 'solar',
    title: 'Primary goal for energy storage',
    subtitle: 'This shapes system sizing and financial projections',
    options: [
      {
        value: 'demand-management',
        label: 'Demand Management',
        icon: '📉',
        description: 'Reduce demand charges from EV chargers',
      },
      {
        value: 'grid-constraint',
        label: 'Grid Constraint Workaround',
        icon: '⚠️',
        description: 'Deploy more chargers within grid limits',
      },
      {
        value: 'cost-savings',
        label: 'Energy Cost Savings',
        icon: '💰',
        description: 'TOU arbitrage + demand charge reduction',
      },
      {
        value: 'resilience',
        label: 'Resilience / Backup',
        icon: '🔋',
        description: 'Keep chargers running during outages',
      },
      {
        value: 'sustainability',
        label: 'Sustainability',
        icon: '🌍',
        description: 'Net-zero charging, green branding',
      },
    ],
    smartDefault: 'demand-management',
    merlinTip:
      'For most EV charging sites, demand management is the #1 ROI driver — BESS typically reduces demand charges by 40-70%.',
    validation: { required: true },
    impactsCalculations: ['systemSizing', 'financials'],
  },
  {
    id: 'budgetTimeline',
    type: 'buttons',
    section: 'solar',
    title: 'Project timeline',
    subtitle: 'When are you looking to deploy?',
    options: [
      {
        value: 'immediate',
        label: 'ASAP',
        icon: '🚀',
        description: 'Ready to start in 1-3 months',
      },
      {
        value: '6-months',
        label: '6 Months',
        icon: '📅',
        description: 'Planning phase, site prep underway',
      },
      {
        value: '12-months',
        label: '12+ Months',
        icon: '📆',
        description: 'Long-term infrastructure plan',
      },
      {
        value: 'exploring',
        label: 'Just Exploring',
        icon: '🔍',
        description: 'Researching options and costs',
      },
    ],
    smartDefault: 'exploring',
    validation: { required: false },
    impactsCalculations: [],
  },
];
