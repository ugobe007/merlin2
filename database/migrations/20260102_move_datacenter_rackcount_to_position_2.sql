-- ============================================================================
-- MOVE DATA CENTER "NUMBER OF SERVER RACKS" TO POSITION 2
-- January 2, 2026
-- 
-- Move the "Number of server racks" question (rackCount) to position 2
-- and ensure it's labeled as "Server racks"
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_current_order INT;
BEGIN
  -- Get data center use case ID
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'data-center' LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE EXCEPTION 'Data center use case not found!';
  END IF;
  
  -- Get current display_order of rackCount question
  SELECT display_order INTO v_current_order 
  FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name = 'rackCount';
  
  IF v_current_order IS NULL THEN
    RAISE NOTICE 'rackCount question not found, skipping';
    RETURN;
  END IF;
  
  -- If already at position 2, just update the label if needed
  IF v_current_order = 2 THEN
    UPDATE custom_questions 
    SET question_text = 'Server racks'
    WHERE use_case_id = v_use_case_id AND field_name = 'rackCount';
    RAISE NOTICE 'rackCount already at position 2, updated label to "Server racks"';
    RETURN;
  END IF;
  
  -- Shift questions that are currently at position 2 and above (but below rackCount) down by 1
  UPDATE custom_questions 
  SET display_order = display_order + 1 
  WHERE use_case_id = v_use_case_id 
    AND display_order >= 2 
    AND display_order < v_current_order;
  
  -- Move rackCount to position 2
  UPDATE custom_questions 
  SET display_order = 2,
      question_text = 'Server racks'
  WHERE use_case_id = v_use_case_id AND field_name = 'rackCount';
  
  RAISE NOTICE 'Successfully moved rackCount to position 2 and updated label to "Server racks"';
END $$;
