-- ================================================================
-- FIX: Add missing columns to use_case_configurations
-- ================================================================
-- Run this BEFORE the calculation_formulas script
-- ================================================================

-- Add missing columns to use_case_configurations if they don't exist
DO $$ 
BEGIN
    -- Add category column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'use_case_configurations' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE use_case_configurations 
        ADD COLUMN category VARCHAR(50);
        RAISE NOTICE '✅ Added category column';
    END IF;

    -- Add industry_standard_reference column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'use_case_configurations' 
        AND column_name = 'industry_standard_reference'
    ) THEN
        ALTER TABLE use_case_configurations 
        ADD COLUMN industry_standard_reference TEXT;
        RAISE NOTICE '✅ Added industry_standard_reference column';
    END IF;

    -- Add version column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'use_case_configurations' 
        AND column_name = 'version'
    ) THEN
        ALTER TABLE use_case_configurations 
        ADD COLUMN version VARCHAR(20) DEFAULT '1.0';
        RAISE NOTICE '✅ Added version column';
    END IF;
END $$;

RAISE NOTICE '✅ All missing columns checked/added to use_case_configurations';
RAISE NOTICE '📝 Now you can run the calculation_formulas script';
