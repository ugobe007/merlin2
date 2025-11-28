-- Check use_cases table
SELECT id, name, category, is_active 
FROM use_cases 
WHERE id IN ('office', 'datacenter', 'hotel', 'manufacturing', 'ev-charging')
ORDER BY category, name;
