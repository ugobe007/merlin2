import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Fix the 2 EIA sources with feed_url but wrong source_type — they'll never get scraped
  const { data: fixed, error } = await sb
    .from('market_data_sources')
    .update({ source_type: 'rss_feed' })
    .eq('is_active', true)
    .is('last_fetch_at', null)
    .not('feed_url', 'is', null)
    .select('id, name, source_type, feed_url');

  if (error) { console.error('Fix error:', error.message); return; }
  console.log(`✅ Fixed source_type for ${fixed?.length} sources:`);
  (fixed || []).forEach(s => console.log(`  ${s.name} => type now: ${s.source_type}`));
}

main().catch(console.error);
