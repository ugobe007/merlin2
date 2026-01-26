#!/usr/bin/env node
/**
 * BUTTON MAPPING AUDIT - Jan 26, 2026
 * Audits all industries to find button/question mapping mismatches
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read Step3Integration.tsx to extract field mappings
const step3Integration = fs.readFileSync('./src/components/wizard/Step3Integration.tsx', 'utf8');

// Parse field mappings from Step3Integration.tsx
function extractCodeMappings() {
  const mappings = {};
  
  // Extract patterns like: answers.fieldName
  const regex = /answers\.(\w+)/g;
  let match;
  const allFields = new Set();
  
  while ((match = regex.exec(step3Integration)) !== null) {
    allFields.add(match[1]);
  }
  
  return Array.from(allFields).sort();
}

async function auditIndustry(industrySlug, industryName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`INDUSTRY: ${industryName} (${industrySlug})`);
  console.log('='.repeat(80));
  
  // Get all questions for this industry
  const { data: useCase } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', industrySlug)
    .single();
  
  if (!useCase) {
    console.log(`⚠️  Industry not found in database`);
    return { slug: industrySlug, name: industryName, status: 'NOT_FOUND', issues: [] };
  }
  
  const { data: questions } = await supabase
    .from('custom_questions')
    .select('*')
    .eq('use_case_id', useCase.id)
    .order('sort_order');
  
  if (!questions || questions.length === 0) {
    console.log(`⚠️  No questions found`);
    return { slug: industrySlug, name: industryName, status: 'NO_QUESTIONS', issues: [] };
  }
  
  console.log(`📝 Total questions: ${questions.length}`);
  
  const issues = [];
  const buttonQuestions = questions.filter(q => 
    q.question_type && (
      q.question_type.includes('button') || 
      q.question_type.includes('radio') || 
      q.question_type.includes('select')
    )
  );
  
  console.log(`🔘 Button-type questions: ${buttonQuestions.length}`);
  
  // Check each button question
  for (const q of buttonQuestions) {
    const fieldName = q.field_name;
    const hasMapping = step3Integration.includes(`answers.${fieldName}`);
    
    console.log(`\n  Field: ${fieldName}`);
    console.log(`    Type: ${q.question_type}`);
    console.log(`    Required: ${q.is_required ? '✅' : '❌'}`);
    console.log(`    Mapped in Code: ${hasMapping ? '✅' : '❌ MISSING'}`);
    
    if (!hasMapping) {
      issues.push({
        field: fieldName,
        type: q.question_type,
        required: q.is_required,
        problem: 'Field not mapped in Step3Integration.tsx'
      });
    }
  }
  
  // List all field names for reference
  console.log(`\n  All field names in database:`);
  questions.forEach(q => {
    console.log(`    - ${q.field_name} (${q.question_type})`);
  });
  
  return {
    slug: industrySlug,
    name: industryName,
    status: issues.length === 0 ? 'OK' : 'HAS_ISSUES',
    totalQuestions: questions.length,
    buttonQuestions: buttonQuestions.length,
    issues
  };
}

async function main() {
  console.log('🔍 BUTTON MAPPING AUDIT - ALL INDUSTRIES');
  console.log('='.repeat(80));
  console.log('Checking for field name mismatches between database and Step3Integration.tsx\n');
  
  // Get all active industries
  const { data: industries } = await supabase
    .from('use_cases')
    .select('slug, name')
    .eq('is_active', true)
    .order('slug');
  
  if (!industries) {
    console.error('❌ Could not fetch industries');
    process.exit(1);
  }
  
  console.log(`📊 Found ${industries.length} active industries\n`);
  
  const results = [];
  
  for (const industry of industries) {
    const result = await auditIndustry(industry.slug, industry.name);
    results.push(result);
  }
  
  // Summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('AUDIT SUMMARY');
  console.log('='.repeat(80));
  
  const withIssues = results.filter(r => r.status === 'HAS_ISSUES');
  const ok = results.filter(r => r.status === 'OK');
  const notFound = results.filter(r => r.status === 'NOT_FOUND' || r.status === 'NO_QUESTIONS');
  
  console.log(`\n✅ OK: ${ok.length} industries`);
  ok.forEach(r => console.log(`   - ${r.name} (${r.slug})`));
  
  console.log(`\n❌ ISSUES FOUND: ${withIssues.length} industries`);
  withIssues.forEach(r => {
    console.log(`   - ${r.name} (${r.slug}): ${r.issues.length} unmapped fields`);
    r.issues.forEach(issue => {
      console.log(`      • ${issue.field} (${issue.type}) ${issue.required ? '[REQUIRED]' : ''}`);
    });
  });
  
  if (notFound.length > 0) {
    console.log(`\n⚠️  SKIPPED: ${notFound.length} industries`);
    notFound.forEach(r => console.log(`   - ${r.name} (${r.slug}): ${r.status}`));
  }
  
  // Field names in code but maybe not used
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('FIELDS REFERENCED IN CODE');
  console.log('='.repeat(80));
  const codeMappings = extractCodeMappings();
  console.log(`Total field names found in Step3Integration.tsx: ${codeMappings.length}`);
  console.log(codeMappings.join(', '));
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      ok: ok.length,
      withIssues: withIssues.length,
      notFound: notFound.length
    },
    results,
    codeFieldNames: codeMappings
  };
  
  fs.writeFileSync('./button_mapping_audit_report.json', JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed report saved to: button_mapping_audit_report.json`);
  
  if (withIssues.length > 0) {
    console.log(`\n⚠️  ACTION REQUIRED: Fix ${withIssues.length} industries with mapping issues`);
    process.exit(1);
  } else {
    console.log(`\n✅ All industries have proper button mappings`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
