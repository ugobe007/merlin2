-- =============================================================================
-- STEP 4: ADD RLS POLICIES (Run AFTER 02_DEPLOY_SCHEMA.sql succeeds)
-- =============================================================================
-- This adds Row Level Security policies after tables are fully created
-- =============================================================================

-- Enable RLS on key tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" 
    ON user_profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON user_profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles viewable by all" 
    ON user_profiles FOR SELECT 
    USING (is_public_profile = true);

-- Saved Projects Policies
CREATE POLICY "Users can view own projects" 
    ON saved_projects FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own projects" 
    ON saved_projects FOR ALL 
    USING (auth.uid() = user_id);

-- Vendor Notifications Policy
CREATE POLICY "Vendors can view own notifications" 
    ON vendor_notifications FOR SELECT 
    USING (vendor_id IN (SELECT id FROM vendors WHERE id = auth.uid()));

-- Verification
SELECT 
    'RLS Policies Added!' AS status,
    COUNT(*) AS total_policies
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
