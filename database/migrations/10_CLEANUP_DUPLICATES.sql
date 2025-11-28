-- =============================================================================
-- CLEANUP: Remove duplicate questions from batch 7 (run twice issue)
-- Uses ROW_NUMBER() to handle UUID ids
-- =============================================================================

-- Delete duplicate agricultural questions (keep first by created_at or ctid)
DELETE FROM custom_questions
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY field_name ORDER BY created_at ASC) as rn
    FROM custom_questions
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural')
  ) duplicates
  WHERE rn > 1
);

-- Delete duplicate indoor-farm questions
DELETE FROM custom_questions
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY field_name ORDER BY created_at ASC) as rn
    FROM custom_questions
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm')
  ) duplicates
  WHERE rn > 1
);

-- Delete duplicate microgrid questions
DELETE FROM custom_questions
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY field_name ORDER BY created_at ASC) as rn
    FROM custom_questions
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid')
  ) duplicates
  WHERE rn > 1
);

-- Verify final counts
SELECT uc.slug, COUNT(cq.id) as questions 
FROM use_cases uc 
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id 
WHERE uc.slug IN ('agricultural', 'indoor-farm', 'microgrid')
GROUP BY uc.slug
ORDER BY uc.slug;
