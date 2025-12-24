-- =============================================================================
-- MOVE HOTEL QUESTIONS TO ADVANCED (Reduce Main Form to 18 Questions)
-- =============================================================================
-- We have 24 questions total, but want to limit the main form to 18.
-- Move 6 less critical questions to "Advanced Questions" modal.
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
  -- MOVE 6 QUESTIONS TO ADVANCED STATUS
  -- ============================================================================
  -- These questions are valuable but less critical for initial BESS sizing:
  -- 1. buildingAge - Efficiency factor, can use industry defaults
  -- 2. peakDemandTimes - Strategy optimization, not critical for sizing
  -- 3. hvacSystemType - Affects load but can be estimated from hotel category
  -- 4. utilityRateStructure - Important for savings but can use defaults initially
  -- 5. squareFeet - Can be estimated from room count (optional)
  -- 6. avgOccupancy - Can use industry average (60-75%) for initial sizing
  
  -- Update metadata to mark as advanced
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

  RAISE NOTICE '✅ Moved 6 questions to Advanced Questions modal';
  RAISE NOTICE '   - buildingAge (efficiency factor)';
  RAISE NOTICE '   - peakDemandTimes (strategy optimization)';
  RAISE NOTICE '   - hvacSystemType (load factor)';
  RAISE NOTICE '   - utilityRateStructure (savings calculation)';
  RAISE NOTICE '   - squareFeet (can estimate from room count)';
  RAISE NOTICE '   - avgOccupancy (can use industry average)';

END $$;

-- Verify the changes
SELECT 
  field_name,
  question_text,
  display_order,
  COALESCE(metadata->>'is_advanced', 'false') as is_advanced
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
ORDER BY 
  COALESCE((metadata->>'is_advanced')::boolean, false),
  display_order;

-- Show counts
SELECT 
  COUNT(*) as total_questions,
  COUNT(*) FILTER (WHERE COALESCE(metadata->>'is_advanced', 'false') = 'true') as advanced_questions,
  COUNT(*) FILTER (WHERE COALESCE(metadata->>'is_advanced', 'false') != 'true') as main_questions
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- List main form questions (should be 18)
SELECT 
  display_order,
  field_name,
  question_text
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
AND COALESCE(metadata->>'is_advanced', 'false') != 'true'
ORDER BY display_order;

