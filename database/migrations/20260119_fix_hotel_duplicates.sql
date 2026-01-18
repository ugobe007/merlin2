-- Fix remaining hotel duplicates (same display_order edge case)
-- These have identical display_order so the < comparison didn't catch them

-- Delete the generic field names, keep the more specific ones
DELETE FROM custom_questions 
WHERE field_name IN ('existingGeneration', 'solarSpaceAvailable')
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- Verify
SELECT field_name, question_text, display_order
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
AND field_name IN ('existingInfrastructure', 'existingGeneration', 'solarSpace', 'solarSpaceAvailable')
ORDER BY display_order;
