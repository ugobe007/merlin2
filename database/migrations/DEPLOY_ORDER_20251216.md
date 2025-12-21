# Question Standardization Migration Order

## Execute These Migrations in Order:

1. **`20251216_add_is_advanced_column.sql`**
   - Adds `is_advanced` column to `custom_questions` table
   - Run this FIRST

2. **`20251216_FIX_advanced_and_missing_questions.sql`**
   - Adds missing questions (cold-storage, college, office)
   - Marks advanced questions correctly for all use cases
   - Run this SECOND

3. **Optional: `20251216_standardize_questions_to_16.sql`**
   - More comprehensive migration (includes original standardization)
   - Only run if the fix migration above doesn't work

## Expected Final Results:

- ✅ All use cases: 16-18 standard questions
- ✅ Data-center: 18 standard, 3 advanced (21 total)
- ✅ Hospital: 18 standard, 4 advanced (22 total)
- ✅ Manufacturing: 18 standard, 3 advanced (21 total)
- ✅ Warehouse: 18 standard, 1 advanced (19 total)
- ✅ 18-question use cases: 16 standard, 2 advanced (18 total)
- ✅ 16-question use cases: 16 standard, 0 advanced (16 total)

## Verification:

Run this SQL to verify:
```sql
SELECT 
    uc.slug,
    COUNT(CASE WHEN cq.is_advanced = false THEN 1 END) as standard,
    COUNT(CASE WHEN cq.is_advanced = true THEN 1 END) as advanced,
    COUNT(cq.id) as total
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug
ORDER BY uc.slug;
```

