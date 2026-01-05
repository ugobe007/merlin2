-- Fix wrong icons in hotel existing infrastructure options
-- Vineet reported: Solar shows "X", Generator shows "sun", Battery shows "gas pump", EV shows "Battery"

-- First, let's see what we have
-- SELECT id, field_name, options FROM custom_questions WHERE field_name = 'existingGeneration';

-- Update the existingGeneration options with correct icons
UPDATE custom_questions 
SET options = '[
  {"value": "solar", "label": "Solar Panels", "icon": "☀️", "energyKwh": 0},
  {"value": "generator", "label": "Backup Generator", "icon": "⚡", "energyKwh": 0},
  {"value": "battery", "label": "Battery Storage", "icon": "🔋", "energyKwh": 0},
  {"value": "ev_chargers", "label": "EV Chargers", "icon": "🔌", "energyKwh": 0},
  {"value": "none", "label": "None", "icon": "❌", "energyKwh": 0}
]'::jsonb
WHERE field_name = 'existingGeneration' 
AND use_case_id = '5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9';

-- Fix parking options - change covered garage icon and add underground
UPDATE custom_questions 
SET options = '[
  {"value": "surface", "label": "Surface Lot", "icon": "🅿️", "energyKwh": 5000},
  {"value": "underground", "label": "Underground", "icon": "🏗️", "energyKwh": 25000},
  {"value": "covered", "label": "Covered Garage", "icon": "🏢", "energyKwh": 20000},
  {"value": "valet", "label": "Valet Only", "icon": "🚗", "energyKwh": 2000}
]'::jsonb
WHERE field_name = 'parkingType' 
AND use_case_id = '5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9';

-- Verify the changes
-- SELECT field_name, options FROM custom_questions 
-- WHERE field_name IN ('existingGeneration', 'parkingType')
-- AND use_case_id = '5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9';
