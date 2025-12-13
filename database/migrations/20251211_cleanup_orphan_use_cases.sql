-- ============================================================================
-- ORPHAN USE CASES CLEANUP MIGRATION
-- December 11, 2025
-- 
-- This migration:
-- 1. Deletes ev-fast-charging (duplicate of ev-charging)
-- 2. Deactivates application-type use cases that will become questions:
--    - peak-shaving-commercial
--    - energy-arbitrage-utility  
--    - backup-critical-infrastructure
-- ============================================================================

-- Delete duplicate EV charging use case
DELETE FROM use_cases WHERE slug = 'ev-fast-charging';

-- Deactivate application-type use cases (these concepts are captured via gridSavingsGoal question)
UPDATE use_cases SET is_active = false WHERE slug = 'peak-shaving-commercial';
UPDATE use_cases SET is_active = false WHERE slug = 'energy-arbitrage-utility';
UPDATE use_cases SET is_active = false WHERE slug = 'backup-critical-infrastructure';

-- Verify the changes
SELECT slug, name, is_active 
FROM use_cases 
WHERE slug IN ('ev-fast-charging', 'peak-shaving-commercial', 'energy-arbitrage-utility', 'backup-critical-infrastructure');

-- Show remaining active use cases count
SELECT COUNT(*) as active_use_cases FROM use_cases WHERE is_active = true;
