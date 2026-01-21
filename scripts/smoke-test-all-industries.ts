#!/usr/bin/env tsx
/**
 * Smoke Test Script - All 21 Industries
 * Tests Step 3 validity tracking across all use cases
 * 
 * Usage: npx tsx scripts/smoke-test-all-industries.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Industry {
  id: string;
  slug: string;
  name: string;
  category: string;
  tier: string;
  is_active: boolean;
}

interface Question {
  id: string;
  use_case_id: string;
  field_name: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  question_tier: string;
  section_name: string;
}

interface TestResult {
  industry: string;
  slug: string;
  passed: boolean;
  totalQuestions: number;
  requiredQuestions: number;
  essentialQuestions: number;
  errors: string[];
  warnings: string[];
}

async function getAllIndustries(): Promise<Industry[]> {
  const { data, error } = await supabase
    .from('use_cases')
    .select('id, slug, name, category, tier, is_active')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('❌ Failed to fetch industries:', error);
    throw error;
  }

  return data || [];
}

async function getQuestionsForIndustry(useCaseId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('custom_questions')
    .select('*')
    .eq('use_case_id', useCaseId)
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error(`❌ Failed to fetch questions for ${useCaseId}:`, error);
    return [];
  }

  return data || [];
}

function validateQuestions(industry: Industry, questions: Question[]): TestResult {
  const result: TestResult = {
    industry: industry.name,
    slug: industry.slug,
    passed: true,
    totalQuestions: questions.length,
    requiredQuestions: questions.filter(q => q.is_required).length,
    essentialQuestions: questions.filter(q => q.question_tier === 'essential').length,
    errors: [],
    warnings: [],
  };

  // TEST 1: Industry must have questions
  if (questions.length === 0) {
    result.errors.push('No questions found in database');
    result.passed = false;
  }

  // TEST 2: Must have at least 3 essential questions
  if (result.essentialQuestions < 3) {
    result.errors.push(`Only ${result.essentialQuestions} essential questions (need ≥3 for 70% validation)`);
    result.passed = false;
  }

  // TEST 3: Check for required field_name for each question
  const missingFieldNames = questions.filter(q => !q.field_name);
  if (missingFieldNames.length > 0) {
    result.errors.push(`${missingFieldNames.length} questions missing field_name`);
    result.passed = false;
  }

  // TEST 4: Check for duplicate field_names
  const fieldNames = questions.map(q => q.field_name).filter(Boolean);
  const duplicates = fieldNames.filter((name, idx) => fieldNames.indexOf(name) !== idx);
  if (duplicates.length > 0) {
    result.warnings.push(`Duplicate field_names: ${[...new Set(duplicates)].join(', ')}`);
  }

  // TEST 5: Validate question types
  const validTypes = ['text', 'number', 'select', 'multiselect', 'boolean', 'slider', 'range', 'date', 'time', 'currency', 'percentage', 'textarea'];
  const invalidTypes = questions.filter(q => !validTypes.includes(q.question_type));
  if (invalidTypes.length > 0) {
    result.warnings.push(`${invalidTypes.length} questions with invalid types`);
  }

  // TEST 6: Check tier distribution
  const tiers = {
    essential: questions.filter(q => q.question_tier === 'essential').length,
    standard: questions.filter(q => q.question_tier === 'standard').length,
    detailed: questions.filter(q => q.question_tier === 'detailed').length,
    unset: questions.filter(q => !q.question_tier).length,
  };

  if (tiers.unset > 0) {
    result.warnings.push(`${tiers.unset} questions missing tier classification`);
  }

  // TEST 7: Industry-specific anchor field checks
  const anchorFields = {
    'hotel': ['roomCount', 'numberOfRooms'],
    'car-wash': ['bayCount', 'numberOfBays'],
    'data-center': ['rackCount'],
    'hospital': ['bedCount'],
    'warehouse': ['squareFootage', 'warehouseSqFt'],
    'manufacturing': ['squareFootage'],
    'retail': ['squareFootage'],
    'office': ['squareFootage'],
  };

  const normalizedSlug = industry.slug.replace(/_/g, '-');
  const expectedAnchors = anchorFields[normalizedSlug as keyof typeof anchorFields];
  
  if (expectedAnchors) {
    const hasAnchor = expectedAnchors.some(anchor => 
      questions.some(q => q.field_name === anchor)
    );
    
    if (!hasAnchor) {
      result.warnings.push(`Missing expected anchor field(s): ${expectedAnchors.join(' or ')}`);
    }
  }

  return result;
}

async function runSmokeTests() {
  console.log('🧪 SMOKE TEST: All Industries - Step 3 Validity Tracking\n');
  console.log('═'.repeat(80));
  console.log('Testing: Question loading, required fields, tier classification');
  console.log('Target: All 21 active industries');
  console.log('═'.repeat(80));
  console.log('');

  const industries = await getAllIndustries();
  console.log(`📊 Found ${industries.length} active industries\n`);

  const results: TestResult[] = [];
  let passCount = 0;
  let failCount = 0;

  for (const industry of industries) {
    process.stdout.write(`Testing ${industry.name.padEnd(30)} ... `);
    
    const questions = await getQuestionsForIndustry(industry.id);
    const result = validateQuestions(industry, questions);
    results.push(result);

    if (result.passed) {
      console.log(`✅ PASS (${result.totalQuestions} questions, ${result.essentialQuestions} essential)`);
      passCount++;
    } else {
      console.log(`❌ FAIL`);
      failCount++;
    }

    // Show errors immediately
    if (result.errors.length > 0) {
      result.errors.forEach(err => console.log(`   └─ 🔴 ${err}`));
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total Tested: ${industries.length}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('');

  // Show detailed warnings for passing tests
  const warningsExist = results.some(r => r.warnings.length > 0);
  if (warningsExist) {
    console.log('⚠️  WARNINGS (non-critical):');
    console.log('─'.repeat(80));
    results.forEach(r => {
      if (r.warnings.length > 0 && r.passed) {
        console.log(`\n${r.industry}:`);
        r.warnings.forEach(warn => console.log(`  • ${warn}`));
      }
    });
    console.log('');
  }

  // Show detailed errors for failed tests
  if (failCount > 0) {
    console.log('🔴 FAILED TESTS - REQUIRES IMMEDIATE ATTENTION:');
    console.log('─'.repeat(80));
    results.forEach(r => {
      if (!r.passed) {
        console.log(`\n${r.industry} (${r.slug}):`);
        r.errors.forEach(err => console.log(`  ❌ ${err}`));
        if (r.warnings.length > 0) {
          r.warnings.forEach(warn => console.log(`  ⚠️  ${warn}`));
        }
        console.log(`  Stats: ${r.totalQuestions} total, ${r.essentialQuestions} essential, ${r.requiredQuestions} required`);
      }
    });
    console.log('');
  }

  // Industry tier breakdown
  console.log('📊 TIER BREAKDOWN:');
  console.log('─'.repeat(80));
  const tierCounts = {
    FREE: industries.filter(i => i.tier === 'FREE').length,
    PREMIUM: industries.filter(i => i.tier === 'PREMIUM').length,
  };
  console.log(`FREE Tier: ${tierCounts.FREE} industries`);
  console.log(`PREMIUM Tier: ${tierCounts.PREMIUM} industries`);
  console.log('');

  // Question statistics
  const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
  const totalEssential = results.reduce((sum, r) => sum + r.essentialQuestions, 0);
  const avgQuestionsPerIndustry = Math.round(totalQuestions / results.length);
  const avgEssentialPerIndustry = Math.round(totalEssential / results.length);

  console.log('📈 QUESTION STATISTICS:');
  console.log('─'.repeat(80));
  console.log(`Total Questions Across All Industries: ${totalQuestions}`);
  console.log(`Total Essential Questions: ${totalEssential}`);
  console.log(`Average Questions per Industry: ${avgQuestionsPerIndustry}`);
  console.log(`Average Essential per Industry: ${avgEssentialPerIndustry}`);
  console.log('');

  // Validity threshold check
  console.log('🎯 VALIDITY THRESHOLD CHECK (70% of essential required):');
  console.log('─'.repeat(80));
  results.forEach(r => {
    if (r.essentialQuestions > 0) {
      const threshold = Math.ceil(r.essentialQuestions * 0.7);
      const status = threshold >= 3 ? '✅' : '⚠️ ';
      console.log(`${status} ${r.industry.padEnd(30)} needs ${threshold}/${r.essentialQuestions} essential answered`);
    }
  });
  console.log('');

  // Exit code
  if (failCount > 0) {
    console.log('❌ SMOKE TESTS FAILED - Do NOT deploy until fixed!');
    process.exit(1);
  } else {
    console.log('✅ ALL SMOKE TESTS PASSED - Ready for manual testing');
    process.exit(0);
  }
}

runSmokeTests().catch(err => {
  console.error('\n💥 FATAL ERROR:', err);
  process.exit(1);
});
