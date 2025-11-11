-- =============================================================================
-- STEP 1: CLEANUP - Remove any existing objects that might conflict
-- =============================================================================
-- Run this first to ensure a clean slate
-- Safe to run multiple times
-- =============================================================================

-- Disable RLS first (required before dropping policies)
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vendor_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles viewable by all" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own projects" ON saved_projects;
DROP POLICY IF EXISTS "Users can modify own projects" ON saved_projects;
DROP POLICY IF EXISTS "Vendors can view own notifications" ON vendor_notifications;

-- Drop existing triggers (if any)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_saved_projects_updated_at ON saved_projects;
DROP TRIGGER IF EXISTS update_use_cases_updated_at ON use_cases;
DROP TRIGGER IF EXISTS update_use_case_configs_updated_at ON use_case_configurations;
DROP TRIGGER IF EXISTS update_equipment_templates_updated_at ON equipment_templates;
DROP TRIGGER IF EXISTS update_pricing_config_updated_at ON pricing_configurations;
DROP TRIGGER IF EXISTS update_formula_updated_at ON calculation_formulas;
DROP TRIGGER IF EXISTS update_market_data_updated_at ON market_pricing_data;
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
DROP TRIGGER IF EXISTS update_vendor_products_updated_at ON vendor_products;
DROP TRIGGER IF EXISTS update_rfqs_updated_at ON rfqs;
DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;

-- Drop the trigger function (CASCADE removes all dependent triggers automatically)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Verification
SELECT 'Cleanup complete! No policies or triggers should remain.' AS status;
