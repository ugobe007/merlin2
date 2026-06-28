#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Count total users
const { data: allUsers, error: uErr } = await sb.from('user_profiles').select('id, email, plan, role');
console.log('Total user_profiles:', allUsers?.length, '| error:', uErr?.message ?? 'none');

// Try various quote-related table names
for (const tbl of ['saved_quotes','quotes','quote_requests','energy_quotes','quote_results']) {
  const { count, error } = await sb.from(tbl).select('id', { count: 'exact', head: true });
  console.log(`${tbl}: count=${count} error=${error?.message ?? 'none'}`);
}
