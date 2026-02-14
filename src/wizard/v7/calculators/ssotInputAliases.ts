/**
 * SSOT INPUT ALIASES
 * ==================
 *
 * Created: Phase 2A (February 2026)
 * Purpose: Centralized field-name resolver for SSOT delegation
 *
 * PROBLEM:
 *   The SSOT (`calculateUseCasePower`) reads different field names per industry:
 *   - Office expects `officeSqFt` or `sqFt`
 *   - Retail expects `squareFeet` or `retailSqFt`
 *   - Warehouse expects `warehouseSqFt`
 *
 *   But adapters receive generic names like `squareFootage` from templates.
 *   If an adapter passes `{ squareFootage: 75000 }`, the SSOT ignores it and
 *   falls back to its default (e.g., 50000 sqft). The result "looks fine"
 *   but user input was silently discarded. This is the "silent default" bug class.
 *
 * SOLUTION:
 *   Single function per industry that maps adapter fields → SSOT-expected fields.
 *   Adapters call `buildSSOTInput.office({ squareFootage })` instead of
 *   hand-typing `{ sqFt: squareFootage }`.
 *
 * INVARIANT:
 *   Every key returned by a builder MUST be in the first-priority position of
 *   the SSOT switch case for that industry. If the SSOT changes field names,
 *   update HERE — not in 11 adapters.
 *
 * TESTING:
 *   Input sensitivity tests verify that changing a builder's input actually
 *   changes the SSOT output (prevents silent default fallback).
 */

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────

/**
 * Describes one SSOT field alias mapping for documentation / manifest encoding.
 *
 * adapterField: The name the adapter/template uses (e.g., "squareFootage")
 * ssotField: The first-priority field name the SSOT reads (e.g., "officeSqFt")
 * ssotAlternates: Other field names the SSOT also accepts (lower priority)
 * ssotDefault: The fallback value if no field matches
 */
export type SSOTFieldAlias = {
  adapterField: string;
  ssotField: string;
  ssotAlternates: string[];
  ssotDefault: number | string | boolean;
};

/**
 * Alias map for an industry — keyed by adapter field name.
 * Used by manifest for documentation + CI verification.
 */
export type IndustryAliasMap = Record<string, SSOTFieldAlias>;

// ──────────────────────────────────────────────────────
// Alias Definitions (documented truth table)
// ──────────────────────────────────────────────────────

/**
 * Complete alias registry — the truth table for field name mapping.
 *
 * Source: `calculateUseCasePower()` switch statement in
 * `src/services/useCasePowerCalculations.ts` (lines 5898-6260+)
 */
export const SSOT_ALIASES = {
  office: {
    squareFootage: {
      adapterField: "squareFootage",
      ssotField: "officeSqFt",
      ssotAlternates: ["squareFeet", "buildingSqFt", "sqFt"],
      ssotDefault: 50000,
    },
  } satisfies IndustryAliasMap,

  retail: {
    squareFootage: {
      adapterField: "squareFootage",
      ssotField: "squareFeet",
      ssotAlternates: ["retailSqFt", "sqFt"],
      ssotDefault: 5000,
    },
  } satisfies IndustryAliasMap,

  warehouse: {
    squareFootage: {
      adapterField: "squareFootage",
      ssotField: "warehouseSqFt",
      ssotAlternates: ["squareFeet", "sqFt"],
      ssotDefault: 250000,
    },
    isColdStorage: {
      adapterField: "isColdStorage",
      ssotField: "isColdStorage",
      ssotAlternates: ["warehouseType"],
      ssotDefault: false,
    },
  } satisfies IndustryAliasMap,

  manufacturing: {
    squareFootage: {
      adapterField: "squareFootage",
      ssotField: "facilitySqFt",
      ssotAlternates: ["squareFeet", "sqFt"],
      ssotDefault: 100000,
    },
    manufacturingType: {
      adapterField: "manufacturingType",
      ssotField: "manufacturingType",
      ssotAlternates: ["industryType"],
      ssotDefault: "light",
    },
  } satisfies IndustryAliasMap,

  hotel: {
    roomCount: {
      adapterField: "roomCount",
      ssotField: "roomCount",
      ssotAlternates: ["numberOfRooms", "facilitySize", "rooms"],
      ssotDefault: 150,
    },
  } satisfies IndustryAliasMap,

  hospital: {
    bedCount: {
      adapterField: "bedCount",
      ssotField: "bedCount",
      ssotAlternates: ["beds"],
      ssotDefault: 250,
    },
  } satisfies IndustryAliasMap,

  data_center: {
    itLoadCapacity: {
      adapterField: "itLoadCapacity",
      ssotField: "itLoadKW",
      ssotAlternates: ["rackCount", "averageRackDensity", "rackDensityKW"],
      ssotDefault: 1000,
    },
  } satisfies IndustryAliasMap,

  car_wash: {
    bayTunnelCount: {
      adapterField: "bayTunnelCount",
      ssotField: "bayCount",
      ssotAlternates: ["washBays", "numBays", "numberOfBays"],
      ssotDefault: 4,
    },
  } satisfies IndustryAliasMap,

  ev_charging: {
    level2Chargers: {
      adapterField: "level2Chargers",
      ssotField: "numberOfLevel2Chargers",
      ssotAlternates: ["level2Count", "level2Chargers", "l2Count"],
      ssotDefault: 12,
    },
    dcfcChargers: {
      adapterField: "dcfcChargers",
      ssotField: "numberOfDCFastChargers",
      ssotAlternates: ["dcFastCount", "dcfastCount", "dcFastChargers", "dcfc"],
      ssotDefault: 8,
    },
  } satisfies IndustryAliasMap,

  restaurant: {
    // Restaurant has NO SSOT handler (falls to generic default).
    // Adapter computes directly at 40 W/seat (Energy Star).
    // Alias map is documented for future SSOT integration.
    seatingCapacity: {
      adapterField: "seatingCapacity",
      ssotField: "seatingCapacity",
      ssotAlternates: [],
      ssotDefault: 100,
    },
  } satisfies IndustryAliasMap,

  gas_station: {
    fuelPumps: {
      adapterField: "fuelPumps",
      ssotField: "fuelDispensers",
      ssotAlternates: ["numPumps", "pumpCount", "dispenserCount"],
      ssotDefault: 8,
    },
    hasConvenienceStore: {
      adapterField: "hasConvenienceStore",
      ssotField: "hasConvenienceStore",
      ssotAlternates: [],
      ssotDefault: true,
    },
    convenienceStore: {
      adapterField: "convenienceStore",
      ssotField: "hasConvenienceStore",
      ssotAlternates: [],
      ssotDefault: "yes",
    },
    carWash: {
      adapterField: "carWash",
      ssotField: "hasCarWash",
      ssotAlternates: [],
      ssotDefault: "no",
    },
    stationType: {
      adapterField: "stationType",
      ssotField: "stationType",
      ssotAlternates: [],
      ssotDefault: "with-cstore",
    },
    foodService: {
      adapterField: "foodService",
      ssotField: "foodService",
      ssotAlternates: [],
      ssotDefault: "none",
    },
    evChargers: {
      adapterField: "evChargers",
      ssotField: "evChargerCount",
      ssotAlternates: ["evChargingCount"],
      ssotDefault: 0,
    },
    squareFootage: {
      adapterField: "squareFootage",
      ssotField: "buildingSquareFootage",
      ssotAlternates: ["cStoreSqFt"],
      ssotDefault: 2500,
    },
  } satisfies IndustryAliasMap,

  truck_stop: {
    fuelPumps: {
      adapterField: "fuelPumps",
      ssotField: "fuelDispensers",
      ssotAlternates: ["dieselLanes", "fuelingPositions", "numPumps"],
      ssotDefault: 12,
    },
    cStoreSqFt: {
      adapterField: "cStoreSqFt",
      ssotField: "buildingSquareFootage",
      ssotAlternates: ["convenienceStoreSqFt", "storeSqFt"],
      ssotDefault: 4000,
    },
    squareFootage: {
      adapterField: "squareFootage",
      ssotField: "buildingSquareFootage",
      ssotAlternates: ["cStoreSqFt"],
      ssotDefault: 5000,
    },
    truckParkingSpots: {
      adapterField: "truckParkingSpots",
      ssotField: "truckParkingSpots",
      ssotAlternates: ["parkingSpots", "overnightSpots"],
      ssotDefault: 50,
    },
    stationType: {
      adapterField: "stationType",
      ssotField: "stationType",
      ssotAlternates: [],
      ssotDefault: "truck-stop",
    },
    convenienceStore: {
      adapterField: "convenienceStore",
      ssotField: "hasConvenienceStore",
      ssotAlternates: [],
      ssotDefault: "yes",
    },
    foodService: {
      adapterField: "foodService",
      ssotField: "foodService",
      ssotAlternates: [],
      ssotDefault: "full-restaurant",
    },
    carWash: {
      adapterField: "carWash",
      ssotField: "hasCarWash",
      ssotAlternates: [],
      ssotDefault: "no",
    },
    evChargers: {
      adapterField: "evChargers",
      ssotField: "evChargerCount",
      ssotAlternates: [],
      ssotDefault: 0,
    },
  } satisfies IndustryAliasMap,
} as const;

// Type helper: valid industry slugs in this alias registry
export type AliasIndustry = keyof typeof SSOT_ALIASES;

// ──────────────────────────────────────────────────────
// Builder Functions
// ──────────────────────────────────────────────────────

/**
 * Build SSOT-compatible input object for a given industry.
 *
 * Takes adapter field names → returns SSOT field names.
 * This is the ONLY place field name translation should happen.
 *
 * @example
 * // In office adapter:
 * const ssotData = buildSSOTInput("office", { squareFootage: 75000 });
 * // Returns: { officeSqFt: 75000 }
 *
 * const result = calculateUseCasePower("office", ssotData);
 * // SSOT reads officeSqFt → computes 75000 sqft, NOT default 50000
 */
export function buildSSOTInput(
  industry: AliasIndustry,
  adapterValues: Record<string, unknown>
): Record<string, unknown> {
  const aliasMap = SSOT_ALIASES[industry];
  const ssotInput: Record<string, unknown> = {};

  for (const [adapterField, alias] of Object.entries(aliasMap)) {
    const value = adapterValues[adapterField];
    if (value !== undefined && value !== null) {
      // Map adapter field name → SSOT's first-priority field name
      ssotInput[alias.ssotField] = value;
    }
    // If undefined, don't set — let SSOT use its own default
  }

  // Pass through any extra fields not in the alias map
  // (e.g., hotelAmenities, shiftPattern, stationType)
  for (const [key, value] of Object.entries(adapterValues)) {
    if (!(key in aliasMap) && value !== undefined && value !== null) {
      ssotInput[key] = value;
    }
  }

  return ssotInput;
}

/**
 * Get the SSOT default value for a specific field in an industry.
 *
 * Useful for sensitivity tests: "if I pass this value, I should get
 * a DIFFERENT result than if I pass nothing (which uses the default)."
 */
export function getSSOTDefault(
  industry: AliasIndustry,
  adapterField: string
): number | string | boolean | undefined {
  const aliasMap: IndustryAliasMap = SSOT_ALIASES[industry];
  const alias = aliasMap[adapterField];
  return alias?.ssotDefault;
}

/**
 * Get the alias map for an industry (for manifest encoding / CI checks).
 */
export function getAliasMap(industry: AliasIndustry): IndustryAliasMap {
  return SSOT_ALIASES[industry];
}

/**
 * List all industries that have alias maps.
 */
export function listAliasIndustries(): AliasIndustry[] {
  return Object.keys(SSOT_ALIASES) as AliasIndustry[];
}
