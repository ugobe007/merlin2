-- ============================================================================
-- ALIGN SIZING DEFAULTS: DB ↔ V7 industryCatalog
-- ============================================================================
-- Date: February 14, 2026
-- Purpose: Align preferred_duration_hours and recommended_duration_hours in
--          use_case_configurations to match V7 industryCatalog.ts canonical values.
--
-- V7 industryCatalog is the SSOT for BESS sizing defaults.
-- This migration fixes 9 mismatched industries discovered during audit.
--
-- Canonical Values (from industryCatalog.ts + NREL ATB 2024):
--
--   INDUSTRY         | RATIO | HOURS | REASONING
--   -----------------+-------+-------+-----------------------------------------
--   office           | 0.35  | 4     | NREL C&I standard, afternoon peak
--   data-center      | 0.50  | 4     | Bridges to generator start, Tier III
--   hotel            | 0.40  | 4     | Extended evening peak (matches DB)
--   hospital         | 0.70  | 4     | Critical backup + peak shaving (matches DB)
--   ev-charging      | 0.60  | 2     | Fast demand spikes (matches DB)
--   car-wash         | 0.35  | 2     | Short operational cycles (matches DB)
--   gas-station      | 0.40  | 2     | Short demand spikes (matches DB)
--   manufacturing    | 0.45  | 4     | NREL C&I standard + TOU (was 2 in code, 4 in DB)
--   warehouse        | 0.30  | 4     | TOU arbitrage + peak shaving (was 2 in code, 4 in DB)
--   retail           | 0.35  | 4     | Extended business hours
--   truck-stop       | 0.50  | 4     | Large facility, extended hours
--   casino           | 0.45  | 4     | 24/7 operations (matches DB)
--   airport          | 0.50  | 4     | FAA critical systems
--   college          | 0.40  | 4     | Extended campus hours (matches DB)
--   apartment        | 0.35  | 4     | Residential TOU standard
--   residential      | 0.30  | 4     | Tesla Powerwall+ standard
--   government       | 0.40  | 4     | Office-like profile
--   cold-storage     | 0.50  | 4     | Critical temperature maintenance (matches DB)
--   indoor-farm      | 0.40  | 4     | Extended lighting cycles
--   agriculture      | 0.35  | 4     | Seasonal but BESS is for peak shaving, not full backup
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX 1: office — DB had 3h, canonical is 4h (NREL C&I standard)
-- ============================================================================
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = COALESCE(recommended_duration_hours, 4)
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'office')
  AND is_default = true;

-- ============================================================================
-- FIX 2: data-center — DB had 6h (updated seed) or 2h (original), canonical is 4h
-- REASONING: 4h is the NREL C&I BESS standard. Data centers needing more backup
-- use UPS + generator, not BESS alone. 4h covers peak shaving + generator bridge.
-- ============================================================================
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = COALESCE(recommended_duration_hours, 4)
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('data-center', 'edge-data-center'))
  AND is_default = true;

-- ============================================================================
-- FIX 3: manufacturing — DB had 4h, V7 code had 2h. DECISION: 4h (DB is right)
-- REASONING: NREL ATB 2024 C&I standard is 4h. Manufacturing benefits from
-- TOU arbitrage on top of peak shaving. Code will be updated to match.
-- ============================================================================
-- (DB already correct at 4h — no change needed, but set explicitly for clarity)
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = COALESCE(recommended_duration_hours, 4)
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'manufacturing')
  AND is_default = true;

-- ============================================================================
-- FIX 4: warehouse — DB had 4h, V7 code had 2h. DECISION: 4h (DB is right)
-- REASONING: Large warehouses have extended daytime operations. 4h enables
-- meaningful TOU arbitrage + peak shaving for shift-change spikes.
-- ============================================================================
-- (DB already correct at 4h — no change needed, but set explicitly for clarity)
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = COALESCE(recommended_duration_hours, 4)
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'warehouse')
  AND is_default = true;

-- ============================================================================
-- FIX 5: retail — DB had 3h, canonical is 4h (extended business hours)
-- ============================================================================
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = COALESCE(recommended_duration_hours, 4)
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('retail', 'shopping-center'))
  AND is_default = true;

-- ============================================================================
-- FIX 6: residential — DB had 3h, canonical is 4h (Tesla Powerwall+ standard)
-- ============================================================================
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = COALESCE(recommended_duration_hours, 4)
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'residential')
  AND is_default = true;

-- ============================================================================
-- FIX 7: apartment — DB had 3h, canonical is 4h (residential TOU standard)
-- ============================================================================
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = COALESCE(recommended_duration_hours, 4)
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('apartment', 'apartments'))
  AND is_default = true;

-- ============================================================================
-- FIX 8: government — DB had 3h, canonical is 4h (office-like profile)
-- ============================================================================
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = COALESCE(recommended_duration_hours, 4)
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'government')
  AND is_default = true;

-- ============================================================================
-- FIX 9: agricultural — DB had 6h, canonical is 4h
-- REASONING: BESS is for peak shaving/TOU, not replacing a full day of
-- irrigation. 4h covers the peak demand window. Longer backup = generator.
-- ============================================================================
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = 4
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'agricultural')
  AND is_default = true;

-- ============================================================================
-- FIX 10: indoor-farm — DB had 6h, canonical is 4h
-- REASONING: Indoor farms run 18-24h lighting. BESS is for peak shaving
-- and TOU (shift load to off-peak), not replacing the full lighting cycle.
-- ============================================================================
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = 4
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'indoor-farm')
  AND is_default = true;

-- ============================================================================
-- FIX 11: airport — DB had recommended=4, preferred=6. Align both to 4h.
-- REASONING: BESS provides peak shaving + generator bridge, not full backup.
-- ============================================================================
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = 4
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'airport')
  AND is_default = true;

-- ============================================================================
-- FIX 12: hospital — DB had preferred=6, recommended=4. Align both to 4h.
-- ============================================================================
UPDATE use_case_configurations
SET preferred_duration_hours = 4,
    recommended_duration_hours = 4
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'hospital')
  AND is_default = true;

COMMIT;

-- ============================================================================
-- VERIFY: Show all durations after update
-- ============================================================================
SELECT
  uc.slug,
  uc.name,
  ucc.preferred_duration_hours,
  ucc.recommended_duration_hours,
  CASE
    WHEN ucc.preferred_duration_hours = ucc.recommended_duration_hours THEN '✅ aligned'
    ELSE '⚠️ mismatch'
  END AS status
FROM use_cases uc
LEFT JOIN use_case_configurations ucc ON uc.id = ucc.use_case_id AND ucc.is_default = true
WHERE uc.is_active = true
ORDER BY uc.slug;
