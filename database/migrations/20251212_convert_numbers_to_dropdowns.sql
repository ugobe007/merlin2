-- ============================================================================
-- CONVERT NUMERIC INPUTS TO DROPDOWN SELECTS WITH RANGES
-- December 12, 2025
-- 
-- This migration converts open numeric input fields to dropdown selects
-- with predefined ranges for easier user input. The value stored will be
-- the midpoint of the range for calculation purposes.
--
-- Example: "250,000 - 500,000 sq ft" stores value "375000"
-- ============================================================================

-- =============================================================================
-- AIRPORT QUESTIONS
-- =============================================================================

-- Annual passengers (millions) -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '5',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "Under 1 million", "value": "0.5"},
    {"label": "1 - 2 million", "value": "1.5"},
    {"label": "2 - 5 million", "value": "3.5"},
    {"label": "5 - 10 million", "value": "7.5"},
    {"label": "10 - 20 million", "value": "15"},
    {"label": "20 - 40 million", "value": "30"},
    {"label": "40 - 60 million", "value": "50"},
    {"label": "60 - 100 million", "value": "80"},
    {"label": "Over 100 million", "value": "100"}
  ]'::jsonb
WHERE field_name = 'annualPassengers';

-- Terminal square footage -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '500000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "50,000 - 100,000 sq ft", "value": "75000"},
    {"label": "100,000 - 250,000 sq ft", "value": "175000"},
    {"label": "250,000 - 500,000 sq ft", "value": "375000"},
    {"label": "500,000 - 1 million sq ft", "value": "750000"},
    {"label": "1 - 2 million sq ft", "value": "1500000"},
    {"label": "2 - 5 million sq ft", "value": "3500000"},
    {"label": "5 - 10 million sq ft", "value": "7500000"},
    {"label": "Over 10 million sq ft", "value": "10000000"}
  ]'::jsonb
WHERE field_name = 'terminalSqFt';

-- Number of gates -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '40',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "5 - 10 gates", "value": "8"},
    {"label": "10 - 20 gates", "value": "15"},
    {"label": "20 - 40 gates", "value": "30"},
    {"label": "40 - 60 gates", "value": "50"},
    {"label": "60 - 100 gates", "value": "80"},
    {"label": "100 - 150 gates", "value": "125"},
    {"label": "150 - 200 gates", "value": "175"},
    {"label": "Over 200 gates", "value": "200"}
  ]'::jsonb
WHERE field_name = 'gateCount';

-- =============================================================================
-- HOTEL QUESTIONS
-- =============================================================================

-- Number of guest rooms -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '150',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10 - 50 rooms (Boutique)", "value": "30"},
    {"label": "50 - 100 rooms (Small)", "value": "75"},
    {"label": "100 - 200 rooms (Mid-size)", "value": "150"},
    {"label": "200 - 400 rooms (Large)", "value": "300"},
    {"label": "400 - 700 rooms (Major)", "value": "550"},
    {"label": "700 - 1000 rooms (Convention)", "value": "850"},
    {"label": "1000 - 1500 rooms (Mega)", "value": "1250"},
    {"label": "Over 1500 rooms (Resort)", "value": "1750"}
  ]'::jsonb
WHERE field_name = 'roomCount';

-- =============================================================================
-- HOSPITAL QUESTIONS
-- =============================================================================

-- Number of patient beds -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '200',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10 - 50 beds (Community clinic)", "value": "30"},
    {"label": "50 - 100 beds (Small hospital)", "value": "75"},
    {"label": "100 - 200 beds (Medium hospital)", "value": "150"},
    {"label": "200 - 400 beds (Regional hospital)", "value": "300"},
    {"label": "400 - 600 beds (Large hospital)", "value": "500"},
    {"label": "600 - 1000 beds (Major medical center)", "value": "800"},
    {"label": "1000 - 1500 beds (Teaching hospital)", "value": "1250"},
    {"label": "Over 1500 beds (Major medical campus)", "value": "1750"}
  ]'::jsonb
WHERE field_name = 'bedCount';

-- Number of operating rooms -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '10',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "1 - 5 ORs", "value": "3"},
    {"label": "5 - 10 ORs", "value": "8"},
    {"label": "10 - 20 ORs", "value": "15"},
    {"label": "20 - 30 ORs", "value": "25"},
    {"label": "30 - 50 ORs", "value": "40"},
    {"label": "Over 50 ORs", "value": "50"}
  ]'::jsonb
WHERE field_name = 'operatingRooms';

-- Number of ICU beds -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '20',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "None", "value": "0"},
    {"label": "1 - 10 ICU beds", "value": "5"},
    {"label": "10 - 25 ICU beds", "value": "18"},
    {"label": "25 - 50 ICU beds", "value": "38"},
    {"label": "50 - 100 ICU beds", "value": "75"},
    {"label": "100 - 150 ICU beds", "value": "125"},
    {"label": "Over 150 ICU beds", "value": "175"}
  ]'::jsonb
WHERE field_name = 'icuBeds';

-- =============================================================================
-- DATA CENTER QUESTIONS
-- =============================================================================

-- Number of server racks -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '100',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10 - 25 racks (Small edge)", "value": "18"},
    {"label": "25 - 50 racks (Edge colocation)", "value": "38"},
    {"label": "50 - 100 racks (Small DC)", "value": "75"},
    {"label": "100 - 250 racks (Mid-size DC)", "value": "175"},
    {"label": "250 - 500 racks (Large DC)", "value": "375"},
    {"label": "500 - 1000 racks (Enterprise)", "value": "750"},
    {"label": "1000 - 2500 racks (Hyperscale)", "value": "1750"},
    {"label": "Over 2500 racks (Mega DC)", "value": "3000"}
  ]'::jsonb
WHERE field_name = 'rackCount';

-- Total IT load (kW) -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '2000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "100 - 500 kW (Edge)", "value": "300"},
    {"label": "500 - 1000 kW (Small DC)", "value": "750"},
    {"label": "1 - 2 MW", "value": "1500"},
    {"label": "2 - 5 MW", "value": "3500"},
    {"label": "5 - 10 MW", "value": "7500"},
    {"label": "10 - 25 MW", "value": "17500"},
    {"label": "25 - 50 MW", "value": "37500"},
    {"label": "Over 50 MW", "value": "75000"}
  ]'::jsonb
WHERE field_name = 'itLoadKW';

-- Uptime tier -> Dropdown (already well-suited for dropdown)
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '3',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "Tier 1 (99.67% - Basic)", "value": "1"},
    {"label": "Tier 2 (99.74% - Redundant capacity)", "value": "2"},
    {"label": "Tier 3 (99.98% - Concurrent maintainable)", "value": "3"},
    {"label": "Tier 4 (99.99% - Fault tolerant)", "value": "4"}
  ]'::jsonb
WHERE field_name = 'uptimeTier';

-- UPS runtime (minutes) -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '15',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "5 minutes", "value": "5"},
    {"label": "10 minutes", "value": "10"},
    {"label": "15 minutes", "value": "15"},
    {"label": "20 minutes", "value": "20"},
    {"label": "30 minutes", "value": "30"},
    {"label": "45 minutes", "value": "45"},
    {"label": "60 minutes", "value": "60"}
  ]'::jsonb
WHERE field_name = 'upsRuntimeMin';

-- =============================================================================
-- OFFICE BUILDING QUESTIONS
-- =============================================================================

-- Office building square footage -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '100000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "5,000 - 15,000 sq ft (Small office)", "value": "10000"},
    {"label": "15,000 - 30,000 sq ft", "value": "22500"},
    {"label": "30,000 - 50,000 sq ft", "value": "40000"},
    {"label": "50,000 - 100,000 sq ft", "value": "75000"},
    {"label": "100,000 - 250,000 sq ft", "value": "175000"},
    {"label": "250,000 - 500,000 sq ft", "value": "375000"},
    {"label": "500,000 - 1 million sq ft", "value": "750000"},
    {"label": "Over 1 million sq ft", "value": "1500000"}
  ]'::jsonb
WHERE field_name = 'squareFeet' AND use_case_id IN (SELECT id FROM use_cases WHERE slug = 'office');

-- Number of floors -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '5',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "1 - 3 floors", "value": "2"},
    {"label": "4 - 10 floors", "value": "7"},
    {"label": "11 - 20 floors", "value": "15"},
    {"label": "21 - 40 floors", "value": "30"},
    {"label": "41 - 60 floors", "value": "50"},
    {"label": "Over 60 floors", "value": "75"}
  ]'::jsonb
WHERE field_name = 'floors';

-- Number of employees -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '250',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10 - 50 employees", "value": "30"},
    {"label": "50 - 100 employees", "value": "75"},
    {"label": "100 - 250 employees", "value": "175"},
    {"label": "250 - 500 employees", "value": "375"},
    {"label": "500 - 1000 employees", "value": "750"},
    {"label": "1000 - 2500 employees", "value": "1750"},
    {"label": "2500 - 5000 employees", "value": "3750"},
    {"label": "Over 5000 employees", "value": "7500"}
  ]'::jsonb
WHERE field_name = 'employees';

-- =============================================================================
-- WAREHOUSE QUESTIONS
-- =============================================================================

-- Warehouse square footage -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '200000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10,000 - 25,000 sq ft (Small)", "value": "17500"},
    {"label": "25,000 - 50,000 sq ft", "value": "37500"},
    {"label": "50,000 - 100,000 sq ft", "value": "75000"},
    {"label": "100,000 - 200,000 sq ft", "value": "150000"},
    {"label": "200,000 - 500,000 sq ft", "value": "350000"},
    {"label": "500,000 - 1 million sq ft", "value": "750000"},
    {"label": "1 - 2 million sq ft", "value": "1500000"},
    {"label": "Over 2 million sq ft", "value": "2000000"}
  ]'::jsonb
WHERE field_name = 'squareFeet' AND use_case_id IN (SELECT id FROM use_cases WHERE slug = 'warehouse');

-- Number of loading docks -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '20',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "2 - 5 docks", "value": "4"},
    {"label": "5 - 10 docks", "value": "8"},
    {"label": "10 - 25 docks", "value": "18"},
    {"label": "25 - 50 docks", "value": "38"},
    {"label": "50 - 100 docks", "value": "75"},
    {"label": "100 - 150 docks", "value": "125"},
    {"label": "Over 150 docks", "value": "175"}
  ]'::jsonb
WHERE field_name = 'loadingDocks';

-- Electric forklifts -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '10',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "None", "value": "0"},
    {"label": "1 - 5 forklifts", "value": "3"},
    {"label": "5 - 10 forklifts", "value": "8"},
    {"label": "10 - 25 forklifts", "value": "18"},
    {"label": "25 - 50 forklifts", "value": "38"},
    {"label": "50 - 100 forklifts", "value": "75"},
    {"label": "Over 100 forklifts", "value": "100"}
  ]'::jsonb
WHERE field_name = 'electricForklifts';

-- =============================================================================
-- MANUFACTURING QUESTIONS
-- =============================================================================

-- Manufacturing square footage -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '200000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10,000 - 50,000 sq ft", "value": "30000"},
    {"label": "50,000 - 100,000 sq ft", "value": "75000"},
    {"label": "100,000 - 250,000 sq ft", "value": "175000"},
    {"label": "250,000 - 500,000 sq ft", "value": "375000"},
    {"label": "500,000 - 1 million sq ft", "value": "750000"},
    {"label": "1 - 2 million sq ft", "value": "1500000"},
    {"label": "2 - 5 million sq ft", "value": "3500000"},
    {"label": "Over 5 million sq ft", "value": "5000000"}
  ]'::jsonb
WHERE field_name = 'squareFeet' AND use_case_id IN (SELECT id FROM use_cases WHERE slug = 'manufacturing');

-- Production shifts per day -> Dropdown
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '2',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "1 shift (8 hours)", "value": "1"},
    {"label": "2 shifts (16 hours)", "value": "2"},
    {"label": "3 shifts (24/7)", "value": "3"}
  ]'::jsonb
WHERE field_name = 'shiftsPerDay';

-- =============================================================================
-- COLLEGE/UNIVERSITY QUESTIONS
-- =============================================================================

-- Campus square footage -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '500000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "50,000 - 200,000 sq ft (Small campus)", "value": "125000"},
    {"label": "200,000 - 500,000 sq ft", "value": "350000"},
    {"label": "500,000 - 1 million sq ft", "value": "750000"},
    {"label": "1 - 2 million sq ft", "value": "1500000"},
    {"label": "2 - 5 million sq ft", "value": "3500000"},
    {"label": "5 - 10 million sq ft", "value": "7500000"},
    {"label": "Over 10 million sq ft", "value": "10000000"}
  ]'::jsonb
WHERE field_name = 'squareFeet' AND use_case_id IN (SELECT id FROM use_cases WHERE slug = 'college');

-- Number of buildings -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '20',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "1 - 5 buildings", "value": "3"},
    {"label": "5 - 15 buildings", "value": "10"},
    {"label": "15 - 30 buildings", "value": "22"},
    {"label": "30 - 50 buildings", "value": "40"},
    {"label": "50 - 100 buildings", "value": "75"},
    {"label": "100 - 200 buildings", "value": "150"},
    {"label": "Over 200 buildings", "value": "200"}
  ]'::jsonb
WHERE field_name = 'buildings';

-- Student enrollment -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '10000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "500 - 2,000 students", "value": "1250"},
    {"label": "2,000 - 5,000 students", "value": "3500"},
    {"label": "5,000 - 10,000 students", "value": "7500"},
    {"label": "10,000 - 20,000 students", "value": "15000"},
    {"label": "20,000 - 40,000 students", "value": "30000"},
    {"label": "40,000 - 60,000 students", "value": "50000"},
    {"label": "Over 60,000 students", "value": "75000"}
  ]'::jsonb
WHERE field_name = 'enrollment';

-- =============================================================================
-- CAR WASH QUESTIONS
-- =============================================================================

-- Number of wash bays -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '4',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "1 - 2 bays (Express)", "value": "2"},
    {"label": "3 - 4 bays (Standard)", "value": "4"},
    {"label": "5 - 8 bays (Large)", "value": "6"},
    {"label": "8 - 12 bays (Full service)", "value": "10"},
    {"label": "12 - 20 bays (Mega)", "value": "16"}
  ]'::jsonb
WHERE field_name = 'washBays';

-- Daily vehicles washed -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '200',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "50 - 100 vehicles/day", "value": "75"},
    {"label": "100 - 200 vehicles/day", "value": "150"},
    {"label": "200 - 400 vehicles/day", "value": "300"},
    {"label": "400 - 700 vehicles/day", "value": "550"},
    {"label": "700 - 1000 vehicles/day", "value": "850"},
    {"label": "Over 1000 vehicles/day", "value": "1500"}
  ]'::jsonb
WHERE field_name = 'dailyVehicles';

-- =============================================================================
-- EV CHARGING QUESTIONS
-- =============================================================================

-- Number of DC fast chargers -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '4',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "None", "value": "0"},
    {"label": "1 - 2 DCFC", "value": "2"},
    {"label": "3 - 5 DCFC", "value": "4"},
    {"label": "6 - 10 DCFC", "value": "8"},
    {"label": "10 - 20 DCFC", "value": "15"},
    {"label": "20 - 50 DCFC", "value": "35"},
    {"label": "Over 50 DCFC", "value": "50"}
  ]'::jsonb
WHERE field_name = 'dcfastCount';

-- Number of Level 2 chargers -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '8',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "None", "value": "0"},
    {"label": "1 - 5 Level 2", "value": "3"},
    {"label": "5 - 10 Level 2", "value": "8"},
    {"label": "10 - 25 Level 2", "value": "18"},
    {"label": "25 - 50 Level 2", "value": "38"},
    {"label": "50 - 100 Level 2", "value": "75"},
    {"label": "Over 100 Level 2", "value": "100"}
  ]'::jsonb
WHERE field_name = 'level2Count';

-- Daily charging sessions -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '50',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10 - 25 sessions/day", "value": "18"},
    {"label": "25 - 50 sessions/day", "value": "38"},
    {"label": "50 - 100 sessions/day", "value": "75"},
    {"label": "100 - 200 sessions/day", "value": "150"},
    {"label": "200 - 500 sessions/day", "value": "350"},
    {"label": "Over 500 sessions/day", "value": "500"}
  ]'::jsonb
WHERE field_name = 'dailySessions';

-- Average charge time (minutes) -> Dropdown
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '30',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10 - 20 minutes (DCFC)", "value": "15"},
    {"label": "20 - 30 minutes", "value": "25"},
    {"label": "30 - 45 minutes", "value": "38"},
    {"label": "45 - 60 minutes", "value": "52"},
    {"label": "1 - 2 hours (Level 2)", "value": "90"},
    {"label": "Over 2 hours", "value": "120"}
  ]'::jsonb
WHERE field_name = 'avgChargeTime';

-- =============================================================================
-- RETAIL QUESTIONS
-- =============================================================================

-- Store square footage -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '50000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "1,000 - 5,000 sq ft (Small)", "value": "3000"},
    {"label": "5,000 - 15,000 sq ft", "value": "10000"},
    {"label": "15,000 - 30,000 sq ft", "value": "22500"},
    {"label": "30,000 - 75,000 sq ft", "value": "52500"},
    {"label": "75,000 - 150,000 sq ft", "value": "112500"},
    {"label": "150,000 - 300,000 sq ft (Big box)", "value": "225000"},
    {"label": "Over 300,000 sq ft", "value": "400000"}
  ]'::jsonb
WHERE field_name = 'squareFeet' AND use_case_id IN (SELECT id FROM use_cases WHERE slug = 'retail');

-- Number of parking spaces -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '200',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10 - 50 spaces", "value": "30"},
    {"label": "50 - 100 spaces", "value": "75"},
    {"label": "100 - 250 spaces", "value": "175"},
    {"label": "250 - 500 spaces", "value": "375"},
    {"label": "500 - 1000 spaces", "value": "750"},
    {"label": "1000 - 2500 spaces", "value": "1750"},
    {"label": "Over 2500 spaces", "value": "3500"}
  ]'::jsonb
WHERE field_name = 'parkingSpaces';

-- =============================================================================
-- COLD STORAGE QUESTIONS
-- =============================================================================

-- Cold storage square footage -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '100000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "5,000 - 15,000 sq ft", "value": "10000"},
    {"label": "15,000 - 30,000 sq ft", "value": "22500"},
    {"label": "30,000 - 75,000 sq ft", "value": "52500"},
    {"label": "75,000 - 150,000 sq ft", "value": "112500"},
    {"label": "150,000 - 300,000 sq ft", "value": "225000"},
    {"label": "300,000 - 500,000 sq ft", "value": "400000"},
    {"label": "500,000 - 1 million sq ft", "value": "750000"},
    {"label": "Over 1 million sq ft", "value": "1000000"}
  ]'::jsonb
WHERE field_name = 'squareFeet' AND use_case_id IN (SELECT id FROM use_cases WHERE slug = 'cold-storage');

-- Storage temperature (°F) -> Dropdown
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '35',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "-20°F (Deep freeze)", "value": "-20"},
    {"label": "0°F (Frozen storage)", "value": "0"},
    {"label": "28°F (Ice cream)", "value": "28"},
    {"label": "35°F (Fresh produce)", "value": "35"},
    {"label": "40°F (Dairy/deli)", "value": "40"},
    {"label": "45°F (Wine/beverage)", "value": "45"},
    {"label": "55°F (Cool storage)", "value": "55"}
  ]'::jsonb
WHERE field_name = 'storageTemp';

-- =============================================================================
-- UNIVERSAL QUESTIONS (apply to many use cases)
-- =============================================================================

-- Operating hours per day -> Dropdown (common across many use cases)
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "6 hours", "value": "6"},
    {"label": "8 hours (Standard business)", "value": "8"},
    {"label": "10 hours", "value": "10"},
    {"label": "12 hours", "value": "12"},
    {"label": "16 hours", "value": "16"},
    {"label": "20 hours", "value": "20"},
    {"label": "24 hours (24/7)", "value": "24"}
  ]'::jsonb
WHERE field_name = 'operatingHours' AND question_type = 'number';

-- Backup hours -> Dropdown
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "2 hours", "value": "2"},
    {"label": "4 hours", "value": "4"},
    {"label": "8 hours", "value": "8"},
    {"label": "12 hours", "value": "12"},
    {"label": "24 hours", "value": "24"},
    {"label": "48 hours", "value": "48"},
    {"label": "72 hours", "value": "72"},
    {"label": "96 hours", "value": "96"}
  ]'::jsonb
WHERE field_name = 'backupHours';

-- =============================================================================
-- PEAK DEMAND (kW) - Universal with different ranges by industry
-- =============================================================================

-- Peak demand for smaller facilities (car wash, retail, small office)
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "20 - 50 kW", "value": "35"},
    {"label": "50 - 100 kW", "value": "75"},
    {"label": "100 - 200 kW", "value": "150"},
    {"label": "200 - 400 kW", "value": "300"},
    {"label": "400 - 750 kW", "value": "575"},
    {"label": "750 - 1000 kW", "value": "875"},
    {"label": "Over 1000 kW", "value": "1500"}
  ]'::jsonb
WHERE field_name = 'peakDemandKW' 
  AND use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('car-wash', 'retail', 'office'));

-- Peak demand for medium facilities (warehouse, cold storage)
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "50 - 250 kW", "value": "150"},
    {"label": "250 - 500 kW", "value": "375"},
    {"label": "500 - 1000 kW", "value": "750"},
    {"label": "1 - 2 MW", "value": "1500"},
    {"label": "2 - 5 MW", "value": "3500"},
    {"label": "5 - 10 MW", "value": "7500"},
    {"label": "Over 10 MW", "value": "10000"}
  ]'::jsonb
WHERE field_name = 'peakDemandKW' 
  AND use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('warehouse', 'cold-storage'));

-- Peak demand for large facilities (manufacturing, college)
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "100 - 500 kW", "value": "300"},
    {"label": "500 - 1000 kW", "value": "750"},
    {"label": "1 - 2 MW", "value": "1500"},
    {"label": "2 - 5 MW", "value": "3500"},
    {"label": "5 - 10 MW", "value": "7500"},
    {"label": "10 - 25 MW", "value": "17500"},
    {"label": "25 - 50 MW", "value": "37500"},
    {"label": "Over 50 MW", "value": "75000"}
  ]'::jsonb
WHERE field_name = 'peakDemandKW' 
  AND use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('manufacturing', 'college'));

-- =============================================================================
-- GRID CAPACITY (kW) - Universal with different ranges
-- =============================================================================

-- Grid capacity for smaller facilities
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "50 - 100 kW", "value": "75"},
    {"label": "100 - 250 kW", "value": "175"},
    {"label": "250 - 500 kW", "value": "375"},
    {"label": "500 - 1000 kW", "value": "750"},
    {"label": "1 - 2 MW", "value": "1500"},
    {"label": "2 - 5 MW", "value": "3500"},
    {"label": "Over 5 MW", "value": "7500"}
  ]'::jsonb
WHERE field_name = 'gridCapacityKW' 
  AND use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('car-wash', 'retail', 'office', 'ev-charging', 'hotel', 'hotel-hospitality'));

-- Grid capacity for larger facilities
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "500 kW - 1 MW", "value": "750"},
    {"label": "1 - 2 MW", "value": "1500"},
    {"label": "2 - 5 MW", "value": "3500"},
    {"label": "5 - 10 MW", "value": "7500"},
    {"label": "10 - 25 MW", "value": "17500"},
    {"label": "25 - 50 MW", "value": "37500"},
    {"label": "50 - 100 MW", "value": "75000"},
    {"label": "Over 100 MW", "value": "150000"}
  ]'::jsonb
WHERE field_name = 'gridCapacityKW' 
  AND use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('hospital', 'data-center', 'warehouse', 'manufacturing', 'college'));

-- Airport grid capacity (in MW)
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "1 - 5 MW", "value": "3"},
    {"label": "5 - 10 MW", "value": "7.5"},
    {"label": "10 - 25 MW", "value": "17.5"},
    {"label": "25 - 50 MW", "value": "37.5"},
    {"label": "50 - 100 MW", "value": "75"},
    {"label": "100 - 200 MW", "value": "150"},
    {"label": "Over 200 MW", "value": "200"}
  ]'::jsonb
WHERE field_name = 'gridCapacityMW';

-- =============================================================================
-- MONTHLY ELECTRIC BILL & DEMAND CHARGES - Universal
-- =============================================================================

-- Monthly electric bill -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "$1,000 - $5,000/month", "value": "3000"},
    {"label": "$5,000 - $10,000/month", "value": "7500"},
    {"label": "$10,000 - $25,000/month", "value": "17500"},
    {"label": "$25,000 - $50,000/month", "value": "37500"},
    {"label": "$50,000 - $100,000/month", "value": "75000"},
    {"label": "$100,000 - $250,000/month", "value": "175000"},
    {"label": "$250,000 - $500,000/month", "value": "375000"},
    {"label": "Over $500,000/month", "value": "500000"}
  ]'::jsonb
WHERE field_name = 'monthlyElectricBill';

-- Monthly demand charges -> Dropdown with ranges
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "None / Not sure", "value": "0"},
    {"label": "$100 - $500/month", "value": "300"},
    {"label": "$500 - $1,500/month", "value": "1000"},
    {"label": "$1,500 - $3,000/month", "value": "2250"},
    {"label": "$3,000 - $7,500/month", "value": "5250"},
    {"label": "$7,500 - $15,000/month", "value": "11250"},
    {"label": "$15,000 - $30,000/month", "value": "22500"},
    {"label": "$30,000 - $75,000/month", "value": "52500"},
    {"label": "Over $75,000/month", "value": "100000"}
  ]'::jsonb
WHERE field_name = 'monthlyDemandCharges';

-- Demand charge rate ($/kW) -> Dropdown
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "$5/kW or less", "value": "5"},
    {"label": "$5 - $10/kW", "value": "7.5"},
    {"label": "$10 - $15/kW", "value": "12.5"},
    {"label": "$15 - $20/kW", "value": "17.5"},
    {"label": "$20 - $30/kW", "value": "25"},
    {"label": "$30 - $50/kW", "value": "40"},
    {"label": "Over $50/kW", "value": "50"}
  ]'::jsonb
WHERE field_name = 'demandChargeRate';

-- =============================================================================
-- EXISTING SOLAR CAPACITY (kW) - Universal with industry-appropriate ranges
-- =============================================================================

-- Smaller facilities solar
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "None", "value": "0"},
    {"label": "1 - 25 kW", "value": "13"},
    {"label": "25 - 50 kW", "value": "38"},
    {"label": "50 - 100 kW", "value": "75"},
    {"label": "100 - 250 kW", "value": "175"},
    {"label": "250 - 500 kW", "value": "375"},
    {"label": "500 kW - 1 MW", "value": "750"},
    {"label": "Over 1 MW", "value": "1500"}
  ]'::jsonb
WHERE field_name = 'existingSolarKW'
  AND use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('car-wash', 'retail', 'office', 'ev-charging', 'hotel', 'hotel-hospitality'));

-- Larger facilities solar
UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "None", "value": "0"},
    {"label": "100 - 500 kW", "value": "300"},
    {"label": "500 kW - 1 MW", "value": "750"},
    {"label": "1 - 2 MW", "value": "1500"},
    {"label": "2 - 5 MW", "value": "3500"},
    {"label": "5 - 10 MW", "value": "7500"},
    {"label": "10 - 20 MW", "value": "15000"},
    {"label": "Over 20 MW", "value": "20000"}
  ]'::jsonb
WHERE field_name = 'existingSolarKW'
  AND use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('hospital', 'data-center', 'warehouse', 'manufacturing', 'college', 'airport'));

-- =============================================================================
-- EXISTING EV CHARGERS - Universal
-- =============================================================================

UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "None", "value": "0"},
    {"label": "1 - 5 chargers", "value": "3"},
    {"label": "5 - 10 chargers", "value": "8"},
    {"label": "10 - 25 chargers", "value": "18"},
    {"label": "25 - 50 chargers", "value": "38"},
    {"label": "50 - 100 chargers", "value": "75"},
    {"label": "100 - 250 chargers", "value": "175"},
    {"label": "Over 250 chargers", "value": "350"}
  ]'::jsonb
WHERE field_name = 'existingEVChargers';

-- =============================================================================
-- REFRIGERATION LOAD (kW) - For cold storage
-- =============================================================================

UPDATE custom_questions SET 
  question_type = 'select',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "50 - 100 kW", "value": "75"},
    {"label": "100 - 250 kW", "value": "175"},
    {"label": "250 - 500 kW", "value": "375"},
    {"label": "500 - 1000 kW", "value": "750"},
    {"label": "1 - 2 MW", "value": "1500"},
    {"label": "2 - 5 MW", "value": "3500"},
    {"label": "5 - 10 MW", "value": "7500"},
    {"label": "Over 10 MW", "value": "10000"}
  ]'::jsonb
WHERE field_name = 'refrigerationKW';

-- =============================================================================
-- PUE TARGET - For data centers
-- =============================================================================

UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '1.4',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "1.1 - 1.2 (Best-in-class)", "value": "1.15"},
    {"label": "1.2 - 1.3 (Excellent)", "value": "1.25"},
    {"label": "1.3 - 1.4 (Good)", "value": "1.35"},
    {"label": "1.4 - 1.5 (Average)", "value": "1.45"},
    {"label": "1.5 - 1.6 (Below average)", "value": "1.55"},
    {"label": "1.6 - 2.0 (Legacy)", "value": "1.8"},
    {"label": "Over 2.0 (Inefficient)", "value": "2.2"}
  ]'::jsonb
WHERE field_name = 'pueTarget';

-- =============================================================================
-- VERIFY CHANGES
-- =============================================================================

-- =============================================================================
-- ADDITIONAL INDUSTRY-SPECIFIC QUESTIONS
-- =============================================================================

-- APARTMENT - Number of units -> Dropdown
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '100',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10 - 25 units (Small)", "value": "18"},
    {"label": "25 - 50 units", "value": "38"},
    {"label": "50 - 100 units (Mid-rise)", "value": "75"},
    {"label": "100 - 200 units (Large)", "value": "150"},
    {"label": "200 - 400 units (High-rise)", "value": "300"},
    {"label": "400 - 700 units (Luxury)", "value": "550"},
    {"label": "Over 700 units (Complex)", "value": "850"}
  ]'::jsonb
WHERE field_name = 'units';

-- APARTMENT - Building square footage
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '150000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10,000 - 30,000 sq ft", "value": "20000"},
    {"label": "30,000 - 75,000 sq ft", "value": "52500"},
    {"label": "75,000 - 150,000 sq ft", "value": "112500"},
    {"label": "150,000 - 300,000 sq ft", "value": "225000"},
    {"label": "300,000 - 500,000 sq ft", "value": "400000"},
    {"label": "500,000 - 1 million sq ft", "value": "750000"},
    {"label": "Over 1 million sq ft", "value": "1500000"}
  ]'::jsonb
WHERE field_name = 'squareFeet' AND use_case_id IN (SELECT id FROM use_cases WHERE slug = 'apartment');

-- RESIDENTIAL - Home square footage
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '2500',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "500 - 1,000 sq ft (Apartment/Condo)", "value": "750"},
    {"label": "1,000 - 1,500 sq ft", "value": "1250"},
    {"label": "1,500 - 2,500 sq ft", "value": "2000"},
    {"label": "2,500 - 4,000 sq ft", "value": "3250"},
    {"label": "4,000 - 6,000 sq ft", "value": "5000"},
    {"label": "6,000 - 10,000 sq ft", "value": "8000"},
    {"label": "Over 10,000 sq ft (Estate)", "value": "15000"}
  ]'::jsonb
WHERE field_name = 'squareFeet' AND use_case_id IN (SELECT id FROM use_cases WHERE slug = 'residential');

-- RESIDENTIAL - Monthly electric bill
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '200',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "$50 - $100/month", "value": "75"},
    {"label": "$100 - $200/month", "value": "150"},
    {"label": "$200 - $350/month", "value": "275"},
    {"label": "$350 - $500/month", "value": "425"},
    {"label": "$500 - $800/month", "value": "650"},
    {"label": "$800 - $1,200/month", "value": "1000"},
    {"label": "Over $1,200/month", "value": "1500"}
  ]'::jsonb
WHERE field_name = 'monthlyBill';

-- RESIDENTIAL - Number of occupants
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '4',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "1 person", "value": "1"},
    {"label": "2 people", "value": "2"},
    {"label": "3-4 people", "value": "4"},
    {"label": "5-6 people", "value": "6"},
    {"label": "7-8 people", "value": "8"},
    {"label": "9+ people", "value": "10"}
  ]'::jsonb
WHERE field_name = 'occupants';

-- SHOPPING CENTER - Number of tenant spaces
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '50',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "5 - 15 tenants (Strip mall)", "value": "10"},
    {"label": "15 - 30 tenants", "value": "22"},
    {"label": "30 - 75 tenants", "value": "52"},
    {"label": "75 - 150 tenants", "value": "112"},
    {"label": "150 - 300 tenants (Major mall)", "value": "225"},
    {"label": "Over 300 tenants (Mega mall)", "value": "400"}
  ]'::jsonb
WHERE field_name = 'tenants';

-- SHOPPING CENTER - Square footage
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '300000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "20,000 - 75,000 sq ft (Strip center)", "value": "47500"},
    {"label": "75,000 - 150,000 sq ft", "value": "112500"},
    {"label": "150,000 - 400,000 sq ft", "value": "275000"},
    {"label": "400,000 - 800,000 sq ft", "value": "600000"},
    {"label": "800,000 - 1.5 million sq ft", "value": "1150000"},
    {"label": "1.5 - 3 million sq ft (Super regional)", "value": "2250000"},
    {"label": "Over 3 million sq ft", "value": "3000000"}
  ]'::jsonb
WHERE field_name = 'squareFeet' AND use_case_id IN (SELECT id FROM use_cases WHERE slug = 'shopping-center');

-- CASINO - Number of gaming machines
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '1000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "50 - 200 machines (Card room)", "value": "125"},
    {"label": "200 - 500 machines (Small casino)", "value": "350"},
    {"label": "500 - 1,000 machines", "value": "750"},
    {"label": "1,000 - 2,500 machines", "value": "1750"},
    {"label": "2,500 - 5,000 machines (Large)", "value": "3750"},
    {"label": "Over 5,000 machines (Mega resort)", "value": "7500"}
  ]'::jsonb
WHERE field_name = 'gamingMachines';

-- CASINO - Square footage
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '100000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "10,000 - 30,000 sq ft (Card room)", "value": "20000"},
    {"label": "30,000 - 75,000 sq ft", "value": "52500"},
    {"label": "75,000 - 150,000 sq ft", "value": "112500"},
    {"label": "150,000 - 300,000 sq ft", "value": "225000"},
    {"label": "300,000 - 500,000 sq ft (Resort)", "value": "400000"},
    {"label": "500,000 - 1 million sq ft", "value": "750000"},
    {"label": "Over 1 million sq ft (Mega)", "value": "1000000"}
  ]'::jsonb
WHERE field_name = 'squareFeet' AND use_case_id IN (SELECT id FROM use_cases WHERE slug = 'casino');

-- GAS STATION - Number of fuel dispensers
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '8',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "2 - 4 dispensers (Small)", "value": "3"},
    {"label": "4 - 8 dispensers (Standard)", "value": "6"},
    {"label": "8 - 12 dispensers (Large)", "value": "10"},
    {"label": "12 - 20 dispensers (Travel center)", "value": "16"},
    {"label": "20 - 30 dispensers (Truck stop)", "value": "25"}
  ]'::jsonb
WHERE field_name = 'fuelDispensers';

-- GAS STATION - Convenience store sq ft
UPDATE custom_questions SET 
  question_type = 'select',
  default_value = '3000',
  min_value = NULL,
  max_value = NULL,
  options = '[
    {"label": "500 - 1,500 sq ft (Kiosk)", "value": "1000"},
    {"label": "1,500 - 3,000 sq ft (Small)", "value": "2250"},
    {"label": "3,000 - 5,000 sq ft (Standard)", "value": "4000"},
    {"label": "5,000 - 8,000 sq ft (Large)", "value": "6500"},
    {"label": "8,000 - 15,000 sq ft (Travel center)", "value": "11500"}
  ]'::jsonb
WHERE field_name = 'storeSqFt';

-- =============================================================================
-- VERIFY ALL CHANGES
-- =============================================================================

SELECT 
  uc.slug,
  cq.field_name,
  cq.question_type,
  CASE WHEN cq.options IS NOT NULL THEN 'Has options' ELSE 'No options' END as has_options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE cq.question_type = 'select'
ORDER BY uc.slug, cq.display_order;
