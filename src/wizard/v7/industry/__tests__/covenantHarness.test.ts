/**
 * COVENANT HARNESS — Step API Contract Test
 * ==========================================
 *
 * Created: February 2026
 *
 * PURPOSE:
 * Exercises the EXACT same function call sequence that the UI uses
 * for every industry. If Step 3 or Step 4 would break for an industry,
 * this test catches it BEFORE it reaches the user.
 *
 * WHAT THIS TESTS (for EVERY industry in the catalog):
 * 1. resolveIndustryContext returns valid ctx
 * 2. ctx.templateKey resolves to a loadable template (or null for non-template)
 * 3. ctx.calculatorId resolves to a registered calculator
 * 4. ctx.schemaKey resolves to a non-empty schema (Step 3)
 * 5. Tier-1 blocker questions are a subset of the schema
 * 6. Resolution trace is present and well-formed
 * 7. All fields in the trace agree with ctx fields
 *
 * WHY THIS IS DIFFERENT FROM industryCatalog.test.ts:
 * industryCatalog.test.ts verifies the CATALOG is well-formed.
 * This test verifies the COMPLETE FLOW that the UI actually exercises
 * matches what the catalog promises. It's the covenant between the
 * catalog declaration and the runtime resolution.
 */

import { describe, it, expect } from "vitest";
import {
  resolveIndustryContext,
  listCanonicalSlugs,
  type IndustryContext,
} from "../resolveIndustryContext";
import { INDUSTRY_CATALOG } from "../industryCatalog";
import { resolveStep3Schema, hasCuratedSchema, getTier1Blockers } from "../../schema/curatedFieldsResolver";
import { getTemplate } from "../../templates/templateIndex";
import { CALCULATORS_BY_ID } from "../../calculators/registry";

// ============================================================================
// Pillar 1: Every canonical slug → valid IndustryContext with trace
// ============================================================================

describe("Covenant Harness: Pillar 1 — IndustryContext Completeness", () => {
  const slugs = listCanonicalSlugs();

  it("catalog has at least 20 entries", () => {
    expect(slugs.length).toBeGreaterThanOrEqual(20);
  });

  describe.each(slugs)("%s", (slug) => {
    let ctx: IndustryContext;

    // This is what the UI calls
    it("resolveIndustryContext returns a valid context", () => {
      ctx = resolveIndustryContext(slug);
      expect(ctx).toBeDefined();
      expect(ctx.canonicalSlug).toBe(slug);
      expect(ctx.templateKey).toBeTruthy();
      expect(ctx.calculatorId).toBeTruthy();
      expect(ctx.schemaKey).toBeTruthy();
      expect(ctx.sizingDefaults).toBeDefined();
      expect(ctx.sizingDefaults.ratio).toBeGreaterThan(0);
      expect(ctx.sizingDefaults.hours).toBeGreaterThan(0);
    });

    it("has a well-formed resolution trace", () => {
      ctx = resolveIndustryContext(slug);
      const trace = ctx.trace;
      expect(trace).toBeDefined();
      expect(trace.rawIndustry).toBe(slug);
      expect(trace.normalizedInput).toBe(slug.toLowerCase());
      expect(trace.canonicalSlug).toBe(slug);
      expect(trace.templateKey).toBe(ctx.templateKey);
      expect(trace.schemaKey).toBe(ctx.schemaKey);
      expect(trace.calculatorId).toBe(ctx.calculatorId);
      expect(trace.resolvedAt).toBeTruthy();
      // reason should be 'exact' for canonical slugs
      expect(trace.reason).toBe("exact");
    });

    it("trace borrowedFrom is consistent with template/schema keys", () => {
      ctx = resolveIndustryContext(slug);
      const { trace } = ctx;
      if (trace.templateKey === trace.canonicalSlug && trace.schemaKey === trace.canonicalSlug) {
        // Not borrowed — borrowedFrom should be undefined
        expect(trace.borrowedFrom).toBeUndefined();
      } else {
        // Borrowed — borrowedFrom should be set
        expect(trace.borrowedFrom).toBeTruthy();
      }
    });
  });
});

// ============================================================================
// Pillar 2: Template Resolution — ctx.templateKey always loadable
// ============================================================================

describe("Covenant Harness: Pillar 2 — Template Loadability", () => {
  const slugs = listCanonicalSlugs();

  describe.each(slugs)("%s", (slug) => {
    it("ctx.templateKey is always loadable via getTemplate", () => {
      const ctx = resolveIndustryContext(slug);
      // Every industry's templateKey must point to a loadable template
      const tpl = getTemplate(ctx.templateKey);
      expect(tpl).toBeDefined();
      expect(tpl!.industry).toBe(ctx.templateKey);
    });

    it("if ctx.hasTemplate is true, templateKey matches canonicalSlug", () => {
      const ctx = resolveIndustryContext(slug);
      // hasTemplate=true means industry has its OWN template (not borrowed)
      if (ctx.hasTemplate) {
        expect(ctx.templateKey).toBe(ctx.canonicalSlug);
      }
    });
  });
});

// ============================================================================
// Pillar 3: Calculator Resolution — ctx.calculatorId always registered
// ============================================================================

describe("Covenant Harness: Pillar 3 — Calculator Registration", () => {
  const slugs = listCanonicalSlugs();

  describe.each(slugs)("%s", (slug) => {
    it("ctx.calculatorId is registered in CALCULATORS_BY_ID", () => {
      const ctx = resolveIndustryContext(slug);
      const calc = CALCULATORS_BY_ID[ctx.calculatorId];
      expect(calc).toBeDefined();
      expect(calc.id).toBe(ctx.calculatorId);
    });
  });
});

// ============================================================================
// Pillar 4: Schema Resolution — ctx.schemaKey always produces schema
// ============================================================================

describe("Covenant Harness: Pillar 4 — Schema Resolvability", () => {
  const slugs = listCanonicalSlugs();

  describe.each(slugs)("%s", (slug) => {
    it("resolveStep3Schema(slug) returns a non-empty schema", () => {
      const schema = resolveStep3Schema(slug);
      expect(schema).toBeDefined();
      expect(schema.questions).toBeDefined();
      expect(schema.questions.length).toBeGreaterThan(0);
      expect(schema.questionCount).toBeGreaterThan(0);
    });

    it("if ctx.hasCuratedSchema is true, hasCuratedSchema() confirms it", () => {
      const ctx = resolveIndustryContext(slug);
      // If catalog promises curated, runtime must deliver
      if (ctx.hasCuratedSchema) {
        expect(hasCuratedSchema(slug)).toBe(true);
      }
      // Note: hasCuratedSchema() may return true even if catalog says false
      // (legacy schemas exist but aren't flagged in catalog yet)
    });
  });
});

// ============================================================================
// Pillar 5: Blocker Integrity — Tier-1 blockers ⊂ schema questions
// ============================================================================

describe("Covenant Harness: Pillar 5 — Blocker Integrity", () => {
  const slugs = listCanonicalSlugs();

  describe.each(slugs)("%s", (slug) => {
    it("Tier-1 blockers (if any) are a subset of schema question IDs", () => {
      const blockers = getTier1Blockers(slug);
      if (blockers.length === 0) return; // Not all industries have blockers

      const schema = resolveStep3Schema(slug);
      const questionIds = new Set(schema.questions.map((q: any) => q.id));

      for (const blocker of blockers) {
        expect(
          questionIds.has(blocker),
          `Blocker "${blocker}" not found in ${slug} schema questions: [${[...questionIds].join(", ")}]`
        ).toBe(true);
      }
    });
  });
});

// ============================================================================
// Pillar 6: Alias Resolution — Aliases produce same ctx as canonical
// ============================================================================

describe("Covenant Harness: Pillar 6 — Alias Consistency", () => {
  for (const entry of INDUSTRY_CATALOG) {
    if (entry.aliases.length === 0) continue;

    describe(entry.canonicalSlug, () => {
      const canonicalCtx = resolveIndustryContext(entry.canonicalSlug);

      it.each(entry.aliases)("alias '%s' resolves to same resources", (alias) => {
        const aliasCtx = resolveIndustryContext(alias);

        // Same resources
        expect(aliasCtx.canonicalSlug).toBe(canonicalCtx.canonicalSlug);
        expect(aliasCtx.templateKey).toBe(canonicalCtx.templateKey);
        expect(aliasCtx.calculatorId).toBe(canonicalCtx.calculatorId);
        expect(aliasCtx.schemaKey).toBe(canonicalCtx.schemaKey);

        // But trace records the alias
        expect(aliasCtx.trace.rawIndustry).toBe(alias);
        expect(aliasCtx.trace.reason).toBe("alias");
      });
    });
  }
});

// ============================================================================
// Pillar 7: Hyphen/Underscore Variant Resolution
// ============================================================================

describe("Covenant Harness: Pillar 7 — Variant Consistency", () => {
  const variantTests = [
    { input: "car-wash", expected: "car_wash" },
    { input: "data-center", expected: "data_center" },
    { input: "ev-charging", expected: "ev_charging" },
    { input: "gas-station", expected: "gas_station" },
    { input: "cold-storage", expected: "cold_storage" },
    { input: "indoor-farm", expected: "indoor_farm" },
  ];

  it.each(variantTests)(
    "hyphen variant '$input' resolves to '$expected'",
    ({ input, expected }) => {
      const ctx = resolveIndustryContext(input);
      expect(ctx.canonicalSlug).toBe(expected);
      // May be 'alias' (if in explicit alias list) or 'variant' (auto-generated)
      expect(["alias", "variant"]).toContain(ctx.trace.reason);
    }
  );
});

// ============================================================================
// Pillar 8: Fallback Safety — Unknown inputs resolve gracefully
// ============================================================================

describe("Covenant Harness: Pillar 8 — Fallback Safety", () => {
  const unknownInputs = [
    "martian_base",
    "underwater_hotel",
    "",
    "   ",
    // Note: 'unknown' is an explicit alias of 'other' (reason='alias', not 'fallback')
    "null",
    "undefined",
    "zzz_nonexistent",
  ];

  it.each(unknownInputs)("unknown input '%s' falls back to 'other'", (input) => {
    const ctx = resolveIndustryContext(input);
    expect(ctx.canonicalSlug).toBe("other");
    expect(ctx.trace.reason).toBe("fallback");
    // Fallback should still have valid resources
    expect(ctx.calculatorId).toBeTruthy();
    expect(ctx.schemaKey).toBeTruthy();
  });
});

// ============================================================================
// Pillar 9: End-to-End Flow — Simulate what useWizardV7 does
// ============================================================================

describe("Covenant Harness: Pillar 9 — E2E UI Flow Simulation", () => {
  const coreIndustries = [
    "hotel",
    "car_wash",
    "data_center",
    "ev_charging",
    "hospital",
    "manufacturing",
    "office",
    "restaurant",
    "retail",
    "warehouse",
  ];

  describe.each(coreIndustries)("%s", (industry) => {
    it("full Step 3 + Step 4 flow succeeds", () => {
      // Step 1: Resolve context (what useWizardV7 does on industry select)
      const ctx = resolveIndustryContext(industry);
      expect(ctx).toBeDefined();

      // Step 2: Load template (what loadStep3Template does)
      if (ctx.hasTemplate) {
        const tpl = getTemplate(ctx.templateKey);
        expect(tpl).toBeDefined();
        expect(tpl!.industry).toBe(ctx.templateKey);
      }

      // Step 3: Resolve schema (what Step3ProfileV7Curated does)
      const schema = resolveStep3Schema(industry);
      expect(schema.questions.length).toBeGreaterThan(0);

      // Step 4: Get calculator (what runContractQuote does)
      const calc = CALCULATORS_BY_ID[ctx.calculatorId];
      expect(calc).toBeDefined();
      expect(calc.id).toBe(ctx.calculatorId);

      // All resources align
      expect(ctx.trace.templateKey).toBe(ctx.templateKey);
      expect(ctx.trace.calculatorId).toBe(ctx.calculatorId);
      expect(ctx.trace.schemaKey).toBe(ctx.schemaKey);
    });
  });
});
