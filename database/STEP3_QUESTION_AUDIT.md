# Step 3 Question Audit — SQL Diagnostic Queries

> **Purpose**: Review database `custom_questions` per industry to align with
> WizardV7 adapters, curated schemas, and SSOT calculators.
>
> **Run these** in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
> or via `psql` / any Postgres client.
>
> **Last updated**: February 2026

---

## Table Schemas (Reference)

### `use_cases`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| slug | text UNIQUE | **Hyphenated**: `car-wash`, `ev-charging`, `heavy_duty_truck_stop` |
| name | text | Display name |
| category | text | Commercial / Residential / Industrial / Institutional / Agricultural |
| is_active | boolean | `true` for live industries |
| required_tier | text | FREE / PREMIUM / ADMIN |
| description | text | |
| icon | text | Emoji |
| display_order | int | Sort position |

### `custom_questions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| use_case_id | uuid FK → use_cases.id | |
| field_name | text | **Key the adapter reads**: `numRooms`, `bayCount`, `level2Chargers` |
| question_text | text | User-facing label |
| question_type | text | `select`, `number`, `boolean`, `multi-select`, `range_buttons` |
| options | jsonb | For select types — `[{value, label, icon?, description?, baseKW?}]` |
| default_value | text | |
| is_required | boolean | |
| is_advanced | boolean | |
| help_text | text | |
| display_order | int | Render order |
| section_name | text | Logical section grouping |
| question_tier | text | `essential` / `standard` / `detailed` |
| min_value | numeric | For number inputs |
| max_value | numeric | For number inputs |
| energy_impact_kwh | numeric | Per-unit impact hint |
| icon_name | text | |
| placeholder | text | |
| validation_regex | text | |
| metadata | jsonb | |

---

## Query 1 — All Industries: Question Counts by Tier

Shows every use case with total question count and breakdown by tier.
Quickly reveals industries with 0 questions (missing data) or unexpected counts.

```sql
SELECT
  uc.slug,
  uc.name,
  uc.category,
  uc.is_active,
  uc.required_tier,
  COUNT(cq.id) AS total_questions,
  COUNT(cq.id) FILTER (WHERE cq.question_tier = 'essential')  AS essential,
  COUNT(cq.id) FILTER (WHERE cq.question_tier = 'standard')   AS standard,
  COUNT(cq.id) FILTER (WHERE cq.question_tier = 'detailed')   AS detailed,
  COUNT(cq.id) FILTER (WHERE cq.question_tier IS NULL)         AS untiered
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
GROUP BY uc.slug, uc.name, uc.category, uc.is_active, uc.required_tier
ORDER BY uc.is_active DESC NULLS LAST, uc.display_order NULLS LAST, uc.slug;
```

**What to look for**:
- Active industries with `total_questions = 0` → missing questions
- Industries with `> 20` questions → possible duplicates
- `untiered` count → questions not yet classified

---

## Query 2 — Full Question List for a Specific Industry

Replace the `WHERE` slug to inspect any industry. Shows every column a developer needs.

```sql
SELECT
  cq.display_order,
  cq.field_name,
  cq.question_text,
  cq.question_type,
  cq.default_value,
  cq.is_required,
  cq.is_advanced,
  cq.question_tier,
  cq.section_name,
  cq.min_value,
  cq.max_value,
  cq.energy_impact_kwh,
  cq.help_text,
  CASE
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)
    ELSE 0
  END AS option_count,
  cq.options
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'hotel'  -- ← CHANGE THIS
ORDER BY cq.display_order NULLS LAST, cq.field_name;
```

**Run for each industry you want to audit. Key slugs**:

| Industry | DB Slug | Adapter Status |
|----------|---------|----------------|
| Hotel | `hotel` | ✅ Gold-standard adapter |
| Car Wash | `car-wash` | ✅ Gold-standard adapter |
| EV Charging | `ev-charging` | ✅ Gold-standard adapter |
| Restaurant | `restaurant` | ⚠️ Move 3 adapter (borrows hotel schema) |
| Office | `office` | ⚠️ Move 3 adapter (fallback schema) |
| Truck Stop | `heavy_duty_truck_stop` | ⚠️ Move 3 adapter (borrows gas_station calc) |
| Gas Station | `gas-station` | ⚠️ Shares truck stop adapter |
| Data Center | `data-center` | Legacy questionnaire |
| Hospital | `hospital` | Legacy questionnaire |
| Warehouse | `warehouse` | Fallback schema |
| Manufacturing | `manufacturing` | Fallback schema |
| Retail | `retail` | Fallback schema |
| Apartment | `apartment` | Legacy questionnaire |
| Airport | `airport` | Legacy questionnaire |
| Casino | `casino` | Fallback schema |
| College | `college` | Fallback schema |
| Government | `government` | Legacy questionnaire |
| Cold Storage | `cold-storage` | Fallback schema |
| Indoor Farm | `indoor-farm` | Fallback schema |
| Residential | `residential` | Fallback schema |
| Shopping Center | `shopping-center` | Fallback schema |
| Microgrid | `microgrid` | Fallback schema |

---

## Query 3 — Side-by-Side: ALL Industries, ALL Questions (Compact)

One query to dump every question for every active industry. Good for spreadsheet export.

```sql
SELECT
  uc.slug                    AS industry_slug,
  uc.name                    AS industry_name,
  cq.display_order,
  cq.field_name,
  cq.question_text,
  cq.question_type,
  cq.default_value,
  cq.question_tier,
  cq.section_name,
  cq.is_required,
  cq.min_value,
  cq.max_value
FROM use_cases uc
JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
ORDER BY uc.slug, cq.display_order NULLS LAST;
```

**Export tip**: In Supabase SQL Editor, click "Download CSV" to import into Sheets/Excel.

---

## Query 4 — Duplicate Detection (Same field_name in Same Industry)

Finds questions with the same `field_name` within one use case.
The service layer deduplicates at runtime, but this catches DB bloat.

```sql
SELECT
  uc.slug,
  cq.field_name,
  COUNT(*) AS duplicate_count,
  STRING_AGG(cq.id::text, ', ') AS question_ids,
  STRING_AGG(cq.question_text, ' | ') AS question_texts
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
GROUP BY uc.slug, cq.field_name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, uc.slug;
```

---

## Query 5 — Semantic Duplicates (Same question_text, Different field_name)

Catches questions like `buildingSqFt` and `squareFeet` both asking
"What is the square footage?" — the #1 silent-default bug class.

```sql
SELECT
  uc.slug,
  LOWER(TRIM(cq.question_text)) AS normalized_text,
  COUNT(*)                       AS variants,
  STRING_AGG(cq.field_name, ', ' ORDER BY cq.display_order) AS field_names,
  STRING_AGG(cq.default_value, ', ' ORDER BY cq.display_order) AS defaults
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.is_active = true
GROUP BY uc.slug, LOWER(TRIM(cq.question_text))
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, uc.slug;
```

---

## Query 6 — Slug Convention Audit (Hyphens vs Underscores vs CamelCase)

Database convention is **hyphenated slugs** (`car-wash`, `ev-charging`).
Code convention is **underscored** (`car_wash`, `ev_charging`).
This query finds any that break the expected pattern.

```sql
-- Find use_case slugs that contain underscores (potential convention violation)
SELECT slug, name, 'underscore in slug' AS issue
FROM use_cases
WHERE slug ~ '_'

UNION ALL

-- Find use_case slugs that contain uppercase (potential convention violation)
SELECT slug, name, 'uppercase in slug' AS issue
FROM use_cases
WHERE slug ~ '[A-Z]'

UNION ALL

-- Find field_names that use hyphens (unusual — most are camelCase)
SELECT DISTINCT
  uc.slug || ' → ' || cq.field_name AS slug,
  cq.question_text AS name,
  'hyphen in field_name' AS issue
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE cq.field_name ~ '-'

ORDER BY issue, slug;
```

---

## Query 7 — field_name → Adapter Consumed Keys Comparison

This query extracts the `field_name` list per industry so you can compare
with what the WizardV7 adapter actually reads.

```sql
-- Run per industry. Paste the adapter's consumed keys alongside.
SELECT
  uc.slug,
  ARRAY_AGG(cq.field_name ORDER BY cq.display_order) AS db_field_names,
  COUNT(cq.id) AS count
FROM use_cases uc
JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.slug
ORDER BY uc.slug;
```

### Cross-Reference Table

Once you run the query above, compare each industry's `db_field_names`
against what the adapter/calculator actually consumes:

| Industry | DB `field_name` list (from query) | Adapter Consumed Keys | Calculator SSOT Keys | Gaps |
|----------|-----------------------------------|----------------------|---------------------|------|
| hotel | _run query_ | numRooms, hotelCategory, occupancyRate, poolOnSite, restaurantOnSite, spaOnSite, gridConnection | roomCount, hotelClass | _compare_ |
| car-wash | _run query_ | facilityType, tunnelOrBayCount, operatingHours, daysPerWeek, dailyVehicles, waterHeaterType, dryerConfiguration, pumpConfiguration | bayCount, washType | _compare_ |
| ev-charging | _run query_ | level2Chargers, level2Power, dcFastChargers, dcFastPower, stationType, gridConnection, operatingHours | numberOfLevel2Chargers, numberOfDCFastChargers | _compare_ |
| truck stop | _run query_ | truckStopType, fuelingPositions, electricalServiceSize, facilities, ... | fuelPumps, hasConvenienceStore, hasCarWash (gas_station calc) | ⚠️ MAJOR GAP |
| restaurant | _run query_ | _TBD_ | seatingCapacity (restaurant_load_v1) | ⚠️ NEEDS AUDIT |
| office | _run query_ | squareFeet, floors, peakDemandKW, employees, operatingHours | officeSqFt (SSOT alias) | _compare_ |

---

## Query 8 — Questions with Select Options: Option Value Audit

For questions of type `select` or `multi-select`, shows the option values.
Useful for verifying option values match what adapters expect.

```sql
SELECT
  uc.slug,
  cq.field_name,
  cq.question_type,
  opt.value->>'value' AS option_value,
  opt.value->>'label' AS option_label,
  opt.value->>'baseKW' AS base_kw,
  opt.value->>'icon'   AS icon
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
CROSS JOIN LATERAL jsonb_array_elements(cq.options) AS opt(value)
WHERE cq.options IS NOT NULL
  AND uc.slug = 'hotel'  -- ← CHANGE THIS
ORDER BY cq.display_order, opt.ordinality;
```

**Key things to verify**:
- Do the `option_value` strings match what the adapter's type profiles expect?
  - e.g., Hotel adapter expects `economy`, `midscale`, `upscale`, `luxury`
  - e.g., Car wash adapter expects `tunnel`, `automatic`, `selfService`
- Do options with `baseKW` hints align with the calculator's load model?

---

## Query 9 — Missing Required Fields: Industries Without Essential Questions

Finds industries where essential-tier questions are missing.

```sql
-- Industries with 0 essential questions
SELECT
  uc.slug,
  uc.name,
  COUNT(cq.id) AS total_questions,
  COUNT(cq.id) FILTER (WHERE cq.question_tier = 'essential') AS essential_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.slug, uc.name
HAVING COUNT(cq.id) FILTER (WHERE cq.question_tier = 'essential') = 0
ORDER BY uc.slug;
```

---

## Query 10 — Universal Questions Coverage

These fields should exist for EVERY industry (needed by the generic BESS sizing path):

- `gridConnection` — on-grid / off-grid / limited
- `operatingHours` — duty cycle driver
- `primaryBESSApplication` — peak shaving / arbitrage / backup / etc.
- `monthlyElectricBill` or `monthlyKWH` — baseline energy usage

```sql
WITH universal_fields AS (
  SELECT unnest(ARRAY[
    'gridConnection',
    'operatingHours',
    'primaryBESSApplication',
    'monthlyElectricBill',
    'monthlyKWH',
    'monthlyElectricitySpend',
    'peakDemandKW'
  ]) AS required_field
)
SELECT
  uc.slug,
  uf.required_field,
  CASE WHEN cq.field_name IS NOT NULL THEN '✅' ELSE '❌' END AS present
FROM use_cases uc
CROSS JOIN universal_fields uf
LEFT JOIN custom_questions cq
  ON cq.use_case_id = uc.id
  AND cq.field_name = uf.required_field
WHERE uc.is_active = true
ORDER BY uc.slug, uf.required_field;
```

---

## Query 11 — Orphaned Questions (No Parent Use Case)

Questions pointing to a `use_case_id` that no longer exists.

```sql
SELECT
  cq.id,
  cq.use_case_id,
  cq.field_name,
  cq.question_text
FROM custom_questions cq
LEFT JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.id IS NULL;
```

---

## Query 12 — Industry Question Summary for Executive Review

Clean summary for stakeholder review showing question health per industry.

```sql
SELECT
  uc.slug,
  uc.name,
  uc.category,
  CASE WHEN uc.is_active THEN '🟢' ELSE '🔴' END AS status,
  uc.required_tier,
  COUNT(cq.id) AS q_count,
  COUNT(DISTINCT cq.section_name) AS sections,
  COUNT(cq.id) FILTER (WHERE cq.is_required = true) AS required,
  COUNT(cq.id) FILTER (WHERE cq.question_type = 'select') AS selects,
  COUNT(cq.id) FILTER (WHERE cq.question_type = 'number') AS numbers,
  COUNT(cq.id) FILTER (WHERE cq.question_type = 'boolean') AS booleans,
  COUNT(cq.id) FILTER (WHERE cq.question_type = 'multi-select') AS multi_selects,
  STRING_AGG(
    cq.field_name,
    ', '
    ORDER BY cq.display_order
  ) AS field_list
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
GROUP BY uc.slug, uc.name, uc.category, uc.is_active, uc.required_tier, uc.display_order
ORDER BY uc.is_active DESC NULLS LAST, uc.display_order NULLS LAST;
```

---

## Usage Guide

### Typical Audit Workflow

1. **Start with Query 1** — Get the bird's-eye view of question counts per industry
2. **Run Query 4 + 5** — Find duplicates and semantic collisions
3. **Run Query 6** — Find slug/naming convention violations
4. **Run Query 2** for each critical industry (hotel, car-wash, ev-charging, truck-stop, restaurant)
5. **Run Query 7** — Export field name lists, paste into the cross-reference table above
6. **Run Query 8** — Verify option values match adapter type profiles
7. **Run Query 10** — Check universal field coverage
8. **Run Query 12** — Executive summary for stakeholder review

### What to Do with Results

| Finding | Action |
|---------|--------|
| Industry has 0 questions | Write a migration to add questions |
| Duplicate field_names | Write migration to deduplicate (keep lower display_order) |
| Semantic duplicates | Pick canonical field_name, migrate data, drop the other |
| field_name ≠ adapter key | Either update DB field_name OR add SSOT alias in `ssotInputAliases.ts` |
| Option values ≠ adapter constants | Update DB option values OR update adapter type profiles |
| Missing universal field | Add via migration with sensible default |
| Slug convention mismatch | Add slug alias in `industryCatalog.ts` normalize function |

### Key File Cross-References

| Concern | File |
|---------|------|
| Curated schemas (what Step 3 renders) | `src/wizard/v7/schema/curatedFieldsResolver.ts` |
| Adapter field consumption | `src/wizard/v7/step3/adapters/*.ts` |
| SSOT field name aliases | `src/wizard/v7/calculators/ssotInputAliases.ts` |
| Calculator registry | `src/wizard/v7/calculators/registry.ts` |
| Industry catalog (slug normalization) | `src/wizard/v7/industry/industryCatalog.ts` |
| Industry context resolution | `src/wizard/v7/industry/resolveIndustryContext.ts` |
| Database types | `src/types/database.types.ts` (lines 851-935) |
