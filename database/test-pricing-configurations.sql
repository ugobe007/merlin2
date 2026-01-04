-- ============================================================================
-- PRICING CONFIGURATIONS SCHEMA TEST
-- ============================================================================
-- Date: January 2, 2026
-- Purpose: Test pricing_configurations table schema and data integrity
-- ============================================================================

-- Test 1: Check table structure
SELECT 'Test 1: Table Structure' as test_name;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'pricing_configurations'
ORDER BY ordinal_position;

-- Test 2: Check indexes
SELECT 'Test 2: Indexes' as test_name;
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'pricing_configurations'
ORDER BY indexname;

-- Test 3: Count active configurations
SELECT 'Test 3: Active Configurations Count' as test_name;
SELECT 
  COUNT(*) as total_configs,
  COUNT(*) FILTER (WHERE is_active = true) as active_configs,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_configs
FROM pricing_configurations;

-- Test 4: System Controls Pricing Configuration
SELECT 'Test 4: System Controls Pricing Config' as test_name;
SELECT 
  config_key,
  config_category,
  description,
  version,
  is_active,
  data_source,
  confidence_level,
  created_at,
  updated_at
FROM pricing_configurations
WHERE config_key = 'system_controls_pricing';

-- Test 5: Config Data Structure Validation
SELECT 'Test 5: Config Data Structure' as test_name;
SELECT 
  config_key,
  jsonb_object_keys(config_data) as top_level_key,
  jsonb_typeof(config_data->jsonb_object_keys(config_data)) as key_type
FROM pricing_configurations
WHERE config_key = 'system_controls_pricing'
ORDER BY top_level_key;

-- Test 6: Controller Pricing Values
SELECT 'Test 6: Controller Pricing Values' as test_name;
SELECT 
  config_key,
  jsonb_array_elements(config_data->'controllers')->>'id' as controller_id,
  (jsonb_array_elements(config_data->'controllers')->>'pricePerUnit')::numeric as price_per_unit,
  jsonb_array_elements(config_data->'controllers')->>'source' as source
FROM pricing_configurations
WHERE config_key = 'system_controls_pricing'
ORDER BY controller_id;

-- Test 7: SCADA System Pricing Values
SELECT 'Test 7: SCADA System Pricing Values' as test_name;
SELECT 
  config_key,
  jsonb_array_elements(config_data->'scadaSystems')->>'id' as scada_id,
  (jsonb_array_elements(config_data->'scadaSystems')->>'pricePerUnit')::numeric as price_per_unit,
  (jsonb_array_elements(config_data->'scadaSystems')->>'annualMaintenanceCost')::numeric as annual_maintenance
FROM pricing_configurations
WHERE config_key = 'system_controls_pricing'
ORDER BY scada_id;

-- Test 8: EMS System Pricing Values
SELECT 'Test 8: EMS System Pricing Values' as test_name;
SELECT 
  config_key,
  jsonb_array_elements(config_data->'energyManagementSystems')->>'id' as ems_id,
  (jsonb_array_elements(config_data->'energyManagementSystems')->'pricing'->>'setupFee')::numeric as setup_fee,
  (jsonb_array_elements(config_data->'energyManagementSystems')->'pricing'->>'monthlyPerSite')::numeric as monthly_per_site,
  (jsonb_array_elements(config_data->'energyManagementSystems')->'pricing'->>'perMWCapacity')::numeric as per_mw_capacity
FROM pricing_configurations
WHERE config_key = 'system_controls_pricing'
ORDER BY ems_id;

-- Test 9: Installation Costs
SELECT 'Test 9: Installation Costs' as test_name;
SELECT 
  config_key,
  config_data->'installationCosts' as installation_costs
FROM pricing_configurations
WHERE config_key = 'system_controls_pricing';

-- Test 10: Integration Costs
SELECT 'Test 10: Integration Costs' as test_name;
SELECT 
  config_key,
  config_data->'integrationCosts' as integration_costs
FROM pricing_configurations
WHERE config_key = 'system_controls_pricing';

-- Test 11: Maintenance Contracts
SELECT 'Test 11: Maintenance Contracts' as test_name;
SELECT 
  config_key,
  config_data->'maintenanceContracts' as maintenance_contracts
FROM pricing_configurations
WHERE config_key = 'system_controls_pricing';

-- Test 12: All Pricing Configurations Summary
SELECT 'Test 12: All Pricing Configurations Summary' as test_name;
SELECT 
  config_key,
  config_category,
  is_active,
  data_source,
  confidence_level,
  created_at,
  updated_at
FROM pricing_configurations
ORDER BY config_category, config_key;
