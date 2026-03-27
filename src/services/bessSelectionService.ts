/**
 * BESS Selection Service
 * ======================
 *
 * Mirrors solarPanelSelectionService.ts — same scoring/caching/fallback pattern.
 *
 * Selects the optimal BESS product from approved vendor_products for a given
 * system size (kWh + kW). Scores by $/lifetime-kWh to find the lowest effective
 * cost of storage over the system life.
 *
 * PRICING PRIORITY ORDER (matches equipmentPricingTiersService):
 *   1. Approved vendor product (vendor_products table, product_category='battery')
 *   2. Market data (collected_market_prices via getMarketAdjustedPrice) — scraper
 *   3. SSOT fallback (EQUIPMENT_UNIT_COSTS.bess — hardcoded constants)
 *
 * TRUSTED PARTNERS (pre-seeded as approved, March 2026):
 *   • Great Power Energy & Technology — GP-BESS-200 / GP-BESS-500
 *     Top-5 global LFP manufacturer, IEC/UL certified, ~$255-262/kWh
 *   • Discovery Energy Solutions — DCS-E 240
 *     Field-proven C&I supplier, IEC 62619 + SANS 62619, ~$285/kWh
 *   • LiON Energy — Guardian 250 / Guardian 500
 *     US-assembled, UL-listed, shortest lead time (12 wk), ~$305-310/kWh
 *
 * Key exports:
 *   selectOptimalBESS(requestedKwh, requestedKw) → BESSSpec (async)
 *   getLastSelectedBESSSync()                    → BESSSpec | null (sync cache)
 *   bustBESSCache()                              → void (call on vendor approval)
 *   SSOT_FALLBACK_BESS                           → BESSSpec (reference fallback)
 *
 * Called by:
 *   step4Logic.ts → buildTiers() — one lookup per quote, shared across all tiers
 *   vendorService.ts → approveProduct() — cache bust on new approval
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export interface BESSSpec {
  id: string;
  vendorId: string;
  manufacturer: string;
  model: string;
  /** Pack capacity (kWh) */
  capacityKwh: number;
  /** Power rating (kW) */
  powerKw: number;
  /** Battery chemistry: LFP | NMC | NCA | VRLA */
  chemistry: string;
  /** Pack $/kWh (equipment only, excl. PCS + installation) */
  pricePerKwh: number;
  /** PCS / hybrid inverter $/kW */
  pricePerKw: number;
  /** Effective $/kWh after any tariff adder (computed by DB) */
  effectivePricePerKwh: number;
  /** AC-AC round-trip efficiency (%) */
  roundtripEfficiencyPct: number;
  /** Usable depth of discharge (%) */
  depthOfDischargePct: number;
  /** Rated cycle life to 80% SoH */
  cycleLife: number;
  /** Annual capacity degradation (%/yr) */
  annualDegradationPct: number;
  /** Calendar warranty (years) */
  warrantyYears: number;
  /** Cycle warranty */
  warrantyCycles?: number;
  /** Estimated lead time (weeks) */
  leadTimeWeeks: number;
  /** Continuous C-rate (determines kW/kWh ratio) */
  cRateContinuous?: number;
  /** Lifetime-yield score (lower $/kWh-lifetime = better) — used for ranking */
  score: number;
  /** True when no vendor product was found and SSOT/market fallback is active */
  isFallback: boolean;
}

// ============================================================================
// SSOT FALLBACK (matches EQUIPMENT_UNIT_COSTS.bess in pricingServiceV45.ts)
// ============================================================================

/**
 * Fallback BESS spec used when no approved vendor products exist.
 * Prices MUST stay in sync with EQUIPMENT_UNIT_COSTS.bess in pricingServiceV45.ts.
 * NREL ATB 2024 / BNEF Q1 2026 C&I containerized LFP benchmark.
 */
export const SSOT_FALLBACK_BESS: BESSSpec = {
  id: "ssot-fallback",
  vendorId: "ssot",
  manufacturer: "Market Reference",
  model: "C&I LFP Containerized (NREL ATB 2024)",
  capacityKwh: 250,
  powerKw: 62.5, // 4-hour duration (C/4)
  chemistry: "LFP",
  pricePerKwh: 350, // MUST match EQUIPMENT_UNIT_COSTS.bess.pricePerKWh
  pricePerKw: 150, // MUST match EQUIPMENT_UNIT_COSTS.bess.pricePerKW
  effectivePricePerKwh: 350,
  roundtripEfficiencyPct: 85,
  depthOfDischargePct: 90,
  cycleLife: 4000,
  annualDegradationPct: 2.5,
  warrantyYears: 10,
  warrantyCycles: 4000,
  leadTimeWeeks: 16,
  cRateContinuous: 0.25,
  score: 0,
  isFallback: true,
};

// ============================================================================
// SCORING FUNCTION — $/lifetime-kWh (lower = better value)
// ============================================================================

/**
 * Score a BESS product by effective cost per usable lifetime kWh.
 *
 * Formula:
 *   Usable kWh/cycle = capacityKwh × DoD%/100
 *   Lifetime kWh     = usable × cycleLife × (1 - annualDegradation/100)^(warrantyYears/2)
 *   Score            = effectivePricePerKwh / (lifetime_kWh / capacityKwh)
 *
 * Lower score = more kWh delivered per $. LFP's longer cycle life beats NMC on this
 * metric even at higher pack $/kWh, which matches real C&I procurement behavior.
 */
function scoreBESS(spec: {
  capacityKwh: number;
  pricePerKwh: number;
  effectivePricePerKwh: number;
  roundtripEfficiencyPct: number;
  depthOfDischargePct: number;
  cycleLife: number;
  annualDegradationPct: number;
  warrantyYears: number;
}): number {
  const usableKwhPerCycle = spec.capacityKwh * (spec.depthOfDischargePct / 100);
  const midlifeRetention = Math.pow(1 - spec.annualDegradationPct / 100, spec.warrantyYears / 2);
  const lifetimeKwh = usableKwhPerCycle * spec.cycleLife * midlifeRetention;
  if (lifetimeKwh <= 0) return Infinity;
  // $/lifetime-kWh delivered (lower is better)
  return (spec.effectivePricePerKwh * spec.capacityKwh) / lifetimeKwh;
}

// ============================================================================
// CACHE
// ============================================================================

interface BESSCache {
  spec: BESSSpec;
  fetchedAt: number;
  requestedKwh: number;
  requestedKw: number;
}

let _cache: BESSCache | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function bustBESSCache(): void {
  _cache = null;
  if (import.meta.env.DEV) {
    console.log("🔋 bessSelectionService: cache busted");
  }
}

/**
 * Synchronous cache reader — returns the last selected BESS or null.
 * Used by:
 *   - useWizardV8.ts capacity hooks (non-async context)
 *   - Step3_5V8.tsx display (non-async context)
 */
export function getLastSelectedBESSSync(): BESSSpec | null {
  if (!_cache) return null;
  if (Date.now() > _cache.fetchedAt + CACHE_TTL_MS) return null;
  return _cache.spec;
}

// ============================================================================
// MARKET DATA FALLBACK — scraper-sourced pricing
// ============================================================================

/**
 * Get the latest BESS pack price from the market data scraper.
 * Uses equipmentPricingTiersService priority chain:
 *   collected_market_prices (verified, ≤30 days) → equipment_pricing_tiers → hardcoded fallback
 *
 * Returns null if the pricing service is not available.
 */
async function getBESSMarketPrice(): Promise<{ pricePerKwh: number; source: string } | null> {
  try {
    const { getMarketAdjustedPrice } = await import("./equipmentPricingTiersService");
    const result = await getMarketAdjustedPrice("bess", { tier: "standard" });
    if (result && result.price > 0) {
      return {
        pricePerKwh: result.price,
        source: result.trueQuote?.source ?? "market data",
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// MAIN SELECTION FUNCTION
// ============================================================================

/**
 * Select the optimal BESS from approved vendor_products for the given system size.
 *
 * Fallback chain:
 *   1. vendor_products WHERE product_category='battery' AND status='approved'
 *      → score by $/lifetime-kWh, pick the best match for requestedKwh
 *   2. Market data from scraper (collected_market_prices via getMarketAdjustedPrice)
 *      → build a synthetic BESSSpec with scraper price + SSOT fallback specs
 *   3. SSOT_FALLBACK_BESS (matches EQUIPMENT_UNIT_COSTS.bess hardcoded constants)
 *
 * The result is cached for CACHE_TTL_MS to avoid re-querying on every tier build.
 *
 * @param requestedKwh - Target system capacity (kWh)
 * @param requestedKw  - Target system power (kW)
 */
export async function selectOptimalBESS(
  requestedKwh: number,
  requestedKw: number
): Promise<BESSSpec> {
  // Return cached result if still valid and size hasn't changed significantly
  if (_cache && Date.now() < _cache.fetchedAt + CACHE_TTL_MS) {
    const sizeDrift = Math.abs(_cache.requestedKwh - requestedKwh) / Math.max(requestedKwh, 1);
    if (sizeDrift < 0.5) {
      // Cache is valid and within 50% size range — reuse
      return _cache.spec;
    }
  }

  // ── Step 1: Vendor products ──────────────────────────────────────────────
  if (isSupabaseConfigured()) {
    try {
      // Accept any product within 3× the requested size (scalable units)
      const maxCapacity = Math.max(requestedKwh * 3.0, 500);

      const { data, error } = await supabase
        .from("vendor_products")
        .select(
          [
            "id",
            "vendor_id",
            "manufacturer",
            "model",
            "capacity_kwh",
            "power_kw",
            "chemistry",
            "price_per_kwh",
            "price_per_kw",
            "effective_price_per_kwh",
            "roundtrip_efficiency_pct",
            "depth_of_discharge_pct",
            "cycle_life",
            "annual_degradation_pct",
            "warranty_years",
            "warranty_cycles",
            "lead_time_weeks",
            "c_rate_continuous",
            "tariff_adder_pct",
          ].join(", ")
        )
        .eq("status", "approved")
        .eq("product_category", "battery")
        .gt("capacity_kwh", 0)
        .lte("capacity_kwh", maxCapacity)
        .order("approved_at", { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        // Score all candidates and pick the best
        const rows = data as unknown as Record<string, unknown>[];
        const candidates: BESSSpec[] = rows.map((row) => {
          const pricePerKwh = Number(row["price_per_kwh"] ?? SSOT_FALLBACK_BESS.pricePerKwh);
          const pricePerKw = Number(row["price_per_kw"] ?? SSOT_FALLBACK_BESS.pricePerKw);
          const effectivePrice = Number(
            row["effective_price_per_kwh"] ?? row["price_per_kwh"] ?? SSOT_FALLBACK_BESS.pricePerKwh
          );
          const rte = Number(
            row["roundtrip_efficiency_pct"] ?? SSOT_FALLBACK_BESS.roundtripEfficiencyPct
          );
          const dod = Number(
            row["depth_of_discharge_pct"] ?? SSOT_FALLBACK_BESS.depthOfDischargePct
          );
          const cycles = Number(row["cycle_life"] ?? SSOT_FALLBACK_BESS.cycleLife);
          const degradation = Number(
            row["annual_degradation_pct"] ?? SSOT_FALLBACK_BESS.annualDegradationPct
          );
          const warrantyYrs = Number(row["warranty_years"] ?? SSOT_FALLBACK_BESS.warrantyYears);
          const capacityKwh = Number(row["capacity_kwh"]);
          const powerKw = Number(row["power_kw"] ?? capacityKwh * 0.25); // Default 4-hr

          const score = scoreBESS({
            capacityKwh,
            pricePerKwh,
            effectivePricePerKwh: effectivePrice,
            roundtripEfficiencyPct: rte,
            depthOfDischargePct: dod,
            cycleLife: cycles,
            annualDegradationPct: degradation,
            warrantyYears: warrantyYrs,
          });

          return {
            id: String(row["id"] ?? ""),
            vendorId: String(row["vendor_id"] ?? ""),
            manufacturer: String(row["manufacturer"] ?? ""),
            model: String(row["model"] ?? ""),
            capacityKwh,
            powerKw,
            chemistry: String(row["chemistry"] ?? "LFP"),
            pricePerKwh,
            pricePerKw,
            effectivePricePerKwh: effectivePrice,
            roundtripEfficiencyPct: rte,
            depthOfDischargePct: dod,
            cycleLife: cycles,
            annualDegradationPct: degradation,
            warrantyYears: warrantyYrs,
            warrantyCycles: row["warranty_cycles"] ? Number(row["warranty_cycles"]) : undefined,
            leadTimeWeeks: Number(row["lead_time_weeks"] ?? 16),
            cRateContinuous: row["c_rate_continuous"]
              ? Number(row["c_rate_continuous"])
              : undefined,
            score,
            isFallback: false,
          };
        });

        // Sort by score ascending (lower $/lifetime-kWh = better)
        candidates.sort((a, b) => a.score - b.score);
        const best = candidates[0];

        _cache = { spec: best, fetchedAt: Date.now(), requestedKwh, requestedKw };

        if (import.meta.env.DEV) {
          console.log(
            `🔋 bessSelectionService: selected ${best.manufacturer} ${best.model} ` +
              `(${best.effectivePricePerKwh.toFixed(2)}/kWh, score=${best.score.toFixed(4)})`
          );
        }

        return best;
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("⚠️ bessSelectionService: DB query failed, trying market fallback", err);
      }
    }
  }

  // ── Step 2: Market data from scraper ────────────────────────────────────
  const marketPrice = await getBESSMarketPrice();
  if (marketPrice && marketPrice.pricePerKwh > 0) {
    // Sanity-check the scraped price against our guardrails
    const clampedPrice = Math.min(
      Math.max(marketPrice.pricePerKwh, 105), // Floor: $105/kWh (utility-scale floor)
      500 // Ceiling: $500/kWh (custom/premium)
    );

    const marketSpec: BESSSpec = {
      ...SSOT_FALLBACK_BESS,
      id: "market-data",
      manufacturer: "Market Reference",
      model: `C&I LFP — ${marketPrice.source}`,
      pricePerKwh: clampedPrice,
      effectivePricePerKwh: clampedPrice,
      score: scoreBESS({
        ...SSOT_FALLBACK_BESS,
        pricePerKwh: clampedPrice,
        effectivePricePerKwh: clampedPrice,
      }),
      isFallback: true, // Still a fallback — not a real product submission
    };

    _cache = { spec: marketSpec, fetchedAt: Date.now(), requestedKwh, requestedKw };

    if (import.meta.env.DEV) {
      console.log(
        `🔋 bessSelectionService: using market price $${clampedPrice.toFixed(2)}/kWh ` +
          `(${marketPrice.source})`
      );
    }

    return marketSpec;
  }

  // ── Step 3: SSOT hardcoded fallback ─────────────────────────────────────
  if (import.meta.env.DEV) {
    console.log("🔋 bessSelectionService: using SSOT fallback ($350/kWh)");
  }

  _cache = { spec: SSOT_FALLBACK_BESS, fetchedAt: Date.now(), requestedKwh, requestedKw };
  return SSOT_FALLBACK_BESS;
}

// ============================================================================
// RE-EXPORT UTILITY (used by step4Logic to compute number of containers)
// ============================================================================

/**
 * Estimate the number of BESS containers/units needed for a given system size.
 * Uses the unit capacity from the selected product (or SSOT fallback 250 kWh).
 */
export function bessContainerCount(systemKwh: number, spec: BESSSpec): number {
  if (spec.capacityKwh <= 0 || spec.isFallback) return 0;
  return Math.ceil(systemKwh / spec.capacityKwh);
}
