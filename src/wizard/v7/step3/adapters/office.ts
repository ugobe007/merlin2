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

/** All question IDs this adapter reads from office curated schema */
const CONSUMED_KEYS = [
  "buildingClass",      // Curated Q1: class-a / class-b / class-c / coworking
  "squareFootage",      // Curated Q2: slider 5,000–500,000 sqft
  "floors",             // Curated Q3: 1-5 / 6-15 / 16-30 / 30+
  "operatingHours",     // Curated Q6: business / extended / 24-7
  "hvacSystem",         // Curated Q7: central-chilled / rooftop / split / none
  "gridConnection",     // Curated Q10: on-grid / limited / off-grid
  "demandCharges",      // Curated Q13: high / moderate / low / unknown
  "existingSolar",      // Curated Q14: existing / planned / none
  "primaryGoal",        // Curated Q15: peak-shaving / backup / sustainability / cost
] as const;

// ============================================================================
// ADAPTER IMPLEMENTATION
// ============================================================================

function mapAnswers(
  answers: Record<string, unknown>,
  _schemaKey: string
): NormalizedLoadInputs {
  // ── Scale ──
  // Parse squareFootage from curated slider (actual number), fall back to category
  const rawSqft = answers.squareFootage ?? answers.facilitySize;
  const sqft = (rawSqft != null && !isNaN(Number(rawSqft)) && Number(rawSqft) > 0)
    ? Number(rawSqft)
    : parseSqftFromSizeCategory(rawSqft) ?? 50000;

  // ── Schedule ──
  const hoursRaw = String(answers.operatingHours || "business");
  const schedule = hoursRaw === "24-7"
    ? { hoursPerDay: 24, daysPerWeek: 7, profileType: "flat" as const }
    : hoursRaw === "extended"
      ? { hoursPerDay: 16, daysPerWeek: 6, profileType: "commercial" as const }
      : { ...SCHEDULE_PRESETS["office"] };

  // ── HVAC ──
  // Use curated hvacSystem answer to influence cooling type
  const hvacRaw = String(answers.hvacSystem || "central-chilled");
  const coolingType = hvacRaw === "rooftop" ? "central-ac" as const
    : hvacRaw === "split" ? "split" as const
    : "central-ac" as const;
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

  // Derive critical load % from demandCharges answer (high → more critical)
  const demandRaw = String(answers.demandCharges || "moderate");
  const criticalLoadPct = demandRaw === "high" ? 0.75
    : demandRaw === "low" ? 0.25
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
    peakDemandOverrideKW: undefined,
    monthlyEnergyKWh: undefined,
    _rawExtensions: {
      squareFootage: sqft,
      officeType: "corporate",
    },
  };
}

function getDefaultInputs(): NormalizedLoadInputs {
  return mapAnswers({
    buildingClass: "class-b",
    squareFootage: 50000,
    floors: "mid-rise",
    operatingHours: "business",
    hvacSystem: "central-chilled",
    gridConnection: "on-grid",
    demandCharges: "moderate",
    existingSolar: "none",
    primaryGoal: "peak-shaving",
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
