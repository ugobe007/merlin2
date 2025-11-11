-- ================================================================
-- SIMPLE INSERT - Just add output_variables to existing inserts
-- ================================================================

INSERT INTO calculation_formulas (
  formula_key, formula_name, formula_category, description, formula_expression, 
  formula_variables, output_variables, variables, category, industry_standard_reference, 
  version, is_active, reference_sources
) VALUES 
('peak_shaving_multiplier', 'Peak Shaving Multiplier', 'financial',
 'Annual cycles for peak shaving energy arbitrage', 
 'annualSavings = energyMWh * cycles * (peakRate - offpeakRate) * 1000',
 '{"energyMWh": {"type": "number", "unit": "MWh"}}'::jsonb,
 '{"cycles": {"type": "number", "unit": "cycles/year"}}'::jsonb,
 '{"value": 365, "unit": "cycles/year"}'::jsonb,
 'Financial', 'NREL APR 2024', '1.0', true, 'NREL APR 2024')
ON CONFLICT (formula_key) DO UPDATE SET variables = EXCLUDED.variables, updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, formula_name, formula_category, description, formula_expression, 
  formula_variables, output_variables, variables, category, industry_standard_reference, 
  version, is_active, reference_sources
) VALUES
('demand_charge_monthly_per_mw', 'Demand Charge Monthly per MW', 'financial',
 'Monthly demand charge reduction value per MW', 
 'demandSavings = powerMW * monthlyRate * 12',
 '{"powerMW": {"type": "number", "unit": "MW"}}'::jsonb,
 '{"monthlyRate": {"type": "number", "unit": "$/MW-month"}}'::jsonb,
 '{"value": 15000, "unit": "$/MW-month"}'::jsonb,
 'Financial', 'Commercial Rate Schedules 2024', '1.0', true, 'Commercial Rate Schedules 2024')
ON CONFLICT (formula_key) DO UPDATE SET variables = EXCLUDED.variables, updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, formula_name, formula_category, description, formula_expression, 
  formula_variables, output_variables, variables, category, industry_standard_reference, 
  version, is_active, reference_sources
) VALUES
('grid_service_revenue_per_mw', 'Grid Service Revenue per MW', 'financial',
 'Annual grid services revenue per MW', 
 'gridRevenue = powerMW * annualRate',
 '{"powerMW": {"type": "number", "unit": "MW"}}'::jsonb,
 '{"annualRate": {"type": "number", "unit": "$/MW-year"}}'::jsonb,
 '{"value": 30000, "unit": "$/MW-year"}'::jsonb,
 'Financial', 'FERC Order 841 2024', '1.0', true, 'FERC Order 841 2024')
ON CONFLICT (formula_key) DO UPDATE SET variables = EXCLUDED.variables, updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, formula_name, formula_category, description, formula_expression, 
  formula_variables, output_variables, variables, category, industry_standard_reference, 
  version, is_active, reference_sources
) VALUES
('solar_capacity_factor', 'Solar Capacity Factor', 'renewable',
 'Annual energy production per MW of solar PV', 
 'solarEnergy = solarMW * capacityFactor * 1000',
 '{"solarMW": {"type": "number", "unit": "MW"}}'::jsonb,
 '{"capacityFactor": {"type": "number", "unit": "MWh/MW-year"}}'::jsonb,
 '{"value": 1500, "unit": "MWh/MW-year"}'::jsonb,
 'Renewable', 'NREL PVWatts', '1.0', true, 'NREL PVWatts')
ON CONFLICT (formula_key) DO UPDATE SET variables = EXCLUDED.variables, updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, formula_name, formula_category, description, formula_expression, 
  formula_variables, output_variables, variables, category, industry_standard_reference, 
  version, is_active, reference_sources
) VALUES
('wind_capacity_factor', 'Wind Capacity Factor', 'renewable',
 'Annual energy production per MW of wind', 
 'windEnergy = windMW * capacityFactor * 1000',
 '{"windMW": {"type": "number", "unit": "MW"}}'::jsonb,
 '{"capacityFactor": {"type": "number", "unit": "MWh/MW-year"}}'::jsonb,
 '{"value": 2500, "unit": "MWh/MW-year"}'::jsonb,
 'Renewable', 'DOE Wind Report 2024', '1.0', true, 'DOE Wind Report 2024')
ON CONFLICT (formula_key) DO UPDATE SET variables = EXCLUDED.variables, updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, formula_name, formula_category, description, formula_expression, 
  formula_variables, output_variables, variables, category, industry_standard_reference, 
  version, is_active, reference_sources
) VALUES
('federal_tax_credit_rate', 'Federal Tax Credit Rate', 'tax',
 'Federal ITC rate for energy storage', 
 'taxCredit = totalCost * rate',
 '{"totalCost": {"type": "number", "unit": "USD"}}'::jsonb,
 '{"rate": {"type": "number", "unit": "percentage"}}'::jsonb,
 '{"value": 0.30, "unit": "percentage"}'::jsonb,
 'Tax', 'IRA 2022 Section 48', '1.0', true, 'IRA 2022 Section 48')
ON CONFLICT (formula_key) DO UPDATE SET variables = EXCLUDED.variables, updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, formula_name, formula_category, description, formula_expression, 
  formula_variables, output_variables, variables, category, industry_standard_reference, 
  version, is_active, reference_sources
) VALUES
('annual_cycles', 'Annual Cycles', 'operational',
 'Expected annual charge/discharge cycles', 
 'totalCycles = 365 * yearsOperation',
 '{"yearsOperation": {"type": "number", "unit": "years"}}'::jsonb,
 '{"cycles": {"type": "number", "unit": "cycles/year"}}'::jsonb,
 '{"value": 365, "unit": "cycles/year"}'::jsonb,
 'Operational', 'Industry Standard', '1.0', true, 'Industry Standard')
ON CONFLICT (formula_key) DO UPDATE SET variables = EXCLUDED.variables, updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, formula_name, formula_category, description, formula_expression, 
  formula_variables, output_variables, variables, category, industry_standard_reference, 
  version, is_active, reference_sources
) VALUES
('round_trip_efficiency', 'Round Trip Efficiency', 'technical',
 'Battery round-trip efficiency (AC to AC)', 
 'usableEnergy = storedEnergy * efficiency',
 '{"storedEnergy": {"type": "number", "unit": "kWh"}}'::jsonb,
 '{"efficiency": {"type": "number", "unit": "percentage"}}'::jsonb,
 '{"value": 0.85, "unit": "percentage"}'::jsonb,
 'Technical', 'Battery Manufacturer Specs', '1.0', true, 'Battery Specs')
ON CONFLICT (formula_key) DO UPDATE SET variables = EXCLUDED.variables, updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, formula_name, formula_category, description, formula_expression, 
  formula_variables, output_variables, variables, category, industry_standard_reference, 
  version, is_active, reference_sources
) VALUES
('degradation_rate_annual', 'Degradation Rate Annual', 'technical',
 'Annual battery capacity degradation rate', 
 'remainingCapacity = initialCapacity * (1 - rate) ^ years',
 '{"initialCapacity": {"type": "number", "unit": "kWh"}}'::jsonb,
 '{"rate": {"type": "number", "unit": "percentage/year"}}'::jsonb,
 '{"value": 0.02, "unit": "percentage/year"}'::jsonb,
 'Technical', 'NREL Battery Life Studies', '1.0', true, 'NREL Battery Life')
ON CONFLICT (formula_key) DO UPDATE SET variables = EXCLUDED.variables, updated_at = NOW();

INSERT INTO calculation_formulas (
  formula_key, formula_name, formula_category, description, formula_expression, 
  formula_variables, output_variables, variables, category, industry_standard_reference, 
  version, is_active, reference_sources
) VALUES
('om_cost_percent', 'O&M Cost Percent', 'operational',
 'Annual O&M cost as percentage of CAPEX', 
 'annualOM = totalCost * rate',
 '{"totalCost": {"type": "number", "unit": "USD"}}'::jsonb,
 '{"rate": {"type": "number", "unit": "percentage"}}'::jsonb,
 '{"value": 0.025, "unit": "percentage"}'::jsonb,
 'O&M', 'NREL ATB 2024', '1.0', true, 'NREL ATB 2024')
ON CONFLICT (formula_key) DO UPDATE SET variables = EXCLUDED.variables, updated_at = NOW();

-- Verify
SELECT formula_key, variables->>'value' as value, variables->>'unit' as unit
FROM calculation_formulas
WHERE formula_key IN (
  'peak_shaving_multiplier', 'demand_charge_monthly_per_mw', 'grid_service_revenue_per_mw',
  'solar_capacity_factor', 'wind_capacity_factor', 'federal_tax_credit_rate',
  'annual_cycles', 'round_trip_efficiency', 'degradation_rate_annual', 'om_cost_percent'
)
ORDER BY formula_key;
