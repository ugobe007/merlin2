/**
 * INDUSTRY CATALOG VALIDATION TESTS
 * ==================================
 *
 * Created: February 7, 2026
 * Hardened: February 8, 2026
 *
 * Tests that the industry catalog is complete, consistent, and all entries
 * resolve to valid templates, calculators, and schemas. This is the contract
 * test that prevents the scattered-alias-map bug class.
 *
 * TIERS:
 *   0 — Structural integrity + naming doctrine
 *   1 — Every entry resolves to valid resources + borrowing invariants
 *   2 — Alias resolution (explicit aliases, hyphen variants, case folding)
 *   3 — Restaurant bug class regression guard
 *   4 — Convenience helpers (listCanonicalSlugs, isKnownIndustry)
 *   5 — Schema-key resolvability (schema source consistency)
 *   6 — Borrowing invariants (normalized identity comparisons)
 *   7 — Blocker question integrity (Tier-1 blockers ⊂ schema question IDs)
 *   8 — Quote pipeline smoke tests (calculator output sanity + alias chain)
 *
 * Run: npx vitest run src/wizard/v7/industry/__tests__/industryCatalog.test.ts
 */

import { describe, it, expect } from "vitest";
import { INDUSTRY_CATALOG } from "../industryCatalog";
import {
  resolveIndustryContext,
  listCanonicalSlugs,
  isKnownIndustry,
} from "../resolveIndustryContext";
import { normalizeSchemaKey, normalizeTemplateKey } from "../normalize";
import { CALCULATORS_BY_ID } from "@/wizard/v7/calculators/registry";
import { getTemplate, hasTemplate } from "@/wizard/v7/templates/templateIndex";
import {
  resolveStep3Schema,
  hasCuratedSchema,
  getTier1Blockers,
} from "@/wizard/v7/schema/curatedFieldsResolver";

// ============================================================================
// Tier 0: Catalog structural integrity
// ============================================================================

describe("Industry Catalog — Structural Integrity", () => {
  it("has at least 15 entries", () => {
    expect(INDUSTRY_CATALOG.length).toBeGreaterThanOrEqual(15);
  });

  it("has unique canonical slugs", () => {
    const slugs = INDUSTRY_CATALOG.map((e) => e.canonicalSlug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("has no overlapping aliases across entries", () => {
    const allAliases = new Map<string, string>();
    for (const entry of INDUSTRY_CATALOG) {
      for (const alias of entry.aliases) {
        const lower = alias.toLowerCase();
        if (allAliases.has(lower)) {
          throw new Error(
            `Alias "${alias}" claimed by both "${allAliases.get(lower)}" and "${entry.canonicalSlug}"`
          );
        }
        allAliases.set(lower, entry.canonicalSlug);
      }
    }
  });

  it("no alias collides with another entry's canonicalSlug", () => {
    const canonicals = new Set(INDUSTRY_CATALOG.map((e) => e.canonicalSlug.toLowerCase()));
    for (const entry of INDUSTRY_CATALOG) {
      for (const alias of entry.aliases) {
        const lower = alias.toLowerCase();
        if (canonicals.has(lower) && lower !== entry.canonicalSlug.toLowerCase()) {
          throw new Error(
            `Alias "${alias}" of "${entry.canonicalSlug}" collides with another entry's canonicalSlug`
          );
        }
      }
    }
  });

  it("has an 'other' entry for fallback", () => {
    const other = INDUSTRY_CATALOG.find((e) => e.canonicalSlug === "other");
    expect(other).toBeDefined();
    expect(other!.calculatorId).toBe("generic_ssot_v1");
  });
});

// --- NAMING DOCTRINE ---
// Codifies the three-namespace convention so format drift breaks tests, not production.

describe("Industry Catalog — Naming Doctrine", () => {
  const CANONICAL_SLUG_RE = /^[a-z][a-z0-9_]*$/;
  const TEMPLATE_KEY_RE = /^[a-z][a-z0-9_]*$/;
  const SCHEMA_KEY_RE = /^[a-z][a-z0-9-]*$/;
  const CALCULATOR_ID_RE = /^[a-z][a-z0-9_]*$/;

  for (const entry of INDUSTRY_CATALOG) {
    it(`${entry.canonicalSlug} — canonicalSlug matches /^[a-z][a-z0-9_]*$/`, () => {
      expect(entry.canonicalSlug).toMatch(CANONICAL_SLUG_RE);
    });

    it(`${entry.canonicalSlug} — templateKey matches /^[a-z][a-z0-9_]*$/`, () => {
      expect(entry.templateKey).toMatch(TEMPLATE_KEY_RE);
    });

    it(`${entry.canonicalSlug} — schemaKey matches /^[a-z][a-z0-9-]*$/`, () => {
      expect(entry.schemaKey).toMatch(SCHEMA_KEY_RE);
    });

    it(`${entry.canonicalSlug} — calculatorId matches /^[a-z][a-z0-9_]*$/`, () => {
      expect(entry.calculatorId).toMatch(CALCULATOR_ID_RE);
    });
  }

  it("canonicalSlug NEVER contains hyphens (underscore namespace)", () => {
    for (const entry of INDUSTRY_CATALOG) {
      expect(entry.canonicalSlug).not.toContain("-");
    }
  });

  it("templateKey NEVER contains hyphens (underscore namespace)", () => {
    for (const entry of INDUSTRY_CATALOG) {
      expect(entry.templateKey).not.toContain("-");
    }
  });

  it("schemaKey NEVER contains underscores (hyphen namespace)", () => {
    for (const entry of INDUSTRY_CATALOG) {
      expect(entry.schemaKey).not.toContain("_");
    }
  });
});

// ============================================================================
// Tier 1: Every catalog entry resolves to valid resources
// ============================================================================

describe("Industry Catalog — Resource Resolution", () => {
  for (const entry of INDUSTRY_CATALOG) {
    describe(`${entry.canonicalSlug}`, () => {
      it("resolves via resolveIndustryContext", () => {
        const ctx = resolveIndustryContext(entry.canonicalSlug);
        expect(ctx.canonicalSlug).toBe(entry.canonicalSlug);
        expect(ctx.templateKey).toBe(entry.templateKey);
        expect(ctx.calculatorId).toBe(entry.calculatorId);
        expect(ctx.schemaKey).toBe(entry.schemaKey);
      });

      it("has a registered calculator", () => {
        const calc = CALCULATORS_BY_ID[entry.calculatorId];
        expect(calc).toBeDefined();
        expect(calc.id).toBe(entry.calculatorId);
      });

      it("has a loadable template (own or borrowed)", () => {
        const tpl = getTemplate(entry.templateKey);
        expect(tpl).not.toBeNull();
      });

      it("hasTemplate flag matches reality", () => {
        const exists = hasTemplate(entry.canonicalSlug);
        expect(exists).toBe(entry.hasTemplate);
      });

      // --- BORROWING INVARIANT ---
      // If hasTemplate=true → templateKey must match canonicalSlug (owns its template)
      // If hasTemplate=false → templateKey must differ (proves borrowing)
      it("borrowing semantics consistent with hasTemplate flag", () => {
        const ownKey = normalizeTemplateKey(entry.canonicalSlug);
        if (entry.hasTemplate) {
          expect(
            normalizeTemplateKey(entry.templateKey),
            `${entry.canonicalSlug} claims hasTemplate=true but templateKey "${entry.templateKey}" differs from own "${ownKey}"`
          ).toBe(ownKey);
        } else {
          expect(
            normalizeTemplateKey(entry.templateKey),
            `${entry.canonicalSlug} claims hasTemplate=false but templateKey "${entry.templateKey}" matches own "${ownKey}" — should be borrowing`
          ).not.toBe(ownKey);
        }
      });

      it("has valid sizing defaults", () => {
        expect(entry.sizingDefaults.ratio).toBeGreaterThan(0);
        expect(entry.sizingDefaults.ratio).toBeLessThanOrEqual(1);
        expect(entry.sizingDefaults.hours).toBeGreaterThan(0);
        expect(entry.sizingDefaults.hours).toBeLessThanOrEqual(12);
      });
    });
  }
});

// ============================================================================
// Tier 2: Alias resolution
// ============================================================================

describe("Industry Catalog — Alias Resolution", () => {
  for (const entry of INDUSTRY_CATALOG) {
    for (const alias of entry.aliases) {
      it(`alias "${alias}" → ${entry.canonicalSlug}`, () => {
        const ctx = resolveIndustryContext(alias);
        expect(ctx.canonicalSlug).toBe(entry.canonicalSlug);
      });
    }
  }

  it("resolves hyphen variant of car_wash", () => {
    const ctx = resolveIndustryContext("car-wash");
    expect(ctx.canonicalSlug).toBe("car_wash");
  });

  it("resolves underscore variant of ev-charging", () => {
    const ctx = resolveIndustryContext("ev_charging");
    expect(ctx.canonicalSlug).toBe("ev_charging");
  });

  it("resolves mixed case", () => {
    const ctx = resolveIndustryContext("Data_Center");
    expect(ctx.canonicalSlug).toBe("data_center");
  });

  it("unknown slug falls back to 'other'", () => {
    const ctx = resolveIndustryContext("fitness_center");
    expect(ctx.canonicalSlug).toBe("other");
    expect(ctx.calculatorId).toBe("generic_ssot_v1");
  });

  it("empty string falls back to 'other'", () => {
    const ctx = resolveIndustryContext("");
    expect(ctx.canonicalSlug).toBe("other");
  });
});

// ============================================================================
// Tier 3: The restaurant bug class (regression guard)
// ============================================================================

describe("Industry Catalog — Restaurant Bug Regression", () => {
  it("restaurant resolves to hotel template, own calculator, own schema", () => {
    const ctx = resolveIndustryContext("restaurant");
    expect(ctx.templateKey).toBe("hotel");
    expect(ctx.calculatorId).toBe("restaurant_load_v1");
    expect(ctx.schemaKey).toBe("restaurant");
  });

  it("restaurant template is loadable", () => {
    const ctx = resolveIndustryContext("restaurant");
    const tpl = getTemplate(ctx.templateKey);
    expect(tpl).not.toBeNull();
  });

  it("restaurant calculator is registered", () => {
    const ctx = resolveIndustryContext("restaurant");
    const calc = CALCULATORS_BY_ID[ctx.calculatorId];
    expect(calc).toBeDefined();
  });

  it("warehouse resolves to data_center template, own calculator", () => {
    const ctx = resolveIndustryContext("warehouse");
    expect(ctx.templateKey).toBe("data_center");
    expect(ctx.calculatorId).toBe("warehouse_load_v1");
  });

  it("retail resolves to hotel template, own calculator", () => {
    const ctx = resolveIndustryContext("retail");
    expect(ctx.templateKey).toBe("hotel");
    expect(ctx.calculatorId).toBe("retail_load_v1");
  });

  it("gas_station resolves to hotel template, own calculator", () => {
    const ctx = resolveIndustryContext("gas_station");
    expect(ctx.templateKey).toBe("hotel");
    expect(ctx.calculatorId).toBe("gas_station_load_v1");
  });
});

// ============================================================================
// Tier 4: Convenience helpers
// ============================================================================

describe("Industry Catalog — Convenience Helpers", () => {
  it("listCanonicalSlugs returns all entries", () => {
    const slugs = listCanonicalSlugs();
    expect(slugs.length).toBe(INDUSTRY_CATALOG.length);
    expect(slugs).toContain("hotel");
    expect(slugs).toContain("restaurant");
    expect(slugs).toContain("other");
  });

  it("isKnownIndustry returns true for real industries", () => {
    expect(isKnownIndustry("hotel")).toBe(true);
    expect(isKnownIndustry("car_wash")).toBe(true);
    expect(isKnownIndustry("restaurant")).toBe(true);
  });

  it("isKnownIndustry returns false for unknown", () => {
    expect(isKnownIndustry("fitness_center")).toBe(false);
    expect(isKnownIndustry("")).toBe(false);
  });
});

// ============================================================================
// Tier 5: Schema-key resolvability
// ============================================================================

describe("Industry Catalog — Schema-key Resolvability", () => {
  for (const entry of INDUSTRY_CATALOG) {
    it(`${entry.canonicalSlug} resolves to a non-empty schema`, () => {
      const schema = resolveStep3Schema(entry.canonicalSlug);
      expect(schema).toBeDefined();
      expect(schema.questions.length).toBeGreaterThan(0);
      expect(schema.source).toMatch(/^(curated-complete|curated-legacy|fallback)$/);
    });

    it(`${entry.canonicalSlug} hasCuratedSchema consistent with schema source`, () => {
      const schema = resolveStep3Schema(entry.canonicalSlug);
      const hasCurated = hasCuratedSchema(entry.canonicalSlug);

      // If hasCuratedSchema returns true, schema source must NOT be 'fallback'
      if (hasCurated) {
        expect(schema.source).not.toBe("fallback");
      }
      // If schema source is 'fallback', hasCuratedSchema must return false
      if (schema.source === "fallback") {
        expect(hasCurated).toBe(false);
      }
    });
  }
});

// ============================================================================
// Tier 6: Borrowing invariants (NORMALIZED identity comparisons)
// ============================================================================

describe("Industry Catalog — Borrowing Invariants", () => {
  for (const entry of INDUSTRY_CATALOG) {
    it(`${entry.canonicalSlug} schema.industry matches effective schemaKey (normalized)`, () => {
      const ctx = resolveIndustryContext(entry.canonicalSlug);
      const schema = resolveStep3Schema(entry.canonicalSlug);
      // Both sides normalized to schema-key namespace (hyphens).
      // This catches naming-convention drift without false positives.
      expect(normalizeSchemaKey(schema.industry)).toBe(normalizeSchemaKey(ctx.schemaKey));
    });

    it(`${entry.canonicalSlug} template.industry matches effective templateKey (normalized)`, () => {
      const ctx = resolveIndustryContext(entry.canonicalSlug);
      const tpl = getTemplate(ctx.templateKey);
      expect(tpl).not.toBeNull();
      // Both sides normalized to template-key namespace (underscores).
      expect(normalizeTemplateKey(tpl!.industry)).toBe(normalizeTemplateKey(ctx.templateKey));
    });
  }
});

// ============================================================================
// Tier 7: Blocker question integrity — every blocker ID exists in schema
// ============================================================================

describe("Industry Catalog — Blocker Question Integrity", () => {
  for (const entry of INDUSTRY_CATALOG) {
    const blockers = getTier1Blockers(entry.canonicalSlug);
    if (blockers.length === 0) continue;

    it(`${entry.canonicalSlug} — all ${blockers.length} Tier1 blockers exist in schema`, () => {
      const schema = resolveStep3Schema(entry.canonicalSlug);
      const questionIds = new Set(schema.questions.map((q) => q.id));

      for (const blockerId of blockers) {
        expect(
          questionIds.has(blockerId),
          `Blocker "${blockerId}" not found in ${entry.canonicalSlug} schema (${schema.questionCount} questions)`
        ).toBe(true);
      }
    });
  }
});

// ============================================================================
// Tier 8: Quote pipeline smoke tests — the "nuclear bomb" defuser
// ============================================================================
//
// PURPOSE: Prove that the alias → schema → calculator → output chain
// is IDENTICAL for every alias/variant of an industry vs its canonical form.
// This is the test that catches "Step 4 bypassed the resolver" in practice.
//
// WHAT IT TESTS:
//   8a. Every alias produces byte-identical context (except trace metadata)
//   8b. Schema resolved through alias === schema resolved through canonical
//   8c. Calculator.compute() returns valid, non-NaN output for defaults
//   8d. TrueQuote envelope (if present) is structurally valid
//   8e. Cross-resource dependency chain is consistent (schema ↔ template ↔ calc)
//   8f. Hyphen-form aliases (the nuclear bomb case) are proven identical
//
// WHY THIS MATTERS:
//   If "car-wash" (an alias) resolved to a DIFFERENT schema or calculator
//   than "car_wash" (canonical), the questionnaire fields would misalign
//   with the calculator inputs, producing garbage kW numbers silently.

describe("Industry Catalog — Quote Pipeline Smoke Tests", () => {
  // Industries that exercise the most alias/variant/borrowing complexity
  const SMOKE_INDUSTRIES = [
    "data_center", // alias: datacenter, data-center
    "hotel", // alias: hospitality; borrower: restaurant
    "car_wash", // alias: carwash, car-wash; COMPLETE_SCHEMA
    "ev_charging", // alias: evcharging, ev-charging, ev_charger
    "hospital", // alias: healthcare, medical, clinic
    "restaurant", // borrows hotel template + schema
    "gas_station", // alias: gas-station; borrows hotel template
    "warehouse", // alias: logistics; borrows data_center template
    "other", // alias: custom, unknown, generic
    "manufacturing", // alias: industrial, factory
    "retail", // alias: shopping; borrows hotel template
    "office", // alias: commercial-office, coworking
  ];

  for (const slug of SMOKE_INDUSTRIES) {
    const entry = INDUSTRY_CATALOG.find((e) => e.canonicalSlug === slug);
    if (!entry) continue;

    describe(`${slug}`, () => {
      // --- 8a: Alias context identity ---
      if (entry.aliases.length > 0) {
        it("all aliases produce identical context (except trace)", () => {
          const canonical = resolveIndustryContext(slug);

          for (const alias of entry.aliases) {
            const aliasCtx = resolveIndustryContext(alias);
            expect(aliasCtx.canonicalSlug).toBe(canonical.canonicalSlug);
            expect(aliasCtx.templateKey).toBe(canonical.templateKey);
            expect(aliasCtx.calculatorId).toBe(canonical.calculatorId);
            expect(aliasCtx.schemaKey).toBe(canonical.schemaKey);
            expect(aliasCtx.sizingDefaults).toEqual(canonical.sizingDefaults);
            expect(aliasCtx.hasTemplate).toBe(canonical.hasTemplate);
            expect(aliasCtx.hasCuratedSchema).toBe(canonical.hasCuratedSchema);
          }
        });
      }

      // --- 8b: Alias schema identity ---
      if (entry.aliases.length > 0) {
        it("all aliases resolve to identical schema", () => {
          const canonicalSchema = resolveStep3Schema(slug);

          for (const alias of entry.aliases) {
            const aliasSchema = resolveStep3Schema(alias);
            expect(
              aliasSchema.questionCount,
              `alias "${alias}" got ${aliasSchema.questionCount}Q but canonical "${slug}" has ${canonicalSchema.questionCount}Q`
            ).toBe(canonicalSchema.questionCount);
            expect(aliasSchema.source).toBe(canonicalSchema.source);
            expect(normalizeSchemaKey(aliasSchema.industry)).toBe(
              normalizeSchemaKey(canonicalSchema.industry)
            );

            // Question IDs must be identical (same set, same order)
            const canonicalIds = canonicalSchema.questions.map((q) => q.id);
            const aliasIds = aliasSchema.questions.map((q) => q.id);
            expect(aliasIds).toEqual(canonicalIds);
          }
        });
      }

      // --- 8c: Calculator output sanity ---
      it("calculator.compute({}) produces valid output (no NaN, no Infinity)", () => {
        const ctx = resolveIndustryContext(slug);
        const calc = CALCULATORS_BY_ID[ctx.calculatorId];
        expect(calc).toBeDefined();

        const result = calc.compute({});

        if (result.peakLoadKW !== undefined) {
          expect(Number.isFinite(result.peakLoadKW)).toBe(true);
          expect(result.peakLoadKW).toBeGreaterThanOrEqual(0);
        }
        if (result.baseLoadKW !== undefined) {
          expect(Number.isFinite(result.baseLoadKW)).toBe(true);
          expect(result.baseLoadKW).toBeGreaterThanOrEqual(0);
        }
        if (result.energyKWhPerDay !== undefined) {
          expect(Number.isFinite(result.energyKWhPerDay)).toBe(true);
          expect(result.energyKWhPerDay).toBeGreaterThanOrEqual(0);
        }
      });

      // --- 8d: TrueQuote envelope validity (if present) ---
      it("if validation envelope is present, it is structurally valid", () => {
        const ctx = resolveIndustryContext(slug);
        const calc = CALCULATORS_BY_ID[ctx.calculatorId];
        const result = calc.compute({});

        if (result.validation) {
          const v = result.validation;
          expect(v.version).toBe("v1");

          if (v.dutyCycle !== undefined) {
            expect(v.dutyCycle).toBeGreaterThanOrEqual(0);
            expect(v.dutyCycle).toBeLessThanOrEqual(1.25);
          }

          if (v.kWContributors) {
            for (const [key, value] of Object.entries(v.kWContributors)) {
              expect(Number.isFinite(value), `kWContributor "${key}" is not finite: ${value}`).toBe(
                true
              );
              expect(value as number).toBeGreaterThanOrEqual(0);
            }
          }
        }
      });

      // --- 8e: Cross-resource dependency chain ---
      it("ctx resources are mutually consistent (schema ↔ template ↔ calc)", () => {
        const ctx = resolveIndustryContext(slug);

        // Template loadable through ctx.templateKey
        const tpl = getTemplate(ctx.templateKey);
        expect(tpl).not.toBeNull();

        // Schema resolvable through canonical slug
        const schema = resolveStep3Schema(slug);
        expect(schema.questions.length).toBeGreaterThan(0);

        // Calculator exists
        const calc = CALCULATORS_BY_ID[ctx.calculatorId];
        expect(calc).toBeDefined();

        // Cross-namespace checks (normalized)
        expect(normalizeSchemaKey(schema.industry)).toBe(normalizeSchemaKey(ctx.schemaKey));
        expect(normalizeTemplateKey(tpl!.industry)).toBe(normalizeTemplateKey(ctx.templateKey));
        expect(calc.id).toBe(ctx.calculatorId);
      });
    });
  }

  // --- 8f: Hyphen-form aliases produce identical pipeline outputs ---
  // These are the specific "nuclear bomb" cases the user was concerned about.
  // Hyphen-form aliases (car-wash, data-center) must produce BYTE-IDENTICAL
  // resource keys, schemas, and calculator outputs as their canonical forms.
  describe("hyphen-form alias → canonical pipeline equivalence", () => {
    const HYPHEN_PAIRS: [string, string][] = [
      ["car-wash", "car_wash"],
      ["data-center", "data_center"],
      ["ev-charging", "ev_charging"],
      ["gas-station", "gas_station"],
      ["cold-storage", "cold_storage"],
      ["indoor-farm", "indoor_farm"],
    ];

    for (const [hyphen, underscore] of HYPHEN_PAIRS) {
      it(`"${hyphen}" → identical pipeline as "${underscore}"`, () => {
        const hCtx = resolveIndustryContext(hyphen);
        const uCtx = resolveIndustryContext(underscore);

        // Context identity (all resource keys must match)
        expect(hCtx.canonicalSlug).toBe(uCtx.canonicalSlug);
        expect(hCtx.templateKey).toBe(uCtx.templateKey);
        expect(hCtx.calculatorId).toBe(uCtx.calculatorId);
        expect(hCtx.schemaKey).toBe(uCtx.schemaKey);
        expect(hCtx.sizingDefaults).toEqual(uCtx.sizingDefaults);

        // Schema identity (same questions, same source)
        const hSchema = resolveStep3Schema(hyphen);
        const uSchema = resolveStep3Schema(underscore);
        expect(hSchema.questionCount).toBe(uSchema.questionCount);
        expect(hSchema.source).toBe(uSchema.source);
        expect(hSchema.questions.map((q) => q.id)).toEqual(uSchema.questions.map((q) => q.id));

        // Calculator identity (same reference, not just equal)
        const hCalc = CALCULATORS_BY_ID[hCtx.calculatorId];
        const uCalc = CALCULATORS_BY_ID[uCtx.calculatorId];
        expect(hCalc).toBe(uCalc);

        // Both produce identical numeric output
        const hResult = hCalc.compute({});
        const uResult = uCalc.compute({});
        if (hResult.peakLoadKW !== undefined) {
          expect(hResult.peakLoadKW).toBe(uResult.peakLoadKW);
        }
      });
    }
  });
});
