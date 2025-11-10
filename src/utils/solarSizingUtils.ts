// Solar sizing automation based on building characteristics
export interface BuildingCharacteristics {
  useCase?: string;
  buildingSize?: string;
  facilitySize?: string;
  buildingType?: string;
  peakLoad?: number;
  electricalLoad?: number;
  capacity?: number; // For data centers
  numRooms?: number; // For hotels
  storageVolume?: number; // For cold storage
  growingArea?: number; // For vertical farms
  storeSize?: string;
  gamingFloorSize?: number;
}

export interface SolarSizingResult {
  recommendedMW: number;
  minMW: number;
  maxMW: number;
  reasoning: string;
  spaceRequirement: string;
  unitDisplay: 'kW' | 'MW';
}

// Solar sizing ratios by use case (conservative estimates)
const SOLAR_SIZING_PROFILES = {
  'retail': {
    rooftopRatio: 0.15, // 150W per sq ft available roof
    maxRatio: 0.3, // Don't exceed 30% of peak load
    spaceConstraint: true,
    baseLoad: 0.5 // MW baseline for medium retail
  },
  'office': {
    rooftopRatio: 0.12, // 120W per sq ft
    maxRatio: 0.4, 
    spaceConstraint: true,
    baseLoad: 0.3
  },
  'manufacturing': {
    rooftopRatio: 0.08, // Limited roof space due to equipment
    groundRatio: 0.2, // Can use adjacent land
    maxRatio: 0.6,
    spaceConstraint: false,
    baseLoad: 2.0
  },
  'agriculture': {
    rooftopRatio: 0.05,
    groundRatio: 0.5, // Lots of available land
    maxRatio: 1.0,
    spaceConstraint: false,
    baseLoad: 1.0
  },
  'cold-storage': {
    rooftopRatio: 0.1,
    groundRatio: 0.15,
    maxRatio: 0.8, // High constant loads good for solar
    spaceConstraint: false,
    baseLoad: 1.5
  },
  'data-center': {
    rooftopRatio: 0.05, // Very limited due to cooling equipment
    maxRatio: 0.2, // Conservative due to cooling loads
    spaceConstraint: true,
    baseLoad: 5.0
  },
  'hotel': {
    rooftopRatio: 0.1,
    maxRatio: 0.3,
    spaceConstraint: true,
    baseLoad: 1.0
  },
  'casino': {
    rooftopRatio: 0.08, // Gaming floor has complex HVAC
    maxRatio: 0.25,
    spaceConstraint: true,
    baseLoad: 2.0
  },
  'vertical-farm': {
    rooftopRatio: 0.3, // Can support more due to high energy intensity
    groundRatio: 0.4,
    maxRatio: 1.2, // Higher ratio due to constant loads
    spaceConstraint: false,
    baseLoad: 1.2
  },
  'public': {
    rooftopRatio: 0.12,
    groundRatio: 0.2,
    maxRatio: 0.5,
    spaceConstraint: false,
    baseLoad: 0.8
  }
};

// Building size multipliers
const BUILDING_SIZE_MULTIPLIERS = {
  'micro': 0.3,      // < 5,000-15,000 sq ft
  'small': 0.6,      // 5,000-35,000 sq ft  
  'medium-small': 1.0, // 15,000-35,000 sq ft
  'medium': 1.5,     // 35,000-75,000 sq ft
  'large': 2.5,      // > 75,000 sq ft
  'strip': 0.4,      // Strip centers
  'community': 1.2,  // Community centers
  'regional': 2.0    // Regional malls
};

function getBuildingSizeFromString(buildingSize?: string): number {
  if (!buildingSize) return 1.0;
  
  // Extract numeric value from size strings like "Small (5,000-15,000 sq ft)"
  const match = buildingSize.match(/(\d+(?:,\d+)*)/);
  if (match) {
    const numericSize = parseInt(match[1].replace(/,/g, ''));
    // Convert to multiplier based on size
    if (numericSize < 10000) return 0.3;
    if (numericSize < 25000) return 0.6;
    if (numericSize < 50000) return 1.0;
    if (numericSize < 100000) return 1.5;
    return 2.0;
  }
  
  // Use predefined multipliers
  const sizeKey = buildingSize.toLowerCase();
  for (const [key, multiplier] of Object.entries(BUILDING_SIZE_MULTIPLIERS)) {
    if (sizeKey.includes(key)) {
      return multiplier;
    }
  }
  
  return 1.0;
}

export function calculateAutomatedSolarSizing(characteristics: BuildingCharacteristics): SolarSizingResult {
  const useCase = characteristics.useCase || 'office';
  const profile = SOLAR_SIZING_PROFILES[useCase as keyof typeof SOLAR_SIZING_PROFILES] || SOLAR_SIZING_PROFILES.office;
  
  // Building size multiplier
  const buildingSizeMultiplier = getBuildingSizeFromString(
    characteristics.buildingSize || characteristics.facilitySize
  );
  
  // Base calculation
  let baseMW = profile.baseLoad * buildingSizeMultiplier;
  
  // Use specific metrics if available
  if (characteristics.peakLoad) {
    baseMW = characteristics.peakLoad;
  } else if (characteristics.electricalLoad) {
    baseMW = characteristics.electricalLoad;
  } else if (characteristics.capacity && useCase === 'data-center') {
    baseMW = characteristics.capacity;
  } else if (characteristics.numRooms && useCase === 'hotel') {
    baseMW = characteristics.numRooms * 0.02; // 20kW per room baseline
  }
  
  // Calculate solar sizing
  const maxFromLoad = baseMW * profile.maxRatio;
  const rooftopEstimate = baseMW * profile.rooftopRatio * buildingSizeMultiplier;
  const groundEstimate = ('groundRatio' in profile) ? baseMW * profile.groundRatio * buildingSizeMultiplier : 0;
  
  // Recommended size (conservative)
  const recommendedMW = Math.min(maxFromLoad, rooftopEstimate + groundEstimate * 0.5);
  const minMW = rooftopEstimate * 0.5;
  const maxMW = profile.spaceConstraint ? rooftopEstimate : rooftopEstimate + groundEstimate;
  
  // Generate reasoning
  let reasoning = `Based on ${useCase} facilities`;
  if (buildingSizeMultiplier !== 1.0) {
    const sizeDesc = buildingSizeMultiplier < 1.0 ? 'smaller' : 'larger';
    reasoning += ` (${sizeDesc} building)`;
  }
  reasoning += `, typical rooftop solar potential is ${rooftopEstimate.toFixed(1)}MW`;
  if (groundEstimate > 0) {
    reasoning += ` with additional ${groundEstimate.toFixed(1)}MW ground-mount potential`;
  }
  reasoning += `. Recommended size balances space constraints and load offset.`;
  
  // Space requirement calculation
  const totalAcres = recommendedMW * 5; // 5 acres per MW
  const rooftopSqFt = recommendedMW * 1000 * 100; // 100 sq ft per kW for rooftop
  let spaceRequirement = '';
  
  if (profile.spaceConstraint) {
    spaceRequirement = `~${Math.round(rooftopSqFt).toLocaleString()} sq ft rooftop space`;
  } else {
    if (totalAcres < 1) {
      spaceRequirement = `~${Math.round(totalAcres * 43560).toLocaleString()} sq ft`;
    } else {
      spaceRequirement = `~${totalAcres.toFixed(1)} acres (rooftop + ground mount)`;
    }
  }
  
  // Unit display logic
  const unitDisplay = recommendedMW >= 1.0 ? 'MW' : 'kW';
  
  return {
    recommendedMW: Math.max(0.1, Math.round(recommendedMW * 10) / 10),
    minMW: Math.max(0.05, Math.round(minMW * 10) / 10),
    maxMW: Math.max(0.2, Math.round(maxMW * 10) / 10),
    reasoning,
    spaceRequirement,
    unitDisplay
  };
}

// Smart unit conversion for display
export function formatSolarCapacity(MW: number, preferredUnit?: 'kW' | 'MW'): string {
  if (preferredUnit === 'kW' || (!preferredUnit && MW < 1.0)) {
    return `${Math.round(MW * 1000)} kW`;
  }
  return `${MW.toFixed(1)} MW`;
}

// Calculate space requirements
export function calculateSpaceRequirements(MW: number, installationType: 'rooftop' | 'ground' | 'mixed' = 'mixed') {
  const totalSqFt = MW * 1000 * (installationType === 'rooftop' ? 100 : 200); // sq ft per kW
  const acres = totalSqFt / 43560;
  
  return {
    squareFeet: totalSqFt,
    acres: acres,
    formatted: acres >= 1 ? `${acres.toFixed(1)} acres` : `${Math.round(totalSqFt).toLocaleString()} sq ft`
  };
}