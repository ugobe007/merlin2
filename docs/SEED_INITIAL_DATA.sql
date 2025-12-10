-- ========================================
-- INITIAL DATA SEED - Run AFTER deploying MASTER_SCHEMA.sql
-- ========================================
-- Purpose: Populate new database with initial configurations
-- Date: November 2025 (Updated December 2025)
-- 
-- INSTRUCTIONS:
-- 1. Ensure MASTER_SCHEMA.sql has been deployed successfully
-- 2. Run this script in Supabase SQL Editor
-- 3. Verify data was inserted correctly
--
-- NOTE: Uses ON CONFLICT to safely update existing records
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
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  data_source = EXCLUDED.data_source,
  updated_at = NOW();

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
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  data_source = EXCLUDED.data_source,
  updated_at = NOW();

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
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  data_source = EXCLUDED.data_source,
  updated_at = NOW();

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
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  data_source = EXCLUDED.data_source,
  updated_at = NOW();

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
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  data_source = EXCLUDED.data_source,
  updated_at = NOW();

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
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  data_source = EXCLUDED.data_source,
  updated_at = NOW();

-- Commissioning Costs Configuration (NEW - Dec 2025)
-- Sources: DNV GL, UL 9540A, IEC 61508/62443 compliance requirements
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
  'commissioning_costs_2025',
  'commissioning',
  '{
    "fatPercentage": 0.015,
    "satPercentage": 0.025,
    "scadaBaseCost": 25000,
    "scadaPerMW": 5000,
    "safetyTestBaseCost": 15000,
    "safetyTestPerMW": 3000,
    "performanceTestBaseCost": 10000,
    "performanceTestPerMWh": 500,
    "notes": "FAT=Factory Acceptance Test, SAT=Site Acceptance Test, includes IEC 61508/62443 compliance"
  }'::jsonb,
  'Commissioning and functional safety testing costs',
  '1.0.0',
  true,
  'DNV GL, UL 9540A, IEC 61508/62443',
  'high'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  data_source = EXCLUDED.data_source,
  updated_at = NOW();

-- Site Certification Costs Configuration (NEW - Dec 2025)
-- Sources: FERC 2222, state PUC requirements, NFPA 855
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
  'certification_costs_2025',
  'certification',
  '{
    "interconnectionBaseCost": 10000,
    "interconnectionPerMW": 15000,
    "utilityUpgradePercentage": 0.03,
    "envPermitBaseCost": 5000,
    "envPermitPerMW": 2000,
    "buildingPermitPercentage": 0.005,
    "buildingPermitMin": 2500,
    "fireCodeBaseCost": 8000,
    "fireCodePerMWh": 1000,
    "notes": "Includes FERC 2222 compliance, NFPA 855 fire code, environmental permits"
  }'::jsonb,
  'Site certification, permitting, and interconnection costs',
  '1.0.0',
  true,
  'FERC, State PUCs, NFPA 855, local jurisdictions',
  'high'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  data_source = EXCLUDED.data_source,
  updated_at = NOW();

-- Annual Operating Costs Configuration (NEW - Dec 2025)
-- Sources: NREL O&M benchmarks, industry standard warranties
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
  'annual_costs_2025',
  'annual_opex',
  '{
    "omPercentage": 0.015,
    "warrantyPercentage": 0.005,
    "capacityTestBaseCost": 3000,
    "capacityTestPerMWh": 200,
    "insurancePercentage": 0.004,
    "softwareBaseCost": 5000,
    "softwarePerMW": 2000,
    "year1Premium": 1.25,
    "notes": "O&M 1.5% of battery capex, insurance 0.4% of total equipment"
  }'::jsonb,
  'Annual operating costs (O&M, warranty, testing, insurance, software)',
  '1.0.0',
  true,
  'NREL O&M benchmarks, industry standards',
  'high'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  data_source = EXCLUDED.data_source,
  updated_at = NOW();

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
)
ON CONFLICT (formula_key) DO UPDATE SET
  formula_expression = EXCLUDED.formula_expression,
  formula_variables = EXCLUDED.formula_variables,
  output_variables = EXCLUDED.output_variables,
  description = EXCLUDED.description,
  updated_at = NOW();

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
)
ON CONFLICT (formula_key) DO UPDATE SET
  formula_expression = EXCLUDED.formula_expression,
  formula_variables = EXCLUDED.formula_variables,
  output_variables = EXCLUDED.output_variables,
  description = EXCLUDED.description,
  updated_at = NOW();

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
)
ON CONFLICT (formula_key) DO UPDATE SET
  formula_expression = EXCLUDED.formula_expression,
  formula_variables = EXCLUDED.formula_variables,
  output_variables = EXCLUDED.output_variables,
  description = EXCLUDED.description,
  updated_at = NOW();

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
)
ON CONFLICT (formula_key) DO UPDATE SET
  formula_expression = EXCLUDED.formula_expression,
  formula_variables = EXCLUDED.formula_variables,
  output_variables = EXCLUDED.output_variables,
  description = EXCLUDED.description,
  updated_at = NOW();

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
)
ON CONFLICT (formula_key) DO UPDATE SET
  formula_expression = EXCLUDED.formula_expression,
  formula_variables = EXCLUDED.formula_variables,
  output_variables = EXCLUDED.output_variables,
  description = EXCLUDED.description,
  updated_at = NOW();

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
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  updated_at = NOW();

-- ========================================
-- 4. INSERT MARKET PRICING DATA - COMPREHENSIVE GLOBAL DATABASE
-- ========================================
-- Updated: December 2025
-- Sources: NREL ATB 2024, Bloomberg NEF, IRENA, Wood Mackenzie, S&P Global
-- Equipment: Batteries, Solar, Wind, Inverters, Transformers, Generators, EV Chargers
-- Regions: Americas, Europe, Asia-Pacific, Middle East
-- ========================================

-- Clear existing market pricing data for fresh insert
DELETE FROM market_pricing_data WHERE data_source IN (
  'NREL ATB 2024', 
  'Bloomberg NEF Q4 2024', 
  'IRENA 2024',
  'Wood Mackenzie 2024',
  'S&P Global 2024',
  'Regional Market Data 2024'
);

-- ========================================
-- BATTERY PRICING BY REGION ($/kWh)
-- ========================================

INSERT INTO market_pricing_data (equipment_type, region, price_per_unit, unit_type, currency, data_source, data_date, trend_direction, confidence_level, notes) VALUES
-- AMERICAS
('battery', 'United States', 120.00, 'kwh', 'USD', 'NREL ATB 2024', '2024-12-01', 'down', 'high', 'Utility-scale 4-hour BESS, Tesla Megapack/Fluence benchmark'),
('battery', 'Mexico', 135.00, 'kwh', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Import duties + logistics from US/China suppliers'),
('battery', 'Brazil', 145.00, 'kwh', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'BYD, CATL presence; import tariffs apply'),
('battery', 'Chile', 130.00, 'kwh', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Strong renewable market, lithium producer advantage'),
('battery', 'Argentina', 150.00, 'kwh', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Lithium reserves but limited local manufacturing'),
('battery', 'Peru', 145.00, 'kwh', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Growing mining sector demand, import dependent'),

-- EUROPE
('battery', 'Germany', 135.00, 'kwh', 'EUR', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'EU manufacturing push, Northvolt/CATL local production'),
('battery', 'United Kingdom', 140.00, 'kwh', 'GBP', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'Post-Brexit import complexity, strong grid services market'),
('battery', 'France', 132.00, 'kwh', 'EUR', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'Nuclear baseload + BESS for flexibility'),
('battery', 'Spain', 128.00, 'kwh', 'EUR', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'Strong solar+storage market, competitive pricing'),
('battery', 'Italy', 138.00, 'kwh', 'EUR', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'medium', 'Grid modernization investments ongoing'),
('battery', 'Sweden', 142.00, 'kwh', 'EUR', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'Northvolt gigafactory, local supply chain developing'),
('battery', 'Norway', 145.00, 'kwh', 'EUR', 'Wood Mackenzie 2024', '2024-12-01', 'stable', 'high', 'Hydro-dominated grid, BESS for frequency regulation'),
('battery', 'Finland', 140.00, 'kwh', 'EUR', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'medium', 'Cold climate considerations, grid stability focus'),
('battery', 'Denmark', 138.00, 'kwh', 'EUR', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'Wind integration leader, strong storage demand'),

-- ASIA-PACIFIC
('battery', 'China', 85.00, 'kwh', 'USD', 'Bloomberg NEF Q4 2024', '2024-12-01', 'down', 'high', 'CATL, BYD, EVE domestic pricing - global cost leader'),
('battery', 'Japan', 155.00, 'kwh', 'USD', 'S&P Global 2024', '2024-12-01', 'stable', 'high', 'Premium safety standards, Panasonic/Toyota presence'),
('battery', 'South Korea', 125.00, 'kwh', 'USD', 'S&P Global 2024', '2024-12-01', 'down', 'high', 'LG Energy, Samsung SDI, SK On domestic production'),
('battery', 'India', 115.00, 'kwh', 'USD', 'IRENA 2024', '2024-12-01', 'down', 'medium', 'PLI scheme incentives, emerging local manufacturing'),
('battery', 'Singapore', 145.00, 'kwh', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Premium logistics hub, high-spec requirements'),
('battery', 'Malaysia', 125.00, 'kwh', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Manufacturing hub for electronics, growing BESS'),
('battery', 'Indonesia', 130.00, 'kwh', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Nickel reserves, CATL/Hyundai investments'),
('battery', 'Australia', 140.00, 'kwh', 'AUD', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'Strong grid storage market, Tesla/Fluence presence'),
('battery', 'New Zealand', 155.00, 'kwh', 'NZD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Import dependent, renewable integration focus'),

-- MIDDLE EAST
('battery', 'Saudi Arabia', 135.00, 'kwh', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'NEOM/Vision 2030 mega-projects driving demand'),
('battery', 'UAE', 130.00, 'kwh', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Dubai Clean Energy Strategy, major solar+storage'),
('battery', 'Global', 110.00, 'kwh', 'USD', 'Bloomberg NEF Q4 2024', '2024-12-01', 'down', 'high', 'Weighted average pack price - utility scale'),

-- ========================================
-- SOLAR PV PRICING BY REGION ($/Watt)
-- ========================================

-- AMERICAS
('solar_panel', 'United States', 0.65, 'watt', 'USD', 'NREL ATB 2024', '2024-12-01', 'down', 'high', 'Utility-scale bifacial modules, First Solar/LONGi'),
('solar_panel', 'Mexico', 0.58, 'watt', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Strong solar resource, proximity to US market'),
('solar_panel', 'Brazil', 0.55, 'watt', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Growing distributed generation market'),
('solar_panel', 'Chile', 0.52, 'watt', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Atacama Desert - world''s best solar resource'),
('solar_panel', 'Argentina', 0.60, 'watt', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Currency volatility affects pricing'),
('solar_panel', 'Peru', 0.58, 'watt', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Coastal desert solar potential'),

-- EUROPE
('solar_panel', 'Germany', 0.72, 'watt', 'EUR', 'IRENA 2024', '2024-12-01', 'down', 'high', 'Premium quality standards, Meyer Burger local'),
('solar_panel', 'United Kingdom', 0.75, 'watt', 'GBP', 'IRENA 2024', '2024-12-01', 'down', 'high', 'Rooftop focus, limited utility-scale'),
('solar_panel', 'France', 0.68, 'watt', 'EUR', 'IRENA 2024', '2024-12-01', 'down', 'high', 'Growing agrivoltaics market'),
('solar_panel', 'Spain', 0.55, 'watt', 'EUR', 'IRENA 2024', '2024-12-01', 'down', 'high', 'Largest EU solar market, excellent resource'),
('solar_panel', 'Italy', 0.65, 'watt', 'EUR', 'IRENA 2024', '2024-12-01', 'down', 'medium', 'Strong rooftop + agrivoltaics'),
('solar_panel', 'Sweden', 0.78, 'watt', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Limited solar resource, premium pricing'),
('solar_panel', 'Norway', 0.82, 'watt', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Niche market, hydro-dominated'),
('solar_panel', 'Finland', 0.80, 'watt', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Seasonal limitations, growing interest'),
('solar_panel', 'Denmark', 0.70, 'watt', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Hybrid wind-solar projects growing'),

-- ASIA-PACIFIC
('solar_panel', 'China', 0.28, 'watt', 'USD', 'Bloomberg NEF Q4 2024', '2024-12-01', 'down', 'high', 'LONGi, Trina, JA Solar - global cost leader'),
('solar_panel', 'Japan', 0.85, 'watt', 'USD', 'S&P Global 2024', '2024-12-01', 'stable', 'high', 'Premium domestic modules, limited land'),
('solar_panel', 'South Korea', 0.72, 'watt', 'USD', 'S&P Global 2024', '2024-12-01', 'down', 'high', 'Hanwha Q Cells, LG presence'),
('solar_panel', 'India', 0.32, 'watt', 'USD', 'IRENA 2024', '2024-12-01', 'down', 'high', 'Massive deployment, local manufacturing push'),
('solar_panel', 'Singapore', 0.75, 'watt', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Space-constrained, floating solar focus'),
('solar_panel', 'Malaysia', 0.45, 'watt', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Panel manufacturing hub'),
('solar_panel', 'Indonesia', 0.52, 'watt', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Growing rooftop and utility markets'),
('solar_panel', 'Australia', 0.58, 'watt', 'AUD', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'Excellent resource, strong residential market'),
('solar_panel', 'New Zealand', 0.72, 'watt', 'NZD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Smaller market, import dependent'),

-- ========================================
-- WIND TURBINE PRICING BY REGION ($/kW)
-- ========================================

-- AMERICAS
('wind_turbine', 'United States', 850.00, 'kw', 'USD', 'NREL ATB 2024', '2024-12-01', 'down', 'high', 'Onshore utility-scale, Vestas/GE/Siemens Gamesa'),
('wind_turbine', 'Mexico', 920.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Strong wind corridor, Oaxaca/Tamaulipas'),
('wind_turbine', 'Brazil', 880.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Nordeste wind hub, growing offshore'),
('wind_turbine', 'Chile', 900.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Excellent wind resource, grid challenges'),
('wind_turbine', 'Argentina', 950.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Patagonia wind potential, currency issues'),
('wind_turbine', 'Peru', 980.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'low', 'Emerging market, coastal wind'),

-- EUROPE
('wind_turbine', 'Germany', 1050.00, 'kw', 'EUR', 'IRENA 2024', '2024-12-01', 'stable', 'high', 'Mature market, repowering focus'),
('wind_turbine', 'United Kingdom', 1100.00, 'kw', 'GBP', 'IRENA 2024', '2024-12-01', 'down', 'high', 'Offshore wind leader, higher specs'),
('wind_turbine', 'France', 980.00, 'kw', 'EUR', 'IRENA 2024', '2024-12-01', 'down', 'high', 'Growing offshore, onshore mature'),
('wind_turbine', 'Spain', 920.00, 'kw', 'EUR', 'IRENA 2024', '2024-12-01', 'down', 'high', 'Major wind market, Siemens Gamesa hub'),
('wind_turbine', 'Sweden', 950.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Strong onshore, growing offshore'),
('wind_turbine', 'Norway', 980.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Floating offshore pioneer'),
('wind_turbine', 'Finland', 920.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Growing capacity rapidly'),
('wind_turbine', 'Denmark', 900.00, 'kw', 'EUR', 'IRENA 2024', '2024-12-01', 'down', 'high', 'Vestas home market, offshore expertise'),

-- ASIA-PACIFIC
('wind_turbine', 'China', 450.00, 'kw', 'USD', 'Bloomberg NEF Q4 2024', '2024-12-01', 'down', 'high', 'Goldwind, Envision, MingYang - global cost leader'),
('wind_turbine', 'Japan', 1350.00, 'kw', 'USD', 'S&P Global 2024', '2024-12-01', 'stable', 'high', 'Offshore focus, typhoon-resistant designs'),
('wind_turbine', 'South Korea', 1200.00, 'kw', 'USD', 'S&P Global 2024', '2024-12-01', 'down', 'medium', 'Offshore wind push, floating projects'),
('wind_turbine', 'India', 680.00, 'kw', 'USD', 'IRENA 2024', '2024-12-01', 'down', 'high', 'Suzlon, local manufacturing'),
('wind_turbine', 'Australia', 1150.00, 'kw', 'AUD', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'Strong resource, grid connection challenges'),
('wind_turbine', 'New Zealand', 1250.00, 'kw', 'NZD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Excellent resource, smaller scale'),

-- ========================================
-- INVERTER/PCS PRICING BY REGION ($/kW)
-- ========================================

-- AMERICAS
('inverter', 'United States', 85.00, 'kw', 'USD', 'NREL ATB 2024', '2024-12-01', 'down', 'high', 'Utility-scale string/central inverters'),
('inverter', 'Mexico', 92.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Import from US/China'),
('inverter', 'Brazil', 98.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Local assembly growing'),
('inverter', 'Chile', 95.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Import dependent'),
('inverter', 'Argentina', 105.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'low', 'Import restrictions impact'),
('inverter', 'Peru', 100.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Growing market'),

-- EUROPE
('inverter', 'Germany', 95.00, 'kw', 'EUR', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'SMA, Kaco local manufacturing'),
('inverter', 'United Kingdom', 98.00, 'kw', 'GBP', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'Grid code compliance adds cost'),
('inverter', 'France', 92.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'EU supply chain'),
('inverter', 'Spain', 88.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Large-scale project pricing'),
('inverter', 'Sweden', 98.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Nordic grid requirements'),
('inverter', 'Norway', 100.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Specialized grid services'),
('inverter', 'Finland', 96.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Cold climate variants'),
('inverter', 'Denmark', 94.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Grid-forming capabilities'),

-- ASIA-PACIFIC
('inverter', 'China', 45.00, 'kw', 'USD', 'Bloomberg NEF Q4 2024', '2024-12-01', 'down', 'high', 'Huawei, Sungrow, GoodWe domestic'),
('inverter', 'Japan', 120.00, 'kw', 'USD', 'S&P Global 2024', '2024-12-01', 'stable', 'high', 'Premium safety/quality standards'),
('inverter', 'South Korea', 95.00, 'kw', 'USD', 'S&P Global 2024', '2024-12-01', 'down', 'high', 'Samsung/LG technology'),
('inverter', 'India', 55.00, 'kw', 'USD', 'IRENA 2024', '2024-12-01', 'down', 'medium', 'Growing local manufacturing'),
('inverter', 'Singapore', 105.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Premium specs required'),
('inverter', 'Malaysia', 65.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Manufacturing hub'),
('inverter', 'Indonesia', 72.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Import + local assembly'),
('inverter', 'Australia', 95.00, 'kw', 'AUD', 'Wood Mackenzie 2024', '2024-12-01', 'down', 'high', 'Grid compliance requirements'),
('inverter', 'New Zealand', 105.00, 'kw', 'NZD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Import dependent'),

-- ========================================
-- TRANSFORMER PRICING BY REGION ($/kVA)
-- ========================================

-- AMERICAS
('transformer', 'United States', 35.00, 'kva', 'USD', 'NREL ATB 2024', '2024-12-01', 'up', 'high', 'Supply chain constraints, lead times extended'),
('transformer', 'Mexico', 38.00, 'kva', 'USD', 'Regional Market Data 2024', '2024-12-01', 'up', 'medium', 'US supply chain dependent'),
('transformer', 'Brazil', 42.00, 'kva', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'WEG local manufacturing'),
('transformer', 'Chile', 45.00, 'kva', 'USD', 'Regional Market Data 2024', '2024-12-01', 'up', 'medium', 'Import dependent'),

-- EUROPE
('transformer', 'Germany', 42.00, 'kva', 'EUR', 'Wood Mackenzie 2024', '2024-12-01', 'up', 'high', 'Siemens, ABB local production'),
('transformer', 'United Kingdom', 45.00, 'kva', 'GBP', 'Wood Mackenzie 2024', '2024-12-01', 'up', 'high', 'Supply constraints'),
('transformer', 'Sweden', 40.00, 'kva', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'up', 'high', 'ABB headquarters advantage'),
('transformer', 'Norway', 44.00, 'kva', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'up', 'medium', 'Specialized specs'),
('transformer', 'Finland', 42.00, 'kva', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'up', 'medium', 'Cold climate designs'),
('transformer', 'Denmark', 41.00, 'kva', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Offshore wind specs'),

-- ASIA-PACIFIC
('transformer', 'China', 22.00, 'kva', 'USD', 'Bloomberg NEF Q4 2024', '2024-12-01', 'stable', 'high', 'TBEA, XD Group domestic'),
('transformer', 'Japan', 55.00, 'kva', 'USD', 'S&P Global 2024', '2024-12-01', 'stable', 'high', 'Premium quality, Hitachi/Toshiba'),
('transformer', 'South Korea', 38.00, 'kva', 'USD', 'S&P Global 2024', '2024-12-01', 'stable', 'high', 'Hyundai Electric'),
('transformer', 'India', 28.00, 'kva', 'USD', 'IRENA 2024', '2024-12-01', 'stable', 'medium', 'CG Power, Siemens India'),
('transformer', 'Australia', 48.00, 'kva', 'AUD', 'Wood Mackenzie 2024', '2024-12-01', 'up', 'high', 'Import dependent, long lead times'),
('transformer', 'New Zealand', 52.00, 'kva', 'NZD', 'Regional Market Data 2024', '2024-12-01', 'up', 'medium', 'Small market premium'),

-- ========================================
-- GENERATOR PRICING BY REGION ($/kW - Diesel)
-- ========================================

-- AMERICAS
('generator', 'United States', 800.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'high', 'Caterpillar, Cummins, Kohler'),
('generator', 'Mexico', 850.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'US imports + local assembly'),
('generator', 'Brazil', 920.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Import duties, local Cummins'),
('generator', 'Chile', 880.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Mining sector demand'),

-- EUROPE
('generator', 'Germany', 950.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'stable', 'high', 'MTU, MAN engines'),
('generator', 'United Kingdom', 920.00, 'kw', 'GBP', 'Regional Market Data 2024', '2024-12-01', 'stable', 'high', 'Perkins, FG Wilson'),
('generator', 'Sweden', 980.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Volvo Penta presence'),
('generator', 'Norway', 1020.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Offshore/marine specs'),
('generator', 'Finland', 960.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Wärtsilä presence'),
('generator', 'Denmark', 940.00, 'kw', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Limited demand'),

-- ASIA-PACIFIC
('generator', 'China', 450.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Weichai, Yuchai domestic'),
('generator', 'Japan', 1100.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'high', 'Yanmar, Kubota premium'),
('generator', 'South Korea', 780.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'high', 'Doosan presence'),
('generator', 'India', 520.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Kirloskar, Ashok Leyland'),
('generator', 'Singapore', 950.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'high', 'Premium data center specs'),
('generator', 'Malaysia', 720.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Regional hub'),
('generator', 'Indonesia', 680.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Growing demand'),
('generator', 'Australia', 920.00, 'kw', 'AUD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'high', 'Mining/remote site focus'),
('generator', 'New Zealand', 980.00, 'kw', 'NZD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'medium', 'Import dependent'),

-- ========================================
-- EV CHARGER PRICING BY REGION
-- ========================================

-- Level 2 AC Chargers ($/unit - 7-22 kW)
('ev_charger_l2', 'United States', 8000.00, 'unit', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'ChargePoint, Enel X, Siemens'),
('ev_charger_l2', 'Germany', 7500.00, 'unit', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'ABB, Siemens, Wallbox'),
('ev_charger_l2', 'United Kingdom', 7800.00, 'unit', 'GBP', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Pod Point, BP Pulse'),
('ev_charger_l2', 'China', 3500.00, 'unit', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'StarCharge, TELD domestic'),
('ev_charger_l2', 'Japan', 9500.00, 'unit', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'high', 'Nichicon, Panasonic'),
('ev_charger_l2', 'Australia', 8500.00, 'unit', 'AUD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Tritium local, imports'),
('ev_charger_l2', 'Norway', 7200.00, 'unit', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Highest EV penetration'),

-- DC Fast Chargers ($/unit - 50-150 kW)
('ev_charger_dcfc', 'United States', 45000.00, 'unit', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'ABB, Tritium, ChargePoint'),
('ev_charger_dcfc', 'Germany', 42000.00, 'unit', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'ABB, Siemens, Ionity'),
('ev_charger_dcfc', 'United Kingdom', 44000.00, 'unit', 'GBP', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Rapid growth market'),
('ev_charger_dcfc', 'China', 18000.00, 'unit', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'StarCharge, TELD, XCharge'),
('ev_charger_dcfc', 'Japan', 55000.00, 'unit', 'USD', 'Regional Market Data 2024', '2024-12-01', 'stable', 'high', 'CHAdeMO standard'),
('ev_charger_dcfc', 'South Korea', 38000.00, 'unit', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'SK Signet, Hyundai'),
('ev_charger_dcfc', 'Australia', 52000.00, 'unit', 'AUD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Tritium local manufacturing'),
('ev_charger_dcfc', 'Norway', 40000.00, 'unit', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Dense network established'),

-- High Power Chargers ($/unit - 250-350 kW)
('ev_charger_hpc', 'United States', 125000.00, 'unit', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'ABB Terra, Tritium PKM'),
('ev_charger_hpc', 'Germany', 115000.00, 'unit', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Ionity network standard'),
('ev_charger_hpc', 'United Kingdom', 120000.00, 'unit', 'GBP', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Gridserve, BP Pulse'),
('ev_charger_hpc', 'China', 55000.00, 'unit', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'NIO, XPeng superchargers'),
('ev_charger_hpc', 'Norway', 105000.00, 'unit', 'EUR', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Ionity, Circle K network'),
('ev_charger_hpc', 'Australia', 135000.00, 'unit', 'AUD', 'Regional Market Data 2024', '2024-12-01', 'down', 'high', 'Highway corridor focus'),

-- ========================================
-- FUEL CELL PRICING BY REGION ($/kW)
-- ========================================

('fuel_cell', 'United States', 3000.00, 'kw', 'USD', 'S&P Global 2024', '2024-12-01', 'down', 'high', 'Bloom Energy, Plug Power'),
('fuel_cell', 'Germany', 3200.00, 'kw', 'EUR', 'S&P Global 2024', '2024-12-01', 'down', 'high', 'Siemens Energy hydrogen push'),
('fuel_cell', 'Japan', 2800.00, 'kw', 'USD', 'S&P Global 2024', '2024-12-01', 'down', 'high', 'Toyota, Panasonic FC leadership'),
('fuel_cell', 'South Korea', 2600.00, 'kw', 'USD', 'S&P Global 2024', '2024-12-01', 'down', 'high', 'Hyundai, Doosan FC focus'),
('fuel_cell', 'China', 1800.00, 'kw', 'USD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Emerging domestic manufacturing'),
('fuel_cell', 'Australia', 3400.00, 'kw', 'AUD', 'Regional Market Data 2024', '2024-12-01', 'down', 'medium', 'Green hydrogen export focus');

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
