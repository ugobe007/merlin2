-- ============================================================================
-- FIX VENDORS TABLE: valid_specialty CONSTRAINT
-- Created: June 26, 2026
-- ============================================================================
-- Problem:
--   The live valid_specialty constraint was deployed with only:
--     ('battery', 'inverter', 'ems', 'bos')
--   But the table already contains rows with:
--     'solar', 'generator', 'ev_charger', 'integrator'
--   — inserted via Merlin internal seeds and today's BESS vendor migration.
--
-- Fix:
--   Drop the stale constraint and replace it with the full set of all
--   specialty values actually in use, matching 02_DEPLOY_SCHEMA.sql intent.
-- ============================================================================

-- Step 1: Audit what's currently in the table (safe read — no changes)
-- SELECT specialty, COUNT(*) FROM vendors GROUP BY specialty ORDER BY count DESC;

-- Step 2: Drop the stale constraint
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS valid_specialty;

-- Step 3: Re-add with the complete, production-accurate list
ALTER TABLE vendors
  ADD CONSTRAINT valid_specialty
  CHECK (specialty IN (
    'battery',
    'inverter',
    'ems',
    'bos',
    'epc',
    'integrator',
    'solar',
    'generator',
    'ev_charger'
  ));

-- ============================================================================
-- VERIFY
-- ============================================================================
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'vendors'::regclass AND contype = 'c';
-- ============================================================================
