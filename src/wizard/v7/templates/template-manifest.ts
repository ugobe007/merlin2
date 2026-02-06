/**
 * TEMPLATE MANIFEST
 * =================
 *
 * Created: February 5, 2026
 * Purpose: Machine-readable registry of template → calculator → validation contracts
 *
 * WHY:
 * - Single lookup: "What does industry X need?" answered here
 * - CI harness: automated checks can iterate MANIFEST to verify all templates
 * - Contributor tracing: know exactly which kW contributors to expect per industry
 * - Adapter coverage: verify every question ID maps to a calculator field
 *
 * EXTENSION:
 * - Add entry when adding a new industry template
 * - Update contributorKeysExpected when calculator changes
 * - Update requiredCalcFields when contract requiredInputs changes
 *
 * INVARIANT:
 * - MANIFEST entries MUST match what's in template JSON + registry
 * - Golden trace tests verify this at build time
 */

import type { ContributorKeys } from "../calculators/contract";

/** One entry per industry template */
export type ManifestEntry = {
  /** Industry slug (matches template.industry) */
  industrySlug: string;

  /** Template version string (matches template.version) */
  templateVersion: string;

  /** Calculator ID in registry (matches template.calculator.id) */
  calculatorId: string;

  /** Validation envelope version (always "v1" for now) */
  validationVersion: "v1";

  /** Question IDs that MUST exist in template (superset of required) */
  requiredQuestionIds: string[];

  /** Calculator fields that template mapping MUST produce */
  requiredCalcFields: string[];

  /** kW contributor keys expected in CalcValidation envelope */
  contributorKeysExpected: ContributorKeys[];

  /** Expected duty cycle range [min, max] for sanity checks */
  dutyCycleRange?: [number, number];

  /** Expected peak load kW range for typical inputs [min, max] */
  typicalPeakKWRange: [number, number];

  /** Industry-specific validation details keys */
  detailKeys?: string[];
};

/**
 * THE MANIFEST
 *
 * One entry per industry template. Used by:
 * - Golden trace tests (goldenTraces.test.ts)
 * - CI drift checks (templateDrift.test.ts)
 * - Adapter coverage report
 * - Template authoring guide
 */
export const MANIFEST: ManifestEntry[] = [
  // ──────────────────────────────────────────────────────
  // DATA CENTER
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "data_center",
    templateVersion: "dc.v1.0.0",
    calculatorId: "dc_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [
      "it_load_kw",
      "peak_it_load_kw",
      "avg_utilization_pct",
      "growth_pct_24mo",
      "power_capacity_kw",
      "tier",
      "redundancy",
      "required_runtime_min",
      "generator_present",
      "ups_present",
      "cooling_type",
      "pue",
      "cooling_peak_kw",
      "monthly_kwh",
      "demand_charge",
      "demand_charge_rate",
    ],
    requiredCalcFields: ["itLoadCapacity", "currentPUE", "itUtilization", "dataCenterTier"],
    contributorKeysExpected: ["itLoad", "cooling", "lighting", "controls", "other"],
    dutyCycleRange: [0.85, 1.0],
    typicalPeakKWRange: [500, 10000],
    detailKeys: ["upsLosses", "pdus", "fans"],
  },

  // ──────────────────────────────────────────────────────
  // HOTEL
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "hotel",
    templateVersion: "hotel.v1.0.0",
    calculatorId: "hotel_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [
      "room_count",
      "occupancy_avg_pct",
      "occupancy_peak_pct",
      "laundry_on_site",
      "kitchen_type",
      "restaurant_on_site",
      "bar_on_site",
      "pool_on_site",
      "spa_on_site",
      "conference_sqft",
      "hvac_type",
      "has_electric_hot_water",
      "monthly_kwh",
      "peak_demand_kw",
      "demand_charge",
      "demand_charge_rate",
    ],
    requiredCalcFields: ["roomCount", "hotelClass", "occupancyRate"],
    contributorKeysExpected: ["hvac", "lighting", "process", "other"],
    dutyCycleRange: [0.35, 0.65],
    typicalPeakKWRange: [200, 3000],
    detailKeys: ["rooms", "kitchen", "laundry", "pool"],
  },

  // ──────────────────────────────────────────────────────
  // CAR WASH
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "car_wash",
    templateVersion: "car_wash.v1.0.0",
    calculatorId: "car_wash_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [
      "wash_type",
      "bay_count",
      "tunnel_length_ft",
      "cars_per_day_avg",
      "cars_per_hour_peak",
      "operating_hours_per_day",
      "days_per_week",
      "dryer_present",
      "dryer_kw",
      "water_heating_type",
      "uses_hot_water",
      "reclaim_system",
      "vacuum_count",
      "vacuum_kw_each",
      "monthly_kwh",
      "peak_demand_kw",
      "demand_charge",
      "demand_charge_rate",
    ],
    requiredCalcFields: ["bayTunnelCount", "averageWashesPerDay", "operatingHours"],
    contributorKeysExpected: ["process", "hvac", "lighting", "controls"],
    dutyCycleRange: [0.5, 0.85],
    typicalPeakKWRange: [50, 400],
    detailKeys: ["dryers", "pumps", "vacuums"],
  },

  // ──────────────────────────────────────────────────────
  // EV CHARGING (adapter-only, no template JSON yet)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "ev_charging",
    templateVersion: "adapter-only",
    calculatorId: "ev_charging_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [], // No template JSON — adapter is called directly
    requiredCalcFields: ["level2Chargers", "dcfcChargers"],
    contributorKeysExpected: ["charging", "lighting", "controls", "other"],
    dutyCycleRange: [0.25, 0.45],
    typicalPeakKWRange: [50, 5000],
    detailKeys: ["level2", "dcfc", "siteAux"],
  },

  // ──────────────────────────────────────────────────────
  // HOSPITAL (adapter-only, no template JSON yet)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "hospital",
    templateVersion: "adapter-only",
    calculatorId: "hospital_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [], // No template JSON — adapter is called directly
    requiredCalcFields: ["bedCount"],
    contributorKeysExpected: ["process", "hvac", "lighting", "controls", "itLoad", "other"],
    dutyCycleRange: [0.8, 0.95],
    typicalPeakKWRange: [500, 8000],
    detailKeys: ["medical", "surgical", "laundry"],
  },

  // ──────────────────────────────────────────────────────
  // MANUFACTURING (adapter-only, no template JSON yet)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "manufacturing",
    templateVersion: "adapter-only",
    calculatorId: "manufacturing_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [], // No template JSON — adapter is called directly
    requiredCalcFields: ["squareFootage"],
    contributorKeysExpected: ["process", "hvac", "lighting", "controls", "other"],
    dutyCycleRange: [0.7, 0.9],
    typicalPeakKWRange: [200, 10000],
    detailKeys: ["type", "processIntensity", "sqFt"],
  },
];

// ──────────────────────────────────────────────────────
// Lookup helpers
// ──────────────────────────────────────────────────────

/** Get manifest entry by industry slug */
export function getManifestEntry(slug: string): ManifestEntry | undefined {
  return MANIFEST.find((m) => m.industrySlug === slug);
}

/** Get manifest entry by calculator ID */
export function getManifestByCalculator(calcId: string): ManifestEntry | undefined {
  return MANIFEST.find((m) => m.calculatorId === calcId);
}

/** List all industry slugs that have manifest entries */
export function listManifestSlugs(): string[] {
  return MANIFEST.map((m) => m.industrySlug);
}
