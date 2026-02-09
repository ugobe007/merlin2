# TrueQuote™ Lock-In Complete

**Date**: February 5, 2026  
**Status**: ✅ PRODUCTION READY - Locked & Versioned

---

## 🎯 Objective

Implement 5 "lock it in" improvements to make TrueQuote™ validation contract durable as we scale to hotel/data_center/ev_charging.

**User Guidance (verbatim):**
> "A few 'lock it in' moves so this stays durable as you expand to hotel/data_center/ev:
> 1) Freeze the Validation Contract as a versioned interface
> 2) Keep canonical keys stable, but allow industry-specific sub-breakdowns
> 3) Make invariants assert sum consistency once, then band-check on canonical keys
> 4) STRICT defaults: graduate from 'fail on any default' to 'fail on pricing-critical defaults'
> 5) Next expansion order (fastest value)"

---

## ✅ Implementation Complete

### 1. Versioned Validation Contract

**Added version field to CalcValidation:**
```typescript
export type CalcValidation = {
  version: "v1";  // ✅ Schema version for drift detection
  dutyCycle?: number;
  kWContributors?: Record<ContributorKeys, number>;
  kWContributorsTotalKW?: number;
  kWContributorShares?: Record<string, number>;
  details?: { ... };  // Industry-specific sub-breakdowns
  notes?: string[];
};
```

**Harness version check:**
```typescript
const validationVersion = layerA.computed?.version;
if (validationVersion && validationVersion !== "v1") {
  status = "fail";
  warnings.push(`⚠️ Validation contract version mismatch: expected v1, got ${validationVersion}`);
}
```

**Benefits:**
- Prevents silent drift when someone tweaks key names
- Explicit contract versioning enables safe evolution
- Hard fail on version mismatch (no implicit assumptions)

---

### 2. Canonical Keys + Industry Details

**Canonical contributor keys (ALWAYS present, stable across industries):**
```typescript
export type ContributorKeys =
  | 'process'   // Industry-specific process loads
  | 'hvac'      // HVAC/climate control
  | 'lighting'  // Facility lighting
  | 'controls'  // PLC/controls/BMS/payment systems
  | 'itLoad'    // IT equipment (data centers)
  | 'cooling'   // Dedicated cooling (separate from HVAC)
  | 'charging'  // EV charging equipment
  | 'other';    // Miscellaneous loads
```

**Industry-specific forensic details (optional sub-breakdowns):**
```typescript
details?: {
  car_wash?: { dryers?: number; pumps?: number; vacuums?: number };
  hotel?: { rooms?: number; kitchen?: number; laundry?: number; pool?: number };
  data_center?: { upsLosses?: number; pdus?: number; fans?: number };
  ev_charging?: { chargers?: number; siteAux?: number };
  [industry: string]: Record<string, number> | undefined;
};
```

**Car wash implementation:**
```typescript
const validation: CalcValidation = {
  version: "v1",
  kWContributors: {
    process: processKW,        // Canonical (dryers + pumps + vacuums rolled up)
    hvac: hvacKW,              // Canonical
    lighting: lightingKW,      // Canonical
    controls: controlsKW,      // Canonical
    itLoad: 0,                 // Canonical (not applicable)
    cooling: 0,                // Canonical (not applicable)
    charging: 0,               // Canonical (not applicable)
    other: 0,                  // Canonical
  },
  details: {
    car_wash: {
      dryers: dryersKW,        // Forensic sub-breakdown
      pumps: waterPumpsKW,     // Forensic sub-breakdown
      vacuums: vacuumsKW,      // Forensic sub-breakdown
    },
  },
};
```

**Benefits:**
- Invariants never depend on industry-specific keys (stable)
- Forensic tracing preserved in `details` envelope
- Clear separation: canonical (for validation) vs forensic (for debugging)

---

### 3. Two-Layer Invariant System

**Universal: Sum Consistency Check**
```typescript
// ALL industries must satisfy this (physics sanity)
const contrib = layerA.computed?.kWContributors || {};
const contribSum = Object.values(contrib).reduce((sum, kw) => sum + (kw || 0), 0);
const peak = layerA.loadProfile?.peakLoadKW || 1;
const sumError = Math.abs(contribSum - peak) / peak;

// Tolerance: 15% for industries with complex load profiles
if (sumError > 0.15 && peak > 0) {
  warnings.push(
    `⚠️ Contributors sum ${contribSum.toFixed(1)}kW vs peak ${peak.toFixed(1)}kW (${(sumError * 100).toFixed(1)}% error > 15% tolerance)`
  );
}

// Hard fail if >25% error (catastrophic mismatch)
const hardFail = sumError > 0.25;
```

**Industry-Specific: Band Checks on Canonical Keys**
```typescript
// Car wash: process load should dominate (80-95%)
car_wash: [
  {
    id: "cw_process_share_band",
    description: "Process loads (dryers+pumps+vacuums) share of peak load within expected band (80-95%)",
    check: (t) => {
      const process = t.computed?.kWContributors?.process ?? 0;  // ✅ Canonical key
      const peak = t.loadProfile?.peakLoadKW ?? 0;
      const share = process / peak;
      if (share < 0.80 || share > 0.95) {
        return `Process share ${(share * 100).toFixed(1)}% out of band (80-95%)`;
      }
      return null;
    },
  },
],

// Hotel: HVAC should scale with rooms (0.5-3 kW per room)
hotel: [
  {
    id: "hotel_hvac_scales_with_rooms",
    check: (t) => {
      const rooms = t.inputsUsed?.room_count ?? 0;
      const hvac = t.computed?.kWContributors?.hvac ?? 0;  // ✅ Canonical key
      const hvacPerRoom = hvac / rooms;
      if (hvacPerRoom < 0.5 || hvacPerRoom > 3.0) {
        return `HVAC per room ${hvacPerRoom.toFixed(2)}kW out of band (0.5-3.0)`;
      }
      return null;
    },
  },
],

// Data center: peak ≈ itLoad * PUE (±10%)
data_center: [
  {
    id: "dc_pue_affects_energy",
    check: (t) => {
      const pue = t.inputsUsed?.pue ?? 1.5;
      const itLoad = t.computed?.kWContributors?.itLoad ?? 0;  // ✅ Canonical key
      const totalPeak = t.loadProfile?.peakLoadKW ?? 0;
      const observedPUE = totalPeak / itLoad;
      const tolerance = 0.10;
      if (Math.abs(observedPUE - pue) / pue > tolerance) {
        return `Observed PUE ${observedPUE.toFixed(2)} doesn't match input PUE ${pue.toFixed(2)}`;
      }
      return null;
    },
  },
],
```

**Benefits:**
- Universal sum check catches catastrophic errors early
- Industry bands tune over time without coupling to forensic keys
- Clear separation: physics sanity (global) vs domain sanity (industry)

---

### 4. Refined STRICT Mode

**Previous:** Failed on ANY default input (too aggressive for CI)
```typescript
// ❌ OLD: Fail on any default
if (STRICT_MODE && layerA.inputFallbacks) {
  const fallbacks = Object.keys(layerA.inputFallbacks);
  if (fallbacks.length > 0) {
    status = "fail";
    warnings.push(`⚠️ STRICT MODE: Used default inputs: ${fallbacks.join(", ")}`);
  }
}
```

**Now:** Only fail on pricing-critical defaults when Layer B is invoked
```typescript
// ✅ NEW: Fail only on pricing-critical defaults
if (STRICT_MODE && layerA.inputFallbacks) {
  const fallbacks = Object.keys(layerA.inputFallbacks);
  const pricingCritical = fallbacks.filter(f =>
    f === "electricityRate" || f === "demandCharge" || f === "location"
  );
  
  if (pricingCritical.length > 0) {
    status = "fail";
    warnings.push(
      `⚠️ STRICT MODE: Pricing-critical defaults used: ${pricingCritical.join(", ")}`
    );
  }
  
  // Log non-critical defaults as info (don't fail)
  const nonCritical = fallbacks.filter(f => !pricingCritical.includes(f));
  if (nonCritical.length > 0) {
    warnings.push(
      `ℹ️ Non-critical defaults: ${nonCritical.join(", ")}`
    );
  }
}
```

**Pricing-critical defaults:**
- `electricityRate` - Affects all financial calculations
- `demandCharge` - Affects demand charge savings
- `location` - Affects regional pricing multipliers

**Non-critical defaults:**
- Template-specific fields (operatingHours, etc.)
- Input-optional fields (solarMW, windMW, etc.)

**Benefits:**
- CI doesn't fail on legitimate template defaults
- Still enforces quality for pricing accuracy
- Clear distinction: Layer A physics vs Layer B pricing

---

### 5. Mix Scoreboard Column

**Added compact contributor mix column for instant PR reviews:**
```
mix=proc92 hvac2 light4 ctrl2
```

**Format specification:**
- Short keys: `proc`, `hvac`, `light`, `ctrl`, `it`, `cool`, `chrg`, `othr`
- Percentages: Rounded to nearest integer
- Only show non-zero contributors
- Space-separated for readability

**Implementation:**
```typescript
// Format contributor mix (compact PR-friendly format)
const contrib = layerA?.computed?.kWContributors || {};
const mixParts: string[] = [];
const keys: Array<[string, string]> = [
  ["process", "proc"],
  ["hvac", "hvac"],
  ["lighting", "light"],
  ["controls", "ctrl"],
  ["itLoad", "it"],
  ["cooling", "cool"],
  ["charging", "chrg"],
  ["other", "othr"],
];

if (peak > 0) {
  for (const [fullKey, shortKey] of keys) {
    const kw = contrib[fullKey] || 0;
    const pct = Math.round((kw / peak) * 100);
    if (pct > 0) {
      mixParts.push(`${shortKey}${pct}`);
    }
  }
}
const mixStr = mixParts.length > 0 ? `mix=${mixParts.join(" ")}` : "mix=none";
```

**Benefits:**
- Instant visual snapshot of load profile
- Catches weird shifts even before invariants trip
- PR reviews become instant: "Car wash should be proc90-ish"
- No need to drill into JSON reports for basic sanity

---

## 📊 Validation Results

### Dev Mode (Default Inputs OK)

```
[TrueQuote] Scoreboard:

car_wash        PASS    peak=240kW    capex=$145k    roi=6.6y  mix=proc92 hvac2 light4 ctrl2  defaults=2  warnings=2
hotel           FAIL    peak=450kW                              mix=none                       defaults=2  warnings=0
ev_charging     SKIP    missing template (expected)
data_center     FAIL    peak=2.0MW                              mix=none                       defaults=2  warnings=0

[TrueQuote] Results: PASS=1 FAIL=2 SKIP=1

[TrueQuote] Failed industries:
  ❌ hotel:
     ⚠️ Contributors sum 0.0kW vs peak 450.0kW (100.0% error > 15% tolerance)
     ⚠️ Layer A hard fail - skipping pricing
  ❌ data_center:
     ⚠️ Contributors sum 0.0kW vs peak 2000.0kW (100.0% error > 15% tolerance)
     ⚠️ Layer A hard fail - skipping pricing
```

**Analysis:**
- ✅ Car wash PASSES with perfect mix: `proc92 hvac2 light4 ctrl2`
- ⚠️ Hotel/data_center FAIL because they don't have validation envelopes yet
- ✅ Sum consistency check caught the missing contributors (100% error)
- ✅ Mix column shows `none` for industries without contributors

### Car Wash Validation Envelope

```json
{
  "industry": "car_wash",
  "version": "v1",
  "contributors": {
    "process": 219.84,
    "hvac": 5.04,
    "lighting": 10.08,
    "controls": 5.04,
    "itLoad": 0,
    "cooling": 0,
    "charging": 0,
    "other": 0
  },
  "details": {
    "car_wash": {
      "dryers": 150.0,
      "pumps": 49.92,
      "vacuums": 19.92
    }
  }
}
```

**Math Validation:**
- **Canonical keys:** All 8 keys present (even zeros)
- **Process breakdown:** dryers (150) + pumps (49.92) + vacuums (19.92) = 219.84 kW ✅
- **Sum check:** 219.84 + 5.04 + 10.08 + 5.04 = 240 kW ✅ (matches peak exactly)
- **Mix accuracy:** proc=92%, hvac=2%, light=4%, ctrl=2% ✅

---

## 🎓 Next Industry Expansions

### Hotel (Fastest Value)

**Canonical mapping:**
- `process` → rooms + kitchen + laundry + pool
- `hvac` → Climate control (40-50% of peak)
- `lighting` → Facility lighting (10-15%)
- `controls` → BMS/controls (1-2%)
- `other` → Miscellaneous

**Forensic details:**
```typescript
details: {
  hotel: {
    rooms: guestRoomLoadKW,      // TVs, appliances, plugs
    kitchen: kitchenLoadKW,      // Cooking, refrigeration
    laundry: laundryLoadKW,      // Washers, dryers
    pool: poolLoadKW,            // Pumps, heating
  },
}
```

**Invariants:**
1. HVAC scales with rooms (0.5-3 kW per room)
2. Process share 30-50% (guest comfort + services)
3. HVAC share 40-50% (climate dominates hotels)

**Expected mix:**
```
mix=hvac45 proc35 light10 ctrl2 othr8
```

---

### Data Center (PUE Tie-In)

**Canonical mapping:**
- `itLoad` → IT equipment (40-60% of peak)
- `cooling` → Dedicated cooling (25-40%)
- `hvac` → HVAC (if separate from cooling)
- `lighting` → Facility lighting (1-2%)
- `controls` → BMS/monitoring (1-2%)
- `other` → UPS losses, PDU losses, etc.

**Forensic details:**
```typescript
details: {
  data_center: {
    upsLosses: upsLossKW,        // 5-10% of IT load
    pdus: pduLossKW,             // 2-4% of IT load
    fans: fanLoadKW,             // CRAC/CRAH fans
  },
}
```

**Invariants:**
1. PUE consistency: `observedPUE = peak / itLoad ≈ inputPUE ±10%`
2. IT load share 40-60% (typical data center)
3. Cooling share 25-40% (PUE-dependent)

**Expected mix:**
```
mix=it50 cool35 light2 ctrl2 othr11
```

---

### EV Charging (Charging Dominates)

**Canonical mapping:**
- `charging` → EV chargers (80-90% of peak)
- `lighting` → Facility lighting (5-10%)
- `controls` → Payment/network/BMS (5-10%)
- `other` → Miscellaneous (site auxiliary)

**Forensic details:**
```typescript
details: {
  ev_charging: {
    chargers: chargerLoadKW,     // All charger types
    siteAux: auxLoadKW,          // Security, canopy, etc.
  },
}
```

**Invariants:**
1. Charging share 80-90% (chargers dominate)
2. Ancillary loads < 20% (lighting + controls + other)

**Expected mix:**
```
mix=chrg85 light8 ctrl5 othr2
```

---

## 📝 Default Tolerance Recommendations

Based on car wash validation success, suggested tolerances for next industries:

### Universal (All Industries)

| Check | Tolerance | Threshold |
|-------|-----------|-----------|
| Sum consistency | 15% | Soft warning |
| Sum consistency | 25% | Hard fail (catastrophic) |

### Hotel

| Contributor | Band | Rationale |
|-------------|------|-----------|
| hvac | 35-55% | Climate control dominates |
| process | 25-45% | Guest rooms + services |
| lighting | 8-15% | Large facility footprint |
| controls | 1-3% | BMS + elevators |
| other | 5-15% | Miscellaneous |

### Data Center

| Contributor | Band | Rationale |
|-------------|------|-----------|
| itLoad | 35-65% | Varies by PUE |
| cooling | 20-45% | Varies by PUE |
| lighting | 0.5-2% | Minimal (no windows) |
| controls | 0.5-2% | Minimal |
| other | 5-20% | UPS/PDU losses |

**PUE-specific bands:**
- PUE 1.2-1.3: itLoad 65-75%, cooling 20-30%
- PUE 1.4-1.6: itLoad 50-60%, cooling 30-40%
- PUE 1.7-2.0: itLoad 40-50%, cooling 40-50%

### EV Charging

| Contributor | Band | Rationale |
|-------------|------|-----------|
| charging | 75-95% | Chargers dominate |
| lighting | 3-12% | Depends on canopy size |
| controls | 2-8% | Payment/network |
| other | 0-10% | Miscellaneous |

---

## 🔗 Files Modified

1. **contract.ts** (+40 lines)
   - Added `version: "v1"` field
   - Added `details` envelope for forensic sub-breakdowns
   - Made `kWContributors` use `Record<ContributorKeys, number>` (all 8 keys)

2. **registry.ts** (car wash calculator, ~50 lines changed)
   - Emits all 8 canonical keys (even zeros)
   - Rolls up dryers+pumps+vacuums → `process`
   - Adds forensic `details.car_wash` with sub-breakdown
   - Sets `version: "v1"`

3. **runContractQuoteCore.ts** (+10 lines)
   - Extracts `version` and `details` from validation envelope
   - Returns in `computed` for harness consumption

4. **validate-truequote.ts** (~60 lines changed)
   - Added version check (hard fail on mismatch)
   - Added universal sum consistency check (15% tolerance, 25% hard fail)
   - Added mix column formatter (`formatMix()`)
   - Refined STRICT mode to pricing-critical defaults only
   - Scoreboard line now includes mix column

---

## ✅ Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Contract versioning | ❌ None | ✅ v1 with drift detection |
| Canonical keys | ⚠️ Industry-specific | ✅ 8 stable keys across all |
| Forensic details | ❌ Lost | ✅ Preserved in details envelope |
| Sum consistency | ❌ Not checked | ✅ Universal 15% tolerance |
| STRICT mode | ⚠️ Fails on all defaults | ✅ Pricing-critical only |
| Mix column | ❌ None | ✅ `mix=proc92 hvac2 light4 ctrl2` |
| PR visibility | ⚠️ Drill into JSON | ✅ Instant scoreboard review |

---

## 🎯 Immediate Next Steps

1. [ ] **Extend to hotel calculator**
   - Canonical keys: process (rooms+kitchen+laundry+pool), hvac, lighting, controls, other
   - Forensic details: rooms, kitchen, laundry, pool
   - Invariants: HVAC scales with rooms (0.5-3 kW/room)
   - Expected mix: `hvac45 proc35 light10 ctrl2 othr8`

2. [ ] **Extend to data_center calculator**
   - Canonical keys: itLoad, cooling, lighting, controls, other
   - Forensic details: upsLosses, pdus, fans
   - Invariants: PUE consistency (peak ≈ itLoad * PUE ±10%)
   - Expected mix: `it50 cool35 light2 ctrl2 othr11`

3. [ ] **Implement ev_charging template + validation**
   - Canonical keys: charging, lighting, controls, other
   - Forensic details: chargers, siteAux
   - Invariants: Charging share 80-90%
   - Expected mix: `chrg85 light8 ctrl5 othr2`
   - Remove from `EXPECTED_MISSING_TEMPLATES`

4. [ ] **CI/CD integration**
   - Add to `.github/workflows/test.yml`
   - Block merge on hard invariant failures or version mismatches
   - Allow pricing-critical defaults in dev (fail in production)

---

## 🎉 Conclusion

All 5 "lock it in" improvements are complete and production-ready:

1. ✅ **Versioned contract:** `validation.version: "v1"` with drift detection
2. ✅ **Canonical + forensic:** 8 stable keys + industry sub-breakdowns in `details`
3. ✅ **Two-layer invariants:** Universal sum check (15%) + industry band checks
4. ✅ **Refined STRICT:** Only pricing-critical defaults fail (rate/demand/location)
5. ✅ **Mix column:** `mix=proc92 hvac2 light4 ctrl2` for instant PR reviews

**Car wash validation proves the system works end-to-end:**
- Version: `v1` ✅
- Canonical keys: All 8 present (even zeros) ✅
- Forensic details: dryers (150) + pumps (49.92) + vacuums (19.92) ✅
- Sum consistency: 240 kW (0% error) ✅
- Mix accuracy: proc92 hvac2 light4 ctrl2 ✅

**Hotel and data_center correctly fail until extended:**
- Sum consistency check caught missing contributors (100% error)
- Clear signal: "Extend validation envelope to this industry"

**TrueQuote™ is locked in and ready to scale.**
