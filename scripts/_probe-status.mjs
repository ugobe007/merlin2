import { config } from 'dotenv';
config({ path: '/Users/robertchristopher/merlin2/.env' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// Check current status distribution
const { data } = await sb.from('opportunities').select('status').limit(200);
const counts = {};
(data || []).forEach(r => counts[r.status] = (counts[r.status] || 0) + 1);
console.log('status counts:', JSON.stringify(counts));

// Test which statuses actually work on a real row
const { data: rows } = await sb.from('opportunities').select('id, company_name').eq('status', 'new').limit(1);
const testId = rows?.[0]?.id;
console.log('test row:', rows?.[0]?.company_name, '| id:', testId);

for (const s of ['dismissed', 'rejected', 'archived', 'ignored']) {
  const { error } = await sb.from('opportunities').update({ status: s }).eq('id', testId);
  if (!error) {
    console.log(`✅ ALLOWED: ${s}`);
    // restore
    await sb.from('opportunities').update({ status: 'new' }).eq('id', testId);
  } else {
    console.log(`❌ BLOCKED: ${s} — ${error.message.slice(0, 80)}`);
  }
}
