/**
 * HEAVY DUTY TRUCK STOP / TRAVEL CENTER INDUSTRY SPECIFICATION
 * =============================================================
 * Love's Travel Stops, Pilot Flying J, TA/Petro, TravelCenters of America
 * 
 * Version: 1.0.0
 * Created: January 6, 2026
 * 
 * KEY INSIGHT: These are not "gas stations" — they are high-voltage nodes
 * comparable to small manufacturing plants or high-density data centers.
 * 
 * INDUSTRY CHARACTERISTICS:
 * - 24/7 operations with no downtime tolerance
 * - Extreme demand spikes from MW-class EV charging
 * - Heavy inductive loads (compressors, lifts, pumps)
 * - "Travel Center Curve" combines 3 peak types:
 *   • Commuter Peaks (Passenger EVs)
 *   • Logistics Peaks (Heavy Trucks)
 *   • Hospitality Peaks (Food/Showers)
 * 
 * Part of Merlin Energy TrueQuote Engine
 */

// ═══════════════════════════════════════════════════════════════════════════
// INDUSTRY DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

export const TRUCK_STOP_INDUSTRY = {
  id: 'heavy_duty_truck_stop',
  name: 'Heavy Duty Truck Stop / Travel Center',
  category: 'transportation_logistics',
  subcategories: [
    'loves_travel_stops',
    'pilot_flying_j',
    'ta_petro',
    'travel_centers_of_america',
    'independent_truck_plaza',
  ],
  
  description: 'High-voltage nodes with extreme demand profiles from MW-class charging, heavy industrial equipment, and 24/7 hospitality operations',
  
  operationalProfile: {
    hoursPerDay: 24,
    daysPerWeek: 7,
    peakSeasons: ['summer', 'holiday_travel'],
    criticalUptime: true,  // Downtime = lost revenue + angry truckers
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// EQUIPMENT LOAD PROFILES
// Based on real-world Love's flagship locations (2026)
// ═══════════════════════════════════════════════════════════════════════════

export const EQUIPMENT_PROFILES = {
  // ─────────────────────────────────────────────────────────────
  // EV CHARGING INFRASTRUCTURE
  // Most extreme demand spike source
  // ─────────────────────────────────────────────────────────────
  evCharging: {
    // Megawatt Charging System (MCS) for Semi Trucks
    mcsChargers: {
      nameplate: 1250,           // kW per charger (Tesla Semi, Nikola, etc.)
      rampTime: 2,               // seconds (0 to max in <2 seconds!)
      typicalCount: 2,           // per location
      diversityFactor: 0.9,      // High - trucks need to charge FAST
      dutyCycle: 0.3,            // 30% of time at full load
      inrushMultiplier: 1.2,     // 20% overcurrent during initial connect
      loadProfile: 'extreme_spike',
      notes: 'NEC 2023 requires 125% continuous load calculation',
    },
    
    // DC Fast Charging (350kW) for Class 8 Trucks & RVs
    dcfc350: {
      nameplate: 350,            // kW per charger
      rampTime: 5,               // seconds
      typicalCount: 10,          // per location
      diversityFactor: 0.85,     // Very high during peak hours
      dutyCycle: 0.4,            // 40% of time at full load
      inrushMultiplier: 1.15,
      loadProfile: 'severe_spike',
    },
    
    // Level 2 (19.2kW) for Passenger Vehicles
    level2: {
      nameplate: 19.2,           // kW per charger
      rampTime: 30,              // seconds
      typicalCount: 20,          // per location
      diversityFactor: 0.7,      // Moderate - longer dwell times
      dutyCycle: 0.5,
      inrushMultiplier: 1.1,
      loadProfile: 'gradual',
    },
    
    // CRITICAL: Total EV infrastructure can pull 2,500 - 5,000 kW during peak
    peakCombinedLoad: {
      min: 2500,
      typical: 3500,
      max: 5000,
      notes: 'Assume 0.8-0.9 diversity factor during peak transit hours',
    },
  },
  
  // ─────────────────────────────────────────────────────────────
  // MAINTENANCE FACILITY (Speedco)
  // Heavy inductive loads with high inrush current
  // ─────────────────────────────────────────────────────────────
  maintenance: {
    airCompressors: {
      nameplate: 100,            // HP (74.6 kW) per compressor
      count: 2,                  // typical
      inrushMultiplier: 6.0,     // 600% inrush on motor start!
      powerFactor: 0.85,         // Inductive load
      dutyCycle: 0.4,
      loadProfile: 'heavy_inductive',
    },
    
    vehicleLifts: {
      nameplate: 25,             // kW per lift
      count: 4,                  // per facility
      inrushMultiplier: 3.0,
      dutyCycle: 0.3,
    },
    
    industrialHVAC: {
      nameplate: 50,             // kW (shop floor cooling/heating)
      count: 2,                  // units
      powerFactor: 0.9,
      dutyCycle: 0.6,
      seasonal: true,
    },
    
    welding: {
      nameplate: 30,             // kW
      count: 1,
      dutyCycle: 0.1,            // Intermittent
    },
    
    totalLoad: {
      min: 150,
      typical: 250,
      max: 350,
      notes: 'High inrush current during motor starts - size accordingly',
    },
  },
  
  // ─────────────────────────────────────────────────────────────
  // TRUCK WASH
  // Intermittent but intense load
  // ─────────────────────────────────────────────────────────────
  truckWash: {
    highPressurePumps: {
      nameplate: 50,             // kW per pump
      count: 4,                  // per wash tunnel
      inrushMultiplier: 4.0,
      dutyCycle: 0.7,            // During wash cycle
    },
    
    blowerDryers: {
      nameplate: 150,            // kW (industrial forced-air dryers)
      count: 1,
      dutyCycle: 0.8,
    },
    
    waterHeaters: {
      nameplate: 30,             // kW
      count: 2,
      dutyCycle: 0.5,
    },
    
    washCycleDuration: 15,       // minutes per truck
    trucksPerHour: 3,            // typical throughput
    
    totalLoad: {
      min: 200,
      typical: 300,
      max: 400,
      notes: 'High demand during 15-min cycles, then idle',
    },
  },
  
  // ─────────────────────────────────────────────────────────────
  // QUICK SERVICE RESTAURANT (QSR) / FOOD COURT
  // Constant baseline with midday/evening peaks
  // ─────────────────────────────────────────────────────────────
  foodService: {
    commercialFryers: {
      nameplate: 15,             // kW per fryer
      count: 10,                 // multiple brands
      dutyCycle: 0.6,
    },
    
    walkinFreezer: {
      nameplate: 30,             // kW
      count: 2,
      dutyCycle: 0.9,            // Nearly constant
    },
    
    walkinCooler: {
      nameplate: 20,             // kW
      count: 2,
      dutyCycle: 0.9,
    },
    
    pizzaOvens: {
      nameplate: 25,             // kW per oven
      count: 2,
      dutyCycle: 0.5,
    },
    
    icemakers: {
      nameplate: 5,              // kW
      count: 6,
      dutyCycle: 0.7,
    },
    
    exhaustHoods: {
      nameplate: 10,             // kW per hood system
      count: 3,
      dutyCycle: 0.8,
    },
    
    totalLoad: {
      min: 150,
      typical: 225,
      max: 300,
      notes: 'Constant baseline with peaks during meal rushes',
    },
  },
  
  // ─────────────────────────────────────────────────────────────
  // BUILDING & PARKING LOT
  // Seasonal/Diurnal patterns
  // ─────────────────────────────────────────────────────────────
  buildingAndLot: {
    commercialHVAC: {
      nameplate: 100,            // tons (350 kW)
      tonnage: 100,
      powerFactor: 0.9,
      dutyCycle: 0.5,            // Higher in summer, lower in winter
      peakTime: '15:00',         // 3 PM peak cooling
    },
    
    ledPoleLighting: {
      nameplate: 2,              // kW per pole
      count: 50,                 // large parking lot
      dutyCycle: 0.5,            // 100% on at night, 0% during day
      hoursPerDay: 12,
    },
    
    buildingLighting: {
      nameplate: 30,             // kW (entire building)
      dutyCycle: 1.0,            // 24/7
    },
    
    totalLoad: {
      min: 100,
      typical: 150,
      max: 200,
      notes: 'Lighting is 100% at night; HVAC peaks at 3 PM',
    },
  },
  
  // ─────────────────────────────────────────────────────────────
  // FUELING ISLANDS
  // Near-constant baseline
  // ─────────────────────────────────────────────────────────────
  fuelingOperations: {
    dieselPumps: {
      nameplate: 3,              // kW per pump
      count: 12,                 // high-flow diesel islands
      dutyCycle: 0.8,
    },
    
    defPumps: {
      nameplate: 2,              // kW (diesel exhaust fluid)
      count: 6,
      dutyCycle: 0.6,
    },
    
    canopyLighting: {
      nameplate: 15,             // kW (LED canopy)
      dutyCycle: 0.5,            // 100% at night
    },
    
    totalLoad: {
      min: 40,
      typical: 60,
      max: 80,
      notes: 'High duty cycle 24/7',
    },
  },
  
  // ─────────────────────────────────────────────────────────────
  // ADDITIONAL AMENITIES (Love's specific)
  // ─────────────────────────────────────────────────────────────
  amenities: {
    showers: {
      waterHeaters: 50,          // kW
      pumps: 10,
      totalLoad: 60,
    },
    
    laundry: {
      washers: 30,               // kW (commercial)
      dryers: 40,
      totalLoad: 70,
    },
    
    dogPark: {
      lighting: 5,               // kW
      irrigation: 3,
      totalLoad: 8,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DAILY ENERGY LOAD PROFILE - "TRAVEL CENTER CURVE"
// Combines Commuter Peaks + Logistics Peaks + Hospitality Peaks
// ═══════════════════════════════════════════════════════════════════════════

export const DAILY_LOAD_PROFILE = [
  // Midnight - Dawn (00:00 - 05:59)
  { hour: 0, load: 0.30, primaryDrivers: ['lot_lighting', 'refrigeration', 'overnight_idling'], merlinStrategy: 'bess_charging' },
  { hour: 1, load: 0.28, primaryDrivers: ['lot_lighting', 'refrigeration'], merlinStrategy: 'bess_charging' },
  { hour: 2, load: 0.27, primaryDrivers: ['lot_lighting', 'refrigeration'], merlinStrategy: 'bess_charging' },
  { hour: 3, load: 0.29, primaryDrivers: ['lot_lighting', 'refrigeration', 'early_truckers'], merlinStrategy: 'bess_charging' },
  { hour: 4, load: 0.35, primaryDrivers: ['lot_lighting', 'refrigeration', 'early_morning_prep'], merlinStrategy: 'bess_charging' },
  { hour: 5, load: 0.42, primaryDrivers: ['breakfast_prep', 'early_commuters'], merlinStrategy: 'transition' },
  
  // Morning Peak (06:00 - 09:59)
  { hour: 6, load: 0.68, primaryDrivers: ['breakfast_rush', 'commuter_dcfc', 'showers'], merlinStrategy: 'peak_shaving' },
  { hour: 7, load: 0.82, primaryDrivers: ['breakfast_peak', 'heavy_ev_charging', 'maintenance_opens'], merlinStrategy: 'peak_shaving' },
  { hour: 8, load: 0.79, primaryDrivers: ['post_breakfast', 'continued_charging'], merlinStrategy: 'peak_shaving' },
  { hour: 9, load: 0.65, primaryDrivers: ['mid_morning', 'light_charging'], merlinStrategy: 'peak_shaving' },
  
  // Max Demand (10:00 - 14:59)
  { hour: 10, load: 0.75, primaryDrivers: ['lunch_prep', 'truck_charging_surge'], merlinStrategy: 'max_discharge' },
  { hour: 11, load: 0.92, primaryDrivers: ['lunch_rush', 'mcs_charging', 'hvac_ramp'], merlinStrategy: 'max_discharge' },
  { hour: 12, load: 1.00, primaryDrivers: ['peak_lunch', 'max_mcs_usage', 'truck_wash'], merlinStrategy: 'max_discharge' },
  { hour: 13, load: 0.95, primaryDrivers: ['continued_lunch', 'charging_peak'], merlinStrategy: 'max_discharge' },
  { hour: 14, load: 0.88, primaryDrivers: ['post_lunch', 'maintenance_peak'], merlinStrategy: 'max_discharge' },
  
  // Secondary Peak (15:00 - 19:59)
  { hour: 15, load: 0.85, primaryDrivers: ['hvac_peak', 'commuter_return', 'dinner_prep'], merlinStrategy: 'hybrid_solar_bess' },
  { hour: 16, load: 0.83, primaryDrivers: ['commuter_charging', 'early_dinner'], merlinStrategy: 'hybrid_solar_bess' },
  { hour: 17, load: 0.88, primaryDrivers: ['dinner_rush', 'evening_charging'], merlinStrategy: 'hybrid_solar_bess' },
  { hour: 18, load: 0.92, primaryDrivers: ['dinner_peak', 'evening_truck_surge'], merlinStrategy: 'hybrid_solar_bess' },
  { hour: 19, load: 0.78, primaryDrivers: ['post_dinner', 'lot_lighting_on'], merlinStrategy: 'hybrid_solar_bess' },
  
  // Evening Taper (20:00 - 23:59)
  { hour: 20, load: 0.62, primaryDrivers: ['evening_operations', 'lot_lighting'], merlinStrategy: 'arbitrage' },
  { hour: 21, load: 0.55, primaryDrivers: ['late_night_food', 'maintenance_closes'], merlinStrategy: 'arbitrage' },
  { hour: 22, load: 0.48, primaryDrivers: ['late_operations', 'lot_lighting'], merlinStrategy: 'arbitrage' },
  { hour: 23, load: 0.38, primaryDrivers: ['overnight_prep', 'lot_lighting'], merlinStrategy: 'arbitrage' },
];

// ═══════════════════════════════════════════════════════════════════════════
// CRITICAL SIZING FACTORS
// Hidden load factors essential for accurate sizing
// ═══════════════════════════════════════════════════════════════════════════

export const SIZING_FACTORS = {
  // NEC 2023 Continuous Load Rule
  continuousLoadMultiplier: 1.25,
  notes: 'EV chargers & lighting running 3+ hours must be calculated at 125% of nameplate',
  
  // Thermal Management (Parasitic Load)
  thermalManagement: {
    batterySystemCooling: {
      per2MWhBattery: 15,        // kW constant cooling load
      desertLocations: 30,       // kW in AZ/NV/TX
    },
    transformerCooling: {
      per5MWTransformer: 20,     // kW
    },
  },
  
  // Diversity Factor
  diversityFactor: {
    evCharging: 0.85,            // High - assume 85% of stalls occupied at peak
    notes: 'Industry moving toward 0.8-0.9 for Truck Charging Hubs',
  },
  
  // Power Factor Correction
  powerFactor: {
    target: 0.95,
    typical: 0.85,
    inductiveEquipment: 0.80,    // Compressors, motors
    improvement: 'Capacitor banks or active PFC recommended',
  },
  
  // Inrush Current
  inrushProtection: {
    motorStartInrush: {
      compressors: 6.0,          // 600% of rated current
      hvac: 4.0,
      pumps: 4.0,
    },
    notes: 'Size BESS and breakers to handle simultaneous motor starts',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TOTAL FACILITY LOAD CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

export interface TruckStopLoadConfig {
  mcsChargers: number;
  dcfc350: number;
  level2: number;
  serviceBays: number;
  truckWashBays: number;
  restaurantSeats: number;
  hasShowers: boolean;
  hasLaundry: boolean;
  parkingLotAcres: number;
  climateZone: 'hot' | 'moderate' | 'cold';
}

export interface TruckStopLoadResult {
  peakDemandKW: number;
  annualConsumptionKWh: number;
  loadProfile: 'travel_center_curve';
  breakdown: Record<string, number>;
}

export function calculateTruckStopLoad(config: TruckStopLoadConfig): TruckStopLoadResult {
  
  const loads: Record<string, number> = {
    // EV Infrastructure (DOMINANT)
    evCharging: (
      config.mcsChargers * 1250 * 0.9 +          // MCS at 90% diversity
      config.dcfc350 * 350 * 0.85 +               // DCFC at 85% diversity
      config.level2 * 19.2 * 0.7                  // L2 at 70% diversity
    ) * SIZING_FACTORS.continuousLoadMultiplier,  // NEC 2023 rule
    
    // Maintenance
    maintenance: config.serviceBays * 60,         // 60 kW per bay average
    
    // Truck Wash
    truckWash: config.truckWashBays * 300,        // 300 kW per tunnel
    
    // Food Service
    foodService: config.restaurantSeats * 1.5,    // 1.5 kW per seat
    
    // Building & Lot
    building: 150 + (config.parkingLotAcres * 10), // Base + lot lighting
    
    // Fueling
    fueling: 60,                                   // Constant
    
    // Amenities
    showers: config.hasShowers ? 60 : 0,
    laundry: config.hasLaundry ? 70 : 0,
  };
  
  // Thermal management for desert locations
  if (config.climateZone === 'hot') {
    loads.thermalManagement = 30;  // Battery/transformer cooling
  }
  
  const totalConnectedLoad = Object.values(loads).reduce((sum, load) => sum + load, 0);
  
  // Apply diversity factor (not all equipment at max simultaneously)
  const peakDemandKW = Math.round(totalConnectedLoad * 0.85);  // 85% diversity
  
  // Annual consumption based on load profile
  const averageLoadFactor = 0.65;  // 65% average utilization
  const annualConsumptionKWh = Math.round(peakDemandKW * averageLoadFactor * 8760);
  
  return {
    peakDemandKW,
    annualConsumptionKWh,
    loadProfile: 'travel_center_curve',
    breakdown: loads,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BESS SIZING RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const BESS_RECOMMENDATIONS = {
  minimumDuration: 2,              // hours - absolute minimum
  recommendedDuration: 4,          // hours - for demand charge management
  extendedDuration: 6,             // hours - for UPS mode / no solar/gen
  
  // Size to handle the EV charging spike
  powerRating: {
    rule: 'Size to 1.5x peak EV charging load to handle inrush',
    example: 'If MCS + DCFC = 3,500 kW peak, size BESS at 5,250 kW minimum',
  },
  
  // Chemistry recommendation
  chemistry: 'LFP',                // Lithium Iron Phosphate for safety & longevity
  reason: 'High cycle count (10,000+), thermal stability for outdoor installations',
};

export default {
  TRUCK_STOP_INDUSTRY,
  EQUIPMENT_PROFILES,
  DAILY_LOAD_PROFILE,
  SIZING_FACTORS,
  calculateTruckStopLoad,
  BESS_RECOMMENDATIONS,
};
