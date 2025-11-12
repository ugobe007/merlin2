-- =============================================================================
-- DISCOVER EXISTING SCHEMA
-- Run this to see what columns actually exist in your Supabase tables
-- =============================================================================

-- Check if use_cases table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'use_cases'
ORDER BY ordinal_position;

-- Check if use_case_configurations table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'use_case_configurations'
ORDER BY ordinal_position;

-- Check what data currently exists in use_cases
SELECT * FROM use_cases LIMIT 5;

-- Check what data currently exists in use_case_configurations
SELECT * FROM use_case_configurations LIMIT 5;
