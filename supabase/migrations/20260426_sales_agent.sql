-- Sales Agent schema additions
-- Run this in Supabase SQL Editor

-- 0. Add name column and relax site_slug NOT NULL (sales agent creates records without a slug)
ALTER TABLE smb_leads
  ADD COLUMN IF NOT EXISTS name            text,
  ALTER COLUMN site_slug DROP NOT NULL;

-- 1. Extend smb_leads with sales agent fields
ALTER TABLE smb_leads
  ADD COLUMN IF NOT EXISTS place_id        text UNIQUE,
  ADD COLUMN IF NOT EXISTS vertical        text,
  ADD COLUMN IF NOT EXISTS industry        text,
  ADD COLUMN IF NOT EXISTS address         text,
  ADD COLUMN IF NOT EXISTS phone           text,
  ADD COLUMN IF NOT EXISTS website         text,
  ADD COLUMN IF NOT EXISTS contact_email   text,
  ADD COLUMN IF NOT EXISTS google_rating   numeric(3,1),
  ADD COLUMN IF NOT EXISTS google_reviews  integer,
  ADD COLUMN IF NOT EXISTS lat             numeric(10,6),
  ADD COLUMN IF NOT EXISTS lng             numeric(10,6),
  ADD COLUMN IF NOT EXISTS status          text DEFAULT 'discovered',
  ADD COLUMN IF NOT EXISTS source          text DEFAULT 'google_places',
  ADD COLUMN IF NOT EXISTS quote_url       text,
  ADD COLUMN IF NOT EXISTS email_sent_at   timestamptz,
  ADD COLUMN IF NOT EXISTS notes           text;

-- 2. Extend shared_quotes to support sales agent
ALTER TABLE shared_quotes
  ADD COLUMN IF NOT EXISTS business_name   text,
  ADD COLUMN IF NOT EXISTS industry        text,
  ADD COLUMN IF NOT EXISTS source          text,
  ADD COLUMN IF NOT EXISTS smb_lead_id     uuid REFERENCES smb_leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS share_token     text UNIQUE;

-- 3. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_smb_leads_vertical  ON smb_leads(vertical);
CREATE INDEX IF NOT EXISTS idx_smb_leads_status    ON smb_leads(status);
CREATE INDEX IF NOT EXISTS idx_smb_leads_place_id  ON smb_leads(place_id);
CREATE INDEX IF NOT EXISTS idx_shared_quotes_token ON shared_quotes(share_token);

-- 4. RLS: sales agent route uses service role key (bypasses RLS)
--    Public quote view endpoint needs read access by share_token
ALTER TABLE shared_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_shared_quotes" ON shared_quotes;
CREATE POLICY "public_read_shared_quotes"
  ON shared_quotes FOR SELECT
  USING (is_public = true OR share_token IS NOT NULL);
