import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/robertchristopher/merlin3/.env', 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const sb = createClient('https://fvmpmozybmtzjvikrctq.supabase.co', env['VITE_SUPABASE_ANON_KEY']);

const { data } = await sb.from('scraped_articles')
  .select('title, content')
  .not('content', 'is', null)
  .order('created_at', { ascending: false })
  .limit(50);

const richArticles = data.filter(a => (a.content?.length ?? 0) > 100);
console.log(`Rich articles (content > 100 chars): ${richArticles.length}/${data.length}`);

for (const a of richArticles.slice(0, 5)) {
  const priceMatches = a.content.match(/\$[\d,]+\s*(?:\/|per)\s*k?[Ww]h|[\d,]+\s*(?:kWh|MWh|\/W)/gi) ?? [];
  console.log(`\n  "${a.title?.slice(0,60)}" (${a.content.length} chars)`);
  console.log(`   price matches: [${priceMatches.slice(0,5).join(' | ')}]`);
}
