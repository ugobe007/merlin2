# Manual Testing Checklist - All Use Cases
**Date:** November 18, 2025  
**Goal:** Verify calculateDatabaseBaseline() works correctly for customer demos

---

## How to Test

### Option 1: Browser Console (Easiest)
1. Open your app in browser: `npm run dev`
2. Open browser console (F12)
3. Copy/paste contents of `public/test-use-cases-browser.js`
4. Press Enter - will run all 18 tests automatically

### Option 2: Manual Testing in App
Go through Smart Wizard for each use case below and verify baseline calculations

---

## Test Cases

### ✅ 1. CAR WASH
**Template:** car-wash  
**Input:**
- Number of bays: 4
- Heated water: Yes
- Grid connection: Reliable

**Expected Result:**
- Power: 0.15 - 0.25 MW
- Duration: 2-4 hours
- Notes: Small peak shaving application

---

### ✅ 2. APARTMENT BUILDING
**Template:** apartment  
**Input:**
- Units: 200
- Building type: Mid-rise
- Grid connection: Reliable

**Expected Result:**
- Power: 0.8 - 1.5 MW
- Duration: 4 hours
- Notes: Multifamily peak demand management

---

### ✅ 3. UNIVERSITY
**Template:** college  
**Input:**
- Enrollment: 10,000 students
- Campus size: Large
- Grid connection: Reliable

**Expected Result:**
- Power: 4 - 8 MW
- Duration: 5 hours
- Notes: Large campus with research facilities

---

### ✅ 4. OFFICE BUILDING - Small
**Template:** office  
**Input:**
- Square footage: 50,000
- Building class: Class A
- Grid connection: Reliable

**Expected Result:**
- Power: 0.25 - 0.4 MW
- Duration: 3 hours
- Notes: Commercial office peak shaving

---

### ✅ 5. OFFICE BUILDING - Large
**Template:** office  
**Input:**
- Square footage: 250,000
- Building class: Class A
- Grid connection: Reliable

**Expected Result:**
- Power: 1.0 - 2.0 MW
- Duration: 3-4 hours
- Notes: Large commercial office complex

---

### ✅ 6. EV CHARGING - Urban Station
**Template:** ev-charging  
**Input:**
- Level 2 chargers: 10 (7 kW each)
- DC Fast chargers: 4 (150 kW each)
- Station type: Public urban
- Grid connection: Limited
- Grid capacity: 0.5 MW (500 kW)

**Expected Result:**
- Power: 0.4 - 0.8 MW
- Duration: 2 hours
- Generation required: YES (grid gap exists)
- Notes: Demand charge management

---

### ✅ 7. EV CHARGING - Highway Station
**Template:** ev-charging  
**Input:**
- Level 2 chargers: 0
- DC Fast chargers: 20 (150 kW each)
- Station type: Highway
- Grid connection: On-grid

**Expected Result:**
- Power: 1.5 - 2.5 MW
- Duration: 2 hours
- Notes: High-power fast charging hub

---

### ✅ 8. SHOPPING CENTER
**Template:** shopping-center  
**Input:**
- Square footage: 150,000
- Number of stores: 25
- Grid connection: Reliable

**Expected Result:**
- Power: 1.2 - 2.0 MW
- Duration: 3-4 hours
- Notes: Retail peak demand reduction

---

### ✅ 9. INDOOR FARM
**Template:** indoor-farm  
**Input:**
- Cultivation area: 50,000 sq ft
- Crop type: Leafy greens
- Grid connection: Reliable

**Expected Result:**
- Power: 1.5 - 2.5 MW
- Duration: 4 hours
- Notes: High power density (grow lights + HVAC)

---

### ✅ 10. CASINO
**Template:** tribal-casino  
**Input:**
- Gaming floor: 80,000 sq ft
- Hotel rooms: 200
- Restaurants: 3
- Grid connection: Reliable

**Expected Result:**
- Power: 2.0 - 3.5 MW
- Duration: 4-6 hours
- Notes: 24/7 operations, high uptime requirements

---

### ✅ 11. GOVERNMENT BUILDING
**Template:** office (government uses office template)  
**Input:**
- Square footage: 100,000
- Building type: Government
- Grid connection: Reliable

**Expected Result:**
- Power: 0.5 - 0.8 MW
- Duration: 3 hours
- Notes: Municipal building with backup requirements

---

### ✅ 12. RETAIL STORE
**Template:** retail  
**Input:**
- Store size: 50,000 sq ft
- Store type: Big box
- Grid connection: Reliable

**Expected Result:**
- Power: 0.4 - 0.8 MW
- Duration: 3 hours
- Notes: Single large retail location

---

### ✅ 13. LOGISTICS CENTER
**Template:** logistics-center  
**Input:**
- Facility size: 500,000 sq ft
- Automation level: High
- Operating hours: 24/7
- Grid connection: Reliable

**Expected Result:**
- Power: 2.5 - 4.0 MW
- Duration: 3-4 hours
- Notes: Automated warehousing with conveyors

---

### ✅ 14. WAREHOUSE (Cold Storage)
**Template:** warehouse  
**Input:**
- Facility size: 300,000 sq ft
- Warehouse type: Cold storage
- Temperature: Refrigerated
- Grid connection: Reliable

**Expected Result:**
- Power: 3.0 - 5.0 MW
- Duration: 3-4 hours
- Notes: High power for refrigeration loads

---

### ✅ 15. MANUFACTURING - Light Assembly
**Template:** manufacturing  
**Input:**
- Facility size: 200,000 sq ft
- Manufacturing type: Light assembly
- Production lines: 3
- Operating hours: 16/5
- Grid connection: Reliable

**Expected Result:**
- Power: 2.0 - 4.0 MW
- Duration: 4 hours
- Notes: Industrial production facility

---

### ✅ 16. MANUFACTURING - Heavy Industry
**Template:** manufacturing  
**Input:**
- Facility size: 400,000 sq ft
- Manufacturing type: Heavy industrial
- Production lines: 5
- Operating hours: 24/7
- Grid connection: Limited
- Grid capacity: 5 MW

**Expected Result:**
- Power: 4.0 - 8.0 MW
- Duration: 4-6 hours
- Generation required: Possibly (check grid gap)
- Notes: Heavy industrial with limited grid

---

### ✅ 17. DATA CENTER (Your Test Case)
**Template:** datacenter  
**Input:**
- Capacity: 250 MW
- Tier: Tier 3
- Rack count: 5,000
- Grid connection: Limited
- Grid capacity: 50 MW

**Expected Result:**
- Power: **150 MW** (250 × 0.6 for Tier 3 + limited grid)
- Duration: 4-6 hours
- Generation required: YES (250 MW peak > 50 MW grid)
- Generation recommended: 200 MW (250 - 50)
- Notes: **This was showing 75 MW before - should now be 150 MW**

**Critical Check:**
- ✅ BESS sizing uses Tier 3 multiplier (0.6)
- ✅ Grid analysis shows power gap of 200 MW
- ✅ Message explains generation required

---

### ✅ 18. HOTEL (Your Test Case)
**Template:** hotel  
**Input:**
- Rooms: 500
- Occupancy: 60%
- Amenities: Pool, Restaurant, Gym, Laundry
- EV charging ports: 12
- Grid connection: Limited
- Grid capacity: 15 MW

**Expected Result:**
- Power: **1.5-1.7 MW** (500 rooms × 2.93 kW/room + 0.2 MW EV)
- Peak demand: ~1.7 MW total
- Duration: 4-5 hours
- Generation required: **NO** (peak 1.7 MW < grid 15 MW)
- Message: **"✅ No Power Gap - Grid adequate"**
- Notes: **Should show GREEN message, not confusing power message**

**Critical Check:**
- ✅ EV charger load added (12 ports × ~17 kW = 0.2 MW)
- ✅ Grid analysis shows NO gap (1.7 MW < 15 MW)
- ✅ Step3 shows green "No Power Gap" message
- ✅ Generation is OPTIONAL, not required

---

## Success Criteria

### Must Pass:
1. ✅ All calculations return reasonable power/duration values
2. ✅ No TypeScript errors
3. ✅ No crashes or exceptions
4. ✅ Data center shows 150 MW (not 75 MW)
5. ✅ Hotel shows "No Power Gap" message
6. ✅ EV charger loads are included in calculations
7. ✅ Grid analysis works for limited/off-grid scenarios

### Nice to Have:
- All results fall within expected ranges
- Consistent behavior across similar use cases
- Clear messaging about generation requirements

---

## Quick Test Commands

```bash
# Start dev server
npm run dev

# Option 1: Browser console test (copy public/test-use-cases-browser.js)
# Option 2: Manual testing through wizard
```

---

## Results Template

```
TEST RUN: [Date/Time]
TESTER: [Your Name]

Data Center (250 MW, Tier 3, Limited Grid):
- Power: _____ MW (expected 150 MW)
- Grid gap shown: _____ MW (expected 200 MW)
- Status: ✅ PASS / ❌ FAIL

Hotel (500 rooms, 12 EV, Limited 15 MW Grid):
- Power: _____ MW (expected 1.5-1.7 MW)
- Peak demand: _____ MW
- Message: _____ (expected "No Power Gap")
- EV load included: ✅ YES / ❌ NO
- Status: ✅ PASS / ❌ FAIL

[Repeat for other use cases...]

OVERALL: ___/18 tests passed
```

---

## Notes

- **Phase 1 Complete:** 74 lines of dead code removed
- **Next:** Phase 2 will consolidate grid analysis into shared function
- **Timeline:** Test before customer demos this week
