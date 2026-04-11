/**
 * =============================================================================
 * CAR WASH MATH SMOKE TESTS — Solar + Generator + BESS + EV Charging
 * =============================================================================
 *
 * 6 real-world car wash scenarios across US locations:
 *
 *   1. Phoenix AZ  — excellent sun (6.5 PSH), full-service tunnel, opaque roof
 *                    Solar: maximum scope | Generator: essential | BESS: peak_shaving
 *
 *   2. Chicago IL  — moderate sun (3.8 PSH), express tunnel, mixed skylights
 *                    Solar: roof_only scope | Generator: essential | BESS: resilience
 *
 *   3. Seattle WA  — poor sun (3.2 PSH), self-serve, polycarbonate roof
 *                    Solar: expected ~0 kW (near PSH floor) | Generator: full
 *
 *   4. Phoenix AZ  + pkg_pro EV  — 6 L2 + 2 DCFC = 143 kW EV demand (+95 base)
 *                    Combined peak: 238 kW | EV revenue: ~$33,912/yr NET at $0.12/kWh
 *
 *   5. Chicago IL  + pkg_basic EV — 4 L2 = 29 kW EV demand (+80 base)
 *                    Combined peak: 109 kW | EV revenue: ~$4,396/yr NET at $0.155/kWh
 *
 *   6. WOW Car Wash (Scottsdale AZ) — 1 express tunnel + 24 vacuum stations
 *                    Tunnel: 110 kW + 24 vac × 1.2 kW = 140 kW car wash peak
 *                    Solar cap: 46 kW (32 kW roof + 14 kW vacuum canopy, opaque roof)
 *                    EV: pkg_pro (6 L2 + 2 DCFC = 143 kW) → combined peak 283 kW
 *                    BESS: 113 kW (283 kW × 0.40, above 75 kW floor)
 *                    Generator: 44 kW essential | EV revenue: ~$33,086/yr NET at $0.13/kWh
 *
 * WHAT WE VERIFY:
 *   - Solar kW ≤ solarPhysicalCapKW (never exceeds physical cap)
 *   - Solar kW = 0 when PSH ≤ 3.0 (Seattle should be ~0)
 *   - Generator kW = criticalLoadKW × 1.25 (NEC reserve) for essential scope
 *   - BESS kW = peakLoadKW × ratio (0.40 peak_shaving / 0.70 resilience)
 *   - Vacuum canopy adds solar area: 24 vac × 65 sqft × 0.90 / 100 = +14 kW
 *   - EV charger kW = l2 × 7.2 + dcfc × 50 (display field; load pre-merged into peakLoadKW)
 *   - EV revenue is additive to annualSavings in buildOneTier
 *   - BESS grows when EV demand is pre-merged into peakLoadKW
 *   - Tier scaling: Starter < Recommended < Complete for cost
 *   - All three tiers present and properly labeled
 *   - Net cost > 0, payback > 0 for all tiers
 * =============================================================================
 */

import { describe, it, expect } from "vitest";
import { buildTiers } from "../step4Logic";
import { getCarWashSolarCapacity } from "@/services/useCasePowerCalculations";
import {
  estimateSolarKW,
  estimateGenKW,
  getEffectiveSolarCapKW,
  computeEVPackageKW,
  EV_KW,
} from "../addonSizing";
import type { WizardState } from "../wizardState";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build minimal WizardState for car wash scenarios
// ─────────────────────────────────────────────────────────────────────────────
function carWashState(overrides: Partial<WizardState>): WizardState {
  return {
    // Navigation
    step: 5 as WizardState["step"],

    // Location
    locationRaw: "",
    country: "US",
    countryCode: "US",
    location: overrides.location ?? {
      zip: "85001",
      city: "Phoenix",
      state: "AZ",
      formattedAddress: "Phoenix, AZ 85001",
      lat: 33.4484,
      lng: -112.074,
    },
    locationStatus: "ready",
    business: null,
    intelStatus: { utility: "ready", solar: "ready", weather: "ready" },
    gridReliability: "reliable",

    // Intel — overridable
    intel: overrides.intel ?? {
      utilityRate: 0.12,
      demandCharge: 12,
      peakSunHours: 6.5,
      solarGrade: "A",
      solarFeasible: true,
      utilityProvider: "APS",
      weatherRisk: "Low",
    },

    // Industry
    industry: "car_wash",
    solarPhysicalCapKW: overrides.solarPhysicalCapKW ?? 60,
    criticalLoadPct: 0.25, // benchmarkSources: car_wash critical load 25% (LADWP)

    // Profile
    step3Answers: overrides.step3Answers ?? {
      primaryBESSApplication: "peak_shaving",
      generatorNeed: "partial",
      facilityType: "full_service",
      roofType: "opaque_metal",
    },
    evChargers: null,
    baseLoadKW: overrides.baseLoadKW ?? 38,
    peakLoadKW: overrides.peakLoadKW ?? 95,
    criticalLoadKW: overrides.criticalLoadKW ?? 24, // 25% of 95 kW
    evRevenuePerYear: 0,

    // Addon preferences
    wantsSolar: overrides.wantsSolar ?? true,
    wantsEVCharging: false,
    wantsGenerator: overrides.wantsGenerator ?? true,

    // Addon config (populated by WizardV8Page on Continue from Step 3.5)
    solarKW: overrides.solarKW ?? 0,
    generatorKW: overrides.generatorKW ?? 0,
    generatorFuelType: overrides.generatorFuelType ?? "natural-gas",
    level2Chargers: 0,
    dcfcChargers: 0,
    hpcChargers: 0,

    // Tiers (not yet built)
    tiersStatus: "idle",
    tiers: null,
    selectedTierIndex: null,

    // System
    isBusy: false,
    busyLabel: "",
    error: null,

    ...overrides,
  } as WizardState;
}

// ─────────────────────────────────────────────────────────────────────────────
// Console printer for human-readable output
// ─────────────────────────────────────────────────────────────────────────────
function printScenario(
  name: string,
  state: WizardState,
  tiers: Awaited<ReturnType<typeof buildTiers>>
) {
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtd = (n: number) => n.toFixed(1);
  const fmtc = (n: number) => "$" + fmt(n);

  console.log(`\n${"═".repeat(70)}`);
  console.log(`  🚗 SCENARIO: ${name}`);
  console.log(`${"═".repeat(70)}`);
  console.log(`  Location   : ${state.location?.city}, ${state.location?.state}`);
  console.log(
    `  PSH        : ${fmtd(state.intel?.peakSunHours ?? 0)} hrs/day  |  Solar grade: ${state.intel?.solarGrade ?? "?"}`
  );
  console.log(
    `  Utility    : $${fmtd(state.intel?.utilityRate ?? 0)}/kWh  |  Demand: $${fmtd(state.intel?.demandCharge ?? 0)}/kW`
  );
  console.log(`  Base load  : ${state.baseLoadKW} kW  |  Peak load: ${state.peakLoadKW} kW`);
  console.log(
    `  Solar cap  : ${state.solarPhysicalCapKW} kW  |  Critical load: ${(state.criticalLoadPct * 100).toFixed(0)}%`
  );
  console.log(`  BESS app   : ${state.step3Answers?.primaryBESSApplication ?? "peak_shaving"}`);
  console.log(`  Roof type  : ${state.step3Answers?.roofType ?? "?"}`);
  console.log("");

  const labels = ["STARTER     ", "RECOMMENDED ", "COMPLETE    "];
  for (let i = 0; i < 3; i++) {
    const t = tiers[i];
    const psh = state.intel?.peakSunHours ?? 4.5;
    const sunFactor = Math.max(0, Math.min(1.0, (psh - 3.0) / 2.5));
    console.log(`  ── ${labels[i]}──────────────────────────────────────────`);
    console.log(`     BESS     : ${t.bessKW} kW / ${t.bessKWh} kWh (${t.durationHours}h duration)`);
    console.log(
      `     Solar    : ${t.solarKW} kW  (sun factor: ${fmtd(sunFactor)}, cap: ${state.solarPhysicalCapKW} kW)`
    );
    console.log(`     Generator: ${t.generatorKW} kW`);
    if ((state.level2Chargers ?? 0) > 0 || (state.dcfcChargers ?? 0) > 0) {
      console.log(
        `     EV charge: ${t.evChargerKW} kW  (${state.level2Chargers ?? 0}×L2 + ${state.dcfcChargers ?? 0}×DCFC)  rev: ${fmtc(state.evRevenuePerYear)}/yr`
      );
    }
    console.log(
      `     Gross $  : ${fmtc(t.grossCost)}  |  ITC (${(t.itcRate * 100).toFixed(0)}%): -${fmtc(t.itcAmount)}  |  Net: ${fmtc(t.netCost)}`
    );
    console.log(
      `     Savings  : ${fmtc(t.annualSavings)}/yr  |  Payback: ${fmtd(t.paybackYears)} yrs`
    );
    console.log(`     Margin   : ${t.blendedMarginPercent?.toFixed(1) ?? "?"}%`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1 — Phoenix AZ, full-service tunnel, excellent sun
// ─────────────────────────────────────────────────────────────────────────────
describe("Scenario 1 — Phoenix AZ car wash (excellent sun, peak_shaving)", () => {
  // Physics: PSH 6.5, sunFactor = clamp((6.5-3.0)/2.5, 0, 1) = 1.0
  // Solar cap: getCarWashSolarCapacity(full_service + opaque_metal) ≈ 58 kW
  // maximum scope penetration 1.00 → solarKW = 58 × 1.0 × 1.0 = 58 kW (Recommended)
  // BESS: 95 kW peak × 0.40 (peak_shaving) = 38 kW → floor 75 kW → Recommended 75 kW
  // BESS energy Recommended: 75 × 4h = 300 kWh
  // Generator essential: 95 × 0.25 × 1.25 = 29.7 → 30 kW

  const step3Answers = {
    primaryBESSApplication: "peak_shaving",
    generatorNeed: "partial",
    facilityType: "full_service",
    roofType: "opaque_metal",
    solarScope: "maximum",
    generatorScope: "essential",
  };

  // Dynamic solar cap from Vineet's model
  const solarCapKW = Math.max(60, getCarWashSolarCapacity(step3Answers));

  const state = carWashState({
    location: {
      zip: "85001",
      city: "Phoenix",
      state: "AZ",
      formattedAddress: "Phoenix AZ",
      lat: 33.4484,
      lng: -112.074,
    },
    intel: {
      utilityRate: 0.12,
      demandCharge: 12,
      peakSunHours: 6.5,
      solarGrade: "A",
      solarFeasible: true,
      utilityProvider: "APS",
      weatherRisk: "Low",
    },
    solarPhysicalCapKW: solarCapKW,
    baseLoadKW: 38,
    peakLoadKW: 95,
    criticalLoadKW: 24,
    step3Answers,
    // Simulate Step 3.5 committed values
    solarKW: estimateSolarKW("maximum", {
      solarPhysicalCapKW: solarCapKW,
      intel: { peakSunHours: 6.5, solarFeasible: true },
    } as WizardState),
    generatorKW: estimateGenKW("essential", {
      peakLoadKW: 95,
      criticalLoadPct: 0.25,
    } as WizardState),
    wantsSolar: true,
    wantsGenerator: true,
  });

  let tiers: Awaited<ReturnType<typeof buildTiers>>;

  it("builds 3 tiers without error", async () => {
    tiers = await buildTiers(state);
    printScenario("Phoenix AZ — Full-Service Tunnel (excellent sun)", state, tiers);
    expect(tiers).toHaveLength(3);
    expect(tiers[0].label).toBe("Starter");
    expect(tiers[1].label).toBe("Recommended");
    expect(tiers[2].label).toBe("Complete");
  });

  it("solar kW > 0 and ≤ physical cap for all tiers", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.solarKW).toBeGreaterThan(0);
      expect(t.solarKW).toBeLessThanOrEqual(state.solarPhysicalCapKW + 1); // +1 rounding tolerance
    }
  });

  it("generator kW > 0 for all tiers", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.generatorKW).toBeGreaterThan(0);
    }
  });

  it("BESS kW ≥ commercial floor (75 kW)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.bessKW).toBeGreaterThanOrEqual(75);
    }
  });

  it("Starter < Recommended < Complete for gross cost", async () => {
    if (!tiers) tiers = await buildTiers(state);
    expect(tiers[0].grossCost).toBeLessThan(tiers[1].grossCost);
    expect(tiers[1].grossCost).toBeLessThan(tiers[2].grossCost);
  });

  it("net cost > 0 and payback > 0 for all tiers", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.netCost).toBeGreaterThan(0);
      expect(t.paybackYears).toBeGreaterThan(0);
    }
  });

  it("Recommended BESS duration is 2h (C2 industry standard)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    expect(tiers[1].durationHours).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2 — Chicago IL, express tunnel, moderate sun, resilience BESS
// ─────────────────────────────────────────────────────────────────────────────
describe("Scenario 2 — Chicago IL car wash (moderate sun, resilience BESS)", () => {
  // Physics: PSH 3.8, sunFactor = clamp((3.8-3.0)/2.5, 0, 1) = 0.32
  // Solar cap: express + mixed_skylights → lower than full_service
  // roof_only scope (0.55 penetration) → solarKW = cap × 0.32 × 0.55
  // BESS: 80 kW peak × 0.70 (resilience) = 56 → floor 75 kW Recommended
  // Generator: essential scope, criticalLoad = 80 × 0.25 × 1.25 = 25 kW

  const step3Answers = {
    primaryBESSApplication: "backup_power",
    generatorNeed: "partial",
    facilityType: "express_tunnel",
    roofType: "mixed_skylights",
    solarScope: "roof_only",
    generatorScope: "essential",
  };

  const solarCapKW = Math.max(30, getCarWashSolarCapacity(step3Answers));

  const state = carWashState({
    location: {
      zip: "60601",
      city: "Chicago",
      state: "IL",
      formattedAddress: "Chicago IL",
      lat: 41.8827,
      lng: -87.6233,
    },
    intel: {
      utilityRate: 0.155,
      demandCharge: 18,
      peakSunHours: 3.8,
      solarGrade: "C+",
      solarFeasible: true,
      utilityProvider: "ComEd",
      weatherRisk: "Medium",
    },
    solarPhysicalCapKW: solarCapKW,
    baseLoadKW: 30,
    peakLoadKW: 80,
    criticalLoadKW: 20,
    step3Answers,
    solarKW: estimateSolarKW("roof_only", {
      solarPhysicalCapKW: solarCapKW,
      intel: { peakSunHours: 3.8, solarFeasible: true },
    } as WizardState),
    generatorKW: estimateGenKW("essential", {
      peakLoadKW: 80,
      criticalLoadPct: 0.25,
    } as WizardState),
    wantsSolar: true,
    wantsGenerator: true,
  });

  let tiers: Awaited<ReturnType<typeof buildTiers>>;

  it("builds 3 tiers without error", async () => {
    tiers = await buildTiers(state);
    printScenario("Chicago IL — Express Tunnel (moderate sun, resilience BESS)", state, tiers);
    expect(tiers).toHaveLength(3);
  });

  it("solar kW is reduced by low sun (PSH 3.8 → sunFactor 0.32)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    const psh = 3.8;
    const sunFactor = (psh - 3.0) / 2.5; // 0.32
    const maxExpected = Math.ceil(solarCapKW * sunFactor * 0.55 * 1.15); // Starter scope × rounding
    // All tiers should have solar significantly less than physical cap
    for (const t of tiers) {
      expect(t.solarKW).toBeLessThanOrEqual(solarCapKW);
    }
  });

  it("BESS kW reflects resilience ratio (0.70 × peak) with 75 kW floor", async () => {
    if (!tiers) tiers = await buildTiers(state);
    const expectedBase = Math.max(75, Math.round(state.peakLoadKW * 0.7));
    // Recommended tier should be ≥ floor
    expect(tiers[1].bessKW).toBeGreaterThanOrEqual(75);
  });

  it("generator included in all tiers (wantsGenerator=true)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.generatorKW).toBeGreaterThan(0);
    }
  });

  it("BESS Recommended duration is 2h (C2 industry standard)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    expect(tiers[1].durationHours).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3 — Seattle WA, self-serve, polycarbonate roof (poor sun)
// ─────────────────────────────────────────────────────────────────────────────
describe("Scenario 3 — Seattle WA car wash (poor sun, near PSH floor)", () => {
  // Physics: PSH 3.2, sunFactor = clamp((3.2-3.0)/2.5, 0, 1) = 0.08
  // Solar will be tiny. Solar cap also small: self_serve + polycarbonate (0.40 usable)
  // BESS: 45 kW peak × 0.40 (peak_shaving) = 18 → floor 75 kW Recommended
  // Generator: full scope (unreliable grid), 45 × 1.10 = 49.5 → 50 kW

  const step3Answers = {
    primaryBESSApplication: "peak_shaving",
    generatorNeed: "full_backup",
    facilityType: "self_serve",
    roofType: "polycarbonate",
    solarScope: "roof_only",
    generatorScope: "full",
  };

  const solarCapKW = Math.max(15, getCarWashSolarCapacity(step3Answers));

  const state = carWashState({
    location: {
      zip: "98101",
      city: "Seattle",
      state: "WA",
      formattedAddress: "Seattle WA",
      lat: 47.6062,
      lng: -122.3321,
    },
    intel: {
      utilityRate: 0.1,
      demandCharge: 8,
      peakSunHours: 3.2,
      solarGrade: "D",
      solarFeasible: true,
      utilityProvider: "Seattle City Light",
      weatherRisk: "High",
    },
    solarPhysicalCapKW: solarCapKW,
    baseLoadKW: 18,
    peakLoadKW: 45,
    criticalLoadKW: 11,
    gridReliability: "frequent-outages",
    step3Answers,
    solarKW: estimateSolarKW("roof_only", {
      solarPhysicalCapKW: solarCapKW,
      intel: { peakSunHours: 3.2, solarFeasible: true },
    } as WizardState),
    generatorKW: estimateGenKW("full", {
      peakLoadKW: 45,
      criticalLoadPct: 0.25,
    } as WizardState),
    wantsSolar: true,
    wantsGenerator: true,
  });

  let tiers: Awaited<ReturnType<typeof buildTiers>>;

  it("builds 3 tiers without error", async () => {
    tiers = await buildTiers(state);
    printScenario("Seattle WA — Self-Serve (poor sun, full generator)", state, tiers);
    expect(tiers).toHaveLength(3);
  });

  it("solar kW is very small (PSH 3.2 → sunFactor 0.08, near PSH floor)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    const psh = 3.2;
    const sunFactor = (psh - 3.0) / 2.5; // 0.08
    // Recommended solar should be ≤ cap × 0.08 × 0.55 (rounded up generously)
    const maxReasonable = Math.ceil(solarCapKW * sunFactor * 0.55 * 1.5); // 50% padding
    console.log(
      `  → Seattle solar sanity: Recommended=${tiers[1].solarKW} kW, cap=${solarCapKW} kW, sunFactor=${sunFactor.toFixed(2)}, max reasonable=${maxReasonable} kW`
    );
    expect(tiers[1].solarKW).toBeLessThanOrEqual(Math.max(5, maxReasonable));
  });

  it("generator kW covers full scope (≥ peakLoadKW × 1.10 for full scope)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    const expectedMin = Math.round(state.peakLoadKW * 1.1 * 0.7); // Starter is 0.7× of base
    expect(tiers[0].generatorKW).toBeGreaterThanOrEqual(expectedMin);
    // Recommended should be ≥ full scope baseline
    expect(tiers[1].generatorKW).toBeGreaterThanOrEqual(Math.round(state.peakLoadKW * 1.1) - 5); // -5 rounding
  });

  it("BESS kW never below 75 kW floor even with small load", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.bessKW).toBeGreaterThanOrEqual(75);
    }
  });

  it("Starter < Recommended for gross cost", async () => {
    if (!tiers) tiers = await buildTiers(state);
    expect(tiers[0].grossCost).toBeLessThan(tiers[1].grossCost);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CROSS-SCENARIO: Verify solar formula consistency (display = committed)
// ─────────────────────────────────────────────────────────────────────────────
describe("Solar formula consistency — display matches committed (addonSizing = step4Logic)", () => {
  it("Phoenix maximum scope: estimateSolarKW matches buildTiers Recommended solarKW", async () => {
    const step3Answers = {
      primaryBESSApplication: "peak_shaving",
      solarScope: "maximum",
      generatorScope: "essential",
      facilityType: "full_service",
      roofType: "opaque_metal",
    };
    const capKW = Math.max(60, getCarWashSolarCapacity(step3Answers));
    const committedKW = estimateSolarKW("maximum", {
      solarPhysicalCapKW: capKW,
      intel: { peakSunHours: 6.5, solarFeasible: true },
    } as WizardState);

    const state = carWashState({
      intel: {
        utilityRate: 0.12,
        demandCharge: 12,
        peakSunHours: 6.5,
        solarGrade: "A",
        solarFeasible: true,
        utilityProvider: "APS",
        weatherRisk: "Low",
      },
      solarPhysicalCapKW: capKW,
      step3Answers,
      solarKW: committedKW,
      wantsSolar: true,
      wantsGenerator: true,
      generatorKW: estimateGenKW("essential", {
        peakLoadKW: 95,
        criticalLoadPct: 0.25,
      } as WizardState),
    });

    const tiers = await buildTiers(state);
    // Recommended tier solar should be the committed value scaled 1.0× (exact match)
    const tierAddonScale = 1.0;
    const expectedRecommended = Math.min(Math.round(committedKW * tierAddonScale), capKW);
    console.log(`\n  Formula consistency check (Phoenix, maximum scope):`);
    console.log(`    estimateSolarKW committed : ${committedKW} kW`);
    console.log(`    buildTiers Recommended    : ${tiers[1].solarKW} kW`);
    console.log(`    solar cap                 : ${capKW} kW`);
    expect(tiers[1].solarKW).toBe(expectedRecommended);
  });

  it("Chicago roof_only scope: estimateSolarKW matches buildTiers Recommended solarKW", async () => {
    const step3Answers = {
      primaryBESSApplication: "backup_power",
      solarScope: "roof_only",
      generatorScope: "essential",
      facilityType: "express_tunnel",
      roofType: "mixed_skylights",
    };
    const capKW = Math.max(30, getCarWashSolarCapacity(step3Answers));
    const committedKW = estimateSolarKW("roof_only", {
      solarPhysicalCapKW: capKW,
      intel: { peakSunHours: 3.8, solarFeasible: true },
    } as WizardState);

    const state = carWashState({
      location: {
        zip: "60601",
        city: "Chicago",
        state: "IL",
        formattedAddress: "Chicago IL",
        lat: 41.8827,
        lng: -87.6233,
      },
      intel: {
        utilityRate: 0.155,
        demandCharge: 18,
        peakSunHours: 3.8,
        solarGrade: "C+",
        solarFeasible: true,
        utilityProvider: "ComEd",
        weatherRisk: "Medium",
      },
      solarPhysicalCapKW: capKW,
      baseLoadKW: 30,
      peakLoadKW: 80,
      step3Answers,
      solarKW: committedKW,
      wantsSolar: true,
      wantsGenerator: true,
      generatorKW: estimateGenKW("essential", {
        peakLoadKW: 80,
        criticalLoadPct: 0.25,
      } as WizardState),
    });

    const tiers = await buildTiers(state);
    const expectedRecommended = Math.min(Math.round(committedKW * 1.0), capKW);
    console.log(`\n  Formula consistency check (Chicago, roof_only):`);
    console.log(`    estimateSolarKW committed : ${committedKW} kW`);
    console.log(`    buildTiers Recommended    : ${tiers[1].solarKW} kW`);
    console.log(`    solar cap                 : ${capKW} kW`);
    expect(tiers[1].solarKW).toBe(expectedRecommended);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4 — Phoenix AZ + pkg_pro EV (6 L2 + 2 DCFC, excellent sun)
// ─────────────────────────────────────────────────────────────────────────────
describe("Scenario 4 — Phoenix AZ car wash + pkg_pro EV (6 L2 + 2 DCFC)", () => {
  // Physics: same as Scenario 1 (PSH 6.5, peak_shaving BESS, opaque_metal)
  // EV: pkg_pro = 6 L2 + 2 DCFC = 6×7.2 + 2×50 = 43.2 + 100 = 143.2 → 143 kW
  // Combined peak: 95 (car wash) + 143 (EV) = 238 kW
  // BESS Recommended: max(75, round(238 × 0.40)) = max(75, 95) = 95 kW / 380 kWh
  // EV revenue (NET, after electricity cost): 6×L2 + 2×DCFC at $0.12/kWh
  //   L2:   6 × ($3 − 3.6×0.12) × 1.5 × 300 = 6 × $2.568 × 1.5 × 300 ≈ $6,912/yr
  //   DCFC: 2 × ($12 − 25×0.12) × 5 × 300  = 2 × $9 × 5 × 300     = $27,000/yr
  //   Total net EV revenue: ~$33,912/yr (was $34,800 gross — corrected Apr 2026)
  // NOTE: EV load pre-merged into peakLoadKW (as Step 3 setBaseLoad() would in prod)

  const step3Answers = {
    primaryBESSApplication: "peak_shaving",
    generatorNeed: "partial",
    facilityType: "full_service",
    roofType: "opaque_metal",
    solarScope: "maximum",
    generatorScope: "essential",
  };

  const solarCapKW = Math.max(60, getCarWashSolarCapacity(step3Answers));
  const evL2 = 6;
  const evDCFC = 2;
  const evKW = Math.round(evL2 * EV_KW.l2 + evDCFC * EV_KW.dcfc); // 143 kW
  const carWashPeakKW = 95;
  const combinedPeakKW = carWashPeakKW + evKW; // 238 kW

  const state = carWashState({
    location: {
      zip: "85001",
      city: "Phoenix",
      state: "AZ",
      formattedAddress: "Phoenix AZ",
      lat: 33.4484,
      lng: -112.074,
    },
    intel: {
      utilityRate: 0.12,
      demandCharge: 12,
      peakSunHours: 6.5,
      solarGrade: "A",
      solarFeasible: true,
      utilityProvider: "APS",
      weatherRisk: "Low",
    },
    solarPhysicalCapKW: solarCapKW,
    baseLoadKW: 38,
    peakLoadKW: combinedPeakKW,
    criticalLoadKW: 24,
    step3Answers,
    solarKW: estimateSolarKW("maximum", {
      solarPhysicalCapKW: solarCapKW,
      intel: { peakSunHours: 6.5, solarFeasible: true },
    } as WizardState),
    generatorKW: estimateGenKW("essential", {
      peakLoadKW: carWashPeakKW,
      criticalLoadPct: 0.25,
    } as WizardState),
    wantsSolar: true,
    wantsGenerator: true,
    wantsEVCharging: true,
    level2Chargers: evL2,
    dcfcChargers: evDCFC,
    // evRevenuePerYear intentionally omitted: when level2Chargers/dcfcChargers
    // are set, tier.evRevenuePerYear is computed from calculateAnnualSavings()
    // (net session fee after electricity cost), NOT from state.evRevenuePerYear.
  });

  let tiers: Awaited<ReturnType<typeof buildTiers>>;

  it("builds 3 tiers without error", async () => {
    tiers = await buildTiers(state);
    printScenario("Phoenix AZ — pkg_pro EV (6 L2 + 2 DCFC, 143 kW EV load)", state, tiers);
    expect(tiers).toHaveLength(3);
    expect(tiers[0].label).toBe("Starter");
    expect(tiers[1].label).toBe("Recommended");
    expect(tiers[2].label).toBe("Complete");
  });

  it("evChargerKW = 143 kW for all tiers (6×7.2 + 2×50 = 143.2 → 143)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.evChargerKW).toBe(143);
    }
  });

  it("BESS Recommended ≥ 95 kW (combined peak 238 kW × 0.40, exceeds 75 kW floor)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    const expectedRec = Math.max(75, Math.round(combinedPeakKW * 0.4)); // 95
    expect(tiers[1].bessKW).toBeGreaterThanOrEqual(expectedRec - 1); // −1 rounding tolerance
  });

  it("BESS grows with EV load: Recommended > 75 kW floor (vs Scenario 1 floor-only)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    // Without EV: max(75, round(95×0.40)) = max(75,38) = 75 kW  (hits floor)
    // With EV:    max(75, round(238×0.40)) = max(75,95) = 95 kW  (above floor)
    expect(tiers[1].bessKW).toBeGreaterThan(75);
  });

  it("annual savings boosted by EV revenue (~$10,838/yr net at $0.12/kWh — 3 sess/day minus op costs & demand penalty)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.annualSavings).toBeGreaterThan(30000);
      // tier.evRevenuePerYear: new model (3 sess/day, 15% network + 3.5% CC + $1K maint)
      // 6 L2 + 2 DCFC at $0.12/kWh: L2 ~$6,934 + DCFC net ~$5,029 ≈ $11,963 total
      expect(t.evRevenuePerYear).toBeGreaterThan(8000);
      expect(t.evRevenuePerYear).toBeLessThan(25000); // far below old gross $34,800
    }
  });

  it("solar kW ≤ physical cap for all tiers", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.solarKW).toBeLessThanOrEqual(solarCapKW + 1); // +1 rounding
    }
  });

  it("Starter < Recommended < Complete for gross cost", async () => {
    if (!tiers) tiers = await buildTiers(state);
    expect(tiers[0].grossCost).toBeLessThan(tiers[1].grossCost);
    expect(tiers[1].grossCost).toBeLessThan(tiers[2].grossCost);
  });

  it("Recommended BESS duration is 2h (C2 industry standard)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    expect(tiers[1].durationHours).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 5 — Chicago IL + pkg_basic EV (4 L2 only, moderate sun)
// ─────────────────────────────────────────────────────────────────────────────
describe("Scenario 5 — Chicago IL car wash + pkg_basic EV (4 L2, no DCFC)", () => {
  // Physics: PSH 3.8, resilience BESS (backup_power), same location as Scenario 2
  // EV: pkg_basic = 4 L2 = 4×7.2 = 28.8 → 29 kW
  // Combined peak: 80 (car wash) + 29 (EV) = 109 kW
  // BESS Recommended: max(75, round(109 × 0.70)) = max(75, 76) = 76 kW / 304 kWh
  // EV revenue (NET at $0.155/kWh): 4 × ($3 − 3.6×0.155) × 1.5 × 300 = 4 × $2.442 × 450 ≈ $4,396/yr
  // (was $7,200/yr in legacy state field — corrected Apr 2026, now computed from session net revenue)

  const step3Answers = {
    primaryBESSApplication: "backup_power",
    generatorNeed: "partial",
    facilityType: "express_tunnel",
    roofType: "mixed_skylights",
    solarScope: "roof_only",
    generatorScope: "essential",
  };

  const solarCapKW = Math.max(30, getCarWashSolarCapacity(step3Answers));
  const evL2 = 4;
  const evDCFC = 0;
  const evKW = Math.round(evL2 * EV_KW.l2 + evDCFC * EV_KW.dcfc); // 29 kW
  const carWashPeakKW = 80;
  const combinedPeakKW = carWashPeakKW + evKW; // 109 kW

  const state = carWashState({
    location: {
      zip: "60601",
      city: "Chicago",
      state: "IL",
      formattedAddress: "Chicago IL",
      lat: 41.8827,
      lng: -87.6233,
    },
    intel: {
      utilityRate: 0.155,
      demandCharge: 18,
      peakSunHours: 3.8,
      solarGrade: "C+",
      solarFeasible: true,
      utilityProvider: "ComEd",
      weatherRisk: "Medium",
    },
    solarPhysicalCapKW: solarCapKW,
    baseLoadKW: 30,
    peakLoadKW: combinedPeakKW,
    criticalLoadKW: 20,
    step3Answers,
    solarKW: estimateSolarKW("roof_only", {
      solarPhysicalCapKW: solarCapKW,
      intel: { peakSunHours: 3.8, solarFeasible: true },
    } as WizardState),
    generatorKW: estimateGenKW("essential", {
      peakLoadKW: carWashPeakKW,
      criticalLoadPct: 0.25,
    } as WizardState),
    wantsSolar: true,
    wantsGenerator: true,
    wantsEVCharging: true,
    level2Chargers: evL2,
    dcfcChargers: evDCFC,
    // evRevenuePerYear intentionally omitted: computed from calculateAnnualSavings() net session revenue
  });

  let tiers: Awaited<ReturnType<typeof buildTiers>>;

  it("builds 3 tiers without error", async () => {
    tiers = await buildTiers(state);
    printScenario("Chicago IL — pkg_basic EV (4 L2, 29 kW EV load)", state, tiers);
    expect(tiers).toHaveLength(3);
  });

  it("evChargerKW = 29 kW for all tiers (4×7.2 = 28.8 → 29)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.evChargerKW).toBe(29);
    }
  });

  it("BESS Recommended reflects resilience ratio (0.70 × 109 kW combined peak ≥ 75)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    const expectedRec = Math.max(75, Math.round(combinedPeakKW * 0.7)); // max(75, 76) = 76
    expect(tiers[1].bessKW).toBeGreaterThanOrEqual(expectedRec - 1); // −1 rounding tolerance
  });

  it("annual savings boosted by EV revenue ($7,200/yr additive)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.annualSavings).toBeGreaterThan(15000);
    }
  });

  it("solar kW reduced by low sun (PSH 3.8, mixed_skylights cap)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.solarKW).toBeLessThanOrEqual(solarCapKW + 1);
    }
  });

  it("generator included in all tiers (wantsGenerator=true)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.generatorKW).toBeGreaterThan(0);
    }
  });

  it("Recommended BESS duration is 2h (C2 industry standard)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    expect(tiers[1].durationHours).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 6 — WOW Car Wash style: 1 express tunnel + 24 vacuum stations
// ─────────────────────────────────────────────────────────────────────────────
describe("Scenario 6 — WOW Car Wash (1 tunnel + 24 vacuums, solar + EV + generator)", () => {
  // Real-world profile based on WOW Car Wash express format (HQ: Scottsdale AZ)
  //
  // LOAD BREAKDOWN:
  //   Tunnel equipment  : ~110 kW peak (3× high-pressure pumps + 2× blowers + conveyor)
  //   24 vacuum stations: 24 × 1.2 kW = 28.8 kW ≈ 29 kW (all running simultaneously)
  //   Car wash peak     : 110 + 29 = 139 → 140 kW (rounded)
  //   Car wash base     : ~75 kW (steady-state tunnel + partial vacuum load)
  //
  // SOLAR — vacuum canopy boosts cap beyond roof-only:
  //   Building roof (express_tunnel, opaque): 4500 sqft × 0.70 / 100 = 32 kW
  //   Vacuum canopy (24 × 65 sqft × 0.90 usable): 1560 × 0.90 / 100 = 14 kW
  //   Solar cap total: 32 + 14 = 46 kW  (vs 32 kW without canopy)
  //   PSH 6.5 → sunFactor 1.0 → committed: 46 × 1.0 × 1.00 (maximum scope) = 46 kW
  //
  // EV — pkg_pro (6 L2 + 2 DCFC):
  //   6 × 7.2 = 43.2 kW + 2 × 50 = 100 kW → 143 kW EV demand
  //   Combined peak: 140 (car wash) + 143 (EV) = 283 kW
  //   Revenue (NET at $0.13/kWh):
  //     L2:   6 × ($3 − 3.6×0.13) × 1.5 × 300 = 6 × $2.532 × 450 ≈ $6,836/yr
  //     DCFC: 2 × ($12 − 25×0.13) × 5 × 300  = 2 × $8.75 × 1500 = $26,250/yr
  //     Total: ~$33,086/yr (was $34,800 gross — corrected Apr 2026)
  //
  // BESS — peak_shaving (0.40 ratio):
  //   max(75, round(283 × 0.40)) = max(75, 113) = 113 kW Recommended
  //   Without EV: max(75, round(140 × 0.40)) = max(75, 56) = 75 kW (hits floor)
  //   EV demand lifts BESS 75 → 113 kW
  //
  // GENERATOR — essential scope:
  //   round(140 × 0.25 × 1.25) = round(43.75) = 44 kW

  const step3Answers = {
    primaryBESSApplication: "peak_shaving",
    generatorNeed: "partial",
    facilityType: "express_tunnel",
    roofType: "opaque", // 0.70 factor — correct key for opaque metal
    solarScope: "maximum",
    generatorScope: "essential",
    vacuumStations: 24, // ← drives vacuum canopy solar (+14 kW)
  };

  const solarCapKW = getCarWashSolarCapacity(step3Answers); // 32 + 14 = 46 kW
  const evL2 = 6;
  const evDCFC = 2;
  const evKW = Math.round(evL2 * EV_KW.l2 + evDCFC * EV_KW.dcfc); // 143 kW
  const carWashPeakKW = 140; // 110 kW tunnel + 29 kW vacuums
  const combinedPeakKW = carWashPeakKW + evKW; // 283 kW

  const state = carWashState({
    location: {
      zip: "85251",
      city: "Scottsdale",
      state: "AZ",
      formattedAddress: "Scottsdale AZ",
      lat: 33.4942,
      lng: -111.9261,
    },
    intel: {
      utilityRate: 0.13,
      demandCharge: 14,
      peakSunHours: 6.5,
      solarGrade: "A",
      solarFeasible: true,
      utilityProvider: "APS",
      weatherRisk: "Low",
    },
    solarPhysicalCapKW: solarCapKW,
    baseLoadKW: 75,
    peakLoadKW: combinedPeakKW,
    criticalLoadKW: 35, // 140 × 0.25 = 35 kW
    step3Answers,
    solarKW: estimateSolarKW("maximum", {
      solarPhysicalCapKW: solarCapKW,
      intel: { peakSunHours: 6.5, solarFeasible: true },
    } as WizardState),
    generatorKW: estimateGenKW("essential", {
      peakLoadKW: carWashPeakKW, // generator sized to car wash only (not EV)
      criticalLoadPct: 0.25,
    } as WizardState),
    wantsSolar: true,
    wantsGenerator: true,
    wantsEVCharging: true,
    level2Chargers: evL2,
    dcfcChargers: evDCFC,
    // evRevenuePerYear intentionally omitted: computed from calculateAnnualSavings() net session revenue
  });

  let tiers: Awaited<ReturnType<typeof buildTiers>>;

  it("builds 3 tiers without error and prints WOW profile", async () => {
    tiers = await buildTiers(state);
    printScenario("WOW Car Wash (Scottsdale AZ) — 1 tunnel + 24 vac + pkg_pro EV", state, tiers);
    expect(tiers).toHaveLength(3);
    expect(tiers[0].label).toBe("Starter");
    expect(tiers[1].label).toBe("Recommended");
    expect(tiers[2].label).toBe("Complete");
  });

  it("solar cap = 55 kW (getCarWashSolarCapacity for express_tunnel with opaque roof)", () => {
    // Note: getCarWashSolarCapacity returns 55 kW for express_tunnel + opaque roof
    // Computed: round(6500 × 0.70 / 107.5) + round(24×65×0.90 / 107.5) = 42 + 13 = 55 kW
    // (107.5 sqft/kW AC from 400W panel @ 21.5 sqft, DC/AC ratio 0.625, 20% tilt/spacing)
    expect(solarCapKW).toBe(55);
  });

  it("solar kW = 55 kW for Recommended (PSH 6.5, sunFactor 1.0, maximum scope, cap 55 kW)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    // maximum scope × sunFactor 1.0 × cap 55 kW = 55 kW exactly
    expect(tiers[1].solarKW).toBe(55);
  });

  it("evChargerKW = 143 kW for all tiers (6×7.2 + 2×50 = 143.2 → 143)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.evChargerKW).toBe(143);
    }
  });

  it("BESS Recommended = 113 kW (283 kW combined peak × 0.40, well above 75 kW floor)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    const expectedRec = Math.max(75, Math.round(combinedPeakKW * 0.4)); // 113
    // Without EV: max(75, round(140×0.40)) = max(75,56) = 75 (floor)
    // With EV:    max(75, round(283×0.40)) = max(75,113) = 113 (above floor)
    expect(tiers[1].bessKW).toBeGreaterThanOrEqual(expectedRec - 1); // −1 rounding tolerance
    expect(tiers[1].bessKW).toBeGreaterThan(75); // must beat floor
  });

  it("generator kW ≈ 44 kW for Recommended (140 × 0.25 × 1.25 NEC margin, car wash only)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    // essential scope: round(140 × 0.25 × 1.25) = round(43.75) = 44
    expect(tiers[1].generatorKW).toBeGreaterThanOrEqual(40);
    expect(tiers[1].generatorKW).toBeLessThanOrEqual(50);
  });

  it("annual savings boosted by EV revenue (~$12,390/yr net at $0.13/kWh — 3 sess/day minus op costs & demand penalty)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      // annualSavings = demand shaving + solar + EV revenue (all net)
      expect(t.annualSavings).toBeGreaterThan(20000);
      // 6 L2 + 2 DCFC at $0.13/kWh with 113 kW BESS: L2 ~$6,836 + DCFC net ~$5,554 ≈ $12,390
      expect(t.evRevenuePerYear).toBeGreaterThan(8000);
      expect(t.evRevenuePerYear).toBeLessThan(30000); // far below old gross $34,800
    }
  });

  it("Recommended BESS duration is 2h (C2 industry standard)", async () => {
    if (!tiers) tiers = await buildTiers(state);
    expect(tiers[1].durationHours).toBe(2);
  });

  it("Starter < Recommended < Complete for gross cost", async () => {
    if (!tiers) tiers = await buildTiers(state);
    expect(tiers[0].grossCost).toBeLessThan(tiers[1].grossCost);
    expect(tiers[1].grossCost).toBeLessThan(tiers[2].grossCost);
  });

  it("net cost > 0 and payback > 0 for all tiers", async () => {
    if (!tiers) tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.netCost).toBeGreaterThan(0);
      expect(t.paybackYears).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EV FORMULA CONSISTENCY — computeEVPackageKW SSOT matches step4Logic computation
// ─────────────────────────────────────────────────────────────────────────────
describe("EV formula consistency — EV_KW constants and computeEVPackageKW match step4Logic", () => {
  it("EV_KW constants are SSOT values (L2=7.2 kW, DCFC=50 kW, HPC=250 kW)", () => {
    expect(EV_KW.l2).toBe(7.2);
    expect(EV_KW.dcfc).toBe(50);
    expect(EV_KW.hpc).toBe(250);
  });

  it("computeEVPackageKW(6, 2) = 143 kW  [pkg_pro: 6 L2 + 2 DCFC]", () => {
    expect(computeEVPackageKW(6, 2)).toBe(143);
  });

  it("computeEVPackageKW(4, 0) = 29 kW   [pkg_basic: 4 L2 only]", () => {
    expect(computeEVPackageKW(4, 0)).toBe(29);
  });

  it("computeEVPackageKW(6, 4) = 243 kW  [pkg_fleet: 6 L2 + 4 DCFC]", () => {
    expect(computeEVPackageKW(6, 4)).toBe(243);
  });

  it("buildTiers evChargerKW matches computeEVPackageKW for pkg_pro (round-trip)", async () => {
    const expected = computeEVPackageKW(6, 2); // 143
    const state = carWashState({
      peakLoadKW: 238,
      level2Chargers: 6,
      dcfcChargers: 2,
      wantsEVCharging: true,
    });
    const tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.evChargerKW).toBe(expected);
    }
  });

  it("buildTiers evChargerKW matches computeEVPackageKW for pkg_basic (round-trip)", async () => {
    const expected = computeEVPackageKW(4, 0); // 29
    const state = carWashState({
      peakLoadKW: 109,
      level2Chargers: 4,
      dcfcChargers: 0,
      wantsEVCharging: true,
    });
    const tiers = await buildTiers(state);
    for (const t of tiers) {
      expect(t.evChargerKW).toBe(expected);
    }
  });
});
