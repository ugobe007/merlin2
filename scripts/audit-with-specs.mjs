import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const useCasesToAudit = [
  { slug: 'ev-charging', name: 'EV Charging Hub' },
  { slug: 'hospital', name: 'Hospital' },
  { slug: 'warehouse', name: 'Warehouse' },
  { slug: 'manufacturing', name: 'Manufacturing' },
  { slug: 'data-center', name: 'Data Center' }
];

console.log('='.repeat(60));
console.log('INDUSTRY SPECS AUDIT - December 12, 2025');
console.log('='.repeat(60));
console.log();

for (const useCase of useCasesToAudit) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${useCase.name.toUpperCase()} (${useCase.slug})`);
  console.log('='.repeat(60));
  
  const { data, error } = await supabase
    .from('use_cases')
    .select('id, name, slug')
    .eq('slug', useCase.slug)
    .single();
  
  if (error || !data) {
    console.log('❌ NOT FOUND IN DATABASE');
    continue;
  }
  
  console.log(`✅ Found: ${data.name} (ID: ${data.id})`);
  
  const { data: questions } = await supabase
    .from('custom_questions')
    .select('*')
    .eq('use_case_id', data.id)
    .order('display_order');
  
  if (!questions || questions.length === 0) {
    console.log('⚠️  NO QUESTIONS CONFIGURED');
  } else {
    console.log(`\nCurrent Questions (${questions.length} total):\n`);
    questions.forEach(q => {
      const optCount = q.options ? JSON.parse(q.options).length : 0;
      console.log(`  ${q.display_order}. ${q.question_text}`);
      console.log(`     Field: ${q.field_name} | Type: ${q.question_type}${optCount > 0 ? ` | ${optCount} options` : ''}`);
    });
  }
}

console.log('\n' + '='.repeat(60));
console.log('AUDIT COMPLETE');
console.log('='.repeat(60));
