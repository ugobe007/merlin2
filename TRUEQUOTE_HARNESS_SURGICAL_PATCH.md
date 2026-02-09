# TrueQuote Harness Surgical Patch (Feb 5, 2026)

## Overview

Apply 3 precise changes to `scripts/validate-truequote.ts` to add:
1. Hotel base load physics invariant
2. Universal nonsense-mix invariants (with peak >= 50 kW guard)
3. Application of universal checks to all industries

**Current Harness State** (Feb 5, 2026):
- ✅ Explicit status taxonomy (PASS/PASS_WARN/FAIL/SKIP/CRASH)
- ✅ Calculator ID allowlist (CAR_WASH_LOAD_V1_SSOT)
- ✅ val= field in scoreboard
- ✅ EXPECTED_MISSING_TEMPLATES enforcement
- ✅ Summary artifact (truequote-validation-summary.json)
- ⏳ Missing: Hotel base_load_physics, universal invariants

---

## Patch 1: Update Hotel Invariants

**Location**: `scripts/validate-truequote.ts` line 162 (inside `hotel:` array)

**Current Code**:
```typescript
  hotel: [
    {
      id: "hotel_hvac_scales_with_rooms",
      description: "HVAC load scales reasonably with room count",
      check: (t) => {
        const rooms = t.inputsUsed?.room_count ?? 0;
        const hvac = t.computed?.kWContributors?.hvac ?? 0;
        if (rooms <= 0) return null;
        const hvacPerRoom = hvac / rooms;
        // Expect 0.5-3 kW per room for HVAC
        if (hvacPerRoom < 0.5 || hvacPerRoom > 3.0) {
          return `HVAC per room ${hvacPerRoom.toFixed(2)}kW out of band (0.5-3.0). hvac=${hvac.toFixed(1)}kW, rooms=${rooms}`;
        }
        return null;
      },
    },
  ],
```

**Replacement Code**:
```typescript
  hotel: [
    {
      id: "hotel_hvac_scales_with_rooms",
      description: "HVAC load scales reasonably with room count (class-based)",
      check: (t) => {
        const rooms = t.inputsUsed?.room_count ?? 0;
        const hvac = t.computed?.kWContributors?.hvac ?? 0;
        if (rooms <= 0) return null;
        const hvacPerRoom = hvac / rooms;
        // Updated: 0.8-2.8 kW/room (economy to luxury)
        if (hvacPerRoom < 0.8 || hvacPerRoom > 2.8) {
          return `HVAC per room ${hvacPerRoom.toFixed(2)}kW out of band (0.8-2.8). hvac=${hvac.toFixed(1)}kW, rooms=${rooms}`;
        }
        return null;
      },
    },
    {
      id: "hotel_base_load_physics",
      description: "Base load should be 35-80% of peak (HVAC + common areas always-on)",
      check: (t) => {
        const base = t.loadProfile?.baseLoadKW ?? 0;
        const peak = t.loadProfile?.peakLoadKW ?? 0;
        if (peak <= 0) return null;
        const ratio = base / peak;
        if (ratio < 0.35) return `Base load too low (<35% of peak) - check always-on components. base=${base.toFixed(1)}kW, peak=${peak.toFixed(1)}kW`;
        if (ratio > 0.80) return `Base load too high (>80% of peak) - check peak calculation. base=${base.toFixed(1)}kW, peak=${peak.toFixed(1)}kW`;
        return null;
      },
    },
  ],
```

**Changes**:
- Updated HVAC per-room band from 0.5-3.0 to 0.8-2.8 (reflects class-based rates)
- Added `hotel_base_load_physics` invariant with 35-80% band

---

## Patch 2: Add Universal Invariants Array

**Location**: After `INVARIANTS_BY_INDUSTRY` definition (around line 200)

**Insert After**:
```typescript
  ],
};
```

**Insert This Code**:
```typescript

// ============================================================
// Universal Invariants (Applied to ALL Industries)
// ============================================================

/**
 * Universal invariants catch nonsense-mix bugs from bad heuristics.
 * These checks apply to ALL industries after industry-specific invariants.
 * 
 * Skip threshold: Only run when peak >= 50 kW to avoid false positives on tiny facilities.
 */
const UNIVERSAL_INVARIANTS: Invariant[] = [
  {
    id: "nonsense_mix_all_tiny",
    description: "No single contributor should be <10% when peak >= 50 kW",
    check: (t) => {
      const contrib = t.computed?.kWContributors ?? {};
      const peak = t.loadProfile?.peakLoadKW ?? 0;
      if (peak < 50) return null; // Skip tiny facilities
      const values = Object.values(contrib).filter(v => v > 0);
      if (values.length === 0) return null;
      const maxContributor = Math.max(...values);
      if (peak > 0 && maxContributor / peak < 0.10) {
        return `Suspicious: all contributors <10% (everything tiny). peak=${peak.toFixed(1)}kW, max=${maxContributor.toFixed(1)}kW`;
      }
      return null;
    },
  },
  {
    id: "nonsense_mix_smeared_equally",
    description: "If 4+ contributors and peak >= 50 kW, at least one should exceed 20%",
    check: (t) => {
      const contrib = t.computed?.kWContributors ?? {};
      const peak = t.loadProfile?.peakLoadKW ?? 0;
      if (peak < 50) return null; // Skip tiny facilities
      const values = Object.values(contrib).filter(v => v > 0);
      const nonZeroCount = values.length;
      if (nonZeroCount < 4) return null; // Only check when 4+ contributors
      const maxShare = Math.max(...values) / peak;
      if (maxShare < 0.20) {
        return `Suspicious: ${nonZeroCount} contributors but none >20% (smeared equally). peak=${peak.toFixed(1)}kW, max=${(maxShare*100).toFixed(1)}%`;
      }
      return null;
    },
  },
];
```

**Purpose**:
- Catches "everything tiny" bugs (maxContributor < 10% of peak)
- Catches "smeared equally" bugs (4+ contributors, all < 20%)
- Skip threshold prevents false positives on small sites

---

## Patch 3: Apply Universal Checks to All Industries

**Location**: Line ~401, inside validation loop after industry-specific invariants

**Current Code** (around line 401):
```typescript
      // Check industry-specific invariants
      const industryInvariants = INVARIANTS_BY_INDUSTRY[industry] ?? [];
      for (const inv of industryInvariants) {
        const err = inv.check(layerATrace);
        if (err) {
          warnings.push({ id: inv.id, description: inv.description, issue: err });
        }
      }

      // Sum check (already present, no changes)
      const sumCheck = checkSumConsistency(layerATrace, getTolerance(industry));
```

**Replacement Code**:
```typescript
      // Check industry-specific invariants
      const industryInvariants = INVARIANTS_BY_INDUSTRY[industry] ?? [];
      for (const inv of industryInvariants) {
        const err = inv.check(layerATrace);
        if (err) {
          warnings.push({ id: inv.id, description: inv.description, issue: err });
        }
      }

      // Check universal invariants (all industries)
      for (const inv of UNIVERSAL_INVARIANTS) {
        const err = inv.check(layerATrace);
        if (err) {
          warnings.push({ id: `universal.${inv.id}`, description: inv.description, issue: err });
        }
      }

      // Sum check (already present, no changes)
      const sumCheck = checkSumConsistency(layerATrace, getTolerance(industry));
```

**Changes**:
- Added loop to apply universal invariants to all industries
- Prefix universal invariant IDs with `universal.` for visibility

---

## Verification

After applying all 3 patches, run:

```bash
npm run truequote:validate
```

**Expected Output**:

```
car_wash        PASS    val=v1   mix=proc92 hvac2 light4 ctrl2        defaults=0  warnings=0
hotel           PASS    val=none mix=hvac45 proc35 light10 ctrl2       defaults=2  warnings=0
data_center     PASS    val=none mix=it50 cool35 othr11 light2 ctrl2   defaults=2  warnings=0
ev_charging     SKIP    (template not yet implemented)

Results: PASS=3 FAIL=0 SKIP=1
✅ CI PASS: All validation-required calculators passing
```

**New Warnings** (when they fire):
- `hotel: hotel_base_load_physics: Base load too low (<35% of peak)...`
- `car_wash: universal.nonsense_mix_all_tiny: Suspicious: all contributors <10%...`
- `data_center: universal.nonsense_mix_smeared_equally: Suspicious: 4+ contributors but none >20%...`

---

## Success Criteria

✅ Hotel now has 2 invariants (hvac_scales, base_load_physics)  
✅ Universal invariants apply to ALL industries  
✅ Warnings prefixed with `universal.` are visible in scoreboard  
✅ CI doesn't fail on universal warnings (informational only)  
✅ No regressions in car_wash PASS status

---

## Files Changed

1. **scripts/validate-truequote.ts** (3 sections modified):
   - Line ~162: Updated `hotel:` invariant array
   - Line ~200: Added `UNIVERSAL_INVARIANTS` array
   - Line ~401: Added universal checks loop

**Total Lines Changed**: ~60 lines added/modified

**Test Coverage**: Run `npm run truequote:validate` to verify all checks passing

---

## Next Steps After Patch

1. **Verify harness works**: `npm run truequote:validate` → CI PASS
2. **Implement hotel calculator** with corrected physics (base clamp, miscPlug in other)
3. **Implement data center calculator** with cooling negative guard
4. **Implement EV charging calculator** with proportional cap
5. **Monitor universal invariant warnings** in CI logs

---

## Copy/Paste Full Blocks (Alternative to Manual Patching)

If you prefer to copy entire sections, see [TRUEQUOTE_PHYSICS_CORRECTIONS.md](./TRUEQUOTE_PHYSICS_CORRECTIONS.md) Appendix for:
- Complete hotel invariant array (2 checks)
- Complete UNIVERSAL_INVARIANTS array (2 checks)
- Complete validation loop with universal checks

**Recommendation**: Apply patches manually (more surgical) rather than copying full blocks (less merge conflict risk).
