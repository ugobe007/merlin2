#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data: hospital } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', 'hospital')
    .single();

  // Find ALL monthlyEnergyCost questions
  const { data: duplicates } = await supabase
    .from('custom_questions')
    .select('id, field_name, question_text, display_order')
    .eq('use_case_id', hospital.id)
    .eq('field_name', 'monthlyEnergyCost');

  console.log(`Found ${duplicates.length} monthlyEnergyCost questions:\n`);
  for (const dup of duplicates) {
    console.log(`Deleting: ${dup.id} (Order ${dup.display_order})`);
    await supabase.from('custom_questions').delete().eq('id', dup.id);
  }

  console.log('\n✅ All duplicates deleted!');
}

main().catch(console.error);
