-- ============================================================================
-- DIAGNOSTIC: Show What Will Be Deleted by Migration
-- Run this BEFORE running the migration to preview changes
-- ============================================================================

-- Show ALL square footage questions grouped by industry
SELECT 
  uc.slug as industry,
  uc.name as industry_name,
  cq.id,
  cq.field_name,
  cq.question_text,
  cq.display_order,
  cq.is_required
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE cq.field_name IN ('squareFeet', 'squareFootage', 'totalSqFt')
ORDER BY uc.slug, cq.id;

-- Count duplicates per industry
SELECT 
  uc.slug as industry,
  cq.field_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 1 THEN '⚠️ HAS DUPLICATES'
    ELSE '✅ No duplicates'
  END as status
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE cq.field_name IN ('squareFeet', 'squareFootage', 'totalSqFt')
GROUP BY uc.slug, cq.field_name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Show which questions will be KEPT (first ID per industry)
WITH ranked AS (
  SELECT 
    uc.slug,
    cq.id,
    cq.field_name,
    cq.question_text,
    ROW_NUMBER() OVER (PARTITION BY cq.use_case_id, cq.field_name ORDER BY cq.id ASC) as rn
  FROM custom_questions cq
  JOIN use_cases uc ON cq.use_case_id = uc.id
  WHERE cq.field_name IN ('squareFeet', 'squareFootage')
)
SELECT 
  slug as industry,
  id,
  field_name,
  question_text,
  CASE WHEN rn = 1 THEN '✅ WILL KEEP' ELSE '❌ WILL DELETE' END as action
FROM ranked
ORDER BY slug, rn;
