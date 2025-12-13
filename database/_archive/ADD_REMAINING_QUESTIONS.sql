-- =============================================================================
-- ADD QUESTIONS FOR REMAINING USE CASES
-- Run AFTER COMPREHENSIVE_QUESTIONS.sql
-- =============================================================================

-- =============================================================================
-- APARTMENT COMPLEX (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of residential units', 'unitCount', 'number', '200', 10, 2000, true, 'Total apartments/condos', 1 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of buildings', 'buildingCount', 'number', '4', 1, 50, true, 'Separate residential buildings', 2 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total building square footage', 'squareFeet', 'number', '250000', 20000, 2000000, true, 'Combined building area', 3 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '1000', 100, 10000, true, 'Total electrical service', 4 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of existing EV chargers', 'existingEVChargers', 'number', '0', 0, 500, false, 'Current EV charging stations installed', 5 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding more EV charging?', 'wantsMoreEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will help size additional EV charging in a later step', 6 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have common area amenities?', 'hasAmenities', 'boolean', 'true', NULL, NULL, false, 'Pool, gym, clubhouse, etc.', 7 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of elevators', 'elevatorCount', 'number', '4', 0, 30, false, 'Elevators needing backup power', 8 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation size', 9 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 10 FROM use_cases WHERE slug = 'apartment';

-- =============================================================================
-- RESIDENTIAL (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Home square footage', 'squareFeet', 'number', '2500', 500, 20000, true, 'Total living space', 1 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly electricity bill ($)', 'monthlyBill', 'number', '200', 50, 2000, true, 'Average monthly electric cost', 2 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Electrical panel capacity (amps)', 'panelAmps', 'number', '200', 100, 400, true, 'Main breaker panel size', 3 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have or plan to add an electric vehicle?', 'hasOrWantsEV', 'boolean', 'false', NULL, NULL, false, 'We can help size EV charging in a later step', 4 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a pool/hot tub?', 'hasPool', 'boolean', 'false', NULL, NULL, false, 'Pools add pump/heater load', 5 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'HVAC type', 'hvacType', 'text', 'central_ac', NULL, NULL, false, 'Central AC, heat pump, or other', 6 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you want whole-home backup?', 'wholeHomeBackup', 'boolean', 'false', NULL, NULL, false, 'Backup entire home vs critical loads only', 7 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 50, false, 'Current solar installation size (0 if none)', 8 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 9 FROM use_cases WHERE slug = 'residential';

-- =============================================================================
-- SHOPPING CENTER/MALL (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total retail square footage', 'squareFeet', 'number', '300000', 20000, 3000000, true, 'Leasable retail space', 1 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of tenant spaces', 'tenantCount', 'number', '75', 10, 500, true, 'Individual retail stores', 2 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '3000', 200, 30000, true, 'Total electrical service', 3 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '14', 8, 24, true, 'Hours mall is open', 4 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have anchor stores?', 'hasAnchors', 'boolean', 'true', NULL, NULL, false, 'Large department/grocery stores', 5 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a food court?', 'hasFoodCourt', 'boolean', 'true', NULL, NULL, false, 'Food courts have high electrical loads', 6 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of existing EV chargers', 'existingEVChargers', 'number', '0', 0, 200, false, 'Current EV charging stations', 7 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding more EV charging?', 'wantsMoreEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will help size additional EV charging in a later step', 8 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation size', 9 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 10 FROM use_cases WHERE slug = 'shopping-center';

-- =============================================================================
-- RETAIL & COMMERCIAL (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Store square footage', 'squareFeet', 'number', '15000', 1000, 200000, true, 'Total retail floor space', 1 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '200', 30, 2000, true, 'Electrical service size', 2 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '12', 6, 24, true, 'Hours store is open', 3 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have refrigeration cases?', 'hasRefrigeration', 'boolean', 'false', NULL, NULL, false, 'Grocery/convenience refrigeration', 4 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a commercial kitchen?', 'hasKitchen', 'boolean', 'false', NULL, NULL, false, 'Restaurant/food prep area', 5 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly electricity cost ($)', 'monthlyElectricBill', 'number', '2000', 200, 50000, false, 'Average monthly electric bill', 6 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a loading dock?', 'hasLoadingDock', 'boolean', 'true', NULL, NULL, false, 'Delivery area with potential equipment', 7 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 500, false, 'Current solar installation size', 8 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 9 FROM use_cases WHERE slug = 'retail';

-- =============================================================================
-- CASINO & GAMING (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Gaming floor square footage', 'gamingFloorSqFt', 'number', '100000', 10000, 500000, true, 'Casino gaming area', 1 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total facility square footage', 'squareFeet', 'number', '300000', 50000, 2000000, true, 'Including hotel, restaurants, entertainment', 2 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '5000', 500, 50000, true, 'Total electrical service', 3 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of slot machines', 'slotCount', 'number', '2000', 100, 10000, true, 'Slot machines run 24/7', 4 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a hotel?', 'hasHotel', 'boolean', 'true', NULL, NULL, false, 'Attached hotel rooms', 5 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have restaurants?', 'hasRestaurants', 'boolean', 'true', NULL, NULL, false, 'On-site dining facilities', 6 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '24', 12, 24, false, 'Most casinos operate 24/7', 7 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation size', 8 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 9 FROM use_cases WHERE slug = 'casino';

-- =============================================================================
-- GAS STATION (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of fuel dispensers', 'dispenserCount', 'number', '12', 2, 50, true, 'Gas/diesel pump islands', 1 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Convenience store square footage', 'storeSqFt', 'number', '3500', 500, 15000, true, 'Attached c-store size', 2 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '150', 50, 1000, true, 'Electrical service size', 3 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of existing EV chargers', 'existingEVChargers', 'number', '0', 0, 20, false, 'Current EV charging stations', 4 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding more EV charging?', 'wantsMoreEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will help size additional EV charging in a later step', 5 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a car wash?', 'hasCarWash', 'boolean', 'false', NULL, NULL, false, 'On-site car wash facility', 6 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours', 'operatingHours', 'number', '24', 12, 24, true, 'Hours station is open', 7 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have food service?', 'hasFoodService', 'boolean', 'true', NULL, NULL, false, 'Hot food/kitchen equipment', 8 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 200, false, 'Current solar installation size', 9 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 10 FROM use_cases WHERE slug = 'gas-station';

-- =============================================================================
-- GOVERNMENT & PUBLIC BUILDING (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Building square footage', 'squareFeet', 'number', '75000', 5000, 1000000, true, 'Total facility size', 1 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '500', 50, 10000, true, 'Electrical service size', 2 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Daily visitors/occupants', 'dailyOccupants', 'number', '500', 50, 10000, true, 'Average daily population', 3 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '10', 8, 24, true, 'Hours building is open', 4 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Is this an emergency services facility?', 'isEmergencyServices', 'boolean', 'false', NULL, NULL, false, 'Police/fire stations need backup power', 5 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a data center?', 'hasDataCenter', 'boolean', 'true', NULL, NULL, false, 'Server room for government systems', 6 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required backup duration (hours)', 'backupHours', 'number', '8', 2, 72, false, 'Critical systems backup requirement', 7 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 2000, false, 'Current solar installation size', 8 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 9 FROM use_cases WHERE slug = 'government';

-- =============================================================================
-- INDOOR FARM (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Growing area square footage', 'growingAreaSqFt', 'number', '50000', 5000, 500000, true, 'Total cultivation space', 1 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '2000', 100, 20000, true, 'Electrical service size', 2 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Lighting hours per day', 'lightingHours', 'number', '18', 12, 24, true, 'Hours grow lights operate', 3 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Lighting type', 'lightingType', 'text', 'led', NULL, NULL, false, 'LED, HPS, or fluorescent', 4 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of growing levels/tiers', 'growingLevels', 'number', '5', 1, 20, false, 'Vertical farming layers', 5 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have HVAC climate control?', 'hasHVAC', 'boolean', 'true', NULL, NULL, false, 'Temperature/humidity control systems', 6 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have hydroponic systems?', 'hasHydroponics', 'boolean', 'true', NULL, NULL, false, 'Water pumps and nutrient delivery', 7 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation size', 8 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 9 FROM use_cases WHERE slug = 'indoor-farm';

-- =============================================================================
-- AGRICULTURAL (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Farm acreage', 'acreage', 'number', '500', 10, 50000, true, 'Total farm size in acres', 1 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '200', 20, 5000, true, 'Available electrical service', 2 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Irrigation pump total HP', 'irrigationHP', 'number', '150', 0, 1000, false, 'Combined pump horsepower', 3 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have cold storage?', 'hasColdStorage', 'boolean', 'true', NULL, NULL, false, 'Refrigerated storage for produce', 4 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have processing equipment?', 'hasProcessing', 'boolean', 'false', NULL, NULL, false, 'On-site sorting/packaging', 5 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Is grid connection reliable?', 'reliableGrid', 'boolean', 'false', NULL, NULL, false, 'Rural areas often have outages', 6 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly electric bill ($)', 'monthlyElectricBill', 'number', '2000', 100, 50000, false, 'Average monthly cost', 7 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation size', 8 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size solar in a later step', 9 FROM use_cases WHERE slug = 'agricultural';

-- =============================================================================
-- MICROGRID & RENEWABLE INTEGRATION (8 questions)
-- =============================================================================
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total site peak load (kW)', 'peakLoadKW', 'number', '2000', 100, 100000, true, 'Maximum power demand', 1 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '1500', 0, 100000, true, '0 = off-grid', 2 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '500', 0, 50000, false, 'Current solar installation', 3 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing wind capacity (kW)', 'existingWindKW', 'number', '0', 0, 20000, false, 'Current wind generation', 4 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have existing generators?', 'hasGenerators', 'boolean', 'true', NULL, NULL, false, 'Diesel/gas backup generators', 5 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Is this an island/off-grid application?', 'isOffGrid', 'boolean', 'false', NULL, NULL, false, 'No utility connection available', 6 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required autonomy (hours)', 'autonomyHours', 'number', '24', 4, 168, false, 'Hours of operation without grid/sun', 7 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding more solar?', 'wantsMoreSolar', 'boolean', 'true', NULL, NULL, false, 'We will help size additional solar in a later step', 8 FROM use_cases WHERE slug = 'microgrid';

-- =============================================================================
-- VERIFICATION
-- =============================================================================
SELECT 
    uc.slug,
    uc.name,
    COUNT(cq.id) as question_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
ORDER BY question_count DESC, uc.name;
