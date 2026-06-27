import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

const { data: scraped } = await sb
  .from('scraped_articles')
  .select('relevance_score, topics, excerpt, url, title')
  .gte('created_at', cutoff)
  .order('relevance_score', { ascending: false })
  .limit(5);
console.log('Top 5 scraped articles (last 48h):');
console.log(JSON.stringify(scraped, null, 2));

const { count: total } = await sb
  .from('scraped_articles')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', cutoff);
console.log('\nTotal scraped last 48h:', total);

const { count: highRel } = await sb
  .from('scraped_articles')
  .select('*', { count: 'exact', head: true })
  .gte('relevance_score', 0.6)
  .gte('created_at', cutoff);
console.log('High relevance (>=0.6):', highRel);

const { count: anyRel } = await sb
  .from('scraped_articles')
  .select('*', { count: 'exact', head: true })
  .gte('relevance_score', 0.3)
  .gte('created_at', cutoff);
console.log('Medium relevance (>=0.3):', anyRel);

const { data: opps } = await sb
  .from('opportunities')
  .select('id, company_name, signals, confidence_score, created_at')
  .order('created_at', { ascending: false })
  .limit(5);
console.log('\nLatest opportunities:');
console.log(JSON.stringify(opps, null, 2));

const { count: oppCount } = await sb
  .from('opportunities')
  .select('*', { count: 'exact', head: true });
console.log('\nTotal opportunities in table:', oppCount);
