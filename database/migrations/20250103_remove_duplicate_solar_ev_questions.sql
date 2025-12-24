-- =============================================================================
-- REMOVE DUPLICATE SOLAR & EV QUESTIONS FROM HOTEL QUESTIONNAIRE
-- =============================================================================
-- These questions are already handled in the Power Boost panel at the top
-- of Step 3, so we remove them from the main questionnaire to avoid duplication.
--
-- Date: January 3, 2025
-- =============================================================================

DO $$
DECLARE
  v_hotel_id UUID;
BEGIN
  -- Get hotel use case ID
  SELECT id INTO v_hotel_id 
  FROM use_cases 
  WHERE slug = 'hotel' 
  LIMIT 1;

  IF v_hotel_id IS NULL THEN
    RAISE NOTICE 'Hotel use case not found. Skipping migration.';
    RETURN;
  END IF;

  -- ============================================================================
  -- DELETE SOLAR & EV QUESTIONS (handled in Power Boost panel)
  -- ============================================================================
  
  -- Remove existing solar question
  DELETE FROM custom_questions 
  WHERE use_case_id = v_hotel_id 
  AND field_name IN ('existingSolar', 'existingSolarKW', 'existingSolarMW', 'hasSolar', 'wantsSolar');
  
  -- Remove solar interest question
  DELETE FROM custom_questions 
  WHERE use_case_id = v_hotel_id 
  AND field_name IN ('solarInterest', 'solarInterest', 'wantSolar', 'wantsSolar');
  
  -- Remove existing EV question
  DELETE FROM custom_questions 
  WHERE use_case_id = v_hotel_id 
  AND field_name IN ('existingEV', 'existingEVChargers', 'hasEVCharging', 'hasEVChargers');
  
  -- Remove EV interest question
  DELETE FROM custom_questions 
  WHERE use_case_id = v_hotel_id 
  AND field_name IN ('evInterest', 'wantEVChargers', 'wantsEVCharging', 'wantsMoreEVCharging');
  
  RAISE NOTICE '✅ Removed duplicate solar and EV questions from hotel questionnaire';

END $$;

-- Verify the questions were removed
SELECT 
  field_name,
  question_text,
  display_order
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
AND field_name IN ('existingSolar', 'solarInterest', 'existingEV', 'evInterest', 'existingSolarKW', 'hasSolar', 'wantsSolar', 'existingEVChargers', 'hasEVCharging', 'wantEVChargers', 'wantsEVCharging')
ORDER BY display_order;

-- Should return 0 rows if successful

