-- ============================================================================
-- MIGRATION: Deduplicate ALL Custom Questions Across ALL Industries
-- Created: January 19, 2026
-- Purpose: Remove duplicate questions that were added by overlapping migrations
-- Strategy: Keep question with LOWEST display_order for each (use_case_id, field_name)
-- ============================================================================

-- STEP 1: Log current state before cleanup
DO $$
DECLARE
  total_before INTEGER;
  duplicates_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_before FROM custom_questions;
  
  SELECT COUNT(*) INTO duplicates_count FROM (
    SELECT use_case_id, field_name, COUNT(*) as cnt
    FROM custom_questions
    WHERE field_name IS NOT NULL
    GROUP BY use_case_id, field_name
    HAVING COUNT(*) > 1
  ) dups;
  
  RAISE NOTICE '=== DEDUPLICATION STARTING ===';
  RAISE NOTICE 'Total questions before: %', total_before;
  RAISE NOTICE 'Duplicate field_name groups found: %', duplicates_count;
END $$;

-- STEP 2: Create temp table of IDs to DELETE (all but lowest display_order per field_name)
CREATE TEMP TABLE questions_to_delete AS
SELECT id FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY use_case_id, field_name 
      ORDER BY display_order ASC NULLS LAST, created_at ASC
    ) as rn
  FROM custom_questions
  WHERE field_name IS NOT NULL
) ranked
WHERE rn > 1;

-- STEP 3: Log what we're about to delete
DO $$
DECLARE
  delete_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO delete_count FROM questions_to_delete;
  RAISE NOTICE 'Questions to be deleted: %', delete_count;
END $$;

-- STEP 4: Delete duplicates
DELETE FROM custom_questions
WHERE id IN (SELECT id FROM questions_to_delete);

-- STEP 5: Drop temp table
DROP TABLE questions_to_delete;

-- STEP 6: Log final state
DO $$
DECLARE
  total_after INTEGER;
  remaining_dups INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_after FROM custom_questions;
  
  SELECT COUNT(*) INTO remaining_dups FROM (
    SELECT use_case_id, field_name, COUNT(*) as cnt
    FROM custom_questions
    WHERE field_name IS NOT NULL
    GROUP BY use_case_id, field_name
    HAVING COUNT(*) > 1
  ) dups;
  
  RAISE NOTICE '=== DEDUPLICATION COMPLETE ===';
  RAISE NOTICE 'Total questions after: %', total_after;
  RAISE NOTICE 'Remaining duplicates: %', remaining_dups;
END $$;

-- STEP 7: Verify per-industry question counts
SELECT 
  uc.slug as industry,
  COUNT(cq.id) as question_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
WHERE uc.is_active = true
GROUP BY uc.slug
ORDER BY uc.slug;

-- STEP 8: List any industries with unusual question counts (not 16)
SELECT 
  uc.slug as industry,
  COUNT(cq.id) as question_count,
  CASE 
    WHEN COUNT(cq.id) < 10 THEN '⚠️ TOO FEW'
    WHEN COUNT(cq.id) > 20 THEN '⚠️ TOO MANY'
    ELSE '✅ OK'
  END as status
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
WHERE uc.is_active = true
GROUP BY uc.slug
HAVING COUNT(cq.id) < 10 OR COUNT(cq.id) > 20
ORDER BY COUNT(cq.id) DESC;
