-- Audit: Foundational Variables by Industry
-- Verifies that critical foundational variables exist in custom_questions

-- Hotel: roomCount
SELECT 
  'hotel' as industry,
  'roomCount' as foundational_field,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM custom_questions cq
      JOIN use_cases uc ON cq.use_case_id = uc.id
      WHERE uc.slug = 'hotel' AND cq.field_name = 'roomCount'
    ) THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as status,
  cq.field_name,
  cq.question_text,
  cq.is_required,
  cq.default_value,
  cq.display_order
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug = 'hotel' AND cq.field_name = 'roomCount';

-- Car Wash: bayCount or tunnelCount
SELECT 
  'car-wash' as industry,
  'bayCount/tunnelCount' as foundational_field,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM custom_questions cq
      JOIN use_cases uc ON cq.use_case_id = uc.id
      WHERE uc.slug = 'car-wash' AND (cq.field_name = 'bayCount' OR cq.field_name = 'tunnelCount')
    ) THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as status,
  cq.field_name,
  cq.question_text,
  cq.is_required,
  cq.default_value
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug = 'car-wash' AND (cq.field_name = 'bayCount' OR cq.field_name = 'tunnelCount');

-- Data Center: rackCount or itLoadKW
SELECT 
  'data-center' as industry,
  'rackCount/itLoadKW' as foundational_field,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM custom_questions cq
      JOIN use_cases uc ON cq.use_case_id = uc.id
      WHERE uc.slug = 'data-center' AND (cq.field_name = 'rackCount' OR cq.field_name = 'itLoadKW')
    ) THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as status,
  cq.field_name,
  cq.question_text,
  cq.is_required,
  cq.default_value
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug = 'data-center' AND (cq.field_name = 'rackCount' OR cq.field_name = 'itLoadKW');

-- Hospital: bedCount
SELECT 
  'hospital' as industry,
  'bedCount' as foundational_field,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM custom_questions cq
      JOIN use_cases uc ON cq.use_case_id = uc.id
      WHERE uc.slug = 'hospital' AND cq.field_name = 'bedCount'
    ) THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as status,
  cq.field_name,
  cq.question_text,
  cq.is_required,
  cq.default_value
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug = 'hospital' AND cq.field_name = 'bedCount';

-- Summary: All foundational variables
WITH foundational_vars AS (
  SELECT 'hotel' as industry, 'roomCount' as field_name
  UNION ALL SELECT 'car-wash', 'bayCount'
  UNION ALL SELECT 'car-wash', 'tunnelCount'
  UNION ALL SELECT 'data-center', 'rackCount'
  UNION ALL SELECT 'data-center', 'itLoadKW'
  UNION ALL SELECT 'hospital', 'bedCount'
  UNION ALL SELECT 'ev-charging', 'level2Count'
  UNION ALL SELECT 'ev-charging', 'dcFastCount'
  UNION ALL SELECT 'apartment', 'unitCount'
  UNION ALL SELECT 'warehouse', 'warehouseSqFt'
  UNION ALL SELECT 'manufacturing', 'facilitySqFt'
  UNION ALL SELECT 'retail', 'storeSqFt'
  UNION ALL SELECT 'office', 'buildingSqFt'
)
SELECT 
  fv.industry,
  fv.field_name as expected_field,
  CASE 
    WHEN cq.field_name IS NOT NULL THEN '✅ FOUND'
    ELSE '❌ MISSING'
  END as status,
  cq.question_text,
  cq.is_required,
  cq.default_value,
  cq.display_order
FROM foundational_vars fv
LEFT JOIN use_cases uc ON uc.slug = fv.industry
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id AND cq.field_name = fv.field_name
ORDER BY fv.industry, fv.field_name;
