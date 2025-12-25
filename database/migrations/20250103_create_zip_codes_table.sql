-- ============================================================================
-- ZIP CODES TABLE MIGRATION
-- ============================================================================
-- Created: January 3, 2025
-- Purpose: Store US ZIP code to city/state mappings for Step 1 location input
-- Source: USPS ZIP Code Database (public domain)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create zip_codes table
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

-- ============================================================================
-- STEP 2: Create indexes for fast lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_zip_codes_state_code ON zip_codes(state_code);
CREATE INDEX IF NOT EXISTS idx_zip_codes_city ON zip_codes(city);
CREATE INDEX IF NOT EXISTS idx_zip_codes_state_city ON zip_codes(state_code, city);

-- ============================================================================
-- STEP 3: Add comments
-- ============================================================================

COMMENT ON TABLE zip_codes IS 'US ZIP code to city/state mappings for location lookups';
COMMENT ON COLUMN zip_codes.zip_code IS '5-digit US ZIP code (primary key)';
COMMENT ON COLUMN zip_codes.city IS 'City or town name';
COMMENT ON COLUMN zip_codes.state_code IS '2-letter state abbreviation (e.g., CA, NY)';
COMMENT ON COLUMN zip_codes.state_name IS 'Full state name (e.g., California, New York)';
COMMENT ON COLUMN zip_codes.county IS 'County name (optional)';
COMMENT ON COLUMN zip_codes.latitude IS 'Approximate latitude for geocoding';
COMMENT ON COLUMN zip_codes.longitude IS 'Approximate longitude for geocoding';

-- ============================================================================
-- STEP 4: Create function to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_zip_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_zip_codes_timestamp
    BEFORE UPDATE ON zip_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_zip_codes_updated_at();

-- ============================================================================
-- NOTES:
-- ============================================================================
-- To populate this table, you can:
-- 1. Download USPS ZIP code database from: https://www.unitedstateszipcodes.org/zip-code-database/
-- 2. Import CSV using: COPY zip_codes FROM '/path/to/zip_code_database.csv' DELIMITER ',' CSV HEADER;
-- 3. Or use a script to populate from the static data in the Step 1 redesign file
--
-- Estimated rows: ~42,000 US ZIP codes
-- Estimated size: ~5-10 MB

