-- =============================================================================
-- ADD COMPREHENSIVE PRICING CONFIGURATIONS
-- =============================================================================
-- Run this to add all equipment pricing to the database
-- Includes: Solar, Wind, Generators, EV Chargers, Power Electronics, Fire Suppression
-- =============================================================================

-- Solar PV Pricing Configuration
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, version, is_active, data_source, confidence_level, vendor_notes)
VALUES (
  'solar_default',
  'solar',
  '{
    "utility_scale_per_watt": 0.65,
    "commercial_per_watt": 0.85,
    "small_scale_per_watt": 1.10,
    "tracking_upcharge": 0.08,
    "fixed_tilt_per_watt": 0.65,
    "single_axis_tracking_per_watt": 0.73,
    "dual_axis_tracking_per_watt": 0.90,
    "panel_efficiency_percent": 21.5,
    "inverter_efficiency_percent": 98.5,
    "degradation_rate_annual": 0.005
  }',
  'Solar PV pricing by scale with tracking options (Q4 2025)',
  '1.0.0',
  true,
  'NREL ATB 2024, First Solar, Canadian Solar, LONGi quotes',
  'high',
  'Utility scale >5MW at $0.65/W, Commercial 1-5MW at $0.85/W, Small <1MW at $1.10/W'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- Wind Turbine Pricing Configuration
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, version, is_active, data_source, confidence_level, vendor_notes)
VALUES (
  'wind_default',
  'wind',
  '{
    "utility_scale_per_kw": 1350,
    "distributed_per_kw": 2500,
    "offshore_per_kw": 4200,
    "onshore_utility_per_kw": 1350,
    "small_wind_per_kw": 3000,
    "turbine_2mw_cost": 2700000,
    "turbine_3mw_cost": 3900000,
    "turbine_5mw_cost": 6250000,
    "capacity_factor_onshore": 0.35,
    "capacity_factor_offshore": 0.45,
    "om_cost_per_kw_year": 45
  }',
  'Wind turbine pricing by scale and type (Q4 2025)',
  '1.0.0',
  true,
  'NREL ATB 2024, Vestas, GE Renewable Energy, Siemens Gamesa',
  'high',
  'Onshore utility $1,350/kW, Offshore $4,200/kW, includes tower and installation'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- Generator Pricing Configuration
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, version, is_active, data_source, confidence_level, vendor_notes)
VALUES (
  'generator_default',
  'generator',
  '{
    "diesel_per_kw": 800,
    "natural_gas_per_kw": 700,
    "dual_fuel_per_kw": 900,
    "propane_per_kw": 750,
    "diesel_500kw_cost": 400000,
    "diesel_1mw_cost": 800000,
    "diesel_2mw_cost": 1600000,
    "ng_1mw_cost": 700000,
    "fuel_consumption_l_per_kwh": 0.25,
    "maintenance_cost_per_hour": 15,
    "lifespan_hours": 30000
  }',
  'Generator pricing by fuel type and size (Q4 2025)',
  '1.0.0',
  true,
  'Caterpillar, Cummins, Eaton, Kohler quotes',
  'high',
  'Diesel $800/kW, Natural Gas $700/kW, Dual Fuel $900/kW. Includes generator, enclosure, ATS'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- EV Charging Station Pricing Configuration
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, version, is_active, data_source, confidence_level, vendor_notes)
VALUES (
  'ev_charging_default',
  'ev_charging',
  '{
    "level2_ac_7kw_cost": 6000,
    "level2_ac_11kw_cost": 8000,
    "level2_ac_22kw_cost": 12000,
    "dc_fast_50kw_cost": 40000,
    "dc_fast_150kw_cost": 80000,
    "dc_fast_350kw_cost": 150000,
    "dc_ultra_fast_350kw_cost": 150000,
    "networking_cost_per_unit": 500,
    "ocpp_compliance_cost": 500,
    "installation_cost_level2": 3000,
    "installation_cost_dcfast": 25000,
    "annual_maintenance_level2": 500,
    "annual_maintenance_dcfast": 3000
  }',
  'EV charging equipment costs (AC Level 2 and DC Fast) Q4 2025',
  '1.0.0',
  true,
  'ChargePoint, EVgo, Electrify America, ABB, Delta Electronics',
  'high',
  'Level 2: $6-12K, DC Fast 50kW: $40K, 150kW: $80K, 350kW: $150K. Includes networking and OCPP compliance'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- Power Conversion Systems (PCS) - Enhanced Configuration
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, version, is_active, data_source, confidence_level, vendor_notes)
VALUES (
  'power_conversion_systems',
  'power_electronics',
  '{
    "inverter_per_kw": 120,
    "bidirectional_inverter_per_kw": 150,
    "grid_forming_inverter_per_kw": 180,
    "hybrid_inverter_per_kw": 200,
    "string_inverter_residential_per_kw": 200,
    "central_inverter_utility_per_kw": 100,
    "microinverter_per_unit": 250,
    "efficiency_percent": 98.5,
    "warranty_years": 10,
    "lifespan_years": 20
  }',
  'Power conversion system pricing by type and scale (Q4 2025)',
  '1.0.0',
  true,
  'SMA Solar, SolarEdge, Enphase, ABB, Schneider Electric',
  'high',
  'Standard inverter $120/kW, Bi-directional $150/kW, Grid-forming $180/kW, Hybrid $200/kW'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- Transformers Pricing Configuration
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, version, is_active, data_source, confidence_level, vendor_notes)
VALUES (
  'transformers_default',
  'transformers',
  '{
    "transformer_per_kva": 80,
    "padmount_500kva_cost": 40000,
    "padmount_1000kva_cost": 75000,
    "padmount_2500kva_cost": 180000,
    "medium_voltage_per_kva": 85,
    "high_voltage_per_kva": 120,
    "oil_filled_per_kva": 80,
    "dry_type_per_kva": 95,
    "efficiency_percent": 99.0,
    "lifespan_years": 30
  }',
  'Transformer pricing by capacity and type (Q4 2025)',
  '1.0.0',
  true,
  'ABB, Siemens, Schneider Electric, GE Grid Solutions',
  'high',
  'Standard $80/kVA, Medium voltage $85/kVA, High voltage $120/kVA. Oil-filled vs dry-type options'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- Switchgear & Protection Systems Configuration
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, version, is_active, data_source, confidence_level, vendor_notes)
VALUES (
  'switchgear_protection',
  'switchgear',
  '{
    "switchgear_per_kw": 50,
    "circuit_breaker_per_unit": 15000,
    "disconnect_switch_per_unit": 8000,
    "protection_relay_per_unit": 5000,
    "medium_voltage_switchgear_per_kw": 60,
    "low_voltage_switchgear_per_kw": 40,
    "arc_flash_protection_per_unit": 3000,
    "ground_fault_protection_per_unit": 2500,
    "metering_package_cost": 25000,
    "scada_integration_cost": 50000
  }',
  'Switchgear and protection system pricing (Q4 2025)',
  '1.0.0',
  true,
  'ABB, Siemens, Schneider Electric, Eaton',
  'high',
  'Switchgear $50/kW, Circuit breakers $15K each, Protection relays $5K. Includes arc flash and ground fault protection'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- Microcontrollers & Control Systems Configuration
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, version, is_active, data_source, confidence_level, vendor_notes)
VALUES (
  'control_systems',
  'controls',
  '{
    "ems_system_base_cost": 150000,
    "ems_per_mw_cost": 25000,
    "scada_system_cost": 75000,
    "plc_controller_per_unit": 8000,
    "hmi_interface_cost": 15000,
    "rtac_controller_cost": 12000,
    "communication_gateway_cost": 5000,
    "cybersecurity_package_cost": 50000,
    "remote_monitoring_annual": 12000,
    "software_licenses_annual": 8000
  }',
  'Energy management and control system pricing (Q4 2025)',
  '1.0.0',
  true,
  'Schneider Electric, Siemens, ABB, Honeywell, GE Digital',
  'high',
  'EMS base $150K + $25K/MW, SCADA $75K, PLCs $8K each, includes cybersecurity and remote monitoring'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- Fire Suppression Systems Configuration
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, version, is_active, data_source, confidence_level, vendor_notes)
VALUES (
  'fire_suppression',
  'safety',
  '{
    "fire_suppression_per_container": 75000,
    "fire_suppression_per_mwh": 15000,
    "novec_1230_system_cost": 85000,
    "water_mist_system_cost": 65000,
    "aerosol_system_cost": 55000,
    "detection_system_per_container": 25000,
    "thermal_monitoring_per_mwh": 5000,
    "smoke_detection_per_container": 15000,
    "fm200_system_cost": 70000,
    "inspection_annual_cost": 5000,
    "refill_cost_per_event": 15000
  }',
  'Fire suppression and detection system pricing (Q4 2025)',
  '1.0.0',
  true,
  'Fike, Kidde, Ansul, Johnson Controls, Siemens',
  'high',
  'NOVEC 1230 $85K/container, Water mist $65K, Aerosol $55K. Includes detection, thermal monitoring, and smoke detection. UL 9540A compliant'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- Thermal Management Systems Configuration
INSERT INTO pricing_configurations (config_key, config_category, config_data, description, version, is_active, data_source, confidence_level, vendor_notes)
VALUES (
  'thermal_management',
  'hvac',
  '{
    "hvac_per_container": 45000,
    "hvac_per_mwh": 8000,
    "liquid_cooling_per_mwh": 12000,
    "air_cooling_per_mwh": 6000,
    "chiller_system_cost": 35000,
    "heat_exchanger_cost": 25000,
    "cooling_tower_cost": 40000,
    "ventilation_per_container": 15000,
    "energy_consumption_kw_per_mw": 50,
    "maintenance_annual_cost": 8000
  }',
  'Thermal management and HVAC system pricing (Q4 2025)',
  '1.0.0',
  true,
  'Carrier, Trane, Johnson Controls, Daikin',
  'medium',
  'HVAC $45K/container or $8K/MWh, Liquid cooling $12K/MWh, Air cooling $6K/MWh. Critical for battery lifespan'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT 
  config_key,
  config_category,
  is_active,
  data_source,
  confidence_level,
  LEFT(description, 60) as description_preview
FROM pricing_configurations
WHERE config_key IN (
  'solar_default',
  'wind_default', 
  'generator_default',
  'ev_charging_default',
  'power_conversion_systems',
  'transformers_default',
  'switchgear_protection',
  'control_systems',
  'fire_suppression',
  'thermal_management'
)
ORDER BY config_category, config_key;

-- Count total configs
SELECT 
  'Total pricing configurations: ' || COUNT(*)::text as summary,
  'Expected: 13 configs' as expected
FROM pricing_configurations;
