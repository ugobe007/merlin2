import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://aqyxiestvwgldrwekoij.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxeXhpZXN0dndnbGRyd2Vrb2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3OTg4NjYsImV4cCI6MjA0NjM3NDg2Nn0.aU2eb7JvcXBGRVwT3HCkx6l4bfLY8Bk45WqRUcWRn4Y'
);

const { data } = await supabase.from('use_cases').select('slug, name, is_active').eq('is_active', true);
console.log('Active use cases:', data?.map(u => u.slug));
console.log('Restaurant:', data?.find(u => u.slug === 'restaurant'));

const { data: carwashQ } = await supabase.from('custom_questions').select('field_name, question_tier').eq('use_case_slug', 'car-wash').order('display_order');
console.log('Car wash questions:', carwashQ?.length);
carwashQ?.slice(0,5).forEach(q => console.log('  -', q.field_name, q.question_tier));

const { data: hotelQ } = await supabase.from('custom_questions').select('field_name, question_tier').eq('use_case_slug', 'hotel').order('display_order');
console.log('Hotel questions:', hotelQ?.length);
hotelQ?.slice(0,5).forEach(q => console.log('  -', q.field_name, q.question_tier));

const { data: coldQ } = await supabase.from('custom_questions').select('field_name').eq('use_case_slug', 'cold-storage').order('display_order');
console.log('Cold storage fields:', coldQ?.map(q => q.field_name));

const { data: aptQ } = await supabase.from('custom_questions').select('field_name').eq('use_case_slug', 'apartment').order('display_order');
console.log('Apartment fields:', aptQ?.map(q => q.field_name));
