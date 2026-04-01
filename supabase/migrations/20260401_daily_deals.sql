-- ============================================================
-- DAILY DEALS TABLE
-- ============================================================
-- Stores the output of agents/daily-deal.ts each day.
-- One row per (deal_date, industry_id) — upserted daily.
-- Used for:
--   • Historical record of daily deal cadence
--   • Analytics: which industries generate most interest
--   • Future: A/B test industry rotation vs. scraper-signal selection

CREATE TABLE IF NOT EXISTS daily_deals (
  id                  BIGSERIAL PRIMARY KEY,
  deal_date           DATE        NOT NULL,
  industry_id         TEXT        NOT NULL,   -- e.g. 'car-wash', 'hotel'
  industry_label      TEXT        NOT NULL,   -- e.g. 'Car Wash', 'Hotel'

  -- Quote financials (denormalized for easy querying)
  system_size_mw      NUMERIC(10, 3) NOT NULL,
  duration_hours      NUMERIC(5, 1)  NOT NULL,
  solar_mw            NUMERIC(10, 3) NOT NULL DEFAULT 0,
  zip_code            TEXT,
  gross_cost_dollars  BIGINT      NOT NULL,
  net_cost_dollars    BIGINT      NOT NULL,
  annual_savings      BIGINT      NOT NULL,
  payback_years       NUMERIC(5, 1)  NOT NULL,
  npv_25yr            BIGINT      NOT NULL,
  irr                 NUMERIC(6, 4),          -- decimal (e.g. 0.142 = 14.2%)

  -- Content
  tagline             TEXT,
  market_hook         TEXT,

  -- Discord tracking
  discord_message_id  TEXT,                   -- for linking back to the message
  posted_to_discord   BOOLEAN GENERATED ALWAYS AS (discord_message_id IS NOT NULL) STORED,

  -- Full quote JSON for debugging / replayability
  quote_json          JSONB,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (deal_date, industry_id)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS daily_deals_date_idx       ON daily_deals (deal_date DESC);
CREATE INDEX IF NOT EXISTS daily_deals_industry_idx   ON daily_deals (industry_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_daily_deals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS daily_deals_updated_at_trigger ON daily_deals;
CREATE TRIGGER daily_deals_updated_at_trigger
  BEFORE UPDATE ON daily_deals
  FOR EACH ROW EXECUTE FUNCTION update_daily_deals_updated_at();

-- RLS: allow service role full access, anon read-only for public analytics
ALTER TABLE daily_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON daily_deals
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "anon_read" ON daily_deals
  FOR SELECT USING (true);

COMMENT ON TABLE daily_deals IS
  'One row per day per industry. Written by agents/daily-deal.ts. '
  'Contains the TrueQuote™ output for the featured industry deal posted to Discord.';
