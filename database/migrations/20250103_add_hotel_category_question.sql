-- =============================================================================
-- ADD HOTEL CATEGORY QUESTION TO HOTEL USE CASES
-- =============================================================================
-- This migration adds a comprehensive hotel category question that includes
-- star ratings (1-5), boutique, and non-classified hotel options with
-- detailed descriptions.
--
-- Date: January 3, 2025
-- =============================================================================

DO $$
DECLARE
  v_hotel_id UUID;
  v_max_display_order INTEGER;
BEGIN
  -- Get hotel use case ID
  SELECT id INTO v_hotel_id 
  FROM use_cases 
  WHERE slug = 'hotel' 
  LIMIT 1;

  -- If hotel use case doesn't exist, skip
  IF v_hotel_id IS NULL THEN
    RAISE NOTICE 'Hotel use case not found. Skipping migration.';
    RETURN;
  END IF;

  -- Get current max display_order for hotel questions
  SELECT COALESCE(MAX(display_order), 0) INTO v_max_display_order
  FROM custom_questions
  WHERE use_case_id = v_hotel_id;

  -- Remove old hotelCategory, hotelClass, hotelType, or hotelClassification questions if they exist
  DELETE FROM custom_questions 
  WHERE use_case_id = v_hotel_id 
  AND field_name IN ('hotelCategory', 'hotelClass', 'hotelType', 'hotelClassification');

  -- Insert new hotel category question
  -- Position it right after roomCount (display_order = 2)
  INSERT INTO custom_questions (
    use_case_id,
    question_text,
    field_name,
    question_type,
    default_value,
    is_required,
    help_text,
    display_order,
    options
  )
  VALUES (
    v_hotel_id,
    'Hotel category and service level',
    'hotelCategory',
    'select',
    '3-star',
    true,
    'Hotel category affects energy intensity and system sizing. Star ratings define service level, facilities, and guest expectations.',
    2,
    jsonb_build_array(
      jsonb_build_object(
        'value', '1-star',
        'label', '1-Star Hotel',
        'description', 'Basic accommodation with essential needs. Clean room, basic furniture, limited services, no restaurant or minimal facilities. Functionality over comfort.'
      ),
      jsonb_build_object(
        'value', '2-star',
        'label', '2-Star Hotel',
        'description', 'Budget hotel with modest comfort. Private bathroom, daily housekeeping, limited front desk service. Affordable comfort.'
      ),
      jsonb_build_object(
        'value', '3-star',
        'label', '3-Star Hotel',
        'description', 'Mid-range hotel with standard hospitality services. 24-hour reception, breakfast or restaurant, room service (limited hours). Suitable for leisure and business travelers. Balance between price and service.'
      ),
      jsonb_build_object(
        'value', '4-star',
        'label', '4-Star Hotel',
        'description', 'Upscale hotel with enhanced comfort and service quality. Concierge or guest services, multiple dining options, fitness center or pool, higher-quality rooms and amenities. Comfort with sophistication.'
      ),
      jsonb_build_object(
        'value', '5-star',
        'label', '5-Star Hotel',
        'description', 'Luxury hotel with officially regulated standards. High staff-to-guest ratio, personalized service, concierge and valet services, spa, fine dining, and premium facilities. Strong SOPs and service consistency. Luxury defined by reliability and service depth.'
      ),
      jsonb_build_object(
        'value', 'boutique',
        'label', 'Boutique Hotel',
        'description', 'Experience-driven property, not defined by size or star rating. Small to mid-size, unique design or theme, personalized intimate service, strong local or lifestyle identity. Curated interiors, signature dining or breakfast concept, personalized guest interaction. May be star-rated or non-classified.'
      ),
      jsonb_build_object(
        'value', 'non-classified',
        'label', 'Non-Classified Hotel',
        'description', 'Operates without an official star rating. No formal government classification, service levels vary widely, quality depends on management and reviews. Basic to moderate facilities, limited standardized services, flexible pricing. Can be excellent but consistency is not guaranteed.'
      )
    )
  );

  -- Update display_order for questions that should come after hotelCategory (display_order >= 2)
  -- Shift them up by 1 to make room for hotelCategory at position 2
  UPDATE custom_questions
  SET display_order = display_order + 1
  WHERE use_case_id = v_hotel_id
  AND field_name NOT IN ('roomCount', 'hotelCategory', 'hotelClassification', 'hotelType', 'hotelClass')
  AND display_order >= 2;

  RAISE NOTICE 'Successfully added hotel category question to hotel use case (ID: %)', v_hotel_id;

END $$;

-- Verify the question was added
SELECT 
  field_name,
  question_text,
  question_type,
  is_required,
  display_order,
  options
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
AND field_name = 'hotelCategory'
ORDER BY display_order;

