import { describe, expect, it } from "vitest";
import { applyDataCenterFinancials, resolveDataCenterItLoadKW } from "../dataCenterFinancials";

function calcLargeDc(ups: string) {
  return applyDataCenterFinancials({
    itLoadKW: 22_024,
    bessKW: 9_273,
    bessKWh: 18_546,
    generatorCost: 17_618_690,
    totalNetInvestment: 28_960_947,
    baseAnnualSavings: 952_091,
    baseEnergySavingsNet: 819_099,
    demandChargePerKWMonth: 9,
    existingUps: ups,
  });
}

describe("dataCenterFinancials", () => {
  it("splits generator from energy net investment", () => {
    const result = calcLargeDc("lead-acid");
    expect(result.energyNetInvestment).toBe(28_960_947 - 17_618_690);
    expect(result.resilienceNetInvestment).toBe(17_618_690);
  });

  it("materially shortens energy payback vs total-project for large DC + generator", () => {
    const result = calcLargeDc("lead-acid");
    expect(result.paybackYearsEnergy).toBeLessThan(10);
    expect(result.paybackYearsTotal).toBeGreaterThan(result.paybackYearsEnergy + 5);
    expect(result.generatorPaybackDragYears).toBeGreaterThan(8);
  });

  it("adds UPS displacement savings for lead-acid stacks", () => {
    const result = calcLargeDc("lead-acid");
    expect(result.upsDisplacementSavings).toBeGreaterThan(400_000);
    expect(result.dcAddOnSavings).toBeGreaterThan(result.capacityDeferralSavings);
  });

  it("skips UPS displacement when facility has no UPS", () => {
    const result = calcLargeDc("none");
    expect(result.upsDisplacementSavings).toBe(0);
  });

  it("resolves IT load from facility details when available", () => {
    expect(
      resolveDataCenterItLoadKW(
        {
          industry: "data_center",
          itLoadKW: 22_024,
          pueBand: 1.4,
          effectivePue: 1.36,
          coolingKW: 5000,
          evaporativeCooling: true,
          wueLitersPerKWh: 0.5,
          annualWaterGallons: 1000,
        },
        30_000,
        1.36
      )
    ).toBe(22_024);
  });
});
