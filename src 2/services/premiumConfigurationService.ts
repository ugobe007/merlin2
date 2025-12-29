/**
 * MERLIN Premium Configuration Service
 * 
 * Creates premium benchmark configurations for each use case.
 * The Premium tier includes:
 * - Higher quality batteries (longer warranty, better cycle life)
 * - Premium inverters with advanced grid services
 * - Integrated microgrid controllers
 * - AC & DC Patch Panels for easy expansion
 * - Premium solar panels (higher efficiency)
 * - Enhanced transformers with smart monitoring
 * 
 * This serves as the benchmark against which standard quotes are compared.
 */

// Premium equipment tiers
export type EquipmentTier = 'standard' | 'premium' | 'enterprise';

// Premium battery specifications
export interface PremiumBatterySpec {
  tier: EquipmentTier;
  manufacturer: string;
  model: string;
  chemistry: 'LFP' | 'NMC' | 'Solid-State';
  cycleLife: number;
  warrantyYears: number;
  roundTripEfficiency: number;
  pricePerKWh: number;
  features: string[];
}

// Premium inverter specifications
export interface PremiumInverterSpec {
  tier: EquipmentTier;
  manufacturer: string;
  model: string;
  efficiency: number;
  gridServices: string[];
  pricePerKW: number;
  features: string[];
}

// Microgrid controller specifications (NEW)
export interface MicrogridControllerSpec {
  tier: EquipmentTier;
  manufacturer: string;
  model: string;
  maxAssets: number;
  features: string[];
  price: number;
}

// AC/DC Patch Panel specifications (NEW)
export interface PatchPanelSpec {
  type: 'AC' | 'DC';
  tier: EquipmentTier;
  manufacturer: string;
  model: string;
  maxCircuits: number;
  voltageRating: string;
  price: number;
  features: string[];
}

// Premium transformer specifications
export interface PremiumTransformerSpec {
  tier: EquipmentTier;
  manufacturer: string;
  type: 'dry' | 'oil-immersed' | 'smart';
  efficiency: number;
  monitoring: boolean;
  pricePerKVA: number;
  features: string[];
}

// Premium solar specifications
export interface PremiumSolarSpec {
  tier: EquipmentTier;
  manufacturer: string;
  model: string;
  efficiency: number;
  warrantyYears: number;
  pricePerWatt: number;
  features: string[];
}

// Complete premium configuration for a use case
export interface PremiumConfiguration {
  useCase: string;
  useCaseDisplayName: string;
  tier: EquipmentTier;
  battery: PremiumBatterySpec;
  inverter: PremiumInverterSpec;
  microgridController: MicrogridControllerSpec;
  acPatchPanel: PatchPanelSpec;
  dcPatchPanel: PatchPanelSpec;
  transformer: PremiumTransformerSpec;
  solar?: PremiumSolarSpec;
  additionalFeatures: string[];
  benefits: string[];
  roi: {
    standardPaybackYears: number;
    premiumPaybackYears: number;
    lifetimeValueGain: number; // % better lifetime value
    warrantyValueUSD: number;
  };
}

// ================================
// PREMIUM EQUIPMENT CATALOG
// ================================

export const PREMIUM_BATTERIES: Record<EquipmentTier, PremiumBatterySpec> = {
  standard: {
    tier: 'standard',
    manufacturer: 'CATL/BYD',
    model: 'Utility LFP Module',
    chemistry: 'LFP',
    cycleLife: 4000,
    warrantyYears: 10,
    roundTripEfficiency: 0.87,
    pricePerKWh: 195,
    features: ['Basic BMS', 'Standard warranty', 'Modular design']
  },
  premium: {
    tier: 'premium',
    manufacturer: 'Tesla',
    model: 'Megapack 2XL',
    chemistry: 'LFP',
    cycleLife: 7500,
    warrantyYears: 15,
    roundTripEfficiency: 0.92,
    pricePerKWh: 295,
    features: [
      'Advanced BMS with predictive analytics',
      '15-year performance warranty',
      'Integrated fire suppression',
      'Remote diagnostics',
      'Over-the-air updates',
      'Grid services enabled'
    ]
  },
  enterprise: {
    tier: 'enterprise',
    manufacturer: 'Fluence',
    model: 'Gridstack Pro',
    chemistry: 'LFP',
    cycleLife: 10000,
    warrantyYears: 20,
    roundTripEfficiency: 0.94,
    pricePerKWh: 385,
    features: [
      'AI-driven thermal management',
      '20-year full warranty',
      'Triple-redundant safety systems',
      'Real-time cell-level monitoring',
      'Automatic load balancing',
      'Full microgrid capable'
    ]
  }
};

export const PREMIUM_INVERTERS: Record<EquipmentTier, PremiumInverterSpec> = {
  standard: {
    tier: 'standard',
    manufacturer: 'SMA Solar',
    model: 'Sunny Central',
    efficiency: 0.97,
    gridServices: ['Frequency response'],
    pricePerKW: 95,
    features: ['Basic monitoring', 'Grid-following']
  },
  premium: {
    tier: 'premium',
    manufacturer: 'SMA Solar',
    model: 'Sunny Central Storage UP',
    efficiency: 0.985,
    gridServices: ['Frequency response', 'Voltage support', 'Ramp rate control', 'Black start'],
    pricePerKW: 145,
    features: [
      'Grid-forming capable',
      '4-quadrant operation',
      'Virtual inertia',
      'Integrated DC coupling',
      'Advanced anti-islanding'
    ]
  },
  enterprise: {
    tier: 'enterprise',
    manufacturer: 'Dynapower',
    model: 'MPS Enterprise',
    efficiency: 0.99,
    gridServices: ['Full ancillary services', 'Synthetic inertia', 'Fault current injection'],
    pricePerKW: 195,
    features: [
      'Military-grade reliability',
      'Full grid-forming',
      'Seamless islanding',
      'N+1 redundancy',
      'Hot-swappable modules'
    ]
  }
};

export const MICROGRID_CONTROLLERS: Record<EquipmentTier, MicrogridControllerSpec> = {
  standard: {
    tier: 'standard',
    manufacturer: 'Schneider Electric',
    model: 'EcoStruxure Microgrid',
    maxAssets: 10,
    features: ['Basic load management', 'Manual mode switching'],
    price: 15000
  },
  premium: {
    tier: 'premium',
    manufacturer: 'Schneider Electric',
    model: 'EcoStruxure Microgrid Advisor',
    maxAssets: 50,
    features: [
      'AI-based optimization',
      'Weather-aware forecasting',
      'Automatic islanding',
      'Demand response integration',
      'Real-time energy trading'
    ],
    price: 45000
  },
  enterprise: {
    tier: 'enterprise',
    manufacturer: 'Siemens',
    model: 'SICAM GridPass',
    maxAssets: 200,
    features: [
      'Multi-site orchestration',
      'Virtual power plant (VPP) capable',
      'Blockchain settlement',
      'ML-based predictive maintenance',
      'Full SCADA integration'
    ],
    price: 125000
  }
};

export const AC_PATCH_PANELS: Record<EquipmentTier, PatchPanelSpec> = {
  standard: {
    type: 'AC',
    tier: 'standard',
    manufacturer: 'Eaton',
    model: 'PRL1A',
    maxCircuits: 24,
    voltageRating: '480V',
    price: 2500,
    features: ['NEMA 3R', 'Basic breakers']
  },
  premium: {
    type: 'AC',
    tier: 'premium',
    manufacturer: 'Schneider Electric',
    model: 'Galaxy VM',
    maxCircuits: 48,
    voltageRating: '480V',
    price: 8500,
    features: [
      'Modular design',
      'Hot-swappable breakers',
      'Power monitoring per circuit',
      'Network connectivity',
      'Arc flash protection'
    ]
  },
  enterprise: {
    type: 'AC',
    tier: 'enterprise',
    manufacturer: 'ABB',
    model: 'SACE Emax 2',
    maxCircuits: 96,
    voltageRating: '600V',
    price: 22000,
    features: [
      'Full redundancy',
      'Predictive maintenance sensors',
      'Integrated energy metering',
      'Cloud analytics',
      'Cybersecurity hardened'
    ]
  }
};

export const DC_PATCH_PANELS: Record<EquipmentTier, PatchPanelSpec> = {
  standard: {
    type: 'DC',
    tier: 'standard',
    manufacturer: 'Midnite Solar',
    model: 'MNDC-C',
    maxCircuits: 12,
    voltageRating: '600VDC',
    price: 1800,
    features: ['DIN rail mount', 'Basic fusing']
  },
  premium: {
    type: 'DC',
    tier: 'premium',
    manufacturer: 'OutBack Power',
    model: 'FLEXware 500',
    maxCircuits: 24,
    voltageRating: '1000VDC',
    price: 5500,
    features: [
      'Touch-safe design',
      'String-level monitoring',
      'Rapid shutdown compliant',
      'Expansion ready'
    ]
  },
  enterprise: {
    type: 'DC',
    tier: 'enterprise',
    manufacturer: 'SolarEdge',
    model: 'Synergy DC',
    maxCircuits: 48,
    voltageRating: '1500VDC',
    price: 15000,
    features: [
      'Smart string combiners',
      'AI arc detection',
      'Per-string MPPT optimization',
      'Remote disconnect',
      'Fire safety certified'
    ]
  }
};

export const PREMIUM_TRANSFORMERS: Record<EquipmentTier, PremiumTransformerSpec> = {
  standard: {
    tier: 'standard',
    manufacturer: 'ABB',
    type: 'dry',
    efficiency: 0.97,
    monitoring: false,
    pricePerKVA: 65,
    features: ['Basic protection', 'Manual tap changer']
  },
  premium: {
    tier: 'premium',
    manufacturer: 'Siemens',
    type: 'dry',
    efficiency: 0.985,
    monitoring: true,
    pricePerKVA: 95,
    features: [
      'Digital monitoring',
      'Automatic tap changer',
      'Temperature sensors',
      'Partial discharge detection',
      'IoT connectivity'
    ]
  },
  enterprise: {
    tier: 'enterprise',
    manufacturer: 'ABB',
    type: 'smart',
    efficiency: 0.99,
    monitoring: true,
    pricePerKVA: 145,
    features: [
      'Real-time diagnostics',
      'Predictive failure analysis',
      'Oil-free design',
      'Ultra-low losses',
      'Full SCADA integration',
      'Cybersecurity protected'
    ]
  }
};

export const PREMIUM_SOLAR: Record<EquipmentTier, PremiumSolarSpec> = {
  standard: {
    tier: 'standard',
    manufacturer: 'Trina Solar',
    model: 'Vertex S+',
    efficiency: 0.21,
    warrantyYears: 25,
    pricePerWatt: 0.28,
    features: ['Tier 1 manufacturer', 'Standard warranty']
  },
  premium: {
    tier: 'premium',
    manufacturer: 'SunPower',
    model: 'Maxeon 6',
    efficiency: 0.227,
    warrantyYears: 40,
    pricePerWatt: 0.45,
    features: [
      '40-year warranty',
      'Superior shade tolerance',
      'Lower degradation (0.25%/yr)',
      'Integrated microinverters option',
      'Premium aesthetics'
    ]
  },
  enterprise: {
    tier: 'enterprise',
    manufacturer: 'SunPower',
    model: 'Maxeon Air',
    efficiency: 0.24,
    warrantyYears: 40,
    pricePerWatt: 0.65,
    features: [
      'Flexible installation',
      'Lightest in class',
      'Building-integrated (BIPV)',
      'Hurricane rated',
      'Roof warranty preserved'
    ]
  }
};

// ================================
// USE CASE SPECIFIC PREMIUM CONFIGS
// ================================

export interface UseCasePremiumProfile {
  recommendedTier: EquipmentTier;
  priorityFeatures: string[];
  minBatteryCapacityKWh: number;
  recommendedSolarRatio: number; // Solar MW per storage MW
  requiredGridServices: string[];
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export const USE_CASE_PREMIUM_PROFILES: Record<string, UseCasePremiumProfile> = {
  'hotel': {
    recommendedTier: 'premium',
    priorityFeatures: ['Quiet operation', 'Compact footprint', 'Guest comfort priority'],
    minBatteryCapacityKWh: 200,
    recommendedSolarRatio: 0.5,
    requiredGridServices: ['Peak shaving', 'Backup power'],
    criticalityLevel: 'medium'
  },
  'car-wash': {
    recommendedTier: 'premium',
    priorityFeatures: ['High power bursts', 'Fast recharge', 'Water resistance'],
    minBatteryCapacityKWh: 150,
    recommendedSolarRatio: 0.75,
    requiredGridServices: ['Demand charge reduction', 'Load leveling'],
    criticalityLevel: 'low'
  },
  'ev-charging': {
    recommendedTier: 'enterprise',
    priorityFeatures: ['High power capability', 'Rapid cycling', 'Grid services revenue'],
    minBatteryCapacityKWh: 500,
    recommendedSolarRatio: 1.0,
    requiredGridServices: ['Fast response', 'Frequency regulation', 'V2G ready'],
    criticalityLevel: 'high'
  },
  'hospital': {
    recommendedTier: 'enterprise',
    priorityFeatures: ['24/7 reliability', 'Seamless transfer', 'Life safety'],
    minBatteryCapacityKWh: 1000,
    recommendedSolarRatio: 0.3,
    requiredGridServices: ['Black start', 'Islanding', 'Critical load priority'],
    criticalityLevel: 'critical'
  },
  'data-center': {
    recommendedTier: 'enterprise',
    priorityFeatures: ['UPS integration', 'Zero downtime', 'High efficiency'],
    minBatteryCapacityKWh: 2000,
    recommendedSolarRatio: 0.25,
    requiredGridServices: ['Millisecond response', 'Full backup'],
    criticalityLevel: 'critical'
  },
  'manufacturing': {
    recommendedTier: 'premium',
    priorityFeatures: ['Production continuity', 'Motor starting support', 'Power quality'],
    minBatteryCapacityKWh: 500,
    recommendedSolarRatio: 0.4,
    requiredGridServices: ['Peak shaving', 'Power factor correction'],
    criticalityLevel: 'high'
  },
  'retail': {
    recommendedTier: 'standard',
    priorityFeatures: ['Cost optimization', 'Demand reduction', 'Basic backup'],
    minBatteryCapacityKWh: 100,
    recommendedSolarRatio: 0.6,
    requiredGridServices: ['Peak shaving'],
    criticalityLevel: 'low'
  },
  'office': {
    recommendedTier: 'premium',
    priorityFeatures: ['Tenant comfort', 'IT protection', 'Green certification'],
    minBatteryCapacityKWh: 200,
    recommendedSolarRatio: 0.5,
    requiredGridServices: ['Peak shaving', 'UPS support'],
    criticalityLevel: 'medium'
  },
  'residential': {
    recommendedTier: 'standard',
    priorityFeatures: ['Simple operation', 'Compact', 'App control'],
    minBatteryCapacityKWh: 13.5,
    recommendedSolarRatio: 1.2,
    requiredGridServices: ['Self-consumption', 'TOU optimization'],
    criticalityLevel: 'low'
  },
  'microgrid': {
    recommendedTier: 'enterprise',
    priorityFeatures: ['Full autonomy', 'Multi-source integration', 'Island mode'],
    minBatteryCapacityKWh: 1000,
    recommendedSolarRatio: 1.5,
    requiredGridServices: ['Grid forming', 'Black start', 'Full orchestration'],
    criticalityLevel: 'high'
  },
  'indoor-farm': {
    recommendedTier: 'premium',
    priorityFeatures: ['Grow light support', 'Climate control', 'Precision timing'],
    minBatteryCapacityKWh: 300,
    recommendedSolarRatio: 0.2,
    requiredGridServices: ['Peak shaving', 'Power quality'],
    criticalityLevel: 'medium'
  },
  'distribution-center': {
    recommendedTier: 'premium',
    priorityFeatures: ['Cold storage support', 'Forklift charging', 'Logistics continuity'],
    minBatteryCapacityKWh: 750,
    recommendedSolarRatio: 0.5,
    requiredGridServices: ['Peak shaving', 'Backup power'],
    criticalityLevel: 'high'
  }
};

// ================================
// MAIN FUNCTIONS
// ================================

/**
 * Generate a MERLIN Premium configuration for a specific use case
 */
export function generatePremiumConfiguration(
  useCase: string,
  storageSizeMW: number,
  durationHours: number,
  solarMW: number = 0,
  userInputs?: Record<string, any>
): PremiumConfiguration {
  const profile = USE_CASE_PREMIUM_PROFILES[useCase] || USE_CASE_PREMIUM_PROFILES['office'];
  const tier = profile.recommendedTier;
  
  const totalEnergyKWh = storageSizeMW * 1000 * durationHours;
  const scaleFactor = Math.max(1, totalEnergyKWh / 500); // Scale patch panels based on size
  
  // Calculate ROI comparison
  const standardBattery = PREMIUM_BATTERIES.standard;
  const premiumBattery = PREMIUM_BATTERIES[tier];
  
  const standardCostPerKWh = standardBattery.pricePerKWh;
  const premiumCostPerKWh = premiumBattery.pricePerKWh;
  
  // Premium has better efficiency and longer life
  const efficiencyGain = premiumBattery.roundTripEfficiency - standardBattery.roundTripEfficiency;
  const cycleLifeMultiplier = premiumBattery.cycleLife / standardBattery.cycleLife;
  const warrantyYearsGain = premiumBattery.warrantyYears - standardBattery.warrantyYears;
  
  // Calculate lifetime value gain (simplified)
  const lifetimeValueGain = Math.round(
    ((cycleLifeMultiplier - 1) * 50) + // 50% of value from cycle life
    (efficiencyGain * 500) + // Efficiency worth ~$5 per 1% per year
    (warrantyYearsGain * 2) // Each warranty year adds 2%
  );
  
  // Calculate approximate payback
  const electricityRate = 0.15; // Average
  const dailyCycles = 1.2;
  const annualRevenuePerKWh = electricityRate * 0.3 * 365 * dailyCycles;
  const standardPayback = standardCostPerKWh / annualRevenuePerKWh;
  const premiumPayback = premiumCostPerKWh / (annualRevenuePerKWh * (1 + efficiencyGain));
  
  const useCaseDisplayName = useCase
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    useCase,
    useCaseDisplayName,
    tier,
    battery: premiumBattery,
    inverter: PREMIUM_INVERTERS[tier],
    microgridController: MICROGRID_CONTROLLERS[tier],
    acPatchPanel: {
      ...AC_PATCH_PANELS[tier],
      maxCircuits: Math.ceil(AC_PATCH_PANELS[tier].maxCircuits * Math.min(scaleFactor, 2)),
      price: Math.round(AC_PATCH_PANELS[tier].price * Math.min(scaleFactor, 2))
    },
    dcPatchPanel: {
      ...DC_PATCH_PANELS[tier],
      maxCircuits: Math.ceil(DC_PATCH_PANELS[tier].maxCircuits * Math.min(scaleFactor, 2)),
      price: Math.round(DC_PATCH_PANELS[tier].price * Math.min(scaleFactor, 2))
    },
    transformer: PREMIUM_TRANSFORMERS[tier],
    solar: solarMW > 0 ? PREMIUM_SOLAR[tier] : undefined,
    additionalFeatures: profile.priorityFeatures,
    benefits: [
      `${premiumBattery.cycleLife.toLocaleString()} cycle life (${cycleLifeMultiplier.toFixed(1)}x standard)`,
      `${premiumBattery.warrantyYears}-year warranty included`,
      `${(premiumBattery.roundTripEfficiency * 100).toFixed(1)}% round-trip efficiency`,
      `${profile.criticalityLevel.toUpperCase()} criticality coverage`,
      ...profile.requiredGridServices.map(s => `${s} enabled`)
    ],
    roi: {
      standardPaybackYears: Math.round(standardPayback * 10) / 10,
      premiumPaybackYears: Math.round(premiumPayback * 10) / 10,
      lifetimeValueGain,
      warrantyValueUSD: Math.round(warrantyYearsGain * totalEnergyKWh * 0.05) // ~$0.05/kWh per warranty year
    }
  };
}

/**
 * Calculate premium vs standard cost comparison
 */
export function calculatePremiumComparison(
  useCase: string,
  storageSizeMW: number,
  durationHours: number,
  solarMW: number = 0
): {
  standard: { totalCost: number; breakdown: Record<string, number> };
  premium: { totalCost: number; breakdown: Record<string, number> };
  delta: { totalCost: number; percentage: number };
  valueProposition: string[];
} {
  const totalEnergyKWh = storageSizeMW * 1000 * durationHours;
  const powerKW = storageSizeMW * 1000;
  const transformerKVA = powerKW * 1.2;
  const solarWatts = solarMW * 1000000;
  
  const profile = USE_CASE_PREMIUM_PROFILES[useCase] || USE_CASE_PREMIUM_PROFILES['office'];
  const tier = profile.recommendedTier;
  
  // Standard costs
  const standardBreakdown = {
    batteries: totalEnergyKWh * PREMIUM_BATTERIES.standard.pricePerKWh,
    inverters: powerKW * PREMIUM_INVERTERS.standard.pricePerKW,
    transformer: transformerKVA * PREMIUM_TRANSFORMERS.standard.pricePerKVA,
    microgridController: MICROGRID_CONTROLLERS.standard.price,
    acPatchPanel: AC_PATCH_PANELS.standard.price,
    dcPatchPanel: DC_PATCH_PANELS.standard.price,
    solar: solarWatts * PREMIUM_SOLAR.standard.pricePerWatt
  };
  
  // Premium costs
  const premiumBreakdown = {
    batteries: totalEnergyKWh * PREMIUM_BATTERIES[tier].pricePerKWh,
    inverters: powerKW * PREMIUM_INVERTERS[tier].pricePerKW,
    transformer: transformerKVA * PREMIUM_TRANSFORMERS[tier].pricePerKVA,
    microgridController: MICROGRID_CONTROLLERS[tier].price,
    acPatchPanel: AC_PATCH_PANELS[tier].price,
    dcPatchPanel: DC_PATCH_PANELS[tier].price,
    solar: solarWatts * PREMIUM_SOLAR[tier].pricePerWatt
  };
  
  const standardTotal = Object.values(standardBreakdown).reduce((a, b) => a + b, 0);
  const premiumTotal = Object.values(premiumBreakdown).reduce((a, b) => a + b, 0);
  
  const deltaTotal = premiumTotal - standardTotal;
  const deltaPercentage = (deltaTotal / standardTotal) * 100;
  
  const premiumBattery = PREMIUM_BATTERIES[tier];
  const standardBattery = PREMIUM_BATTERIES.standard;
  
  return {
    standard: { totalCost: standardTotal, breakdown: standardBreakdown },
    premium: { totalCost: premiumTotal, breakdown: premiumBreakdown },
    delta: { totalCost: deltaTotal, percentage: deltaPercentage },
    valueProposition: [
      `${premiumBattery.warrantyYears - standardBattery.warrantyYears} additional warranty years`,
      `${((premiumBattery.cycleLife / standardBattery.cycleLife - 1) * 100).toFixed(0)}% more battery cycles`,
      `${((premiumBattery.roundTripEfficiency - standardBattery.roundTripEfficiency) * 100).toFixed(1)}% better efficiency`,
      `Advanced grid services included`,
      `Premium 24/7 support`
    ]
  };
}

/**
 * Get equipment catalog for admin display
 */
export function getEquipmentCatalog() {
  return {
    batteries: PREMIUM_BATTERIES,
    inverters: PREMIUM_INVERTERS,
    microgridControllers: MICROGRID_CONTROLLERS,
    acPatchPanels: AC_PATCH_PANELS,
    dcPatchPanels: DC_PATCH_PANELS,
    transformers: PREMIUM_TRANSFORMERS,
    solar: PREMIUM_SOLAR
  };
}

/**
 * List all available use case profiles
 */
export function getUseCaseProfiles() {
  return USE_CASE_PREMIUM_PROFILES;
}
