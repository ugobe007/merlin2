-- =============================================================================
-- FIX ALL SSOT & TRUEQUOTE VIOLATIONS
-- =============================================================================
-- Based on audit results, fixing all 20 critical violations:
-- - 16 missing foundational variables
-- - 4 SSOT violations (required flags, defaults)
-- - 1 TrueQuote mapping issue
--
-- IMPORTANT: Default values are for UI initialization only, NOT SSOT.
-- The database (user-provided values) is the Single Source of Truth.
--
-- Date: January 2, 2026
-- =============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_max_order INTEGER;
BEGIN

  -- ============================================================================
  -- 1. EV CHARGING: ultraFastCount
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'ev-charging' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'ultraFastCount'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Ultra-Fast Chargers (150-350+ kW)',
        'ultraFastCount',
        'number',
        '0',
        '0',
        '50',
        false,
        'Number of ultra-fast charging stations',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added ultraFastCount for ev-charging';
    END IF;
    
    -- Make dcFastCount required
    UPDATE custom_questions
    SET is_required = true
    WHERE use_case_id = v_use_case_id 
      AND field_name = 'dcFastCount'
      AND is_required = false;
  END IF;

  -- ============================================================================
  -- 2. WAREHOUSE: squareFeet (alternative to warehouseSqFt)
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'warehouse' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- Check if warehouseSqFt exists, if not add squareFeet
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name IN ('warehouseSqFt', 'squareFeet')
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
  -- 3. MANUFACTURING: squareFeet (alternative to facilitySqFt)
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'manufacturing' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
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
        'Facility Square Footage',
        'squareFeet',
        'number',
        '50000',
        '5000',
        '1000000',
        true,
        'Total manufacturing facility square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added squareFeet for manufacturing';
    END IF;
  END IF;

  -- ============================================================================
  -- 4. RETAIL: squareFeet (alternative to storeSqFt)
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'retail' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
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
        'Store Square Footage',
        'squareFeet',
        'number',
        '5000',
        '1000',
        '500000',
        true,
        'Total retail store square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added squareFeet for retail';
    END IF;
  END IF;

  -- ============================================================================
  -- 5. OFFICE: squareFeet (alternative to buildingSqFt)
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'office' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name IN ('buildingSqFt', 'squareFeet')
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
  -- 6. COLD STORAGE: storageVolume, squareFeet
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'cold-storage' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- storageVolume
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'storageVolume'
    ) THEN
      SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
      FROM custom_questions WHERE use_case_id = v_use_case_id;
      
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Storage Volume (cubic feet)',
        'storageVolume',
        'number',
        '1000000',
        '100000',
        '50000000',
        true,
        'Total cold storage volume in cubic feet',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added storageVolume for cold-storage';
    END IF;
    
    -- squareFeet (alternative)
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'squareFeet'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Facility Square Footage',
        'squareFeet',
        'number',
        '50000',
        '10000',
        '1000000',
        false,
        'Alternative: Total facility square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added squareFeet for cold-storage';
    END IF;
  END IF;

  -- ============================================================================
  -- 7. CASINO: gamingFloorSize
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'casino' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'gamingFloorSize'
    ) THEN
      SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
      FROM custom_questions WHERE use_case_id = v_use_case_id;
      
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Gaming Floor Size (square feet)',
        'gamingFloorSize',
        'number',
        '50000',
        '10000',
        '500000',
        true,
        'Total gaming floor square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added gamingFloorSize for casino';
    END IF;
    
    -- Add default_value to gamingFloorSqFt if missing
    UPDATE custom_questions
    SET default_value = '50000'
    WHERE use_case_id = v_use_case_id 
      AND field_name = 'gamingFloorSqFt'
      AND default_value IS NULL;
  END IF;

  -- ============================================================================
  -- 8. COLLEGE: studentEnrollment, studentCount
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'college' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- studentEnrollment
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'studentEnrollment'
    ) THEN
      SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
      FROM custom_questions WHERE use_case_id = v_use_case_id;
      
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Student Enrollment',
        'studentEnrollment',
        'number',
        '10000',
        '500',
        '100000',
        true,
        'Total student enrollment',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added studentEnrollment for college';
    END IF;
    
    -- studentCount (alternative name)
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'studentCount'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Student Count',
        'studentCount',
        'number',
        '10000',
        '500',
        '100000',
        false,
        'Alternative: Total student count',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added studentCount for college';
    END IF;
  END IF;

  -- ============================================================================
  -- 9. GOVERNMENT: buildingSqFt, facilitySqFt
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'government' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- buildingSqFt
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'buildingSqFt'
    ) THEN
      SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
      FROM custom_questions WHERE use_case_id = v_use_case_id;
      
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Building Square Footage',
        'buildingSqFt',
        'number',
        '50000',
        '5000',
        '1000000',
        true,
        'Total government building square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added buildingSqFt for government';
    END IF;
    
    -- facilitySqFt (alternative)
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'facilitySqFt'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Facility Square Footage',
        'facilitySqFt',
        'number',
        '50000',
        '5000',
        '1000000',
        false,
        'Alternative: Total facility square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added facilitySqFt for government';
    END IF;
  END IF;

  -- ============================================================================
  -- 10. SHOPPING CENTER: totalSqFt, retailSqFt
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'shopping-center' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- totalSqFt
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'totalSqFt'
    ) THEN
      SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
      FROM custom_questions WHERE use_case_id = v_use_case_id;
      
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Total Square Footage',
        'totalSqFt',
        'number',
        '500000',
        '50000',
        '5000000',
        true,
        'Total shopping center square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added totalSqFt for shopping-center';
    END IF;
    
    -- retailSqFt (alternative)
    SELECT COALESCE(MAX(display_order), 0) INTO v_max_order
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM custom_questions 
      WHERE use_case_id = v_use_case_id AND field_name = 'retailSqFt'
    ) THEN
      INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
      ) VALUES (
        v_use_case_id,
        'Retail Square Footage',
        'retailSqFt',
        'number',
        '400000',
        '40000',
        '4000000',
        false,
        'Alternative: Retail space square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added retailSqFt for shopping-center';
    END IF;
  END IF;

  -- ============================================================================
  -- 11. INDOOR FARM: squareFeet, add default to growingAreaSqFt
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'indoor-farm' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- squareFeet
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
        'Growing Area Square Footage',
        'squareFeet',
        'number',
        '10000',
        '1000',
        '500000',
        true,
        'Total indoor growing area square footage',
        v_max_order + 1
      );
      RAISE NOTICE '✅ Added squareFeet for indoor-farm';
    END IF;
    
    -- Add default_value to growingAreaSqFt if missing
    UPDATE custom_questions
    SET default_value = '10000'
    WHERE use_case_id = v_use_case_id 
      AND field_name = 'growingAreaSqFt'
      AND default_value IS NULL;
  END IF;

  -- ============================================================================
  -- 12. CAR WASH: Make tunnelCount required (if it exists)
  -- Note: This might be optional if bayCount is primary - audit says required
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'car-wash' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- Make tunnelCount required if it exists
    UPDATE custom_questions
    SET is_required = true
    WHERE use_case_id = v_use_case_id 
      AND field_name = 'tunnelCount'
      AND is_required = false;
      
    -- Note: tunnelCount might legitimately be optional if bayCount is primary
    -- But audit flags it - verify if this makes sense for car wash business logic
  END IF;

  -- ============================================================================
  -- 13. DATA CENTER: Make rackCount required
  -- Note: This is alternative to itLoadKW - might need to reconsider
  -- ============================================================================
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'data-center' LIMIT 1;
  
  IF v_use_case_id IS NOT NULL THEN
    -- Make rackCount required if it exists
    -- But note: data-center can use EITHER rackCount OR itLoadKW
    -- So making both required might not make sense
    -- Leaving this as-is for now - need business logic clarification
  END IF;

END $$;

-- =============================================================================
-- FINAL NOTES
-- =============================================================================
-- 1. Apartment TrueQuote mapping: Apartment uses 'unitCount' in database
--    but TrueQuote Engine expects 'rooms'. This needs a code fix in
--    Step5MagicFit.tsx to map unitCount → roomCount for TrueQuote Engine.
-- 
-- 2. tunnelCount/rackCount: These are marked as required by audit, but
--    they might legitimately be optional (e.g., data-center can use
--    EITHER rackCount OR itLoadKW). Verify business logic.
--
-- 3. Restaurant use case: Audit reports it's missing. If it exists,
--    add foundational variables. If not, remove from audit script.
