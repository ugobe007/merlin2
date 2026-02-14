/**
 * RESTAURANT INDUSTRY ADAPTER
 * ============================
 *
 * Created: February 8, 2026
 * Move 3 adapter: restaurant has own curated schema + own calculator
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
const RESTAURANT_TYPE_PROFILES: Record<
  string,
  { wattsPerSeat: number; hvac: "low" | "medium" | "high" }
> = {
  "fast-food": { wattsPerSeat: 20, hvac: "medium" },
  fast_food: { wattsPerSeat: 20, hvac: "medium" },
  "quick-service": { wattsPerSeat: 20, hvac: "medium" },
  casual: { wattsPerSeat: 35, hvac: "medium" },
  "full-service": { wattsPerSeat: 40, hvac: "high" },
  full_service: { wattsPerSeat: 40, hvac: "high" },
  "fine-dining": { wattsPerSeat: 55, hvac: "high" },
  fine_dining: { wattsPerSeat: 55, hvac: "high" },
  "food-hall": { wattsPerSeat: 30, hvac: "medium" },
  food_hall: { wattsPerSeat: 30, hvac: "medium" },
  buffet: { wattsPerSeat: 50, hvac: "high" },
  cafe: { wattsPerSeat: 15, hvac: "low" },
};

/** All question IDs this adapter reads — must match restaurant curated schema */
const CONSUMED_KEYS = [
  // Facility
  "restaurantType", // → restaurant type (fast_food, casual, full_service, fine_dining, etc.)
  "seatingCapacity", // → primary scale (number of seats)
  "squareFootage", // → secondary scale
  "kitchenType", // → kitchen complexity
  "operatingHours", // → operating hours per day
  // Equipment
  "cookingEquipment", // → process load indicator
  "refrigeration", // → cooling load indicator
  "exhaustHood", // → kitchen ventilation
  "dishwasher", // → hot water load indicator
  "barArea", // → bar / lounge area
  // Architecture
  "gridConnection",
  "gridReliability",
  "existingGenerator",
  "existingSolar",
  "primaryGoal",
  "budgetTimeline",
] as const;

// ============================================================================
// ADAPTER IMPLEMENTATION
// ============================================================================

function mapAnswers(answers: Record<string, unknown>, _schemaKey: string): NormalizedLoadInputs {
  // ── Scale ──
  // Restaurant schema's seatingCapacity → primary scale
  const seatingCapacity =
    answers.seatingCapacity != null
      ? Number(answers.seatingCapacity)
      : answers.numRooms != null
        ? Number(answers.numRooms)
        : 100;

  // Restaurant schema's restaurantType → restaurant type mapping
  const restaurantTypeRaw = String(
    answers.restaurantType || answers.hotelCategory || "full_service"
  );
  const restaurantType = mapToRestaurantType(restaurantTypeRaw);
  const profile =
    RESTAURANT_TYPE_PROFILES[restaurantType] ?? RESTAURANT_TYPE_PROFILES["full-service"]!;

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
    kW: (basePeakKW * 0.45 * 1000) / 1000, // Keep in kW
    dutyCycle: 0.6, // Active during meal service
  });

  // Walk-in + reach-in refrigeration (15% — 24/7 load)
  processLoads.push({
    category: "cooling",
    label: "Refrigeration (walk-in + reach-in)",
    kW: (basePeakKW * 0.15 * 1000) / 1000,
    dutyCycle: 0.95, // Near-continuous
  });

  // Dishwashing + hot water (5%)
  processLoads.push({
    category: "process",
    label: "Dishwashing & Hot Water",
    kW: (basePeakKW * 0.05 * 1000) / 1000,
    dutyCycle: 0.5,
  });

  // Lighting (dining ambience + kitchen task lighting)
  processLoads.push({
    category: "lighting",
    label: "Dining & Kitchen Lighting",
    kW: (basePeakKW * 0.1 * 1000) / 1000,
    dutyCycle: 0.7,
  });

  // Controls (POS, hood controls, fire suppression)
  processLoads.push({
    category: "controls",
    label: "POS / Hood Controls / Fire Systems",
    kW: (basePeakKW * 0.05 * 1000) / 1000,
    dutyCycle: 1.0,
  });

  // Outdoor / patio — not tracked in restaurant schema, skip unless legacy field present
  const hasOutdoor = toBool(answers.poolOnSite);
  if (hasOutdoor) {
    processLoads.push({
      category: "lighting",
      label: "Outdoor / Patio Lighting & Heaters",
      kW: 10,
      dutyCycle: 0.4,
    });
  }

  // Bar / lounge (restaurant schema: barArea question)
  const hasBar = toBool(answers.barArea) || toBool(answers.spaOnSite);
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
  const gridConnection =
    gridRaw === "off-grid"
      ? ("off-grid" as const)
      : gridRaw === "limited"
        ? ("limited" as const)
        : ("on-grid" as const);

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
  return mapAnswers(
    {
      restaurantType: "full_service",
      seatingCapacity: 100,
      squareFootage: 3000,
      kitchenType: "full",
      operatingHours: 14,
      cookingEquipment: "standard",
      refrigeration: "standard",
      barArea: "no",
      gridConnection: "on-grid",
      gridReliability: "reliable",
    },
    "restaurant"
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/** Map restaurant type or hotel category → restaurant type key */
function mapToRestaurantType(input: string): string {
  const map: Record<string, string> = {
    // Restaurant schema values (direct)
    fast_food: "fast-food",
    "fast-food": "fast-food",
    quick_service: "quick-service",
    "quick-service": "quick-service",
    casual: "casual",
    casual_dining: "casual",
    full_service: "full-service",
    "full-service": "full-service",
    fine_dining: "fine-dining",
    "fine-dining": "fine-dining",
    food_hall: "food-hall",
    "food-hall": "food-hall",
    buffet: "buffet",
    cafe: "cafe",
    // Legacy hotel category mapping
    budget: "fast-food",
    economy: "fast-food",
    "1-star": "fast-food",
    "2-star": "quick-service",
    midscale: "casual",
    "3-star": "full-service",
    standard: "casual",
    upscale: "full-service",
    "4-star": "full-service",
    luxury: "fine-dining",
    "5-star": "fine-dining",
    resort: "fine-dining",
  };
  return map[input.toLowerCase()] ?? "full-service";
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
