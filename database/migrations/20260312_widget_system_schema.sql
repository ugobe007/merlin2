-- ============================================================================
-- Widget System Database Schema
-- Created: March 12, 2026
-- Purpose: Support embeddable widget B2B2C distribution model
-- ============================================================================

-- PART 1: WIDGET PARTNERS TABLE
-- Stores partner account info, API keys, tier, customization, billing
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.widget_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Info
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL UNIQUE,
  phone TEXT,
  website TEXT,
  
  -- Tier & Access
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- API Authentication
  api_key TEXT NOT NULL UNIQUE,
  api_key_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  api_key_last_used TIMESTAMPTZ,
  
  -- Usage Tracking
  monthly_quote_limit INTEGER NOT NULL DEFAULT 100,
  current_month_quotes INTEGER NOT NULL DEFAULT 0,
  total_quotes_generated INTEGER NOT NULL DEFAULT 0,
  
  -- Widget Customization
  primary_color TEXT DEFAULT '#3ecf8e',
  logo_url TEXT,
  white_label BOOLEAN DEFAULT FALSE,
  hide_attribution BOOLEAN DEFAULT FALSE,
  
  -- Billing Integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Index for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_widget_partners_api_key ON public.widget_partners(api_key);
CREATE INDEX IF NOT EXISTS idx_widget_partners_tier ON public.widget_partners(tier);
CREATE INDEX IF NOT EXISTS idx_widget_partners_status ON public.widget_partners(status);
CREATE INDEX IF NOT EXISTS idx_widget_partners_email ON public.widget_partners(contact_email);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_widget_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS widget_partners_updated_at ON public.widget_partners;
CREATE TRIGGER widget_partners_updated_at
  BEFORE UPDATE ON public.widget_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_partners_updated_at();

-- Comments
COMMENT ON TABLE public.widget_partners IS 'Partner accounts for embeddable Merlin widget (B2B2C distribution)';
COMMENT ON COLUMN public.widget_partners.tier IS 'Free (100 quotes/mo), Pro ($99/mo, 500 quotes), Enterprise ($499/mo, unlimited)';
COMMENT ON COLUMN public.widget_partners.api_key IS 'Format: pk_live_xxxxx or pk_test_xxxxx (Stripe-style)';
COMMENT ON COLUMN public.widget_partners.monthly_quote_limit IS 'Enforced per tier: Free=100, Pro=500, Enterprise=999999';
COMMENT ON COLUMN public.widget_partners.white_label IS 'Enterprise only: Hide Merlin branding completely';
COMMENT ON COLUMN public.widget_partners.hide_attribution IS 'Pro+: Hide "Powered by Merlin" badge';


-- ============================================================================
-- PART 2: WIDGET USAGE TABLE
-- Tracks every quote request, event, and partner activity
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.widget_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Partner Reference
  partner_id UUID NOT NULL REFERENCES public.widget_partners(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'widget_loaded',
    'quote_requested',
    'quote_generated',
    'quote_failed',
    'error'
  )),
  
  -- Industry & Location
  industry TEXT,
  location_state TEXT,
  location_zip TEXT,
  
  -- Quote Data (JSONB for flexibility)
  quote_input JSONB,
  quote_output JSONB,
  
  -- Request Metadata
  referrer_url TEXT,
  user_agent TEXT,
  ip_address INET,
  
  -- Error Tracking
  error_message TEXT,
  error_code TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_widget_usage_partner_id ON public.widget_usage(partner_id);
CREATE INDEX IF NOT EXISTS idx_widget_usage_event_type ON public.widget_usage(event_type);
CREATE INDEX IF NOT EXISTS idx_widget_usage_industry ON public.widget_usage(industry);
CREATE INDEX IF NOT EXISTS idx_widget_usage_created_at ON public.widget_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_widget_usage_partner_created ON public.widget_usage(partner_id, created_at DESC);

-- Composite index for quote_generated events (for analytics)
-- Note: Removed DATE_TRUNC from index - monthly aggregation handled by materialized view
CREATE INDEX IF NOT EXISTS idx_widget_usage_quotes ON public.widget_usage(partner_id, created_at DESC)
  WHERE event_type = 'quote_generated';

-- Comments
COMMENT ON TABLE public.widget_usage IS 'Event tracking for all widget activity (quotes, loads, errors)';
COMMENT ON COLUMN public.widget_usage.quote_input IS 'Full input parameters from partner site (JSONB)';
COMMENT ON COLUMN public.widget_usage.quote_output IS 'Full TrueQuote result including financials (JSONB)';
COMMENT ON COLUMN public.widget_usage.referrer_url IS 'Partner site URL where widget is embedded';


-- ============================================================================
-- PART 3: MATERIALIZED VIEW - MONTHLY USAGE STATS
-- Pre-aggregated stats for fast dashboard loading
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.widget_monthly_usage AS
SELECT
  partner_id,
  DATE_TRUNC('month', created_at) AS month,
  
  -- Event Counts
  COUNT(*) FILTER (WHERE event_type = 'widget_loaded') AS widget_loads,
  COUNT(*) FILTER (WHERE event_type = 'quote_generated') AS quotes_generated,
  COUNT(*) FILTER (WHERE event_type = 'quote_failed') AS quotes_failed,
  COUNT(*) FILTER (WHERE event_type = 'error') AS errors,
  
  -- Conversion Rate
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE event_type = 'quote_generated') / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'widget_loaded'), 0),
    2
  ) AS conversion_rate_pct,
  
  -- Industry Breakdown (top 3)
  ARRAY_AGG(DISTINCT industry ORDER BY industry) FILTER (WHERE industry IS NOT NULL) AS industries_used,
  
  -- Timestamp
  NOW() AS refreshed_at
  
FROM public.widget_usage
GROUP BY partner_id, DATE_TRUNC('month', created_at);

-- Initial refresh to populate the view (skip if already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'widget_monthly_usage') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.widget_monthly_usage;
  END IF;
END $$;

-- Index for fast partner lookups (required for CONCURRENT refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_monthly_usage_partner_month 
  ON public.widget_monthly_usage(partner_id, month);

-- Comments
COMMENT ON MATERIALIZED VIEW public.widget_monthly_usage IS 'Pre-aggregated monthly stats per partner (refresh daily via cron)';

-- Refresh function (call this daily)
CREATE OR REPLACE FUNCTION refresh_widget_monthly_usage()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.widget_monthly_usage;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 4: HELPER FUNCTIONS
-- Utility functions for common operations
-- ============================================================================

-- Generate API Key (Stripe-style format)
CREATE OR REPLACE FUNCTION generate_widget_api_key(p_tier TEXT DEFAULT 'free')
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  random_part TEXT;
BEGIN
  -- Prefix based on tier (test keys for dev, live for production)
  prefix := CASE
    WHEN p_tier = 'test' THEN 'pk_test_'
    ELSE 'pk_live_'
  END;
  
  -- Generate 32-character random string
  random_part := encode(gen_random_bytes(24), 'base64');
  random_part := regexp_replace(random_part, '[^a-zA-Z0-9]', '', 'g');
  random_part := substring(random_part, 1, 32);
  
  RETURN prefix || random_part;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_widget_api_key IS 'Generate Stripe-style API key (pk_live_xxx or pk_test_xxx)';


-- Reset Monthly Quote Counter (call this on 1st of each month)
CREATE OR REPLACE FUNCTION reset_widget_monthly_quotes()
RETURNS void AS $$
BEGIN
  UPDATE public.widget_partners
  SET current_month_quotes = 0
  WHERE status = 'active';
  
  RAISE NOTICE 'Reset monthly quote counters for all active partners';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_widget_monthly_quotes IS 'Reset current_month_quotes to 0 for all partners (monthly cron job)';


-- Validate API Key & Check Quota
CREATE OR REPLACE FUNCTION validate_widget_api_key(p_api_key TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  partner_id UUID,
  tier TEXT,
  quotes_remaining INTEGER,
  message TEXT
) AS $$
DECLARE
  v_partner RECORD;
BEGIN
  -- Look up partner by API key
  SELECT * INTO v_partner
  FROM public.widget_partners
  WHERE api_key = p_api_key;
  
  -- Check if key exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 0, 'Invalid API key';
    RETURN;
  END IF;
  
  -- Check if partner is active
  IF v_partner.status != 'active' THEN
    RETURN QUERY SELECT FALSE, v_partner.id, v_partner.tier, 0, 'Partner account is ' || v_partner.status;
    RETURN;
  END IF;
  
  -- Check quota (enterprise = unlimited)
  IF v_partner.tier = 'enterprise' THEN
    RETURN QUERY SELECT TRUE, v_partner.id, v_partner.tier, 999999, 'Valid';
    RETURN;
  END IF;
  
  -- Check if monthly limit reached
  IF v_partner.current_month_quotes >= v_partner.monthly_quote_limit THEN
    RETURN QUERY SELECT FALSE, v_partner.id, v_partner.tier, 0, 'Monthly quote limit reached';
    RETURN;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT 
    TRUE,
    v_partner.id,
    v_partner.tier,
    v_partner.monthly_quote_limit - v_partner.current_month_quotes,
    'Valid';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_widget_api_key IS 'Validate API key and check quota in single query (used by API endpoint)';


-- ============================================================================
-- PART 5: ROW LEVEL SECURITY (RLS)
-- Partners can only see their own data
-- ============================================================================

-- Enable RLS
ALTER TABLE public.widget_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can read their own account
DROP POLICY IF EXISTS widget_partners_read_own ON public.widget_partners;
CREATE POLICY widget_partners_read_own ON public.widget_partners
  FOR SELECT
  USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

-- Policy: Partners can update their own account (not tier or billing)
DROP POLICY IF EXISTS widget_partners_update_own ON public.widget_partners;
CREATE POLICY widget_partners_update_own ON public.widget_partners
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    tier = (SELECT tier FROM public.widget_partners WHERE id = auth.uid()) AND
    monthly_quote_limit = (SELECT monthly_quote_limit FROM public.widget_partners WHERE id = auth.uid())
  );

-- Policy: Partners can read their own usage data
DROP POLICY IF EXISTS widget_usage_read_own ON public.widget_usage;
CREATE POLICY widget_usage_read_own ON public.widget_usage
  FOR SELECT
  USING (
    partner_id IN (SELECT id FROM public.widget_partners WHERE id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policy: Widget API can insert usage events (service role)
DROP POLICY IF EXISTS widget_usage_insert_service ON public.widget_usage;
CREATE POLICY widget_usage_insert_service ON public.widget_usage
  FOR INSERT
  WITH CHECK (true);  -- Service role bypass via auth.uid() check in API


-- ============================================================================
-- PART 6: SEED DATA - TEST PARTNER ACCOUNTS
-- Create demo accounts for testing (pk_test_xxx keys)
-- ============================================================================

-- Test Partner 1: Free Tier Solar Installer
INSERT INTO public.widget_partners (
  company_name, contact_name, contact_email, website, tier,
  api_key, monthly_quote_limit, primary_color, onboarding_completed
) VALUES (
  'Sunshine Solar Installers',
  'Demo User',
  'demo@sunshinesolar.com',
  'https://sunshinesolar.com',
  'free',
  'pk_test_free_demo_12345678901234567890',
  100,
  '#f59e0b',  -- Orange
  TRUE
) ON CONFLICT (contact_email) DO NOTHING;

-- Test Partner 2: Pro Tier Hotel Energy Consultant
INSERT INTO public.widget_partners (
  company_name, contact_name, contact_email, website, tier,
  api_key, monthly_quote_limit, primary_color, hide_attribution, onboarding_completed
) VALUES (
  'Hotel Energy Solutions Pro',
  'Pro Demo User',
  'demo@hotelenergy.com',
  'https://hotelenergy.com',
  'pro',
  'pk_test_pro_demo_98765432109876543210',
  500,
  '#10b981',  -- Green
  TRUE,
  TRUE
) ON CONFLICT (contact_email) DO NOTHING;

-- Test Partner 3: Enterprise Tier Car Wash Association
INSERT INTO public.widget_partners (
  company_name, contact_name, contact_email, website, tier,
  api_key, monthly_quote_limit, primary_color, white_label, hide_attribution, onboarding_completed
) VALUES (
  'National Car Wash Association',
  'Enterprise Demo User',
  'demo@carwashassoc.com',
  'https://carwashassoc.com',
  'enterprise',
  'pk_test_enterprise_demo_11223344556677889900',
  999999,
  '#6366f1',  -- Indigo
  TRUE,
  TRUE,
  TRUE
) ON CONFLICT (contact_email) DO NOTHING;


-- ============================================================================
-- PART 7: VERIFICATION QUERIES
-- Run these to verify schema was created correctly
-- ============================================================================

-- Check tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_partners') THEN
    RAISE NOTICE '✓ widget_partners table created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_usage') THEN
    RAISE NOTICE '✓ widget_usage table created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'widget_monthly_usage') THEN
    RAISE NOTICE '✓ widget_monthly_usage materialized view created';
  END IF;
END $$;

-- Show test partners
SELECT
  company_name,
  tier,
  api_key,
  monthly_quote_limit,
  current_month_quotes,
  status
FROM public.widget_partners
WHERE api_key LIKE 'pk_test_%'
ORDER BY tier;

-- Show available functions
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%widget%'
ORDER BY routine_name;


-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '
  ═══════════════════════════════════════════════════════════════════════
  ✓ Widget System Database Schema Created Successfully
  ═══════════════════════════════════════════════════════════════════════
  
  TABLES CREATED:
  • widget_partners        (Partner accounts, API keys, tiers, billing)
  • widget_usage           (Event tracking for all widget activity)
  
  VIEWS CREATED:
  • widget_monthly_usage   (Materialized view with aggregated stats)
  
  FUNCTIONS CREATED:
  • generate_widget_api_key()      Generate pk_live_xxx keys
  • reset_widget_monthly_quotes()  Reset quotas monthly
  • validate_widget_api_key()      Single-query validation
  • refresh_widget_monthly_usage() Refresh materialized view
  
  TEST PARTNERS SEEDED:
  • Free Tier:       pk_test_free_demo_12345678901234567890
  • Pro Tier:        pk_test_pro_demo_98765432109876543210
  • Enterprise Tier: pk_test_enterprise_demo_11223344556677889900
  
  NEXT STEPS:
  1. Connect API endpoints to Supabase (validateApiKey, trackWidgetUsage)
  2. Build partner signup flow (auto-generate API keys)
  3. Create demo page at /widget with live embed
  4. Set up daily cron: REFRESH MATERIALIZED VIEW widget_monthly_usage
  5. Set up monthly cron: SELECT reset_widget_monthly_quotes()
  
  ═══════════════════════════════════════════════════════════════════════
  ';
END $$;
