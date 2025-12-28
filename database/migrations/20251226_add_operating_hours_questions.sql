-- ============================================================================
-- ADD OPERATING HOURS QUESTIONS (Universal Pattern)
-- December 26, 2025
-- 
-- Adds operating hours questions to relevant use cases:
-- - Car Wash
-- - Hotel
-- - Retail
-- - Manufacturing
-- - Office Building
-- 
-- Questions:
-- - daysPerWeek: 5-7 days/week (slider)
-- - hoursPerDay: 8-16 hours/day (slider)
-- ============================================================================

-- Helper function to upsert operating hours questions
CREATE OR REPLACE FUNCTION upsert_operating_hours_questions(
  p_slug TEXT,
  p_display_order NUMERIC
) RETURNS VOID AS $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = p_slug LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE NOTICE 'Use case % not found, skipping', p_slug;
    RETURN;
  END IF;
  
  -- Delete existing operating hours questions if they exist
  DELETE FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name IN ('daysPerWeek', 'hoursPerDay');
  
  -- Days per week (5-7)
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
  ) VALUES (
    v_use_case_id, 
    'Days Open Per Week',
    'daysPerWeek',
    'number',
    '7',
    5,
    7,
    true,
    'How many days per week is your facility open?',
    p_display_order
  );
  
  -- Hours per day (8-16)
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
  ) VALUES (
    v_use_case_id, 
    'Hours Open Per Day',
    'hoursPerDay',
    'number',
    '12',
    8,
    24,
    true,
    'How many hours per day is your facility open? (Up to 24 hours)',
    p_display_order + 0.1
  );
  
  RAISE NOTICE 'Added operating hours questions to %', p_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- APPLY TO RELEVANT USE CASES
-- ============================================================================

-- Car Wash (display_order: 1.0 - after brand selection)
SELECT upsert_operating_hours_questions('car-wash', 1.0);

-- Hotel (24/7 operations - but we still ask for consistency)
SELECT upsert_operating_hours_questions('hotel', 1.0);

-- Retail (display_order: 1.0)
SELECT upsert_operating_hours_questions('retail', 1.0);

-- Manufacturing (display_order: 1.0)
SELECT upsert_operating_hours_questions('manufacturing', 1.0);

-- Office Building (display_order: 1.0)
SELECT upsert_operating_hours_questions('office', 1.0);
SELECT upsert_operating_hours_questions('office-building', 1.0);

-- Clean up helper function
DROP FUNCTION IF EXISTS upsert_operating_hours_questions(TEXT, NUMERIC);

