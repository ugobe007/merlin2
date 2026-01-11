/**
 * Complete TrueQuote Engine
 * 
 * Comprehensive energy calculations for car wash facilities
 * Calculates: Equipment loads, peak demand, solar capacity, BESS sizing
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export interface EquipmentLoads {
  // Water Systems
  highPressurePumps: number;
  roPump: number;
  waterHeater: number;
  reclaimPumps: number;
  // Mechanical
  conveyor: number;
  brushMotors: number;
  // Drying
  blowers: number;
  heatedDryers: number;
  // Customer Amenities
  centralVacuum: number;
  vacuumStations: number;
  // Support Systems
  airCompressor: number;
  dosingPumps: number;
  // Facilities
  paymentKiosks: number;
  tunnelLighting: number;
  exteriorSignage: number;
  officeFacilities: number;
  securityCameras: number;
  // Future/Optional
  evCharging: number;
}

export interface EnergyProfile {
  // Equipment
  equipmentLoads: EquipmentLoads;
  totalEquipmentLoad: number;
  // Demand
  peakDemand: number;
  averageDemand: number;
  loadFactor: number;
  // Consumption
  dailyConsumption: number;
  annualConsumption: number;
  // Operating Pattern
  operatingHours: number;
  daysPerWeek: number;
  annualOperatingHours: number;
}

export interface SolarSystem {
  // Roof
  roofArea: number;
  roofUsableFactor: number;
  roofUsableArea: number;
  roofSolarKW: number;
  // Carport
  carportArea: number;
  carportUsableFactor: number;
  carportUsableArea: number;
  carportSolarKW: number;
  // Total System
  totalSolarKW: number;
  systemSize: string;
  annualGeneration: number;
  // Economics
  monthlySavings: number;
  annualSavings: number;
  tenYearSavings: number;
  simplePayback: number;
}

export interface BESSSystem {
  // Sizing
  peakShaving: number;
  backupHours: number;
  batteryCapacityKWh: number;
  batteryPowerKW: number;
  // Economics
  demandChargeReduction: number;
  annualSavings: number;
  tenYearSavings: number;
}

export interface CompleteQuote {
  version: string;
  timestamp: string;
  industry: string;
  // Input Data
  facilityType: string;
  inputs: Record<string, any>;
  // Calculations
  energyProfile: EnergyProfile;
  solarSystem: SolarSystem;
  bessSystem: BESSSystem;
  // Combined Economics
  totalSystemCost: number;
  totalAnnualSavings: number;
  totalTenYearSavings: number;
  combinedPayback: number;
  roi: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const CONSTANTS = {
  // Power Conversions
  HP_TO_KW: 0.746,
  // Solar
  ROOF_USABLE_FACTOR: 0.65, // Car wash roofs (HVAC, vents, setbacks)
  CARPORT_USABLE_FACTOR: 1.0, // Purpose-built carports
  SOLAR_DENSITY: 0.15, // kW per sq ft (150W per sq ft, 400W panels)
  ANNUAL_GENERATION_FACTOR: 1200, // kWh per kW per year (varies by location)
  // Equipment Defaults (HP ratings)
  EQUIPMENT: {
    HIGH_PRESSURE_PUMP: 15,
    BRUSH_MOTOR: 3,
    BLOWER: 12,
    HEATED_DRYER_BONUS: 40, // kW
    VACUUM_STATION: 3,
    PAYMENT_KIOSK: 0.5,
    DOSING_PUMP: 0.5
  },
  // Load Factors
  LOAD_FACTOR: 0.7, // Average vs peak
  DIVERSITY_FACTOR: 0.85, // Not all equipment runs simultaneously
  // Economics
  ELECTRICITY_RATE: 0.12, // $/kWh
  DEMAND_CHARGE: 15, // $/kW/month
  SOLAR_COST_PER_W: 2.5, // $2.50/W installed
  BESS_COST_PER_KWH: 500, // $500/kWh installed
  // Operating Assumptions
  DEFAULT_OPERATING_HOURS: 12,
  DEFAULT_DAYS_PER_WEEK: 7,
  WEEKS_PER_YEAR: 52
};

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================
export function calculateCompleteQuote(answers: Record<string, any>): CompleteQuote {
  // Energy Profile
  const energyProfile = calculateEnergyProfile(answers);

  // Solar System
  const solarSystem = calculateSolarSystem(answers, energyProfile);

  // BESS System
  const bessSystem = calculateBESSSystem(answers, energyProfile, solarSystem);

  // Combined Economics
  const totalSystemCost =
    (solarSystem.totalSolarKW * 1000 * CONSTANTS.SOLAR_COST_PER_W) +
    (bessSystem.batteryCapacityKWh * CONSTANTS.BESS_COST_PER_KWH);

  const totalAnnualSavings = solarSystem.annualSavings + bessSystem.annualSavings;
  const totalTenYearSavings = totalAnnualSavings * 10;
  const combinedPayback = totalSystemCost / totalAnnualSavings;
  const roi = (totalTenYearSavings - totalSystemCost) / totalSystemCost;

  return {
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    industry: 'car_wash',
    facilityType: answers.facilityType || 'unknown',
    inputs: answers,
    energyProfile,
    solarSystem,
    bessSystem,
    totalSystemCost,
    totalAnnualSavings,
    totalTenYearSavings,
    combinedPayback,
    roi
  };
}

// ============================================================================
// ENERGY PROFILE CALCULATION
// ============================================================================
export function calculateEnergyProfile(answers: Record<string, any>): EnergyProfile {
  const loads = calculateEquipmentLoads(answers);
  const totalEquipmentLoad = Object.values(loads).reduce((sum, load) => sum + load, 0);

  // Apply diversity factor (not all equipment runs simultaneously)
  const peakDemand = totalEquipmentLoad * CONSTANTS.DIVERSITY_FACTOR;
  const averageDemand = peakDemand * CONSTANTS.LOAD_FACTOR;
  const loadFactor = averageDemand / peakDemand;

  // Operating hours
  const operatingHours = parseInt(String(answers.operatingHours)) || CONSTANTS.DEFAULT_OPERATING_HOURS;
  const daysPerWeek = parseInt(String(answers.daysPerWeek)) || CONSTANTS.DEFAULT_DAYS_PER_WEEK;
  const annualOperatingHours = operatingHours * daysPerWeek * CONSTANTS.WEEKS_PER_YEAR;

  // Consumption
  const dailyConsumption = averageDemand * operatingHours;
  const annualConsumption = averageDemand * annualOperatingHours;

  return {
    equipmentLoads: loads,
    totalEquipmentLoad,
    peakDemand,
    averageDemand,
    loadFactor,
    dailyConsumption,
    annualConsumption,
    operatingHours,
    daysPerWeek,
    annualOperatingHours
  };
}

// ============================================================================
// EQUIPMENT LOADS CALCULATION
// ============================================================================
export function calculateEquipmentLoads(answers: Record<string, any>): EquipmentLoads {
  const { HP_TO_KW, EQUIPMENT } = CONSTANTS;

  return {
    // High-Pressure Pumps (20-30% of total load)
    highPressurePumps:
      (parseInt(String(answers.highPressurePumpCount)) || 3) * EQUIPMENT.HIGH_PRESSURE_PUMP * HP_TO_KW,

    // RO Pump
    roPump: getRoPumpLoad(answers.roSystemPump),

    // Water Heater (only electric)
    waterHeater: answers.waterHeaterType === 'electric' ? 50 : 0,

    // Reclaim Pumps
    reclaimPumps: getReclaimPumpLoad(answers.waterReclamation),

    // Conveyor
    conveyor: answers.conveyorMotorSize ? 
      parseInt(String(answers.conveyorMotorSize)) * HP_TO_KW : 0,

    // Brush Motors
    brushMotors: 
      (parseInt(String(answers.brushMotorCount)) || 15) * EQUIPMENT.BRUSH_MOTOR * HP_TO_KW,

    // Blowers (40-50% of total load!)
    blowers: 
      (parseInt(String(answers.blowerCount)) || 10) * EQUIPMENT.BLOWER * HP_TO_KW,

    // Heated Dryers (additional load)
    heatedDryers: answers.heatedDryers ? EQUIPMENT.HEATED_DRYER_BONUS : 0,

    // Central Vacuum
    centralVacuum: 
      (parseInt(String(answers.centralVacuumHP)) || 30) * HP_TO_KW,

    // Vacuum Stations
    vacuumStations: 
      (parseInt(String(answers.vacuumStations)) || 8) * EQUIPMENT.VACUUM_STATION * HP_TO_KW,

    // Air Compressor
    airCompressor: 
      (parseInt(String(answers.airCompressor)) || 10) * HP_TO_KW,

    // Dosing Pumps (estimate)
    dosingPumps: 5 * EQUIPMENT.DOSING_PUMP,

    // Payment Kiosks
    paymentKiosks: 
      (parseInt(String(answers.paymentKiosks)) || 2) * EQUIPMENT.PAYMENT_KIOSK,

    // Tunnel Lighting
    tunnelLighting: getLightingLoad(answers.tunnelLighting),

    // Exterior Signage
    exteriorSignage: getSignageLoad(answers.exteriorSignage),

    // Office Facilities
    officeFacilities: getOfficeFacilitiesLoad(answers.officeFacilities),

    // Security Cameras (estimate)
    securityCameras: 0.5,

    // EV Charging
    evCharging: getEVChargingLoad(answers.evCharging)
  };
}

// ============================================================================
// HELPER FUNCTIONS FOR EQUIPMENT LOADS
// ============================================================================
function getRoPumpLoad(size: string): number {
  const loads: Record<string, number> = {
    'none': 0,
    'small': 3.7,
    'medium': 7.5,
    'large': 11.2
  };
  return loads[size] || 3.7;
}

function getReclaimPumpLoad(system: string): number {
  const loads: Record<string, number> = {
    'none': 0,
    'partial': 7.5,
    'full': 15,
    'advanced': 22.5
  };
  return loads[system] || 0;
}

function getLightingLoad(type: string): number {
  const loads: Record<string, number> = {
    'basic': 5,
    'enhanced': 8,
    'premium': 15
  };
  return loads[type] || 8;
}

function getSignageLoad(type: string): number {
  const loads: Record<string, number> = {
    'basic': 5,
    'premium': 10,
    'signature': 20
  };
  return loads[type] || 10;
}

function getOfficeFacilitiesLoad(facilities: string[]): number {
  if (!Array.isArray(facilities)) return 0;
  const loads: Record<string, number> = {
    'office': 2,
    'break_room': 3,
    'bathrooms': 1,
    'security': 0.5
  };
  return facilities.reduce((sum, facility) => sum + (loads[facility] || 0), 0);
}

function getEVChargingLoad(evData: any): number {
  if (!evData || !evData.hasExisting) return 0;
  const level2 = (evData.existing?.level2 || 0) * 11; // 11 kW each
  const dcfast = (evData.existing?.dcfast || 0) * 100; // 100 kW each
  return level2 + dcfast;
}

// ============================================================================
// SOLAR SYSTEM CALCULATION
// ============================================================================
export function calculateSolarSystem(
  answers: Record<string, any>,
  energyProfile: EnergyProfile
): SolarSystem {
  const {
    ROOF_USABLE_FACTOR,
    CARPORT_USABLE_FACTOR,
    SOLAR_DENSITY,
    ANNUAL_GENERATION_FACTOR,
    ELECTRICITY_RATE,
    SOLAR_COST_PER_W
  } = CONSTANTS;

  // Roof
  const roofArea = parseFloat(String(answers.roofArea)) || 0;
  const roofUsableArea = roofArea * ROOF_USABLE_FACTOR;
  const roofSolarKW = roofUsableArea * SOLAR_DENSITY;

  // Carport
  const includeCarport = answers.carportInterest === 'yes';
  const carportArea = includeCarport ? (parseFloat(String(answers.carportArea)) || 0) : 0;
  const carportUsableArea = carportArea * CARPORT_USABLE_FACTOR;
  const carportSolarKW = carportUsableArea * SOLAR_DENSITY;

  // Total
  const totalSolarKW = roofSolarKW + carportSolarKW;
  const annualGeneration = totalSolarKW * ANNUAL_GENERATION_FACTOR;

  // System Size Category
  const getSystemSize = (kw: number): string => {
    if (kw < 50) return 'Small';
    if (kw < 100) return 'Medium';
    if (kw < 250) return 'Large';
    if (kw < 500) return 'Extra Large';
    return 'Industrial';
  };

  // Economics
  const annualSavings = annualGeneration * ELECTRICITY_RATE;
  const monthlySavings = annualSavings / 12;
  const tenYearSavings = annualSavings * 10;
  const systemCost = totalSolarKW * 1000 * SOLAR_COST_PER_W;
  const simplePayback = systemCost / annualSavings;

  return {
    roofArea,
    roofUsableFactor: ROOF_USABLE_FACTOR,
    roofUsableArea,
    roofSolarKW,
    carportArea,
    carportUsableFactor: CARPORT_USABLE_FACTOR,
    carportUsableArea,
    carportSolarKW,
    totalSolarKW,
    systemSize: getSystemSize(totalSolarKW),
    annualGeneration,
    monthlySavings,
    annualSavings,
    tenYearSavings,
    simplePayback
  };
}

// ============================================================================
// BESS SYSTEM CALCULATION
// ============================================================================
export function calculateBESSSystem(
  answers: Record<string, any>,
  energyProfile: EnergyProfile,
  solarSystem: SolarSystem
): BESSSystem {
  const { DEMAND_CHARGE, ELECTRICITY_RATE } = CONSTANTS;

  // Peak Shaving: Reduce peak demand by 30-40%
  const peakShaving = energyProfile.peakDemand * 0.35;

  // Backup Hours: Typically 2-4 hours for critical loads
  const backupHours = 4;
  const criticalLoad = energyProfile.averageDemand * 0.5; // 50% of average is critical

  // Battery Sizing
  const batteryCapacityKWh = Math.max(
    peakShaving * 2, // 2 hours of peak shaving
    criticalLoad * backupHours // Backup duration
  );
  const batteryPowerKW = peakShaving;

  // Demand Charge Reduction
  const demandChargeReduction = peakShaving * DEMAND_CHARGE * 12; // Annual

  // Energy Arbitrage (charge from solar, discharge during peak)
  const dailyArbitrage = (batteryCapacityKWh * 0.9) * ELECTRICITY_RATE; // 90% efficiency
  const annualArbitrage = dailyArbitrage * 250; // 250 operating days

  // Total Savings
  const annualSavings = demandChargeReduction + annualArbitrage;
  const tenYearSavings = annualSavings * 10;

  return {
    peakShaving,
    backupHours,
    batteryCapacityKWh,
    batteryPowerKW,
    demandChargeReduction,
    annualSavings,
    tenYearSavings
  };
}

// ============================================================================
// EXPORTS
// ============================================================================
export default {
  calculateCompleteQuote,
  calculateEnergyProfile,
  calculateEquipmentLoads,
  calculateSolarSystem,
  calculateBESSSystem
};
