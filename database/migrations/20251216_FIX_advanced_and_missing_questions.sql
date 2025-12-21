-- =============================================================================
-- FIX ADVANCED QUESTIONS MARKING & ADD MISSING QUESTIONS
-- December 16, 2025
-- 
-- Based on actual verification results, this fixes:
-- 1. Missing questions (cold-storage, college, office need 1 more)
-- 2. Advanced question marking (data-center, hospital, manufacturing, warehouse, 18-question use cases)
-- =============================================================================

-- =============================================================================
-- PART 1: ADD MISSING QUESTIONS TO REACH 16 STANDARD
-- =============================================================================

-- COLD-STORAGE: Add needsBackupPower to reach 16
DO $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'cold-storage' LIMIT 1;
    IF v_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'needsBackupPower'
    ) THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        VALUES (v_id, 'Do you need backup power for critical loads?', 'needsBackupPower', 'boolean', 'false', false, 'Backup power for refrigeration and climate control systems', 16, false);
        RAISE NOTICE '✅ Added needsBackupPower to cold-storage';
    END IF;
END $$;

-- COLLEGE: Add needsBackupPower to reach 16
DO $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'college' LIMIT 1;
    IF v_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'needsBackupPower'
    ) THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        VALUES (v_id, 'Do you need backup power for critical systems?', 'needsBackupPower', 'boolean', 'false', false, 'Backup power for labs, research facilities, and critical infrastructure', 16, false);
        RAISE NOTICE '✅ Added needsBackupPower to college';
    END IF;
END $$;

-- OFFICE: Add needsBackupPower to reach 16
DO $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'office' LIMIT 1;
    IF v_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'needsBackupPower'
    ) THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        VALUES (v_id, 'Do you need backup power for critical systems?', 'needsBackupPower', 'boolean', 'false', false, 'Backup power for servers, elevators, and essential systems', 16, false);
        RAISE NOTICE '✅ Added needsBackupPower to office';
    END IF;
END $$;

-- =============================================================================
-- PART 2: MARK ADVANCED QUESTIONS CORRECTLY
-- Strategy: Mark the LAST N questions (highest display_order) as advanced
-- =============================================================================

-- Reset all advanced flags first
UPDATE custom_questions SET is_advanced = false;

-- DATA-CENTER: 21 total → Mark last 3 as advanced (keep first 18 as standard)
UPDATE custom_questions cq
SET is_advanced = true
FROM (
    SELECT id, display_order,
           ROW_NUMBER() OVER (ORDER BY display_order DESC) as rn
    FROM custom_questions
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
) ranked
WHERE cq.id = ranked.id
  AND ranked.rn <= 3;

-- HOSPITAL: 22 total → Mark last 4 as advanced (keep first 18 as standard)
UPDATE custom_questions cq
SET is_advanced = true
FROM (
    SELECT id, display_order,
           ROW_NUMBER() OVER (ORDER BY display_order DESC) as rn
    FROM custom_questions
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital')
) ranked
WHERE cq.id = ranked.id
  AND ranked.rn <= 4;

-- MANUFACTURING: 21 total → Mark last 3 as advanced (keep first 18 as standard)
UPDATE custom_questions cq
SET is_advanced = true
FROM (
    SELECT id, display_order,
           ROW_NUMBER() OVER (ORDER BY display_order DESC) as rn
    FROM custom_questions
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing')
) ranked
WHERE cq.id = ranked.id
  AND ranked.rn <= 3;

-- WAREHOUSE: 19 total → Mark last 1 as advanced (keep first 18 as standard)
UPDATE custom_questions cq
SET is_advanced = true
FROM (
    SELECT id, display_order,
           ROW_NUMBER() OVER (ORDER BY display_order DESC) as rn
    FROM custom_questions
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse')
) ranked
WHERE cq.id = ranked.id
  AND ranked.rn <= 1;

-- 18-QUESTION USE CASES: Mark last 2 as advanced (keep first 16 as standard)
UPDATE custom_questions cq
SET is_advanced = true
FROM (
    SELECT id, use_case_id, display_order,
           ROW_NUMBER() OVER (PARTITION BY use_case_id ORDER BY display_order DESC) as rn
    FROM custom_questions
    WHERE use_case_id IN (
        SELECT id FROM use_cases WHERE slug IN (
            'agricultural', 'casino', 'ev-charging', 'gas-station', 
            'government', 'indoor-farm', 'microgrid', 'residential', 
            'retail', 'shopping-center', 'car-wash'
        )
    )
) ranked
WHERE cq.id = ranked.id
  AND ranked.rn <= 2;

-- =============================================================================
-- VERIFICATION: Show final results
-- =============================================================================

SELECT 
    uc.slug,
    uc.name,
    COUNT(CASE WHEN cq.is_advanced = false THEN 1 END) as standard_questions,
    COUNT(CASE WHEN cq.is_advanced = true THEN 1 END) as advanced_questions,
    COUNT(cq.id) as total_questions,
    CASE 
        WHEN COUNT(CASE WHEN cq.is_advanced = false THEN 1 END) < 16 THEN '⚠️ MISSING'
        WHEN COUNT(CASE WHEN cq.is_advanced = false THEN 1 END) > 18 THEN '⚠️ TOO MANY'
        ELSE '✅ OK'
    END as status
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
ORDER BY uc.slug;

