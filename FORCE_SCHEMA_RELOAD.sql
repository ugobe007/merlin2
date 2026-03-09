-- Force PostgREST to reload schema by making a schema change
-- This triggers PostgreSQL's DDL notification system

-- Add a dummy column
ALTER TABLE scraped_articles ADD COLUMN IF NOT EXISTS _cache_buster BOOLEAN DEFAULT false;

-- Remove the dummy column
ALTER TABLE scraped_articles DROP COLUMN IF EXISTS _cache_buster;

-- This forces PostgREST to reload the entire table schema
-- Wait 30 seconds after running this, then retry the workflow
