/**
 * CALCULATOR CONTRACTS REGISTRY
 * ==============================
 *
 * Created: February 2026
 * Purpose: Formalizes the contract between adapters and calculators.
 *
 * EVERY calculator declares:
 *   - requiredFlatKeys: keys it MUST receive (else defaults kick in)
 *   - acceptedSynonyms: alternative key names it recognizes
 *   - expectedRanges: sanity bounds per key (catches bad data early)
 *   - hasFloor: whether the calculator has a hard minimum peak kW
 *   - floorKW: the minimum output (if hasFloor = true)
 *   - typicalPeakRange: expected output range for typical inputs
 *
 * USAGE:
 *   import { getCalculatorContract } from '@/wizard/v7/step3/calculatorContracts';
 *
 *   const contract = getCalculatorContract('hotel_load_v1');
 *   // → { requiredFlatKeys: ['roomCount'], expectedRanges: { roomCount: [10, 2000] }, ... }
 *
 * TEST INTEGRATION:
 *   adapterContracts.test.ts Tier C reads from this registry
 *   to validate that each adapter's flattenForCalculator output
 *   includes all requiredFlatKeys.
 */

// ============================================================================
// Types
// ============================================================================

export type KeyRange = {
  min: number;
  max: number;
  unit?: string;
  description?: string;
};

export type CalculatorContractSpec = {
  /** Calculator ID (matches CALCULATORS_BY_ID key) */
  calculatorId: string;

  /** Display name for debugging/logs */
  displayName: string;

  /**
   * Keys the calculator MUST receive to avoid using defaults.
   * If missing, the calculator falls back to hardcoded defaults —
   * which is the #1 silent-bug class.
   */
  requiredFlatKeys: readonly string[];

  /**
   * Alternative key names the calculator also recognizes.
   * Map: synonym → canonical key
   */
  acceptedSynonyms: Record<string, string>;

  /**
   * Sanity bounds per key. Values outside these ranges trigger warnings.
   */
  expectedRanges: Record<string, KeyRange>;

  /** Does this calculator enforce a minimum peak output? */
  hasFloor: boolean;

  /** Minimum peak kW output (if hasFloor = true) */
  floorKW?: number;

  /** Expected peak kW range for "typical" inputs */
  typicalPeakRange: [number, number];

  /** Source citations for the sizing model */
  sources?: string[];
};

// ============================================================================
// Registry
// ============================================================================

const CONTRACTS: Record<string, CalculatorContractSpec> = {
  hotel_load_v1: {
    calculatorId: "hotel_load_v1",
    displayName: "Hotel / Hospitality",
    requiredFlatKeys: ["roomCount"],
    acceptedSynonyms: {
      numRooms: "roomCount",
      rooms: "roomCount",
      numberOfRooms: "roomCount",
      hotelCategory: "hotelClass",
    },
    expectedRanges: {
      roomCount: { min: 10, max: 2000, unit: "rooms", description: "Hotel room count" },
    },
    hasFloor: false,
    typicalPeakRange: [50, 1500],
    sources: ["ASHRAE 90.1", "Energy Star Portfolio Manager"],
  },

  car_wash_load_v1: {
    calculatorId: "car_wash_load_v1",
    displayName: "Car Wash",
    requiredFlatKeys: ["bayTunnelCount"],
    acceptedSynonyms: {
      bayCount: "bayTunnelCount",
      tunnelOrBayCount: "bayTunnelCount",
      bays: "bayTunnelCount",
      washType: "washType",
      facilityType: "washType",
    },
    expectedRanges: {
      bayTunnelCount: { min: 1, max: 20, unit: "bays", description: "Wash bays or tunnel count" },
    },
    hasFloor: false,
    typicalPeakRange: [30, 500],
    sources: ["ICA (International Carwash Association)", "ASHRAE"],
  },

  ev_charging_load_v1: {
    calculatorId: "ev_charging_load_v1",
    displayName: "EV Charging Station",
    requiredFlatKeys: ["numberOfLevel2Chargers", "numberOfDCFastChargers"],
    acceptedSynonyms: {
      level2Chargers: "numberOfLevel2Chargers",
      l2Chargers: "numberOfLevel2Chargers",
      dcFastChargers: "numberOfDCFastChargers",
      dcfcChargers: "numberOfDCFastChargers",
    },
    expectedRanges: {
      numberOfLevel2Chargers: { min: 0, max: 200, unit: "chargers", description: "Level 2 charger count" },
      numberOfDCFastChargers: { min: 0, max: 50, unit: "chargers", description: "DCFC charger count" },
    },
    hasFloor: false,
    typicalPeakRange: [50, 5000],
    sources: ["SAE J1772", "CHAdeMO/CCS standards"],
  },

  restaurant_load_v1: {
    calculatorId: "restaurant_load_v1",
    displayName: "Restaurant / Food Service",
    requiredFlatKeys: ["seatingCapacity"],
    acceptedSynonyms: {
      seats: "seatingCapacity",
      seatCount: "seatingCapacity",
      numberOfSeats: "seatingCapacity",
      restaurantType: "restaurantType",
      subType: "restaurantType",
    },
    expectedRanges: {
      seatingCapacity: { min: 10, max: 500, unit: "seats", description: "Dining seating capacity" },
    },
    hasFloor: true,
    floorKW: 15, // Minimum kitchen base load for smallest restaurants (≤50 seats)
    typicalPeakRange: [15, 500],
    sources: ["CBECS 2018 food service", "PG&E Commercial Kitchen studies"],
  },

  gas_station_load_v1: {
    calculatorId: "gas_station_load_v1",
    displayName: "Gas Station / Fuel Retail",
    requiredFlatKeys: ["fuelPumps"],
    acceptedSynonyms: {
      dispenserCount: "fuelPumps",
      fuelDispensers: "fuelPumps",
      pumps: "fuelPumps",
    },
    expectedRanges: {
      fuelPumps: { min: 2, max: 24, unit: "pumps", description: "Fuel dispenser count" },
    },
    hasFloor: false,
    typicalPeakRange: [15, 80],
    sources: ["NACS (National Association of Convenience Stores)"],
  },

  truck_stop_load_v1: {
    calculatorId: "truck_stop_load_v1",
    displayName: "Truck Stop / Travel Center",
    requiredFlatKeys: ["fuelPumps"],
    acceptedSynonyms: {
      dieselLanes: "fuelPumps",
      fuelingPositions: "fuelPumps",
      fuelDispensers: "fuelPumps",
      cStoreSquareFootage: "cStoreSqFt",
      buildingSquareFootage: "cStoreSqFt",
      truckParking: "truckParkingSpots",
      parkingSpots: "truckParkingSpots",
    },
    expectedRanges: {
      fuelPumps: { min: 4, max: 30, unit: "diesel lanes", description: "Diesel fueling positions" },
      cStoreSqFt: { min: 1000, max: 15000, unit: "sqft", description: "Convenience store area" },
      truckParkingSpots: { min: 0, max: 500, unit: "spots", description: "Truck parking spaces" },
    },
    hasFloor: false,
    typicalPeakRange: [80, 450],
    sources: ["NACS", "IdleAire shore power specs", "ASHRAE Commercial HVAC"],
  },

  dc_load_v1: {
    calculatorId: "dc_load_v1",
    displayName: "Data Center",
    requiredFlatKeys: ["rackCount"],
    acceptedSynonyms: {
      racks: "rackCount",
      numberOfRacks: "rackCount",
      dataCenterTier: "tierLevel",
    },
    expectedRanges: {
      rackCount: { min: 5, max: 5000, unit: "racks", description: "Server rack count" },
    },
    hasFloor: false,
    typicalPeakRange: [50, 100000],
    sources: ["Uptime Institute", "ASHRAE TC 9.9"],
  },

  office_load_v1: {
    calculatorId: "office_load_v1",
    displayName: "Office Building",
    requiredFlatKeys: ["squareFootage"],
    acceptedSynonyms: {
      officeSqFt: "squareFootage",
      sqft: "squareFootage",
      buildingSqFt: "squareFootage",
    },
    expectedRanges: {
      squareFootage: { min: 1000, max: 1000000, unit: "sqft", description: "Office floor area" },
    },
    hasFloor: false,
    typicalPeakRange: [10, 3000],
    sources: ["ASHRAE 90.1", "CBECS 2018"],
  },

  hospital_load_v1: {
    calculatorId: "hospital_load_v1",
    displayName: "Hospital / Healthcare",
    requiredFlatKeys: ["bedCount"],
    acceptedSynonyms: {
      beds: "bedCount",
      numberOfBeds: "bedCount",
    },
    expectedRanges: {
      bedCount: { min: 10, max: 2000, unit: "beds", description: "Hospital bed count" },
    },
    hasFloor: false,
    typicalPeakRange: [200, 15000],
    sources: ["ASHRAE Healthcare", "NFPA 99"],
  },

  warehouse_load_v1: {
    calculatorId: "warehouse_load_v1",
    displayName: "Warehouse / Logistics",
    requiredFlatKeys: ["squareFootage"],
    acceptedSynonyms: {
      warehouseSqFt: "squareFootage",
      sqft: "squareFootage",
    },
    expectedRanges: {
      squareFootage: { min: 5000, max: 2000000, unit: "sqft", description: "Warehouse floor area" },
    },
    hasFloor: false,
    typicalPeakRange: [20, 2000],
    sources: ["CBECS 2018 warehouse"],
  },

  manufacturing_load_v1: {
    calculatorId: "manufacturing_load_v1",
    displayName: "Manufacturing Facility",
    requiredFlatKeys: ["squareFootage"],
    acceptedSynonyms: {
      facilitySqFt: "squareFootage",
      sqft: "squareFootage",
    },
    expectedRanges: {
      squareFootage: { min: 5000, max: 2000000, unit: "sqft", description: "Manufacturing floor area" },
    },
    hasFloor: false,
    typicalPeakRange: [50, 10000],
    sources: ["CBECS 2018 manufacturing", "IEEE 141 (Red Book)"],
  },

  retail_load_v1: {
    calculatorId: "retail_load_v1",
    displayName: "Retail / Shopping",
    requiredFlatKeys: ["squareFootage"],
    acceptedSynonyms: {
      retailSqFt: "squareFootage",
      sqft: "squareFootage",
    },
    expectedRanges: {
      squareFootage: { min: 1000, max: 500000, unit: "sqft", description: "Retail floor area" },
    },
    hasFloor: false,
    typicalPeakRange: [10, 1500],
    sources: ["CBECS 2018 retail"],
  },

  generic_ssot_v1: {
    calculatorId: "generic_ssot_v1",
    displayName: "Generic (any industry)",
    requiredFlatKeys: [],
    acceptedSynonyms: {},
    expectedRanges: {},
    hasFloor: false,
    typicalPeakRange: [10, 50000],
    sources: ["SSOT generic routing"],
  },
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Get the contract spec for a calculator by ID.
 */
export function getCalculatorContract(calculatorId: string): CalculatorContractSpec | undefined {
  return CONTRACTS[calculatorId];
}

/**
 * List all registered calculator contract IDs.
 */
export function listContractIds(): string[] {
  return Object.keys(CONTRACTS);
}

/**
 * Get all contracts (for test iteration).
 */
export function getAllContracts(): Record<string, CalculatorContractSpec> {
  return { ...CONTRACTS };
}

/**
 * Validate that a set of flat inputs satisfies a calculator's contract.
 *
 * Returns:
 *   - missingKeys: required keys not present in inputs
 *   - outOfRange: keys present but outside expected bounds
 *   - synonymsUsed: keys that were recognized via synonym mapping
 */
export function validateInputsAgainstContract(
  calculatorId: string,
  inputs: Record<string, unknown>
): {
  valid: boolean;
  missingKeys: string[];
  outOfRange: Array<{ key: string; value: number; range: KeyRange }>;
  synonymsUsed: Array<{ synonym: string; canonical: string }>;
} {
  const contract = CONTRACTS[calculatorId];
  if (!contract) {
    return { valid: true, missingKeys: [], outOfRange: [], synonymsUsed: [] };
  }

  const missingKeys: string[] = [];
  const outOfRange: Array<{ key: string; value: number; range: KeyRange }> = [];
  const synonymsUsed: Array<{ synonym: string; canonical: string }> = [];

  // Check required keys
  for (const key of contract.requiredFlatKeys) {
    const value = inputs[key];
    if (value == null || value === "") {
      // Check synonyms
      let foundViaSynonym = false;
      for (const [syn, canonical] of Object.entries(contract.acceptedSynonyms)) {
        if (canonical === key && inputs[syn] != null && inputs[syn] !== "") {
          foundViaSynonym = true;
          synonymsUsed.push({ synonym: syn, canonical: key });
          break;
        }
      }
      if (!foundViaSynonym) {
        missingKeys.push(key);
      }
    }
  }

  // Check ranges
  for (const [key, range] of Object.entries(contract.expectedRanges)) {
    const value = inputs[key] ?? inputs[
      Object.entries(contract.acceptedSynonyms).find(([, c]) => c === key)?.[0] ?? ""
    ];
    if (value != null && value !== "") {
      const num = Number(value);
      if (!isNaN(num) && (num < range.min || num > range.max)) {
        outOfRange.push({ key, value: num, range });
      }
    }
  }

  return {
    valid: missingKeys.length === 0,
    missingKeys,
    outOfRange,
    synonymsUsed,
  };
}
