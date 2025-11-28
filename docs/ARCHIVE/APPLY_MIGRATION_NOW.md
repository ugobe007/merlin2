# 🚨 CRITICAL: Database Migration Required 🚨

## Before Testing the New Features, You MUST Apply This Migration

### What This Does:
Creates the `customer_leads` table to store consultation requests from users.

### How to Apply:

#### Option 1: Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/fvmpmozybmtzjvikrctq/sql
2. Click "New Query"
3. Copy the entire SQL below
4. Paste and click "Run"
5. Verify success message appears

#### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### THE SQL MIGRATION:

```sql
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
```

### Verification:

After running the migration, verify it worked:

1. Go to Supabase Table Editor
2. Look for `customer_leads` table
3. Check columns exist: id, email, name, notes, quote_data, lead_type, created_at, updated_at
4. Check RLS is enabled (shield icon next to table name)

### Test It:

1. Go to https://merlin2.fly.dev/
2. Start Smart Wizard
3. Complete a quote
4. Click "Schedule Free Consultation"
5. Fill in form and submit
6. Check Supabase `customer_leads` table - you should see your entry!

### If Migration Fails:

**Error: "relation already exists"**
- Table already created, you're good to go!

**Error: "permission denied"**
- Make sure you're using the service role key (not anon key)
- Run migration from Supabase Dashboard as admin

**Error: "syntax error"**
- Copy SQL exactly as shown (no extra characters)
- Make sure you copied the entire block

### Need Help?

Check the full migration file:
`docs/customer_leads_migration.sql`

Or check implementation docs:
`MULTISELECT_LEADCAPTURE_IMPLEMENTATION.md`
