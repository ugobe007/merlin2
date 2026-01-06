-- =============================================================================
-- UPDATE CAR WASH QUESTIONS TO INDUSTRY STANDARD NOMENCLATURE
-- Based on Vineet feedback - January 6, 2026
-- =============================================================================

-- First, delete old car wash questions
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- Insert updated questions with industry terminology
-- Section 1: Facility Basics
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, options, default_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Type of car wash facility?', 
  'facilityType', 
  'select',
  '[
    {"value": "iba", "label": "In-Bay Automatic (IBA)", "icon": "🚗", "description": "Vehicle stationary, machine moves over it. Common at gas stations."},
    {"value": "tunnel_express", "label": "Express Tunnel", "icon": "🏎️", "description": "High-speed conveyor, exterior-only, 80-180 feet. High volume focus."},
    {"value": "tunnel_mini", "label": "Mini-Tunnel", "icon": "🚙", "description": "Shorter conveyor under 60 feet. Smaller lots."},
    {"value": "self_serve", "label": "Self-Serve Bay", "icon": "🧽", "description": "Wand wash - customer performs labor with high-pressure hoses."},
    {"value": "gantry", "label": "Gantry / Truck Wash", "icon": "🚚", "description": "Heavy-duty frame system for trucks and large vehicles."}
  ]'::jsonb,
  'tunnel_express',
  true,
  'Industry classification by how vehicle interacts with machinery',
  1,
  'Facility Basics'
FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name, conditional_field, conditional_value)
SELECT id, 
  'Number of wash bays/tunnels?', 
  'bayCount', 
  'number',
  '1',
  1,
  10,
  true,
  'IBA/Gantry: max 2. Tunnel: max 2. Self-Serve: max 10.',
  2,
  'Facility Basics',
  NULL,
  NULL
FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name, conditional_field, conditional_value)
SELECT id, 
  'Tunnel length (feet)?', 
  'tunnelLength', 
  'number',
  '120',
  40,
  200,
  false,
  'Express tunnels typically 80-180 feet. Mini-tunnels under 60 feet.',
  3,
  'Facility Basics',
  'facilityType',
  '["tunnel_express", "tunnel_mini"]'
FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Average daily vehicles washed?', 
  'dailyVehicles', 
  'slider',
  '150',
  10,
  400,
  true,
  '12hrs × 3min cycle = 240 max/day. Range covers all wash types.',
  4,
  'Facility Basics'
FROM use_cases WHERE slug = 'car-wash';

-- Section 2: Equipment
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Number of vacuum stations?', 
  'vacuumStations', 
  'number',
  '6',
  0,
  20,
  false,
  'Self-service vacuum islands',
  5,
  'Equipment'
FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, options, default_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Blower/dryer configuration?', 
  'blowerType', 
  'select',
  '[
    {"value": "standard_4", "label": "Standard (4 blowers)", "icon": "💨", "energyImpact": "medium"},
    {"value": "premium_6", "label": "Premium (6+ blowers)", "icon": "🌪️", "energyImpact": "high"},
    {"value": "heated", "label": "Heated dryers", "icon": "🔥", "energyImpact": "high"},
    {"value": "none", "label": "No dryers (air dry)", "icon": "☀️", "energyImpact": "low"}
  ]'::jsonb,
  'standard_4',
  true,
  'Drying system configuration affects energy significantly',
  6,
  'Equipment'
FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, options, default_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Water heater type?', 
  'waterHeaterType', 
  'select',
  '[
    {"value": "gas", "label": "Natural Gas", "icon": "🔥", "energyImpact": "low", "description": "Lower electric demand"},
    {"value": "electric", "label": "Electric", "icon": "⚡", "energyImpact": "high", "description": "50-150 kW demand"},
    {"value": "none", "label": "No heated water", "icon": "❄️", "energyImpact": "low"}
  ]'::jsonb,
  'gas',
  true,
  'Electric water heaters add significant peak demand (50-150 kW)',
  7,
  'Equipment'
FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, options, default_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Water reclaim system?', 
  'waterReclaim', 
  'select',
  '[
    {"value": "full", "label": "Full reclaim system", "icon": "♻️", "description": "Recycles 80%+ of water"},
    {"value": "partial", "label": "Partial reclaim", "icon": "💧", "description": "Recycles 40-60%"},
    {"value": "none", "label": "No reclaim (fresh water only)", "icon": "🚰"}
  ]'::jsonb,
  'full',
  false,
  'Reclaim systems add pump load but reduce water costs',
  8,
  'Equipment'
FROM use_cases WHERE slug = 'car-wash';

-- Section 3: Site & Infrastructure
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Total site square footage?', 
  'siteSqFt', 
  'number',
  '15000',
  5000,
  100000,
  true,
  'Total property size including parking and vacuum areas',
  9,
  'Site & Infrastructure'
FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Available roof area for solar (sq ft)?', 
  'roofSqFt', 
  'number',
  '3000',
  0,
  20000,
  false,
  'Unobstructed roof space. Critical for solar sizing.',
  10,
  'Site & Infrastructure'
FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, options, default_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Do you have an existing natural gas line?', 
  'hasNaturalGas', 
  'select',
  '[
    {"value": "yes", "label": "Yes", "icon": "✅"},
    {"value": "no", "label": "No", "icon": "❌"},
    {"value": "unknown", "label": "Unknown", "icon": "❓"}
  ]'::jsonb,
  'yes',
  false,
  'Affects water heating and generator fuel options',
  11,
  'Site & Infrastructure'
FROM use_cases WHERE slug = 'car-wash';

-- Section 4: Operations
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Operating hours per day?', 
  'operatingHours', 
  'number',
  '12',
  6,
  24,
  true,
  'Hours open for business',
  12,
  'Operations'
FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Days open per week?', 
  'daysPerWeek', 
  'number',
  '7',
  5,
  7,
  true,
  'Typical operating days',
  13,
  'Operations'
FROM use_cases WHERE slug = 'car-wash';

-- Section 5: EV Charging
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Number of Level 2 EV chargers?', 
  'evL2Count', 
  'number',
  '0',
  0,
  20,
  false,
  'Level 2 chargers (7-19 kW each)',
  14,
  'EV Charging'
FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
SELECT id, 
  'Number of DC Fast Chargers?', 
  'evDcfcCount', 
  'number',
  '0',
  0,
  10,
  false,
  'DC Fast chargers (50-150 kW each)',
  15,
  'EV Charging'
FROM use_cases WHERE slug = 'car-wash';

-- Verify
SELECT 
  section_name,
  COUNT(*) as questions
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash')
GROUP BY section_name
ORDER BY MIN(display_order);
