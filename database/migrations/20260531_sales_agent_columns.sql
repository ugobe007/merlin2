-- ============================================================
-- SALES AGENT COLUMNS — smb_leads extension
-- Run this in Supabase SQL Editor (once)
-- ============================================================
-- The original smb_leads table was created for the SMB widget
-- platform. The Sales Agent pipeline (Google Places + News RSS)
-- adds these columns. This migration is safe to re-run —
-- every ADD COLUMN uses IF NOT EXISTS.
-- ============================================================

ALTER TABLE smb_leads
  ADD COLUMN IF NOT EXISTS name               TEXT,
  ADD COLUMN IF NOT EXISTS vertical           TEXT,
  ADD COLUMN IF NOT EXISTS industry           TEXT,
  ADD COLUMN IF NOT EXISTS source             TEXT,           -- 'google_places' | 'news_scraper'
  ADD COLUMN IF NOT EXISTS place_id           TEXT,
  ADD COLUMN IF NOT EXISTS address            TEXT,
  ADD COLUMN IF NOT EXISTS website            TEXT,
  ADD COLUMN IF NOT EXISTS google_rating      NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS google_reviews     INTEGER,
  ADD COLUMN IF NOT EXISTS lat                NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS lng                NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS quote_url          TEXT,
  ADD COLUMN IF NOT EXISTS quote_data         JSONB,
  ADD COLUMN IF NOT EXISTS contact_email      TEXT,
  ADD COLUMN IF NOT EXISTS email_sent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contacts           JSONB;          -- [{firstName, lastName, title}]

-- Unique constraint on place_id so Google Places leads don't duplicate
ALTER TABLE smb_leads
  DROP CONSTRAINT IF EXISTS smb_leads_place_id_unique;

ALTER TABLE smb_leads
  ADD CONSTRAINT smb_leads_place_id_unique UNIQUE (place_id);

-- Allow site_slug to be null (news_scraper leads have no site slug)
ALTER TABLE smb_leads
  ALTER COLUMN site_slug DROP NOT NULL;

-- Indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_smb_leads_vertical   ON smb_leads(vertical);
CREATE INDEX IF NOT EXISTS idx_smb_leads_source     ON smb_leads(source);
CREATE INDEX IF NOT EXISTS idx_smb_leads_place_id   ON smb_leads(place_id);
CREATE INDEX IF NOT EXISTS idx_smb_leads_name       ON smb_leads(name);


-- ============================================================
-- HOW TO ADD / UPDATE CONTACTS FOR A LEAD
-- ============================================================
-- Replace the WHERE clause with the actual lead id (UUID).
-- The contacts column is a JSONB array of contact objects.
--
-- Example: set contacts for a specific lead by id
-- ============================================================

/*

-- Set contacts by lead ID:
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Bob", "lastName": "Smith",       "title": "Director of Operations"},
  {"firstName": "Jane","lastName": "Rodriguez",   "title": "Facilities Director"},
  {"firstName": "Tom", "lastName": "Wheeler",     "title": "VP Operations"}
]'::jsonb
WHERE id = 'YOUR-LEAD-UUID-HERE';


-- Set contacts by company name (if you know the exact name):
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Bob", "lastName": "Smith", "title": "Director of Operations"}
]'::jsonb
WHERE name = 'Acme Manufacturing';


-- Append a new contact to existing contacts (non-destructive):
UPDATE smb_leads
SET contacts = COALESCE(contacts, '[]'::jsonb) || '[
  {"firstName": "Sarah", "lastName": "Kim", "title": "Energy Manager"}
]'::jsonb
WHERE id = 'YOUR-LEAD-UUID-HERE';


-- View all leads with contacts set:
SELECT id, name, address, vertical, website, contacts
FROM smb_leads
WHERE contacts IS NOT NULL
ORDER BY created_at DESC;


-- View resolved email targets for a lead (requires website to be set):
-- Run this to verify what emails Merlin will target:
SELECT
  id,
  name,
  website,
  contacts,
  jsonb_array_elements(contacts)->>'firstName' || '.' ||
  jsonb_array_elements(contacts)->>'lastName'  || '@' ||
  regexp_replace(website, '^https?://(www\.)?', '') AS sample_named_email
FROM smb_leads
WHERE contacts IS NOT NULL
  AND website IS NOT NULL;

*/
