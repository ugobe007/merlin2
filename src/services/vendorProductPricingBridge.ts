/**
 * Vendor Product Pricing Bridge
 * ==============================
 *
 * Resolves live equipment pricing from approved vendor_products in Supabase.
 * Replaces hardcoded SOLAR_COST_PER_W / BESS_COST_PER_KWH constants in the
 * quote engines with actual vendor-submitted prices.
 *
 * PRIORITY ORDER (matches equipmentPricingTiersService):
 *   1. Approved vendor_products (vendor submitted + admin approved)
 *   2. Market data scraper (collected_market_prices)
 *   3. SSOT hardcoded fallback (DEFAULTS.Solar / DEFAULTS.BESS constants)
 *
 * Used by:
 *   - TrueQuoteEngineV2.ts  (v7 wizard / ProQuote)
 *   - solarCalculator.ts    (underlying calculator)
 *   - bessCalculator.ts     (underlying calculator)
 *   - CompleteTrueQuoteEngine.ts (car wash engine)
 *
 * The selection services cache results for 10–60 minutes so quoting sessions
 * don't hammer the database.
 *
 * Created: April 1, 2026
 */

import { selectOptimalPanel, SSOT_FALLBACK_PANEL } from "./solarPanelSelectionService";
import type { SolarPanelSpec } from "./solarPanelSelectionService";
import { selectOptimalBESS, SSOT_FALLBACK_BESS } from "./bessSelectionService";
import type { BESSSpec } from "./bessSelectionService";
import { getBESSCostPerKWh, getSolarCostPerWatt } from "./data/constants";

// ============================================================================
// TYPES
// ============================================================================

export interface VendorPricing {
  /** $/W all-in equipment cost (panels only, excl. labor/BOS) */
  solarPricePerWatt: number;
  /** $/kWh pack price (equipment only, excl. PCS + installation) */
  bessPricePerKwh: number;
  /** $/kW PCS / inverter cost */
  bessPricePerKw: number;
  /** Full panel spec from DB (null = using SSOT fallback) */
  panelSpec: SolarPanelSpec | null;
  /** Full BESS spec from DB (null = using SSOT fallback) */
  bessSpec: BESSSpec | null;
  /** True when vendor DB pricing is active (vs. hardcoded fallback) */
  isVendorPricing: boolean;
  /** Human-readable pricing source for TrueQuote attestation */
  solarSource: string;
  /** Human-readable pricing source for TrueQuote attestation */
  bessSource: string;
}

// ============================================================================
// MODULE-LEVEL CACHE
// ============================================================================

interface PricingCache {
  pricing: VendorPricing;
  resolvedAt: number;
  systemKw: number;
  systemKwh: number;
  state: string;
}

let _cache: PricingCache | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function bustVendorPricingCache(): void {
  _cache = null;
}

// ============================================================================
// MAIN RESOLVER
// ============================================================================

/**
 * Resolve optimal vendor pricing for a given system size and state.
 *
 * Call this once per quote build and pass the result down to calculators.
 * Results are cached for 10 minutes — safe to call multiple times per session.
 *
 * @param systemKw   - Estimated solar system size (kW DC)
 * @param systemKwh  - Estimated BESS capacity (kWh)
 * @param state      - Two-letter US state code (for tariff/incentive context)
 */
export async function resolveVendorPricing(
  systemKw: number,
  systemKwh: number,
  state: string = "FL"
): Promise<VendorPricing> {
  // Return cached result if parameters are similar and cache is fresh
  if (_cache && Date.now() < _cache.resolvedAt + CACHE_TTL_MS) {
    const kWdrift = Math.abs(_cache.systemKw - systemKw) / Math.max(systemKw, 1);
    const kWhdrift = Math.abs(_cache.systemKwh - systemKwh) / Math.max(systemKwh, 1);
    if (kWdrift < 0.5 && kWhdrift < 0.5 && _cache.state === state) {
      return _cache.pricing;
    }
  }

  // ── Solar panel selection ─────────────────────────────────────────────────
  let panelSpec: SolarPanelSpec | null = null;
  let solarPricePerWatt = getSolarCostPerWatt(systemKw); // SSOT fallback
  let solarSource = "SSOT market reference (Q1 2026)";

  try {
    const panel = await selectOptimalPanel(state);
    if (panel && !panel.isFallback) {
      panelSpec = panel;
      solarPricePerWatt = panel.effectivePricePerWatt;
      solarSource = `Vendor: ${panel.manufacturer} ${panel.model} ($${panel.effectivePricePerWatt.toFixed(2)}/W)`;
    } else if (panel) {
      // isFallback: still use SSOT constant but attach the spec for panel count math
      panelSpec = panel;
      solarSource = `SSOT fallback — ${panel.manufacturer} ${panel.model}`;
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("⚠️ vendorProductPricingBridge: solar panel selection failed", err);
    }
  }

  // ── BESS selection ────────────────────────────────────────────────────────
  let bessSpec: BESSSpec | null = null;
  let bessPricePerKwh = getBESSCostPerKWh(systemKw); // SSOT fallback
  let bessPricePerKw = SSOT_FALLBACK_BESS.pricePerKw;
  let bessSource = "SSOT market reference (Q1 2026)";

  try {
    const bess = await selectOptimalBESS(systemKwh, systemKw * 0.25);
    if (bess && !bess.isFallback) {
      bessSpec = bess;
      bessPricePerKwh = bess.effectivePricePerKwh;
      bessPricePerKw = bess.pricePerKw;
      bessSource = `Vendor: ${bess.manufacturer} ${bess.model} ($${bess.effectivePricePerKwh.toFixed(2)}/kWh)`;
    } else if (bess) {
      bessSpec = bess;
      bessSource = `SSOT fallback — ${bess.manufacturer} ${bess.model}`;
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("⚠️ vendorProductPricingBridge: BESS selection failed", err);
    }
  }

  const isVendorPricing =
    (panelSpec !== null && !panelSpec.isFallback) || (bessSpec !== null && !bessSpec.isFallback);

  const pricing: VendorPricing = {
    solarPricePerWatt,
    bessPricePerKwh,
    bessPricePerKw,
    panelSpec,
    bessSpec,
    isVendorPricing,
    solarSource,
    bessSource,
  };

  _cache = { pricing, resolvedAt: Date.now(), systemKw, systemKwh, state };

  if (import.meta.env.DEV) {
    console.log(
      `💰 vendorProductPricingBridge: solar=$${solarPricePerWatt.toFixed(3)}/W ` +
        `(${panelSpec?.isFallback === false ? "vendor" : "fallback"}), ` +
        `bess=$${bessPricePerKwh.toFixed(0)}/kWh ` +
        `(${bessSpec?.isFallback === false ? "vendor" : "fallback"})`
    );
  }

  return pricing;
}

/**
 * Synchronous version — returns cached pricing or SSOT fallback immediately.
 * Use in non-async contexts (e.g. render-time summaries).
 * Call resolveVendorPricing() first to populate the cache.
 */
export function getVendorPricingSync(systemKw: number = 500): VendorPricing {
  if (_cache && Date.now() < _cache.resolvedAt + CACHE_TTL_MS) {
    return _cache.pricing;
  }
  // Return SSOT fallback immediately — async caller will populate cache shortly
  return {
    solarPricePerWatt: getSolarCostPerWatt(systemKw),
    bessPricePerKwh: getBESSCostPerKWh(systemKw),
    bessPricePerKw: SSOT_FALLBACK_BESS.pricePerKw,
    panelSpec: SSOT_FALLBACK_PANEL,
    bessSpec: SSOT_FALLBACK_BESS,
    isVendorPricing: false,
    solarSource: "SSOT market reference (Q1 2026)",
    bessSource: "SSOT market reference (Q1 2026)",
  };
}
