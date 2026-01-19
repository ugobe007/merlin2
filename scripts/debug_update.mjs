/**
 * Debug why updates aren't persisting
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fvmpmozybmtzjvikrctq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0'
);

async function debug() {
  // Try to update majorEquipment (which has display_order=6, duplicate)
  // Get agricultural use case
  const { data: uc } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', 'agricultural')
    .single();
  
  console.log('Agricultural use_case_id:', uc.id);
  
  // Find majorEquipment
  const { data: question, error: findError } = await supabase
    .from('custom_questions')
    .select('id, field_name, display_order')
    .eq('field_name', 'majorEquipment')
    .eq('use_case_id', uc.id)
    .single();
  
  if (findError) {
    console.log('Find error:', findError);
    return;
  }
  
  console.log('Before update:', question);
  
  // Try to update
  const { data: updated, error: updateError } = await supabase
    .from('custom_questions')
    .update({ display_order: 999 })
    .eq('id', question.id)
    .select()
    .single();
  
  console.log('Update result:', updated);
  console.log('Update error:', updateError);
  
  // Read back
  const { data: after } = await supabase
    .from('custom_questions')
    .select('id, field_name, display_order')
    .eq('id', question.id)
    .single();
  
  console.log('After update:', after);
}

debug().catch(console.error);
