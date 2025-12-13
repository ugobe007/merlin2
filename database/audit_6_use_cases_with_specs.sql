-- ============================================================================
-- AUDIT: Data Center, Office, University, Airport, Hotel, Car Wash
-- December 12, 2025
-- 
-- Check if database questions match the specs provided on Dec 10, 2025
-- ============================================================================

\echo '============================================'
\echo '1. DATA CENTER - Should have tier/classification questions'
\echo '============================================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    ELSE 'N/A'
  END as options,
  CASE
    WHEN cq.field_name IN ('classification', 'tierLevel', 'itLoadKW', 'pue') THEN '✅ Spec-based'
    WHEN cq.field_name IN ('squareFeet', 'monthlyElectricBill') THEN '⚠️ Generic'
    ELSE '➖'
  END as assessment
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'data-center'
ORDER BY cq.display_order;

\echo ''
\echo '============================================'
\echo '2. OFFICE BUILDING - Should have building class questions'
\echo '============================================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    ELSE 'N/A'
  END as options,
  CASE
    WHEN cq.field_name IN ('buildingClass', 'officeType', 'floors', 'tenantType') THEN '✅ Spec-based'
    WHEN cq.field_name IN ('squareFeet', 'monthlyElectricBill') THEN '⚠️ Generic'
    ELSE '➖'
  END as assessment
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'office'
ORDER BY cq.display_order;

\echo ''
\echo '============================================'
\echo '3. UNIVERSITY/CAMPUS - Should have enrollment questions'
\echo '============================================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    ELSE 'N/A'
  END as options,
  CASE
    WHEN cq.field_name IN ('studentCount', 'campusType', 'researchFacilities', 'housingCount') THEN '✅ Spec-based'
    WHEN cq.field_name IN ('squareFeet', 'monthlyElectricBill') THEN '⚠️ Generic'
    ELSE '➖'
  END as assessment
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'college'
ORDER BY cq.display_order;

\echo ''
\echo '============================================'
\echo '4. AIRPORT - Should have passenger/gate questions'
\echo '============================================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    ELSE 'N/A'
  END as options,
  CASE
    WHEN cq.field_name IN ('annualPassengers', 'terminalSqFt', 'gateCount', 'runwayOps') THEN '✅ Spec-based'
    WHEN cq.field_name IN ('squareFeet', 'monthlyElectricBill') THEN '⚠️ Generic'
    ELSE '➖'
  END as assessment
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'airport'
ORDER BY cq.display_order;

\echo ''
\echo '============================================'
\echo '5. HOTEL - Should have rooms/class/amenity questions'
\echo '============================================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    ELSE 'N/A'
  END as options,
  CASE
    WHEN cq.field_name IN ('roomCount', 'hotelClass', 'amenities', 'foodServiceType', 'laundryType') THEN '✅ Spec-based'
    WHEN cq.field_name IN ('squareFeet', 'monthlyElectricBill') THEN '⚠️ Generic'
    ELSE '➖'
  END as assessment
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'hotel'
ORDER BY cq.display_order;

\echo ''
\echo '============================================'
\echo '6. CAR WASH - Should have wash type/bay questions'
\echo '============================================'

SELECT 
  cq.display_order as "#",
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.is_required as req,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    ELSE 'N/A'
  END as options,
  CASE
    WHEN cq.field_name IN ('washType', 'bayCount', 'dryerType', 'waterReclamation', 'automationLevel') THEN '✅ Spec-based'
    WHEN cq.field_name IN ('squareFeet', 'monthlyElectricBill') THEN '⚠️ Generic'
    ELSE '➖'
  END as assessment
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'car-wash'
ORDER BY cq.display_order;

\echo ''
\echo '============================================'
\echo 'SUMMARY: Issues Found'
\echo '============================================'

-- Count generic vs specific questions
SELECT 
  uc.slug,
  uc.name,
  COUNT(cq.id) as total_questions,
  COUNT(CASE WHEN cq.field_name IN ('squareFeet', 'monthlyElectricBill', 'monthlyDemandCharges', 'gridCapacityKW', 'operatingHours') THEN 1 END) as generic_questions,
  COUNT(CASE WHEN cq.field_name NOT IN ('squareFeet', 'monthlyElectricBill', 'monthlyDemandCharges', 'gridCapacityKW', 'operatingHours', 'existingSolarKW', 'wantsSolar', 'primaryBESSApplication', 'hasEVCharging', 'gridReliabilityIssues', 'gridSavingsGoal') THEN 1 END) as industry_specific,
  CASE
    WHEN COUNT(CASE WHEN cq.field_name NOT IN ('squareFeet', 'monthlyElectricBill', 'monthlyDemandCharges', 'gridCapacityKW', 'operatingHours', 'existingSolarKW', 'wantsSolar', 'primaryBESSApplication', 'hasEVCharging', 'gridReliabilityIssues', 'gridSavingsGoal') THEN 1 END) >= 5 THEN '✅ HAS SPECIFIC'
    ELSE '❌ NEEDS WORK'
  END as status
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.slug IN ('data-center', 'office', 'college', 'airport', 'hotel', 'car-wash')
GROUP BY uc.id, uc.slug, uc.name
ORDER BY industry_specific DESC;
