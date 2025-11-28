-- =============================================================================
-- STEP 1: DELETE ALL EXISTING CUSTOM QUESTIONS
-- Run this FIRST before adding new questions
-- =============================================================================

DELETE FROM custom_questions;

-- Verify deletion
SELECT COUNT(*) as remaining_questions FROM custom_questions;
