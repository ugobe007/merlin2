-- =============================================================================
-- DEPLOYMENT PHASE 2: Add RLS Policies (Run AFTER Phase 1)
-- =============================================================================
-- This is lines 729-748 from MASTER_SCHEMA.sql
-- Run this ONLY after tables have been created in Phase 1
-- =============================================================================

-- Enable RLS on tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles - Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public profiles viewable by all" ON user_profiles FOR SELECT USING (is_public_profile = true);

-- Saved Projects - Users can only see/edit their own projects
CREATE POLICY "Users can view own projects" ON saved_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can modify own projects" ON saved_projects FOR ALL USING (auth.uid() = user_id);

-- Vendor Notifications - Vendors can only see their own notifications
CREATE POLICY "Vendors can view own notifications" ON vendor_notifications FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE id = auth.uid())
);

-- =============================================================================
-- VERIFICATION: Check RLS policies were created
-- =============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Should show 7 policies across 3 tables
