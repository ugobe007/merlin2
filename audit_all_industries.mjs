import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fvmpmozybmtzjvikrctq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0'
);

async function auditAll() {
  const { data: useCases } = await supabase
    .from('use_cases')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('slug');
  
  console.log('=== ALL INDUSTRIES AUDIT ===\n');
  console.log('SLUG'.padEnd(22) + '| TOTAL | UNIQUE | STATUS');
  console.log('-'.repeat(55));
  
  const issues = [];
  
  for (const uc of useCases) {
    const { data: qs } = await supabase
      .from('custom_questions')
      .select('field_name, display_order, question_type')
      .eq('use_case_id', uc.id);
    
    const total = qs?.length || 0;
    const unique = new Set(qs?.map(q => q.display_order) || []).size;
    const status = total === unique ? '✅ OK' : '⚠️ DUPE';
    
    console.log(uc.slug.padEnd(22) + '| ' + String(total).padStart(5) + ' | ' + String(unique).padStart(6) + ' | ' + status);
    
    if (total !== unique) {
      issues.push({ slug: uc.slug, total, unique, questions: qs });
    }
  }
  
  console.log('\n=== INDUSTRIES WITH DUPLICATES ===\n');
  
  for (const issue of issues) {
    console.log(`\n--- ${issue.slug.toUpperCase()} (${issue.total} questions, ${issue.unique} unique) ---`);
    
    // Find duplicate display_orders
    const orderCounts = {};
    issue.questions.forEach(q => {
      orderCounts[q.display_order] = orderCounts[q.display_order] || [];
      orderCounts[q.display_order].push(q.field_name);
    });
    
    for (const [order, fields] of Object.entries(orderCounts)) {
      if (fields.length > 1) {
        console.log(`  display_order ${order}: ${fields.join(', ')}`);
      }
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total industries: ${useCases.length}`);
  console.log(`With duplicates: ${issues.length}`);
  console.log(`Clean: ${useCases.length - issues.length}`);
}

auditAll();
