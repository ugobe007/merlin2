-- ========================================
-- INSPECT DATABASE SCHEMA
-- ========================================
-- Check custom_questions table structure
-- ========================================

-- 1. Show table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'custom_questions'
ORDER BY ordinal_position;

-- 2. Show all constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'custom_questions'::regclass;

-- 3. Show indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'custom_questions';

-- 4. Show existing EV charging questions
SELECT 
    id,
    field_name,
    question_text,
    question_type,
    default_value,
    is_required,
    display_order
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging')
ORDER BY display_order;
