/**
 * EV CHARGING HUB CALCULATIONS - SINGLE SOURCE OF TRUTH
 * 
 * Industry-standard EV charger power levels and pricing.
 * Based on SAE J1772, CCS/CHAdeMO, and real-world deployment data.
 * 
 * Charger Categories:
 * - Level 1 (L1): 1.4-1.9 kW (120V residential) - rarely used commercially
 * - Level 2 (L2): 7-22 kW (240V AC) - most common commercial
 * - DC Fast Charging (DCFC): 50-150 kW - standard fast charging
 * - High Power Charging (HPC): 150-350 kW - premium fast charging
 * - Ultra-Fast: 350+ kW - emerging technology
 * 
 * DER Integration (NEW - Dec 2025):
 * - Grid Services: Demand response, frequency regulation
 * - V2G (Vehicle-to-Grid): Bi-directional power flow
 * - Prosumer Mode: Combined charging + storage + solar
 * 
 * Reference: West London EV Hub Quote (Oct 2025)
 * - 100 × 7 kW L2 = 700 kW
 * - 20 × 150 kW DCFC = 3,000 kW
 * - 16 × 350 kW HPC = 5,600 kW
 * - Total = 9,300 kW @ ~70% concurrency = 6.5 MW peak demand
 */

// ============================================================================
// CHARGER SPECIFICATIONS - INDUSTRY STANDARDS
// ============================================================================

export const EV_CHARGER_SPECS = {
  // Level 1 - Residential (rarely used in commercial)
  level1: {
    name: 'Level 1 (120V)',
    minPowerKW: 1.4,
    maxPowerKW: 1.9,
    typicalPowerKW: 1.9,
    voltage: 120,
    connector: 'J1772',
    useCase: 'Residential overnight charging',
    typicalChargeTimeHrs: 20, // 0-100% for 60kWh battery
  },
  
  // Level 2 - Commercial AC Charging
  level2_7kw: {
    name: 'Level 2 (7 kW)',
    powerKW: 7,
    voltage: 240,
    connector: 'J1772',
    useCase: 'Workplace, retail destinations',
    typicalChargeTimeHrs: 8, // 0-100% for 60kWh battery
    hardwareCostUSD: 5000,
    installCostUSD: 3000,
    v2gCapable: false,
  },
  level2_11kw: {
    name: 'Level 2 (11 kW)',
    powerKW: 11,
    voltage: 240,
    connector: 'J1772/Type 2',
    useCase: 'Fleet depots, multifamily',
    typicalChargeTimeHrs: 5.5,
    hardwareCostUSD: 6500,
    installCostUSD: 3500,
    v2gCapable: true, // Some 11kW chargers support V2G
  },
  level2_19kw: {
    name: 'Level 2 (19.2 kW)',
    powerKW: 19.2,
    voltage: 240,
    connector: 'J1772',
    useCase: 'Premium commercial',
    typicalChargeTimeHrs: 3,
    hardwareCostUSD: 8000,
    installCostUSD: 4000,
    v2gCapable: true,
  },
  level2_22kw: {
    name: 'Level 2 (22 kW)',
    powerKW: 22,
    voltage: 400,
    connector: 'Type 2',
    useCase: 'European standard',
    typicalChargeTimeHrs: 2.7,
    hardwareCostUSD: 10000,
    installCostUSD: 4500,
    v2gCapable: true,
  },
  
  // DC Fast Charging (DCFC)
  dcfc_50kw: {
    name: 'DCFC (50 kW)',
    powerKW: 50,
    voltage: 400,
    connector: 'CCS/CHAdeMO',
    useCase: 'Budget fast charging',
    typicalChargeTimeHrs: 1.2,
    hardwareCostUSD: 35000,
    installCostUSD: 15000,
    v2gCapable: true, // Most DCFC support V2G with proper inverters
  },
  dcfc_150kw: {
    name: 'DCFC (150 kW)',
    powerKW: 150,
    voltage: 400,
    connector: 'CCS',
    useCase: 'Standard highway/urban fast charging',
    typicalChargeTimeHrs: 0.4,
    hardwareCostUSD: 55000,
    installCostUSD: 30000,
    v2gCapable: true,
  },
  
  // High Power Charging (HPC)
  hpc_250kw: {
    name: 'HPC (250 kW)',
    powerKW: 250,
    voltage: 800,
    connector: 'CCS',
    useCase: 'Premium fast charging',
    typicalChargeTimeHrs: 0.24,
    hardwareCostUSD: 90000,
    installCostUSD: 40000,
    v2gCapable: true,
  },
  hpc_350kw: {
    name: 'HPC (350 kW)',
    powerKW: 350,
    voltage: 800,
    connector: 'CCS',
    useCase: 'Ultra-premium, highway corridors',
    typicalChargeTimeHrs: 0.17,
    hardwareCostUSD: 130000,
    installCostUSD: 50000,
    v2gCapable: true,
  },
} as const;

// ============================================================================
// DER / GRID SERVICES CONFIGURATION
// ============================================================================

export const GRID_SERVICES = {
  demandResponse: {
    name: 'Demand Response',
    description: 'Reduce charging load during grid stress events',
    revenuePerKWYear: 50, // $50/kW-year typical DR payment
    participationHoursPerYear: 100, // Typical DR event hours
    penaltyPerMissedEvent: 500,
  },
  frequencyRegulation: {
    name: 'Frequency Regulation',
    description: 'Provide grid frequency support via fast dispatch',
    revenuePerMWHour: 25, // $/MWh for regulation service
    availabilityHoursPerYear: 4000, // Hours battery can participate
    requiresBidirectional: true,
  },
  peakShaving: {
    name: 'Peak Demand Shaving',
    description: 'Reduce utility demand charges',
    savingsPerKWMonth: 15, // Typical demand charge savings
    typicalReductionPercent: 30,
  },
  arbitrage: {
    name: 'Energy Arbitrage',
    description: 'Buy low, sell high during price differentials',
    typicalSpreadPerKWh: 0.08, // $/kWh spread
    cyclesPerDay: 1.5,
    requiresStorageWithCharging: true,
  },
  capacityPayment: {
    name: 'Capacity Payment',
    description: 'Payment for guaranteed capacity availability',
    revenuePerKWYear: 80, // $/kW-year capacity payment
    requiredAvailability: 0.95, // 95% availability required
  },
} as const;

export const V2G_CONFIG = {
  // V2G-capable vehicles (as of 2024-2025)
  compatibleVehicles: [
    'Nissan Leaf (CHAdeMO)',
    'Ford F-150 Lightning',
    'Hyundai Ioniq 5/6 (with V2L adapter)',
    'Kia EV6 (with V2L adapter)',
    'VW ID.4 (upcoming)',
    'BMW iX (upcoming)',
  ],
  // V2G economics
  avgVehicleBatteryKWh: 77, // Average EV battery size
  usableForV2G: 0.30, // 30% of battery typically available for V2G
  roundTripEfficiency: 0.85, // 85% round-trip efficiency
  batteryDegradationCostPerCycle: 0.02, // $/kWh degradation cost
  // Revenue potential
  v2gRevenuePerKWhDischarge: 0.15, // Revenue per kWh discharged
  avgDischargeEventsPerDay: 2,
} as const;

export const PROSUMER_MODES = {
  standard: {
    name: 'Standard Charging',
    description: 'Traditional one-way charging only',
    features: ['EV Charging', 'Basic monitoring'],
    gridServicesEnabled: false,
    v2gEnabled: false,
  },
  gridInteractive: {
    name: 'Grid-Interactive',
    description: 'Smart charging with demand response',
    features: ['Smart Charging', 'Demand Response', 'Load Management', 'TOU Optimization'],
    gridServicesEnabled: true,
    v2gEnabled: false,
  },
  v2gReady: {
    name: 'V2G Ready',
    description: 'Bi-directional charging with grid services',
    features: ['Bi-directional Charging', 'V2G/V2H', 'Grid Services', 'Frequency Regulation', 'Peak Shaving'],
    gridServicesEnabled: true,
    v2gEnabled: true,
  },
  fullProsumer: {
    name: 'Full Prosumer',
    description: 'Complete DER integration with solar + storage',
    features: ['Solar Integration', 'BESS + EV', 'V2G', 'All Grid Services', 'Energy Trading', 'Microgrid Capable'],
    gridServicesEnabled: true,
    v2gEnabled: true,
    solarIntegration: true,
    storageIntegration: true,
  },
} as const;

// ============================================================================
// EV CHARGING HUB CONFIGURATION TYPE
// ============================================================================

export interface EVChargerConfig {
  // Level 2 AC Chargers
  level2_7kw?: number;
  level2_11kw?: number;
  level2_19kw?: number;
  level2_22kw?: number;
  
  // DC Fast Chargers
  dcfc_50kw?: number;
  dcfc_150kw?: number;
  
  // High Power Chargers
  hpc_250kw?: number;
  hpc_350kw?: number;
  
  // Legacy fields (for backward compatibility)
  level1Count?: number;
  level2Count?: number;      // Maps to level2_19kw (commercial default)
  dcFastCount?: number;      // Maps to dcfc_150kw (standard DCFC)
  numberOfLevel1Chargers?: number;
  numberOfLevel2Chargers?: number;
  numberOfDCFastChargers?: number;
}

export interface EVHubPowerResult {
  totalPowerKW: number;
  totalPowerMW: number;
  peakDemandKW: number;       // After concurrency factor
  peakDemandMW: number;
  concurrencyFactor: number;
  
  breakdown: {
    level2KW: number;
    dcfcKW: number;
    hpcKW: number;
    chargerCounts: {
      level2Total: number;
      dcfcTotal: number;
      hpcTotal: number;
    };
  };
  
  description: string;
  calculationMethod: string;
}

export interface EVHubCostResult {
  hardwareCostUSD: number;
  installationCostUSD: number;
  makeReadyCostUSD: number;     // Civil work, conduits, panels
  networkingCostUSD: number;    // Per-port networking
  contingencyUSD: number;
  totalCostUSD: number;
  
  breakdown: {
    level2Hardware: number;
    level2Install: number;
    dcfcHardware: number;
    dcfcInstall: number;
    hpcHardware: number;
    hpcInstall: number;
  };
}

// ============================================================================
// POWER CALCULATION
// ============================================================================

/**
 * Calculate total power requirement for an EV Charging Hub
 * Supports both new granular config and legacy field names
 */
export function calculateEVHubPower(
  config: EVChargerConfig,
  concurrencyPercent: number = 70
): EVHubPowerResult {
  // Map legacy field names to new granular config
  const normalizedConfig = normalizeEVChargerConfig(config);
  
  // Level 2 calculations
  const l2_7kw = (normalizedConfig.level2_7kw || 0) * EV_CHARGER_SPECS.level2_7kw.powerKW;
  const l2_11kw = (normalizedConfig.level2_11kw || 0) * EV_CHARGER_SPECS.level2_11kw.powerKW;
  const l2_19kw = (normalizedConfig.level2_19kw || 0) * EV_CHARGER_SPECS.level2_19kw.powerKW;
  const l2_22kw = (normalizedConfig.level2_22kw || 0) * EV_CHARGER_SPECS.level2_22kw.powerKW;
  const level2TotalKW = l2_7kw + l2_11kw + l2_19kw + l2_22kw;
  
  // DCFC calculations
  const dcfc_50 = (normalizedConfig.dcfc_50kw || 0) * EV_CHARGER_SPECS.dcfc_50kw.powerKW;
  const dcfc_150 = (normalizedConfig.dcfc_150kw || 0) * EV_CHARGER_SPECS.dcfc_150kw.powerKW;
  const dcfcTotalKW = dcfc_50 + dcfc_150;
  
  // HPC calculations
  const hpc_250 = (normalizedConfig.hpc_250kw || 0) * EV_CHARGER_SPECS.hpc_250kw.powerKW;
  const hpc_350 = (normalizedConfig.hpc_350kw || 0) * EV_CHARGER_SPECS.hpc_350kw.powerKW;
  const hpcTotalKW = hpc_250 + hpc_350;
  
  const totalPowerKW = level2TotalKW + dcfcTotalKW + hpcTotalKW;
  const concurrency = Math.min(concurrencyPercent, 100) / 100;
  const peakDemandKW = totalPowerKW * concurrency;
  
  // Count totals
  const level2Total = (normalizedConfig.level2_7kw || 0) + (normalizedConfig.level2_11kw || 0) + 
                      (normalizedConfig.level2_19kw || 0) + (normalizedConfig.level2_22kw || 0);
  const dcfcTotal = (normalizedConfig.dcfc_50kw || 0) + (normalizedConfig.dcfc_150kw || 0);
  const hpcTotal = (normalizedConfig.hpc_250kw || 0) + (normalizedConfig.hpc_350kw || 0);
  
  // Build description
  const parts: string[] = [];
  if (level2Total > 0) parts.push(`${level2Total} L2 (${level2TotalKW.toLocaleString()} kW)`);
  if (dcfcTotal > 0) parts.push(`${dcfcTotal} DCFC (${dcfcTotalKW.toLocaleString()} kW)`);
  if (hpcTotal > 0) parts.push(`${hpcTotal} HPC (${hpcTotalKW.toLocaleString()} kW)`);
  
  return {
    totalPowerKW,
    totalPowerMW: totalPowerKW / 1000,
    peakDemandKW,
    peakDemandMW: peakDemandKW / 1000,
    concurrencyFactor: concurrency,
    breakdown: {
      level2KW: level2TotalKW,
      dcfcKW: dcfcTotalKW,
      hpcKW: hpcTotalKW,
      chargerCounts: {
        level2Total,
        dcfcTotal,
        hpcTotal,
      },
    },
    description: parts.join(' + ') + ` = ${totalPowerKW.toLocaleString()} kW total`,
    calculationMethod: 'SAE J1772 / CCS / CHAdeMO standards',
  };
}

/**
 * Normalize legacy field names to new granular config
 */
function normalizeEVChargerConfig(config: EVChargerConfig): EVChargerConfig {
  const normalized: EVChargerConfig = { ...config };
  
  // Map legacy level2Count/numberOfLevel2Chargers to level2_19kw (commercial default)
  const legacyL2 = config.level2Count || config.numberOfLevel2Chargers || 0;
  if (legacyL2 > 0 && !config.level2_7kw && !config.level2_11kw && !config.level2_19kw && !config.level2_22kw) {
    normalized.level2_19kw = legacyL2;
  }
  
  // Map legacy dcFastCount/numberOfDCFastChargers to dcfc_150kw (standard DCFC)
  const legacyDC = config.dcFastCount || config.numberOfDCFastChargers || 0;
  if (legacyDC > 0 && !config.dcfc_50kw && !config.dcfc_150kw) {
    normalized.dcfc_150kw = legacyDC;
  }
  
  return normalized;
}

// ============================================================================
// COST CALCULATION
// ============================================================================

/**
 * Calculate total cost for EV Charging Hub equipment and installation
 * Based on West London EV Hub pricing model
 */
export function calculateEVHubCosts(
  config: EVChargerConfig,
  options: {
    makeReadyPercentOfHardware?: number;  // Default 20%
    networkingPerPortUSD?: number;        // Default $500/port
    contingencyPercent?: number;          // Default 10%
    logisticsPercent?: number;            // Default 8%
    importDutyPercent?: number;           // Default 2% (for imported equipment)
  } = {}
): EVHubCostResult {
  const {
    makeReadyPercentOfHardware = 20,
    networkingPerPortUSD = 500,
    contingencyPercent = 10,
  } = options;
  
  const normalizedConfig = normalizeEVChargerConfig(config);
  
  // Level 2 costs
  const l2_7kw_hw = (normalizedConfig.level2_7kw || 0) * EV_CHARGER_SPECS.level2_7kw.hardwareCostUSD;
  const l2_11kw_hw = (normalizedConfig.level2_11kw || 0) * EV_CHARGER_SPECS.level2_11kw.hardwareCostUSD;
  const l2_19kw_hw = (normalizedConfig.level2_19kw || 0) * EV_CHARGER_SPECS.level2_19kw.hardwareCostUSD;
  const l2_22kw_hw = (normalizedConfig.level2_22kw || 0) * EV_CHARGER_SPECS.level2_22kw.hardwareCostUSD;
  const level2Hardware = l2_7kw_hw + l2_11kw_hw + l2_19kw_hw + l2_22kw_hw;
  
  const l2_7kw_inst = (normalizedConfig.level2_7kw || 0) * EV_CHARGER_SPECS.level2_7kw.installCostUSD;
  const l2_11kw_inst = (normalizedConfig.level2_11kw || 0) * EV_CHARGER_SPECS.level2_11kw.installCostUSD;
  const l2_19kw_inst = (normalizedConfig.level2_19kw || 0) * EV_CHARGER_SPECS.level2_19kw.installCostUSD;
  const l2_22kw_inst = (normalizedConfig.level2_22kw || 0) * EV_CHARGER_SPECS.level2_22kw.installCostUSD;
  const level2Install = l2_7kw_inst + l2_11kw_inst + l2_19kw_inst + l2_22kw_inst;
  
  // DCFC costs
  const dcfc_50_hw = (normalizedConfig.dcfc_50kw || 0) * EV_CHARGER_SPECS.dcfc_50kw.hardwareCostUSD;
  const dcfc_150_hw = (normalizedConfig.dcfc_150kw || 0) * EV_CHARGER_SPECS.dcfc_150kw.hardwareCostUSD;
  const dcfcHardware = dcfc_50_hw + dcfc_150_hw;
  
  const dcfc_50_inst = (normalizedConfig.dcfc_50kw || 0) * EV_CHARGER_SPECS.dcfc_50kw.installCostUSD;
  const dcfc_150_inst = (normalizedConfig.dcfc_150kw || 0) * EV_CHARGER_SPECS.dcfc_150kw.installCostUSD;
  const dcfcInstall = dcfc_50_inst + dcfc_150_inst;
  
  // HPC costs
  const hpc_250_hw = (normalizedConfig.hpc_250kw || 0) * EV_CHARGER_SPECS.hpc_250kw.hardwareCostUSD;
  const hpc_350_hw = (normalizedConfig.hpc_350kw || 0) * EV_CHARGER_SPECS.hpc_350kw.hardwareCostUSD;
  const hpcHardware = hpc_250_hw + hpc_350_hw;
  
  const hpc_250_inst = (normalizedConfig.hpc_250kw || 0) * EV_CHARGER_SPECS.hpc_250kw.installCostUSD;
  const hpc_350_inst = (normalizedConfig.hpc_350kw || 0) * EV_CHARGER_SPECS.hpc_350kw.installCostUSD;
  const hpcInstall = hpc_250_inst + hpc_350_inst;
  
  // Totals
  const totalHardware = level2Hardware + dcfcHardware + hpcHardware;
  const totalInstall = level2Install + dcfcInstall + hpcInstall;
  const makeReadyCost = totalHardware * (makeReadyPercentOfHardware / 100);
  
  // Count ports for networking
  const totalPorts = (normalizedConfig.level2_7kw || 0) + (normalizedConfig.level2_11kw || 0) +
                     (normalizedConfig.level2_19kw || 0) + (normalizedConfig.level2_22kw || 0) +
                     (normalizedConfig.dcfc_50kw || 0) + (normalizedConfig.dcfc_150kw || 0) +
                     (normalizedConfig.hpc_250kw || 0) + (normalizedConfig.hpc_350kw || 0);
  const networkingCost = totalPorts * networkingPerPortUSD;
  
  const subtotal = totalHardware + totalInstall + makeReadyCost + networkingCost;
  const contingency = subtotal * (contingencyPercent / 100);
  
  return {
    hardwareCostUSD: totalHardware,
    installationCostUSD: totalInstall,
    makeReadyCostUSD: makeReadyCost,
    networkingCostUSD: networkingCost,
    contingencyUSD: contingency,
    totalCostUSD: subtotal + contingency,
    breakdown: {
      level2Hardware,
      level2Install,
      dcfcHardware,
      dcfcInstall,
      hpcHardware,
      hpcInstall,
    },
  };
}

// ============================================================================
// BESS SIZING FOR EV HUB
// ============================================================================

/**
 * Calculate recommended BESS size for an EV Charging Hub
 * Based on peak demand management and load shifting requirements
 */
export function calculateEVHubBESSSize(
  powerResult: EVHubPowerResult,
  options: {
    peakShavingTarget?: number;      // Target % of peak to shave (default 30%)
    durationHours?: number;          // BESS duration (default 2 hours)
    includeGridBuffer?: boolean;     // Add 20% buffer for grid instability
  } = {}
): {
  recommendedPowerMW: number;
  recommendedEnergyMWh: number;
  durationHours: number;
  reasoning: string;
} {
  const {
    peakShavingTarget = 30,
    durationHours = 2,
    includeGridBuffer = true,
  } = options;
  
  // BESS should cover peak shaving target
  const shavingPowerMW = powerResult.peakDemandMW * (peakShavingTarget / 100);
  
  // Add buffer for grid instability if requested
  const bufferMultiplier = includeGridBuffer ? 1.2 : 1.0;
  const recommendedPowerMW = Math.round(shavingPowerMW * bufferMultiplier * 100) / 100;
  
  // Energy = Power × Duration
  const recommendedEnergyMWh = recommendedPowerMW * durationHours;
  
  return {
    recommendedPowerMW,
    recommendedEnergyMWh,
    durationHours,
    reasoning: `${peakShavingTarget}% peak shaving of ${powerResult.peakDemandMW.toFixed(1)} MW peak demand × ${bufferMultiplier}x buffer = ${recommendedPowerMW.toFixed(1)} MW BESS for ${durationHours}h duration`,
  };
}

// ============================================================================
// WEST LONDON EXAMPLE - VALIDATION
// ============================================================================

/**
 * West London EV Hub configuration for validation
 * Total: 100 × 7kW L2 + 20 × 150kW DCFC + 16 × 350kW HPC
 */
export const WEST_LONDON_EV_HUB_CONFIG: EVChargerConfig = {
  level2_7kw: 100,
  dcfc_150kw: 20,
  hpc_350kw: 16,
};

// ============================================================================
// GRID SERVICES REVENUE CALCULATION
// ============================================================================

export interface GridServicesRevenueResult {
  demandResponseRevenue: number;
  frequencyRegulationRevenue: number;
  peakShavingSavings: number;
  arbitrageRevenue: number;
  capacityPaymentRevenue: number;
  totalAnnualRevenue: number;
  v2gRevenue: number;
  breakdown: {
    demandResponse: { kWEnrolled: number; eventsPerYear: number; revenuePerEvent: number };
    frequencyReg: { mwCapacity: number; hoursAvailable: number; pricePerMWh: number };
    peakShaving: { kWReduced: number; demandChargePerKW: number; monthsPerYear: number };
    arbitrage: { kWhCycled: number; spreadPerKWh: number; daysPerYear: number };
    capacity: { kWCapacity: number; pricePerKWYear: number };
  };
}

/**
 * Calculate potential grid services revenue for an EV charging hub with BESS
 */
export function calculateGridServicesRevenue(
  powerResult: EVHubPowerResult,
  bessConfig: {
    powerMW: number;
    energyMWh: number;
  },
  options: {
    enableDemandResponse?: boolean;
    enableFrequencyReg?: boolean;
    enablePeakShaving?: boolean;
    enableArbitrage?: boolean;
    enableCapacityPayment?: boolean;
    demandChargePerKW?: number;
    v2gVehicleCount?: number; // Number of V2G-capable vehicles typically connected
  } = {}
): GridServicesRevenueResult {
  const {
    enableDemandResponse = true,
    enableFrequencyReg = true,
    enablePeakShaving = true,
    enableArbitrage = true,
    enableCapacityPayment = true,
    demandChargePerKW = 15,
    v2gVehicleCount = 0,
  } = options;

  const bessKW = bessConfig.powerMW * 1000;
  const bessKWh = bessConfig.energyMWh * 1000;

  // Demand Response Revenue
  const drKWEnrolled = enableDemandResponse ? bessKW : 0;
  const drEventsPerYear = 15; // Typical DR events per year
  const drRevenuePerEvent = drKWEnrolled * (GRID_SERVICES.demandResponse.revenuePerKWYear / drEventsPerYear);
  const demandResponseRevenue = drKWEnrolled * GRID_SERVICES.demandResponse.revenuePerKWYear;

  // Frequency Regulation Revenue
  const freqRegMW = enableFrequencyReg ? bessConfig.powerMW * 0.5 : 0; // 50% of capacity for freq reg
  const freqRegHours = GRID_SERVICES.frequencyRegulation.availabilityHoursPerYear * 0.3; // 30% utilization
  const frequencyRegulationRevenue = freqRegMW * freqRegHours * GRID_SERVICES.frequencyRegulation.revenuePerMWHour;

  // Peak Shaving Savings
  const peakShavingKW = enablePeakShaving ? Math.min(bessKW, powerResult.peakDemandKW * 0.3) : 0;
  const peakShavingSavings = peakShavingKW * demandChargePerKW * 12; // 12 months

  // Energy Arbitrage Revenue
  const arbitrageCycles = enableArbitrage ? GRID_SERVICES.arbitrage.cyclesPerDay * 250 : 0; // 250 working days
  const arbitrageKWh = arbitrageCycles * bessKWh * 0.8; // 80% DoD
  const arbitrageRevenue = arbitrageKWh * GRID_SERVICES.arbitrage.typicalSpreadPerKWh;

  // Capacity Payment Revenue
  const capacityKW = enableCapacityPayment ? bessKW * GRID_SERVICES.capacityPayment.requiredAvailability : 0;
  const capacityPaymentRevenue = capacityKW * GRID_SERVICES.capacityPayment.revenuePerKWYear;

  // V2G Revenue (if V2G vehicles are present)
  const v2gKWhPerVehicle = V2G_CONFIG.avgVehicleBatteryKWh * V2G_CONFIG.usableForV2G * V2G_CONFIG.roundTripEfficiency;
  const v2gDailyKWh = v2gVehicleCount * v2gKWhPerVehicle * V2G_CONFIG.avgDischargeEventsPerDay;
  const v2gAnnualKWh = v2gDailyKWh * 250; // 250 days/year
  const v2gRevenue = v2gAnnualKWh * V2G_CONFIG.v2gRevenuePerKWhDischarge;

  const totalAnnualRevenue = demandResponseRevenue + frequencyRegulationRevenue + 
                              peakShavingSavings + arbitrageRevenue + capacityPaymentRevenue + v2gRevenue;

  return {
    demandResponseRevenue: Math.round(demandResponseRevenue),
    frequencyRegulationRevenue: Math.round(frequencyRegulationRevenue),
    peakShavingSavings: Math.round(peakShavingSavings),
    arbitrageRevenue: Math.round(arbitrageRevenue),
    capacityPaymentRevenue: Math.round(capacityPaymentRevenue),
    v2gRevenue: Math.round(v2gRevenue),
    totalAnnualRevenue: Math.round(totalAnnualRevenue),
    breakdown: {
      demandResponse: { kWEnrolled: drKWEnrolled, eventsPerYear: drEventsPerYear, revenuePerEvent: Math.round(drRevenuePerEvent) },
      frequencyReg: { mwCapacity: freqRegMW, hoursAvailable: freqRegHours, pricePerMWh: GRID_SERVICES.frequencyRegulation.revenuePerMWHour },
      peakShaving: { kWReduced: peakShavingKW, demandChargePerKW, monthsPerYear: 12 },
      arbitrage: { kWhCycled: Math.round(arbitrageKWh), spreadPerKWh: GRID_SERVICES.arbitrage.typicalSpreadPerKWh, daysPerYear: 250 },
      capacity: { kWCapacity: capacityKW, pricePerKWYear: GRID_SERVICES.capacityPayment.revenuePerKWYear },
    },
  };
}

// ============================================================================
// SMART RECOMMENDATION ENGINE - For EVChargingWizard
// ============================================================================
// Migrated from EVChargingWizard.tsx for SSOT compliance (Dec 2025)

/**
 * EV Station types with their characteristics
 */
export const EV_STATION_TYPES = {
  highway: {
    name: 'Highway Charging Station',
    description: 'High-speed charging for travelers',
    avgDwellTime: '15-30 min',
    defaultChargers: { level1: 0, level2: 4, dcfc: 6, hpc: 4 },
    recommendation: 'Focus on DCFC/HPC for quick turnaround',
    gridServicesNote: 'Excellent for frequency regulation due to consistent throughput',
    stepExplanation: 'Highway stations prioritize fast charging - most customers want to charge and go.',
  },
  urban: {
    name: 'Urban Charging Hub',
    description: 'City center charging with mixed speeds',
    avgDwellTime: '1-4 hours',
    defaultChargers: { level1: 0, level2: 12, dcfc: 4, hpc: 2 },
    recommendation: 'Mix of L2 for local users, DCFC/HPC for through traffic',
    gridServicesNote: 'Good for demand response - predictable daily patterns',
    stepExplanation: 'Urban hubs serve commuters, shoppers, and rideshare - diverse charging needs.',
  },
  destination: {
    name: 'Destination Charging',
    description: 'Retail, dining, entertainment venues',
    avgDwellTime: '2-6 hours',
    defaultChargers: { level1: 2, level2: 16, dcfc: 2, hpc: 0 },
    recommendation: 'Primarily L2 - customers are staying anyway',
    gridServicesNote: 'Ideal for arbitrage - charge during off-peak, discharge during peak',
    stepExplanation: 'Destination chargers work while you shop/dine - time is not a constraint.',
  },
  fleet: {
    name: 'Fleet Depot',
    description: 'Overnight fleet vehicle charging',
    avgDwellTime: '8-12 hours',
    defaultChargers: { level1: 8, level2: 24, dcfc: 4, hpc: 0 },
    recommendation: 'Maximize L2 for overnight, DCFC for mid-day top-ups',
    gridServicesNote: 'Perfect for V2G - predictable schedules, large batteries',
    stepExplanation: 'Fleet depots optimize for overnight charging at lowest rates.',
  },
  retail: {
    name: 'Retail Co-Located',
    description: 'Charging at gas stations, convenience stores',
    avgDwellTime: '20-45 min',
    defaultChargers: { level1: 0, level2: 4, dcfc: 4, hpc: 2 },
    recommendation: 'DCFC-heavy for convenience store dwell time',
    gridServicesNote: 'Good baseline load for peak shaving programs',
    stepExplanation: 'Retail locations balance speed with customer experience.',
  },
} as const;

export type EVStationType = keyof typeof EV_STATION_TYPES;

/**
 * Scale multipliers for station sizing
 * Keys match EVChargingWizard.tsx SCALE_OPTIONS
 */
export const EV_SCALE_OPTIONS = {
  starter: { name: 'Getting Started', multiplier: 0.5, description: '2-4 chargers' },
  growing: { name: 'Growing', multiplier: 1.0, description: '5-10 chargers' },
  established: { name: 'Established', multiplier: 2.0, description: '11-20 chargers' },
  enterprise: { name: 'Enterprise', multiplier: 3.0, description: '20+ chargers' },
} as const;

export type EVScaleOption = keyof typeof EV_SCALE_OPTIONS;

/**
 * Input for EV station smart recommendation
 */
export interface EVStationRecommendationInput {
  stationType: EVStationType;
  scale: EVScaleOption;
  customChargers?: {
    level1: number;
    level2: number;
    dcfc: number;
    hpc: number;
  };
  goals: {
    wantsBatteryStorage: boolean;
    wantsSolarCanopy: boolean;
    wantsGridServices: boolean;
    wantsPowerGenerator: boolean;
  };
  electricityRate?: number;
  demandCharge?: number;
}

/**
 * EV station recommendation result
 */
export interface EVStationRecommendationResult {
  chargers: {
    level1: number;
    level2: number;
    dcfc: number;
    hpc: number;
    totalPowerKW: number;
    peakDemandKW: number;
  };
  costs: {
    monthlyElectricity: number;
    monthlyDemandCharges: number;
  };
  recommendation: {
    bessKW: number;
    bessKWh: number;
    solarKW: number;
    generatorKW: number;
  };
  savings: {
    monthly: number;
    annual: number;
    demandChargeReduction: number;
    solarOffset: number;
    gridServices: number;
  };
  stationInsight: string;
  gridServicesNote: string;
  dwellTime: string;
  stepExplanation: string;
}

/**
 * SMART RECOMMENDATION ENGINE FOR EV CHARGING STATIONS
 * Migrated from EVChargingWizard.tsx for SSOT compliance
 * 
 * Auto-calculates optimal BESS + solar sizing based on:
 * - Station type (highway, urban, destination, fleet, retail)
 * - Scale (small to enterprise)
 * - User goals (storage, solar, grid services, backup)
 * 
 * Goal-based multipliers affect final sizing and savings calculations.
 * 
 * @param input - Station configuration and goals
 * @returns Complete recommendation with chargers, BESS, solar, and savings
 */
export function calculateEVStationRecommendation(input: EVStationRecommendationInput): EVStationRecommendationResult {
  const { stationType, scale, customChargers, goals } = input;
  const { wantsBatteryStorage, wantsSolarCanopy, wantsGridServices, wantsPowerGenerator } = goals;
  
  const station = EV_STATION_TYPES[stationType];
  const scaleConfig = EV_SCALE_OPTIONS[scale];
  
  // Calculate charger counts based on station defaults * scale multiplier
  const level1Count = Math.round(station.defaultChargers.level1 * scaleConfig.multiplier);
  const level2Count = Math.round(station.defaultChargers.level2 * scaleConfig.multiplier);
  const dcfcCount = Math.round(station.defaultChargers.dcfc * scaleConfig.multiplier);
  const hpcCount = Math.round(station.defaultChargers.hpc * scaleConfig.multiplier);
  
  // Use customChargers if provided, otherwise use calculated defaults
  const finalLevel1 = customChargers?.level1 ?? level1Count;
  const finalLevel2 = customChargers?.level2 ?? Math.max(2, level2Count);
  const finalDCFC = customChargers?.dcfc ?? dcfcCount;
  const finalHPC = customChargers?.hpc ?? hpcCount;
  
  // Calculate power requirements (using industry-standard values)
  const level1Power = finalLevel1 * 1.9; // Level 1 is 1.9 kW (120V/16A)
  const level2Power = finalLevel2 * 11; // Average Level 2 is 11kW
  const dcfcPower = finalDCFC * 150; // Average DCFC is 150kW
  const hpcPower = finalHPC * 350; // HPC is 350kW
  const totalPowerKW = level1Power + level2Power + dcfcPower + hpcPower;
  const peakDemandKW = Math.round(totalPowerKW * 0.7); // 70% concurrency
  
  // Get electricity rates (use provided or defaults)
  const electricityRate = input.electricityRate ?? 0.13;
  const demandCharge = input.demandCharge ?? 15;
  
  // Calculate monthly costs WITHOUT battery
  const peakHours = 12; // Typical peak window
  const dailyKWh = peakDemandKW * 0.4 * peakHours; // 40% avg utilization
  const monthlyKWh = dailyKWh * 30;
  const monthlyDemandCharges = peakDemandKW * demandCharge;
  const monthlyEnergyCharges = monthlyKWh * electricityRate;
  const monthlyElectricityCost = monthlyDemandCharges + monthlyEnergyCharges;
  
  // ============================================
  // GOAL-BASED RECOMMENDATIONS
  // Goals directly affect BESS sizing and savings!
  // ============================================
  
  // Base BESS sizing (varies by goals)
  let bessMultiplier = 0.5; // Default: cover 50% of peak
  let solarMultiplier = 0.3; // Default: 30% of load
  let additionalSavingsMultiplier = 1.0;
  
  // Adjust based on goals
  if (wantsBatteryStorage) {
    bessMultiplier = 0.5;
    if (wantsGridServices) {
      // Grid services require larger battery for frequency regulation
      bessMultiplier = 0.7; // 70% of peak for grid services participation
      additionalSavingsMultiplier = 1.2; // +20% savings from grid services
    }
  }
  
  if (wantsSolarCanopy) {
    solarMultiplier = 0.4; // Increase solar to 40% when user wants it
    if (wantsBatteryStorage) {
      // Solar + Storage synergy - can store solar for peak shaving
      additionalSavingsMultiplier *= 1.15; // +15% from solar+storage synergy
    }
  }
  
  if (wantsPowerGenerator) {
    // Backup power affects sizing but mainly provides resilience
    bessMultiplier = Math.max(bessMultiplier, 0.4); // At least 40% for backup
  }
  
  const bessKW = wantsBatteryStorage ? Math.round(peakDemandKW * bessMultiplier) : 0;
  const bessKWh = bessKW * 2; // 2-hour duration
  
  // Solar canopy estimate (if wanted)
  const solarKW = wantsSolarCanopy ? Math.round(totalPowerKW * solarMultiplier) : 0;
  
  // Generator size for backup (if wanted)
  const generatorKW = wantsPowerGenerator ? Math.round(peakDemandKW * 0.3) : 0; // 30% of peak for backup
  
  // ============================================
  // SAVINGS CALCULATIONS (Goal-Connected!)
  // ============================================
  
  // Demand charge savings from BESS (peak shaving)
  const demandChargeSavings = wantsBatteryStorage ? monthlyDemandCharges * 0.4 * additionalSavingsMultiplier : 0;
  
  // Solar savings (energy offset)
  const solarSavings = wantsSolarCanopy ? solarKW * 150 * additionalSavingsMultiplier : 0; // ~$150/kW/year
  
  // Grid services revenue (only if enabled)
  const gridServicesSavings = wantsGridServices && wantsBatteryStorage ? bessKW * 120 : 0; // ~$120/kW/year
  
  // Total annual savings
  const annualSavings = (demandChargeSavings * 12) + solarSavings + gridServicesSavings;
  
  return {
    chargers: {
      level1: finalLevel1,
      level2: finalLevel2,
      dcfc: finalDCFC,
      hpc: finalHPC,
      totalPowerKW,
      peakDemandKW,
    },
    costs: {
      monthlyElectricity: monthlyElectricityCost,
      monthlyDemandCharges,
    },
    recommendation: {
      bessKW,
      bessKWh,
      solarKW,
      generatorKW,
    },
    savings: {
      monthly: Math.round(annualSavings / 12),
      annual: Math.round(annualSavings),
      demandChargeReduction: Math.round(demandChargeSavings * 12),
      solarOffset: Math.round(solarSavings),
      gridServices: Math.round(gridServicesSavings),
    },
    stationInsight: station.recommendation,
    gridServicesNote: station.gridServicesNote,
    dwellTime: station.avgDwellTime,
    stepExplanation: station.stepExplanation,
  };
}

// ============================================================================
// V2G (VEHICLE-TO-GRID) CALCULATIONS
// ============================================================================

export interface V2GResult {
  totalV2GCapacityKW: number;
  availableEnergyKWh: number;
  annualRevenueUSD: number;
  batteryDegradationCostUSD: number;
  netAnnualBenefitUSD: number;
  compatibleChargerCount: number;
  avgVehiclesConnected: number;
  peakV2GDischargeKW: number;
  gridServicesPotential: {
    frequencyRegulation: boolean;
    demandResponse: boolean;
    peakShaving: boolean;
    backupPower: boolean;
  };
}

/**
 * Calculate V2G potential for an EV charging hub
 */
export function calculateV2GPotential(
  config: EVChargerConfig,
  options: {
    avgVehiclesConnectedPercent?: number; // What % of V2G-capable ports have cars connected
    avgVehicleBatteryKWh?: number;
    v2gAvailabilityHoursPerDay?: number;
    demandChargeRate?: number;
  } = {}
): V2GResult {
  const {
    avgVehiclesConnectedPercent = 40,
    avgVehicleBatteryKWh = V2G_CONFIG.avgVehicleBatteryKWh,
    v2gAvailabilityHoursPerDay = 8,
    demandChargeRate = 15,
  } = options;

  const normalizedConfig = normalizeEVChargerConfig(config);

  // Count V2G-capable chargers (11kW+ L2 and all DC)
  const v2gCapableL2 = (normalizedConfig.level2_11kw || 0) + 
                       (normalizedConfig.level2_19kw || 0) + 
                       (normalizedConfig.level2_22kw || 0);
  const v2gCapableDC = (normalizedConfig.dcfc_50kw || 0) + 
                       (normalizedConfig.dcfc_150kw || 0) + 
                       (normalizedConfig.hpc_250kw || 0) + 
                       (normalizedConfig.hpc_350kw || 0);
  const compatibleChargerCount = v2gCapableL2 + v2gCapableDC;

  // Calculate average connected vehicles
  const avgVehiclesConnected = Math.round(compatibleChargerCount * (avgVehiclesConnectedPercent / 100));

  // V2G power capacity (limited by charger, not vehicle)
  const l2V2GPower = v2gCapableL2 * 11; // Assume 11kW avg for L2 V2G
  const dcV2GPower = v2gCapableDC * 50; // Assume 50kW avg for DC V2G (derated for V2G)
  const totalV2GCapacityKW = (l2V2GPower + dcV2GPower) * (avgVehiclesConnectedPercent / 100);

  // Available energy from connected vehicles
  const availableEnergyKWh = avgVehiclesConnected * avgVehicleBatteryKWh * V2G_CONFIG.usableForV2G;

  // Annual discharge cycles
  const annualDischargeEvents = V2G_CONFIG.avgDischargeEventsPerDay * 250; // 250 days
  const annualKWhDischarged = availableEnergyKWh * annualDischargeEvents * V2G_CONFIG.roundTripEfficiency;

  // Revenue calculation
  const annualRevenueUSD = annualKWhDischarged * V2G_CONFIG.v2gRevenuePerKWhDischarge;

  // Battery degradation cost
  const batteryDegradationCostUSD = annualKWhDischarged * V2G_CONFIG.batteryDegradationCostPerCycle;

  return {
    totalV2GCapacityKW: Math.round(totalV2GCapacityKW),
    availableEnergyKWh: Math.round(availableEnergyKWh),
    annualRevenueUSD: Math.round(annualRevenueUSD),
    batteryDegradationCostUSD: Math.round(batteryDegradationCostUSD),
    netAnnualBenefitUSD: Math.round(annualRevenueUSD - batteryDegradationCostUSD),
    compatibleChargerCount,
    avgVehiclesConnected,
    peakV2GDischargeKW: Math.round(totalV2GCapacityKW * 0.8), // 80% of capacity for grid services
    gridServicesPotential: {
      frequencyRegulation: totalV2GCapacityKW >= 100, // Need 100kW+ for freq reg
      demandResponse: totalV2GCapacityKW >= 50,
      peakShaving: totalV2GCapacityKW >= 25,
      backupPower: availableEnergyKWh >= 50,
    },
  };
}

// ============================================================================
// MULTI-SITE PORTFOLIO CALCULATION
// ============================================================================

export interface SiteConfig {
  siteId: string;
  siteName: string;
  location: string;
  chargerConfig: EVChargerConfig;
  bessConfig?: { powerMW: number; energyMWh: number };
  prosumerMode: keyof typeof PROSUMER_MODES;
}

export interface PortfolioResult {
  totalSites: number;
  totalChargers: number;
  totalConnectedPowerMW: number;
  totalBESSPowerMW: number;
  totalBESSEnergyMWh: number;
  aggregateGridServicesRevenue: number;
  aggregateV2GRevenue: number;
  totalAnnualRevenue: number;
  portfolioMetrics: {
    avgUtilization: number;
    totalChargingSessions: number;
    energyDeliveredMWh: number;
    co2AvoidedTons: number;
  };
  siteBreakdown: Array<{
    siteId: string;
    siteName: string;
    powerMW: number;
    gridServicesRevenue: number;
    v2gRevenue: number;
  }>;
}

/**
 * Calculate aggregate metrics for a multi-site EV charging portfolio
 * Designed for PE firms and multi-site operators
 */
export function calculatePortfolioMetrics(
  sites: SiteConfig[],
  options: {
    avgUtilizationPercent?: number;
    avgSessionsPerChargerPerDay?: number;
    avgKWhPerSession?: number;
    co2PerKWh?: number; // kg CO2 avoided per kWh (vs gasoline)
  } = {}
): PortfolioResult {
  const {
    avgUtilizationPercent = 35,
    avgSessionsPerChargerPerDay = 3,
    avgKWhPerSession = 30,
    co2PerKWh = 0.4, // kg CO2 avoided per kWh of EV charging
  } = options;

  let totalChargers = 0;
  let totalConnectedPowerKW = 0;
  let totalBESSPowerKW = 0;
  let totalBESSEnergyKWh = 0;
  let aggregateGridServicesRevenue = 0;
  let aggregateV2GRevenue = 0;
  const siteBreakdown: PortfolioResult['siteBreakdown'] = [];

  for (const site of sites) {
    const powerResult = calculateEVHubPower(site.chargerConfig);
    const chargerCount = powerResult.breakdown.chargerCounts.level2Total + 
                         powerResult.breakdown.chargerCounts.dcfcTotal + 
                         powerResult.breakdown.chargerCounts.hpcTotal;
    
    totalChargers += chargerCount;
    totalConnectedPowerKW += powerResult.totalPowerKW;

    let siteGridRevenue = 0;
    let siteV2GRevenue = 0;

    if (site.bessConfig) {
      totalBESSPowerKW += site.bessConfig.powerMW * 1000;
      totalBESSEnergyKWh += site.bessConfig.energyMWh * 1000;

      // Grid services for sites with BESS
      const gridRevenue = calculateGridServicesRevenue(powerResult, site.bessConfig);
      siteGridRevenue = gridRevenue.totalAnnualRevenue - gridRevenue.v2gRevenue;
      aggregateGridServicesRevenue += siteGridRevenue;
    }

    // V2G potential
    if (PROSUMER_MODES[site.prosumerMode].v2gEnabled) {
      const v2gResult = calculateV2GPotential(site.chargerConfig);
      siteV2GRevenue = v2gResult.netAnnualBenefitUSD;
      aggregateV2GRevenue += siteV2GRevenue;
    }

    siteBreakdown.push({
      siteId: site.siteId,
      siteName: site.siteName,
      powerMW: powerResult.totalPowerMW,
      gridServicesRevenue: siteGridRevenue,
      v2gRevenue: siteV2GRevenue,
    });
  }

  // Calculate portfolio metrics
  const totalChargingSessions = totalChargers * avgSessionsPerChargerPerDay * 365;
  const energyDeliveredKWh = totalChargingSessions * avgKWhPerSession;
  const co2AvoidedKg = energyDeliveredKWh * co2PerKWh;

  return {
    totalSites: sites.length,
    totalChargers,
    totalConnectedPowerMW: totalConnectedPowerKW / 1000,
    totalBESSPowerMW: totalBESSPowerKW / 1000,
    totalBESSEnergyMWh: totalBESSEnergyKWh / 1000,
    aggregateGridServicesRevenue: Math.round(aggregateGridServicesRevenue),
    aggregateV2GRevenue: Math.round(aggregateV2GRevenue),
    totalAnnualRevenue: Math.round(aggregateGridServicesRevenue + aggregateV2GRevenue),
    portfolioMetrics: {
      avgUtilization: avgUtilizationPercent,
      totalChargingSessions: Math.round(totalChargingSessions),
      energyDeliveredMWh: Math.round(energyDeliveredKWh / 1000),
      co2AvoidedTons: Math.round(co2AvoidedKg / 1000),
    },
    siteBreakdown,
  };
}

/**
 * Validate our calculations against the West London quote
 */
export function validateWestLondonCalculation(): void {
  const power = calculateEVHubPower(WEST_LONDON_EV_HUB_CONFIG, 70);
  const costs = calculateEVHubCosts(WEST_LONDON_EV_HUB_CONFIG);
  const bess = calculateEVHubBESSSize(power);
  
  console.log('='.repeat(60));
  console.log('WEST LONDON EV HUB VALIDATION');
  console.log('='.repeat(60));
  console.log('Configuration:');
  console.log('  100 × 7 kW L2 = 700 kW');
  console.log('  20 × 150 kW DCFC = 3,000 kW');
  console.log('  16 × 350 kW HPC = 5,600 kW');
  console.log('');
  console.log('Power Calculation:');
  console.log(`  Total Power: ${power.totalPowerKW.toLocaleString()} kW (${power.totalPowerMW.toFixed(1)} MW)`);
  console.log(`  Peak Demand (70%): ${power.peakDemandKW.toLocaleString()} kW (${power.peakDemandMW.toFixed(1)} MW)`);
  console.log('');
  console.log('Quote Reference (3 MW BESS):');
  console.log(`  Our BESS Recommendation: ${bess.recommendedPowerMW.toFixed(1)} MW / ${bess.recommendedEnergyMWh.toFixed(1)} MWh`);
  console.log(`  Quote BESS: 3 MW / 10 MWh (actual spec from quote)`);
  console.log('');
  console.log('Cost Estimation (USD):');
  console.log(`  Hardware: $${costs.hardwareCostUSD.toLocaleString()}`);
  console.log(`  Installation: $${costs.installationCostUSD.toLocaleString()}`);
  console.log(`  Total: $${costs.totalCostUSD.toLocaleString()}`);
  console.log('='.repeat(60));
}

// =============================================================================
// SIMPLE LANDING PAGE CALCULATOR
// Simplified version for EVChargingEnergy.tsx landing page quick estimates
// =============================================================================

/**
 * EV charger specs for simplified landing page calculator
 * SSOT for EVChargingEnergy.tsx landing page
 */
export const EV_CHARGER_SPECS_SIMPLE = {
  level2: { kw: 7.2, name: 'Level 2 (7.2 kW)' },
  dcfc: { kw: 150, name: 'DC Fast Charger (150 kW)' },
  hpc: { kw: 250, name: 'High Power Charger (250 kW)' },
} as const;

export interface EVChargingPowerSimpleInput {
  level2Count: number;
  dcfcCount: number;
  hpcCount: number;
  electricityRate: number;
  demandCharge?: number; // Optional, defaults to $15/kW
}

export interface EVChargingPowerSimpleResult {
  peakKW: number;
  connectedKW: number; // Total nameplate capacity
  monthlyDemandCost: number;
  annualEnergyCost: number;
  bessRecommendedKW: number;
  bessRecommendedKWh: number;
  potentialSavings: number;
  demandChargeImpact: number;
}

/**
 * Simple EV charging power calculator for landing page
 * Matches EVChargingEnergy.tsx embedded logic - now SSOT
 */
export function calculateEVChargingPowerSimple(input: EVChargingPowerSimpleInput): EVChargingPowerSimpleResult {
  const { level2Count, dcfcCount, hpcCount, electricityRate, demandCharge = 15 } = input;
  
  // Calculate connected (nameplate) capacity
  const level2KW = level2Count * EV_CHARGER_SPECS_SIMPLE.level2.kw;
  const dcfcKW = dcfcCount * EV_CHARGER_SPECS_SIMPLE.dcfc.kw;
  const hpcKW = hpcCount * EV_CHARGER_SPECS_SIMPLE.hpc.kw;
  const connectedKW = level2KW + dcfcKW + hpcKW;
  
  // Apply concurrency factor (0.7) - not all chargers active simultaneously
  const concurrencyFactor = 0.7;
  const peakKW = Math.round(connectedKW * concurrencyFactor);
  
  // Demand charge impact
  const monthlyDemandCost = peakKW * demandCharge;
  const demandChargeImpact = monthlyDemandCost * 12;
  
  // Annual energy calculation
  // Assume average utilization: L2=4hrs/day, DCFC=6hrs/day, HPC=8hrs/day
  const level2AnnualKWh = level2Count * EV_CHARGER_SPECS_SIMPLE.level2.kw * 4 * 365;
  const dcfcAnnualKWh = dcfcCount * EV_CHARGER_SPECS_SIMPLE.dcfc.kw * 6 * 365 * 0.5; // 50% avg power
  const hpcAnnualKWh = hpcCount * EV_CHARGER_SPECS_SIMPLE.hpc.kw * 8 * 365 * 0.5; // 50% avg power
  const annualKWh = level2AnnualKWh + dcfcAnnualKWh + hpcAnnualKWh;
  const annualEnergyCost = annualKWh * electricityRate;
  
  // BESS sizing: 70% peak shaving (EV has very spiky loads), 2-hour duration
  const bessRecommendedKW = Math.round(peakKW * 0.7);
  const bessRecommendedKWh = bessRecommendedKW * 2;
  
  // Potential savings: 50% demand charge reduction (very spiky), 10% energy arbitrage
  const potentialSavings = Math.round(
    (monthlyDemandCost * 12 * 0.5) + (annualEnergyCost * 0.1)
  );
  
  return {
    peakKW,
    connectedKW,
    monthlyDemandCost,
    annualEnergyCost: Math.round(annualEnergyCost),
    bessRecommendedKW,
    bessRecommendedKWh,
    potentialSavings,
    demandChargeImpact,
  };
}

