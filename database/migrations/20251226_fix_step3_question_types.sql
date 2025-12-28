-- ============================================================================
-- FIX STEP 3 QUESTION TYPES FOR PROPER UI RENDERING
-- December 26, 2025
-- 
-- Updates question types in database to match UI expectations:
-- - Elevator count: 'number' type with min/max for stepper control
-- - Food & beverage: 'compound' type for multiselect buttons
-- - Square footage: 'number' type with min/max for slider with presets
-- - Hours per day: 'number' type with min/max for slider (already done, but verify)
-- ============================================================================

-- Helper function to update question type
CREATE OR REPLACE FUNCTION update_question_type(
  p_slug TEXT,
  p_field_name TEXT,
  p_question_type TEXT,
  p_min_value NUMERIC DEFAULT NULL,
  p_max_value NUMERIC DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = p_slug LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE NOTICE 'Use case % not found, skipping', p_slug;
    RETURN;
  END IF;
  
  UPDATE custom_questions
  SET 
    question_type = p_question_type,
    min_value = COALESCE(p_min_value, min_value),
    max_value = COALESCE(p_max_value, max_value)
  WHERE use_case_id = v_use_case_id 
    AND field_name = p_field_name;
  
  RAISE NOTICE 'Updated % for %: type=%', p_field_name, p_slug, p_question_type;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HOTEL - Elevator Count
-- ============================================================================
-- The UI code (Step3FacilityDetails.tsx line 1218) expects 'select' type with options
-- to render buttons. However, the database shows it's currently 'number' type.
-- The migration 20250103_update_hotel_elevator_scale.sql was supposed to set it to 'select',
-- but it seems it's been changed or not applied correctly.
-- 
-- We need to convert it back to 'select' type with options 1-25 for button rendering.
-- 
UPDATE custom_questions
SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "1", "value": "1"},
    {"label": "2", "value": "2"},
    {"label": "3", "value": "3"},
    {"label": "4", "value": "4"},
    {"label": "5", "value": "5"},
    {"label": "6", "value": "6"},
    {"label": "7", "value": "7"},
    {"label": "8", "value": "8"},
    {"label": "9", "value": "9"},
    {"label": "10", "value": "10"},
    {"label": "11", "value": "11"},
    {"label": "12", "value": "12"},
    {"label": "13", "value": "13"},
    {"label": "14", "value": "14"},
    {"label": "15", "value": "15"},
    {"label": "16", "value": "16"},
    {"label": "17", "value": "17"},
    {"label": "18", "value": "18"},
    {"label": "19", "value": "19"},
    {"label": "20", "value": "20"},
    {"label": "21", "value": "21"},
    {"label": "22", "value": "22"},
    {"label": "23", "value": "23"},
    {"label": "24", "value": "24"},
    {"label": "25", "value": "25"}
  ]'::jsonb
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
  AND field_name = 'elevatorCount'
  AND question_type = 'number';

-- ============================================================================
-- HOTEL - Food & Beverage
-- ============================================================================
-- Should be 'compound' type for multiselect buttons (already correct, but verify)
-- Food & beverage question should remain as 'compound' type
-- No changes needed if already 'compound'

-- ============================================================================
-- ALL USE CASES - Square Footage Questions
-- ============================================================================
-- Ensure square footage questions use 'number' type with proper min/max for slider control
-- The migration 20251226_add_rooftop_square_footage.sql sets:
--   - totalFacilitySquareFootage: min=1000, max=500000
--   - rooftopSquareFootage: min=500, max=1000000
-- 
-- Let's verify and fix any inconsistencies (some may be 'select' type from older migrations)

UPDATE custom_questions
SET 
  question_type = 'number',
  min_value = CASE 
    WHEN field_name = 'totalFacilitySquareFootage' THEN COALESCE(min_value, 1000)
    WHEN field_name = 'rooftopSquareFootage' THEN COALESCE(min_value, 500)
    ELSE COALESCE(min_value, 1000)
  END,
  max_value = CASE 
    WHEN field_name = 'totalFacilitySquareFootage' THEN 500000  -- Fix max from 10000000 to 500000
    WHEN field_name = 'rooftopSquareFootage' THEN COALESCE(max_value, 1000000)
    ELSE COALESCE(max_value, 500000)
  END,
  options = NULL  -- Remove options if converting from 'select' to 'number'
WHERE field_name IN ('totalFacilitySquareFootage', 'totalFacilitySqFt', 'rooftopSquareFootage', 'squareFeet', 'facilitySqFt')
  AND (question_type != 'number' OR field_name = 'totalFacilitySquareFootage' AND max_value > 500000);

-- ============================================================================
-- ALL USE CASES - Hours Per Day
-- ============================================================================
-- Ensure hours per day uses 'number' type with max 24 (currently max is 16)
UPDATE custom_questions
SET 
  question_type = 'number',
  min_value = COALESCE(min_value, 8),
  max_value = 24  -- Ensure max is 24 hours (fixes current 16)
WHERE field_name IN ('hoursPerDay', 'operatingHours')
  AND max_value < 24;

-- Clean up helper function
DROP FUNCTION IF EXISTS update_question_type(TEXT, TEXT, TEXT, NUMERIC, NUMERIC);

-- ============================================================================
-- VERIFY CHANGES
-- ============================================================================
SELECT 
  uc.slug,
  cq.field_name,
  cq.question_text,
  cq.question_type,
  cq.min_value,
  cq.max_value,
  CASE WHEN cq.options IS NOT NULL THEN 'Has options' ELSE 'No options' END as has_options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE cq.field_name IN ('elevatorCount', 'elevator_count', 'elevators', 'foodBeverage', 'food_beverage', 
                        'totalFacilitySquareFootage', 'rooftopSquareFootage', 'hoursPerDay', 'daysPerWeek')
ORDER BY uc.slug, cq.display_order;

