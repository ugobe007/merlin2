-- Check the existing table structure and constraints
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'use_cases'
ORDER BY ordinal_position;

-- Check constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'use_cases'::regclass;
