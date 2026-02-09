/**
 * INDUSTRY SLUG NORMALIZATION — NAMESPACE BRIDGES
 * ================================================
 *
 * Created: February 8, 2026
 *
 * PURPOSE:
 * The industry resolution system has THREE naming namespaces:
 *
 *   1. canonicalSlug  → underscore format (car_wash, data_center)
 *   2. schemaKey      → hyphen format (car-wash, ev-charging) — matches curatedFieldsResolver
 *   3. templateKey    → underscore format (car_wash, generic) — matches template JSON files
 *
 * These normalization functions convert between namespaces so identity
 * comparisons are NEVER done on raw strings. Any test or runtime code
 * that compares slugs across namespaces MUST use these functions.
 *
 * USAGE:
 *   import { normalizeSchemaKey, normalizeTemplateKey } from '@/wizard/v7/industry/normalize';
 *
 *   // Compare schema.industry (hyphen) with ctx.schemaKey (hyphen)
 *   expect(normalizeSchemaKey(schema.industry)).toBe(normalizeSchemaKey(ctx.schemaKey));
 *
 *   // Compare templateKey across namespaces
 *   expect(normalizeTemplateKey(ctx.templateKey)).toBe(normalizeTemplateKey(tpl.industry));
 */

/**
 * Normalize a slug to SCHEMA KEY format (hyphen-separated, lowercase).
 *
 * Schema keys match curatedFieldsResolver's CANONICAL_INDUSTRY_KEYS:
 *   car_wash → car-wash
 *   data_center → data-center  (note: datacenter stays datacenter)
 *   EV_Charging → ev-charging
 *
 * Use this when comparing: schema.industry, ctx.schemaKey, and curated schema keys.
 */
export function normalizeSchemaKey(key: string): string {
  return (key || "").toLowerCase().trim().replace(/_/g, "-");
}

/**
 * Normalize a slug to TEMPLATE KEY format (underscore-separated, lowercase).
 *
 * Template keys match templateIndex.ts JSON `industry` fields:
 *   car-wash → car_wash
 *   data-center → data_center
 *   generic → generic
 *
 * Use this when comparing: ctx.templateKey, template.industry, hasTemplate() args.
 */
export function normalizeTemplateKey(key: string): string {
  return (key || "").toLowerCase().trim().replace(/-/g, "_");
}

/**
 * Normalize a slug to CANONICAL SLUG format (underscore-separated, lowercase).
 *
 * Canonical slugs are the identity namespace in IndustryCatalog:
 *   car-wash → car_wash
 *   Data_Center → data_center
 *   hotel → hotel
 *
 * Use this when comparing: ctx.canonicalSlug, INDUSTRY_CATALOG[].canonicalSlug.
 */
export function normalizeCanonicalSlug(key: string): string {
  return (key || "").toLowerCase().trim().replace(/-/g, "_");
}

/**
 * Check if two slugs are the same industry regardless of namespace format.
 *
 * Collapses both underscores and hyphens so "car_wash" === "car-wash" === "carwash".
 * NOT suitable for exact identity — only for "same industry?" checks.
 */
export function isSameIndustry(a: string, b: string): boolean {
  const normalize = (s: string) =>
    (s || "").toLowerCase().trim().replace(/[-_]/g, "");
  return normalize(a) === normalize(b);
}
