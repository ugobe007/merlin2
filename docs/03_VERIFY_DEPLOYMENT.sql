-- =============================================================================
-- STEP 3: VERIFY DEPLOYMENT - Check everything was created correctly
-- =============================================================================
-- Run this after deploying 02_DEPLOY_SCHEMA.sql
-- =============================================================================

-- Count all tables created
SELECT 
    COUNT(*) as total_tables,
    'Expected: 28 tables' as expected
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';

-- List all tables with column counts
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND information_schema.columns.table_name = tables.table_name) as column_count
FROM information_schema.tables tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check pricing configurations
SELECT 
    config_key,
    config_category,
    is_active,
    data_source,
    confidence_level
FROM pricing_configurations
ORDER BY config_category;

-- Check calculation formulas
SELECT 
    formula_key,
    formula_name,
    formula_category,
    validation_status
FROM calculation_formulas
ORDER BY formula_category;

-- Check system config
SELECT 
    config_key,
    config_type,
    description
FROM system_config
ORDER BY config_type, config_key;

-- Check RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check triggers
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Final summary
DO $$
DECLARE
    table_count INTEGER;
    config_count INTEGER;
    formula_count INTEGER;
    policy_count INTEGER;
    trigger_count INTEGER;
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    SELECT COUNT(*) INTO config_count FROM pricing_configurations;
    SELECT COUNT(*) INTO formula_count FROM calculation_formulas;
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
    
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DEPLOYMENT VERIFICATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: % (expected: 28)', table_count;
    RAISE NOTICE 'Pricing configurations: % (expected: 3)', config_count;
    RAISE NOTICE 'Calculation formulas: % (expected: 3)', formula_count;
    RAISE NOTICE 'RLS policies: % (expected: 7)', policy_count;
    RAISE NOTICE 'Triggers: % (expected: 12)', trigger_count;
    RAISE NOTICE 'Indexes: % (expected: 30+)', index_count;
    RAISE NOTICE '========================================';
    
    IF table_count = 28 AND config_count = 3 AND formula_count = 3 THEN
        RAISE NOTICE '🎉 SUCCESS! Database is ready for use!';
    ELSE
        RAISE WARNING '⚠️  Some objects may be missing. Review output above.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
