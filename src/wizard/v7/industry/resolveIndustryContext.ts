/**
 * RESOLVE INDUSTRY CONTEXT — SINGLE ENTRY POINT
 * ===============================================
 *
 * Created: February 7, 2026
 *
 * PURPOSE:
 * Given ANY industry slug (raw user input, IndustrySlug, hyphen, underscore,
 * alias, mixed case), return a complete IndustryContext that tells every
 * downstream consumer exactly which template, calculator, and schema to use.
 *
 * This ELIMINATES the 7+ scattered alias maps that caused the restaurant crash
 * and every future variant of that bug class.
 *
 * USAGE:
 *   import { resolveIndustryContext } from '@/wizard/v7/industry/resolveIndustryContext';
 *
 *   const ctx = resolveIndustryContext('restaurant');
 *   // ctx.templateKey    = 'hotel'         → getTemplate('hotel')
 *   // ctx.calculatorId   = 'restaurant_load_v1' → CALCULATORS_BY_ID[...]
 *   // ctx.schemaKey       = 'restaurant'    → resolveStep3Schema('restaurant')
 *   // ctx.canonicalSlug   = 'restaurant'    → state.industry
 *   // ctx.sizingDefaults  = { ratio: 0.40, hours: 4 }
 *
 * INVARIANTS:
 *   1. resolveIndustryContext() NEVER returns null/undefined — always resolves
 *   2. ctx.templateKey always corresponds to an existing template JSON
 *   3. ctx.calculatorId always corresponds to a registered calculator
 *   4. ctx.schemaKey always produces a schema from resolveStep3Schema()
 *   5. Unknown inputs fall through to "other" (generic_facility + generic_ssot_v1)
 */

import {
  INDUSTRY_CATALOG,
  type IndustryCatalogEntry,
  type IndustryContext,
  type ResolutionTrace,
} from "./industryCatalog";

// ============================================================================
// INDEX CONSTRUCTION (built once at module load)
// ============================================================================

/**
 * Lookup index: any slug variant → catalog entry + resolution reason
 *
 * Built from:
 * - entry.canonicalSlug (exact match)
 * - entry.aliases (all variants)
 * - hyphen ↔ underscore variants of canonicalSlug
 *
 * All keys are lowercased for case-insensitive matching.
 */
type IndexEntry = { entry: IndustryCatalogEntry; reason: ResolutionTrace['reason'] };
const SLUG_INDEX: Map<string, IndexEntry> = new Map();

/** The "other" fallback entry — guaranteed to exist */
let FALLBACK_ENTRY: IndustryCatalogEntry;

// Build the index — priority: exact > alias > variant
// Two passes: (1) exact + alias, (2) variants (lowest priority, never overwrite)
for (const entry of INDUSTRY_CATALOG) {
  const canonical = entry.canonicalSlug.toLowerCase();

  // Pass 1a: Index by canonical slug (exact match — highest priority)
  SLUG_INDEX.set(canonical, { entry, reason: 'exact' });

  // Pass 1b: Index all explicit aliases (never overwrite exact entries)
  for (const alias of entry.aliases) {
    const aliasKey = alias.toLowerCase();
    if (!SLUG_INDEX.has(aliasKey)) {
      SLUG_INDEX.set(aliasKey, { entry, reason: 'alias' });
    }

    // Also index hyphen↔underscore variants of aliases (never overwrite exact)
    const aliasHyphen = aliasKey.replace(/_/g, "-");
    const aliasUnderscore = aliasKey.replace(/-/g, "_");
    if (aliasHyphen !== aliasKey && !SLUG_INDEX.has(aliasHyphen)) {
      SLUG_INDEX.set(aliasHyphen, { entry, reason: 'alias' });
    }
    if (aliasUnderscore !== aliasKey && !SLUG_INDEX.has(aliasUnderscore)) {
      SLUG_INDEX.set(aliasUnderscore, { entry, reason: 'alias' });
    }
  }

  // Track fallback
  if (canonical === "other") {
    FALLBACK_ENTRY = entry;
  }
}

// Pass 2: Index hyphen↔underscore variants of canonical (lowest priority — never overwrite)
for (const entry of INDUSTRY_CATALOG) {
  const canonical = entry.canonicalSlug.toLowerCase();

  const hyphenVariant = canonical.replace(/_/g, "-");
  if (hyphenVariant !== canonical && !SLUG_INDEX.has(hyphenVariant)) {
    SLUG_INDEX.set(hyphenVariant, { entry, reason: 'variant' });
  }

  const underscoreVariant = canonical.replace(/-/g, "_");
  if (underscoreVariant !== canonical && !SLUG_INDEX.has(underscoreVariant)) {
    SLUG_INDEX.set(underscoreVariant, { entry, reason: 'variant' });
  }
}

// Safety: if "other" wasn't in catalog, create a minimal fallback
if (!FALLBACK_ENTRY!) {
  FALLBACK_ENTRY = {
    canonicalSlug: "other",
    templateKey: "generic_facility",
    calculatorId: "generic_ssot_v1",
    schemaKey: "other",
    aliases: [],
    sizingDefaults: { ratio: 0.40, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: false,
  };
}

// ============================================================================
// RESOLVER
// ============================================================================

/**
 * Resolve ANY industry slug to a complete IndustryContext.
 *
 * Handles: mixed case, hyphens, underscores, aliases, unknown values.
 * NEVER throws. Unknown slugs resolve to "other" (generic).
 *
 * @param rawIndustry - Any industry slug variant
 * @returns Complete IndustryContext for all downstream consumers
 */
export function resolveIndustryContext(rawIndustry: string): IndustryContext {
  // Normalize: lowercase, trim
  const normalized = (rawIndustry || "").toLowerCase().trim();

  // Look up in index (entry + reason)
  const hit = SLUG_INDEX.get(normalized);
  const entry = hit?.entry ?? FALLBACK_ENTRY;
  const reason: ResolutionTrace['reason'] = hit ? hit.reason : 'fallback';

  // Determine borrowing (template or schema differs from canonical)
  const isBorrowed =
    entry.templateKey !== entry.canonicalSlug ||
    entry.schemaKey !== entry.canonicalSlug;
  const borrowedFrom = isBorrowed ? entry.templateKey : undefined;

  // Build resolution trace
  const trace: ResolutionTrace = {
    rawIndustry,
    normalizedInput: normalized,
    canonicalSlug: entry.canonicalSlug,
    templateKey: entry.templateKey,
    schemaKey: entry.schemaKey,
    calculatorId: entry.calculatorId,
    reason,
    borrowedFrom,
    resolvedAt: new Date().toISOString(),
  };

  // Build context
  const ctx: IndustryContext = {
    rawIndustry,
    canonicalSlug: entry.canonicalSlug,
    templateKey: entry.templateKey,
    calculatorId: entry.calculatorId,
    schemaKey: entry.schemaKey,
    sizingDefaults: entry.sizingDefaults,
    hasTemplate: entry.hasTemplate,
    hasCuratedSchema: entry.hasCuratedSchema,
    trace,
  };

  // DEV assertions
  if (import.meta.env?.DEV) {
    // Warn if input resolved to fallback (might indicate missing catalog entry)
    if (entry === FALLBACK_ENTRY && normalized !== "other" && normalized !== "") {
      console.warn(
        `[IndustryContext] ⚠️ "${rawIndustry}" resolved to fallback "other" — consider adding a catalog entry`
      );
    }
  }

  return ctx;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Get all canonical industry slugs from the catalog.
 * Useful for loop tests, admin panels, diagnostics.
 */
export function listCanonicalSlugs(): string[] {
  return INDUSTRY_CATALOG.map((e) => e.canonicalSlug);
}

/**
 * Get the catalog entry for a canonical slug (for advanced use).
 * Returns undefined if not found.
 */
export function getCatalogEntry(slug: string): IndustryCatalogEntry | undefined {
  const normalized = (slug || "").toLowerCase().trim();
  return SLUG_INDEX.get(normalized)?.entry;
}

/**
 * Check if a slug is known in the catalog (not fallback).
 */
export function isKnownIndustry(slug: string): boolean {
  const normalized = (slug || "").toLowerCase().trim();
  const hit = SLUG_INDEX.get(normalized);
  return !!hit && hit.entry.canonicalSlug !== "other";
}

// Re-export types
export type { IndustryCatalogEntry, IndustryContext, ResolutionTrace } from "./industryCatalog";
