import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'db.fvmpmozybmtzjvikrctq.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'YSyHG0FABFExsH9P',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  family: 4
});
await client.connect();
console.log('✅ Connected\n');

const q = (label, sql) => client.query(sql).then(r => {
  console.log(`--- ${label} ---`);
  console.log(r.rows);
  console.log();
});

// 1. Backend Scraper check — scrape_jobs
await q('scrape_jobs (Backend Scraper)', `SELECT status, COUNT(*) as cnt FROM scrape_jobs GROUP BY status`);

// 2. Parsing Logic — scraped_articles quality
await q('scraped_articles quality (Parsing Logic)', `
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE prices_extracted IS NOT NULL AND jsonb_array_length(prices_extracted) > 0) as with_prices,
    COUNT(*) FILTER (WHERE topics IS NOT NULL AND array_length(topics,1) > 0) as with_topics,
    COUNT(*) FILTER (WHERE equipment_mentioned IS NOT NULL AND array_length(equipment_mentioned,1) > 0) as with_equip
  FROM scraped_articles`);

// 3. DB Schema check — all tables exist (already confirmed; just get row counts)
await q('DB table row counts (Database Schemas)', `
  SELECT 'scrape_jobs' as tbl, COUNT(*) FROM scrape_jobs
  UNION ALL SELECT 'scraped_articles', COUNT(*) FROM scraped_articles
  UNION ALL SELECT 'ssot_alerts', COUNT(*) FROM ssot_alerts
  UNION ALL SELECT 'market_data_sources', COUNT(*) FROM market_data_sources
  UNION ALL SELECT 'calculation_constants', COUNT(*) FROM calculation_constants
  UNION ALL SELECT 'use_cases', COUNT(*) FROM use_cases
  UNION ALL SELECT 'custom_questions', COUNT(*) FROM custom_questions
  UNION ALL SELECT 'utility_rates', COUNT(*) FROM utility_rates
  UNION ALL SELECT 'pricing_configurations', COUNT(*) FROM pricing_configurations
  UNION ALL SELECT 'equipment_pricing', COUNT(*) FROM equipment_pricing`);

// 4. SSOT — ssot_alerts categories
await q('ssot_alerts by category (SSOT Compliance)', `
  SELECT category, COUNT(*) as cnt FROM ssot_alerts GROUP BY category ORDER BY cnt DESC LIMIT 10`);

// 5. Workflow Links — market_data_sources
await q('market_data_sources (Workflow Links)', `
  SELECT COUNT(*) FILTER (WHERE is_active) as active, COUNT(*) as total FROM market_data_sources`);

// 6. Calculation Logic — calculation_constants categories
await q('calculation_constants categories (Calculation Logic)', `
  SELECT category, COUNT(*) as cnt FROM calculation_constants GROUP BY category ORDER BY category`);

// 7. Wizard Functionality — display_order duplicates
await q('display_order duplicates (Wizard Functionality)', `
  SELECT display_order, COUNT(*) as cnt FROM custom_questions 
  WHERE display_order IS NOT NULL 
  GROUP BY display_order HAVING COUNT(*) > 1 LIMIT 10`);

// 8. Merlin Metrics — calculation_constants merlin_metrics
await q('merlin_metrics constants (Merlin Metrics)', `
  SELECT * FROM calculation_constants WHERE category = 'merlin_metrics' LIMIT 5`);

// 9. equipment_pricing + pricing_configurations (TrueQuote / Quote Engine)
await q('equipment_pricing (TrueQuote/Quote Engine)', `
  SELECT COUNT(*) as total FROM equipment_pricing`);
await q('pricing_configurations (TrueQuote/Quote Engine)', `
  SELECT COUNT(*) as total FROM pricing_configurations`);

// 10. Template Formats — use_cases
await q('use_cases (Template Formats)', `SELECT COUNT(*) as total FROM use_cases`);

await client.end();
console.log('✅ Probe complete');
