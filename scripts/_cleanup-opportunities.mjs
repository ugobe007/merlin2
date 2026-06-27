/**
 * _cleanup-opportunities.mjs
 *
 * Re-evaluates every row in the `opportunities` table using the new
 * ontological inference engine (v2).  Rows whose company_name is
 * classified as junk are soft-deleted (status → 'junk').  Surviving
 * rows get their confidence_score re-weighted with the new name-quality
 * score so high-quality org names surface higher in the pipeline.
 *
 * Run:  node scripts/_cleanup-opportunities.mjs
 * Dry:  node scripts/_cleanup-opportunities.mjs --dry-run
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

import { createClient } from '@supabase/supabase-js';
const { isJunk, scoreCompanyName } = await import('../server/services/opportunity-scraper.js');

const DRY_RUN = process.argv.includes('--dry-run');
const PAGE = 500; // rows per fetch

const sb = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) => String(n).padStart(5);
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');

// ── fetch all opportunities paginated ────────────────────────────────────────

async function fetchAll() {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('opportunities')
      .select('id, company_name, confidence_score, status, signals, industry')
      .range(from, from + PAGE - 1)
      .order('id');
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

// ── main ──────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(62)}`);
console.log(` Merlin Opportunity Cleanup — ontological inference engine v2`);
console.log(` Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
console.log(`${'─'.repeat(62)}\n`);

const all = await fetchAll();
console.log(`Fetched ${all.length} opportunity rows from DB.\n`);

// Classify every row
const junkRows     = [];   // will be soft-deleted
const survivorRows = [];   // will be re-scored

for (const row of all) {
  // Skip rows already archived / manually reviewed
  if (row.status === 'archived') {
    continue;
  }

  if (isJunk(row.company_name)) {
    junkRows.push(row);
  } else {
    survivorRows.push(row);
  }
}

// ── Print sample junk ─────────────────────────────────────────────────────────
console.log(`── JUNK (will be soft-deleted) ─── ${junkRows.length} rows`);
const JUNK_SAMPLE = junkRows.slice(0, 30);
JUNK_SAMPLE.forEach((r) =>
  console.log(`  ❌ [${r.status.padEnd(10)}] ${JSON.stringify(r.company_name)}`)
);
if (junkRows.length > JUNK_SAMPLE.length)
  console.log(`  … and ${junkRows.length - JUNK_SAMPLE.length} more`);

// ── Compute re-scores for survivors ─────────────────────────────────────────
// confidence_score was blended as: signal_conf * 0.8 + name_quality * 0.2
// Back-calculate signal_conf from stored value, apply new name quality.
const updates = [];
let scoreChanges = { up: 0, down: 0, same: 0 };
for (const row of survivorRows) {
  const newNameScore = scoreCompanyName(row.company_name);
  // Reconstruct signal portion: prev = signal*0.8 + old_name*0.2
  // We don't have old_name score, so approximate: signal ≈ (stored_score - 0) / 0.8
  // Safe upper bound: cap at 100
  const signalPortion = Math.min(row.confidence_score / 0.8, 100);
  const newScore = Math.min(Math.round(signalPortion * 0.8 + newNameScore * 0.2), 100);

  if (newScore !== row.confidence_score) {
    updates.push({ id: row.id, old: row.confidence_score, new: newScore });
    if (newScore > row.confidence_score) scoreChanges.up++;
    else scoreChanges.down++;
  } else {
    scoreChanges.same++;
  }
}

// ── Print survivor sample ────────────────────────────────────────────────────
console.log(`\n── SURVIVORS (valid company names) ─── ${survivorRows.length} rows`);
const SURV_SAMPLE = survivorRows.slice(0, 20);
SURV_SAMPLE.forEach((r) => {
  const upd = updates.find((u) => u.id === r.id);
  const scoreStr = upd
    ? ` (score ${upd.old} → ${upd.new})`
    : ` (score ${r.confidence_score} unchanged)`;
  console.log(`  ✅ ${JSON.stringify(r.company_name).padEnd(38)}${scoreStr}`);
});
if (survivorRows.length > SURV_SAMPLE.length)
  console.log(`  … and ${survivorRows.length - SURV_SAMPLE.length} more`);

// ── Summary ─────────────────────────────────────────────────────────────────
const total = all.length;
console.log(`\n${'─'.repeat(62)}`);
console.log(` SUMMARY`);
console.log(`${'─'.repeat(62)}`);
console.log(`${fmt(total)}   total rows in DB`);
console.log(`${fmt(junkRows.length)}   junk → status: archived  (${pct(junkRows.length, total)})`);
console.log(`${fmt(survivorRows.length)}   survivors → keep     (${pct(survivorRows.length, total)})`);
console.log(`${fmt(updates.length)}   score updates needed`);
console.log(`        ↑ improved: ${scoreChanges.up}  ↓ reduced: ${scoreChanges.down}  = same: ${scoreChanges.same}`);

if (DRY_RUN) {
  console.log(`\n  ⚠️  DRY RUN — no writes performed.`);
  console.log(`  Re-run without --dry-run to apply changes.\n`);
  process.exit(0);
}

// ── Apply writes ─────────────────────────────────────────────────────────────

console.log(`\nApplying changes…`);

// Soft-delete junk in batches of 100
let deleted = 0;
const JUNK_IDS = junkRows.map((r) => r.id);
for (let i = 0; i < JUNK_IDS.length; i += 100) {
  const batch = JUNK_IDS.slice(i, i + 100);
  const { error } = await sb
    .from('opportunities')
    .update({ status: 'archived' })
    .in('id', batch);
  if (error) { console.error('  ❌ junk-update error:', error.message); break; }
  deleted += batch.length;
  process.stdout.write(`\r  Marked ${deleted}/${JUNK_IDS.length} rows as rejected…`);
}
console.log();

// Update confidence scores for survivors that changed
let scored = 0;
for (const u of updates) {
  const { error } = await sb
    .from('opportunities')
    .update({ confidence_score: u.new })
    .eq('id', u.id);
  if (error) { console.error(`  ❌ score-update error for id=${u.id}:`, error.message); continue; }
  scored++;
  if (scored % 50 === 0)
    process.stdout.write(`\r  Re-scored ${scored}/${updates.length} rows…`);
}
if (updates.length) console.log(`\r  Re-scored ${scored}/${updates.length} rows.  `);

// ── Also clean up vendor_leads that reference junk opportunities ──────────────
if (JUNK_IDS.length > 0) {
  console.log(`\n  Marking vendor_leads referencing junk opportunities…`);
  let vleads = 0;
  for (let i = 0; i < JUNK_IDS.length; i += 100) {
    const batch = JUNK_IDS.slice(i, i + 100);
    const { data, error } = await sb
      .from('vendor_leads')
      .update({ status: 'archived' })
      .in('opportunity_id', batch)
      .neq('status', 'archived')
      .select('id');
    if (error) { console.error('  ❌ vendor_leads update error:', error.message); continue; }
    vleads += (data || []).length;
  }
  console.log(`  Archived ${vleads} vendor_lead(s) linked to junk opportunities.`);
}

console.log(`\n✅ Cleanup complete.\n`);
