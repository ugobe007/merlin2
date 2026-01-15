/**
 * Complete Car Wash Questionnaire Configuration
 * 
 * All 27 questions with proper types, validations, and conditional logic
 * Production-ready implementation
 */

// Note: Icons will be imported from existing icon system
// For now, using string identifiers that can be mapped to actual icons

export interface Question {
  id: string;
  type: 'buttons' | 'auto_confirm' | 'slider' | 'number_input' | 'toggle' |
        'conditional_buttons' | 'type_then_quantity' | 'existing_then_planned' |
        'increment_box' | 'wheel' | 'multiselect' | 'hours_grid' | 'range_buttons';
  // Optional: range button config from database
  rangeConfig?: {
    ranges: Array<{ label: string; min: number; max: number | null }>;
    suffix?: string;
  };
  // Optional: field name for database mapping
  fieldName?: string;
  section: 'facility' | 'operations' | 'equipment' | 'solar';
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
  suffix?: string;  // NEW: Suffix from database options (e.g., " kW", " sq ft")
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
  }>;
  existingOptions?: Array<{
    value: string;
    label: string;
    icon?: string | any;
    description?: string;
    quantityRange?: { min: number; max: number; step: number };
  }>;
  plannedOptions?: Array<{
    value: string;
    label: string;
    icon?: string | any;
    description?: string;
  }>;
  impactsCalculations?: string[];
  // Optional: question tier for filtering
  questionTier?: string;
}

export const carWashQuestionsComplete: Question[] = [
  // ============================================================================
  // SECTION 1: FACILITY DETAILS (Q1-Q6)
  // ============================================================================
  {
    id: 'facilityType',
    type: 'buttons',
    section: 'facility',
    title: 'What type of car wash facility?',
    subtitle: 'Industry classification by how vehicle interacts with machinery',
    options: [
      {
        value: 'express_tunnel',
        label: 'Express Tunnel',
        icon: '🚗',
        description: 'High-speed conveyor, 80-180 feet',
      },
      {
        value: 'mini_tunnel',
        label: 'Mini-Tunnel',
        icon: '🚙',
        description: 'Shorter conveyor under 90 feet',
      },
      {
        value: 'in_bay_automatic',
        label: 'In-Bay Automatic (IBA)',
        icon: '🏪',
        description: 'Vehicle stationary, machine moves over it',
      },
      {
        value: 'self_serve',
        label: 'Self-Serve Bay',
        icon: '💪',
        description: 'Customer wand wash',
      }
    ],
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'equipmentLoad']
  },
  {
    id: 'tunnelOrBayCount',
    type: 'buttons',
    section: 'facility',
    title: 'Number of tunnels or bays?',
    subtitle: 'Select how many wash lanes your facility has',
    options: [
      { value: '1', label: '1', icon: '1️⃣', description: 'Single lane' },
      { value: '2', label: '2', icon: '2️⃣', description: 'Two lanes' },
      { value: '3', label: '3', icon: '3️⃣', description: 'Three lanes' },
      { value: '4', label: '4', icon: '4️⃣', description: 'Four lanes' },
    ],
    conditionalLogic: {
      dependsOn: 'facilityType',
      showIf: () => true,
      modifyOptions: (facilityType: string) => {
        // Self-serve can have more bays
        if (facilityType === 'self_serve') {
          return {
            options: [
              { value: '2', label: '2', icon: '2️⃣', description: 'Two bays' },
              { value: '4', label: '4', icon: '4️⃣', description: 'Four bays' },
              { value: '6', label: '6', icon: '6️⃣', description: 'Six bays' },
              { value: '8', label: '8', icon: '8️⃣', description: 'Eight bays' },
            ]
          };
        }
        return {};
      }
    },
    smartDefault: '1',
    merlinTip: 'Express tunnels typically have 1-2 lanes • Self-serve locations average 4-6 bays',
    validation: { required: true },
    impactsCalculations: ['capacity', 'equipmentLoad']
  },
  {
    id: 'operatingHours',
    type: 'hours_grid',
    section: 'facility',
    title: 'Operating hours per day?',
    subtitle: 'Hours open for business',
    options: [
      { value: '6', label: '6', description: 'hrs' },
      { value: '7', label: '7', description: 'hrs' },
      { value: '8', label: '8', description: 'hrs' },
      { value: '9', label: '9', description: 'hrs' },
      { value: '10', label: '10', description: 'hrs' },
      { value: '11', label: '11', description: 'hrs' },
      { value: '12', label: '12', description: 'hrs' },
      { value: '13', label: '13', description: 'hrs' },
      { value: '14', label: '14', description: 'hrs' },
      { value: '15', label: '15', description: 'hrs' },
      { value: '16', label: '16', description: 'hrs' },
      { value: '18', label: '18', description: 'hrs' },
      { value: '20', label: '20', description: 'hrs' },
      { value: '24', label: '24/7', description: 'hrs' }
    ],
    smartDefault: '12',
    merlinTip: 'Most car washes operate 10-14 hours per day',
    validation: { required: true },
    impactsCalculations: ['annualConsumption', 'operatingCosts']
  },
  {
    id: 'daysPerWeek',
    type: 'buttons',
    section: 'facility',
    title: 'Days open per week?',
    subtitle: 'Typical operating days',
    options: [
      { value: '5', label: '5', icon: '5️⃣', description: 'days' },
      { value: '6', label: '6', icon: '6️⃣', description: 'days' },
      { value: '7', label: '7', icon: '7️⃣', description: 'days' }
    ],
    smartDefault: '7',
    validation: { required: true },
    impactsCalculations: ['annualConsumption', 'operatingCosts']
  },
  {
    id: 'dailyVehicles',
    type: 'slider',
    section: 'facility',
    title: 'Estimated average vehicles washed per day?',
    subtitle: 'Daily throughput helps us understand your energy demand patterns',
    helpText: 'Using 3min cycle × 12hrs = 240 max/day typical',
    range: { min: 0, max: 350, step: 1 },
    smartDefault: 150,
    unit: ' vehicles/day',
    merlinTip: 'Express tunnels: 150-300/day • Mini tunnels: 50-150/day • Self-serve: 20-100/day',
    validation: { required: true, min: 0, max: 350 },
    impactsCalculations: ['waterUsage', 'revenueProjection']
  },
  {
    id: 'naturalGasLine',
    type: 'buttons',
    section: 'facility',
    title: 'Do you have an existing natural gas line?',
    subtitle: 'Affects water heating and generator fuel options',
    options: [
      { value: 'yes', label: 'Yes', icon: '✅' },
      { value: 'no', label: 'No', icon: '❌' },
      { value: 'unknown', label: 'Not Sure / Unknown', icon: '❓' }
    ],
    validation: { required: true },
    impactsCalculations: ['heatingOptions', 'operatingCosts']
  },
  // ============================================================================
  // SECTION 2: EQUIPMENT (Q7-Q15)
  // ============================================================================
  {
    id: 'waterHeaterType',
    type: 'conditional_buttons',
    section: 'equipment',
    title: 'Water heating system?',
    subtitle: 'Electric water heaters add significant peak demand (50-150 kW)',
    options: [
      {
        value: 'electric',
        label: 'Electric',
        icon: '⚡',
        description: '10-30 kW continuous load',
      },
      {
        value: 'natural_gas',
        label: 'Natural Gas',
        icon: '🔥',
        description: 'Lower electric demand',
      },
      {
        value: 'propane',
        label: 'Propane',
        icon: '⛽',
        description: 'For off-grid locations',
      },
      {
        value: 'cold_water',
        label: 'Cold Water Only',
        icon: '❄️',
        description: 'No heating needed',
      }
    ],
    conditionalLogic: {
      dependsOn: 'naturalGasLine',
      showIf: () => true,
      modifyOptions: (gasLine: string) => {
        if (gasLine === 'yes') {
          return {
            enabledOptions: ['natural_gas'],
            disabledOptions: ['electric', 'propane', 'cold_water']
          };
        } else {
          return {
            enabledOptions: ['electric', 'propane', 'cold_water'],
            disabledOptions: ['natural_gas']
          };
        }
      }
    },
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'heatingLoad']
  },
  {
    id: 'pumpConfiguration',
    type: 'type_then_quantity',
    section: 'equipment',
    title: 'Water pump configuration?',
    subtitle: 'High-pressure pumps save 20-40% energy vs constant speed',
    merlinTip: '🚨 CRITICAL: High-pressure pumps are 20-30% of your electric bill!',
    options: [
      {
        value: 'standard',
        label: 'Standard Pressure',
        icon: '💧',
        description: '5-10 HP pumps'
      },
      {
        value: 'high_pressure',
        label: 'High Pressure',
        icon: '💦',
        description: '15-25 HP pumps'
      },
      {
        value: 'multiple',
        label: 'Multiple Pumps',
        icon: '🔄',
        description: 'Staged system'
      },
      {
        value: 'vfd',
        label: 'Variable Speed (VFD)',
        icon: '⚙️',
        description: 'Energy efficient'
      }
    ],
    quantityOptions: [
      { value: '1-2', label: '1-2 Pumps', icon: '💧', description: '15-30 HP total' },
      { value: '3-4', label: '3-4 Pumps', icon: '💧💧', description: '45-80 HP total' },
      { value: '5-6', label: '5-6 Pumps', icon: '💦', description: '100-150 HP total' },
      { value: '7+', label: '7+ Pumps', icon: '🌊', description: '150+ HP total' }
    ],
    validation: { required: true },
    impactsCalculations: ['pumpLoad', 'peakDemand']
  },
  {
    id: 'waterReclamation',
    type: 'buttons',
    section: 'equipment',
    title: 'Water reclamation system?',
    subtitle: 'Reclaim systems add pump load but reduce water costs',
    options: [
      {
        value: 'none',
        label: 'No Reclaim',
        icon: '❌',
        description: 'Fresh water only'
      },
      {
        value: 'partial',
        label: 'Partial Reclaim',
        icon: '♻️',
        description: '30-60% recycled'
      },
      {
        value: 'full',
        label: 'Full Reclaim',
        icon: '🔄',
        description: '70-85% recycled'
      },
      {
        value: 'advanced',
        label: 'Advanced Treatment',
        icon: '✨',
        description: '90%+ recycled'
      }
    ],
    validation: { required: true },
    impactsCalculations: ['waterUsage', 'pumpLoad']
  },
  {
    id: 'dryerConfiguration',
    type: 'type_then_quantity',
    section: 'equipment',
    title: 'Vehicle dryer configuration?',
    subtitle: 'Heated dryers are largest power consumers',
    merlinTip: '🚨 CRITICAL: Dryers account for 40-50% of your total electric bill!',
    options: [
      {
        value: 'blowers',
        label: 'Blowers Only',
        icon: '💨',
        description: '20-40 HP'
      },
      {
        value: 'heated',
        label: 'Heated Dryers',
        icon: '♨️',
        description: 'Adds 30-50 kW'
      },
      {
        value: 'hybrid',
        label: 'Hybrid System',
        icon: '🔥',
        description: 'Seasonal heating'
      },
      {
        value: 'none',
        label: 'No Dryers',
        icon: '❌',
        description: 'Air dry only'
      }
    ],
    quantityOptions: [
      { value: 'standard', label: 'Standard', icon: '💨', description: '4 blowers' },
      { value: 'premium', label: 'Premium', icon: '💨💨', description: '6+ blowers' },
      { value: 'heated', label: 'Heated', icon: '♨️', description: 'Heated dryers' },
      { value: 'none', label: 'None', icon: '❌', description: 'Air dry' }
    ],
    validation: { required: true },
    impactsCalculations: ['dryerLoad', 'peakDemand']
  },
  {
    id: 'vacuumStations',
    type: 'increment_box',
    section: 'equipment',
    title: 'Free-standing Vacuum stations?',
    subtitle: 'Self-service vacuum islands. Each vacuum is 3-5 HP (2-4 kW)',
    range: { min: 0, max: 32, step: 4 },
    smartDefault: 8,
    unit: ' stations',
    validation: { required: true, min: 0, max: 32 },
    impactsCalculations: ['vacuumLoad', 'peakDemand']
  },
  {
    id: 'evCharging',
    type: 'existing_then_planned',
    section: 'equipment',
    title: 'EV Charging Infrastructure?',
    subtitle: 'Do you have EV chargers on site? (optional)',
    existingOptions: [
      { value: 'none', label: 'No EV Chargers on site', icon: '❌' },
      {
        value: 'level2',
        label: 'Level 2 Chargers',
        icon: '🔌',
        description: '7-19 kW each',
        quantityRange: { min: 0, max: 8, step: 2 }
      },
      {
        value: 'dcfast',
        label: 'DC Fast Chargers',
        icon: '⚡',
        description: '50-150 kW each',
        quantityRange: { min: 0, max: 4, step: 1 }
      }
    ],
    plannedOptions: [
      {
        value: 'no_plans',
        label: 'No Plans',
        icon: '❌',
        description: 'Roof solar only'
      },
      {
        value: 'level2_only',
        label: 'Level 2 Only',
        icon: '🔌',
        description: '7-11 kW per port'
      },
      {
        value: 'dcfast',
        label: 'DC Fast Charging',
        icon: '⚡',
        description: '50-150 kW per port'
      },
      {
        value: 'both',
        label: 'Level 2 + DCFC',
        icon: '🚗',
        description: 'Full coverage'
      }
    ],
    validation: { required: false },
    impactsCalculations: ['evLoad', 'futureExpansion']
  },
  // ============================================================================
  // SECTION 3: ADDITIONAL EQUIPMENT (Q13-Q19)
  // ============================================================================
  {
    id: 'paymentKiosks',
    type: 'increment_box',
    section: 'equipment',
    title: 'Payment kiosks?',
    subtitle: 'Entry stations with touchscreens and card readers',
    range: { min: 0, max: 10, step: 1 },
    smartDefault: 2,
    unit: ' kiosks',
    helpText: 'Each kiosk: ~0.5 kW',
    validation: { required: true, min: 0, max: 10 },
    impactsCalculations: ['facilitiesLoad']
  },
  {
    id: 'conveyorMotorSize',
    type: 'buttons',
    section: 'equipment',
    title: 'Conveyor motor size?',
    subtitle: 'Main drive motor for tunnel conveyor',
    options: [
      { value: '5', label: '5 HP', icon: '⚙️', description: '3.7 kW' },
      { value: '10', label: '10 HP', icon: '⚙️', description: '7.5 kW' },
      { value: '15', label: '15 HP', icon: '⚙️', description: '11.2 kW' }
    ],
    smartDefault: '10',
    conditionalLogic: {
      dependsOn: 'facilityType',
      showIf: (type) => type === 'express_tunnel' || type === 'mini_tunnel',
    },
    validation: { required: true },
    impactsCalculations: ['conveyorLoad']
  },
  {
    id: 'brushMotorCount',
    type: 'increment_box',
    section: 'equipment',
    title: 'Brush motor count?',
    subtitle: 'Wrap-around, top, side brushes, tire shiners',
    range: { min: 0, max: 20, step: 1 },
    smartDefault: 15,
    unit: ' motors',
    helpText: 'Typical: 10-20 motors per tunnel, 2-5 HP each (3 HP average)',
    validation: { required: true, min: 0, max: 20 },
    impactsCalculations: ['brushLoad', 'mechanicalLoad']
  },
  {
    id: 'blowerCount',
    type: 'increment_box',
    section: 'equipment',
    title: 'Number of blowers?',
    subtitle: 'Individual blower units',
    range: { min: 0, max: 20, step: 1 },
    smartDefault: 10,
    unit: ' blowers',
    helpText: '10-15 HP each',
    merlinTip: '🚨 CRITICAL: Dryers account for 40-50% of your total electric bill!',
    validation: { required: true, min: 0, max: 20 },
    impactsCalculations: ['blowerLoad', 'peakDemand']
  },
  {
    id: 'heatedDryers',
    type: 'toggle',
    section: 'equipment',
    title: 'Heated dryers?',
    subtitle: 'Electric heating elements (adds 30-50 kW)',
    conditionalLogic: {
      dependsOn: 'blowerCount',
      showIf: (count) => count > 0,
    },
    smartDefault: false,
    validation: { required: false },
    impactsCalculations: ['heatingLoad', 'peakDemand']
  },
  {
    id: 'centralVacuumHP',
    type: 'slider',
    section: 'equipment',
    title: 'Central vacuum turbine HP?',
    subtitle: 'Industrial vacuum system for self-service stations',
    range: { min: 20, max: 50, step: 5 },
    smartDefault: 30,
    unit: ' HP',
    helpText: '20 HP = 15 kW, 50 HP = 37 kW',
    validation: { required: true, min: 20, max: 50 },
    impactsCalculations: ['vacuumLoad']
  },
  {
    id: 'highPressurePumpCount',
    type: 'increment_box',
    section: 'equipment',
    title: 'High-pressure pump count?',
    subtitle: 'Dedicated HP pumps for arches and undercarriage',
    range: { min: 1, max: 10, step: 1 },
    smartDefault: 3,
    unit: ' pumps',
    helpText: '15 HP average each',
    merlinTip: '🚨 CRITICAL: High-pressure pumps are 20-30% of your electric bill!',
    validation: { required: true, min: 1, max: 10 },
    impactsCalculations: ['pumpLoad', 'peakDemand']
  },
  {
    id: 'roSystemPump',
    type: 'buttons',
    section: 'equipment',
    title: 'RO (Reverse Osmosis) system pump?',
    subtitle: 'For spot-free rinse water',
    options: [
      { value: 'none', label: 'None', icon: '❌', description: '0 kW' },
      { value: 'small', label: 'Small (5 HP)', icon: '💧', description: '3.7 kW' },
      { value: 'medium', label: 'Medium (10 HP)', icon: '💧', description: '7.5 kW' },
      { value: 'large', label: 'Large (15 HP)', icon: '💦', description: '11.2 kW' }
    ],
    smartDefault: 'small',
    validation: { required: true },
    impactsCalculations: ['pumpLoad']
  },
  // ============================================================================
  // SECTION 4: FACILITIES & SOLAR (Q20-Q27)
  // ============================================================================
  {
    id: 'airCompressor',
    type: 'buttons',
    section: 'equipment',
    title: 'Air compressor size?',
    subtitle: 'For foaming soap and pneumatic equipment',
    options: [
      { value: '5', label: '5 HP', icon: '💨', description: '3.7 kW' },
      { value: '10', label: '10 HP', icon: '💨', description: '7.5 kW' },
      { value: '15', label: '15 HP', icon: '💨', description: '11.2 kW' }
    ],
    smartDefault: '10',
    validation: { required: true },
    impactsCalculations: ['compressorLoad']
  },
  {
    id: 'tunnelLighting',
    type: 'buttons',
    section: 'equipment',
    title: 'Tunnel lighting?',
    subtitle: 'Interior wash tunnel illumination',
    options: [
      { value: 'basic', label: 'Basic LED', icon: '💡', description: '5 kW' },
      { value: 'enhanced', label: 'Enhanced LED', icon: '💡', description: '8 kW' },
      { value: 'premium', label: 'Premium + Effects', icon: '✨', description: '15 kW' }
    ],
    smartDefault: 'enhanced',
    validation: { required: true },
    impactsCalculations: ['lightingLoad']
  },
  {
    id: 'exteriorSignage',
    type: 'buttons',
    section: 'equipment',
    title: 'Exterior signage?',
    subtitle: 'Illuminated brand signs and pricing displays',
    options: [
      { value: 'basic', label: 'Basic', icon: '🪧', description: '5 kW' },
      { value: 'premium', label: 'Premium', icon: '🪧', description: '10 kW' },
      { value: 'signature', label: 'Signature', icon: '🌟', description: '20 kW' }
    ],
    smartDefault: 'premium',
    validation: { required: true },
    impactsCalculations: ['lightingLoad']
  },
  {
    id: 'officeFacilities',
    type: 'multiselect',
    section: 'equipment',
    title: 'Office facilities?',
    subtitle: 'Select all that apply',
    options: [
      { value: 'office', label: 'Office', icon: '🏢', description: '2 kW' },
      { value: 'break_room', label: 'Break Room', icon: '☕', description: '3 kW' },
      { value: 'bathrooms', label: 'Bathrooms', icon: '🚻', description: '1 kW' },
      { value: 'security', label: 'Security Cameras', icon: '📹', description: '0.5 kW' }
    ],
    smartDefault: [],
    validation: { required: false },
    impactsCalculations: ['facilitiesLoad']
  },
  {
    id: 'totalSiteArea',
    type: 'slider',
    section: 'solar',
    title: 'Total site area?',
    subtitle: 'Total property size including parking and vacuum areas',
    range: { min: 0, max: 75000, step: 1000 },
    smartDefault: 15000,
    unit: ' sq ft',
    validation: { required: true, min: 0, max: 75000 },
    impactsCalculations: ['siteLayout']
  },
  {
    id: 'roofArea',
    type: 'slider',
    section: 'solar',
    title: 'Available roof area for solar panels?',
      subtitle: 'Total roof space (we\'ll calculate usable area)',
    range: { min: 0, max: 25000, step: 100 },
    smartDefault: 5000,
    unit: ' sq ft',
    helpText: 'Solar preview will appear below after entering',
    validation: { required: true, min: 0, max: 25000 },
    impactsCalculations: ['roofSolar', 'solarCapacity']
  },
  {
    id: 'carportInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar carports over vacuum areas?',
    subtitle: 'Solar carports provide customer shade while generating power',
    options: [
      {
        value: 'yes',
        label: 'Yes, Interested',
        icon: '🏗️',
        description: 'Provides shade + solar'
      },
      {
        value: 'learn_more',
        label: 'Tell Me More',
        description: 'Want to learn benefits'
      },
      {
        value: 'no',
        label: 'No Thanks',
        description: 'Roof solar only'
      }
    ],
    validation: { required: true },
    impactsCalculations: ['carportSolar', 'solarCapacity']
  }
];

// Export section metadata
export const carWashSections = [
  {
    id: 'facility',
    title: 'Facility Details',
    description: 'Basic information about your car wash',
    icon: '🏢',
    questions: carWashQuestionsComplete.filter(q => q.section === 'facility')
  },
  {
    id: 'operations',
    title: 'Operations',
    description: 'Operating hours and throughput',
    icon: '⏰',
    questions: carWashQuestionsComplete.filter(q => q.section === 'operations')
  },
  {
    id: 'equipment',
    title: 'Equipment',
    description: 'Machinery and systems',
    icon: '⚙️',
    questions: carWashQuestionsComplete.filter(q => q.section === 'equipment')
  },
  {
    id: 'solar',
    title: 'Solar Potential',
    description: 'Site characteristics for solar',
    icon: '☀️',
    questions: carWashQuestionsComplete.filter(q => q.section === 'solar')
  }
];
