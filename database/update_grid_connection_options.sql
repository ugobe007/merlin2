-- =============================================================================
-- UPDATE GRID CONNECTION OPTIONS FOR REMOTE/UNRELIABLE GRID SCENARIOS
-- =============================================================================
-- Adding options for:
-- 1. Unreliable grid (frequent outages, voltage issues)
-- 2. No grid access (remote locations, indian reservations, mining sites)
-- 3. Grid-constrained areas (data centers overwhelming local utility capacity)
-- 4. Island/remote communities
-- =============================================================================

-- Update the gridConnection question with comprehensive options
UPDATE custom_questions 
SET 
    question_text = 'Grid Reliability & Access',
    help_text = 'What is your grid situation? Many projects in remote areas, reservations, mining sites, or grid-constrained regions are going off-grid or building microgrids.',
    options = '[{"value": "reliable", "label": "Reliable Grid - Stable power, rare outages (<5/year)"}, {"value": "mostly_reliable", "label": "Mostly Reliable - Occasional outages (5-20/year)"}, {"value": "unreliable", "label": "Unreliable Grid - Frequent outages, voltage fluctuations (20+/year)"}, {"value": "grid_constrained", "label": "Grid-Constrained - Utility cannot meet demand (common for data centers)"}, {"value": "limited_access", "label": "Limited Access - Partial/weak grid connection available"}, {"value": "no_grid", "label": "No Grid Access - Remote location, reservation, mining site, island"}, {"value": "grid_too_expensive", "label": "Grid Too Expensive - Connection fees prohibitive"}, {"value": "planning_disconnect", "label": "Planning to Disconnect - Want to leave grid for savings/independence"}]'::jsonb,
    default_value = 'reliable'
WHERE field_name = 'gridConnection';

-- Add a question about grid reliability issues (if not already exists)
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
    'Grid Reliability Issues (select all that apply)',
    'gridReliabilityIssues',
    'select',
    'none',
    '[{"value": "none", "label": "None - Grid is stable"}, {"value": "frequent_outages", "label": "Frequent Outages - Power goes out often"}, {"value": "voltage_fluctuations", "label": "Voltage Fluctuations - Damages equipment"}, {"value": "brownouts", "label": "Brownouts - Voltage drops during peak times"}, {"value": "rolling_blackouts", "label": "Rolling Blackouts - Scheduled outages"}, {"value": "storm_damage", "label": "Storm Damage - Weather-related outages"}, {"value": "aging_infrastructure", "label": "Aging Infrastructure - Old/unmaintained grid"}, {"value": "overloaded_grid", "label": "Overloaded Grid - Too much demand in area"}]'::jsonb,
    8,
    false,
    'What grid reliability issues do you experience? This helps us size backup capacity appropriately.'
FROM use_cases uc
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions cq 
    WHERE cq.use_case_id = uc.id AND cq.field_name = 'gridReliabilityIssues'
);

-- Add question about reason for off-grid/microgrid consideration
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
    'Why are you considering off-grid or microgrid?',
    'offGridReason',
    'select',
    'not_considering',
    '[{"value": "not_considering", "label": "Not Considering - Happy with grid connection"}, {"value": "no_grid_available", "label": "No Grid Available - Remote/isolated location"}, {"value": "grid_connection_too_expensive", "label": "Grid Connection Too Expensive - High infrastructure costs"}, {"value": "utility_capacity_limit", "label": "Utility Cannot Provide Enough Power - Demand exceeds supply"}, {"value": "grid_fees_too_high", "label": "Grid Fees Too High - Capacity/demand charges excessive"}, {"value": "energy_independence", "label": "Energy Independence - Want self-sufficiency"}, {"value": "sustainability_goals", "label": "Sustainability Goals - 100% renewable target"}, {"value": "data_center_expansion", "label": "Data Center Expansion - Grid cannot support growth"}, {"value": "mining_operations", "label": "Mining/Industrial Site - Remote operations"}, {"value": "tribal_sovereignty", "label": "Tribal Sovereignty - Energy independence for reservation"}, {"value": "island_community", "label": "Island/Remote Community - No mainland connection"}]'::jsonb,
    9,
    false,
    'Many data centers, mining sites, reservations, and remote facilities are building microgrids because the grid cannot meet their needs.'
FROM use_cases uc
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions cq 
    WHERE cq.use_case_id = uc.id AND cq.field_name = 'offGridReason'
);

-- Add question about annual outage hours for backup sizing
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
    'Estimated Annual Outage Hours',
    'annualOutageHours',
    'number',
    '0',
    0,
    8760,
    10,
    false,
    'How many hours per year do you experience grid outages? This helps size backup capacity. (8760 = entire year, typical unreliable grid = 100-500 hours)',
    'Enter estimated hours (0 for stable grid)'
FROM use_cases uc
WHERE NOT EXISTS (
    SELECT 1 FROM custom_questions cq 
    WHERE cq.use_case_id = uc.id AND cq.field_name = 'annualOutageHours'
);

-- Verify the updates
SELECT 
    uc.name as use_case_name,
    cq.field_name,
    cq.question_text,
    cq.question_type
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE cq.field_name IN ('gridConnection', 'gridReliabilityIssues', 'offGridReason', 'annualOutageHours')
ORDER BY uc.name, cq.display_order
LIMIT 50;
