-- Merlin BESS Quote Builder Database Schema
-- Version: 2.1.0
-- Generated: November 7, 2025

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Calculation Cache Table
CREATE TABLE IF NOT EXISTS calculation_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    input_hash VARCHAR(64) UNIQUE NOT NULL,
    calculation_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    calculation_results JSONB NOT NULL,
    calculation_version VARCHAR(10) DEFAULT '2.1.0',
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX (user_id, created_at),
    INDEX (vendor_id, created_at),
    INDEX (action, created_at)
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

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_slug ON user_profiles(public_profile_slug);
CREATE INDEX IF NOT EXISTS idx_saved_projects_user_id ON saved_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_projects_status ON saved_projects(status);
CREATE INDEX IF NOT EXISTS idx_calculation_cache_hash ON calculation_cache(input_hash);
CREATE INDEX IF NOT EXISTS idx_calculation_cache_expires ON calculation_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_specialty ON vendors(specialty);
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_id ON vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_category ON vendor_products(product_category);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_by ON rfqs(created_by);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq_id ON rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_vendor_id ON rfq_responses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_id ON vendor_notifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_is_read ON vendor_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action, created_at);

-- Create Functions for Updated Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Triggers for Auto-updating Timestamps
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_projects_updated_at BEFORE UPDATE ON saved_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_products_updated_at BEFORE UPDATE ON vendor_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON rfqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles - Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Saved Projects - Users can only see/edit their own projects
CREATE POLICY "Users can view own projects" ON saved_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can modify own projects" ON saved_projects FOR ALL USING (auth.uid() = user_id);

-- Vendor Notifications - Vendors can only see their own notifications
CREATE POLICY "Vendors can view own notifications" ON vendor_notifications FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE id = auth.uid())
);

-- Public profiles are viewable by everyone
CREATE POLICY "Public profiles viewable by all" ON user_profiles FOR SELECT USING (is_public_profile = true);

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description, config_type, is_public)
VALUES 
    ('app_version', '"2.1.0"', 'Application version', 'system', true),
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

-- Create Views for Common Queries
CREATE OR REPLACE VIEW active_vendors AS
SELECT v.*, 
       COUNT(vp.id) as product_count,
       COUNT(rr.id) as response_count
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

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Allow authenticated users to use tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Allow anonymous users to read public data only
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT ON saved_projects TO anon;
GRANT SELECT ON vendors TO anon;
GRANT SELECT ON vendor_products TO anon;
GRANT SELECT ON system_config TO anon;

-- End of Schema