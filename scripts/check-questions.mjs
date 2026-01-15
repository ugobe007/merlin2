import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xvcoewpxtgwsqqncnhup.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2Y29ld3B4dGd3c3FxbmNuaHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NTk3MjcsImV4cCI6MjA1ODQzNTcyN30.mSHgWFkGBXWG1AKqB8FQDGVlnKCw5dDthiH8KqJxrFA'
);

async function checkQuestions() {
  // Get all use cases with question counts
  const { data: useCases, error } = await supabase
    .from('use_cases')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('slug');
  
  if (error) {
    console.error('Error fetching use cases:', error);
    return;
  }
  
  console.log('\nActive use cases and their question counts:');
  console.log('=' .repeat(50));
  
  for (const uc of useCases || []) {
    const { count } = await supabase
      .from('custom_questions')
      .select('*', { count: 'exact', head: true })
      .eq('use_case_id', uc.id);
    
    const status = count > 0 ? '✅' : '❌';
    console.log(`${status} ${uc.slug.padEnd(25)} ${String(count || 0).padStart(3)} questions`);
  }
  
  // Also check a sample question
  console.log('\n\nSample questions from hotel:');
  const { data: sampleQ } = await supabase
    .from('custom_questions')
    .select('field_name, question_text, question_type, options')
    .eq('use_case_id', useCases.find(u => u.slug === 'hotel')?.id)
    .limit(5);
  
  console.log(JSON.stringify(sampleQ, null, 2));
}

checkQuestions().catch(console.error);
