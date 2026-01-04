-- ============================================================================
-- FIX HOTEL CATEGORY ICONS - USE VALID LUCIDE ICON NAMES
-- ============================================================================
-- Date: January 2, 2026
-- Purpose: Fix hotel category icons to use valid Lucide React icon names
--          BedSingle/BedDouble/Hotel don't exist - using Bed/Building instead
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
  RAISE NOTICE 'FIXING HOTEL CATEGORY ICONS (VALID NAMES)';
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
          -- Budget/Economy options - use Bed icon (valid Lucide icon)
          WHEN v_opt->>'value' IN ('budget', '1-star', 'economy', 'inn-bb', 'small') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Bed"');
          -- Midscale options - use Bed icon (same icon, different styling can differentiate)
          WHEN v_opt->>'value' IN ('midscale', '2-star', 'mid-scale', 'extended-stay', 'extended_stay', 'travel', 'chain') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Bed"');
          -- Boutique - use Sparkles (valid Lucide icon)
          WHEN v_opt->>'value' = 'boutique' THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Sparkles"');
          -- Upscale options - use Building2 (valid Lucide icon, represents hotel)
          WHEN v_opt->>'value' IN ('upscale', '3-star', 'upper-midscale', 'upper-upscale', 'upper-scale', 'large') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Building2"');
          -- Luxury options - use Castle (valid Lucide icon)
          WHEN v_opt->>'value' IN ('luxury', '4-star', '5-star', 'resort') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Castle"');
          -- Non-classified - use Building2
          WHEN v_opt->>'value' = 'non-classified' THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Building2"');
          ELSE
            -- If icon already exists, keep it; otherwise add default
            IF v_opt ? 'icon' THEN
              v_updated_options := v_updated_options || v_opt;
            ELSE
              v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Building2"');
            END IF;
        END CASE;
      END LOOP;
      
      UPDATE custom_questions SET options = v_updated_options WHERE id = v_question_id;
      RAISE NOTICE '✅ Fixed hotel category icons with valid Lucide names (question ID: %)', v_question_id;
    END LOOP;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'HOTEL CATEGORY ICON FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Icon mapping:';
  RAISE NOTICE '  Budget/Economy → Bed';
  RAISE NOTICE '  Midscale → Bed';
  RAISE NOTICE '  Boutique → Sparkles';
  RAISE NOTICE '  Upscale → Building2';
  RAISE NOTICE '  Luxury → Castle';

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
      ) ORDER BY opt->>'value'
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
