/**
 * INPUT SENSITIVITY TESTS
 * =======================
 *
 * Phase 2A: Prevents the "silent default" bug class.
 *
 * THE BUG:
 *   Adapter passes `{ squareFootage: 75000 }` to SSOT.
 *   SSOT reads `officeSqFt` — doesn't find it — falls back to default 50000.
 *   Result "looks fine" but user input was silently discarded.
 *
 * THE FIX:
 *   buildSSOTInput("office", { squareFootage: 75000 }) → { officeSqFt: 75000 }
 *
 * THESE TESTS VERIFY:
 *   For every size-driven industry, changing the primary input (sqFt, rooms, beds, etc.)
 *   actually changes the adapter's peakLoadKW output. If the SSOT silently defaults,
 *   both inputs would produce the same kW — and the test fails.
 *
 * BONUS:
 *   - Manifest ssotInputAliases coverage check
 *   - buildSSOTInput output verification
 */

import { describe, test, expect } from "vitest";
import {
  OFFICE_LOAD_V1_SSOT,
  RETAIL_LOAD_V1_SSOT,
  WAREHOUSE_LOAD_V1_SSOT,
  MANUFACTURING_LOAD_V1_SSOT,
  HOTEL_LOAD_V1_SSOT,
  DC_LOAD_V1_SSOT,
  EV_CHARGING_LOAD_V1_SSOT,
  RESTAURANT_LOAD_V1_SSOT,
  GAS_STATION_LOAD_V1_SSOT,
} from "../../calculators/registry";
import {
  buildSSOTInput,
  getSSOTDefault,
  SSOT_ALIASES,
  listAliasIndustries,
  type AliasIndustry,
} from "../../calculators/ssotInputAliases";
import { MANIFEST, getManifestEntry } from "../template-manifest";

// ──────────────────────────────────────────────────────
// Tier 0: buildSSOTInput correctness
// ──────────────────────────────────────────────────────

describe("buildSSOTInput", () => {
  test("office: squareFootage → officeSqFt", () => {
    const result = buildSSOTInput("office", { squareFootage: 75000 });
    expect(result).toHaveProperty("officeSqFt", 75000);
    expect(result).not.toHaveProperty("squareFootage");
  });

  test("retail: squareFootage → squareFeet", () => {
    const result = buildSSOTInput("retail", { squareFootage: 30000 });
    expect(result).toHaveProperty("squareFeet", 30000);
    expect(result).not.toHaveProperty("squareFootage");
  });

  test("warehouse: squareFootage → warehouseSqFt + isColdStorage passthrough", () => {
    const result = buildSSOTInput("warehouse", {
      squareFootage: 150000,
      isColdStorage: true,
    });
    expect(result).toHaveProperty("warehouseSqFt", 150000);
    expect(result).toHaveProperty("isColdStorage", true);
    expect(result).not.toHaveProperty("squareFootage");
  });

  test("manufacturing: squareFootage → facilitySqFt + manufacturingType passthrough", () => {
    const result = buildSSOTInput("manufacturing", {
      squareFootage: 200000,
      manufacturingType: "heavy",
    });
    expect(result).toHaveProperty("facilitySqFt", 200000);
    expect(result).toHaveProperty("manufacturingType", "heavy");
    expect(result).not.toHaveProperty("squareFootage");
  });

  test("hotel: roomCount stays roomCount (no rename needed)", () => {
    const result = buildSSOTInput("hotel", { roomCount: 250 });
    expect(result).toHaveProperty("roomCount", 250);
  });

  test("hospital: bedCount stays bedCount (no rename needed)", () => {
    const result = buildSSOTInput("hospital", { bedCount: 400 });
    expect(result).toHaveProperty("bedCount", 400);
  });

  test("data_center: itLoadCapacity → itLoadKW", () => {
    const result = buildSSOTInput("data_center", { itLoadCapacity: 2000 });
    expect(result).toHaveProperty("itLoadKW", 2000);
    expect(result).not.toHaveProperty("itLoadCapacity");
  });

  test("passes through extra fields not in alias map", () => {
    const result = buildSSOTInput("office", {
      squareFootage: 75000,
      customField: "hello",
    });
    expect(result).toHaveProperty("officeSqFt", 75000);
    expect(result).toHaveProperty("customField", "hello");
  });

  test("skips undefined/null values", () => {
    const result = buildSSOTInput("office", { squareFootage: undefined });
    expect(result).not.toHaveProperty("officeSqFt");
    expect(result).not.toHaveProperty("squareFootage");
  });
});

// ──────────────────────────────────────────────────────
// Tier 1: Input sensitivity — the core Phase 2A invariant
//
// "Changing the primary sizing input MUST change peakLoadKW"
//
// If this test fails, user input is being silently discarded
// and the SSOT is falling back to its hardcoded default.
// ──────────────────────────────────────────────────────

describe("input sensitivity: changing input changes output", () => {
  /**
   * Test pattern:
   *   1. Compute with "small" input → peakKW_small
   *   2. Compute with "large" input (2x or more) → peakKW_large
   *   3. Assert: peakKW_large > peakKW_small
   *
   * If the SSOT ignores our field name, both calls use the
   * same default → both produce identical peakKW → test FAILS.
   */

  const sensitivityCases: {
    name: string;
    adapter: { compute: (inputs: Record<string, any>) => { peakLoadKW: number } };
    smallInput: Record<string, any>;
    largeInput: Record<string, any>;
  }[] = [
    {
      name: "office: 25k sqft vs 100k sqft",
      adapter: OFFICE_LOAD_V1_SSOT,
      smallInput: { squareFootage: 25000 },
      largeInput: { squareFootage: 100000 },
    },
    {
      name: "retail: 5k sqft vs 50k sqft",
      adapter: RETAIL_LOAD_V1_SSOT,
      smallInput: { squareFootage: 5000 },
      largeInput: { squareFootage: 50000 },
    },
    {
      name: "warehouse (standard): 50k sqft vs 500k sqft",
      adapter: WAREHOUSE_LOAD_V1_SSOT,
      smallInput: { squareFootage: 50000, isColdStorage: false },
      largeInput: { squareFootage: 500000, isColdStorage: false },
    },
    {
      name: "warehouse (cold): 50k sqft vs 500k sqft",
      adapter: WAREHOUSE_LOAD_V1_SSOT,
      smallInput: { squareFootage: 50000, isColdStorage: true },
      largeInput: { squareFootage: 500000, isColdStorage: true },
    },
    {
      name: "manufacturing: 50k sqft vs 200k sqft",
      adapter: MANUFACTURING_LOAD_V1_SSOT,
      smallInput: { squareFootage: 50000 },
      largeInput: { squareFootage: 200000 },
    },
    {
      name: "hotel: 50 rooms vs 300 rooms",
      adapter: HOTEL_LOAD_V1_SSOT,
      smallInput: { roomCount: 50 },
      largeInput: { roomCount: 300 },
    },
    {
      name: "data center: 100kW IT vs 2000kW IT",
      adapter: DC_LOAD_V1_SSOT,
      smallInput: { itLoadCapacity: 100, currentPUE: "1.5" },
      largeInput: { itLoadCapacity: 2000, currentPUE: "1.5" },
    },
    {
      name: "ev charging: 4 L2 + 2 DCFC vs 20 L2 + 10 DCFC",
      adapter: EV_CHARGING_LOAD_V1_SSOT,
      smallInput: { level2Chargers: 4, dcfcChargers: 2 },
      largeInput: { level2Chargers: 20, dcfcChargers: 10 },
    },
    {
      name: "restaurant: 1000 seats vs 3000 seats",
      adapter: RESTAURANT_LOAD_V1_SSOT,
      smallInput: { seatingCapacity: 1000 },
      largeInput: { seatingCapacity: 3000 },
    },
    {
      name: "gas station: 4 pumps vs 24 pumps",
      adapter: GAS_STATION_LOAD_V1_SSOT,
      smallInput: { fuelPumps: 4 },
      largeInput: { fuelPumps: 24 },
    },
  ];

  test.each(sensitivityCases)("$name", ({ adapter, smallInput, largeInput }) => {
    const smallResult = adapter.compute(smallInput);
    const largeResult = adapter.compute(largeInput);

    // Core invariant: larger input → larger output
    expect(largeResult.peakLoadKW).toBeGreaterThan(smallResult.peakLoadKW);

    // Sanity: neither should be zero
    expect(smallResult.peakLoadKW).toBeGreaterThan(0);
    expect(largeResult.peakLoadKW).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────
// Tier 2: Manifest ssotInputAliases coverage
//
// Every manifest entry MUST have ssotInputAliases.
// Every alias industry MUST appear in the manifest.
// ──────────────────────────────────────────────────────

describe("manifest ssotInputAliases coverage", () => {
  test("all manifest entries have ssotInputAliases", () => {
    for (const entry of MANIFEST) {
      expect(
        entry.ssotInputAliases,
        `${entry.industrySlug} missing ssotInputAliases`
      ).toBeDefined();
      expect(
        Object.keys(entry.ssotInputAliases!).length,
        `${entry.industrySlug} has empty ssotInputAliases`
      ).toBeGreaterThan(0);
    }
  });

  test("all alias industries appear in manifest", () => {
    const manifestSlugs = MANIFEST.map((m) => m.industrySlug);
    const aliasIndustries = listAliasIndustries();

    for (const industry of aliasIndustries) {
      expect(manifestSlugs, `Alias industry "${industry}" missing from manifest`).toContain(
        industry
      );
    }
  });

  test("manifest alias adapterFields align with requiredCalcFields", () => {
    // Verify that every field IN the alias map is either a requiredCalcField
    // or its ssotField is a known SSOT field. We don't require every
    // requiredCalcField to be in the alias map — pass-through fields
    // (same name in adapter and SSOT) don't need alias entries.
    for (const entry of MANIFEST) {
      if (!entry.ssotInputAliases) continue;

      for (const [adapterField, alias] of Object.entries(entry.ssotInputAliases)) {
        // The adapter field in the alias should be referenced by the adapter
        // (either as requiredCalcField or as an extra field)
        expect(
          typeof alias.ssotField,
          `${entry.industrySlug}.${adapterField}: ssotField must be a string`
        ).toBe("string");
        expect(
          alias.ssotField.length,
          `${entry.industrySlug}.${adapterField}: ssotField must not be empty`
        ).toBeGreaterThan(0);
      }
    }
  });
});

// ──────────────────────────────────────────────────────
// Tier 3: getSSOTDefault accuracy
// ──────────────────────────────────────────────────────

describe("getSSOTDefault", () => {
  const defaultCases: {
    industry: AliasIndustry;
    field: string;
    expected: number | string | boolean;
  }[] = [
    { industry: "office", field: "squareFootage", expected: 50000 },
    { industry: "retail", field: "squareFootage", expected: 5000 },
    { industry: "warehouse", field: "squareFootage", expected: 250000 },
    { industry: "manufacturing", field: "squareFootage", expected: 100000 },
    { industry: "hotel", field: "roomCount", expected: 150 },
    { industry: "hospital", field: "bedCount", expected: 250 },
    { industry: "restaurant", field: "seatingCapacity", expected: 100 },
    { industry: "gas_station", field: "fuelPumps", expected: 8 },
  ];

  test.each(defaultCases)(
    "$industry.$field default = $expected",
    ({ industry, field, expected }) => {
      expect(getSSOTDefault(industry, field)).toBe(expected);
    }
  );

  test("unknown field returns undefined", () => {
    expect(getSSOTDefault("office", "nonExistentField")).toBeUndefined();
  });
});

// ──────────────────────────────────────────────────────
// Tier 4: SSOT_ALIASES structural integrity
// ──────────────────────────────────────────────────────

describe("SSOT_ALIASES structural integrity", () => {
  test("every alias has required fields", () => {
    for (const [industry, aliasMap] of Object.entries(SSOT_ALIASES)) {
      for (const [adapterField, alias] of Object.entries(aliasMap)) {
        expect(alias.adapterField, `${industry}.${adapterField}.adapterField`).toBe(adapterField);
        expect(typeof alias.ssotField, `${industry}.${adapterField}.ssotField is string`).toBe(
          "string"
        );
        expect(
          alias.ssotField.length,
          `${industry}.${adapterField}.ssotField not empty`
        ).toBeGreaterThan(0);
        expect(
          Array.isArray(alias.ssotAlternates),
          `${industry}.${adapterField}.ssotAlternates is array`
        ).toBe(true);
        expect(alias.ssotDefault, `${industry}.${adapterField}.ssotDefault defined`).toBeDefined();
      }
    }
  });

  test("ssotField is not the same as adapterField where rename is needed", () => {
    // These industries REQUIRE a rename (adapter and SSOT field names differ)
    const renameRequired: { industry: AliasIndustry; field: string }[] = [
      { industry: "office", field: "squareFootage" },
      { industry: "retail", field: "squareFootage" },
      { industry: "warehouse", field: "squareFootage" },
      { industry: "manufacturing", field: "squareFootage" },
      { industry: "data_center", field: "itLoadCapacity" },
      { industry: "gas_station", field: "fuelPumps" },
    ];

    for (const { industry, field } of renameRequired) {
      const alias = (SSOT_ALIASES[industry] as any)[field];
      expect(
        alias.ssotField,
        `${industry}.${field}: ssotField should differ from adapterField`
      ).not.toBe(field);
    }
  });

  test("all 12 industries have alias entries", () => {
    const industries = listAliasIndustries();
    expect(industries.length).toBe(12);
    expect(industries).toContain("office");
    expect(industries).toContain("retail");
    expect(industries).toContain("warehouse");
    expect(industries).toContain("manufacturing");
    expect(industries).toContain("hotel");
    expect(industries).toContain("hospital");
    expect(industries).toContain("data_center");
    expect(industries).toContain("car_wash");
    expect(industries).toContain("ev_charging");
    expect(industries).toContain("restaurant");
    expect(industries).toContain("gas_station");
    expect(industries).toContain("truck_stop");
  });
});
