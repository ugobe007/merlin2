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
    DOSING_PUMP: 0.5,
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
  WEEKS_PER_YEAR: 52,
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
    solarSystem.totalSolarKW * 1000 * CONSTANTS.SOLAR_COST_PER_W +
    bessSystem.batteryCapacityKWh * CONSTANTS.BESS_COST_PER_KWH;

  const totalAnnualSavings = solarSystem.annualSavings + bessSystem.annualSavings;
  const totalTenYearSavings = totalAnnualSavings * 10;
  const combinedPayback = totalSystemCost / totalAnnualSavings;
  const roi = (totalTenYearSavings - totalSystemCost) / totalSystemCost;

  return {
    version: "2.1.0",
    timestamp: new Date().toISOString(),
    industry: "car_wash",
    facilityType: answers.facilityType || "unknown",
    inputs: answers,
    energyProfile,
    solarSystem,
    bessSystem,
    totalSystemCost,
    totalAnnualSavings,
    totalTenYearSavings,
    combinedPayback,
    roi,
  };
}

// ============================================================================
// ENERGY PROFILE CALCULATION
// ============================================================================
export function calculateEnergyProfile(answers: Record<string, any>): EnergyProfile {
  const loads = calculateEquipmentLoads(answers);
  const totalEquipmentLoad = Object.values(loads).reduce((sum, load) => sum + load, 0);

  // Apply diversity factor (not all equipment runs simultaneously)
  const calculatedPeak = totalEquipmentLoad * CONSTANTS.DIVERSITY_FACTOR;

  // Billing override: if the user provided their actual peak demand from the bill,
  // use it directly — it's more accurate than our equipment estimate.
  const billPeakKw = answers.peakDemandKw != null ? Number(answers.peakDemandKw) : 0;
  const peakDemand = billPeakKw > 0 ? billPeakKw : calculatedPeak;

  const averageDemand = peakDemand * CONSTANTS.LOAD_FACTOR;
  const loadFactor = averageDemand / peakDemand;

  // Operating hours
  const operatingHours =
    parseInt(String(answers.operatingHours)) || CONSTANTS.DEFAULT_OPERATING_HOURS;
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
    annualOperatingHours,
  };
}

// ============================================================================
// EQUIPMENT LOADS CALCULATION
// ============================================================================
export function calculateEquipmentLoads(answers: Record<string, any>): EquipmentLoads {
  const { HP_TO_KW, EQUIPMENT } = CONSTANTS;

  // Helper: extract .type from a type_then_quantity answer object
  const ttnType = (raw: unknown, fallback: string): string => {
    if (typeof raw === "object" && raw !== null)
      return String((raw as Record<string, unknown>).type ?? fallback);
    return String(raw ?? fallback);
  };
  const ttnQty = (raw: unknown, fallback: string): string => {
    if (typeof raw === "object" && raw !== null)
      return String((raw as Record<string, unknown>).quantity ?? fallback);
    return fallback;
  };

  // ── Blower / Dryer Producers (v2 field: blowerMotorSize) ──
  // Backward compat: also handles legacy dryerConfiguration string answers
  const blowerRaw = answers.blowerMotorSize;
  const legacyDryerConfig = String(answers.dryerConfiguration || "blowers");
  let resolvedBlowerCount: number;
  let resolvedBlowerHP: number;
  if (blowerRaw != null) {
    // New v2 field: type_then_quantity { type: HP, quantity: count }
    resolvedBlowerHP = Number(ttnType(blowerRaw, "10"));
    resolvedBlowerCount = Number(ttnQty(blowerRaw, "10")) || 10;
  } else {
    // Legacy fallback
    resolvedBlowerHP = EQUIPMENT.BLOWER;
    resolvedBlowerCount =
      answers.blowerCount != null
        ? parseInt(String(answers.blowerCount))
        : legacyDryerConfig === "blowers"
          ? 6
          : legacyDryerConfig === "heated"
            ? 4
            : legacyDryerConfig === "hybrid"
              ? 5
              : legacyDryerConfig === "none"
                ? 0
                : 10;
  }

  // ── High-Pressure Pumps (v2 field: highPressurePumps) ──
  const pumpsRaw = answers.highPressurePumps;
  let resolvedPumpKW: number;
  if (pumpsRaw != null) {
    // New v2 field: type_then_quantity { type: HP, quantity: count }
    const pumpHP = Number(ttnType(pumpsRaw, "10"));
    const pumpCount = Number(ttnQty(pumpsRaw, "3")) || 3;
    resolvedPumpKW = pumpHP * HP_TO_KW * pumpCount;
  } else {
    // Legacy: pumpConfiguration + highPressurePumpCount
    const pumpConfig = String(answers.pumpConfiguration || "standard");
    const pumpKWEach =
      pumpConfig === "vfd"
        ? EQUIPMENT.HIGH_PRESSURE_PUMP * HP_TO_KW * 0.75
        : pumpConfig === "high_pressure"
          ? EQUIPMENT.HIGH_PRESSURE_PUMP * HP_TO_KW
          : EQUIPMENT.HIGH_PRESSURE_PUMP * HP_TO_KW * 0.67;
    resolvedPumpKW = (parseInt(String(answers.highPressurePumpCount)) || 3) * pumpKWEach;
  }

  // ── Brush Motors (v2 branching: brushDriveType) ──
  let resolvedBrushKW: number;
  if (answers.brushDriveType != null) {
    const brushDriveType = String(answers.brushDriveType);
    if (brushDriveType === "electric") {
      const hp = answers.brushElectricHP != null ? Number(answers.brushElectricHP) : 1.5;
      const count = answers.brushElectricCount != null ? Number(answers.brushElectricCount) : 10;
      resolvedBrushKW = hp * HP_TO_KW * count;
    } else {
      const hp = answers.brushHydraulicPackHP != null ? Number(answers.brushHydraulicPackHP) : 10;
      const count =
        answers.brushHydraulicPackCount != null ? Number(answers.brushHydraulicPackCount) : 1;
      resolvedBrushKW = hp * HP_TO_KW * count;
    }
  } else {
    // Legacy brushMotorCount
    resolvedBrushKW =
      (parseInt(String(answers.brushMotorCount)) || 15) * EQUIPMENT.BRUSH_MOTOR * HP_TO_KW;
  }

  // ── Vacuum (v2: vacuumType branching) ──
  let resolvedVacuumKW: number;
  if (answers.vacuumType != null) {
    const vacType = String(answers.vacuumType);
    if (vacType === "central") {
      const hp = answers.vacuumCentralHP != null ? Number(answers.vacuumCentralHP) : 25;
      const count =
        answers.vacuumCentralMotorCount != null ? Number(answers.vacuumCentralMotorCount) : 1;
      resolvedVacuumKW = hp * HP_TO_KW * count;
    } else {
      const stalls = answers.vacuumStalls != null ? Number(answers.vacuumStalls) : 10;
      resolvedVacuumKW = stalls * 3 * 1.6 * HP_TO_KW;
    }
  } else {
    resolvedVacuumKW = (parseInt(String(answers.centralVacuumHP)) || 30) * HP_TO_KW;
  }

  // ── Conveyor (v2: type_then_quantity with HP + chain/dual_belt) ──
  let resolvedConveyorKW: number;
  const convRaw = answers.conveyorMotorSize;
  if (convRaw != null) {
    const convHP = Number(ttnType(convRaw, "20"));
    const convMotorCount = ttnQty(convRaw, "chain") === "dual_belt" ? 2 : 1;
    resolvedConveyorKW = convHP * HP_TO_KW * convMotorCount;
  } else {
    resolvedConveyorKW = 0;
  }

  // ── Air Compressor (v2: airCompressorSize, legacy: airCompressor) ──
  let resolvedCompressorKW: number;
  const compRaw = answers.airCompressorSize ?? answers.airCompressor;
  if (compRaw != null) {
    const compHP = Number(ttnType(compRaw, "10"));
    const compCount = Number(ttnQty(compRaw, "1")) || 1;
    resolvedCompressorKW = compHP * HP_TO_KW * compCount;
  } else {
    resolvedCompressorKW = 10 * HP_TO_KW;
  }

  // ── Water Heater (v2: explicit fuel type) ──
  const WATER_HEATER_LOAD: Record<string, number> = {
    gas: 0,
    natural_gas: 0,
    electric: 40,
    tankless_electric: 35,
    heat_pump: 15,
  };
  const resolvedWaterHeaterKW = WATER_HEATER_LOAD[String(answers.waterHeaterType ?? "gas")] ?? 0;

  // ── HVAC (v2: hvacBuilding fuel type) ──
  const HVAC_LOAD: Record<string, number> = {
    none: 0,
    gas_furnace: 0,
    electric_heat_pump: 15,
  };
  const resolvedHvacKW = HVAC_LOAD[String(answers.hvacBuilding ?? "none")] ?? 0;

  // ── Lighting ──
  const LIGHTING_LOAD: Record<string, number> = {
    led: 5,
    mixed: 8,
    fluorescent: 12,
    basic: 5,
    enhanced: 8,
    premium: 15,
  };
  const lightingKW =
    LIGHTING_LOAD[String(answers.lightingType ?? answers.tunnelLighting ?? "led")] ?? 8;

  // ── Signage (v2: type_then_quantity) ──
  const signRaw = answers.exteriorSignage;
  const signType = ttnType(signRaw, "standard");
  const signCount = Number(ttnQty(signRaw, "1")) || 1;
  const SIGN_KW: Record<string, number> = {
    standard: 5,
    large_led: 10,
    basic: 5,
    premium: 10,
    signature: 20,
  };
  const resolvedSignageKW = (SIGN_KW[signType] ?? 5) * signCount;

  // ── EV Charging (v2: evChargingExisting) ──
  const evRaw = answers.evChargingExisting ?? answers.evCharging;
  const resolvedEvKW =
    evRaw != null
      ? (() => {
          const evType = ttnType(evRaw, "none");
          if (evType === "none") return 0;
          const evCount = Number(ttnQty(evRaw, "0")) || 0;
          return evCount * (evType === "dcfc" ? 50 : 7.2);
        })()
      : getEVChargingLoad(answers.evCharging);

  // ── Kiosks ──
  const kioskRaw = answers.kioskControls ?? answers.paymentKiosks;
  let resolvedKioskKW: number;
  if (kioskRaw != null && typeof kioskRaw === "object") {
    const hasKiosks = ttnType(kioskRaw, "yes") !== "no";
    const count = hasKiosks ? Number(ttnQty(kioskRaw, "2")) || 2 : 0;
    resolvedKioskKW = count * EQUIPMENT.PAYMENT_KIOSK;
  } else {
    resolvedKioskKW = (parseInt(String(answers.paymentKiosks)) || 2) * EQUIPMENT.PAYMENT_KIOSK;
  }

  return {
    // High-Pressure Pumps (20-30% of total load)
    highPressurePumps: resolvedPumpKW,

    // RO Pump (v2: roSystem yes/no; legacy: roSystemPump size)
    roPump:
      answers.roSystem != null
        ? String(answers.roSystem) === "yes"
          ? 4
          : 0
        : getRoPumpLoad(answers.roSystemPump),

    // Water Heater
    waterHeater: resolvedWaterHeaterKW,

    // Reclaim Pumps (v2: reclaimSystem; legacy: waterReclamation)
    reclaimPumps:
      answers.reclaimSystem != null
        ? answers.reclaimSystem === "full_vfd"
          ? 11
          : answers.reclaimSystem === "none"
            ? 0
            : 7
        : getReclaimPumpLoad(answers.waterReclamation),

    // Conveyor
    conveyor: resolvedConveyorKW,

    // Brush Motors
    brushMotors: resolvedBrushKW,

    // Blowers (50-60% of total load — v2 uses blowerMotorSize)
    blowers: resolvedBlowerHP * HP_TO_KW * resolvedBlowerCount,

    // Heated Dryers (legacy only — v2 folds into blower HP selection)
    heatedDryers: 0,

    // Vacuum
    centralVacuum: resolvedVacuumKW,

    // Vacuum Stations (legacy field — v2 absorbed into vacuumType)
    vacuumStations: 0,

    // Air Compressor
    airCompressor: resolvedCompressorKW,

    // Dosing Pumps (estimate)
    dosingPumps: 5 * EQUIPMENT.DOSING_PUMP,

    // Payment Kiosks
    paymentKiosks: resolvedKioskKW,

    // Tunnel Lighting
    tunnelLighting: lightingKW,

    // Exterior Signage
    exteriorSignage: resolvedSignageKW,

    // HVAC (new v2 field)
    officeFacilities: resolvedHvacKW + getOfficeFacilitiesLoad(answers.officeFacilities),

    // Security Cameras (estimate)
    securityCameras: 0.5,

    // EV Charging
    evCharging: resolvedEvKW,
  };
}

// ============================================================================
// HELPER FUNCTIONS FOR EQUIPMENT LOADS
// ============================================================================
function getRoPumpLoad(size: string): number {
  const loads: Record<string, number> = {
    none: 0,
    small: 3.7,
    medium: 7.5,
    large: 11.2,
  };
  return loads[size] || 3.7;
}

function getReclaimPumpLoad(system: string): number {
  const loads: Record<string, number> = {
    none: 0,
    partial: 7.5,
    full: 15,
    advanced: 22.5,
  };
  return loads[system] || 0;
}

function getLightingLoad(type: string): number {
  const loads: Record<string, number> = {
    basic: 5,
    enhanced: 8,
    premium: 15,
  };
  return loads[type] || 8;
}

function getSignageLoad(type: string): number {
  const loads: Record<string, number> = {
    basic: 5,
    premium: 10,
    signature: 20,
  };
  return loads[type] || 10;
}

function getOfficeFacilitiesLoad(facilities: string[]): number {
  if (!Array.isArray(facilities)) return 0;
  const loads: Record<string, number> = {
    office: 2,
    break_room: 3,
    bathrooms: 1,
    security: 0.5,
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
    SOLAR_COST_PER_W,
  } = CONSTANTS;

  // Roof
  const roofArea = parseFloat(String(answers.roofArea)) || 0;
  const roofUsableArea = roofArea * ROOF_USABLE_FACTOR;
  const roofSolarKW = roofUsableArea * SOLAR_DENSITY;

  // Carport
  const includeCarport = answers.carportInterest === "yes";
  const carportArea = includeCarport ? parseFloat(String(answers.carportArea)) || 0 : 0;
  const carportUsableArea = carportArea * CARPORT_USABLE_FACTOR;
  const carportSolarKW = carportUsableArea * SOLAR_DENSITY;

  // Total
  const totalSolarKW = roofSolarKW + carportSolarKW;
  const annualGeneration = totalSolarKW * ANNUAL_GENERATION_FACTOR;

  // System Size Category
  const getSystemSize = (kw: number): string => {
    if (kw < 50) return "Small";
    if (kw < 100) return "Medium";
    if (kw < 250) return "Large";
    if (kw < 500) return "Extra Large";
    return "Industrial";
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
    simplePayback,
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

  // Billing overrides: use user's actual demand charge rate if provided.
  // If they confirmed demand charges don't apply, savings from that source = $0.
  const demandChargeApplies = String(answers.demandChargeApplies ?? "unsure");
  const userRateRaw = answers.demandChargeRate;
  const effectiveDemandCharge =
    demandChargeApplies === "no"
      ? 0
      : userRateRaw != null && String(userRateRaw) !== "unsure"
        ? Number(userRateRaw)
        : DEMAND_CHARGE; // national default: $15/kW-mo

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
  const demandChargeReduction = peakShaving * effectiveDemandCharge * 12; // Annual

  // Energy Arbitrage (charge from solar, discharge during peak)
  const dailyArbitrage = batteryCapacityKWh * 0.9 * ELECTRICITY_RATE; // 90% efficiency
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
    tenYearSavings,
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
  calculateBESSSystem,
};
