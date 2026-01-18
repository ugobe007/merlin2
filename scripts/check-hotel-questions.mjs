// Check hotel questions - Run with: node scripts/check-hotel-questions.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fvmpmozybmtzjvikrctq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MjI5MCwiZXhwIjoyMDc3ODU4MjkwfQ.pGemfuUEr17rYU1atovIgrfwLNZ7gcC0_k2wpmiHzAg'
);

async function checkHotel() {
  // Get hotel ID
  const { data: uc } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', 'hotel')
    .single();
  
  // Get all hotel questions
  const { data: questions } = await supabase
    .from('custom_questions')
    .select('question, field_name, display_order, is_advanced')
    .eq('use_case_id', uc.id)
    .order('display_order');
  
  console.log(`Hotel questions (${questions.length}):\n`);
  
  // Group by field_name to find semantic duplicates
  const byField = {};
  questions.forEach((q, i) => {
    const fn = q.field_name;
    if (!byField[fn]) byField[fn] = [];
    byField[fn].push({ ...q, index: i + 1 });
  });
  
  // Print all questions
  questions.forEach((q, i) => {
    const adv = q.is_advanced ? ' [ADV]' : '';
    console.log(`${i + 1}. [order:${q.display_order}] ${q.field_name}${adv}`);
    console.log(`   "${q.question?.substring(0, 60)}..."`);
  });
  
  // Check for field_name duplicates
  console.log('\n--- DUPLICATE field_names ---');
  let hasDupes = false;
  for (const [fn, items] of Object.entries(byField)) {
    if (items.length > 1) {
      hasDupes = true;
      console.log(`${fn}: ${items.length} occurrences at positions ${items.map(i => i.index).join(', ')}`);
    }
  }
  if (!hasDupes) console.log('No duplicate field_names found');
  
  // Check for similar questions (semantic duplicates)
  console.log('\n--- SIMILAR QUESTIONS (potential semantic duplicates) ---');
  const keywords = ['elevator', 'pool', 'laundry', 'solar', 'restaurant', 'gym', 'infrastructure'];
  for (const kw of keywords) {
    const matches = questions.filter(q => 
      q.question?.toLowerCase().includes(kw) || 
      q.field_name?.toLowerCase().includes(kw)
    );
    if (matches.length > 1) {
      console.log(`\n"${kw}" appears in ${matches.length} questions:`);
      matches.forEach(m => console.log(`  - ${m.field_name}: ${m.question?.substring(0, 50)}`));
    }
  }
}

checkHotel().catch(console.error);
