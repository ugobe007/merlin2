-- ================================================================
-- CREATE CALCULATION_FORMULAS TABLE & ADD CONSTANTS
-- ================================================================
-- Purpose: Create table to store all calculation formulas and constants
--          Then populate with industry-standard values
-- Date: November 11, 2025
-- Version: 1.0
-- 
-- Run this in Supabase SQL Editor
-- ================================================================

-- ================================================================
-- STEP 1: CREATE TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS calculation_formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    formula_expression TEXT NOT NULL,
    variables JSONB DEFAULT '{}'::jsonb,
    category VARCHAR(50),
    industry_standard_reference TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_calculation_formulas_name ON calculation_formulas(formula_name);
CREATE INDEX IF NOT EXISTS idx_calculation_formulas_category ON calculation_formulas(category);
CREATE INDEX IF NOT EXISTS idx_calculation_formulas_active ON calculation_formulas(is_active);

-- Add comments
COMMENT ON TABLE calculation_formulas IS 'Stores all calculation formulas and constants used across the application';
COMMENT ON COLUMN calculation_formulas.formula_name IS 'Unique identifier for the formula (snake_case)';
COMMENT ON COLUMN calculation_formulas.variables IS 'JSONB object containing formula variables and constants';
COMMENT ON COLUMN calculation_formulas.category IS 'Category: Financial, Renewable, Tax, Operational, Technical, O&M';
COMMENT ON COLUMN calculation_formulas.industry_standard_reference IS 'Reference to industry standard or source';

-- ================================================================
-- STEP 2: INSERT CALCULATION CONSTANTS
-- ================================================================

INSERT INTO calculation_formulas 
(formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
-- ================================================================
-- FINANCIAL CONSTANTS
-- ================================================================

('peak_shaving_multiplier', 
 'Annual cycles for peak shaving energy arbitrage', 
 'annualSavings = energyMWh * cycles * (peakRate - offpeakRate) * 1000',
 '{
   "value": 365, 
   "unit": "cycles/year", 
   "typical_spread_kwh": 0.05,
   "description": "Number of times battery cycles per year for arbitrage"
 }'::jsonb,
 'Financial',
 'NREL APR 2024 - Energy Arbitrage Methodology',
 '1.0',
 true),

('demand_charge_monthly_per_mw',
 'Monthly demand charge reduction value per MW of capacity',
 'demandSavings = powerMW * monthlyRate * 12',
 '{
   "value": 15000, 
   "unit": "$/MW-month",
   "annual_value": 180000,
   "typical_range_low": 10000,
   "typical_range_high": 25000,
   "description": "Demand charge reduction achievable per MW of storage"
 }'::jsonb,
 'Financial',
 'Commercial Industrial Rate Schedules 2024 - National Average',
 '1.0',
 true),

('grid_service_revenue_per_mw',
 'Annual grid services revenue per MW of capacity',
 'gridRevenue = powerMW * annualRate',
 '{
   "value": 30000, 
   "unit": "$/MW-year",
   "includes": ["frequency_regulation", "voltage_support", "capacity_payments", "black_start"],
   "iso_ne": 45000,
   "caiso": 35000,
   "pjm": 40000,
   "ercot": 28000,
   "description": "Revenue from ancillary services and grid support"
 }'::jsonb,
 'Financial',
 'FERC Order 841 & ISO Market Data 2024',
 '1.0',
 true),

-- ================================================================
-- RENEWABLE ENERGY CONSTANTS
-- ================================================================

('solar_capacity_factor',
 'Annual energy production per MW of solar PV',
 'solarEnergy = solarMW * capacityFactor * electricityRate * 1000',
 '{
   "value": 1500, 
   "unit": "MWh/MW-year",
   "capacity_factor_percent": 17.1,
   "hours_per_year": 8760,
   "calculation": "8760 * 0.171 ≈ 1500",
   "regional_variation": {
     "southwest_us": 1900,
     "northeast_us": 1300,
     "california": 1700,
     "texas": 1600
   },
   "description": "Annual solar energy production per MW installed"
 }'::jsonb,
 'Renewable',
 'NREL PVWatts - National Average',
 '1.0',
 true),

('wind_capacity_factor',
 'Annual energy production per MW of wind turbines',
 'windEnergy = windMW * capacityFactor * electricityRate * 1000',
 '{
   "value": 2500, 
   "unit": "MWh/MW-year",
   "capacity_factor_percent": 28.5,
   "hours_per_year": 8760,
   "calculation": "8760 * 0.285 ≈ 2500",
   "onshore": 2500,
   "offshore": 4200,
   "regional_variation": {
     "great_plains": 3200,
     "offshore_northeast": 4500,
     "california": 2200
   },
   "description": "Annual wind energy production per MW installed"
 }'::jsonb,
 'Renewable',
 'DOE Wind Energy Technologies Report 2024',
 '1.0',
 true),

-- ================================================================
-- TAX & INCENTIVES
-- ================================================================

('federal_tax_credit_rate',
 'Federal Investment Tax Credit (ITC) rate for energy storage',
 'taxCredit = totalCost * rate',
 '{
   "value": 0.30, 
   "unit": "percentage",
   "percentage_display": "30%",
   "effective_date": "2023-01-01",
   "expires": "2032-12-31",
   "step_down_schedule": {
     "2023_2032": 0.30,
     "2033": 0.26,
     "2034": 0.22,
     "2035_onwards": 0.10
   },
   "applies_to": [
     "standalone_storage_3kwh_minimum",
     "solar_paired_storage",
     "wind_paired_storage"
   ],
   "legislation": "Inflation Reduction Act (IRA) 2022",
   "description": "Federal tax credit for energy storage systems"
 }'::jsonb,
 'Tax',
 'Inflation Reduction Act (IRA) 2022 - Section 48',
 '1.0',
 true),

-- ================================================================
-- OPERATIONAL CONSTANTS
-- ================================================================

('annual_cycles',
 'Expected annual charge/discharge cycles for daily cycling',
 'totalCycles = 365 * yearsOperation',
 '{
   "value": 365, 
   "unit": "cycles/year",
   "daily_cycling": true,
   "twice_daily": false,
   "use_cases": {
     "arbitrage": 365,
     "backup_only": 50,
     "microgrid": 180,
     "commercial_peak_shaving": 300,
     "utility_scale": 365
   },
   "description": "Number of full charge/discharge cycles per year"
 }'::jsonb,
 'Operational',
 'Industry Standard - Daily Cycling',
 '1.0',
 true),

('round_trip_efficiency',
 'Battery system round-trip efficiency (AC to AC)',
 'usableEnergy = storedEnergy * efficiency',
 '{
   "value": 0.85, 
   "unit": "percentage",
   "percentage_display": "85%",
   "chemistry": "LFP",
   "includes": [
     "battery_charge_discharge",
     "inverter_losses",
     "transformer_losses",
     "auxiliary_power"
   ],
   "by_chemistry": {
     "LFP": 0.85,
     "NMC": 0.87,
     "lead_acid": 0.75,
     "flow_battery": 0.70
   },
   "description": "Percentage of energy recovered during full cycle"
 }'::jsonb,
 'Technical',
 'Battery Manufacturer Specifications - Industry Average',
 '1.0',
 true),

('degradation_rate_annual',
 'Annual battery capacity degradation rate',
 'remainingCapacity = initialCapacity * (1 - rate) ^ years',
 '{
   "value": 0.02, 
   "unit": "percentage/year",
   "percentage_display": "2% per year",
   "end_of_life_capacity": 0.80,
   "warranty_years": 10,
   "warranty_capacity": 0.70,
   "by_chemistry": {
     "LFP": 0.020,
     "NMC": 0.025,
     "lead_acid": 0.050
   },
   "factors_affecting": [
     "depth_of_discharge",
     "temperature",
     "cycle_count",
     "charge_rate"
   ],
   "description": "Annual loss of battery capacity over lifetime"
 }'::jsonb,
 'Technical',
 'Battery Warranty Standards & NREL Battery Life Studies',
 '1.0',
 true),

('om_cost_percent',
 'Annual Operations & Maintenance cost as percentage of CAPEX',
 'annualOM = totalCost * rate',
 '{
   "value": 0.025, 
   "unit": "percentage",
   "percentage_display": "2.5% per year",
   "includes": [
     "scheduled_maintenance",
     "monitoring_systems",
     "insurance",
     "property_taxes",
     "software_licenses",
     "emergency_repairs"
   ],
   "breakdown": {
     "maintenance": 0.012,
     "insurance": 0.008,
     "monitoring": 0.003,
     "contingency": 0.002
   },
   "fixed_cost_per_mw": 10000,
   "variable_cost_per_mwh": 3000,
   "description": "Annual O&M costs for energy storage system"
 }'::jsonb,
 'O&M',
 'NREL ATB 2024 - O&M Cost Assumptions',
 '1.0',
 true);

-- ================================================================
-- STEP 3: VERIFY INSERTION
-- ================================================================

-- Query to verify all constants were inserted
SELECT 
  formula_name,
  category,
  variables->>'value' as value,
  variables->>'unit' as unit,
  is_active,
  created_at
FROM calculation_formulas
WHERE is_active = true
ORDER BY category, formula_name;

-- ================================================================
-- STEP 4: GRANT PERMISSIONS
-- ================================================================

-- Grant read access to authenticated users
GRANT SELECT ON calculation_formulas TO authenticated;

-- Grant full access to service role (for admin operations)
GRANT ALL ON calculation_formulas TO service_role;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ calculation_formulas table created successfully';
  RAISE NOTICE '✅ 10 calculation constants inserted';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Permissions granted';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   - Financial constants: 3';
  RAISE NOTICE '   - Renewable constants: 2';
  RAISE NOTICE '   - Tax constants: 1';
  RAISE NOTICE '   - Operational constants: 4';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Next step: Application will now read from database';
END $$;
