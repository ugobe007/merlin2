# Custom Questions Migration - November 28, 2025

## Summary

Complete overhaul of custom questions for all 22 use cases, with conditional Step 3 display based on user preferences.

---

## Database Migrations

Created 10 SQL migration files in `/database/migrations/`:

| File | Purpose | Use Cases |
|------|---------|-----------|
| `01_DELETE_ALL_QUESTIONS.sql` | Clean slate | - |
| `02_HOTEL_HOSPITAL_DATACENTER.sql` | Batch 1 | hotel-hospitality, hospital, data-center, ev-charging |
| `03_EV_AIRPORT_MANUFACTURING.sql` | Batch 2 | ev-charging-hub, airport, manufacturing |
| `04_CARWASH_WAREHOUSE_OFFICE.sql` | Batch 3 | car-wash, warehouse, office |
| `05_COLLEGE_COLDSTORAGE_RETAIL.sql` | Batch 4 | college, cold-storage, retail |
| `06_APARTMENT_RESIDENTIAL_SHOPPING.sql` | Batch 5 | apartment, residential, shopping-center |
| `07_CASINO_GASSTATION_GOVERNMENT.sql` | Batch 6 | casino, gas-station, government |
| `08_INDOORFARM_AGRICULTURAL_MICROGRID.sql` | Batch 7 | indoor-farm, agricultural, microgrid |
| `09_FIX_FIELD_NAMES.sql` | Field name corrections | All 22 use cases |
| `10_CLEANUP_DUPLICATES.sql` | Remove duplicates | agricultural, indoor-farm, microgrid |

### Execution Order
```bash
# Run in Supabase SQL Editor in this order:
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10
```

---

## Question Structure (10 per use case)

Each use case has exactly 10 questions:

1. **Industry-specific primary** (e.g., `roomCount`, `bedCount`, `unitCount`)
2. **Peak demand** (`peakDemandKW`)
3. **Operating hours** (`operatingHours`)
4. **Grid reliability** (`gridReliability`)
5. **Backup duration** (`backupDurationHours`)
6. **Existing solar** (`existingSolarKW`) - For NET peak calculation
7. **Want solar** (`wantsSolar`) - Controls Step 3 visibility
8. **Existing EV chargers** (`existingEVChargers`) - For NET peak calculation
9. **Want EV charging** (`wantsEVCharging`) - Controls Step 3 visibility
10. **Budget range** (`budgetRange`)

---

## Field Name Mapping

| Use Case | Primary Field | SmartWizard Variable |
|----------|--------------|---------------------|
| agricultural | farmSize | useCaseData.farmSize |
| airport | annualPassengers | useCaseData.annualPassengers |
| apartment | unitCount | useCaseData.unitCount |
| car-wash | bayCount | useCaseData.bayCount |
| casino | gamingFloorSize | useCaseData.gamingFloorSize |
| cold-storage | storageVolume | useCaseData.storageVolume |
| college | studentCount | useCaseData.studentCount |
| data-center | itLoadKW, rackCount | useCaseData.itLoadKW |
| ev-charging | numberOfDCFastChargers | useCaseData.numberOfDCFastChargers |
| gas-station | dispenserCount | useCaseData.dispenserCount |
| government | buildingSqFt | useCaseData.buildingSqFt |
| hospital | bedCount | useCaseData.bedCount |
| hotel-hospitality | roomCount | useCaseData.roomCount |
| indoor-farm | growingAreaSqFt | useCaseData.growingAreaSqFt |
| manufacturing | facilitySqFt | useCaseData.facilitySqFt |
| microgrid | siteLoadKW | useCaseData.siteLoadKW |
| office | officeSqFt | useCaseData.officeSqFt |
| residential | homeSqFt | useCaseData.homeSqFt |
| retail | retailSqFt | useCaseData.retailSqFt |
| shopping-center | retailSqFt | useCaseData.retailSqFt |
| warehouse | warehouseSqFt | useCaseData.warehouseSqFt |

---

## Code Changes

### SmartWizardV2.tsx

**Lines 431-432** - NET peak demand calculation (handles both old and new field names):
```typescript
const existingSolar = useCaseData.existingSolarKW || useCaseData.existingSolarKw || 0;
const existingEV = useCaseData.existingEVChargers || useCaseData.existingEvPorts || 0;
```

**Lines 2215-2245** - Conditional Step 3 display:
```typescript
const wantsSolarValue = useCaseData?.wantsSolar;
const wantsEVValue = useCaseData?.wantsEVCharging;
const showSolarSection = wantsSolarValue === undefined || wantsSolarValue === true || wantsSolarValue === 'yes' || wantsSolarValue === 'Yes';
const showEVSection = wantsEVValue === undefined || wantsEVValue === true || wantsEVValue === 'yes' || wantsEVValue === 'Yes';
```

### Step3_AddGoodies.tsx

**New props added**:
```typescript
interface Step3Props {
  // ... existing props
  showSolar?: boolean;  // Based on wantsSolar from custom questions
  showEV?: boolean;     // Based on wantsEVCharging from custom questions
}
```

**Conditional rendering**:
- Solar section wrapped in `{showSolar && (...)}`
- EV section wrapped in `{showEV && (...)}`
- Generator and Wind always visible

---

## Calculation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Custom Questions                                        │
│ ├─ existingSolarKW → Used in NET peak demand calculation       │
│ ├─ existingEVChargers → Used in NET peak demand calculation    │
│ ├─ wantsSolar → Controls Step 3 Solar section visibility       │
│ └─ wantsEVCharging → Controls Step 3 EV section visibility     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SmartWizardV2: Power Profile Calculation (Lines 428-453)        │
│ NET Peak = peakDemand - solarOffset + evLoad                   │
│ Where:                                                          │
│   solarOffset = existingSolarKW * 0.3 (30% capacity factor)    │
│   evLoad = existingEVChargers * 7.2 kW                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Baseline Calculation                                    │
│ calculateDatabaseBaseline(template, scale, useCaseData)        │
│ Returns: powerMW, durationHrs, solarMW                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Add Extras (Conditional Display)                        │
│ ├─ Solar: shown if wantsSolar !== 'No'                         │
│ ├─ EV: shown if wantsEVCharging !== 'No'                       │
│ ├─ Generator: always shown                                      │
│ └─ Wind: always shown                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing

### TypeScript Verification
```bash
npx tsc --noEmit  # Should complete with no errors
```

### Database Verification
```sql
-- Check question counts per use case
SELECT 
  uc.slug,
  uc.name,
  COUNT(cq.id) as question_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
GROUP BY uc.id, uc.slug, uc.name
ORDER BY uc.slug;

-- All should show 10 questions
```

### Dev Console Verification
In browser dev tools, look for:
```
🎛️ [Step3] Conditional display: { wantsSolar: 'Yes', wantsEVCharging: 'No', showSolar: true, showEV: false }
```

---

## Backward Compatibility

- **Old data without wantsSolar/wantsEVCharging**: Both sections shown (default behavior)
- **Old field names (existingSolarKw, existingEvPorts)**: Still work via fallback in SmartWizardV2
- **Defaults**: `showSolar=true`, `showEV=true` if props not provided

---

## Files Modified

1. `/database/migrations/01_DELETE_ALL_QUESTIONS.sql` - NEW
2. `/database/migrations/02_HOTEL_HOSPITAL_DATACENTER.sql` - NEW
3. `/database/migrations/03_EV_AIRPORT_MANUFACTURING.sql` - NEW
4. `/database/migrations/04_CARWASH_WAREHOUSE_OFFICE.sql` - NEW
5. `/database/migrations/05_COLLEGE_COLDSTORAGE_RETAIL.sql` - NEW
6. `/database/migrations/06_APARTMENT_RESIDENTIAL_SHOPPING.sql` - NEW
7. `/database/migrations/07_CASINO_GASSTATION_GOVERNMENT.sql` - NEW
8. `/database/migrations/08_INDOORFARM_AGRICULTURAL_MICROGRID.sql` - NEW
9. `/database/migrations/09_FIX_FIELD_NAMES.sql` - NEW
10. `/database/migrations/10_CLEANUP_DUPLICATES.sql` - NEW
11. `/src/components/wizard/SmartWizardV2.tsx` - MODIFIED
12. `/src/components/wizard/steps_v3/Step3_AddGoodies.tsx` - MODIFIED
