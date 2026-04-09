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
 *   waterHeaterType, pumpConfiguration, waterReclamation,
 *   dryerConfiguration, vacuumStations, evCharging, evChargingType, paymentKiosks,
 *   conveyorMotorSize, brushMotorCount, centralVacuumHP, highPressurePumpCount, roSystemPump,
 *   airCompressor, tunnelLighting, exteriorSignage, officeFacilities
 *
 * NOT consumed (UI-conditional gate only, does not affect load):
 *   naturalGasLine  ← only drives waterHeaterType option visibility in Step 3 UI
 *
 * DERIVED (not direct schema questions):
 *   blowerCount   ← derived from dryerConfiguration (blowers=6, heated=4, hybrid=5, none=0)
 *   heatedDryers  ← derived from dryerConfiguration (heated|hybrid → true)
 *   kWPerPump     ← derived from pumpConfiguration  (vfd=5.6, high_pressure=11.2, multiple=9.3, standard=7.5)
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
  tunnel: { hoursPerDay: 12, daysPerWeek: 7 },
  automatic: { hoursPerDay: 14, daysPerWeek: 7 },
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
  "waterHeaterType",
  "pumpConfiguration",
  "waterReclamation",
  "dryerConfiguration",
  "vacuumStations",
  "evCharging",
  "evChargingType",
  "paymentKiosks",
  "conveyorMotorSize",
  "brushMotorCount",
  "centralVacuumHP",
  "highPressurePumpCount",
  "roSystemPump",
  "airCompressor",
  "tunnelLighting",
  "exteriorSignage",
  "officeFacilities",
] as const;

// ============================================================================
// ADAPTER IMPLEMENTATION
// ============================================================================

function mapAnswers(answers: Record<string, unknown>, _schemaKey: string): NormalizedLoadInputs {
  // ── Scale ──
  const bayCount = answers.tunnelOrBayCount != null ? Number(answers.tunnelOrBayCount) : 4;
  const washType = String(answers.facilityType || "tunnel").toLowerCase();

  // ── Schedule ──
  const defaultSchedule = WASH_TYPE_SCHEDULE[washType] ?? { hoursPerDay: 12, daysPerWeek: 7 };
  const hoursPerDay =
    answers.operatingHours != null ? Number(answers.operatingHours) : defaultSchedule.hoursPerDay;
  const daysPerWeek =
    answers.daysPerWeek != null ? Number(answers.daysPerWeek) : defaultSchedule.daysPerWeek;

  // ── Process Loads ──
  // Car wash has very detailed equipment questions — map each to a ProcessLoad
  const processLoads: ProcessLoad[] = [];

  // Blowers / Dryers (dominant load: 62.5% of total per industry standard)
  // Derive from dryerConfiguration (schema question) → blowerCount + heatedDryers
  // dryerConfiguration is a type_then_quantity → stored as { type, quantity } object
  const dryerConfigRaw = answers.dryerConfiguration;
  const dryerConfig =
    typeof dryerConfigRaw === "object" && dryerConfigRaw !== null
      ? String((dryerConfigRaw as Record<string, unknown>).type || "blowers")
      : String(dryerConfigRaw || "blowers");
  const dryerQty =
    typeof dryerConfigRaw === "object" && dryerConfigRaw !== null
      ? String((dryerConfigRaw as Record<string, unknown>).quantity || "")
      : "";
  // Map quantity tier (from quantityOptions) → number of blowers
  const DRYER_QTY_COUNT: Record<string, number> = {
    standard: 4,
    premium: 6,
    heated: 4,
    none: 0,
  };
  const blowerCount =
    answers.blowerCount != null
      ? Number(answers.blowerCount)
      : DRYER_QTY_COUNT[dryerQty] != null
        ? DRYER_QTY_COUNT[dryerQty]
        : dryerConfig === "blowers"
          ? 6
          : dryerConfig === "heated"
            ? 4
            : dryerConfig === "hybrid"
              ? 5
              : dryerConfig === "none"
                ? 0
                : 6;
  const heatedDryers =
    answers.heatedDryers != null
      ? toBool(answers.heatedDryers)
      : dryerConfig === "heated" || dryerConfig === "hybrid";
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
  // pumpConfiguration drives kW-per-pump: VFD = 25% savings, high_pressure = 15HP, standard = 10HP
  const pumpConfig = String(answers.pumpConfiguration || "standard");
  const kWPerPump =
    pumpConfig === "vfd"
      ? 5.6 // 10HP × 0.746 × 0.75 (VFD 25% savings)
      : pumpConfig === "high_pressure"
        ? 11.2 // 15HP × 0.746
        : pumpConfig === "multiple"
          ? 9.3 // 12.5HP × 0.746 (staged system)
          : 7.5; // standard 10HP × 0.746
  const hpPumpCount =
    answers.highPressurePumpCount != null ? Number(answers.highPressurePumpCount) : bayCount * 2;
  processLoads.push({
    category: "process",
    label: "High-Pressure Wash Pumps",
    kW: hpPumpCount * kWPerPump,
    dutyCycle: 0.5,
    quantity: hpPumpCount,
    kWPerUnit: kWPerPump,
  });

  // Conveyor motor (tunnel only)
  // conveyorMotorSize options are HP values ("5", "10", "15") — multiply by 0.746 for kW
  if (washType === "tunnel") {
    const conveyorKW =
      answers.conveyorMotorSize != null ? Number(answers.conveyorMotorSize) * 0.746 : 7.5;
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
  const brushCount =
    answers.brushMotorCount != null ? Number(answers.brushMotorCount) : bayCount * 2;
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
    const centralVacHP = answers.centralVacuumHP != null ? Number(answers.centralVacuumHP) : 30; // slider smartDefault = 30 HP (min 20, max 50)
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

  // Controls / POS
  const kiosks = answers.paymentKiosks != null ? Number(answers.paymentKiosks) : bayCount;
  processLoads.push({
    category: "controls",
    label: "PLC / Payment / Controls",
    kW: 2 + kiosks * 0.3,
    dutyCycle: 1.0,
  });

  // Air compressor — option value is HP as string ("5"/"10"/"15")
  const compressorHP = answers.airCompressor != null ? Number(answers.airCompressor) : 10;
  processLoads.push({
    category: "process",
    label: "Air Compressor",
    kW: compressorHP * 0.746,
    dutyCycle: 0.5,
    quantity: 1,
    kWPerUnit: compressorHP * 0.746,
  });

  // Tunnel lighting — option value is "basic"/"enhanced"/"premium"
  const lightingKW =
    answers.tunnelLighting === "basic" ? 5 : answers.tunnelLighting === "premium" ? 15 : 8; // "enhanced" default
  processLoads.push({
    category: "lighting",
    label: "Tunnel Lighting",
    kW: lightingKW,
    dutyCycle: 1.0,
  });

  // Exterior signage — option value is "basic"/"premium"/"signature"
  const signageKW =
    answers.exteriorSignage === "basic" ? 5 : answers.exteriorSignage === "signature" ? 20 : 10; // "premium" default
  processLoads.push({
    category: "lighting",
    label: "Exterior Signage",
    kW: signageKW,
    dutyCycle: 0.8,
  });

  // Office facilities — multiselect array
  const officeItems = Array.isArray(answers.officeFacilities)
    ? (answers.officeFacilities as string[])
    : [];
  const officeFacilitiesKW: Record<string, number> = {
    office: 2,
    break_room: 3,
    bathrooms: 1,
    security: 0.5,
  };
  const officeKW = officeItems.reduce((sum, item) => sum + (officeFacilitiesKW[item] ?? 0), 0);
  if (officeKW > 0) {
    processLoads.push({
      category: "controls",
      label: "Office Facilities",
      kW: officeKW,
      dutyCycle: 0.8,
    });
  }

  // EV charging — evCharging is a count (stepper), evChargingType drives kW per port
  const evChargerCount = answers.evCharging != null ? Number(answers.evCharging) : 0;
  if (evChargerCount > 0) {
    const evType = String(answers.evChargingType || "level2");
    const kWPerCharger =
      evType === "dcfast"
        ? 50 // DC Fast: 50–150 kW (use conservative 50)
        : evType === "both"
          ? 28.6 // Mixed fleet: avg of L2 (7.2) and DCFC (50)
          : 7.2; // Level 2: 7.2 kW (standard J1772)
    processLoads.push({
      category: "charging",
      label: `EV Chargers (${evType}, ${evChargerCount} ports)`,
      kW: evChargerCount * kWPerCharger,
      dutyCycle: 0.3,
      quantity: evChargerCount,
      kWPerUnit: kWPerCharger,
    });
  }

  // ── Architecture ──
  const gridRaw = String(answers.gridConnection || "on-grid");
  const gridConnection =
    gridRaw === "off-grid"
      ? ("off-grid" as const)
      : gridRaw === "limited"
        ? ("limited" as const)
        : ("on-grid" as const);

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
  return mapAnswers(
    {
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
    },
    "car-wash"
  );
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
