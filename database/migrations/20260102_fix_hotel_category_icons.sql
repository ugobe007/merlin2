-- ============================================================================
-- FIX HOTEL CATEGORY ICONS
-- ============================================================================
-- Date: January 2, 2026
-- Purpose: Fix hotel category icon mapping - boutique was not getting Sparkles icon
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
  RAISE NOTICE 'FIXING HOTEL CATEGORY ICONS';
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
          -- Budget/Economy options
          WHEN v_opt->>'value' IN ('budget', '1-star', 'economy', 'inn-bb', 'small') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"BedSingle"');
          -- Midscale options
          WHEN v_opt->>'value' IN ('midscale', '2-star', 'mid-scale', 'extended-stay', 'extended_stay', 'travel', 'chain') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"BedDouble"');
          -- Boutique (MUST be before upscale to work correctly)
          WHEN v_opt->>'value' = 'boutique' THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Sparkles"');
          -- Upscale options
          WHEN v_opt->>'value' IN ('upscale', '3-star', 'upper-midscale', 'upper-upscale', 'large') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Hotel"');
          -- Luxury options
          WHEN v_opt->>'value' IN ('luxury', '4-star', '5-star', 'resort') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Castle"');
          -- Non-classified
          WHEN v_opt->>'value' = 'non-classified' THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Hotel"');
          ELSE
            -- If icon already exists, keep it; otherwise add default
            IF v_opt ? 'icon' THEN
              v_updated_options := v_updated_options || v_opt;
            ELSE
              v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Hotel"');
            END IF;
        END CASE;
      END LOOP;
      
      UPDATE custom_questions SET options = v_updated_options WHERE id = v_question_id;
      RAISE NOTICE '✅ Fixed hotel category icons (question ID: %)', v_question_id;
    END LOOP;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'HOTEL CATEGORY ICON FIX COMPLETE';
  RAISE NOTICE '========================================';

END $$;

-- Verification
SELECT 
  cq.field_name,
  cq.question_text,
  jsonb_array_length(cq.options) as option_count,
  jsonb_pretty(
    jsonb_agg(
      jsonb_build_object(
        'value', opt->>'value',
        'label', opt->>'label',
        'icon', opt->>'icon'
      )
    )
  ) as options_with_icons
FROM custom_questions cq
CROSS JOIN LATERAL jsonb_array_elements(cq.options) AS opt
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'hotel'
  AND cq.field_name IN ('hotelCategory', 'hotelType', 'hotelClassification')
  AND cq.question_type = 'select'
GROUP BY cq.id, cq.field_name, cq.question_text
ORDER BY cq.field_name;
