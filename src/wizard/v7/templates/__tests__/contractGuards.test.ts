/**
 * CONTRACT GUARD TESTS
 * ====================
 *
 * Created: February 6, 2026
 * Purpose: Prevent silent drift vectors with structural invariant checks
 *
 * THREE GUARD CLASSES:
 *
 * 1. MANIFEST-IS-ONLY-REGISTRY
 *    The template-manifest.ts MANIFEST array is the ONLY source of truth for
 *    what industries exist. No other file may declare a competing registry.
 *    (The server/routes/templates.js inline registry was already killed in Commit 0A.)
 *
 * 2. MAPPING OUTPUT ⊇ requiredInputs
 *    For every template-backed industry, applyTemplateMapping(tpl, defaults)
 *    MUST produce keys that cover ALL calculator.requiredInputs.
 *    A missing key means the adapter silently falls to a hardcoded default,
 *    which is exactly the class of bug TrueQuote exists to prevent.
 *
 * 3. NO SILENT DEFAULTS
 *    Every required calculator field must trace back to EITHER:
 *      (a) an explicit template mapping rule, OR
 *      (b) a declared template default
 *    Fields that are "just there" via adapter fallback are a trust violation.
 *
 * FAILURE MODE:
 * - Tests fail LOUDLY at build time with exact field names that broke
 * - CI blocks deployment
 * - No silent regression possible
 */

import { describe, it, expect } from "vitest";
import { MANIFEST } from "../template-manifest";
import { CALCULATORS_BY_ID } from "../../calculators/registry";
import { applyTemplateMapping } from "../applyMapping";
import type { IndustryTemplateV1 } from "../types";

// Import all template-backed JSONs
import dcTemplate from "../data_center.v1.json";
import hotelTemplate from "../hotel.v1.json";
import carWashTemplate from "../car_wash.v1.json";
import evChargingTemplate from "../ev_charging.v1.json";
import hospitalTemplate from "../hospital.v1.json";

function asTemplate(x: unknown): IndustryTemplateV1 {
  return x as IndustryTemplateV1;
}

// ============================================================================
// GUARD 1: MANIFEST IS THE ONLY REGISTRY
// ============================================================================

describe("Guard 1: manifest-is-only-registry", () => {
  /**
   * The generic_ssot_v1 adapter is deliberately NOT in the manifest.
   * It is the catch-all fallback for industries without a dedicated template.
   * All other calculators MUST have a manifest entry.
   */
  const KNOWN_NON_MANIFEST_CALCULATORS = new Set(["generic_ssot_v1"]);

  it("MANIFEST covers every calculator in CALCULATORS_BY_ID (except generic fallback)", () => {
    const manifestCalcIds = new Set(MANIFEST.map((m) => m.calculatorId));
    const registryCalcIds = new Set(Object.keys(CALCULATORS_BY_ID));

    // Every registered calculator must have a manifest entry (or be explicitly excluded)
    for (const calcId of registryCalcIds) {
      if (KNOWN_NON_MANIFEST_CALCULATORS.has(calcId)) continue;
      expect(
        manifestCalcIds.has(calcId),
        `Calculator "${calcId}" exists in registry but has no MANIFEST entry. ` +
          `Add an entry to template-manifest.ts or add to KNOWN_NON_MANIFEST_CALCULATORS.`
      ).toBe(true);
    }
  });

  it("KNOWN_NON_MANIFEST_CALCULATORS only contains the generic fallback", () => {
    // If someone adds another non-manifest calculator, force a review
    expect([...KNOWN_NON_MANIFEST_CALCULATORS]).toEqual(["generic_ssot_v1"]);
  });

  it("every MANIFEST entry points to a registered calculator", () => {
    for (const entry of MANIFEST) {
      expect(
        CALCULATORS_BY_ID[entry.calculatorId],
        `MANIFEST entry "${entry.industrySlug}" references calculator "${entry.calculatorId}" ` +
          `which does not exist in CALCULATORS_BY_ID. Registry is stale or manifest is wrong.`
      ).toBeDefined();
    }
  });

  it("no duplicate industrySlug in MANIFEST", () => {
    const slugs = MANIFEST.map((m) => m.industrySlug);
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    expect(
      dupes,
      `Duplicate industrySlug(s) in MANIFEST: ${dupes.join(", ")}. Each industry may appear only once.`
    ).toEqual([]);
  });

  it("no duplicate calculatorId in MANIFEST", () => {
    const ids = MANIFEST.map((m) => m.calculatorId);
    const dupes = ids.filter((s, i) => ids.indexOf(s) !== i);
    expect(
      dupes,
      `Duplicate calculatorId(s) in MANIFEST: ${dupes.join(", ")}. ` +
        `Each calculator may serve only one industry (or use an alias).`
    ).toEqual([]);
  });
});

// ============================================================================
// GUARD 2: MAPPING OUTPUT ⊇ requiredInputs (template-backed only)
// ============================================================================

describe("Guard 2: mapping output covers all requiredInputs", () => {
  /**
   * Template-backed industries = those with real JSON templates (not adapter-only)
   */
  const templateBacked = [
    { slug: "data_center", json: dcTemplate },
    { slug: "hotel", json: hotelTemplate },
    { slug: "car_wash", json: carWashTemplate },
    { slug: "ev_charging", json: evChargingTemplate },
    { slug: "hospital", json: hospitalTemplate },
  ];

  for (const { slug, json } of templateBacked) {
    describe(slug, () => {
      const tpl = asTemplate(json);
      const calc = CALCULATORS_BY_ID[tpl.calculator.id]!;
      const mapped = applyTemplateMapping(tpl, { ...tpl.defaults });

      it("mapping with defaults covers ALL calculator.requiredInputs", () => {
        for (const req of calc.requiredInputs) {
          expect(
            req in mapped,
            `${slug}: calculator.requiredInputs includes "${req}" but ` +
              `applyTemplateMapping(template, defaults) did NOT produce it. ` +
              `This means the field silently falls to an adapter hardcoded default — ` +
              `a TrueQuote trust violation. Fix: add mapping rule or template default.`
          ).toBe(true);
        }
      });

      it("no mapped value is undefined for required fields", () => {
        for (const req of calc.requiredInputs) {
          if (req in mapped) {
            expect(
              mapped[req],
              `${slug}: mapping produced "${req}" but its value is undefined/null. ` +
                `Template default is missing or mapping transform returned nothing.`
            ).not.toBeUndefined();
          }
        }
      });

      it("every mapping rule references an existing question or default", () => {
        const questionIds = new Set(tpl.questions.map((q) => q.id));
        const defaultKeys = new Set(Object.keys(tpl.defaults));

        for (const [calcField, rule] of Object.entries(tpl.mapping)) {
          const sourceExists = questionIds.has(rule.from) || defaultKeys.has(rule.from);
          expect(
            sourceExists,
            `${slug}: mapping rule "${calcField}" references "${rule.from}" ` +
              `which is neither a question ID nor a template default key. Orphaned mapping rule.`
          ).toBe(true);
        }
      });
    });
  }
});

// ============================================================================
// GUARD 3: NO SILENT DEFAULTS — adapter-only industries
// ============================================================================

describe("Guard 3: adapter-only industries declare required fields", () => {
  const adapterOnly = MANIFEST.filter((m) => m.templateVersion === "adapter-only");

  it("at least 3 adapter-only industries exist", () => {
    expect(adapterOnly.length).toBeGreaterThanOrEqual(3);
  });

  for (const entry of adapterOnly) {
    describe(entry.industrySlug, () => {
      it("requiredCalcFields is a non-empty subset of calculator.requiredInputs", () => {
        const calc = CALCULATORS_BY_ID[entry.calculatorId]!;
        const calcRequired = new Set(calc.requiredInputs);

        // requiredCalcFields should be non-empty (even adapter-only needs declared inputs)
        expect(
          entry.requiredCalcFields.length,
          `${entry.industrySlug}: requiredCalcFields is empty. Even adapter-only ` +
            `entries must declare what fields the adapter MUST supply.`
        ).toBeGreaterThan(0);

        // Every declared required field must exist in calculator
        for (const field of entry.requiredCalcFields) {
          expect(
            calcRequired.has(field),
            `${entry.industrySlug}: requiredCalcFields lists "${field}" ` +
              `but calculator "${entry.calculatorId}" doesn't declare it in requiredInputs.`
          ).toBe(true);
        }
      });

      it("calculator.compute({}) with no inputs still returns valid structure", () => {
        const calc = CALCULATORS_BY_ID[entry.calculatorId]!;
        // Adapter-only calculators must be resilient to empty inputs
        // (they use their own defaults, but must produce valid output)
        const result = calc.compute({});
        expect(result.baseLoadKW).toBeDefined();
        expect(result.peakLoadKW).toBeDefined();
        expect(result.peakLoadKW).toBeGreaterThan(0);
      });

      it("contributorKeysExpected matches validation envelope keys", () => {
        const calc = CALCULATORS_BY_ID[entry.calculatorId]!;
        // Run with minimal inputs
        const minInputs: Record<string, unknown> = {};
        for (const f of entry.requiredCalcFields) {
          // Supply minimal truthy values
          minInputs[f] =
            f.includes("Count") || f.includes("Chargers") || f.includes("Footage")
              ? 100
              : "default";
        }
        const result = calc.compute(minInputs);

        if (result.validation?.kWContributors) {
          const resultKeys = Object.keys(result.validation.kWContributors).filter(
            (k) =>
              result.validation!.kWContributors![
                k as keyof typeof result.validation.kWContributors
              ] > 0
          );
          // Every expected contributor should be present and non-zero
          for (const expected of entry.contributorKeysExpected) {
            expect(
              resultKeys.includes(expected),
              `${entry.industrySlug}: expected contributor "${expected}" in kWContributors but it was 0 or missing. ` +
                `Check adapter → SSOT mapping for this contributor.`
            ).toBe(true);
          }
        }
      });
    });
  }
});

// ============================================================================
// GUARD 4: CROSS-CHECK — template JSON calculator.id matches manifest
// ============================================================================

describe("Guard 4: template JSON ↔ manifest cross-check", () => {
  const templateFiles = [
    { slug: "data_center", json: dcTemplate },
    { slug: "hotel", json: hotelTemplate },
    { slug: "car_wash", json: carWashTemplate },
  ];

  for (const { slug, json } of templateFiles) {
    it(`${slug}: template JSON calculator.id matches manifest calculatorId`, () => {
      const tpl = asTemplate(json);
      const manifest = MANIFEST.find((m) => m.industrySlug === slug);
      expect(manifest).toBeDefined();
      expect(
        tpl.calculator.id,
        `${slug}: template JSON declares calculator "${tpl.calculator.id}" ` +
          `but manifest says "${manifest!.calculatorId}". These must be identical.`
      ).toBe(manifest!.calculatorId);
    });

    it(`${slug}: template question count within manifest range`, () => {
      const tpl = asTemplate(json);
      // All templates should have 16-18 questions (industry standard)
      expect(tpl.questions.length).toBeGreaterThanOrEqual(16);
      expect(tpl.questions.length).toBeLessThanOrEqual(18);
    });

    it(`${slug}: template version matches manifest templateVersion`, () => {
      const tpl = asTemplate(json);
      const manifest = MANIFEST.find((m) => m.industrySlug === slug);
      expect(manifest).toBeDefined();
      expect(
        tpl.version,
        `${slug}: template JSON version "${tpl.version}" doesn't match ` +
          `manifest templateVersion "${manifest!.templateVersion}".`
      ).toBe(manifest!.templateVersion);
    });
  }
});
