-- =============================================================================
-- ADD CUSTOM QUESTIONS FOR ALL USE CASES (FAST VERSION)
-- Single batch insert per use case - no subqueries
-- =============================================================================

-- Get use case IDs first
DO $$
DECLARE
    carwash_id UUID;
    warehouse_id UUID;
    apartment_id UUID;
    gasstation_id UUID;
    hospital_id UUID;
    datacenter_id UUID;
    farm_id UUID;
    hotel_id UUID;
    hotel_hospitality_id UUID;
    office_id UUID;
    manufacturing_id UUID;
    college_id UUID;
    government_id UUID;
    ev_charging_id UUID;
    shopping_center_id UUID;
    residential_id UUID;
    retail_id UUID;
    microgrid_id UUID;
BEGIN
    -- Fetch all IDs using actual slugs from database
    SELECT id INTO carwash_id FROM use_cases WHERE slug = 'car-wash';
    SELECT id INTO warehouse_id FROM use_cases WHERE slug = 'warehouse' OR slug = 'distribution-center';
    SELECT id INTO apartment_id FROM use_cases WHERE slug = 'apartments' OR slug = 'apartment-building';
    SELECT id INTO gasstation_id FROM use_cases WHERE slug = 'gas-station';
    SELECT id INTO hospital_id FROM use_cases WHERE slug = 'hospital';
    SELECT id INTO datacenter_id FROM use_cases WHERE slug = 'data-center' OR slug = 'edge-data-center';
    SELECT id INTO farm_id FROM use_cases WHERE slug = 'indoor-farm';
    SELECT id INTO hotel_id FROM use_cases WHERE slug = 'hotel';
    SELECT id INTO hotel_hospitality_id FROM use_cases WHERE slug = 'hotel-hospitality';
    SELECT id INTO office_id FROM use_cases WHERE slug = 'office';
    SELECT id INTO manufacturing_id FROM use_cases WHERE slug = 'manufacturing';
    SELECT id INTO college_id FROM use_cases WHERE slug = 'college' OR slug = 'university';
    SELECT id INTO government_id FROM use_cases WHERE slug = 'government' OR slug = 'public-building';
    SELECT id INTO ev_charging_id FROM use_cases WHERE slug = 'ev-charging';
    SELECT id INTO shopping_center_id FROM use_cases WHERE slug = 'shopping-center';
    SELECT id INTO residential_id FROM use_cases WHERE slug = 'residential';
    SELECT id INTO retail_id FROM use_cases WHERE slug = 'retail';
    SELECT id INTO microgrid_id FROM use_cases WHERE slug = 'microgrid';
    
    -- Car Wash questions
    IF carwash_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = carwash_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (carwash_id, 'How many wash bays do you have?', 'bayCount', 'number', '4', 1, 20, true, 'Number of active car wash bays', 1),
        (carwash_id, 'Wash type', 'washType', 'select', 'automatic', null, null, true, 'Type of car wash operation', 2),
        (carwash_id, 'Average cars washed per day', 'carsPerDay', 'number', '150', 20, 1000, true, 'Daily vehicle throughput', 3),
        (carwash_id, 'Operating hours per day', 'hoursPerDay', 'number', '12', 6, 24, true, 'Hours open to customers', 4),
        (carwash_id, 'Water heater capacity (gallons)', 'waterHeaterGallons', 'number', '500', 100, 2000, false, 'Hot water storage capacity', 5),
        (carwash_id, 'Do you have detailing services?', 'hasDetailing', 'boolean', 'false', null, null, false, 'Interior detailing adds equipment load', 6),
        (carwash_id, 'Do you have vacuum stations?', 'hasVacuums', 'boolean', 'true', null, null, false, 'Self-service vacuum equipment', 7),
        (carwash_id, 'Total facility square footage', 'facilitySqFt', 'number', '5000', 1000, 20000, false, 'Building footprint including waiting area', 8);
        
        UPDATE custom_questions SET options = '[
            {"value": "automatic", "label": "Automatic/Touchless", "description": "Automated wash equipment, high water/power use"},
            {"value": "self_service", "label": "Self-Service", "description": "Customer-operated wand wash bays"},
            {"value": "hand_wash", "label": "Hand Wash", "description": "Manual washing by staff"},
            {"value": "express_tunnel", "label": "Express Tunnel", "description": "High-volume conveyor tunnel wash"}
        ]'::jsonb WHERE field_name = 'washType' AND use_case_id = carwash_id;
        RAISE NOTICE '✅ Added 8 questions for Car Wash';
    END IF;
    
    -- Warehouse/Distribution Center questions
    IF warehouse_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = warehouse_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (warehouse_id, 'Total warehouse square footage', 'warehouseSqFt', 'number', '250000', 10000, 2000000, true, 'Total distribution center area', 1),
        (warehouse_id, 'Ceiling height (feet)', 'ceilingHeight', 'number', '32', 12, 60, true, 'Affects lighting and HVAC needs', 2),
        (warehouse_id, 'Number of loading docks', 'dockCount', 'number', '20', 2, 100, true, 'Active loading/unloading positions', 3),
        (warehouse_id, 'Operating shifts per day', 'shiftsPerDay', 'number', '2', 1, 3, true, 'Number of work shifts', 4),
        (warehouse_id, 'Do you have refrigerated sections?', 'hasRefrigeration', 'boolean', 'false', null, null, false, 'Cold storage significantly increases energy use', 5),
        (warehouse_id, 'Refrigerated area percentage', 'refrigeratedPercent', 'number', '0', 0, 100, false, 'Percentage of warehouse that is climate-controlled', 6),
        (warehouse_id, 'Warehouse type', 'warehouseType', 'select', 'distribution', null, null, true, 'Primary warehouse function', 7),
        (warehouse_id, 'Material handling equipment', 'materialHandling', 'select', 'forklifts', null, null, false, 'Primary equipment for moving inventory', 8),
        (warehouse_id, 'Do you have automated systems?', 'hasAutomation', 'boolean', 'false', null, null, false, 'Robotics, conveyor systems, automated storage', 9);
        
        UPDATE custom_questions SET options = '[
            {"value": "distribution", "label": "Distribution Center", "description": "Cross-dock and shipping operations"},
            {"value": "storage", "label": "Storage/Fulfillment", "description": "Long-term storage and order fulfillment"},
            {"value": "manufacturing", "label": "Manufacturing Support", "description": "Raw materials and work-in-progress"},
            {"value": "cold_storage", "label": "Cold Storage", "description": "Refrigerated or frozen goods"}
        ]'::jsonb WHERE field_name = 'warehouseType' AND use_case_id = warehouse_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "forklifts", "label": "Forklifts", "description": "Standard forklift operations"},
            {"value": "reach_trucks", "label": "Reach Trucks", "description": "High-reach narrow aisle equipment"},
            {"value": "conveyors", "label": "Conveyor Systems", "description": "Automated material movement"},
            {"value": "agv", "label": "AGVs/Robotics", "description": "Automated guided vehicles"}
        ]'::jsonb WHERE field_name = 'materialHandling' AND use_case_id = warehouse_id;
        RAISE NOTICE '✅ Added 9 questions for Warehouse';
    END IF;
    
    -- Apartment Building questions
    IF apartment_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = apartment_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (apartment_id, 'Number of units', 'unitCount', 'number', '400', 20, 2000, true, 'Total residential units', 1),
        (apartment_id, 'Number of buildings', 'buildingCount', 'number', '4', 1, 50, true, 'Separate buildings on property', 2),
        (apartment_id, 'Average unit size (sq ft)', 'avgUnitSqFt', 'number', '900', 400, 3000, false, 'Average apartment size', 3),
        (apartment_id, 'Building stories/floors', 'floorCount', 'number', '4', 1, 30, false, 'Average number of floors per building', 4),
        (apartment_id, 'Common amenities level', 'amenitiesLevel', 'select', 'standard', null, null, true, 'Level of shared amenities', 5),
        (apartment_id, 'Do you have a fitness center?', 'hasFitness', 'boolean', 'true', null, null, false, 'Fitness equipment adds significant load', 6),
        (apartment_id, 'Do you have a pool?', 'hasPool', 'boolean', 'false', null, null, false, 'Pool heating and filtration increase energy use', 7),
        (apartment_id, 'Do you have EV charging?', 'hasEVCharging', 'boolean', 'true', null, null, false, 'EV charging stations for residents', 8),
        (apartment_id, 'Number of EV chargers', 'evChargerCount', 'number', '20', 0, 500, false, 'Total EV charging stations', 9),
        (apartment_id, 'Laundry setup', 'laundryType', 'select', 'central', null, null, false, 'How laundry is provided', 10);
        
        UPDATE custom_questions SET options = '[
            {"value": "basic", "label": "Basic", "description": "Minimal shared amenities"},
            {"value": "standard", "label": "Standard", "description": "Fitness center, common room, laundry"},
            {"value": "luxury", "label": "Luxury", "description": "Pool, spa, multiple gyms, co-working spaces"}
        ]'::jsonb WHERE field_name = 'amenitiesLevel' AND use_case_id = apartment_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "in_unit", "label": "In-Unit", "description": "Washer/dryer in each apartment"},
            {"value": "central", "label": "Central Laundry", "description": "Shared laundry room per building"},
            {"value": "none", "label": "None", "description": "No on-site laundry facilities"}
        ]'::jsonb WHERE field_name = 'laundryType' AND use_case_id = apartment_id;
        RAISE NOTICE '✅ Added 10 questions for Apartment Building';
    END IF;
    
    -- Gas Station questions
    IF gasstation_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = gasstation_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (gasstation_id, 'Number of fuel dispensers', 'dispenserCount', 'number', '8', 2, 32, true, 'Total fuel pump positions', 1),
        (gasstation_id, 'Station type', 'stationType', 'select', 'standard', null, null, true, 'Type of fuel station operation', 2),
        (gasstation_id, 'Operating hours per day', 'hoursPerDay', 'number', '24', 6, 24, true, 'Hours station is open', 3),
        (gasstation_id, 'Do you have a convenience store?', 'hasConvStore', 'boolean', 'true', null, null, true, 'Convenience store adds retail load', 4),
        (gasstation_id, 'Store square footage', 'storeSqFt', 'number', '3000', 0, 10000, false, 'Convenience store area', 5),
        (gasstation_id, 'Do you have a car wash?', 'hasCarWash', 'boolean', 'false', null, null, false, 'On-site car wash facility', 6),
        (gasstation_id, 'Do you have EV fast chargers?', 'hasEVChargers', 'boolean', 'false', null, null, false, 'DC fast charging adds significant load', 7),
        (gasstation_id, 'Number of EV chargers', 'evChargerCount', 'number', '0', 0, 20, false, 'Number of EV charging stations', 8),
        (gasstation_id, 'Do you have food service?', 'hasFoodService', 'boolean', 'false', null, null, false, 'Restaurant, deli, or food preparation', 9);
        
        UPDATE custom_questions SET options = '[
            {"value": "standard", "label": "Standard Station", "description": "Basic fuel and convenience store"},
            {"value": "truck_stop", "label": "Truck Stop", "description": "Large format with diesel, food service"},
            {"value": "highway_plaza", "label": "Highway Service Plaza", "description": "Multiple restaurants and amenities"},
            {"value": "urban_express", "label": "Urban Express", "description": "Compact urban station"}
        ]'::jsonb WHERE field_name = 'stationType' AND use_case_id = gasstation_id;
        RAISE NOTICE '✅ Added 9 questions for Gas Station';
    END IF;
    
    -- Hospital questions
    IF hospital_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = hospital_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (hospital_id, 'Number of beds', 'bedCount', 'number', '250', 20, 2000, true, 'Total licensed beds', 1),
        (hospital_id, 'Total building square footage', 'buildingSqFt', 'number', '500000', 50000, 5000000, true, 'Total facility area', 2),
        (hospital_id, 'Facility type', 'facilityType', 'select', 'general_acute', null, null, true, 'Type of healthcare facility', 3),
        (hospital_id, 'Number of operating rooms', 'operatingRooms', 'number', '8', 0, 50, false, 'Surgical suites with high energy requirements', 4),
        (hospital_id, 'Do you have an emergency department?', 'hasER', 'boolean', 'true', null, null, false, 'ER operates 24/7 with critical power needs', 5),
        (hospital_id, 'Do you have imaging equipment?', 'hasImaging', 'boolean', 'true', null, null, false, 'MRI, CT, X-ray equipment', 6),
        (hospital_id, 'Is backup power critical?', 'backupPowerRequired', 'boolean', 'true', null, null, true, 'Hospitals require reliable backup power', 7),
        (hospital_id, 'Current backup power system', 'backupSystem', 'select', 'generators', null, null, false, 'Existing emergency power infrastructure', 8),
        (hospital_id, 'Average daily patient census', 'dailyCensus', 'number', '200', 10, 1800, false, 'Typical number of patients per day', 9);
        
        UPDATE custom_questions SET options = '[
            {"value": "general_acute", "label": "General Acute Care", "description": "Standard hospital services"},
            {"value": "specialty", "label": "Specialty Hospital", "description": "Cardiac, orthopedic, or other specialty"},
            {"value": "teaching", "label": "Teaching Hospital", "description": "Academic medical center"},
            {"value": "critical_access", "label": "Critical Access", "description": "Rural or community hospital"}
        ]'::jsonb WHERE field_name = 'facilityType' AND use_case_id = hospital_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "generators", "label": "Diesel Generators", "description": "Traditional generator backup"},
            {"value": "ups", "label": "UPS Systems", "description": "Uninterruptible power supply"},
            {"value": "combined", "label": "Combined System", "description": "UPS + generators"},
            {"value": "none", "label": "Limited/None", "description": "Minimal backup power"}
        ]'::jsonb WHERE field_name = 'backupSystem' AND use_case_id = hospital_id;
        RAISE NOTICE '✅ Added 9 questions for Hospital';
    END IF;
    
    -- Data Center questions
    IF datacenter_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = datacenter_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (datacenter_id, 'Total IT load (kW)', 'itLoadKW', 'number', '2000', 100, 10000, true, 'Total IT equipment power draw', 1),
        (datacenter_id, 'Number of server racks', 'rackCount', 'number', '50', 5, 500, true, 'Total equipment racks', 2),
        (datacenter_id, 'Average rack density (kW)', 'rackDensityKW', 'number', '8', 2, 30, false, 'Power per rack', 3),
        (datacenter_id, 'Data center type', 'datacenterType', 'select', 'colocation', null, null, true, 'Facility purpose and configuration', 4),
        (datacenter_id, 'Cooling system type', 'coolingType', 'select', 'crac', null, null, true, 'Primary cooling infrastructure', 5),
        (datacenter_id, 'PUE target', 'pueTarget', 'number', '1.5', 1.1, 2.5, false, 'Power Usage Effectiveness ratio', 6),
        (datacenter_id, 'Uptime tier requirement', 'uptimeTier', 'select', 'tier_3', null, null, true, 'Uptime Institute tier classification', 7),
        (datacenter_id, 'Do you have UPS systems?', 'hasUPS', 'boolean', 'true', null, null, false, 'Uninterruptible power supply for backup', 8),
        (datacenter_id, 'Operating hours', 'operatingHours', 'select', '24x7', null, null, true, 'Data center availability schedule', 9);
        
        UPDATE custom_questions SET options = '[
            {"value": "colocation", "label": "Colocation", "description": "Multi-tenant hosting facility"},
            {"value": "enterprise", "label": "Enterprise", "description": "Single company private datacenter"},
            {"value": "edge", "label": "Edge Computing", "description": "Distributed edge location"},
            {"value": "hyperscale", "label": "Hyperscale", "description": "Large-scale cloud provider facility"}
        ]'::jsonb WHERE field_name = 'datacenterType' AND use_case_id = datacenter_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "crac", "label": "CRAC Units", "description": "Computer Room Air Conditioning"},
            {"value": "crah", "label": "CRAH Units", "description": "Computer Room Air Handlers"},
            {"value": "liquid", "label": "Liquid Cooling", "description": "Direct liquid cooling systems"},
            {"value": "free_cooling", "label": "Free Cooling", "description": "Economizer/outdoor air cooling"}
        ]'::jsonb WHERE field_name = 'coolingType' AND use_case_id = datacenter_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "tier_1", "label": "Tier 1", "description": "99.671% uptime, basic capacity"},
            {"value": "tier_2", "label": "Tier 2", "description": "99.741% uptime, redundant components"},
            {"value": "tier_3", "label": "Tier 3", "description": "99.982% uptime, concurrently maintainable"},
            {"value": "tier_4", "label": "Tier 4", "description": "99.995% uptime, fault-tolerant"}
        ]'::jsonb WHERE field_name = 'uptimeTier' AND use_case_id = datacenter_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "24x7", "label": "24/7/365", "description": "Continuous operations"},
            {"value": "business_hours", "label": "Business Hours", "description": "M-F daytime operations"},
            {"value": "extended", "label": "Extended Hours", "description": "16-18 hours per day"}
        ]'::jsonb WHERE field_name = 'operatingHours' AND use_case_id = datacenter_id;
        RAISE NOTICE '✅ Added 9 questions for Data Center';
    END IF;
    
    -- Indoor Farm questions
    IF farm_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = farm_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (farm_id, 'Total growing area (sq ft)', 'growingAreaSqFt', 'number', '50000', 5000, 200000, true, 'Total area under grow lights', 1),
        (farm_id, 'Number of growing levels', 'growingLevels', 'number', '6', 1, 20, false, 'Vertical tiers in growing system', 2),
        (farm_id, 'Growing method', 'growingMethod', 'select', 'vertical_farming', null, null, true, 'Different methods have different power needs', 3),
        (farm_id, 'Crop type', 'cropType', 'select', 'leafy_greens', null, null, true, 'Primary crops grown', 4),
        (farm_id, 'Daily light hours', 'lightHours', 'number', '18', 12, 24, true, 'Hours per day grow lights operate', 5),
        (farm_id, 'LED wattage per sq ft', 'ledWattagePerSqFt', 'number', '40', 20, 80, false, 'Lighting power density', 6),
        (farm_id, 'Climate control type', 'climateControl', 'select', 'full_hvac', null, null, true, 'Level of environmental control', 7),
        (farm_id, 'Target temperature (°F)', 'targetTemp', 'number', '72', 60, 85, false, 'Optimal growing temperature', 8),
        (farm_id, 'Do you have CO2 supplementation?', 'hasCO2', 'boolean', 'true', null, null, false, 'CO2 injection for plant growth', 9);
        
        UPDATE custom_questions SET options = '[
            {"value": "vertical_farming", "label": "Vertical Farming", "description": "High-density vertical growing systems"},
            {"value": "greenhouse_hybrid", "label": "Greenhouse Hybrid", "description": "Greenhouse with supplemental LED lighting"},
            {"value": "container_farming", "label": "Container Farming", "description": "Shipping container-based growing"},
            {"value": "warehouse_conversion", "label": "Warehouse Conversion", "description": "Converted warehouse space"}
        ]'::jsonb WHERE field_name = 'growingMethod' AND use_case_id = farm_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "leafy_greens", "label": "Leafy Greens", "description": "Lettuce, kale, herbs"},
            {"value": "fruiting_crops", "label": "Fruiting Crops", "description": "Tomatoes, peppers, strawberries"},
            {"value": "microgreens", "label": "Microgreens", "description": "Fast-growing microgreens"},
            {"value": "mixed", "label": "Mixed Crops", "description": "Variety of crop types"}
        ]'::jsonb WHERE field_name = 'cropType' AND use_case_id = farm_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "full_hvac", "label": "Full HVAC", "description": "Complete climate control system"},
            {"value": "ventilation_only", "label": "Ventilation Only", "description": "Air circulation without full climate control"},
            {"value": "passive_cooling", "label": "Passive Cooling", "description": "Natural ventilation and cooling"}
        ]'::jsonb WHERE field_name = 'climateControl' AND use_case_id = farm_id;
        RAISE NOTICE '✅ Added 9 questions for Indoor Farm';
    END IF;
    
    -- Hotel questions
    IF hotel_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = hotel_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (hotel_id, 'Number of guest rooms', 'roomCount', 'number', '150', 10, 1000, true, 'Total guest rooms', 1),
        (hotel_id, 'Total building square footage', 'squareFeet', 'number', '75000', 5000, 500000, true, 'Total interior space including common areas', 2),
        (hotel_id, 'Hotel classification', 'hotelClass', 'select', 'upscale', null, null, true, 'Hotel category affects amenities and energy use', 3),
        (hotel_id, 'Number of floors', 'floorCount', 'number', '6', 1, 50, false, 'Building height', 4),
        (hotel_id, 'Average occupancy rate (%)', 'occupancyRate', 'number', '70', 30, 100, false, 'Percentage of rooms occupied on average', 5),
        (hotel_id, 'Do you have a restaurant?', 'hasRestaurant', 'boolean', 'true', null, null, false, 'Restaurants add significant kitchen loads', 6),
        (hotel_id, 'Do you have meeting/conference space?', 'hasMeetingSpace', 'boolean', 'true', null, null, false, 'Ballrooms and conference rooms', 7),
        (hotel_id, 'Do you have a fitness center?', 'hasFitness', 'boolean', 'true', null, null, false, 'Gym equipment and climate control', 8),
        (hotel_id, 'Do you have a laundry facility?', 'hasLaundry', 'boolean', 'true', null, null, false, 'On-site laundry increases energy use', 9),
        (hotel_id, 'Do you have a pool or spa?', 'hasPool', 'boolean', 'false', null, null, false, 'Pool heating and filtration equipment', 10);
        
        UPDATE custom_questions SET options = '[
            {"value": "budget", "label": "Budget/Economy", "description": "Limited services, basic amenities"},
            {"value": "midscale", "label": "Midscale", "description": "Moderate amenities and services"},
            {"value": "upscale", "label": "Upscale/Full Service", "description": "Full amenities, restaurant, room service"},
            {"value": "luxury", "label": "Luxury", "description": "High-end amenities, spa, fine dining"}
        ]'::jsonb WHERE field_name = 'hotelClass' AND use_case_id = hotel_id;
        RAISE NOTICE '✅ Added 10 questions for Hotel';
    END IF;
    
    -- Office Building questions
    IF office_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = office_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (office_id, 'Total office square footage', 'officeSqFt', 'number', '50000', 5000, 1000000, true, 'Total rentable office space', 1),
        (office_id, 'Number of floors', 'floorCount', 'number', '5', 1, 50, true, 'Building stories', 2),
        (office_id, 'Building class', 'buildingClass', 'select', 'class_b', null, null, true, 'Office building quality classification', 3),
        (office_id, 'Typical occupancy (people)', 'occupancy', 'number', '200', 10, 5000, false, 'Average number of workers', 4),
        (office_id, 'Building type', 'buildingType', 'select', 'multi_tenant', null, null, true, 'Office building configuration', 5),
        (office_id, 'Operating hours per day', 'hoursPerDay', 'number', '12', 8, 24, false, 'Hours building is actively occupied', 6),
        (office_id, 'Do you have a data room?', 'hasDataRoom', 'boolean', 'false', null, null, false, 'Server rooms add cooling load', 7),
        (office_id, 'Do you have a cafeteria/kitchen?', 'hasCafeteria', 'boolean', 'false', null, null, false, 'Food service equipment', 8),
        (office_id, 'Parking structure', 'parkingType', 'select', 'surface', null, null, false, 'Parking facility type', 9),
        (office_id, 'Do you have EV charging?', 'hasEVCharging', 'boolean', 'false', null, null, false, 'EV charging for employees/visitors', 10);
        
        UPDATE custom_questions SET options = '[
            {"value": "class_a", "label": "Class A", "description": "Premium building, top amenities"},
            {"value": "class_b", "label": "Class B", "description": "Good quality, competitive rents"},
            {"value": "class_c", "label": "Class C", "description": "Older building, functional space"}
        ]'::jsonb WHERE field_name = 'buildingClass' AND use_case_id = office_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "single_tenant", "label": "Single Tenant", "description": "One company occupies entire building"},
            {"value": "multi_tenant", "label": "Multi-Tenant", "description": "Multiple companies share building"},
            {"value": "flex_space", "label": "Flex Space", "description": "Mixed office and light industrial"},
            {"value": "medical_office", "label": "Medical Office", "description": "Healthcare office building"}
        ]'::jsonb WHERE field_name = 'buildingType' AND use_case_id = office_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "surface", "label": "Surface Parking", "description": "Ground-level parking lot"},
            {"value": "garage", "label": "Parking Garage", "description": "Multi-level parking structure"},
            {"value": "underground", "label": "Underground", "description": "Below-grade parking"},
            {"value": "none", "label": "None", "description": "No on-site parking"}
        ]'::jsonb WHERE field_name = 'parkingType' AND use_case_id = office_id;
        RAISE NOTICE '✅ Added 10 questions for Office Building';
    END IF;
    
    -- Manufacturing Facility questions
    IF manufacturing_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = manufacturing_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (manufacturing_id, 'Facility square footage', 'facilitySqFt', 'number', '100000', 10000, 1000000, true, 'Total production facility area', 1),
        (manufacturing_id, 'Manufacturing type', 'manufacturingType', 'select', 'light_assembly', null, null, true, 'Type of manufacturing affects energy needs', 2),
        (manufacturing_id, 'Production shifts per day', 'shiftsPerDay', 'number', '2', 1, 3, true, 'Number of production shifts', 3),
        (manufacturing_id, 'Peak power demand (kW)', 'peakDemandKW', 'number', '2000', 100, 20000, false, 'Maximum power draw during production', 4),
        (manufacturing_id, 'Do you have heavy machinery?', 'hasHeavyMachinery', 'boolean', 'true', null, null, false, 'Large motors, presses, CNC equipment', 5),
        (manufacturing_id, 'Do you have process heating?', 'hasProcessHeating', 'boolean', 'false', null, null, false, 'Furnaces, ovens, heat treatment', 6),
        (manufacturing_id, 'Do you have compressed air systems?', 'hasCompressedAir', 'boolean', 'true', null, null, false, 'Pneumatic tools and equipment', 7),
        (manufacturing_id, 'Climate control requirements', 'climateControl', 'select', 'standard', null, null, false, 'Environmental control needs', 8),
        (manufacturing_id, 'Do you have clean room areas?', 'hasCleanRoom', 'boolean', 'false', null, null, false, 'Specialized HVAC and filtration', 9);
        
        UPDATE custom_questions SET options = '[
            {"value": "light_assembly", "label": "Light Assembly", "description": "Electronics, small parts assembly"},
            {"value": "heavy_manufacturing", "label": "Heavy Manufacturing", "description": "Metal fabrication, machining"},
            {"value": "food_processing", "label": "Food Processing", "description": "Food manufacturing and packaging"},
            {"value": "chemical", "label": "Chemical Processing", "description": "Chemical and pharmaceutical production"},
            {"value": "automotive", "label": "Automotive", "description": "Vehicle assembly and parts"}
        ]'::jsonb WHERE field_name = 'manufacturingType' AND use_case_id = manufacturing_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "standard", "label": "Standard", "description": "Basic heating and ventilation"},
            {"value": "controlled", "label": "Controlled Environment", "description": "Precise temperature and humidity control"},
            {"value": "minimal", "label": "Minimal", "description": "Natural ventilation, limited climate control"}
        ]'::jsonb WHERE field_name = 'climateControl' AND use_case_id = manufacturing_id;
        RAISE NOTICE '✅ Added 9 questions for Manufacturing';
    END IF;
    
    -- College/University questions
    IF college_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = college_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (college_id, 'Number of students', 'studentCount', 'number', '15000', 500, 100000, true, 'Total enrolled students', 1),
        (college_id, 'Total campus area (sq ft)', 'campusSqFt', 'number', '2000000', 100000, 20000000, true, 'Total building square footage', 2),
        (college_id, 'Number of buildings', 'buildingCount', 'number', '25', 5, 200, false, 'Academic and support buildings', 3),
        (college_id, 'Campus type', 'campusType', 'select', 'comprehensive', null, null, true, 'Type of institution', 4),
        (college_id, 'Do you have on-campus housing?', 'hasHousing', 'boolean', 'true', null, null, true, 'Dormitories increase energy load', 5),
        (college_id, 'Number of resident students', 'residentCount', 'number', '5000', 0, 50000, false, 'Students living on campus', 6),
        (college_id, 'Do you have research labs?', 'hasLabs', 'boolean', 'true', null, null, false, 'Labs have specialized HVAC and equipment', 7),
        (college_id, 'Do you have dining halls?', 'hasDining', 'boolean', 'true', null, null, false, 'Food service facilities', 8),
        (college_id, 'Do you have athletic facilities?', 'hasAthletics', 'boolean', 'true', null, null, false, 'Gyms, pools, stadiums', 9);
        
        UPDATE custom_questions SET options = '[
            {"value": "comprehensive", "label": "Comprehensive University", "description": "Full range of academic programs"},
            {"value": "community_college", "label": "Community College", "description": "Two-year college, primarily commuter"},
            {"value": "liberal_arts", "label": "Liberal Arts College", "description": "Smaller residential liberal arts focus"},
            {"value": "technical", "label": "Technical Institute", "description": "Engineering and technical programs"}
        ]'::jsonb WHERE field_name = 'campusType' AND use_case_id = college_id;
        RAISE NOTICE '✅ Added 9 questions for College/University';
    END IF;
    
    -- Public/Government Building questions
    IF government_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = government_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (government_id, 'Building square footage', 'buildingSqFt', 'number', '75000', 5000, 1000000, true, 'Total facility area', 1),
        (government_id, 'Facility type', 'facilityType', 'select', 'municipal_office', null, null, true, 'Type of government facility', 2),
        (government_id, 'Number of floors', 'floorCount', 'number', '3', 1, 20, false, 'Building stories', 3),
        (government_id, 'Operating hours per day', 'hoursPerDay', 'number', '10', 8, 24, true, 'Hours facility is occupied', 4),
        (government_id, 'Days open per week', 'daysPerWeek', 'number', '5', 1, 7, false, 'Operating days', 5),
        (government_id, 'Public access level', 'publicAccess', 'select', 'high', null, null, false, 'Level of public access and traffic', 6),
        (government_id, 'Do you have security systems?', 'hasSecurity', 'boolean', 'true', null, null, false, 'Security screening, surveillance equipment', 7),
        (government_id, 'Is backup power critical?', 'backupPowerCritical', 'boolean', 'false', null, null, false, 'Emergency services and critical operations', 8);
        
        UPDATE custom_questions SET options = '[
            {"value": "municipal_office", "label": "Municipal Office", "description": "City hall, administrative offices"},
            {"value": "courthouse", "label": "Courthouse", "description": "Judicial and legal facilities"},
            {"value": "library", "label": "Public Library", "description": "Library and media center"},
            {"value": "community_center", "label": "Community Center", "description": "Recreation and community services"},
            {"value": "police_fire", "label": "Police/Fire Station", "description": "Emergency services facility"}
        ]'::jsonb WHERE field_name = 'facilityType' AND use_case_id = government_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "high", "label": "High Public Access", "description": "Heavy public traffic and services"},
            {"value": "moderate", "label": "Moderate Public Access", "description": "Regular public business hours"},
            {"value": "limited", "label": "Limited Public Access", "description": "Restricted or appointment-based"}
        ]'::jsonb WHERE field_name = 'publicAccess' AND use_case_id = government_id;
        RAISE NOTICE '✅ Added 8 questions for Public/Government Building';
    END IF;
    
    -- Hotel & Hospitality (hotel-hospitality slug) questions
    IF hotel_hospitality_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = hotel_hospitality_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (hotel_hospitality_id, 'Number of guest rooms', 'roomCount', 'number', '150', 10, 1000, true, 'Total guest rooms', 1),
        (hotel_hospitality_id, 'Total building square footage', 'squareFeet', 'number', '75000', 5000, 500000, true, 'Total interior space including common areas', 2),
        (hotel_hospitality_id, 'Hotel classification', 'hotelClass', 'select', 'upscale', null, null, true, 'Hotel category affects amenities and energy use', 3),
        (hotel_hospitality_id, 'Number of floors', 'floorCount', 'number', '6', 1, 50, false, 'Building height', 4),
        (hotel_hospitality_id, 'Average occupancy rate (%)', 'occupancyRate', 'number', '70', 30, 100, false, 'Percentage of rooms occupied on average', 5),
        (hotel_hospitality_id, 'Do you have a restaurant?', 'hasRestaurant', 'boolean', 'true', null, null, false, 'Restaurants add significant kitchen loads', 6),
        (hotel_hospitality_id, 'Do you have meeting/conference space?', 'hasMeetingSpace', 'boolean', 'true', null, null, false, 'Ballrooms and conference rooms', 7),
        (hotel_hospitality_id, 'Do you have a fitness center?', 'hasFitness', 'boolean', 'true', null, null, false, 'Gym equipment and climate control', 8),
        (hotel_hospitality_id, 'Do you have a laundry facility?', 'hasLaundry', 'boolean', 'true', null, null, false, 'On-site laundry increases energy use', 9),
        (hotel_hospitality_id, 'Do you have a pool or spa?', 'hasPool', 'boolean', 'false', null, null, false, 'Pool heating and filtration equipment', 10);
        
        UPDATE custom_questions SET options = '[
            {"value": "budget", "label": "Budget/Economy", "description": "Limited services, basic amenities"},
            {"value": "midscale", "label": "Midscale", "description": "Moderate amenities and services"},
            {"value": "upscale", "label": "Upscale/Full Service", "description": "Full amenities, restaurant, room service"},
            {"value": "luxury", "label": "Luxury", "description": "High-end amenities, spa, fine dining"}
        ]'::jsonb WHERE field_name = 'hotelClass' AND use_case_id = hotel_hospitality_id;
        RAISE NOTICE '✅ Added 10 questions for Hotel & Hospitality';
    END IF;
    
    -- EV Charging Station questions
    IF ev_charging_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = ev_charging_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (ev_charging_id, 'Number of DC fast chargers', 'numberOfDCFastChargers', 'number', '8', 0, 50, true, 'DC fast chargers (150kW+)', 1),
        (ev_charging_id, 'Number of Level 2 chargers', 'numberOfLevel2Chargers', 'number', '12', 0, 100, true, 'Level 2 chargers (7-19kW)', 2),
        (ev_charging_id, 'Charging station type', 'chargingStationType', 'select', 'highway_corridor', null, null, true, 'Location type affects utilization', 3),
        (ev_charging_id, 'Site square footage', 'siteSqFt', 'number', '5000', 1000, 50000, false, 'Total property area', 4),
        (ev_charging_id, 'Operating hours per day', 'hoursPerDay', 'number', '24', 6, 24, true, 'Hours station is accessible', 5),
        (ev_charging_id, 'Peak charging hours', 'peakHoursPerDay', 'number', '12', 4, 24, false, 'Hours of peak charging demand', 6),
        (ev_charging_id, 'Do you have amenities?', 'hasAmenities', 'boolean', 'true', null, null, false, 'Restrooms, WiFi, waiting area', 7),
        (ev_charging_id, 'Do you have solar canopy?', 'hasSolarCanopy', 'boolean', 'false', null, null, false, 'Solar panels over charging stations', 8);
        
        UPDATE custom_questions SET options = '[
            {"value": "highway_corridor", "label": "Highway Corridor", "description": "High-speed charging for long-distance travel"},
            {"value": "urban_destination", "label": "Urban Destination", "description": "Shopping centers, restaurants"},
            {"value": "workplace", "label": "Workplace", "description": "Employee charging"},
            {"value": "fleet_depot", "label": "Fleet Depot", "description": "Commercial fleet charging"}
        ]'::jsonb WHERE field_name = 'chargingStationType' AND use_case_id = ev_charging_id;
        RAISE NOTICE '✅ Added 8 questions for EV Charging Station';
    END IF;
    
    -- Shopping Center/Mall questions
    IF shopping_center_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = shopping_center_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (shopping_center_id, 'Total retail space (sq ft)', 'retailSqFt', 'number', '100000', 10000, 2000000, true, 'Total leasable retail space', 1),
        (shopping_center_id, 'Center type', 'centerType', 'select', 'community', null, null, true, 'Type of shopping center', 2),
        (shopping_center_id, 'Number of tenant spaces', 'tenantCount', 'number', '30', 5, 200, true, 'Total number of retail tenants', 3),
        (shopping_center_id, 'Do you have anchor tenants?', 'hasAnchors', 'boolean', 'true', null, null, false, 'Large anchor stores (grocery, department stores)', 4),
        (shopping_center_id, 'Operating hours per day', 'hoursPerDay', 'number', '14', 8, 24, true, 'Hours open to customers', 5),
        (shopping_center_id, 'Number of parking spaces', 'parkingSpaces', 'number', '500', 50, 5000, false, 'Total parking capacity', 6),
        (shopping_center_id, 'Do you have a food court?', 'hasFoodCourt', 'boolean', 'false', null, null, false, 'Multiple restaurant vendors', 7),
        (shopping_center_id, 'Common area square footage', 'commonAreaSqFt', 'number', '20000', 0, 100000, false, 'Hallways, atriums, shared spaces', 8);
        
        UPDATE custom_questions SET options = '[
            {"value": "strip", "label": "Strip Center", "description": "Small strip mall with parking in front"},
            {"value": "community", "label": "Community Center", "description": "Mid-size center with 1-2 anchor stores"},
            {"value": "power", "label": "Power Center", "description": "Large format retailers, big box stores"},
            {"value": "regional_mall", "label": "Regional Mall", "description": "Enclosed mall with multiple anchors"}
        ]'::jsonb WHERE field_name = 'centerType' AND use_case_id = shopping_center_id;
        RAISE NOTICE '✅ Added 8 questions for Shopping Center/Mall';
    END IF;
    
    -- Residential questions
    IF residential_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = residential_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (residential_id, 'Home square footage', 'homeSqFt', 'number', '2500', 800, 10000, true, 'Total interior living space', 1),
        (residential_id, 'Home type', 'homeType', 'select', 'single_family', null, null, true, 'Type of residence', 2),
        (residential_id, 'Number of residents', 'residents', 'number', '4', 1, 10, false, 'People living in the home', 3),
        (residential_id, 'Number of bedrooms', 'bedrooms', 'number', '4', 1, 10, false, 'Total bedrooms', 4),
        (residential_id, 'Heating/cooling system', 'hvacType', 'select', 'central_ac', null, null, true, 'Primary HVAC system', 5),
        (residential_id, 'Do you have solar panels?', 'hasSolar', 'boolean', 'false', null, null, false, 'Existing solar installation', 6),
        (residential_id, 'Solar system size (kW)', 'solarSizeKW', 'number', '0', 0, 50, false, 'If you have solar, what size?', 7),
        (residential_id, 'Do you have an electric vehicle?', 'hasEV', 'boolean', 'false', null, null, false, 'EV adds charging load', 8),
        (residential_id, 'Average monthly electric bill', 'monthlyBill', 'number', '250', 50, 2000, false, 'Current electricity cost', 9);
        
        UPDATE custom_questions SET options = '[
            {"value": "single_family", "label": "Single Family Home", "description": "Detached house"},
            {"value": "townhouse", "label": "Townhouse", "description": "Attached multi-story home"},
            {"value": "condo", "label": "Condominium", "description": "Individual unit in multi-unit building"},
            {"value": "mobile", "label": "Mobile/Manufactured Home", "description": "Factory-built home"}
        ]'::jsonb WHERE field_name = 'homeType' AND use_case_id = residential_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "central_ac", "label": "Central AC/Furnace", "description": "Forced air HVAC system"},
            {"value": "heat_pump", "label": "Heat Pump", "description": "Electric heat pump system"},
            {"value": "mini_split", "label": "Mini-Split", "description": "Ductless mini-split systems"},
            {"value": "baseboard", "label": "Baseboard/Radiator", "description": "Electric or hot water baseboard"}
        ]'::jsonb WHERE field_name = 'hvacType' AND use_case_id = residential_id;
        RAISE NOTICE '✅ Added 9 questions for Residential';
    END IF;
    
    -- Retail & Commercial questions
    IF retail_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = retail_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (retail_id, 'Total retail space (sq ft)', 'retailSqFt', 'number', '5000', 1000, 100000, true, 'Total retail floor area', 1),
        (retail_id, 'Store type', 'storeType', 'select', 'general_retail', null, null, true, 'Type of retail business', 2),
        (retail_id, 'Operating hours per day', 'hoursPerDay', 'number', '12', 6, 24, true, 'Hours open to customers', 3),
        (retail_id, 'Days open per week', 'daysPerWeek', 'number', '7', 1, 7, false, 'Operating days', 4),
        (retail_id, 'Do you have refrigeration?', 'hasRefrigeration', 'boolean', 'false', null, null, false, 'Refrigeration adds significant load', 5),
        (retail_id, 'Do you have outdoor lighting?', 'hasOutdoorLighting', 'boolean', 'true', null, null, false, 'Parking lot and signage lighting', 6),
        (retail_id, 'Display lighting intensity', 'lightingIntensity', 'select', 'standard', null, null, false, 'Retail display lighting level', 7),
        (retail_id, 'Do you have security systems?', 'hasSecurity', 'boolean', 'true', null, null, false, 'Alarms, cameras, monitoring', 8);
        
        UPDATE custom_questions SET options = '[
            {"value": "general_retail", "label": "General Retail", "description": "Clothing, electronics, general merchandise"},
            {"value": "grocery", "label": "Grocery Store", "description": "Supermarket with refrigeration"},
            {"value": "restaurant", "label": "Restaurant", "description": "Food service with kitchen equipment"},
            {"value": "convenience", "label": "Convenience Store", "description": "Small format, extended hours"}
        ]'::jsonb WHERE field_name = 'storeType' AND use_case_id = retail_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "minimal", "label": "Minimal", "description": "Basic overhead lighting"},
            {"value": "standard", "label": "Standard", "description": "Typical retail lighting"},
            {"value": "high", "label": "High Intensity", "description": "Jewelry, showroom-quality lighting"}
        ]'::jsonb WHERE field_name = 'lightingIntensity' AND use_case_id = retail_id;
        RAISE NOTICE '✅ Added 8 questions for Retail & Commercial';
    END IF;
    
    -- Microgrid & Renewable Integration questions
    IF microgrid_id IS NOT NULL THEN
        DELETE FROM custom_questions WHERE use_case_id = microgrid_id;
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        (microgrid_id, 'Total site load (kW)', 'siteLoadKW', 'number', '500', 10, 10000, true, 'Total site power demand', 1),
        (microgrid_id, 'Site type', 'siteType', 'select', 'campus', null, null, true, 'Type of microgrid application', 2),
        (microgrid_id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '200', 0, 5000, false, 'Current solar installation', 3),
        (microgrid_id, 'Planned solar capacity (kW)', 'plannedSolarKW', 'number', '500', 0, 10000, false, 'Additional solar to be installed', 4),
        (microgrid_id, 'Grid connection type', 'gridType', 'select', 'grid_tied', null, null, true, 'Type of grid connection', 5),
        (microgrid_id, 'Backup power criticality', 'backupCriticality', 'select', 'high', null, null, true, 'How critical is backup power?', 6),
        (microgrid_id, 'Desired autonomy (hours)', 'autonomyHours', 'number', '4', 0, 72, false, 'Hours of off-grid operation desired', 7),
        (microgrid_id, 'Do you have wind generation?', 'hasWind', 'boolean', 'false', null, null, false, 'Wind turbines on site', 8),
        (microgrid_id, 'Do you have diesel generators?', 'hasGenerators', 'boolean', 'true', null, null, false, 'Existing backup generators', 9);
        
        UPDATE custom_questions SET options = '[
            {"value": "campus", "label": "Campus/Multiple Buildings", "description": "University, corporate campus, hospital complex"},
            {"value": "community", "label": "Community Microgrid", "description": "Residential neighborhood or mixed-use development"},
            {"value": "industrial", "label": "Industrial Site", "description": "Manufacturing facility or industrial park"},
            {"value": "remote", "label": "Remote/Island", "description": "Off-grid or remote location"}
        ]'::jsonb WHERE field_name = 'siteType' AND use_case_id = microgrid_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "grid_tied", "label": "Grid-Tied", "description": "Connected to utility grid"},
            {"value": "islanded", "label": "Islanded", "description": "Can operate independently"},
            {"value": "off_grid", "label": "Off-Grid", "description": "No grid connection"}
        ]'::jsonb WHERE field_name = 'gridType' AND use_case_id = microgrid_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "critical", "label": "Critical", "description": "Cannot afford any downtime"},
            {"value": "high", "label": "High", "description": "Backup power very important"},
            {"value": "moderate", "label": "Moderate", "description": "Backup useful but not critical"}
        ]'::jsonb WHERE field_name = 'backupCriticality' AND use_case_id = microgrid_id;
        RAISE NOTICE '✅ Added 9 questions for Microgrid & Renewable Integration';
    END IF;
    
    RAISE NOTICE '🎉 ALL CUSTOM QUESTIONS ADDED SUCCESSFULLY!';
END $$;

-- Verification query
SELECT 
    uc.name,
    uc.slug,
    COUNT(cq.id) as question_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.name, uc.slug
ORDER BY uc.display_order;
