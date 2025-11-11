-- Quick check: What tables actually exist?
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Count them
SELECT 
    COUNT(*) as table_count,
    'Expected: 28 tables' as expected
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
