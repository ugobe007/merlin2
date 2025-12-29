-- ============================================================================
-- PRICING ADMIN DASHBOARD MIGRATION
-- ============================================================================
-- Date: December 28, 2025
-- Purpose: Migrate PricingAdminDashboard from hardcoded pricingConfigService 
--          to database-driven pricing_configurations table
-- 
-- This migration ensures:
-- 1. pricing_configurations table exists with proper structure
-- 2. Default pricing values are seeded (NREL ATB 2024 compliant)
-- 3. Admin can update pricing via dashboard → stored in database
-- 4. unifiedPricingService reads from this table (already implemented)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create pricing_configurations table (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_data JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  source VARCHAR(50) DEFAULT 'admin', -- 'admin', 'nrel', 'vendor', 'market'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(255)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pricing_config_key ON pricing_configurations(config_key);
CREATE INDEX IF NOT EXISTS idx_pricing_config_active ON pricing_configurations(is_active);

-- ============================================================================
-- STEP 2: Create calculation_constants table (if not exists)
-- This is used by unifiedPricingService for size-tiered battery pricing
-- ============================================================================

CREATE TABLE IF NOT EXISTS calculation_constants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constant_key VARCHAR(100) NOT NULL UNIQUE,
  constant_value NUMERIC NOT NULL,
  unit VARCHAR(50),
  description TEXT,
  source VARCHAR(100) DEFAULT 'NREL ATB 2024',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calc_constants_key ON calculation_constants(constant_key);

-- ============================================================================
-- STEP 3: Seed default BESS pricing (NREL ATB 2024 compliant)
-- ============================================================================

-- Small systems (<1 MWh) - Higher $/kWh due to lower economies of scale
INSERT INTO calculation_constants (constant_key, constant_value, unit, description, source)
VALUES ('battery_cost_per_kwh_small', 280, '$/kWh', 'Battery cost for systems <1 MWh', 'NREL ATB 2024')
ON CONFLICT (constant_key) DO UPDATE SET 
  constant_value = EXCLUDED.constant_value,
  updated_at = NOW();

-- Medium systems (1-10 MWh) - Commercial scale
INSERT INTO calculation_constants (constant_key, constant_value, unit, description, source)
VALUES ('battery_cost_per_kwh_medium', 195, '$/kWh', 'Battery cost for systems 1-10 MWh', 'NREL ATB 2024')
ON CONFLICT (constant_key) DO UPDATE SET 
  constant_value = EXCLUDED.constant_value,
  updated_at = NOW();

-- Large systems (10+ MWh) - Utility scale
INSERT INTO calculation_constants (constant_key, constant_value, unit, description, source)
VALUES ('battery_cost_per_kwh_large', 155, '$/kWh', 'Battery cost for systems 10+ MWh', 'NREL ATB 2024')
ON CONFLICT (constant_key) DO UPDATE SET 
  constant_value = EXCLUDED.constant_value,
  updated_at = NOW();

-- Inverter cost
INSERT INTO calculation_constants (constant_key, constant_value, unit, description, source)
VALUES ('inverter_cost_per_kw', 80, '$/kW', 'Inverter cost per kW', 'NREL ATB 2024')
ON CONFLICT (constant_key) DO UPDATE SET 
  constant_value = EXCLUDED.constant_value,
  updated_at = NOW();

-- ============================================================================
-- STEP 4: Seed solar pricing configuration
-- ============================================================================

INSERT INTO pricing_configurations (config_key, config_data, description, source)
VALUES (
  'solar_default',
  '{
    "utility_scale_per_watt": 0.65,
    "commercial_per_watt": 0.85,
    "small_scale_per_watt": 1.20,
    "tracking_system_upcharge": 0.15,
    "rooftop_installation_factor": 1.25,
    "permitting_cost_per_watt": 0.05,
    "vendor_notes": "NREL ATB 2024 Moderate scenario"
  }',
  'Solar PV pricing by scale',
  'nrel'
)
ON CONFLICT (config_key) DO UPDATE SET 
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- ============================================================================
-- STEP 5: Seed generator pricing configuration
-- ============================================================================

INSERT INTO pricing_configurations (config_key, config_data, description, source)
VALUES (
  'generator_default',
  '{
    "natural_gas_per_kw": 700,
    "diesel_per_kw": 500,
    "propane_per_kw": 600,
    "bio_gas_per_kw": 850,
    "base_installation_cost": 15000,
    "vendor_notes": "Industry standard pricing"
  }',
  'Backup generator pricing by fuel type',
  'nrel'
)
ON CONFLICT (config_key) DO UPDATE SET 
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- ============================================================================
-- STEP 6: Seed BESS pricing configuration (full config for admin dashboard)
-- ============================================================================

INSERT INTO pricing_configurations (config_key, config_data, description, source)
VALUES (
  'bess_default',
  '{
    "small_system_per_kwh": 280,
    "medium_system_per_kwh": 195,
    "large_system_per_kwh": 155,
    "small_system_size_mwh": 1,
    "medium_system_size_mwh": 10,
    "large_system_size_mwh": 100,
    "degradation_rate": 0.025,
    "warranty_years": 10,
    "round_trip_efficiency": 0.85,
    "cycles_per_year": 365,
    "chemistry": "LFP",
    "vendor_notes": "NREL ATB 2024 Moderate scenario - LFP chemistry"
  }',
  'Battery Energy Storage System pricing tiers',
  'nrel'
)
ON CONFLICT (config_key) DO UPDATE SET 
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- ============================================================================
-- STEP 7: Seed EV charger pricing configuration
-- ============================================================================

INSERT INTO pricing_configurations (config_key, config_data, description, source)
VALUES (
  'ev_charger_default',
  '{
    "level2_per_unit": 6500,
    "level3_dcfc_per_unit": 40000,
    "level3_ultra_per_unit": 150000,
    "installation_cost_per_unit": 5000,
    "networking_cost_per_unit": 1500,
    "pedestal_cost": 2000,
    "vendor_notes": "Commercial EV charging equipment pricing"
  }',
  'EV Charger pricing by level',
  'admin'
)
ON CONFLICT (config_key) DO UPDATE SET 
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- ============================================================================
-- STEP 8: Seed wind pricing configuration
-- ============================================================================

INSERT INTO pricing_configurations (config_key, config_data, description, source)
VALUES (
  'wind_default',
  '{
    "utility_scale_per_kw": 1200,
    "commercial_per_kw": 1800,
    "small_scale_per_kw": 3500,
    "foundation_cost_per_mw": 150000,
    "vendor_notes": "NREL ATB 2024 Land-Based Wind"
  }',
  'Wind turbine pricing by scale',
  'nrel'
)
ON CONFLICT (config_key) DO UPDATE SET 
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- ============================================================================
-- STEP 9: Seed power electronics pricing
-- ============================================================================

INSERT INTO pricing_configurations (config_key, config_data, description, source)
VALUES (
  'power_electronics_default',
  '{
    "inverter_per_kw": 80,
    "transformer_per_mva": 50000,
    "switchgear_per_unit": 25000,
    "bms_per_kwh": 15,
    "pcs_per_kw": 100,
    "vendor_notes": "Industry standard power electronics"
  }',
  'Power electronics and BOS pricing',
  'nrel'
)
ON CONFLICT (config_key) DO UPDATE SET 
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- ============================================================================
-- STEP 10: Seed incentives configuration
-- ============================================================================

INSERT INTO pricing_configurations (config_key, config_data, description, source)
VALUES (
  'incentives_default',
  '{
    "federal_itc_rate": 0.30,
    "federal_itc_bess_eligible": true,
    "federal_itc_solar_eligible": true,
    "macrs_depreciation_years": 5,
    "bonus_depreciation_rate": 0.80,
    "vendor_notes": "IRA 2022 incentives - standalone BESS qualifies for ITC"
  }',
  'Federal and state incentive rates',
  'admin'
)
ON CONFLICT (config_key) DO UPDATE SET 
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- ============================================================================
-- STEP 11: Create update trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_pricing_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pricing_config_updated_at ON pricing_configurations;
CREATE TRIGGER pricing_config_updated_at
  BEFORE UPDATE ON pricing_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_config_timestamp();

DROP TRIGGER IF EXISTS calc_constants_updated_at ON calculation_constants;
CREATE TRIGGER calc_constants_updated_at
  BEFORE UPDATE ON calculation_constants
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_config_timestamp();

-- ============================================================================
-- STEP 12: Create view for admin dashboard (easy querying)
-- ============================================================================

CREATE OR REPLACE VIEW v_pricing_dashboard AS
SELECT 
  pc.config_key,
  pc.config_data,
  pc.description,
  pc.source,
  pc.updated_at,
  pc.updated_by,
  pc.is_active
FROM pricing_configurations pc
WHERE pc.is_active = true
ORDER BY pc.config_key;

-- ============================================================================
-- STEP 13: Create audit log for pricing changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by VARCHAR(255),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_pricing_audit_key ON pricing_audit_log(config_key);
CREATE INDEX IF NOT EXISTS idx_pricing_audit_date ON pricing_audit_log(changed_at);

-- Create audit trigger
CREATE OR REPLACE FUNCTION log_pricing_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.config_data IS DISTINCT FROM NEW.config_data THEN
    INSERT INTO pricing_audit_log (config_key, old_value, new_value, changed_by)
    VALUES (NEW.config_key, OLD.config_data, NEW.config_data, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pricing_config_audit ON pricing_configurations;
CREATE TRIGGER pricing_config_audit
  AFTER UPDATE ON pricing_configurations
  FOR EACH ROW
  EXECUTE FUNCTION log_pricing_changes();

-- ============================================================================
-- STEP 14: Grant permissions (adjust role names as needed)
-- ============================================================================

-- For authenticated users (read-only)
GRANT SELECT ON pricing_configurations TO authenticated;
GRANT SELECT ON calculation_constants TO authenticated;
GRANT SELECT ON v_pricing_dashboard TO authenticated;

-- For service role (full access for admin operations)
GRANT ALL ON pricing_configurations TO service_role;
GRANT ALL ON calculation_constants TO service_role;
GRANT ALL ON pricing_audit_log TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify the migration worked:

-- Check pricing configurations
-- SELECT config_key, description, source, updated_at FROM pricing_configurations;

-- Check calculation constants
-- SELECT constant_key, constant_value, unit, source FROM calculation_constants;

-- Check the dashboard view
-- SELECT * FROM v_pricing_dashboard;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Update PricingAdminDashboard.tsx to use:
--    - supabase.from('pricing_configurations').select('*')
--    - supabase.from('calculation_constants').select('*')
-- 3. Remove dependency on pricingConfigService hardcoded values
-- 4. Test that unifiedPricingService correctly reads from database
--
-- The admin dashboard should now:
-- - Read pricing from pricing_configurations table
-- - Allow admins to update pricing (writes to database)
-- - Show audit trail of pricing changes
-- - Display last updated timestamp and source
-- ============================================================================
