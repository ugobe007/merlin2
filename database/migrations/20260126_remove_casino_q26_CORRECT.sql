-- ============================================================================
-- Remove Casino Duplicate Square Footage Questions (FINAL FIX)
-- Created: January 26, 2026
-- Issue: Casino has THREE duplicate square footage questions:
--        - Question #2: gamingFloorSqFt ("Gaming Floor Square Footage")
--        - Question #3: squareFeet ("Total facility square footage")
--        - Question #29: gamingFloorSize ("Gaming Floor Size (square feet)")
-- Keep ONLY question #3 (squareFeet) - remove #2 and #29
-- ============================================================================

-- Step 1: Show all square footage questions (for verification)
SELECT 
  id,
  display_order,
  field_name,
  question_text,
  question_type,
  is_required
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino')
  AND field_name IN ('gamingFloorSqFt', 'squareFeet', 'gamingFloorSize')
ORDER BY display_order;

-- Step 2: Delete question #26 specifically (Gaming Floor Size)
DELETE FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino')
  AND display_order = 26;

-- Step 3: Verify - show remaining casino questions (should not have #26)
SELECT 
  display_order,
  field_name,
  question_text,
  question_type,
  CASE WHEN is_required THEN 'Required' ELSE 'Optional' END as status
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino')
ORDER BY display_order;

-- Step 4: Show all square footage related questions to verify no more duplicates
SELECT 
  display_order,
  field_name,
  question_text
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino')
  AND (
    field_name LIKE '%sqft%' 
    OR field_name LIKE '%square%' 
    OR question_text ILIKE '%square%'
  )
ORDER BY display_order;
