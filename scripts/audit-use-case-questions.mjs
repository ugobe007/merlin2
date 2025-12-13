#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yhygtsftwxtlkztqkbxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloeWd0c2Z0d3h0bGt6dHFrYnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2MTYyMzksImV4cCI6MjA0NzE5MjIzOX0.h_maAlzFSK8pfy4vVNxB9aUvP1ZQ3j01RQXJFwLl7MA';

const supabase = createClient(supabaseUrl, supabaseKey);

const useCasesToAudit = [
  'data-center',
  'office', 
  'college',
  'airport',
  'hotel',
  'car-wash',
  'hospital',
  'warehouse',
  'ev-charging'
];

console.log('==============================================');
console.log('USE CASE QUESTIONS AUDIT');
console.log('==============================================\n');

for (const slug of useCasesToAudit) {
  const { data: useCase, error: ucError } = await supabase
    .from('use_cases')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (ucError || !useCase) {
    console.log(`❌ ${slug}: NOT FOUND`);
    continue;
  }

  const { data: questions, error: qError } = await supabase
    .from('custom_questions')
    .select('*')
    .eq('use_case_id', useCase.id)
    .order('display_order');

  console.log(`\n==============================================`);
  console.log(`${useCase.name.toUpperCase()} (${slug})`);
  console.log(`==============================================`);
  console.log(`Total Questions: ${questions?.length || 0}\n`);

  if (questions && questions.length > 0) {
    questions.forEach((q) => {
      const optCount = q.options ? JSON.parse(JSON.stringify(q.options)).length : 0;
      const optStr = optCount > 0 ? `${optCount} opts` : 'N/A';
      console.log(`${q.display_order}. ${q.question_text}`);
      console.log(`   Field: ${q.field_name} | Type: ${q.question_type} | Options: ${optStr}`);
    });
  } else {
    console.log('   ⚠️ NO QUESTIONS FOUND');
  }
}

console.log('\n\n==============================================');
console.log('SUMMARY');
console.log('==============================================\n');

const { data: summary } = await supabase
  .from('use_cases')
  .select(`
    slug,
    name,
    custom_questions(count)
  `)
  .in('slug', useCasesToAudit)
  .order('slug');

if (summary) {
  summary.forEach(uc => {
    const count = uc.custom_questions?.[0]?.count || 0;
    const status = count === 0 ? '❌ NO QUESTIONS' : 
                   count < 10 ? '⚠️ TOO FEW' : '✅ GOOD';
    console.log(`${status.padEnd(15)} ${uc.slug.padEnd(20)} ${count} questions`);
  });
}

process.exit(0);
