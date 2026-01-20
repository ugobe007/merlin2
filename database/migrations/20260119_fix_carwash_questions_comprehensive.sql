-- ============================================================================
-- Migration: Fix Car Wash Questions - Comprehensive Updates
-- Date: January 19, 2026
-- Purpose: Address user feedback on car wash questionnaire
-- 
-- ISSUES ADDRESSED:
-- #3  - operatingModel: Document energy impact logic
-- #4  - tunnelLength: Fix input range (was too narrow)
-- #5  - squareFeet: Fix input range (not car wash appropriate)
-- #6  - dailyVehicles: Fix input range (max too low)
-- #9  - vacuumStations: Cap at 25 (industry max)
-- #18 - roofSqFt: Fix options for car wash scale
-- #21 - monthlyElectricBill: Fix ranges for car wash ($3K-$12K typical)
-- #22 - peakDemand: Add "Don't Know" option + auto-estimate capability
-- #23 - gridCapacity: Add "Don't Know" option + auto-estimate capability
-- #26/#27 - evL2Count/evDcfcCount: Fix min to 0, clarify "None" is valid
-- #32 - primaryBESSApplication: Change to multiselect for multiple goals
-- ============================================================================

-- ============================================================================
-- #3: OPERATING MODEL - Add energy impact documentation
-- Impact: Attended = higher HVAC for waiting areas, more lighting
--         Unattended = 24/7 security lighting, different peak patterns
-- ============================================================================
UPDATE custom_questions
SET 
    help_text = 'How is your car wash staffed? ENERGY IMPACT: Fully attended sites have higher HVAC loads for lobby/waiting areas. Unattended sites typically run 24/7 with higher security lighting. Hybrid models have variable peak patterns.',
    options = '[
        {"value": "attended_full", "label": "Fully Attended", "icon": "👷", "description": "Staff at all times - lobby, HVAC load", "energyImpact": "Higher HVAC for waiting areas (+10-15% base load)"},
        {"value": "attended_partial", "label": "Partially Attended", "icon": "👤", "description": "Staff during peak hours only", "energyImpact": "Variable load pattern"},
        {"value": "unattended", "label": "Unattended/Automated", "icon": "🤖", "description": "Fully automated, no lobby", "energyImpact": "24/7 security lighting, lower HVAC"},
        {"value": "hybrid", "label": "Hybrid Model", "icon": "🔄", "description": "Mix of attended/unattended", "energyImpact": "Moderate HVAC, variable peaks"}
    ]'::jsonb
WHERE field_name = 'operatingModel'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- #4: TUNNEL LENGTH - Fix range (mini tunnels 40ft, max express 220ft)
-- Research: Mini-tunnel 40-60ft, Standard 80-150ft, Express 150-220ft
-- ============================================================================
UPDATE custom_questions
SET 
    min_value = 40,
    max_value = 220,
    default_value = '120',
    help_text = 'Tunnel/conveyor length in feet. Mini-tunnels: 40-60ft. Standard: 80-150ft. Express: 150-220ft. Only applies to tunnel-type washes.',
    options = '[
        {"value": "40", "label": "40 ft (Mini)", "description": "Compact mini-tunnel"},
        {"value": "60", "label": "60 ft (Mini)", "description": "Standard mini-tunnel"},
        {"value": "80", "label": "80 ft (Short)", "description": "Short standard tunnel"},
        {"value": "100", "label": "100 ft", "description": "Standard tunnel"},
        {"value": "120", "label": "120 ft", "description": "Common express tunnel"},
        {"value": "150", "label": "150 ft", "description": "Long express tunnel"},
        {"value": "180", "label": "180 ft", "description": "Large express tunnel"},
        {"value": "200", "label": "200+ ft", "description": "Maximum express tunnel"}
    ]'::jsonb,
    question_type = 'select'
WHERE field_name = 'tunnelLength'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- #5: FACILITY SQ FT - Fix for car wash appropriate ranges
-- Typical car wash: 2,000-8,000 sq ft building + 10,000-40,000 lot
-- ============================================================================
UPDATE custom_questions
SET 
    question_text = 'Total facility square footage (building + lot)?',
    min_value = 5000,
    max_value = 60000,
    default_value = '15000',
    help_text = 'Total site area including building, tunnel, vacuum islands, and parking. Typical: 10,000-25,000 sq ft total site.',
    options = '[
        {"value": "5000", "label": "Under 8,000 sq ft", "description": "Small self-serve or IBA only"},
        {"value": "10000", "label": "8,000-12,000 sq ft", "description": "Compact express or IBA + vacuums"},
        {"value": "15000", "label": "12,000-18,000 sq ft", "description": "Standard express tunnel site"},
        {"value": "20000", "label": "18,000-25,000 sq ft", "description": "Large express with detail area"},
        {"value": "30000", "label": "25,000-35,000 sq ft", "description": "Full-service with multiple tunnels"},
        {"value": "45000", "label": "35,000-50,000 sq ft", "description": "Mega site with all services"},
        {"value": "60000", "label": "Over 50,000 sq ft", "description": "Multi-tunnel or fleet wash facility"}
    ]'::jsonb,
    question_type = 'select'
WHERE field_name IN ('squareFeet', 'siteSqFt', 'squareFootage')
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- #6: DAILY VEHICLES - Fix range (high-volume express can do 1,200+/day)
-- Research: Express tunnel 300-1,200/day, IBA 50-150/day, Self-serve 20-80/day
-- ============================================================================
UPDATE custom_questions
SET 
    min_value = 20,
    max_value = 1500,
    default_value = '250',
    help_text = 'Average cars washed per day. Self-serve: 20-80. IBA: 50-150. Express tunnel: 200-800. High-volume express: 800-1,200+.',
    options = '[
        {"value": "50", "label": "Under 75/day", "description": "Self-serve or low-traffic IBA"},
        {"value": "100", "label": "75-150/day", "description": "Average IBA or small tunnel"},
        {"value": "200", "label": "150-250/day", "description": "Standard express tunnel"},
        {"value": "350", "label": "250-450/day", "description": "Busy express tunnel"},
        {"value": "500", "label": "450-600/day", "description": "High-volume express"},
        {"value": "750", "label": "600-900/day", "description": "Very high volume"},
        {"value": "1000", "label": "900-1,200/day", "description": "Top-tier express location"},
        {"value": "1300", "label": "Over 1,200/day", "description": "Elite performer"}
    ]'::jsonb,
    question_type = 'select'
WHERE field_name = 'dailyVehicles'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- #9: VACUUM STATIONS - Cap at 25 (industry standard max)
-- Research: Typical 6-12, large sites up to 20-25
-- ============================================================================
UPDATE custom_questions
SET 
    min_value = 0,
    max_value = 25,
    default_value = '8',
    help_text = 'Number of self-service vacuum stations. Typical: 6-12. Large sites: up to 25. Each draws ~3-5 kW peak.',
    options = '[
        {"value": "0", "label": "None", "description": "No vacuum stations"},
        {"value": "4", "label": "4 stations", "description": "Small site"},
        {"value": "6", "label": "6 stations", "description": "Compact site"},
        {"value": "8", "label": "8 stations", "description": "Standard site"},
        {"value": "10", "label": "10 stations", "description": "Larger site"},
        {"value": "12", "label": "12 stations", "description": "High-volume site"},
        {"value": "16", "label": "16 stations", "description": "Very large site"},
        {"value": "20", "label": "20 stations", "description": "Maximum typical"},
        {"value": "25", "label": "25 stations", "description": "Mega site maximum"}
    ]'::jsonb,
    question_type = 'select'
WHERE field_name = 'vacuumStations'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- #18: AVAILABLE ROOF AREA - Fix for car wash scale (typically small roofs)
-- Research: Car wash roofs 1,500-5,000 sq ft usable, canopies add more
-- ============================================================================
UPDATE custom_questions
SET 
    question_text = 'Available roof/canopy area for solar (sq ft)?',
    min_value = 0,
    max_value = 15000,
    default_value = '2500',
    help_text = 'Unobstructed roof + canopy space for solar panels. Include vacuum canopy and parking covers if applicable. Typical: 2,000-5,000 sq ft.',
    options = '[
        {"value": "0", "label": "None available", "description": "No suitable roof space"},
        {"value": "1000", "label": "Under 1,500 sq ft", "description": "Small roof only"},
        {"value": "2000", "label": "1,500-2,500 sq ft", "description": "Tunnel roof only"},
        {"value": "3000", "label": "2,500-4,000 sq ft", "description": "Roof + small canopy"},
        {"value": "5000", "label": "4,000-6,000 sq ft", "description": "Roof + vacuum canopy"},
        {"value": "7500", "label": "6,000-9,000 sq ft", "description": "Roof + large canopy"},
        {"value": "10000", "label": "9,000-12,000 sq ft", "description": "Full canopy coverage"},
        {"value": "15000", "label": "Over 12,000 sq ft", "description": "Mega site with solar carports"}
    ]'::jsonb,
    question_type = 'select'
WHERE field_name IN ('roofSqFt', 'roofArea', 'availableRoofArea')
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- #21: MONTHLY ELECTRIC BILL - Fix ranges for car wash ($3K-$12K typical)
-- Research: Self-serve $800-2K, IBA $2K-4K, Express tunnel $4K-12K
-- ============================================================================
UPDATE custom_questions
SET 
    help_text = 'Monthly electricity cost. Self-serve: $800-2,000. IBA: $2,000-4,000. Express tunnel: $4,000-12,000. Full-service: $8,000-15,000+.',
    options = '[
        {"value": "1000", "label": "Under $1,500/mo", "description": "Small self-serve"},
        {"value": "2000", "label": "$1,500-2,500/mo", "description": "Self-serve or compact IBA"},
        {"value": "3500", "label": "$2,500-4,500/mo", "description": "IBA or small tunnel"},
        {"value": "5500", "label": "$4,500-6,500/mo", "description": "Standard express tunnel"},
        {"value": "8000", "label": "$6,500-9,500/mo", "description": "Busy express tunnel"},
        {"value": "11000", "label": "$9,500-12,500/mo", "description": "High-volume express"},
        {"value": "15000", "label": "$12,500-18,000/mo", "description": "Full-service or multi-tunnel"},
        {"value": "20000", "label": "Over $18,000/mo", "description": "Large full-service operation"},
        {"value": "0", "label": "Don''t know / Prefer not to say", "description": "We''ll estimate based on equipment"}
    ]'::jsonb
WHERE field_name = 'monthlyElectricBill'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- #22: PEAK DEMAND - Add "Don't Know" option + explain auto-estimate
-- Most operators don't know their peak kW - we can calculate it
-- ============================================================================
UPDATE custom_questions
SET 
    question_text = 'Do you know your peak power demand (kW)?',
    help_text = 'If you don''t know, we''ll estimate based on your equipment. Check your utility bill for "Peak Demand" or "kW". Self-serve: 30-70 kW. IBA: 50-150 kW. Express: 150-400 kW.',
    is_required = false,
    options = '[
        {"value": "unknown", "label": "Don''t know", "description": "We''ll calculate based on equipment (most common)"},
        {"value": "50", "label": "Under 75 kW", "description": "Self-serve or small IBA"},
        {"value": "100", "label": "75-125 kW", "description": "IBA or compact tunnel"},
        {"value": "175", "label": "125-225 kW", "description": "Standard express tunnel"},
        {"value": "275", "label": "225-325 kW", "description": "Busy express tunnel"},
        {"value": "375", "label": "325-425 kW", "description": "High-volume express"},
        {"value": "500", "label": "Over 425 kW", "description": "Large full-service or multi-tunnel"}
    ]'::jsonb,
    default_value = 'unknown'
WHERE field_name = 'peakDemand'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- #23: GRID CAPACITY - Add "Don't Know" option + explain auto-estimate
-- Most operators don't know their service size - we can estimate
-- ============================================================================
UPDATE custom_questions
SET 
    question_text = 'Do you know your electrical service capacity?',
    help_text = 'If unsure, we''ll estimate based on your facility size. Check your main breaker panel or utility bill for "Service Size". Most car washes: 200-600 Amp / 200-400 kW.',
    is_required = false,
    options = '[
        {"value": "unknown", "label": "Don''t know", "description": "We''ll estimate based on facility type (most common)"},
        {"value": "small", "label": "Under 200 Amps / 100 kW", "description": "Small self-serve"},
        {"value": "medium", "label": "200-400 Amps / 100-250 kW", "description": "IBA or compact tunnel"},
        {"value": "large", "label": "400-800 Amps / 250-500 kW", "description": "Standard express tunnel"},
        {"value": "xlarge", "label": "800-1200 Amps / 500-750 kW", "description": "Large express or full-service"},
        {"value": "utility", "label": "Over 1200 Amps / 750+ kW", "description": "Multi-tunnel or fleet operation"}
    ]'::jsonb,
    default_value = 'unknown'
WHERE field_name = 'gridCapacity'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- #26 & #27: EV CHARGER COUNTS - Ensure 0 is clearly "None"
-- The min_value is already 0, but let's make the help text clear
-- ============================================================================
UPDATE custom_questions
SET 
    question_text = 'Number of Level 2 EV chargers (or planned)?',
    help_text = 'Level 2 chargers (7-19 kW each). Enter 0 if none and not planning any. These are destination chargers for customers during wash.',
    default_value = '0',
    options = '[
        {"value": "0", "label": "None", "description": "No L2 chargers"},
        {"value": "2", "label": "2 chargers", "description": "Basic offering"},
        {"value": "4", "label": "4 chargers", "description": "Standard setup"},
        {"value": "6", "label": "6 chargers", "description": "Enhanced offering"},
        {"value": "8", "label": "8+ chargers", "description": "EV-focused site"}
    ]'::jsonb,
    question_type = 'select'
WHERE field_name = 'evL2Count'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions
SET 
    question_text = 'Number of DC Fast Chargers (DCFC)?',
    help_text = 'DC Fast Chargers (50-150 kW each). Enter 0 if none. DCFCs add significant power demand but attract EV drivers seeking quick charges.',
    default_value = '0',
    options = '[
        {"value": "0", "label": "None", "description": "No DCFC chargers"},
        {"value": "1", "label": "1 charger", "description": "Single DCFC"},
        {"value": "2", "label": "2 chargers", "description": "Dual DCFC"},
        {"value": "4", "label": "4 chargers", "description": "EV hub"},
        {"value": "6", "label": "6+ chargers", "description": "Major EV destination"}
    ]'::jsonb,
    question_type = 'select'
WHERE field_name = 'evDcfcCount'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- #32: PRIMARY ENERGY GOAL - Change to multiselect for multiple goals
-- Users often have multiple goals, not just one
-- ============================================================================
UPDATE custom_questions
SET 
    question_text = 'Energy goals (select all that apply)',
    question_type = 'multiselect',
    help_text = 'What do you want to achieve? Select all that apply. We''ll optimize the system for your priorities.',
    is_required = false,
    options = '[
        {"value": "reduce_bills", "label": "Reduce electricity bills", "icon": "💰", "description": "Lower monthly energy costs"},
        {"value": "peak_shaving", "label": "Reduce demand charges", "icon": "📉", "description": "Cut peak demand fees (often 30-50% of bill)"},
        {"value": "backup_power", "label": "Backup power for outages", "icon": "🔋", "description": "Keep washing during blackouts"},
        {"value": "ev_readiness", "label": "Support EV charging", "icon": "⚡", "description": "Power for current or future EV chargers"},
        {"value": "solar_integration", "label": "Maximize solar investment", "icon": "☀️", "description": "Store and use solar energy"},
        {"value": "sustainability", "label": "Sustainability / Green image", "icon": "🌿", "description": "Environmental goals and marketing"},
        {"value": "incentives", "label": "Qualify for rebates/incentives", "icon": "🎁", "description": "Access IRA tax credits, utility programs"},
        {"value": "not_sure", "label": "Not sure yet", "icon": "❓", "description": "Just exploring options"}
    ]'::jsonb,
    default_value = '["reduce_bills", "peak_shaving"]'
WHERE field_name = 'primaryBESSApplication'
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- ============================================================================
-- VERIFY: Show updated questions
-- ============================================================================
SELECT 
    cq.display_order,
    cq.field_name,
    cq.question_text,
    cq.question_type,
    cq.is_required,
    cq.help_text,
    cq.section_name
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'car-wash'
ORDER BY cq.display_order;

-- Count questions by section
SELECT 
    cq.section_name,
    COUNT(*) as question_count
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'car-wash'
GROUP BY cq.section_name
ORDER BY MIN(cq.display_order);
