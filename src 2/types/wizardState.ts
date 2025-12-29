/**
 * WIZARD STATE TYPES - CENTRALIZED STATE MANAGEMENT
 * 
 * ⚠️ CRITICAL: This is the SINGLE SOURCE OF TRUTH for wizard state structure.
 * 
 * All wizard components should import and use these types.
 * This ensures consistent state shape across:
 * - StreamlinedWizard
 * - HotelWizard
 * - CarWashWizard
 * - EVChargingWizard
 * - DataCenterQuestionnaire
 * 
 * DO NOT duplicate these types in individual components!
 */

// ============================================
// EV CHARGER CONFIGURATION
// ============================================
export interface EVChargerConfig {
  count: number;
  powerKW: number;
}

// Standard EV charger levels with industry-standard power ratings
export const EV_CHARGER_LEVELS = {
  L1: { label: 'Level 1', defaultPowerKW: 1.4, description: '120V - Overnight charging (8-12+ hrs)' },
  L2: { label: 'Level 2', defaultPowerKW: 11, description: '240V - Standard charging (4-8 hrs)' },
  L3: { label: 'DC Fast (DCFC)', defaultPowerKW: 150, description: '480V - Rapid charging (20-45 min)' },
  HPC: { label: 'High Power (HPC)', defaultPowerKW: 350, description: '800V+ - Ultra-fast (10-20 min)' },
} as const;

// ============================================
// WIZARD STATE INTERFACE
// ============================================
export interface WizardState {
  // Section 0: Location
  location: {
    zipCode: string;
    state: string;
    utilityRate: number;
    solarHours: number;
    gridReliabilityScore: number;
  };

  // Section 1: Industry
  industry: {
    type: string;
    subType?: string;
  };

  // Section 2: Facility Details
  facility: {
    squareFeet?: number;     // Offices, retail, manufacturing
    roomCount?: number;      // Hotels, apartments
    bedCount?: number;       // Hospitals
    rackCount?: number;      // Data centers
    bayCount?: number;       // Car washes
    unitCount?: number;      // Apartments
    bays?: number;           // Car washes (legacy)
    occupancy?: number;
    operatingHours?: number;
    // Hospital-specific equipment (for accurate power calculations)
    surgicalSuites?: number; // Operating rooms - high power draw
    mriCount?: number;       // MRI machines - ~100kW each
    ctScannerCount?: number; // CT scanners - ~100kW each
    icuBeds?: number;        // ICU beds - higher power than regular beds
  };

  // Custom question data from templates (industry-specific fields)
  // Contains fields like annualPassengers (airport), gamingSpaceSqFt (casino), etc.
  useCaseData: Record<string, any>;

  // Section 3: Existing Infrastructure
  existingInfrastructure: {
    evChargers: {
      L1: EVChargerConfig;
      L2: EVChargerConfig;
      L3: EVChargerConfig;
    };
    solar: {
      hasExisting: boolean;
      capacityKW: number;
    };
    generator: {
      hasExisting: boolean;
      capacityKW: number;
      fuelType: 'diesel' | 'natural-gas' | 'dual-fuel' | 'propane';
    };
    gridConnection: 'on-grid' | 'unreliable' | 'expensive' | 'limited' | 'off-grid';
  };

  // Section 4: Goals & Add-ons
  goals: {
    primaryGoal: 'backup' | 'savings' | 'sustainability' | 'peak-shaving';
    addSolar: boolean;
    solarKW: number;
    addWind: boolean;
    windKW: number;
    addGenerator: boolean;
    generatorKW: number;
    generatorFuel: 'diesel' | 'natural-gas' | 'dual-fuel' | 'propane';
    addEVChargers: boolean;
    newEVChargers: {
      L2: EVChargerConfig;
      L3: EVChargerConfig;
    };
  };

  // Calculated values (derived from above)
  calculated: {
    baseBuildingLoadKW: number;
    existingEVLoadKW: number;
    newEVLoadKW: number;
    totalPeakDemandKW: number;
    recommendedBatteryKWh: number;
    recommendedBatteryKW: number;
    recommendedSolarKW: number;
    recommendedBackupHours: number;
    // Financial estimates from SSOT (Dec 16, 2025)
    estimatedAnnualSavings: number;
    estimatedPaybackYears: number;
    estimatedCost: number;
  };
}

// ============================================
// INITIAL STATE
// ============================================
export const INITIAL_WIZARD_STATE: WizardState = {
  location: {
    zipCode: '',
    state: '',
    utilityRate: 0.12,
    solarHours: 5,
    gridReliabilityScore: 80,
  },
  industry: {
    type: '',
    subType: '',
  },
  facility: {},
  useCaseData: {},  // Custom question data (annualPassengers, gamingSpaceSqFt, etc.)
  existingInfrastructure: {
    evChargers: {
      L1: { count: 0, powerKW: 1.4 },
      L2: { count: 0, powerKW: 11 },
      L3: { count: 0, powerKW: 150 },
    },
    solar: { hasExisting: false, capacityKW: 0 },
    generator: { hasExisting: false, capacityKW: 0, fuelType: 'natural-gas' },
    gridConnection: 'on-grid',
  },
  goals: {
    primaryGoal: 'backup',
    addSolar: false,
    solarKW: 0,
    addWind: false,
    windKW: 0,
    addGenerator: false,
    generatorKW: 0,
    generatorFuel: 'natural-gas',
    addEVChargers: false,
    newEVChargers: {
      L2: { count: 0, powerKW: 11 },
      L3: { count: 0, powerKW: 150 },
    },
  },
  calculated: {
    baseBuildingLoadKW: 0,
    existingEVLoadKW: 0,
    newEVLoadKW: 0,
    totalPeakDemandKW: 0,
    recommendedBatteryKWh: 0,
    recommendedBatteryKW: 0,
    recommendedSolarKW: 0,
    recommendedBackupHours: 4,
    // Financial estimates from SSOT (Dec 16, 2025)
    estimatedAnnualSavings: 0,
    estimatedPaybackYears: 0,
    estimatedCost: 0,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate total EV charger load from config
 */
export function calculateEVChargerLoad(chargers: {
  L1?: EVChargerConfig;
  L2?: EVChargerConfig;
  L3?: EVChargerConfig;
}): number {
  const l1Load = (chargers.L1?.count || 0) * (chargers.L1?.powerKW || 1.4);
  const l2Load = (chargers.L2?.count || 0) * (chargers.L2?.powerKW || 11);
  const l3Load = (chargers.L3?.count || 0) * (chargers.L3?.powerKW || 150);
  return l1Load + l2Load + l3Load;
}

/**
 * Map grid connection type to SSOT-compatible format
 */
export function mapGridConnectionForSSoT(
  gridConnection: WizardState['existingInfrastructure']['gridConnection']
): 'on-grid' | 'off-grid' | 'limited' {
  switch (gridConnection) {
    case 'on-grid':
      return 'on-grid';
    case 'off-grid':
      return 'off-grid';
    case 'unreliable':
    case 'expensive':
    case 'limited':
      return 'limited';
    default:
      return 'on-grid';
  }
}

/**
 * Create a partial state update (for React setState)
 */
export function updateWizardState(
  currentState: WizardState,
  updates: Partial<WizardState>
): WizardState {
  return {
    ...currentState,
    ...updates,
    location: { ...currentState.location, ...updates.location },
    industry: { ...currentState.industry, ...updates.industry },
    facility: { ...currentState.facility, ...updates.facility },
    existingInfrastructure: {
      ...currentState.existingInfrastructure,
      ...updates.existingInfrastructure,
      evChargers: {
        ...currentState.existingInfrastructure.evChargers,
        ...updates.existingInfrastructure?.evChargers,
      },
      solar: {
        ...currentState.existingInfrastructure.solar,
        ...updates.existingInfrastructure?.solar,
      },
      generator: {
        ...currentState.existingInfrastructure.generator,
        ...updates.existingInfrastructure?.generator,
      },
    },
    goals: {
      ...currentState.goals,
      ...updates.goals,
      newEVChargers: {
        ...currentState.goals.newEVChargers,
        ...updates.goals?.newEVChargers,
      },
    },
    calculated: { ...currentState.calculated, ...updates.calculated },
  };
}
