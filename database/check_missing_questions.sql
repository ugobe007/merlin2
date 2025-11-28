-- Check which use cases are missing custom questions
SELECT 
    uc.slug,
    uc.name,
    COUNT(cq.id) as question_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
GROUP BY uc.slug, uc.name
ORDER BY question_count ASC, uc.name;
