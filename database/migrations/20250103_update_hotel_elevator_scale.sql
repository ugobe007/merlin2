-- ============================================================================
-- UPDATE HOTEL ELEVATOR QUESTION - Scale 1-25, Buttons Instead of Dropdown
-- ============================================================================
-- This migration updates the elevatorCount question to:
-- 1. Change from 'number' type to 'select' type with 25 button options (1-25)
-- 2. Replace current scale with new 1-25 range
-- ============================================================================

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
    RAISE EXCEPTION 'Hotel use case not found';
  END IF;

  -- Update elevatorCount question to use select type with 1-25 options
  UPDATE custom_questions
  SET
    question_type = 'select',
    default_value = '2',
    min_value = NULL,
    max_value = NULL,
    options = '[
      {"label": "1", "value": "1"},
      {"label": "2", "value": "2"},
      {"label": "3", "value": "3"},
      {"label": "4", "value": "4"},
      {"label": "5", "value": "5"},
      {"label": "6", "value": "6"},
      {"label": "7", "value": "7"},
      {"label": "8", "value": "8"},
      {"label": "9", "value": "9"},
      {"label": "10", "value": "10"},
      {"label": "11", "value": "11"},
      {"label": "12", "value": "12"},
      {"label": "13", "value": "13"},
      {"label": "14", "value": "14"},
      {"label": "15", "value": "15"},
      {"label": "16", "value": "16"},
      {"label": "17", "value": "17"},
      {"label": "18", "value": "18"},
      {"label": "19", "value": "19"},
      {"label": "20", "value": "20"},
      {"label": "21", "value": "21"},
      {"label": "22", "value": "22"},
      {"label": "23", "value": "23"},
      {"label": "24", "value": "24"},
      {"label": "25", "value": "25"}
    ]'::jsonb
  WHERE use_case_id = v_hotel_id AND field_name = 'elevatorCount';

  IF NOT FOUND THEN
    RAISE NOTICE '⚠️ elevatorCount question not found - it may need to be created first';
  ELSE
    RAISE NOTICE '✅ Updated elevatorCount question to scale 1-25 with button options';
  END IF;

END $$;

