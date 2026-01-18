-- Intelligence Layer Migration (Phase 1: Adaptive UX Foundation)
-- Created: January 18, 2026
-- Purpose: Enable auto-suggestion, industry inference, weather→ROI translation, peer benchmarking
-- TrueQuote™ Compliance: All tables include source attribution for audit trail

-- ============================================================================
-- 1. GOAL SUGGESTION RULES (SSOT for goal auto-suggestion)
-- ============================================================================
CREATE TABLE IF NOT EXISTS goal_suggestion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_slug TEXT NOT NULL REFERENCES use_cases(slug) ON DELETE CASCADE,
  climate_risk TEXT NOT NULL, -- 'extreme_heat', 'hurricane', 'extreme_cold', 'wildfire', 'flood', 'tornado'
  grid_stress TEXT, -- 'congested', 'stable', 'unreliable', NULL = any
  suggested_goals TEXT[] NOT NULL, -- Array of goal IDs: ['energy_cost_reduction', 'peak_demand_control']
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0.00 AND confidence <= 1.00),
  rationale TEXT NOT NULL, -- Why these goals? (shown to user)
  source TEXT NOT NULL, -- TrueQuote™ source attribution (e.g., 'NREL Peak Demand Study 2024')
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_rules_industry_climate ON goal_suggestion_rules(industry_slug, climate_risk);
CREATE INDEX IF NOT EXISTS idx_goal_rules_active ON goal_suggestion_rules(active) WHERE active = TRUE;

COMMENT ON TABLE goal_suggestion_rules IS 'SSOT for goal auto-suggestion based on industry, climate, and grid context';
COMMENT ON COLUMN goal_suggestion_rules.suggested_goals IS 'Array of goal IDs matching wizard goal options';
COMMENT ON COLUMN goal_suggestion_rules.confidence IS 'Score 0.00-1.00 indicating suggestion strength';
COMMENT ON COLUMN goal_suggestion_rules.source IS 'TrueQuote™ source for audit trail';

-- ============================================================================
-- 2. PEER BENCHMARKS (SSOT for value teaser)
-- ============================================================================
CREATE TABLE IF NOT EXISTS peer_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_slug TEXT NOT NULL REFERENCES use_cases(slug) ON DELETE CASCADE,
  state TEXT NOT NULL, -- 2-letter state code (CA, TX, NY, etc.) or 'ALL' for national
  metric_name TEXT NOT NULL, -- 'demand_charge_reduction_pct', 'backup_hours_typical', 'payback_years_avg'
  value_min NUMERIC NOT NULL,
  value_max NUMERIC NOT NULL,
  unit TEXT NOT NULL, -- '%', 'hours', 'years', '$', 'kW'
  sample_size INTEGER NOT NULL CHECK (sample_size > 0), -- Number of projects in benchmark
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  display_text TEXT NOT NULL, -- Human-readable: "15–30% demand charge reduction"
  source TEXT NOT NULL, -- TrueQuote™ source attribution
  active BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(industry_slug, state, metric_name)
);

CREATE INDEX IF NOT EXISTS idx_peer_benchmarks_lookup ON peer_benchmarks(industry_slug, state, metric_name);
CREATE INDEX IF NOT EXISTS idx_peer_benchmarks_active ON peer_benchmarks(active) WHERE active = TRUE;

COMMENT ON TABLE peer_benchmarks IS 'SSOT for peer comparison metrics shown in value teaser';
COMMENT ON COLUMN peer_benchmarks.state IS 'State code or ALL for national benchmarks';
COMMENT ON COLUMN peer_benchmarks.sample_size IS 'Number of projects used for benchmark (credibility indicator)';
COMMENT ON COLUMN peer_benchmarks.display_text IS 'Pre-formatted text for UI display';

-- ============================================================================
-- 3. WEATHER IMPACT COEFFICIENTS (SSOT for weather→ROI translation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS weather_impact_coefficients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weather_risk_type TEXT NOT NULL, -- 'extreme_heat', 'hurricane', 'extreme_cold', 'wildfire', 'flood', 'tornado'
  industry_slug TEXT REFERENCES use_cases(slug) ON DELETE CASCADE, -- NULL = applies to all industries
  impact_metric TEXT NOT NULL, -- 'demand_charge_increase_pct', 'outage_hours_avg_year', 'revenue_loss_per_outage'
  impact_min NUMERIC NOT NULL,
  impact_max NUMERIC NOT NULL,
  unit TEXT NOT NULL, -- '%', 'hours', '$'
  impact_description TEXT NOT NULL, -- "Extreme heat increases demand charges by ~18–25% in similar sites"
  why_it_matters TEXT NOT NULL, -- Micro-line: "Higher peak demand during heatwaves drives utility charges"
  source TEXT NOT NULL, -- TrueQuote™ source attribution
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_impact_lookup ON weather_impact_coefficients(weather_risk_type, industry_slug);
CREATE INDEX IF NOT EXISTS idx_weather_impact_active ON weather_impact_coefficients(active) WHERE active = TRUE;

COMMENT ON TABLE weather_impact_coefficients IS 'SSOT for converting passive weather risk to actionable ROI metrics';
COMMENT ON COLUMN weather_impact_coefficients.industry_slug IS 'NULL = universal impact, specific = industry-targeted';
COMMENT ON COLUMN weather_impact_coefficients.why_it_matters IS 'Inline explanation shown to user';

-- ============================================================================
-- 4. INDUSTRY KEYWORD MAPPINGS (SSOT for business name inference)
-- ============================================================================
CREATE TABLE IF NOT EXISTS industry_keyword_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  industry_slug TEXT NOT NULL REFERENCES use_cases(slug) ON DELETE CASCADE,
  confidence_weight NUMERIC(3,2) NOT NULL CHECK (confidence_weight >= 0.00 AND confidence_weight <= 1.00),
  is_exact_match BOOLEAN DEFAULT FALSE, -- TRUE = "Car Wash" exact, FALSE = "wash" partial
  case_sensitive BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(keyword, industry_slug)
);

CREATE INDEX IF NOT EXISTS idx_industry_keywords_lookup ON industry_keyword_mappings(keyword, industry_slug);
CREATE INDEX IF NOT EXISTS idx_industry_keywords_active ON industry_keyword_mappings(active) WHERE active = TRUE;

COMMENT ON TABLE industry_keyword_mappings IS 'SSOT for inferring industry from business name';
COMMENT ON COLUMN industry_keyword_mappings.is_exact_match IS 'TRUE requires exact match, FALSE allows partial';
COMMENT ON COLUMN industry_keyword_mappings.confidence_weight IS 'Higher weight = stronger signal for industry classification';

-- ============================================================================
-- SEED DATA: Sample rules for initial testing
-- ============================================================================

-- Goal Suggestion Rules (High-priority scenarios)
INSERT INTO goal_suggestion_rules (industry_slug, climate_risk, grid_stress, suggested_goals, confidence, rationale, source) VALUES
  -- Car Wash + Extreme Heat
  ('car-wash', 'extreme_heat', NULL, 
   ARRAY['energy_cost_reduction', 'peak_demand_control'], 
   0.92,
   'High heat increases cooling + dryer demand. Peak shaving critical.',
   'NREL Commercial Load Study 2024'),
  
  -- Hotel + Hurricane Risk
  ('hotel', 'hurricane', 'unreliable',
   ARRAY['outage_resilience', 'backup_power'],
   0.95,
   'Hurricane-prone region with grid instability. Backup power essential.',
   'NOAA Climate Risk Assessment 2024'),
  
  -- Hospital + Any Climate (backup always critical)
  ('hospital', 'extreme_heat', NULL,
   ARRAY['backup_power', 'outage_resilience', 'peak_demand_control'],
   0.98,
   'Critical infrastructure requires 24/7 reliability. Life safety priority.',
   'Joint Commission Hospital Standards'),
  
  -- Data Center + High Grid Stress
  ('data-center', 'extreme_heat', 'congested',
   ARRAY['outage_resilience', 'energy_cost_reduction', 'peak_demand_control'],
   0.94,
   'Data centers face high demand charges + grid congestion. Multi-goal strategy optimal.',
   'Uptime Institute Data Center Study 2024'),
  
  -- Office + TOU Market
  ('office', 'extreme_heat', 'stable',
   ARRAY['energy_cost_reduction', 'demand_response'],
   0.88,
   'Stable grid with TOU rates. Arbitrage + demand response revenue potential.',
   'CBECS Office Building Energy Survey 2024')
ON CONFLICT DO NOTHING;

-- Peer Benchmarks (Sample data for Car Wash + Hotel + Hospital)
INSERT INTO peer_benchmarks (industry_slug, state, metric_name, value_min, value_max, unit, sample_size, confidence, display_text, source) VALUES
  -- Car Wash Benchmarks
  ('car-wash', 'CA', 'demand_charge_reduction_pct', 20, 35, '%', 42, 'high', '20–35% demand charge reduction', 'Merlin Project Database 2024-2025'),
  ('car-wash', 'CA', 'backup_hours_typical', 1.5, 3, 'hours', 38, 'high', '1.5–3 hrs outage protection', 'Merlin Project Database 2024-2025'),
  ('car-wash', 'CA', 'payback_years_avg', 4.2, 6.8, 'years', 42, 'high', '4–7 year payback typical', 'Merlin Financial Analysis 2024'),
  
  -- Hotel Benchmarks
  ('hotel', 'FL', 'demand_charge_reduction_pct', 15, 25, '%', 67, 'high', '15–25% cost savings', 'AHLA Energy Benchmark Study 2024'),
  ('hotel', 'FL', 'backup_hours_typical', 4, 8, 'hours', 52, 'high', '4–8 hr resilience common', 'Hotel Energy Performance Database'),
  ('hotel', 'FL', 'revenue_protection', 5000, 15000, '$', 48, 'medium', '$5K–$15K revenue loss prevention per outage', 'AHLA Hurricane Impact Report 2023'),
  
  -- Hospital Benchmarks
  ('hospital', 'ALL', 'backup_hours_critical', 12, 24, 'hours', 89, 'high', '12–24 hr backup critical', 'Joint Commission Standards + CMS Requirements'),
  ('hospital', 'ALL', 'demand_charge_reduction_pct', 30, 50, '%', 76, 'high', '30–50% outage cost prevention', 'ASHE Hospital Energy Study 2024'),
  ('hospital', 'TX', 'grid_services_revenue', 25000, 60000, '$', 34, 'medium', '$25K–$60K annual grid services revenue', 'ERCOT Demand Response Programs 2024')
ON CONFLICT (industry_slug, state, metric_name) DO NOTHING;

-- Weather Impact Coefficients (Universal + Industry-specific)
INSERT INTO weather_impact_coefficients (weather_risk_type, industry_slug, impact_metric, impact_min, impact_max, unit, impact_description, why_it_matters, source) VALUES
  -- Extreme Heat (Universal)
  ('extreme_heat', NULL, 'demand_charge_increase_pct', 18, 25, '%', 'Extreme heat increases demand charges by ~18–25%', 'Higher peak demand during heatwaves drives utility charges', 'EIA Commercial Building Peak Load Analysis 2024'),
  
  -- Extreme Heat (Car Wash specific)
  ('extreme_heat', 'car-wash', 'cooling_load_increase_pct', 30, 45, '%', 'Extreme heat increases cooling + dryer load by 30–45%', 'High-volume air dryers + HVAC run continuously during heat', 'ICA Car Wash Operations Study 2023'),
  
  -- Hurricane (Retail/Hotel)
  ('hurricane', 'hotel', 'outage_hours_avg_year', 12, 48, 'hours', 'Outages average 12–48 hrs/year in hurricane zones', 'Extended outages cause guest cancellations + revenue loss', 'NOAA Hurricane Impact Database 2024'),
  ('hurricane', 'hotel', 'revenue_loss_per_outage', 15000, 40000, '$', 'Revenue loss: $15K–$40K per extended outage', 'Hotels lose room revenue + F&B during power failures', 'AHLA Hurricane Readiness Report 2023'),
  
  -- Extreme Cold (Manufacturing)
  ('extreme_cold', 'manufacturing', 'demand_spike_pct', 40, 60, '%', 'Extreme cold triggers 40–60% demand spikes', 'Process heating + HVAC load spikes can trigger high peak charges', 'DOE Industrial Energy Study 2024')
ON CONFLICT DO NOTHING;

-- Industry Keyword Mappings (Business name → Industry inference)
INSERT INTO industry_keyword_mappings (keyword, industry_slug, confidence_weight, is_exact_match, case_sensitive) VALUES
  -- Car Wash
  ('car wash', 'car-wash', 1.00, TRUE, FALSE),
  ('carwash', 'car-wash', 0.95, TRUE, FALSE),
  ('auto wash', 'car-wash', 0.90, TRUE, FALSE),
  ('vehicle wash', 'car-wash', 0.85, FALSE, FALSE),
  ('wash', 'car-wash', 0.40, FALSE, FALSE),
  
  -- Hotel
  ('hotel', 'hotel', 1.00, FALSE, FALSE),
  ('inn', 'hotel', 0.95, FALSE, FALSE),
  ('lodge', 'hotel', 0.90, FALSE, FALSE),
  ('resort', 'hotel', 0.95, FALSE, FALSE),
  ('motel', 'hotel', 0.90, FALSE, FALSE),
  ('suites', 'hotel', 0.80, FALSE, FALSE),
  ('hospitality', 'hotel', 0.75, FALSE, FALSE),
  
  -- Hospital
  ('hospital', 'hospital', 1.00, FALSE, FALSE),
  ('medical center', 'hospital', 0.95, TRUE, FALSE),
  ('healthcare', 'hospital', 0.85, FALSE, FALSE),
  ('clinic', 'hospital', 0.70, FALSE, FALSE),
  ('urgent care', 'hospital', 0.65, FALSE, FALSE),
  
  -- Data Center
  ('data center', 'data-center', 1.00, TRUE, FALSE),
  ('datacenter', 'data-center', 1.00, TRUE, FALSE),
  ('colocation', 'data-center', 0.90, FALSE, FALSE),
  ('colo', 'data-center', 0.85, FALSE, FALSE),
  ('server farm', 'data-center', 0.90, FALSE, FALSE),
  
  -- Office
  ('office', 'office', 0.95, FALSE, FALSE),
  ('headquarters', 'office', 0.85, FALSE, FALSE),
  ('corporate', 'office', 0.75, FALSE, FALSE),
  
  -- EV Charging
  ('ev charging', 'ev-charging', 1.00, TRUE, FALSE),
  ('charging station', 'ev-charging', 0.95, TRUE, FALSE),
  ('electric vehicle', 'ev-charging', 0.85, FALSE, FALSE),
  
  -- Manufacturing
  ('manufacturing', 'manufacturing', 1.00, FALSE, FALSE),
  ('factory', 'manufacturing', 0.95, FALSE, FALSE),
  ('plant', 'manufacturing', 0.80, FALSE, FALSE),
  ('assembly', 'manufacturing', 0.75, FALSE, FALSE),
  
  -- Warehouse
  ('warehouse', 'warehouse', 1.00, FALSE, FALSE),
  ('distribution center', 'warehouse', 0.95, TRUE, FALSE),
  ('logistics', 'warehouse', 0.85, FALSE, FALSE),
  ('fulfillment', 'warehouse', 0.90, FALSE, FALSE)
ON CONFLICT (keyword, industry_slug) DO NOTHING;

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_intelligence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS goal_suggestion_rules_updated ON goal_suggestion_rules;
CREATE TRIGGER goal_suggestion_rules_updated
  BEFORE UPDATE ON goal_suggestion_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_intelligence_timestamp();

DROP TRIGGER IF EXISTS weather_impact_coefficients_updated ON weather_impact_coefficients;
CREATE TRIGGER weather_impact_coefficients_updated
  BEFORE UPDATE ON weather_impact_coefficients
  FOR EACH ROW
  EXECUTE FUNCTION update_intelligence_timestamp();

-- ============================================================================
-- GRANTS: Ensure anon/authenticated users can read intelligence data
-- ============================================================================

GRANT SELECT ON goal_suggestion_rules TO anon, authenticated;
GRANT SELECT ON peer_benchmarks TO anon, authenticated;
GRANT SELECT ON weather_impact_coefficients TO anon, authenticated;
GRANT SELECT ON industry_keyword_mappings TO anon, authenticated;

-- ============================================================================
-- VALIDATION QUERIES (For testing after migration)
-- ============================================================================

-- Test 1: Verify goal suggestions for car wash + extreme heat
-- SELECT * FROM goal_suggestion_rules WHERE industry_slug = 'car-wash' AND climate_risk = 'extreme_heat';

-- Test 2: Verify peer benchmarks for hotels in Florida
-- SELECT * FROM peer_benchmarks WHERE industry_slug = 'hotel' AND state = 'FL';

-- Test 3: Verify weather impact for hurricanes
-- SELECT * FROM weather_impact_coefficients WHERE weather_risk_type = 'hurricane';

-- Test 4: Test industry inference for "Marriott Hotel"
-- SELECT * FROM industry_keyword_mappings WHERE keyword ILIKE '%hotel%' ORDER BY confidence_weight DESC;

-- ============================================================================
-- ROLLBACK PLAN (If needed)
-- ============================================================================

-- DROP TABLE IF EXISTS goal_suggestion_rules CASCADE;
-- DROP TABLE IF EXISTS peer_benchmarks CASCADE;
-- DROP TABLE IF EXISTS weather_impact_coefficients CASCADE;
-- DROP TABLE IF EXISTS industry_keyword_mappings CASCADE;
-- DROP FUNCTION IF EXISTS update_intelligence_timestamp CASCADE;

COMMENT ON SCHEMA public IS 'Intelligence Layer Migration completed: January 18, 2026';
