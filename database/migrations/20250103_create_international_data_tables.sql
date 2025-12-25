-- ============================================================================
-- INTERNATIONAL DATA TABLES MIGRATION
-- ============================================================================
-- Created: January 3, 2025
-- Purpose: Store international country and city data for Step 1 location input
-- Source: Manual curation from multiple sources (World Bank, IEA, etc.)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create international_countries table
-- ============================================================================

CREATE TABLE IF NOT EXISTS international_countries (
    country_code VARCHAR(2) PRIMARY KEY, -- ISO 3166-1 alpha-2 code
    country_name VARCHAR(100) NOT NULL UNIQUE,
    flag_emoji VARCHAR(10),
    currency_symbol VARCHAR(10),
    currency_to_usd DECIMAL(10, 6), -- Exchange rate to USD
    electricity_rate_usd DECIMAL(6, 4), -- Average commercial rate in $/kWh
    peak_sun_hours DECIMAL(4, 2), -- Average daily peak sun hours
    solar_rating VARCHAR(1), -- A, B, C, D, F (calculated from sun hours)
    wind_potential VARCHAR(10), -- 'excellent', 'good', 'fair', 'poor' (optional)
    data_source VARCHAR(50) DEFAULT 'manual',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create international_cities table
-- ============================================================================

CREATE TABLE IF NOT EXISTS international_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL REFERENCES international_countries(country_code) ON DELETE CASCADE,
    city_name VARCHAR(100) NOT NULL,
    tier INTEGER CHECK (tier BETWEEN 1 AND 5), -- Population tier (1 = largest cities)
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    timezone VARCHAR(50),
    population INTEGER, -- Optional: population for sorting/display
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_code, city_name)
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_international_cities_country ON international_cities(country_code);
CREATE INDEX IF NOT EXISTS idx_international_cities_tier ON international_cities(tier);
CREATE INDEX IF NOT EXISTS idx_international_countries_name ON international_countries(country_name);

-- ============================================================================
-- STEP 4: Add comments
-- ============================================================================

COMMENT ON TABLE international_countries IS 'International country data including electricity rates and solar potential';
COMMENT ON TABLE international_cities IS 'International cities organized by country and population tier';
COMMENT ON COLUMN international_countries.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., GB, DE, FR)';
COMMENT ON COLUMN international_countries.electricity_rate_usd IS 'Average commercial electricity rate in USD per kWh';
COMMENT ON COLUMN international_countries.solar_rating IS 'Solar potential rating: A (Excellent) to F (Poor)';
COMMENT ON COLUMN international_cities.tier IS 'Population tier: 1 = largest cities (e.g., capitals), 5 = smaller cities';

-- ============================================================================
-- STEP 5: Create function to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_international_cities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_international_cities_timestamp
    BEFORE UPDATE ON international_cities
    FOR EACH ROW
    EXECUTE FUNCTION update_international_cities_updated_at();

-- ============================================================================
-- NOTES:
-- ============================================================================
-- Estimated rows:
-- - international_countries: ~100-150 countries
-- - international_cities: ~1000-2000 cities
-- Estimated size: <5 MB total

