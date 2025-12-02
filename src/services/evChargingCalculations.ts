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
