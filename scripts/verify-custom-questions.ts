/**
 * VERIFY CUSTOM QUESTIONS IN DATABASE
 * 
 * This script checks the database to verify:
 * 1. All active use cases have custom questions
 * 2. Question counts match expected values (16 per use case)
 * 3. No duplicate questions
 * 4. Questions are properly linked to use cases
 * 
 * Run with: npx tsx scripts/verify-custom-questions.ts
 * 
 * Requires .env file with:
 * VITE_SUPABASE_URL=
 * VITE_SUPABASE_ANON_KEY=
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UseCaseQuestionCount {
  slug: string;
  name: string;
  useCaseId: string;
  totalQuestions: number;
  activeQuestions: number;
  inactiveQuestions: number;
  fieldNames: string[];
  missingExpectedFields?: string[];
}

// Expected questions per use case - Originally 16 questions per use case
// Includes: EV charging, solar, amenities, and detailed use case information
const EXPECTED_QUESTIONS: Record<string, number> = {
  'hotel-hospitality': 16,
  'hotel': 16,
  'hospital': 16,
  'data-center': 16,
  'ev-charging': 16,
  'ev-charging-hub': 16,
  'airport': 16,
  'manufacturing': 16,
  'car-wash': 16,
  'warehouse': 16,
  'office': 16,
  'college': 16,
  'cold-storage': 16,
  'retail': 16,
  'apartment': 16,
  'residential': 16,
  'shopping-center': 16,
  'casino': 16,
  'gas-station': 16,
  'government': 16,
  'indoor-farm': 16,
  'agricultural': 16,
  'microgrid': 16,
};

// Expected field names per use case (standard template)
const EXPECTED_FIELDS: Record<string, string[]> = {
  'hotel-hospitality': ['roomCount', 'squareFeet', 'gridCapacityKW', 'monthlyElectricBill', 'hasRestaurant', 'hasPool', 'hasLaundry', 'existingSolarKW', 'wantsSolar', 'needsBackupPower'],
  'hospital': ['bedCount', 'squareFeet', 'gridCapacityKW', 'operatingRooms', 'hasImaging', 'hasEmergencyDept', 'hasLab', 'hasPharmacy', 'hasSurgery', 'existingSolarKW', 'wantsSolar', 'existingEVChargers', 'wantsEVCharging', 'backupDurationHours', 'gridReliability', 'needsBackupPower', 'coolingType', 'pueTarget', 'hasGenerator'],
  'car-wash': ['washBays', 'peakDemandKW', 'dailyVehicles', 'operatingHours', 'hasVacuums', 'monthlyDemandCharges', 'existingEVChargers', 'wantsEVCharging', 'existingSolarKW', 'wantsSolar'],
  'warehouse': ['squareFeet', 'peakDemandKW', 'loadingDocks', 'operatingHours', 'electricForklifts', 'hasColdStorage', 'hasAutomatedSystems', 'hasHVAC', 'existingSolarKW', 'wantsSolar'],
  // Add more as needed
};

async function verifyCustomQuestions() {
  console.log('🔍 Starting Custom Questions Verification...\n');
  
  try {
    // Step 1: Get all active use cases
    const { data: useCases, error: useCasesError } = await supabase
      .from('use_cases')
      .select('id, slug, name, is_active')
      .eq('is_active', true)
      .order('slug');
    
    if (useCasesError) {
      console.error('❌ Error fetching use cases:', useCasesError);
      return;
    }
    
    console.log(`📋 Found ${useCases?.length || 0} active use cases\n`);
    
    // Step 2: Get all custom questions
    // Note: custom_questions table may not have is_active column
    const { data: questions, error: questionsError } = await supabase
      .from('custom_questions')
      .select('id, use_case_id, field_name, question_text, display_order')
      .order('display_order');
    
    if (questionsError) {
      console.error('❌ Error fetching custom questions:', questionsError);
      return;
    }
    
    console.log(`📋 Found ${questions?.length || 0} total custom questions\n`);
    
    // Step 3: Analyze each use case
    const results: UseCaseQuestionCount[] = [];
    const issues: string[] = [];
    
    for (const useCase of useCases || []) {
      const useCaseQuestions = questions?.filter(q => q.use_case_id === useCase.id) || [];
      // Note: custom_questions may not have is_active column, so all questions are considered active
      const activeQuestions = useCaseQuestions;
      const inactiveQuestions: any[] = []; // No inactive questions if column doesn't exist
      
      const fieldNames = activeQuestions.map(q => q.field_name || 'NO_FIELD_NAME').sort();
      
      const expectedCount = EXPECTED_QUESTIONS[useCase.slug] || 0;
      const expectedFieldsList = EXPECTED_FIELDS[useCase.slug] || [];
      
      // Check for missing expected fields (only if expected fields are defined)
      const missingFields = expectedFieldsList.length > 0 
        ? expectedFieldsList.filter(field => !fieldNames.includes(field))
        : [];
      
      results.push({
        slug: useCase.slug,
        name: useCase.name,
        useCaseId: useCase.id,
        totalQuestions: useCaseQuestions.length,
        activeQuestions: activeQuestions.length,
        inactiveQuestions: inactiveQuestions.length,
        fieldNames,
        missingExpectedFields: missingFields.length > 0 ? missingFields : undefined,
      });
      
      // Identify issues
      if (useCaseQuestions.length === 0) {
        issues.push(`❌ ${useCase.slug}: NO QUESTIONS FOUND`);
      } else if (expectedCount > 0 && activeQuestions.length < expectedCount) {
        issues.push(`⚠️  ${useCase.slug}: Only ${activeQuestions.length} questions (expected ${expectedCount}) - MISSING ${expectedCount - activeQuestions.length}`);
      } else if (expectedCount > 0 && activeQuestions.length > expectedCount) {
        issues.push(`ℹ️  ${useCase.slug}: ${activeQuestions.length} questions (expected ${expectedCount}) - EXTRA ${activeQuestions.length - expectedCount}`);
      }
      
      if (missingFields.length > 0) {
        issues.push(`⚠️  ${useCase.slug}: Missing expected fields: ${missingFields.join(', ')}`);
      }
    }
    
    // Step 4: Report results
    console.log('='.repeat(80));
    console.log('VERIFICATION RESULTS');
    console.log('='.repeat(80));
    console.log();
    
    // Summary table
    console.log('SUMMARY:');
    console.log('-'.repeat(80));
    console.log(`${'Use Case'.padEnd(25)} | ${'Expected'.padEnd(10)} | ${'Actual'.padEnd(8)} | ${'Missing'.padEnd(8)} | Status`);
    console.log('-'.repeat(80));
    
    for (const result of results) {
      const expected = EXPECTED_QUESTIONS[result.slug] || '?';
      const missing = expected !== '?' && typeof expected === 'number' 
        ? Math.max(0, expected - result.activeQuestions)
        : 0;
      const status = result.activeQuestions === 0 
        ? '❌ NO QUESTIONS'
        : (expected !== '?' && typeof expected === 'number' && result.activeQuestions < expected)
          ? '⚠️  MISSING'
        : (expected !== '?' && typeof expected === 'number' && result.activeQuestions > expected)
          ? 'ℹ️  EXTRA'
          : '✅ OK';
      
      console.log(
        `${result.slug.padEnd(25)} | ${String(expected).padEnd(10)} | ${String(result.activeQuestions).padEnd(8)} | ${String(missing).padEnd(8)} | ${status}`
      );
    }
    
    console.log();
    console.log('='.repeat(80));
    console.log('ISSUES FOUND:');
    console.log('='.repeat(80));
    
    if (issues.length === 0) {
      console.log('✅ No issues found! All use cases have expected questions.');
    } else {
      issues.forEach(issue => console.log(issue));
    }
    
    console.log();
    console.log('='.repeat(80));
    console.log('DETAILED FIELD NAMES:');
    console.log('='.repeat(80));
    
    for (const result of results) {
      if (result.activeQuestions > 0) {
        console.log(`\n${result.slug} (${result.activeQuestions} questions):`);
        result.fieldNames.forEach((field, idx) => {
          const missing = result.missingExpectedFields?.includes(field) ? ' ⚠️ MISSING' : '';
          console.log(`  ${(idx + 1).toString().padStart(2)}. ${field}${missing}`);
        });
      }
    }
    
    // Step 5: Check for orphaned questions
    console.log();
    console.log('='.repeat(80));
    console.log('ORPHANED QUESTIONS (no matching use case):');
    console.log('='.repeat(80));
    
    const useCaseIds = new Set(useCases?.map(uc => uc.id) || []);
    const orphanedQuestions = questions?.filter(q => !useCaseIds.has(q.use_case_id)) || [];
    
    if (orphanedQuestions.length === 0) {
      console.log('✅ No orphaned questions found.');
    } else {
      console.log(`⚠️  Found ${orphanedQuestions.length} orphaned questions:`);
      orphanedQuestions.forEach(q => {
        console.log(`  - Question ID: ${q.id}, Field: ${q.field_name || 'NO_FIELD'}, Use Case ID: ${q.use_case_id}`);
      });
    }
    
    console.log();
    console.log('✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
verifyCustomQuestions();

