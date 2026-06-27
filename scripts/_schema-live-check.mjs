import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: opps, error: oppsErr } = await sb.from('opportunities').select('*').limit(1);
if (oppsErr) { console.error('opportunities error:', oppsErr.message); }
else console.log('opportunities columns:', Object.keys(opps?.[0] ?? {}));

const { data: vl, error: vlErr } = await sb.from('vendor_leads').select('*').limit(1);
if (vlErr) { console.error('vendor_leads error:', vlErr.message); }
else console.log('vendor_leads columns:', Object.keys(vl?.[0] ?? {}));

const { data: vle, error: vleErr } = await sb.from('vendor_lead_events').select('*').limit(1);
if (vleErr) { console.error('vendor_lead_events error:', vleErr.message); }
else console.log('vendor_lead_events columns:', Object.keys(vle?.[0] ?? {}));

// Check for duplicate vendor_leads
const { data: dups } = await sb.from('vendor_leads')
  .select('opportunity_id, vendor_id')
  .order('opportunity_id');
const seen = new Map();
let dupCount = 0;
for (const r of dups ?? []) {
  const k = `${r.opportunity_id}::${r.vendor_id}`;
  seen.set(k, (seen.get(k) ?? 0) + 1);
  if (seen.get(k) > 1) dupCount++;
}
console.log(`vendor_leads total rows: ${dups?.length}, duplicate (opp+vendor) pairs: ${dupCount}`);
