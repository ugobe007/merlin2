/**
 * Show unmatched opportunities + their full descriptions and signals
 * so we can see why they score 0.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

// Get already-matched opportunity IDs
const { data: matchedRows } = await sb.from('vendor_leads').select('opportunity_id');
const matchedIds = new Set((matchedRows ?? []).map((r: any) => r.opportunity_id));

const { data: opps } = await sb
  .from('opportunities')
  .select('id, company_name, description, signals, industry, confidence_score, source_url')
  .order('confidence_score', { ascending: false })
  .limit(200);

const unmatched = (opps ?? []).filter(o => !matchedIds.has(o.id));

console.log(`\nUnmatched opportunities: ${unmatched.length}`);
console.log('\n─'.repeat(80));

for (const o of unmatched.slice(0, 25)) {
  console.log(`\n[${o.confidence_score}] ${o.company_name} | ${o.industry ?? 'no-industry'}`);
  console.log(`  Signals: ${JSON.stringify(o.signals)}`);
  console.log(`  Desc:    "${(o.description ?? '').slice(0, 120)}"`);
}
