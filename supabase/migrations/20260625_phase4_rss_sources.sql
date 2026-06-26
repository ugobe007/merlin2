-- =============================================================================
-- PHASE 4 — RSS Sources + Opportunity Assessment Column
-- Migration 20260625_phase4_rss_sources.sql
-- =============================================================================
--
-- 1. Seeds Phase 4 RSS/ATOM sources into market_data_sources:
--      SAM.gov federal solicitations, FERC eLibrary, NYSERDA, CA Energy
--      Commission, DOE LPO, Microgrid Knowledge, C&I solar / VPP Google feeds
--
-- 2. Adds `opportunity_assessment` JSONB column to opportunities so the
--    opportunityAssessmentService can persist structured AI assessments.
-- =============================================================================

-- ─── 1. opportunity_assessment column ────────────────────────────────────────

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS opportunity_assessment JSONB;

COMMENT ON COLUMN opportunities.opportunity_assessment IS
  'Structured AI-generated assessment: bess_type, size_estimate, grid_driver, '
  'co_equipment, alternative_power, urgency_tier, talking_points, assessed_at. '
  'Generated on-demand by opportunityAssessmentService.ts.';

CREATE INDEX IF NOT EXISTS idx_opportunities_has_assessment
  ON opportunities ((opportunity_assessment IS NOT NULL));

-- ─── 2. Phase 4 RSS sources ───────────────────────────────────────────────────

INSERT INTO market_data_sources
  (name, url, feed_url, source_type, equipment_categories, content_type,
   regions, reliability_score, data_frequency, is_active, scrape_config)
VALUES

  -- ── Direct federal procurement (SAM.gov ATOM) ──
  (
    'SAM.gov — BESS & Backup Power Solicitations',
    'https://sam.gov',
    'https://sam.gov/api/prod/opportunities/v2/search?limit=100&ptype=o,k,r&keywords=battery+storage+OR+energy+storage+OR+backup+power+OR+microgrid&status=active&dformat=rss',
    'rss_feed', ARRAY['bess','generators'], 'policy', ARRAY['US'],
    5, 'daily', true,
    '{"priority": "critical", "signal_boost": ["bess_procurement","generator_procurement","rfq"], "note": "Federal solicitations — DoD, VA, GSA"}'::jsonb
  ),

  -- ── FERC eLibrary interconnection & storage news ──
  (
    'FERC eLibrary — Interconnection & Storage',
    'https://www.ferc.gov',
    'https://www.ferc.gov/rss-feeds/news-releases',
    'rss_feed', ARRAY['bess','solar','generators','transformers'], 'policy', ARRAY['US'],
    5, 'daily', true,
    '{"priority": "critical", "signal_boost": ["interconnection_application","bess_procurement","ferc"]}'::jsonb
  ),

  -- ── NYSERDA — NY state grant awards signal funded projects ──
  (
    'NYSERDA — Clean Energy Awards',
    'https://www.nyserda.ny.gov',
    'https://www.nyserda.ny.gov/rss/news',
    'rss_feed', ARRAY['bess','solar'], 'policy', ARRAY['US'],
    4, 'weekly', true,
    '{"priority": "high", "signal_boost": ["bess_procurement","solar_procurement","c_and_i_solar","funding"], "regions": ["NY"]}'::jsonb
  ),

  -- ── CA Energy Commission ──
  (
    'CA Energy Commission — News & Awards',
    'https://www.energy.ca.gov',
    'https://www.energy.ca.gov/rss/news.xml',
    'rss_feed', ARRAY['bess','solar'], 'policy', ARRAY['US'],
    4, 'weekly', true,
    '{"priority": "high", "signal_boost": ["bess_procurement","solar_procurement","interconnection_application","funding"], "regions": ["CA"]}'::jsonb
  ),

  -- ── Microgrid Knowledge — project RFPs + awards ──
  (
    'Microgrid Knowledge',
    'https://microgridknowledge.com',
    'https://microgridknowledge.com/feed/',
    'rss_feed', ARRAY['bess','solar','generators'], 'news', ARRAY['US','global'],
    4, 'daily', true,
    '{"priority": "high", "signal_boost": ["microgrid_procurement","bess_procurement","interconnection_application"]}'::jsonb
  ),

  -- ── Google News: Microgrid RFP ──
  (
    'Google News — Microgrid RFP Procurement',
    'https://news.google.com',
    'https://news.google.com/rss/search?q=(%22microgrid%22+OR+%22distributed+energy%22+OR+%22DER%22)+(%22RFP%22+OR+%22RFQ%22+OR+%22procurement%22+OR+%22project+award%22+OR+%22bid%22)&hl=en-US&gl=US&ceid=US:en',
    'rss_feed', ARRAY['bess','solar','generators'], 'news', ARRAY['US'],
    3, 'daily', true,
    '{"priority": "high", "signal_boost": ["microgrid_procurement","bess_procurement","rfq"]}'::jsonb
  ),

  -- ── Google News: C&I Solar Behind-the-Meter ──
  (
    'Google News — C&I Solar Behind-the-Meter',
    'https://news.google.com',
    'https://news.google.com/rss/search?q=(%22commercial+solar%22+OR+%22C%26I+solar%22+OR+%22behind-the-meter+solar%22+OR+%22on-site+solar%22+OR+%22corporate+PPA%22)+(%22installation%22+OR+%22project%22+OR+%22awarded%22+OR+%22procurement%22)&hl=en-US&gl=US&ceid=US:en',
    'rss_feed', ARRAY['solar','bess'], 'news', ARRAY['US'],
    3, 'daily', true,
    '{"priority": "high", "signal_boost": ["c_and_i_solar","solar_procurement","bess_procurement"]}'::jsonb
  ),

  -- ── Google News: Virtual Power Plant / Demand Response ──
  (
    'Google News — Virtual Power Plant Demand Response',
    'https://news.google.com',
    'https://news.google.com/rss/search?q=(%22virtual+power+plant%22+OR+%22VPP%22+OR+%22demand+response%22+OR+%22grid+services%22)+(%22commercial%22+OR+%22industrial%22+OR+%22battery+storage%22+OR+%22enrollment%22)&hl=en-US&gl=US&ceid=US:en',
    'rss_feed', ARRAY['bess'], 'news', ARRAY['US'],
    3, 'daily', true,
    '{"priority": "medium", "signal_boost": ["virtual_power_plant","bess_procurement","energy_project"]}'::jsonb
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
-- SELECT name, equipment_categories, reliability_score
-- FROM market_data_sources
-- WHERE scrape_config->>'priority' = 'critical'
-- ORDER BY reliability_score DESC;
