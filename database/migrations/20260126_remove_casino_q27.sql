-- ============================================================================
-- Remove Casino Question #27 - Gaming Floor Size
-- Created: January 26, 2026
-- Issue: Casino has both "Total facility square footage" (#3) and 
--        "Gaming Floor Size" (#27) - remove the duplicate gaming floor question
-- ============================================================================

-- Step 1: Show question #27 (Gaming Floor Size - for verification)
SELECT 
  id,
  display_order,
  field_name,
  question_text,
  question_type,
  is_required
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino')
  AND display_order = 27;

-- Step 2: Delete gaming floor question #27
DELETE FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino')
  AND display_order = 27;

-- Step 3: Verify - show remaining casino questions (should not have #27)
SELECT 
  display_order,
  field_name,
  question_text,
  question_type,
  CASE WHEN is_required THEN 'Required' ELSE 'Optional' END as status
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino')
ORDER BY display_order;
