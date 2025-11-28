#!/usr/bin/env node
/**
 * Run SQL migration to fix grid connection questions
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fvmpmozybmtzjvikrctq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigration() {
  console.log('🔧 Starting grid connection migration...\n');

  // Step 1: Find all utilityRateType questions
  console.log('Step 1: Finding utilityRateType questions...');
  const { data: oldQuestions, error: findError } = await supabase
    .from('custom_questions')
    .select('id, use_case_id, field_name, question_text')
    .eq('field_name', 'utilityRateType');

  if (findError) {
    console.error('❌ Error finding questions:', findError);
    return;
  }

  console.log(`📋 Found ${oldQuestions?.length || 0} questions to update\n`);

  // Step 2: Update each question
  if (oldQuestions && oldQuestions.length > 0) {
    console.log('Step 2: Updating questions to gridConnection...');
    
    for (const question of oldQuestions) {
      const { error: updateError } = await supabase
        .from('custom_questions')
        .update({
          field_name: 'gridConnection',
          question_text: 'Grid connection quality',
          question_type: 'select',
          options: [
            { value: 'reliable', label: 'Reliable Grid - Stable power, rare outages' },
            { value: 'unreliable', label: 'Unreliable Grid - Frequent outages, needs backup' },
            { value: 'limited', label: 'Limited Capacity - Grid undersized, may need microgrid' },
            { value: 'off_grid', label: 'Off-Grid - No utility connection, full microgrid needed' },
            { value: 'microgrid', label: 'Microgrid - Independent power system with optional grid tie' }
          ],
          help_text: 'Grid quality determines backup power needs and battery/solar sizing. Critical for PowerMeter calculation.',
          is_required: true
        })
        .eq('id', question.id);

      if (updateError) {
        console.error(`  ❌ Failed to update question ${question.id}:`, updateError);
      } else {
        console.log(`  ✅ Updated question ${question.id} (use_case_id: ${question.use_case_id})`);
      }
    }
  } else {
    console.log('ℹ️  No utilityRateType questions found (might already be updated)');
  }

  // Step 3: Verify the changes
  console.log('\nStep 3: Verifying grid connection questions...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('custom_questions')
    .select('use_case_id, field_name, question_text, is_required')
    .eq('field_name', 'gridConnection');

  if (verifyError) {
    console.error('❌ Verification error:', verifyError);
    return;
  }

  console.log(`\n✅ Migration complete! Found ${verifyData?.length || 0} gridConnection questions`);
  console.log('\n📊 Sample of updated questions:');
  verifyData?.slice(0, 5).forEach(q => {
    console.log(`   • Use Case ${q.use_case_id}: "${q.question_text}" (required: ${q.is_required})`);
  });

  console.log('\n🔍 Test in browser:');
  console.log('   1. Open Smart Wizard');
  console.log('   2. Select any use case');
  console.log('   3. Look for "Grid connection quality" question with dropdown');
}

runMigration().catch(console.error);
