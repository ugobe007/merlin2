-- Migration: Convert occupancyRate from slider to range_buttons
-- Date: 2026-01-21
-- Purpose: Better UX for occupancy rate question - users select a range instead of precise %
--
-- CONTEXT: Occupancy rate should be buttons with ranges like:
--   Low (0-40%), Medium (40-60%), Average (60-75%), High (75-90%), Very High (90-100%)
-- This is more intuitive than a slider, and calculations only need approximate values

-- ============================================================================
-- UPDATE: Change occupancyRate to range_buttons input type
-- ============================================================================
UPDATE custom_questions
SET 
  input_type = 'range_buttons',
  options = jsonb_build_object(
    'ranges', jsonb_build_array(
      jsonb_build_object('label', 'Low', 'sublabel', '0-40%', 'min', 0, 'max', 40),
      jsonb_build_object('label', 'Moderate', 'sublabel', '40-60%', 'min', 40, 'max', 60),
      jsonb_build_object('label', 'Average', 'sublabel', '60-75%', 'min', 60, 'max', 75),
      jsonb_build_object('label', 'High', 'sublabel', '75-90%', 'min', 75, 'max', 90),
      jsonb_build_object('label', 'Very High', 'sublabel', '90-100%', 'min', 90, 'max', 100)
    ),
    'suffix', '%'
  ),
  help_text = 'Select the range that best describes your typical occupancy',
  default_value = '68'  -- Midpoint of "Average" range (60-75%)
WHERE field_name = 'occupancyRate';

-- ============================================================================
-- VERIFICATION: Check the update was applied
-- ============================================================================
-- SELECT id, use_case_id, field_name, input_type, options, default_value
-- FROM custom_questions
-- WHERE field_name = 'occupancyRate';
