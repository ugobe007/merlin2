-- =============================================================================
-- ADD ENHANCED GRID STRATEGY QUESTION FOR EUROPEAN OFF-GRID/LIMITED-GRID SCENARIOS
-- =============================================================================
-- This migration enhances the gridConnection question with better options for:
-- 1. European customers wanting to reduce grid dependency for cost savings
-- 2. Off-grid installations in remote locations
-- 3. Grid independence for resilience and sustainability
-- =============================================================================

-- First, update the existing gridConnection question to have better options
UPDATE custom_questions 
SET 
    question_text = 'Grid Connection Strategy',
    help_text = 'How do you want to connect to the electrical grid? Going off-grid or limiting grid access can save money by avoiding grid fees and charges.',
    options = '[
        {"value": "full_grid", "label": "Full Grid Access - Standard grid connection"},
        {"value": "grid_optimized", "label": "Grid-Optimized - Minimize grid charges"},
        {"value": "grid_limited", "label": "Limited Grid - Partial independence"},
        {"value": "grid_backup", "label": "Grid as Backup Only - Primarily self-sufficient"},
        {"value": "off_grid", "label": "Off-Grid - Complete independence"},
        {"value": "microgrid", "label": "Microgrid - Community/campus system"}
    ]'::jsonb,
    default_value = 'full_grid'
WHERE field_name = 'gridConnection';

-- Add a new grid savings motivation question if it doesn't exist
INSERT INTO custom_questions (
    use_case_id,
    question_text,
    field_name,
    question_type,
    default_value,
    options,
    display_order,
    is_required,
    help_text
)
SELECT 
    uc.id,
    'Primary Goal for Grid Strategy',
    'gridSavingsGoal',
    'select',
    'cost_reduction',
    '[
        {"value": "cost_reduction", "label": "Cost Reduction - Lower electricity bills"},
        {"value": "avoid_grid_fees", "label": "Avoid Grid Fees - Reduce connection charges (Popular in Europe)"},
        {"value": "energy_independence", "label": "Energy Independence - Self-sufficiency"},
        {"value": "resilience", "label": "Resilience - Backup power priority"},
        {"value": "carbon_reduction", "label": "Carbon Reduction - Environmental goals"},
        {"value": "grid_export", "label": "Grid Export Revenue - Sell power back"}
    ]'::jsonb,
    5,
    false,
    'What is your primary motivation for your grid strategy? This helps us optimize your BESS system for maximum savings.'
FROM use_cases uc
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions cq 
    WHERE cq.use_case_id = uc.id AND cq.field_name = 'gridSavingsGoal'
);

-- Add grid capacity limit question for limited grid scenarios
INSERT INTO custom_questions (
    use_case_id,
    question_text,
    field_name,
    question_type,
    default_value,
    min_value,
    max_value,
    display_order,
    is_required,
    help_text,
    placeholder
)
SELECT 
    uc.id,
    'Grid Import Limit (kW)',
    'gridImportLimit',
    'number',
    '0',
    0,
    50000,
    6,
    false,
    'Maximum power you want to import from the grid (kW). Set to 0 for no limit. In Europe, limiting grid import can significantly reduce capacity charges.',
    'Enter kW limit or 0 for unlimited'
FROM use_cases uc
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions cq 
    WHERE cq.use_case_id = uc.id AND cq.field_name = 'gridImportLimit'
);

-- Add annual grid fee question for savings calculations
INSERT INTO custom_questions (
    use_case_id,
    question_text,
    field_name,
    question_type,
    default_value,
    min_value,
    max_value,
    display_order,
    is_required,
    help_text,
    placeholder
)
SELECT 
    uc.id,
    'Annual Grid Connection Fees ($/year)',
    'annualGridFees',
    'number',
    '0',
    0,
    1000000,
    7,
    false,
    'Total annual fees for grid connection (capacity charges, demand charges, connection fees). Enter your current annual grid charges to calculate potential savings from going off-grid or grid-limited.',
    'Enter annual grid fees in $'
FROM use_cases uc
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions cq 
    WHERE cq.use_case_id = uc.id AND cq.field_name = 'annualGridFees'
);

-- Verify the changes
SELECT 
    uc.name as use_case_name,
    cq.field_name,
    cq.question_text,
    cq.question_type,
    cq.is_required
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE cq.field_name IN ('gridConnection', 'gridSavingsGoal', 'gridImportLimit', 'annualGridFees')
ORDER BY uc.name, cq.display_order;
