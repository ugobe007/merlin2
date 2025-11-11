-- =====================================================
-- Industry Baselines Database Schema
-- =====================================================
-- Purpose: Single source of truth for all industry power calculations
-- Based on: /src/utils/industryBaselines.ts
-- Data Sources: CBECS 2018, ASHRAE 90.1, NREL, DOE/EIA
-- Created: November 10, 2025
-- =====================================================

-- Drop existing table if running migration again
DROP TABLE IF EXISTS industry_baselines CASCADE;

-- Main industry baselines table
CREATE TABLE industry_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_key VARCHAR(50) UNIQUE NOT NULL,
  industry_name VARCHAR(100) NOT NULL,
  
  -- Power calculation parameters
  power_mw_per_unit DECIMAL(10,6) NOT NULL,  -- Power per unit (MW per room, MW per sq ft, etc.)
  scale_unit VARCHAR(50) NOT NULL,            -- Unit type: rooms, sq_ft, MW_IT_load, etc.
  typical_duration_hrs DECIMAL(5,2) NOT NULL, -- Typical battery duration hours
  solar_ratio DECIMAL(5,2) NOT NULL,          -- Ratio of solar to battery capacity
  
  -- Documentation
  description TEXT,                           -- Human-readable description
  data_source TEXT,                           -- Citation for data (e.g., "CBECS 2018, ASHRAE 90.1")
  
  -- Metadata
  last_updated VARCHAR(20) DEFAULT 'Q4 2025',
  is_active BOOLEAN DEFAULT true,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100),
  
  -- Constraints
  CONSTRAINT positive_power CHECK (power_mw_per_unit > 0),
  CONSTRAINT positive_duration CHECK (typical_duration_hrs > 0),
  CONSTRAINT positive_solar CHECK (solar_ratio >= 0)
);

-- Indexes for performance
CREATE INDEX idx_industry_key ON industry_baselines(industry_key);
CREATE INDEX idx_active ON industry_baselines(is_active);
CREATE INDEX idx_updated ON industry_baselines(updated_at DESC);

-- Audit history table (optional but recommended)
CREATE TABLE industry_baselines_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_key VARCHAR(50) NOT NULL,
  field_changed VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by VARCHAR(100),
  change_reason TEXT,
  quarter VARCHAR(10) -- e.g., "2026-Q1"
);

CREATE INDEX idx_history_industry ON industry_baselines_history(industry_key);
CREATE INDEX idx_history_date ON industry_baselines_history(changed_at DESC);

-- Trigger to track changes in history table
CREATE OR REPLACE FUNCTION track_industry_baseline_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if values actually changed
  IF (OLD.power_mw_per_unit IS DISTINCT FROM NEW.power_mw_per_unit) THEN
    INSERT INTO industry_baselines_history (industry_key, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.industry_key, 'power_mw_per_unit', OLD.power_mw_per_unit::TEXT, NEW.power_mw_per_unit::TEXT, NEW.updated_by);
  END IF;
  
  IF (OLD.typical_duration_hrs IS DISTINCT FROM NEW.typical_duration_hrs) THEN
    INSERT INTO industry_baselines_history (industry_key, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.industry_key, 'typical_duration_hrs', OLD.typical_duration_hrs::TEXT, NEW.typical_duration_hrs::TEXT, NEW.updated_by);
  END IF;
  
  IF (OLD.solar_ratio IS DISTINCT FROM NEW.solar_ratio) THEN
    INSERT INTO industry_baselines_history (industry_key, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.industry_key, 'solar_ratio', OLD.solar_ratio::TEXT, NEW.solar_ratio::TEXT, NEW.updated_by);
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER industry_baseline_audit_trigger
  BEFORE UPDATE ON industry_baselines
  FOR EACH ROW
  EXECUTE FUNCTION track_industry_baseline_changes();

-- Row Level Security (RLS) - Enable for production
ALTER TABLE industry_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_baselines_history ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active baselines
CREATE POLICY "Public read access for active baselines"
  ON industry_baselines FOR SELECT
  USING (is_active = true);

-- Policy: Only authenticated admins can modify
CREATE POLICY "Admin write access"
  ON industry_baselines FOR ALL
  USING (auth.role() = 'authenticated' AND auth.jwt()->>'role' = 'admin');

-- Policy: Read-only access to history for authenticated users
CREATE POLICY "Authenticated read history"
  ON industry_baselines_history FOR SELECT
  USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE industry_baselines IS 'Authoritative source for industry-specific power sizing calculations';
COMMENT ON COLUMN industry_baselines.power_mw_per_unit IS 'Power in MW per unit (e.g., 0.00293 MW per hotel room)';
COMMENT ON COLUMN industry_baselines.scale_unit IS 'The scaling unit: rooms, sq_ft, bays, production_lines, etc.';
COMMENT ON COLUMN industry_baselines.data_source IS 'Citation for data source (CBECS, ASHRAE, NREL, etc.)';

-- =====================================================
-- Validation Views
-- =====================================================

-- View to show human-readable baseline data
CREATE OR REPLACE VIEW v_industry_baselines_readable AS
SELECT 
  industry_key,
  industry_name,
  ROUND(power_mw_per_unit * 1000, 2) || ' kW per ' || scale_unit as power_per_unit,
  typical_duration_hrs || ' hours' as duration,
  ROUND(solar_ratio * 100, 0) || '% of battery capacity' as solar_sizing,
  data_source,
  last_updated,
  is_active
FROM industry_baselines
ORDER BY industry_name;

-- View to show recent changes
CREATE OR REPLACE VIEW v_recent_baseline_changes AS
SELECT 
  h.industry_key,
  b.industry_name,
  h.field_changed,
  h.old_value,
  h.new_value,
  h.changed_at,
  h.changed_by,
  h.change_reason
FROM industry_baselines_history h
JOIN industry_baselines b ON h.industry_key = b.industry_key
ORDER BY h.changed_at DESC
LIMIT 100;

-- =====================================================
-- Sample Query Examples
-- =====================================================

/*
-- Get baseline for hotel industry
SELECT * FROM industry_baselines WHERE industry_key = 'hotel';

-- Calculate power for 400-room hotel
SELECT 
  industry_name,
  (power_mw_per_unit * 400) as recommended_power_mw,
  typical_duration_hrs,
  (power_mw_per_unit * 400 * solar_ratio) as recommended_solar_mw
FROM industry_baselines 
WHERE industry_key = 'hotel';

-- View all active industries
SELECT * FROM v_industry_baselines_readable WHERE is_active = true;

-- See who changed what
SELECT * FROM v_recent_baseline_changes;
*/
