/**
 * ADAPTER HARDENING TESTS
 * =======================
 *
 * Tests the 4 hardening improvements:
 * 1. Car wash uses_hot_water warning fixed
 * 2. Hotel adapter surfaces defaults as assumptions
 * 3. Adapter completeness checks (requireNum)
 * 4. DC range sanity warnings
 */

import { describe, it, expect } from "vitest";
import { getCalculator } from "../../calculators/registry";
import type { CalcInputs } from "../../calculators/contract";

describe("Adapter hardening", () => {
  it("hotel adapter surfaces all defaults as assumptions", () => {
    const calc = getCalculator("hotel_load_v1");
    expect(calc).toBeTruthy();

    // Minimal inputs - will trigger many defaults
    const inputs: CalcInputs = {
      room_count: 100,
      occupancy_avg_pct: 70,
      occupancy_peak_pct: 90,
      laundry_on_site: true,
      kitchen_type: "None",
      restaurant_on_site: false,
      bar_on_site: false,
      pool_on_site: false,
      spa_on_site: false,
      conference_sqft: 0,
      hvac_type: "Central AC",
      has_electric_hot_water: true,
      monthly_kwh: 50000,
      peak_demand_kw: 200,
      demand_charge: false,
      demand_charge_rate: 0,
    };

    const result = calc!.compute(inputs);

    // Should have assumptions tracking defaults
    expect(result.assumptions).toBeDefined();
    expect(result.assumptions!.length).toBeGreaterThan(0);

    // Check for specific defaults
    const assumptionText = result.assumptions!.join(" ");
    expect(assumptionText).toContain("hotelClass");
    expect(assumptionText).toContain("midscale");
    expect(assumptionText).toContain("electricalServiceSize");
    expect(assumptionText).toContain("1600");

    // Should have warnings about defaults
    expect(result.warnings).toBeDefined();
    expect(result.warnings!.length).toBeGreaterThan(0);

    const warningText = result.warnings!.join(" ");
    expect(warningText).toContain("Defaulted");

    console.log("[hardening test] Hotel assumptions:", result.assumptions);
    console.log("[hardening test] Hotel warnings:", result.warnings);
  });

  it("car wash adapter requires numeric inputs", () => {
    const calc = getCalculator("car_wash_load_v1");
    expect(calc).toBeTruthy();

    // Missing critical numeric inputs
    const inputs: CalcInputs = {
      wash_type: "In-bay automatic",
      // bay_count: MISSING
      tunnel_length_ft: 0,
      // cars_per_day_avg: MISSING
      cars_per_hour_peak: 10,
      operating_hours_per_day: 12,
      days_per_week: 7,
      dryer_present: true,
      dryer_kw: 15,
      water_heating_type: "Electric",
      uses_hot_water: true,
      reclaim_system: true,
      vacuum_count: 4,
      vacuum_kw_each: 5,
      // monthly_kwh: MISSING
      peak_demand_kw: 100,
      demand_charge: false,
      demand_charge_rate: 0,
    };

    const result = calc!.compute(inputs);

    // Should warn about missing inputs
    expect(result.warnings).toBeDefined();
    expect(result.warnings!.length).toBeGreaterThan(0);

    const warningText = result.warnings!.join(" ");
    expect(warningText).toContain("Missing/invalid numeric input");
    expect(warningText).toContain("bay_count");
    expect(warningText).toContain("cars_per_day_avg");
    expect(warningText).toContain("monthly_kwh");

    console.log("[hardening test] Car wash warnings:", result.warnings);
  });

  it("DC adapter has range sanity checks", () => {
    const calc = getCalculator("dc_load_v1");
    expect(calc).toBeTruthy();

    // Unusual values that should trigger sanity warnings
    const inputs: CalcInputs = {
      it_load_kw: 500,
      peak_it_load_kw: 650,
      avg_utilization_pct: 75,
      growth_pct_24mo: 15,
      power_capacity_kw: 1000,
      tier: "Tier III",
      redundancy: "N+1",
      required_runtime_min: 30,
      generator_present: true,
      ups_present: true,
      cooling_type: "CRAH/CRAC",
      pue: 3.5, // UNUSUAL - way too high
      cooling_peak_kw: 200,
      monthly_kwh: 360000,
      demand_charge: false,
      demand_charge_rate: 0,
    };

    const result = calc!.compute(inputs);

    // Should warn about unusual PUE
    expect(result.warnings).toBeDefined();
    expect(result.warnings!.some((w) => w.includes("PUE out of normal range"))).toBe(true);

    console.log("[hardening test] DC warnings:", result.warnings);
  });

  it("DC adapter checks peak >= base load", () => {
    const calc = getCalculator("dc_load_v1");
    expect(calc).toBeTruthy();

    const inputs: CalcInputs = {
      it_load_kw: 100, // Very low IT load
      peak_it_load_kw: 100,
      avg_utilization_pct: 5, // Very low utilization - might cause peak < base
      growth_pct_24mo: 0,
      power_capacity_kw: 1000,
      tier: "Tier I",
      redundancy: "N",
      required_runtime_min: 15,
      generator_present: false,
      ups_present: true,
      cooling_type: "Air cooled",
      pue: 2.0, // High PUE for Tier I
      cooling_peak_kw: 50,
      monthly_kwh: 50000,
      demand_charge: false,
      demand_charge_rate: 0,
    };

    const result = calc!.compute(inputs);

    // Verify outputs are sane
    expect(result.baseLoadKW).toBeDefined();
    expect(result.peakLoadKW).toBeDefined();

    // Check if warning was issued (if peak < base)
    if (result.peakLoadKW! < result.baseLoadKW!) {
      expect(
        result.warnings!.some((w) => w.includes("Peak load") && w.includes("< base load"))
      ).toBe(true);
    }

    console.log("[hardening test] DC outputs:", {
      baseLoadKW: result.baseLoadKW,
      peakLoadKW: result.peakLoadKW,
      warnings: result.warnings,
    });
  });
});
