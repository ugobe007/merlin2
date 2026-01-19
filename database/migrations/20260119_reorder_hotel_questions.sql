-- ============================================================================
-- Migration: Reorder Hotel Questions and Merge Semantic Duplicates
-- Date: January 19, 2026
-- Purpose: Logical question flow, merge amenities+guestServices, fix display_order
-- ============================================================================

-- ============================================================================
-- STEP 1: Merge amenities + guestServices into one comprehensive question
-- Keep guestServices (more comprehensive), delete amenities
-- ============================================================================

-- First, update guestServices to include amenities options
UPDATE custom_questions
SET 
    question_text = 'Guest Amenities & Services',
    help_text = 'Select all guest-facing amenities and services at your property',
    section_name = 'Guest Amenities',
    options = '[
        {"value": "front_desk_24hr", "label": "24-Hour Front Desk", "icon": "🛎️", "description": "Round-the-clock reception"},
        {"value": "concierge", "label": "Concierge", "icon": "🎩", "description": "Concierge services"},
        {"value": "concierge_24hr", "label": "24-Hour Concierge", "icon": "⭐", "description": "Round-the-clock concierge"},
        {"value": "bell_service", "label": "Bell Service", "icon": "🔔", "description": "Bellhop/porter service"},
        {"value": "doorman", "label": "Doorman", "icon": "🚪", "description": "Doorman service"},
        {"value": "shuttle", "label": "Shuttle Service", "icon": "🚐", "description": "Airport/local shuttle"},
        {"value": "car_rental", "label": "Car Rental Desk", "icon": "🚙", "description": "On-site car rental"},
        {"value": "business_center", "label": "Business Center", "icon": "💻", "description": "Business services center"},
        {"value": "kids_club", "label": "Kids Club", "icon": "👶", "description": "Children''s program/club"},
        {"value": "pet_services", "label": "Pet Services", "icon": "🐕", "description": "Pet-friendly amenities"},
        {"value": "translation", "label": "Translation Services", "icon": "🌐", "description": "Multi-language assistance"},
        {"value": "butler", "label": "Butler Service", "icon": "🤵", "description": "Personal butler service"},
        {"value": "room_wifi", "label": "In-Room WiFi", "icon": "📶", "description": "High-speed internet"},
        {"value": "minibar", "label": "Minibar", "icon": "🍹", "description": "In-room minibar"},
        {"value": "safe", "label": "In-Room Safe", "icon": "🔐", "description": "Personal safe"},
        {"value": "turndown", "label": "Turndown Service", "icon": "🛏️", "description": "Evening turndown"},
        {"value": "wake_up", "label": "Wake-Up Service", "icon": "⏰", "description": "Wake-up calls"},
        {"value": "gift_shop", "label": "Gift Shop", "icon": "🎁", "description": "On-site retail"}
    ]'::jsonb
WHERE field_name = 'guestServices'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- Delete the old amenities question (now merged into guestServices)
DELETE FROM custom_questions
WHERE field_name = 'amenities'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- STEP 2: Assign proper section_name to uncategorized questions
-- ============================================================================
UPDATE custom_questions SET section_name = 'Guest Amenities' WHERE field_name = 'poolType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET section_name = 'Guest Amenities' WHERE field_name = 'fitnessCenter' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET section_name = 'Guest Amenities' WHERE field_name = 'spaServices' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET section_name = 'Solar Potential' WHERE field_name = 'solarSpace' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- STEP 3: Reorder ALL hotel questions with proper logical flow
-- ============================================================================

-- SECTION 1: PROPERTY BASICS (1-10)
UPDATE custom_questions SET display_order = 1, section_name = 'Property Basics' WHERE field_name = 'hotelCategory' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 2, section_name = 'Property Basics' WHERE field_name = 'propertyLayout' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 3, section_name = 'Property Basics' WHERE field_name = 'roomCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 4, section_name = 'Property Basics' WHERE field_name = 'floorCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 5, section_name = 'Property Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 6, section_name = 'Property Basics' WHERE field_name = 'occupancyRate' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 7, section_name = 'Property Basics' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- SECTION 2: ENERGY & POWER (11-20)
UPDATE custom_questions SET display_order = 11, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 12, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 13, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 14, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- SECTION 3: BUILDING SYSTEMS (21-30)
UPDATE custom_questions SET display_order = 21, section_name = 'Building Systems' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 22, section_name = 'Building Systems' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 23, section_name = 'Building Systems' WHERE field_name = 'elevatorCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 24, section_name = 'Building Systems' WHERE field_name = 'efficientElevators' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- SECTION 4: GUEST AMENITIES (31-45)
UPDATE custom_questions SET display_order = 31, section_name = 'Guest Amenities' WHERE field_name = 'guestServices' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 32, section_name = 'Guest Amenities' WHERE field_name = 'fbOperations' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 33, section_name = 'Guest Amenities' WHERE field_name = 'poolType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 34, section_name = 'Guest Amenities' WHERE field_name = 'fitnessCenter' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 35, section_name = 'Guest Amenities' WHERE field_name = 'spaServices' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 36, section_name = 'Guest Amenities' WHERE field_name = 'meetingSpace' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- SECTION 5: OPERATIONS (46-55)
UPDATE custom_questions SET display_order = 46, section_name = 'Operations' WHERE field_name = 'laundryOperations' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 47, section_name = 'Operations' WHERE field_name = 'parkingType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 48, section_name = 'Operations' WHERE field_name = 'exteriorLoads' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- SECTION 6: EXISTING INFRASTRUCTURE (56-65)
UPDATE custom_questions SET display_order = 56, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 57, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 58, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 59, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 60, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- SECTION 7: SOLAR POTENTIAL (66-75)
UPDATE custom_questions SET display_order = 66, section_name = 'Solar Potential' WHERE field_name = 'solarInterest' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 67, section_name = 'Solar Potential' WHERE field_name = 'solarSpace' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 68, section_name = 'Solar Potential' WHERE field_name = 'rooftopSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
UPDATE custom_questions SET display_order = 69, section_name = 'Solar Potential' WHERE field_name = 'roofCharacteristics' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- SECTION 8: ENERGY GOALS (76-80)
UPDATE custom_questions SET display_order = 76, section_name = 'Energy Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- VERIFY: Show new order
-- ============================================================================
SELECT 
    display_order,
    field_name,
    question_type,
    section_name,
    question_text
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
ORDER BY display_order;
