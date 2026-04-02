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
import { selectOptimalInverter, SSOT_FALLBACK_INVERTER } from "./inverterSelectionService";
import type { InverterSpec } from "./inverterSelectionService";
import { getBESSCostPerKWh, getSolarCostPerWatt } from "./data/constants";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export interface VendorPricing {
  /** $/W all-in equipment cost (panels only, excl. labor/BOS) */
  solarPricePerWatt: number;
  /** $/kWh pack price (equipment only, excl. PCS + installation) */
  bessPricePerKwh: number;
  /** $/kW PCS / inverter cost — from BESS vendor or dedicated inverter vendor */
  bessPricePerKw: number;
  /** $/kW for dedicated solar inverter / string inverter from inverter vendor */
  inverterPricePerKw: number;
  /** Full panel spec from DB (null = using SSOT fallback) */
  panelSpec: SolarPanelSpec | null;
  /** Full BESS spec from DB (null = using SSOT fallback) */
  bessSpec: BESSSpec | null;
  /** Full inverter spec from DB (null = using SSOT fallback) */
  inverterSpec: InverterSpec | null;
  /** True when vendor DB pricing is active (vs. hardcoded fallback) */
  isVendorPricing: boolean;
  /** Human-readable pricing source for TrueQuote attestation */
  solarSource: string;
  /** Human-readable pricing source for TrueQuote attestation */
  bessSource: string;
  /** Human-readable pricing source for TrueQuote attestation */
  inverterSource: string;
  /** Vendor $/kW for diesel generators (undefined = use SSOT $800/kW constant) */
  generatorPricePerKwDiesel?: number;
  /** Vendor $/kW for natural gas generators (undefined = use SSOT $650/kW constant) */
  generatorPricePerKwNatGas?: number;
  /** Vendor cost per L2 charger unit in $ (undefined = use SSOT $6,000 constant) */
  evL2CostPerUnit?: number;
  /** Vendor cost per DCFC charger unit in $ (undefined = use SSOT $75,000 constant) */
  evDCFCCostPerUnit?: number;
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

  // ── Run all three selections in parallel ─────────────────────────────────
  let panelSpec: SolarPanelSpec | null = null;
  let solarPricePerWatt = getSolarCostPerWatt(systemKw);
  let solarSource = "SSOT market reference (Q1 2026)";

  let bessSpec: BESSSpec | null = null;
  let bessPricePerKwh = getBESSCostPerKWh(systemKw);
  let bessPricePerKw = SSOT_FALLBACK_BESS.pricePerKw;
  let bessSource = "SSOT market reference (Q1 2026)";

  let inverterSpec: InverterSpec | null = null;
  let inverterPricePerKw = SSOT_FALLBACK_INVERTER.pricePerKw;
  let inverterSource = "SSOT market reference (NREL Q1 2025)";

  // ── Generator and EV vendor pricing variables ──────────────────────────────
  let generatorPricePerKwDiesel: number | undefined;
  let generatorPricePerKwNatGas: number | undefined;
  let evL2CostPerUnit: number | undefined;
  let evDCFCCostPerUnit: number | undefined;

  const [panelResult, bessResult, inverterResult] = await Promise.allSettled([
    selectOptimalPanel(state),
    selectOptimalBESS(systemKwh, systemKw * 0.25),
    selectOptimalInverter(systemKw),
  ]);

  // Solar
  if (panelResult.status === "fulfilled") {
    const panel = panelResult.value;
    if (panel && !panel.isFallback) {
      panelSpec = panel;
      solarPricePerWatt = panel.effectivePricePerWatt;
      solarSource = `Vendor: ${panel.manufacturer} ${panel.model} ($${panel.effectivePricePerWatt.toFixed(2)}/W)`;
    } else if (panel) {
      panelSpec = panel;
      solarSource = `SSOT fallback — ${panel.manufacturer} ${panel.model}`;
    }
  } else if (import.meta.env.DEV) {
    console.warn("⚠️ vendorProductPricingBridge: solar selection failed", panelResult.reason);
  }

  // BESS
  if (bessResult.status === "fulfilled") {
    const bess = bessResult.value;
    if (bess && !bess.isFallback) {
      bessSpec = bess;
      bessPricePerKwh = bess.effectivePricePerKwh;
      bessPricePerKw = bess.pricePerKw;
      bessSource = `Vendor: ${bess.manufacturer} ${bess.model} ($${bess.effectivePricePerKwh.toFixed(2)}/kWh)`;
    } else if (bess) {
      bessSpec = bess;
      bessSource = `SSOT fallback — ${bess.manufacturer} ${bess.model}`;
    }
  } else if (import.meta.env.DEV) {
    console.warn("⚠️ vendorProductPricingBridge: BESS selection failed", bessResult.reason);
  }

  // Inverter
  if (inverterResult.status === "fulfilled") {
    const inv = inverterResult.value;
    if (inv && !inv.isFallback) {
      inverterSpec = inv;
      inverterPricePerKw = inv.pricePerKw;
      inverterSource = `Vendor: ${inv.manufacturer} ${inv.model} ($${inv.pricePerKw}/kW)`;
    } else if (inv) {
      inverterSpec = inv;
      inverterSource = `SSOT fallback — ${inv.manufacturer} ${inv.model}`;
    }
  } else if (import.meta.env.DEV) {
    console.warn("⚠️ vendorProductPricingBridge: inverter selection failed", inverterResult.reason);
  }

  // ── Generator + EV charger vendor pricing (direct DB queries) ─────────────
  if (isSupabaseConfigured()) {
    try {
      const [genRows, evRows] = await Promise.all([
        supabase
          .from("vendor_products")
          .select("chemistry, price_per_kw, manufacturer, model")
          .eq("status", "approved")
          .eq("product_category", "generator")
          .in("chemistry", ["diesel", "natural_gas"])
          .gt("price_per_kw", 0)
          .order("price_per_kw", { ascending: true })
          .limit(10),
        supabase
          .from("vendor_products")
          .select("chemistry, price_per_kw, power_kw, manufacturer, model")
          .eq("status", "approved")
          .eq("product_category", "ev_charger")
          .in("chemistry", ["l2", "dcfc"])
          .gt("price_per_kw", 0)
          .order("price_per_kw", { ascending: true })
          .limit(10),
      ]);

      // Generator: pick cheapest per fuel type
      if (!genRows.error && genRows.data) {
        const genData = genRows.data as Array<{
          chemistry: string;
          price_per_kw: number;
          manufacturer: string;
          model: string;
        }>;
        const dieselRow = genData.find((r) => r.chemistry === "diesel");
        const natgasRow = genData.find((r) => r.chemistry === "natural_gas");
        if (dieselRow) {
          generatorPricePerKwDiesel = dieselRow.price_per_kw;
          if (import.meta.env.DEV) {
            console.log(
              `⚙️ generator diesel vendor: ${dieselRow.manufacturer} @ $${dieselRow.price_per_kw}/kW`
            );
          }
        }
        if (natgasRow) {
          generatorPricePerKwNatGas = natgasRow.price_per_kw;
          if (import.meta.env.DEV) {
            console.log(
              `⚙️ generator natgas vendor: ${natgasRow.manufacturer} @ $${natgasRow.price_per_kw}/kW`
            );
          }
        }
      }

      // EV: convert $/kW → $/unit using power_kw; pick lowest $/unit per type
      if (!evRows.error && evRows.data) {
        const evData = evRows.data as Array<{
          chemistry: string;
          price_per_kw: number;
          power_kw: number;
          manufacturer: string;
          model: string;
        }>;
        // L2: find lowest $/unit = price_per_kw × power_kw
        const l2Rows = evData
          .filter((r) => r.chemistry === "l2" && r.power_kw > 0)
          .map((r) => ({ ...r, unitCost: r.price_per_kw * r.power_kw }))
          .sort((a, b) => a.unitCost - b.unitCost);
        const dcfcRows = evData
          .filter((r) => r.chemistry === "dcfc" && r.power_kw > 0)
          .map((r) => ({ ...r, unitCost: r.price_per_kw * r.power_kw }))
          .sort((a, b) => a.unitCost - b.unitCost);
        if (l2Rows[0]) {
          evL2CostPerUnit = Math.round(l2Rows[0].unitCost);
          if (import.meta.env.DEV) {
            console.log(`🔌 EV L2 vendor: ${l2Rows[0].manufacturer} @ $${evL2CostPerUnit}/unit`);
          }
        }
        if (dcfcRows[0]) {
          evDCFCCostPerUnit = Math.round(dcfcRows[0].unitCost);
          if (import.meta.env.DEV) {
            console.log(
              `🔌 EV DCFC vendor: ${dcfcRows[0].manufacturer} @ $${evDCFCCostPerUnit}/unit`
            );
          }
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("⚠️ vendorProductPricingBridge: generator/EV pricing failed", err);
      }
    }
  }

  const isVendorPricing =
    (panelSpec !== null && !panelSpec.isFallback) ||
    (bessSpec !== null && !bessSpec.isFallback) ||
    (inverterSpec !== null && !inverterSpec.isFallback) ||
    generatorPricePerKwDiesel !== undefined ||
    evL2CostPerUnit !== undefined;

  const pricing: VendorPricing = {
    solarPricePerWatt,
    bessPricePerKwh,
    bessPricePerKw,
    inverterPricePerKw,
    panelSpec,
    bessSpec,
    inverterSpec,
    isVendorPricing,
    solarSource,
    bessSource,
    inverterSource,
    generatorPricePerKwDiesel,
    generatorPricePerKwNatGas,
    evL2CostPerUnit,
    evDCFCCostPerUnit,
  };

  _cache = { pricing, resolvedAt: Date.now(), systemKw, systemKwh, state };

  if (import.meta.env.DEV) {
    console.log(
      `💰 vendorProductPricingBridge: solar=$${solarPricePerWatt.toFixed(3)}/W ` +
        `(${panelSpec?.isFallback === false ? "vendor" : "fallback"}), ` +
        `bess=$${bessPricePerKwh.toFixed(0)}/kWh ` +
        `(${bessSpec?.isFallback === false ? "vendor" : "fallback"}), ` +
        `inverter=$${inverterPricePerKw}/kW ` +
        `(${inverterSpec?.isFallback === false ? "vendor" : "fallback"})`
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
    inverterPricePerKw: SSOT_FALLBACK_INVERTER.pricePerKw,
    panelSpec: SSOT_FALLBACK_PANEL,
    bessSpec: SSOT_FALLBACK_BESS,
    inverterSpec: SSOT_FALLBACK_INVERTER,
    isVendorPricing: false,
    solarSource: "SSOT market reference (Q1 2026)",
    bessSource: "SSOT market reference (Q1 2026)",
    inverterSource: "SSOT market reference (NREL Q1 2025)",
  };
}
