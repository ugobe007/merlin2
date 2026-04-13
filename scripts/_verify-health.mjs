import pg from 'pg';
const { Client } = pg;
const c = new Client({ host: 'db.fvmpmozybmtzjvikrctq.supabase.co', port: 5432, database: 'postgres', user: 'postgres', password: 'YSyHG0FABFExsH9P', ssl: { rejectUnauthorized: false } });
await c.connect();

// What the health check sees: most recent 50 articles
const r = await c.query(`
  SELECT
    COUNT(*) total,
    COUNT(CASE WHEN prices_extracted IS NOT NULL AND jsonb_array_length(prices_extracted) > 0 THEN 1 END) priced,
    COUNT(CASE WHEN topics IS NOT NULL AND array_length(topics,1) > 0 THEN 1 END) with_topics,
    COUNT(CASE WHEN equipment_mentioned IS NOT NULL AND array_length(equipment_mentioned,1) > 0 THEN 1 END) with_equipment
  FROM (
    SELECT prices_extracted, topics, equipment_mentioned
    FROM scraped_articles
    ORDER BY created_at DESC
    LIMIT 50
  ) recent
`);

const { total, priced, with_topics, with_equipment } = r.rows[0];
const priceRate = ((priced / total) * 100).toFixed(1);
const topicRate = ((with_topics / total) * 100).toFixed(1);
const equipRate = ((with_equipment / total) * 100).toFixed(1);

console.log(`Health check sample (50 most recent):`);
console.log(`  price extraction: ${priced}/${total} = ${priceRate}%`);
console.log(`  topic extraction: ${with_topics}/${total} = ${topicRate}%`);
console.log(`  equipment extraction: ${with_equipment}/${total} = ${equipRate}%`);

// Simulate new formula
const p = parseFloat(priceRate), t = parseFloat(topicRate), e = parseFloat(equipRate);
const pw = p >= 10 ? 0.4 : p >= 2 ? 0.2 : 0;
const rem = 1 - pw;
const score = Math.round(p * pw + t * (rem * 0.55) + e * (rem * 0.45));
console.log(`\nSimulated health check score: ${score}%`);
console.log(`Status: ${score >= 65 ? 'PASS' : score >= 40 ? 'WARNING' : 'FAIL'}`);

// Scrape jobs health
const jobs = await c.query(`SELECT COUNT(*) total, SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) successes FROM scrape_jobs`);
const j = jobs.rows[0];
console.log(`\nScrape jobs: ${j.total} total, ${j.successes} successful`);
const successRate = ((j.successes / j.total) * 100).toFixed(1);
console.log(`  success rate: ${successRate}%`);
console.log(`  Backend Scraper status: ${parseFloat(successRate) >= 70 ? 'PASS' : 'WARNING'}`);

// Merlin metrics
const metrics = await c.query(`SELECT COUNT(*) FROM calculation_constants WHERE category='merlin_metrics'`);
console.log(`\nMerlin metrics constants: ${metrics.rows[0].count} rows`);
console.log(`  Status: ${metrics.rows[0].count > 0 ? 'PASS (100)' : 'WARNING (60)'}`);

await c.end();
