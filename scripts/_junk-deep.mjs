import pg from 'pg';
const { Client } = pg;
const c = new Client({
  host: 'db.fvmpmozybmtzjvikrctq.supabase.co', port: 5432,
  database: 'postgres', user: 'postgres', password: 'YSyHG0FABFExsH9P',
  ssl: { rejectUnauthorized: false }
});
await c.connect();

// Sample the 753 "nothing tagged" articles — what do they actually say?
const nothing = await c.query(`
  SELECT a.title, s.name source, a.relevance_score, LEFT(a.excerpt, 120) excerpt
  FROM scraped_articles a
  LEFT JOIN market_data_sources s ON s.id = a.source_id
  WHERE
    (a.equipment_mentioned IS NULL OR array_length(a.equipment_mentioned,1) IS NULL)
    AND (a.topics IS NULL OR array_length(a.topics,1) IS NULL)
  ORDER BY a.created_at DESC
  LIMIT 25
`);
console.log('=== 25 articles with NO equipment AND NO topics ===');
nothing.rows.forEach(r => console.log(`[${String(r.relevance_score || 0).padEnd(5)}] [${(r.source||'?').slice(0,25).padEnd(25)}] ${r.title}`));

// What keywords do these titles contain that our filters miss?
const allNothing = await c.query(`
  SELECT a.title, a.excerpt
  FROM scraped_articles a
  WHERE
    (a.equipment_mentioned IS NULL OR array_length(a.equipment_mentioned,1) IS NULL)
    AND (a.topics IS NULL OR array_length(a.topics,1) IS NULL)
`);

// Build a mini word frequency of these missed titles
const wordMap = {};
for (const row of allNothing.rows) {
  const words = (row.title + ' ' + (row.excerpt || '')).toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4);
  for (const w of words) {
    wordMap[w] = (wordMap[w] || 0) + 1;
  }
}

const STOPWORDS = new Set(['that','this','with','from','have','been','will','they','their','which','energy','about','could','would','into','also','more','than','these','other','over','after','when','then','some','such','even','just','than','very','most','many','each','much','both','also','well','back','down','first','last','long','time','good','want','look','come','make','know','take','your','only','them','were','said','what','here','like','does','need','being','still']);

const sorted = Object.entries(wordMap)
  .filter(([w]) => !STOPWORDS.has(w))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 50);

console.log('\n=== Top words in unclassified articles (missed by filter) ===');
sorted.forEach(([w, cnt]) => console.log(String(cnt).padStart(5), w));

// Check sources contributing most unclassified articles
const srcNothing = await c.query(`
  SELECT s.name, COUNT(*) junk_count
  FROM scraped_articles a
  JOIN market_data_sources s ON s.id = a.source_id
  WHERE
    (a.equipment_mentioned IS NULL OR array_length(a.equipment_mentioned,1) IS NULL)
    AND (a.topics IS NULL OR array_length(a.topics,1) IS NULL)
  GROUP BY s.name
  ORDER BY 2 DESC
  LIMIT 15
`);
console.log('\n=== Sources contributing most unclassified articles ===');
srcNothing.rows.forEach(r => console.log(String(r.junk_count).padStart(5), r.name));

await c.end();
