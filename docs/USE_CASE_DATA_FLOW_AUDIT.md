# USE CASE DATA FLOW AUDIT
## December 9, 2025

This document maps the data dependencies for each use case in the wizard.

---

## DATA FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER SELECTS USE CASE                                │
│                     (StreamlinedWizard.tsx)                                  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      useCaseService.loadUseCases()                          │
│                   Fetches from Supabase: use_cases table                    │
│                                                                             │
│   Returns: { id, name, slug, category, description, custom_questions }      │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    User Answers Custom Questions                            │
│                   → Stored in wizardState.useCaseData                       │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              calculateUseCasePower(slug, useCaseData)                       │
│                                                                             │
│   SSOT: src/services/useCasePowerCalculations.ts                            │
│   - Switch statement matches slug                                           │
│   - Extracts fields from useCaseData                                        │
│   - Returns: { powerMW, durationHrs, description }                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## USE CASE SLUG MATRIX

| Code Slug | DB Slug Aliases | Expected Fields | Default Value | Status |
|-----------|-----------------|-----------------|---------------|--------|
| `office` | `office-building` | `squareFeet` | 25,000 | ✅ |
| `hotel` | `hotel-hospitality` | `roomCount`, `numberOfRooms` | 100 rooms | ✅ |
| `hospital` | - | `bedCount`, `squareFeet` | 200 beds | ✅ |
| `datacenter` | `data-center` | `rackCount`, `itLoadKW` | 2 MW | ✅ |
| `ev-charging` | `ev-charging-station`, `ev-charging-hub` | `level1Count`, `level2Count`, `dcFastCount` | 0 | ⚠️ Field names vary |
| `airport` | - | `annualPassengers` | 500k | ✅ |
| `manufacturing` | - | `squareFeet`, `industryType` | 25k sqft | ✅ |
| `warehouse` | `logistics`, `logistics-center` | `squareFeet`, `isColdStorage` | 50k sqft | ✅ |
| `cold-storage` | - | `squareFeet` | 20k sqft | ✅ |
| `retail` | `retail-commercial` | `squareFeet` | 10k sqft | ✅ |
| `shopping-center` | `shopping-mall` | `squareFeet` | 100k sqft | ✅ |
| `agriculture` | `agricultural` | `squareFeet` | 20k sqft | ⚠️ No DB entry |
| `casino` | `tribal-casino` | `gamingSpaceSqFt`, `hotelRooms` | 50k sqft | ✅ |
| `indoor-farm` | - | `squareFeet` | 10k sqft | ✅ |
| `apartment` | `apartments` | `unitCount` | 50 units | ✅ |
| `college` | `university`, `college-university` | `squareFeet`, `studentCount` | 200k sqft | ✅ |
| `car-wash` | - | `washBays`, `bayType` | 4 bays | ✅ |
| `gas-station` | `fuel-station` | `squareFeet`, `pumpCount` | 3k sqft | ✅ |
| `government` | `public-building` | `squareFeet` | 50k sqft | ✅ |
| `microgrid` | - | Multiple EV + solar fields | Complex | ✅ |
| `edge-data-center` | - | `rackCount` | 20 racks | ✅ |
| `distribution-center` | - | `squareFeet`, `isColdStorage` | 100k sqft | ✅ |
| `apartment-building` | - | `unitCount` | 100 units | ✅ |
| `residential` | - | `squareFeet` | 2.5k sqft | ✅ |

---

## CRITICAL FIELD NAME MAPPINGS

### EV Charger Fields (HIGH VARIABILITY)
The EV charging fields have the MOST inconsistent naming across the codebase:

| Field Purpose | Code Names | DB Names | Resolution Order |
|---------------|------------|----------|------------------|
| Level 1 count | `level1Count` | `numberOfLevel1Chargers`, `level1Chargers`, `l1Count` | All supported |
| Level 2 count | `level2Count` | `numberOfLevel2Chargers`, `level2Chargers`, `l2Count` | All supported |
| DC Fast count | `dcFastCount` | `dcfastCount`, `numberOfDCFastChargers`, `dcFastChargers`, `dcfc` | ✅ FIXED Dec 9 |

### Square Footage Fields
| Field Purpose | Code Names | Resolution Order |
|---------------|------------|------------------|
| Building size | `squareFeet` | `squareFeet`, `facilitySqFt`, `buildingSqFt`, `sqFt` |
| Warehouse size | `squareFeet` | `squareFeet`, `warehouseSqFt`, `sqFt` |
| Gaming space | `gamingSpaceSqFt` | `gamingSpaceSqFt`, `gamingSqFt` |

### Room/Unit/Bed Counts
| Field Purpose | Code Names | Resolution Order |
|---------------|------------|------------------|
| Hotel rooms | `roomCount` | `roomCount`, `numberOfRooms`, `rooms` |
| Hospital beds | `bedCount` | `bedCount`, `beds` |
| Apartment units | `unitCount` | `unitCount`, `numUnits` |
| Data center racks | `rackCount` | `rackCount`, `racks`, `itLoadKW` |

---

## ISSUES IDENTIFIED

### 🔴 HIGH PRIORITY

1. **Missing Database Entry: Agriculture**
   - Code has `case 'agriculture':` and `case 'agricultural':`
   - No corresponding entry in `use_cases` table
   - **FIX**: Add agriculture to database or remove from UI

2. **EV Field Name Chaos** (FIXED Dec 9, 2025)
   - `dcFastCount` (camelCase) was not in resolution list
   - **FIXED**: Added all variants to field resolution

### 🟡 MEDIUM PRIORITY

3. **Unused Custom Question Fields**
   - Hospital collects: `hasMRI`, `hasCT`, `operatingRooms`, `icuBeds`
   - Hotel collects: `hasRestaurant`, `hasPool`, `hasLaundry`
   - Casino collects: `slotCount`, `hasHotel`
   - **IMPACT**: Users answer questions that don't affect calculations
   - **FIX**: Either use these fields in SSOT or remove questions

4. **Hardcoded Defaults**
   - All defaults are hardcoded in `useCasePowerCalculations.ts`
   - Should come from database `use_case_configurations` table
   - **FIX**: Query database for defaults, fall back to reasonable minimums

### 🟢 LOW PRIORITY

5. **Slug Aliases**
   - Multiple slugs map to same calculation (e.g., `hotel` and `hotel-hospitality`)
   - This is intentional for flexibility
   - No action needed

---

## VERIFICATION CHECKLIST

Run this SQL to verify database has all expected use cases:

```sql
SELECT slug, name, is_active, 
       (SELECT COUNT(*) FROM custom_questions cq WHERE cq.use_case_id = uc.id) as question_count
FROM use_cases uc
WHERE is_active = true
ORDER BY name;
```

Expected slugs that MUST exist:
- [ ] office
- [ ] hotel (or hotel-hospitality)
- [ ] hospital
- [ ] datacenter (or data-center)
- [ ] ev-charging
- [ ] airport
- [ ] manufacturing
- [ ] warehouse
- [ ] retail
- [ ] car-wash
- [ ] casino (or tribal-casino)

---

## TEST COVERAGE

The SSOT validation test suite (`src/tests/ssot-validation.test.ts`) covers:
- ✅ Power calculation accuracy for all use cases
- ✅ Default value protection (no massive defaults)
- ✅ Field name resolution (multiple variants)
- ✅ User input preservation
- ✅ Calculation consistency

**Run tests:** `npx vitest run src/tests/ssot-validation.test.ts`
