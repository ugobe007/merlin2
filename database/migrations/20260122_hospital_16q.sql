-- =============================================================================
-- HOSPITAL ENERGY INTELLIGENCE - 16 QUESTION REFINED SET
-- January 22, 2026
-- 
-- Implements Merlin's hospital questionnaire based on engineering specification
-- Accurately reconstructs load from bed count, critical systems, and operations
-- Directly feeds BESS sizing logic with confidence tracking
-- =============================================================================

-- Delete existing hospital questions
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

-- =============================================================================
-- Q1: HOSPITAL TYPE (Topology Anchor)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'What type of healthcare facility do you operate?',
  'facilityType',
  'select',
  '[
    {
      "value": "general_hospital",
      "label": "General hospital",
      "icon": "🏥",
      "description": "Full-service acute care",
      "kWPerBed": 8
    },
    {
      "value": "critical_access",
      "label": "Critical access hospital",
      "icon": "🏨",
      "description": "Rural, limited services",
      "kWPerBed": 6
    },
    {
      "value": "specialty",
      "label": "Specialty hospital",
      "icon": "🔬",
      "description": "Cardiac, orthopedic, etc.",
      "kWPerBed": 10
    },
    {
      "value": "teaching",
      "label": "Teaching/research hospital",
      "icon": "🎓",
      "description": "Academic medical center",
      "kWPerBed": 12
    },
    {
      "value": "outpatient",
      "label": "Outpatient center",
      "icon": "🏢",
      "description": "Surgical center, imaging",
      "kWPerBed": 5
    }
  ]'::jsonb,
  'general_hospital',
  true,
  'Sets baseline energy intensity (kW/bed)',
  1,
  'Topology'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q2: BED COUNT (Scale Factor)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'How many licensed beds does your facility have?',
  'bedCount',
  'select',
  '[
    {"value": "<50", "label": "<50 beds", "icon": "🏨", "beds": 40},
    {"value": "50-100", "label": "50–100 beds", "icon": "🏥", "beds": 75},
    {"value": "100-250", "label": "100–250 beds", "icon": "🏪", "beds": 175},
    {"value": "250-500", "label": "250–500 beds", "icon": "🏢", "beds": 375},
    {"value": "500+", "label": "500+ beds", "icon": "🏰", "beds": 650}
  ]'::jsonb,
  '100-250',
  true,
  'Primary scale factor for all load calculations',
  2,
  'Topology'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q3: ELECTRICAL SERVICE SIZE (Constraint Boundary)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'What is your main electrical service rating?',
  'electricalServiceSize',
  'select',
  '[
    {"value": "1200", "label": "1200A", "icon": "🔌", "kW": 288},
    {"value": "2000", "label": "2000A", "icon": "⚡", "kW": 480},
    {"value": "3000", "label": "3000A", "icon": "🔋", "kW": 720},
    {"value": "4000+", "label": "4000A+", "icon": "⚙️", "kW": 960},
    {"value": "medium_voltage", "label": "Medium voltage", "icon": "🏭", "kW": 2000},
    {"value": "not_sure", "label": "Not sure", "icon": "❓"}
  ]'::jsonb,
  '2000',
  true,
  'Large hospitals often have medium voltage (4160V)',
  3,
  'Infrastructure'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q4: EMERGENCY GENERATOR CAPACITY (Backup Context)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'What is your emergency generator capacity?',
  'generatorCapacity',
  'select',
  '[
    {"value": "none", "label": "No generator", "icon": "❌", "kW": 0},
    {"value": "<500", "label": "<500 kW", "icon": "🔌", "kW": 350},
    {"value": "500-1000", "label": "500–1,000 kW", "icon": "⚡", "kW": 750},
    {"value": "1000-2000", "label": "1–2 MW", "icon": "🔋", "kW": 1500},
    {"value": "2000+", "label": "2+ MW", "icon": "🏭", "kW": 3000},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "kW": 750}
  ]'::jsonb,
  '1000-2000',
  true,
  'Generator size indicates critical load (NEC 517 requirement)',
  4,
  'Infrastructure'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q5: CRITICAL SYSTEMS (Load Profile)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'Which critical systems do you have? (Check all that apply)',
  'criticalSystems',
  'multi-select',
  '[
    {"value": "or_suites", "label": "Operating rooms", "icon": "🏥", "kW": 100},
    {"value": "icu", "label": "ICU/CCU", "icon": "💉", "kW": 80},
    {"value": "emergency_dept", "label": "Emergency department", "icon": "🚑", "kW": 75},
    {"value": "imaging", "label": "Imaging (MRI, CT, X-ray)", "icon": "🔬", "kW": 150},
    {"value": "lab", "label": "Laboratory", "icon": "🧪", "kW": 50},
    {"value": "pharmacy", "label": "Pharmacy (refrigeration)", "icon": "💊", "kW": 30},
    {"value": "kitchen", "label": "Kitchen/food service", "icon": "🍽️", "kW": 100},
    {"value": "laundry", "label": "On-site laundry", "icon": "🧺", "kW": 120},
    {"value": "data_center", "label": "Data center/IT", "icon": "💻", "kW": 80}
  ]'::jsonb,
  '["or_suites", "icu", "emergency_dept", "imaging"]',
  true,
  'Critical systems must stay powered during outages',
  5,
  'Equipment'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q6: HVAC SYSTEM TYPE (Largest Load)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'What type of HVAC system do you have?',
  'hvacType',
  'select',
  '[
    {"value": "central_chiller", "label": "Central chiller plant", "icon": "🏭", "multiplier": 1.2},
    {"value": "rooftop_units", "label": "Rooftop units (RTUs)", "icon": "🏢", "multiplier": 1.0},
    {"value": "vrf", "label": "VRF/VRV system", "icon": "⚙️", "multiplier": 0.9},
    {"value": "hybrid", "label": "Hybrid system", "icon": "🔄", "multiplier": 1.1},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "multiplier": 1.0}
  ]'::jsonb,
  'central_chiller',
  true,
  'HVAC typically 30-40% of hospital energy load',
  6,
  'Equipment'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q7: OCCUPANCY RATE (Load Scaling)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'What is your average patient occupancy rate?',
  'occupancyRate',
  'select',
  '[
    {"value": "<40", "label": "<40%", "icon": "📉", "concurrency": 0.6},
    {"value": "40-60", "label": "40–60%", "icon": "📊", "concurrency": 0.7},
    {"value": "60-80", "label": "60–80%", "icon": "📈", "concurrency": 0.8},
    {"value": "80+", "label": "80%+", "icon": "🔥", "concurrency": 0.9}
  ]'::jsonb,
  '60-80',
  true,
  'Occupied beds use more energy (HVAC, lighting, equipment)',
  7,
  'Operations'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q8: SURGICAL VOLUME (Peak Demand Indicator)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'How many surgical procedures per day (average)?',
  'surgicalVolume',
  'select',
  '[
    {"value": "none", "label": "None (outpatient only)", "icon": "🏢", "procedures": 0},
    {"value": "<10", "label": "<10 procedures", "icon": "🏥", "procedures": 7},
    {"value": "10-25", "label": "10–25 procedures", "icon": "🔬", "procedures": 17},
    {"value": "25-50", "label": "25–50 procedures", "icon": "⚕️", "procedures": 37},
    {"value": "50+", "label": "50+ procedures", "icon": "🏭", "procedures": 65}
  ]'::jsonb,
  '10-25',
  true,
  'ORs are highest energy intensity spaces (lights, HVAC, equipment)',
  8,
  'Operations'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q9: IMAGING UTILIZATION (Load Duration)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'How many imaging studies per day (X-ray, CT, MRI)?',
  'imagingVolume',
  'select',
  '[
    {"value": "none", "label": "None (no imaging)", "icon": "❌", "studies": 0},
    {"value": "<25", "label": "<25 studies", "icon": "📸", "studies": 15},
    {"value": "25-75", "label": "25–75 studies", "icon": "🔬", "studies": 50},
    {"value": "75-150", "label": "75–150 studies", "icon": "🏥", "studies": 110},
    {"value": "150+", "label": "150+ studies", "icon": "🏭", "studies": 200}
  ]'::jsonb,
  '25-75',
  true,
  'MRI/CT scanners are high peak loads (50-100 kW each)',
  9,
  'Operations'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q10: OPERATING SCHEDULE (Load Curve Shape)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'What is your operational profile?',
  'operatingSchedule',
  'select',
  '[
    {"value": "24_7_full", "label": "24/7 full services", "icon": "🕛", "concurrency": 0.9},
    {"value": "24_7_ed_only", "label": "24/7 ED, limited nights", "icon": "🚑", "concurrency": 0.7},
    {"value": "business_hours", "label": "Business hours only", "icon": "🕔", "concurrency": 0.5},
    {"value": "surgical_only", "label": "Surgical center (daytime)", "icon": "🔬", "concurrency": 0.4}
  ]'::jsonb,
  '24_7_ed_only',
  true,
  'Determines base load vs peak load ratio',
  10,
  'Operations'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q11: PEAK DEMAND PERIOD (TOU Alignment)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'When does your facility experience peak energy demand?',
  'peakDemandPeriod',
  'select',
  '[
    {"value": "morning", "label": "Morning (6–10 AM)", "icon": "🌅", "peakHour": 8},
    {"value": "midday", "label": "Midday (10 AM–4 PM)", "icon": "☀️", "peakHour": 13},
    {"value": "afternoon", "label": "Afternoon (2–6 PM)", "icon": "🌇", "peakHour": 16},
    {"value": "evening", "label": "Evening surge (6–10 PM)", "icon": "🌃", "peakHour": 19},
    {"value": "relatively_flat", "label": "Relatively flat 24/7", "icon": "📊", "peakHour": 14}
  ]'::jsonb,
  'midday',
  true,
  'Peak demand timing determines BESS discharge strategy',
  11,
  'Operations'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q12: MONTHLY ELECTRICITY SPEND (ROI Calibration)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'What is your average monthly electricity bill?',
  'monthlyElectricitySpend',
  'select',
  '[
    {"value": "<25000", "label": "<$25,000", "icon": "💵"},
    {"value": "25000-75000", "label": "$25,000–$75,000", "icon": "💰"},
    {"value": "75000-150000", "label": "$75,000–$150,000", "icon": "💳"},
    {"value": "150000-300000", "label": "$150,000–$300,000", "icon": "💸"},
    {"value": "300000+", "label": "$300,000+", "icon": "🏦"},
    {"value": "not_sure", "label": "Not sure", "icon": "❓"}
  ]'::jsonb,
  '75000-150000',
  true,
  'Hospitals spend $1-3 per sq ft per year on energy',
  12,
  'Financial'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q13: UTILITY RATE STRUCTURE (Savings Potential)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'What best describes your utility billing?',
  'utilityRateStructure',
  'select',
  '[
    {"value": "flat", "label": "Flat rate only", "icon": "📊", "savingsMultiplier": 0.5},
    {"value": "tou", "label": "Time-of-use (TOU)", "icon": "🕐", "savingsMultiplier": 0.8},
    {"value": "demand", "label": "Demand charges", "icon": "⚡", "savingsMultiplier": 1.0},
    {"value": "tou_demand", "label": "TOU + demand charges", "icon": "🎯", "savingsMultiplier": 1.2},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "savingsMultiplier": 0.8}
  ]'::jsonb,
  'demand',
  true,
  'Demand charges can be 30-50% of hospital electricity cost',
  13,
  'Financial'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q14: POWER QUALITY CONCERNS (Resilience Value)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'Do you experience any of the following? (Check all that apply)',
  'powerQualityIssues',
  'multi-select',
  '[
    {"value": "voltage_sag", "label": "Voltage sag/flicker", "icon": "📉"},
    {"value": "harmonics", "label": "Harmonic distortion", "icon": "🌊"},
    {"value": "generator_switchover", "label": "Bumps during generator tests", "icon": "⚠️"},
    {"value": "equipment_trips", "label": "Equipment trips/shutdowns", "icon": "🛑"},
    {"value": "imaging_interference", "label": "Imaging equipment interference", "icon": "🔬"},
    {"value": "none", "label": "None", "icon": "✅"}
  ]'::jsonb,
  '["none"]',
  false,
  'BESS provides power conditioning + seamless backup transition',
  14,
  'Resilience'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q15: OUTAGE CRITICALITY (Backup Requirement)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'What is your backup power requirement?',
  'outageSensitivity',
  'select',
  '[
    {"value": "life_safety", "label": "Life safety systems (NEC 517)", "icon": "🚨", "backupHours": 24},
    {"value": "full_operations", "label": "Full operations continuity", "icon": "🏥", "backupHours": 12},
    {"value": "critical_only", "label": "Critical systems only", "icon": "⚠️", "backupHours": 6},
    {"value": "minimal", "label": "Minimal (outpatient)", "icon": "🏢", "backupHours": 2}
  ]'::jsonb,
  'life_safety',
  true,
  'NEC 517 requires life safety systems + generator + 10-second transfer',
  15,
  'Resilience'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- Q16: EXPANSION PLANS (Future-proof Sizing)
-- =============================================================================
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name, 
  question_type, 
  options, 
  default_value, 
  is_required, 
  help_text, 
  display_order, 
  section_name
)
SELECT 
  id,
  'Are you planning any of the following in the next 24 months? (Check all that apply)',
  'expansionPlans',
  'multi-select',
  '[
    {"value": "add_beds", "label": "Adding beds/wing", "icon": "➕", "kWIncrease": 200},
    {"value": "new_or_suite", "label": "New OR suite", "icon": "🏥", "kWIncrease": 100},
    {"value": "imaging_equipment", "label": "Imaging equipment (MRI/CT)", "icon": "🔬", "kWIncrease": 150},
    {"value": "chiller_upgrade", "label": "Chiller/HVAC upgrade", "icon": "❄️", "kWIncrease": 100},
    {"value": "ev_ambulance", "label": "EV ambulance charging", "icon": "🚑", "kWIncrease": 50},
    {"value": "solar", "label": "Solar + storage", "icon": "☀️", "kWIncrease": 0},
    {"value": "none", "label": "No expansion planned", "icon": "✅", "kWIncrease": 0}
  ]'::jsonb,
  '["none"]',
  false,
  'Future-proof BESS sizing prevents costly upgrades',
  16,
  'Planning'
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
SELECT 
  section_name,
  COUNT(*) as question_count,
  STRING_AGG(field_name, ', ' ORDER BY display_order) as fields
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital')
GROUP BY section_name
ORDER BY MIN(display_order);

-- Show all questions
SELECT 
  display_order,
  section_name,
  field_name,
  question_text,
  question_type,
  is_required
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital')
ORDER BY display_order;
