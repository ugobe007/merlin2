-- ============================================================================
-- ADD OPERATING HOURS TO DATA CENTER
-- December 12, 2025
-- 
-- Add operating hours question to data center use case (between question 12 and 13)
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_existing_count INT;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'data-center' LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE EXCEPTION 'Data center use case not found!';
  END IF;
  
  -- Check if question already exists
  SELECT COUNT(*) INTO v_existing_count 
  FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name = 'operatingHours';
  
  IF v_existing_count > 0 THEN
    RAISE NOTICE 'Operating hours question already exists for data center, skipping';
    RETURN;
  END IF;
  
  -- Shift existing questions 13+ up by 1 to make room
  UPDATE custom_questions 
  SET display_order = display_order + 1 
  WHERE use_case_id = v_use_case_id AND display_order >= 13;
  
  -- Insert new operating hours question at position 13
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Operating hours', 'operatingHours', 'select', '24_7', true, 'Data center operational schedule', 13,
    '[
      {"label": "24/7 Operations - Continuous uptime", "value": "24_7"}
    ]'::jsonb);
  
  RAISE NOTICE 'Successfully added operating hours question to data center';
END $$;
