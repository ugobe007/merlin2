import pg from 'pg';
const { Client } = pg;
const c = new Client({ host: 'db.fvmpmozybmtzjvikrctq.supabase.co', port: 5432, database: 'postgres', user: 'postgres', password: 'YSyHG0FABFExsH9P', ssl: { rejectUnauthorized: false } });
await c.connect();

// Wizard display_order distribution
const dist = await c.query(`
  SELECT display_order, count(*) as cnt
  FROM custom_questions
  GROUP BY display_order
  ORDER BY cnt DESC
  LIMIT 20
`);
console.log('=== display_order distribution (top 20) ===');
dist.rows.forEach(r => console.log(`  order=${r.display_order} -> ${r.cnt} questions`));

const total = await c.query(`SELECT count(*) as total, count(display_order) as non_null FROM custom_questions`);
console.log('\ntotal questions:', total.rows[0].total, '| non-null display_order:', total.rows[0].non_null);

// Sample some questions
const sample = await c.query(`SELECT id, question_text, display_order, industry_slug FROM custom_questions ORDER BY display_order LIMIT 10`);
console.log('\nSample questions:');
sample.rows.forEach(r => console.log(`  [${r.display_order}] ${r.industry_slug}: ${r.question_text?.slice(0,60)}`));

// scrape_jobs table structure
console.log('\n=== scrape_jobs columns ===');
const cols = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='scrape_jobs' ORDER BY ordinal_position`);
cols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
const jobCount = await c.query(`SELECT count(*) FROM scrape_jobs`);
console.log('total rows:', jobCount.rows[0].count);

// market_data_sources sample
console.log('\n=== market_data_sources sample ===');
const sources = await c.query(`SELECT id, name, source_type, is_active, feed_url FROM market_data_sources WHERE is_active=true LIMIT 5`);
sources.rows.forEach(r => console.log(`  ${r.name} (${r.source_type}): ${r.feed_url?.slice(0,60)}`));

// prices_extracted columns detail
console.log('\n=== prices_extracted sample from scraped_articles ===');
const prices = await c.query(`SELECT prices_extracted FROM scraped_articles WHERE prices_extracted IS NOT NULL LIMIT 5`);
prices.rows.forEach(r => console.log('  ', JSON.stringify(r.prices_extracted)));

// calculation_constants categories
console.log('\n=== calculation_constants categories ===');
const cats = await c.query(`SELECT category, count(*) FROM calculation_constants GROUP BY category ORDER BY count DESC`);
cats.rows.forEach(r => console.log(`  ${r.category}: ${r.count}`));

await c.end();
