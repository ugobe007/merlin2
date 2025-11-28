-- ========================================
-- AUDIT ALL USE CASES
-- ========================================
-- Query all use case templates with their configurations
-- to compare against SmartWizardV2.tsx calculations
-- ========================================

-- 1. Get all use cases with their base configurations
SELECT 
    slug,
    name,
    category,
    required_tier,
    is_active,
    display_order,
    usage_count,
    average_roi,
    average_payback_years,
    created_at
FROM use_cases
ORDER BY name;

-- 2. Get all custom questions for each use case
SELECT 
    uc.slug as use_case_slug,
    uc.name as use_case_name,
    cq.field_name,
    cq.question_text,
    cq.question_type,
    cq.default_value,
    cq.min_value,
    cq.max_value,
    cq.help_text,
    cq.display_order
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
ORDER BY uc.name, cq.display_order;

-- 3. Get use case configurations (power and load data)
SELECT 
    uc.slug,
    uc.name,
    ucc.config_name,
    ucc.is_default,
    ucc.typical_load_kw,
    ucc.peak_load_kw,
    ucc.base_load_kw,
    ucc.profile_type,
    ucc.daily_operating_hours,
    ucc.recommended_duration_hours,
    ucc.preferred_duration_hours,
    ucc.typical_savings_percent,
    ucc.demand_charge_sensitivity
FROM use_cases uc
LEFT JOIN use_case_configurations ucc ON uc.id = ucc.use_case_id
ORDER BY uc.name, ucc.is_default DESC;
