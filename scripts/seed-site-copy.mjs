#!/usr/bin/env node
// Upsert all site_copy defaults into Supabase.
// Run: node scripts/seed-site-copy.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const rows = [
  { key: 'hero_headline_prefix',  value: 'Reduce Utility Risk' },
  { key: 'hero_accent_lines',     value: JSON.stringify(['Through Energy Stacking.', 'Into an Energy Strategy.', 'Before Utility Risk Hits Growth.']) },
  { key: 'hero_subtext',          value: 'Merlin compares utility power, storage, solar, generators, and flexible loads to recommend the right energy architecture for your business.' },
  { key: 'hero_badge_text',       value: 'Independent B2B Energy Intelligence' },
  { key: 'hero_proof_items',      value: JSON.stringify(['Free & Instant', 'No Utility Login Required', 'CFO-Ready Report']) },
  { key: 'hero_cta_primary',      value: 'Get Your Free Energy Report' },
  { key: 'hero_cta_secondary',    value: 'See How It Works' },
  { key: 'modal_headline',        value: 'Get Your Free Energy Report' },
  { key: 'modal_subtext',         value: 'See exactly how much you could save — takes 30 seconds.' },
  { key: 'modal_cta_text',        value: 'Get My Free Report' },
  { key: 'modal_social_proof',    value: 'Free forever · No credit card · No spam' },
  { key: 'nav_cta_text',          value: 'Get Started' },
];

console.log('Seeding site_copy...');
for (const row of rows) {
  const { error } = await sb.from('site_copy').upsert(
    { ...row, updated_by: 'human', rationale: 'seeded defaults v2', updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );
  if (error) console.error(`  ✗ ${row.key}: ${error.message}`);
  else       console.log(`  ✓ ${row.key}`);
}
console.log('\nDone — site_copy has all 12 keys.');
