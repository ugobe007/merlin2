-- ============================================================================
-- MARKET DATA SOURCES TABLE
-- Stores RSS feeds and web sources for market pricing scraping
-- Created: December 10, 2025
-- ============================================================================

-- Drop existing table if exists
DROP TABLE IF EXISTS market_data_sources CASCADE;

-- Create market_data_sources table
CREATE TABLE IF NOT EXISTS market_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source identification
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    feed_url VARCHAR(500),  -- RSS/Atom feed URL if available
    
    -- Classification
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
        'rss_feed',           -- Traditional RSS/Atom feed
        'api',                -- REST API endpoint
        'web_scrape',         -- Web page to scrape
        'data_provider',      -- Paid data provider (BNEF, S&P, etc.)
        'government',         -- Government/official data (EIA, NREL, etc.)
        'manufacturer'        -- Direct manufacturer pricing
    )),
    
    -- Equipment categories this source covers
    equipment_categories TEXT[] NOT NULL DEFAULT '{}',
    -- Allowed: 'bess', 'solar', 'wind', 'generator', 'inverter', 'ev-charger', 'all'
    
    -- Content classification
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN (
        'pricing',            -- Contains actual prices
        'market_trends',      -- Market analysis/trends
        'product_specs',      -- Product specifications
        'news',               -- General industry news
        'policy',             -- Policy/regulatory updates
        'mixed'               -- Multiple content types
    )),
    
    -- Geographic coverage
    regions TEXT[] DEFAULT ARRAY['global'],
    -- Examples: 'north-america', 'europe', 'asia-pacific', 'global'
    
    -- Data quality indicators
    reliability_score INTEGER DEFAULT 3 CHECK (reliability_score BETWEEN 1 AND 5),
    -- 5 = Primary source (NREL, BNEF), 4 = Official/verified, 3 = Industry publication
    -- 2 = Secondary/aggregator, 1 = Unverified
    
    data_frequency VARCHAR(50) DEFAULT 'weekly',
    -- 'real-time', 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
    
    -- Scraping configuration
    scrape_config JSONB DEFAULT '{}',
    -- Structure: {
    --   "selectors": { "price": ".price-class", "date": ".date-class" },
    --   "headers": { "User-Agent": "..." },
    --   "rate_limit_ms": 1000,
    --   "requires_auth": false,
    --   "auth_type": "api_key" | "oauth" | "basic"
    -- }
    
    -- Status and tracking
    is_active BOOLEAN DEFAULT true,
    last_fetch_at TIMESTAMP WITH TIME ZONE,
    last_fetch_status VARCHAR(50),  -- 'success', 'failed', 'partial'
    fetch_error_count INTEGER DEFAULT 0,
    total_data_points INTEGER DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    added_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_market_sources_type ON market_data_sources(source_type);
CREATE INDEX idx_market_sources_categories ON market_data_sources USING GIN(equipment_categories);
CREATE INDEX idx_market_sources_active ON market_data_sources(is_active) WHERE is_active = true;
CREATE INDEX idx_market_sources_content ON market_data_sources(content_type);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_market_sources_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER market_sources_updated
    BEFORE UPDATE ON market_data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_market_sources_timestamp();

-- ============================================================================
-- SEED INITIAL DATA SOURCES
-- ============================================================================

INSERT INTO market_data_sources (name, url, feed_url, source_type, equipment_categories, content_type, regions, reliability_score, data_frequency, notes) VALUES

-- =====================
-- GOVERNMENT / OFFICIAL SOURCES (Reliability: 5)
-- =====================
('NREL Annual Technology Baseline', 'https://atb.nrel.gov/', NULL, 'government', 
 ARRAY['bess', 'solar', 'wind', 'generator'], 'pricing', ARRAY['north-america'], 
 5, 'annual', 'Official DOE/NREL cost projections. Updated annually. Primary SSOT for utility-scale costs.'),

('EIA Electricity Data', 'https://www.eia.gov/electricity/', 'https://www.eia.gov/rss/electricity.xml', 'government',
 ARRAY['all'], 'pricing', ARRAY['north-america'],
 5, 'monthly', 'US Energy Information Administration. Electricity prices, generation costs.'),

('IRENA Cost Database', 'https://www.irena.org/costs', NULL, 'government',
 ARRAY['solar', 'wind', 'bess'], 'pricing', ARRAY['global'],
 5, 'annual', 'International Renewable Energy Agency. Global renewable energy costs.'),

('LBNL Utility-Scale Solar', 'https://emp.lbl.gov/utility-scale-solar', NULL, 'government',
 ARRAY['solar'], 'pricing', ARRAY['north-america'],
 5, 'annual', 'Lawrence Berkeley National Lab. Detailed utility-scale solar pricing.'),

('LBNL Wind Technologies Market Report', 'https://emp.lbl.gov/wind-technologies-market-report', NULL, 'government',
 ARRAY['wind'], 'pricing', ARRAY['north-america'],
 5, 'annual', 'Lawrence Berkeley National Lab. Wind turbine and project costs.'),

-- =====================
-- DATA PROVIDERS (Reliability: 5)
-- =====================
('BloombergNEF', 'https://about.bnef.com/', NULL, 'data_provider',
 ARRAY['bess', 'solar', 'wind'], 'pricing', ARRAY['global'],
 5, 'quarterly', 'Premium data provider. Battery pack price survey, solar/wind LCOE. Requires subscription.'),

('Wood Mackenzie', 'https://www.woodmac.com/industry/power-and-renewables/', NULL, 'data_provider',
 ARRAY['bess', 'solar', 'wind', 'generator'], 'pricing', ARRAY['global'],
 5, 'quarterly', 'Premium market intelligence. Project pipeline, pricing forecasts.'),

('S&P Global Market Intelligence', 'https://www.spglobal.com/marketintelligence/', NULL, 'data_provider',
 ARRAY['all'], 'pricing', ARRAY['global'],
 5, 'daily', 'Commodity prices, project data, financial analysis.'),

-- =====================
-- INDUSTRY PUBLICATIONS - RSS FEEDS (Reliability: 4)
-- =====================
('Energy Storage News', 'https://www.energy-storage.news', 'https://www.energy-storage.news/feed/', 'rss_feed',
 ARRAY['bess'], 'mixed', ARRAY['global'],
 4, 'daily', 'Leading BESS industry news. Project announcements with pricing.'),

('PV Magazine USA', 'https://pv-magazine-usa.com', 'https://pv-magazine-usa.com/feed/', 'rss_feed',
 ARRAY['solar', 'bess'], 'mixed', ARRAY['north-america'],
 4, 'daily', 'Solar and storage news. Module pricing, project costs.'),

('PV Magazine Global', 'https://www.pv-magazine.com', 'https://www.pv-magazine.com/feed/', 'rss_feed',
 ARRAY['solar', 'bess'], 'mixed', ARRAY['global'],
 4, 'daily', 'International solar news. Global pricing trends.'),

('Utility Dive', 'https://www.utilitydive.com', 'https://www.utilitydive.com/feeds/news/', 'rss_feed',
 ARRAY['all'], 'news', ARRAY['north-america'],
 4, 'daily', 'Utility industry news. Project announcements, regulatory.'),

('Renewable Energy World', 'https://www.renewableenergyworld.com', 'https://www.renewableenergyworld.com/feed/', 'rss_feed',
 ARRAY['solar', 'wind', 'bess'], 'mixed', ARRAY['global'],
 4, 'daily', 'Renewable energy industry coverage.'),

('CleanTechnica', 'https://cleantechnica.com', 'https://cleantechnica.com/feed/', 'rss_feed',
 ARRAY['solar', 'bess', 'ev-charger'], 'news', ARRAY['global'],
 3, 'daily', 'Clean technology news. EV and solar focus.'),

('Greentech Media / Canary Media', 'https://www.canarymedia.com', 'https://www.canarymedia.com/feed', 'rss_feed',
 ARRAY['bess', 'solar', 'wind'], 'news', ARRAY['north-america'],
 4, 'daily', 'Clean energy analysis and news.'),

('Energy Storage Journal', 'https://www.energystoragejournal.com', 'https://www.energystoragejournal.com/feed/', 'rss_feed',
 ARRAY['bess'], 'mixed', ARRAY['global'],
 4, 'weekly', 'Battery technology and market news.'),

('Microgrid Knowledge', 'https://www.microgridknowledge.com', 'https://www.microgridknowledge.com/feed/', 'rss_feed',
 ARRAY['bess', 'solar', 'generator'], 'mixed', ARRAY['north-america'],
 4, 'daily', 'Microgrid projects and technology.'),

-- =====================
-- PRICING INDICES / TRACKERS (Reliability: 4)
-- =====================
('PVInsights', 'http://pvinsights.com/', NULL, 'web_scrape',
 ARRAY['solar'], 'pricing', ARRAY['global'],
 4, 'weekly', 'Solar module spot pricing. Polysilicon to module prices.'),

('EnergyTrend (TrendForce)', 'https://www.energytrend.com/', NULL, 'web_scrape',
 ARRAY['solar', 'bess'], 'pricing', ARRAY['asia-pacific', 'global'],
 4, 'weekly', 'Asian solar and battery cell pricing.'),

('Fastmarkets', 'https://www.fastmarkets.com/commodities/battery-raw-materials', NULL, 'data_provider',
 ARRAY['bess'], 'pricing', ARRAY['global'],
 4, 'daily', 'Battery raw material prices. Lithium, cobalt, nickel.'),

-- =====================
-- MANUFACTURER SOURCES (Reliability: 4)
-- =====================
('Tesla Energy', 'https://www.tesla.com/energy', NULL, 'manufacturer',
 ARRAY['bess', 'solar'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Megapack, Powerwall, Solar Roof specs and availability.'),

('Fluence', 'https://fluenceenergy.com/', NULL, 'manufacturer',
 ARRAY['bess'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Utility-scale BESS products. Gridstack specs.'),

('BYD Battery', 'https://www.byd.com/en/NewEnergy', NULL, 'manufacturer',
 ARRAY['bess'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Battery-Box series specifications.'),

('CATL', 'https://www.catl.com/en/', NULL, 'manufacturer',
 ARRAY['bess'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'EnerOne, EnerC specifications.'),

('Sungrow', 'https://en.sungrowpower.com/', NULL, 'manufacturer',
 ARRAY['bess', 'inverter'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'BESS and inverter specifications.'),

('Canadian Solar', 'https://www.canadiansolar.com/', NULL, 'manufacturer',
 ARRAY['solar', 'bess'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Solar modules and battery storage.'),

('First Solar', 'https://www.firstsolar.com/', NULL, 'manufacturer',
 ARRAY['solar'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Thin-film solar modules. US manufacturing.'),

('Vestas', 'https://www.vestas.com/', NULL, 'manufacturer',
 ARRAY['wind'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Wind turbine specifications.'),

('Siemens Gamesa', 'https://www.siemensgamesa.com/', NULL, 'manufacturer',
 ARRAY['wind'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Onshore and offshore wind turbines.'),

('GE Vernova', 'https://www.gevernova.com/', NULL, 'manufacturer',
 ARRAY['wind', 'generator'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Wind turbines and gas generators.'),

('Cummins', 'https://www.cummins.com/generators', NULL, 'manufacturer',
 ARRAY['generator'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Diesel and natural gas generators.'),

('Caterpillar Energy', 'https://www.cat.com/en_US/products/new/power-systems.html', NULL, 'manufacturer',
 ARRAY['generator'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Industrial generators and power systems.'),

('Generac', 'https://www.generac.com/', NULL, 'manufacturer',
 ARRAY['generator', 'bess'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Commercial and residential generators/batteries.'),

('ChargePoint', 'https://www.chargepoint.com/', NULL, 'manufacturer',
 ARRAY['ev-charger'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'EV charging equipment and pricing.'),

('ABB E-mobility', 'https://e-mobility.abb.com/', NULL, 'manufacturer',
 ARRAY['ev-charger'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'DC fast charging equipment.'),

-- =====================
-- TRADE ASSOCIATIONS (Reliability: 4)
-- =====================
('SEIA (Solar Energy Industries Association)', 'https://www.seia.org/', 'https://www.seia.org/feed', 'rss_feed',
 ARRAY['solar'], 'mixed', ARRAY['north-america'],
 4, 'quarterly', 'US solar market insights. Quarterly pricing reports.'),

('ACP (American Clean Power)', 'https://cleanpower.org/', NULL, 'web_scrape',
 ARRAY['solar', 'wind', 'bess'], 'market_trends', ARRAY['north-america'],
 4, 'quarterly', 'US clean energy industry data.'),

('ESA (Energy Storage Association)', 'https://energystorage.org/', NULL, 'web_scrape',
 ARRAY['bess'], 'market_trends', ARRAY['north-america'],
 4, 'quarterly', 'US energy storage policy and market data.'),

('WindEurope', 'https://windeurope.org/', NULL, 'web_scrape',
 ARRAY['wind'], 'market_trends', ARRAY['europe'],
 4, 'quarterly', 'European wind market data.'),

('SolarPower Europe', 'https://www.solarpowereurope.org/', NULL, 'web_scrape',
 ARRAY['solar'], 'market_trends', ARRAY['europe'],
 4, 'quarterly', 'European solar market data.')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get active sources by equipment type
CREATE OR REPLACE FUNCTION get_sources_by_equipment(equipment_type TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    url VARCHAR,
    feed_url VARCHAR,
    source_type VARCHAR,
    reliability_score INTEGER,
    last_fetch_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mds.id,
        mds.name,
        mds.url,
        mds.feed_url,
        mds.source_type,
        mds.reliability_score,
        mds.last_fetch_at
    FROM market_data_sources mds
    WHERE mds.is_active = true
      AND (equipment_type = ANY(mds.equipment_categories) OR 'all' = ANY(mds.equipment_categories))
    ORDER BY mds.reliability_score DESC, mds.last_fetch_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function to get RSS-only sources
CREATE OR REPLACE FUNCTION get_rss_sources()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    feed_url VARCHAR,
    equipment_categories TEXT[],
    content_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mds.id,
        mds.name,
        mds.feed_url,
        mds.equipment_categories,
        mds.content_type
    FROM market_data_sources mds
    WHERE mds.is_active = true
      AND mds.source_type = 'rss_feed'
      AND mds.feed_url IS NOT NULL
    ORDER BY mds.reliability_score DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PRICING POLICIES TABLE
-- Defines weights and rules for aggregating market pricing data
-- Created: December 10, 2025
-- ============================================================================

DROP TABLE IF EXISTS pricing_policies CASCADE;

CREATE TABLE IF NOT EXISTS pricing_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Policy identification
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    
    -- Equipment type this policy applies to
    equipment_type VARCHAR(50) NOT NULL CHECK (equipment_type IN (
        'bess', 'solar', 'wind', 'generator', 'inverter', 'ev-charger', 'all'
    )),
    
    -- Source weighting configuration
    -- How much to weight each source type (0-100, total should = 100)
    source_weights JSONB NOT NULL DEFAULT '{
        "government": 35,
        "data_provider": 30,
        "manufacturer": 20,
        "rss_feed": 10,
        "web_scrape": 5,
        "api": 0
    }',
    
    -- Frequency weighting (more recent data gets higher weight)
    frequency_weights JSONB NOT NULL DEFAULT '{
        "real-time": 1.0,
        "daily": 0.95,
        "weekly": 0.85,
        "monthly": 0.70,
        "quarterly": 0.50,
        "annual": 0.30
    }',
    
    -- Reliability score multiplier (applied to source reliability_score 1-5)
    reliability_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    -- Age decay factor (how fast old data loses weight)
    -- Formula: weight = base_weight * (1 / (1 + age_decay * days_old))
    age_decay_factor DECIMAL(5,4) DEFAULT 0.02,
    
    -- Industry guidance overrides
    -- These are floor/ceiling values from NREL, BNEF, etc.
    industry_floor JSONB DEFAULT NULL,  -- Minimum price bounds
    industry_ceiling JSONB DEFAULT NULL,  -- Maximum price bounds
    industry_guidance_weight DECIMAL(3,2) DEFAULT 0.40,  -- How much to weight industry guidance (0-1)
    
    -- Outlier handling
    outlier_std_threshold DECIMAL(3,1) DEFAULT 2.0,  -- Remove outliers > N std deviations
    min_data_points INTEGER DEFAULT 3,  -- Minimum samples needed for weighted average
    
    -- Regional adjustments
    regional_multipliers JSONB DEFAULT '{
        "north-america": 1.0,
        "europe": 1.15,
        "asia-pacific": 0.85,
        "middle-east": 1.05,
        "africa": 1.10,
        "south-america": 1.08
    }',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,  -- Higher priority policies apply first
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- Create indexes
CREATE INDEX idx_pricing_policies_equipment ON pricing_policies(equipment_type);
CREATE INDEX idx_pricing_policies_active ON pricing_policies(is_active) WHERE is_active = true;

-- Add trigger for updated_at
CREATE TRIGGER pricing_policies_updated
    BEFORE UPDATE ON pricing_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_market_sources_timestamp();

-- ============================================================================
-- COLLECTED MARKET PRICES TABLE
-- Stores actual prices extracted from market data sources
-- ============================================================================

DROP TABLE IF EXISTS collected_market_prices CASCADE;

CREATE TABLE IF NOT EXISTS collected_market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source reference
    source_id UUID REFERENCES market_data_sources(id) ON DELETE CASCADE,
    
    -- Price data
    equipment_type VARCHAR(50) NOT NULL,
    price_per_unit DECIMAL(12,4) NOT NULL,  -- Price in base unit (kWh for BESS, Watt for solar, etc.)
    unit VARCHAR(20) NOT NULL,  -- 'kWh', 'W', 'kW', 'unit'
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Context
    region VARCHAR(100),
    capacity_range_min DECIMAL(12,2),  -- Applicable capacity range (e.g., 1-5 MW)
    capacity_range_max DECIMAL(12,2),
    technology VARCHAR(100),  -- 'LFP', 'NMC', 'monocrystalline', etc.
    product_name VARCHAR(255),
    
    -- Data quality
    confidence_score DECIMAL(3,2) DEFAULT 0.5,  -- 0-1 confidence in extraction
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    
    -- Timestamps
    price_date DATE NOT NULL,  -- Date the price was reported
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Raw data for audit
    raw_text TEXT,  -- Original text extracted
    extraction_method VARCHAR(50)  -- 'regex', 'nlp', 'manual', 'api'
);

-- Create indexes
CREATE INDEX idx_collected_prices_type ON collected_market_prices(equipment_type);
CREATE INDEX idx_collected_prices_date ON collected_market_prices(price_date);
CREATE INDEX idx_collected_prices_source ON collected_market_prices(source_id);
CREATE INDEX idx_collected_prices_region ON collected_market_prices(region);
CREATE INDEX idx_collected_prices_verified ON collected_market_prices(is_verified);

-- ============================================================================
-- SEED DEFAULT PRICING POLICIES
-- ============================================================================

INSERT INTO pricing_policies (name, description, equipment_type, source_weights, industry_floor, industry_ceiling, industry_guidance_weight) VALUES

-- BESS Policy - Heavy weight on NREL/BNEF government data
-- Updated Dec 2025: BESS pricing now $100-125/kWh based on latest market quotes
('bess_default', 
 'Default BESS pricing policy - Weighted toward current market quotes and BNEF benchmarks',
 'bess',
 '{
    "government": 40,
    "data_provider": 30,
    "manufacturer": 15,
    "rss_feed": 10,
    "web_scrape": 5,
    "api": 0
 }',
 '{"per_kwh": 100, "per_kw": 150}',
 '{"per_kwh": 175, "per_kw": 250}',
 0.45),

-- Solar Policy - Trust manufacturer and NREL data
('solar_default',
 'Default solar pricing policy - Weighted toward SEIA/NREL data',
 'solar',
 '{
    "government": 35,
    "data_provider": 25,
    "manufacturer": 25,
    "rss_feed": 10,
    "web_scrape": 5,
    "api": 0
 }',
 '{"per_watt_utility": 0.50, "per_watt_commercial": 0.70}',
 '{"per_watt_utility": 1.20, "per_watt_commercial": 1.50}',
 0.40),

-- Wind Policy
('wind_default',
 'Default wind pricing policy - Weighted toward BNEF and government data',
 'wind',
 '{
    "government": 40,
    "data_provider": 35,
    "manufacturer": 15,
    "rss_feed": 8,
    "web_scrape": 2,
    "api": 0
 }',
 '{"per_kw_onshore": 1100, "per_kw_offshore": 3500}',
 '{"per_kw_onshore": 1800, "per_kw_offshore": 5500}',
 0.45),

-- Generator Policy
('generator_default',
 'Default generator pricing policy',
 'generator',
 '{
    "government": 20,
    "data_provider": 20,
    "manufacturer": 40,
    "rss_feed": 10,
    "web_scrape": 10,
    "api": 0
 }',
 '{"diesel_per_kw": 500, "natural_gas_per_kw": 400}',
 '{"diesel_per_kw": 1200, "natural_gas_per_kw": 1000}',
 0.30),

-- EV Charger Policy
('ev_charger_default',
 'Default EV charger pricing policy - Equipment only, excludes installation',
 'ev-charger',
 '{
    "government": 25,
    "data_provider": 25,
    "manufacturer": 35,
    "rss_feed": 10,
    "web_scrape": 5,
    "api": 0
 }',
 '{"level2_per_unit": 400, "dcfc_per_kw": 300, "hpc_per_kw": 350}',
 '{"level2_per_unit": 2500, "dcfc_per_kw": 800, "hpc_per_kw": 900}',
 0.35),

-- Inverter Policy
('inverter_default',
 'Default inverter pricing policy',
 'inverter',
 '{
    "government": 30,
    "data_provider": 30,
    "manufacturer": 25,
    "rss_feed": 10,
    "web_scrape": 5,
    "api": 0
 }',
 '{"per_kw": 50}',
 '{"per_kw": 150}',
 0.35);

-- ============================================================================
-- PRICING CALCULATION FUNCTIONS
-- ============================================================================

-- Function to calculate weighted average price using policy
CREATE OR REPLACE FUNCTION calculate_weighted_price(
    p_equipment_type VARCHAR,
    p_region VARCHAR DEFAULT 'north-america',
    p_capacity_mw DECIMAL DEFAULT 1.0,
    p_technology VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    weighted_price DECIMAL,
    sample_count INTEGER,
    confidence DECIMAL,
    floor_price DECIMAL,
    ceiling_price DECIMAL,
    price_range_low DECIMAL,
    price_range_high DECIMAL
) AS $$
DECLARE
    policy_record RECORD;
    source_weights JSONB;
    freq_weights JSONB;
    regional_mult DECIMAL;
    industry_floor_val DECIMAL;
    industry_ceiling_val DECIMAL;
    industry_weight DECIMAL;
    age_decay DECIMAL;
    outlier_threshold DECIMAL;
    total_weight DECIMAL := 0;
    weighted_sum DECIMAL := 0;
    sample_cnt INTEGER := 0;
    prices_stddev DECIMAL;
    prices_mean DECIMAL;
BEGIN
    -- Get active policy for this equipment type
    SELECT pp.* INTO policy_record
    FROM pricing_policies pp
    WHERE pp.equipment_type = p_equipment_type AND pp.is_active = true
    ORDER BY pp.priority DESC
    LIMIT 1;
    
    -- If no policy, use 'all' type or defaults
    IF policy_record IS NULL THEN
        SELECT pp.* INTO policy_record
        FROM pricing_policies pp
        WHERE pp.equipment_type = 'all' AND pp.is_active = true
        ORDER BY pp.priority DESC
        LIMIT 1;
    END IF;
    
    -- Extract policy values
    source_weights := COALESCE(policy_record.source_weights, '{"government": 35, "data_provider": 30, "manufacturer": 20, "rss_feed": 10, "web_scrape": 5}'::jsonb);
    freq_weights := COALESCE(policy_record.frequency_weights, '{"daily": 0.95, "weekly": 0.85, "monthly": 0.70}'::jsonb);
    regional_mult := COALESCE((policy_record.regional_multipliers->>p_region)::DECIMAL, 1.0);
    age_decay := COALESCE(policy_record.age_decay_factor, 0.02);
    outlier_threshold := COALESCE(policy_record.outlier_std_threshold, 2.0);
    industry_weight := COALESCE(policy_record.industry_guidance_weight, 0.40);
    
    -- Get industry floor/ceiling for the appropriate unit
    -- BESS: Updated Dec 2025 to $100-175/kWh based on latest market quotes
    IF p_equipment_type = 'bess' THEN
        industry_floor_val := COALESCE((policy_record.industry_floor->>'per_kwh')::DECIMAL, 100);
        industry_ceiling_val := COALESCE((policy_record.industry_ceiling->>'per_kwh')::DECIMAL, 175);
    ELSIF p_equipment_type = 'solar' THEN
        IF p_capacity_mw >= 5 THEN
            industry_floor_val := COALESCE((policy_record.industry_floor->>'per_watt_utility')::DECIMAL, 0.50);
            industry_ceiling_val := COALESCE((policy_record.industry_ceiling->>'per_watt_utility')::DECIMAL, 1.20);
        ELSE
            industry_floor_val := COALESCE((policy_record.industry_floor->>'per_watt_commercial')::DECIMAL, 0.70);
            industry_ceiling_val := COALESCE((policy_record.industry_ceiling->>'per_watt_commercial')::DECIMAL, 1.50);
        END IF;
    ELSE
        industry_floor_val := 0;
        industry_ceiling_val := 999999;
    END IF;
    
    -- Calculate mean and stddev for outlier removal
    SELECT AVG(cmp.price_per_unit), STDDEV(cmp.price_per_unit), COUNT(*)
    INTO prices_mean, prices_stddev, sample_cnt
    FROM collected_market_prices cmp
    JOIN market_data_sources mds ON cmp.source_id = mds.id
    WHERE cmp.equipment_type = p_equipment_type
      AND (p_region IS NULL OR cmp.region = p_region OR cmp.region IS NULL)
      AND (p_technology IS NULL OR cmp.technology = p_technology OR cmp.technology IS NULL)
      AND cmp.price_date >= CURRENT_DATE - INTERVAL '90 days';
    
    -- Calculate weighted average
    SELECT 
        SUM(
            cmp.price_per_unit * 
            COALESCE((source_weights->>mds.source_type)::DECIMAL, 5) *
            COALESCE((freq_weights->>mds.data_frequency)::DECIMAL, 0.7) *
            (mds.reliability_score / 5.0) *
            (1.0 / (1.0 + age_decay * EXTRACT(DAY FROM NOW() - cmp.price_date)))
        ),
        SUM(
            COALESCE((source_weights->>mds.source_type)::DECIMAL, 5) *
            COALESCE((freq_weights->>mds.data_frequency)::DECIMAL, 0.7) *
            (mds.reliability_score / 5.0) *
            (1.0 / (1.0 + age_decay * EXTRACT(DAY FROM NOW() - cmp.price_date)))
        )
    INTO weighted_sum, total_weight
    FROM collected_market_prices cmp
    JOIN market_data_sources mds ON cmp.source_id = mds.id
    WHERE cmp.equipment_type = p_equipment_type
      AND (p_region IS NULL OR cmp.region = p_region OR cmp.region IS NULL)
      AND (p_technology IS NULL OR cmp.technology = p_technology OR cmp.technology IS NULL)
      AND cmp.price_date >= CURRENT_DATE - INTERVAL '90 days'
      -- Outlier removal
      AND (prices_stddev IS NULL OR prices_stddev = 0 OR 
           ABS(cmp.price_per_unit - prices_mean) <= outlier_threshold * prices_stddev);
    
    -- Calculate final weighted price with industry guidance blend
    IF total_weight > 0 AND sample_cnt >= COALESCE(policy_record.min_data_points, 3) THEN
        weighted_price := (weighted_sum / total_weight);
        
        -- Blend with industry guidance
        weighted_price := weighted_price * (1 - industry_weight) + 
                          ((industry_floor_val + industry_ceiling_val) / 2) * industry_weight;
        
        -- Apply regional multiplier
        weighted_price := weighted_price * regional_mult;
        
        -- Clamp to floor/ceiling
        weighted_price := GREATEST(industry_floor_val, LEAST(industry_ceiling_val, weighted_price));
        
        confidence := LEAST(1.0, sample_cnt::DECIMAL / 10.0);
    ELSE
        -- Not enough data, return industry midpoint
        weighted_price := ((industry_floor_val + industry_ceiling_val) / 2) * regional_mult;
        confidence := 0.3;
    END IF;
    
    RETURN QUERY SELECT 
        weighted_price,
        sample_cnt,
        confidence,
        industry_floor_val,
        industry_ceiling_val,
        (weighted_price * 0.85)::DECIMAL,
        (weighted_price * 1.15)::DECIMAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Market Data Sources: Public read, admin write
ALTER TABLE market_data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_sources_select" ON market_data_sources
    FOR SELECT USING (true);

CREATE POLICY "market_sources_admin_all" ON market_data_sources
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

ALTER TABLE market_data_sources FORCE ROW LEVEL SECURITY;

-- Pricing Policies: Public read, admin write
ALTER TABLE pricing_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_policies_select" ON pricing_policies
    FOR SELECT USING (true);

CREATE POLICY "pricing_policies_admin_all" ON pricing_policies
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

ALTER TABLE pricing_policies FORCE ROW LEVEL SECURITY;

-- Collected Market Prices: Public read, admin write
ALTER TABLE collected_market_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collected_prices_select" ON collected_market_prices
    FOR SELECT USING (true);

CREATE POLICY "collected_prices_admin_all" ON collected_market_prices
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

ALTER TABLE collected_market_prices FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON market_data_sources TO anon;
GRANT SELECT ON market_data_sources TO authenticated;
GRANT ALL ON market_data_sources TO service_role;

GRANT SELECT ON pricing_policies TO anon;
GRANT SELECT ON pricing_policies TO authenticated;
GRANT ALL ON pricing_policies TO service_role;

GRANT SELECT ON collected_market_prices TO anon;
GRANT SELECT ON collected_market_prices TO authenticated;
GRANT ALL ON collected_market_prices TO service_role;
