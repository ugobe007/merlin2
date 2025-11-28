-- AI Data Collection Database Schema
-- Create tables for storing AI training data

-- 0. AI Training Data (from RSS feeds) - REQUIRED for rssToAIDatabase.ts
CREATE TABLE IF NOT EXISTS ai_training_data (
  id BIGSERIAL PRIMARY KEY,
  data_type VARCHAR(50) NOT NULL, -- 'pricing', 'configuration', 'market_trend'
  product_type VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(100),
  model_name VARCHAR(200),
  data_json JSONB NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'rss_feed', 'manual', 'api'
  confidence_score DECIMAL(3, 2) NOT NULL DEFAULT 0.5, -- 0.0 to 1.0
  processed_for_ml BOOLEAN DEFAULT false,
  ml_model_version VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_training_data_type ON ai_training_data(data_type);
CREATE INDEX idx_ai_training_data_product ON ai_training_data(product_type);
CREATE INDEX idx_ai_training_data_source ON ai_training_data(source);
CREATE INDEX idx_ai_training_data_confidence ON ai_training_data(confidence_score DESC);
CREATE INDEX idx_ai_training_data_processed ON ai_training_data(processed_for_ml);
CREATE INDEX idx_ai_training_data_created ON ai_training_data(created_at DESC);

-- 1. Battery Pricing History
CREATE TABLE IF NOT EXISTS battery_pricing (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'bnef', 'nrel', 'lazard', 'wood-mackenzie'
  "systemSize" VARCHAR(20) NOT NULL, -- 'small', 'medium', 'large', 'utility'
  "pricePerKWh" DECIMAL(10, 2) NOT NULL,
  chemistry VARCHAR(20) NOT NULL, -- 'lfp', 'nmc', 'lto', 'sodium-ion'
  region VARCHAR(50) NOT NULL, -- 'us', 'eu', 'china', 'global'
  includes TEXT[] NOT NULL, -- ['battery', 'pcs', 'bos', 'installation']
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_battery_pricing_date ON battery_pricing(date DESC);
CREATE INDEX idx_battery_pricing_source ON battery_pricing(source);
CREATE UNIQUE INDEX idx_battery_pricing_unique ON battery_pricing(date, source, "systemSize");

-- 2. Product Catalog
CREATE TABLE IF NOT EXISTS product_catalog (
  id BIGSERIAL PRIMARY KEY,
  manufacturer VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'battery', 'inverter', 'pcs', 'ems', 'container'
  capacity DECIMAL(10, 3), -- MWh for batteries
  power DECIMAL(10, 3), -- MW for inverters/PCS
  chemistry VARCHAR(50),
  efficiency DECIMAL(5, 2), -- percentage
  warranty INTEGER NOT NULL, -- years
  "cycleLife" INTEGER NOT NULL,
  price DECIMAL(15, 2),
  availability VARCHAR(20) NOT NULL, -- 'in-stock', 'lead-time', 'discontinued'
  "leadTimeDays" INTEGER,
  certifications TEXT[] NOT NULL, -- ['ul9540', 'ul1973', 'ieee1547']
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_catalog_manufacturer ON product_catalog(manufacturer);
CREATE INDEX idx_product_catalog_availability ON product_catalog(availability);
CREATE UNIQUE INDEX idx_product_catalog_unique ON product_catalog(manufacturer, model);

-- 3. Financing Options
CREATE TABLE IF NOT EXISTS financing_options (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'loan', 'lease', 'ppa', 'saas', 'ownership'
  "interestRate" DECIMAL(5, 2), -- percentage
  term INTEGER NOT NULL, -- years
  "minProjectSize" DECIMAL(10, 2), -- million USD
  "maxProjectSize" DECIMAL(10, 2),
  region TEXT[] NOT NULL, -- ['us', 'eu']
  sector TEXT[] NOT NULL, -- ['commercial', 'industrial', 'utility']
  requirements TEXT[] NOT NULL,
  "incentivesIncluded" TEXT[] NOT NULL, -- ['itc', 'macrs', 'sgip']
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_financing_provider ON financing_options(provider);
CREATE UNIQUE INDEX idx_financing_unique ON financing_options(provider, type);

-- 4. Industry News
CREATE TABLE IF NOT EXISTS industry_news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  source VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'pricing', 'deployment', 'regulation', 'technology', 'market'
  summary TEXT NOT NULL,
  url TEXT NOT NULL,
  "publishDate" TIMESTAMPTZ NOT NULL,
  "relevanceScore" INTEGER NOT NULL, -- 0-100
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_industry_news_date ON industry_news("publishDate" DESC);
CREATE INDEX idx_industry_news_category ON industry_news(category);
CREATE INDEX idx_industry_news_relevance ON industry_news("relevanceScore" DESC);
CREATE UNIQUE INDEX idx_industry_news_unique ON industry_news(title, source);

-- 5. Incentive Programs
CREATE TABLE IF NOT EXISTS incentive_programs (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  state VARCHAR(2), -- US state code
  region VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'tax-credit', 'rebate', 'grant', 'performance-payment'
  value VARCHAR(50) NOT NULL, -- dollar amount or percentage
  eligibility TEXT[] NOT NULL,
  deadline TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL, -- 'active', 'paused', 'expired'
  "applicationLink" TEXT,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incentive_programs_status ON incentive_programs(status);
CREATE INDEX idx_incentive_programs_region ON incentive_programs(region);
CREATE UNIQUE INDEX idx_incentive_programs_unique ON incentive_programs(name, region);

-- 6. Data Collection Log
CREATE TABLE IF NOT EXISTS data_collection_log (
  id BIGSERIAL PRIMARY KEY,
  collection_date TIMESTAMPTZ NOT NULL,
  duration_seconds DECIMAL(10, 2),
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'partial'
  items_collected INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_collection_log_date ON data_collection_log(collection_date DESC);

-- 7. Configuration Best Practices
CREATE TABLE IF NOT EXISTS configuration_best_practices (
  id BIGSERIAL PRIMARY KEY,
  use_case VARCHAR(100) NOT NULL,
  industry_standard VARCHAR(100) NOT NULL, -- e.g., "IEEE 1547-2018"
  recommended_power_mw_min DECIMAL(10, 3) NOT NULL,
  recommended_power_mw_max DECIMAL(10, 3) NOT NULL,
  recommended_power_mw_typical DECIMAL(10, 3) NOT NULL,
  recommended_duration_hrs_min DECIMAL(10, 2) NOT NULL,
  recommended_duration_hrs_max DECIMAL(10, 2) NOT NULL,
  recommended_duration_hrs_typical DECIMAL(10, 2) NOT NULL,
  recommended_chemistry TEXT[] NOT NULL,
  safety_factor DECIMAL(5, 2) NOT NULL,
  cycles_per_year INTEGER NOT NULL,
  round_trip_efficiency DECIMAL(5, 2) NOT NULL,
  source VARCHAR(100) NOT NULL, -- 'nrel', 'epri', 'ieee', 'industry-survey'
  last_updated TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_config_best_practices_use_case ON configuration_best_practices(use_case);
CREATE UNIQUE INDEX idx_config_best_practices_unique ON configuration_best_practices(use_case, industry_standard);

-- 8. ML Price Trends (generated by ML processing)
CREATE TABLE IF NOT EXISTS ml_price_trends (
  id BIGSERIAL PRIMARY KEY,
  product_type VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(100),
  average_price DECIMAL(10, 2) NOT NULL,
  price_change_30d DECIMAL(6, 2),
  price_change_90d DECIMAL(6, 2),
  trend_direction VARCHAR(20) NOT NULL, -- 'increasing', 'decreasing', 'stable'
  confidence DECIMAL(4, 2) NOT NULL,
  forecast_next_quarter DECIMAL(10, 2),
  data_points INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ml_price_trends_product ON ml_price_trends(product_type);
CREATE INDEX idx_ml_price_trends_updated ON ml_price_trends(updated_at DESC);
CREATE UNIQUE INDEX idx_ml_price_trends_unique ON ml_price_trends(product_type);

-- 9. ML Market Insights (generated by ML processing)
CREATE TABLE IF NOT EXISTS ml_market_insights (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  insight_text TEXT NOT NULL,
  impact_level VARCHAR(20) NOT NULL, -- 'high', 'medium', 'low'
  affected_products TEXT[],
  confidence DECIMAL(4, 2) NOT NULL,
  source_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ml_market_insights_category ON ml_market_insights(category);
CREATE INDEX idx_ml_market_insights_impact ON ml_market_insights(impact_level);
CREATE INDEX idx_ml_market_insights_created ON ml_market_insights(created_at DESC);

-- 10. ML Processing Log
CREATE TABLE IF NOT EXISTS ml_processing_log (
  id BIGSERIAL PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL,
  records_processed INTEGER,
  trends_generated INTEGER,
  insights_generated INTEGER,
  processing_time_seconds DECIMAL(10, 2),
  status VARCHAR(20) NOT NULL, -- 'success', 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ml_processing_log_date ON ml_processing_log(processed_at DESC);
CREATE INDEX idx_ml_processing_log_status ON ml_processing_log(status);

-- Enable Row Level Security (RLS)
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_collection_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_best_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_price_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_processing_log ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust based on your security needs)
CREATE POLICY "Allow public read access" ON ai_training_data FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON battery_pricing FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON product_catalog FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON financing_options FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON industry_news FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON incentive_programs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON data_collection_log FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON configuration_best_practices FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON ml_price_trends FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON ml_market_insights FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON ml_processing_log FOR SELECT USING (true);

-- Insert sample data for testing
INSERT INTO industry_news (title, source, category, summary, url, "publishDate", "relevanceScore") VALUES
('Tesla completes 730 MWh Megapack installation at Moss Landing, CA', 'Energy Storage News', 'deployment', 'World''s largest battery system now operational, providing grid stability services', 'https://www.energy-storage.news/tesla-moss-landing', NOW(), 95),
('LFP battery prices drop 12% YoY to $95/kWh at cell level', 'BloombergNEF', 'pricing', 'Lithium iron phosphate battery costs continue declining, approaching $80/kWh by 2026', 'https://www.bnef.com/battery-prices-2024', NOW(), 100),
('California mandates 52 GW of energy storage by 2045', 'Utility Dive', 'regulation', 'CPUC finalizes storage procurement targets to support renewable integration', 'https://www.utilitydive.com/california-storage-mandate', NOW(), 90)
ON CONFLICT DO NOTHING;

INSERT INTO battery_pricing (date, source, "systemSize", "pricePerKWh", chemistry, region, includes) VALUES
(NOW(), 'bnef', 'small', 168, 'lfp', 'us', ARRAY['battery', 'pcs', 'bos', 'installation']),
(NOW(), 'bnef', 'medium', 138, 'lfp', 'us', ARRAY['battery', 'pcs', 'bos', 'installation']),
(NOW(), 'bnef', 'large', 118, 'lfp', 'us', ARRAY['battery', 'pcs', 'bos', 'installation'])
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE battery_pricing IS 'Historical battery pricing data from multiple industry sources';
COMMENT ON TABLE product_catalog IS 'Current available BESS products and specifications';
COMMENT ON TABLE financing_options IS 'Available financing options for BESS projects';
COMMENT ON TABLE industry_news IS 'Relevant BESS industry news and updates';
COMMENT ON TABLE incentive_programs IS 'Government incentive programs for energy storage';
COMMENT ON TABLE data_collection_log IS 'Log of automated data collection runs';
COMMENT ON TABLE configuration_best_practices IS 'Industry-standard configuration recommendations by use case';
