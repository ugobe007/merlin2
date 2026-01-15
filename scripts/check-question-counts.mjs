import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkQuestions() {
  console.log('=== QUESTION COUNTS BY INDUSTRY ===\n');

  // Get all use cases with their question counts
  const { data: useCases, error: ucError } = await supabase
    .from('use_cases')
    .select('id, slug, name, is_active')
    .eq('is_active', true)
    .order('name');

  if (ucError) {
    console.error('Error fetching use cases:', ucError);
    return;
  }

  console.log(`Found ${useCases.length} active use cases\n`);

  for (const uc of useCases) {
    const { count, error } = await supabase
      .from('custom_questions')
      .select('*', { count: 'exact', head: true })
      .eq('use_case_id', uc.id)
      .eq('is_active', true);

    const status = count > 0 ? '✅' : '❌';
    const name = uc.name.padEnd(30);
    const slug = uc.slug.padEnd(25);
    console.log(`${status} ${name} | slug: ${slug} | questions: ${count || 0}`);
  }

  // Also check for questions with specific field names
  console.log('\n=== SAMPLE QUESTION FIELDS ===\n');
  
  const { data: sampleQuestions } = await supabase
    .from('custom_questions')
    .select('use_case_id, field_name, question_text, is_active')
    .eq('is_active', true)
    .limit(20);
  
  if (sampleQuestions) {
    sampleQuestions.forEach(q => {
      console.log(`  - ${q.field_name}: ${q.question_text?.substring(0, 50)}...`);
    });
  }
}

checkQuestions()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
