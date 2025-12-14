-- =============================================================================
-- FIX APARTMENT COMPLEX QUESTIONNAIRE
-- Dec 14, 2025 - User reported wrong questionnaire showing
-- =============================================================================

-- First, check what questions currently exist
SELECT 'Current apartment questions:' as info;
SELECT 
  cq.id,
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.display_order
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug = 'apartment'
ORDER BY cq.display_order;

-- Delete all apartment questions to start fresh
DELETE FROM custom_questions 
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'apartment');

-- Insert correct apartment questions
-- These match the calculateApartmentPower() function which needs: unitCount

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, options)
SELECT 
  id, 
  'Number of apartment units', 
  'unitCount', 
  'dropdown', 
  '100', 
  NULL, 
  NULL, 
  true, 
  'Total residential units in the building', 
  1,
  '[
    {"label": "10 - 25 units (Small building)", "value": "18"},
    {"label": "25 - 50 units (Medium building)", "value": "38"},
    {"label": "50 - 100 units (Large building)", "value": "75"},
    {"label": "100 - 200 units (Very large)", "value": "150"},
    {"label": "200 - 500 units (High-rise)", "value": "350"},
    {"label": "500+ units (Tower complex)", "value": "750"}
  ]'::jsonb
FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, options)
SELECT 
  id, 
  'Average unit size', 
  'avgUnitSqFt', 
  'dropdown', 
  '900', 
  NULL, 
  NULL, 
  false, 
  'Typical square footage per apartment', 
  2,
  '[
    {"label": "500 - 750 sq ft (Studio/1BR)", "value": "625"},
    {"label": "750 - 1,000 sq ft (1-2BR)", "value": "875"},
    {"label": "1,000 - 1,500 sq ft (2-3BR)", "value": "1250"},
    {"label": "1,500 - 2,500 sq ft (3BR+/Luxury)", "value": "2000"}
  ]'::jsonb
FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Building square footage', 'squareFeet', 'number', '150000', 10000, 2000000, false, 'Total building floor space (optional)', 3 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of floors/stories', 'floors', 'number', '10', 1, 100, false, 'Building height', 4 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, options)
SELECT 
  id, 
  'Common area amenities', 
  'amenities', 
  'multiselect', 
  '[]', 
  NULL, 
  NULL, 
  false, 
  'Select all that apply', 
  5,
  '[
    {"label": "🏊 Swimming Pool", "value": "pool"},
    {"label": "🏋️ Fitness Center", "value": "fitness"},
    {"label": "👔 Business Center", "value": "business"},
    {"label": "🧺 Laundry Facilities", "value": "laundry"},
    {"label": "🚗 Parking Garage", "value": "parking"},
    {"label": "🔌 EV Charging", "value": "evCharging"}
  ]'::jsonb
FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, options)
SELECT 
  id, 
  'HVAC system type', 
  'hvacType', 
  'dropdown', 
  'individual', 
  NULL, 
  NULL, 
  false, 
  'How is heating/cooling provided?', 
  6,
  '[
    {"label": "Individual unit HVAC (most common)", "value": "individual"},
    {"label": "Central HVAC with individual controls", "value": "central"},
    {"label": "District heating/cooling", "value": "district"}
  ]'::jsonb
FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly electric bill', 'monthlyElectricBill', 'number', '15000', 1000, 500000, false, 'Current common area electricity cost', 7 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid capacity (kW)', 'gridCapacityKW', 'number', '500', 50, 10000, false, 'Maximum grid connection size', 8 FROM use_cases WHERE slug = 'apartment';

-- Universal questions added by other migrations
-- These will be added automatically by 20251211_populate_missing_questions.sql

SELECT 'Fixed apartment questions:' as info;
SELECT 
  cq.question_text,
  cq.field_name,
  cq.question_type,
  cq.display_order
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.slug = 'apartment'
ORDER BY cq.display_order;
