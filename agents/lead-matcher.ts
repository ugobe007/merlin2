#!/usr/bin/env node
/**
 * MERLIN LEAD MATCHER AGENT
 * =========================
 * Nightly agent that scores scraped opportunities for BESS / solar / generator
 * fit, routes qualified leads to matching vendors, and sends notifications.
 *
 * Called by daily-runner.ts as Step 5 (Lead Matching & Vendor Routing).
 * Can also be run standalone for on-demand re-scoring:
 *
 *   npx tsx agents/lead-matcher.ts               # normal nightly run
 *   npx tsx agents/lead-matcher.ts --rerun        # re-score all opportunities
 *   npx tsx agents/lead-matcher.ts --dry-run      # score only, no writes
 *   npx tsx agents/lead-matcher.ts --min-score=70 # raise threshold
 *
 * Authority Level: Level 1 (Safe Writes — vendor_leads table only)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { runLeadMatching, type LeadMatchResult } from '../src/services/vendorLeadMatchService.ts';

// ─── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  '';
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? process.env.VITE_RESEND_API_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const isServiceRole = SUPABASE_KEY.length > 200;
if (!isServiceRole) {
  console.warn('⚠️  Using anon key — some writes may fail due to RLS. Use SERVICE_ROLE_KEY for full access.');
}

if (!RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY not set — lead emails will be skipped. Webhook notifications still active.');
}

// ─── CLI flags ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const rerun    = args.includes('--rerun');
const dryRun   = args.includes('--dry-run');
const minScore = parseInt(args.find(a => a.startsWith('--min-score='))?.split('=')[1] ?? '65', 10);
const limit    = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] ?? '500', 10);

// ─── Main ──────────────────────────────────────────────────────────────────────

export interface LeadMatcherRunResult {
  status: 'success' | 'partial' | 'failed';
  result: LeadMatchResult | null;
  durationMs: number;
  summary: string;
}

export async function runLeadMatcher(): Promise<LeadMatcherRunResult> {
  const start = Date.now();

  console.log('\n' + '─'.repeat(50));
  console.log('🎯 MERLIN LEAD MATCHER');
  console.log(`   Rerun:    ${rerun}`);
  console.log(`   Dry run:  ${dryRun}`);
  console.log(`   MinScore: ${minScore}`);
  console.log(`   Limit:    ${limit}`);
  console.log('─'.repeat(50));

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let result: LeadMatchResult | null = null;

  try {
    result = await runLeadMatching(supabase, {
      resendApiKey: RESEND_API_KEY,
      minScore,
      rerun,
      dryRun,
      limit,
    });
  } catch (err) {
    const durationMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ Lead matcher fatal error:', msg);
    return {
      status: 'failed',
      result: null,
      durationMs,
      summary: `Lead matcher failed: ${msg}`,
    };
  }

  const durationMs = Date.now() - start;

  // Print results
  console.log('\n📊 RESULTS');
  console.log(`  Opportunities scanned:   ${result.opportunitiesScanned}`);
  console.log(`  Qualified (≥${minScore}):      ${result.opportunitiesQualified}`);
  console.log(`  Leads created:           ${result.leadsCreated}`);
  console.log(`  Already existed:         ${result.leadsAlreadyExisted}`);
  console.log(`  Notifications sent:      ${result.notificationsSent}`);
  console.log(`  Notification errors:     ${result.notificationErrors}`);
  console.log(`  By category:             BESS=${result.byCategory.bess} Solar=${result.byCategory.solar} Gen=${result.byCategory.generator} Multi=${result.byCategory.multi}`);
  console.log(`  Duration:                ${durationMs}ms`);

  if (result.topLeads.length > 0) {
    console.log('\n🏆 TOP LEADS:');
    for (const lead of result.topLeads) {
      console.log(`  [${lead.score}] ${lead.company} — ${lead.category.toUpperCase()} — ${lead.vendors} vendor(s)`);
    }
  }

  if (result.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    for (const e of result.errors.slice(0, 10)) console.log('  ', e);
  }

  const status: LeadMatcherRunResult['status'] =
    result.errors.length > 0 && result.leadsCreated === 0 ? 'partial' : 'success';

  const summary = [
    `Scanned ${result.opportunitiesScanned} opportunities`,
    `${result.opportunitiesQualified} qualified`,
    `${result.leadsCreated} new leads routed`,
    `BESS:${result.byCategory.bess} Solar:${result.byCategory.solar} Gen:${result.byCategory.generator}`,
    `${result.notificationsSent} notifications sent`,
    dryRun ? '(DRY RUN)' : '',
  ].filter(Boolean).join(' | ');

  console.log(`\n✅ Lead matcher complete: ${summary}`);

  return { status, result, durationMs, summary };
}

// ─── Standalone entry point ────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  runLeadMatcher()
    .then(({ status }) => process.exit(status === 'failed' ? 1 : 0))
    .catch((err) => {
      console.error('Fatal:', err);
      process.exit(1);
    });
}
