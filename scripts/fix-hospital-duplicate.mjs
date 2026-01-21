#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  console.log('\n=== FIXING HOSPITAL DUPLICATE ELECTRICITY QUESTIONS ===\n');

  // Get hospital use case
  const { data: hospital } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', 'hospital')
    .single();

  // Find the duplicate question (monthlyEnergyCost)
  const { data: duplicate } = await supabase
    .from('custom_questions')
    .select('id, field_name, question_text, display_order')
    .eq('use_case_id', hospital.id)
    .eq('field_name', 'monthlyEnergyCost')
    .single();

  if (!duplicate) {
    console.log('✅ No duplicate found - already fixed!');
    return;
  }

  console.log('Found duplicate:');
  console.log(`  ID: ${duplicate.id}`);
  console.log(`  Field: ${duplicate.field_name}`);
  console.log(`  Question: ${duplicate.question_text}`);
  console.log(`  Order: ${duplicate.display_order}\n`);

  // Delete it
  const { error } = await supabase
    .from('custom_questions')
    .delete()
    .eq('id', duplicate.id);

  if (error) {
    console.error('❌ Error deleting:', error);
  } else {
    console.log('✅ Duplicate question deleted successfully!');
  }

  // Verify
  const { data: remaining } = await supabase
    .from('custom_questions')
    .select('field_name, question_text')
    .eq('use_case_id', hospital.id)
    .or('field_name.eq.monthlyElectricBill,field_name.eq.monthlyEnergyCost');

  console.log('\nRemaining electricity questions:');
  remaining.forEach(q => {
    console.log(`  - ${q.field_name}: ${q.question_text}`);
  });
}

main().catch(console.error);
