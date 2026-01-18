-- ============================================================================
-- Migration: Fix Hotel Question Configurations
-- Date: January 19, 2026
-- Purpose: Fix slider ranges, remove duplicate F&B/Laundry questions
-- ============================================================================

-- Get hotel use_case_id for reference
-- SELECT id FROM use_cases WHERE slug = 'hotel';
-- Result: 5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9

-- ============================================================================
-- FIX 1: Occupancy Rate - Should be 0-100 (percentage)
-- ============================================================================
UPDATE custom_questions
SET 
    min_value = 0,
    max_value = 100,
    default_value = 65,
    help_text = 'Your average yearly occupancy rate (0-100%)'
WHERE field_name = 'occupancyRate'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- FIX 2: Square Footage - Set reasonable range
-- ============================================================================
UPDATE custom_questions
SET 
    min_value = 5000,
    max_value = 1000000,
    default_value = 100000,
    help_text = 'Total building square footage including all floors'
WHERE field_name = 'squareFeet'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- FIX 3: Rooftop Square Footage - Set reasonable range
-- ============================================================================
UPDATE custom_questions
SET 
    min_value = 0,
    max_value = 200000,
    default_value = 20000,
    help_text = 'Available flat roof area for solar panels'
WHERE field_name = 'rooftopSqFt'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- FIX 4: Remove duplicate Food & Beverage question (keep fbOperations)
-- ============================================================================
DELETE FROM custom_questions
WHERE field_name = 'foodBeverage'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- FIX 5: Remove duplicate Laundry question (keep laundryOperations)
-- ============================================================================
DELETE FROM custom_questions
WHERE field_name = 'laundryType'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- VERIFY: Show updated hotel questions
-- ============================================================================
SELECT 
    field_name,
    question_type,
    min_value,
    max_value,
    default_value
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
AND field_name IN ('occupancyRate', 'squareFeet', 'rooftopSqFt')
ORDER BY display_order;

-- Show final count
SELECT COUNT(*) as hotel_question_count
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
