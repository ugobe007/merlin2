/**
 * OFFICE INDUSTRY ADAPTER
 * ========================
 *
 * Created: February 8, 2026
 * Move 3 adapter: office has own template + calculator
 *
 * Maps office questionnaire answers → NormalizedLoadInputs.
 *
 * LOAD MODEL (CBECS 2018 commercial office):
 *   HVAC: 40% (dominant — tenant comfort drives load)
 *   Lighting: 25% (reduced to ~15% with LED — DOE SSL program)
 *   Process (plug loads): 20% (computers, printers, misc)
 *   Controls: 5% (BMS, security, fire)
 *   Other: 10% (elevators, common area, vending)
 *   ADDITIVE: server room (IT + 50% cooling overhead), EV chargers, elevators
 *
 * PRIMARY SCALE: square footage → 6 W/sqft (ASHRAE 90.1)
 *
 * CALCULATOR: office_load_v1 (reads: squareFootage, officeType, hasServerRoom,
 *             serverRoomKW, elevatorCount, evChargersCount, hvacAgeYears)
 *
 * SSOT ALIASES (ssotInputAliases.ts):
 *   squareFootage → officeSqFt
 */

import type { IndustryAdapter, NormalizedLoadInputs, ProcessLoad } from "../loadProfile";
import { SCHEDULE_PRESETS } from "../loadProfile";
import { registerAdapter } from "../step3Compute";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Office type → W/sqft multiplier + HVAC class */
const OFFICE_TYPE_PROFILES: Record<string, { multiplier: number; hvac: "low" | "medium" | "high" }> = {
  "corporate":   { multiplier: 1.0,  hvac: "medium" },
  "tech":        { multiplier: 1.3,  hvac: "medium" },  // Higher plug loads
  "medical":     { multiplier: 1.2,  hvac: "high" },    // Diagnostic equipment
  "government":  { multiplier: 0.9,  hvac: "medium" },
  "coworking":   { multiplier: 1.1,  hvac: "medium" },
  "call-center": { multiplier: 1.15, hvac: "medium" },  // Dense IT + people
  "law-firm":    { multiplier: 0.85, hvac: "low" },     // Paper-heavy, lower plug
};

/** All question IDs this adapter reads from office schema */
const CONSUMED_KEYS = [
  "facilitySize",       // Fallback schema: small/medium/large/enterprise
  "operatingHours",     // Fallback schema: business/extended/24-7
  "gridConnection",     // Fallback schema: on-grid/limited/off-grid
  "criticalLoadPct",    // Fallback schema: 25/50/75/100
  "peakDemandKW",       // Fallback schema: optional number
  "monthlyKWH",         // Fallback schema: optional number
  "existingSolar",      // Fallback schema: none/partial/full
  "primaryGoal",        // Fallback schema: peak-shaving/backup/etc
] as const;

// ============================================================================
// ADAPTER IMPLEMENTATION
// ============================================================================

function mapAnswers(
  answers: Record<string, unknown>,
  _schemaKey: string
): NormalizedLoadInputs {
  // ── Scale ──
  // Parse facilitySize from fallback schema (small/medium/large/enterprise)
  const sqft = parseSqftFromSizeCategory(answers.facilitySize) ?? 50000;

  // ── Schedule ──
  const hoursRaw = String(answers.operatingHours || "business");
  const schedule = hoursRaw === "24-7"
    ? { hoursPerDay: 24, daysPerWeek: 7, profileType: "24-7" as const }
    : hoursRaw === "extended"
      ? { hoursPerDay: 16, daysPerWeek: 6, profileType: "extended" as const }
      : { ...SCHEDULE_PRESETS["office"] };

  // ── HVAC ──
  // Office HVAC is always medium minimum (tenant comfort requirement)
  const hvacClass = "medium" as const;

  // ── Process Loads ──
  const processLoads: ProcessLoad[] = [];
  const basePowerKW = sqft * 6 / 1000; // 6 W/sqft base

  // Plug loads (computers, printers, misc)
  processLoads.push({
    category: "process",
    label: "Plug Loads (computers, printers, misc)",
    kW: basePowerKW * 0.20,
    dutyCycle: 0.5,
  });

  // Lighting
  processLoads.push({
    category: "lighting",
    label: "Office & Common Area Lighting",
    kW: basePowerKW * 0.25,
    dutyCycle: 0.6,
  });

  // Controls (BMS, security, fire)
  processLoads.push({
    category: "controls",
    label: "BMS / Security / Fire Systems",
    kW: basePowerKW * 0.05,
    dutyCycle: 1.0,
  });

  // Other (elevators, common area, vending)
  processLoads.push({
    category: "other",
    label: "Elevators / Common Area / Vending",
    kW: basePowerKW * 0.10,
    dutyCycle: 0.3,
  });

  // ── Architecture ──
  const gridRaw = String(answers.gridConnection || "on-grid");
  const gridConnection = gridRaw === "off-grid"
    ? "off-grid" as const
    : gridRaw === "limited" ? "limited" as const : "on-grid" as const;

  const criticalLoadPct = answers.criticalLoadPct != null
    ? Number(answers.criticalLoadPct) / 100  // Convert 25/50/75/100 → 0.25-1.0
    : 0.5;

  const existingSolarKW = parseSolarAnswer(answers.existingSolar);

  return {
    industrySlug: "office",
    schedule,
    scale: {
      kind: "sqft",
      value: sqft,
    },
    hvac: {
      class: hvacClass,
      heatingType: "gas",
      coolingType: "central-ac",
    },
    processLoads,
    architecture: {
      gridConnection,
      criticality: "standard",
      criticalLoadPct,
      existingSolarKW,
    },
    peakDemandOverrideKW: answers.peakDemandKW != null ? Number(answers.peakDemandKW) : undefined,
    monthlyEnergyKWh: answers.monthlyKWH != null ? Number(answers.monthlyKWH) : undefined,
    _rawExtensions: {
      squareFootage: sqft,
      officeType: "corporate",
    },
  };
}

function getDefaultInputs(): NormalizedLoadInputs {
  return mapAnswers({
    facilitySize: "medium",
    operatingHours: "business",
    gridConnection: "on-grid",
    criticalLoadPct: "50",
    existingSolar: "none",
  }, "office");
}

// ============================================================================
// HELPERS
// ============================================================================

/** Parse facilitySize category → approximate sqft */
function parseSqftFromSizeCategory(val: unknown): number | null {
  if (val == null) return null;
  const num = Number(val);
  if (!isNaN(num) && num > 0) return num;

  const category = String(val).toLowerCase();
  switch (category) {
    case "small": return 8000;
    case "medium": return 30000;
    case "large": return 100000;
    case "enterprise": return 250000;
    default: return null;
  }
}

function parseSolarAnswer(val: unknown): number {
  if (val == null || val === "none" || val === "no" || val === false) return 0;
  const num = Number(val);
  if (!isNaN(num) && num > 0) return num;
  if (val === "partial") return 50;
  if (val === "full") return 200;
  return 0;
}

// ============================================================================
// REGISTRATION
// ============================================================================

export const officeAdapter: IndustryAdapter = {
  industrySlug: "office",
  mapAnswers,
  getDefaultInputs,
  consumedAnswerKeys: CONSUMED_KEYS,
};

// Self-register on import
registerAdapter(officeAdapter);
