-- =============================================================================
-- DATA CENTER ENERGY INTELLIGENCE - 16 QUESTION REFINED SET
-- January 22, 2026
-- 
-- Implements Merlin's data center questionnaire based on engineering specification
-- Accurately reconstructs load from IT equipment, cooling, and tier requirements
-- Directly feeds BESS sizing logic with confidence tracking
-- =============================================================================

-- Delete existing data center questions
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- =============================================================================
-- Q1: DATA CENTER TIER (Topology Anchor)
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
  'What tier/class of data center do you operate?',
  'dataCenterTier',
  'select',
  '[
    {
      "value": "colocation",
      "label": "Colocation space",
      "icon": "🏢",
      "description": "Shared facility, rack/cage space",
      "pue": 1.6
    },
    {
      "value": "tier1",
      "label": "Tier I (Basic)",
      "icon": "🖥️",
      "description": "Single path, no redundancy",
      "pue": 2.0
    },
    {
      "value": "tier2",
      "label": "Tier II (Component redundant)",
      "icon": "💻",
      "description": "N+1 components, single path",
      "pue": 1.8
    },
    {
      "value": "tier3",
      "label": "Tier III (Concurrently maintainable)",
      "icon": "🏭",
      "description": "N+1, dual path, 72hr outage resilience",
      "pue": 1.7
    },
    {
      "value": "tier4",
      "label": "Tier IV (Fault tolerant)",
      "icon": "🏰",
      "description": "2N, fault tolerant, 96hr resilience",
      "pue": 1.6
    },
    {
      "value": "edge",
      "label": "Edge/micro data center",
      "icon": "📡",
      "description": "< 100 kW IT load",
      "pue": 1.9
    }
  ]'::jsonb,
  'tier3',
  true,
  'Tier determines redundancy + PUE (Power Usage Effectiveness)',
  1,
  'Topology'
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- Q2: IT LOAD CAPACITY (Scale Factor)
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
  'What is your IT load capacity (white space)?',
  'itLoadCapacity',
  'select',
  '[
    {"value": "<100", "label": "<100 kW (edge)", "icon": "📡", "kW": 75},
    {"value": "100-500", "label": "100–500 kW", "icon": "🖥️", "kW": 300},
    {"value": "500-1000", "label": "500 kW–1 MW", "icon": "💻", "kW": 750},
    {"value": "1-5", "label": "1–5 MW", "icon": "🏭", "kW": 3000},
    {"value": "5-20", "label": "5–20 MW", "icon": "🏰", "kW": 12000},
    {"value": "20+", "label": "20+ MW (hyperscale)", "icon": "🌐", "kW": 30000}
  ]'::jsonb,
  '500-1000',
  true,
  'IT load = servers, storage, networking (not cooling)',
  2,
  'Topology'
FROM use_cases WHERE slug = 'data-center';

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
  'What is your main electrical service?',
  'electricalServiceSize',
  'select',
  '[
    {"value": "1200", "label": "1200A (480V)", "icon": "🔌", "kW": 288},
    {"value": "2000", "label": "2000A (480V)", "icon": "⚡", "kW": 480},
    {"value": "3000", "label": "3000A (480V)", "icon": "🔋", "kW": 720},
    {"value": "medium_voltage", "label": "Medium voltage (4160V)", "icon": "⚙️", "kW": 2000},
    {"value": "utility_substation", "label": "Dedicated utility substation", "icon": "🏭", "kW": 10000},
    {"value": "not_sure", "label": "Not sure", "icon": "❓"}
  ]'::jsonb,
  '2000',
  true,
  'Larger facilities use medium voltage + on-site transformers',
  3,
  'Infrastructure'
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- Q4: UPS CONFIGURATION (Backup Context)
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
  'What is your UPS configuration?',
  'upsConfiguration',
  'select',
  '[
    {"value": "none", "label": "No UPS", "icon": "❌", "minutes": 0},
    {"value": "single", "label": "Single UPS (<10 min)", "icon": "🔋", "minutes": 5},
    {"value": "n_plus_1", "label": "N+1 UPS (10-15 min)", "icon": "🔋🔋", "minutes": 12},
    {"value": "2n", "label": "2N UPS (15-20 min)", "icon": "🔋🔋🔋", "minutes": 18},
    {"value": "distributed", "label": "Distributed redundant UPS", "icon": "🔋🔋🔋🔋", "minutes": 20},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "minutes": 10}
  ]'::jsonb,
  'n_plus_1',
  true,
  'UPS bridges to generator start (5-15 minutes typical)',
  4,
  'Infrastructure'
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- Q5: COOLING SYSTEM TYPE (Largest Load After IT)
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
  'What type of cooling system do you use?',
  'coolingType',
  'select',
  '[
    {"value": "crac_crah", "label": "CRAC/CRAH units", "icon": "❄️", "pue": 1.8},
    {"value": "chilled_water", "label": "Chilled water plant", "icon": "💧", "pue": 1.7},
    {"value": "direct_evap", "label": "Direct evaporative cooling", "icon": "🌊", "pue": 1.4},
    {"value": "free_cooling", "label": "Free cooling (economizer)", "icon": "🍃", "pue": 1.3},
    {"value": "liquid_cooling", "label": "Liquid/immersion cooling", "icon": "🧊", "pue": 1.2},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "pue": 1.7}
  ]'::jsonb,
  'chilled_water',
  true,
  'Cooling is 30-50% of total data center load',
  5,
  'Equipment'
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- Q6: POWER DENSITY (Load Profile)
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
  'What is your average rack power density?',
  'rackPowerDensity',
  'select',
  '[
    {"value": "<5", "label": "<5 kW/rack (legacy)", "icon": "🖥️", "kW": 4},
    {"value": "5-10", "label": "5–10 kW/rack", "icon": "💻", "kW": 7.5},
    {"value": "10-15", "label": "10–15 kW/rack (modern)", "icon": "⚡", "kW": 12.5},
    {"value": "15-30", "label": "15–30 kW/rack (high-density)", "icon": "🔥", "kW": 22},
    {"value": "30+", "label": "30+ kW/rack (GPU/AI)", "icon": "🚀", "kW": 40}
  ]'::jsonb,
  '10-15',
  true,
  'GPU/AI racks can exceed 50 kW per rack',
  6,
  'Equipment'
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- Q7: AVERAGE IT UTILIZATION (Load Factor)
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
  'What percentage of IT capacity is currently utilized?',
  'itUtilization',
  'select',
  '[
    {"value": "<25", "label": "<25% (new/growing)", "icon": "📉", "utilization": 0.2},
    {"value": "25-50", "label": "25–50%", "icon": "📊", "utilization": 0.4},
    {"value": "50-75", "label": "50–75%", "icon": "📈", "utilization": 0.65},
    {"value": "75-90", "label": "75–90% (mature)", "icon": "🎯", "utilization": 0.85},
    {"value": "90+", "label": "90%+ (at capacity)", "icon": "🔥", "utilization": 0.95}
  ]'::jsonb,
  '50-75',
  true,
  'Determines current vs future load',
  7,
  'Operations'
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- Q8: WORKLOAD PROFILE (Load Curve Shape)
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
  'What best describes your workload profile?',
  'workloadProfile',
  'select',
  '[
    {"value": "always_on", "label": "Always-on services (flat 24/7)", "icon": "🟢", "variance": 0.05},
    {"value": "business_hours", "label": "Business hours peak", "icon": "🕐", "variance": 0.3},
    {"value": "batch_processing", "label": "Batch processing (night peaks)", "icon": "🌙", "variance": 0.4},
    {"value": "ai_training", "label": "AI training (sporadic spikes)", "icon": "🤖", "variance": 0.5},
    {"value": "mixed", "label": "Mixed workloads", "icon": "🔄", "variance": 0.25}
  ]'::jsonb,
  'always_on',
  true,
  'Always-on = minimal BESS arbitrage; batch/AI = high arbitrage value',
  8,
  'Operations'
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- Q9: ANNUAL GROWTH RATE (Capacity Planning)
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
  'What is your expected annual load growth rate?',
  'growthRate',
  'select',
  '[
    {"value": "stable", "label": "Stable (0-5%)", "icon": "📊", "growth": 0.03},
    {"value": "moderate", "label": "Moderate (5-15%)", "icon": "📈", "growth": 0.10},
    {"value": "high", "label": "High (15-30%)", "icon": "🚀", "growth": 0.22},
    {"value": "rapid", "label": "Rapid (30%+)", "icon": "🔥", "growth": 0.40},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "growth": 0.10}
  ]'::jsonb,
  'moderate',
  true,
  'Determines future-proofing + BESS expansion headroom',
  9,
  'Operations'
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- Q10: PUE (POWER USAGE EFFECTIVENESS)
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
  'What is your current PUE (if known)?',
  'currentPUE',
  'select',
  '[
    {"value": "<1.3", "label": "<1.3 (world-class)", "icon": "🏆", "pue": 1.25},
    {"value": "1.3-1.5", "label": "1.3–1.5 (good)", "icon": "✅", "pue": 1.4},
    {"value": "1.5-1.8", "label": "1.5–1.8 (average)", "icon": "📊", "pue": 1.65},
    {"value": "1.8-2.0", "label": "1.8–2.0 (needs improvement)", "icon": "📉", "pue": 1.9},
    {"value": "2.0+", "label": "2.0+ (inefficient)", "icon": "⚠️", "pue": 2.2},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "pue": 1.7}
  ]'::jsonb,
  '1.5-1.8',
  true,
  'PUE = Total Facility Power / IT Power (lower is better)',
  10,
  'Operations'
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- Q11: UPTIME REQUIREMENT (Criticality)
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
  'What is your uptime requirement?',
  'uptimeRequirement',
  'select',
  '[
    {"value": "tier1", "label": "99.671% (Tier I)", "icon": "🖥️", "downtimeHours": 28.8},
    {"value": "tier2", "label": "99.741% (Tier II)", "icon": "💻", "downtimeHours": 22},
    {"value": "tier3", "label": "99.982% (Tier III)", "icon": "🏭", "downtimeHours": 1.6},
    {"value": "tier4", "label": "99.995% (Tier IV)", "icon": "🏰", "downtimeHours": 0.4},
    {"value": "five_nines", "label": "99.999% (five nines)", "icon": "🏆", "downtimeHours": 0.09}
  ]'::jsonb,
  'tier3',
  true,
  'Higher uptime = more redundancy = higher BESS value',
  11,
  'Operations'
FROM use_cases WHERE slug = 'data-center';

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
    {"value": "150000-500000", "label": "$150,000–$500,000", "icon": "💸"},
    {"value": "500000+", "label": "$500,000+", "icon": "🏦"},
    {"value": "not_sure", "label": "Not sure", "icon": "❓"}
  ]'::jsonb,
  '75000-150000',
  true,
  'Data centers spend $50-150/MWh on electricity',
  12,
  'Financial'
FROM use_cases WHERE slug = 'data-center';

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
    {"value": "wholesale", "label": "Wholesale/direct access", "icon": "🏭", "savingsMultiplier": 0.6},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "savingsMultiplier": 0.8}
  ]'::jsonb,
  'demand',
  true,
  'Demand charges critical for data centers (flat 24/7 load)',
  13,
  'Financial'
FROM use_cases WHERE slug = 'data-center';

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
    {"value": "voltage_sag", "label": "Voltage sag/dips", "icon": "📉"},
    {"value": "harmonics", "label": "Harmonic distortion", "icon": "🌊"},
    {"value": "frequency_variation", "label": "Frequency variation", "icon": "📊"},
    {"value": "transients", "label": "Transients/surges", "icon": "⚡"},
    {"value": "ups_bypass", "label": "UPS bypass events", "icon": "⚠️"},
    {"value": "none", "label": "None", "icon": "✅"}
  ]'::jsonb,
  '["none"]',
  false,
  'BESS provides power conditioning + seamless backup',
  14,
  'Resilience'
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- Q15: OUTAGE COST (Backup Justification)
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
  'What is the cost of a 1-hour outage to your business?',
  'outageCost',
  'select',
  '[
    {"value": "<50k", "label": "<$50k", "icon": "💵", "backupHours": 2},
    {"value": "50-250k", "label": "$50k–$250k", "icon": "💰", "backupHours": 4},
    {"value": "250k-1m", "label": "$250k–$1M", "icon": "💳", "backupHours": 8},
    {"value": "1-5m", "label": "$1M–$5M", "icon": "💸", "backupHours": 12},
    {"value": "5m+", "label": "$5M+", "icon": "🏦", "backupHours": 24},
    {"value": "not_sure", "label": "Not sure", "icon": "❓", "backupHours": 6}
  ]'::jsonb,
  '250k-1m',
  true,
  'Average data center downtime cost: $300k-900k per hour',
  15,
  'Resilience'
FROM use_cases WHERE slug = 'data-center';

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
    {"value": "add_racks", "label": "Additional racks/servers", "icon": "➕", "kWIncrease": 100},
    {"value": "gpu_ai", "label": "GPU/AI compute expansion", "icon": "🤖", "kWIncrease": 500},
    {"value": "cooling_upgrade", "label": "Cooling system upgrade", "icon": "❄️", "kWIncrease": 200},
    {"value": "generator_upgrade", "label": "Generator/UPS upgrade", "icon": "⚡", "kWIncrease": 0},
    {"value": "solar", "label": "Solar + storage", "icon": "☀️", "kWIncrease": 0},
    {"value": "none", "label": "No expansion planned", "icon": "✅", "kWIncrease": 0}
  ]'::jsonb,
  '["none"]',
  false,
  'Modular BESS scales with data center growth',
  16,
  'Planning'
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
SELECT 
  section_name,
  COUNT(*) as question_count,
  STRING_AGG(field_name, ', ' ORDER BY display_order) as fields
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
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
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
ORDER BY display_order;
