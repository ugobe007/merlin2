-- ============================================================================
-- COMPREHENSIVE AUDIT OF ALL USE CASE QUESTIONS
-- December 12, 2025
-- 
-- Check all active use cases and their custom questions to verify:
-- 1. Industry-specific questions exist
-- 2. Question types are appropriate (dropdowns vs open fields)
-- 3. No missing or duplicate questions
-- ============================================================================

-- Summary: Question counts by use case
SELECT 
  uc.slug,
  uc.name,
  uc.is_active,
  COUNT(cq.id) as total_questions,
  COUNT(CASE WHEN cq.question_type = 'select' THEN 1 END) as dropdown_count,
  COUNT(CASE WHEN cq.question_type = 'number' THEN 1 END) as number_count,
  COUNT(CASE WHEN cq.question_type = 'boolean' THEN 1 END) as boolean_count,
  COUNT(CASE WHEN cq.question_type = 'text' THEN 1 END) as text_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name, uc.is_active
ORDER BY total_questions ASC, uc.slug;

-- Detailed questions for each active use case
SELECT 
  uc.slug as use_case_slug,
  uc.name as use_case_name,
  cq.display_order,
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    WHEN cq.min_value IS NOT NULL AND cq.max_value IS NOT NULL THEN 'Range: ' || cq.min_value || ' - ' || cq.max_value
    ELSE 'N/A'
  END as constraints
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
ORDER BY uc.slug, cq.display_order;

-- Use cases with potentially generic questions (check for 'squareFeet' and 'monthlyElectricBill' as primary)
SELECT 
  uc.slug,
  uc.name,
  STRING_AGG(cq.field_name, ', ' ORDER BY cq.display_order) as field_names
FROM use_cases uc
JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
HAVING COUNT(cq.id) > 0
ORDER BY uc.slug;
