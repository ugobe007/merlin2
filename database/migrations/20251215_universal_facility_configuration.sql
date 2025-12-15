-- ============================================================================
-- UNIVERSAL FACILITY CONFIGURATION MIGRATION
-- December 15, 2025
-- 
-- Adds two standard questions to ALL active use cases:
-- 1. facilitySubtype (display_order: 0) - Industry-specific facility type
-- 2. equipmentTier (display_order: 0.5) - Standard vs Premium equipment
--
-- These questions are PREPENDED to existing questions (display_order < 1)
-- so they appear FIRST in the wizard.
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Upsert custom question
-- ============================================================================
CREATE OR REPLACE FUNCTION upsert_custom_question(
  p_slug TEXT,
  p_field_name TEXT,
  p_question_text TEXT,
  p_question_type TEXT,
  p_default_value TEXT,
  p_help_text TEXT,
  p_display_order NUMERIC,
  p_options JSONB
) RETURNS VOID AS $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = p_slug LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE NOTICE 'Use case % not found, skipping', p_slug;
    RETURN;
  END IF;
  
  -- Delete existing question with same field_name
  DELETE FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name = p_field_name;
  
  -- Insert new question
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  ) VALUES (
    v_use_case_id, p_question_text, p_field_name, p_question_type,
    p_default_value, true, p_help_text, p_display_order, p_options
  );
  
  RAISE NOTICE 'Added % question to %', p_field_name, p_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. CAR WASH - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'car-wash',
  'facilitySubtype',
  'What type of car wash?',
  'select',
  'tunnel',
  'Different wash types have very different energy profiles',
  0.1,
  '[
    {"label": "Express Tunnel (30-60 cars/hr)", "value": "tunnel"},
    {"label": "Full-Service Tunnel (50-100 cars/hr)", "value": "fullservice"},
    {"label": "In-Bay Automatic (6-10 cars/hr)", "value": "inbay"},
    {"label": "Self-Service Bays (2-4 per bay/hr)", "value": "selfservice"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'car-wash',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium equipment uses more power but delivers better results',
  0.2,
  '[
    {"label": "Standard - Industry-standard pumps and blowers", "value": "standard"},
    {"label": "Premium - High-performance equipment (+30% power)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 2. HOTEL - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'hotel',
  'facilitySubtype',
  'Hotel class',
  'select',
  'midscale',
  'Different hotel classes have different energy profiles per room',
  0.1,
  '[
    {"label": "Economy/Budget (minimal amenities)", "value": "economy"},
    {"label": "Midscale (standard amenities, breakfast)", "value": "midscale"},
    {"label": "Upscale (restaurant, pool, fitness)", "value": "upscale"},
    {"label": "Luxury/Resort (spa, multiple restaurants)", "value": "luxury"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'hotel',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium equipment (high-efficiency HVAC, smart controls) affects power profile',
  0.2,
  '[
    {"label": "Standard - Conventional HVAC and lighting", "value": "standard"},
    {"label": "Premium - High-efficiency systems (+30% capacity)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 3. EV CHARGING - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'ev-charging',
  'facilitySubtype',
  'Charging hub type',
  'select',
  'fast_hub',
  'Different hub types serve different customer needs',
  0.1,
  '[
    {"label": "Fast Charging Hub (highway corridor, DCFC dominant)", "value": "fast_hub"},
    {"label": "Destination Charging (retail/hospitality, L2 dominant)", "value": "destination"},
    {"label": "Fleet Depot (overnight charging, scheduled)", "value": "fleet_depot"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'ev-charging',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium chargers have higher power output and faster charging',
  0.2,
  '[
    {"label": "Standard - 50-150 kW DCFC mix", "value": "standard"},
    {"label": "Premium - 150-350 kW ultra-fast charging", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 4. HOSPITAL - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'hospital',
  'facilitySubtype',
  'Facility type',
  'select',
  'general',
  'Different hospital types have different power requirements',
  0.1,
  '[
    {"label": "Critical Care (ICU, trauma, 24/7 OR)", "value": "critical"},
    {"label": "General Hospital (standard care)", "value": "general"},
    {"label": "Outpatient/Clinic (limited hours)", "value": "outpatient"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'hospital',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium equipment includes redundant systems and advanced monitoring',
  0.2,
  '[
    {"label": "Standard - Code-compliant backup systems", "value": "standard"},
    {"label": "Premium - Redundant critical systems (+30% capacity)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 5. OFFICE - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'office',
  'facilitySubtype',
  'Building class',
  'select',
  'class_b',
  'Different building classes have different amenity levels',
  0.1,
  '[
    {"label": "Class A (premium, high-rise, full amenities)", "value": "class_a"},
    {"label": "Class B (standard, mid-rise)", "value": "class_b"},
    {"label": "Class C (basic, older building)", "value": "class_c"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'office',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes smart building systems and high-efficiency HVAC',
  0.2,
  '[
    {"label": "Standard - Conventional building systems", "value": "standard"},
    {"label": "Premium - Smart building with BMS (+30% capacity)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 6. DATA CENTER - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'data-center',
  'facilitySubtype',
  'Data center tier',
  'select',
  'tier_3',
  'Uptime Institute tier determines redundancy and power requirements',
  0.1,
  '[
    {"label": "Tier IV (fault tolerant, 99.995% uptime)", "value": "tier_4"},
    {"label": "Tier III (concurrent maintainable, 99.98%)", "value": "tier_3"},
    {"label": "Tier II (redundant capacity, 99.7%)", "value": "tier_2"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'data-center',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes advanced cooling and UPS systems',
  0.2,
  '[
    {"label": "Standard - N+1 redundancy", "value": "standard"},
    {"label": "Premium - 2N redundancy (+50% capacity)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 7. RETAIL - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'retail',
  'facilitySubtype',
  'Store type',
  'select',
  'standalone',
  'Different retail formats have different energy profiles',
  0.1,
  '[
    {"label": "Big Box (50,000+ sq ft)", "value": "big_box"},
    {"label": "Strip Mall Unit (2,000-10,000 sq ft)", "value": "strip_mall"},
    {"label": "Standalone Store (5,000-25,000 sq ft)", "value": "standalone"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'retail',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes enhanced lighting and refrigeration',
  0.2,
  '[
    {"label": "Standard - Basic HVAC and lighting", "value": "standard"},
    {"label": "Premium - High-efficiency systems (+30% capacity)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 8. MANUFACTURING - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'manufacturing',
  'facilitySubtype',
  'Manufacturing type',
  'select',
  'medium',
  'Different manufacturing types have vastly different power needs',
  0.1,
  '[
    {"label": "Heavy Industry (foundry, steel, glass)", "value": "heavy"},
    {"label": "Medium Industry (assembly, machining)", "value": "medium"},
    {"label": "Light Industry (packaging, electronics)", "value": "light"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'manufacturing',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium equipment includes automated lines and precision machinery',
  0.2,
  '[
    {"label": "Standard - Manual/semi-automated lines", "value": "standard"},
    {"label": "Premium - Fully automated production (+50% power)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 9. WAREHOUSE - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'warehouse',
  'facilitySubtype',
  'Warehouse type',
  'select',
  'standard',
  'Climate control significantly affects power requirements',
  0.1,
  '[
    {"label": "Standard Dry Storage", "value": "standard"},
    {"label": "Climate Controlled", "value": "climate_controlled"},
    {"label": "Refrigerated/Cold Storage", "value": "refrigerated"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'warehouse',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes automated storage and retrieval systems',
  0.2,
  '[
    {"label": "Standard - Manual forklifts, basic lighting", "value": "standard"},
    {"label": "Premium - AS/RS, conveyor systems (+40% power)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 10. SHOPPING CENTER - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'shopping-center',
  'facilitySubtype',
  'Center type',
  'select',
  'community',
  'Different center sizes have different anchor tenant mix',
  0.1,
  '[
    {"label": "Regional Mall (400,000+ sq ft)", "value": "regional"},
    {"label": "Community Center (100,000-400,000 sq ft)", "value": "community"},
    {"label": "Neighborhood Center (30,000-100,000 sq ft)", "value": "neighborhood"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'shopping-center',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes common area HVAC and advanced lighting',
  0.2,
  '[
    {"label": "Standard - Basic common area systems", "value": "standard"},
    {"label": "Premium - Enhanced tenant fit-out (+30% capacity)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 11. APARTMENT - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'apartment',
  'facilitySubtype',
  'Building type',
  'select',
  'mid_rise',
  'Building type affects common area and per-unit energy',
  0.1,
  '[
    {"label": "High-Rise (10+ floors)", "value": "high_rise"},
    {"label": "Mid-Rise (4-9 floors)", "value": "mid_rise"},
    {"label": "Low-Rise/Garden (1-3 floors)", "value": "low_rise"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'apartment',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes EV charging and smart home features',
  0.2,
  '[
    {"label": "Standard - Basic unit amenities", "value": "standard"},
    {"label": "Premium - Smart home, EV ready (+25% capacity)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 12. RESIDENTIAL - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'residential',
  'facilitySubtype',
  'Home type',
  'select',
  'single_family',
  'Different home types have different energy profiles',
  0.1,
  '[
    {"label": "Large Home (3,000+ sq ft)", "value": "large"},
    {"label": "Single Family (1,500-3,000 sq ft)", "value": "single_family"},
    {"label": "Small Home/Condo (<1,500 sq ft)", "value": "small"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'residential',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes whole-home battery backup and EV charging',
  0.2,
  '[
    {"label": "Standard - Essential loads backup", "value": "standard"},
    {"label": "Premium - Whole-home backup + EV (+40% capacity)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 13. GAS STATION - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'gas-station',
  'facilitySubtype',
  'Station type',
  'select',
  'convenience',
  'Different station types have different convenience store sizes',
  0.1,
  '[
    {"label": "Travel Center (truck stop, restaurant)", "value": "travel_center"},
    {"label": "Convenience Store (standard c-store)", "value": "convenience"},
    {"label": "Kiosk Only (fuel pumps only)", "value": "kiosk"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'gas-station',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes EV charging and food service',
  0.2,
  '[
    {"label": "Standard - Basic refrigeration and lighting", "value": "standard"},
    {"label": "Premium - EV charging + QSR (+50% power)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 14. AIRPORT - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'airport',
  'facilitySubtype',
  'Airport class',
  'select',
  'medium_hub',
  'FAA classification determines infrastructure requirements',
  0.1,
  '[
    {"label": "Large Hub (10M+ passengers/year)", "value": "large_hub"},
    {"label": "Medium Hub (2.5-10M passengers/year)", "value": "medium_hub"},
    {"label": "Small Hub (<2.5M passengers/year)", "value": "small_hub"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'airport',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes advanced baggage and climate systems',
  0.2,
  '[
    {"label": "Standard - Code-compliant systems", "value": "standard"},
    {"label": "Premium - Automated baggage, advanced HVAC (+30%)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 15. CASINO - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'casino',
  'facilitySubtype',
  'Casino type',
  'select',
  'regional',
  'Different casino types have different gaming floor sizes',
  0.1,
  '[
    {"label": "Destination Resort (100,000+ sq ft gaming)", "value": "destination"},
    {"label": "Regional Casino (30,000-100,000 sq ft gaming)", "value": "regional"},
    {"label": "Local/Tribal (10,000-30,000 sq ft gaming)", "value": "local"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'casino',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes 24/7 HVAC and extensive lighting',
  0.2,
  '[
    {"label": "Standard - Gaming floor focus", "value": "standard"},
    {"label": "Premium - Full resort amenities (+40% power)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 16. GOVERNMENT - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'government',
  'facilitySubtype',
  'Building type',
  'select',
  'office',
  'Different government facilities have different requirements',
  0.1,
  '[
    {"label": "Critical Facility (data, emergency ops)", "value": "critical"},
    {"label": "Administrative Office", "value": "office"},
    {"label": "Public Service (library, community center)", "value": "public_service"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'government',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes backup power and security systems',
  0.2,
  '[
    {"label": "Standard - Code-compliant systems", "value": "standard"},
    {"label": "Premium - Enhanced resilience (+30% capacity)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 17. COLLEGE - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'college',
  'facilitySubtype',
  'Campus type',
  'select',
  'university',
  'Different campus types have different building mixes',
  0.1,
  '[
    {"label": "Research University (labs, data centers)", "value": "research"},
    {"label": "University (standard campus)", "value": "university"},
    {"label": "Community College (classrooms focus)", "value": "community"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'college',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes research equipment and advanced HVAC',
  0.2,
  '[
    {"label": "Standard - Classroom buildings", "value": "standard"},
    {"label": "Premium - Research/lab buildings (+50% power)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 18. AGRICULTURAL - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'agricultural',
  'facilitySubtype',
  'Operation type',
  'select',
  'crop',
  'Different agricultural operations have different power needs',
  0.1,
  '[
    {"label": "Dairy/Livestock (refrigeration, processing)", "value": "dairy"},
    {"label": "Row Crop (irrigation, drying)", "value": "crop"},
    {"label": "Greenhouse/Nursery (climate control)", "value": "greenhouse"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'agricultural',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes automated irrigation and processing',
  0.2,
  '[
    {"label": "Standard - Basic irrigation/storage", "value": "standard"},
    {"label": "Premium - Automated systems (+40% power)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 19. COLD STORAGE - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'cold-storage',
  'facilitySubtype',
  'Storage type',
  'select',
  'refrigerated',
  'Temperature requirements dramatically affect power consumption',
  0.1,
  '[
    {"label": "Deep Freeze (-20°F and below)", "value": "deep_freeze"},
    {"label": "Refrigerated (32-40°F)", "value": "refrigerated"},
    {"label": "Cool Storage (45-55°F)", "value": "cool"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'cold-storage',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes blast freezing and multi-temp zones',
  0.2,
  '[
    {"label": "Standard - Single temperature zone", "value": "standard"},
    {"label": "Premium - Multi-temp zones (+50% power)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 20. INDOOR FARM - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'indoor-farm',
  'facilitySubtype',
  'Farm type',
  'select',
  'vertical',
  'Different indoor farming methods have different light/HVAC needs',
  0.1,
  '[
    {"label": "Vertical Farm (multi-tier, LED)", "value": "vertical"},
    {"label": "Greenhouse (supplemental lighting)", "value": "greenhouse"},
    {"label": "Container Farm (shipping container)", "value": "container"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'indoor-farm',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes advanced LEDs and climate control',
  0.2,
  '[
    {"label": "Standard - Basic LED grow lights", "value": "standard"},
    {"label": "Premium - Full-spectrum LEDs + AI climate (+40%)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- 21. MICROGRID - Facility Subtype + Equipment Tier
-- ============================================================================
SELECT upsert_custom_question(
  'microgrid',
  'facilitySubtype',
  'Microgrid type',
  'select',
  'campus',
  'Different microgrid applications have different requirements',
  0.1,
  '[
    {"label": "Remote/Island (fully off-grid)", "value": "remote"},
    {"label": "Campus/Industrial Park", "value": "campus"},
    {"label": "Community Microgrid (residential)", "value": "community"}
  ]'::jsonb
);

SELECT upsert_custom_question(
  'microgrid',
  'equipmentTier',
  'Equipment tier',
  'select',
  'standard',
  'Premium includes advanced controls and multiple generation sources',
  0.2,
  '[
    {"label": "Standard - Single DER + storage", "value": "standard"},
    {"label": "Premium - Multi-DER with advanced controls (+30%)", "value": "premium"}
  ]'::jsonb
);

-- ============================================================================
-- CLEANUP: Remove helper function
-- ============================================================================
DROP FUNCTION IF EXISTS upsert_custom_question(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count 
  FROM custom_questions 
  WHERE field_name IN ('facilitySubtype', 'equipmentTier');
  
  RAISE NOTICE '✅ Universal Facility Configuration: Added % questions (expected 42)', v_count;
END $$;
