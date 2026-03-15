-- Fix Missing Excerpt Column in scraped_articles
-- Created: March 15, 2026
-- Issue: Scraper failing because excerpt column doesn't exist

-- Add excerpt column if it doesn't exist
ALTER TABLE scraped_articles 
ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'scraped_articles'
  AND column_name = 'excerpt';
