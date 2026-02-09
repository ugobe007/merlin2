/**
 * HOTEL INDUSTRY ADAPTER
 * ======================
 *
 * Created: February 8, 2026
 * Gold-standard adapter: hotel has a curated-complete schema (16+ questions)
 *
 * Maps hotel questionnaire answers → NormalizedLoadInputs.
 *
 * QUESTION IDs consumed (from hotel-questions-complete.config.ts):
 *   hotelCategory, numRooms, squareFootage, occupancyRate, buildingAge,
 *   poolOnSite, restaurantOnSite, spaOnSite, laundryOnSite, evChargingForGuests,
 *   gridConnection, gridReliability, existingGenerator, existingSolar, primaryGoal
 *
 * CALCULATOR: hotel_load_v1 (reads: roomCount, hotelClass, occupancyRate, amenities)
 *
 * SSOT ALIASES (ssotInputAliases.ts):
 *   roomCount → roomCount (direct match)
 */

import type { IndustryAdapter, NormalizedLoadInputs, ProcessLoad } from "../loadProfile";
import { SCHEDULE_PRESETS, HVAC_PRESETS, ARCHITECTURE_PRESETS } from "../loadProfile";
import { registerAdapter } from "../step3Compute";

// ============================================================================
// ANSWER KEY → NORMALIZED INPUT MAPPING
// ============================================================================

/** Hotel category → SSOT hotelClass mapping */
const CATEGORY_TO_CLASS: Record<string, string> = {
  "budget":    "economy",
  "economy":   "economy",
  "1-star":    "economy",
  "2-star":    "economy",
  "midscale":  "midscale",
  "3-star":    "midscale",
  "standard":  "midscale",
  "upscale":   "upscale",
  "4-star":    "upscale",
  "luxury":    "luxury",
  "5-star":    "luxury",
  "resort":    "luxury",
};

/** Hotel category → HVAC class */
const CATEGORY_TO_HVAC: Record<string, "low" | "medium" | "high"> = {
  economy:  "low",
  midscale: "medium",
  upscale:  "medium",
  luxury:   "high",
};

/** All question IDs this adapter reads */
const CONSUMED_KEYS = [
  "hotelCategory",
  "numRooms",
  "squareFootage",
  "occupancyRate",
  "buildingAge",
  "poolOnSite",
  "restaurantOnSite",
  "spaOnSite",
  "laundryOnSite",
  "evChargingForGuests",
  "gridConnection",
  "gridReliability",
  "existingGenerator",
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
  // ── Scale ──
  const numRooms = answers.numRooms != null ? Number(answers.numRooms) : 150;
  const hotelCategory = String(answers.hotelCategory || "3-star");
  const hotelClass = CATEGORY_TO_CLASS[hotelCategory] ?? "midscale";

  // ── Schedule ──
  // Hotels are 24/7 with evening-peak profile
  const schedule = {
    ...SCHEDULE_PRESETS["24-7"],
    profileType: "evening-peak" as const,
  };

  // ── HVAC ──
  const hvacClass = CATEGORY_TO_HVAC[hotelClass] ?? "medium";
  const systemAge = answers.buildingAge === "pre-2000"
    ? "aging" as const
    : answers.buildingAge === "2000-2015"
      ? "standard" as const
      : "new" as const;

  // ── Process Loads (amenities) ──
  const processLoads: ProcessLoad[] = [];

  // Kitchen (restaurant)
  const hasRestaurant = toBool(answers.restaurantOnSite);
  if (hasRestaurant) {
    processLoads.push({
      category: "process",
      label: "Kitchen / Restaurant",
      kW: numRooms * 0.8,
      dutyCycle: 0.5,
      quantity: 1,
    });
  }

  // Laundry (on-site or outsourced)
  const hasLaundry = toBool(answers.laundryOnSite);
  processLoads.push({
    category: "process",
    label: hasLaundry ? "On-site Laundry" : "Partial Laundry",
    kW: hasLaundry ? numRooms * 0.3 : numRooms * 0.15,
    dutyCycle: 0.4,
  });

  // Pool
  const hasPool = toBool(answers.poolOnSite);
  if (hasPool) {
    processLoads.push({
      category: "process",
      label: "Pool / Pump System",
      kW: 50,
      dutyCycle: 0.6,
    });
  }

  // Spa
  const hasSpa = toBool(answers.spaOnSite);
  if (hasSpa) {
    processLoads.push({
      category: "process",
      label: "Spa / Wellness",
      kW: 40,
      dutyCycle: 0.3,
    });
  }

  // EV charging for guests
  const hasEVCharging = toBool(answers.evChargingForGuests);
  if (hasEVCharging) {
    processLoads.push({
      category: "charging",
      label: "Guest EV Chargers",
      kW: 40,
      dutyCycle: 0.25,
      quantity: 4,
      kWPerUnit: 10,
    });
  }

  // Lighting (always present)
  processLoads.push({
    category: "lighting",
    label: "Guest Rooms + Common Area Lighting",
    kW: numRooms * 0.5,
    dutyCycle: 0.6,
  });

  // Controls / BMS (always present)
  processLoads.push({
    category: "controls",
    label: "BMS / Elevators / Access Control",
    kW: numRooms * 0.1,
    dutyCycle: 1.0,
  });

  // ── Architecture ──
  const gridConnectionRaw = String(answers.gridConnection || "on-grid");
  const gridConnection = gridConnectionRaw === "off-grid"
    ? "off-grid" as const
    : gridConnectionRaw === "limited"
      ? "limited" as const
      : "on-grid" as const;

  const existingSolarKW = parseSolarAnswer(answers.existingSolar);
  const existingGeneratorKW = parseGeneratorAnswer(answers.existingGenerator);

  // Criticality: hotels are "standard" unless grid is unreliable
  const gridReliability = String(answers.gridReliability || "reliable");
  const criticality = gridReliability === "unreliable" || gridReliability === "frequent-outages"
    ? "mission-critical" as const
    : "standard" as const;

  return {
    industrySlug: "hotel",
    schedule,
    scale: {
      kind: "rooms",
      value: numRooms,
      subType: hotelClass,
      secondaryValue: answers.squareFootage != null ? Number(answers.squareFootage) : undefined,
      secondaryKind: answers.squareFootage != null ? "sqft" : undefined,
    },
    hvac: {
      class: hvacClass,
      heatingType: "gas",
      coolingType: "central-ac",
      systemAge,
    },
    processLoads,
    architecture: {
      gridConnection,
      criticality,
      existingSolarKW,
      existingGeneratorKW,
    },
  };
}

function getDefaultInputs(): NormalizedLoadInputs {
  return mapAnswers({
    hotelCategory: "3-star",
    numRooms: 150,
    occupancyRate: "medium",
    poolOnSite: "yes",
    restaurantOnSite: "yes",
    spaOnSite: "no",
    laundryOnSite: "yes",
    evChargingForGuests: "no",
    gridConnection: "on-grid",
    gridReliability: "reliable",
  }, "hotel");
}

// ============================================================================
// HELPERS
// ============================================================================

function toBool(val: unknown): boolean {
  if (val === true || val === "yes" || val === "true" || val === 1) return true;
  if (val === false || val === "no" || val === "false" || val === 0 || val == null) return false;
  // Check for truthy strings
  const s = String(val).toLowerCase();
  return s === "yes" || s === "true" || s === "1";
}

function parseSolarAnswer(val: unknown): number {
  if (val == null || val === "none" || val === "no" || val === false) return 0;
  const num = Number(val);
  if (!isNaN(num) && num > 0) return num;
  // Qualitative: "partial" = ~50kW, "full" = ~200kW (rough estimate)
  if (val === "partial") return 50;
  if (val === "full") return 200;
  return 0;
}

function parseGeneratorAnswer(val: unknown): number {
  if (val == null || val === "none" || val === "no" || val === false) return 0;
  const num = Number(val);
  if (!isNaN(num) && num > 0) return num;
  if (val === "yes" || val === "backup") return 250; // Typical hotel backup
  return 0;
}

// ============================================================================
// REGISTRATION
// ============================================================================

export const hotelAdapter: IndustryAdapter = {
  industrySlug: "hotel",
  mapAnswers,
  getDefaultInputs,
  consumedAnswerKeys: CONSUMED_KEYS,
};

// Self-register on import
registerAdapter(hotelAdapter);
