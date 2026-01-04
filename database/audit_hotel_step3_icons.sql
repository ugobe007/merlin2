-- Audit hotel Step3HotelEnergy icons
-- Check what icons are in the database for hotel questions

SELECT 
  field_name,
  question_text,
  question_type,
  jsonb_array_elements(options) as option_detail
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel' LIMIT 1)
  AND field_name IN (
    'meetingSpace',
    'parkingType',
    'exteriorLoads',
    'poolType',
    'fitnessCenter',
    'spaServices',
    'foodBeverage',
    'laundryType'
  )
  AND question_type IN ('select', 'multiselect')
ORDER BY field_name, display_order;
