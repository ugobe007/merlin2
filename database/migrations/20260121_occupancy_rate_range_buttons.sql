-- Migration: Convert occupancyRate from slider to range_buttons
-- Date: 2026-01-21
-- Purpose: Better UX for occupancy rate question - users select a range instead of precise %
-- Status: APPLIED via scripts/update-occupancy-rate.mjs on 2026-01-21

UPDATE custom_questions
SET 
  question_type = 'range_buttons',
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
  default_value = '68'
WHERE field_name = 'occupancyRate';
