/**
 * RESTAURANT INDUSTRY ADAPTER
 * ============================
 *
 * Created: February 8, 2026
 * Move 3 adapter: restaurant borrows hotel template + schema, own calculator
 *
 * Maps restaurant questionnaire answers → NormalizedLoadInputs.
 *
 * LOAD MODEL (CBECS 2018 food service):
 *   Kitchen equipment dominates: 45% of total load
 *   Refrigeration: 15% (walk-in + reach-in coolers)
 *   HVAC: 20% (makeup air + dining HVAC — higher than typical due to heat)
 *   Lighting: 10% (dining ambience + kitchen task lighting)
 *   Controls: 5% (POS, hood controls, fire suppression)
 *   Other: 5% (dishwashing, hot water)
 *
 * PRIMARY SCALE: seating capacity → 40 W/seat (Energy Star Portfolio Manager)
 *   Fast food: ~20 W/seat
 *   Full-service: ~40 W/seat
 *   Fine dining: ~55 W/seat
 *
 * CALCULATOR: restaurant_load_v1 (reads: seatingCapacity)
 *
 * SSOT ALIASES (ssotInputAliases.ts):
 *   seatingCapacity → seatingCapacity (direct match)
 */

import type { IndustryAdapter, NormalizedLoadInputs, ProcessLoad } from "../loadProfile";
import { registerAdapter } from "../step3Compute";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Restaurant type → watts per seat + HVAC class */
const RESTAURANT_TYPE_PROFILES: Record<string, { wattsPerSeat: number; hvac: "low" | "medium" | "high" }> = {
  "fast-food":     { wattsPerSeat: 20, hvac: "medium" },
  "fast_food":     { wattsPerSeat: 20, hvac: "medium" },
  "quick-service": { wattsPerSeat: 20, hvac: "medium" },
  "casual":        { wattsPerSeat: 35, hvac: "medium" },
  "full-service":  { wattsPerSeat: 40, hvac: "high" },
  "full_service":  { wattsPerSeat: 40, hvac: "high" },
  "fine-dining":   { wattsPerSeat: 55, hvac: "high" },
  "fine_dining":   { wattsPerSeat: 55, hvac: "high" },
  "food-hall":     { wattsPerSeat: 30, hvac: "medium" },
  "food_hall":     { wattsPerSeat: 30, hvac: "medium" },
  "buffet":        { wattsPerSeat: 50, hvac: "high" },
  "cafe":          { wattsPerSeat: 15, hvac: "low" },
};

/** All question IDs this adapter reads */
const CONSUMED_KEYS = [
  // Scale — use hotel schema questions that map to restaurant context
  "hotelCategory",       // → maps to restaurant type (economy=fast-food, luxury=fine-dining)
  "numRooms",            // → maps to seating capacity (rooms → seats)
  "squareFootage",       // → secondary scale (if provided)
  "occupancyRate",       // → meal period utilization
  // Amenities → process loads (hotel schema questions)
  "restaurantOnSite",    // → "yes" (always, it IS a restaurant)
  "poolOnSite",          // → outdoor dining / patio
  "spaOnSite",           // → bar / lounge area
  "laundryOnSite",       // → linens (full-service indicator)
  // Architecture
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
  // Hotel schema's numRooms → restaurant seating capacity
  const seatingCapacity = answers.numRooms != null ? Number(answers.numRooms) : 100;

  // Hotel schema's hotelCategory → restaurant type mapping
  const categoryRaw = String(answers.hotelCategory || "3-star");
  const restaurantType = mapCategoryToRestaurantType(categoryRaw);
  const profile = RESTAURANT_TYPE_PROFILES[restaurantType]
    ?? RESTAURANT_TYPE_PROFILES["full-service"]!;

  // ── Schedule ──
  // Restaurants: typically 14h (7am-9pm) with lunch+dinner peaks
  const schedule = {
    hoursPerDay: 14,
    daysPerWeek: 7,
    profileType: "lunch-dinner-peak" as const,
  };

  // ── HVAC ──
  // Restaurants need aggressive HVAC (kitchen heat, grease extraction, makeup air)
  const hvacClass = profile.hvac;

  // ── Process Loads ──
  const processLoads: ProcessLoad[] = [];
  const basePeakKW = (seatingCapacity * profile.wattsPerSeat) / 1000;

  // Kitchen equipment (45% of total — cooking, fryers, ovens, hoods)
  processLoads.push({
    category: "process",
    label: "Kitchen Equipment (cooking, fryers, hoods)",
    kW: basePeakKW * 0.45 * 1000 / 1000, // Keep in kW
    dutyCycle: 0.6, // Active during meal service
  });

  // Walk-in + reach-in refrigeration (15% — 24/7 load)
  processLoads.push({
    category: "cooling",
    label: "Refrigeration (walk-in + reach-in)",
    kW: basePeakKW * 0.15 * 1000 / 1000,
    dutyCycle: 0.95, // Near-continuous
  });

  // Dishwashing + hot water (5%)
  processLoads.push({
    category: "process",
    label: "Dishwashing & Hot Water",
    kW: basePeakKW * 0.05 * 1000 / 1000,
    dutyCycle: 0.5,
  });

  // Lighting (dining ambience + kitchen task lighting)
  processLoads.push({
    category: "lighting",
    label: "Dining & Kitchen Lighting",
    kW: basePeakKW * 0.10 * 1000 / 1000,
    dutyCycle: 0.7,
  });

  // Controls (POS, hood controls, fire suppression)
  processLoads.push({
    category: "controls",
    label: "POS / Hood Controls / Fire Systems",
    kW: basePeakKW * 0.05 * 1000 / 1000,
    dutyCycle: 1.0,
  });

  // Outdoor / patio (if poolOnSite = "yes" → outdoor dining area)
  const hasOutdoor = toBool(answers.poolOnSite);
  if (hasOutdoor) {
    processLoads.push({
      category: "lighting",
      label: "Outdoor / Patio Lighting & Heaters",
      kW: 10,
      dutyCycle: 0.4,
    });
  }

  // Bar / lounge (if spaOnSite = "yes" → bar area)
  const hasBar = toBool(answers.spaOnSite);
  if (hasBar) {
    processLoads.push({
      category: "process",
      label: "Bar / Lounge (draft systems, ice, display coolers)",
      kW: 8,
      dutyCycle: 0.6,
    });
  }

  // ── Architecture ──
  const gridRaw = String(answers.gridConnection || "on-grid");
  const gridConnection = gridRaw === "off-grid"
    ? "off-grid" as const
    : gridRaw === "limited" ? "limited" as const : "on-grid" as const;

  const existingSolarKW = parseSolarAnswer(answers.existingSolar);
  const existingGeneratorKW = parseGeneratorAnswer(answers.existingGenerator);

  return {
    industrySlug: "restaurant",
    schedule,
    scale: {
      kind: "seats",
      value: seatingCapacity,
      subType: restaurantType,
      secondaryValue: answers.squareFootage != null ? Number(answers.squareFootage) : undefined,
      secondaryKind: answers.squareFootage != null ? "sqft" : undefined,
    },
    hvac: {
      class: hvacClass,
      heatingType: "gas",
      coolingType: "central-ac",
    },
    processLoads,
    architecture: {
      gridConnection,
      criticality: "none",
      existingSolarKW,
      existingGeneratorKW,
    },
    _rawExtensions: {
      seatingCapacity,
      restaurantType,
    },
  };
}

function getDefaultInputs(): NormalizedLoadInputs {
  return mapAnswers({
    hotelCategory: "3-star",  // → full-service
    numRooms: 100,            // → 100 seats
    occupancyRate: "medium",
    restaurantOnSite: "yes",
    poolOnSite: "no",
    spaOnSite: "no",
    laundryOnSite: "yes",
    gridConnection: "on-grid",
    gridReliability: "reliable",
  }, "hotel");
}

// ============================================================================
// HELPERS
// ============================================================================

/** Map hotel category → restaurant type */
function mapCategoryToRestaurantType(category: string): string {
  const map: Record<string, string> = {
    "budget":    "fast-food",
    "economy":   "fast-food",
    "1-star":    "fast-food",
    "2-star":    "quick-service",
    "midscale":  "casual",
    "3-star":    "full-service",
    "standard":  "casual",
    "upscale":   "full-service",
    "4-star":    "full-service",
    "luxury":    "fine-dining",
    "5-star":    "fine-dining",
    "resort":    "fine-dining",
  };
  return map[category.toLowerCase()] ?? "full-service";
}

function toBool(val: unknown): boolean {
  if (val === true || val === "yes" || val === "true" || val === 1) return true;
  if (val === false || val === "no" || val === "false" || val === 0 || val == null) return false;
  const s = String(val).toLowerCase();
  return s === "yes" || s === "true" || s === "1";
}

function parseSolarAnswer(val: unknown): number {
  if (val == null || val === "none" || val === "no" || val === false) return 0;
  const num = Number(val);
  if (!isNaN(num) && num > 0) return num;
  if (val === "partial") return 30;
  if (val === "full") return 100;
  return 0;
}

function parseGeneratorAnswer(val: unknown): number {
  if (val == null || val === "none" || val === "no" || val === false) return 0;
  const num = Number(val);
  if (!isNaN(num) && num > 0) return num;
  if (val === "yes" || val === "backup") return 100;
  return 0;
}

// ============================================================================
// REGISTRATION
// ============================================================================

export const restaurantAdapter: IndustryAdapter = {
  industrySlug: "restaurant",
  mapAnswers,
  getDefaultInputs,
  consumedAnswerKeys: CONSUMED_KEYS,
};

// Self-register on import
registerAdapter(restaurantAdapter);
