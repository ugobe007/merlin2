/**
 * Vendor Product Scrape Runner
 * ================================
 * Scrapes manufacturer product pages and seeds vendor_products in Supabase.
 *
 * Usage:
 *   npx tsx scripts/scrape-vendor-products.ts
 *
 * What it does:
 *   1. Ensures a "Merlin Data" system vendor row exists in vendors
 *   2. Scrapes each VENDOR_TARGET (with seed fallback)
 *   3. Upserts results to vendor_products (keyed on manufacturer + model)
 *   4. Prints a summary report
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { VENDOR_TARGETS, scrapeVendorTarget, VendorProductSpec } from '../src/services/vendorProductScraper.js';

// ────────────────────────────────────────────────────────────
// Supabase client
// ────────────────────────────────────────────────────────────
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
// Use service-role key for server-side scripts (bypasses RLS)
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌  Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ────────────────────────────────────────────────────────────
// Ensure system vendor exists
// ────────────────────────────────────────────────────────────
async function ensureSystemVendor(): Promise<string> {
  const SYSTEM_EMAIL = 'data@merlin.internal';

  // Try to find existing system vendor
  const { data: existing } = await supabase
    .from('vendors')
    .select('id')
    .eq('email', SYSTEM_EMAIL)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // Try to insert with every valid specialty value
  for (const specialty of ['integrator', 'battery', 'epc', 'ems', 'bos', 'inverter']) {
    const { data: inserted, error } = await supabase
      .from('vendors')
      .insert({
        company_name: 'Merlin Data',
        contact_name: 'System',
        email: SYSTEM_EMAIL,
        password_hash: '$2b$10$placeholder_hash_for_system_vendor_only',
        specialty,
        website: 'https://merlin2.fly.dev',
        status: 'approved',
      })
      .select('id')
      .single();

    if (!error && inserted?.id) return inserted.id;
    if (error && !error.message.includes('valid_specialty')) {
      throw new Error(`Could not create system vendor: ${error.message}`);
    }
  }

  // Last resort: find any existing vendor to attach products to
  const { data: anyVendor } = await supabase
    .from('vendors')
    .select('id')
    .limit(1)
    .single();

  if (anyVendor?.id) {
    console.log(`  ⚠  Using existing vendor ${anyVendor.id} (could not create system vendor)`);
    return anyVendor.id;
  }

  throw new Error('No vendors found and cannot create system vendor — check DB constraints');
}

// ────────────────────────────────────────────────────────────
// Map VendorProductSpec → vendor_products DB row
// ────────────────────────────────────────────────────────────

/** Map our internal category labels to valid DB CHECK constraint values.
 *  DB allows: 'battery' | 'inverter' | 'ems' | 'bos' | 'container' | 'solar'
 */
function mapCategory(cat: VendorProductSpec['productCategory']): string {
  switch (cat) {
    case 'bess':       return 'battery';
    case 'solar':      return 'solar';
    case 'inverter':   return 'inverter';
    case 'ev-charger': return 'container';  // closest match available
    case 'generator':  return 'bos';        // balance-of-system
    case 'transformer':return 'bos';
    default:           return 'battery';
  }
}

function toDBRow(spec: VendorProductSpec, vendorId: string) {
  return {
    vendor_id: vendorId,
    manufacturer: spec.manufacturer,
    model: spec.model,
    product_category: mapCategory(spec.productCategory),
    capacity_kwh: spec.capacityKwh ?? null,
    power_kw: spec.powerKw ?? null,
    chemistry: spec.chemistry ?? null,
    efficiency_percent: spec.efficiencyPercent ?? null,
    voltage_v: spec.voltageV ?? null,
    warranty_years: spec.warrantyYears,
    lead_time_weeks: spec.leadTimeWeeks,
    price_per_kwh: spec.pricePerKwh ?? null,
    price_per_kw: spec.pricePerKw ?? null,
    certifications: spec.certifications ?? null,
    datasheet_url: spec.datasheetUrl ?? null,
    status: 'approved',  // valid DB value; confidence tracked in source logs
  };
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   Merlin Vendor Product Scraper        ║`);
  console.log(`╚════════════════════════════════════════╝`);
  console.log(`  Targets: ${VENDOR_TARGETS.length}`);
  console.log(`  Started: ${new Date().toISOString()}\n`);

  // 1. Get / create system vendor
  let vendorId: string;
  try {
    vendorId = await ensureSystemVendor();
    console.log(`  ✓ System vendor id: ${vendorId}\n`);
  } catch (err) {
    console.error(`  ✗ ${(err as Error).message}`);
    process.exit(1);
  }

  // 2. Scrape all targets (concurrency = 4)
  const CONCURRENCY = 4;
  const results: VendorProductSpec[] = [];
  const errors: { model: string; error: string }[] = [];

  async function worker(targets: typeof VENDOR_TARGETS) {
    for (const target of targets) {
      try {
        const spec = await scrapeVendorTarget(target);
        results.push(spec);
        const badge = spec.confidence === 'scraped' ? '🌐' : '📦';
        const detail = spec.productCategory === 'bess'
          ? `${spec.capacityKwh ?? '?'}kWh / ${spec.powerKw ?? '?'}kW`
          : `${spec.powerKw ?? '?'}kW`;
        console.log(`  ${badge} ${spec.manufacturer} ${spec.model} — ${detail} (${spec.confidence})`);
      } catch (err) {
        errors.push({ model: target.model, error: (err as Error).message });
        console.log(`  ✗ ${target.manufacturer} ${target.model} — ${(err as Error).message}`);
      }
    }
  }

  // Split targets into buckets for concurrency
  const bucketSize = Math.ceil(VENDOR_TARGETS.length / CONCURRENCY);
  const buckets: (typeof VENDOR_TARGETS)[] = [];
  for (let i = 0; i < VENDOR_TARGETS.length; i += bucketSize) {
    buckets.push(VENDOR_TARGETS.slice(i, i + bucketSize));
  }
  await Promise.all(buckets.map(worker));

  console.log(`\n  ─── Scraped ${results.length} products ──────────────────`);

  // 3. Upsert to vendor_products
  const rows = results.map(s => toDBRow(s, vendorId));

  let upserted = 0;
  let failedUpserts = 0;

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from('vendor_products')
      .upsert(batch, {
        onConflict: 'manufacturer,model',
        ignoreDuplicates: false,
      });

    if (error) {
      // vendor_products may not have a composite unique on manufacturer,model
      // Fall back to insert-or-update individually
      for (const row of batch) {
        const { error: e2 } = await supabase
          .from('vendor_products')
          .upsert(row, { ignoreDuplicates: false });

        if (e2) {
          console.log(`    ✗ upsert failed for ${row.manufacturer} ${row.model}: ${e2.message}`);
          failedUpserts++;
        } else {
          upserted++;
        }
      }
    } else {
      upserted += batch.length;
    }
  }

  // ────────────────────────────────────────────────────────
  // 4. Summary
  // ────────────────────────────────────────────────────────
  const liveScraped = results.filter(r => r.confidence === 'scraped').length;
  const seeded = results.filter(r => r.confidence === 'seeded').length;

  const byCategory: Record<string, number> = {};
  for (const r of results) {
    byCategory[r.productCategory] = (byCategory[r.productCategory] ?? 0) + 1;
  }

  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║              SUMMARY                   ║`);
  console.log(`╚════════════════════════════════════════╝`);
  console.log(`  Products scraped : ${results.length}`);
  console.log(`  Live scraped     : ${liveScraped}  🌐`);
  console.log(`  Seeded (fallback): ${seeded}  📦`);
  console.log(`  Scrape errors    : ${errors.length}`);
  console.log(`  DB upserts OK    : ${upserted}`);
  console.log(`  DB upserts FAIL  : ${failedUpserts}`);
  console.log(`\n  By category:`);
  for (const [cat, n] of Object.entries(byCategory)) {
    console.log(`    ${cat.padEnd(14)} ${n}`);
  }
  console.log(`\n  Finished: ${new Date().toISOString()}\n`);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
