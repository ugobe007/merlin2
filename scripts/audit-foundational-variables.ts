/**
 * Audit Script: Foundational Variables by Industry
 * 
 * Verifies that each industry has its critical foundational variables
 * properly configured in the database and mapped in code.
 * 
 * Usage: npx tsx scripts/audit-foundational-variables.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables - dotenv will try .env, .env.local automatically
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Foundational variables by industry (from docs/FOUNDATIONAL_VARIABLES_BY_INDUSTRY.md)
const FOUNDATIONAL_VARIABLES: Record<string, string[]> = {
  'hotel': ['roomCount'],
  'car-wash': ['bayCount', 'tunnelCount'],
  'data-center': ['rackCount', 'itLoadKW'],
  'hospital': ['bedCount'],
  'ev-charging': ['level2Count', 'dcFastCount', 'ultraFastCount'],
  'apartment': ['unitCount'],
  'warehouse': ['warehouseSqFt', 'squareFeet'],
  'manufacturing': ['facilitySqFt', 'squareFeet'],
  'retail': ['storeSqFt', 'squareFeet'],
  'office': ['buildingSqFt', 'squareFeet'],
  'restaurant': ['squareFeet', 'restaurantSqFt'],
  'cold-storage': ['storageVolume', 'squareFeet'],
  'casino': ['gamingFloorSize', 'gamingFloorSqFt'],
  'indoor-farm': ['growingAreaSqFt', 'squareFeet'],
  'airport': ['annualPassengers'],
  'college': ['studentEnrollment', 'studentCount'],
  'government': ['buildingSqFt', 'facilitySqFt'],
  'shopping-center': ['totalSqFt', 'retailSqFt'],
};

interface AuditResult {
  industry: string;
  useCaseId: string | null;
  foundationalFields: string[];
  foundFields: string[];
  missingFields: string[];
  questions: Array<{
    field_name: string;
    question_text: string;
    is_required: boolean;
    default_value: string | null;
    display_order: number;
  }>;
  status: '✅ PASS' | '⚠️ PARTIAL' | '❌ FAIL';
}

async function auditIndustry(industrySlug: string): Promise<AuditResult> {
  // Get use case ID
  const { data: useCase, error: useCaseError } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', industrySlug)
    .single();

  if (useCaseError || !useCase) {
    return {
      industry: industrySlug,
      useCaseId: null,
      foundationalFields: FOUNDATIONAL_VARIABLES[industrySlug] || [],
      foundFields: [],
      missingFields: FOUNDATIONAL_VARIABLES[industrySlug] || [],
      questions: [],
      status: '❌ FAIL',
    };
  }

  // Get all questions for this use case
  const { data: questions, error: questionsError } = await supabase
    .from('custom_questions')
    .select('field_name, question_text, is_required, default_value, display_order')
    .eq('use_case_id', useCase.id)
    .order('display_order', { ascending: true });

  if (questionsError) {
    console.error(`Error fetching questions for ${industrySlug}:`, questionsError);
    return {
      industry: industrySlug,
      useCaseId: useCase.id,
      foundationalFields: FOUNDATIONAL_VARIABLES[industrySlug] || [],
      foundFields: [],
      missingFields: FOUNDATIONAL_VARIABLES[industrySlug] || [],
      questions: [],
      status: '❌ FAIL',
    };
  }

  const foundationalFields = FOUNDATIONAL_VARIABLES[industrySlug] || [];
  const questionFields = (questions || []).map(q => q.field_name);
  
  // Check which foundational fields are found
  const foundFields = foundationalFields.filter(field => 
    questionFields.includes(field)
  );
  const missingFields = foundationalFields.filter(field => 
    !questionFields.includes(field)
  );

  // Determine status
  let status: '✅ PASS' | '⚠️ PARTIAL' | '❌ FAIL';
  if (foundFields.length === foundationalFields.length) {
    status = '✅ PASS';
  } else if (foundFields.length > 0) {
    status = '⚠️ PARTIAL';
  } else {
    status = '❌ FAIL';
  }

  // Find questions for foundational fields
  const foundationalQuestions = (questions || []).filter(q =>
    foundationalFields.includes(q.field_name)
  );

  return {
    industry: industrySlug,
    useCaseId: useCase.id,
    foundationalFields,
    foundFields,
    missingFields,
    questions: foundationalQuestions.map(q => ({
      field_name: q.field_name,
      question_text: q.question_text,
      is_required: q.is_required,
      default_value: q.default_value,
      display_order: q.display_order,
    })),
    status,
  };
}

async function main() {
  console.log('🔍 Auditing Foundational Variables by Industry\n');
  console.log('=' .repeat(80));

  const industries = Object.keys(FOUNDATIONAL_VARIABLES);
  const results: AuditResult[] = [];

  for (const industry of industries) {
    const result = await auditIndustry(industry);
    results.push(result);

    // Print result
    console.log(`\n📊 ${industry.toUpperCase()}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Foundational Fields: ${result.foundationalFields.join(', ')}`);
    
    if (result.foundFields.length > 0) {
      console.log(`   ✅ Found: ${result.foundFields.join(', ')}`);
      result.questions.forEach(q => {
        console.log(`      - ${q.field_name} (${q.question_text})`);
        console.log(`        Required: ${q.is_required}, Default: ${q.default_value || 'none'}, Order: ${q.display_order}`);
      });
    }
    
    if (result.missingFields.length > 0) {
      console.log(`   ❌ Missing: ${result.missingFields.join(', ')}`);
    }
    
    if (result.status === '❌ FAIL' && !result.useCaseId) {
      console.log(`   ⚠️  Use case not found in database`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 SUMMARY\n');
  
  const passCount = results.filter(r => r.status === '✅ PASS').length;
  const partialCount = results.filter(r => r.status === '⚠️ PARTIAL').length;
  const failCount = results.filter(r => r.status === '❌ FAIL').length;

  console.log(`✅ PASS: ${passCount}/${industries.length}`);
  console.log(`⚠️  PARTIAL: ${partialCount}/${industries.length}`);
  console.log(`❌ FAIL: ${failCount}/${industries.length}`);

  // List failures
  const failures = results.filter(r => r.status === '❌ FAIL');
  if (failures.length > 0) {
    console.log('\n❌ INDUSTRIES WITH MISSING FOUNDATIONAL VARIABLES:\n');
    failures.forEach(f => {
      console.log(`   ${f.industry}: Missing ${f.missingFields.join(', ')}`);
    });
  }

  // List partial matches
  const partials = results.filter(r => r.status === '⚠️ PARTIAL');
  if (partials.length > 0) {
    console.log('\n⚠️  INDUSTRIES WITH PARTIAL COVERAGE:\n');
    partials.forEach(p => {
      console.log(`   ${p.industry}:`);
      console.log(`      Found: ${p.foundFields.join(', ')}`);
      console.log(`      Missing: ${p.missingFields.join(', ')}`);
    });
  }
}

main().catch(console.error);
