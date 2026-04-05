-- Fix Broken RSS Feeds - Disable sources with 404 errors
-- Created: March 20, 2026
-- Run after 20260320_add_rss_sources.sql

-- Disable feeds that return 404 or timeout
UPDATE market_data_sources 
SET is_active = false,
    notes = 'Feed URL returns 404 as of March 2026. RSS feed may have been discontinued.'
WHERE name IN (
    'Energy Storage Association',
    'NREL News',
    'Microgrid Knowledge',
    'Solar Power Portal',
    'Enphase Energy',
    'ChargePoint Blog'
);

-- Update notes for other problematic feeds
UPDATE market_data_sources 
SET notes = 'Feed URL returns 403 Forbidden. May require different user agent or authentication.'
WHERE name IN ('Tesla Energy News', 'LBNL Electricity Markets');

UPDATE market_data_sources 
SET notes = 'Rate limited (429). Consider reducing scrape frequency.'
WHERE name = 'EVgo News';

-- Log the disabled sources
DO $$
DECLARE
    disabled_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO disabled_count
    FROM market_data_sources
    WHERE is_active = false AND source_type = 'rss_feed';
    
    RAISE NOTICE 'Disabled % RSS feed sources due to 404/timeout errors', disabled_count;
END $$;

-- Add indexes to help with future feed health monitoring
CREATE INDEX IF NOT EXISTS idx_market_sources_fetch_status 
ON market_data_sources(last_fetch_status, is_active) 
WHERE source_type = 'rss_feed';

CREATE INDEX IF NOT EXISTS idx_market_sources_error_count 
ON market_data_sources(fetch_error_count) 
WHERE fetch_error_count > 0;
