/**
 * Lead Pipeline Health Check
 * Usage: node scripts/_check-lead-pipeline.mjs
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log('❌ No Supabase credentials found in .env');
  process.exit(0);
}
const sb = createClient(url, key);

const [opp, vp, ven, art] = await Promise.all([
  sb.from('opportunities').select('industry,signals,confidence_score,status,created_at', { count: 'exact' }).order('confidence_score', { ascending: false }).limit(10),
  sb.from('vendor_products').select('manufacturer,product_category,status', { count: 'exact' }).limit(10),
  sb.from('vendors').select('company_name,specialty,status', { count: 'exact' }).limit(10),
  sb.from('scraped_articles').select('title,equipment_mentioned,relevance_score,published_at', { count: 'exact' }).order('relevance_score', { ascending: false }).limit(10),
]);

console.log('\n=== OPPORTUNITIES TABLE ===');
console.log('Total rows:', opp.count ?? 'N/A', '| Error:', opp.error?.message ?? 'none');
if (opp.data?.length) {
  const byIndustry = {};
  const bySignal = {};
  for (const o of opp.data) {
    byIndustry[o.industry ?? 'unknown'] = (byIndustry[o.industry ?? 'unknown'] ?? 0) + 1;
    for (const s of (o.signals ?? [])) bySignal[s] = (bySignal[s] ?? 0) + 1;
  }
  console.log('Top by industry:', byIndustry);
  console.log('Top signals:', bySignal);
  console.log('Top leads:');
  for (const o of (opp.data ?? []).slice(0, 5)) {
    console.log(`  [${o.confidence_score}] ${o.industry} — ${o.status} — ${o.created_at?.slice(0,10)}`);
  }
}

console.log('\n=== VENDOR PRODUCTS TABLE ===');
console.log('Total rows:', vp.count ?? 'N/A', '| Error:', vp.error?.message ?? 'none');
const byCategory = {};
for (const p of (vp.data ?? [])) byCategory[p.product_category] = (byCategory[p.product_category] ?? 0) + 1;
console.log('By category:', byCategory);

console.log('\n=== VENDORS TABLE ===');
console.log('Total rows:', ven.count ?? 'N/A', '| Error:', ven.error?.message ?? 'none');
for (const v of (ven.data ?? [])) console.log(`  ${v.company_name} [${v.specialty}] — ${v.status}`);

console.log('\n=== SCRAPED ARTICLES TABLE ===');
console.log('Total rows:', art.count ?? 'N/A', '| Error:', art.error?.message ?? 'none');
if (art.data?.length) {
  console.log('Top relevant:');
  for (const a of (art.data ?? []).slice(0, 5)) {
    console.log(`  [${a.relevance_score}] ${a.title?.slice(0, 80)} — equip: ${JSON.stringify(a.equipment_mentioned)}`);
  }
}
