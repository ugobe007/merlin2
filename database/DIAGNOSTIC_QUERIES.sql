-- =====================================================
-- USE CASE DIAGNOSTIC QUERIES
-- Run these in Supabase SQL Editor to diagnose issues
-- December 9, 2025
-- =====================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- QUERY 1: List ALL active use cases with question counts
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    uc.slug,
    uc.name,
    uc.category,
    uc.is_active,
    (SELECT COUNT(*) FROM custom_questions cq WHERE cq.use_case_id = uc.id) as question_count
FROM use_cases uc
WHERE uc.is_active = true
ORDER BY uc.name;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUERY 2: Check for MISSING use cases that code expects
-- These slugs are in the code but may be missing from DB
-- ═══════════════════════════════════════════════════════════════════════════
SELECT expected_slug, 
       CASE WHEN uc.id IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
       uc.name
FROM (VALUES 
    ('office'),
    ('hotel'),
    ('hotel-hospitality'),
    ('hospital'),
    ('datacenter'),
    ('data-center'),
    ('ev-charging'),
    ('airport'),
    ('manufacturing'),
    ('warehouse'),
    ('logistics'),
    ('cold-storage'),
    ('retail'),
    ('shopping-center'),
    ('agriculture'),
    ('casino'),
    ('tribal-casino'),
    ('indoor-farm'),
    ('apartment'),
    ('apartments'),
    ('apartment-building'),
    ('college'),
    ('university'),
    ('car-wash'),
    ('gas-station'),
    ('government'),
    ('public-building'),
    ('microgrid'),
    ('edge-data-center'),
    ('distribution-center'),
    ('residential')
) AS expected(expected_slug)
LEFT JOIN use_cases uc ON uc.slug = expected_slug OR uc.slug LIKE expected_slug || '%'
ORDER BY status DESC, expected_slug;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUERY 3: List custom questions for each use case
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    uc.slug,
    uc.name as use_case_name,
    cq.field_name,
    cq.question_type,
    cq.default_value
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
ORDER BY uc.slug, cq.display_order;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUERY 4: Check for duplicate slugs (should be 0)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT slug, COUNT(*) as count
FROM use_cases
GROUP BY slug
HAVING COUNT(*) > 1;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUERY 5: Find use cases with NO custom questions (potential problem)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT uc.slug, uc.name, uc.category
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name, uc.category
HAVING COUNT(cq.id) = 0;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUERY 6: Check EV charging field names in custom questions
-- (These have been problematic)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    uc.slug,
    cq.field_name,
    cq.question_text
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE cq.field_name LIKE '%charger%' 
   OR cq.field_name LIKE '%ev%'
   OR cq.field_name LIKE '%dcf%'
   OR cq.field_name LIKE '%level%'
ORDER BY uc.slug, cq.field_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUERY 7: Check for expected fields in key use cases
-- ═══════════════════════════════════════════════════════════════════════════

-- Airport should have: annualPassengers
SELECT 'airport' as use_case, 
       CASE WHEN EXISTS (
           SELECT 1 FROM custom_questions cq 
           JOIN use_cases uc ON cq.use_case_id = uc.id 
           WHERE uc.slug = 'airport' AND cq.field_name = 'annualPassengers'
       ) THEN '✅ Has annualPassengers' ELSE '❌ MISSING annualPassengers' END as status;

-- Hotel should have: roomCount or numberOfRooms
SELECT 'hotel' as use_case,
       CASE WHEN EXISTS (
           SELECT 1 FROM custom_questions cq 
           JOIN use_cases uc ON cq.use_case_id = uc.id 
           WHERE (uc.slug = 'hotel' OR uc.slug = 'hotel-hospitality')
             AND (cq.field_name = 'roomCount' OR cq.field_name = 'numberOfRooms')
       ) THEN '✅ Has roomCount' ELSE '❌ MISSING roomCount' END as status;

-- Warehouse should have: squareFeet
SELECT 'warehouse' as use_case,
       CASE WHEN EXISTS (
           SELECT 1 FROM custom_questions cq 
           JOIN use_cases uc ON cq.use_case_id = uc.id 
           WHERE uc.slug = 'warehouse' AND cq.field_name = 'squareFeet'
       ) THEN '✅ Has squareFeet' ELSE '❌ MISSING squareFeet' END as status;

-- Casino should have: gamingSpaceSqFt
SELECT 'casino' as use_case,
       CASE WHEN EXISTS (
           SELECT 1 FROM custom_questions cq 
           JOIN use_cases uc ON cq.use_case_id = uc.id 
           WHERE (uc.slug = 'casino' OR uc.slug = 'tribal-casino')
             AND cq.field_name = 'gamingSpaceSqFt'
       ) THEN '✅ Has gamingSpaceSqFt' ELSE '❌ MISSING gamingSpaceSqFt' END as status;
