-- ============================================================================
-- Update Office Building Use Case with Improved Questions
-- ============================================================================
-- Date: November 25, 2025
-- Purpose: Streamlined questionnaire focused on core decision factors

-- Update the office use case with professional image
UPDATE use_cases 
SET 
  image_url = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
  description = 'Commercial office buildings including corporate headquarters, medical offices, research facilities, co-working spaces, and mixed-use developments',
  updated_at = NOW()
WHERE slug = 'office';

-- First, delete existing questions for office use case (if any)
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

-- Insert new streamlined questions for Office Building
-- Based on user feedback for production-ready questionnaire

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
  display_order AFTER gridReliability question,
  help_text
) VALUES 

-- 0. Building Type Classification (NEW - FIRST QUESTION)
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'What type of office building is this?',
  'buildingType',
  'select',
  'corporate',
  '[
    {"value": "corporate", "label": "Corporate Office - Single company headquarters or campus (Apple, Facebook, etc.)"},
    {"value": "medical", "label": "Medical Office Building - Clinics, doctors offices, outpatient facilities"},
    {"value": "research", "label": "Research & Lab - R&D facilities, lab spaces, research institutions"},
    {"value": "cowork", "label": "Co-work/Business - Shared offices, WeWork-style spaces"},
    {"value": "mixed_use", "label": "Mixed-Use - Retail ground floor + offices/residential above"},
    {"value": "general", "label": "General Office - Standard multi-tenant office building"}
  ]'::jsonb,
  true,
  NULL,
  NULL,
  0,
  'Building type affects energy patterns, critical load requirements, and backup power needs'
),

-- 1. Building Profile - Square Footage
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Square footage',
  'squareFootage',
  'number',
  '50000',
  NULL,
  true,
  1000,
  1000000,
  1,
  'Total building square footage (sq ft)'
),

-- Operating Hours
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Daily operating hours',
  'operatingHours',
  'number',
  '12',
  NULL,
  true,
  8,
  24,
  2,
  'Hours per day the building is actively occupied'
),

-- 2. Energy Usage - Monthly Bill
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Average monthly electric bill (dollars)',
  'monthlyElectricBill',
  'number',
  '15000',
  NULL,
  true,
  500,
  500000,
  3,
  'This helps us estimate your energy costs and potential savings'
),

-- 3. Peak Demand (optional)
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Peak demand (kW) - if known',
  'peakDemandKw',
  'number',
  '0',
  NULL,
  false,
  0,
  10000,
  4,
  'Enter peak demand from your utility bill, or leave 0 for auto-calculation'
),

-- 4. Utility Rate Structure
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Does your utility charge demand fees or time-of-use rates?',
  'utilityRateType',
  'select',
  'standard',
  '[
    {"value": "standard", "label": "Standard flat rate"},
    {"value": "demand_charges", "label": "Demand charges ($/kW)"},
    {"value": "time_of_use", "label": "Time-of-use (TOU) rates"},
    {"value": "both", "label": "Both demand charges and TOU"}
  ]'::jsonb,
  true,
  NULL,
  NULL,
  5,
  'Rate structure affects potential savings from battery storage'
),

-- 5. Grid Reliability Assessment
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'How reliable is your grid connection?',
  'gridReliability',
  'select',
  'reliable',
  '[
    {"value": "very_reliable", "label": "Very reliable - rare outages (< 1/year)"},
    {"value": "reliable", "label": "Reliable - occasional outages (1-3/year)"},
    {"value": "unreliable", "label": "Unreliable - frequent outages (> 3/year)"},
    {"value": "off_grid", "label": "Off-grid or microgrid"}
  ]'::jsonb,
  true,
  NULL,
  NULL,
  6,
  'Grid reliability affects backup power sizing and business case'
),

-- 6. Backup Power Needs - Critical Loads
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'What must stay operational during an outage?',
  'criticalLoads',
  'select',
  'basic',
  '[
    {"value": "basic", "label": "Basic: Emergency lights, security, fire systems"},
    {"value": "partial", "label": "Partial: + HVAC, data centers, some workstations"},
    {"value": "full", "label": "Full: Entire building operations"},
    {"value": "data_critical", "label": "Data Critical: All IT and data center loads"}
  ]'::jsonb,
  true,
  NULL,
  NULL,
  7,
  'Determines minimum battery capacity needed for resilience'
),

-- 7. Backup Duration
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'How many hours of backup do you need?',
  'backupHours',
  'number',
  '4',
  NULL,
  true,
  1,
  24,
  8,
  'Typical range: 2-8 hours for most office buildings'
),

-- 8. Existing Systems - Solar
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Do you have solar panels?',
  'hasSolar',
  'boolean',
  'false',
  NULL,
  false,
  NULL,
  NULL,
  9,
  'Existing solar can offset battery charging costs'
),

-- Solar Size (conditional on hasSolar)
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Solar system size (kW) - if applicable',
  'solarSizeKw',
  'number',
  '0',
  NULL,
  false,
  0,
  5000,
  10,
  'Enter solar system capacity in kW'
),

-- 8. Backup Generator
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Do you have backup generators?',
  'hasGenerator',
  'boolean',
  'false',
  NULL,
  false,
  NULL,
  NULL,
  11,
  'Batteries can work alongside generators for better efficiency'
),

-- Generator Size (conditional)
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
  12,
  'Enter generator capacity in kW'
),

-- 9. Primary Goals
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Primary Goals (select top priorities)',
  'primaryGoals',
  'select',
  'cost_reduction',
  '[
    {"value": "cost_reduction", "label": "Lower energy costs"},
    {"value": "backup_power", "label": "Backup power/resilience"},
    {"value": "sustainability", "label": "Sustainability targets"},
    {"value": "energy_independence", "label": "Energy independence"},
    {"value": "demand_management", "label": "Peak demand management"}
  ]'::jsonb,
  true,
  NULL,
  NULL,
  13,
  'Helps us optimize the system design for your priorities'
),

-- 10. Installation Constraints - Space
(
  (SELECT id FROM use_cases WHERE slug = 'office'),
  'Available space for batteries?',
  'installationSpace',
  'select',
  'electrical_room',
  '[
    {"value": "electrical_room", "label": "Indoor electrical room"},
    {"value": "outdoor_ground", "label": "Outdoor ground-level"},
    {"value": "outdoor_pad", "label": "Outdoor concrete pad"},
    {"value": "rooftop", "label": "Rooftop"},
    {"value": "parking", "label": "Parking garage/structure"},
    {"value": "limited", "label": "Limited space available"}
  ]'::jsonb,
  true,
  NULL,
  NULL,
  14,
  'Installation location affects system design and costs'
);

-- Create index on question ordering (without WHERE clause - applies to all use cases)
CREATE INDEX IF NOT EXISTS idx_office_questions_order 
ON custom_questions(use_case_id, display_order);

-- Verify insertion (should show 15 questions now)
SELECT 
  field_name,
  question_text,
  question_type,
  is_required,
  display_order
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
ORDER BY display_order;
