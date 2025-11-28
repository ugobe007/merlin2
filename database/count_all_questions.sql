-- Count questions for all use cases
SELECT 
    uc.slug,
    uc.name,
    COUNT(cq.id) as question_count,
    STRING_AGG(cq.field_name, ', ' ORDER BY cq.display_order) as field_names
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
GROUP BY uc.slug, uc.name
ORDER BY question_count ASC, uc.name;
