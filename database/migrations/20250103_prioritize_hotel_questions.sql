-- =============================================================================
-- PRIORITIZE HOTEL QUESTIONS - Main Form (max 18) vs Advanced Questions
-- =============================================================================
-- This migration marks questions as "advanced" so they can be shown in
-- a popup modal instead of the main form. Essential questions stay in main form.
--
-- Date: January 3, 2025
-- =============================================================================

DO $$
DECLARE
  v_hotel_id UUID;
  v_main_form_max_display_order INTEGER := 18;
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
  -- MARK ADVANCED QUESTIONS (if any)
  -- These questions are detailed/optional and will be shown in popup modal
  -- Note: meetingSpace and parking are now considered essential questions
  -- ============================================================================
  
  -- Currently no advanced questions for hotels
  -- Meeting & Event Space and Parking are essential questions for accurate sizing
  -- Add any truly optional/detailed questions here in the future if needed
  
  RAISE NOTICE '✅ Hotel questions prioritized - Meeting space and parking are essential questions';

END $$;

-- Add metadata column if it doesn't exist (for storing is_advanced flag)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_questions' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE custom_questions 
    ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    
    RAISE NOTICE 'Added metadata column to custom_questions table';
  END IF;
END $$;

-- Verify the changes
SELECT 
  field_name,
  question_text,
  display_order,
  COALESCE(metadata->>'is_advanced', 'false') as is_advanced
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
ORDER BY display_order;

