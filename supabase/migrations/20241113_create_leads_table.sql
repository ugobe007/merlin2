-- Create leads table for capturing user information before quote downloads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'quote_download',
  format TEXT, -- PDF, Excel, Word
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert leads (anonymous users can submit)
CREATE POLICY "Anyone can insert leads" ON leads
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view their own leads
CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT
  USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Add comment to table
COMMENT ON TABLE leads IS 'Captures user information before quote downloads for lead generation';
