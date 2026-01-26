-- ============================================================================
-- Remove ALL Duplicate Square Footage Questions Across ALL Industries
-- Created: January 26, 2026
-- Issue: Multiple industries have duplicate squareFeet/squareFootage questions
-- ============================================================================

-- Step 1: Standardize field names - rename 'squareFootage' to 'squareFeet'
UPDATE custom_questions 
SET field_name = 'squareFeet' 
WHERE field_name = 'squareFootage';

-- Step 2: Delete duplicate 'totalSqFt' questions (if any exist)
DELETE FROM custom_questions 
WHERE field_name = 'totalSqFt';

-- Step 3: For each use_case, keep ONLY the first squareFeet question (lowest ID)
-- This uses a CTE to identify duplicates
WITH ranked_questions AS (
  SELECT 
    id,
    use_case_id,
    field_name,
    ROW_NUMBER() OVER (PARTITION BY use_case_id, field_name ORDER BY id ASC) as rn
  FROM custom_questions
  WHERE field_name = 'squareFeet'
)
DELETE FROM custom_questions
WHERE id IN (
  SELECT id 
  FROM ranked_questions 
  WHERE rn > 1  -- Keep first (rn=1), delete rest
);

-- Step 4: Verify - show remaining squareFeet questions (should be max 1 per industry)
SELECT 
  uc.slug as industry,
  uc.name as industry_name,
  cq.field_name,
  cq.question_text,
  cq.display_order,
  cq.id
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE cq.field_name IN ('squareFeet', 'squareFootage', 'totalSqFt')
ORDER BY uc.slug, cq.display_order;
