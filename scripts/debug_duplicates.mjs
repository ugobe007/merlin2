/**
 * Find duplicate display_order issues
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fvmpmozybmtzjvikrctq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0'
);

async function findDuplicates() {
  // Check agricultural as example
  const { data: useCase } = await supabase
    .from('use_cases')
    .select('id, slug')
    .eq('slug', 'agricultural')
    .single();

  const { data: questions } = await supabase
    .from('custom_questions')
    .select('id, field_name, question_text, display_order, section_name')
    .eq('use_case_id', useCase.id)
    .order('display_order');

  console.log('Agricultural Questions:\n');
  
  // Group by display_order
  const byOrder = {};
  for (const q of questions) {
    const key = q.display_order;
    if (!byOrder[key]) byOrder[key] = [];
    byOrder[key].push(q);
  }
  
  // Find duplicates
  console.log('Duplicate display_orders:\n');
  for (const [order, qs] of Object.entries(byOrder)) {
    if (qs.length > 1) {
      console.log(`  display_order=${order}:`);
      for (const q of qs) {
        console.log(`    - ${q.field_name} (${q.section_name})`);
      }
    }
  }
  
  // Show all field_names
  console.log('\n\nAll field_names:');
  for (const q of questions) {
    console.log(`  ${q.display_order.toString().padStart(2)} | ${q.field_name} | ${q.section_name || 'null'}`);
  }
}

findDuplicates().catch(console.error);
