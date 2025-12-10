# USE CASE DATA FLOW AUDIT
## Merlin BESS Quote Builder - December 2025

This document traces the data flow for ALL use cases through the wizard system, identifying mismatches between database slugs, code slugs, expected field names, and hardcoded defaults.

---

## 📊 EXECUTIVE SUMMARY

### Key Findings

| Issue Type | Count | Severity |
|------------|-------|----------|
| **Slug Mismatches (DB vs Code)** | 3 | 🟡 Medium |
| **Missing Main DB Entries (in migrations only)** | 3 | 🟡 Medium |
| **Truly Missing DB Entries** | 1 | 🔴 High |
| **Field Name Inconsistencies** | 15+ | 🔴 High |
| **Hardcoded Defaults Bypassing SSOT** | 6 | 🟡 Medium |
| **Unused Custom Question Fields** | 20+ | 🟡 Medium |

---

## 🗂️ COMPLETE USE CASE SLUG INVENTORY

### A. Slugs in `calculateUseCasePower()` (Code - SSOT)

Located in `src/services/useCasePowerCalculations.ts` lines 1329-1620:

| Case Label | Handler | Status |
|------------|---------|--------|
| `office` | `calculateOfficePower()` | ✅ Has DB match |
| `office-building` | alias → `calculateOfficePower()` | ❌ Not in DB |
| `hotel` | `calculateHotelPower()` | ⚠️ DB has `hotel-hospitality` |
| `hotel-hospitality` | alias → `calculateHotelPower()` | ✅ DB match |
| `hospital` | `calculateHospitalPower()` | ✅ Has DB match |
| `datacenter` | `calculateDatacenterPower()` | ❌ Not in DB |
| `data-center` | alias → `calculateDatacenterPower()` | ✅ Has DB match |
| `ev-charging` | `calculateEVChargingPower()` | ✅ Has DB match |
| `ev-charging-station` | alias → EV charging | ❌ Not in DB |
| `ev-charging-hub` | alias → EV charging | ❌ Not in DB |
| `airport` | `calculateAirportPower()` | ✅ Has DB match |
| `manufacturing` | `calculateManufacturingPower()` | ✅ Has DB match |
| `warehouse` | `calculateWarehousePower()` | ⚠️ DB may have different slug |
| `logistics` | alias → warehouse | ❌ Not in DB |
| `logistics-center` | alias → warehouse | ❌ Not in DB |
| `cold-storage` | warehouse(cold=true) | ✅ Has DB match |
| `retail` | `calculateRetailPower()` | ✅ Has DB match |
| `retail-commercial` | alias → retail | ❌ Not in DB |
| `shopping-center` | `calculateShoppingCenterPower()` | ✅ Has DB match |
| `shopping-mall` | alias → shopping center | ❌ Not in DB |
| `agriculture` | `calculateAgriculturePower()` | ❌ Not in DB |
| `agricultural` | alias → agriculture | ❌ Not in DB |
| `casino` | `calculateCasinoPower()` | ❌ Not in DB |
| `tribal-casino` | alias → casino | ❌ Not in DB |
| `indoor-farm` | `calculateIndoorFarmPower()` | ✅ Has DB match |
| `apartment` | `calculateApartmentPower()` | ❌ Not in DB |
| `apartments` | alias → apartment | ✅ Has DB match |
| `college` | `calculateCollegePower()` | ✅ Has DB match |
| `university` | alias → college | ❌ Not in DB |
| `college-university` | alias → college | ❌ Not in DB |
| `car-wash` | `calculateCarWashPower()` | ✅ Has DB match |
| `gas-station` | `calculateGasStationPower()` | ❌ Not in DB |
| `fuel-station` | alias → gas station | ❌ Not in DB |
| `government` | `calculateGovernmentPower()` | ❌ Not in DB |
| `public-building` | alias → government | ⚠️ May have DB entry |
| `microgrid` | custom microgrid logic | ✅ Has DB match |
| `edge-data-center` | alias → datacenter | ✅ Has DB match |
| `distribution-center` | alias → warehouse | ⚠️ May have DB entry |
| `apartment-building` | alias → apartment | ❌ Not in DB |
| `residential` | custom residential calc | ✅ Has DB match |

### B. Slugs in Database Seeds

**From `database/seed_use_cases.sql`:**
```sql
office, data-center, hotel-hospitality, manufacturing, 
ev-charging, residential, retail, microgrid
```

**From `docs/USE_CASE_DATA_MIGRATION.sql`:**
```sql
car-wash, ev-charging, hospital, indoor-farm, hotel, 
airport, college, dental-office, edge-data-center, 
food-processing, apartments, shopping-center
```

**From `docs/SEED_INITIAL_DATA.sql`:**
```sql
peak-shaving-commercial, energy-arbitrage-utility, 
backup-critical-infrastructure, ev-fast-charging
```

---

## 🔴 CRITICAL ISSUES

### Issue 1: Hotel Slug Inconsistency

**Problem:** Database uses `hotel-hospitality` but some code paths use `hotel`

**Database:**
```sql
-- seed_use_cases.sql
INSERT INTO use_cases ... ('hotel', 'hotel-hospitality', 'Hotel & Hospitality', ...
-- Note: id='hotel', slug='hotel-hospitality'
```

**Code (useCasePowerCalculations.ts):**
```typescript
case 'hotel':
case 'hotel-hospitality':
  // Both handled - OK
```

**Custom Questions (COMPREHENSIVE_QUESTIONS.sql):**
```sql
... WHERE slug IN ('hotel', 'hotel-hospitality');
-- This is correct - covers both
```

**Status:** ⚠️ Works but confusing - `id` and `slug` differ

---

### Issue 2: Missing Use Cases in Database

These slugs are in code but **NOT in database seeds**:

| Slug | Purpose | Impact |
|------|---------|--------|
| `agriculture` | Farms, irrigation | No template/questions loaded |
| `casino` | Gaming facilities | Falls to generic |
| `gas-station` | Fuel retail | Falls to generic |
| `government` | Public buildings | Falls to generic |
| `warehouse` | Logistics centers | May be `distribution-center` |
| `dental-office` | In migration SQL only | May not be seeded |
| `food-processing` | In migration SQL only | May not be seeded |

**Impact:** Users selecting these industries get generic 5 W/sq ft calculation with no custom questions.

---

### Issue 3: Field Name Inconsistencies

Each use case expects specific field names. Mismatches cause fallback to hardcoded defaults.

#### Hotel Field Names

| Source | Field Name | Notes |
|--------|------------|-------|
| Code expects | `roomCount` | Primary |
| Code fallback | `numberOfRooms`, `facilitySize`, `rooms` | Aliases |
| DB questions | `roomCount` | ✅ Match |
| StreamlinedWizard | `facilitySize` | ⚠️ Generic - works via alias |

#### EV Charging Field Names

| Source | Field Name | Notes |
|--------|------------|-------|
| Code expects | `level2Count`, `dcFastCount` | Primary (camelCase) |
| Code fallback | `numberOfLevel2Chargers`, `level2Chargers`, `l2Count` | Many aliases |
| DB (COMPREHENSIVE_QUESTIONS) | `dcfastCount`, `level2Count` | ⚠️ `dcfastCount` is lowercase! |
| DB (POPULATE_ALL_QUESTIONS) | `dcfast_150kw` | Different format entirely |
| DB (add_all_custom_questions_fast) | `numberOfDCFastChargers` | Different format |
| StreamlinedWizard passes | `numberOfLevel2Chargers`, `numberOfDCFastChargers` | ✅ Works via alias |

**🔴 CRITICAL:** Multiple inconsistent field names for the same data:
- `dcfastCount` (lowercase 'f' - COMPREHENSIVE_QUESTIONS.sql)
- `dcFastCount` (camelCase - code primary)
- `numberOfDCFastChargers` (verbose - add_all_custom_questions_fast.sql)
- `dcfast_150kw` (snake_case with power - POPULATE_ALL_QUESTIONS.sql)

#### Data Center Field Names

| Source | Field Name | Notes |
|--------|------------|-------|
| Code expects | `itLoadKW`, `rackCount` | Primary |
| Code fallback | `rackDensityKW` | With default 8 |
| DB questions | `itLoadKW`, `rackCount` | ✅ Match |

---

### Issue 4: Hardcoded Defaults That Bypass SSOT

**Location:** `useCasePowerCalculations.ts` switch statement

```typescript
// These defaults are used when fields are missing
case 'hotel':
  const hotelRooms = parseInt(...) || 100;  // 🔴 Hardcoded 100 rooms

case 'airport':
  const rawPassengers = parseFloat(...) || 500000;  // 🔴 Hardcoded 500k passengers

case 'manufacturing':
  ... || 25000  // 🔴 Hardcoded 25k sqft

case 'warehouse':
  ... || 50000  // 🔴 Hardcoded 50k sqft

case 'hospital':
  ... || 200    // 🔴 Hardcoded 200 beds
```

**Impact:** If custom questions fail to load or field names mismatch, users get these arbitrary defaults instead of actual facility-appropriate sizing.

---

## 📋 USE CASE DETAIL BREAKDOWN

### ✅ FULLY COMPLIANT USE CASES

#### 1. Office (`office`)

| Aspect | Value | Source |
|--------|-------|--------|
| **DB Slug** | `office` | seed_use_cases.sql |
| **Code Cases** | `office`, `office-building` | useCasePowerCalculations.ts |
| **Calculator** | `calculateOfficePower(sqFt)` | Line 147 |
| **Expected Field** | `squareFeet`, `officeSqFt`, `buildingSqFt`, `sqFt` | |
| **Default** | 50,000 sq ft | Hardcoded |
| **Custom Questions** | 10 questions | COMPREHENSIVE_QUESTIONS.sql |
| **Questions Fields** | `squareFeet`, `floorCount`, `gridCapacityKW`, etc. | ✅ Match |

**Status:** ✅ Fully compliant

---

#### 2. EV Charging (`ev-charging`)

| Aspect | Value | Source |
|--------|-------|--------|
| **DB Slug** | `ev-charging` | seed_use_cases.sql |
| **Code Cases** | `ev-charging`, `ev-charging-station`, `ev-charging-hub` | |
| **Calculator** | `calculateEVChargingPower()` or `calculateEVHubPower()` | |
| **Expected Fields** | `level1Count`, `level2Count`, `dcFastCount` + granular | |
| **Granular Fields** | `level2_7kw`, `dcfc_150kw`, `hpc_350kw`, etc. | |
| **Custom Questions** | 10 questions | COMPREHENSIVE_QUESTIONS.sql |

**Special Logic:**
```typescript
// Code checks for granular config first, falls back to legacy
const hasGranularConfig = evConfig.level2_7kw > 0 || evConfig.hpc_350kw > 0;
if (hasGranularConfig) {
  // Use calculateEVHubPower() from evChargingCalculations.ts
} else {
  // Use legacy calculateEVChargingPower()
}
```

**Status:** ✅ Fully compliant with dual-path support

---

#### 3. Data Center (`data-center`)

| Aspect | Value | Source |
|--------|-------|--------|
| **DB Slug** | `data-center` | seed_use_cases.sql |
| **Code Cases** | `datacenter`, `data-center`, `edge-data-center` | |
| **Calculator** | `calculateDatacenterPower(itLoadKW, rackCount, rackDensityKW)` | |
| **Expected Fields** | `itLoadKW`, `rackCount`, `rackDensityKW` | |
| **Default Rack Density** | 8 kW/rack | Hardcoded |
| **Custom Questions** | 10 questions | COMPREHENSIVE_QUESTIONS.sql |

**Note:** Code handles `datacenter` (no hyphen) and `data-center` (with hyphen) as aliases.

**Status:** ✅ Compliant

---

### ⚠️ PARTIALLY COMPLIANT USE CASES

#### 4. Hotel (`hotel` / `hotel-hospitality`)

| Aspect | Value | Source |
|--------|-------|--------|
| **DB ID** | `hotel` | seed_use_cases.sql |
| **DB Slug** | `hotel-hospitality` | seed_use_cases.sql |
| **Code Cases** | `hotel`, `hotel-hospitality` | |
| **Calculator** | `calculateHotelPower(roomCount)` | |
| **Expected Fields** | `roomCount`, `numberOfRooms`, `facilitySize`, `rooms` | |
| **Default** | 100 rooms | Hardcoded |
| **Custom Questions** | 11 questions | COMPREHENSIVE_QUESTIONS.sql |

**Issue:** DB has `id='hotel'` but `slug='hotel-hospitality'` which is confusing.

**Custom Questions Fields:**
- `roomCount` ✅
- `squareFeet` ✅
- `gridCapacityKW` ✅
- `hasRestaurant`, `hasPool`, `hasLaundry` ⚠️ (not used by basic calculator)

**Status:** ⚠️ Works but has unused amenity fields in basic calculation

---

#### 5. Hospital (`hospital`)

| Aspect | Value | Source |
|--------|-------|--------|
| **DB Slug** | `hospital` | USE_CASE_DATA_MIGRATION.sql |
| **Code Case** | `hospital` | |
| **Calculator** | `calculateHospitalPower(bedCount)` | |
| **Expected Field** | `bedCount` | |
| **Default** | 200 beds | Hardcoded |
| **Custom Questions** | 11 questions | COMPREHENSIVE_QUESTIONS.sql |

**Unused DB Fields:**
- `operatingRooms` - Not used in calculation
- `hasMRI`, `hasCT` - Not used (should add 50-150kW each!)
- `icuBeds` - Not used

**Potential Enhancement:** Calculator should include imaging equipment load.

**Status:** ⚠️ Works but underestimates hospitals with MRI/CT

---

#### 6. Manufacturing (`manufacturing`)

| Aspect | Value | Source |
|--------|-------|--------|
| **DB Slug** | `manufacturing` | seed_use_cases.sql |
| **Code Case** | `manufacturing` | |
| **Calculator** | `calculateManufacturingPower(sqFt, industryType)` | |
| **Expected Fields** | `squareFeet`, `facilitySqFt`, `sqFt`, `industryType` | |
| **Default** | 25,000 sq ft | Hardcoded |
| **Custom Questions** | 9 questions | COMPREHENSIVE_QUESTIONS.sql |

**Industry Types Supported:**
- `light`: 10 W/sq ft
- `heavy`: 25 W/sq ft
- `electronics`: 18 W/sq ft
- `food`: 15 W/sq ft
- Default: 15 W/sq ft

**Issue:** DB questions don't capture `industryType` - always uses default 15 W/sq ft.

**Status:** ⚠️ Missing industryType question in DB

---

### ⚠️ USE CASES WITH MIGRATION FILES (Not in Main Seed)

#### 7. Agriculture (`agriculture`)

| Aspect | Value | Status |
|--------|-------|--------|
| **DB Entry** | ❌ Not in main seeds | Only equipment templates in migration |
| **Code Cases** | `agriculture`, `agricultural` | Exists |
| **Calculator** | `calculateAgriculturePower(acres, irrigationKW, farmType)` | |
| **Expected Fields** | `acreage`, `farmSize`, `irrigationLoad`, `farmType` | |

**Farm Types Supported:**
- `row-crop`: 0.4 kW/acre
- `dairy`: 1.2 kW/acre
- `greenhouse`: 8.0 kW/acre (!)
- `orchard`: 0.5 kW/acre
- Default: 0.6 kW/acre

**Note:** Equipment templates for Agriculture exist in `USE_CASE_DATA_MIGRATION.sql` (LED Grow Lights, Climate Control, Irrigation) but no use_cases entry.

**Status:** ⚠️ Has equipment templates, missing use_cases entry

---

#### 8. Casino (`casino`)

| Aspect | Value | Status |
|--------|-------|--------|
| **DB Entry** | ✅ In migration files | `add_missing_use_case_configs.sql`, `ADD_REMAINING_QUESTIONS.sql` |
| **Code Cases** | `casino`, `tribal-casino` | Exists |
| **Calculator** | `calculateCasinoPower(gamingFloorSqFt)` | |
| **Expected Fields** | `gamingFloorSqFt`, `gamingFloorSize`, `sqFt` | |
| **Power Density** | 18 W/sq ft (24/7 operation) | |
| **Custom Questions** | 9 questions | `ADD_REMAINING_QUESTIONS.sql` |

**Questions Fields:**
- `gamingFloorSqFt` ✅ Match
- `squareFeet` ✅ Match
- `slotCount` ⚠️ Not used in calculation
- `hasHotel`, `hasRestaurants` ⚠️ Not used in calculation

**Status:** ✅ Has DB entry in migrations - needs verification it's deployed

---

#### 9. Gas Station (`gas-station`)

| Aspect | Value | Status |
|--------|-------|--------|
| **DB Entry** | ✅ In migration files | `add_missing_use_case_configs.sql`, `ADD_REMAINING_QUESTIONS.sql` |
| **Code Cases** | `gas-station`, `fuel-station` | Exists |
| **Calculator** | `calculateGasStationPower(dispenserCount, hasConvenienceStore)` | |
| **Expected Fields** | `dispenserCount`, `hasConvenienceStore` | |
| **Custom Questions** | 10 questions | `ADD_REMAINING_QUESTIONS.sql` |

**Questions Fields:**
- `dispenserCount` ⚠️ vs `fuelDispensers` in some migrations
- `storeSqFt` ⚠️ Not directly used (code uses `hasConvenienceStore` boolean)
- `hasCarWash`, `hasFoodService` ⚠️ Not used in calculation

**Status:** ✅ Has DB entry in migrations - field name mismatch possible

---

#### 10. Warehouse (`warehouse`)

| Aspect | Value | Status |
|--------|-------|--------|
| **DB Entry** | ⚠️ May exist as `distribution-center` | Unclear |
| **Code Cases** | `warehouse`, `logistics`, `logistics-center`, `distribution-center` | |
| **Calculator** | `calculateWarehousePower(sqFt, isColdStorage)` | |
| **Expected Fields** | `squareFeet`, `warehouseSqFt`, `sqFt`, `isColdStorage` | |

**Custom Questions (for `warehouse` slug):** 9 questions in COMPREHENSIVE_QUESTIONS.sql

**Issue:** DB may have `distribution-center` but code has `warehouse` as primary.

**Status:** ⚠️ Slug mismatch possible

---

## 📊 CUSTOM QUESTIONS COVERAGE

### Questions in Database vs Required by Calculator

| Use Case | DB Questions | Calculator Uses | Gap |
|----------|-------------|-----------------|-----|
| office | 10 | 1 (sqFt) | Extras unused |
| hotel | 11 | 1 (rooms) | Amenity questions unused |
| hospital | 11 | 1 (beds) | MRI/CT unused! |
| data-center | 11 | 3 (IT, racks, density) | ✅ Good coverage |
| ev-charging | 11 | 3+ (charger counts) | ✅ Good coverage |
| car-wash | 9 | 2 (bays, washType) | ✅ Good coverage |
| manufacturing | 9 | 2 (sqFt, industryType) | ⚠️ Missing industryType question |
| warehouse | 9 | 2 (sqFt, isColdStorage) | ⚠️ Verify isColdStorage field |
| airport | 12 | 1 (passengers) | Most unused |
| college | 9 | 1 (students) | Most unused |
| cold-storage | 9 | 1 (sqFt) | ✅ Works |

---

## 🔧 RECOMMENDATIONS

### Priority 1: Standardize EV Charging Field Names (🔴 HIGH)

The EV charging field names are chaotic. Standardize to ONE format:

**Recommended:** Use `dcFastCount`, `level2Count` (camelCase, consistent with code)

Update these SQL files:
- `database/COMPREHENSIVE_QUESTIONS.sql`: Change `dcfastCount` → `dcFastCount`
- `database/POPULATE_ALL_QUESTIONS.sql`: Change `dcfast_150kw` → `dcFastCount`
- `database/add_all_custom_questions_fast.sql`: Keep `numberOfDCFastChargers` as alias

### Priority 2: Verify Migration Deployments (🟡 MEDIUM)

These use cases have migrations but may not be deployed:
- `casino` - In `add_missing_use_case_configs.sql`
- `gas-station` - In `add_missing_use_case_configs.sql`
- `government` - In `07_CASINO_GASSTATION_GOVERNMENT.sql`

Run verification query:
```sql
SELECT slug, name, is_active 
FROM use_cases 
WHERE slug IN ('casino', 'gas-station', 'government');
```

### Priority 3: Add Agriculture Use Case (🔴 HIGH)

Agriculture is completely missing from `use_cases` table despite:
- Having a calculator in code (`calculateAgriculturePower`)
- Having equipment templates in DB

Add to `seed_use_cases.sql`:
```sql
INSERT INTO use_cases (id, slug, name, description, category, display_order, required_tier) VALUES
  ('agriculture', 'agriculture', 'Agriculture & Farming', 'Farms with irrigation, dairy, or greenhouse operations', 'agricultural', 15, 'PREMIUM');
```

### Priority 4: Enhance Calculations to Use Collected Fields (🟡 MEDIUM)

Current calculators are too simple. They should use the rich data collected:

**Hospital Enhancement:**
```typescript
function calculateHospitalPower(data: Record<string, any>): PowerCalculationResult {
  let powerKW = data.bedCount * 10; // Base
  
  // Add imaging equipment (currently ignored!)
  if (data.hasMRI) powerKW += 100;  // MRI = 50-150kW
  if (data.hasCT) powerKW += 80;    // CT = 80-120kW
  
  // ICU beds need more power
  const icuBeds = data.icuBeds || 0;
  powerKW += icuBeds * 5;  // Extra 5kW per ICU bed
  
  // Operating rooms
  const orRooms = data.operatingRooms || 0;
  powerKW += orRooms * 50;  // 50kW per OR
  
  return { powerMW: powerKW / 1000, ... };
}
```

**Casino Enhancement:**
```typescript
function calculateCasinoPower(data: Record<string, any>): PowerCalculationResult {
  let powerKW = data.gamingFloorSqFt * 0.018 * 1000; // 18 W/sq ft base
  
  // Slot machines (currently ignored!)
  const slots = data.slotCount || 0;
  powerKW += slots * 0.3;  // ~300W per slot machine
  
  // Hotel rooms (currently ignored!)
  if (data.hasHotel && data.hotelRooms) {
    powerKW += data.hotelRooms * 2.5;
  }
  
  return { powerMW: powerKW / 1000, ... };
}
```

### Priority 5: Add Validation Layer (🟡 MEDIUM)

Create a validation service that checks:
1. All expected fields are present before calculation
2. Field values are within reasonable ranges
3. Log warnings when falling back to defaults

```typescript
// src/services/useCaseValidation.ts
const USE_CASE_FIELD_REQUIREMENTS: Record<string, string[]> = {
  'hotel': ['roomCount'],
  'hospital': ['bedCount'],
  'ev-charging': ['dcFastCount', 'level2Count'],
  'data-center': ['itLoadKW', 'rackCount'],
  // etc.
};

function validateUseCaseData(slug: string, data: Record<string, any>): ValidationResult {
  const expectedFields = USE_CASE_FIELD_REQUIREMENTS[slug] || [];
  const missing = expectedFields.filter(f => !data[f] && !getAliasValue(f, data));
  
  if (missing.length > 0) {
    console.warn(`[SSOT Validation] Missing fields for ${slug}:`, missing);
  }
  
  return { isValid: missing.length === 0, missing };
}
```

### Priority 6: Document Field Aliases (📝 DOCUMENTATION)

Create a mapping table in code that documents all field aliases:

```typescript
// src/services/fieldAliases.ts
export const FIELD_ALIASES: Record<string, string[]> = {
  'roomCount': ['numberOfRooms', 'facilitySize', 'rooms'],
  'dcFastCount': ['numberOfDCFastChargers', 'dcFastChargers', 'dcfc', 'dcfastCount'],
  'level2Count': ['numberOfLevel2Chargers', 'level2Chargers', 'l2Count'],
  'squareFeet': ['sqFt', 'facilitySqFt', 'buildingSqFt', 'officeSqFt'],
  // etc.
};

export function getFieldValue(fieldName: string, data: Record<string, any>): any {
  if (data[fieldName] !== undefined) return data[fieldName];
  
  const aliases = FIELD_ALIASES[fieldName] || [];
  for (const alias of aliases) {
    if (data[alias] !== undefined) return data[alias];
  }
  
  return undefined;
}
```

---

## 📁 FILES INVOLVED IN DATA FLOW

### Source of Truth Files (DO NOT MODIFY without review)

| File | Purpose |
|------|---------|
| `src/services/useCasePowerCalculations.ts` | Power calculation switch statement |
| `src/services/evChargingCalculations.ts` | EV-specific calculations |
| `src/services/useCaseService.ts` | Database access for templates |
| `src/services/unifiedQuoteCalculator.ts` | Quote orchestration |

### Database Seeds

| File | Purpose |
|------|---------|
| `database/seed_use_cases.sql` | Basic use case entries |
| `database/COMPREHENSIVE_QUESTIONS.sql` | Custom questions per use case |
| `docs/USE_CASE_DATA_MIGRATION.sql` | Extended use cases + configs |
| `docs/SEED_INITIAL_DATA.sql` | Additional templates |

### UI Components

| File | Purpose |
|------|---------|
| `src/components/wizard/StreamlinedWizard.tsx` | Main wizard flow |
| `src/components/verticals/HotelWizard.tsx` | Hotel-specific wizard |
| `src/components/verticals/CarWashWizard.tsx` | Car wash-specific wizard |
| `src/components/verticals/EVChargingWizard.tsx` | EV charging-specific wizard |

---

## 📝 CHANGELOG

- **Dec 9, 2025:** Initial comprehensive audit created
- Previous: Various updates per copilot-instructions.md

---

## ✅ ACTION ITEMS

### Immediate (🔴 High Priority)
- [ ] Standardize EV charging field names to `dcFastCount` (camelCase)
- [ ] Add `agriculture` use case to main seed file
- [ ] Verify casino/gas-station/government migrations are deployed

### Short-Term (🟡 Medium Priority)
- [ ] Enhance hospital calculator to use `hasMRI`, `hasCT`, `operatingRooms`
- [ ] Add `industryType` question to manufacturing use case
- [ ] Create field alias mapping utility
- [ ] Add validation layer for use case data

### Long-Term (📝 Documentation)
- [ ] Create SSOT field requirements documentation
- [ ] Add automated tests for field name resolution
- [ ] Audit all wizards for direct calculation bypasses
- [ ] Update CALCULATION_FILES_AUDIT.md with field requirements

---

## 📊 FULL SLUG MATRIX

| Code Slug | DB Slug | DB Status | Custom Questions | Calculator |
|-----------|---------|-----------|------------------|------------|
| `office` | `office` | ✅ Main seed | ✅ 10 questions | `calculateOfficePower` |
| `hotel` | `hotel-hospitality` | ✅ Main seed | ✅ 11 questions | `calculateHotelPower` |
| `hospital` | `hospital` | ✅ Migration | ✅ 11 questions | `calculateHospitalPower` |
| `data-center` | `data-center` | ✅ Main seed | ✅ 11 questions | `calculateDatacenterPower` |
| `ev-charging` | `ev-charging` | ✅ Main seed | ✅ 11 questions | `calculateEVChargingPower` |
| `manufacturing` | `manufacturing` | ✅ Main seed | ✅ 9 questions | `calculateManufacturingPower` |
| `retail` | `retail` | ✅ Main seed | ❓ Unverified | `calculateRetailPower` |
| `residential` | `residential` | ✅ Main seed | ❓ Unverified | Custom inline |
| `microgrid` | `microgrid` | ✅ Main seed | ❓ Unverified | Custom inline |
| `car-wash` | `car-wash` | ✅ Migration | ✅ 9 questions | `calculateCarWashPower` |
| `airport` | `airport` | ✅ Migration | ✅ 12 questions | `calculateAirportPower` |
| `college` | `college` | ✅ Migration | ✅ 9 questions | `calculateCollegePower` |
| `warehouse` | `warehouse` | ⚠️ Verify | ✅ 9 questions | `calculateWarehousePower` |
| `cold-storage` | `cold-storage` | ⚠️ Verify | ✅ 9 questions | `calculateWarehousePower(cold)` |
| `shopping-center` | `shopping-center` | ✅ Migration | ❓ Unverified | `calculateShoppingCenterPower` |
| `indoor-farm` | `indoor-farm` | ✅ Migration | ❓ Unverified | `calculateIndoorFarmPower` |
| `casino` | `casino` | ⚠️ Migration only | ✅ 9 questions | `calculateCasinoPower` |
| `gas-station` | `gas-station` | ⚠️ Migration only | ✅ 10 questions | `calculateGasStationPower` |
| `government` | `government` | ⚠️ Migration only | ❓ Unverified | `calculateGovernmentPower` |
| `apartments` | `apartments` | ✅ Migration | ❓ Unverified | `calculateApartmentPower` |
| `agriculture` | ❌ Missing | ❌ Not in DB | ❌ None | `calculateAgriculturePower` |

**Legend:**
- ✅ Confirmed exists and working
- ⚠️ Exists in migrations, verify deployment
- ❌ Missing, needs to be added
- ❓ Needs verification
