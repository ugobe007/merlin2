# Data Center Calculation Fix Plan
## Date: January 1, 2026

---

## ROOT CAUSE ANALYSIS

### Issue 1: BESS Sizing Too Small
**Root Cause**: `calculateBasePowerKW()` in Step5MagicFit.tsx uses incorrect generic calculation instead of calling `calculateDatabaseBaseline()` which has correct data center logic.

**Current Flow**:
1. Uses `INDUSTRY_POWER_PROFILES.data_center` with wrong values:
   - `kwhPerUnit: 60000` (kWh/rack/year) - correct
   - `bessRatio: 0.3` - WRONG (should be 0.5 for Tier III)
   - Calculates from annual kWh, not from rack count × PUE
   - Uses 4-hour duration instead of 15 minutes for UPS

**Expected Flow**:
1. Call `calculateDatabaseBaseline('data-center', scale, useCaseData)`
2. It internally calls `calculateDatacenterBaseline()` which:
   - Calculates IT Load = rackCount × 5kW
   - Applies PUE = IT Load × PUE (default 1.6)
   - Uses tier-based BESS multiplier (0.5 for Tier III)
   - Uses tier-based duration (4 hours - but diagnostic says 15 min?)

**Fix**: Make `calculateSystemAsync()` call `calculateDatabaseBaseline()` for data centers, and use its `powerMW` result.

---

### Issue 2: EV Chargers Not Flowing
**Root Cause**: Data structure mismatch between Step4 and Step5.

**Current Flow**:
- Step4Options sets: `customEvL2`, `customEvDcfc` (direct counts)
- Step5MagicFit expects: `evTier` (tier string: 'basic', 'standard', 'premium')
- Since `evTier` is not set, `selectedEvTier` is null
- So `evChargers` = 0
- Step6Quote shows "Not selected"

**Fix**: Update Step5MagicFit to read `customEvL2` and `customEvDcfc` from state and calculate EV power/cost directly.

---

### Issue 3: Generator Not Recommended
**Root Cause**: Generator is only opt-in, no auto-recommendation logic exists.

**Expected**: For data centers (especially Tier III+), generator should be auto-recommended and shown as "Recommended" like solar.

**Fix**: Add generator recommendation logic in Step5MagicFit:
- Check industry type and tier
- If data center Tier III+, auto-recommend generator
- Size: Peak Demand × Critical Load % (100%) × 1.25 (NFPA 110 reserve margin)

---

### Issue 4: Annual Savings Too Low
**Root Cause**: Consequence of Issue 1 - undersized BESS = undersized savings.

**Fix**: Fixing Issue 1 will automatically fix this.

---

### Issue 5: EV Charger UX Enhancement
**Request**: Replace single slider with 3 separate sliders:
- Level 2 Chargers (7-19 kW each)
- DC Fast Chargers (50-150 kW each)  
- Ultra-Fast Chargers (150-350 kW each)

**Fix**: Update Step4Options EVConfig component to have 3 sliders instead of 1 slider + type selector.

---

## IMPLEMENTATION PLAN

### Step 1: Fix BESS Sizing for Data Centers
**File**: `src/components/wizard/v6/steps/Step5MagicFit.tsx`

1. Import `calculateDatabaseBaseline` from `@/services/baselineService`
2. In `calculateSystemAsync()`, add data center special case:
   ```typescript
   let basePowerKW = 0;
   if (industry === 'data_center' || industry === 'data-center') {
     const baseline = await calculateDatabaseBaseline('data-center', 1, useCaseData);
     basePowerKW = baseline.powerMW * 1000; // Convert MW to kW
     durationHours = baseline.durationHrs; // Use tier-based duration
   } else {
     basePowerKW = calculateBasePowerKW(state);
   }
   ```

**Note**: Diagnostic says 15 min duration, but DATACENTER_TIER_STANDARDS says 4 hours. Need to clarify - use tier standards for now.

---

### Step 2: Fix EV Charger Data Flow
**File**: `src/components/wizard/v6/steps/Step5MagicFit.tsx`

Update EV charger section to read from `customEvL2` and `customEvDcfc`:

```typescript
// EV CHARGER SIZING - Read from Step 4 direct counts
let evChargers = 0;
let evCost = 0;
let evPowerKW = 0;
let selectedEvTier: EvTierResult | null = null;

const evL2Count = state.customEvL2 || 0;
const evDcfcCount = state.customEvDcfc || 0;

if (selectedOptions?.includes('ev') && (evL2Count > 0 || evDcfcCount > 0)) {
  // Calculate power: Level 2 = 19.2 kW, DC Fast = 150 kW (default)
  evPowerKW = Math.round(evL2Count * 19.2 + evDcfcCount * 150);
  
  // Calculate cost: Level 2 = $6,000, DC Fast = $45,000
  evCost = evL2Count * 6000 + evDcfcCount * 45000;
  
  evChargers = evL2Count + evDcfcCount;
  
  selectedEvTier = {
    name: 'Custom',
    l2Count: evL2Count,
    dcfcCount: evDcfcCount,
    powerRaw: evPowerKW,
    chargers: `${evL2Count} L2 + ${evDcfcCount} DC Fast`,
    power: `${evPowerKW} kW`,
    carsPerDay: `${Math.round((evL2Count * 2 + evDcfcCount * 8) * 0.8)}-${evL2Count * 2 + evDcfcCount * 8}`,
    monthlyRevenue: `$${Math.round((evL2Count * 150 + evDcfcCount * 800)).toLocaleString()}`,
    monthlyRevenueRaw: evL2Count * 150 + evDcfcCount * 800,
    installCost: `$${evCost.toLocaleString()}`,
    installCostRaw: evCost,
    tenYearRevenue: (evL2Count * 150 + evDcfcCount * 800) * 12 * 10,
    guestAppeal: evDcfcCount > 0 ? (evDcfcCount >= 4 ? '★★★★★' : '★★★★☆') : '★★★☆☆'
  };
}
```

---

### Step 3: Add Generator Auto-Recommendation
**File**: `src/components/wizard/v6/steps/Step5MagicFit.tsx`

Add generator recommendation logic after BESS calculation:

```typescript
// ========================================
// GENERATOR SIZING - Auto-recommend for data centers
// ========================================
let generatorKW = 0;
let generatorRecommended = false;

if (industry === 'data_center' || industry === 'data-center') {
  const tier = useCaseData?.tierClassification || 'tier_3';
  // Tier III+ requires backup generation
  if (tier.includes('tier_3') || tier.includes('tier_4')) {
    generatorRecommended = true;
    // Size: Peak Demand × Critical Load (100%) × Reserve Margin (1.25x)
    generatorKW = Math.round(basePowerKW * 1.0 * 1.25);
  }
}

// User opt-in for other industries
if (!generatorRecommended && (opportunities.wantsGenerator || selectedOptions?.includes('generator'))) {
  generatorKW = Math.round(bessKW * 0.5);
}
```

Also need to pass `generatorRecommended` flag to calculations so Step6 can show "Recommended" badge.

---

### Step 4: Update EV Config UX (3 Sliders)
**File**: `src/components/wizard/v6/steps/Step4Options.tsx`

Replace single `evChargerCount` slider with 3 separate sliders:
- `level2Count` (0-50)
- `dcFastCount` (0-50)  
- `ultraFastCount` (0-20)

Update state update to set all three values:
```typescript
customEvL2: level2Count,
customEvDcfc: dcFastCount,
customEvUltraFast: ultraFastCount, // NEW field
```

**Note**: Need to add `customEvUltraFast` to WizardState type.

---

## TESTING CHECKLIST

- [ ] Data center with 400 racks shows ~3.2 MW facility → ~1.6 MW BESS (Tier III, 50% multiplier)
- [ ] EV chargers from Step 4 appear in Step 6 quote
- [ ] Generator auto-recommended for Tier III data center
- [ ] Generator shows "Recommended" badge in Step 6
- [ ] Annual savings reflect correct BESS size
- [ ] 3 EV charger sliders work in Step 4
- [ ] All EV charger types flow to quote correctly

---

## FILES TO MODIFY

1. `src/components/wizard/v6/steps/Step5MagicFit.tsx`
2. `src/components/wizard/v6/steps/Step4Options.tsx`
3. `src/components/wizard/v6/types.ts` (add `customEvUltraFast`)
4. `src/components/wizard/v6/steps/Step6Quote.tsx` (add generator recommendation badge)
