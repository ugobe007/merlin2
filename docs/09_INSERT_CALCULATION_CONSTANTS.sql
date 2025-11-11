-- ================================================================
-- INSERT CALCULATION CONSTANTS (TABLE ALREADY EXISTS)
-- ================================================================
-- Run this in Supabase SQL Editor
-- ================================================================

-- Clear existing data (optional - uncomment if you want to start fresh)
-- DELETE FROM calculation_formulas;

-- Insert Financial Constants
INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES 
('peak_shaving_multiplier', 
 'Annual cycles for peak shaving energy arbitrage', 
 'annualSavings = energyMWh * cycles * (peakRate - offpeakRate) * 1000',
 '{"value": 365, "unit": "cycles/year", "typical_spread_kwh": 0.05}'::jsonb,
 'Financial',
 'NREL APR 2024 - Energy Arbitrage Methodology',
 '1.0',
 true)
ON CONFLICT (formula_name) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  variables = EXCLUDED.variables,
  category = EXCLUDED.category,
  industry_standard_reference = EXCLUDED.industry_standard_reference,
  updated_at = NOW();

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('demand_charge_monthly_per_mw',
 'Monthly demand charge reduction value per MW of capacity',
 'demandSavings = powerMW * monthlyRate * 12',
 '{"value": 15000, "unit": "$/MW-month", "annual_value": 180000}'::jsonb,
 'Financial',
 'Commercial Industrial Rate Schedules 2024',
 '1.0',
 true)
ON CONFLICT (formula_name) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  variables = EXCLUDED.variables,
  updated_at = NOW();

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('grid_service_revenue_per_mw',
 'Annual grid services revenue per MW of capacity',
 'gridRevenue = powerMW * annualRate',
 '{"value": 30000, "unit": "$/MW-year"}'::jsonb,
 'Financial',
 'FERC Order 841 & ISO Market Data 2024',
 '1.0',
 true)
ON CONFLICT (formula_name) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Insert Renewable Constants
INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('solar_capacity_factor',
 'Annual energy production per MW of solar PV',
 'solarEnergy = solarMW * capacityFactor * electricityRate * 1000',
 '{"value": 1500, "unit": "MWh/MW-year", "capacity_factor_percent": 17.1}'::jsonb,
 'Renewable',
 'NREL PVWatts - National Average',
 '1.0',
 true)
ON CONFLICT (formula_name) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  variables = EXCLUDED.variables,
  updated_at = NOW();

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('wind_capacity_factor',
 'Annual energy production per MW of wind turbines',
 'windEnergy = windMW * capacityFactor * electricityRate * 1000',
 '{"value": 2500, "unit": "MWh/MW-year", "capacity_factor_percent": 28.5}'::jsonb,
 'Renewable',
 'DOE Wind Energy Technologies Report 2024',
 '1.0',
 true)
ON CONFLICT (formula_name) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Insert Tax Constants
INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('federal_tax_credit_rate',
 'Federal Investment Tax Credit (ITC) rate for energy storage',
 'taxCredit = totalCost * rate',
 '{"value": 0.30, "unit": "percentage", "percentage_display": "30%"}'::jsonb,
 'Tax',
 'Inflation Reduction Act (IRA) 2022 - Section 48',
 '1.0',
 true)
ON CONFLICT (formula_name) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Insert Operational Constants
INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('annual_cycles',
 'Expected annual charge/discharge cycles for daily cycling',
 'totalCycles = 365 * yearsOperation',
 '{"value": 365, "unit": "cycles/year", "daily_cycling": true}'::jsonb,
 'Operational',
 'Industry Standard - Daily Cycling',
 '1.0',
 true)
ON CONFLICT (formula_name) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  variables = EXCLUDED.variables,
  updated_at = NOW();

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('round_trip_efficiency',
 'Battery system round-trip efficiency (AC to AC)',
 'usableEnergy = storedEnergy * efficiency',
 '{"value": 0.85, "unit": "percentage", "percentage_display": "85%", "chemistry": "LFP"}'::jsonb,
 'Technical',
 'Battery Manufacturer Specifications - Industry Average',
 '1.0',
 true)
ON CONFLICT (formula_name) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  variables = EXCLUDED.variables,
  updated_at = NOW();

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('degradation_rate_annual',
 'Annual battery capacity degradation rate',
 'remainingCapacity = initialCapacity * (1 - rate) ^ years',
 '{"value": 0.02, "unit": "percentage/year", "percentage_display": "2% per year"}'::jsonb,
 'Technical',
 'Battery Warranty Standards & NREL Battery Life Studies',
 '1.0',
 true)
ON CONFLICT (formula_name) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  variables = EXCLUDED.variables,
  updated_at = NOW();

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('om_cost_percent',
 'Annual Operations & Maintenance cost as percentage of CAPEX',
 'annualOM = totalCost * rate',
 '{"value": 0.025, "unit": "percentage", "percentage_display": "2.5% per year"}'::jsonb,
 'O&M',
 'NREL ATB 2024 - O&M Cost Assumptions',
 '1.0',
 true)
ON CONFLICT (formula_name) DO UPDATE SET
  description = EXCLUDED.description,
  formula_expression = EXCLUDED.formula_expression,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Verify insertion
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

-- Show summary
SELECT 
  category,
  COUNT(*) as formula_count
FROM calculation_formulas
WHERE is_active = true
GROUP BY category
ORDER BY category;
