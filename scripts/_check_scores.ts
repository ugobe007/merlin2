import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const { data } = await sb
  .from('opportunities')
  .select('company_name, confidence_score, signals, industry, status')
  .order('confidence_score', { ascending: false })
  .limit(30);

console.log('\nTop 30 opportunities by confidence score:\n');
for (const r of data!) {
  console.log(`  [${r.confidence_score}] ${r.company_name} | ${r.industry || 'no-industry'} | ${JSON.stringify(r.signals)}`);
}

const { count } = await sb.from('opportunities').select('*', { count: 'exact', head: true });
console.log(`\nTotal: ${count}`);
