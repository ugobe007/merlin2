-- ============================================================================
-- GREAT POWER SPEC SYNC
-- April 9, 2026
--
-- Replaces the two generic placeholder Great Power entries (GP-BESS-200 and
-- GP-BESS-500) added in 20260328_trusted_bess_partners.sql with the two real
-- product lines from published spec sheets:
--
--   1. MAGNA-UTL Energy Storage Cabinet  (52–418 kWh, 8 SKUs)
--      Indoor / outdoor C&I cabinet, liquid-cooled.
--      Market segment: UNDER 2 MW — 52 kW (single UTL-52) up to 2 MW (multi-cluster).
--      Target: car wash, hotel, retail, light industrial.
--      UTL-209 (209 kWh) ← right-sized for WOW Car Wash 198 kWh load.
--
--   2. Ultra MAX 5000 Energy Storage Container  (2,508–5,016 kWh, 7 SKUs)
--      Containerized solution for large C&I / utility-adjacent sites.
--      MAX-2508-LV (low-voltage, 2,508 kWh) ← right-sized for campus / MV.
--
-- SPEC SOURCES:
--   Great Power MAGNA-UTL ESS Cabinet datasheet (2025)
--   Great Power Ultra MAX 5000 ESS Container datasheet (2025)
--
-- CORRECTIONS vs. 20260328 seed:
--   cycle_life       6,000  →  10,000   (spec sheet: 10,000 cycles @ 0.5C/25°C)
--   warranty_years      10  →      20   (spec sheet: 20 years or 10,000 cycles)
--   roundtrip_eff    88.5%  →   96.0%   (MAGNA-UTL AC-AC), 93.5% (Ultra MAX)
--   model names    generic  →  real SKU names
-- ============================================================================

-- ============================================================================
-- STEP 1: Remove stale placeholder entries
-- ============================================================================
DELETE FROM vendor_products
WHERE manufacturer = 'Great Power'
  AND model IN ('GP-BESS-200', 'GP-BESS-500')
  AND product_category = 'battery';

-- ============================================================================
-- STEP 2: Insert MAGNA-UTL cabinet SKUs (52–418 kWh)
-- ============================================================================
--
-- Specs (all 8 SKUs share the same per-cabinet cell stack):
--   Chemistry:          LFP, 320 Ah cells
--   RTE (AC-AC):        96%
--   DoD:                90%
--   Cycle life:         10,000 @ 0.5C, 25°C, to 80% SoH
--   Warranty:           20 years or 10,000 cycles, whichever first
--   C-rate (cont.):     0.5C (2-hr discharge)
--   Operating temp:     -35°C to 55°C (integrated liquid cooling + heating)
--   Enclosure:          NEMA 3R / IP55
--   Scaling:            Up to 15 cabinets in parallel per cluster (≤6.4 MWh)
--   Thermal mgmt:       LiqPACK liquid cooling/heating
--   Safety:             NFPA 855 deflation plate, LiqPACK thermal runaway
--   Comms:              Modbus TCP / Modbus RTU
--   Certifications:     UL 1973, UL 9540A, UL 9540, UL 60730, UL 61000,
--                       IEC/EN 62619, IEC/EN 62477, IEC/EN 61000, NFPA 855/68
--   Lead time:          18 weeks (ocean freight + US customs)
--   Pricing:            $115/kWh pack (Great Power direct partner tier),
--                       $125/kW PCS (liquid-cooled, higher efficiency premium)

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
    -- UTL-52  (1 cabinet,  52 kWh,  26 kW)
    ('Great Power', 'MAGNA-UTL UTL-52',   52.0::numeric,  26.0::numeric,
     'LFP', 51.2::numeric, 115.0::numeric, 125.0::numeric,
     96.0::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 18, 1,
     ARRAY['UL 1973', 'UL 9540A', 'UL 9540', 'UL 60730', 'IEC 62619', 'IEC 62477', 'NFPA 855', 'NFPA 68']),

    -- UTL-104  (2 cabinets, 104 kWh,  52 kW)
    ('Great Power', 'MAGNA-UTL UTL-104',  104.0::numeric,  52.0::numeric,
     'LFP', 51.2::numeric, 115.0::numeric, 125.0::numeric,
     96.0::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 18, 1,
     ARRAY['UL 1973', 'UL 9540A', 'UL 9540', 'UL 60730', 'IEC 62619', 'IEC 62477', 'NFPA 855', 'NFPA 68']),

    -- UTL-157  (3 cabinets, 157 kWh,  78 kW)
    ('Great Power', 'MAGNA-UTL UTL-157',  157.0::numeric,  78.5::numeric,
     'LFP', 51.2::numeric, 115.0::numeric, 125.0::numeric,
     96.0::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 18, 1,
     ARRAY['UL 1973', 'UL 9540A', 'UL 9540', 'UL 60730', 'IEC 62619', 'IEC 62477', 'NFPA 855', 'NFPA 68']),

    -- UTL-209  (4 cabinets, 209 kWh, 104 kW) ← WOW Car Wash target
    ('Great Power', 'MAGNA-UTL UTL-209',  209.0::numeric, 104.5::numeric,
     'LFP', 51.2::numeric, 115.0::numeric, 125.0::numeric,
     96.0::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 18, 1,
     ARRAY['UL 1973', 'UL 9540A', 'UL 9540', 'UL 60730', 'IEC 62619', 'IEC 62477', 'NFPA 855', 'NFPA 68']),

    -- UTL-261  (5 cabinets, 261 kWh, 130 kW)
    ('Great Power', 'MAGNA-UTL UTL-261',  261.0::numeric, 130.5::numeric,
     'LFP', 51.2::numeric, 115.0::numeric, 125.0::numeric,
     96.0::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 18, 1,
     ARRAY['UL 1973', 'UL 9540A', 'UL 9540', 'UL 60730', 'IEC 62619', 'IEC 62477', 'NFPA 855', 'NFPA 68']),

    -- UTL-313  (6 cabinets, 313 kWh, 156 kW)
    ('Great Power', 'MAGNA-UTL UTL-313',  313.0::numeric, 156.5::numeric,
     'LFP', 51.2::numeric, 115.0::numeric, 125.0::numeric,
     96.0::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 18, 1,
     ARRAY['UL 1973', 'UL 9540A', 'UL 9540', 'UL 60730', 'IEC 62619', 'IEC 62477', 'NFPA 855', 'NFPA 68']),

    -- UTL-366  (7 cabinets, 366 kWh, 183 kW)
    ('Great Power', 'MAGNA-UTL UTL-366',  366.0::numeric, 183.0::numeric,
     'LFP', 51.2::numeric, 115.0::numeric, 125.0::numeric,
     96.0::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 18, 1,
     ARRAY['UL 1973', 'UL 9540A', 'UL 9540', 'UL 60730', 'IEC 62619', 'IEC 62477', 'NFPA 855', 'NFPA 68']),

    -- UTL-418  (8 cabinets, 418 kWh, 209 kW) — single-cluster max
    ('Great Power', 'MAGNA-UTL UTL-418',  418.0::numeric, 209.0::numeric,
     'LFP', 51.2::numeric, 115.0::numeric, 125.0::numeric,
     96.0::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 18, 1,
     ARRAY['UL 1973', 'UL 9540A', 'UL 9540', 'UL 60730', 'IEC 62619', 'IEC 62477', 'NFPA 855', 'NFPA 68'])

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
-- STEP 3: Insert Ultra MAX 5000 container SKUs (2,508–5,016 kWh)
-- ============================================================================
--
-- Specs (all 7 SKUs):
--   Chemistry:          LFP, 314 Ah cells
--   RTE (AC-AC):        93.5%
--   DoD:                90%
--   Cycle life:         10,000 @ 0.5C, 25°C, to 80% SoH
--   Warranty:           20 years or 10,000 cycles, whichever first
--   C-rate (cont.):     0.5C (2-hr discharge)
--   Operating temp:     -30°C to 55°C
--   Enclosure:          IP55
--   Noise:              ≤80 dB
--   Altitude:           ≤4,000 m
--   Comms:              Modbus TCP + Modbus RTU
--   Certifications:     UL 9540, UL 1973, UL 9540A, IEC 62619,
--                       IEC 62933, NFPA 855/68/69/70E, CE
--   Lead time:          20 weeks (ocean freight + US customs, large container)
--   Pricing:            $105/kWh pack (utility-adjacent volume tier),
--                       $115/kW PCS

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
    -- MAX-2508-LV  (low-voltage variant, 2,508 kWh,  627 kW)
    ('Great Power', 'Ultra MAX 5000 MAX-2508-LV',  2508.0::numeric,  627.0::numeric,
     'LFP', 819.2::numeric, 105.0::numeric, 115.0::numeric,
     93.5::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 20, 1,
     ARRAY['UL 9540', 'UL 1973', 'UL 9540A', 'IEC 62619', 'IEC 62933', 'NFPA 855', 'NFPA 68', 'NFPA 69', 'NFPA 70E', 'CE']),

    -- MAX-2508  (standard, 2,508 kWh,  627 kW)
    ('Great Power', 'Ultra MAX 5000 MAX-2508',     2508.0::numeric,  627.0::numeric,
     'LFP', 1228.8::numeric, 105.0::numeric, 115.0::numeric,
     93.5::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 20, 1,
     ARRAY['UL 9540', 'UL 1973', 'UL 9540A', 'IEC 62619', 'IEC 62933', 'NFPA 855', 'NFPA 68', 'NFPA 69', 'NFPA 70E', 'CE']),

    -- MAX-3344  (3,344 kWh,  836 kW)
    ('Great Power', 'Ultra MAX 5000 MAX-3344',     3344.0::numeric,  836.0::numeric,
     'LFP', 1228.8::numeric, 105.0::numeric, 115.0::numeric,
     93.5::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 20, 1,
     ARRAY['UL 9540', 'UL 1973', 'UL 9540A', 'IEC 62619', 'IEC 62933', 'NFPA 855', 'NFPA 68', 'NFPA 69', 'NFPA 70E', 'CE']),

    -- MAX-3762  (3,762 kWh,  940 kW)
    ('Great Power', 'Ultra MAX 5000 MAX-3762',     3762.0::numeric,  940.5::numeric,
     'LFP', 1228.8::numeric, 105.0::numeric, 115.0::numeric,
     93.5::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 20, 1,
     ARRAY['UL 9540', 'UL 1973', 'UL 9540A', 'IEC 62619', 'IEC 62933', 'NFPA 855', 'NFPA 68', 'NFPA 69', 'NFPA 70E', 'CE']),

    -- MAX-4180  (4,180 kWh, 1,045 kW)
    ('Great Power', 'Ultra MAX 5000 MAX-4180',     4180.0::numeric, 1045.0::numeric,
     'LFP', 1228.8::numeric, 105.0::numeric, 115.0::numeric,
     93.5::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 20, 1,
     ARRAY['UL 9540', 'UL 1973', 'UL 9540A', 'IEC 62619', 'IEC 62933', 'NFPA 855', 'NFPA 68', 'NFPA 69', 'NFPA 70E', 'CE']),

    -- MAX-4598  (4,598 kWh, 1,149 kW)
    ('Great Power', 'Ultra MAX 5000 MAX-4598',     4598.0::numeric, 1149.5::numeric,
     'LFP', 1228.8::numeric, 105.0::numeric, 115.0::numeric,
     93.5::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 20, 1,
     ARRAY['UL 9540', 'UL 1973', 'UL 9540A', 'IEC 62619', 'IEC 62933', 'NFPA 855', 'NFPA 68', 'NFPA 69', 'NFPA 70E', 'CE']),

    -- MAX-5016  (5,016 kWh, 1,254 kW) — full-size max
    ('Great Power', 'Ultra MAX 5000 MAX-5016',     5016.0::numeric, 1254.0::numeric,
     'LFP', 1228.8::numeric, 105.0::numeric, 115.0::numeric,
     93.5::numeric, 90.0::numeric, 10000, 0.500::numeric,
     1.5::numeric, 10000, 20, 20, 1,
     ARRAY['UL 9540', 'UL 1973', 'UL 9540A', 'IEC 62619', 'IEC 62933', 'NFPA 855', 'NFPA 68', 'NFPA 69', 'NFPA 70E', 'CE'])

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
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  r RECORD;
  total_gp INT;
BEGIN
  SELECT COUNT(*) INTO total_gp
  FROM vendor_products
  WHERE manufacturer = 'Great Power'
    AND product_category = 'battery'
    AND status = 'approved';

  RAISE NOTICE '--- Great Power vendor_products after sync ---';
  RAISE NOTICE 'Total approved Great Power battery products: %', total_gp;

  FOR r IN
    SELECT model, capacity_kwh, power_kw, roundtrip_efficiency_pct,
           cycle_life, warranty_years, price_per_kwh
    FROM vendor_products
    WHERE manufacturer = 'Great Power'
      AND product_category = 'battery'
      AND status = 'approved'
    ORDER BY capacity_kwh
  LOOP
    RAISE NOTICE '  %-35s  %6.0f kWh  %7.1f kW  RTE %.0f%%  %d cy  %d yr  $%.0f/kWh',
      r.model, r.capacity_kwh, r.power_kw, r.roundtrip_efficiency_pct,
      r.cycle_life, r.warranty_years, r.price_per_kwh;
  END LOOP;

  -- Confirm stale placeholders are gone
  IF EXISTS (
    SELECT 1 FROM vendor_products
    WHERE manufacturer = 'Great Power'
      AND model IN ('GP-BESS-200', 'GP-BESS-500')
  ) THEN
    RAISE WARNING 'WARN: stale GP-BESS-200 / GP-BESS-500 entries still present — DELETE may have failed';
  ELSE
    RAISE NOTICE 'OK: stale GP-BESS-200 / GP-BESS-500 removed';
  END IF;
END $$;
