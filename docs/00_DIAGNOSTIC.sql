-- =============================================================================
-- DIAGNOSTIC: What's currently in the database?
-- =============================================================================

-- Check what tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check for any errors or conflicts
SELECT 
    'Total tables in public schema: ' || COUNT(*)::text as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';

-- Check if any policies exist that might block deployment
SELECT 
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Check if any triggers exist that might block deployment
SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check for the update function
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name = 'update_updated_at_column';
