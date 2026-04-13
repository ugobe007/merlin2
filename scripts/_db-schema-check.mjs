import pg from 'pg';
const { Client } = pg;

const c = new Client({
  host: 'db.fvmpmozybmtzjvikrctq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'YSyHG0FABFExsH9P',
  ssl: { rejectUnauthorized: false }
});

await c.connect();

const sj = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='scrape_jobs' ORDER BY ordinal_position`);
console.log('=== scrape_jobs columns ===');
sj.rows.forEach(r => console.log(' ', r.column_name, '-', r.data_type));

const cc = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='calculation_constants' ORDER BY ordinal_position`);
console.log('\n=== calculation_constants columns ===');
cc.rows.forEach(r => console.log(' ', r.column_name, '-', r.data_type));

const sample = await c.query(`SELECT * FROM calculation_constants LIMIT 3`);
console.log('\n=== calculation_constants sample rows ===');
sample.rows.forEach(r => console.log(JSON.stringify(r)));

const cats = await c.query(`SELECT category, COUNT(*) FROM calculation_constants GROUP BY category ORDER BY category`);
console.log('\n=== categories ===');
cats.rows.forEach(r => console.log(' ', r.category, '-', r.count));

const art = await c.query(`
  SELECT 
    COUNT(*) total,
    COUNT(full_content) with_content,
    COUNT(CASE WHEN prices_extracted IS NOT NULL AND prices_extracted != '[]'::jsonb THEN 1 END) with_prices
  FROM scraped_articles
`);
console.log('\n=== scraped_articles summary ===');
console.log(JSON.stringify(art.rows[0]));

await c.end();
