# COMPLETE USE CASE FIELD MAPPING - ALL 18 TEMPLATES

## Database vs Code Audit (Source of Truth: Database SQL)

| # | Use Case | Database field_name | Current Code Lookup | Status | Fix Priority |
|---|----------|-------------------|-------------------|---------|--------------|
| 1 | **car-wash** | `bayCount` | `num_bays \|\| numBays` | ❌ **FIXED** | ✅ |
| 2 | **warehouse** | `warehouseSqFt` | `facility_size` | ❌ **FIXED** | ✅ |
| 3 | **apartment** | `unitCount` | `numUnits` | ❌ **FIXED** | ✅ |
| 4 | **gas-station** | `dispenserCount` | ??? | ⚠️ **NEEDS CHECK** | HIGH |
| 5 | **hospital** | `bedCount` | `bedCount` | ✅ **CORRECT** | - |
| 6 | **datacenter** | `itLoadKW`, `rackCount` | `capacity`, `totalCapacity` | ❌ **FIXED** | ✅ |
| 7 | **indoor-farm** | `growingAreaSqFt` | `cultivationArea \|\| growing_area` | ❌ **FIXED** | ✅ |
| 8 | **hotel** | `roomCount` | `numberOfRooms \|\| numRooms` | ❌ **FIXED** | ✅ |
| 9 | **office** | `buildingSqFt` | ??? | ⚠️ **NEEDS CHECK** | HIGH |
| 10 | **manufacturing** | `productionLines` | `numLines \|\| production_lines` | ⚠️ **NEEDS CHECK** | HIGH |
| 11 | **college** | `studentEnrollment` | `enrollment` | ⚠️ **NEEDS CHECK** | HIGH |
| 12 | **government** | `facilitySqFt` | ??? | ⚠️ **NEEDS CHECK** | HIGH |
| 13 | **hotel-hospitality** | `roomCount` (same as hotel) | ??? | ⚠️ **NEEDS CHECK** | HIGH |
| 14 | **ev-charging** | `chargerCount` | ??? | ⚠️ **NEEDS CHECK** | HIGH |
| 15 | **shopping-center** | `totalSqFt` | ??? | ⚠️ **NEEDS CHECK** | HIGH |
| 16 | **residential** | `homeCount` | ??? | ⚠️ **NEEDS CHECK** | HIGH |
| 17 | **retail** | `storeSqFt` | `store_size` | ⚠️ **NEEDS CHECK** | HIGH |
| 18 | **microgrid** | `numberOfHomes` | `numBuildings \|\| homes` | ⚠️ **NEEDS CHECK** | HIGH |

---

## PRIMARY FIELD NAMES FROM DATABASE (Lines from SQL)

### 1. Car Wash (Line 52) ✅ FIXED
```sql
field_name: 'bayCount'
```

### 2. Warehouse (Line 74) ✅ FIXED
```sql
field_name: 'warehouseSqFt'
```

### 3. Apartment (Line 104) ✅ FIXED
```sql
field_name: 'unitCount'
```

### 4. Gas Station (Line 133)
```sql
field_name: 'dispenserCount'
```

### 5. Hospital (Line 156) ✅ CORRECT
```sql
field_name: 'bedCount'
```

### 6. Data Center (Line 186) ✅ FIXED
```sql
field_name: 'itLoadKW'
field_name: 'rackCount'
field_name: 'rackDensityKW'
```

### 7. Indoor Farm (Line 229) ✅ FIXED
```sql
field_name: 'growingAreaSqFt'
```

### 8. Hotel (Line 265) ✅ FIXED
```sql
field_name: 'roomCount'
```

### 9. Office (Line 289)
```sql
field_name: 'buildingSqFt'
```

### 10. Manufacturing (Line 326)
```sql
field_name: 'productionLines'
```

### 11. College (Line 356)
```sql
field_name: 'studentEnrollment'
```

### 12. Government (Line 379)
```sql
field_name: 'facilitySqFt'
```

### 13. Hotel Hospitality (Line 408)
```sql
field_name: 'roomCount'
```

### 14. EV Charging (Line 432)
```sql
field_name: 'chargerCount'
```

### 15. Shopping Center (Line 454)
```sql
field_name: 'totalSqFt'
```

### 16. Residential (Line 476)
```sql
field_name: 'homeCount'
```

### 17. Retail (Line 506)
```sql
field_name: 'storeSqFt'
```

### 18. Microgrid (Line 534)
```sql
field_name: 'numberOfHomes'
```

---

## EXTRACTION IN PROGRESS...

Will now verify SmartWizardV2 switch statement for ALL templates.
