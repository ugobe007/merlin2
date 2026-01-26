# BUTTON MAPPING AUDIT - January 26, 2026

## 🚨 ISSUE REPORT

**Problem**: Infinite loop + some buttons work, some don't work
**Root Cause**: NOT YET DETERMINED - Need runtime diagnostics
**Status**: ⚠️ DEBUG LOGGING ADDED - Awaiting user testing

---

## ✅ WHAT WE FIXED

### 1. Comprehensive Debug Logging Added
Added 3-tier logging to trace button clicks through entire chain:

**Level 1: Button Click (PanelButtonGroup.tsx)**
```
🔘 [PanelButtonGroup] Button clicked: {
  questionField: "hotelClass",
  optionValue: "luxury",
  currentValue: "midscale",
  willCallOnChange: true
}
```

**Level 2: Question Renderer (CompleteQuestionRenderer.tsx)**
```
📝 [QuestionRenderer] onChange called: {
  questionId: "hotelClass",
  questionType: "buttons",
  oldValue: "midscale",
  newValue: "luxury",
  willCallParentOnChange: true
}
```

**Level 3: State Update (CompleteStep3Component.tsx)**
```
💾 [Step3/setAnswer] START: {
  field: "hotelClass",
  value: "luxury",
  oldValue: "midscale",
  answerCount: 5,
  hasUpdateState: true,
  hasOnAnswersChange: true
}
✅ [Step3/setAnswer] Updated wizard store
✅ [Step3/setAnswer] Called onAnswersChange
📝 [Step3/setAnswer] DONE: hotelClass = "luxury"
```

---

## 📊 DATABASE AUDIT RESULTS

**Critical Finding**: ❌ **NO questions found in database for ANY industry**

```
📊 Found 23 active industries

AUDIT SUMMARY:
✅ OK: 0 industries
❌ ISSUES FOUND: 0 industries
⚠️  SKIPPED: 23 industries (all returned NO_QUESTIONS)
```

**Industries with no questions:**
- agricultural, airport, apartment, car-wash, casino, cold-storage, college
- data-center, ev-charging, gas-station, government, heavy_duty_truck_stop
- hospital, hotel, indoor-farm, manufacturing, microgrid, office, residential
- restaurant, retail, shopping-center, warehouse

**This means:**
1. Either migrations haven't been applied to Supabase
2. Or questions table is empty/corrupted
3. Or wizard is loading from a different source (fallback)

---

## 🔍 WHAT TO TEST NOW

### Step 1: Open Browser Console
1. Open your app in browser
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Clear the console

### Step 2: Navigate to Wizard Step 3
1. Select any industry (Hotel, Car Wash, EV Charging, etc.)
2. Proceed to Step 3 (questionnaire)

### Step 3: Watch Console While Clicking Buttons
You should see logs like this for **EVERY button click**:

```
🔘 [PanelButtonGroup] Button clicked: { ... }
📝 [QuestionRenderer] onChange called: { ... }
💾 [Step3/setAnswer] START: { ... }
✅ [Step3/setAnswer] Updated wizard store
✅ [Step3/setAnswer] Called onAnswersChange
📝 [Step3/setAnswer] DONE: ...
```

### Step 4: Document Which Buttons Work vs Don't Work
For each button you click, note:
- ✅ **Works**: Logs appear, UI updates, can continue
- ❌ **Broken**: No logs, or logs stop at a certain level, or infinite loop

---

## 🐛 EXPECTED DIAGNOSTIC PATTERNS

### Pattern A: Button Not Wired (No logs at all)
```
[User clicks button]
[Nothing in console]
```
**Diagnosis**: Button's `onClick` not calling `onChange` - component issue

### Pattern B: Renderer Not Receiving (Logs stop at Level 1)
```
🔘 [PanelButtonGroup] Button clicked: { ... }
[No Level 2 logs]
```
**Diagnosis**: `onChange` prop not passed correctly to PanelButtonGroup

### Pattern C: State Not Updating (Logs stop at Level 2)
```
🔘 [PanelButtonGroup] Button clicked: { ... }
📝 [QuestionRenderer] onChange called: { ... }
[No Level 3 logs]
```
**Diagnosis**: `setAnswer` callback not wired in question renderer

### Pattern D: Infinite Loop (Logs repeat endlessly)
```
💾 [Step3/setAnswer] START: { field: "X", value: "Y" }
💾 [Step3/setAnswer] START: { field: "X", value: "Y" }
💾 [Step3/setAnswer] START: { field: "X", value: "Y" }
...
```
**Diagnosis**: State update triggers re-render that triggers another update
- Check `useEffect` dependency arrays in CompleteStep3Component
- Check if `onAnswersChange` callback is stable (wrapped in useCallback)

### Pattern E: Field Name Mismatch (Logs show wrong field)
```
💾 [Step3/setAnswer] START: { field: "numberOfRooms", value: "150" }
[But database expects "roomCount"]
```
**Diagnosis**: Question's `field_name` in DB doesn't match Step3Integration.tsx mapping

---

## 📋 FIELD NAME MAPPINGS CURRENTLY IN CODE

Here are ALL field names that Step3Integration.tsx knows about:

```typescript
// Hotel
roomCount, numberOfRooms, hotelRooms

// Car Wash
bayCount, bayTunnelCount, bays

// Hospital
bedCount, numberOfBeds

// Data Center
rackCount, numberOfRacks

// EV Charging
level2Count, dcfc50Count, dcfcHighCount

// Warehouse
warehouseSqFt, warehouseSquareFeet

// Manufacturing
manufacturingSqFt, manufacturingSquareFeet

// Office
officeSqFt, officeSquareFeet

// Retail
retailSqFt, retailSquareFeet, storeSqFt

// Apartment
totalUnits, unitCount, numberOfUnits

// Agricultural
farmAcres, totalAcres, acres

// Airport
annualPassengers, passengers, passengerCount

// Casino
gamingFloorSqFt, gamingSquareFeet, casinoFloorSqFt

// Cold Storage
refrigeratedSqFt, coldStorageSqFt, refrigeratedSquareFeet

// Shopping Center
mallSqFt, shoppingCenterSqFt, glaSqFt

// College
studentPopulation, students, enrollment

// Gas Station
fuelPositions, numberOfFuelPositions, pumpPositions

// Indoor Farm
totalSqFt, farmSquareFeet

// Truck Stop
fuelPumpCount, numberOfPumps

// Generic fallbacks
squareFeet, squareFootage, facilitySqFt
operatingHours, operatingSchedule, hoursOfOperation
```

**If database uses different field names**, buttons will "work" but values won't save correctly.

---

## 🎯 NEXT STEPS FOR YOU

1. **Test with console open** - Click buttons in wizard Step 3
2. **Copy ALL console logs** - Share them with me (screenshot or text)
3. **Document pattern** - Which industries work? Which don't?
4. **Identify specific buttons** - "Hotel class buttons work, but room count buttons don't"

Then I can:
- Identify exact field name mismatches
- Fix infinite loop if present
- Add missing field mappings
- Fix any broken event handlers

---

## 🔧 FILES MODIFIED

1. `src/components/wizard/v6/step3/inputs/index.tsx` (PanelButtonGroup)
   - Added Level 1 debug logging to button clicks

2. `src/components/wizard/CompleteQuestionRenderer.tsx`
   - Added Level 2 debug logging to onChange wrapper

3. `src/components/wizard/CompleteStep3Component.tsx`
   - Added Level 3 debug logging to setAnswer

4. `audit_button_mappings.mjs` (NEW)
   - Database audit script (revealed NO_QUESTIONS issue)

5. `button_mapping_audit_report.json` (GENERATED)
   - Detailed JSON report of audit results

---

## ⚠️ CRITICAL DATABASE ISSUE

The database audit revealed that **ZERO questions exist** for any industry. This suggests:

**Possibility 1**: Migrations not applied
```bash
# Check if migrations applied
cd database/migrations
ls -la *.sql | grep "2026"
```

**Possibility 2**: Questions loading from fallback source
- CompleteStep3Component falls back to `carWashQuestionsComplete` if DB is empty
- This might be why SOME industries work (car wash) but not others

**Possibility 3**: RLS (Row Level Security) blocking queries
- Supabase might be blocking anonymous reads
- Check Supabase dashboard → Authentication → Policies

**Next**: Share console logs so I can diagnose which scenario applies.

---

## 📝 SUMMARY

**Status**: ✅ Debug logging added, ⏳ awaiting user testing
**Blocked on**: User needs to test with console open and share logs
**Critical issue**: Database has no questions (needs investigation)
**Time to resolution**: 10-30 minutes once we see console logs
