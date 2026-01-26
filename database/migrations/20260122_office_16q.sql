-- =============================================================================
-- OFFICE BUILDING ENERGY INTELLIGENCE - 16 QUESTION REFINED SET
-- January 22, 2026
-- 
-- Implements Merlin's office building questionnaire based on engineering specification
-- Accurately reconstructs load from square footage, tenant type, and HVAC systems
-- Directly feeds BESS sizing logic with confidence tracking
-- =============================================================================

-- Delete existing office questions
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

-- =============================================================================
-- Q1: OFFICE TYPE (Topology Anchor)
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
  'What type of office building do you operate?',
  'officeType',
  'select',
  '[
    {
      "value": "single_tenant",
      "label": "Single tenant",
      "icon": "🏢",
      "description": "Owner-occupied or single company",
      "kWPerSqFt": 1.5
    },
    {
      "value": "multi_tenant",
      "label": "Multi-tenant",
      "icon": "🏪",
      "description": "Multiple leased spaces",
      "kWPerSqFt": 1.3
    },
    {
      "value": "coworking",
      "label": "Coworking/flex space",
      "icon": "💼",
      "description": "Shared workspace, hot desking",
      "kWPerSqFt": 2.0
    },
    {
      "value": "medical_office",
      "label": "Medical office building",
      "icon": "🏥",
      "description": "Healthcare tenants",
      "kWPerSqFt": 2.5
    },
    {
      "value": "tech_office",
      "label": "Tech/data-heavy office",
      "icon": "💻",
      "description": "Server rooms, high equipment load",
      "kWPerSqFt": 3.0
    }
  ]'::jsonb,
  'multi_tenant',
  true,
  'Sets baseline energy intensity (kW/sq ft)',
  1,
  'Topology'
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- Q2: BUILDING SQUARE FOOTAGE (Scale Factor)
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
  'What is the total building square footage?',
  'squareFootage',
  'select',
  '[
    {"value": "<10000", "label": "<10,000 sq ft", "icon": "🏢", "sqft": 7500},
    {"value": "10-25000", "label": "10,000–25,000 sq ft", "icon": "🏪", "sqft": 17500},
    {"value": "25-50000", "label": "25,000–50,000 sq ft", "icon": "🏬", "sqft": 37500},
    {"value": "50-100000", "label": "50,000–100,000 sq ft", "icon": "🏢", "sqft": 75000},
    {"value": "100-250000", "label": "100,000–250,000 sq ft", "icon": "🏰", "sqft": 175000},
    {"value": "250000+", "label": "250,000+ sq ft", "icon": "🏙️", "sqft": 350000}
  ]'::jsonb,
  '50-100000',
  true,
  'Primary scale factor for all load calculations',
  2,
  'Topology'
FROM use_cases WHERE slug = 'office';

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
    {"value": "400", "label": "400A", "icon": "🔌", "kW": 96},
    {"value": "800", "label": "800A", "icon": "⚡", "kW": 192},
    {"value": "1200", "label": "1200A", "icon": "🔋", "kW": 288},
    {"value": "1600", "label": "1600A", "icon": "⚙️", "kW": 384},
    {"value": "2000+", "label": "2000A+", "icon": "🏭", "kW": 480},
    {"value": "not_sure", "label": "Not sure", "icon": "❓"}
  ]'::jsonb,
  '1200',
  true,
  'Upper bound constraint for BESS + tenant improvements',
  3,
  'Infrastructure'
FROM use_cases WHERE slug = 'office';

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
  'What voltage does your building use?',
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
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- Q5: HVAC SYSTEM TYPE (Largest Load)
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
    {"value": "rooftop_units", "label": "Rooftop units (RTUs)", "icon": "🏢", "kWPerSqFt": 0.6},
    {"value": "central_chiller", "label": "Central chiller plant", "icon": "🏭", "kWPerSqFt": 0.7},
    {"value": "vrf", "label": "VRF/VRV system", "icon": "⚙️", "kWPerSqFt": 0.5},
    {"value": "heat_pump", "label": "Heat pumps", "icon": "♨️", "kWPerSqFt": 0.55},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "kWPerSqFt": 0.6}
  ]'::jsonb,
  'rooftop_units',
  true,
  'HVAC typically 40-50% of office building energy load',
  5,
  'Equipment'
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- Q6: ADDITIONAL LOADS (Load Adders)
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
  'Which additional loads does your building have? (Check all that apply)',
  'additionalLoads',
  'multi-select',
  '[
    {"value": "server_room", "label": "Server room", "icon": "💻", "kW": 50},
    {"value": "data_center", "label": "Data center", "icon": "🏭", "kW": 150},
    {"value": "elevators", "label": "Elevators", "icon": "🛗", "kW": 30},
    {"value": "kitchen_cafeteria", "label": "Kitchen/cafeteria", "icon": "🍽️", "kW": 75},
    {"value": "fitness_center", "label": "Fitness center", "icon": "💪", "kW": 20},
    {"value": "parking_garage", "label": "Parking garage (lighting, ventilation)", "icon": "🚗", "kW": 40},
    {"value": "ev_charging", "label": "EV charging stations", "icon": "🔌", "kW": 50},
    {"value": "none", "label": "None", "icon": "✅", "kW": 0}
  ]'::jsonb,
  '["server_room", "elevators"]',
  true,
  'Bottom-up load reconstruction from building amenities',
  6,
  'Equipment'
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- Q7: OCCUPANCY DENSITY (Load Scaling)
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
  'What is your occupancy density?',
  'occupancyDensity',
  'select',
  '[
    {"value": "low", "label": "Low (>250 sq ft/person)", "icon": "🏢", "sqftPerPerson": 300, "multiplier": 0.8},
    {"value": "medium", "label": "Medium (150–250 sq ft/person)", "icon": "🏪", "sqftPerPerson": 200, "multiplier": 1.0},
    {"value": "high", "label": "High (100–150 sq ft/person)", "icon": "🏬", "sqftPerPerson": 125, "multiplier": 1.2},
    {"value": "very_high", "label": "Very high (<100 sq ft/person)", "icon": "💼", "sqftPerPerson": 80, "multiplier": 1.4}
  ]'::jsonb,
  'medium',
  true,
  'Higher density = more equipment, computers, body heat',
  7,
  'Operations'
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- Q8: AVERAGE OCCUPANCY RATE (Concurrency Factor)
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
  'What percentage of the building is typically occupied (leased)?',
  'occupancyRate',
  'select',
  '[
    {"value": "<50", "label": "<50%", "icon": "📉", "concurrency": 0.4},
    {"value": "50-75", "label": "50–75%", "icon": "📊", "concurrency": 0.65},
    {"value": "75-90", "label": "75–90%", "icon": "📈", "concurrency": 0.85},
    {"value": "90+", "label": "90%+", "icon": "🔥", "concurrency": 0.95}
  ]'::jsonb,
  '75-90',
  true,
  'Vacant space uses less energy (no plug loads, lower HVAC)',
  8,
  'Operations'
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- Q9: WORKDAY SCHEDULE (Load Curve Shape)
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
  'What are typical working hours for most tenants?',
  'workdaySchedule',
  'select',
  '[
    {"value": "standard", "label": "Standard (8 AM–6 PM)", "icon": "🕐", "hours": 10, "peakHour": 14},
    {"value": "extended", "label": "Extended (7 AM–7 PM)", "icon": "🕔", "hours": 12, "peakHour": 14},
    {"value": "24_7", "label": "24/7 operations", "icon": "🕛", "hours": 24, "peakHour": 14},
    {"value": "shift_work", "label": "Shift work (multiple peaks)", "icon": "🔄", "hours": 16, "peakHour": 10},
    {"value": "flexible", "label": "Flexible/hybrid schedules", "icon": "💼", "hours": 8, "peakHour": 11}
  ]'::jsonb,
  'standard',
  true,
  'Determines peak demand window and load curve shape',
  9,
  'Operations'
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- Q10: REMOTE WORK PERCENTAGE (Post-COVID Reality)
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
  'What percentage of employees work remotely regularly?',
  'remoteWorkPercentage',
  'select',
  '[
    {"value": "<10", "label": "<10% (mostly in-office)", "icon": "🏢", "concurrency": 0.95},
    {"value": "10-30", "label": "10–30% (hybrid)", "icon": "🔄", "concurrency": 0.80},
    {"value": "30-50", "label": "30–50% (flexible)", "icon": "💼", "concurrency": 0.65},
    {"value": "50+", "label": "50%+ (mostly remote)", "icon": "🏠", "concurrency": 0.50}
  ]'::jsonb,
  '10-30',
  true,
  'Remote work reduces peak demand and energy consumption',
  10,
  'Operations'
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- Q11: WEEKEND/EVENING USAGE (Base Load)
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
  'What is the building usage outside business hours?',
  'offHoursUsage',
  'select',
  '[
    {"value": "minimal", "label": "Minimal (only security/HVAC setback)", "icon": "🌙", "offHourLoad": 0.2},
    {"value": "light", "label": "Light (cleaners, some late workers)", "icon": "🌆", "offHourLoad": 0.3},
    {"value": "moderate", "label": "Moderate (shift work, server rooms)", "icon": "🌃", "offHourLoad": 0.5},
    {"value": "high", "label": "High (24/7 operations)", "icon": "🕛", "offHourLoad": 0.7}
  ]'::jsonb,
  'light',
  true,
  'Determines base load and arbitrage opportunity window',
  11,
  'Operations'
FROM use_cases WHERE slug = 'office';

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
    {"value": "<5000", "label": "<$5,000", "icon": "💵"},
    {"value": "5000-15000", "label": "$5,000–$15,000", "icon": "💰"},
    {"value": "15000-30000", "label": "$15,000–$30,000", "icon": "💳"},
    {"value": "30000-75000", "label": "$30,000–$75,000", "icon": "💸"},
    {"value": "75000+", "label": "$75,000+", "icon": "🏦"},
    {"value": "not_sure", "label": "Not sure", "icon": "❓"}
  ]'::jsonb,
  '15000-30000',
  true,
  'Office buildings spend $1.50-2.50 per sq ft per year on energy',
  12,
  'Financial'
FROM use_cases WHERE slug = 'office';

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
  'Offices with demand charges see best BESS ROI',
  13,
  'Financial'
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- Q14: POWER QUALITY ISSUES (Resilience Value)
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
    {"value": "voltage_sag", "label": "Voltage sag/flicker", "icon": "📉"},
    {"value": "hvac_failures", "label": "HVAC system failures", "icon": "❄️"},
    {"value": "elevator_issues", "label": "Elevator power issues", "icon": "🛗"},
    {"value": "it_equipment_restarts", "label": "IT equipment restarts", "icon": "💻"},
    {"value": "none", "label": "None", "icon": "✅"}
  ]'::jsonb,
  '["none"]',
  false,
  'Power conditioning + tenant satisfaction + resilience positioning',
  14,
  'Resilience'
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- Q15: OUTAGE SENSITIVITY (Backup Requirement)
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
  'If power goes out, what happens to your building?',
  'outageSensitivity',
  'select',
  '[
    {"value": "critical", "label": "Critical systems fail (elevators, IT)", "icon": "🛑", "backupHours": 6},
    {"value": "major_disruption", "label": "Major tenant disruption", "icon": "⚠️", "backupHours": 4},
    {"value": "inconvenience", "label": "Inconvenience (lights, HVAC out)", "icon": "📉", "backupHours": 2},
    {"value": "minimal", "label": "Minimal impact", "icon": "✅", "backupHours": 1}
  ]'::jsonb,
  'major_disruption',
  true,
  'Backup runtime requirement for tenant satisfaction',
  15,
  'Resilience'
FROM use_cases WHERE slug = 'office';

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
    {"value": "tenant_improvements", "label": "Major tenant improvements", "icon": "🔨", "kWIncrease": 50},
    {"value": "server_room", "label": "New server room", "icon": "💻", "kWIncrease": 50},
    {"value": "ev_chargers", "label": "EV charging stations", "icon": "🔌", "kWIncrease": 75},
    {"value": "hvac_upgrade", "label": "HVAC system upgrade", "icon": "❄️", "kWIncrease": 100},
    {"value": "solar", "label": "Solar panels", "icon": "☀️", "kWIncrease": 0},
    {"value": "none", "label": "No expansion planned", "icon": "✅", "kWIncrease": 0}
  ]'::jsonb,
  '["none"]',
  false,
  'Future-proof BESS sizing (prevents undersizing trap)',
  16,
  'Planning'
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
SELECT 
  section_name,
  COUNT(*) as question_count,
  STRING_AGG(field_name, ', ' ORDER BY display_order) as fields
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
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
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
ORDER BY display_order;
