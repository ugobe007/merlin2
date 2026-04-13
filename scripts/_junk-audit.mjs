import pg from 'pg';
const { Client } = pg;
const c = new Client({
  host: 'db.fvmpmozybmtzjvikrctq.supabase.co', port: 5432,
  database: 'postgres', user: 'postgres', password: 'YSyHG0FABFExsH9P',
  ssl: { rejectUnauthorized: false }
});
await c.connect();

// Topics
const t = await c.query(`SELECT unnest(topics) topic, COUNT(*) cnt FROM scraped_articles GROUP BY 1 ORDER BY 2 DESC LIMIT 20`);
console.log('\n=== Topics distribution ===');
t.rows.forEach(r => console.log(String(r.cnt).padStart(5), r.topic));

// Equipment
const e = await c.query(`SELECT unnest(equipment_mentioned) eq, COUNT(*) cnt FROM scraped_articles GROUP BY 1 ORDER BY 2 DESC LIMIT 20`);
console.log('\n=== Equipment distribution ===');
e.rows.forEach(r => console.log(String(r.cnt).padStart(5), r.eq));

// Relevance buckets
const rel = await c.query(`
  SELECT
    CASE
      WHEN relevance_score >= 0.7 THEN 'high  (>=0.7)'
      WHEN relevance_score >= 0.3 THEN 'medium (0.3-0.7)'
      WHEN relevance_score >  0   THEN 'low   (>0 <0.3)'
      ELSE 'ZERO'
    END bucket,
    COUNT(*) cnt
  FROM scraped_articles GROUP BY 1 ORDER BY 2 DESC
`);
console.log('\n=== Relevance score buckets ===');
rel.rows.forEach(r => console.log(String(r.cnt).padStart(5), r.bucket));

// Worst sources (most zero/low relevance articles)
const src = await c.query(`
  SELECT s.name, COUNT(*) total,
    ROUND(AVG(a.relevance_score)::numeric,3) avg_rel,
    COUNT(CASE WHEN a.relevance_score < 0.1 THEN 1 END) junk
  FROM scraped_articles a
  JOIN market_data_sources s ON s.id = a.source_id
  GROUP BY s.name
  ORDER BY junk DESC, avg_rel ASC
  LIMIT 25
`);
console.log('\n=== Sources by junk count (relevance < 0.1) ===');
console.log('junk | total | avg_rel | source');
src.rows.forEach(r => console.log(
  String(r.junk).padStart(4), '|',
  String(r.total).padStart(5), '|',
  String(r.avg_rel).padStart(6), '|',
  r.name
));

// Sample low-relevance articles to understand what junk looks like
const low = await c.query(`
  SELECT a.title, s.name source, a.relevance_score, a.topics, a.equipment_mentioned
  FROM scraped_articles a
  JOIN market_data_sources s ON s.id = a.source_id
  WHERE a.relevance_score < 0.1
  ORDER BY a.created_at DESC
  LIMIT 15
`);
console.log('\n=== Sample low-relevance articles ===');
low.rows.forEach(r => console.log(`[${String(r.relevance_score).padEnd(5)}] [${r.source}] ${r.title}`));

// What titles contain no energy keywords at all?
const noEnergy = await c.query(`
  SELECT COUNT(*) cnt
  FROM scraped_articles
  WHERE
    (equipment_mentioned IS NULL OR array_length(equipment_mentioned,1) IS NULL)
    AND (topics IS NULL OR array_length(topics,1) IS NULL)
`);
console.log(`\n=== Articles with NO equipment AND NO topics: ${noEnergy.rows[0].cnt} ===`);

await c.end();
