/**
 * /how-we-get-paid, quote.js, and pricingServiceV45 all read
 * pricing/orchestrationFee.ts. A local fee table in any of them fails this.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ORCHESTRATION_FEE_LABEL,
  calculateMerlinFees as feeFromConstant,
  orchestrationFeeArgument,
} from "../../../../pricing/orchestrationFee";
import { calculateMerlinFees } from "../../../../server/routes/quote.js";
import { calculateMerlinFees as feeFromPricingService } from "../../../services/pricingServiceV45";
import HowWeGetPaidPage from "../HowWeGetPaidPage";

const EQUIPMENT = [189_970, 199_999, 200_001, 500_000, 900_000];

describe("orchestration fee agreement", () => {
  it("the quote charges the orchestration constant", () => {
    for (const equipment of EQUIPMENT) {
      expect(calculateMerlinFees(equipment).totalFee).toBe(feeFromConstant(equipment).totalFee);
      expect(calculateMerlinFees(equipment).effectiveMargin).toBe(
        feeFromConstant(equipment).effectiveMargin
      );
    }
  });

  it("the shipped fee page shows that same fee", () => {
    const html = renderToStaticMarkup(<HowWeGetPaidPage />);
    const argument = orchestrationFeeArgument();
    expect(html).toContain(ORCHESTRATION_FEE_LABEL);
    expect(html).toContain(argument.heading);
    if (argument.claim) expect(html).toContain(argument.claim);
  });

  it("the fee does not fall when the equipment rises", () => {
    const across = calculateMerlinFees(200_001).totalFee - calculateMerlinFees(199_999).totalFee;
    expect(across).toBeGreaterThanOrEqual(0);
    let previous = -1;
    let fellAt = -1;
    for (let equipment = 50_000; equipment <= 1_200_000; equipment += 10) {
      const fee = calculateMerlinFees(equipment).totalFee;
      if (fee < previous) {
        fellAt = equipment;
        break;
      }
      previous = fee;
    }
    expect(fellAt).toBe(-1);
  });

  it("pricingServiceV45 charges the same orchestration constant", () => {
    for (const equipment of EQUIPMENT) {
      expect(feeFromPricingService(equipment).totalFee).toBe(feeFromConstant(equipment).totalFee);
      expect(feeFromPricingService(equipment).effectiveMargin).toBe(
        feeFromConstant(equipment).effectiveMargin
      );
    }
  });
});
