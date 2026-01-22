-- =============================================================================
-- CAR WASH ENERGY INTELLIGENCE - 16 QUESTION REFINED SET
-- January 21, 2026
-- 
-- Implements Merlin's car wash questionnaire based on engineering specification
-- Accurately reconstructs load from topology, equipment, and operations
-- Avoids multi-tunnel bias, defaults to single bay/tunnel
-- Directly feeds BESS sizing logic with confidence tracking
-- =============================================================================

-- Delete existing car wash questions
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- =============================================================================
-- Q1: CAR WASH TYPE (Topology Anchor)
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
  'What type of car wash do you operate?',
  'carWashType',
  'select',
  '[
    {
      "value": "self_serve",
      "label": "Self-serve (coin-op bays)",
      "icon": "🧽",
      "description": "Customer wand wash with high-pressure equipment"
    },
    {
      "value": "automatic_inbay",
      "label": "Automatic in-bay",
      "icon": "🚗",
      "description": "Vehicle stationary, machine moves over it"
    },
    {
      "value": "conveyor_tunnel",
      "label": "Conveyor tunnel (single tunnel)",
      "icon": "🏎️",
      "description": "Single tunnel with conveyor system"
    },
    {
      "value": "combination",
      "label": "Combination (self-serve + in-bay)",
      "icon": "🎯",
      "description": "Multiple wash types on one site"
    },
    {
      "value": "other",
      "label": "Other",
      "icon": "🔧",
      "description": "Custom or specialized configuration"
    }
  ]'::jsonb,
  'automatic_inbay',
  true,
  'Sets baseline load model and duty cycle logic',
  1,
  'Topology'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q2: NUMBER OF BAYS / TUNNELS (Concurrency Factor)
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
  'How many active wash bays or tunnels do you have?',
  'bayTunnelCount',
  'select',
  '[
    {"value": "1", "label": "1", "icon": "1️⃣"},
    {"value": "2-3", "label": "2–3", "icon": "2️⃣"},
    {"value": "4-6", "label": "4–6", "icon": "4️⃣"},
    {"value": "7+", "label": "7+", "icon": "7️⃣"}
  ]'::jsonb,
  '1',
  true,
  'Determines concurrency factor (most Merlin math assumes 1 unless >1 explicitly)',
  2,
  'Topology'
FROM use_cases WHERE slug = 'car-wash';

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
  'What is your electrical service rating?',
  'electricalServiceSize',
  'select',
  '[
    {"value": "200", "label": "200A", "icon": "🔌", "kW": 48},
    {"value": "400", "label": "400A", "icon": "⚡", "kW": 96},
    {"value": "600", "label": "600A", "icon": "🔋", "kW": 144},
    {"value": "800+", "label": "800A+", "icon": "⚙️", "kW": 192},
    {"value": "not_sure", "label": "Not sure", "icon": "❓"}
  ]'::jsonb,
  '400',
  true,
  'Upper bound constraint for BESS + charger interop',
  3,
  'Infrastructure'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q4: VOLTAGE LEVEL (PCS Compatibility)
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
  'What voltage does your site use?',
  'voltageLevel',
  'select',
  '[
    {"value": "208", "label": "208V", "icon": "🔌"},
    {"value": "240", "label": "240V", "icon": "⚡"},
    {"value": "277_480", "label": "277/480V", "icon": "🔋"},
    {"value": "mixed", "label": "Mixed", "icon": "⚙️"},
    {"value": "not_sure", "label": "Not sure", "icon": "❓"}
  ]'::jsonb,
  '277_480',
  true,
  'PCS compatibility + inverter sizing (default 480V if not sure)',
  4,
  'Infrastructure'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q5: PRIMARY WASH EQUIPMENT (Bottom-up Load Reconstruction)
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
  'Which major electrical loads do you have? (Check all that apply)',
  'primaryEquipment',
  'multi-select',
  '[
    {"value": "high_pressure_pumps", "label": "High-pressure pumps", "icon": "💦", "kW": 20},
    {"value": "conveyor_motor", "label": "Conveyor motor", "icon": "🔄", "kW": 15},
    {"value": "blowers_dryers", "label": "Blowers / dryers", "icon": "💨", "kW": 40},
    {"value": "ro_system", "label": "RO system", "icon": "💧", "kW": 10},
    {"value": "water_heaters_electric", "label": "Water heaters (electric)", "icon": "🔥", "kW": 50},
    {"value": "lighting", "label": "Lighting", "icon": "💡", "kW": 5},
    {"value": "vacuum_stations", "label": "Vacuum stations", "icon": "🌀", "kW": 15},
    {"value": "pos_controls", "label": "POS / controls", "icon": "💻", "kW": 2},
    {"value": "air_compressors", "label": "Air compressors", "icon": "⚙️", "kW": 10}
  ]'::jsonb,
  '["high_pressure_pumps", "blowers_dryers", "lighting", "pos_controls"]',
  true,
  'Bottom-up load reconstruction (flags resistive vs inductive loads)',
  5,
  'Equipment'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q6: LARGEST MOTOR SIZE (Peak Surge Modeling)
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
  'What is the largest motor on site (approx)?',
  'largestMotorSize',
  'select',
  '[
    {"value": "<10", "label": "<10 HP", "icon": "🔌", "kW": 7},
    {"value": "10-25", "label": "10–25 HP", "icon": "⚡", "kW": 18},
    {"value": "25-50", "label": "25–50 HP", "icon": "🔋", "kW": 37},
    {"value": "50-100", "label": "50–100 HP", "icon": "⚙️", "kW": 75},
    {"value": "100+", "label": "100+ HP", "icon": "🏭", "kW": 100},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "kW": 25}
  ]'::jsonb,
  '10-25',
  true,
  'Peak surge modeling + soft-start requirement (default 25 HP if not sure)',
  6,
  'Equipment'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q7: SIMULTANEOUS EQUIPMENT OPERATION (True Peak Load)
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
  'How many major machines run at the same time during a wash?',
  'simultaneousEquipment',
  'select',
  '[
    {"value": "1-2", "label": "1–2", "icon": "1️⃣", "concurrency": 0.5},
    {"value": "3-4", "label": "3–4", "icon": "3️⃣", "concurrency": 0.75},
    {"value": "5-7", "label": "5–7", "icon": "5️⃣", "concurrency": 0.9},
    {"value": "8+", "label": "8+", "icon": "8️⃣", "concurrency": 1.0}
  ]'::jsonb,
  '3-4',
  true,
  'True peak load (not nameplate fantasy) - default 3 machines if not sure',
  7,
  'Operations'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q8: AVERAGE WASHES PER DAY (Energy Throughput)
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
  'How many cars do you wash on an average day?',
  'averageWashesPerDay',
  'select',
  '[
    {"value": "<30", "label": "<30", "icon": "🚗"},
    {"value": "30-75", "label": "30–75", "icon": "🚕"},
    {"value": "75-150", "label": "75–150", "icon": "🚙"},
    {"value": "150-300", "label": "150–300", "icon": "🚐"},
    {"value": "300+", "label": "300+", "icon": "🚛"}
  ]'::jsonb,
  '75-150',
  true,
  'Energy throughput + ROI + duty cycle',
  8,
  'Operations'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q9: PEAK HOUR THROUGHPUT (Short-term Peak Demand)
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
  'During your busiest hour, how many cars do you process?',
  'peakHourThroughput',
  'select',
  '[
    {"value": "<10", "label": "<10", "icon": "🚗"},
    {"value": "10-25", "label": "10–25", "icon": "🚕"},
    {"value": "25-50", "label": "25–50", "icon": "🚙"},
    {"value": "50+", "label": "50+", "icon": "🚐"}
  ]'::jsonb,
  '10-25',
  true,
  'Determines short-term peak demand',
  9,
  'Operations'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q10: WASH CYCLE DURATION (Load Curve Conversion)
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
  'How long is one full wash cycle?',
  'washCycleDuration',
  'select',
  '[
    {"value": "<3", "label": "<3 minutes", "icon": "⏱️", "minutes": 2},
    {"value": "3-5", "label": "3–5 minutes", "icon": "⏰", "minutes": 4},
    {"value": "5-8", "label": "5–8 minutes", "icon": "⏲️", "minutes": 6},
    {"value": "8-12", "label": "8–12 minutes", "icon": "🕐", "minutes": 10},
    {"value": "12+", "label": "12+ minutes", "icon": "🕰️", "minutes": 15}
  ]'::jsonb,
  '3-5',
  true,
  'Converts throughput → kWh → load curve (default 5 min if not sure)',
  10,
  'Operations'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q11: OPERATING HOURS (Load Spreading)
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
  'What are your typical daily operating hours?',
  'operatingHours',
  'select',
  '[
    {"value": "<8", "label": "<8 hrs/day", "icon": "🕐", "hours": 6},
    {"value": "8-12", "label": "8–12 hrs/day", "icon": "🕔", "hours": 10},
    {"value": "12-18", "label": "12–18 hrs/day", "icon": "🕘", "hours": 15},
    {"value": "18-24", "label": "18–24 hrs/day", "icon": "🕛", "hours": 21}
  ]'::jsonb,
  '8-12',
  true,
  'Load spreading + arbitrage logic',
  11,
  'Operations'
FROM use_cases WHERE slug = 'car-wash';

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
    {"value": "<1000", "label": "<$1,000", "icon": "💵"},
    {"value": "1000-3000", "label": "$1,000–$3,000", "icon": "💰"},
    {"value": "3000-7500", "label": "$3,000–$7,500", "icon": "💳"},
    {"value": "7500-15000", "label": "$7,500–$15,000", "icon": "💸"},
    {"value": "15000+", "label": "$15,000+", "icon": "🏦"},
    {"value": "not_sure", "label": "Not sure", "icon": "❓"}
  ]'::jsonb,
  '3000-7500',
  true,
  'ROI calibration anchor (also catches hidden loads)',
  12,
  'Financial'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q13: UTILITY RATE STRUCTURE (Real Savings vs Cosmetics)
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
  'Determines whether BESS creates real savings or just cosmetics',
  13,
  'Financial'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q14: POWER QUALITY ISSUES (Resilience Positioning)
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
    {"value": "breaker_trips", "label": "Breaker trips", "icon": "⚠️"},
    {"value": "voltage_sag", "label": "Voltage sag during peak use", "icon": "📉"},
    {"value": "utility_penalties", "label": "Utility penalties", "icon": "💰"},
    {"value": "equipment_brownouts", "label": "Equipment brownouts", "icon": "💡"},
    {"value": "none", "label": "None", "icon": "✅"}
  ]'::jsonb,
  '["none"]',
  false,
  'Power conditioning + resilience positioning',
  14,
  'Resilience'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- Q15: OUTAGE SENSITIVITY (Backup Runtime)
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
  'If power goes out, what happens to your business?',
  'outageSensitivity',
  'select',
  '[
    {"value": "operations_stop", "label": "Operations stop entirely", "icon": "🛑", "backupHours": 4},
    {"value": "partial_operations", "label": "Partial operations only", "icon": "⚠️", "backupHours": 2},
    {"value": "minor_disruption", "label": "Minor disruption", "icon": "📉", "backupHours": 1},
    {"value": "no_impact", "label": "No impact", "icon": "✅", "backupHours": 0}
  ]'::jsonb,
  'operations_stop',
  true,
  'Backup runtime requirement + resilience ROI justification',
  15,
  'Resilience'
FROM use_cases WHERE slug = 'car-wash';

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
    {"value": "add_bay_tunnel", "label": "Adding another bay/tunnel", "icon": "➕", "kWIncrease": 50},
    {"value": "larger_equipment", "label": "Larger blowers or pumps", "icon": "⬆️", "kWIncrease": 30},
    {"value": "ev_chargers", "label": "EV chargers", "icon": "🔌", "kWIncrease": 50},
    {"value": "more_vacuums", "label": "More vacuums", "icon": "🌀", "kWIncrease": 10},
    {"value": "solar", "label": "Solar", "icon": "☀️", "kWIncrease": 0},
    {"value": "none", "label": "No expansion planned", "icon": "✅", "kWIncrease": 0}
  ]'::jsonb,
  '["none"]',
  false,
  'Future-proof BESS sizing (prevents undersizing trap)',
  16,
  'Planning'
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
SELECT 
  section_name,
  COUNT(*) as question_count,
  STRING_AGG(field_name, ', ' ORDER BY display_order) as fields
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash')
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
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash')
ORDER BY display_order;
