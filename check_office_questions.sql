-- Quick check: Count current office questions
SELECT COUNT(*) as question_count, use_case_id 
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
GROUP BY use_case_id;

-- Show all office questions ordered by display_order
SELECT 
  display_order,
  field_name,
  question_text,
  question_type,
  is_required
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
ORDER BY display_order;
