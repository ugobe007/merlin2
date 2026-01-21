import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function analyzeQuestions() {
  // Get all active use cases
  const { data: useCases } = await supabase
    .from('use_cases')
    .select('id, slug, name, is_active')
    .eq('is_active', true)
    .order('name');

  console.log('\n📊 Step 3 Questionnaire Analysis (Active Use Cases)\n');
  console.log('='.repeat(80));

  let totalUseCases = 0;
  let highQuestionCount = 0;
  let okQuestionCount = 0;
  let goodQuestionCount = 0;

  for (const useCase of useCases || []) {
    // Get questions for this use case
    const { data: questions } = await supabase
      .from('custom_questions')
      .select('id, field_name, question_text, input_type')
      .eq('use_case_id', useCase.id)
      .eq('is_active', true)
      .order('display_order');

    const count = questions?.length || 0;
    totalUseCases++;

    let status = '';
    if (count > 20) {
      status = '⚠️ HIGH';
      highQuestionCount++;
    } else if (count > 15) {
      status = '⚡ OK';
      okQuestionCount++;
    } else {
      status = '✅ GOOD';
      goodQuestionCount++;
    }
    
    console.log(`\n${status} ${useCase.name} (${useCase.slug})`);
    console.log(`   Questions: ${count}`);
    
    if (count > 20) {
      console.log(`   ⚠️ ALERT: ${count} questions may cause fatigue!`);
      console.log(`   📝 Recommendation: Reduce to 15-18 questions`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📈 SUMMARY');
  console.log(`   Total Active Use Cases: ${totalUseCases}`);
  console.log(`   ✅ Good (<= 15 questions): ${goodQuestionCount}`);
  console.log(`   ⚡ OK (16-20 questions): ${okQuestionCount}`);
  console.log(`   ⚠️ High (> 20 questions): ${highQuestionCount}`);
  
  if (highQuestionCount > 0) {
    console.log(`\n⚠️ WARNING: ${highQuestionCount} use case(s) have >20 questions!`);
    console.log(`   User may experience question fatigue.`);
    console.log(`   Recommend consolidating or removing non-essential questions.`);
  } else {
    console.log(`\n✅ All use cases within acceptable question limits!`);
  }

  console.log('\n');
}

analyzeQuestions().catch(console.error);
