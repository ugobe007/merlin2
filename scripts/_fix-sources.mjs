import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Why are 243 sources never fetched? Check source_type and feed_url
  const { data: never } = await sb
    .from('market_data_sources')
    .select('id, name, source_type, feed_url, is_active, last_fetch_at, last_fetch_status, equipment_categories')
    .eq('is_active', true)
    .is('last_fetch_at', null)
    .order('source_type');

  console.log(`\n=== NEVER-FETCHED ACTIVE SOURCES (${never?.length}) ===`);
  const byType = {};
  const noFeed = [];
  const hasFeed = [];
  (never || []).forEach(s => {
    byType[s.source_type] = (byType[s.source_type] || 0) + 1;
    if (!s.feed_url) noFeed.push(s);
    else hasFeed.push(s);
  });
  console.log('By source_type:');
  Object.entries(byType).sort((a,b) => b[1]-a[1]).forEach(([t,n]) => console.log(`  ${n}\t${t}`));
  console.log(`\nHas feed_url: ${hasFeed.length}`);
  console.log(`No feed_url:  ${noFeed.length}`);

  if (hasFeed.length) {
    console.log('\nSources with feed_url but never fetched (first 15):');
    hasFeed.slice(0, 15).forEach(s => console.log(`  [${s.source_type}] ${s.name} => ${(s.feed_url||'').slice(0,60)}`));
  }
  if (noFeed.length) {
    console.log('\nSources WITHOUT feed_url (first 10):');
    noFeed.slice(0, 10).forEach(s => console.log(`  [${s.source_type}] ${s.name}`));
  }

  // Now deactivate broken sources using service role key
  console.log('\n=== DEACTIVATING BROKEN SOURCES ===');
  const { data: broken } = await sb
    .from('market_data_sources')
    .select('id, name, fetch_error_count')
    .eq('is_active', true)
    .gte('fetch_error_count', 5);

  if (broken?.length) {
    const ids = broken.map(s => s.id);
    const { error: updErr } = await sb
      .from('market_data_sources')
      .update({ is_active: false, notes: 'Auto-deactivated by health script 2026-05-29: 5+ consecutive fetch failures.' })
      .in('id', ids);
    if (updErr) console.error('Deactivate error:', updErr.message);
    else console.log(`✅ Deactivated ${broken.length} broken sources:`, broken.map(s => s.name).join(', '));
  } else {
    console.log('No sources meet threshold.');
  }
}

main().catch(console.error);
