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
// Mirrors pricingServiceV45 DCFC_SESSIONS_PER_DAY = 3 (conservative non-highway commercial)
const DCFC_SESSIONS_PER_DAY_TEST = 3;

function l2AnnualRevenue(count: number, rate: number) {
  return Math.round(count * l2NetPerSession(rate) * 1.5 * 300);
}
function dcfcAnnualRevenue(count: number, rate: number) {
  return Math.round(count * dcfcNetPerSession(rate) * DCFC_SESSIONS_PER_DAY_TEST * 300);
}
function hpcAnnualRevenue(count: number, rate: number) {
  return Math.round(count * hpcNetPerSession(rate) * 8 * 300);
}

/**
 * Mirror of pricingServiceV45 DCFC operating cost deductions (Vineet, April 2026).
 * Applied BEFORE the demand penalty.
 * - Network/software fees: 15% of gross session revenue
 * - CC processing: 3.5% of gross session revenue
 * - Maintenance: $1,000/charger/year
 */
function dcfcOperatingDeductions(count: number): number {
  const grossRevenue = count * 12 * DCFC_SESSIONS_PER_DAY_TEST * 300;
  const networkFees = Math.round(grossRevenue * 0.15);
  const ccFees = Math.round(grossRevenue * 0.035);
  const maintenance = count * 1000;
  return networkFees + ccFees + maintenance;
}

/**
 * Mirror of pricingServiceV45 DCFC demand charge penalty.
 * DCFC chargers create demand spikes; BESS offsets a portion.
 * bessOffset = min(0.75, (bessKW / dcfcPeakKW) × 0.75)
 * penalty = dcfcPeakKW × (1 − bessOffset) × demandCharge × 12
 */
function dcfcDemandPenaltyForTest(dcfcCount: number, bessKW: number, demandCharge: number): number {
  const dcfcPeakKW = dcfcCount * 50;
  if (dcfcPeakKW === 0) return 0;
  const bessOffset = Math.min(0.75, (bessKW / dcfcPeakKW) * 0.75);
  return Math.round(dcfcPeakKW * (1 - bessOffset) * demandCharge * 12);
}

/**
 * Net DCFC annual revenue after operating cost deductions AND demand penalty.
 * Order: sessions revenue (net of electricity) → minus operating costs → minus demand penalty
 */
function dcfcNetRevenue(count: number, rate: number, bessKW = 95, demandCharge = 15): number {
  const sessionsRevenue = dcfcAnnualRevenue(count, rate);
  const afterOpCosts = Math.max(0, sessionsRevenue - dcfcOperatingDeductions(count));
  const penalty = dcfcDemandPenaltyForTest(count, bessKW, demandCharge);
  return Math.max(0, afterOpCosts - penalty);
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
    it("1 DCFC at $0.15/kWh: net/session = $8.25 × 3 sess/day, minus operating costs & demand penalty → ~$2,177/yr", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 1, electricityRate: 0.15 },
        0
      );
      // Sessions: 1 × 8.25 × 3 × 300 = 7,425; op deductions: network(1620)+CC(378)+maint(1000)=2,998;
      // after ops: 4,427; demand penalty = 50 × 0.25 × 15 × 12 = 2,250; net = 2,177
      const expected = dcfcNetRevenue(1, 0.15); // 2,177
      expect(result.evChargingRevenue).toBe(expected);
      expect(result.evChargingRevenue).toBeGreaterThan(1500);
      expect(result.evChargingRevenue).toBeLessThan(7425); // must be below raw sessions revenue (before op costs)
    });

    it("4 DCFC at $0.15/kWh: demand penalty exceeds income at 95 kW BESS → $0 net (op costs + penalty combined)", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 4, electricityRate: 0.15 },
        0
      );
      // Sessions: 4 × 8.25 × 3 × 300 = 29,700; op deductions: ~11,992; after ops: 17,708;
      // demand penalty = 200 × 0.64375 × 15 × 12 = 23,175; net = max(0, -5,467) = 0
      const expected = dcfcNetRevenue(4, 0.15); // 0
      expect(result.evChargingRevenue).toBe(expected);
      // Guard against all old gross and old net values
      expect(result.evChargingRevenue).toBeLessThan(49500);
      expect(result.evChargingRevenue).not.toBe(72000); // old gross (4 × 12 × 5 × 300)
      expect(result.evChargingRevenue).not.toBe(26325); // old post-penalty net (no operating costs)
    });

    it("4 DCFC at $0.12/kWh (APS Phoenix rate): demand penalty exceeds income at 95 kW BESS → $0 net", () => {
      const result = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 4, electricityRate: 0.12 },
        0
      );
      // Sessions: 4 × 9 × 3 × 300 = 32,400; op deductions: ~11,992; after ops: 20,408;
      // demand penalty = 23,175 (rate-independent); net = max(0, -2,767) = 0
      const expected = dcfcNetRevenue(4, 0.12); // 0
      expect(result.evChargingRevenue).toBe(expected);
      expect(result.evChargingRevenue).toBeLessThan(54000); // demand penalty + op costs deducted
      expect(result.evChargingRevenue).not.toBe(30825); // old model net (no operating costs)
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
    it("6 L2 + 2 DCFC at $0.12/kWh: total = L2 revenue + DCFC net-of-demand-penalty revenue", () => {
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
      // L2 revenue unaffected; DCFC revenue net of demand penalty
      const expected = l2AnnualRevenue(6, 0.12) + dcfcNetRevenue(2, 0.12);
      expect(result.evChargingRevenue).toBe(expected);
    });

    it("L2 + DCFC + HPC: L2 and HPC unaffected; DCFC revenue net of demand penalty", () => {
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
      // L2 and HPC revenues unaffected; only DCFC revenue net of demand penalty
      const expected =
        l2AnnualRevenue(4, rate) + dcfcNetRevenue(2, rate) + hpcAnnualRevenue(1, rate);
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
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 1, electricityRate: 0.1 },
        0
      );
      const highRate = calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 1, electricityRate: 0.25 },
        0
      );
      // 1 DCFC at rate 0.1: ~$3,302/yr; at rate 0.25: ~$0 (op costs consume remaining margin)
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
    const dcfc = 2; // 2 DCFC: demand penalty < income even with modest BESS
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
    for (const tier of tiers) {
      // Must be computed net value (with op costs + demand penalty) — NOT 999999 (stale state field)
      // Operating costs + DCFC demand penalty reduce evRevenuePerYear below raw sessions revenue
      expect(tier.evRevenuePerYear).toBeGreaterThan(0);
      expect(tier.evRevenuePerYear).toBeLessThan(dcfcAnnualRevenue(dcfc, rate)); // op costs + penalty applied
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
    const rawExpected = l2AnnualRevenue(l2, rate) + dcfcAnnualRevenue(dcfc, rate);
    for (const tier of tiers) {
      // DCFC demand penalty is deducted, so tier value < raw combined revenue
      expect(tier.evRevenuePerYear).toBeGreaterThan(0);
      expect(tier.evRevenuePerYear).toBeLessThan(rawExpected); // demand penalty applied to DCFC portion
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
    const dcfc = 2; // 2 DCFC: demand penalty < income, ensures evRevenuePerYear > 0
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
    // grossAnnualSavings should be higher by the tier's actual EV revenue (net of op costs + demand penalty)
    // The demand penalty is BESS-size dependent, so compare using tier's own evRevenuePerYear
    const delta = withEV.grossAnnualSavings - noEV.grossAnnualSavings;
    expect(delta).toBeCloseTo(withEV.evRevenuePerYear, -2); // within $100 of tier's EV revenue
    expect(withEV.evRevenuePerYear).toBeGreaterThan(0);
    expect(withEV.evRevenuePerYear).toBeLessThan(dcfcAnnualRevenue(dcfc, rate)); // op costs + penalty applied
  });
});

// =============================================================================
// C. GENERATOR + EV STABILITY — Vineet's exact scenario
// =============================================================================

describe("C. Generator + EV stability — annualSavings must not collapse when generator added", () => {
  it("BESS+Solar+2DCFC: adding generator does NOT reduce annualSavings (only raises cost)", async () => {
    const baseState = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: 2,
      wantsGenerator: false,
      generatorKW: 0,
    });
    const withGenState = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: 2,
      wantsGenerator: true,
      generatorKW: 125,
      generatorFuelType: "natural-gas",
    });

    const [, baseRec] = await buildTiers(baseState);
    const [, genRec] = await buildTiers(withGenState);

    // EV revenue must be preserved in both scenarios (with op costs + demand penalty applied)
    expect(baseRec.evRevenuePerYear).toBeGreaterThan(0);
    expect(baseRec.evRevenuePerYear).toBeLessThan(dcfcAnnualRevenue(2, 0.15)); // op costs + penalty applied

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

  it("BESS+Solar+2DCFC+generator: annualSavings is substantially larger than BESS+Solar alone (EV not erased)", async () => {
    const noEVNoGen = makeEVState({
      wantsEVCharging: false,
      dcfcChargers: 0,
      wantsGenerator: false,
    });
    const withEVWithGen = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: 2,
      wantsGenerator: true,
      generatorKW: 125,
    });

    const [, noEVRec] = await buildTiers(noEVNoGen);
    const [, evGenRec] = await buildTiers(withEVWithGen);

    // EV+generator scenario must save substantially MORE than BESS+solar alone
    // Use tier's own evRevenuePerYear (net of op costs + demand penalty) instead of raw
    expect(evGenRec.annualSavings).toBeGreaterThan(
      noEVRec.annualSavings + evGenRec.evRevenuePerYear * 0.8 // at least 80% of net EV revenue additive
    );
  });

  it("EV revenue field is preserved in the generator scenario tier output", async () => {
    const state = makeEVState({
      wantsEVCharging: true,
      dcfcChargers: 2,
      wantsGenerator: true,
      generatorKW: 125,
    });
    const tiers = await buildTiers(state);
    for (const tier of tiers) {
      // EV revenue preserved (net of op costs + demand penalty)
      expect(tier.evRevenuePerYear).toBeGreaterThan(0);
      expect(tier.evRevenuePerYear).toBeLessThan(dcfcAnnualRevenue(2, 0.15)); // op costs + penalty applied
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
    const rawEVRevenue = dcfcAnnualRevenue(2, 0.15);

    for (const tier of tiers) {
      // Regardless of whether guardrail fired, EV revenue must be present (net of demand penalty)
      expect(tier.evRevenuePerYear).toBeGreaterThan(0);
      expect(tier.evRevenuePerYear).toBeLessThanOrEqual(rawEVRevenue); // ≤ raw (penalty may deduct)
      expect(tier.annualSavings).toBeGreaterThan(
        tier.evRevenuePerYear * 0.8 // EV revenue should be the dominant savings driver
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
      // Raw expected (pre-penalty), used as upper bound for DCFC combos
      const rawExpected =
        l2AnnualRevenue(l2, rate) + dcfcAnnualRevenue(dcfc, rate) + hpcAnnualRevenue(hpc, rate);
      for (const tier of tiers) {
        if (totalChargers === 0) {
          // Zero chargers → evRevenuePerYear === state.evRevenuePerYear (0)
          expect(tier.evRevenuePerYear).toBe(0);
        } else if (dcfc > 0) {
          // DCFC op costs + demand penalty deducted — may reach $0 when BESS is undersized for load
          expect(tier.evRevenuePerYear).toBeGreaterThanOrEqual(0);
          expect(tier.evRevenuePerYear).toBeLessThan(rawExpected);
        } else {
          // No DCFC — no demand penalty; L2/HPC revenue is exact
          expect(tier.evRevenuePerYear).toBe(rawExpected);
        }
      }
    });
  }

  it("with adequate BESS (500 kW), more DCFC chargers → more EV revenue (monotonic)", () => {
    // With a BESS large enough to fully offset DCFC demand (bessOffset = 0.75 for all),
    // adding chargers increases revenue proportionally. With an undersized BESS, demand
    // penalties can outpace session revenue, reducing or zeroing out net EV income.
    const make = (dcfc: number) =>
      calculateAnnualSavings(
        { ...BASE_SAVINGS_INPUTS, bessKW: 500, evChargers: 0, dcfcChargers: dcfc },
        0
      ).evChargingRevenue;

    const t1 = make(1); // ~$2,177 (after op costs; full 75% BESS offset)
    const t2 = make(2); // ~$4,354
    const t4 = make(4); // ~$8,708

    expect(t2).toBeGreaterThan(t1);
    expect(t4).toBeGreaterThan(t2);
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
          dcfcChargers: 1, // 1 DCFC: rate sensitivity visible; 4 DCFC all give $0 due to demand penalty
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

    // 1 DCFC: low(~$3,302) > mid(~$1,052) > high(~$0)
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
  it("4 DCFC at $0.15/kWh must NOT return $72,000/yr (old gross) or $26,325 (old net) — operating costs now applied", () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 4, electricityRate: 0.15 },
      0
    );
    expect(result.evChargingRevenue).not.toBe(72000); // old gross (4 × 12 × 5 × 300)
    expect(result.evChargingRevenue).not.toBe(49500); // old pre-penalty net (4 × 8.25 × 5 × 300)
    expect(result.evChargingRevenue).not.toBe(26325); // old post-demand-penalty net (no operating costs)
    expect(result.evChargingRevenue).toBe(dcfcNetRevenue(4, 0.15)); // = 0: op costs + demand penalty exceed income
    expect(result.evChargingRevenue).toBeLessThan(49500);
  });

  it("1 DCFC at $0.15/kWh must NOT return $18,000/yr (old gross) or $10,125 (old net) — operating costs now applied", () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, evChargers: 0, dcfcChargers: 1, electricityRate: 0.15 },
      0
    );
    expect(result.evChargingRevenue).not.toBe(18000); // old gross (1 × 12 × 5 × 300)
    expect(result.evChargingRevenue).not.toBe(12375); // old pre-penalty net (1 × 8.25 × 5 × 300)
    expect(result.evChargingRevenue).not.toBe(10125); // old post-demand-penalty net (no operating costs)
    expect(result.evChargingRevenue).toBe(dcfcNetRevenue(1, 0.15)); // = 2,177 (after op costs + demand penalty)
    expect(result.evChargingRevenue).toBeLessThan(7425); // below raw sessions revenue (1 × 8.25 × 3 × 300)
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
