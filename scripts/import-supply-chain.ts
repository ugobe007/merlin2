/**
 * Supply Chain Import Script
 *
 * Reads "Merlin Energy_Supply Chain List_DRAFT January 2026.xlsx" and:
 *   1. Upserts every vendor into `market_data_sources`
 *      (source_type = "manufacturer", so the scraper monitors their news/press)
 *   2. Upserts benchmark pricing rows into `equipment_pricing`
 *      (one row per vendor with a known $/kWh or $/kW price range)
 *   3. Upserts Market Pricing 2025 benchmarks into `equipment_pricing`
 *      (source = "supply_chain_research", manufacturer = "Market Benchmark")
 *
 * Run:
 *   npx tsx scripts/import-supply-chain.ts
 *
 * Requires:
 *   VITE_SUPABASE_URL  (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY  (write access, bypasses RLS)
 *
 * Created: April 2026
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config();

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "❌  Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// EXCEL FILE
// ============================================================================

const EXCEL_PATH = path.resolve(
  __dirname,
  "../Merlin Energy_Supply Chain List_DRAFT January 2026.xlsx"
);

// ============================================================================
// TYPES
// ============================================================================

interface VendorRow {
  company: string;
  website: string;
  hqRegion: string;
  hqState?: string;
  equipmentType: string; // equipment_pricing.equipment_type (battery|solar|inverter|generator|transformer)
  scrapeCategory: string; // market_data_sources.equipment_categories (bess|solar|inverter|generator|ev-charger)
  skipPricing?: boolean; // skip equipment_pricing insert for this row
  priceMin?: number;
  priceMax?: number;
  priceUnit?: string; // "/kWh", "/kW", "/W", "/unit"
  tariffRisk?: string;
  weightedScore?: number;
  sheetName: string;
}

interface MarketPricingRow {
  category: string;
  productType: string;
  priceMin: number;
  priceMax: number;
  unit: string;
  notes: string;
  equipmentType: string;
}

// ============================================================================
// SHEET → EQUIPMENT TYPE MAPPING
// ============================================================================

const SHEET_TO_EQUIPMENT: Record<
  string,
  {
    equipment: string; // equipment_pricing.equipment_type (battery|inverter|solar|wind|generator|transformer)
    scrapeCategory: string; // market_data_sources.equipment_categories (bess|solar|inverter|generator|ev-charger)
    unit: string; // price unit
    priceColHint: string; // partial column name for price lookup
    skipPricing?: boolean; // true = add to scraper only, skip equipment_pricing
  }
> = {
  "BESS Cells": {
    equipment: "battery",
    scrapeCategory: "bess",
    unit: "/kWh",
    priceColHint: "Pricing",
  },
  "BESS Systems": {
    equipment: "battery",
    scrapeCategory: "bess",
    unit: "/kWh",
    priceColHint: "Installed",
  },
  "Solar Inverters": {
    equipment: "inverter",
    scrapeCategory: "inverter",
    unit: "/W",
    priceColHint: "Pricing",
  },
  "Solar Panels - PV Modules": {
    equipment: "solar",
    scrapeCategory: "solar",
    unit: "/W",
    priceColHint: "Pricing",
  },
  "Solar Racking": {
    equipment: "solar",
    scrapeCategory: "solar",
    unit: "/W",
    priceColHint: "Pricing",
  },
  "Solar Carports": {
    equipment: "solar",
    scrapeCategory: "solar",
    unit: "/W",
    priceColHint: "Pricing",
  },
  "Gas Generators": {
    equipment: "generator",
    scrapeCategory: "generator",
    unit: "/kW",
    priceColHint: "Pricing",
  },
  "Diesel Generators": {
    equipment: "generator",
    scrapeCategory: "generator",
    unit: "/kW",
    priceColHint: "Pricing",
  },
  "EV Chargers L2": {
    equipment: "ev-charger", // stored in notes; equipment_pricing uses scrapeCategory only
    scrapeCategory: "ev-charger",
    unit: "/unit",
    priceColHint: "Pricing",
    skipPricing: true, // 'ev-charger' not in equipment_pricing CHECK constraint
  },
  "EV Chargers DCFC": {
    equipment: "ev-charger",
    scrapeCategory: "ev-charger",
    unit: "/unit",
    priceColHint: "Pricing",
    skipPricing: true,
  },
  "GCC-MENA Suppliers": {
    equipment: "battery",
    scrapeCategory: "bess",
    unit: "",
    priceColHint: "",
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/** Parse a price string like "$150-250" or "$0.08-0.15" into [min, max]. */
function parsePriceRange(
  raw: string
): { min: number; max: number } | null {
  if (!raw || typeof raw !== "string") return null;
  // Strip dollar signs, commas, spaces
  const cleaned = raw.replace(/[$, ]/g, "");
  const parts = cleaned.split("-");
  if (parts.length === 2) {
    const min = parseFloat(parts[0]);
    const max = parseFloat(parts[1]);
    if (!isNaN(min) && !isNaN(max)) return { min, max };
  }
  const single = parseFloat(cleaned);
  if (!isNaN(single)) return { min: single, max: single };
  return null;
}

/** Find the value of the first column header that contains `hint` (case-insensitive) */
function findColValue(
  row: Record<string, string>,
  hint: string
): string | null {
  if (!hint) return null;
  const key = Object.keys(row).find((k) =>
    k.toLowerCase().includes(hint.toLowerCase())
  );
  return key ? String(row[key] || "") : null;
}

// ============================================================================
// STEP 1 — PARSE EXCEL
// ============================================================================

function parseExcel(): {
  vendors: VendorRow[];
  pricing: MarketPricingRow[];
} {
  const wb = XLSX.readFile(EXCEL_PATH);
  const vendors: VendorRow[] = [];
  const pricing: MarketPricingRow[] = [];

  // ---- Equipment sheets ----
  for (const [sheetName, meta] of Object.entries(SHEET_TO_EQUIPMENT)) {
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.warn(`  ⚠  Sheet not found: ${sheetName}`);
      continue;
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
      defval: "",
    });

    for (const row of rows) {
      const company = String(row["Company"] || "").trim();
      const website = String(row["Website"] || "").trim();
      if (!company) continue;

      const hqRegion = String(
        row["HQ Region"] || row["HQ Country/City"] || ""
      ).trim();
      const hqState = String(row["HQ State/Province"] || "").trim();

      // Try to find a price column
      const rawPrice = findColValue(row, meta.priceColHint);
      const parsed = rawPrice ? parsePriceRange(rawPrice) : null;

      const weightedRaw = String(row["Weighted Average"] || "").trim();
      const weightedScore = weightedRaw ? parseFloat(weightedRaw) : undefined;

      vendors.push({
        company,
        website,
        hqRegion,
        hqState: hqState || undefined,
        equipmentType: meta.equipment,
        scrapeCategory: meta.scrapeCategory,
        skipPricing: meta.skipPricing,
        priceMin: parsed?.min,
        priceMax: parsed?.max,
        priceUnit: parsed ? meta.unit : undefined,
        tariffRisk: String(row["Tariff Risk"] || "").trim() || undefined,
        weightedScore: !isNaN(weightedScore as number)
          ? weightedScore
          : undefined,
        sheetName,
      });
    }
  }

  // ---- Market Pricing 2025 sheet ----
  // Only types valid in equipment_pricing CHECK: battery|inverter|solar|wind|generator|transformer
  const EQUIPMENT_MAP: Record<string, string> = {
    "BESS - Cells": "battery",
    "BESS - Systems": "battery",
    "Solar - Modules": "solar",
    "Solar - Systems": "solar",
    "Solar - Inverters": "inverter",
    "Solar - Carports": "solar",
    "Solar - Racking": "solar",
    "Solar - Trackers": "solar",
    "Generators - Gas": "generator",
    "Generators - Diesel": "generator",
    // EV Chargers omitted — 'ev-charger' not in equipment_pricing CHECK constraint
  };

  const pricingWs = wb.Sheets["Market Pricing 2025"];
  if (pricingWs) {
    const rows =
      XLSX.utils.sheet_to_json<Record<string, string>>(pricingWs, {
        defval: "",
      });
    for (const row of rows) {
      const category = String(row["Category"] || "").trim();
      const productType = String(row["Product Type"] || "").trim();
      const unit = String(row["Unit"] || "").trim();
      const notes = String(row["Notes"] || "").trim();
      const rawRange = String(row["Price Range"] || "").trim();
      const parsed = parsePriceRange(rawRange);
      const equipmentType = EQUIPMENT_MAP[category];
      if (!parsed || !equipmentType) continue;

      pricing.push({
        category,
        productType,
        priceMin: parsed.min,
        priceMax: parsed.max,
        unit,
        notes,
        equipmentType,
      });
    }
  }

  return { vendors, pricing };
}

// ============================================================================
// STEP 2 — UPSERT MARKET DATA SOURCES (scraper training)
// ============================================================================

async function upsertMarketDataSources(vendors: VendorRow[]): Promise<void> {
  console.log("\n📡  Upserting market_data_sources (scraper feeds)…");

  // Remove existing manufacturer-type sources so we get a clean slate
  const { error: delErr } = await supabase
    .from("market_data_sources")
    .delete()
    .eq("source_type", "manufacturer");
  if (delErr) {
    console.warn("  ⚠  Could not clear old manufacturer sources:", delErr.message);
  }

  // Deduplicate by website — one source row per unique URL
  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];

  for (const v of vendors) {
    const url = v.website?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);

    rows.push({
      name: v.company,
      url: url,
      feed_url: null,
      source_type: "manufacturer",
      content_type: "news",
      equipment_categories: [v.scrapeCategory],
      is_active: true,
      data_frequency: "daily",
      regions: v.hqRegion ? [v.hqRegion] : null,
      notes: `Supply chain vendor — ${v.sheetName}. HQ: ${v.hqRegion || "N/A"}.${v.tariffRisk ? " Tariff risk: " + v.tariffRisk + "." : ""}`,
      // reliability_score: 1-5 scale (5=primary, 4=official, 3=industry, 2=secondary, 1=unverified)
      // Manufacturer websites = 3 (industry-level), adjust by scorecard
      reliability_score: v.weightedScore
        ? v.weightedScore >= 80 ? 4 : v.weightedScore >= 70 ? 3 : 2
        : 3,
      scrape_config: { keywords: [v.company.toLowerCase()] },
    });
  }

  const BATCH = 50;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("market_data_sources").insert(batch);

    if (error) {
      console.error(`  ✗ Batch ${i / BATCH + 1} error:`, error.message);
      skipped += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  console.log(`  ✓ ${inserted} sources inserted, ${skipped} skipped/errored`);
}

// ============================================================================
// STEP 3 — UPSERT EQUIPMENT PRICING (vendor-level)
// ============================================================================

async function upsertEquipmentPricing(vendors: VendorRow[]): Promise<void> {
  console.log("\n💰  Upserting equipment_pricing (vendor rows)…");

  // Clear old supply-chain-research rows for clean re-import
  const { error: delErr } = await supabase
    .from("equipment_pricing")
    .delete()
    .eq("source", "supply_chain_research");
  if (delErr) {
    console.warn("  ⚠  Could not clear old pricing rows:", delErr.message);
  }

  const today = new Date().toISOString().slice(0, 10);
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const rows: Record<string, unknown>[] = [];

  for (const v of vendors) {
    if (v.skipPricing) continue; // e.g. ev-charger not in equipment_pricing CHECK constraint
    if (v.priceMin === undefined || v.priceMax === undefined) continue;

    const avgPrice = (v.priceMin + v.priceMax) / 2;

    let pricePerKwh: number | null = null;
    let pricePerKw: number | null = null;
    let pricePerWatt: number | null = null;

    if (v.priceUnit === "/kWh") pricePerKwh = avgPrice;
    else if (v.priceUnit === "/kW") pricePerKw = avgPrice;
    else if (v.priceUnit === "/W") pricePerWatt = avgPrice;
    // /unit → stored in notes

    rows.push({
      equipment_type: v.equipmentType,
      manufacturer: v.company,
      model: v.sheetName,
      price_per_kwh: pricePerKwh,
      price_per_kw: pricePerKw,
      price_per_watt: pricePerWatt,
      source: "supply_chain_research",
      confidence_level: "high", // curated human research
      effective_date: today,
      expiration_date: expires,
      is_active: true,
      notes: [
        v.priceUnit === "/unit" ? `$${v.priceMin}–$${v.priceMax}/unit` : null,
        v.tariffRisk ? `Tariff risk: ${v.tariffRisk}` : null,
        v.weightedScore ? `Scorecard: ${v.weightedScore}/100` : null,
      ]
        .filter(Boolean)
        .join(". ") || null,
    });
  }

  const BATCH = 50;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("equipment_pricing").insert(batch);

    if (error) {
      console.error(`  ✗ Batch ${i / BATCH + 1} error:`, error.message);
      skipped += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  console.log(`  ✓ ${inserted} pricing rows inserted, ${skipped} skipped/errored`);
}

// ============================================================================
// STEP 4 — UPSERT MARKET PRICING 2025 BENCHMARKS
// ============================================================================

async function upsertMarketBenchmarks(
  pricing: MarketPricingRow[]
): Promise<void> {
  console.log("\n📊  Upserting Market Pricing 2025 benchmarks…");

  const today = new Date().toISOString().slice(0, 10);
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const rows = pricing.map((p) => {
    const avgPrice = (p.priceMin + p.priceMax) / 2;
    return {
      equipment_type: p.equipmentType,
      manufacturer: "Market Benchmark",
      model: p.productType,
      price_per_kwh: p.unit === "/kWh" ? avgPrice : null,
      price_per_kw: p.unit === "/kW" ? avgPrice : null,
      price_per_watt: p.unit === "/W" ? avgPrice : null,
      source: "supply_chain_research",
      confidence_level: "high",
      effective_date: today,
      expiration_date: expires,
      is_active: true,
      notes: [
        p.unit === "/unit"
          ? `$${p.priceMin}–$${p.priceMax}/unit`
          : `Range: $${p.priceMin}–$${p.priceMax}${p.unit}`,
        p.notes || null,
      ]
        .filter(Boolean)
        .join(". "),
    };
  });

  const { error } = await supabase.from("equipment_pricing").insert(rows);

  if (error) {
    console.error("  ✗ Benchmark insert error:", error.message);
  } else {
    console.log(`  ✓ ${rows.length} benchmark rows inserted`);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("  Merlin Supply Chain Import");
  console.log("  Source:", EXCEL_PATH);
  console.log("=".repeat(60));

  // 1. Parse
  console.log("\n📂  Parsing Excel…");
  const { vendors, pricing } = parseExcel();
  console.log(`  Found ${vendors.length} vendor rows across equipment sheets`);
  console.log(`  Found ${pricing.length} Market Pricing 2025 benchmark rows`);

  // 2. Upsert sources (scraper training)
  await upsertMarketDataSources(vendors);

  // 3. Upsert vendor pricing
  await upsertEquipmentPricing(vendors);

  // 4. Upsert market benchmarks
  await upsertMarketBenchmarks(pricing);

  console.log("\n✅  Done. Run npx tsx scripts/run-daily-scrape.ts to kick off scraping for new vendors.");
}

main().catch((err) => {
  console.error("❌  Fatal error:", err);
  process.exit(1);
});
