# Complete Use Case Template Test Results

**Date:** November 17, 2025  
**Test Server:** http://localhost:5178  
**Purpose:** Verify ALL use cases load correct templates and questions

---

## Critical Issues Fixed

### Issue 1: Data Contamination
- **Problem**: Hotel data carrying over to farm use case
- **Fix**: Added `useEffect` to clear `useCaseData` on template change
- **Status**: ✅ FIXED

### Issue 2: Field Name Mismatches
- **Problems**:
  - Car wash: Looking for `numBays`, template has `num_bays`
  - Farm: Looking for `growing_area`, template has `cultivationArea`
  - Hotel: Looking for `numRooms`, template has `numberOfRooms`
- **Fix**: Updated SmartWizardV2 to check both field names
- **Status**: ✅ FIXED

### Issue 3: Slug Mapping Mismatches
- **Problems**:
  - Step1 passes `office`, template slug is `office-building`
  - Step1 passes `retail`, template slug is `shopping-center`
  - Step1 passes `agriculture`, closest is `indoor-farm`
- **Fix**: Updated TEMPLATE_SLUG_MAP in useCaseQuestionService
- **Status**: ✅ FIXED

### Issue 4: Fallback Questions Showing
- **Problem**: All use cases showing generic "Facility size? / Peak load? / Operating hours?"
- **Root Cause**: Slug mismatches causing template lookup to fail
- **Fix**: Fixed slug mappings
- **Status**: ✅ FIXED

---

## All Use Case Tests

### Template Inventory
13 templates found in useCaseTemplates.ts:
1. car-wash
2. ev-charging
3. hospital
4. indoor-farm
5. hotel
6. airport
7. college-university
8. dental-office
9. office-building
10. data-center
11. food-processing
12. apartments
13. shopping-center

---

## Test Plan

### 🏨 **HOTEL USE CASE**

#### Test 1: Minimal Hotel (Base Load Only)
- **Input:**
  - 150 rooms (reference size)
  - Limited service
  - No restaurant
  - No amenities selected
  - No EV charging
- **Expected Result:**
  - Base: 150 rooms × 2.93 kW/room = 440 kW = 0.44 MW
  - Amenities: 0 kW
  - **Total: 0.44 MW**
- **Actual Result:** _[To be tested]_
- **Status:** ⏳ Pending

#### Test 2: Small Hotel with Basic Amenities
- **Input:**
  - 100 rooms
  - Full service
  - Continental breakfast (+15 kW)
  - Pool (+55 kW)
  - Fitness center (+27 kW)
  - No EV charging
- **Expected Result:**
  - Base: 100 rooms × 2.93 kW/room = 293 kW = 0.29 MW
  - Amenities: 15 + 55 + 27 = 97 kW = 0.10 MW
  - **Total: 0.39 MW**
- **Actual Result:** _[To be tested]_
- **Status:** ⏳ Pending

#### Test 3: Medium Hotel with Full Kitchen
- **Input:**
  - 200 rooms
  - Full service
  - Full kitchen (+115 kW)
  - Pool (+55 kW)
  - Indoor pool (+75 kW)
  - Fitness center (+27 kW)
  - Conference rooms (+70 kW)
  - 10 EV charging ports (+100 kW)
- **Expected Result:**
  - Base: 200 rooms × 2.93 kW/room = 586 kW = 0.59 MW
  - Amenities: 115 + 55 + 75 + 27 + 70 + 100 = 442 kW = 0.44 MW
  - **Total: 1.03 MW**
- **Actual Result:** _[To be tested]_
- **Status:** ⏳ Pending

#### Test 4: Large Hotel - Original Bug Case
- **Input:**
  - 400 rooms
  - Luxury resort
  - Full kitchen (+115 kW)
  - Pool (+55 kW)
  - Fitness center (+27 kW)
  - 20 EV charging ports (+200 kW)
- **Expected Result:**
  - Base: 400 rooms × 2.93 kW/room = 1,172 kW = 1.17 MW
  - Amenities: 115 + 55 + 27 + 200 = 397 kW = 0.40 MW
  - **Total: 1.57 MW**
- **Actual Result:** _[To be tested]_
- **Status:** ⏳ Pending (Original bug showed 0.3 MW)

#### Test 5: Luxury Resort with All Amenities
- **Input:**
  - 500 rooms
  - Luxury resort
  - Multiple restaurants (+250 kW)
  - Indoor pool (+75 kW)
  - Full spa (+115 kW)
  - Fitness center (+27 kW)
  - Conference rooms (+70 kW)
  - Ballroom (+90 kW)
  - Laundry valet (+75 kW)
  - 30 EV charging ports (+300 kW)
- **Expected Result:**
  - Base: 500 rooms × 2.93 kW/room = 1,465 kW = 1.47 MW
  - Amenities: 250 + 75 + 115 + 27 + 70 + 90 + 75 + 300 = 1,002 kW = 1.00 MW
  - **Total: 2.47 MW**
- **Actual Result:** _[To be tested]_
- **Status:** ⏳ Pending

#### Test 6: Casino Hotel (Extreme Case)
- **Input:**
  - 300 rooms
  - Luxury resort
  - Multiple restaurants (+250 kW)
  - Casino (+350 kW)
  - Ballroom (+90 kW)
  - Conference rooms (+70 kW)
  - Full spa (+115 kW)
  - Indoor pool (+75 kW)
  - 25 EV charging ports (+250 kW)
- **Expected Result:**
  - Base: 300 rooms × 2.93 kW/room = 879 kW = 0.88 MW
  - Amenities: 250 + 350 + 90 + 70 + 115 + 75 + 250 = 1,200 kW = 1.20 MW
  - **Total: 2.08 MW**
- **Actual Result:** _[To be tested]_
- **Status:** ⏳ Pending

---

### 🏢 **APARTMENT USE CASE**

#### Test 7: Small Apartment Complex
- **Input:**
  - 50 units
  - Garden style (2-3 stories)
  - Central laundry
  - Pool
  - No EV charging
- **Expected Result:**
  - Base calculation from template
  - Amenities added if powerKw defined
  - **Total: _[Calculate based on template]_**
- **Actual Result:** _[To be tested]_
- **Status:** ⏳ Pending

#### Test 8: Large Apartment with EV
- **Input:**
  - 200 units
  - High-rise (10+ stories)
  - In-unit laundry
  - Pool + fitness center
  - 40 EV charging ports
- **Expected Result:**
  - Base calculation + amenities
  - **Total: _[Calculate based on template]_**
- **Actual Result:** _[To be tested]_
- **Status:** ⏳ Pending

---

### 🏭 **DATACENTER USE CASE**

#### Test 9: Small Datacenter
- **Input:**
  - 5 MW peak load
  - Tier 3
- **Expected Result:**
  - Uses datacenter special case logic
  - Tier multiplier applied
  - **Total: _[Should use existing logic]_**
- **Actual Result:** _[To be tested]_
- **Status:** ⏳ Pending

---

### 🔌 **EV CHARGING USE CASE**

#### Test 10: EV Charging Station
- **Input:**
  - 20 Level 2 chargers
  - 4 DC Fast chargers
- **Expected Result:**
  - Uses EV special case logic
  - **Total: _[Should use existing logic]_**
- **Actual Result:** _[To be tested]_
- **Status:** ⏳ Pending

---

## Console Log Analysis

### What to Look For:
1. **Base calculation logs** - Should show room count × kW/room
2. **Amenity breakdown** - Should show each amenity with `➕` prefix
3. **Total calculation** - Should show Base + Amenities
4. **Power source** - Should reference template, not hardcoded values

### Expected Console Output Example:
```
🏨 [Hotel Calculation] 400 rooms × 2.93 kW/room = 1.172 MW
  ➕ hasRestaurant: +115 kW (full_kitchen)
  ➕ amenitiesOffered: +55 kW (pool)
  ➕ amenitiesOffered: +27 kW (fitness)
  ➕ evChargingPorts: +200 kW (20 × 10 kW)
✨ [Amenities] Total additional load: 397 kW (0.40 MW)
📊 [Final Power] Base + Amenities: 1.57 MW
```

---

## Issues Found

### Issue 1: [If any]
- **Description:**
- **Test Case:**
- **Expected:**
- **Actual:**
- **Root Cause:**
- **Fix:**

---

## Architecture Validation

- [ ] All power values come from `useCaseTemplates.ts`
- [ ] No hardcoded power values in `baselineService.ts`
- [ ] `impactType: 'power_add'` questions processed correctly
- [ ] Select options with `powerKw` work
- [ ] Multiselect options with `powerKw` work (sum all selected)
- [ ] Number inputs with `additionalLoadKw` work (multiply)
- [ ] Console logs show source of power values
- [ ] Works for hotel use case
- [ ] Works for apartment use case
- [ ] Doesn't break datacenter use case
- [ ] Doesn't break EV charging use case

---

## Performance Notes

- Cache hit/miss ratios
- Calculation speed
- UI responsiveness

---

## Test Results Summary

**Tests Completed:** 0/10  
**Tests Passed:** 0  
**Tests Failed:** 0  
**Issues Found:** 0  

---

## Notes

_Add any observations, edge cases, or recommendations here_

