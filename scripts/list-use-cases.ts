#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('use_cases')
  .select('slug, name, is_active')
  .eq('is_active', true)
  .order('name');

if (error) {
  console.error('Error:', error);
} else {
  console.log('\n✅ Active Use Cases in Database:\n');
  data.forEach((uc, i) => {
    console.log(`${i + 1}. ${uc.name.padEnd(35)} (${uc.slug})`);
  });
  console.log(`\nTotal: ${data.length} active use cases\n`);
}
