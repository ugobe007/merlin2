-- Step 1: Verify table exists and which schema it's in
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'scraped_articles';

-- Step 2: Check column names (to verify 'content' exists)
SELECT 
  table_schema,
  column_name, 
  data_type,
  ordinal_position
FROM information_schema.columns
WHERE table_name = 'scraped_articles'
ORDER BY ordinal_position;

-- Step 3: Force PostgREST to reload schema multiple ways
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Step 4: Check if the table is exposed via the API schema
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'scraped_articles'
) AS table_in_public_schema;

-- Step 5: Grant permissions to ensure PostgREST can see it
GRANT ALL ON TABLE scraped_articles TO postgres;
GRANT ALL ON TABLE scraped_articles TO service_role;
GRANT SELECT ON TABLE scraped_articles TO anon;
GRANT SELECT ON TABLE scraped_articles TO authenticated;
