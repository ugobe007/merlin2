-- ============================================================================
-- Migration: Enhance Hotel Questions with Multiselect and Better Options
-- Date: January 19, 2026
-- Purpose: Make hotel questions more comprehensive and accurate
-- ============================================================================

-- ============================================================================
-- ENHANCEMENT 1: Food & Beverage - Change to MULTISELECT (hotels can have multiple)
-- ============================================================================
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    question_text = 'Food & Beverage Operations',
    help_text = 'Select all dining options at your property',
    options = '[
        {"value": "none", "label": "No F&B", "icon": "🚫", "description": "No on-site food service"},
        {"value": "vending", "label": "Vending/Pantry", "icon": "🥤", "description": "Vending machines or market pantry"},
        {"value": "breakfast_continental", "label": "Continental Breakfast", "icon": "🥐", "description": "Cold breakfast items"},
        {"value": "breakfast_hot", "label": "Hot Breakfast", "icon": "🍳", "description": "Full hot breakfast buffet"},
        {"value": "cafe", "label": "Café/Coffee Bar", "icon": "☕", "description": "Coffee shop or grab-n-go"},
        {"value": "restaurant_casual", "label": "Casual Restaurant", "icon": "🍽️", "description": "Casual dining restaurant"},
        {"value": "restaurant_fine", "label": "Fine Dining", "icon": "🥂", "description": "Upscale restaurant"},
        {"value": "bar_lounge", "label": "Bar/Lounge", "icon": "🍸", "description": "Bar or cocktail lounge"},
        {"value": "room_service", "label": "Room Service", "icon": "🛎️", "description": "In-room dining"},
        {"value": "banquet_catering", "label": "Banquet/Catering", "icon": "🎪", "description": "Event catering services"},
        {"value": "poolside", "label": "Pool Bar/Grill", "icon": "🏊", "description": "Poolside food service"},
        {"value": "rooftop", "label": "Rooftop Bar", "icon": "🌃", "description": "Rooftop dining/bar"}
    ]'::jsonb
WHERE field_name = 'fbOperations'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- ENHANCEMENT 2: Laundry Operations - Change to MULTISELECT with more options
-- ============================================================================
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    question_text = 'Laundry Operations',
    help_text = 'Select all laundry services at your property',
    options = '[
        {"value": "outsourced", "label": "Outsourced", "icon": "📦", "description": "Third-party laundry service"},
        {"value": "guest_coin", "label": "Guest Coin Laundry", "icon": "🪙", "description": "Self-service coin machines"},
        {"value": "guest_card", "label": "Guest Card Laundry", "icon": "💳", "description": "Self-service card machines"},
        {"value": "valet_laundry", "label": "Valet Laundry", "icon": "👔", "description": "Guest laundry pickup/delivery"},
        {"value": "commercial_linens", "label": "Commercial Linen Processing", "icon": "🛏️", "description": "On-site linen washing"},
        {"value": "commercial_uniforms", "label": "Uniform Processing", "icon": "👕", "description": "Staff uniform cleaning"},
        {"value": "dry_cleaning", "label": "Dry Cleaning", "icon": "✨", "description": "On-site dry cleaning"},
        {"value": "industrial", "label": "Industrial Laundry Facility", "icon": "🏭", "description": "Large-scale industrial laundry"}
    ]'::jsonb
WHERE field_name = 'laundryOperations'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- ENHANCEMENT 3: Meeting & Event Space - Change to MULTISELECT with detailed options
-- ============================================================================
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    question_text = 'Meeting & Event Spaces',
    help_text = 'Select all meeting/event facilities at your property',
    options = '[
        {"value": "none", "label": "No Meeting Space", "icon": "🚫", "description": "No dedicated meeting areas"},
        {"value": "boardroom", "label": "Boardroom", "icon": "💼", "description": "Executive boardroom (8-20 people)"},
        {"value": "meeting_small", "label": "Small Meeting Rooms", "icon": "🪑", "description": "Meeting rooms (10-30 people)"},
        {"value": "meeting_medium", "label": "Medium Meeting Rooms", "icon": "👥", "description": "Meeting rooms (30-75 people)"},
        {"value": "meeting_large", "label": "Large Meeting Rooms", "icon": "🏛️", "description": "Meeting rooms (75-150 people)"},
        {"value": "conference_center", "label": "Conference Center", "icon": "🎤", "description": "Multi-room conference facility"},
        {"value": "ballroom_small", "label": "Small Ballroom", "icon": "💃", "description": "Ballroom (under 5,000 sq ft)"},
        {"value": "ballroom_large", "label": "Grand Ballroom", "icon": "👑", "description": "Large ballroom (5,000+ sq ft)"},
        {"value": "outdoor_event", "label": "Outdoor Event Space", "icon": "🌳", "description": "Gardens, patios, terraces"},
        {"value": "theater", "label": "Theater/Auditorium", "icon": "🎭", "description": "Theater-style seating"},
        {"value": "exhibition", "label": "Exhibition Hall", "icon": "🖼️", "description": "Trade show/exhibition space"},
        {"value": "breakout_rooms", "label": "Breakout Rooms", "icon": "🚪", "description": "Multiple smaller breakout spaces"}
    ]'::jsonb
WHERE field_name = 'meetingSpace'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- ENHANCEMENT 4: Pool & Recreation - Change to MULTISELECT
-- ============================================================================
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    question_text = 'Pool & Recreation Facilities',
    help_text = 'Select all pool and recreation facilities',
    options = '[
        {"value": "none", "label": "No Pool", "icon": "🚫", "description": "No pool facilities"},
        {"value": "outdoor_unheated", "label": "Outdoor Pool (Unheated)", "icon": "🏊", "description": "Seasonal outdoor pool"},
        {"value": "outdoor_heated", "label": "Outdoor Pool (Heated)", "icon": "🌡️", "description": "Year-round heated outdoor pool"},
        {"value": "indoor", "label": "Indoor Pool", "icon": "🏠", "description": "Climate-controlled indoor pool"},
        {"value": "indoor_heated", "label": "Indoor Heated Pool", "icon": "♨️", "description": "Heated indoor pool"},
        {"value": "hot_tub_outdoor", "label": "Outdoor Hot Tub/Spa", "icon": "🛁", "description": "Outdoor jacuzzi/hot tub"},
        {"value": "hot_tub_indoor", "label": "Indoor Hot Tub/Spa", "icon": "💆", "description": "Indoor jacuzzi/hot tub"},
        {"value": "lazy_river", "label": "Lazy River", "icon": "🌊", "description": "Lazy river attraction"},
        {"value": "water_park", "label": "Water Park Features", "icon": "🎢", "description": "Slides, splash zones"},
        {"value": "kids_pool", "label": "Children''s Pool", "icon": "👶", "description": "Dedicated kids pool area"},
        {"value": "lap_pool", "label": "Lap Pool", "icon": "🏅", "description": "Lane swimming pool"},
        {"value": "rooftop_pool", "label": "Rooftop Pool", "icon": "🌃", "description": "Rooftop pool deck"}
    ]'::jsonb
WHERE field_name = 'poolType'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- ENHANCEMENT 5: Fitness Center - Change to MULTISELECT
-- ============================================================================
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    question_text = 'Fitness & Wellness Facilities',
    help_text = 'Select all fitness and wellness amenities',
    options = '[
        {"value": "none", "label": "No Fitness", "icon": "🚫", "description": "No fitness facilities"},
        {"value": "basic_gym", "label": "Basic Fitness Room", "icon": "🏋️", "description": "Cardio + basic weights"},
        {"value": "full_gym", "label": "Full Fitness Center", "icon": "💪", "description": "Full cardio, weights, machines"},
        {"value": "yoga_studio", "label": "Yoga/Pilates Studio", "icon": "🧘", "description": "Dedicated yoga/pilates space"},
        {"value": "group_fitness", "label": "Group Fitness Room", "icon": "👯", "description": "Classes and group exercise"},
        {"value": "personal_training", "label": "Personal Training", "icon": "🏃", "description": "Personal training services"},
        {"value": "tennis", "label": "Tennis Courts", "icon": "🎾", "description": "Tennis court facilities"},
        {"value": "basketball", "label": "Basketball Court", "icon": "🏀", "description": "Basketball/multi-sport court"},
        {"value": "golf", "label": "Golf (Course/Simulator)", "icon": "⛳", "description": "Golf course or simulator"},
        {"value": "jogging_trail", "label": "Jogging Trail", "icon": "🏃‍♂️", "description": "On-property running path"},
        {"value": "rock_climbing", "label": "Rock Climbing Wall", "icon": "🧗", "description": "Indoor climbing wall"}
    ]'::jsonb
WHERE field_name = 'fitnessCenter'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- ENHANCEMENT 6: Spa Services - Already multiselect, enhance options
-- ============================================================================
UPDATE custom_questions
SET 
    help_text = 'Select all spa and wellness services offered',
    options = '[
        {"value": "none", "label": "No Spa", "icon": "🚫", "description": "No spa services"},
        {"value": "massage", "label": "Massage Services", "icon": "💆", "description": "Various massage treatments"},
        {"value": "facials", "label": "Facials & Skincare", "icon": "✨", "description": "Facial treatments"},
        {"value": "body_treatments", "label": "Body Treatments", "icon": "🧴", "description": "Wraps, scrubs, etc."},
        {"value": "salon", "label": "Hair Salon", "icon": "💇", "description": "Hair styling services"},
        {"value": "nail_salon", "label": "Nail Salon", "icon": "💅", "description": "Manicure/pedicure"},
        {"value": "sauna", "label": "Sauna", "icon": "🧖", "description": "Dry sauna"},
        {"value": "steam_room", "label": "Steam Room", "icon": "♨️", "description": "Steam room"},
        {"value": "hydrotherapy", "label": "Hydrotherapy", "icon": "🌊", "description": "Water therapy treatments"},
        {"value": "med_spa", "label": "Medical Spa", "icon": "💉", "description": "Aesthetic medical treatments"},
        {"value": "wellness_programs", "label": "Wellness Programs", "icon": "🧘‍♀️", "description": "Retreats, detox programs"}
    ]'::jsonb
WHERE field_name = 'spaServices'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- ENHANCEMENT 7: Parking - Change to MULTISELECT
-- ============================================================================
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    question_text = 'Parking Facilities',
    help_text = 'Select all parking options available',
    options = '[
        {"value": "none", "label": "No Parking", "icon": "🚫", "description": "No on-site parking"},
        {"value": "surface", "label": "Surface Lot", "icon": "🅿️", "description": "Open surface parking"},
        {"value": "covered", "label": "Covered Parking", "icon": "🏗️", "description": "Covered/shaded parking"},
        {"value": "garage", "label": "Parking Garage", "icon": "🏢", "description": "Multi-level parking garage"},
        {"value": "underground", "label": "Underground Parking", "icon": "⬇️", "description": "Below-ground parking"},
        {"value": "valet", "label": "Valet Parking", "icon": "🚗", "description": "Valet service available"},
        {"value": "ev_charging", "label": "EV Charging Stations", "icon": "⚡", "description": "Electric vehicle charging"},
        {"value": "bus_coach", "label": "Bus/Coach Parking", "icon": "🚌", "description": "Tour bus parking"},
        {"value": "motorcycle", "label": "Motorcycle Parking", "icon": "🏍️", "description": "Dedicated motorcycle spots"},
        {"value": "handicap", "label": "ADA Accessible", "icon": "♿", "description": "Accessible parking spaces"}
    ]'::jsonb
WHERE field_name = 'parkingType'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- ============================================================================
-- NEW QUESTION 1: Guest Services (Concierge, etc.)
-- ============================================================================
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) VALUES (
    (SELECT id FROM use_cases WHERE slug = 'hotel'),
    'Guest Services',
    'multiselect',
    'guestServices',
    false,
    19,
    'Select all guest services offered',
    'Operations',
    '[
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
        {"value": "butler", "label": "Butler Service", "icon": "🤵", "description": "Personal butler service"}
    ]'::jsonb
);

-- ============================================================================
-- NEW QUESTION 2: Property Type/Layout
-- ============================================================================
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) VALUES (
    (SELECT id FROM use_cases WHERE slug = 'hotel'),
    'Property Layout',
    'select',
    'propertyLayout',
    true,
    2,
    'Select the building layout of your property',
    'Facility',
    '[
        {"value": "single_building", "label": "Single Building", "icon": "🏨", "description": "One main building"},
        {"value": "tower", "label": "High-Rise Tower", "icon": "🏙️", "description": "Tower building (10+ floors)"},
        {"value": "low_rise", "label": "Low-Rise Building", "icon": "🏢", "description": "Low-rise (3-9 floors)"},
        {"value": "garden_style", "label": "Garden Style", "icon": "🌿", "description": "Multiple 2-3 story buildings"},
        {"value": "campus", "label": "Campus/Resort", "icon": "🏝️", "description": "Multiple buildings spread out"},
        {"value": "mixed_use", "label": "Mixed-Use Building", "icon": "🏗️", "description": "Hotel within larger building"},
        {"value": "historic", "label": "Historic Building", "icon": "🏛️", "description": "Historic/heritage property"}
    ]'::jsonb
);

-- ============================================================================
-- NEW QUESTION 3: Roof Space Details
-- ============================================================================
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) VALUES (
    (SELECT id FROM use_cases WHERE slug = 'hotel'),
    'Roof Characteristics',
    'multiselect',
    'roofCharacteristics',
    false,
    30,
    'Select all that apply to your roof space',
    'Infrastructure',
    '[
        {"value": "flat_large", "label": "Large Flat Roof", "icon": "⬜", "description": "10,000+ sq ft flat area"},
        {"value": "flat_medium", "label": "Medium Flat Roof", "icon": "🔲", "description": "5,000-10,000 sq ft flat area"},
        {"value": "flat_small", "label": "Small Flat Roof", "icon": "▫️", "description": "Under 5,000 sq ft flat area"},
        {"value": "pitched", "label": "Pitched/Sloped Roof", "icon": "🏠", "description": "Angled roofing"},
        {"value": "multi_level", "label": "Multi-Level Roof", "icon": "📊", "description": "Different roof heights"},
        {"value": "rooftop_amenities", "label": "Rooftop Amenities", "icon": "🌃", "description": "Pool, bar, or lounge on roof"},
        {"value": "hvac_equipment", "label": "Heavy HVAC Equipment", "icon": "❄️", "description": "Significant roof HVAC"},
        {"value": "recent_replacement", "label": "Recently Replaced", "icon": "✨", "description": "Roof under 5 years old"},
        {"value": "needs_repair", "label": "Needs Repair", "icon": "⚠️", "description": "Roof needs work before solar"},
        {"value": "carport_potential", "label": "Carport Potential", "icon": "🚗", "description": "Parking area for solar carport"}
    ]'::jsonb
);

-- ============================================================================
-- VERIFY: Show updated hotel questions summary
-- ============================================================================
SELECT 
    field_name,
    question_type,
    question_text
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
ORDER BY display_order;
