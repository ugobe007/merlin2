// Database Question Count Audit
// Run from browser console or as a test

// Copy this into browser console on localhost:5179

async function auditQuestions() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  
  // Get Supabase URL and key from environment (check your .env)
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
  const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get all use cases
  const { data: useCases, error: ucError } = await supabase
    .from('use_cases')
    .select('id, slug, name, is_active')
    .eq('is_active', true)
    .order('name');
  
  if (ucError) {
    console.error('Error:', ucError);
    return;
  }
  
  console.log('=== QUESTION COUNTS BY INDUSTRY ===\n');
  console.log(`Found ${useCases.length} active use cases\n`);
  
  const results = [];
  
  for (const uc of useCases) {
    const { data: questions, error } = await supabase
      .from('custom_questions')
      .select('field_name, question_text, is_active')
      .eq('use_case_id', uc.id);
    
    const activeCount = questions?.filter(q => q.is_active !== false).length || 0;
    const status = activeCount > 5 ? '✅' : activeCount > 0 ? '⚠️' : '❌';
    
    results.push({
      name: uc.name,
      slug: uc.slug,
      questionCount: activeCount,
      status
    });
    
    console.log(`${status} ${uc.name.padEnd(30)} | slug: ${uc.slug.padEnd(25)} | questions: ${activeCount}`);
  }
  
  // Summary
  const withQuestions = results.filter(r => r.questionCount > 5);
  const needsWork = results.filter(r => r.questionCount <= 5);
  
  console.log('\n=== SUMMARY ===');
  console.log(`✅ Industries with >5 questions: ${withQuestions.length}`);
  console.log(`⚠️ Industries with ≤5 questions: ${needsWork.length}`);
  console.log('\nNeeds work:', needsWork.map(r => r.slug).join(', '));
  
  return results;
}

// Run it
auditQuestions();
