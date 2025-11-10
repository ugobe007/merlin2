-- =============================================================================
-- USE CASE DATABASE SCHEMA
-- Merlin BESS Quote Builder - Dynamic Use Case Configuration System
-- Version: 1.0.0
-- Created: November 9, 2025
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. USE CASES TABLE - Main use case definitions
-- =============================================================================
CREATE TABLE IF NOT EXISTS use_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(10), -- Emoji or icon identifier
    image_url TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'commercial', 'industrial', 'institutional', 
        'agricultural', 'residential', 'utility'
    )),
    
    -- Access Control & Display
    required_tier VARCHAR(20) DEFAULT 'free' CHECK (required_tier IN ('free', 'semi_premium', 'premium')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    
    -- Industry Standards & Compliance
    industry_standards JSONB DEFAULT '{}', -- ASHRAE, NREL, etc.
    validation_sources TEXT[], -- Array of validation sources
    
    -- Usage Analytics
    usage_count INTEGER DEFAULT 0,
    average_roi DECIMAL(5,2),
    average_payback_years DECIMAL(4,2),
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id),
    
    -- Indexes for performance
    CONSTRAINT unique_slug UNIQUE (slug),
    CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0)
);

-- =============================================================================
-- 2. USE CASE CONFIGURATIONS - Multiple scenarios per use case
-- =============================================================================
CREATE TABLE IF NOT EXISTS use_case_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    
    -- Configuration Details
    config_name VARCHAR(255) NOT NULL, -- e.g., "Small Car Wash (4 bays)", "Large Airport Terminal"
    config_slug VARCHAR(100) NOT NULL, -- e.g., "small-4-bay", "large-terminal"
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    
    -- Power Profile
    typical_load_kw DECIMAL(10,3) NOT NULL,
    peak_load_kw DECIMAL(10,3) NOT NULL,
    profile_type VARCHAR(20) DEFAULT 'peaked' CHECK (profile_type IN (
        'constant', 'peaked', 'seasonal', 'variable'
    )),
    daily_operating_hours INTEGER DEFAULT 24,
    peak_hours_start TIME,
    peak_hours_end TIME,
    operates_weekends BOOLEAN DEFAULT true,
    seasonal_variation DECIMAL(4,2) DEFAULT 1.00, -- Multiplier for seasonal changes
    
    -- Financial Parameters
    demand_charge_sensitivity DECIMAL(4,2) DEFAULT 1.00,
    energy_cost_multiplier DECIMAL(4,2) DEFAULT 1.00,
    typical_savings_percent DECIMAL(5,2) DEFAULT 25.00,
    roi_adjustment_factor DECIMAL(4,2) DEFAULT 1.00,
    peak_demand_penalty DECIMAL(4,2) DEFAULT 1.00,
    
    -- Configuration Constraints
    min_size_mw DECIMAL(8,3),
    max_size_mw DECIMAL(8,3),
    preferred_duration_hours DECIMAL(4,1) DEFAULT 2.0,
    
    -- Usage Analytics
    selection_count INTEGER DEFAULT 0,
    average_system_size_mw DECIMAL(8,3),
    average_roi DECIMAL(5,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_use_case_config_slug UNIQUE (use_case_id, config_slug),
    CONSTRAINT valid_load_range CHECK (peak_load_kw >= typical_load_kw),
    CONSTRAINT valid_hours CHECK (daily_operating_hours BETWEEN 1 AND 24),
    CONSTRAINT valid_percentages CHECK (typical_savings_percent BETWEEN 0 AND 100)
);

-- =============================================================================
-- 3. EQUIPMENT TEMPLATES - Reusable equipment definitions
-- =============================================================================
CREATE TABLE IF NOT EXISTS equipment_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Equipment Details
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- e.g., "HVAC", "Lighting", "Production Equipment"
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    
    -- Power Specifications
    nameplate_power_kw DECIMAL(10,3) NOT NULL,
    typical_duty_cycle DECIMAL(4,3) DEFAULT 0.70, -- 0.0 to 1.0
    startup_power_kw DECIMAL(10,3),
    efficiency_percent DECIMAL(5,2) DEFAULT 90.00,
    
    -- Standards Compliance
    certification_standards TEXT[], -- e.g., ["ENERGY_STAR", "ASHRAE_90_1"]
    energy_efficiency_rating VARCHAR(10), -- e.g., "A+", "ENERGY_STAR"
    
    -- Cost Information
    typical_cost_per_kw DECIMAL(10,2),
    installation_factor DECIMAL(4,2) DEFAULT 1.20, -- Installation cost multiplier
    maintenance_cost_per_year DECIMAL(10,2),
    
    -- Lifecycle Information
    expected_lifetime_years INTEGER DEFAULT 15,
    warranty_years INTEGER DEFAULT 5,
    replacement_schedule_years INTEGER DEFAULT 10,
    
    -- Description & Usage
    description TEXT,
    typical_applications TEXT[], -- Array of common use cases
    operating_conditions JSONB DEFAULT '{}', -- Temperature ranges, humidity, etc.
    
    -- Analytics
    usage_count INTEGER DEFAULT 0,
    average_duty_cycle DECIMAL(4,3), -- Observed average from real deployments
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_power CHECK (nameplate_power_kw > 0),
    CONSTRAINT valid_duty_cycle CHECK (typical_duty_cycle BETWEEN 0 AND 1),
    CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0)
);

-- =============================================================================
-- 4. CONFIGURATION EQUIPMENT - Links configurations to equipment
-- =============================================================================
CREATE TABLE IF NOT EXISTS configuration_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    configuration_id UUID REFERENCES use_case_configurations(id) ON DELETE CASCADE,
    equipment_template_id UUID REFERENCES equipment_templates(id) ON DELETE CASCADE,
    
    -- Instance-specific overrides
    quantity INTEGER DEFAULT 1,
    power_override_kw DECIMAL(10,3), -- Override nameplate power if needed
    duty_cycle_override DECIMAL(4,3), -- Override duty cycle if needed
    description_override TEXT, -- Custom description for this instance
    
    -- Load Profile
    operating_schedule JSONB DEFAULT '{}', -- When this equipment operates
    load_priority INTEGER DEFAULT 5, -- 1-10, for load shedding decisions
    is_critical BOOLEAN DEFAULT false, -- Cannot be shed during emergencies
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT valid_priority CHECK (load_priority BETWEEN 1 AND 10),
    CONSTRAINT unique_config_equipment UNIQUE (configuration_id, equipment_template_id)
);

-- =============================================================================
-- 5. PRICING SCENARIOS - Multiple pricing configurations per use case
-- =============================================================================
CREATE TABLE IF NOT EXISTS pricing_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    configuration_id UUID REFERENCES use_case_configurations(id) ON DELETE CASCADE,
    
    -- Scenario Details
    scenario_name VARCHAR(255) NOT NULL, -- e.g., "High Demand Charges", "TOU Optimized"
    scenario_type VARCHAR(50) DEFAULT 'standard', -- standard, optimistic, conservative
    description TEXT,
    
    -- Utility Rate Structure
    demand_charge_per_kw DECIMAL(8,2) NOT NULL,
    energy_rate_peak DECIMAL(8,4) NOT NULL, -- $/kWh
    energy_rate_offpeak DECIMAL(8,4) NOT NULL,
    peak_hours_definition JSONB DEFAULT '{}', -- When peak rates apply
    
    -- Time-of-Use Rates
    tou_structure JSONB DEFAULT '{}', -- Complex TOU rate definitions
    seasonal_rates JSONB DEFAULT '{}', -- Summer/winter variations
    
    -- Additional Charges
    fixed_monthly_charge DECIMAL(8,2) DEFAULT 0,
    power_factor_penalty DECIMAL(4,3) DEFAULT 0,
    minimum_demand_charge DECIMAL(8,2) DEFAULT 0,
    ratchet_percentage DECIMAL(5,2) DEFAULT 0, -- Demand ratchet
    
    -- Savings Calculations
    baseline_annual_cost DECIMAL(12,2),
    with_bess_annual_cost DECIMAL(12,2),
    annual_savings DECIMAL(12,2),
    savings_percentage DECIMAL(5,2),
    
    -- ROI Calculations
    payback_period_years DECIMAL(4,2),
    npv_25_year DECIMAL(15,2),
    irr_percentage DECIMAL(5,2),
    
    -- Geographic/Regulatory Context
    utility_name VARCHAR(255),
    state_province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    rate_schedule_name VARCHAR(255),
    effective_date DATE,
    
    -- Incentives
    applicable_incentives JSONB DEFAULT '[]', -- Array of applicable incentive programs
    total_incentive_value DECIMAL(12,2) DEFAULT 0,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_rates CHECK (
        demand_charge_per_kw >= 0 AND 
        energy_rate_peak >= 0 AND 
        energy_rate_offpeak >= 0
    ),
    CONSTRAINT logical_energy_rates CHECK (energy_rate_peak >= energy_rate_offpeak)
);

-- =============================================================================
-- 6. CUSTOM QUESTIONS - Dynamic form fields for each use case
-- =============================================================================
CREATE TABLE IF NOT EXISTS custom_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    
    -- Question Details
    question_text TEXT NOT NULL,
    question_key VARCHAR(100) NOT NULL, -- Unique identifier for API responses
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN (
        'number', 'select', 'boolean', 'percentage', 'text', 'range'
    )),
    
    -- Input Configuration
    default_value JSONB, -- Flexible default value storage
    unit VARCHAR(20), -- e.g., "sq ft", "rooms", "kW", "hours"
    min_value DECIMAL(15,3),
    max_value DECIMAL(15,3),
    step_value DECIMAL(10,3),
    
    -- Select Options
    select_options JSONB DEFAULT '[]', -- Array of {value, label, description}
    
    -- Impact Configuration
    impact_type VARCHAR(20) NOT NULL CHECK (impact_type IN (
        'multiplier', 'additionalLoad', 'factor', 'override', 'none'
    )),
    impacts_field VARCHAR(50), -- Which configuration field this affects
    impact_calculation JSONB DEFAULT '{}', -- Complex calculation rules
    
    -- Display Configuration
    display_order INTEGER DEFAULT 1,
    is_required BOOLEAN DEFAULT false,
    help_text TEXT,
    validation_rules JSONB DEFAULT '{}', -- Additional validation rules
    
    -- Dependencies
    depends_on_question UUID REFERENCES custom_questions(id),
    dependency_condition JSONB DEFAULT '{}', -- When to show this question
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_question_key_per_use_case UNIQUE (use_case_id, question_key),
    CONSTRAINT question_text_not_empty CHECK (length(trim(question_text)) > 0),
    CONSTRAINT logical_min_max CHECK (min_value IS NULL OR max_value IS NULL OR min_value <= max_value)
);

-- =============================================================================
-- 7. RECOMMENDED APPLICATIONS - BESS application types per use case
-- =============================================================================
CREATE TABLE IF NOT EXISTS recommended_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    
    -- Application Details
    application_type VARCHAR(50) NOT NULL, -- peak_shaving, demand_response, backup_power, etc.
    priority INTEGER DEFAULT 5, -- 1-10, higher = more important for this use case
    effectiveness_rating DECIMAL(3,2) DEFAULT 5.00, -- 1-10 scale
    
    -- Financial Impact
    typical_savings_contribution DECIMAL(5,2) DEFAULT 0, -- % of total savings from this app
    implementation_complexity INTEGER DEFAULT 5, -- 1-10 scale
    payback_impact_factor DECIMAL(4,3) DEFAULT 1.00, -- How much this improves payback
    
    -- Description
    description TEXT,
    requirements TEXT, -- What's needed to implement this application
    benefits TEXT[], -- Array of specific benefits
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_use_case_application UNIQUE (use_case_id, application_type),
    CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10),
    CONSTRAINT valid_effectiveness CHECK (effectiveness_rating BETWEEN 1 AND 10),
    CONSTRAINT valid_complexity CHECK (implementation_complexity BETWEEN 1 AND 10)
);

-- =============================================================================
-- 8. USE CASE ANALYTICS - Track performance and usage patterns
-- =============================================================================
CREATE TABLE IF NOT EXISTS use_case_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    configuration_id UUID REFERENCES use_case_configurations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Usage Event
    event_type VARCHAR(50) NOT NULL, -- viewed, selected, configured, quoted
    event_data JSONB DEFAULT '{}', -- Additional event context
    
    -- Configuration State
    answers JSONB DEFAULT '{}', -- User responses to custom questions
    calculated_load_kw DECIMAL(10,3),
    recommended_size_mw DECIMAL(8,3),
    estimated_cost DECIMAL(15,2),
    projected_savings DECIMAL(12,2),
    calculated_roi DECIMAL(5,2),
    
    -- Session Context
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    country VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for analytics queries
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'viewed', 'selected', 'configured', 'quoted', 'shared', 'exported'
    ))
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Use cases indexes
CREATE INDEX idx_use_cases_category ON use_cases(category);
CREATE INDEX idx_use_cases_active ON use_cases(is_active, display_order);
CREATE INDEX idx_use_cases_tier ON use_cases(required_tier, is_active);

-- Configurations indexes
CREATE INDEX idx_configurations_use_case ON use_case_configurations(use_case_id);
CREATE INDEX idx_configurations_default ON use_case_configurations(use_case_id, is_default);
CREATE INDEX idx_configurations_load ON use_case_configurations(typical_load_kw, peak_load_kw);

-- Equipment indexes
CREATE INDEX idx_equipment_category ON equipment_templates(category, is_active);
CREATE INDEX idx_equipment_power ON equipment_templates(nameplate_power_kw);
CREATE INDEX idx_configuration_equipment_config ON configuration_equipment(configuration_id);

-- Pricing scenarios indexes
CREATE INDEX idx_pricing_configuration ON pricing_scenarios(configuration_id);
CREATE INDEX idx_pricing_active ON pricing_scenarios(is_active);
CREATE INDEX idx_pricing_location ON pricing_scenarios(country, state_province);

-- Custom questions indexes
CREATE INDEX idx_questions_use_case ON custom_questions(use_case_id, display_order);
CREATE INDEX idx_questions_dependencies ON custom_questions(depends_on_question);

-- Analytics indexes
CREATE INDEX idx_analytics_use_case_time ON use_case_analytics(use_case_id, created_at);
CREATE INDEX idx_analytics_user ON use_case_analytics(user_id, created_at);
CREATE INDEX idx_analytics_event ON use_case_analytics(event_type, created_at);
CREATE INDEX idx_analytics_session ON use_case_analytics(session_id);

-- =============================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_case_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommended_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_case_analytics ENABLE ROW LEVEL SECURITY;

-- Public read access to active use cases
CREATE POLICY "Public read access to active use cases"
ON use_cases FOR SELECT
TO public
USING (is_active = true);

-- Public read access to active configurations
CREATE POLICY "Public read access to configurations"
ON use_case_configurations FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM use_cases 
        WHERE use_cases.id = use_case_configurations.use_case_id 
        AND use_cases.is_active = true
    )
);

-- Similar policies for related tables
CREATE POLICY "Public read equipment templates"
ON equipment_templates FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Public read configuration equipment"
ON configuration_equipment FOR SELECT
TO public
USING (true);

CREATE POLICY "Public read pricing scenarios"
ON pricing_scenarios FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Public read custom questions"
ON custom_questions FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM use_cases 
        WHERE use_cases.id = custom_questions.use_case_id 
        AND use_cases.is_active = true
    )
);

CREATE POLICY "Public read recommended applications"
ON recommended_applications FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM use_cases 
        WHERE use_cases.id = recommended_applications.use_case_id 
        AND use_cases.is_active = true
    )
);

-- Analytics - users can only see their own data
CREATE POLICY "Users can insert analytics"
ON use_case_analytics FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can read own analytics"
ON use_case_analytics FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin policies (assumes admin role exists)
CREATE POLICY "Admins can manage use cases"
ON use_cases FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_use_cases_updated_at
    BEFORE UPDATE ON use_cases
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_use_case_configurations_updated_at
    BEFORE UPDATE ON use_case_configurations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_equipment_templates_updated_at
    BEFORE UPDATE ON equipment_templates
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_pricing_scenarios_updated_at
    BEFORE UPDATE ON pricing_scenarios
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_custom_questions_updated_at
    BEFORE UPDATE ON custom_questions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION increment_use_case_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type = 'quoted' THEN
        UPDATE use_cases 
        SET usage_count = usage_count + 1,
            last_used = NOW()
        WHERE id = NEW.use_case_id;
        
        IF NEW.configuration_id IS NOT NULL THEN
            UPDATE use_case_configurations 
            SET selection_count = selection_count + 1
            WHERE id = NEW.configuration_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update usage counters
CREATE TRIGGER increment_usage_on_analytics
    AFTER INSERT ON use_case_analytics
    FOR EACH ROW EXECUTE PROCEDURE increment_use_case_usage();

-- =============================================================================
-- INITIAL DATA VIEWS
-- =============================================================================

-- View for complete use case information with default configuration
CREATE OR REPLACE VIEW use_cases_with_defaults AS
SELECT 
    uc.*,
    ucc.id as default_config_id,
    ucc.config_name as default_config_name,
    ucc.typical_load_kw,
    ucc.peak_load_kw,
    ucc.profile_type,
    ucc.daily_operating_hours,
    ucc.demand_charge_sensitivity,
    ucc.typical_savings_percent,
    (
        SELECT COUNT(*) FROM custom_questions 
        WHERE use_case_id = uc.id
    ) as question_count
FROM use_cases uc
LEFT JOIN use_case_configurations ucc ON (
    uc.id = ucc.use_case_id AND ucc.is_default = true
)
WHERE uc.is_active = true
ORDER BY uc.display_order, uc.name;

-- View for equipment summary per configuration
CREATE OR REPLACE VIEW configuration_equipment_summary AS
SELECT 
    ce.configuration_id,
    COUNT(*) as equipment_count,
    SUM(
        COALESCE(ce.power_override_kw, et.nameplate_power_kw) * ce.quantity
    ) as total_nameplate_power_kw,
    SUM(
        COALESCE(ce.power_override_kw, et.nameplate_power_kw) * 
        COALESCE(ce.duty_cycle_override, et.typical_duty_cycle) * 
        ce.quantity
    ) as total_typical_load_kw
FROM configuration_equipment ce
JOIN equipment_templates et ON et.id = ce.equipment_template_id
WHERE et.is_active = true
GROUP BY ce.configuration_id;

-- View for pricing scenario summary
CREATE OR REPLACE VIEW pricing_scenario_summary AS
SELECT 
    ps.configuration_id,
    COUNT(*) as scenario_count,
    AVG(ps.annual_savings) as avg_annual_savings,
    AVG(ps.payback_period_years) as avg_payback_years,
    MIN(ps.payback_period_years) as best_payback_years,
    MAX(ps.annual_savings) as max_annual_savings,
    ps.country,
    ps.state_province
FROM pricing_scenarios ps
WHERE ps.is_active = true
GROUP BY ps.configuration_id, ps.country, ps.state_province;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE use_cases IS 'Master table of all BESS use case types (Car Wash, Hospital, etc.)';
COMMENT ON TABLE use_case_configurations IS 'Multiple size/type configurations per use case (Small Car Wash, Large Car Wash)';
COMMENT ON TABLE equipment_templates IS 'Reusable equipment definitions with industry-standard specifications';
COMMENT ON TABLE configuration_equipment IS 'Links equipment to configurations with quantity and overrides';
COMMENT ON TABLE pricing_scenarios IS 'Multiple pricing/utility rate scenarios per configuration';
COMMENT ON TABLE custom_questions IS 'Dynamic form fields for capturing use case specific parameters';
COMMENT ON TABLE recommended_applications IS 'BESS applications recommended for each use case';
COMMENT ON TABLE use_case_analytics IS 'Tracks user interactions and configuration performance';

COMMENT ON COLUMN use_cases.industry_standards IS 'JSONB field containing compliance standards (ASHRAE, NREL, etc.)';
COMMENT ON COLUMN use_case_configurations.seasonal_variation IS 'Multiplier for seasonal energy usage changes (e.g., 1.3 = 30% higher in summer)';
COMMENT ON COLUMN equipment_templates.typical_duty_cycle IS 'Decimal 0-1 representing typical operating percentage';
COMMENT ON COLUMN pricing_scenarios.tou_structure IS 'Complex time-of-use rate definitions with peak/off-peak hours';
COMMENT ON COLUMN custom_questions.impact_calculation IS 'JSONB rules for how question responses affect calculations';