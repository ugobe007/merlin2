-- ============================================================================
-- ADD BRAND/CHAIN SELECTION QUESTIONS
-- December 26, 2025
-- 
-- Adds brand/chain selection question to relevant use cases:
-- - Car Wash (El Car Wash, Tommy's Express, etc.)
-- - Hotel (Hilton, Marriott, Hyatt, etc.)
-- 
-- Brand selection appears early (display_order: 0.1) to allow pre-loading
-- equipment defaults before other questions.
-- ============================================================================

-- Helper function to upsert brand question
CREATE OR REPLACE FUNCTION upsert_brand_question(
  p_slug TEXT,
  p_options JSONB
) RETURNS VOID AS $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = p_slug LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE NOTICE 'Use case % not found, skipping', p_slug;
    RETURN;
  END IF;
  
  -- Delete existing brand question if it exists
  DELETE FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name = 'brand';
  
  -- Insert brand selection question (early display order for pre-loading)
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  ) VALUES (
    v_use_case_id, 
    'Brand/Chain Selection (Optional)',
    'brand',
    'select',
    NULL,
    false,
    'Select your brand/chain to pre-load equipment defaults. You can still customize all values.',
    0.1,
    p_options
  );
  
  RAISE NOTICE 'Added brand question to %', p_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CAR WASH - Brand Selection
-- ============================================================================

SELECT upsert_brand_question(
  'car-wash',
  '[
    {"label": "El Car Wash", "value": "el-car-wash"},
    {"label": "Tommy''s Express Car Wash", "value": "tommys-express"},
    {"label": "Other / Independent", "value": "other"}
  ]'::jsonb
);

-- ============================================================================
-- HOTEL - Brand Selection
-- ============================================================================

SELECT upsert_brand_question(
  'hotel',
  '[
    {"label": "Hilton", "value": "hilton"},
    {"label": "Marriott", "value": "marriott"},
    {"label": "Hyatt", "value": "hyatt"},
    {"label": "Holiday Inn", "value": "holiday-inn"},
    {"label": "Best Western", "value": "best-western"},
    {"label": "Other / Independent", "value": "other"}
  ]'::jsonb
);

-- Note: Helper function is dropped automatically after use
-- (It's a temporary function within the migration)

