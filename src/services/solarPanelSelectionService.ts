/**
 * Solar Panel Selection Service
 * ==============================
 *
 * Queries approved solar panels from vendor_products, scores them by
 * $/lifetime-yield (efficiency × warranty / effectivePricePerWatt), and
 * returns the best match for a given project.
 *
 * Falls back to SSOT_FALLBACK_PANEL (400W / 20.5% / $1.00/W) when:
 *   - Supabase is not configured
 *   - No approved solar panels exist in the DB
 *   - Any query error occurs
 *
 * Caches results for 1 hour to avoid repeated DB round-trips during a session.
 *
 * Created: March 27, 2026
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface SolarPanelSpec {
  /** DB row id — "ssot-fallback" when using the hardcoded fallback */
  id: string;
  vendorId: string;
  manufacturer: string;
  model: string;
  /** Rated DC power at STC (Wp) — e.g. 400, 500 */
  wattPeak: number;
  /** Module efficiency at STC (%) — e.g. 22.3 */
  efficiencyPct: number;
  /** Physical area per panel (sq ft) — e.g. 21.5 */
  areaSqft: number;
  /** monocrystalline | bifacial | perc | topcon | thin-film */
  panelType: string;
  /** Base price before tariff ($/Wp equipment-only) */
  pricePerWatt: number;
  /** Tariff adder (%) — Section 301 CN panels = 25.0, most others = 0 */
  tariffAdderPct: number;
  /** After-tariff price: pricePerWatt × (1 + tariffAdderPct/100) */
  effectivePricePerWatt: number;
  /** ISO 3166-1 alpha-2 country of manufacture — e.g. 'US', 'CN', 'PH' */
  countryOfOrigin: string;
  leadTimeWeeks: number;
  warrantyYears: number;
  /** Annual power degradation (%/yr) — default 0.5% */
  degradationPctYr: number;
  /** Score used for ranking; higher = better. Not surfaced in UI. */
  score: number;
  /** True if this is the hardcoded fallback, not a DB record */
  isFallback: boolean;
}

// ============================================================================
// SSOT FALLBACK — matches current hardcoded engine assumptions exactly
// ============================================================================

export const SSOT_FALLBACK_PANEL: SolarPanelSpec = {
  id: "ssot-fallback",
  vendorId: "",
  manufacturer: "Generic",
  model: "400W Mono",
  wattPeak: 400,
  efficiencyPct: 20.5,
  areaSqft: 21.5,
  panelType: "monocrystalline",
  pricePerWatt: 1.0,
  tariffAdderPct: 0,
  effectivePricePerWatt: 1.0,
  countryOfOrigin: "US",
  leadTimeWeeks: 8,
  warrantyYears: 25,
  degradationPctYr: 0.5,
  score: 0,
  isFallback: true,
};

// ============================================================================
// SCORING
// ============================================================================

/**
 * Score a panel for project suitability.
 *
 * Metric: efficiency × warrantyYears / effectivePricePerWatt
 *
 * This rewards:
 *   - High efficiency (more kWh per sq ft of roof)
 *   - Long warranty (lower long-run degradation risk)
 *   - Lower all-in cost (including tariff)
 *
 * Optional multipliers:
 *   - degradation: lower annual degradation → more lifetime yield
 *   - bifacial: bifacial panels get +5% yield boost if site allows it
 */
function scorePanel(panel: SolarPanelSpec): number {
  const lifetimeYieldFactor =
    panel.efficiencyPct *
    panel.warrantyYears *
    (1 - panel.degradationPctYr / 100) ** (panel.warrantyYears / 2);

  const bifacialBonus = panel.panelType === "bifacial" ? 1.05 : 1.0;

  return (lifetimeYieldFactor * bifacialBonus) / panel.effectivePricePerWatt;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

interface CacheEntry {
  panels: SolarPanelSpec[];
  fetchedAt: number; // Date.now()
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let _cache: CacheEntry | null = null;

function isCacheValid(): boolean {
  return Boolean(_cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS);
}

/** Bust the cache — call after vendor product approval in admin flow */
export function bustSolarPanelCache(): void {
  _cache = null;
}

/**
 * Returns the best panel from cache synchronously — no DB round-trip.
 * Returns null if the cache is cold (buildTiers hasn't run yet this session).
 * Use this in reactive/synchronous contexts (useEffect, render-time calcs).
 */
export function getLastSelectedPanelSync(): SolarPanelSpec | null {
  if (!isCacheValid() || !_cache || _cache.panels.length === 0) return null;
  // panels are stored in insertion order (unsorted); re-sort and return best
  const sorted = [..._cache.panels].sort((a, b) => b.score - a.score);
  return sorted[0];
}

// ============================================================================
// DB QUERY
// ============================================================================

async function fetchApprovedPanels(): Promise<SolarPanelSpec[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from("vendor_products")
    .select(
      // Only select columns that actually exist in the vendor_products schema.
      // Solar-specific columns (watt_peak, panel_area_sqft, etc.) are not in the
      // DB — their values are derived or use industry-standard fallbacks below.
      `id, vendor_id, manufacturer, model,
       power_kw, efficiency_percent,
       price_per_kw, price_per_kwh,
       lead_time_weeks, warranty_years`
    )
    .eq("product_category", "solar")
    .eq("status", "approved")
    .not("power_kw", "is", null)
    .not("price_per_kw", "is", null)
    .order("power_kw", { ascending: false });

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[SolarPanelSelection] DB query error:", error.message);
    }
    return [];
  }

  if (!data || data.length === 0) return [];

  return (data as unknown as Record<string, unknown>[]).map((row) => {
    // power_kw is the panel's rated DC output in kW; convert to Wp
    const powerKw = Number(row.power_kw ?? 0.4);
    const wattPeak = Math.round(powerKw * 1000); // e.g. 0.5 kW → 500 Wp

    // price_per_kw is $/kW equipment; convert to $/Wp
    const pricePerKw = Number(row.price_per_kw ?? 1000);
    const basePrice = pricePerKw / 1000; // e.g. $1000/kW → $1.00/Wp

    // No tariff column in DB yet — default to 0
    const tariffPct = 0;
    const effectivePrice = basePrice * (1 + tariffPct / 100);

    const spec: SolarPanelSpec = {
      id: String(row.id),
      vendorId: String(row.vendor_id ?? ""),
      manufacturer: String(row.manufacturer ?? ""),
      model: String(row.model ?? ""),
      wattPeak,
      // efficiency_percent is the DB column; maps to efficiencyPct in SolarPanelSpec
      efficiencyPct: Number(row.efficiency_percent ?? 20.5),
      // panel_area_sqft not in DB — 21.5 sqft is standard for ~400–500W mono panels
      areaSqft: 21.5,
      // panel_type not in DB — default to monocrystalline (most common C&I product)
      panelType: "monocrystalline",
      pricePerWatt: basePrice,
      tariffAdderPct: tariffPct,
      effectivePricePerWatt: effectivePrice,
      // country_of_origin not in DB — default US
      countryOfOrigin: "US",
      leadTimeWeeks: Number(row.lead_time_weeks ?? 8),
      warrantyYears: Number(row.warranty_years ?? 25),
      // degradation_pct_yr not in DB — NREL/IEA standard for mono Si
      degradationPctYr: 0.5,
      score: 0,
      isFallback: false,
    };
    spec.score = scorePanel(spec);
    return spec;
  });
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Returns all approved solar panels ranked by score (best first).
 * Returns [SSOT_FALLBACK_PANEL] when the DB has no approved panels.
 */
export async function getApprovedSolarPanels(): Promise<SolarPanelSpec[]> {
  if (!isCacheValid()) {
    const panels = await fetchApprovedPanels();
    _cache = { panels, fetchedAt: Date.now() };
  }

  const panels = _cache!.panels;
  if (panels.length === 0) return [SSOT_FALLBACK_PANEL];

  return [...panels].sort((a, b) => b.score - a.score);
}

/**
 * Returns the single best-scoring approved panel for use in the quote engine.
 *
 * Falls back to SSOT_FALLBACK_PANEL silently so the engine never breaks.
 *
 * @param projectState  - Optional US state code (reserved for future geo-scoring)
 * @param solarKW       - Optional system size; reserved for min-batch filtering
 */
export async function selectOptimalPanel(
  _projectState?: string,
  _solarKW?: number,
  /** 'premium' biases toward highest-efficiency panels (≥22.5%) for fixed-roof
   *  area sites where more Wp per sqft directly means more kWh (car wash, etc).
   *  'standard' (default) picks the best cost/lifetime-yield score. */
  panelTier?: "standard" | "premium" | string
): Promise<SolarPanelSpec> {
  try {
    const ranked = await getApprovedSolarPanels();
    if (panelTier === "premium") {
      // Premium: sort by efficiency descending, fall back to score if tied
      const premiumRanked = [...ranked].sort(
        (a, b) => b.efficiencyPct - a.efficiencyPct || b.score - a.score
      );
      return premiumRanked[0] ?? SSOT_FALLBACK_PANEL;
    }
    return ranked[0]; // default: best cost/lifetime-yield score
  } catch {
    return SSOT_FALLBACK_PANEL;
  }
}

/**
 * Returns the effective price-per-watt for solar equipment pricing,
 * incorporating any tariff adder from the selected panel.
 *
 * Used as the override for EQUIPMENT_UNIT_COSTS.solar.pricePerWatt.
 */
export async function getSolarPricePerWatt(): Promise<number> {
  const panel = await selectOptimalPanel();
  return panel.effectivePricePerWatt;
}

/**
 * Computes the sqft-per-kW density constant for a given panel.
 *
 * Replaces the hardcoded `/ 100` in getCarWashSolarCapacity().
 *
 * Formula:
 *   sqftPerKW = (areaSqft * 1000) / wattPeak
 *
 * Examples:
 *   400W @ 21.5 sqft → 53.75 sqft/kW DC → ~86 sqft/kW AC (after 0.625 derate) ≈ 100
 *   500W @ 21.5 sqft → 43.0 sqft/kW DC  → ~69 sqft/kW AC  (15% more capacity)
 *
 * The function returns the AC-adjusted value by applying DC-AC ratio 0.625
 * (consistent with the existing hardcoded `/ 100` which implies ~10 W/sqft AC).
 */
export function panelDensitySqftPerKWac(panel: SolarPanelSpec): number {
  const DC_AC_RATIO = 0.625; // industry standard for C&I rooftop (ILR 1.6)
  const sqftPerKWdc = (panel.areaSqft * 1000) / panel.wattPeak;
  return sqftPerKWdc / DC_AC_RATIO;
}

/**
 * Given a system size (kW AC) and selected panel, returns the number of panels needed.
 */
export function panelCount(solarKWac: number, panel: SolarPanelSpec): number {
  const DC_AC_RATIO = 0.625;
  const solarKWdc = solarKWac / DC_AC_RATIO;
  return Math.ceil((solarKWdc * 1000) / panel.wattPeak);
}

/**
 * Human-readable label for use in Step 5 quote display.
 * E.g.: "Maxeon Maxeon 6 AC 500 · 500W · 24.1% eff."
 */
export function panelDisplayLabel(panel: SolarPanelSpec): string {
  if (panel.isFallback) return "";
  return `${panel.manufacturer} ${panel.model} · ${panel.wattPeak}W · ${panel.efficiencyPct}% eff.`;
}

/**
 * Tariff note for Step 5 quote display (shown in amber when relevant).
 * E.g.: "~25% Section 301 tariff (China origin) reflected in pricing"
 */
export function panelTariffNote(panel: SolarPanelSpec): string | null {
  if (panel.tariffAdderPct <= 0) return null;
  const originLabel = panel.countryOfOrigin === "CN" ? "China origin" : panel.countryOfOrigin;
  return `~${panel.tariffAdderPct}% tariff adder (${originLabel}) reflected in pricing`;
}

export default {
  selectOptimalPanel,
  getApprovedSolarPanels,
  getLastSelectedPanelSync,
  getSolarPricePerWatt,
  panelDensitySqftPerKWac,
  panelCount,
  panelDisplayLabel,
  panelTariffNote,
  bustSolarPanelCache,
  SSOT_FALLBACK_PANEL,
};
