-- ============================================================================
-- SOLAR DATA CACHE TABLE MIGRATION
-- ============================================================================
-- Created: January 3, 2025
-- Purpose: Cache solar radiation data from NREL PVWatts/NASA POWER APIs
-- Source: NREL PVWatts API, NASA POWER API (with database cache)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create solar_data_cache table
-- ============================================================================

CREATE TABLE IF NOT EXISTS solar_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zip_code VARCHAR(5), -- For US locations
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    country_code VARCHAR(2), -- For international locations
    city_name VARCHAR(100),
    
    -- Solar Radiation Data
    peak_sun_hours DECIMAL(4, 2) NOT NULL, -- Daily average peak sun hours
    annual_ghi INTEGER, -- Annual Global Horizontal Irradiance (kWh/m²/year)
    annual_dni INTEGER, -- Annual Direct Normal Irradiance (kWh/m²/year)
    annual_dhi INTEGER, -- Annual Diffuse Horizontal Irradiance (kWh/m²/year)
    
    -- Calculated Ratings
    solar_rating VARCHAR(1), -- A (≥5.5 hrs), B (≥4.5), C (≥4.0), D (≥3.5), F (<3.5)
    
    -- Metadata
    source VARCHAR(50) DEFAULT 'nrel', -- 'nrel', 'nasa', 'static', 'manual'
    api_response JSONB, -- Store full API response for debugging
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Cache expiration (typically 30-90 days)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (
        (zip_code IS NOT NULL AND country_code IS NULL) OR
        (zip_code IS NULL AND country_code IS NOT NULL)
    )
);

-- ============================================================================
-- STEP 2: Create indexes for fast lookups
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_solar_cache_zip ON solar_data_cache(zip_code) WHERE zip_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_solar_cache_coordinates ON solar_data_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_solar_cache_country ON solar_data_cache(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_solar_cache_expires ON solar_data_cache(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- STEP 3: Add comments
-- ============================================================================

COMMENT ON TABLE solar_data_cache IS 'Cache for solar radiation data from APIs (NREL, NASA)';
COMMENT ON COLUMN solar_data_cache.peak_sun_hours IS 'Daily average peak sun hours (worst month)';
COMMENT ON COLUMN solar_data_cache.annual_ghi IS 'Annual Global Horizontal Irradiance in kWh/m²/year';
COMMENT ON COLUMN solar_data_cache.solar_rating IS 'Solar potential rating: A (Excellent ≥5.5hrs) to F (Poor <3.5hrs)';
COMMENT ON COLUMN solar_data_cache.expires_at IS 'Cache expiration timestamp (data refreshed periodically)';
COMMENT ON COLUMN solar_data_cache.api_response IS 'Full API response JSON for debugging and reference';

-- ============================================================================
-- STEP 4: Create function to clean expired cache entries
-- ============================================================================

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

-- ============================================================================
-- STEP 5: Create view for current (non-expired) solar data
-- ============================================================================

CREATE OR REPLACE VIEW solar_data_current AS
SELECT *
FROM solar_data_cache
WHERE expires_at IS NULL OR expires_at > NOW();

-- ============================================================================
-- NOTES:
-- ============================================================================
-- This table caches API responses to reduce API calls and improve performance.
-- Cache expiration is typically 30-90 days for solar data (changes slowly).
--
-- To refresh cache:
-- 1. Call NREL PVWatts API or NASA POWER API
-- 2. Upsert to this table with new expires_at timestamp
-- 3. Run clean_expired_solar_cache() periodically to remove old entries
--
-- Estimated growth: ~1-2 MB per 1000 cached locations

