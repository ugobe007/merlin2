/**
 * Update Data Center Questions Script
 * Run with: node scripts/update_datacenter_questions.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fvmpmozybmtzjvikrctq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDatacenterQuestions() {
  console.log('🔍 Finding Data Center use case...');
  
  // Find datacenter use case
  const { data: useCases, error: findError } = await supabase
    .from('use_cases')
    .select('id, name, slug')
    .or('slug.eq.data-center,slug.eq.datacenter,slug.eq.edge-data-center');
  
  if (findError) {
    console.error('❌ Error finding use case:', findError);
    return;
  }
  
  if (!useCases || useCases.length === 0) {
    console.log('⚠️ No data center use case found');
    return;
  }
  
  const datacenter = useCases[0];
  console.log(`✅ Found: ${datacenter.name} (${datacenter.slug})`);
  
  // Delete existing questions
  const { error: deleteError } = await supabase
    .from('custom_questions')
    .delete()
    .eq('use_case_id', datacenter.id);
  
  if (deleteError) {
    console.error('❌ Error deleting old questions:', deleteError);
    return;
  }
  console.log('🗑️ Cleared old questions');
  
  // New streamlined questions
  const newQuestions = [
    {
      use_case_id: datacenter.id,
      question_text: 'Number of server racks',
      field_name: 'rackCount',
      question_type: 'number',
      default_value: '50',
      min_value: 5,
      max_value: 1000,
      is_required: true,
      help_text: 'Total equipment racks in your facility',
      display_order: 1
    },
    {
      use_case_id: datacenter.id,
      question_text: 'Average power per rack (kW)',
      field_name: 'rackDensityKW',
      question_type: 'number',
      default_value: '8',
      min_value: 2,
      max_value: 30,
      is_required: true,
      help_text: 'Typical: 5-8 kW (standard), 10-20 kW (high density), 20+ kW (AI/HPC)',
      display_order: 2
    },
    {
      use_case_id: datacenter.id,
      question_text: 'Total facility square footage',
      field_name: 'facilitySqFt',
      question_type: 'number',
      default_value: '25000',
      min_value: 1000,
      max_value: 500000,
      is_required: true,
      help_text: 'Total data hall and support space',
      display_order: 3
    },
    {
      use_case_id: datacenter.id,
      question_text: 'Uptime tier requirement',
      field_name: 'uptimeTier',
      question_type: 'select',
      default_value: 'tier_3',
      is_required: true,
      help_text: 'Higher tiers = more redundancy & backup power',
      display_order: 4,
      options: [
        { value: 'tier_1', label: 'Tier I (99.67%)', description: 'Basic: single path, no redundancy' },
        { value: 'tier_2', label: 'Tier II (99.74%)', description: 'Redundant components' },
        { value: 'tier_3', label: 'Tier III (99.98%)', description: 'Concurrently maintainable' },
        { value: 'tier_4', label: 'Tier IV (99.99%)', description: 'Fault tolerant, highest reliability' }
      ]
    },
    {
      use_case_id: datacenter.id,
      question_text: 'Cooling system type',
      field_name: 'coolingType',
      question_type: 'select',
      default_value: 'crac',
      is_required: true,
      help_text: 'Cooling accounts for 30-50% of data center power',
      display_order: 5,
      options: [
        { value: 'crac', label: 'CRAC Units', description: 'Traditional air-cooled with raised floor' },
        { value: 'in_row', label: 'In-Row Cooling', description: 'Hot/cold aisle containment' },
        { value: 'rear_door', label: 'Rear Door Heat Exchangers', description: 'Water-cooled at rack level' },
        { value: 'liquid_immersion', label: 'Liquid Immersion', description: 'Direct liquid cooling for high density' }
      ]
    },
    {
      use_case_id: datacenter.id,
      question_text: 'Target PUE',
      field_name: 'pueTarget',
      question_type: 'number',
      default_value: '1.5',
      min_value: 1.1,
      max_value: 2.5,
      is_required: false,
      help_text: 'Power Usage Effectiveness: Total power ÷ IT power (1.0 = perfect efficiency)',
      display_order: 6
    },
    {
      use_case_id: datacenter.id,
      question_text: 'Required battery backup time (minutes)',
      field_name: 'backupMinutes',
      question_type: 'number',
      default_value: '15',
      min_value: 5,
      max_value: 60,
      is_required: true,
      help_text: 'Time to bridge to generator or ride through short outages',
      display_order: 7
    },
    {
      use_case_id: datacenter.id,
      question_text: 'Do you have existing UPS?',
      field_name: 'hasExistingUPS',
      question_type: 'boolean',
      default_value: 'true',
      is_required: false,
      help_text: 'Current battery backup infrastructure to augment',
      display_order: 8
    }
  ];
  
  // Insert new questions
  const { error: insertError } = await supabase
    .from('custom_questions')
    .insert(newQuestions);
  
  if (insertError) {
    console.error('❌ Error inserting questions:', insertError);
    return;
  }
  
  console.log('✅ Added 8 streamlined Data Center questions:');
  console.log('   1. Number of server racks');
  console.log('   2. Average power per rack (kW)');
  console.log('   3. Total facility square footage');
  console.log('   4. Uptime tier requirement');
  console.log('   5. Cooling system type');
  console.log('   6. Target PUE');
  console.log('   7. Required battery backup time');
  console.log('   8. Do you have existing UPS?');
  console.log('');
  console.log('🎯 Removed redundant grid/utility questions - those are handled elsewhere');
}

updateDatacenterQuestions().catch(console.error);
