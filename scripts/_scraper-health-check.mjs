#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Recent articles
const { data: articles, error: artErr } = await sb.from('scraped_articles')
  .select('id, title, source_id, published_at, equipment_mentioned, topics, relevance_score')
  .order('published_at', { ascending: false })
  .limit(20);

if (artErr) {
  console.error('articles error:', artErr.message);
} else {
  console.log(`\n=== RECENT ARTICLES (${articles.length}) ===`);
  articles.forEach(a => {
    const date = (a.published_at || '').slice(0, 10);
    const equip = Array.isArray(a.equipment_mentioned) ? a.equipment_mentioned.join(',') : (a.equipment_mentioned || '');
    const topics = Array.isArray(a.topics) ? a.topics.slice(0,3).join(',') : (a.topics || '');
    console.log(`[${date}] src:${a.source_id} | ${(a.title||'').slice(0,75)} | [${equip}] [${topics}] rel:${a.relevance_score ?? '-'}`);
  });
}

// Count by source_id
const { data: counts } = await sb.from('scraped_articles').select('source_id').limit(2000);
if (counts) {
  const bySource = {};
  counts.forEach(r => { bySource[r.source_id] = (bySource[r.source_id] || 0) + 1; });
  console.log('\n=== ARTICLE COUNT BY SOURCE_ID (top 20) ===');
  Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([s, n]) => console.log(`  ${n}\t${s}`));
  console.log(`  TOTAL: ${counts.length}`);
}

// Price data — columns: equipment_type, price_per_unit, unit, currency, region, extracted_at
const { data: prices, error: prErr } = await sb.from('collected_market_prices')
  .select('equipment_type, price_per_unit, unit, currency, region, extracted_at, product_name')
  .order('extracted_at', { ascending: false })
  .limit(15);
if (prErr) {
  console.error('prices error:', prErr.message);
} else {
  console.log(`\n=== RECENT PRICE CAPTURES (${prices.length}) ===`);
  prices.forEach(p => {
    const date = (p.extracted_at || '').slice(0, 10);
    console.log(`[${date}] ${p.equipment_type} | $${p.price_per_unit} ${p.unit} ${p.currency} | ${p.region} | ${p.product_name ?? ''}`);
  });
}

// Failed sources
const { data: sources } = await sb.from('market_data_sources')
  .select('name, url, last_fetch_status, last_fetched_at, consecutive_failures')
  .eq('is_active', true)
  .order('consecutive_failures', { ascending: false })
  .limit(20);
if (sources) {
  const failed = sources.filter(s => s.last_fetch_status === 'failed' || s.consecutive_failures > 0);
  console.log(`\n=== FAILING SOURCES (${failed.length}/${sources.length} active) ===`);
  failed.forEach(s => console.log(`  [failures:${s.consecutive_failures || 0}] ${s.name} | ${s.last_fetch_status} | last: ${(s.last_fetched_at||'').slice(0,10)}`));
}
