-- ============================================================================
-- ADD ROOFTOP SQUARE FOOTAGE QUESTIONS (Building-Based Use Cases)
-- December 26, 2025
-- 
-- Adds rooftop square footage questions to building-based use cases.
-- This is critical for solar panel sizing.
-- 
-- Questions:
-- - totalFacilitySquareFootage: Total building/canopy square footage
-- - rooftopSquareFootage: Main building rooftop square footage (for solar)
-- 
-- Use Cases:
-- - Car Wash (building + canopy)
-- - Hotel
-- - Office Building
-- - Retail
-- - Warehouse
-- ============================================================================

-- Helper function to upsert rooftop square footage questions
CREATE OR REPLACE FUNCTION upsert_rooftop_sqft_questions(
  p_slug TEXT,
  p_display_order NUMERIC
) RETURNS VOID AS $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = p_slug LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE NOTICE 'Use case % not found, skipping', p_slug;
    RETURN;
  END IF;
  
  -- Delete existing rooftop square footage questions if they exist
  DELETE FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name IN ('totalFacilitySquareFootage', 'rooftopSquareFootage');
  
  -- Total facility square footage
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
  ) VALUES (
    v_use_case_id, 
    'Total Facility Square Footage',
    'totalFacilitySquareFootage',
    'number',
    NULL,
    1000,
    500000,
    false,
    'Total square footage including all buildings, canopies, and structures',
    p_display_order
  );
  
  -- Rooftop square footage (for solar sizing)
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
  ) VALUES (
    v_use_case_id, 
    'Rooftop Square Footage (Main Building)',
    'rooftopSquareFootage',
    'number',
    NULL,
    500,
    1000000,
    false,
    'Usable rooftop area on main building for solar panels. Typically 50-70% of total roof area is usable.',
    p_display_order + 0.1
  );
  
  RAISE NOTICE 'Added rooftop square footage questions to %', p_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- APPLY TO BUILDING-BASED USE CASES
-- ============================================================================

-- Car Wash (display_order: 1.5 - after operating hours)
SELECT upsert_rooftop_sqft_questions('car-wash', 1.5);

-- Hotel (display_order: 1.5)
SELECT upsert_rooftop_sqft_questions('hotel', 1.5);

-- Office Building (display_order: 1.5)
SELECT upsert_rooftop_sqft_questions('office', 1.5);
SELECT upsert_rooftop_sqft_questions('office-building', 1.5);

-- Retail (display_order: 1.5)
SELECT upsert_rooftop_sqft_questions('retail', 1.5);

-- Warehouse (display_order: 1.5)
SELECT upsert_rooftop_sqft_questions('warehouse', 1.5);

-- Clean up helper function
DROP FUNCTION IF EXISTS upsert_rooftop_sqft_questions(TEXT, NUMERIC);

