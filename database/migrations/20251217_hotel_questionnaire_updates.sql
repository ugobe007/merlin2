-- ============================================================================
-- HOTEL QUESTIONNAIRE UPDATES - December 17, 2025
-- ============================================================================
-- 
-- Changes:
-- 1. Add square footage input for hotels (and other large buildings)
-- 2. Add hotel type classification (chain, large hotel, luxury, boutique, travel, small)
-- 3. Ensure amenities and F&B are multiple choice (multiselect/checkbox style)
-- 4. Add square footage for casinos, office buildings
--
-- ============================================================================

DO $$
DECLARE
    v_hotel_id UUID;
    v_casino_id UUID;
    v_office_id UUID;
    v_current_order INTEGER;
BEGIN
    -- Get use case IDs
    SELECT id INTO v_hotel_id FROM use_cases WHERE slug = 'hotel' LIMIT 1;
    SELECT id INTO v_casino_id FROM use_cases WHERE slug = 'casino' LIMIT 1;
    SELECT id INTO v_office_id FROM use_cases WHERE slug = 'office' LIMIT 1;
    
    -- ============================================================================
    -- HOTEL UPDATES
    -- ============================================================================
    
    IF v_hotel_id IS NOT NULL THEN
        -- Check current max display_order for hotel
        SELECT COALESCE(MAX(display_order), 0) INTO v_current_order 
        FROM custom_questions WHERE use_case_id = v_hotel_id;
        
        -- 1. Add Square Footage question (if not exists)
        IF NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'squareFeet') THEN
            INSERT INTO custom_questions (
                use_case_id, question_text, field_name, question_type,
                default_value, min_value, max_value, is_required, help_text, display_order
            ) VALUES (
                v_hotel_id,
                'Total building square footage',
                'squareFeet',
                'number',
                '75000',
                5000,
                2000000,
                true,
                'Total interior space including guest rooms, common areas, back-of-house, and parking structures',
                2  -- Insert early, after room count
            );
        END IF;
        
        -- 2. Add Hotel Type Classification question (if not exists)
        IF NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'hotelType') THEN
            INSERT INTO custom_questions (
                use_case_id, question_text, field_name, question_type,
                default_value, is_required, help_text, display_order, options
            ) VALUES (
                v_hotel_id,
                'What type of hotel is this?',
                'hotelType',
                'select',
                'midscale',
                true,
                'Hotel type affects power load calculations based on typical amenities and operations',
                3,  -- After square footage
                '[
                    {"label": "Chain Hotel (Holiday Inn, Marriott Courtyard, etc.)", "value": "chain"},
                    {"label": "Large Hotel (200+ rooms, full service)", "value": "large"},
                    {"label": "Luxury Hotel (Four Seasons, Ritz-Carlton, etc.)", "value": "luxury"},
                    {"label": "Boutique Hotel (Unique, design-focused)", "value": "boutique"},
                    {"label": "Travel Hotel (Extended stay, budget-friendly)", "value": "travel"},
                    {"label": "Small Hotel / Inn (<50 rooms)", "value": "small"}
                ]'::jsonb
            );
        END IF;
        
        -- 3. Ensure amenities is multiselect (multiple choice)
        UPDATE custom_questions
        SET question_type = 'multiselect'
        WHERE use_case_id = v_hotel_id AND field_name = 'amenities' AND question_type != 'multiselect';
        
        -- 4. Ensure food & beverage is multiselect/compound (multiple choice)
        -- Keep as compound but ensure it supports multiple selections
        UPDATE custom_questions
        SET question_type = 'compound',  -- Compound type allows multiple selections with amounts
            help_text = 'Select all that apply - each adds significant power load'
        WHERE use_case_id = v_hotel_id AND field_name IN ('foodBeverage', 'food_beverage');
    END IF;
    
    -- ============================================================================
    -- CASINO UPDATES - Add Square Footage
    -- ============================================================================
    
    IF v_casino_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_casino_id AND field_name = 'squareFeet') THEN
            -- Find a good position (after gaming floor size if it exists)
            SELECT COALESCE(
                (SELECT display_order + 1 FROM custom_questions 
                 WHERE use_case_id = v_casino_id AND field_name LIKE '%gaming%floor%' LIMIT 1),
                2
            ) INTO v_current_order;
            
            INSERT INTO custom_questions (
                use_case_id, question_text, field_name, question_type,
                default_value, min_value, max_value, is_required, help_text, display_order
            ) VALUES (
                v_casino_id,
                'Total building square footage',
                'squareFeet',
                'number',
                '200000',
                10000,
                5000000,
                true,
                'Total interior space including gaming floor, restaurants, hotel, parking, and back-of-house',
                v_current_order
            );
        END IF;
    END IF;
    
    -- ============================================================================
    -- OFFICE BUILDING UPDATES - Ensure Square Footage exists
    -- ============================================================================
    
    IF v_office_id IS NOT NULL THEN
        -- Check if squareFeet exists (might be named differently)
        IF NOT EXISTS (
            SELECT 1 FROM custom_questions 
            WHERE use_case_id = v_office_id 
            AND field_name IN ('squareFeet', 'officeSqFt', 'squareFootage', 'sqFt')
        ) THEN
            INSERT INTO custom_questions (
                use_case_id, question_text, field_name, question_type,
                default_value, min_value, max_value, is_required, help_text, display_order
            ) VALUES (
                v_office_id,
                'Total building square footage',
                'squareFeet',
                'number',
                '50000',
                5000,
                1000000,
                true,
                'Total leasable square footage including all floors',
                1
            );
        END IF;
    END IF;
    
    -- ============================================================================
    -- OTHER LARGE BUILDINGS - Add square footage where missing
    -- ============================================================================
    
    -- Warehouse
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
    )
    SELECT id, 'Total building square footage', 'squareFeet', 'number',
           '100000', 10000, 2000000, true,
           'Total warehouse floor space including storage, dock, and office areas',
           1
    FROM use_cases WHERE slug = 'warehouse'
    AND NOT EXISTS (
        SELECT 1 FROM custom_questions 
        WHERE use_case_id = use_cases.id 
        AND field_name IN ('squareFeet', 'warehouseSqFt', 'squareFootage')
    );
    
    -- Manufacturing
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
    )
    SELECT id, 'Total building square footage', 'squareFeet', 'number',
           '150000', 10000, 3000000, true,
           'Total manufacturing floor space including production, storage, and office areas',
           1
    FROM use_cases WHERE slug = 'manufacturing'
    AND NOT EXISTS (
        SELECT 1 FROM custom_questions 
        WHERE use_case_id = use_cases.id 
        AND field_name IN ('squareFeet', 'facilitySqFt', 'squareFootage')
    );
    
    -- Retail/Shopping Center
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
    )
    SELECT id, 'Total building square footage', 'squareFeet', 'number',
           '50000', 5000, 2000000, true,
           'Total retail floor space including sales floor, storage, and common areas',
           1
    FROM use_cases WHERE slug IN ('retail', 'shopping-center')
    AND NOT EXISTS (
        SELECT 1 FROM custom_questions 
        WHERE use_case_id = use_cases.id 
        AND field_name IN ('squareFeet', 'retailSqFt', 'squareFootage')
    );
    
    RAISE NOTICE '✅ Hotel questionnaire updates completed';
    
END $$;

