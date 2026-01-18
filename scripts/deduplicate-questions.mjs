// Deduplication script - Run with: node scripts/deduplicate-questions.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fvmpmozybmtzjvikrctq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MjI5MCwiZXhwIjoyMDc3ODU4MjkwfQ.pGemfuUEr17rYU1atovIgrfwLNZ7gcC0_k2wpmiHzAg'
);

async function deduplicate() {
  console.log('=== DEDUPLICATION STARTING ===\n');
  
  // First, check for duplicates
  const { data: allQ, error: e1 } = await supabase
    .from('custom_questions')
    .select('id, use_case_id, field_name, display_order')
    .not('field_name', 'is', null);
  
  if (e1) { 
    console.error('Error fetching:', e1); 
    return; 
  }
  
  console.log('Total questions:', allQ.length);
  
  // Group by use_case_id + field_name
  const groups = {};
  for (const q of allQ) {
    const key = `${q.use_case_id}|${q.field_name}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(q);
  }
  
  // Find duplicates and collect IDs to delete
  const toDelete = [];
  const duplicateSummary = {};
  
  for (const [key, items] of Object.entries(groups)) {
    if (items.length > 1) {
      // Sort by display_order, keep lowest
      items.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
      // Delete all except first
      for (let i = 1; i < items.length; i++) {
        toDelete.push(items[i].id);
      }
      // Track for summary
      const fieldName = key.split('|')[1];
      duplicateSummary[fieldName] = (duplicateSummary[fieldName] || 0) + (items.length - 1);
    }
  }
  
  console.log('\nDuplicates found:', toDelete.length);
  console.log('\nDuplicate fields:', Object.keys(duplicateSummary).length);
  console.log('Top duplicates:', Object.entries(duplicateSummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', '));
  
  if (toDelete.length > 0) {
    console.log('\n--- DELETING DUPLICATES ---');
    
    // Delete in batches of 50
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      const { error: delErr } = await supabase
        .from('custom_questions')
        .delete()
        .in('id', batch);
      
      if (delErr) {
        console.error('Delete error:', delErr);
      } else {
        console.log(`Deleted batch ${Math.floor(i/50) + 1} (${batch.length} items)`);
      }
    }
  }
  
  // Verify
  const { data: after } = await supabase
    .from('custom_questions')
    .select('id')
    .not('field_name', 'is', null);
  
  console.log('\n=== DEDUPLICATION COMPLETE ===');
  console.log('Questions after cleanup:', after?.length);
  console.log('Questions removed:', allQ.length - (after?.length || 0));
  
  // Check per-industry counts
  const { data: counts } = await supabase
    .from('custom_questions')
    .select('use_case_id')
    .not('field_name', 'is', null);
  
  const perIndustry = {};
  for (const q of counts || []) {
    perIndustry[q.use_case_id] = (perIndustry[q.use_case_id] || 0) + 1;
  }
  
  // Get use case names
  const { data: useCases } = await supabase
    .from('use_cases')
    .select('id, slug')
    .eq('is_active', true);
  
  console.log('\n--- Questions per industry ---');
  for (const uc of useCases || []) {
    const count = perIndustry[uc.id] || 0;
    const status = count < 10 ? '⚠️' : count > 25 ? '⚠️' : '✅';
    console.log(`${status} ${uc.slug}: ${count}`);
  }
}

deduplicate().catch(console.error);
