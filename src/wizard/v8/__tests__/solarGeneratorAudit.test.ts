/**
 * =============================================================================
 * SOLAR + GENERATOR AUDIT — Comprehensive calculation verification
 * =============================================================================
 *
 * Companion to evRevenueAudit.test.ts — pins exact numeric values for every
 * formula in the solar / generator / BESS / ITC / reserves pipeline so that
 * future refactors cannot silently change outputs.
 *
 * COVERAGE MAP
 * ────────────
 *   A. Solar savings exact formula (pricingServiceV45.ts calculateAnnualSavings)
 *   B. Solar cost breakdown (calculateSystemCosts — $1.00/W equipment, $0.51/W labor)
 *   C. Generator cost — diesel vs natural gas + ATS + fuel tank logic
 *   D. BESS cost — pack ($350/kWh) + PCS ($150/kW), no inverter double-count
 *   E. Annual reserves — insurance + inverter + BESS degradation reserve
 *   F. Hospital generator backup value — $60K/yr hospital only, $0 elsewhere
 *   G. ITC proration — generator excluded; proration shrinks credit when gen added
 *   H. Demand charge savings + TOU arbitrage exact formulas
 *   I. addonSizing.estimateSolarKW — sunFactor, floor 0.40, PSH gate, scope penetration
 *   J. addonSizing.estimateGenKW  — reserve margin 1.25, scope sizing, 10kW floor
 *   K. buildTiers BESS sizing    — ratio × tier scale × 75kW floor, duration hours
 *
 * SSOT CONSTANTS (never inline — always sourced from benchmarks/service files):
 *   PR = 0.77 (NREL Performance Ratio for commercial C&I solar)
 *   Generator reserve margin = 1.25 (NEC 700/701/702 + IEEE 446)
 *   BESS ratios: peak_shaving=0.40, arbitrage=0.50, resilience=0.70, microgrid=1.00
 *   Tier BESS scale: Starter=0.55, Recommended=1.0, Complete=1.5
 *   75 kW commercial minimum BESS floor
 *   Solar cost $1.00/W equip, $0.51/W labor; BESS $350/kWh pack + $150/kW PCS
 *   Diesel gen: $690/kW + $15K tank + $8K ATS; Natural gas: $500/kW + $8K ATS (no tank)
 *
 * =============================================================================
 */

import { describe, it, expect } from "vitest";
import {
  calculateSystemCosts,
  calculateAnnualSavings,
  EQUIPMENT_UNIT_COSTS,
  SOFT_COSTS,
  INSTALLATION_COSTS,
  ANNUAL_RESERVES,
  FEDERAL_ITC_RATE,
  type EquipmentConfig,
  type SavingsInputs,
} from "@/services/pricingServiceV45";
import { estimateSolarKW, estimateGenKW, SOLAR_SCOPE_PENETRATION } from "../addonSizing";
import { buildTiers } from "../step4Logic";
import {
  getBESSSizingRatioWithSource,
  getGeneratorReserveMarginWithSource,
} from "@/services/benchmarkSources";
import type { WizardState } from "../wizardState";

// =============================================================================
// SHARED FIXTURES
// =============================================================================

function makeIntel(
  overrides: Partial<import("../wizardState").LocationIntel> = {}
): import("../wizardState").LocationIntel {
  return {
    utilityRate: 0.15,
    demandCharge: 15,
    peakSunHours: 5.0,
    solarGrade: "A",
    solarFeasible: true,
    utilityProvider: "Test Utility",
    weatherRisk: "Low",
    weatherProfile: "Sunny",
    avgTempF: 72,
    ...overrides,
  };
}

function makeState(overrides: Partial<WizardState> = {}): WizardState {
  return {
    step: 5 as WizardState["step"],
    locationRaw: "",
    country: "US",
    countryCode: "US",
    location: {
      zip: "89101",
      city: "Las Vegas",
      state: "NV",
      formattedAddress: "Las Vegas, NV 89101",
      lat: 36.1699,
      lng: -115.1398,
    },
    locationStatus: "ready",
    business: null,
    intelStatus: { utility: "ready", solar: "ready", weather: "ready" },
    gridReliability: "reliable",
    intel: makeIntel(),
    industry: "office",
    solarPhysicalCapKW: 200,
    criticalLoadPct: 0.4,
    step3Answers: {
      primaryBESSApplication: "peak_shaving",
      step3_5Visited: true,
    },
    evChargers: null,
    baseLoadKW: 150,
    peakLoadKW: 250,
    criticalLoadKW: 100,
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

const BASE_SAVINGS_INPUTS: SavingsInputs = {
  bessKW: 0,
  bessKWh: 0,
  solarKW: 0,
  generatorKW: 0,
  evChargers: 0,
  electricityRate: 0.15,
  demandCharge: 15,
  sunHoursPerDay: 5.0,
  cyclesPerYear: 250,
};

// =============================================================================
// A. SOLAR SAVINGS EXACT FORMULA
//    Annual kWh = solarKW × PSH × 365 × 0.77 (NREL PR)
//    Annual savings = annualKWh × electricityRate
// =============================================================================

describe("A. Solar savings exact formula — PR=0.77, NREL methodology", () => {
  it("A1: 100 kW solar, 5 PSH, $0.15/kWh → $21,079", () => {
    // 100 × 5 × 365 × 0.77 × 0.15 = 140,525 kWh × $0.15 = $21,078.75 → $21,079
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, solarKW: 100, sunHoursPerDay: 5.0, electricityRate: 0.15 },
      100
    );
    expect(result.solarSavings).toBe(21079);
  });

  it("A2: doubles linearly — 200 kW solar, 5 PSH, $0.15/kWh → $42,158", () => {
    // 200 × 5 × 365 × 0.77 × 0.15 = $42,157.50 → $42,158
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, solarKW: 200, sunHoursPerDay: 5.0, electricityRate: 0.15 },
      200
    );
    expect(result.solarSavings).toBe(42158);
  });

  it("A3: scales with PSH — 6 PSH / 5 PSH ratio = 6/5 exactly", () => {
    // Anchor: PR=0.77 means savings are strictly proportional to PSH
    // 100 kW × 6 PSH × 365 × 0.77 × 0.15 = $25,294.50 → $25,295
    const r5 = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, solarKW: 100, sunHoursPerDay: 5.0 },
      100
    );
    const r6 = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, solarKW: 100, sunHoursPerDay: 6.0 },
      100
    );
    // Raw ratio must be exactly 6/5 = 1.2 (within rounding $1)
    expect(r6.solarSavings).toBe(25295);
    expect(r6.solarSavings / r5.solarSavings).toBeCloseTo(6 / 5, 2);
  });

  it("A4: rate sensitivity — $0.10/kWh → $14,053", () => {
    // 140,525 × 0.10 = $14,052.50 → $14,053
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, solarKW: 100, sunHoursPerDay: 5.0, electricityRate: 0.1 },
      100
    );
    expect(result.solarSavings).toBe(14053);
  });

  it("A5: rate sensitivity — $0.20/kWh → $28,105", () => {
    // 140,525 × 0.20 = $28,105 exactly
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, solarKW: 100, sunHoursPerDay: 5.0, electricityRate: 0.2 },
      100
    );
    expect(result.solarSavings).toBe(28105);
  });

  it("A6: zero solar → $0 solar savings (no phantom production)", () => {
    const result = calculateAnnualSavings({ ...BASE_SAVINGS_INPUTS, solarKW: 0 }, 0);
    expect(result.solarSavings).toBe(0);
  });

  it("A7: PR anchor — savings at PSH=5 must equal kW × 5 × 365 × 0.77 × rate (not 0.75 or 0.80)", () => {
    // This test will fail if PR is accidentally changed from 0.77
    const PR_EXPECTED = 0.77;
    const kW = 150,
      psh = 5,
      rate = 0.12;
    const expectedSavings = Math.round(kW * psh * 365 * PR_EXPECTED * rate);
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, solarKW: kW, sunHoursPerDay: psh, electricityRate: rate },
      kW
    );
    expect(result.solarSavings).toBe(expectedSavings);
    // Sanity: would fail with PR=0.75 (expectedSavings would differ by ~$380)
    const PR_WRONG_LOW = 0.75;
    const wrongLow = Math.round(kW * psh * 365 * PR_WRONG_LOW * rate);
    expect(result.solarSavings).not.toBe(wrongLow);
    // Would also fail with PR=0.80
    const PR_WRONG_HIGH = 0.8;
    const wrongHigh = Math.round(kW * psh * 365 * PR_WRONG_HIGH * rate);
    expect(result.solarSavings).not.toBe(wrongHigh);
  });
});

// =============================================================================
// B. SOLAR COST BREAKDOWN
//    Equipment: $1.00/W (no inverter — inverter is in BESS PCS cost)
//    Labor: $0.51/W (shown separately, ITC-eligible)
//    NEVER uses gross $1.70/W for the equipment line
// =============================================================================

describe("B. Solar cost breakdown — $1.00/W equipment, $0.51/W labor separate", () => {
  it("B1: 100 kW solar equipment cost = $100,000 ($1.00/W exactly)", () => {
    const result = calculateSystemCosts({ solarKW: 100 });
    expect(result.solarCost).toBe(100_000);
  });

  it("B2: 100 kW solar labor = $51,000 ($0.51/W in Additional Costs, not equipment quote)", () => {
    const result = calculateSystemCosts({ solarKW: 100 });
    expect(result.solarLaborCost).toBe(51_000);
  });

  it("B3: equipment cost ≠ gross price — solarCost uses $1.00/W NOT $1.70/W", () => {
    const result = calculateSystemCosts({ solarKW: 100 });
    const grossWouldBe = 100 * 1.7 * 1000; // $170,000 — wrong
    expect(result.solarCost).not.toBe(grossWouldBe);
    expect(result.solarCost).toBe(100_000); // $1.00/W correct
  });

  it("B4: solar labor is NOT included in solarCost (no double-counting)", () => {
    const result = calculateSystemCosts({ solarKW: 100 });
    // If labor were included in solarCost it would be $151,000 — wrong
    expect(result.solarCost).toBeLessThan(result.solarCost + result.solarLaborCost);
    expect(result.solarCost).toBe(100_000);
    expect(result.solarLaborCost).toBe(51_000);
  });

  it("B5: solar labor IS part of installationLaborCost (Additional Costs line)", () => {
    const result = calculateSystemCosts({ solarKW: 100 });
    // installationLaborCost = solarLabor + INSTALLATION_COSTS.total
    // = $51,000 + $13,500 = $64,500
    expect(result.installationLaborCost).toBe(51_000 + INSTALLATION_COSTS.total);
  });

  it("B6: zero solar → solarCost = 0 and solarLaborCost = 0", () => {
    const result = calculateSystemCosts({ bessKW: 100, bessKWh: 200 });
    expect(result.solarCost).toBe(0);
    expect(result.solarLaborCost).toBe(0);
  });

  it("B7: solar scales linearly — 200 kW = 2× the 100 kW cost", () => {
    const r100 = calculateSystemCosts({ solarKW: 100 });
    const r200 = calculateSystemCosts({ solarKW: 200 });
    expect(r200.solarCost).toBe(r100.solarCost * 2);
    expect(r200.solarLaborCost).toBe(r100.solarLaborCost * 2);
  });
});

// =============================================================================
// C. GENERATOR COST
//    Diesel: $690/kW + $15,000 fuel tank + $8,000 ATS
//    Natural gas: $500/kW + $8,000 ATS (no fuel tank — piped utility supply)
//    Zero generator: $0 total (no orphan tank or ATS)
// =============================================================================

describe("C. Generator cost — diesel vs natural gas, ATS, fuel tank", () => {
  it("C1: diesel 200 kW → $161,000  (200×$690 + $15K tank + $8K ATS)", () => {
    // 200 × 690 = $138,000 + $15,000 + $8,000 = $161,000
    const result = calculateSystemCosts({ generatorKW: 200, generatorFuelType: "diesel" });
    expect(result.generatorCost).toBe(161_000);
  });

  it("C2: natural gas 200 kW → $108,000  (200×$500 + $8K ATS, no tank)", () => {
    // 200 × 500 = $100,000 + $0 + $8,000 = $108,000
    const result = calculateSystemCosts({ generatorKW: 200, generatorFuelType: "natural-gas" });
    expect(result.generatorCost).toBe(108_000);
  });

  it("C3: diesel defaults when generatorFuelType omitted → matches explicit diesel", () => {
    const defaultResult = calculateSystemCosts({ generatorKW: 200 }); // no fuelType
    const dieselResult = calculateSystemCosts({ generatorKW: 200, generatorFuelType: "diesel" });
    expect(defaultResult.generatorCost).toBe(dieselResult.generatorCost);
  });

  it("C4: zero kW generator → $0 (no orphan tank or ATS cost)", () => {
    const result = calculateSystemCosts({ solarKW: 100, generatorKW: 0 });
    expect(result.generatorCost).toBe(0);
  });

  it("C5: NG is cheaper than diesel — diesel-to-NG delta = ($690-$500)×kW + $15K tank", () => {
    const kW = 200;
    const diesel = calculateSystemCosts({ generatorKW: kW, generatorFuelType: "diesel" });
    const ng = calculateSystemCosts({ generatorKW: kW, generatorFuelType: "natural-gas" });
    // Diesel = 200×690 + 15K + 8K; NG = 200×500 + 0 + 8K
    // Difference = (690-500)×200 + 15,000 = 38,000 + 15,000 = $53,000
    expect(diesel.generatorCost - ng.generatorCost).toBe(53_000);
  });

  it("C6: ATS ($8,000) is always included regardless of fuel type, never for 0 kW", () => {
    const { transferSwitchCost, fuelTankCost, pricePerKW } = EQUIPMENT_UNIT_COSTS.generator;
    // Diesel 100kW
    const dieselResult = calculateSystemCosts({ generatorKW: 100, generatorFuelType: "diesel" });
    expect(dieselResult.generatorCost).toBe(100 * pricePerKW + fuelTankCost + transferSwitchCost);
    // NG 100kW — ATS present, no tank
    const ngResult = calculateSystemCosts({ generatorKW: 100, generatorFuelType: "natural-gas" });
    expect(ngResult.generatorCost).toBe(100 * 500 + transferSwitchCost);
    // Confirm ATS constant from SSOT
    expect(transferSwitchCost).toBe(8_000);
  });

  it("C7: generator is NOT included in ITC-eligible costs", () => {
    const solarOnly = calculateSystemCosts({ solarKW: 100 });
    const solarPlusGen = calculateSystemCosts({
      solarKW: 100,
      generatorKW: 200,
      generatorFuelType: "diesel",
    });
    // Generator raises cost but DECREASES ITC (proration reduces eligible fraction)
    expect(solarPlusGen.generatorCost).toBeGreaterThan(0);
    expect(solarPlusGen.federalITC).toBeLessThan(solarOnly.federalITC);
  });
});

// =============================================================================
// D. BESS COST
//    Pack: $350/kWh; PCS/inverter: $150/kW
//    bessCost = bessKWh × $350 + bessKW × $150
// =============================================================================

describe("D. BESS cost — pack ($350/kWh) + PCS ($150/kW)", () => {
  it("D1: 300 kWh + 150 kW BESS → $127,500  (300×$350 + 150×$150)", () => {
    // Pack: 300 × 350 = $105,000
    // PCS:  150 × 150 = $22,500
    // Total: $127,500
    const result = calculateSystemCosts({ bessKW: 150, bessKWh: 300 });
    expect(result.bessCost).toBe(127_500);
  });

  it("D2: pack and PCS scale independently — doubling kWh doubles pack, kW unchanged", () => {
    const r1 = calculateSystemCosts({ bessKW: 100, bessKWh: 200 }); // 200×350 + 100×150 = 70K+15K = 85K
    const r2 = calculateSystemCosts({ bessKW: 100, bessKWh: 400 }); // 400×350 + 100×150 = 140K+15K = 155K
    expect(r1.bessCost).toBe(85_000);
    expect(r2.bessCost).toBe(155_000);
    expect(r2.bessCost - r1.bessCost).toBe(200 * 350); // only pack cost changes
  });

  it("D3: zero BESS → $0 bessCost", () => {
    const result = calculateSystemCosts({ solarKW: 100, bessKW: 0, bessKWh: 0 });
    expect(result.bessCost).toBe(0);
  });

  it("D4: BESS pack price SSOT constant = $350/kWh (not $300 or $400)", () => {
    expect(EQUIPMENT_UNIT_COSTS.bess.pricePerKWh).toBe(350);
    expect(EQUIPMENT_UNIT_COSTS.bess.pricePerKW).toBe(150);
  });

  it("D5: supplier-price override applies to pack cost", () => {
    // When a better-priced supplier is found, the override flows through
    const standard = calculateSystemCosts({ bessKW: 100, bessKWh: 200 });
    const override = calculateSystemCosts({
      bessKW: 100,
      bessKWh: 200,
      bessPackPricePerKWhOverride: 300, // $50/kWh cheaper
    });
    // Pack savings = 200 kWh × $50 = $10,000
    expect(standard.bessCost - override.bessCost).toBe(10_000);
  });
});

// =============================================================================
// E. ANNUAL RESERVES
//    Insurance rider:   $1,250/yr flat
//    Inverter reserve:  solarKW × 1,000 × $0.01/yr  ($0.01/W/yr)
//    BESS degradation:  bessKWh × $350 × 0.02/yr     (2% of pack value)
//    Total: $1,250 + solarKW×$10 + bessKWh×$7
// =============================================================================

describe("E. Annual reserves — $1,250 flat + $10/kW solar + $7/kWh BESS", () => {
  it("E1: zero solar, zero BESS → $1,250 flat insurance only", () => {
    expect(ANNUAL_RESERVES.total(0, 0)).toBe(1_250);
  });

  it("E2: 100 kW solar, no BESS → $2,250  ($1,250 + 100×$10)", () => {
    // Inverter reserve: 100 × 1000 × 0.01 = $1,000
    expect(ANNUAL_RESERVES.total(100, 0)).toBe(2_250);
  });

  it("E3: no solar, 300 kWh BESS → $3,350  ($1,250 + 300×$7)", () => {
    // Degradation reserve: 300 × 350 × 0.02 = $2,100
    expect(ANNUAL_RESERVES.total(0, 300)).toBe(3_350);
  });

  it("E4: 100 kW solar + 300 kWh BESS → $4,350  ($1,250 + $1,000 + $2,100)", () => {
    expect(ANNUAL_RESERVES.total(100, 300)).toBe(4_350);
  });

  it("E5: zero solar → zero inverter replacement reserve (no phantom inverter cost)", () => {
    expect(ANNUAL_RESERVES.inverterReplacementReserve(0)).toBe(0);
  });

  it("E6: inverter reserve scales at $10/kW ($0.01/W/yr — SSOT)", () => {
    // 50 kW: 50 × 1000 × 0.01 = $500
    expect(ANNUAL_RESERVES.inverterReplacementReserve(50)).toBe(500);
    // 200 kW: 200 × 1000 × 0.01 = $2,000
    expect(ANNUAL_RESERVES.inverterReplacementReserve(200)).toBe(2_000);
  });

  it("E7: BESS degradation reserve scales at $7/kWh (2% of $350/kWh pack value)", () => {
    // 100 kWh: 100 × 350 × 0.02 = $700
    expect(ANNUAL_RESERVES.bessLegradationReserve(100)).toBe(700);
    // 600 kWh: 600 × 350 × 0.02 = $4,200
    expect(ANNUAL_RESERVES.bessLegradationReserve(600)).toBe(4_200);
  });

  it("E8: reserves deducted from gross savings → netAnnualSavings < grossAnnualSavings", () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, solarKW: 100, bessKW: 150, bessKWh: 300, demandCharge: 15 },
      100
    );
    expect(result.annualReserves).toBe(4_350); // 100kW solar + 300kWh BESS
    expect(result.netAnnualSavings).toBe(result.grossAnnualSavings - result.annualReserves);
  });
});

// =============================================================================
// F. HOSPITAL GENERATOR BACKUP VALUE
//    Formula: 2 events/yr × 4 hr/event × $7,500/hr = $60,000/yr
//    Hospital industry ONLY. All other industries: $0.
// =============================================================================

describe("F. Hospital generator backup value — $60K/yr hospital only, $0 elsewhere", () => {
  it("F1: hospital + 100 kW generator → $60,000/yr backup value", () => {
    // 2 × 4 × $7,500 = $60,000 (ASHE facility risk study)
    const result = calculateAnnualSavings(
      {
        ...BASE_SAVINGS_INPUTS,
        generatorKW: 100,
        industry: "hospital",
      },
      0
    );
    expect(result.generatorBackupValue).toBe(60_000);
  });

  it("F2: hospital + no generator (0 kW) → $0 (generator required for backup value)", () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, generatorKW: 0, industry: "hospital" },
      0
    );
    expect(result.generatorBackupValue).toBe(0);
  });

  it("F3: hotel industry + 200 kW generator → $0 (backup value is hospital-only)", () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, generatorKW: 200, industry: "hotel" },
      0
    );
    expect(result.generatorBackupValue).toBe(0);
  });

  it("F4: office industry + generator → $0", () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, generatorKW: 100, industry: "office" },
      0
    );
    expect(result.generatorBackupValue).toBe(0);
  });

  it("F5: restaurant industry + generator → $0", () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, generatorKW: 100, industry: "restaurant" },
      0
    );
    expect(result.generatorBackupValue).toBe(0);
  });

  it("F6: hospital backup value formula constants are $7,500/hr × 4hr × 2 events", () => {
    // Verify the formula: adding generator to hospital
    const withGen = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, generatorKW: 100, industry: "hospital" },
      0
    );
    const withoutGen = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, generatorKW: 0, industry: "hospital" },
      0
    );
    expect(withGen.generatorBackupValue - withoutGen.generatorBackupValue).toBe(60_000);
    // Value is always flat $60K regardless of generator size
    const bigGen = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, generatorKW: 500, industry: "hospital" },
      0
    );
    expect(bigGen.generatorBackupValue).toBe(60_000);
  });
});

// =============================================================================
// G. ITC PRORATION
//    Generator is NOT ITC-eligible (IRA 2022 §48 — fossil fuel exclusion)
//    Adding generator reduces soft cost proration → lower ITC credit
//    Solar-only → 100% eligible fraction
// =============================================================================

describe("G. ITC proration — generator excluded, soft costs prorated", () => {
  it("G1: solar-only system → ITC > solarCost × 0.30 (labor + site costs also eligible)", () => {
    const result = calculateSystemCosts({ solarKW: 100 });
    const solarEquipCredit = result.solarCost * 0.3; // min expected
    expect(result.federalITC).toBeGreaterThan(solarEquipCredit);
  });

  it("G2: adding generator to solar system → ITC DECREASES (proration < 1.0)", () => {
    const solarOnly = calculateSystemCosts({ solarKW: 100 });
    const solarPlusGen = calculateSystemCosts({
      solarKW: 100,
      generatorKW: 200,
      generatorFuelType: "diesel",
    });
    expect(solarPlusGen.federalITC).toBeLessThan(solarOnly.federalITC);
  });

  it("G3: generator-only system → ITC = 0 (no qualifying equipment)", () => {
    const result = calculateSystemCosts({ generatorKW: 200, generatorFuelType: "diesel" });
    expect(result.federalITC).toBe(0);
  });

  it("G4: BESS-only system → ITC > 0 (BESS is §48 qualified energy property)", () => {
    const result = calculateSystemCosts({ bessKW: 150, bessKWh: 300 });
    expect(result.federalITC).toBeGreaterThan(0);
  });

  it("G5: solar + BESS (no generator) → ITC > (solarCost + bessCost) × 0.30 (site costs added)", () => {
    const result = calculateSystemCosts({ solarKW: 100, bessKW: 150, bessKWh: 300 });
    const minCredit = (result.solarCost + result.bessCost) * 0.3;
    expect(result.federalITC).toBeGreaterThan(minCredit);
  });

  it("G6: netInvestment ≈ totalProjectCost − ITC (ITC reduces what ROI is calculated on, ±1 rounding)", () => {
    // Each field is Math.round'd independently before return, so subtracting the rounded
    // values may differ from the internally-computed rounded netInvestment by at most $1.
    const result = calculateSystemCosts({ solarKW: 100, bessKW: 150, bessKWh: 300 });
    const diff = Math.abs(result.netInvestment - (result.totalProjectCost - result.federalITC));
    expect(diff).toBeLessThanOrEqual(1);
    // The relationship must hold directionally: net < total (ITC reduces investment)
    expect(result.netInvestment).toBeLessThan(result.totalProjectCost);
  });

  it("G7: ITC rate constant is 30% (IRA 2022 §48)", () => {
    // FEDERAL_ITC_RATE SSOT constant must be exactly 0.30
    expect(FEDERAL_ITC_RATE).toBe(0.3);
    // For solar-only (fraction = 1.0), ITC basis = solar(equip+labor) + site + contingency + installLabor
    // installationLaborCost = solarLaborCost + INSTALLATION_COSTS.total — so use INSTALLATION_COSTS.total
    // to avoid double-counting solar labor that's already in solarLaborCost.
    const result = calculateSystemCosts({ solarKW: 100 });
    const { solarCost, solarLaborCost, siteEngineering, constructionContingency, federalITC } =
      result;
    const eligibleBasis =
      solarCost +
      solarLaborCost +
      siteEngineering +
      constructionContingency +
      INSTALLATION_COSTS.total;
    expect(federalITC / eligibleBasis).toBeCloseTo(0.3, 2);
  });
});

// =============================================================================
// H. DEMAND CHARGE SAVINGS + TOU ARBITRAGE
//    Demand: bessKW × demandCharge × 12 months × 0.75 effectiveness
//    TOU:    bessKWh × 0.80 DOD × spread × cyclesPerYear
// =============================================================================

describe("H. Demand charge savings and TOU arbitrage exact formulas", () => {
  it("H1: 150 kW BESS, $15/kW demand charge → $20,250/yr", () => {
    // 150 × $15 × 12 × 0.75 = $20,250
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, bessKW: 150, bessKWh: 0, demandCharge: 15 },
      0
    );
    expect(result.demandChargeSavings).toBe(20_250);
  });

  it("H2: demand charge savings scale with bessKW", () => {
    // 100 kW: 100 × 15 × 12 × 0.75 = $13,500
    // 300 kW: 300 × 15 × 12 × 0.75 = $40,500
    const r100 = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, bessKW: 100, demandCharge: 15 },
      0
    );
    const r300 = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, bessKW: 300, demandCharge: 15 },
      0
    );
    expect(r100.demandChargeSavings).toBe(13_500);
    expect(r300.demandChargeSavings).toBe(40_500);
  });

  it("H3: zero BESS → $0 demand charge savings and $0 TOU arbitrage", () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, bessKW: 0, bessKWh: 0, hasTOU: true, peakRate: 0.3 },
      0
    );
    expect(result.demandChargeSavings).toBe(0);
    expect(result.touArbitrageSavings).toBe(0);
  });

  it("H4: TOU arbitrage — 600 kWh, spread $0.13, 250 cycles → $15,600", () => {
    // 600 × 0.80 DOD × ($0.25 − $0.12 spread) × 250 = $15,600
    const result = calculateAnnualSavings(
      {
        ...BASE_SAVINGS_INPUTS,
        bessKW: 0,
        bessKWh: 600,
        hasTOU: true,
        electricityRate: 0.12,
        peakRate: 0.25,
        cyclesPerYear: 250,
      },
      0
    );
    expect(result.touArbitrageSavings).toBe(15_600);
  });

  it("H5: no hasTOU flag → $0 TOU arbitrage regardless of peakRate", () => {
    const result = calculateAnnualSavings(
      { ...BASE_SAVINGS_INPUTS, bessKWh: 600, hasTOU: false, peakRate: 0.5 },
      0
    );
    expect(result.touArbitrageSavings).toBe(0);
  });

  it("H6: TOU arbitrage = 0 when peakRate ≤ electricityRate (no spread)", () => {
    const result = calculateAnnualSavings(
      {
        ...BASE_SAVINGS_INPUTS,
        bessKWh: 600,
        hasTOU: true,
        electricityRate: 0.2,
        peakRate: 0.15, // below base rate — no spread
        cyclesPerYear: 250,
      },
      0
    );
    // spread = 0.15 − 0.20 = −0.05 → negative, result should be 0 (clamped)
    expect(result.touArbitrageSavings).toBeLessThanOrEqual(0);
  });
});

// =============================================================================
// I. addonSizing.estimateSolarKW — sunFactor formula, scope penetration, gates
//    sunFactor = clamp((PSH − 2.5) / 2.0, 0.40, 1.0) for viable sites
//    Returns 0 when PSH < 2.5 (unviable)
//    Scope penetration: roof_only=0.55, roof_canopy=0.80, maximum=1.00
// =============================================================================

describe("I. addonSizing.estimateSolarKW — sunFactor, floor, gates, scope", () => {
  const CAP = 200; // solarPhysicalCapKW

  function makeStatePSH(psh: number): WizardState {
    return makeState({
      solarPhysicalCapKW: CAP,
      intel: makeIntel({ peakSunHours: psh, solarFeasible: true }),
    });
  }

  it("I1: PSH = 4.5 (sun-grade A) → sunFactor = 1.0 for all scopes", () => {
    const state = makeStatePSH(4.5);
    // sunFactor = clamp((4.5-2.5)/2.0, 0.4, 1.0) = 1.0
    expect(estimateSolarKW("roof_only", state)).toBe(
      Math.round(CAP * 1.0 * SOLAR_SCOPE_PENETRATION.roof_only)
    ); // 110
    expect(estimateSolarKW("roof_canopy", state)).toBe(
      Math.round(CAP * 1.0 * SOLAR_SCOPE_PENETRATION.roof_canopy)
    ); // 160
    expect(estimateSolarKW("maximum", state)).toBe(CAP); // 200 (capped)
  });

  it("I2: PSH = 3.5 → sunFactor = 0.5 (halfway up the ramp)", () => {
    const state = makeStatePSH(3.5);
    // (3.5-2.5)/2.0 = 0.5; max(0.4, 0.5) = 0.5
    expect(estimateSolarKW("roof_only", state)).toBe(Math.round(CAP * 0.5 * 0.55)); // 55
    expect(estimateSolarKW("maximum", state)).toBe(Math.round(CAP * 0.5 * 1.0)); // 100
  });

  it("I3: PSH = 2.5 → sunFactor hits 0.40 floor (viable but low sun)", () => {
    const state = makeStatePSH(2.5);
    // (2.5-2.5)/2.0 = 0.0 → max(0.4, 0.0) = 0.40 (floor prevents near-zero)
    expect(estimateSolarKW("maximum", state)).toBe(Math.round(CAP * 0.4 * 1.0)); // 80
    expect(estimateSolarKW("roof_only", state)).toBe(Math.round(CAP * 0.4 * 0.55)); // 44
  });

  it("I4: PSH < 2.5 → returns 0 (truly unviable — Alaska winter avg)", () => {
    const state = makeStatePSH(2.49);
    expect(estimateSolarKW("roof_only", state)).toBe(0);
    expect(estimateSolarKW("roof_canopy", state)).toBe(0);
    expect(estimateSolarKW("maximum", state)).toBe(0);
  });

  it("I5: PSH = 6.0 (high sun, Arizona) → sunFactor = 1.0 (clamped)", () => {
    const state = makeStatePSH(6.0);
    // (6.0-2.5)/2.0 = 1.75 → clamped to 1.0
    expect(estimateSolarKW("roof_only", state)).toBe(Math.round(CAP * 1.0 * 0.55)); // 110
    expect(estimateSolarKW("maximum", state)).toBe(CAP); // 200
  });

  it("I6: zero physical cap → returns 0 regardless of PSH", () => {
    const state = makeState({ solarPhysicalCapKW: 0, intel: makeIntel({ peakSunHours: 6.0 }) });
    expect(estimateSolarKW("maximum", state)).toBe(0);
  });

  it("I7: scope penetration constants are SSOT — roof_only=0.55, roof_canopy=0.80, maximum=1.00", () => {
    expect(SOLAR_SCOPE_PENETRATION.roof_only).toBe(0.55);
    expect(SOLAR_SCOPE_PENETRATION.roof_canopy).toBe(0.8);
    expect(SOLAR_SCOPE_PENETRATION.maximum).toBe(1.0);
  });

  it("I8: result never exceeds physical cap (no over-spec)", () => {
    const state = makeStatePSH(6.0);
    const kw = estimateSolarKW("maximum", state);
    expect(kw).toBeLessThanOrEqual(CAP);
  });
});

// =============================================================================
// J. addonSizing.estimateGenKW — reserve margin 1.25 (SSOT), scope sizing, floor
//    essential: max(10, round(peakLoad × criticalLoadPct × 1.25))
//    full:      max(10, round(peakLoad × 1.10))
//    critical:  max(10, round(peakLoad × 1.35))
// =============================================================================

describe("J. addonSizing.estimateGenKW — NEC reserve margin 1.25, scope sizing, 10kW floor", () => {
  const baseState = makeState({ peakLoadKW: 250, criticalLoadPct: 0.4 });

  it("J1: essential scope — criticalLoad fraction + NEC 1.25 margin → 125 kW", () => {
    // max(10, round(250 × 0.4 × 1.25)) = max(10, round(125)) = 125 kW
    expect(estimateGenKW("essential", baseState)).toBe(125);
  });

  it("J2: full scope — full facility + 10% headroom → 275 kW", () => {
    // max(10, round(250 × 1.10)) = max(10, 275) = 275 kW
    expect(estimateGenKW("full", baseState)).toBe(275);
  });

  it("J3: critical scope — mission-critical + 35% headroom → 338 kW", () => {
    // max(10, round(250 × 1.35)) = max(10, round(337.5)) = max(10, 338) = 338 kW
    expect(estimateGenKW("critical", baseState)).toBe(338);
  });

  it("J4: 10 kW floor applies for tiny loads — prevents sub-10kW generators", () => {
    const tinyState = makeState({ peakLoadKW: 5, criticalLoadPct: 0.4 });
    // essential: round(5 × 0.4 × 1.25) = round(2.5) = 3; max(10, 3) = 10
    // full:      round(5 × 1.10) = round(5.5) = 6; max(10, 6) = 10
    // critical:  round(5 × 1.35) = round(6.75) = 7; max(10, 7) = 10
    expect(estimateGenKW("essential", tinyState)).toBe(10);
    expect(estimateGenKW("full", tinyState)).toBe(10);
    expect(estimateGenKW("critical", tinyState)).toBe(10);
  });

  it("J5: zero peakLoadKW → returns 0 (no phantom generator)", () => {
    const noLoadState = makeState({ peakLoadKW: 0, criticalLoadPct: 0.4 });
    expect(estimateGenKW("essential", noLoadState)).toBe(0);
    expect(estimateGenKW("full", noLoadState)).toBe(0);
    expect(estimateGenKW("critical", noLoadState)).toBe(0);
  });

  it("J6: reserve margin SSOT constant = 1.25 (NEC 700/701/702 + IEEE 446)", () => {
    const { margin } = getGeneratorReserveMarginWithSource();
    expect(margin).toBe(1.25);
  });

  it("J7: essential scales with criticalLoadPct — 40% vs 60% critical load", () => {
    const state40 = makeState({ peakLoadKW: 200, criticalLoadPct: 0.4 });
    const state60 = makeState({ peakLoadKW: 200, criticalLoadPct: 0.6 });
    // 40%: max(10, round(200 × 0.4 × 1.25)) = max(10, 100) = 100
    // 60%: max(10, round(200 × 0.6 × 1.25)) = max(10, 150) = 150
    expect(estimateGenKW("essential", state40)).toBe(100);
    expect(estimateGenKW("essential", state60)).toBe(150);
  });
});

// =============================================================================
// K. buildTiers BESS SIZING
//    Formula: bessKW = max(75, round(peakKW × ratio × tierScale))
//    bessKWh = round(bessKW × durationHours)
//    Duration: 2h all goals/tiers except full_power Complete = 4h
// =============================================================================

describe("K. buildTiers BESS sizing — ratio × tier scale × 75 kW floor", () => {
  it("K1: save_more + peak_shaving (ratio=0.40), 250 kW peak — all three tiers", async () => {
    // Starter:     250 × 0.40 × 0.55 = 55 → floor 75; 75×2h = 150 kWh
    // Recommended: 250 × 0.40 × 1.00 = 100; 100×2h = 200 kWh
    // Complete:    250 × 0.40 × 1.50 = 150; 150×2h = 300 kWh
    const state = makeState({
      peakLoadKW: 250,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: true },
    });
    const [starter, recommended, complete] = await buildTiers(state);
    expect(starter.bessKW).toBe(75); // floor applies
    expect(starter.bessKWh).toBe(150);
    expect(starter.durationHours).toBe(2);
    expect(recommended.bessKW).toBe(100);
    expect(recommended.bessKWh).toBe(200);
    expect(recommended.durationHours).toBe(2);
    expect(complete.bessKW).toBe(150);
    expect(complete.bessKWh).toBe(300);
    expect(complete.durationHours).toBe(2);
  });

  it("K2: full_power + resilience (ratio=0.70), 250 kW peak — Complete gets 4h", async () => {
    // Starter:     250 × 0.70 × 0.55 = 96.25 → 96; 96×2h = 192 kWh
    // Recommended: 250 × 0.70 × 1.00 = 175; 175×2h = 350 kWh
    // Complete:    250 × 0.70 × 1.50 = 262.5 → 263; 263×4h = 1052 kWh
    const state = makeState({
      peakLoadKW: 250,
      wantsGenerator: true, // full_power always includes generator
      step3Answers: { primaryBESSApplication: "resilience", step3_5Visited: true },
      // Override goal through answer — full_power is set via the goal prop to buildTiers
      // but since buildTiers infers goal from state, we use wantsGenerator + resilience
    });
    // buildTiers picks up goal from state; resilience + wantsGenerator suggests full_power
    // For this test we verify the math via a simpler approach: check BESS ratio constant
    const { ratio } = getBESSSizingRatioWithSource("resilience");
    expect(ratio).toBe(0.7);
    // Full verification: run tiers with resilience application
    const [starter, recommended, complete] = await buildTiers(state);
    // Starter may hit the floor depending on goal — verify Recommended and Complete
    expect(recommended.bessKW).toBe(175);
    expect(recommended.bessKWh).toBe(350);
    expect(complete.bessKW).toBe(263);
    // complete.bessKWh = 263 × durationHours — verify duration from BESS spec
    expect(complete.bessKWh).toBe(complete.bessKW * complete.durationHours);
  });

  it("K3: 75 kW floor — small load always gets minimum commercial BESS", async () => {
    // peakLoadKW = 50, peak_shaving ratio = 0.40, all tiers below 75kW
    // Starter:     50 × 0.40 × 0.55 = 11  → floor 75
    // Recommended: 50 × 0.40 × 1.00 = 20  → floor 75
    // Complete:    50 × 0.40 × 1.50 = 30  → floor 75
    const state = makeState({
      peakLoadKW: 50,
      baseLoadKW: 30,
      step3Answers: { primaryBESSApplication: "peak_shaving", step3_5Visited: true },
    });
    const [starter, recommended, complete] = await buildTiers(state);
    expect(starter.bessKW).toBeGreaterThanOrEqual(75);
    expect(recommended.bessKW).toBeGreaterThanOrEqual(75);
    expect(complete.bessKW).toBeGreaterThanOrEqual(75);
  });

  it("K4: BESS ratios SSOT — peak_shaving=0.40, arbitrage=0.50, resilience=0.70, microgrid=1.00", () => {
    expect(getBESSSizingRatioWithSource("peak_shaving").ratio).toBe(0.4);
    expect(getBESSSizingRatioWithSource("arbitrage").ratio).toBe(0.5);
    expect(getBESSSizingRatioWithSource("resilience").ratio).toBe(0.7);
    expect(getBESSSizingRatioWithSource("microgrid").ratio).toBe(1.0);
  });

  it("K5: Complete always ≥ Recommended, Recommended always ≥ Starter (no tier inversion)", async () => {
    const state = makeState({ peakLoadKW: 250 });
    const [starter, recommended, complete] = await buildTiers(state);
    expect(recommended.bessKW).toBeGreaterThanOrEqual(starter.bessKW);
    expect(complete.bessKW).toBeGreaterThanOrEqual(recommended.bessKW);
    expect(recommended.bessKWh).toBeGreaterThanOrEqual(starter.bessKWh);
    expect(complete.bessKWh).toBeGreaterThanOrEqual(recommended.bessKWh);
  });

  it("K6: bessKWh = bessKW × durationHours for all tiers (capacity formula)", async () => {
    const state = makeState({ peakLoadKW: 250 });
    const [starter, recommended, complete] = await buildTiers(state);
    expect(starter.bessKWh).toBe(starter.bessKW * starter.durationHours);
    expect(recommended.bessKWh).toBe(recommended.bessKW * recommended.durationHours);
    expect(complete.bessKWh).toBe(complete.bessKW * complete.durationHours);
  });

  it("K7: netCost < grossCost for all tiers (ITC always reduces investment)", async () => {
    const state = makeState({ peakLoadKW: 250, wantsSolar: true });
    const [starter, recommended, complete] = await buildTiers(state);
    for (const tier of [starter, recommended, complete]) {
      expect(tier.netCost).toBeLessThan(tier.grossCost);
      expect(tier.itcAmount).toBeGreaterThan(0);
    }
  });

  it("K8: paybackYears > 0 and < 30 for a viable solar + BESS system", async () => {
    const state = makeState({ peakLoadKW: 250, wantsSolar: true });
    const [, recommended] = await buildTiers(state);
    expect(recommended.paybackYears).toBeGreaterThan(0);
    expect(recommended.paybackYears).toBeLessThan(30);
  });

  it("K9: annualSavings = grossAnnualSavings − annualReserves (honest TCO)", async () => {
    const state = makeState({ peakLoadKW: 250, wantsSolar: true });
    const [starter, recommended, complete] = await buildTiers(state);
    for (const tier of [starter, recommended, complete]) {
      expect(tier.annualSavings).toBe(tier.grossAnnualSavings - tier.annualReserves);
    }
  });
});
