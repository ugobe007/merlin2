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
  hospitalPerBed: 10.0,     // 8-12 kW peak per bed (critical equipment)
  
  // Special
  agriculturePerAcre: 0.6,  // 0.3-1.0 kW/acre (irrigation pumps at peak)
  airportPerMillion: 1.5,   // 1.2-2.0 MW per million passengers/year
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

/**
 * AMENITY POWER STANDARDS - SSOT for hotel/hospitality amenity loads
 * Source: ASHRAE HVAC Applications Handbook, hospitality energy audits
 * 
 * These represent PEAK DEMAND for each amenity type.
 * Used by hotel, resort, and hospitality use cases.
 */
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
 * Calculate power requirement for Hotel (Simple version)
 * Source: CBECS 2018, hospitality industry benchmarks
 * 
 * For detailed calculations with amenities, use calculateHotelPowerDetailed()
 * 
 * @param roomCount - Number of hotel rooms
 * @returns Power in MW
 */
export function calculateHotelPower(roomCount: number): PowerCalculationResult {
  // Peak demand: 3.5 kW per room (HVAC at peak, all amenities running)
  // Average is ~2.5 kW/room, but BESS needs to handle peak
  const kWPerRoom = POWER_DENSITY_STANDARDS.hotelPerRoom; // 3.5 kW peak
  const powerKW = roomCount * kWPerRoom;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.05, Math.round(powerMW * 100) / 100), // Min 50kW
    durationHrs: 4,
    description: `Hotel: ${roomCount} rooms × ${kWPerRoom} kW/room peak = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'CBECS hospitality peak demand (3.5 kW/room)',
    inputs: { roomCount, kWPerRoom }
  };
}

// ============================================
// HOTEL CLASS PROFILES - Energy consumption by hotel tier
// Source: CBECS 2018, hospitality energy audits
// ============================================
export const HOTEL_CLASS_PROFILES = {
  economy: { kWhPerRoom: 25, peakKWPerRoom: 1.5, name: 'Economy/Budget', hvacTons: 0.5 },
  midscale: { kWhPerRoom: 35, peakKWPerRoom: 2.0, name: 'Midscale', hvacTons: 0.75 },
  upscale: { kWhPerRoom: 50, peakKWPerRoom: 2.5, name: 'Upscale', hvacTons: 1.0 },
  luxury: { kWhPerRoom: 75, peakKWPerRoom: 3.5, name: 'Luxury/Resort', hvacTons: 1.5 },
} as const;

export type HotelClass = keyof typeof HOTEL_CLASS_PROFILES;

// ============================================
// HOTEL AMENITY SPECIFICATIONS - Peak power and daily usage
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
  let basePeakKW = input.rooms * classProfile.peakKWPerRoom * occupancyFactor;
  let dailyKWh = input.rooms * classProfile.kWhPerRoom * occupancyFactor;
  
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
 * Source: ASHRAE healthcare guidelines
 * 
 * @param bedCount - Number of hospital beds
 * @returns Power in MW
 */
export function calculateHospitalPower(bedCount: number): PowerCalculationResult {
  // Peak demand: 10 kW per bed (all critical equipment, HVAC at max, OR running)
  // Average is ~6-8 kW/bed, but hospitals need peak capacity for emergencies
  const kWPerBed = POWER_DENSITY_STANDARDS.hospitalPerBed; // 10 kW peak
  const powerKW = bedCount * kWPerBed;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.2, Math.round(powerMW * 100) / 100), // Min 200kW
    durationHrs: 8, // Hospitals need longer backup
    description: `Hospital: ${bedCount} beds × ${kWPerBed} kW/bed peak = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'ASHRAE healthcare peak demand (10 kW/bed)',
    inputs: { bedCount, kWPerBed }
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
  let powerKW: number;
  let method: string;
  
  if (itLoadKW && itLoadKW > 0) {
    // Direct IT load specified - add 50% for cooling (PUE ~1.5)
    powerKW = itLoadKW * 1.5;
    method = `Direct IT load ${itLoadKW}kW × 1.5 PUE`;
  } else if (rackCount && rackCount > 0) {
    // Calculate from rack count
    const itPower = rackCount * rackDensityKW;
    powerKW = itPower * 1.5; // PUE ~1.5
    method = `${rackCount} racks × ${rackDensityKW}kW × 1.5 PUE`;
  } else {
    // Default small datacenter
    powerKW = 2000; // 2 MW default
    method = 'Default 2MW datacenter';
  }
  
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.5, Math.round(powerMW * 100) / 100), // Min 500kW
    durationHrs: 4, // Standard UPS backup target
    description: `Data Center: ${method} = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'Uptime Institute standards (PUE 1.5)',
    inputs: { itLoadKW, rackCount, rackDensityKW }
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
 * @param annualPassengersMillions - Million passengers per year
 * @returns Power in MW
 */
export function calculateAirportPower(annualPassengersMillions: number): PowerCalculationResult {
  // Peak demand: ~1.5 MW per million annual passengers
  // Includes terminals at peak, all baggage handling, retail, food service
  const mwPerMillion = POWER_DENSITY_STANDARDS.airportPerMillion; // 1.5 MW
  const powerMW = annualPassengersMillions * mwPerMillion;
  
  return {
    powerMW: Math.max(0.5, Math.round(powerMW * 100) / 100), // Min 500kW
    durationHrs: 4,
    description: `Airport: ${annualPassengersMillions}M passengers/year × ${mwPerMillion} MW/M peak = ${powerMW.toFixed(2)} MW`,
    calculationMethod: 'FAA airport peak demand (1.5 MW per million passengers)',
    inputs: { annualPassengersMillions, mwPerMillion }
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
export function calculateCarWashPower(
  bayCount: number,
  washType?: string
): PowerCalculationResult {
  // Industry standard: 15-25 kW per bay depending on type
  let kWPerBay = 20; // Default automatic
  
  if (washType) {
    switch (washType.toLowerCase()) {
      case 'self-service': kWPerBay = 8; break;
      case 'automatic': kWPerBay = 20; break;
      case 'tunnel': kWPerBay = 35; break;
      case 'flex-serve': kWPerBay = 25; break;
    }
  }
  
  const powerKW = bayCount * kWPerBay;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.02, Math.round(powerMW * 100) / 100), // Min 20kW
    durationHrs: 2, // Short backup for demand charge reduction
    description: `Car Wash: ${bayCount} bays × ${kWPerBay} kW/bay = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'ICA car wash benchmark',
    inputs: { bayCount, kWPerBay, washType }
  };
}

/**
 * Calculate power requirement for Gas Station
 * Source: NACS (National Association of Convenience Stores)
 * 
 * @param dispenserCount - Number of fuel dispensers
 * @param hasConvenienceStore - Whether attached store exists
 * @returns Power in MW
 */
export function calculateGasStationPower(
  dispenserCount: number,
  hasConvenienceStore: boolean = true
): PowerCalculationResult {
  // Pumps: 1-2 kW per dispenser
  // Convenience store: 3-5 W/sq ft (typically 2,000-3,000 sq ft)
  const kWPerDispenser = 1.5;
  const pumpPowerKW = dispenserCount * kWPerDispenser;
  const storePowerKW = hasConvenienceStore ? 10 : 0; // ~2,500 sq ft × 4 W/sq ft
  const powerKW = pumpPowerKW + storePowerKW;
  const powerMW = powerKW / 1000;
  
  return {
    powerMW: Math.max(0.01, Math.round(powerMW * 100) / 100), // Min 10kW
    durationHrs: 4,
    description: `Gas Station: ${dispenserCount} dispensers + ${hasConvenienceStore ? 'store' : 'pumps only'} = ${powerKW.toFixed(1)} kW`,
    calculationMethod: 'NACS fuel retail benchmark',
    inputs: { dispenserCount, hasConvenienceStore, pumpPowerKW, storePowerKW }
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
      // Database uses 'squareFeet', UI variants: 'officeSqFt', 'buildingSqFt', 'sqFt'
      return calculateOfficePower(
        parseInt(useCaseData.squareFeet || useCaseData.officeSqFt || useCaseData.buildingSqFt || useCaseData.sqFt) || 50000
      );
      
    case 'hotel':
    case 'hotel-hospitality':
      return calculateHotelPower(
        parseInt(useCaseData.roomCount || useCaseData.numberOfRooms) || 100
      );
      
    case 'hospital':
      return calculateHospitalPower(
        parseInt(useCaseData.bedCount) || 200
      );
      
    case 'datacenter':
    case 'data-center':
      return calculateDatacenterPower(
        parseInt(useCaseData.itLoadKW) || undefined,
        parseInt(useCaseData.rackCount) || undefined,
        parseFloat(useCaseData.rackDensityKW) || 8
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
        // Legacy fields for backward compatibility
        level1Count: parseInt(useCaseData.level1Count || useCaseData.numberOfLevel1Chargers || useCaseData.level1Chargers) || 0,
        level2Count: parseInt(useCaseData.level2Count || useCaseData.numberOfLevel2Chargers || useCaseData.level2Chargers) || 0,
        dcFastCount: parseInt(useCaseData.dcfastCount || useCaseData.numberOfDCFastChargers || useCaseData.dcFastChargers) || 0,
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
      const evLevel1 = evConfig.level1Count;
      const evLevel2 = evConfig.level2Count;
      const evDcFast = evConfig.dcFastCount;
      
      // 🔌 DEBUG: Log all EV charging field lookups
      if (import.meta.env.DEV) {
        console.log('🔌 [EV Charging Power] Legacy field resolution:', {
          useCaseDataKeys: Object.keys(useCaseData || {}),
          resolved_level1: evLevel1,
          resolved_level2: evLevel2,
          resolved_dcFast: evDcFast
        });
      }
      
      return calculateEVChargingPower(evLevel1, evLevel2, evDcFast);
      
    case 'airport':
      // Convert raw passenger count to millions (user enters 600000, we need 0.6)
      const rawPassengers = parseFloat(useCaseData.annualPassengers || useCaseData.annual_passengers) || 5000000;
      const passengersInMillions = rawPassengers / 1000000;
      return calculateAirportPower(passengersInMillions);
      
    case 'manufacturing':
      // Database uses 'squareFeet', UI variants: 'facilitySqFt', 'sqFt'
      return calculateManufacturingPower(
        parseInt(useCaseData.squareFeet || useCaseData.facilitySqFt || useCaseData.sqFt) || 100000,
        useCaseData.industryType
      );
      
    case 'warehouse':
    case 'logistics':
    case 'logistics-center':
      // Database uses 'squareFeet', UI variants: 'warehouseSqFt', 'sqFt'
      return calculateWarehousePower(
        parseInt(useCaseData.squareFeet || useCaseData.warehouseSqFt || useCaseData.sqFt) || 250000,
        useCaseData.isColdStorage === true || useCaseData.warehouseType === 'cold-storage'
      );
      
    case 'cold-storage':
      // Database uses 'squareFeet', UI variants: 'storageVolume', 'sqFt'
      return calculateWarehousePower(
        parseInt(useCaseData.squareFeet || useCaseData.storageVolume || useCaseData.sqFt) || 50000,
        true // Always cold storage
      );
      
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
      return calculateCasinoPower(
        parseInt(useCaseData.gamingFloorSqFt || useCaseData.gamingFloorSize || useCaseData.sqFt) || 50000
      );
      
    case 'indoor-farm':
      return calculateIndoorFarmPower(
        parseInt(useCaseData.growingAreaSqFt || useCaseData.sqFt) || 50000,
        parseFloat(useCaseData.ledWattagePerSqFt) || 40
      );
      
    case 'apartment':
    case 'apartments':
      return calculateApartmentPower(
        parseInt(useCaseData.unitCount || useCaseData.numUnits) || 100
      );
      
    case 'college':
    case 'university':
    case 'college-university':
      return calculateCollegePower(
        parseInt(useCaseData.studentCount || useCaseData.enrollment) || 15000
      );
      
    case 'car-wash':
      // Database uses 'washBays', UI variants: 'bayCount', 'numBays'
      return calculateCarWashPower(
        parseInt(useCaseData.washBays || useCaseData.bayCount || useCaseData.numBays) || 3,
        useCaseData.washType
      );
      
    case 'gas-station':
    case 'fuel-station':
      return calculateGasStationPower(
        parseInt(useCaseData.dispenserCount) || 8,
        useCaseData.hasConvenienceStore !== false
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
      // Database uses 'squareFeet', UI variants: 'warehouseSqFt', 'sqFt'
      return calculateWarehousePower(
        parseInt(useCaseData.squareFeet || useCaseData.warehouseSqFt || useCaseData.sqFt) || 250000,
        useCaseData.isColdStorage === true || useCaseData.warehouseType === 'cold-storage'
      );
      
    case 'apartment-building':
      // Alias for apartment/apartments
      return calculateApartmentPower(
        parseInt(useCaseData.unitCount || useCaseData.units) || 100,
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
 * Hotel class profiles for simplified landing page calculator
 * SSOT for HotelEnergy.tsx landing page
 */
export const HOTEL_CLASS_PROFILES_SIMPLE = {
  economy: { peakKWPerRoom: 1.5, name: 'Economy/Budget' },
  midscale: { peakKWPerRoom: 2.5, name: 'Midscale/Select Service' },
  upscale: { peakKWPerRoom: 4.0, name: 'Upscale/Full Service' },
  luxury: { peakKWPerRoom: 6.0, name: 'Luxury/Resort' },
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
  // kWh per car varies by type: self-service ~2, automatic ~8, tunnel ~15, full ~25
  const kWhPerCar = { selfService: 2, automatic: 8, tunnel: 15, fullService: 25 }[washType];
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
