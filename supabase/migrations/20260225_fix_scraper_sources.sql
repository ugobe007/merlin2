-- =============================================================================
-- Migration: fix_scraper_sources
-- Date: 2026-02-25
-- Issues fixed:
--   Issue 1: Add 5 price-focused RSS sources (EIA, NREL, PV Tech, Utility Dive,
--            Canary Media) to improve 0% price extraction rate
--   Issue 2: Remove ~6 duplicate entries in market_data_sources (same feed_url
--            appearing twice with different IDs)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 2: Remove duplicate RSS sources
-- Strategy: keep the oldest row per feed_url, delete the rest
-- ─────────────────────────────────────────────────────────────────────────────

-- Preview what will be deleted (run SELECT first to verify before DELETE)
-- SELECT id, name, feed_url, created_at
-- FROM market_data_sources
-- WHERE feed_url IS NOT NULL
--   AND id NOT IN (
--     SELECT DISTINCT ON (feed_url) id
--     FROM market_data_sources
--     WHERE feed_url IS NOT NULL
--     ORDER BY feed_url, created_at ASC
--   );

DELETE FROM market_data_sources
WHERE feed_url IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (feed_url) id
    FROM market_data_sources
    WHERE feed_url IS NOT NULL
    ORDER BY feed_url, created_at ASC
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 1: Add price-focused RSS sources
-- These sources regularly publish articles with $/kWh, $/W, $/kW pricing data
-- Uses INSERT ... WHERE NOT EXISTS to avoid duplicates (no unique constraint on feed_url)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO market_data_sources (
  name, url, feed_url, source_type, content_type,
  equipment_categories, is_active, reliability_score, data_frequency, regions
)
SELECT * FROM (VALUES
  (
    'EIA Today in Energy',
    'https://www.eia.gov/todayinenergy/',
    'https://www.eia.gov/rss/todayinenergy.xml',
    'government', 'pricing',
    ARRAY['bess', 'solar', 'wind', 'generator']::text[],
    true, 5, 'daily',
    ARRAY['north-america']::text[]
  ),
  (
    'NREL News',
    'https://www.nrel.gov/news/',
    'https://www.nrel.gov/news/rss.xml',
    'government', 'mixed',
    ARRAY['bess', 'solar', 'wind', 'ev-charger']::text[],
    true, 5, 'weekly',
    ARRAY['north-america']::text[]
  ),
  (
    'PV Tech',
    'https://www.pv-tech.org',
    'https://www.pv-tech.org/feed/',
    'rss_feed', 'mixed',
    ARRAY['solar', 'bess', 'inverter']::text[],
    true, 4, 'daily',
    ARRAY['global']::text[]
  ),
  (
    'Utility Dive',
    'https://www.utilitydive.com',
    'https://www.utilitydive.com/feeds/news/',
    'rss_feed', 'mixed',
    ARRAY['bess', 'solar', 'wind']::text[],
    true, 4, 'daily',
    ARRAY['north-america']::text[]
  ),
  (
    'Canary Media',
    'https://www.canarymedia.com',
    'https://www.canarymedia.com/feed',
    'rss_feed', 'mixed',
    ARRAY['bess', 'solar', 'ev-charger', 'wind']::text[],
    true, 4, 'daily',
    ARRAY['north-america']::text[]
  )
) AS v(name, url, feed_url, source_type, content_type,
       equipment_categories, is_active, reliability_score, data_frequency, regions)
WHERE NOT EXISTS (
  SELECT 1 FROM market_data_sources m WHERE m.feed_url = v.feed_url
);

-- Re-activate any of the above that already existed but were disabled
UPDATE market_data_sources
SET is_active = true, updated_at = now()
WHERE feed_url IN (
  'https://www.eia.gov/rss/todayinenergy.xml',
  'https://www.nrel.gov/news/rss.xml',
  'https://www.pv-tech.org/feed/',
  'https://www.utilitydive.com/feeds/news/',
  'https://www.canarymedia.com/feed'
)
AND is_active = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES (run after migration to confirm)
-- ─────────────────────────────────────────────────────────────────────────────

-- Total active RSS sources (should be ~14 after dedup + 5 new = ~14-16)
-- SELECT COUNT(*) as total_active_rss
-- FROM market_data_sources
-- WHERE is_active = true AND source_type = 'rss_feed';

-- Confirm no duplicate feed_urls remain
-- SELECT feed_url, COUNT(*) as cnt
-- FROM market_data_sources
-- WHERE feed_url IS NOT NULL
-- GROUP BY feed_url
-- HAVING COUNT(*) > 1;

-- Confirm new price-focused sources are present
-- SELECT name, feed_url, reliability_score
-- FROM market_data_sources
-- WHERE name IN ('EIA Today in Energy', 'NREL News', 'PV Tech', 'Utility Dive', 'Canary Media')
-- ORDER BY name;
