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

/** All question IDs this adapter reads from fallback schema */
const CONSUMED_KEYS = [
  "facilitySize",       // small/medium/large/enterprise → truck stop scale
  "operatingHours",     // always 24/7 for truck stops
  "gridConnection",     // on-grid/limited/off-grid
  "criticalLoadPct",    // 50-75% typical (fueling + refrigeration + lighting)
  "peakDemandKW",       // Optional override
  "monthlyKWH",         // Optional override
  "existingSolar",      // none/partial/full
  "primaryGoal",        // peak-shaving typical
] as const;

// ============================================================================
// ADAPTER IMPLEMENTATION
// ============================================================================

function mapAnswers(
  answers: Record<string, unknown>,
  _schemaKey: string
): NormalizedLoadInputs {
  // ── Scale ──
  const sizeCategory = String(answers.facilitySize || "medium").toLowerCase();
  const profile = TRUCK_STOP_SIZE_PROFILES[sizeCategory]
    ?? TRUCK_STOP_SIZE_PROFILES["medium"]!;

  // ── Schedule ──
  // Truck stops are 24/7 — override any user selection
  const schedule = {
    hoursPerDay: 24,
    daysPerWeek: 7,
    profileType: "24-7" as const,
  };

  // ── Process Loads ──
  // Model the loads that gas_station calculator doesn't capture
  const processLoads: ProcessLoad[] = [];

  // Diesel fueling infrastructure (1.5 kW/lane + DEF pumps)
  processLoads.push({
    category: "process",
    label: "Diesel Lanes & DEF Dispensing",
    kW: profile.dieselLanes * 1.5,
    dutyCycle: 0.7, // Trucks fuel around the clock
  });

  // Canopy + lot lighting (LED, but large area)
  processLoads.push({
    category: "lighting",
    label: "Canopy + Truck Lot Lighting",
    kW: profile.dieselLanes * 1.0 + (profile.parkingSpots * 0.05),
    dutyCycle: 0.6, // Dusk to dawn + canopy daytime
  });

  // C-store HVAC (larger than gas station c-store)
  const cstoreHVACkW = profile.cStoreSqFt * 0.003; // ~3 W/sqft HVAC
  processLoads.push({
    category: "hvac",
    label: "Convenience Store HVAC",
    kW: cstoreHVACkW,
    dutyCycle: 0.8,
  });

  // C-store refrigeration (walk-in coolers, beverage, ice)
  const refrigerationKW = profile.cStoreSqFt * 0.0015; // ~1.5 W/sqft refrigeration
  processLoads.push({
    category: "cooling",
    label: "Refrigeration (walk-in, beverage, ice)",
    kW: refrigerationKW,
    dutyCycle: 0.95, // Near-continuous
  });

  // Truck parking shore power / idle reduction
  if (profile.parkingSpots > 0) {
    // ~10% utilization, 2 kW per spot (IdleAire standard)
    processLoads.push({
      category: "process",
      label: "Truck Parking Shore Power (idle reduction)",
      kW: profile.parkingSpots * 2 * 0.10,
      dutyCycle: 0.6, // Overnight bias
    });
  }

  // Showers (water heaters, exhaust fans)
  if (profile.hasShowers) {
    processLoads.push({
      category: "process",
      label: "Shower Facilities (water heating, ventilation)",
      kW: 25, // Commercial water heating + exhaust
      dutyCycle: 0.5,
    });
  }

  // Laundry (commercial washers/dryers)
  if (profile.hasLaundry) {
    processLoads.push({
      category: "process",
      label: "Laundry (commercial washers & dryers)",
      kW: 15,
      dutyCycle: 0.4,
    });
  }

  // Restaurant / deli (cooking, prep, walk-in)
  if (profile.hasRestaurant) {
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
  const hvacClass = sizeCategory === "enterprise" || sizeCategory === "large"
    ? "high" as const
    : "medium" as const;

  // ── Architecture ──
  const gridRaw = String(answers.gridConnection || "on-grid");
  const gridConnection = gridRaw === "off-grid"
    ? "off-grid" as const
    : gridRaw === "limited" ? "limited" as const : "on-grid" as const;

  const criticalLoadPct = answers.criticalLoadPct != null
    ? Number(answers.criticalLoadPct) / 100
    : 0.60; // Fueling + refrigeration + lighting must stay on

  const existingSolarKW = parseSolarAnswer(answers.existingSolar);

  return {
    industrySlug: "truck_stop",
    schedule,
    scale: {
      kind: "pumps",
      value: profile.dieselLanes,
      subType: sizeCategory,
    },
    hvac: {
      class: hvacClass,
      heatingType: "gas",
      coolingType: "rooftop-unit",
    },
    processLoads,
    architecture: {
      gridConnection,
      criticality: "standard", // Fueling is essential but not life-safety
      criticalLoadPct,
      existingSolarKW,
    },
    peakDemandOverrideKW: answers.peakDemandKW != null ? Number(answers.peakDemandKW) : undefined,
    monthlyEnergyKWh: answers.monthlyKWH != null ? Number(answers.monthlyKWH) : undefined,
    _rawExtensions: {
      fuelPumps: profile.dieselLanes,
      hasConvenienceStore: true,
      hasCarWash: false, // can be added later
      stationType: "truck-stop",
      truckParkingSpots: profile.parkingSpots,
      cStoreSqFt: profile.cStoreSqFt,
    },
  };
}

function getDefaultInputs(): NormalizedLoadInputs {
  return mapAnswers({
    facilitySize: "medium",
    operatingHours: "24-7",
    gridConnection: "on-grid",
    criticalLoadPct: "60",
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
    // For plain gas stations, default to "small" profile
    const gasAnswers = { ...answers };
    if (!gasAnswers.facilitySize) {
      gasAnswers.facilitySize = "small";
    }
    const result = mapAnswers(gasAnswers, schemaKey);
    result.industrySlug = "gas_station";
    return result;
  },
  getDefaultInputs: () => {
    const result = mapAnswers({
      facilitySize: "small",
      operatingHours: "24-7",
      gridConnection: "on-grid",
      criticalLoadPct: "50",
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
