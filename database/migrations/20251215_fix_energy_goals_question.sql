-- ============================================================================
-- FIX ENERGY GOALS QUESTION - Remove redundant number inputs
-- December 15, 2025
-- 
-- The energy goals question should be a simple multiselect, not a compound
-- with number inputs. Monthly bill and peak demand are collected elsewhere.
-- ============================================================================

-- Update energyGoals to be a simple multiselect (no number inputs)
UPDATE custom_questions
SET 
    question_type = 'multiselect',
    options = '[{"label": "Reduce electricity costs", "value": "reduce_costs"},{"label": "Reduce demand charges", "value": "reduce_demand"},{"label": "Achieve net-zero / carbon neutral", "value": "net_zero"},{"label": "Meet brand sustainability requirements", "value": "brand_requirements"},{"label": "Earn green building certification", "value": "green_cert"},{"label": "Reduce reliance on grid", "value": "grid_independence"},{"label": "Participate in utility demand response", "value": "demand_response"},{"label": "Time-of-use optimization", "value": "tou_optimization"}]'::jsonb,
    default_value = '["reduce_costs", "reduce_demand"]'
WHERE field_name = 'energyGoals'
  AND use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality'));

-- Also fix backupRequirements to be a simpler select (single choice, not compound)
UPDATE custom_questions
SET 
    question_type = 'select',
    options = '[{"label": "Mission Critical - cannot lose power (24hr)", "value": "critical"},{"label": "Important - minimize downtime (8hr)", "value": "important"},{"label": "Nice to have - occasional outages OK (4hr)", "value": "nice_to_have"},{"label": "Have existing generator backup", "value": "has_generator"},{"label": "Not a priority", "value": "not_priority"}]'::jsonb,
    default_value = 'important'
WHERE field_name = 'backupRequirements'
  AND use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality'));

-- Verify the changes
SELECT field_name, question_type, jsonb_array_length(options) as option_count
FROM custom_questions
WHERE field_name IN ('energyGoals', 'backupRequirements')
  AND use_case_id IN (SELECT id FROM use_cases WHERE slug = 'hotel');
