-- =============================================================================
-- FIX existingGeneration ICON MAPPINGS
-- =============================================================================
-- The icons are currently in the wrong order. They should match the labels:
-- - Solar Panels → ☀️ (not ❌)
-- - Generator → ⛽ (not ☀️)
-- - Battery Storage → 🔋 (not ⛽)
-- - EV Chargers → 🔌 (not 🔋)
--
-- Date: January 2, 2026
-- =============================================================================

DO $$
DECLARE
  v_hotel_id UUID;
  v_options JSONB;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIXING existingGeneration ICON MAPPINGS';
  RAISE NOTICE '========================================';

  SELECT id INTO v_hotel_id FROM use_cases WHERE slug = 'hotel' LIMIT 1;
  
  IF v_hotel_id IS NULL THEN
    RAISE NOTICE '❌ Hotel use case not found. Skipping migration.';
    RETURN;
  END IF;

  -- Fix existingGeneration icons based on the value (not position)
  UPDATE custom_questions
  SET options = (
    SELECT jsonb_agg(
      jsonb_set(
        opt,
        '{icon}',
        CASE 
          WHEN opt->>'value' = 'solar' THEN '"☀️"'
          WHEN opt->>'value' = 'generator' THEN '"⛽"'
          WHEN opt->>'value' = 'battery' THEN '"🔋"'
          WHEN opt->>'value' = 'ev_chargers' THEN '"🔌"'
          WHEN opt->>'value' = 'none' THEN '"❌"'
          ELSE opt->>'icon'
        END::jsonb
      )
    )
    FROM jsonb_array_elements(options) AS opt
  )
  WHERE use_case_id = v_hotel_id 
    AND field_name = 'existingGeneration'
    AND jsonb_array_length(options) = 4;
  
  RAISE NOTICE '✅ Fixed existingGeneration icon mappings';

  -- Also fix existingInfrastructure (the original field)
  UPDATE custom_questions
  SET options = (
    SELECT jsonb_agg(
      jsonb_set(
        opt,
        '{icon}',
        CASE 
          WHEN opt->>'value' = 'solar' THEN '"☀️"'
          WHEN opt->>'value' = 'generator' THEN '"⛽"'
          WHEN opt->>'value' = 'battery' THEN '"🔋"'
          WHEN opt->>'value' = 'ev_chargers' THEN '"🔌"'
          WHEN opt->>'value' = 'none' THEN '"❌"'
          ELSE opt->>'icon'
        END::jsonb
      )
    )
    FROM jsonb_array_elements(options) AS opt
  )
  WHERE use_case_id = v_hotel_id 
    AND field_name = 'existingInfrastructure'
    AND jsonb_array_length(options) = 4;
  
  RAISE NOTICE '✅ Fixed existingInfrastructure icon mappings';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ICON FIX COMPLETE';
  RAISE NOTICE '========================================';

END $$;

-- Verify the fix
SELECT 
  field_name,
  jsonb_pretty(options) as options_with_correct_icons
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel' LIMIT 1)
  AND field_name IN ('existingGeneration', 'existingInfrastructure')
ORDER BY field_name;
