-- =============================================================================
-- ADD DINING, LAUNDRY, AND GUEST SERVICES TO MAIN HOTEL QUESTIONS
-- =============================================================================
-- This migration ensures that dining/restaurants/kitchens, laundry, and
-- guest services (concierge) are in the main form questions (not advanced).
--
-- Date: January 3, 2025
-- =============================================================================

DO $$
DECLARE
  v_hotel_id UUID;
  v_current_order INTEGER;
BEGIN
  -- Get hotel use case ID
  SELECT id INTO v_hotel_id 
  FROM use_cases 
  WHERE slug = 'hotel' 
  LIMIT 1;

  IF v_hotel_id IS NULL THEN
    RAISE NOTICE 'Hotel use case not found. Skipping migration.';
    RETURN;
  END IF;

  -- ============================================================================
  -- ENSURE FOOD & BEVERAGE IS IN MAIN FORM (not advanced)
  -- ============================================================================
  UPDATE custom_questions
  SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_advanced": false}'::jsonb,
      is_required = true
  WHERE use_case_id = v_hotel_id 
  AND field_name = 'foodBeverage';
  
  -- If foodBeverage doesn't exist, create it
  IF NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'foodBeverage') THEN
    SELECT COALESCE(MAX(display_order), 0) + 1 INTO v_current_order
    FROM custom_questions
    WHERE use_case_id = v_hotel_id;
    
    INSERT INTO custom_questions (
      use_case_id, question_text, field_name, question_type,
      default_value, is_required, help_text, display_order, options
    ) VALUES (
      v_hotel_id,
      'Describe your food & beverage facilities',
      'foodBeverage',
      'compound',
      '{}',
      true,
      'Commercial kitchens add significant load - select all that apply',
      v_current_order,
      '[
        {"label": "Complimentary Breakfast Area", "value": "breakfast", "powerKw": 20, "hasAmount": true, "amountUnit": "guests capacity", "defaultAmount": 50, "minAmount": 10, "maxAmount": 500},
        {"label": "Casual Dining Restaurant", "value": "casual_dining", "powerKw": 30, "hasAmount": true, "amountUnit": "seats", "defaultAmount": 100, "minAmount": 20, "maxAmount": 500, "helpText": "+0.3 kW per seat"},
        {"label": "Fine Dining Restaurant", "value": "fine_dining", "powerKw": 50, "hasAmount": true, "amountUnit": "seats", "defaultAmount": 60, "minAmount": 10, "maxAmount": 200, "helpText": "+0.5 kW per seat"},
        {"label": "Bar / Lounge", "value": "bar", "powerKw": 15, "hasAmount": true, "amountUnit": "seats", "defaultAmount": 40, "minAmount": 10, "maxAmount": 200, "helpText": "+0.2 kW per seat"},
        {"label": "Room Service Kitchen", "value": "room_service", "powerKw": 45, "hasAmount": false},
        {"label": "Banquet Kitchen", "value": "banquet", "powerKw": 60, "hasAmount": true, "amountUnit": "max covers", "defaultAmount": 200, "minAmount": 50, "maxAmount": 2000, "helpText": "+0.4 kW per cover capacity"},
        {"label": "Coffee Shop / Grab-and-Go", "value": "coffee_shop", "powerKw": 15, "hasAmount": false},
        {"label": "Pool Bar / Outdoor F&B", "value": "pool_bar", "powerKw": 20, "hasAmount": false},
        {"label": "No F&B Operations", "value": "none", "powerKw": 0, "hasAmount": false}
      ]'::jsonb
    );
  END IF;

  -- ============================================================================
  -- ENSURE LAUNDRY IS IN MAIN FORM
  -- ============================================================================
  -- Remove laundry from advanced if it exists
  UPDATE custom_questions
  SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_advanced": false}'::jsonb
  WHERE use_case_id = v_hotel_id 
  AND field_name IN ('hasLaundry', 'laundry', 'laundryType', 'laundryOperations');
  
  -- If laundry question doesn't exist, create it
  IF NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE use_case_id = v_hotel_id 
    AND field_name IN ('hasLaundry', 'laundry', 'laundryType', 'laundryOperations')
  ) THEN
    SELECT COALESCE(MAX(display_order), 0) + 1 INTO v_current_order
    FROM custom_questions
    WHERE use_case_id = v_hotel_id;
    
    INSERT INTO custom_questions (
      use_case_id, question_text, field_name, question_type,
      default_value, is_required, help_text, display_order, options
    ) VALUES (
      v_hotel_id,
      'Laundry operations',
      'laundryOperations',
      'select',
      'commercial',
      true,
      'Laundry facilities significantly impact power load',
      v_current_order,
      '[
        {"label": "Commercial Laundry (in-house)", "value": "commercial", "powerKw": 120, "helpText": "Full commercial laundry facility with washers, dryers, and steam"},
        {"label": "On-site Guest Laundry", "value": "guest_laundry", "powerKw": 25, "helpText": "Self-service guest laundry facilities"},
        {"label": "Valet Laundry Service (outsourced)", "value": "valet", "powerKw": 5, "helpText": "Laundry sent off-site for processing"},
        {"label": "No laundry operations", "value": "none", "powerKw": 0}
      ]'::jsonb
    );
  END IF;

  -- ============================================================================
  -- ADD GUEST SERVICES / CONCIERGE QUESTION TO MAIN FORM
  -- ============================================================================
  -- Remove concierge/guest services from advanced if it exists
  UPDATE custom_questions
  SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_advanced": false}'::jsonb
  WHERE use_case_id = v_hotel_id 
  AND field_name IN ('guestServices', 'concierge', 'guestServicesType');
  
  -- If guest services question doesn't exist, create it
  IF NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE use_case_id = v_hotel_id 
    AND field_name IN ('guestServices', 'concierge', 'guestServicesType')
  ) THEN
    SELECT COALESCE(MAX(display_order), 0) + 1 INTO v_current_order
    FROM custom_questions
    WHERE use_case_id = v_hotel_id;
    
    INSERT INTO custom_questions (
      use_case_id, question_text, field_name, question_type,
      default_value, is_required, help_text, display_order, options
    ) VALUES (
      v_hotel_id,
      'Guest services and concierge',
      'guestServices',
      'multiselect',
      '[]',
      false,
      'Guest services affect operational hours and power patterns',
      v_current_order,
      '[
        {"label": "Concierge Service", "value": "concierge", "helpText": "Full concierge desk with 24/7 service"},
        {"label": "Guest Services Desk", "value": "guest_services", "helpText": "Standard front desk guest services"},
        {"label": "Valet Parking Service", "value": "valet", "helpText": "Valet parking operations"},
        {"label": "Bell Service / Luggage", "value": "bell_service", "helpText": "Bell staff and luggage handling"},
        {"label": "Business Center", "value": "business_center", "helpText": "Business center with computers and printing"},
        {"label": "No dedicated guest services", "value": "none"}
      ]'::jsonb
    );
  END IF;

  RAISE NOTICE '✅ Hotel dining, laundry, and guest services questions added/updated in main form';

END $$;

-- Verify the questions
SELECT 
  field_name,
  question_text,
  question_type,
  is_required,
  display_order,
  COALESCE(metadata->>'is_advanced', 'false') as is_advanced
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
AND field_name IN ('foodBeverage', 'laundryOperations', 'hasLaundry', 'laundry', 'laundryType', 'guestServices', 'concierge')
ORDER BY display_order;

