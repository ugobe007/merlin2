/**
 * SEMANTIC MONOTONICITY TESTS
 * ============================
 *
 * Created: February 8, 2026 — Move 5
 *
 * PURPOSE:
 *   Prove that every calculator's scale driver is actually wired.
 *   If you double the scale input, peakKW should increase by at least
 *   some minimum amount. This catches the "silent default" bug class
 *   where a calculator ignores its scale key and always returns the same value.
 *
 * PROPERTIES TESTED:
 *   1. Monotonicity: more scale → more kW (never decreasing)
 *   2. Sensitivity:  2× scale → at least 20% increase (not noise)
 *   3. NaN safety:   extreme inputs don't produce NaN/Infinity
 *
 * WHY THIS MATTERS:
 *   The restaurant floor bug (Move 4) was caught because 30 seats and
 *   300 seats both returned 30kW. That's a monotonicity violation.
 *   These tests catch it generically for ALL calculators.
 *
 * CALCULATOR × SCALE DRIVER TABLE:
 *   hotel           → roomCount: 50 → 100 → 200 → 500
 *   car_wash        → bayTunnelCount: 2 → 4 → 8 → 16
 *   ev_charging     → dcfcChargers: 2 → 4 → 8 → 16
 *   restaurant      → seatingCapacity: 30 → 60 → 120 → 300
 *   gas_station     → fuelPumps: 4 → 8 → 12 → 20
 *   truck_stop      → fuelPumps: 6 → 12 → 20 → 30
 *   data_center     → itLoadCapacity: 200 → 500 → 1000 → 5000
 *   office          → squareFootage: 10000 → 25000 → 50000 → 200000
 *   hospital        → bedCount: 50 → 100 → 200 → 500
 *   warehouse       → squareFootage: 20000 → 50000 → 100000 → 500000
 *   manufacturing   → squareFootage: 20000 → 50000 → 100000 → 500000
 *   retail          → squareFootage: 5000 → 10000 → 25000 → 100000
 *
 * Run: npx vitest run src/wizard/v7/step3/__tests__/monotonicity.test.ts
 */

import { describe, it, expect } from "vitest";
import { CALCULATORS_BY_ID } from "../../calculators/registry";
import type { CalcRunResult } from "../../calculators/contract";
import { step3Compute } from "../index";
// Force adapter registration (side-effect import)
import "../adapters";

// ============================================================================
// Test infrastructure
// ============================================================================

type ScaleSpec = {
  calculatorId: string;
  displayName: string;
  scaleKey: string;
  /**
   * 4 ascending scale values. Must be strictly increasing.
   * Chosen to represent: small → medium → large → very large
   */
  scaleValues: [number, number, number, number];
  /** Extra static inputs needed for the calculator */
  staticInputs?: Record<string, unknown>;
  /**
   * Minimum % increase expected when scale doubles.
   * Default: 0.20 (20%). Set lower for calculators with significant
   * fixed/base loads that dilute the scale effect.
   */
  minDoublingIncreasePct?: number;
  /**
   * Contributor keys that MUST be present, finite, and > 0 in the
   * validation envelope. This keeps the system honest even when
   * sensitivity thresholds vary — a truck stop must always report
   * HVAC/refrigeration/lighting even though fuel pumps are a minor scale driver.
   */
  dominantContributorsExpected?: string[];
};

/**
 * The per-calculator scale specifications.
 *
 * Each entry defines which key drives the calculator's output
 * and what values to test across.
 */
const SCALE_SPECS: ScaleSpec[] = [
  {
    calculatorId: "hotel_load_v1",
    displayName: "Hotel",
    scaleKey: "roomCount",
    scaleValues: [50, 100, 200, 500],
    // Hotel: HVAC (climate), process (kitchen+laundry+pool), lighting always present
    dominantContributorsExpected: ["hvac", "process", "lighting"],
  },
  {
    calculatorId: "car_wash_load_v1",
    displayName: "Car Wash",
    scaleKey: "bayTunnelCount",
    scaleValues: [2, 4, 8, 16],
    // Car wash: process (dryers+pumps+vacuums) IS the use case, plus HVAC + lighting
    dominantContributorsExpected: ["process", "hvac", "lighting"],
  },
  {
    calculatorId: "ev_charging_load_v1",
    displayName: "EV Charging",
    scaleKey: "dcfcChargers",
    scaleValues: [2, 4, 8, 16],
    staticInputs: { level2Chargers: 4 },
    // EV charging: charging IS the use case (80-95% of load)
    dominantContributorsExpected: ["charging"],
  },
  {
    calculatorId: "restaurant_load_v1",
    displayName: "Restaurant",
    scaleKey: "seatingCapacity",
    scaleValues: [30, 60, 120, 300],
    // Restaurant: process (kitchen) is dominant, plus HVAC + lighting
    dominantContributorsExpected: ["process", "hvac", "lighting"],
  },
  {
    calculatorId: "gas_station_load_v1",
    displayName: "Gas Station",
    scaleKey: "fuelPumps",
    scaleValues: [4, 8, 12, 20],
    staticInputs: { hasConvenienceStore: true },
    // Gas station: process (fuel pumps), HVAC (c-store), lighting (canopy)
    dominantContributorsExpected: ["process", "hvac", "lighting"],
  },
  {
    calculatorId: "truck_stop_load_v1",
    displayName: "Truck Stop",
    scaleKey: "fuelPumps",
    scaleValues: [6, 12, 20, 30],
    staticInputs: { cStoreSqFt: 4000, truckParkingSpots: 50 },
    // Fuel pumps are a minor contributor (~4 kW/pump) in a complex facility
    // with large fixed loads (HVAC, refrigeration, shore power).
    // 2× pumps yields ~15% increase — correct engineering behavior.
    minDoublingIncreasePct: 0.10,
    // Truck stop: HVAC, process (fueling+showers+laundry), cooling (refrigeration),
    // other (shore power) — all must be non-trivial per engineering reality
    dominantContributorsExpected: ["hvac", "process", "cooling", "other"],
  },
  {
    calculatorId: "dc_load_v1",
    displayName: "Data Center",
    // itLoadCapacity is the adapter's primary field; rackCount is secondary
    // and gets floored at 500kW for < ~42 racks (8kW × 1.5 PUE × 42 = 504kW).
    // Using itLoadCapacity ensures we test above any floor.
    scaleKey: "itLoadCapacity",
    scaleValues: [200, 500, 1000, 5000],
    // Data center: itLoad + cooling are the defining contributors
    dominantContributorsExpected: ["itLoad", "cooling"],
  },
  {
    calculatorId: "office_load_v1",
    displayName: "Office",
    scaleKey: "squareFootage",
    scaleValues: [10000, 25000, 50000, 200000],
    // Office: HVAC and lighting dominate per ASHRAE/CBECS
    dominantContributorsExpected: ["hvac", "lighting"],
  },
  {
    calculatorId: "hospital_load_v1",
    displayName: "Hospital",
    scaleKey: "bedCount",
    scaleValues: [50, 100, 200, 500],
    // Hospital: HVAC (sterile air), process (medical equipment), lighting, itLoad (EMR/PACS)
    dominantContributorsExpected: ["hvac", "process", "lighting", "itLoad"],
  },
  {
    calculatorId: "warehouse_load_v1",
    displayName: "Warehouse",
    scaleKey: "squareFootage",
    scaleValues: [20000, 50000, 100000, 500000],
    // Warehouse: HVAC (climate/ventilation) and lighting (high-bay)
    dominantContributorsExpected: ["hvac", "lighting"],
  },
  {
    calculatorId: "manufacturing_load_v1",
    displayName: "Manufacturing",
    scaleKey: "squareFootage",
    scaleValues: [20000, 50000, 100000, 500000],
    // Manufacturing: process (machinery) IS the use case, plus HVAC + lighting
    dominantContributorsExpected: ["process", "hvac", "lighting"],
  },
  {
    calculatorId: "retail_load_v1",
    displayName: "Retail",
    scaleKey: "squareFootage",
    scaleValues: [5000, 10000, 25000, 100000],
    // Retail: HVAC (customer comfort), lighting (merchandising), process (POS/coolers)
    dominantContributorsExpected: ["hvac", "lighting", "process"],
  },
];

/**
 * Compute peakLoadKW for a given calculator + inputs.
 * Returns the result or null if the calculator doesn't exist.
 */
function computePeak(
  calculatorId: string,
  inputs: Record<string, unknown>
): CalcRunResult | null {
  const calc = CALCULATORS_BY_ID[calculatorId];
  if (!calc) return null;
  return calc.compute(inputs);
}

// ============================================================================
// Monotonicity: scale up → peakKW never decreases
// ============================================================================

describe("Semantic Monotonicity — scale up → peakKW non-decreasing", () => {
  for (const spec of SCALE_SPECS) {
    describe(`${spec.displayName} (${spec.calculatorId})`, () => {
      const results: { scale: number; peakKW: number }[] = [];

      // Compute all 4 scale points
      for (const scaleVal of spec.scaleValues) {
        const inputs = {
          ...(spec.staticInputs ?? {}),
          [spec.scaleKey]: scaleVal,
          _industrySlug: spec.calculatorId.replace(/_load_v1$/, ""),
        };
        const result = computePeak(spec.calculatorId, inputs);
        if (result) {
          results.push({ scale: scaleVal, peakKW: result.peakLoadKW ?? 0 });
        }
      }

      it(`scale driver "${spec.scaleKey}" produces 4 valid outputs`, () => {
        expect(results.length).toBe(4);
        for (const r of results) {
          expect(Number.isFinite(r.peakKW)).toBe(true);
          expect(r.peakKW).toBeGreaterThan(0);
        }
      });

      it("peakKW is non-decreasing as scale increases", () => {
        for (let i = 1; i < results.length; i++) {
          expect(
            results[i].peakKW,
            `${spec.displayName}: scale ${results[i].scale} (${results[i].peakKW}kW) ` +
            `should be >= scale ${results[i - 1].scale} (${results[i - 1].peakKW}kW)`
          ).toBeGreaterThanOrEqual(results[i - 1].peakKW);
        }
      });

      it("largest scale produces meaningfully more kW than smallest", () => {
        const smallest = results[0];
        const largest = results[results.length - 1];
        const ratio = largest.peakKW / smallest.peakKW;
        // The largest scale should produce at least 1.5× the smallest
        // (scale range is ~5-10×, so 1.5× output is very conservative)
        expect(
          ratio,
          `${spec.displayName}: ${largest.scale}/${smallest.scale} scale ratio = ` +
          `${(largest.peakKW / smallest.peakKW).toFixed(2)}x kW, expected ≥ 1.5x`
        ).toBeGreaterThanOrEqual(1.5);
      });
    });
  }
});

// ============================================================================
// Sensitivity: 2× scale → at least 20% increase (not noise)
// ============================================================================

describe("Semantic Sensitivity — 2× scale → meaningful increase", () => {
  /**
   * For each calculator, we test the first pair where scale[1] ≈ 2× scale[0].
   * If the increase is < 20% (or spec-defined threshold), the scale key
   * is effectively not wired.
   */
  for (const spec of SCALE_SPECS) {
    // Find the first pair where the ratio is close to 2×
    // Our scale values are designed so that scaleValues[1] / scaleValues[0] ≈ 2
    const smallScale = spec.scaleValues[0];
    const largeScale = spec.scaleValues[1];
    const minIncreasePct = spec.minDoublingIncreasePct ?? 0.20;

    it(`${spec.displayName}: ${smallScale} → ${largeScale} ${spec.scaleKey} produces ≥${(minIncreasePct * 100).toFixed(0)}% increase`, () => {
      const smallInputs = {
        ...(spec.staticInputs ?? {}),
        [spec.scaleKey]: smallScale,
        _industrySlug: spec.calculatorId.replace(/_load_v1$/, ""),
      };
      const largeInputs = {
        ...(spec.staticInputs ?? {}),
        [spec.scaleKey]: largeScale,
        _industrySlug: spec.calculatorId.replace(/_load_v1$/, ""),
      };

      const smallResult = computePeak(spec.calculatorId, smallInputs);
      const largeResult = computePeak(spec.calculatorId, largeInputs);

      expect(smallResult).not.toBeNull();
      expect(largeResult).not.toBeNull();

      const smallKW = smallResult!.peakLoadKW ?? 0;
      const largeKW = largeResult!.peakLoadKW ?? 0;

      expect(smallKW).toBeGreaterThan(0);
      expect(largeKW).toBeGreaterThan(0);

      const increasePct = (largeKW - smallKW) / smallKW;
      expect(
        increasePct,
        `${spec.displayName}: ${smallScale}→${largeScale} ${spec.scaleKey} ` +
        `increased only ${(increasePct * 100).toFixed(1)}% (need ≥${(minIncreasePct * 100).toFixed(0)}%). ` +
        `Small=${smallKW.toFixed(0)}kW, Large=${largeKW.toFixed(0)}kW. ` +
        `Scale key "${spec.scaleKey}" may not be wired.`
      ).toBeGreaterThanOrEqual(minIncreasePct);
    });
  }
});

// ============================================================================
// NaN Safety: extreme inputs don't produce NaN/Infinity
// ============================================================================

describe("NaN Safety — extreme inputs produce finite output", () => {
  const EXTREME_CASES = [
    { label: "zero", value: 0 },
    { label: "negative", value: -10 },
    { label: "very large", value: 999999 },
    { label: "NaN", value: NaN },
    { label: "string 'default'", value: "default" },
    { label: "undefined", value: undefined },
    { label: "null", value: null },
  ];

  for (const spec of SCALE_SPECS) {
    for (const extreme of EXTREME_CASES) {
      it(`${spec.displayName}: ${spec.scaleKey}=${extreme.label} → finite peakKW`, () => {
        const inputs: Record<string, unknown> = {
          ...(spec.staticInputs ?? {}),
          [spec.scaleKey]: extreme.value,
          _industrySlug: spec.calculatorId.replace(/_load_v1$/, ""),
        };

        const result = computePeak(spec.calculatorId, inputs);
        expect(result).not.toBeNull();

        const peakKW = result!.peakLoadKW ?? 0;
        expect(
          Number.isFinite(peakKW),
          `${spec.displayName}: ${spec.scaleKey}=${extreme.label} produced ` +
          `peakKW=${peakKW} (not finite)`
        ).toBe(true);
        expect(peakKW).toBeGreaterThanOrEqual(0);
      });
    }
  }
});

// ============================================================================
// Through-step3Compute monotonicity (alias chain preserved)
// ============================================================================

describe("Monotonicity through step3Compute (full pipeline)", () => {
  // Import step3Compute — uses the public API barrel
  // Adapter side-effects are triggered by the step3Compute import chain

  const PIPELINE_SPECS: { industry: string; answerKey: string; small: unknown; large: unknown }[] = [
    { industry: "hotel", answerKey: "numRooms", small: 50, large: 400 },
    { industry: "car_wash", answerKey: "tunnelOrBayCount", small: 2, large: 12 },
    { industry: "restaurant", answerKey: "numRooms", small: 30, large: 300 },
    { industry: "office", answerKey: "facilitySize", small: "small", large: "enterprise" },
    { industry: "truck_stop", answerKey: "facilitySize", small: "small", large: "enterprise" },
    { industry: "gas_station", answerKey: "facilitySize", small: "small", large: "large" },
  ];

  for (const spec of PIPELINE_SPECS) {
    it(`${spec.industry}: small → large produces higher peakKW through full pipeline`, () => {
      const smallEnv = step3Compute({
        industry: spec.industry,
        answers: { [spec.answerKey]: spec.small },
      });
      const largeEnv = step3Compute({
        industry: spec.industry,
        answers: { [spec.answerKey]: spec.large },
      });

      expect(smallEnv.peakKW).toBeGreaterThan(0);
      expect(largeEnv.peakKW).toBeGreaterThan(0);
      expect(
        largeEnv.peakKW,
        `${spec.industry}: large=${spec.large} (${largeEnv.peakKW}kW) ` +
        `should be > small=${spec.small} (${smallEnv.peakKW}kW)`
      ).toBeGreaterThan(smallEnv.peakKW);
    });
  }
});

// ============================================================================
// Dominant Contributor Integrity — expected keys are present, finite, and > 0
// ============================================================================

describe("Dominant Contributor Integrity — industry-defining loads always present", () => {
  /**
   * For each calculator with dominantContributorsExpected, run at the
   * median scale value (index 2) and assert that every named contributor
   * is present, finite, and strictly > 0 in the validation envelope.
   *
   * WHY THIS MATTERS:
   *   A truck stop that reports 0 kW for refrigeration (cooling) is lying.
   *   A data center that reports 0 kW for itLoad is broken.
   *   These are structural invariants that no refactor should silently break.
   */
  const specsWithContributors = SCALE_SPECS.filter(
    (s) => s.dominantContributorsExpected && s.dominantContributorsExpected.length > 0
  );

  for (const spec of specsWithContributors) {
    describe(`${spec.displayName} (${spec.calculatorId})`, () => {
      // Use median scale point (index 2) — representative of typical facility
      const medianScale = spec.scaleValues[2];
      const inputs = {
        ...(spec.staticInputs ?? {}),
        [spec.scaleKey]: medianScale,
        _industrySlug: spec.calculatorId.replace(/_load_v1$/, ""),
      };
      const result = computePeak(spec.calculatorId, inputs);

      it("produces a valid CalcValidation envelope", () => {
        expect(result).not.toBeNull();
        expect(result!.validation).toBeDefined();
        expect(result!.validation?.version).toBe("v1");
        expect(result!.validation?.kWContributors).toBeDefined();
      });

      for (const key of spec.dominantContributorsExpected!) {
        it(`contributor "${key}" is present, finite, and > 0 at scale=${medianScale}`, () => {
          expect(result).not.toBeNull();
          const contributors = result!.validation?.kWContributors;
          expect(contributors).toBeDefined();

          const value = (contributors as Record<string, number>)?.[key];
          expect(
            value,
            `${spec.displayName}: contributor "${key}" is missing from kWContributors. ` +
            `Keys present: [${Object.keys(contributors ?? {}).join(", ")}]`
          ).toBeDefined();
          expect(
            Number.isFinite(value),
            `${spec.displayName}: contributor "${key}" = ${value} is not finite`
          ).toBe(true);
          expect(
            value,
            `${spec.displayName}: contributor "${key}" = ${value} — ` +
            `should be > 0 for a ${spec.displayName.toLowerCase()} at scale=${medianScale}`
          ).toBeGreaterThan(0);
        });
      }

      it("contributor sum ≈ peakLoadKW (within 10%)", () => {
        expect(result).not.toBeNull();
        const contributors = result!.validation?.kWContributors;
        expect(contributors).toBeDefined();

        const sum = Object.values(contributors as Record<string, number>).reduce(
          (acc, v) => acc + (Number.isFinite(v) ? v : 0),
          0
        );
        const peakKW = result!.peakLoadKW ?? 0;
        expect(peakKW).toBeGreaterThan(0);

        // Contributor sum should be within 10% of peakKW
        // (diversity factor and rounding can cause small divergence)
        const ratio = sum / peakKW;
        expect(
          ratio,
          `${spec.displayName}: contributor sum (${sum.toFixed(0)}kW) vs peakKW ` +
          `(${peakKW.toFixed(0)}kW) — ratio ${ratio.toFixed(3)} outside [0.90, 1.10]`
        ).toBeGreaterThanOrEqual(0.90);
        expect(ratio).toBeLessThanOrEqual(1.10);
      });
    });
  }
});
