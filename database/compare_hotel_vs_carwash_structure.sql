-- Compare hotel vs car wash question structure
SELECT 
  'hotel' as use_case,
  field_name,
  question_type,
  jsonb_typeof(options) as options_type,
  CASE 
    WHEN jsonb_typeof(options) = 'array' THEN jsonb_array_length(options)
    ELSE NULL
  END as option_count,
  jsonb_pretty(jsonb_array_elements(options)::jsonb) as sample_option
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel' LIMIT 1)
  AND field_name = 'hotelCategory'
  AND question_type = 'select'
LIMIT 1;

SELECT 
  'car_wash' as use_case,
  field_name,
  question_type,
  jsonb_typeof(options) as options_type,
  CASE 
    WHEN jsonb_typeof(options) = 'array' THEN jsonb_array_length(options)
    ELSE NULL
  END as option_count,
  jsonb_pretty(jsonb_array_elements(options)::jsonb) as sample_option
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'car_wash' LIMIT 1)
  AND field_name = 'carWashType'
  AND question_type = 'select'
LIMIT 1;
