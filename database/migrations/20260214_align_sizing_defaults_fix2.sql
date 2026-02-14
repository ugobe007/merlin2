-- ============================================================================
-- FIX REMAINING MISMATCHES from 20260214_align_sizing_defaults.sql
-- ============================================================================
-- The original migration used COALESCE(recommended_duration_hours, 4) which
-- preserved stale values (e.g., 3h) instead of overwriting to canonical 4h.
-- This fixes the 6 remaining ⚠️ mismatches.
-- ============================================================================

BEGIN;

-- FIX 1: apartment — recommended was 3, should be 4
UPDATE use_case_configurations
SET recommended_duration_hours = 4
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'apartment')
  AND is_default = true;

-- FIX 2: government — recommended was 3, should be 4
UPDATE use_case_configurations
SET recommended_duration_hours = 4
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'government')
  AND is_default = true;

-- FIX 3: ev-charging — recommended was NULL, should be 2 (matches preferred)
UPDATE use_case_configurations
SET recommended_duration_hours = 2
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'ev-charging')
  AND is_default = true;

-- FIX 4: heavy_duty_truck_stop — recommended was 6, should be 4 (matches preferred)
UPDATE use_case_configurations
SET recommended_duration_hours = 4
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop')
  AND is_default = true;

-- FIX 5: microgrid — preferred=6, recommended=NULL
-- Microgrids are intentionally 6h (islanding requires longer duration than C&I peak shaving).
-- Align recommended to match preferred.
UPDATE use_case_configurations
SET recommended_duration_hours = 6
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'microgrid')
  AND is_default = true;

-- FIX 6: restaurant — both NULL (new use case, config row exists but no durations)
-- Restaurant = commercial profile, 4h NREL C&I standard
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = 4
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'restaurant')
  AND is_default = true;

-- If restaurant has no config row at all, insert one:
INSERT INTO use_case_configurations (use_case_id, config_name, is_default, preferred_duration_hours, recommended_duration_hours)
SELECT id, 'Standard Restaurant', true, 4, 4
FROM use_cases
WHERE slug = 'restaurant'
  AND NOT EXISTS (
    SELECT 1 FROM use_case_configurations
    WHERE use_case_id = use_cases.id AND is_default = true
  );

COMMIT;

-- ============================================================================
-- VERIFY: All should now be ✅ aligned
-- ============================================================================
SELECT
  uc.slug,
  uc.name,
  ucc.preferred_duration_hours,
  ucc.recommended_duration_hours,
  CASE
    WHEN ucc.preferred_duration_hours = ucc.recommended_duration_hours THEN '✅ aligned'
    WHEN ucc.preferred_duration_hours IS NULL OR ucc.recommended_duration_hours IS NULL THEN '⚠️ null'
    ELSE '⚠️ mismatch'
  END AS status
FROM use_cases uc
LEFT JOIN use_case_configurations ucc ON uc.id = ucc.use_case_id AND ucc.is_default = true
WHERE uc.is_active = true
ORDER BY uc.slug;
