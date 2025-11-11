-- ================================================================
-- ADD MISSING COLUMNS TO calculation_formulas
-- ================================================================
-- Run this to add the missing columns
-- ================================================================

-- Add variables column (JSONB)
ALTER TABLE calculation_formulas 
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}'::jsonb;

-- Add category column
ALTER TABLE calculation_formulas 
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Add industry_standard_reference column
ALTER TABLE calculation_formulas 
ADD COLUMN IF NOT EXISTS industry_standard_reference TEXT;

-- Add version column
ALTER TABLE calculation_formulas 
ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0';

-- Add is_active column
ALTER TABLE calculation_formulas 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add timestamps if missing
ALTER TABLE calculation_formulas 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE calculation_formulas 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add notes column
ALTER TABLE calculation_formulas 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'calculation_formulas'
ORDER BY ordinal_position;
