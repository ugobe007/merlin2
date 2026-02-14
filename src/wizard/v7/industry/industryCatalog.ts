/**
 * INDUSTRY CATALOG — SINGLE SOURCE OF TRUTH
 * ==========================================
 *
 * Created: February 7, 2026
 *
 * PURPOSE:
 * This file is the ONE canonical catalog that defines how every industry slug
 * maps to its template, calculator, and schema. Before this file, there were
 * 7+ independent alias maps scattered across useWizardV7, curatedFieldsResolver,
 * industryMeta, pricingBridge, and templateIndex — each with their own format
 * (hyphens vs underscores) and their own gap coverage. A new industry required
 * touching 8+ files. Now it requires adding ONE entry here.
 *
 * ARCHITECTURE:
 *   IndustryCatalogEntry[] → resolveIndustryContext() → IndustryContext
 *                                                        ↕
 *                                   Used by: runContractQuote,
 *                                            loadStep3Template,
 *                                            curatedFieldsResolver,
 *                                            pricingBridge
 *
 * SLUG FORMAT:
 *   - canonicalSlug: underscore format (car_wash, data_center) — matches IndustrySlug type
 *   - templateKey: underscore format — matches template JSON `industry` field
 *   - calculatorId: underscore format — matches CalculatorContract.id
 *   - schemaKey: HYPHEN format — matches curatedFieldsResolver's CANONICAL_INDUSTRY_KEYS
 *
 * IMPORTANT: The schemaKey uses hyphens because curatedFieldsResolver's entire
 * CANONICAL_INDUSTRY_KEYS system, COMPLETE_SCHEMAS, legacy questionnaires, and
 * TIER1_BLOCKERS all use hyphens. Changing that would be a larger refactor.
 * Instead, this catalog bridges the two worlds cleanly.
 */

// ============================================================================
// TYPES
// ============================================================================

// ============================================================================
// RESOLUTION TRACE — covenant audit trail
// ============================================================================

/**
 * Describes HOW an industry slug was resolved.
 * Emitted by resolveIndustryContext() for every resolution.
 * Log this alongside TrueQuote traces for full debuggability.
 *
 * The `reason` field answers "why did this slug resolve this way?"
 *   - 'exact'    → slug matched canonicalSlug directly
 *   - 'alias'    → slug matched an explicit alias
 *   - 'variant'  → slug matched a hyphen↔underscore variant of canonical
 *   - 'fallback' → slug was unknown, fell through to "other"
 *
 * The `borrowedFrom` field is set when an industry uses another's
 * template or schema (e.g., restaurant borrows hotel's template + schema).
 */
export interface ResolutionTrace {
  /** The raw slug that was passed in (before any normalization) */
  rawIndustry: string;
  /** Lowercased/trimmed input (what was actually looked up) */
  normalizedInput: string;
  /** The resolved canonical slug */
  canonicalSlug: string;
  /** Resolved template key */
  templateKey: string;
  /** Resolved schema key */
  schemaKey: string;
  /** Resolved calculator ID */
  calculatorId: string;
  /** How the resolution happened */
  reason: "exact" | "alias" | "variant" | "fallback";
  /** If templateKey or schemaKey differ from canonicalSlug, who they were borrowed from */
  borrowedFrom?: string;
  /** ISO timestamp of resolution */
  resolvedAt: string;
}

export interface IndustryCatalogEntry {
  /** Canonical slug — underscore format, matches IndustrySlug type */
  canonicalSlug: string;

  /** Template JSON industry key — which JSON template to load via getTemplate() */
  templateKey: string;

  /** Calculator contract ID — which calculator to use from CALCULATORS_BY_ID */
  calculatorId: string;

  /**
   * Schema key — HYPHEN format, maps to curatedFieldsResolver's
   * normalizeIndustrySlug output (CANONICAL_INDUSTRY_KEYS)
   */
  schemaKey: string;

  /** Alternate slugs that should resolve to this entry */
  aliases: string[];

  /** BESS sizing defaults for this industry */
  sizingDefaults: { ratio: number; hours: number };

  /** Whether this industry has a dedicated JSON template file */
  hasTemplate: boolean;

  /** Whether this industry has a complete curated schema (vs legacy/fallback) */
  hasCuratedSchema: boolean;
}

export interface IndustryContext {
  /** Raw input slug before resolution */
  rawIndustry: string;

  /** Canonical slug — underscore format (car_wash, data_center) */
  canonicalSlug: string;

  /** Which template JSON to load (may differ from canonicalSlug) */
  templateKey: string;

  /** Which calculator contract to use */
  calculatorId: string;

  /** Which schema key to use for curatedFieldsResolver (hyphen format) */
  schemaKey: string;

  /** BESS sizing defaults */
  sizingDefaults: { ratio: number; hours: number };

  /** Whether a dedicated template JSON exists */
  hasTemplate: boolean;

  /** Whether a curated schema exists (vs legacy/fallback) */
  hasCuratedSchema: boolean;

  /** Resolution audit trail — HOW this slug was resolved */
  trace: ResolutionTrace;
}

// ============================================================================
// CATALOG — The ONE truth table
// ============================================================================

/**
 * Every industry the wizard can encounter, with explicit resolution rules.
 *
 * RULES:
 * - If the industry has its own template JSON → templateKey = canonicalSlug
 * - If it borrows another industry's template → templateKey = that industry
 * - calculatorId is ALWAYS the industry's OWN calculator (never borrowed)
 * - schemaKey is the hyphen-format key for curatedFieldsResolver
 *
 * ADDING A NEW INDUSTRY:
 * 1. Add entry here with all fields filled
 * 2. If it needs its own calculator: add adapter in registry.ts
 * 3. If it needs curated questions: add to COMPLETE_SCHEMAS in curatedFieldsResolver.ts
 * 4. Add to INDUSTRY_META in industryMeta.ts for display
 * 5. Run `npm run ship:v7` to validate
 */
export const INDUSTRY_CATALOG: IndustryCatalogEntry[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // FULL TEMPLATE + DEDICATED CALCULATOR industries (8)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    canonicalSlug: "data_center",
    templateKey: "data_center",
    calculatorId: "dc_load_v1",
    schemaKey: "datacenter",
    aliases: ["datacenter", "data-center"],
    sizingDefaults: { ratio: 0.5, hours: 4 },
    hasTemplate: true,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "hotel",
    templateKey: "hotel",
    calculatorId: "hotel_load_v1",
    schemaKey: "hotel",
    aliases: ["hospitality"],
    sizingDefaults: { ratio: 0.4, hours: 4 },
    hasTemplate: true,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "car_wash",
    templateKey: "car_wash",
    calculatorId: "car_wash_load_v1",
    schemaKey: "car-wash",
    aliases: ["carwash", "car-wash"],
    sizingDefaults: { ratio: 0.35, hours: 2 },
    hasTemplate: true,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "hospital",
    templateKey: "hospital",
    calculatorId: "hospital_load_v1",
    schemaKey: "hospital",
    aliases: ["healthcare", "medical", "clinic"],
    sizingDefaults: { ratio: 0.7, hours: 4 },
    hasTemplate: true,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "ev_charging",
    templateKey: "ev_charging",
    calculatorId: "ev_charging_load_v1",
    schemaKey: "ev-charging",
    aliases: ["evcharging", "ev-charging", "ev_charger"],
    sizingDefaults: { ratio: 0.6, hours: 2 },
    hasTemplate: true,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "manufacturing",
    templateKey: "manufacturing",
    calculatorId: "manufacturing_load_v1",
    schemaKey: "manufacturing",
    aliases: ["industrial", "factory"],
    sizingDefaults: { ratio: 0.45, hours: 2 },
    hasTemplate: true,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "office",
    templateKey: "office",
    calculatorId: "office_load_v1",
    schemaKey: "office",
    aliases: ["commercial-office", "coworking"],
    sizingDefaults: { ratio: 0.35, hours: 4 },
    hasTemplate: true,
    hasCuratedSchema: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NO TEMPLATE — borrows template, has OWN calculator (4)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    canonicalSlug: "restaurant",
    templateKey: "hotel", // borrows hotel's commercial template
    calculatorId: "restaurant_load_v1", // has own physics model
    schemaKey: "restaurant", // now has its own curated schema with restaurant-specific questions
    aliases: ["food-service", "dining"],
    sizingDefaults: { ratio: 0.4, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: true, // resolves via schemaKey → restaurant's COMPLETE_SCHEMAS entry
  },
  {
    canonicalSlug: "retail",
    templateKey: "hotel", // borrows hotel's commercial template
    calculatorId: "retail_load_v1", // has own physics model
    schemaKey: "retail",
    aliases: ["shopping", "shopping-center", "shopping_center", "store"],
    sizingDefaults: { ratio: 0.35, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "warehouse",
    templateKey: "data_center", // borrows data center's industrial template
    calculatorId: "warehouse_load_v1", // has own physics model
    schemaKey: "warehouse",
    aliases: ["logistics", "logistics-center", "logistics_center", "distribution"],
    sizingDefaults: { ratio: 0.3, hours: 2 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "gas_station",
    templateKey: "hotel", // borrows hotel's commercial template
    calculatorId: "gas_station_load_v1", // has own physics model
    schemaKey: "gas-station",
    aliases: ["gas-station", "fuel-station"],
    sizingDefaults: { ratio: 0.4, hours: 2 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "truck_stop",
    templateKey: "hotel", // borrows hotel's commercial template
    calculatorId: "truck_stop_load_v1", // dedicated truck stop calculator
    schemaKey: "gas-station", // shares gas station questionnaire
    aliases: ["truck-stop", "travel-center", "heavy_duty_truck_stop"],
    sizingDefaults: { ratio: 0.5, hours: 4 }, // larger BESS for truck stops
    hasTemplate: false,
    hasCuratedSchema: true, // resolves via schemaKey → gas-station's COMPLETE_SCHEMAS entry
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NO TEMPLATE, NO DEDICATED CALCULATOR — uses generic (10+)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    canonicalSlug: "airport",
    templateKey: "generic",
    calculatorId: "airport_load_v1",
    schemaKey: "airport",
    aliases: [],
    sizingDefaults: { ratio: 0.5, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "casino",
    templateKey: "generic",
    calculatorId: "casino_load_v1",
    schemaKey: "casino",
    aliases: ["tribal-casino", "tribal_casino", "casino-gaming", "casino_gaming"],
    sizingDefaults: { ratio: 0.45, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "college",
    templateKey: "generic",
    calculatorId: "college_load_v1",
    schemaKey: "college",
    aliases: ["university", "campus"],
    sizingDefaults: { ratio: 0.4, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "apartment",
    templateKey: "generic",
    calculatorId: "apartment_load_v1",
    schemaKey: "apartment",
    aliases: ["multifamily", "condo", "residential-complex"],
    sizingDefaults: { ratio: 0.35, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "residential",
    templateKey: "generic",
    calculatorId: "residential_load_v1",
    schemaKey: "residential",
    aliases: ["home", "single-family"],
    sizingDefaults: { ratio: 0.3, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "cold_storage",
    templateKey: "generic",
    calculatorId: "cold_storage_load_v1",
    schemaKey: "cold-storage",
    aliases: ["cold-storage", "refrigerated"],
    sizingDefaults: { ratio: 0.5, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "indoor_farm",
    templateKey: "generic",
    calculatorId: "indoor_farm_load_v1",
    schemaKey: "indoor-farm",
    aliases: ["indoor-farm", "vertical-farm", "greenhouse"],
    sizingDefaults: { ratio: 0.4, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "agriculture",
    templateKey: "generic",
    calculatorId: "agriculture_load_v1",
    schemaKey: "agriculture",
    aliases: ["farm", "farming", "irrigation"],
    sizingDefaults: { ratio: 0.35, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },
  {
    canonicalSlug: "government",
    templateKey: "generic",
    calculatorId: "government_load_v1",
    schemaKey: "government",
    aliases: ["public", "municipal"],
    sizingDefaults: { ratio: 0.4, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIAL ENTRIES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    canonicalSlug: "other",
    templateKey: "generic",
    calculatorId: "generic_ssot_v1",
    schemaKey: "other",
    aliases: ["custom", "unknown", "generic"],
    sizingDefaults: { ratio: 0.4, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: false,
  },
  {
    canonicalSlug: "auto",
    templateKey: "generic",
    calculatorId: "generic_ssot_v1",
    schemaKey: "auto",
    aliases: [],
    sizingDefaults: { ratio: 0.4, hours: 4 },
    hasTemplate: false,
    hasCuratedSchema: false,
  },
];
