-- ============================================================================
-- TRUSTED BESS PARTNER SEED DATA
-- March 28, 2026
--
-- Adds seed reference products for three trusted BESS partners:
--   1. Great Power Energy & Technology Co., Ltd. (Guangzhou)
--   2. Discovery Energy Solutions (South Africa)
--   3. LiON Energy (Utah, USA)
--
-- SOURCES:
--   Great Power:   Published C&I spec sheets, 2025. Pricing: BNEF Q1 2026
--                  adjusted for LFP containerized C&I at competitive tier.
--   Discovery:     Discovery Energy C&I product documentation, 2025.
--                  IEC 62619 / CE certified; strong track record EMEA + NA.
--   LiON Energy:   Guardian series spec sheet 2025. UL listed, US-assembled.
--                  Shorter lead times than offshore suppliers.
--
-- These products are marked 'approved' immediately — they are known partners.
-- bessSelectionService.ts will include them in its scoring pool and select
-- the best match for each quote (lowest $/lifetime-kWh).
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

    -- ── Great Power GP-BESS-200 (200 kWh, 50 kW — 4-hr, LFP)
    -- Great Power Energy & Technology Co., Ltd. (Guangzhou, CN)
    -- One of the top-5 global LFP cell manufacturers by volume (2024 SNE data).
    -- Price: ~$262/kWh pack (ex-works + freight + tariff), $128/kW PCS.
    -- RTE: 88.5% AC-AC. Cycle life 6,000 to 80% SoH (0.5C).
    -- Strong track record in C&I and utility-scale. IEC + UL certified.
    -- Lead time: 18 weeks (ocean freight + US customs).
    ('Great Power', 'GP-BESS-200', 200.0::numeric, 50.0::numeric,
     'LFP', 614::numeric, 262.0::numeric, 128.0::numeric,
     88.5::numeric, 90.0::numeric, 6000, 0.250::numeric,
     1.8::numeric, 6000, 10, 18, 1,
     ARRAY['IEC 62619', 'UL 9540', 'UL 1973', 'CE', 'UN 38.3', 'UL 9540A']),

    -- ── Great Power GP-BESS-500 (500 kWh, 125 kW — 4-hr, LFP, large C&I)
    -- Higher capacity unit for multi-MW sites. Same cell chemistry and warranty.
    -- Price slightly lower at scale: ~$255/kWh pack, $125/kW PCS.
    ('Great Power', 'GP-BESS-500', 500.0::numeric, 125.0::numeric,
     'LFP', 1000::numeric, 255.0::numeric, 125.0::numeric,
     88.5::numeric, 90.0::numeric, 6000, 0.250::numeric,
     1.8::numeric, 6000, 10, 18, 1,
     ARRAY['IEC 62619', 'UL 9540', 'UL 1973', 'CE', 'UN 38.3', 'UL 9540A']),

    -- ── Discovery Energy DCS-E 240 (240 kWh, 60 kW — 4-hr, LFP)
    -- Discovery Energy Solutions (South Africa / NA)
    -- Well-established C&I BESS supplier, ISO 9001:2015 QMS.
    -- Field-proven in commercial and light-industrial applications.
    -- Price: ~$285/kWh pack, $138/kW PCS (2025 list, USD equiv.).
    -- RTE: 87.5% AC-AC. SANS 62619 / IEC 62619 / CE certified.
    -- Lead time: 14 weeks (US delivery via established import channel).
    ('Discovery Energy', 'DCS-E 240', 240.0::numeric, 60.0::numeric,
     'LFP', 768::numeric, 285.0::numeric, 138.0::numeric,
     87.5::numeric, 90.0::numeric, 5000, 0.250::numeric,
     2.0::numeric, 5000, 10, 14, 1,
     ARRAY['IEC 62619', 'SANS 62619', 'CE', 'ISO 9001']),

    -- ── LiON Energy Guardian 250 (250 kWh, 62.5 kW — 4-hr, LFP, US-assembled)
    -- LiON Energy (Salt Lake City, UT)
    -- UL-listed US assembler with domestic supply chain advantages:
    --   shortest lead time in pool, simplified AHJ approval path.
    -- Price: ~$310/kWh pack, $142/kW PCS (2025 published list).
    -- RTE: 89.0% AC-AC. Cycle life 4,500 to 80% SoH.
    -- Lead time: 12 weeks (domestic assembly, rail/truck delivery).
    ('LiON Energy', 'Guardian 250', 250.0::numeric, 62.5::numeric,
     'LFP', 800::numeric, 310.0::numeric, 142.0::numeric,
     89.0::numeric, 90.0::numeric, 4500, 0.250::numeric,
     2.0::numeric, 4500, 10, 12, 1,
     ARRAY['UL 1973', 'UL 9540', 'UL 9540A', 'IEC 62619', 'NFPA 855']),

    -- ── LiON Energy Guardian 500 (500 kWh, 125 kW — 4-hr, LFP, US-assembled)
    -- Same platform scaled for larger C&I and light-utility sites.
    -- Lead time advantage is retained at larger capacity.
    ('LiON Energy', 'Guardian 500', 500.0::numeric, 125.0::numeric,
     'LFP', 800::numeric, 305.0::numeric, 140.0::numeric,
     89.0::numeric, 90.0::numeric, 4500, 0.250::numeric,
     2.0::numeric, 4500, 10, 12, 1,
     ARRAY['UL 1973', 'UL 9540', 'UL 9540A', 'IEC 62619', 'NFPA 855'])

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
  bess_count INT;
BEGIN
  SELECT COUNT(*) INTO bess_count
  FROM vendor_products
  WHERE product_category = 'battery'
    AND manufacturer IN ('Great Power', 'Discovery Energy', 'LiON Energy')
    AND status = 'approved';

  RAISE NOTICE 'Trusted BESS partners seeded: % product(s)', bess_count;
END $$;
