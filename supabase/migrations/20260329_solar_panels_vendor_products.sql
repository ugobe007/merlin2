-- ============================================================================
-- SOLAR PANELS IN VENDOR PRODUCTS
-- March 27, 2026
--
-- Extends vendor_products to support solar panel submissions:
--   1. Adds 'solar' to the product_category enum
--   2. Adds solar-panel-specific columns (watt_peak, efficiency, area, type,
--      country_of_origin, tariff_adder_pct)
--   3. Adds a computed column: effective_price_per_watt (base + tariff)
--   4. Adds a GIN index for fast panel selection queries
-- ============================================================================

-- 1. Extend the product_category enum
-- (Postgres requires adding to enum; safe on existing rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'solar'
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'product_category_enum'
      )
  ) THEN
    ALTER TYPE product_category_enum ADD VALUE 'solar';
  END IF;
EXCEPTION
  -- If the type is not an enum but a CHECK constraint, handle inline below
  WHEN undefined_object THEN NULL;
END $$;

-- Fallback: if product_category is a VARCHAR with a CHECK constraint,
-- update the constraint instead
DO $$
BEGIN
  -- Drop old check constraint if it exists
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
        'battery', 'inverter', 'ems', 'bos', 'container', 'solar'
      ));
  END IF;
END $$;

-- 2. Add solar-panel-specific columns (all nullable — non-solar products unaffected)
ALTER TABLE vendor_products
  ADD COLUMN IF NOT EXISTS watt_peak            INTEGER,        -- e.g. 400, 500, 580 (Wp DC STC)
  ADD COLUMN IF NOT EXISTS panel_efficiency_pct NUMERIC(5,2),   -- e.g. 22.5 (%)
  ADD COLUMN IF NOT EXISTS panel_area_sqft      NUMERIC(6,2),   -- e.g. 21.5 sq ft per panel
  ADD COLUMN IF NOT EXISTS panel_type           VARCHAR(40),    -- monocrystalline | bifacial | perc | topcon | thin-film
  ADD COLUMN IF NOT EXISTS country_of_origin    VARCHAR(60),    -- e.g. 'US', 'CN', 'MY', 'VN'
  ADD COLUMN IF NOT EXISTS tariff_adder_pct     NUMERIC(5,2) DEFAULT 0,  -- % tariff on top of base price (e.g. 25.0 for Section 301)
  ADD COLUMN IF NOT EXISTS temp_coeff_pct       NUMERIC(5,3),   -- Power temp coefficient (%/°C) — affects hot-climate yield
  ADD COLUMN IF NOT EXISTS degradation_pct_yr   NUMERIC(5,3) DEFAULT 0.5, -- Annual degradation (%) — default 0.5%/yr
  ADD COLUMN IF NOT EXISTS bifacial_gain_pct    NUMERIC(5,2),   -- Extra yield from bifacial (if applicable, e.g. 7.0)
  ADD COLUMN IF NOT EXISTS price_per_watt       NUMERIC(8,4);   -- $/Wp base equipment price (excl. tariff)

-- 3. Computed effective price per watt (base + tariff adder)
-- This is what Merlin uses in EQUIPMENT_UNIT_COSTS.solar.pricePerWatt
ALTER TABLE vendor_products
  ADD COLUMN IF NOT EXISTS effective_price_per_watt NUMERIC(8,4)
  GENERATED ALWAYS AS (
    CASE
      WHEN price_per_watt IS NOT NULL
      THEN price_per_watt * (1 + COALESCE(tariff_adder_pct, 0) / 100.0)
      ELSE NULL
    END
  ) STORED;

-- 4. Index for fast panel selection queries (product_category + status + watt_peak)
CREATE INDEX IF NOT EXISTS idx_vendor_products_solar_selection
  ON vendor_products (product_category, status, watt_peak DESC)
  WHERE product_category = 'solar' AND status = 'approved';

-- 5. Index for country_of_origin (tariff filtering)
CREATE INDEX IF NOT EXISTS idx_vendor_products_country_origin
  ON vendor_products (country_of_origin)
  WHERE product_category = 'solar';

-- 6. Seed reference data: three well-known approved panels as baseline
-- (These represent the "SSOT fallback" panel specs used until real vendors submit)
INSERT INTO vendor_products (
  vendor_id,
  product_category,
  manufacturer,
  model,
  watt_peak,
  panel_efficiency_pct,
  panel_area_sqft,
  panel_type,
  country_of_origin,
  tariff_adder_pct,
  temp_coeff_pct,
  degradation_pct_yr,
  price_per_watt,
  lead_time_weeks,
  warranty_years,
  minimum_order_quantity,
  certifications,
  status,
  currency
)
SELECT
  v.id,
  'solar',
  panels.manufacturer,
  panels.model,
  panels.watt_peak,
  panels.panel_efficiency_pct,
  panels.panel_area_sqft,
  panels.panel_type,
  panels.country_of_origin,
  panels.tariff_adder_pct,
  panels.temp_coeff_pct,
  panels.degradation_pct_yr,
  panels.price_per_watt,
  panels.lead_time_weeks,
  panels.warranty_years,
  panels.minimum_order_quantity,
  panels.certifications::text[],
  'approved',
  'USD'
FROM (
  VALUES
    -- Qcells Q.PEAK DUO BLK ML-G10+ 400W — US-assembled (Georgia), no Section 301
    ('Hanwha Qcells', 'Q.PEAK DUO BLK ML-G10+ 400', 400, 20.6::numeric, 21.5::numeric,
     'monocrystalline', 'US', 0.0::numeric, -0.34::numeric, 0.50::numeric, 0.38::numeric,
     6, 25, 1, ARRAY['UL 61730', 'IEC 61215', 'MCS']),
    -- REC Alpha Pure Black 430W — Norway brand, SG mfg, no Section 301
    ('REC Group', 'REC Alpha Pure Black 430', 430, 22.3::numeric, 21.0::numeric,
     'bifacial', 'SG', 0.0::numeric, -0.24::numeric, 0.25::numeric, 0.42::numeric,
     8, 25, 1, ARRAY['UL 61730', 'IEC 61215']),
    -- Maxeon 6 AC 500W — high efficiency, US/PH, no 301 tariff
    ('Maxeon Solar', 'Maxeon 6 AC 500', 500, 24.1::numeric, 22.5::numeric,
     'monocrystalline', 'PH', 0.0::numeric, -0.27::numeric, 0.20::numeric, 0.58::numeric,
     10, 40, 1, ARRAY['UL 61730', 'IEC 61215', 'CEC Listed'])
) AS panels(
  manufacturer, model, watt_peak, panel_efficiency_pct, panel_area_sqft,
  panel_type, country_of_origin, tariff_adder_pct, temp_coeff_pct, degradation_pct_yr,
  price_per_watt, lead_time_weeks, warranty_years, minimum_order_quantity, certifications
)
-- Use first approved vendor as owner (Merlin internal / placeholder)
CROSS JOIN (
  SELECT id FROM vendors WHERE status = 'approved' ORDER BY created_at LIMIT 1
) v
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN vendor_products.watt_peak IS
  'Panel rated power (Wp DC) at STC (1000 W/m², 25°C). Used in panel count and roof area calculations.';
COMMENT ON COLUMN vendor_products.panel_efficiency_pct IS
  'Module efficiency (%) at STC. Higher efficiency = fewer panels for same kW = lower roof area required.';
COMMENT ON COLUMN vendor_products.panel_area_sqft IS
  'Physical area per panel (sq ft). Used in getCarWashSolarCapacity() density formula instead of hardcoded 21.5 sq ft.';
COMMENT ON COLUMN vendor_products.tariff_adder_pct IS
  'Import tariff percent added on top of base price_per_watt. Section 301 CN panels: 25%. UFLPA risk may add more.';
COMMENT ON COLUMN vendor_products.effective_price_per_watt IS
  'Computed: price_per_watt × (1 + tariff_adder_pct/100). This is what Merlin uses in EQUIPMENT_UNIT_COSTS.solar.pricePerWatt.';
COMMENT ON COLUMN vendor_products.country_of_origin IS
  'ISO 3166-1 alpha-2 country code. CN = Section 301 tariff risk. Used for tariff surfacing on quote.';
