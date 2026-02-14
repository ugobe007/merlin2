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
import type { SSOTFieldAlias } from "../calculators/ssotInputAliases";
import { SSOT_ALIASES } from "../calculators/ssotInputAliases";

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

  /**
   * SSOT field alias map for this industry.
   *
   * Documents which adapter field names map to which SSOT field names.
   * Used by:
   * - Input sensitivity tests (verify user input actually reaches SSOT)
   * - CI checks (verify adapters use buildSSOTInput, not raw objects)
   * - Documentation (field name truth table)
   *
   * Phase 2A (Feb 2026): Prevents the "silent default" bug class.
   */
  ssotInputAliases?: Record<string, SSOTFieldAlias>;
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
    ssotInputAliases: SSOT_ALIASES.data_center,
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
    ssotInputAliases: SSOT_ALIASES.hotel,
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
    ssotInputAliases: SSOT_ALIASES.car_wash,
  },

  // ──────────────────────────────────────────────────────
  // EV CHARGING (template-backed as of v1.0.0)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "ev_charging",
    templateVersion: "ev_charging.v1.0.0",
    calculatorId: "ev_charging_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [
      "level2_count",
      "dcfc_count",
      "hpc_count",
      "charger_power_level2_kw",
      "site_type",
      "operating_model",
      "operating_hours_per_day",
      "concurrency_pct",
      "site_demand_cap_kw",
      "existing_service_amps",
      "grid_upgrade_planned",
      "behind_meter_solar",
      "monthly_kwh",
      "peak_demand_kw",
      "demand_charge",
      "demand_charge_rate",
    ],
    requiredCalcFields: ["level2Chargers", "dcfcChargers"],
    contributorKeysExpected: ["charging", "lighting", "controls", "other"],
    dutyCycleRange: [0.25, 0.45],
    typicalPeakKWRange: [50, 5000],
    detailKeys: ["level2", "dcfc", "siteAux"],
    ssotInputAliases: SSOT_ALIASES.ev_charging,
  },

  // ──────────────────────────────────────────────────────
  // HOSPITAL (template-backed v1.0.0 — 16 questions)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "hospital",
    templateVersion: "hospital_v1.0.0",
    calculatorId: "hospital_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [
      "hospital_type",
      "operating_hours",
      "bed_count",
      "icu_beds",
      "surgical_suites",
      "has_mri",
      "mri_count",
      "has_ct",
      "ct_count",
      "has_sterilization",
      "has_lab",
      "critical_load_pct",
      "monthly_kwh",
      "peak_demand_kw",
      "demand_charge",
      "demand_charge_rate",
    ],
    requiredCalcFields: ["bedCount"],
    contributorKeysExpected: ["process", "hvac", "lighting", "controls", "itLoad", "other"],
    dutyCycleRange: [0.35, 0.95],
    typicalPeakKWRange: [200, 15000],
    detailKeys: ["medical", "surgical", "laundry"],
    ssotInputAliases: SSOT_ALIASES.hospital,
  },

  // ──────────────────────────────────────────────────────  // RETAIL (adapter-only, no template JSON yet)
  // ──────────────────────────────────────────────────────  // MANUFACTURING (template-backed v1.0.0 — 17 questions)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "manufacturing",
    templateVersion: "manufacturing_v1.0.0",
    calculatorId: "manufacturing_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [
      "manufacturing_type",
      "shift_pattern",
      "square_footage",
      "has_compressed_air",
      "compressor_hp",
      "has_electric_furnace",
      "furnace_kw",
      "has_cnc_machines",
      "cnc_count",
      "has_refrigeration",
      "hvac_type",
      "process_cooling",
      "clean_room",
      "monthly_kwh",
      "peak_demand_kw",
      "demand_charge",
      "demand_charge_rate",
    ],
    requiredCalcFields: ["squareFootage"],
    contributorKeysExpected: ["process", "hvac", "lighting", "controls", "other"],
    dutyCycleRange: [0.5, 0.95],
    typicalPeakKWRange: [100, 25000],
    detailKeys: ["type", "shiftPattern", "processIntensity", "sqFt", "equipmentLoadKW"],
    ssotInputAliases: SSOT_ALIASES.manufacturing,
  },

  // ──────────────────────────────────────────────────────
  // OFFICE (template-backed: office.v1.json)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "office",
    templateVersion: "office.v1.0.0",
    calculatorId: "office_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [
      "office_type",
      "square_footage",
      "floor_count",
      "occupancy_pct",
      "hvac_type",
      "hvac_age_years",
      "lighting_type",
      "has_server_room",
      "server_room_kw",
      "elevator_count",
      "ev_chargers_count",
      "ev_charger_power_kw",
      "has_rooftop_solar",
      "monthly_kwh",
      "peak_demand_kw",
      "demand_charge",
      "demand_charge_rate",
    ],
    requiredCalcFields: ["squareFootage"],
    contributorKeysExpected: [
      "hvac",
      "lighting",
      "process",
      "controls",
      "itLoad",
      "cooling",
      "charging",
      "other",
    ],
    dutyCycleRange: [0.45, 0.6],
    typicalPeakKWRange: [50, 2000],
    detailKeys: [
      "sqFt",
      "wattsPerSqFt",
      "officeType",
      "serverRoomKW",
      "elevatorKW",
      "evKW",
      "additiveKW",
    ],
    ssotInputAliases: SSOT_ALIASES.office,
  },
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "retail",
    templateVersion: "adapter-only",
    calculatorId: "retail_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["squareFootage"],
    contributorKeysExpected: ["hvac", "lighting", "controls", "other"],
    dutyCycleRange: [0.35, 0.55],
    typicalPeakKWRange: [30, 1500],
    ssotInputAliases: SSOT_ALIASES.retail,
  },

  // ──────────────────────────────────────────────────────
  // WAREHOUSE (adapter-only, no template JSON yet)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "warehouse",
    templateVersion: "adapter-only",
    calculatorId: "warehouse_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["squareFootage"],
    contributorKeysExpected: ["hvac", "lighting", "controls", "other"],
    dutyCycleRange: [0.25, 0.45],
    typicalPeakKWRange: [50, 3000],
    ssotInputAliases: SSOT_ALIASES.warehouse,
  },

  // ──────────────────────────────────────────────────────
  // RESTAURANT (adapter-only, no template JSON yet)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "restaurant",
    templateVersion: "adapter-only",
    calculatorId: "restaurant_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["seatingCapacity"],
    contributorKeysExpected: ["hvac", "lighting", "controls", "process", "cooling", "other"],
    dutyCycleRange: [0.35, 0.55],
    typicalPeakKWRange: [15, 1000],
    ssotInputAliases: SSOT_ALIASES.restaurant,
  },

  // ──────────────────────────────────────────────────────
  // TRUCK STOP (adapter-only, no template JSON yet)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "truck_stop",
    templateVersion: "adapter-only",
    calculatorId: "truck_stop_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["fuelPumps"],
    contributorKeysExpected: ["hvac", "lighting", "controls", "process", "other"],
    dutyCycleRange: [0.55, 0.75],
    typicalPeakKWRange: [80, 450],
    ssotInputAliases: SSOT_ALIASES.truck_stop,
  },

  // ──────────────────────────────────────────────────────
  // GAS STATION (adapter-only, no template JSON yet)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "gas_station",
    templateVersion: "adapter-only",
    calculatorId: "gas_station_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["fuelPumps"],
    contributorKeysExpected: ["hvac", "lighting", "controls", "other"],
    dutyCycleRange: [0.4, 0.6],
    typicalPeakKWRange: [30, 500],
    ssotInputAliases: SSOT_ALIASES.gas_station,
  },

  // ══════════════════════════════════════════════════════
  // PHASE 2B: 9 NEWLY-DEDICATED INDUSTRIES (Feb 2026)
  // Previously routed through generic_ssot_v1.
  // Now each has a dedicated adapter with TrueQuote envelope.
  // ══════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────
  // AIRPORT (adapter-only, curated step 3)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "airport",
    templateVersion: "adapter-only",
    calculatorId: "airport_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["annualPassengers"],
    contributorKeysExpected: ["hvac", "lighting", "process", "controls", "other"],
    dutyCycleRange: [0.7, 0.8],
    typicalPeakKWRange: [500, 25000],
    ssotInputAliases: SSOT_ALIASES.airport,
  },

  // ──────────────────────────────────────────────────────
  // CASINO (adapter-only, curated step 3)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "casino",
    templateVersion: "adapter-only",
    calculatorId: "casino_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["gamingFloorSqft"],
    contributorKeysExpected: ["process", "hvac", "lighting", "controls", "other"],
    dutyCycleRange: [0.85, 0.95],
    typicalPeakKWRange: [500, 10000],
    ssotInputAliases: SSOT_ALIASES.casino,
  },

  // ──────────────────────────────────────────────────────
  // APARTMENT (adapter-only, curated step 3)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "apartment",
    templateVersion: "adapter-only",
    calculatorId: "apartment_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["unitCount"],
    contributorKeysExpected: ["hvac", "lighting", "process", "controls", "other"],
    dutyCycleRange: [0.45, 0.6],
    typicalPeakKWRange: [100, 5000],
    ssotInputAliases: SSOT_ALIASES.apartment,
  },

  // ──────────────────────────────────────────────────────
  // COLLEGE (adapter-only, curated step 3)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "college",
    templateVersion: "adapter-only",
    calculatorId: "college_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["enrollment"],
    contributorKeysExpected: ["hvac", "lighting", "process", "itLoad", "controls", "other"],
    dutyCycleRange: [0.4, 0.6],
    typicalPeakKWRange: [500, 15000],
    ssotInputAliases: SSOT_ALIASES.college,
  },

  // ──────────────────────────────────────────────────────
  // COLD STORAGE (adapter-only, curated step 3)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "cold_storage",
    templateVersion: "adapter-only",
    calculatorId: "cold_storage_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["squareFootage"],
    contributorKeysExpected: ["cooling", "hvac", "lighting", "process", "controls", "other"],
    dutyCycleRange: [0.8, 0.9],
    typicalPeakKWRange: [50, 3000],
    ssotInputAliases: SSOT_ALIASES.cold_storage,
  },

  // ──────────────────────────────────────────────────────
  // INDOOR FARM (adapter-only, curated step 3)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "indoor_farm",
    templateVersion: "adapter-only",
    calculatorId: "indoor_farm_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["squareFootage"],
    contributorKeysExpected: ["lighting", "hvac", "process", "controls", "other"],
    dutyCycleRange: [0.6, 0.95],
    typicalPeakKWRange: [100, 10000],
    ssotInputAliases: SSOT_ALIASES.indoor_farm,
  },

  // ──────────────────────────────────────────────────────
  // AGRICULTURE (adapter-only, curated step 3)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "agriculture",
    templateVersion: "adapter-only",
    calculatorId: "agriculture_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["acreage"],
    contributorKeysExpected: ["process", "hvac", "lighting", "controls", "other"],
    dutyCycleRange: [0.3, 0.5],
    typicalPeakKWRange: [50, 2000],
    ssotInputAliases: SSOT_ALIASES.agriculture,
  },

  // ──────────────────────────────────────────────────────
  // RESIDENTIAL (adapter-only, curated step 3)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "residential",
    templateVersion: "adapter-only",
    calculatorId: "residential_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["squareFootage"],
    contributorKeysExpected: ["hvac", "lighting", "process", "controls", "other"],
    dutyCycleRange: [0.25, 0.45],
    typicalPeakKWRange: [5, 50],
    ssotInputAliases: SSOT_ALIASES.residential,
  },

  // ──────────────────────────────────────────────────────
  // GOVERNMENT (adapter-only, curated step 3)
  // ──────────────────────────────────────────────────────
  {
    industrySlug: "government",
    templateVersion: "adapter-only",
    calculatorId: "government_load_v1",
    validationVersion: "v1",
    requiredQuestionIds: [],
    requiredCalcFields: ["squareFootage"],
    contributorKeysExpected: ["hvac", "lighting", "process", "controls", "other"],
    dutyCycleRange: [0.4, 0.75],
    typicalPeakKWRange: [50, 2000],
    ssotInputAliases: SSOT_ALIASES.government,
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
