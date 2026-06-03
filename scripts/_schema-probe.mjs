import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  // Discover actual columns
  const { data: arts, error: artErr } = await sb.from('scraped_articles').select('*').limit(3);
  if (artErr) { console.error('scraped_articles error:', artErr.message); }
  else if (arts.length) {
    console.log('scraped_articles columns:', Object.keys(arts[0]).join(', '));
    console.log('Sample row:', JSON.stringify(arts[0]).slice(0, 500));
    console.log('Total rows fetched:', arts.length);
  }

  const { data: prices } = await sb.from('collected_market_prices').select('*').limit(3);
  if (prices && prices.length) {
    console.log('\ncollected_market_prices columns:', Object.keys(prices[0]).join(', '));
    console.log('Sample:', JSON.stringify(prices[0]).slice(0, 400));
  }

  const { data: srcs } = await sb.from('market_data_sources').select('*').limit(3);
  if (srcs && srcs.length) {
    console.log('\nmarket_data_sources columns:', Object.keys(srcs[0]).join(', '));
    console.log('Sample:', JSON.stringify(srcs[0]).slice(0, 400));
  }

  // Count total articles
  const { count } = await sb.from('scraped_articles').select('*', { count: 'exact', head: true });
  console.log('\nTotal articles in DB:', count);
}

main().catch(console.error);
