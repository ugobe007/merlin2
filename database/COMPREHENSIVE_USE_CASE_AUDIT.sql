-- ============================================================================
-- COMPREHENSIVE USE CASE QUESTIONS AUDIT
-- December 12, 2025
-- 
-- Compare database questions against provided specs for:
-- 1. Data Center ✅ (Specs provided Dec 10)
-- 2. Office Building ✅ (Specs provided Dec 10)
-- 3. University/Campus ✅ (Specs provided Dec 10)
-- 4. Airport ✅ (Specs provided Dec 10)
-- 5. Hotel ✅ (Specs provided Dec 10)
-- 6. Car Wash ✅ (Specs provided Dec 10)
-- 7. Gas Station ✅ (FIXED Dec 12)
-- 8. EV Charging ⚠️ (Need updated specs?)
-- 9. Hospital 
-- 10. Warehouse
-- ============================================================================

-- ============================================================================
-- PART 1: SUMMARY OF ALL ACTIVE USE CASES
-- ============================================================================

\echo '======================'
\echo 'SUMMARY: All Active Use Cases'
\echo '======================'

SELECT 
  uc.slug,
  uc.name,
  COUNT(cq.id) as question_count,
  COUNT(CASE WHEN cq.question_type = 'select' THEN 1 END) as dropdowns,
  COUNT(CASE WHEN cq.question_type = 'number' THEN 1 END) as numbers,
  COUNT(CASE WHEN cq.question_type = 'boolean' THEN 1 END) as booleans,
  CASE 
    WHEN COUNT(cq.id) = 0 THEN '❌ NO QUESTIONS'
    WHEN COUNT(cq.id) < 10 THEN '⚠️ TOO FEW'
    WHEN COUNT(CASE WHEN cq.question_type = 'number' THEN 1 END) > 5 THEN '⚠️ TOO MANY OPEN FIELDS'
    ELSE '✅ GOOD'
  END as status
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
ORDER BY question_count ASC, uc.slug;

-- ============================================================================
-- PART 2: DETAILED QUESTIONS FOR EACH USE CASE
-- ============================================================================

\echo ''
\echo '======================'
\echo 'DATA CENTER Questions'
\echo '======================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' opts'
    ELSE 'N/A'
  END as options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'data-center'
ORDER BY cq.display_order;

\echo ''
\echo '======================'
\echo 'OFFICE BUILDING Questions'
\echo '======================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' opts'
    ELSE 'N/A'
  END as options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'office'
ORDER BY cq.display_order;

\echo ''
\echo '======================'
\echo 'UNIVERSITY/CAMPUS Questions'
\echo '======================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' opts'
    ELSE 'N/A'
  END as options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'college'
ORDER BY cq.display_order;

\echo ''
\echo '======================'
\echo 'AIRPORT Questions'
\echo '======================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' opts'
    ELSE 'N/A'
  END as options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'airport'
ORDER BY cq.display_order;

\echo ''
\echo '======================'
\echo 'HOTEL Questions'
\echo '======================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' opts'
    ELSE 'N/A'
  END as options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'hotel'
ORDER BY cq.display_order;

\echo ''
\echo '======================'
\echo 'CAR WASH Questions'
\echo '======================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' opts'
    ELSE 'N/A'
  END as options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'car-wash'
ORDER BY cq.display_order;

\echo ''
\echo '======================'
\echo 'GAS STATION Questions ✅ (Just Fixed)'
\echo '======================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' opts'
    ELSE 'N/A'
  END as options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'gas-station'
ORDER BY cq.display_order;

\echo ''
\echo '======================'
\echo 'EV CHARGING Questions'
\echo '======================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' opts'
    ELSE 'N/A'
  END as options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'ev-charging'
ORDER BY cq.display_order;

\echo ''
\echo '======================'
\echo 'HOSPITAL Questions'
\echo '======================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' opts'
    ELSE 'N/A'
  END as options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'hospital'
ORDER BY cq.display_order;

\echo ''
\echo '======================'
\echo 'WAREHOUSE Questions'
\echo '======================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' opts'
    ELSE 'N/A'
  END as options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'warehouse'
ORDER BY cq.display_order;

-- ============================================================================
-- PART 3: IDENTIFY ISSUES
-- ============================================================================

\echo ''
\echo '======================'
\echo 'ISSUES DETECTED'
\echo '======================'

-- Use cases with no industry-specific questions (first question is generic 'squareFeet')
SELECT 
  'Generic Questions Detected' as issue_type,
  uc.slug,
  uc.name,
  (SELECT cq2.field_name FROM custom_questions cq2 WHERE cq2.use_case_id = uc.id ORDER BY cq2.display_order LIMIT 1) as first_field
FROM use_cases uc
WHERE uc.is_active = true
  AND EXISTS (
    SELECT 1 FROM custom_questions cq 
    WHERE cq.use_case_id = uc.id 
      AND cq.field_name = 'squareFeet'
      AND cq.display_order = 1
  )
ORDER BY uc.slug;

\echo ''

-- Use cases with too many open numeric fields (should be dropdowns)
SELECT 
  'Too Many Open Number Fields' as issue_type,
  uc.slug,
  uc.name,
  COUNT(CASE WHEN cq.question_type = 'number' THEN 1 END) as number_fields
FROM use_cases uc
JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
HAVING COUNT(CASE WHEN cq.question_type = 'number' THEN 1 END) > 5
ORDER BY number_fields DESC;

\echo ''

-- Use cases with too few questions
SELECT 
  'Too Few Questions' as issue_type,
  uc.slug,
  uc.name,
  COUNT(cq.id) as question_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
HAVING COUNT(cq.id) < 10
ORDER BY question_count;

-- ============================================================================
-- PART 4: RECOMMENDATIONS
-- ============================================================================

\echo ''
\echo '======================'
\echo 'RECOMMENDATIONS'
\echo '======================'
\echo '1. Gas Station: ✅ FIXED - Now has 16 industry-specific questions'
\echo '2. EV Charging: ⚠️ NEEDS REVIEW - Check if specs are current'
\echo '3. Data Center: Should ask for IT load, tier level, PUE'
\echo '4. Airport: Should ask for passenger count, terminal size, gates'
\echo '5. Hotel: Should ask for rooms, hotel class, amenities'
\echo '6. Car Wash: Should ask for bay count, wash type, dryer type'
\echo '7. Office: Should ask for building class, tenant type, floors'
\echo '8. University: Should ask for enrollment, campus type, facilities'
\echo '9. Hospital: Should ask for beds, dept types, imaging equipment'
\echo '10. Warehouse: Should ask for type (cold storage vs ambient), robotics'
\echo ''
\echo '======================'
