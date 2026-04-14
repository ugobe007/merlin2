import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/robertchristopher/merlin3/.env', 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const sb = createClient('https://fvmpmozybmtzjvikrctq.supabase.co', env['VITE_SUPABASE_ANON_KEY']);

const { data, error } = await sb
  .from('scraped_articles')
  .select('title, content, topics, equipment_mentioned')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) { console.error(error.message); process.exit(1); }

for (const a of data) {
  console.log('\n────────────────────────────────────────');
  console.log('TITLE:', a.title);
  console.log('TOPICS:', a.topics?.join(', '));
  console.log('EQUIPMENT:', a.equipment_mentioned?.join(', '));
  console.log('CONTENT len:', a.content?.length ?? 0);
  console.log('CONTENT:', a.content?.slice(0, 300));
}
