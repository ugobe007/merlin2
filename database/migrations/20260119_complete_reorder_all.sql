-- ============================================================================
-- Migration: Complete Reorder for Car Wash, EV Charging, Data Center
-- Date: January 19, 2026
-- Purpose: Fix ALL duplicate display_order values based on actual field names
-- ============================================================================

-- ============================================================================
-- CAR WASH - 32 questions, need unique orders 1-32
-- ============================================================================

-- SECTION 1: FACILITY BASICS (1-10)
UPDATE custom_questions SET display_order = 1, section_name = 'Facility Basics' WHERE field_name = 'facilityType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 2, section_name = 'Facility Basics' WHERE field_name = 'bayCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 3, section_name = 'Facility Basics' WHERE field_name = 'operatingModel' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 4, section_name = 'Facility Basics' WHERE field_name = 'tunnelLength' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 5, section_name = 'Facility Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 6, section_name = 'Facility Basics' WHERE field_name = 'dailyVehicles' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 7, section_name = 'Facility Basics' WHERE field_name = 'daysPerWeek' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 8, section_name = 'Facility Basics' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 2: EQUIPMENT (11-20)
UPDATE custom_questions SET display_order = 11, section_name = 'Equipment' WHERE field_name = 'vacuumStations' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 12, section_name = 'Equipment' WHERE field_name = 'blowerType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 13, section_name = 'Equipment' WHERE field_name = 'waterHeaterType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 14, section_name = 'Equipment' WHERE field_name = 'pumpConfiguration' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 15, section_name = 'Equipment' WHERE field_name = 'lightingType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 16, section_name = 'Equipment' WHERE field_name = 'conveyorMotorType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 17, section_name = 'Equipment' WHERE field_name = 'airCompressor' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 18, section_name = 'Equipment' WHERE field_name = 'waterReclaim' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 19, section_name = 'Equipment' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 3: BUILDING & UTILITIES (21-30)
UPDATE custom_questions SET display_order = 21, section_name = 'Building & Utilities' WHERE field_name = 'roofSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 22, section_name = 'Building & Utilities' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 23, section_name = 'Building & Utilities' WHERE field_name = 'hasNaturalGas' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 4: ENERGY & POWER (31-40)
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 5: ADDITIONAL SERVICES (41-45)
UPDATE custom_questions SET display_order = 41, section_name = 'Additional Services' WHERE field_name = 'ancillaryServices' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 42, section_name = 'Additional Services' WHERE field_name = 'evL2Count' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 43, section_name = 'Additional Services' WHERE field_name = 'evDcfcCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 6: EXISTING INFRASTRUCTURE (51-60)
UPDATE custom_questions SET display_order = 51, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 52, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 53, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 54, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 7: ENERGY GOALS (61-65)
UPDATE custom_questions SET display_order = 61, section_name = 'Energy Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- EV CHARGING - 32 questions, need unique orders 1-32
-- ============================================================================

-- SECTION 1: STATION BASICS (1-10)
UPDATE custom_questions SET display_order = 1, section_name = 'Station Basics' WHERE field_name = 'hubType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 2, section_name = 'Station Basics' WHERE field_name = 'hubSize' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 3, section_name = 'Station Basics' WHERE field_name = 'stationSize' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 4, section_name = 'Station Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 5, section_name = 'Station Basics' WHERE field_name = 'siteSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 6, section_name = 'Station Basics' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 2: CHARGER CONFIGURATION (11-25)
UPDATE custom_questions SET display_order = 11, section_name = 'Charger Configuration' WHERE field_name = 'level2Count' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 12, section_name = 'Charger Configuration' WHERE field_name = 'dcfc50Count' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 13, section_name = 'Charger Configuration' WHERE field_name = 'dcfcHighCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 14, section_name = 'Charger Configuration' WHERE field_name = 'dcFastCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 15, section_name = 'Charger Configuration' WHERE field_name = 'ultraFastCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 16, section_name = 'Charger Configuration' WHERE field_name = 'megawattCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 17, section_name = 'Charger Configuration' WHERE field_name = 'peakConcurrent' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 3: ELECTRICAL (26-35)
UPDATE custom_questions SET display_order = 26, section_name = 'Electrical' WHERE field_name = 'serviceVoltage' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 27, section_name = 'Electrical' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 4: ENERGY & POWER (36-45)
UPDATE custom_questions SET display_order = 36, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 37, section_name = 'Energy & Power' WHERE field_name = 'monthlyBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 38, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 39, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 40, section_name = 'Energy & Power' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 41, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 5: CUSTOMER AMENITIES (46-50)
UPDATE custom_questions SET display_order = 46, section_name = 'Customer Amenities' WHERE field_name = 'amenities' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 47, section_name = 'Customer Amenities' WHERE field_name = 'customerAmenities' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 48, section_name = 'Customer Amenities' WHERE field_name = 'paymentNetwork' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 6: EXISTING INFRASTRUCTURE (51-60)
UPDATE custom_questions SET display_order = 51, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 52, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 53, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 54, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 55, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 7: SOLAR POTENTIAL (61-65)
UPDATE custom_questions SET display_order = 61, section_name = 'Solar Potential' WHERE field_name = 'solarInterest' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 62, section_name = 'Solar Potential' WHERE field_name = 'solarSpace' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 8: ENERGY GOALS (71-75)
UPDATE custom_questions SET display_order = 71, section_name = 'Energy Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- ============================================================================
-- DATA CENTER - 32 questions, need unique orders 1-32
-- ============================================================================

-- SECTION 1: FACILITY BASICS (1-10)
UPDATE custom_questions SET display_order = 1, section_name = 'Facility Basics' WHERE field_name = 'dcType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 2, section_name = 'Facility Basics' WHERE field_name = 'tierLevel' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 3, section_name = 'Facility Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 4, section_name = 'Facility Basics' WHERE field_name = 'whitespaceSquareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 5, section_name = 'Facility Basics' WHERE field_name = 'rackCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 6, section_name = 'Facility Basics' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 2: IT LOAD (11-20)
UPDATE custom_questions SET display_order = 11, section_name = 'IT Load' WHERE field_name = 'itLoadKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 12, section_name = 'IT Load' WHERE field_name = 'workloadTypes' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 13, section_name = 'IT Load' WHERE field_name = 'currentPUE' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 3: POWER INFRASTRUCTURE (21-30)
UPDATE custom_questions SET display_order = 21, section_name = 'Power Infrastructure' WHERE field_name = 'utilityConfig' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 22, section_name = 'Power Infrastructure' WHERE field_name = 'upsConfig' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 23, section_name = 'Power Infrastructure' WHERE field_name = 'generatorCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 24, section_name = 'Power Infrastructure' WHERE field_name = 'powerInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 4: ENERGY & GRID (31-40)
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Grid' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Grid' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Grid' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Grid' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Grid' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 36, section_name = 'Energy & Grid' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 5: COOLING (41-50)
UPDATE custom_questions SET display_order = 41, section_name = 'Cooling' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 42, section_name = 'Cooling' WHERE field_name = 'aisleContainment' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 43, section_name = 'Cooling' WHERE field_name = 'freeCooling' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 6: EXISTING INFRASTRUCTURE (51-60)
UPDATE custom_questions SET display_order = 51, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 52, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 53, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 54, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 55, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 7: SOLAR & STORAGE INTEREST (61-70)
UPDATE custom_questions SET display_order = 61, section_name = 'Solar & Storage' WHERE field_name = 'solarInterest' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 62, section_name = 'Solar & Storage' WHERE field_name = 'batteryInterest' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 63, section_name = 'Solar & Storage' WHERE field_name = 'availableSpace' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 8: SUSTAINABILITY & GOALS (71-80)
UPDATE custom_questions SET display_order = 71, section_name = 'Sustainability & Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 72, section_name = 'Sustainability & Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- ============================================================================
-- VERIFY: Final check for all four industries
-- ============================================================================
SELECT 
    uc.slug,
    COUNT(*) as total_questions,
    COUNT(DISTINCT cq.display_order) as unique_orders,
    CASE WHEN COUNT(*) = COUNT(DISTINCT cq.display_order) THEN '✅ OK' ELSE '⚠️ DUPLICATES' END as status
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug IN ('hotel', 'car-wash', 'ev-charging', 'data-center')
GROUP BY uc.slug
ORDER BY uc.slug;
