-- ============================================================================
-- TRUEQUOTE CALCULATION CONSTANTS TABLE
-- ============================================================================
-- This table is the SINGLE SOURCE OF TRUTH for all calculation constants.
-- The Meta Calculations page (/meta) reads from this table.
-- 
-- Created: January 4, 2026
-- Part of: Porsche 911 Architecture

-- Create calculation_constants table
CREATE TABLE IF NOT EXISTS calculation_constants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  value_numeric NUMERIC,
  value_text TEXT,
  value_json JSONB,
  value_type TEXT NOT NULL DEFAULT 'number' CHECK (value_type IN ('number', 'string', 'json', 'boolean')),
  description TEXT,
  source TEXT,
  source_url TEXT,
  effective_date DATE DEFAULT CURRENT_DATE,
  expiration_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calc_constants_key ON calculation_constants(key);
CREATE INDEX IF NOT EXISTS idx_calc_constants_category ON calculation_constants(category);

-- Enable RLS
ALTER TABLE calculation_constants ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read constants (they're public data)
CREATE POLICY "Anyone can read calculation constants" ON calculation_constants
  FOR SELECT USING (true);

-- Only service role can modify
CREATE POLICY "Service role can modify constants" ON calculation_constants
  FOR ALL USING (auth.role() = 'service_role');

-- Update trigger
CREATE OR REPLACE FUNCTION update_calculation_constants_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calc_constants_updated_at
  BEFORE UPDATE ON calculation_constants
  FOR EACH ROW
  EXECUTE FUNCTION update_calculation_constants_timestamp();

-- ============================================================================
-- SEED DATA - BESS Constants
-- ============================================================================
INSERT INTO calculation_constants (key, category, value_numeric, value_type, description, source) VALUES
-- BESS
('BESS_COST_PER_KWH', 'BESS', 350, 'number', 'Battery storage cost per kWh capacity', 'NREL ATB 2024'),
('BESS_COST_PER_KW', 'BESS', 150, 'number', 'Battery inverter cost per kW power', 'NREL ATB 2024'),
('BESS_EFFICIENCY', 'BESS', 0.85, 'number', 'Round-trip efficiency', 'Industry Standard'),
('BESS_DEGRADATION_ANNUAL', 'BESS', 0.025, 'number', 'Annual capacity degradation rate', 'LFP Industry Standard'),
('BESS_LIFETIME_YEARS', 'BESS', 15, 'number', 'Expected system lifetime in years', 'NREL ATB 2024'),

-- Solar
('SOLAR_COST_PER_KWP', 'Solar', 1200, 'number', 'Solar PV installed cost per kWp', 'SEIA Q4 2024'),
('SOLAR_COST_PER_WATT', 'Solar', 1.20, 'number', 'Solar PV cost per watt', 'SEIA Q4 2024'),
('SOLAR_PANEL_WATTS', 'Solar', 500, 'number', 'Standard panel wattage', 'Industry Standard'),
('SOLAR_CAPACITY_FACTOR', 'Solar', 0.20, 'number', 'Average capacity factor', 'NREL NSRDB'),
('SOLAR_DEGRADATION_ANNUAL', 'Solar', 0.005, 'number', 'Annual output degradation', 'Industry Standard'),
('SOLAR_LIFETIME_YEARS', 'Solar', 25, 'number', 'Expected panel lifetime', 'Industry Standard'),
('SOLAR_SQFT_PER_KW', 'Solar', 70, 'number', 'Square feet required per kW', 'Industry Standard'),

-- Generator
('GENERATOR_COST_PER_KW_DIESEL', 'Generator', 800, 'number', 'Diesel generator cost per kW', 'Industry Average'),
('GENERATOR_COST_PER_KW_NATGAS', 'Generator', 650, 'number', 'Natural gas generator cost per kW', 'Industry Average'),
('GENERATOR_FUEL_COST_DIESEL', 'Generator', 4.00, 'number', 'Diesel fuel cost per gallon', 'EIA 2024'),
('GENERATOR_FUEL_COST_NATGAS', 'Generator', 3.50, 'number', 'Natural gas cost per therm', 'EIA 2024'),
('GENERATOR_EFFICIENCY', 'Generator', 0.35, 'number', 'Generator fuel efficiency', 'Industry Standard'),

-- EV Charging
('EV_LEVEL2_KW', 'EV', 19.2, 'number', 'Level 2 charger power rating', 'SAE J1772'),
('EV_LEVEL2_COST', 'EV', 6000, 'number', 'Level 2 charger installed cost', 'ChargePoint 2024'),
('EV_DCFC_KW', 'EV', 150, 'number', 'DC Fast charger power rating', 'Industry Standard'),
('EV_DCFAST_COST', 'EV', 50000, 'number', 'DC Fast charger installed cost', 'ABB/ChargePoint 2024'),
('EV_ULTRAFAST_KW', 'EV', 350, 'number', 'Ultra-fast charger power rating', 'Industry Standard'),
('EV_ULTRAFAST_COST', 'EV', 150000, 'number', 'Ultra-fast charger installed cost', 'Industry 2024'),

-- Financial
('FEDERAL_ITC_RATE', 'Financial', 0.30, 'number', 'Federal Investment Tax Credit rate', 'IRS Section 48E'),
('INSTALLATION_PERCENT', 'Financial', 0.15, 'number', 'Installation cost as percentage of equipment', 'Industry Standard'),
('DISCOUNT_RATE', 'Financial', 0.08, 'number', 'NPV discount rate', 'Industry Standard'),
('ELECTRICITY_ESCALATION', 'Financial', 0.03, 'number', 'Annual electricity price escalation', 'EIA Forecast'),
('PROJECT_LIFETIME_YEARS', 'Financial', 25, 'number', 'Standard project analysis period', 'Industry Standard'),

-- Savings Calculations
('PEAK_SHAVING_PERCENT', 'Savings', 0.25, 'number', 'Typical demand charge reduction', 'Industry Experience'),
('ARBITRAGE_CYCLES_YEAR', 'Savings', 250, 'number', 'TOU arbitrage cycles per year', 'Industry Standard'),
('ARBITRAGE_SPREAD', 'Savings', 0.06, 'number', 'Average peak/off-peak price spread', 'Utility Average'),
('DEMAND_REDUCTION_PERCENT', 'Savings', 0.30, 'number', 'Demand reduction with BESS', 'Industry Experience')

ON CONFLICT (key) DO UPDATE SET
  value_numeric = EXCLUDED.value_numeric,
  description = EXCLUDED.description,
  source = EXCLUDED.source,
  updated_at = NOW();

-- ============================================================================
-- INDUSTRY CONFIGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS industry_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  load_method TEXT NOT NULL CHECK (load_method IN ('per_unit', 'per_sqft', 'fixed')),
  watts_per_unit NUMERIC NOT NULL,
  unit_field TEXT,
  load_factor NUMERIC NOT NULL,
  bess_duration_hours NUMERIC NOT NULL DEFAULT 4,
  critical_load_percent NUMERIC NOT NULL DEFAULT 0.6,
  generator_required BOOLEAN DEFAULT false,
  solar_recommended BOOLEAN DEFAULT true,
  subtypes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE industry_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read industry configs" ON industry_configs
  FOR SELECT USING (true);

-- Seed industry configs
INSERT INTO industry_configs (industry, name, load_method, watts_per_unit, unit_field, load_factor, bess_duration_hours, critical_load_percent, generator_required, solar_recommended, subtypes) VALUES
('hotel', 'Hotel / Resort', 'per_unit', 2500, 'roomCount', 0.45, 4, 0.60, false, true, '{"budget": 0.8, "midscale": 1.0, "upscale": 1.2, "luxury": 1.5}'),
('data_center', 'Data Center', 'per_sqft', 150, 'squareFootage', 0.85, 4, 1.00, true, true, '{"tier_1": 0.7, "tier_2": 0.85, "tier_3": 1.0, "tier_4": 1.2, "hyperscale": 1.5}'),
('hospital', 'Hospital', 'per_unit', 3000, 'bedCount', 0.75, 4, 0.80, true, true, '{"clinic": 0.6, "community": 0.8, "regional": 1.0, "teaching": 1.2}'),
('car_wash', 'Car Wash', 'per_sqft', 25, 'squareFootage', 0.35, 2, 0.50, false, true, '{"self_service": 0.7, "express": 1.0, "full_service": 1.3}'),
('manufacturing', 'Manufacturing', 'per_sqft', 30, 'squareFootage', 0.55, 4, 0.70, false, true, '{"light_assembly": 0.8, "heavy": 1.2, "food_processing": 1.0, "pharmaceutical": 1.3}'),
('retail', 'Retail', 'per_sqft', 15, 'squareFootage', 0.40, 2, 0.40, false, true, '{"convenience": 0.6, "grocery": 1.0, "department": 1.2, "warehouse_club": 1.4}'),
('restaurant', 'Restaurant', 'per_sqft', 40, 'squareFootage', 0.50, 2, 0.60, false, true, '{"qsr": 0.8, "fast_casual": 1.0, "casual_dining": 1.1, "fine_dining": 1.3}'),
('office', 'Office Building', 'per_sqft', 12, 'squareFootage', 0.35, 4, 0.30, false, true, '{"small": 0.8, "medium": 1.0, "large": 1.1, "campus": 1.3}'),
('warehouse', 'Warehouse', 'per_sqft', 8, 'squareFootage', 0.30, 4, 0.25, false, true, '{"general": 0.8, "cold_storage": 1.5, "distribution": 1.0, "fulfillment": 1.2}'),
('casino', 'Casino', 'per_sqft', 50, 'squareFootage', 0.70, 4, 0.80, false, true, '{"regional": 1.0, "destination": 1.3}'),
('university', 'University / College', 'per_sqft', 20, 'squareFootage', 0.45, 4, 0.50, false, true, '{"community": 0.7, "regional": 1.0, "large_state": 1.2, "research": 1.4}'),
('apartment', 'Apartment Building', 'per_unit', 1500, 'unitCount', 0.40, 4, 0.50, false, true, '{"garden": 0.8, "mid_rise": 1.0, "high_rise": 1.2}')
ON CONFLICT (industry) DO UPDATE SET
  name = EXCLUDED.name,
  load_method = EXCLUDED.load_method,
  watts_per_unit = EXCLUDED.watts_per_unit,
  load_factor = EXCLUDED.load_factor,
  bess_duration_hours = EXCLUDED.bess_duration_hours,
  critical_load_percent = EXCLUDED.critical_load_percent,
  subtypes = EXCLUDED.subtypes,
  updated_at = NOW();

-- ============================================================================
-- MARKET PRICING TABLE (for scraper data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS market_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  current_price NUMERIC NOT NULL,
  previous_price NUMERIC,
  unit TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  confidence NUMERIC DEFAULT 0.8,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category, item)
);

-- Enable RLS
ALTER TABLE market_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market pricing" ON market_pricing
  FOR SELECT USING (true);

-- Seed initial market pricing
INSERT INTO market_pricing (category, item, current_price, previous_price, unit, source, confidence) VALUES
('BESS', 'LFP Battery Cells', 95, 105, '$/kWh', 'BloombergNEF', 0.92),
('BESS', 'Battery Pack (Utility)', 139, 145, '$/kWh', 'BNEF/Wood Mackenzie', 0.88),
('BESS', 'Inverter (Utility)', 45, 48, '$/kW', 'NREL ATB', 0.90),
('Solar', 'Mono PERC Module', 0.22, 0.24, '$/W', 'PVInsights', 0.95),
('Solar', 'String Inverter', 0.05, 0.05, '$/W', 'NREL ATB', 0.85),
('Solar', 'Racking (Ground)', 0.08, 0.09, '$/W', 'Wood Mackenzie', 0.82),
('EV', 'Level 2 Charger', 2500, 2800, '$', 'ChargePoint', 0.88),
('EV', 'DCFC 150kW', 35000, 38000, '$', 'ABB/ChargePoint', 0.85),
('EV', 'Ultra-Fast 350kW', 120000, 130000, '$', 'Industry', 0.80)
ON CONFLICT (category, item) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  previous_price = market_pricing.current_price,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  scraped_at = NOW();

COMMENT ON TABLE calculation_constants IS 'SSOT for all calculation constants - read by Meta Calculations page';
COMMENT ON TABLE industry_configs IS 'Industry-specific configuration for load and BESS calculations';
COMMENT ON TABLE market_pricing IS 'Market pricing data from scrapers - updated regularly';
