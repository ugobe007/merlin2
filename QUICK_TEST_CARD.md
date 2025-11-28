# Quick Test Reference Card

## 🎯 Your 2 Critical Test Cases

### 1️⃣ DATA CENTER TEST
```
Template: datacenter
Inputs:
  - capacity: 250 MW
  - tier: tier3
  - rackCount: 5000
  - gridConnection: limited
  - gridCapacity: 50 MW

Expected Result: ✅
  - BESS Power: 150 MW (250 × 0.6)
  - Duration: 4-6 hr
  - Generation Required: YES
  - Power Gap: 200 MW (250 - 50)

Before Bug: ❌ Showed 75 MW (WRONG)
After Fix: ✅ Should show 150 MW (CORRECT)
```

### 2️⃣ HOTEL TEST
```
Template: hotel
Inputs:
  - numRooms: 500
  - numberOfRooms: 500
  - amenities: [pool, restaurant, gym, laundry]
  - evChargingPorts: 12
  - gridConnection: limited
  - gridCapacity: 15 MW

Expected Result: ✅
  - BESS Power: ~1.5-1.7 MW
  - Peak Demand: ~1.7 MW
  - Generation Required: NO
  - Message: "✅ No Power Gap - Generation optional"
  - Color: GREEN

Before Bug: ❌ Confusing "continuous power" message
After Fix: ✅ Clear green "No Power Gap" message
```

---

## 🚀 Fastest Test Method

### Browser Console Test (30 seconds)
1. Run: `npm run dev`
2. Open browser console: Press **F12**
3. Copy file: `public/test-use-cases-browser.js`
4. Paste in console and press **Enter**
5. View results table

✅ Tests all 18 use cases automatically  
✅ Shows pass/fail for each  
✅ Displays results in table format

---

## 📊 All 18 Test Cases

| # | Use Case | Expected Power | Notes |
|---|----------|----------------|-------|
| 1 | Car Wash (4 bay) | 0.15-0.25 MW | Peak shaving |
| 2 | Apartment (200 units) | 0.8-1.5 MW | Multifamily |
| 3 | University (10K students) | 4-8 MW | Large campus |
| 4 | Office Small (50K sqft) | 0.25-0.4 MW | Class A |
| 5 | Office Large (250K sqft) | 1.0-2.0 MW | Complex |
| 6 | EV Urban (10L2+4DC) | 0.4-0.8 MW | Limited grid |
| 7 | EV Highway (20 DC) | 1.5-2.5 MW | Fast charging |
| 8 | Shopping (150K sqft) | 1.2-2.0 MW | Retail complex |
| 9 | Indoor Farm (50K sqft) | 1.5-2.5 MW | Vertical farm |
| 10 | Casino (80K gaming) | 2.0-3.5 MW | 24/7 ops |
| 11 | Government (100K sqft) | 0.5-0.8 MW | Municipal |
| 12 | Retail (50K big box) | 0.4-0.8 MW | Single store |
| 13 | Logistics (500K sqft) | 2.5-4.0 MW | Fulfillment |
| 14 | Warehouse (300K cold) | 3.0-5.0 MW | Refrigeration |
| 15 | Manufacturing Light | 2.0-4.0 MW | Assembly |
| 16 | Manufacturing Heavy | 4.0-8.0 MW | Industrial |
| 17 | **Datacenter (250 MW)** | **150 MW** | **YOUR TEST** |
| 18 | **Hotel (500 rooms)** | **1.5-1.7 MW** | **YOUR TEST** |

---

## ✅ Success Checklist

- [ ] Data center shows 150 MW (not 75 MW)
- [ ] Hotel shows green "No Power Gap" message
- [ ] EV load included in hotel calculation
- [ ] No TypeScript errors
- [ ] No crashes
- [ ] All 18 tests return reasonable values

---

## 📁 Key Files

**Testing:**
- `TESTING_READY.md` - Full summary
- `MANUAL_TESTING_CHECKLIST.md` - Step-by-step guide
- `public/test-use-cases-browser.js` - Browser test script

**Architecture:**
- `ARCHITECTURAL_CLEANUP_PLAN.md` - Full cleanup strategy
- `CLEANUP_PROGRESS_PHASE1.md` - Phase 1 summary
- `DEAD_CODE_AUDIT.md` - What we removed

**Code:**
- `src/services/baselineService.ts` - 74 lines removed
- `src/components/wizard/steps/Step3_AddRenewables.tsx` - Messaging fixed

---

## 🆘 If Tests Fail

1. **Check console for errors** - TypeScript issues?
2. **Verify inputs** - Are field names correct?
3. **Review baselineService.ts** - Did Phase 1 cleanup work?
4. **Test datacenter first** - Should show 150 MW
5. **Test hotel second** - Should show green message
6. **Report results** - Which tests passed/failed?

---

## 📞 What to Report Back

```
QUICK TEST RESULTS:

Datacenter (250 MW, Tier 3):
  Actual Power: _____ MW
  Expected: 150 MW
  Status: ✅ PASS / ❌ FAIL

Hotel (500 rooms, 12 EV):
  Actual Power: _____ MW
  Expected: 1.5-1.7 MW
  Message Color: _____
  Status: ✅ PASS / ❌ FAIL

Other tests:
  Passed: ____ / 16
  Failed: ____ / 16

Overall: ✅ READY FOR DEMOS / ❌ NEEDS FIXES
```

---

**Last Updated:** November 18, 2025  
**Phase 1:** ✅ Complete (74 lines dead code removed)  
**Phase 2:** ⏳ Pending (after test validation)  
**Demo Status:** 🧪 Ready for Testing
