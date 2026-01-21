#!/usr/bin/env node
/**
 * Direct update for occupancyRate question to range_buttons
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fvmpmozybmtzjvikrctq.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function updateOccupancyRateQuestion() {
  console.log('🚀 Updating occupancyRate questions to range_buttons...\n');

  // First, find all occupancyRate questions
  const { data: existing, error: fetchError } = await supabase
    .from('custom_questions')
    .select('id, use_case_id, field_name, question_type, options')
    .eq('field_name', 'occupancyRate');

  if (fetchError) {
    console.error('❌ Error fetching questions:', fetchError.message);
    process.exit(1);
  }

  console.log(`📋 Found ${existing?.length || 0} occupancyRate questions\n`);

  if (!existing || existing.length === 0) {
    console.log('⚠️  No occupancyRate questions found. Nothing to update.');
    process.exit(0);
  }

  // Show current state
  existing.forEach(q => {
    console.log(`  - ID ${q.id} (use_case: ${q.use_case_id}): question_type = ${q.question_type}`);
  });

  // Update all of them
  const newOptions = {
    ranges: [
      { label: 'Low', sublabel: '0-40%', min: 0, max: 40 },
      { label: 'Moderate', sublabel: '40-60%', min: 40, max: 60 },
      { label: 'Average', sublabel: '60-75%', min: 60, max: 75 },
      { label: 'High', sublabel: '75-90%', min: 75, max: 90 },
      { label: 'Very High', sublabel: '90-100%', min: 90, max: 100 }
    ],
    suffix: '%'
  };

  const { data: updated, error: updateError } = await supabase
    .from('custom_questions')
    .update({
      question_type: 'range_buttons',
      options: newOptions,
      help_text: 'Select the range that best describes your typical occupancy',
      default_value: '68'
    })
    .eq('field_name', 'occupancyRate')
    .select();

  if (updateError) {
    console.error('\n❌ Error updating questions:', updateError.message);
    process.exit(1);
  }

  console.log(`\n✅ Successfully updated ${updated?.length || 0} questions!\n`);

  // Verify
  updated?.forEach(q => {
    console.log(`  - ID ${q.id}: question_type = ${q.question_type} ✓`);
  });

  console.log('\n🎉 Migration complete!');
}

updateOccupancyRateQuestion();
