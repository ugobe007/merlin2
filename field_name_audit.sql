-- ============================================================================
-- FIELD NAME AUDIT - All Industries
-- Shows exact field_name for every question to compare with Step3Integration.tsx
-- ============================================================================

SELECT 
  uc.slug as industry,
  cq.field_name,
  cq.question_type,
  cq.is_required,
  CASE 
    WHEN jsonb_typeof(cq.options) = 'array' THEN jsonb_array_length(cq.options)
    ELSE 0
  END as option_count,
  CASE
    WHEN cq.options::text LIKE '%value%' THEN 
      (SELECT string_agg(opt->>'value', ', ')
       FROM jsonb_array_elements(cq.options) opt
       LIMIT 5)
    ELSE 'N/A'
  END as sample_values
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.is_active = true
ORDER BY uc.slug, cq.display_order;
