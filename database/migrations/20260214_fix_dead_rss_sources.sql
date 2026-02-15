-- ============================================================================
-- FIX DEAD RSS SOURCES + ADD WORKING ALTERNATIVES
-- Feb 14, 2026
-- ============================================================================
-- Three RSS sources have been failing consistently in the daily scraper:
-- 1. Canary Media (canarymedia.com/feed) - returns 403/404
-- 2. Utility Dive (utilitydive.com/feeds/news/) - returns 403
-- 3. Microgrid Knowledge (microgridknowledge.com/feed/) - returns 403
-- ============================================================================

BEGIN;

-- Deactivate dead RSS sources
UPDATE market_data_sources
SET is_active = false,
    last_fetch_status = 'permanently_failed',
    notes = 'Deactivated Feb 14, 2026 — RSS feed returns 403/404 consistently'
WHERE feed_url ILIKE '%canarymedia.com%'
   OR feed_url ILIKE '%utilitydive.com%'
   OR feed_url ILIKE '%microgridknowledge.com%';

-- Add working replacement RSS sources
-- These are all verified working as of Feb 2026

-- 1. Energy Storage News (Solar Media)
INSERT INTO market_data_sources (name, url, feed_url, source_type, equipment_categories, content_type, regions, reliability_score, data_frequency, is_active)
VALUES (
  'Energy Storage News RSS',
  'https://www.energy-storage.news',
  'https://www.energy-storage.news/feed/',
  'rss_feed',
  ARRAY['bess', 'solar', 'inverter', 'bms'],
  'news',
  ARRAY['global', 'north-america', 'europe'],
  4,
  'daily',
  true
) ON CONFLICT DO NOTHING;

-- 2. PV Magazine (Solar + Storage)
INSERT INTO market_data_sources (name, url, feed_url, source_type, equipment_categories, content_type, regions, reliability_score, data_frequency, is_active)
VALUES (
  'PV Magazine Global RSS',
  'https://www.pv-magazine.com',
  'https://www.pv-magazine.com/feed/',
  'rss_feed',
  ARRAY['solar', 'bess', 'inverter'],
  'news',
  ARRAY['global', 'north-america', 'europe'],
  4,
  'daily',
  true
) ON CONFLICT DO NOTHING;

-- 3. Greentech Media / Wood Mackenzie Clean Energy
INSERT INTO market_data_sources (name, url, feed_url, source_type, equipment_categories, content_type, regions, reliability_score, data_frequency, is_active)
VALUES (
  'CleanTechnica RSS',
  'https://cleantechnica.com',
  'https://cleantechnica.com/feed/',
  'rss_feed',
  ARRAY['solar', 'bess', 'ev-charger', 'wind'],
  'news',
  ARRAY['global', 'north-america'],
  3,
  'daily',
  true
) ON CONFLICT DO NOTHING;

-- 4. Electrek (EV + Energy Storage)
INSERT INTO market_data_sources (name, url, feed_url, source_type, equipment_categories, content_type, regions, reliability_score, data_frequency, is_active)
VALUES (
  'Electrek RSS',
  'https://electrek.co',
  'https://electrek.co/feed/',
  'rss_feed',
  ARRAY['ev-charger', 'bess', 'solar'],
  'news',
  ARRAY['global', 'north-america'],
  3,
  'daily',
  true
) ON CONFLICT DO NOTHING;

-- 5. Renewable Energy World
INSERT INTO market_data_sources (name, url, feed_url, source_type, equipment_categories, content_type, regions, reliability_score, data_frequency, is_active)
VALUES (
  'Renewable Energy World RSS',
  'https://www.renewableenergyworld.com',
  'https://www.renewableenergyworld.com/feed/',
  'rss_feed',
  ARRAY['solar', 'wind', 'bess', 'generator', 'microgrid'],
  'news',
  ARRAY['global', 'north-america'],
  3,
  'daily',
  true
) ON CONFLICT DO NOTHING;

-- 6. Solar Power World
INSERT INTO market_data_sources (name, url, feed_url, source_type, equipment_categories, content_type, regions, reliability_score, data_frequency, is_active)
VALUES (
  'Solar Power World RSS',
  'https://www.solarpowerworldonline.com',
  'https://www.solarpowerworldonline.com/feed/',
  'rss_feed',
  ARRAY['solar', 'inverter', 'bess'],
  'news',
  ARRAY['north-america'],
  3,
  'daily',
  true
) ON CONFLICT DO NOTHING;

COMMIT;

-- Verify results
SELECT name, feed_url, is_active, last_fetch_status
FROM market_data_sources
WHERE source_type = 'rss_feed'
ORDER BY is_active DESC, reliability_score DESC;
