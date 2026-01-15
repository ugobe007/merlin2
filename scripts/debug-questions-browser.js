/**
 * DEBUG SCRIPT: Check custom_questions in database
 * 
 * Run this in the browser console when the app is loaded at localhost:5180
 * 
 * It will show you:
 * 1. All use cases and their question counts
 * 2. Sample questions for a specific industry
 * 3. The exact field names being returned from the database
 */

// Copy everything below and paste into browser console:

(async function debugQuestions() {
  // Import supabase from the app
  const { supabase } = await import('/src/services/supabaseClient.ts');
  
  console.log('🔍 Checking database for custom_questions...\n');
  
  // Get all use cases
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
  console.log('='.repeat(80));
  console.log('QUESTION COUNTS BY INDUSTRY');
  console.log('='.repeat(80));
  
  for (const uc of useCases) {
    // Get questions for this use case
    const { data: questions, error: qError } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('use_case_id', uc.id)
      .order('display_order');
    
    if (qError) {
      console.error(`Error fetching questions for ${uc.slug}:`, qError);
      continue;
    }
    
    const activeCount = questions?.filter(q => q.is_active !== false).length || 0;
    const status = activeCount >= 10 ? '✅' : activeCount > 0 ? '⚠️' : '❌';
    
    console.log(`${status} ${uc.name.padEnd(30)} | ${uc.slug.padEnd(25)} | ${activeCount} questions`);
  }
  
  // Show sample questions for hotel to debug field names
  console.log('\n' + '='.repeat(80));
  console.log('SAMPLE HOTEL QUESTIONS (raw from database)');
  console.log('='.repeat(80));
  
  const hotelUseCase = useCases.find(uc => uc.slug === 'hotel');
  if (hotelUseCase) {
    const { data: hotelQuestions } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('use_case_id', hotelUseCase.id)
      .order('display_order')
      .limit(5);
    
    if (hotelQuestions && hotelQuestions.length > 0) {
      console.log('\nFirst question RAW (all fields):');
      console.log(JSON.stringify(hotelQuestions[0], null, 2));
      
      console.log('\nAll hotel questions (key fields):');
      hotelQuestions.forEach((q, i) => {
        console.log(`  ${i + 1}. field_name="${q.field_name}" | question_key="${q.question_key}" | type="${q.question_type}" | options=${!!q.options} | select_options=${!!q.select_options}`);
      });
    } else {
      console.log('No hotel questions found!');
    }
  }
  
  // Also try manufacturing to see if it's industry-specific
  console.log('\n' + '='.repeat(80));
  console.log('SAMPLE MANUFACTURING QUESTIONS');  
  console.log('='.repeat(80));
  
  const mfgUseCase = useCases.find(uc => uc.slug === 'manufacturing');
  if (mfgUseCase) {
    const { data: mfgQuestions } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('use_case_id', mfgUseCase.id)
      .order('display_order')
      .limit(5);
    
    if (mfgQuestions && mfgQuestions.length > 0) {
      console.log('\nManufacturing questions:');
      mfgQuestions.forEach((q, i) => {
        console.log(`  ${i + 1}. field_name="${q.field_name}" | question_key="${q.question_key}" | question_text="${q.question_text?.substring(0, 40)}..."`);
      });
    } else {
      console.log('No manufacturing questions found!');
    }
  }
  
  console.log('\n✅ Debug complete!');
})();
