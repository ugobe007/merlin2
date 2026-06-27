import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data, error } = await sb
  .from('opportunities')
  .select('company_name, confidence_score, status')
  .order('created_at', { ascending: false })
  .limit(40);

if (error) { console.error(error); process.exit(1); }

console.log('\nLast 40 opportunity company names:');
for (const row of data) {
  console.log(`  [${row.confidence_score}] ${row.company_name}  (${row.status})`);
}

// Count junk indicators
const junkCount = data.filter(r =>
  /^(we|they|he|she|it|our|their|global|major|leading|top)\b/i.test(r.company_name) ||
  /\s+(brings|inaugurates|completes|opens|announces)$/i.test(r.company_name) ||
  /\b(developer|provider|player|office)\b/i.test(r.company_name)
).length;

console.log(`\nEstimated junk in last 40: ${junkCount}`);
