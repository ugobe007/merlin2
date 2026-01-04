-- =============================================================================
-- CREATE MISSING HOTEL AMENITY QUESTIONS WITH EMOJI ICONS
-- =============================================================================
-- Step3HotelEnergy expects these fields but they don't exist in the database:
-- - poolType
-- - fitnessCenter
-- - spaServices
-- - foodBeverage (might exist as compound, but needs select version)
-- - laundryType (DB has laundryOperations, but component expects laundryType)
--
-- This migration creates these questions with emoji icons.
-- Date: January 2, 2026
-- =============================================================================

DO $$
DECLARE
  v_hotel_id UUID;
  v_current_order INTEGER;
  v_question_id UUID;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CREATING MISSING HOTEL AMENITY QUESTIONS';
  RAISE NOTICE '========================================';

  SELECT id INTO v_hotel_id FROM use_cases WHERE slug = 'hotel' LIMIT 1;
  
  IF v_hotel_id IS NULL THEN
    RAISE NOTICE '❌ Hotel use case not found. Skipping migration.';
    RETURN;
  END IF;

  -- Get the highest display_order to append new questions
  SELECT COALESCE(MAX(display_order), 0) INTO v_current_order
  FROM custom_questions
  WHERE use_case_id = v_hotel_id;

  -- ============================================================================
  -- 1. CREATE poolType QUESTION
  -- ============================================================================
  IF NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'poolType') THEN
    v_current_order := v_current_order + 1;
    INSERT INTO custom_questions (
      use_case_id, question_text, field_name, question_type,
      default_value, is_required, help_text, display_order, options
    ) VALUES (
      v_hotel_id,
      'Pool Type',
      'poolType',
      'select',
      'none',
      false,
      'Select the type of pool at your property',
      v_current_order,
      '[
        {"label": "None", "value": "none", "icon": "❌"},
        {"label": "Outdoor Pool", "value": "outdoor", "icon": "🏊"},
        {"label": "Indoor Pool", "value": "indoor", "icon": "🏊‍♂️"},
        {"label": "Heated Pool", "value": "heated", "icon": "♨️"}
      ]'::jsonb
    );
    RAISE NOTICE '✅ Created poolType question';
  ELSE
    -- Update existing poolType to add icons
    UPDATE custom_questions
    SET options = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            options,
            '{0,icon}',
            '"❌"'
          ),
          '{1,icon}',
          '"🏊"'
        ),
        '{2,icon}',
        '"🏊‍♂️"'
      ),
      '{3,icon}',
      '"♨️"'
    )
    WHERE use_case_id = v_hotel_id AND field_name = 'poolType';
    RAISE NOTICE '✅ Updated poolType question with icons';
  END IF;

  -- ============================================================================
  -- 2. CREATE fitnessCenter QUESTION
  -- ============================================================================
  IF NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'fitnessCenter') THEN
    v_current_order := v_current_order + 1;
    INSERT INTO custom_questions (
      use_case_id, question_text, field_name, question_type,
      default_value, is_required, help_text, display_order, options
    ) VALUES (
      v_hotel_id,
      'Fitness Center',
      'fitnessCenter',
      'select',
      'none',
      false,
      'Select the type of fitness center at your property',
      v_current_order,
      '[
        {"label": "None", "value": "none", "icon": "❌"},
        {"label": "Basic Fitness Center", "value": "basic", "icon": "💪"},
        {"label": "Full Fitness Center", "value": "full", "icon": "🏋️"}
      ]'::jsonb
    );
    RAISE NOTICE '✅ Created fitnessCenter question';
  ELSE
    -- Update existing fitnessCenter to add icons
    UPDATE custom_questions
    SET options = jsonb_set(
      jsonb_set(
        jsonb_set(
          options,
          '{0,icon}',
          '"❌"'
        ),
        '{1,icon}',
        '"💪"'
      ),
      '{2,icon}',
      '"🏋️"'
    )
    WHERE use_case_id = v_hotel_id AND field_name = 'fitnessCenter';
    RAISE NOTICE '✅ Updated fitnessCenter question with icons';
  END IF;

  -- ============================================================================
  -- 3. CREATE spaServices QUESTION
  -- ============================================================================
  IF NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'spaServices') THEN
    v_current_order := v_current_order + 1;
    INSERT INTO custom_questions (
      use_case_id, question_text, field_name, question_type,
      default_value, is_required, help_text, display_order, options
    ) VALUES (
      v_hotel_id,
      'Spa Services',
      'spaServices',
      'select',
      'none',
      false,
      'Select the type of spa services at your property',
      v_current_order,
      '[
        {"label": "None", "value": "none", "icon": "❌"},
        {"label": "Basic Spa Services", "value": "basic", "icon": "🧖"},
        {"label": "Full Spa Services", "value": "full", "icon": "💆"}
      ]'::jsonb
    );
    RAISE NOTICE '✅ Created spaServices question';
  ELSE
    -- Update existing spaServices to add icons
    UPDATE custom_questions
    SET options = jsonb_set(
      jsonb_set(
        jsonb_set(
          options,
          '{0,icon}',
          '"❌"'
        ),
        '{1,icon}',
        '"🧖"'
      ),
      '{2,icon}',
      '"💆"'
    )
    WHERE use_case_id = v_hotel_id AND field_name = 'spaServices';
    RAISE NOTICE '✅ Updated spaServices question with icons';
  END IF;

  -- ============================================================================
  -- 4. CREATE foodBeverage QUESTION (select version for Step3HotelEnergy)
  -- ============================================================================
  IF NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'foodBeverage' AND question_type = 'select') THEN
    v_current_order := v_current_order + 1;
    INSERT INTO custom_questions (
      use_case_id, question_text, field_name, question_type,
      default_value, is_required, help_text, display_order, options
    ) VALUES (
      v_hotel_id,
      'Food & Beverage',
      'foodBeverage',
      'select',
      'none',
      false,
      'Select the type of food & beverage operations',
      v_current_order,
      '[
        {"label": "None", "value": "none", "icon": "❌"},
        {"label": "Breakfast Only", "value": "breakfast", "icon": "🥐"},
        {"label": "Restaurant", "value": "restaurant", "icon": "🍽️"},
        {"label": "Full Service", "value": "full", "icon": "👨‍🍳"}
      ]'::jsonb
    );
    RAISE NOTICE '✅ Created foodBeverage (select) question';
  ELSE
    -- Update existing foodBeverage (select) to add icons
    UPDATE custom_questions
    SET options = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            options,
            '{0,icon}',
            '"❌"'
          ),
          '{1,icon}',
          '"🥐"'
        ),
        '{2,icon}',
        '"🍽️"'
      ),
      '{3,icon}',
      '"👨‍🍳"'
    )
    WHERE use_case_id = v_hotel_id AND field_name = 'foodBeverage' AND question_type = 'select';
    RAISE NOTICE '✅ Updated foodBeverage (select) question with icons';
  END IF;

  -- ============================================================================
  -- 5. CREATE laundryType QUESTION (alias for laundryOperations)
  -- ============================================================================
  IF NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'laundryType') THEN
    -- Copy laundryOperations to laundryType with icons
    -- Map icons based on value: guest=👔, commercial=👕, outsourced=📦, none=❌
    INSERT INTO custom_questions (
      use_case_id, question_text, field_name, question_type,
      default_value, is_required, help_text, display_order, options
    )
    SELECT 
      use_case_id,
      'Laundry Services',
      'laundryType',
      question_type,
      default_value,
      is_required,
      help_text,
      display_order + 100, -- Put it after other questions
      (
        SELECT jsonb_agg(
          jsonb_set(
            opt,
            '{icon}',
            CASE 
              WHEN opt->>'value' = 'none' THEN '"❌"'
              WHEN opt->>'value' = 'guest' THEN '"👔"'
              WHEN opt->>'value' = 'commercial' THEN '"👕"'
              WHEN opt->>'value' = 'outsourced' THEN '"📦"'
              ELSE '"👔"'
            END::jsonb
          )
        )
        FROM jsonb_array_elements(options) AS opt
      )
    FROM custom_questions
    WHERE use_case_id = v_hotel_id AND field_name = 'laundryOperations'
    LIMIT 1;
    RAISE NOTICE '✅ Created laundryType question (copy of laundryOperations)';
  ELSE
    -- Update existing laundryType to add icons
    UPDATE custom_questions
    SET options = (
      SELECT jsonb_agg(
        jsonb_set(
          opt,
          '{icon}',
          CASE 
            WHEN opt->>'value' = 'none' THEN '"❌"'
            WHEN opt->>'value' = 'guest' THEN '"👔"'
            WHEN opt->>'value' = 'commercial' THEN '"👕"'
            WHEN opt->>'value' = 'outsourced' THEN '"📦"'
            ELSE '"👔"'
          END::jsonb
        )
      )
      FROM jsonb_array_elements(options) AS opt
    )
    WHERE use_case_id = v_hotel_id AND field_name = 'laundryType';
    RAISE NOTICE '✅ Updated laundryType question with icons';
  END IF;

  -- ============================================================================
  -- 6. ADD ICONS TO EXISTING QUESTIONS
  -- ============================================================================

  -- meetingSpace (4 options)
  UPDATE custom_questions
  SET options = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          options,
          '{0,icon}',
          '"❌"'
        ),
        '{1,icon}',
        '"👥"'
      ),
      '{2,icon}',
      '"📊"'
    ),
    '{3,icon}',
    '"🏢"'
  )
  WHERE use_case_id = v_hotel_id AND field_name = 'meetingSpace'
    AND jsonb_array_length(options) = 4;
  RAISE NOTICE '✅ Added icons to meetingSpace';

  -- parkingType (3 options)
  UPDATE custom_questions
  SET options = jsonb_set(
    jsonb_set(
      jsonb_set(
        options,
        '{0,icon}',
        '"🅿️"'
      ),
      '{1,icon}',
      '"🚗"'
    ),
    '{2,icon}',
    '"🏗️"'
  )
  WHERE use_case_id = v_hotel_id AND field_name = 'parkingType'
    AND jsonb_array_length(options) = 3;
  RAISE NOTICE '✅ Added icons to parkingType';

  -- exteriorLoads (3 options)
  UPDATE custom_questions
  SET options = jsonb_set(
    jsonb_set(
      jsonb_set(
        options,
        '{0,icon}',
        '"💡"'
      ),
      '{1,icon}',
      '"📺"'
    ),
    '{2,icon}',
    '"💧"'
  )
  WHERE use_case_id = v_hotel_id AND field_name = 'exteriorLoads'
    AND jsonb_array_length(options) = 3;
  RAISE NOTICE '✅ Added icons to exteriorLoads';

  -- hvacType (3 options)
  UPDATE custom_questions
  SET options = jsonb_set(
    jsonb_set(
      jsonb_set(
        options,
        '{0,icon}',
        '"❄️"'
      ),
      '{1,icon}',
      '"🌡️"'
    ),
    '{2,icon}',
    '"🌀"'
  )
  WHERE use_case_id = v_hotel_id AND field_name = 'hvacType'
    AND jsonb_array_length(options) = 3;
  RAISE NOTICE '✅ Added icons to hvacType';

  -- solarInterest (3 options)
  UPDATE custom_questions
  SET options = jsonb_set(
    jsonb_set(
      jsonb_set(
        options,
        '{0,icon}',
        '"❌"'
      ),
      '{1,icon}',
      '"☀️"'
    ),
    '{2,icon}',
    '"🌍"'
  )
  WHERE use_case_id = v_hotel_id AND field_name = 'solarInterest'
    AND jsonb_array_length(options) = 3;
  RAISE NOTICE '✅ Added icons to solarInterest';

  -- solarSpaceAvailable (3 options) - also create alias as solarSpace
  UPDATE custom_questions
  SET options = jsonb_set(
    jsonb_set(
      jsonb_set(
        options,
        '{0,icon}',
        '"🏠"'
      ),
      '{1,icon}',
      '"🌍"'
    ),
      '{2,icon}',
      '"🅿️"'
    )
  WHERE use_case_id = v_hotel_id AND field_name = 'solarSpaceAvailable'
    AND jsonb_array_length(options) = 3;
  RAISE NOTICE '✅ Added icons to solarSpaceAvailable';

  -- Create solarSpace alias if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'solarSpace') THEN
    INSERT INTO custom_questions (
      use_case_id, question_text, field_name, question_type,
      default_value, is_required, help_text, display_order, options
    )
    SELECT 
      use_case_id,
      question_text,
      'solarSpace',
      question_type,
      default_value,
      is_required,
      help_text,
      display_order,
      options
    FROM custom_questions
    WHERE use_case_id = v_hotel_id AND field_name = 'solarSpaceAvailable'
    LIMIT 1;
    RAISE NOTICE '✅ Created solarSpace alias';
  END IF;

  -- existingInfrastructure (4 options) - also create alias as existingGeneration
  UPDATE custom_questions
  SET options = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          options,
          '{0,icon}',
          '"❌"'
        ),
        '{1,icon}',
        '"☀️"'
      ),
      '{2,icon}',
      '"⛽"'
    ),
    '{3,icon}',
    '"🔋"'
  )
  WHERE use_case_id = v_hotel_id AND field_name = 'existingInfrastructure'
    AND jsonb_array_length(options) = 4;
  RAISE NOTICE '✅ Added icons to existingInfrastructure';

  -- Create existingGeneration alias if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'existingGeneration') THEN
    INSERT INTO custom_questions (
      use_case_id, question_text, field_name, question_type,
      default_value, is_required, help_text, display_order, options
    )
    SELECT 
      use_case_id,
      question_text,
      'existingGeneration',
      question_type,
      default_value,
      is_required,
      help_text,
      display_order,
      options
    FROM custom_questions
    WHERE use_case_id = v_hotel_id AND field_name = 'existingInfrastructure'
    LIMIT 1;
    RAISE NOTICE '✅ Created existingGeneration alias';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created/Updated questions:';
  RAISE NOTICE '  - poolType';
  RAISE NOTICE '  - fitnessCenter';
  RAISE NOTICE '  - spaServices';
  RAISE NOTICE '  - foodBeverage (select)';
  RAISE NOTICE '  - laundryType (alias for laundryOperations)';
  RAISE NOTICE '  - meetingSpace (added icons)';
  RAISE NOTICE '  - parkingType (added icons)';
  RAISE NOTICE '  - exteriorLoads (added icons)';
  RAISE NOTICE '  - hvacType (added icons)';
  RAISE NOTICE '  - solarInterest (added icons)';
  RAISE NOTICE '  - solarSpace (alias for solarSpaceAvailable)';
  RAISE NOTICE '  - existingGeneration (alias for existingInfrastructure)';

END $$;

-- Verify the questions were created
SELECT 
  field_name,
  question_text,
  question_type,
  jsonb_array_length(options) as option_count,
  jsonb_pretty(options) as options_with_icons
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel' LIMIT 1)
  AND field_name IN (
    'poolType', 'fitnessCenter', 'spaServices', 'foodBeverage',
    'laundryType', 'meetingSpace', 'parkingType', 'exteriorLoads',
    'hvacType', 'solarInterest', 'solarSpace', 'existingGeneration'
  )
ORDER BY field_name;
