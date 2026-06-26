-- =============================================================================
-- VENDOR LEAD PIPELINE — Migration 20260625
-- =============================================================================
--
-- Adds the lead routing infrastructure for BESS, solar, and generator vendors:
--
--   vendor_leads          — scored + routed opportunity → vendor matches
--   vendor_lead_events    — audit log of every notification / view / contact
--
-- Also seeds new market_data_sources for:
--   Phase 2: BESS/solar/generator procurement news feeds
--   Phase 3: Building permit signals + FERC interconnection queue
-- =============================================================================

-- ─── vendor_leads ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendor_leads (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id      TEXT        NOT NULL,           -- FK → opportunities.id (text PK)
  vendor_id           UUID        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Per-category fit scores (0–100 each)
  bess_score          INTEGER     NOT NULL DEFAULT 0 CHECK (bess_score  BETWEEN 0 AND 100),
  solar_score         INTEGER     NOT NULL DEFAULT 0 CHECK (solar_score BETWEEN 0 AND 100),
  generator_score     INTEGER     NOT NULL DEFAULT 0 CHECK (generator_score BETWEEN 0 AND 100),
  overall_score       INTEGER     GENERATED ALWAYS AS (
                        GREATEST(bess_score, solar_score, generator_score)
                      ) STORED,

  -- Lead metadata denormalised from opportunity for fast queries
  lead_category       TEXT        NOT NULL CHECK (lead_category IN ('bess','solar','generator','multi')),
  signals             TEXT[]      NOT NULL DEFAULT '{}',
  industry            TEXT,
  company_name        TEXT,
  source_url          TEXT,
  description         TEXT,

  -- Routing lifecycle
  status              TEXT        NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new','sent','viewed','contacted','won','lost','archived')),
  notified_at         TIMESTAMPTZ,
  viewed_at           TIMESTAMPTZ,
  contacted_at        TIMESTAMPTZ,
  vendor_notes        TEXT,

  -- Audit
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (opportunity_id, vendor_id)
);

COMMENT ON TABLE vendor_leads IS
  'Scored matches between scraped opportunities and vendor accounts. '
  'One row per opportunity-vendor pair; prevents duplicate notifications.';

-- ─── vendor_lead_events (audit / timeline) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendor_lead_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID        NOT NULL REFERENCES vendor_leads(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL
                CHECK (event_type IN (
                  'created','notified','email_sent','webhook_sent',
                  'viewed','contacted','won','lost','archived','score_updated'
                )),
  actor       TEXT,                            -- 'system' | vendor user id
  metadata    JSONB       DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vendor_lead_events IS
  'Full audit trail for every transition in a vendor_lead lifecycle.';

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_vendor_leads_vendor_id
  ON vendor_leads (vendor_id, status, overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_leads_opportunity_id
  ON vendor_leads (opportunity_id);

CREATE INDEX IF NOT EXISTS idx_vendor_leads_category_score
  ON vendor_leads (lead_category, overall_score DESC)
  WHERE status != 'archived';

CREATE INDEX IF NOT EXISTS idx_vendor_lead_events_lead_id
  ON vendor_lead_events (lead_id, created_at DESC);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_vendor_leads_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vendor_leads_updated_at ON vendor_leads;
CREATE TRIGGER trg_vendor_leads_updated_at
  BEFORE UPDATE ON vendor_leads
  FOR EACH ROW EXECUTE FUNCTION update_vendor_leads_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- Vendors can only see their own leads.  Service role bypasses RLS for the
-- nightly lead-matcher agent (runs with SERVICE_ROLE_KEY).

ALTER TABLE vendor_leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_lead_events  ENABLE ROW LEVEL SECURITY;

-- Vendors see own leads
CREATE POLICY vendor_leads_vendor_read ON vendor_leads
  FOR SELECT
  USING (vendor_id = auth.uid());

-- Vendors can update status / notes on their own leads
CREATE POLICY vendor_leads_vendor_update ON vendor_leads
  FOR UPDATE
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- Vendors see own lead events
CREATE POLICY vendor_lead_events_vendor_read ON vendor_lead_events
  FOR SELECT
  USING (lead_id IN (SELECT id FROM vendor_leads WHERE vendor_id = auth.uid()));

-- ─── Add email column to vendors if missing ───────────────────────────────────
-- Needed for lead-notification emails (may already exist — IF NOT EXISTS guards)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'notification_email'
  ) THEN
    ALTER TABLE vendors ADD COLUMN notification_email TEXT;
    COMMENT ON COLUMN vendors.notification_email IS
      'Override email for lead notifications. Falls back to vendors.email when NULL.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'webhook_url'
  ) THEN
    ALTER TABLE vendors ADD COLUMN webhook_url TEXT;
    COMMENT ON COLUMN vendors.webhook_url IS
      'Optional webhook endpoint for real-time lead push (POST JSON).';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'lead_min_score'
  ) THEN
    ALTER TABLE vendors ADD COLUMN lead_min_score INTEGER NOT NULL DEFAULT 60;
    COMMENT ON COLUMN vendors.lead_min_score IS
      'Vendor-configurable minimum overall_score (0–100) to receive a lead notification.';
  END IF;
END;
$$;

-- =============================================================================
-- PHASE 2 — New RSS sources for BESS / Solar / Generator procurement signals
-- =============================================================================

-- Deduplicate market_data_sources by name (keep the newest row per name),
-- then enforce uniqueness so the ON CONFLICT clause below is valid.
DELETE FROM market_data_sources
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id
  FROM market_data_sources
  ORDER BY name, created_at DESC NULLS LAST
);

CREATE UNIQUE INDEX IF NOT EXISTS market_data_sources_name_unique
  ON market_data_sources (name);

INSERT INTO market_data_sources
  (name, url, feed_url, source_type, equipment_categories, content_type, regions,
   reliability_score, data_frequency, is_active, scrape_config)
VALUES
  -- BESS / Energy Storage
  -- reliability_score uses 1–5 scale (constraint: market_data_sources_reliability_score_check)
  -- mapping: 90–100 → 5, 80–89 → 4, 70–79 → 3
  (
    'Energy Storage News', 'https://www.energystoragenews.com',
    'https://www.energystoragenews.com/feed/',
    'rss_feed', ARRAY['bess','ems'], 'news', ARRAY['global'],
    4, 'daily', true, '{"priority": "high", "signal_boost": ["bess","energy_storage"]}'::jsonb
  ),
  (
    'Canary Media — Storage', 'https://www.canarymedia.com',
    'https://www.canarymedia.com/rss.xml',
    'rss_feed', ARRAY['bess','solar','wind'], 'news', ARRAY['US'],
    4, 'daily', true, '{"priority": "high", "signal_boost": ["bess","solar"]}'::jsonb
  ),
  (
    'Wood Mackenzie Energy Storage', 'https://www.woodmac.com',
    'https://www.woodmac.com/feed/topic/energy-storage/',
    'rss_feed', ARRAY['bess'], 'market_trends', ARRAY['global'],
    5, 'daily', true, '{"priority": "high", "signal_boost": ["bess","battery_storage"]}'::jsonb
  ),
  (
    'ESA — Energy Storage Association', 'https://energystorage.org',
    'https://energystorage.org/feed/',
    'rss_feed', ARRAY['bess','ems'], 'news', ARRAY['US'],
    4, 'weekly', true, '{"priority": "medium", "signal_boost": ["bess","energy_storage"]}'::jsonb
  ),
  (
    'BNEF Storage News', 'https://about.bnef.com',
    'https://about.bnef.com/blog/feed/',
    'rss_feed', ARRAY['bess','solar','wind'], 'market_trends', ARRAY['global'],
    4, 'daily', true, '{"priority": "high", "signal_boost": ["bess","battery"]}'::jsonb
  ),

  -- Solar procurement
  (
    'Solar Builder Magazine', 'https://solarbuildermag.com',
    'https://solarbuildermag.com/feed/',
    'rss_feed', ARRAY['solar','inverters'], 'news', ARRAY['US'],
    3, 'daily', true, '{"priority": "medium", "signal_boost": ["solar_project","rooftop_solar"]}'::jsonb
  ),
  (
    'Solar Power World', 'https://www.solarpowerworldonline.com',
    'https://www.solarpowerworldonline.com/feed/',
    'rss_feed', ARRAY['solar','inverters','bos'], 'news', ARRAY['US'],
    4, 'daily', true, '{"priority": "medium", "signal_boost": ["solar","ppa","procurement"]}'::jsonb
  ),
  (
    'North American Clean Energy', 'https://nacleanenergy.com',
    'https://nacleanenergy.com/feed/',
    'rss_feed', ARRAY['solar','wind','bess'], 'news', ARRAY['US','CA'],
    3, 'daily', true, '{"priority": "medium"}'::jsonb
  ),

  -- Generator / backup power procurement
  (
    'Power Mag — Generation', 'https://www.powermag.com',
    'https://www.powermag.com/feed/',
    'rss_feed', ARRAY['generators','transformers'], 'news', ARRAY['US','global'],
    4, 'daily', true, '{"priority": "medium", "signal_boost": ["generator","backup_power","standby"]}'::jsonb
  ),
  (
    'Diesel & Gas Turbine Worldwide', 'https://www.dieselgasturbine.com',
    'https://www.dieselgasturbine.com/feed/',
    'rss_feed', ARRAY['generators'], 'news', ARRAY['global'],
    3, 'weekly', true, '{"priority": "low", "signal_boost": ["generator","diesel","gas_turbine"]}'::jsonb
  ),
  (
    'Cummins News', 'https://www.cummins.com',
    'https://www.cummins.com/news/rss',
    'rss_feed', ARRAY['generators'], 'news', ARRAY['global'],
    4, 'weekly', true, '{"priority": "medium", "signal_boost": ["generator","power_generation"]}'::jsonb
  ),

  -- ==========================================================================
  -- PHASE 3 — Permit & interconnection signals
  -- ==========================================================================
  (
    'FERC eLibrary News', 'https://www.ferc.gov',
    'https://www.ferc.gov/rss-feeds/news-releases',
    'rss_feed', ARRAY['bess','solar','generators','transformers'], 'policy', ARRAY['US'],
    5, 'daily', true, '{"priority": "critical", "signal_boost": ["interconnection","ferc","rfp","procurement"]}'::jsonb
  ),
  (
    'EIA Today in Energy', 'https://www.eia.gov',
    'https://www.eia.gov/rss/todayinenergy.xml',
    'rss_feed', ARRAY['bess','solar','generators'], 'policy', ARRAY['US'],
    5, 'daily', true, '{"priority": "high", "signal_boost": ["energy_project","storage","utility_rate"]}'::jsonb
  ),
  (
    'DOE LPO Announcements', 'https://www.energy.gov',
    'https://www.energy.gov/lpo/feed',
    'rss_feed', ARRAY['bess','solar'], 'policy', ARRAY['US'],
    5, 'weekly', true, '{"priority": "high", "signal_boost": ["loan","grant","bess_procurement","solar_procurement","ira"]}'::jsonb
  ),
  (
    'Google News — BESS RFP RFQ', 'https://news.google.com',
    'https://news.google.com/rss/search?q=(%22battery+storage%22+OR+%22BESS%22)+(%22RFP%22+OR+%22RFQ%22+OR+%22procurement%22+OR+%22request+for+proposal%22)&hl=en-US&gl=US&ceid=US:en',
    'rss_feed', ARRAY['bess'], 'news', ARRAY['US'],
    3, 'daily', true, '{"priority": "critical", "signal_boost": ["bess_procurement","rfq","rfp"]}'::jsonb
  ),
  (
    'Google News — Solar Commercial RFP', 'https://news.google.com',
    'https://news.google.com/rss/search?q=(solar+OR+%22solar+PV%22)+(%22RFP%22+OR+%22RFQ%22+OR+%22commercial+solar%22+OR+%22rooftop+solar%22+procurement)&hl=en-US&gl=US&ceid=US:en',
    'rss_feed', ARRAY['solar'], 'news', ARRAY['US'],
    3, 'daily', true, '{"priority": "high", "signal_boost": ["solar_procurement","rfq"]}'::jsonb
  ),
  (
    'Google News — Commercial Building Permits Energy', 'https://news.google.com',
    'https://news.google.com/rss/search?q=(%22building+permit%22+OR+%22construction+permit%22)+(%22commercial%22+OR+%22industrial%22+OR+%22data+center%22+OR+%22warehouse%22+OR+%22manufacturing%22)&hl=en-US&gl=US&ceid=US:en',
    'rss_feed', ARRAY['bess','solar','generators'], 'news', ARRAY['US'],
    3, 'daily', true, '{"priority": "high", "signal_boost": ["permit_filed","construction"]}'::jsonb
  ),
  (
    'Google News — Grid Interconnection Application', 'https://news.google.com',
    'https://news.google.com/rss/search?q=(%22interconnection+application%22+OR+%22grid+interconnection%22+OR+%22interconnection+queue%22)+(%22storage%22+OR+%22solar%22+OR+%22microgrid%22)&hl=en-US&gl=US&ceid=US:en',
    'rss_feed', ARRAY['bess','solar'], 'news', ARRAY['US'],
    3, 'daily', true, '{"priority": "high", "signal_boost": ["interconnection_application","bess_procurement"]}'::jsonb
  )
ON CONFLICT (name) DO UPDATE SET
  feed_url         = EXCLUDED.feed_url,
  equipment_categories = EXCLUDED.equipment_categories,
  is_active        = true,
  scrape_config    = EXCLUDED.scrape_config,
  reliability_score = EXCLUDED.reliability_score;

-- =============================================================================
-- VERIFICATION QUERIES (run manually to confirm)
-- =============================================================================
-- SELECT COUNT(*) FROM vendor_leads;
-- SELECT COUNT(*) FROM market_data_sources WHERE is_active = true;
-- SELECT name, equipment_categories FROM market_data_sources ORDER BY reliability_score DESC;
