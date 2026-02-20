/**
 * V7 WIZARD FLOW INTEGRATION TESTS
 * =================================
 *
 * Created: February 2026
 *
 * Tests the full V7 wizard data flow WITHOUT a browser:
 * - Industry resolution for all registered industries
 * - Calculator adapter execution for all industries
 * - Partial skip default-merge logic
 * - New shopping_center and microgrid industries
 *
 * These tests complement the Playwright smoke tests by validating
 * the data layer independently of the UI.
 */

import { describe, it, expect } from "vitest";
import { resolveIndustryContext, listCanonicalSlugs } from "../../industry/resolveIndustryContext";
import { CALCULATORS_BY_ID } from "../../calculators/registry";
import { INDUSTRY_CATALOG } from "../../industry/industryCatalog";
import { buildSSOTInput, SSOT_ALIASES, type AliasIndustry } from "../../calculators/ssotInputAliases";
import { getSizingDefaults } from "../../pricing/pricingBridge";
import { INDUSTRY_META, getIndustryMeta, canonicalizeSlug } from "../../industryMeta";

// ============================================================================
// INDUSTRY RESOLUTION — all industries resolve correctly
// ============================================================================

describe("V7 Flow: Industry Resolution", () => {
  const canonicalSlugs = listCanonicalSlugs();

  it("all canonical slugs resolve to themselves", () => {
    const broken: string[] = [];
    for (const slug of canonicalSlugs) {
      const ctx = resolveIndustryContext(slug);
      if (ctx.canonicalSlug !== slug) {
        broken.push(`${slug} → ${ctx.canonicalSlug}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("shopping_center resolves as its own industry (not aliased to retail)", () => {
    const ctx = resolveIndustryContext("shopping_center");
    expect(ctx.canonicalSlug).toBe("shopping_center");
    expect(ctx.calculatorId).toBe("shopping_center_load_v1");
    expect(ctx.trace.reason).not.toBe("fallback");
  });

  it("microgrid resolves as its own industry", () => {
    const ctx = resolveIndustryContext("microgrid");
    expect(ctx.canonicalSlug).toBe("microgrid");
    expect(ctx.calculatorId).toBe("microgrid_load_v1");
    expect(ctx.trace.reason).not.toBe("fallback");
  });

  it("shopping-center alias resolves to shopping_center", () => {
    const ctx = resolveIndustryContext("shopping-center");
    expect(ctx.canonicalSlug).toBe("shopping_center");
  });

  it("micro-grid alias resolves to microgrid", () => {
    const ctx = resolveIndustryContext("micro-grid");
    expect(ctx.canonicalSlug).toBe("microgrid");
  });

  it("mall alias resolves to shopping_center", () => {
    const ctx = resolveIndustryContext("mall");
    expect(ctx.canonicalSlug).toBe("shopping_center");
  });

  it("unknown slug resolves to other (not crash)", () => {
    const ctx = resolveIndustryContext("does-not-exist");
    expect(ctx.canonicalSlug).toBe("other");
    expect(ctx.trace.reason).toBe("fallback");
  });
});

// ============================================================================
// CALCULATOR EXECUTION — all adapters produce valid results
// ============================================================================

describe("V7 Flow: Calculator Execution", () => {
  const testableIndustries = INDUSTRY_CATALOG.filter(
    (e) => e.canonicalSlug !== "other" && e.canonicalSlug !== "auto"
  );

  for (const entry of testableIndustries) {
    it(`${entry.canonicalSlug}: adapter runs without error`, () => {
      const calc = CALCULATORS_BY_ID[entry.calculatorId];
      expect(calc, `Missing calculator: ${entry.calculatorId}`).toBeDefined();

      // Build minimal inputs from SSOT aliases (use defaults)
      const aliasKey = entry.canonicalSlug as AliasIndustry;
      const aliasMap = SSOT_ALIASES[aliasKey];
      const inputs: Record<string, unknown> = {};
      if (aliasMap) {
        for (const [field, def] of Object.entries(aliasMap)) {
          inputs[field] = def.ssotDefault;
        }
      }

      const result = calc.compute(inputs);

      // Basic structural checks
      expect(result.peakLoadKW).toBeGreaterThan(0);
      expect(result.baseLoadKW).toBeGreaterThanOrEqual(0);
      expect(result.energyKWhPerDay).toBeGreaterThan(0);
      expect(Array.isArray(result.assumptions)).toBe(true);
    });
  }

  it("shopping_center: produces reasonable kW for 100,000 sqft (10 W/sqft)", () => {
    const calc = CALCULATORS_BY_ID["shopping_center_load_v1"];
    const result = calc.compute({ squareFootage: 100000 });
    // 100,000 sqft * 10 W/sqft = 1000 kW
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(800);
    expect(result.peakLoadKW).toBeLessThanOrEqual(1200);
  });

  it("shopping_center: TrueQuote envelope is v1 with ≥3 contributors", () => {
    const calc = CALCULATORS_BY_ID["shopping_center_load_v1"];
    const result = calc.compute({ squareFootage: 100000 });
    expect(result.validation?.version).toBe("v1");
    const contributors = result.validation?.kWContributors;
    expect(contributors).toBeDefined();
    const nonZero = Object.values(contributors!).filter((v) => v > 0);
    expect(nonZero.length).toBeGreaterThanOrEqual(3);
  });

  it("microgrid (sqft path): produces reasonable kW for 50,000 sqft", () => {
    const calc = CALCULATORS_BY_ID["microgrid_load_v1"];
    const result = calc.compute({ squareFootage: 50000 });
    // 50,000 sqft * 8 W/sqft = 400 kW
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(300);
    expect(result.peakLoadKW).toBeLessThanOrEqual(500);
  });

  it("microgrid (EV path): EV chargers produce higher kW", () => {
    const calc = CALCULATORS_BY_ID["microgrid_load_v1"];
    const resultEV = calc.compute({ level2Chargers: 20, dcfcChargers: 10 });
    const resultSqFt = calc.compute({ squareFootage: 50000 });
    // EV path should produce significantly more power than 50k sqft
    expect(resultEV.peakLoadKW).toBeGreaterThan(resultSqFt.peakLoadKW);
  });

  it("microgrid: TrueQuote envelope is v1 with ≥3 contributors", () => {
    const calc = CALCULATORS_BY_ID["microgrid_load_v1"];
    const result = calc.compute({ squareFootage: 50000 });
    expect(result.validation?.version).toBe("v1");
    const contributors = result.validation?.kWContributors;
    expect(contributors).toBeDefined();
    const nonZero = Object.values(contributors!).filter((v) => v > 0);
    expect(nonZero.length).toBeGreaterThanOrEqual(3);
  });
});

// ============================================================================
// SSOT INPUT ALIASES — field name translation works
// ============================================================================

describe("V7 Flow: SSOT Input Aliases", () => {
  it("shopping_center: squareFootage maps to squareFeet", () => {
    const ssotInput = buildSSOTInput("shopping_center", { squareFootage: 75000 });
    expect(ssotInput.squareFeet).toBe(75000);
  });

  it("microgrid: squareFootage maps to sqFt", () => {
    const ssotInput = buildSSOTInput("microgrid", { squareFootage: 60000 });
    expect(ssotInput.sqFt).toBe(60000);
  });

  it("microgrid: level2Chargers maps to numberOfLevel2Chargers", () => {
    const ssotInput = buildSSOTInput("microgrid", { level2Chargers: 10, dcfcChargers: 5 });
    expect(ssotInput.numberOfLevel2Chargers).toBe(10);
    expect(ssotInput.numberOfDCFastChargers).toBe(5);
  });
});

// ============================================================================
// PARTIAL SKIP DEFAULT MERGE — validates the merge logic from P1
// ============================================================================

describe("V7 Flow: Partial Skip Default Merge", () => {
  /**
   * Simulates the merge logic from submitStep3Partial:
   * Priority: user answer > template.defaults > question.defaultValue
   */
  function mergeDefaults(
    templateDefaults: Record<string, unknown> | undefined,
    questions: Array<{ id: string; defaultValue?: unknown }>,
    userAnswers: Record<string, unknown>
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = {};

    // 1. Template-level defaults
    if (templateDefaults) {
      for (const [key, val] of Object.entries(templateDefaults)) {
        if (val !== undefined && val !== null) merged[key] = val;
      }
    }

    // 2. Per-question defaults (fill gaps)
    for (const q of questions) {
      if (q.defaultValue !== undefined && q.defaultValue !== null && !(q.id in merged)) {
        merged[q.id] = q.defaultValue;
      }
    }

    // 3. User answers (override everything)
    for (const [key, val] of Object.entries(userAnswers)) {
      if (val !== undefined && val !== null) merged[key] = val;
    }

    return merged;
  }

  it("user answers override template defaults", () => {
    const result = mergeDefaults(
      { roomCount: 150, hotelClass: "midscale" },
      [{ id: "roomCount", defaultValue: 100 }],
      { roomCount: 200 }
    );
    expect(result.roomCount).toBe(200);
  });

  it("template defaults fill gaps where user has no answer", () => {
    const result = mergeDefaults(
      { roomCount: 150, hotelClass: "midscale" },
      [],
      { roomCount: 200 }
    );
    expect(result.roomCount).toBe(200);
    expect(result.hotelClass).toBe("midscale"); // filled from template
  });

  it("question defaults fill gaps not covered by template defaults", () => {
    const result = mergeDefaults(
      { roomCount: 150 },
      [{ id: "hotelClass", defaultValue: "luxury" }],
      {}
    );
    expect(result.roomCount).toBe(150); // from template
    expect(result.hotelClass).toBe("luxury"); // from question default
  });

  it("empty user answers produces full defaults", () => {
    const result = mergeDefaults(
      { bayCount: 4 },
      [
        { id: "washType", defaultValue: "tunnel" },
        { id: "operatingHours", defaultValue: 12 },
      ],
      {}
    );
    expect(result.bayCount).toBe(4);
    expect(result.washType).toBe("tunnel");
    expect(result.operatingHours).toBe(12);
  });

  it("null/undefined user answers are ignored", () => {
    const result = mergeDefaults(
      { bedCount: 250 },
      [],
      { bedCount: null as unknown as number, extra: undefined as unknown }
    );
    expect(result.bedCount).toBe(250); // null user answer → default preserved
  });
});

// ============================================================================
// INDUSTRY META — shopping_center and microgrid have entries
// ============================================================================

describe("V7 Flow: Industry Meta for New Industries", () => {
  it("shopping_center has INDUSTRY_META entry", () => {
    expect(INDUSTRY_META.shopping_center).toBeDefined();
    expect(INDUSTRY_META.shopping_center.icon).toBe("🏬");
    expect(INDUSTRY_META.shopping_center.slug).toBe("shopping_center");
  });

  it("microgrid has INDUSTRY_META entry", () => {
    expect(INDUSTRY_META.microgrid).toBeDefined();
    expect(INDUSTRY_META.microgrid.icon).toBe("🔋");
    expect(INDUSTRY_META.microgrid.slug).toBe("microgrid");
  });

  it("getIndustryMeta works for shopping_center", () => {
    const meta = getIndustryMeta("shopping_center");
    expect(meta.label).toBe("Shopping Center / Mall");
  });

  it("getIndustryMeta works for microgrid", () => {
    const meta = getIndustryMeta("microgrid");
    expect(meta.label).toBe("Microgrid");
  });

  it("canonicalizeSlug no longer aliases shopping_center to retail", () => {
    const result = canonicalizeSlug("shopping_center");
    expect(result).toBe("shopping_center");
    expect(result).not.toBe("retail");
  });
});

// ============================================================================
// PRICING BRIDGE — sizing defaults for new industries
// ============================================================================

describe("V7 Flow: Pricing Bridge for New Industries", () => {
  it("shopping_center gets dedicated sizing defaults", () => {
    const defaults = getSizingDefaults("shopping_center");
    expect(defaults.ratio).toBe(0.4);
    expect(defaults.hours).toBe(4);
  });

  it("microgrid gets dedicated sizing defaults", () => {
    const defaults = getSizingDefaults("microgrid");
    expect(defaults.ratio).toBe(0.6);
    expect(defaults.hours).toBe(4);
  });

  it("shopping-center hyphenated also works", () => {
    const defaults = getSizingDefaults("shopping-center");
    expect(defaults.ratio).toBe(0.4);
  });
});
