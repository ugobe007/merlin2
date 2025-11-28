-- Clean up duplicate hotel configurations
-- Keep only one default config per use case

BEGIN;

-- For 'hotel' slug: Keep "Standard Hotel (150 rooms)" and remove "Standard Hotel Configuration"
DO $$
DECLARE
  v_use_case_id UUID;
  v_keep_config_id UUID;
BEGIN
  -- Get the hotel use case ID
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'hotel';
  
  IF v_use_case_id IS NOT NULL THEN
    -- Get the ID of the config we want to keep (the one with preferred_duration_hours)
    SELECT id INTO v_keep_config_id 
    FROM use_case_configurations 
    WHERE use_case_id = v_use_case_id 
      AND config_name = 'Standard Hotel (150 rooms)'
      AND is_default = true
    LIMIT 1;
    
    -- Set all other default configs for this use case to non-default
    UPDATE use_case_configurations 
    SET is_default = false
    WHERE use_case_id = v_use_case_id 
      AND is_default = true
      AND id != v_keep_config_id;
      
    RAISE NOTICE 'Cleaned up hotel configs, keeping config ID: %', v_keep_config_id;
  END IF;
END $$;

COMMIT;

-- Verify - should only show one default config per use case
SELECT 
  uc.slug,
  uc.name,
  COUNT(*) as default_config_count
FROM use_cases uc
LEFT JOIN use_case_configurations ucc ON uc.id = ucc.use_case_id AND ucc.is_default = true
WHERE uc.is_active = true
GROUP BY uc.slug, uc.name
HAVING COUNT(ucc.id) > 1
ORDER BY uc.slug;
