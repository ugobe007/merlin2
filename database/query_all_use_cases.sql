-- Query to get ALL use cases/industries from database
-- Run this in Supabase SQL editor to see all 20 industries

SELECT 
  id,
  slug,
  name,
  is_active,
  category,
  icon,
  created_at
FROM use_cases
WHERE is_active = true
ORDER BY slug;

-- Also check custom_questions to see field names for each industry
SELECT 
  uc.slug,
  uc.name,
  COUNT(cq.id) as question_count,
  STRING_AGG(DISTINCT cq.field_name, ', ' ORDER BY cq.field_name) as field_names
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
ORDER BY uc.slug;
