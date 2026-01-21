// Query all DB fields for industries with lower match rates
import { createClient } from '@supabase/supabase-js';

const url = 'https://fvmpmozybmtzjvikrctq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0';

const supabase = createClient(url, key);

async function run() {
  // Get all active use cases
  const { data: useCases, error } = await supabase
    .from('use_cases')
    .select('id, slug, name')
    .eq('is_active', true);

  if (error) {
    console.error('Error:', error);
    return;
  }
  if (!useCases) {
    console.log('No use cases found');
    return;
  }
  
  // ALL industries to check
  const allSlugs = useCases.map(u => u.slug).sort();
  
  console.log('\n========================================');
  console.log('COMPLETE DATABASE FIELD INVENTORY');
  console.log('========================================\n');

  for (const slug of allSlugs) {
    const uc = useCases.find(u => u.slug === slug);
    if (!uc) continue;
    
    const { data: questions, error: qError } = await supabase
      .from('custom_questions')
      .select('field_name')
      .eq('use_case_id', uc.id);
    
    if (qError) console.log('Questions error for', slug, qError);
    
    console.log(`\n=== ${slug.toUpperCase()} (${questions?.length || 0} fields) ===`);
    questions?.forEach(q => {
      console.log(`  ${q.field_name}`);
    });
  }
}

run().catch(console.error);
