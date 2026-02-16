-- ============================================================================
-- MERLIN DATABASE SCHEMA GAP FIX
-- Date: 2026-02-10
-- Purpose: Add missing columns, tables, and RPC functions to align Supabase
--          schema with TypeScript code expectations.
-- 
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- After running, regenerate types with:
--   npx supabase gen types typescript --project-id fvmpmozybmtzjvikrctq > src/types/database.types.ts
--
-- CATEGORIZED CHANGES:
--   Part 1: ALTER TABLE — Add missing columns to existing tables
--   Part 2: CREATE TABLE — Create ghost tables referenced by code
--   Part 3: CREATE FUNCTION — Add missing RPC functions
--   Part 4: CREATE VIEW / Aliases — Add convenience columns
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: ALTER TABLE — Add missing columns to existing tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1A. custom_questions — Add columns used by useCaseService.ts, baselineService.ts
-- 
-- Code references these columns but DB only has: field_name, options, etc.
-- We add them as nullable columns with sensible defaults.
-- question_key = alias for field_name (used in old code paths)
-- select_options = alias for options (used in old code paths)
-- impact_type, impacts_field, impact_calculation = used for dynamic question impact modeling
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  -- question_key: Alternate name for field_name, used in useCaseService.ts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'custom_questions' AND column_name = 'question_key') THEN
    ALTER TABLE public.custom_questions ADD COLUMN question_key text;
    -- Backfill from existing field_name
    UPDATE public.custom_questions SET question_key = field_name WHERE question_key IS NULL;
    COMMENT ON COLUMN public.custom_questions.question_key IS 'Alternate identifier for the question field. Typically matches field_name. Used by legacy code paths.';
  END IF;

  -- select_options: Alternate JSONB for options, used in useCaseService.ts / baselineService.ts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'custom_questions' AND column_name = 'select_options') THEN
    ALTER TABLE public.custom_questions ADD COLUMN select_options jsonb;
    -- Backfill from existing options column
    UPDATE public.custom_questions SET select_options = options WHERE select_options IS NULL AND options IS NOT NULL;
    COMMENT ON COLUMN public.custom_questions.select_options IS 'JSONB array of selectable options. Mirrors options column for legacy compatibility.';
  END IF;

  -- impact_type: How this question impacts the BESS sizing (e.g., multiplier, additive, binary)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'custom_questions' AND column_name = 'impact_type') THEN
    ALTER TABLE public.custom_questions ADD COLUMN impact_type text;
    COMMENT ON COLUMN public.custom_questions.impact_type IS 'How this question impacts sizing: multiplier, additive, binary, select_multiplier, none';
  END IF;

  -- impacts_field: Which configuration field this question modifies
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'custom_questions' AND column_name = 'impacts_field') THEN
    ALTER TABLE public.custom_questions ADD COLUMN impacts_field text;
    COMMENT ON COLUMN public.custom_questions.impacts_field IS 'Target config field: equipmentPower, energyCostMultiplier, backupHours, etc.';
  END IF;

  -- impact_calculation: JSONB with calculation parameters (multiplierValue, additionalLoadKw, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'custom_questions' AND column_name = 'impact_calculation') THEN
    ALTER TABLE public.custom_questions ADD COLUMN impact_calculation jsonb;
    COMMENT ON COLUMN public.custom_questions.impact_calculation IS 'JSONB with impact params: { multiplierValue, additionalLoadKw, baseValue, etc. }';
  END IF;
END
$$;


-- ----------------------------------------------------------------------------
-- 1B. use_cases — Add columns queried by systemHealthCheck.ts
-- 
-- systemHealthCheck.ts queries use_cases for power_profile, equipment, financial_params
-- These exist on use_case_templates but NOT on use_cases itself.
-- We add them as JSONB columns to allow health check validation.
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'use_cases' AND column_name = 'power_profile') THEN
    ALTER TABLE public.use_cases ADD COLUMN power_profile jsonb;
    COMMENT ON COLUMN public.use_cases.power_profile IS 'Power profile for health check validation. Primary source is use_case_templates.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'use_cases' AND column_name = 'equipment') THEN
    ALTER TABLE public.use_cases ADD COLUMN equipment jsonb;
    COMMENT ON COLUMN public.use_cases.equipment IS 'Equipment list for health check validation. Primary source is use_case_templates.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'use_cases' AND column_name = 'financial_params') THEN
    ALTER TABLE public.use_cases ADD COLUMN financial_params jsonb;
    COMMENT ON COLUMN public.use_cases.financial_params IS 'Financial parameters for health check. Primary source is use_case_templates.';
  END IF;
END
$$;

-- Backfill from use_case_templates where possible
UPDATE public.use_cases uc
SET 
  power_profile = COALESCE(uc.power_profile, uct.power_profile),
  equipment = COALESCE(uc.equipment, uct.custom_questions),
  financial_params = COALESCE(uc.financial_params, uct.financial_params)
FROM public.use_case_templates uct
WHERE uc.slug = uct.slug
  AND (uc.power_profile IS NULL OR uc.equipment IS NULL OR uc.financial_params IS NULL);


-- ----------------------------------------------------------------------------
-- 1C. scrape_jobs — Add 'status' column (code uses 'status', DB has 'last_run_status')
-- Note: We use a regular column + trigger rather than GENERATED ALWAYS
-- because Supabase PostgREST may not return generated columns in all cases.
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'scrape_jobs' AND column_name = 'status') THEN
    ALTER TABLE public.scrape_jobs ADD COLUMN status text;
    -- Backfill from existing last_run_status
    UPDATE public.scrape_jobs SET status = last_run_status WHERE status IS NULL;
    COMMENT ON COLUMN public.scrape_jobs.status IS 'Alias for last_run_status. Kept in sync via trigger. Used by systemHealthCheck.ts.';
  END IF;
END
$$;

-- Trigger to keep status in sync with last_run_status
CREATE OR REPLACE FUNCTION public.sync_scrape_job_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.status := NEW.last_run_status;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_scrape_job_status ON public.scrape_jobs;
CREATE TRIGGER trg_sync_scrape_job_status
  BEFORE INSERT OR UPDATE ON public.scrape_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_scrape_job_status();


-- ----------------------------------------------------------------------------
-- 1D. use_case_configurations — Ensure typical_load_kw allows null safely
--     (baselineService.ts accesses defaultConfig.typical_load_kw which can be null)
--     No schema change needed — this is a code-side null check issue.
-- ----------------------------------------------------------------------------
-- No SQL needed here. Code fix handles this.


-- ----------------------------------------------------------------------------
-- 1E. custom_questions — Add industry_slug column
--     systemHealthCheck.ts queries: .select("id, question_text, display_order, industry_slug")
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'custom_questions' AND column_name = 'industry_slug') THEN
    ALTER TABLE public.custom_questions ADD COLUMN industry_slug text;
    COMMENT ON COLUMN public.custom_questions.industry_slug IS 'Industry slug for filtering questions by industry. Derived from use_case_id relationship.';
    
    -- Backfill from use_cases via use_case_id
    UPDATE public.custom_questions cq
    SET industry_slug = uc.slug
    FROM public.use_cases uc
    WHERE cq.use_case_id = uc.id
      AND cq.industry_slug IS NULL;
  END IF;
END
$$;


-- ============================================================================
-- PART 2: CREATE TABLE — Ghost tables referenced by code but missing from DB
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2A. ai_training_data — Used by mlProcessingService.ts for ML price analysis
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type text NOT NULL DEFAULT 'pricing',
  product_type text,
  manufacturer text,
  data_json jsonb,
  source_url text,
  source_name text,
  processed_for_ml boolean DEFAULT false,
  ml_model_version text,
  confidence_score numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.ai_training_data IS 'Training data for ML price analysis. Populated by vendor submissions and RSS feeds.';

CREATE INDEX IF NOT EXISTS idx_ai_training_data_type ON public.ai_training_data(data_type);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_product ON public.ai_training_data(product_type);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_processed ON public.ai_training_data(processed_for_ml);

-- Enable RLS
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "ai_training_data_read" ON public.ai_training_data FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ai_training_data_insert" ON public.ai_training_data FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ai_training_data_update" ON public.ai_training_data FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ----------------------------------------------------------------------------
-- 2B. ml_price_trends — Used by mlProcessingService.ts to store trend analysis
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ml_price_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type text NOT NULL UNIQUE,
  manufacturer text,
  average_price numeric,
  price_change_30d numeric,
  price_change_90d numeric,
  trend_direction text,  -- 'increasing', 'decreasing', 'stable'
  confidence numeric,
  forecast_next_quarter numeric,
  data_points integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.ml_price_trends IS 'ML-generated price trend analysis per product type.';

ALTER TABLE public.ml_price_trends ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "ml_price_trends_read" ON public.ml_price_trends FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ml_price_trends_write" ON public.ml_price_trends FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ----------------------------------------------------------------------------
-- 2C. ml_market_insights — Used by mlProcessingService.ts for market insights
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ml_market_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  insight_text text NOT NULL,
  impact_level text,  -- 'low', 'medium', 'high'
  affected_products text[],
  confidence numeric,
  source_count integer,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.ml_market_insights IS 'ML-generated market insights from processed training data.';

ALTER TABLE public.ml_market_insights ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "ml_market_insights_read" ON public.ml_market_insights FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ml_market_insights_write" ON public.ml_market_insights FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ----------------------------------------------------------------------------
-- 2D. ml_processing_log — Used by mlProcessingService.ts for processing logs
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ml_processing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processed_at timestamptz NOT NULL DEFAULT now(),
  records_processed integer,
  trends_generated integer,
  insights_generated integer,
  processing_time_seconds numeric,
  status text NOT NULL DEFAULT 'pending',  -- 'success', 'error', 'pending'
  error_message text
);

COMMENT ON TABLE public.ml_processing_log IS 'Log of ML processing runs with statistics.';

ALTER TABLE public.ml_processing_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "ml_processing_log_read" ON public.ml_processing_log FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ml_processing_log_write" ON public.ml_processing_log FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ----------------------------------------------------------------------------
-- 2E. daily_price_data — Used by supabaseClient.ts PricingClient
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.daily_price_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_date date NOT NULL,
  data_source text NOT NULL,
  source_url text,
  validation_status text DEFAULT 'pending',  -- pending, validated, flagged, error

  -- BESS Pricing
  bess_utility_scale_per_kwh numeric,
  bess_commercial_per_kwh numeric,
  bess_small_scale_per_kwh numeric,
  bess_market_trend text,

  -- Solar Pricing
  solar_utility_scale_per_watt numeric,
  solar_commercial_per_watt numeric,
  solar_residential_per_watt numeric,

  -- Wind Pricing
  wind_utility_scale_per_kw numeric,
  wind_commercial_per_kw numeric,

  -- Generator Pricing
  generator_natural_gas_per_kw numeric,
  generator_diesel_per_kw numeric,

  -- Market Intelligence
  market_volatility_index numeric,
  supply_chain_status text,
  demand_forecast text,
  technology_maturity text,

  -- Alerts
  price_deviation_percent numeric,
  alert_threshold_exceeded boolean DEFAULT false,
  alert_message text,

  -- Vendor / raw data
  vendor_data jsonb,
  raw_data jsonb,

  -- Processing
  processed_at timestamptz DEFAULT now(),
  processing_duration_ms integer,
  data_quality_score numeric,

  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.daily_price_data IS 'Daily collected price data from multiple sources for pricing intelligence.';

CREATE INDEX IF NOT EXISTS idx_daily_price_date ON public.daily_price_data(price_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_price_source ON public.daily_price_data(data_source);

ALTER TABLE public.daily_price_data ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "daily_price_data_read" ON public.daily_price_data FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "daily_price_data_write" ON public.daily_price_data FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ----------------------------------------------------------------------------
-- 2F. pricing_alerts — Used by supabaseClient.ts PricingClient
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pricing_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text DEFAULT 'medium',  -- low, medium, high, critical
  title text NOT NULL,
  message text NOT NULL,

  price_data_id uuid REFERENCES public.daily_price_data(id),
  configuration_id uuid,

  triggered_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by text,
  resolved_at timestamptz,
  resolved_by text,

  alert_data jsonb,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.pricing_alerts IS 'Pricing alerts triggered by anomaly detection or threshold breaches.';

CREATE INDEX IF NOT EXISTS idx_pricing_alerts_unresolved ON public.pricing_alerts(resolved_at) WHERE resolved_at IS NULL;

ALTER TABLE public.pricing_alerts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "pricing_alerts_read" ON public.pricing_alerts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "pricing_alerts_write" ON public.pricing_alerts FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ----------------------------------------------------------------------------
-- 2G. pricing_markup_config — Used by equipmentPricingTiersService.ts
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pricing_markup_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  markup_percentage numeric NOT NULL DEFAULT 15.0,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.pricing_markup_config IS 'Equipment markup percentages by type. Used by equipmentPricingTiersService.ts.';

-- Seed with default markup values from copilot-instructions
INSERT INTO public.pricing_markup_config (config_key, markup_percentage, description)
VALUES
  ('global_default', 15.0, 'Global default markup percentage'),
  ('bess', 12.0, 'BESS equipment markup'),
  ('solar', 10.0, 'Solar panels markup (commoditized)'),
  ('inverter', 15.0, 'Inverter/PCS markup'),
  ('transformer', 18.0, 'Transformer markup'),
  ('switchgear', 20.0, 'Switchgear markup'),
  ('generator', 12.0, 'Generator markup'),
  ('ev_charger', 15.0, 'EV Charger markup'),
  ('ems_software', 30.0, 'EMS Software markup'),
  ('microgrid_controller', 25.0, 'Microgrid Controller markup'),
  ('scada', 20.0, 'SCADA system markup'),
  ('bms', 15.0, 'Battery Management System markup'),
  ('dc_ac_panels', 18.0, 'DC/AC Panels markup'),
  ('ess_enclosure', 12.0, 'ESS Enclosure markup')
ON CONFLICT (config_key) DO NOTHING;

ALTER TABLE public.pricing_markup_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "pricing_markup_config_read" ON public.pricing_markup_config FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "pricing_markup_config_write" ON public.pricing_markup_config FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ----------------------------------------------------------------------------
-- 2H. ssot_alerts — Used by systemHealthCheck.ts for validation tracking
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ssot_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL DEFAULT 'validation',
  severity text DEFAULT 'info',
  message text,
  details jsonb,
  fetched_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.ssot_alerts IS 'SSOT validation alerts and tracking for system health checks.';

CREATE INDEX IF NOT EXISTS idx_ssot_alerts_fetched ON public.ssot_alerts(fetched_at DESC);

ALTER TABLE public.ssot_alerts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "ssot_alerts_read" ON public.ssot_alerts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ssot_alerts_write" ON public.ssot_alerts FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- PART 3: CREATE FUNCTION — Missing RPC functions referenced by code
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3A. calculate_bess_pricing — Used by supabaseClient.ts PricingClient
-- Returns weighted BESS price per kWh based on system size
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_bess_pricing(
  energy_capacity_mwh numeric,
  config_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  price_per_kwh numeric;
  capacity_kwh numeric;
BEGIN
  capacity_kwh := energy_capacity_mwh * 1000;
  
  -- Try to get from pricing_configurations
  IF config_id IS NOT NULL THEN
    SELECT (config_data->>'base_price_per_kwh')::numeric
    INTO price_per_kwh
    FROM public.pricing_configurations
    WHERE id = config_id AND is_active = true;
  END IF;
  
  -- Fallback: size-weighted pricing from equipment_pricing_tiers
  IF price_per_kwh IS NULL THEN
    SELECT base_price
    INTO price_per_kwh
    FROM public.equipment_pricing_tiers
    WHERE equipment_type = 'bess'
      AND is_active = true
      AND (size_min IS NULL OR size_min <= capacity_kwh)
      AND (size_max IS NULL OR size_max >= capacity_kwh)
    ORDER BY base_price ASC
    LIMIT 1;
  END IF;
  
  -- Final fallback: industry standard $120/kWh
  IF price_per_kwh IS NULL THEN
    price_per_kwh := 120.0;
  END IF;
  
  RETURN price_per_kwh;
END;
$$;

COMMENT ON FUNCTION public.calculate_bess_pricing IS 'Calculate size-weighted BESS pricing per kWh. Falls back to $120/kWh if no tier data.';


-- ----------------------------------------------------------------------------
-- 3B. increment_error_count — Used by marketDataIntegrationService.ts
-- Increments consecutive_failures on a market_data_source
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_error_count(
  p_source_id uuid
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.market_data_sources
  SET 
    fetch_error_count = COALESCE(fetch_error_count, 0) + 1,
    last_fetch_status = 'error',
    updated_at = now()
  WHERE id = p_source_id
  RETURNING fetch_error_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$;

COMMENT ON FUNCTION public.increment_error_count IS 'Increment consecutive failure count for a market data source.';


-- ----------------------------------------------------------------------------
-- 3C. add_data_points — Used by marketDataIntegrationService.ts
-- Adds to the data points count for a market data source
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.add_data_points(
  p_source_id uuid,
  p_count integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  new_total integer;
BEGIN
  -- Reset error count and update fetch status on successful data addition
  UPDATE public.market_data_sources
  SET 
    fetch_error_count = 0,
    last_fetch_status = 'success',
    last_fetch_at = now(),
    total_data_points = COALESCE(total_data_points, 0) + p_count,
    updated_at = now()
  WHERE id = p_source_id;
  
  RETURN p_count;
END;
$$;

COMMENT ON FUNCTION public.add_data_points IS 'Record successful data point collection for a market data source.';


-- ============================================================================
-- PART 4: Convenience — system_configuration view for backward compat
-- ============================================================================

-- Code references "system_configuration" but table is "system_config"
-- Create a view as an alias

CREATE OR REPLACE VIEW public.system_configuration AS
SELECT 
  id,
  config_key,
  config_value,
  description,
  is_public,
  created_at,
  updated_at,
  updated_by
FROM public.system_config;

COMMENT ON VIEW public.system_configuration IS 'View alias for system_config table. Used by supabaseClient.ts.';


-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm everything worked)
-- ============================================================================

-- Verify new columns on custom_questions
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'custom_questions' AND column_name IN ('question_key', 'select_options', 'impact_type', 'impacts_field', 'impact_calculation', 'industry_slug');

-- Verify new columns on use_cases
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'use_cases' AND column_name IN ('power_profile', 'equipment', 'financial_params');

-- Verify new tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('ai_training_data', 'ml_price_trends', 'ml_market_insights', 'ml_processing_log', 'daily_price_data', 'pricing_alerts', 'pricing_markup_config', 'ssot_alerts');

-- Verify new functions exist
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name IN ('calculate_bess_pricing', 'increment_error_count', 'add_data_points');

COMMIT;

-- ============================================================================
-- POST-MIGRATION: Regenerate TypeScript types
-- ============================================================================
-- Run this command in your terminal after the migration:
--
--   npx supabase gen types typescript --project-id fvmpmozybmtzjvikrctq > src/types/database.types.ts
--
-- Then run: npx tsc --noEmit -p tsconfig.app.json 2>&1 | wc -l
-- to verify error count reduction.
-- ============================================================================
