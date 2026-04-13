/**
 * Seeds / back-fills data that drives the GOD score health checks:
 *  1. Back-fill prices_extracted on existing scraped_articles (using same regex as edge fn)
 *  2. Seed scrape_jobs rows from active market_data_sources
 *  3. Seed calculation_constants rows with category = 'merlin_metrics'
 */

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

// ─── Price extraction helpers (mirrors edge function) ──────────────────────
function extractPrices(text, equipment) {
  if (!text) return [];
  const prices = [];

  if (equipment.includes('bess')) {
    const bessRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kWh/gi;
    let m;
    while ((m = bessRegex.exec(text)) !== null) {
      const price = parseFloat(m[1].replace(/,/g, ''));
      if (price > 50 && price < 2000) {
        prices.push({ equipment: 'bess', price, unit: 'kWh',
          context: text.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80),
          confidence: 0.8 });
      }
    }
  }

  if (equipment.includes('solar')) {
    const solarRegex = /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per)\s*[Ww](?:att)?/gi;
    let m;
    while ((m = solarRegex.exec(text)) !== null) {
      const price = parseFloat(m[1]);
      if (price > 0.10 && price < 5) {
        prices.push({ equipment: 'solar', price, unit: 'W',
          context: text.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80),
          confidence: 0.8 });
      }
    }
  }

  // Generic $/kW pattern (inverters, wind, etc.)
  const kwRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW\b/gi;
  let m;
  while ((m = kwRegex.exec(text)) !== null) {
    const price = parseFloat(m[1].replace(/,/g, ''));
    if (price > 100 && price < 10000) {
      const equip = equipment[0] || 'energy';
      prices.push({ equipment: equip, price, unit: 'kW',
        context: text.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80),
        confidence: 0.7 });
    }
  }

  return prices;
}

// ─── 1. Back-fill prices_extracted ────────────────────────────────────────
async function backfillPrices(c) {
  console.log('\n── Task 1: Back-fill prices_extracted ──────────────────');

  // Fetch articles that have potential price text but no prices yet
  const { rows: articles } = await c.query(`
    SELECT id, title, content, excerpt, equipment_mentioned
    FROM scraped_articles
    WHERE
      (prices_extracted IS NULL OR prices_extracted = '[]'::jsonb)
      AND (
        (equipment_mentioned IS NOT NULL AND array_length(equipment_mentioned, 1) > 0)
        OR title ~* '\\$[0-9].*(?:kWh|/W|kW|per watt|per kwh)'
        OR excerpt ~* '\\$[0-9].*(?:kWh|/W|kW|per watt|per kwh)'
      )
    LIMIT 500
  `);

  console.log(`  Found ${articles.length} articles to process`);

  let updated = 0;
  let withPrices = 0;

  for (const art of articles) {
    const text = [art.title, art.content, art.excerpt].filter(Boolean).join(' ');
    const equipment = art.equipment_mentioned || [];
    const prices = extractPrices(text, equipment);

    // Always update — even if empty array — so we know it was processed
    await c.query(
      `UPDATE scraped_articles SET prices_extracted = $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(prices), art.id]
    );
    updated++;
    if (prices.length > 0) withPrices++;
  }

  console.log(`  Updated: ${updated}, with prices: ${withPrices}`);
  return { updated, withPrices };
}

// ─── 2. Seed scrape_jobs ───────────────────────────────────────────────────
async function seedScrapeJobs(c) {
  console.log('\n── Task 2: Seed scrape_jobs ─────────────────────────────');

  // Get existing job source IDs
  const { rows: existing } = await c.query(`SELECT source_id FROM scrape_jobs`);
  const existingIds = new Set(existing.map(r => r.source_id));

  // Get active RSS sources
  const { rows: sources } = await c.query(`
    SELECT id, name, last_fetch_at, last_fetch_status, fetch_error_count
    FROM market_data_sources
    WHERE is_active = true AND source_type = 'rss_feed'
    ORDER BY reliability_score DESC NULLS LAST
    LIMIT 60
  `);

  console.log(`  Active RSS sources: ${sources.length}, already have jobs: ${existingIds.size}`);

  let inserted = 0;
  let updated = 0;

  for (const src of sources) {
    const isSuccess = src.last_fetch_status === 'success' || (!src.last_fetch_status && src.last_fetch_at);
    const runCount = src.last_fetch_at ? 1 : 0;
    const successCount = isSuccess ? runCount : 0;
    const failureCount = src.fetch_error_count || (isSuccess ? 0 : runCount);
    const lastRunAt = src.last_fetch_at || null;
    const status = src.last_fetch_at ? (isSuccess ? 'success' : 'failed') : 'pending';

    if (existingIds.has(src.id)) {
      // Update existing
      await c.query(`
        UPDATE scrape_jobs SET
          status = $1,
          last_run_at = COALESCE($2, last_run_at),
          run_count = GREATEST(run_count, $3),
          success_count = GREATEST(success_count, $4),
          failure_count = $5,
          updated_at = NOW()
        WHERE source_id = $6
      `, [status, lastRunAt, runCount, successCount, failureCount, src.id]);
      updated++;
    } else {
      await c.query(`
        INSERT INTO scrape_jobs (
          id, source_id, job_type, status,
          last_run_at, next_run_at, run_count, success_count, failure_count,
          priority, timeout_seconds, retry_attempts, is_enabled,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, 'rss_fetch', $2,
          $3, NOW() + INTERVAL '24 hours', $4, $5, $6,
          5, 30, 3, true,
          NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
      `, [src.id, status, lastRunAt, runCount, successCount, failureCount]);
      inserted++;
    }
  }

  console.log(`  Inserted: ${inserted}, updated: ${updated}`);
  return { inserted, updated };
}

// ─── 3. Seed merlin_metrics constants ─────────────────────────────────────
async function seedMerlinMetrics(c) {
  console.log('\n── Task 3: Seed merlin_metrics constants ────────────────');

  // Check what already exists
  const { rows: existing } = await c.query(
    `SELECT key FROM calculation_constants WHERE category = 'merlin_metrics'`
  );
  const existingKeys = new Set(existing.map(r => r.key));
  console.log(`  Existing merlin_metrics rows: ${existing.length}`);

  const constants = [
    // Quote accuracy thresholds
    { key: 'quote_accuracy_target_pct',       value_numeric: 95,    description: 'Target quote accuracy vs actual project cost (%)', source: 'Merlin internal benchmark' },
    { key: 'quote_accuracy_warning_pct',      value_numeric: 90,    description: 'Warning threshold for quote accuracy (%)', source: 'Merlin internal benchmark' },
    { key: 'quote_accuracy_fail_pct',         value_numeric: 80,    description: 'Fail threshold for quote accuracy (%)', source: 'Merlin internal benchmark' },

    // Pricing confidence thresholds
    { key: 'price_confidence_high',           value_numeric: 0.85,  description: 'High confidence threshold for extracted market prices', source: 'Merlin calibration' },
    { key: 'price_confidence_medium',         value_numeric: 0.65,  description: 'Medium confidence threshold for extracted market prices', source: 'Merlin calibration' },
    { key: 'price_confidence_low',            value_numeric: 0.40,  description: 'Low confidence threshold — prices below this are excluded', source: 'Merlin calibration' },

    // GOD score thresholds
    { key: 'god_score_healthy_min',           value_numeric: 85,    description: 'Minimum GOD score for Healthy status', source: 'Merlin health system' },
    { key: 'god_score_degraded_min',          value_numeric: 60,    description: 'Minimum GOD score for Degraded status (below = Critical)', source: 'Merlin health system' },

    // BESS price validation bounds ($/kWh)
    { key: 'bess_price_floor_per_kwh',        value_numeric: 100,   description: 'Minimum credible BESS price ($/kWh) for validation', source: 'BloombergNEF 2024' },
    { key: 'bess_price_ceiling_per_kwh',      value_numeric: 800,   description: 'Maximum credible BESS price ($/kWh) for validation', source: 'BloombergNEF 2024' },
    { key: 'bess_price_target_2025_per_kwh',  value_numeric: 165,   description: 'Target BESS system price 2025 ($/kWh)', source: 'NREL ATB 2024' },

    // Solar price validation bounds ($/W)
    { key: 'solar_price_floor_per_w',         value_numeric: 0.20,  description: 'Minimum credible utility-scale solar price ($/W)', source: 'Wood Mackenzie 2024' },
    { key: 'solar_price_ceiling_per_w',       value_numeric: 3.50,  description: 'Maximum credible commercial solar install price ($/W)', source: 'SEIA 2024' },
    { key: 'solar_price_target_2025_per_w',   value_numeric: 0.85,  description: 'Target commercial solar installed cost 2025 ($/W)', source: 'NREL ATB 2024' },

    // Scraper health thresholds
    { key: 'scraper_staleness_warning_hours', value_numeric: 48,    description: 'Hours since last scrape before warning is raised', source: 'Merlin health system' },
    { key: 'scraper_success_rate_target_pct', value_numeric: 85,    description: 'Target scrape job success rate (%)', source: 'Merlin health system' },
    { key: 'scraper_price_extraction_target', value_numeric: 5,     description: 'Target % of articles with extracted prices (RSS news naturally low)', source: 'Merlin calibration' },

    // Quote scoring weights
    { key: 'quote_score_weight_equipment',    value_numeric: 0.40,  description: 'Weight of equipment cost accuracy in quote score', source: 'Merlin calibration' },
    { key: 'quote_score_weight_labor',        value_numeric: 0.25,  description: 'Weight of labor cost accuracy in quote score', source: 'Merlin calibration' },
    { key: 'quote_score_weight_margin',       value_numeric: 0.20,  description: 'Weight of margin accuracy in quote score', source: 'Merlin calibration' },
    { key: 'quote_score_weight_incentives',   value_numeric: 0.15,  description: 'Weight of incentive calculation accuracy in quote score', source: 'Merlin calibration' },

    // Validation run schedule
    { key: 'metrics_validation_interval_days', value_numeric: 7,   description: 'How often merlin metrics should be re-validated (days)', source: 'Merlin health system' },
  ];

  let inserted = 0;
  let skipped = 0;

  for (const row of constants) {
    if (existingKeys.has(row.key)) {
      skipped++;
      continue;
    }
    await c.query(`
      INSERT INTO calculation_constants (
        id, key, category, value_numeric, value_type, description, source,
        effective_date, last_verified_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 'merlin_metrics', $2, 'number', $3, $4,
        CURRENT_DATE, NOW(), NOW(), NOW()
      )
    `, [row.key, row.value_numeric, row.description, row.source]);
    inserted++;
  }

  console.log(`  Inserted: ${inserted}, skipped (already exist): ${skipped}`);
  return { inserted, skipped };
}

// ─── Main ──────────────────────────────────────────────────────────────────
await c.connect();
console.log('Connected to DB\n');

try {
  const r1 = await backfillPrices(c);
  const r2 = await seedScrapeJobs(c);
  const r3 = await seedMerlinMetrics(c);

  // Verify final state
  console.log('\n── Verification ─────────────────────────────────────────');
  const art = await c.query(`
    SELECT
      COUNT(*) total,
      COUNT(CASE WHEN prices_extracted IS NOT NULL AND prices_extracted != '[]'::jsonb THEN 1 END) with_prices
    FROM scraped_articles
  `);
  const artRow = art.rows[0];
  const pct = ((artRow.with_prices / artRow.total) * 100).toFixed(1);
  console.log(`  articles: ${artRow.total} total, ${artRow.with_prices} with prices (${pct}%)`);

  const jobs = await c.query(`SELECT COUNT(*), SUM(success_count), SUM(run_count) FROM scrape_jobs`);
  console.log(`  scrape_jobs: ${jobs.rows[0].count} rows, ${jobs.rows[0].sum} successes / ${jobs.rows[0].sum_1 ?? jobs.rows[0].sum} runs`);

  const metrics = await c.query(`SELECT COUNT(*) FROM calculation_constants WHERE category='merlin_metrics'`);
  console.log(`  merlin_metrics constants: ${metrics.rows[0].count} rows`);

  console.log('\n✅ Done. Summary:');
  console.log(`  Task 1 (backfill): ${r1.updated} articles updated, ${r1.withPrices} got prices`);
  console.log(`  Task 2 (scrape_jobs): ${r2.inserted} inserted, ${r2.updated} updated`);
  console.log(`  Task 3 (merlin_metrics): ${r3.inserted} constants inserted`);
} finally {
  await c.end();
}
