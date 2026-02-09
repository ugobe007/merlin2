/**
 * Unit tests for pricingSanity.ts — Math Poison Detector
 * Phase 6: Pricing Non-Blocking
 */
import { describe, it, expect } from "vitest";
import {
  sanityCheckQuote,
  sanitizeQuoteForDisplay,
  type PricingSanity,
} from "../pricingSanity";

describe("sanityCheckQuote", () => {
  it("should return ok:true for null/undefined quote", () => {
    expect(sanityCheckQuote(null)).toEqual({ ok: true, warnings: [] });
    expect(sanityCheckQuote(undefined)).toEqual({ ok: true, warnings: [] });
  });

  it("should return ok:true for empty object", () => {
    expect(sanityCheckQuote({})).toEqual({ ok: true, warnings: [] });
  });

  it("should return ok:true for valid quote with no poison", () => {
    const validQuote = {
      totalCost: 150000,
      capexTotal: 120000,
      annualSavings: 25000,
      roiYears: 6,
      storageSizeMW: 0.5,
      durationHours: 4,
    };
    const result = sanityCheckQuote(validQuote);
    expect(result.ok).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("should detect NaN in totalCost", () => {
    const badQuote = {
      totalCost: NaN,
    };
    const result = sanityCheckQuote(badQuote);
    expect(result.ok).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("NaN") || w.includes("finite"))).toBe(true);
  });

  it("should detect Infinity in nested field", () => {
    const badQuote = {
      pricing: {
        total: Infinity,
      },
    };
    const result = sanityCheckQuote(badQuote);
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.includes("finite") || w.includes("pricing.total"))).toBe(
      true
    );
  });

  it("should detect negative totalCost", () => {
    const badQuote = {
      totalCost: -50000,
    };
    const result = sanityCheckQuote(badQuote);
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.includes("negative"))).toBe(true);
  });

  it("should detect zero storageSizeMW", () => {
    const badQuote = {
      storageSizeMW: 0,
    };
    const result = sanityCheckQuote(badQuote);
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.includes("storageSizeMW"))).toBe(true);
  });

  it("should detect negative durationHours", () => {
    const badQuote = {
      durationHours: -4,
    };
    const result = sanityCheckQuote(badQuote);
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.includes("durationHours"))).toBe(true);
  });

  it("should detect unreasonable ROI (>100 years)", () => {
    const badQuote = {
      roiYears: 150,
    };
    const result = sanityCheckQuote(badQuote);
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.includes("100 years"))).toBe(true);
  });

  it("should handle deeply nested NaN", () => {
    const badQuote = {
      summary: {
        financials: {
          breakdown: {
            itemCost: NaN,
          },
        },
      },
    };
    const result = sanityCheckQuote(badQuote);
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.includes("summary.financials.breakdown.itemCost"))).toBe(
      true
    );
  });

  it("should handle array with NaN", () => {
    const badQuote = {
      lineItems: [
        { cost: 100 },
        { cost: NaN },
        { cost: 200 },
      ],
    };
    const result = sanityCheckQuote(badQuote);
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.includes("[1]"))).toBe(true);
  });
});

describe("sanitizeQuoteForDisplay", () => {
  it("should return typed empty DisplayQuote for null/undefined", () => {
    const nullResult = sanitizeQuoteForDisplay(null);
    expect(nullResult.pricingComplete).toBe(false);
    expect(nullResult.peakLoadKW).toBeNull();
    expect(nullResult._displayHints).toBeDefined();
    expect(nullResult._displayHints.topContributors).toHaveLength(0);

    const undefinedResult = sanitizeQuoteForDisplay(undefined);
    expect(undefinedResult.pricingComplete).toBe(false);
    expect(undefinedResult.capexUSD).toBeNull();
  });

  it("should return copy of valid quote unchanged", () => {
    const validQuote = {
      peakLoadKW: 500,
      capexUSD: 150000,
    };
    const result = sanitizeQuoteForDisplay(validQuote);
    expect(result.peakLoadKW).toBe(500);
    expect(result.capexUSD).toBe(150000);
  });

  it("should collect non-known fields into _extra", () => {
    const validQuote = {
      totalCost: 150000,
      name: "Test Quote",
    };
    const result = sanitizeQuoteForDisplay(validQuote);
    expect(result._extra?.totalCost).toBe(150000);
    expect(result._extra?.name).toBe("Test Quote");
  });

  it("should replace NaN with null for safe display (known field)", () => {
    const badQuote = {
      capexUSD: NaN,
      peakLoadKW: 200,
    };
    const result = sanitizeQuoteForDisplay(badQuote);
    expect(result.capexUSD).toBe(null);
    expect(result.peakLoadKW).toBe(200);
  });

  it("should replace NaN in _extra with null", () => {
    const badQuote = {
      totalCost: NaN,
      name: "Test",
    };
    const result = sanitizeQuoteForDisplay(badQuote);
    expect(result._extra?.totalCost).toBe(null);
    expect(result._extra?.name).toBe("Test");
  });

  it("should replace Infinity with null", () => {
    const badQuote = {
      annualSavingsUSD: Infinity,
      roiYears: -Infinity,
    };
    const result = sanitizeQuoteForDisplay(badQuote);
    expect(result.annualSavingsUSD).toBe(null);
    expect(result.roiYears).toBe(null);
  });

  it("should replace Infinity in _extra with null", () => {
    const badQuote = {
      cost: Infinity,
      savings: -Infinity,
    };
    const result = sanitizeQuoteForDisplay(badQuote);
    expect(result._extra?.cost).toBe(null);
    expect(result._extra?.savings).toBe(null);
  });
});

describe("PricingSanity type contract", () => {
  it("should have ok boolean and warnings array", () => {
    const result: PricingSanity = sanityCheckQuote({});
    expect(typeof result.ok).toBe("boolean");
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
