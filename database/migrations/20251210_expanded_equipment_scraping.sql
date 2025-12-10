-- ============================================================================
-- EXPANDED EQUIPMENT CATEGORIES AND TOPICS
-- Adds new equipment types: BMS, ESS, transformers, switchgear, panels, etc.
-- Adds regulatory/policy tracking
-- Created: December 10, 2025
-- ============================================================================

-- ============================================================================
-- 1. UPDATE EQUIPMENT CATEGORIES CONSTRAINT
-- ============================================================================

-- First, let's add more granular equipment categories
ALTER TABLE market_data_sources 
DROP CONSTRAINT IF EXISTS market_data_sources_equipment_categories_check;

-- Add comment documenting allowed categories
COMMENT ON COLUMN market_data_sources.equipment_categories IS 
'Allowed values: bess, solar, wind, generator, inverter, ev-charger, transformer, switchgear, dc-panel, ac-panel, bms, ess, microgrid, hybrid-system, linear-generator, all';

-- ============================================================================
-- 2. CREATE REGULATORY TRACKING TABLE
-- ============================================================================

DROP TABLE IF EXISTS regulatory_updates CASCADE;

CREATE TABLE IF NOT EXISTS regulatory_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Regulation identification
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    full_text TEXT,
    
    -- Classification
    regulation_type VARCHAR(50) NOT NULL CHECK (regulation_type IN (
        'tax_credit',         -- ITC, PTC, etc.
        'rebate',             -- State/utility rebates
        'incentive',          -- Performance incentives
        'tariff',             -- Import/export tariffs
        'interconnection',    -- Grid interconnection rules
        'permitting',         -- Permitting requirements
        'safety',             -- Safety regulations (UL, NEC, etc.)
        'environmental',      -- Environmental regulations
        'rate_structure',     -- Utility rate changes
        'net_metering',       -- Net metering policies
        'other'
    )),
    
    -- Scope
    jurisdiction VARCHAR(100) NOT NULL,  -- 'federal', 'state:CA', 'utility:PG&E', etc.
    affected_equipment TEXT[] DEFAULT '{}',
    affected_sectors TEXT[] DEFAULT '{}',  -- 'residential', 'commercial', 'utility', 'industrial'
    
    -- Impact assessment
    financial_impact JSONB DEFAULT '{}',
    -- Structure: { "itc_percentage": 30, "rebate_per_kw": 500, "effective_date": "2025-01-01" }
    
    -- Dates
    effective_date DATE,
    expiration_date DATE,
    announced_date DATE,
    
    -- Source
    source_url VARCHAR(500),
    source_name VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('proposed', 'enacted', 'active', 'expired', 'repealed')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_regulatory_type ON regulatory_updates(regulation_type);
CREATE INDEX idx_regulatory_jurisdiction ON regulatory_updates(jurisdiction);
CREATE INDEX idx_regulatory_status ON regulatory_updates(status);
CREATE INDEX idx_regulatory_equipment ON regulatory_updates USING GIN(affected_equipment);
CREATE INDEX idx_regulatory_effective ON regulatory_updates(effective_date);

-- ============================================================================
-- 3. CREATE SCRAPE JOBS TABLE
-- ============================================================================

DROP TABLE IF EXISTS scrape_jobs CASCADE;

CREATE TABLE IF NOT EXISTS scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Job identification
    source_id UUID REFERENCES market_data_sources(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN (
        'rss_fetch',
        'web_scrape',
        'api_call',
        'price_extraction',
        'regulation_check'
    )),
    
    -- Scheduling
    schedule_cron VARCHAR(100) DEFAULT '0 6 * * *',  -- Default: 6 AM daily
    is_enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5,  -- 1-10, higher = more important
    
    -- Execution tracking
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status VARCHAR(50),  -- 'success', 'partial', 'failed', 'skipped'
    last_run_duration_ms INTEGER,
    last_error TEXT,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Rate limiting
    min_interval_minutes INTEGER DEFAULT 60,
    max_retries INTEGER DEFAULT 3,
    
    -- Results
    items_found INTEGER DEFAULT 0,
    items_new INTEGER DEFAULT 0,
    prices_extracted INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scrape_jobs_source ON scrape_jobs(source_id);
CREATE INDEX idx_scrape_jobs_enabled ON scrape_jobs(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_scrape_jobs_schedule ON scrape_jobs(schedule_cron);

-- ============================================================================
-- 4. CREATE SCRAPED ARTICLES TABLE
-- ============================================================================

DROP TABLE IF EXISTS scraped_articles CASCADE;

CREATE TABLE IF NOT EXISTS scraped_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source reference
    source_id UUID REFERENCES market_data_sources(id) ON DELETE CASCADE,
    
    -- Article data
    title VARCHAR(500) NOT NULL,
    url VARCHAR(1000) NOT NULL UNIQUE,
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Content
    summary TEXT,
    full_content TEXT,
    
    -- Classification (AI-assigned)
    topics TEXT[] DEFAULT '{}',
    equipment_mentioned TEXT[] DEFAULT '{}',
    regions_mentioned TEXT[] DEFAULT '{}',
    companies_mentioned TEXT[] DEFAULT '{}',
    
    -- Extracted data
    prices_extracted JSONB DEFAULT '[]',
    -- Structure: [{ "equipment": "bess", "price": 125, "unit": "kWh", "context": "..." }]
    
    regulations_mentioned JSONB DEFAULT '[]',
    -- Structure: [{ "name": "ITC", "detail": "30% extended", "effective": "2025-01-01" }]
    
    -- Sentiment/relevance
    relevance_score DECIMAL(3,2) DEFAULT 0.5,  -- 0-1 how relevant to our needs
    sentiment VARCHAR(20),  -- 'positive', 'negative', 'neutral'
    
    -- Processing status
    is_processed BOOLEAN DEFAULT false,
    processing_error TEXT,
    
    -- Metadata
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_articles_source ON scraped_articles(source_id);
CREATE INDEX idx_articles_published ON scraped_articles(published_at);
CREATE INDEX idx_articles_topics ON scraped_articles USING GIN(topics);
CREATE INDEX idx_articles_equipment ON scraped_articles USING GIN(equipment_mentioned);
CREATE INDEX idx_articles_processed ON scraped_articles(is_processed);
CREATE INDEX idx_articles_url ON scraped_articles(url);

-- ============================================================================
-- 5. ADD NEW MARKET DATA SOURCES FOR EXPANDED EQUIPMENT
-- ============================================================================

INSERT INTO market_data_sources (name, url, feed_url, source_type, equipment_categories, content_type, regions, reliability_score, data_frequency, notes) VALUES

-- =====================
-- TRANSFORMERS & SWITCHGEAR
-- =====================
('T&D World', 'https://www.tdworld.com', 'https://www.tdworld.com/rss.xml', 'rss_feed',
 ARRAY['transformer', 'switchgear'], 'mixed', ARRAY['global'],
 4, 'daily', 'Transmission & distribution equipment news. Transformers, switchgear, substations.'),

('Power Engineering', 'https://www.power-eng.com', 'https://www.power-eng.com/feed/', 'rss_feed',
 ARRAY['transformer', 'switchgear', 'generator'], 'mixed', ARRAY['global'],
 4, 'daily', 'Power generation and T&D equipment.'),

('Hitachi Energy Transformers', 'https://www.hitachienergy.com/products-and-solutions/transformers', NULL, 'manufacturer',
 ARRAY['transformer'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Major transformer manufacturer. Product specs and pricing signals.'),

('ABB Transformers', 'https://new.abb.com/products/transformers', NULL, 'manufacturer',
 ARRAY['transformer'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'ABB transformer product line.'),

('Siemens Switchgear', 'https://www.siemens.com/global/en/products/energy/medium-voltage/switchgear.html', NULL, 'manufacturer',
 ARRAY['switchgear'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Siemens medium voltage switchgear.'),

('Eaton Switchgear', 'https://www.eaton.com/us/en-us/products/medium-voltage-power-distribution-control-systems/switchgear.html', NULL, 'manufacturer',
 ARRAY['switchgear'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Eaton switchgear products.'),

('Schneider Electric Switchgear', 'https://www.se.com/us/en/product-category/4100-medium-voltage-switchgear/', NULL, 'manufacturer',
 ARRAY['switchgear'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Schneider Electric MV switchgear.'),

-- =====================
-- INVERTERS
-- =====================
('SMA Solar Inverters', 'https://www.sma-america.com/', NULL, 'manufacturer',
 ARRAY['inverter'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Leading solar inverter manufacturer.'),

('Enphase Energy', 'https://enphase.com/', NULL, 'manufacturer',
 ARRAY['inverter', 'bms'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Microinverters and energy management.'),

('SolarEdge', 'https://www.solaredge.com/', NULL, 'manufacturer',
 ARRAY['inverter', 'bess'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Power optimizers and inverters.'),

('Fronius', 'https://www.fronius.com/en-us/usa/solar-energy', NULL, 'manufacturer',
 ARRAY['inverter'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Solar inverters and hybrid systems.'),

-- =====================
-- BMS (Battery Management Systems)
-- =====================
('Powin BMS', 'https://powin.com/', NULL, 'manufacturer',
 ARRAY['bms', 'bess'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Utility-scale BESS with advanced BMS.'),

('Stem Inc', 'https://www.stem.com/', NULL, 'manufacturer',
 ARRAY['bms', 'bess'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'AI-driven energy storage and BMS.'),

('NEC Energy Solutions', 'https://www.neces.com/', NULL, 'manufacturer',
 ARRAY['bms', 'bess'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Grid-scale storage with integrated BMS.'),

-- =====================
-- MICROGRIDS & HYBRID SYSTEMS
-- =====================
('Microgrid Knowledge', 'https://www.microgridknowledge.com', 'https://www.microgridknowledge.com/feed/', 'rss_feed',
 ARRAY['microgrid', 'hybrid-system', 'bess'], 'mixed', ARRAY['global'],
 4, 'daily', 'Microgrid news, projects, and technology.'),

('Aggreko Microgrids', 'https://www.aggreko.com/en-us/sectors/utilities/microgrids', NULL, 'manufacturer',
 ARRAY['microgrid', 'generator'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Temporary and permanent microgrid solutions.'),

('Schneider Microgrids', 'https://www.se.com/us/en/work/solutions/microgrids/', NULL, 'manufacturer',
 ARRAY['microgrid', 'hybrid-system'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Enterprise microgrid solutions.'),

('ABB Microgrids', 'https://new.abb.com/distributed-energy-microgrids', NULL, 'manufacturer',
 ARRAY['microgrid', 'hybrid-system'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'ABB microgrid and DER solutions.'),

-- =====================
-- LINEAR GENERATORS (Mainspring, etc.)
-- =====================
('Mainspring Energy', 'https://mainspringenergy.com/', NULL, 'manufacturer',
 ARRAY['linear-generator', 'generator'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Linear generator technology. Fuel-flexible power.'),

('Heliogen', 'https://heliogen.com/', NULL, 'manufacturer',
 ARRAY['generator', 'solar'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Concentrated solar and clean fuel generation.'),

-- =====================
-- EV CHARGERS (ALL LEVELS)
-- =====================
('Electrify America', 'https://www.electrifyamerica.com/', NULL, 'manufacturer',
 ARRAY['ev-charger'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'DC fast charging network. Level 3/DCFC pricing.'),

('EVgo', 'https://www.evgo.com/', NULL, 'manufacturer',
 ARRAY['ev-charger'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Public fast charging. Pricing data.'),

('Tesla Supercharger', 'https://www.tesla.com/supercharger', NULL, 'manufacturer',
 ARRAY['ev-charger'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'Tesla Supercharger network and pricing.'),

('Tritium', 'https://tritiumcharging.com/', NULL, 'manufacturer',
 ARRAY['ev-charger'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'DC fast charger manufacturer.'),

('BTC Power', 'https://www.btcpower.com/', NULL, 'manufacturer',
 ARRAY['ev-charger'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Level 2 and DC fast chargers.'),

('ClipperCreek', 'https://clippercreek.com/', NULL, 'manufacturer',
 ARRAY['ev-charger'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Level 1 and Level 2 EV chargers.'),

('JuiceBox (Enel X)', 'https://evcharging.enelx.com/', NULL, 'manufacturer',
 ARRAY['ev-charger'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Smart Level 2 charging.'),

-- =====================
-- AI ENERGY MANAGEMENT
-- =====================
('AutoGrid', 'https://www.auto-grid.com/', NULL, 'manufacturer',
 ARRAY['bms', 'bess'], 'product_specs', ARRAY['global'],
 4, 'quarterly', 'AI-powered energy management platform.'),

('Leap', 'https://www.leap.energy/', NULL, 'manufacturer',
 ARRAY['bms', 'bess'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Distributed energy resource management.'),

('Swell Energy', 'https://www.swellenergy.com/', NULL, 'manufacturer',
 ARRAY['bms', 'bess'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Virtual power plant and energy management.'),

('Opus One Solutions', 'https://www.opusonesolutions.com/', NULL, 'manufacturer',
 ARRAY['bms', 'microgrid'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Grid analytics and DER management.'),

-- =====================
-- REGULATORY / POLICY SOURCES
-- =====================
('DSIRE (Database of State Incentives)', 'https://www.dsireusa.org/', NULL, 'government',
 ARRAY['all'], 'policy', ARRAY['north-america'],
 5, 'weekly', 'Comprehensive US renewable energy incentives database. Primary source for rebates/credits.'),

('DOE Office of Energy Efficiency', 'https://www.energy.gov/eere/office-energy-efficiency-renewable-energy', 'https://www.energy.gov/eere/rss.xml', 'government',
 ARRAY['all'], 'policy', ARRAY['north-america'],
 5, 'weekly', 'Federal energy efficiency programs and incentives.'),

('EPA ENERGY STAR', 'https://www.energystar.gov/', NULL, 'government',
 ARRAY['all'], 'policy', ARRAY['north-america'],
 5, 'monthly', 'Energy Star certifications and rebates.'),

('FERC News', 'https://www.ferc.gov/news-events', 'https://www.ferc.gov/rss.xml', 'government',
 ARRAY['all'], 'policy', ARRAY['north-america'],
 5, 'daily', 'Federal Energy Regulatory Commission. Grid interconnection, wholesale markets.'),

('CPUC (California)', 'https://www.cpuc.ca.gov/', NULL, 'government',
 ARRAY['all'], 'policy', ARRAY['north-america'],
 5, 'weekly', 'California Public Utilities Commission. Leading state for clean energy policy.'),

('NYSERDA', 'https://www.nyserda.ny.gov/', NULL, 'government',
 ARRAY['all'], 'policy', ARRAY['north-america'],
 5, 'weekly', 'New York State Energy Research. Major incentive programs.'),

('Texas PUC', 'https://www.puc.texas.gov/', NULL, 'government',
 ARRAY['all'], 'policy', ARRAY['north-america'],
 5, 'weekly', 'Texas Public Utility Commission. ERCOT market rules.'),

('Utility Dive Regulation', 'https://www.utilitydive.com/topic/regulation/', 'https://www.utilitydive.com/feeds/topic/regulation/', 'rss_feed',
 ARRAY['all'], 'policy', ARRAY['north-america'],
 4, 'daily', 'Utility regulation news and analysis.'),

('Canary Media Policy', 'https://www.canarymedia.com/topics/policy', NULL, 'rss_feed',
 ARRAY['all'], 'policy', ARRAY['north-america'],
 4, 'daily', 'Clean energy policy news.'),

('IRS Energy Credits', 'https://www.irs.gov/credits-deductions/credits-for-new-clean-vehicles', NULL, 'government',
 ARRAY['ev-charger', 'bess', 'solar'], 'policy', ARRAY['north-america'],
 5, 'monthly', 'IRS clean energy tax credits. ITC, PTC, EV credits.')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. CREATE DEFAULT SCRAPE JOBS FOR ALL RSS SOURCES
-- ============================================================================

INSERT INTO scrape_jobs (source_id, job_type, schedule_cron, priority)
SELECT 
    id,
    CASE 
        WHEN source_type = 'rss_feed' THEN 'rss_fetch'
        WHEN source_type = 'government' THEN 'regulation_check'
        ELSE 'web_scrape'
    END,
    CASE 
        WHEN reliability_score = 5 THEN '0 6 * * *'    -- 6 AM daily for top sources
        WHEN reliability_score = 4 THEN '0 7 * * *'    -- 7 AM daily
        WHEN reliability_score = 3 THEN '0 8 * * 1,4'  -- Mon/Thu for lower reliability
        ELSE '0 9 * * 1'                                -- Weekly for lowest
    END,
    reliability_score * 2  -- Priority based on reliability
FROM market_data_sources
WHERE is_active = true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. RLS POLICIES FOR NEW TABLES
-- ============================================================================

ALTER TABLE regulatory_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regulatory_select" ON regulatory_updates FOR SELECT USING (true);
CREATE POLICY "regulatory_admin_all" ON regulatory_updates FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scrape_jobs_select" ON scrape_jobs FOR SELECT USING (true);
CREATE POLICY "scrape_jobs_admin_all" ON scrape_jobs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

ALTER TABLE scraped_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scraped_articles_select" ON scraped_articles FOR SELECT USING (true);
CREATE POLICY "scraped_articles_admin_all" ON scraped_articles FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON regulatory_updates TO anon;
GRANT SELECT ON regulatory_updates TO authenticated;
GRANT ALL ON regulatory_updates TO service_role;

GRANT SELECT ON scrape_jobs TO anon;
GRANT SELECT ON scrape_jobs TO authenticated;
GRANT ALL ON scrape_jobs TO service_role;

GRANT SELECT ON scraped_articles TO anon;
GRANT SELECT ON scraped_articles TO authenticated;
GRANT ALL ON scraped_articles TO service_role;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- New tables created:
-- 1. regulatory_updates - Track tax credits, rebates, tariffs, interconnection rules
-- 2. scrape_jobs - Schedule and track scraping jobs
-- 3. scraped_articles - Store fetched content for processing
--
-- New equipment categories added:
-- - transformer, switchgear, dc-panel, ac-panel
-- - bms (Battery Management Systems)
-- - ess (Energy Storage Systems - broader than BESS)
-- - microgrid, hybrid-system
-- - linear-generator
--
-- New sources added: ~45
-- - Transformers/Switchgear: 7 sources
-- - Inverters: 4 sources
-- - BMS: 3 sources
-- - Microgrids: 4 sources
-- - Linear generators: 2 sources
-- - EV Chargers: 7 sources
-- - AI Energy Management: 4 sources
-- - Regulatory/Policy: 10 sources
-- ============================================================================
