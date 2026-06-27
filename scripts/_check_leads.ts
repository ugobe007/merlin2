/**
 * Show vendor_leads summary — how many leads each vendor has.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

// Leads by vendor
const { data: leads } = await sb
  .from('vendor_leads')
  .select('vendor_id, lead_category, bess_score, solar_score, generator_score, company_name, created_at')
  .order('created_at', { ascending: false })
  .limit(500);

const byVendor = new Map<string, { count: number; cats: Record<string, number> }>();
for (const l of leads ?? []) {
  const entry = byVendor.get(l.vendor_id) ?? { count: 0, cats: {} };
  entry.count++;
  entry.cats[l.lead_category] = (entry.cats[l.lead_category] ?? 0) + 1;
  byVendor.set(l.vendor_id, entry);
}

// Vendor names
const { data: vendors } = await sb.from('vendors').select('id, company_name, specialty');
const vendorMap = new Map(vendors!.map(v => [v.id, v]));

console.log(`\nVendor leads summary (${leads?.length ?? 0} total):\n`);
for (const [vid, info] of [...byVendor.entries()].sort((a, b) => b[1].count - a[1].count)) {
  const v = vendorMap.get(vid);
  console.log(`  ${v?.company_name ?? vid} [${v?.specialty}] — ${info.count} leads ${JSON.stringify(info.cats)}`);
}

// Recent top leads
console.log('\nTop scoring leads (last 20 by score):');
const top = (leads ?? [])
  .map(l => ({ ...l, score: Math.max(l.bess_score, l.solar_score, l.generator_score) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 15);
for (const l of top) {
  const v = vendorMap.get(l.vendor_id);
  console.log(`  [${l.score}] ${l.company_name} → ${v?.company_name} [${l.lead_category}]`);
}
