-- =============================================================================
-- COMPREHENSIVE INDUSTRY-SPECIFIC QUESTIONS (7-10 per use case)
-- Run this in Supabase SQL Editor
-- =============================================================================

DELETE FROM custom_questions;

-- =============================================================================
-- HOTEL & HOSPITALITY (10 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of guest rooms', 'roomCount', 'number', '150', 10, 2000, true, 'Total guest rooms in property', 1 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total building square footage', 'squareFeet', 'number', '100000', 10000, 1000000, true, 'Total interior space including lobbies, restaurants, conference rooms', 2 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 2000, false, 'Current solar installation size (0 if none)', 3 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 4 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Current grid connection capacity (kW)', 'gridCapacityKW', 'number', '500', 50, 10000, true, 'Your utility service entrance capacity', 4 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Average monthly electricity bill ($)', 'monthlyElectricBill', 'number', '25000', 1000, 500000, true, 'Average monthly electric utility cost', 5 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a restaurant/commercial kitchen?', 'hasRestaurant', 'boolean', 'true', NULL, NULL, false, 'Commercial kitchens add significant load', 6 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a pool/spa?', 'hasPool', 'boolean', 'true', NULL, NULL, false, 'Pools require pumps, heaters, and filtration', 7 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have on-site laundry?', 'hasLaundry', 'boolean', 'true', NULL, NULL, false, 'Commercial laundry is energy-intensive', 8 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of elevators', 'elevatorCount', 'number', '4', 0, 20, false, 'Elevators require backup power consideration', 9 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you need backup power for life safety?', 'needsBackupPower', 'boolean', 'true', NULL, NULL, false, 'Emergency lighting, fire systems, elevators', 10 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

-- =============================================================================
-- HOSPITAL (10 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of patient beds', 'bedCount', 'number', '200', 10, 2000, true, 'Licensed bed capacity', 1 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total facility square footage', 'squareFeet', 'number', '300000', 50000, 5000000, true, 'Total building area', 2 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Current grid connection (kW)', 'gridCapacityKW', 'number', '3000', 500, 50000, true, 'Main electrical service capacity', 3 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of operating rooms', 'operatingRooms', 'number', '10', 1, 50, true, 'Surgical suites require uninterruptible power', 4 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have MRI machines?', 'hasMRI', 'boolean', 'true', NULL, NULL, false, 'MRI requires 50-150kW per unit', 5 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have CT scanners?', 'hasCT', 'boolean', 'true', NULL, NULL, false, 'CT scanners require 80-120kW peak', 6 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of ICU beds', 'icuBeds', 'number', '20', 0, 200, false, 'ICU requires highest power reliability', 7 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required backup duration (hours)', 'backupHours', 'number', '24', 4, 96, true, 'How long must critical systems run on backup?', 8 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have existing diesel generators?', 'hasGenerators', 'boolean', 'true', NULL, NULL, false, 'BESS can supplement or replace generators', 9 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation size (0 if none)', 10 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 11 FROM use_cases WHERE slug = 'hospital';

-- =============================================================================
-- DATA CENTER (10 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total IT load (kW)', 'itLoadKW', 'number', '2000', 100, 100000, true, 'Total server/network equipment power draw', 1 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of server racks', 'rackCount', 'number', '100', 10, 5000, true, 'Total equipment racks', 2 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Facility square footage', 'squareFeet', 'number', '50000', 5000, 1000000, true, 'Total data hall and support space', 3 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '5000', 500, 200000, true, 'Utility service entrance rating', 4 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Target PUE (Power Usage Effectiveness)', 'pueTarget', 'number', '1.4', 1.1, 2.5, false, 'Lower PUE = more efficient cooling', 5 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required uptime tier (1-4)', 'uptimeTier', 'number', '3', 1, 4, true, 'Tier 3 = 99.98%, Tier 4 = 99.99% uptime', 6 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required UPS runtime (minutes)', 'upsRuntimeMin', 'number', '15', 5, 60, true, 'Battery backup duration before generator starts', 7 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have existing UPS systems?', 'hasUPS', 'boolean', 'true', NULL, NULL, false, 'Current battery backup infrastructure', 8 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Cooling type', 'coolingType', 'text', 'air', NULL, NULL, false, 'Air-cooled, water-cooled, or liquid cooling', 9 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation size (0 if none)', 10 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 11 FROM use_cases WHERE slug = 'data-center';

-- =============================================================================
-- EV CHARGING STATION (10 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of DC fast chargers (150-350kW)', 'dcfastCount', 'number', '4', 0, 50, true, 'High-speed DC charging stations', 1 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of Level 2 chargers (7-22kW)', 'level2Count', 'number', '8', 0, 100, false, 'Standard AC charging stations', 2 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Current grid connection (kW)', 'gridCapacityKW', 'number', '500', 50, 10000, true, 'Available utility service capacity', 3 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Is grid upgrade needed?', 'needsGridUpgrade', 'boolean', 'false', NULL, NULL, false, 'Does site need transformer/service upgrade?', 4 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Site type', 'siteType', 'text', 'retail', NULL, NULL, false, 'retail, highway, fleet depot, workplace', 5 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Expected daily charging sessions', 'dailySessions', 'number', '50', 10, 500, false, 'Average vehicles charged per day', 6 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Average charge time (minutes)', 'avgChargeTime', 'number', '30', 10, 120, false, 'Typical session duration', 7 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Demand charges ($/kW)', 'demandChargeRate', 'number', '15', 0, 50, false, 'Peak demand charge from utility', 8 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 2000, false, 'Current solar installation size (0 if none)', 9 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar canopies?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 10 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '24', 8, 24, false, 'Hours station is accessible', 10 FROM use_cases WHERE slug = 'ev-charging';

-- =============================================================================
-- AIRPORT (10 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Annual passengers (millions)', 'annualPassengers', 'number', '10', 0.5, 100, true, 'Total passengers per year', 1 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Terminal square footage', 'terminalSqFt', 'number', '500000', 50000, 10000000, true, 'All terminal buildings combined', 2 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of gates', 'gateCount', 'number', '40', 5, 200, true, 'Aircraft boarding gates', 3 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (MW)', 'gridCapacityMW', 'number', '20', 1, 200, true, 'Main utility service capacity', 4 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have ground power units at gates?', 'hasGroundPower', 'boolean', 'true', NULL, NULL, false, '400Hz power for aircraft at gates', 5 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of baggage handling systems', 'baggageSystems', 'number', '3', 1, 20, false, 'Conveyor systems require reliable power', 6 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required backup duration (hours)', 'backupHours', 'number', '8', 2, 48, true, 'Critical systems backup requirement', 7 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Parking garage square footage', 'parkingSqFt', 'number', '500000', 0, 5000000, false, 'Potential EV charging/solar location', 8 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of existing EV chargers', 'existingEVChargers', 'number', '0', 0, 500, false, 'Current EV charging stations', 9 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in expanding EV charging?', 'wantsMoreEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will help size EV charging in a later step', 10 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 20000, false, 'Current solar installation size (0 if none)', 11 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 12 FROM use_cases WHERE slug = 'airport';

-- =============================================================================
-- MANUFACTURING (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Facility square footage', 'squareFeet', 'number', '200000', 10000, 5000000, true, 'Total manufacturing floor space', 1 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '3000', 100, 100000, true, 'Maximum power draw during production', 2 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '5000', 200, 200000, true, 'Utility transformer capacity', 3 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Production shifts per day', 'shiftsPerDay', 'number', '2', 1, 3, true, 'Operating shifts (affects load profile)', 4 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have large motors/compressors?', 'hasLargeMotors', 'boolean', 'true', NULL, NULL, false, 'High-inrush equipment affects sizing', 5 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '15000', 0, 500000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation size (0 if none)', 7 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 8 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Is power quality critical?', 'powerQualityCritical', 'boolean', 'true', NULL, NULL, false, 'Sensitive equipment requiring clean power', 8 FROM use_cases WHERE slug = 'manufacturing';

-- =============================================================================
-- CAR WASH (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of wash bays/tunnels', 'washBays', 'number', '3', 1, 10, true, 'Automatic wash bays', 1 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Daily vehicle throughput', 'dailyVehicles', 'number', '200', 50, 1000, true, 'Cars washed per day', 2 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total facility square footage', 'squareFeet', 'number', '8000', 2000, 50000, true, 'Building and canopy area', 3 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection (kW)', 'gridCapacityKW', 'number', '200', 50, 1000, true, 'Electrical service capacity', 4 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of vacuum stations', 'vacuumStations', 'number', '10', 0, 30, false, 'Self-service vacuum islands', 5 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of high-pressure pumps', 'pumpCount', 'number', '6', 2, 20, false, 'Main wash system pumps (high kW draw)', 6 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have dryer blowers?', 'hasDryers', 'boolean', 'true', NULL, NULL, false, 'Air dryers use 20-50kW each', 7 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 200, false, 'Current solar installation size (0 if none)', 8 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 9 FROM use_cases WHERE slug = 'car-wash';

-- =============================================================================
-- WAREHOUSE & LOGISTICS (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Warehouse square footage', 'squareFeet', 'number', '300000', 20000, 5000000, true, 'Total warehouse floor space', 1 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '1000', 100, 20000, true, 'Electrical service capacity', 2 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of loading docks', 'dockCount', 'number', '30', 2, 200, true, 'Truck loading doors', 3 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of electric forklifts', 'forkliftCount', 'number', '20', 0, 200, false, 'Battery-powered forklifts needing charging', 4 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have conveyor systems?', 'hasConveyors', 'boolean', 'true', NULL, NULL, false, 'Automated sorting/conveyor equipment', 5 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have refrigerated sections?', 'hasRefrigeration', 'boolean', 'false', NULL, NULL, false, 'Cold storage areas in warehouse', 6 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '16', 8, 24, false, 'Daily operational hours', 7 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation size (0 if none)', 8 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 9 FROM use_cases WHERE slug = 'warehouse';

-- =============================================================================
-- COLLEGE & UNIVERSITY (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Student population', 'studentCount', 'number', '15000', 500, 100000, true, 'Total enrolled students', 1 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total campus building area (sq ft)', 'campusSqFt', 'number', '3000000', 100000, 50000000, true, 'All buildings combined', 2 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of buildings', 'buildingCount', 'number', '50', 5, 500, false, 'Academic, admin, residential buildings', 3 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (MW)', 'gridCapacityMW', 'number', '15', 1, 100, true, 'Campus-wide electrical capacity', 4 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have on-campus housing?', 'hasHousing', 'boolean', 'true', NULL, NULL, false, 'Dormitories/residential halls', 5 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have research labs?', 'hasResearchLabs', 'boolean', 'true', NULL, NULL, false, 'Labs often have critical power needs', 6 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a central plant?', 'hasCentralPlant', 'boolean', 'true', NULL, NULL, false, 'Central heating/cooling facility', 7 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation size (0 if none)', 8 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 9 FROM use_cases WHERE slug = 'college';

-- =============================================================================
-- COLD STORAGE (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Cold storage square footage', 'squareFeet', 'number', '100000', 10000, 2000000, true, 'Total refrigerated/frozen space', 1 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Target temperature (°F)', 'targetTempF', 'number', '0', -30, 55, true, 'Primary storage temperature', 2 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '2000', 200, 20000, true, 'Electrical service capacity', 3 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of compressor units', 'compressorCount', 'number', '8', 2, 50, false, 'Refrigeration compressors (largest loads)', 4 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have blast freezers?', 'hasBlastFreezers', 'boolean', 'true', NULL, NULL, false, 'Quick-freeze units have high peak demand', 5 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of loading docks', 'dockCount', 'number', '10', 2, 50, false, 'Refrigerated dock doors', 6 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required backup duration (hours)', 'backupHours', 'number', '24', 4, 72, true, 'How long can product survive power loss?', 7 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation size (0 if none)', 8 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 9 FROM use_cases WHERE slug = 'cold-storage';

-- =============================================================================
-- OFFICE BUILDING (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Building square footage', 'squareFeet', 'number', '100000', 5000, 2000000, true, 'Total leasable/usable space', 1 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of floors', 'floorCount', 'number', '10', 1, 100, true, 'Total building floors', 2 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '1500', 100, 20000, true, 'Building electrical service', 3 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Average building occupancy (people)', 'occupancy', 'number', '500', 20, 10000, false, 'Typical workday population', 4 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of elevators', 'elevatorCount', 'number', '4', 0, 30, false, 'Elevators need backup power', 5 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a data center/server room?', 'hasServerRoom', 'boolean', 'true', NULL, NULL, false, 'IT infrastructure requiring UPS', 6 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of existing EV chargers', 'existingEVChargers', 'number', '0', 0, 100, false, 'Current EV charging stations', 7 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsMoreEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will help size EV charging in a later step', 8 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 2000, false, 'Current solar installation size (0 if none)', 9 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 10 FROM use_cases WHERE slug = 'office';

-- =============================================================================
-- VERIFICATION QUERY
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
