-- Migration: Update restaurant seatCount to use range_buttons instead of number input
-- Date: January 14, 2026
-- Purpose: Make it easier for users to select seat count with range buttons

-- Update the seatCount question for restaurant to use range_buttons
UPDATE custom_questions
SET 
  question_type = 'range_buttons',
  options = '[
    {"label": "1-25", "min": 1, "max": 25, "description": "Small café/counter"},
    {"label": "25-50", "min": 25, "max": 50, "description": "Small restaurant"},
    {"label": "50-100", "min": 50, "max": 100, "description": "Medium restaurant"},
    {"label": "100-200", "min": 100, "max": 200, "description": "Large restaurant"},
    {"label": "200-300", "min": 200, "max": 300, "description": "Very large/banquet"}
  ]'::jsonb
WHERE field_name = 'seatCount'
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'restaurant');

-- Verify the change
SELECT 
  field_name, 
  question_type, 
  options,
  question_text
FROM custom_questions 
WHERE field_name = 'seatCount'
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'restaurant');
