/**
 * CAR WASH INDUSTRY ADAPTER — v2
 * ================================
 *
 * Updated: April 2026 (Vineet Kapila PE market research restructure)
 * Maps car wash questionnaire answers → NormalizedLoadInputs.
 *
 * QUESTION IDs consumed (from carwash-questions-complete.config.ts):
 *   Facility:   facilityType, tunnelOrBayCount, operatingHours, daysPerWeek,
 *               dailyVehicles, peakCarsPerHour
 *   Zone A:     kioskControls, conveyorMotorSize
 *   Zone B:     highPressurePumps, brushDriveType, brushElectricHP,
 *               brushElectricCount, brushHydraulicPackHP, brushHydraulicPackCount,
 *               reclaimSystem, roSystem
 *   Zone C:     blowerMotorSize   ← PRIMARY BESS TARGET (50–60% of total draw)
 *   Zone D:     vacuumStalls, vacuumType, vacuumCentralHP, vacuumCentralMotorCount,
 *               airCompressorSize, evChargingExisting
 *   Zone E:     lightingType, exteriorSignage, hvacBuilding, waterHeaterType
 *
 * PHYSICS:
 *   HP_TO_KW = 0.746 (applied to EVERY HP input — no exceptions)
 *   dutyCycle = min(peakCarsPerHour / TUNNEL_CAPACITY[facilityType], 1.0)
 *   Variable loads (scale with car volume): blowers, pumps, brushes
 *   Always-on loads (constant): conveyor, lighting, signage, controls, HVAC, water heater
 *
 * SSOT ALIASES (ssotInputAliases.ts):
 *   bayTunnelCount → bayCount
 */

import type { IndustryAdapter, NormalizedLoadInputs, ProcessLoad } from "../loadProfile";
import { registerAdapter } from "../step3Compute";

// ============================================================================
// CONSTANTS
// ============================================================================

const HP_TO_KW = 0.746;

/** Car wash type → typical operating profile */
const WASH_TYPE_SCHEDULE: Record<string, { hoursPerDay: number; daysPerWeek: number }> = {
  express_tunnel: { hoursPerDay: 12, daysPerWeek: 7 },
  flex_service: { hoursPerDay: 10, daysPerWeek: 6 },
  mini_tunnel: { hoursPerDay: 12, daysPerWeek: 7 },
  in_bay_automatic: { hoursPerDay: 14, daysPerWeek: 7 },
  self_serve: { hoursPerDay: 16, daysPerWeek: 7 },
  // legacy aliases kept for backward compatibility
  tunnel: { hoursPerDay: 12, daysPerWeek: 7 },
  automatic: { hoursPerDay: 14, daysPerWeek: 7 },
  full_service: { hoursPerDay: 10, daysPerWeek: 6 },
  "full-service": { hoursPerDay: 10, daysPerWeek: 6 },
  self_service: { hoursPerDay: 16, daysPerWeek: 7 },
  "self-service": { hoursPerDay: 16, daysPerWeek: 7 },
};

/** Standard rated capacity (cars/hr) by facility type — drives duty cycle */
const TUNNEL_CAPACITY: Record<string, number> = {
  express_tunnel: 50,
  flex_service: 30,
  mini_tunnel: 40,
  in_bay_automatic: 15,
  self_serve: 10,
  tunnel: 50,
  automatic: 15,
  full_service: 30,
};

/** All question IDs this adapter reads */
const CONSUMED_KEYS = [
  "facilityType",
  "tunnelOrBayCount",
  "operatingHours",
  "daysPerWeek",
  "dailyVehicles",
  "peakCarsPerHour",
  "kioskControls",
  "conveyorMotorSize",
  "highPressurePumps",
  "brushDriveType",
  "brushElectricHP",
  "brushElectricCount",
  "brushHydraulicPackHP",
  "brushHydraulicPackCount",
  "reclaimSystem",
  "roSystem",
  "blowerMotorSize",
  "vacuumStalls",
  "vacuumType",
  "vacuumCentralHP",
  "vacuumCentralMotorCount",
  "airCompressorSize",
  "evChargingExisting",
  "lightingType",
  "exteriorSignage",
  "hvacBuilding",
  "waterHeaterType",
  // Billing / Utility (P1 additions — override calc estimates when provided)
  "demandChargeApplies",
  "peakDemandKw",
  "demandChargeRate",
  "monthlyKwh",
] as const;

// ============================================================================
// ADAPTER IMPLEMENTATION
// ============================================================================

function mapAnswers(answers: Record<string, unknown>, _schemaKey: string): NormalizedLoadInputs {
  // ── Scale ──
  const bayCount = answers.tunnelOrBayCount != null ? Number(answers.tunnelOrBayCount) : 1;
  const washType = String(answers.facilityType || "express_tunnel").toLowerCase();

  // ── Schedule ──
  const defaultSchedule = WASH_TYPE_SCHEDULE[washType] ?? { hoursPerDay: 12, daysPerWeek: 7 };
  const hoursPerDay =
    answers.operatingHours != null ? Number(answers.operatingHours) : defaultSchedule.hoursPerDay;
  const daysPerWeek =
    answers.daysPerWeek != null ? Number(answers.daysPerWeek) : defaultSchedule.daysPerWeek;

  // ── Duty Cycle from peak throughput (Vineet spec — drives BESS sizing delta) ──
  const tunnelCap = TUNNEL_CAPACITY[washType] ?? 50;
  const peakCPH =
    answers.peakCarsPerHour != null ? Number(answers.peakCarsPerHour) : tunnelCap * 0.7;
  const dutyCycle = Math.min(peakCPH / tunnelCap, 1.0);

  const processLoads: ProcessLoad[] = [];

  const isTunnel =
    washType === "express_tunnel" ||
    washType === "mini_tunnel" ||
    washType === "flex_service" ||
    washType === "tunnel";

  // ── ZONE C: Blower / Dryer Producers (50–60% of draw — PRIMARY BESS TARGET) ──
  // blowerMotorSize = type_then_quantity { type: HP string, quantity: count string }
  const blowerRaw = answers.blowerMotorSize;
  const blowerHP = Number(ttnType(blowerRaw, "10"));
  const blowerCount = Number(ttnQty(blowerRaw, "10")) || 10;
  const blowerKWEach = blowerHP * HP_TO_KW;
  processLoads.push({
    category: "process",
    label: "Blower / Dryer Producers",
    kW: blowerKWEach * blowerCount * dutyCycle,
    dutyCycle,
    quantity: blowerCount,
    kWPerUnit: blowerKWEach,
  });

  // ── ZONE A: Conveyor Motor (always-on — no dutyCycle scaling) ──
  // conveyorMotorSize = type_then_quantity { type: HP, quantity: "chain"|"dual_belt" }
  if (isTunnel) {
    const convRaw = answers.conveyorMotorSize;
    const convHP = Number(ttnType(convRaw, "20"));
    const convMotorCount = ttnQty(convRaw, "chain") === "dual_belt" ? 2 : 1;
    const convKWEach = convHP * HP_TO_KW;
    processLoads.push({
      category: "process",
      label: "Conveyor Motor",
      kW: convKWEach * convMotorCount, // always-on: full load, no duty scaling
      dutyCycle: 1.0,
      quantity: convMotorCount,
      kWPerUnit: convKWEach,
    });
  }

  // ── ZONE B: High-Pressure Wash Pumps ──
  // highPressurePumps = type_then_quantity { type: HP, quantity: count }
  const pumpsRaw = answers.highPressurePumps;
  const pumpHP = Number(ttnType(pumpsRaw, "10"));
  const pumpCount = Number(ttnQty(pumpsRaw, "3")) || 3;
  const pumpKWEach = pumpHP * HP_TO_KW;
  processLoads.push({
    category: "process",
    label: "High-Pressure Wash Pumps",
    kW: pumpKWEach * pumpCount * dutyCycle,
    dutyCycle,
    quantity: pumpCount,
    kWPerUnit: pumpKWEach,
  });

  // ── ZONE B: Brush Motors — BRANCHING (electric gearmotor vs hydraulic pack) ──
  const brushDriveType = String(answers.brushDriveType || "electric");
  if (brushDriveType === "electric") {
    const brushHP = answers.brushElectricHP != null ? Number(answers.brushElectricHP) : 1.5;
    const brushCount = answers.brushElectricCount != null ? Number(answers.brushElectricCount) : 10;
    const brushKWEach = brushHP * HP_TO_KW;
    processLoads.push({
      category: "process",
      label: "Brush Motors (Electric Gearmotors)",
      kW: brushKWEach * brushCount * dutyCycle,
      dutyCycle,
      quantity: brushCount,
      kWPerUnit: brushKWEach,
    });
  } else {
    // Hydraulic power pack drives all brushes via hydraulic lines
    const packHP = answers.brushHydraulicPackHP != null ? Number(answers.brushHydraulicPackHP) : 10;
    const packCount =
      answers.brushHydraulicPackCount != null ? Number(answers.brushHydraulicPackCount) : 1;
    const packKWEach = packHP * HP_TO_KW;
    processLoads.push({
      category: "process",
      label: "Brush Motors (Hydraulic Power Pack)",
      kW: packKWEach * packCount * dutyCycle,
      dutyCycle,
      quantity: packCount,
      kWPerUnit: packKWEach,
    });
  }

  // ── ZONE B: Water Reclamation System ──
  const reclaimSys = String(answers.reclaimSystem || "none");
  if (reclaimSys !== "none") {
    const reclaimKW = reclaimSys === "full_vfd" ? 11 : 7; // Full+VFD = 11 kW, partial = 7 kW
    processLoads.push({
      category: "process",
      label: "Water Reclamation System",
      kW: reclaimKW,
      dutyCycle: 0.8,
    });
  }

  // ── ZONE B: RO System ──
  if (toBool(answers.roSystem) && reclaimSys !== "none") {
    processLoads.push({
      category: "process",
      label: "RO System (Spot-Free Rinse)",
      kW: 4, // NCS PurClean E3: ~3.7 kW
      dutyCycle: 0.8,
    });
  }

  // ── ZONE D: Vacuum System — BRANCHING (central vs individual stalls) ──
  const vacStalls = answers.vacuumStalls != null ? Number(answers.vacuumStalls) : 10;
  if (vacStalls > 0) {
    const vacType = String(answers.vacuumType || "central");
    if (vacType === "central") {
      const centralHP = answers.vacuumCentralHP != null ? Number(answers.vacuumCentralHP) : 25;
      const centralCount =
        answers.vacuumCentralMotorCount != null ? Number(answers.vacuumCentralMotorCount) : 1;
      const vacKWEach = centralHP * HP_TO_KW;
      processLoads.push({
        category: "process",
        label: "Vacuum System (Central)",
        kW: vacKWEach * centralCount,
        dutyCycle: 0.4,
        quantity: centralCount,
        kWPerUnit: vacKWEach,
      });
    } else {
      // Individual stalls: 3 motors × 1.6 HP per stall (JE Adams standard)
      const indivKWPerStall = 3 * 1.6 * HP_TO_KW;
      processLoads.push({
        category: "process",
        label: "Vacuum System (Individual Stalls)",
        kW: indivKWPerStall * vacStalls,
        dutyCycle: 0.4,
        quantity: vacStalls,
        kWPerUnit: indivKWPerStall,
      });
    }
  }

  // ── ZONE D: Air Compressor ──
  // airCompressorSize = type_then_quantity { type: HP, quantity: count }
  const compRaw = answers.airCompressorSize;
  const compHP = Number(ttnType(compRaw, "10"));
  const compCount = Number(ttnQty(compRaw, "1")) || 1;
  const compKWEach = compHP * HP_TO_KW;
  processLoads.push({
    category: "process",
    label: "Air Compressor",
    kW: compKWEach * compCount,
    dutyCycle: 0.5,
    quantity: compCount,
    kWPerUnit: compKWEach,
  });

  // ── ZONE D: EV Charging ──
  // evChargingExisting = type_then_quantity { type: "none"|"l2"|"dcfc", quantity: count }
  const evRaw = answers.evChargingExisting;
  const evType = ttnType(evRaw, "none");
  if (evType !== "none") {
    const evCount = Number(ttnQty(evRaw, "0")) || 0;
    if (evCount > 0) {
      const kWPerCharger = evType === "dcfc" ? 50 : 7.2;
      processLoads.push({
        category: "charging",
        label: `EV Chargers (${evType.toUpperCase()}, ${evCount} ports)`,
        kW: evCount * kWPerCharger,
        dutyCycle: 0.3,
        quantity: evCount,
        kWPerUnit: kWPerCharger,
      });
    }
  }

  // ── ZONE E: Building HVAC — Gas furnace = 0 kW electric; heat pump = 15 kW ──
  const HVAC_LOAD: Record<string, number> = {
    none: 0,
    gas_furnace: 0, // gas doesn't hit electric meter
    electric_heat_pump: 15, // 10–20 kW electric (use 15 kW conservative mid)
  };
  const hvacKW = HVAC_LOAD[String(answers.hvacBuilding ?? "none")] ?? 0;
  if (hvacKW > 0) {
    processLoads.push({
      category: "process",
      label: "Building HVAC (Electric Heat Pump)",
      kW: hvacKW,
      dutyCycle: 0.7,
    });
  }

  // ── ZONE E: Water Heater ──
  const WATER_HEATER_LOAD: Record<string, number> = {
    gas: 0,
    natural_gas: 0,
    electric: 40, // 30–50 kW; use 40 kW mid
    tankless_electric: 35, // 25–40 kW; use 35 kW mid
    heat_pump: 15, // 10–15 kW; use 15 kW conservative
    // legacy aliases
    "heat-pump": 15,
  };
  const waterHeaterKW = WATER_HEATER_LOAD[String(answers.waterHeaterType ?? "gas")] ?? 0;
  if (waterHeaterKW > 0) {
    processLoads.push({
      category: "process",
      label: `Water Heater (${answers.waterHeaterType})`,
      kW: waterHeaterKW,
      dutyCycle: 0.6,
    });
  }

  // ── ZONE E: Tunnel Lighting (always-on) ──
  const LIGHTING_LOAD: Record<string, number> = {
    led: 5,
    mixed: 8,
    fluorescent: 12,
    // legacy aliases
    basic: 5,
    enhanced: 8,
    premium: 15,
  };
  const lightingKW =
    LIGHTING_LOAD[String(answers.lightingType ?? answers.tunnelLighting ?? "led")] ?? 8;
  processLoads.push({
    category: "lighting",
    label: "Tunnel Lighting",
    kW: lightingKW,
    dutyCycle: 1.0,
  });

  // ── ZONE E: Exterior Signage ──
  // exteriorSignage = type_then_quantity { type: "standard"|"large_led", quantity: count }
  const signRaw = answers.exteriorSignage;
  const signType = ttnType(signRaw, "standard");
  const signCount = Number(ttnQty(signRaw, "1")) || 1;
  const SIGN_KW: Record<string, number> = {
    standard: 5,
    large_led: 10,
    // legacy
    basic: 5,
    premium: 10,
    signature: 20,
  };
  const signKWEach = SIGN_KW[signType] ?? 5;
  processLoads.push({
    category: "lighting",
    label: "Exterior Signage",
    kW: signKWEach * signCount,
    dutyCycle: 0.8,
    quantity: signCount,
    kWPerUnit: signKWEach,
  });

  // ── ZONE E: Controls / Kiosks ──
  // kioskControls = type_then_quantity { type: "yes"|"no", quantity: count }
  const kioskRaw = answers.kioskControls;
  const kioskHasKiosks = ttnType(kioskRaw, "yes") !== "no";
  const kioskCount = kioskHasKiosks ? Number(ttnQty(kioskRaw, "2")) || 2 : 0;
  processLoads.push({
    category: "controls",
    label: "Controls / POS / Kiosks",
    kW: 1.5 + kioskCount * 0.8, // base PLC + per-kiosk
    dutyCycle: 1.0,
  });

  // ── Baked-in: Chemical Dosing Pumps (2–5 kW continuous, not worth a question) ──
  processLoads.push({
    category: "process",
    label: "Chemical Dosing System",
    kW: 3,
    dutyCycle: 0.95,
  });

  // ── Billing / Utility overrides ──
  // When the user provides real bill data, it overrides the equipment estimate.
  // Precedence: peakDemandKw (from bill) > dutyCycle-weighted equipment calc.
  const demandChargeApplies = String(answers.demandChargeApplies ?? "unsure");
  const peakDemandKwRaw = answers.peakDemandKw != null ? Number(answers.peakDemandKw) : 0;
  const peakDemandOverride = peakDemandKwRaw > 0 ? peakDemandKwRaw : undefined;

  const demandChargeRateRaw = answers.demandChargeRate;
  const demandChargeRate =
    demandChargeRateRaw != null && String(demandChargeRateRaw) !== "unsure"
      ? Number(demandChargeRateRaw)
      : undefined; // undefined = caller uses national default ($15/kW-mo)

  const monthlyKwhRaw = answers.monthlyKwh != null ? Number(answers.monthlyKwh) : 0;
  const monthlyEnergyKWh = monthlyKwhRaw > 0 ? monthlyKwhRaw : undefined;

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
      class: "none",
      heatingType: "none",
      coolingType: "none",
    },
    processLoads,
    architecture: {
      gridConnection,
      criticality: "none",
    },
    peakDemandOverrideKW: peakDemandOverride,
    monthlyEnergyKWh: monthlyEnergyKWh,
    _rawExtensions: {
      dailyVehicles: answers.dailyVehicles != null ? Number(answers.dailyVehicles) : 300,
      peakCarsPerHour: peakCPH,
      dutyCycle,
      carWashType: washType,
      demandChargeApplies,
      ...(demandChargeRate !== undefined ? { demandChargeRate } : {}),
      ...(monthlyEnergyKWh !== undefined ? { monthlyKwh: monthlyEnergyKWh } : {}),
    },
  };
}

function getDefaultInputs(): NormalizedLoadInputs {
  return mapAnswers(
    {
      facilityType: "express_tunnel",
      tunnelOrBayCount: 1,
      operatingHours: 12,
      daysPerWeek: 7,
      dailyVehicles: 300,
      peakCarsPerHour: 40,
      blowerMotorSize: { type: "10", quantity: "10" },
      conveyorMotorSize: { type: "20", quantity: "chain" },
      highPressurePumps: { type: "10", quantity: "3" },
      brushDriveType: "electric",
      brushElectricHP: "1.5",
      brushElectricCount: "10",
      reclaimSystem: "partial",
      roSystem: "yes",
      vacuumStalls: 10,
      vacuumType: "central",
      vacuumCentralHP: "25",
      vacuumCentralMotorCount: "1",
      airCompressorSize: { type: "10", quantity: "1" },
      evChargingExisting: { type: "none", quantity: "0" },
      lightingType: "led",
      exteriorSignage: { type: "standard", quantity: "1" },
      hvacBuilding: "none",
      waterHeaterType: "gas",
      gridConnection: "on-grid",
    },
    "car-wash"
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/** Extract .type from a type_then_quantity answer object, or coerce to string */
function ttnType(raw: unknown, fallback: string): string {
  if (typeof raw === "object" && raw !== null) {
    return String((raw as Record<string, unknown>).type ?? fallback);
  }
  return String(raw ?? fallback);
}

/** Extract .quantity from a type_then_quantity answer object */
function ttnQty(raw: unknown, fallback: string): string {
  if (typeof raw === "object" && raw !== null) {
    return String((raw as Record<string, unknown>).quantity ?? fallback);
  }
  return fallback;
}

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
