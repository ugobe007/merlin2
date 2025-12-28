-- ============================================================================
-- ENHANCE PRICING_CONFIGURATIONS TABLE WITH SIZE-BASED PRICING TIERS
-- ============================================================================
-- Date: December 25, 2025
-- Purpose: Add size-based pricing tiers with 5 pricing levels (low, low+, mid, mid+, high)
--          Supports both kW and MWh units for system sizing
--          Merges Claude's market_pricing proposal into existing pricing_configurations table
--
-- Migration Strategy:
-- 1. Add new columns to pricing_configurations for size-based pricing
-- 2. Create pricing_tiers JSONB structure within config_data
-- 3. Maintain backward compatibility with existing config_data structure
-- 4. Populate seed data matching current Q4 2024 - Q1 2025 pricing values
-- ============================================================================

-- Step 1: Add new columns for size-based pricing (optional, for faster queries)
-- Note: We'll primarily use JSONB config_data, but these columns allow direct queries
ALTER TABLE pricing_configurations
ADD COLUMN IF NOT EXISTS size_min_kw DECIMAL,
ADD COLUMN IF NOT EXISTS size_max_kw DECIMAL,
ADD COLUMN IF NOT EXISTS size_min_mwh DECIMAL,
ADD COLUMN IF NOT EXISTS size_max_mwh DECIMAL;

-- Step 2: Add index for size-based lookups
CREATE INDEX IF NOT EXISTS idx_pricing_config_size_lookup 
ON pricing_configurations(config_category, size_min_kw, size_max_kw, is_active)
WHERE size_min_kw IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pricing_config_size_mwh_lookup
ON pricing_configurations(config_category, size_min_mwh, size_max_mwh, is_active)
WHERE size_min_mwh IS NOT NULL;

-- Step 3: Create helper function to get pricing tier for a system size
CREATE OR REPLACE FUNCTION get_pricing_tier(
  p_category TEXT,
  p_size_kw DECIMAL DEFAULT NULL,
  p_size_mwh DECIMAL DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  config_key TEXT,
  config_data JSONB,
  price_low DECIMAL,
  price_low_plus DECIMAL,
  price_mid DECIMAL,
  price_mid_plus DECIMAL,
  price_high DECIMAL,
  price_unit TEXT,
  size_min_kw DECIMAL,
  size_max_kw DECIMAL,
  size_min_mwh DECIMAL,
  size_max_mwh DECIMAL,
  source_type TEXT,
  confidence_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.config_key,
    pc.config_data,
    (pc.config_data->>'price_low')::DECIMAL AS price_low,
    (pc.config_data->>'price_low_plus')::DECIMAL AS price_low_plus,
    (pc.config_data->>'price_mid')::DECIMAL AS price_mid,
    (pc.config_data->>'price_mid_plus')::DECIMAL AS price_mid_plus,
    (pc.config_data->>'price_high')::DECIMAL AS price_high,
    pc.config_data->>'price_unit' AS price_unit,
    pc.size_min_kw,
    pc.size_max_kw,
    pc.size_min_mwh,
    pc.size_max_mwh,
    pc.config_data->>'source_type' AS source_type,
    pc.confidence_level
  FROM pricing_configurations pc
  WHERE pc.config_category = p_category
    AND pc.is_active = true
    AND (
      (p_size_kw IS NOT NULL AND pc.size_min_kw IS NOT NULL 
        AND pc.size_min_kw <= p_size_kw 
        AND (pc.size_max_kw IS NULL OR pc.size_max_kw >= p_size_kw))
      OR
      (p_size_mwh IS NOT NULL AND pc.size_min_mwh IS NOT NULL
        AND pc.size_min_mwh <= p_size_mwh
        AND (pc.size_max_mwh IS NULL OR pc.size_max_mwh >= p_size_mwh))
    )
  ORDER BY 
    CASE WHEN p_size_kw IS NOT NULL THEN pc.size_min_kw ELSE pc.size_min_mwh END DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Seed data - BESS Utility Scale (matching current Q4 2024 - Q1 2025 pricing)
-- Current pricing: $110/kWh mid-range for 3-50 MW systems
-- Market reality: 3-10 MW: $101-125/kWh, 10-50 MW: $95-115/kWh, 50+ MW: $85-105/kWh

INSERT INTO pricing_configurations (
  config_key,
  config_category,
  config_data,
  description,
  version,
  is_active,
  effective_date,
  size_min_kw,
  size_max_kw,
  data_source,
  confidence_level
) VALUES
-- BESS Utility: 3-10 MW (3,000-10,000 kW)
(
  'bess_utility_3_10mw',
  'bess',
  jsonb_build_object(
    'price_low', 101,
    'price_low_plus', 107,
    'price_mid', 110,
    'price_mid_plus', 117.5,
    'price_high', 125,
    'price_unit', '$/kWh',
    'equipment_pct', 0.60,
    'bos_pct', 0.12,
    'labor_pct', 0.15,
    'soft_costs_pct', 0.13,
    'annual_om_pct', 2.5,
    'source_type', 'market_intel',
    'source_name', 'Q4 2024 - Q1 2025 Market Reality',
    'source_date', '2024-10-01',
    'notes', 'LFP container systems, 3-10 MW range. Market drivers: Chinese LFP oversupply, cell price collapse, aggressive competition (CATL, BYD, EVE, Hithium).'
  ),
  'BESS Utility Scale 3-10 MW Pricing Tier',
  '1.0.0',
  true,
  CURRENT_DATE,
  3000,
  10000,
  'Q4 2024 - Q1 2025 Market Reality + Market Intelligence',
  'high'
),
-- BESS Utility: 10-50 MW (10,000-50,000 kW)
(
  'bess_utility_10_50mw',
  'bess',
  jsonb_build_object(
    'price_low', 95,
    'price_low_plus', 100,
    'price_mid', 110,
    'price_mid_plus', 112.5,
    'price_high', 115,
    'price_unit', '$/kWh',
    'equipment_pct', 0.60,
    'bos_pct', 0.10,
    'labor_pct', 0.15,
    'soft_costs_pct', 0.15,
    'annual_om_pct', 2.5,
    'source_type', 'market_intel',
    'source_name', 'Q4 2024 - Q1 2025 Market Reality',
    'source_date', '2024-10-01',
    'notes', 'Volume pricing 10-50 MW. Benefits from economies of scale.'
  ),
  'BESS Utility Scale 10-50 MW Pricing Tier',
  '1.0.0',
  true,
  CURRENT_DATE,
  10000,
  50000,
  'Q4 2024 - Q1 2025 Market Reality + Market Intelligence',
  'high'
),
-- BESS Utility: 50+ MW (50,000+ kW) - Use MWh for very large systems
(
  'bess_utility_50mw_plus',
  'bess',
  jsonb_build_object(
    'price_low', 85,
    'price_low_plus', 90,
    'price_mid', 95,
    'price_mid_plus', 100,
    'price_high', 105,
    'price_unit', '$/kWh',
    'equipment_pct', 0.58,
    'bos_pct', 0.10,
    'labor_pct', 0.16,
    'soft_costs_pct', 0.16,
    'annual_om_pct', 2.5,
    'source_type', 'market_intel',
    'source_name', 'Q4 2024 - Q1 2025 Market Reality',
    'source_date', '2024-10-01',
    'notes', 'Large project pricing 50MW+. Project-level pricing with significant volume discounts.'
  ),
  'BESS Utility Scale 50+ MW Pricing Tier',
  '1.0.0',
  true,
  CURRENT_DATE,
  50000,
  NULL, -- No upper limit
  'Q4 2024 - Q1 2025 Market Reality + Market Intelligence',
  'high'
),
-- BESS Commercial: 100-500 kWh (0.1-0.5 MWh)
(
  'bess_commercial_100_500kwh',
  'bess',
  jsonb_build_object(
    'price_low', 250,
    'price_low_plus', 287.5,
    'price_mid', 325,
    'price_mid_plus', 362.5,
    'price_high', 400,
    'price_unit', '$/kWh',
    'equipment_pct', 0.55,
    'bos_pct', 0.18,
    'labor_pct', 0.17,
    'soft_costs_pct', 0.10,
    'annual_om_pct', 3.0,
    'source_type', 'market_intel',
    'source_name', 'Q4 2024 - Q1 2025 Market Reality',
    'source_date', '2024-10-01',
    'notes', 'Small commercial systems 100-500 kWh. Higher integration costs for smaller systems.'
  ),
  'BESS Commercial 100-500 kWh Pricing Tier',
  '1.0.0',
  true,
  CURRENT_DATE,
  100, -- 100 kW = ~100 kWh at 1 hour, but we're pricing per kWh
  NULL, -- Use MWh for this range
  'Q4 2024 - Q1 2025 Market Reality + Market Intelligence',
  'medium'
),
-- BESS Commercial: 500-3000 kWh (0.5-3 MWh)
(
  'bess_commercial_500_3000kwh',
  'bess',
  jsonb_build_object(
    'price_low', 200,
    'price_low_plus', 225,
    'price_mid', 250,
    'price_mid_plus', 275,
    'price_high', 300,
    'price_unit', '$/kWh',
    'equipment_pct', 0.57,
    'bos_pct', 0.16,
    'labor_pct', 0.16,
    'soft_costs_pct', 0.11,
    'annual_om_pct', 2.8,
    'source_type', 'market_intel',
    'source_name', 'Q4 2024 - Q1 2025 Market Reality',
    'source_date', '2024-10-01',
    'notes', 'Mid commercial systems 500-3000 kWh.'
  ),
  'BESS Commercial 500-3000 kWh Pricing Tier',
  '1.0.0',
  true,
  CURRENT_DATE,
  500,
  3000,
  'Q4 2024 - Q1 2025 Market Reality + Market Intelligence',
  'medium'
),
-- BESS Residential: 5-20 kWh
(
  'bess_residential_5_20kwh',
  'bess',
  jsonb_build_object(
    'price_low', 500,
    'price_low_plus', 575,
    'price_mid', 650,
    'price_mid_plus', 725,
    'price_high', 800,
    'price_unit', '$/kWh',
    'equipment_pct', 0.50,
    'bos_pct', 0.20,
    'labor_pct', 0.20,
    'soft_costs_pct', 0.10,
    'annual_om_pct', 3.5,
    'source_type', 'market_intel',
    'source_name', 'Q4 2024 - Q1 2025 Market Reality',
    'source_date', '2024-10-01',
    'notes', 'Home battery systems 5-20 kWh installed turnkey.'
  ),
  'BESS Residential 5-20 kWh Pricing Tier',
  '1.0.0',
  true,
  CURRENT_DATE,
  5,
  20,
  'Q4 2024 - Q1 2025 Market Reality + Market Intelligence',
  'medium'
),
-- Solar PV Utility Scale (≥5 MW = 5,000 kW)
-- Current pricing: $0.65/W validated (Hampton Heights $0.60/W)
-- Market: $0.75-1.00/W NREL baseline, but validated quotes show $0.65/W achievable
(
  'solar_pv_utility_5mw_plus',
  'solar',
  jsonb_build_object(
    'price_low', 0.60,
    'price_low_plus', 0.625,
    'price_mid', 0.65,
    'price_mid_plus', 0.75,
    'price_high', 0.85,
    'price_unit', '$/W',
    'equipment_pct', 0.45,
    'bos_pct', 0.20,
    'labor_pct', 0.20,
    'soft_costs_pct', 0.15,
    'annual_om_pct', 0.5,
    'source_type', 'vendor_quote',
    'source_name', 'Hampton Heights + Market Intelligence',
    'source_date', '2024-10-01',
    'notes', 'Utility-scale ground mount. Validated quote: Hampton Heights $0.60/W. NREL ATB 2024: $0.85-1.10/W (lags market).'
  ),
  'Solar PV Utility Scale ≥5 MW Pricing Tier',
  '1.0.0',
  true,
  CURRENT_DATE,
  5000,
  NULL,
  'Validated Vendor Quotes + Market Intelligence',
  'high'
),
-- Solar PV Commercial (50 kW - 5 MW = 50,000 - 5,000,000 W)
-- Current pricing: $1.05/W validated (Tribal Microgrid)
-- Market: $1.50-2.00/W NREL baseline, but validated quotes show $1.05/W achievable
(
  'solar_pv_commercial_50kw_5mw',
  'solar',
  jsonb_build_object(
    'price_low', 1.00,
    'price_low_plus', 1.025,
    'price_mid', 1.05,
    'price_mid_plus', 1.275,
    'price_high', 1.50,
    'price_unit', '$/W',
    'equipment_pct', 0.50,
    'bos_pct', 0.22,
    'labor_pct', 0.18,
    'soft_costs_pct', 0.10,
    'annual_om_pct', 1.0,
    'source_type', 'vendor_quote',
    'source_name', 'Tribal Microgrid + Market Intelligence',
    'source_date', '2024-10-01',
    'notes', 'Commercial rooftop/carport. Validated quote: Tribal Microgrid $1.05/W. NREL ATB 2024: $1.50-2.00/W (lags market).'
  ),
  'Solar PV Commercial 50 kW - 5 MW Pricing Tier',
  '1.0.0',
  true,
  CURRENT_DATE,
  50,
  5000,
  'Validated Vendor Quotes + Market Intelligence',
  'high'
),
-- Solar PV Residential (5-50 kW)
-- NREL: $2.50-3.50/W
(
  'solar_pv_residential_5_50kw',
  'solar',
  jsonb_build_object(
    'price_low', 2.50,
    'price_low_plus', 2.75,
    'price_mid', 3.00,
    'price_mid_plus', 3.25,
    'price_high', 3.50,
    'price_unit', '$/W',
    'equipment_pct', 0.40,
    'bos_pct', 0.25,
    'labor_pct', 0.25,
    'soft_costs_pct', 0.10,
    'annual_om_pct', 1.5,
    'source_type', 'market_intel',
    'source_name', 'NREL ATB 2024',
    'source_date', '2024-01-01',
    'notes', 'Residential rooftop installed.'
  ),
  'Solar PV Residential 5-50 kW Pricing Tier',
  '1.0.0',
  true,
  CURRENT_DATE,
  5,
  50,
  'NREL ATB 2024',
  'high'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  size_min_kw = EXCLUDED.size_min_kw,
  size_max_kw = EXCLUDED.size_max_kw,
  size_min_mwh = EXCLUDED.size_min_mwh,
  size_max_mwh = EXCLUDED.size_max_mwh,
  updated_at = CURRENT_TIMESTAMP;

-- Step 5: Add comments for documentation
COMMENT ON TABLE pricing_configurations IS 
'Enhanced pricing configurations with size-based tiers. Supports both kW and MWh units for system sizing. Includes 5 pricing levels: low, low+, mid, mid+, high.';

COMMENT ON COLUMN pricing_configurations.size_min_kw IS 
'Minimum system size in kW for this pricing tier. NULL means no lower limit.';

COMMENT ON COLUMN pricing_configurations.size_max_kw IS 
'Maximum system size in kW for this pricing tier. NULL means no upper limit.';

COMMENT ON COLUMN pricing_configurations.size_min_mwh IS 
'Minimum system size in MWh for this pricing tier. Used for very large systems (e.g., 300 MW = 300 MWh at 1 hour). NULL means no lower limit.';

COMMENT ON COLUMN pricing_configurations.size_max_mwh IS 
'Maximum system size in MWh for this pricing tier. NULL means no upper limit.';

COMMENT ON FUNCTION get_pricing_tier IS 
'Helper function to find the appropriate pricing tier for a given system size. Returns pricing tier with 5 price levels (low, low+, mid, mid+, high).';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next Steps:
-- 1. Update pricingConfigService.ts to use size-based pricing tiers
-- 2. Update equipmentCalculations.ts to query pricing_configurations
-- 3. Update marketIntelligence.ts to use database pricing
-- 4. Test quote generation with new pricing tiers
-- 5. Update admin dashboard to manage pricing tiers
-- ============================================================================

