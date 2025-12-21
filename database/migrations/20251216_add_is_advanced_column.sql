-- =============================================================================
-- ADD is_advanced COLUMN TO custom_questions TABLE
-- December 16, 2025
-- 
-- This column marks questions as "advanced" for collapsible sections in the UI
-- Standard questions (is_advanced = false): Always visible (1-16)
-- Advanced questions (is_advanced = true): Hidden in collapsible "Additional Details" section (17+)
-- =============================================================================

-- Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_questions' 
        AND column_name = 'is_advanced'
    ) THEN
        ALTER TABLE custom_questions 
        ADD COLUMN is_advanced BOOLEAN DEFAULT false NOT NULL;
        
        -- Add comment
        COMMENT ON COLUMN custom_questions.is_advanced IS 
        'Marks questions as advanced for collapsible "Additional Details" section in Step 3 UI. Standard questions (false) are always visible. Advanced questions (true) are hidden by default in a collapsible section.';
        
        RAISE NOTICE '✅ Added is_advanced column to custom_questions table';
    ELSE
        RAISE NOTICE 'ℹ️  Column is_advanced already exists';
    END IF;
END $$;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_custom_questions_is_advanced 
ON custom_questions(use_case_id, is_advanced, display_order);

-- Set default for existing rows (all false = standard)
UPDATE custom_questions 
SET is_advanced = false 
WHERE is_advanced IS NULL;

