import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fvmpmozybmtzjvitrctq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aXRyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIyMjM5NzgsImV4cCI6MjA0Nzc5OTk3OH0.s88bFAcNHt8Yshn8dqg-jD8c1Yh4t4-l7JRAz4oMEbk'
);

async function check() {
  // Get EV charging use case
  const { data: ev, error: evError } = await supabase
    .from('use_cases')
    .select('id, slug, name')
    .eq('slug', 'ev-charging')
    .single();
  
  if (evError || !ev) {
    console.log('No EV charging use case found:', evError?.message);
    return;
  }
  
  console.log(`\n✅ Found EV Charging use case: ${ev.name} (${ev.id})\n`);
  
  // Get questions
  const { data: questions, error: qError } = await supabase
    .from('custom_questions')
    .select('field_name, question_text, default_value, display_order')
    .eq('use_case_id', ev.id)
    .order('display_order');
  
  if (qError) {
    console.log('Error fetching questions:', qError.message);
    return;
  }
  
  console.log('EV Charging Custom Questions:');
  console.log('─'.repeat(80));
  questions.forEach(q => {
    console.log(`  ${q.display_order}. field_name: "${q.field_name}" (default: "${q.default_value}")`);
    console.log(`     Question: ${q.question_text}`);
    console.log('');
  });
  
  // Check which field names match the calculation function expectations
  console.log('\n📊 Field Name Analysis:');
  console.log('─'.repeat(80));
  console.log('Calculation function expects:');
  console.log('  - level1Count OR numberOfLevel1Chargers OR level1Chargers');
  console.log('  - level2Count OR numberOfLevel2Chargers OR level2Chargers');
  console.log('  - dcfastCount OR numberOfDCFastChargers OR dcFastChargers');
  console.log('');
  
  const fieldNames = questions.map(q => q.field_name);
  const hasL1 = fieldNames.some(f => ['level1Count', 'numberOfLevel1Chargers', 'level1Chargers'].includes(f));
  const hasL2 = fieldNames.some(f => ['level2Count', 'numberOfLevel2Chargers', 'level2Chargers'].includes(f));
  const hasDC = fieldNames.some(f => ['dcfastCount', 'numberOfDCFastChargers', 'dcFastChargers'].includes(f));
  
  console.log(`Level 1 charger field found: ${hasL1 ? '✅ YES' : '❌ NO'} (${fieldNames.filter(f => f.toLowerCase().includes('level1')).join(', ')})`);
  console.log(`Level 2 charger field found: ${hasL2 ? '✅ YES' : '❌ NO'} (${fieldNames.filter(f => f.toLowerCase().includes('level2')).join(', ')})`);
  console.log(`DC Fast charger field found: ${hasDC ? '✅ YES' : '❌ NO'} (${fieldNames.filter(f => f.toLowerCase().includes('dcfast') || f.toLowerCase().includes('dc_fast')).join(', ')})`);
  
  console.log('\n🔍 All field names in DB: ', fieldNames.join(', '));
}

check();
