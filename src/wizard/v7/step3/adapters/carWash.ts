/**
 * CAR WASH INDUSTRY ADAPTER
 * =========================
 *
 * Created: February 8, 2026
 * Gold-standard adapter: car-wash has a curated-complete schema (21+ questions)
 *
 * Maps car wash questionnaire answers → NormalizedLoadInputs.
 *
 * QUESTION IDs consumed (from carwash-questions-complete.config.ts):
 *   facilityType, tunnelOrBayCount, operatingHours, daysPerWeek, dailyVehicles,
 *   naturalGasLine, waterHeaterType, pumpConfiguration, waterReclamation,
 *   dryerConfiguration, vacuumStations, evCharging, paymentKiosks,
 *   conveyorMotorSize, brushMotorCount, blowerCount, heatedDryers,
 *   centralVacuumHP, highPressurePumpCount, roSystemPump
 *
 * CALCULATOR: car_wash_load_v1 (reads: bayTunnelCount, averageWashesPerDay,
 *             operatingHours, carWashType, primaryEquipment)
 *
 * SSOT ALIASES (ssotInputAliases.ts):
 *   bayTunnelCount → bayCount
 */

import type { IndustryAdapter, NormalizedLoadInputs, ProcessLoad } from "../loadProfile";
import { registerAdapter } from "../step3Compute";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Car wash type → typical operating profile */
const WASH_TYPE_SCHEDULE: Record<string, { hoursPerDay: number; daysPerWeek: number }> = {
  tunnel:      { hoursPerDay: 12, daysPerWeek: 7 },
  automatic:   { hoursPerDay: 14, daysPerWeek: 7 },
  self_service: { hoursPerDay: 16, daysPerWeek: 7 },
  "self-service": { hoursPerDay: 16, daysPerWeek: 7 },
  full_service: { hoursPerDay: 10, daysPerWeek: 6 },
  "full-service": { hoursPerDay: 10, daysPerWeek: 6 },
};

/** All question IDs this adapter reads */
const CONSUMED_KEYS = [
  "facilityType",
  "tunnelOrBayCount",
  "operatingHours",
  "daysPerWeek",
  "dailyVehicles",
  "naturalGasLine",
  "waterHeaterType",
  "pumpConfiguration",
  "waterReclamation",
  "dryerConfiguration",
  "vacuumStations",
  "evCharging",
  "paymentKiosks",
  "conveyorMotorSize",
  "brushMotorCount",
  "blowerCount",
  "heatedDryers",
  "centralVacuumHP",
  "highPressurePumpCount",
  "roSystemPump",
] as const;

// ============================================================================
// ADAPTER IMPLEMENTATION
// ============================================================================

function mapAnswers(
  answers: Record<string, unknown>,
  _schemaKey: string
): NormalizedLoadInputs {
  // ── Scale ──
  const bayCount = answers.tunnelOrBayCount != null
    ? Number(answers.tunnelOrBayCount)
    : 4;
  const washType = String(answers.facilityType || "tunnel").toLowerCase();

  // ── Schedule ──
  const defaultSchedule = WASH_TYPE_SCHEDULE[washType] ?? { hoursPerDay: 12, daysPerWeek: 7 };
  const hoursPerDay = answers.operatingHours != null
    ? Number(answers.operatingHours)
    : defaultSchedule.hoursPerDay;
  const daysPerWeek = answers.daysPerWeek != null
    ? Number(answers.daysPerWeek)
    : defaultSchedule.daysPerWeek;

  // ── Process Loads ──
  // Car wash has very detailed equipment questions — map each to a ProcessLoad
  const processLoads: ProcessLoad[] = [];

  // Blowers / Dryers (dominant load: 62.5% of total per industry standard)
  const blowerCount = answers.blowerCount != null ? Number(answers.blowerCount) : 6;
  const heatedDryers = toBool(answers.heatedDryers);
  const kWPerBlower = heatedDryers ? 25 : 15; // Heated = 25kW, ambient = 15kW
  processLoads.push({
    category: "process",
    label: heatedDryers ? "Heated Blower/Dryers" : "Ambient Blower/Dryers",
    kW: blowerCount * kWPerBlower,
    dutyCycle: 0.6,
    quantity: blowerCount,
    kWPerUnit: kWPerBlower,
  });

  // High-pressure pumps
  const hpPumpCount = answers.highPressurePumpCount != null
    ? Number(answers.highPressurePumpCount)
    : bayCount * 2;
  const kWPerPump = 7.5; // Typical HP wash pump
  processLoads.push({
    category: "process",
    label: "High-Pressure Wash Pumps",
    kW: hpPumpCount * kWPerPump,
    dutyCycle: 0.5,
    quantity: hpPumpCount,
    kWPerUnit: kWPerPump,
  });

  // Conveyor motor (tunnel only)
  if (washType === "tunnel") {
    const conveyorKW = answers.conveyorMotorSize != null
      ? Number(answers.conveyorMotorSize)
      : 10;
    processLoads.push({
      category: "process",
      label: "Conveyor Motor",
      kW: conveyorKW,
      dutyCycle: 0.7,
      quantity: 1,
      kWPerUnit: conveyorKW,
    });
  }

  // Brush motors
  const brushCount = answers.brushMotorCount != null
    ? Number(answers.brushMotorCount)
    : bayCount * 2;
  if (brushCount > 0) {
    processLoads.push({
      category: "process",
      label: "Brush Motors",
      kW: brushCount * 3, // ~3kW per brush motor
      dutyCycle: 0.5,
      quantity: brushCount,
      kWPerUnit: 3,
    });
  }

  // RO system pump (water reclamation)
  if (toBool(answers.roSystemPump) || answers.waterReclamation === "full") {
    processLoads.push({
      category: "process",
      label: "RO / Water Reclamation System",
      kW: 5,
      dutyCycle: 0.8,
    });
  }

  // Vacuum stations
  const vacStations = answers.vacuumStations != null ? Number(answers.vacuumStations) : 4;
  if (vacStations > 0) {
    const centralVacHP = answers.centralVacuumHP != null ? Number(answers.centralVacuumHP) : 15;
    const vacKW = centralVacHP * 0.746; // HP to kW conversion
    processLoads.push({
      category: "process",
      label: "Vacuum System",
      kW: vacKW,
      dutyCycle: 0.4,
      quantity: vacStations,
    });
  }

  // Water heater (if electric)
  const waterHeater = String(answers.waterHeaterType || "gas");
  if (waterHeater === "electric" || waterHeater === "heat-pump") {
    processLoads.push({
      category: "process",
      label: `Water Heater (${waterHeater})`,
      kW: waterHeater === "heat-pump" ? 15 : 30,
      dutyCycle: 0.6,
    });
  }

  // Lighting (always present, minimal for outdoor)
  processLoads.push({
    category: "lighting",
    label: "Facility Lighting",
    kW: 5 + bayCount * 2, // Base 5kW + 2kW per bay
    dutyCycle: 0.5,
  });

  // Controls / POS
  const kiosks = answers.paymentKiosks != null ? Number(answers.paymentKiosks) : bayCount;
  processLoads.push({
    category: "controls",
    label: "PLC / Payment / Controls",
    kW: 2 + kiosks * 0.3,
    dutyCycle: 1.0,
  });

  // EV charging (if present at car wash)
  const hasEV = toBool(answers.evCharging);
  if (hasEV) {
    processLoads.push({
      category: "charging",
      label: "EV Chargers",
      kW: 20, // ~2-3 Level 2 chargers
      dutyCycle: 0.3,
    });
  }

  // ── Architecture ──
  const gridRaw = String(answers.gridConnection || "on-grid");
  const gridConnection = gridRaw === "off-grid"
    ? "off-grid" as const
    : gridRaw === "limited" ? "limited" as const : "on-grid" as const;

  return {
    industrySlug: "car_wash",
    schedule: {
      hoursPerDay: Math.min(24, Math.max(1, hoursPerDay)),
      daysPerWeek: Math.min(7, Math.max(1, daysPerWeek)),
      profileType: "commercial",
    },
    scale: {
      kind: "bays",
      value: bayCount,
      subType: washType,
    },
    hvac: {
      class: "none", // Car washes are outdoor/minimal HVAC
      heatingType: "none",
      coolingType: "none",
    },
    processLoads,
    architecture: {
      gridConnection,
      criticality: "none",
    },
    _rawExtensions: {
      dailyVehicles: answers.dailyVehicles != null ? Number(answers.dailyVehicles) : 200,
      carWashType: washType,
    },
  };
}

function getDefaultInputs(): NormalizedLoadInputs {
  return mapAnswers({
    facilityType: "tunnel",
    tunnelOrBayCount: 4,
    operatingHours: 12,
    daysPerWeek: 7,
    dailyVehicles: 200,
    blowerCount: 6,
    heatedDryers: "no",
    highPressurePumpCount: 8,
    brushMotorCount: 8,
    vacuumStations: 4,
    centralVacuumHP: 15,
    waterHeaterType: "gas",
    gridConnection: "on-grid",
  }, "car-wash");
}

// ============================================================================
// HELPERS
// ============================================================================

function toBool(val: unknown): boolean {
  if (val === true || val === "yes" || val === "true" || val === 1) return true;
  if (val === false || val === "no" || val === "false" || val === 0 || val == null) return false;
  const s = String(val).toLowerCase();
  return s === "yes" || s === "true" || s === "1";
}

// ============================================================================
// REGISTRATION
// ============================================================================

export const carWashAdapter: IndustryAdapter = {
  industrySlug: "car_wash",
  mapAnswers,
  getDefaultInputs,
  consumedAnswerKeys: CONSUMED_KEYS,
};

// Self-register on import
registerAdapter(carWashAdapter);
