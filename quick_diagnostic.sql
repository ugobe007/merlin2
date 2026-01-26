-- ============================================================================
-- QUICK DIAGNOSTIC - 3 Essential Queries
-- ============================================================================

-- 1. Total questions count
SELECT COUNT(*) FROM custom_questions;

-- 2. Questions per industry
SELECT 
  uc.slug,
  uc.name,
  COUNT(cq.id) as question_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
ORDER BY uc.slug;

-- 3. Sample hotel questions (field names - THIS IS CRITICAL)
SELECT 
  field_name,
  question_type,
  question_text,
  options::text as options_preview
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug = 'hotel'
ORDER BY cq.display_order
LIMIT 5;
