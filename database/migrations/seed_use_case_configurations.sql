-- Seed default configurations for all use cases
-- This ensures every use case has proper MW/hour defaults for Step 2

BEGIN;

-- Office Building
-- Get use_case_id from use_cases table
DO $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'office';
  
  IF v_use_case_id IS NOT NULL THEN
    -- Delete existing default config for this use case
    DELETE FROM use_case_configurations 
    WHERE use_case_id = v_use_case_id AND is_default = true;
    
    -- Insert new config
    INSERT INTO use_case_configurations (
      use_case_id,
      config_name,
      is_default,
      typical_load_kw,
      peak_load_kw,
      profile_type,
      daily_operating_hours,
      preferred_duration_hours
    ) VALUES (
      v_use_case_id,
      'Standard Office',
      true,
      150,  -- 150 kW typical load → 0.15 MW
      250,
      'peaked',
      10,
      3
    );
  END IF;
END $$;

-- Data Center
DO $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'data-center';
  
  IF v_use_case_id IS NOT NULL THEN
    DELETE FROM use_case_configurations 
    WHERE use_case_id = v_use_case_id AND is_default = true;
    
    INSERT INTO use_case_configurations (
      use_case_id,
      config_name,
      is_default,
      typical_load_kw,
      peak_load_kw,
      profile_type,
      daily_operating_hours,
      preferred_duration_hours
    ) VALUES (
      v_use_case_id,
      'Enterprise Data Center',
      true,
      10000,  -- 10,000 kW → 10 MW
      12000,
      'constant',
      24,
      6
    );
  END IF;
END $$;

-- Hotel & Hospitality (hotel-hospitality slug)
DO $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'hotel-hospitality';
  
  IF v_use_case_id IS NOT NULL THEN
    DELETE FROM use_case_configurations 
    WHERE use_case_id = v_use_case_id AND is_default = true;
    
    INSERT INTO use_case_configurations (
      use_case_id,
      config_name,
      is_default,
      typical_load_kw,
      peak_load_kw,
      profile_type,
      daily_operating_hours,
      preferred_duration_hours
    ) VALUES (
      v_use_case_id,
      'Medium Hotel',
      true,
      1200,  -- 1,200 kW → 1.2 MW (2.93 kW/room)
      1800,
      'seasonal',
      24,
      4
    );
  END IF;
END $$;

-- Hotel (hotel slug - alternate spelling)
DO $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'hotel';
  
  IF v_use_case_id IS NOT NULL THEN
    -- Update existing default config to match our standards
    UPDATE use_case_configurations 
    SET preferred_duration_hours = 4
    WHERE use_case_id = v_use_case_id 
      AND is_default = true 
      AND preferred_duration_hours IS NULL;
  END IF;
END $$;

-- Manufacturing
DO $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'manufacturing';
  
  IF v_use_case_id IS NOT NULL THEN
    DELETE FROM use_case_configurations 
    WHERE use_case_id = v_use_case_id AND is_default = true;
    
    INSERT INTO use_case_configurations (
      use_case_id,
      config_name,
      is_default,
      typical_load_kw,
      peak_load_kw,
      profile_type,
      daily_operating_hours,
      preferred_duration_hours
    ) VALUES (
      v_use_case_id,
      'Standard Manufacturing',
      true,
      3000,  -- 3,000 kW → 3 MW
      5000,
      'peaked',
      16,
      4
    );
  END IF;
END $$;

-- EV Charging
DO $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'ev-charging';
  
  IF v_use_case_id IS NOT NULL THEN
    DELETE FROM use_case_configurations 
    WHERE use_case_id = v_use_case_id AND is_default = true;
    
    INSERT INTO use_case_configurations (
      use_case_id,
      config_name,
      is_default,
      typical_load_kw,
      peak_load_kw,
      profile_type,
      daily_operating_hours,
      preferred_duration_hours
    ) VALUES (
      v_use_case_id,
      'EV Charging Hub',
      true,
      1000,  -- 1,000 kW → 1 MW
      1500,
      'variable',
      16,
      2
    );
  END IF;
END $$;

-- Residential
DO $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'residential';
  
  IF v_use_case_id IS NOT NULL THEN
    DELETE FROM use_case_configurations 
    WHERE use_case_id = v_use_case_id AND is_default = true;
    
    INSERT INTO use_case_configurations (
      use_case_id,
      config_name,
      is_default,
      typical_load_kw,
      peak_load_kw,
      profile_type,
      daily_operating_hours,
      preferred_duration_hours
    ) VALUES (
      v_use_case_id,
      'Residential Complex',
      true,
      500,  -- 500 kW → 0.5 MW
      800,
      'peaked',
      14,
      3
    );
  END IF;
END $$;

-- Retail
DO $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'retail';
  
  IF v_use_case_id IS NOT NULL THEN
    DELETE FROM use_case_configurations 
    WHERE use_case_id = v_use_case_id AND is_default = true;
    
    INSERT INTO use_case_configurations (
      use_case_id,
      config_name,
      is_default,
      typical_load_kw,
      peak_load_kw,
      profile_type,
      daily_operating_hours,
      preferred_duration_hours
    ) VALUES (
      v_use_case_id,
      'Retail Store',
      true,
      500,  -- 500 kW → 0.5 MW
      750,
      'peaked',
      12,
      3
    );
  END IF;
END $$;

-- Microgrid
DO $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'microgrid';
  
  IF v_use_case_id IS NOT NULL THEN
    DELETE FROM use_case_configurations 
    WHERE use_case_id = v_use_case_id AND is_default = true;
    
    INSERT INTO use_case_configurations (
      use_case_id,
      config_name,
      is_default,
      typical_load_kw,
      peak_load_kw,
      profile_type,
      daily_operating_hours,
      preferred_duration_hours
    ) VALUES (
      v_use_case_id,
      'Community Microgrid',
      true,
      2000,  -- 2,000 kW → 2 MW
      3000,
      'variable',
      24,
      6
    );
  END IF;
END $$;

-- Shopping Center
DO $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'shopping-center';
  
  IF v_use_case_id IS NOT NULL THEN
    DELETE FROM use_case_configurations 
    WHERE use_case_id = v_use_case_id AND is_default = true;
    
    INSERT INTO use_case_configurations (
      use_case_id,
      config_name,
      is_default,
      typical_load_kw,
      peak_load_kw,
      profile_type,
      daily_operating_hours,
      preferred_duration_hours
    ) VALUES (
      v_use_case_id,
      'Shopping Center',
      true,
      2500,  -- 2,500 kW → 2.5 MW (typical regional mall)
      4000,
      'peaked',
      14,
      4
    );
  END IF;
END $$;

COMMIT;

-- Verify all use cases have configurations
SELECT 
  uc.slug,
  uc.name,
  ucc.config_name,
  ucc.typical_load_kw,
  ucc.preferred_duration_hours,
  (ucc.typical_load_kw / 1000.0) as storage_mw,
  ucc.is_default
FROM use_cases uc
LEFT JOIN use_case_configurations ucc ON uc.id = ucc.use_case_id AND ucc.is_default = true
WHERE uc.is_active = true
ORDER BY uc.slug;
