-- ============================================================================
-- Migration: Enhance Car Wash, EV Charging, Truck Stop & Data Center Questions
-- Date: January 19, 2026
-- Purpose: Add multiselect options and better question configurations
-- ============================================================================

-- ============================================================================
-- CAR WASH ENHANCEMENTS
-- ============================================================================

-- Car Wash Type - Enhance with better options
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    question_text = 'Car Wash Services Offered',
    help_text = 'Select all wash services at your facility',
    options = '[
        {"value": "self_service", "label": "Self-Service Bays", "icon": "🚿", "description": "Manual spray wand bays"},
        {"value": "automatic_touch", "label": "Automatic Touch", "icon": "🧽", "description": "Brush/friction wash"},
        {"value": "automatic_touchless", "label": "Automatic Touchless", "icon": "💨", "description": "High-pressure touchless"},
        {"value": "tunnel_express", "label": "Express Tunnel", "icon": "🚗", "description": "Conveyor tunnel (2-3 min)"},
        {"value": "tunnel_full", "label": "Full-Service Tunnel", "icon": "✨", "description": "Tunnel with interior service"},
        {"value": "flex_serve", "label": "Flex Serve", "icon": "🔄", "description": "Customer choice interior/exterior"},
        {"value": "detail_bay", "label": "Detail Bays", "icon": "💎", "description": "Professional detailing"},
        {"value": "hand_wash", "label": "Hand Wash Service", "icon": "🤲", "description": "Manual hand washing"},
        {"value": "fleet_wash", "label": "Fleet/Truck Wash", "icon": "🚚", "description": "Large vehicle washing"},
        {"value": "motorcycle", "label": "Motorcycle Wash", "icon": "🏍️", "description": "Two-wheel vehicle wash"}
    ]'::jsonb
WHERE field_name = 'washType'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- Car Wash Equipment - Add multiselect for equipment types
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    question_text = 'Wash Equipment & Systems',
    help_text = 'Select all major equipment at your facility',
    options = '[
        {"value": "high_pressure_pumps", "label": "High-Pressure Pumps", "icon": "💧", "description": "Main wash pumps"},
        {"value": "water_reclaim", "label": "Water Reclaim System", "icon": "♻️", "description": "Water recycling"},
        {"value": "reverse_osmosis", "label": "Reverse Osmosis", "icon": "🔬", "description": "Spot-free rinse system"},
        {"value": "water_softener", "label": "Water Softener", "icon": "🧴", "description": "Hard water treatment"},
        {"value": "chemical_dispensers", "label": "Chemical Dispensers", "icon": "🧪", "description": "Soap/wax dispensing"},
        {"value": "dryers_blowers", "label": "Dryers/Blowers", "icon": "🌬️", "description": "Vehicle drying system"},
        {"value": "vacuums", "label": "Vacuum Islands", "icon": "🧹", "description": "Self-service vacuums"},
        {"value": "mat_washers", "label": "Mat Washers", "icon": "🔲", "description": "Floor mat cleaning"},
        {"value": "vending", "label": "Vending (Air/Towels)", "icon": "🎰", "description": "Air, towels, fresheners"},
        {"value": "payment_kiosks", "label": "Payment Kiosks", "icon": "💳", "description": "Self-pay terminals"},
        {"value": "license_plate_reader", "label": "License Plate Recognition", "icon": "📷", "description": "Membership/fleet tracking"},
        {"value": "conveyor", "label": "Conveyor System", "icon": "⚙️", "description": "Tunnel conveyor belt"}
    ]'::jsonb
WHERE field_name IN ('equipmentType', 'equipment')
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- Add new Car Wash question: Operating Model
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) 
SELECT 
    (SELECT id FROM use_cases WHERE slug = 'car-wash'),
    'Operating Model',
    'select',
    'operatingModel',
    true,
    3,
    'How is your car wash operated?',
    'Operations',
    '[
        {"value": "attended_full", "label": "Fully Attended", "icon": "👷", "description": "Staff at all times"},
        {"value": "attended_partial", "label": "Partially Attended", "icon": "👤", "description": "Staff during peak hours"},
        {"value": "unattended", "label": "Unattended/Automated", "icon": "🤖", "description": "Fully automated operation"},
        {"value": "hybrid", "label": "Hybrid Model", "icon": "🔄", "description": "Mix of attended/unattended"}
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE field_name = 'operatingModel' 
    AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash')
);

-- Add Car Wash: Ancillary Services
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) 
SELECT 
    (SELECT id FROM use_cases WHERE slug = 'car-wash'),
    'Additional Services',
    'multiselect',
    'ancillaryServices',
    false,
    15,
    'Select any additional services offered',
    'Operations',
    '[
        {"value": "oil_change", "label": "Oil Change/Lube", "icon": "🛢️", "description": "Quick lube services"},
        {"value": "tire_service", "label": "Tire Service", "icon": "🛞", "description": "Tire rotation/repair"},
        {"value": "detailing", "label": "Full Detailing", "icon": "✨", "description": "Interior/exterior detailing"},
        {"value": "ceramic_coating", "label": "Ceramic Coating", "icon": "💎", "description": "Paint protection"},
        {"value": "headlight_restore", "label": "Headlight Restoration", "icon": "💡", "description": "Headlight cleaning"},
        {"value": "windshield_repair", "label": "Windshield Repair", "icon": "🪟", "description": "Chip repair services"},
        {"value": "convenience_store", "label": "Convenience Store", "icon": "🏪", "description": "Snacks, drinks, supplies"},
        {"value": "dog_wash", "label": "Pet Wash Station", "icon": "🐕", "description": "Self-service pet washing"},
        {"value": "ev_charging", "label": "EV Charging", "icon": "⚡", "description": "Electric vehicle charging"}
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE field_name = 'ancillaryServices' 
    AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash')
);

-- ============================================================================
-- EV CHARGING ENHANCEMENTS
-- ============================================================================

-- EV Charger Types - Enhance with detailed options
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    question_text = 'EV Charger Types to Install',
    help_text = 'Select all charger types you want',
    options = '[
        {"value": "l2_7kw", "label": "Level 2 - 7 kW", "icon": "🔌", "description": "Residential-style, 4-6 hr charge"},
        {"value": "l2_11kw", "label": "Level 2 - 11 kW", "icon": "🔌", "description": "Commercial L2, 3-4 hr charge"},
        {"value": "l2_19kw", "label": "Level 2 - 19 kW", "icon": "🔌", "description": "High-power L2, 2-3 hr charge"},
        {"value": "l2_22kw", "label": "Level 2 - 22 kW", "icon": "🔌", "description": "Max AC charging, 1.5-2 hr"},
        {"value": "dcfc_50kw", "label": "DCFC - 50 kW", "icon": "⚡", "description": "DC Fast, 45-60 min charge"},
        {"value": "dcfc_100kw", "label": "DCFC - 100 kW", "icon": "⚡", "description": "DC Fast, 30-45 min charge"},
        {"value": "dcfc_150kw", "label": "DCFC - 150 kW", "icon": "⚡", "description": "High-power DC, 20-30 min"},
        {"value": "dcfc_250kw", "label": "DCFC - 250 kW", "icon": "🚀", "description": "Ultra-fast, 15-20 min"},
        {"value": "hpc_350kw", "label": "HPC - 350 kW", "icon": "🚀", "description": "Hyper-fast, 10-15 min"},
        {"value": "tesla_sc", "label": "Tesla Supercharger", "icon": "🔴", "description": "Tesla proprietary"},
        {"value": "wireless", "label": "Wireless/Inductive", "icon": "📶", "description": "Contactless charging pad"}
    ]'::jsonb
WHERE field_name IN ('chargerTypes', 'evChargerType', 'chargerType')
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- EV Site Type - Add/update
UPDATE custom_questions
SET 
    options = '[
        {"value": "retail", "label": "Retail/Shopping", "icon": "🛒", "description": "Mall, shopping center"},
        {"value": "gas_station", "label": "Gas/Fuel Station", "icon": "⛽", "description": "Existing fuel station"},
        {"value": "parking_garage", "label": "Parking Garage", "icon": "🏢", "description": "Public parking structure"},
        {"value": "parking_lot", "label": "Surface Parking Lot", "icon": "🅿️", "description": "Open parking lot"},
        {"value": "fleet_depot", "label": "Fleet Depot", "icon": "🚚", "description": "Commercial fleet location"},
        {"value": "highway_corridor", "label": "Highway Corridor", "icon": "🛣️", "description": "Travel/rest stop"},
        {"value": "workplace", "label": "Workplace/Office", "icon": "🏢", "description": "Employee charging"},
        {"value": "multifamily", "label": "Multifamily Housing", "icon": "🏘️", "description": "Apartment/condo"},
        {"value": "hotel", "label": "Hotel/Hospitality", "icon": "🏨", "description": "Guest charging"},
        {"value": "dedicated_hub", "label": "Dedicated Charging Hub", "icon": "⚡", "description": "Purpose-built station"},
        {"value": "dealership", "label": "Auto Dealership", "icon": "🚗", "description": "Car dealer location"}
    ]'::jsonb,
    help_text = 'What type of location is this?'
WHERE field_name IN ('siteType', 'locationType')
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- EV Amenities - Add multiselect for customer amenities
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) 
SELECT 
    (SELECT id FROM use_cases WHERE slug = 'ev-charging'),
    'Customer Amenities',
    'multiselect',
    'customerAmenities',
    false,
    20,
    'Select amenities for charging customers',
    'Operations',
    '[
        {"value": "restrooms", "label": "Restrooms", "icon": "🚻", "description": "Public restrooms"},
        {"value": "food_court", "label": "Food Court/Restaurant", "icon": "🍽️", "description": "Dining options"},
        {"value": "coffee_shop", "label": "Coffee Shop", "icon": "☕", "description": "Café or coffee"},
        {"value": "convenience_store", "label": "Convenience Store", "icon": "🏪", "description": "Snacks and supplies"},
        {"value": "wifi", "label": "Free WiFi", "icon": "📶", "description": "WiFi connectivity"},
        {"value": "lounge", "label": "Waiting Lounge", "icon": "🛋️", "description": "Comfortable seating"},
        {"value": "covered", "label": "Covered/Canopy", "icon": "🏗️", "description": "Weather protection"},
        {"value": "lighting", "label": "Well-Lit Area", "icon": "💡", "description": "Security lighting"},
        {"value": "security", "label": "Security Cameras", "icon": "📷", "description": "24/7 surveillance"},
        {"value": "playground", "label": "Playground/Kids Area", "icon": "🎠", "description": "Children play area"},
        {"value": "pet_area", "label": "Pet Relief Area", "icon": "🐕", "description": "Dog walking area"}
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE field_name = 'customerAmenities' 
    AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging')
);

-- EV Payment Systems
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) 
SELECT 
    (SELECT id FROM use_cases WHERE slug = 'ev-charging'),
    'Payment & Network',
    'multiselect',
    'paymentNetwork',
    false,
    22,
    'Select payment and network options',
    'Operations',
    '[
        {"value": "credit_card", "label": "Credit Card Terminal", "icon": "💳", "description": "Tap/swipe payment"},
        {"value": "app_payment", "label": "Mobile App Payment", "icon": "📱", "description": "App-based payment"},
        {"value": "rfid", "label": "RFID Cards", "icon": "🎴", "description": "Membership cards"},
        {"value": "roaming", "label": "Roaming Network", "icon": "🌐", "description": "Cross-network access"},
        {"value": "subscription", "label": "Subscription Plans", "icon": "📋", "description": "Monthly memberships"},
        {"value": "free_charging", "label": "Free Charging", "icon": "🆓", "description": "Validated/free use"},
        {"value": "fleet_billing", "label": "Fleet Billing", "icon": "🚚", "description": "Corporate accounts"},
        {"value": "ocpp", "label": "OCPP Compatible", "icon": "🔗", "description": "Open charge protocol"}
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE field_name = 'paymentNetwork' 
    AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging')
);

-- ============================================================================
-- TRUCK STOP ENHANCEMENTS (heavy_duty_truck_stop)
-- ============================================================================

-- Truck Stop Services - Comprehensive multiselect
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    question_text = 'Truck Stop Services',
    help_text = 'Select all services offered at your facility',
    options = '[
        {"value": "diesel_fuel", "label": "Diesel Fuel", "icon": "⛽", "description": "Truck diesel pumps"},
        {"value": "def_fluid", "label": "DEF Fluid", "icon": "💧", "description": "Diesel exhaust fluid"},
        {"value": "truck_scales", "label": "CAT Scales", "icon": "⚖️", "description": "Certified truck scales"},
        {"value": "truck_wash", "label": "Truck Wash", "icon": "🚿", "description": "Commercial truck wash"},
        {"value": "truck_parking", "label": "Truck Parking", "icon": "🅿️", "description": "Overnight truck parking"},
        {"value": "reserved_parking", "label": "Reserved Parking", "icon": "📋", "description": "Pre-bookable spots"},
        {"value": "idleaire", "label": "IdleAire/Shore Power", "icon": "🔌", "description": "Truck electrification"},
        {"value": "tire_service", "label": "Tire Service", "icon": "🛞", "description": "Tire repair/replacement"},
        {"value": "repair_shop", "label": "Repair Shop", "icon": "🔧", "description": "Truck maintenance"},
        {"value": "roadside_assist", "label": "Roadside Assistance", "icon": "🚨", "description": "Emergency service"},
        {"value": "lumper_service", "label": "Lumper Services", "icon": "📦", "description": "Load/unload help"}
    ]'::jsonb
WHERE field_name IN ('truckServices', 'services')
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

-- Truck Stop Amenities
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) 
SELECT 
    (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop'),
    'Driver Amenities',
    'multiselect',
    'driverAmenities',
    false,
    10,
    'Select amenities for drivers',
    'Operations',
    '[
        {"value": "showers", "label": "Private Showers", "icon": "🚿", "description": "Truck driver showers"},
        {"value": "laundry", "label": "Laundry Facilities", "icon": "👕", "description": "Washer/dryer"},
        {"value": "tv_lounge", "label": "TV Lounge", "icon": "📺", "description": "Driver lounge"},
        {"value": "game_room", "label": "Game Room", "icon": "🎮", "description": "Recreation area"},
        {"value": "fitness", "label": "Fitness Center", "icon": "🏋️", "description": "Exercise equipment"},
        {"value": "wifi", "label": "Free WiFi", "icon": "📶", "description": "Internet access"},
        {"value": "business_center", "label": "Business Center", "icon": "💻", "description": "Computers/printing"},
        {"value": "chapel", "label": "Chapel", "icon": "⛪", "description": "Quiet worship space"},
        {"value": "barber", "label": "Barber Shop", "icon": "💈", "description": "Hair cutting"},
        {"value": "movie_theater", "label": "Movie Theater", "icon": "🎬", "description": "Film screenings"},
        {"value": "dog_park", "label": "Dog Park", "icon": "🐕", "description": "Pet exercise area"}
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE field_name = 'driverAmenities' 
    AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop')
);

-- Truck Stop Food Options
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) 
SELECT 
    (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop'),
    'Food & Dining',
    'multiselect',
    'foodOptions',
    false,
    12,
    'Select dining options available',
    'Operations',
    '[
        {"value": "convenience_store", "label": "Convenience Store", "icon": "🏪", "description": "Snacks and essentials"},
        {"value": "fast_food", "label": "Fast Food", "icon": "🍔", "description": "QSR restaurants"},
        {"value": "sit_down", "label": "Sit-Down Restaurant", "icon": "🍽️", "description": "Full-service dining"},
        {"value": "24hr_diner", "label": "24-Hour Diner", "icon": "🍳", "description": "Round-the-clock meals"},
        {"value": "buffet", "label": "Buffet", "icon": "🥗", "description": "All-you-can-eat"},
        {"value": "coffee_shop", "label": "Coffee Shop", "icon": "☕", "description": "Café/coffee bar"},
        {"value": "food_truck", "label": "Food Trucks", "icon": "🚚", "description": "Mobile food vendors"},
        {"value": "vending", "label": "Vending Machines", "icon": "🎰", "description": "24/7 vending"}
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE field_name = 'foodOptions' 
    AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop')
);

-- Truck Stop EV/Alternative Fuel
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) 
SELECT 
    (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop'),
    'Alternative Fuels & EV',
    'multiselect',
    'alternativeFuels',
    false,
    8,
    'Select alternative fuel options',
    'Infrastructure',
    '[
        {"value": "cng", "label": "CNG (Compressed Natural Gas)", "icon": "🔵", "description": "CNG fueling"},
        {"value": "lng", "label": "LNG (Liquefied Natural Gas)", "icon": "❄️", "description": "LNG fueling"},
        {"value": "hydrogen", "label": "Hydrogen", "icon": "💨", "description": "H2 fuel cell"},
        {"value": "ev_l2", "label": "EV Level 2 (Cars)", "icon": "🔌", "description": "Passenger EV charging"},
        {"value": "ev_dcfc", "label": "EV DCFC (Cars)", "icon": "⚡", "description": "Fast charging cars"},
        {"value": "ev_megawatt", "label": "Megawatt Charging (Trucks)", "icon": "🚛", "description": "Heavy-duty EV charging"},
        {"value": "biodiesel", "label": "Biodiesel", "icon": "🌿", "description": "B20/B100 biodiesel"},
        {"value": "propane", "label": "Propane/Autogas", "icon": "🔥", "description": "LPG fueling"}
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE field_name = 'alternativeFuels' 
    AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop')
);

-- ============================================================================
-- DATA CENTER ENHANCEMENTS
-- ============================================================================

-- Data Center Tier - Update with standard Uptime tiers
UPDATE custom_questions
SET 
    options = '[
        {"value": "tier1", "label": "Tier I - Basic", "icon": "🏢", "description": "99.671% uptime, no redundancy"},
        {"value": "tier2", "label": "Tier II - Redundant", "icon": "🏗️", "description": "99.741% uptime, partial redundancy"},
        {"value": "tier3", "label": "Tier III - Concurrently Maintainable", "icon": "🏛️", "description": "99.982% uptime, N+1 redundancy"},
        {"value": "tier4", "label": "Tier IV - Fault Tolerant", "icon": "🏰", "description": "99.995% uptime, 2N redundancy"},
        {"value": "edge", "label": "Edge/Micro Data Center", "icon": "📡", "description": "Distributed edge facility"},
        {"value": "colocation", "label": "Colocation Facility", "icon": "🔗", "description": "Multi-tenant colo"}
    ]'::jsonb,
    help_text = 'Select data center tier classification (Uptime Institute standard)'
WHERE field_name IN ('dataCenterTier', 'tier', 'facilityTier')
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- Data Center Cooling Systems - Multiselect
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    question_text = 'Cooling Systems',
    help_text = 'Select all cooling technologies used',
    options = '[
        {"value": "crac", "label": "CRAC Units", "icon": "❄️", "description": "Computer room AC"},
        {"value": "crah", "label": "CRAH Units", "icon": "🌬️", "description": "Computer room air handlers"},
        {"value": "chilled_water", "label": "Chilled Water Plant", "icon": "💧", "description": "Central chiller plant"},
        {"value": "hot_cold_aisle", "label": "Hot/Cold Aisle Containment", "icon": "🔲", "description": "Aisle containment"},
        {"value": "in_row", "label": "In-Row Cooling", "icon": "📏", "description": "Between-rack cooling"},
        {"value": "rear_door", "label": "Rear Door Heat Exchangers", "icon": "🚪", "description": "Rack-level cooling"},
        {"value": "liquid_cooling", "label": "Direct Liquid Cooling", "icon": "💦", "description": "CPU/GPU liquid cooling"},
        {"value": "immersion", "label": "Immersion Cooling", "icon": "🛁", "description": "Full immersion"},
        {"value": "free_cooling", "label": "Free Cooling/Economizer", "icon": "🌿", "description": "Outside air cooling"},
        {"value": "evaporative", "label": "Evaporative Cooling", "icon": "💨", "description": "Evap/swamp cooling"}
    ]'::jsonb
WHERE field_name IN ('coolingType', 'coolingSystem', 'hvacType')
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- Data Center Power Infrastructure - Multiselect
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) 
SELECT 
    (SELECT id FROM use_cases WHERE slug = 'data-center'),
    'Power Infrastructure',
    'multiselect',
    'powerInfrastructure',
    true,
    8,
    'Select power systems in place',
    'Infrastructure',
    '[
        {"value": "utility_single", "label": "Single Utility Feed", "icon": "🔌", "description": "One utility connection"},
        {"value": "utility_dual", "label": "Dual Utility Feeds", "icon": "⚡", "description": "Two independent feeds"},
        {"value": "ups_modular", "label": "Modular UPS", "icon": "🔋", "description": "Scalable UPS system"},
        {"value": "ups_rotary", "label": "Rotary UPS", "icon": "🔄", "description": "Flywheel UPS"},
        {"value": "ups_static", "label": "Static UPS", "icon": "📦", "description": "Traditional battery UPS"},
        {"value": "generator_diesel", "label": "Diesel Generators", "icon": "⛽", "description": "Diesel backup"},
        {"value": "generator_gas", "label": "Natural Gas Generators", "icon": "🔥", "description": "NG backup"},
        {"value": "fuel_cell", "label": "Fuel Cells", "icon": "💨", "description": "Hydrogen/NG fuel cell"},
        {"value": "battery_storage", "label": "Battery Storage (BESS)", "icon": "🔋", "description": "Grid-scale battery"},
        {"value": "solar_onsite", "label": "On-site Solar", "icon": "☀️", "description": "Rooftop/ground solar"},
        {"value": "ppa_renewable", "label": "Renewable PPA", "icon": "🌿", "description": "Offsite renewable contract"}
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE field_name = 'powerInfrastructure' 
    AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
);

-- Data Center IT Load Types
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) 
SELECT 
    (SELECT id FROM use_cases WHERE slug = 'data-center'),
    'Primary Workloads',
    'multiselect',
    'workloadTypes',
    false,
    12,
    'Select primary workload types',
    'Operations',
    '[
        {"value": "enterprise", "label": "Enterprise Applications", "icon": "🏢", "description": "Business apps, ERP"},
        {"value": "cloud", "label": "Cloud/IaaS", "icon": "☁️", "description": "Cloud infrastructure"},
        {"value": "ai_ml", "label": "AI/ML Training", "icon": "🤖", "description": "Machine learning"},
        {"value": "hpc", "label": "High-Performance Computing", "icon": "🖥️", "description": "Scientific computing"},
        {"value": "blockchain", "label": "Blockchain/Crypto", "icon": "🔗", "description": "Cryptocurrency mining"},
        {"value": "streaming", "label": "Media Streaming", "icon": "📺", "description": "Video/audio delivery"},
        {"value": "gaming", "label": "Gaming/Metaverse", "icon": "🎮", "description": "Game servers"},
        {"value": "financial", "label": "Financial Trading", "icon": "📈", "description": "Low-latency trading"},
        {"value": "healthcare", "label": "Healthcare/HIPAA", "icon": "🏥", "description": "Medical data"},
        {"value": "government", "label": "Government/FedRAMP", "icon": "🏛️", "description": "Gov compliance"}
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE field_name = 'workloadTypes' 
    AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
);

-- Data Center Sustainability Goals
INSERT INTO custom_questions (
    use_case_id, question_text, question_type, field_name, 
    is_required, display_order, help_text, section_name, options
) 
SELECT 
    (SELECT id FROM use_cases WHERE slug = 'data-center'),
    'Sustainability Goals',
    'multiselect',
    'sustainabilityGoals',
    false,
    25,
    'Select sustainability objectives',
    'Goals',
    '[
        {"value": "carbon_neutral", "label": "Carbon Neutral", "icon": "🌍", "description": "Net-zero carbon"},
        {"value": "100_renewable", "label": "100% Renewable Energy", "icon": "☀️", "description": "RE100 commitment"},
        {"value": "water_positive", "label": "Water Positive", "icon": "💧", "description": "Net water benefit"},
        {"value": "pue_target", "label": "PUE < 1.2 Target", "icon": "📊", "description": "Ultra-efficient PUE"},
        {"value": "waste_heat", "label": "Waste Heat Recovery", "icon": "♨️", "description": "Heat reuse program"},
        {"value": "circular_economy", "label": "Circular Economy", "icon": "♻️", "description": "E-waste recycling"},
        {"value": "leed_certified", "label": "LEED Certification", "icon": "🏅", "description": "Green building cert"},
        {"value": "science_based", "label": "Science-Based Targets", "icon": "🔬", "description": "SBTi commitment"}
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE field_name = 'sustainabilityGoals' 
    AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
);

-- ============================================================================
-- VERIFY: Show question counts for all four industries
-- ============================================================================
SELECT 
    uc.slug,
    COUNT(*) as question_count
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug IN ('car-wash', 'ev-charging', 'heavy_duty_truck_stop', 'data-center')
GROUP BY uc.slug
ORDER BY uc.slug;
