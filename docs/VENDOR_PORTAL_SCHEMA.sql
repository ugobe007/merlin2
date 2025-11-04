-- =====================================================
-- VENDOR PORTAL DATABASE SCHEMA
-- For Merlin Energy Solutions Vendor Management
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. VENDORS TABLE
-- Stores vendor company information and credentials
-- =====================================================
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(500),
  address TEXT,
  
  -- Business Details
  specialty VARCHAR(100) NOT NULL,
  -- Options: 'battery', 'inverter', 'ems', 'bos', 'epc', 'integrator'
  description TEXT,
  
  -- Authentication
  password_hash VARCHAR(255) NOT NULL,
  
  -- Status & Approval
  status VARCHAR(20) DEFAULT 'pending',
  -- Options: 'pending', 'approved', 'rejected', 'suspended'
  approved_by UUID,
  approved_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  
  -- Performance Metrics
  total_submissions INT DEFAULT 0,
  approved_submissions INT DEFAULT 0,
  quotes_included_count INT DEFAULT 0,
  
  CONSTRAINT valid_specialty CHECK (specialty IN ('battery', 'inverter', 'ems', 'bos', 'epc', 'integrator')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))
);

-- Indexes
CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_specialty ON vendors(specialty);

-- =====================================================
-- 2. VENDOR PRODUCTS TABLE
-- Stores product catalog and pricing from vendors
-- =====================================================
CREATE TABLE vendor_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Product Information
  product_category VARCHAR(50) NOT NULL,
  -- Options: 'battery', 'inverter', 'ems', 'bos', 'container'
  manufacturer VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  
  -- Technical Specifications
  capacity_kwh DECIMAL(10, 2),
  power_kw DECIMAL(10, 2),
  voltage_v DECIMAL(10, 2),
  chemistry VARCHAR(50), -- For batteries: LFP, NMC, etc.
  efficiency_percent DECIMAL(5, 2),
  
  -- Pricing
  price_per_kwh DECIMAL(10, 2),
  price_per_kw DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Commercial Terms
  lead_time_weeks INT NOT NULL,
  warranty_years INT NOT NULL,
  minimum_order_quantity INT DEFAULT 1,
  
  -- Certifications
  certifications TEXT[], -- Array of certification names
  certification_docs JSONB, -- Links to cert documents
  
  -- Documentation
  datasheet_url VARCHAR(500),
  datasheet_filename VARCHAR(255),
  
  -- Status & Approval
  status VARCHAR(20) DEFAULT 'pending',
  -- Options: 'pending', 'approved', 'rejected', 'discontinued'
  approved_by UUID,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Market Intelligence
  times_quoted INT DEFAULT 0,
  times_selected INT DEFAULT 0,
  
  CONSTRAINT valid_product_category CHECK (product_category IN ('battery', 'inverter', 'ems', 'bos', 'container')),
  CONSTRAINT valid_product_status CHECK (status IN ('pending', 'approved', 'rejected', 'discontinued'))
);

-- Indexes
CREATE INDEX idx_vendor_products_vendor ON vendor_products(vendor_id);
CREATE INDEX idx_vendor_products_category ON vendor_products(product_category);
CREATE INDEX idx_vendor_products_status ON vendor_products(status);
CREATE INDEX idx_vendor_products_approval ON vendor_products(status, approved_at);

-- =====================================================
-- 3. RFQs (REQUEST FOR QUOTES) TABLE
-- Stores project opportunities for vendors
-- =====================================================
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- RFQ Identification
  rfq_number VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  
  -- Project Details
  system_size_mw DECIMAL(10, 3) NOT NULL,
  duration_hours DECIMAL(10, 2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  state_province VARCHAR(100),
  country VARCHAR(100) DEFAULT 'USA',
  
  -- Requirements
  requirements TEXT,
  preferred_chemistry VARCHAR(50),
  delivery_deadline DATE,
  
  -- Timing
  due_date TIMESTAMP NOT NULL,
  project_start_date DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'open',
  -- Options: 'draft', 'open', 'closed', 'awarded', 'cancelled'
  
  -- Vendor Targeting
  target_specialties VARCHAR(100)[],
  invited_vendors UUID[], -- Specific vendors invited
  
  -- Created by
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  
  -- Responses
  response_count INT DEFAULT 0,
  
  CONSTRAINT valid_rfq_status CHECK (status IN ('draft', 'open', 'closed', 'awarded', 'cancelled'))
);

-- Indexes
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_due_date ON rfqs(due_date);
CREATE INDEX idx_rfqs_created_by ON rfqs(created_by);

-- =====================================================
-- 4. RFQ RESPONSES TABLE
-- Stores vendor proposals for RFQs
-- =====================================================
CREATE TABLE rfq_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Proposal Details
  total_price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  lead_time_weeks INT NOT NULL,
  warranty_years INT NOT NULL,
  
  -- Breakdown (stored as JSONB for flexibility)
  pricing_breakdown JSONB NOT NULL,
  /*
  Example structure:
  {
    "battery": { "model": "CATL LFP 280Ah", "price_per_kwh": 145, "total": 580000 },
    "inverter": { "model": "SMA 500kW", "price_per_kw": 180, "total": 360000 },
    "bos": { "percentage": 20, "total": 188000 },
    "epc": { "percentage": 25, "total": 282000 }
  }
  */
  
  -- Technical Proposal
  technical_proposal TEXT,
  value_proposition TEXT,
  
  -- Documentation
  proposal_document_url VARCHAR(500),
  proposal_filename VARCHAR(255),
  supporting_docs JSONB, -- Array of document links
  
  -- Status
  status VARCHAR(20) DEFAULT 'submitted',
  -- Options: 'draft', 'submitted', 'under_review', 'shortlisted', 'accepted', 'rejected'
  
  -- Evaluation
  evaluation_score DECIMAL(5, 2),
  evaluation_notes TEXT,
  evaluated_by UUID,
  evaluated_at TIMESTAMP,
  
  -- Metadata
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint: one response per vendor per RFQ
  UNIQUE(rfq_id, vendor_id),
  
  CONSTRAINT valid_response_status CHECK (status IN ('draft', 'submitted', 'under_review', 'shortlisted', 'accepted', 'rejected'))
);

-- Indexes
CREATE INDEX idx_rfq_responses_rfq ON rfq_responses(rfq_id);
CREATE INDEX idx_rfq_responses_vendor ON rfq_responses(vendor_id);
CREATE INDEX idx_rfq_responses_status ON rfq_responses(status);

-- =====================================================
-- 5. VENDOR NOTIFICATIONS TABLE
-- Stores notification history for vendors
-- =====================================================
CREATE TABLE vendor_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Recipient
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Notification Content
  type VARCHAR(50) NOT NULL,
  -- Options: 'new_rfq', 'rfq_reminder', 'response_accepted', 'response_rejected', 'product_approved', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related Entities
  related_rfq_id UUID REFERENCES rfqs(id) ON DELETE SET NULL,
  related_product_id UUID REFERENCES vendor_products(id) ON DELETE SET NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  -- Delivery
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_notification_type CHECK (type IN (
    'new_rfq', 'rfq_reminder', 'rfq_closing_soon', 
    'response_accepted', 'response_rejected', 'response_shortlisted',
    'product_approved', 'product_rejected', 'account_approved', 'account_rejected'
  ))
);

-- Indexes
CREATE INDEX idx_vendor_notifications_vendor ON vendor_notifications(vendor_id);
CREATE INDEX idx_vendor_notifications_unread ON vendor_notifications(vendor_id, is_read);
CREATE INDEX idx_vendor_notifications_created ON vendor_notifications(created_at DESC);

-- =====================================================
-- 6. PRICING HISTORY TABLE
-- Tracks pricing changes over time for market intelligence
-- =====================================================
CREATE TABLE pricing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES vendor_products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Historical Pricing
  price_per_kwh DECIMAL(10, 2),
  price_per_kw DECIMAL(10, 2),
  lead_time_weeks INT,
  
  -- Context
  change_reason VARCHAR(255),
  market_notes TEXT,
  
  -- Metadata
  effective_date DATE NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW(),
  recorded_by UUID
);

-- Indexes
CREATE INDEX idx_pricing_history_product ON pricing_history(product_id);
CREATE INDEX idx_pricing_history_date ON pricing_history(effective_date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_history ENABLE ROW LEVEL SECURITY;

-- Vendors can only see their own data
CREATE POLICY "Vendors can view own profile"
  ON vendors FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Vendors can update own profile"
  ON vendors FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Vendors can view their own products
CREATE POLICY "Vendors can view own products"
  ON vendor_products FOR SELECT
  USING (auth.uid()::text = vendor_id::text);

CREATE POLICY "Vendors can insert own products"
  ON vendor_products FOR INSERT
  WITH CHECK (auth.uid()::text = vendor_id::text);

CREATE POLICY "Vendors can update own products"
  ON vendor_products FOR UPDATE
  USING (auth.uid()::text = vendor_id::text);

-- Vendors can view open RFQs
CREATE POLICY "Vendors can view open RFQs"
  ON rfqs FOR SELECT
  USING (status = 'open');

-- Vendors can view their own responses
CREATE POLICY "Vendors can view own responses"
  ON rfq_responses FOR SELECT
  USING (auth.uid()::text = vendor_id::text);

CREATE POLICY "Vendors can insert own responses"
  ON rfq_responses FOR INSERT
  WITH CHECK (auth.uid()::text = vendor_id::text);

CREATE POLICY "Vendors can update own responses"
  ON rfq_responses FOR UPDATE
  USING (auth.uid()::text = vendor_id::text);

-- Vendors can view their own notifications
CREATE POLICY "Vendors can view own notifications"
  ON vendor_notifications FOR SELECT
  USING (auth.uid()::text = vendor_id::text);

CREATE POLICY "Vendors can update own notifications"
  ON vendor_notifications FOR UPDATE
  USING (auth.uid()::text = vendor_id::text);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_products_updated_at BEFORE UPDATE ON vendor_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON rfqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfq_responses_updated_at BEFORE UPDATE ON rfq_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment vendor submission counts
CREATE OR REPLACE FUNCTION increment_vendor_submissions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors 
  SET total_submissions = total_submissions + 1
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_product_submitted AFTER INSERT ON vendor_products
  FOR EACH ROW EXECUTE FUNCTION increment_vendor_submissions();

-- Function to track product approval
CREATE OR REPLACE FUNCTION on_product_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE vendors 
    SET approved_submissions = approved_submissions + 1
    WHERE id = NEW.vendor_id;
    
    -- Create notification
    INSERT INTO vendor_notifications (vendor_id, type, title, message, related_product_id)
    VALUES (
      NEW.vendor_id,
      'product_approved',
      'Product Approved',
      'Your product submission "' || NEW.model || '" has been approved and added to the marketplace.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_product_status_change AFTER UPDATE ON vendor_products
  FOR EACH ROW EXECUTE FUNCTION on_product_approved();

-- =====================================================
-- SEED DATA FOR TESTING
-- =====================================================

-- Insert sample vendor (password: Test123!)
-- Note: In production, hash passwords properly with bcrypt
INSERT INTO vendors (company_name, contact_name, email, phone, specialty, description, password_hash, status)
VALUES 
  ('ACME Battery Solutions', 'John Smith', 'john@acmebattery.com', '(555) 123-4567', 'battery', 
   'Leading supplier of LFP battery modules for utility-scale energy storage', 
   '$2a$10$example_hash_here', 'approved'),
  
  ('PowerTech Inverters', 'Sarah Johnson', 'sarah@powertech.com', '(555) 234-5678', 'inverter',
   'Manufacturer of high-efficiency grid-tied inverters and PCS systems',
   '$2a$10$example_hash_here', 'approved');

-- Insert sample products
INSERT INTO vendor_products (
  vendor_id, product_category, manufacturer, model,
  capacity_kwh, power_kw, chemistry, efficiency_percent,
  price_per_kwh, price_per_kw, lead_time_weeks, warranty_years,
  certifications, status
)
SELECT 
  v.id, 'battery', 'CATL', 'LFP 280Ah Cell',
  NULL, NULL, 'LFP', 95.0,
  145.00, NULL, 12, 10,
  ARRAY['UL9540', 'IEC 62619', 'UN38.3'], 'approved'
FROM vendors v WHERE v.email = 'john@acmebattery.com';

-- Insert sample RFQ
INSERT INTO rfqs (
  rfq_number, project_name, system_size_mw, duration_hours,
  location, state_province, country, requirements, due_date,
  target_specialties, created_by, status
)
VALUES (
  'RFQ-2025-001',
  'Hotel (300 Rooms) BESS Installation',
  2.0, 4.0,
  'Los Angeles', 'California', 'USA',
  'Seeking competitive pricing for 2MW/4MWh BESS system. Must include battery modules, PCS, EMS, and BOS. Installation to begin Q2 2026.',
  NOW() + INTERVAL '15 days',
  ARRAY['battery', 'inverter', 'ems', 'bos'],
  (SELECT id FROM vendors LIMIT 1),
  'open'
);

-- =====================================================
-- USEFUL QUERIES FOR ADMIN DASHBOARD
-- =====================================================

-- View all pending vendor approvals
CREATE OR REPLACE VIEW pending_vendor_approvals AS
SELECT 
  v.id, v.company_name, v.contact_name, v.email, 
  v.specialty, v.created_at, v.description
FROM vendors v
WHERE v.status = 'pending'
ORDER BY v.created_at ASC;

-- View all pending product approvals
CREATE OR REPLACE VIEW pending_product_approvals AS
SELECT 
  p.id, p.product_category, p.manufacturer, p.model,
  p.price_per_kwh, p.price_per_kw, p.lead_time_weeks,
  v.company_name as vendor_name, v.email as vendor_email,
  p.created_at
FROM vendor_products p
JOIN vendors v ON p.vendor_id = v.id
WHERE p.status = 'pending'
ORDER BY p.created_at ASC;

-- Vendor performance summary
CREATE OR REPLACE VIEW vendor_performance AS
SELECT 
  v.id, v.company_name, v.specialty,
  v.total_submissions, v.approved_submissions,
  v.quotes_included_count,
  CASE 
    WHEN v.total_submissions > 0 
    THEN ROUND((v.approved_submissions::numeric / v.total_submissions::numeric) * 100, 1)
    ELSE 0 
  END as approval_rate_percent,
  v.created_at, v.last_login
FROM vendors v
WHERE v.status = 'approved'
ORDER BY v.quotes_included_count DESC;

-- Market pricing analysis
CREATE OR REPLACE VIEW market_pricing_analysis AS
SELECT 
  product_category,
  COUNT(*) as product_count,
  AVG(price_per_kwh) as avg_price_kwh,
  MIN(price_per_kwh) as min_price_kwh,
  MAX(price_per_kwh) as max_price_kwh,
  AVG(lead_time_weeks) as avg_lead_time,
  AVG(warranty_years) as avg_warranty
FROM vendor_products
WHERE status = 'approved' AND price_per_kwh IS NOT NULL
GROUP BY product_category;

-- =====================================================
-- GRANTS (if needed for service role)
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON vendors TO authenticated;
GRANT SELECT, INSERT, UPDATE ON vendor_products TO authenticated;
GRANT SELECT ON rfqs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON rfq_responses TO authenticated;
GRANT SELECT, UPDATE ON vendor_notifications TO authenticated;

-- =====================================================
-- COMPLETE!
-- Next steps:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Configure Supabase Auth for vendor authentication
-- 3. Update environment variables with Supabase credentials
-- 4. Implement API calls in VendorPortal.tsx
-- =====================================================
