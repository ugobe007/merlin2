#!/usr/bin/env npx tsx
/**
 * Delete and Re-apply Car Wash 16-Question Migration
 * January 21, 2026
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env file
dotenv.config({ path: join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define the 16 questions
const carWashQuestions = [
  {
    question_text: 'What type of car wash do you operate?',
    field_name: 'carWashType',
    question_type: 'select',
    options: [
      { value: 'self_serve', label: 'Self-serve (coin-op bays)', icon: '🧽', description: 'Customer wand wash with high-pressure equipment' },
      { value: 'automatic_inbay', label: 'Automatic in-bay', icon: '🚗', description: 'Vehicle stationary, machine moves over it' },
      { value: 'conveyor_tunnel', label: 'Conveyor tunnel (single tunnel)', icon: '🏎️', description: 'Single tunnel with conveyor system' },
      { value: 'combination', label: 'Combination (self-serve + in-bay)', icon: '🎯', description: 'Multiple wash types on one site' },
      { value: 'other', label: 'Other', icon: '🔧', description: 'Custom or specialized configuration' }
    ],
    default_value: 'automatic_inbay',
    is_required: true,
    help_text: 'Sets baseline load model and duty cycle logic',
    display_order: 1,
    section_name: 'Topology'
  },
  {
    question_text: 'How many active wash bays or tunnels do you have?',
    field_name: 'bayTunnelCount',
    question_type: 'select',
    options: [
      { value: '1', label: '1', icon: '1️⃣' },
      { value: '2-3', label: '2–3', icon: '2️⃣' },
      { value: '4-6', label: '4–6', icon: '4️⃣' },
      { value: '7+', label: '7+', icon: '7️⃣' }
    ],
    default_value: '1',
    is_required: true,
    help_text: 'Determines concurrency factor (most Merlin math assumes 1 unless >1 explicitly)',
    display_order: 2,
    section_name: 'Topology'
  },
  {
    question_text: 'What is your electrical service rating?',
    field_name: 'electricalServiceSize',
    question_type: 'select',
    options: [
      { value: '200', label: '200A', icon: '⚡', kW: 48 },
      { value: '400', label: '400A', icon: '⚡⚡', kW: 96 },
      { value: '600', label: '600A', icon: '⚡⚡⚡', kW: 144 },
      { value: '800+', label: '800A+', icon: '⚡⚡⚡⚡', kW: 192 },
      { value: 'not_sure', label: 'Not sure', icon: '❓' }
    ],
    default_value: '400',
    is_required: true,
    help_text: 'Upper bound constraint for BESS + charger interop',
    display_order: 3,
    section_name: 'Infrastructure'
  },
  {
    question_text: 'What voltage does your site use?',
    field_name: 'voltageLevel',
    question_type: 'select',
    options: [
      { value: '208', label: '208V', icon: '🔌' },
      { value: '240', label: '240V', icon: '🔌' },
      { value: '277_480', label: '277/480V', icon: '🔌🔌' },
      { value: 'mixed', label: 'Mixed', icon: '🔌🔌🔌' },
      { value: 'not_sure', label: 'Not sure', icon: '❓' }
    ],
    default_value: '277_480',
    is_required: true,
    help_text: 'PCS compatibility + inverter sizing (default 480V if not sure)',
    display_order: 4,
    section_name: 'Infrastructure'
  },
  {
    question_text: 'Which major electrical loads do you have? (Check all that apply)',
    field_name: 'primaryEquipment',
    question_type: 'multi-select',
    options: [
      { value: 'high_pressure_pumps', label: 'High-pressure pumps', icon: '💦', kW: 20 },
      { value: 'conveyor_motor', label: 'Conveyor motor', icon: '🔄', kW: 15 },
      { value: 'blowers_dryers', label: 'Blowers / dryers', icon: '💨', kW: 40 },
      { value: 'ro_system', label: 'RO system', icon: '💧', kW: 10 },
      { value: 'water_heaters_electric', label: 'Water heaters (electric)', icon: '🔥', kW: 50 },
      { value: 'lighting', label: 'Lighting', icon: '💡', kW: 5 },
      { value: 'vacuum_stations', label: 'Vacuum stations', icon: '🌀', kW: 15 },
      { value: 'pos_controls', label: 'POS / controls', icon: '💻', kW: 2 },
      { value: 'air_compressors', label: 'Air compressors', icon: '⚙️', kW: 10 }
    ],
    default_value: '["high_pressure_pumps", "blowers_dryers", "lighting", "pos_controls"]',
    is_required: true,
    help_text: 'Bottom-up load reconstruction (flags resistive vs inductive loads)',
    display_order: 5,
    section_name: 'Equipment'
  },
  {
    question_text: 'What is the largest motor on site (approx)?',
    field_name: 'largestMotorSize',
    question_type: 'select',
    options: [
      { value: '<10', label: '<10 HP', icon: '⚡', kW: 7 },
      { value: '10-25', label: '10–25 HP', icon: '⚡⚡', kW: 18 },
      { value: '25-50', label: '25–50 HP', icon: '⚡⚡⚡', kW: 37 },
      { value: '50-100', label: '50–100 HP', icon: '⚡⚡⚡⚡', kW: 75 },
      { value: '100+', label: '100+ HP', icon: '⚡⚡⚡⚡⚡', kW: 100 },
      { value: 'not_sure', label: 'Not sure', icon: '❓', kW: 25 }
    ],
    default_value: '10-25',
    is_required: true,
    help_text: 'Peak surge modeling + soft-start requirement (default 25 HP if not sure)',
    display_order: 6,
    section_name: 'Equipment'
  },
  {
    question_text: 'How many major machines run at the same time during a wash?',
    field_name: 'simultaneousEquipment',
    question_type: 'select',
    options: [
      { value: '1-2', label: '1–2', icon: '1️⃣', concurrency: 0.5 },
      { value: '3-4', label: '3–4', icon: '3️⃣', concurrency: 0.75 },
      { value: '5-7', label: '5–7', icon: '5️⃣', concurrency: 0.9 },
      { value: '8+', label: '8+', icon: '8️⃣', concurrency: 1.0 }
    ],
    default_value: '3-4',
    is_required: true,
    help_text: 'True peak load (not nameplate fantasy) - default 3 machines if not sure',
    display_order: 7,
    section_name: 'Operations'
  },
  {
    question_text: 'How many cars do you wash on an average day?',
    field_name: 'averageWashesPerDay',
    question_type: 'select',
    options: [
      { value: '<30', label: '<30', icon: '🚗' },
      { value: '30-75', label: '30–75', icon: '🚗🚗' },
      { value: '75-150', label: '75–150', icon: '🚗🚗🚗' },
      { value: '150-300', label: '150–300', icon: '🚗🚗🚗🚗' },
      { value: '300+', label: '300+', icon: '🚗🚗🚗🚗🚗' }
    ],
    default_value: '75-150',
    is_required: true,
    help_text: 'Energy throughput + ROI + duty cycle',
    display_order: 8,
    section_name: 'Operations'
  },
  {
    question_text: 'During your busiest hour, how many cars do you process?',
    field_name: 'peakHourThroughput',
    question_type: 'select',
    options: [
      { value: '<10', label: '<10', icon: '🚗' },
      { value: '10-25', label: '10–25', icon: '🚗🚗' },
      { value: '25-50', label: '25–50', icon: '🚗🚗🚗' },
      { value: '50+', label: '50+', icon: '🚗🚗🚗🚗' }
    ],
    default_value: '10-25',
    is_required: true,
    help_text: 'Determines short-term peak demand',
    display_order: 9,
    section_name: 'Operations'
  },
  {
    question_text: 'How long is one full wash cycle?',
    field_name: 'washCycleDuration',
    question_type: 'select',
    options: [
      { value: '<3', label: '<3 minutes', icon: '⚡', minutes: 2 },
      { value: '3-5', label: '3–5 minutes', icon: '⚡⚡', minutes: 4 },
      { value: '5-8', label: '5–8 minutes', icon: '⚡⚡⚡', minutes: 6 },
      { value: '8-12', label: '8–12 minutes', icon: '⚡⚡⚡⚡', minutes: 10 },
      { value: '12+', label: '12+ minutes', icon: '⚡⚡⚡⚡⚡', minutes: 15 }
    ],
    default_value: '3-5',
    is_required: true,
    help_text: 'Converts throughput → kWh → load curve (default 5 min if not sure)',
    display_order: 10,
    section_name: 'Operations'
  },
  {
    question_text: 'What are your typical daily operating hours?',
    field_name: 'operatingHours',
    question_type: 'select',
    options: [
      { value: '<8', label: '<8 hrs/day', icon: '🕐', hours: 6 },
      { value: '8-12', label: '8–12 hrs/day', icon: '🕐🕐', hours: 10 },
      { value: '12-18', label: '12–18 hrs/day', icon: '🕐🕐🕐', hours: 15 },
      { value: '18-24', label: '18–24 hrs/day', icon: '🕐🕐🕐🕐', hours: 21 }
    ],
    default_value: '8-12',
    is_required: true,
    help_text: 'Load spreading + arbitrage logic',
    display_order: 11,
    section_name: 'Operations'
  },
  {
    question_text: 'What is your average monthly electricity bill?',
    field_name: 'monthlyElectricitySpend',
    question_type: 'select',
    options: [
      { value: '<1000', label: '<$1,000', icon: '💵' },
      { value: '1000-3000', label: '$1,000–$3,000', icon: '💵💵' },
      { value: '3000-7500', label: '$3,000–$7,500', icon: '💵💵💵' },
      { value: '7500-15000', label: '$7,500–$15,000', icon: '💵💵💵💵' },
      { value: '15000+', label: '$15,000+', icon: '💵💵💵💵💵' },
      { value: 'not_sure', label: 'Not sure', icon: '❓' }
    ],
    default_value: '3000-7500',
    is_required: true,
    help_text: 'ROI calibration anchor (also catches hidden loads)',
    display_order: 12,
    section_name: 'Financial'
  },
  {
    question_text: 'What best describes your utility billing?',
    field_name: 'utilityRateStructure',
    question_type: 'select',
    options: [
      { value: 'flat', label: 'Flat rate only', icon: '📊', savingsMultiplier: 0.5 },
      { value: 'tou', label: 'Time-of-use (TOU)', icon: '🕐', savingsMultiplier: 0.8 },
      { value: 'demand', label: 'Demand charges', icon: '⚡', savingsMultiplier: 1.0 },
      { value: 'tou_demand', label: 'TOU + demand charges', icon: '🎯', savingsMultiplier: 1.2 },
      { value: 'not_sure', label: 'Not sure', icon: '❓', savingsMultiplier: 0.8 }
    ],
    default_value: 'demand',
    is_required: true,
    help_text: 'Determines whether BESS creates real savings or just cosmetics',
    display_order: 13,
    section_name: 'Financial'
  },
  {
    question_text: 'Do you experience any of the following? (Check all that apply)',
    field_name: 'powerQualityIssues',
    question_type: 'multi-select',
    options: [
      { value: 'breaker_trips', label: 'Breaker trips', icon: '⚡❌' },
      { value: 'voltage_sag', label: 'Voltage sag during peak use', icon: '📉' },
      { value: 'utility_penalties', label: 'Utility penalties', icon: '💰' },
      { value: 'equipment_brownouts', label: 'Equipment brownouts', icon: '💡' },
      { value: 'none', label: 'None', icon: '✅' }
    ],
    default_value: '["none"]',
    is_required: false,
    help_text: 'Power conditioning + resilience positioning',
    display_order: 14,
    section_name: 'Resilience'
  },
  {
    question_text: 'If power goes out, what happens to your business?',
    field_name: 'outageSensitivity',
    question_type: 'select',
    options: [
      { value: 'operations_stop', label: 'Operations stop entirely', icon: '🛑', backupHours: 4 },
      { value: 'partial_operations', label: 'Partial operations only', icon: '⚠️', backupHours: 2 },
      { value: 'minor_disruption', label: 'Minor disruption', icon: '📉', backupHours: 1 },
      { value: 'no_impact', label: 'No impact', icon: '✅', backupHours: 0 }
    ],
    default_value: 'operations_stop',
    is_required: true,
    help_text: 'Backup runtime requirement + resilience ROI justification',
    display_order: 15,
    section_name: 'Resilience'
  },
  {
    question_text: 'Are you planning any of the following in the next 24 months? (Check all that apply)',
    field_name: 'expansionPlans',
    question_type: 'multi-select',
    options: [
      { value: 'add_bay_tunnel', label: 'Adding another bay/tunnel', icon: '➕🚗', kWIncrease: 50 },
      { value: 'larger_equipment', label: 'Larger blowers or pumps', icon: '⬆️💨', kWIncrease: 30 },
      { value: 'ev_chargers', label: 'EV chargers', icon: '🔌', kWIncrease: 50 },
      { value: 'more_vacuums', label: 'More vacuums', icon: '🌀', kWIncrease: 10 },
      { value: 'solar', label: 'Solar', icon: '☀️', kWIncrease: 0 },
      { value: 'none', label: 'No expansion planned', icon: '✅', kWIncrease: 0 }
    ],
    default_value: '["none"]',
    is_required: false,
    help_text: 'Future-proof BESS sizing (prevents undersizing trap)',
    display_order: 16,
    section_name: 'Planning'
  }
];

async function applyMigration() {
  console.log('🔧 Applying Car Wash 16-Question Migration...\n');

  try {
    // 1. Get car-wash use case ID
    const { data: useCase, error: useCaseError } = await supabase
      .from('use_cases')
      .select('id, name')
      .eq('slug', 'car-wash')
      .single();

    if (useCaseError) {
      console.error('❌ Error finding car-wash:', useCaseError);
      return;
    }

    console.log(`Found: ${useCase.name} (ID: ${useCase.id})\n`);

    // 2. Delete existing questions
    console.log('Deleting existing questions...');
    const { error: deleteError } = await supabase
      .from('custom_questions')
      .delete()
      .eq('use_case_id', useCase.id);

    if (deleteError) {
      console.error('❌ Error deleting:', deleteError);
      return;
    }

    console.log('✅ Deleted old questions\n');

    // 3. Insert new questions
    console.log('Inserting 16 new questions...\n');
    
    for (const question of carWashQuestions) {
      const questionData = {
        use_case_id: useCase.id,
        ...question,
        options: question.options ? JSON.stringify(question.options) : null
      };

      const { error: insertError } = await supabase
        .from('custom_questions')
        .insert([questionData]);

      if (insertError) {
        console.error(`❌ Error inserting ${question.field_name}:`, insertError);
      } else {
        console.log(`✅ ${question.display_order}. ${question.field_name}`);
      }
    }

    // 4. Verify
    console.log('\n🔍 Verifying...');
    const { data: newQuestions, error: verifyError } = await supabase
      .from('custom_questions')
      .select('display_order, section_name, field_name, question_text')
      .eq('use_case_id', useCase.id)
      .order('display_order');

    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
      return;
    }

    console.log(`\n✅ Migration complete! ${newQuestions.length} questions installed.\n`);

    // Group by section
    const sections = newQuestions.reduce((acc, q) => {
      if (!acc[q.section_name]) acc[q.section_name] = [];
      acc[q.section_name].push(q);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(sections).forEach(([section, qs]) => {
      console.log(`\n📋 ${section} (${qs.length}):`);
      qs.forEach(q => {
        console.log(`  ${q.display_order}. ${q.field_name}`);
      });
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
