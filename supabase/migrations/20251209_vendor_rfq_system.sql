-- =====================================================
-- VENDOR RFQ SYSTEM TABLES
-- December 9, 2025
-- 
-- Supports the SSOT workflow:
-- 1. Customer generates quote using calculateQuote() (AAD)
-- 2. Customer submits RFQ with accurate pricing data
-- 3. Vendors receive notifications (email + in-app)
-- 4. Vendors respond via Vendor Portal
-- 5. Customer selects winning vendor
-- =====================================================

-- NOTE: vendors table already exists (from VENDOR_PORTAL_SCHEMA.sql)
-- This migration adds RFQ-specific tables only

-- Drop existing tables if running migration again (safe re-run)
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS vendor_notifications CASCADE;
DROP TABLE IF EXISTS rfq_responses CASCADE;
DROP TABLE IF EXISTS rfqs CASCADE;

-- RFQs (Request for Quotes)
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  
  -- System specifications (from SSOT calculateQuote)
  system_size_mw DECIMAL(10, 4) NOT NULL,
  duration_hours INTEGER NOT NULL,
  solar_mw DECIMAL(10, 4) DEFAULT 0,
  wind_mw DECIMAL(10, 4) DEFAULT 0,
  generator_mw DECIMAL(10, 4) DEFAULT 0,
  
  -- Location & use case
  location VARCHAR(100) NOT NULL,
  use_case VARCHAR(100),
  
  -- Premium flag
  is_premium BOOLEAN DEFAULT FALSE,
  
  -- Customer info
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  user_id UUID REFERENCES auth.users(id),
  
  -- Requirements (JSONB for flexibility)
  requirements JSONB DEFAULT '{}',
  
  -- Budget from SSOT pricing
  estimated_budget_min DECIMAL(12, 2),
  estimated_budget_max DECIMAL(12, 2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'awarded', 'cancelled')),
  
  -- Dates
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metrics
  responses_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0
);

-- RFQ Responses (Vendor bids)
CREATE TABLE rfq_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Pricing
  total_price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  pricing_breakdown JSONB DEFAULT '{}',
  
  -- Terms
  lead_time_weeks INTEGER,
  warranty_years INTEGER,
  payment_terms VARCHAR(255),
  
  -- Proposal
  technical_proposal TEXT,
  value_proposition TEXT,
  proposal_document_url TEXT,
  proposal_filename VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'shortlisted', 'accepted', 'rejected')),
  
  -- Dates
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique constraint: one response per vendor per RFQ
  UNIQUE(rfq_id, vendor_id)
);

-- Vendor Notifications
CREATE TABLE vendor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL, -- 'new_rfq', 'premium_rfq', 'rfq_update', 'response_reviewed', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT,
  
  -- Related entities
  rfq_id UUID REFERENCES rfqs(id) ON DELETE SET NULL,
  
  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Queue (for background processing)
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  to_email VARCHAR(255) NOT NULL,
  
  -- Email details
  email_type VARCHAR(50) NOT NULL, -- 'rfq_notification', 'response_status', 'welcome', etc.
  subject VARCHAR(500) NOT NULL,
  template_data JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed')),
  error_message TEXT,
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Retry logic
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_due_date ON rfqs(due_date);
CREATE INDEX IF NOT EXISTS idx_rfqs_is_premium ON rfqs(is_premium);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq_id ON rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_vendor_id ON rfq_responses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_id ON vendor_notifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_is_read ON vendor_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);

-- Function to increment RFQ responses
CREATE OR REPLACE FUNCTION increment_rfq_responses(rfq_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE rfqs
  SET responses_count = responses_count + 1,
      updated_at = NOW()
  WHERE id = rfq_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- RFQs: Anyone can create, vendors can view open ones
CREATE POLICY "Anyone can create RFQs" ON rfqs FOR INSERT WITH CHECK (true);
CREATE POLICY "Open RFQs visible to vendors" ON rfqs FOR SELECT 
  USING (status = 'open' OR user_id = auth.uid());

-- RFQ Responses: Vendors can manage their own
CREATE POLICY "Vendors manage own responses" ON rfq_responses 
  FOR ALL USING (vendor_id IN (SELECT id FROM vendors WHERE id = auth.uid()));

-- Notifications: Vendors see their own
CREATE POLICY "Vendors see own notifications" ON vendor_notifications 
  FOR ALL USING (vendor_id IN (SELECT id FROM vendors WHERE id = auth.uid()));

-- Email queue: System only (no direct access)
CREATE POLICY "System only email queue" ON email_queue FOR ALL USING (false);

-- Grant usage to authenticated users
GRANT SELECT, INSERT ON rfqs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON rfq_responses TO authenticated;
GRANT SELECT, UPDATE ON vendor_notifications TO authenticated;
