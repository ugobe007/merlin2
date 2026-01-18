import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkHotelQuestions() {
  const { data: hotel } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', 'hotel')
    .single();

  const { data: questions } = await supabase
    .from('custom_questions')
    .select('*')
    .eq('use_case_id', hotel.id)
    .order('display_order');

  console.log('\n=== HOTEL QUESTIONS AUDIT ===\n');
  
  questions.forEach((q, i) => {
    console.log(`${i+1}. ${q.field_name}`);
    console.log(`   Type: ${q.question_type}`);
    console.log(`   Text: "${q.question_text}"`);
    if (q.min_value !== null || q.max_value !== null) {
      console.log(`   Range: ${q.min_value} - ${q.max_value} (default: ${q.default_value})`);
    }
    if (q.options) {
      const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      console.log(`   Options: ${opts.length} choices`);
      if (opts.length <= 6) {
        opts.forEach(o => console.log(`     - ${o.value}: ${o.label}`));
      }
    }
    console.log('');
  });
  
  // Highlight problematic fields
  console.log('\n=== ISSUES FOUND ===\n');
  
  const occupancy = questions.find(q => q.field_name === 'occupancyRate');
  if (occupancy) {
    console.log(`❌ occupancyRate: Range is ${occupancy.min_value}-${occupancy.max_value} but it's a PERCENTAGE (should be 0-100)`);
  }
  
  const fbOps = questions.find(q => q.field_name === 'fbOperations');
  if (fbOps) {
    console.log(`⚠️ fbOperations: Type is "${fbOps.question_type}" - consider multiselect for hotels with multiple dining options`);
  }
  
  const amenities = questions.find(q => q.field_name === 'amenities');
  if (amenities) {
    console.log(`✅ amenities: Already multiselect`);
  }
}

checkHotelQuestions().catch(console.error);
