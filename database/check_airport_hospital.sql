-- Check Airport and Hospital questions specifically
SELECT 
    uc.slug,
    uc.name,
    cq.question_text,
    cq.field_name,
    cq.question_type,
    cq.is_required,
    cq.display_order,
    cq.created_at
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
WHERE uc.slug IN ('airport', 'hospital')
ORDER BY uc.slug, cq.display_order;
