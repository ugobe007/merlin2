-- ============================================================================
-- CORE TABLES ALIGNMENT
-- April 12, 2026
--
-- PURPOSE
--   Live DB audit (run before this file was written) confirmed:
--     • All 8 application tables already exist.
--     • saved_quotes is missing 3 columns that the app writes.
--
--   This migration adds only those 3 missing columns.
-- ============================================================================

ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS use_case       text;
ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS use_case_slug  text;
ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS quote_data     jsonb;
