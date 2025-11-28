/**
 * COMPREHENSIVE USE CASE TEST FIXTURES
 * 
 * Complete fixture data for ALL 30+ use cases in the system
 * Organized by category for easy testing and maintenance
 * 
 * Usage:
 *   import { allUseCaseFixtures, getFixtureBySlug } from './all-use-cases.fixture';
 */

export interface UseCaseFixture {
  slug: string;
  name: string;
  category: string;
  requiredTier: 'free' | 'semi_premium' | 'premium' | 'admin';
  useCaseData: Record<string, any>;
  expectedResults: {
    minPowerMW: number;
    maxPowerMW: number;
    minDurationHrs: number;
    maxDurationHrs: number;
    hasSolar?: boolean;
    hasGeneration?: boolean;
  };
  validationRules?: {
    requiredFields: string[];
    optionalFields: string[];
  };
}

// ============================================================================
// COMMERCIAL & RETAIL (FREE TIER)
// ============================================================================

export const carWashFixture: UseCaseFixture = {
  slug: 'car-wash',
  name: 'Car Wash',
  category: 'commercial',
  requiredTier: 'free',
  useCaseData: {
    numBays: 4,
    operatingHours: 12,
    gridConnection: 'reliable',
    backupDuration: 0
  },
  expectedResults: {
    minPowerMW: 0.03,
    maxPowerMW: 0.1,
    minDurationHrs: 2,
    maxDurationHrs: 6
  },
  validationRules: {
    requiredFields: ['numBays'],
    optionalFields: ['operatingHours', 'gridConnection']
  }
};

export const retailStoreFixture: UseCaseFixture = {
  slug: 'retail',
  name: 'Retail Store',
  category: 'commercial',
  requiredTier: 'free',
  useCaseData: {
    squareFootage: 25000,
    storeType: 'supermarket',
    operatingHours: 16,
    gridConnection: 'reliable',
    hasRestaurant: false
  },
  expectedResults: {
    minPowerMW: 0.5,
    maxPowerMW: 1.5,
    minDurationHrs: 3,
    maxDurationHrs: 6
  }
};

export const groceryStoreFixture: UseCaseFixture = {
  slug: 'grocery',
  name: 'Grocery Store',
  category: 'commercial',
  requiredTier: 'free',
  useCaseData: {
    squareFootage: 30000,
    refrigerationLoad: 250,
    operatingHours: 18,
    gridConnection: 'reliable'
  },
  expectedResults: {
    minPowerMW: 0.6,
    maxPowerMW: 2.0,
    minDurationHrs: 4,
    maxDurationHrs: 8
  }
};

export const restaurantFixture: UseCaseFixture = {
  slug: 'restaurant',
  name: 'Restaurant',
  category: 'commercial',
  requiredTier: 'free',
  useCaseData: {
    squareFootage: 5000,
    restaurantType: 'full_service',
    seatingCapacity: 100,
    operatingHours: 14,
    gridConnection: 'reliable'
  },
  expectedResults: {
    minPowerMW: 0.08,
    maxPowerMW: 0.25,
    minDurationHrs: 2,
    maxDurationHrs: 6
  }
};

// ============================================================================
// OFFICE & PROFESSIONAL (FREE TIER)
// ============================================================================

export const medicalOfficeFixture: UseCaseFixture = {
  slug: 'office',
  name: 'Medical Office',
  category: 'commercial',
  requiredTier: 'free',
  useCaseData: {
    squareFootage: 50000,
    facilityType: 'medical_office',
    operatingHours: 12,
    gridConnection: 'unreliable',
    hasRestaurant: true
  },
  expectedResults: {
    minPowerMW: 0.8,
    maxPowerMW: 2.0,
    minDurationHrs: 3,
    maxDurationHrs: 6,
    hasGeneration: true
  }
};

export const corporateOfficeFixture: UseCaseFixture = {
  slug: 'office',
  name: 'Corporate Office',
  category: 'commercial',
  requiredTier: 'free',
  useCaseData: {
    squareFootage: 100000,
    facilityType: 'corporate_office',
    operatingHours: 10,
    gridConnection: 'reliable',
    hasRestaurant: false
  },
  expectedResults: {
    minPowerMW: 1.5,
    maxPowerMW: 3.5,
    minDurationHrs: 4,
    maxDurationHrs: 8
  }
};

// ============================================================================
// INDUSTRIAL & MANUFACTURING (PREMIUM TIER)
// ============================================================================

export const manufacturingFixture: UseCaseFixture = {
  slug: 'manufacturing',
  name: 'Manufacturing Facility',
  category: 'industrial',
  requiredTier: 'premium',
  useCaseData: {
    squareFootage: 100000,
    facilityType: 'manufacturing',
    industryType: 'automotive',
    shiftCount: 3,
    operatingHours: 24,
    gridConnection: 'unreliable'
  },
  expectedResults: {
    minPowerMW: 2.0,
    maxPowerMW: 5.0,
    minDurationHrs: 6,
    maxDurationHrs: 12,
    hasGeneration: true
  }
};

export const warehouseFixture: UseCaseFixture = {
  slug: 'warehouse',
  name: 'Warehouse',
  category: 'industrial',
  requiredTier: 'premium',
  useCaseData: {
    squareFootage: 200000,
    warehouseType: 'cold_storage',
    refrigerationLoad: 500,
    operatingHours: 24,
    gridConnection: 'reliable'
  },
  expectedResults: {
    minPowerMW: 1.5,
    maxPowerMW: 4.0,
    minDurationHrs: 4,
    maxDurationHrs: 10
  }
};

// ============================================================================
// EV CHARGING (SEMI-PREMIUM TIER)
// ============================================================================

export const evChargingFixture: UseCaseFixture = {
  slug: 'ev-charging',
  name: 'EV Charging Station',
  category: 'transportation',
  requiredTier: 'semi_premium',
  useCaseData: {
    evLevel1Chargers: 5,
    evLevel2Chargers: 10,
    evLevel3Chargers: 4,
    operatingHours: 24,
    gridConnection: 'limited',
    gridCapacity: 0.5
  },
  expectedResults: {
    minPowerMW: 0.3,
    maxPowerMW: 0.8,
    minDurationHrs: 2,
    maxDurationHrs: 6,
    hasGeneration: true
  }
};

// ============================================================================
// DATA CENTER (PREMIUM TIER)
// ============================================================================

export const datacenterFixture: UseCaseFixture = {
  slug: 'datacenter',
  name: 'Data Center',
  category: 'technology',
  requiredTier: 'premium',
  useCaseData: {
    tier: 3,
    itLoadKw: 1000,
    redundancyRequired: true,
    operatingHours: 24,
    gridConnection: 'reliable',
    backupDuration: 24
  },
  expectedResults: {
    minPowerMW: 1.5,
    maxPowerMW: 3.0,
    minDurationHrs: 12,
    maxDurationHrs: 24
  }
};

// ============================================================================
// HOSPITALITY (SEMI-PREMIUM TIER)
// ============================================================================

export const hotelFixture: UseCaseFixture = {
  slug: 'hotel',
  name: 'Hotel',
  category: 'hospitality',
  requiredTier: 'semi_premium',
  useCaseData: {
    numberOfRooms: 200,
    starRating: 4,
    hasRestaurant: true,
    hasPool: true,
    hasConferenceCenter: true,
    operatingHours: 24,
    gridConnection: 'reliable'
  },
  expectedResults: {
    minPowerMW: 0.8,
    maxPowerMW: 2.5,
    minDurationHrs: 4,
    maxDurationHrs: 12
  }
};

export const casinoFixture: UseCaseFixture = {
  slug: 'casino',
  name: 'Casino',
  category: 'hospitality',
  requiredTier: 'premium',
  useCaseData: {
    gamingFloorSize: 50000,
    hasHotel: true,
    numberOfRestaurants: 3,
    operatingHours: 24,
    gridConnection: 'reliable'
  },
  expectedResults: {
    minPowerMW: 3.0,
    maxPowerMW: 8.0,
    minDurationHrs: 6,
    maxDurationHrs: 12
  }
};

// ============================================================================
// HEALTHCARE (PREMIUM TIER)
// ============================================================================

export const hospitalFixture: UseCaseFixture = {
  slug: 'hospital',
  name: 'Hospital',
  category: 'healthcare',
  requiredTier: 'premium',
  useCaseData: {
    numberOfBeds: 300,
    hasCriticalCare: true,
    hasEmergencyRoom: true,
    operatingHours: 24,
    gridConnection: 'unreliable',
    backupDuration: 48
  },
  expectedResults: {
    minPowerMW: 2.5,
    maxPowerMW: 6.0,
    minDurationHrs: 24,
    maxDurationHrs: 48,
    hasGeneration: true
  }
};

// ============================================================================
// AGRICULTURE (PREMIUM TIER)
// ============================================================================

export const farmFixture: UseCaseFixture = {
  slug: 'farm',
  name: 'Farm',
  category: 'agriculture',
  requiredTier: 'premium',
  useCaseData: {
    acres: 500,
    farmType: 'dairy',
    irrigationLoad: 150,
    climateControlLoad: 100,
    operatingHours: 24,
    gridConnection: 'unreliable',
    hasSolarInterest: true
  },
  expectedResults: {
    minPowerMW: 0.3,
    maxPowerMW: 1.0,
    minDurationHrs: 6,
    maxDurationHrs: 12,
    hasSolar: true,
    hasGeneration: true
  }
};

// ============================================================================
// REMOTE/OFF-GRID (PREMIUM TIER)
// ============================================================================

export const miningCampFixture: UseCaseFixture = {
  slug: 'mining-camp',
  name: 'Mining Camp',
  category: 'remote',
  requiredTier: 'premium',
  useCaseData: {
    population: 200,
    facilitySize: 'large',
    operatingHours: 24,
    gridConnection: 'off_grid',
    hasSolarInterest: true
  },
  expectedResults: {
    minPowerMW: 0.5,
    maxPowerMW: 2.0,
    minDurationHrs: 8,
    maxDurationHrs: 16,
    hasSolar: true,
    hasGeneration: true
  }
};

export const microgridFixture: UseCaseFixture = {
  slug: 'microgrid',
  name: 'Microgrid Community',
  category: 'remote',
  requiredTier: 'premium',
  useCaseData: {
    numberOfHomes: 100,
    peakLoad: 0.8,
    operatingHours: 24,
    gridConnection: 'limited',
    gridCapacity: 0.3,
    hasSolarInterest: true
  },
  expectedResults: {
    minPowerMW: 0.5,
    maxPowerMW: 1.5,
    minDurationHrs: 6,
    maxDurationHrs: 12,
    hasSolar: true,
    hasGeneration: true
  }
};

// ============================================================================
// EDUCATIONAL (FREE TIER)
// ============================================================================

export const schoolFixture: UseCaseFixture = {
  slug: 'school',
  name: 'School',
  category: 'educational',
  requiredTier: 'free',
  useCaseData: {
    squareFootage: 80000,
    studentCount: 800,
    hasCafeteria: true,
    hasPool: false,
    operatingHours: 10,
    gridConnection: 'reliable'
  },
  expectedResults: {
    minPowerMW: 0.4,
    maxPowerMW: 1.2,
    minDurationHrs: 3,
    maxDurationHrs: 8
  }
};

export const universityFixture: UseCaseFixture = {
  slug: 'university',
  name: 'University Campus',
  category: 'educational',
  requiredTier: 'premium',
  useCaseData: {
    squareFootage: 500000,
    studentCount: 5000,
    hasDataCenter: true,
    hasResearchLabs: true,
    operatingHours: 24,
    gridConnection: 'reliable'
  },
  expectedResults: {
    minPowerMW: 3.0,
    maxPowerMW: 8.0,
    minDurationHrs: 6,
    maxDurationHrs: 12
  }
};

// ============================================================================
// RESIDENTIAL (FREE TIER)
// ============================================================================

export const residentialFixture: UseCaseFixture = {
  slug: 'residential',
  name: 'Residential Home',
  category: 'residential',
  requiredTier: 'free',
  useCaseData: {
    squareFootage: 2500,
    numberOfOccupants: 4,
    hasEVCharger: true,
    hasPool: false,
    hasSolarInterest: true,
    gridConnection: 'reliable'
  },
  expectedResults: {
    minPowerMW: 0.008,
    maxPowerMW: 0.025,
    minDurationHrs: 4,
    maxDurationHrs: 10,
    hasSolar: true
  }
};

export const multifamilyFixture: UseCaseFixture = {
  slug: 'multifamily',
  name: 'Multifamily Building',
  category: 'residential',
  requiredTier: 'semi_premium',
  useCaseData: {
    numberOfUnits: 50,
    averageUnitSize: 1000,
    hasEVCharging: true,
    hasCentralHVAC: true,
    gridConnection: 'reliable'
  },
  expectedResults: {
    minPowerMW: 0.3,
    maxPowerMW: 0.8,
    minDurationHrs: 4,
    maxDurationHrs: 8
  }
};

// ============================================================================
// AGGREGATED EXPORTS
// ============================================================================

export const allUseCaseFixtures: Record<string, UseCaseFixture> = {
  // Commercial & Retail
  'car-wash': carWashFixture,
  'retail': retailStoreFixture,
  'grocery': groceryStoreFixture,
  'restaurant': restaurantFixture,
  
  // Office & Professional
  'medical-office': medicalOfficeFixture,
  'corporate-office': corporateOfficeFixture,
  
  // Industrial
  'manufacturing': manufacturingFixture,
  'warehouse': warehouseFixture,
  
  // Transportation
  'ev-charging': evChargingFixture,
  
  // Technology
  'datacenter': datacenterFixture,
  
  // Hospitality
  'hotel': hotelFixture,
  'casino': casinoFixture,
  
  // Healthcare
  'hospital': hospitalFixture,
  
  // Agriculture
  'farm': farmFixture,
  
  // Remote/Off-Grid
  'mining-camp': miningCampFixture,
  'microgrid': microgridFixture,
  
  // Educational
  'school': schoolFixture,
  'university': universityFixture,
  
  // Residential
  'residential': residentialFixture,
  'multifamily': multifamilyFixture
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get fixture by slug
 */
export function getFixtureBySlug(slug: string): UseCaseFixture | undefined {
  return allUseCaseFixtures[slug];
}

/**
 * Get all fixtures for a tier
 */
export function getFixturesByTier(tier: string): UseCaseFixture[] {
  return Object.values(allUseCaseFixtures).filter(f => f.requiredTier === tier);
}

/**
 * Get all fixtures for a category
 */
export function getFixturesByCategory(category: string): UseCaseFixture[] {
  return Object.values(allUseCaseFixtures).filter(f => f.category === category);
}

/**
 * Get fixtures that require solar
 */
export function getFixturesWithSolar(): UseCaseFixture[] {
  return Object.values(allUseCaseFixtures).filter(f => f.expectedResults.hasSolar);
}

/**
 * Get fixtures that require generation
 */
export function getFixturesWithGeneration(): UseCaseFixture[] {
  return Object.values(allUseCaseFixtures).filter(f => f.expectedResults.hasGeneration);
}

/**
 * Get all fixture slugs
 */
export function getAllFixtureSlugs(): string[] {
  return Object.keys(allUseCaseFixtures);
}

/**
 * Validate fixture results against expectations
 */
export function validateFixtureResults(
  fixture: UseCaseFixture,
  results: { powerMW: number; durationHrs: number; solarMW?: number; generationRequired?: boolean }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (results.powerMW < fixture.expectedResults.minPowerMW) {
    errors.push(`Power ${results.powerMW} MW below minimum ${fixture.expectedResults.minPowerMW} MW`);
  }
  if (results.powerMW > fixture.expectedResults.maxPowerMW) {
    errors.push(`Power ${results.powerMW} MW above maximum ${fixture.expectedResults.maxPowerMW} MW`);
  }
  if (results.durationHrs < fixture.expectedResults.minDurationHrs) {
    errors.push(`Duration ${results.durationHrs} hrs below minimum ${fixture.expectedResults.minDurationHrs} hrs`);
  }
  if (results.durationHrs > fixture.expectedResults.maxDurationHrs) {
    errors.push(`Duration ${results.durationHrs} hrs above maximum ${fixture.expectedResults.maxDurationHrs} hrs`);
  }
  
  if (fixture.expectedResults.hasSolar && !results.solarMW) {
    errors.push('Solar expected but not present');
  }
  if (fixture.expectedResults.hasGeneration && !results.generationRequired) {
    errors.push('Generation expected but not present');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
