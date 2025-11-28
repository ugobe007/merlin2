-- ============================================================================
-- SYSTEMATIC FIX: Replace utilityRateType with gridConnection
-- ============================================================================
-- Date: November 25, 2025
-- Purpose: Universal fix for ALL use cases - replaces billing question with grid quality
-- Impact: Office, Hotel, Data Center, EV Charging, Manufacturing, ALL future use cases
-- Why: PowerMeter needs gridConnection to show RED/GREEN, validation needs consistent field names

-- Step 1: Update existing utilityRateType questions to gridConnection
UPDATE custom_questions
SET 
  field_name = 'gridConnection',
  question_text = 'Grid connection quality',
  question_type = 'select',
  options = '[
    {"value": "reliable", "label": "Reliable Grid - Stable power, rare outages"},
    {"value": "unreliable", "label": "Unreliable Grid - Frequent outages, needs backup"},
    {"value": "limited", "label": "Limited Capacity - Grid undersized, may need microgrid"},
    {"value": "off_grid", "label": "Off-Grid - No utility connection, full microgrid needed"},
    {"value": "microgrid", "label": "Microgrid - Independent power system with optional grid tie"}
  ]'::jsonb,
  help_text = 'Grid quality determines backup power needs and battery/solar sizing. Critical for PowerMeter calculation.',
  is_required = true
WHERE field_name = 'utilityRateType';

-- Step 2: Add gridCapacity question for limited grid scenarios (if not exists)
INSERT INTO custom_questions (
  use_case_id,
  question_text,
  field_name,
  question_type,
  default_value,
  options,
  is_required,
  min_value,
  max_value,
  display_order,
  help_text
)
SELECT 
  use_case_id,
  'Grid connection capacity (if limited)' as question_text,
  'gridCapacity' as field_name,
  'number' as question_type,
  '0' as default_value,
  NULL as options,
  false as is_required,
  0 as min_value,
  10000 as max_value,
  display_order + 1 as display_order,
  'Enter maximum grid capacity in kW. Leave 0 if unlimited or not applicable.' as help_text
FROM custom_questions
WHERE field_name = 'gridConnection'
AND NOT EXISTS (
  SELECT 1 FROM custom_questions cq2 
  WHERE cq2.use_case_id = custom_questions.use_case_id 
  AND cq2.field_name = 'gridCapacity'
);

-- Step 3: Verify changes across ALL use cases
SELECT 
  uc.name as use_case_name,
  uc.slug as use_case_slug,
  cq.field_name,
  cq.question_text,
  cq.question_type,
  cq.is_required,
  cq.display_order
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE cq.field_name IN ('gridConnection', 'gridCapacity')
ORDER BY uc.name, cq.display_order;

-- Expected Result: Every use case should now have:
-- 1. gridConnection (required) - determines RED/GREEN PowerMeter status
-- 2. gridCapacity (optional) - for limited grid scenarios
