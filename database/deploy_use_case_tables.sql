-- Clean deployment of use case tables for existing Supabase database
-- Run this BEFORE running the full 02_DEPLOY_SCHEMA.sql

-- =============================================================================
-- STEP 1: Drop any conflicting views
-- =============================================================================

DROP VIEW IF EXISTS project_summary CASCADE;
DROP VIEW IF EXISTS active_use_cases_with_configs CASCADE;
DROP VIEW IF EXISTS active_vendors CASCADE;

-- =============================================================================
-- STEP 2: Enable extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- STEP 3: Create use case tables (if they don't exist)
-- =============================================================================

CREATE TABLE IF NOT EXISTS use_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    image_url TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('commercial', 'industrial', 'institutional', 'agricultural', 'residential', 'utility')),
    required_tier VARCHAR(20) DEFAULT 'free' CHECK (required_tier IN ('free', 'semi_premium', 'premium')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    industry_standards JSONB DEFAULT '{}',
    validation_sources TEXT[],
    usage_count INTEGER DEFAULT 0,
    average_roi DECIMAL(5,2),
    average_payback_years DECIMAL(4,2),
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS use_case_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    config_name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    typical_load_kw DECIMAL(10,2),
    peak_load_kw DECIMAL(10,2),
    base_load_kw DECIMAL(10,2),
    profile_type VARCHAR(50),
    load_profile_data JSONB,
    daily_operating_hours DECIMAL(5,2),
    annual_operating_days INTEGER DEFAULT 365,
    load_factor DECIMAL(5,4),
    diversity_factor DECIMAL(5,4),
    recommended_duration_hours DECIMAL(5,2),
    min_duration_hours DECIMAL(5,2),
    max_duration_hours DECIMAL(5,2),
    preferred_duration_hours DECIMAL(5,2),
    typical_savings_percent DECIMAL(5,2),
    demand_charge_sensitivity VARCHAR(20),
    energy_arbitrage_potential VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_name VARCHAR(255) NOT NULL,
    equipment_category VARCHAR(50) NOT NULL,
    nameplate_power_kw DECIMAL(10,3) NOT NULL,
    typical_power_kw DECIMAL(10,3),
    standby_power_kw DECIMAL(10,3),
    operating_hours_per_day DECIMAL(5,2),
    duty_cycle_percent DECIMAL(5,2),
    power_factor DECIMAL(4,3),
    efficiency_percent DECIMAL(5,2),
    load_profile_type VARCHAR(50),
    startup_surge_multiplier DECIMAL(5,2),
    industry_standard VARCHAR(100),
    validation_source TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuration_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    configuration_id UUID REFERENCES use_case_configurations(id) ON DELETE CASCADE,
    equipment_template_id UUID REFERENCES equipment_templates(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    simultaneity_factor DECIMAL(5,4) DEFAULT 1.0,
    custom_power_kw DECIMAL(10,3),
    custom_hours_per_day DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    options JSONB,
    is_required BOOLEAN DEFAULT false,
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    default_value TEXT,
    validation_regex TEXT,
    display_order INTEGER DEFAULT 1,
    help_text TEXT,
    placeholder TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 4: Create indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_use_cases_slug ON use_cases(slug);
CREATE INDEX IF NOT EXISTS idx_use_cases_category ON use_cases(category);
CREATE INDEX IF NOT EXISTS idx_use_cases_active ON use_cases(is_active);
CREATE INDEX IF NOT EXISTS idx_use_case_configs_use_case_id ON use_case_configurations(use_case_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment_templates(equipment_category);
CREATE INDEX IF NOT EXISTS idx_config_equipment_config_id ON configuration_equipment(configuration_id);

-- =============================================================================
-- STEP 5: Enable RLS
-- =============================================================================

ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_case_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON use_cases;
DROP POLICY IF EXISTS "Allow public read access" ON use_case_configurations;
DROP POLICY IF EXISTS "Allow public read access" ON equipment_templates;
DROP POLICY IF EXISTS "Allow public read access" ON configuration_equipment;
DROP POLICY IF EXISTS "Allow public read access" ON custom_questions;

-- Create fresh policies
CREATE POLICY "Allow public read access" ON use_cases FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON use_case_configurations FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON equipment_templates FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON configuration_equipment FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON custom_questions FOR SELECT USING (true);

-- =============================================================================
-- STEP 6: Insert sample data
-- =============================================================================

INSERT INTO use_cases (name, slug, description, icon, category, display_order) VALUES
('Hotel/Hospitality', 'hotel', 'Hotels, resorts, and hospitality facilities with peak shaving and backup power needs', '🏨', 'commercial', 1),
('Data Center', 'data-center', 'Mission-critical facilities requiring 99.99% uptime and UPS replacement', '🖥️', 'commercial', 2),
('EV Charging Station', 'ev-charging', 'Public and private EV charging infrastructure with demand charge management', '⚡', 'commercial', 3),
('Manufacturing Facility', 'manufacturing', 'Industrial facilities with high power loads and demand charges', '🏭', 'industrial', 4),
('Shopping Center/Mall', 'shopping-center', 'Retail complexes with HVAC loads and peak demand management', '🏬', 'commercial', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert configurations
INSERT INTO use_case_configurations (use_case_id, config_name, is_default, typical_load_kw, peak_load_kw, profile_type, daily_operating_hours, recommended_duration_hours, typical_savings_percent, demand_charge_sensitivity)
SELECT id, 'Standard Hotel Configuration', true, 440, 660, 'commercial', 24, 4, 25, 'high'
FROM use_cases WHERE slug = 'hotel';

INSERT INTO use_case_configurations (use_case_id, config_name, is_default, typical_load_kw, peak_load_kw, profile_type, daily_operating_hours, recommended_duration_hours, typical_savings_percent, demand_charge_sensitivity)
SELECT id, 'Tier 3 Data Center', true, 2500, 3000, 'industrial', 24, 2, 15, 'very_high'
FROM use_cases WHERE slug = 'data-center';

INSERT INTO use_case_configurations (use_case_id, config_name, is_default, typical_load_kw, peak_load_kw, profile_type, daily_operating_hours, recommended_duration_hours, typical_savings_percent, demand_charge_sensitivity)
SELECT id, 'Public Fast Charging Station', true, 350, 500, 'commercial', 16, 2, 35, 'very_high'
FROM use_cases WHERE slug = 'ev-charging';

-- Insert equipment templates
INSERT INTO equipment_templates (equipment_name, equipment_category, nameplate_power_kw, typical_power_kw, duty_cycle_percent, efficiency_percent, operating_hours_per_day) VALUES
('HVAC Chiller', 'hvac', 300, 225, 65, 85, 18),
('Hotel Guest Room Load', 'lighting', 2.93, 2.2, 75, 90, 24),
('Data Center IT Load', 'computing', 2500, 2200, 88, 95, 24),
('Level 3 DC Fast Charger', 'ev_charging', 150, 140, 85, 92, 16),
('Industrial Process Equipment', 'manufacturing', 500, 425, 85, 88, 16)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Use case tables deployed successfully!';
    RAISE NOTICE '📊 5 use cases, 3 configurations, 5 equipment templates added';
    RAISE NOTICE '🔒 RLS policies enabled with public read access';
    RAISE NOTICE '🎯 Ready to use in Merlin app!';
END $$;
