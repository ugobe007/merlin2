-- ============================================================================
-- SUB-INDUSTRIES MIGRATION
-- ============================================================================
-- Created: January 14, 2026
-- Purpose: Add sub-industry table for refined industry segmentation
--          Supports conversational wizard flow with sub-industry selection
-- 
-- This enables:
-- - More accurate load profile calculations based on business type
-- - Industry-specific backup requirements
-- - Typical size ranges for validation
-- - Better recommendations based on sub-segment
--
-- SSOT Compliant: These multipliers feed into TrueQuote calculations
-- ============================================================================

-- ============================================================================
-- CREATE SUB-INDUSTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sub_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent industry (references use_cases.slug)
  industry_slug TEXT NOT NULL,
  
  -- Sub-industry identification
  sub_industry_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji icon for UI
  
  -- Calculation multipliers (applied to base industry calculations)
  load_multiplier DECIMAL(4,2) DEFAULT 1.0,       -- Adjusts base load calculation
  backup_multiplier DECIMAL(4,2) DEFAULT 1.0,     -- Adjusts backup/resilience requirements
  solar_affinity DECIMAL(3,2) DEFAULT 1.0,        -- 0-2 scale, >1 = good solar candidate
  ev_affinity DECIMAL(3,2) DEFAULT 1.0,           -- 0-2 scale, >1 = good EV candidate
  
  -- Typical size ranges (for validation and questionnaire depth)
  typical_size_min INTEGER,  -- Minimum typical size for this sub-industry
  typical_size_max INTEGER,  -- Maximum typical size
  size_unit TEXT,            -- 'rooms', 'sqft', 'bays', 'chargers', etc.
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(industry_slug, sub_industry_slug)
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sub_industries_industry ON sub_industries(industry_slug);
CREATE INDEX IF NOT EXISTS idx_sub_industries_active ON sub_industries(is_active) WHERE is_active = true;

-- ============================================================================
-- HOTEL SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('hotel', 'economy', 'Economy / Budget', 'Budget-friendly hotels with basic amenities', '🏨', 0.70, 0.50, 0.8, 0.6, 30, 100, 'rooms', 1),
('hotel', 'midscale', 'Midscale', 'Standard hotels with moderate amenities', '🏨', 0.85, 0.70, 1.0, 0.8, 50, 150, 'rooms', 2),
('hotel', 'upscale', 'Upscale / Full-Service', 'Full-service hotels with restaurants, pools', '🏨', 1.00, 0.85, 1.1, 1.0, 100, 300, 'rooms', 3),
('hotel', 'luxury', 'Luxury Resort', 'High-end resorts with full amenities', '🏨', 1.40, 1.00, 1.2, 1.2, 150, 500, 'rooms', 4),
('hotel', 'casino_resort', 'Casino Resort', 'Casino hotels with 24/7 operations', '🎰', 1.80, 1.20, 0.9, 1.3, 300, 3000, 'rooms', 5),
('hotel', 'extended_stay', 'Extended Stay', 'Long-term stay hotels with kitchenettes', '🏠', 0.90, 0.60, 1.0, 0.7, 80, 200, 'rooms', 6),
('hotel', 'boutique', 'Boutique Hotel', 'Small unique properties with character', '✨', 1.10, 0.75, 1.1, 0.9, 20, 100, 'rooms', 7)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  solar_affinity = EXCLUDED.solar_affinity,
  ev_affinity = EXCLUDED.ev_affinity,
  typical_size_min = EXCLUDED.typical_size_min,
  typical_size_max = EXCLUDED.typical_size_max,
  size_unit = EXCLUDED.size_unit,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================================
-- CAR WASH SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('car_wash', 'self_service', 'Self-Service', 'Customer-operated bay washes', '🚿', 0.60, 0.40, 1.2, 0.5, 4, 12, 'bays', 1),
('car_wash', 'automatic', 'Automatic In-Bay', 'Automated single-bay machines', '🤖', 0.85, 0.60, 1.1, 0.7, 1, 4, 'bays', 2),
('car_wash', 'express_tunnel', 'Express Tunnel', 'Conveyor tunnel washes', '🚗', 1.00, 0.80, 1.0, 0.9, 1, 2, 'tunnels', 3),
('car_wash', 'full_service', 'Full-Service', 'Tunnel + interior cleaning', '✨', 1.20, 0.90, 1.0, 1.1, 1, 2, 'tunnels', 4),
('car_wash', 'flex_serve', 'Flex Serve / Hybrid', 'Multiple service levels', '🔄', 1.30, 0.85, 1.1, 1.0, 1, 3, 'tunnels', 5),
('car_wash', 'fleet_truck', 'Fleet / Truck Wash', 'Commercial vehicle washing', '🚛', 1.50, 1.00, 0.9, 0.8, 2, 6, 'bays', 6)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- EV CHARGING SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('ev_charging', 'destination', 'Destination Charging', 'Hotels, restaurants, shopping - L2 focus', '🅿️', 0.60, 0.40, 1.3, 1.5, 4, 20, 'chargers', 1),
('ev_charging', 'public_station', 'Public Charging Station', 'Stand-alone public charging', '⚡', 1.00, 0.70, 1.2, 1.8, 4, 24, 'chargers', 2),
('ev_charging', 'fleet_depot', 'Fleet Depot', 'Commercial fleet charging', '🚐', 1.40, 1.00, 1.0, 2.0, 10, 100, 'chargers', 3),
('ev_charging', 'highway_corridor', 'Highway Corridor', 'Interstate fast charging', '🛣️', 1.80, 0.90, 0.8, 2.0, 8, 40, 'chargers', 4),
('ev_charging', 'truck_charging', 'Heavy-Duty Truck Charging', 'Semi-truck / HD vehicle charging', '🚛', 2.50, 1.20, 0.7, 2.0, 4, 20, 'chargers', 5),
('ev_charging', 'residential_mdu', 'Residential Multi-Unit', 'Apartment/condo charging', '🏢', 0.50, 0.30, 1.4, 1.2, 10, 100, 'chargers', 6)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- DATA CENTER SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('data_center', 'enterprise', 'Enterprise Data Center', 'Corporate-owned facilities', '🏢', 1.00, 1.00, 0.9, 0.5, 5000, 50000, 'sqft', 1),
('data_center', 'colocation', 'Colocation Facility', 'Multi-tenant hosting', '🖥️', 1.10, 1.10, 0.8, 0.5, 10000, 200000, 'sqft', 2),
('data_center', 'hyperscale', 'Hyperscale', 'Cloud provider mega-facilities', '☁️', 1.50, 1.20, 1.2, 0.6, 100000, 1000000, 'sqft', 3),
('data_center', 'edge', 'Edge Data Center', 'Small distributed facilities', '📡', 0.70, 0.80, 1.0, 0.4, 500, 5000, 'sqft', 4),
('data_center', 'telecom', 'Telecom / Network', 'Carrier network facilities', '📶', 0.80, 1.00, 0.9, 0.4, 2000, 20000, 'sqft', 5)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- MANUFACTURING SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('manufacturing', 'light_assembly', 'Light Assembly', 'Electronics, consumer goods assembly', '🔧', 0.70, 0.60, 1.2, 0.8, 10000, 100000, 'sqft', 1),
('manufacturing', 'heavy_industrial', 'Heavy Industrial', 'Metal fabrication, machinery', '⚙️', 1.40, 1.00, 0.8, 0.6, 50000, 500000, 'sqft', 2),
('manufacturing', 'food_beverage', 'Food & Beverage', 'Food processing, bottling', '🍔', 1.20, 1.10, 1.0, 0.7, 20000, 200000, 'sqft', 3),
('manufacturing', 'pharmaceutical', 'Pharmaceutical', 'Drug manufacturing, clean rooms', '💊', 1.30, 1.20, 1.1, 0.6, 30000, 150000, 'sqft', 4),
('manufacturing', 'automotive', 'Automotive', 'Vehicle & parts manufacturing', '🚗', 1.50, 1.00, 0.9, 1.0, 100000, 1000000, 'sqft', 5),
('manufacturing', 'high_tech', 'High-Tech / Semiconductor', 'Chip fabs, precision manufacturing', '💻', 1.80, 1.30, 1.0, 0.7, 50000, 500000, 'sqft', 6)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- HOSPITAL SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('hospital', 'community', 'Community Hospital', 'General acute care, 25-200 beds', '🏥', 0.80, 0.90, 1.1, 0.8, 25, 200, 'beds', 1),
('hospital', 'regional_medical', 'Regional Medical Center', 'Larger facility, specialized services', '🏥', 1.00, 1.00, 1.0, 0.9, 150, 500, 'beds', 2),
('hospital', 'academic_medical', 'Academic Medical Center', 'Teaching hospital, research', '🎓', 1.30, 1.10, 1.0, 1.0, 300, 1500, 'beds', 3),
('hospital', 'specialty', 'Specialty Hospital', 'Cardiac, orthopedic, rehabilitation', '❤️', 0.90, 0.95, 1.1, 0.7, 50, 200, 'beds', 4),
('hospital', 'critical_access', 'Critical Access Hospital', 'Rural, 25 beds or fewer', '🚑', 0.60, 1.00, 1.2, 0.6, 10, 25, 'beds', 5),
('hospital', 'surgical_center', 'Ambulatory Surgical Center', 'Outpatient surgery only', '🔬', 0.50, 0.70, 1.2, 0.7, 0, 0, 'procedures', 6)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- RETAIL SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('retail', 'small_retail', 'Small Retail Store', 'Boutiques, specialty shops', '🛍️', 0.60, 0.40, 1.2, 0.6, 1000, 5000, 'sqft', 1),
('retail', 'big_box', 'Big Box Retailer', 'Large format stores', '🏬', 1.00, 0.70, 1.0, 1.0, 50000, 200000, 'sqft', 2),
('retail', 'grocery', 'Grocery / Supermarket', 'Refrigerated, high load', '🛒', 1.30, 1.00, 0.9, 0.9, 30000, 80000, 'sqft', 3),
('retail', 'convenience', 'Convenience Store', 'Small, 24/7 operations', '🏪', 0.50, 0.60, 1.1, 1.0, 2000, 5000, 'sqft', 4),
('retail', 'shopping_center', 'Shopping Center / Mall', 'Multi-tenant retail', '🏢', 1.20, 0.80, 1.1, 1.2, 100000, 1000000, 'sqft', 5)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- WAREHOUSE SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('warehouse', 'distribution', 'Distribution Center', 'High-throughput logistics', '📦', 1.00, 0.70, 1.1, 0.9, 100000, 1000000, 'sqft', 1),
('warehouse', 'cold_storage', 'Cold Storage / Refrigerated', 'Temperature-controlled', '❄️', 1.80, 1.20, 0.9, 0.6, 20000, 200000, 'sqft', 2),
('warehouse', 'ecommerce_fulfillment', 'E-Commerce Fulfillment', 'High automation, robotics', '🤖', 1.30, 0.90, 1.0, 0.8, 200000, 2000000, 'sqft', 3),
('warehouse', 'general_storage', 'General Storage', 'Basic warehouse, minimal HVAC', '🏭', 0.50, 0.40, 1.3, 0.5, 20000, 200000, 'sqft', 4),
('warehouse', 'last_mile', 'Last Mile / Delivery Hub', 'Urban distribution, EV fleets', '🚚', 0.80, 0.60, 1.0, 1.5, 20000, 100000, 'sqft', 5)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- OFFICE SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('office', 'small_office', 'Small Office', 'Professional services, 1-2 floors', '🏢', 0.70, 0.40, 1.2, 0.8, 5000, 20000, 'sqft', 1),
('office', 'mid_rise', 'Mid-Rise Office', 'Multi-tenant, 3-10 floors', '🏢', 1.00, 0.60, 1.0, 1.0, 50000, 200000, 'sqft', 2),
('office', 'high_rise', 'High-Rise Tower', 'Class A downtown towers', '🏙️', 1.20, 0.80, 0.8, 1.1, 200000, 1000000, 'sqft', 3),
('office', 'campus', 'Corporate Campus', 'Multi-building corporate HQ', '🏛️', 1.10, 0.70, 1.2, 1.2, 100000, 500000, 'sqft', 4),
('office', 'medical_office', 'Medical Office Building', 'Clinics, outpatient facilities', '⚕️', 0.90, 0.80, 1.1, 0.9, 10000, 100000, 'sqft', 5)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- RESTAURANT SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('restaurant', 'quick_service', 'Quick Service / Fast Food', 'High-volume, drive-thru', '🍔', 0.80, 0.50, 1.0, 0.8, 2000, 4000, 'sqft', 1),
('restaurant', 'fast_casual', 'Fast Casual', 'Counter service, fresh prep', '🥗', 0.90, 0.50, 1.1, 0.9, 2500, 5000, 'sqft', 2),
('restaurant', 'casual_dining', 'Casual Dining', 'Full service, family restaurants', '🍽️', 1.00, 0.60, 1.0, 0.9, 4000, 8000, 'sqft', 3),
('restaurant', 'fine_dining', 'Fine Dining', 'Upscale, full service', '🥂', 1.10, 0.70, 1.0, 1.0, 3000, 10000, 'sqft', 4),
('restaurant', 'bar_nightclub', 'Bar / Nightclub', 'Entertainment focus', '🍸', 1.20, 0.60, 0.8, 0.7, 2000, 15000, 'sqft', 5)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- COLLEGE SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('college', 'community_college', 'Community College', '2-year, commuter campus', '📚', 0.70, 0.50, 1.2, 0.9, 2000, 20000, 'students', 1),
('college', 'liberal_arts', 'Liberal Arts College', 'Small, residential', '🎓', 0.80, 0.60, 1.2, 1.0, 1000, 5000, 'students', 2),
('college', 'state_university', 'State University', 'Large public institution', '🏛️', 1.00, 0.80, 1.1, 1.1, 10000, 50000, 'students', 3),
('college', 'research_university', 'Research University', 'R1 institution, labs', '🔬', 1.30, 1.00, 1.0, 1.0, 15000, 60000, 'students', 4),
('college', 'vocational', 'Vocational / Trade School', 'Hands-on training', '🔧', 0.90, 0.60, 1.1, 0.8, 500, 5000, 'students', 5)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- TRUCK STOP SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('heavy_duty_truck_stop', 'basic_truck_stop', 'Basic Truck Stop', 'Fuel, parking, minimal services', '⛽', 0.70, 0.50, 1.1, 0.8, 20, 50, 'parking_spaces', 1),
('heavy_duty_truck_stop', 'travel_center', 'Travel Center', 'Full-service, restaurant, showers', '🛣️', 1.00, 0.70, 1.0, 1.0, 50, 150, 'parking_spaces', 2),
('heavy_duty_truck_stop', 'electrified_hub', 'Electrified Truck Hub', 'HD EV charging focus', '⚡', 1.80, 1.00, 1.0, 2.0, 20, 100, 'parking_spaces', 3),
('heavy_duty_truck_stop', 'distribution_yard', 'Distribution Yard', 'Fleet staging and charging', '🚛', 1.50, 0.90, 0.9, 1.8, 30, 200, 'parking_spaces', 4)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- AGRICULTURE SUB-INDUSTRIES
-- ============================================================================
INSERT INTO sub_industries (industry_slug, sub_industry_slug, name, description, icon, load_multiplier, backup_multiplier, solar_affinity, ev_affinity, typical_size_min, typical_size_max, size_unit, display_order) VALUES
('agriculture', 'row_crop', 'Row Crop Farm', 'Corn, soybeans, wheat', '🌾', 0.60, 0.40, 1.4, 0.5, 500, 10000, 'acres', 1),
('agriculture', 'dairy', 'Dairy Farm', 'Milking operations', '🐄', 1.00, 0.90, 1.2, 0.6, 100, 2000, 'cows', 2),
('agriculture', 'indoor_farm', 'Indoor / Vertical Farm', 'Controlled environment', '🥬', 1.80, 1.00, 0.8, 0.5, 10000, 200000, 'sqft', 3),
('agriculture', 'vineyard_winery', 'Vineyard / Winery', 'Grape growing + production', '🍇', 0.80, 0.60, 1.3, 0.7, 20, 500, 'acres', 4),
('agriculture', 'greenhouse', 'Greenhouse Operations', 'Climate-controlled growing', '🌱', 1.20, 0.70, 1.1, 0.5, 20000, 500000, 'sqft', 5),
('agriculture', 'cannabis', 'Cannabis Cultivation', 'Licensed grow operations', '🌿', 2.00, 1.10, 0.9, 0.5, 10000, 100000, 'sqft', 6)
ON CONFLICT (industry_slug, sub_industry_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  load_multiplier = EXCLUDED.load_multiplier,
  backup_multiplier = EXCLUDED.backup_multiplier,
  updated_at = NOW();

-- ============================================================================
-- CREATE UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_sub_industries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sub_industries_updated_at_trigger ON sub_industries;
CREATE TRIGGER sub_industries_updated_at_trigger
  BEFORE UPDATE ON sub_industries
  FOR EACH ROW
  EXECUTE FUNCTION update_sub_industries_updated_at();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  sub_industry_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sub_industry_count FROM sub_industries;
  RAISE NOTICE '✅ Created sub_industries table with % sub-industries', sub_industry_count;
END $$;
