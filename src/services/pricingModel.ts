/**
 * MERLIN INTERNAL PRICING MODEL
 * ==============================
 * 
 * ⚠️ THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL PRICING ⚠️
 * 
 * All calculations across the platform MUST reference this model.
 * DO NOT hardcode prices anywhere else in the codebase.
 * 
 * PRICING BENCHMARKS (December 2025):
 * - Validated against 6+ professional quotes
 * - Cross-referenced with NREL ATB 2024
 * - Regional adjustments for US, UK, EU, Asia
 * 
 * PRICING TIERS:
 * - Residential (< 50 kW): Premium pricing, home-scale equipment
 * - Commercial/C&I (50 kW - 1 MW): Mid-range, modular systems
 * - Utility-Scale (> 1 MW): Volume pricing, standardized units
 * 
 * Version: 1.0.0
 * Date: December 4, 2025
 * Last Audit: December 4, 2025
 */

// ============================================
// PRICING TIER DEFINITIONS
// ============================================

export type PricingTier = 'residential' | 'commercial' | 'utility';

export function determinePricingTier(powerKW: number): PricingTier {
  if (powerKW < 50) return 'residential';
  if (powerKW < 1000) return 'commercial';
  return 'utility';
}

// ============================================
// BESS PRICING MODEL
// ============================================

export const BESS_PRICING = {
  // Battery Module Pricing ($/kWh)
  // Source: NREL ATB 2024 + Professional Quotes (UK EV Hub, Tribal Microgrid, Hampton Heights)
  batteryPerKWh: {
    residential: 350,   // Home battery systems (Powerwall, Enphase)
    commercial: 175,    // C&I modular systems (CATL, BYD containers)
    utility: 140,       // Utility-scale (validated: UK $120, US $140-190)
  },
  
  // PCS/Inverter Pricing ($/kW)
  // Source: UK EV Hub quote ($120/kW), NREL ATB 2024
  pcsPerKW: {
    residential: 200,   // Integrated hybrid inverters
    commercial: 120,    // Grid-tie/grid-forming PCS (validated)
    utility: 100,       // Large-scale central inverters
  },
  
  // Transformer Pricing ($/kVA)
  // Source: Industry standards, professional quotes
  transformerPerKVA: {
    residential: 0,      // Not typically needed (LV only)
    commercial: 68,      // 480V/208V commercial step-down
    utility: 80,         // MV/LV step-down (35kV/13.8kV/480V)
  },
  
  // Switchgear Pricing ($/kW of system capacity)
  switchgearPerKW: {
    residential: 15,     // LV distribution panel
    commercial: 30,      // LV/basic MV switchgear
    utility: 50,         // Full MV switchgear suite
  },
  
  // Balance of System (% of equipment cost)
  bosPercentage: {
    residential: 0.15,   // 15% for simpler installations
    commercial: 0.12,    // 12% standard BOS
    utility: 0.10,       // 10% volume efficiency
  },
  
  // EMS/SCADA (fixed cost + per-kW)
  emsBaseCost: {
    residential: 2000,
    commercial: 15000,
    utility: 50000,
  },
  emsPerKW: {
    residential: 20,
    commercial: 10,
    utility: 5,
  },
  
  // Chemistry-based adjustments (multiplier on base battery price)
  chemistryMultiplier: {
    LFP: 1.0,           // Lithium Iron Phosphate (baseline)
    NMC: 1.15,          // Nickel Manganese Cobalt (+15%)
    NCA: 1.20,          // Nickel Cobalt Aluminum (+20%)
    'Flow-Vanadium': 1.40,  // Vanadium flow (+40%, longer duration)
    'Sodium-Ion': 0.85,     // Sodium-ion (-15%, emerging tech)
  },
  
  // Duration adjustment (longer duration = better $/kWh)
  durationDiscount: {
    1: 1.0,    // 1-hour: no discount
    2: 0.95,   // 2-hour: 5% discount
    4: 0.90,   // 4-hour: 10% discount (most common)
    6: 0.87,   // 6-hour: 13% discount
    8: 0.85,   // 8-hour: 15% discount
  },
} as const;

// ============================================
// SOLAR PV PRICING MODEL
// ============================================

export const SOLAR_PRICING = {
  // Turnkey pricing ($/W) - includes modules, inverters, racking, BOS
  // Source: Tribal Microgrid ($1.05/W), Hampton Heights ($0.60/W), NREL
  turnkeyPerWatt: {
    residential: 2.80,   // Rooftop residential
    commercial: 1.05,    // C&I rooftop/ground-mount (validated)
    utility: 0.65,       // Utility-scale ground-mount (validated)
  },
  
  // Component breakdown (for detailed quotes)
  components: {
    // Modules ($/W)
    modulesPerWatt: {
      residential: 0.35,
      commercial: 0.28,
      utility: 0.22,
    },
    // Inverters ($/W)
    invertersPerWatt: {
      residential: 0.20,  // Microinverters
      commercial: 0.10,   // String inverters
      utility: 0.06,      // Central inverters
    },
    // Racking ($/W)
    rackingPerWatt: {
      residential: 0.15,  // Roof-mount
      commercial: 0.12,   // Roof or ground
      utility: 0.08,      // Ground-mount tracking
    },
    // BOS & wiring ($/W)
    bosPerWatt: {
      residential: 0.40,
      commercial: 0.25,
      utility: 0.15,
    },
    // Installation labor ($/W)
    laborPerWatt: {
      residential: 0.70,
      commercial: 0.30,
      utility: 0.14,
    },
  },
  
  // Space requirements (sq ft per kW)
  spacePerKW: {
    rooftop: 100,         // ~100 sq ft/kW rooftop
    groundMount: 200,     // ~200 sq ft/kW (includes spacing)
    carport: 150,         // Carport canopies
  },
  
  // Capacity factor by region (%)
  capacityFactorByRegion: {
    'Southwest US': 0.25,
    'Southeast US': 0.20,
    'Northeast US': 0.16,
    'Midwest US': 0.18,
    'Northwest US': 0.15,
    'UK': 0.11,
    'Northern Europe': 0.10,
    'Southern Europe': 0.18,
    'Middle East': 0.25,
    'Australia': 0.22,
  },
} as const;

// ============================================
// WIND POWER PRICING MODEL
// ============================================

export const WIND_PRICING = {
  // Turnkey pricing ($/kW)
  // Source: NREL, industry benchmarks
  turnkeyPerKW: {
    distributed: 3500,    // Small turbines (< 100 kW)
    commercial: 2500,     // Medium turbines (100 kW - 1 MW)
    utility: 1350,        // Large turbines (> 1 MW)
  },
  
  // Typical turbine sizes
  turbineSizes: {
    distributed: [10, 20, 50, 100],      // kW options
    commercial: [250, 500, 750, 1000],   // kW options
    utility: [2000, 2500, 3000, 5000],   // kW options (MW × 1000)
  },
  
  // Capacity factors
  capacityFactor: {
    distributed: 0.20,
    commercial: 0.30,
    utility: 0.40,
  },
} as const;

// ============================================
// GENERATOR PRICING MODEL
// ============================================

export const GENERATOR_PRICING = {
  // Equipment pricing ($/kW)
  // Source: Hampton Heights quote, Caterpillar/Cummins benchmarks
  equipmentPerKW: {
    diesel: {
      small: 600,        // < 100 kW
      medium: 450,       // 100-500 kW
      large: 350,        // 500 kW - 2 MW
      utility: 300,      // > 2 MW
    },
    naturalGas: {
      small: 700,
      medium: 550,
      large: 450,
      utility: 400,
    },
    propane: {
      small: 650,
      medium: 500,
      large: 400,
      utility: 350,
    },
  },
  
  // Installation multiplier (on equipment)
  installationMultiplier: 0.25,  // 25% of equipment for install
  
  // Fuel costs ($/gallon or $/therm)
  fuelCosts: {
    diesel: 3.50,         // $/gallon
    naturalGas: 1.50,     // $/therm
    propane: 2.80,        // $/gallon
  },
  
  // Fuel consumption (gallons/kWh or therms/kWh)
  fuelConsumption: {
    diesel: 0.07,         // ~14 kWh/gallon
    naturalGas: 0.10,     // ~10 kWh/therm
    propane: 0.08,        // ~12 kWh/gallon
  },
} as const;

// ============================================
// EV CHARGER PRICING MODEL
// ============================================

export const EV_CHARGER_PRICING = {
  // Hardware costs (per unit)
  // Source: UK EV Hub quote (Oct 2025) - validated
  hardware: {
    level1: 500,           // 120V, 1.4 kW
    level2_7kW: 2500,      // 240V, 7 kW
    level2_11kW: 5000,     // 240V, 11 kW (validated: UK quote)
    level2_19kW: 8000,     // 240V, 19 kW
    level2_22kW: 10000,    // 240V, 22 kW
    dcfc_50kW: 35000,      // DC Fast, 50 kW
    dcfc_150kW: 55000,     // DC Fast, 150 kW (validated: UK quote)
    hpc_250kW: 100000,     // High Power, 250 kW
    hpc_350kW: 130000,     // High Power, 350 kW (validated: UK quote)
  },
  
  // Installation costs (per unit)
  // Source: UK EV Hub quote - includes electrical, civil, commissioning
  installation: {
    level1: 300,
    level2_7kW: 2000,
    level2_11kW: 3000,     // Validated: UK quote
    level2_19kW: 4000,
    level2_22kW: 5000,
    dcfc_50kW: 20000,
    dcfc_150kW: 30000,     // Validated: UK quote
    hpc_250kW: 40000,
    hpc_350kW: 50000,      // Validated: UK quote
  },
  
  // Networking/software (per port, annual)
  networkingPerPort: 500,  // OCPP compliance, software
  
  // Make-ready costs (site electrical infrastructure)
  makeReadyPerKW: 50,      // $/kW of total charging capacity
  
  // Utility upgrade triggers
  utilityUpgradeThreshold: 200,  // kW - above this may need utility work
  utilityUpgradeCost: 50000,     // Base cost for utility coordination
} as const;

// ============================================
// INSTALLATION & SOFT COSTS
// ============================================

export const INSTALLATION_COSTS = {
  // Standard percentages (of equipment cost)
  // Source: Professional quotes - consistent across all quotes analyzed
  logistics: 0.08,         // 8% - shipping, handling, delivery
  importDuty: 0.02,        // 2% - for China-sourced equipment
  epcIntegration: 0.25,    // 25% - engineering, procurement, construction
  contingency: 0.05,       // 5% - permitting, unexpected costs
  
  // Regional adjustments (multiplier on installation costs)
  regionalMultiplier: {
    'California': 1.25,    // High labor costs
    'Texas': 0.90,         // Lower costs
    'Northeast US': 1.15,
    'Midwest US': 0.95,
    'Southeast US': 0.92,
    'UK': 1.10,
    'Germany': 1.20,
    'Australia': 1.15,
    'Asia': 0.80,
  },
} as const;

// ============================================
// FINANCIAL ASSUMPTIONS
// ============================================

export const FINANCIAL_ASSUMPTIONS = {
  // Tax credits
  federalITC: {
    base: 0.30,            // 30% base ITC
    domesticContent: 0.10, // +10% for domestic content
    energyCommunity: 0.10, // +10% for energy communities
    lowIncome: 0.10,       // +10% for low-income areas
    maxTotal: 0.50,        // Maximum 50% total
  },
  
  // Depreciation (MACRS)
  macrsSchedule: [0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576], // 5-year MACRS
  
  // Project economics
  discountRate: 0.08,      // 8% discount rate
  inflationRate: 0.025,    // 2.5% annual inflation
  
  // System performance
  bessRoundTripEfficiency: 0.85,   // 85% round-trip
  bessDegradationRate: 0.02,       // 2% per year
  solarDegradationRate: 0.005,     // 0.5% per year
  
  // Project lifetimes (years)
  bessLifetime: 15,
  solarLifetime: 25,
  windLifetime: 25,
  generatorLifetime: 20,
  
  // O&M costs (% of CapEx annually)
  annualOMPercent: {
    bess: 0.025,           // 2.5% including augmentation
    solar: 0.015,          // 1.5%
    wind: 0.02,            // 2%
    generator: 0.03,       // 3%
    evCharger: 0.05,       // 5%
  },
} as const;

// ============================================
// UTILITY RATE ASSUMPTIONS
// ============================================

export const UTILITY_RATES = {
  // Default electricity rates by region ($/kWh)
  electricityRate: {
    'California': 0.22,
    'Texas': 0.11,
    'Northeast US': 0.18,
    'Midwest US': 0.12,
    'Southeast US': 0.11,
    'UK': 0.35,            // £0.28 converted
    'Germany': 0.40,
    'Australia': 0.25,
  },
  
  // Demand charges by region ($/kW-month)
  demandCharge: {
    'California': 25,
    'Texas': 15,
    'Northeast US': 20,
    'Midwest US': 12,
    'Southeast US': 14,
    'UK': 18,
    'Germany': 22,
    'Australia': 16,
  },
  
  // Time-of-use spreads (peak vs off-peak $/kWh difference)
  touSpread: {
    'California': 0.15,
    'Texas': 0.08,
    'Northeast US': 0.10,
    'UK': 0.12,
  },
} as const;

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Calculate complete BESS cost for a given configuration
 */
export function calculateBESSCost(config: {
  powerKW: number;
  capacityKWh: number;
  chemistry?: keyof typeof BESS_PRICING.chemistryMultiplier;
  durationHours?: number;
}): {
  batteryCost: number;
  pcsCost: number;
  transformerCost: number;
  switchgearCost: number;
  bosCost: number;
  emsCost: number;
  totalEquipment: number;
  pricingTier: PricingTier;
} {
  const tier = determinePricingTier(config.powerKW);
  const chemMult = config.chemistry 
    ? BESS_PRICING.chemistryMultiplier[config.chemistry] 
    : 1.0;
  const durationMult = config.durationHours && config.durationHours in BESS_PRICING.durationDiscount
    ? BESS_PRICING.durationDiscount[config.durationHours as keyof typeof BESS_PRICING.durationDiscount]
    : 1.0;
  
  const batteryCost = config.capacityKWh * BESS_PRICING.batteryPerKWh[tier] * chemMult * durationMult;
  const pcsCost = config.powerKW * BESS_PRICING.pcsPerKW[tier];
  const transformerCost = tier !== 'residential' 
    ? (config.powerKW * 1.25 / 1000) * 1000 * BESS_PRICING.transformerPerKVA[tier] // 1.25x for power factor margin
    : 0;
  const switchgearCost = config.powerKW * BESS_PRICING.switchgearPerKW[tier];
  
  const equipmentSubtotal = batteryCost + pcsCost + transformerCost + switchgearCost;
  const bosCost = equipmentSubtotal * BESS_PRICING.bosPercentage[tier];
  const emsCost = BESS_PRICING.emsBaseCost[tier] + (config.powerKW * BESS_PRICING.emsPerKW[tier]);
  
  const totalEquipment = equipmentSubtotal + bosCost + emsCost;
  
  return {
    batteryCost,
    pcsCost,
    transformerCost,
    switchgearCost,
    bosCost,
    emsCost,
    totalEquipment,
    pricingTier: tier,
  };
}

/**
 * Calculate complete solar cost for a given configuration
 */
export function calculateSolarCost(config: {
  systemSizeKW: number;
  mountType?: 'rooftop' | 'groundMount' | 'carport';
}): {
  totalCost: number;
  costPerWatt: number;
  pricingTier: PricingTier;
  spaceRequired: number;
} {
  const tier = determinePricingTier(config.systemSizeKW);
  const costPerWatt = SOLAR_PRICING.turnkeyPerWatt[tier];
  const totalCost = config.systemSizeKW * 1000 * costPerWatt;
  const spaceRequired = config.systemSizeKW * SOLAR_PRICING.spacePerKW[config.mountType || 'rooftop'];
  
  return {
    totalCost,
    costPerWatt,
    pricingTier: tier,
    spaceRequired,
  };
}

/**
 * Calculate installation costs given equipment cost
 */
export function calculateInstallationCosts(
  equipmentCost: number,
  region: string = 'California'
): {
  logistics: number;
  importDuty: number;
  epcIntegration: number;
  contingency: number;
  total: number;
} {
  const regionalMult = INSTALLATION_COSTS.regionalMultiplier[region as keyof typeof INSTALLATION_COSTS.regionalMultiplier] || 1.0;
  
  const logistics = equipmentCost * INSTALLATION_COSTS.logistics;
  const importDuty = equipmentCost * INSTALLATION_COSTS.importDuty;
  const epcIntegration = equipmentCost * INSTALLATION_COSTS.epcIntegration * regionalMult;
  const contingency = equipmentCost * INSTALLATION_COSTS.contingency;
  
  return {
    logistics,
    importDuty,
    epcIntegration,
    contingency,
    total: logistics + importDuty + epcIntegration + contingency,
  };
}

/**
 * Calculate federal tax credit
 */
export function calculateTaxCredit(
  grossCost: number,
  options: {
    domesticContent?: boolean;
    energyCommunity?: boolean;
    lowIncome?: boolean;
  } = {}
): {
  rate: number;
  amount: number;
  breakdown: { base: number; adders: { name: string; rate: number }[] };
} {
  const baseRate = FINANCIAL_ASSUMPTIONS.federalITC.base as number;
  let rate = baseRate;
  const adders: { name: string; rate: number }[] = [];
  
  if (options.domesticContent) {
    const adder = FINANCIAL_ASSUMPTIONS.federalITC.domesticContent as number;
    rate += adder;
    adders.push({ name: 'Domestic Content', rate: adder });
  }
  if (options.energyCommunity) {
    const adder = FINANCIAL_ASSUMPTIONS.federalITC.energyCommunity as number;
    rate += adder;
    adders.push({ name: 'Energy Community', rate: adder });
  }
  if (options.lowIncome) {
    const adder = FINANCIAL_ASSUMPTIONS.federalITC.lowIncome as number;
    rate += adder;
    adders.push({ name: 'Low Income', rate: adder });
  }
  
  const maxRate = FINANCIAL_ASSUMPTIONS.federalITC.maxTotal as number;
  rate = Math.min(rate, maxRate);
  
  return {
    rate,
    amount: grossCost * rate,
    breakdown: {
      base: baseRate,
      adders,
    },
  };
}

// ============================================
// EXPORT ALL FOR TYPE CHECKING
// ============================================

export const MERLIN_PRICING_MODEL = {
  BESS_PRICING,
  SOLAR_PRICING,
  WIND_PRICING,
  GENERATOR_PRICING,
  EV_CHARGER_PRICING,
  INSTALLATION_COSTS,
  FINANCIAL_ASSUMPTIONS,
  UTILITY_RATES,
  determinePricingTier,
  calculateBESSCost,
  calculateSolarCost,
  calculateInstallationCosts,
  calculateTaxCredit,
} as const;

export default MERLIN_PRICING_MODEL;
