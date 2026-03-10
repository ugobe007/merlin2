/**
 * =============================================================================
 * WIZARD V8 — WIZARD FLOW TESTS (FIXED)
 * =============================================================================
 *
 * Tests the wizard state management and The 8 Rules enforcement.
 *
 * Coverage:
 * - Initial state correctness
 * - Step navigation (1 → 2 → 3 → 3.5 → 4 → 5)
 * - Location + Intel management
 * - Addon preferences
 * - Industry selection
 * - Facility profile (Step 3)
 * - Addon configuration (Step 3.5)
 * - MagicFit tiers (Step 4)
 * - Solar feasibility gate (RULE #8)
 * - State immutability (RULE #1)
 * - Conditional Step 3.5 flow
 * - Complete wizard flow
 * - Error handling
 *
 * Run: npm run test:v8:flow
 */

import { describe, it, expect } from "vitest";
import { reducer, initialState, isSolarFeasible, type SolarGrade } from "../wizardState";

// =============================================================================
// INITIAL STATE
// =============================================================================

describe("Initial wizard state", () => {
  it("starts at Step 0 (mode select)", () => {
    const state = initialState();
    expect(state.step).toBe(0);
  });

  it("has no location initially", () => {
    const state = initialState();
    expect(state.location).toBeNull();
  });

  it("has idle intel status", () => {
    const state = initialState();
    expect(state.intelStatus.utility).toBe("idle");
    expect(state.intelStatus.solar).toBe("idle");
    expect(state.intelStatus.weather).toBe("idle");
    expect(state.intel).toBeNull();
  });

  it("addon preferences default to false", () => {
    const state = initialState();
    expect(state.wantsSolar).toBe(false);
    expect(state.wantsEVCharging).toBe(false);
    expect(state.wantsGenerator).toBe(false);
  });

  it("has null industry", () => {
    const state = initialState();
    expect(state.industry).toBeNull();
  });

  it("tier defaults: index=null (no pre-selection), tiers=null", () => {
    const state = initialState();
    expect(state.selectedTierIndex).toBeNull(); // No pre-selection in V8
    expect(state.tiers).toBeNull();
    expect(state.tiersStatus).toBe("idle");
  });
});

// =============================================================================
// STEP NAVIGATION
// =============================================================================

describe("Step navigation", () => {
  it("advances from Step 1 to Step 2", () => {
    let state = initialState();
    state = reducer(state, { type: "GO_TO_STEP", step: 1 });
    state = reducer(state, { type: "GO_TO_STEP", step: 2 });

    expect(state.step).toBe(2);
  });

  it("advances through all steps: 1 → 2 → 3 → 4 → 5", () => {
    let state = initialState();

    state = reducer(state, { type: "GO_TO_STEP", step: 1 });
    expect(state.step).toBe(1);

    state = reducer(state, { type: "GO_TO_STEP", step: 2 });
    expect(state.step).toBe(2);

    state = reducer(state, { type: "GO_TO_STEP", step: 3 });
    expect(state.step).toBe(3);

    state = reducer(state, { type: "GO_TO_STEP", step: 4 });
    expect(state.step).toBe(4);

    state = reducer(state, { type: "GO_TO_STEP", step: 5 });
    expect(state.step).toBe(5);
  });

  it("supports Step 3.5 (addon config)", () => {
    let state = initialState();
    state = reducer(state, { type: "GO_TO_STEP", step: 3.5 });

    expect(state.step).toBe(3.5);
  });

  it("can go backwards", () => {
    let state = initialState();
    state = reducer(state, { type: "GO_TO_STEP", step: 5 });
    state = reducer(state, { type: "GO_BACK" });

    expect(state.step).toBe(4);
  });

  it("can go back to Step 0 from Step 1", () => {
    let state = initialState();
    state = reducer(state, { type: "GO_TO_STEP", step: 1 });
    state = reducer(state, { type: "GO_BACK" });

    expect(state.step).toBe(0);
  });

  it("goes back from Step 3.5 to Step 3", () => {
    let state = initialState();
    state = reducer(state, { type: "GO_TO_STEP", step: 3.5 });
    state = reducer(state, { type: "GO_BACK" });

    expect(state.step).toBe(3);
  });

  it("goes back from Step 4 to Step 3.5 when addons are enabled", () => {
    let state = initialState();
    state = reducer(state, { type: "SET_ADDON_PREFERENCE", addon: "solar", value: true });
    state = reducer(state, { type: "GO_TO_STEP", step: 4 });
    state = reducer(state, { type: "GO_BACK" });

    expect(state.step).toBe(3.5);
  });

  it("goes back from Step 4 to Step 3 when no addons are enabled", () => {
    let state = initialState();
    state = reducer(state, { type: "GO_TO_STEP", step: 4 });
    state = reducer(state, { type: "GO_BACK" });

    expect(state.step).toBe(3);
  });
});

// =============================================================================
// LOCATION AND INTEL STATE
// =============================================================================

describe("Location and intel state", () => {
  it("sets location via SET_LOCATION action", () => {
    let state = initialState();

    const location = {
      zip: "89101",
      city: "Las Vegas",
      state: "NV",
      formattedAddress: "Las Vegas, NV 89101",
      lat: 36.175,
      lng: -115.137,
    };

    state = reducer(state, { type: "SET_LOCATION", location });

    expect(state.location).toEqual(location);
    expect(state.locationStatus).toBe("ready");
  });

  it("clears confirmed location and related Step 1 state", () => {
    let state = initialState();

    state = reducer(state, {
      type: "SET_LOCATION",
      location: {
        zip: "89101",
        city: "Las Vegas",
        state: "NV",
        formattedAddress: "Las Vegas, NV 89101",
      },
    });
    state = reducer(state, {
      type: "PATCH_INTEL",
      patch: {
        utilityRate: 0.12,
        utilityStatus: "ready",
      },
    });
    state = reducer(state, {
      type: "SET_BUSINESS",
      business: {
        name: "Acme Manufacturing",
        detectedIndustry: "manufacturing",
        confidence: 0.85,
      },
    });
    state = reducer(state, {
      type: "SET_GRID_RELIABILITY",
      reliability: "frequent-outages",
    });
    state = reducer(state, { type: "CLEAR_LOCATION" });

    expect(state.locationRaw).toBe("");
    expect(state.location).toBeNull();
    expect(state.locationStatus).toBe("idle");
    expect(state.business).toBeNull();
    expect(state.intel).toBeNull();
    expect(state.intelStatus).toEqual({
      utility: "idle",
      solar: "idle",
      weather: "idle",
    });
    expect(state.gridReliability).toBeNull();
  });

  it("patches intel with PATCH_INTEL (utility data)", () => {
    let state = initialState();

    state = reducer(state, {
      type: "PATCH_INTEL",
      patch: {
        utilityRate: 0.12,
        demandCharge: 15,
        utilityProvider: "NV Energy",
        utilityStatus: "ready",
      },
    });

    expect(state.intel?.utilityRate).toBe(0.12);
    expect(state.intel?.demandCharge).toBe(15);
    expect(state.intelStatus.utility).toBe("ready");
  });

  it("patches intel with PATCH_INTEL (solar data)", () => {
    let state = initialState();

    state = reducer(state, {
      type: "PATCH_INTEL",
      patch: {
        solarGrade: "B+",
        solarFeasible: true,
        peakSunHours: 5.2,
        solarStatus: "ready",
      },
    });

    expect(state.intel?.solarGrade).toBe("B+");
    expect(state.intel?.peakSunHours).toBe(5.2);
    expect(state.intelStatus.solar).toBe("ready");
  });

  it("patches intel with PATCH_INTEL (weather data)", () => {
    let state = initialState();

    state = reducer(state, {
      type: "PATCH_INTEL",
      patch: {
        weatherRisk: "Low",
        weatherProfile: "Hot & Dry",
        avgTempF: 75,
        weatherStatus: "ready",
      },
    });

    expect(state.intel?.weatherRisk).toBe("Low");
    expect(state.intelStatus.weather).toBe("ready");
  });
});

describe("Business selection state", () => {
  it("stores manual business data including typed street address", () => {
    let state = initialState();
    state = reducer(state, {
      type: "SET_BUSINESS",
      business: {
        name: "Acme Manufacturing",
        address: "1234 Industrial Way",
        detectedIndustry: "manufacturing",
        confidence: 0.85,
      },
    });

    expect(state.business?.name).toBe("Acme Manufacturing");
    expect(state.business?.address).toBe("1234 Industrial Way");
  });

  it("clears business state when edit/reset is requested", () => {
    let state = initialState();
    state = reducer(state, {
      type: "SET_BUSINESS",
      business: {
        name: "Acme Manufacturing",
        detectedIndustry: "manufacturing",
        confidence: 0.85,
      },
    });
    state = reducer(state, { type: "SET_BUSINESS", business: null });

    expect(state.business).toBeNull();
  });

  it("skips Step 2 when a recognized business has high-confidence industry detection", () => {
    let state = initialState();
    state = reducer(state, {
      type: "SET_BUSINESS",
      business: {
        name: "Costco Wholesale",
        detectedIndustry: "retail",
        confidence: 0.85,
      },
    });

    state = reducer(state, { type: "CONFIRM_BUSINESS" });

    expect(state.step).toBe(3);
    expect(state.industry).toBe("retail");
  });
});

// =============================================================================
// ADDON PREFERENCES
// =============================================================================

describe("Addon preferences", () => {
  it("toggles wantsSolar", () => {
    let state = initialState();
    expect(state.wantsSolar).toBe(false);

    state = reducer(state, { type: "SET_ADDON_PREFERENCE", addon: "solar", value: true });
    expect(state.wantsSolar).toBe(true);

    state = reducer(state, { type: "SET_ADDON_PREFERENCE", addon: "solar", value: false });
    expect(state.wantsSolar).toBe(false);
  });

  it("toggles wantsEVCharging", () => {
    let state = initialState();

    state = reducer(state, { type: "SET_ADDON_PREFERENCE", addon: "ev", value: true });
    expect(state.wantsEVCharging).toBe(true);
  });

  it("toggles wantsGenerator", () => {
    let state = initialState();

    state = reducer(state, { type: "SET_ADDON_PREFERENCE", addon: "generator", value: true });
    expect(state.wantsGenerator).toBe(true);
  });
});

// =============================================================================
// INDUSTRY SELECTION
// =============================================================================

describe("Industry selection", () => {
  it("sets industry and derived metadata", () => {
    let state = initialState();

    // First set industry
    state = reducer(state, { type: "SET_INDUSTRY", slug: "hotel" });
    expect(state.industry).toBe("hotel");

    // Then set metadata (would come from getFacilityConstraints in real flow)
    state = reducer(state, {
      type: "SET_INDUSTRY_META",
      solarPhysicalCapKW: 200,
      criticalLoadPct: 0.55,
    });

    expect(state.solarPhysicalCapKW).toBe(200);
    expect(state.criticalLoadPct).toBe(0.55);
  });

  it("different industries have different solar caps", () => {
    let state1 = initialState();
    state1 = reducer(state1, { type: "SET_INDUSTRY", slug: "car_wash" });
    state1 = reducer(state1, {
      type: "SET_INDUSTRY_META",
      solarPhysicalCapKW: 60,
      criticalLoadPct: 0.25,
    });

    let state2 = initialState();
    state2 = reducer(state2, { type: "SET_INDUSTRY", slug: "hotel" });
    state2 = reducer(state2, {
      type: "SET_INDUSTRY_META",
      solarPhysicalCapKW: 200,
      criticalLoadPct: 0.55,
    });

    expect(state1.solarPhysicalCapKW).toBe(60);
    expect(state2.solarPhysicalCapKW).toBe(200);
    expect(state1.solarPhysicalCapKW).toBeLessThan(state2.solarPhysicalCapKW);
  });

  it("different industries have different critical load %", () => {
    let state1 = initialState();
    state1 = reducer(state1, { type: "SET_INDUSTRY", slug: "car_wash" });
    state1 = reducer(state1, {
      type: "SET_INDUSTRY_META",
      solarPhysicalCapKW: 60,
      criticalLoadPct: 0.25,
    });

    let state2 = initialState();
    state2 = reducer(state2, { type: "SET_INDUSTRY", slug: "hospital" });
    state2 = reducer(state2, {
      type: "SET_INDUSTRY_META",
      solarPhysicalCapKW: 150,
      criticalLoadPct: 0.85,
    });

    expect(state1.criticalLoadPct).toBe(0.25);
    expect(state2.criticalLoadPct).toBe(0.85);
    expect(state1.criticalLoadPct).toBeLessThan(state2.criticalLoadPct);
  });
});

// =============================================================================
// FACILITY PROFILE (Step 3)
// =============================================================================

describe("Facility profile (Step 3)", () => {
  it("sets base and peak load", () => {
    let state = initialState();

    state = reducer(state, {
      type: "SET_BASE_LOAD",
      baseLoadKW: 150,
      peakLoadKW: 250,
    });

    expect(state.baseLoadKW).toBe(150);
    expect(state.peakLoadKW).toBe(250);
  });

  it("stores Step 3 answers", () => {
    let state = initialState();

    state = reducer(state, { type: "SET_ANSWER", key: "numberOfRooms", value: 200 });
    state = reducer(state, { type: "SET_ANSWER", key: "hotelClass", value: "midscale" });
    state = reducer(state, { type: "SET_ANSWER", key: "hasPool", value: true });
    state = reducer(state, { type: "SET_ANSWER", key: "hasRestaurant", value: false });

    expect(state.step3Answers.numberOfRooms).toBe(200);
    expect(state.step3Answers.hotelClass).toBe("midscale");
    expect(state.step3Answers.hasPool).toBe(true);
    expect(state.step3Answers.hasRestaurant).toBe(false);
  });
});

// =============================================================================
// ADDON CONFIGURATION (Step 3.5)
// =============================================================================

describe("Addon configuration (Step 3.5)", () => {
  it("sets solar kW", () => {
    let state = initialState();

    state = reducer(state, {
      type: "SET_ADDON_CONFIG",
      config: { solarKW: 200 },
    });

    expect(state.solarKW).toBe(200);
  });

  it("sets generator kW and fuel type", () => {
    let state = initialState();

    state = reducer(state, {
      type: "SET_ADDON_CONFIG",
      config: {
        generatorKW: 150,
        generatorFuelType: "natural-gas",
      },
    });

    expect(state.generatorKW).toBe(150);
    expect(state.generatorFuelType).toBe("natural-gas");
  });

  it("sets EV chargers", () => {
    let state = initialState();

    state = reducer(state, {
      type: "SET_ADDON_CONFIG",
      config: {
        level2Chargers: 8,
        dcfcChargers: 4,
        hpcChargers: 2,
      },
    });

    expect(state.level2Chargers).toBe(8);
    expect(state.dcfcChargers).toBe(4);
    expect(state.hpcChargers).toBe(2);
  });
});

// =============================================================================
// MAGICFIT TIERS (Step 4)
// =============================================================================

describe("MagicFit tiers (Step 4)", () => {
  it("sets tiers status to fetching", () => {
    let state = initialState();

    state = reducer(state, { type: "SET_TIERS_STATUS", status: "fetching" });

    expect(state.tiersStatus).toBe("fetching");
  });

  it("sets tiers when ready", () => {
    let state = initialState();

    const mockTiers: [any, any, any] = [
      { label: "Starter", bessKW: 100, bessKWh: 400 },
      { label: "Recommended", bessKW: 150, bessKWh: 600 },
      { label: "Complete", bessKW: 200, bessKWh: 800 },
    ];

    state = reducer(state, { type: "SET_TIERS", tiers: mockTiers as any });

    expect(state.tiers).toBeDefined();
    expect(state.tiers?.length).toBe(3);
  });

  it("selects tier index", () => {
    let state = initialState();

    state = reducer(state, { type: "SELECT_TIER", index: 1 });

    expect(state.selectedTierIndex).toBe(1);
  });
});

// =============================================================================
// SOLAR FEASIBILITY GATE (RULE #8)
// =============================================================================

describe("Solar feasibility gate (RULE #8)", () => {
  it("A grade is feasible", () => {
    expect(isSolarFeasible("A")).toBe(true);
  });

  it("A- grade is feasible", () => {
    expect(isSolarFeasible("A-")).toBe(true);
  });

  it("B+ grade is feasible", () => {
    expect(isSolarFeasible("B+")).toBe(true);
  });

  it("B grade is feasible", () => {
    expect(isSolarFeasible("B")).toBe(true);
  });

  it("B- grade is feasible (minimum threshold)", () => {
    expect(isSolarFeasible("B-")).toBe(true);
  });

  it("C+ grade is NOT feasible (below threshold)", () => {
    expect(isSolarFeasible("C+")).toBe(false);
  });

  it("C grade is NOT feasible", () => {
    expect(isSolarFeasible("C")).toBe(false);
  });

  it("D grade is NOT feasible", () => {
    expect(isSolarFeasible("D")).toBe(false);
  });

  it("null grade is NOT feasible", () => {
    expect(isSolarFeasible(null)).toBe(false);
  });
});

// =============================================================================
// STATE IMMUTABILITY (RULE #1)
// =============================================================================

describe("State immutability (RULE #1)", () => {
  it("reducer returns new state object", () => {
    const state1 = initialState();
    const state2 = reducer(state1, { type: "GO_TO_STEP", step: 2 });

    expect(state2).not.toBe(state1); // Different objects
  });

  it("reducer does not mutate original state", () => {
    const state = initialState();
    const originalStep = state.step;

    reducer(state, { type: "GO_TO_STEP", step: 3 });

    expect(state.step).toBe(originalStep); // Original unchanged
  });

  it("nested objects are not mutated", () => {
    const state = initialState();
    const location = {
      zip: "89101",
      city: "Las Vegas",
      state: "NV",
      formattedAddress: "Las Vegas, NV 89101",
    };

    const state2 = reducer(state, { type: "SET_LOCATION", location });

    expect(state.location).toBeNull(); // Original state not mutated
    expect(state2.location).toEqual(location); // New state has location
  });
});

// =============================================================================
// CONDITIONAL STEP 3.5 FLOW
// =============================================================================

describe("Conditional Step 3.5 flow", () => {
  it("Step 3.5 needed when wantsSolar = true", () => {
    let state = initialState();
    state = reducer(state, { type: "SET_ADDON_PREFERENCE", addon: "solar", value: true });

    const needsStep35 = state.wantsSolar || state.wantsEVCharging || state.wantsGenerator;
    expect(needsStep35).toBe(true);
  });

  it("Step 3.5 needed when wantsEVCharging = true", () => {
    let state = initialState();
    state = reducer(state, { type: "SET_ADDON_PREFERENCE", addon: "ev", value: true });

    const needsStep35 = state.wantsSolar || state.wantsEVCharging || state.wantsGenerator;
    expect(needsStep35).toBe(true);
  });

  it("Step 3.5 needed when wantsGenerator = true", () => {
    let state = initialState();
    state = reducer(state, { type: "SET_ADDON_PREFERENCE", addon: "generator", value: true });

    const needsStep35 = state.wantsSolar || state.wantsEVCharging || state.wantsGenerator;
    expect(needsStep35).toBe(true);
  });

  it("Step 3.5 NOT needed when all addons false", () => {
    const state = initialState();

    const needsStep35 = state.wantsSolar || state.wantsEVCharging || state.wantsGenerator;
    expect(needsStep35).toBe(false);
  });

  it("Step 3.5 needed when multiple addons wanted", () => {
    let state = initialState();
    state = reducer(state, { type: "SET_ADDON_PREFERENCE", addon: "solar", value: true });
    state = reducer(state, { type: "SET_ADDON_PREFERENCE", addon: "ev", value: true });

    const needsStep35 = state.wantsSolar || state.wantsEVCharging || state.wantsGenerator;
    expect(needsStep35).toBe(true);
  });
});

// =============================================================================
// COMPLETE WIZARD FLOW
// =============================================================================

describe("Complete wizard flow", () => {
  it("simulates full wizard journey: Step 1 → 5", () => {
    let state = initialState();

    // Step 1: Location + Intel
    state = reducer(state, {
      type: "SET_LOCATION",
      location: {
        zip: "94102",
        city: "San Francisco",
        state: "CA",
        formattedAddress: "San Francisco, CA 94102",
      },
    });
    state = reducer(state, {
      type: "PATCH_INTEL",
      patch: {
        utilityRate: 0.2794,
        demandCharge: 25,
        utilityProvider: "PG&E",
        solarGrade: "B+",
        solarFeasible: true,
        peakSunHours: 5.1,
        weatherRisk: "Low",
        weatherProfile: "Mediterranean",
        avgTempF: 57,
        utilityStatus: "ready",
        solarStatus: "ready",
        weatherStatus: "ready",
      },
    });

    // Step 2: Industry
    state = reducer(state, { type: "SET_INDUSTRY", slug: "hotel" });
    state = reducer(state, {
      type: "SET_INDUSTRY_META",
      solarPhysicalCapKW: 200,
      criticalLoadPct: 0.55,
    });
    state = reducer(state, { type: "GO_TO_STEP", step: 3 });

    // Step 3: Profile
    state = reducer(state, { type: "SET_ANSWER", key: "numberOfRooms", value: 150 });
    state = reducer(state, { type: "SET_ANSWER", key: "hotelClass", value: "upscale" });
    state = reducer(state, {
      type: "SET_BASE_LOAD",
      baseLoadKW: 180,
      peakLoadKW: 300,
    });

    // Step 4: MagicFit tiers
    state = reducer(state, { type: "GO_TO_STEP", step: 4 });

    // Step 5: Results
    state = reducer(state, { type: "GO_TO_STEP", step: 5 });

    // Verify final state
    expect(state.step).toBe(5);
    expect(state.location?.city).toBe("San Francisco");
    expect(state.industry).toBe("hotel");
    expect(state.peakLoadKW).toBe(300);
  });
});

// =============================================================================
// ERROR STATE HANDLING
// =============================================================================

describe("Error state handling", () => {
  it("handles intel fetch error gracefully", () => {
    let state = initialState();

    state = reducer(state, {
      type: "PATCH_INTEL",
      patch: { utilityStatus: "error" },
    });

    expect(state.intelStatus.utility).toBe("error");
  });

  it("handles tiers fetch error gracefully", () => {
    let state = initialState();

    state = reducer(state, { type: "SET_TIERS_STATUS", status: "error" });

    expect(state.tiersStatus).toBe("error");
  });

  it("can recover from error by refetching", () => {
    let state = initialState();
    state = reducer(state, { type: "PATCH_INTEL", patch: { utilityStatus: "error" } });
    expect(state.intelStatus.utility).toBe("error");

    // Retry
    state = reducer(state, { type: "PATCH_INTEL", patch: { utilityStatus: "fetching" } });
    expect(state.intelStatus.utility).toBe("fetching");

    state = reducer(state, {
      type: "PATCH_INTEL",
      patch: {
        utilityRate: 0.12,
        demandCharge: 15,
        utilityProvider: "NV Energy",
        utilityStatus: "ready",
      },
    });
    expect(state.intelStatus.utility).toBe("ready");
    expect(state.intel?.utilityRate).toBe(0.12);
  });
});
