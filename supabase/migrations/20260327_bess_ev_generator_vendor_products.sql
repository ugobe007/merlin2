-- ============================================================================
-- BESS, GENERATOR, AND EV CHARGER IN VENDOR PRODUCTS
-- March 27, 2026
--
-- Extends vendor_products to support:
--   1. BESS-specific columns (cycle_life, roundtrip_efficiency, DoD, C-rate)
--   2. 'generator' product category + generator-specific columns
--   3. 'ev_charger' product category + EV charger-specific columns
--   4. GIN indexes for fast selection queries
--   5. Seed reference data for BESS, generator, and EV chargers
--
-- DESIGN PRINCIPLE:
--   Same scoring/selection pattern as solar panels (solarPanelSelectionService.ts).
--   bessSelectionService.ts queries approved battery products, scores by $/kWh
--   lifetime-yield, and returns the best spec. Falls back to market data from
--   collected_market_prices (scraper), then to EQUIPMENT_UNIT_COSTS.bess.
--   Generator and EV charger services follow the same pattern.
-- ============================================================================

-- ============================================================================
-- 1. EXTEND product_category ENUM
-- ============================================================================
DO $$
BEGIN
  -- Add 'generator' if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'generator'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_category_enum')
  ) THEN
    ALTER TYPE product_category_enum ADD VALUE 'generator';
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  -- Add 'ev_charger' if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'ev_charger'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_category_enum')
  ) THEN
    ALTER TYPE product_category_enum ADD VALUE 'ev_charger';
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Fallback: if product_category uses a CHECK constraint instead of an enum type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'vendor_products'
      AND constraint_name = 'vendor_products_product_category_check'
  ) THEN
    ALTER TABLE vendor_products
      DROP CONSTRAINT vendor_products_product_category_check;

    ALTER TABLE vendor_products
      ADD CONSTRAINT vendor_products_product_category_check
      CHECK (product_category IN (
        'battery', 'inverter', 'ems', 'bos', 'container', 'solar',
        'generator', 'ev_charger'
      ));
  END IF;
END $$;

-- ============================================================================
-- 2. BESS-SPECIFIC COLUMNS
--    The base table already has: capacity_kwh, power_kw, chemistry,
--    price_per_kwh, price_per_kw, efficiency_percent, voltage_v.
--    We add the engineering specs needed for accurate system sizing and
--    the lifetime-yield scoring used by bessSelectionService.ts.
-- ============================================================================
ALTER TABLE vendor_products
  ADD COLUMN IF NOT EXISTS cycle_life                INTEGER,         -- Rated cycles to 80% SoH (e.g. 4000, 6000)
  ADD COLUMN IF NOT EXISTS roundtrip_efficiency_pct  NUMERIC(5,2),   -- AC-AC RTE (%) — e.g. 85.0, 88.5
  ADD COLUMN IF NOT EXISTS depth_of_discharge_pct    NUMERIC(5,2) DEFAULT 90,  -- Usable DoD (%) — typical LFP = 90%
  ADD COLUMN IF NOT EXISTS c_rate_continuous          NUMERIC(5,3),   -- Continuous C-rate (e.g. 0.5 for 2-hr, 0.25 for 4-hr)
  ADD COLUMN IF NOT EXISTS operating_temp_min_c       NUMERIC(5,1) DEFAULT -20, -- Min operating temp (°C)
  ADD COLUMN IF NOT EXISTS operating_temp_max_c       NUMERIC(5,1) DEFAULT 55,  -- Max operating temp (°C)
  ADD COLUMN IF NOT EXISTS energy_density_wh_per_l    NUMERIC(8,2),   -- Volumetric energy density (Wh/L) — container sizing
  ADD COLUMN IF NOT EXISTS annual_degradation_pct     NUMERIC(5,3) DEFAULT 2.5, -- Capacity fade (%/yr) — affects lifetime yield
  ADD COLUMN IF NOT EXISTS warranty_cycles            INTEGER,        -- Cycle warranty (separate from calendar warranty_years)
  ADD COLUMN IF NOT EXISTS container_footprint_sqft   NUMERIC(7,2),  -- Physical footprint per container (sq ft) — site planning
  ADD COLUMN IF NOT EXISTS fire_suppression_included  BOOLEAN DEFAULT TRUE; -- Integrated fire suppression system

-- Computed: effective $/kWh including any freight/import adder (nullable — only for battery)
ALTER TABLE vendor_products
  ADD COLUMN IF NOT EXISTS effective_price_per_kwh NUMERIC(10,4)
  GENERATED ALWAYS AS (
    CASE
      WHEN product_category = 'battery' AND price_per_kwh IS NOT NULL
      THEN price_per_kwh * (1 + COALESCE(tariff_adder_pct, 0) / 100.0)
      ELSE NULL
    END
  ) STORED;

-- ============================================================================
-- 3. GENERATOR-SPECIFIC COLUMNS
-- ============================================================================
ALTER TABLE vendor_products
  ADD COLUMN IF NOT EXISTS fuel_type               VARCHAR(40),    -- 'diesel' | 'natural_gas' | 'dual_fuel' | 'propane' | 'biogas'
  ADD COLUMN IF NOT EXISTS prime_rating_kw         NUMERIC(8,2),   -- Prime/continuous kW rating
  ADD COLUMN IF NOT EXISTS standby_rating_kw       NUMERIC(8,2),   -- Standby kW rating (higher, short-term)
  ADD COLUMN IF NOT EXISTS fuel_consumption_gph    NUMERIC(6,3),   -- Fuel consumption at 100% load (gal/hr diesel or scfm natural gas)
  ADD COLUMN IF NOT EXISTS emissions_tier          VARCHAR(20),    -- 'Tier 4 Final' | 'Tier 3' | 'EPA Tier 2' etc.
  ADD COLUMN IF NOT EXISTS enclosure_type          VARCHAR(40),    -- 'open' | 'sound-attenuated' | 'weather-protected'
  ADD COLUMN IF NOT EXISTS ats_included            BOOLEAN DEFAULT FALSE; -- Automatic transfer switch included

-- ============================================================================
-- 4. EV CHARGER-SPECIFIC COLUMNS
-- ============================================================================
ALTER TABLE vendor_products
  ADD COLUMN IF NOT EXISTS charger_level           VARCHAR(20),    -- 'L1' | 'L2' | 'DCFC' | 'HPC'
  ADD COLUMN IF NOT EXISTS output_kw_max           NUMERIC(8,2),   -- Max output (kW) per port
  ADD COLUMN IF NOT EXISTS connector_types         TEXT[],         -- ['J1772', 'CCS', 'CHAdeMO', 'NACS', 'Type2']
  ADD COLUMN IF NOT EXISTS simultaneous_charges    SMALLINT DEFAULT 1,  -- Number of simultaneous charging ports
  ADD COLUMN IF NOT EXISTS network_provider        VARCHAR(60),    -- 'ChargePoint' | 'OCPP Open' | 'Proprietary' etc.
  ADD COLUMN IF NOT EXISTS power_management        BOOLEAN DEFAULT FALSE, -- Dynamic load/power management capable
  ADD COLUMN IF NOT EXISTS charger_efficiency_pct  NUMERIC(5,2) DEFAULT 93; -- AC-DC charging efficiency (%) 

-- ============================================================================
-- 5. INDEXES FOR FAST SELECTION QUERIES
-- ============================================================================

-- BESS selection: category + status + capacity
CREATE INDEX IF NOT EXISTS idx_vendor_products_bess_selection
  ON vendor_products (product_category, status, capacity_kwh DESC)
  WHERE product_category = 'battery' AND status = 'approved';

-- Generator selection: category + status + standby kW
CREATE INDEX IF NOT EXISTS idx_vendor_products_generator_selection
  ON vendor_products (product_category, status, standby_rating_kw DESC)
  WHERE product_category = 'generator' AND status = 'approved';

-- EV charger selection: category + status + output kW
CREATE INDEX IF NOT EXISTS idx_vendor_products_ev_charger_selection
  ON vendor_products (product_category, status, output_kw_max DESC)
  WHERE product_category = 'ev_charger' AND status = 'approved';

-- ============================================================================
-- 6. SEED BESS REFERENCE DATA
--    Sources: NREL ATB 2024/2025, BNEF Q1 2026, vendor published list prices.
--    All prices are equipment-only (excl. PCS/inverter, installation, site work).
--    PCS pricing is separate (price_per_kw column, maps to BESS.pricePerKW).
-- ============================================================================
INSERT INTO vendor_products (
  vendor_id,
  product_category,
  manufacturer,
  model,
  capacity_kwh,
  power_kw,
  chemistry,
  voltage_v,
  price_per_kwh,
  price_per_kw,
  roundtrip_efficiency_pct,
  depth_of_discharge_pct,
  cycle_life,
  c_rate_continuous,
  annual_degradation_pct,
  warranty_cycles,
  warranty_years,
  lead_time_weeks,
  minimum_order_quantity,
  certifications,
  status,
  currency
)
SELECT
  v.id,
  'battery',
  b.manufacturer,
  b.model,
  b.capacity_kwh,
  b.power_kw,
  b.chemistry,
  b.voltage_v,
  b.price_per_kwh,
  b.price_per_kw,
  b.roundtrip_efficiency_pct,
  b.depth_of_discharge_pct,
  b.cycle_life,
  b.c_rate_continuous,
  b.annual_degradation_pct,
  b.warranty_cycles,
  b.warranty_years,
  b.lead_time_weeks,
  b.minimum_order_quantity,
  b.certifications::text[],
  'approved',
  'USD'
FROM (
  VALUES
    -- ── Fluence Gridstack C&I (250 kWh, 62.5 kW — 4-hr, LFP, US-available)
    -- Price: ~$320/kWh pack, $140/kW PCS. BNEF Q1 2026 C&I benchmark.
    ('Fluence', 'Gridstack C&I 250', 250.0::numeric, 62.5::numeric,
     'LFP', 800::numeric, 320.0::numeric, 140.0::numeric,
     88.0::numeric, 90.0::numeric, 5000, 0.250::numeric,
     2.0::numeric, 5000, 10, 16, 1,
     ARRAY['UL 9540', 'UL 1973', 'IEC 62619', 'NFPA 855', 'NEC Article 706']),

    -- ── BYD Battery-Box Premium HV MC Cube (215 kWh, 53.75 kW — 4-hr, LFP)
    -- Price: ~$290/kWh pack, $135/kW PCS. BYD published 2025 C&I list.
    ('BYD', 'Battery-Box Premium HV MC Cube 215', 215.0::numeric, 53.75::numeric,
     'LFP', 614::numeric, 290.0::numeric, 135.0::numeric,
     87.5::numeric, 90.0::numeric, 6000, 0.250::numeric,
     1.8::numeric, 6000, 10, 20, 1,
     ARRAY['UL 9540', 'UL 1973', 'IEC 62619', 'CE']),

    -- ── Samsung SDI E3-H48148 (480 kWh, 120 kW — 4-hr, NMC, premium efficiency)
    -- Price: ~$355/kWh pack, $155/kW PCS. Samsung SDI published 2025.
    ('Samsung SDI', 'E3-H48148 480', 480.0::numeric, 120.0::numeric,
     'NMC', 1500::numeric, 355.0::numeric, 155.0::numeric,
     90.0::numeric, 90.0::numeric, 4000, 0.250::numeric,
     2.5::numeric, 4000, 10, 20, 1,
     ARRAY['UL 9540', 'UL 1973', 'IEC 62619', 'UL 9540A', 'CE']),

    -- ── Powin Stack 250 (250 kWh, 62.5 kW — 4-hr, LFP, US-assembled)
    -- Price: ~$340/kWh pack, $145/kW PCS. Powin published 2025.
    ('Powin', 'Stack 250', 250.0::numeric, 62.5::numeric,
     'LFP', 800::numeric, 340.0::numeric, 145.0::numeric,
     88.0::numeric, 90.0::numeric, 5000, 0.250::numeric,
     2.0::numeric, 5000, 10, 18, 1,
     ARRAY['UL 9540', 'UL 1973', 'IEC 62619', 'NFPA 855'])

) AS b(
  manufacturer, model, capacity_kwh, power_kw, chemistry, voltage_v,
  price_per_kwh, price_per_kw, roundtrip_efficiency_pct, depth_of_discharge_pct,
  cycle_life, c_rate_continuous, annual_degradation_pct, warranty_cycles,
  warranty_years, lead_time_weeks, minimum_order_quantity, certifications
)
CROSS JOIN (
  SELECT id FROM vendors WHERE status = 'approved' ORDER BY created_at LIMIT 1
) v
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. SEED GENERATOR REFERENCE DATA
--    Sources: Caterpillar, Cummins published 2025 list prices.
--    price_per_kw is the genset-only price (excl. ATS, fuel tank, pad).
--    ATS and fuel tank are separate line items in pricingServiceV45.ts.
-- ============================================================================
INSERT INTO vendor_products (
  vendor_id,
  product_category,
  manufacturer,
  model,
  standby_rating_kw,
  prime_rating_kw,
  fuel_type,
  fuel_consumption_gph,
  emissions_tier,
  enclosure_type,
  ats_included,
  price_per_kw,
  warranty_years,
  lead_time_weeks,
  minimum_order_quantity,
  certifications,
  status,
  currency
)
SELECT
  v.id,
  'generator',
  g.manufacturer,
  g.model,
  g.standby_rating_kw,
  g.prime_rating_kw,
  g.fuel_type,
  g.fuel_consumption_gph,
  g.emissions_tier,
  g.enclosure_type,
  g.ats_included::boolean,
  g.price_per_kw,
  g.warranty_years,
  g.lead_time_weeks,
  g.minimum_order_quantity,
  g.certifications::text[],
  'approved',
  'USD'
FROM (
  VALUES
    -- Caterpillar XQ250 — 250 kW diesel, Tier 4 Final, SA enclosure
    ('Caterpillar', 'XQ250', 250.0::numeric, 225.0::numeric,
     'diesel', 17.3::numeric, 'Tier 4 Final', 'sound-attenuated', 'false',
     680.0::numeric, 2, 12, 1, ARRAY['EPA Tier 4', 'UL 2200', 'NFPA 110']),
    -- Cummins QSX15G9 — 400 kW diesel, Tier 4 Final
    ('Cummins', 'QSX15G9 400kW', 400.0::numeric, 360.0::numeric,
     'diesel', 26.5::numeric, 'Tier 4 Final', 'sound-attenuated', 'false',
     660.0::numeric, 2, 14, 1, ARRAY['EPA Tier 4', 'UL 2200', 'NFPA 110']),
    -- Kohler 150RCZB — 150 kW natural gas
    ('Kohler', '150RCZB 150kW NG', 150.0::numeric, 135.0::numeric,
     'natural_gas', 2970.0::numeric, 'Tier 3', 'sound-attenuated', 'false',
     490.0::numeric, 2, 10, 1, ARRAY['UL 2200', 'NFPA 110', 'CSA']),
    -- MTU 12V1600 DS800 — 800 kW diesel, large C&I
    ('MTU / Rolls-Royce', '12V1600 DS800', 800.0::numeric, 720.0::numeric,
     'diesel', 55.0::numeric, 'Tier 4 Final', 'open', 'false',
     640.0::numeric, 2, 20, 1, ARRAY['EPA Tier 4', 'UL 2200'])
) AS g(
  manufacturer, model, standby_rating_kw, prime_rating_kw, fuel_type,
  fuel_consumption_gph, emissions_tier, enclosure_type, ats_included,
  price_per_kw, warranty_years, lead_time_weeks, minimum_order_quantity,
  certifications
)
CROSS JOIN (
  SELECT id FROM vendors WHERE status = 'approved' ORDER BY created_at LIMIT 1
) v
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. SEED EV CHARGER REFERENCE DATA
--    Sources: DOE Alternative Fuels Data Center, ChargePoint/ABB/Tritium 2025.
--    price_per_kw not used for EV chargers — unit cost is in power_kw / unit.
--    output_kw_max is the max output per port. power_kw = total output.
-- ============================================================================
INSERT INTO vendor_products (
  vendor_id,
  product_category,
  manufacturer,
  model,
  charger_level,
  output_kw_max,
  power_kw,
  simultaneous_charges,
  connector_types,
  network_provider,
  power_management,
  charger_efficiency_pct,
  price_per_kw,
  warranty_years,
  lead_time_weeks,
  minimum_order_quantity,
  certifications,
  status,
  currency
)
SELECT
  v.id,
  'ev_charger',
  e.manufacturer,
  e.model,
  e.charger_level,
  e.output_kw_max,
  e.power_kw,
  e.simultaneous_charges::smallint,
  e.connector_types::text[],
  e.network_provider,
  e.power_management::boolean,
  e.charger_efficiency_pct,
  e.price_per_kw,
  e.warranty_years,
  e.lead_time_weeks,
  e.minimum_order_quantity,
  e.certifications::text[],
  'approved',
  'USD'
FROM (
  VALUES
    -- ChargePoint CT4000 — dual-port L2, 7.2 kW/port
    ('ChargePoint', 'CT4000 Dual L2', 'L2', 7.2::numeric, 14.4::numeric, 2,
     ARRAY['J1772'], 'ChargePoint', 'true', 93.0::numeric, 486.0::numeric, 3, 4, 1,
     ARRAY['UL 2594', 'ENERGY STAR', 'FCC Part 15', 'UL 62368']),
    -- ABB Terra 54 — 50 kW DCFC, CCS + CHAdeMO
    ('ABB', 'Terra 54 DCFC', 'DCFC', 50.0::numeric, 50.0::numeric, 1,
     ARRAY['CCS', 'CHAdeMO'], 'OCPP 1.6', 'false', 94.5::numeric, 1000.0::numeric, 3, 6, 1,
     ARRAY['UL 2202', 'UL 2594', 'IEC 61851-23', 'SAE J1772']),
    -- Tritium RTM75 — 75 kW DCFC, CCS + NACS
    ('Tritium', 'RTM75 DCFC', 'DCFC', 75.0::numeric, 75.0::numeric, 1,
     ARRAY['CCS', 'NACS'], 'OCPP 2.0', 'false', 95.0::numeric, 680.0::numeric, 3, 6, 1,
     ARRAY['UL 2202', 'UL 2594', 'IEC 61851-23', 'FCC Part 15']),
    -- BTC Power 180 — 180 kW HPC, CCS + NACS (dual port, 90 kW each)
    ('BTC Power', '180kW HPC Dual', 'HPC', 90.0::numeric, 180.0::numeric, 2,
     ARRAY['CCS', 'NACS'], 'OCPP 2.0.1', 'true', 95.5::numeric, 833.0::numeric, 3, 8, 1,
     ARRAY['UL 2202', 'UL 2594', 'IEC 61851-23', 'NFPA 70']),
    -- Autel MaxiCharger DC HW 320 kW — HPC, up to 320 kW, CCS + NACS
    ('Autel', 'MaxiCharger DC HW 320', 'HPC', 160.0::numeric, 320.0::numeric, 2,
     ARRAY['CCS', 'NACS', 'CHAdeMO'], 'OCPP 2.0', 'true', 95.5::numeric, 469.0::numeric, 3, 8, 1,
     ARRAY['UL 2202', 'UL 2594', 'CE', 'FCC Part 15'])
) AS e(
  manufacturer, model, charger_level, output_kw_max, power_kw, simultaneous_charges,
  connector_types, network_provider, power_management, charger_efficiency_pct,
  price_per_kw, warranty_years, lead_time_weeks, minimum_order_quantity, certifications
)
CROSS JOIN (
  SELECT id FROM vendors WHERE status = 'approved' ORDER BY created_at LIMIT 1
) v
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. COLUMN COMMENTS
-- ============================================================================
COMMENT ON COLUMN vendor_products.cycle_life IS
  'Rated cycle life to 80% State of Health (SoH). LFP: 4000-6000, NMC: 3000-4000.
   Used in bessSelectionService lifetime-yield scoring ($/lifetime-kWh).';
COMMENT ON COLUMN vendor_products.roundtrip_efficiency_pct IS
  'AC-AC round-trip efficiency (%). LFP: 85-90, NMC: 88-92.
   Affects effective storage value and savings projections.';
COMMENT ON COLUMN vendor_products.depth_of_discharge_pct IS
  'Usable depth of discharge (%). LFP: 90, NMC: 85-90.
   Effective capacity = capacity_kwh × depth_of_discharge_pct / 100.';
COMMENT ON COLUMN vendor_products.c_rate_continuous IS
  'Continuous C-rate (power/capacity). 0.25C = 4-hr discharge, 0.5C = 2-hr.
   Used to verify bessKW = bessKWh × c_rate_continuous for system sizing.';
COMMENT ON COLUMN vendor_products.effective_price_per_kwh IS
  'Computed: price_per_kwh × (1 + tariff_adder_pct/100). BESS only.
   This is what bessSelectionService uses instead of EQUIPMENT_UNIT_COSTS.bess.pricePerKWh.';
COMMENT ON COLUMN vendor_products.fuel_type IS
  'Generator fuel: diesel | natural_gas | dual_fuel | propane | biogas.
   Drives price_per_kw selection and fuel tank cost in pricingServiceV45.';
COMMENT ON COLUMN vendor_products.standby_rating_kw IS
  'Generator standby (peak, short-term) kW. Used for backup sizing.
   prime_rating_kw is the continuous/base load rating.';
COMMENT ON COLUMN vendor_products.charger_level IS
  'EV charger tier: L1 (1.4 kW) | L2 (7.2 kW) | DCFC (50-150 kW) | HPC (150-400 kW).
   Maps to EQUIPMENT_UNIT_COSTS.evCharging level2 / dcfc / hpc pricing.';
COMMENT ON COLUMN vendor_products.output_kw_max IS
  'Maximum output per charging port (kW). For multi-port units, power_kw = output_kw_max × simultaneous_charges.';
