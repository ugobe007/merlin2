-- ============================================================================
-- Migration: Add Missing Columns for Step 3 Template Loading
-- Date: January 24, 2026
-- Purpose: Fix "column does not exist" errors blocking Step 3 completion
-- ============================================================================

-- 1. Add load_priority to configuration_equipment (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'configuration_equipment' 
    AND column_name = 'load_priority'
  ) THEN
    ALTER TABLE configuration_equipment ADD COLUMN load_priority INTEGER DEFAULT 0;
    COMMENT ON COLUMN configuration_equipment.load_priority IS 'Equipment priority for load shedding (higher = more important)';
    RAISE NOTICE '✅ Added load_priority column to configuration_equipment';
  ELSE
    RAISE NOTICE '⏭️ load_priority already exists in configuration_equipment';
  END IF;
END $$;

-- 2. Add is_active to pricing_scenarios (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pricing_scenarios' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE pricing_scenarios ADD COLUMN is_active BOOLEAN DEFAULT true;
    COMMENT ON COLUMN pricing_scenarios.is_active IS 'Whether this pricing scenario is active';
    RAISE NOTICE '✅ Added is_active column to pricing_scenarios';
  ELSE
    RAISE NOTICE '⏭️ is_active already exists in pricing_scenarios';
  END IF;
END $$;

-- 3. Check if recommended_applications table exists and add is_active if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'recommended_applications'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'recommended_applications' 
      AND column_name = 'is_active'
    ) THEN
      ALTER TABLE recommended_applications ADD COLUMN is_active BOOLEAN DEFAULT true;
      RAISE NOTICE '✅ Added is_active column to recommended_applications';
    ELSE
      RAISE NOTICE '⏭️ is_active already exists in recommended_applications';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ recommended_applications table does not exist';
  END IF;
END $$;

-- ============================================================================
-- VALIDATION
-- ============================================================================
SELECT 
  'configuration_equipment' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'configuration_equipment' 
AND column_name IN ('load_priority', 'id', 'configuration_id')
UNION ALL
SELECT 
  'pricing_scenarios' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'pricing_scenarios' 
AND column_name IN ('is_active', 'id', 'configuration_id')
ORDER BY table_name, column_name;
