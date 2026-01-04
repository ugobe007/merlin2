-- ============================================================================
-- FIX HOTEL CATEGORY ICONS - Use Emojis (Step3HotelEnergy expects emojis)
-- ============================================================================
-- Date: January 2, 2026
-- Purpose: Step3HotelEnergy renders icons as emoji strings, not Lucide components
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_question_id UUID;
  v_options JSONB;
  v_updated_options JSONB;
  v_opt JSONB;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIXING HOTEL CATEGORY ICONS TO USE EMOJIS';
  RAISE NOTICE '========================================';

  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'hotel' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    FOR v_question_id IN 
      SELECT id FROM custom_questions 
      WHERE use_case_id = v_use_case_id 
        AND field_name IN ('hotelCategory', 'hotelType', 'hotelClassification')
        AND question_type = 'select'
        AND options IS NOT NULL
    LOOP
      SELECT options INTO v_options FROM custom_questions WHERE id = v_question_id;
      v_updated_options := '[]'::jsonb;
      
      FOR v_opt IN SELECT * FROM jsonb_array_elements(v_options)
      LOOP
        CASE 
          WHEN v_opt->>'value' IN ('budget', '1-star', 'economy', 'inn-bb', 'small') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"💰"');
          WHEN v_opt->>'value' IN ('midscale', '2-star', 'mid-scale', 'extended-stay', 'extended_stay', 'travel', 'chain') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🏨"');
          WHEN v_opt->>'value' = 'boutique' THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"✨"');
          WHEN v_opt->>'value' IN ('upscale', '3-star', 'upper-midscale', 'upper-upscale', 'upper-scale', 'large', 'non-classified') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🏢"');
          WHEN v_opt->>'value' IN ('luxury', '4-star', '5-star', 'resort') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🏰"');
          ELSE
            -- Keep existing icon if it's already an emoji, or set default
            IF v_opt ? 'icon' AND (v_opt->>'icon') ~ '^[^\x00-\x7F]' THEN
              v_updated_options := v_updated_options || v_opt;
            ELSE
              v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"🏨"');
            END IF;
        END CASE;
      END LOOP;
      
      UPDATE custom_questions SET options = v_updated_options WHERE id = v_question_id;
      RAISE NOTICE '✅ Updated hotel category icons to emojis (question ID: %)', v_question_id;
    END LOOP;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'HOTEL CATEGORY EMOJI ICON FIX COMPLETE';
  RAISE NOTICE '========================================';

END $$;
