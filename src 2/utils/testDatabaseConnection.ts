import { supabase } from '../services/supabaseClient';

export async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  // Test 1: Check calculation_formulas table
  const { data: formulas, error: formulaError } = await supabase
    .from('calculation_formulas')
    .select('formula_key, variables, formula_name')
    .limit(10);

  console.log('\n📊 Calculation Formulas:');
  console.log('Count:', formulas?.length || 0);
  console.log('Error:', formulaError);
  if (formulas && formulas.length > 0) {
    formulas.forEach(f => {
      console.log(`  - ${f.formula_key}: ${f.variables?.value || 'N/A'}`);
    });
  }

  // Test 2: Check use_cases table
  const { data: useCases, error: useCaseError } = await supabase
    .from('use_cases')
    .select('slug, name')
    .limit(5);

  console.log('\n🏢 Use Cases:');
  console.log('Count:', useCases?.length || 0);
  console.log('Error:', useCaseError);
  
  return {
    formulas: formulas?.length || 0,
    useCases: useCases?.length || 0,
    hasFormulas: (formulas?.length || 0) > 0,
    hasUseCases: (useCases?.length || 0) > 0
  };
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  (window as any).testDB = testDatabaseConnection;
}
