-- =============================================================================
-- ADD FINAL MISSING QUESTIONS TO REACH 16 STANDARD QUESTIONS
-- December 16, 2025
-- 
-- Fills the last missing question for: cold-storage, college, office
-- =============================================================================

-- COLD-STORAGE (has 15, needs 1 more to reach 16)
DO $$
DECLARE
    v_coldstorage_id UUID;
BEGIN
    SELECT id INTO v_coldstorage_id FROM use_cases WHERE slug = 'cold-storage' LIMIT 1;
    
    IF v_coldstorage_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_coldstorage_id, 'Do you need backup power for critical loads?', 'needsBackupPower', 'boolean', 'false', false, 'Backup power for refrigeration and climate control systems', 16, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_coldstorage_id AND field_name = 'needsBackupPower');
        
        RAISE NOTICE '✅ Added needsBackupPower question for cold-storage';
    END IF;
END $$;

-- COLLEGE (has 15, needs 1 more to reach 16)
DO $$
DECLARE
    v_college_id UUID;
BEGIN
    SELECT id INTO v_college_id FROM use_cases WHERE slug = 'college' LIMIT 1;
    
    IF v_college_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_college_id, 'Do you need backup power for critical systems?', 'needsBackupPower', 'boolean', 'false', false, 'Backup power for labs, research facilities, and critical infrastructure', 16, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_college_id AND field_name = 'needsBackupPower');
        
        RAISE NOTICE '✅ Added needsBackupPower question for college';
    END IF;
END $$;

-- OFFICE (has 15, needs 1 more to reach 16)
DO $$
DECLARE
    v_office_id UUID;
BEGIN
    SELECT id INTO v_office_id FROM use_cases WHERE slug = 'office' LIMIT 1;
    
    IF v_office_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_office_id, 'Do you need backup power for critical systems?', 'needsBackupPower', 'boolean', 'false', false, 'Backup power for servers, elevators, and essential systems', 16, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_office_id AND field_name = 'needsBackupPower');
        
        RAISE NOTICE '✅ Added needsBackupPower question for office';
    END IF;
END $$;

-- Verify all use cases now have 16+ standard questions
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

