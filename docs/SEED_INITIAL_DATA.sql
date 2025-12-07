-- ========================================
-- INITIAL DATA SEED - Run AFTER deploying MASTER_SCHEMA.sql
-- ========================================
-- Purpose: Populate new database with initial configurations
-- Date: November 2025
-- 
-- INSTRUCTIONS:
-- 1. Ensure MASTER_SCHEMA.sql has been deployed successfully
-- 2. Run this script in Supabase SQL Editor
-- 3. Verify data was inserted correctly
-- ========================================

-- ========================================
-- 1. INSERT DEFAULT PRICING CONFIGURATIONS
-- ========================================

-- BESS Pricing Configuration
INSERT INTO pricing_configurations (
  config_key,
  config_category,
  config_data,
  description,
  version,
  is_active,
  data_source,
  confidence_level
) VALUES (
  'bess_default',
  'bess',
  '{
    "small_system_per_kwh": 140,
    "medium_system_per_kwh": 130,
    "large_system_per_kwh": 120,
    "small_system_size_mwh": 10,
    "large_system_size_mwh": 100,
    "degradation_rate": 0.02,
    "warranty_years": 10,
    "vendor_notes": "Based on Tesla Megapack, Fluence, and BYD pricing"
  }'::jsonb,
  'BESS pricing tiers based on system size with Q4 2024 market data',
  '1.0.0',
  true,
  'NREL ATB 2024, Tesla, Fluence, BYD quotes',
  'high'
);

-- Solar Pricing Configuration
INSERT INTO pricing_configurations (
  config_key,
  config_category,
  config_data,
  description,
  version,
  is_active,
  data_source,
  confidence_level
) VALUES (
  'solar_default',
  'solar',
  '{
    "utility_scale_per_watt": 0.65,
    "commercial_per_watt": 0.85,
    "small_scale_per_watt": 1.10,
    "tracking_upcharge": 0.08,
    "vendor_notes": "NREL ATB 2024 + First Solar, Canadian Solar quotes"
  }'::jsonb,
  'Solar PV pricing by scale',
  '1.0.0',
  true,
  'NREL ATB 2024, First Solar, Canadian Solar',
  'high'
);

-- Generator Pricing Configuration
INSERT INTO pricing_configurations (
  config_key,
  config_category,
  config_data,
  description,
  version,
  is_active,
  data_source,
  confidence_level
) VALUES (
  'generator_default',
  'generator',
  '{
    "diesel_per_kw": 800,
    "natural_gas_per_kw": 700,
    "dual_fuel_per_kw": 900,
    "vendor_notes": "Caterpillar, Cummins, Eaton quotes"
  }'::jsonb,
  'Generator pricing by fuel type',
  '1.0.0',
  true,
  'Caterpillar, Cummins, Eaton',
  'high'
);

-- Balance of Plant Configuration
INSERT INTO pricing_configurations (
  config_key,
  config_category,
  config_data,
  description,
  version,
  is_active,
  data_source,
  confidence_level
) VALUES (
  'balance_of_plant_default',
  'balance_of_plant',
  '{
    "bopPercentage": 0.12,
    "epcPercentage": 0.15,
    "contingencyPercentage": 0.05,
    "notes": "Industry standard ranges: BOP 10-15%, EPC 12-18%"
  }'::jsonb,
  'Balance of plant and installation costs',
  '1.0.0',
  true,
  'Industry standards',
  'high'
);

-- Fuel Cell Pricing Configuration (NEW - Dec 2025)
-- Sources: NREL, DOE Hydrogen Program, Bloom Energy quotes
INSERT INTO pricing_configurations (
  config_key,
  config_category,
  config_data,
  description,
  version,
  is_active,
  data_source,
  confidence_level
) VALUES (
  'fuel_cell_default',
  'fuel_cell',
  '{
    "hydrogen_per_kw": 3000,
    "natural_gas_fc_per_kw": 2500,
    "solid_oxide_per_kw": 4000,
    "installation_multiplier": 1.25,
    "vendor_notes": "Bloom Energy, FuelCell Energy, Plug Power pricing",
    "notes": "Hydrogen PEM cells most common; solid oxide for high efficiency applications"
  }'::jsonb,
  'Fuel cell system pricing by technology type',
  '1.0.0',
  true,
  'NREL, DOE Hydrogen Program, Bloom Energy',
  'high'
);

-- EV Charging Configuration
INSERT INTO pricing_configurations (
  config_key,
  config_category,
  config_data,
  description,
  version,
  is_active,
  data_source,
  confidence_level
) VALUES (
  'ev_charging_default',
  'ev_charging',
  '{
    "level2ACPerUnit": 8000,
    "dcFastPerUnit": 45000,
    "dcUltraFastPerUnit": 125000,
    "networkingCostPerUnit": 500,
    "vendor_notes": "ChargePoint, EVgo, Electrify America pricing"
  }'::jsonb,
  'EV charging station equipment costs',
  '1.0.0',
  true,
  'ChargePoint, EVgo, Electrify America',
  'high'
);

-- ========================================
-- 2. INSERT SAMPLE CALCULATION FORMULAS
-- ========================================

-- Battery Capacity Formula
INSERT INTO calculation_formulas (
  formula_key,
  formula_name,
  formula_category,
  formula_expression,
  formula_variables,
  output_variables,
  description,
  example_calculation,
  version,
  is_active,
  validation_status
) VALUES (
  'battery_capacity',
  'Battery Capacity Calculation',
  'sizing',
  'capacity_kwh = power_kw * duration_hours * efficiency_factor',
  '{"power_kw": {"type": "number", "description": "Battery power rating in kilowatts", "unit": "kW"}, "duration_hours": {"type": "number", "description": "Desired backup duration", "unit": "hours"}, "efficiency_factor": {"type": "number", "description": "Round-trip efficiency (typically 0.85-0.95)", "range": [0.8, 0.95]}}'::jsonb,
  '{"capacity_kwh": {"type": "number", "description": "Total battery capacity", "unit": "kWh"}}'::jsonb,
  'Calculates total battery capacity in kWh based on power rating and desired duration',
  'For 1000kW system with 4-hour duration: 1000 * 4 * 0.9 = 3600 kWh',
  '1.0.0',
  true,
  'validated'
);

-- ROI Calculation
INSERT INTO calculation_formulas (
  formula_key,
  formula_name,
  formula_category,
  formula_expression,
  formula_variables,
  output_variables,
  description,
  example_calculation,
  version,
  is_active,
  validation_status
) VALUES (
  'simple_roi',
  'Simple ROI / Payback Period',
  'financial',
  'roi_years = total_capex / annual_savings',
  '{"total_capex": {"type": "number", "description": "Total capital expenditure", "unit": "USD"}, "annual_savings": {"type": "number", "description": "Expected annual savings from energy arbitrage", "unit": "USD/year"}}'::jsonb,
  '{"roi_years": {"type": "number", "description": "Simple payback period", "unit": "years"}}'::jsonb,
  'Calculates simple payback period in years',
  'For $5M system with $500K annual savings: 5000000 / 500000 = 10 years',
  '1.0.0',
  true,
  'validated'
);

-- Energy Arbitrage Revenue
INSERT INTO calculation_formulas (
  formula_key,
  formula_name,
  formula_category,
  formula_expression,
  formula_variables,
  output_variables,
  description,
  example_calculation,
  version,
  is_active,
  validation_status
) VALUES (
  'energy_arbitrage_revenue',
  'Energy Arbitrage Annual Revenue',
  'financial',
  'annual_revenue = (peak_price - off_peak_price) * capacity_kwh * cycles_per_year * efficiency',
  '{"peak_price": {"type": "number", "description": "Peak electricity price", "unit": "USD/kWh"}, "off_peak_price": {"type": "number", "description": "Off-peak electricity price", "unit": "USD/kWh"}, "capacity_kwh": {"type": "number", "description": "Battery capacity", "unit": "kWh"}, "cycles_per_year": {"type": "number", "description": "Number of charge/discharge cycles per year"}, "efficiency": {"type": "number", "description": "Round-trip efficiency", "range": [0.8, 0.95]}}'::jsonb,
  '{"annual_revenue": {"type": "number", "description": "Estimated annual revenue", "unit": "USD/year"}}'::jsonb,
  'Estimates annual revenue from energy arbitrage',
  'Peak $0.20/kWh, Off-peak $0.05/kWh, 1000kWh, 250 cycles: (0.20-0.05) * 1000 * 250 * 0.9 = $33,750/year',
  '1.0.0',
  true,
  'validated'
);

-- Demand Charge Savings
INSERT INTO calculation_formulas (
  formula_key,
  formula_name,
  formula_category,
  formula_expression,
  formula_variables,
  output_variables,
  description,
  example_calculation,
  version,
  is_active,
  validation_status
) VALUES (
  'demand_charge_savings',
  'Monthly Demand Charge Savings',
  'financial',
  'monthly_savings = peak_demand_reduction_kw * demand_charge_per_kw',
  '{"peak_demand_reduction_kw": {"type": "number", "description": "Peak demand reduced by battery", "unit": "kW"}, "demand_charge_per_kw": {"type": "number", "description": "Utility demand charge rate", "unit": "USD/kW"}}'::jsonb,
  '{"monthly_savings": {"type": "number", "description": "Monthly savings", "unit": "USD/month"}}'::jsonb,
  'Calculates monthly savings from reducing peak demand charges',
  'Reducing 500kW peak with $15/kW demand charge: 500 * 15 = $7,500/month',
  '1.0.0',
  true,
  'validated'
);

-- System Cost Estimate
INSERT INTO calculation_formulas (
  formula_key,
  formula_name,
  formula_category,
  formula_expression,
  formula_variables,
  output_variables,
  description,
  example_calculation,
  version,
  is_active,
  validation_status
) VALUES (
  'total_system_cost',
  'Total Installed System Cost',
  'financial',
  'total_cost = (battery_cost + inverter_cost + bop_cost) * (1 + epc_percentage + contingency)',
  '{"battery_cost": {"type": "number", "description": "Battery equipment cost", "unit": "USD"}, "inverter_cost": {"type": "number", "description": "Inverter/PCS cost", "unit": "USD"}, "bop_cost": {"type": "number", "description": "Balance of plant", "unit": "USD"}, "epc_percentage": {"type": "number", "description": "EPC markup (typically 0.15)", "range": [0.1, 0.2]}, "contingency": {"type": "number", "description": "Contingency reserve (typically 0.05)", "range": [0.03, 0.1]}}'::jsonb,
  '{"total_cost": {"type": "number", "description": "Total installed system cost", "unit": "USD"}}'::jsonb,
  'Calculates total installed system cost including all components',
  'Equipment $1M, BOP $120K, EPC 15%, Contingency 5%: (1000000 + 120000) * 1.20 = $1,344,000',
  '1.0.0',
  true,
  'validated'
);

-- ========================================
-- 3. INSERT SAMPLE USE CASE TEMPLATES
-- ========================================

INSERT INTO use_cases (
  name,
  slug,
  description,
  icon,
  category,
  required_tier,
  is_active,
  display_order
) VALUES
(
  'Peak Shaving - Commercial',
  'peak-shaving-commercial',
  'Reduce demand charges by discharging battery during peak usage periods',
  '⚡',
  'commercial',
  'free',
  true,
  1
),
(
  'Energy Arbitrage - Utility Scale',
  'energy-arbitrage-utility',
  'Buy energy during low-price periods, sell during high-price periods',
  '💰',
  'utility',
  'free',
  true,
  2
),
(
  'Backup Power - Critical Infrastructure',
  'backup-critical-infrastructure',
  'Provide reliable backup power for hospitals, data centers, emergency services',
  '🏥',
  'institutional',
  'free',
  true,
  3
),
(
  'EV Fast Charging Station',
  'ev-fast-charging',
  'Buffer power for DC fast charging without grid upgrades',
  '🔌',
  'commercial',
  'free',
  true,
  4
);

-- ========================================
-- 4. INSERT MARKET PRICING DATA SAMPLES
-- ========================================

INSERT INTO market_pricing_data (
  equipment_type,
  region,
  price_per_unit,
  unit_type,
  currency,
  data_source,
  data_date,
  trend_direction,
  confidence_level,
  notes
) VALUES
(
  'battery',
  'United States',
  120.00,
  'kwh',
  'USD',
  'NREL ATB 2024',
  '2024-11-01',
  'down',
  'high',
  'Utility-scale 4-hour BESS system pricing from Annual Technology Baseline'
),
(
  'battery',
  'Global',
  110.00,
  'kwh',
  'USD',
  'Bloomberg NEF Q4 2024',
  '2024-10-15',
  'down',
  'high',
  'Lithium-ion battery pack price survey from Bloomberg New Energy Finance'
),
(
  'solar_panel',
  'United States',
  0.65,
  'watt',
  'USD',
  'NREL ATB 2024',
  '2024-11-01',
  'down',
  'high',
  'Utility-scale solar PV module pricing'
);

-- ========================================
-- 5. VERIFY DATA INSERTION
-- ========================================

-- Check pricing configurations
SELECT 
  id,
  config_key,
  config_category,
  is_active,
  version,
  created_at
FROM pricing_configurations
ORDER BY config_category, config_key;

-- Check calculation formulas
SELECT 
  id,
  formula_key,
  formula_name,
  formula_category,
  validation_status,
  created_at
FROM calculation_formulas
ORDER BY formula_category, formula_name;

-- Check use cases
SELECT 
  id,
  name,
  slug,
  category,
  display_order
FROM use_cases
ORDER BY display_order;

-- Check market pricing data
SELECT 
  id,
  equipment_type,
  region,
  price_per_unit,
  unit_type,
  data_date
FROM market_pricing_data
ORDER BY equipment_type, data_date DESC;

-- Show summary
DO $$
DECLARE
    config_count INTEGER;
    formula_count INTEGER;
    usecase_count INTEGER;
    market_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO config_count FROM pricing_configurations;
    SELECT COUNT(*) INTO formula_count FROM calculation_formulas;
    SELECT COUNT(*) INTO usecase_count FROM use_cases;
    SELECT COUNT(*) INTO market_count FROM market_pricing_data;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATA SEED COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '% pricing configurations inserted', config_count;
    RAISE NOTICE '% calculation formulas inserted', formula_count;
    RAISE NOTICE '% use case templates inserted', usecase_count;
    RAISE NOTICE '% market pricing records inserted', market_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Database ready for use!';
    RAISE NOTICE '========================================';
END $$;
