/**
 * Quick fix script to update peak demand slider values for college use case
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvmpmozybmtzjvikrctq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPeakDemandSlider() {
  console.log('🔧 Fixing peak demand slider values for college...\n');
  
  // First get the college use case ID
  const { data: useCase, error: useCaseError } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', 'college')
    .single();
    
  if (useCaseError) {
    console.error('❌ Error finding college use case:', useCaseError);
    return;
  }
  
  console.log('✅ Found college use case:', useCase.id);
  
  // Get current peak demand question
  const { data: question, error: fetchError } = await supabase
    .from('custom_questions')
    .select('*')
    .eq('use_case_id', useCase.id)
    .eq('field_name', 'peakDemandValue')
    .single();
    
  if (fetchError) {
    console.error('❌ Error finding peakDemandValue question:', fetchError);
    return;
  }
  
  console.log('📊 Current values:');
  console.log('   min:', question.options?.min_value);
  console.log('   max:', question.options?.max_value);
  console.log('   default:', question.default_value);
  
  // Update with realistic values
  const newOptions = {
    ...question.options,
    min_value: 100,
    max_value: 15000,
    default_value: 2000,
    unit: ' kW'
  };
  
  const { data: updated, error: updateError } = await supabase
    .from('custom_questions')
    .update({
      options: newOptions,
      default_value: '2000',
      help_text: 'Maximum kW from utility bill (typical: 500 kW - 10 MW). Most colleges range from 500 kW to 15,000 kW'
    })
    .eq('id', question.id)
    .select()
    .single();
    
  if (updateError) {
    console.error('❌ Error updating question:', updateError);
    return;
  }
  
  console.log('\n✅ Updated successfully!');
  console.log('📊 New values:');
  console.log('   min:', updated.options?.min_value);
  console.log('   max:', updated.options?.max_value);
  console.log('   default:', updated.default_value);
  console.log('\n🎉 Peak demand slider now shows realistic range (100 kW - 15,000 kW)');
}

fixPeakDemandSlider().catch(console.error);
