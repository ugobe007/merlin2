-- Run this in Supabase SQL Editor to diagnose question loading issues
-- This will show what's in the database

-- 1. Show all use cases with their question counts
SELECT 
  uc.slug,
  uc.name,
  uc.is_active,
  COUNT(cq.id) as question_count,
  COUNT(CASE WHEN cq.question_tier = 'essential' THEN 1 END) as essential_count,
  COUNT(CASE WHEN cq.question_tier = 'standard' THEN 1 END) as standard_count,
  COUNT(CASE WHEN cq.question_tier = 'detailed' THEN 1 END) as detailed_count,
  COUNT(CASE WHEN cq.question_tier IS NULL THEN 1 END) as no_tier_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
GROUP BY uc.slug, uc.name, uc.is_active
ORDER BY uc.name;

-- 2. Specifically check the problem use cases
SELECT 
  uc.slug as use_case_slug,
  cq.field_name,
  cq.question_text,
  cq.question_tier,
  cq.display_order
FROM use_cases uc
JOIN custom_questions cq ON uc.id = cq.use_case_id
WHERE uc.slug IN ('car-wash', 'hotel', 'restaurant', 'cold-storage', 'apartment', 'ev-charging')
ORDER BY uc.slug, cq.display_order;

-- 3. Check for slug mismatches (underscores vs hyphens)
SELECT slug, name, is_active 
FROM use_cases 
WHERE slug LIKE '%wash%' 
   OR slug LIKE '%hotel%' 
   OR slug LIKE '%restaurant%'
   OR slug LIKE '%cold%'
   OR slug LIKE '%apartment%'
   OR slug LIKE '%ev%charging%'
ORDER BY slug;
