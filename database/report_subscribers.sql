-- Daily Report Subscribers Table
-- Run this in Supabase SQL Editor

-- Create subscribers table
CREATE TABLE IF NOT EXISTS report_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  company VARCHAR(255),
  
  -- Preferences
  pref_deployments BOOLEAN DEFAULT true,
  pref_pricing BOOLEAN DEFAULT true,
  pref_policy BOOLEAN DEFAULT true,
  pref_customer_leads BOOLEAN DEFAULT true,
  
  -- Status
  active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  last_email_sent TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'website', 'import'
  notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON report_subscribers(active);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON report_subscribers(email);

-- Create report history table
CREATE TABLE IF NOT EXISTS report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Report stats
  articles_count INTEGER,
  companies_count INTEGER,
  leads_count INTEGER,
  deployments_count INTEGER,
  
  -- Recipients
  recipients_count INTEGER,
  recipients JSONB, -- Array of emails sent to
  
  -- Status
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed', 'partial'
  error_message TEXT,
  
  -- Full report data (optional, for debugging)
  report_data JSONB
);

-- Create index for report history
CREATE INDEX IF NOT EXISTS idx_report_history_sent_at ON report_history(sent_at DESC);

-- Enable Row Level Security
ALTER TABLE report_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;

-- Policies (admins only)
CREATE POLICY "Admins can manage subscribers" ON report_subscribers
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM users WHERE tier = 'ADMIN'
    )
  );

CREATE POLICY "Admins can view report history" ON report_history
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM users WHERE tier = 'ADMIN'
    )
  );

CREATE POLICY "System can insert report history" ON report_history
  FOR INSERT WITH CHECK (true);

-- Insert initial test subscriber (update with your email)
-- INSERT INTO report_subscribers (email, name, company, source)
-- VALUES ('your-email@example.com', 'Your Name', 'Merlin Energy', 'manual');

-- Sample query: Get all active subscribers
-- SELECT email, name, company FROM report_subscribers WHERE active = true;

-- Sample query: Get recent report history
-- SELECT sent_at, articles_count, companies_count, leads_count, recipients_count, status 
-- FROM report_history ORDER BY sent_at DESC LIMIT 10;
