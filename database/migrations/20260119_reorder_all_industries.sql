-- ============================================================================
-- Migration: Reorder Car Wash, EV Charging, and Data Center Questions
-- Date: January 19, 2026
-- Purpose: Fix duplicate display_order values and establish logical flow
-- ============================================================================

-- ============================================================================
-- CAR WASH QUESTION REORDERING
-- ============================================================================

-- SECTION 1: FACILITY BASICS (1-10)
UPDATE custom_questions SET display_order = 1, section_name = 'Facility Basics' WHERE field_name = 'washType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 2, section_name = 'Facility Basics' WHERE field_name = 'bayCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 3, section_name = 'Facility Basics' WHERE field_name = 'operatingModel' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 4, section_name = 'Facility Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 5, section_name = 'Facility Basics' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 6, section_name = 'Facility Basics' WHERE field_name = 'vehiclesPerDay' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 2: EQUIPMENT (11-20)
UPDATE custom_questions SET display_order = 11, section_name = 'Equipment' WHERE field_name = 'equipmentType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 12, section_name = 'Equipment' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 13, section_name = 'Equipment' WHERE field_name = 'waterReclaim' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 3: ENERGY & POWER (21-30)
UPDATE custom_questions SET display_order = 21, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 22, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 23, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 24, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 4: ADDITIONAL SERVICES (31-40)
UPDATE custom_questions SET display_order = 31, section_name = 'Additional Services' WHERE field_name = 'ancillaryServices' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 32, section_name = 'Additional Services' WHERE field_name = 'vacuumIslands' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 5: EXISTING INFRASTRUCTURE (41-50)
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 6: SOLAR POTENTIAL (51-60)
UPDATE custom_questions SET display_order = 51, section_name = 'Solar Potential' WHERE field_name = 'solarInterest' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 52, section_name = 'Solar Potential' WHERE field_name = 'solarSpace' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
UPDATE custom_questions SET display_order = 53, section_name = 'Solar Potential' WHERE field_name = 'rooftopSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- SECTION 7: ENERGY GOALS (61-65)
UPDATE custom_questions SET display_order = 61, section_name = 'Energy Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- EV CHARGING QUESTION REORDERING
-- ============================================================================

-- SECTION 1: SITE BASICS (1-10)
UPDATE custom_questions SET display_order = 1, section_name = 'Site Basics' WHERE field_name = 'siteType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 2, section_name = 'Site Basics' WHERE field_name = 'locationType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 3, section_name = 'Site Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 4, section_name = 'Site Basics' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 5, section_name = 'Site Basics' WHERE field_name = 'parkingSpaces' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 2: CHARGER CONFIGURATION (11-20)
UPDATE custom_questions SET display_order = 11, section_name = 'Charger Configuration' WHERE field_name = 'chargerTypes' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 12, section_name = 'Charger Configuration' WHERE field_name = 'evChargerType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 13, section_name = 'Charger Configuration' WHERE field_name = 'chargerType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 14, section_name = 'Charger Configuration' WHERE field_name = 'level2Chargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 15, section_name = 'Charger Configuration' WHERE field_name = 'dcfcChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 16, section_name = 'Charger Configuration' WHERE field_name = 'dailyVehicles' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 3: ENERGY & POWER (21-30)
UPDATE custom_questions SET display_order = 21, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 22, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 23, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 24, section_name = 'Energy & Power' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 25, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 4: CUSTOMER AMENITIES (31-40)
UPDATE custom_questions SET display_order = 31, section_name = 'Customer Amenities' WHERE field_name = 'customerAmenities' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 32, section_name = 'Customer Amenities' WHERE field_name = 'paymentNetwork' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 5: EXISTING INFRASTRUCTURE (41-50)
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 6: SOLAR POTENTIAL (51-60)
UPDATE custom_questions SET display_order = 51, section_name = 'Solar Potential' WHERE field_name = 'solarInterest' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 52, section_name = 'Solar Potential' WHERE field_name = 'solarSpace' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
UPDATE custom_questions SET display_order = 53, section_name = 'Solar Potential' WHERE field_name = 'rooftopSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- SECTION 7: ENERGY GOALS (61-65)
UPDATE custom_questions SET display_order = 61, section_name = 'Energy Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- ============================================================================
-- DATA CENTER QUESTION REORDERING
-- ============================================================================

-- First, check for and remove semantic duplicates (coolingType vs hvacType)
-- Keep hvacType (already updated to multiselect), remove coolingType if exists
DELETE FROM custom_questions
WHERE field_name = 'coolingType'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
AND EXISTS (
    SELECT 1 FROM custom_questions 
    WHERE field_name = 'hvacType' 
    AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
);

-- SECTION 1: FACILITY BASICS (1-10)
UPDATE custom_questions SET display_order = 1, section_name = 'Facility Basics' WHERE field_name = 'tierLevel' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 2, section_name = 'Facility Basics' WHERE field_name = 'dataCenterTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 3, section_name = 'Facility Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 4, section_name = 'Facility Basics' WHERE field_name = 'rackCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 5, section_name = 'Facility Basics' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 2: IT LOAD (11-20)
UPDATE custom_questions SET display_order = 11, section_name = 'IT Load' WHERE field_name = 'itLoadKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 12, section_name = 'IT Load' WHERE field_name = 'workloadTypes' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 13, section_name = 'IT Load' WHERE field_name = 'currentPUE' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 14, section_name = 'IT Load' WHERE field_name = 'pueTarget' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 3: POWER INFRASTRUCTURE (21-30)
UPDATE custom_questions SET display_order = 21, section_name = 'Power Infrastructure' WHERE field_name = 'utilityConfig' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 22, section_name = 'Power Infrastructure' WHERE field_name = 'upsConfig' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 23, section_name = 'Power Infrastructure' WHERE field_name = 'generatorCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 24, section_name = 'Power Infrastructure' WHERE field_name = 'powerInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 4: ENERGY & GRID (31-40)
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Grid' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Grid' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Grid' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Grid' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Grid' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 5: COOLING (41-50)
UPDATE custom_questions SET display_order = 41, section_name = 'Cooling' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 42, section_name = 'Cooling' WHERE field_name = 'aisleContainment' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 6: EXISTING INFRASTRUCTURE (51-60)
UPDATE custom_questions SET display_order = 51, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 52, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 53, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 54, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 55, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 7: SOLAR POTENTIAL (61-70)
UPDATE custom_questions SET display_order = 61, section_name = 'Solar Potential' WHERE field_name = 'solarInterest' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 62, section_name = 'Solar Potential' WHERE field_name = 'solarSpace' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 63, section_name = 'Solar Potential' WHERE field_name = 'rooftopSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- SECTION 8: SUSTAINABILITY & GOALS (71-80)
UPDATE custom_questions SET display_order = 71, section_name = 'Sustainability & Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
UPDATE custom_questions SET display_order = 72, section_name = 'Sustainability & Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- ============================================================================
-- VERIFY: Show question counts with duplicate check
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
