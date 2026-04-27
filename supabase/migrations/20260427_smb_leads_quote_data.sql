-- Add quote_data column to cache the full quote response on the lead
-- Used to populate email highlights (annual savings, payback, NPV, equipment)
ALTER TABLE smb_leads ADD COLUMN IF NOT EXISTS quote_data jsonb;
