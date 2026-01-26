-- =============================================================================
-- EV CHARGING HUB ENERGY INTELLIGENCE - 16 QUESTION REFINED SET
-- January 22, 2026
-- 
-- Implements Merlin's EV charging hub questionnaire based on engineering specification
-- Accurately reconstructs load from charger mix, utilization, and site characteristics
-- Directly feeds BESS sizing logic with confidence tracking
-- =============================================================================

-- Delete existing EV charging questions
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- =============================================================================
-- Q1: CHARGING HUB TYPE (Topology Anchor)
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
  'What type of EV charging site are you planning/operating?',
  'chargingHubType',
  'select',
  '[
    {
      "value": "workplace",
      "label": "Workplace charging",
      "icon": "🏢",
      "description": "Employee parking, long dwell time",
      "dwellHours": 8
    },
    {
      "value": "retail",
      "label": "Retail/commercial",
      "icon": "🏪",
      "description": "Shopping centers, 1-3 hour stays",
      "dwellHours": 2
    },
    {
      "value": "public_fast",
      "label": "Public fast charging hub",
      "icon": "⚡",
      "description": "Highway corridor, quick turnaround",
      "dwellHours": 0.5
    },
    {
      "value": "fleet_depot",
      "label": "Fleet depot",
      "icon": "🚚",
      "description": "Captive fleet, managed charging",
      "dwellHours": 12
    },
    {
      "value": "multi_family",
      "label": "Multi-family residential",
      "icon": "🏘️",
      "description": "Apartment/condo parking, overnight",
      "dwellHours": 10
    }
  ]'::jsonb,
  'retail',
  true,
  'Dwell time drives charger type and BESS sizing',
  1,
  'Topology'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q2: CHARGER MIX (Power Profile)
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
  'How many chargers of each type? (Enter counts below)',
  'chargerCounts',
  'json',
  '{
    "level2_7kw": {"label": "Level 2 (7 kW)", "default": 8},
    "level2_11kw": {"label": "Level 2 (11 kW)", "default": 0},
    "level2_19kw": {"label": "Level 2 (19 kW)", "default": 0},
    "dcfc_50kw": {"label": "DCFC (50 kW)", "default": 2},
    "dcfc_150kw": {"label": "DCFC (150 kW)", "default": 2},
    "hpc_250kw": {"label": "HPC (250 kW)", "default": 0},
    "hpc_350kw": {"label": "HPC (350 kW)", "default": 0}
  }'::jsonb,
  '{"level2_7kw": 8, "dcfc_50kw": 2, "dcfc_150kw": 2}',
  true,
  'Mixed L2/DCFC typical for retail; pure DCFC for highway hubs',
  2,
  'Topology'
FROM use_cases WHERE slug = 'ev-charging';

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
  'What is your current or planned electrical service?',
  'electricalServiceSize',
  'select',
  '[
    {"value": "400", "label": "400A (small L2 hub)", "icon": "🔌", "kW": 96},
    {"value": "800", "label": "800A (mixed L2/DCFC)", "icon": "⚡", "kW": 192},
    {"value": "1200", "label": "1200A", "icon": "🔋", "kW": 288},
    {"value": "1600", "label": "1600A", "icon": "⚙️", "kW": 384},
    {"value": "2000+", "label": "2000A+ (HPC hub)", "icon": "🏭", "kW": 480},
    {"value": "not_sure", "label": "Not sure / need guidance", "icon": "❓"}
  ]'::jsonb,
  '800',
  true,
  'BESS can reduce required service size by 30-50%',
  3,
  'Infrastructure'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q4: VOLTAGE LEVEL (Charger Compatibility)
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
    {"value": "208", "label": "208V (L2 only)", "icon": "🔌"},
    {"value": "240", "label": "240V (L2 only)", "icon": "⚡"},
    {"value": "277_480", "label": "277/480V (L2 + DCFC)", "icon": "🔋"},
    {"value": "medium_voltage", "label": "Medium voltage (HPC)", "icon": "⚙️"},
    {"value": "not_sure", "label": "Not sure", "icon": "❓"}
  ]'::jsonb,
  '277_480',
  true,
  'DCFC requires 480V; HPC may need transformer',
  4,
  'Infrastructure'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q5: ADDITIONAL SITE LOADS (Beyond Chargers)
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
  'What other electrical loads exist at the site? (Check all that apply)',
  'additionalLoads',
  'multi-select',
  '[
    {"value": "retail_store", "label": "Retail store", "icon": "🏪", "kW": 50},
    {"value": "restaurant", "label": "Restaurant", "icon": "🍔", "kW": 100},
    {"value": "office", "label": "Office space", "icon": "🏢", "kW": 75},
    {"value": "canopy_lighting", "label": "Canopy lighting", "icon": "💡", "kW": 20},
    {"value": "parking_lighting", "label": "Parking lot lighting", "icon": "🔦", "kW": 30},
    {"value": "security_cameras", "label": "Security/cameras", "icon": "📹", "kW": 5},
    {"value": "none", "label": "Chargers only", "icon": "⚡", "kW": 0}
  ]'::jsonb,
  '["canopy_lighting", "security_cameras"]',
  true,
  'Non-charger loads must be factored into service sizing',
  5,
  'Equipment'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q6: CHARGER MANAGEMENT SYSTEM (Load Control)
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
  'Do you have (or plan to have) smart charging/load management?',
  'loadManagement',
  'select',
  '[
    {"value": "none", "label": "No load management", "icon": "❌", "concurrency": 1.0},
    {"value": "basic", "label": "Basic power sharing", "icon": "🔄", "concurrency": 0.8},
    {"value": "advanced", "label": "Advanced load management", "icon": "🧠", "concurrency": 0.7},
    {"value": "ai_optimized", "label": "AI-optimized + BESS integration", "icon": "🤖", "concurrency": 0.6}
  ]'::jsonb,
  'basic',
  true,
  'Load management reduces peak demand by 20-40%',
  6,
  'Equipment'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q7: EXPECTED UTILIZATION RATE (Concurrency Factor)
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
  'What percentage of chargers will typically be in use during peak hours?',
  'utilizationRate',
  'select',
  '[
    {"value": "<25", "label": "<25%", "icon": "📉", "concurrency": 0.2},
    {"value": "25-50", "label": "25–50%", "icon": "📊", "concurrency": 0.4},
    {"value": "50-75", "label": "50–75%", "icon": "📈", "concurrency": 0.65},
    {"value": "75+", "label": "75%+", "icon": "🔥", "concurrency": 0.85}
  ]'::jsonb,
  '50-75',
  true,
  'Industry avg: L2 workplace 40%, retail 50%, highway DCFC 70%',
  7,
  'Operations'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q8: SESSIONS PER DAY (Throughput)
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
  'How many charging sessions do you expect per day (total)?',
  'sessionsPerDay',
  'select',
  '[
    {"value": "<25", "label": "<25 sessions", "icon": "🚗"},
    {"value": "25-75", "label": "25–75 sessions", "icon": "🚕"},
    {"value": "75-150", "label": "75–150 sessions", "icon": "🚙"},
    {"value": "150-300", "label": "150–300 sessions", "icon": "🚐"},
    {"value": "300+", "label": "300+ sessions", "icon": "🚛"}
  ]'::jsonb,
  '75-150',
  true,
  'Throughput determines revenue and energy consumption',
  8,
  'Operations'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q9: PEAK CHARGING HOURS (Demand Window)
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
  'When do you expect peak charging demand?',
  'peakChargingHours',
  'select',
  '[
    {"value": "morning", "label": "Morning (7–10 AM)", "icon": "🌅", "peakHour": 8},
    {"value": "midday", "label": "Midday (11 AM–2 PM)", "icon": "☀️", "peakHour": 12},
    {"value": "afternoon", "label": "Afternoon (3–6 PM)", "icon": "🌇", "peakHour": 16},
    {"value": "evening", "label": "Evening (6–10 PM)", "icon": "🌃", "peakHour": 19},
    {"value": "overnight", "label": "Overnight (fleet/residential)", "icon": "🌙", "peakHour": 2},
    {"value": "all_day", "label": "Steady throughout day", "icon": "🕛", "peakHour": 14}
  ]'::jsonb,
  'afternoon',
  true,
  'Peak demand timing determines BESS discharge strategy',
  9,
  'Operations'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q10: SESSION DURATION (Load Curve Shape)
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
  'What is the average charging session duration?',
  'sessionDuration',
  'select',
  '[
    {"value": "<30", "label": "<30 minutes (HPC)", "icon": "⚡", "hours": 0.4},
    {"value": "30-60", "label": "30–60 minutes (DCFC)", "icon": "⏱️", "hours": 0.75},
    {"value": "1-3", "label": "1–3 hours (L2 retail)", "icon": "⏰", "hours": 2},
    {"value": "3-8", "label": "3–8 hours (L2 workplace)", "icon": "⏲️", "hours": 5},
    {"value": "8+", "label": "8+ hours (overnight)", "icon": "🌙", "hours": 10}
  ]'::jsonb,
  '1-3',
  true,
  'Longer sessions = better BESS arbitrage opportunity',
  10,
  'Operations'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q11: OPERATING HOURS (Site Availability)
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
  'What are the site operating hours for charging?',
  'operatingHours',
  'select',
  '[
    {"value": "24_7", "label": "24/7 public access", "icon": "🕛", "hours": 24},
    {"value": "business_extended", "label": "Extended (6 AM–midnight)", "icon": "🕐", "hours": 18},
    {"value": "business_standard", "label": "Business hours (8 AM–6 PM)", "icon": "🕔", "hours": 10},
    {"value": "limited", "label": "Limited hours", "icon": "🕘", "hours": 8}
  ]'::jsonb,
  'business_extended',
  true,
  'Operating hours determine total energy throughput',
  11,
  'Operations'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q12: ESTIMATED MONTHLY ELECTRICITY SPEND (ROI Calibration)
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
  'What is your estimated monthly electricity cost for charging?',
  'monthlyElectricitySpend',
  'select',
  '[
    {"value": "<2000", "label": "<$2,000", "icon": "💵"},
    {"value": "2000-5000", "label": "$2,000–$5,000", "icon": "💰"},
    {"value": "5000-15000", "label": "$5,000–$15,000", "icon": "💳"},
    {"value": "15000-30000", "label": "$15,000–$30,000", "icon": "💸"},
    {"value": "30000+", "label": "$30,000+", "icon": "🏦"},
    {"value": "not_sure", "label": "Not sure / new site", "icon": "❓"}
  ]'::jsonb,
  '5000-15000',
  true,
  'Demand charges can be 40-60% of EV charging electricity cost',
  12,
  'Financial'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q13: UTILITY RATE STRUCTURE (BESS Value Proposition)
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
  'What utility rate structure applies to your site?',
  'utilityRateStructure',
  'select',
  '[
    {"value": "flat", "label": "Flat rate (rare for commercial)", "icon": "📊", "savingsMultiplier": 0.5},
    {"value": "tou", "label": "Time-of-use (TOU)", "icon": "🕐", "savingsMultiplier": 0.8},
    {"value": "demand", "label": "Demand charges", "icon": "⚡", "savingsMultiplier": 1.0},
    {"value": "tou_demand", "label": "TOU + demand charges", "icon": "🎯", "savingsMultiplier": 1.2},
    {"value": "ev_specific", "label": "EV-specific rate", "icon": "🔌", "savingsMultiplier": 0.9},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "savingsMultiplier": 0.8}
  ]'::jsonb,
  'demand',
  true,
  'BESS can reduce demand charges by 30-70% for EV charging',
  13,
  'Financial'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q14: GRID CAPACITY CONSTRAINTS (Make-Ready Costs)
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
  'What is your grid capacity situation? (Check all that apply)',
  'gridCapacityIssues',
  'multi-select',
  '[
    {"value": "insufficient_service", "label": "Insufficient service size", "icon": "⚠️"},
    {"value": "transformer_upgrade", "label": "Need transformer upgrade", "icon": "⚙️"},
    {"value": "trenching_required", "label": "Trenching/conduit required", "icon": "🚧"},
    {"value": "utility_fees", "label": "High utility make-ready fees", "icon": "💰"},
    {"value": "long_lead_time", "label": "Long utility lead times", "icon": "⏰"},
    {"value": "adequate", "label": "Adequate capacity", "icon": "✅"}
  ]'::jsonb,
  '["adequate"]',
  false,
  'BESS can reduce/eliminate make-ready costs ($50k-$500k+)',
  14,
  'Resilience'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- Q15: OUTAGE SENSITIVITY (Uptime Requirement)
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
  'How critical is charging uptime for your business?',
  'outageSensitivity',
  'select',
  '[
    {"value": "critical", "label": "Critical (fleet operations)", "icon": "🛑", "backupHours": 4},
    {"value": "important", "label": "Important (revenue loss)", "icon": "⚠️", "backupHours": 2},
    {"value": "moderate", "label": "Moderate (customer inconvenience)", "icon": "📉", "backupHours": 1},
    {"value": "low", "label": "Low priority", "icon": "✅", "backupHours": 0}
  ]'::jsonb,
  'important',
  true,
  'BESS provides uninterrupted charging during grid outages',
  15,
  'Resilience'
FROM use_cases WHERE slug = 'ev-charging';

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
    {"value": "add_chargers", "label": "Additional chargers", "icon": "➕", "kWIncrease": 100},
    {"value": "upgrade_dcfc", "label": "Upgrade to DCFC/HPC", "icon": "⚡", "kWIncrease": 200},
    {"value": "solar_canopy", "label": "Solar canopy", "icon": "☀️", "kWIncrease": 0},
    {"value": "v2g", "label": "Vehicle-to-grid (V2G)", "icon": "🔄", "kWIncrease": 0},
    {"value": "additional_sites", "label": "Additional sites", "icon": "🗺️", "kWIncrease": 0},
    {"value": "none", "label": "No expansion planned", "icon": "✅", "kWIncrease": 0}
  ]'::jsonb,
  '["none"]',
  false,
  'Modular BESS supports phased buildout',
  16,
  'Planning'
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
SELECT 
  section_name,
  COUNT(*) as question_count,
  STRING_AGG(field_name, ', ' ORDER BY display_order) as fields
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging')
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
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging')
ORDER BY display_order;
