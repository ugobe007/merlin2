-- ============================================================================
-- UI CONFIGURATION LIMITS - Single Source of Truth
-- ============================================================================
-- All UI input constraints (min/max values) are stored in the database
-- Components fetch these limits to ensure consistency across the app
-- 
-- Created: November 30, 2025
-- ============================================================================

-- Insert UI configuration limits for car wash vertical
INSERT INTO pricing_configurations (
    config_key,
    config_category,
    config_data,
    description,
    is_active,
    effective_date
) VALUES (
    'car_wash_ui_limits',
    'ui_configuration',
    '{
        "numberOfBays": {
            "min": 1,
            "max": 20,
            "default": 4,
            "step": 1,
            "label": "Number of Wash Bays"
        },
        "carsPerDay": {
            "min": 25,
            "max": 1000,
            "default": 150,
            "step": 25,
            "label": "Cars Washed per Day"
        },
        "tunnelLength": {
            "min": 60,
            "max": 300,
            "default": 120,
            "step": 10,
            "unit": "ft",
            "label": "Tunnel Length"
        },
        "standardBlowers": {
            "min": 0,
            "max": 20,
            "default": 6,
            "step": 1,
            "powerKW": 7.5,
            "label": "Standard Blowers"
        },
        "vacuumStations": {
            "min": 0,
            "max": 40,
            "default": 8,
            "step": 1,
            "powerKW": 3,
            "label": "Vacuum Stations"
        },
        "highPressurePumps": {
            "min": 0,
            "max": 8,
            "default": 2,
            "step": 1,
            "powerKW": 11,
            "label": "High-Pressure Pump Stations"
        },
        "topBrushes": {
            "min": 0,
            "max": 6,
            "default": 2,
            "step": 1,
            "powerKW": 4,
            "label": "Top Brushes"
        },
        "wrapAroundBrushes": {
            "min": 0,
            "max": 8,
            "default": 4,
            "step": 1,
            "powerKW": 3.7,
            "label": "Wrap-Around Brushes"
        },
        "mitterCurtains": {
            "min": 0,
            "max": 6,
            "default": 2,
            "step": 1,
            "powerKW": 1,
            "label": "Mitter Curtains"
        },
        "wheelBrushes": {
            "min": 0,
            "max": 8,
            "default": 4,
            "step": 1,
            "powerKW": 0.6,
            "label": "Wheel Brushes"
        },
        "chemicalStations": {
            "min": 0,
            "max": 8,
            "default": 4,
            "step": 1,
            "powerKW": 1.5,
            "label": "Chemical Pump Stations"
        },
        "airCompressorHP": {
            "min": 5,
            "max": 50,
            "default": 10,
            "step": 5,
            "label": "Air Compressor (HP)"
        },
        "solarRoofArea": {
            "min": 0,
            "max": 50000,
            "default": 5000,
            "step": 500,
            "unit": "sqft",
            "label": "Available Roof Area for Solar"
        },
        "hoursPerDay": {
            "min": 6,
            "max": 24,
            "default": 12,
            "step": 1,
            "label": "Operating Hours per Day"
        },
        "daysPerWeek": {
            "min": 5,
            "max": 7,
            "default": 7,
            "step": 1,
            "label": "Operating Days per Week"
        },
        "targetSavingsPercent": {
            "min": 10,
            "max": 80,
            "default": 40,
            "step": 5,
            "label": "Target Demand Reduction %"
        },
        "currentMonthlyBill": {
            "min": 500,
            "max": 50000,
            "default": 5000,
            "step": 100,
            "label": "Current Monthly Electric Bill"
        }
    }'::jsonb,
    'UI input field constraints for car wash vertical - min, max, default values',
    true,
    NOW()
) ON CONFLICT (config_key) DO UPDATE SET
    config_data = EXCLUDED.config_data,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Insert general BESS UI limits (for SmartWizard and other components)
INSERT INTO pricing_configurations (
    config_key,
    config_category,
    config_data,
    description,
    is_active,
    effective_date
) VALUES (
    'bess_ui_limits',
    'ui_configuration',
    '{
        "storageSizeMW": {
            "min": 0.05,
            "max": 100,
            "default": 1,
            "step": 0.05,
            "label": "Storage Size (MW)"
        },
        "durationHours": {
            "min": 1,
            "max": 8,
            "default": 4,
            "step": 1,
            "label": "Duration (Hours)"
        },
        "electricityRate": {
            "min": 0.05,
            "max": 0.50,
            "default": 0.12,
            "step": 0.01,
            "unit": "$/kWh",
            "label": "Electricity Rate"
        },
        "demandChargeRate": {
            "min": 5,
            "max": 50,
            "default": 15,
            "step": 1,
            "unit": "$/kW",
            "label": "Demand Charge Rate"
        },
        "solarMW": {
            "min": 0,
            "max": 50,
            "default": 0,
            "step": 0.1,
            "label": "Solar Capacity (MW)"
        },
        "projectLifeYears": {
            "min": 10,
            "max": 30,
            "default": 25,
            "step": 5,
            "label": "Project Life (Years)"
        },
        "discountRate": {
            "min": 0.04,
            "max": 0.15,
            "default": 0.08,
            "step": 0.01,
            "label": "Discount Rate"
        }
    }'::jsonb,
    'UI input field constraints for general BESS configuration',
    true,
    NOW()
) ON CONFLICT (config_key) DO UPDATE SET
    config_data = EXCLUDED.config_data,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Verify insertion
SELECT 
    config_key,
    config_category,
    description,
    is_active
FROM pricing_configurations 
WHERE config_category = 'ui_configuration'
ORDER BY config_key;

-- ============================================================================
-- STATE ELECTRICITY RATES - Single Source of Truth
-- ============================================================================
-- All state-specific electricity rates used in calculations

INSERT INTO pricing_configurations (
    config_key,
    config_category,
    config_data,
    description,
    is_active,
    effective_date
) VALUES (
    'state_electricity_rates',
    'electricity_rates',
    '{
        "California": { "rate": 0.22, "demandCharge": 25, "peakRate": 0.35 },
        "Texas": { "rate": 0.12, "demandCharge": 15, "peakRate": 0.18 },
        "Florida": { "rate": 0.14, "demandCharge": 12, "peakRate": 0.20 },
        "New York": { "rate": 0.20, "demandCharge": 22, "peakRate": 0.32 },
        "Arizona": { "rate": 0.13, "demandCharge": 18, "peakRate": 0.22 },
        "Nevada": { "rate": 0.11, "demandCharge": 16, "peakRate": 0.18 },
        "Colorado": { "rate": 0.12, "demandCharge": 14, "peakRate": 0.19 },
        "Washington": { "rate": 0.10, "demandCharge": 10, "peakRate": 0.14 },
        "Oregon": { "rate": 0.11, "demandCharge": 11, "peakRate": 0.15 },
        "Georgia": { "rate": 0.12, "demandCharge": 13, "peakRate": 0.17 },
        "Illinois": { "rate": 0.14, "demandCharge": 14, "peakRate": 0.21 },
        "Pennsylvania": { "rate": 0.13, "demandCharge": 12, "peakRate": 0.19 },
        "Ohio": { "rate": 0.11, "demandCharge": 11, "peakRate": 0.16 },
        "Michigan": { "rate": 0.15, "demandCharge": 13, "peakRate": 0.22 },
        "North Carolina": { "rate": 0.11, "demandCharge": 10, "peakRate": 0.15 },
        "New Jersey": { "rate": 0.16, "demandCharge": 18, "peakRate": 0.24 },
        "Virginia": { "rate": 0.12, "demandCharge": 12, "peakRate": 0.17 },
        "Massachusetts": { "rate": 0.22, "demandCharge": 20, "peakRate": 0.32 },
        "Connecticut": { "rate": 0.21, "demandCharge": 19, "peakRate": 0.30 },
        "Maryland": { "rate": 0.13, "demandCharge": 14, "peakRate": 0.19 },
        "Other": { "rate": 0.13, "demandCharge": 15, "peakRate": 0.19 }
    }'::jsonb,
    'State-specific electricity rates including base rate, demand charge, and peak rate',
    true,
    NOW()
) ON CONFLICT (config_key) DO UPDATE SET
    config_data = EXCLUDED.config_data,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Verify all configurations
SELECT 
    config_key,
    config_category,
    description,
    is_active
FROM pricing_configurations 
WHERE config_category IN ('ui_configuration', 'electricity_rates')
ORDER BY config_category, config_key;
