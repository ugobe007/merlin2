/**
 * Car Wash Industry Questionnaire Configuration
 * Data-driven questions for progressive disclosure UI
 */

export interface QuestionOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  kW?: number; // Power estimate in kW for equipment options
}

export interface Question {
  id: number;
  section: 'facility' | 'operations' | 'energy' | 'equipment' | 'solar';
  field: string;
  question: string;
  type: 'buttons' | 'slider' | 'number_buttons' | 'toggle' | 'area_input' | 'time_range' | 'increment_box' | 'multiselect';
  options?: QuestionOption[];
  range?: { min: number; max: number; step?: number; default?: number };
  unit?: string;
  smartDefault: any;
  helpText?: string;
  powerEstimate?: string; // Power estimate description (e.g., '0.5 kW each')
  incrementBy?: number; // For increment_box type
  showIf?: (answers: Record<string, unknown>) => boolean;
  merlinTip?: string;
}

export const CAR_WASH_QUESTIONS: Question[] = [
  // ========================================================================
  // SECTION 1: FACILITY DETAILS
  // ========================================================================
  {
    id: 1,
    section: 'facility',
    field: 'facilityType',
    question: 'What type of car wash facility?',
    type: 'buttons',
    options: [
      { 
        value: 'express_tunnel', 
        label: 'Express Tunnel', 
        icon: 'expressTunnel', // Use icon key to map to SVG icon
        description: 'High-volume automated tunnel wash'
      },
      { 
        value: 'flex_serve', 
        label: 'Flex Serve', 
        icon: 'flexServe', // Will map to ExpressTunnelIcon or MiniTunnelIcon
        description: 'Combination of tunnel and self-service'
      },
      { 
        value: 'in_bay_automatic', 
        label: 'In-Bay Automatic', 
        icon: 'inBayAutomatic', // Maps to InBayAutomaticIcon
        description: 'Automated wash in stationary bay'
      },
      { 
        value: 'self_serve', 
        label: 'Self-Serve', 
        icon: 'selfServeBay', // Maps to SelfServeBayIcon
        description: 'Customer-operated wand bays'
      }
    ],
    smartDefault: 'express_tunnel',
    merlinTip: 'Most modern car washes are express tunnel format - fast throughput with automated equipment.'
  },
  
  {
    id: 2,
    section: 'facility',
    field: 'bayCount',
    question: 'How many wash bays?',
    type: 'number_buttons',
    options: [
      { value: '1', label: '1 Bay' },
      { value: '2', label: '2 Bays' },
      { value: '3', label: '3 Bays' },
      { value: '4', label: '4 Bays' },
      { value: '5', label: '5 Bays' },
      { value: '6+', label: '6+ Bays' }
    ],
    smartDefault: '4',
    showIf: (answers) => answers.facilityType !== 'express_tunnel',
    merlinTip: 'Each bay typically requires 15-20 kW of power for equipment and lighting.'
  },
  
  // ========================================================================
  // SECTION 2: OPERATIONS
  // ========================================================================
  {
    id: 3,
    section: 'operations',
    field: 'operatingHours',
    question: 'Operating hours per day?',
    type: 'slider',
    range: { min: 6, max: 24, step: 1 },
    unit: 'hours',
    smartDefault: 12,
    helpText: 'Extended hours increase daily vehicle capacity',
    merlinTip: '12-16 hours is typical. 24-hour operations require additional lighting and security systems.'
  },
  
  {
    id: 4,
    section: 'operations',
    field: 'daysPerWeek',
    question: 'Days open per week?',
    type: 'number_buttons',
    options: [
      { value: '5', label: '5 Days' },
      { value: '6', label: '6 Days' },
      { value: '7', label: '7 Days' }
    ],
    smartDefault: '7',
    merlinTip: 'Most car washes operate 7 days per week to maximize revenue.'
  },
  
  {
    id: 5,
    section: 'operations',
    field: 'dailyVehicles',
    question: 'Average vehicles per day?',
    type: 'slider',
    range: { min: 20, max: 350, step: 10 },
    unit: 'vehicles',
    smartDefault: 150,
    helpText: 'Typical express tunnel handles 100-200 cars/day',
    merlinTip: 'Higher volume = more consistent power demand throughout the day, making solar + storage more valuable.'
  },
  
  // ========================================================================
  // SECTION 3: ENERGY SYSTEMS
  // ========================================================================
  {
    id: 6,
    section: 'energy',
    field: 'hasGasLine',
    question: 'Natural gas line available?',
    type: 'buttons',
    options: [
      { value: 'yes', label: 'Yes', icon: '✅' },
      { value: 'no', label: 'No', icon: '❌' },
      { value: 'unknown', label: 'Not Sure', icon: '❓' }
    ],
    smartDefault: 'yes',
    helpText: 'Affects water heater and generator options',
    merlinTip: 'Gas water heaters are more efficient but electric allows better solar integration.'
  },
  
  {
    id: 7,
    section: 'energy',
    field: 'waterHeaterType',
    question: 'Water heating system?',
    type: 'buttons',
    options: [
      { value: 'electric', label: 'Electric', icon: '⚡', description: '15-30 kW continuous load' },
      { value: 'gas', label: 'Natural Gas', icon: '🔥', description: 'Lower operating cost' },
      { value: 'propane', label: 'Propane', icon: '⛽', description: 'For off-grid locations' },
      { value: 'none', label: 'Cold Water Only', icon: '❄️', description: 'No heating needed' }
    ],
    smartDefault: 'electric',
    merlinTip: 'Electric heaters are the largest single power draw in most car washes - perfect candidate for solar offset.'
  },
  
  {
    id: 8,
    section: 'energy',
    field: 'pumpConfiguration',
    question: 'Water pump configuration?',
    type: 'buttons',
    options: [
      { value: 'standard', label: 'Standard Pressure', icon: '💧', description: '5-10 HP pumps' },
      { value: 'high_pressure', label: 'High Pressure', icon: '💦', description: '15-25 HP pumps' },
      { value: 'multi_pump', label: 'Multiple Pumps', icon: '🔄', description: 'Staged system' },
      { value: 'vfd', label: 'Variable Speed (VFD)', icon: '⚙️', description: 'Energy efficient' }
    ],
    smartDefault: 'vfd',
    helpText: 'VFD pumps save 20-40% energy vs constant speed',
    merlinTip: 'Variable speed pumps paired with solar and storage maximize efficiency and reduce demand charges.'
  },
  
  {
    id: 8.5,
    section: 'energy',
    field: 'pumpQuantity',
    question: 'How many water pumps?',
    type: 'number_buttons',
    options: [
      { value: '1', label: '1 Pump' },
      { value: '2', label: '2 Pumps' },
      { value: '3', label: '3 Pumps' },
      { value: '4', label: '4 Pumps' },
      { value: '5+', label: '5+ Pumps' }
    ],
    smartDefault: '2',
    showIf: (answers) => answers.pumpConfiguration === 'multi_pump' || answers.pumpConfiguration === 'high_pressure',
    helpText: 'Number of pumps affects total power demand',
    merlinTip: 'Multiple pumps allow for staged operation and better load management with battery storage.'
  },
  
  {
    id: 9,
    section: 'energy',
    field: 'waterReclaim',
    question: 'Water reclamation system?',
    type: 'buttons',
    options: [
      { value: 'none', label: 'No Reclaim', icon: '❌' },
      { value: 'partial', label: 'Partial Reclaim', icon: '♻️', description: '30-50% recycled' },
      { value: 'full', label: 'Full Reclaim', icon: '🔄', description: '70-85% recycled' },
      { value: 'advanced', label: 'Advanced Treatment', icon: '✨', description: '90%+ recycled' }
    ],
    smartDefault: 'partial',
    helpText: 'Reclaim pumps add 5-15 kW load',
    merlinTip: 'Reclaim systems reduce water costs but increase electrical demand - good ROI with solar.'
  },
  
  {
    id: 10,
    section: 'energy',
    field: 'dryerConfiguration',
    question: 'Vehicle dryer configuration?',
    type: 'buttons',
    options: [
      { value: 'blower_only', label: 'Blowers Only', icon: '💨', description: '20-40 HP' },
      { value: 'heated', label: 'Heated Dryers', icon: '♨️', description: 'Adds 30-50 kW' },
      { value: 'hybrid', label: 'Hybrid System', icon: '🔥', description: 'Seasonal heating' },
      { value: 'none', label: 'No Dryers', icon: '❌', description: 'Air dry only' }
    ],
    smartDefault: 'blower_only',
    helpText: 'Heated dryers are largest power consumers',
    merlinTip: 'Heated dryers significantly increase power demand - battery storage helps manage peak loads.'
  },
  
  {
    id: 11,
    section: 'energy',
    field: 'vacuumStations',
    question: 'Free-standing vacuum stations?',
    type: 'slider',
    range: { min: 0, max: 32, step: 2 },
    unit: 'stations',
    smartDefault: 8,
    helpText: 'Each vacuum is 3-5 HP (2-4 kW)',
    merlinTip: 'Vacuum stations run intermittently - excellent opportunity for battery storage to smooth demand.'
  },
  
  // ========================================================================
  // SECTION 3.5: EV CHARGING (OPTIONAL)
  // ========================================================================
  {
    id: 12,
    section: 'energy',
    field: 'evChargers',
    question: 'EV charging stations planned?',
    type: 'buttons',
    options: [
      { value: 'none', label: 'No Plans', icon: '❌' },
      { value: 'level2', label: 'Level 2 Only', icon: '🔌', description: '7-11 kW per port' },
      { value: 'dcfc', label: 'DC Fast Charging', icon: '⚡', description: '50-150 kW per port' },
      { value: 'both', label: 'Level 2 + DCFC', icon: '🚀', description: 'Full coverage' }
    ],
    smartDefault: 'level2',
    helpText: 'EV charging attracts premium customers',
    merlinTip: 'Level 2 chargers (30-45 min charge) match typical car wash visit time perfectly. Great upsell opportunity!'
  },
  
  {
    id: 13,
    section: 'energy',
    field: 'evLevel2Count',
    question: 'How many Level 2 chargers?',
    type: 'number_buttons',
    options: [
      { value: '2', label: '2 Ports' },
      { value: '4', label: '4 Ports' },
      { value: '6', label: '6 Ports' },
      { value: '8', label: '8 Ports' },
      { value: '10', label: '10 Ports' },
      { value: '12+', label: '12+ Ports' }
    ],
    smartDefault: '4',
    showIf: (answers) => answers.evChargers === 'level2' || answers.evChargers === 'both',
    helpText: 'Typical installation: 2-6 dual-port stations'
  },
  
  {
    id: 14,
    section: 'energy',
    field: 'evDCFCCount',
    question: 'How many DC fast chargers?',
    type: 'number_buttons',
    options: [
      { value: '1', label: '1 Port' },
      { value: '2', label: '2 Ports' },
      { value: '3', label: '3 Ports' },
      { value: '4', label: '4 Ports' }
    ],
    smartDefault: '2',
    showIf: (answers) => answers.evChargers === 'dcfc' || answers.evChargers === 'both',
    helpText: 'DCFC requires 150+ kW service upgrade'
  },
  
  // ========================================================================
  // SECTION 4: SOLAR POTENTIAL
  // ========================================================================
  {
    id: 15,
    section: 'solar',
    field: 'siteArea',
    question: 'Total site area (including parking)?',
    type: 'area_input',
    smartDefault: { value: 20000, unit: 'sqft' },
    helpText: 'For reference only - helps estimate overall capacity',
    merlinTip: 'Total site size helps me understand your full solar + storage potential.'
  },
  
  {
    id: 16,
    section: 'solar',
    field: 'roofArea',
    question: 'Building roof area available?',
    type: 'area_input',
    smartDefault: { value: 5000, unit: 'sqft' },
    helpText: 'Merlin calculates 65% usable for solar panels',
    merlinTip: "I'll automatically calculate 65% usable area to account for HVAC units, vents, and setbacks. Don't worry about being exact - satellite mapping will verify later."
  },
  
  {
    id: 17,
    section: 'solar',
    field: 'carportInterest',
    question: 'Interested in solar carports over vacuum areas?',
    type: 'buttons',
    options: [
      { 
        value: 'yes', 
        label: 'Yes, Interested', 
        icon: '✅',
        description: 'Provides shade + solar generation'
      },
      { 
        value: 'unsure', 
        label: 'Tell Me More', 
        icon: '🤔',
        description: 'Want to learn about benefits'
      },
      { 
        value: 'no', 
        label: 'No Thanks', 
        icon: '❌',
        description: 'Roof solar only'
      }
    ],
    smartDefault: 'unsure',
    helpText: 'Solar carports provide customer shade while generating power',
    merlinTip: 'Solar carports are WIN-WIN: customers get shade while vacuuming, and you generate extra clean energy. The structure also serves as covered parking.'
  },
  
  {
    id: 18,
    section: 'solar',
    field: 'carportArea',
    question: 'Approximate vacuum/parking area for carports?',
    type: 'area_input',
    smartDefault: { value: 1500, unit: 'sqft' },
    showIf: (answers) => answers.carportInterest === 'yes' || answers.carportInterest === 'unsure',
    helpText: '100% of this area is usable for solar (no obstructions)',
    merlinTip: 'Carport structures provide 100% usable solar area - no HVAC units or vents to work around!'
  },
  
  // ========================================================================
  // SECTION 5: EQUIPMENT DETAILS
  // ========================================================================
  {
    id: 19,
    section: 'equipment',
    field: 'kioskCount',
    question: 'Number of payment/wash system kiosks?',
    type: 'increment_box',
    range: { min: 0, max: 10, default: 2 },
    incrementBy: 1,
    smartDefault: 2,
    helpText: 'Entry stations with touchscreens, card readers',
    powerEstimate: '0.5 kW each',
    merlinTip: 'Most express tunnels have 2-3 kiosks for payment entry'
  },
  
  {
    id: 20,
    section: 'equipment',
    field: 'conveyorMotorHP',
    question: 'Conveyor drive motor size?',
    type: 'buttons',
    options: [
      { value: '5', label: '5 HP', description: 'Small tunnel', kW: 3.7 },
      { value: '10', label: '10 HP', description: 'Medium tunnel', kW: 7.5 },
      { value: '15', label: '15 HP', description: 'Large tunnel', kW: 11.2 }
    ],
    smartDefault: '10',
    helpText: 'This is the heartbeat of your tunnel - runs continuously',
    merlinTip: 'The conveyor moves 2,000-5,000 lbs continuously during operations'
  },
  
  {
    id: 21,
    section: 'equipment',
    field: 'brushMotorCount',
    question: 'Total number of brush/arch motors?',
    type: 'increment_box',
    range: { min: 0, max: 20, default: 15 },
    incrementBy: 1,
    smartDefault: 15,
    helpText: 'Wrap-around, top, side washers, mitter curtains',
    powerEstimate: '2-5 HP each motor',
    merlinTip: 'Each moving brush has its own motor - modern tunnels have 10-20 motors'
  },
  
  {
    id: 22,
    section: 'equipment',
    field: 'blowerCount',
    question: 'Number of dryer blowers?',
    type: 'increment_box',
    range: { min: 0, max: 20, default: 10 },
    incrementBy: 1,
    smartDefault: 10,
    helpText: 'Typically 10-15 HP each',
    powerEstimate: '10-15 HP per blower',
    merlinTip: '🚨 CRITICAL: Dryers account for 40-50% of your total electric bill!'
  },
  
  {
    id: 23,
    section: 'equipment',
    field: 'heatedDryers',
    question: 'Are dryers heated?',
    type: 'toggle',
    options: [
      { value: 'yes', label: 'Yes', description: 'Adds 30-50 kW' },
      { value: 'no', label: 'No', description: 'Blowers only' }
    ],
    smartDefault: 'no',
    showIf: (answers) => (answers.blowerCount as number) > 0,
    helpText: 'Heated dryers warm the air for better evaporation',
    merlinTip: 'Premium washes use heated dryers - adds significant load but better results'
  },
  
  {
    id: 24,
    section: 'equipment',
    field: 'centralVacuumHP',
    question: 'Central vacuum turbine size?',
    type: 'slider',
    range: { min: 20, max: 50, step: 5 },
    unit: 'HP',
    smartDefault: 30,
    helpText: 'Industrial vacuum for 20+ free stalls',
    merlinTip: 'This powers all your free vacuum stalls simultaneously - runs continuously'
  },
  
  {
    id: 25,
    section: 'equipment',
    field: 'highPressurePumpCount',
    question: 'Number of high-pressure pumps?',
    type: 'increment_box',
    range: { min: 1, max: 10, default: 3 },
    incrementBy: 1,
    smartDefault: 3,
    helpText: '10-25 HP each',
    powerEstimate: '15 HP average',
    merlinTip: '🚨 CRITICAL: High-pressure pumps are 20-30% of your electric bill!'
  },
  
  {
    id: 26,
    section: 'equipment',
    field: 'roPumpHP',
    question: 'Reverse Osmosis system pump size?',
    type: 'buttons',
    options: [
      { value: 'none', label: 'No RO System', kW: 0 },
      { value: 'small', label: 'Small (5 HP)', kW: 3.7 },
      { value: 'medium', label: 'Medium (10 HP)', kW: 7.5 },
      { value: 'large', label: 'Large (15 HP)', kW: 11.2 }
    ],
    smartDefault: 'medium',
    helpText: 'Creates spot-free rinse water',
    merlinTip: 'RO systems filter water for spot-free final rinse'
  },
  
  {
    id: 27,
    section: 'equipment',
    field: 'airCompressorHP',
    question: 'Air compressor size?',
    type: 'buttons',
    options: [
      { value: 'small', label: '5 HP', description: 'Basic foaming', kW: 3.7 },
      { value: 'medium', label: '10 HP', description: 'Standard system', kW: 7.5 },
      { value: 'large', label: '15 HP', description: 'Heavy duty', kW: 11.2 }
    ],
    smartDefault: 'medium',
    helpText: 'Critical for foaming soap and pneumatic equipment',
    merlinTip: 'Powers soap foaming and air-driven equipment throughout tunnel'
  },
  
  {
    id: 28,
    section: 'equipment',
    field: 'tunnelLighting',
    question: 'Tunnel lighting type?',
    type: 'buttons',
    options: [
      { value: 'basic', label: 'Basic LED', description: 'Functional only', kW: 5 },
      { value: 'enhanced', label: 'Enhanced LED', description: 'Better visibility', kW: 8 },
      { value: 'premium', label: 'Premium + Effects', description: 'Light show', kW: 15 }
    ],
    smartDefault: 'enhanced',
    helpText: 'Tunnel lighting plus any special effects',
    merlinTip: 'Premium washes use LED light shows - customers love the experience!'
  },
  
  {
    id: 29,
    section: 'equipment',
    field: 'exteriorSignage',
    question: 'Exterior signage and lighting?',
    type: 'buttons',
    options: [
      { value: 'basic', label: 'Basic', description: 'Standard LED signs', kW: 5 },
      { value: 'premium', label: 'Premium', description: 'LED + animated', kW: 10 },
      { value: 'signature', label: 'Signature', description: 'Full light show', kW: 20 }
    ],
    smartDefault: 'basic',
    helpText: 'Exterior signage, pole signs, building lighting',
    merlinTip: 'Signature lighting makes your wash visible from miles away!'
  },
  
  {
    id: 30,
    section: 'equipment',
    field: 'officeFacilities',
    question: 'Office/facilities included?',
    type: 'multiselect',
    options: [
      { value: 'office', label: 'Office Space', kW: 2 },
      { value: 'breakroom', label: 'Break Room', kW: 3 },
      { value: 'bathroom', label: 'Bathrooms', kW: 1 },
      { value: 'security', label: 'Security Cameras', kW: 0.5 }
    ],
    smartDefault: [],
    helpText: 'Select all that apply',
    merlinTip: 'Office facilities add consistent base load to your energy profile'
  }
];

// ========================================================================
// SMART DEFAULTS BY FACILITY TYPE
// ========================================================================

export const FACILITY_TYPE_DEFAULTS: Record<string, Partial<Record<string, unknown>>> = {
  express_tunnel: {
    bayCount: null,  // N/A for express tunnel
    operatingHours: 14,
    daysPerWeek: 7,
    dailyVehicles: 200,
    hasGasLine: 'yes',
    waterHeaterType: 'electric',
    pumpConfiguration: 'vfd',
    waterReclaim: 'full',
    dryerConfiguration: 'blower_only',
    vacuumStations: 12,
    evChargers: 'level2',
    evLevel2Count: '4'
  },
  flex_serve: {
    bayCount: '4',
    operatingHours: 16,
    daysPerWeek: 7,
    dailyVehicles: 150,
    hasGasLine: 'yes',
    waterHeaterType: 'electric',
    pumpConfiguration: 'vfd',
    waterReclaim: 'partial',
    dryerConfiguration: 'blower_only',
    vacuumStations: 8,
    evChargers: 'level2',
    evLevel2Count: '2'
  },
  in_bay_automatic: {
    bayCount: '3',
    operatingHours: 12,
    daysPerWeek: 7,
    dailyVehicles: 100,
    hasGasLine: 'yes',
    waterHeaterType: 'gas',
    pumpConfiguration: 'high_pressure',
    waterReclaim: 'partial',
    dryerConfiguration: 'heated',
    vacuumStations: 6,
    evChargers: 'none'
  },
  self_serve: {
    bayCount: '6',
    operatingHours: 24,
    daysPerWeek: 7,
    dailyVehicles: 80,
    hasGasLine: 'unknown',
    waterHeaterType: 'electric',
    pumpConfiguration: 'standard',
    waterReclaim: 'none',
    dryerConfiguration: 'none',
    vacuumStations: 4,
    evChargers: 'none'
  }
};

// ========================================================================
// SECTION METADATA
// ========================================================================

export const SECTIONS = [
  {
    id: 'facility',
    label: 'Facility Details',
    icon: '🏪',
    description: 'Basic information about your car wash'
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: '⚙️',
    description: 'Operating hours and vehicle volume'
  },
  {
    id: 'energy',
    label: 'Energy Systems',
    icon: '⚡',
    description: 'Equipment and power requirements'
  },
  {
    id: 'equipment',
    label: 'Equipment Details',
    icon: '🔧',
    description: 'Detailed equipment specifications'
  },
  {
    id: 'solar',
    label: 'Solar Potential',
    icon: '☀️',
    description: 'Available space for solar panels'
  }
];
