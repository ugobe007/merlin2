-- ============================================================================
-- ADD EMOJI ICONS TO HOTEL STEP3 QUESTIONS
-- ============================================================================
-- Date: January 2, 2026
-- Purpose: Step3HotelEnergy expects emoji icons, not Lucide icon names
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_question_id UUID;
  v_options JSONB;
  v_updated_options JSONB;
  v_opt JSONB;
  v_field_name TEXT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ADDING EMOJI ICONS TO HOTEL STEP3 QUESTIONS';
  RAISE NOTICE '========================================';

  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'hotel' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- Process each question field that needs emoji icons
    FOR v_question_id, v_field_name IN 
      SELECT id, field_name FROM custom_questions 
      WHERE use_case_id = v_use_case_id 
        AND field_name IN (
          'meetingSpace',
          'parkingType',
          'exteriorLoads',
          'poolType',
          'fitnessCenter',
          'spaServices',
          'foodBeverage',
          'laundryType',
          'hvacType',
          'solarSpace',
          'existingGeneration'
        )
        AND question_type IN ('select', 'multiselect')
        AND options IS NOT NULL
    LOOP
      SELECT options INTO v_options FROM custom_questions WHERE id = v_question_id;
      v_updated_options := '[]'::jsonb;
      
      FOR v_opt IN SELECT * FROM jsonb_array_elements(v_options)
      LOOP
        -- Map icons based on field_name and option value
        CASE v_field_name
          -- MEETING SPACE
          WHEN 'meetingSpace' THEN
            CASE v_opt->>'value'
              WHEN 'none' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"❌"');
              WHEN 'small' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"👥"');
              WHEN 'medium' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"📊"');
              WHEN 'large' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🏢"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🏛️"');
            END CASE;
          
          -- PARKING TYPE
          WHEN 'parkingType' THEN
            CASE v_opt->>'value'
              WHEN 'street' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🅿️"');
              WHEN 'surface' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🚗"');
              WHEN 'garage' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🏗️"');
              WHEN 'valet' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🅿️"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🚙"');
            END CASE;
          
          -- EXTERIOR LOADS
          WHEN 'exteriorLoads' THEN
            CASE v_opt->>'value'
              WHEN 'lighting' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"💡"');
              WHEN 'signage' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"📺"');
              WHEN 'water_features' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"💧"');
              WHEN 'landscaping' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🌳"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"⚡"');
            END CASE;
          
          -- POOL TYPE
          WHEN 'poolType' THEN
            CASE v_opt->>'value'
              WHEN 'none' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"❌"');
              WHEN 'outdoor' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🏊"');
              WHEN 'indoor' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🏊‍♂️"');
              WHEN 'heated' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"♨️"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"💧"');
            END CASE;
          
          -- FITNESS CENTER
          WHEN 'fitnessCenter' THEN
            CASE v_opt->>'value'
              WHEN 'none' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"❌"');
              WHEN 'basic' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"💪"');
              WHEN 'full' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🏋️"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"⚡"');
            END CASE;
          
          -- SPA SERVICES
          WHEN 'spaServices' THEN
            CASE v_opt->>'value'
              WHEN 'none' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"❌"');
              WHEN 'basic' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🧖"');
              WHEN 'full' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"💆"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"✨"');
            END CASE;
          
          -- FOOD & BEVERAGE
          WHEN 'foodBeverage' THEN
            CASE v_opt->>'value'
              WHEN 'none' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"❌"');
              WHEN 'breakfast' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🥐"');
              WHEN 'restaurant' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🍽️"');
              WHEN 'full' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"👨‍🍳"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"☕"');
            END CASE;
          
          -- LAUNDRY TYPE
          WHEN 'laundryType' THEN
            CASE v_opt->>'value'
              WHEN 'none' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"❌"');
              WHEN 'guest' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"👔"');
              WHEN 'commercial' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"👕"');
              WHEN 'outsourced' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"📦"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🧺"');
            END CASE;
          
          -- HVAC TYPE
          WHEN 'hvacType' THEN
            CASE v_opt->>'value'
              WHEN 'central' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"❄️"');
              WHEN 'packaged' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🌡️"');
              WHEN 'split' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🌀"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"💨"');
            END CASE;
          
          -- SOLAR SPACE
          WHEN 'solarSpace' THEN
            CASE v_opt->>'value'
              WHEN 'rooftop' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🏠"');
              WHEN 'ground' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🌍"');
              WHEN 'parking' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🅿️"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"☀️"');
            END CASE;
          
          -- EXISTING GENERATION
          WHEN 'existingGeneration' THEN
            CASE v_opt->>'value'
              WHEN 'none' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"❌"');
              WHEN 'solar' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"☀️"');
              WHEN 'generator' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"⛽"');
              WHEN 'battery' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🔋"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"⚡"');
            END CASE;
          
          ELSE
            -- Keep existing icon if it's already an emoji, or set default
            IF v_opt ? 'icon' AND (v_opt->>'icon') ~ '^[^\x00-\x7F]' THEN
              v_updated_options := v_updated_options || v_opt;
            ELSE
              v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"⚡"');
            END IF;
        END CASE;
      END LOOP;
      
      UPDATE custom_questions SET options = v_updated_options WHERE id = v_question_id;
      RAISE NOTICE '✅ Updated icons for % (question ID: %)', v_field_name, v_question_id;
    END LOOP;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'HOTEL STEP3 EMOJI ICONS ADDED';
  RAISE NOTICE '========================================';

END $$;
