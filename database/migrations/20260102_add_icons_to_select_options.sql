-- ============================================================================
-- ADD ICONS TO SELECT/MULTISELECT OPTIONS
-- ============================================================================
-- Date: January 2, 2026
-- Purpose: Add icon fields to all select/multiselect question options
--          Icons are displayed in PillSelect component for better UX
--          Based on user feedback: icons not showing in Step 3
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_question_id UUID;
  v_field_name TEXT;
  v_options JSONB;
  v_updated_options JSONB;
  v_opt JSONB;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ADDING ICONS TO SELECT OPTIONS';
  RAISE NOTICE '========================================';

  -- ============================================================================
  -- HOTEL: Hotel Category/Type Options
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'hotel' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- Hotel Category/Type/Classification question
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
          -- Boutique (special case - needs to be before upscale)
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
      RAISE NOTICE '✅ Updated hotel category icons (question ID: %)', v_question_id;
    END LOOP;
  END IF;

  -- ============================================================================
  -- CAR WASH: Car Wash Type Options
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'car-wash' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    FOR v_question_id IN 
      SELECT id FROM custom_questions 
      WHERE use_case_id = v_use_case_id 
        AND field_name IN ('carWashType', 'washType')
        AND question_type = 'select'
        AND options IS NOT NULL
    LOOP
      SELECT options INTO v_options FROM custom_questions WHERE id = v_question_id;
      v_updated_options := '[]'::jsonb;
      
      FOR v_opt IN SELECT * FROM jsonb_array_elements(v_options)
      LOOP
        CASE 
          WHEN v_opt->>'value' IN ('automatic', 'tunnel', 'conveyor', 'full-service', 'full_service') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Car"');
          WHEN v_opt->>'value' IN ('self-service', 'self_service', 'bay', 'self-serve') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Settings"');
          WHEN v_opt->>'value' IN ('hybrid', 'combination') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Layers"');
          WHEN v_opt->>'value' IN ('touchless', 'touch-free') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Sparkles"');
          WHEN v_opt->>'value' IN ('soft-touch', 'soft_touch') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Droplets"');
          ELSE
            IF v_opt ? 'icon' THEN
              v_updated_options := v_updated_options || v_opt;
            ELSE
              v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Car"');
            END IF;
        END CASE;
      END LOOP;
      
      UPDATE custom_questions SET options = v_updated_options WHERE id = v_question_id;
      RAISE NOTICE '✅ Updated car wash type icons (question ID: %)', v_question_id;
    END LOOP;
  END IF;

  -- ============================================================================
  -- DATA CENTER: Tier Classification Options
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'data-center' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    FOR v_question_id IN 
      SELECT id FROM custom_questions 
      WHERE use_case_id = v_use_case_id 
        AND field_name IN ('tierLevel', 'tierClassification', 'uptimeTier', 'dcType')
        AND question_type = 'select'
        AND options IS NOT NULL
    LOOP
      SELECT options INTO v_options FROM custom_questions WHERE id = v_question_id;
      v_updated_options := '[]'::jsonb;
      
      FOR v_opt IN SELECT * FROM jsonb_array_elements(v_options)
      LOOP
        CASE 
          WHEN v_opt->>'value' IN ('1', 'tier1', 'tier_1', 'tier-1', 'Tier I') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Shield"');
          WHEN v_opt->>'value' IN ('2', 'tier2', 'tier_2', 'tier-2', 'Tier II') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Shield"');
          WHEN v_opt->>'value' IN ('3', 'tier3', 'tier_3', 'tier-3', 'Tier III') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Shield"');
          WHEN v_opt->>'value' IN ('4', 'tier4', 'tier_4', 'tier-4', 'Tier IV') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Shield"');
          WHEN v_opt->>'value' IN ('colocation', 'enterprise', 'hyperscale', 'edge') THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Server"');
          ELSE
            IF v_opt ? 'icon' THEN
              v_updated_options := v_updated_options || v_opt;
            ELSE
              v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Server"');
            END IF;
        END CASE;
      END LOOP;
      
      UPDATE custom_questions SET options = v_updated_options WHERE id = v_question_id;
      RAISE NOTICE '✅ Updated data center tier icons (question ID: %)', v_question_id;
    END LOOP;
  END IF;

  -- ============================================================================
  -- RESIDENTIAL: All select questions need icons (currently all missing)
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'residential' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- Process all select/multiselect questions for residential
    FOR v_question_id IN 
      SELECT id FROM custom_questions 
      WHERE use_case_id = v_use_case_id 
        AND question_type IN ('select', 'multiselect')
        AND options IS NOT NULL
    LOOP
      SELECT options INTO v_options FROM custom_questions WHERE id = v_question_id;
      SELECT field_name INTO v_field_name FROM custom_questions WHERE id = v_question_id;
      v_updated_options := '[]'::jsonb;
      
      -- Add icons based on field_name and option values
      FOR v_opt IN SELECT * FROM jsonb_array_elements(v_options)
      LOOP
        CASE 
          -- facilitySubtype: Home type
          WHEN v_field_name = 'facilitySubtype' THEN
            CASE 
              WHEN v_opt->>'value' IN ('single-family', 'single_family', 'house') THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Home"');
              WHEN v_opt->>'value' IN ('multi-family', 'multi_family', 'apartment', 'condo') THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Building"');
              WHEN v_opt->>'value' IN ('townhouse', 'town-home') THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Building2"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Home"');
            END CASE;
          -- gridSavingsGoal: Primary Goal
          WHEN v_field_name = 'gridSavingsGoal' THEN
            CASE 
              WHEN v_opt->>'value' LIKE '%cost%' OR v_opt->>'value' LIKE '%save%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"DollarSign"');
              WHEN v_opt->>'value' LIKE '%backup%' OR v_opt->>'value' LIKE '%outage%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Battery"');
              WHEN v_opt->>'value' LIKE '%solar%' OR v_opt->>'value' LIKE '%renewable%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Sun"');
              WHEN v_opt->>'value' LIKE '%grid%' OR v_opt->>'value' LIKE '%independence%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Zap"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Target"');
            END CASE;
          -- primaryBESSApplication
          WHEN v_field_name = 'primaryBESSApplication' THEN
            CASE 
              WHEN v_opt->>'value' LIKE '%peak%' OR v_opt->>'value' LIKE '%shaving%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"TrendingDown"');
              WHEN v_opt->>'value' LIKE '%backup%' OR v_opt->>'value' LIKE '%outage%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Battery"');
              WHEN v_opt->>'value' LIKE '%solar%' OR v_opt->>'value' LIKE '%self-consumption%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Sun"');
              WHEN v_opt->>'value' LIKE '%arbitrage%' OR v_opt->>'value' LIKE '%time%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Clock"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Zap"');
            END CASE;
          -- gridReliabilityIssues
          WHEN v_field_name = 'gridReliabilityIssues' THEN
            v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"AlertCircle"');
          -- offGridReason
          WHEN v_field_name = 'offGridReason' THEN
            CASE 
              WHEN v_opt->>'value' LIKE '%cost%' OR v_opt->>'value' LIKE '%expensive%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"DollarSign"');
              WHEN v_opt->>'value' LIKE '%reliability%' OR v_opt->>'value' LIKE '%outage%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Shield"');
              WHEN v_opt->>'value' LIKE '%solar%' OR v_opt->>'value' LIKE '%renewable%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Sun"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Zap"');
            END CASE;
          -- All other residential select questions (money/energy related)
          ELSE
            -- For numeric/value options, use appropriate icons
            CASE 
              WHEN v_field_name LIKE '%bill%' OR v_field_name LIKE '%cost%' OR v_field_name LIKE '%charge%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"DollarSign"');
              WHEN v_field_name LIKE '%kw%' OR v_field_name LIKE '%capacity%' OR v_field_name LIKE '%demand%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Zap"');
              WHEN v_field_name LIKE '%solar%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Sun"');
              WHEN v_field_name LIKE '%outage%' OR v_field_name LIKE '%hour%' THEN
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"Clock"');
              ELSE
                v_updated_options := v_updated_options || jsonb_set(v_opt, '{icon}', '"HelpCircle"');
            END CASE;
        END CASE;
      END LOOP;
      
      UPDATE custom_questions SET options = v_updated_options WHERE id = v_question_id;
      RAISE NOTICE '✅ Updated residential icons (field: %, question ID: %)', v_field_name, v_question_id;
    END LOOP;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'ICON UPDATE COMPLETE';
  RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- VERIFICATION: Check which select questions still need icons
-- ============================================================================
SELECT 
  uc.slug as industry,
  cq.field_name,
  cq.question_text,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM jsonb_array_elements(cq.options) AS opt
      WHERE opt ? 'icon'
    ) THEN '✅ Has icons'
    ELSE '❌ Missing icons'
  END as icon_status,
  jsonb_array_length(cq.options) as option_count
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE cq.question_type IN ('select', 'multiselect')
  AND cq.options IS NOT NULL
ORDER BY uc.slug, cq.display_order;
