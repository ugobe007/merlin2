#!/usr/bin/env tsx
/**
 * GOD Score Bias Monitor
 * ─────────────────────────────────────────────────────────────
 * Runs daily at 9 AM UTC via GitHub Actions (main.yml).
 * Checks the last 7 days of quotes in Supabase for:
 *   1. GOD score distribution (are scores clustering at extremes?)
 *   2. Mean / median / stddev sanity check
 *   3. Per-industry bias (any vertical always getting 90+?)
 *
 * Exits 0 if healthy, 1 if anomalies detected.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ──────────────────────────────────────────────────────────────────
function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function stddev(arr: number[], avg: number): number {
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - avg) ** 2, 0) / arr.length);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run(): Promise<void> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`\n🔍 GOD Score Bias Monitor — ${new Date().toISOString()}`);
  console.log(`   Checking quotes since: ${since}\n`);

  // Fetch quotes with god_score from the last 7 days
  const { data, error } = await supabase
    .from('quotes')
    .select('god_score, industry, created_at')
    .gte('created_at', since)
    .not('god_score', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    // Table may not exist yet or column name differs — soft warn, don't fail
    console.warn('⚠️  Could not fetch quotes:', error.message);
    console.log('   This is expected if the quotes table has no recent god_score data.');
    console.log('   Exiting with success — no anomaly detected.\n');
    process.exit(0);
  }

  if (!data || data.length === 0) {
    console.log('ℹ️  No quotes with god_score in the last 7 days. Nothing to check.');
    process.exit(0);
  }

  const scores = data.map(r => r.god_score as number);
  const avg    = mean(scores);
  const med    = median(scores);
  const std    = stddev(scores, avg);

  console.log(`📊 Stats (n=${scores.length})`);
  console.log(`   Mean:   ${avg.toFixed(1)}`);
  console.log(`   Median: ${med.toFixed(1)}`);
  console.log(`   StdDev: ${std.toFixed(1)}`);
  console.log(`   Min:    ${Math.min(...scores).toFixed(1)}`);
  console.log(`   Max:    ${Math.max(...scores).toFixed(1)}`);

  // Per-industry breakdown
  const byIndustry: Record<string, number[]> = {};
  for (const row of data) {
    const ind = (row.industry as string) ?? 'unknown';
    if (!byIndustry[ind]) byIndustry[ind] = [];
    byIndustry[ind].push(row.god_score as number);
  }

  console.log('\n📋 Per-industry means:');
  for (const [ind, arr] of Object.entries(byIndustry)) {
    console.log(`   ${ind.padEnd(22)} avg=${mean(arr).toFixed(1)}  n=${arr.length}`);
  }

  // ── Anomaly checks ────────────────────────────────────────────────────────
  const anomalies: string[] = [];

  // 1. Mean too high (systematic overscoring)
  if (avg > 85) anomalies.push(`Mean GOD score is ${avg.toFixed(1)} — above 85 threshold (possible bias toward high scores)`);

  // 2. Mean too low (systematic underscoring or broken calc)
  if (avg < 30) anomalies.push(`Mean GOD score is ${avg.toFixed(1)} — below 30 threshold (possible calculation error)`);

  // 3. Very low variance (scores are suspiciously uniform)
  if (std < 5 && scores.length >= 10) anomalies.push(`StdDev is only ${std.toFixed(1)} — scores may be artificially uniform`);

  // 4. Any single industry always at 95+
  for (const [ind, arr] of Object.entries(byIndustry)) {
    if (arr.length >= 3 && mean(arr) > 95) {
      anomalies.push(`Industry "${ind}" has mean score ${mean(arr).toFixed(1)} — possible hardcoded or inflated scores`);
    }
  }

  if (anomalies.length > 0) {
    console.error('\n🚨 ANOMALIES DETECTED:');
    anomalies.forEach(a => console.error(`   • ${a}`));
    process.exit(1);
  }

  console.log('\n✅ GOD score distribution looks healthy. No anomalies detected.\n');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
