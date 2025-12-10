-- =====================================================
-- CONSOLIDATE HOTEL TEMPLATES
-- December 9, 2025
-- 
-- ACTUAL DATABASE STATE:
--   1. "Hotel & Hospitality" (slug: hotel-hospitality, ID: c72b0ecf-f8a0-4730-8877-359bdd3ba5ab)
--   2. "Hotel & Resort" (slug: hotel, ID: 5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9)
-- 
-- DECISION: Keep "Hotel & Resort" (slug: hotel) as the canonical template
-- Rename it to just "Hotel" to be more generic
-- Disable "Hotel & Hospitality"
-- =====================================================

-- Step 1: View current hotel templates (already done)
-- SELECT id, name, slug, category, is_active 
-- FROM use_cases 
-- WHERE LOWER(name) LIKE '%hotel%' 
--    OR LOWER(slug) LIKE '%hotel%'
-- ORDER BY name;

-- Step 2: Check custom_questions for the hotel template
SELECT cq.* 
FROM custom_questions cq
WHERE cq.use_case_id = '5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9';

-- Step 3: EXECUTE THIS - Disable the duplicate "Hotel & Hospitality" template
UPDATE use_cases 
SET is_active = false 
WHERE id = 'c72b0ecf-f8a0-4730-8877-359bdd3ba5ab';

-- Step 4: EXECUTE THIS - Rename "Hotel & Resort" to just "Hotel"
UPDATE use_cases 
SET name = 'Hotel' 
WHERE id = '5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9';

-- Step 5: Check if hotel_class question exists
SELECT * FROM custom_questions 
WHERE use_case_id = '5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9'
  AND field_name = 'hotel_class';

-- Step 6: If hotel_class doesn't exist, add it:
INSERT INTO custom_questions (
  use_case_id,
  question_text,
  field_name,
  question_type,
  options,
  default_value,
  is_required,
  display_order
)
VALUES (
  '5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9',
  'What type of property is this?',
  'hotel_class',
  'select',
  '["Economy/Budget", "Midscale", "Upscale/Luxury", "Resort"]',
  'Midscale',
  true,
  1
)
ON CONFLICT DO NOTHING;

-- Step 7: Verify the changes
SELECT id, name, slug, is_active FROM use_cases 
WHERE LOWER(name) LIKE '%hotel%' OR LOWER(slug) LIKE '%hotel%';

-- =====================================================
-- QUICK FIX - Run these 2 statements:
-- 
-- UPDATE use_cases SET is_active = false WHERE id = 'c72b0ecf-f8a0-4730-8877-359bdd3ba5ab';
-- UPDATE use_cases SET name = 'Hotel' WHERE id = '5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9';
-- =====================================================
