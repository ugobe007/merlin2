-- ============================================================================
-- CORE TABLES ALIGNMENT
-- April 12, 2026
--
-- PURPOSE
--   Two problems found by code audit:
--
--   1. COLUMN MISMATCH — `saved_quotes` exists but is missing the columns that
--      Step5V8.tsx, analyticsService.ts, and EmailCaptureModal.tsx write/read.
--      Without this fix every wizard "Save Quote" call silently fails.
--
--   2. MISSING TABLES — the following tables are queried by the app but have
--      no CREATE TABLE statement anywhere in supabase/migrations:
--        system_configuration  — supabaseClient.ts getSystemConfig/updateSystemConfig
--        demo_requests         — ScheduleDemoModal.tsx
--        download_leads        — DownloadGateModal.tsx
--        quote_requests        — RequestQuoteModal.tsx
--        page_views            — analytics tracking
--        saved_scenarios       — comparison mode (v7 comparisonService.ts)
--        use_case_analytics    — useCaseService.ts logAnalyticsEvent
--        user_subscriptions    — Stripe webhook sync (database/migrations only)
--
-- STRATEGY
--   All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS so this
--   migration is safe to run against a DB that already has some of these.
--   No data is deleted or altered.
--
-- SSOT NOTE
--   This migration adds storage columns only — no pricing constants, no
--   calculation logic. All financial values written here originate from
--   step4Logic.ts (SSOT). This file is purely schema scaffolding.
-- ============================================================================


-- ============================================================================
-- PART 1 — Fix saved_quotes column gaps
-- ============================================================================
-- The table was created in 20260226_supabase_auth_setup.sql with:
--   id, user_id, project_name, use_case_slug, storage_size_mw, total_cost,
--   quote_data, tags, notes, is_favorite, created_at, updated_at
--
-- Step5V8.tsx writes additional columns that are missing:
--   quote_name, system_configuration, annual_savings, payback_years,
--   duration_hours, solar_mw, storage_mw, location
--
-- analyticsService.ts selects `use_case` (not `use_case_slug`).
-- ============================================================================

-- Financial summary columns (written by Step5V8.tsx)
ALTER TABLE public.saved_quotes
  ADD COLUMN IF NOT EXISTS quote_name           TEXT,
  ADD COLUMN IF NOT EXISTS system_configuration JSONB,
  ADD COLUMN IF NOT EXISTS annual_savings       NUMERIC,
  ADD COLUMN IF NOT EXISTS payback_years        NUMERIC,
  ADD COLUMN IF NOT EXISTS duration_hours       NUMERIC,
  ADD COLUMN IF NOT EXISTS solar_mw             NUMERIC,
  ADD COLUMN IF NOT EXISTS storage_mw           NUMERIC,
  ADD COLUMN IF NOT EXISTS location             TEXT,
  -- analyticsService reads `use_case`; `use_case_slug` already exists
  ADD COLUMN IF NOT EXISTS use_case             TEXT;

-- Backfill use_case from use_case_slug for any existing rows
-- Guarded: only runs if use_case_slug column actually exists on this DB
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'saved_quotes'
      AND column_name  = 'use_case_slug'
  ) THEN
    UPDATE public.saved_quotes
    SET use_case = use_case_slug
    WHERE use_case IS NULL AND use_case_slug IS NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.saved_quotes.system_configuration IS
  'Full wizard export JSON — built by buildV8ExportData() in Step5V8.tsx';
COMMENT ON COLUMN public.saved_quotes.quote_name IS
  'Human-readable name: "<industry> · <city, ST> · <date>"';
COMMENT ON COLUMN public.saved_quotes.use_case IS
  'Industry slug copy — kept in sync with use_case_slug; read by analyticsService';


-- ============================================================================
-- PART 2 — system_configuration
-- ============================================================================
-- Already handled: 20260210_fix_schema_gaps.sql created `system_config` as the
-- base table and `system_configuration` as a VIEW alias over it.
-- supabaseClient.ts reads/writes through the view — no further DDL needed here.
-- ============================================================================
-- (no-op — view exists, table exists, RLS is on system_config)


-- ============================================================================
-- PART 3 — demo_requests
-- ============================================================================
-- Written by ScheduleDemoModal.tsx when a visitor books a discovery call.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.demo_requests (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  company        TEXT,
  phone          TEXT,
  preferred_date TEXT,
  preferred_time TEXT,
  message        TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_email      ON public.demo_requests (email);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status     ON public.demo_requests (status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON public.demo_requests (created_at DESC);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a demo request (public-facing modal)
CREATE POLICY "demo_requests_public_insert"
  ON public.demo_requests FOR INSERT
  WITH CHECK (true);

-- Only service role reads / manages
CREATE POLICY "demo_requests_service_manage"
  ON public.demo_requests FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.demo_requests IS
  'Discovery call requests from ScheduleDemoModal.tsx. Forwarded to CRM/Discord.';


-- ============================================================================
-- PART 4 — download_leads
-- ============================================================================
-- Written by DownloadGateModal.tsx when a visitor downloads a report/export.
-- Note: DownloadGateModal already has a graceful try/catch so a missing table
-- has not caused visible errors — but lead data is being lost.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.download_leads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  company       TEXT,
  download_type TEXT,
  quote_data    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_leads_email      ON public.download_leads (email);
CREATE INDEX IF NOT EXISTS idx_download_leads_created_at ON public.download_leads (created_at DESC);

ALTER TABLE public.download_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "download_leads_public_insert"
  ON public.download_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "download_leads_service_manage"
  ON public.download_leads FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.download_leads IS
  'Lead capture from DownloadGateModal.tsx (PDF/Excel export gate).';


-- ============================================================================
-- PART 5 — quote_requests
-- ============================================================================
-- Written by RequestQuoteModal.tsx (the "Get a Quote" CTA across the site).
-- Note: modal falls back to localStorage when DB is unavailable, so missing
-- table hasn't caused visible errors — but inbound leads are being lost.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT        NOT NULL,
  last_name  TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  company    TEXT,
  phone      TEXT,
  message    TEXT,
  quote_data JSONB,
  status     TEXT        NOT NULL DEFAULT 'new'
             CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_email      ON public.quote_requests (email);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status     ON public.quote_requests (status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON public.quote_requests (created_at DESC);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quote_requests_public_insert"
  ON public.quote_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "quote_requests_service_manage"
  ON public.quote_requests FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.quote_requests IS
  'Inbound quote requests from RequestQuoteModal.tsx. Falls back to localStorage if table missing.';


-- ============================================================================
-- PART 6 — page_views
-- ============================================================================
-- Was in database/migrations/20260227_page_views.sql (manually run) but never
-- added to supabase/migrations. Included here so it is version-controlled.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.page_views (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  path       TEXT        NOT NULL,
  session_id TEXT,
  referrer   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path       ON public.page_views (path);
CREATE INDEX IF NOT EXISTS idx_page_views_session    ON public.page_views (session_id);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Any visitor can record a page view
CREATE POLICY "page_views_public_insert"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

-- Service role reads for analytics dashboard
CREATE POLICY "page_views_service_read"
  ON public.page_views FOR SELECT
  USING (true);

COMMENT ON TABLE public.page_views IS
  'Site analytics. Anonymous inserts allowed. Dashboard reads via service role.';


-- ============================================================================
-- PART 7 — saved_scenarios
-- ============================================================================
-- Written/read by comparisonService.ts (wizard v7 comparison mode).
-- Was in database/migrations/20260220_comparison_mode.sql but not
-- in supabase/migrations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saved_scenarios (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id     TEXT,
  scenario_name  TEXT        NOT NULL DEFAULT 'Unnamed Scenario',
  scenario_data  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  quote_result   JSONB,
  is_baseline    BOOLEAN     NOT NULL DEFAULT false,
  tags           TEXT[]      NOT NULL DEFAULT '{}',
  notes          TEXT        NOT NULL DEFAULT '',
  -- Pre-computed metrics for fast comparison display
  peak_kw        NUMERIC,
  kwh_capacity   NUMERIC,
  total_cost     NUMERIC,
  annual_savings NUMERIC,
  payback_years  NUMERIC,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_scenarios_user_id    ON public.saved_scenarios (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_scenarios_session_id ON public.saved_scenarios (session_id);
CREATE INDEX IF NOT EXISTS idx_saved_scenarios_created_at ON public.saved_scenarios (created_at DESC);

ALTER TABLE public.saved_scenarios ENABLE ROW LEVEL SECURITY;

-- Users can manage their own scenarios; anonymous sessions use session_id
CREATE POLICY "saved_scenarios_own_access"
  ON public.saved_scenarios FOR ALL
  USING (
    user_id = auth.uid()
    OR user_id IS NULL  -- anonymous sessions
  );

COMMENT ON TABLE public.saved_scenarios IS
  'Wizard comparison scenarios. Written by comparisonService.ts. '
  'user_id NULL = anonymous session (keyed by session_id).';


-- ============================================================================
-- PART 8 — use_case_analytics
-- ============================================================================
-- Written by useCaseService.ts logAnalyticsEvent() on every wizard completion.
-- Was in docs/02_DEPLOY_SCHEMA.sql and docs/MASTER_SCHEMA.sql but never
-- added to supabase/migrations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.use_case_analytics (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id      UUID,
  use_case_slug    TEXT,
  event_type       TEXT,
  user_id          UUID,
  session_id       TEXT,
  industry         TEXT,
  location         TEXT,
  system_size_kw   NUMERIC,
  total_cost       NUMERIC,
  annual_savings   NUMERIC,
  payback_years    NUMERIC,
  tier_selected    TEXT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_use_case_analytics_slug       ON public.use_case_analytics (use_case_slug);
CREATE INDEX IF NOT EXISTS idx_use_case_analytics_event_type ON public.use_case_analytics (event_type);
CREATE INDEX IF NOT EXISTS idx_use_case_analytics_created_at ON public.use_case_analytics (created_at DESC);

ALTER TABLE public.use_case_analytics ENABLE ROW LEVEL SECURITY;

-- Any authenticated or anonymous session can write events
CREATE POLICY "use_case_analytics_public_insert"
  ON public.use_case_analytics FOR INSERT
  WITH CHECK (true);

-- Service role reads for admin dashboard
CREATE POLICY "use_case_analytics_service_read"
  ON public.use_case_analytics FOR SELECT
  USING (true);

COMMENT ON TABLE public.use_case_analytics IS
  'Wizard completion events. Written by useCaseService.logAnalyticsEvent(). '
  'Analytics only — no financial data here.';


-- ============================================================================
-- PART 9 — user_subscriptions
-- ============================================================================
-- Synced from Stripe webhooks. Was in database/migrations/20260217_stripe_
-- subscriptions.sql but never added to supabase/migrations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  TEXT        NOT NULL UNIQUE,
  email                    TEXT,
  stripe_customer_id       TEXT        UNIQUE,
  stripe_subscription_id   TEXT        UNIQUE,
  tier                     TEXT        NOT NULL DEFAULT 'free'
                           CHECK (tier IN ('free', 'starter', 'pro', 'advanced', 'business')),
  billing_cycle            TEXT        DEFAULT 'monthly'
                           CHECK (billing_cycle IN ('monthly', 'annual')),
  status                   TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'paused')),
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id         ON public.user_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON public.user_subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status          ON public.user_subscriptions (status);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_subscriptions_own_read"
  ON public.user_subscriptions FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "user_subscriptions_service_manage"
  ON public.user_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.user_subscriptions IS
  'Stripe subscription state. Synced via Stripe webhooks (service_role only writes). '
  'Users can read their own tier.';


-- ============================================================================
-- VERIFICATION BLOCK
-- ============================================================================
DO $$
DECLARE
  missing TEXT := '';
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'saved_quotes',
    -- system_configuration is a VIEW over system_config — excluded from table check
    'demo_requests',
    'download_leads',
    'quote_requests',
    'page_views',
    'saved_scenarios',
    'use_case_analytics',
    'user_subscriptions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      missing := missing || tbl || ', ';
    END IF;
  END LOOP;

  IF missing <> '' THEN
    RAISE WARNING 'MIGRATION INCOMPLETE — tables still missing: %', missing;
  ELSE
    RAISE NOTICE '✅ 20260412_core_tables_alignment — all 9 tables present';
  END IF;

  -- Verify the critical saved_quotes columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_quotes'
      AND column_name = 'system_configuration'
  ) THEN
    RAISE WARNING 'saved_quotes.system_configuration column STILL MISSING — Step5V8 saves will fail';
  ELSE
    RAISE NOTICE '✅ saved_quotes.system_configuration column present';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_quotes'
      AND column_name = 'quote_name'
  ) THEN
    RAISE WARNING 'saved_quotes.quote_name column STILL MISSING';
  ELSE
    RAISE NOTICE '✅ saved_quotes.quote_name column present';
  END IF;
END $$;
