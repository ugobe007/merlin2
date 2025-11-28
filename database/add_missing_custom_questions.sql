-- =============================================================================
-- ADD CUSTOM QUESTIONS FOR ALL USE CASES
-- This fills in the missing custom questions so all templates work in Step 2
-- =============================================================================

-- First, create temporary table with use case IDs for faster lookups
CREATE TEMP TABLE temp_use_case_ids AS
SELECT id, slug FROM use_cases WHERE slug IN (
    'hotel', 'indoor-farm', 'airport', 'college', 'dental-office',
    'edge-data-center', 'food-processing', 'apartments', 'shopping-center'
);

-- Hotel Custom Questions
INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
) VALUES
((SELECT id FROM temp_use_case_ids WHERE slug = 'hotel'), 
    'How many guest rooms does your hotel have?', 'roomCount', 'number', 
    '150', 10, 1000, true, 'Total number of guest rooms', 1),
    
((SELECT id FROM use_cases WHERE slug = 'hotel'), 
    'Total building square footage', 'squareFeet', 'number', 
    '75000', 5000, 500000, true, 'Total interior space including common areas', 2),
    
((SELECT id FROM use_cases WHERE slug = 'hotel'), 
    'Average occupancy rate', 'occupancyRate', 'number', 
    '70', 30, 100, false, 'Percentage of rooms occupied on average', 3),
    
((SELECT id FROM use_cases WHERE slug = 'hotel'), 
    'Do you have a full-service restaurant?', 'hasRestaurant', 'boolean', 
    'true', null, null, false, 'Restaurants add significant kitchen equipment loads', 4),
    
((SELECT id FROM use_cases WHERE slug = 'hotel'), 
    'Do you have a laundry facility?', 'hasLaundry', 'boolean', 
    'true', null, null, false, 'On-site laundry increases energy consumption', 5);

-- Indoor Farm Custom Questions
INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
) VALUES
((SELECT id FROM use_cases WHERE slug = 'indoor-farm'), 
    'Total growing area (square feet)', 'growingAreaSqFt', 'number', 
    '50000', 5000, 200000, true, 'Total area under grow lights', 1),
    
((SELECT id FROM use_cases WHERE slug = 'indoor-farm'), 
    'Growing method', 'growingMethod', 'select', 
    'vertical_farming', null, null, true, 'Different methods have different power requirements', 2),
    
((SELECT id FROM use_cases WHERE slug = 'indoor-farm'), 
    'Daily light hours', 'lightHours', 'number', 
    '18', 12, 24, true, 'Hours per day that grow lights operate', 3),
    
((SELECT id FROM use_cases WHERE slug = 'indoor-farm'), 
    'Climate control type', 'climateControl', 'select', 
    'full_hvac', null, null, true, 'Level of environmental control', 4);

-- Add select options for indoor farm
UPDATE custom_questions 
SET options = '[
    {"value": "vertical_farming", "label": "Vertical Farming", "description": "High-density vertical growing systems"},
    {"value": "greenhouse_hybrid", "label": "Greenhouse Hybrid", "description": "Greenhouse with supplemental LED lighting"},
    {"value": "container_farming", "label": "Container Farming", "description": "Shipping container-based growing"},
    {"value": "warehouse_conversion", "label": "Warehouse Conversion", "description": "Converted warehouse space"}
]'::jsonb
WHERE field_name = 'growingMethod';

UPDATE custom_questions 
SET options = '[
    {"value": "full_hvac", "label": "Full HVAC", "description": "Complete climate control system"},
    {"value": "ventilation_only", "label": "Ventilation Only", "description": "Air circulation without full climate control"},
    {"value": "passive_cooling", "label": "Passive Cooling", "description": "Natural ventilation and cooling"}
]'::jsonb
WHERE field_name = 'climateControl';

-- Airport Custom Questions
INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
) VALUES
((SELECT id FROM use_cases WHERE slug = 'airport'), 
    'Number of gates', 'gateCount', 'number', 
    '20', 5, 100, true, 'Total number of aircraft gates', 1),
    
((SELECT id FROM use_cases WHERE slug = 'airport'), 
    'Terminal square footage', 'terminalSqFt', 'number', 
    '500000', 50000, 5000000, true, 'Total terminal building area', 2),
    
((SELECT id FROM use_cases WHERE slug = 'airport'), 
    'Annual passenger volume', 'annualPassengers', 'number', 
    '2000000', 100000, 50000000, false, 'Total passengers per year', 3),
    
((SELECT id FROM use_cases WHERE slug = 'airport'), 
    'Backup power criticality', 'backupCriticality', 'select', 
    'high', null, null, true, 'Level of backup power requirement', 4);

UPDATE custom_questions 
SET options = '[
    {"value": "critical", "label": "Critical", "description": "24/7 operations, cannot afford any downtime"},
    {"value": "high", "label": "High", "description": "Backup power required for safety and operations"},
    {"value": "standard", "label": "Standard", "description": "Standard backup requirements"}
]'::jsonb
WHERE field_name = 'backupCriticality';

-- University Campus Custom Questions
INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
) VALUES
((SELECT id FROM use_cases WHERE slug = 'college'), 
    'Number of students', 'studentCount', 'number', 
    '15000', 500, 100000, true, 'Total enrolled students', 1),
    
((SELECT id FROM use_cases WHERE slug = 'college'), 
    'Total campus building area (sq ft)', 'campusSqFt', 'number', 
    '2000000', 100000, 20000000, true, 'Total building square footage across campus', 2),
    
((SELECT id FROM use_cases WHERE slug = 'college'), 
    'Do you have on-campus housing?', 'hasHousing', 'boolean', 
    'true', null, null, true, 'Dormitories significantly increase energy load', 3),
    
((SELECT id FROM use_cases WHERE slug = 'college'), 
    'Campus type', 'campusType', 'select', 
    'comprehensive', null, null, true, 'Type of institution affects energy profile', 4);

UPDATE custom_questions 
SET options = '[
    {"value": "comprehensive", "label": "Comprehensive University", "description": "Full range of academic programs"},
    {"value": "community_college", "label": "Community College", "description": "Two-year college, primarily commuter"},
    {"value": "liberal_arts", "label": "Liberal Arts College", "description": "Smaller residential liberal arts focus"},
    {"value": "technical", "label": "Technical Institute", "description": "Engineering and technical programs"}
]'::jsonb
WHERE field_name = 'campusType';

-- Dental Office Custom Questions
INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
) VALUES
((SELECT id FROM use_cases WHERE slug = 'dental-office'), 
    'Number of operatory chairs', 'chairCount', 'number', 
    '6', 1, 20, true, 'Number of dental chairs/treatment rooms', 1),
    
((SELECT id FROM use_cases WHERE slug = 'dental-office'), 
    'Office square footage', 'officeSqFt', 'number', 
    '3000', 500, 10000, true, 'Total office space', 2),
    
((SELECT id FROM use_cases WHERE slug = 'dental-office'), 
    'Days open per week', 'daysPerWeek', 'number', 
    '5', 1, 7, true, 'Operating days per week', 3),
    
((SELECT id FROM use_cases WHERE slug = 'dental-office'), 
    'Do you have an X-ray machine?', 'hasXRay', 'boolean', 
    'true', null, null, false, 'X-ray equipment adds to power requirements', 4);

-- Edge Data Center Custom Questions
INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
) VALUES
((SELECT id FROM use_cases WHERE slug = 'edge-data-center'), 
    'Total IT load (kW)', 'itLoadKW', 'number', 
    '2000', 100, 10000, true, 'Total IT equipment power draw', 1),
    
((SELECT id FROM use_cases WHERE slug = 'edge-data-center'), 
    'Number of server racks', 'rackCount', 'number', 
    '50', 5, 500, true, 'Total number of equipment racks', 2),
    
((SELECT id FROM use_cases WHERE slug = 'edge-data-center'), 
    'PUE target', 'pueTarget', 'number', 
    '1.5', 1.1, 2.5, false, 'Power Usage Effectiveness ratio', 3),
    
((SELECT id FROM use_cases WHERE slug = 'edge-data-center'), 
    'Uptime tier requirement', 'uptimeTier', 'select', 
    'tier_3', null, null, true, 'Uptime Institute tier classification', 4);

UPDATE custom_questions 
SET options = '[
    {"value": "tier_1", "label": "Tier 1", "description": "99.671% uptime, basic capacity"},
    {"value": "tier_2", "label": "Tier 2", "description": "99.741% uptime, redundant components"},
    {"value": "tier_3", "label": "Tier 3", "description": "99.982% uptime, concurrently maintainable"},
    {"value": "tier_4", "label": "Tier 4", "description": "99.995% uptime, fault-tolerant"}
]'::jsonb
WHERE field_name = 'uptimeTier';

-- Food Processing Custom Questions
INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
) VALUES
((SELECT id FROM use_cases WHERE slug = 'food-processing'), 
    'Facility square footage', 'facilitySqFt', 'number', 
    '100000', 10000, 1000000, true, 'Total production facility area', 1),
    
((SELECT id FROM use_cases WHERE slug = 'food-processing'), 
    'Production shifts per day', 'shiftsPerDay', 'number', 
    '2', 1, 3, true, 'Number of production shifts', 2),
    
((SELECT id FROM use_cases WHERE slug = 'food-processing'), 
    'Processing type', 'processingType', 'select', 
    'general', null, null, true, 'Type of food processing affects energy needs', 3),
    
((SELECT id FROM use_cases WHERE slug = 'food-processing'), 
    'Do you have refrigeration/freezing?', 'hasRefrigeration', 'boolean', 
    'true', null, null, true, 'Cold storage significantly increases energy use', 4);

UPDATE custom_questions 
SET options = '[
    {"value": "general", "label": "General Food Processing", "description": "Standard food processing operations"},
    {"value": "meat_poultry", "label": "Meat & Poultry", "description": "Meat processing with high refrigeration needs"},
    {"value": "dairy", "label": "Dairy Processing", "description": "Dairy products with cold chain requirements"},
    {"value": "bakery", "label": "Bakery", "description": "Baking with ovens and mixers"},
    {"value": "beverage", "label": "Beverage", "description": "Beverage bottling and packaging"}
]'::jsonb
WHERE field_name = 'processingType';

-- Apartment Complex Custom Questions
INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
) VALUES
((SELECT id FROM use_cases WHERE slug = 'apartments'), 
    'Number of units', 'unitCount', 'number', 
    '400', 20, 2000, true, 'Total number of residential units', 1),
    
((SELECT id FROM use_cases WHERE slug = 'apartments'), 
    'Number of buildings', 'buildingCount', 'number', 
    '4', 1, 50, false, 'Number of separate buildings', 2),
    
((SELECT id FROM use_cases WHERE slug = 'apartments'), 
    'Do you have EV charging?', 'hasEVCharging', 'boolean', 
    'true', null, null, false, 'EV charging stations for residents', 3),
    
((SELECT id FROM use_cases WHERE slug = 'apartments'), 
    'Number of EV chargers', 'evChargerCount', 'number', 
    '20', 0, 500, false, 'Total EV charging stations', 4),
    
((SELECT id FROM use_cases WHERE slug = 'apartments'), 
    'Common amenities', 'amenities', 'select', 
    'standard', null, null, false, 'Level of shared amenities', 5);

UPDATE custom_questions 
SET options = '[
    {"value": "basic", "label": "Basic", "description": "Minimal shared amenities"},
    {"value": "standard", "label": "Standard", "description": "Fitness center, common room, laundry"},
    {"value": "luxury", "label": "Luxury", "description": "Pool, spa, multiple gyms, co-working spaces"}
]'::jsonb
WHERE field_name = 'amenities';

-- Shopping Center Custom Questions
INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, min_value, max_value, is_required, help_text, display_order
) VALUES
((SELECT id FROM use_cases WHERE slug = 'shopping-center'), 
    'Total retail space (sq ft)', 'retailSqFt', 'number', 
    '100000', 10000, 2000000, true, 'Total leasable retail space', 1),
    
((SELECT id FROM use_cases WHERE slug = 'shopping-center'), 
    'Number of tenant spaces', 'tenantCount', 'number', 
    '30', 5, 200, false, 'Total number of retail tenants', 2),
    
((SELECT id FROM use_cases WHERE slug = 'shopping-center'), 
    'Do you have anchor tenants?', 'hasAnchors', 'boolean', 
    'true', null, null, false, 'Large anchor stores (grocery, department stores)', 3),
    
((SELECT id FROM use_cases WHERE slug = 'shopping-center'), 
    'Operating hours per day', 'hoursPerDay', 'number', 
    '14', 8, 24, true, 'Hours open to customers', 4),
    
((SELECT id FROM use_cases WHERE slug = 'shopping-center'), 
    'Center type', 'centerType', 'select', 
    'community', null, null, true, 'Type of shopping center', 5);

UPDATE custom_questions 
SET options = '[
    {"value": "strip", "label": "Strip Center", "description": "Small strip mall with parking in front"},
    {"value": "community", "label": "Community Center", "description": "Mid-size center with 1-2 anchor stores"},
    {"value": "power", "label": "Power Center", "description": "Large format retailers, big box stores"},
    {"value": "regional_mall", "label": "Regional Mall", "description": "Enclosed mall with multiple anchors"}
]'::jsonb
WHERE field_name = 'centerType';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

SELECT 
    uc.name,
    uc.slug,
    COUNT(cq.id) as question_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.name, uc.slug
ORDER BY uc.display_order;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Custom questions added for all use cases!';
    RAISE NOTICE '📋 All templates now have questions for Step 2';
    RAISE NOTICE '🎯 Run the verification query above to confirm';
END $$;
