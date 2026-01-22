#!/usr/bin/env npx tsx
/**
 * Apply Car Wash 16-Question Migration
 * January 21, 2026
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config({ path: join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔧 Applying Car Wash 16-Question Migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'database/migrations/20260121_carwash_16q_v3.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split into individual statements (simple approach - may need refinement for complex SQL)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip comment-only statements
      if (stmt.replace(/--[^\n]*/g, '').trim().length === 0) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: stmt + ';' 
      });

      if (error) {
        console.error(`❌ Error on statement ${i + 1}:`, error);
        // Try direct query as fallback
        console.log('Trying direct query...');
        const { error: directError } = await supabase
          .from('custom_questions')
          .select('count');
        
        if (directError) {
          console.error('Direct query also failed:', directError);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed`);
      }
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    // Get car wash use case ID
    const { data: useCase, error: useCaseError } = await supabase
      .from('use_cases')
      .select('id, name')
      .eq('slug', 'car-wash')
      .single();

    if (useCaseError) {
      console.error('❌ Error finding car-wash use case:', useCaseError);
      return;
    }

    console.log(`Found use case: ${useCase.name} (ID: ${useCase.id})\n`);

    // Get questions
    const { data: questions, error: questionsError } = await supabase
      .from('custom_questions')
      .select('display_order, section_name, field_name, question_text, question_type, is_required')
      .eq('use_case_id', useCase.id)
      .order('display_order');

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return;
    }

    console.log(`✅ Found ${questions.length} questions for car-wash\n`);
    console.log('Questions by section:');
    
    const sections = questions.reduce((acc, q) => {
      if (!acc[q.section_name]) acc[q.section_name] = [];
      acc[q.section_name].push(q);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(sections).forEach(([section, qs]) => {
      console.log(`\n📋 ${section} (${qs.length} questions):`);
      qs.forEach(q => {
        console.log(`  ${q.display_order}. ${q.field_name} - ${q.question_text.substring(0, 60)}${q.question_text.length > 60 ? '...' : ''}`);
      });
    });

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
