/**
 * =============================================================================
 * EV REVENUE AUDIT — Comprehensive test suite for EV revenue correctness
 * =============================================================================
 *
 * Regression tests written after Vineet's bug report (April 2026):
 *
 *   BUG 1 — Gross vs Net EV revenue:
 *     DCFC was returning $18,000/charger/yr (gross session fee, no electricity
 *     cost deducted). Correct value at $0.15/kWh is ~$12,375/yr.
 *
 *   BUG 2 — evRevenuePerYear in QuoteTier was always 0:
 *     step4Logic.ts returned state.evRevenuePerYear (legacy field, stays 0 in
 *     the Step 3.5 DCFC configuration path). Should use
 *     v45Savings.evChargingRevenue when charger counts are set.
 *
 *   BUG 3 — Generator collapses EV savings:
 *     Adding a generator caused annualSavings to drop from $88K back to $16K,
 *     making it look like EV revenue was erased. Root cause: BUG 2 above
 *     combined with recalcWithoutGenerator reading tier.evRevenuePerYear.
 *
 * WHAT WE VERIFY:
 *
 *   A. NET REVENUE MATH
 *      — Exact per-session net (fee − kWh × rate) for L2, DCFC, HPC
 *      — Multiple electricity rates
 *      — evChargingRevenue returned in SavingsBreakdown
 *
 *   B. TIER FIELD ISOLATION
 *      — tier.evRevenuePerYear === calculateAnnualSavings().evChargingRevenue
 *        when level2Chargers/dcfcChargers are set (NOT state.evRevenuePerYear)
 *      — state.evRevenuePerYear is the fallback only when no typed counts
 *
 *   C. GENERATOR + EV STABILITY (Vineet's scenario)
 *      — annualSavings is the same with or without generator
 *      — Only cost changes; savings do not collapse
 *      — paybackYears increases (cost up) but annualSavings unchanged
 *
 *   D. RECALC PRESERVES EV REVENUE
 *      — applyPaybackGuardrail / recalcWithoutGenerator preserves EV revenue
 *      — When guardrail fires, only generator cost is removed; savings stay
 *
 *   E. MULTI-CHARGER COMBOS
 *      — L2-only, DCFC-only, HPC-only, L2+DCFC, L2+DCFC+HPC
 *      — Zero chargers → zero EV revenue
 *
 *   F. ELECTRICITY RATE SENSITIVITY
 *      — Higher rate → lower net revenue (electricity cost eats more margin)
 *      — At rate > $0.48/kWh DCFC goes to $0 (session fee fully consumed)
 *
 * =============================================================================
 */

import { describe, it, expect } from "vitest";
import { calculateAnnualSavings, type SavingsInputs } from "@/services/pricingServiceV45";
import { buildTiers } from "../step4Logic";
import type { WizardState } from "../wizardState";

// =============================================================================
// SHARED FIXTURES
// =============================================================================

/** Net revenue per session at a given electricity rate */
function l2NetPerSession(rate: number) {
  return Math.max(0, 3 - 3.6 * rate);
}
function dcfcNetPerSession(rate: number) {
  return Math.max(0, 12 - 25 * rate);
}
function hpcNetPerSession(rate: number) {
  return Math.max(0, 25 - 75 * rate);
}

// Annual = charger_count × net_per_session × sessions_per_day × days_per_year
function l2AnnualRevenue(count: number, rate: number) {
  return Math.round(count * l2NetPerSession(rate) * 1.5 * 300);
}
function dcfcAnnualRevenue(count: number, rate: number) {
  return Math.round(count * dcfcNetPerSession(rate) * 5 * 300);
}
function hpcAnnualRevenue(count: number, rate: number) {
  return Math.round(count * hpcNetPerSession(rate) * 8 * 300);
}

const BASE_SAVINGS_INPUTS: SavingsInputs = {
  bessKW: 95,
  bessKWh: 380,
  solarKW: 23,
  generatorKW: 0,
  evChargers: 0,
  electricityRate: 0.15,
  demandCharge: 15,
  sunHoursPerDay: 5,
  cyclesPerYear: 250,
};

/** Minimal WizardState for buildTiers — BESS + Solar, car wash */
function makeEVState(overrides: Partial<WizardState> = {}): WizardState {
  return {
    step: 5 as WizardState["step"],
    locationRaw: "",
    country: "US",
    countryCode: "US",
    location: {
      zip: "85001",
      city: "Phoenix",
      state: "AZ",
      formattedAddress: "Phoenix AZ",
      lat: 33.4484,
      lng: -112.074,
    },
    locationStatus: "ready",
    business: null,
    intelStatus: { utility: "ready", solar: "ready", weather: "ready" },
    gridReliability: "reliable",
    intel: {
      utilityRate: 0.15,
      demandCharge: 15,
      peakSunHours: 5.5,
      solarGrade: "A",
      solarFeasible: true,
      utilityProvider: "APS",
      weatherRisk: "Low",
    },
    industry: "car_wash",
    solarPhysicalCapKW: 60,
    criticalLoadPct: 0.25,
    step3Answers: {
      primaryBESSApplication: "peak_shaving",
      generatorNeed: "partial",
      step3_5Visited: true,
    },
    evChargers: null,
    baseLoadKW: 38,
    peakLoadKW: 95,
    criticalLoadKW: 24,
    evRevenuePerYear: 0, // ← legacy field; should be ignored when chargers set
    wantsSolar: true,
    wantsEVCharging: false,
    wantsGenerator: false,
    solarKW: 23,
    generatorKW: 0,
    generatorFuelType: "natural-gas",
    level2Chargers: 0,
    dcfcChargers: 0,
    hpcChargers: 0,
    ...overrides,
  } as WizardState;
}

// =============================================================================
// A. NET REVENUE MATH (unit tests on pricingServiceV45.calculateAnnualSavings)
// =============================================================================

describe("A. EV net revenue math — pricingServiceV45.calculateAnnualSavings", () => {
  describe("L2 chargers", () => {
    it("1 L2 at $0.15/kWh: net/session = $3 − (3.6 × 0.15) = $2.46, 1.5 sess/day × 300 days = $1,107/yr", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, l2Chargers: 1, electricityRate: 0.15 },
        0
      );
      const expected = l2AnnualRevenue(1, 0.15); // Math.round(1 × 2.46 × 1.5 × 300)
      expect(result.evChargingRevenue).toBe(expected);
      expect(result.evChargingRevenue).toBeGreaterThan(1000);
      expect(result.evChargingRevenue).toBeLessThan(1200);
    });

    it("6 L2 at $0.12/kWh: net/session = $2.568, total ≈ $6,912/yr", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, l2Chargers: 6, electricityRate: 0.12 },
        0
      );
      const expected = l2AnnualRevenue(6, 0.12);
      expect(result.evChargingRevenue).toBe(expected);
      expect(result.evChargingRevenue).toBeGreaterThan(6000);
      expect(result.evChargingRevenue).toBeLessThan(8000);
    });

    it("L2 net revenue goes to $0 when rate > $0.833/kWh (fee = $3 / 3.6 kWh)", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, l2Chargers: 4, electricityRate: 0.9 },
        0
      );
      expect(result.evChargingRevenue).toBe(0); // Math.max(0,...) floors at 0
    });
  });

  describe("DCFC chargers", () => {
    it("1 DCFC at $0.15/kWh: net/session = $12 − (25 × 0.15) = $8.25, 5 sess/day × 300 days = $12,375/yr", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 1, electricityRate: 0.15 },
        0
      );
      const expected = dcfcAnnualRevenue(1, 0.15); // 12375
      expect(result.evChargingRevenue).toBe(expected);
      expect(result.evChargingRevenue).toBeGreaterThan(12000);
      expect(result.evChargingRevenue).toBeLessThan(13000);
    });

    it("4 DCFC at $0.15/kWh = $49,500/yr (not the old gross $72,000/yr)", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 4, electricityRate: 0.15 },
        0
      );
      const expected = dcfcAnnualRevenue(4, 0.15); // 4 × 12375 = 49500
      expect(result.evChargingRevenue).toBe(expected);
      // Explicitly guard against the old gross value ($72K)
      expect(result.evChargingRevenue).toBeLessThan(60000);
    });

    it("4 DCFC at $0.12/kWh (APS Phoenix rate): net = $12 − $3 = $9/session = $54,000/yr", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 4, electricityRate: 0.12 },
        0
      );
      const expected = dcfcAnnualRevenue(4, 0.12); // 4 × 9 × 5 × 300 = 54000
      expect(result.evChargingRevenue).toBe(expected);
      expect(result.evChargingRevenue).toBeGreaterThanOrEqual(54000);
    });

    it("DCFC net revenue goes to $0 when rate > $0.48/kWh (fee = $12 / 25 kWh)", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 2, electricityRate: 0.5 },
        0
      );
      expect(result.evChargingRevenue).toBe(0);
    });
  });

  describe("HPC chargers", () => {
    it("1 HPC at $0.15/kWh: net/session = $25 − (75 × 0.15) = $13.75, 8 sess/day × 300 days = $33,000/yr", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, hpcChargers: 1, electricityRate: 0.15 },
        0
      );
      const expected = hpcAnnualRevenue(1, 0.15); // 13.75 × 8 × 300 = 33000
      expect(result.evChargingRevenue).toBe(expected);
      expect(result.evChargingRevenue).toBeGreaterThan(30000);
      expect(result.evChargingRevenue).toBeLessThan(36000);
    });
  });

  describe("Mixed L2 + DCFC", () => {
    it("6 L2 + 2 DCFC at $0.12/kWh: total = L2 revenue + DCFC revenue", () => {
      const result = calculateAnnualSavings(
        {
          ...BASE_SAVINGS_INPUTS,
          evChargers: 0,
          l2Chargers: 6,
          dcfcChargers: 2,
          electricityRate: 0.12,
        },
        0
      );
      const expected = l2AnnualRevenue(6, 0.12) + dcfcAnnualRevenue(2, 0.12);
      expect(result.evChargingRevenue).toBe(expected);
    });

    it("L2 + DCFC + HPC: all three contribute independently", () => {
      const rate = 0.14;
      const result = calculateAnnualSavings(
        {
          ...BASE_SAVINGS_INPUTS,
          evChargers: 0,
          l2Chargers: 4,
          dcfcChargers: 2,
          hpcChargers: 1,
          electricityRate: rate,
        },
        0
      );
      const expected =
        l2AnnualRevenue(4, rate) + dcfcAnnualRevenue(2, rate) + hpcAnnualRevenue(1, rate);
      expect(result.evChargingRevenue).toBe(expected);
    });
  });

  describe("Zero chargers", () => {
    it("0 chargers → evChargingRevenue = 0", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, l2Chargers: 0, dcfcChargers: 0, hpcChargers: 0 },
        0
      );
      expect(result.evChargingRevenue).toBe(0);
    });

    it("legacy evChargers fallback: treats as L2 (conservative)", () => {
      // When l2Chargers/dcfcChargers/hpcChargers are null/undefined, falls back to evChargers as L2
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 4, electricityRate: 0.15 },
        0
      );
      const expected = l2AnnualRevenue(4, 0.15);
      expect(result.evChargingRevenue).toBe(expected);
    });
  });

  describe("Rate sensitivity", () => {
    it("higher electricity rate → lower net DCFC revenue (more electricity cost consumed)", () => {
      const lowRate = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 4, electricityRate: 0.1 },
        0
      );
      const highRate = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 4, electricityRate: 0.25 },
        0
      );
      expect(lowRate.evChargingRevenue).toBeGreaterThan(highRate.evChargingRevenue);
    });

    it("evChargingRevenue is always ≥ 0 (never negative), regardless of rate", () => {
      const rates = [0.01, 0.15, 0.3, 0.5, 0.99, 1.5];
      for (const rate of rates) {
        const r = calculateAnnualSavings(
          {
            ...BASE_SAVINGS_INPUTS,
            evChargers: 0,
            l2Chargers: 4,
            dcfcChargers: 2,
            electricityRate: rate,
          },
          0
        );
        expect(r.evChargingRevenue).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

// =============================================================================
// B. TIER FIELD ISOLATION — tier.evRevenuePerYear must use computed value
// =============================================================================

describe("B. tier.evRevenuePerYear isolation — computed value, not state.evRevenuePerYear", () => {
  it("tier.evRevenuePerYear matches calculateAnnualSavings().evChargingRevenue when dcfcChargers > 0", async () => {
    const dcfc = 4;
    const rate = 0.15;
    const state = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: dcfc,
      evRevenuePerYear: 999999, // ← intentionally wrong legacy value — must be ignored
      intel: {
        utilityRate: rate,
        demandCharge: 15,
        peakSunHours: 5.5,
        solarGrade: "A",
        solarFeasible: true,
        utilityProvider: "APS",
        weatherRisk: "Low",
      },
    });
    const tiers = await buildTiers(state);
    const expectedEVRevenue = dcfcAnnualRevenue(dcfc, rate);
    for (const tier of tiers) {
      // Must equal the computed net value — NOT 999999 (stale state field)
      expect(tier.evRevenuePerYear).toBe(expectedEVRevenue);
      expect(tier.evRevenuePerYear).not.toBe(999999);
    }
  });

  it("tier.evRevenuePerYear matches for 6 L2 + 2 DCFC combo", async () => {
    const l2 = 6,
      dcfc = 2,
      rate = 0.12;
    const state = makeEVState({
      wantsEVCharging: true,
      level2Chargers: l2,
      dcfcChargers: dcfc,
      evRevenuePerYear: 34800, // ← old gross value from legacy code
      intel: {
        utilityRate: rate,
        demandCharge: 12,
        peakSunHours: 6.5,
        solarGrade: "A",
        solarFeasible: true,
        utilityProvider: "APS",
        weatherRisk: "Low",
      },
    });
    const tiers = await buildTiers(state);
    const expected = l2AnnualRevenue(l2, rate) + dcfcAnnualRevenue(dcfc, rate);
    for (const tier of tiers) {
      expect(tier.evRevenuePerYear).toBe(expected);
      // Old gross was $34,800 — must no longer appear
      expect(tier.evRevenuePerYear).not.toBe(34800);
    }
  });

  it("state.evRevenuePerYear is used as fallback when no typed charger counts (legacy path)", async () => {
    const state = makeEVState({
      wantsEVCharging: true,
      level2Chargers: 0,
      dcfcChargers: 0,
      hpcChargers: 0,
      evRevenuePerYear: 8000, // ← legacy: should be used as-is
    });
    const tiers = await buildTiers(state);
    // With 0 typed charger counts, evRevenuePerYear from state should be used
    for (const tier of tiers) {
      expect(tier.evRevenuePerYear).toBe(8000);
    }
  });

  it("tier.evRevenuePerYear is included in grossAnnualSavings (additive check)", async () => {
    const dcfc = 4;
    const rate = 0.15;
    const stateWithEV = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: dcfc,
    });
    const stateNoEV = makeEVState({
      wantsEVCharging: false,
      dcfcChargers: 0,
    });
    const [, withEV] = await buildTiers(stateWithEV);
    const [, noEV] = await buildTiers(stateNoEV);
    const expectedEVRevenue = dcfcAnnualRevenue(dcfc, rate);
    // grossAnnualSavings should be higher by approximately the EV revenue
    const delta = withEV.grossAnnualSavings - noEV.grossAnnualSavings;
    expect(delta).toBeCloseTo(expectedEVRevenue, -2); // within $100
  });
});

// =============================================================================
// C. GENERATOR + EV STABILITY — Vineet's exact scenario
// =============================================================================

describe("C. Generator + EV stability — annualSavings must not collapse when generator added", () => {
  it("BESS+Solar+4DCFC: adding generator does NOT reduce annualSavings (only raises cost)", async () => {
    const baseState = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: 4,
      wantsGenerator: false,
      generatorKW: 0,
    });
    const withGenState = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: 4,
      wantsGenerator: true,
      generatorKW: 125,
      generatorFuelType: "natural-gas",
    });

    const [, baseRec] = await buildTiers(baseState);
    const [, genRec] = await buildTiers(withGenState);

    // EV revenue must be preserved in both scenarios
    const expectedEVRevenue = dcfcAnnualRevenue(4, 0.15);
    expect(baseRec.evRevenuePerYear).toBe(expectedEVRevenue);

    // annualSavings should be the same or very close (generator adds $0 non-hospital savings)
    // Allow small variance from tier-scaling (generator changes generatorKW scale)
    const savingsDelta = Math.abs(genRec.annualSavings - baseRec.annualSavings);
    expect(savingsDelta).toBeLessThan(2000); // ≤ $2K tolerance for rounding/scale effects

    // Cost MUST be higher with generator (its whole purpose)
    expect(genRec.grossCost).toBeGreaterThan(baseRec.grossCost);
    expect(genRec.netCost).toBeGreaterThan(baseRec.netCost);

    // Payback MUST be longer (same savings, higher cost)
    expect(genRec.paybackYears).toBeGreaterThan(baseRec.paybackYears);
  });

  it("BESS+Solar+4DCFC+generator: annualSavings is substantially larger than BESS+Solar alone (EV not erased)", async () => {
    const noEVNoGen = makeEVState({
      wantsEVCharging: false,
      dcfcChargers: 0,
      wantsGenerator: false,
    });
    const withEVWithGen = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: 4,
      wantsGenerator: true,
      generatorKW: 125,
    });

    const [, noEVRec] = await buildTiers(noEVNoGen);
    const [, evGenRec] = await buildTiers(withEVWithGen);

    // EV+generator scenario must save substantially MORE than BESS+solar alone
    const expectedEVRevenue = dcfcAnnualRevenue(4, 0.15);
    expect(evGenRec.annualSavings).toBeGreaterThan(
      noEVRec.annualSavings + expectedEVRevenue * 0.8 // at least 80% of EV revenue additive
    );
  });

  it("EV revenue field is preserved in the generator scenario tier output", async () => {
    const state = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: 4,
      wantsGenerator: true,
      generatorKW: 125,
    });
    const tiers = await buildTiers(state);
    const expectedEVRevenue = dcfcAnnualRevenue(4, 0.15);
    for (const tier of tiers) {
      expect(tier.evRevenuePerYear).toBe(expectedEVRevenue);
    }
  });

  it("non-hospital generator contributes $0 energy savings (pure capex — known design decision)", async () => {
    const withGen = makeEVState({ wantsGenerator: true, generatorKW: 125 });
    const withoutGen = makeEVState({ wantsGenerator: false, generatorKW: 0 });

    const [, genRec] = await buildTiers(withGen);
    const [, noGenRec] = await buildTiers(withoutGen);

    // For non-hospital: generator savings contribution = 0
    // (generatorBackupValue = 0 in pricingServiceV45 for non-hospital)
    const savingsDiff = genRec.annualSavings - noGenRec.annualSavings;
    expect(Math.abs(savingsDiff)).toBeLessThan(1500); // effectively $0 ± rounding
  });
});

// =============================================================================
// D. RECALC PRESERVES EV REVENUE (applyPaybackGuardrail path)
// =============================================================================

describe("D. Payback guardrail preserves EV revenue when generator removed", () => {
  it("when guardrail fires and removes generator, EV revenue is intact in output tier", async () => {
    // Build a state where generator pushes payback past threshold
    // Large expensive generator on a modest BESS+solar base → guardrail likely fires
    const state = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: 2,
      wantsGenerator: false, // guardrail is allowed to strip it
      generatorKW: 300, // oversized — forces payback failure
      wantsSolar: true,
      solarKW: 15,
    });

    const tiers = await buildTiers(state);
    const expectedEVRevenue = dcfcAnnualRevenue(2, 0.15);

    for (const tier of tiers) {
      // Regardless of whether guardrail fired, EV revenue must be present
      expect(tier.evRevenuePerYear).toBe(expectedEVRevenue);
      expect(tier.annualSavings).toBeGreaterThan(
        expectedEVRevenue * 0.8 // EV revenue should be the dominant savings driver
      );
    }
  });

  it("annualSavings with DCFC is always > annualSavings without DCFC (EV revenue is never subtracted by guardrail)", async () => {
    const withDCFC = makeEVState({ wantsEVCharging: true, dcfcChargers: 2 });
    const noDCFC = makeEVState({ wantsEVCharging: false, dcfcChargers: 0 });

    const [stWith, recWith] = await buildTiers(withDCFC);
    const [stNo, recNo] = await buildTiers(noDCFC);

    expect(recWith.annualSavings).toBeGreaterThan(recNo.annualSavings);
    expect(stWith.annualSavings).toBeGreaterThan(stNo.annualSavings);
  });
});

// =============================================================================
// E. MULTI-CHARGER COMBOS
// =============================================================================

describe("E. Multi-charger combinations", () => {
  const rate = 0.15;
  const combos: Array<{ l2: number; dcfc: number; hpc: number; label: string }> = [
    { l2: 0, dcfc: 0, hpc: 0, label: "zero chargers" },
    { l2: 4, dcfc: 0, hpc: 0, label: "L2-only" },
    { l2: 0, dcfc: 4, hpc: 0, label: "DCFC-only" },
    { l2: 0, dcfc: 0, hpc: 1, label: "HPC-only" },
    { l2: 6, dcfc: 2, hpc: 0, label: "L2+DCFC" },
    { l2: 4, dcfc: 2, hpc: 1, label: "L2+DCFC+HPC" },
  ];

  for (const { l2, dcfc, hpc, label } of combos) {
    const totalChargers = l2 + dcfc + hpc;
    it(`${label} (${l2}×L2 + ${dcfc}×DCFC + ${hpc}×HPC): tier.evRevenuePerYear matches computed net`, async () => {
      const state = makeEVState({
        wantsEVCharging: totalChargers > 0,
        level2Chargers: l2,
        dcfcChargers: dcfc,
        hpcChargers: hpc,
        intel: {
          utilityRate: rate,
          demandCharge: 15,
          peakSunHours: 5.5,
          solarGrade: "A",
          solarFeasible: true,
          utilityProvider: "APS",
          weatherRisk: "Low",
        },
      });
      const tiers = await buildTiers(state);
      const expected =
        l2AnnualRevenue(l2, rate) + dcfcAnnualRevenue(dcfc, rate) + hpcAnnualRevenue(hpc, rate);
      for (const tier of tiers) {
        if (totalChargers === 0) {
          // Zero chargers → evRevenuePerYear === state.evRevenuePerYear (0)
          expect(tier.evRevenuePerYear).toBe(0);
        } else {
          expect(tier.evRevenuePerYear).toBe(expected);
        }
      }
    });
  }

  it("more chargers → more EV revenue (monotonic)", async () => {
    const make = (dcfc: number) =>
      buildTiers(makeEVState({ wantsEVCharging: dcfc > 0, dcfcChargers: dcfc }));

    const [, t1] = await make(1);
    const [, t2] = await make(2);
    const [, t4] = await make(4);

    expect(t2.evRevenuePerYear).toBeGreaterThan(t1.evRevenuePerYear);
    expect(t4.evRevenuePerYear).toBeGreaterThan(t2.evRevenuePerYear);
    expect(t2.annualSavings).toBeGreaterThan(t1.annualSavings);
    expect(t4.annualSavings).toBeGreaterThan(t2.annualSavings);
  });
});

// =============================================================================
// F. ELECTRICITY RATE SENSITIVITY (end-to-end through buildTiers)
// =============================================================================

describe("F. Electricity rate sensitivity — EV revenue decreases as rate rises", () => {
  it("higher utility rate → lower tier EV revenue (electricity cost eats margin)", async () => {
    const makeWithRate = (rate: number) =>
      buildTiers(
        makeEVState({
          wantsEVCharging: true,
          dcfcChargers: 4,
          intel: {
            utilityRate: rate,
            demandCharge: 15,
            peakSunHours: 5.5,
            solarGrade: "A",
            solarFeasible: true,
            utilityProvider: "APS",
            weatherRisk: "Low",
          },
        })
      );

    const [, lowRate] = await makeWithRate(0.1);
    const [, midRate] = await makeWithRate(0.2);
    const [, highRate] = await makeWithRate(0.35);

    expect(lowRate.evRevenuePerYear).toBeGreaterThan(midRate.evRevenuePerYear);
    expect(midRate.evRevenuePerYear).toBeGreaterThan(highRate.evRevenuePerYear);
  });

  it("DCFC EV revenue at $0.48/kWh is effectively $0 (all margin consumed by electricity)", async () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 4, electricityRate: 0.48 },
      0
    );
    expect(result.evChargingRevenue).toBe(0);
  });
});

// =============================================================================
// G. REGRESSION GUARD — specific dollar values that must NEVER regress to old gross
// =============================================================================

describe("G. Regression guard — old gross values must not reappear", () => {
  it("4 DCFC at $0.15/kWh must NOT return $72,000/yr (old gross) — must be $49,500/yr", () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 4, electricityRate: 0.15 },
      0
    );
    expect(result.evChargingRevenue).not.toBe(72000); // old gross (4 × 12 × 5 × 300)
    expect(result.evChargingRevenue).toBe(49500); // new net (4 × 8.25 × 5 × 300)
  });

  it("1 DCFC at $0.15/kWh must NOT return $18,000/yr (old gross) — must be $12,375/yr", () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 1, electricityRate: 0.15 },
      0
    );
    expect(result.evChargingRevenue).not.toBe(18000); // old gross (1 × 12 × 5 × 300)
    expect(result.evChargingRevenue).toBe(12375); // new net (1 × 8.25 × 5 × 300)
  });

  it("tier.evRevenuePerYear must never equal state.evRevenuePerYear when chargers are configured", async () => {
    const STALE_LEGACY_VALUE = 99999;
    const state = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: 4,
      evRevenuePerYear: STALE_LEGACY_VALUE, // stale legacy field
    });
    const tiers = await buildTiers(state);
    for (const tier of tiers) {
      expect(tier.evRevenuePerYear).not.toBe(STALE_LEGACY_VALUE);
    }
  });
});
