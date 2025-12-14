# SYSTEMATIC WIZARD CALCULATION FLOW
## Real-Time Power Calculations Across All Wizards

**Created:** December 14, 2025  
**Status:** ✅ **IMPLEMENTED**

---

## 🎯 OBJECTIVE

Ensure **consistent real-time power calculations** across ALL wizards (StreamlinedWizard, HotelWizard, CarWashWizard, EVChargingWizard) so that:
- **Power Profile (PP)** indicator updates immediately as user selects inputs on Step 2
- **Power Gap (PG)** shows accurate recommendations vs user's needs
- Values flow systematically through Steps 2 → 3 → 4 → 5
- User adjustments on Step 3 (configuration) recalculate instantly

---

## 📊 SYSTEMATIC FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STEP 0: WELCOME & LOCATION                          │
│  User selects: State, Industry, Initial Goals                              │
│  → No calculations yet                                                      │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STEP 1: INDUSTRY SELECTION                          │
│  User selects: Use case template (hotel, EV charging, etc.)                │
│  → Loads custom questions for industry                                      │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STEP 2: FACILITY DETAILS (CRITICAL!)                     │
│                         *** REAL-TIME CALCULATIONS ***                      │
│                                                                             │
│  User inputs: Room count, charger types, equipment, etc.                    │
│  → useCaseData updates as user types/selects                               │
│  → useRealtimePowerCalculation hook triggers (debounced 300ms)              │
│  → calculateUseCasePower() called with normalized data                      │
│  → Power Profile (PP) updates: kW → kWh → MWh                              │
│  → Power Gap (PG) updates: Facility needs vs BESS recommendation           │
│                                                                             │
│  Example (EV Charging):                                                     │
│    Input: 5 Level 2 + 6 DCFC-150 + 10 HPC-350                              │
│    → Total: 4.3 MW peak                                                     │
│    → PP shows: 2.6 MWh (60% concurrency, 2-hour duration)                  │
│    → PG shows: You need 4.3 MW, Merlin recommends 3.0 MW BESS              │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 3: GOALS & CONFIGURATION                          │
│                      *** USER ADJUSTS RECOMMENDATIONS ***                   │
│                                                                             │
│  User sees: Merlin's AI recommendation (from Step 2 calculations)           │
│  User can:                                                                  │
│    - Accept AI recommendation (go to Step 4)                                │
│    - Customize: Adjust battery size, duration, solar, generator             │
│                                                                             │
│  On adjustment:                                                             │
│    → targetReduction slider changes (e.g., 50% → 80%)                       │
│    → durationHours slider changes (e.g., 2hr → 6hr)                         │
│    → wantsSolar toggle changes                                              │
│    → useRealtimePowerCalculation hook recalculates                          │
│    → PP/PG update immediately with new values                               │
│                                                                             │
│  Example (User adjusts):                                                    │
│    Merlin recommended: 3.0 MW / 12 MWh (4 hours)                            │
│    User adjusts to: 80% reduction, 6 hours                                  │
│    → New: 3.4 MW / 20.4 MWh                                                 │
│    → PP updates instantly                                                   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STEP 4: QUOTE GENERATION                           │
│                      *** FINAL CALCULATION WITH SSOT ***                    │
│                                                                             │
│  generateQuote() called:                                                    │
│    → Takes final values from Step 3 (user-adjusted or AI recommendation)    │
│    → Calls QuoteEngine.generateQuote() (SSOT)                               │
│    → Gets full equipment breakdown + financial metrics                      │
│    → Shows detailed quote with TrueQuote™ sources                           │
│                                                                             │
│  Values passed through:                                                     │
│    - storageSizeMW (from Step 2/3 calculations)                             │
│    - durationHours (from Step 3 config)                                     │
│    - solarMW (from Step 3 config)                                           │
│    - generatorMW (from Step 2 inputs + Step 3 config)                       │
│    - location (from Step 0)                                                 │
│    - useCase (from Step 1)                                                  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STEP 5: QUOTE RESULTS                              │
│                         *** DISPLAY & EXPORT ***                            │
│                                                                             │
│  User sees:                                                                 │
│    - Full quote breakdown with TrueQuote™ badges                            │
│    - Equipment list (batteries, inverters, solar, etc.)                     │
│    - Financial metrics (payback, NPV, IRR, ROI)                             │
│    - Savings estimates                                                      │
│                                                                             │
│  User can:                                                                  │
│    - Download PDF/Word/Excel                                                │
│    - Request consultation                                                   │
│    - Save quote to dashboard                                                │
│    - Go back to Step 3 to adjust and regenerate                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### 1. Shared Hook: `useRealtimePowerCalculation`

**Location:** `src/components/wizard/hooks/useRealtimePowerCalculation.ts`

**Purpose:** Centralized real-time power calculation logic for ALL wizards.

**Features:**
- ✅ Debounced calculations (300ms) to avoid excessive SSOT calls
- ✅ Cache key generation to skip redundant calculations
- ✅ Industry-specific field normalization (hotel → roomCount, EV → charger fields)
- ✅ Automatic BESS sizing (70% of peak by default)
- ✅ Solar recommendation (60% of peak)
- ✅ Returns both kW and MW values for flexibility

**Usage:**
```tsx
const { powerResult, isCalculating, recalculate } = useRealtimePowerCalculation({
  industry: 'hotel',
  useCaseData: { roomCount: 150, hotelClass: 'upscale', amenities: { pool: true } },
  wantsSolar: true,
  targetReduction: 70, // % of peak demand to offset
  durationHours: 4,
  enabled: true, // Set false to pause calculations
  debounceMs: 300,
});

// Access results:
powerResult.peakDemandKW        // 2500 kW
powerResult.recommendedBatteryKW // 1750 kW (70% of peak)
powerResult.recommendedBatteryKWh // 7000 kWh (4 hours)
powerResult.recommendedSolarKW   // 1500 kW (60% of peak)
```

### 2. StreamlinedWizard Integration

**Location:** `src/components/wizard/hooks/useStreamlinedWizard.ts`

**Implementation:**
- ✅ Real-time calculation useEffect added (Dec 14, 2025)
- ✅ Triggers on `useCaseData` changes (Step 2 inputs)
- ✅ Updates both `wizardState` AND `centralizedState`
- ✅ Power Profile (PP) reads from `wizardState.batteryKW/batteryKWh`
- ✅ Power Gap (PG) reads from `centralizedState.calculated`

**Flow:**
```tsx
useEffect(() => {
  if (currentSection < 2 || !wizardState.selectedIndustry) return;
  
  // Normalize data
  const normalized = normalizeUseCaseData(wizardState.useCaseData, wizardState.selectedIndustry);
  
  // Calculate power
  const power = calculateUseCasePower(wizardState.selectedIndustry, normalized);
  const peakKW = power.powerMW * 1000;
  
  // Calculate BESS sizing
  const batteryKW = Math.round(peakKW * 0.7); // 70% reduction
  const batteryKWh = batteryKW * 4; // 4-hour duration
  
  // Update state → PP/PG update immediately
  setWizardState(prev => ({
    ...prev,
    batteryKW,
    batteryKWh,
    solarKW: wizardState.wantsSolar ? Math.round(peakKW * 0.6) : 0,
  }));
}, [wizardState.useCaseData, wizardState.selectedIndustry, currentSection]);
```

### 3. Vertical Wizards (Hotel, CarWash, EV)

**Current State (Dec 14, 2025):**
- ✅ HotelWizard: Has `calculatedPower` state with useEffect
- ✅ CarWashWizard: Similar pattern
- ✅ EVChargingWizard: Similar pattern
- ⚠️ **Recommendation**: Migrate to `useRealtimePowerCalculation` hook for consistency

**Migration Pattern:**
```tsx
// BEFORE (manual calculation in useEffect):
const [calculatedPower, setCalculatedPower] = useState({ totalPeakKW: 0, ... });

useEffect(() => {
  const calc = calculateHotelPowerDetailed(input);
  setCalculatedPower(calc);
}, [hotelDetails, amenities, operations]);

// AFTER (using shared hook):
const { powerResult } = useRealtimePowerCalculation({
  industry: 'hotel',
  useCaseData: {
    roomCount: hotelDetails.numberOfRooms,
    hotelClass: hotelDetails.hotelClass,
    amenities,
    avgOccupancy: operations.avgOccupancy,
  },
  wantsSolar: energyGoals.interestInSolar,
  targetReduction: energyGoals.targetSavingsPercent,
  durationHours: energyGoals.primaryGoal === 'backup-power' ? 6 : 4,
});

// Use powerResult.peakDemandKW, powerResult.recommendedBatteryKW, etc.
```

---

## ✅ BENEFITS OF SYSTEMATIC APPROACH

### 1. **Consistency**
- All wizards use same calculation logic
- Same debounce timing (300ms)
- Same field normalization rules
- Same SSOT integration

### 2. **Performance**
- Debouncing prevents excessive calculations (user typing fast)
- Cache key prevents redundant calculations (same inputs)
- Only calculates on Section 2+ (no wasted cycles)

### 3. **Maintainability**
- Single source of truth for real-time calculations
- Fix once, works everywhere
- Easy to add new industries (just add field normalization)

### 4. **User Experience**
- Instant feedback on Step 2 (PP icon updates)
- Power Gap shows accurate recommendations
- Smooth transitions between steps
- User adjustments on Step 3 feel responsive

---

## 🔍 FIELD NORMALIZATION RULES

All wizards normalize database field names to SSOT-expected names:

| Industry | Database Fields | SSOT Field | Example |
|----------|----------------|------------|---------|
| Hotel | `numberOfRooms`, `rooms`, `facilitySize` | `roomCount` | 150 rooms |
| Office | `officeSqFt`, `buildingSqFt`, `sqFt`, `facilitySize` | `squareFeet` | 50,000 sqft |
| Hospital | `beds`, `numberOfBeds`, `facilitySize` | `bedCount` | 200 beds |
| Warehouse | `warehouseSqFt`, `sqFt`, `facilitySize` | `squareFeet` | 200,000 sqft |
| Car Wash | `washBays`, `numBays`, `bays`, `facilitySize` | `bayCount` | 4 bays |
| EV Charging | `level2Chargers`, `dcfc50kwChargers`, `dcfc150kwChargers`, `dcfc350kwChargers`, `megawattChargers`, `concurrentChargingSessions` | Direct passthrough | 5 L2, 6 DCFC-150, 10 HPC-350 |
| Airport | `totalPassengers`, `passengers`, `facilitySize` | `annualPassengers` | 5M passengers |
| Casino | `gamingFloorSize`, `gamingSpaceSqFt`, `facilitySize` | `gamingFloorSqFt` | 100k sqft |

**Why normalization?**
- Database schemas evolve over time
- Different migrations used different field names
- SSOT expects consistent naming
- Normalization layer handles all variants

---

## 🚀 NEXT STEPS

### Phase 1: ✅ COMPLETED (Dec 14, 2025)
- [x] Create `useRealtimePowerCalculation` hook
- [x] Integrate into StreamlinedWizard
- [x] Fix EV Charging field names in `baselineService.ts`
- [x] Add real-time calculation to `useStreamlinedWizard`
- [x] Test with EV Charging (5 L2 + 6 DCFC-150 + 10 HPC-350)

### Phase 2: RECOMMENDED (Future)
- [ ] Migrate HotelWizard to use `useRealtimePowerCalculation`
- [ ] Migrate CarWashWizard to use `useRealtimePowerCalculation`
- [ ] Migrate EVChargingWizard to use `useRealtimePowerCalculation`
- [ ] Add Step 3 configuration sliders that trigger `recalculate()`
- [ ] Add animation to PP icon when values update

### Phase 3: ADVANCED (Future)
- [ ] Add comparison mode: "Your inputs vs Merlin's recommendation"
- [ ] Add historical tracking: "See how your needs changed"
- [ ] Add sensitivity analysis: "What if you had 10 more chargers?"

---

## 📋 TESTING CHECKLIST

For each wizard, verify:

- [ ] **Step 2 - Real-time updates:**
  - [ ] PP icon updates as user types/selects inputs
  - [ ] Values are accurate (compare with SSOT directly)
  - [ ] No lag or jank (debouncing working)
  - [ ] Console shows calculation logs (dev mode)

- [ ] **Step 3 - User adjustments:**
  - [ ] Slider changes trigger recalculation
  - [ ] PP/PG update immediately
  - [ ] Values passed correctly to Step 4

- [ ] **Step 4 - Quote generation:**
  - [ ] Final quote matches Step 3 values
  - [ ] Equipment breakdown is correct
  - [ ] Financial metrics are accurate

- [ ] **Step 5 - Results:**
  - [ ] PDF/Word/Excel exports show correct values
  - [ ] TrueQuote™ sources are displayed
  - [ ] User can go back and adjust

---

## 📞 SUPPORT

For issues with real-time calculations:
1. Check console for `[REALTIME CALC]` logs
2. Verify industry is set correctly
3. Check `useCaseData` has required fields
4. Verify SSOT function returns valid `powerMW`
5. Check field normalization for your industry

**Common Issues:**
- **PP not updating:** Check `currentSection >= 2` condition
- **Wrong values:** Check field name normalization
- **Lag:** Increase debounce from 300ms to 500ms
- **No calculation:** Check `enabled` prop is `true`

---

**End of Document**
