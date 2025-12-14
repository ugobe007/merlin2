#!/usr/bin/env node
/**
 * Fix Apartment Complex Questionnaire
 * Dec 14, 2025 - User reported wrong questions showing
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixApartmentQuestions() {
  console.log('🔧 Fixing apartment complex questionnaire...\n');

  // Get apartment use case ID
  const { data: useCase, error: useCaseError } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', 'apartment')
    .single();

  if (useCaseError || !useCase) {
    console.error('❌ Could not find apartment use case:', useCaseError);
    return;
  }

  const useCaseId = useCase.id;
  console.log(`✅ Found apartment use case: ${useCaseId}\n`);

  // Delete existing questions
  const { error: deleteError } = await supabase
    .from('custom_questions')
    .delete()
    .eq('use_case_id', useCaseId);

  if (deleteError) {
    console.error('❌ Error deleting old questions:', deleteError);
    return;
  }

  console.log('✅ Deleted old apartment questions\n');

  // Insert new questions
  const questions = [
    {
      use_case_id: useCaseId,
      question_text: 'Number of apartment units',
      field_name: 'unitCount',
      question_type: 'dropdown',
      default_value: '100',
      is_required: true,
      help_text: 'Total residential units in the building',
      display_order: 1,
      options: [
        { label: '10 - 25 units (Small building)', value: '18' },
        { label: '25 - 50 units (Medium building)', value: '38' },
        { label: '50 - 100 units (Large building)', value: '75' },
        { label: '100 - 200 units (Very large)', value: '150' },
        { label: '200 - 500 units (High-rise)', value: '350' },
        { label: '500+ units (Tower complex)', value: '750' }
      ]
    },
    {
      use_case_id: useCaseId,
      question_text: 'Average unit size',
      field_name: 'avgUnitSqFt',
      question_type: 'dropdown',
      default_value: '900',
      is_required: false,
      help_text: 'Typical square footage per apartment',
      display_order: 2,
      options: [
        { label: '500 - 750 sq ft (Studio/1BR)', value: '625' },
        { label: '750 - 1,000 sq ft (1-2BR)', value: '875' },
        { label: '1,000 - 1,500 sq ft (2-3BR)', value: '1250' },
        { label: '1,500 - 2,500 sq ft (3BR+/Luxury)', value: '2000' }
      ]
    },
    {
      use_case_id: useCaseId,
      question_text: 'Building square footage',
      field_name: 'squareFeet',
      question_type: 'number',
      default_value: '150000',
      min_value: 10000,
      max_value: 2000000,
      is_required: false,
      help_text: 'Total building floor space (optional)',
      display_order: 3
    },
    {
      use_case_id: useCaseId,
      question_text: 'Number of floors/stories',
      field_name: 'floors',
      question_type: 'number',
      default_value: '10',
      min_value: 1,
      max_value: 100,
      is_required: false,
      help_text: 'Building height',
      display_order: 4
    },
    {
      use_case_id: useCaseId,
      question_text: 'Common area amenities',
      field_name: 'amenities',
      question_type: 'multiselect',
      default_value: '[]',
      is_required: false,
      help_text: 'Select all that apply',
      display_order: 5,
      options: [
        { label: '🏊 Swimming Pool', value: 'pool' },
        { label: '🏋️ Fitness Center', value: 'fitness' },
        { label: '👔 Business Center', value: 'business' },
        { label: '🧺 Laundry Facilities', value: 'laundry' },
        { label: '🚗 Parking Garage', value: 'parking' },
        { label: '🔌 EV Charging', value: 'evCharging' }
      ]
    },
    {
      use_case_id: useCaseId,
      question_text: 'HVAC system type',
      field_name: 'hvacType',
      question_type: 'dropdown',
      default_value: 'individual',
      is_required: false,
      help_text: 'How is heating/cooling provided?',
      display_order: 6,
      options: [
        { label: 'Individual unit HVAC (most common)', value: 'individual' },
        { label: 'Central HVAC with individual controls', value: 'central' },
        { label: 'District heating/cooling', value: 'district' }
      ]
    },
    {
      use_case_id: useCaseId,
      question_text: 'Monthly electric bill',
      field_name: 'monthlyElectricBill',
      question_type: 'number',
      default_value: '15000',
      min_value: 1000,
      max_value: 500000,
      is_required: false,
      help_text: 'Current common area electricity cost',
      display_order: 7
    },
    {
      use_case_id: useCaseId,
      question_text: 'Grid capacity (kW)',
      field_name: 'gridCapacityKW',
      question_type: 'number',
      default_value: '500',
      min_value: 50,
      max_value: 10000,
      is_required: false,
      help_text: 'Maximum grid connection size',
      display_order: 8
    }
  ];

  const { data, error } = await supabase
    .from('custom_questions')
    .insert(questions)
    .select();

  if (error) {
    console.error('❌ Error inserting new questions:', error);
    return;
  }

  console.log(`✅ Inserted ${data.length} apartment questions:\n`);
  data.forEach(q => {
    console.log(`  ${q.display_order}. ${q.question_text} (${q.field_name})`);
  });

  console.log('\n✅ Apartment questionnaire fixed successfully!');
}

fixApartmentQuestions().catch(console.error);
