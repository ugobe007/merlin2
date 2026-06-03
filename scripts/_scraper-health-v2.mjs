import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('======================================');
  console.log(' MERLIN SCRAPER HEALTH CHECK');
  console.log(' ' + new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC');
  console.log('======================================\n');

  // Total article count
  const { count: totalArts } = await sb.from('scraped_articles').select('*', { count: 'exact', head: true });
  console.log(`📚 Total articles in DB: ${totalArts}`);

  // Articles in last 7 days
  const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: arts7d } = await sb.from('scraped_articles').select('*', { count: 'exact', head: true }).gte('scraped_at', since7d);
  const since1d = new Date(Date.now() - 86400000).toISOString();
  const { count: arts1d } = await sb.from('scraped_articles').select('*', { count: 'exact', head: true }).gte('scraped_at', since1d);
  console.log(`📰 New articles (last 24h): ${arts1d}`);
  console.log(`📰 New articles (last 7d): ${arts7d}`);

  // Recent articles with topics & equipment
  const { data: recents } = await sb.from('scraped_articles')
    .select('title, source_id, published_at, scraped_at, topics, equipment_mentioned, relevance_score')
    .order('scraped_at', { ascending: false })
    .limit(12);

  // Get source name lookup
  const { data: srcList } = await sb.from('market_data_sources').select('id, name, last_fetch_status, last_fetch_at, fetch_error_count, is_active');
  const srcMap = {};
  if (srcList) srcList.forEach(s => { srcMap[s.id] = s; });

  console.log('\n=== MOST RECENT ARTICLES ===');
  (recents || []).forEach(a => {
    const src = srcMap[a.source_id]?.name || a.source_id?.slice(0, 8);
    const date = (a.published_at || a.scraped_at || '').slice(0, 10);
    const equip = Array.isArray(a.equipment_mentioned) ? a.equipment_mentioned.slice(0,3).join(',') : '';
    const topics = Array.isArray(a.topics) ? a.topics.slice(0,2).join(',') : '';
    const score = a.relevance_score != null ? `r:${a.relevance_score}` : '';
    console.log(`  [${date}] ${src} | ${(a.title||'').slice(0,70)}`);
    console.log(`           equip:[${equip}] topics:[${topics}] ${score}`);
  });

  // Source health
  console.log('\n=== SOURCE STATUS ===');
  const activeSrcs = (srcList || []).filter(s => s.is_active);
  const failedSrcs = activeSrcs.filter(s => s.last_fetch_status === 'failed' || s.fetch_error_count > 0);
  const okSrcs = activeSrcs.filter(s => s.last_fetch_status === 'success');
  const neverSrcs = activeSrcs.filter(s => !s.last_fetch_status);
  console.log(`  Active sources: ${activeSrcs.length}`);
  console.log(`  ✅ Successful: ${okSrcs.length}`);
  console.log(`  ❌ Failed:     ${failedSrcs.length}`);
  console.log(`  ⚪ Never run:  ${neverSrcs.length}`);

  if (failedSrcs.length) {
    console.log('\n  Failing sources:');
    failedSrcs.sort((a, b) => (b.fetch_error_count || 0) - (a.fetch_error_count || 0)).forEach(s => {
      console.log(`    [errors:${s.fetch_error_count || 0}] ${s.name} | last: ${(s.last_fetch_at||'never').slice(0,10)}`);
    });
  }

  // Price intelligence
  const { count: priceCount } = await sb.from('collected_market_prices').select('*', { count: 'exact', head: true });
  const { data: recentPrices } = await sb.from('collected_market_prices')
    .select('equipment_type, price_per_unit, unit, currency, technology, product_name, confidence_score, price_date, extraction_method')
    .order('extracted_at', { ascending: false })
    .limit(15);
  
  console.log(`\n=== PRICE INTELLIGENCE ===`);
  console.log(`  Total price records: ${priceCount}`);
  if (recentPrices && recentPrices.length) {
    const since30d = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const fresh = recentPrices.filter(p => p.price_date >= since30d);
    console.log(`  Fresh prices (last 30d): ${fresh.length}`);
    console.log('\n  Recent price captures:');
    recentPrices.slice(0, 10).forEach(p => {
      const conf = p.confidence_score ? `conf:${(p.confidence_score * 100).toFixed(0)}%` : '';
      console.log(`    ${p.equipment_type} | $${p.price_per_unit}/${p.unit} ${p.currency || 'USD'} | ${p.product_name || p.technology || ''} | ${p.price_date} ${conf}`);
    });

    // By equipment type
    const byEquip = {};
    recentPrices.forEach(p => { byEquip[p.equipment_type] = (byEquip[p.equipment_type] || 0) + 1; });
    console.log('\n  Recent price breakdown by equipment:');
    Object.entries(byEquip).sort((a, b) => b[1] - a[1]).forEach(([e, n]) => console.log(`    ${n}\t${e}`));
  }

  // Topics coverage
  const { data: topicSample } = await sb.from('scraped_articles')
    .select('topics, equipment_mentioned')
    .gte('scraped_at', since7d)
    .limit(200);
  
  if (topicSample && topicSample.length) {
    const topicCount = {};
    const equipCount = {};
    topicSample.forEach(a => {
      (a.topics || []).forEach(t => { topicCount[t] = (topicCount[t] || 0) + 1; });
      (a.equipment_mentioned || []).forEach(e => { equipCount[e] = (equipCount[e] || 0) + 1; });
    });
    console.log('\n=== TOPIC COVERAGE (last 7d) ===');
    Object.entries(topicCount).sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([t,n]) => console.log(`  ${n}\t${t}`));
    console.log('\n=== EQUIPMENT MENTIONS (last 7d) ===');
    Object.entries(equipCount).sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([e,n]) => console.log(`  ${n}\t${e}`));
  }

  console.log('\n======================================');
  console.log(' HEALTH CHECK COMPLETE');
  console.log('======================================');
}

main().catch(console.error);
