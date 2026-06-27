import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const { data, error } = await sb
  .from('scraped_articles')
  .select('title, excerpt, topics, equipment_mentioned, relevance_score, published_at')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) { console.error(error.message); process.exit(1); }

for (const a of data) {
  console.log('\n────────────────────────────────────────');
  console.log('TITLE:', a.title);
  console.log('DATE:', (a.published_at || '').slice(0, 10));
  console.log('RELEVANCE:', a.relevance_score);
  console.log('TOPICS:', a.topics?.join(', '));
  console.log('EQUIPMENT:', a.equipment_mentioned?.join(', '));
  console.log('EXCERPT:', a.excerpt?.slice(0, 300));
}
