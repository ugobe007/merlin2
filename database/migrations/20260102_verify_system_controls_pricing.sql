-- ============================================================================
-- VERIFY SYSTEM CONTROLS PRICING MIGRATION
-- ============================================================================
-- Date: January 2, 2026
-- Purpose: Verify that system_controls_pricing was inserted correctly
-- ============================================================================

-- Check if the configuration was inserted
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

-- Check the config_data structure (first level keys)
SELECT 
  config_key,
  jsonb_object_keys(config_data) as top_level_key
FROM pricing_configurations
WHERE config_key = 'system_controls_pricing';

-- Sample pricing values (controllers)
SELECT 
  config_key,
  jsonb_array_elements(config_data->'controllers') as controller
FROM pricing_configurations
WHERE config_key = 'system_controls_pricing'
LIMIT 5;
