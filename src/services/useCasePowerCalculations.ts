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
 * Source: CBECS 2018, hospitality industry benchmarks
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
  // Industry standard power ratings
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
    calculationMethod: 'SAE J1772/CCS standards',
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
      // Support multiple field name formats from different parts of the UI
      // Database: dcfastCount, level2Count
      // UI variants: numberOfDCFastChargers, dcFastChargers, numberOfLevel2Chargers, level2Chargers
      return calculateEVChargingPower(
        parseInt(useCaseData.level1Count || useCaseData.numberOfLevel1Chargers || useCaseData.level1Chargers) || 0,
        parseInt(useCaseData.level2Count || useCaseData.numberOfLevel2Chargers || useCaseData.level2Chargers) || 0,
        parseInt(useCaseData.dcfastCount || useCaseData.numberOfDCFastChargers || useCaseData.dcFastChargers) || 0
      );
      
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
      return calculateCarWashPower(
        parseInt(useCaseData.bayCount || useCaseData.numBays) || 3,
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
      const homeSqFt = parseInt(useCaseData.sqFt || useCaseData.homeSize) || 2000;
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
