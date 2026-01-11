/**
 * Industry Calculation Templates
 * SSOT for all industry-specific calculation factors
 * 
 * This module is the SINGLE SOURCE OF TRUTH for industry calculation factors.
 * All factors are pulled from the database (calculation_constants table) with code fallbacks.
 * 
 * Similar to solarTemplates.ts, but for load calculations, BESS sizing, and other industry metrics.
 * 
 * Database Integration:
 * - Factors are stored in calculation_constants table
 * - Key format: {industry}_{factor} (e.g., 'hotel_kw_per_room', 'datacenter_pue_tier3')
 * - Falls back to hardcoded values if database unavailable
 */

import { getConstant } from './calculationConstantsService';

// ============================================================================
// TYPES
// ============================================================================

export interface IndustryTemplate {
  industry: string;
  displayName: string;
  
  // Load calculation method
  calculationMethod: 'per_unit' | 'per_sqft' | 'fixed' | 'custom';
  unitName?: string;  // 'rooms', 'beds', 'chargers', etc.
  
  // Base factors (pulled from DB with fallbacks)
  baseFactor: number;  // kW per unit or kW per sqft
  loadFactor: number;  // 0-1 (diversity factor for average vs peak)
  loadProfile: 'flat' | 'peaky' | 'seasonal';
  
  // Industry-specific multipliers
  amenityMultipliers?: Record<string, number>;  // e.g., { restaurant: 0.15, pool: 0.08 }
  tierMultipliers?: Record<string, number>;      // e.g., { tier1: 1.0, tier2: 1.2 }
  departmentMultipliers?: Record<string, number>; // e.g., { icu: 0.15, or: 0.10 }
  
  // Equipment factors (for custom calculations)
  equipmentFactors?: Record<string, number>;
  
  // Documentation
  assumptions: string[];
  dataSource: string;
  notes: string;
}

// ============================================================================
// TEMPLATE FACTORIES (Pull from DB with fallbacks)
// ============================================================================

/**
 * Get industry template with database integration
 * Pulls factors from calculation_constants table, falls back to hardcoded values
 */
export async function getIndustryTemplate(industry: string): Promise<IndustryTemplate> {
  // Try to get from database first, then fall back to hardcoded templates
  const templates = await getIndustryTemplatesFromDB();
  return templates[industry] || FALLBACK_TEMPLATES[industry] || FALLBACK_TEMPLATES.default;
}

/**
 * Load all industry templates from database
 * Falls back to hardcoded templates if DB unavailable
 */
async function getIndustryTemplatesFromDB(): Promise<Record<string, IndustryTemplate>> {
  const templates: Record<string, IndustryTemplate> = {};
  
  try {
    // Load factors from database for each industry
    // Format: await getConstant('{industry}_{factor}')
    
    // HOTEL
    // Use existing key 'hotel_peak_demand_per_room_kw' or fallback to 'hotel_kw_per_room'
    const hotelKWPerRoom = await getConstant('hotel_peak_demand_per_room_kw') || await getConstant('hotel_kw_per_room') || 2.0;
    const hotelLoadFactor = await getConstant('hotel_load_factor') || 0.45;
    templates.hotel = {
      industry: 'hotel',
      displayName: 'Hotel & Hospitality',
      calculationMethod: 'per_unit',
      unitName: 'rooms',
      baseFactor: hotelKWPerRoom,
      loadFactor: hotelLoadFactor,
      loadProfile: 'peaky',
      amenityMultipliers: {
        restaurant: await getConstant('hotel_restaurant_multiplier') || 0.15,
        pool: await getConstant('hotel_pool_multiplier') || 0.08,
        spa: await getConstant('hotel_spa_multiplier') || 0.05,
        conference: await getConstant('hotel_conference_multiplier') || 0.10,
        evCharging: await getConstant('hotel_ev_charging_demand_kw') || 7.2,
      },
      assumptions: [
        `${hotelKWPerRoom} kW per room (peak demand)`,
        `${(hotelLoadFactor * 100).toFixed(0)}% load factor (average vs peak)`,
        'Peaky profile: Higher demand during check-in (3-6pm) and morning HVAC surge (6-9am)',
        'Amenity multipliers applied based on facility type',
      ],
      dataSource: 'CBECS 2018, ASHRAE 90.1, Marriott Energy Benchmarks',
      notes: 'Hotels have high 24/7 energy demand. Peak occurs during check-in and morning HVAC cycles.',
    };
    
    // DATA CENTER
    const dcKWPerSqft = await getConstant('datacenter_kw_per_sqft') || 150;
    const dcLoadFactor = await getConstant('datacenter_load_factor') || 0.85;
    templates.data_center = {
      industry: 'data_center',
      displayName: 'Data Center',
      calculationMethod: 'per_sqft',
      baseFactor: dcKWPerSqft,
      loadFactor: dcLoadFactor,
      loadProfile: 'flat',
      tierMultipliers: {
        tier1: await getConstant('datacenter_pue_tier1') || 1.67,
        tier2: await getConstant('datacenter_pue_tier2') || 1.75,
        tier3: await getConstant('datacenter_pue_tier3') || 1.98,
        tier4: await getConstant('datacenter_pue_tier4') || 2.50,
      },
      assumptions: [
        `${dcKWPerSqft} W/sqft peak demand (IT + cooling)`,
        `${(dcLoadFactor * 100).toFixed(0)}% load factor (high utilization)`,
        'Flat profile: 24/7 operation with minimal variation',
        'PUE multipliers by tier (Uptime Institute classification)',
      ],
      dataSource: 'Uptime Institute Tier Classification, ASHRAE TC 9.9',
      notes: 'Data centers require high reliability. BESS sizing must account for tier-based redundancy.',
    };
    
    // HOSPITAL
    const hospitalKWPerBed = await getConstant('hospital_kw_per_bed') || 8.0;
    const hospitalLoadFactor = await getConstant('hospital_load_factor') || 0.65;
    templates.hospital = {
      industry: 'hospital',
      displayName: 'Hospital',
      calculationMethod: 'per_unit',
      unitName: 'beds',
      baseFactor: hospitalKWPerBed,
      loadFactor: hospitalLoadFactor,
      loadProfile: 'flat',
      departmentMultipliers: {
        icu: await getConstant('hospital_icu_multiplier') || 0.15,
        operatingRooms: await getConstant('hospital_or_multiplier') || 0.10,
        imaging: await getConstant('hospital_imaging_multiplier') || 0.05,
      },
      assumptions: [
        `${hospitalKWPerBed} kW per bed (peak demand)`,
        `${(hospitalLoadFactor * 100).toFixed(0)}% load factor (high utilization)`,
        'Flat profile: 24/7 critical operations',
        'Department multipliers for specialized equipment',
      ],
      dataSource: 'ASHRAE Healthcare Facilities, NFPA 99',
      notes: 'Hospitals require critical backup power. BESS must support life-safety systems.',
    };
    
    // EV CHARGING
    // Use existing keys from 'ev_charging' category
    templates.ev_charging = {
      industry: 'ev_charging',
      displayName: 'EV Charging Hub',
      calculationMethod: 'custom',
      baseFactor: 0, // Calculated from charger count
      loadFactor: await getConstant('ev_charging_load_factor') || 0.25,
      loadProfile: 'peaky',
      equipmentFactors: {
        level2: await getConstant('ev_charger_level2_kw') || 7.2,
        dcfc50: await getConstant('ev_charger_dcfc_50_kw') || 50,
        dcfc150: await getConstant('ev_charger_dcfc_150_kw') || 150,
        hpc250: await getConstant('ev_charger_hpc_250_kw') || 250,
        hpc350: await getConstant('ev_charger_hpc_350_kw') || 350,
        megawatt: await getConstant('ev_megawatt_kw') || 1000, // May not exist yet
      },
      assumptions: [
        'Charger-based calculation (not per sqft)',
        'Concurrency factor: 60-90% (not all chargers active simultaneously)',
        'Peaky profile: Commute hours (7-9am, 4-7pm) and weekend afternoons',
        'Load factor accounts for utilization and diversity',
      ],
      dataSource: 'SAE J1772, CHAdeMO, CCS Standards',
      notes: 'EV charging requires high power density. BESS helps manage demand charges and grid constraints.',
    };
    
    // TRUCK STOP
    templates.heavy_duty_truck_stop = {
      industry: 'heavy_duty_truck_stop',
      displayName: 'Heavy Duty Truck Stop / Travel Center',
      calculationMethod: 'custom',
      baseFactor: 0, // Calculated from equipment
      loadFactor: await getConstant('truck_stop_load_factor') || 0.65,
      loadProfile: 'peaky',
      equipmentFactors: {
        mcsCharger: await getConstant('truck_stop_mcs_kw') || 1000,
        dcfc350: await getConstant('truck_stop_dcfc350_kw') || 350,
        level2: await getConstant('truck_stop_level2_kw') || 19.2,
        serviceBay: await getConstant('truck_stop_service_bay_kw') || 50,
        truckWashBay: await getConstant('truck_stop_wash_bay_kw') || 100,
        restaurantSeat: await getConstant('truck_stop_restaurant_kw_per_seat') || 0.5,
      },
      assumptions: [
        'Equipment-based calculation (MCS chargers, DCFC, service bays, etc.)',
        'Travel Center Curve: Combines commuter peaks + logistics peaks + hospitality peaks',
        'High diversity factor due to intermittent equipment operation',
        '1.25x continuous load rule for infrastructure (NEC 2023)',
      ],
      dataSource: 'NACS Travel Center Standards, NEC 2023',
      notes: 'Truck stops are high-voltage nodes with demand profiles comparable to small manufacturing plants.',
    };
    
    // MANUFACTURING
    const mfgKWPerSqft = await getConstant('manufacturing_kw_per_sqft') || 30;
    const mfgLoadFactor = await getConstant('manufacturing_load_factor') || 0.55;
    templates.manufacturing = {
      industry: 'manufacturing',
      displayName: 'Manufacturing',
      calculationMethod: 'per_sqft',
      baseFactor: mfgKWPerSqft,
      loadFactor: mfgLoadFactor,
      loadProfile: 'peaky',
      assumptions: [
        `${mfgKWPerSqft} W/sqft peak demand (varies by process type)`,
        `${(mfgLoadFactor * 100).toFixed(0)}% load factor (equipment cycling)`,
        'Peaky profile: Higher demand during production shifts',
        'Process-specific factors may apply (e.g., metalworking, food processing)',
      ],
      dataSource: 'DOE Manufacturing Energy Consumption Survey',
      notes: 'Manufacturing facilities benefit from BESS for demand charge reduction and load shifting.',
    };
    
    // RETAIL
    const retailKWPerSqft = await getConstant('retail_kw_per_sqft') || 15;
    const retailLoadFactor = await getConstant('retail_load_factor') || 0.40;
    templates.retail = {
      industry: 'retail',
      displayName: 'Retail',
      calculationMethod: 'per_sqft',
      baseFactor: retailKWPerSqft,
      loadFactor: retailLoadFactor,
      loadProfile: 'peaky',
      assumptions: [
        `${retailKWPerSqft} W/sqft peak demand (lighting intensive)`,
        `${(retailLoadFactor * 100).toFixed(0)}% load factor (customer traffic patterns)`,
        'Peaky profile: Higher demand during business hours and peak shopping times',
      ],
      dataSource: 'CBECS 2018, Energy Star Portfolio Manager',
      notes: 'Retail stores have high daytime energy demand for lighting and HVAC.',
    };
    
    // WAREHOUSE
    const warehouseKWPerSqft = await getConstant('warehouse_kw_per_sqft') || 8;
    const warehouseLoadFactor = await getConstant('warehouse_load_factor') || 0.50;
    templates.warehouse = {
      industry: 'warehouse',
      displayName: 'Warehouse & Logistics',
      calculationMethod: 'per_sqft',
      baseFactor: warehouseKWPerSqft,
      loadFactor: warehouseLoadFactor,
      loadProfile: 'flat',
      assumptions: [
        `${warehouseKWPerSqft} W/sqft peak demand (forklifts, lighting, HVAC)`,
        `${(warehouseLoadFactor * 100).toFixed(0)}% load factor (material handling equipment)`,
        'Flat profile: Consistent operations throughout day',
      ],
      dataSource: 'CBECS 2018, ASHRAE 90.1',
      notes: 'Warehouses offer large roof area for solar. BESS enables load shifting for material handling.',
    };
    
    // OFFICE
    const officeKWPerSqft = await getConstant('office_kw_per_sqft') || 12;
    const officeLoadFactor = await getConstant('office_load_factor') || 0.35;
    templates.office = {
      industry: 'office',
      displayName: 'Office',
      calculationMethod: 'per_sqft',
      baseFactor: officeKWPerSqft,
      loadFactor: officeLoadFactor,
      loadProfile: 'peaky',
      assumptions: [
        `${officeKWPerSqft} W/sqft peak demand (lighting, HVAC, computers)`,
        `${(officeLoadFactor * 100).toFixed(0)}% load factor (occupancy patterns)`,
        'Peaky profile: Higher demand during business hours (8am-6pm)',
      ],
      dataSource: 'CBECS 2018, ASHRAE 90.1',
      notes: 'Office buildings have predictable peak hours. BESS can reduce demand charges.',
    };
    
    // CAR WASH
    templates.car_wash = {
      industry: 'car_wash',
      displayName: 'Car Wash',
      calculationMethod: 'custom',
      baseFactor: 0, // Calculated from equipment
      loadFactor: await getConstant('car_wash_load_factor') || 0.35,
      loadProfile: 'peaky',
      equipmentFactors: {
        conveyorMotor: await getConstant('car_wash_conveyor_motor_kw') || 7.5,
        highPressurePump: await getConstant('car_wash_high_pressure_pump_kw') || 15,
        blowerMotor: await getConstant('car_wash_blower_motor_kw') || 15,
        electricWaterHeater: await getConstant('car_wash_electric_water_heater_kw') || 36,
        vacuumStation: await getConstant('car_wash_vacuum_station_kw') || 3,
      },
      assumptions: [
        'Equipment-based calculation (pumps, blowers, water heaters, vacuums)',
        'Peak factor: 75% of connected load (not all equipment runs simultaneously)',
        'Peaky profile: Higher demand during peak hours (weekends, evenings)',
      ],
      dataSource: 'Car Wash Industry Equipment Standards',
      notes: 'Car washes are ideal for solar + storage due to high daytime energy usage.',
    };
    
    // AIRPORT
    templates.airport = {
      industry: 'airport',
      displayName: 'Airport',
      calculationMethod: 'custom',
      baseFactor: 0, // Tier-based calculation
      loadFactor: await getConstant('airport_load_factor') || 0.70,
      loadProfile: 'peaky',
      tierMultipliers: {
        smallRegional: (await getConstant('airport_small_regional_mw')) || 2.0,
        mediumRegional: (await getConstant('airport_medium_regional_mw')) || 6.0,
        largeRegional: (await getConstant('airport_large_regional_mw')) || 18.0,
        majorHub: (await getConstant('airport_major_hub_mw')) || 55.0,
        megaHub: (await getConstant('airport_mega_hub_mw')) || 175.0,
      },
      assumptions: [
        'Tier-based calculation (passenger volume determines size)',
        'Combines terminal loads, IT/communications, emergency power, HVAC',
        'Peaky profile: Higher demand during flight operations and passenger peaks',
      ],
      dataSource: 'FAA Airport Design Standards, ASHRAE',
      notes: 'Airports require critical backup power and high reliability systems.',
    };
    
    // COLLEGE/UNIVERSITY
    const collegeKWPerSqft = await getConstant('college_kw_per_sqft') || 18;
    const collegeLoadFactor = await getConstant('college_load_factor') || 0.40;
    templates.college = {
      industry: 'college',
      displayName: 'College & University',
      calculationMethod: 'per_sqft',
      baseFactor: collegeKWPerSqft,
      loadFactor: collegeLoadFactor,
      loadProfile: 'seasonal',
      assumptions: [
        `${collegeKWPerSqft} W/sqft peak demand`,
        `${(collegeLoadFactor * 100).toFixed(0)}% load factor (academic calendar patterns)`,
        'Seasonal profile: Higher demand during academic year, lower during breaks',
      ],
      dataSource: 'CBECS 2018, ASHRAE 90.1',
      notes: 'Colleges have seasonal variation. BESS can help manage peak demand during academic year.',
    };
    
  } catch (error) {
    console.warn('⚠️ Failed to load industry templates from database, using fallbacks:', error);
  }
  
  return templates;
}

// ============================================================================
// FALLBACK TEMPLATES (Hardcoded if DB unavailable)
// ============================================================================

export const FALLBACK_TEMPLATES: Record<string, IndustryTemplate> = {
  hotel: {
    industry: 'hotel',
    displayName: 'Hotel & Hospitality',
    calculationMethod: 'per_unit',
    unitName: 'rooms',
    baseFactor: 2.0, // Updated to match existing DB key: hotel_peak_demand_per_room_kw (value: 2)
    loadFactor: 0.45,
    loadProfile: 'peaky',
    amenityMultipliers: {
      restaurant: 0.15,
      pool: 0.08,
      spa: 0.05,
      conference: 0.10,
      evCharging: 7.2, // From hotel_ev_charging_demand_kw
    },
    assumptions: [
      '2.5 kW per room (peak demand)',
      '45% load factor (average vs peak)',
      'Peaky profile: Higher demand during check-in (3-6pm) and morning HVAC surge',
    ],
    dataSource: 'CBECS 2018, ASHRAE 90.1',
    notes: 'Hotels have high 24/7 energy demand.',
  },
  
  data_center: {
    industry: 'data_center',
    displayName: 'Data Center',
    calculationMethod: 'per_sqft',
    baseFactor: 150,
    loadFactor: 0.85,
    loadProfile: 'flat',
    tierMultipliers: {
      tier1: 1.67,
      tier2: 1.75,
      tier3: 1.98,
      tier4: 2.50,
    },
    assumptions: [
      '150 W/sqft peak demand (IT + cooling)',
      '85% load factor (high utilization)',
      'Flat profile: 24/7 operation',
    ],
    dataSource: 'Uptime Institute Tier Classification',
    notes: 'Data centers require high reliability.',
  },
  
  hospital: {
    industry: 'hospital',
    displayName: 'Hospital',
    calculationMethod: 'per_unit',
    unitName: 'beds',
    baseFactor: 8.0,
    loadFactor: 0.65,
    loadProfile: 'flat',
    departmentMultipliers: {
      icu: 0.15,
      operatingRooms: 0.10,
      imaging: 0.05,
    },
    assumptions: [
      '8 kW per bed (peak demand)',
      '65% load factor (high utilization)',
      'Flat profile: 24/7 critical operations',
    ],
    dataSource: 'ASHRAE Healthcare Facilities',
    notes: 'Hospitals require critical backup power.',
  },
  
  ev_charging: {
    industry: 'ev_charging',
    displayName: 'EV Charging Hub',
    calculationMethod: 'custom',
    baseFactor: 0,
    loadFactor: 0.25,
    loadProfile: 'peaky',
    equipmentFactors: {
      level2: 7.2, // Updated to match existing DB key: ev_charger_level2_kw
      dcfc50: 50,
      dcfc150: 150,
      hpc250: 250,
      hpc350: 350,
      megawatt: 1000,
    },
    assumptions: [
      'Charger-based calculation',
      'Concurrency factor: 60-90%',
      'Peaky profile: Commute hours',
    ],
    dataSource: 'SAE J1772, CHAdeMO, CCS Standards',
    notes: 'EV charging requires high power density.',
  },
  
  heavy_duty_truck_stop: {
    industry: 'heavy_duty_truck_stop',
    displayName: 'Heavy Duty Truck Stop / Travel Center',
    calculationMethod: 'custom',
    baseFactor: 0,
    loadFactor: 0.65,
    loadProfile: 'peaky',
    equipmentFactors: {
      mcsCharger: 1000,
      dcfc350: 350,
      level2: 19.2,
      serviceBay: 50,
      truckWashBay: 100,
      restaurantSeat: 0.5,
    },
    assumptions: [
      'Equipment-based calculation',
      'Travel Center Curve: Multiple peak types',
      'High diversity factor',
    ],
    dataSource: 'NACS Travel Center Standards',
    notes: 'Truck stops are high-voltage nodes.',
  },
  
  manufacturing: {
    industry: 'manufacturing',
    displayName: 'Manufacturing',
    calculationMethod: 'per_sqft',
    baseFactor: 30,
    loadFactor: 0.55,
    loadProfile: 'peaky',
    assumptions: [
      '30 W/sqft peak demand',
      '55% load factor',
      'Peaky profile: Production shifts',
    ],
    dataSource: 'DOE Manufacturing Energy Consumption Survey',
    notes: 'Manufacturing benefits from BESS for demand charge reduction.',
  },
  
  retail: {
    industry: 'retail',
    displayName: 'Retail',
    calculationMethod: 'per_sqft',
    baseFactor: 15,
    loadFactor: 0.40,
    loadProfile: 'peaky',
    assumptions: [
      '15 W/sqft peak demand',
      '40% load factor',
      'Peaky profile: Business hours',
    ],
    dataSource: 'CBECS 2018',
    notes: 'Retail stores have high daytime energy demand.',
  },
  
  warehouse: {
    industry: 'warehouse',
    displayName: 'Warehouse & Logistics',
    calculationMethod: 'per_sqft',
    baseFactor: 8,
    loadFactor: 0.50,
    loadProfile: 'flat',
    assumptions: [
      '8 W/sqft peak demand',
      '50% load factor',
      'Flat profile: Consistent operations',
    ],
    dataSource: 'CBECS 2018',
    notes: 'Warehouses offer large roof area for solar.',
  },
  
  office: {
    industry: 'office',
    displayName: 'Office',
    calculationMethod: 'per_sqft',
    baseFactor: 12,
    loadFactor: 0.35,
    loadProfile: 'peaky',
    assumptions: [
      '12 W/sqft peak demand',
      '35% load factor',
      'Peaky profile: Business hours',
    ],
    dataSource: 'CBECS 2018',
    notes: 'Office buildings have predictable peak hours.',
  },
  
  car_wash: {
    industry: 'car_wash',
    displayName: 'Car Wash',
    calculationMethod: 'custom',
    baseFactor: 0,
    loadFactor: 0.35,
    loadProfile: 'peaky',
    equipmentFactors: {
      conveyorMotor: 7.5,
      highPressurePump: 15,
      blowerMotor: 15,
      electricWaterHeater: 36,
      vacuumStation: 3,
    },
    assumptions: [
      'Equipment-based calculation',
      'Peak factor: 75% of connected load',
      'Peaky profile: Peak hours',
    ],
    dataSource: 'Car Wash Industry Equipment Standards',
    notes: 'Car washes are ideal for solar + storage.',
  },
  
  airport: {
    industry: 'airport',
    displayName: 'Airport',
    calculationMethod: 'custom',
    baseFactor: 0,
    loadFactor: 0.70,
    loadProfile: 'peaky',
    tierMultipliers: {
      smallRegional: 2.0,
      mediumRegional: 6.0,
      largeRegional: 18.0,
      majorHub: 55.0,
      megaHub: 175.0,
    },
    assumptions: [
      'Tier-based calculation',
      'Combines terminal loads, IT, emergency power, HVAC',
      'Peaky profile: Flight operations',
    ],
    dataSource: 'FAA Airport Design Standards',
    notes: 'Airports require critical backup power.',
  },
  
  college: {
    industry: 'college',
    displayName: 'College & University',
    calculationMethod: 'per_sqft',
    baseFactor: 18,
    loadFactor: 0.40,
    loadProfile: 'seasonal',
    assumptions: [
      '18 W/sqft peak demand',
      '40% load factor',
      'Seasonal profile: Academic calendar',
    ],
    dataSource: 'CBECS 2018',
    notes: 'Colleges have seasonal variation.',
  },
  
  // Default fallback
  default: {
    industry: 'default',
    displayName: 'Generic Commercial',
    calculationMethod: 'per_sqft',
    baseFactor: 15,
    loadFactor: 0.40,
    loadProfile: 'peaky',
    assumptions: [
      '15 W/sqft peak demand (generic commercial)',
      '40% load factor',
      'Peaky profile: Business hours',
    ],
    dataSource: 'CBECS 2018 (generic)',
    notes: 'Generic commercial building template.',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get base factor for an industry (kW per unit or kW per sqft)
 */
export async function getIndustryBaseFactor(industry: string): Promise<number> {
  const template = await getIndustryTemplate(industry);
  return template.baseFactor;
}

/**
 * Get load factor for an industry (diversity factor)
 */
export async function getIndustryLoadFactor(industry: string): Promise<number> {
  const template = await getIndustryTemplate(industry);
  return template.loadFactor;
}

/**
 * Get amenity multiplier for hotels
 */
export async function getHotelAmenityMultiplier(amenity: string): Promise<number> {
  const template = await getIndustryTemplate('hotel');
  return template.amenityMultipliers?.[amenity] || 0;
}

/**
 * Get tier multiplier for data centers
 */
export async function getDatacenterTierMultiplier(tier: string): Promise<number> {
  const template = await getIndustryTemplate('data_center');
  return template.tierMultipliers?.[tier] || 1.0;
}

/**
 * Get department multiplier for hospitals
 */
export async function getHospitalDepartmentMultiplier(department: string): Promise<number> {
  const template = await getIndustryTemplate('hospital');
  return template.departmentMultipliers?.[department] || 0;
}

/**
 * Get equipment factor for custom calculations
 */
export async function getEquipmentFactor(industry: string, equipment: string): Promise<number> {
  const template = await getIndustryTemplate(industry);
  return template.equipmentFactors?.[equipment] || 0;
}
