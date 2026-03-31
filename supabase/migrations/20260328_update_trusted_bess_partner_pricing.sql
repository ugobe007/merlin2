-- ============================================================================
-- UPDATE TRUSTED BESS PARTNER PRICING
-- March 27, 2026
--
-- Corrects price_per_kwh for Great Power, Discovery Energy, and LiON Energy
-- to reflect actual partner/direct pricing: $105–$155/kWh range.
--
-- Previous seed used public benchmark pricing (~$255–$310/kWh).
-- Partner direct pricing is significantly lower — these are known suppliers.
-- ============================================================================

UPDATE vendor_products
SET
  price_per_kwh          = 112.0,
  price_per_kw           = 120.0,
  -- Recompute effective_price_per_kwh (tariff_adder_pct defaults to 0 for
  -- direct-partner products; effective = price until tariff is set per PO)
  effective_price_per_kwh = 112.0
WHERE manufacturer = 'Great Power'
  AND model = 'GP-BESS-200'
  AND product_category = 'battery';

UPDATE vendor_products
SET
  price_per_kwh           = 108.0,
  price_per_kw            = 118.0,
  effective_price_per_kwh = 108.0
WHERE manufacturer = 'Great Power'
  AND model = 'GP-BESS-500'
  AND product_category = 'battery';

UPDATE vendor_products
SET
  price_per_kwh           = 130.0,
  price_per_kw            = 128.0,
  effective_price_per_kwh = 130.0
WHERE manufacturer = 'Discovery Energy'
  AND model = 'DCS-E 240'
  AND product_category = 'battery';

UPDATE vendor_products
SET
  price_per_kwh           = 150.0,
  price_per_kw            = 135.0,
  effective_price_per_kwh = 150.0
WHERE manufacturer = 'LiON Energy'
  AND model = 'Guardian 250'
  AND product_category = 'battery';

UPDATE vendor_products
SET
  price_per_kwh           = 145.0,
  price_per_kw            = 132.0,
  effective_price_per_kwh = 145.0
WHERE manufacturer = 'LiON Energy'
  AND model = 'Guardian 500'
  AND product_category = 'battery';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT manufacturer, model, price_per_kwh, price_per_kw
    FROM vendor_products
    WHERE manufacturer IN ('Great Power', 'Discovery Energy', 'LiON Energy')
      AND product_category = 'battery'
    ORDER BY manufacturer, model
  LOOP
    RAISE NOTICE '  %-20s %-20s  $%.0f/kWh  $%.0f/kW',
      r.manufacturer, r.model, r.price_per_kwh, r.price_per_kw;
  END LOOP;
END $$;
