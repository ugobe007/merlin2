/**
 * Industry Resolution — Public API
 *
 * Import from here for all industry context needs:
 *
 *   import { resolveIndustryContext } from '@/wizard/v7/industry';
 *   import type { IndustryContext } from '@/wizard/v7/industry';
 */

export {
  resolveIndustryContext,
  listCanonicalSlugs,
  getCatalogEntry,
  isKnownIndustry,
} from "./resolveIndustryContext";

export { INDUSTRY_CATALOG } from "./industryCatalog";

export {
  normalizeSchemaKey,
  normalizeTemplateKey,
  normalizeCanonicalSlug,
  isSameIndustry,
} from "./normalize";

export type {
  IndustryCatalogEntry,
  IndustryContext,
  ResolutionTrace,
} from "./industryCatalog";
