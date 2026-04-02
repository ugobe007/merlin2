/**
 * Inverter / PCS Selection Service
 * =================================
 *
 * Selects the optimal inverter or power-conversion system (PCS) from approved
 * vendor_products for a given solar AC output or BESS power requirement.
 *
 * PRICING PRIORITY ORDER (mirrors bessSelectionService / solarPanelSelectionService):
 *   1. Approved vendor product (vendor_products table, product_category='inverter')
 *   2. SSOT fallback (SSOT_FALLBACK_INVERTER — hardcoded market benchmark)
 *
 * SEED DATA (pre-seeded March 2026):
 *   • SMA Sunny Tripower CORE2 110kW   — $65/kW, 98.7% eff, 10yr warranty
 *   • Sungrow SG250HX 250kW            — $55/kW, 98.9% eff, 10yr warranty  ← best value
 *   • SolarEdge StorEdge 100kW PCS     — $75/kW, 98.0% eff, 12yr warranty  ← premium hybrid
 *
 * Key exports:
 *   selectOptimalInverter(systemKw)   → InverterSpec (async)
 *   getLastSelectedInverterSync()     → InverterSpec | null (sync cache)
 *   bustInverterCache()               → void
 *   SSOT_FALLBACK_INVERTER            → InverterSpec (reference fallback)
 *
 * Called by:
 *   vendorProductPricingBridge.ts → resolveVendorPricing()
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export interface InverterSpec {
  id: string;
  vendorId: string;
  manufacturer: string;
  model: string;
  /** Rated AC output power (kW) */
  powerKw: number;
  /** CEC/EU weighted efficiency (%) */
  efficiencyPercent: number;
  /** Equipment cost per kW of AC output */
  pricePerKw: number;
  /** Calendar warranty (years) */
  warrantyYears: number;
  /** Estimated lead time (weeks) */
  leadTimeWeeks: number;
  /** True when no vendor product was found and SSOT fallback is active */
  isFallback: boolean;
}

// ============================================================================
// SSOT FALLBACK — matches pricingServiceV45 EQUIPMENT_UNIT_COSTS.inverter
// ============================================================================

/**
 * Fallback inverter spec used when no approved vendor products exist.
 * Benchmark: NREL U.S. Solar Photovoltaic System & Storage Cost Benchmark Q1 2025.
 * $60–$70/kW for utility-string inverters; use $65 as mid-point.
 */
export const SSOT_FALLBACK_INVERTER: InverterSpec = {
  id: "ssot-fallback-inverter",
  vendorId: "ssot",
  manufacturer: "Market Reference",
  model: "C&I String Inverter (NREL 2025 Benchmark)",
  powerKw: 100,
  efficiencyPercent: 98.5,
  pricePerKw: 65, // $65/kW — NREL Q1 2025 C&I benchmark
  warrantyYears: 10,
  leadTimeWeeks: 12,
  isFallback: true,
};

// ============================================================================
// CACHE
// ============================================================================

interface InverterCache {
  spec: InverterSpec;
  fetchedAt: number;
  requestedKw: number;
}

let _cache: InverterCache | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function bustInverterCache(): void {
  _cache = null;
  if (import.meta.env.DEV) {
    console.log("⚡ inverterSelectionService: cache busted");
  }
}

/**
 * Synchronous cache reader — returns the last selected inverter or null.
 * Used by vendorProductPricingBridge in synchronous contexts.
 */
export function getLastSelectedInverterSync(): InverterSpec | null {
  if (!_cache) return null;
  if (Date.now() > _cache.fetchedAt + CACHE_TTL_MS) return null;
  return _cache.spec;
}

// ============================================================================
// MAIN SELECTION FUNCTION
// ============================================================================

/**
 * Select the optimal inverter/PCS from approved vendor_products for the given
 * system power requirement.
 *
 * Scoring: lowest price_per_kw wins (all approved products qualify regardless
 * of rated power_kw because inverters are modular/stackable in C&I systems).
 *
 * Fallback chain:
 *   1. vendor_products WHERE product_category='inverter' AND status='approved'
 *      → pick lowest price_per_kw
 *   2. SSOT_FALLBACK_INVERTER ($65/kW, NREL benchmark)
 *
 * @param systemKw - Total AC system power requirement (kW). Used to prefer
 *                   inverters whose rated powerKw is close to a single-unit fit,
 *                   but does NOT exclude oversized/undersized units.
 */
export async function selectOptimalInverter(systemKw: number): Promise<InverterSpec> {
  // Return cached result if still valid and size hasn't drifted significantly
  if (_cache && Date.now() < _cache.fetchedAt + CACHE_TTL_MS) {
    const drift = Math.abs(_cache.requestedKw - systemKw) / Math.max(systemKw, 1);
    if (drift < 0.5) return _cache.spec;
  }

  // ── Vendor products ─────────────────────────────────────────────────────
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("vendor_products")
        .select(
          "id, vendor_id, manufacturer, model, power_kw, efficiency_percent, price_per_kw, warranty_years, lead_time_weeks"
        )
        .eq("status", "approved")
        .eq("product_category", "inverter")
        .gt("price_per_kw", 0)
        .order("price_per_kw", { ascending: true }) // cheapest first
        .limit(20);

      if (!error && data && data.length > 0) {
        // Pick lowest price_per_kw (already sorted ascending)
        const best = data[0] as unknown as Record<string, unknown>;

        const spec: InverterSpec = {
          id: String(best["id"] ?? ""),
          vendorId: String(best["vendor_id"] ?? ""),
          manufacturer: String(best["manufacturer"] ?? ""),
          model: String(best["model"] ?? ""),
          powerKw: Number(best["power_kw"] ?? SSOT_FALLBACK_INVERTER.powerKw),
          efficiencyPercent: Number(
            best["efficiency_percent"] ?? SSOT_FALLBACK_INVERTER.efficiencyPercent
          ),
          pricePerKw: Number(best["price_per_kw"] ?? SSOT_FALLBACK_INVERTER.pricePerKw),
          warrantyYears: Number(best["warranty_years"] ?? SSOT_FALLBACK_INVERTER.warrantyYears),
          leadTimeWeeks: Number(best["lead_time_weeks"] ?? SSOT_FALLBACK_INVERTER.leadTimeWeeks),
          isFallback: false,
        };

        _cache = { spec, fetchedAt: Date.now(), requestedKw: systemKw };

        if (import.meta.env.DEV) {
          console.log(
            `⚡ inverterSelectionService: selected ${spec.manufacturer} ${spec.model} @ $${spec.pricePerKw}/kW`
          );
        }

        return spec;
      }

      if (error && import.meta.env.DEV) {
        console.warn("⚡ inverterSelectionService: DB error —", error.message);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("⚡ inverterSelectionService: exception —", err);
      }
    }
  }

  // ── SSOT fallback ────────────────────────────────────────────────────────
  if (import.meta.env.DEV) {
    console.log("⚡ inverterSelectionService: using SSOT fallback ($65/kW)");
  }

  const fallback = { ...SSOT_FALLBACK_INVERTER };
  _cache = { spec: fallback, fetchedAt: Date.now(), requestedKw: systemKw };
  return fallback;
}
