/**
 * Final Audit: Verify all industries have unique display_orders
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fvmpmozybmtzjvikrctq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0'
);

async function audit() {
  const { data: useCases } = await supabase
    .from('use_cases')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('slug');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 ALL INDUSTRIES - DISPLAY ORDER AUDIT (Post-Migration)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let goodCount = 0;
  let badCount = 0;

  for (const uc of useCases) {
    const { data: questions } = await supabase
      .from('custom_questions')
      .select('display_order')
      .eq('use_case_id', uc.id);
    
    if (!questions || questions.length === 0) continue;
    
    const total = questions.length;
    const unique = new Set(questions.map(q => q.display_order)).size;
    const status = total === unique ? '✅ OK' : '❌ DUPLICATES';
    
    if (total === unique) goodCount++;
    else badCount++;
    
    console.log(`${status} ${uc.slug.padEnd(22)} ${total} questions, ${unique} unique orders`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`✅ Good: ${goodCount}  ❌ Bad: ${badCount}`);
}

audit().catch(console.error);
