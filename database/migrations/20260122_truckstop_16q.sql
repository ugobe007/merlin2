-- =============================================================================
-- TRUCK STOP ENERGY INTELLIGENCE - 16 QUESTION REFINED SET
-- January 22, 2026
-- 
-- Implements Merlin's truck stop questionnaire based on engineering specification
-- Accurately reconstructs load from fueling capacity, convenience store, and services
-- Directly feeds BESS sizing logic with confidence tracking
-- =============================================================================

-- Delete existing truck stop questions
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

-- =============================================================================
-- Q1: TRUCK STOP TYPE (Topology Anchor)
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
  'What type of truck stop do you operate?',
  'truckStopType',
  'select',
  '[
    {
      "value": "basic_fuel",
      "label": "Basic fueling station",
      "icon": "⛽",
      "description": "Diesel pumps + small store",
      "baseKW": 100
    },
    {
      "value": "travel_center",
      "label": "Travel center",
      "icon": "🛣️",
      "description": "Fuel + store + restaurant + showers",
      "baseKW": 250
    },
    {
      "value": "mega_center",
      "label": "Mega travel center",
      "icon": "🏪",
      "description": "Full-service with truck services",
      "baseKW": 500
    },
    {
      "value": "fleet_facility",
      "label": "Private fleet facility",
      "icon": "🚛",
      "description": "Captive fleet + maintenance",
      "baseKW": 300
    }
  ]'::jsonb,
  'travel_center',
  true,
  'Sets baseline load model and service profile',
  1,
  'Topology'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

-- =============================================================================
-- Q2: DIESEL FUELING POSITIONS (Scale Factor)
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
  'How many diesel fueling positions do you have?',
  'fuelingPositions',
  'select',
  '[
    {"value": "2-4", "label": "2–4 positions", "icon": "⛽", "kW": 30},
    {"value": "6-8", "label": "6–8 positions", "icon": "🚚", "kW": 50},
    {"value": "10-16", "label": "10–16 positions", "icon": "🚛", "kW": 80},
    {"value": "16+", "label": "16+ positions", "icon": "🏭", "kW": 120}
  ]'::jsonb,
  '6-8',
  true,
  'Fuel pump motors + canopy lighting load',
  2,
  'Topology'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

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
  '800',
  true,
  'Upper bound constraint for BESS + EV chargers',
  3,
  'Infrastructure'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

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
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

-- =============================================================================
-- Q5: ON-SITE FACILITIES (Load Adders)
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
  'Which facilities do you have? (Check all that apply)',
  'facilities',
  'multi-select',
  '[
    {"value": "convenience_store", "label": "Convenience store", "icon": "🏪", "kW": 50},
    {"value": "restaurant", "label": "Restaurant/food service", "icon": "🍔", "kW": 100},
    {"value": "showers", "label": "Shower facilities", "icon": "🚿", "kW": 40},
    {"value": "laundry", "label": "Laundry facilities", "icon": "🧺", "kW": 30},
    {"value": "truck_wash", "label": "Truck wash", "icon": "🚛", "kW": 80},
    {"value": "maintenance_bay", "label": "Maintenance bays", "icon": "🔧", "kW": 60},
    {"value": "scale", "label": "Truck scale", "icon": "⚖️", "kW": 10},
    {"value": "parking_lighting", "label": "Parking lot lighting", "icon": "💡", "kW": 40}
  ]'::jsonb,
  '["convenience_store", "parking_lighting"]',
  true,
  'Bottom-up load reconstruction from facilities',
  5,
  'Equipment'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

-- =============================================================================
-- Q6: REFRIGERATION CAPACITY (Continuous Base Load)
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
  'How much refrigeration/cold storage do you have?',
  'refrigerationCapacity',
  'select',
  '[
    {"value": "minimal", "label": "Minimal (few coolers)", "icon": "🧊", "kW": 20},
    {"value": "standard", "label": "Standard convenience store", "icon": "🥤", "kW": 40},
    {"value": "large", "label": "Large (walk-in coolers)", "icon": "🏪", "kW": 80},
    {"value": "industrial", "label": "Industrial (cold storage)", "icon": "🏭", "kW": 150}
  ]'::jsonb,
  'standard',
  true,
  'Refrigeration is 24/7 base load + peak shaving opportunity',
  6,
  'Equipment'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

-- =============================================================================
-- Q7: HVAC SYSTEM SIZE (Climate-dependent Load)
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
  'What is your total building square footage (all structures)?',
  'buildingSquareFootage',
  'select',
  '[
    {"value": "<5000", "label": "<5,000 sq ft", "icon": "🏪", "kW": 30},
    {"value": "5000-10000", "label": "5,000–10,000 sq ft", "icon": "🏬", "kW": 60},
    {"value": "10000-20000", "label": "10,000–20,000 sq ft", "icon": "🏢", "kW": 100},
    {"value": "20000+", "label": "20,000+ sq ft", "icon": "🏭", "kW": 150}
  ]'::jsonb,
  '5000-10000',
  true,
  'HVAC load scales with conditioned space',
  7,
  'Equipment'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

-- =============================================================================
-- Q8: DAILY TRUCK TRAFFIC (Throughput)
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
  'How many trucks fuel daily (average)?',
  'dailyTruckTraffic',
  'select',
  '[
    {"value": "<100", "label": "<100 trucks", "icon": "🚚"},
    {"value": "100-250", "label": "100–250 trucks", "icon": "🚛"},
    {"value": "250-500", "label": "250–500 trucks", "icon": "🚐"},
    {"value": "500+", "label": "500+ trucks", "icon": "🏭"}
  ]'::jsonb,
  '100-250',
  true,
  'Correlates to fuel pump utilization and store traffic',
  8,
  'Operations'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

-- =============================================================================
-- Q9: PEAK TRAFFIC HOURS (Demand Window)
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
  'When is your busiest traffic period?',
  'peakTrafficHours',
  'select',
  '[
    {"value": "morning", "label": "Morning (6–10 AM)", "icon": "🌅", "peakHour": 8},
    {"value": "midday", "label": "Midday (10 AM–2 PM)", "icon": "☀️", "peakHour": 12},
    {"value": "afternoon", "label": "Afternoon (2–6 PM)", "icon": "🌇", "peakHour": 16},
    {"value": "evening", "label": "Evening (6 PM–midnight)", "icon": "🌃", "peakHour": 20},
    {"value": "all_day", "label": "Steady all day", "icon": "🕛", "peakHour": 14}
  ]'::jsonb,
  'midday',
  true,
  'Peak demand window for BESS discharge strategy',
  9,
  'Operations'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

-- =============================================================================
-- Q10: FUELING SPEED (Load Curve Shape)
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
  'What is the average time a truck spends fueling?',
  'fuelingDuration',
  'select',
  '[
    {"value": "<10", "label": "<10 minutes", "icon": "⚡", "minutes": 8},
    {"value": "10-20", "label": "10–20 minutes", "icon": "⏱️", "minutes": 15},
    {"value": "20-30", "label": "20–30 minutes", "icon": "⏰", "minutes": 25},
    {"value": "30+", "label": "30+ minutes", "icon": "⏲️", "minutes": 40}
  ]'::jsonb,
  '10-20',
  true,
  'Determines fuel pump duty cycle and concurrency',
  10,
  'Operations'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

-- =============================================================================
-- Q11: OPERATING HOURS (Base Load Duration)
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
  'What are your operating hours?',
  'operatingHours',
  'select',
  '[
    {"value": "24_7", "label": "24/7 operation", "icon": "🕛", "hours": 24},
    {"value": "18_hours", "label": "18 hours/day (5 AM–11 PM)", "icon": "🕐", "hours": 18},
    {"value": "12_hours", "label": "12 hours/day (6 AM–6 PM)", "icon": "🕔", "hours": 12},
    {"value": "limited", "label": "Limited hours", "icon": "🕘", "hours": 8}
  ]'::jsonb,
  '24_7',
  true,
  'Determines base load + arbitrage opportunity window',
  11,
  'Operations'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

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
  'ROI calibration anchor + validates load calculations',
  12,
  'Financial'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

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
  'Truck stops with demand charges see best BESS ROI',
  13,
  'Financial'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

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
    {"value": "pump_failures", "label": "Fuel pump failures during peak", "icon": "⛽"},
    {"value": "voltage_sag", "label": "Voltage sag/flicker", "icon": "📉"},
    {"value": "utility_penalties", "label": "Utility penalties", "icon": "💰"},
    {"value": "refrigeration_issues", "label": "Refrigeration issues", "icon": "🧊"},
    {"value": "none", "label": "None", "icon": "✅"}
  ]'::jsonb,
  '["none"]',
  false,
  'Power conditioning + business continuity + resilience positioning',
  14,
  'Resilience'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

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
  'If power goes out, what happens to your business?',
  'outageSensitivity',
  'select',
  '[
    {"value": "complete_shutdown", "label": "Complete shutdown (fuel pumps down)", "icon": "🛑", "backupHours": 8},
    {"value": "critical_only", "label": "Critical systems only (lights, POS)", "icon": "⚠️", "backupHours": 4},
    {"value": "minor_impact", "label": "Minor impact", "icon": "📉", "backupHours": 2},
    {"value": "minimal", "label": "Minimal disruption", "icon": "✅", "backupHours": 1}
  ]'::jsonb,
  'complete_shutdown',
  true,
  'Backup runtime requirement for business continuity',
  15,
  'Resilience'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

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
    {"value": "add_fuel_lanes", "label": "Additional fuel lanes", "icon": "⛽", "kWIncrease": 30},
    {"value": "ev_chargers", "label": "EV/truck charging stations", "icon": "🔌", "kWIncrease": 150},
    {"value": "restaurant", "label": "Restaurant/food service", "icon": "🍔", "kWIncrease": 100},
    {"value": "truck_wash", "label": "Truck wash", "icon": "🚛", "kWIncrease": 80},
    {"value": "solar", "label": "Solar canopy", "icon": "☀️", "kWIncrease": 0},
    {"value": "none", "label": "No expansion planned", "icon": "✅", "kWIncrease": 0}
  ]'::jsonb,
  '["none"]',
  false,
  'Future-proof BESS sizing (prevents undersizing trap)',
  16,
  'Planning'
FROM use_cases WHERE slug = 'heavy_duty_truck_stop';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
SELECT 
  section_name,
  COUNT(*) as question_count,
  STRING_AGG(field_name, ', ' ORDER BY display_order) as fields
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop')
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
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop')
ORDER BY display_order;
