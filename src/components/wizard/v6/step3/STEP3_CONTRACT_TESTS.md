# Step 3 Contract Test Suite
**Created: Jan 24, 2026**

This document defines the "done means done" test cases for Step 3 SSOT validation.

## Test Philosophy

**ONE RULE:** Only `validateStep3Contract()` decides Step 3 validity.
- ✅ Button disabled: reads `step3Contract.ok`
- ✅ goNext gate: reads `step3Contract.ok`
- ✅ Snapshot completeness: reads `step3Contract.completenessPct`
- ✅ Blocked message: reads `step3Contract.missing`

**INVARIANTS:**
1. `estimatePeakDemandKW()` never returns 0, NaN, or Infinity
2. `snapshot.industry.type` is never empty string
3. `snapshot.loadProfile.totalPeakDemandKW > 0` always
4. `completenessPct` is stable (only changes when required keys change)

---

## Manual Browser Tests

### Test 1: Industry Auto-Detected Path

**Setup:**
1. Open `/wizard` in browser
2. Enter location: ZIP `94102` (San Francisco - car wash area)
3. Google Places autocomplete detects business name with "wash" or "auto detailing"

**Verify:**
```javascript
// In browser console:
const state = window.__wizardState; // If exposed for debug
const snapshot = buildStep3Snapshot(state);

console.log(snapshot.industry.type);
// Expected: "car_wash" or similar (NOT empty string)

console.log(snapshot.calculated.totalPeakDemandKW > 0);
// Expected: true (even before Step 5)
```

**Pass Criteria:**
- ✅ Industry type populated from `detectedIndustry`
- ✅ Step 3 advances without manual industry selection
- ✅ Peak demand is non-zero

---

### Test 2: Garbage Input Parsing

**Setup:**
1. Select car wash industry
2. Enter garbage inputs:
   - Monthly bill: `"$4,200"`
   - Electricity rate: `"abc"`
   - Operating hours: `"16 hrs"`
   - Bay count: `"4 bays"`

**Verify:**
```javascript
const snapshot = buildStep3Snapshot(state);

console.log(snapshot.facility.operatingHours);
// Expected: 16 (parsed from "16 hrs")

console.log(snapshot.facility.bayCount);
// Expected: 4 (parsed from "4 bays")

console.log(Number.isFinite(snapshot.loadProfile.totalPeakDemandKW));
// Expected: true (no NaN from bad rate input)

console.log(snapshot.loadProfile.totalPeakDemandKW >= 50);
// Expected: true (car wash minimum is 50 kW)
```

**Pass Criteria:**
- ✅ No NaN values in snapshot
- ✅ Numbers parsed correctly from strings with units/symbols
- ✅ Rate clamped to valid range [0.04, 0.60] (ignores "abc")

---

### Test 3: Small Site - No Over-Estimation

**Setup:**
1. Select "Office Building" industry
2. Business size: Small
3. Square footage: `1,200`
4. Operating hours: `10`
5. NO monthly bill, NO peak demand

**Verify:**
```javascript
const snapshot = buildStep3Snapshot(state);

console.log(snapshot.loadProfile.totalPeakDemandKW);
// Expected: ~14-15 kW (1200 sqft × 0.012 kW/sqft)
// NOT 50 kW (old global minimum)

console.log(snapshot.calculated.recommendedBatteryKW);
// Expected: ~6 kW (14 × 0.4)
// Appropriately sized for small office
```

**Pass Criteria:**
- ✅ Peak estimate reflects actual small size
- ✅ Recommended battery not oversized
- ✅ Tier-aware minimum applied (small tier = 10 kW min)

---

### Test 4: Car Wash Type Discrimination

#### 4a. Self-Serve Car Wash

**Setup:**
- Industry: Car Wash
- Type: `self_serve`
- Bay count: `4`

**Verify:**
```javascript
console.log(snapshot.loadProfile.totalPeakDemandKW);
// Expected: ~48 kW (4 bays × 12 kW/bay)
// NOT 200 kW (old flat 50 kW/bay)
```

#### 4b. Express Tunnel Car Wash

**Setup:**
- Industry: Car Wash
- Type: `express_tunnel`
- Bay count: `4`

**Verify:**
```javascript
console.log(snapshot.loadProfile.totalPeakDemandKW);
// Expected: ~270 kW (150 base + 4 × 30)
// Higher for tunnel equipment (conveyors, dryers, blowers)
```

#### 4c. In-Bay Automatic

**Setup:**
- Industry: Car Wash
- Type: `in_bay_auto`
- Bay count: `4`

**Verify:**
```javascript
console.log(snapshot.loadProfile.totalPeakDemandKW);
// Expected: ~160 kW (4 × 40 kW/bay)
// Medium-high for automated arms + dryers
```

**Pass Criteria:**
- ✅ Self-serve correctly estimated low (~12 kW/bay)
- ✅ Tunnel correctly estimated high (150+ base)
- ✅ In-bay auto in between (~40 kW/bay)

---

### Test 5: Completeness Stability

**Setup:**
1. Select hotel industry
2. Fill only required fields:
   - ZIP, State, Goals
   - Room count: 50
   - Operating hours: 24

**Verify:**
```javascript
const validation = validateStep3Contract(state);

console.log(validation.requiredKeys);
// Expected: ["location.zipCode", "location.state", "industry.type", 
//            "facility.operatingHours", "facility.roomCount", 
//            "goals.primaryGoal", "calculated.loadAnchor"]

console.log(validation.completenessPct);
// Expected: 100% (all required keys present)

console.log(validation.confidencePct);
// Expected: <100% (optional fields like monthly bill not filled)
```

**Now add optional field:**
- Monthly bill: `$3,500`

**Verify:**
```javascript
const validation2 = validateStep3Contract(state);

console.log(validation2.completenessPct);
// Expected: STILL 100% (unchanged - stability test)

console.log(validation2.confidencePct);
// Expected: Higher than before (optional field increases confidence)
```

**Pass Criteria:**
- ✅ `completenessPct` only changes when required keys change
- ✅ `confidencePct` changes when optional fields added
- ✅ Adding more optional "boosters" doesn't affect completeness

---

### Test 6: Missing Required Field Blocks Step 4

**Setup:**
1. Select data center industry
2. Fill ZIP, State, Goals
3. Fill operating hours: 24
4. **Skip rack count** (required for data center)

**Verify:**
```javascript
const validation = validateStep3Contract(state);

console.log(validation.ok);
// Expected: false

console.log(validation.missingRequired);
// Expected: ["facility.rackCount"]

console.log(validation.missing);
// Expected: Includes "facility.rackCount" + any optional fields

// Try to advance
goNext(); // Should be blocked
```

**Pass Criteria:**
- ✅ Next button disabled
- ✅ goNext() blocked
- ✅ Missing field clearly identified
- ✅ UI shows blocked feedback

---

### Test 7: Load Anchor Enforcement

**Setup:**
1. Select unknown/generic industry
2. Fill ZIP, State, Goals, Operating hours
3. **Skip ALL load anchors:**
   - No peak demand
   - No monthly bill
   - No square footage
   - No industry-specific anchor (rooms/bays/racks)

**Verify:**
```javascript
const validation = validateStep3Contract(state);

console.log(validation.hasLoadAnchor);
// Expected: false

console.log(validation.missingRequired);
// Expected: Includes "calculated.loadAnchor"

console.log(validation.ok);
// Expected: false (missing load anchor)
```

**Now add monthly bill:**
- Monthly bill: `$1,200`

**Verify:**
```javascript
const validation2 = validateStep3Contract(state);

console.log(validation2.hasLoadAnchor);
// Expected: true (bill > $50)

console.log(validation2.ok);
// Expected: true (load anchor satisfied)
```

**Pass Criteria:**
- ✅ At least one load anchor required
- ✅ Peak demand counts as anchor
- ✅ Monthly bill counts as anchor
- ✅ Industry-specific field (rooms/bays) counts as anchor
- ✅ Square footage counts as anchor

---

## Unit Test Cases (Future)

### `toNum()` Tests

```typescript
expect(toNum("$4,200")).toBe(4200);
expect(toNum("16 hrs")).toBe(16);
expect(toNum("1,234.56")).toBe(1234.56);
expect(toNum("abc")).toBe(0);
expect(toNum(null)).toBe(0);
expect(toNum(undefined)).toBe(0);
expect(toNum(42)).toBe(42);
expect(toNum(NaN)).toBe(0);
```

### `clamp()` Tests

```typescript
expect(clamp(0.02, 0.04, 0.60)).toBe(0.04);  // Too low
expect(clamp(0.12, 0.04, 0.60)).toBe(0.12);  // In range
expect(clamp(0.75, 0.04, 0.60)).toBe(0.60);  // Too high
expect(clamp(NaN, 0.04, 0.60)).toBe(0.04);   // Not finite
expect(clamp(Infinity, 0.04, 0.60)).toBe(0.04);
```

### `normalizeIndustry()` Tests

```typescript
expect(normalizeIndustry("Car Wash")).toBe("car_wash");
expect(normalizeIndustry("carwash")).toBe("car_wash");
expect(normalizeIndustry("car-wash")).toBe("car_wash");
expect(normalizeIndustry("Data Center")).toBe("data_center");
expect(normalizeIndustry("datacenter")).toBe("data_center");
expect(normalizeIndustry("EV Charging")).toBe("ev_charging");
```

### `getMinimumPeakKW()` Tests

```typescript
expect(getMinimumPeakKW("car_wash", "small")).toBe(50);
expect(getMinimumPeakKW("office", "small")).toBe(10);
expect(getMinimumPeakKW("office", "medium")).toBe(25);
expect(getMinimumPeakKW("hospital", "small")).toBe(100);
expect(getMinimumPeakKW("unknown", "small")).toBe(10);
```

### `estimatePeakDemandKW()` Tests

```typescript
// Direct peak input
const directResult = estimatePeakDemandKW("hotel", { peakDemandKW: 250 }, "medium");
expect(directResult).toBe(250);

// Bill-based estimate
const billResult = estimatePeakDemandKW("office", { monthlyElectricBill: 3000 }, "medium");
expect(billResult).toBeGreaterThan(0);
expect(Number.isFinite(billResult)).toBe(true);

// Car wash self-serve
const selfServe = estimatePeakDemandKW("car_wash", { 
  bayCount: 4, 
  carWashType: "self_serve" 
}, "medium");
expect(selfServe).toBeCloseTo(48, 5); // 4 × 12

// Car wash tunnel
const tunnel = estimatePeakDemandKW("car_wash", { 
  bayCount: 4, 
  carWashType: "express_tunnel" 
}, "medium");
expect(tunnel).toBeCloseTo(270, 5); // 150 + 4×30

// Hotel
const hotel = estimatePeakDemandKW("hotel", { roomCount: 100 }, "medium");
expect(hotel).toBeCloseTo(250, 5); // 100 × 2.5

// Tier fallback (no inputs)
const fallback = estimatePeakDemandKW("unknown", {}, "small");
expect(fallback).toBe(100); // small tier default
```

### `validateStep3Contract()` Tests

```typescript
// Complete state (all required)
const complete = validateStep3Contract({
  zipCode: "94102",
  state: "CA",
  industry: "hotel",
  goals: ["peak_shaving"],
  useCaseData: {
    inputs: {
      roomCount: 50,
      operatingHours: 24,
      monthlyElectricBill: 2000
    }
  }
});
expect(complete.ok).toBe(true);
expect(complete.missingRequired).toHaveLength(0);
expect(complete.completenessPct).toBe(100);

// Missing required field
const incomplete = validateStep3Contract({
  zipCode: "94102",
  state: "CA",
  industry: "hotel",
  goals: ["peak_shaving"],
  useCaseData: {
    inputs: {
      operatingHours: 24
      // Missing roomCount (required for hotel)
    }
  }
});
expect(incomplete.ok).toBe(false);
expect(incomplete.missingRequired).toContain("facility.roomCount");
```

---

## Dev Assertion Checklist

These assertions fire in development mode only:

```typescript
if (process.env.NODE_ENV === "development") {
  // ✅ Industry type never empty
  if (!snapshot.industry.type) {
    console.error("❌ Step3Snapshot invariant violated: industry.type is empty");
  }
  
  // ✅ Peak always positive
  if (snapshot.loadProfile.totalPeakDemandKW <= 0) {
    console.error("❌ Step3Snapshot invariant violated: peak <= 0");
  }
  
  // ✅ Peak always finite
  if (!Number.isFinite(snapshot.loadProfile.totalPeakDemandKW)) {
    console.error("❌ Step3Snapshot invariant violated: peak is not finite");
  }
}
```

**How to trigger (should NOT fire):**
1. Run wizard in dev mode
2. Complete Step 3 with valid data
3. Check console - no assertion errors

**How to test (should fire):**
1. Temporarily remove industry normalization
2. Or temporarily return NaN from estimator
3. See assertion in console

---

## Integration Rule: One Validator to Rule Them All

**✅ CORRECT:**
```typescript
// WizardV6.tsx
const step3Contract = useMemo(() => validateStep3Contract(state), [...]);

// goNext() gate
if (currentStep === 3 && !step3Contract.ok) {
  console.log("Blocked:", step3Contract.missing);
  return;
}

// Button disabled state
const canProceed = step3Contract.ok;

// Blocked message
const blockedMsg = step3Contract.missing.join(", ");
```

**❌ WRONG:**
```typescript
// DON'T do this:
const valid = step3Valid && inputs.bayCount > 0 && hasIndustry;
// Now you have TWO sources of truth → will drift
```

---

## Success Criteria

✅ All 7 manual tests pass
✅ No console errors in dev mode
✅ TypeScript compiles with no errors
✅ Only `validateStep3Contract()` decides validity
✅ `estimatePeakDemandKW()` never returns 0/NaN/Infinity
✅ Completeness stable (only changes with required keys)
✅ Car wash types estimated correctly

**Last Updated:** Jan 24, 2026
**Status:** All invariants implemented ✅
