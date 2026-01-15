-- ============================================================================
-- UTILITY RATES TABLE FOR OPENEI INTEGRATION
-- Created: January 14, 2026
-- Purpose: Cache utility rate data from OpenEI/NREL API
-- 
-- This table stores utility rate data for TrueQuote™ compliance:
-- - Dynamic rate lookups by zip code
-- - Time-of-Use (TOU) schedules
-- - Demand charge structures
-- - Source attribution for every rate
--
-- DATA FLOW:
-- 1. User enters zip code → utilityRateService.ts
-- 2. Service checks this table for cached rates
-- 3. If not found or stale, fetches from OpenEI API
-- 4. Results cached here for performance (24-hour TTL)
-- 5. All rates include source attribution (NREL/EIA/manual)
-- ============================================================================

-- ============================================================================
-- 1. UTILITY RATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS utility_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location
    zip_code VARCHAR(5) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    city VARCHAR(255),
    
    -- Utility identification
    utility_id VARCHAR(50),           -- OpenEI utility ID
    utility_name VARCHAR(255) NOT NULL,
    utility_type VARCHAR(50),         -- investor-owned, municipal, cooperative, federal
    
    -- Rate identification
    rate_id VARCHAR(50),              -- OpenEI rate ID
    rate_name VARCHAR(255),
    rate_type VARCHAR(20) NOT NULL,   -- residential, commercial, industrial
    
    -- Energy charges ($/kWh)
    energy_rate DECIMAL(8, 5) NOT NULL,
    energy_rate_peak DECIMAL(8, 5),
    energy_rate_off_peak DECIMAL(8, 5),
    energy_rate_mid_peak DECIMAL(8, 5),
    
    -- Demand charges ($/kW)
    demand_charge DECIMAL(8, 2),
    demand_charge_peak DECIMAL(8, 2),
    demand_charge_non_coincident DECIMAL(8, 2),
    
    -- Fixed charges
    fixed_charge_monthly DECIMAL(8, 2) DEFAULT 0,
    minimum_bill DECIMAL(8, 2),
    
    -- Time-of-Use schedule (JSONB for flexibility)
    tou_schedule JSONB,
    -- Example: {
    --   "seasons": ["summer", "winter"],
    --   "summer": {
    --     "peak_hours": "14:00-19:00",
    --     "peak_rate": 0.35,
    --     "off_peak_rate": 0.12
    --   }
    -- }
    
    -- Net metering
    net_metering_available BOOLEAN DEFAULT false,
    net_metering_type VARCHAR(50),    -- full-retail, avoided-cost, time-of-export
    
    -- TrueQuote™ Attribution
    data_source VARCHAR(20) NOT NULL DEFAULT 'eia',
    -- Values: 'nrel', 'eia', 'manual', 'openei'
    source_url VARCHAR(500),
    effective_date DATE,
    expiration_date DATE,
    confidence_level VARCHAR(20) DEFAULT 'medium',
    -- Values: 'high', 'medium', 'low'
    
    -- Cache management
    is_active BOOLEAN DEFAULT true,
    cache_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for upserts
    UNIQUE (zip_code, utility_name, rate_type)
);

-- Indexes
DROP INDEX IF EXISTS idx_utility_rates_zip;
DROP INDEX IF EXISTS idx_utility_rates_state;
DROP INDEX IF EXISTS idx_utility_rates_utility;
DROP INDEX IF EXISTS idx_utility_rates_cache;

CREATE INDEX idx_utility_rates_zip ON utility_rates(zip_code);
CREATE INDEX idx_utility_rates_state ON utility_rates(state_code);
CREATE INDEX idx_utility_rates_utility ON utility_rates(utility_id);
CREATE INDEX idx_utility_rates_cache ON utility_rates(cache_expires_at) WHERE is_active = true;

-- ============================================================================
-- 2. UTILITY COMPANIES TABLE (Master list)
-- ============================================================================
CREATE TABLE IF NOT EXISTS utility_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    utility_id VARCHAR(50) UNIQUE NOT NULL,
    eia_id VARCHAR(20),               -- EIA utility ID
    
    -- Company info
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(20),
    utility_type VARCHAR(50),         -- investor-owned, municipal, cooperative, federal
    
    -- Location
    state_code VARCHAR(2) NOT NULL,
    service_territory TEXT,
    headquarters_city VARCHAR(255),
    
    -- Size
    customer_count INTEGER,
    residential_customers INTEGER,
    commercial_customers INTEGER,
    industrial_customers INTEGER,
    
    -- Contact
    website VARCHAR(500),
    phone VARCHAR(20),
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
DROP INDEX IF EXISTS idx_utility_companies_state;
DROP INDEX IF EXISTS idx_utility_companies_eia;

CREATE INDEX idx_utility_companies_state ON utility_companies(state_code);
CREATE INDEX idx_utility_companies_eia ON utility_companies(eia_id);

-- ============================================================================
-- 3. UTILITY SERVICE TERRITORIES (Zip code mapping)
-- ============================================================================
CREATE TABLE IF NOT EXISTS utility_service_territories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    zip_code VARCHAR(5) NOT NULL,
    utility_id VARCHAR(50) NOT NULL REFERENCES utility_companies(utility_id),
    is_primary BOOLEAN DEFAULT false, -- Primary utility for this zip
    coverage_pct DECIMAL(5, 2),       -- % of zip covered by this utility
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE (zip_code, utility_id)
);

-- Index for zip lookup
DROP INDEX IF EXISTS idx_utility_territories_zip;
CREATE INDEX idx_utility_territories_zip ON utility_service_territories(zip_code);

-- ============================================================================
-- 4. UPDATE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_utility_rates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS utility_rates_updated ON utility_rates;
CREATE TRIGGER utility_rates_updated
    BEFORE UPDATE ON utility_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_utility_rates_timestamp();

DROP TRIGGER IF EXISTS utility_companies_updated ON utility_companies;
CREATE TRIGGER utility_companies_updated
    BEFORE UPDATE ON utility_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_utility_rates_timestamp();

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================
ALTER TABLE utility_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_service_territories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read on utility_rates" ON utility_rates;
CREATE POLICY "Allow public read on utility_rates"
    ON utility_rates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on utility_companies" ON utility_companies;
CREATE POLICY "Allow public read on utility_companies"
    ON utility_companies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on utility_territories" ON utility_service_territories;
CREATE POLICY "Allow public read on utility_territories"
    ON utility_service_territories FOR SELECT USING (true);

-- Allow authenticated users to write (for data sync)
DROP POLICY IF EXISTS "Allow authenticated write on utility_rates" ON utility_rates;
CREATE POLICY "Allow authenticated write on utility_rates"
    ON utility_rates FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated write on utility_companies" ON utility_companies;
CREATE POLICY "Allow authenticated write on utility_companies"
    ON utility_companies FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated write on utility_territories" ON utility_service_territories;
CREATE POLICY "Allow authenticated write on utility_territories"
    ON utility_service_territories FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- 6. SEED DATA: Major Utility Companies
-- ============================================================================
INSERT INTO utility_companies (utility_id, eia_id, name, abbreviation, utility_type, state_code, customer_count, website)
VALUES
-- California
('pge', '14328', 'Pacific Gas & Electric', 'PG&E', 'investor-owned', 'CA', 5500000, 'https://www.pge.com'),
('sce', '17609', 'Southern California Edison', 'SCE', 'investor-owned', 'CA', 5000000, 'https://www.sce.com'),
('sdge', '16609', 'San Diego Gas & Electric', 'SDG&E', 'investor-owned', 'CA', 1500000, 'https://www.sdge.com'),
('ladwp', '11208', 'Los Angeles Dept of Water & Power', 'LADWP', 'municipal', 'CA', 1400000, 'https://www.ladwp.com'),

-- Texas
('oncor', '15444', 'Oncor Electric Delivery', NULL, 'investor-owned', 'TX', 3700000, 'https://www.oncor.com'),
('centerpoint', '17006', 'CenterPoint Energy', NULL, 'investor-owned', 'TX', 2500000, 'https://www.centerpointenergy.com'),
('aep-texas', '894', 'AEP Texas', NULL, 'investor-owned', 'TX', 1000000, 'https://www.aeptexas.com'),

-- Florida
('fpl', '6455', 'Florida Power & Light', 'FPL', 'investor-owned', 'FL', 5600000, 'https://www.fpl.com'),
('duke-fl', '6909', 'Duke Energy Florida', NULL, 'investor-owned', 'FL', 1900000, 'https://www.duke-energy.com'),
('teco', '18454', 'Tampa Electric Company', 'TECO', 'investor-owned', 'FL', 800000, 'https://www.tampaelectric.com'),

-- New York
('coned', '4226', 'Consolidated Edison', 'ConEd', 'investor-owned', 'NY', 3500000, 'https://www.coned.com'),
('nyseg', '13511', 'New York State Electric & Gas', 'NYSEG', 'investor-owned', 'NY', 900000, 'https://www.nyseg.com'),
('national-grid-ny', '13434', 'National Grid NY', NULL, 'investor-owned', 'NY', 1600000, 'https://www.nationalgridus.com'),

-- Michigan
('dte', '5416', 'DTE Energy', NULL, 'investor-owned', 'MI', 2200000, 'https://www.dteenergy.com'),
('consumers', '4254', 'Consumers Energy', NULL, 'investor-owned', 'MI', 1800000, 'https://www.consumersenergy.com'),

-- Illinois
('comed', '4110', 'Commonwealth Edison', 'ComEd', 'investor-owned', 'IL', 4000000, 'https://www.comed.com'),
('ameren-il', '959', 'Ameren Illinois', NULL, 'investor-owned', 'IL', 1200000, 'https://www.ameren.com'),

-- Pennsylvania
('peco', '14716', 'PECO Energy', NULL, 'investor-owned', 'PA', 1600000, 'https://www.peco.com'),
('ppl', '14902', 'PPL Electric Utilities', NULL, 'investor-owned', 'PA', 1400000, 'https://www.pplelectric.com'),

-- Georgia
('georgia-power', '7140', 'Georgia Power', NULL, 'investor-owned', 'GA', 2700000, 'https://www.georgiapower.com'),

-- North Carolina
('duke-nc', '5419', 'Duke Energy Carolinas', NULL, 'investor-owned', 'NC', 2600000, 'https://www.duke-energy.com'),
('duke-progress', '5423', 'Duke Energy Progress', NULL, 'investor-owned', 'NC', 1600000, 'https://www.duke-energy.com'),

-- Ohio
('aep-ohio', '893', 'AEP Ohio', NULL, 'investor-owned', 'OH', 1500000, 'https://www.aepohio.com'),
('firstenergy-oh', '13998', 'FirstEnergy Ohio', NULL, 'investor-owned', 'OH', 2100000, 'https://www.firstenergycorp.com'),

-- New Jersey
('pseg', '15477', 'Public Service Electric & Gas', 'PSE&G', 'investor-owned', 'NJ', 2300000, 'https://www.pseg.com'),
('jcpl', '17539', 'Jersey Central Power & Light', 'JCP&L', 'investor-owned', 'NJ', 1100000, 'https://www.firstenergycorp.com'),

-- Arizona
('aps', '803', 'Arizona Public Service', 'APS', 'investor-owned', 'AZ', 1300000, 'https://www.aps.com'),
('srp', '16572', 'Salt River Project', 'SRP', 'municipal', 'AZ', 1100000, 'https://www.srpnet.com'),

-- Massachusetts
('national-grid-ma', '13434', 'National Grid MA', NULL, 'investor-owned', 'MA', 1300000, 'https://www.nationalgridus.com'),
('eversource-ma', '13439', 'Eversource MA', NULL, 'investor-owned', 'MA', 1400000, 'https://www.eversource.com'),

-- Nevada
('nv-energy', '13407', 'NV Energy', NULL, 'investor-owned', 'NV', 1400000, 'https://www.nvenergy.com')

ON CONFLICT (utility_id) DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Utility rates tables created successfully:';
    RAISE NOTICE '    - utility_rates: Rate cache by zip code';
    RAISE NOTICE '    - utility_companies: Master utility list';
    RAISE NOTICE '    - utility_service_territories: Zip-to-utility mapping';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Seeded 30 major utility companies';
    RAISE NOTICE '';
    RAISE NOTICE 'TRUEQUOTE™ COMPLIANCE:';
    RAISE NOTICE '    - All rates include source attribution';
    RAISE NOTICE '    - Supports NREL/EIA/OpenEI sources';
    RAISE NOTICE '    - 24-hour cache for API performance';
END $$;
