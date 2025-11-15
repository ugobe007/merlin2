-- Add Use Case Tables to Existing Supabase Database
-- Run this in Supabase SQL Editor to add use case functionality
-- This complements the AI data collection tables already set up

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USE CASE CORE TABLES
-- =============================================================================

-- Main Use Cases Table
CREATE TABLE IF NOT EXISTS use_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    category VARCHAR(50) NOT NULL CHECK (category IN ('commercial', 'industrial', 'institutional', 'agricultural', 'residential', 'utility')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Use Case Configurations (power profiles, sizing recommendations)
CREATE TABLE IF NOT EXISTS use_case_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    config_name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    typical_load_kw DECIMAL(10,2),
    peak_load_kw DECIMAL(10,2),
    profile_type VARCHAR(50),
    daily_operating_hours DECIMAL(5,2),
    recommended_duration_hours DECIMAL(5,2),
    typical_savings_percent DECIMAL(5,2),
    demand_charge_sensitivity VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment Templates (common equipment for each use case)
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

-- Configuration Equipment (link equipment to configurations)
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

-- Custom Questions (specific questions per use case)
CREATE TABLE IF NOT EXISTS custom_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 1,
    options JSONB,
    validation_rules JSONB,
    help_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_use_cases_slug ON use_cases(slug);
CREATE INDEX IF NOT EXISTS idx_use_cases_category ON use_cases(category);
CREATE INDEX IF NOT EXISTS idx_use_cases_active ON use_cases(is_active);
CREATE INDEX IF NOT EXISTS idx_use_case_configs_use_case ON use_case_configurations(use_case_id);
CREATE INDEX IF NOT EXISTS idx_config_equipment_config ON configuration_equipment(configuration_id);
CREATE INDEX IF NOT EXISTS idx_custom_questions_use_case ON custom_questions(use_case_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_case_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all use case data
CREATE POLICY "Allow public read access" ON use_cases FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON use_case_configurations FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON equipment_templates FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON configuration_equipment FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON custom_questions FOR SELECT USING (true);

-- =============================================================================
-- SAMPLE DATA (Hotels, Data Centers, EV Charging)
-- =============================================================================

-- Insert sample use cases
INSERT INTO use_cases (name, slug, description, icon, category, display_order) VALUES
('Hotel/Hospitality', 'hotel', 'Hotels, resorts, and hospitality facilities with peak shaving and backup power needs', '🏨', 'commercial', 1),
('Data Center', 'data-center', 'Mission-critical facilities requiring 99.99% uptime and UPS replacement', '🖥️', 'commercial', 2),
('EV Charging Station', 'ev-charging', 'Public and private EV charging infrastructure with demand charge management', '⚡', 'commercial', 3),
('Manufacturing Facility', 'manufacturing', 'Industrial facilities with high power loads and demand charges', '🏭', 'industrial', 4),
('Shopping Center/Mall', 'shopping-center', 'Retail complexes with HVAC loads and peak demand management', '🏬', 'commercial', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert hotel configuration
INSERT INTO use_case_configurations (use_case_id, config_name, is_default, typical_load_kw, peak_load_kw, profile_type, daily_operating_hours, recommended_duration_hours, typical_savings_percent, demand_charge_sensitivity)
SELECT 
    id,
    'Standard Hotel Configuration',
    true,
    440,
    660,
    'commercial',
    24,
    4,
    25,
    'high'
FROM use_cases WHERE slug = 'hotel';

-- Insert data center configuration
INSERT INTO use_case_configurations (use_case_id, config_name, is_default, typical_load_kw, peak_load_kw, profile_type, daily_operating_hours, recommended_duration_hours, typical_savings_percent, demand_charge_sensitivity)
SELECT 
    id,
    'Tier 3 Data Center',
    true,
    2500,
    3000,
    'industrial',
    24,
    2,
    15,
    'very_high'
FROM use_cases WHERE slug = 'data-center';

-- Insert EV charging configuration
INSERT INTO use_case_configurations (use_case_id, config_name, is_default, typical_load_kw, peak_load_kw, profile_type, daily_operating_hours, recommended_duration_hours, typical_savings_percent, demand_charge_sensitivity)
SELECT 
    id,
    'Public Fast Charging Station',
    true,
    350,
    500,
    'commercial',
    16,
    2,
    35,
    'very_high'
FROM use_cases WHERE slug = 'ev-charging';

-- Insert sample equipment templates
INSERT INTO equipment_templates (equipment_name, equipment_category, nameplate_power_kw, typical_power_kw, duty_cycle_percent, efficiency_percent, operating_hours_per_day) VALUES
('HVAC Chiller', 'hvac', 300, 225, 65, 85, 18),
('Hotel Guest Room Load', 'lighting', 2.93, 2.2, 75, 90, 24),
('Data Center IT Load', 'computing', 2500, 2200, 88, 95, 24),
('Level 3 DC Fast Charger', 'ev_charging', 150, 140, 85, 92, 16),
('Industrial Process Equipment', 'manufacturing', 500, 425, 85, 88, 16);

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Use case tables created successfully!';
    RAISE NOTICE '📊 Sample data inserted for Hotels, Data Centers, EV Charging';
    RAISE NOTICE '🔒 RLS policies enabled with public read access';
    RAISE NOTICE '🎯 Ready to use in CalculationsAdmin panel';
END $$;
