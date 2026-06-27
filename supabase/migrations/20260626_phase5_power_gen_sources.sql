-- =============================================================================
-- PHASE 5 — Power Generation + Expanded BESS/Storage Sources
-- Migration 20260626_phase5_power_gen_sources.sql
-- =============================================================================
--
-- Adds 20 new market_data_sources:
--
--  BESS / Energy Storage (10):
--    energy-storage.news, ESS News, Battery Tech Online,
--    Utility Dive Storage, Power Engineering Energy Storage,
--    Solar Builder Energy Storage, Renewables Now,
--    MIT Energy Storage, Reuters Energy Storage, CleanTechnica
--
--  Power Generation (10):
--    Utility Dive Generation, Power Magazine, Power Engineering (main),
--    EIA Today in Energy, BIC Magazine Power Generation,
--    Clean Power Org, Reuters Energy General,
--    Interesting Engineering, Google News Gas Turbine/Peaker,
--    Google News CHP/Cogeneration
-- =============================================================================

INSERT INTO market_data_sources
  (name, url, feed_url, source_type, equipment_categories, content_type,
   regions, reliability_score, data_frequency, is_active, scrape_config)
VALUES

  -- ═══════════════════════════════════════════════════════════
  -- BESS / ENERGY STORAGE SOURCES
  -- ═══════════════════════════════════════════════════════════

  (
    'Energy Storage News',
    'https://www.energy-storage.news',
    'https://www.energy-storage.news/feed/',
    'rss_feed', ARRAY['bess','solar'], 'news', ARRAY['US','global'],
    4, 'daily', true,
    '{"priority": "high", "signal_boost": ["bess_procurement","energy_project","procurement_awarded","funding"], "note": "Dedicated energy storage trade publication"}'::jsonb
  ),

  (
    'ESS News — Energy Storage',
    'https://www.ess-news.com',
    'https://www.ess-news.com/feed/',
    'rss_feed', ARRAY['bess'], 'news', ARRAY['US','global'],
    4, 'daily', true,
    '{"priority": "high", "signal_boost": ["bess_procurement","energy_project","interconnection_application","procurement_awarded"]}'::jsonb
  ),

  (
    'Battery Tech Online',
    'https://www.batterytechonline.com',
    'https://www.batterytechonline.com/rss/',
    'rss_feed', ARRAY['bess'], 'news', ARRAY['US','global'],
    3, 'daily', true,
    '{"priority": "medium", "signal_boost": ["bess_procurement","energy_project","funding"]}'::jsonb
  ),

  (
    'Utility Dive — Energy Storage',
    'https://www.utilitydive.com/topic/storage',
    'https://www.utilitydive.com/feeds/topic/storage/',
    'rss_feed', ARRAY['bess','solar'], 'news', ARRAY['US'],
    5, 'daily', true,
    '{"priority": "critical", "signal_boost": ["bess_procurement","energy_project","interconnection_application","procurement_awarded","rfq"], "note": "Top-tier utility industry publication"}'::jsonb
  ),

  (
    'Power Engineering — Energy Storage',
    'https://www.power-eng.com/energy-storage',
    'https://www.power-eng.com/energy-storage/feed/',
    'rss_feed', ARRAY['bess','generators','power_generation'], 'news', ARRAY['US'],
    4, 'daily', true,
    '{"priority": "high", "signal_boost": ["bess_procurement","energy_project","power_generation","procurement_awarded"]}'::jsonb
  ),

  (
    'Solar Builder — Energy Storage',
    'https://solarbuildermag.com/energy-storage',
    'https://solarbuildermag.com/energy-storage/feed/',
    'rss_feed', ARRAY['bess','solar'], 'news', ARRAY['US'],
    3, 'daily', true,
    '{"priority": "medium", "signal_boost": ["bess_procurement","solar_procurement","c_and_i_solar","procurement_awarded"]}'::jsonb
  ),

  (
    'Renewables Now — Energy Storage',
    'https://renewablesnow.com',
    'https://renewablesnow.com/feed/',
    'rss_feed', ARRAY['bess','solar'], 'news', ARRAY['US','global'],
    3, 'daily', true,
    '{"priority": "medium", "signal_boost": ["bess_procurement","solar_procurement","energy_project","funding"]}'::jsonb
  ),

  (
    'MIT News — Energy Storage Research',
    'https://news.mit.edu/topic/energy-storage',
    'https://news.mit.edu/rss/topic/energy-storage',
    'rss_feed', ARRAY['bess','solar'], 'news', ARRAY['US'],
    3, 'weekly', true,
    '{"priority": "medium", "signal_boost": ["bess_procurement","energy_project","funding"], "note": "R&D signals, early procurement intent"}'::jsonb
  ),

  (
    'Reuters — Energy Storage',
    'https://www.reuters.com/business/energy',
    'https://news.google.com/rss/search?q=site:reuters.com+%22energy+storage%22+OR+%22battery+storage%22+(%22procurement%22+OR+%22contract%22+OR+%22project%22)&hl=en-US&gl=US&ceid=US:en',
    'rss_feed', ARRAY['bess','solar'], 'news', ARRAY['US','global'],
    5, 'daily', true,
    '{"priority": "critical", "signal_boost": ["bess_procurement","energy_project","procurement_awarded","funding"], "note": "Reuters via Google News proxy"}'::jsonb
  ),

  (
    'CleanTechnica',
    'https://cleantechnica.com',
    'https://cleantechnica.com/feed/',
    'rss_feed', ARRAY['bess','solar','generators'], 'news', ARRAY['US','global'],
    4, 'daily', true,
    '{"priority": "high", "signal_boost": ["bess_procurement","solar_procurement","c_and_i_solar","energy_project","virtual_power_plant"]}'::jsonb
  ),

  -- ═══════════════════════════════════════════════════════════
  -- POWER GENERATION SOURCES
  -- ═══════════════════════════════════════════════════════════

  (
    'Utility Dive — Power Generation',
    'https://www.utilitydive.com/topic/Generation',
    'https://www.utilitydive.com/feeds/topic/generation/',
    'rss_feed', ARRAY['generators','power_generation','bess'], 'news', ARRAY['US'],
    5, 'daily', true,
    '{"priority": "critical", "signal_boost": ["power_generation","generator_procurement","bess_procurement","interconnection_application","rfq"], "note": "Utility Dive generation — top-tier utility publication"}'::jsonb
  ),

  (
    'Power Magazine',
    'https://www.powermag.com',
    'https://www.powermag.com/feed/',
    'rss_feed', ARRAY['generators','power_generation','bess'], 'news', ARRAY['US','global'],
    4, 'daily', true,
    '{"priority": "high", "signal_boost": ["power_generation","generator_procurement","energy_project","procurement_awarded","interconnection_application"]}'::jsonb
  ),

  (
    'Power Engineering',
    'https://www.power-eng.com',
    'https://www.power-eng.com/feed/',
    'rss_feed', ARRAY['generators','power_generation','bess'], 'news', ARRAY['US','global'],
    4, 'daily', true,
    '{"priority": "high", "signal_boost": ["power_generation","generator_procurement","bess_procurement","energy_project","rfq"]}'::jsonb
  ),

  (
    'EIA Today in Energy',
    'https://www.eia.gov/todayinenergy',
    'https://www.eia.gov/rss/todayinenergy.xml',
    'rss_feed', ARRAY['bess','solar','generators','power_generation'], 'policy', ARRAY['US'],
    5, 'daily', true,
    '{"priority": "critical", "signal_boost": ["energy_project","power_generation","bess_procurement","interconnection_application","funding"], "note": "US Energy Information Administration — authoritative data"}'::jsonb
  ),

  (
    'BIC Magazine — Power Generation',
    'https://www.bicmagazine.com/topics/power-generation',
    'https://www.bicmagazine.com/feed/',
    'rss_feed', ARRAY['generators','power_generation'], 'news', ARRAY['US'],
    3, 'daily', true,
    '{"priority": "medium", "signal_boost": ["power_generation","generator_procurement","energy_project"]}'::jsonb
  ),

  (
    'Clean Power Org — News',
    'https://cleanpower.org/news',
    'https://cleanpower.org/feed/',
    'rss_feed', ARRAY['bess','solar','power_generation'], 'policy', ARRAY['US'],
    4, 'weekly', true,
    '{"priority": "high", "signal_boost": ["bess_procurement","solar_procurement","power_generation","interconnection_application","funding"], "note": "American Clean Power Association policy & project news"}'::jsonb
  ),

  (
    'Reuters — Energy General',
    'https://www.reuters.com/business/energy',
    'https://news.google.com/rss/search?q=site:reuters.com+(%22power+generation%22+OR+%22power+plant%22+OR+%22gas+turbine%22+OR+%22natural+gas+plant%22)+(%22procurement%22+OR+%22contract%22+OR+%22awarded%22+OR+%22bid%22)&hl=en-US&gl=US&ceid=US:en',
    'rss_feed', ARRAY['generators','power_generation'], 'news', ARRAY['US','global'],
    5, 'daily', true,
    '{"priority": "critical", "signal_boost": ["power_generation","generator_procurement","procurement_awarded","energy_project"], "note": "Reuters power generation via Google News proxy"}'::jsonb
  ),

  (
    'Interesting Engineering — Energy',
    'https://interestingengineering.com/news',
    'https://interestingengineering.com/feed',
    'rss_feed', ARRAY['bess','solar','power_generation'], 'news', ARRAY['US','global'],
    3, 'daily', true,
    '{"priority": "low", "signal_boost": ["bess_procurement","energy_project","power_generation","funding"]}'::jsonb
  ),

  (
    'Google News — Gas Turbine & Peaker Procurement',
    'https://news.google.com',
    'https://news.google.com/rss/search?q=(%22gas+turbine%22+OR+%22peaker+plant%22+OR+%22combustion+turbine%22+OR+%22combined+cycle%22+OR+%22CCGT%22+OR+%22OCGT%22)+(%22procurement%22+OR+%22RFP%22+OR+%22RFQ%22+OR+%22contract%22+OR+%22awarded%22+OR+%22bid%22)&hl=en-US&gl=US&ceid=US:en',
    'rss_feed', ARRAY['generators','power_generation'], 'news', ARRAY['US'],
    3, 'daily', true,
    '{"priority": "high", "signal_boost": ["power_generation","generator_procurement","rfq","procurement_awarded"]}'::jsonb
  ),

  (
    'Google News — CHP & Cogeneration Projects',
    'https://news.google.com',
    'https://news.google.com/rss/search?q=(%22combined+heat+and+power%22+OR+%22cogeneration%22+OR+%22CHP+project%22+OR+%22district+energy%22+OR+%22thermal+plant%22)+(%22procurement%22+OR+%22RFP%22+OR+%22project%22+OR+%22installation%22+OR+%22awarded%22)&hl=en-US&gl=US&ceid=US:en',
    'rss_feed', ARRAY['generators','power_generation'], 'news', ARRAY['US'],
    3, 'daily', true,
    '{"priority": "high", "signal_boost": ["power_generation","generator_procurement","energy_project","rfq"]}'::jsonb
  )

ON CONFLICT (name) DO UPDATE SET
  feed_url              = EXCLUDED.feed_url,
  equipment_categories  = EXCLUDED.equipment_categories,
  is_active             = true,
  scrape_config         = EXCLUDED.scrape_config,
  reliability_score     = EXCLUDED.reliability_score;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- SELECT name, equipment_categories, source_type
-- FROM market_data_sources
-- WHERE 'power_generation' = ANY(equipment_categories)
-- ORDER BY reliability_score DESC;
--
-- SELECT COUNT(*) FROM market_data_sources WHERE is_active = true;
