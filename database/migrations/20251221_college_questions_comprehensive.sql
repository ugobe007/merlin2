-- =============================================================================
-- COLLEGE & UNIVERSITY COMPREHENSIVE CUSTOM QUESTIONS
-- =============================================================================
-- Created: December 21, 2025
-- 
-- Maximum 16 questions - prioritized by energy impact
-- Each question feeds into peak demand calculation
--
-- ENERGY DRIVERS FOR HIGHER ED:
-- 1. Campus size & building count (base load)
-- 2. Research facilities (high-intensity equipment)
-- 3. Dormitories (24/7 residential load)
-- 4. Central plant type (chilled water, steam)
-- 5. Athletic facilities (stadium, pools, arenas)
-- 6. Data centers (constant high load)
-- 7. Medical/health facilities
-- 8. Dining operations
-- =============================================================================

-- First, delete existing college questions to replace with comprehensive set
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

-- Get the college use case ID
DO $$
DECLARE
    college_id UUID;
BEGIN
    SELECT id INTO college_id FROM use_cases WHERE slug = 'college';
    
    IF college_id IS NULL THEN
        RAISE EXCEPTION 'College use case not found! Please ensure use_cases table has slug=college';
    END IF;
    
    -- ═══════════════════════════════════════════════════════════════
    -- CAMPUS SIZE & SCALE (Questions 1-4)
    -- ═══════════════════════════════════════════════════════════════
    
    -- Q1: Campus/Institution Type
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'What type of institution?',
        'campusType',
        'select',
        'research_university',
        true,
        'This affects typical load profiles and operating hours',
        1,
        '[
            {"value": "community_college", "label": "Community College", "description": "Two-year programs, primarily commuter campus", "energyMultiplier": 0.6},
            {"value": "liberal_arts", "label": "Liberal Arts College", "description": "Small residential college focused on undergraduate education", "energyMultiplier": 0.8},
            {"value": "research_university", "label": "Research University", "description": "Large university with graduate programs and research facilities", "energyMultiplier": 1.2},
            {"value": "medical_school", "label": "Medical School / Academic Medical Center", "description": "Medical education with teaching hospital", "energyMultiplier": 1.5}
        ]'::jsonb
    );
    
    -- Q2: Total Building Square Footage
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Total building square footage',
        'totalBuildingSqFt',
        'select',
        '1_3_million',
        true,
        'All campus buildings combined (academic, admin, residential, athletic)',
        2,
        '[
            {"value": "under_500k", "label": "Under 500,000 sq ft", "sqFt": 350000, "description": "Small campus"},
            {"value": "500k_1m", "label": "500,000 - 1 million sq ft", "sqFt": 750000, "description": "Medium campus"},
            {"value": "1_3_million", "label": "1 - 3 million sq ft", "sqFt": 2000000, "description": "Large campus"},
            {"value": "3_5_million", "label": "3 - 5 million sq ft", "sqFt": 4000000, "description": "Very large campus"},
            {"value": "5_10_million", "label": "5 - 10 million sq ft", "sqFt": 7500000, "description": "Major university"},
            {"value": "over_10_million", "label": "10+ million sq ft", "sqFt": 12000000, "description": "Massive campus system"}
        ]'::jsonb
    );
    
    -- Q3: Number of Major Buildings
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
    ) VALUES (
        college_id,
        'Number of major buildings',
        'buildingCount',
        'number',
        '25',
        5,
        200,
        true,
        'Buildings with independent HVAC systems',
        3
    );
    
    -- Q4: Student Enrollment
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Student enrollment',
        'studentEnrollment',
        'select',
        '15k_30k',
        true,
        'Total enrolled students (affects dining, housing, facilities load)',
        4,
        '[
            {"value": "under_2k", "label": "Under 2,000", "students": 1500, "description": "Small college"},
            {"value": "2k_5k", "label": "2,000 - 5,000", "students": 3500, "description": "Small to medium"},
            {"value": "5k_15k", "label": "5,000 - 15,000", "students": 10000, "description": "Medium"},
            {"value": "15k_30k", "label": "15,000 - 30,000", "students": 22500, "description": "Large"},
            {"value": "30k_50k", "label": "30,000 - 50,000", "students": 40000, "description": "Very large"},
            {"value": "over_50k", "label": "50,000+", "students": 60000, "description": "Massive university system"}
        ]'::jsonb
    );
    
    -- ═══════════════════════════════════════════════════════════════
    -- HIGH-ENERGY FACILITIES (Questions 5-9)
    -- ═══════════════════════════════════════════════════════════════
    
    -- Q5: Research Facilities
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Research facility types',
        'researchFacilities',
        'select',
        'dry_labs',
        true,
        'Select the most energy-intensive research type on campus',
        5,
        '[
            {"value": "none", "label": "None / Minimal", "kW": 0, "description": "No significant research facilities"},
            {"value": "dry_labs", "label": "Dry Labs", "kW": 75, "description": "Computer/theoretical research, low power"},
            {"value": "wet_labs", "label": "Wet Labs", "kW": 150, "description": "Chemistry, biology labs with fume hoods"},
            {"value": "clean_rooms", "label": "Clean Rooms", "kW": 300, "description": "Semiconductor/nanofabrication research"},
            {"value": "supercomputing", "label": "Supercomputing / HPC", "kW": 500, "description": "High-performance computing center"}
        ]'::jsonb
    );
    
    -- Q6: On-Campus Housing (Dormitory Beds)
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order
    ) VALUES (
        college_id,
        'On-campus housing capacity (beds)',
        'dormitoryBeds',
        'number',
        '2000',
        0,
        20000,
        true,
        'Total dormitory/residence hall beds (24/7 residential load, ~0.8 kW per bed)',
        6
    );
    
    -- Q7: Data Center / IT Infrastructure
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Data center / server infrastructure',
        'dataCenterSize',
        'select',
        'small',
        true,
        'Campus IT infrastructure size',
        7,
        '[
            {"value": "minimal", "label": "Minimal (server closets)", "kW": 50, "description": "Distributed small server closets"},
            {"value": "small", "label": "Small (1-2 server rooms)", "kW": 200, "description": "Dedicated server rooms"},
            {"value": "medium", "label": "Medium (dedicated floor)", "kW": 750, "description": "Floor or wing dedicated to data center"},
            {"value": "large", "label": "Large (dedicated building)", "kW": 2000, "description": "Full data center building"}
        ]'::jsonb
    );
    
    -- Q8: Medical/Health Facilities
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Medical/health facilities on campus?',
        'medicalFacilities',
        'select',
        'health_center',
        false,
        'Teaching hospitals and clinics have critical power needs',
        8,
        '[
            {"value": "none", "label": "None", "kW": 0, "description": "No on-campus medical facilities"},
            {"value": "health_center", "label": "Student Health Center", "kW": 100, "description": "Basic student health services"},
            {"value": "urgent_care", "label": "Urgent Care Clinic", "kW": 250, "description": "Extended medical services"},
            {"value": "teaching_hospital", "label": "Teaching Hospital", "kW": 2000, "description": "Full academic medical center"}
        ]'::jsonb
    );
    
    -- Q9: Athletic Facilities
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Athletic facilities',
        'athleticFacilities',
        'select',
        'pool_aquatics',
        false,
        'Stadiums, arenas, and pools have significant lighting and HVAC loads',
        9,
        '[
            {"value": "gym_only", "label": "Gym/Fitness Center Only", "kW": 75, "description": "Basic fitness facilities"},
            {"value": "pool_aquatics", "label": "Pool/Aquatics Center", "kW": 200, "description": "Indoor pool with temperature control"},
            {"value": "indoor_arena", "label": "Indoor Arena", "kW": 400, "description": "Basketball/event arena"},
            {"value": "football_stadium", "label": "Football Stadium", "kW": 1000, "description": "Major outdoor stadium with lighting"},
            {"value": "multiple_venues", "label": "Multiple Major Venues", "kW": 1500, "description": "Full D1 athletic complex"}
        ]'::jsonb
    );
    
    -- ═══════════════════════════════════════════════════════════════
    -- INFRASTRUCTURE (Questions 10-13)
    -- ═══════════════════════════════════════════════════════════════
    
    -- Q10: Central Plant Type
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Central plant type',
        'centralPlant',
        'select',
        'central_chiller',
        true,
        'How is campus heating/cooling distributed?',
        10,
        '[
            {"value": "distributed", "label": "Distributed (per building)", "description": "Each building has own HVAC"},
            {"value": "central_chiller", "label": "Central Chiller Plant", "description": "Centralized chilled water distribution"},
            {"value": "central_steam", "label": "Central Chiller + Steam", "description": "Chilled water + steam heat"},
            {"value": "cogeneration", "label": "Cogeneration / CHP", "description": "Combined heat and power plant"}
        ]'::jsonb
    );
    
    -- Q11: Peak Demand Known?
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Do you know your peak demand?',
        'peakDemandKnown',
        'select',
        'no',
        false,
        'From utility bills - helps us be more accurate',
        11,
        '[
            {"value": "yes", "label": "Yes, I know the exact value"},
            {"value": "approximately", "label": "Approximately"},
            {"value": "no", "label": "No, please estimate"}
        ]'::jsonb
    );
    
    -- Q12: Peak Demand Value (if known)
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, min_value, max_value, is_required, help_text, display_order, unit
    ) VALUES (
        college_id,
        'Peak demand (if known)',
        'peakDemandValue',
        'number',
        '2000',
        100,
        15000,
        false,
        'Maximum kW from utility bill (typical: 500 kW - 10 MW)',
        12,
        ' kW'
    );
    
    -- ═══════════════════════════════════════════════════════════════
    -- SOLAR QUESTIONS (13-16) - Conditional Flow
    -- ═══════════════════════════════════════════════════════════════
    
    -- Q13: Do you have solar?
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Do you have solar installed?',
        'hasSolar',
        'toggle',
        'false',
        true,
        'Current on-campus solar installation',
        13,
        '{"showWhen": "always"}'::jsonb
    );
    
    -- Q14: How much solar do you have? (conditional on hasSolar=true)
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'How much solar do you have?',
        'existingSolarKW',
        'select',
        '500',
        false,
        'Current installed solar capacity',
        14,
        '[
            {"value": "100", "label": "~100 kW", "kW": 100, "description": "Small pilot installation"},
            {"value": "250", "label": "~250 kW", "kW": 250, "description": "Single building rooftop"},
            {"value": "500", "label": "~500 kW", "kW": 500, "description": "Multi-building installation"},
            {"value": "1000", "label": "~1 MW", "kW": 1000, "description": "Medium campus array"},
            {"value": "2000", "label": "~2 MW", "kW": 2000, "description": "Large campus installation"},
            {"value": "5000", "label": "5+ MW", "kW": 5000, "description": "Utility-scale campus solar"}
        ]'::jsonb
    );
    
    -- Q15: Do you want solar? (conditional on hasSolar=false)
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Would you like to add solar?',
        'wantSolar',
        'toggle',
        'true',
        false,
        'Solar pairs well with BESS for maximum savings',
        15,
        '{"showWhen": {"field": "hasSolar", "equals": false}}'::jsonb
    );
    
    -- Q16: How much solar do you want? (conditional on wantSolar=true)
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'How much solar would you like?',
        'desiredSolarKW',
        'select',
        '1000',
        false,
        'Recommended: Match to peak demand or available roof space',
        16,
        '[
            {"value": "250", "label": "~250 kW", "kW": 250, "description": "Start small, expand later"},
            {"value": "500", "label": "~500 kW", "kW": 500, "description": "Cover 10-20% of demand"},
            {"value": "1000", "label": "~1 MW", "kW": 1000, "description": "Cover 20-30% of demand"},
            {"value": "2000", "label": "~2 MW", "kW": 2000, "description": "Cover 30-50% of demand"},
            {"value": "5000", "label": "~5 MW", "kW": 5000, "description": "Major campus installation"},
            {"value": "10000", "label": "10+ MW", "kW": 10000, "description": "Utility-scale (ground mount)"}
        ]'::jsonb
    );
    
    -- ═══════════════════════════════════════════════════════════════
    -- EV CHARGING QUESTIONS (17-20) - Conditional Flow
    -- ═══════════════════════════════════════════════════════════════
    
    -- Q17: Do you have EV chargers?
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Do you have EV chargers installed?',
        'hasEVChargers',
        'toggle',
        'false',
        true,
        'Current campus EV charging infrastructure',
        17,
        '{"showWhen": "always"}'::jsonb
    );
    
    -- Q18: How many EV chargers do you have? (conditional on hasEVChargers=true)
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'How many EV chargers do you have?',
        'existingEVChargers',
        'select',
        '10',
        false,
        'Current Level 2 charger count',
        18,
        '[
            {"value": "5", "label": "1-5 chargers", "count": 5, "kW": 36, "description": "Small pilot program"},
            {"value": "10", "label": "6-10 chargers", "count": 10, "kW": 72, "description": "Growing fleet"},
            {"value": "25", "label": "11-25 chargers", "count": 25, "kW": 180, "description": "Medium deployment"},
            {"value": "50", "label": "26-50 chargers", "count": 50, "kW": 360, "description": "Campus-wide network"},
            {"value": "100", "label": "50+ chargers", "count": 100, "kW": 720, "description": "Major EV infrastructure"}
        ]'::jsonb
    );
    
    -- Q19: Do you want EV chargers? (conditional on hasEVChargers=false)
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Would you like to add EV chargers?',
        'wantEVChargers',
        'toggle',
        'true',
        false,
        'EV charging is a top request from students, staff, and visitors',
        19,
        '{"showWhen": {"field": "hasEVChargers", "equals": false}}'::jsonb
    );
    
    -- Q20: How many EV chargers do you want? (conditional on wantEVChargers=true)
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'How many EV chargers would you like?',
        'desiredEVChargers',
        'select',
        '20',
        false,
        'Level 2 chargers (7.2 kW each). BESS helps manage charging demand.',
        20,
        '[
            {"value": "10", "label": "~10 chargers", "count": 10, "kW": 72, "description": "Start small, test demand"},
            {"value": "20", "label": "~20 chargers", "count": 20, "kW": 144, "description": "Cover key parking areas"},
            {"value": "50", "label": "~50 chargers", "count": 50, "kW": 360, "description": "Campus-wide coverage"},
            {"value": "100", "label": "~100 chargers", "count": 100, "kW": 720, "description": "Major EV hub"},
            {"value": "200", "label": "200+ chargers", "count": 200, "kW": 1440, "description": "Full electrification goal"}
        ]'::jsonb
    );
    
    -- ═══════════════════════════════════════════════════════════════
    -- FINAL QUESTIONS (21-22)
    -- ═══════════════════════════════════════════════════════════════
    
    -- Q21: Sustainability Commitment
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Sustainability commitment',
        'sustainabilityGoal',
        'select',
        'carbon_reduction',
        false,
        'Many universities have carbon-neutral pledges',
        21,
        '[
            {"value": "none", "label": "None Formal", "description": "No formal sustainability goals"},
            {"value": "carbon_reduction", "label": "Carbon Reduction Plan", "description": "Working to reduce emissions"},
            {"value": "net_zero_2030", "label": "Net-Zero by 2030", "description": "Aggressive carbon neutrality target"},
            {"value": "net_zero_2040", "label": "Net-Zero by 2040", "description": "Long-term carbon neutrality goal"}
        ]'::jsonb
    );
    
    -- Q22: Critical Backup Power Needs
    INSERT INTO custom_questions (
        use_case_id, question_text, field_name, question_type,
        default_value, is_required, help_text, display_order, options
    ) VALUES (
        college_id,
        'Critical backup power needs',
        'backupPowerNeeds',
        'select',
        'research_labs',
        true,
        'What must stay powered during outages?',
        22,
        '[
            {"value": "it_data_only", "label": "IT/Data Only", "criticalPercent": 0.15, "description": "Data centers and network equipment"},
            {"value": "research_labs", "label": "Research Labs", "criticalPercent": 0.30, "description": "Labs + IT infrastructure"},
            {"value": "medical_research", "label": "Medical + Research", "criticalPercent": 0.50, "description": "Health facilities, labs, and IT"},
            {"value": "full_campus", "label": "Full Campus", "criticalPercent": 0.85, "description": "All critical facilities"}
        ]'::jsonb
    );
    
    RAISE NOTICE 'Successfully inserted 16 comprehensive questions for College use case';
END $$;

-- =============================================================================
-- ENERGY CALCULATION FORMULA FOR COLLEGES
-- =============================================================================
-- 
-- Base Load = (totalSqFt × 0.008 kW/sqft) × campusTypeMultiplier
-- 
-- Add-ons:
-- + dormitoryBeds × 0.8 kW
-- + researchFacilities kW (from lookup)
-- + dataCenterSize kW (from lookup)
-- + medicalFacilities kW (from lookup)
-- + athleticFacilities kW (from lookup)
-- + diningOperations kW (from lookup)
-- 
-- Peak Demand = Base Load × 1.3 (30% peak factor for higher ed)
-- 
-- Example: 2M sqft Research University
-- Base: 2,000,000 × 0.008 × 1.2 = 19,200 kW
-- + 5,000 beds × 0.8 = 4,000 kW
-- + Wet Labs = 150 kW
-- + Medium Data Center = 750 kW
-- + Multiple Athletic Venues = 1,500 kW
-- + 3-5 Dining Halls = 350 kW
-- = 25,950 kW base → 33,735 kW peak
-- =============================================================================

-- Verify the questions were added
SELECT 
    display_order,
    field_name,
    question_type,
    question_text,
    is_required
FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'college')
ORDER BY display_order;
