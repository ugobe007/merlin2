/**
 * COVENANT ENFORCEMENT — Repo-Wide Grep Test
 * ============================================
 *
 * Created: February 2026
 *
 * PURPOSE:
 * Detects forbidden patterns that bypass the centralized industry resolution
 * in resolveIndustryContext(). If these tests fail, someone has introduced a
 * parallel alias map, a raw getTemplate() call, or another resolution bypass.
 *
 * WHY THIS EXISTS:
 * The "restaurant crash" bug class happened because 7+ scattered alias maps
 * all needed to stay in sync. The covenant architecture centralizes ALL
 * resolution through industryCatalog → resolveIndustryContext. These tests
 * prevent regression by scanning the codebase for known forbidden patterns.
 *
 * MAINTENANCE:
 * - Add new forbidden patterns as bypass classes are discovered
 * - ALLOWED_FILES lists legitimate exceptions (e.g., the catalog itself)
 * - Test failures mean: someone added a bypass — fix it, don't skip the test
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// HELPERS
// ============================================================================

const ROOT = path.resolve(__dirname, "../../../../.."); // project root
const SRC = path.join(ROOT, "src");

/**
 * Recursively collect all .ts/.tsx files under a directory,
 * excluding node_modules, dist, _deprecated, _archive, __tests__, .test.
 */
function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip non-source directories
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === ".git" ||
        entry.name.startsWith("_deprecated") ||
        entry.name.startsWith("_archive")
      ) {
        continue;
      }
      collectSourceFiles(full, acc);
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx") &&
      !entry.name.endsWith(".spec.ts") &&
      !entry.name.endsWith(".spec.tsx") &&
      !entry.name.endsWith(".d.ts")
    ) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Search for a regex pattern across source files, returning matches
 * with file path and line number.
 */
function grepSrc(
  pattern: RegExp,
  searchDir: string = SRC
): { file: string; line: number; text: string }[] {
  const files = collectSourceFiles(searchDir);
  const matches: { file: string; line: number; text: string }[] = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        matches.push({
          file: path.relative(ROOT, filePath),
          line: i + 1,
          text: lines[i].trim(),
        });
      }
    }
  }
  return matches;
}

/**
 * Filter matches to exclude allowed files (legitimate exceptions).
 */
function excludeAllowed(
  matches: { file: string; line: number; text: string }[],
  allowedPaths: string[]
): { file: string; line: number; text: string }[] {
  return matches.filter((m) => {
    return !allowedPaths.some((allowed) => m.file.includes(allowed));
  });
}

// ============================================================================
// FORBIDDEN PATTERN #1: Parallel alias maps
// ============================================================================

describe("Covenant: No Parallel Alias Maps", () => {
  // The ONLY place aliases should exist is industryCatalog.ts
  const ALLOWED_ALIAS_FILES = [
    "industry/industryCatalog.ts",
    "industry/resolveIndustryContext.ts",
    "industryMeta.ts", // TODO: migrate canonicalizeSlug to use resolveIndustryContext
  ];

  it("no TEMPLATE_ALIASES constant outside catalog", () => {
    const matches = grepSrc(/\bTEMPLATE_ALIASES\b/);
    const violations = excludeAllowed(matches, ALLOWED_ALIAS_FILES);
    if (violations.length > 0) {
      console.error("TEMPLATE_ALIASES bypass found:", violations);
    }
    expect(violations).toHaveLength(0);
  });

  it("no INDUSTRY_CALCULATOR_OVERRIDES constant outside catalog", () => {
    const matches = grepSrc(/\bINDUSTRY_CALCULATOR_OVERRIDES\b/);
    const violations = excludeAllowed(matches, ALLOWED_ALIAS_FILES);
    if (violations.length > 0) {
      console.error("INDUSTRY_CALCULATOR_OVERRIDES bypass found:", violations);
    }
    expect(violations).toHaveLength(0);
  });

  it("no templateMapping constant outside catalog", () => {
    const matches = grepSrc(/\btemplate[Mm]apping\s*[:=]/);
    const violations = excludeAllowed(matches, [
      ...ALLOWED_ALIAS_FILES,
      // Template mapping in template JSON system is legitimate
      "templates/templateIndex.ts",
      "templates/applyMapping.ts",
      "templates/types.ts",
    ]);
    if (violations.length > 0) {
      console.error("templateMapping bypass found:", violations);
    }
    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// FORBIDDEN PATTERN #2: Hardcoded schemaKey resolution
// ============================================================================

describe("Covenant: No Hardcoded schemaKey Resolution", () => {
  // schemaKey should come from resolveIndustryContext, not hardcoded maps
  const ALLOWED_SCHEMA_FILES = [
    "industry/industryCatalog.ts",
    "industry/resolveIndustryContext.ts",
    "schema/curatedFieldsResolver.ts",
  ];

  it("no COMPLETE_SCHEMAS outside curatedFieldsResolver", () => {
    const matches = grepSrc(/\bCOMPLETE_SCHEMAS\b/);
    const violations = excludeAllowed(matches, ALLOWED_SCHEMA_FILES);
    if (violations.length > 0) {
      console.error("COMPLETE_SCHEMAS bypass found:", violations);
    }
    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// FORBIDDEN PATTERN #3: INDUSTRY_SIZING_DEFAULTS (parallel sizing map)
// ============================================================================

describe("Covenant: No Parallel Sizing Maps", () => {
  const ALLOWED_SIZING_FILES = [
    "industry/industryCatalog.ts", // canonical source of sizingDefaults
    "pricing/pricingBridge.ts", // TODO: known bypass — migrate to catalog
  ];

  it("INDUSTRY_SIZING_DEFAULTS is only in allowed files", () => {
    const matches = grepSrc(/\bINDUSTRY_SIZING_DEFAULTS\b/);
    const violations = excludeAllowed(matches, ALLOWED_SIZING_FILES);
    if (violations.length > 0) {
      console.error("INDUSTRY_SIZING_DEFAULTS in unexpected location:", violations);
    }
    expect(violations).toHaveLength(0);
  });

  it("documents known bypass: pricingBridge INDUSTRY_SIZING_DEFAULTS", () => {
    // This test passes today but documents the bypass for tracking.
    // When pricingBridge is migrated, remove from ALLOWED_SIZING_FILES above
    // and this test becomes unnecessary.
    const matches = grepSrc(/\bINDUSTRY_SIZING_DEFAULTS\b/);
    const pricingBridgeHits = matches.filter((m) =>
      m.file.includes("pricingBridge.ts")
    );
    // Known bypass — expect it exists (will fail when cleaned up = good)
    expect(pricingBridgeHits.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// FORBIDDEN PATTERN #4: Raw getTemplate() without resolveIndustryContext
// ============================================================================

describe("Covenant: No Raw getTemplate() in Business Logic", () => {
  // getTemplate() should only be called with ctx.templateKey, not raw user input.
  // The template system itself and the catalog test are allowed.
  const ALLOWED_RAW_GETTEMPLATE = [
    "templates/templateIndex.ts", // defines getTemplate
    "industry/industryCatalog.ts", // catalog validation
    "industry/resolveIndustryContext.ts", // resolver itself
    "industry/__tests__/", // tests
    "templates/__tests__/", // tests
  ];

  it("no raw getTemplate(args.industry) or getTemplate(industry) in services", () => {
    // Match: getTemplate(args.industry) or getTemplate(industry) or getTemplate(slug)
    // But NOT: getTemplate(ctx.templateKey) or getTemplate(tpl.industry) - those are fine
    const matches = grepSrc(
      /getTemplate\(\s*(args\.industry|industry|slug|rawIndustry|params\.industry)\s*\)/
    );
    const violations = excludeAllowed(matches, ALLOWED_RAW_GETTEMPLATE);
    if (violations.length > 0) {
      console.error(
        "Raw getTemplate() bypass found (should use ctx.templateKey):",
        violations
      );
    }
    // Known bypass: runContractQuoteCore.ts uses getTemplate(args.industry)
    // Filter it to track separately
    const coreBypass = violations.filter((m) =>
      m.file.includes("runContractQuoteCore.ts")
    );
    const otherViolations = violations.filter(
      (m) => !m.file.includes("runContractQuoteCore.ts")
    );

    // No NEW bypasses allowed
    expect(otherViolations).toHaveLength(0);
  });

  it("documents known bypass: runContractQuoteCore raw getTemplate", () => {
    const matches = grepSrc(
      /getTemplate\(\s*args\.industry\s*\)/
    );
    const coreHits = matches.filter((m) =>
      m.file.includes("runContractQuoteCore.ts")
    );
    // Known bypass — tracks until fixed
    expect(coreHits.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// FORBIDDEN PATTERN #5: canonicalizeSlug's parallel alias map
// ============================================================================

describe("Covenant: canonicalizeSlug Migration Tracking", () => {
  it("canonicalizeSlug still has its own alias map (known bypass)", () => {
    // This tracks the parallel alias map in industryMeta.ts.
    // When migrated to use resolveIndustryContext, this test should
    // be updated to assert the alias map is gone.
    const matches = grepSrc(
      /canonicalizeSlug/,
      path.join(SRC, "wizard/v7")
    );
    const metaHits = matches.filter((m) => m.file.includes("industryMeta.ts"));
    // canonicalizeSlug is defined in industryMeta.ts
    expect(metaHits.length).toBeGreaterThan(0);
  });

  it("canonicalizeSlug is NOT used in hooks/ or services/truequote/", () => {
    // The hook layer and TrueQuote service should use resolveIndustryContext
    const hookMatches = grepSrc(
      /canonicalizeSlug/,
      path.join(SRC, "wizard/v7/hooks")
    );
    const truequoteMatches = grepSrc(
      /canonicalizeSlug/,
      path.join(SRC, "services/truequote")
    );
    expect(hookMatches).toHaveLength(0);
    expect(truequoteMatches).toHaveLength(0);
  });
});

// ============================================================================
// FORBIDDEN PATTERN #6: normalizeIndustrySlug in runtime paths
// ============================================================================

describe("Covenant: No normalizeIndustrySlug in Runtime", () => {
  // The old normalizeIndustrySlug function should not exist in runtime code.
  // resolveIndustryContext handles all normalization internally.
  const ALLOWED_NORMALIZE_FILES = [
    "industry/resolveIndustryContext.ts", // internal normalization is fine
    "industry/__tests__/", // tests
    "schema/curatedFieldsResolver.ts", // uses resolveIndustryContext internally
  ];

  it("no standalone normalizeIndustrySlug function exports", () => {
    const matches = grepSrc(
      /export\s+(function|const)\s+normalizeIndustrySlug/
    );
    const violations = excludeAllowed(matches, ALLOWED_NORMALIZE_FILES);
    if (violations.length > 0) {
      console.error("normalizeIndustrySlug export found:", violations);
    }
    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// FORBIDDEN PATTERN #7: Direct SLUG_ALIASES in deprecated code leaking
// ============================================================================

describe("Covenant: Deprecated SLUG_ALIASES Contained", () => {
  it("SLUG_ALIASES only in _deprecated folder", () => {
    const matches = grepSrc(/\bSLUG_ALIASES\b/);
    const violations = matches.filter(
      (m) => !m.file.includes("_deprecated") && !m.file.includes("__tests__")
    );
    if (violations.length > 0) {
      console.error("SLUG_ALIASES leaked out of _deprecated:", violations);
    }
    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// INVARIANT: resolveIndustryContext is the ONLY industry resolver
// ============================================================================

describe("Covenant: Single Resolution Entry Point", () => {
  it("resolveIndustryContext is imported in the wizard hook", () => {
    const hookDir = path.join(SRC, "wizard/v7/hooks");
    const matches = grepSrc(/resolveIndustryContext/, hookDir);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("resolveIndustryContext is imported in curatedFieldsResolver", () => {
    const schemaDir = path.join(SRC, "wizard/v7/schema");
    const matches = grepSrc(/resolveIndustryContext/, schemaDir);
    expect(matches.length).toBeGreaterThan(0);
  });
});
