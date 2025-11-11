-- Check if initial data was inserted
SELECT 'Pricing Configurations' as table_name, COUNT(*)::text as row_count FROM pricing_configurations
UNION ALL
SELECT 'Calculation Formulas', COUNT(*)::text FROM calculation_formulas
UNION ALL
SELECT 'System Config', COUNT(*)::text FROM system_config
UNION ALL
SELECT 'Use Cases', COUNT(*)::text FROM use_cases
UNION ALL
SELECT 'Market Pricing Data', COUNT(*)::text FROM market_pricing_data;

-- Show actual pricing configs
SELECT config_key, config_category, is_active FROM pricing_configurations;

-- Show actual formulas
SELECT formula_key, formula_category, validation_status FROM calculation_formulas;
o