import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/robertchristopher/merlin3/.env', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const sb = createClient('https://fvmpmozybmtzjvikrctq.supabase.co', env['VITE_SUPABASE_ANON_KEY']);

const { data, error } = await sb
  .from('scraped_articles')
  .select('id, title, prices_extracted, topics, equipment_mentioned, relevance_score, source_id')
  .order('created_at', { ascending: false })
  .limit(50);

if (error) { console.error('DB error:', error.message); process.exit(1); }

const withPrices = data.filter(a => a.prices_extracted?.length > 0);
const withTopics = data.filter(a => a.topics?.length > 0);
const withEquip  = data.filter(a => a.equipment_mentioned?.length > 0);
const noClassify = data.filter(a => !a.topics?.length && !a.equipment_mentioned?.length);

console.log('\n=== PARSING QUALITY (last 50 articles) ===');
console.log('Total:          ', data.length);
console.log('With prices:    ', withPrices.length, ' =', Math.round(withPrices.length/data.length*100)+'%');
console.log('With topics:    ', withTopics.length,  ' =', Math.round(withTopics.length/data.length*100)+'%');
console.log('With equipment: ', withEquip.length,   ' =', Math.round(withEquip.length/data.length*100)+'%');
console.log('UNCLASSIFIED:   ', noClassify.length,  ' =', Math.round(noClassify.length/data.length*100)+'%');

const priceRate  = withPrices.length / data.length * 100;
const topicRate  = withTopics.length / data.length * 100;
const equipRate  = withEquip.length  / data.length * 100;
const priceWeight = priceRate >= 10 ? 0.4 : priceRate >= 2 ? 0.2 : 0;
const remaining = 1 - priceWeight;
const score = Math.round(priceRate * priceWeight + topicRate * (remaining * 0.55) + equipRate * (remaining * 0.45));
console.log('\nComputed health score:', score + '/100');

console.log('\n=== SOURCES breakdown ===');
const bySrc = {};
data.forEach(a => { bySrc[a.source_id] = (bySrc[a.source_id]||0)+1; });
Object.entries(bySrc).sort((a,b) => b[1]-a[1]).forEach(([src,n]) => console.log(' ', n, src));

console.log('\n=== UNCLASSIFIED samples ===');
noClassify.slice(0,5).forEach(a => console.log(' -', a.title?.slice(0,80)));

console.log('\n=== TOPIC distribution ===');
const topicCount = {};
data.forEach(a => (a.topics||[]).forEach(t => { topicCount[t] = (topicCount[t]||0)+1; }));
Object.entries(topicCount).sort((a,b) => b[1]-a[1]).forEach(([t,n]) => console.log(' ', n, t));
