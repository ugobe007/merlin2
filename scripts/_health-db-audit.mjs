import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.fvmpmozybmtzjvikrctq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'YSyHG0FABFExsH9P',
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('✅ Connected\n');

// ── CHECK 1: Backend Scraper ──────────────────────────────────────────────────
const rss = await client.query(
  `SELECT count(*) FROM market_data_sources WHERE is_active=true AND source_type='rss_feed'`
);
const jobStats = await client.query(
  `SELECT status, count(*) FROM scrape_jobs GROUP BY status ORDER BY count DESC`
);
const lastJob = await client.query(
  `SELECT created_at, status FROM scrape_jobs ORDER BY created_at DESC LIMIT 1`
);
console.log('CHECK 1 — Backend Scraper');
console.log('  active RSS sources:', rss.rows[0].count);
console.log('  job counts:', jobStats.rows);
console.log('  last job:', lastJob.rows[0] ?? 'none');

const lastJobTime = lastJob.rows[0]?.created_at ? new Date(lastJob.rows[0].created_at).getTime() : 0;
const hoursSince = (Date.now() - lastJobTime) / 3600000;
const successCount = jobStats.rows.find(r => r.status === 'success')?.count ?? 0;
const totalJobs = jobStats.rows.reduce((s, r) => s + Number(r.count), 0);
const successRate = totalJobs > 0 ? (Number(successCount) / totalJobs) * 100 : 0;
console.log('  -> success rate:', successRate.toFixed(0) + '%', '| hours since last:', hoursSince.toFixed(1));
console.log('  -> EXPECTED STATUS:', rss.rows[0].count == 0 ? '⚠️  warning (no RSS sources)' : successRate < 70 ? '❌ fail' : hoursSince > 48 ? '⚠️  warning' : '✅ pass');

// ── CHECK 2: Parsing Logic ────────────────────────────────────────────────────
const art = await client.query(
  `SELECT count(*) as total,
    count(CASE WHEN prices_extracted IS NOT NULL AND jsonb_array_length(prices_extracted) > 0 THEN 1 END) as with_prices,
    count(CASE WHEN topics IS NOT NULL AND array_length(topics,1) > 0 THEN 1 END) as with_topics,
    count(CASE WHEN equipment_mentioned IS NOT NULL AND array_length(equipment_mentioned,1) > 0 THEN 1 END) as with_equipment
   FROM scraped_articles`
);
console.log('\nCHECK 2 — Parsing Logic');
console.log('  articles:', art.rows[0]);
const total = Number(art.rows[0].total);
const priceRate = total > 0 ? (Number(art.rows[0].with_prices) / total) * 100 : 0;
const topicRate = total > 0 ? (Number(art.rows[0].with_topics) / total) * 100 : 0;
const equipRate = total > 0 ? (Number(art.rows[0].with_equipment) / total) * 100 : 0;
const avgQuality = priceRate * 0.4 + topicRate * 0.3 + equipRate * 0.3;
console.log('  -> price rate:', priceRate.toFixed(0) + '%', '| topic:', topicRate.toFixed(0) + '%', '| equip:', equipRate.toFixed(0) + '%', '| avg:', avgQuality.toFixed(0) + '%');
console.log('  -> EXPECTED STATUS:', total === 0 ? '⚠️  warning' : priceRate < 20 || avgQuality < 50 ? '❌ fail' : avgQuality < 70 || priceRate < 40 ? '⚠️  warning' : '✅ pass');

// ── CHECK 3: DB Schemas ───────────────────────────────────────────────────────
const tables = ['use_cases','custom_questions','pricing_configurations','equipment_pricing','calculation_constants','scraped_articles','market_data_sources','utility_rates'];
console.log('\nCHECK 3 — Database Schemas');
let missingTables = [];
for (const t of tables) {
  try {
    const r = await client.query(`SELECT count(*) FROM ${t}`);
    console.log(`  ✅ ${t}: ${r.rows[0].count} rows`);
  } catch (e) {
    console.log(`  ❌ ${t}: MISSING`);
    missingTables.push(t);
  }
}
console.log('  -> EXPECTED STATUS:', missingTables.length > 0 ? '❌ fail (' + missingTables.join(', ') + ')' : '✅ pass');

// ── CHECK 4: SSOT Compliance (QuoteEngine) ────────────────────────────────────
console.log('\nCHECK 4 — SSOT Compliance');
console.log('  -> calls QuoteEngine.generateQuote() — cannot test from pg script');
console.log('  -> DEPENDS ON: QuoteEngine working with live DB data');

// ── CHECK 5: Workflow Links ───────────────────────────────────────────────────
console.log('\nCHECK 5 — Workflow Links');
console.log('  -> purely static route check, always passes');
console.log('  -> EXPECTED STATUS: ✅ pass (100)');

// ── CHECK 6: TrueQuote Compliance (QuoteEngine) ───────────────────────────────
console.log('\nCHECK 6 — TrueQuote Compliance');
console.log('  -> calls QuoteEngine.generateQuote() — cannot test from pg script');

// ── CHECK 7: Calculation Logic (QuoteEngine x4) ───────────────────────────────
console.log('\nCHECK 7 — Calculation Logic');
console.log('  -> calls QuoteEngine.generateQuote() x4 — cannot test from pg script');

// ── CHECK 8: Template Formats ─────────────────────────────────────────────────
const uc = await client.query(
  `SELECT id, name, power_profile, equipment, financial_params
   FROM use_cases WHERE is_active=true LIMIT 20`
);
console.log('\nCHECK 8 — Template Formats');
let issues = [], warnings = [];
for (const u of uc.rows) {
  if (u.power_profile !== null && typeof u.power_profile !== 'object') issues.push(u.name + ': bad power_profile');
  else if (!u.power_profile) warnings.push(u.name + ': power_profile null');
  if (u.equipment !== null && !Array.isArray(u.equipment)) issues.push(u.name + ': bad equipment');
  if (u.financial_params !== null && typeof u.financial_params !== 'object') issues.push(u.name + ': bad financial_params');
}
console.log('  total active use_cases:', uc.rows.length, '| issues:', issues.length, '| warnings:', warnings.length);
if (issues.length) console.log('  ISSUES:', issues.slice(0,5));
if (warnings.length) console.log('  warnings (first 5):', warnings.slice(0,5));
const score8 = issues.length === 0 ? (warnings.length === 0 ? 100 : Math.max(70, 100 - warnings.length * 2)) : Math.max(0, 100 - issues.length * 15);
console.log('  -> EXPECTED STATUS:', issues.length === 0 ? (warnings.length === 0 ? '✅ pass (100)' : `⚠️  warning (${score8})`) : `❌ fail (${score8})`);

// ── CHECK 9: Wizard Functionality ─────────────────────────────────────────────
const q = await client.query(
  `SELECT id, question_text, display_order FROM custom_questions ORDER BY display_order LIMIT 200`
);
const orders = q.rows.map(r => r.display_order).filter(o => o !== null);
const dupes = orders.filter((o, i) => orders.indexOf(o) !== i);
const noText = q.rows.filter(r => !r.question_text || r.question_text.trim() === '');
console.log('\nCHECK 9 — Wizard Functionality');
console.log('  questions:', q.rows.length, '| dupes:', dupes.length, '| missing text:', noText.length);
console.log('  -> EXPECTED STATUS:', (dupes.length === 0 && noText.length === 0) ? '✅ pass' : dupes.length + noText.length <= 1 ? '⚠️  warning' : '❌ fail');

// ── CHECK 10: Quote Engine ────────────────────────────────────────────────────
console.log('\nCHECK 10 — Quote Engine');
console.log('  -> calls QuoteEngine.generateQuote() x3 — cannot test from pg script');

// ── CHECK 11: Merlin Metrics ──────────────────────────────────────────────────
const mm = await client.query(
  `SELECT count(*) FROM calculation_constants WHERE category='merlin_metrics'`
);
const lastAlert = await client.query(
  `SELECT created_at FROM ssot_alerts ORDER BY created_at DESC LIMIT 1`
);
const lastAlertTime = lastAlert.rows[0]?.created_at ? new Date(lastAlert.rows[0].created_at).getTime() : 0;
const hoursSinceAlert = (Date.now() - lastAlertTime) / 3600000;
console.log('\nCHECK 11 — Merlin Metrics');
console.log('  merlin_metrics constants:', mm.rows[0].count);
console.log('  last ssot_alert:', lastAlert.rows[0]?.created_at ?? 'none', '| hours ago:', hoursSinceAlert.toFixed(1));
const hasCalib = Number(mm.rows[0].count) > 0;
console.log('  -> EXPECTED STATUS:', !hasCalib ? '⚠️  warning (no calibration data)' : hoursSinceAlert > 168 ? `⚠️  warning (${Math.round(hoursSinceAlert/24)}d ago)` : hoursSinceAlert > 24 ? '⚠️  warning (>24h ago)' : '✅ pass');

await client.end();
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('NOTE: Checks 4, 6, 7, 10 require QuoteEngine (TypeScript browser context)');
console.log('      Those will only show real results in the Admin → System Health dashboard.');
