/**
 * Fix ALL display_order duplicates by reordering ALL questions sequentially
 * This is a "nuclear option" - assigns new display_orders to ALL questions
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fvmpmozybmtzjvikrctq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0'
);

// Section priority for ordering
const SECTION_PRIORITY = [
  'Facility Basics', 'Farm Basics', 'Property Basics', 'Casino Basics', 'Airport Basics',
  'Cold Storage Basics', 'Campus Basics', 'Gas Station Basics', 'Government Basics',
  'Truck Stop Basics', 'Hospital Basics', 'Indoor Farm Basics', 'Manufacturing Basics',
  'Microgrid Basics', 'Office Basics', 'Home Basics', 'Retail Basics', 'Mall Basics',
  'Warehouse Basics', 'Building Basics',
  'Operations', 'Building Systems', 'Equipment & Operations',
  'Equipment', 'Amenities',
  'Energy Profile', 'Energy & Power',
  'Existing Infrastructure',
  'Solar & Storage Interest',
  'Goals'
];

function getSectionPriority(sectionName) {
  if (!sectionName) return 999;
  // Find partial match
  const index = SECTION_PRIORITY.findIndex(s => 
    sectionName.toLowerCase().includes(s.toLowerCase().replace(/ Basics$/, '').toLowerCase()) ||
    s.toLowerCase().includes(sectionName.toLowerCase())
  );
  return index >= 0 ? index : 100;
}

async function fixAllDisplayOrders() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔧 FIXING ALL DISPLAY_ORDER DUPLICATES');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Get all active use cases
  const { data: useCases } = await supabase
    .from('use_cases')
    .select('id, slug')
    .eq('is_active', true)
    .order('slug');

  let totalFixed = 0;

  for (const uc of useCases) {
    // Get all questions for this use case
    const { data: questions } = await supabase
      .from('custom_questions')
      .select('id, field_name, display_order, section_name')
      .eq('use_case_id', uc.id);

    if (!questions || questions.length === 0) continue;

    // Check if there are duplicates
    const uniqueOrders = new Set(questions.map(q => q.display_order)).size;
    if (uniqueOrders === questions.length) {
      console.log(`✅ ${uc.slug.padEnd(22)} already OK (${questions.length} questions)`);
      continue;
    }

    // Sort by section priority, then by current display_order
    const sorted = [...questions].sort((a, b) => {
      const aPriority = getSectionPriority(a.section_name);
      const bPriority = getSectionPriority(b.section_name);
      if (aPriority !== bPriority) return aPriority - bPriority;
      return (a.display_order || 0) - (b.display_order || 0);
    });

    // Assign new sequential display_orders
    console.log(`🔄 ${uc.slug.padEnd(22)} fixing ${questions.length} questions...`);
    
    let fixed = 0;
    for (let i = 0; i < sorted.length; i++) {
      const newOrder = i + 1; // 1-based
      const q = sorted[i];
      
      if (q.display_order !== newOrder) {
        const { error } = await supabase
          .from('custom_questions')
          .update({ display_order: newOrder })
          .eq('id', q.id);
        
        if (error) {
          console.log(`   ❌ Error updating ${q.field_name}: ${error.message}`);
        } else {
          fixed++;
        }
      }
    }
    
    console.log(`   ✅ Fixed ${fixed} questions`);
    totalFixed += fixed;
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`📊 TOTAL: Fixed ${totalFixed} questions across all industries`);
}

fixAllDisplayOrders().catch(console.error);
