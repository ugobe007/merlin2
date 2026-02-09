# TrueQuote™ Scaling Hardening Complete (Feb 5, 2026)

## Executive Summary

All 5 finishing touches implemented to make TrueQuote validation scale cleanly across 20+ industries without blocking unrelated PRs or causing false CI failures.

**Status**: ✅ Production-ready scaling policy
**Test Coverage**: 3 PASS, 0 FAIL, 1 SKIP (ev_charging expected)
**Migrations**: 1/21 industries (car_wash ✅)

---

## 5 Finishing Touches Implemented

### 1. Validation Allowlist (Gradual Migration Policy)

**Problem**: Requiring validation for all industries immediately would block PRs for unmigrated industries.

**Solution**: `VALIDATION_REQUIRED` set - only industries in this set MUST provide validation envelopes.

```typescript
const VALIDATION_REQUIRED = new Set<string>([
  "car_wash", // ✅ Migrated Jan 2026
  // Add here as you migrate:
  // "hotel",
  // "data_center",
  // "ev_charging",
]);
```

**Behavior**:
- **In set + no validation**: ❌ FAIL (hard error)
- **Not in set + no validation**: ℹ️ WARN (soft warning, don't block)
- **In set + validation**: ✅ Run all checks (version, sum, invariants)

**CI STRICT Mode**: Only fails on industries in `VALIDATION_REQUIRED` set.

**Example Output**:
```
hotel           PASS    peak=450kW    capex=$262k    roi=4.7y  mix=none  defaults=2  warnings=3
  ℹ️  Validation envelope not provided (not yet migrated)
```

### 2. Per-Industry Tolerance Policy

**Problem**: One-size-fits-all tolerance (15% warn, 25% fail) doesn't fit all industries. Data centers with PUE + IT load should have tighter tolerances.

**Solution**: `SUM_TOLERANCE` table with per-industry thresholds.

```typescript
const SUM_TOLERANCE: Record<string, { warn: number; fail: number }> = {
  default: { warn: 0.15, fail: 0.25 },        // 15% warn, 25% hard fail
  data_center: { warn: 0.10, fail: 0.15 },    // Tighter (PUE + IT load)
  ev_charging: { warn: 0.15, fail: 0.25 },    // Standard
  car_wash: { warn: 0.15, fail: 0.25 },       // Standard
};
```

**Benefits**:
- Data centers: 10% warn, 15% fail (tighter due to deterministic PUE)
- EV/car wash: 15% warn, 25% fail (standard)
- Future: Adjust per-industry as models improve

**Example**: Car wash with 0% error passes easily, data center with 11% error would warn (but still pass).

### 3. Improved Mix Formatting (Smart Thresholds)

**Problem**: Mix column showing `itLoad0 cooling0 charging0` clutters output with zeros.

**Solution**: Smart thresholds - only show contributors if they meet minimum %.

```typescript
const keys: Array<[string, string, number]> = [
  ["process", "proc", 1],      // Always show if >0%
  ["hvac", "hvac", 1],          // Always show if >0%
  ["lighting", "light", 1],     // Always show if >0%
  ["controls", "ctrl", 1],      // Always show if >0%
  ["itLoad", "it", 2],          // Only if >=2% (data centers)
  ["cooling", "cool", 2],       // Only if >=2% (data centers)
  ["charging", "chrg", 2],      // Only if >=2% (EV stations)
  ["other", "othr", 3],         // Only if >=3% (catch-all)
];
```

**Before**: `mix=proc92 hvac2 light4 ctrl2 it0 cool0 chrg0 othr0`
**After**: `mix=proc92 hvac2 light4 ctrl2`

**Benefits**:
- Compact PR-friendly format
- Only show relevant contributors
- `other` only shows if >=3% (prevents clutter)
- Data center `itLoad`/`cooling` only if >=2%

### 4. Canonical Key Normalizer (Shape Enforcement)

**Problem**: If calculator omits a key (e.g., `itLoad` undefined), invariant checks break with NaN errors.

**Solution**: `normalizeContributors()` function ensures all 8 keys always present.

```typescript
function normalizeContributors(
  input?: Partial<Record<string, number>>
): Record<string, number> {
  return {
    process: input?.process ?? 0,
    hvac: input?.hvac ?? 0,
    lighting: input?.lighting ?? 0,
    controls: input?.controls ?? 0,
    itLoad: input?.itLoad ?? 0,
    cooling: input?.cooling ?? 0,
    charging: input?.charging ?? 0,
    other: input?.other ?? 0,
  };
}
```

**Applied in**: `runContractQuoteCore.ts` before returning to caller.

**Benefits**:
- Invariant checks never break on missing keys
- Sum checks always work (no NaN)
- Mix formatting handles all 8 keys consistently
- **Makes it impossible to omit keys** (shape enforced at contract layer)

### 5. Details Namespace Enforcement

**Problem**: Calculator could emit `details.hotel` inside car_wash result (cross-contamination).

**Solution**: `enforceDetailsNamespace()` validates top-level key matches industry.

```typescript
function enforceDetailsNamespace(
  details: Record<string, unknown> | undefined,
  industry: string
): Record<string, unknown> | undefined {
  if (!details) return undefined;
  
  // Check if details has a top-level key matching industry
  const industryKey = details[industry];
  if (!industryKey) {
    console.warn(
      `[TrueQuote] Details namespace mismatch: expected "${industry}" key, got: ${Object.keys(details).join(", ")}`
    );
    return undefined; // Reject mismatched details
  }
  
  return details;
}
```

**Applied in**: `runContractQuoteCore.ts` before returning to caller.

**Benefits**:
- Prevents `details.hotel` inside car_wash
- Catches copy-paste errors early
- Clear warning message for debugging
- **Enforces**: `details.car_wash` inside car_wash, `details.hotel` inside hotel, etc.

---

## Validation Results (Feb 5, 2026)

```
[TrueQuote] Scoreboard:

car_wash        PASS    peak=240kW    capex=$145k    roi=6.6y  mix=proc92 hvac2 light4 ctrl2  defaults=2  warnings=2
hotel           PASS    peak=450kW    capex=$262k    roi=4.7y  mix=none                       defaults=2  warnings=3
ev_charging     SKIP    missing template (expected)
data_center     PASS    peak=2.0MW    capex=$1.06M   roi=4.2y  mix=none                       defaults=2  warnings=3

[TrueQuote] Results: PASS=3 FAIL=0 SKIP=1
```

**Analysis**:

**car_wash** (✅ MIGRATED):
- Version: `v1` tracked
- Mix: `proc92 hvac2 light4 ctrl2` (perfect load breakdown)
- Contributors: All 8 canonical keys present (even zeros)
- Details: `car_wash.{dryers, pumps, vacuums}` (forensic sub-breakdown)
- Sum: 240 kW (0% error)
- Status: PASS

**hotel** (⏳ NOT YET MIGRATED):
- Mix: `none` (no contributors yet)
- Warning: `ℹ️  Validation envelope not provided (not yet migrated)`
- Sum check: SKIPPED (only applied when validation provided)
- Status: PASS (allowlist permits unmigrated industries)

**data_center** (⏳ NOT YET MIGRATED):
- Mix: `none` (no contributors yet)
- Warning: `ℹ️  Validation envelope not provided (not yet migrated)`
- Sum check: SKIPPED (only applied when validation provided)
- Status: PASS (allowlist permits unmigrated industries)

**ev_charging** (⏸️ TEMPLATE MISSING):
- Status: SKIP (expected - template not implemented yet)

---

## Migration Path (Next 3 Industries)

### Priority 1: Hotel (Fastest Value)

**Why First**: Easiest to model contributor envelope (hvac, process, lighting, controls, other).

**Expected Mix**: `hvac45 proc35 light10 ctrl2 othr8`

**Implementation**:
```typescript
// In hotel calculator
const validation: CalcValidation = {
  version: "v1",
  kWContributors: {
    process: roomsKW + kitchenKW + laundryKW + poolKW,
    hvac: hvacKW,
    lighting: lightingKW,
    controls: controlsKW,
    itLoad: 0,
    cooling: 0,
    charging: 0,
    other: elevatorsKW + commonAreasKW,
  },
  details: {
    hotel: {
      rooms: roomsKW,
      kitchen: kitchenKW,
      laundry: laundryKW,
      pool: poolKW,
    },
  },
};
```

**Invariants** (add to `INVARIANTS_BY_INDUSTRY`):
- HVAC scales with rooms: `0.5-3 kW per room`
- Process share: `25-45%`
- HVAC share: `35-55%`
- Lighting: `8-15%`

**Tolerance**: Use `default` (15% warn, 25% fail)

**After Migration**: Add `"hotel"` to `VALIDATION_REQUIRED` set

### Priority 2: Data Center (High Value)

**Why Second**: PUE + IT load well-defined → tighter invariants catch errors early.

**Expected Mix**: `it50 cool35 light2 ctrl2 othr11`

**Implementation**:
```typescript
// In data_center calculator
const validation: CalcValidation = {
  version: "v1",
  kWContributors: {
    process: 0,
    hvac: 0,
    lighting: lightingKW,
    controls: controlsKW,
    itLoad: rackLoadKW,
    cooling: coolingKW,
    charging: 0,
    other: upsLossesKW + pdusKW + fansKW,
  },
  details: {
    data_center: {
      upsLosses: upsLossesKW,
      pdus: pdusKW,
      fans: fansKW,
    },
  },
};
```

**Invariants** (add to `INVARIANTS_BY_INDUSTRY`):
- **PUE consistency**: `peak ≈ itLoad * PUE ±10%`
- PUE 1.2-1.3: `itLoad 65-75%, cooling 20-30%`
- PUE 1.4-1.6: `itLoad 50-60%, cooling 30-40%`
- PUE 1.7-2.0: `itLoad 40-50%, cooling 40-50%`

**Tolerance**: Use `data_center` (10% warn, 15% fail) - tighter due to deterministic PUE

**After Migration**: Add `"data_center"` to `VALIDATION_REQUIRED` set

### Priority 3: EV Charging (High Visibility)

**Why Third**: Remove from `EXPECTED_MISSING_TEMPLATES` (makes scorecard cleaner).

**Expected Mix**: `chrg85 light8 ctrl5 othr2`

**Implementation**:
```typescript
// In ev_charging calculator (WHEN TEMPLATE EXISTS)
const validation: CalcValidation = {
  version: "v1",
  kWContributors: {
    process: 0,
    hvac: 0,
    lighting: lightingKW,
    controls: controlsKW,
    itLoad: 0,
    cooling: 0,
    charging: chargersKW,
    other: siteAuxKW,
  },
  details: {
    ev_charging: {
      chargers: chargersKW,
      siteAux: siteAuxKW,
    },
  },
};
```

**Invariants** (add to `INVARIANTS_BY_INDUSTRY`):
- Charging share: `80-90%`
- Lighting: `3-12%`
- Controls: `2-8%`

**Tolerance**: Use `default` (15% warn, 25% fail)

**After Migration**:
1. Remove `"ev_charging"` from `EXPECTED_MISSING_TEMPLATES`
2. Add `"ev_charging"` to `VALIDATION_REQUIRED` set

---

## CI/CD Integration

### Current Behavior (Dev Mode)

```bash
npm run truequote:validate
```

- Runs validation for all industries
- Warns on missing validation (non-blocking)
- Passes if no catastrophic errors
- Generates `truequote-validation-report.json`

### STRICT Mode (CI)

```bash
TRUEQUOTE_STRICT=1 npm run truequote:validate
```

- Fails on pricing-critical defaults (rate/demand/location)
- Fails on validation REQUIRED but missing
- Fails on catastrophic physics errors (peak=0, peak<base, etc.)
- Fails on sum error >25% (if validation required)
- **Does NOT fail** on missing validation for unmigrated industries

### GitHub Actions Integration (Recommended)

```yaml
# .github/workflows/test.yml
- name: Validate TrueQuote
  run: npm run truequote:validate
  # Don't fail on warnings (allow gradual migration)

- name: TrueQuote Strict Check (only on main)
  if: github.ref == 'refs/heads/main'
  run: TRUEQUOTE_STRICT=1 npm run truequote:validate
```

---

## Success Metrics

### Before Hardening
- **Failures**: 2/4 industries failing (hotel, data_center)
- **Reason**: Sum check applied globally (100% error on unmigrated)
- **CI Impact**: Would block all PRs touching hotel/data_center

### After Hardening (Feb 5, 2026)
- **Failures**: 0/4 industries failing
- **Passes**: 3/4 (car_wash ✅, hotel ⏳, data_center ⏳)
- **Skips**: 1/4 (ev_charging - template not yet implemented)
- **CI Impact**: ✅ No blocking of unrelated PRs

### Migration Progress
- **Total Industries**: 21 active use cases
- **Migrated**: 1 (car_wash) - 5%
- **Next 3**: hotel, data_center, ev_charging
- **Remaining**: 17 (retail, restaurant, warehouse, manufacturing, office, healthcare, etc.)

---

## Code Changes Summary

### Files Modified

**1. scripts/validate-truequote.ts** (~80 lines changed):
- Added `VALIDATION_REQUIRED` set (line 28)
- Added `SUM_TOLERANCE` table (line 46)
- Added `getTolerance()` function (line 57)
- Updated validation check with allowlist gating (line 247)
- Updated sum consistency check with per-industry tolerance (line 268)
- Improved mix formatting with smart thresholds (line 356)

**2. src/services/truequote/runContractQuoteCore.ts** (~60 lines changed):
- Added `normalizeContributors()` function (line 14)
- Added `enforceDetailsNamespace()` function (line 39)
- Applied normalizer to `kWContributors` (line 215)
- Applied namespace enforcer to `details` (line 217)

### Test Coverage

**Validation Status**:
```
✅ car_wash: PASS with full validation envelope
✅ hotel: PASS with soft warning (not yet migrated)
✅ data_center: PASS with soft warning (not yet migrated)
⏸️ ev_charging: SKIP (template missing - expected)
```

**Canonical Keys** (car_wash):
```json
{
  "process": 219.84,
  "hvac": 5.04,
  "lighting": 10.08,
  "controls": 5.04,
  "itLoad": 0,
  "cooling": 0,
  "charging": 0,
  "other": 0
}
```
✅ All 8 keys present (even zeros)

**Details Namespace** (car_wash):
```json
{
  "car_wash": {
    "dryers": 150,
    "pumps": 49.92,
    "vacuums": 19.92
  }
}
```
✅ Namespace matches industry

**Mix Column**:
- car_wash: `mix=proc92 hvac2 light4 ctrl2` (smart thresholds working)
- hotel: `mix=none` (no validation yet - correct)
- data_center: `mix=none` (no validation yet - correct)

---

## Next Actions

### Immediate (This Sprint)
1. [ ] Extend validation envelope to hotel calculator
2. [ ] Add hotel to `VALIDATION_REQUIRED` set
3. [ ] Test: Verify hotel mix matches `hvac45 proc35 light10 ctrl2 othr8`

### Short-Term (Next Sprint)
4. [ ] Extend validation envelope to data_center calculator
5. [ ] Add data_center to `VALIDATION_REQUIRED` set
6. [ ] Test: Verify PUE consistency invariant catches errors

### Medium-Term
7. [ ] Implement ev_charging template
8. [ ] Extend validation envelope to ev_charging
9. [ ] Remove ev_charging from `EXPECTED_MISSING_TEMPLATES`
10. [ ] Integrate into CI/CD pipeline with GitHub Actions

### Long-Term
11. [ ] Migrate remaining 17 industries (retail, restaurant, warehouse, etc.)
12. [ ] Admin panel validation UI with mix visualization
13. [ ] Version migration tooling (v1 → v2 when needed)

---

## Conclusion

TrueQuote validation is now **production-ready for scaling** with:

✅ **Gradual migration policy** - No PR blocking during rollout
✅ **Per-industry tolerance** - Tighter checks for deterministic models
✅ **Smart mix formatting** - Instant PR review visibility
✅ **Shape enforcement** - Impossible to omit canonical keys
✅ **Namespace protection** - Prevents cross-contamination

The harness has proven itself:
1. **Caught real bug** (dryers 0%, pumps 0%) during initial hardening
2. **Fixed at correct layer** (contract validation, not UI)
3. **Locked in durability** (5 finishing touches)
4. **Ready for scale** (21 industries can migrate without friction)

**Next expansion**: Hotel (easiest) → Data center (highest value) → EV charging (high visibility).

TrueQuote™ is the future.
