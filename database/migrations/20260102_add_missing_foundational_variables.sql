-- =============================================================================
-- ADD MISSING FOUNDATIONAL VARIABLES
-- =============================================================================
-- Based on audit results, adding critical foundational variables that are
-- required for accurate energy calculations.
--
-- IMPORTANT: Default values are for UI initialization only, NOT SSOT.
-- The database (user-provided values) is the Single Source of Truth.
-- Defaults only help initialize the form when no user input exists yet.
--
-- Date: January 2, 2026
-- =============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_max_order INTEGER;
BEGIN

  -- ============================================================================
  -- APARTMENT: unitCount
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'apartment' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'unitCount'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Number of Units',
        'unitCount',
        'number',
        '400',
        '20',
        '2000',
        true,
        'Total number of residential units in the property',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added unitCount for apartment';
    END IF;
  END IF;

  -- ============================================================================
  -- CAR WASH: bayCount and tunnelCount
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'car-wash' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    -- bayCount (for self-service bays)
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'bayCount'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Number of Self-Service Bays',
        'bayCount',
        'number',
        '4',
        '1',
        '20',
        true,
        'Number of self-service or automatic wash bays',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added bayCount for car-wash';
    END IF;
    
    -- tunnelCount (for express tunnels)
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'tunnelCount'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Number of Express Tunnels',
        'tunnelCount',
        'number',
        '1',
        '0',
        '5',
        false,
        'Number of express/conveyor tunnels (if applicable)',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added tunnelCount for car-wash';
    END IF;
  END IF;

  -- ============================================================================
  -- DATA CENTER: rackCount (alternative to itLoadKW)
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'data-center' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'rackCount'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Number of Server Racks',
        'rackCount',
        'number',
        '400',
        '10',
        '10000',
        false,
        'Total number of server racks (alternative to IT Load if known)',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added rackCount for data-center';
    END IF;
  END IF;

  -- ============================================================================
  -- EV CHARGING: dcFastCount
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'ev-charging' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'dcFastCount'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'DC Fast Chargers (50-350 kW)',
        'dcFastCount',
        'number',
        '0',
        '0',
        '100',
        false,
        'Number of DC fast charging stations',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added dcFastCount for ev-charging';
    END IF;
  END IF;

  -- ============================================================================
  -- OFFICE: buildingSqFt
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'office' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'buildingSqFt'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Building Square Footage',
        'buildingSqFt',
        'number',
        '10000',
        '1000',
        '1000000',
        true,
        'Total building square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added buildingSqFt for office';
    END IF;
  END IF;

  -- ============================================================================
  -- WAREHOUSE: warehouseSqFt
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'warehouse' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'warehouseSqFt'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Warehouse Square Footage',
        'warehouseSqFt',
        'number',
        '250000',
        '10000',
        '5000000',
        true,
        'Total warehouse square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added warehouseSqFt for warehouse';
    END IF;
  END IF;

END $$;

-- =============================================================================
-- UPDATE EXISTING FOUNDATIONAL VARIABLES
-- Add default values and ensure required fields are marked correctly
-- =============================================================================

-- Hotel: roomCount - add default value
UPDATE custom_questions
SET default_value = '150'
WHERE field_name = 'roomCount'
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
  AND default_value IS NULL;

-- Hospital: bedCount - add default value
UPDATE custom_questions
SET default_value = '250'
WHERE field_name = 'bedCount'
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital')
  AND default_value IS NULL;

-- Data Center: itLoadKW - add default value
UPDATE custom_questions
SET default_value = '2000'
WHERE field_name = 'itLoadKW'
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
  AND default_value IS NULL;

-- EV Charging: level2Count - make required and add default
UPDATE custom_questions
SET is_required = true, default_value = '0'
WHERE field_name = 'level2Count'
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging')
  AND (is_required = false OR default_value IS NULL);

-- Manufacturing: facilitySqFt - add default if missing
UPDATE custom_questions
SET default_value = '50000'
WHERE field_name = 'facilitySqFt'
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing')
  AND default_value IS NULL;

-- Retail: storeSqFt - add default if missing
UPDATE custom_questions
SET default_value = '5000'
WHERE field_name = 'storeSqFt'
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail')
  AND default_value IS NULL;
