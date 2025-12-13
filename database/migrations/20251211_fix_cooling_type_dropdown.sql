-- ============================================================================
-- FIX COOLING TYPE TO BE A DROPDOWN
-- December 11, 2025
-- 
-- The Cooling type question for data-center is currently 'text' but should be 
-- 'select' with proper options
-- ============================================================================

-- Update coolingType question to be a select with options
UPDATE custom_questions
SET 
  question_type = 'select',
  options = '[
    {"label": "Air-Cooled (CRAC/CRAH)", "value": "air"},
    {"label": "Water-Cooled (Chilled Water)", "value": "water"},
    {"label": "Liquid Cooling (Direct-to-Chip)", "value": "liquid"},
    {"label": "Immersion Cooling", "value": "immersion"},
    {"label": "Hybrid (Air + Liquid)", "value": "hybrid"}
  ]'::jsonb
WHERE field_name = 'coolingType';

-- Verify
SELECT 
  cq.field_name,
  cq.question_text,
  cq.question_type,
  cq.options,
  uc.slug
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE cq.field_name = 'coolingType';
