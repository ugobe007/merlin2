#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Get all columns of user_profiles by selecting *
const { data, error } = await sb.from('user_profiles').select('*').limit(3);
console.log('user_profiles error:', error?.message ?? 'none');
console.log('user_profiles sample:', JSON.stringify(data, null, 2));

// Check what tables exist in public schema via information_schema
const { data: tables, error: tErr } = await sb
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .order('table_name');
console.log('\nPublic tables error:', tErr?.message ?? 'none');
console.log('Public tables:', tables?.map(t => t.table_name).join(', '));
