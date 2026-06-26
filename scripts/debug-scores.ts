#!/usr/bin/env npx tsx
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { scoreOpportunity } from '../src/services/vendorLeadMatchService.js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''
);

const { data: opps } = await sb
  .from('opportunities')
  .select('id,title,signals,description,source_url')
  .order('created_at', { ascending: false })
  .limit(15);

if (!opps?.length) { console.log('No opportunities found'); process.exit(0); }

for (const opp of opps) {
  const scores = scoreOpportunity(opp as any);
  const top = Math.max(scores.bess, scores.solar, scores.generator);
  console.log(`[${top}] ${opp.title?.slice(0, 70)}`);
  console.log(`       signals=${JSON.stringify(opp.signals)} bess=${scores.bess} solar=${scores.solar} gen=${scores.generator}`);
}
