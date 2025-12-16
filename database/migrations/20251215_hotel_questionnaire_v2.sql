-- ============================================================================
-- HOTEL QUESTIONNAIRE V2 - Claude's 14-Question Design
-- December 15, 2025
-- 
-- Implements Claude's improved UX questionnaire while maintaining SSOT compliance.
-- Questions collect data; calculations remain in useCasePowerCalculations.ts
-- 
-- SSOT MAPPING:
-- - hotelClassification → maps to SSOT's 4 classes (economy/midscale/upscale/luxury)
-- - amenities multiselect → maps to calculateHotelPower() amenities object
-- - All other data feeds into existing SSOT functions
-- ============================================================================

-- ============================================================================
-- STEP 1: Delete existing hotel questions (clean slate)
-- ============================================================================
DELETE FROM custom_questions 
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality'));

-- ============================================================================
-- STEP 2: Insert Claude's 14 Questions
-- ============================================================================

DO $$
DECLARE
    v_hotel_id UUID;
BEGIN
    -- Get hotel use case ID
    SELECT id INTO v_hotel_id FROM use_cases WHERE slug = 'hotel' LIMIT 1;
    
    IF v_hotel_id IS NULL THEN
        RAISE NOTICE 'Hotel use case not found!';
        RETURN;
    END IF;

    -- ════════════════════════════════════════════════════════════════════════
    -- Q1: PROPERTY CLASSIFICATION (select)
    -- Maps Claude's 10 options to our 4 SSOT classes via ssotClass field
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        v_hotel_id,
        'What type of property is this?',
        'hotelClassification',
        'select',
        'midscale',
        true,
        'Different hotel types have different energy profiles per room',
        1,
        '[
            {"label": "Budget/Economy (limited service)", "value": "budget", "ssotClass": "economy"},
            {"label": "Midscale (select service, breakfast)", "value": "midscale", "ssotClass": "midscale"},
            {"label": "Upper Midscale (enhanced amenities)", "value": "upper-midscale", "ssotClass": "midscale"},
            {"label": "Upscale (full service, restaurant)", "value": "upscale", "ssotClass": "upscale"},
            {"label": "Upper Upscale (multiple restaurants, spa)", "value": "upper-upscale", "ssotClass": "upscale"},
            {"label": "Luxury (premium service, fine dining)", "value": "luxury", "ssotClass": "luxury"},
            {"label": "Resort (destination, extensive amenities)", "value": "resort", "ssotClass": "luxury"},
            {"label": "Boutique (unique design, <100 rooms)", "value": "boutique", "ssotClass": "midscale"},
            {"label": "Extended Stay (kitchenettes)", "value": "extended-stay", "ssotClass": "midscale"},
            {"label": "Inn/B&B (small, <30 rooms)", "value": "inn-bb", "ssotClass": "economy"}
        ]'::jsonb
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q2: NUMBER OF GUEST ROOMS (number)
    -- Direct SSOT field: roomCount
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, min_value, max_value, is_required, help_text, display_order
    ) VALUES (
        v_hotel_id,
        'How many guest rooms does your property have?',
        'roomCount',
        'number',
        '150',
        1,
        5000,
        true,
        'Include all rentable rooms and suites',
        2
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q3: TOTAL SQUARE FOOTAGE (number)
    -- Optional - helps refine HVAC estimate
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, min_value, max_value, is_required, help_text, display_order
    ) VALUES (
        v_hotel_id,
        'Approximate total building square footage',
        'squareFeet',
        'number',
        '100000',
        1000,
        5000000,
        false,
        'Include all conditioned space (optional - helps refine HVAC estimate)',
        3
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q4: AVERAGE OCCUPANCY RATE (slider)
    -- Used for demand profile shaping
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, min_value, max_value, is_required, help_text, display_order
    ) VALUES (
        v_hotel_id,
        'What is your average annual occupancy rate?',
        'avgOccupancy',
        'slider',
        '65',
        20,
        100,
        true,
        'Used to calculate typical vs peak demand scenarios (step: 5%)',
        4
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q5: PROPERTY AMENITIES (multiselect)
    -- Maps to SSOT amenities object in calculateHotelPower()
    -- powerKw values from HOTEL_AMENITY_SPECS
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        v_hotel_id,
        'Select all amenities your property offers',
        'amenities',
        'multiselect',
        '[]',
        true,
        'Select all that apply - each adds to your power profile',
        5,
        '[
            {"label": "Indoor Pool (heated)", "value": "indoor_pool", "powerKw": 50, "ssotField": "pool"},
            {"label": "Outdoor Pool (heated)", "value": "outdoor_pool", "powerKw": 40, "ssotField": "pool"},
            {"label": "Pool (unheated)", "value": "pool_unheated", "powerKw": 10, "ssotField": "pool"},
            {"label": "Hot Tub / Spa (water)", "value": "hot_tub", "powerKw": 15, "ssotField": "spa"},
            {"label": "Full-Service Spa", "value": "full_spa", "powerKw": 40, "ssotField": "spa"},
            {"label": "Fitness Center (small)", "value": "fitness_small", "powerKw": 15, "ssotField": "fitnessCenter"},
            {"label": "Fitness Center (large)", "value": "fitness_large", "powerKw": 35, "ssotField": "fitnessCenter"},
            {"label": "Business Center", "value": "business_center", "powerKw": 10},
            {"label": "Gift Shop / Retail", "value": "gift_shop", "powerKw": 8},
            {"label": "On-site Guest Laundry", "value": "guest_laundry", "powerKw": 25, "ssotField": "laundry"},
            {"label": "Commercial Laundry (in-house)", "value": "commercial_laundry", "powerKw": 120, "ssotField": "laundry"},
            {"label": "Tennis/Pickleball Courts (lighted)", "value": "courts", "powerKw": 20},
            {"label": "None of the above", "value": "none", "powerKw": 0}
        ]'::jsonb
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q6: FOOD & BEVERAGE OPERATIONS (compound)
    -- Complex F&B with seat counts for accurate sizing
    -- ════════════════════════════════════════════════════════════════════════
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
        6,
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

    -- ════════════════════════════════════════════════════════════════════════
    -- Q7: MEETING & EVENT SPACE (compound)
    -- Maps to SSOT conferenceCenter amenity
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        v_hotel_id,
        'Describe your meeting and event facilities',
        'meetingSpace',
        'compound',
        '{}',
        false,
        'Meeting space adds 0.02-0.05 kW/sqft depending on AV level',
        7,
        '[
            {"label": "Small Meeting Rooms (<1,000 sqft total)", "value": "small", "powerKw": 15, "hasAmount": true, "amountUnit": "sqft", "defaultAmount": 500, "helpText": "Basic AV"},
            {"label": "Medium Conference Space (1,000-5,000 sqft)", "value": "medium", "powerKw": 30, "hasAmount": true, "amountUnit": "sqft", "defaultAmount": 2500, "helpText": "Standard built-in AV"},
            {"label": "Large Ballroom (5,000-20,000 sqft)", "value": "large", "powerKw": 75, "hasAmount": true, "amountUnit": "sqft", "defaultAmount": 10000, "helpText": "Advanced AV, production lighting"},
            {"label": "Convention Center (>20,000 sqft)", "value": "convention", "powerKw": 150, "hasAmount": true, "amountUnit": "sqft", "defaultAmount": 30000, "helpText": "Broadcast-capable"},
            {"label": "No Meeting Space", "value": "none", "powerKw": 0, "hasAmount": false}
        ]'::jsonb
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q8: PARKING FACILITIES (compound)
    -- Used for solar canopy potential calculation
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        v_hotel_id,
        'Describe your parking facilities',
        'parking',
        'compound',
        '{}',
        false,
        'Parking info helps estimate solar canopy potential',
        8,
        '[
            {"label": "Surface Lot", "value": "surface", "powerKw": 5, "hasAmount": true, "amountUnit": "spaces", "defaultAmount": 150, "helpText": "Lighting load + solar canopy potential"},
            {"label": "Covered Structure / Garage", "value": "structure", "powerKw": 15, "hasAmount": true, "amountUnit": "spaces", "defaultAmount": 200, "helpText": "Higher lighting + ventilation"},
            {"label": "Valet Only (off-site)", "value": "valet", "powerKw": 2, "hasAmount": false},
            {"label": "No Dedicated Parking", "value": "none", "powerKw": 0, "hasAmount": false}
        ]'::jsonb
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q9: EXISTING SOLAR INSTALLATION (compound)
    -- Expands simple existingSolarKW field
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        v_hotel_id,
        'Do you have an existing solar installation?',
        'existingSolar',
        'compound',
        '{}',
        true,
        'Existing solar affects BESS sizing and integration',
        9,
        '[
            {"label": "Yes, operational", "value": "operational", "powerKw": 0, "hasAmount": true, "amountUnit": "kW DC", "defaultAmount": 100, "helpText": "Current working system size"},
            {"label": "Yes, but not working", "value": "not_working", "powerKw": 0, "hasAmount": true, "amountUnit": "kW DC", "defaultAmount": 50},
            {"label": "Under construction", "value": "under_construction", "powerKw": 0, "hasAmount": true, "amountUnit": "kW DC planned", "defaultAmount": 150},
            {"label": "Approved/permitted", "value": "approved", "powerKw": 0, "hasAmount": true, "amountUnit": "kW DC planned", "defaultAmount": 100},
            {"label": "No existing solar", "value": "none", "powerKw": 0, "hasAmount": false}
        ]'::jsonb
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q10: SOLAR INTEREST (compound)
    -- Expands simple wantsSolar boolean
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        v_hotel_id,
        'Are you interested in adding solar?',
        'solarInterest',
        'compound',
        '{}',
        true,
        'We can size solar to complement your BESS system',
        10,
        '[
            {"label": "Yes, actively planning", "value": "active", "powerKw": 0, "hasAmount": true, "amountUnit": "kW target", "defaultAmount": 200, "helpText": "Approximate target size"},
            {"label": "Yes, exploring options", "value": "exploring", "powerKw": 0, "hasAmount": false},
            {"label": "Maybe, need more info", "value": "maybe", "powerKw": 0, "hasAmount": false},
            {"label": "No, not at this time", "value": "no", "powerKw": 0, "hasAmount": false},
            {"label": "Already have sufficient solar", "value": "sufficient", "powerKw": 0, "hasAmount": false}
        ]'::jsonb
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q11: EXISTING EV CHARGING (compound)
    -- Maps to SSOT evCharging amenity
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        v_hotel_id,
        'Do you have existing EV charging stations?',
        'existingEV',
        'compound',
        '{}',
        true,
        'EV charging adds significant demand - BESS can help manage peaks',
        11,
        '[
            {"label": "Level 2 Chargers (7-19 kW each)", "value": "level2", "powerKw": 10, "hasAmount": true, "amountUnit": "chargers", "defaultAmount": 4, "helpText": "~10 kW average per charger"},
            {"label": "DC Fast Chargers (50-150 kW)", "value": "dcfc", "powerKw": 75, "hasAmount": true, "amountUnit": "chargers", "defaultAmount": 2, "helpText": "~75 kW average per charger"},
            {"label": "Ultra-Fast Chargers (150+ kW)", "value": "ultra", "powerKw": 200, "hasAmount": true, "amountUnit": "chargers", "defaultAmount": 1, "helpText": "~200 kW average per charger"},
            {"label": "No existing EV charging", "value": "none", "powerKw": 0, "hasAmount": false}
        ]'::jsonb
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q12: EV CHARGING INTEREST (compound)
    -- Future EV load planning
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        v_hotel_id,
        'Are you interested in adding or expanding EV charging?',
        'evInterest',
        'compound',
        '{}',
        true,
        'BESS can be sized to support future EV growth',
        12,
        '[
            {"label": "Yes, high priority - frequent guest requests", "value": "high", "powerKw": 0, "hasAmount": true, "amountUnit": "chargers wanted", "defaultAmount": 8, "helpText": "Level 2 chargers for overnight charging"},
            {"label": "Yes, moderate interest", "value": "moderate", "powerKw": 0, "hasAmount": true, "amountUnit": "chargers wanted", "defaultAmount": 4},
            {"label": "Maybe, exploring", "value": "exploring", "powerKw": 0, "hasAmount": false},
            {"label": "No, not at this time", "value": "no", "powerKw": 0, "hasAmount": false},
            {"label": "Already have sufficient EV charging", "value": "sufficient", "powerKw": 0, "hasAmount": false}
        ]'::jsonb
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q13: BACKUP POWER REQUIREMENTS (compound)
    -- Expands simple needsBackupPower boolean
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        v_hotel_id,
        'How important is backup power during grid outages?',
        'backupRequirements',
        'compound',
        '{}',
        true,
        'Backup priority affects BESS sizing and duration',
        13,
        '[
            {"label": "Mission Critical - cannot lose power", "value": "critical", "powerKw": 0, "hasAmount": true, "amountUnit": "hours backup", "defaultAmount": 24, "helpText": "100% critical load coverage"},
            {"label": "Important - minimize downtime", "value": "important", "powerKw": 0, "hasAmount": true, "amountUnit": "hours backup", "defaultAmount": 8, "helpText": "Essential systems covered"},
            {"label": "Nice to have - occasional outages OK", "value": "nice_to_have", "powerKw": 0, "hasAmount": true, "amountUnit": "hours backup", "defaultAmount": 4},
            {"label": "Have existing generator backup", "value": "has_generator", "powerKw": 0, "hasAmount": true, "amountUnit": "kW generator", "defaultAmount": 500, "helpText": "BESS bridges until generator starts"},
            {"label": "Not a priority", "value": "not_priority", "powerKw": 0, "hasAmount": false}
        ]'::jsonb
    );

    -- ════════════════════════════════════════════════════════════════════════
    -- Q14: UTILITY & ENERGY GOALS (compound)
    -- Business drivers for BESS investment
    -- ════════════════════════════════════════════════════════════════════════
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type, 
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        v_hotel_id,
        'What are your primary energy goals?',
        'energyGoals',
        'compound',
        '{}',
        true,
        'Select all goals that apply - helps us optimize your system',
        14,
        '[
            {"label": "Reduce electricity costs", "value": "reduce_costs", "powerKw": 0, "hasAmount": true, "amountUnit": "$ monthly bill", "defaultAmount": 25000, "helpText": "Current average monthly electric bill"},
            {"label": "Reduce demand charges", "value": "reduce_demand", "powerKw": 0, "hasAmount": true, "amountUnit": "kW peak demand", "defaultAmount": 500, "helpText": "Current peak demand (from utility bill)"},
            {"label": "Achieve net-zero / carbon neutral", "value": "net_zero", "powerKw": 0, "hasAmount": false},
            {"label": "Meet brand sustainability requirements", "value": "brand_requirements", "powerKw": 0, "hasAmount": false},
            {"label": "Earn green building certification", "value": "green_cert", "powerKw": 0, "hasAmount": false},
            {"label": "Reduce reliance on grid", "value": "grid_independence", "powerKw": 0, "hasAmount": false},
            {"label": "Participate in utility demand response", "value": "demand_response", "powerKw": 0, "hasAmount": false},
            {"label": "Time-of-use optimization", "value": "tou_optimization", "powerKw": 0, "hasAmount": false}
        ]'::jsonb
    );

    RAISE NOTICE '✅ Hotel Questionnaire V2 complete - 14 questions inserted';

END $$;

-- ============================================================================
-- VERIFICATION: Show new hotel questions
-- ============================================================================
SELECT 
    display_order,
    field_name,
    question_type,
    question_text,
    CASE 
        WHEN options IS NOT NULL THEN jsonb_array_length(options)::text || ' options'
        ELSE 'N/A'
    END as option_count
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug = 'hotel'
ORDER BY display_order;
