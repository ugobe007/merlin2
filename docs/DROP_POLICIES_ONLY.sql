-- =============================================================================
-- QUICK FIX: Drop RLS policies that got created
-- =============================================================================

-- Disable RLS
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles viewable by all" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own projects" ON saved_projects;
DROP POLICY IF EXISTS "Users can modify own projects" ON saved_projects;
DROP POLICY IF EXISTS "Vendors can view own notifications" ON vendor_notifications;

SELECT 'Policies dropped!' AS status;
