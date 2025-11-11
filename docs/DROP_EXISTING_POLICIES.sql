-- =============================================================================
-- DROP EXISTING RLS POLICIES (Clean up from previous deployment attempts)
-- =============================================================================
-- Run this FIRST to remove any existing policies that conflict with MASTER_SCHEMA
-- =============================================================================

-- Drop policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles viewable by all" ON user_profiles;

-- Drop policies on saved_projects
DROP POLICY IF EXISTS "Users can view own projects" ON saved_projects;
DROP POLICY IF EXISTS "Users can modify own projects" ON saved_projects;

-- Drop policies on vendor_notifications
DROP POLICY IF EXISTS "Vendors can view own notifications" ON vendor_notifications;

-- Drop policies on activity_logs (if any exist)
DROP POLICY IF EXISTS "Users can view own activity" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_logs;

-- =============================================================================
-- VERIFICATION: Check remaining policies
-- =============================================================================
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- This should return 0 rows after cleanup
