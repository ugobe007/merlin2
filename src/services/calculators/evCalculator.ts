/**
 * EV CHARGING CALCULATOR
 * Calculates EV charging infrastructure sizing and costs
 * 
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 */

import type { Industry } from '../contracts';

export interface EVCalculationInput {
  industry: Industry;
  useCaseData: Record<string, any>;
  userInterested: boolean;
  l2Count?: number;
  dcfcCount?: number;
  ultraFastCount?: number;
}

export interface EVCalculationResult {
  recommended: boolean;
  l2: {
    count: number;
    powerKW: number;  // Per charger
    totalPowerKW: number;
    cost: number;
  };
  dcfc: {
    count: number;
    powerKW: number;
    totalPowerKW: number;
    cost: number;
  };
  ultraFast: {
    count: number;
    powerKW: number;
    totalPowerKW: number;
    cost: number;
  };
  totalChargers: number;
  totalPowerKW: number;
  estimatedCost: number;
  annualRevenuePotential: number;
  sizingRationale: string;
  breakdown: {
    component: string;
    cost: number;
  }[];
}

// EV constants
const EV_CONSTANTS = {
  L2_POWER_KW: 19.2,
  L2_COST: 6000,
  DCFC_POWER_KW: 150,
  DCFC_COST: 75000,
  ULTRAFAST_POWER_KW: 350,
  ULTRAFAST_COST: 150000,
  INSTALLATION_MULTIPLIER: 1.3,  // 30% additional for installation
  REVENUE_PER_KWH: 0.35,  // Average charging revenue
  UTILIZATION_RATE: 0.15,  // 15% average utilization
};

// Industry-specific EV configurations
const INDUSTRY_EV_CONFIG: Record<string, {
  recommended: boolean;
  l2Ratio: number;     // Ratio of L2 chargers
  dcfcRatio: number;   // Ratio of DCFC
  ultraRatio: number;  // Ratio of ultra-fast
  baseChargers: number;
  scaleFactor: string; // What to scale by
  rationale: string;
}> = {
  hotel: {
    recommended: true,
    l2Ratio: 0.80,
    dcfcRatio: 0.20,
    ultraRatio: 0,
    baseChargers: 4,
    scaleFactor: 'rooms',
    rationale: 'Guest amenity - overnight L2 charging with some DCFC for quick turnaround',
  },
  car_wash: {
    recommended: true,
    l2Ratio: 0.30,
    dcfcRatio: 0.50,
    ultraRatio: 0.20,
    baseChargers: 4,
    scaleFactor: 'bays',
    rationale: 'Customer convenience while waiting - fast charging focus',
  },
  retail: {
    recommended: true,
    l2Ratio: 0.60,
    dcfcRatio: 0.40,
    ultraRatio: 0,
    baseChargers: 6,
    scaleFactor: 'sqft',
    rationale: 'Customer amenity - match shopping duration to charge time',
  },
  office: {
    recommended: true,
    l2Ratio: 0.90,
    dcfcRatio: 0.10,
    ultraRatio: 0,
    baseChargers: 8,
    scaleFactor: 'sqft',
    rationale: 'Employee benefit - all-day L2 charging during work hours',
  },
  restaurant: {
    recommended: true,
    l2Ratio: 0.40,
    dcfcRatio: 0.60,
    ultraRatio: 0,
    baseChargers: 2,
    scaleFactor: 'seats',
    rationale: 'Customer amenity - fast charging during meal time',
  },
  hospital: {
    recommended: true,
    l2Ratio: 0.70,
    dcfcRatio: 0.30,
    ultraRatio: 0,
    baseChargers: 10,
    scaleFactor: 'beds',
    rationale: 'Staff and visitor charging - mix of long and short stays',
  },
  warehouse: {
    recommended: false,
    l2Ratio: 0.80,
    dcfcRatio: 0.20,
    ultraRatio: 0,
    baseChargers: 4,
    scaleFactor: 'sqft',
    rationale: 'Fleet and employee charging',
  },
  manufacturing: {
    recommended: false,
    l2Ratio: 0.85,
    dcfcRatio: 0.15,
    ultraRatio: 0,
    baseChargers: 6,
    scaleFactor: 'sqft',
    rationale: 'Employee charging during shifts',
  },
  college: {
    recommended: true,
    l2Ratio: 0.75,
    dcfcRatio: 0.25,
    ultraRatio: 0,
    baseChargers: 12,
    scaleFactor: 'students',
    rationale: 'Student and staff charging - primarily L2 for class duration',
  },
  ev_charging: {
    recommended: true,
    l2Ratio: 0.20,
    dcfcRatio: 0.50,
    ultraRatio: 0.30,
    baseChargers: 8,
    scaleFactor: 'fixed',
    rationale: 'Dedicated charging hub - focus on fast turnaround',
  },
  airport: {
    recommended: true,
    l2Ratio: 0.50,
    dcfcRatio: 0.35,
    ultraRatio: 0.15,
    baseChargers: 20,
    scaleFactor: 'fixed',
    rationale: 'Mix of short-term and long-term parking needs',
  },
  data_center: {
    recommended: false,
    l2Ratio: 0.90,
    dcfcRatio: 0.10,
    ultraRatio: 0,
    baseChargers: 4,
    scaleFactor: 'sqft',
    rationale: 'Employee charging only - limited public access',
  },
};

/**
 * Calculate EV charging infrastructure
 */
export function calculateEV(input: EVCalculationInput): EVCalculationResult {
  const config = INDUSTRY_EV_CONFIG[input.industry] || {
    recommended: false,
    l2Ratio: 0.70,
    dcfcRatio: 0.30,
    ultraRatio: 0,
    baseChargers: 4,
    scaleFactor: 'sqft',
    rationale: 'Standard EV charging installation',
  };

  // If user provided counts, use them
  if (input.l2Count !== undefined || input.dcfcCount !== undefined || input.ultraFastCount !== undefined) {
    const l2 = input.l2Count || 0;
    const dcfc = input.dcfcCount || 0;
    const ultra = input.ultraFastCount || 0;
    return buildResult(l2, dcfc, ultra, config, 'User specified configuration');
  }

  // If user not interested, return zero
  if (!input.userInterested && !config.recommended) {
    return buildResult(0, 0, 0, config, 'Not recommended for this application');
  }

  // Calculate total chargers based on facility size
  let totalChargers = config.baseChargers;

  switch (config.scaleFactor) {
    case 'rooms': {
      const rooms = input.useCaseData.roomCount || input.useCaseData.rooms || 100;
      totalChargers = Math.max(config.baseChargers, Math.round(rooms * 0.05)); // 5% of rooms
      break;
    }
    case 'sqft': {
      const sqft = input.useCaseData.squareFootage || input.useCaseData.totalSqFt || 50000;
      totalChargers = Math.max(config.baseChargers, Math.round(sqft / 10000)); // 1 per 10k sqft
      break;
    }
    case 'beds': {
      const beds = input.useCaseData.bedCount || input.useCaseData.beds || 200;
      totalChargers = Math.max(config.baseChargers, Math.round(beds * 0.03)); // 3% of beds
      break;
    }
    case 'seats': {
      const seats = input.useCaseData.seats || input.useCaseData.capacity || 100;
      totalChargers = Math.max(config.baseChargers, Math.round(seats * 0.02)); // 2% of seats
      break;
    }
    case 'students': {
      const students = input.useCaseData.students || input.useCaseData.enrollment || 5000;
      totalChargers = Math.max(config.baseChargers, Math.round(students / 500)); // 1 per 500 students
      break;
    }
    case 'bays': {
      const bays = input.useCaseData.tunnelCount || input.useCaseData.bays || 2;
      totalChargers = Math.max(config.baseChargers, bays * 2);
      break;
    }
    case 'fixed':
    default:
      totalChargers = config.baseChargers;
  }

  // Cap at reasonable maximum
  totalChargers = Math.min(totalChargers, 50);

  // Distribute by ratio
  const l2Count = Math.round(totalChargers * config.l2Ratio);
  const dcfcCount = Math.round(totalChargers * config.dcfcRatio);
  const ultraCount = Math.round(totalChargers * config.ultraRatio);

  return buildResult(l2Count, dcfcCount, ultraCount, config, config.rationale);
}

/**
 * Build result object
 */
function buildResult(
  l2Count: number,
  dcfcCount: number,
  ultraCount: number,
  config: typeof INDUSTRY_EV_CONFIG[string],
  rationale: string
): EVCalculationResult {
  const l2TotalPower = l2Count * EV_CONSTANTS.L2_POWER_KW;
  const dcfcTotalPower = dcfcCount * EV_CONSTANTS.DCFC_POWER_KW;
  const ultraTotalPower = ultraCount * EV_CONSTANTS.ULTRAFAST_POWER_KW;
  const totalPowerKW = l2TotalPower + dcfcTotalPower + ultraTotalPower;

  const l2Cost = l2Count * EV_CONSTANTS.L2_COST * EV_CONSTANTS.INSTALLATION_MULTIPLIER;
  const dcfcCost = dcfcCount * EV_CONSTANTS.DCFC_COST * EV_CONSTANTS.INSTALLATION_MULTIPLIER;
  const ultraCost = ultraCount * EV_CONSTANTS.ULTRAFAST_COST * EV_CONSTANTS.INSTALLATION_MULTIPLIER;
  const totalCost = l2Cost + dcfcCost + ultraCost;

  const totalChargers = l2Count + dcfcCount + ultraCount;
  
  // Estimate annual revenue (if public charging)
  const hoursPerYear = 8760;
  const annualKWh = totalPowerKW * hoursPerYear * EV_CONSTANTS.UTILIZATION_RATE;
  const annualRevenuePotential = Math.round(annualKWh * EV_CONSTANTS.REVENUE_PER_KWH);

  return {
    recommended: totalChargers > 0,
    l2: {
      count: l2Count,
      powerKW: EV_CONSTANTS.L2_POWER_KW,
      totalPowerKW: l2TotalPower,
      cost: Math.round(l2Cost),
    },
    dcfc: {
      count: dcfcCount,
      powerKW: EV_CONSTANTS.DCFC_POWER_KW,
      totalPowerKW: dcfcTotalPower,
      cost: Math.round(dcfcCost),
    },
    ultraFast: {
      count: ultraCount,
      powerKW: EV_CONSTANTS.ULTRAFAST_POWER_KW,
      totalPowerKW: ultraTotalPower,
      cost: Math.round(ultraCost),
    },
    totalChargers,
    totalPowerKW: Math.round(totalPowerKW),
    estimatedCost: Math.round(totalCost),
    annualRevenuePotential,
    sizingRationale: rationale,
    breakdown: totalChargers > 0 ? [
      { component: `Level 2 (${l2Count}×)`, cost: Math.round(l2Cost) },
      { component: `DC Fast (${dcfcCount}×)`, cost: Math.round(dcfcCost) },
      { component: `Ultra-Fast (${ultraCount}×)`, cost: Math.round(ultraCost) },
    ].filter(b => b.cost > 0) : [],
  };
}

// ============================================================================
// EV PRESET TIERS - For Recommended options in Step 4
// ============================================================================

export interface EVPresetTier {
  id: 'basic' | 'standard' | 'premium';
  name: string;
  description: string;
  l2Count: number;
  dcfcCount: number;
  ultraFastCount: number;
  totalChargers: number;
  totalPowerKW: number;
  estimatedCost: number;
  rationale: string;
}

/**
 * Generate 3 preset tiers for EV charging based on industry
 * Used by Step 4 "Recommended" option
 */
export function getEVPresetTiers(
  industry: Industry,
  useCaseData: Record<string, any>
): EVPresetTier[] {
  const config = INDUSTRY_EV_CONFIG[industry] || INDUSTRY_EV_CONFIG['retail'];
  
  // Calculate base chargers from facility size
  let baseChargers = config.baseChargers;
  
  switch (config.scaleFactor) {
    case 'rooms': {
      const rooms = useCaseData.roomCount || useCaseData.rooms || 100;
      baseChargers = Math.max(config.baseChargers, Math.round(rooms * 0.05));
      break;
    }
    case 'sqft': {
      const sqft = useCaseData.squareFootage || useCaseData.totalSqFt || 50000;
      baseChargers = Math.max(config.baseChargers, Math.round(sqft / 10000));
      break;
    }
    case 'beds': {
      const beds = useCaseData.bedCount || useCaseData.beds || 200;
      baseChargers = Math.max(config.baseChargers, Math.round(beds * 0.03));
      break;
    }
    case 'bays': {
      const bays = useCaseData.tunnelCount || useCaseData.bays || 2;
      baseChargers = Math.max(config.baseChargers, bays * 2);
      break;
    }
    default:
      baseChargers = config.baseChargers;
  }
  
  // Cap at reasonable maximums per tier
  baseChargers = Math.min(baseChargers, 20);
  
  // Generate 3 tiers
  const tiers: EVPresetTier[] = [
    // Basic: Minimal setup, mostly L2
    generateTier('basic', 'Starter', 'Essential EV amenity', 
      baseChargers, 0.85, 0.15, 0, config),
    
    // Standard: Balanced mix
    generateTier('standard', 'Standard', 'Balanced for most visitors',
      Math.round(baseChargers * 1.5), config.l2Ratio, config.dcfcRatio, config.ultraRatio, config),
    
    // Premium: More fast charging
    generateTier('premium', 'Premium', 'Maximum convenience & revenue',
      Math.round(baseChargers * 2), 0.50, 0.35, 0.15, config),
  ];
  
  return tiers;
}

function generateTier(
  id: EVPresetTier['id'],
  name: string,
  description: string,
  totalChargers: number,
  l2Ratio: number,
  dcfcRatio: number,
  ultraRatio: number,
  config: typeof INDUSTRY_EV_CONFIG[string]
): EVPresetTier {
  const l2Count = Math.round(totalChargers * l2Ratio);
  const dcfcCount = Math.round(totalChargers * dcfcRatio);
  const ultraCount = Math.round(totalChargers * ultraRatio);
  
  const totalPowerKW = 
    l2Count * EV_CONSTANTS.L2_POWER_KW +
    dcfcCount * EV_CONSTANTS.DCFC_POWER_KW +
    ultraCount * EV_CONSTANTS.ULTRAFAST_POWER_KW;
  
  const estimatedCost = Math.round(
    (l2Count * EV_CONSTANTS.L2_COST +
     dcfcCount * EV_CONSTANTS.DCFC_COST +
     ultraCount * EV_CONSTANTS.ULTRAFAST_COST) * EV_CONSTANTS.INSTALLATION_MULTIPLIER
  );
  
  return {
    id,
    name,
    description,
    l2Count,
    dcfcCount,
    ultraFastCount: ultraCount,
    totalChargers: l2Count + dcfcCount + ultraCount,
    totalPowerKW: Math.round(totalPowerKW),
    estimatedCost,
    rationale: config.rationale,
  };
}
