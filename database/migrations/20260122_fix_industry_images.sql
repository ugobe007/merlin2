-- ============================================================================
-- FIX INDUSTRY IMAGE PATHS FOR WIZARDV7 STEP3
-- ============================================================================
-- Created: January 22, 2026
-- Purpose: Update use_cases.image_url to match actual asset file paths
--          Fixes missing images on WizardV7 Step 3 (Industry selection)
-- ============================================================================

-- Update image URLs to match actual asset paths
UPDATE use_cases SET image_url = '/assets/images/data-center-1.jpg' WHERE slug = 'data-center' OR slug = 'data_center';
UPDATE use_cases SET image_url = '/assets/images/office_building2.jpg' WHERE slug = 'office';
UPDATE use_cases SET image_url = '/assets/images/hotel_motel_holidayinn_1.jpg' WHERE slug = 'hotel' OR slug = 'hotel-hospitality';
UPDATE use_cases SET image_url = '/assets/images/car_wash_1.jpg' WHERE slug = 'car-wash' OR slug = 'car_wash';
UPDATE use_cases SET image_url = '/assets/images/ev_charging_station.jpg' WHERE slug = 'ev-charging' OR slug = 'ev_charging';
UPDATE use_cases SET image_url = '/assets/images/hospital_1.jpg' WHERE slug = 'hospital';
UPDATE use_cases SET image_url = '/assets/images/manufacturing_1.jpg' WHERE slug = 'manufacturing';
UPDATE use_cases SET image_url = '/assets/images/cold_storage.jpg' WHERE slug = 'cold-storage' OR slug = 'cold_storage';

-- Add images for additional industries (if they exist in use_cases)
UPDATE use_cases SET image_url = '/assets/images/warehouse_1.jpg' WHERE slug = 'warehouse';
UPDATE use_cases SET image_url = '/assets/images/retail_2.jpg' WHERE slug = 'retail';
UPDATE use_cases SET image_url = '/assets/images/shopping_center_1.jpg' WHERE slug = 'shopping-center' OR slug = 'shopping_center';
UPDATE use_cases SET image_url = '/assets/images/apartment_1.jpg' WHERE slug = 'apartment';
UPDATE use_cases SET image_url = '/assets/images/college_1.jpg' WHERE slug = 'college';
UPDATE use_cases SET image_url = '/assets/images/airport_11.jpeg' WHERE slug = 'airport';
UPDATE use_cases SET image_url = '/assets/images/casino_gaming1.jpg' WHERE slug = 'casino';
UPDATE use_cases SET image_url = '/assets/images/indoor_farm_1.jpg' WHERE slug = 'indoor-farm' OR slug = 'indoor_farm';
UPDATE use_cases SET image_url = '/assets/images/gas_station_2.jpg' WHERE slug = 'gas-station' OR slug = 'gas_station';

-- Verify updates
SELECT slug, name, image_url, category 
FROM use_cases 
WHERE slug IN (
  'data-center', 'data_center',
  'office', 
  'hotel', 'hotel-hospitality',
  'car-wash', 'car_wash',
  'ev-charging', 'ev_charging',
  'hospital',
  'manufacturing',
  'cold-storage', 'cold_storage'
)
ORDER BY slug;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN use_cases.image_url IS 'Path to industry image in /assets/images/ for WizardV7 Step3Industry cards';
