-- ================================================================
-- CHECK EXISTING TABLE STRUCTURE
-- ================================================================
-- Run this first to see what columns exist
-- ================================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'calculation_formulas'
ORDER BY ordinal_position;
