-- ============================================================================
-- DIAGNOSTIC SQL QUERIES - Find Questions in Database
-- Run these queries and share the results
-- ============================================================================

-- QUERY 1: Check if custom_questions table exists and count total records
-- ============================================================================
SELECT COUNT(*) as total_questions 
FROM custom_questions;

-- QUERY 2: Check use_cases table - verify industry slugs
-- ============================================================================
SELECT 
  id,
  slug,
  name,
  is_active,
  (SELECT COUNT(*) FROM custom_questions WHERE use_case_id = use_cases.id) as question_count
FROM use_cases 
WHERE is_active = true
ORDER BY slug;

-- QUERY 3: Sample questions from hotel industry (multiple slug formats)
-- ============================================================================
-- Try: hotel
SELECT 
  cq.field_name,
  cq.question_type,
  cq.question_text,
  cq.is_required,
  uc.slug as industry_slug
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug = 'hotel'
LIMIT 10;

-- QUERY 4: Sample questions from car-wash industry
-- ============================================================================
SELECT 
  cq.field_name,
  cq.question_type,
  cq.question_text,
  cq.is_required,
  uc.slug as industry_slug
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug = 'car-wash'
LIMIT 10;

-- QUERY 5: Sample questions from ev-charging industry
-- ============================================================================
SELECT 
  cq.field_name,
  cq.question_type,
  cq.question_text,
  cq.is_required,
  uc.slug as industry_slug
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug = 'ev-charging'
LIMIT 10;

-- QUERY 6: All button-type questions across ALL industries
-- ============================================================================
SELECT 
  uc.slug as industry,
  cq.field_name,
  cq.question_type,
  LEFT(cq.question_text, 50) as question_preview,
  cq.is_required
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE cq.question_type IN ('button-group', 'buttons', 'radio', 'select', 'multi-button')
  AND uc.is_active = true
ORDER BY uc.slug, cq.display_order;

-- QUERY 7: Check for orphaned questions (questions without a use_case)
-- ============================================================================
SELECT COUNT(*) as orphaned_questions
FROM custom_questions cq
LEFT JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.id IS NULL;

-- QUERY 8: Check schema - what columns exist in custom_questions
-- ============================================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'custom_questions'
ORDER BY ordinal_position;

-- QUERY 9: Check if there's a different questions table
-- ============================================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%question%';

-- QUERY 10: Sample data from custom_questions (first 3 records, all columns)
-- ============================================================================
SELECT *
FROM custom_questions
LIMIT 3;
