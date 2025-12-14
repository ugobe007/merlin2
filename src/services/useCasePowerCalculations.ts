/**
 * USE CASE POWER CALCULATIONS - SINGLE SOURCE OF TRUTH
 * 
 * ⚠️ CRITICAL: ALL power calculations must go through this file!
 * 
 * This file contains industry-standard power calculations for each use case.
 * Values are based on:
 * - Energy Star Portfolio Manager benchmarks
 * - CBECS (Commercial Buildings Energy Consumption Survey) 2018
 * - ASHRAE standards
 * - Industry-specific research papers
 * 
 * EV CHARGING NOTE: For full EV Charging Hub calculations (with multiple charger
 * types, HPC support, and cost estimation), use evChargingCalculations.ts which
 * is the SINGLE SOURCE OF TRUTH for EV-specific calculations.
 * 
 * DO NOT modify these calculations without consulting industry data!
 */

export interface PowerCalculationResult {
  powerMW: number;
  durationHrs: number;
  description: string;
  calculationMethod: string;
  inputs: Record<string, any>;
}

/**
 * INDUSTRY POWER DENSITY STANDARDS (W/sq ft) - PEAK DEMAND
 * Source: Energy Star Portfolio Manager, CBECS 2018, ASHRAE 90.1
 * 
 * NOTE: These are PEAK DEMAND values, not average consumption!
 * Average consumption is typically 20-40% of peak demand.
 * BESS sizing requires peak demand to ensure adequate backup.
 */
export const POWER_DENSITY_STANDARDS = {
  // Office & Commercial (Peak demand, not average)
  office: 6.0,              // 5-7 W/sq ft peak (lighting, HVAC, computers at full load)
  retail: 8.0,              // 6-10 W/sq ft peak (lighting intensive)
  shoppingCenter: 10.0,     // 8-12 W/sq ft peak (anchor stores, common areas, HVAC)
  
  // Industrial
  warehouse: 2.0,           // 1-3 W/sq ft peak (forklifts, lighting, HVAC)
  manufacturing: 15.0,      // 10-25 W/sq ft peak (varies by industry)
  coldStorage: 8.0,         // 6-12 W/sq ft peak (refrigeration compressors cycling)
  foodProcessing: 12.0,     // 8-15 W/sq ft peak (processing equipment)
  
  // High-Density
  datacenter: 150,          // 100-200 W/sq ft (IT + cooling)
  indoorFarm: 50,           // 40-60 W/sq ft peak (grow lights + HVAC)
  casino: 18,               // 15-22 W/sq ft peak (24/7, gaming equipment)
  
  // Hospitality (per room/bed, not sq ft)
  hotelPerRoom: 3.5,        // 3-4 kW peak per room (HVAC spikes)
  hospitalPerBed: 5.0,     // 4-6 kW peak per bed (ASHRAE with concurrency factor)
  
  // Special
  agriculturePerAcre: 0.6,  // 0.3-1.0 kW/acre (irrigation pumps at peak)
  // Airport uses tiered calculation - see calculateAirportPower()
  // Small Regional (<1M): 2-6 MW, Medium (1-5M): 6-18 MW, Large (5-15M): 18-55 MW
  // Major Hub (15-50M): 55-175 MW, Mega Hub (50-100M+): 175-500+ MW
  airportPerMillion: 3.5,   // Average ~3.5 MW/M (but actual calc is tiered)
};

/**
 * DATACENTER TIER STANDARDS - SSOT for BESS sizing by tier
 * Source: Uptime Institute Tier Classification System
 * 
 * Tier I:   99.671% uptime (28.8 hrs downtime/year) - Basic capacity
 * Tier II:  99.741% uptime (22.0 hrs downtime/year) - Redundant components  
 * Tier III: 99.982% uptime (1.6 hrs downtime/year) - Concurrently maintainable
 * Tier IV:  99.995% uptime (0.4 hrs downtime/year) - Fault tolerant
 */
export const DATACENTER_TIER_STANDARDS = {
  tier1: {
    name: 'Tier I (Basic Capacity)',
    bessMultiplier: 0.30,      // 30% of IT load
    durationHours: 2,
    description: 'Basic capacity, single path, no redundancy'
  },
  tier2: {
    name: 'Tier II (Redundant Components)',
    bessMultiplier: 0.40,      // 40% of IT load
    durationHours: 3,
    description: 'Redundant capacity components, single path'
  },
  tier3: {
    name: 'Tier III (Concurrently Maintainable)',
    bessMultiplier: 0.50,      // 50% of IT load
    durationHours: 4,
    description: 'Multiple paths, one active, concurrently maintainable'
  },
  tier4: {
    name: 'Tier IV (Fault Tolerant)',
    bessMultiplier: 0.70,      // 70% of IT load
    durationHours: 6,
    description: 'Multiple active paths, fault tolerant'
  }
};

// ============================================================================
// DATA CENTER CLASSIFICATIONS - From Equipment Specification Sheet (Dec 2025)
// Source: Uptime Institute, ASHRAE TC 9.9, DOE Data Center Standards
// ============================================================================

/**
 * Data Center Classifications by Size
 * Based on Uptime Institute tiers and industry standards
 */
export const DATA_CENTER_CLASSIFICATIONS = {
  edge: {
    name: 'Edge/Micro Data Center',
    description: 'Small-scale, distributed edge computing facilities',
    itLoad: { min: 50, max: 500 },           // kW
    totalFacilityLoad: { min: 75, max: 750 }, // kW (with PUE)
    rackCount: { min: 5, max: 50 },
    floorSpace: { min: 500, max: 5000 },      // sq ft
    typicalTier: 'tier1-tier2',
    pue: { typical: 2.0, bestInClass: 1.5 },
    loadFactor: { min: 0.40, max: 0.60 },
  },
  small: {
    name: 'Small Data Center',
    description: 'Enterprise colocation, small cloud provider',
    itLoad: { min: 500, max: 2000 },          // kW
    totalFacilityLoad: { min: 750, max: 3000 }, // kW
    rackCount: { min: 50, max: 200 },
    floorSpace: { min: 5000, max: 20000 },    // sq ft
    typicalTier: 'tier2-tier3',
    pue: { typical: 1.65, bestInClass: 1.3 },
    loadFactor: { min: 0.50, max: 0.70 },
  },
  medium: {
    name: 'Medium Data Center',
    description: 'Regional colocation, enterprise campus',
    itLoad: { min: 2000, max: 10000 },        // kW (2-10 MW)
    totalFacilityLoad: { min: 3000, max: 15000 }, // kW
    rackCount: { min: 200, max: 1000 },
    floorSpace: { min: 20000, max: 100000 },  // sq ft
    typicalTier: 'tier3',
    pue: { typical: 1.45, bestInClass: 1.2 },
    loadFactor: { min: 0.60, max: 0.80 },
  },
  large: {
    name: 'Large Data Center',
    description: 'Major cloud provider, financial services',
    itLoad: { min: 10000, max: 50000 },       // kW (10-50 MW)
    totalFacilityLoad: { min: 15000, max: 75000 }, // kW
    rackCount: { min: 1000, max: 5000 },
    floorSpace: { min: 100000, max: 500000 }, // sq ft
    typicalTier: 'tier3-tier4',
    pue: { typical: 1.30, bestInClass: 1.1 },
    loadFactor: { min: 0.70, max: 0.85 },
  },
  hyperscale: {
    name: 'Hyperscale Data Center',
    description: 'Major cloud/internet companies (AWS, Google, Meta)',
    itLoad: { min: 50000, max: 200000 },      // kW (50-200+ MW)
    totalFacilityLoad: { min: 75000, max: 300000 }, // kW
    rackCount: { min: 5000, max: 50000 },
    floorSpace: { min: 500000, max: 2000000 }, // sq ft
    typicalTier: 'tier3-tier4',
    pue: { typical: 1.15, bestInClass: 1.05 },
    loadFactor: { min: 0.75, max: 0.90 },
  },
} as const;

export type DataCenterClassification = keyof typeof DATA_CENTER_CLASSIFICATIONS;

/**
 * IT Equipment Power by Rack Density
 * Source: ASHRAE TC 9.9 Thermal Guidelines for Data Processing
 */
export const DATA_CENTER_RACK_DENSITY = {
  lowDensity: {
    name: 'Low Density',
    powerPerRack: { min: 3, max: 7 },         // kW
    typicalServers: '10-20 1U servers',
    heatOutputBTU: { min: 10000, max: 24000 },
    airflowCFM: { min: 300, max: 600 },
  },
  mediumDensity: {
    name: 'Medium Density',
    powerPerRack: { min: 7, max: 15 },        // kW
    typicalServers: '20-30 servers',
    heatOutputBTU: { min: 24000, max: 51000 },
    airflowCFM: { min: 600, max: 1200 },
  },
  highDensity: {
    name: 'High Density',
    powerPerRack: { min: 15, max: 30 },       // kW
    typicalServers: '30-42 servers',
    heatOutputBTU: { min: 51000, max: 102000 },
    airflowCFM: { min: 1200, max: 2500 },
  },
  ultraHighDensity: {
    name: 'Ultra-High Density (AI/GPU)',
    powerPerRack: { min: 30, max: 100 },      // kW
    typicalServers: '4-16 GPU servers',
    heatOutputBTU: { min: 102000, max: 341000 },
    airflowCFM: { min: 2500, max: 8000 },
  },
} as const;

/**
 * Data Center Power Distribution Equipment
 */
export const DATA_CENTER_POWER_EQUIPMENT = {
  // Utility Service
  utilityService: {
    edge: { voltage: '480V-13.8kV', transformer: { min: 500, max: 1000 }, feeds: 1, substation: false },
    small: { voltage: '4.16-13.8kV', transformer: { min: 2000, max: 5000 }, feeds: '1-2', substation: 'rare' },
    medium: { voltage: '12.47-34.5kV', transformer: { min: 10000, max: 25000 }, feeds: '2-4', substation: 'often' },
    large: { voltage: '34.5-138kV', transformer: { min: 30000, max: 100000 }, feeds: '2-4', substation: true },
    hyperscale: { voltage: '69-345kV', transformer: { min: 100000, max: 500000 }, feeds: '4+', substation: 'multiple' },
  },
  // UPS Systems
  ups: {
    edge: { moduleSize: { min: 10, max: 100 }, units: '1-4', redundancy: 'N or N+1', efficiency: { min: 94, max: 96 }, runtime: '5-15 min' },
    small: { moduleSize: { min: 100, max: 500 }, units: '4-10', redundancy: 'N+1', efficiency: { min: 95, max: 97 }, runtime: '10-20 min' },
    medium: { moduleSize: { min: 500, max: 1500 }, units: '10-30', redundancy: 'N+1 or 2N', efficiency: { min: 96, max: 98 }, runtime: '10-15 min' },
    large: { moduleSize: { min: 1000, max: 3000 }, units: '30-100', redundancy: '2N', efficiency: { min: 96, max: 98 }, runtime: '10-15 min' },
    hyperscale: { moduleSize: { min: 1500, max: 4000 }, units: '100-500+', redundancy: '2N or distributed', efficiency: { min: 97, max: 99 }, runtime: '5-15 min' },
  },
  // Backup Generators
  generators: {
    edge: { size: { min: 100, max: 500 }, units: '1-2', redundancy: 'N', fuel: 'diesel', startTime: '10-15 sec' },
    small: { size: { min: 1000, max: 2500 }, units: '2-4', redundancy: 'N+1', fuel: 'diesel', startTime: '10-15 sec' },
    medium: { size: { min: 2000, max: 3500 }, units: '4-12', redundancy: 'N+1 or 2N', fuel: 'diesel', startTime: '10-12 sec' },
    large: { size: { min: 2500, max: 3500 }, units: '12-50', redundancy: '2N', fuel: 'diesel/gas', startTime: '8-12 sec' },
    hyperscale: { size: { min: 2500, max: 3500 }, units: '50-200+', redundancy: '2N', fuel: 'diesel/gas/HVO', startTime: '8-10 sec' },
  },
} as const;

/**
 * Data Center Cooling Systems Power
 * Source: ASHRAE TC 9.9, DOE Better Buildings Alliance
 */
export const DATA_CENTER_COOLING_EQUIPMENT = {
  // CRAC (Computer Room Air Conditioning) - DX cooling
  crac: {
    edge: { unitCapacity: { min: 10, max: 30 }, units: '2-10', compressorKW: { min: 3, max: 10 }, fanKW: { min: 1, max: 3 } },
    small: { unitCapacity: { min: 30, max: 100 }, units: '10-40', compressorKW: { min: 10, max: 35 }, fanKW: { min: 3, max: 8 } },
    medium: { unitCapacity: { min: 50, max: 150 }, units: '40-150', compressorKW: { min: 15, max: 50 }, fanKW: { min: 5, max: 12 } },
    large: null, // Use CRAH for large/hyperscale
    hyperscale: null,
  },
  // CRAH (Computer Room Air Handlers) - Chilled water
  crah: {
    edge: null, // Too small for CRAH
    small: { unitCapacity: { min: 50, max: 150 }, units: '5-20', fanKW: { min: 5, max: 15 } },
    medium: { unitCapacity: { min: 100, max: 300 }, units: '20-75', fanKW: { min: 10, max: 25 } },
    large: { unitCapacity: { min: 200, max: 500 }, units: '75-250', fanKW: { min: 15, max: 40 } },
    hyperscale: { unitCapacity: { min: 300, max: 750 }, units: '250-1000+', fanKW: { min: 20, max: 60 } },
  },
  // Chiller Plant
  chillers: {
    edge: null,
    small: { capacityTons: { min: 200, max: 750 }, powerKW: { min: 150, max: 600 }, units: '2-4', kwPerTon: { min: 0.6, max: 0.9 } },
    medium: { capacityTons: { min: 500, max: 2000 }, powerKW: { min: 400, max: 1600 }, units: '4-10', kwPerTon: { min: 0.5, max: 0.8 } },
    large: { capacityTons: { min: 1500, max: 4000 }, powerKW: { min: 1200, max: 3200 }, units: '10-30', kwPerTon: { min: 0.5, max: 0.7 } },
    hyperscale: { capacityTons: { min: 2000, max: 5000 }, powerKW: { min: 1600, max: 4000 }, units: '30-100+', kwPerTon: { min: 0.4, max: 0.6 } },
  },
  // Cooling Towers
  coolingTowers: {
    edge: null,
    small: { capacityTons: { min: 300, max: 1000 }, fanKW: { min: 15, max: 40 }, cells: '2-6' },
    medium: { capacityTons: { min: 750, max: 3000 }, fanKW: { min: 25, max: 75 }, cells: '6-20' },
    large: { capacityTons: { min: 2000, max: 6000 }, fanKW: { min: 40, max: 100 }, cells: '20-60' },
    hyperscale: { capacityTons: { min: 3000, max: 8000 }, fanKW: { min: 50, max: 150 }, cells: '60-200+' },
  },
  // Pumping Systems
  pumps: {
    edge: { chilledWaterKW: null, condenserKW: null, glycolKW: null, totalPumps: '2-4' },
    small: { chilledWaterKW: { min: 15, max: 50 }, condenserKW: { min: 15, max: 50 }, glycolKW: { min: 5, max: 15 }, totalPumps: '4-12' },
    medium: { chilledWaterKW: { min: 50, max: 200 }, condenserKW: { min: 50, max: 200 }, glycolKW: { min: 15, max: 60 }, totalPumps: '12-40' },
    large: { chilledWaterKW: { min: 200, max: 800 }, condenserKW: { min: 200, max: 800 }, glycolKW: { min: 60, max: 200 }, totalPumps: '40-150' },
    hyperscale: { chilledWaterKW: { min: 800, max: 3000 }, condenserKW: { min: 800, max: 3000 }, glycolKW: { min: 200, max: 750 }, totalPumps: '150-500+' },
  },
} as const;

/**
 * Data Center Advanced Cooling Technologies (AI/GPU workloads)
 */
export const DATA_CENTER_ADVANCED_COOLING = {
  directLiquidCooling: {
    edge: null,
    small: { cduCount: '1-5', cduPowerKW: { min: 3, max: 10 }, heatRejectionKW: { min: 30, max: 75 } },
    medium: { cduCount: '5-20', cduPowerKW: { min: 5, max: 15 }, heatRejectionKW: { min: 50, max: 100 } },
    large: { cduCount: '20-100', cduPowerKW: { min: 10, max: 25 }, heatRejectionKW: { min: 75, max: 150 } },
    hyperscale: { cduCount: '100-500+', cduPowerKW: { min: 15, max: 40 }, heatRejectionKW: { min: 100, max: 200 } },
  },
  immersionCooling: {
    edge: null,
    small: { tankCapacityKW: { min: 10, max: 50 }, tanks: '1-10', pue: '1.02-1.05', pumpKW: { min: 0.5, max: 2 } },
    medium: { tankCapacityKW: { min: 50, max: 200 }, tanks: '10-50', pue: '1.02-1.05', pumpKW: { min: 1, max: 4 } },
    large: { tankCapacityKW: { min: 100, max: 500 }, tanks: '50-200', pue: '1.02-1.05', pumpKW: { min: 2, max: 6 } },
    hyperscale: { tankCapacityKW: { min: 200, max: 1000 }, tanks: '200-1000+', pue: '1.02-1.05', pumpKW: { min: 3, max: 8 } },
  },
  rearDoorHeatExchangers: {
    edge: { count: '0-10', fanKW: { min: 0.3, max: 0.8 } },
    small: { count: '10-50', fanKW: { min: 0.3, max: 0.8 } },
    medium: { count: '50-200', fanKW: { min: 0.3, max: 0.8 } },
    large: { count: '200-1000', fanKW: { min: 0.3, max: 0.8 } },
    hyperscale: { count: '1000-5000', fanKW: { min: 0.3, max: 0.8 } },
  },
  economizerSystems: {
    edge: { airside: 'rare', waterside: false, economHoursPerYear: 0 },
    small: { airside: 'optional', waterside: 'optional', economHoursPerYear: { min: 2000, max: 5000 } },
    medium: { airside: 'common', waterside: 'common', economHoursPerYear: { min: 3000, max: 6000 } },
    large: { airside: 'common', waterside: 'standard', economHoursPerYear: { min: 4000, max: 7000 } },
    hyperscale: { airside: 'standard', waterside: 'standard', economHoursPerYear: { min: 5000, max: 8000 } },
  },
} as const;

/**
 * Data Center Battery Systems
 */
export const DATA_CENTER_BATTERY_SYSTEMS = {
  // Traditional VRLA/Lead-Acid UPS Batteries
  vrla: {
    edge: { capacityKWh: { min: 50, max: 500 }, stringVoltage: '480-600 VDC', strings: '2-8', replacementYears: '4-6' },
    small: { capacityKWh: { min: 500, max: 2000 }, stringVoltage: '480-600 VDC', strings: '8-30', replacementYears: '4-6' },
    medium: { capacityKWh: { min: 2000, max: 10000 }, stringVoltage: '480-600 VDC', strings: '30-100', replacementYears: '4-6' },
    large: { capacityKWh: { min: 10000, max: 50000 }, stringVoltage: '480-600 VDC', strings: '100-400', replacementYears: '4-6' },
    hyperscale: { capacityKWh: { min: 50000, max: 200000 }, stringVoltage: '480-600 VDC', strings: '400-2000+', replacementYears: '4-6' },
  },
  // Lithium-Ion Battery Systems
  lithiumIon: {
    energyDensityMultiplier: '3-4x VRLA',
    cycleLife: '3000-5000 cycles',
    replacementYears: '10-15',
    bmsKW: {
      edge: { min: 0.2, max: 1 },
      small: { min: 1, max: 5 },
      medium: { min: 5, max: 20 },
      large: { min: 20, max: 75 },
      hyperscale: { min: 75, max: 250 },
    },
    thermalManagementKW: {
      edge: { min: 1, max: 5 },
      small: { min: 5, max: 20 },
      medium: { min: 20, max: 80 },
      large: { min: 80, max: 300 },
      hyperscale: { min: 300, max: 1000 },
    },
  },
} as const;

/**
 * Data Center Auxiliary Power Loads (Non-IT)
 */
export const DATA_CENTER_AUXILIARY_LOADS = {
  edge: {
    description: 'Edge/Micro (50-500 kW IT)',
    coolingTotalKW: { min: 30, max: 375 },
    powerDistributionLossesKW: { min: 5, max: 50 },
    upsLossesKW: { min: 2, max: 30 },
    lightingKW: { min: 3, max: 15 },
    securityFireKW: { min: 1, max: 5 },
    bmsDcimKW: { min: 1, max: 3 },
    officeSupportKW: { min: 10, max: 40 },
    totalAuxiliaryKW: { min: 52, max: 518 },
    auxAsPercentOfIT: { min: 50, max: 100 },  // Edge has high overhead
  },
  small: {
    description: 'Small (500 kW - 2 MW IT)',
    coolingTotalKW: { min: 375, max: 1500 },
    powerDistributionLossesKW: { min: 50, max: 200 },
    upsLossesKW: { min: 30, max: 100 },
    lightingKW: { min: 15, max: 60 },
    securityFireKW: { min: 5, max: 20 },
    bmsDcimKW: { min: 3, max: 15 },
    officeSupportKW: { min: 40, max: 175 },
    totalAuxiliaryKW: { min: 518, max: 2070 },
    auxAsPercentOfIT: { min: 50, max: 100 },
  },
  medium: {
    description: 'Medium (2-10 MW IT)',
    coolingTotalKW: { min: 1500, max: 7500 },
    powerDistributionLossesKW: { min: 200, max: 1000 },
    upsLossesKW: { min: 100, max: 400 },
    lightingKW: { min: 60, max: 225 },
    securityFireKW: { min: 20, max: 75 },
    bmsDcimKW: { min: 15, max: 50 },
    officeSupportKW: { min: 175, max: 600 },
    totalAuxiliaryKW: { min: 2070, max: 9850 },
    auxAsPercentOfIT: { min: 30, max: 50 },
  },
  large: {
    description: 'Large (10-50 MW IT)',
    coolingTotalKW: { min: 7500, max: 35000 },
    powerDistributionLossesKW: { min: 1000, max: 5000 },
    upsLossesKW: { min: 400, max: 2000 },
    lightingKW: { min: 225, max: 750 },
    securityFireKW: { min: 75, max: 250 },
    bmsDcimKW: { min: 50, max: 150 },
    officeSupportKW: { min: 600, max: 2000 },
    totalAuxiliaryKW: { min: 9850, max: 45150 },
    auxAsPercentOfIT: { min: 20, max: 35 },
  },
  hyperscale: {
    description: 'Hyperscale (50-200+ MW IT)',
    coolingTotalKW: { min: 35000, max: 120000 },
    powerDistributionLossesKW: { min: 5000, max: 20000 },
    upsLossesKW: { min: 2000, max: 6000 },
    lightingKW: { min: 750, max: 3000 },
    securityFireKW: { min: 250, max: 1000 },
    bmsDcimKW: { min: 150, max: 600 },
    officeSupportKW: { min: 2000, max: 7000 },
    totalAuxiliaryKW: { min: 45150, max: 157600 },
    auxAsPercentOfIT: { min: 10, max: 25 },
  },
} as const;

/**
 * Data Center Network Infrastructure Power
 */
export const DATA_CENTER_NETWORK_EQUIPMENT = {
  coreRouters: {
    edge: { min: 1, max: 5 },
    small: { min: 5, max: 20 },
    medium: { min: 20, max: 100 },
    large: { min: 100, max: 400 },
    hyperscale: { min: 400, max: 2000 },
  },
  spineSwitches: {
    edge: { min: 1, max: 5 },
    small: { min: 5, max: 30 },
    medium: { min: 30, max: 150 },
    large: { min: 150, max: 750 },
    hyperscale: { min: 750, max: 4000 },
  },
  leafSwitches: {
    edge: { min: 1, max: 10 },
    small: { min: 10, max: 50 },
    medium: { min: 50, max: 250 },
    large: { min: 250, max: 1500 },
    hyperscale: { min: 1500, max: 10000 },
  },
  loadBalancers: {
    edge: { min: 0.5, max: 2 },
    small: { min: 2, max: 10 },
    medium: { min: 10, max: 50 },
    large: { min: 50, max: 200 },
    hyperscale: { min: 200, max: 1000 },
  },
  firewalls: {
    edge: { min: 0.5, max: 2 },
    small: { min: 2, max: 10 },
    medium: { min: 10, max: 50 },
    large: { min: 50, max: 200 },
    hyperscale: { min: 200, max: 1000 },
  },
} as const;

/**
 * Data Center BESS Integration Sizing
 * Recommendations based on facility size and tier requirements
 */
export const DATA_CENTER_BESS_SIZING = {
  edge: {
    recommendedMWh: { min: 0.1, max: 0.5 },
    recommendedMW: { min: 0.05, max: 0.25 },
    durationHours: 1,
    primaryUseCase: 'Short-term UPS bridge, demand charge reduction',
    gridServicesCapable: false,
    roiYears: { typical: 6, range: '5-8' },
  },
  small: {
    recommendedMWh: { min: 0.5, max: 3 },
    recommendedMW: { min: 0.25, max: 1.5 },
    durationHours: 2,
    primaryUseCase: 'UPS enhancement, peak shaving, demand response',
    gridServicesCapable: true,
    roiYears: { typical: 5, range: '4-7' },
  },
  medium: {
    recommendedMWh: { min: 3, max: 15 },
    recommendedMW: { min: 1.5, max: 8 },
    durationHours: 2,
    primaryUseCase: 'Grid services, frequency regulation, demand management',
    gridServicesCapable: true,
    roiYears: { typical: 4, range: '3-6' },
  },
  large: {
    recommendedMWh: { min: 15, max: 75 },
    recommendedMW: { min: 8, max: 40 },
    durationHours: '1.5-2',
    primaryUseCase: 'Grid-scale services, wholesale market, critical backup',
    gridServicesCapable: true,
    roiYears: { typical: 4, range: '3-5' },
  },
  hyperscale: {
    recommendedMWh: { min: 75, max: 300 },
    recommendedMW: { min: 40, max: 150 },
    durationHours: '1-2',
    primaryUseCase: 'Market participation, grid stability, renewable integration',
    gridServicesCapable: true,
    roiYears: { typical: 3, range: '2-5' },
  },
} as const;

/**
 * Data Center Grid Interconnection Requirements
 */
export const DATA_CENTER_GRID_REQUIREMENTS = {
  edge: {
    interconnectionStudy: 'minimal',
    timelineMonths: '1-3',
    networkUpgrades: 'none',
    dedicatedCircuits: false,
    substationRequired: false,
  },
  small: {
    interconnectionStudy: 'fast-track',
    timelineMonths: '3-12',
    networkUpgrades: 'minor',
    dedicatedCircuits: 'optional',
    substationRequired: false,
  },
  medium: {
    interconnectionStudy: 'full study',
    timelineMonths: '12-24',
    networkUpgrades: 'moderate',
    dedicatedCircuits: 'often',
    substationRequired: 'often',
  },
  large: {
    interconnectionStudy: 'system impact',
    timelineMonths: '24-48',
    networkUpgrades: 'significant',
    dedicatedCircuits: true,
    substationRequired: true,
  },
  hyperscale: {
    interconnectionStudy: 'facilities study',
    timelineMonths: '36-60+',
    networkUpgrades: 'major/new circuits',
    dedicatedCircuits: 'multiple',
    substationRequired: 'customer-owned',
  },
} as const;

// ============================================================================
// OFFICE BUILDING CLASSIFICATIONS - Abbreviated (Dec 2025)
// Source: CBECS 2018, ASHRAE 90.1, ENERGY STAR benchmarks
// ============================================================================

export const OFFICE_BUILDING_CLASSIFICATIONS = {
  smallOffice: {
    name: 'Small Office',
    sqFtRange: { min: 10000, max: 50000 },
    peakLoadKW: { min: 75, max: 400 },
    wPerSqFt: { min: 6, max: 10, typical: 8 },
    floors: { min: 1, max: 3 },
    occupants: { min: 50, max: 250 },
    loadFactor: 0.52,
  },
  mediumOffice: {
    name: 'Medium Office',
    sqFtRange: { min: 50000, max: 150000 },
    peakLoadKW: { min: 400, max: 1200 },
    wPerSqFt: { min: 7, max: 12, typical: 9.5 },
    floors: { min: 3, max: 8 },
    occupants: { min: 250, max: 750 },
    loadFactor: 0.55,
  },
  largeOffice: {
    name: 'Large Office',
    sqFtRange: { min: 150000, max: 500000 },
    peakLoadKW: { min: 1200, max: 4000 },
    wPerSqFt: { min: 8, max: 14, typical: 11 },
    floors: { min: 8, max: 20 },
    occupants: { min: 750, max: 2500 },
    loadFactor: 0.58,
  },
  highRiseTower: {
    name: 'High-Rise Tower',
    sqFtRange: { min: 500000, max: 2000000 },
    peakLoadKW: { min: 4000, max: 16000 },
    wPerSqFt: { min: 10, max: 16, typical: 13 },
    floors: { min: 20, max: 60 },
    occupants: { min: 2500, max: 10000 },
    loadFactor: 0.60,
  },
  corporateCampus: {
    name: 'Corporate Campus',
    sqFtRange: { min: 1000000, max: 10000000 },
    peakLoadKW: { min: 10000, max: 80000 },
    wPerSqFt: { min: 8, max: 14, typical: 11 },
    floors: { min: 1, max: 20 }, // Multiple buildings
    occupants: { min: 5000, max: 50000 },
    loadFactor: 0.58,
  },
} as const;

export const OFFICE_BESS_SIZING = {
  smallOffice: { sizeMWh: { min: 0.05, max: 0.2 }, powerMW: { min: 0.025, max: 0.1 } },
  mediumOffice: { sizeMWh: { min: 0.2, max: 0.8 }, powerMW: { min: 0.05, max: 0.15 } },
  largeOffice: { sizeMWh: { min: 0.8, max: 3 }, powerMW: { min: 0.15, max: 0.5 } },
  highRiseTower: { sizeMWh: { min: 2, max: 10 }, powerMW: { min: 0.4, max: 1.5 } },
  corporateCampus: { sizeMWh: { min: 8, max: 50 }, powerMW: { min: 1, max: 8 } },
} as const;

export const OFFICE_GRID_REQUIREMENTS = {
  smallOffice: { voltageKV: 0.48, services: 1 },
  mediumOffice: { voltageKV: 4.16, services: 1 },
  largeOffice: { voltageKV: 13.8, services: 2 },
  highRiseTower: { voltageKV: 34.5, services: 4 },
  corporateCampus: { voltageKV: 69, services: 8 },
} as const;

export type OfficeClassification = keyof typeof OFFICE_BUILDING_CLASSIFICATIONS;

// ============================================================================
// UNIVERSITY/CAMPUS CLASSIFICATIONS - Abbreviated (Dec 2025)
// Source: APPA, EPA ENERGY STAR, Carnegie Classification
// ============================================================================

export const UNIVERSITY_CLASSIFICATIONS = {
  smallCollege: {
    name: 'Small College',
    enrollment: { min: 1000, max: 5000 },
    peakLoadMW: { min: 5, max: 28 },
    kWPerStudent: { min: 2, max: 4, typical: 3 },
    campusAcres: { min: 50, max: 200 },
    grossBuildingSF: { min: 500000, max: 2000000 },
    residentialBeds: { min: 500, max: 3000 },
    loadFactor: 0.575,
  },
  mediumUniversity: {
    name: 'Medium University',
    enrollment: { min: 5000, max: 15000 },
    peakLoadMW: { min: 22, max: 115 },
    kWPerStudent: { min: 3, max: 5, typical: 4 },
    campusAcres: { min: 200, max: 500 },
    grossBuildingSF: { min: 2000000, max: 6000000 },
    residentialBeds: { min: 3000, max: 8000 },
    loadFactor: 0.625,
  },
  largeUniversity: {
    name: 'Large University',
    enrollment: { min: 15000, max: 35000 },
    peakLoadMW: { min: 75, max: 420 },
    kWPerStudent: { min: 4, max: 6, typical: 5 },
    campusAcres: { min: 500, max: 1500 },
    grossBuildingSF: { min: 6000000, max: 15000000 },
    residentialBeds: { min: 8000, max: 18000 },
    loadFactor: 0.66,
  },
  majorResearch: {
    name: 'Major Research University',
    enrollment: { min: 35000, max: 60000 },
    peakLoadMW: { min: 235, max: 1250 },
    kWPerStudent: { min: 5, max: 8, typical: 6.5 },
    campusAcres: { min: 1000, max: 3000 },
    grossBuildingSF: { min: 15000000, max: 35000000 },
    residentialBeds: { min: 15000, max: 30000 },
    loadFactor: 0.685,
  },
  megaUniversity: {
    name: 'Mega University/System',
    enrollment: { min: 60000, max: 100000 },
    peakLoadMW: { min: 630, max: 3700 },
    kWPerStudent: { min: 5, max: 7, typical: 6 },
    campusAcres: { min: 2000, max: 10000 },
    grossBuildingSF: { min: 30000000, max: 80000000 },
    residentialBeds: { min: 25000, max: 50000 },
    loadFactor: 0.715,
  },
} as const;

export const UNIVERSITY_BESS_SIZING = {
  smallCollege: { sizeMWh: { min: 0.5, max: 2 }, powerMW: { min: 0.2, max: 0.75 } },
  mediumUniversity: { sizeMWh: { min: 2, max: 10 }, powerMW: { min: 0.75, max: 3 } },
  largeUniversity: { sizeMWh: { min: 10, max: 40 }, powerMW: { min: 3, max: 12 } },
  majorResearch: { sizeMWh: { min: 30, max: 120 }, powerMW: { min: 10, max: 40 } },
  megaUniversity: { sizeMWh: { min: 80, max: 300 }, powerMW: { min: 25, max: 100 } },
} as const;

export const UNIVERSITY_GRID_REQUIREMENTS = {
  smallCollege: { voltageKV: 13.8, services: 2 },
  mediumUniversity: { voltageKV: 34.5, services: 4 },
  largeUniversity: { voltageKV: 69, services: 8 },
  majorResearch: { voltageKV: 138, services: 15 },
  megaUniversity: { voltageKV: 345, services: 30 },
} as const;

export type UniversityClassification = keyof typeof UNIVERSITY_CLASSIFICATIONS;

// ============================================================================
// AIRPORT CLASSIFICATIONS - From Equipment Specification Sheet (Dec 2025)
// Source: FAA AC 150/5370-2G, ICAO standards, ASHRAE aviation guidelines
// ============================================================================

/**
 * Airport Classifications by Size
 * Based on FAA standards and annual passenger throughput
 */
export const AIRPORT_CLASSIFICATIONS = {
  smallRegional: {
    name: 'Small Regional Airport',
    description: 'Regional/commuter airports serving local communities',
    annualPassengers: { min: 0, max: 1000000 },           // < 1 million
    totalFacilityLoad: { min: 2000, max: 10000 },         // 2-10 MW
    terminalArea: { min: 50000, max: 150000 },            // sq ft
    runways: { min: 1, max: 2 },
    gates: { min: 3, max: 10 },
    loadFactor: { min: 0.50, max: 0.65 },
    peakDemand: { min: 2000, max: 6000 },                 // kW
    avgOperating: { min: 1500, max: 4000 },               // kW
  },
  mediumRegional: {
    name: 'Medium Regional Airport',
    description: 'Regional airports with multiple carriers',
    annualPassengers: { min: 1000000, max: 5000000 },     // 1-5 million
    totalFacilityLoad: { min: 10000, max: 30000 },        // 10-30 MW
    terminalArea: { min: 150000, max: 500000 },           // sq ft
    runways: { min: 1, max: 2 },
    gates: { min: 10, max: 25 },
    loadFactor: { min: 0.55, max: 0.70 },
    peakDemand: { min: 6000, max: 18000 },                // kW
    avgOperating: { min: 4000, max: 12000 },              // kW
  },
  largeRegional: {
    name: 'Large Regional Airport',
    description: 'Large regional/small hub airports',
    annualPassengers: { min: 5000000, max: 15000000 },    // 5-15 million
    totalFacilityLoad: { min: 30000, max: 75000 },        // 30-75 MW
    terminalArea: { min: 500000, max: 1500000 },          // sq ft
    runways: { min: 2, max: 3 },
    gates: { min: 25, max: 50 },
    loadFactor: { min: 0.60, max: 0.75 },
    peakDemand: { min: 18000, max: 55000 },               // kW
    avgOperating: { min: 12000, max: 35000 },             // kW
  },
  majorHub: {
    name: 'Major Hub Airport',
    description: 'Major hub airports with international service',
    annualPassengers: { min: 15000000, max: 50000000 },   // 15-50 million
    totalFacilityLoad: { min: 75000, max: 200000 },       // 75-200 MW
    terminalArea: { min: 1500000, max: 5000000 },         // sq ft
    runways: { min: 3, max: 5 },
    gates: { min: 50, max: 120 },
    loadFactor: { min: 0.65, max: 0.80 },
    peakDemand: { min: 55000, max: 175000 },              // kW
    avgOperating: { min: 35000, max: 110000 },            // kW
  },
  megaHub: {
    name: 'Mega Hub Airport',
    description: 'World\'s largest airports (ATL, DXB, DFW, etc.)',
    annualPassengers: { min: 50000000, max: 150000000 },  // 50-100+ million
    totalFacilityLoad: { min: 200000, max: 650000 },      // 200-500+ MW
    terminalArea: { min: 5000000, max: 15000000 },        // sq ft
    runways: { min: 4, max: 7 },
    gates: { min: 120, max: 250 },
    loadFactor: { min: 0.70, max: 0.85 },
    peakDemand: { min: 175000, max: 500000 },             // kW
    avgOperating: { min: 110000, max: 325000 },           // kW
  },
} as const;

export type AirportClassification = keyof typeof AIRPORT_CLASSIFICATIONS;

/**
 * Airport Airfield Lighting Systems (kW)
 * Source: FAA AC 150/5340 series, ICAO Annex 14
 */
export const AIRPORT_AIRFIELD_LIGHTING = {
  runwayLighting: {
    highIntensity: {      // HIRL (per runway)
      smallRegional: { min: 10, max: 25 },
      mediumRegional: { min: 15, max: 35 },
      largeRegional: { min: 20, max: 50 },
      majorHub: { min: 25, max: 60 },
      megaHub: { min: 30, max: 75 },
    },
    edgeLights: {         // Per runway
      smallRegional: { min: 8, max: 20 },
      mediumRegional: { min: 12, max: 30 },
      largeRegional: { min: 15, max: 40 },
      majorHub: { min: 20, max: 50 },
      megaHub: { min: 25, max: 60 },
    },
    centerlineLights: {   // Per runway (CAT II/III)
      smallRegional: null,
      mediumRegional: { min: 5, max: 15 },
      largeRegional: { min: 10, max: 25 },
      majorHub: { min: 15, max: 35 },
      megaHub: { min: 20, max: 45 },
    },
    touchdownZone: {      // TDZ per runway
      smallRegional: null,
      mediumRegional: { min: 8, max: 20 },
      largeRegional: { min: 12, max: 30 },
      majorHub: { min: 15, max: 40 },
      megaHub: { min: 20, max: 50 },
    },
  },
  approachLighting: {
    alsf2CatIIIII: {     // Per system
      smallRegional: null,
      mediumRegional: null,
      largeRegional: { min: 30, max: 75 },
      majorHub: { min: 40, max: 100 },
      megaHub: { min: 50, max: 125 },
    },
    alsf1CatI: {         // Per system
      smallRegional: null,
      mediumRegional: { min: 15, max: 40 },
      largeRegional: { min: 20, max: 50 },
      majorHub: { min: 25, max: 60 },
      megaHub: { min: 30, max: 75 },
    },
    papiVasi: {          // Per runway
      smallRegional: { min: 2, max: 5 },
      mediumRegional: { min: 3, max: 6 },
      largeRegional: { min: 4, max: 8 },
      majorHub: { min: 5, max: 10 },
      megaHub: { min: 6, max: 12 },
    },
  },
  taxiwayLighting: {
    edgeLights: {        // Total taxiway system
      smallRegional: { min: 15, max: 40 },
      mediumRegional: { min: 40, max: 100 },
      largeRegional: { min: 100, max: 250 },
      majorHub: { min: 250, max: 600 },
      megaHub: { min: 600, max: 1500 },
    },
    centerlineLights: {
      smallRegional: null,
      mediumRegional: { min: 10, max: 30 },
      largeRegional: { min: 30, max: 80 },
      majorHub: { min: 80, max: 200 },
      megaHub: { min: 200, max: 500 },
    },
    stopBarLights: {
      smallRegional: { min: 3, max: 8 },
      mediumRegional: { min: 8, max: 20 },
      largeRegional: { min: 20, max: 50 },
      majorHub: { min: 50, max: 125 },
      megaHub: { min: 125, max: 300 },
    },
  },
  apronLighting: {
    highMast: {          // Total apron/ramp
      smallRegional: { min: 20, max: 60 },
      mediumRegional: { min: 60, max: 150 },
      largeRegional: { min: 150, max: 400 },
      majorHub: { min: 400, max: 1000 },
      megaHub: { min: 1000, max: 2500 },
    },
    gateFloodLights: {
      smallRegional: { min: 15, max: 40 },
      mediumRegional: { min: 40, max: 100 },
      largeRegional: { min: 100, max: 250 },
      majorHub: { min: 250, max: 600 },
      megaHub: { min: 600, max: 1500 },
    },
  },
  lightingControl: {
    vault: {             // Airfield Lighting Vault
      smallRegional: { min: 5, max: 15 },
      mediumRegional: { min: 15, max: 40 },
      largeRegional: { min: 40, max: 100 },
      majorHub: { min: 100, max: 250 },
      megaHub: { min: 250, max: 600 },
    },
    constantCurrentRegulators: {
      smallRegional: { min: 10, max: 30 },
      mediumRegional: { min: 30, max: 80 },
      largeRegional: { min: 80, max: 200 },
      majorHub: { min: 200, max: 500 },
      megaHub: { min: 500, max: 1200 },
    },
    alcms: {             // Control system
      smallRegional: { min: 2, max: 5 },
      mediumRegional: { min: 5, max: 12 },
      largeRegional: { min: 12, max: 30 },
      majorHub: { min: 30, max: 75 },
      megaHub: { min: 75, max: 150 },
    },
  },
} as const;

/**
 * Airport Navigational Aids (NAVAIDs) (kW)
 * Source: FAA Order 6750.16E
 */
export const AIRPORT_NAVAIDS = {
  ilsLocalizer: {        // Per system
    smallRegional: { min: 2, max: 5 },
    mediumRegional: { min: 3, max: 6 },
    largeRegional: { min: 4, max: 8 },
    majorHub: { min: 5, max: 10 },
    megaHub: { min: 5, max: 10 },
  },
  ilsGlideSlope: {       // Per system
    smallRegional: { min: 1, max: 3 },
    mediumRegional: { min: 2, max: 4 },
    largeRegional: { min: 2, max: 5 },
    majorHub: { min: 3, max: 6 },
    megaHub: { min: 3, max: 6 },
  },
  vorDme: {
    smallRegional: { min: 3, max: 8 },
    mediumRegional: { min: 4, max: 10 },
    largeRegional: { min: 5, max: 12 },
    majorHub: { min: 5, max: 12 },
    megaHub: { min: 5, max: 12 },
  },
  asosAwos: {            // Weather station
    smallRegional: { min: 1, max: 3 },
    mediumRegional: { min: 2, max: 4 },
    largeRegional: { min: 3, max: 6 },
    majorHub: { min: 4, max: 8 },
    megaHub: { min: 5, max: 10 },
  },
  asr: {                 // Airport Surveillance Radar
    smallRegional: null,
    mediumRegional: { min: 20, max: 50 },
    largeRegional: { min: 30, max: 75 },
    majorHub: { min: 40, max: 100 },
    megaHub: { min: 50, max: 125 },
  },
  asdeX: {               // Surface Detection
    smallRegional: null,
    mediumRegional: null,
    largeRegional: { min: 15, max: 40 },
    majorHub: { min: 25, max: 60 },
    megaHub: { min: 35, max: 80 },
  },
  numberOfIlsSystems: {
    smallRegional: '1-2',
    mediumRegional: '2-4',
    largeRegional: '4-8',
    majorHub: '8-16',
    megaHub: '16-30+',
  },
} as const;

/**
 * Airport Air Traffic Control (kW)
 */
export const AIRPORT_ATC = {
  controlTower: {
    total: {
      smallRegional: { min: 30, max: 75 },
      mediumRegional: { min: 75, max: 200 },
      largeRegional: { min: 200, max: 500 },
      majorHub: { min: 500, max: 1200 },
      megaHub: { min: 1200, max: 3000 },
    },
    hvac: {
      smallRegional: { min: 15, max: 40 },
      mediumRegional: { min: 40, max: 100 },
      largeRegional: { min: 100, max: 250 },
      majorHub: { min: 250, max: 600 },
      megaHub: { min: 600, max: 1500 },
    },
    atcEquipment: {
      smallRegional: { min: 10, max: 25 },
      mediumRegional: { min: 25, max: 60 },
      largeRegional: { min: 60, max: 150 },
      majorHub: { min: 150, max: 400 },
      megaHub: { min: 400, max: 1000 },
    },
  },
  tracon: {              // Terminal Radar Approach Control
    smallRegional: null,
    mediumRegional: { min: 50, max: 150 },
    largeRegional: { min: 150, max: 400 },
    majorHub: { min: 400, max: 1000 },
    megaHub: { min: 1000, max: 2500 },
  },
  communications: {
    smallRegional: { min: 5, max: 15 },
    mediumRegional: { min: 15, max: 40 },
    largeRegional: { min: 40, max: 100 },
    majorHub: { min: 100, max: 250 },
    megaHub: { min: 250, max: 600 },
  },
  upsForAtc: {
    smallRegional: { min: 20, max: 50 },
    mediumRegional: { min: 50, max: 125 },
    largeRegional: { min: 125, max: 300 },
    majorHub: { min: 300, max: 750 },
    megaHub: { min: 750, max: 2000 },
  },
} as const;

/**
 * Airport Terminal HVAC Systems (kW)
 */
export const AIRPORT_TERMINAL_HVAC = {
  centralPlant: {
    chillers: {          // Total capacity in tons & power
      smallRegional: { tons: { min: 200, max: 600 }, powerKW: { min: 150, max: 500 } },
      mediumRegional: { tons: { min: 600, max: 2000 }, powerKW: { min: 500, max: 1500 } },
      largeRegional: { tons: { min: 2000, max: 6000 }, powerKW: { min: 1500, max: 4500 } },
      majorHub: { tons: { min: 6000, max: 20000 }, powerKW: { min: 4500, max: 15000 } },
      megaHub: { tons: { min: 20000, max: 60000 }, powerKW: { min: 15000, max: 45000 } },
    },
    coolingTowers: {
      smallRegional: { min: 100, max: 300 },
      mediumRegional: { min: 300, max: 800 },
      largeRegional: { min: 800, max: 2500 },
      majorHub: { min: 2500, max: 8000 },
      megaHub: { min: 8000, max: 25000 },
    },
    boilers: {           // Electric equivalent
      smallRegional: { min: 200, max: 600 },
      mediumRegional: { min: 600, max: 2000 },
      largeRegional: { min: 2000, max: 6000 },
      majorHub: { min: 6000, max: 18000 },
      megaHub: { min: 18000, max: 50000 },
    },
    pumps: {
      chilledWater: {
        smallRegional: { min: 30, max: 80 },
        mediumRegional: { min: 80, max: 250 },
        largeRegional: { min: 250, max: 750 },
        majorHub: { min: 750, max: 2500 },
        megaHub: { min: 2500, max: 7500 },
      },
      condenserWater: {
        smallRegional: { min: 30, max: 80 },
        mediumRegional: { min: 80, max: 250 },
        largeRegional: { min: 250, max: 750 },
        majorHub: { min: 750, max: 2500 },
        megaHub: { min: 2500, max: 7500 },
      },
    },
  },
  airHandling: {
    ahuTotal: {
      smallRegional: { min: 100, max: 300 },
      mediumRegional: { min: 300, max: 800 },
      largeRegional: { min: 800, max: 2500 },
      majorHub: { min: 2500, max: 8000 },
      megaHub: { min: 8000, max: 25000 },
    },
    terminalUnitsVav: {
      smallRegional: { min: 20, max: 60 },
      mediumRegional: { min: 60, max: 180 },
      largeRegional: { min: 180, max: 500 },
      majorHub: { min: 500, max: 1500 },
      megaHub: { min: 1500, max: 5000 },
    },
    exhaustFans: {
      smallRegional: { min: 30, max: 80 },
      mediumRegional: { min: 80, max: 200 },
      largeRegional: { min: 200, max: 600 },
      majorHub: { min: 600, max: 2000 },
      megaHub: { min: 2000, max: 6000 },
    },
    jetBridgeHvacPerBridge: {
      smallRegional: { min: 5, max: 15 },
      mediumRegional: { min: 5, max: 15 },
      largeRegional: { min: 8, max: 20 },
      majorHub: { min: 10, max: 25 },
      megaHub: { min: 12, max: 30 },
    },
  },
} as const;

/**
 * Airport Baggage Handling Systems (kW)
 */
export const AIRPORT_BAGGAGE_HANDLING = {
  outbound: {
    checkinConveyors: {
      smallRegional: { min: 10, max: 30 },
      mediumRegional: { min: 30, max: 80 },
      largeRegional: { min: 80, max: 250 },
      majorHub: { min: 250, max: 750 },
      megaHub: { min: 750, max: 2500 },
    },
    mainConveyorLines: {
      smallRegional: { min: 20, max: 60 },
      mediumRegional: { min: 60, max: 180 },
      largeRegional: { min: 180, max: 500 },
      majorHub: { min: 500, max: 1500 },
      megaHub: { min: 1500, max: 5000 },
    },
    sortationSystem: {
      smallRegional: { min: 15, max: 50 },
      mediumRegional: { min: 50, max: 150 },
      largeRegional: { min: 150, max: 450 },
      majorHub: { min: 450, max: 1500 },
      megaHub: { min: 1500, max: 5000 },
    },
    tiltTraySorters: {
      smallRegional: null,
      mediumRegional: { min: 30, max: 100 },
      largeRegional: { min: 100, max: 300 },
      majorHub: { min: 300, max: 1000 },
      megaHub: { min: 1000, max: 3500 },
    },
    dcvSystem: {          // Destination Coded Vehicles
      smallRegional: null,
      mediumRegional: null,
      largeRegional: { min: 50, max: 200 },
      majorHub: { min: 200, max: 750 },
      megaHub: { min: 750, max: 2500 },
    },
    screeningConveyors: {
      smallRegional: { min: 10, max: 30 },
      mediumRegional: { min: 30, max: 100 },
      largeRegional: { min: 100, max: 300 },
      majorHub: { min: 300, max: 1000 },
      megaHub: { min: 1000, max: 3000 },
    },
  },
  inbound: {
    claimConveyors: {
      smallRegional: { min: 15, max: 40 },
      mediumRegional: { min: 40, max: 100 },
      largeRegional: { min: 100, max: 300 },
      majorHub: { min: 300, max: 800 },
      megaHub: { min: 800, max: 2500 },
    },
    carousels: {
      smallRegional: { min: 20, max: 50 },
      mediumRegional: { min: 50, max: 150 },
      largeRegional: { min: 150, max: 400 },
      majorHub: { min: 400, max: 1200 },
      megaHub: { min: 1200, max: 4000 },
    },
    numberOfClaimDevices: {
      smallRegional: '2-6',
      mediumRegional: '6-15',
      largeRegional: '15-40',
      majorHub: '40-100',
      megaHub: '100-250+',
    },
  },
  totalBhs: {
    smallRegional: { min: 100, max: 300 },
    mediumRegional: { min: 300, max: 900 },
    largeRegional: { min: 900, max: 2500 },
    majorHub: { min: 2500, max: 8000 },
    megaHub: { min: 8000, max: 25000 },
  },
} as const;

/**
 * Airport Security Systems (kW)
 */
export const AIRPORT_SECURITY = {
  passengerScreening: {
    xrayMachines: {
      smallRegional: { min: 5, max: 15 },
      mediumRegional: { min: 15, max: 40 },
      largeRegional: { min: 40, max: 100 },
      majorHub: { min: 100, max: 300 },
      megaHub: { min: 300, max: 800 },
    },
    ctScanners: {
      smallRegional: null,
      mediumRegional: { min: 10, max: 30 },
      largeRegional: { min: 30, max: 100 },
      majorHub: { min: 100, max: 350 },
      megaHub: { min: 350, max: 1000 },
    },
    bodyScanners: {
      smallRegional: { min: 5, max: 15 },
      mediumRegional: { min: 15, max: 40 },
      largeRegional: { min: 40, max: 100 },
      majorHub: { min: 100, max: 300 },
      megaHub: { min: 300, max: 800 },
    },
    checkpointLanes: {
      smallRegional: '2-6',
      mediumRegional: '6-15',
      largeRegional: '15-40',
      majorHub: '40-100',
      megaHub: '100-250+',
    },
    powerPerLane: {
      smallRegional: { min: 5, max: 10 },
      mediumRegional: { min: 6, max: 12 },
      largeRegional: { min: 8, max: 15 },
      majorHub: { min: 10, max: 18 },
      megaHub: { min: 12, max: 20 },
    },
  },
  checkedBaggageScreening: {
    edsMachines: {
      smallRegional: { min: 15, max: 40 },
      mediumRegional: { min: 40, max: 100 },
      largeRegional: { min: 100, max: 300 },
      majorHub: { min: 300, max: 1000 },
      megaHub: { min: 1000, max: 3000 },
    },
    numberOfEdsUnits: {
      smallRegional: '1-3',
      mediumRegional: '3-8',
      largeRegional: '8-25',
      majorHub: '25-75',
      megaHub: '75-200+',
    },
  },
  accessControlSurveillance: {
    cctvCameras: {
      smallRegional: { min: 10, max: 30 },
      mediumRegional: { min: 30, max: 80 },
      largeRegional: { min: 80, max: 250 },
      majorHub: { min: 250, max: 750 },
      megaHub: { min: 750, max: 2500 },
    },
    videoManagementSystem: {
      smallRegional: { min: 5, max: 15 },
      mediumRegional: { min: 15, max: 40 },
      largeRegional: { min: 40, max: 120 },
      majorHub: { min: 120, max: 400 },
      megaHub: { min: 400, max: 1200 },
    },
    accessControlPanels: {
      smallRegional: { min: 3, max: 8 },
      mediumRegional: { min: 8, max: 20 },
      largeRegional: { min: 20, max: 60 },
      majorHub: { min: 60, max: 180 },
      megaHub: { min: 180, max: 500 },
    },
    perimeterIntrusionDetection: {
      smallRegional: { min: 5, max: 15 },
      mediumRegional: { min: 15, max: 40 },
      largeRegional: { min: 40, max: 100 },
      majorHub: { min: 100, max: 300 },
      megaHub: { min: 300, max: 800 },
    },
    securityOperationsCenter: {
      smallRegional: { min: 10, max: 30 },
      mediumRegional: { min: 30, max: 80 },
      largeRegional: { min: 80, max: 200 },
      majorHub: { min: 200, max: 600 },
      megaHub: { min: 600, max: 2000 },
    },
    numberOfCctvCameras: {
      smallRegional: '50-200',
      mediumRegional: '200-600',
      largeRegional: '600-2,000',
      majorHub: '2,000-6,000',
      megaHub: '6,000-20,000+',
    },
  },
} as const;

/**
 * Airport Ground Support Equipment (GSE) (kW)
 */
export const AIRPORT_GSE = {
  electricGseFleet: {
    baggageTractors: { powerPerUnit: { min: 15, max: 25 }, units: {
      smallRegional: '3-10', mediumRegional: '10-30', largeRegional: '30-100', majorHub: '100-300', megaHub: '300-800'
    }},
    beltLoaders: { powerPerUnit: { min: 20, max: 35 }, units: {
      smallRegional: '2-8', mediumRegional: '8-25', largeRegional: '25-75', majorHub: '75-200', megaHub: '200-600'
    }},
    pushbackTugs: { powerPerUnit: { min: 75, max: 200 }, units: {
      smallRegional: '1-4', mediumRegional: '4-12', largeRegional: '12-40', majorHub: '40-120', megaHub: '120-350'
    }},
    cateringTrucks: { powerPerUnit: { min: 40, max: 80 }, units: {
      smallRegional: '1-4', mediumRegional: '4-12', largeRegional: '12-35', majorHub: '35-100', megaHub: '100-300'
    }},
    groundPowerUnits: { powerPerUnit: { min: 90, max: 150 }, units: {
      smallRegional: '2-8', mediumRegional: '8-20', largeRegional: '20-50', majorHub: '50-120', megaHub: '120-250'
    }},
  },
  gseChargingInfrastructure: {
    chargingStations: {
      smallRegional: { min: 100, max: 300 },
      mediumRegional: { min: 300, max: 800 },
      largeRegional: { min: 800, max: 2500 },
      majorHub: { min: 2500, max: 8000 },
      megaHub: { min: 8000, max: 25000 },
    },
    numberOfChargePoints: {
      smallRegional: '5-20',
      mediumRegional: '20-60',
      largeRegional: '60-200',
      majorHub: '200-600',
      megaHub: '600-1,500+',
    },
  },
} as const;

/**
 * Airport Gate Power Systems (kW)
 */
export const AIRPORT_GATE_POWER = {
  fixedGroundPower: {    // 400 Hz per gate
    perGate: {
      smallRegional: { min: 90, max: 150 },
      mediumRegional: { min: 90, max: 150 },
      largeRegional: { min: 90, max: 180 },
      majorHub: { min: 120, max: 200 },
      megaHub: { min: 120, max: 200 },
    },
    totalCapacity: {
      smallRegional: { min: 300, max: 1000 },
      mediumRegional: { min: 1000, max: 3000 },
      largeRegional: { min: 2500, max: 8000 },
      majorHub: { min: 6000, max: 20000 },
      megaHub: { min: 15000, max: 45000 },
    },
  },
  preconditionedAir: {   // PCA per gate
    perGate: {
      smallRegional: { min: 50, max: 100 },
      mediumRegional: { min: 50, max: 100 },
      largeRegional: { min: 75, max: 150 },
      majorHub: { min: 100, max: 200 },
      megaHub: { min: 100, max: 200 },
    },
    totalLoad: {
      smallRegional: { min: 150, max: 800 },
      mediumRegional: { min: 500, max: 2000 },
      largeRegional: { min: 2000, max: 6000 },
      majorHub: { min: 5000, max: 20000 },
      megaHub: { min: 12000, max: 45000 },
    },
  },
  frequencyConverters: {  // Auxiliary
    smallRegional: { min: 5, max: 15 },
    mediumRegional: { min: 15, max: 40 },
    largeRegional: { min: 40, max: 100 },
    majorHub: { min: 100, max: 250 },
    megaHub: { min: 250, max: 600 },
  },
} as const;

/**
 * Airport Auxiliary Facilities (kW)
 */
export const AIRPORT_AUXILIARY_FACILITIES = {
  fuelFarm: {
    total: {
      smallRegional: { min: 75, max: 200 },
      mediumRegional: { min: 300, max: 850 },
      largeRegional: { min: 850, max: 2100 },
      majorHub: { min: 2200, max: 6000 },
      megaHub: { min: 6000, max: 17000 },
    },
    storageCapacity: {   // gallons
      smallRegional: '100K-500K',
      mediumRegional: '500K-2M',
      largeRegional: '2-10M',
      majorHub: '10-50M',
      megaHub: '50-200M+',
    },
  },
  deIcing: {
    total: {
      smallRegional: { min: 65, max: 200 },
      mediumRegional: { min: 250, max: 700 },
      largeRegional: { min: 700, max: 2000 },
      majorHub: { min: 2000, max: 5500 },
      megaHub: { min: 5500, max: 15000 },
    },
    positions: {
      smallRegional: '1-3',
      mediumRegional: '3-8',
      largeRegional: '8-20',
      majorHub: '20-50',
      megaHub: '50-100+',
    },
  },
  arff: {                // Aircraft Rescue & Firefighting
    total: {
      smallRegional: { min: 30, max: 80 },
      mediumRegional: { min: 80, max: 200 },
      largeRegional: { min: 200, max: 500 },
      majorHub: { min: 500, max: 1200 },
      megaHub: { min: 1200, max: 3000 },
    },
    stations: {
      smallRegional: '1',
      mediumRegional: '1-2',
      largeRegional: '2-3',
      majorHub: '3-5',
      megaHub: '5-8+',
    },
  },
  cargo: {
    total: {
      smallRegional: { min: 130, max: 400 },
      mediumRegional: { min: 400, max: 1200 },
      largeRegional: { min: 1200, max: 3500 },
      majorHub: { min: 3500, max: 10000 },
      megaHub: { min: 10000, max: 33000 },
    },
    area: {              // sq ft
      smallRegional: '10,000-30,000',
      mediumRegional: '30,000-100,000',
      largeRegional: '100,000-400,000',
      majorHub: '400,000-1.5M',
      megaHub: '1.5-5M+',
    },
  },
  maintenance: {
    total: {
      smallRegional: { min: 200, max: 600 },
      mediumRegional: { min: 700, max: 2000 },
      largeRegional: { min: 2000, max: 6000 },
      majorHub: { min: 6000, max: 18000 },
      megaHub: { min: 18000, max: 55000 },
    },
    hangarArea: {        // sq ft
      smallRegional: '20,000-60,000',
      mediumRegional: '60,000-200,000',
      largeRegional: '200,000-750,000',
      majorHub: '750,000-2.5M',
      megaHub: '2.5-8M+',
    },
  },
} as const;

/**
 * Airport Terminal Electrical & Vertical Transportation (kW)
 */
export const AIRPORT_TERMINAL_ELECTRICAL = {
  lighting: {
    terminalInterior: {
      smallRegional: { min: 50, max: 150 },
      mediumRegional: { min: 150, max: 400 },
      largeRegional: { min: 400, max: 1200 },
      majorHub: { min: 1200, max: 4000 },
      megaHub: { min: 4000, max: 12000 },
    },
    concourseGates: {
      smallRegional: { min: 30, max: 80 },
      mediumRegional: { min: 80, max: 250 },
      largeRegional: { min: 250, max: 750 },
      majorHub: { min: 750, max: 2500 },
      megaHub: { min: 2500, max: 8000 },
    },
    retailFoodCourt: {
      smallRegional: { min: 20, max: 60 },
      mediumRegional: { min: 60, max: 180 },
      largeRegional: { min: 180, max: 500 },
      majorHub: { min: 500, max: 1500 },
      megaHub: { min: 1500, max: 5000 },
    },
    emergencyLighting: {
      smallRegional: { min: 10, max: 30 },
      mediumRegional: { min: 30, max: 80 },
      largeRegional: { min: 80, max: 250 },
      majorHub: { min: 250, max: 750 },
      megaHub: { min: 750, max: 2500 },
    },
  },
  verticalTransportation: {
    passengerElevators: {
      smallRegional: { min: 30, max: 80 },
      mediumRegional: { min: 80, max: 200 },
      largeRegional: { min: 200, max: 600 },
      majorHub: { min: 600, max: 2000 },
      megaHub: { min: 2000, max: 6000 },
    },
    escalators: {
      smallRegional: { min: 30, max: 80 },
      mediumRegional: { min: 80, max: 250 },
      largeRegional: { min: 250, max: 750 },
      majorHub: { min: 750, max: 2500 },
      megaHub: { min: 2500, max: 8000 },
    },
    movingWalkways: {
      smallRegional: null,
      mediumRegional: { min: 40, max: 120 },
      largeRegional: { min: 120, max: 400 },
      majorHub: { min: 400, max: 1500 },
      megaHub: { min: 1500, max: 5000 },
    },
    automatedPeopleMovers: {
      smallRegional: null,
      mediumRegional: null,
      largeRegional: { min: 200, max: 600 },
      majorHub: { min: 600, max: 2000 },
      megaHub: { min: 2000, max: 8000 },
    },
    numberOfEscalators: {
      smallRegional: '4-15',
      mediumRegional: '15-40',
      largeRegional: '40-100',
      majorHub: '100-300',
      megaHub: '300-800+',
    },
    numberOfElevators: {
      smallRegional: '2-8',
      mediumRegional: '8-25',
      largeRegional: '25-75',
      majorHub: '75-200',
      megaHub: '200-500+',
    },
  },
} as const;

/**
 * Airport IT & Communications (kW)
 */
export const AIRPORT_IT_COMMUNICATIONS = {
  dataCenter: {
    smallRegional: { min: 30, max: 80 },
    mediumRegional: { min: 80, max: 250 },
    largeRegional: { min: 250, max: 750 },
    majorHub: { min: 750, max: 2500 },
    megaHub: { min: 2500, max: 8000 },
  },
  networkInfrastructure: {
    smallRegional: { min: 10, max: 30 },
    mediumRegional: { min: 30, max: 80 },
    largeRegional: { min: 80, max: 250 },
    majorHub: { min: 250, max: 750 },
    megaHub: { min: 750, max: 2500 },
  },
  wifiAccessPoints: {
    smallRegional: { min: 5, max: 15 },
    mediumRegional: { min: 15, max: 40 },
    largeRegional: { min: 40, max: 120 },
    majorHub: { min: 120, max: 400 },
    megaHub: { min: 400, max: 1200 },
  },
  fidsBidsDisplays: {    // Flight Info Display
    smallRegional: { min: 10, max: 30 },
    mediumRegional: { min: 30, max: 80 },
    largeRegional: { min: 80, max: 200 },
    majorHub: { min: 200, max: 600 },
    megaHub: { min: 600, max: 2000 },
  },
  publicAddress: {
    smallRegional: { min: 3, max: 8 },
    mediumRegional: { min: 8, max: 20 },
    largeRegional: { min: 20, max: 60 },
    majorHub: { min: 60, max: 180 },
    megaHub: { min: 180, max: 500 },
  },
  dasCellular: {         // Distributed Antenna System
    smallRegional: { min: 5, max: 15 },
    mediumRegional: { min: 15, max: 40 },
    largeRegional: { min: 40, max: 120 },
    majorHub: { min: 120, max: 400 },
    megaHub: { min: 400, max: 1200 },
  },
  totalItComms: {
    smallRegional: { min: 80, max: 220 },
    mediumRegional: { min: 220, max: 650 },
    largeRegional: { min: 650, max: 1800 },
    majorHub: { min: 1800, max: 5500 },
    megaHub: { min: 5500, max: 17000 },
  },
} as const;

/**
 * Airport Emergency & Backup Power (kW)
 */
export const AIRPORT_EMERGENCY_POWER = {
  generators: {
    totalCapacity: {
      smallRegional: { min: 500, max: 2000 },
      mediumRegional: { min: 2000, max: 8000 },
      largeRegional: { min: 8000, max: 25000 },
      majorHub: { min: 25000, max: 75000 },
      megaHub: { min: 75000, max: 200000 },
    },
    numberOfGenerators: {
      smallRegional: '1-3',
      mediumRegional: '3-8',
      largeRegional: '8-20',
      majorHub: '20-50',
      megaHub: '50-150+',
    },
    unitSize: {
      smallRegional: { min: 500, max: 1000 },
      mediumRegional: { min: 1000, max: 2000 },
      largeRegional: { min: 2000, max: 3000 },
      majorHub: { min: 2500, max: 3500 },
      megaHub: { min: 2500, max: 4000 },
    },
    fuelStorage: {       // gallons
      smallRegional: '5,000-20,000',
      mediumRegional: '20,000-100,000',
      largeRegional: '100,000-500,000',
      majorHub: '500,000-2M',
      megaHub: '2-10M',
    },
  },
  ups: {
    criticalSystems: {
      smallRegional: { min: 100, max: 300 },
      mediumRegional: { min: 300, max: 800 },
      largeRegional: { min: 800, max: 2500 },
      majorHub: { min: 2500, max: 8000 },
      megaHub: { min: 8000, max: 25000 },
    },
  },
  atsParallelingSwitchgear: {
    smallRegional: { min: 50, max: 150 },
    mediumRegional: { min: 150, max: 400 },
    largeRegional: { min: 400, max: 1000 },
    majorHub: { min: 1000, max: 3000 },
    megaHub: { min: 3000, max: 8000 },
  },
} as const;

/**
 * Airport BESS Integration Sizing
 */
export const AIRPORT_BESS_SIZING = {
  smallRegional: {
    recommendedMWh: { min: 0.25, max: 1 },
    recommendedMW: { min: 0.125, max: 0.5 },
    durationHours: 2,
    primaryUseCase: 'Demand charge reduction, backup power bridge',
    gridServicesCapable: false,
    roiYears: { typical: 6, range: '5-8' },
  },
  mediumRegional: {
    recommendedMWh: { min: 1, max: 5 },
    recommendedMW: { min: 0.5, max: 2.5 },
    durationHours: 2,
    primaryUseCase: 'Peak shaving, demand response, ATC backup',
    gridServicesCapable: true,
    roiYears: { typical: 5, range: '4-7' },
  },
  largeRegional: {
    recommendedMWh: { min: 5, max: 25 },
    recommendedMW: { min: 2.5, max: 12 },
    durationHours: 2,
    primaryUseCase: 'Grid services, wholesale market, critical backup',
    gridServicesCapable: true,
    roiYears: { typical: 4, range: '3-6' },
  },
  majorHub: {
    recommendedMWh: { min: 25, max: 100 },
    recommendedMW: { min: 12, max: 50 },
    durationHours: 2,
    primaryUseCase: 'Grid-scale services, microgrid, renewable integration',
    gridServicesCapable: true,
    roiYears: { typical: 4, range: '3-5' },
  },
  megaHub: {
    recommendedMWh: { min: 100, max: 500 },
    recommendedMW: { min: 50, max: 250 },
    durationHours: 2,
    primaryUseCase: 'Market participation, grid stability, net-zero targets',
    gridServicesCapable: true,
    roiYears: { typical: 3, range: '2-5' },
  },
} as const;

/**
 * Airport Grid Interconnection Requirements
 */
export const AIRPORT_GRID_REQUIREMENTS = {
  smallRegional: {
    serviceVoltage: '4.16-13.8 kV',
    interconnectionStudy: 'minimal',
    timelineMonths: '3-12',
    dedicatedFeeders: '1-2',
    onSiteSubstation: false,
    redundancy: 'N',
  },
  mediumRegional: {
    serviceVoltage: '12.47-34.5 kV',
    interconnectionStudy: 'standard',
    timelineMonths: '6-18',
    dedicatedFeeders: '2-4',
    onSiteSubstation: 'often',
    redundancy: 'N+1',
  },
  largeRegional: {
    serviceVoltage: '34.5-69 kV',
    interconnectionStudy: 'full impact study',
    timelineMonths: '12-36',
    dedicatedFeeders: '4-8',
    onSiteSubstation: true,
    redundancy: 'N+1',
  },
  majorHub: {
    serviceVoltage: '69-138 kV',
    interconnectionStudy: 'system study',
    timelineMonths: '24-48',
    dedicatedFeeders: '8-20',
    onSiteSubstation: true,
    redundancy: '2N',
  },
  megaHub: {
    serviceVoltage: '138-345 kV',
    interconnectionStudy: 'facilities study',
    timelineMonths: '36-72',
    dedicatedFeeders: '20-50+',
    onSiteSubstation: 'HV yard',
    redundancy: '2N or better',
  },
} as const;



export const AMENITY_POWER_STANDARDS = {
  // Water Features
  swimmingPool: {
    name: 'Swimming Pool',
    powerKW: 25,               // Pumps, heating, lighting peak
    description: 'Pool pumps, heating, underwater lighting'
  },
  spaHotTub: {
    name: 'Spa/Hot Tub',
    powerKW: 20,               // Heating elements, jets, pumps
    description: 'Spa heating, jet pumps, circulation'
  },
  
  // Fitness & Recreation
  fitnessCenter: {
    name: 'Fitness Center',
    powerKW: 15,               // Equipment, HVAC, lighting
    description: 'Gym equipment, enhanced HVAC, lighting'
  },
  tennisCourtLighted: {
    name: 'Lighted Tennis Court',
    powerKW: 8,                // Per court lighting
    description: 'Sports lighting per court'
  },
  
  // Food & Beverage
  restaurant: {
    name: 'Full-Service Restaurant',
    powerKW: 50,               // Kitchen equipment, HVAC, lighting
    description: 'Commercial kitchen, dining area HVAC'
  },
  barLounge: {
    name: 'Bar/Lounge',
    powerKW: 20,               // Refrigeration, lighting, audio
    description: 'Beverage coolers, ambient lighting, A/V'
  },
  banquetHall: {
    name: 'Banquet/Conference Hall',
    powerKW: 30,               // Per 5000 sq ft
    description: 'HVAC, lighting, A/V equipment'
  },
  
  // Guest Services
  laundryFacility: {
    name: 'Commercial Laundry',
    powerKW: 40,               // Industrial washers, dryers
    description: 'Commercial laundry equipment'
  },
  parkingGarage: {
    name: 'Parking Garage',
    powerKW: 5,                // Per 100 spaces
    description: 'Lighting, ventilation, gates'
  },
  
  // EV Charging (reference only - use evChargingCalculations.ts for full calcs)
  evChargingL2: {
    name: 'EV Charger (Level 2)',
    powerKW: 7.2,              // Standard 7.2 kW charger
    description: 'Guest/valet EV charging'
  }
};

/**
 * Calculate power requirement for Office Building
 * Source: ASHRAE 90.1, CBECS 2018
 * 
 * @param sqFt - Office building square footage
 * @returns Power in MW
 */
export function calculateOfficePower(sqFt: number): PowerCalculationResult {
  // Peak demand: 5-7 W/sq ft (lighting at full, HVAC at peak, computers)
  // Average consumption is ~1-1.5 W/sq ft, but BESS needs to cover peaks
  const wattsPerSqFt = POWER_DENSITY_STANDARDS.office; // 6.0 W/sq ft peak
  const powerKW = (sqFt * wattsPerSqFt) / 1000;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.03, Math.round(powerMW * 100) / 100), // Min 30kW
    durationHrs: 4, // Standard backup duration
    description: `Office: ${sqFt.toLocaleString()} sq ft × ${wattsPerSqFt} W/sqft peak = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'ASHRAE 90.1 peak demand (6 W/sq ft)',
    inputs: { sqFt, wattsPerSqFt }
  };
}

/**
 * Calculate power requirement for Hotel
 * Now uses comprehensive equipment-based calculation from BESS Sizing Questionnaire
 * 
 * For detailed calculations with amenities, use calculateHotelPowerDetailed()
 * For full equipment breakdown, use calculateHotelPowerFromEquipment()
 * 
 * @param roomCount - Number of hotel rooms
 * @param hotelClass - Optional: 'economy' | 'midscale' | 'upscale' | 'luxury' (determines facility type)
 * @returns Power in MW
 */
export function calculateHotelPower(
  roomCount: number,
  hotelClass?: string
): PowerCalculationResult {
  // ═══════════════════════════════════════════════════════════════════════════
  // HOTEL POWER CALCULATION - SSOT using validated benchmarks
  // 
  // Validated Dec 2025: Marriott Lancaster 133 rooms = 384 kW = 2.89 kW/room
  // 
  // Using HOTEL_CLASS_PROFILES peakKWPerRoom × 0.75 diversity:
  // - economy: 2.5 × 0.75 = 1.875 kW/room actual
  // - midscale: 4.0 × 0.75 = 3.0 kW/room actual ← Matches Marriott!
  // - upscale: 5.0 × 0.75 = 3.75 kW/room actual
  // - luxury: 7.0 × 0.75 = 5.25 kW/room actual
  // 
  // For unknown class, default to midscale (most common)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Determine hotel class from room count if not specified
  let effectiveClass = hotelClass?.toLowerCase() || 'midscale';
  
  if (!hotelClass) {
    // Infer class from room count
    if (roomCount <= 75) {
      effectiveClass = 'economy';
    } else if (roomCount <= 200) {
      effectiveClass = 'midscale';
    } else if (roomCount <= 400) {
      effectiveClass = 'upscale';
    } else {
      effectiveClass = 'luxury';
    }
  }
  
  // Map to standard class names
  switch (effectiveClass) {
    case 'budget':
    case 'boutique':
      effectiveClass = 'economy';
      break;
    case 'select-service':
    case 'selectservice':
      effectiveClass = 'midscale';
      break;
    case 'full-service':
    case 'fullservice':
      effectiveClass = 'upscale';
      break;
    case 'resort':
    case 'corporate':
    case 'convention':
      effectiveClass = 'luxury';
      break;
  }
  
  // Get profile (default to midscale if unknown)
  const profile = HOTEL_CLASS_PROFILES[effectiveClass as keyof typeof HOTEL_CLASS_PROFILES] 
                  || HOTEL_CLASS_PROFILES.midscale;
  
  // Calculate peak demand: rooms × peakKWPerRoom × 0.75 diversity
  const diversityFactor = 0.75;
  const peakDemandKW = roomCount * profile.peakKWPerRoom * diversityFactor;
  const powerMW = peakDemandKW / 1000;
  
  const description = `${profile.name} Hotel (${roomCount} rooms): ${Math.round(peakDemandKW)} kW peak demand`;
  
  console.log('🏨 [calculateHotelPower] SSOT calculation:', {
    roomCount,
    hotelClass: effectiveClass,
    peakKWPerRoom: profile.peakKWPerRoom,
    diversityFactor,
    peakDemandKW: Math.round(peakDemandKW),
    powerMW: Math.round(powerMW * 100) / 100,
  });
  
  return {
    powerMW: Math.max(0.05, Math.round(powerMW * 100) / 100),
    durationHrs: 4, // Standard hotel backup duration
    description,
    calculationMethod: 'SSOT: HOTEL_CLASS_PROFILES validated against Marriott benchmarks',
    inputs: { roomCount, hotelClass: effectiveClass, peakKWPerRoom: profile.peakKWPerRoom, diversityFactor },
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// HOTEL EQUIPMENT SPECIFICATIONS - SINGLE SOURCE OF TRUTH
// ════════════════════════════════════════════════════════════════════════════════
// Source: Hotel Energy Specification Sheet (BESS Sizing Questionnaire)
// Based on comprehensive equipment load analysis for hospitality sector
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Hotel Classification & Typical Power Profiles
 * Source: Hotel Energy Specification Sheet
 * 
 * UPDATED Dec 2025: Peak ranges aligned with HOTEL_CLASS_PROFILES
 * Validated against Marriott Lancaster: 133 rooms = 384 kW (2.89 kW/room)
 * 
 * Formula: rooms × peakKWPerRoom (from HOTEL_CLASS_PROFILES) × 0.75 diversity
 * - economy/smallBoutique: 2.5 kW/room → 1.875 kW/room actual
 * - midscale/mediumSelectService: 4.0 kW/room → 3.0 kW/room actual  
 * - upscale/largeFullService: 5.0 kW/room → 3.75 kW/room actual
 * - luxury/luxuryResort: 7.0 kW/room → 5.25 kW/room actual
 */
export const HOTEL_FACILITY_TYPES = {
  smallBoutique: {
    name: 'Small/Boutique',
    roomRange: { min: 20, max: 75 },
    connected: { min: 50, max: 190 },      // kW (rooms × 2.5)
    peak: { min: 38, max: 141 },           // kW (connected × 0.75)
    avgOperating: { min: 20, max: 70 },    // kW
    kWPerRoom: { min: 2.0, max: 3.0 },     // CORRECTED: Was 5-8, now 2-3
    loadFactor: { min: 0.40, max: 0.50 },
    demandDiversity: { min: 0.70, max: 0.80 }, // Higher diversity for small hotels
  },
  mediumSelectService: {
    name: 'Medium/Select-Service',
    roomRange: { min: 75, max: 150 },
    connected: { min: 300, max: 600 },     // kW (rooms × 4.0)
    peak: { min: 225, max: 450 },          // kW (connected × 0.75) - Marriott 133 rooms = 384 kW
    avgOperating: { min: 100, max: 225 },  // kW
    kWPerRoom: { min: 3.5, max: 4.5 },     // CORRECTED: Was 5-7, now 3.5-4.5
    loadFactor: { min: 0.45, max: 0.55 },
    demandDiversity: { min: 0.70, max: 0.80 },
  },
  largeFullService: {
    name: 'Large/Full-Service',
    roomRange: { min: 150, max: 400 },
    connected: { min: 750, max: 2000 },    // kW (rooms × 5.0)
    peak: { min: 563, max: 1500 },         // kW (connected × 0.75) - 300 rooms ≈ 900 kW
    avgOperating: { min: 280, max: 750 },  // kW
    kWPerRoom: { min: 4.5, max: 5.5 },     // CORRECTED: Was 5-8, now 4.5-5.5
    loadFactor: { min: 0.50, max: 0.60 },
    demandDiversity: { min: 0.70, max: 0.80 },
  },
  luxuryResort: {
    name: 'Luxury/Resort',
    roomRange: { min: 200, max: 500 },
    connected: { min: 1400, max: 3500 },   // kW (rooms × 7.0)
    peak: { min: 1050, max: 2625 },        // kW (connected × 0.75)
    avgOperating: { min: 500, max: 1300 }, // kW
    kWPerRoom: { min: 6.0, max: 8.0 },     // CORRECTED: Was 8-12, now 6-8
    loadFactor: { min: 0.50, max: 0.60 },
    demandDiversity: { min: 0.70, max: 0.80 },
  },
  corporateConvention: {
    name: 'Corporate/Convention',
    roomRange: { min: 300, max: 1000 },
    connected: { min: 2100, max: 7000 },   // kW (rooms × 7.0)
    peak: { min: 1575, max: 5250 },        // kW (connected × 0.75)
    avgOperating: { min: 800, max: 2600 }, // kW
    kWPerRoom: { min: 6.0, max: 8.0 },     // CORRECTED: Was 6-10, now 6-8
    loadFactor: { min: 0.55, max: 0.65 },
    demandDiversity: { min: 0.70, max: 0.80 },
  },
} as const;

export type HotelFacilityType = keyof typeof HOTEL_FACILITY_TYPES;

/**
 * Hotel Equipment Power Specifications by Classification
 * All values in kW (typical values used in calculations)
 */
export const HOTEL_EQUIPMENT_POWER_DB = {
  // ═══════════════════════════════════════════════════════════════════════
  // HVAC SYSTEMS - Central Plant Equipment
  // ═══════════════════════════════════════════════════════════════════════
  hvac: {
    chiller: {
      smallBoutique: { min: 50, max: 100, typical: 75 },
      mediumSelectService: { min: 150, max: 300, typical: 225 },
      largeFullService: { min: 300, max: 600, typical: 450 },
      luxuryResort: { min: 400, max: 800, typical: 600 },
      corporateConvention: { min: 500, max: 1200, typical: 850 },
    },
    coolingTowerFans: {
      smallBoutique: { min: 5, max: 15, typical: 10 },
      mediumSelectService: { min: 15, max: 40, typical: 27 },
      largeFullService: { min: 40, max: 100, typical: 70 },
      luxuryResort: { min: 75, max: 150, typical: 112 },
      corporateConvention: { min: 100, max: 250, typical: 175 },
    },
    chilledWaterPumps: {
      smallBoutique: { min: 5, max: 15, typical: 10 },
      mediumSelectService: { min: 15, max: 40, typical: 27 },
      largeFullService: { min: 40, max: 100, typical: 70 },
      luxuryResort: { min: 75, max: 150, typical: 112 },
      corporateConvention: { min: 100, max: 200, typical: 150 },
    },
    boilerElectric: {
      smallBoutique: { min: 30, max: 75, typical: 52 },
      mediumSelectService: { min: 75, max: 200, typical: 137 },
      largeFullService: { min: 150, max: 400, typical: 275 },
      luxuryResort: { min: 300, max: 600, typical: 450 },
      corporateConvention: { min: 400, max: 1000, typical: 700 },
    },
    hotWaterPumps: {
      smallBoutique: { min: 3, max: 10, typical: 6 },
      mediumSelectService: { min: 10, max: 25, typical: 17 },
      largeFullService: { min: 25, max: 60, typical: 42 },
      luxuryResort: { min: 50, max: 100, typical: 75 },
      corporateConvention: { min: 75, max: 150, typical: 112 },
    },
    ahusTotal: {
      smallBoutique: { min: 10, max: 30, typical: 20 },
      mediumSelectService: { min: 30, max: 80, typical: 55 },
      largeFullService: { min: 80, max: 200, typical: 140 },
      luxuryResort: { min: 150, max: 400, typical: 275 },
      corporateConvention: { min: 250, max: 600, typical: 425 },
    },
    ptacFanCoilsPerRoom: {
      smallBoutique: { min: 0.5, max: 1, typical: 0.75 },
      mediumSelectService: { min: 0.5, max: 1, typical: 0.75 },
      largeFullService: { min: 0.75, max: 1.5, typical: 1.1 },
      luxuryResort: { min: 1, max: 2, typical: 1.5 },
      corporateConvention: { min: 1, max: 2, typical: 1.5 },
    },
    exhaustFansTotal: {
      smallBoutique: { min: 3, max: 10, typical: 6 },
      mediumSelectService: { min: 10, max: 25, typical: 17 },
      largeFullService: { min: 25, max: 60, typical: 42 },
      luxuryResort: { min: 40, max: 100, typical: 70 },
      corporateConvention: { min: 60, max: 150, typical: 105 },
    },
    kitchenHoodExhaust: {
      smallBoutique: { min: 3, max: 7, typical: 5 },
      mediumSelectService: { min: 7, max: 15, typical: 11 },
      largeFullService: { min: 15, max: 40, typical: 27 },
      luxuryResort: { min: 30, max: 75, typical: 52 },
      corporateConvention: { min: 50, max: 120, typical: 85 },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // DOMESTIC HOT WATER
  // ═══════════════════════════════════════════════════════════════════════
  domesticHotWater: {
    waterHeatersElectric: {
      smallBoutique: { min: 30, max: 75, typical: 52 },
      mediumSelectService: { min: 75, max: 150, typical: 112 },
      largeFullService: { min: 150, max: 300, typical: 225 },
      luxuryResort: { min: 250, max: 500, typical: 375 },
      corporateConvention: { min: 400, max: 800, typical: 600 },
    },
    recirculationPumps: {
      smallBoutique: { min: 1, max: 3, typical: 2 },
      mediumSelectService: { min: 3, max: 7, typical: 5 },
      largeFullService: { min: 7, max: 15, typical: 11 },
      luxuryResort: { min: 10, max: 25, typical: 17 },
      corporateConvention: { min: 15, max: 40, typical: 27 },
    },
    boosterHeaters: {
      smallBoutique: { min: 10, max: 25, typical: 17 },
      mediumSelectService: { min: 25, max: 50, typical: 37 },
      largeFullService: { min: 50, max: 100, typical: 75 },
      luxuryResort: { min: 75, max: 150, typical: 112 },
      corporateConvention: { min: 100, max: 200, typical: 150 },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // LIGHTING SYSTEMS
  // ═══════════════════════════════════════════════════════════════════════
  lighting: {
    guestRoomsPerRoom: {
      budgetSelect: { min: 0.3, max: 0.5, typical: 0.4 },
      standard: { min: 0.4, max: 0.6, typical: 0.5 },
      upscale: { min: 0.5, max: 0.8, typical: 0.65 },
      luxury: { min: 0.8, max: 1.5, typical: 1.1 },
    },
    lobbyPublicAreas: {
      smallBoutique: { min: 5, max: 15, typical: 10 },
      mediumSelectService: { min: 15, max: 40, typical: 27 },
      largeFullService: { min: 40, max: 100, typical: 70 },
      luxuryResort: { min: 75, max: 200, typical: 137 },
      corporateConvention: { min: 100, max: 300, typical: 200 },
    },
    corridorsCirculation: {
      smallBoutique: { min: 3, max: 8, typical: 5 },
      mediumSelectService: { min: 8, max: 20, typical: 14 },
      largeFullService: { min: 20, max: 50, typical: 35 },
      luxuryResort: { min: 40, max: 100, typical: 70 },
      corporateConvention: { min: 60, max: 150, typical: 105 },
    },
    parkingPerLevel: {
      smallBoutique: { min: 3, max: 8, typical: 5 },
      mediumSelectService: { min: 5, max: 12, typical: 8 },
      largeFullService: { min: 8, max: 20, typical: 14 },
      luxuryResort: { min: 10, max: 25, typical: 17 },
      corporateConvention: { min: 15, max: 40, typical: 27 },
    },
    exteriorLandscape: {
      smallBoutique: { min: 3, max: 10, typical: 6 },
      mediumSelectService: { min: 10, max: 25, typical: 17 },
      largeFullService: { min: 25, max: 60, typical: 42 },
      luxuryResort: { min: 50, max: 150, typical: 100 },
      corporateConvention: { min: 75, max: 200, typical: 137 },
    },
    ballroomEventSpace: {
      smallBoutique: { min: 0, max: 0, typical: 0 },
      mediumSelectService: { min: 10, max: 30, typical: 20 },
      largeFullService: { min: 30, max: 80, typical: 55 },
      luxuryResort: { min: 60, max: 150, typical: 105 },
      corporateConvention: { min: 100, max: 400, typical: 250 },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // FOOD SERVICE / KITCHEN
  // ═══════════════════════════════════════════════════════════════════════
  foodService: {
    walkInCooler: {
      smallBoutique: { min: 2, max: 5, typical: 3 },
      mediumSelectService: { min: 5, max: 10, typical: 7 },
      largeFullService: { min: 10, max: 20, typical: 15 },
      luxuryResort: { min: 15, max: 30, typical: 22 },
      corporateConvention: { min: 25, max: 50, typical: 37 },
    },
    walkInFreezer: {
      smallBoutique: { min: 3, max: 7, typical: 5 },
      mediumSelectService: { min: 7, max: 15, typical: 11 },
      largeFullService: { min: 15, max: 30, typical: 22 },
      luxuryResort: { min: 25, max: 50, typical: 37 },
      corporateConvention: { min: 40, max: 80, typical: 60 },
    },
    commercialOvens: {
      smallBoutique: { min: 10, max: 25, typical: 17 },
      mediumSelectService: { min: 25, max: 60, typical: 42 },
      largeFullService: { min: 60, max: 150, typical: 105 },
      luxuryResort: { min: 100, max: 250, typical: 175 },
      corporateConvention: { min: 150, max: 400, typical: 275 },
    },
    rangesCooktops: {
      smallBoutique: { min: 10, max: 20, typical: 15 },
      mediumSelectService: { min: 20, max: 50, typical: 35 },
      largeFullService: { min: 50, max: 120, typical: 85 },
      luxuryResort: { min: 80, max: 200, typical: 140 },
      corporateConvention: { min: 120, max: 300, typical: 210 },
    },
    fryers: {
      smallBoutique: { min: 10, max: 20, typical: 15 },
      mediumSelectService: { min: 20, max: 40, typical: 30 },
      largeFullService: { min: 40, max: 80, typical: 60 },
      luxuryResort: { min: 60, max: 120, typical: 90 },
      corporateConvention: { min: 80, max: 200, typical: 140 },
    },
    dishwashers: {
      smallBoutique: { min: 10, max: 20, typical: 15 },
      mediumSelectService: { min: 20, max: 40, typical: 30 },
      largeFullService: { min: 40, max: 80, typical: 60 },
      luxuryResort: { min: 60, max: 120, typical: 90 },
      corporateConvention: { min: 80, max: 150, typical: 115 },
    },
    iceMachines: {
      smallBoutique: { min: 2, max: 5, typical: 3 },
      mediumSelectService: { min: 5, max: 12, typical: 8 },
      largeFullService: { min: 12, max: 25, typical: 18 },
      luxuryResort: { min: 20, max: 40, typical: 30 },
      corporateConvention: { min: 30, max: 60, typical: 45 },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // LAUNDRY OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════
  laundry: {
    commercialWashers: {
      smallBoutique: { min: 5, max: 15, typical: 10 },
      mediumSelectService: { min: 15, max: 40, typical: 27 },
      largeFullService: { min: 40, max: 100, typical: 70 },
      luxuryResort: { min: 75, max: 150, typical: 112 },
      corporateConvention: { min: 100, max: 250, typical: 175 },
    },
    commercialDryers: {
      smallBoutique: { min: 15, max: 40, typical: 27 },
      mediumSelectService: { min: 40, max: 100, typical: 70 },
      largeFullService: { min: 100, max: 250, typical: 175 },
      luxuryResort: { min: 200, max: 400, typical: 300 },
      corporateConvention: { min: 300, max: 600, typical: 450 },
    },
    ironersPressers: {
      smallBoutique: { min: 5, max: 15, typical: 10 },
      mediumSelectService: { min: 15, max: 40, typical: 27 },
      largeFullService: { min: 40, max: 100, typical: 70 },
      luxuryResort: { min: 75, max: 150, typical: 112 },
      corporateConvention: { min: 100, max: 200, typical: 150 },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // VERTICAL TRANSPORTATION
  // ═══════════════════════════════════════════════════════════════════════
  elevators: {
    passengerPerCar: {
      smallBoutique: { min: 15, max: 30, typical: 22 },
      mediumSelectService: { min: 20, max: 40, typical: 30 },
      largeFullService: { min: 25, max: 50, typical: 37 },
      luxuryResort: { min: 30, max: 60, typical: 45 },
      corporateConvention: { min: 35, max: 75, typical: 55 },
    },
    serviceElevator: {
      smallBoutique: { min: 20, max: 40, typical: 30 },
      mediumSelectService: { min: 25, max: 50, typical: 37 },
      largeFullService: { min: 30, max: 60, typical: 45 },
      luxuryResort: { min: 40, max: 80, typical: 60 },
      corporateConvention: { min: 50, max: 100, typical: 75 },
    },
    escalatorPerUnit: { min: 5, max: 10, typical: 7 },
    typicalElevatorCount: {
      smallBoutique: { min: 1, max: 2 },
      mediumSelectService: { min: 2, max: 4 },
      largeFullService: { min: 4, max: 8 },
      luxuryResort: { min: 6, max: 12 },
      corporateConvention: { min: 8, max: 20 },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // POOL & SPA
  // ═══════════════════════════════════════════════════════════════════════
  poolSpa: {
    poolCirculationPumps: {
      smallBoutique: { min: 3, max: 7, typical: 5 },
      mediumSelectService: { min: 5, max: 15, typical: 10 },
      largeFullService: { min: 10, max: 25, typical: 17 },
      luxuryResort: { min: 20, max: 50, typical: 35 },
      corporateConvention: { min: 30, max: 75, typical: 52 },
    },
    poolHeaterElectric: {
      smallBoutique: { min: 30, max: 75, typical: 52 },
      mediumSelectService: { min: 50, max: 120, typical: 85 },
      largeFullService: { min: 100, max: 250, typical: 175 },
      luxuryResort: { min: 150, max: 400, typical: 275 },
      corporateConvention: { min: 200, max: 500, typical: 350 },
    },
    spaHotTubHeater: {
      smallBoutique: { min: 10, max: 25, typical: 17 },
      mediumSelectService: { min: 15, max: 40, typical: 27 },
      largeFullService: { min: 25, max: 60, typical: 42 },
      luxuryResort: { min: 40, max: 100, typical: 70 },
      corporateConvention: { min: 50, max: 150, typical: 100 },
    },
    saunaSteamRoom: {
      smallBoutique: { min: 0, max: 0, typical: 0 },
      mediumSelectService: { min: 10, max: 25, typical: 17 },
      largeFullService: { min: 20, max: 50, typical: 35 },
      luxuryResort: { min: 40, max: 100, typical: 70 },
      corporateConvention: { min: 60, max: 150, typical: 105 },
    },
    poolDehumidification: {
      smallBoutique: { min: 5, max: 15, typical: 10 },
      mediumSelectService: { min: 10, max: 30, typical: 20 },
      largeFullService: { min: 25, max: 75, typical: 50 },
      luxuryResort: { min: 50, max: 150, typical: 100 },
      corporateConvention: { min: 75, max: 200, typical: 137 },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // FITNESS CENTER
  // ═══════════════════════════════════════════════════════════════════════
  fitnessCenter: {
    treadmillPerUnit: { min: 1.5, max: 2.5, typical: 2 },
    ellipticalBikePerUnit: { min: 0.3, max: 0.5, typical: 0.4 },
    hvacForFitness: {
      smallBoutique: { min: 3, max: 7, typical: 5 },
      mediumSelectService: { min: 7, max: 15, typical: 11 },
      largeFullService: { min: 15, max: 30, typical: 22 },
      luxuryResort: { min: 25, max: 60, typical: 42 },
      corporateConvention: { min: 40, max: 100, typical: 70 },
    },
    totalFitnessCenter: {
      smallBoutique: { min: 5, max: 15, typical: 10 },
      mediumSelectService: { min: 15, max: 35, typical: 25 },
      largeFullService: { min: 35, max: 75, typical: 55 },
      luxuryResort: { min: 60, max: 150, typical: 105 },
      corporateConvention: { min: 100, max: 250, typical: 175 },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // IT & BUSINESS SYSTEMS
  // ═══════════════════════════════════════════════════════════════════════
  itSystems: {
    serverRoomMdf: {
      smallBoutique: { min: 3, max: 10, typical: 6 },
      mediumSelectService: { min: 10, max: 25, typical: 17 },
      largeFullService: { min: 25, max: 60, typical: 42 },
      luxuryResort: { min: 40, max: 100, typical: 70 },
      corporateConvention: { min: 75, max: 200, typical: 137 },
    },
    posSystemsTotal: {
      smallBoutique: { min: 1, max: 3, typical: 2 },
      mediumSelectService: { min: 3, max: 7, typical: 5 },
      largeFullService: { min: 7, max: 15, typical: 11 },
      luxuryResort: { min: 10, max: 25, typical: 17 },
      corporateConvention: { min: 15, max: 40, typical: 27 },
    },
    wifiInfrastructure: {
      smallBoutique: { min: 1, max: 3, typical: 2 },
      mediumSelectService: { min: 3, max: 7, typical: 5 },
      largeFullService: { min: 7, max: 15, typical: 11 },
      luxuryResort: { min: 10, max: 25, typical: 17 },
      corporateConvention: { min: 20, max: 50, typical: 35 },
    },
    businessCenter: {
      smallBoutique: { min: 2, max: 5, typical: 3 },
      mediumSelectService: { min: 5, max: 10, typical: 7 },
      largeFullService: { min: 10, max: 20, typical: 15 },
      luxuryResort: { min: 15, max: 30, typical: 22 },
      corporateConvention: { min: 25, max: 60, typical: 42 },
    },
    conferenceAvPerRoom: {
      smallBoutique: { min: 0, max: 0, typical: 0 },
      mediumSelectService: { min: 3, max: 7, typical: 5 },
      largeFullService: { min: 5, max: 15, typical: 10 },
      luxuryResort: { min: 10, max: 25, typical: 17 },
      corporateConvention: { min: 15, max: 50, typical: 32 },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // GUEST ROOM LOADS (PER ROOM)
  // ═══════════════════════════════════════════════════════════════════════
  guestRoomLoads: {
    budgetSelect: {
      hvac: { min: 0.5, max: 1, typical: 0.75 },
      lighting: { min: 0.3, max: 0.5, typical: 0.4 },
      tvEntertainment: { min: 0.1, max: 0.2, typical: 0.15 },
      minibarFridge: { min: 0.1, max: 0.15, typical: 0.12 },
      miscHairDryerIron: { min: 0.5, max: 1.5, typical: 1 },
      totalPerRoom: { min: 1.5, max: 3.5, typical: 2.5 },
    },
    standard: {
      hvac: { min: 0.75, max: 1.5, typical: 1.1 },
      lighting: { min: 0.4, max: 0.6, typical: 0.5 },
      tvEntertainment: { min: 0.15, max: 0.3, typical: 0.22 },
      minibarFridge: { min: 0.1, max: 0.15, typical: 0.12 },
      miscHairDryerIron: { min: 0.5, max: 1.5, typical: 1 },
      totalPerRoom: { min: 2, max: 4, typical: 3 },
    },
    upscale: {
      hvac: { min: 1, max: 2, typical: 1.5 },
      lighting: { min: 0.5, max: 0.8, typical: 0.65 },
      tvEntertainment: { min: 0.2, max: 0.4, typical: 0.3 },
      minibarFridge: { min: 0.15, max: 0.25, typical: 0.2 },
      miscHairDryerIron: { min: 1, max: 2, typical: 1.5 },
      totalPerRoom: { min: 3, max: 5.5, typical: 4.25 },
    },
    luxury: {
      hvac: { min: 1.5, max: 3, typical: 2.25 },
      lighting: { min: 0.8, max: 1.5, typical: 1.1 },
      tvEntertainment: { min: 0.3, max: 0.6, typical: 0.45 },
      minibarFridge: { min: 0.2, max: 0.4, typical: 0.3 },
      miscHairDryerIron: { min: 1.5, max: 3, typical: 2.25 },
      totalPerRoom: { min: 4.5, max: 8.5, typical: 6.5 },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // MISCELLANEOUS SYSTEMS
  // ═══════════════════════════════════════════════════════════════════════
  miscSystems: {
    fireLifeSafety: {
      smallBoutique: { min: 2, max: 5, typical: 3 },
      mediumSelectService: { min: 5, max: 12, typical: 8 },
      largeFullService: { min: 12, max: 25, typical: 18 },
      luxuryResort: { min: 20, max: 50, typical: 35 },
      corporateConvention: { min: 40, max: 100, typical: 70 },
    },
    securitySystems: {
      smallBoutique: { min: 2, max: 5, typical: 3 },
      mediumSelectService: { min: 5, max: 12, typical: 8 },
      largeFullService: { min: 12, max: 30, typical: 21 },
      luxuryResort: { min: 25, max: 60, typical: 42 },
      corporateConvention: { min: 50, max: 120, typical: 85 },
    },
    buildingAutomation: {
      smallBoutique: { min: 1, max: 3, typical: 2 },
      mediumSelectService: { min: 3, max: 7, typical: 5 },
      largeFullService: { min: 7, max: 15, typical: 11 },
      luxuryResort: { min: 12, max: 30, typical: 21 },
      corporateConvention: { min: 25, max: 60, typical: 42 },
    },
    sumpSewagePumps: {
      smallBoutique: { min: 2, max: 5, typical: 3 },
      mediumSelectService: { min: 5, max: 12, typical: 8 },
      largeFullService: { min: 10, max: 25, typical: 17 },
      luxuryResort: { min: 20, max: 50, typical: 35 },
      corporateConvention: { min: 30, max: 75, typical: 52 },
    },
    domesticWaterBooster: {
      smallBoutique: { min: 3, max: 7, typical: 5 },
      mediumSelectService: { min: 7, max: 20, typical: 13 },
      largeFullService: { min: 20, max: 50, typical: 35 },
      luxuryResort: { min: 40, max: 100, typical: 70 },
      corporateConvention: { min: 75, max: 150, typical: 112 },
    },
  },
} as const;

/**
 * Default amenity selections by hotel facility type
 */
export const HOTEL_AMENITY_DEFAULTS = {
  smallBoutique: {
    hasPool: false,
    hasRestaurant: false,  // Typically breakfast only
    hasSpa: false,
    hasFitnessCenter: true,
    hasLaundry: false,     // Often outsourced
    hasConference: false,
    parkingLevels: 0,
    numElevators: 1,
  },
  mediumSelectService: {
    hasPool: true,         // Indoor pool common
    hasRestaurant: true,   // Breakfast + limited menu
    hasSpa: false,
    hasFitnessCenter: true,
    hasLaundry: true,
    hasConference: true,   // Small meeting rooms
    parkingLevels: 1,
    numElevators: 2,
  },
  largeFullService: {
    hasPool: true,
    hasRestaurant: true,
    hasSpa: true,
    hasFitnessCenter: true,
    hasLaundry: true,
    hasConference: true,
    parkingLevels: 2,
    numElevators: 4,
  },
  luxuryResort: {
    hasPool: true,         // Multiple pools
    hasRestaurant: true,   // Multiple restaurants
    hasSpa: true,          // Full spa
    hasFitnessCenter: true,
    hasLaundry: true,
    hasConference: true,
    parkingLevels: 2,
    numElevators: 8,
  },
  corporateConvention: {
    hasPool: true,
    hasRestaurant: true,
    hasSpa: true,
    hasFitnessCenter: true,
    hasLaundry: true,
    hasConference: true,   // Major conference facility
    parkingLevels: 3,
    numElevators: 12,
  },
} as const;

export interface HotelEquipmentInput {
  roomCount: number;
  facilityType: HotelFacilityType;
  amenities?: {
    hasPool?: boolean;
    hasRestaurant?: boolean;
    hasSpa?: boolean;
    hasFitnessCenter?: boolean;
    hasLaundry?: boolean;
    hasConference?: boolean;
    parkingLevels?: number;
    numElevators?: number;
    numConferenceRooms?: number;
  };
}

/**
 * Calculate hotel power using REAL equipment specs from BESS Sizing Questionnaire
 * This is the SSOT calculation based on actual hotel equipment specifications
 */
export function calculateHotelPowerFromEquipment(input: HotelEquipmentInput): PowerCalculationResult {
  const { roomCount, facilityType, amenities } = input;
  const facility = HOTEL_FACILITY_TYPES[facilityType];
  const equipPower = HOTEL_EQUIPMENT_POWER_DB;
  const defaultAmenities = HOTEL_AMENITY_DEFAULTS[facilityType];
  
  // Merge provided amenities with defaults
  const amen = {
    hasPool: amenities?.hasPool ?? defaultAmenities.hasPool,
    hasRestaurant: amenities?.hasRestaurant ?? defaultAmenities.hasRestaurant,
    hasSpa: amenities?.hasSpa ?? defaultAmenities.hasSpa,
    hasFitnessCenter: amenities?.hasFitnessCenter ?? defaultAmenities.hasFitnessCenter,
    hasLaundry: amenities?.hasLaundry ?? defaultAmenities.hasLaundry,
    hasConference: amenities?.hasConference ?? defaultAmenities.hasConference,
    parkingLevels: amenities?.parkingLevels ?? defaultAmenities.parkingLevels,
    numElevators: amenities?.numElevators ?? defaultAmenities.numElevators,
    numConferenceRooms: amenities?.numConferenceRooms ?? 2,
  };
  
  const breakdown: Record<string, number> = {};
  
  // Determine room class based on facility type
  const roomClass = facilityType === 'luxuryResort' ? 'luxury' :
                    facilityType === 'largeFullService' ? 'upscale' :
                    facilityType === 'mediumSelectService' ? 'standard' : 'budgetSelect';
  
  // ═══════════════════════════════════════════════════════════════════════
  // GUEST ROOM LOADS
  // ═══════════════════════════════════════════════════════════════════════
  const roomLoads = equipPower.guestRoomLoads[roomClass];
  breakdown['guestRooms'] = roomCount * roomLoads.totalPerRoom.typical;
  
  // ═══════════════════════════════════════════════════════════════════════
  // HVAC CENTRAL PLANT
  // ═══════════════════════════════════════════════════════════════════════
  const hvac = equipPower.hvac;
  breakdown['hvacCentralPlant'] = 
    hvac.chiller[facilityType].typical +
    hvac.coolingTowerFans[facilityType].typical +
    hvac.chilledWaterPumps[facilityType].typical +
    hvac.boilerElectric[facilityType].typical +
    hvac.hotWaterPumps[facilityType].typical +
    hvac.ahusTotal[facilityType].typical +
    hvac.exhaustFansTotal[facilityType].typical;
  
  // Kitchen exhaust (if restaurant)
  if (amen.hasRestaurant) {
    breakdown['hvacCentralPlant'] += hvac.kitchenHoodExhaust[facilityType].typical;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // DOMESTIC HOT WATER
  // ═══════════════════════════════════════════════════════════════════════
  const dhw = equipPower.domesticHotWater;
  breakdown['domesticHotWater'] = 
    dhw.waterHeatersElectric[facilityType].typical +
    dhw.recirculationPumps[facilityType].typical +
    dhw.boosterHeaters[facilityType].typical;
  
  // ═══════════════════════════════════════════════════════════════════════
  // LIGHTING
  // ═══════════════════════════════════════════════════════════════════════
  const lighting = equipPower.lighting;
  breakdown['lighting'] = 
    lighting.lobbyPublicAreas[facilityType].typical +
    lighting.corridorsCirculation[facilityType].typical +
    lighting.exteriorLandscape[facilityType].typical;
  
  if (amen.parkingLevels > 0) {
    breakdown['lighting'] += lighting.parkingPerLevel[facilityType].typical * amen.parkingLevels;
  }
  if (amen.hasConference) {
    breakdown['lighting'] += lighting.ballroomEventSpace[facilityType].typical;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // FOOD SERVICE (if restaurant)
  // ═══════════════════════════════════════════════════════════════════════
  if (amen.hasRestaurant) {
    const food = equipPower.foodService;
    breakdown['foodService'] = 
      food.walkInCooler[facilityType].typical +
      food.walkInFreezer[facilityType].typical +
      food.commercialOvens[facilityType].typical +
      food.rangesCooktops[facilityType].typical +
      food.fryers[facilityType].typical +
      food.dishwashers[facilityType].typical +
      food.iceMachines[facilityType].typical;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // LAUNDRY (if on-site)
  // ═══════════════════════════════════════════════════════════════════════
  if (amen.hasLaundry) {
    const laundry = equipPower.laundry;
    breakdown['laundry'] = 
      laundry.commercialWashers[facilityType].typical +
      laundry.commercialDryers[facilityType].typical +
      laundry.ironersPressers[facilityType].typical;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ELEVATORS
  // ═══════════════════════════════════════════════════════════════════════
  const elev = equipPower.elevators;
  breakdown['elevators'] = 
    elev.passengerPerCar[facilityType].typical * amen.numElevators +
    elev.serviceElevator[facilityType].typical;
  
  // ═══════════════════════════════════════════════════════════════════════
  // POOL & SPA (if applicable)
  // ═══════════════════════════════════════════════════════════════════════
  if (amen.hasPool) {
    const pool = equipPower.poolSpa;
    breakdown['poolSpa'] = 
      pool.poolCirculationPumps[facilityType].typical +
      pool.poolHeaterElectric[facilityType].typical +
      pool.poolDehumidification[facilityType].typical;
    
    if (amen.hasSpa) {
      breakdown['poolSpa'] += 
        pool.spaHotTubHeater[facilityType].typical +
        pool.saunaSteamRoom[facilityType].typical;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // FITNESS CENTER
  // ═══════════════════════════════════════════════════════════════════════
  if (amen.hasFitnessCenter) {
    breakdown['fitnessCenter'] = equipPower.fitnessCenter.totalFitnessCenter[facilityType].typical;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // IT & BUSINESS SYSTEMS
  // ═══════════════════════════════════════════════════════════════════════
  const it = equipPower.itSystems;
  breakdown['itSystems'] = 
    it.serverRoomMdf[facilityType].typical +
    it.posSystemsTotal[facilityType].typical +
    it.wifiInfrastructure[facilityType].typical +
    it.businessCenter[facilityType].typical;
  
  if (amen.hasConference) {
    breakdown['itSystems'] += it.conferenceAvPerRoom[facilityType].typical * amen.numConferenceRooms;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // MISCELLANEOUS SYSTEMS
  // ═══════════════════════════════════════════════════════════════════════
  const misc = equipPower.miscSystems;
  breakdown['miscSystems'] = 
    misc.fireLifeSafety[facilityType].typical +
    misc.securitySystems[facilityType].typical +
    misc.buildingAutomation[facilityType].typical +
    misc.sumpSewagePumps[facilityType].typical +
    misc.domesticWaterBooster[facilityType].typical;
  
  // ═══════════════════════════════════════════════════════════════════════
  // TOTAL CONNECTED LOAD
  // ═══════════════════════════════════════════════════════════════════════
  const totalConnectedKW = Object.values(breakdown).reduce((sum, kw) => sum + (kw || 0), 0);
  
  // Apply demand diversity factor (not all equipment runs at peak simultaneously)
  const diversityFactor = (facility.demandDiversity.min + facility.demandDiversity.max) / 2;
  const peakDemandKW = Math.round(totalConnectedKW * diversityFactor);
  
  // Validate against facility type benchmarks
  const facilityPeak = facility.peak;
  const validatedPeakKW = Math.max(facilityPeak.min, Math.min(facilityPeak.max, peakDemandKW));
  
  const powerMW = validatedPeakKW / 1000;
  
  // Build description with top power consumers
  const sortedBreakdown = Object.entries(breakdown)
    .filter(([_, kw]) => kw > 20)
    .sort((a, b) => b[1] - a[1]);
  
  const topConsumers = sortedBreakdown.slice(0, 3).map(([name, kw]) => `${name}: ${kw.toFixed(0)}kW`).join(', ');
  
  const description = `${facility.name} Hotel (${roomCount} rooms): ${topConsumers} → ${validatedPeakKW} kW peak`;
  
  console.log('🏨 [calculateHotelPowerFromEquipment] Detailed breakdown:', {
    facilityType,
    roomCount,
    facilityName: facility.name,
    breakdown,
    totalConnectedKW,
    diversityFactor,
    peakDemandKW,
    validatedPeakKW,
    facilityBenchmark: facilityPeak,
  });
  
  return {
    powerMW: Math.max(0.05, Math.round(powerMW * 100) / 100),
    durationHrs: 4, // Standard hotel backup duration
    description,
    calculationMethod: 'BESS Sizing Questionnaire hotel equipment specs',
    inputs: { roomCount, facilityType, amenities: amen, breakdown, totalConnectedKW, peakDemandKW: validatedPeakKW },
  };
}

// ============================================
// HOTEL CLASS PROFILES - Energy and Peak Demand
// Source: CBECS 2018, ASHRAE 90.1, Marriott energy benchmarks
// 
// IMPORTANT: peakKWPerRoom is CONNECTED LOAD (before diversity)
// Peak demand = rooms × peakKWPerRoom × 0.75 (diversity factor)
// DO NOT multiply by occupancy - that applies to energy (kWh) only
// 
// Validated Dec 2025: Marriott Lancaster 133 rooms = 384 kW peak
// → 2.89 kW/room actual = 3.85 kW/room connected (÷ 0.75 diversity)
// ============================================
export const HOTEL_CLASS_PROFILES = {
  economy: { kWhPerRoom: 25, peakKWPerRoom: 2.5, name: 'Economy/Budget', hvacTons: 0.5 },
  midscale: { kWhPerRoom: 35, peakKWPerRoom: 4.0, name: 'Midscale', hvacTons: 0.75 },
  upscale: { kWhPerRoom: 50, peakKWPerRoom: 5.0, name: 'Upscale', hvacTons: 1.0 },
  luxury: { kWhPerRoom: 75, peakKWPerRoom: 7.0, name: 'Luxury/Resort', hvacTons: 1.5 },
} as const;

export type HotelClass = keyof typeof HOTEL_CLASS_PROFILES;

// ============================================
// LEGACY HOTEL AMENITY SPECIFICATIONS - Keep for backward compatibility
// Source: ASHRAE HVAC Applications Handbook, hospitality audits
// ============================================
export const HOTEL_AMENITY_SPECS = {
  pool: { name: 'Pool & Hot Tub', peakKW: 50, dailyKWh: 300 },
  restaurant: { name: 'Restaurant/Kitchen', peakKW: 75, dailyKWh: 400 },
  spa: { name: 'Spa/Sauna/Steam', peakKW: 40, dailyKWh: 200 },
  fitnessCenter: { name: 'Fitness Center', peakKW: 15, dailyKWh: 100 },
  evCharging: { name: 'EV Charging', peakKW: 60, dailyKWh: 200 }, // Default, overridden by config
  laundry: { name: 'On-Site Laundry', peakKW: 40, dailyKWh: 250 },
  conferenceCenter: { name: 'Conference/Meeting Rooms', peakKW: 30, dailyKWh: 150 },
} as const;

export type HotelAmenity = keyof typeof HOTEL_AMENITY_SPECS;

// ============================================
// BUILDING AGE EFFICIENCY FACTORS
// Older buildings typically have higher energy consumption
// ============================================
export const BUILDING_AGE_FACTORS = {
  new: 0.85,      // Built in last 5 years, efficient systems
  modern: 1.0,    // 5-15 years old, baseline
  older: 1.15,    // 15-30 years old, some efficiency loss
  historic: 1.3,  // 30+ years, significant efficiency loss
} as const;

export type BuildingAge = keyof typeof BUILDING_AGE_FACTORS;

// ============================================
// SEASONALITY FACTORS - Annual energy swing by hotel type
// ============================================
export const SEASONALITY_FACTORS = {
  low: 0.05,      // ±5% swing (airport hotels, highway motels)
  moderate: 0.15, // ±15% swing (business hotels)
  high: 0.30,     // ±30% swing (beach resorts, ski lodges)
} as const;

export type Seasonality = keyof typeof SEASONALITY_FACTORS;

/**
 * Detailed Hotel Power Calculation Input
 * Used by HotelWizard for comprehensive power analysis
 */
export interface HotelPowerInput {
  rooms: number;
  hotelClass: HotelClass;
  buildingAge: BuildingAge;
  avgOccupancy: number; // 0-100 percent
  amenities: Partial<Record<HotelAmenity, boolean>>;
  evChargingConfig?: {
    numLevel1Ports: number;
    numLevel2Ports: number;
    level2Power: number; // kW per port (typically 7.2 or 11)
    numDCFCPorts: number;
    dcfcPower: number; // kW per port (typically 50-150)
  };
  operations: {
    seasonality: Seasonality;
    peakHoursStart: number; // Hour of day (0-23)
    peakHoursEnd: number;
  };
  electricityRate?: number; // $/kWh for savings calculations
  demandCharge?: number; // $/kW for demand charge calculations
}

/**
 * Detailed Hotel Power Calculation Result
 * Includes seasonality, arbitrage, and financial metrics
 */
export interface HotelPowerResult extends PowerCalculationResult {
  // Power breakdown
  basePeakKW: number;
  amenityPeakKW: number;
  totalPeakKW: number;
  
  // Energy metrics
  dailyKWh: number;
  monthlyKWh: number;
  
  // Financial (if rates provided)
  monthlyDemandCharges: number;
  monthlyEnergyCharges: number;
  totalMonthlyCharges: number;
  
  // Seasonality
  seasonalMultiplier: number;
  peakSeasonMonthlyKWh: number;
  offSeasonMonthlyKWh: number;
  
  // Peak hours arbitrage
  peakHoursDuration: number;
  peakEnergyKWh: number;
  offPeakEnergyKWh: number;
  arbitrageSavingsPotential: number; // Monthly $ if rates provided
}

/**
 * DETAILED HOTEL POWER CALCULATION
 * Migrated from HotelWizard.tsx for SSOT compliance
 * 
 * This function provides comprehensive hotel power analysis including:
 * - Room-based load by hotel class
 * - Building age efficiency factors
 * - Amenity loads (pool, restaurant, spa, etc.)
 * - EV charging with configurable ports
 * - Seasonality impact
 * - Peak hours arbitrage potential
 * 
 * @param input - Detailed hotel configuration
 * @returns Comprehensive power calculation with financial metrics
 */
export function calculateHotelPowerDetailed(input: HotelPowerInput): HotelPowerResult {
  const classProfile = HOTEL_CLASS_PROFILES[input.hotelClass];
  const ageFactor = BUILDING_AGE_FACTORS[input.buildingAge];
  const occupancyFactor = input.avgOccupancy / 100;
  
  // ════════════════════════════════════════════════════════════════
  // BASE LOAD FROM ROOMS
  // ════════════════════════════════════════════════════════════════
  // IMPORTANT: Peak demand (kW) is NOT reduced by occupancy!
  // HVAC and common areas are sized for 100% capacity
  // Only ENERGY consumption (kWh) is affected by occupancy
  // ════════════════════════════════════════════════════════════════
  let basePeakKW = input.rooms * classProfile.peakKWPerRoom; // NO occupancy factor for peak!
  let dailyKWh = input.rooms * classProfile.kWhPerRoom * occupancyFactor; // Occupancy affects energy
  
  // Apply building age efficiency factor
  basePeakKW *= ageFactor;
  dailyKWh *= ageFactor;
  
  // ════════════════════════════════════════════════════════════════
  // AMENITY LOADS
  // ════════════════════════════════════════════════════════════════
  let amenityPeakKW = 0;
  
  Object.entries(input.amenities).forEach(([key, enabled]) => {
    if (enabled && key !== 'evCharging') {
      const spec = HOTEL_AMENITY_SPECS[key as HotelAmenity];
      if (spec) {
        amenityPeakKW += spec.peakKW;
        dailyKWh += spec.dailyKWh;
      }
    }
  });
  
  // ════════════════════════════════════════════════════════════════
  // EV CHARGING - Dynamic configuration
  // ════════════════════════════════════════════════════════════════
  if (input.amenities.evCharging && input.evChargingConfig) {
    const config = input.evChargingConfig;
    const level1kW = 1.4; // Standard Level 1
    
    const evPeakKW = 
      (config.numLevel1Ports * level1kW) +
      (config.numLevel2Ports * config.level2Power) + 
      (config.numDCFCPorts * config.dcfcPower);
    
    // Daily usage assumptions:
    // L1: 8 hours/day (overnight charging)
    // L2: 4 hours/day (guest charging)
    // DCFC: 2 hours/day (quick top-ups)
    const evDailyKWh = 
      (config.numLevel1Ports * level1kW * 8) +
      (config.numLevel2Ports * config.level2Power * 4) + 
      (config.numDCFCPorts * config.dcfcPower * 2);
    
    amenityPeakKW += evPeakKW;
    dailyKWh += evDailyKWh;
  } else if (input.amenities.evCharging) {
    // Use default amenity spec if no detailed config
    amenityPeakKW += HOTEL_AMENITY_SPECS.evCharging.peakKW;
    dailyKWh += HOTEL_AMENITY_SPECS.evCharging.dailyKWh;
  }
  
  // ════════════════════════════════════════════════════════════════
  // SEASONALITY IMPACT
  // ════════════════════════════════════════════════════════════════
  const seasonalSwing = SEASONALITY_FACTORS[input.operations.seasonality];
  const seasonalMultiplier = 1 + seasonalSwing;
  
  // Weighted annual average:
  // Peak season: 4 months, Shoulder: 4 months, Off season: 4 months
  const peakSeasonDailyKWh = dailyKWh * (1 + seasonalSwing);
  const offSeasonDailyKWh = dailyKWh * (1 - seasonalSwing);
  const weightedDailyKWh = (peakSeasonDailyKWh * 4 + dailyKWh * 4 + offSeasonDailyKWh * 4) / 12;
  
  // ════════════════════════════════════════════════════════════════
  // TOTAL PEAK WITH DIVERSITY FACTOR
  // Not all equipment runs at peak simultaneously (75% factor)
  // ════════════════════════════════════════════════════════════════
  const totalPeakKW = Math.round((basePeakKW + amenityPeakKW) * 0.75);
  
  // ════════════════════════════════════════════════════════════════
  // PEAK HOURS ANALYSIS - BESS discharge opportunity
  // ════════════════════════════════════════════════════════════════
  const peakHoursDuration = input.operations.peakHoursEnd - input.operations.peakHoursStart;
  
  // Hotels use ~65% of daily energy during peak hours
  const peakHoursLoadFactor = 0.65;
  const peakEnergyKWh = Math.round(weightedDailyKWh * peakHoursLoadFactor);
  const offPeakEnergyKWh = Math.round(weightedDailyKWh * (1 - peakHoursLoadFactor));
  
  // ════════════════════════════════════════════════════════════════
  // MONTHLY CALCULATIONS
  // ════════════════════════════════════════════════════════════════
  const monthlyKWh = Math.round(weightedDailyKWh * 30);
  const peakSeasonMonthlyKWh = Math.round(peakSeasonDailyKWh * 30);
  const offSeasonMonthlyKWh = Math.round(offSeasonDailyKWh * 30);
  
  // ════════════════════════════════════════════════════════════════
  // FINANCIAL CALCULATIONS (if rates provided)
  // ════════════════════════════════════════════════════════════════
  const electricityRate = input.electricityRate || 0.12; // Default $0.12/kWh
  const demandCharge = input.demandCharge || 15; // Default $15/kW
  
  const monthlyDemandCharges = Math.round(totalPeakKW * demandCharge);
  const monthlyEnergyCharges = Math.round(monthlyKWh * electricityRate);
  const totalMonthlyCharges = monthlyDemandCharges + monthlyEnergyCharges;
  
  // ════════════════════════════════════════════════════════════════
  // ARBITRAGE SAVINGS POTENTIAL
  // TOU rate differential: peak ~1.5x, off-peak ~0.6x
  // ════════════════════════════════════════════════════════════════
  const peakRate = electricityRate * 1.5;
  const offPeakRate = electricityRate * 0.6;
  const rateDifferential = peakRate - offPeakRate;
  
  // BESS can shift ~80% of peak energy to off-peak charging
  const shiftableEnergyKWh = peakEnergyKWh * 0.8;
  const dailyArbitrageSavings = shiftableEnergyKWh * rateDifferential;
  const monthlyArbitrageSavings = Math.round(dailyArbitrageSavings * 30);
  
  // ════════════════════════════════════════════════════════════════
  // RETURN COMPREHENSIVE RESULT
  // ════════════════════════════════════════════════════════════════
  const powerMW = totalPeakKW / 1000;
  
  return {
    // PowerCalculationResult base fields
    powerMW: Math.max(0.05, Math.round(powerMW * 100) / 100),
    durationHrs: 4, // Standard hotel backup duration
    description: `Hotel: ${input.rooms} rooms (${classProfile.name}) × ${classProfile.peakKWPerRoom} kW/room = ${totalPeakKW} kW peak`,
    calculationMethod: 'CBECS hospitality with amenities, seasonality, and arbitrage analysis',
    inputs: {
      rooms: input.rooms,
      hotelClass: input.hotelClass,
      buildingAge: input.buildingAge,
      avgOccupancy: input.avgOccupancy,
      amenities: input.amenities,
    },
    
    // Power breakdown
    basePeakKW: Math.round(basePeakKW),
    amenityPeakKW: Math.round(amenityPeakKW),
    totalPeakKW,
    
    // Energy metrics
    dailyKWh: Math.round(weightedDailyKWh),
    monthlyKWh,
    
    // Financial
    monthlyDemandCharges,
    monthlyEnergyCharges,
    totalMonthlyCharges,
    
    // Seasonality
    seasonalMultiplier,
    peakSeasonMonthlyKWh,
    offSeasonMonthlyKWh,
    
    // Peak hours arbitrage
    peakHoursDuration,
    peakEnergyKWh,
    offPeakEnergyKWh,
    arbitrageSavingsPotential: monthlyArbitrageSavings,
  };
}


// ============================================================================
// CAR WASH POWER CALCULATIONS - SINGLE SOURCE OF TRUTH
// ============================================================================
// Source: Industry specifications document (Nov 2025)
// Migrated from CarWashWizard.tsx for SSOT compliance (Dec 2025)

/**
 * Car wash equipment power specifications
 * All values in kW unless otherwise noted
 */
export const CAR_WASH_EQUIPMENT_POWER = {
  // Conveyor Systems (4-8 kW total)
  conveyor: {
    primary: 5, // 5 HP = 3.7 kW average
    rollerCallUp: 0.5,
    controls: 0.5,
  },
  
  // Washing Equipment (20-35 kW total)
  washing: {
    topBrush: 4, // 3.7-4.5 kW per unit
    wrapAroundBrush: 3.7, // per unit, 2-4 typical
    mitterCurtain: 1, // 0.75-1 kW per unit
    wheelBrush: 0.6, // 0.5-0.75 kW per unit
  },
  
  // High-Pressure Systems (15-25 kW total)
  highPressure: {
    pumpStation: 11, // 15 HP = 11 kW
    undercarriageWash: 2.5, // 2-5 HP
  },
  
  // Chemical Application (3-8 kW total)
  chemical: {
    pumpStation: 1.5, // per station, 2-4 typical
    foamGenerator: 0.5,
    tireShine: 0.3,
  },
  
  // Drying Systems (30-90 kW total) - LARGEST CONSUMER
  drying: {
    standardBlower: 7.5, // 10 HP = 7.5 kW per unit, 4-8 typical
    highPerformance: 33.5, // 45 HP large dryer
    windBlade: 15, // 20 HP
    sideMounted: 9, // 10-15 HP per side
  },
  
  // Vacuum Systems (15-60 kW depending on config)
  vacuum: {
    standAlone3Motor: 3.6, // 4.8 HP total
    centralSystem: 30, // 10-75 HP turbine
    detailing: 4.5, // 4-8 HP
  },
  
  // Water Heating (electric components only)
  waterHeating: {
    controls: 1,
    recircPump: 0.75,
    tankless: 25, // 9-47 kW if electric
  },
  
  // Air Compression (4-12 kW)
  airCompression: {
    compressor: 7.5, // 5-15 HP
    dryer: 0.75,
  },
  
  // Water Reclamation (3-10 kW)
  waterReclaim: {
    reclaimPump: 4, // 3-7.5 HP
    filtration: 1.5,
  },
  
  // HVAC & Facility (5-20 kW)
  facility: {
    lighting: 6, // 2-12 kW tunnel
    controls: 0.5,
    pos: 0.5,
    security: 0.3,
    gates: 0.75,
  },
  
  // Specialty (5-15 kW)
  specialty: {
    reverseOsmosis: 2.5, // 2-5 HP
    wheelBlaster: 1.5, // per unit
  },
} as const;

/**
 * Automation level configurations with power impact
 */
export const CAR_WASH_AUTOMATION_LEVELS = {
  legacy: {
    name: 'Legacy',
    description: 'Older electromechanical systems (pre-2010)',
    powerMultiplier: 0.85, // Less efficient, but simpler
    additionalKW: 2, // Basic controls
  },
  standard: {
    name: 'Standard',
    description: 'Current PLC-based automation (2010-2020)',
    powerMultiplier: 1.0,
    additionalKW: 4, // PLC + sensors + HMI
  },
  modern: {
    name: 'Modern/AI',
    description: 'AI vision systems, real-time adaptation (2020+)',
    powerMultiplier: 1.08, // Slightly more for AI processing
    additionalKW: 8, // Vision + AI + edge computing
  },
} as const;

export type CarWashAutomationLevel = keyof typeof CAR_WASH_AUTOMATION_LEVELS;

/**
 * Car wash equipment configuration for power calculations
 */
export interface CarWashEquipmentConfig {
  // Conveyor
  hasConveyor: boolean;
  conveyorHP: number;
  
  // Washing
  topBrushes: number;
  wrapAroundBrushes: number;
  mitterCurtains: number;
  wheelBrushes: number;
  
  // High Pressure
  highPressurePumps: number;
  hasUndercarriage: boolean;
  
  // Drying
  standardBlowers: number;
  hasWindBlade: boolean;
  hasHighPerformanceDryer: boolean;
  
  // Vacuum
  hasCentralVacuum: boolean;
  vacuumStations: number;
  
  // Chemical
  chemicalStations: number;
  hasTireShine: boolean;
  
  // Water
  hasWaterReclaim: boolean;
  hasReverseOsmosis: boolean;
  waterHeatingType: 'electric' | 'gas' | 'none';
  
  // Air Compression
  airCompressorHP: number;
}

/**
 * Car wash operations configuration
 */
export interface CarWashOperationsConfig {
  hoursPerDay: number;
  daysPerWeek: number;
  peakHoursStart: number;
  peakHoursEnd: number;
}

/**
 * Complete car wash power calculation input
 */
export interface CarWashPowerInput {
  equipment: CarWashEquipmentConfig;
  operations: CarWashOperationsConfig;
  automationLevel: CarWashAutomationLevel;
  electricityRate?: number;
  demandCharge?: number;
}

/**
 * Car wash power calculation result
 */
export interface CarWashPowerResult extends PowerCalculationResult {
  peakDemandKW: number;
  avgDemandKW: number;
  dailyKWh: number;
  monthlyKWh: number;
  demandCharges: number;
  energyCharges: number;
}

/**
 * DETAILED CAR WASH EQUIPMENT POWER CALCULATION
 * Migrated from CarWashWizard.tsx for SSOT compliance
 * 
 * Calculates power requirements based on detailed equipment configuration:
 * - Conveyor systems
 * - Washing equipment (brushes, curtains)
 * - High-pressure systems
 * - Drying systems (largest consumer, 30-40% of total)
 * - Vacuum systems
 * - Chemical application
 * - Water treatment
 * - Facility loads
 * 
 * @param input - Complete car wash configuration
 * @returns Detailed power analysis with financial metrics
 */
export function calculateCarWashEquipmentPower(input: CarWashPowerInput): CarWashPowerResult {
  const { equipment, operations, automationLevel } = input;
  const EQUIPMENT_POWER = CAR_WASH_EQUIPMENT_POWER;
  
  let peakKW = 0;
  
  // Conveyor
  if (equipment.hasConveyor) {
    peakKW += equipment.conveyorHP * 0.746; // HP to kW
    peakKW += EQUIPMENT_POWER.conveyor.rollerCallUp;
    peakKW += EQUIPMENT_POWER.conveyor.controls;
  }
  
  // Washing Equipment
  peakKW += equipment.topBrushes * EQUIPMENT_POWER.washing.topBrush;
  peakKW += equipment.wrapAroundBrushes * EQUIPMENT_POWER.washing.wrapAroundBrush;
  peakKW += equipment.mitterCurtains * EQUIPMENT_POWER.washing.mitterCurtain;
  peakKW += equipment.wheelBrushes * EQUIPMENT_POWER.washing.wheelBrush;
  
  // High Pressure
  peakKW += equipment.highPressurePumps * EQUIPMENT_POWER.highPressure.pumpStation;
  if (equipment.hasUndercarriage) {
    peakKW += EQUIPMENT_POWER.highPressure.undercarriageWash;
  }
  
  // Drying - LARGEST CONSUMER (30-40% of total)
  peakKW += equipment.standardBlowers * EQUIPMENT_POWER.drying.standardBlower;
  if (equipment.hasWindBlade) {
    peakKW += EQUIPMENT_POWER.drying.windBlade;
  }
  if (equipment.hasHighPerformanceDryer) {
    peakKW += EQUIPMENT_POWER.drying.highPerformance;
  }
  
  // Vacuum - Central system and standalone stations can coexist
  if (equipment.hasCentralVacuum) {
    peakKW += EQUIPMENT_POWER.vacuum.centralSystem;
  }
  // Standalone vacuum stations (in parking lot / self-serve bays)
  peakKW += equipment.vacuumStations * EQUIPMENT_POWER.vacuum.standAlone3Motor;
  
  // Chemical
  peakKW += equipment.chemicalStations * EQUIPMENT_POWER.chemical.pumpStation;
  peakKW += EQUIPMENT_POWER.chemical.foamGenerator;
  if (equipment.hasTireShine) {
    peakKW += EQUIPMENT_POWER.chemical.tireShine;
  }
  
  // Water
  if (equipment.hasWaterReclaim) {
    peakKW += EQUIPMENT_POWER.waterReclaim.reclaimPump;
    peakKW += EQUIPMENT_POWER.waterReclaim.filtration;
  }
  if (equipment.hasReverseOsmosis) {
    peakKW += EQUIPMENT_POWER.specialty.reverseOsmosis;
  }
  if (equipment.waterHeatingType === 'electric') {
    peakKW += EQUIPMENT_POWER.waterHeating.tankless;
  } else if (equipment.waterHeatingType === 'gas') {
    peakKW += EQUIPMENT_POWER.waterHeating.controls;
    peakKW += EQUIPMENT_POWER.waterHeating.recircPump;
  }
  // 'none' = no water heating power consumption
  
  // Air Compression
  peakKW += equipment.airCompressorHP * 0.746;
  peakKW += EQUIPMENT_POWER.airCompression.dryer;
  
  // Facility
  peakKW += EQUIPMENT_POWER.facility.lighting;
  peakKW += EQUIPMENT_POWER.facility.controls;
  peakKW += EQUIPMENT_POWER.facility.pos;
  peakKW += EQUIPMENT_POWER.facility.security;
  peakKW += EQUIPMENT_POWER.facility.gates;
  
  // Automation Systems (based on level)
  const autoLevel = CAR_WASH_AUTOMATION_LEVELS[automationLevel];
  peakKW += autoLevel.additionalKW;
  
  // Apply automation efficiency multiplier
  peakKW *= autoLevel.powerMultiplier;
  
  // Load diversity factor (not all equipment runs simultaneously)
  const diversityFactor = 0.7; // 70% typical
  const avgKW = peakKW * diversityFactor;
  
  // Daily energy
  const peakHours = operations.peakHoursEnd - operations.peakHoursStart;
  const offPeakHours = operations.hoursPerDay - peakHours;
  const dailyKWh = (peakKW * peakHours * 0.85) + (avgKW * offPeakHours * 0.6);
  
  // Monthly
  const monthlyKWh = dailyKWh * operations.daysPerWeek * 4.33;
  
  // Costs (if rates provided)
  const demandCharges = input.demandCharge ? Math.round(peakKW * input.demandCharge) : 0;
  const energyCharges = input.electricityRate ? Math.round(monthlyKWh * input.electricityRate) : 0;
  
  const powerMW = peakKW / 1000;
  
  return {
    // Base PowerCalculationResult
    powerMW: Math.max(0.05, Math.round(powerMW * 100) / 100),
    durationHrs: Math.max(2, peakHours), // Duration based on peak hours
    description: `Car wash: ${Math.round(peakKW)} kW peak demand, ${Math.round(avgKW)} kW average`,
    calculationMethod: 'Equipment-based calculation with load diversity',
    inputs: {
      automationLevel,
      hasConveyor: equipment.hasConveyor,
      standardBlowers: equipment.standardBlowers,
      hasCentralVacuum: equipment.hasCentralVacuum,
    },
    
    // Extended CarWashPowerResult
    peakDemandKW: Math.round(peakKW),
    avgDemandKW: Math.round(avgKW),
    dailyKWh: Math.round(dailyKWh),
    monthlyKWh: Math.round(monthlyKWh),
    demandCharges,
    energyCharges,
  };
}


/**
 * Calculate power requirement for Hospital
 * Source: ASHRAE healthcare guidelines, CBECS 2018, Energy Star Healthcare
 * 
 * Benchmarks:
 * - Community hospital (100 beds): 300-500 kW peak → 4 kW/bed
 * - Regional hospital (250 beds): 1-1.5 MW peak → 5 kW/bed  
 * - Academic medical center (500+ beds): 3-5 MW peak → 6-8 kW/bed
 * 
 * @param bedCount - Number of hospital beds
 * @param hospitalType - Type of hospital (affects kW/bed)
 * @returns Power in MW
 */
export function calculateHospitalPower(
  bedCount: number,
  hospitalType: 'community' | 'regional' | 'academic' | 'specialty' = 'regional',
  operatingHours: 'limited' | 'extended' | '24_7' = '24_7'
): PowerCalculationResult {
  // kW per bed varies by hospital type
  // Community: basic services, lower acuity
  // Regional: full services, moderate ICU
  // Academic: teaching hospital, higher acuity, research equipment
  // Specialty: cardiac, cancer, trauma - highest equipment density
  const kWPerBedByType = {
    community: 4.0,  // Basic services
    regional: 5.0,   // Standard acute care
    academic: 6.0,   // Teaching/research hospital
    specialty: 7.5,  // Cardiac, cancer, trauma centers
  };
  
  // Operating hours multiplier (NEW - Dec 13, 2025)
  // Source: Healthcare facility operational standards
  const hoursMultiplier = {
    limited: 0.4,    // 8am-6pm outpatient/clinic (10 hours)
    extended: 0.7,   // 6am-10pm urgent care (16 hours)
    '24_7': 1.0      // Full hospital (24 hours)
  }[operatingHours];
  
  const kWPerBed = kWPerBedByType[hospitalType];
  const basePowerKW = bedCount * kWPerBed;
  const powerKW = basePowerKW * hoursMultiplier;
  const powerMW = powerKW / 1000;
  
  const hoursLabel = {
    limited: 'Limited Hours (8am-6pm)',
    extended: 'Extended Hours (6am-10pm)',
    '24_7': '24/7 Operations'
  }[operatingHours];
  
  return {
    powerMW: Math.max(0.2, Math.round(powerMW * 100) / 100), // Min 200kW
    durationHrs: 8, // Hospitals need longer backup for critical care
    description: `${hospitalType.charAt(0).toUpperCase() + hospitalType.slice(1)} Hospital: ${bedCount} beds × ${kWPerBed} kW/bed × ${hoursMultiplier} (${hoursLabel}) = ${powerKW.toFixed(0)} kW`,
    calculationMethod: `ASHRAE healthcare peak demand (${kWPerBed} kW/bed for ${hospitalType}, ${hoursLabel})`,
    inputs: { bedCount, hospitalType, kWPerBed, operatingHours, hoursMultiplier }
  };
}

/**
 * Calculate power requirement for Data Center
 * Source: Uptime Institute, industry standards
 * 
 * @param itLoadKW - IT equipment load in kW (if known)
 * @param rackCount - Number of server racks (alternative)
 * @param rackDensityKW - Power per rack (default 8kW)
 * @returns Power in MW
 */
export function calculateDatacenterPower(
  itLoadKW?: number,
  rackCount?: number,
  rackDensityKW: number = 8
): PowerCalculationResult {
  console.log('🏢 [calculateDatacenterPower] INPUTS:', { itLoadKW, rackCount, rackDensityKW });
  
  let powerKW: number;
  let method: string;
  
  if (itLoadKW && itLoadKW > 0) {
    // Direct IT load specified - add 50% for cooling (PUE ~1.5)
    powerKW = itLoadKW * 1.5;
    method = `Direct IT load ${itLoadKW}kW × 1.5 PUE`;
    console.log('🏢 [calculateDatacenterPower] Using IT Load method:', { itLoadKW, powerKW, method });
  } else if (rackCount && rackCount > 0) {
    // Calculate from rack count
    const itPower = rackCount * rackDensityKW;
    powerKW = itPower * 1.5; // PUE ~1.5
    method = `${rackCount} racks × ${rackDensityKW}kW × 1.5 PUE`;
    console.log('🏢 [calculateDatacenterPower] Using Rack Count method:', { rackCount, rackDensityKW, itPower, powerKW, method });
  } else {
    // Default small datacenter
    powerKW = 2000; // 2 MW default
    method = 'Default 2MW datacenter';
    console.log('⚠️ [calculateDatacenterPower] USING DEFAULT - No itLoadKW or rackCount provided!');
  }
  
  const powerMW = powerKW / 1000;
  
  console.log('🏢 [calculateDatacenterPower] FINAL OUTPUT:', { powerKW, powerMW, method });
  
  return {
    powerMW: Math.max(0.5, Math.round(powerMW * 100) / 100), // Min 500kW
    durationHrs: 4, // Standard UPS backup target
    description: `Data Center: ${method} = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'Uptime Institute standards (PUE 1.5)',
    inputs: { itLoadKW, rackCount, rackDensityKW }
  };
}

// ============================================================================
// EQUIPMENT-BASED DATA CENTER POWER CALCULATION (Dec 2025)
// ============================================================================

/**
 * Input for comprehensive data center power calculation
 */
export interface DataCenterPowerFromEquipmentInput {
  // IT Load specification (pick one method)
  itLoadKW?: number;                         // Direct IT load in kW
  rackCount?: number;                        // Number of racks
  rackDensity?: 'lowDensity' | 'mediumDensity' | 'highDensity' | 'ultraHighDensity';
  customRackPowerKW?: number;                // Custom power per rack
  
  // Rack breakdown (optional detail)
  computeRacks?: number;
  storageRacks?: number;
  networkRacks?: number;
  gpuRacks?: number;                         // High-density AI/GPU racks
  
  // Facility classification
  classification?: DataCenterClassification;
  tier?: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  
  // Efficiency overrides
  targetPUE?: number;                        // Override default PUE
  hasEconomizer?: boolean;                   // Airside/waterside economizer
  hasLiquidCooling?: boolean;                // Direct liquid cooling for GPUs
  
  // Options
  includeAuxiliaryLoads?: boolean;           // Include full auxiliary breakdown
}

/**
 * Result from comprehensive data center power calculation
 */
export interface DataCenterPowerFromEquipmentResult {
  // IT Load
  itLoadKW: number;
  itLoadMW: number;
  
  // Total Facility Load (IT + overhead)
  totalFacilityLoadKW: number;
  totalFacilityLoadMW: number;
  pue: number;                               // Power Usage Effectiveness
  
  // Classification
  classifiedAs: DataCenterClassification;
  classificationDetails: typeof DATA_CENTER_CLASSIFICATIONS[DataCenterClassification];
  tier: string;
  
  // Auxiliary breakdown
  auxiliaryBreakdown: {
    coolingKW: number;
    powerDistributionLossesKW: number;
    upsLossesKW: number;
    lightingKW: number;
    securityFireKW: number;
    bmsDcimKW: number;
    officeSupportKW: number;
    totalAuxiliaryKW: number;
  };
  
  // BESS recommendation
  bessRecommendation: {
    powerMW: { min: number; max: number };
    energyMWh: { min: number; max: number };
    durationHours: number | string;
    primaryUseCase: string;
    tierBasedSizing: {
      bessMultiplier: number;
      bessKW: number;
      bessKWh: number;
    };
  };
  
  // Equipment sizing estimates
  equipmentSizing: {
    upsCapacityKW: number;
    generatorCapacityKW: number;
    chillerCapacityTons: number;
    transformerCapacityMVA: number;
  };
  
  // Validation
  validation: {
    isValid: boolean;
    warnings: string[];
    withinClassBounds: boolean;
  };
  
  description: string;
  calculationMethod: string;
}

/**
 * Classify data center based on IT load
 */
function classifyDataCenter(itLoadKW: number): DataCenterClassification {
  if (itLoadKW <= 500) return 'edge';
  if (itLoadKW <= 2000) return 'small';
  if (itLoadKW <= 10000) return 'medium';
  if (itLoadKW <= 50000) return 'large';
  return 'hyperscale';
}

/**
 * Calculate comprehensive power requirements for a Data Center
 * Uses equipment specifications from industry standards
 * 
 * @param input - Data center configuration
 * @returns Complete power analysis with BESS recommendations
 */
export function calculateDataCenterPowerFromEquipment(
  input: DataCenterPowerFromEquipmentInput
): DataCenterPowerFromEquipmentResult {
  
  // Step 1: Calculate IT Load
  let itLoadKW: number;
  let rackBreakdown = { compute: 0, storage: 0, network: 0, gpu: 0 };
  
  if (input.itLoadKW && input.itLoadKW > 0) {
    // Direct IT load specified
    itLoadKW = input.itLoadKW;
  } else if (input.rackCount && input.rackCount > 0) {
    // Calculate from rack count
    const density = input.rackDensity || 'mediumDensity';
    const densitySpec = DATA_CENTER_RACK_DENSITY[density];
    const kWPerRack = input.customRackPowerKW || 
      (densitySpec.powerPerRack.min + densitySpec.powerPerRack.max) / 2;
    
    // If detailed rack breakdown provided
    if (input.computeRacks || input.storageRacks || input.networkRacks || input.gpuRacks) {
      const computeRacks = input.computeRacks || 0;
      const storageRacks = input.storageRacks || 0;
      const networkRacks = input.networkRacks || 0;
      const gpuRacks = input.gpuRacks || 0;
      
      // Different power per rack type
      const computePower = computeRacks * kWPerRack;
      const storagePower = storageRacks * 12; // ~12 kW for storage
      const networkPower = networkRacks * 8;  // ~8 kW for network
      const gpuPower = gpuRacks * 50;         // ~50 kW for GPU racks
      
      itLoadKW = computePower + storagePower + networkPower + gpuPower;
      rackBreakdown = { compute: computeRacks, storage: storageRacks, network: networkRacks, gpu: gpuRacks };
    } else {
      itLoadKW = input.rackCount * kWPerRack;
    }
  } else {
    // Default: small data center (400 racks at 5 kW average)
    itLoadKW = 2000; // 2 MW default
  }
  
  // Step 2: Classify the data center
  const classification = input.classification || classifyDataCenter(itLoadKW);
  const classificationDetails = DATA_CENTER_CLASSIFICATIONS[classification];
  const auxiliaryConfig = DATA_CENTER_AUXILIARY_LOADS[classification];
  
  // Step 3: Determine PUE
  let pue: number;
  if (input.targetPUE) {
    pue = input.targetPUE;
  } else {
    // Base PUE from classification
    pue = classificationDetails.pue.typical;
    
    // Adjustments for efficiency features
    if (input.hasEconomizer) {
      pue -= 0.1; // Economizers reduce PUE
    }
    if (input.hasLiquidCooling) {
      pue -= 0.15; // Liquid cooling is more efficient
    }
    
    // Clamp to best-in-class minimum
    pue = Math.max(pue, classificationDetails.pue.bestInClass);
  }
  
  // Step 4: Calculate auxiliary loads
  const loadRatio = itLoadKW / ((classificationDetails.itLoad.min + classificationDetails.itLoad.max) / 2);
  const clampedRatio = Math.max(0.5, Math.min(1.5, loadRatio));
  
  const auxiliaryBreakdown = {
    coolingKW: Math.round((auxiliaryConfig.coolingTotalKW.min + auxiliaryConfig.coolingTotalKW.max) / 2 * clampedRatio),
    powerDistributionLossesKW: Math.round((auxiliaryConfig.powerDistributionLossesKW.min + auxiliaryConfig.powerDistributionLossesKW.max) / 2 * clampedRatio),
    upsLossesKW: Math.round((auxiliaryConfig.upsLossesKW.min + auxiliaryConfig.upsLossesKW.max) / 2 * clampedRatio),
    lightingKW: Math.round((auxiliaryConfig.lightingKW.min + auxiliaryConfig.lightingKW.max) / 2 * clampedRatio),
    securityFireKW: Math.round((auxiliaryConfig.securityFireKW.min + auxiliaryConfig.securityFireKW.max) / 2 * clampedRatio),
    bmsDcimKW: Math.round((auxiliaryConfig.bmsDcimKW.min + auxiliaryConfig.bmsDcimKW.max) / 2 * clampedRatio),
    officeSupportKW: Math.round((auxiliaryConfig.officeSupportKW.min + auxiliaryConfig.officeSupportKW.max) / 2 * clampedRatio),
    totalAuxiliaryKW: 0,
  };
  auxiliaryBreakdown.totalAuxiliaryKW = 
    auxiliaryBreakdown.coolingKW + 
    auxiliaryBreakdown.powerDistributionLossesKW + 
    auxiliaryBreakdown.upsLossesKW +
    auxiliaryBreakdown.lightingKW + 
    auxiliaryBreakdown.securityFireKW + 
    auxiliaryBreakdown.bmsDcimKW + 
    auxiliaryBreakdown.officeSupportKW;
  
  // Step 5: Calculate total facility load
  const totalFacilityLoadKW = Math.round(itLoadKW * pue);
  
  // Step 6: Get tier configuration
  const tierKey = input.tier || 'tier3';
  const tierConfig = DATACENTER_TIER_STANDARDS[tierKey] || DATACENTER_TIER_STANDARDS.tier3;
  
  // Step 7: BESS recommendation
  const bessConfig = DATA_CENTER_BESS_SIZING[classification];
  const tierBasedBessKW = Math.round(itLoadKW * tierConfig.bessMultiplier);
  const tierBasedBessKWh = tierBasedBessKW * tierConfig.durationHours;
  
  // Step 8: Equipment sizing estimates
  const equipmentSizing = {
    upsCapacityKW: Math.round(itLoadKW * 1.2), // 20% margin
    generatorCapacityKW: Math.round(totalFacilityLoadKW * 1.25), // 25% margin for N+1
    chillerCapacityTons: Math.round(auxiliaryBreakdown.coolingKW / 3.517), // kW to tons
    transformerCapacityMVA: Math.round(totalFacilityLoadKW / 800) / 10, // Rough MVA sizing
  };
  
  // Step 9: Validation
  const warnings: string[] = [];
  const withinClassBounds = 
    itLoadKW >= classificationDetails.itLoad.min &&
    itLoadKW <= classificationDetails.itLoad.max;
  
  if (!withinClassBounds) {
    warnings.push(`IT load ${itLoadKW} kW is outside typical ${classification} range (${classificationDetails.itLoad.min}-${classificationDetails.itLoad.max} kW)`);
  }
  
  if (pue < 1.0 || pue > 3.0) {
    warnings.push(`PUE ${pue} is outside realistic range (1.0-3.0)`);
  }
  
  if (input.gpuRacks && input.gpuRacks > 0 && !input.hasLiquidCooling) {
    warnings.push('GPU/AI workloads typically require liquid cooling for optimal efficiency');
  }
  
  // Build description
  const totalRacks = input.rackCount || 
    (rackBreakdown.compute + rackBreakdown.storage + rackBreakdown.network + rackBreakdown.gpu) ||
    Math.round(itLoadKW / 10);
  
  const description = `${classificationDetails.name} (${tierConfig.name}): ${totalRacks} racks, ${itLoadKW.toLocaleString()} kW IT load × ${pue} PUE = ${totalFacilityLoadKW.toLocaleString()} kW total facility load`;
  
  return {
    itLoadKW,
    itLoadMW: itLoadKW / 1000,
    
    totalFacilityLoadKW,
    totalFacilityLoadMW: totalFacilityLoadKW / 1000,
    pue,
    
    classifiedAs: classification,
    classificationDetails,
    tier: tierConfig.name,
    
    auxiliaryBreakdown,
    
    bessRecommendation: {
      powerMW: bessConfig.recommendedMW,
      energyMWh: bessConfig.recommendedMWh,
      durationHours: bessConfig.durationHours,
      primaryUseCase: bessConfig.primaryUseCase,
      tierBasedSizing: {
        bessMultiplier: tierConfig.bessMultiplier,
        bessKW: tierBasedBessKW,
        bessKWh: tierBasedBessKWh,
      },
    },
    
    equipmentSizing,
    
    validation: {
      isValid: warnings.length === 0,
      warnings,
      withinClassBounds,
    },
    
    description,
    calculationMethod: 'Equipment-based calculation per Uptime Institute and ASHRAE TC 9.9 standards (Dec 2025)',
  };
}

/**
 * Simple helper for data center landing page
 * Returns just the key metrics needed for display
 */
export interface DataCenterPowerSimpleInput {
  rackCount?: number;
  itLoadKW?: number;
  rackDensity?: 'low' | 'medium' | 'high' | 'gpu';
  tier?: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  electricityRate?: number;
}

export interface DataCenterPowerSimpleResult {
  itLoadKW: number;
  totalFacilityKW: number;
  pue: number;
  coolingKW: number;
  bessRecommendedKWh: number;
  monthlyElectricityCost: number;
  classification: string;
}

/**
 * Simplified data center power calculation for landing pages
 * SSOT wrapper for DataCenterEnergy.tsx
 */
export function calculateDataCenterPowerSimple(input: DataCenterPowerSimpleInput): DataCenterPowerSimpleResult {
  // Map simple density to full density type
  const densityMap: Record<string, 'lowDensity' | 'mediumDensity' | 'highDensity' | 'ultraHighDensity'> = {
    'low': 'lowDensity',
    'medium': 'mediumDensity',
    'high': 'highDensity',
    'gpu': 'ultraHighDensity',
  };
  
  const result = calculateDataCenterPowerFromEquipment({
    rackCount: input.rackCount,
    itLoadKW: input.itLoadKW,
    rackDensity: input.rackDensity ? densityMap[input.rackDensity] : undefined,
    tier: input.tier,
    includeAuxiliaryLoads: true,
  });
  
  // Calculate monthly cost
  const rate = input.electricityRate || 0.10; // Default $0.10/kWh
  const monthlyKWh = result.totalFacilityLoadKW * 24 * 30; // 24/7 operation
  const monthlyElectricityCost = Math.round(monthlyKWh * rate);
  
  // BESS recommendation (midpoint of range)
  const bessKWh = Math.round(
    ((result.bessRecommendation.energyMWh.min + result.bessRecommendation.energyMWh.max) / 2) * 1000
  );
  
  return {
    itLoadKW: result.itLoadKW,
    totalFacilityKW: result.totalFacilityLoadKW,
    pue: result.pue,
    coolingKW: result.auxiliaryBreakdown.coolingKW,
    bessRecommendedKWh: bessKWh,
    monthlyElectricityCost,
    classification: result.classificationDetails.name,
  };
}

/**
 * Calculate power requirement for EV Charging Station
 * 
 * @deprecated Use evChargingCalculations.ts for full EV hub calculations
 * This function is kept for backward compatibility with legacy code.
 * For new code, use calculateEVHubPower() from evChargingCalculations.ts
 * 
 * Source: SAE J1772, CCS/CHAdeMO standards
 * 
 * @param level1Count - Number of Level 1 chargers (1.9 kW each)
 * @param level2Count - Number of Level 2 chargers (19.2 kW each)  
 * @param dcFastCount - Number of DC Fast chargers (150 kW each)
 * @returns Power in MW
 */
export function calculateEVChargingPower(
  level1Count: number = 0,
  level2Count: number = 0,
  dcFastCount: number = 0
): PowerCalculationResult {
  // ⚠️ DEPRECATED: This uses simplified fixed power ratings
  // For accurate calculations with variable charger types, use evChargingCalculations.ts
  
  // Delegate to evChargingCalculations.ts when possible
  // For now, keep legacy logic for backward compatibility
  const level1Power = 1.9;   // kW (120V/16A)
  const level2Power = 19.2;  // kW (240V/80A commercial)  
  const dcFastPower = 150;   // kW (typical commercial DC fast)
  
  const level1TotalKW = level1Count * level1Power;
  const level2TotalKW = level2Count * level2Power;
  const dcFastTotalKW = dcFastCount * dcFastPower;
  const totalKW = level1TotalKW + level2TotalKW + dcFastTotalKW;
  
  const powerMW = totalKW / 1000;
  
  return {
    powerMW: Math.max(0.05, Math.round(powerMW * 100) / 100), // Min 50kW
    durationHrs: 2, // Short duration for demand charge management
    description: `EV Charging: L1(${level1Count}×${level1Power}kW) + L2(${level2Count}×${level2Power}kW) + DC(${dcFastCount}×${dcFastPower}kW) = ${totalKW.toFixed(1)} kW`,
    calculationMethod: 'SAE J1772/CCS standards (legacy - use evChargingCalculations.ts for new code)',
    inputs: { level1Count, level2Count, dcFastCount, level1Power, level2Power, dcFastPower }
  };
}

/**
 * Calculate power requirement for Airport
 * Source: FAA, international airport energy benchmarks
 * 
 * Airport Classifications (Peak Demand):
 * - Small Regional (< 1M pax): 2–6 MW
 * - Medium Regional (1–5M pax): 6–18 MW  
 * - Large Regional (5–15M pax): 18–55 MW
 * - Major Hub (15–50M pax): 55–175 MW
 * - Mega Hub (50–100M+ pax): 175–500+ MW
 * 
 * @param annualPassengersMillions - Million passengers per year
 * @returns Power in MW
 */
export function calculateAirportPower(annualPassengersMillions: number): PowerCalculationResult {
  // Updated formula based on industry data:
  // Base load + scaling factor that accounts for terminal infrastructure
  // Small airports have higher MW/passenger due to fixed infrastructure
  
  let powerMW: number;
  let classification: string;
  
  if (annualPassengersMillions < 1) {
    // Small Regional: 2-6 MW range
    // Linear interpolation: 0.1M → 2MW, 1M → 6MW
    powerMW = 2 + (annualPassengersMillions * 4);
    classification = 'Small Regional';
  } else if (annualPassengersMillions < 5) {
    // Medium Regional: 6-18 MW range
    // Linear: 1M → 6MW, 5M → 18MW
    powerMW = 6 + ((annualPassengersMillions - 1) * 3);
    classification = 'Medium Regional';
  } else if (annualPassengersMillions < 15) {
    // Large Regional: 18-55 MW range
    // Linear: 5M → 18MW, 15M → 55MW
    powerMW = 18 + ((annualPassengersMillions - 5) * 3.7);
    classification = 'Large Regional';
  } else if (annualPassengersMillions < 50) {
    // Major Hub: 55-175 MW range
    // Linear: 15M → 55MW, 50M → 175MW
    powerMW = 55 + ((annualPassengersMillions - 15) * 3.43);
    classification = 'Major Hub';
  } else {
    // Mega Hub: 175-500+ MW range
    // Linear: 50M → 175MW, 100M → 500MW
    powerMW = 175 + ((annualPassengersMillions - 50) * 6.5);
    classification = 'Mega Hub';
  }
  
  // Round to 1 decimal
  powerMW = Math.round(powerMW * 10) / 10;
  
  return {
    powerMW: Math.max(2, powerMW), // Min 2MW for smallest airports
    durationHrs: 4,
    description: `${classification} Airport: ${annualPassengersMillions}M passengers/year → ${powerMW.toFixed(1)} MW peak demand`,
    calculationMethod: `FAA/industry airport benchmarks (${classification}: ${annualPassengersMillions}M pax)`,
    inputs: { annualPassengersMillions, classification, powerMW }
  };
}


// ============================================================================
// AIRPORT - COMPREHENSIVE EQUIPMENT-BASED CALCULATIONS
// ============================================================================

// Note: AirportClassification type is defined above near AIRPORT_CLASSIFICATIONS constant

/**
 * Airport Power Calculation Input - Simple Interface
 */
export interface AirportPowerSimpleInput {
  annualPassengersMillions: number;
  gateCount?: number;
  terminalSqFt?: number;
  electricityRate?: number;
  hasElectricGSE?: boolean;
  hasOnSiteSolar?: boolean;
}

/**
 * Airport Power Calculation Input - Detailed Interface
 */
export interface AirportPowerDetailedInput extends AirportPowerSimpleInput {
  classification?: AirportClassification;
  runwayCount?: number;
  cargoBuildingSqFt?: number;
  maintenanceHangarSqFt?: number;
  parkingSpaces?: number;
  fuelFarmCapacityGallons?: number;
  hasDeIcingFacility?: boolean;
  hasCentralUtilityPlant?: boolean;
  chillerCapacityTons?: number;
  // Optional equipment overrides
  airfieldLightingKW?: number;
  terminalHVACKW?: number;
  baggageHandlingKW?: number;
  securityScreeningKW?: number;
  groundPowerKW?: number;
}

/**
 * Airport Power Calculation Result - Detailed Breakdown
 */
export interface AirportPowerDetailedResult {
  totalPeakMW: number;
  avgDemandMW: number;
  classification: AirportClassification;
  breakdown: {
    airfieldLightingKW: number;
    navAidsKW: number;
    atcKW: number;
    terminalHVACKW: number;
    terminalElectricalKW: number;
    verticalTransportKW: number;
    baggageHandlingKW: number;
    securityScreeningKW: number;
    gseChargingKW: number;
    groundPowerKW: number;
    fuelFarmKW: number;
    deIcingKW: number;
    arffKW: number;
    cargoKW: number;
    maintenanceKW: number;
    parkingKW: number;
    retailFoodServiceKW: number;
    itCommunicationsKW: number;
    centralUtilityPlantKW: number;
    waterWastewaterKW: number;
    sustainableEnergyKW: number;
  };
  bessRecommendation: {
    sizeMWh: { min: number; max: number; typical: number };
    powerMW: { min: number; max: number; typical: number };
    primaryApplications: string[];
  };
  gridRequirements: {
    voltageKV: number;
    feedCount: number;
    backupGeneratorsMW: number;
    upsCapacityMW: number;
  };
  annualEnergyMWh: number;
  costEstimates: {
    annualEnergyCost: number;
    demandChargeCost: number;
    peakShavingSavings: number;
  };
}

/**
 * Airport Power Calculation Result - Simple Interface
 */
export interface AirportPowerSimpleResult {
  peakMW: number;
  avgMW: number;
  classification: string;
  bessRecommendationMWh: number;
  annualEnergyCostEstimate: number;
}

/**
 * Determine airport classification based on annual passengers and gate count
 */
function determineAirportClassification(
  annualPassengersMillions: number,
  gateCount?: number
): AirportClassification {
  // Primary classification by passengers, refined by gates if provided
  if (annualPassengersMillions >= 50) return 'megaHub';
  if (annualPassengersMillions >= 25) return 'majorHub';      // Major international hubs
  if (annualPassengersMillions >= 10) return 'largeRegional'; // Large regional/small hub
  if (annualPassengersMillions >= 3) return 'mediumRegional';
  return 'smallRegional';
}

/**
 * Calculate Airport Power from Equipment - Comprehensive Detailed Calculation
 * 
 * Uses comprehensive equipment specifications from the Airport Classifications
 * & Equipment Specifications sheet. Calculates power by category:
 * - Airfield Operations (lighting, NAVAIDs, ATC)
 * - Terminal Systems (HVAC, electrical, vertical transport)
 * - Baggage & Security
 * - Ground Support Equipment
 * - Support Facilities (cargo, maintenance, parking)
 * - Central Utility Plant
 * 
 * @param input - Airport parameters
 * @returns Detailed power breakdown with BESS recommendations
 */
export function calculateAirportPowerFromEquipment(
  input: AirportPowerDetailedInput
): AirportPowerDetailedResult {
  const {
    annualPassengersMillions,
    gateCount,
    terminalSqFt,
    electricityRate = 0.10,
  } = input;
  
  // Determine classification
  const classification = input.classification || 
    determineAirportClassification(annualPassengersMillions, gateCount);
  const classProfile = AIRPORT_CLASSIFICATIONS[classification];
  
  // Get load from classification (simplified - uses profile totals)
  const loadRange = classProfile.totalFacilityLoad;
  const totalPeakKW = (loadRange.min + loadRange.max) / 2 * 1000; // Convert MW to kW
  
  // Use provided values or derive from classification (use midpoint of range)
  const effectiveGateCount = gateCount || Math.round((classProfile.gates.min + classProfile.gates.max) / 2);
  const effectiveTerminalSqFt = terminalSqFt || (effectiveGateCount * 50000);
  
  // Estimate breakdown proportions (typical airport distribution)
  const airfieldLightingKW = totalPeakKW * 0.08;
  const navAidsKW = totalPeakKW * 0.02;
  const atcKW = totalPeakKW * 0.03;
  const terminalHVACKW = totalPeakKW * 0.25;
  const terminalElectricalKW = totalPeakKW * 0.12;
  const verticalTransportKW = totalPeakKW * 0.05;
  const baggageHandlingKW = totalPeakKW * 0.08;
  const securityScreeningKW = totalPeakKW * 0.06;
  const gseChargingKW = totalPeakKW * 0.07;
  const groundPowerKW = totalPeakKW * 0.05;
  const fuelFarmKW = totalPeakKW * 0.02;
  const deIcingKW = totalPeakKW * 0.02;
  const arffKW = totalPeakKW * 0.01;
  const cargoKW = totalPeakKW * 0.04;
  const maintenanceKW = totalPeakKW * 0.03;
  const parkingKW = totalPeakKW * 0.03;
  const retailFoodServiceKW = totalPeakKW * 0.02;
  const itCommunicationsKW = totalPeakKW * 0.02;
  const centralUtilityPlantKW = totalPeakKW * 0.02;
  const waterWastewaterKW = totalPeakKW * 0.01;
  const sustainableEnergyKW = 0;
  
  // Apply load factor for average demand (use midpoint of range)
  const loadFactor = (classProfile.loadFactor.min + classProfile.loadFactor.max) / 2;
  const avgDemandKW = totalPeakKW * loadFactor;
  
  // Convert to MW
  const totalPeakMW = totalPeakKW / 1000;
  const avgDemandMW = avgDemandKW / 1000;
  
  // Annual energy
  const annualEnergyMWh = avgDemandMW * 8760;
  
  // BESS Recommendations from classification
  const bessProfile = AIRPORT_BESS_SIZING[classification];
  const bessSizeMWh = {
    min: bessProfile.recommendedMWh.min,
    max: bessProfile.recommendedMWh.max,
    typical: (bessProfile.recommendedMWh.min + bessProfile.recommendedMWh.max) / 2,
  };
  const bessPowerMW = {
    min: bessProfile.recommendedMW.min,
    max: bessProfile.recommendedMW.max,
    typical: (bessProfile.recommendedMW.min + bessProfile.recommendedMW.max) / 2,
  };
  
  // Grid Requirements from classification
  const gridReqs = AIRPORT_GRID_REQUIREMENTS[classification];
  const feedCount = parseInt(gridReqs.dedicatedFeeders.split('-')[0]) || 2;
  
  // Cost estimates
  const annualEnergyCost = annualEnergyMWh * 1000 * electricityRate;
  const demandCharge = 15; // $/kW average
  const demandChargeCost = totalPeakMW * 1000 * demandCharge * 12;
  const peakShavingSavings = demandChargeCost * 0.3;
  
  return {
    totalPeakMW: Math.round(totalPeakMW * 100) / 100,
    avgDemandMW: Math.round(avgDemandMW * 100) / 100,
    classification,
    breakdown: {
      airfieldLightingKW: Math.round(airfieldLightingKW),
      navAidsKW: Math.round(navAidsKW),
      atcKW: Math.round(atcKW),
      terminalHVACKW: Math.round(terminalHVACKW),
      terminalElectricalKW: Math.round(terminalElectricalKW),
      verticalTransportKW: Math.round(verticalTransportKW),
      baggageHandlingKW: Math.round(baggageHandlingKW),
      securityScreeningKW: Math.round(securityScreeningKW),
      gseChargingKW: Math.round(gseChargingKW),
      groundPowerKW: Math.round(groundPowerKW),
      fuelFarmKW: Math.round(fuelFarmKW),
      deIcingKW: Math.round(deIcingKW),
      arffKW: Math.round(arffKW),
      cargoKW: Math.round(cargoKW),
      maintenanceKW: Math.round(maintenanceKW),
      parkingKW: Math.round(parkingKW),
      retailFoodServiceKW: Math.round(retailFoodServiceKW),
      itCommunicationsKW: Math.round(itCommunicationsKW),
      centralUtilityPlantKW: Math.round(centralUtilityPlantKW),
      waterWastewaterKW: Math.round(waterWastewaterKW),
      sustainableEnergyKW: Math.round(sustainableEnergyKW),
    },
    bessRecommendation: {
      sizeMWh: bessSizeMWh,
      powerMW: bessPowerMW,
      primaryApplications: [bessProfile.primaryUseCase],
    },
    gridRequirements: {
      voltageKV: 13.8, // Default medium voltage
      feedCount,
      backupGeneratorsMW: totalPeakMW * 0.5, // 50% backup
      upsCapacityMW: totalPeakMW * 0.1, // 10% UPS
    },
    annualEnergyMWh: Math.round(annualEnergyMWh),
    costEstimates: {
      annualEnergyCost: Math.round(annualEnergyCost),
      demandChargeCost: Math.round(demandChargeCost),
      peakShavingSavings: Math.round(peakShavingSavings),
    },
  };
}


/**
 * Calculate Airport Power - Simple Interface for Landing Pages
 * 
 * SSOT wrapper function that provides a simplified interface for landing
 * pages while using the comprehensive equipment-based calculation internally.
 * 
 * @param input - Simple airport parameters
 * @returns Simple result with key metrics
 */
export function calculateAirportPowerSimple(
  input: AirportPowerSimpleInput
): AirportPowerSimpleResult {
  const detailedResult = calculateAirportPowerFromEquipment(input);
  
  return {
    peakMW: detailedResult.totalPeakMW,
    avgMW: detailedResult.avgDemandMW,
    classification: detailedResult.classification,
    bessRecommendationMWh: detailedResult.bessRecommendation.sizeMWh.typical,
    annualEnergyCostEstimate: detailedResult.costEstimates.annualEnergyCost,
  };
}


// ============================================================================
// OFFICE BUILDING - Simple Calculation Functions
// ============================================================================

export interface OfficePowerSimpleInput {
  sqFt: number;
  classification?: OfficeClassification;
  occupants?: number;
  electricityRate?: number;
}

export interface OfficePowerSimpleResult {
  peakKW: number;
  avgKW: number;
  classification: OfficeClassification;
  bessRecommendationKWh: number;
  annualEnergyCostEstimate: number;
}

function determineOfficeClassification(sqFt: number): OfficeClassification {
  if (sqFt >= 1000000) return 'corporateCampus';
  if (sqFt >= 500000) return 'highRiseTower';
  if (sqFt >= 150000) return 'largeOffice';
  if (sqFt >= 50000) return 'mediumOffice';
  return 'smallOffice';
}

/**
 * Calculate Office Building Power - Simple Interface
 * Uses W/sq ft benchmarks from CBECS 2018 and ENERGY STAR
 */
export function calculateOfficePowerSimple(input: OfficePowerSimpleInput): OfficePowerSimpleResult {
  const { sqFt, electricityRate = 0.12 } = input;
  
  const classification = input.classification || determineOfficeClassification(sqFt);
  const profile = OFFICE_BUILDING_CLASSIFICATIONS[classification];
  const bessProfile = OFFICE_BESS_SIZING[classification];
  
  // Calculate peak using W/sq ft
  const peakKW = (sqFt * profile.wPerSqFt.typical) / 1000;
  const avgKW = peakKW * profile.loadFactor;
  
  // Annual energy
  const annualKWh = avgKW * 8760;
  const annualEnergyCost = annualKWh * electricityRate;
  
  // BESS recommendation (typical value in kWh)
  const bessKWh = ((bessProfile.sizeMWh.min + bessProfile.sizeMWh.max) / 2) * 1000;
  
  return {
    peakKW: Math.round(peakKW),
    avgKW: Math.round(avgKW),
    classification,
    bessRecommendationKWh: Math.round(bessKWh),
    annualEnergyCostEstimate: Math.round(annualEnergyCost),
  };
}


// ============================================================================
// UNIVERSITY/CAMPUS - Simple Calculation Functions
// ============================================================================

export interface UniversityPowerSimpleInput {
  enrollment: number;
  classification?: UniversityClassification;
  campusSqFt?: number;
  electricityRate?: number;
}

export interface UniversityPowerSimpleResult {
  peakMW: number;
  avgMW: number;
  classification: UniversityClassification;
  bessRecommendationMWh: number;
  annualEnergyCostEstimate: number;
}

function determineUniversityClassification(enrollment: number): UniversityClassification {
  if (enrollment >= 60000) return 'megaUniversity';
  if (enrollment >= 35000) return 'majorResearch';
  if (enrollment >= 15000) return 'largeUniversity';
  if (enrollment >= 5000) return 'mediumUniversity';
  return 'smallCollege';
}

/**
 * Calculate University/Campus Power - Simple Interface
 * Uses kW/student benchmarks from APPA and EPA ENERGY STAR
 */
export function calculateUniversityPowerSimple(input: UniversityPowerSimpleInput): UniversityPowerSimpleResult {
  const { enrollment, electricityRate = 0.10 } = input;
  
  const classification = input.classification || determineUniversityClassification(enrollment);
  const profile = UNIVERSITY_CLASSIFICATIONS[classification];
  const bessProfile = UNIVERSITY_BESS_SIZING[classification];
  
  // Calculate peak using kW/student
  const peakMW = (enrollment * profile.kWPerStudent.typical) / 1000;
  const avgMW = peakMW * profile.loadFactor;
  
  // Annual energy
  const annualMWh = avgMW * 8760;
  const annualEnergyCost = annualMWh * 1000 * electricityRate;
  
  // BESS recommendation (typical value)
  const bessMWh = (bessProfile.sizeMWh.min + bessProfile.sizeMWh.max) / 2;
  
  return {
    peakMW: Math.round(peakMW * 100) / 100,
    avgMW: Math.round(avgMW * 100) / 100,
    classification,
    bessRecommendationMWh: Math.round(bessMWh),
    annualEnergyCostEstimate: Math.round(annualEnergyCost),
  };
}


/**
 * Calculate power requirement for Manufacturing Facility
 * Source: CBECS 2018, industrial energy benchmarks
 * 
 * @param sqFt - Facility square footage
 * @param industryType - Type of manufacturing (optional)
 * @returns Power in MW
 */
export function calculateManufacturingPower(
  sqFt: number,
  industryType?: string
): PowerCalculationResult {
  // Peak demand varies widely: 10-25 W/sq ft
  // Default to 15 W/sq ft (moderate manufacturing at peak)
  let wattsPerSqFt = POWER_DENSITY_STANDARDS.manufacturing; // 15 W/sq ft
  
  // Adjust by industry type if provided
  if (industryType) {
    switch (industryType.toLowerCase()) {
      case 'light': wattsPerSqFt = 10.0; break;      // Assembly, packaging
      case 'heavy': wattsPerSqFt = 25.0; break;      // Foundry, heavy machinery
      case 'electronics': wattsPerSqFt = 18.0; break; // Clean rooms, precision
      case 'food': wattsPerSqFt = 15.0; break;        // Processing, refrigeration
    }
  }
  
  const powerKW = (sqFt * wattsPerSqFt) / 1000;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.1, Math.round(powerMW * 100) / 100), // Min 100kW
    durationHrs: 4,
    description: `Manufacturing: ${sqFt.toLocaleString()} sq ft × ${wattsPerSqFt} W/sqft peak = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'CBECS industrial peak demand',
    inputs: { sqFt, wattsPerSqFt, industryType }
  };
}

/**
 * Calculate power requirement for Warehouse/Logistics
 * Source: CBECS 2018
 * 
 * @param sqFt - Warehouse square footage
 * @param isColdStorage - Whether it's refrigerated
 * @returns Power in MW
 */
export function calculateWarehousePower(
  sqFt: number,
  isColdStorage: boolean = false
): PowerCalculationResult {
  // Peak demand:
  // Standard warehouse: 2 W/sq ft (forklifts charging, dock doors, lighting, HVAC peak)
  // Cold storage: 8 W/sq ft (all compressors running at peak load)
  const wattsPerSqFt = isColdStorage ? POWER_DENSITY_STANDARDS.coldStorage : POWER_DENSITY_STANDARDS.warehouse;
  const powerKW = (sqFt * wattsPerSqFt) / 1000;
  const powerMW = powerKW / 1000;
  
  const type = isColdStorage ? 'Cold Storage' : 'Warehouse';
  
  return {
    powerMW: Math.max(0.05, Math.round(powerMW * 100) / 100), // Min 50kW
    durationHrs: isColdStorage ? 8 : 4, // Cold storage needs longer backup
    description: `${type}: ${sqFt.toLocaleString()} sq ft × ${wattsPerSqFt} W/sqft = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'CBECS warehouse/storage benchmark',
    inputs: { sqFt, wattsPerSqFt, isColdStorage }
  };
}

/**
 * Calculate power requirement for Retail
 * Source: Energy Star, CBECS 2018
 * 
 * @param sqFt - Retail square footage
 * @returns Power in MW
 */
export function calculateRetailPower(sqFt: number): PowerCalculationResult {
  // Peak demand: 8 W/sq ft (full lighting, HVAC at peak, POS systems)
  const wattsPerSqFt = POWER_DENSITY_STANDARDS.retail; // 8.0 W/sq ft
  const powerKW = (sqFt * wattsPerSqFt) / 1000;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.02, Math.round(powerMW * 100) / 100), // Min 20kW
    durationHrs: 4,
    description: `Retail: ${sqFt.toLocaleString()} sq ft × ${wattsPerSqFt} W/sqft peak = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'CBECS retail peak demand (8 W/sq ft)',
    inputs: { sqFt, wattsPerSqFt }
  };
}

/**
 * Calculate power requirement for Shopping Center/Mall
 * Source: CBECS 2018
 * 
 * @param sqFt - Total retail square footage
 * @returns Power in MW
 */
export function calculateShoppingCenterPower(sqFt: number): PowerCalculationResult {
  // Peak demand: 10 W/sq ft (multiple stores, common areas, HVAC, food court)
  const wattsPerSqFt = POWER_DENSITY_STANDARDS.shoppingCenter; // 10.0 W/sq ft
  const powerKW = (sqFt * wattsPerSqFt) / 1000;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.1, Math.round(powerMW * 100) / 100), // Min 100kW
    durationHrs: 4,
    description: `Shopping Center: ${sqFt.toLocaleString()} sq ft × ${wattsPerSqFt} W/sqft peak = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'CBECS mall peak demand (10 W/sq ft)',
    inputs: { sqFt, wattsPerSqFt }
  };
}

/**
 * Calculate power requirement for Agriculture
 * Source: USDA, agricultural extension services
 * 
 * @param acres - Farm acreage
 * @param irrigationKW - Irrigation pump load (optional)
 * @param farmType - Type of farming operation
 * @returns Power in MW
 */
export function calculateAgriculturePower(
  acres: number,
  irrigationKW?: number,
  farmType?: string
): PowerCalculationResult {
  // Peak power by farm type (kW per acre) - when all pumps running
  let kWPerAcre = POWER_DENSITY_STANDARDS.agriculturePerAcre; // 0.6 kW/acre default
  
  if (farmType) {
    switch (farmType.toLowerCase()) {
      case 'row-crop': kWPerAcre = 0.4; break;       // Seasonal irrigation peak
      case 'dairy': kWPerAcre = 1.2; break;          // Milk cooling, ventilation at peak
      case 'greenhouse': kWPerAcre = 8.0; break;     // Climate control at full
      case 'orchard': kWPerAcre = 0.5; break;        // Irrigation + processing peak
      case 'vineyard': kWPerAcre = 0.4; break;       // Irrigation + winery peak
      case 'processing': kWPerAcre = 1.5; break;     // All processing equipment running
      case 'mixed': kWPerAcre = 0.8; break;          // Combined operations peak
    }
  }
  
  let powerKW = acres * kWPerAcre;
  
  // Add irrigation load if specified (this is the big one for farms)
  if (irrigationKW && irrigationKW > 0) {
    powerKW += irrigationKW;
  }
  
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.05, Math.round(powerMW * 100) / 100), // Min 50kW
    durationHrs: 4,
    description: `Agriculture: ${acres.toLocaleString()} acres × ${kWPerAcre} kW/acre${irrigationKW ? ` + ${irrigationKW}kW irrigation` : ''} = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'USDA agricultural peak demand',
    inputs: { acres, kWPerAcre, irrigationKW, farmType }
  };
}

/**
 * Calculate power requirement for Casino/Gaming
 * Source: Gaming industry benchmarks
 * 
 * @param gamingFloorSqFt - Gaming floor square footage
 * @returns Power in MW
 */
export function calculateCasinoPower(gamingFloorSqFt: number): PowerCalculationResult {
  // Peak demand: 18 W/sq ft (24/7 operation, all gaming machines + HVAC at peak)
  const wattsPerSqFt = POWER_DENSITY_STANDARDS.casino; // 18 W/sq ft
  const powerKW = (gamingFloorSqFt * wattsPerSqFt) / 1000;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.2, Math.round(powerMW * 100) / 100), // Min 200kW
    durationHrs: 4,
    description: `Casino: ${gamingFloorSqFt.toLocaleString()} sq ft × ${wattsPerSqFt} W/sqft peak = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'Gaming industry peak demand (18 W/sq ft)',
    inputs: { gamingFloorSqFt, wattsPerSqFt }
  };
}

/**
 * Calculate power requirement for Indoor Farm/Vertical Farm
 * Source: Controlled environment agriculture benchmarks
 * 
 * @param growingAreaSqFt - Growing area square footage
 * @param ledWattagePerSqFt - LED lighting density (default 40 W/sq ft)
 * @returns Power in MW
 */
export function calculateIndoorFarmPower(
  growingAreaSqFt: number,
  ledWattagePerSqFt: number = 50
): PowerCalculationResult {
  // Peak demand: LED lights at full + HVAC/dehumidification peak
  // Base LED: 40-60 W/sq ft (use 50 default)
  // Add 30% for HVAC/dehumidification at peak
  const totalWattsPerSqFt = ledWattagePerSqFt * 1.30;
  const powerKW = (growingAreaSqFt * totalWattsPerSqFt) / 1000;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.1, Math.round(powerMW * 100) / 100), // Min 100kW
    durationHrs: 6, // Longer for plant growth cycles
    description: `Indoor Farm: ${growingAreaSqFt.toLocaleString()} sq ft × ${totalWattsPerSqFt.toFixed(1)} W/sqft peak = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'CEA industry peak demand (LED + 30% HVAC)',
    inputs: { growingAreaSqFt, ledWattagePerSqFt, totalWattsPerSqFt }
  };
}

/**
 * Calculate power requirement for Apartment Complex
 * Source: RECS (Residential Energy Consumption Survey)
 * 
 * @param unitCount - Number of apartment units
 * @param avgUnitSqFt - Average unit size (default 900 sq ft)
 * @returns Power in MW
 */
export function calculateApartmentPower(
  unitCount: number,
  avgUnitSqFt: number = 900
): PowerCalculationResult {
  // Average apartment: 1.5 kW per unit (shared common areas, individual HVAC)
  // Plus 0.3 kW/unit for common areas (hallways, lobby, laundry, parking)
  const kWPerUnit = 1.8;
  const powerKW = unitCount * kWPerUnit;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.05, Math.round(powerMW * 100) / 100), // Min 50kW
    durationHrs: 4,
    description: `Apartments: ${unitCount} units × ${kWPerUnit} kW/unit = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'RECS multifamily benchmark (1.8 kW/unit)',
    inputs: { unitCount, kWPerUnit, avgUnitSqFt }
  };
}

/**
 * Calculate power requirement for College/University
 * Source: AASHE (Association for the Advancement of Sustainability in Higher Education)
 * 
 * @param studentCount - Student enrollment
 * @returns Power in MW
 */
export function calculateCollegePower(studentCount: number): PowerCalculationResult {
  // Industry standard: ~0.5 kW per student
  // Includes classrooms, dorms, labs, dining, athletics
  const kWPerStudent = 0.5;
  const powerKW = studentCount * kWPerStudent;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.2, Math.round(powerMW * 100) / 100), // Min 200kW
    durationHrs: 4,
    description: `College: ${studentCount.toLocaleString()} students × ${kWPerStudent} kW/student = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'AASHE higher education benchmark (0.5 kW/student)',
    inputs: { studentCount, kWPerStudent }
  };
}

/**
 * Calculate power requirement for Car Wash
 * Source: International Carwash Association
 * 
 * @param bayCount - Number of wash bays
 * @param washType - Type of car wash
 * @returns Power in MW
 */
/**
 * Car wash equipment power from BESS Sizing Questionnaire
 * ══════════════════════════════════════════════════════════════════════════════
 * SSOT for equipment power ratings - based on actual car wash equipment specs
 * Source: Car Wash Equipment Specification Sheet (BESS Sizing Questionnaire)
 * ══════════════════════════════════════════════════════════════════════════════
 */

// Facility Type benchmarks (from spec sheet Section 1)
export const CAR_WASH_FACILITY_TYPES = {
  singleBayAutomatic: {
    name: 'Single-Bay Automatic',
    connected: { min: 75, max: 150 },   // kW
    peak: { min: 50, max: 100 },        // kW
    avgOperating: { min: 30, max: 60 }, // kW
  },
  expressTunnelStandard: {
    name: 'Express Tunnel (Standard)',
    connected: { min: 200, max: 400 },
    peak: { min: 150, max: 300 },
    avgOperating: { min: 80, max: 150 },
  },
  expressTunnelAdvanced: {
    name: 'Express Tunnel (Advanced/Robotic)',
    connected: { min: 350, max: 600 },
    peak: { min: 250, max: 450 },
    avgOperating: { min: 120, max: 250 },
  },
  fullServiceTunnel: {
    name: 'Full-Service Tunnel',
    connected: { min: 400, max: 700 },
    peak: { min: 300, max: 500 },
    avgOperating: { min: 150, max: 300 },
  },
  multiBaySelfService: {
    name: 'Multi-Bay Self-Service (4-6 bays)',
    connected: { min: 100, max: 200 },
    peak: { min: 60, max: 120 },
    avgOperating: { min: 40, max: 80 },
  },
} as const;

// Equipment power specs (from spec sheet Sections 2-4)
export const CAR_WASH_EQUIPMENT_POWER_DB = {
  // Section 2.1: Conveyor & Drive Systems
  chainConveyorMotor: { min: 3.7, max: 7.5, typical: 5.5 },      // 5-10 HP
  beltConveyorSystem: { min: 2.2, max: 5.6, typical: 3.7 },      // 3-7.5 HP
  entranceExitRollers: { min: 0.75, max: 2.2, typical: 1.5 },    // 1-3 HP
  
  // Section 2.2: Water Systems
  highPressurePump: { min: 7.5, max: 18.6, typical: 11 },        // 10-25 HP, 1000-1500 PSI
  boosterPump: { min: 3.7, max: 11, typical: 7.5 },              // 5-15 HP
  waterHeaterElectric: { min: 50, max: 150, typical: 75 },       // Major load!
  reclaimRecyclingSystem: { min: 2.2, max: 3.7, typical: 3 },    // 3-5 HP
  spotFreeRinseRO: { min: 2, max: 5, typical: 3 },               // Reverse osmosis
  
  // Section 2.3: Wash Equipment
  rotatingBrushMitter: { min: 1.5, max: 3.7, typical: 2.5 },     // 2-5 HP each
  highPressureArch: { min: 3.7, max: 7.5, typical: 5.5 },        // 5-10 HP
  foamApplicator: { min: 0.75, max: 2.2, typical: 1.5 },         // 1-3 HP
  triplefoamSystem: { min: 0.75, max: 1.5, typical: 1 },         // 1-2 HP
  wheelBlasterTireCleaner: { min: 1.5, max: 3.7, typical: 2.5 }, // 2-5 HP
  
  // Section 2.4: Drying Systems
  blowerDryerMotor: { min: 11, max: 22, typical: 15 },           // 15-30 HP each, 2-6 per tunnel
  heatedDryerElement: { min: 20, max: 50, typical: 30 },         // Supplemental heat
  sideDryers: { min: 7.5, max: 15, typical: 11 },                // 10-20 HP each
  
  // Section 3.1: Robotic Wash Systems
  roboticWashArm: { min: 2.2, max: 3.7, typical: 3 },            // 3-5 HP/axis
  positioningSystem: { min: 5, max: 10, typical: 7 },            // Multi-axis control
  ultrasonicSensorArray: { min: 0.5, max: 1, typical: 0.75 },    // Vehicle profiling
  laserProfilingSystem: { min: 0.3, max: 0.5, typical: 0.4 },    // Precision mapping
  
  // Section 3.2: Smart Controls & Automation
  plcAutomationController: { min: 0.5, max: 2, typical: 1 },     // Main control
  vehicleDetectionSystem: { min: 0.3, max: 1, typical: 0.5 },    // Entry/exit sensing
  licensePlateRecognition: { min: 0.2, max: 0.5, typical: 0.3 }, // Customer ID
  paymentKiosk: { min: 0.3, max: 0.5, typical: 0.4 },            // Self-service
  precisionChemicalMetering: { min: 1, max: 2, typical: 1.5 },   // Automated delivery
  heatedChemicalTanks: { min: 5, max: 10, typical: 7 },          // Temp-controlled
  
  // Section 4: Facility Support Systems
  ledTunnelLighting: { min: 5, max: 15, typical: 10 },           // Interior illumination
  hvacClimateControl: { min: 10, max: 30, typical: 15 },         // Building conditioning
  vacuumIsland: { min: 2.2, max: 3.7, typical: 3 },              // 3-5 HP per station
  airCompressor: { min: 3.7, max: 11, typical: 7.5 },            // 5-15 HP
  securitySurveillance: { min: 0.5, max: 1, typical: 0.75 },     // Cameras & monitoring
} as const;

/**
 * Default equipment counts by facility type
 * Based on typical installations from the spec sheet
 */
export const CAR_WASH_EQUIPMENT_DEFAULTS = {
  singleBayAutomatic: {
    chainConveyorMotor: 0,
    beltConveyorSystem: 0,
    entranceExitRollers: 1,
    highPressurePump: 1,
    boosterPump: 0,
    waterHeaterElectric: 0,  // Often gas or none
    reclaimRecyclingSystem: 1,
    spotFreeRinseRO: 1,
    rotatingBrushMitter: 4,  // Top, sides
    highPressureArch: 1,
    foamApplicator: 1,
    triplefoamSystem: 1,
    wheelBlasterTireCleaner: 1,
    blowerDryerMotor: 2,
    heatedDryerElement: 0,
    sideDryers: 0,
    plcAutomationController: 1,
    vehicleDetectionSystem: 1,
    paymentKiosk: 1,
    ledTunnelLighting: 1,
    hvacClimateControl: 0,
    vacuumIsland: 2,
    airCompressor: 1,
    securitySurveillance: 1,
  },
  expressTunnelStandard: {
    chainConveyorMotor: 2,
    beltConveyorSystem: 0,
    entranceExitRollers: 2,
    highPressurePump: 2,
    boosterPump: 1,
    waterHeaterElectric: 1,
    reclaimRecyclingSystem: 1,
    spotFreeRinseRO: 1,
    rotatingBrushMitter: 6,
    highPressureArch: 2,
    foamApplicator: 2,
    triplefoamSystem: 1,
    wheelBlasterTireCleaner: 2,
    blowerDryerMotor: 4,  // 2-6 units typical
    heatedDryerElement: 1,
    sideDryers: 2,
    plcAutomationController: 1,
    vehicleDetectionSystem: 2,
    paymentKiosk: 2,
    ledTunnelLighting: 1,
    hvacClimateControl: 1,
    vacuumIsland: 6,
    airCompressor: 1,
    securitySurveillance: 1,
  },
  expressTunnelAdvanced: {
    chainConveyorMotor: 2,
    beltConveyorSystem: 1,
    entranceExitRollers: 2,
    highPressurePump: 2,
    boosterPump: 2,
    waterHeaterElectric: 1,
    reclaimRecyclingSystem: 1,
    spotFreeRinseRO: 1,
    rotatingBrushMitter: 8,
    highPressureArch: 3,
    foamApplicator: 2,
    triplefoamSystem: 1,
    wheelBlasterTireCleaner: 2,
    blowerDryerMotor: 6,
    heatedDryerElement: 2,
    sideDryers: 4,
    roboticWashArm: 2,
    positioningSystem: 1,
    ultrasonicSensorArray: 1,
    laserProfilingSystem: 1,
    plcAutomationController: 1,
    vehicleDetectionSystem: 2,
    licensePlateRecognition: 1,
    paymentKiosk: 2,
    precisionChemicalMetering: 1,
    heatedChemicalTanks: 1,
    ledTunnelLighting: 1,
    hvacClimateControl: 1,
    vacuumIsland: 8,
    airCompressor: 1,
    securitySurveillance: 1,
  },
  fullServiceTunnel: {
    chainConveyorMotor: 3,
    beltConveyorSystem: 1,
    entranceExitRollers: 3,
    highPressurePump: 3,
    boosterPump: 2,
    waterHeaterElectric: 2,
    reclaimRecyclingSystem: 1,
    spotFreeRinseRO: 1,
    rotatingBrushMitter: 10,
    highPressureArch: 3,
    foamApplicator: 3,
    triplefoamSystem: 2,
    wheelBlasterTireCleaner: 2,
    blowerDryerMotor: 6,
    heatedDryerElement: 2,
    sideDryers: 4,
    roboticWashArm: 2,
    positioningSystem: 1,
    plcAutomationController: 1,
    vehicleDetectionSystem: 2,
    licensePlateRecognition: 1,
    paymentKiosk: 3,
    precisionChemicalMetering: 1,
    heatedChemicalTanks: 2,
    ledTunnelLighting: 1,
    hvacClimateControl: 1,
    vacuumIsland: 10,
    airCompressor: 2,
    securitySurveillance: 1,
  },
  multiBaySelfService: {
    // Per bay values - will be multiplied by bay count
    entranceExitRollers: 0,
    highPressurePump: 1,  // 1 per 2 bays typically
    boosterPump: 0,
    waterHeaterElectric: 0,
    reclaimRecyclingSystem: 1,  // Shared
    spotFreeRinseRO: 1,         // Shared
    foamApplicator: 1,          // Per bay
    ledTunnelLighting: 1,       // Shared
    vacuumIsland: 1,            // Per bay
    airCompressor: 1,           // Shared
    securitySurveillance: 1,    // Shared
  },
} as const;

export interface CarWashEquipmentInput {
  bayCount: number;
  washType: 'singleBayAutomatic' | 'expressTunnelStandard' | 'expressTunnelAdvanced' | 'fullServiceTunnel' | 'multiBaySelfService';
  // Optional equipment overrides (if user specifies exact counts)
  equipment?: Partial<Record<keyof typeof CAR_WASH_EQUIPMENT_POWER_DB, number>>;
  hasVacuums?: boolean;
  hasDryers?: boolean;
  hasWaterHeater?: boolean;
  hasRobotics?: boolean;
}

/**
 * Calculate car wash power using REAL equipment specs from BESS Sizing Questionnaire
 * This is the SSOT calculation based on actual car wash equipment
 */
export function calculateCarWashPowerFromEquipment(input: CarWashEquipmentInput): PowerCalculationResult {
  const { 
    bayCount, 
    washType, 
    equipment: overrides,
    hasVacuums = true, 
    hasDryers = true,
    hasWaterHeater = true,
    hasRobotics = false,
  } = input;
  
  const power = CAR_WASH_EQUIPMENT_POWER_DB;
  const facilityType = CAR_WASH_FACILITY_TYPES[washType];
  const defaults = CAR_WASH_EQUIPMENT_DEFAULTS[washType] || CAR_WASH_EQUIPMENT_DEFAULTS.expressTunnelStandard;
  
  // Calculate total connected load from equipment
  let totalConnectedKW = 0;
  const breakdown: Record<string, number> = {};
  
  // Helper to get equipment count (override or default)
  const getCount = (key: string): number => {
    if (overrides && key in overrides) return overrides[key as keyof typeof overrides] || 0;
    return (defaults as any)[key] || 0;
  };
  
  // Conveyor & Drive Systems
  breakdown['conveyors'] = 
    getCount('chainConveyorMotor') * power.chainConveyorMotor.typical +
    getCount('beltConveyorSystem') * power.beltConveyorSystem.typical +
    getCount('entranceExitRollers') * power.entranceExitRollers.typical;
  
  // Water Systems
  breakdown['waterPumps'] = 
    getCount('highPressurePump') * power.highPressurePump.typical +
    getCount('boosterPump') * power.boosterPump.typical +
    getCount('reclaimRecyclingSystem') * power.reclaimRecyclingSystem.typical +
    getCount('spotFreeRinseRO') * power.spotFreeRinseRO.typical;
  
  if (hasWaterHeater) {
    breakdown['waterHeater'] = getCount('waterHeaterElectric') * power.waterHeaterElectric.typical;
  }
  
  // Wash Equipment
  breakdown['washEquipment'] = 
    getCount('rotatingBrushMitter') * power.rotatingBrushMitter.typical +
    getCount('highPressureArch') * power.highPressureArch.typical +
    getCount('foamApplicator') * power.foamApplicator.typical +
    getCount('triplefoamSystem') * power.triplefoamSystem.typical +
    getCount('wheelBlasterTireCleaner') * power.wheelBlasterTireCleaner.typical;
  
  // Drying Systems
  if (hasDryers) {
    breakdown['drying'] = 
      getCount('blowerDryerMotor') * power.blowerDryerMotor.typical +
      getCount('heatedDryerElement') * power.heatedDryerElement.typical +
      getCount('sideDryers') * power.sideDryers.typical;
  }
  
  // Robotic Systems (if advanced)
  if (hasRobotics || washType === 'expressTunnelAdvanced') {
    breakdown['robotics'] = 
      getCount('roboticWashArm') * power.roboticWashArm.typical +
      getCount('positioningSystem') * power.positioningSystem.typical +
      (getCount('ultrasonicSensorArray') || 0) * power.ultrasonicSensorArray.typical +
      (getCount('laserProfilingSystem') || 0) * power.laserProfilingSystem.typical;
  }
  
  // Controls & Automation
  breakdown['controls'] = 
    getCount('plcAutomationController') * power.plcAutomationController.typical +
    getCount('vehicleDetectionSystem') * power.vehicleDetectionSystem.typical +
    (getCount('licensePlateRecognition') || 0) * power.licensePlateRecognition.typical +
    getCount('paymentKiosk') * power.paymentKiosk.typical +
    (getCount('precisionChemicalMetering') || 0) * power.precisionChemicalMetering.typical +
    (getCount('heatedChemicalTanks') || 0) * power.heatedChemicalTanks.typical;
  
  // Facility Support
  breakdown['lighting'] = getCount('ledTunnelLighting') * power.ledTunnelLighting.typical;
  breakdown['hvac'] = getCount('hvacClimateControl') * power.hvacClimateControl.typical;
  breakdown['airCompressor'] = getCount('airCompressor') * power.airCompressor.typical;
  breakdown['security'] = getCount('securitySurveillance') * power.securitySurveillance.typical;
  
  // Vacuum Islands
  if (hasVacuums) {
    const vacuumCount = washType === 'multiBaySelfService' ? bayCount : getCount('vacuumIsland');
    breakdown['vacuums'] = vacuumCount * power.vacuumIsland.typical;
  }
  
  // Sum all categories
  totalConnectedKW = Object.values(breakdown).reduce((sum, kw) => sum + (kw || 0), 0);
  
  // For multi-bay self-service, scale certain equipment by bay count
  if (washType === 'multiBaySelfService') {
    // Pumps shared (1 per 2 bays), foam per bay
    const scaledPumps = Math.ceil(bayCount / 2) * power.highPressurePump.typical;
    const scaledFoam = bayCount * power.foamApplicator.typical;
    totalConnectedKW = scaledPumps + scaledFoam + breakdown['vacuums'] + 
      power.reclaimRecyclingSystem.typical + power.spotFreeRinseRO.typical +
      power.ledTunnelLighting.typical + power.airCompressor.typical + power.securitySurveillance.typical;
  }
  
  // Peak demand is typically 70-80% of connected load
  const peakDemandKW = Math.round(totalConnectedKW * 0.75);
  const powerMW = peakDemandKW / 1000;
  
  // Validate against facility type benchmarks
  const facilityPeak = facilityType.peak;
  const validatedPeakKW = Math.max(facilityPeak.min, Math.min(facilityPeak.max, peakDemandKW));
  
  // Build description with top power consumers
  const sortedBreakdown = Object.entries(breakdown)
    .filter(([_, kw]) => kw > 5)
    .sort((a, b) => b[1] - a[1]);
  
  const topConsumers = sortedBreakdown.slice(0, 3).map(([name, kw]) => `${name}: ${kw.toFixed(0)}kW`).join(', ');
  
  const description = `${facilityType.name}: ${topConsumers} → ${validatedPeakKW} kW peak (${totalConnectedKW.toFixed(0)} kW connected)`;
  
  console.log('🚗 [calculateCarWashPowerFromEquipment] Detailed breakdown:', {
    washType,
    bayCount,
    facilityType: facilityType.name,
    breakdown,
    totalConnectedKW,
    peakDemandKW,
    validatedPeakKW,
    facilityBenchmark: facilityPeak,
  });
  
  return {
    powerMW: Math.max(0.05, Math.round((validatedPeakKW / 1000) * 100) / 100),
    durationHrs: 2, // Peak shaving focus - car washes have short, intense peaks
    description,
    calculationMethod: 'BESS Sizing Questionnaire equipment specs',
    inputs: { bayCount, washType, breakdown, totalConnectedKW, peakDemandKW: validatedPeakKW },
  };
}

export function calculateCarWashPower(
  bayCount: number,
  washType?: string,
  options?: {
    hasVacuums?: boolean;
    hasDryers?: boolean;
    hasWaterHeater?: boolean;
    hasRobotics?: boolean;
    dailyVehicles?: number;
    equipment?: CarWashEquipmentInput['equipment'];
  }
): PowerCalculationResult {
  // ═══════════════════════════════════════════════════════════════════════════
  // CAR WASH POWER CALCULATION - Using BESS Sizing Questionnaire Equipment Specs
  // Source: Car Wash Equipment Specification Sheet
  // 
  // Facility Type Benchmarks:
  // - Single-Bay Automatic:        50-100 kW peak
  // - Express Tunnel (Standard):   150-300 kW peak
  // - Express Tunnel (Advanced):   250-450 kW peak
  // - Full-Service Tunnel:         300-500 kW peak
  // - Multi-Bay Self-Service:      60-120 kW peak
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Map string wash type to facility type
  const effectiveType = washType?.toLowerCase() || 'tunnel';
  let mappedType: CarWashEquipmentInput['washType'];
  
  switch (effectiveType) {
    case 'self-service':
    case 'selfservice':
    case 'multi-bay':
      mappedType = 'multiBaySelfService';
      break;
    case 'automatic':
    case 'in-bay':
    case 'inbay':
    case 'single-bay':
      mappedType = 'singleBayAutomatic';
      break;
    case 'tunnel':
    case 'express':
    case 'express-tunnel':
      mappedType = 'expressTunnelStandard';
      break;
    case 'advanced':
    case 'robotic':
    case 'express-advanced':
      mappedType = 'expressTunnelAdvanced';
      break;
    case 'full-service':
    case 'fullservice':
      mappedType = 'fullServiceTunnel';
      break;
    default:
      // Default to express tunnel for commercial BESS customers
      mappedType = 'expressTunnelStandard';
  }
  
  return calculateCarWashPowerFromEquipment({
    bayCount,
    washType: mappedType,
    equipment: options?.equipment,
    hasVacuums: options?.hasVacuums,
    hasDryers: options?.hasDryers,
    hasWaterHeater: options?.hasWaterHeater,
    hasRobotics: options?.hasRobotics,
  });
}

/**
 * Calculate power requirement for Gas Station
 * Source: NACS (National Association of Convenience Stores)
 * 
 * @param dispenserCount - Number of fuel dispensers/pumps
 * @param hasConvenienceStore - Whether attached store exists
 * @param stationType - 'gas-only' | 'with-cstore' | 'truck-stop'
 * @returns Power calculation result
 */
export function calculateGasStationPower(
  dispenserCount: number,
  hasConvenienceStore: boolean = true,
  stationType: string = 'with-cstore'
): PowerCalculationResult {
  // Base pump power: 1.5-2 kW per dispenser
  // Truck stop diesel pumps: 2.5 kW (larger pumps, DEF dispensers)
  const isTrackStop = stationType === 'truck-stop';
  const kWPerDispenser = isTrackStop ? 2.5 : 1.5;
  const pumpPowerKW = dispenserCount * kWPerDispenser;
  
  // Convenience store power based on type:
  // - Gas only: 0 kW
  // - Small C-store: 10-15 kW (2,500 sq ft × 4-6 W/sq ft)
  // - Truck stop: 40-80 kW (8,000-15,000 sq ft + kitchen + showers + gaming)
  let storePowerKW = 0;
  if (hasConvenienceStore && stationType !== 'gas-only') {
    if (isTrackStop) {
      // Truck stops have large stores, restaurants, showers, laundry
      storePowerKW = 60 + (dispenserCount > 20 ? 40 : 0); // 60-100 kW
    } else {
      // Regular convenience store
      storePowerKW = 15; // ~3,000 sq ft × 5 W/sq ft
    }
  }
  
  const powerKW = pumpPowerKW + storePowerKW;
  const powerMW = powerKW / 1000;
  
  const stationLabel = isTrackStop ? 'Truck Stop' : 
                       hasConvenienceStore ? 'Gas Station + C-Store' : 'Gas Station';
  
  return {
    powerMW: Math.max(0.01, Math.round(powerMW * 100) / 100), // Min 10kW
    durationHrs: isTrackStop ? 6 : 4, // Truck stops need longer backup
    description: `${stationLabel}: ${dispenserCount} dispensers × ${kWPerDispenser} kW + ${storePowerKW} kW store = ${powerKW.toFixed(0)} kW`,
    calculationMethod: 'NACS fuel retail benchmark',
    inputs: { dispenserCount, hasConvenienceStore, stationType, pumpPowerKW, storePowerKW }
  };
}

/**
 * Calculate power requirement for Government/Public Building
 * Source: Federal Energy Management Program (FEMP)
 * 
 * @param sqFt - Building square footage
 * @returns Power in MW
 */
export function calculateGovernmentPower(sqFt: number): PowerCalculationResult {
  // Similar to office but with higher security/IT loads
  // Industry standard: 1.5 W/sq ft
  const wattsPerSqFt = 1.5;
  const powerKW = (sqFt * wattsPerSqFt) / 1000;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.02, Math.round(powerMW * 100) / 100), // Min 20kW
    durationHrs: 4,
    description: `Government: ${sqFt.toLocaleString()} sq ft × ${wattsPerSqFt} W/sqft = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'FEMP public building benchmark (1.5 W/sq ft)',
    inputs: { sqFt, wattsPerSqFt }
  };
}

/**
 * MASTER CALCULATION FUNCTION
 * Routes to appropriate calculator based on use case slug
 */
export function calculateUseCasePower(
  slug: string,
  useCaseData: Record<string, any>
): PowerCalculationResult {
  switch (slug) {
    case 'office':
    case 'office-building':
      // Database uses 'officeSqFt', code accepts multiple variants
      // DB default: 50,000 sqft
      return calculateOfficePower(
        parseInt(useCaseData.officeSqFt || useCaseData.squareFeet || useCaseData.buildingSqFt || useCaseData.sqFt) || 50000
      );
      
    case 'hotel':
    case 'hotel-hospitality':
      // Support multiple field names: roomCount, numberOfRooms, facilitySize (from wizard)
      // BUG FIX: wizard passes facilitySize for all industries, so accept it for hotels too
      const hotelRooms = parseInt(
        useCaseData.roomCount || 
        useCaseData.numberOfRooms || 
        useCaseData.facilitySize ||  // Wizard uses facilitySize generically
        useCaseData.rooms
      ) || 150;  // DB default: 150 rooms
      return calculateHotelPower(hotelRooms);
      
    case 'hospital': {
      // Base calculation from bed count
      const bedCount = parseInt(useCaseData.bedCount) || parseInt(useCaseData.beds) || 250;
      const baseResult = calculateHospitalPower(bedCount);
      
      // Add equipment-specific power loads
      // Equipment power values from ASHRAE healthcare standards
      let equipmentLoadKW = 0;
      let equipmentDetails: string[] = [];
      
      // Surgical suites: 30-50 kW each (lighting, equipment, HVAC)
      const surgicalSuites = parseInt(useCaseData.surgicalSuites) || parseInt(useCaseData.operatingRooms) || 0;
      if (surgicalSuites > 0) {
        const surgicalPower = surgicalSuites * 40; // 40 kW average per suite
        equipmentLoadKW += surgicalPower;
        equipmentDetails.push(`${surgicalSuites} surgical suites @ 40kW = ${surgicalPower}kW`);
      }
      
      // MRI machines: 50-150 kW each
      const hasMRI = useCaseData.hasMRI === true || useCaseData.hasMRI === 'true';
      const mriCount = parseInt(useCaseData.mriCount) || (hasMRI ? 1 : 0);
      if (mriCount > 0) {
        const mriPower = mriCount * 100; // 100 kW average per MRI
        equipmentLoadKW += mriPower;
        equipmentDetails.push(`${mriCount} MRI @ 100kW = ${mriPower}kW`);
      }
      
      // CT scanners: 80-120 kW each
      const hasCT = useCaseData.hasCT === true || useCaseData.hasCT === 'true' || 
                    useCaseData.hasCTScanners === true || useCaseData.hasCTScanners === 'true';
      const ctCount = parseInt(useCaseData.ctCount) || parseInt(useCaseData.ctScanners) || (hasCT ? 1 : 0);
      if (ctCount > 0) {
        const ctPower = ctCount * 100; // 100 kW average per CT
        equipmentLoadKW += ctPower;
        equipmentDetails.push(`${ctCount} CT scanners @ 100kW = ${ctPower}kW`);
      }
      
      // ICU beds: Higher power requirement (monitoring, life support)
      const icuBeds = parseInt(useCaseData.icuBeds) || 0;
      if (icuBeds > 0) {
        const icuPower = icuBeds * 2; // 2 kW additional per ICU bed (monitoring, ventilators)
        equipmentLoadKW += icuPower;
        equipmentDetails.push(`${icuBeds} ICU beds @ 2kW = ${icuPower}kW`);
      }
      
      // Calculate total
      const basePowerKW = baseResult.powerMW * 1000;
      const totalPowerKW = basePowerKW + equipmentLoadKW;
      const totalPowerMW = totalPowerKW / 1000;
      
      // Build description
      let description = baseResult.description;
      if (equipmentDetails.length > 0) {
        description += ` + Equipment: ${equipmentDetails.join(', ')}`;
      }
      
      console.log('🏥 [Hospital Power] Calculation:', {
        bedCount,
        basePowerKW,
        equipmentLoadKW,
        totalPowerKW,
        equipmentDetails
      });
      
      return {
        powerMW: Math.round(totalPowerMW * 100) / 100,
        durationHrs: baseResult.durationHrs,
        description,
        calculationMethod: baseResult.calculationMethod + (equipmentLoadKW > 0 ? ' + equipment loads' : ''),
        inputs: { bedCount, surgicalSuites, mriCount, ctCount, icuBeds, equipmentLoadKW }
      };
    }
      
    case 'datacenter':
    case 'data-center':
      // Database uses 'averageRackDensity' (Dec 2025), legacy: rackDensityKW
      console.log('🏢🏢🏢 [calculateUseCasePower] DATA CENTER CASE - useCaseData:', {
        itLoadKW: useCaseData.itLoadKW,
        rackCount: useCaseData.rackCount,
        averageRackDensity: useCaseData.averageRackDensity,
        rackDensityKW: useCaseData.rackDensityKW,
        allKeys: Object.keys(useCaseData)
      });
      return calculateDatacenterPower(
        parseInt(useCaseData.itLoadKW) || undefined,
        parseInt(useCaseData.rackCount) || undefined,
        parseFloat(useCaseData.averageRackDensity || useCaseData.rackDensityKW) || 8
      );
      
    case 'ev-charging':
    case 'ev-charging-station':
    case 'ev-charging-hub':
      // =========================================================================
      // EV CHARGING - Uses evChargingCalculations.ts for full power tiers
      // Supports: Level 2 (7kW/11kW/19kW/22kW), DCFC (50kW/150kW), HPC (250kW/350kW)
      // =========================================================================
      
      // Support both new granular config and legacy field names
      const evConfig = {
        // New granular fields (from advanced UI)
        level2_7kw: parseInt(useCaseData.level2_7kw) || 0,
        level2_11kw: parseInt(useCaseData.level2_11kw) || 0,
        level2_19kw: parseInt(useCaseData.level2_19kw) || 0,
        level2_22kw: parseInt(useCaseData.level2_22kw) || 0,
        dcfc_50kw: parseInt(useCaseData.dcfc_50kw) || 0,
        dcfc_150kw: parseInt(useCaseData.dcfc_150kw) || 0,
        hpc_250kw: parseInt(useCaseData.hpc_250kw) || 0,
        hpc_350kw: parseInt(useCaseData.hpc_350kw) || 0,
        // Legacy fields for backward compatibility - support ALL field name variants
        // Database uses: numberOfLevel1Chargers, numberOfLevel2Chargers, numberOfDCFastChargers
        level1Count: parseInt(useCaseData.numberOfLevel1Chargers || useCaseData.level1Count || useCaseData.level1Chargers || useCaseData.l1Count) || 0,
        level2Count: parseInt(useCaseData.numberOfLevel2Chargers || useCaseData.level2Count || useCaseData.level2Chargers || useCaseData.l2Count) || 0,
        dcFastCount: parseInt(useCaseData.numberOfDCFastChargers || useCaseData.dcFastCount || useCaseData.dcfastCount || useCaseData.dcFastChargers || useCaseData.dcfc) || 0,
      };
      
      // Check if using new granular config or legacy
      const hasGranularConfig = evConfig.level2_7kw > 0 || evConfig.level2_11kw > 0 || 
                                evConfig.dcfc_50kw > 0 || evConfig.hpc_250kw > 0 || evConfig.hpc_350kw > 0;
      
      if (hasGranularConfig) {
        // Use new comprehensive EV charging calculation
        // Import dynamically to avoid circular dependencies
        const { calculateEVHubPower } = require('./evChargingCalculations');
        const concurrency = parseInt(useCaseData.peakConcurrency) || 70;
        const evResult = calculateEVHubPower(evConfig, concurrency);
        
        if (import.meta.env.DEV) {
          console.log('🔌 [EV Hub Power] Using granular config:', {
            config: evConfig,
            result: evResult
          });
        }
        
        return {
          powerMW: evResult.peakDemandMW,
          durationHrs: 2,
          description: evResult.description,
          calculationMethod: evResult.calculationMethod,
          inputs: evConfig
        };
      }
      
      // Fall back to legacy calculation for simple configs
      // If ALL values are 0 (no user input), apply database defaults
      // DB defaults: numberOfDCFastChargers=8, numberOfLevel2Chargers=12
      const hasAnyChargerInput = evConfig.level1Count > 0 || evConfig.level2Count > 0 || evConfig.dcFastCount > 0;
      
      const evLevel1 = evConfig.level1Count;
      const evLevel2 = hasAnyChargerInput ? evConfig.level2Count : 12;  // DB default: 12
      const evDcFast = hasAnyChargerInput ? evConfig.dcFastCount : 8;   // DB default: 8
      
      // 🔌 DEBUG: Log all EV charging field lookups
      if (import.meta.env.DEV) {
        console.log('🔌 [EV Charging Power] Legacy field resolution:', {
          useCaseDataKeys: Object.keys(useCaseData || {}),
          resolved_level1: evLevel1,
          resolved_level2: evLevel2,
          resolved_dcFast: evDcFast,
          appliedDefaults: !hasAnyChargerInput
        });
      }
      
      return calculateEVChargingPower(evLevel1, evLevel2, evDcFast);
      
    case 'airport':
      // Convert raw passenger count to millions (user enters 1000000, we need 1.0)
      // DB default: 1 million passengers (small regional airport) - was 5M but too high for initial estimate
      const rawPassengers = parseFloat(useCaseData.annualPassengers || useCaseData.annual_passengers) || 1000000;
      const passengersInMillions = rawPassengers / 1000000;
      return calculateAirportPower(passengersInMillions);
      
    case 'manufacturing':
      // Database uses 'facilitySqFt', 'manufacturingType' (Dec 2025), legacy: squareFeet, industryType
      // DB default: 100,000 sqft
      return calculateManufacturingPower(
        parseInt(useCaseData.facilitySqFt || useCaseData.squareFeet || useCaseData.sqFt) || 100000,
        useCaseData.manufacturingType || useCaseData.industryType
      );
      
    case 'warehouse':
    case 'logistics':
    case 'logistics-center':
      // Database uses 'warehouseSqFt', code accepts multiple variants
      // DB default: 250,000 sqft
      return calculateWarehousePower(
        parseInt(useCaseData.warehouseSqFt || useCaseData.squareFeet || useCaseData.sqFt) || 250000,
        useCaseData.isColdStorage === true || useCaseData.warehouseType === 'cold-storage'
      );
      
    case 'cold-storage':
      // Cold storage has multiple inputs:
      // 1. Direct peak demand (kW) - most accurate if user knows it
      // 2. Refrigeration load (kW) - compressor capacity
      // 3. Square feet OR cubic feet (storageVolume)
      
      // If user provides refrigeration load directly, use it + 20% for other loads
      const refrigLoadKW = parseInt(useCaseData.refrigerationLoadKW || useCaseData.refrigerationLoad) || 0;
      const peakDemandKW = parseInt(useCaseData.peakDemandKW || useCaseData.peakElectricalDemand) || 0;
      
      if (peakDemandKW > 0) {
        // Direct peak demand provided - use it
        return {
          powerMW: Math.max(0.1, peakDemandKW / 1000),
          durationHrs: 8,
          description: `Cold Storage: User-specified peak ${peakDemandKW} kW`,
          calculationMethod: 'Direct user input',
          inputs: { peakDemandKW }
        };
      }
      
      if (refrigLoadKW > 0) {
        // Refrigeration load + 20% for lighting, dock doors, forklifts
        const totalKW = refrigLoadKW * 1.2;
        return {
          powerMW: Math.max(0.1, totalKW / 1000),
          durationHrs: 8,
          description: `Cold Storage: ${refrigLoadKW} kW refrigeration × 1.2 = ${totalKW.toFixed(0)} kW`,
          calculationMethod: 'Refrigeration load + 20% auxiliary',
          inputs: { refrigLoadKW }
        };
      }
      
      // Fall back to area-based calculation
      // storageVolume is in CUBIC FEET - convert to sqft (assume 30ft ceiling)
      const volumeCuFt = parseInt(useCaseData.storageVolume || useCaseData.coldStorageVolume) || 0;
      let effectiveSqFt = 0;
      if (volumeCuFt > 0) {
        effectiveSqFt = Math.round(volumeCuFt / 30); // 30ft average cold storage ceiling
      } else {
        effectiveSqFt = parseInt(useCaseData.squareFeet || useCaseData.sqFt) || 20000;
      }
      
      return calculateWarehousePower(effectiveSqFt, true);
      
    case 'retail':
    case 'retail-commercial':
      // Database uses 'squareFeet', UI variants: 'retailSqFt', 'sqFt'
      return calculateRetailPower(
        parseInt(useCaseData.squareFeet || useCaseData.retailSqFt || useCaseData.sqFt) || 5000
      );
      
    case 'shopping-center':
    case 'shopping-mall':
      // Database uses 'squareFeet', UI variants: 'retailSqFt', 'sqFt'
      return calculateShoppingCenterPower(
        parseInt(useCaseData.squareFeet || useCaseData.retailSqFt || useCaseData.sqFt) || 100000
      );
      
    case 'agriculture':
    case 'agricultural':
      return calculateAgriculturePower(
        parseInt(useCaseData.acreage || useCaseData.farmSize) || 500,
        parseInt(useCaseData.irrigationLoad) || undefined,
        useCaseData.farmType
      );
      
    case 'casino':
    case 'tribal-casino':
      // Support ALL field name variants for gaming floor size
      // DB default: 100,000 sqft gaming floor
      return calculateCasinoPower(
        parseInt(useCaseData.gamingFloorSqFt || useCaseData.gamingFloorSize || useCaseData.gamingSpaceSqFt || useCaseData.sqFt) || 100000
      );
      
    case 'indoor-farm':
      return calculateIndoorFarmPower(
        parseInt(useCaseData.growingAreaSqFt || useCaseData.sqFt) || 50000,
        parseFloat(useCaseData.ledWattagePerSqFt) || 40
      );
      
    case 'apartment':
    case 'apartments':
      return calculateApartmentPower(
        parseInt(useCaseData.unitCount || useCaseData.numUnits) || 400  // DB default: 400 units
      );
      
    case 'college':
    case 'university':
    case 'college-university':
      return calculateCollegePower(
        parseInt(useCaseData.studentCount || useCaseData.enrollment) || 15000
      );
      
    case 'car-wash':
      // Database uses 'bayCount', 'carWashType' (Dec 2025), legacy: washBays, washType
      // DB default: 4 bays, default type: tunnel (most common for BESS customers)
      return calculateCarWashPower(
        parseInt(useCaseData.bayCount || useCaseData.washBays || useCaseData.numBays || useCaseData.numberOfBays) || 4,
        useCaseData.carWashType || useCaseData.washType || 'tunnel',
        {
          hasVacuums: useCaseData.hasVacuums !== false,
          hasDryers: useCaseData.hasDryers !== false,
          dailyVehicles: parseInt(useCaseData.dailyVehicles || useCaseData.carsPerDay) || 200,
        }
      );
      
    case 'gas-station':
    case 'fuel-station':
      // Database uses 'fuelDispensers' (Dec 2025), legacy: dispenserCount, pumpCount, numPumps
      return calculateGasStationPower(
        parseInt(useCaseData.fuelDispensers || useCaseData.numPumps || useCaseData.pumpCount || useCaseData.dispenserCount) || 8,
        useCaseData.hasConvenienceStore !== false && useCaseData.stationType !== 'gas-only',
        useCaseData.stationType || 'with-cstore'
      );
      
    case 'government':
    case 'public-building':
      // Database uses 'squareFeet', UI variants: 'buildingSqFt', 'sqFt'
      return calculateGovernmentPower(
        parseInt(useCaseData.squareFeet || useCaseData.buildingSqFt || useCaseData.sqFt) || 75000
      );
      
    case 'microgrid':
      // Microgrid: Calculate based on total connected loads
      // If EV chargers specified, use EV calculation
      const mgLevel2 = parseInt(useCaseData.numberOfLevel2Chargers || useCaseData.level2Chargers) || 0;
      const mgDcFast = parseInt(useCaseData.numberOfDCFastChargers || useCaseData.dcFastChargers) || 0;
      
      if (mgLevel2 > 0 || mgDcFast > 0) {
        // Has EV chargers - use EV calculation
        return calculateEVChargingPower(0, mgLevel2, mgDcFast);
      }
      
      // Fall back to square footage calculation
      const mgSqFt = parseInt(useCaseData.sqFt || useCaseData.facilitySize) || 50000;
      const mgWattsPerSqFt = 8; // Higher density for microgrids (mixed loads)
      const mgPowerKW = (mgSqFt * mgWattsPerSqFt) / 1000;
      const mgPowerMW = mgPowerKW / 1000;
      
      return {
        powerMW: Math.max(0.1, Math.round(mgPowerMW * 100) / 100),
        durationHrs: 4,
        description: `Microgrid: ${mgSqFt.toLocaleString()} sq ft × ${mgWattsPerSqFt} W/sqft = ${mgPowerKW.toFixed(1)} kW`,
        calculationMethod: 'Microgrid mixed-load benchmark (8 W/sq ft)',
        inputs: { mgSqFt, mgWattsPerSqFt, mgLevel2, mgDcFast }
      };
      
    // =====================================================
    // SLUG ALIASES: Database slugs that alias to existing handlers
    // Added Nov 28, 2025 to prevent falling to default case
    // =====================================================
    
    case 'edge-data-center':
      // Alias for datacenter (same calculation)
      return calculateDatacenterPower(
        parseInt(useCaseData.itLoadKW) || undefined,
        parseInt(useCaseData.rackCount) || undefined,
        parseFloat(useCaseData.rackDensityKW) || 8
      );
      
    case 'distribution-center':
      // Alias for warehouse/logistics (same calculation)
      // Database uses 'warehouseSqFt', DB default: 250,000 sqft
      return calculateWarehousePower(
        parseInt(useCaseData.warehouseSqFt || useCaseData.squareFeet || useCaseData.sqFt) || 250000,
        useCaseData.isColdStorage === true || useCaseData.warehouseType === 'cold-storage'
      );
      
    case 'apartment-building':
      // Alias for apartment/apartments
      // DB default: 400 units
      return calculateApartmentPower(
        parseInt(useCaseData.unitCount || useCaseData.units) || 400,
        parseInt(useCaseData.commonAreaSqFt || useCaseData.sqFt) || 10000
      );
      
    case 'residential':
      // Residential is different from commercial - use residential benchmark
      // Average US home: ~1.2 kW average, 5-10 kW peak
      // Database uses 'squareFeet', UI variants: 'sqFt', 'homeSize'
      const homeSqFt = parseInt(useCaseData.squareFeet || useCaseData.sqFt || useCaseData.homeSize) || 2000;
      const homes = parseInt(useCaseData.homeCount || useCaseData.units) || 1;
      const resWattsPerSqFt = 5; // Residential benchmark (lower than commercial)
      const resPowerKW = (homeSqFt * resWattsPerSqFt * homes) / 1000;
      const resPowerMW = resPowerKW / 1000;
      
      return {
        powerMW: Math.max(0.01, Math.round(resPowerMW * 100) / 100),
        durationHrs: 4,
        description: `Residential: ${homes} home(s) × ${homeSqFt.toLocaleString()} sq ft × ${resWattsPerSqFt} W/sqft = ${resPowerKW.toFixed(1)} kW`,
        calculationMethod: 'Residential benchmark (5 W/sq ft peak)',
        inputs: { homes, homeSqFt, resWattsPerSqFt }
      };
      
    default:
      // Generic fallback - use square footage if available
      const genericSqFt = parseInt(useCaseData.sqFt || useCaseData.facilitySize) || 10000;
      const genericWattsPerSqFt = 5; // Conservative default
      const genericPowerKW = (genericSqFt * genericWattsPerSqFt) / 1000;
      const genericPowerMW = genericPowerKW / 1000; // FIX: Correct conversion to MW
      
      // Log warning for unrecognized slug
      if (import.meta.env.DEV) {
        console.warn(`⚠️ [useCasePowerCalculations] Unrecognized slug: "${slug}" - using generic fallback`);
      }
      
      return {
        powerMW: Math.max(0.05, Math.round(genericPowerMW * 100) / 100), // FIX: Correct math
        durationHrs: 4,
        description: `Generic: ${genericSqFt.toLocaleString()} sq ft × ${genericWattsPerSqFt} W/sqft = ${genericPowerKW.toFixed(1)} kW`,
        calculationMethod: 'Generic commercial benchmark (5 W/sq ft)',
        inputs: { genericSqFt, genericWattsPerSqFt }
      };
  }
}

// =============================================================================
// SIMPLE LANDING PAGE CALCULATORS
// These are simplified versions for landing page quick estimates
// =============================================================================

/**
 * HOTEL SOLAR SIZING BENCHMARKS
 * Based on real-world case studies including:
 * - Courtyard by Marriott Lancaster, PA (first fully solar-powered Marriott in US)
 *   133 rooms, 2,700 panels, 1,239 MWh/year generation, 1,177 MWh/year consumption
 * 
 * Key derived metrics:
 * - Energy consumption: 8,850 kWh/room/year (~24.2 kWh/room/day)
 * - Solar panels needed: ~20 panels per room for 100% offset
 * - Panel yield: ~459 kWh/panel/year (Pennsylvania climate, ~4.0 sun-hours/day)
 * - LED conversion reduces demand by 15% (verified)
 * 
 * Source: Marriott International sustainability report, December 2025
 */
export const HOTEL_SOLAR_SIZING_BENCHMARKS = {
  // kWh per room per year by hotel class (verified against Marriott data)
  annualKWhPerRoom: {
    economy: 7500,    // ~20.5 kWh/room/day - minimal amenities
    midscale: 8850,   // ~24.2 kWh/room/day - Marriott Courtyard benchmark
    upscale: 12000,   // ~32.9 kWh/room/day - full-service with restaurant
    luxury: 18000,    // ~49.3 kWh/room/day - resort with spa, multiple restaurants
  },
  // Panels per room for 100% solar offset (assumes 400W panels, regional average yield)
  panelsPerRoomFor100Percent: {
    economy: 15,      // 15 × 400W × 1250 hrs = 7,500 kWh
    midscale: 20,     // 20 × 400W × 1100 hrs = 8,800 kWh (matches Marriott 2700/133)
    upscale: 27,      // 27 × 400W × 1100 hrs = 11,880 kWh
    luxury: 40,       // 40 × 400W × 1100 hrs = 17,600 kWh
  },
  // Regional solar yield factors (multiply panels needed)
  regionalYieldMultiplier: {
    southwest: 0.75,  // AZ, NM, NV - excellent solar
    california: 0.80, // CA - very good solar
    southeast: 0.90,  // FL, GA, TX - good solar
    midwest: 1.00,    // PA, OH, IL - baseline (Marriott reference)
    northeast: 1.05,  // NY, MA, CT - slightly less solar
    northwest: 1.15,  // WA, OR - more cloudy
  },
  // LED lighting impact (verified 15% reduction from Marriott case study)
  ledConversionSavings: 0.15,
} as const;

/**
 * Calculate hotel solar array sizing
 * @param rooms - Number of hotel rooms
 * @param hotelClass - Hotel class (economy/midscale/upscale/luxury)
 * @param region - Regional solar yield region
 * @param targetOffset - Percentage of energy to offset (1.0 = 100%, 1.05 = 105% for net producer)
 * @param hasLED - Whether hotel has converted to LED lighting
 * @returns Solar sizing recommendations
 */
export function calculateHotelSolarSizing(
  rooms: number,
  hotelClass: HotelClassSimple,
  region: keyof typeof HOTEL_SOLAR_SIZING_BENCHMARKS.regionalYieldMultiplier = 'midwest',
  targetOffset: number = 1.0,
  hasLED: boolean = false
): {
  annualKWhNeeded: number;
  panelsNeeded: number;
  systemSizeKW: number;
  annualGenerationKWh: number;
  co2AvoidedTonsPerYear: number;
} {
  const benchmarks = HOTEL_SOLAR_SIZING_BENCHMARKS;
  
  // Calculate annual energy need
  let annualKWhNeeded = rooms * benchmarks.annualKWhPerRoom[hotelClass];
  
  // Apply LED savings if applicable
  if (hasLED) {
    annualKWhNeeded *= (1 - benchmarks.ledConversionSavings);
  }
  
  // Calculate panels needed with regional adjustment
  const basePanelsPerRoom = benchmarks.panelsPerRoomFor100Percent[hotelClass];
  const regionalMultiplier = benchmarks.regionalYieldMultiplier[region];
  const panelsNeeded = Math.ceil(rooms * basePanelsPerRoom * regionalMultiplier * targetOffset);
  
  // Assume 400W panels (modern standard)
  const systemSizeKW = panelsNeeded * 0.4;
  
  // Calculate expected generation (varies by region)
  // Base: 1100 sun-hours/year for midwest, adjusted by regional multiplier
  const baseSunHours = 1100;
  const adjustedSunHours = baseSunHours / regionalMultiplier; // Higher multiplier = fewer sun hours
  const annualGenerationKWh = systemSizeKW * adjustedSunHours;
  
  // CO2 avoided: 0.92 lbs CO2 per kWh (EPA eGRID average)
  // Convert to metric tons: lbs / 2204.6
  const co2AvoidedTonsPerYear = (annualGenerationKWh * 0.92) / 2204.6;
  
  return {
    annualKWhNeeded: Math.round(annualKWhNeeded),
    panelsNeeded,
    systemSizeKW: Math.round(systemSizeKW * 10) / 10,
    annualGenerationKWh: Math.round(annualGenerationKWh),
    co2AvoidedTonsPerYear: Math.round(co2AvoidedTonsPerYear * 10) / 10,
  };
}

/**
 * Hotel class profiles for simplified landing page calculator
 * SSOT for HotelEnergy.tsx landing page
 * 
 * IMPORTANT: peakKWPerRoom is CONNECTED LOAD (before diversity)
 * The calculateHotelPowerSimple() function applies 0.75 diversity
 * 
 * Validated Dec 2025 against Marriott Lancaster:
 * - 133 rooms midscale = 384 kW actual peak
 * - 384 ÷ 133 ÷ 0.75 = 3.85 kW/room connected
 * - Using 4.0 for midscale gives 133 × 4.0 × 0.75 = 399 kW ✓
 */
export const HOTEL_CLASS_PROFILES_SIMPLE = {
  economy: { peakKWPerRoom: 2.5, name: 'Economy/Budget' },
  midscale: { peakKWPerRoom: 4.0, name: 'Midscale/Select Service' },
  upscale: { peakKWPerRoom: 5.0, name: 'Upscale/Full Service' },
  luxury: { peakKWPerRoom: 7.0, name: 'Luxury/Resort' },
} as const;

/**
 * Hotel amenity power additions for simplified landing page calculator
 */
export const HOTEL_AMENITY_POWER_SIMPLE = {
  pool: 25, // kW - pool heating, pumps, lighting
  restaurant: 50, // kW - commercial kitchen, HVAC
  spa: 40, // kW - saunas, hot tubs, equipment
  fitness: 15, // kW - equipment, ventilation
  evCharging: 30, // kW - 2-4 Level 2 chargers
} as const;

export type HotelClassSimple = keyof typeof HOTEL_CLASS_PROFILES_SIMPLE;
export type HotelAmenitySimple = keyof typeof HOTEL_AMENITY_POWER_SIMPLE;

export interface HotelPowerSimpleInput {
  rooms: number;
  hotelClass: HotelClassSimple;
  amenities: HotelAmenitySimple[];
  electricityRate: number;
}

export interface HotelPowerSimpleResult {
  peakKW: number;
  monthlyDemandCost: number;
  annualEnergyCost: number;
  bessRecommendedKW: number;
  bessRecommendedKWh: number;
  potentialSavings: number;
}

/**
 * Simple hotel power calculator for landing page
 * Matches HotelEnergy.tsx embedded logic - now SSOT
 */
export function calculateHotelPowerSimple(input: HotelPowerSimpleInput): HotelPowerSimpleResult {
  const { rooms, hotelClass, amenities, electricityRate } = input;
  
  const classProfile = HOTEL_CLASS_PROFILES_SIMPLE[hotelClass];
  const basePeakKW = rooms * classProfile.peakKWPerRoom;
  
  // Add amenity power
  const amenityKW = amenities.reduce((total, amenity) => {
    return total + (HOTEL_AMENITY_POWER_SIMPLE[amenity] || 0);
  }, 0);
  
  // Apply diversity factor (0.75) - not all loads peak simultaneously
  const peakKW = Math.round((basePeakKW + amenityKW) * 0.75);
  
  // Demand charge calculation (assume $15/kW typical)
  const demandCharge = 15;
  const monthlyDemandCost = peakKW * demandCharge;
  
  // Annual energy (assume 40% capacity factor for hotels, 8760 hours/year)
  const annualKWh = peakKW * 8760 * 0.4;
  const annualEnergyCost = annualKWh * electricityRate;
  
  // BESS sizing: 50% peak shaving capability, 4-hour duration
  const bessRecommendedKW = Math.round(peakKW * 0.5);
  const bessRecommendedKWh = bessRecommendedKW * 4;
  
  // Potential savings: 30% demand charge reduction + 10% energy arbitrage
  const potentialSavings = Math.round(
    (monthlyDemandCost * 12 * 0.3) + (annualEnergyCost * 0.1)
  );
  
  return {
    peakKW,
    monthlyDemandCost,
    annualEnergyCost: Math.round(annualEnergyCost),
    bessRecommendedKW,
    bessRecommendedKWh,
    potentialSavings,
  };
}

/**
 * Car wash power profiles for simplified landing page calculator
 * SSOT for CarWashEnergy.tsx landing page
 */
export const CAR_WASH_POWER_PROFILES_SIMPLE = {
  selfService: { bayPower: 5, name: 'Self-Service Bay' },
  automatic: { bayPower: 25, name: 'Automatic/In-Bay' },
  tunnel: { bayPower: 75, name: 'Express Tunnel' },
  fullService: { bayPower: 100, name: 'Full-Service Tunnel' },
} as const;

export type CarWashTypeSimple = keyof typeof CAR_WASH_POWER_PROFILES_SIMPLE;

export interface CarWashPowerSimpleInput {
  bays: number;
  washType: CarWashTypeSimple;
  hasVacuums: boolean;
  hasDryers: boolean;
  carsPerDay: number;
  electricityRate: number;
}

export interface CarWashPowerSimpleResult {
  peakKW: number;
  monthlyDemandCost: number;
  annualEnergyCost: number;
  bessRecommendedKW: number;
  bessRecommendedKWh: number;
  potentialSavings: number;
}

/**
 * Simple car wash power calculator for landing page
 * Matches CarWashEnergy.tsx embedded logic - now SSOT
 */
export function calculateCarWashPowerSimple(input: CarWashPowerSimpleInput): CarWashPowerSimpleResult {
  const { bays, washType, hasVacuums, hasDryers, carsPerDay, electricityRate } = input;
  
  const profile = CAR_WASH_POWER_PROFILES_SIMPLE[washType];
  let peakKW = bays * profile.bayPower;
  
  // Add vacuum islands (6 kW each, assume 1 per 2 bays)
  if (hasVacuums) {
    peakKW += Math.ceil(bays / 2) * 6;
  }
  
  // Add dryer systems (15 kW per bay for tunnel types)
  if (hasDryers && (washType === 'tunnel' || washType === 'fullService')) {
    peakKW += bays * 15;
  }
  
  // Apply utilization factor based on cars/day
  // Higher volume = higher peak utilization
  const peakHours = 5; // Typical peak operating hours
  const utilizationFactor = Math.min(0.9, 0.5 + (carsPerDay / 500) * 0.4);
  peakKW = Math.round(peakKW * utilizationFactor);
  
  // Demand charge calculation (assume $15/kW typical)
  const demandCharge = 15;
  const monthlyDemandCost = peakKW * demandCharge;
  
  // Annual energy calculation
  // kWh per car based on real-world data (Tommy Express, Mister Car Wash, Zips benchmarks)
  // Express tunnels are highly efficient: ~2-3 kWh/car despite high peak power
  const kWhPerCar = { selfService: 2, automatic: 4, tunnel: 2.5, fullService: 6 }[washType];
  const annualKWh = carsPerDay * 365 * kWhPerCar;
  const annualEnergyCost = annualKWh * electricityRate;
  
  // BESS sizing: 60% peak shaving (car washes have spiky loads), 2-hour duration
  const bessRecommendedKW = Math.round(peakKW * 0.6);
  const bessRecommendedKWh = bessRecommendedKW * 2;
  
  // Potential savings: 40% demand charge reduction (high spikes), 5% energy
  const potentialSavings = Math.round(
    (monthlyDemandCost * 12 * 0.4) + (annualEnergyCost * 0.05)
  );
  
  return {
    peakKW,
    monthlyDemandCost,
    annualEnergyCost: Math.round(annualEnergyCost),
    bessRecommendedKW,
    bessRecommendedKWh,
    potentialSavings,
  };
}

/**
 * CAR WASH FACILITY CONSTRAINTS - Industry Standards
 * Source: International Carwash Association (ICA), ICWG (International Carwash Group)
 * 
 * TrueQuote™ Sources:
 * - ICA 2024 Industry Study: Typical site size and building footprints
 * - Professional Carwash & Detailing Magazine: Construction standards
 * - ICWG Market Intelligence: Express tunnel facility specs
 */
export const CAR_WASH_FACILITY_CONSTRAINTS = {
  MAX_SITE_AREA_SQFT: 43560,        // 1 acre typical max site
  BUILDING_FOOTPRINT_MIN: 4000,     // Minimum enclosed building
  BUILDING_FOOTPRINT_MAX: 7000,     // Maximum typical building
  BUILDING_FOOTPRINT_TYPICAL: 5500, // Average express tunnel
  USABLE_ROOF_PERCENT: 0.75,        // 75% of roof usable for solar (accounting for vents, setbacks, shading)
  SOLAR_PANEL_EFFICIENCY_W: 400,    // Modern panel wattage
  SOLAR_PANEL_AREA_SQFT: 20,        // ~20 sq ft per 400W panel (includes spacing)
  SOLAR_WATTS_PER_SQFT: 15,         // Industry standard: ~15W/sq ft usable roof
};

/**
 * Validate solar capacity against car wash roof constraints
 * 
 * TrueQuote™ compliant: Uses ICA/ICWG industry standards for facility sizing
 * 
 * @param solarKW - Requested solar capacity in kW
 * @param buildingSqFt - Total building footprint in sq ft (default: 5500 typical)
 * @returns Validation result with max capacity and warnings
 */
export function validateCarWashSolarCapacity(
  solarKW: number,
  buildingSqFt: number = CAR_WASH_FACILITY_CONSTRAINTS.BUILDING_FOOTPRINT_TYPICAL
): {
  isValid: boolean;
  maxSolarKW: number;
  usableRoofSqFt: number;
  requiredRoofSqFt: number;
  exceedsBy?: number;
  warning?: string;
} {
  // Calculate usable roof area (75% of building footprint)
  const usableRoofSqFt = Math.round(buildingSqFt * CAR_WASH_FACILITY_CONSTRAINTS.USABLE_ROOF_PERCENT);
  
  // Calculate max solar capacity for available roof
  const maxSolarKW = Math.floor(usableRoofSqFt * CAR_WASH_FACILITY_CONSTRAINTS.SOLAR_WATTS_PER_SQFT / 1000);
  
  // Calculate required roof space for requested solar
  const requiredRoofSqFt = Math.round(solarKW * 1000 / CAR_WASH_FACILITY_CONSTRAINTS.SOLAR_WATTS_PER_SQFT);
  
  if (solarKW > maxSolarKW) {
    const exceedsBy = Math.round(solarKW - maxSolarKW);
    return {
      isValid: false,
      maxSolarKW,
      usableRoofSqFt,
      requiredRoofSqFt,
      exceedsBy,
      warning: `⚠️ Solar array requires ${requiredRoofSqFt.toLocaleString()} sq ft but only ${usableRoofSqFt.toLocaleString()} sq ft available on typical car wash roof. Maximum realistic solar: ${maxSolarKW} kW.`
    };
  }
  
  return {
    isValid: true,
    maxSolarKW,
    usableRoofSqFt,
    requiredRoofSqFt
  };
}
