-- ============================================================================
-- AUDIT STEP 3 ICON MAPPING ISSUES
-- ============================================================================
-- Date: January 2, 2026
-- Purpose: Check for missing icons in custom_questions and select options
-- ============================================================================

-- Step 1: Check if icon_name column exists
SELECT '=== STEP 1: CHECK icon_name COLUMN ===' as step;
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'custom_questions' AND column_name = 'icon_name'
    ) THEN '✅ icon_name column EXISTS'
    ELSE '❌ icon_name column MISSING'
  END as icon_name_status;

-- Step 2: Show table structure
SELECT '=== STEP 2: custom_questions TABLE STRUCTURE ===' as step;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'custom_questions'
ORDER BY ordinal_position;

-- Step 3: Check hotel category question options (should have icons)
SELECT '=== STEP 3: HOTEL CATEGORY QUESTION (check for icons) ===' as step;
SELECT 
  field_name,
  question_text,
  question_type,
  jsonb_pretty(options) as options_json
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
  AND field_name IN ('hotelCategory', 'hotelType', 'hotelClassification')
ORDER BY display_order
LIMIT 1;

-- Step 4: Check car wash questions
SELECT '=== STEP 4: CAR WASH QUESTIONS ===' as step;
SELECT 
  field_name,
  question_text,
  question_type,
  CASE 
    WHEN options IS NOT NULL THEN 'Has options'
    ELSE 'No options'
  END as has_options,
  CASE 
    WHEN icon_name IS NOT NULL THEN icon_name
    ELSE 'NULL'
  END as icon_name
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash')
ORDER BY display_order;

-- Step 5: Check all select/multiselect questions for icons in options
SELECT '=== STEP 5: SELECT QUESTIONS WITH OPTIONS (check for icon field) ===' as step;
SELECT 
  uc.slug as industry,
  cq.field_name,
  cq.question_type,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    ELSE 'No options'
  END as option_count,
  -- Check if any option has 'icon' field
  CASE 
    WHEN cq.options IS NOT NULL THEN
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements(cq.options) AS opt
          WHERE opt ? 'icon'
        ) THEN '✅ Has icons'
        ELSE '❌ Missing icons'
      END
    ELSE 'N/A'
  END as icon_status
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE cq.question_type IN ('select', 'multiselect')
  AND cq.options IS NOT NULL
ORDER BY uc.slug, cq.display_order
LIMIT 20;

-- Step 6: Sample option structure for hotel (show first option)
SELECT '=== STEP 6: SAMPLE OPTION STRUCTURE (Hotel Category) ===' as step;
SELECT 
  uc.slug as industry,
  cq.field_name,
  jsonb_pretty(cq.options->0) as first_option_sample
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'hotel'
  AND cq.field_name IN ('hotelCategory', 'hotelType', 'hotelClassification')
  AND cq.options IS NOT NULL
ORDER BY cq.display_order
LIMIT 1;

-- Step 7: Check icon_name values for all questions
SELECT '=== STEP 7: icon_name VALUES (if column exists) ===' as step;
SELECT 
  uc.slug as industry,
  cq.field_name,
  cq.question_text,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'custom_questions' AND column_name = 'icon_name'
    ) THEN COALESCE(cq.icon_name, 'NULL')::text
    ELSE 'Column does not exist'
  END as icon_name
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug IN ('hotel', 'car-wash', 'hospital', 'data-center')
ORDER BY uc.slug, cq.display_order
LIMIT 30;
