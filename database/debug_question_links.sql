-- Debug: Check if use_case_id foreign keys are correct
-- This will show if custom_questions are linked to the right use_cases

SELECT 
    cq.id as question_id,
    cq.use_case_id,
    uc.slug as use_case_slug,
    uc.name as use_case_name,
    cq.field_name,
    cq.question_text,
    cq.display_order
FROM custom_questions cq
LEFT JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug IN ('airport', 'car-wash', 'hospital', 'college', 'casino', 
                   'cold-storage', 'indoor-farm', 'warehouse', 'government', 
                   'gas-station', 'apartment')
ORDER BY uc.slug, cq.display_order;
