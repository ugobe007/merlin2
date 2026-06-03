import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  // Deactivate sources with 5+ consecutive errors (threshold from run-daily-scrape.ts)
  const { data: toDeactivate, error: fetchErr } = await sb
    .from('market_data_sources')
    .select('id, name, fetch_error_count, last_fetch_status')
    .eq('is_active', true)
    .gte('fetch_error_count', 5);

  if (fetchErr) { console.error('Fetch error:', fetchErr.message); return; }
  console.log(`Found ${toDeactivate.length} sources to deactivate:`);
  toDeactivate.forEach(s => console.log(`  [${s.fetch_error_count} errors] ${s.name}`));

  if (!toDeactivate.length) { console.log('Nothing to deactivate.'); return; }

  const ids = toDeactivate.map(s => s.id);
  const { error: updateErr, count } = await sb
    .from('market_data_sources')
    .update({ is_active: false, notes: 'Auto-deactivated: exceeded consecutive failure threshold (5+). Deactivated by health check script.' })
    .in('id', ids);

  if (updateErr) { console.error('Update error:', updateErr.message); return; }
  console.log(`\n✅ Deactivated ${toDeactivate.length} broken sources.`);

  // Confirm
  const { data: check } = await sb
    .from('market_data_sources')
    .select('id, name, is_active, fetch_error_count')
    .in('id', ids);
  check.forEach(s => console.log(`  ${s.is_active ? '🟢 STILL ACTIVE' : '🔴 deactivated'} | [${s.fetch_error_count} errors] ${s.name}`));
}

main().catch(console.error);
