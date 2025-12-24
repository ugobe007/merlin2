-- =============================================================================
-- FIX HOTEL QUESTIONS ORDERING AND CLEANUP
-- =============================================================================
-- Fixes:
-- 1. Remove solar/EV questions from main form (handled in Power Boost panel)
-- 2. Fix duplicate display_order values
-- 3. Remove duplicate primaryBESSApplication (redundant with energyGoals)
-- 4. Set proper display_order for 18 main questions
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
  -- STEP 1: DELETE SOLAR/EV QUESTIONS (handled in Power Boost panel)
  -- ============================================================================
  DELETE FROM custom_questions 
  WHERE use_case_id = v_hotel_id 
  AND field_name IN (
    'existingSolar', 'existingSolarKW', 'existingSolarMW', 'hasSolar', 'wantsSolar',
    'solarInterest', 'wantSolar',
    'existingEV', 'existingEVChargers', 'hasEVCharging', 'hasEVChargers',
    'evInterest', 'wantEVChargers', 'wantsEVCharging', 'wantsMoreEVCharging'
  );

  RAISE NOTICE '✅ Deleted solar/EV questions (handled in Power Boost panel)';

  -- ============================================================================
  -- STEP 2: DELETE DUPLICATE primaryBESSApplication (redundant with energyGoals)
  -- ============================================================================
  DELETE FROM custom_questions 
  WHERE use_case_id = v_hotel_id 
  AND field_name = 'primaryBESSApplication';

  RAISE NOTICE '✅ Deleted duplicate primaryBESSApplication question';

  -- ============================================================================
  -- STEP 3: MARK ADVANCED QUESTIONS
  -- ============================================================================
  UPDATE custom_questions
  SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_advanced": true}'::jsonb
  WHERE use_case_id = v_hotel_id
  AND field_name IN (
    'buildingAge',           -- Building age (efficiency factor)
    'peakDemandTimes',        -- Peak demand timing (strategy optimization)
    'hvacSystemType',         -- HVAC system type (load factor)
    'utilityRateStructure',  -- Rate structure (savings calculation)
    'squareFeet',            -- Square footage (can estimate from rooms)
    'avgOccupancy'            -- Average occupancy (can use industry average)
  );

  RAISE NOTICE '✅ Marked 6 questions as advanced';

  -- ============================================================================
  -- STEP 4: FIX DISPLAY ORDER FOR MAIN QUESTIONS (18 total)
  -- ============================================================================
  -- Main form questions in priority order:
  UPDATE custom_questions
  SET display_order = 1
  WHERE use_case_id = v_hotel_id AND field_name = 'roomCount';

  UPDATE custom_questions
  SET display_order = 2
  WHERE use_case_id = v_hotel_id AND field_name = 'hotelCategory';

  UPDATE custom_questions
  SET display_order = 3
  WHERE use_case_id = v_hotel_id AND field_name = 'amenities';

  UPDATE custom_questions
  SET display_order = 4
  WHERE use_case_id = v_hotel_id AND field_name = 'foodBeverage';

  UPDATE custom_questions
  SET display_order = 5
  WHERE use_case_id = v_hotel_id AND field_name = 'meetingSpace';

  UPDATE custom_questions
  SET display_order = 6
  WHERE use_case_id = v_hotel_id AND field_name = 'laundryOperations';

  UPDATE custom_questions
  SET display_order = 7
  WHERE use_case_id = v_hotel_id AND field_name = 'parking';

  UPDATE custom_questions
  SET display_order = 8
  WHERE use_case_id = v_hotel_id AND field_name = 'guestServices';

  UPDATE custom_questions
  SET display_order = 9
  WHERE use_case_id = v_hotel_id AND field_name = 'elevatorCount';

  UPDATE custom_questions
  SET display_order = 10
  WHERE use_case_id = v_hotel_id AND field_name = 'gridConnectionKW';

  UPDATE custom_questions
  SET display_order = 11
  WHERE use_case_id = v_hotel_id AND field_name = 'backupRequirements';

  UPDATE custom_questions
  SET display_order = 12
  WHERE use_case_id = v_hotel_id AND field_name = 'energyGoals';

  -- Mark operatingHours as advanced if it exists (can use defaults)
  UPDATE custom_questions
  SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_advanced": true}'::jsonb
  WHERE use_case_id = v_hotel_id AND field_name = 'operatingHours';

  RAISE NOTICE '✅ Fixed display_order for main questions';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show main form questions (should be 12-18)
SELECT 
  display_order,
  field_name,
  question_text,
  question_type,
  COALESCE(metadata->>'is_advanced', 'false') as is_advanced
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
AND COALESCE(metadata->>'is_advanced', 'false') != 'true'
ORDER BY display_order;

-- Show advanced questions
SELECT 
  display_order,
  field_name,
  question_text,
  COALESCE(metadata->>'is_advanced', 'false') as is_advanced
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
AND COALESCE(metadata->>'is_advanced', 'false') = 'true'
ORDER BY display_order;

-- Show counts
SELECT 
  COUNT(*) as total_questions,
  COUNT(*) FILTER (WHERE COALESCE(metadata->>'is_advanced', 'false') = 'true') as advanced_questions,
  COUNT(*) FILTER (WHERE COALESCE(metadata->>'is_advanced', 'false') != 'true') as main_questions
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

