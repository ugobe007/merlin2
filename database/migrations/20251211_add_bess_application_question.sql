-- ============================================================================
-- ADD primaryBESSApplication QUESTION TO ALL USE CASES
-- December 11, 2025
-- 
-- This migration adds a new question that captures the application types
-- previously represented by orphaned use cases:
--   - peak-shaving-commercial → "Peak Shaving"
--   - energy-arbitrage-utility → "Energy Arbitrage" 
--   - backup-critical-infrastructure → "Backup Power"
-- 
-- Plus additional BESS applications: Demand Response, Renewable Integration,
-- Frequency Regulation, Load Shifting
-- ============================================================================

-- Insert primaryBESSApplication question for ALL active use cases
INSERT INTO custom_questions (
  use_case_id,
  question_text,
  question_type,
  field_name,
  options,
  is_required,
  default_value,
  display_order,
  help_text
)
SELECT 
  uc.id as use_case_id,
  'Primary BESS Application' as question_text,
  'select' as question_type,
  'primaryBESSApplication' as field_name,
  '[
    {"label": "Peak Shaving - Reduce demand charges during peak periods", "value": "peak_shaving"},
    {"label": "Energy Arbitrage - Buy low, sell/use high (time-of-use optimization)", "value": "energy_arbitrage"},
    {"label": "Backup Power - Critical load protection during outages", "value": "backup_power"},
    {"label": "Demand Response - Participate in utility DR programs for revenue", "value": "demand_response"},
    {"label": "Renewable Integration - Maximize solar/wind self-consumption", "value": "renewable_integration"},
    {"label": "Load Shifting - Move energy consumption to off-peak hours", "value": "load_shifting"},
    {"label": "Frequency Regulation - Grid services revenue (utility scale)", "value": "frequency_regulation"},
    {"label": "Multiple Applications - Stacked benefits (advanced)", "value": "stacked"}
  ]'::jsonb as options,
  false as is_required,
  'peak_shaving' as default_value,
  6 as display_order,  -- After gridSavingsGoal (order 5)
  'How will you primarily use your battery storage system? This determines optimal sizing and dispatch strategy. Peak shaving is most common for commercial facilities.' as help_text
FROM use_cases uc
WHERE uc.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM custom_questions cq 
    WHERE cq.use_case_id = uc.id 
    AND cq.field_name = 'primaryBESSApplication'
  );

-- Verify the insertion
SELECT 
  uc.slug,
  uc.name,
  cq.field_name,
  cq.display_order
FROM use_cases uc
JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE cq.field_name = 'primaryBESSApplication'
ORDER BY uc.slug;

-- Show count of use cases with the new question
SELECT COUNT(DISTINCT use_case_id) as use_cases_with_bess_application 
FROM custom_questions 
WHERE field_name = 'primaryBESSApplication';
