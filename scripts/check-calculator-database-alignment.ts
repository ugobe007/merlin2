/**
 * Check Calculator-Database Field Alignment
 * 
 * Verifies that WizardV7 calculator registry field expectations
 * match what's actually in the database custom_questions table.
 * 
 * TrueQuote Policy: Database fields are source of truth,
 * calculators must adapt to database schema.
 */

import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// What the calculator registry expects (from registry.ts)
const CALCULATOR_EXPECTATIONS: Record<string, string[]> = {
  'car-wash': [
    'bay_count', 'tunnel_count', 'cars_per_day', 'operating_hours',
    'dryer_kw', 'vacuum_count', 'vacuum_kw_each', 'ro_system_present'
  ],
  'data-center': [
    'it_load_kw', 'peak_it_load_kw', 'pue', 'avg_utilization_pct',
    'cooling_peak_kw', 'tier'
  ],
  'hotel': [
    'room_count', 'occupancy_avg_pct', 'occupancy_peak_pct',
    'conference_sqft', 'pool_on_site', 'restaurant_on_site',
    'spa_on_site', 'laundry_on_site', 'bar_on_site',
    'has_electric_hot_water', 'kitchen_type'
  ],
};

async function checkAlignment() {
  console.log('🔍 Checking Calculator-Database Field Alignment\n');
  console.log('='.repeat(80));
  
  for (const [industrySlug, expectedFields] of Object.entries(CALCULATOR_EXPECTATIONS)) {
    console.log(`\n📋 ${industrySlug.toUpperCase()}`);
    console.log('-'.repeat(80));
    
    // Get use case ID
    const { data: useCase, error: ucError } = await supabase
      .from('use_cases')
      .select('id, name')
      .eq('slug', industrySlug)
      .single();
    
    if (ucError || !useCase) {
      console.log(`  ❌ Use case not found in database`);
      continue;
    }
    
    // Get actual database fields
    const { data: questions, error: qError } = await supabase
      .from('custom_questions')
      .select('field_name')
      .eq('use_case_id', useCase.id);
    
    if (qError) {
      console.log(`  ❌ Error fetching questions: ${qError.message}`);
      continue;
    }
    
    const dbFields = new Set(questions?.map(q => q.field_name) || []);
    
    console.log(`  Database has ${dbFields.size} fields`);
    console.log(`  Calculator expects ${expectedFields.length} fields`);
    
    // Check each expected field
    const missing: string[] = [];
    const found: string[] = [];
    
    for (const field of expectedFields) {
      if (dbFields.has(field)) {
        found.push(field);
      } else {
        missing.push(field);
      }
    }
    
    // Check for extra database fields not used by calculator
    const extra = Array.from(dbFields).filter(f => !expectedFields.includes(f));
    
    if (missing.length === 0 && extra.length === 0) {
      console.log(`  ✅ PERFECT ALIGNMENT`);
    } else {
      if (missing.length > 0) {
        console.log(`\n  ❌ MISSING IN DATABASE (${missing.length}):`);
        missing.forEach(f => console.log(`     - ${f}`));
      }
      
      if (extra.length > 0) {
        console.log(`\n  ⚠️  IN DATABASE BUT NOT USED BY CALCULATOR (${extra.length}):`);
        extra.forEach(f => console.log(`     - ${f}`));
      }
      
      if (found.length > 0) {
        console.log(`\n  ✅ MATCHED (${found.length}):`);
        found.forEach(f => console.log(`     - ${f}`));
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 TrueQuote Policy:');
  console.log('   - Database fields are source of truth');
  console.log('   - Calculators must use actual database field names');
  console.log('   - Missing fields = add to database OR make optional in calculator');
  console.log('   - Extra fields = calculator should use them OR mark as optional in DB');
}

checkAlignment().then(() => process.exit(0));
