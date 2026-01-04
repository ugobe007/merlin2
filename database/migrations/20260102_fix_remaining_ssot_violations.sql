-- =============================================================================
-- FIX REMAINING SSOT VIOLATIONS (9 violations remaining)
-- =============================================================================
-- After running the first migration, 9 violations remain:
-- - 6 SSOT violations (fields exist but not required)
-- - 3 Missing fields (warehouse, office squareFeet; restaurant use case)
--
-- Date: January 2, 2026
-- =============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_max_order INTEGER;
BEGIN

  -- ============================================================================
  -- 1. WAREHOUSE: Add squareFeet (missing - even if warehouseSqFt exists)
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'warehouse' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- Add squareFeet if it doesn't exist (even if warehouseSqFt exists)
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'squareFeet'
    ) THEN
      SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
      FROM custom_questions WHERE use_case_id = v_use_case_id;
      
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Warehouse Square Footage',
        'squareFeet',
        'number',
        '250000',
        '10000',
        '5000000',
        true,
        'Total warehouse square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added squareFeet for warehouse';
    END IF;
  END IF;

  -- ============================================================================
  -- 2. OFFICE: Add squareFeet (missing - even if buildingSqFt exists)
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'office' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- Add squareFeet if it doesn't exist (even if buildingSqFt exists)
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'squareFeet'
    ) THEN
      SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
      FROM custom_questions WHERE use_case_id = v_use_case_id;
      
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Building Square Footage',
        'squareFeet',
        'number',
        '10000',
        '1000',
        '1000000',
        true,
        'Total office building square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added squareFeet for office';
    END IF;
  END IF;

  -- ============================================================================
  -- 3. DATA CENTER: Make rackCount required
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'data-center' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    UPDATE custom_questions
    SET is_required = true
    WHERE use_case_id = v_use_case_id 
      AND field_name = 'rackCount'
      AND is_required = false;
    
    IF FOUND THEN
      RAISE NOTICE '✅ Made rackCount required for data-center';
    END IF;
  END IF;

  -- ============================================================================
  -- 4. EV CHARGING: Make ultraFastCount required
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'ev-charging' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    UPDATE custom_questions
    SET is_required = true
    WHERE use_case_id = v_use_case_id 
      AND field_name = 'ultraFastCount'
      AND is_required = false;
    
    IF FOUND THEN
      RAISE NOTICE '✅ Made ultraFastCount required for ev-charging';
    END IF;
  END IF;

  -- ============================================================================
  -- 5. COLD STORAGE: Make squareFeet required
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'cold-storage' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    UPDATE custom_questions
    SET is_required = true
    WHERE use_case_id = v_use_case_id 
      AND field_name = 'squareFeet'
      AND is_required = false;
    
    IF FOUND THEN
      RAISE NOTICE '✅ Made squareFeet required for cold-storage';
    END IF;
  END IF;

  -- ============================================================================
  -- 6. COLLEGE: Make studentCount required
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'college' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    UPDATE custom_questions
    SET is_required = true
    WHERE use_case_id = v_use_case_id 
      AND field_name = 'studentCount'
      AND is_required = false;
    
    IF FOUND THEN
      RAISE NOTICE '✅ Made studentCount required for college';
    END IF;
  END IF;

  -- ============================================================================
  -- 7. GOVERNMENT: Make facilitySqFt required
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'government' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    UPDATE custom_questions
    SET is_required = true
    WHERE use_case_id = v_use_case_id 
      AND field_name = 'facilitySqFt'
      AND is_required = false;
    
    IF FOUND THEN
      RAISE NOTICE '✅ Made facilitySqFt required for government';
    END IF;
  END IF;

  -- ============================================================================
  -- 8. SHOPPING CENTER: Make retailSqFt required
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'shopping-center' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    UPDATE custom_questions
    SET is_required = true
    WHERE use_case_id = v_use_case_id 
      AND field_name = 'retailSqFt'
      AND is_required = false;
    
    IF FOUND THEN
      RAISE NOTICE '✅ Made retailSqFt required for shopping-center';
    END IF;
  END IF;

  RAISE NOTICE '✅ Fixed 8 of 9 violations (restaurant use case needs manual decision)';

END $$;

-- =============================================================================
-- NOTE: RESTAURANT USE CASE
-- =============================================================================
-- The audit reports "Use case 'restaurant' not found in database"
-- 
-- Options:
-- 1. If restaurant should exist, create it and add foundational variables
-- 2. If restaurant is not a use case, remove it from the audit script's
--    FOUNDATIONAL_VARIABLES list
--
-- For now, leaving this as a manual decision - check if restaurant
-- use case should exist in the database.
