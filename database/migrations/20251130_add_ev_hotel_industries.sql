-- ============================================
-- ADD EV CHARGING HUB & HOTEL INDUSTRIES
-- ============================================
-- SMB Platform expansion for:
-- - EV Charging Hubs (evchargingpower.com)
-- - Hotels & Hospitality (hotelenergypartners.com)
-- ============================================

-- ============================================
-- 1. INDUSTRY POWER PROFILES
-- ============================================

-- EV Charging Hub Profile
INSERT INTO industry_power_profiles (
  industry_slug,
  typical_peak_demand_kw,
  typical_monthly_kwh,
  peak_demand_timing,
  load_profile_type,
  recommended_battery_kwh_per_unit,
  recommended_backup_hours,
  recommended_solar_kw_per_unit,
  unit_name,
  unit_plural,
  avg_electricity_rate,
  avg_demand_charge,
  typical_payback_years,
  data_source
) VALUES (
  'ev-charging-hub',
  500,                              -- 500 kW typical for 8-10 port hub
  75000,                            -- ~75,000 kWh/month
  'Commute hours 7-9am, 4-7pm; Weekend afternoons',
  'commute_peaks',
  100,                              -- 100 kWh per charging port
  2,                                -- 2 hours backup (chargers can throttle)
  30,                               -- 30 kW solar per port (carport coverage)
  'port',
  'ports',
  0.15,                             -- Higher commercial rate
  25.00,                            -- High demand charges for DC fast charging
  4.5,                              -- Faster payback due to high utilization
  'Merlin Energy EV Analysis 2024 + SAE J1772 Standards'
) ON CONFLICT (industry_slug) DO UPDATE SET
  typical_peak_demand_kw = EXCLUDED.typical_peak_demand_kw,
  typical_monthly_kwh = EXCLUDED.typical_monthly_kwh,
  recommended_battery_kwh_per_unit = EXCLUDED.recommended_battery_kwh_per_unit,
  last_updated = NOW();

-- Hotel/Hospitality Profile
INSERT INTO industry_power_profiles (
  industry_slug,
  typical_peak_demand_kw,
  typical_monthly_kwh,
  peak_demand_timing,
  load_profile_type,
  recommended_battery_kwh_per_unit,
  recommended_backup_hours,
  recommended_solar_kw_per_unit,
  unit_name,
  unit_plural,
  avg_electricity_rate,
  avg_demand_charge,
  typical_payback_years,
  data_source
) VALUES (
  'hotel',
  300,                              -- 300 kW typical for 150-room hotel
  120000,                           -- ~120,000 kWh/month (24/7 operation)
  'Check-in 3-6pm, Morning 6-9am HVAC surge',
  'hospitality_24_7',
  3,                                -- 3 kWh per room
  4,                                -- 4 hours backup (guest experience critical)
  1.5,                              -- 1.5 kW solar per room (roof limited)
  'room',
  'rooms',
  0.13,                             -- Commercial hospitality rate
  18.00,                            -- Moderate demand charges
  6.0,                              -- Longer payback but brand value
  'Merlin Energy Hospitality Analysis 2024 + ASHRAE 90.1'
) ON CONFLICT (industry_slug) DO UPDATE SET
  typical_peak_demand_kw = EXCLUDED.typical_peak_demand_kw,
  typical_monthly_kwh = EXCLUDED.typical_monthly_kwh,
  recommended_battery_kwh_per_unit = EXCLUDED.recommended_battery_kwh_per_unit,
  last_updated = NOW();

-- ============================================
-- 2. SMB SITES REGISTRY
-- ============================================

-- EV Charging Hub Site
INSERT INTO smb_sites (
  slug,
  domain,
  name,
  tagline,
  primary_color,
  secondary_color,
  industry_category,
  use_case_slug,
  features,
  meta_title,
  meta_description,
  is_active
) VALUES (
  'ev-charging-hub',
  'evchargingpower.com',
  'EV Charging Power Solutions',
  'Battery Energy Storage for EV Charging Stations',
  '#10B981',    -- Green (EV/sustainability)
  '#059669',
  'Electric Vehicle Infrastructure',
  'ev-charging',
  '{
    "showSolar": true,
    "showWind": false,
    "showGenerator": false,
    "showEV": true,
    "showFinancing": true,
    "showMarketIntelligence": true,
    "showDemandChargeAnalysis": true,
    "showPeakShaving": true
  }',
  'EV Charging Station Battery Storage | Reduce Demand Charges 40%+',
  'Cut EV charging station electricity costs with intelligent battery storage. Peak shaving, demand charge reduction, and solar integration for charging hubs.',
  true
) ON CONFLICT (slug) DO UPDATE SET
  domain = EXCLUDED.domain,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Hotel Site
INSERT INTO smb_sites (
  slug,
  domain,
  name,
  tagline,
  primary_color,
  secondary_color,
  industry_category,
  use_case_slug,
  features,
  meta_title,
  meta_description,
  is_active
) VALUES (
  'hotel',
  'hotelenergypartners.com',
  'Hotel Energy Partners',
  'Battery Energy Solutions for Hotels & Resorts',
  '#6366F1',    -- Indigo (premium/hospitality)
  '#4F46E5',
  'Hospitality',
  'hotel',
  '{
    "showSolar": true,
    "showWind": false,
    "showGenerator": true,
    "showEV": true,
    "showFinancing": true,
    "showMarketIntelligence": true,
    "showBackupPower": true,
    "showGuestAmenities": true
  }',
  'Hotel Battery Energy Storage | Reduce Energy Costs & Improve Guest Experience',
  'Lower hotel electricity bills while ensuring uninterrupted guest experience. Battery backup, solar integration, and EV charging for hospitality.',
  true
) ON CONFLICT (slug) DO UPDATE SET
  domain = EXCLUDED.domain,
  name = EXCLUDED.name,
  updated_at = NOW();

-- ============================================
-- 3. INDUSTRY-SPECIFIC CALCULATION CONSTANTS
-- ============================================

-- EV Charging specific constants
INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('ev_charger_level2_kw', 'ev_charging', 7.2, 'number', 'Level 2 charger power (kW)', 'SAE J1772'),
('ev_charger_dcfc_50_kw', 'ev_charging', 50, 'number', 'DC Fast Charger 50kW power', 'SAE CCS/CHAdeMO'),
('ev_charger_dcfc_150_kw', 'ev_charging', 150, 'number', 'DC Fast Charger 150kW power', 'SAE CCS'),
('ev_charger_hpc_250_kw', 'ev_charging', 250, 'number', 'High Power Charger 250kW', 'SAE CCS'),
('ev_charger_hpc_350_kw', 'ev_charging', 350, 'number', 'High Power Charger 350kW', 'SAE CCS'),
('ev_concurrency_factor', 'ev_charging', 0.7, 'number', 'Typical charger concurrency (70%)', 'Industry analysis'),
('ev_demand_charge_savings_percent', 'ev_charging', 0.45, 'number', 'Typical demand charge reduction with BESS', 'Case studies')
ON CONFLICT (key) DO UPDATE SET
  value_numeric = EXCLUDED.value_numeric,
  updated_at = NOW();

-- Hotel specific constants
INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
('hotel_kwh_per_room_night', 'hotel', 30, 'number', 'Average kWh per occupied room per night', 'ENERGY STAR'),
('hotel_peak_demand_per_room_kw', 'hotel', 2, 'number', 'Peak demand per room (kW)', 'ASHRAE 90.1'),
('hotel_backup_critical_load_percent', 'hotel', 0.4, 'number', 'Critical load for backup (40%)', 'Industry standard'),
('hotel_ev_charging_demand_kw', 'hotel', 7.2, 'number', 'EV charging demand per port for guest charging', 'Level 2 standard'),
('hotel_solar_potential_sqft_per_room', 'hotel', 50, 'number', 'Avg rooftop sqft available per room', 'Hospitality analysis')
ON CONFLICT (key) DO UPDATE SET
  value_numeric = EXCLUDED.value_numeric,
  updated_at = NOW();

-- ============================================
-- 4. VERIFY DATA
-- ============================================

-- Show all industry profiles
SELECT industry_slug, typical_peak_demand_kw, recommended_battery_kwh_per_unit, unit_name 
FROM industry_power_profiles 
ORDER BY industry_slug;

-- Show all SMB sites
SELECT slug, name, domain, is_active 
FROM smb_sites 
ORDER BY slug;
