-- Verify Office Building questions in database
-- Check what questions exist for the office use case

SELECT 
  field_name,
  question_text,
  question_type,
  is_required,
  display_order,
  options
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
ORDER BY display_order;
