-- Create customer_leads table for consultation requests
CREATE TABLE IF NOT EXISTS customer_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  notes TEXT,
  quote_data JSONB,
  lead_type TEXT DEFAULT 'consultation_request',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_leads_email ON customer_leads(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_customer_leads_created_at ON customer_leads(created_at DESC);

-- Create index on lead_type for filtering
CREATE INDEX IF NOT EXISTS idx_customer_leads_type ON customer_leads(lead_type);

-- Enable Row Level Security
ALTER TABLE customer_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for lead capture)
CREATE POLICY "Allow anonymous inserts" ON customer_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read all leads (for admin dashboard)
CREATE POLICY "Allow authenticated reads" ON customer_leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update leads (for admin follow-up)
CREATE POLICY "Allow authenticated updates" ON customer_leads
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_leads_updated_at
  BEFORE UPDATE ON customer_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE customer_leads IS 'Stores lead information from consultation requests and contact forms';
COMMENT ON COLUMN customer_leads.email IS 'Lead email address';
COMMENT ON COLUMN customer_leads.name IS 'Lead name (optional)';
COMMENT ON COLUMN customer_leads.notes IS 'Additional notes from the lead';
COMMENT ON COLUMN customer_leads.quote_data IS 'JSON data from quote builder (if applicable)';
COMMENT ON COLUMN customer_leads.lead_type IS 'Type of lead: consultation_request, contact_form, etc.';
