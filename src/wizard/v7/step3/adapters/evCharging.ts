/**
 * EV CHARGING INDUSTRY ADAPTER
 * ============================
 *
 * Created: February 8, 2026
 * Gold-standard adapter: ev-charging has a curated-complete schema (16+ questions)
 *
 * Maps EV charging questionnaire answers → NormalizedLoadInputs.
 *
 * QUESTION IDs consumed (from evcharging-questions-complete.config.ts):
 *   stationType, operatingHours, siteSize, parkingSpaces,
 *   level2Chargers, level2Power, dcFastChargers, dcFastPower,
 *   hpcChargers, utilizationProfile, gridConnection, peakConcurrency,
 *   siteDemandCap, existingSolar, primaryGoal
 *
 * CALCULATOR: ev_charging_load_v1 (reads: level2Chargers, dcfcChargers,
 *             hpcChargers, level2PowerKW, siteDemandCapKW)
 *
 * SSOT ALIASES (ssotInputAliases.ts):
 *   level2Chargers → numberOfLevel2Chargers
 *   dcfcChargers → numberOfDCFastChargers
 */

import type { IndustryAdapter, NormalizedLoadInputs, ProcessLoad } from "../loadProfile";
import { registerAdapter } from "../step3Compute";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Charger power levels (kW) */
const CHARGER_POWER: Record<string, number> = {
  "7.2": 7.2,
  "7":   7.2,
  "11":  11,
  "19":  19.2,
  "22":  22,
  "50":  50,
  "150": 150,
  "250": 250,
  "350": 350,
};

/** Station type → typical operating schedule */
const STATION_SCHEDULE: Record<string, { hoursPerDay: number; daysPerWeek: number }> = {
  "public-urban":     { hoursPerDay: 24, daysPerWeek: 7 },
  "public-suburban":  { hoursPerDay: 18, daysPerWeek: 7 },
  "public-highway":   { hoursPerDay: 24, daysPerWeek: 7 },
  "fleet-depot":      { hoursPerDay: 16, daysPerWeek: 6 },
  "workplace":        { hoursPerDay: 12, daysPerWeek: 5 },
  "retail-parking":   { hoursPerDay: 14, daysPerWeek: 7 },
  "residential":      { hoursPerDay: 14, daysPerWeek: 7 },
};

/** Utilization → duty cycle mapping */
const UTILIZATION_DUTY: Record<string, number> = {
  "low":    0.15,
  "medium": 0.35,
  "high":   0.55,
  "peak":   0.70,
};

/** All question IDs this adapter reads */
const CONSUMED_KEYS = [
  "stationType",
  "operatingHours",
  "siteSize",
  "parkingSpaces",
  "level2Chargers",
  "level2Power",
  "dcFastChargers",
  "dcFastPower",
  "hpcChargers",
  "utilizationProfile",
  "gridConnection",
  "peakConcurrency",
  "siteDemandCap",
  "existingSolar",
  "primaryGoal",
] as const;

// ============================================================================
// ADAPTER IMPLEMENTATION
// ============================================================================

function mapAnswers(
  answers: Record<string, unknown>,
  _schemaKey: string
): NormalizedLoadInputs {
  // ── Charger counts (null-safe: 0 is valid) ──
  const level2Count = answers.level2Chargers != null ? Number(answers.level2Chargers) : 12;
  const dcfcCount = answers.dcFastChargers != null ? Number(answers.dcFastChargers) : 8;
  const hpcCount = answers.hpcChargers != null ? Number(answers.hpcChargers) : 0;
  const totalChargers = level2Count + dcfcCount + hpcCount;

  // ── Charger power levels ──
  const l2PowerStr = String(answers.level2Power || "7.2");
  const l2PowerKW = CHARGER_POWER[l2PowerStr] ?? (Number(l2PowerStr) || 7.2);

  const dcfcPowerStr = String(answers.dcFastPower || "150");
  const dcfcPowerKW = CHARGER_POWER[dcfcPowerStr] ?? (Number(dcfcPowerStr) || 150);

  const hpcPowerKW = 250; // Standard HPC

  // ── Schedule ──
  const stationType = String(answers.stationType || "public-urban");
  const defaultSchedule = STATION_SCHEDULE[stationType] ?? { hoursPerDay: 24, daysPerWeek: 7 };

  let hoursPerDay = defaultSchedule.hoursPerDay;
  if (answers.operatingHours != null) {
    const ohStr = String(answers.operatingHours);
    if (ohStr === "24-7") hoursPerDay = 24;
    else if (ohStr === "extended") hoursPerDay = 18;
    else if (ohStr === "business") hoursPerDay = 12;
    else {
      const parsed = Number(ohStr);
      if (!isNaN(parsed) && parsed > 0) hoursPerDay = parsed;
    }
  }

  // ── Utilization / concurrency ──
  const utilProfile = String(answers.utilizationProfile || "medium");
  const dutyCycle = UTILIZATION_DUTY[utilProfile] ?? 0.35;

  // Concurrency: what % of chargers are active simultaneously
  const concurrencyStr = String(answers.peakConcurrency || "50");
  const concurrencyPct = Number(concurrencyStr) / 100 || 0.50;

  // ── Process Loads (chargers are the dominant load) ──
  const processLoads: ProcessLoad[] = [];

  // Level 2 array
  if (level2Count > 0) {
    processLoads.push({
      category: "charging",
      label: `Level 2 Chargers (${l2PowerKW}kW each)`,
      kW: level2Count * l2PowerKW * concurrencyPct,
      dutyCycle,
      quantity: level2Count,
      kWPerUnit: l2PowerKW,
    });
  }

  // DCFC array
  if (dcfcCount > 0) {
    processLoads.push({
      category: "charging",
      label: `DC Fast Chargers (${dcfcPowerKW}kW each)`,
      kW: dcfcCount * dcfcPowerKW * concurrencyPct,
      dutyCycle,
      quantity: dcfcCount,
      kWPerUnit: dcfcPowerKW,
    });
  }

  // HPC array
  if (hpcCount > 0) {
    processLoads.push({
      category: "charging",
      label: `High Power Chargers (${hpcPowerKW}kW each)`,
      kW: hpcCount * hpcPowerKW * concurrencyPct * 0.8, // HPC concurrency ~40% → lower than general
      dutyCycle: dutyCycle * 0.8,
      quantity: hpcCount,
      kWPerUnit: hpcPowerKW,
    });
  }

  // Site lighting
  processLoads.push({
    category: "lighting",
    label: "Site & Canopy Lighting",
    kW: Math.max(5, totalChargers * 0.5),
    dutyCycle: 0.5,
  });

  // Controls / EVSE management
  processLoads.push({
    category: "controls",
    label: "EVSE Management / Network",
    kW: Math.max(3, totalChargers * 0.3),
    dutyCycle: 1.0,
  });

  // ── Demand cap ──
  const demandCapKW = answers.siteDemandCap != null ? Number(answers.siteDemandCap) : undefined;

  // ── Architecture ──
  const gridRaw = String(answers.gridConnection || "on-grid");
  const gridConnection = gridRaw === "off-grid"
    ? "off-grid" as const
    : gridRaw === "limited" ? "limited" as const : "on-grid" as const;

  const existingSolarKW = parseSolarAnswer(answers.existingSolar);

  return {
    industrySlug: "ev_charging",
    schedule: {
      hoursPerDay: Math.min(24, Math.max(1, hoursPerDay)),
      daysPerWeek: defaultSchedule.daysPerWeek,
      profileType: "flat", // EV charging is relatively flat (especially 24/7 public)
    },
    scale: {
      kind: "chargers",
      value: totalChargers,
      subType: stationType,
    },
    hvac: {
      class: "none", // Outdoor charging stations
    },
    processLoads,
    architecture: {
      gridConnection,
      criticality: "none",
      existingSolarKW,
    },
    peakDemandOverrideKW: demandCapKW,
    _rawExtensions: {
      level2Chargers: level2Count,
      dcfcChargers: dcfcCount,
      hpcChargers: hpcCount,
      level2PowerKW: l2PowerKW,
      siteDemandCapKW: demandCapKW ?? 0,
      concurrencyPct,
      stationType,
    },
  };
}

function getDefaultInputs(): NormalizedLoadInputs {
  return mapAnswers({
    stationType: "public-urban",
    level2Chargers: 12,
    level2Power: "7.2",
    dcFastChargers: 8,
    dcFastPower: "150",
    hpcChargers: 0,
    utilizationProfile: "medium",
    peakConcurrency: "50",
    gridConnection: "on-grid",
    operatingHours: "24-7",
  }, "ev-charging");
}

// ============================================================================
// HELPERS
// ============================================================================

function parseSolarAnswer(val: unknown): number {
  if (val == null || val === "none" || val === "no" || val === false) return 0;
  const num = Number(val);
  if (!isNaN(num) && num > 0) return num;
  if (val === "partial") return 100;
  if (val === "full") return 500;
  return 0;
}

// ============================================================================
// REGISTRATION
// ============================================================================

export const evChargingAdapter: IndustryAdapter = {
  industrySlug: "ev_charging",
  mapAnswers,
  getDefaultInputs,
  consumedAnswerKeys: CONSUMED_KEYS,
};

// Self-register on import
registerAdapter(evChargingAdapter);
