/**
 * Power Profile System - Merlin Energy's Capability Platform
 * 
 * An energy amplification system that grows with users as they engage with the platform.
 * Each level unlocks new capabilities, tools, and resources to help users achieve their
 * energy goals while building comprehensive energy management knowledge.
 * 
 * Philosophy: Let users discover the value themselves through authentic experience.
 * This creates a community of empowered energy decision-makers who use Merlin Energy
 * as their trusted toolkit for all energy needs.
 */

export interface PowerProfileScore {
  level: number; // 1-7
  points: number; // 0-100
  completedChecks: string[];
  nextLevelPoints: number;
  benefits: string[];
}

export interface PowerProfileCheck {
  id: string;
  name: string;
  description: string;
  points: number;
  category: 'basic' | 'detailed' | 'advanced' | 'expert';
  required: boolean;
}

/**
 * Power Profile Scoring Rules
 * 
 * Level 1-2: Foundation (0-20 points) - Core energy insights
 * Level 3-4: Optimization (21-50 points) - Advanced analysis tools
 * Level 5-6: Mastery (51-80 points) - Comprehensive energy management
 * Level 7: Complete Intelligence (81-100 points) - Full platform capabilities
 */
export const POWER_PROFILE_CHECKS: PowerProfileCheck[] = [
  // Basic Checks (Level 1-2)
  {
    id: 'use_case_selected',
    name: 'Industry Selected',
    description: 'Selected your industry/use case',
    points: 5,
    category: 'basic',
    required: true
  },
  {
    id: 'building_size',
    name: 'Building Size',
    description: 'Provided facility size/square footage',
    points: 5,
    category: 'basic',
    required: true
  },
  {
    id: 'operating_hours',
    name: 'Operating Hours',
    description: 'Specified daily operating schedule',
    points: 5,
    category: 'basic',
    required: true
  },
  
  // Detailed Checks (Level 3-4)
  {
    id: 'utility_bill_data',
    name: 'Utility Bill Information',
    description: 'Provided monthly electric bill or peak demand',
    points: 10,
    category: 'detailed',
    required: false
  },
  {
    id: 'grid_quality',
    name: 'Grid Quality Assessment',
    description: 'Specified grid connection reliability',
    points: 10,
    category: 'detailed',
    required: true
  },
  {
    id: 'critical_loads',
    name: 'Critical Load Identification',
    description: 'Identified what must stay operational during outages',
    points: 10,
    category: 'detailed',
    required: true
  },
  
  // Advanced Checks (Level 5-6)
  {
    id: 'existing_solar',
    name: 'Existing Solar Data',
    description: 'Provided existing solar capacity (if applicable)',
    points: 8,
    category: 'advanced',
    required: false
  },
  {
    id: 'existing_ev',
    name: 'EV Charger Data',
    description: 'Specified existing EV charging infrastructure',
    points: 7,
    category: 'advanced',
    required: false
  },
  {
    id: 'backup_requirements',
    name: 'Backup Duration',
    description: 'Defined backup power requirements in hours',
    points: 8,
    category: 'advanced',
    required: true
  },
  {
    id: 'primary_goals',
    name: 'Energy Goals',
    description: 'Prioritized your energy objectives',
    points: 7,
    category: 'advanced',
    required: true
  },
  
  // Expert Checks (Level 7)
  {
    id: 'installation_location',
    name: 'Installation Details',
    description: 'Specified available installation space',
    points: 5,
    category: 'expert',
    required: false
  },
  {
    id: 'generator_backup',
    name: 'Backup Generator Info',
    description: 'Provided existing generator details',
    points: 5,
    category: 'expert',
    required: false
  },
  {
    id: 'location_pricing',
    name: 'Regional Pricing',
    description: 'Provided location for accurate pricing',
    points: 10,
    category: 'expert',
    required: false
  },
  {
    id: 'electricity_rate',
    name: 'Electricity Rate',
    description: 'Provided actual electricity rates from utility bill',
    points: 10,
    category: 'expert',
    required: false
  }
];

/**
 * Calculate Power Profile Score from wizard data
 */
export function calculatePowerProfile(wizardData: {
  selectedTemplate?: string;
  useCaseData?: Record<string, any>;
  storageSizeMW?: number;
  durationHours?: number;
  location?: string;
  electricityRate?: number;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
}): PowerProfileScore {
  const completedChecks: string[] = [];
  let points = 0;

  // Check each criterion
  POWER_PROFILE_CHECKS.forEach(check => {
    let completed = false;

    switch (check.id) {
      case 'use_case_selected':
        completed = !!wizardData.selectedTemplate;
        break;
      case 'building_size':
        completed = !!(wizardData.useCaseData?.squareFootage || wizardData.useCaseData?.facilitySize);
        break;
      case 'operating_hours':
        completed = !!wizardData.useCaseData?.operatingHours;
        break;
      case 'utility_bill_data':
        completed = !!(wizardData.useCaseData?.monthlyElectricBill || wizardData.useCaseData?.peakDemandKw);
        break;
      case 'grid_quality':
        completed = !!wizardData.useCaseData?.gridConnection;
        break;
      case 'critical_loads':
        completed = !!wizardData.useCaseData?.criticalLoads;
        break;
      case 'existing_solar':
        completed = !!(wizardData.useCaseData?.existingSolarKw && wizardData.useCaseData.existingSolarKw > 0);
        break;
      case 'existing_ev':
        completed = !!(wizardData.useCaseData?.existingEvPorts && wizardData.useCaseData.existingEvPorts > 0);
        break;
      case 'backup_requirements':
        completed = !!(wizardData.useCaseData?.backupHours || wizardData.durationHours);
        break;
      case 'primary_goals':
        completed = !!wizardData.useCaseData?.primaryGoals;
        break;
      case 'installation_location':
        completed = !!wizardData.useCaseData?.installationSpace;
        break;
      case 'generator_backup':
        completed = !!(wizardData.useCaseData?.generatorSizeKw && wizardData.useCaseData.generatorSizeKw > 0);
        break;
      case 'location_pricing':
        completed = !!wizardData.location;
        break;
      case 'electricity_rate':
        completed = !!(wizardData.electricityRate && wizardData.electricityRate > 0);
        break;
    }

    if (completed) {
      completedChecks.push(check.id);
      points += check.points;
    }
  });

  // Calculate level (1-7)
  let level = 1;
  if (points >= 81) level = 7;
  else if (points >= 61) level = 6;
  else if (points >= 46) level = 5;
  else if (points >= 31) level = 4;
  else if (points >= 21) level = 3;
  else if (points >= 11) level = 2;

  // Next level threshold
  const thresholds = [0, 11, 21, 31, 46, 61, 81, 100];
  const nextLevelPoints = thresholds[level] || 100;

  // Benefits by level
  const allBenefits: Record<number, string[]> = {
    1: ['Energy baseline assessment', 'Core quote generation'],
    2: ['Industry-specific insights', 'Basic financial modeling', 'AI learning begins'],
    3: ['Intelligent system sizing', 'Multi-year ROI projections', 'Resource recommendations'],
    4: ['Advanced analytics dashboard', 'Scenario comparison tools', 'Industry trend insights'],
    5: ['AI-optimized recommendations', 'Ecosystem builder (EPCs, integrators)', 'Peak demand intelligence'],
    6: ['Vendor marketplace access', 'Priority technical support', 'Financing resource network'],
    7: ['Real-time optimization engine', 'Complete resource ecosystem', 'Industry intelligence reports', 'Dedicated energy advisor']
  };

  const benefits = allBenefits[level] || [];

  return {
    level,
    points,
    completedChecks,
    nextLevelPoints,
    benefits
  };
}

/**
 * Get level description and color
 * Option D: Hybrid Professional naming convention
 */
export function getPowerProfileLevelInfo(level: number): {
  name: string;
  color: string;
  gradient: string;
  description: string;
  icon: string;
} {
  // Professional progression - Each level unlocks new capabilities
  const levels = {
    1: {
      name: 'Initiate',
      color: 'text-purple-400',
      gradient: 'from-purple-300 to-purple-500',
      description: 'Beginning your energy journey',
      icon: '⚡'
    },
    2: {
      name: 'Practitioner',
      color: 'text-purple-500',
      gradient: 'from-purple-400 to-purple-600',
      description: 'Building energy fundamentals',
      icon: '📊'
    },
    3: {
      name: 'Specialist',
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-violet-600',
      description: 'Developing targeted solutions',
      icon: '🔋'
    },
    4: {
      name: 'Architect',
      color: 'text-violet-600',
      gradient: 'from-violet-500 to-purple-700',
      description: 'Designing complex energy systems',
      icon: '🏗️'
    },
    5: {
      name: 'Strategist',
      color: 'text-violet-700',
      gradient: 'from-purple-600 to-indigo-700',
      description: 'Advanced planning unlocked',
      icon: '📈'
    },
    6: {
      name: 'Authority',
      color: 'text-indigo-600',
      gradient: 'from-indigo-500 to-purple-800',
      description: 'Elite energy intelligence',
      icon: '🎯'
    },
    7: {
      name: 'Luminary',
      color: 'text-indigo-700',
      gradient: 'from-purple-700 via-indigo-600 to-violet-800',
      description: 'Complete energy mastery achieved',
      icon: '🌟'
    }
  };

  return levels[level as keyof typeof levels] || levels[1];
}

/**
 * Generate Power Profile watermark text for quotes
 * Subtle branding that reinforces user's achievement
 */
export function generatePowerProfileWatermark(profile: PowerProfileScore): string {
  const levelInfo = getPowerProfileLevelInfo(profile.level);
  return `Powered by Merlin Energy™\nPower Profile Level ${profile.level} - ${levelInfo.name}\nGenerated: ${new Date().toLocaleDateString()}\nYour Energy Intelligence Platform`;
}
