-- =============================================================================
-- REMOVE CONFUSING UNIVERSAL QUESTIONS
-- January 21, 2026
-- 
-- Removes "Equipment Tier" and "HVAC Type" questions from ALL industries.
-- These should be auto-calculated in the background, not asked to users.
-- 
-- Rationale:
-- - Users don't know their equipment efficiency tier
-- - HVAC type should be estimated from facility size/type
-- - These questions add friction before industry-specific questions
-- - Better UX: Calculate in background and apply multipliers automatically
-- =============================================================================

-- Delete Equipment Tier question from all use cases
DELETE FROM custom_questions 
WHERE field_name = 'equipmentTier';

-- Delete HVAC Type question from all use cases
DELETE FROM custom_questions 
WHERE field_name = 'hvacType';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Check that both questions are gone
SELECT 
  COUNT(*) as remaining_universal_questions
FROM custom_questions 
WHERE field_name IN ('equipmentTier', 'hvacType');

-- Should return 0

-- Show question counts by industry (should be reduced by 2 for most)
SELECT 
  uc.slug,
  uc.name,
  COUNT(cq.id) as question_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.slug, uc.name
ORDER BY uc.name;
