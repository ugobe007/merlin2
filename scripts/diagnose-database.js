/**
 * Database Diagnostic Script
 * Run this in the browser console when the app is loaded to check database content
 * 
 * Usage: Copy this script and paste into browser console on the Merlin app
 */

// This will work because the app already has Supabase client initialized
async function diagnoseDatabase() {
  // Get supabase client from window (it's available in dev)
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  
  // Use the same credentials as the app
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://ymafwotkxhqwwvgylbwy.supabase.co';
  const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYWZ3b3RreGhxd3d2Z3lsYnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5MzkzOTYsImV4cCI6MjA0NjUxNTM5Nn0.NNo8lxxTxVFLLtgYWxPX3lHMIp7K2FjKbZrCKqEAWXY';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 MERLIN DATABASE DIAGNOSTIC');
  console.log('================================');
  
  // 1. Check all use cases
  const { data: useCases, error: ucError } = await supabase
    .from('use_cases')
    .select('slug, name, is_active')
    .order('name');
  
  if (ucError) {
    console.error('❌ Error fetching use_cases:', ucError);
  } else {
    console.log(`\n📂 USE CASES (${useCases.length} total):`);
    useCases.forEach(uc => {
      console.log(`  ${uc.is_active ? '✅' : '❌'} ${uc.slug} - ${uc.name}`);
    });
  }
  
  // 2. Check question counts per use case
  const { data: questionCounts, error: qcError } = await supabase
    .from('custom_questions')
    .select('use_case_id');
  
  if (!qcError && questionCounts) {
    const countByUseCase = {};
    questionCounts.forEach(q => {
      countByUseCase[q.use_case_id] = (countByUseCase[q.use_case_id] || 0) + 1;
    });
    
    console.log(`\n📊 QUESTIONS PER USE CASE:`);
    
    // Match counts with use case names
    for (const uc of (useCases || [])) {
      const ucId = uc.id;
      // Need to get the ID
    }
  }
  
  // 3. Check specific use cases
  const checkSlugs = ['car-wash', 'hotel', 'restaurant', 'cold-storage', 'apartment', 'ev-charging'];
  
  console.log(`\n📋 DETAILED CHECK FOR KEY USE CASES:`);
  
  for (const slug of checkSlugs) {
    const { data: uc } = await supabase
      .from('use_cases')
      .select('id, slug, name, is_active')
      .eq('slug', slug)
      .single();
    
    if (uc) {
      const { data: questions } = await supabase
        .from('custom_questions')
        .select('field_name, question_tier, is_active')
        .eq('use_case_id', uc.id)
        .order('display_order');
      
      console.log(`\n  🏢 ${uc.name} (${uc.slug}) - ${uc.is_active ? 'ACTIVE' : 'INACTIVE'}`);
      console.log(`     Questions: ${questions?.length || 0}`);
      if (questions && questions.length > 0) {
        const essential = questions.filter(q => q.question_tier === 'essential').length;
        const standard = questions.filter(q => q.question_tier === 'standard').length;
        const detailed = questions.filter(q => q.question_tier === 'detailed').length;
        const noTier = questions.filter(q => !q.question_tier).length;
        console.log(`     Tiers: essential=${essential}, standard=${standard}, detailed=${detailed}, no-tier=${noTier}`);
        console.log(`     Fields: ${questions.map(q => q.field_name).join(', ')}`);
      }
    } else {
      console.log(`\n  ❌ ${slug} - NOT FOUND IN DATABASE`);
    }
  }
  
  console.log('\n================================');
  console.log('🔍 DIAGNOSTIC COMPLETE');
}

// Export for use
diagnoseDatabase();
