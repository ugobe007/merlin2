import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkHotelDupes() {
  const { data: hotel } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', 'hotel')
    .single();

  const { data: questions } = await supabase
    .from('custom_questions')
    .select('id, field_name, question_text, display_order')
    .eq('use_case_id', hotel.id)
    .order('display_order');

  // Find the problem pairs
  const problematic = [
    ['existingInfrastructure', 'existingGeneration'],
    ['solarSpace', 'solarSpaceAvailable']
  ];

  for (const [f1, f2] of problematic) {
    const q1 = questions.find(q => q.field_name === f1);
    const q2 = questions.find(q => q.field_name === f2);
    
    if (q1 && q2) {
      console.log(`\n=== ${f1} vs ${f2} ===`);
      console.log(`"${q1.question_text}" (order: ${q1.display_order})`);
      console.log(`"${q2.question_text}" (order: ${q2.display_order})`);
      console.log(`Same? ${q1.question_text === q2.question_text}`);
      console.log(`Same (lowercase)? ${q1.question_text?.toLowerCase() === q2.question_text?.toLowerCase()}`);
      console.log(`Lengths: ${q1.question_text?.length} vs ${q2.question_text?.length}`);
      
      // Delete the one with higher display_order
      const toDelete = q1.display_order < q2.display_order ? q2 : q1;
      console.log(`\nWould delete: ${toDelete.field_name} (id: ${toDelete.id})`);
    }
  }
}

checkHotelDupes().catch(console.error);
