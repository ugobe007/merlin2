/**
 * CATALOG COVENANT TEST
 * =====================
 *
 * Created: February 2026
 *
 * PURPOSE:
 * Cross-checks every registry in the V7 wizard to ensure alignment:
 *   INDUSTRY_CATALOG ↔ CALCULATORS_BY_ID ↔ SSOT_ALIASES ↔ MANIFEST ↔ INDUSTRY_META ↔ pricingBridge
 *
 * If you add a new industry to ONE registry but forget another, this test fails.
 * Ship gate: `npm run test:v7` must pass before deploy.
 *
 * INVARIANTS CHECKED:
 * 1. Every MANIFEST entry has a registered calculator in CALCULATORS_BY_ID
 * 2. Every MANIFEST entry has SSOT aliases (except generic)
 * 3. Every non-generic calculator has a MANIFEST entry
 * 4. Every MANIFEST entry has an INDUSTRY_META entry
 * 5. Every MANIFEST entry gets non-"other" sizing defaults from pricingBridge
 * 6. Every INDUSTRY_CATALOG entry has a matching calculator
 * 7. Every INDUSTRY_CATALOG entry resolves correctly via resolveIndustryContext
 * 8. No orphaned SSOT alias entries (every alias has a manifest)
 */

import { describe, it, expect } from "vitest";
import { MANIFEST, listManifestSlugs } from "../template-manifest";
import { CALCULATORS_BY_ID, listCalculatorIds } from "../../calculators/registry";
import {
  SSOT_ALIASES,
  listAliasIndustries,
  type AliasIndustry,
} from "../../calculators/ssotInputAliases";
import { INDUSTRY_META } from "../../industryMeta";
import { getSizingDefaults } from "../../pricing/pricingBridge";
import { INDUSTRY_CATALOG } from "../../industry/industryCatalog";
import { resolveIndustryContext } from "../../industry/resolveIndustryContext";

// ============================================================================
// TEST DATA
// ============================================================================

const manifestSlugs = listManifestSlugs();
const registeredCalcIds = listCalculatorIds();
const aliasIndustries = listAliasIndustries();

// Industries that are exempt from certain checks
const GENERIC_CALC_IDS = ["generic_ssot_v1"];
const SPECIAL_SLUGS = ["other", "auto"]; // fallback entries, not real industries

// ============================================================================
// TIER 1: Manifest ↔ Calculator Registry
// ============================================================================

describe("Catalog Covenant: Manifest ↔ Calculator Registry", () => {
  it("every MANIFEST entry has a registered calculator", () => {
    const missing: string[] = [];
    for (const entry of MANIFEST) {
      if (!CALCULATORS_BY_ID[entry.calculatorId]) {
        missing.push(`${entry.industrySlug} → ${entry.calculatorId}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("every non-generic calculator has a MANIFEST entry", () => {
    const manifestCalcIds = new Set(MANIFEST.map((m) => m.calculatorId));
    const orphaned: string[] = [];
    for (const calcId of registeredCalcIds) {
      if (GENERIC_CALC_IDS.includes(calcId)) continue;
      if (!manifestCalcIds.has(calcId)) {
        orphaned.push(calcId);
      }
    }
    expect(orphaned).toEqual([]);
  });
});

// ============================================================================
// TIER 2: Manifest ↔ SSOT Aliases
// ============================================================================

describe("Catalog Covenant: Manifest ↔ SSOT Aliases", () => {
  it("every MANIFEST entry has SSOT aliases", () => {
    const missing: string[] = [];
    for (const entry of MANIFEST) {
      const aliasKey = entry.industrySlug as AliasIndustry;
      if (!(aliasKey in SSOT_ALIASES)) {
        missing.push(entry.industrySlug);
      }
    }
    expect(missing).toEqual([]);
  });

  it("no orphaned SSOT alias entries (every alias has a manifest)", () => {
    const manifestSlugSet = new Set(manifestSlugs);
    const orphaned: string[] = [];
    for (const alias of aliasIndustries) {
      if (!manifestSlugSet.has(alias)) {
        orphaned.push(alias);
      }
    }
    expect(orphaned).toEqual([]);
  });
});

// ============================================================================
// TIER 3: Manifest ↔ Industry Meta
// ============================================================================

describe("Catalog Covenant: Manifest ↔ Industry Meta", () => {
  it("every MANIFEST entry has an INDUSTRY_META entry", () => {
    const missing: string[] = [];
    for (const entry of MANIFEST) {
      if (!(entry.industrySlug in INDUSTRY_META)) {
        missing.push(entry.industrySlug);
      }
    }
    expect(missing).toEqual([]);
  });
});

// ============================================================================
// TIER 4: Manifest ↔ Pricing Bridge
// ============================================================================

describe("Catalog Covenant: Manifest ↔ Pricing Bridge", () => {
  it("every MANIFEST entry returns valid sizing defaults", () => {
    const bad: string[] = [];
    for (const entry of MANIFEST) {
      if (SPECIAL_SLUGS.includes(entry.industrySlug)) continue;
      const defaults = getSizingDefaults(entry.industrySlug);
      // Verify reasonable values (ratio 0.1-1.0, hours 1-12)
      if (defaults.ratio < 0.1 || defaults.ratio > 1.0 || defaults.hours < 1 || defaults.hours > 12) {
        bad.push(
          `${entry.industrySlug}: ratio=${defaults.ratio}, hours=${defaults.hours}`
        );
      }
    }
    expect(bad).toEqual([]);
  });
});

// ============================================================================
// TIER 5: Industry Catalog ↔ Calculator Registry
// ============================================================================

describe("Catalog Covenant: Industry Catalog ↔ Calculator Registry", () => {
  it("every INDUSTRY_CATALOG entry has a registered calculator", () => {
    const missing: string[] = [];
    for (const entry of INDUSTRY_CATALOG) {
      if (!CALCULATORS_BY_ID[entry.calculatorId]) {
        missing.push(`${entry.canonicalSlug} → ${entry.calculatorId}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("every INDUSTRY_CATALOG entry resolves via resolveIndustryContext", () => {
    const broken: string[] = [];
    for (const entry of INDUSTRY_CATALOG) {
      try {
        const ctx = resolveIndustryContext(entry.canonicalSlug);
        if (ctx.calculatorId !== entry.calculatorId) {
          broken.push(
            `${entry.canonicalSlug}: expected calc ${entry.calculatorId}, got ${ctx.calculatorId}`
          );
        }
      } catch {
        broken.push(`${entry.canonicalSlug}: resolveIndustryContext threw`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("all aliases in INDUSTRY_CATALOG resolve to correct canonical slug", () => {
    const broken: string[] = [];
    for (const entry of INDUSTRY_CATALOG) {
      for (const alias of entry.aliases) {
        const ctx = resolveIndustryContext(alias);
        if (ctx.canonicalSlug !== entry.canonicalSlug) {
          broken.push(
            `alias "${alias}" → expected ${entry.canonicalSlug}, got ${ctx.canonicalSlug}`
          );
        }
      }
    }
    expect(broken).toEqual([]);
  });
});

// ============================================================================
// TIER 6: Structural Invariants
// ============================================================================

describe("Catalog Covenant: Structural Invariants", () => {
  it("no duplicate MANIFEST slugs", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const slug of manifestSlugs) {
      if (seen.has(slug)) dupes.push(slug);
      seen.add(slug);
    }
    expect(dupes).toEqual([]);
  });

  it("no duplicate calculator IDs in MANIFEST", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const entry of MANIFEST) {
      if (seen.has(entry.calculatorId)) dupes.push(entry.calculatorId);
      seen.add(entry.calculatorId);
    }
    expect(dupes).toEqual([]);
  });

  it("every MANIFEST entry has validationVersion v1", () => {
    const bad: string[] = [];
    for (const entry of MANIFEST) {
      if (entry.validationVersion !== "v1") {
        bad.push(`${entry.industrySlug}: ${entry.validationVersion}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("every MANIFEST entry has at least one required calc field", () => {
    const empty: string[] = [];
    for (const entry of MANIFEST) {
      if (!entry.requiredCalcFields || entry.requiredCalcFields.length === 0) {
        empty.push(entry.industrySlug);
      }
    }
    expect(empty).toEqual([]);
  });

  it("every MANIFEST entry has at least 3 expected contributors", () => {
    const thin: string[] = [];
    for (const entry of MANIFEST) {
      if (!entry.contributorKeysExpected || entry.contributorKeysExpected.length < 3) {
        thin.push(`${entry.industrySlug}: ${entry.contributorKeysExpected?.length ?? 0}`);
      }
    }
    expect(thin).toEqual([]);
  });

  it("every MANIFEST entry has a reasonable typicalPeakKWRange", () => {
    const bad: string[] = [];
    for (const entry of MANIFEST) {
      const [min, max] = entry.typicalPeakKWRange;
      if (min < 0 || max < min || max > 100000) {
        bad.push(`${entry.industrySlug}: [${min}, ${max}]`);
      }
    }
    expect(bad).toEqual([]);
  });
});
