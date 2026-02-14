/**
 * Gas station adapter button-value bridging tests
 *
 * HISTORY: Originally written to reproduce the 10 kW / $3K bug.
 * Updated Feb 14, 2026 after fixing all adapter button-to-number mappings.
 */
import { describe, it, expect } from "vitest";
import { CALCULATORS_BY_ID } from "../registry";

describe("Gas Station Adapter - Button Value Bridging", () => {
  const calc = CALCULATORS_BY_ID["gas_station_load_v1"];

  it("should exist", () => {
    expect(calc).toBeDefined();
  });

  it("with curated smart defaults (string button values), should produce realistic kW", () => {
    const curatedDefaults = {
      stationType: "convenience-plus",
      squareFootage: 3000,
      fuelPumps: "medium",
      operatingHours: "24-7",
      convenienceStore: "full",
      foodService: "none",
      carWash: "none",
      evChargers: "none",
      signage: "standard",
    };

    const result = calc.compute(curatedDefaults);
    expect(result.peakLoadKW).toBeGreaterThan(10);
  });

  it("with empty inputs (fallback defaults), should still get > 10 kW", () => {
    const result = calc.compute({});
    expect(result.peakLoadKW).toBeGreaterThan(10);
  });

  it("with hotel template defaults merged in, gas station fields should dominate", () => {
    const hotelDefaults = {
      room_count: 150,
      occupancy_avg_pct: 65,
      peak_demand_kw: 400,
    };
    const gasCurated = {
      stationType: "convenience-plus",
      squareFootage: 3000,
      fuelPumps: "medium",
      convenienceStore: "full",
      foodService: "none",
      carWash: "none",
      evChargers: "none",
    };

    const inputs = { ...hotelDefaults, ...gasCurated };
    const result = calc.compute(inputs);
    expect(result.peakLoadKW).toBeGreaterThan(10);
  });

  it("with numeric pump values, should still work (backward compat)", () => {
    const result = calc.compute({ fuelPumps: 8, convenienceStore: "full" });
    expect(result.peakLoadKW).toBeGreaterThan(10);
  });

  it("changing fuelPumps button value SHOULD change output (bug was fixed)", () => {
    // Include c-store so peakLoadKW stays above the SSOT 10 kW minimum floor
    const small = calc.compute({ fuelPumps: "small", convenienceStore: "full" });
    const medium = calc.compute({ fuelPumps: "medium", convenienceStore: "full" });
    const large = calc.compute({ fuelPumps: "large", convenienceStore: "full" });
    const mega = calc.compute({ fuelPumps: "mega", convenienceStore: "full" });

    // small=3, medium=8, large=16, mega=24 pumps (each 1.5 kW + 15 kW store)
    // small: 4.5+15=19.5, medium: 12+15=27, large: 24+15=39, mega: 36+15=51
    expect(small.peakLoadKW).toBeLessThan(medium.peakLoadKW);
    expect(medium.peakLoadKW).toBeLessThan(large.peakLoadKW);
    expect(large.peakLoadKW).toBeLessThan(mega.peakLoadKW);
  });

  it("convenience store, carWash, evChargers should add to load", () => {
    // Use 'large' pumps so base is well above the SSOT 10 kW floor
    const base = calc.compute({
      fuelPumps: "large",
      convenienceStore: "none",
      carWash: "none",
      evChargers: "none",
    });
    const withCStore = calc.compute({
      fuelPumps: "large",
      convenienceStore: "full",
      carWash: "none",
      evChargers: "none",
    });
    const withCarWash = calc.compute({
      fuelPumps: "large",
      convenienceStore: "none",
      carWash: "tunnel",
      evChargers: "none",
    });
    const withEV = calc.compute({
      fuelPumps: "large",
      convenienceStore: "none",
      carWash: "none",
      evChargers: "dcfc-multiple",
    });

    expect(withCStore.peakLoadKW).toBeGreaterThan(base.peakLoadKW);
    expect(withCarWash.peakLoadKW).toBeGreaterThan(base.peakLoadKW);
    expect(withEV.peakLoadKW).toBeGreaterThan(base.peakLoadKW);
  });
});
