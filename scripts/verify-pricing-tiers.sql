-- Quick verification script for pricing tiers
-- Run this in Supabase SQL Editor to verify migration completed

-- 1. Check if size columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pricing_configurations' 
  AND column_name IN ('size_min_kw', 'size_max_kw', 'size_min_mwh', 'size_max_mwh')
ORDER BY column_name;

-- 2. Check if pricing tiers exist
SELECT 
  config_key,
  config_category,
  size_min_kw,
  size_max_kw,
  size_min_mwh,
  size_max_mwh,
  (config_data->>'price_mid')::numeric as price_mid,
  config_data->>'price_unit' as price_unit,
  data_source,
  confidence_level
FROM pricing_configurations 
WHERE (config_key LIKE 'bess_%' OR config_key LIKE 'solar_%')
  AND is_active = true
ORDER BY config_category, size_min_kw NULLS LAST;

-- 3. Count pricing tiers
SELECT 
  config_category,
  COUNT(*) as tier_count
FROM pricing_configurations 
WHERE (config_key LIKE 'bess_%' OR config_key LIKE 'solar_%')
  AND is_active = true
GROUP BY config_category
ORDER BY config_category;

-- Expected results:
-- BESS: 6 tiers (utility 3-10MW, 10-50MW, 50+MW, commercial 100-500kWh, 500-3000kWh, residential 5-20kWh)
-- Solar: 3 tiers (utility ≥5MW, commercial 50kW-5MW, residential 5-50kW)
-- Total: 9 tiers



