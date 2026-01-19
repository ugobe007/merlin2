/**
 * Fix display_order duplicates for ALL industries
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://fvmpmozybmtzjvikrctq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0'
);

async function runMigration() {
  console.log('Starting display_order migration...\n');
  
  // Read the migration file
  const migrationSQL = fs.readFileSync('database/migrations/20260119_fix_all_industries.sql', 'utf8');
  
  // Parse individual UPDATE statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.startsWith('UPDATE'));
  
  console.log(`Found ${statements.length} UPDATE statements\n`);
  
  let success = 0;
  let failed = 0;
  let currentSlug = '';
  
  for (const stmt of statements) {
    // Extract values from the SQL
    const fieldMatch = stmt.match(/field_name = '([^']+)'/);
    const slugMatch = stmt.match(/slug = '([^']+)'/);
    const orderMatch = stmt.match(/display_order = (\d+)/);
    const sectionMatch = stmt.match(/section_name = '([^']+)'/);
    
    if (!fieldMatch || !slugMatch || !orderMatch) {
      console.log(`⚠️  Could not parse statement: ${stmt.substring(0, 100)}...`);
      failed++;
      continue;
    }
    
    const slug = slugMatch[1];
    const fieldName = fieldMatch[1];
    const displayOrder = parseInt(orderMatch[1]);
    const sectionName = sectionMatch ? sectionMatch[1] : null;
    
    // Log progress by industry
    if (slug !== currentSlug) {
      if (currentSlug) console.log('');
      console.log(`🏭 Processing: ${slug}`);
      currentSlug = slug;
    }
    
    // Get use case ID
    const { data: useCase, error: ucError } = await supabase
      .from('use_cases')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (ucError || !useCase) {
      console.log(`   ❌ ${fieldName}: Use case not found`);
      failed++;
      continue;
    }
    
    // Prepare update object
    const updateObj = { display_order: displayOrder };
    if (sectionName) {
      updateObj.section_name = sectionName;
    }
    
    // Update the question
    const { error: updateError, count } = await supabase
      .from('custom_questions')
      .update(updateObj)
      .eq('field_name', fieldName)
      .eq('use_case_id', useCase.id);
    
    if (updateError) {
      console.log(`   ❌ ${fieldName}: ${updateError.message}`);
      failed++;
    } else {
      process.stdout.write('.');
      success++;
    }
  }
  
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`✅ Successful: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total: ${success + failed}`);
}

runMigration().catch(console.error);
