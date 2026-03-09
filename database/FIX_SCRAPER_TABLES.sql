-- ============================================================================
-- FIX MARKET DATA SCRAPER - Create Missing Tables + Fix RLS
-- Run this in Supabase SQL Editor
-- Created: March 8, 2026
-- ============================================================================

-- ============================================================================
-- 1. CREATE SCRAPE_JOBS TABLE
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
    schedule_cron VARCHAR(100),  -- Cron expression for scheduling
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    
    -- Execution tracking
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Configuration
    priority INTEGER DEFAULT 0,  -- Higher priority runs first
    timeout_seconds INTEGER DEFAULT 60,
    retry_attempts INTEGER DEFAULT 3,
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scrape_jobs_source ON scrape_jobs(source_id);
CREATE INDEX idx_scrape_jobs_enabled ON scrape_jobs(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_scrape_jobs_schedule ON scrape_jobs(schedule_cron);

-- ============================================================================
-- 2. CREATE SCRAPED_ARTICLES TABLE
-- ============================================================================

DROP TABLE IF EXISTS scraped_articles CASCADE;

CREATE TABLE IF NOT EXISTS scraped_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source reference
    source_id UUID REFERENCES market_data_sources(id) ON DELETE CASCADE,
    
    -- Article metadata
    title VARCHAR(500) NOT NULL,
    url VARCHAR(500) NOT NULL UNIQUE,
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Content
    content TEXT,
    excerpt TEXT,
    
    -- Classification (populated by NLP)
    topics TEXT[] DEFAULT '{}',
    -- Examples: 'pricing', 'market_analysis', 'policy', 'product_launch', 'project_announcement'
    
    equipment_mentioned TEXT[] DEFAULT '{}',
    -- Examples: 'bess', 'solar', 'wind', 'ev-charger'
    
    relevance_score DECIMAL(3,2) DEFAULT 0.5,  -- 0-1, how relevant to our pricing needs
    
    -- Processing status
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Extracted data
    prices_extracted JSONB DEFAULT '[]',
    -- Structure: [{ equipment: 'bess', price: 125, unit: 'kWh', context: '...' }]
    
    regulations_mentioned JSONB DEFAULT '[]',
    -- Structure: [{ type: 'tax_credit', jurisdiction: 'federal', amount: 30 }]
    
    -- Timestamps
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_articles_source ON scraped_articles(source_id);
CREATE INDEX idx_articles_published ON scraped_articles(published_at);
CREATE INDEX idx_articles_topics ON scraped_articles USING GIN(topics);
CREATE INDEX idx_articles_equipment ON scraped_articles USING GIN(equipment_mentioned);
CREATE INDEX idx_articles_processed ON scraped_articles(is_processed);
CREATE INDEX idx_articles_url ON scraped_articles(url);

-- ============================================================================
-- 3. CREATE REGULATORY_UPDATES TABLE (OPTIONAL - FOR FUTURE)
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
        'tax_credit', 'rebate', 'incentive', 'tariff', 'interconnection',
        'permitting', 'safety', 'environmental', 'rate_structure', 'net_metering', 'other'
    )),
    
    -- Scope
    jurisdiction VARCHAR(100) NOT NULL,
    affected_equipment TEXT[] DEFAULT '{}',
    affected_sectors TEXT[] DEFAULT '{}',
    
    -- Impact assessment
    financial_impact JSONB DEFAULT '{}',
    
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

-- ============================================================================
-- 4. FIX RLS POLICIES - ALLOW SERVICE_ROLE ACCESS
-- ============================================================================

-- Market Data Sources (already has correct RLS, but verify)
ALTER TABLE market_data_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_sources_select" ON market_data_sources;
DROP POLICY IF EXISTS "market_sources_admin_all" ON market_data_sources;

CREATE POLICY "market_sources_select" ON market_data_sources
    FOR SELECT USING (true);

CREATE POLICY "market_sources_service_all" ON market_data_sources
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        (auth.jwt() ->> 'role') = 'admin'
    );

-- Scrape Jobs
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scrape_jobs_select" ON scrape_jobs
    FOR SELECT USING (true);

CREATE POLICY "scrape_jobs_service_all" ON scrape_jobs
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        (auth.jwt() ->> 'role') = 'admin'
    );

-- Scraped Articles
ALTER TABLE scraped_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scraped_articles_select" ON scraped_articles
    FOR SELECT USING (true);

CREATE POLICY "scraped_articles_service_all" ON scraped_articles
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        (auth.jwt() ->> 'role') = 'admin'
    );

-- Regulatory Updates
ALTER TABLE regulatory_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regulatory_select" ON regulatory_updates
    FOR SELECT USING (true);

CREATE POLICY "regulatory_service_all" ON regulatory_updates
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        (auth.jwt() ->> 'role') = 'admin'
    );

-- Collected Market Prices (verify it has service_role access)
DROP POLICY IF EXISTS "collected_prices_admin_all" ON collected_market_prices;

CREATE POLICY "collected_prices_service_all" ON collected_market_prices
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        (auth.jwt() ->> 'role') = 'admin'
    );

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON scrape_jobs TO anon;
GRANT SELECT ON scrape_jobs TO authenticated;
GRANT ALL ON scrape_jobs TO service_role;

GRANT SELECT ON scraped_articles TO anon;
GRANT SELECT ON scraped_articles TO authenticated;
GRANT ALL ON scraped_articles TO service_role;

GRANT SELECT ON regulatory_updates TO anon;
GRANT SELECT ON regulatory_updates TO authenticated;
GRANT ALL ON regulatory_updates TO service_role;

-- Verify collected_market_prices has service_role access
GRANT ALL ON collected_market_prices TO service_role;

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================

-- Check tables exist
SELECT 
    tablename,
    CASE WHEN has_table_privilege('service_role', tablename, 'INSERT') 
         THEN 'YES' ELSE 'NO' END as service_role_can_insert
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('scraped_articles', 'scrape_jobs', 'collected_market_prices', 'market_data_sources')
ORDER BY tablename;

-- Check RLS policies
SELECT 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual::text as policy_definition
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('scraped_articles', 'scrape_jobs', 'collected_market_prices', 'market_data_sources')
ORDER BY tablename, policyname;

-- ============================================================================
-- DONE! Tables created with service_role access enabled.
-- Re-run the GitHub Actions workflow now.
-- ============================================================================
