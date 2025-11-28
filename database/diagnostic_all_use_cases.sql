-- Comprehensive diagnostic script for all use cases
-- Checks: use_cases, use_case_configurations, custom_questions
-- Purpose: Find any missing links or data issues

-- ============================================================
-- PART 1: Check custom_questions with full details
-- ============================================================
SELECT 
    '=== CUSTOM QUESTIONS BY USE CASE ===' as section;

SELECT 
    uc.slug as use_case_slug,
    uc.name as use_case_name,
    cq.question_text,
    cq.field_name,
    cq.question_type,
    cq.is_required,
    cq.display_order,
    cq.default_value,
    cq.min_value,
    cq.max_value
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
WHERE uc.slug IN ('airport', 'hospital', 'car-wash', 'college', 'apartment', 
                   'government', 'gas-station', 'warehouse', 'casino', 
                   'agricultural', 'indoor-farm', 'cold-storage')
ORDER BY uc.slug, cq.display_order;

-- ============================================================
-- PART 2: Count questions per use case
-- ============================================================
SELECT 
    '=== QUESTION COUNT BY USE CASE ===' as section;

SELECT 
    uc.slug,
    uc.name,
    COUNT(cq.id) as question_count,
    STRING_AGG(cq.field_name, ', ' ORDER BY cq.display_order) as field_names
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
GROUP BY uc.slug, uc.name
ORDER BY question_count ASC, uc.name;

-- ============================================================
-- PART 3: Check use_case_configurations exist for all
-- ============================================================
SELECT 
    '=== USE CASE CONFIGURATIONS ===' as section;

SELECT 
    uc.slug,
    uc.name,
    CASE WHEN ucc.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_config,
    ucc.typical_load_kw,
    ucc.peak_load_kw,
    ucc.preferred_duration_hours
FROM use_cases uc
LEFT JOIN use_case_configurations ucc ON uc.id = ucc.use_case_id
ORDER BY has_config, uc.name;

-- ============================================================
-- PART 4: Check for orphaned custom_questions
-- ============================================================
SELECT 
    '=== ORPHANED QUESTIONS (no matching use case) ===' as section;

SELECT 
    cq.id,
    cq.use_case_id,
    cq.field_name,
    cq.question_text
FROM custom_questions cq
LEFT JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.id IS NULL;

-- ============================================================
-- PART 5: Check for duplicate questions (same field_name)
-- ============================================================
SELECT 
    '=== DUPLICATE QUESTIONS (same use_case + field_name) ===' as section;

SELECT 
    uc.slug,
    cq.field_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(cq.question_text, ' | ') as question_texts
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
GROUP BY uc.slug, cq.field_name
HAVING COUNT(*) > 1
ORDER BY uc.slug;

-- ============================================================
-- PART 6: Show all use cases with their IDs
-- ============================================================
SELECT 
    '=== ALL USE CASE IDS (for reference) ===' as section;

SELECT 
    id,
    slug,
    name,
    category,
    required_tier,
    is_active
FROM use_cases
ORDER BY slug;
