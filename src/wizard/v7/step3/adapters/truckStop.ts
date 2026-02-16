/**
 * TRUCK STOP / TRAVEL CENTER ADAPTER
 * ====================================
 *
 * Created: February 8, 2026
 * Updated: February 2026 — now uses dedicated truck_stop_load_v1 calculator
 *
 * BUSINESS CONTEXT: Love's Travel Stops meeting imminent. Love's operates
 * 600+ locations — 10-20 diesel lanes, 5,000-10,000 sqft c-stores,
 * truck parking, showers, laundry, CAT scales, and increasingly EV charging.
 *
 * LOAD MODEL (truck stop differs significantly from gas station):
 *
 *   A gas station: 8 pumps + small c-store → 30-50 kW
 *   A Love's-class truck stop:
 *     • 12-20 diesel lanes (2.5 kW each + DEF dispensing)
 *     • Large c-store (5,000-10,000 sqft → HVAC + refrigeration)
 *     • Truck parking idle-power (shore power / electrification)
 *     • Shower facilities (water heating, exhaust)
 *     • Laundry (commercial washers/dryers)
 *     • Restaurant / Deli (food prep, walk-in coolers)
 *     • Optional car wash (25 kW)
 *     • Optional EV charging (DCFC 150 kW × concurrency)
 *     • CAT scale / weigh station (2 kW)
 *     • 24/7 canopy + lot lighting
 *     → 150-400 kW peak (3-10× a typical gas station)
 *
 * CALCULATOR: truck_stop_load_v1 (dedicated — reads: fuelPumps, cStoreSqFt,
 *   truckParkingSpots, hasShowers, hasLaundry, hasRestaurant, hasCarWash)
 *
 * CATALOG: truck_stop aliases to gas_station (industryCatalog.ts)
 *   This adapter registers as BOTH "truck_stop" and "gas_station".
 */

import type { IndustryAdapter, NormalizedLoadInputs, ProcessLoad } from "../loadProfile";
import { registerAdapter } from "../step3Compute";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Truck stop scale → diesel lanes + c-store sqft */
const TRUCK_STOP_SIZE_PROFILES: Record<string, {
  dieselLanes: number;
  cStoreSqFt: number;
  parkingSpots: number;
  hasShowers: boolean;
  hasLaundry: boolean;
  hasRestaurant: boolean;
}> = {
  "small": {
    dieselLanes: 6,
    cStoreSqFt: 2500,
    parkingSpots: 30,
    hasShowers: false,
    hasLaundry: false,
    hasRestaurant: false,
  },
  "medium": {
    dieselLanes: 12,
    cStoreSqFt: 5000,
    parkingSpots: 80,
    hasShowers: true,
    hasLaundry: true,
    hasRestaurant: true,
  },
  "large": {
    dieselLanes: 18,
    cStoreSqFt: 8000,
    parkingSpots: 150,
    hasShowers: true,
    hasLaundry: true,
    hasRestaurant: true,
  },
  "enterprise": {
    dieselLanes: 24,
    cStoreSqFt: 12000,
    parkingSpots: 250,
    hasShowers: true,
    hasLaundry: true,
    hasRestaurant: true,
  },
};

/** All question IDs this adapter reads from gas station curated config */
const CONSUMED_KEYS = [
  "stationType",        // Curated Q1: gas-only / with-cstore / truck-stop / travel-center
  "squareFootage",      // Curated Q2: slider (c-store sqft)
  "fuelPumps",          // Curated Q3: slider (number of fuel pumps/diesel lanes)
  "operatingHours",     // Curated Q4: extended / 24-7
  "convenienceStore",   // Curated Q5: yes / no
  "foodService",        // Curated Q6: none / deli / full-restaurant
  "carWash",            // Curated Q7: yes / no
  "evChargers",         // Curated Q8: number or none
  "signage",            // Curated Q9: standard / led-digital
  "gridConnection",     // Curated Q10: on-grid / limited / off-grid
  "existingSolar",      // Curated Q14: existing / planned / none
  "primaryGoal",        // Curated Q15: peak-shaving / backup etc.
] as const;

// ============================================================================
// ADAPTER IMPLEMENTATION
// ============================================================================

function mapAnswers(
  answers: Record<string, unknown>,
  _schemaKey: string
): NormalizedLoadInputs {
  // ── Scale ──
  // Bridge curated IDs: stationType + fuelPumps + squareFootage + convenienceStore
  // If fuelPumps is provided directly, use it; otherwise fall back to facilitySize category
  const rawPumps = answers.fuelPumps != null ? Number(answers.fuelPumps) : null;
  const rawSqft = answers.squareFootage != null ? Number(answers.squareFootage) : null;
  const stationType = String(answers.stationType || "gas-only").toLowerCase();
  const isTruckStop = stationType.includes("truck") || stationType.includes("travel");

  // Determine size profile: direct curated values take priority over facilitySize category
  let dieselLanes: number;
  let cStoreSqFt: number;
  let parkingSpots: number;
  let hasShowers: boolean;
  let hasLaundry: boolean;
  let hasRestaurant: boolean;

  if (rawPumps != null && rawPumps > 0) {
    // Curated config provides fuelPumps directly
    dieselLanes = rawPumps;
    cStoreSqFt = rawSqft != null && rawSqft > 0 ? rawSqft : (isTruckStop ? 5000 : 2500);
    // Scale parking spots with pump count for truck stops
    parkingSpots = isTruckStop ? Math.round(dieselLanes * 6) : 0;
    // Derive amenities from curated answers or station type
    hasRestaurant = answers.foodService != null
      ? String(answers.foodService) !== "none" && answers.foodService !== false
      : isTruckStop;
    hasShowers = isTruckStop && dieselLanes >= 8;
    hasLaundry = isTruckStop && dieselLanes >= 10;
  } else {
    // Legacy path: facilitySize category
    const sizeCategory = String(answers.facilitySize || "medium").toLowerCase();
    const profile = TRUCK_STOP_SIZE_PROFILES[sizeCategory]
      ?? TRUCK_STOP_SIZE_PROFILES["medium"]!;
    dieselLanes = profile.dieselLanes;
    cStoreSqFt = profile.cStoreSqFt;
    parkingSpots = profile.parkingSpots;
    hasShowers = profile.hasShowers;
    hasLaundry = profile.hasLaundry;
    hasRestaurant = profile.hasRestaurant;
  }

  // Override amenities from curated answers if explicitly provided
  if (answers.convenienceStore != null) {
    const hasCS = answers.convenienceStore === "yes" || answers.convenienceStore === true;
    if (!hasCS) cStoreSqFt = 0;
  }
  if (answers.carWash != null) {
    // Captured in _rawExtensions below
  }
  if (answers.foodService != null) {
    hasRestaurant = String(answers.foodService) !== "none" && answers.foodService !== false;
  }

  // ── Schedule ──
  // Truck stops are 24/7 — override any user selection
  const schedule = {
    hoursPerDay: 24,
    daysPerWeek: 7,
    profileType: "flat" as const,  // 24/7 truck stop
  };

  // ── Process Loads ──
  // Model the loads that gas_station calculator doesn't capture
  const processLoads: ProcessLoad[] = [];

  // Diesel fueling infrastructure (1.5 kW/lane + DEF pumps)
  processLoads.push({
    category: "process",
    label: "Diesel Lanes & DEF Dispensing",
    kW: dieselLanes * 1.5,
    dutyCycle: 0.7, // Trucks fuel around the clock
  });

  // Canopy + lot lighting (LED, but large area)
  processLoads.push({
    category: "lighting",
    label: "Canopy + Truck Lot Lighting",
    kW: dieselLanes * 1.0 + (parkingSpots * 0.05),
    dutyCycle: 0.6, // Dusk to dawn + canopy daytime
  });

  // C-store HVAC (larger than gas station c-store)
  const cstoreHVACkW = cStoreSqFt * 0.003; // ~3 W/sqft HVAC
  processLoads.push({
    category: "hvac",
    label: "Convenience Store HVAC",
    kW: cstoreHVACkW,
    dutyCycle: 0.8,
  });

  // C-store refrigeration (walk-in coolers, beverage, ice)
  const refrigerationKW = cStoreSqFt * 0.0015; // ~1.5 W/sqft refrigeration
  processLoads.push({
    category: "cooling",
    label: "Refrigeration (walk-in, beverage, ice)",
    kW: refrigerationKW,
    dutyCycle: 0.95, // Near-continuous
  });

  // Truck parking shore power / idle reduction
  if (parkingSpots > 0) {
    // ~10% utilization, 2 kW per spot (IdleAire standard)
    processLoads.push({
      category: "process",
      label: "Truck Parking Shore Power (idle reduction)",
      kW: parkingSpots * 2 * 0.10,
      dutyCycle: 0.6, // Overnight bias
    });
  }

  // Showers (water heaters, exhaust fans)
  if (hasShowers) {
    processLoads.push({
      category: "process",
      label: "Shower Facilities (water heating, ventilation)",
      kW: 25, // Commercial water heating + exhaust
      dutyCycle: 0.5,
    });
  }

  // Laundry (commercial washers/dryers)
  if (hasLaundry) {
    processLoads.push({
      category: "process",
      label: "Laundry (commercial washers & dryers)",
      kW: 15,
      dutyCycle: 0.4,
    });
  }

  // Restaurant / deli (cooking, prep, walk-in)
  if (hasRestaurant) {
    processLoads.push({
      category: "process",
      label: "Restaurant / Deli (cooking, prep, walk-in cooler)",
      kW: 30,
      dutyCycle: 0.6,
    });
  }

  // Controls (POS, tank monitors, CAT scale, security, payment)
  processLoads.push({
    category: "controls",
    label: "POS / Tank Monitors / CAT Scale / Security",
    kW: 5,
    dutyCycle: 1.0,
  });

  // ── HVAC ──
  // Truck stops: medium-high HVAC (large open c-store, frequent door openings)
  const hvacClass = isTruckStop && dieselLanes >= 12
    ? "high" as const
    : "medium" as const;

  // ── Architecture ──
  const gridRaw = String(answers.gridConnection || "on-grid");
  const gridConnection = gridRaw === "off-grid"
    ? "off-grid" as const
    : gridRaw === "limited" ? "limited" as const : "on-grid" as const;

  // Derive critical load from station type (fueling + refrigeration + lighting must stay on)
  const criticalLoadPct = isTruckStop ? 0.65 : 0.50;

  const existingSolarKW = parseSolarAnswer(answers.existingSolar);

  const hasCarWash = answers.carWash === "yes" || answers.carWash === true;

  return {
    industrySlug: "truck_stop",
    schedule,
    scale: {
      kind: "pumps",
      value: dieselLanes,
      subType: stationType,
    },
    hvac: {
      class: hvacClass,
      heatingType: "gas",
      coolingType: "split-system",
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
      fuelPumps: dieselLanes,
      hasConvenienceStore: cStoreSqFt > 0,
      hasCarWash,
      stationType,
      truckParkingSpots: parkingSpots,
      cStoreSqFt,
      hasShowers,
      hasLaundry,
      hasRestaurant,
    },
  };
}

function getDefaultInputs(): NormalizedLoadInputs {
  return mapAnswers({
    stationType: "truck-stop",
    fuelPumps: 12,
    squareFootage: 5000,
    operatingHours: "24-7",
    convenienceStore: "yes",
    foodService: "full-restaurant",
    carWash: "no",
    gridConnection: "on-grid",
    existingSolar: "none",
    primaryGoal: "peak-shaving",
  }, "gas-station");
}

// ============================================================================
// HELPERS
// ============================================================================

function parseSolarAnswer(val: unknown): number {
  if (val == null || val === "none" || val === "no" || val === false) return 0;
  const num = Number(val);
  if (!isNaN(num) && num > 0) return num;
  if (val === "partial") return 100; // Truck stops: larger solar potential
  if (val === "full") return 500;
  return 0;
}

// ============================================================================
// REGISTRATION
// ============================================================================

/** Primary registration: truck_stop */
export const truckStopAdapter: IndustryAdapter = {
  industrySlug: "truck_stop",
  mapAnswers,
  getDefaultInputs,
  consumedAnswerKeys: CONSUMED_KEYS,
};

/** Secondary registration: gas_station (truck stop subsumes gas station) */
export const gasStationAdapter: IndustryAdapter = {
  industrySlug: "gas_station",
  mapAnswers: (answers, schemaKey) => {
    // For plain gas stations, default to smaller profile
    const gasAnswers = { ...answers };
    if (!gasAnswers.stationType) {
      gasAnswers.stationType = "with-cstore";
    }
    // Only inject default fuelPumps if NEITHER fuelPumps NOR facilitySize provided
    // (facilitySize triggers legacy path for backward compatibility with tests)
    if (!gasAnswers.fuelPumps && !gasAnswers.facilitySize) {
      gasAnswers.fuelPumps = 8;
    }
    const result = mapAnswers(gasAnswers, schemaKey);
    result.industrySlug = "gas_station";
    return result;
  },
  getDefaultInputs: () => {
    const result = mapAnswers({
      stationType: "with-cstore",
      fuelPumps: 8,
      squareFootage: 2500,
      operatingHours: "24-7",
      convenienceStore: "yes",
      foodService: "none",
      carWash: "no",
      gridConnection: "on-grid",
      existingSolar: "none",
    }, "gas-station");
    result.industrySlug = "gas_station";
    return result;
  },
  consumedAnswerKeys: CONSUMED_KEYS,
};

// Self-register on import
registerAdapter(truckStopAdapter);
registerAdapter(gasStationAdapter);
