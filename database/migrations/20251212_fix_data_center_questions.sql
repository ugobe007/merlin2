-- ============================================================================
-- FIX DATA CENTER QUESTIONS - Add Industry-Specific Questions
-- December 12, 2025
-- 
-- Based on comprehensive Data Center specifications:
-- - Tier classification (I/II/III/IV/Hyperscale)
-- - IT load, cooling (40-50% of IT), power distribution, support
-- - 100% critical load, short-duration BESS (15 min UPS ride-through)
-- - PUE targets by tier
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_question_count INT;
BEGIN
  -- Get data center use case ID
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'data-center' LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE EXCEPTION 'Data center use case not found!';
  END IF;
  
  -- Check current question count
  SELECT COUNT(*) INTO v_question_count 
  FROM custom_questions WHERE use_case_id = v_use_case_id;
  
  RAISE NOTICE 'Data center currently has % questions', v_question_count;
  
  -- Delete ALL existing questions to start fresh
  DELETE FROM custom_questions WHERE use_case_id = v_use_case_id;
  RAISE NOTICE 'Deleted old questions, adding data center-specific questions';
  
  -- ============================================================================
  -- DATA CENTER SPECIFIC QUESTIONS
  -- ============================================================================
  
  -- 1. Tier classification
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Data center tier classification', 'dataCenterTier', 'select', 'tier3', true, 'Uptime Institute tier or equivalent', 1,
    '[
      {"label": "Tier I - Basic (99.671% uptime, N)", "value": "tier1"},
      {"label": "Tier II - Redundant (99.741% uptime, N+1)", "value": "tier2"},
      {"label": "Tier III - Concurrently Maintainable (99.982% uptime, N+1)", "value": "tier3"},
      {"label": "Tier IV - Fault Tolerant (99.995% uptime, 2N)", "value": "tier4"},
      {"label": "Hyperscale - Enterprise (99.999% uptime, 2N+1)", "value": "hyperscale"}
    ]'::jsonb);
  
  -- 2. IT load / white space capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'IT load / white space capacity', 'itLoadMW', 'select', '3', true, 'Total IT equipment power (servers, storage, network)', 2,
    '[
      {"label": "0.5 - 2 MW (small)", "value": "1"},
      {"label": "2 - 5 MW (medium)", "value": "3"},
      {"label": "5 - 15 MW (large)", "value": "10"},
      {"label": "15 - 40 MW (enterprise)", "value": "30"},
      {"label": "40 - 75 MW (mega)", "value": "60"},
      {"label": "75 - 150 MW (hyperscale)", "value": "100"},
      {"label": "Over 150 MW", "value": "200"}
    ]'::jsonb);
  
  -- 3. Rack density profile
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Rack density profile', 'rackDensity', 'select', 'high_density', true, 'Average power per rack', 3,
    '[
      {"label": "Standard - 5-8 kW/rack (general compute)", "value": "standard"},
      {"label": "High-Density - 15-25 kW/rack (virtualization)", "value": "high_density"},
      {"label": "GPU/AI - 30-50 kW/rack (ML/AI workloads)", "value": "gpu_ai"},
      {"label": "Liquid-Cooled - 50-100+ kW/rack (HPC, advanced AI)", "value": "liquid_cooled"},
      {"label": "Mixed - Variety of rack densities", "value": "mixed"}
    ]'::jsonb);
  
  -- 4. Number of server racks
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of server racks', 'rackCount', 'select', '200', false, 'Total IT racks deployed or planned', 4,
    '[
      {"label": "50 - 100 racks", "value": "75"},
      {"label": "100 - 200 racks", "value": "150"},
      {"label": "200 - 500 racks", "value": "350"},
      {"label": "500 - 1,000 racks", "value": "750"},
      {"label": "1,000 - 3,000 racks", "value": "2000"},
      {"label": "3,000 - 10,000 racks", "value": "6500"},
      {"label": "Over 10,000 racks", "value": "15000"}
    ]'::jsonb);
  
  -- 5. Cooling system type
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Primary cooling system', 'coolingSystem', 'select', 'crac_chiller', true, 'Data center cooling architecture', 5,
    '[
      {"label": "CRAC/CRAH Units - Air-cooled", "value": "crac_air"},
      {"label": "CRAC/CRAH + Chillers - Standard", "value": "crac_chiller"},
      {"label": "In-Row Cooling - High-density", "value": "in_row"},
      {"label": "Rear-Door Heat Exchangers - Very high-density", "value": "rear_door"},
      {"label": "Direct Liquid Cooling - Extreme density", "value": "liquid_cooling"},
      {"label": "Free Cooling / Economizers - Efficiency optimized", "value": "free_cooling"}
    ]'::jsonb);
  
  -- 6. Target PUE
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Target PUE (Power Usage Effectiveness)', 'targetPUE', 'select', '1.5', true, 'Total facility power / IT equipment power', 6,
    '[
      {"label": "2.0 - 2.5 (Tier I typical)", "value": "2.2"},
      {"label": "1.7 - 2.0 (Tier II typical)", "value": "1.85"},
      {"label": "1.4 - 1.7 (Tier III typical)", "value": "1.5"},
      {"label": "1.3 - 1.5 (Tier IV typical)", "value": "1.4"},
      {"label": "1.1 - 1.3 (Hyperscale typical)", "value": "1.2"},
      {"label": "Under 1.1 (Best-in-class)", "value": "1.05"}
    ]'::jsonb);
  
  -- 7. UPS system configuration
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'UPS system configuration', 'upsConfiguration', 'select', 'n_plus_1', true, 'Uninterruptible power supply redundancy', 7,
    '[
      {"label": "N - No redundancy (Tier I)", "value": "n"},
      {"label": "N+1 - Single redundancy (Tier II/III)", "value": "n_plus_1"},
      {"label": "2N - Fully redundant (Tier IV)", "value": "2n"},
      {"label": "2N+1 - Fully redundant + 1 (Hyperscale)", "value": "2n_plus_1"}
    ]'::jsonb);
  
  -- 8. Generator backup
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Emergency generator capacity', 'generatorCapacityMW', 'select', '5', true, 'Backup generator sizing', 8,
    '[
      {"label": "Under 1 MW", "value": "0.75"},
      {"label": "1 - 3 MW", "value": "2"},
      {"label": "3 - 8 MW", "value": "5"},
      {"label": "8 - 20 MW", "value": "15"},
      {"label": "20 - 50 MW", "value": "35"},
      {"label": "50 - 100 MW", "value": "75"},
      {"label": "Over 100 MW", "value": "150"}
    ]'::jsonb);
  
  -- 9. Fuel type for generators
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Generator fuel type', 'generatorFuelType', 'select', 'diesel', false, 'Primary backup generator fuel', 9,
    '[
      {"label": "Diesel", "value": "diesel"},
      {"label": "Natural Gas", "value": "natural_gas"},
      {"label": "Dual Fuel (Diesel + Natural Gas)", "value": "dual_fuel"}
    ]'::jsonb);
  
  -- 10. Fuel storage capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Fuel storage capacity (runtime)', 'fuelStorageHours', 'select', '48', false, 'How long can generators run on stored fuel?', 10,
    '[
      {"label": "12 - 24 hours", "value": "18"},
      {"label": "24 - 48 hours (standard)", "value": "36"},
      {"label": "48 - 72 hours", "value": "60"},
      {"label": "72 - 96 hours", "value": "84"},
      {"label": "Over 96 hours (extended)", "value": "120"}
    ]'::jsonb);
  
  -- 11. Workload type
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Primary workload type', 'workloadType', 'select', 'cloud_services', true, 'What type of computing workload?', 11,
    '[
      {"label": "Colocation - Multi-tenant hosting", "value": "colocation"},
      {"label": "Cloud Services - IaaS/PaaS/SaaS", "value": "cloud_services"},
      {"label": "Enterprise IT - Corporate applications", "value": "enterprise_it"},
      {"label": "HPC - High-performance computing", "value": "hpc"},
      {"label": "AI/ML - Machine learning training/inference", "value": "ai_ml"},
      {"label": "Edge Computing - Low-latency applications", "value": "edge"},
      {"label": "Mixed - Multiple workload types", "value": "mixed"}
    ]'::jsonb);
  
  -- 12. Certifications / compliance
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Certifications / compliance requirements', 'certifications', 'select', 'standard', false, 'Industry certifications or regulatory compliance', 12,
    '[
      {"label": "Standard - Basic compliance", "value": "standard"},
      {"label": "SOC 2 - Service Organization Control", "value": "soc2"},
      {"label": "ISO 27001 - Information security", "value": "iso27001"},
      {"label": "PCI DSS - Payment card industry", "value": "pci_dss"},
      {"label": "HIPAA - Healthcare data", "value": "hipaa"},
      {"label": "FedRAMP - Government cloud", "value": "fedramp"},
      {"label": "Multiple - Comprehensive compliance", "value": "multiple"}
    ]'::jsonb);
  
  -- 13. Monthly electric bill
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Average monthly electricity bill', 'monthlyElectricBill', 'select', '150000', true, 'Total facility electricity cost', 13,
    '[
      {"label": "$50,000 - $150,000/month (small)", "value": "100000"},
      {"label": "$150,000 - $400,000/month (medium)", "value": "275000"},
      {"label": "$400,000 - $1M/month (large)", "value": "700000"},
      {"label": "$1M - $3M/month (enterprise)", "value": "2000000"},
      {"label": "$3M - $8M/month (mega)", "value": "5500000"},
      {"label": "Over $8M/month (hyperscale)", "value": "12000000"}
    ]'::jsonb);
  
  -- 14. Monthly demand charges
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Monthly demand charges', 'monthlyDemandCharges', 'select', '60000', true, 'Peak demand portion of electric bill', 14,
    '[
      {"label": "$20,000 - $60,000/month", "value": "40000"},
      {"label": "$60,000 - $150,000/month", "value": "105000"},
      {"label": "$150,000 - $400,000/month", "value": "275000"},
      {"label": "$400,000 - $1M/month", "value": "700000"},
      {"label": "Over $1M/month", "value": "1500000"}
    ]'::jsonb);
  
  -- 15. Grid connection capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Grid connection capacity', 'gridCapacityMW', 'select', '6', true, 'Your facility''s electrical service size', 15,
    '[
      {"label": "1 - 3 MW", "value": "2"},
      {"label": "3 - 8 MW", "value": "5"},
      {"label": "8 - 20 MW", "value": "15"},
      {"label": "20 - 50 MW", "value": "35"},
      {"label": "50 - 100 MW", "value": "75"},
      {"label": "Over 100 MW", "value": "150"}
    ]'::jsonb);
  
  -- 16. Existing solar capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Existing solar capacity', 'existingSolarMW', 'select', '0', false, 'On-site solar already installed', 16,
    '[
      {"label": "None", "value": "0"},
      {"label": "0.5 - 2 MW", "value": "1"},
      {"label": "2 - 5 MW", "value": "3"},
      {"label": "5 - 15 MW", "value": "10"},
      {"label": "Over 15 MW", "value": "20"}
    ]'::jsonb);
  
  -- 17. Interested in solar
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Interested in adding solar?', 'wantsSolar', 'boolean', 'true', false, 'On-site solar for renewable energy credits and cost reduction', 17);
  
  -- 18. Primary BESS Application
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Primary BESS Application', 'primaryBESSApplication', 'select', 'ups_ride_through', false, 'How will you primarily use battery storage?', 18,
    '[
      {"label": "UPS Ride-Through - Bridge to generator (10-15 min)", "value": "ups_ride_through"},
      {"label": "Peak Shaving - Reduce demand charges", "value": "peak_shaving"},
      {"label": "Renewable Integration - Maximize solar self-consumption", "value": "renewable_integration"},
      {"label": "Demand Response - Participate in utility programs", "value": "demand_response"},
      {"label": "Backup Power - Extended runtime without generators", "value": "backup_power"},
      {"label": "Multiple Applications - Stacked benefits", "value": "stacked"}
    ]'::jsonb);
  
  RAISE NOTICE 'Successfully added 18 data center-specific questions';
END $$;

-- ============================================================================
-- VERIFY RESULTS
-- ============================================================================

SELECT 
  uc.name as use_case,
  cq.display_order,
  cq.question_text,
  cq.field_name,
  cq.question_type,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    ELSE 'N/A'
  END as option_count
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'data-center'
ORDER BY cq.display_order;
