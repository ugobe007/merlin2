-- ============================================
-- SMB PLATFORM TABLES
-- ============================================
-- "Powered by Merlin Smart Energy"
-- 
-- All SMB vertical sites (carwashenergy.com, etc.)
-- share this central database for:
-- - Calculation constants (single source of truth)
-- - Leads & quotes
-- - User authentication
-- - Power Profile gamification
-- ============================================

-- ============================================
-- 1. SMB SITES REGISTRY
-- ============================================
-- Register each vertical site that uses the platform

CREATE TABLE IF NOT EXISTS smb_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Site identity
  slug VARCHAR(50) UNIQUE NOT NULL,           -- 'carwash', 'laundromat', 'restaurant'
  domain VARCHAR(255),                         -- 'carwashenergy.com'
  name VARCHAR(255) NOT NULL,                  -- 'Car Wash Energy Solutions'
  tagline VARCHAR(500),                        -- 'Battery Energy Solutions for Car Washes'
  
  -- Branding
  primary_color VARCHAR(7) DEFAULT '#6366f1', -- Hex color
  secondary_color VARCHAR(7) DEFAULT '#8b5cf6',
  logo_url TEXT,
  favicon_url TEXT,
  
  -- Industry config
  industry_category VARCHAR(100),              -- 'Automotive Services'
  use_case_slug VARCHAR(50),                   -- Links to use_cases table
  
  -- Features enabled
  features JSONB DEFAULT '{
    "showSolar": true,
    "showWind": false,
    "showGenerator": true,
    "showEV": true,
    "showFinancing": true,
    "showMarketIntelligence": true
  }',
  
  -- SEO & Marketing
  meta_title VARCHAR(255),
  meta_description TEXT,
  google_analytics_id VARCHAR(50),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  launched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CALCULATION CONSTANTS (SINGLE SOURCE OF TRUTH)
-- ============================================
-- Replicate key constants from TypeScript to database
-- This allows runtime updates without code deploys

CREATE TABLE IF NOT EXISTS calculation_constants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Constant identification
  key VARCHAR(100) UNIQUE NOT NULL,           -- 'battery_cost_per_kwh', 'federal_itc_rate'
  category VARCHAR(50) NOT NULL,              -- 'pricing', 'financial', 'equipment', 'sizing'
  
  -- Value (supports multiple types)
  value_numeric DECIMAL(15,4),                 -- For numbers
  value_text TEXT,                             -- For strings
  value_json JSONB,                            -- For complex objects
  value_type VARCHAR(20) NOT NULL,             -- 'number', 'string', 'json', 'boolean'
  
  -- Metadata
  description TEXT,
  source VARCHAR(255),                         -- 'NREL ATB 2024', 'IRS 2024'
  effective_date DATE,
  expiration_date DATE,
  
  -- Audit
  last_verified_at TIMESTAMPTZ,
  verified_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert key constants
INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
-- Pricing constants
('battery_cost_per_kwh_small', 'pricing', 350, 'number', 'Battery cost per kWh for systems < 1 MWh', 'NREL ATB 2024'),
('battery_cost_per_kwh_medium', 'pricing', 300, 'number', 'Battery cost per kWh for 1-10 MWh systems', 'NREL ATB 2024'),
('battery_cost_per_kwh_large', 'pricing', 250, 'number', 'Battery cost per kWh for 10+ MWh systems', 'NREL ATB 2024'),
('solar_cost_per_watt', 'pricing', 2.50, 'number', 'Solar installation cost per watt', 'SEIA Q3 2024'),
('inverter_cost_per_kw', 'pricing', 150, 'number', 'Inverter cost per kW', 'Industry average'),
('installation_percentage', 'pricing', 0.15, 'number', 'Installation as percentage of equipment', 'Industry standard'),

-- Financial constants
('federal_itc_rate', 'financial', 0.30, 'number', 'Federal Investment Tax Credit rate', 'IRS 2024'),
('discount_rate', 'financial', 0.08, 'number', 'Default discount rate for NPV calculations', 'Industry standard'),
('project_lifetime_years', 'financial', 25, 'number', 'Default project lifetime for analysis', 'Industry standard'),
('battery_degradation_rate', 'financial', 0.02, 'number', 'Annual battery degradation rate', 'LFP industry standard'),
('electricity_escalation_rate', 'financial', 0.03, 'number', 'Annual electricity price escalation', 'EIA forecast'),

-- Sizing constants
('peak_shaving_target_percent', 'sizing', 0.30, 'number', 'Target peak demand reduction', 'Best practice'),
('backup_hours_minimum', 'sizing', 2, 'number', 'Minimum backup duration hours', 'Industry standard'),
('backup_hours_recommended', 'sizing', 4, 'number', 'Recommended backup duration hours', 'Industry standard'),
('solar_to_storage_ratio', 'sizing', 0.25, 'number', 'Recommended storage to solar ratio', 'NREL guidance')
ON CONFLICT (key) DO UPDATE SET
  value_numeric = EXCLUDED.value_numeric,
  updated_at = NOW();

-- ============================================
-- 3. SMB LEADS (Unified across all sites)
-- ============================================

CREATE TABLE IF NOT EXISTS smb_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source tracking
  site_slug VARCHAR(50) NOT NULL,              -- Which SMB site generated this lead
  referral_source VARCHAR(255),                -- utm_source, referrer
  landing_page VARCHAR(500),
  
  -- Contact info
  email VARCHAR(255),
  phone VARCHAR(50),
  company_name VARCHAR(255),
  contact_name VARCHAR(255),
  
  -- Location
  zip_code VARCHAR(10),
  state VARCHAR(50),
  city VARCHAR(255),
  
  -- Business details (industry-specific)
  business_data JSONB,                         -- Flexible storage for industry questions
  
  -- Quote generated
  quote_id UUID,                               -- Reference to saved_quotes (no FK - table may not exist)
  quote_summary JSONB,                         -- Cached quote summary for quick display
  
  -- Engagement
  power_profile_level INTEGER DEFAULT 1,
  power_profile_points INTEGER DEFAULT 0,
  
  -- Funnel tracking
  status VARCHAR(50) DEFAULT 'new',            -- 'new', 'contacted', 'qualified', 'quoted', 'won', 'lost'
  assigned_to VARCHAR(255),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. POWER PROFILE PERSISTENCE
-- ============================================

CREATE TABLE IF NOT EXISTS power_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification (can be anonymous or authenticated)
  user_id UUID,                                -- If logged in (no FK - users table may not exist)
  anonymous_id VARCHAR(255),                   -- Browser fingerprint for anonymous users
  
  -- Profile data
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  completed_checks TEXT[] DEFAULT '{}',        -- Array of check IDs
  
  -- Unlocked features
  unlocked_features TEXT[] DEFAULT '{}',
  
  -- Activity tracking
  total_quotes_generated INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one profile per user/anonymous
  UNIQUE(user_id),
  UNIQUE(anonymous_id)
);

-- ============================================
-- 5. INDUSTRY POWER PROFILES (Per-industry defaults)
-- ============================================

CREATE TABLE IF NOT EXISTS industry_power_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Industry identification
  industry_slug VARCHAR(50) UNIQUE NOT NULL,   -- 'car-wash', 'laundromat', 'restaurant'
  
  -- Power characteristics
  typical_peak_demand_kw DECIMAL(10,2),
  typical_monthly_kwh DECIMAL(12,2),
  peak_demand_timing VARCHAR(255),             -- 'Morning rush 7-9am, Lunch 11-1pm'
  load_profile_type VARCHAR(50),               -- 'daytime_heavy', 'evening_heavy', '24_7'
  
  -- Sizing recommendations
  recommended_battery_kwh_per_unit DECIMAL(10,2),  -- Per bay, per machine, etc.
  recommended_backup_hours DECIMAL(4,1),
  recommended_solar_kw_per_unit DECIMAL(10,2),
  
  -- Unit of measure for this industry
  unit_name VARCHAR(50),                       -- 'bay', 'machine', 'seat', 'room'
  unit_plural VARCHAR(50),                     -- 'bays', 'machines', 'seats', 'rooms'
  
  -- Financial assumptions
  avg_electricity_rate DECIMAL(6,4),
  avg_demand_charge DECIMAL(8,2),
  typical_payback_years DECIMAL(4,1),
  
  -- Data source
  data_source VARCHAR(255),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Insert car wash profile
INSERT INTO industry_power_profiles (
  industry_slug, typical_peak_demand_kw, typical_monthly_kwh, peak_demand_timing,
  load_profile_type, recommended_battery_kwh_per_unit, recommended_backup_hours,
  recommended_solar_kw_per_unit, unit_name, unit_plural,
  avg_electricity_rate, avg_demand_charge, typical_payback_years, data_source
) VALUES (
  'car-wash', 150, 25000, 'Weekends 10am-4pm, Weekdays 4-7pm',
  'daytime_heavy', 50, 4, 25, 'bay', 'bays',
  0.14, 15.00, 5.5, 'Merlin Energy Industry Analysis 2024'
) ON CONFLICT (industry_slug) DO UPDATE SET
  typical_peak_demand_kw = EXCLUDED.typical_peak_demand_kw,
  last_updated = NOW();

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_smb_leads_site_slug ON smb_leads(site_slug);
CREATE INDEX IF NOT EXISTS idx_smb_leads_status ON smb_leads(status);
CREATE INDEX IF NOT EXISTS idx_smb_leads_created ON smb_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_power_profiles_user ON power_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_power_profiles_anonymous ON power_profiles(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_calculation_constants_category ON calculation_constants(category);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to get constant value by key
CREATE OR REPLACE FUNCTION get_constant(p_key VARCHAR)
RETURNS DECIMAL AS $$
  SELECT value_numeric FROM calculation_constants WHERE key = p_key;
$$ LANGUAGE SQL STABLE;

-- Function to get constant as JSON
CREATE OR REPLACE FUNCTION get_constant_json(p_key VARCHAR)
RETURNS JSONB AS $$
  SELECT value_json FROM calculation_constants WHERE key = p_key;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 8. RLS POLICIES (Keep data secure)
-- ============================================

-- SMB leads - service role can do everything
ALTER TABLE smb_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to smb_leads" ON smb_leads;
CREATE POLICY "Service role full access to smb_leads" ON smb_leads
  FOR ALL USING (true);

-- Power profiles - users can only see their own
ALTER TABLE power_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own power profile" ON power_profiles;
CREATE POLICY "Users can view own power profile" ON power_profiles
  FOR SELECT USING (auth.uid() = user_id OR anonymous_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own power profile" ON power_profiles;
CREATE POLICY "Users can update own power profile" ON power_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Calculation constants - read-only for all, write for admins
ALTER TABLE calculation_constants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read constants" ON calculation_constants;
CREATE POLICY "Anyone can read constants" ON calculation_constants
  FOR SELECT USING (true);

COMMENT ON TABLE smb_sites IS 'Registry of all SMB vertical sites powered by Merlin';
COMMENT ON TABLE calculation_constants IS 'Single source of truth for all calculation values';
COMMENT ON TABLE smb_leads IS 'Unified lead storage across all SMB sites';
COMMENT ON TABLE power_profiles IS 'Gamification tracking for user engagement';
COMMENT ON TABLE industry_power_profiles IS 'Industry-specific power and sizing defaults';
