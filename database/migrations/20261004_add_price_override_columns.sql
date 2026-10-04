-- A battery price below half the published index is a different product until
-- someone records why it is being used. Free-text notes cannot carry that
-- decision: the pricing table is filled by a scraper, and a token in notes
-- is self-authorizing.
--
-- Rollback:
--   ALTER TABLE equipment_pricing DROP CONSTRAINT IF EXISTS override_requires_reason;
--   DROP INDEX IF EXISTS equipment_pricing_override_active_idx;
--   DROP INDEX IF EXISTS equipment_pricing_unit_lookup_idx;
--   ALTER TABLE equipment_pricing
--     DROP COLUMN IF EXISTS override_below_index,
--     DROP COLUMN IF EXISTS override_reason,
--     DROP COLUMN IF EXISTS override_by,
--     DROP COLUMN IF EXISTS override_at;

ALTER TABLE equipment_pricing
  ADD COLUMN IF NOT EXISTS override_below_index BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS override_reason      TEXT,
  ADD COLUMN IF NOT EXISTS override_by          TEXT,
  ADD COLUMN IF NOT EXISTS override_at          TIMESTAMPTZ;

ALTER TABLE equipment_pricing
  DROP CONSTRAINT IF EXISTS override_requires_reason;

ALTER TABLE equipment_pricing
  ADD CONSTRAINT override_requires_reason CHECK (
    override_below_index = false
    OR (
      override_reason IS NOT NULL
      AND length(btrim(override_reason)) >= 10
      AND override_by IS NOT NULL
    )
  );

CREATE INDEX IF NOT EXISTS equipment_pricing_override_active_idx
  ON equipment_pricing (manufacturer, model)
  WHERE override_below_index = true;

CREATE INDEX IF NOT EXISTS equipment_pricing_unit_lookup_idx
  ON equipment_pricing (equipment_type, manufacturer, model);
