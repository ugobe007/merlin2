/**
 * Use Case Template Database
 * Pre-configured templates for common BESS applications
 */

import type { UseCaseTemplate } from '../types/useCase.types';

export const USE_CASE_TEMPLATES: UseCaseTemplate[] = [
  
  // ==================== CAR WASH ====================
  {
    id: 'car-wash-001',
    name: 'Car Wash',
    slug: 'car-wash',
    description: 'Car washes have high peak demand from wash bays, water heaters, and vacuum systems. BESS can significantly reduce demand charges.',
    icon: '🚗',
    category: 'commercial',
    requiredTier: 'free',
    isActive: true,
    displayOrder: 1,
    
    powerProfile: {
      typicalLoadKw: 35,
      peakLoadKw: 48,
      profileType: 'peaked',
      dailyOperatingHours: 12,
      peakHoursStart: '10:00',
      peakHoursEnd: '18:00',
      operatesWeekends: true,
      seasonalVariation: 1.2 // 20% higher in summer
    },
    
    equipment: [
      {
        name: 'Car Wash Bay (Automatic)',
        powerKw: 25,
        dutyCycle: 0.7,
        description: 'High-pressure pumps, brushes, dryers'
      },
      {
        name: 'Water Heater',
        powerKw: 15,
        dutyCycle: 0.9,
        description: 'Continuous hot water supply'
      },
      {
        name: 'Vacuum System',
        powerKw: 8,
        dutyCycle: 0.5,
        description: 'Customer vacuum stations'
      },
      {
        name: 'Air Compressor',
        powerKw: 5,
        dutyCycle: 0.6,
        description: 'Pneumatic systems'
      }
    ],
    
    financialParams: {
      demandChargeSensitivity: 1.3, // High demand charges due to peak loads
      energyCostMultiplier: 1.0,
      typicalSavingsPercent: 25,
      roiAdjustmentFactor: 0.95,
      peakDemandPenalty: 1.2
    },
    
    recommendedApplications: ['peak_shaving', 'demand_response'],
    
    customQuestions: [
      {
        id: 'num_bays',
        question: 'How many wash bays do you have?',
        type: 'number',
        default: 4,
        unit: 'bays',
        impactType: 'multiplier',
        impactsField: 'equipmentPower',
        multiplierValue: 1,
        helpText: 'Each bay adds to total power demand',
        required: true
      },
      {
        id: 'cars_per_day',
        question: 'Average cars washed per day?',
        type: 'number',
        default: 100,
        unit: 'cars',
        impactType: 'factor',
        helpText: 'Used to estimate energy consumption patterns',
        required: false
      },
      {
        id: 'has_detailing',
        question: 'Do you offer detailing services?',
        type: 'boolean',
        default: false,
        impactType: 'additionalLoad',
        additionalLoadKw: 10,
        helpText: 'Detailing adds lighting, HVAC, and equipment loads',
        required: false
      }
    ]
  },
  
  // ==================== INDOOR FARM ====================
  {
    id: 'indoor-farm-001',
    name: 'Indoor Farm',
    slug: 'indoor-farm',
    description: 'Indoor farms operate 24/7 with constant high loads from grow lights, HVAC, and irrigation. Excellent BESS ROI due to continuous operation.',
    icon: '🌱',
    category: 'agricultural',
    requiredTier: 'semi_premium',
    isActive: true,
    displayOrder: 2,
    
    powerProfile: {
      typicalLoadKw: 180,
      peakLoadKw: 250,
      profileType: 'constant',
      dailyOperatingHours: 24,
      operatesWeekends: true,
      seasonalVariation: 1.1 // Slight increase in summer for cooling
    },
    
    equipment: [
      {
        name: 'LED Grow Lights',
        powerKw: 150,
        dutyCycle: 0.9,
        description: 'High-efficiency full-spectrum lighting'
      },
      {
        name: 'HVAC System',
        powerKw: 60,
        dutyCycle: 0.8,
        description: 'Climate control for optimal growing'
      },
      {
        name: 'Irrigation & Nutrient Pumps',
        powerKw: 15,
        dutyCycle: 0.3,
        description: 'Automated watering systems'
      },
      {
        name: 'Dehumidifiers',
        powerKw: 25,
        dutyCycle: 0.7,
        description: 'Humidity control'
      }
    ],
    
    financialParams: {
      demandChargeSensitivity: 1.5, // Very high constant load
      energyCostMultiplier: 1.2, // 24/7 operation = higher costs
      typicalSavingsPercent: 30,
      roiAdjustmentFactor: 0.85, // Faster ROI
      incentives: {
        agriculture: 0.15, // 15% agricultural incentive
        sustainability: 0.10 // 10% green building credit
      }
    },
    
    recommendedApplications: [
      'peak_shaving',
      'time_of_use',
      'demand_response',
      'backup_power'
    ],
    
    customQuestions: [
      {
        id: 'square_footage',
        question: 'Square footage under cultivation?',
        type: 'number',
        default: 10000,
        unit: 'sq ft',
        impactType: 'multiplier',
        impactsField: 'systemSize',
        multiplierValue: 0.018, // 18W per sq ft average
        helpText: 'Total growing area determines lighting and HVAC needs',
        required: true
      },
      {
        id: 'growing_method',
        question: 'Primary growing method?',
        type: 'select',
        default: 'Hydroponics',
        options: ['Hydroponics', 'Aeroponics', 'Soil-based', 'Aquaponics'],
        impactType: 'factor',
        impactsField: 'energyCostMultiplier',
        helpText: 'Different methods have varying energy requirements',
        required: true
      },
      {
        id: 'vertical_levels',
        question: 'Number of vertical growing levels?',
        type: 'number',
        default: 3,
        unit: 'levels',
        impactType: 'multiplier',
        impactsField: 'equipmentPower',
        multiplierValue: 1,
        helpText: 'More levels = more lighting and environmental control',
        required: true
      }
    ]
  },
  
  // ==================== HOTEL ====================
  {
    id: 'hotel-001',
    name: 'Hotel',
    slug: 'hotel',
    description: 'Hotels have variable loads with morning/evening peaks. BESS reduces demand charges and provides backup power for critical systems.',
    icon: '🏨',
    category: 'commercial',
    requiredTier: 'free',
    isActive: true,
    displayOrder: 3,
    
    powerProfile: {
      typicalLoadKw: 400,
      peakLoadKw: 650,
      profileType: 'peaked',
      dailyOperatingHours: 24,
      peakHoursStart: '06:00',
      peakHoursEnd: '22:00',
      operatesWeekends: true,
      seasonalVariation: 1.3 // Summer AC demand
    },
    
    equipment: [
      {
        name: 'HVAC System',
        powerKw: 300,
        dutyCycle: 0.6,
        description: 'Heating, cooling, ventilation for all rooms'
      },
      {
        name: 'Commercial Kitchen',
        powerKw: 150,
        dutyCycle: 0.4,
        description: 'Ovens, fryers, refrigeration, dishwashers'
      },
      {
        name: 'Laundry Facilities',
        powerKw: 100,
        dutyCycle: 0.5,
        description: 'Industrial washers and dryers'
      },
      {
        name: 'Lighting Systems',
        powerKw: 80,
        dutyCycle: 0.7,
        description: 'Interior and exterior lighting'
      },
      {
        name: 'Elevators',
        powerKw: 50,
        dutyCycle: 0.3,
        description: 'Passenger and service elevators'
      }
    ],
    
    financialParams: {
      demandChargeSensitivity: 1.4,
      energyCostMultiplier: 1.1,
      typicalSavingsPercent: 28,
      roiAdjustmentFactor: 0.90,
      occupancyFactor: 0.75 // Average 75% occupancy
    },
    
    recommendedApplications: [
      'peak_shaving',
      'demand_response',
      'backup_power',
      'ev_charging'
    ],
    
    customQuestions: [
      {
        id: 'num_rooms',
        question: 'Number of guest rooms?',
        type: 'number',
        default: 150,
        unit: 'rooms',
        impactType: 'multiplier',
        impactsField: 'systemSize',
        multiplierValue: 2.5, // 2.5 kW per room average
        helpText: 'Room count determines HVAC and electrical loads',
        required: true
      },
      {
        id: 'occupancy_rate',
        question: 'Average occupancy rate?',
        type: 'percentage',
        default: 75,
        unit: '%',
        impactType: 'factor',
        impactsField: 'occupancyFactor',
        helpText: 'Higher occupancy = higher energy consumption',
        required: true
      },
      {
        id: 'has_restaurant',
        question: 'On-site restaurant?',
        type: 'boolean',
        default: true,
        impactType: 'additionalLoad',
        additionalLoadKw: 80,
        helpText: 'Restaurants significantly increase energy demand',
        required: false
      },
      {
        id: 'has_pool',
        question: 'Swimming pool and/or spa?',
        type: 'boolean',
        default: false,
        impactType: 'additionalLoad',
        additionalLoadKw: 40,
        helpText: 'Pools require pumps, heaters, and filtration',
        required: false
      }
    ]
  },
  
  // ==================== AIRPORT ====================
  {
    id: 'airport-001',
    name: 'Airport',
    slug: 'airport',
    description: 'Airports are critical infrastructure with 24/7 operations, making them ideal for BESS to manage peak demand and ensure power reliability.',
    icon: '✈️',
    category: 'institutional',
    requiredTier: 'premium',
    isActive: true,
    displayOrder: 4,
    
    powerProfile: {
      typicalLoadKw: 2500,
      peakLoadKw: 4000,
      profileType: 'peaked',
      dailyOperatingHours: 24,
      peakHoursStart: '05:00',
      peakHoursEnd: '22:00',
      operatesWeekends: true,
      seasonalVariation: 1.15 // Flight schedule variations
    },
    
    equipment: [
      {
        name: 'HVAC & Environmental Control',
        powerKw: 1200,
        dutyCycle: 0.7,
        description: 'Terminal climate control'
      },
      {
        name: 'Lighting (Interior/Runway)',
        powerKw: 800,
        dutyCycle: 0.8,
        description: 'Terminal and airfield lighting'
      },
      {
        name: 'Baggage Handling Systems',
        powerKw: 600,
        dutyCycle: 0.5,
        description: 'Conveyors, scanners, sorters'
      },
      {
        name: 'Ground Support Equipment Charging',
        powerKw: 400,
        dutyCycle: 0.4,
        description: 'EV charging for ground vehicles'
      },
      {
        name: 'Security & IT Systems',
        powerKw: 300,
        dutyCycle: 0.9,
        description: 'Scanners, computers, communications'
      }
    ],
    
    financialParams: {
      demandChargeSensitivity: 1.6,
      energyCostMultiplier: 1.15,
      typicalSavingsPercent: 32,
      roiAdjustmentFactor: 0.80,
      incentives: {
        infrastructure: 0.20,
        sustainability: 0.15
      }
    },
    
    recommendedApplications: [
      'peak_shaving',
      'demand_response',
      'backup_power',
      'microgrid',
      'ev_charging'
    ],
    
    customQuestions: [
      {
        id: 'annual_passengers',
        question: 'Annual passenger volume (millions)?',
        type: 'number',
        default: 5,
        unit: 'million',
        impactType: 'multiplier',
        impactsField: 'systemSize',
        multiplierValue: 400, // 400 kW per million passengers
        helpText: 'Passenger volume correlates with facility size and energy needs',
        required: true
      },
      {
        id: 'num_terminals',
        question: 'Number of terminals?',
        type: 'number',
        default: 2,
        unit: 'terminals',
        impactType: 'multiplier',
        impactsField: 'equipmentPower',
        multiplierValue: 1,
        helpText: 'Each terminal requires full infrastructure',
        required: true
      }
    ]
  },
  
  // ==================== COLLEGE/UNIVERSITY ====================
  {
    id: 'college-001',
    name: 'College/University',
    slug: 'college-university',
    description: 'Educational institutions have predictable schedules with high daytime loads. BESS provides cost savings and educational opportunities.',
    icon: '🎓',
    category: 'institutional',
    requiredTier: 'semi_premium',
    isActive: true,
    displayOrder: 5,
    
    powerProfile: {
      typicalLoadKw: 800,
      peakLoadKw: 1200,
      profileType: 'peaked',
      dailyOperatingHours: 18,
      peakHoursStart: '07:00',
      peakHoursEnd: '22:00',
      operatesWeekends: false, // Reduced weekend load
      seasonalVariation: 0.4 // Much lower in summer
    },
    
    equipment: [
      {
        name: 'HVAC (Multiple Buildings)',
        powerKw: 500,
        dutyCycle: 0.6,
        description: 'Classrooms, labs, dormitories'
      },
      {
        name: 'Research Labs',
        powerKw: 300,
        dutyCycle: 0.7,
        description: 'Specialized equipment, fume hoods'
      },
      {
        name: 'Data Center',
        powerKw: 200,
        dutyCycle: 0.9,
        description: 'Campus IT infrastructure'
      },
      {
        name: 'Dining Facilities',
        powerKw: 150,
        dutyCycle: 0.4,
        description: 'Cafeterias and kitchens'
      },
      {
        name: 'Athletic Facilities',
        powerKw: 100,
        dutyCycle: 0.5,
        description: 'Gyms, pools, sports lighting'
      }
    ],
    
    financialParams: {
      demandChargeSensitivity: 1.3,
      energyCostMultiplier: 1.0,
      typicalSavingsPercent: 26,
      roiAdjustmentFactor: 0.92,
      incentives: {
        education: 0.25, // Educational institutions get higher incentives
        sustainability: 0.15,
        research: 0.10 // If used for energy research
      }
    },
    
    recommendedApplications: [
      'peak_shaving',
      'demand_response',
      'microgrid',
      'research'
    ],
    
    customQuestions: [
      {
        id: 'student_population',
        question: 'Total student enrollment?',
        type: 'number',
        default: 5000,
        unit: 'students',
        impactType: 'multiplier',
        impactsField: 'systemSize',
        multiplierValue: 0.15, // 0.15 kW per student
        helpText: 'Student population affects overall campus energy demand',
        required: true
      },
      {
        id: 'has_dormitories',
        question: 'On-campus housing (dormitories)?',
        type: 'boolean',
        default: true,
        impactType: 'additionalLoad',
        additionalLoadKw: 300,
        helpText: 'Dorms add significant 24/7 residential load',
        required: false
      },
      {
        id: 'research_intensive',
        question: 'Research-intensive institution?',
        type: 'boolean',
        default: false,
        impactType: 'additionalLoad',
        additionalLoadKw: 400,
        helpText: 'Research facilities require specialized high-power equipment',
        required: false
      }
    ]
  }
];

/**
 * Get all active use cases for a specific user tier
 */
export function getUseCasesForTier(tier: 'free' | 'semi_premium' | 'premium' | 'admin'): UseCaseTemplate[] {
  const tierHierarchy = { free: 0, semi_premium: 1, premium: 2, admin: 3 };
  const userTierLevel = tierHierarchy[tier];
  
  return USE_CASE_TEMPLATES
    .filter(uc => {
      if (!uc.isActive) return false;
      const requiredLevel = tierHierarchy[uc.requiredTier];
      return userTierLevel >= requiredLevel;
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get a specific use case by slug
 */
export function getUseCaseBySlug(slug: string): UseCaseTemplate | undefined {
  return USE_CASE_TEMPLATES.find(uc => uc.slug === slug);
}

/**
 * Get use case by ID
 */
export function getUseCaseById(id: string): UseCaseTemplate | undefined {
  return USE_CASE_TEMPLATES.find(uc => uc.id === id);
}
