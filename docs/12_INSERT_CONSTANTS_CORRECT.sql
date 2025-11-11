-- ================================================================
-- INSERT CALCULATION CONSTANTS (CORRECT VERSION)
-- Matches the actual table structure with formula_key, formula_category, etc.
-- ================================================================

-- Delete old test formulas first (optional)
-- DELETE FROM calculation_formulas WHERE formula_key IN ('simple_payback_period', 'roi', 'battery_capacity_sizing');

-- Insert Financial Constants
INSERT INTO calculation_formulas (
  formula_key, 
  formula_name, 
  formula_category,
  description, 
  formula_expression, 
  formula_variables,
  output_variables,
  variables,
  category, 
  industry_standard_reference, 
  version, 
  is_active,
  reference_sources
) VALUES 
(
  'peak_shaving_multiplier',
  'Peak Shaving Multiplier',
  'financial',
  'Annual cycles for peak shaving energy arbitrage', 
  'annualSavings = energyMWh * cycles * (peakRate - offpeakRate) * 1000',
  '{"energyMWh": {"type": "number", "unit": "MWh"}, "peakRate": {"type": "number", "unit": "$/kWh"}, "offpeakRate": {"type": "number", "unit": "$/kWh"}}'::jsonb,
  '{"annualSavings": {"type": "number", "unit": "$/year"}}'::jsonb,
  '{"value": 365, "unit": "cycles/year", "typical_spread_kwh": 0.05}'::jsonb,
  'Financial',
  'NREL APR 2024 - Energy Arbitrage Methodology',
  '1.0',
  true,
  'NREL APR 2024'
)
ON CONFLICT (formula_key) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  formula_variables = EXCLUDED.formula_variables,
  variables = EXCLUDED.variables,
  category = EXCLUDED.category,
  industry_standard_reference = EXCLUDED.industry_standard_reference,
  updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, 
  formula_name, 
  formula_category,
  description, 
  formula_expression, 
  formula_variables,
  variables,
  category, 
  industry_standard_reference, 
  version, 
  is_active,
  reference_sources
) VALUES
(
  'demand_charge_monthly_per_mw',
  'Demand Charge Monthly per MW',
  'financial',
  'Monthly demand charge reduction value per MW of capacity',
  'demandSavings = powerMW * monthlyRate * 12',
  '{"powerMW": {"type": "number", "unit": "MW"}}'::jsonb,
  '{"value": 15000, "unit": "$/MW-month", "annual_value": 180000}'::jsonb,
  'Financial',
  'Commercial Industrial Rate Schedules 2024',
  '1.0',
  true,
  'Commercial Industrial Rate Schedules 2024'
)
ON CONFLICT (formula_key) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  variables = EXCLUDED.variables,
  updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, 
  formula_name, 
  formula_category,
  description, 
  formula_expression, 
  formula_variables,
  variables,
  category, 
  industry_standard_reference, 
  version, 
  is_active,
  reference_sources
) VALUES
(
  'grid_service_revenue_per_mw',
  'Grid Service Revenue per MW',
  'financial',
  'Annual grid services revenue per MW of capacity',
  'gridRevenue = powerMW * annualRate',
  '{"powerMW": {"type": "number", "unit": "MW"}}'::jsonb,
  '{"value": 30000, "unit": "$/MW-year"}'::jsonb,
  'Financial',
  'FERC Order 841 & ISO Market Data 2024',
  '1.0',
  true,
  'FERC Order 841 & ISO Market Data 2024'
)
ON CONFLICT (formula_key) DO UPDATE SET
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Insert Renewable Constants
INSERT INTO calculation_formulas (
  formula_key, 
  formula_name, 
  formula_category,
  description, 
  formula_expression, 
  formula_variables,
  variables,
  category, 
  industry_standard_reference, 
  version, 
  is_active,
  reference_sources
) VALUES
(
  'solar_capacity_factor',
  'Solar Capacity Factor',
  'renewable',
  'Annual energy production per MW of solar PV',
  'solarEnergy = solarMW * capacityFactor * electricityRate * 1000',
  '{"solarMW": {"type": "number", "unit": "MW"}, "electricityRate": {"type": "number", "unit": "$/kWh"}}'::jsonb,
  '{"value": 1500, "unit": "MWh/MW-year", "capacity_factor_percent": 17.1}'::jsonb,
  'Renewable',
  'NREL PVWatts - National Average',
  '1.0',
  true,
  'NREL PVWatts'
)
ON CONFLICT (formula_key) DO UPDATE SET
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, 
  formula_name, 
  formula_category,
  description, 
  formula_expression, 
  formula_variables,
  variables,
  category, 
  industry_standard_reference, 
  version, 
  is_active,
  reference_sources
) VALUES
(
  'wind_capacity_factor',
  'Wind Capacity Factor',
  'renewable',
  'Annual energy production per MW of wind turbines',
  'windEnergy = windMW * capacityFactor * electricityRate * 1000',
  '{"windMW": {"type": "number", "unit": "MW"}, "electricityRate": {"type": "number", "unit": "$/kWh"}}'::jsonb,
  '{"value": 2500, "unit": "MWh/MW-year", "capacity_factor_percent": 28.5}'::jsonb,
  'Renewable',
  'DOE Wind Energy Technologies Report 2024',
  '1.0',
  true,
  'DOE Wind Energy Technologies Report 2024'
)
ON CONFLICT (formula_key) DO UPDATE SET
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Insert Tax Constants
INSERT INTO calculation_formulas (
  formula_key, 
  formula_name, 
  formula_category,
  description, 
  formula_expression, 
  formula_variables,
  variables,
  category, 
  industry_standard_reference, 
  version, 
  is_active,
  reference_sources
) VALUES
(
  'federal_tax_credit_rate',
  'Federal Tax Credit Rate',
  'tax',
  'Federal Investment Tax Credit (ITC) rate for energy storage',
  'taxCredit = totalCost * rate',
  '{"totalCost": {"type": "number", "unit": "USD"}}'::jsonb,
  '{"value": 0.30, "unit": "percentage", "percentage_display": "30%"}'::jsonb,
  'Tax',
  'Inflation Reduction Act (IRA) 2022 - Section 48',
  '1.0',
  true,
  'IRA 2022 Section 48'
)
ON CONFLICT (formula_key) DO UPDATE SET
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Insert Operational Constants
INSERT INTO calculation_formulas (
  formula_key, 
  formula_name, 
  formula_category,
  description, 
  formula_expression, 
  formula_variables,
  variables,
  category, 
  industry_standard_reference, 
  version, 
  is_active,
  reference_sources
) VALUES
(
  'annual_cycles',
  'Annual Cycles',
  'operational',
  'Expected annual charge/discharge cycles for daily cycling',
  'totalCycles = 365 * yearsOperation',
  '{"yearsOperation": {"type": "number", "unit": "years"}}'::jsonb,
  '{"value": 365, "unit": "cycles/year", "daily_cycling": true}'::jsonb,
  'Operational',
  'Industry Standard - Daily Cycling',
  '1.0',
  true,
  'Industry Standard'
)
ON CONFLICT (formula_key) DO UPDATE SET
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, 
  formula_name, 
  formula_category,
  description, 
  formula_expression, 
  formula_variables,
  variables,
  category, 
  industry_standard_reference, 
  version, 
  is_active,
  reference_sources
) VALUES
(
  'round_trip_efficiency',
  'Round Trip Efficiency',
  'technical',
  'Battery system round-trip efficiency (AC to AC)',
  'usableEnergy = storedEnergy * efficiency',
  '{"storedEnergy": {"type": "number", "unit": "kWh"}}'::jsonb,
  '{"value": 0.85, "unit": "percentage", "percentage_display": "85%", "chemistry": "LFP"}'::jsonb,
  'Technical',
  'Battery Manufacturer Specifications - Industry Average',
  '1.0',
  true,
  'Battery Manufacturer Specs'
)
ON CONFLICT (formula_key) DO UPDATE SET
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, 
  formula_name, 
  formula_category,
  description, 
  formula_expression, 
  formula_variables,
  variables,
  category, 
  industry_standard_reference, 
  version, 
  is_active,
  reference_sources
) VALUES
(
  'degradation_rate_annual',
  'Degradation Rate Annual',
  'technical',
  'Annual battery capacity degradation rate',
  'remainingCapacity = initialCapacity * (1 - rate) ^ years',
  '{"initialCapacity": {"type": "number", "unit": "kWh"}, "years": {"type": "number", "unit": "years"}}'::jsonb,
  '{"value": 0.02, "unit": "percentage/year", "percentage_display": "2% per year"}'::jsonb,
  'Technical',
  'Battery Warranty Standards & NREL Battery Life Studies',
  '1.0',
  true,
  'NREL Battery Life Studies'
)
ON CONFLICT (formula_key) DO UPDATE SET
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, 
  formula_name, 
  formula_category,
  description, 
  formula_expression, 
  formula_variables,
  variables,
  category, 
  industry_standard_reference, 
  version, 
  is_active,
  reference_sources
) VALUES
(
  'om_cost_percent',
  'O&M Cost Percent',
  'operational',
  'Annual Operations & Maintenance cost as percentage of CAPEX',
  'annualOM = totalCost * rate',
  '{"totalCost": {"type": "number", "unit": "USD"}}'::jsonb,
  '{"value": 0.025, "unit": "percentage", "percentage_display": "2.5% per year"}'::jsonb,
  'O&M',
  'NREL ATB 2024 - O&M Cost Assumptions',
  '1.0',
  true,
  'NREL ATB 2024'
)
ON CONFLICT (formula_key) DO UPDATE SET
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Verify insertion
SELECT 
  formula_key,
  formula_name,
  category,
  variables->>'value' as value,
  variables->>'unit' as unit,
  is_active,
  created_at
FROM calculation_formulas
WHERE formula_key IN (
  'peak_shaving_multiplier',
  'demand_charge_monthly_per_mw',
  'grid_service_revenue_per_mw',
  'solar_capacity_factor',
  'wind_capacity_factor',
  'federal_tax_credit_rate',
  'annual_cycles',
  'round_trip_efficiency',
  'degradation_rate_annual',
  'om_cost_percent'
)
ORDER BY category, formula_key;
