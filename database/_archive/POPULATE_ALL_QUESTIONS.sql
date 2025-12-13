-- =============================================================================
-- POPULATE ALL CUSTOM QUESTIONS FOR ALL USE CASES
-- Run this in Supabase SQL Editor to populate all questions
-- =============================================================================

-- First, clear existing questions to avoid duplicates
DELETE FROM custom_questions;

-- =============================================================================
-- HOTEL & HOSPITALITY
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of guest rooms', 'roomCount', 'number', '150', 10, 1000, true, 'Total number of guest rooms', 1
FROM use_cases WHERE slug = 'hotel' OR slug = 'hotel-hospitality';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total building square footage', 'squareFeet', 'number', '75000', 5000, 500000, true, 'Total interior space including common areas', 2
FROM use_cases WHERE slug = 'hotel' OR slug = 'hotel-hospitality';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Average occupancy rate (%)', 'occupancyRate', 'number', '70', 30, 100, false, 'Percentage of rooms occupied on average', 3
FROM use_cases WHERE slug = 'hotel' OR slug = 'hotel-hospitality';

-- =============================================================================
-- AIRPORT
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Annual passengers (millions)', 'annualPassengers', 'number', '5', 0.1, 100, true, 'Total passengers per year in millions', 1
FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total terminal square footage', 'terminalSqFt', 'number', '500000', 50000, 10000000, false, 'Combined square footage of all terminals', 2
FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of aircraft gates', 'gateCount', 'number', '30', 5, 200, false, 'Total number of aircraft gates', 3
FROM use_cases WHERE slug = 'airport';

-- =============================================================================
-- HOSPITAL
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of beds', 'bedCount', 'number', '200', 10, 2000, true, 'Total number of patient beds', 1
FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total facility square footage', 'facilitySqFt', 'number', '150000', 10000, 5000000, false, 'Total square footage of hospital', 2
FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of operating rooms', 'operatingRooms', 'number', '8', 1, 50, false, 'Number of surgical operating rooms', 3
FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- DATA CENTER
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total IT load (kW)', 'itLoadKW', 'number', '2000', 100, 50000, true, 'Total IT equipment power draw in kW', 1
FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of server racks', 'rackCount', 'number', '100', 10, 1000, false, 'Total number of server racks', 2
FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'PUE target', 'pueTarget', 'number', '1.5', 1.1, 2.5, false, 'Power Usage Effectiveness ratio', 3
FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- EV CHARGING STATION
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of DC fast chargers (150kW)', 'dcfast_150kw', 'number', '4', 0, 50, true, 'High-speed DC chargers', 1
FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of Level 2 chargers (11kW)', 'level2_11kw', 'number', '8', 0, 100, false, 'Standard Level 2 chargers', 2
FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Expected daily charging sessions', 'dailySessions', 'number', '50', 10, 500, false, 'Average charging sessions per day', 3
FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- OFFICE BUILDING
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Building square footage', 'squareFeet', 'number', '50000', 5000, 1000000, true, 'Total office space in square feet', 1
FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of floors', 'floors', 'number', '5', 1, 100, false, 'Total number of floors', 2
FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Average occupancy (people)', 'occupancy', 'number', '200', 10, 10000, false, 'Average number of people in building', 3
FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- MANUFACTURING FACILITY
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Facility square footage', 'squareFeet', 'number', '100000', 10000, 2000000, true, 'Total manufacturing floor space', 1
FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Production shifts per day', 'shiftsPerDay', 'number', '2', 1, 3, false, 'Number of production shifts', 2
FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak demand (kW)', 'peakDemandKW', 'number', '2000', 100, 50000, false, 'Peak power demand in kW', 3
FROM use_cases WHERE slug = 'manufacturing';

-- =============================================================================
-- SHOPPING CENTER / MALL
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total retail space (sq ft)', 'retailSqFt', 'number', '200000', 20000, 2000000, true, 'Total leasable retail space', 1
FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of tenant spaces', 'tenantCount', 'number', '50', 5, 300, false, 'Total number of retail tenants', 2
FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'hoursPerDay', 'number', '14', 8, 24, false, 'Hours open to customers', 3
FROM use_cases WHERE slug = 'shopping-center';

-- =============================================================================
-- RESIDENTIAL
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Home square footage', 'squareFeet', 'number', '2500', 500, 20000, true, 'Total home size', 1
FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly electricity bill ($)', 'monthlyBill', 'number', '200', 50, 1000, false, 'Average monthly electric bill', 2
FROM use_cases WHERE slug = 'residential';

-- =============================================================================
-- APARTMENT COMPLEX
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of units', 'unitCount', 'number', '200', 10, 1000, true, 'Total number of residential units', 1
FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of buildings', 'buildingCount', 'number', '4', 1, 50, false, 'Number of separate buildings', 2
FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of EV chargers', 'evChargerCount', 'number', '20', 0, 200, false, 'EV charging stations for residents', 3
FROM use_cases WHERE slug = 'apartment';

-- =============================================================================
-- COLLEGE & UNIVERSITY
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of students', 'studentCount', 'number', '15000', 500, 100000, true, 'Total enrolled students', 1
FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Campus building area (sq ft)', 'campusSqFt', 'number', '2000000', 100000, 20000000, false, 'Total building square footage', 2
FROM use_cases WHERE slug = 'college';

-- =============================================================================
-- WAREHOUSE & LOGISTICS
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Warehouse square footage', 'squareFeet', 'number', '200000', 20000, 2000000, true, 'Total warehouse floor space', 1
FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of loading docks', 'dockCount', 'number', '20', 2, 100, false, 'Loading dock doors', 2
FROM use_cases WHERE slug = 'warehouse';

-- =============================================================================
-- COLD STORAGE
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Cold storage square footage', 'squareFeet', 'number', '100000', 10000, 1000000, true, 'Total refrigerated space', 1
FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Target temperature (°F)', 'targetTemp', 'number', '35', -20, 50, false, 'Primary storage temperature', 2
FROM use_cases WHERE slug = 'cold-storage';

-- =============================================================================
-- INDOOR FARM
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Growing area (sq ft)', 'growingAreaSqFt', 'number', '50000', 5000, 500000, true, 'Total area under grow lights', 1
FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Daily light hours', 'lightHours', 'number', '18', 12, 24, false, 'Hours per day grow lights operate', 2
FROM use_cases WHERE slug = 'indoor-farm';

-- =============================================================================
-- AGRICULTURAL
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Farm acreage', 'acreage', 'number', '500', 10, 10000, true, 'Total farm size in acres', 1
FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Irrigation pump HP', 'pumpHP', 'number', '100', 10, 500, false, 'Total irrigation pump horsepower', 2
FROM use_cases WHERE slug = 'agricultural';

-- =============================================================================
-- CASINO & GAMING
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Gaming floor square footage', 'gamingFloorSqFt', 'number', '100000', 10000, 500000, true, 'Casino gaming floor area', 1
FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of slot machines', 'slotCount', 'number', '2000', 100, 10000, false, 'Total slot/gaming machines', 2
FROM use_cases WHERE slug = 'casino';

-- =============================================================================
-- GAS STATION
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of fuel dispensers', 'dispenserCount', 'number', '12', 2, 50, true, 'Total fuel pump dispensers', 1
FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Convenience store sq ft', 'storeSqFt', 'number', '3000', 500, 10000, false, 'Store floor space', 2
FROM use_cases WHERE slug = 'gas-station';

-- =============================================================================
-- CAR WASH
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Wash bays', 'washBays', 'number', '3', 1, 10, true, 'Number of wash tunnels/bays', 1
FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Daily vehicle throughput', 'dailyVehicles', 'number', '200', 50, 1000, false, 'Vehicles washed per day', 2
FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- GOVERNMENT & PUBLIC BUILDING
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Building square footage', 'squareFeet', 'number', '50000', 5000, 500000, true, 'Total building space', 1
FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Daily visitors', 'dailyVisitors', 'number', '500', 50, 5000, false, 'Average daily public visitors', 2
FROM use_cases WHERE slug = 'government';

-- =============================================================================
-- RETAIL & COMMERCIAL
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Store square footage', 'squareFeet', 'number', '10000', 1000, 200000, true, 'Total retail floor space', 1
FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'hoursPerDay', 'number', '12', 6, 24, false, 'Hours open for business', 2
FROM use_cases WHERE slug = 'retail';

-- =============================================================================
-- MICROGRID & RENEWABLE INTEGRATION
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak load (kW)', 'peakLoadKW', 'number', '1000', 100, 50000, true, 'Maximum power demand in kW', 1
FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar (kW)', 'existingSolarKW', 'number', '500', 0, 20000, false, 'Current solar installation capacity', 2
FROM use_cases WHERE slug = 'microgrid';

-- =============================================================================
-- VERIFICATION - Show what was created
-- =============================================================================
SELECT 
    uc.slug,
    uc.name,
    COUNT(cq.id) as question_count,
    STRING_AGG(cq.field_name, ', ' ORDER BY cq.display_order) as fields
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
ORDER BY question_count DESC, uc.name;
