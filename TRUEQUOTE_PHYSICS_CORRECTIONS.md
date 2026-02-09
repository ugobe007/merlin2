# TrueQuote Physics Corrections (Feb 5, 2026)

## Overview

Applied 6 physics-level corrections to [TRUEQUOTE_MIGRATION_ARCHITECTURE.md](./TRUEQUOTE_MIGRATION_ARCHITECTURE.md) to prevent brittle invariants and handle edge cases when models meet real-world configs.

**Status**: ✅ All corrections applied  
**Impact**: Prevents "paint yourself into a corner" scenarios  
**Architecture**: Preserved (file paths, calculator IDs, validation principles unchanged)

---

## Corrections Applied

### 1. Hotel: Derived dutyCycle (Not Occupancy)

**Problem**: Using `dutyCycle = occupancy (0.4)` then `base = peak * dutyCycle` materially understates base load. HVAC + common areas run even at low occupancy.

**Fix**:
```typescript
// ❌ BEFORE: Assumed dutyCycle
const dutyCycle = 0.4; // 40% occupancy
const baseLoadKW = peakLoadKW * dutyCycle;

// ✅ AFTER: Derived from physics
let baseLoadKW = controlsKW +           // Always-on
                 0.6 * lightingKW +     // Common areas
                 0.5 * hvacKW +         // Baseline HVAC
                 0.2 * processKW;       // Intermittent loads

// Safety clamp: prevent dutyCycle > 1 in edge cases
if (baseLoadKW > 0.95 * peakLoadKW) {
  trace.notes.push("base_clamped_to_peak");
  baseLoadKW = 0.95 * peakLoadKW;
}

const dutyCycle = baseLoadKW / peakLoadKW; // Derived, not assumed
```

**Energy Calculation**:
```typescript
// Two-level schedule (base 24h + peaks)
const peakHours = 8; // Kitchen/laundry peak hours per day
const energyKWhPerDay = baseLoadKW * 24 + (peakLoadKW - baseLoadKW) * peakHours;
```

**New Invariant**: `hotel_base_load_physics`
- **Check**: Base should be 35-80% of peak
- **Reason**: HVAC + common areas always-on → higher base than occupancy suggests
- **Note**: Wide band accommodates resort/luxury with huge always-on amenities

---

### 2. Hotel: Class-Based HVAC Rates

**Problem**: Single HVAC rate (1.5 kW/room) doesn't reflect hotel class variation.

**Fix**:
```typescript
// ❌ BEFORE: One-size-fits-all
const hvacKW = roomCount * 1.5;

// ✅ AFTER: Class-based bands
const HVAC_KW_PER_ROOM: Record<string, number> = {
  economy: 1.0,   // 0.8-1.2 kW/room
  midscale: 1.5,  // 1.2-1.8 kW/room
  upscale: 2.2,   // 1.8-2.8 kW/room (larger rooms, more common area)
  luxury: 2.5,    // 2.2-2.8 kW/room
};
const hvacKW = roomCount * HVAC_KW_PER_ROOM[hotelClass];
```

**Updated Invariant**: `hotel_hvac_scales_with_rooms`
- **Old Band**: 35-55% HVAC share
- **New Band**: 30-60% HVAC share (accommodates class variation)

---

### 3. Hotel: Clearer "process" Definition

**Problem**: "process" included rooms + kitchen + laundry + pool → rooms might dominate and break `proc35` expectation.

**Fix**:
```typescript
// ✅ AFTER: Separated components
const kitchenKW = hasRestaurant ? roomCount * 0.8 : 0;
const laundryKW = hasLaundry ? roomCount * 0.3 : 0;
const poolKW = hasPool ? 50 : 0;
const miscPlugKW = roomCount * 0.15; // In-room misc plugs

// "process" = intermittent loads (kitchen, laundry, pool)
// miscPlugKW goes to "other" (semantically cleaner for always-on-ish loads)
const processKW = kitchenKW + laundryKW + poolKW;
const otherKW = miscPlugKW; // Distinct from process for semantic consistency
```

**Updated Invariant**: `hotel_process_share_band`
- **Old Band**: 25-45% process share (included rooms)
- **New Band**: 15-35% process share (cleaner definition)
- **Note**: If rooms were a major contributor before, this reduces process share

---

### 4. Data Center: Exact-Sum Accounting

**Problem**: Double-count risk in infrastructure accounting:
```typescript
// ❌ BEFORE: Risk of double-counting lighting/controls
coolingKW = infrastructureKW - upsLosses - pdus - fans  // Missing lighting/controls
lightingKW = total * 0.02  // Added separately
controlsKW = total * 0.02  // Added separately
// Result: sum = total + lighting + controls ❌
```

**Fix (Option A - Recommended)**:
```typescript
// ✅ AFTER: Exact-sum allocation
const totalFacilityKW = itLoadKW * pue;

// Explicit non-cooling infrastructure
const upsLossesKW = hasUPS ? itLoadKW * 0.05 : 0;
const pdusKW = itLoadKW * 0.03;
const fansKW = itLoadKW * 0.04;
const otherKW = upsLossesKW + pdusKW + fansKW;

// Lighting/controls as % of total
const lightingKW = totalFacilityKW * 0.02;
const controlsKW = totalFacilityKW * 0.02;

// Cooling: remainder (sum=total by construction)
let coolingKW = totalFacilityKW - itLoadKW - otherKW - lightingKW - controlsKW;

// Guard: prevent negative cooling (low PUE or high infra losses)
if (coolingKW < 0) {
  trace.notes.push("cooling_remainder_negative");
  otherKW += coolingKW; // Roll negative into other to preserve sum
  coolingKW = 0;
}
```

**Result**: `sum(contributors) = peakLoadKW` exactly (0% error by design)

**Updated Expected Output**:
```
✅ Sum: 2000 kW (0% error by construction - cooling computed as remainder)
✅ Expected Bands: itLoad 40-65%, cooling 25-45%, other 5-20%, lighting 1-5%, controls 1-5%
```

---

### 5. EV Charging: Per-Type Concurrency

**Problem**: Uniform concurrency across L2/DCFC/HPC → unrealistic. L2 has high dwell, HPC is bursty.

**Fix**:
```typescript
// ❌ BEFORE: Same concurrency for all
const level2KW = level2Count * 7 * concurrency;
const dcfcKW = dcfcCount * 150 * concurrency;
const hpcKW = hpcCount * 350 * concurrency;

// ✅ AFTER: Per-type concurrency
const l2Concurrency = Math.min(0.9, concurrency + 0.1);  // Higher dwell
const dcfcConcurrency = concurrency;                     // Medium
const hpcConcurrency = Math.max(0.4, concurrency - 0.2); // Bursty, demand-managed

const level2KW = level2Count * 7 * l2Concurrency;
const dcfcKW = dcfcCount * 150 * dcfcConcurrency;
const hpcKW = hpcCount * 350 * hpcConcurrency;
```

**Additional Feature**: Site demand cap (applied proportionally)
```typescript
// Common in real deployments
let chargersKW = level2KW + dcfcKW + hpcKW;
if (siteDemandCapKW && chargersKW > siteDemandCapKW) {
  // Apply cap proportionally to preserve forensic breakdown
  const scaleFactor = siteDemandCapKW / chargersKW;
  level2KW *= scaleFactor;
  dcfcKW *= scaleFactor;
  hpcKW *= scaleFactor;
  chargersKW = siteDemandCapKW;
  trace.notes.push("site_demand_cap_applied");
}
// Now details.ev_charging.{level2,dcfc,hpc} match chargersKW exactly
```

**Updated Expected Output**:
```
✅ Details: ev_charging.{level2, dcfc, hpc, siteAux} (per-type concurrency)
✅ Sum: 3500 kW (0% error, capped by site demand limit if provided)
✅ Expected Bands: charging 80-95%, lighting 2-10%, controls 1-6%, other 1-10%
```

---

### 6. Universal "Nonsense Mix" Invariants

**Problem**: Need to catch "everything smeared equally" bugs from bad heuristics.

**Fix**: Added 2 universal checks applied to ALL industries:

```typescript
const UNIVERSAL_INVARIANTS: Invariant[] = [
  {
    id: "nonsense_mix_all_tiny",
    description: "No single contributor should dominate <10% (suspicious)",
    check: (trace) => {
      const contrib = trace.computed?.kWContributors || {};
      const peak = trace.loadProfile?.peakLoadKW || 1;
      // Skip for tiny facilities to avoid false positives
      if (peak < 50) return null;
      const maxContributor = Math.max(...Object.values(contrib));
      if (peak > 0 && maxContributor / peak < 0.10) {
        return "Suspicious: all contributors <10% (everything tiny)";
      }
      return null;
    },
  },
  {
    id: "nonsense_mix_smeared_equally",
    description: "If 4+ contributors, at least one should exceed 20%",
    check: (trace) => {
      const contrib = trace.computed?.kWContributors || {};
      const peak = trace.loadProfile?.peakLoadKW || 1;
      // Skip for tiny facilities to avoid false positives
      if (peak < 50) return null;
      const nonZeroCount = Object.values(contrib).filter(v => v > 0).length;
      const maxShare = Math.max(...Object.values(contrib)) / peak;
      // Raised to 4+ contributors (more conservative)
      if (nonZeroCount >= 4 && maxShare < 0.20) {
        return "Suspicious: 4+ contributors but none >20% (smeared equally)";
      }
      return null;
    },
  },
];
```

**When They Fire**:
- **all_tiny**: Every component < 10% of peak (something wrong with heuristic)
- **smeared_equally**: 3+ components but none dominant (unrealistic for real facilities)

---

## Documentation Change: Bands vs Exact Percentages

**Problem**: Exact percentages (`hvac45 proc35 light10`) cause "doc mismatch panic" when coefficients tweaked.

**Fix**: Changed all expected mixes to **bands**:

| Industry | Old (Exact) | New (Bands) |
|----------|-------------|-------------|
| **Hotel** | hvac45 proc35 light10 ctrl2 othr8 | hvac 30-60%, process 15-35%, lighting 5-15%, controls 1-5%, other 10-25% |
| **Data Center** | it50 cool35 othr11 light2 ctrl2 | itLoad 40-65%, cooling 25-45%, other 5-20%, lighting 1-5%, controls 1-5% |
| **EV Charging** | chrg88 light7 ctrl3 othr2 | charging 80-95%, lighting 2-10%, controls 1-6%, other 1-10% |

**Benefits**:
- ✅ Prevents false-positive failures when coefficients refined
- ✅ Documents expected ranges, not brittle targets
- ✅ Aligns with harness band-checking logic

---

## Impact Summary

### Before Corrections (Risk Profile)

| Issue | Risk | Impact if Uncorrected |
|-------|------|----------------------|
| Hotel dutyCycle=occupancy | **HIGH** | Base load understatement → payback error → lost deals |
| Single HVAC rate | **MEDIUM** | Upscale hotels fail invariant → false negatives in CI |
| "process" includes rooms | **MEDIUM** | Dominates mix → breaks proc35 expectation |
| DC double-counting | **HIGH** | sum>total → CI fails → blocks PR merges |
| Uniform EV concurrency | **LOW** | Inaccurate but won't crash (cosmetic) |
| No nonsense-mix check | **MEDIUM** | Bad heuristics slip through → garbage quotes |

### After Corrections (Production-Ready)

| Feature | Status | Benefit |
|---------|--------|---------|
| Derived dutyCycle | ✅ APPLIED | Accurate base load → correct payback |
| Class-based HVAC | ✅ APPLIED | Handles economy to luxury → no false failures |
| Clear process definition | ✅ APPLIED | Predictable mix → invariants hold |
| Exact-sum DC accounting | ✅ APPLIED | sum=total by construction → CI stable |
| Per-type EV concurrency | ✅ APPLIED | Realistic load profiles → accurate sizing |
| Universal nonsense checks | ✅ APPLIED | Catches heuristic bugs → prevents garbage quotes |
| Expected bands | ✅ APPLIED | Documentation stable → no panic on tweaks |

---

## Migration Timeline (Unchanged)

**Physics corrections DO NOT change the timeline** — they improve the *quality* of implementations:

| Day | Task | Physics Impact |
|-----|------|----------------|
| **Day 1** | Hotel template + calculator | ✅ Corrected dutyCycle logic |
| **Day 2** | Hotel validation + CI pass | ✅ New base_load_physics invariant |
| **Day 3** | Data center template + calculator | ✅ Exact-sum accounting |
| **Day 4** | Data center validation + CI pass | ✅ sum=total by construction |
| **Day 5** | EV charging implementation | ✅ Per-type concurrency |

**Total**: 5 days (same as before, but higher quality models)

---

## Next Steps

### Immediate (Pre-Implementation)

1. **Review with founders** — Confirm class-based HVAC bands, process definition
2. **Test universal invariants** — Add to `validate-truequote.ts`, test against car_wash
3. **Update copilot-instructions.md** — Document derived dutyCycle, exact-sum patterns

### Implementation (Hotel → DC → EV)

4. **Implement hotel calculator** with corrected physics:
   - Derived dutyCycle from always-on components
   - Class-based HVAC rates
   - Clear process definition
5. **Implement data center calculator** with exact-sum accounting:
   - `cooling = total - it - otherInfra - lighting - controls`
   - Test sum invariant (should be 0% error always)
6. **Implement EV charging calculator** with per-type concurrency:
   - L2/DCFC/HPC different concurrency factors
   - Optional site demand cap

### Post-Migration

7. **Monitor universal invariants** — Watch for nonsense-mix warnings in CI
8. **Refine bands if needed** — Adjust expected ranges based on real quotes
9. **Document in README** — Add "Physics Modeling Standards" section

---

## Files Changed

### Core Architecture (Corrected)
- ✅ [TRUEQUOTE_MIGRATION_ARCHITECTURE.md](./TRUEQUOTE_MIGRATION_ARCHITECTURE.md)
  - Hotel calculator pseudocode (87 lines)
  - Data center calculator pseudocode (76 lines)
  - EV charging calculator pseudocode (71 lines)
  - Universal invariants section (new)
  - Expected validation outputs (all 3 industries)

### Harness (To Be Updated)
- ⏳ [scripts/validate-truequote.ts](./scripts/validate-truequote.ts)
  - Add `UNIVERSAL_INVARIANTS` array
  - Add `hotel_base_load_physics` invariant
  - Update `hotel_hvac_scales_with_rooms` band (30-60%)
  - Update `hotel_process_share_band` band (15-35%)

---

## Success Criteria

After implementing all 3 calculators with physics corrections:

```bash
npm run truequote:validate
```

**Expected Output**:
```
car_wash        PASS   val=v1   mix=proc92 hvac2 light4 ctrl2        defaults=0  warnings=0
hotel           PASS   val=v1   mix=hvac48 proc22 light11 ctrl2       defaults=0  warnings=0
data_center     PASS   val=v1   mix=it50 cool36 othr10 light2 ctrl2   defaults=0  warnings=0
ev_charging     PASS   val=v1   mix=chrg87 light7 ctrl4 othr2         defaults=0  warnings=0

Results: PASS=4 FAIL=0 SKIP=0
✅ CI PASS: All 4 industries validated successfully
```

**Key Metrics**:
- ✅ All industries `val=v1` (migrated)
- ✅ Hotel: Base/Peak ratio 40-70% ✓
- ✅ Data Center: sum=2000 kW (0% error by construction) ✓
- ✅ EV Charging: Charging dominance 80-95% ✓
- ✅ No universal invariant warnings

---

## Conclusion

These 6 physics corrections prevent brittle invariants and handle real-world config edge cases without changing the migration architecture's file structure, calculator IDs, or validation principles.

**Bottom Line**: Same plan, better physics → production-ready models that won't break when founders enter weird configs.

---

## Appendix: Copy/Paste Blocks for Implementation

To reduce implementation variance, here are exact code blocks for `scripts/validate-truequote.ts`:

### A. Hotel Base Load Physics Invariant

```typescript
{
  id: "hotel_base_load_physics",
  description: "Base load should be 35-80% of peak (HVAC + common areas always-on)",
  check: (trace) => {
    const base = trace.loadProfile?.baseLoadKW || 0;
    const peak = trace.loadProfile?.peakLoadKW || 1;
    const ratio = base / peak;
    if (ratio < 0.35) return "Base load too low (<35% of peak) - check always-on components";
    if (ratio > 0.80) return "Base load too high (>80% of peak) - check peak calculation";
    return null;
  },
},
```

### B. Updated Hotel HVAC Band

```typescript
{
  id: "hotel_hvac_scales_with_rooms",
  description: "HVAC should be 30-60% of peak (class-based rates)",
  check: (trace) => {
    const hvac = trace.computed?.kWContributors?.hvac || 0;
    const peak = trace.loadProfile?.peakLoadKW || 1;
    const share = hvac / peak;
    if (share < 0.30 || share > 0.60) {
      return `HVAC ${(share*100).toFixed(0)}% of peak (expected 30-60%)`;
    }
    return null;
  },
},
```

### C. Updated Hotel Process Band

```typescript
{
  id: "hotel_process_share_band",
  description: "Process loads (kitchen+laundry+pool) should be 15-35% of peak",
  check: (trace) => {
    const process = trace.computed?.kWContributors?.process || 0;
    const peak = trace.loadProfile?.peakLoadKW || 1;
    const share = process / peak;
    if (share < 0.15 || share > 0.35) {
      return `Process ${(share*100).toFixed(0)}% of peak (expected 15-35%)`;
    }
    return null;
  },
},
```

### D. Universal Nonsense-Mix Invariants

```typescript
const UNIVERSAL_INVARIANTS: Invariant[] = [
  {
    id: "nonsense_mix_all_tiny",
    description: "No single contributor should be <10% when peak >= 50 kW",
    check: (trace) => {
      const contrib = trace.computed?.kWContributors || {};
      const peak = trace.loadProfile?.peakLoadKW || 1;
      if (peak < 50) return null; // Skip tiny facilities
      const maxContributor = Math.max(...Object.values(contrib));
      if (peak > 0 && maxContributor / peak < 0.10) {
        return "Suspicious: all contributors <10% (everything tiny)";
      }
      return null;
    },
  },
  {
    id: "nonsense_mix_smeared_equally",
    description: "If 4+ contributors and peak >= 50 kW, at least one should exceed 20%",
    check: (trace) => {
      const contrib = trace.computed?.kWContributors || {};
      const peak = trace.loadProfile?.peakLoadKW || 1;
      if (peak < 50) return null; // Skip tiny facilities
      const nonZeroCount = Object.values(contrib).filter(v => v > 0).length;
      const maxShare = Math.max(...Object.values(contrib)) / peak;
      if (nonZeroCount >= 4 && maxShare < 0.20) {
        return "Suspicious: 4+ contributors but none >20% (smeared equally)";
      }
      return null;
    },
  },
];
```

### E. How to Add to Harness

1. **Find INVARIANTS_BY_INDUSTRY** in `scripts/validate-truequote.ts`
2. **Update hotel array** with blocks A, B, C
3. **Add UNIVERSAL_INVARIANTS** array (block D) before main validation loop
4. **Apply universal checks** to all industries after industry-specific invariants

**Implementation Pattern**:
```typescript
// Industry-specific invariants
const industryInvariants = INVARIANTS_BY_INDUSTRY[industry] || [];
for (const inv of industryInvariants) {
  const error = inv.check(contractTrace);
  if (error) warnings.push(`${inv.id}: ${error}`);
}

// Universal invariants (all industries)
for (const inv of UNIVERSAL_INVARIANTS) {
  const error = inv.check(contractTrace);
  if (error) warnings.push(`universal.${inv.id}: ${error}`);
}
```
