-- Single Source of Truth Migration
-- Run this script in your Supabase SQL Editor to create the pricing configuration tables
-- Date: November 10, 2025
-- Version: 1.0.0

-- This script creates the database tables needed for centralized pricing and calculation management
-- After running this, both the Smart Wizard and Advanced Configuration will use the same data source

\i docs/PRICING_CONFIG_SCHEMA.sql

-- Verify tables were created
SELECT 'Pricing configurations table' as table_name, COUNT(*) as record_count 
FROM pricing_configurations
UNION ALL
SELECT 'Calculation formulas table', COUNT(*) 
FROM calculation_formulas
UNION ALL
SELECT 'Market pricing data table', COUNT(*) 
FROM market_pricing_data;

-- Show sample data
SELECT 
    config_key,
    config_category,
    is_active,
    data_source,
    confidence_level
FROM pricing_configurations
ORDER BY config_category, config_key;

SELECT 
    formula_key,
    formula_name,
    formula_category,
    is_active,
    validation_status
FROM calculation_formulas
ORDER BY formula_category, formula_name;
