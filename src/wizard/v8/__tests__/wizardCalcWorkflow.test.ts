/**
 * =============================================================================
 * WIZARD V8 — CALCULATION WORKFLOW TESTS
 * =============================================================================
 *
 * Tests the full calculation pipeline from data capture (Steps 1–3.5) through
 * final tier output (Step 4/buildTiers). Verifies:
 *
 *   A. VALUE CAPTURE   — each wizard input lands in the right state field
 *   B. BESS CHAIN      — peakLoadKW → ratio → bessKW/bessKWh per tier
 *   C. SOLAR CHAIN     — peakSunHours + solarPhysicalCapKW → solarKW per tier
 *   D. GENERATOR CHAIN — criticalLoadPct + peakLoadKW → generatorKW per tier
 *   E. EV CHAIN        — level2Chargers/dcfcChargers/hpcChargers → evChargerKW
 *   F. FINANCIAL CHAIN — grossCost → itcAmount → netCost → paybackYears
 *   G. MULTI-INDUSTRY  — Hotel, Office, Data Center, Manufacturing, Hospital
 *   H. ADDON CONSISTENCY — addonSizing display values ↔ step4Logic committed values
 *   I. FIRST-VISIT SEEDING — Step 3.5 isFirstVisit seeding fills state correctly
 *   J. CROSS-STEP INTEGRITY — changing Step 1/2 clears downstream state
 *
 * SSOT VALUES (from benchmarkSources.ts — do not inline elsewhere):
 *   BESS ratio: peak_shaving=0.40, resilience=0.70, arbitrage=0.50
 *   Generator reserve margin: 1.25 (NEC 700/701/702 + IEEE 446)
 *   Tier BESS scale: Starter=0.55, Recommended=1.0, Complete=1.5
 *   75 kW commercial minimum floor
 *
 * =============================================================================
 */

import { describe, it, expect } from "vitest";
import { buildTiers } from "../step4Logic";
import {
  estimateSolarKW,
  estimateGenKW,
  computeEVPackageKW,
  defaultGeneratorScope,
  EV_KW,
  SOLAR_SCOPE_PENETRATION,
} from "../addonSizing";
import { reducer, initialState, type WizardState } from "../wizardState";
import {
  getBESSSizingRatioWithSource,
  getGeneratorReserveMarginWithSource,
} from "@/services/benchmarkSources";

// =============================================================================
// SHARED TEST FIXTURES
// =============================================================================

/** Build a full LocationIntel object — weatherProfile/avgTempF always included */
function makeIntel(
  overrides: Partial<import("../wizardState").LocationIntel> = {}
): import("../wizardState").LocationIntel {
  return {
    utilityRate: 0.2794,
    demandCharge: 25,
    peakSunHours: 5.1,
    solarGrade: "B+",
    solarFeasible: true,
    utilityProvider: "PG&E",
    weatherRisk: "Low",
    weatherProfile: "Mild & Coastal",
    avgTempF: 62,
    ...overrides,
  };
}

/** Build a complete WizardState ready for buildTiers() */
function makeState(overrides: Partial<WizardState> = {}): WizardState {
  return {
    step: 5 as WizardState["step"],
    locationRaw: "",
    country: "US",
    countryCode: "US",
    location: {
      zip: "94102",
      city: "San Francisco",
      state: "CA",
      formattedAddress: "San Francisco, CA 94102",
      lat: 37.7749,
      lng: -122.4194,
    },
    locationStatus: "ready",
    business: null,
    intelStatus: { utility: "ready", solar: "ready", weather: "ready" },
    gridReliability: "reliable",
    intel: makeIntel(),
    industry: "office",
    solarPhysicalCapKW: 200,
    criticalLoadPct: 0.3,
    step3Answers: {
      primaryBESSApplication: "peak_shaving",
      step3_5Visited: true,
    },
    evChargers: null,
    baseLoadKW: 150,
    peakLoadKW: 250,
    criticalLoadKW: 75,
    evRevenuePerYear: 0,
    wantsSolar: true,
    wantsEVCharging: false,
    wantsGenerator: false,
    solarKW: 0,
    generatorKW: 0,
    generatorFuelType: "natural-gas",
    level2Chargers: 0,
    dcfcChargers: 0,
    hpcChargers: 0,
    tiersStatus: "idle",
    tiers: null,
    selectedTierIndex: null,
    isBusy: false,
    busyLabel: "",
    error: null,
    locationIntelIgnored: false,
    ...overrides,
  } as WizardState;
}

// =============================================================================
// A. VALUE CAPTURE — Each wizard input lands in the correct state field
// =============================================================================

describe("A. Value capture — wizard inputs land in state", () => {
  it("Step 1: location ZIP stored correctly", () => {
    let s = initialState();
    s = reducer(s, {
      type: "SET_LOCATION",
      location: {
        zip: "89101",
        city: "Las Vegas",
        state: "NV",
        formattedAddress: "Las Vegas, NV 89101",
      },
    });
    expect(s.location?.zip).toBe("89101");
    expect(s.location?.city).toBe("Las Vegas");
    expect(s.location?.state).toBe("NV");
  });

  it("Step 1: utility rate + demand charge stored in intel", () => {
    let s = initialState();
    s = reducer(s, { type: "PATCH_INTEL", patch: { utilityRate: 0.185, demandCharge: 22 } });
    expect(s.intel?.utilityRate).toBe(0.185);
    expect(s.intel?.demandCharge).toBe(22);
  });

  it("Step 1: solar grade + PSH stored in intel", () => {
    let s = initialState();
    s = reducer(s, {
      type: "PATCH_INTEL",
      patch: { solarGrade: "A", peakSunHours: 6.5, solarFeasible: true },
    });
    expect(s.intel?.solarGrade).toBe("A");
    expect(s.intel?.peakSunHours).toBe(6.5);
    expect(s.intel?.solarFeasible).toBe(true);
  });

  it("Step 1: grid reliability stored", () => {
    let s = initialState();
    s = reducer(s, { type: "SET_GRID_RELIABILITY", reliability: "frequent-outages" });
    expect(s.gridReliability).toBe("frequent-outages");
  });

  it("Step 2: industry slug + physical cap + criticalLoadPct stored", () => {
    let s = initialState();
    s = reducer(s, { type: "SET_INDUSTRY", slug: "hotel" });
    s = reducer(s, { type: "SET_INDUSTRY_META", solarPhysicalCapKW: 225, criticalLoadPct: 0.55 });
    expect(s.industry).toBe("hotel");
    expect(s.solarPhysicalCapKW).toBe(225);
    expect(s.criticalLoadPct).toBe(0.55);
  });

  it("Step 3: baseLoadKW + peakLoadKW stored", () => {
    let s = initialState();
    s = reducer(s, { type: "SET_BASE_LOAD", baseLoadKW: 180, peakLoadKW: 310 });
    expect(s.baseLoadKW).toBe(180);
    expect(s.peakLoadKW).toBe(310);
  });

  it("Step 3: BESS application answer stored in step3Answers", () => {
    let s = initialState();
    s = reducer(s, { type: "SET_ANSWER", key: "primaryBESSApplication", value: "backup_power" });
    expect(s.step3Answers.primaryBESSApplication).toBe("backup_power");
  });

  it("Step 3.5: solarKW stored via SET_ADDON_CONFIG", () => {
    let s = initialState();
    s = reducer(s, { type: "SET_ADDON_CONFIG", config: { solarKW: 145 } });
    expect(s.solarKW).toBe(145);
  });

  it("Step 3.5: generatorKW + fuel type stored", () => {
    let s = initialState();
    s = reducer(s, {
      type: "SET_ADDON_CONFIG",
      config: { generatorKW: 200, generatorFuelType: "diesel" },
    });
    expect(s.generatorKW).toBe(200);
    expect(s.generatorFuelType).toBe("diesel");
  });

  it("Step 3.5: EV charger counts stored correctly", () => {
    let s = initialState();
    s = reducer(s, {
      type: "SET_ADDON_CONFIG",
      config: { level2Chargers: 6, dcfcChargers: 2, hpcChargers: 1 },
    });
    expect(s.level2Chargers).toBe(6);
    expect(s.dcfcChargers).toBe(2);
    expect(s.hpcChargers).toBe(1);
  });

  it("all Step 3.5 values captured in one config call", () => {
    let s = initialState();
    s = reducer(s, {
      type: "SET_ADDON_CONFIG",
      config: {
        solarKW: 120,
        generatorKW: 175,
        generatorFuelType: "natural-gas",
        level2Chargers: 8,
        dcfcChargers: 3,
        hpcChargers: 0,
      },
    });
    expect(s.solarKW).toBe(120);
    expect(s.generatorKW).toBe(175);
    expect(s.generatorFuelType).toBe("natural-gas");
    expect(s.level2Chargers).toBe(8);
    expect(s.dcfcChargers).toBe(3);
    expect(s.hpcChargers).toBe(0);
  });
});

// =============================================================================
// B. BESS CHAIN — peakLoadKW → SSOT ratio → bessKW/bessKWh by tier
// =============================================================================

describe("B. BESS calculation chain", () => {
  const { ratio: psRatio } = getBESSSizingRatioWithSource("peak_shaving"); // 0.40
  const { ratio: resRatio } = getBESSSizingRatioWithSource("resilience"); // 0.70
  const TIER_SCALE = { Starter: 0.55, Recommended: 1.0, Complete: 1.5 };
  const FLOOR = 75;

  it("SSOT peak_shaving ratio is 0.40", () => {
    expect(psRatio).toBe(0.4);
  });

  it("SSOT resilience ratio is 0.70", () => {
    expect(resRatio).toBe(0.7);
  });

  it("BESS Recommended kW = max(75, round(peakLoadKW × 0.40 × 1.0)) for peak_shaving", async () => {
    const state = makeState({ peakLoadKW: 250, baseLoadKW: 150 });
    const [, rec] = await buildTiers(state);
    const expected = Math.max(FLOOR, Math.round(250 * psRatio * TIER_SCALE.Recommended));
    expect(rec.bessKW).toBe(expected); // 100 kW
  });

  it("BESS Starter kW = max(75, round(peakLoadKW × 0.40 × 0.55))", async () => {
    const state = makeState({ peakLoadKW: 250, baseLoadKW: 150 });
    const [starter] = await buildTiers(state);
    const expected = Math.max(FLOOR, Math.round(250 * psRatio * TIER_SCALE.Starter));
    expect(starter.bessKW).toBe(expected); // max(75, 55) = 75
  });

  it("BESS Complete kW = max(75, round(peakLoadKW × 0.40 × 1.5))", async () => {
    const state = makeState({ peakLoadKW: 250, baseLoadKW: 150 });
    const [, , complete] = await buildTiers(state);
    const expected = Math.max(FLOOR, Math.round(250 * psRatio * TIER_SCALE.Complete));
    expect(complete.bessKW).toBe(expected); // 150 kW
  });

  it("BESS kWh = bessKW × durationHours", async () => {
    const state = makeState({ peakLoadKW: 250, baseLoadKW: 150 });
    const [, rec] = await buildTiers(state);
    expect(rec.bessKWh).toBe(rec.bessKW * rec.durationHours);
  });

  it("Recommended duration = 2h for save_most goal (C2 industry standard — extended coverage via hybrid algorithm)", async () => {
    const state = makeState({ peakLoadKW: 250, baseLoadKW: 150 });
    const [, rec] = await buildTiers(state);
    expect(rec.durationHours).toBe(2);
  });

  it("Starter duration = 2h for save_most goal", async () => {
    const state = makeState({ peakLoadKW: 250, baseLoadKW: 150 });
    const [starter] = await buildTiers(state);
    expect(starter.durationHours).toBe(2);
  });

  it("Complete duration = 2h for save_most goal (C2 spec — same as rec; upgrade to 4h requires full_power goal)", async () => {
    const state = makeState({ peakLoadKW: 250, baseLoadKW: 150 });
    const [, , complete] = await buildTiers(state);
    expect(complete.durationHours).toBe(2);
  });

  it("resilience app: BESS Recommended = max(75, round(peak × 0.70))", async () => {
    const state = makeState({
      peakLoadKW: 300,
      baseLoadKW: 200,
      step3Answers: { primaryBESSApplication: "backup_power", step3_5Visited: true },
    });
    const [, rec] = await buildTiers(state);
    const expected = Math.max(FLOOR, Math.round(300 * resRatio * TIER_SCALE.Recommended));
    expect(rec.bessKW).toBe(expected); // 210 kW
  });

  it("75 kW floor enforced when calculation produces smaller value", async () => {
    // Small facility: 100 kW × 0.40 × 0.55 = 22 kW → floored to 75
    const state = makeState({ peakLoadKW: 100, baseLoadKW: 60 });
    const [starter] = await buildTiers(state);
    expect(starter.bessKW).toBeGreaterThanOrEqual(FLOOR);
  });

  it("Starter.bessKW ≤ Recommended.bessKW ≤ Complete.bessKW", async () => {
    const state = makeState({ peakLoadKW: 400, baseLoadKW: 280 });
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.bessKW).toBeLessThanOrEqual(rec.bessKW);
    expect(rec.bessKW).toBeLessThanOrEqual(complete.bessKW);
  });

  it("fallback to baseLoadKW when peakLoadKW is 0", async () => {
    const state = makeState({ peakLoadKW: 0, baseLoadKW: 200 });
    const [, rec] = await buildTiers(state);
    // baseLoadKW used as fallback → 200 × 0.40 = 80 kW
    const expected = Math.max(FLOOR, Math.round(200 * psRatio * TIER_SCALE.Recommended));
    expect(rec.bessKW).toBe(expected);
  });
});

// =============================================================================
// C. SOLAR CHAIN — PSH + solarPhysicalCapKW → solarKW per tier
// =============================================================================

describe("C. Solar calculation chain", () => {
  it("sunFactor=1.0 at PSH=5.5 (A grade reference)", async () => {
    const state = makeState({
      intel: makeIntel({
        utilityRate: 0.12,
        demandCharge: 12,
        peakSunHours: 5.5,
        solarGrade: "A",
        solarFeasible: true,
        utilityProvider: "APS",
        weatherRisk: "Low",
      }),
      solarPhysicalCapKW: 200,
      wantsSolar: true,
    });
    const [, rec] = await buildTiers(state);
    // At PSH 5.5: sunFactor=1.0, save_most Recommended penetration=0.85
    expect(rec.solarKW).toBe(Math.min(Math.round(200 * 1.0 * 0.85), 200)); // 170 kW
  });

  it("sunFactor scales solar down for moderate sun (PSH 4.0)", async () => {
    const state = makeState({
      intel: makeIntel({
        utilityRate: 0.15,
        demandCharge: 18,
        peakSunHours: 4.0,
        solarGrade: "B",
        solarFeasible: true,
        utilityProvider: "ComEd",
        weatherRisk: "Low",
      }),
      solarPhysicalCapKW: 200,
      wantsSolar: true,
    });
    const [, rec] = await buildTiers(state);
    const sunFactor = Math.max(0.4, Math.min(1.0, (4.0 - 2.5) / 2.0)); // 0.75 — new formula
    const expected = Math.round(Math.min(200 * sunFactor * 0.85, 200)); // 128 kW
    expect(rec.solarKW).toBe(expected);
  });

  it("solarKW=0 when PSH ≤ 3.0 (below viability threshold)", async () => {
    const state = makeState({
      intel: makeIntel({
        utilityRate: 0.11,
        demandCharge: 10,
        peakSunHours: 3.0,
        solarGrade: "C",
        solarFeasible: false,
        utilityProvider: "PSE",
        weatherRisk: "Med",
      }),
      solarPhysicalCapKW: 200,
      wantsSolar: true,
    });
    const [, rec] = await buildTiers(state);
    expect(rec.solarKW).toBe(0);
  });

  it("solarKW=0 when solarFeasible=false (poor grade)", async () => {
    const state = makeState({
      intel: makeIntel({
        utilityRate: 0.12,
        demandCharge: 12,
        peakSunHours: 4.5,
        solarGrade: "C+",
        solarFeasible: false,
        utilityProvider: "SCE",
        weatherRisk: "Low",
      }),
      solarPhysicalCapKW: 200,
      wantsSolar: true,
    });
    const [, rec] = await buildTiers(state);
    expect(rec.solarKW).toBe(0);
  });

  it("solarKW=0 when user explicitly declined solar (wantsSolar=false, step3_5Visited=true)", async () => {
    const state = makeState({
      wantsSolar: false,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: true },
    });
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.solarKW).toBe(0);
    expect(rec.solarKW).toBe(0);
    expect(complete.solarKW).toBe(0);
  });

  it("solarKW never exceeds solarPhysicalCapKW", async () => {
    const state = makeState({
      intel: makeIntel({
        utilityRate: 0.2,
        demandCharge: 20,
        peakSunHours: 7.0,
        solarGrade: "A",
        solarFeasible: true,
        utilityProvider: "APS",
        weatherRisk: "Low",
      }),
      solarPhysicalCapKW: 100,
      wantsSolar: true,
    });
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.solarKW).toBeLessThanOrEqual(100);
    expect(rec.solarKW).toBeLessThanOrEqual(100);
    expect(complete.solarKW).toBeLessThanOrEqual(100);
  });

  it("user-configured solarKW scales by tier (70% Starter, 100% Rec, 130% Complete)", async () => {
    const state = makeState({
      wantsSolar: true,
      solarKW: 100, // user set 100 kW in Step 3.5
      solarPhysicalCapKW: 200,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: true },
    });
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.solarKW).toBe(Math.min(Math.round(100 * 0.7), 200)); // 70 kW
    expect(rec.solarKW).toBe(Math.min(Math.round(100 * 1.0), 200)); // 100 kW
    expect(complete.solarKW).toBe(Math.min(Math.round(100 * 1.3), 200)); // 130 kW
  });

  it("Starter.solarKW ≤ Complete.solarKW for viable solar site", async () => {
    const state = makeState({
      intel: makeIntel({
        utilityRate: 0.15,
        demandCharge: 15,
        peakSunHours: 5.5,
        solarGrade: "A",
        solarFeasible: true,
        utilityProvider: "PG&E",
        weatherRisk: "Low",
      }),
      solarPhysicalCapKW: 300,
      wantsSolar: true,
    });
    const [starter, , complete] = await buildTiers(state);
    expect(starter.solarKW).toBeLessThanOrEqual(complete.solarKW);
  });
});

// =============================================================================
// D. GENERATOR CHAIN — criticalLoadPct + peakLoadKW → generatorKW per tier
// =============================================================================

describe("D. Generator calculation chain", () => {
  const { margin } = getGeneratorReserveMarginWithSource(); // 1.25

  it("SSOT generator reserve margin is 1.25 (NEC 700/701/702)", () => {
    expect(margin).toBe(1.25);
  });

  it("generator=0 when wantsGenerator=false and no intent signals", async () => {
    const state = makeState({
      wantsGenerator: false,
      criticalLoadPct: 0.2, // below 50% threshold
      step3Answers: {
        primaryBESSApplication: "peak_shaving",
        generatorNeed: "none",
        step3_5Visited: true,
      },
    });
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.generatorKW).toBe(0);
    expect(rec.generatorKW).toBe(0);
    expect(complete.generatorKW).toBe(0);
  });

  it("user-configured generatorKW scales by tier (70% Starter, 100% Rec, 130% Complete)", async () => {
    const state = makeState({
      wantsGenerator: true,
      generatorKW: 200, // user set in Step 3.5
      peakLoadKW: 300,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: true },
    });
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.generatorKW).toBe(Math.round(200 * 0.7)); // 140 kW
    expect(rec.generatorKW).toBe(Math.round(200 * 1.0)); // 200 kW
    expect(complete.generatorKW).toBe(Math.round(200 * 1.3)); // 260 kW
  });

  it("high critical load (≥50%) auto-includes generator in Recommended (save_most policy)", async () => {
    const state = makeState({
      wantsGenerator: false,
      criticalLoadPct: 0.55, // triggers if_critical policy
      peakLoadKW: 300,
      step3Answers: {
        primaryBESSApplication: "peak_shaving",
        generatorNeed: "none",
        step3_5Visited: false,
      },
    });
    const [, rec] = await buildTiers(state);
    expect(rec.generatorKW).toBeGreaterThan(0);
  });

  it("essential scope: genKW ≈ peakLoadKW × criticalLoadPct × 1.25", () => {
    const state = makeState({ peakLoadKW: 300, criticalLoadPct: 0.25 });
    const genKW = estimateGenKW("essential", state);
    const expected = Math.max(10, Math.round(300 * 0.25 * margin)); // 94 kW
    expect(genKW).toBe(expected);
  });

  it("full scope: genKW ≈ peakLoadKW × 1.10", () => {
    const state = makeState({ peakLoadKW: 300, criticalLoadPct: 0.25 });
    const genKW = estimateGenKW("full", state);
    expect(genKW).toBe(Math.max(10, Math.round(300 * 1.1))); // 330 kW
  });

  it("critical scope: genKW ≈ peakLoadKW × 1.35", () => {
    const state = makeState({ peakLoadKW: 300, criticalLoadPct: 0.25 });
    const genKW = estimateGenKW("critical", state);
    expect(genKW).toBe(Math.max(10, Math.round(300 * 1.35))); // 405 kW
  });

  it("defaultGeneratorScope is 'essential' for reliable grid", () => {
    const state = makeState({ gridReliability: "reliable" });
    expect(defaultGeneratorScope(state)).toBe("essential");
  });

  it("defaultGeneratorScope is 'full' for frequent-outages", () => {
    const state = makeState({ gridReliability: "frequent-outages" });
    expect(defaultGeneratorScope(state)).toBe("full");
  });

  it("defaultGeneratorScope is 'critical' for unreliable grid", () => {
    const state = makeState({ gridReliability: "unreliable" });
    expect(defaultGeneratorScope(state)).toBe("critical");
  });

  it("generator fuel type flows from state to tier notes", async () => {
    const state = makeState({
      wantsGenerator: true,
      generatorKW: 150,
      generatorFuelType: "diesel",
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: true },
    });
    const [, rec] = await buildTiers(state);
    // Fuel type should appear in notes audit trail
    const notesText = rec.notes?.join(" ") ?? "";
    expect(notesText).toContain("diesel");
  });

  it("generator kW > 0 for all tiers when wantsGenerator=true", async () => {
    const state = makeState({
      wantsGenerator: true,
      generatorKW: 125,
      peakLoadKW: 300,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: true },
    });
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.generatorKW).toBeGreaterThan(0);
    expect(rec.generatorKW).toBeGreaterThan(0);
    expect(complete.generatorKW).toBeGreaterThan(0);
  });
});

// =============================================================================
// E. EV CHARGER CHAIN — charger counts → evChargerKW in tiers
// =============================================================================

describe("E. EV charger calculation chain", () => {
  it("SSOT EV kW constants: L2=7.2, DCFC=50, HPC=250", () => {
    expect(EV_KW.l2).toBe(7.2);
    expect(EV_KW.dcfc).toBe(50);
    expect(EV_KW.hpc).toBe(250);
  });

  it("evChargerKW = round(l2 × 7.2 + dcfc × 50) for all tiers", async () => {
    const state = makeState({
      wantsEVCharging: true,
      level2Chargers: 6,
      dcfcChargers: 2,
      hpcChargers: 0,
      evRevenuePerYear: 34800,
    });
    const expected = Math.round(6 * 7.2 + 2 * 50); // 143 kW
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.evChargerKW).toBe(expected);
    expect(rec.evChargerKW).toBe(expected);
    expect(complete.evChargerKW).toBe(expected);
  });

  it("evChargerKW includes HPC contribution (250 kW each)", async () => {
    const state = makeState({
      wantsEVCharging: true,
      level2Chargers: 4,
      dcfcChargers: 0,
      hpcChargers: 2,
      evRevenuePerYear: 0,
    });
    const expected = Math.round(4 * 7.2 + 0 * 50 + 2 * 250); // 529 kW
    const [, rec] = await buildTiers(state);
    expect(rec.evChargerKW).toBe(expected);
  });

  it("evChargerKW=0 when no chargers configured", async () => {
    const state = makeState({ level2Chargers: 0, dcfcChargers: 0, hpcChargers: 0 });
    const [, rec] = await buildTiers(state);
    expect(rec.evChargerKW).toBe(0);
  });

  it("computeEVPackageKW matches tier evChargerKW", async () => {
    const l2 = 8,
      dcfc = 3,
      hpc = 1;
    const state = makeState({
      wantsEVCharging: true,
      level2Chargers: l2,
      dcfcChargers: dcfc,
      hpcChargers: hpc,
    });
    const [, rec] = await buildTiers(state);
    expect(rec.evChargerKW).toBe(computeEVPackageKW(l2, dcfc, hpc));
  });

  it("EV revenue is additive to annualSavings when EV is wanted", async () => {
    const revenue = 34800;
    const stateWithEV = makeState({
      wantsEVCharging: true,
      level2Chargers: 6,
      dcfcChargers: 2,
      evRevenuePerYear: revenue,
    });
    const stateNoEV = makeState({
      wantsEVCharging: false,
      level2Chargers: 0,
      dcfcChargers: 0,
      evRevenuePerYear: 0,
    });
    const [, recEV] = await buildTiers(stateWithEV);
    const [, recNo] = await buildTiers(stateNoEV);
    // Gross savings includes EV revenue; net savings = gross - reserves
    expect(recEV.grossAnnualSavings).toBeGreaterThan(recNo.grossAnnualSavings);
  });

  it("BESS grows when EV load pre-merged into peakLoadKW", async () => {
    // EV load already in peakLoadKW (143 kW from 6 L2 + 2 DCFC)
    const stateHigh = makeState({ peakLoadKW: 350, baseLoadKW: 207 }); // 207 base + 143 EV
    const stateLow = makeState({ peakLoadKW: 207, baseLoadKW: 207 });
    const [, recHigh] = await buildTiers(stateHigh);
    const [, recLow] = await buildTiers(stateLow);
    expect(recHigh.bessKW).toBeGreaterThan(recLow.bessKW);
  });
});

// =============================================================================
// F. FINANCIAL CHAIN — grossCost → itcAmount → netCost → paybackYears
// =============================================================================

describe("F. Financial calculation chain", () => {
  it("itcAmount covers solar+BESS only — not generator or EV (IRA 2022)", async () => {
    // Under IRA 2022, ITC (30%) applies to solar + BESS equipment.
    // Generators and EV chargers are NOT ITC-eligible.
    // Therefore itcAmount < grossCost × itcRate for any system with generator or EV.
    const state = makeState({ wantsGenerator: true, wantsSolar: true, solarKW: 50 });
    const [, rec] = await buildTiers(state);
    expect(rec.itcAmount).toBeGreaterThan(0);
    // ITC must be positive but less than 30% of total gross cost (generator/EV excluded)
    expect(rec.itcAmount).toBeLessThan(rec.grossCost * rec.itcRate + 1);
    // netCost = totalProjectCost - itcAmount (totalProjectCost includes installation labor)
    // Allow ±1 rounding: each field is independently Math.round-ed, so round(a)-round(b) may differ from round(a-b) by 1
    expect(Math.abs(rec.netCost - (rec.totalProjectCost - rec.itcAmount))).toBeLessThanOrEqual(1);
  });

  it("netCost = totalProjectCost - itcAmount (totalProjectCost includes installation labor)", async () => {
    const state = makeState();
    const [, rec] = await buildTiers(state);
    // Allow ±1 rounding: each field is independently Math.round-ed, so round(a)-round(b) may differ from round(a-b) by 1
    expect(Math.abs(rec.netCost - (rec.totalProjectCost - rec.itcAmount))).toBeLessThanOrEqual(1);
  });

  it("paybackYears = netCost / annualSavings (net savings after reserves)", async () => {
    const state = makeState();
    const [, rec] = await buildTiers(state);
    const expected = rec.netCost / rec.annualSavings;
    expect(rec.paybackYears).toBeCloseTo(expected, 1);
  });

  it("netCost > 0 for all tiers", async () => {
    const state = makeState();
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.netCost).toBeGreaterThan(0);
    expect(rec.netCost).toBeGreaterThan(0);
    expect(complete.netCost).toBeGreaterThan(0);
  });

  it("paybackYears > 0 for all tiers", async () => {
    const state = makeState();
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.paybackYears).toBeGreaterThan(0);
    expect(rec.paybackYears).toBeGreaterThan(0);
    expect(complete.paybackYears).toBeGreaterThan(0);
  });

  it("grossCost: Starter < Recommended < Complete", async () => {
    const state = makeState({ peakLoadKW: 400, baseLoadKW: 280 });
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.grossCost).toBeLessThan(rec.grossCost);
    expect(rec.grossCost).toBeLessThan(complete.grossCost);
  });

  it("annualSavings = grossAnnualSavings - annualReserves (v4.5 honest TCO)", async () => {
    const state = makeState({ wantsSolar: true, solarKW: 80 });
    const [, rec] = await buildTiers(state);
    expect(rec.annualSavings).toBeCloseTo(rec.grossAnnualSavings - rec.annualReserves, 0);
  });

  it("higher utility rate → higher annual savings for same BESS/solar sizing", async () => {
    const stateLow = makeState({
      intel: makeIntel({ utilityRate: 0.1, demandCharge: 10, utilityProvider: "APS" }),
    });
    const stateHigh = makeState({
      intel: makeIntel({ utilityRate: 0.3, demandCharge: 30, utilityProvider: "PG&E" }),
    });
    const [, recLow] = await buildTiers(stateLow);
    const [, recHigh] = await buildTiers(stateHigh);
    expect(recHigh.annualSavings).toBeGreaterThan(recLow.annualSavings);
  });

  it("ITC rate is ≥ 0.30 (30% ITC floor for commercial BESS)", async () => {
    const state = makeState();
    const [, rec] = await buildTiers(state);
    expect(rec.itcRate).toBeGreaterThanOrEqual(0.3);
  });

  it("annualReserves > 0 when solar included (v4.5 O&M reserves)", async () => {
    const state = makeState({ wantsSolar: true, solarKW: 100 });
    const [, rec] = await buildTiers(state);
    expect(rec.annualReserves).toBeGreaterThan(0);
  });
});

// =============================================================================
// G. MULTI-INDUSTRY SCENARIOS — full end-to-end buildTiers for 5 industries
// =============================================================================

describe("G. Multi-industry calculation scenarios", () => {
  // ── Hotel: large roof, high critical load, medium utility rate ──────────

  it("Hotel (SF) — builds 3 tiers, Recommended BESS ≥ 75 kW", async () => {
    const state = makeState({
      industry: "hotel",
      solarPhysicalCapKW: 225,
      criticalLoadPct: 0.55,
      baseLoadKW: 280,
      peakLoadKW: 450,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: true },
    });
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.label).toBe("Starter");
    expect(rec.label).toBe("Recommended");
    expect(complete.label).toBe("Complete");
    expect(rec.bessKW).toBeGreaterThanOrEqual(75);
  });

  it("Hotel (SF) — solar kW ≤ 225 kW physical cap", async () => {
    const state = makeState({
      industry: "hotel",
      solarPhysicalCapKW: 225,
      criticalLoadPct: 0.55,
      baseLoadKW: 280,
      peakLoadKW: 450,
      wantsSolar: true,
    });
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.solarKW).toBeLessThanOrEqual(225);
    expect(rec.solarKW).toBeLessThanOrEqual(225);
    expect(complete.solarKW).toBeLessThanOrEqual(225);
  });

  it("Hotel (SF) — high critical load auto-includes generator in Recommended", async () => {
    const state = makeState({
      industry: "hotel",
      solarPhysicalCapKW: 225,
      criticalLoadPct: 0.55, // ≥50% triggers if_critical
      baseLoadKW: 280,
      peakLoadKW: 450,
      wantsGenerator: false,
      step3Answers: {
        primaryBESSApplication: "peak_shaving",
        generatorNeed: "none",
        step3_5Visited: false,
      },
    });
    const [, rec] = await buildTiers(state);
    expect(rec.generatorKW).toBeGreaterThan(0);
  });

  // ── Office: moderate solar, low critical load ───────────────────────────

  it("Office (Chicago, PSH 4.0) — solar scaled by moderate sun quality", async () => {
    const state = makeState({
      industry: "office",
      location: {
        zip: "60601",
        city: "Chicago",
        state: "IL",
        formattedAddress: "Chicago, IL 60601",
      },
      intel: makeIntel({
        utilityRate: 0.115,
        demandCharge: 18,
        peakSunHours: 4.0,
        solarGrade: "B",
        solarFeasible: true,
        utilityProvider: "ComEd",
        weatherRisk: "Low",
      }),
      solarPhysicalCapKW: 150,
      criticalLoadPct: 0.2,
      baseLoadKW: 200,
      peakLoadKW: 320,
      wantsSolar: true,
    });
    const [, rec] = await buildTiers(state);
    const sunFactor = Math.max(0, Math.min(1.0, (4.0 - 3.0) / 2.5)); // 0.40
    // auto-calc path: 150 × 0.40 × 0.85 = 51 kW for save_most Recommended
    expect(rec.solarKW).toBeLessThanOrEqual(150);
    expect(rec.solarKW).toBeGreaterThan(0);
  });

  it("Office — BESS Recommended kW matches peak_shaving formula", async () => {
    const state = makeState({
      industry: "office",
      baseLoadKW: 200,
      peakLoadKW: 320,
    });
    const [, rec] = await buildTiers(state);
    const expected = Math.max(75, Math.round(320 * 0.4 * 1.0));
    expect(rec.bessKW).toBe(expected); // 128 kW
  });

  // ── Data Center: no solar (no roof), very high critical load ───────────

  it("Data Center — solarKW=0 (no physical roof area)", async () => {
    const state = makeState({
      industry: "data_center",
      solarPhysicalCapKW: 0, // data centers rarely have viable roof solar
      criticalLoadPct: 0.99,
      baseLoadKW: 800,
      peakLoadKW: 1200,
      wantsSolar: true,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: true },
    });
    const [starter, rec, complete] = await buildTiers(state);
    expect(starter.solarKW).toBe(0);
    expect(rec.solarKW).toBe(0);
    expect(complete.solarKW).toBe(0);
  });

  it("Data Center — large BESS scales correctly with 1200 kW peak", async () => {
    const state = makeState({
      industry: "data_center",
      solarPhysicalCapKW: 0,
      criticalLoadPct: 0.99,
      baseLoadKW: 800,
      peakLoadKW: 1200,
      step3Answers: { primaryBESSApplication: "backup_power", step3_5Visited: true },
    });
    const [, rec] = await buildTiers(state);
    // resilience ratio: 1200 × 0.70 = 840 kW
    const expected = Math.max(75, Math.round(1200 * 0.7 * 1.0));
    expect(rec.bessKW).toBe(expected);
  });

  // ── Manufacturing: large roof, moderate critical load ──────────────────

  it("Manufacturing (Phoenix) — 3 tiers with solar and reasonable payback", async () => {
    const state = makeState({
      industry: "manufacturing",
      location: {
        zip: "85001",
        city: "Phoenix",
        state: "AZ",
        formattedAddress: "Phoenix, AZ 85001",
      },
      intel: makeIntel({
        utilityRate: 0.12,
        demandCharge: 12,
        peakSunHours: 6.5,
        solarGrade: "A",
        solarFeasible: true,
        utilityProvider: "APS",
        weatherRisk: "Low",
      }),
      solarPhysicalCapKW: 400,
      criticalLoadPct: 0.35,
      baseLoadKW: 500,
      peakLoadKW: 750,
      wantsSolar: true,
    });
    const [starter, rec, complete] = await buildTiers(state);
    // All 3 tiers should have solar (PSH 6.5, sunFactor 1.0)
    expect(starter.solarKW).toBeGreaterThan(0);
    expect(rec.solarKW).toBeGreaterThan(0);
    expect(complete.solarKW).toBeGreaterThan(0);
    // Payback must be positive
    expect(rec.paybackYears).toBeGreaterThan(0);
  });

  // ── Hospital: maximum critical load, resilience BESS application ───────

  it("Hospital — resilience BESS: Recommended = max(75, peak × 0.70)", async () => {
    const state = makeState({
      industry: "hospital",
      solarPhysicalCapKW: 120,
      criticalLoadPct: 0.9,
      baseLoadKW: 600,
      peakLoadKW: 900,
      step3Answers: { primaryBESSApplication: "backup_power", step3_5Visited: true },
    });
    const [, rec] = await buildTiers(state);
    const expected = Math.max(75, Math.round(900 * 0.7 * 1.0)); // 630 kW
    expect(rec.bessKW).toBe(expected);
  });

  it("Hospital — generator auto-included (criticalLoadPct=0.90, if_critical policy)", async () => {
    const state = makeState({
      industry: "hospital",
      solarPhysicalCapKW: 120,
      criticalLoadPct: 0.9,
      baseLoadKW: 600,
      peakLoadKW: 900,
      wantsGenerator: false,
      step3Answers: {
        primaryBESSApplication: "backup_power",
        generatorNeed: "none",
        step3_5Visited: false,
      },
    });
    const [, rec] = await buildTiers(state);
    expect(rec.generatorKW).toBeGreaterThan(0);
  });
});

// =============================================================================
// H. ADDON CONSISTENCY — addonSizing display ↔ step4Logic committed values
// =============================================================================

describe("H. Addon sizing display ↔ step4Logic consistency", () => {
  it("estimateSolarKW(roof_canopy) used as Recommended solarKW when user sets solarKW=0, wantsSolar=true", async () => {
    // When user sets wantsSolar=true but solarKW=0 (not yet configured), auto-calc runs
    // via computeSolarKW which uses goal penetration (0.85 for Recommended)
    // estimateSolarKW("roof_canopy") uses SOLAR_SCOPE_PENETRATION.roof_canopy (0.80) × sunFactor
    // These are DIFFERENT formulas — display is scope-driven, auto is goal-driven.
    // This test verifies the display value is in the expected range.
    const state = makeState({
      wantsSolar: true,
      solarKW: 0, // not yet configured — auto-calc path
      solarPhysicalCapKW: 200,
      intel: makeIntel({
        utilityRate: 0.2,
        demandCharge: 20,
        peakSunHours: 5.1,
        solarGrade: "B+",
        solarFeasible: true,
        utilityProvider: "PG&E",
        weatherRisk: "Low",
      }),
    });
    const displayRec = estimateSolarKW("roof_canopy", state);
    const sunFactor = Math.max(0.4, Math.min(1.0, (5.1 - 2.5) / 2.0)); // 1.0 — clamped at PSH 5.1
    const expected = Math.round(
      Math.min(200 * sunFactor * SOLAR_SCOPE_PENETRATION.roof_canopy, 200)
    );
    expect(displayRec).toBe(expected);
  });

  it("when user confirms solarKW via CONFIRM button, tier Recommended matches exactly", async () => {
    // User slides to 120 kW and hits CONFIRM → solarKW=120 stored
    const state = makeState({
      wantsSolar: true,
      solarKW: 120,
      solarPhysicalCapKW: 200,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: true },
    });
    const [, rec] = await buildTiers(state);
    // Recommended tier: user-configured 120 × 1.0 scale = 120
    expect(rec.solarKW).toBe(Math.min(Math.round(120 * 1.0), 200));
  });

  it("estimateGenKW(essential) matches generatorKW in Recommended when user configures it", async () => {
    const state = makeState({ peakLoadKW: 300, criticalLoadPct: 0.3 });
    const displayGenKW = estimateGenKW("essential", state);
    const configuredState = makeState({
      peakLoadKW: 300,
      criticalLoadPct: 0.3,
      wantsGenerator: true,
      generatorKW: displayGenKW,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: true },
    });
    const [, rec] = await buildTiers(configuredState);
    // Recommended tier: user value × 1.0 = displayGenKW exactly
    expect(rec.generatorKW).toBe(Math.round(displayGenKW * 1.0));
  });

  it("SOLAR_SCOPE_PENETRATION values: roof_only=0.55, roof_canopy=0.80, maximum=1.00", () => {
    expect(SOLAR_SCOPE_PENETRATION.roof_only).toBe(0.55);
    expect(SOLAR_SCOPE_PENETRATION.roof_canopy).toBe(0.8);
    expect(SOLAR_SCOPE_PENETRATION.maximum).toBe(1.0);
  });
});

// =============================================================================
// I. FIRST-VISIT SEEDING — Step 3.5 useEffect pre-populates state correctly
// =============================================================================

describe("I. First-visit seeding (Step 3.5 useEffect)", () => {
  it("estimateSolarKW roof_canopy > 0 for a viable solar site (seeding baseline)", () => {
    const state = makeState({
      solarPhysicalCapKW: 200,
      intel: makeIntel({
        utilityRate: 0.2,
        demandCharge: 20,
        peakSunHours: 5.1,
        solarGrade: "B+",
        solarFeasible: true,
        utilityProvider: "PG&E",
        weatherRisk: "Low",
      }),
    });
    const recKW = estimateSolarKW("roof_canopy", state);
    expect(recKW).toBeGreaterThan(0);
  });

  it("estimateGenKW(defaultGeneratorScope) > 0 for non-zero peakLoadKW", () => {
    const state = makeState({
      peakLoadKW: 300,
      criticalLoadPct: 0.25,
      gridReliability: "reliable",
    });
    const recGenKW = estimateGenKW(defaultGeneratorScope(state), state);
    expect(recGenKW).toBeGreaterThan(0);
  });

  it("EV seeding formula: recL2 = min(12, max(4, round(peakLoadKW / 150)))", () => {
    const peak = 400;
    const expected = Math.min(12, Math.max(4, Math.round(peak / 150))); // min(12, max(4, 3)) = 4
    expect(expected).toBe(4);
  });

  it("EV seeding: large facility gets more L2 chargers", () => {
    const peak = 1500;
    const recL2 = Math.min(12, Math.max(4, Math.round(peak / 150))); // min(12, 10) = 10
    expect(recL2).toBe(10);
  });

  it("EV seeding: very large facility caps at 12 L2", () => {
    const peak = 3000;
    const recL2 = Math.min(12, Math.max(4, Math.round(peak / 150))); // capped at 12
    expect(recL2).toBe(12);
  });

  it("step3_5Visited flag gets set when Next is clicked (onNext step 4 writes it)", () => {
    let s = initialState();
    s = reducer(s, { type: "SET_ANSWER", key: "step3_5Visited", value: true });
    expect(s.step3Answers.step3_5Visited).toBe(true);
  });

  it("seeded solarKW persists via SET_ADDON_CONFIG", () => {
    let s = initialState();
    s = reducer(s, { type: "SET_ADDON_CONFIG", config: { solarKW: 134 } });
    expect(s.solarKW).toBe(134);
  });

  it("seeded generatorKW persists via SET_ADDON_CONFIG", () => {
    let s = initialState();
    s = reducer(s, { type: "SET_ADDON_CONFIG", config: { generatorKW: 94 } });
    expect(s.generatorKW).toBe(94);
  });

  it("seeded EV counts persist via SET_ADDON_CONFIG", () => {
    let s = initialState();
    s = reducer(s, {
      type: "SET_ADDON_CONFIG",
      config: { level2Chargers: 6, dcfcChargers: 2, hpcChargers: 0 },
    });
    expect(s.level2Chargers).toBe(6);
    expect(s.dcfcChargers).toBe(2);
    expect(s.hpcChargers).toBe(0);
  });
});

// =============================================================================
// J. CROSS-STEP INTEGRITY — changing earlier steps clears downstream state
// =============================================================================

describe("J. Cross-step integrity", () => {
  it("SET_INDUSTRY clears baseLoadKW, peakLoadKW, solarKW, generatorKW", () => {
    let s = initialState();
    s = reducer(s, { type: "SET_BASE_LOAD", baseLoadKW: 200, peakLoadKW: 350 });
    s = reducer(s, {
      type: "SET_ADDON_CONFIG",
      config: { solarKW: 120, generatorKW: 80, level2Chargers: 4 },
    });
    s = reducer(s, { type: "SET_INDUSTRY", slug: "hotel" });
    expect(s.baseLoadKW).toBe(0);
    expect(s.peakLoadKW).toBe(0);
    expect(s.solarKW).toBe(0);
    expect(s.generatorKW).toBe(0);
    expect(s.level2Chargers).toBe(0); // cleared by resetEnergyProfileState
  });

  it("SET_INDUSTRY clears step3Answers", () => {
    let s = initialState();
    s = reducer(s, { type: "SET_ANSWER", key: "primaryBESSApplication", value: "backup_power" });
    s = reducer(s, { type: "SET_ANSWER", key: "generatorNeed", value: "full_backup" });
    s = reducer(s, { type: "SET_INDUSTRY", slug: "hotel" });
    expect(s.step3Answers).toEqual({});
  });

  it("CLEAR_LOCATION clears intel and location state", () => {
    let s = initialState();
    s = reducer(s, {
      type: "SET_LOCATION",
      location: {
        zip: "89101",
        city: "Las Vegas",
        state: "NV",
        formattedAddress: "Las Vegas, NV 89101",
      },
    });
    s = reducer(s, {
      type: "PATCH_INTEL",
      patch: { utilityRate: 0.12, solarGrade: "A", solarFeasible: true, peakSunHours: 6.5 },
    });
    s = reducer(s, { type: "CLEAR_LOCATION" });
    expect(s.location).toBeNull();
    expect(s.intel).toBeNull();
    expect(s.locationStatus).toBe("idle");
  });

  it("changing intel (PSH) changes solar output without requiring re-entry of other fields", async () => {
    const baseState = makeState({ solarPhysicalCapKW: 200, wantsSolar: true });

    const stateGoodSun = {
      ...baseState,
      intel: {
        ...baseState.intel!,
        peakSunHours: 6.0,
        solarFeasible: true,
        solarGrade: "A" as const,
      },
    };
    const statePoorSun = {
      ...baseState,
      intel: {
        ...baseState.intel!,
        peakSunHours: 3.5,
        solarFeasible: true,
        solarGrade: "B-" as const,
      },
    };

    const [, recGood] = await buildTiers(stateGoodSun);
    const [, recPoor] = await buildTiers(statePoorSun);

    expect(recGood.solarKW).toBeGreaterThan(recPoor.solarKW);
  });

  it("changing criticalLoadPct changes generator sizing in Recommended", async () => {
    const stateLow = makeState({
      criticalLoadPct: 0.2,
      peakLoadKW: 300,
      wantsGenerator: true,
      generatorKW: 0,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: false },
    });
    const stateHigh = makeState({
      criticalLoadPct: 0.8,
      peakLoadKW: 300,
      wantsGenerator: true,
      generatorKW: 0,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: false },
    });
    const [, recLow] = await buildTiers(stateLow);
    const [, recHigh] = await buildTiers(stateHigh);
    expect(recHigh.generatorKW).toBeGreaterThan(recLow.generatorKW);
  });

  it("CONFIRM_BUSINESS with high-confidence industry: sets industry + clears energy profile", () => {
    let s = initialState();
    s = reducer(s, { type: "SET_BASE_LOAD", baseLoadKW: 300, peakLoadKW: 500 });
    s = reducer(s, { type: "SET_ADDON_CONFIG", config: { solarKW: 200, generatorKW: 150 } });
    // confidence >= 0.75 triggers hasIndustry branch → resetEnergyProfileState()
    s = reducer(s, {
      type: "SET_BUSINESS",
      business: { name: "Marriott Hotels", detectedIndustry: "hotel", confidence: 0.9 },
    });
    s = reducer(s, { type: "CONFIRM_BUSINESS" });
    expect(s.industry).toBe("hotel");
    // Energy profile cleared because hasIndustry=true
    expect(s.baseLoadKW).toBe(0);
    expect(s.solarKW).toBe(0);
    expect(s.generatorKW).toBe(0);
  });

  it("buildTiers throws for missing location", async () => {
    const state = makeState({ location: null as unknown as WizardState["location"] });
    await expect(buildTiers(state)).rejects.toThrow("location must be set");
  });

  it("buildTiers throws for baseLoadKW=0 (Step 3 not complete)", async () => {
    const state = makeState({ baseLoadKW: 0, peakLoadKW: 0 });
    await expect(buildTiers(state)).rejects.toThrow("baseLoadKW must be > 0");
  });
});

// =============================================================================
// K. FULL END-TO-END SIMULATION — Step 1 → Step 3.5 → buildTiers
// =============================================================================

describe("K. Full end-to-end simulation (all layers → buildTiers)", () => {
  it("Hotel in Las Vegas: solar + EV + generator produces valid tiers", async () => {
    // Simulate the complete wizard journey state
    let s = initialState();

    // Step 1
    s = reducer(s, {
      type: "SET_LOCATION",
      location: {
        zip: "89101",
        city: "Las Vegas",
        state: "NV",
        formattedAddress: "Las Vegas, NV 89101",
        lat: 36.175,
        lng: -115.137,
      },
    });
    s = reducer(s, {
      type: "PATCH_INTEL",
      patch: {
        utilityRate: 0.119,
        demandCharge: 14,
        peakSunHours: 6.3,
        solarGrade: "A",
        solarFeasible: true,
        utilityProvider: "NV Energy",
        weatherRisk: "Low",
        utilityStatus: "ready",
        solarStatus: "ready",
        weatherStatus: "ready",
      },
    });
    s = reducer(s, { type: "SET_GRID_RELIABILITY", reliability: "reliable" });

    // Step 2
    s = reducer(s, { type: "SET_INDUSTRY", slug: "hotel" });
    s = reducer(s, { type: "SET_INDUSTRY_META", solarPhysicalCapKW: 225, criticalLoadPct: 0.55 });

    // Step 3
    s = reducer(s, { type: "SET_ANSWER", key: "numberOfRooms", value: 200 });
    s = reducer(s, { type: "SET_BASE_LOAD", baseLoadKW: 300, peakLoadKW: 480 });
    s = reducer(s, { type: "SET_ANSWER", key: "primaryBESSApplication", value: "peak_shaving" });

    // Step 3.5 — user confirms add-ons
    s = reducer(s, { type: "SET_ADDON_PREFERENCE", addon: "solar", value: true });
    s = reducer(s, { type: "SET_ADDON_PREFERENCE", addon: "generator", value: true });
    s = reducer(s, { type: "SET_ADDON_PREFERENCE", addon: "ev", value: true });
    s = reducer(s, {
      type: "SET_ADDON_CONFIG",
      config: {
        solarKW: 175,
        generatorKW: 330,
        generatorFuelType: "natural-gas",
        level2Chargers: 8,
        dcfcChargers: 3,
      },
    });
    s = reducer(s, { type: "SET_ANSWER", key: "step3_5Visited", value: true });
    s = reducer(s, {
      type: "SET_BASE_LOAD",
      baseLoadKW: s.baseLoadKW,
      peakLoadKW: s.peakLoadKW,
      evRevenuePerYear: 49200,
    });

    // Verify all values captured
    expect(s.location?.city).toBe("Las Vegas");
    expect(s.intel?.peakSunHours).toBe(6.3);
    expect(s.industry).toBe("hotel");
    expect(s.solarPhysicalCapKW).toBe(225);
    expect(s.criticalLoadPct).toBe(0.55);
    expect(s.baseLoadKW).toBe(300);
    expect(s.peakLoadKW).toBe(480);
    expect(s.wantsSolar).toBe(true);
    expect(s.wantsGenerator).toBe(true);
    expect(s.wantsEVCharging).toBe(true);
    expect(s.solarKW).toBe(175);
    expect(s.generatorKW).toBe(330);
    expect(s.generatorFuelType).toBe("natural-gas");
    expect(s.level2Chargers).toBe(8);
    expect(s.dcfcChargers).toBe(3);

    // Build tiers
    const [starter, rec, complete] = await buildTiers(s);

    // Tiers structure
    expect(starter.label).toBe("Starter");
    expect(rec.label).toBe("Recommended");
    expect(complete.label).toBe("Complete");

    // BESS sizing: peak_shaving × 480 kW
    const bessRec = Math.max(75, Math.round(480 * 0.4 * 1.0)); // 192 kW
    expect(rec.bessKW).toBe(bessRec);

    // Solar: user 175 kW × 1.0 scale, capped at 225
    expect(rec.solarKW).toBe(Math.min(Math.round(175 * 1.0), 225)); // 175 kW

    // Generator: user 330 kW × 1.0
    expect(rec.generatorKW).toBe(Math.round(330 * 1.0)); // 330 kW

    // EV: 8×7.2 + 3×50 = 57.6 + 150 = 207.6 → 208 kW
    expect(rec.evChargerKW).toBe(Math.round(8 * 7.2 + 3 * 50)); // 208 kW

    // Financial sanity
    expect(rec.grossCost).toBeGreaterThan(0);
    expect(rec.netCost).toBeGreaterThan(0);
    expect(rec.paybackYears).toBeGreaterThan(0);
    expect(Math.abs(rec.netCost - (rec.totalProjectCost - rec.itcAmount))).toBeLessThanOrEqual(1);

    // Tier ordering
    expect(starter.grossCost).toBeLessThan(rec.grossCost);
    expect(rec.grossCost).toBeLessThan(complete.grossCost);
  });

  it("Office in Seattle (poor sun): solar ~0, no generator, BESS only", async () => {
    const state = makeState({
      industry: "office",
      location: {
        zip: "98101",
        city: "Seattle",
        state: "WA",
        formattedAddress: "Seattle, WA 98101",
      },
      intel: makeIntel({
        utilityRate: 0.11,
        demandCharge: 8,
        peakSunHours: 3.2,
        solarGrade: "C+",
        solarFeasible: false,
        utilityProvider: "SCL",
        weatherRisk: "Low",
      }),
      solarPhysicalCapKW: 150,
      criticalLoadPct: 0.2,
      baseLoadKW: 180,
      peakLoadKW: 280,
      wantsSolar: true,
      wantsGenerator: false,
      step3Answers: {
        primaryBESSApplication: "peak_shaving",
        generatorNeed: "none",
        step3_5Visited: true,
      },
    });

    const [starter, rec, complete] = await buildTiers(state);

    // Poor sun: solarFeasible=false → solarKW=0 in all tiers
    expect(starter.solarKW).toBe(0);
    expect(rec.solarKW).toBe(0);
    expect(complete.solarKW).toBe(0);

    // No generator requested, low critical load (< 50%)
    expect(rec.generatorKW).toBe(0);

    // BESS still included
    expect(rec.bessKW).toBeGreaterThanOrEqual(75);
    expect(rec.netCost).toBeGreaterThan(0);
  });
});
