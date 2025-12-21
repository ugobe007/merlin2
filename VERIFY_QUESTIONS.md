# Custom Questions Verification Report

## Expected Questions Per Use Case

Based on migration documentation:

### Nov 28 Migration (Original)
- **Expected**: 10 questions per use case
- **Structure**: Standard 10-question template

### Dec 12 Migration (Updated)
- **Hospital**: 19 questions ✅
- **Gas Station**: 16 questions ✅
- **EV Charging Hub**: 16 questions ✅
- **Warehouse**: 17 questions ✅
- **Manufacturing**: 19 questions ✅
- **Data Center**: 18 questions ✅

### Use Cases Covered by Nov 28 Migration

1. **Batch 1** (`02_HOTEL_HOSPITAL_DATACENTER.sql`): hotel-hospitality, hospital, data-center, ev-charging
2. **Batch 2** (`03_EV_AIRPORT_MANUFACTURING.sql`): ev-charging-hub, airport, manufacturing
3. **Batch 3** (`04_CARWASH_WAREHOUSE_OFFICE.sql`): car-wash, warehouse, office
4. **Batch 4** (`05_COLLEGE_COLDSTORAGE_RETAIL.sql`): college, cold-storage, retail
5. **Batch 5** (`06_APARTMENT_RESIDENTIAL_SHOPPING.sql`): apartment, residential, shopping-center
6. **Batch 6** (`07_CASINO_GASSTATION_GOVERNMENT.sql`): casino, gas-station, government
7. **Batch 7** (`08_INDOORFARM_AGRICULTURAL_MICROGRID.sql`): indoor-farm, agricultural, microgrid

## Verification SQL Query

Run this in Supabase SQL Editor to check actual question counts:

```sql
-- Verify question counts per use case
SELECT 
  uc.slug,
  uc.name,
  COUNT(cq.id) as question_count,
  COUNT(CASE WHEN cq.is_active = false THEN 1 END) as inactive_count,
  COUNT(CASE WHEN cq.is_active != false THEN 1 END) as active_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
ORDER BY uc.slug;

-- Expected results:
-- car-wash: 10+ questions
-- hotel-hospitality: 10+ questions
-- hospital: 19 questions (Dec 12 update)
-- office: 10+ questions
-- warehouse: 17 questions (Dec 12 update)
-- etc.
```

## Check for Missing Questions

```sql
-- Find use cases with NO questions
SELECT 
  uc.slug,
  uc.name,
  uc.id
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
  AND cq.id IS NULL
ORDER BY uc.slug;

-- This should return ZERO rows if all use cases have questions
```

## Check for Inactive Questions

```sql
-- Find use cases with inactive questions (might be hiding them)
SELECT 
  uc.slug,
  uc.name,
  COUNT(*) as inactive_questions,
  STRING_AGG(cq.field_name, ', ') as inactive_fields
FROM use_cases uc
INNER JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
  AND cq.is_active = false
GROUP BY uc.id, uc.slug, uc.name
ORDER BY inactive_questions DESC;
```

## Field Name Verification

```sql
-- Check for expected field names per use case
SELECT 
  uc.slug,
  cq.field_name,
  cq.question_text,
  cq.is_active,
  cq.display_order
FROM use_cases uc
INNER JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.slug = 'hotel-hospitality'  -- Change this to check different use cases
ORDER BY cq.display_order;
```

## Potential Issues

1. **Migration order conflict**: Dec 12 migrations might have overwritten Nov 28 migrations
2. **Inactive questions**: Questions marked `is_active = false` won't show
3. **Missing use_case_id links**: Questions exist but aren't linked to use cases
4. **Wrong field names**: Questions exist but have wrong `field_name` values

