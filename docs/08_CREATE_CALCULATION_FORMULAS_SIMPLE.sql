-- ================================================================
-- CREATE CALCULATION_FORMULAS TABLE (SIMPLIFIED)
-- ================================================================
-- Run this in Supabase SQL Editor
-- ================================================================

-- DROP existing table if needed (uncomment if you want to start fresh)
-- DROP TABLE IF EXISTS calculation_formulas CASCADE;

-- Create table
CREATE TABLE calculation_formulas (
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

-- Add indexes
CREATE INDEX idx_calculation_formulas_name ON calculation_formulas(formula_name);
CREATE INDEX idx_calculation_formulas_category ON calculation_formulas(category);
CREATE INDEX idx_calculation_formulas_active ON calculation_formulas(is_active);

-- Insert data (breaking into smaller chunks for easier debugging)

-- Financial Constants
INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES 
('peak_shaving_multiplier', 
 'Annual cycles for peak shaving energy arbitrage', 
 'annualSavings = energyMWh * cycles * (peakRate - offpeakRate) * 1000',
 '{"value": 365, "unit": "cycles/year", "typical_spread_kwh": 0.05}'::jsonb,
 'Financial',
 'NREL APR 2024 - Energy Arbitrage Methodology',
 '1.0',
 true);

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('demand_charge_monthly_per_mw',
 'Monthly demand charge reduction value per MW of capacity',
 'demandSavings = powerMW * monthlyRate * 12',
 '{"value": 15000, "unit": "$/MW-month", "annual_value": 180000}'::jsonb,
 'Financial',
 'Commercial Industrial Rate Schedules 2024',
 '1.0',
 true);

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('grid_service_revenue_per_mw',
 'Annual grid services revenue per MW of capacity',
 'gridRevenue = powerMW * annualRate',
 '{"value": 30000, "unit": "$/MW-year"}'::jsonb,
 'Financial',
 'FERC Order 841 & ISO Market Data 2024',
 '1.0',
 true);

-- Renewable Constants
INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('solar_capacity_factor',
 'Annual energy production per MW of solar PV',
 'solarEnergy = solarMW * capacityFactor * electricityRate * 1000',
 '{"value": 1500, "unit": "MWh/MW-year", "capacity_factor_percent": 17.1}'::jsonb,
 'Renewable',
 'NREL PVWatts - National Average',
 '1.0',
 true);

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('wind_capacity_factor',
 'Annual energy production per MW of wind turbines',
 'windEnergy = windMW * capacityFactor * electricityRate * 1000',
 '{"value": 2500, "unit": "MWh/MW-year", "capacity_factor_percent": 28.5}'::jsonb,
 'Renewable',
 'DOE Wind Energy Technologies Report 2024',
 '1.0',
 true);

-- Tax Constants
INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('federal_tax_credit_rate',
 'Federal Investment Tax Credit (ITC) rate for energy storage',
 'taxCredit = totalCost * rate',
 '{"value": 0.30, "unit": "percentage", "percentage_display": "30%"}'::jsonb,
 'Tax',
 'Inflation Reduction Act (IRA) 2022 - Section 48',
 '1.0',
 true);

-- Operational Constants
INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('annual_cycles',
 'Expected annual charge/discharge cycles for daily cycling',
 'totalCycles = 365 * yearsOperation',
 '{"value": 365, "unit": "cycles/year", "daily_cycling": true}'::jsonb,
 'Operational',
 'Industry Standard - Daily Cycling',
 '1.0',
 true);

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('round_trip_efficiency',
 'Battery system round-trip efficiency (AC to AC)',
 'usableEnergy = storedEnergy * efficiency',
 '{"value": 0.85, "unit": "percentage", "percentage_display": "85%", "chemistry": "LFP"}'::jsonb,
 'Technical',
 'Battery Manufacturer Specifications - Industry Average',
 '1.0',
 true);

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('degradation_rate_annual',
 'Annual battery capacity degradation rate',
 'remainingCapacity = initialCapacity * (1 - rate) ^ years',
 '{"value": 0.02, "unit": "percentage/year", "percentage_display": "2% per year"}'::jsonb,
 'Technical',
 'Battery Warranty Standards & NREL Battery Life Studies',
 '1.0',
 true);

INSERT INTO calculation_formulas (formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
('om_cost_percent',
 'Annual Operations & Maintenance cost as percentage of CAPEX',
 'annualOM = totalCost * rate',
 '{"value": 0.025, "unit": "percentage", "percentage_display": "2.5% per year"}'::jsonb,
 'O&M',
 'NREL ATB 2024 - O&M Cost Assumptions',
 '1.0',
 true);

-- Verify
SELECT 
  formula_name,
  calculation_formulas.category,
  variables->>'value' as value,
  variables->>'unit' as unit,
  is_active
FROM calculation_formulas
WHERE is_active = true
ORDER BY calculation_formulas.category, formula_name;

-- Grant permissions
GRANT SELECT ON calculation_formulas TO authenticated;
GRANT ALL ON calculation_formulas TO service_role;
