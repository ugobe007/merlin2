/**
 * USE CASE AUDIT SCRIPT v2
 * Queries Supabase to validate all use cases and their configurations
 * Run: node scripts/audit-use-cases.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables from .env manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Expected use cases from copilot-instructions.md (using ACTUAL slugs)
const EXPECTED_USE_CASES = [
  // Core 18 in copilot instructions (adjusted for actual slugs)
  { slug: 'apartment', expected: 'apartment-building', note: 'DB uses "apartment"' },
  { slug: 'car-wash', expected: 'car-wash', note: '✅ Match' },
  { slug: 'warehouse', expected: 'distribution-center', note: 'DB uses "warehouse"' },
  { slug: 'data-center', expected: 'data-center', note: '✅ Match (was edge-data-center)' },
  { slug: 'ev-charging', expected: 'ev-charging', note: '✅ Match' },
  { slug: 'gas-station', expected: 'gas-station', note: '✅ Match' },
  { slug: 'hospital', expected: 'hospital', note: '✅ Match' },
  { slug: 'hotel', expected: 'hotel', note: '✅ Match' },
  { slug: 'hotel-hospitality', expected: 'hotel-hospitality', note: '⚠️ Duplicate of hotel?' },
  { slug: 'indoor-farm', expected: 'indoor-farm', note: '✅ Match' },
  { slug: 'manufacturing', expected: 'manufacturing', note: '✅ Match' },
  { slug: 'microgrid', expected: 'microgrid', note: '✅ Match' },
  { slug: 'office', expected: 'office', note: '✅ Match' },
  { slug: 'government', expected: 'public-building', note: 'DB uses "government"' },
  { slug: 'residential', expected: 'residential', note: '✅ Match' },
  { slug: 'retail', expected: 'retail', note: '✅ Match' },
  { slug: 'shopping-center', expected: 'shopping-center', note: '✅ Match' },
  { slug: 'college', expected: 'university', note: 'DB uses "college"' },
];

async function auditUseCases() {
  console.log('\n🔍 USE CASE AUDIT v2 - Starting...\n');
  console.log('=' .repeat(100));
  
  // 1. Fetch all use cases
  const { data: useCases, error: useCaseError } = await supabase
    .from('use_cases')
    .select('*')
    .order('display_order');
    
  if (useCaseError) {
    console.error('❌ Error fetching use cases:', useCaseError);
    process.exit(1);
  }
  
  console.log(`\n📦 TOTAL USE CASES IN DATABASE: ${useCases.length}\n`);
  
  // 2. Fetch custom questions
  const { data: questions, error: questionsError } = await supabase
    .from('custom_questions')
    .select('use_case_id, id, question_text, question_type, field_name, is_required, default_value')
    .order('use_case_id')
    .order('display_order');
    
  const questionsByUseCase = {};
  if (!questionsError && questions) {
    for (const q of questions) {
      if (!questionsByUseCase[q.use_case_id]) {
        questionsByUseCase[q.use_case_id] = [];
      }
      questionsByUseCase[q.use_case_id].push(q);
    }
  }
  
  // 3. Fetch configurations
  const { data: configs, error: configError } = await supabase
    .from('use_case_configurations')
    .select('use_case_id, config_name, is_default, typical_load_kw, peak_load_kw, recommended_duration_hours')
    .order('use_case_id');
    
  const configsByUseCase = {};
  if (!configError && configs) {
    for (const c of configs) {
      if (!configsByUseCase[c.use_case_id]) {
        configsByUseCase[c.use_case_id] = [];
      }
      configsByUseCase[c.use_case_id].push(c);
    }
  }
  
  // 4. Display all use cases with full details
  console.log('📋 ALL USE CASES WITH DETAILS:');
  console.log('='.repeat(100));
  
  const useCaseMap = {};
  
  for (const uc of useCases) {
    const active = uc.is_active ? '✅' : '❌';
    const slug = uc.slug || '';
    const name = uc.name || '';
    const qs = questionsByUseCase[uc.id] || [];
    const cfgs = configsByUseCase[uc.id] || [];
    
    useCaseMap[slug] = uc;
    
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📁 ${name.padEnd(40)} Slug: ${slug}`);
    console.log(`   Category: ${uc.category || 'N/A'}  |  Tier: ${uc.required_tier || 'FREE'}  |  Active: ${active}`);
    console.log(`   ID: ${uc.id}`);
    
    // Questions
    if (qs.length > 0) {
      console.log(`   📝 Custom Questions (${qs.length}):`);
      for (const q of qs) {
        const required = q.is_required ? '*' : '';
        const defaultVal = q.default_value ? ` [default: ${q.default_value}]` : '';
        console.log(`      • ${q.field_name}${required}: "${q.question_text.substring(0, 50)}" (${q.question_type})${defaultVal}`);
      }
    } else {
      console.log(`   📝 Custom Questions: ⚠️ NONE`);
    }
    
    // Configurations
    if (cfgs.length > 0) {
      console.log(`   ⚙️ Configurations (${cfgs.length}):`);
      for (const c of cfgs) {
        const defaultMark = c.is_default ? ' [DEFAULT]' : '';
        console.log(`      • ${c.config_name}${defaultMark}: ${c.typical_load_kw || '?'} kW typical, ${c.peak_load_kw || '?'} kW peak, ${c.recommended_duration_hours || '?'}h duration`);
      }
    } else {
      console.log(`   ⚙️ Configurations: ⚠️ NONE`);
    }
  }
  
  // 5. Slug mapping check
  console.log('\n\n' + '='.repeat(100));
  console.log('🗺️ SLUG MAPPING CHECK (copilot-instructions.md vs Database):');
  console.log('='.repeat(100));
  
  for (const mapping of EXPECTED_USE_CASES) {
    const found = useCaseMap[mapping.slug];
    if (found) {
      const qs = questionsByUseCase[found.id] || [];
      const cfgs = configsByUseCase[found.id] || [];
      const status = qs.length > 0 && cfgs.length > 0 ? '✅' : '⚠️';
      console.log(`${status} ${mapping.expected.padEnd(25)} → ${mapping.slug.padEnd(20)} | Q:${qs.length} C:${cfgs.length} | ${mapping.note}`);
    } else {
      console.log(`❌ ${mapping.expected.padEnd(25)} → ${mapping.slug.padEnd(20)} | NOT FOUND | ${mapping.note}`);
    }
  }
  
  // 6. Issues Summary
  console.log('\n\n' + '='.repeat(100));
  console.log('⚠️ ISSUES FOUND:');
  console.log('='.repeat(100));
  
  const issues = [];
  
  // Check for use cases without questions
  for (const uc of useCases) {
    if (uc.is_active) {
      const qs = questionsByUseCase[uc.id] || [];
      const cfgs = configsByUseCase[uc.id] || [];
      
      if (qs.length === 0) {
        issues.push(`⚠️ ${uc.slug}: No custom questions defined`);
      }
      if (cfgs.length === 0) {
        issues.push(`⚠️ ${uc.slug}: No configurations defined`);
      }
    }
  }
  
  // Check for hotel-hospitality vs hotel (potential duplicate)
  if (useCaseMap['hotel'] && useCaseMap['hotel-hospitality']) {
    const hotelActive = useCaseMap['hotel'].is_active;
    const hospActive = useCaseMap['hotel-hospitality'].is_active;
    if (hotelActive && hospActive) {
      issues.push('⚠️ DUPLICATE: Both "hotel" and "hotel-hospitality" are active - one should be disabled');
    }
  }
  
  if (issues.length === 0) {
    console.log('  ✅ No issues found!');
  } else {
    for (const issue of issues) {
      console.log(`  ${issue}`);
    }
  }
  
  // 7. Recommendations
  console.log('\n\n' + '='.repeat(100));
  console.log('📋 RECOMMENDATIONS FOR copilot-instructions.md:');
  console.log('='.repeat(100));
  console.log(`
Update the EXPECTED_USE_CASES list to use ACTUAL database slugs:

| Expected (docs)       | Actual (DB)        | Action Needed        |
|-----------------------|--------------------|----------------------|
| apartment-building    | apartment          | Update docs          |
| distribution-center   | warehouse          | Update docs          |
| edge-data-center      | data-center        | Update docs          |
| public-building       | government         | Update docs          |
| university            | college            | Update docs          |
| hotel-hospitality     | [disable in DB]    | Mark inactive in DB  |
`);
  
  // 8. Final Summary
  console.log('\n\n' + '='.repeat(100));
  console.log('📊 AUDIT SUMMARY:');
  console.log('='.repeat(100));
  console.log(`  Total use cases in database: ${useCases.length}`);
  console.log(`  Active use cases: ${useCases.filter(uc => uc.is_active).length}`);
  console.log(`  Use cases with questions: ${Object.keys(questionsByUseCase).length}`);
  console.log(`  Use cases with configurations: ${Object.keys(configsByUseCase).length}`);
  console.log(`  Issues found: ${issues.length}`);
  
  console.log('\n');
}

auditUseCases().catch(console.error);
