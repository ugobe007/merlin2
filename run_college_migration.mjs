/**
 * Run the updated college questions migration
 * Now includes Solar and EV Charging conditional questions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvmpmozybmtzjvikrctq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MjI5MCwiZXhwIjoyMDc3ODU4MjkwfQ.pGemfuUEr17rYU1atovIgrfwLNZ7gcC0_k2wpmiHzAg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCollegeMigration() {
  console.log('🎓 Running College Questions Migration (Solar + EV Charging)...\n');
  
  // Get the college use case ID
  const { data: useCase, error: useCaseError } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', 'college')
    .single();
    
  if (useCaseError) {
    console.error('❌ Error finding college use case:', useCaseError);
    return;
  }
  
  const collegeId = useCase.id;
  console.log('✅ Found college use case:', collegeId);
  
  // Delete existing questions
  console.log('\n🗑️ Removing old questions...');
  const { error: deleteError } = await supabase
    .from('custom_questions')
    .delete()
    .eq('use_case_id', collegeId);
    
  if (deleteError) {
    console.error('❌ Delete error:', deleteError);
    return;
  }
  
  // Insert all questions
  const questions = [
    // Q1: Campus Type
    {
      use_case_id: collegeId,
      question_text: 'What type of institution?',
      field_name: 'campusType',
      question_type: 'select',
      default_value: 'research_university',
      is_required: true,
      help_text: 'This affects typical load profiles and operating hours',
      display_order: 1,
      options: [
        { value: 'community_college', label: 'Community College', multiplier: 0.7, description: 'Smaller campus, fewer 24/7 facilities' },
        { value: 'liberal_arts', label: 'Liberal Arts College', multiplier: 0.85, description: 'Focus on humanities, moderate facilities' },
        { value: 'state_university', label: 'State University', multiplier: 1.0, description: 'Large public institution' },
        { value: 'research_university', label: 'Research University (R1/R2)', multiplier: 1.3, description: 'High-intensity research operations' },
        { value: 'technical_institute', label: 'Technical Institute', multiplier: 1.1, description: 'Engineering/tech focus, high equipment load' }
      ]
    },
    // Q2: Total Square Footage
    {
      use_case_id: collegeId,
      question_text: 'Total campus building square footage',
      field_name: 'totalSqFt',
      question_type: 'select',
      default_value: '1_5_million',
      is_required: true,
      help_text: 'All conditioned building space (not grounds)',
      display_order: 2,
      options: [
        { value: 'under_500k', label: 'Under 500,000 sqft', sqft: 400000, description: 'Small campus' },
        { value: '500k_1m', label: '500K - 1M sqft', sqft: 750000, description: 'Medium campus' },
        { value: '1_5_million', label: '1-5M sqft', sqft: 2500000, description: 'Large campus' },
        { value: '5_10_million', label: '5-10M sqft', sqft: 7000000, description: 'Very large campus' },
        { value: 'over_10m', label: '10M+ sqft', sqft: 12000000, description: 'Major research university' }
      ]
    },
    // Q3: Number of Buildings
    {
      use_case_id: collegeId,
      question_text: 'Number of buildings',
      field_name: 'buildingCount',
      question_type: 'select',
      default_value: '50_100',
      is_required: false,
      help_text: 'Helps estimate distribution infrastructure',
      display_order: 3,
      options: [
        { value: 'under_20', label: 'Under 20', count: 15, description: 'Compact campus' },
        { value: '20_50', label: '20-50', count: 35, description: 'Medium campus' },
        { value: '50_100', label: '50-100', count: 75, description: 'Large campus' },
        { value: '100_200', label: '100-200', count: 150, description: 'Very large campus' },
        { value: 'over_200', label: '200+', count: 250, description: 'Major university' }
      ]
    },
    // Q4: Dormitory Beds
    {
      use_case_id: collegeId,
      question_text: 'Dormitory bed count',
      field_name: 'dormitoryBeds',
      question_type: 'select',
      default_value: '3000_7000',
      is_required: true,
      help_text: 'On-campus residential beds (high 24/7 load)',
      display_order: 4,
      options: [
        { value: 'none', label: 'None (commuter)', beds: 0, kW: 0, description: 'No on-campus housing' },
        { value: 'under_1000', label: 'Under 1,000', beds: 750, kW: 600, description: 'Small residential program' },
        { value: '1000_3000', label: '1,000-3,000', beds: 2000, kW: 1600, description: 'Medium residential' },
        { value: '3000_7000', label: '3,000-7,000', beds: 5000, kW: 4000, description: 'Large residential campus' },
        { value: 'over_7000', label: '7,000+', beds: 10000, kW: 8000, description: 'Major residential university' }
      ]
    },
    // Q5: Research Facilities
    {
      use_case_id: collegeId,
      question_text: 'Research facility type',
      field_name: 'researchFacilities',
      question_type: 'select',
      default_value: 'wet_labs',
      is_required: true,
      help_text: 'Labs have intense ventilation and equipment loads',
      display_order: 5,
      options: [
        { value: 'none', label: 'None/Minimal', kW: 0, description: 'Primarily teaching institution' },
        { value: 'dry_labs', label: 'Dry Labs Only', kW: 50, description: 'Computer labs, simulation' },
        { value: 'wet_labs', label: 'Wet Labs (chemistry/biology)', kW: 150, description: 'Fume hoods, equipment' },
        { value: 'advanced_research', label: 'Advanced Research', kW: 400, description: 'Clean rooms, specialized equipment' },
        { value: 'major_research', label: 'Major Research Complex', kW: 800, description: 'Multiple research buildings' }
      ]
    },
    // Q6: Data Center
    {
      use_case_id: collegeId,
      question_text: 'On-campus data center',
      field_name: 'dataCenterSize',
      question_type: 'select',
      default_value: 'medium',
      is_required: false,
      help_text: 'IT infrastructure, server rooms',
      display_order: 6,
      options: [
        { value: 'none', label: 'Cloud Only', kW: 0, description: 'No on-premises servers' },
        { value: 'server_closets', label: 'Server Closets', kW: 50, description: 'Distributed small rooms' },
        { value: 'medium', label: 'Medium Data Center', kW: 750, description: 'Centralized facility' },
        { value: 'large', label: 'Large Data Center', kW: 2000, description: 'Research computing hub' },
        { value: 'hpc', label: 'HPC / Supercomputing', kW: 5000, description: 'High-performance computing' }
      ]
    },
    // Q7: Medical Facilities
    {
      use_case_id: collegeId,
      question_text: 'Medical/health facilities',
      field_name: 'medicalFacilities',
      question_type: 'select',
      default_value: 'health_center',
      is_required: false,
      help_text: 'Campus health services and medical schools',
      display_order: 7,
      options: [
        { value: 'none', label: 'None', kW: 0, description: 'No medical facilities' },
        { value: 'health_center', label: 'Student Health Center', kW: 100, description: 'Basic medical services' },
        { value: 'medical_school', label: 'Medical School', kW: 500, description: 'Teaching hospital or clinic' },
        { value: 'university_hospital', label: 'University Hospital', kW: 3000, description: 'Full hospital facility' }
      ]
    },
    // Q8: Athletic Facilities
    {
      use_case_id: collegeId,
      question_text: 'Athletic facilities',
      field_name: 'athleticFacilities',
      question_type: 'select',
      default_value: 'standard',
      is_required: false,
      help_text: 'Gyms, pools, stadiums',
      display_order: 8,
      options: [
        { value: 'basic', label: 'Basic Gym Only', kW: 100, description: 'Single fitness center' },
        { value: 'standard', label: 'Standard Athletics', kW: 400, description: 'Gym, pool, fields' },
        { value: 'division_1', label: 'Division I Athletics', kW: 1000, description: 'Stadium, multiple venues' },
        { value: 'major_athletics', label: 'Major Athletics Program', kW: 2500, description: 'Large stadium, arena, training facilities' }
      ]
    },
    // Q9: Operating Hours
    {
      use_case_id: collegeId,
      question_text: 'Primary operating pattern',
      field_name: 'operatingPattern',
      question_type: 'select',
      default_value: 'standard_academic',
      is_required: false,
      help_text: 'Affects load profile shape',
      display_order: 9,
      options: [
        { value: 'day_only', label: 'Day Classes Only', description: 'Minimal evening/weekend use' },
        { value: 'standard_academic', label: 'Standard Academic', description: 'Day + evening, reduced weekends' },
        { value: 'extended_hours', label: 'Extended Hours', description: '7am-11pm daily operations' },
        { value: '24_7', label: '24/7 Research Campus', description: 'Round-the-clock operations' }
      ]
    },
    // Q10: Central Plant
    {
      use_case_id: collegeId,
      question_text: 'Central plant type',
      field_name: 'centralPlant',
      question_type: 'select',
      default_value: 'chilled_water',
      is_required: false,
      help_text: 'Campus heating/cooling infrastructure',
      display_order: 10,
      options: [
        { value: 'distributed', label: 'Distributed HVAC', description: 'Individual building systems' },
        { value: 'chilled_water', label: 'Central Chilled Water', description: 'Centralized cooling plant' },
        { value: 'central_steam', label: 'Central Chiller + Steam', description: 'Chilled water + steam heat' },
        { value: 'cogeneration', label: 'Cogeneration / CHP', description: 'Combined heat and power plant' }
      ]
    },
    // Q11: Peak Demand Known
    {
      use_case_id: collegeId,
      question_text: 'Do you know your peak demand?',
      field_name: 'peakDemandKnown',
      question_type: 'select',
      default_value: 'no',
      is_required: false,
      help_text: 'From utility bills - helps us be more accurate',
      display_order: 11,
      options: [
        { value: 'yes', label: 'Yes, I know the exact value' },
        { value: 'approximately', label: 'Approximately' },
        { value: 'no', label: 'No, please estimate' }
      ]
    },
    // Q12: Peak Demand Value
    {
      use_case_id: collegeId,
      question_text: 'Peak demand (kW)',
      field_name: 'peakDemandValue',
      question_type: 'number',
      default_value: '2000',
      is_required: false,
      help_text: 'Maximum kW from utility bill (typical: 500 kW - 10 MW)',
      display_order: 12,
      options: { min_value: 100, max_value: 15000, step: 100, unit: ' kW' }
    },
    // Q13: Do you have solar?
    {
      use_case_id: collegeId,
      question_text: 'Do you have solar installed?',
      field_name: 'hasSolar',
      question_type: 'toggle',
      default_value: 'false',
      is_required: true,
      help_text: 'Current on-campus solar installation',
      display_order: 13,
      options: { showWhen: 'always' }
    },
    // Q14: How much solar? (if hasSolar=true) OR Want solar? (if hasSolar=false)
    {
      use_case_id: collegeId,
      question_text: 'How much solar do you have?',
      field_name: 'existingSolarKW',
      question_type: 'select',
      default_value: '500',
      is_required: false,
      help_text: 'Current installed solar capacity',
      display_order: 14,
      options: [
        { value: '100', label: '~100 kW', kW: 100, description: 'Small pilot installation' },
        { value: '250', label: '~250 kW', kW: 250, description: 'Single building rooftop' },
        { value: '500', label: '~500 kW', kW: 500, description: 'Multi-building installation' },
        { value: '1000', label: '~1 MW', kW: 1000, description: 'Medium campus array' },
        { value: '2000', label: '~2 MW', kW: 2000, description: 'Large campus installation' },
        { value: '5000', label: '5+ MW', kW: 5000, description: 'Utility-scale campus solar' }
      ]
    },
    // Q15: Want solar?
    {
      use_case_id: collegeId,
      question_text: 'Would you like to add solar?',
      field_name: 'wantSolar',
      question_type: 'toggle',
      default_value: 'true',
      is_required: false,
      help_text: 'Solar pairs well with BESS for maximum savings',
      display_order: 15,
      options: { showWhen: { field: 'hasSolar', equals: false } }
    },
    // Q16: How much solar do you want?
    {
      use_case_id: collegeId,
      question_text: 'How much solar would you like?',
      field_name: 'desiredSolarKW',
      question_type: 'select',
      default_value: '1000',
      is_required: false,
      help_text: 'Recommended: Match to peak demand or available roof space',
      display_order: 16,
      options: [
        { value: '250', label: '~250 kW', kW: 250, description: 'Start small, expand later' },
        { value: '500', label: '~500 kW', kW: 500, description: 'Cover 10-20% of demand' },
        { value: '1000', label: '~1 MW', kW: 1000, description: 'Cover 20-30% of demand' },
        { value: '2000', label: '~2 MW', kW: 2000, description: 'Cover 30-50% of demand' },
        { value: '5000', label: '~5 MW', kW: 5000, description: 'Major campus installation' },
        { value: '10000', label: '10+ MW', kW: 10000, description: 'Utility-scale (ground mount)' }
      ]
    },
    // Q17: Do you have EV chargers?
    {
      use_case_id: collegeId,
      question_text: 'Do you have EV chargers installed?',
      field_name: 'hasEVChargers',
      question_type: 'toggle',
      default_value: 'false',
      is_required: true,
      help_text: 'Current campus EV charging infrastructure',
      display_order: 17,
      options: { showWhen: 'always' }
    },
    // Q18: How many EV chargers?
    {
      use_case_id: collegeId,
      question_text: 'How many EV chargers do you have?',
      field_name: 'existingEVChargers',
      question_type: 'select',
      default_value: '10',
      is_required: false,
      help_text: 'Current Level 2 charger count',
      display_order: 18,
      options: [
        { value: '5', label: '1-5 chargers', count: 5, kW: 36, description: 'Small pilot program' },
        { value: '10', label: '6-10 chargers', count: 10, kW: 72, description: 'Growing fleet' },
        { value: '25', label: '11-25 chargers', count: 25, kW: 180, description: 'Medium deployment' },
        { value: '50', label: '26-50 chargers', count: 50, kW: 360, description: 'Campus-wide network' },
        { value: '100', label: '50+ chargers', count: 100, kW: 720, description: 'Major EV infrastructure' }
      ]
    },
    // Q19: Want EV chargers?
    {
      use_case_id: collegeId,
      question_text: 'Would you like to add EV chargers?',
      field_name: 'wantEVChargers',
      question_type: 'toggle',
      default_value: 'true',
      is_required: false,
      help_text: 'EV charging is a top request from students, staff, and visitors',
      display_order: 19,
      options: { showWhen: { field: 'hasEVChargers', equals: false } }
    },
    // Q20: How many EV chargers do you want?
    {
      use_case_id: collegeId,
      question_text: 'How many EV chargers would you like?',
      field_name: 'desiredEVChargers',
      question_type: 'select',
      default_value: '20',
      is_required: false,
      help_text: 'Level 2 chargers (7.2 kW each). BESS helps manage charging demand.',
      display_order: 20,
      options: [
        { value: '10', label: '~10 chargers', count: 10, kW: 72, description: 'Start small, test demand' },
        { value: '20', label: '~20 chargers', count: 20, kW: 144, description: 'Cover key parking areas' },
        { value: '50', label: '~50 chargers', count: 50, kW: 360, description: 'Campus-wide coverage' },
        { value: '100', label: '~100 chargers', count: 100, kW: 720, description: 'Major EV hub' },
        { value: '200', label: '200+ chargers', count: 200, kW: 1440, description: 'Full electrification goal' }
      ]
    },
    // Q21: Sustainability Goal
    {
      use_case_id: collegeId,
      question_text: 'Sustainability commitment',
      field_name: 'sustainabilityGoal',
      question_type: 'select',
      default_value: 'carbon_reduction',
      is_required: false,
      help_text: 'Many universities have carbon-neutral pledges',
      display_order: 21,
      options: [
        { value: 'none', label: 'None Formal', description: 'No formal sustainability goals' },
        { value: 'carbon_reduction', label: 'Carbon Reduction Plan', description: 'Working to reduce emissions' },
        { value: 'net_zero_2030', label: 'Net-Zero by 2030', description: 'Aggressive carbon neutrality target' },
        { value: 'net_zero_2040', label: 'Net-Zero by 2040', description: 'Long-term carbon neutrality goal' }
      ]
    },
    // Q22: Backup Power
    {
      use_case_id: collegeId,
      question_text: 'Critical backup power needs',
      field_name: 'backupPowerNeeds',
      question_type: 'select',
      default_value: 'research_labs',
      is_required: true,
      help_text: 'What must stay powered during outages?',
      display_order: 22,
      options: [
        { value: 'it_data_only', label: 'IT/Data Only', criticalPercent: 0.15, description: 'Data centers and network equipment' },
        { value: 'research_labs', label: 'Research Labs', criticalPercent: 0.30, description: 'Labs + IT infrastructure' },
        { value: 'medical_research', label: 'Medical + Research', criticalPercent: 0.50, description: 'Health facilities, labs, and IT' },
        { value: 'full_campus', label: 'Full Campus', criticalPercent: 0.85, description: 'All critical facilities' }
      ]
    }
  ];
  
  console.log(`\n📝 Inserting ${questions.length} questions...`);
  
  const { data: inserted, error: insertError } = await supabase
    .from('custom_questions')
    .insert(questions)
    .select();
    
  if (insertError) {
    console.error('❌ Insert error:', insertError);
    return;
  }
  
  console.log(`✅ Inserted ${inserted.length} questions successfully!`);
  
  // Show summary
  console.log('\n📊 Question Summary:');
  console.log('   Q1-Q10: Campus basics (type, size, facilities)');
  console.log('   Q11-Q12: Peak demand');
  console.log('   Q13-Q16: ☀️ SOLAR (has? how much? want? how much?)');
  console.log('   Q17-Q20: ⚡ EV CHARGING (has? how many? want? how many?)');
  console.log('   Q21-Q22: Goals & backup needs');
  console.log('\n🎉 College migration complete!');
}

runCollegeMigration().catch(console.error);
