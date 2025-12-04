-- ============================================================================
-- COMPREHENSIVE DATA MIGRATION
-- ============================================================================
-- Created: December 2, 2025
-- Purpose: Add all missing database tables for improved quote accuracy
-- Tables: state_incentives, depreciation_schedules, ev_charger_catalog,
--         equipment_vendors, iso_market_prices
-- ============================================================================

-- ============================================================================
-- TABLE 1: STATE INCENTIVES & REBATES
-- ============================================================================
-- Source: DSIRE Database, State Program Websites
-- Update Frequency: Quarterly (programs change/expire)
-- External Link: https://www.dsireusa.org/

CREATE TABLE IF NOT EXISTS state_incentives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location
    state_code VARCHAR(2) NOT NULL,
    state_name VARCHAR(50) NOT NULL,
    
    -- Program Details
    program_name VARCHAR(100) NOT NULL,
    program_code VARCHAR(20),
    administrator VARCHAR(100),
    
    -- Incentive Type
    incentive_type VARCHAR(30) NOT NULL, -- 'rebate', 'tax_credit', 'srec', 'performance_payment', 'grant', 'loan'
    technology VARCHAR(30) NOT NULL, -- 'storage', 'solar', 'solar_plus_storage', 'ev_charger', 'all'
    
    -- Financial Details
    amount_type VARCHAR(20) NOT NULL, -- 'per_kwh', 'per_kw', 'percentage', 'fixed'
    amount DECIMAL(10,2) NOT NULL,
    amount_unit VARCHAR(20), -- '$/kWh', '$/kW', '%', '$'
    cap_amount DECIMAL(12,2),
    
    -- Eligibility
    sector VARCHAR(30) DEFAULT 'commercial', -- 'residential', 'commercial', 'industrial', 'all'
    min_system_size_kw DECIMAL(10,2),
    max_system_size_kw DECIMAL(10,2),
    requires_solar BOOLEAN DEFAULT false,
    additional_requirements TEXT,
    
    -- Program Status
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    funding_status VARCHAR(20) DEFAULT 'available', -- 'available', 'waitlist', 'closed', 'limited'
    
    -- Links
    program_url VARCHAR(500),
    application_url VARCHAR(500),
    
    -- Metadata
    data_source VARCHAR(100) DEFAULT 'DSIRE',
    last_verified DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(state_code, program_code)
);

CREATE INDEX IF NOT EXISTS idx_state_incentives_state ON state_incentives(state_code);
CREATE INDEX IF NOT EXISTS idx_state_incentives_type ON state_incentives(incentive_type);
CREATE INDEX IF NOT EXISTS idx_state_incentives_active ON state_incentives(is_active);

-- Insert Major State Incentives (Source: DSIRE 2024)
INSERT INTO state_incentives (
    state_code, state_name, program_name, program_code, administrator,
    incentive_type, technology, amount_type, amount, amount_unit, cap_amount,
    sector, min_system_size_kw, max_system_size_kw, requires_solar,
    is_active, start_date, end_date, funding_status, program_url, data_source
) VALUES
-- CALIFORNIA
('CA', 'California', 'Self-Generation Incentive Program (SGIP)', 'SGIP', 'CPUC/Utilities',
 'rebate', 'storage', 'per_kwh', 150, '$/kWh', 1000000,
 'commercial', 10, 10000, false,
 true, '2020-01-01', '2025-12-31', 'available', 'https://www.selfgenca.com/', 'DSIRE'),

('CA', 'California', 'Investment Tax Credit (State)', 'CA-ITC', 'Franchise Tax Board',
 'tax_credit', 'solar_plus_storage', 'percentage', 30, '%', NULL,
 'commercial', NULL, NULL, true,
 true, '2022-01-01', '2032-12-31', 'available', 'https://www.ftb.ca.gov/', 'DSIRE'),

('CA', 'California', 'Net Energy Metering 3.0', 'NEM3', 'CPUC',
 'performance_payment', 'solar_plus_storage', 'per_kwh', 0.08, '$/kWh', NULL,
 'all', NULL, NULL, true,
 true, '2023-04-15', NULL, 'available', 'https://www.cpuc.ca.gov/nem/', 'DSIRE'),

-- MASSACHUSETTS
('MA', 'Massachusetts', 'SMART Program', 'SMART', 'DOER',
 'performance_payment', 'solar_plus_storage', 'per_kwh', 0.10, '$/kWh', NULL,
 'commercial', 25, 5000, true,
 true, '2018-01-01', '2026-12-31', 'available', 'https://www.mass.gov/smart', 'DSIRE'),

('MA', 'Massachusetts', 'Clean Peak Energy Standard', 'CPES', 'DOER',
 'srec', 'storage', 'per_kwh', 0.04, '$/kWh', NULL,
 'commercial', 100, NULL, false,
 true, '2020-08-01', NULL, 'available', 'https://www.mass.gov/clean-peak-standard', 'DSIRE'),

('MA', 'Massachusetts', 'MassSave Battery Storage Rebate', 'MASSAVE-BATT', 'Utilities',
 'rebate', 'storage', 'per_kwh', 200, '$/kWh', 7000,
 'residential', 5, 20, false,
 true, '2021-01-01', NULL, 'available', 'https://www.masssave.com/', 'DSIRE'),

-- NEW YORK
('NY', 'New York', 'NY-Sun Megawatt Block', 'NYSUN', 'NYSERDA',
 'rebate', 'solar', 'per_kw', 200, '$/kW', 1000000,
 'commercial', 25, 5000, false,
 true, '2014-01-01', '2025-12-31', 'available', 'https://www.nyserda.ny.gov/ny-sun', 'DSIRE'),

('NY', 'New York', 'Retail Energy Storage Incentive', 'RESI', 'NYSERDA',
 'rebate', 'storage', 'per_kwh', 150, '$/kWh', 500000,
 'commercial', 50, 5000, false,
 true, '2019-01-01', '2025-12-31', 'available', 'https://www.nyserda.ny.gov/energy-storage', 'DSIRE'),

('NY', 'New York', 'Value of Distributed Energy Resources (VDER)', 'VDER', 'NYISO',
 'performance_payment', 'solar_plus_storage', 'per_kwh', 0.12, '$/kWh', NULL,
 'commercial', NULL, NULL, false,
 true, '2017-03-01', NULL, 'available', 'https://www.nyserda.ny.gov/vder', 'DSIRE'),

-- TEXAS
('TX', 'Texas', 'Property Tax Exemption for Solar/Storage', 'TX-PTE', 'Comptroller',
 'tax_credit', 'solar_plus_storage', 'percentage', 100, '%', NULL,
 'all', NULL, NULL, false,
 true, '2014-01-01', NULL, 'available', 'https://comptroller.texas.gov/', 'DSIRE'),

('TX', 'Texas', 'Austin Energy Solar Rebate', 'AE-SOLAR', 'Austin Energy',
 'rebate', 'solar_plus_storage', 'per_kw', 2500, '$/kW', 10000,
 'commercial', 10, 100, false,
 true, '2020-01-01', NULL, 'limited', 'https://austinenergy.com/', 'DSIRE'),

-- HAWAII
('HI', 'Hawaii', 'Hawaii Energy Tax Credit', 'HI-RETC', 'Dept of Taxation',
 'tax_credit', 'solar_plus_storage', 'percentage', 35, '%', 500000,
 'commercial', NULL, NULL, false,
 true, '2020-01-01', '2030-12-31', 'available', 'https://tax.hawaii.gov/', 'DSIRE'),

('HI', 'Hawaii', 'Customer Grid-Supply Plus (CGS+)', 'CGS-PLUS', 'HECO',
 'performance_payment', 'solar_plus_storage', 'per_kwh', 0.15, '$/kWh', NULL,
 'commercial', 10, 1000, true,
 true, '2017-10-01', NULL, 'available', 'https://www.hawaiianelectric.com/', 'DSIRE'),

-- NEW JERSEY
('NJ', 'New Jersey', 'NJ Clean Energy Storage Incentive', 'NJCEP-STORAGE', 'NJBPU',
 'rebate', 'storage', 'per_kwh', 150, '$/kWh', 750000,
 'commercial', 50, 2000, false,
 true, '2021-01-01', '2026-12-31', 'available', 'https://njcleanenergy.com/', 'DSIRE'),

('NJ', 'New Jersey', 'Solar Renewable Energy Certificate (SREC-II)', 'SREC-II', 'NJBPU',
 'srec', 'solar', 'per_kwh', 0.09, '$/kWh', NULL,
 'commercial', NULL, NULL, false,
 true, '2021-08-01', NULL, 'available', 'https://njcleanenergy.com/srec', 'DSIRE'),

-- CONNECTICUT
('CT', 'Connecticut', 'CT Green Bank C-PACE', 'CPACE', 'CT Green Bank',
 'loan', 'solar_plus_storage', 'percentage', 100, '%', 5000000,
 'commercial', NULL, NULL, false,
 true, '2013-01-01', NULL, 'available', 'https://www.ctgreenbank.com/', 'DSIRE'),

('CT', 'Connecticut', 'Residential Solar Incentive Program', 'RSIP', 'CT Green Bank',
 'rebate', 'solar', 'per_kw', 300, '$/kW', NULL,
 'residential', 3, 20, false,
 true, '2015-03-01', '2025-12-31', 'limited', 'https://www.ctgreenbank.com/', 'DSIRE'),

-- ARIZONA
('AZ', 'Arizona', 'APS Storage Incentive', 'APS-BATT', 'Arizona Public Service',
 'rebate', 'storage', 'per_kw', 500, '$/kW', 2500,
 'residential', 3, 10, true,
 true, '2022-01-01', NULL, 'available', 'https://www.aps.com/', 'DSIRE'),

-- COLORADO
('CO', 'Colorado', 'Xcel Energy Battery Connect', 'XCEL-BATT', 'Xcel Energy',
 'rebate', 'storage', 'per_kwh', 150, '$/kWh', 5000,
 'residential', 5, 20, false,
 true, '2020-01-01', NULL, 'available', 'https://www.xcelenergy.com/', 'DSIRE'),

('CO', 'Colorado', 'RE Tax Credit', 'CO-RETC', 'Dept of Revenue',
 'tax_credit', 'solar_plus_storage', 'percentage', 10, '%', 50000,
 'commercial', NULL, NULL, false,
 true, '2020-01-01', '2027-12-31', 'available', 'https://tax.colorado.gov/', 'DSIRE'),

-- NEVADA
('NV', 'Nevada', 'NV Energy Storage Incentive', 'NVE-BATT', 'NV Energy',
 'rebate', 'storage', 'per_kwh', 150, '$/kWh', 3000,
 'residential', 5, 15, true,
 true, '2019-01-01', NULL, 'available', 'https://www.nvenergy.com/', 'DSIRE'),

-- FLORIDA
('FL', 'Florida', 'Property Tax Exemption for Solar', 'FL-PTE', 'FL Dept of Revenue',
 'tax_credit', 'solar_plus_storage', 'percentage', 100, '%', NULL,
 'all', NULL, NULL, false,
 true, '2016-01-01', NULL, 'available', 'https://floridarevenue.com/', 'DSIRE'),

-- ILLINOIS
('IL', 'Illinois', 'Adjustable Block Program', 'IL-ABP', 'IPA',
 'srec', 'solar_plus_storage', 'per_kwh', 0.08, '$/kWh', NULL,
 'commercial', 10, 2000, false,
 true, '2019-01-01', '2030-12-31', 'available', 'https://illinoisabp.com/', 'DSIRE'),

-- MARYLAND
('MD', 'Maryland', 'MD Energy Storage Tax Credit', 'MD-ESTC', 'MEA',
 'tax_credit', 'storage', 'percentage', 30, '%', 5000,
 'residential', 5, 50, false,
 true, '2020-01-01', '2024-12-31', 'limited', 'https://energy.maryland.gov/', 'DSIRE'),

-- OREGON
('OR', 'Oregon', 'Energy Trust Solar + Storage', 'ET-SOLAR', 'Energy Trust of Oregon',
 'rebate', 'solar_plus_storage', 'per_kwh', 300, '$/kWh', 2400,
 'residential', 3, 12, true,
 true, '2019-01-01', NULL, 'available', 'https://www.energytrust.org/', 'DSIRE'),

-- VERMONT
('VT', 'Vermont', 'Bring Your Own Device (BYOD)', 'BYOD', 'Green Mountain Power',
 'performance_payment', 'storage', 'per_kw', 850, '$/kW', NULL,
 'residential', 5, 20, false,
 true, '2018-01-01', NULL, 'available', 'https://greenmountainpower.com/', 'DSIRE'),

-- MICHIGAN
('MI', 'Michigan', 'DTE SolarCurrents', 'DTE-SC', 'DTE Energy',
 'performance_payment', 'solar', 'per_kwh', 0.06, '$/kWh', NULL,
 'commercial', 20, 500, false,
 true, '2021-01-01', '2025-12-31', 'available', 'https://www.dteenergy.com/', 'DSIRE')

ON CONFLICT (state_code, program_code) DO UPDATE SET
    amount = EXCLUDED.amount,
    funding_status = EXCLUDED.funding_status,
    end_date = EXCLUDED.end_date,
    last_verified = CURRENT_DATE,
    updated_at = NOW();

-- ============================================================================
-- TABLE 2: MACRS DEPRECIATION SCHEDULES
-- ============================================================================
-- Source: IRS Publication 946
-- Update Frequency: Rarely (tax law changes)
-- External Link: https://www.irs.gov/pub/irs-pdf/p946.pdf

CREATE TABLE IF NOT EXISTS depreciation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Schedule Type
    asset_class VARCHAR(50) NOT NULL,
    recovery_years INTEGER NOT NULL,
    depreciation_method VARCHAR(20) NOT NULL, -- 'MACRS', 'Straight-Line', 'Double-Declining'
    convention VARCHAR(20) DEFAULT 'Half-Year', -- 'Half-Year', 'Mid-Quarter', 'Mid-Month'
    
    -- Annual Rates (as percentages)
    year_1 DECIMAL(6,4) NOT NULL,
    year_2 DECIMAL(6,4),
    year_3 DECIMAL(6,4),
    year_4 DECIMAL(6,4),
    year_5 DECIMAL(6,4),
    year_6 DECIMAL(6,4),
    year_7 DECIMAL(6,4),
    year_8 DECIMAL(6,4),
    year_9 DECIMAL(6,4),
    year_10 DECIMAL(6,4),
    year_11 DECIMAL(6,4),
    year_12 DECIMAL(6,4),
    year_13 DECIMAL(6,4),
    year_14 DECIMAL(6,4),
    year_15 DECIMAL(6,4),
    year_16 DECIMAL(6,4),
    year_17 DECIMAL(6,4),
    year_18 DECIMAL(6,4),
    year_19 DECIMAL(6,4),
    year_20 DECIMAL(6,4),
    year_21 DECIMAL(6,4),
    
    -- Applicable Assets
    applies_to TEXT[], -- ['battery_storage', 'solar_pv', 'ev_chargers']
    irs_asset_class VARCHAR(20),
    
    -- Bonus Depreciation
    bonus_depreciation_eligible BOOLEAN DEFAULT true,
    bonus_rate_2024 DECIMAL(5,2) DEFAULT 60,
    bonus_rate_2025 DECIMAL(5,2) DEFAULT 40,
    bonus_rate_2026 DECIMAL(5,2) DEFAULT 20,
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'IRS Pub 946',
    effective_date DATE DEFAULT '2024-01-01',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(asset_class, recovery_years, depreciation_method)
);

-- Insert Standard MACRS Schedules
INSERT INTO depreciation_schedules (
    asset_class, recovery_years, depreciation_method, convention,
    year_1, year_2, year_3, year_4, year_5, year_6, year_7,
    applies_to, irs_asset_class, bonus_depreciation_eligible
) VALUES
-- 5-Year MACRS (Solar, Battery Storage, EV Chargers)
('5-Year Property', 5, 'MACRS', 'Half-Year',
 20.00, 32.00, 19.20, 11.52, 11.52, 5.76, NULL,
 ARRAY['battery_storage', 'solar_pv', 'ev_chargers', 'fuel_cells'],
 '00.12', true),

-- 7-Year MACRS (Office equipment, some machinery)
('7-Year Property', 7, 'MACRS', 'Half-Year',
 14.29, 24.49, 17.49, 12.49, 8.93, 8.92, 8.93,
 ARRAY['office_equipment', 'agricultural_machinery', 'railroad_track'],
 '00.22', true)

ON CONFLICT (asset_class, recovery_years, depreciation_method) DO NOTHING;

-- Insert additional schedules
INSERT INTO depreciation_schedules (
    asset_class, recovery_years, depreciation_method, convention,
    year_1, year_2, year_3, year_4, year_5, year_6, year_7, year_8, year_9, year_10,
    year_11, year_12, year_13, year_14, year_15, year_16,
    applies_to, irs_asset_class, bonus_depreciation_eligible
) VALUES
-- 15-Year MACRS (Land improvements, some utility property)
('15-Year Property', 15, 'MACRS', 'Half-Year',
 5.00, 9.50, 8.55, 7.70, 6.93, 6.23, 5.90, 5.90, 5.91, 5.90,
 5.91, 5.90, 5.91, 5.90, 5.91, 2.95,
 ARRAY['land_improvements', 'utility_distribution', 'retail_improvements'],
 '00.3', true),

-- 20-Year MACRS (Farm buildings, municipal utilities)
('20-Year Property', 20, 'MACRS', 'Half-Year',
 3.750, 7.219, 6.677, 6.177, 5.713, 5.285, 4.888, 4.522, 4.462, 4.461,
 4.462, 4.461, 4.462, 4.461, 4.462, 4.461,
 ARRAY['farm_buildings', 'municipal_wastewater', 'telephone_distribution'],
 '00.4', true)

ON CONFLICT (asset_class, recovery_years, depreciation_method) DO NOTHING;

-- ============================================================================
-- TABLE 3: EV CHARGER CATALOG
-- ============================================================================
-- Source: Manufacturer websites, NREL, ChargePoint
-- Update Frequency: Quarterly (hardware prices change)
-- External Link: https://afdc.energy.gov/

CREATE TABLE IF NOT EXISTS ev_charger_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Charger Type
    charger_class VARCHAR(20) NOT NULL, -- 'Level2', 'DCFC', 'HPC'
    charger_type VARCHAR(30) NOT NULL, -- 'Level2_7kW', 'DCFC_50kW', 'HPC_350kW'
    power_kw DECIMAL(6,1) NOT NULL,
    
    -- Hardware Costs
    hardware_cost_min DECIMAL(10,2) NOT NULL,
    hardware_cost_max DECIMAL(10,2) NOT NULL,
    hardware_cost_typical DECIMAL(10,2) NOT NULL,
    
    -- Installation Costs
    install_cost_min DECIMAL(10,2) NOT NULL,
    install_cost_max DECIMAL(10,2) NOT NULL,
    install_cost_typical DECIMAL(10,2) NOT NULL,
    
    -- Make-Ready Costs (trenching, electrical upgrades)
    make_ready_cost_min DECIMAL(10,2) DEFAULT 0,
    make_ready_cost_max DECIMAL(10,2) DEFAULT 0,
    make_ready_cost_typical DECIMAL(10,2) DEFAULT 0,
    
    -- Technical Specs
    voltage INTEGER,
    amperage INTEGER,
    connector_type VARCHAR(30), -- 'J1772', 'CCS', 'CHAdeMO', 'NACS'
    simultaneous_charging BOOLEAN DEFAULT true,
    
    -- Operational
    efficiency DECIMAL(4,2) DEFAULT 0.92,
    typical_utilization DECIMAL(4,2) DEFAULT 0.15, -- 15% average
    sessions_per_day DECIMAL(4,1) DEFAULT 4,
    
    -- Revenue
    typical_rate_per_kwh DECIMAL(5,3),
    typical_session_fee DECIMAL(6,2),
    typical_session_kwh DECIMAL(5,1),
    
    -- Vendors
    example_vendors TEXT[],
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'NREL',
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(charger_type)
);

-- Insert EV Charger Data (Source: NREL 2024, ChargePoint)
INSERT INTO ev_charger_catalog (
    charger_class, charger_type, power_kw,
    hardware_cost_min, hardware_cost_max, hardware_cost_typical,
    install_cost_min, install_cost_max, install_cost_typical,
    make_ready_cost_min, make_ready_cost_max, make_ready_cost_typical,
    voltage, amperage, connector_type, simultaneous_charging,
    efficiency, typical_utilization, sessions_per_day,
    typical_rate_per_kwh, typical_session_fee, typical_session_kwh,
    example_vendors, data_source
) VALUES
-- Level 2 Chargers
('Level2', 'Level2_7kW', 7.2,
 400, 800, 600,
 1000, 2500, 1500,
 500, 2000, 1000,
 240, 30, 'J1772', true,
 0.95, 0.20, 3,
 0.25, 0, 25,
 ARRAY['ChargePoint', 'ClipperCreek', 'Grizzl-E'], 'NREL 2024'),

('Level2', 'Level2_11kW', 11,
 600, 1200, 900,
 1500, 3500, 2500,
 1000, 3000, 2000,
 240, 48, 'J1772', true,
 0.94, 0.18, 4,
 0.28, 0, 35,
 ARRAY['ChargePoint', 'ABB', 'Siemens'], 'NREL 2024'),

('Level2', 'Level2_19kW', 19.2,
 1500, 3000, 2200,
 3000, 6000, 4500,
 2000, 5000, 3500,
 240, 80, 'J1772', true,
 0.93, 0.15, 5,
 0.30, 0, 45,
 ARRAY['ChargePoint', 'Enel X', 'Blink'], 'NREL 2024'),

('Level2', 'Level2_22kW', 22,
 2000, 4000, 3000,
 4000, 8000, 6000,
 3000, 7000, 5000,
 240, 100, 'J1772', true,
 0.92, 0.15, 5,
 0.32, 0, 50,
 ARRAY['ABB', 'Siemens', 'Tritium'], 'NREL 2024'),

-- DC Fast Chargers (DCFC)
('DCFC', 'DCFC_50kW', 50,
 25000, 40000, 32000,
 15000, 35000, 25000,
 10000, 30000, 20000,
 480, 125, 'CCS', true,
 0.92, 0.12, 8,
 0.35, 0, 30,
 ARRAY['ChargePoint', 'ABB', 'Tritium', 'BTC Power'], 'NREL 2024'),

('DCFC', 'DCFC_150kW', 150,
 50000, 80000, 65000,
 30000, 60000, 45000,
 25000, 50000, 37500,
 480, 350, 'CCS', true,
 0.91, 0.15, 12,
 0.40, 0, 45,
 ARRAY['ABB', 'Tritium', 'Electrify America', 'EVgo'], 'NREL 2024'),

-- High Power Chargers (HPC)
('HPC', 'HPC_250kW', 250,
 100000, 150000, 125000,
 50000, 100000, 75000,
 50000, 100000, 75000,
 480, 600, 'CCS', true,
 0.90, 0.18, 15,
 0.45, 0, 60,
 ARRAY['Tesla Supercharger', 'ABB Terra', 'Tritium PK'], 'NREL 2024'),

('HPC', 'HPC_350kW', 350,
 150000, 200000, 175000,
 75000, 150000, 100000,
 75000, 150000, 100000,
 480, 800, 'CCS', true,
 0.89, 0.20, 18,
 0.50, 0, 70,
 ARRAY['ABB Terra HP', 'Electrify America', 'Ionity'], 'NREL 2024')

ON CONFLICT (charger_type) DO UPDATE SET
    hardware_cost_typical = EXCLUDED.hardware_cost_typical,
    install_cost_typical = EXCLUDED.install_cost_typical,
    make_ready_cost_typical = EXCLUDED.make_ready_cost_typical,
    typical_rate_per_kwh = EXCLUDED.typical_rate_per_kwh,
    updated_at = NOW();

-- ============================================================================
-- TABLE 4: EQUIPMENT VENDORS
-- ============================================================================
-- Source: Vendor websites, NREL ATB 2024, BloombergNEF
-- Update Frequency: Quarterly
-- External Link: https://atb.nrel.gov/

CREATE TABLE IF NOT EXISTS equipment_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vendor Info
    vendor_name VARCHAR(100) NOT NULL,
    vendor_type VARCHAR(30) NOT NULL, -- 'battery_cell', 'battery_system', 'inverter', 'transformer', 'bms'
    country_of_origin VARCHAR(50),
    
    -- Product Info
    product_name VARCHAR(100),
    product_model VARCHAR(50),
    
    -- Capacity
    capacity_kwh DECIMAL(10,2),
    capacity_kw DECIMAL(10,2),
    
    -- Pricing ($/kWh or $/kW depending on type)
    price_per_unit DECIMAL(10,2) NOT NULL,
    price_unit VARCHAR(10) NOT NULL, -- '$/kWh', '$/kW', '$/unit'
    min_order_quantity INTEGER DEFAULT 1,
    
    -- Technical Specs
    chemistry VARCHAR(30), -- 'LFP', 'NMC', 'NCA'
    cycle_life INTEGER,
    round_trip_efficiency DECIMAL(4,2),
    depth_of_discharge DECIMAL(4,2),
    warranty_years INTEGER,
    calendar_life_years INTEGER,
    
    -- Certifications
    ul_listed BOOLEAN DEFAULT true,
    ul_certifications TEXT[], -- ['UL1741', 'UL9540', 'UL9540A']
    
    -- Availability
    lead_time_weeks INTEGER,
    region_availability TEXT[], -- ['North America', 'Europe', 'Asia']
    
    -- Tier Classification
    tier VARCHAR(10) DEFAULT 'Tier 2', -- 'Tier 1', 'Tier 2', 'Tier 3'
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'NREL ATB',
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(vendor_name, product_model)
);

-- Insert Equipment Vendor Data
INSERT INTO equipment_vendors (
    vendor_name, vendor_type, country_of_origin,
    product_name, product_model,
    capacity_kwh, capacity_kw,
    price_per_unit, price_unit, min_order_quantity,
    chemistry, cycle_life, round_trip_efficiency, depth_of_discharge, warranty_years, calendar_life_years,
    ul_certifications, lead_time_weeks, region_availability, tier, data_source
) VALUES
-- BATTERY SYSTEMS - Tier 1
('Tesla', 'battery_system', 'USA',
 'Megapack 2XL', 'MP2XL',
 3916, 1550,
 285, '$/kWh', 1,
 'LFP', 6000, 0.93, 0.95, 15, 20,
 ARRAY['UL1741', 'UL9540', 'UL9540A'], 26, ARRAY['North America', 'Europe', 'Asia'], 'Tier 1', 'Tesla 2024'),

('BYD', 'battery_system', 'China',
 'MC Cube-T', 'MC-CUBE-T',
 2800, 1250,
 245, '$/kWh', 1,
 'LFP', 6000, 0.92, 0.90, 10, 15,
 ARRAY['UL1741', 'UL9540'], 16, ARRAY['North America', 'Europe', 'Asia'], 'Tier 1', 'BYD 2024'),

('CATL', 'battery_system', 'China',
 'EnerOne', 'ENERONE',
 3440, 1500,
 230, '$/kWh', 2,
 'LFP', 10000, 0.93, 0.95, 10, 20,
 ARRAY['UL1741', 'UL9540', 'UL9540A'], 18, ARRAY['North America', 'Europe', 'Asia'], 'Tier 1', 'CATL 2024'),

('Samsung SDI', 'battery_system', 'South Korea',
 'SBB 2.5', 'SBB25',
 2550, 1000,
 260, '$/kWh', 2,
 'NMC', 8000, 0.94, 0.90, 10, 15,
 ARRAY['UL1741', 'UL9540'], 20, ARRAY['North America', 'Europe', 'Asia'], 'Tier 1', 'Samsung 2024'),

('LG Energy Solution', 'battery_system', 'South Korea',
 'ESS Container', 'ESS-CON',
 2900, 1200,
 255, '$/kWh', 2,
 'NMC', 7000, 0.94, 0.92, 10, 15,
 ARRAY['UL1741', 'UL9540', 'UL9540A'], 22, ARRAY['North America', 'Europe', 'Asia'], 'Tier 1', 'LGES 2024'),

-- BATTERY SYSTEMS - Tier 2
('Sungrow', 'battery_system', 'China',
 'PowerTitan', 'ST2752UX',
 2752, 1250,
 220, '$/kWh', 2,
 'LFP', 6000, 0.91, 0.90, 10, 15,
 ARRAY['UL1741', 'UL9540'], 14, ARRAY['North America', 'Europe', 'Asia'], 'Tier 2', 'Sungrow 2024'),

('Fluence', 'battery_system', 'USA',
 'Gridstack Pro', 'GSP-1',
 3200, 1400,
 270, '$/kWh', 1,
 'LFP', 5000, 0.92, 0.95, 15, 20,
 ARRAY['UL1741', 'UL9540', 'UL9540A'], 20, ARRAY['North America', 'Europe'], 'Tier 1', 'Fluence 2024'),

('Powin', 'battery_system', 'USA',
 'Centipede', 'CENT-2MW',
 4136, 2070,
 240, '$/kWh', 1,
 'LFP', 6000, 0.92, 0.90, 10, 15,
 ARRAY['UL1741', 'UL9540'], 16, ARRAY['North America'], 'Tier 2', 'Powin 2024'),

-- INVERTERS
('SMA', 'inverter', 'Germany',
 'Sunny Central Storage', 'SCS-3000',
 NULL, 3000,
 35, '$/kW', 1,
 NULL, NULL, 0.985, NULL, 10, 25,
 ARRAY['UL1741SA', 'IEEE1547'], 12, ARRAY['North America', 'Europe'], 'Tier 1', 'SMA 2024'),

('Sungrow', 'inverter', 'China',
 'SC3450UD-MV', 'SC3450',
 NULL, 3450,
 28, '$/kW', 2,
 NULL, NULL, 0.987, NULL, 10, 20,
 ARRAY['UL1741SA', 'IEEE1547'], 10, ARRAY['North America', 'Europe', 'Asia'], 'Tier 2', 'Sungrow 2024'),

('Power Electronics', 'inverter', 'Spain',
 'HEMK', 'HEMK-3600',
 NULL, 3600,
 32, '$/kW', 1,
 NULL, NULL, 0.986, NULL, 10, 25,
 ARRAY['UL1741SA', 'IEEE1547'], 14, ARRAY['North America', 'Europe'], 'Tier 1', 'PE 2024'),

-- TRANSFORMERS
('ABB', 'transformer', 'Switzerland',
 'Medium Voltage Transformer', 'MVT-5MVA',
 NULL, 5000,
 18, '$/kVA', 1,
 NULL, NULL, 0.995, NULL, 25, 40,
 ARRAY['IEEE C57'], 16, ARRAY['North America', 'Europe', 'Asia'], 'Tier 1', 'ABB 2024'),

('Siemens', 'transformer', 'Germany',
 'GEAFOL Cast-Resin', 'GEAFOL-3MVA',
 NULL, 3000,
 22, '$/kVA', 1,
 NULL, NULL, 0.994, NULL, 25, 40,
 ARRAY['IEEE C57'], 14, ARRAY['North America', 'Europe'], 'Tier 1', 'Siemens 2024')

ON CONFLICT (vendor_name, product_model) DO UPDATE SET
    price_per_unit = EXCLUDED.price_per_unit,
    lead_time_weeks = EXCLUDED.lead_time_weeks,
    updated_at = NOW();

-- ============================================================================
-- TABLE 5: ISO MARKET PRICES (Ancillary Services)
-- ============================================================================
-- Source: ISO websites, EIA, S&P Global
-- Update Frequency: Monthly (prices fluctuate)
-- External Link: https://www.eia.gov/electricity/wholesale/

CREATE TABLE IF NOT EXISTS iso_market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ISO Region
    iso_region VARCHAR(20) NOT NULL, -- 'CAISO', 'ERCOT', 'PJM', 'NYISO', 'ISO-NE', 'MISO', 'SPP'
    iso_name VARCHAR(100) NOT NULL,
    
    -- Service Type
    service_type VARCHAR(50) NOT NULL, -- 'frequency_regulation', 'spinning_reserve', 'capacity', 'energy_arbitrage'
    
    -- Pricing
    price_per_mw_year DECIMAL(12,2),
    price_per_mwh DECIMAL(8,2),
    price_unit VARCHAR(20) NOT NULL, -- '$/MW-year', '$/MWh'
    
    -- Price Range
    price_low DECIMAL(12,2),
    price_high DECIMAL(12,2),
    price_average DECIMAL(12,2),
    
    -- Market Details
    market_type VARCHAR(20), -- 'day_ahead', 'real_time', 'capacity'
    settlement_period VARCHAR(20), -- 'hourly', 'daily', 'monthly', 'annual'
    
    -- BESS Eligibility
    bess_eligible BOOLEAN DEFAULT true,
    min_duration_hours DECIMAL(4,1),
    min_capacity_mw DECIMAL(6,1),
    
    -- Trends
    yoy_change_percent DECIMAL(5,2),
    trend VARCHAR(20), -- 'increasing', 'stable', 'decreasing'
    
    -- Metadata
    data_source VARCHAR(50),
    data_period VARCHAR(20), -- '2024-Q3', '2024-Annual'
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(iso_region, service_type, market_type)
);

-- Insert ISO Market Price Data
INSERT INTO iso_market_prices (
    iso_region, iso_name, service_type,
    price_per_mw_year, price_per_mwh, price_unit,
    price_low, price_high, price_average,
    market_type, settlement_period,
    bess_eligible, min_duration_hours, min_capacity_mw,
    yoy_change_percent, trend, data_source, data_period
) VALUES
-- CAISO
('CAISO', 'California ISO', 'frequency_regulation',
 60000, NULL, '$/MW-year',
 45000, 85000, 60000,
 'real_time', 'hourly',
 true, 0.25, 0.5,
 15, 'increasing', 'CAISO OASIS', '2024-Q3'),

('CAISO', 'California ISO', 'spinning_reserve',
 15000, NULL, '$/MW-year',
 10000, 25000, 15000,
 'real_time', 'hourly',
 true, 0.5, 1,
 5, 'stable', 'CAISO OASIS', '2024-Q3'),

('CAISO', 'California ISO', 'energy_arbitrage',
 NULL, 45, '$/MWh',
 20, 150, 45,
 'day_ahead', 'hourly',
 true, 2, 1,
 25, 'increasing', 'CAISO OASIS', '2024-Q3'),

('CAISO', 'California ISO', 'resource_adequacy',
 80000, NULL, '$/MW-year',
 60000, 120000, 80000,
 'capacity', 'monthly',
 true, 4, 1,
 20, 'increasing', 'CPUC', '2024-Annual'),

-- ERCOT
('ERCOT', 'Electric Reliability Council of Texas', 'frequency_regulation',
 35000, NULL, '$/MW-year',
 25000, 55000, 35000,
 'real_time', 'hourly',
 true, 0.25, 0.5,
 -10, 'decreasing', 'ERCOT', '2024-Q3'),

('ERCOT', 'Electric Reliability Council of Texas', 'spinning_reserve',
 12000, NULL, '$/MW-year',
 8000, 20000, 12000,
 'real_time', 'hourly',
 true, 0.5, 1,
 0, 'stable', 'ERCOT', '2024-Q3'),

('ERCOT', 'Electric Reliability Council of Texas', 'energy_arbitrage',
 NULL, 65, '$/MWh',
 15, 500, 65,
 'real_time', 'hourly',
 true, 2, 1,
 40, 'increasing', 'ERCOT', '2024-Q3'),

-- PJM
('PJM', 'PJM Interconnection', 'frequency_regulation',
 55000, NULL, '$/MW-year',
 40000, 80000, 55000,
 'real_time', 'hourly',
 true, 0.25, 0.5,
 8, 'stable', 'PJM', '2024-Q3'),

('PJM', 'PJM Interconnection', 'capacity',
 100000, NULL, '$/MW-year',
 50000, 150000, 100000,
 'capacity', 'annual',
 true, 4, 1,
 10, 'increasing', 'PJM', '2024-Annual'),

('PJM', 'PJM Interconnection', 'energy_arbitrage',
 NULL, 35, '$/MWh',
 15, 100, 35,
 'day_ahead', 'hourly',
 true, 2, 1,
 5, 'stable', 'PJM', '2024-Q3'),

-- NYISO
('NYISO', 'New York ISO', 'frequency_regulation',
 70000, NULL, '$/MW-year',
 50000, 100000, 70000,
 'real_time', 'hourly',
 true, 0.25, 0.5,
 12, 'increasing', 'NYISO', '2024-Q3'),

('NYISO', 'New York ISO', 'capacity',
 120000, NULL, '$/MW-year',
 80000, 180000, 120000,
 'capacity', 'monthly',
 true, 4, 1,
 15, 'increasing', 'NYISO', '2024-Q3'),

-- ISO-NE
('ISO-NE', 'ISO New England', 'frequency_regulation',
 45000, NULL, '$/MW-year',
 35000, 65000, 45000,
 'real_time', 'hourly',
 true, 0.25, 0.5,
 5, 'stable', 'ISO-NE', '2024-Q3'),

('ISO-NE', 'ISO New England', 'capacity',
 90000, NULL, '$/MW-year',
 60000, 130000, 90000,
 'capacity', 'annual',
 true, 4, 1,
 8, 'stable', 'ISO-NE', '2024-Annual'),

-- MISO
('MISO', 'Midcontinent ISO', 'frequency_regulation',
 25000, NULL, '$/MW-year',
 18000, 40000, 25000,
 'real_time', 'hourly',
 true, 0.25, 0.5,
 -5, 'decreasing', 'MISO', '2024-Q3'),

('MISO', 'Midcontinent ISO', 'energy_arbitrage',
 NULL, 30, '$/MWh',
 10, 80, 30,
 'day_ahead', 'hourly',
 true, 2, 1,
 10, 'stable', 'MISO', '2024-Q3')

ON CONFLICT (iso_region, service_type, market_type) DO UPDATE SET
    price_per_mw_year = EXCLUDED.price_per_mw_year,
    price_per_mwh = EXCLUDED.price_per_mwh,
    price_average = EXCLUDED.price_average,
    yoy_change_percent = EXCLUDED.yoy_change_percent,
    trend = EXCLUDED.trend,
    last_updated = CURRENT_DATE,
    updated_at = NOW();

-- ============================================================================
-- TABLE 6: DATA UPDATE SCHEDULE
-- ============================================================================
-- Track when each table should be updated and data sources

CREATE TABLE IF NOT EXISTS data_update_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    table_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    
    -- Update Frequency
    update_frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'annually'
    last_updated TIMESTAMPTZ,
    next_update_due DATE,
    
    -- Data Sources
    primary_source VARCHAR(200),
    primary_source_url VARCHAR(500),
    secondary_sources TEXT[],
    
    -- Automation
    auto_update_enabled BOOLEAN DEFAULT false,
    api_endpoint VARCHAR(500),
    
    -- Responsibility
    owner VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO data_update_schedule (
    table_name, description, update_frequency,
    last_updated, next_update_due,
    primary_source, primary_source_url, secondary_sources,
    auto_update_enabled, owner
) VALUES
('utility_rates', 'State electricity rates and utility-specific TOU rates', 'annually',
 NOW(), '2025-06-01',
 'EIA State Electricity Profiles', 'https://www.eia.gov/electricity/state/',
 ARRAY['Utility rate schedules', 'OpenEI utility rate database'],
 false, 'Data Team'),

('state_incentives', 'State and utility incentive programs for storage/solar', 'quarterly',
 NOW(), '2025-03-01',
 'DSIRE Database', 'https://www.dsireusa.org/',
 ARRAY['State energy office websites', 'Utility program pages'],
 false, 'Data Team'),

('depreciation_schedules', 'IRS MACRS depreciation schedules', 'annually',
 NOW(), '2026-01-01',
 'IRS Publication 946', 'https://www.irs.gov/pub/irs-pdf/p946.pdf',
 ARRAY['Tax law updates'],
 false, 'Finance Team'),

('ev_charger_catalog', 'EV charger hardware and installation costs', 'quarterly',
 NOW(), '2025-03-01',
 'NREL AFDC', 'https://afdc.energy.gov/',
 ARRAY['ChargePoint', 'ABB', 'Tritium pricing'],
 false, 'Product Team'),

('equipment_vendors', 'Battery storage system vendor pricing and specs', 'quarterly',
 NOW(), '2025-03-01',
 'NREL ATB', 'https://atb.nrel.gov/',
 ARRAY['BloombergNEF', 'Wood Mackenzie', 'Vendor websites'],
 false, 'Product Team'),

('iso_market_prices', 'Wholesale electricity and ancillary service prices by ISO', 'monthly',
 NOW(), '2025-01-01',
 'ISO/RTO websites', 'https://www.caiso.com/market/',
 ARRAY['EIA wholesale markets', 'S&P Global Platts'],
 false, 'Data Team'),

('calculation_constants', 'Financial calculation parameters (ITC, discount rate, etc.)', 'annually',
 NOW(), '2026-01-01',
 'IRS/DOE guidelines', 'https://www.energy.gov/eere/solar/federal-tax-credits-solar-manufacturers',
 ARRAY['CBO economic projections'],
 false, 'Finance Team')

ON CONFLICT (table_name) DO UPDATE SET
    last_updated = NOW(),
    updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count records in each new table
SELECT 'state_incentives' as table_name, COUNT(*) as records FROM state_incentives
UNION ALL
SELECT 'depreciation_schedules', COUNT(*) FROM depreciation_schedules
UNION ALL
SELECT 'ev_charger_catalog', COUNT(*) FROM ev_charger_catalog
UNION ALL
SELECT 'equipment_vendors', COUNT(*) FROM equipment_vendors
UNION ALL
SELECT 'iso_market_prices', COUNT(*) FROM iso_market_prices
UNION ALL
SELECT 'data_update_schedule', COUNT(*) FROM data_update_schedule;

-- Show incentives by state
SELECT state_code, COUNT(*) as program_count, 
       STRING_AGG(program_code, ', ') as programs
FROM state_incentives 
WHERE is_active = true
GROUP BY state_code 
ORDER BY program_count DESC;

-- Show EV charger pricing summary
SELECT charger_class, charger_type, power_kw,
       hardware_cost_typical + install_cost_typical + make_ready_cost_typical as total_typical_cost
FROM ev_charger_catalog
ORDER BY power_kw;

-- Show equipment vendor summary
SELECT vendor_type, COUNT(*) as vendors, 
       AVG(price_per_unit) as avg_price
FROM equipment_vendors
GROUP BY vendor_type;
