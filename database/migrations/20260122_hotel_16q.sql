-- =============================================================================
-- HOTEL ENERGY INTELLIGENCE - 16 QUESTION REFINED SET
-- January 22, 2026
-- 
-- Implements Merlin's hotel questionnaire based on engineering specification
-- Accurately reconstructs load from hotel class, occupancy, and amenities
-- Directly feeds BESS sizing logic with confidence tracking
-- =============================================================================

-- Delete existing hotel questions
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- =============================================================================
-- Q1: HOTEL CLASS (Topology Anchor)
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
  'What class of hotel do you operate?',
  'hotelClass',
  'select',
  '[
    {
      "value": "economy",
      "label": "Economy/Budget",
      "icon": "🏨",
      "description": "Limited amenities, basic HVAC",
      "kWPerRoom": 5
    },
    {
      "value": "midscale",
      "label": "Midscale",
      "icon": "🏩",
      "description": "Standard amenities + breakfast area",
      "kWPerRoom": 7
    },
    {
      "value": "upscale",
      "label": "Upscale/Full-service",
      "icon": "🏪",
      "description": "Restaurant, fitness, meeting rooms",
      "kWPerRoom": 10
    },
    {
      "value": "luxury",
      "label": "Luxury/Resort",
      "icon": "🏰",
      "description": "Spa, pool, full dining, concierge",
      "kWPerRoom": 15
    }
  ]'::jsonb,
  'midscale',
  true,
  'Sets baseline kW per room and amenity expectations',
  1,
  'Topology'
FROM use_cases WHERE slug = 'hotel';

-- =============================================================================
-- Q2: NUMBER OF ROOMS (Scale Factor)
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
  'How many guest rooms does your hotel have?',
  'roomCount',
  'select',
  '[
    {"value": "<50", "label": "<50 rooms", "icon": "🏨", "rooms": 40},
    {"value": "50-100", "label": "50–100 rooms", "icon": "🏩", "rooms": 75},
    {"value": "100-200", "label": "100–200 rooms", "icon": "🏪", "rooms": 150},
    {"value": "200-400", "label": "200–400 rooms", "icon": "🏢", "rooms": 300},
    {"value": "400+", "label": "400+ rooms", "icon": "🏰", "rooms": 500}
  ]'::jsonb,
  '100-200',
  true,
  'Primary scale factor for all load calculations',
  2,
  'Topology'
FROM use_cases WHERE slug = 'hotel';

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
  'Upper bound constraint for BESS + equipment upgrades',
  3,
  'Infrastructure'
FROM use_cases WHERE slug = 'hotel';

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
FROM use_cases WHERE slug = 'hotel';

-- =============================================================================
-- Q5: MAJOR AMENITIES (Load Adders)
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
  'Which amenities does your hotel have? (Check all that apply)',
  'hotelAmenities',
  'multi-select',
  '[
    {"value": "pool_indoor", "label": "Indoor pool (heated)", "icon": "🏊", "kW": 100},
    {"value": "pool_outdoor", "label": "Outdoor pool", "icon": "🌊", "kW": 50},
    {"value": "restaurant", "label": "Full-service restaurant", "icon": "🍽️", "kW": 75},
    {"value": "breakfast_area", "label": "Breakfast area", "icon": "🥐", "kW": 25},
    {"value": "spa", "label": "Spa/hot tub", "icon": "♨️", "kW": 60},
    {"value": "fitness", "label": "Fitness center", "icon": "💪", "kW": 20},
    {"value": "laundry", "label": "On-site laundry", "icon": "🧺", "kW": 80},
    {"value": "ev_charging", "label": "EV charging stations", "icon": "🔌", "kW": 50},
    {"value": "conference", "label": "Conference/meeting rooms", "icon": "📊", "kW": 30}
  ]'::jsonb,
  '["breakfast_area", "fitness"]',
  true,
  'Bottom-up load reconstruction from amenities',
  5,
  'Equipment'
FROM use_cases WHERE slug = 'hotel';

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
    {"value": "ptac", "label": "PTAC units (in-room)", "icon": "❄️", "kWPerRoom": 3},
    {"value": "split", "label": "Split systems", "icon": "🌡️", "kWPerRoom": 3.5},
    {"value": "central_chiller", "label": "Central chiller plant", "icon": "🏭", "kWPerRoom": 4},
    {"value": "vrf", "label": "VRF/VRV system", "icon": "⚙️", "kWPerRoom": 3.2},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "kWPerRoom": 3}
  ]'::jsonb,
  'ptac',
  true,
  'HVAC typically 40-60% of hotel energy load',
  6,
  'Equipment'
FROM use_cases WHERE slug = 'hotel';

-- =============================================================================
-- Q7: WATER HEATING (High-demand Load)
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
  'How do you heat water?',
  'waterHeating',
  'select',
  '[
    {"value": "electric", "label": "Electric water heaters", "icon": "⚡", "kWPerRoom": 2},
    {"value": "gas", "label": "Natural gas", "icon": "🔥", "kWPerRoom": 0},
    {"value": "heat_pump", "label": "Heat pump water heaters", "icon": "♨️", "kWPerRoom": 1},
    {"value": "solar_thermal", "label": "Solar thermal", "icon": "☀️", "kWPerRoom": 0.5},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "kWPerRoom": 1}
  ]'::jsonb,
  'electric',
  true,
  'Electric water heating can be 15-25% of hotel load',
  7,
  'Equipment'
FROM use_cases WHERE slug = 'hotel';

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
  'What is your average occupancy rate?',
  'occupancyRate',
  'select',
  '[
    {"value": "<40", "label": "<40%", "icon": "📉", "concurrency": 0.4},
    {"value": "40-60", "label": "40–60%", "icon": "📊", "concurrency": 0.6},
    {"value": "60-75", "label": "60–75%", "icon": "📈", "concurrency": 0.7},
    {"value": "75-90", "label": "75–90%", "icon": "🎯", "concurrency": 0.85},
    {"value": "90+", "label": "90%+", "icon": "🔥", "concurrency": 0.95}
  ]'::jsonb,
  '60-75',
  true,
  'Determines effective load (occupied rooms use more energy)',
  8,
  'Operations'
FROM use_cases WHERE slug = 'hotel';

-- =============================================================================
-- Q9: CHECK-IN PATTERN (Peak Demand Window)
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
  'When do most guests check in?',
  'checkInPattern',
  'select',
  '[
    {"value": "afternoon", "label": "Afternoon (2–6 PM)", "icon": "🕐", "peakHour": 16},
    {"value": "evening", "label": "Evening (6–10 PM)", "icon": "🌆", "peakHour": 19},
    {"value": "all_day", "label": "Throughout the day", "icon": "🕛", "peakHour": 14},
    {"value": "convention", "label": "Convention-driven (surges)", "icon": "📊", "peakHour": 15}
  ]'::jsonb,
  'afternoon',
  true,
  'Peak demand window for HVAC, elevators, hot water',
  9,
  'Operations'
FROM use_cases WHERE slug = 'hotel';

-- =============================================================================
-- Q10: AVERAGE GUEST STAY (Energy Persistence)
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
  'What is the average guest stay length?',
  'guestStayLength',
  'select',
  '[
    {"value": "1", "label": "1 night", "icon": "🌙", "nights": 1},
    {"value": "2-3", "label": "2–3 nights", "icon": "🌃", "nights": 2.5},
    {"value": "4-7", "label": "4–7 nights", "icon": "🏖️", "nights": 5},
    {"value": "7+", "label": "7+ nights", "icon": "🏝️", "nights": 10},
    {"value": "extended", "label": "Extended stay (weeks)", "icon": "🏠", "nights": 21}
  ]'::jsonb,
  '2-3',
  true,
  'Affects load curve shape and BESS arbitrage opportunity',
  10,
  'Operations'
FROM use_cases WHERE slug = 'hotel';

-- =============================================================================
-- Q11: OPERATING HOURS (Common Area Loads)
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
  'What are your front desk/lobby operating hours?',
  'operatingHours',
  'select',
  '[
    {"value": "24_7", "label": "24/7 staffed", "icon": "🕛", "hours": 24},
    {"value": "6am_midnight", "label": "6 AM – Midnight", "icon": "🕐", "hours": 18},
    {"value": "7am_11pm", "label": "7 AM – 11 PM", "icon": "🕔", "hours": 16},
    {"value": "limited", "label": "Limited hours", "icon": "🕘", "hours": 12}
  ]'::jsonb,
  '24_7',
  true,
  'Determines base load (lighting, HVAC, security)',
  11,
  'Operations'
FROM use_cases WHERE slug = 'hotel';

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
FROM use_cases WHERE slug = 'hotel';

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
  'Hotels with demand charges see best BESS ROI',
  13,
  'Financial'
FROM use_cases WHERE slug = 'hotel';

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
    {"value": "hvac_failures", "label": "HVAC failures during peak", "icon": "❄️"},
    {"value": "voltage_sag", "label": "Voltage sag/flicker", "icon": "📉"},
    {"value": "utility_penalties", "label": "Utility penalties", "icon": "💰"},
    {"value": "guest_complaints", "label": "Guest complaints (no AC)", "icon": "😤"},
    {"value": "none", "label": "None", "icon": "✅"}
  ]'::jsonb,
  '["none"]',
  false,
  'Power conditioning + guest satisfaction + resilience positioning',
  14,
  'Resilience'
FROM use_cases WHERE slug = 'hotel';

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
  'If power goes out, what happens to your hotel?',
  'outageSensitivity',
  'select',
  '[
    {"value": "critical", "label": "Critical systems fail (elevators, HVAC)", "icon": "🛑", "backupHours": 6},
    {"value": "guest_impact", "label": "Major guest impact", "icon": "⚠️", "backupHours": 4},
    {"value": "inconvenience", "label": "Inconvenience only", "icon": "📉", "backupHours": 2},
    {"value": "minor", "label": "Minor disruption", "icon": "✅", "backupHours": 1}
  ]'::jsonb,
  'guest_impact',
  true,
  'Backup runtime requirement for guest experience',
  15,
  'Resilience'
FROM use_cases WHERE slug = 'hotel';

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
    {"value": "add_rooms", "label": "Adding rooms/floors", "icon": "➕", "kWIncrease": 100},
    {"value": "pool", "label": "Adding pool/spa", "icon": "🏊", "kWIncrease": 100},
    {"value": "restaurant", "label": "Adding restaurant", "icon": "🍽️", "kWIncrease": 75},
    {"value": "ev_chargers", "label": "EV charging stations", "icon": "🔌", "kWIncrease": 50},
    {"value": "hvac_upgrade", "label": "HVAC upgrade", "icon": "❄️", "kWIncrease": 50},
    {"value": "solar", "label": "Solar panels", "icon": "☀️", "kWIncrease": 0},
    {"value": "none", "label": "No expansion planned", "icon": "✅", "kWIncrease": 0}
  ]'::jsonb,
  '["none"]',
  false,
  'Future-proof BESS sizing (prevents undersizing trap)',
  16,
  'Planning'
FROM use_cases WHERE slug = 'hotel';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
SELECT 
  section_name,
  COUNT(*) as question_count,
  STRING_AGG(field_name, ', ' ORDER BY display_order) as fields
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
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
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
ORDER BY display_order;
