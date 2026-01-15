import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('custom_questions')
  .select('field_name, question_text, question_type, icon_name, display_order, section_name')
  .eq('use_case_id', '0e2c2c6c-0939-41f9-b1ba-bf7d1d34eaf9')
  .order('display_order', { ascending: true });

console.log('=== HOSPITAL QUESTIONS ===');
if (error) {
  console.log('Error:', error);
} else {
  const fieldNames = data.map(q => q.field_name);
  const duplicates = fieldNames.filter((f, i) => fieldNames.indexOf(f) !== i);
  
  console.log('Total questions:', data.length);
  console.log('Duplicate field_names:', duplicates.length > 0 ? duplicates : 'None');
  console.log('');
  
  data.forEach((q, i) => {
    console.log(`${i+1}. [${q.display_order}] ${q.field_name} | ${q.question_type} | icon: ${q.icon_name} | section: ${q.section_name}`);
  });
}
