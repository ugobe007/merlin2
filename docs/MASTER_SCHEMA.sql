-- =============================================================================
-- MERLIN BESS PLATFORM - MASTER DATABASE SCHEMA
-- Version: 2.0.0 (Consolidated)
-- Date: November 10, 2025
-- =============================================================================
-- This is the SINGLE SOURCE OF TRUTH for all Merlin database tables.
-- Replaces: SUPABASE_SCHEMA.sql, USE_CASE_SCHEMA.sql, PRICING_CONFIG_SCHEMA.sql
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SECTION 1: USER & AUTHENTICATION TABLES
-- =============================================================================

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    public_profile_slug VARCHAR(50) UNIQUE,
    phone VARCHAR(50),
    country VARCHAR(100),
    industry VARCHAR(100),
    role VARCHAR(100),
    bio TEXT,
    website VARCHAR(255),
    linkedin VARCHAR(255),
    twitter VARCHAR(255),
    profile_picture_url TEXT,
    is_public_profile BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'
);

-- =============================================================================
-- SECTION 2: PROJECT & QUOTE MANAGEMENT
-- =============================================================================

-- Saved Projects Table
CREATE TABLE IF NOT EXISTS saved_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    project_data JSONB NOT NULL,
    project_type VARCHAR(50) DEFAULT 'bess',
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, completed, archived
    is_public BOOLEAN DEFAULT false,
    tags VARCHAR(100)[],
    power_mw DECIMAL(10,3),
    duration_hours DECIMAL(10,2),
    location VARCHAR(255),
    country VARCHAR(100),
    use_case VARCHAR(100),
    estimated_cost DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SECTION 3: USE CASE SYSTEM (Smart Wizard)
-- =============================================================================

-- Use Cases Table - Main use case definitions
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
    industry_standards JSONB DEFAULT '{}',
    validation_sources TEXT[],
    
    -- Usage Analytics
    usage_count INTEGER DEFAULT 0,
    average_roi DECIMAL(5,2),
    average_payback_years DECIMAL(4,2),
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Use Case Configurations Table
CREATE TABLE IF NOT EXISTS use_case_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    
    -- Configuration Details
    config_name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    
    -- Load Profile Data
    typical_load_kw DECIMAL(10,2),
    peak_load_kw DECIMAL(10,2),
    base_load_kw DECIMAL(10,2),
    profile_type VARCHAR(50), -- 'constant', 'variable', 'seasonal', 'peak_shaving'
    load_profile_data JSONB, -- Hourly/daily load curves
    
    -- Operating Parameters
    daily_operating_hours DECIMAL(5,2),
    annual_operating_days INTEGER DEFAULT 365,
    load_factor DECIMAL(5,4), -- Average load / Peak load
    diversity_factor DECIMAL(5,4), -- System diversity
    
    -- Energy Storage Recommendations
    recommended_duration_hours DECIMAL(5,2),
    min_duration_hours DECIMAL(5,2),
    max_duration_hours DECIMAL(5,2),
    preferred_duration_hours DECIMAL(5,2),
    
    -- Financial Assumptions
    typical_savings_percent DECIMAL(5,2),
    demand_charge_sensitivity VARCHAR(20), -- 'high', 'medium', 'low'
    energy_arbitrage_potential VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment Templates Table
CREATE TABLE IF NOT EXISTS equipment_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Equipment Details
    equipment_name VARCHAR(255) NOT NULL,
    equipment_category VARCHAR(50) NOT NULL, -- 'appliance', 'hvac', 'lighting', 'motor', 'process'
    
    -- Power Specifications
    nameplate_power_kw DECIMAL(10,3) NOT NULL,
    typical_power_kw DECIMAL(10,3),
    standby_power_kw DECIMAL(10,3),
    
    -- Operating Characteristics
    operating_hours_per_day DECIMAL(5,2),
    duty_cycle_percent DECIMAL(5,2),
    power_factor DECIMAL(4,3),
    efficiency_percent DECIMAL(5,2),
    
    -- Load Profile
    load_profile_type VARCHAR(50), -- 'constant', 'intermittent', 'cyclic', 'seasonal'
    startup_surge_multiplier DECIMAL(5,2),
    
    -- Standards & Validation
    industry_standard VARCHAR(100),
    validation_source TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuration Equipment Junction Table
CREATE TABLE IF NOT EXISTS configuration_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    configuration_id UUID REFERENCES use_case_configurations(id) ON DELETE CASCADE,
    equipment_template_id UUID REFERENCES equipment_templates(id) ON DELETE CASCADE,
    
    -- Quantity and Scaling
    quantity INTEGER DEFAULT 1,
    simultaneity_factor DECIMAL(5,4) DEFAULT 1.0, -- How many operate at once
    
    -- Custom Overrides
    custom_power_kw DECIMAL(10,3),
    custom_hours_per_day DECIMAL(5,2),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing Scenarios Table
CREATE TABLE IF NOT EXISTS pricing_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    configuration_id UUID REFERENCES use_case_configurations(id) ON DELETE CASCADE,
    
    -- Scenario Details
    scenario_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    
    -- Utility Rates
    peak_rate_kwh DECIMAL(10,4),
    off_peak_rate_kwh DECIMAL(10,4),
    shoulder_rate_kwh DECIMAL(10,4),
    demand_charge_kw DECIMAL(10,4),
    
    -- Time of Use Periods
    tou_schedule JSONB, -- Time-of-use rate schedule
    
    -- Additional Charges
    monthly_service_charge DECIMAL(10,2),
    renewable_energy_credit DECIMAL(10,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom Questions Table
CREATE TABLE IF NOT EXISTS custom_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    
    -- Question Details
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'number', 'text', 'select', 'multiselect', 'boolean'
    field_name VARCHAR(100) NOT NULL, -- Used in calculations
    
    -- Options for select/multiselect
    options JSONB,
    
    -- Validation
    is_required BOOLEAN DEFAULT false,
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    default_value TEXT,
    validation_regex TEXT,
    
    -- Display
    display_order INTEGER DEFAULT 1,
    help_text TEXT,
    placeholder TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommended Applications Table
CREATE TABLE IF NOT EXISTS recommended_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    
    -- Application Details
    application_name VARCHAR(255) NOT NULL,
    description TEXT,
    benefit_description TEXT,
    
    -- Suitability
    suitability_score INTEGER CHECK (suitability_score BETWEEN 1 AND 10),
    
    -- Display
    display_order INTEGER DEFAULT 1,
    icon VARCHAR(10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Use Case Analytics Table
CREATE TABLE IF NOT EXISTS use_case_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Calculation Details
    input_data JSONB NOT NULL,
    calculated_results JSONB NOT NULL,
    
    -- Results Summary
    recommended_size_mw DECIMAL(10,3),
    estimated_cost DECIMAL(15,2),
    estimated_savings DECIMAL(15,2),
    payback_years DECIMAL(5,2),
    roi_percentage DECIMAL(6,2),
    
    -- User Actions
    was_quote_created BOOLEAN DEFAULT false,
    was_project_saved BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SECTION 4: PRICING & CALCULATION SYSTEM (Single Source of Truth)
-- =============================================================================

-- Pricing Configurations Table
-- This is the NEW structure using JSONB (replaces old flat column structure)
CREATE TABLE IF NOT EXISTS pricing_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_category VARCHAR(50) NOT NULL, -- 'bess', 'solar', 'wind', 'generator', 'ev_charging', 'power_electronics', 'balance_of_plant'
    config_data JSONB NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES user_profiles(id),
    vendor_notes TEXT,
    data_source VARCHAR(255), -- 'NREL ATB 2024', 'BloombergNEF', 'Vendor Quote', etc.
    confidence_level VARCHAR(20) CHECK (confidence_level IN ('high', 'medium', 'low'))
);

-- Calculation Formulas Table
CREATE TABLE IF NOT EXISTS calculation_formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_key VARCHAR(100) UNIQUE NOT NULL,
    formula_name VARCHAR(255) NOT NULL,
    formula_category VARCHAR(50) NOT NULL, -- 'sizing', 'financial', 'performance', 'roi'
    formula_expression TEXT NOT NULL, -- The actual formula/calculation logic
    formula_variables JSONB NOT NULL, -- Input variables with types and descriptions
    output_variables JSONB NOT NULL, -- Output variables with types and descriptions
    description TEXT,
    example_calculation TEXT,
    reference_sources TEXT, -- Industry standards, papers, etc.
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES user_profiles(id),
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'deprecated')),
    validated_by UUID REFERENCES user_profiles(id),
    validated_at TIMESTAMP WITH TIME ZONE
);

-- Market Pricing Data Table
CREATE TABLE IF NOT EXISTS market_pricing_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_type VARCHAR(50) NOT NULL, -- 'battery', 'inverter', 'solar_panel', etc.
    region VARCHAR(100) NOT NULL, -- 'United States', 'Europe', 'Asia', etc.
    price_per_unit DECIMAL(15,4) NOT NULL,
    unit_type VARCHAR(20) NOT NULL, -- 'kwh', 'kw', 'watt', 'unit'
    currency VARCHAR(3) DEFAULT 'USD',
    data_source VARCHAR(255) NOT NULL, -- 'BloombergNEF', 'NREL', 'Vendor Quote'
    data_date DATE NOT NULL,
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('up', 'down', 'stable')),
    confidence_level VARCHAR(20) CHECK (confidence_level IN ('high', 'medium', 'low')),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calculation Cache Table (Performance Optimization)
CREATE TABLE IF NOT EXISTS calculation_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    input_hash VARCHAR(64) UNIQUE NOT NULL,
    calculation_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    calculation_results JSONB NOT NULL,
    calculation_version VARCHAR(10) DEFAULT '2.0.0',
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- =============================================================================
-- SECTION 5: VENDOR & MARKETPLACE TABLES
-- =============================================================================

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    specialty VARCHAR(20) NOT NULL CHECK (specialty IN ('battery', 'inverter', 'ems', 'bos', 'epc', 'integrator')),
    description TEXT,
    certifications VARCHAR(100)[],
    years_in_business INTEGER,
    employee_count INTEGER,
    annual_revenue_range VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    total_submissions INTEGER DEFAULT 0,
    approved_submissions INTEGER DEFAULT 0,
    quotes_included_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0
);

-- Vendor Products Table
CREATE TABLE IF NOT EXISTS vendor_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    product_category VARCHAR(20) NOT NULL CHECK (product_category IN ('battery', 'inverter', 'ems', 'bos', 'container')),
    manufacturer VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    capacity_kwh DECIMAL(10,3),
    power_kw DECIMAL(10,3),
    voltage_v INTEGER,
    chemistry VARCHAR(20),
    efficiency_percent DECIMAL(5,2),
    price_per_kwh DECIMAL(10,2),
    price_per_kw DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    lead_time_weeks INTEGER NOT NULL,
    warranty_years INTEGER NOT NULL,
    minimum_order_quantity INTEGER DEFAULT 1,
    certifications VARCHAR(100)[],
    certification_docs JSONB DEFAULT '{}',
    datasheet_url TEXT,
    datasheet_filename VARCHAR(255),
    technical_specs JSONB DEFAULT '{}',
    environmental_specs JSONB DEFAULT '{}',
    safety_features VARCHAR(100)[],
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'discontinued')),
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    times_quoted INTEGER DEFAULT 0,
    times_selected INTEGER DEFAULT 0,
    avg_customer_rating DECIMAL(3,2) DEFAULT 0.00,
    total_customer_ratings INTEGER DEFAULT 0
);

-- RFQs (Request for Quotes) Table
CREATE TABLE IF NOT EXISTS rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_number VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    system_size_mw DECIMAL(10,3) NOT NULL,
    duration_hours DECIMAL(10,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    requirements TEXT,
    technical_requirements JSONB DEFAULT '{}',
    preferred_chemistry VARCHAR(20),
    preferred_manufacturers VARCHAR(255)[],
    delivery_deadline DATE,
    due_date DATE NOT NULL,
    project_start_date DATE,
    budget_range_min DECIMAL(15,2),
    budget_range_max DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'awarded', 'cancelled')),
    target_specialties VARCHAR(20)[],
    invited_vendors UUID[],
    evaluation_criteria JSONB DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    awarded_to UUID REFERENCES vendors(id),
    response_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false
);

-- RFQ Responses Table
CREATE TABLE IF NOT EXISTS rfq_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    response_number VARCHAR(50) UNIQUE NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    lead_time_weeks INTEGER NOT NULL,
    warranty_years INTEGER NOT NULL,
    pricing_breakdown JSONB NOT NULL,
    technical_proposal TEXT,
    value_proposition TEXT,
    delivery_schedule JSONB DEFAULT '{}',
    payment_terms TEXT,
    special_conditions TEXT,
    proposal_document_url TEXT,
    proposal_filename VARCHAR(255),
    supporting_docs JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'shortlisted', 'accepted', 'rejected')),
    evaluation_score DECIMAL(5,2),
    evaluation_notes TEXT,
    evaluation_criteria_scores JSONB DEFAULT '{}',
    evaluated_by UUID REFERENCES user_profiles(id),
    evaluated_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_winning_bid BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    UNIQUE(rfq_id, vendor_id)
);

-- Vendor Notifications Table
CREATE TABLE IF NOT EXISTS vendor_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category VARCHAR(50) DEFAULT 'general',
    related_rfq_id UUID REFERENCES rfqs(id),
    related_product_id UUID REFERENCES vendor_products(id),
    related_response_id UUID REFERENCES rfq_responses(id),
    action_required BOOLEAN DEFAULT false,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SECTION 6: SYSTEM CONFIGURATION & LOGS
-- =============================================================================

-- System Configuration Table
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    config_type VARCHAR(50) DEFAULT 'application',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    vendor_id UUID REFERENCES vendors(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File Attachments Table
CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    uploaded_by UUID REFERENCES user_profiles(id),
    related_table VARCHAR(50),
    related_id UUID,
    is_public BOOLEAN DEFAULT false,
    virus_scanned BOOLEAN DEFAULT false,
    scan_result VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Pricing History Table (for tracking price changes)
CREATE TABLE IF NOT EXISTS pricing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES vendor_products(id) ON DELETE CASCADE,
    price_per_kwh DECIMAL(10,2),
    price_per_kw DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    effective_date DATE NOT NULL,
    end_date DATE,
    reason VARCHAR(255),
    created_by UUID REFERENCES vendors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_slug ON user_profiles(public_profile_slug);

-- Saved Projects
CREATE INDEX IF NOT EXISTS idx_saved_projects_user_id ON saved_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_projects_status ON saved_projects(status);

-- Use Cases
CREATE INDEX IF NOT EXISTS idx_use_cases_slug ON use_cases(slug);
CREATE INDEX IF NOT EXISTS idx_use_cases_category ON use_cases(category);
CREATE INDEX IF NOT EXISTS idx_use_cases_active ON use_cases(is_active);
CREATE INDEX IF NOT EXISTS idx_use_case_configs_use_case_id ON use_case_configurations(use_case_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment_templates(equipment_category);
CREATE INDEX IF NOT EXISTS idx_config_equipment_config_id ON configuration_equipment(configuration_id);

-- Pricing & Calculations
CREATE INDEX IF NOT EXISTS idx_pricing_config_key ON pricing_configurations(config_key);
CREATE INDEX IF NOT EXISTS idx_pricing_config_category ON pricing_configurations(config_category);
CREATE INDEX IF NOT EXISTS idx_pricing_config_active ON pricing_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_formula_key ON calculation_formulas(formula_key);
CREATE INDEX IF NOT EXISTS idx_formula_category ON calculation_formulas(formula_category);
CREATE INDEX IF NOT EXISTS idx_formula_active ON calculation_formulas(is_active);
CREATE INDEX IF NOT EXISTS idx_market_data_type ON market_pricing_data(equipment_type);
CREATE INDEX IF NOT EXISTS idx_market_data_region ON market_pricing_data(region);
CREATE INDEX IF NOT EXISTS idx_market_data_date ON market_pricing_data(data_date);
CREATE INDEX IF NOT EXISTS idx_calculation_cache_hash ON calculation_cache(input_hash);
CREATE INDEX IF NOT EXISTS idx_calculation_cache_expires ON calculation_cache(expires_at);

-- Vendors
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_specialty ON vendors(specialty);
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_id ON vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_category ON vendor_products(product_category);

-- RFQs
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_by ON rfqs(created_by);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq_id ON rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_vendor_id ON rfq_responses(vendor_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_id ON vendor_notifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_is_read ON vendor_notifications(is_read);

-- Logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action, created_at);

-- =============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_projects_updated_at BEFORE UPDATE ON saved_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_use_cases_updated_at BEFORE UPDATE ON use_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_use_case_configs_updated_at BEFORE UPDATE ON use_case_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_templates_updated_at BEFORE UPDATE ON equipment_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_config_updated_at BEFORE UPDATE ON pricing_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_formula_updated_at BEFORE UPDATE ON calculation_formulas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_data_updated_at BEFORE UPDATE ON market_pricing_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_products_updated_at BEFORE UPDATE ON vendor_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON rfqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

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
-- DEFAULT SYSTEM CONFIGURATION
-- =============================================================================

INSERT INTO system_config (config_key, config_value, description, config_type, is_public)
VALUES 
    ('app_version', '"2.0.0"', 'Application version', 'system', true),
    ('schema_version', '"2.0.0"', 'Database schema version', 'system', false),
    ('maintenance_mode', 'false', 'Maintenance mode flag', 'system', false),
    ('max_file_upload_size', '104857600', 'Maximum file upload size in bytes (100MB)', 'system', false),
    ('supported_file_types', '["pdf", "docx", "xlsx", "png", "jpg", "jpeg"]', 'Supported file types for uploads', 'system', false),
    ('currency_api_key', '""', 'Currency conversion API key', 'integrations', false),
    ('email_service_config', '{}', 'Email service configuration', 'integrations', false),
    ('default_project_settings', '{"currency": "USD", "warranty": "10 years", "efficiency": 0.85}', 'Default project settings', 'application', true),
    ('rfq_auto_close_days', '30', 'Days after which RFQs auto-close', 'application', false)
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- =============================================================================
-- INITIAL PRICING CONFIGURATIONS
-- =============================================================================

-- BESS Pricing (4-tier system)
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, data_source, confidence_level, vendor_notes)
VALUES (
    'bess_pricing_2025',
    'bess',
    '{
        "smallSystemPerKWh": 580,
        "mediumSystemPerKWh": 450,
        "mediumLargeSystemPerKWh": 350,
        "largeSystemPerKWh": 280,
        "smallSystemSizeMWh": 1,
        "mediumSystemSizeMWh": 5,
        "largeSystemSizeMWh": 15,
        "degradationRate": 0.02,
        "warrantyYears": 10,
        "roundTripEfficiency": 0.85
    }',
    '4-tier BESS pricing structure based on system size (Q4 2025)',
    'GSL Energy, NREL ATB 2024, BloombergNEF',
    'high',
    'Validated against real vendor quotes. Small systems <1MWh at $580/kWh, Medium 1-5MWh at $450/kWh, Medium-Large 5-15MWh at $350/kWh, Large 15+MWh at $280/kWh'
)
ON CONFLICT (config_key) DO UPDATE SET
    config_data = EXCLUDED.config_data,
    updated_at = NOW();

-- Power Electronics Pricing
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, data_source, confidence_level)
VALUES (
    'power_electronics_2025',
    'power_electronics',
    '{
        "inverterPerKW": 120,
        "transformerPerKVA": 80,
        "switchgearPerKW": 50,
        "protectionRelaysPerUnit": 5000
    }',
    'Power conversion system pricing (inverters, transformers, switchgear)',
    'Industry average from multiple vendors',
    'medium'
)
ON CONFLICT (config_key) DO UPDATE SET
    config_data = EXCLUDED.config_data,
    updated_at = NOW();

-- Balance of Plant Pricing
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, data_source, confidence_level)
VALUES (
    'balance_of_plant_2025',
    'balance_of_plant',
    '{
        "bopPercentage": 0.12,
        "epcPercentage": 0.08,
        "laborCostPerHour": 85,
        "shippingCostPercentage": 0.03,
        "contingencyPercentage": 0.05,
        "urbanLaborPremium": 0.15,
        "skillLaborPremiumPercentage": 0.10
    }',
    'Balance of plant and EPC costs',
    'Industry standard percentages',
    'high'
)
ON CONFLICT (config_key) DO UPDATE SET
    config_data = EXCLUDED.config_data,
    updated_at = NOW();

-- =============================================================================
-- INITIAL CALCULATION FORMULAS
-- =============================================================================

-- Simple Payback Period Formula
INSERT INTO calculation_formulas (formula_key, formula_name, formula_category, formula_expression, formula_variables, output_variables, description, reference_sources)
VALUES (
    'simple_payback_period',
    'Simple Payback Period',
    'financial',
    'paybackPeriod = totalInvestment / annualSavings',
    '{
        "totalInvestment": {"type": "number", "unit": "USD", "description": "Total capital investment"},
        "annualSavings": {"type": "number", "unit": "USD/year", "description": "Annual cost savings"}
    }',
    '{
        "paybackPeriod": {"type": "number", "unit": "years", "description": "Years to recover investment"}
    }',
    'Calculates simple payback period without considering time value of money',
    'Standard financial formula'
)
ON CONFLICT (formula_key) DO UPDATE SET
    formula_expression = EXCLUDED.formula_expression,
    updated_at = NOW();

-- ROI Percentage Formula
INSERT INTO calculation_formulas (formula_key, formula_name, formula_category, formula_expression, formula_variables, output_variables, description, reference_sources)
VALUES (
    'roi_percentage',
    'Return on Investment (ROI)',
    'financial',
    'roi = ((totalSavings - totalInvestment) / totalInvestment) * 100',
    '{
        "totalInvestment": {"type": "number", "unit": "USD", "description": "Total capital investment"},
        "totalSavings": {"type": "number", "unit": "USD", "description": "Total lifetime savings"}
    }',
    '{
        "roi": {"type": "number", "unit": "percent", "description": "Return on investment percentage"}
    }',
    'Calculates ROI as percentage return over investment lifetime',
    'Standard financial formula'
)
ON CONFLICT (formula_key) DO UPDATE SET
    formula_expression = EXCLUDED.formula_expression,
    updated_at = NOW();

-- Battery Capacity Sizing Formula
INSERT INTO calculation_formulas (formula_key, formula_name, formula_category, formula_expression, formula_variables, output_variables, description, reference_sources)
VALUES (
    'battery_capacity_sizing',
    'Battery Energy Capacity Sizing',
    'sizing',
    'capacityMWh = powerMW * durationHours / roundTripEfficiency',
    '{
        "powerMW": {"type": "number", "unit": "MW", "description": "Required power output"},
        "durationHours": {"type": "number", "unit": "hours", "description": "Discharge duration"},
        "roundTripEfficiency": {"type": "number", "unit": "decimal", "description": "Round-trip efficiency (0.85 typical)"}
    }',
    '{
        "capacityMWh": {"type": "number", "unit": "MWh", "description": "Required battery capacity"}
    }',
    'Calculates required battery capacity accounting for round-trip efficiency losses',
    'IEEE 2450, NREL BESS sizing guidelines'
)
ON CONFLICT (formula_key) DO UPDATE SET
    formula_expression = EXCLUDED.formula_expression,
    updated_at = NOW();

-- =============================================================================
-- HELPFUL VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW active_vendors AS
SELECT v.*, 
       COUNT(DISTINCT vp.id) as product_count,
       COUNT(DISTINCT rr.id) as response_count
FROM vendors v
LEFT JOIN vendor_products vp ON v.id = vp.vendor_id AND vp.status = 'approved'
LEFT JOIN rfq_responses rr ON v.id = rr.vendor_id AND rr.status = 'submitted'
WHERE v.status = 'approved'
GROUP BY v.id;

CREATE OR REPLACE VIEW project_summary AS
SELECT sp.*,
       up.full_name as user_name,
       up.company_name as user_company
FROM saved_projects sp
JOIN user_profiles up ON sp.user_id = up.id
WHERE sp.status = 'active';

CREATE OR REPLACE VIEW active_use_cases_with_configs AS
SELECT 
    uc.id,
    uc.name,
    uc.slug,
    uc.category,
    uc.description,
    uc.icon,
    uc.usage_count,
    uc.average_roi,
    COUNT(DISTINCT ucc.id) as configuration_count,
    COUNT(DISTINCT cq.id) as question_count
FROM use_cases uc
LEFT JOIN use_case_configurations ucc ON uc.id = ucc.use_case_id
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
WHERE uc.is_active = true
GROUP BY uc.id;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Anonymous users (read public data only)
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT ON saved_projects TO anon;
GRANT SELECT ON use_cases TO anon;
GRANT SELECT ON use_case_configurations TO anon;
GRANT SELECT ON pricing_configurations TO anon;
GRANT SELECT ON calculation_formulas TO anon;
GRANT SELECT ON market_pricing_data TO anon;
GRANT SELECT ON vendors TO anon;
GRANT SELECT ON vendor_products TO anon;
GRANT SELECT ON system_config TO anon;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify all tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND information_schema.columns.table_name = tables.table_name) as column_count
FROM information_schema.tables tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- End of Master Schema
