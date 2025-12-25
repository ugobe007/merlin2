-- ============================================================================
-- STEP 1 LOCATION DATA MIGRATIONS - COMBINED
-- ============================================================================
-- Created: January 3, 2025
-- Purpose: All migrations for Step 1 location input refactoring
-- 
-- This file combines:
-- 1. ZIP codes table
-- 2. International data tables
-- 3. Solar data cache table
-- 4. Utility rates view
-- 
-- Execute this file in Supabase SQL Editor to create all tables/views.
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: ZIP CODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS zip_codes (
    zip_code VARCHAR(5) PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    state_name VARCHAR(50) NOT NULL,
    county VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    timezone VARCHAR(50),
    area_code VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zip_codes_state_code ON zip_codes(state_code);
CREATE INDEX IF NOT EXISTS idx_zip_codes_city ON zip_codes(city);
CREATE INDEX IF NOT EXISTS idx_zip_codes_state_city ON zip_codes(state_code, city);

COMMENT ON TABLE zip_codes IS 'US ZIP code to city/state mappings for location lookups';
COMMENT ON COLUMN zip_codes.zip_code IS '5-digit US ZIP code (primary key)';
COMMENT ON COLUMN zip_codes.city IS 'City or town name';
COMMENT ON COLUMN zip_codes.state_code IS '2-letter state abbreviation (e.g., CA, NY)';
COMMENT ON COLUMN zip_codes.state_name IS 'Full state name (e.g., California, New York)';

CREATE OR REPLACE FUNCTION update_zip_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_zip_codes_timestamp ON zip_codes;
CREATE TRIGGER update_zip_codes_timestamp
    BEFORE UPDATE ON zip_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_zip_codes_updated_at();

-- ============================================================================
-- MIGRATION 2: INTERNATIONAL DATA TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS international_countries (
    country_code VARCHAR(2) PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL UNIQUE,
    flag_emoji VARCHAR(10),
    currency_symbol VARCHAR(10),
    currency_to_usd DECIMAL(10, 6),
    electricity_rate_usd DECIMAL(6, 4),
    peak_sun_hours DECIMAL(4, 2),
    solar_rating VARCHAR(1),
    wind_potential VARCHAR(10),
    data_source VARCHAR(50) DEFAULT 'manual',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS international_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL REFERENCES international_countries(country_code) ON DELETE CASCADE,
    city_name VARCHAR(100) NOT NULL,
    tier INTEGER CHECK (tier BETWEEN 1 AND 5),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    timezone VARCHAR(50),
    population INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_code, city_name)
);

CREATE INDEX IF NOT EXISTS idx_international_cities_country ON international_cities(country_code);
CREATE INDEX IF NOT EXISTS idx_international_cities_tier ON international_cities(tier);
CREATE INDEX IF NOT EXISTS idx_international_countries_name ON international_countries(country_name);

COMMENT ON TABLE international_countries IS 'International country data including electricity rates and solar potential';
COMMENT ON TABLE international_cities IS 'International cities organized by country and population tier';

CREATE OR REPLACE FUNCTION update_international_cities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_international_cities_timestamp ON international_cities;
CREATE TRIGGER update_international_cities_timestamp
    BEFORE UPDATE ON international_cities
    FOR EACH ROW
    EXECUTE FUNCTION update_international_cities_updated_at();

-- ============================================================================
-- MIGRATION 3: SOLAR DATA CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS solar_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zip_code VARCHAR(5),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    country_code VARCHAR(2),
    city_name VARCHAR(100),
    peak_sun_hours DECIMAL(4, 2) NOT NULL,
    annual_ghi INTEGER,
    annual_dni INTEGER,
    annual_dhi INTEGER,
    solar_rating VARCHAR(1),
    source VARCHAR(50) DEFAULT 'nrel',
    api_response JSONB,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (zip_code IS NOT NULL AND country_code IS NULL) OR
        (zip_code IS NULL AND country_code IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_solar_cache_zip ON solar_data_cache(zip_code) WHERE zip_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_solar_cache_coordinates ON solar_data_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_solar_cache_country ON solar_data_cache(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_solar_cache_expires ON solar_data_cache(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE solar_data_cache IS 'Cache for solar radiation data from APIs (NREL, NASA)';

CREATE OR REPLACE FUNCTION clean_expired_solar_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM solar_data_cache
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW solar_data_current AS
SELECT *
FROM solar_data_cache
WHERE expires_at IS NULL OR expires_at > NOW();

-- ============================================================================
-- MIGRATION 4: UTILITY RATES VIEWS
-- ============================================================================
-- Note: Requires utility_rates table (should already exist from 20251202_utility_rates_table.sql)

CREATE OR REPLACE VIEW utility_rates_summary AS
SELECT 
    state_code,
    state_name,
    COUNT(DISTINCT utility_id) as utility_count,
    AVG(commercial_rate)::DECIMAL(6,4) as avg_commercial_rate,
    MIN(commercial_rate)::DECIMAL(6,4) as min_commercial_rate,
    MAX(commercial_rate)::DECIMAL(6,4) as max_commercial_rate,
    AVG(demand_charge)::DECIMAL(6,2) as avg_demand_charge,
    COUNT(*) FILTER (WHERE has_tou = true) as tou_utilities_count,
    STRING_AGG(DISTINCT solar_potential, ', ' ORDER BY solar_potential) as solar_potentials,
    STRING_AGG(DISTINCT wind_potential, ', ' ORDER BY wind_potential) as wind_potentials,
    MAX(updated_at) as last_updated
FROM utility_rates
GROUP BY state_code, state_name
ORDER BY state_code;

CREATE OR REPLACE VIEW utility_rates_detailed AS
SELECT 
    id,
    state_code,
    state_name,
    utility_id,
    utility_name,
    zip_prefix,
    residential_rate,
    commercial_rate,
    industrial_rate,
    has_tou,
    peak_rate,
    off_peak_rate,
    part_peak_rate,
    peak_hours,
    has_demand_charge,
    demand_charge,
    peak_demand_charge,
    net_metering_available,
    net_metering_type,
    solar_potential,
    wind_potential,
    data_source,
    effective_date,
    created_at,
    updated_at
FROM utility_rates
ORDER BY state_code, utility_name;

COMMENT ON VIEW utility_rates_summary IS 'Summary view of utility rates grouped by state for dashboard display';
COMMENT ON VIEW utility_rates_detailed IS 'Detailed view of all utility rates for detailed dashboard views';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
SELECT 
    'zip_codes' as table_name,
    COUNT(*) as row_count
FROM zip_codes
UNION ALL
SELECT 
    'international_countries' as table_name,
    COUNT(*) as row_count
FROM international_countries
UNION ALL
SELECT 
    'international_cities' as table_name,
    COUNT(*) as row_count
FROM international_cities
UNION ALL
SELECT 
    'solar_data_cache' as table_name,
    COUNT(*) as row_count
FROM solar_data_cache;

-- Verify views created (if utility_rates table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'utility_rates') THEN
        RAISE NOTICE 'Utility rates table exists. Views created.';
        RAISE NOTICE 'Test view: SELECT * FROM utility_rates_summary LIMIT 5;';
    ELSE
        RAISE NOTICE 'Utility rates table does not exist. Views created but will be empty until utility_rates table is populated.';
    END IF;
END $$;

