-- Emergency Fix: Remove conflicting questions from Office Building
-- These questions override the new Solar/EV Configuration UI

BEGIN;

-- Get office use case ID
DO $$
DECLARE
  office_id UUID;
BEGIN
  SELECT id INTO office_id FROM use_cases WHERE slug = 'office';
  
  -- Remove solar questions
  DELETE FROM custom_questions 
  WHERE use_case_id = office_id
  AND (
    question_text ILIKE '%solar%'
    OR field_name ILIKE '%solar%'
  );
  
  -- Remove generator questions
  DELETE FROM custom_questions 
  WHERE use_case_id = office_id
  AND (
    question_text ILIKE '%generator%'
    OR field_name ILIKE '%generator%'
  );
  
  -- Remove EV/charging questions
  DELETE FROM custom_questions 
  WHERE use_case_id = office_id
  AND (
    question_text ILIKE '%ev%'
    OR question_text ILIKE '%charging%'
    OR question_text ILIKE '%electric vehicle%'
    OR field_name ILIKE '%ev%'
    OR field_name ILIKE '%charg%'
  );
  
  RAISE NOTICE 'Removed conflicting questions from Office Building use case';
END $$;

COMMIT;

-- Verify remaining questions
SELECT 
  id,
  use_case_id,
  question_text,
  field_name,
  question_type,
  display_order
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
ORDER BY display_order;
