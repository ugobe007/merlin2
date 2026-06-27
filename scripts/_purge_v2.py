#!/usr/bin/env python3
"""Overwrite purge-junk-opportunities.ts with fully synced isJunk."""
import os

filepath = '/Users/robertchristopher/merlin2/scripts/purge-junk-opportunities.ts'

NEW_CONTENT = r"""/**
 * Purge junk opportunity rows — synced with opportunity-scraper.js isJunk logic.
 * Run with: npx tsx scripts/purge-junk-opportunities.ts
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ── Exact mirror of opportunity-scraper.js isJunk ───────────────────────────

const SHORT_KNOWN = new Set(['PECO', 'AES', 'ABB', 'GE', 'GM', 'IBM', 'CPS', 'Xcel', 'BYD']);

const JUNK_SINGLE_WORDS = new Set([
  'china', 'india', 'usa', 'uk', 'germany', 'france', 'italy', 'spain',
  'japan', 'korea', 'australia', 'canada', 'mexico', 'brazil', 'russia',
  'oman', 'uae', 'saudiarabia', 'europe', 'africa', 'asia',
  'ohio', 'texas', 'california', 'florida', 'nevada', 'arizona', 'georgia',
  'virginia', 'carolina', 'michigan', 'illinois', 'indiana', 'kentucky',
  'commentary', 'construction', 'groundbreaking', 'expansion', 'opening',
  'analysis', 'report', 'update', 'alert', 'study', 'research', 'news',
]);

const GENERIC_DESCRIPTOR_PATTERN = /^(?:global|major|leading|top|large|small|a\s+|the\s+|local|regional|national|international)\s+(?:energy|solar|power|battery|utility|grid|firm|company|companies|provider|developer|operator|owner|investor|player|giant)\b/i;

const TRAILING_NOISE = /\s+(?:opens?|announces?|starts?|expands?|builds?|acquires?|launches?|plans?|seeks?|proposes?|vows?|brings?|inaugurates?|completes?|celebrates?|unveils?|selects?|awards?|breaks|signs?|closes?|reaches?|secures?|wins?|gets?|reveals?|receives?|to|in|for|by|at|of|the|a|an|and|or|is|are|has|have|was|were|will|set|said|plans?)\s*$/i;

const CORP_SUFFIX_RE = /^(?:Inc|LLC|Ltd|Corp|Corporation|Company|Co|Group|Industries|International|Solutions|Services|Technologies|Tech|Energy|Power|Utilities|Utility|Solar|Battery|Storage|Logistics|Automotive|Manufacturing|Partners|Holdings|Ventures|Capital|Associates|Enterprises)\.?$/i;

function isJunk(name: string | null): boolean {
  if (!name || typeof name !== 'string') return true;
  const t = name.trim();
  if (!t) return true;

  if (t.length < 4 && !SHORT_KNOWN.has(t)) return true;
  if (t.split(/\s+/).length > 7) return true;
  if (/[<>{}[\]\\|@]/.test(t)) return true;
  if (/https?:\/\//i.test(t)) return true;
  if (/,/.test(t)) return true;
  if (/^\d/.test(t)) return true;
  if (!/[a-zA-Z]/.test(t)) return true;
  if (t === t.toUpperCase() && t.length > 8 && !SHORT_KNOWN.has(t)) return true;
  if (!/[A-Z]/.test(t)) return true;
  if (GENERIC_DESCRIPTOR_PATTERN.test(t)) return true;
  if (/^(?:we|they|he|she|it|our|their|his|her|its|i|you|your)\b/i.test(t)) return true;
  if (/^(?:how|why|what|when|where|who|top|best|inside|even|bill|senate|house|republicans|lawmakers|white house|data center|going green)\s/i.test(t)) return true;
  if (/\b(?:seeks?|seeking|requests?|denies?|says?|files?|halts?|rewrites?|pledges?|responds?|aims?|forces?|push|probe|protects?|proposes?|vows?|grew|grow|grown|selling)\b/i.test(t)) return true;
  if (/\b(?:alert|advocate|boom|companies|process|project|policymakers|lawmakers)\b/i.test(t)) return true;
  if (/\b(?:developer|developers|provider|providers|player|operator|operators)\b/i.test(t)) return true;
  if (/\b(?:completes|office|grew up|up here)\b/i.test(t)) return true;
  if (TRAILING_NOISE.test(t)) return true;

  if (t.split(/\s+/).length === 1 && !SHORT_KNOWN.has(t)) {
    if (JUNK_SINGLE_WORDS.has(t.toLowerCase())) return true;
  }
  if (/\b(?:would|could|should|will|may|might|must|shall)\b/i.test(t)) return true;
  if (/\b(?:sees|gaining|surging|threatens|threaten|targets?|warns?|weighs?|mulls?|nears?|paves?|spurs?)\b/i.test(t)) return true;
  if (/\s+and\s+/i.test(t)) return true;
  if (/^(?:construction|groundbreaking|expansion|opening|massive|huge|enormous|record)\s/i.test(t)) return true;
  if (/^new\s+/i.test(t) && !/\b(?:Energy|Power|Solar|Battery|Storage|Systems|Technologies|Tech|Industries|Group|Corp|Company|Co)\b/i.test(t)) return true;

  // Structural: 4+ word name not ending in recognized corporate suffix
  const words = t.split(/\s+/);
  if (words.length >= 4) {
    const lastWord = words[words.length - 1];
    if (!CORP_SUFFIX_RE.test(lastWord)) return true;
  }

  return false;
}

async function main() {
  const { data: rows, error } = await sb
    .from('opportunities')
    .select('id, company_name, confidence_score, source_url');
  if (error) throw error;

  console.log(`Total opportunities in DB: ${rows.length}`);

  const junkIds: string[] = [];
  const junkNames: string[] = [];

  for (const row of rows) {
    if (isJunk(row.company_name)) {
      junkIds.push(row.id);
      junkNames.push(row.company_name);
    }
  }

  console.log(`\nJunk rows to delete: ${junkIds.length} / ${rows.length}`);
  if (junkNames.length > 0) {
    console.log('\nJunk names:');
    junkNames.forEach(n => console.log(`  - ${JSON.stringify(n)}`));
  }

  if (junkIds.length === 0) {
    console.log('\nNothing to delete — DB is clean! \u2713');
    return;
  }

  let deleted = 0;
  for (let i = 0; i < junkIds.length; i += 100) {
    const batch = junkIds.slice(i, i + 100);
    const { error: delError } = await sb.from('opportunities').delete().in('id', batch);
    if (delError) throw delError;
    deleted += batch.length;
  }

  console.log(`\n\u2713 Deleted ${deleted} junk rows.`);
  const { count } = await sb.from('opportunities').select('*', { count: 'exact', head: true });
  console.log(`Remaining clean opportunities: ${count}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
"""

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(NEW_CONTENT)

print(f"Written {len(NEW_CONTENT)} bytes to {filepath}")
