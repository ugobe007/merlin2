-- ============================================================================
-- Update Office Building Questions - v2 with Solar/EV Intent
-- ============================================================================
-- Date: November 25, 2025
-- Purpose: Ask about WANTING solar/EV AND existing installations

-- Delete existing solar/EV questions
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
AND field_name IN ('hasSolar', 'solarSizeKw', 'hasGenerator', 'generatorSizeKw');

-- Insert updated Solar & EV questions
INSERT INTO custom_questions (
  use_case_id,
  question_text,
  field_name,
  question_type,
  default_value,
  options,
  is_required,
  min_value,
  max_value,
  display_order,
  help_text
) VALUES 

-- Solar Installation Status & Intent
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Solar Power: Do you want solar or already have it?',
  'solarStatus',
  'select',
  'want_solar',
  '[
    {"value": "no_solar", "label": "No solar - Battery only"},
    {"value": "want_solar", "label": "Want to add solar (recommended for maximum savings)"},
    {"value": "have_solar", "label": "Already have solar installed"}
  ]'::jsonb,
  true,
  NULL,
  NULL,
  9,
  'Solar paired with batteries can reduce payback by 30-40%'
),

-- Solar Size (for existing systems)
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'If you have solar: System size in kW',
  'existingSolarKw',
  'number',
  '0',
  NULL,
  false,
  0,
  5000,
  10,
  'Only fill if you selected "Already have solar" above'
),

-- EV Charger Status & Intent
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'EV Chargers: Do you want them or already have them?',
  'evChargerStatus',
  'select',
  'want_ev',
  '[
    {"value": "no_ev", "label": "No EV chargers needed"},
    {"value": "want_ev", "label": "Want to add EV chargers (future-proof your building)"},
    {"value": "have_ev", "label": "Already have EV chargers"}
  ]'::jsonb,
  true,
  NULL,
  NULL,
  11,
  'EV chargers increase building value and reduce employee charging costs'
),

-- EV Charger Count (for existing)
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'If you have EV chargers: How many Level 2 ports?',
  'existingEvPorts',
  'number',
  '0',
  NULL,
  false,
  0,
  200,
  12,
  'Only fill if you selected "Already have EV chargers" above'
),

-- Backup Generators (keep existing approach)
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Do you have backup diesel/gas generators?',
  'hasGenerator',
  'boolean',
  'false',
  NULL,
  false,
  NULL,
  NULL,
  13,
  'Batteries can work alongside generators for better efficiency'
),

(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Generator capacity (kW) - if applicable',
  'generatorSizeKw',
  'number',
  '0',
  NULL,
  false,
  0,
  5000,
  14,
  'Enter generator capacity in kW'
);

-- Update display_order for remaining questions to accommodate new questions
UPDATE custom_questions
SET display_order = display_order + 6
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
AND display_order >= 9
AND field_name NOT IN ('solarStatus', 'existingSolarKw', 'evChargerStatus', 'existingEvPorts', 'hasGenerator', 'generatorSizeKw');

-- Verify new questions
SELECT 
  field_name,
  question_text,
  question_type,
  display_order
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
AND field_name IN ('solarStatus', 'existingSolarKw', 'evChargerStatus', 'existingEvPorts')
ORDER BY display_order;
