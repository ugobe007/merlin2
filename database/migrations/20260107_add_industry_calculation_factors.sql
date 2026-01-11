-- ============================================================================
-- INDUSTRY CALCULATION FACTORS MIGRATION
-- ============================================================================
-- Created: January 7, 2025
-- Purpose: Populate calculation_constants table with industry-specific factors
--          for SSOT-compliant calculations across all industries
-- 
-- This migration adds factors for:
-- - Hotels (kW per room, amenity multipliers)
-- - Data Centers (kW per sqft, PUE by tier)
-- - Hospitals (kW per bed, department multipliers)
-- - EV Charging (kW per charger type)
-- - Truck Stops (equipment factors)
-- - Manufacturing, Retail, Warehouse, Office, Car Wash, Airport, College
--
-- All factors are idempotent (can be run multiple times safely)
-- ============================================================================

-- ============================================================================
-- HOTEL FACTORS
-- ============================================================================
-- Note: hotel_peak_demand_per_room_kw already exists (from 20251130_add_ev_hotel_industries.sql)
-- This adds hotel_kw_per_room as alias for consistency, or updates existing if needed

-- Update existing hotel_peak_demand_per_room_kw with better description
UPDATE calculation_constants 
SET 
  description = 'Peak kW per hotel room (average across all hotel types)',
  source = 'CBECS 2018, ASHRAE 90.1, Marriott Energy Benchmarks',
  updated_at = NOW()
WHERE key = 'hotel_peak_demand_per_room_kw';

-- Add hotel_kw_per_room as alias (if it doesn't exist)
INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source)
SELECT 'hotel_kw_per_room', 'sizing', value_numeric, value_type, 
       'Peak kW per hotel room (alias for hotel_peak_demand_per_room_kw)', source
FROM calculation_constants 
WHERE key = 'hotel_peak_demand_per_room_kw'
ON CONFLICT (key) DO NOTHING;

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('hotel_load_factor', 'sizing', 0.45, 'number', 'Hotel load factor (average vs peak demand)', 'CBECS 2018')
ON CONFLICT (key) DO UPDATE SET
  value_numeric = EXCLUDED.value_numeric,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('hotel_restaurant_multiplier', 'sizing', 0.15, 'number', 'Additional load multiplier for hotel restaurants (15% of base)', 'ASHRAE HVAC Applications Handbook')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('hotel_pool_multiplier', 'sizing', 0.08, 'number', 'Additional load multiplier for hotel pools (8% of base)', 'ASHRAE HVAC Applications Handbook')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('hotel_spa_multiplier', 'sizing', 0.05, 'number', 'Additional load multiplier for hotel spas (5% of base)', 'ASHRAE HVAC Applications Handbook')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('hotel_conference_multiplier', 'sizing', 0.10, 'number', 'Additional load multiplier for hotel conference rooms (10% of base)', 'ASHRAE HVAC Applications Handbook')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- DATA CENTER FACTORS
-- ============================================================================

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('datacenter_kw_per_sqft', 'sizing', 150, 'number', 'Peak kW per sqft for data centers (IT + cooling)', 'Uptime Institute, ASHRAE TC 9.9')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('datacenter_load_factor', 'sizing', 0.85, 'number', 'Data center load factor (high utilization)', 'Uptime Institute')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('datacenter_pue_tier1', 'sizing', 1.67, 'number', 'Power Usage Effectiveness (PUE) for Tier I data centers', 'Uptime Institute Tier Classification')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('datacenter_pue_tier2', 'sizing', 1.75, 'number', 'Power Usage Effectiveness (PUE) for Tier II data centers', 'Uptime Institute Tier Classification')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('datacenter_pue_tier3', 'sizing', 1.98, 'number', 'Power Usage Effectiveness (PUE) for Tier III data centers', 'Uptime Institute Tier Classification')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('datacenter_pue_tier4', 'sizing', 2.50, 'number', 'Power Usage Effectiveness (PUE) for Tier IV data centers', 'Uptime Institute Tier Classification')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- HOSPITAL FACTORS
-- ============================================================================

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('hospital_kw_per_bed', 'sizing', 8.0, 'number', 'Peak kW per hospital bed (average across facility types)', 'ASHRAE Healthcare Facilities, NFPA 99')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('hospital_load_factor', 'sizing', 0.65, 'number', 'Hospital load factor (high utilization for 24/7 operations)', 'ASHRAE Healthcare Facilities')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('hospital_icu_multiplier', 'sizing', 0.15, 'number', 'Additional load multiplier for ICU departments (15% of base)', 'ASHRAE Healthcare Facilities')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('hospital_or_multiplier', 'sizing', 0.10, 'number', 'Additional load multiplier for operating rooms (10% of base)', 'ASHRAE Healthcare Facilities')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('hospital_imaging_multiplier', 'sizing', 0.05, 'number', 'Additional load multiplier for imaging equipment (5% of base)', 'ASHRAE Healthcare Facilities')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- EV CHARGING FACTORS
-- ============================================================================
-- Note: EV charger power ratings already exist (from 20251130_add_ev_hotel_industries.sql)
-- Keys: ev_charger_level2_kw, ev_charger_dcfc_50_kw, ev_charger_dcfc_150_kw, 
--       ev_charger_hpc_250_kw, ev_charger_hpc_350_kw (in 'ev_charging' category)
-- This migration adds sizing category factors and load factor

-- Update existing EV charger constants with better descriptions if needed
UPDATE calculation_constants 
SET 
  description = CASE 
    WHEN key = 'ev_charger_level2_kw' THEN 'Level 2 AC charger power (kW per port) - Commercial standard'
    WHEN key = 'ev_charger_dcfc_50_kw' THEN '50kW DC Fast Charger power (kW per port)'
    WHEN key = 'ev_charger_dcfc_150_kw' THEN '150kW DC Fast Charger power (kW per port)'
    WHEN key = 'ev_charger_hpc_250_kw' THEN '250kW High Power Charger (kW per port)'
    WHEN key = 'ev_charger_hpc_350_kw' THEN '350kW High Power Charger (kW per port)'
    ELSE description
  END,
  updated_at = NOW()
WHERE key IN ('ev_charger_level2_kw', 'ev_charger_dcfc_50_kw', 'ev_charger_dcfc_150_kw', 
              'ev_charger_hpc_250_kw', 'ev_charger_hpc_350_kw');

-- Add aliases in sizing category for consistency
INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source)
SELECT 
  CASE key
    WHEN 'ev_charger_level2_kw' THEN 'ev_level2_kw'
    WHEN 'ev_charger_dcfc_50_kw' THEN 'ev_dcfc50_kw'
    WHEN 'ev_charger_dcfc_150_kw' THEN 'ev_dcfc150_kw'
    WHEN 'ev_charger_hpc_250_kw' THEN 'ev_hpc250_kw'
    WHEN 'ev_charger_hpc_350_kw' THEN 'ev_dcfc350_kw'
  END as key,
  'sizing' as category,
  value_numeric,
  value_type,
  description || ' (alias from ev_charging category)' as description,
  source
FROM calculation_constants
WHERE key IN ('ev_charger_level2_kw', 'ev_charger_dcfc_50_kw', 'ev_charger_dcfc_150_kw', 
              'ev_charger_hpc_250_kw', 'ev_charger_hpc_350_kw')
ON CONFLICT (key) DO NOTHING;

-- Add load factor (if not exists)
INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('ev_charging_load_factor', 'sizing', 0.25, 'number', 'EV charging load factor (accounts for utilization and diversity)', 'SAE J1772, CHAdeMO, CCS Standards')
ON CONFLICT (key) DO UPDATE SET 
  value_numeric = EXCLUDED.value_numeric,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Add megawatt charger (may not exist yet)
INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('ev_megawatt_kw', 'sizing', 1000, 'number', 'Power rating for megawatt chargers (kW per port)', 'MCS Standard')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- TRUCK STOP FACTORS
-- ============================================================================

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('truck_stop_load_factor', 'sizing', 0.65, 'number', 'Truck stop load factor (accounts for equipment diversity)', 'NACS Travel Center Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('truck_stop_mcs_kw', 'sizing', 1000, 'number', 'Power rating for Megawatt Charging System (MCS) chargers (kW per port)', 'MCS Standard')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('truck_stop_dcfc350_kw', 'sizing', 350, 'number', 'Power rating for 350kW DCFC chargers at truck stops (kW per port)', 'CCS Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('truck_stop_level2_kw', 'sizing', 19.2, 'number', 'Power rating for Level 2 chargers at truck stops (kW per port)', 'SAE J1772')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('truck_stop_service_bay_kw', 'sizing', 50, 'number', 'Peak power per service bay (Speedco maintenance)', 'NACS Travel Center Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('truck_stop_wash_bay_kw', 'sizing', 100, 'number', 'Peak power per truck wash bay (high-pressure pumps, blow-dryers)', 'NACS Travel Center Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('truck_stop_restaurant_kw_per_seat', 'sizing', 0.5, 'number', 'Peak power per restaurant seat (QSR equipment)', 'NACS Travel Center Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- MANUFACTURING FACTORS
-- ============================================================================

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('manufacturing_kw_per_sqft', 'sizing', 30, 'number', 'Peak kW per sqft for manufacturing (varies by process type)', 'DOE Manufacturing Energy Consumption Survey')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('manufacturing_load_factor', 'sizing', 0.55, 'number', 'Manufacturing load factor (equipment cycling)', 'DOE Manufacturing Energy Consumption Survey')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- RETAIL FACTORS
-- ============================================================================

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('retail_kw_per_sqft', 'sizing', 15, 'number', 'Peak kW per sqft for retail (lighting intensive)', 'CBECS 2018, Energy Star Portfolio Manager')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('retail_load_factor', 'sizing', 0.40, 'number', 'Retail load factor (customer traffic patterns)', 'CBECS 2018')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- WAREHOUSE FACTORS
-- ============================================================================

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('warehouse_kw_per_sqft', 'sizing', 8, 'number', 'Peak kW per sqft for warehouses (forklifts, lighting, HVAC)', 'CBECS 2018, ASHRAE 90.1')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('warehouse_load_factor', 'sizing', 0.50, 'number', 'Warehouse load factor (material handling equipment)', 'CBECS 2018')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- OFFICE FACTORS
-- ============================================================================

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('office_kw_per_sqft', 'sizing', 12, 'number', 'Peak kW per sqft for offices (lighting, HVAC, computers)', 'CBECS 2018, ASHRAE 90.1')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('office_load_factor', 'sizing', 0.35, 'number', 'Office load factor (occupancy patterns)', 'CBECS 2018')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- CAR WASH FACTORS
-- ============================================================================

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('car_wash_load_factor', 'sizing', 0.35, 'number', 'Car wash load factor (equipment diversity)', 'Car Wash Industry Equipment Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('car_wash_conveyor_motor_kw', 'sizing', 7.5, 'number', 'Power rating for car wash conveyor motor (kW)', 'Car Wash Industry Equipment Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('car_wash_high_pressure_pump_kw', 'sizing', 15, 'number', 'Power rating for high-pressure water pump (kW)', 'Car Wash Industry Equipment Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('car_wash_blower_motor_kw', 'sizing', 15, 'number', 'Power rating per blower motor (kW)', 'Car Wash Industry Equipment Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('car_wash_electric_water_heater_kw', 'sizing', 36, 'number', 'Power rating for electric water heater (kW per unit)', 'Car Wash Industry Equipment Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('car_wash_vacuum_station_kw', 'sizing', 3, 'number', 'Power rating per vacuum station (kW)', 'Car Wash Industry Equipment Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- AIRPORT FACTORS
-- ============================================================================

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('airport_load_factor', 'sizing', 0.70, 'number', 'Airport load factor (flight operations patterns)', 'FAA Airport Design Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('airport_small_regional_mw', 'sizing', 2.0, 'number', 'Typical peak demand for small regional airports (<1M passengers/year) in MW', 'FAA Airport Design Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('airport_medium_regional_mw', 'sizing', 6.0, 'number', 'Typical peak demand for medium regional airports (1-5M passengers/year) in MW', 'FAA Airport Design Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('airport_large_regional_mw', 'sizing', 18.0, 'number', 'Typical peak demand for large regional airports (5-15M passengers/year) in MW', 'FAA Airport Design Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('airport_major_hub_mw', 'sizing', 55.0, 'number', 'Typical peak demand for major hub airports (15-50M passengers/year) in MW', 'FAA Airport Design Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('airport_mega_hub_mw', 'sizing', 175.0, 'number', 'Typical peak demand for mega hub airports (50-100M+ passengers/year) in MW', 'FAA Airport Design Standards')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- COLLEGE/UNIVERSITY FACTORS
-- ============================================================================

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('college_kw_per_sqft', 'sizing', 18, 'number', 'Peak kW per sqft for colleges/universities', 'CBECS 2018, ASHRAE 90.1')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('college_load_factor', 'sizing', 0.40, 'number', 'College load factor (academic calendar patterns)', 'CBECS 2018')
ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify all constants were inserted/updated
SELECT 
  category,
  COUNT(*) as factor_count,
  STRING_AGG(key, ', ' ORDER BY key) as keys
FROM calculation_constants
WHERE category IN ('sizing', 'ev_charging', 'hotel')
  AND (
    key LIKE '%_kw_per_%' 
    OR key LIKE '%_load_factor'
    OR key LIKE '%_multiplier'
    OR key LIKE '%_pue_%'
    OR key LIKE '%_kw'
    OR key LIKE '%_mw'
    OR key LIKE 'hotel_%'
    OR key LIKE 'ev_charger_%'
    OR key LIKE 'ev_%'
  )
GROUP BY category
ORDER BY category;
