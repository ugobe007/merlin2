-- ========================================
-- UPDATE GENERATOR AND EPC PRICING - March 15, 2026
-- ========================================
-- Purpose: Update generator and EPC pricing based on five real vendor quotes
-- 
-- Analysis Source: PRICING_CALIBRATION_THREE_PROJECTS.md
-- Projects Analyzed:
--   - Hampton Heights (UK, £6.163M) - 3.5 MWh BESS + 2 MWp solar + 2 MW NG gen
--   - GoGoEV Clubhouse (UK, £472k) - 418 kWh BESS + 250 kW solar
--   - VoloStar Tribal (US, $628k) - 1 MWh BESS + 250 kW solar
--   - Train Charging Hub (Intl, $12.17M) - 10 MWh BESS + 5 MWp solar + 2 MW gen
--   - HADLEY UK Apartments (UK, £12.7M) - 10 MWh BESS + Mainspring generators
--
-- KEY FINDINGS:
-- 1. ✅ BESS pricing: $112.50/kWh is CORRECT (vendor range $105-145/kWh)
-- 2. ❌ NG Generator pricing: Currently $700/kW, should be $430/kW (1.6× too high)
-- 3. ❌ Diesel Generator pricing: Currently $800/kW, should be $450/kW (1.8× too high)
-- 4. ❌ EPC margins: Currently 15%, should be 27% (average of 25-30% from real projects)
--
-- ========================================

-- ========================================
-- 1. UPDATE GENERATOR PRICING
-- ========================================

UPDATE pricing_configurations
SET 
  config_data = jsonb_set(
    jsonb_set(
      config_data,
      '{natural_gas_per_kw}',
      '430'::jsonb
    ),
    '{diesel_per_kw}',
    '450'::jsonb
  ),
  description = 'Generator pricing by fuel type - Updated March 2026 based on vendor quotes',
  data_source = 'Hampton Heights, GoGoEV, VoloStar, Train Hub, HADLEY vendor quotes (Oct 2025)',
  version = '2.0.0',
  updated_at = NOW()
WHERE config_key = 'generator_default';

-- ========================================
-- 2. UPDATE EPC MARGINS
-- ========================================

UPDATE pricing_configurations
SET 
  config_data = jsonb_set(
    config_data,
    '{epcPercentage}',
    '0.27'::jsonb
  ),
  description = 'Balance of plant and installation costs - Updated March 2026 for realistic EPC margins',
  data_source = 'Industry standards + five real project validations (25-30% range)',
  version = '2.0.0',
  updated_at = NOW()
WHERE config_key = 'balance_of_plant_default';

-- ========================================
-- 3. ADD MAINSPRING LINEAR GENERATOR PRICING
-- ========================================

UPDATE pricing_configurations
SET 
  config_data = jsonb_set(
    config_data,
    '{linear_generator_per_kw}',
    '1500'::jsonb
  ),
  description = 'Generator pricing by fuel type - Updated March 2026 based on vendor quotes (includes Mainspring linear generators)',
  data_source = 'Hampton Heights, GoGoEV, VoloStar, Train Hub, HADLEY vendor quotes (Oct 2025)',
  version = '2.0.1',
  updated_at = NOW()
WHERE config_key = 'generator_default';

-- ========================================
-- 4. VERIFICATION QUERIES
-- ========================================

-- Verify generator pricing update
SELECT 
  config_key,
  config_data->>'natural_gas_per_kw' as ng_per_kw,
  config_data->>'diesel_per_kw' as diesel_per_kw,
  config_data->>'dual_fuel_per_kw' as dual_fuel_per_kw,
  config_data->>'linear_generator_per_kw' as linear_gen_per_kw,
  version,
  data_source
FROM pricing_configurations
WHERE config_key = 'generator_default';

-- Verify EPC margin update
SELECT 
  config_key,
  config_data->>'epcPercentage' as epc_percentage,
  config_data->>'bopPercentage' as bop_percentage,
  version,
  data_source
FROM pricing_configurations
WHERE config_key = 'balance_of_plant_default';

-- ========================================
-- EXPECTED RESULTS:
-- ========================================
-- Generator pricing:
--   - natural_gas_per_kw: 430 (was 700)
--   - diesel_per_kw: 450 (was 800)
--   - dual_fuel_per_kw: 900 (unchanged)
--   - linear_generator_per_kw: 1500 (NEW - Mainspring from HADLEY project)
--
-- EPC margins:
--   - epcPercentage: 0.27 (was 0.15)
--   - bopPercentage: 0.12 (unchanged)
--
-- ========================================
