-- =============================================================================
-- FIX ADVANCED QUESTIONS MARKING
-- December 16, 2025
-- 
-- Corrects the advanced question marking based on actual results
-- 
-- Issues Found:
-- - cold-storage, college, office: 15 standard (need 1 more)
-- - data-center: 21 standard (should be 18, mark 3 as advanced)
-- - hospital: 21 standard (should be 18, mark 4 as advanced)  
-- - manufacturing: 20 standard (should be 18, mark 3 as advanced)
-- - warehouse: 19 standard (should be 18, mark 1 as advanced)
-- - 18-question use cases: 0 advanced (should mark 2 as advanced)
-- =============================================================================

-- Step 1: Reset all advanced flags to ensure clean state
UPDATE custom_questions SET is_advanced = false WHERE is_advanced = true;

-- Step 2: Mark advanced questions for data-center (21 total → 18 standard, 3 advanced)
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
  AND display_order IN (
    SELECT display_order 
    FROM custom_questions 
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
      AND is_advanced = false
    ORDER BY display_order DESC
    LIMIT 3
  );

-- Step 3: Mark advanced questions for hospital (22 total → 18 standard, 4 advanced)
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital')
  AND display_order IN (
    SELECT display_order 
    FROM custom_questions 
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital')
      AND is_advanced = false
    ORDER BY display_order DESC
    LIMIT 4
  );

-- Step 4: Mark advanced questions for manufacturing (21 total → 18 standard, 3 advanced)
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing')
  AND display_order IN (
    SELECT display_order 
    FROM custom_questions 
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing')
      AND is_advanced = false
    ORDER BY display_order DESC
    LIMIT 3
  );

-- Step 5: Mark advanced questions for warehouse (19 total → 18 standard, 1 advanced)
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse')
  AND display_order IN (
    SELECT display_order 
    FROM custom_questions 
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse')
      AND is_advanced = false
    ORDER BY display_order DESC
    LIMIT 1
  );

-- Step 6: Mark advanced questions for 18-question use cases (18 total → 16 standard, 2 advanced)
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id IN (
    SELECT id FROM use_cases WHERE slug IN (
        'agricultural', 'casino', 'ev-charging', 'gas-station', 
        'government', 'indoor-farm', 'microgrid', 'residential', 
        'retail', 'shopping-center', 'car-wash'
    )
)
  AND display_order IN (
    SELECT display_order 
    FROM custom_questions cq2
    WHERE cq2.use_case_id = custom_questions.use_case_id
      AND cq2.is_advanced = false
    ORDER BY display_order DESC
    LIMIT 2
  );

-- Step 7: Add missing question for cold-storage, college, office to reach 16
-- COLD-STORAGE
DO $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'cold-storage' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_id, 'Do you need backup power for critical loads?', 'needsBackupPower', 'boolean', 'false', false, 'Backup power for refrigeration and climate control systems', 16, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'needsBackupPower');
    END IF;
END $$;

-- COLLEGE
DO $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'college' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_id, 'Do you need backup power for critical systems?', 'needsBackupPower', 'boolean', 'false', false, 'Backup power for labs, research facilities, and critical infrastructure', 16, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'needsBackupPower');
    END IF;
END $$;

-- OFFICE
DO $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'office' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_id, 'Do you need backup power for critical systems?', 'needsBackupPower', 'boolean', 'false', false, 'Backup power for servers, elevators, and essential systems', 16, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'needsBackupPower');
    END IF;
END $$;

-- Step 8: Verify results
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
