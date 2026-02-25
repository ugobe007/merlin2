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
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO market_data_sources (
  name,
  url,
  feed_url,
  source_type,
  equipment_categories,
  is_active,
  reliability_score,
  data_freshness,
  regions,
  fetch_interval_hours
)
VALUES
  -- EIA Today in Energy: U.S. Energy Information Administration news feed.
  -- Frequently publishes $/MWh, $/kWh cost data and market price reports.
  (
    'EIA Today in Energy',
    'https://www.eia.gov/todayinenergy/',
    'https://www.eia.gov/rss/todayinenergy.xml',
    'rss_feed',
    ARRAY['bess', 'solar', 'wind', 'generator']::text[],
    true,
    0.95,
    'daily',
    ARRAY['north-america']::text[],
    24
  ),

  -- NREL News: National Renewable Energy Laboratory press releases.
  -- Publishes BESS cost benchmarks ($/kWh), solar $/W data from ATB reports.
  (
    'NREL News',
    'https://www.nrel.gov/news/',
    'https://www.nrel.gov/news/rss.xml',
    'rss_feed',
    ARRAY['bess', 'solar', 'wind', 'ev-charger', 'microgrid']::text[],
    true,
    0.95,
    'weekly',
    ARRAY['north-america']::text[],
    48
  ),

  -- PV Tech: Leading global solar industry publication.
  -- Articles frequently cite $/W module prices, installation costs.
  (
    'PV Tech',
    'https://www.pv-tech.org',
    'https://www.pv-tech.org/feed/',
    'rss_feed',
    ARRAY['solar', 'bess', 'inverter']::text[],
    true,
    0.88,
    'daily',
    ARRAY['global']::text[],
    12
  ),

  -- Utility Dive: Energy industry trade publication.
  -- Covers BESS contracts, solar PPAs with $/MWh and $/kWh data.
  (
    'Utility Dive',
    'https://www.utilitydive.com',
    'https://www.utilitydive.com/feeds/news/',
    'rss_feed',
    ARRAY['bess', 'solar', 'wind', 'microgrid']::text[],
    true,
    0.87,
    'daily',
    ARRAY['north-america']::text[],
    12
  ),

  -- Canary Media: Clean energy journalism with regular cost benchmarking.
  -- Strong coverage of BESS $/kWh trends and solar cost breakdowns.
  (
    'Canary Media',
    'https://www.canarymedia.com',
    'https://www.canarymedia.com/feed',
    'rss_feed',
    ARRAY['bess', 'solar', 'ev-charger', 'wind']::text[],
    true,
    0.82,
    'daily',
    ARRAY['north-america']::text[],
    12
  )
ON CONFLICT (feed_url)
  DO UPDATE SET
    is_active = true,
    reliability_score = EXCLUDED.reliability_score,
    updated_at = now()
  WHERE market_data_sources.is_active = false;

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
