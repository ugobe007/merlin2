-- ============================================================================
-- STREAMLINED DATA CENTER QUESTIONS
-- ============================================================================
-- Date: December 1, 2025
-- Purpose: Simplify datacenter questions to focus on key sizing metrics
-- Removes redundant grid/utility questions that are asked separately
-- ============================================================================

DO $$
DECLARE
    datacenter_id UUID;
BEGIN
    -- Find the datacenter use case
    SELECT id INTO datacenter_id FROM use_cases WHERE slug = 'data-center';
    
    IF datacenter_id IS NULL THEN
        SELECT id INTO datacenter_id FROM use_cases WHERE slug = 'datacenter';
    END IF;
    
    IF datacenter_id IS NULL THEN
        SELECT id INTO datacenter_id FROM use_cases WHERE slug = 'edge-data-center';
    END IF;
    
    IF datacenter_id IS NOT NULL THEN
        -- Clear existing questions
        DELETE FROM custom_questions WHERE use_case_id = datacenter_id;
        
        -- Insert streamlined questions focused on sizing
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order) VALUES
        
        -- CORE SIZING METRICS (Required)
        (datacenter_id, 'Number of server racks', 'rackCount', 'number', '50', 5, 1000, true, 
         'Total equipment racks in your facility', 1),
        
        (datacenter_id, 'Average power per rack (kW)', 'rackDensityKW', 'number', '8', 2, 30, true, 
         'Typical: 5-8 kW (standard), 10-20 kW (high density), 20+ kW (AI/HPC)', 2),
        
        (datacenter_id, 'Total facility square footage', 'facilitySqFt', 'number', '25000', 1000, 500000, true, 
         'Total data hall and support space', 3),
        
        (datacenter_id, 'Uptime tier requirement', 'uptimeTier', 'select', 'tier_3', null, null, true, 
         'Higher tiers = more redundancy & backup power', 4),
        
        -- COOLING & EFFICIENCY (Important for BESS sizing)
        (datacenter_id, 'Cooling system type', 'coolingType', 'select', 'crac', null, null, true, 
         'Cooling accounts for 30-50% of data center power', 5),
        
        (datacenter_id, 'Target PUE', 'pueTarget', 'number', '1.5', 1.1, 2.5, false, 
         'Power Usage Effectiveness: Total power ÷ IT power (1.0 = perfect efficiency)', 6),
        
        -- BACKUP REQUIREMENTS  
        (datacenter_id, 'Required battery backup time (minutes)', 'backupMinutes', 'number', '15', 5, 60, true, 
         'Time to bridge to generator or ride through short outages', 7),
        
        (datacenter_id, 'Do you have existing UPS?', 'hasExistingUPS', 'boolean', 'true', null, null, false, 
         'Current battery backup infrastructure to augment', 8);
        
        -- Add options for select fields
        UPDATE custom_questions SET options = '[
            {"value": "tier_1", "label": "Tier I (99.67%)", "description": "Basic: single path, no redundancy"},
            {"value": "tier_2", "label": "Tier II (99.74%)", "description": "Redundant components"},
            {"value": "tier_3", "label": "Tier III (99.98%)", "description": "Concurrently maintainable"},
            {"value": "tier_4", "label": "Tier IV (99.99%)", "description": "Fault tolerant, highest reliability"}
        ]'::jsonb WHERE field_name = 'uptimeTier' AND use_case_id = datacenter_id;
        
        UPDATE custom_questions SET options = '[
            {"value": "crac", "label": "CRAC Units", "description": "Traditional air-cooled with raised floor"},
            {"value": "in_row", "label": "In-Row Cooling", "description": "Hot/cold aisle containment"},
            {"value": "rear_door", "label": "Rear Door Heat Exchangers", "description": "Water-cooled at rack level"},
            {"value": "liquid_immersion", "label": "Liquid Immersion", "description": "Direct liquid cooling for high density"}
        ]'::jsonb WHERE field_name = 'coolingType' AND use_case_id = datacenter_id;
        
        RAISE NOTICE '✅ Updated Data Center: 8 streamlined questions focused on BESS sizing';
    ELSE
        RAISE NOTICE '⚠️ Data Center use case not found in database';
    END IF;
END $$;
