-- =============================================================================
-- REMOVE REDUNDANT SOLAR/EV "WANT" QUESTIONS
-- January 14, 2025
-- =============================================================================
-- 
-- These questions are redundant with Step 4 (Configuration) where users
-- explicitly choose to add solar/EV. We keep the "existing" questions
-- (hasExistingSolar, existingSolarKW, hasExistingEV, existingEVChargers)
-- for baseline calculations.
-- =============================================================================

-- Delete wantsSolar from all use cases
DELETE FROM custom_questions WHERE field_name = 'wantsSolar';

-- Delete wantsEVCharging from all use cases
DELETE FROM custom_questions WHERE field_name = 'wantsEVCharging';

-- Verify deletion
DO $$
DECLARE
    v_solar_count INT;
    v_ev_count INT;
BEGIN
    SELECT COUNT(*) INTO v_solar_count FROM custom_questions WHERE field_name = 'wantsSolar';
    SELECT COUNT(*) INTO v_ev_count FROM custom_questions WHERE field_name = 'wantsEVCharging';
    
    IF v_solar_count = 0 AND v_ev_count = 0 THEN
        RAISE NOTICE '✅ Successfully removed wantsSolar and wantsEVCharging questions';
    ELSE
        RAISE NOTICE '⚠️ Some questions remain: wantsSolar=%, wantsEVCharging=%', v_solar_count, v_ev_count;
    END IF;
END $$;

-- Show updated question counts
DO $$
DECLARE
    v_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== UPDATED QUESTION COUNTS (after removing redundant questions) ===';
    FOR v_rec IN 
        SELECT uc.slug, uc.name, COUNT(cq.id) as q_count
        FROM use_cases uc
        LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
        WHERE uc.is_active = true
        GROUP BY uc.slug, uc.name
        ORDER BY uc.name
    LOOP
        RAISE NOTICE '% - % questions', v_rec.name, v_rec.q_count;
    END LOOP;
END $$;
