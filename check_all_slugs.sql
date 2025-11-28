-- Check all use case slugs in database
SELECT slug, name, category, is_active 
FROM use_cases 
ORDER BY display_order, name;
