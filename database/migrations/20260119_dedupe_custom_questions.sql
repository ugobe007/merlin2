-- ============================================================================
-- Migration: Deduplicate custom_questions by QUESTION TEXT
-- Date: January 19, 2026
-- Purpose: Remove duplicate questions that have SAME question_text but 
--          DIFFERENT field_names (semantic duplicates)
-- 
-- Problem: Multiple migrations added questions with same text but different
-- field names (e.g., "buildingSqFt" vs "squareFeet" both asking about
-- "Building Square Footage"). This confuses users.
--
-- Affected Industries:
--   - government: governmentSqFt vs buildingSqFt
--   - hotel: existingInfrastructure vs existingGeneration, solarSpace vs solarSpaceAvailable
--   - indoor-farm: growingAreaSqFt vs squareFeet
--   - manufacturing: facilitySqFt vs squareFeet
--   - office: buildingSqFt vs squareFeet
--   - retail: storeSqFt vs squareFeet
--   - warehouse: warehouseSqFt vs squareFeet
--
-- Solution: Delete the GENERIC versions (squareFeet, existingGeneration, etc.)
-- and keep the INDUSTRY-SPECIFIC versions (warehouseSqFt, existingInfrastructure, etc.)
-- ============================================================================

-- STEP 1: Audit what we're about to delete
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SEMANTIC DUPLICATE AUDIT';
    RAISE NOTICE '========================================';
    
    FOR rec IN
        SELECT 
            uc.slug,
            q1.field_name as keep_field,
            q2.field_name as delete_field,
            q1.question_text
        FROM custom_questions q1
        JOIN custom_questions q2 ON q1.use_case_id = q2.use_case_id 
            AND q1.id != q2.id
            AND LOWER(q1.question_text) = LOWER(q2.question_text)
        JOIN use_cases uc ON uc.id = q1.use_case_id
        WHERE q1.display_order < q2.display_order  -- Keep the one with lower order
        ORDER BY uc.slug
    LOOP
        RAISE NOTICE '  %: Keep "%" | Delete "%"', rec.slug, rec.keep_field, rec.delete_field;
    END LOOP;
END $$;

-- STEP 2: Delete the duplicates (higher display_order = generic/later addition)
-- For each use_case, keep only ONE question per question_text (the one with lowest display_order)
WITH duplicates AS (
    SELECT 
        q2.id as id_to_delete,
        q2.field_name,
        uc.slug
    FROM custom_questions q1
    JOIN custom_questions q2 ON q1.use_case_id = q2.use_case_id 
        AND q1.id != q2.id
        AND LOWER(q1.question_text) = LOWER(q2.question_text)
    JOIN use_cases uc ON uc.id = q1.use_case_id
    WHERE q1.display_order < q2.display_order  -- q2 is the duplicate (higher order)
)
DELETE FROM custom_questions 
WHERE id IN (SELECT id_to_delete FROM duplicates);

-- STEP 3: Verify no more duplicates
DO $$
DECLARE
    remaining_dupes INT;
BEGIN
    SELECT COUNT(*) INTO remaining_dupes
    FROM (
        SELECT q1.use_case_id, q1.question_text
        FROM custom_questions q1
        JOIN custom_questions q2 ON q1.use_case_id = q2.use_case_id 
            AND q1.id != q2.id
            AND LOWER(q1.question_text) = LOWER(q2.question_text)
    ) dupes;
    
    IF remaining_dupes = 0 THEN
        RAISE NOTICE '✅ SUCCESS: No semantic duplicates remain!';
    ELSE
        RAISE WARNING '⚠️ WARNING: % semantic duplicates still exist!', remaining_dupes;
    END IF;
END $$;

-- STEP 4: Show final question counts
SELECT 
    uc.slug,
    COUNT(*) as question_count
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
GROUP BY uc.slug
ORDER BY uc.slug;
