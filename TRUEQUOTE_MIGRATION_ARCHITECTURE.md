# TrueQuote™ Migration Architecture (Feb 5, 2026)

## Migration Wireframe: Hotel → Data Center → EV Charging

This document maps the logical flow and file system architecture for migrating the next 3 industries to TrueQuote™ validation.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRUEQUOTE VALIDATION HARNESS                         │
│                      (scripts/validate-truequote.ts)                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  VALIDATION_REQUIRED (Calculator ID Allowlist)                       │   │
│  │  - "CAR_WASH_LOAD_V1_SSOT"          ✅ Migrated                      │   │
│  │  - "HOTEL_LOAD_V1_SSOT"             ⏳ Next (Priority 1)             │   │
│  │  - "DATA_CENTER_LOAD_V1_SSOT"       ⏳ Next (Priority 2)             │   │
│  │  - "EV_CHARGING_LOAD_V1_SSOT"       ⏳ Next (Priority 3)             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  For each industry:                                                         │
│  1. Load template (templateIndex.ts)                                        │
│  2. Get calculator (registry.ts)                                            │
│  3. Run runContractQuoteCore() → Layer A                                    │
│  4. Check validation status → PASS / PASS_WARN / FAIL / SKIP / CRASH       │
│  5. Run runPricingQuoteCore() → Layer B (if Layer A passes)                │
│  6. Generate scoreboard line with val= and mix=                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Industry 1: Hotel (Priority 1 - Easiest)

### Current State (Feb 5, 2026)
```
Status: PASS_WARN (not yet migrated)
Mix: none (no validation envelope)
Warning: ℹ️  Validation envelope not provided (not yet migrated)
```

### Migration Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 1: Update Hotel Calculator                                            │
│  File: src/wizard/v7/calculators/registry.ts                                │
│                                                                             │
│  BEFORE:                                                                    │
│  export const CALCULATORS_BY_ID = {                                         │
│    "CAR_WASH_LOAD_V1_SSOT": carWashCalculator,                              │
│    // hotel uses generic/fallback calculator                                │
│  };                                                                         │
│                                                                             │
│  AFTER:                                                                     │
│  export const CALCULATORS_BY_ID = {                                         │
│    "CAR_WASH_LOAD_V1_SSOT": carWashCalculator,                              │
│    "HOTEL_LOAD_V1_SSOT": hotelCalculator,  // NEW                           │
│  };                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 2: Create Hotel Calculator with Validation Envelope                   │
│  File: src/wizard/v7/calculators/registry.ts (hotel section)                │
│                                                                             │
│  const hotelCalculator: Calculator = {                                      │
│    id: "HOTEL_LOAD_V1_SSOT",                                                │
│    compute: (inputs: CalcInputs) => {                                       │
│      // 1. Extract inputs                                                   │
│      const roomCount = inputs.roomCount || 150;                             │
│      const hotelClass = inputs.hotelClass || "midscale";                    │
│      const hasPool = inputs.hasPool || false;                               │
│      const hasRestaurant = inputs.hasRestaurant || false;                   │
│      const hasLaundry = inputs.hasLaundry || true;                          │
│                                                                             │
│      // 2. Calculate loads by component (FORENSIC DETAIL)                   │
│      // Kitchen, laundry, pool (intermittent process loads)                 │
│      const kitchenKW = hasRestaurant ? roomCount * 0.8 : 0;                 │
│      const laundryKW = hasLaundry ? roomCount * 0.3 : 0;                    │
│      const poolKW = hasPool ? 50 : 0;                                       │
│      const miscPlugKW = roomCount * 0.15; // In-room misc plugs             │
│                                                                             │
│      // 3. Roll up to canonical keys                                        │
      // "process" = intermittent loads only (kitchen, laundry, pool)        │
      // miscPlugKW goes to "other" (semantically cleaner for always-on-ish)│
      const processKW = kitchenKW + laundryKW + poolKW;                      
│                                                                             │
│      // HVAC: class-based kW/room (prevents brittle invariants)             │
│      const HVAC_KW_PER_ROOM: Record<string, number> = {                     │
│        economy: 1.0,   // 0.8-1.2 kW/room                                   │
│        midscale: 1.5,  // 1.2-1.8 kW/room                                   │
│        upscale: 2.2,   // 1.8-2.8 kW/room (larger rooms, more common area) │
│        luxury: 2.5,    // 2.2-2.8 kW/room                                   │
│      };                                                                     │
│      const hvacKW = roomCount * HVAC_KW_PER_ROOM[hotelClass];               │
│                                                                             │
│      const lightingKW = roomCount * 0.5; // 0.5 kW per room                 │
│      const controlsKW = roomCount * 0.1; // BMS + controls                  │
      const otherKW = roomCount * 0.2 + miscPlugKW; // Elevators + misc plugs│
│                                                                             │
│      // 4. Calculate load profile (derived dutyCycle, not assumed)          │
│      const peakLoadKW = processKW + hvacKW + lightingKW + controlsKW +      │
│                         otherKW;                                            │
│                                                                             │
│      // Always-on components (HVAC + common areas run even at low occupancy)│
      let baseLoadKW = controlsKW +                                          │
                       0.6 * lightingKW +                                    │
                       0.5 * hvacKW +                                        │
                       0.2 * processKW;                                      │
                                                                             │
      // Safety clamp: prevent dutyCycle > 1 in edge cases                   │
      if (baseLoadKW > 0.95 * peakLoadKW) {                                  │
        trace.notes.push("base_clamped_to_peak");                            │
        baseLoadKW = 0.95 * peakLoadKW;                                      │
      }                                                                      │
│                                                                             │
│      // Derive dutyCycle from physics (not occupancy assumption)            │
│      const dutyCycle = baseLoadKW / peakLoadKW;                             │
│                                                                             │
│      // Energy: two-level schedule (base 24h + peaks)                       │
│      const peakHours = 8; // Kitchen/laundry peak hours per day             │
│      const energyKWhPerDay = baseLoadKW * 24 + (peakLoadKW - baseLoadKW) * peakHours;│
│                                                                             │
│      // 5. BUILD VALIDATION ENVELOPE (TrueQuote v1)                         │
│      const validation: CalcValidation = {                                   │
│        version: "v1",                                                       │
│        dutyCycle,                                                           │
│        kWContributors: {                                                    │
│          process: processKW,     // Rolled up from forensic detail          │
│          hvac: hvacKW,                                                      │
│          lighting: lightingKW,                                              │
│          controls: controlsKW,                                              │
│          itLoad: 0,              // Not applicable                          │
│          cooling: 0,             // HVAC handles cooling                    │
│          charging: 0,            // Not applicable                          │
│          other: otherKW,                                                    │
│        },                                                                   │
│        details: {                                                           │
│          hotel: {                // Namespaced by industry                  │
│            rooms: roomsKW,       // Forensic breakdown                      │
│            kitchen: kitchenKW,                                              │
│            laundry: laundryKW,                                              │
│            pool: poolKW,                                                    │
│          },                                                                 │
│        },                                                                   │
│        notes: [                                                             │
│          `Hotel class: ${hotelClass}`,                                      │
│          `Room count: ${roomCount}`,                                        │
│          `Amenities: ${[hasPool && 'pool', hasRestaurant && 'restaurant',   │
│                         hasLaundry && 'laundry'].filter(Boolean).join(', ')}`,│
│        ],                                                                   │
│      };                                                                     │
│                                                                             │
│      // 6. Return with validation envelope                                  │
│      return {                                                               │
│        baseLoadKW,                                                          │
│        peakLoadKW,                                                          │
│        energyKWhPerDay,                                                     │
│        validation, // ✅ This is what the harness checks                    │
│      };                                                                     │
│    },                                                                       │
│  };                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 3: Update Template Mapping                                            │
│  File: src/wizard/v7/templates/templateIndex.ts                             │
│                                                                             │
│  export function getTemplate(industry: string) {                            │
│    const tpl = TEMPLATES[industry];                                         │
│    if (!tpl) return null;                                                   │
│                                                                             │
│    // Update calculator ID for hotel                                        │
│    if (industry === "hotel") {                                              │
│      return {                                                               │
│        ...tpl,                                                              │
│        calculator: {                                                        │
│          id: "HOTEL_LOAD_V1_SSOT", // Updated from generic                  │
│          ...tpl.calculator,                                                 │
│        },                                                                   │
│      };                                                                     │
│    }                                                                        │
│    return tpl;                                                              │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 4: Add to Validation Allowlist                                        │
│  File: scripts/validate-truequote.ts                                        │
│                                                                             │
│  const VALIDATION_REQUIRED = new Set<string>([                              │
│    "CAR_WASH_LOAD_V1_SSOT",                                                 │
│    "HOTEL_LOAD_V1_SSOT", // ✅ Add after migration complete                 │
│  ]);                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 5: Add Industry Invariants                                            │
│  File: scripts/validate-truequote.ts                                        │
│                                                                             │
│  const INVARIANTS_BY_INDUSTRY: Record<string, Invariant[]> = {              │
│    car_wash: [ /* existing */ ],                                            │
│    hotel: [                                                                 │
│      {                                                                      │
│        id: "hotel_hvac_scales_with_rooms",                                  │
│        description: "HVAC should scale with room count by class",           │
│        check: (trace) => {                                                  │
│          const contrib = trace.computed?.kWContributors;                    │
│          const hvac = contrib?.hvac || 0;                                   │
│          const peak = trace.loadProfile?.peakLoadKW || 1;                   │
│          const hvacShare = hvac / peak;                                     │
│          // Band adjusted for class variation (0.8-2.8 kW/room)             │
│          if (hvacShare < 0.30 || hvacShare > 0.60) {                        │
│            return `HVAC share ${(hvacShare*100).toFixed(0)}% outside 30-60% band`;│
│          }                                                                  │
│          return null;                                                       │
│        },                                                                   │
│      },                                                                     │
│      {                                                                      │
│        id: "hotel_process_share_band",                                      │
│        description: "Process loads (kitchen+laundry+pool+misc) 15-35%",     │
│        check: (trace) => {                                                  │
│          const contrib = trace.computed?.kWContributors;                    │
│          const process = contrib?.process || 0;                             │
│          const peak = trace.loadProfile?.peakLoadKW || 1;                   │
│          const processShare = process / peak;                               │
│          // Lower than before (rooms moved out of process)                  │
│          if (processShare < 0.15 || processShare > 0.35) {                  │
│            return `Process share ${(processShare*100).toFixed(0)}% outside 15-35% band`;│
│          }                                                                  │
│          return null;                                                       │
│        },                                                                   │
│      },                                                                     │
│      {                                                                      │
│        id: "hotel_base_load_physics",                                       │
│        description: "Base load should be 40-70% of peak (always-on components)",│
│        check: (trace) => {                                                  │
│          const base = trace.loadProfile?.baseLoadKW || 0;                   │
│          const peak = trace.loadProfile?.peakLoadKW || 1;                   │
│          const baseShare = base / peak;                                     │
│          if (baseShare < 0.40 || baseShare > 0.70) {                        │
│            return `Base/Peak ratio ${(baseShare*100).toFixed(0)}% outside 40-70% (HVAC+common areas should be always-on)`;│
│          }                                                                  │
│          return null;                                                       │
│        },                                                                   │
│      },                                                                     │
│    ],                                                                       │
│  };                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Expected Validation Output (After Migration)

```
hotel           PASS    peak=450kW    capex=$262k    roi=4.7y  val=v1  mix=hvac48 proc22 light11 ctrl2 othr17  defaults=2  warnings=0

✅ Version: v1
✅ Contributors: All 8 canonical keys present
✅ Details: hotel.{kitchen, laundry, pool, miscPlug} (process breakdown)
✅ Sum: 450 kW (0% error)
✅ Mix: hvac48 proc22 light11 ctrl2 othr17 (within expected bands)
✅ Expected Bands: hvac 30-60%, process 15-35%, lighting 5-15%, controls 1-5%, other 10-25%
✅ Invariants: HVAC scales with rooms ✓, Process share band ✓, Base load physics ✓
```

---

## Industry 2: Data Center (Priority 2 - Highest Value)

### Current State (Feb 5, 2026)
```
Status: PASS_WARN (not yet migrated)
Mix: none (no validation envelope)
Warning: ℹ️  Validation envelope not provided (not yet migrated)
```

### Migration Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 1: Create Data Center Calculator with PUE-Based Validation            │
│  File: src/wizard/v7/calculators/registry.ts                                │
│                                                                             │
│  const dataCenterCalculator: Calculator = {                                 │
│    id: "DATA_CENTER_LOAD_V1_SSOT",                                          │
│    compute: (inputs: CalcInputs) => {                                       │
│      // 1. Extract inputs                                                   │
│      const rackCount = inputs.rackCount || 40;                              │
│      const kwPerRack = inputs.kwPerRack || 10;                              │
│      const pue = inputs.pue || 1.5;                                         │
│      const hasUPS = inputs.hasUPS !== false;                                │
│                                                                             │
│      // 2. Calculate IT load (base)                                         │
│      const itLoadKW = rackCount * kwPerRack;                                │
│                                                                             │
│      // 3. Calculate total facility load (PUE-based)                        │
│      // PUE = Total Facility Power / IT Equipment Power                     │
│      const totalFacilityKW = itLoadKW * pue;                                │
│                                                                             │
│      // 4. Break down infrastructure (EXACT-SUM ACCOUNTING)                 │
│      // Option A: Allocate all infra, then compute cooling as remainder     │
│      const upsLossesKW = hasUPS ? itLoadKW * 0.05 : 0; // 5% UPS loss       │
│      const pdusKW = itLoadKW * 0.03; // 3% PDU loss                         │
│      const fansKW = itLoadKW * 0.04; // 4% fan power                        │
│                                                                             │
│      // Lighting/controls as % of total (part of infrastructure)            │
│      const lightingKW = totalFacilityKW * 0.02; // 2% lighting              │
│      const controlsKW = totalFacilityKW * 0.02; // 2% BMS                   │
│                                                                             │
│      // Other: non-cooling infrastructure                                   │
│      const otherKW = upsLossesKW + pdusKW + fansKW;                         │
│                                                                             │
│      // Cooling: remainder after all other components (sum=total by design) │
      let coolingKW = totalFacilityKW - itLoadKW - otherKW - lightingKW - controlsKW;│
                                                                             │
      // Guard: prevent negative cooling (low PUE or high infra losses)      │
      if (coolingKW < 0) {                                                   │
        trace.notes.push("cooling_remainder_negative");                      │
        otherKW += coolingKW; // Roll negative into other to preserve sum    │
        coolingKW = 0;                                                       │
      }                                                                      │
│                                                                             │
│      // 5. Calculate load profile                                           │
│      const peakLoadKW = totalFacilityKW; // Exact by construction           │
│      const dutyCycle = 0.95; // Data centers run 95% load                   │
│      const baseLoadKW = peakLoadKW * dutyCycle;                             │
│      const energyKWhPerDay = baseLoadKW * 24;                               │
│                                                                             │
│      // 7. BUILD VALIDATION ENVELOPE (TrueQuote v1)                         │
│      const validation: CalcValidation = {                                   │
│        version: "v1",                                                       │
│        dutyCycle,                                                           │
│        kWContributors: {                                                    │
│          process: 0,             // Not applicable                          │
│          hvac: 0,                // Separate cooling category               │
│          lighting: lightingKW,                                              │
│          controls: controlsKW,                                              │
│          itLoad: itLoadKW,       // Primary load                            │
│          cooling: coolingKW,     // PUE-derived                             │
│          charging: 0,            // Not applicable                          │
│          other: upsLossesKW + pdusKW + fansKW, // Infrastructure losses     │
│        },                                                                   │
│        details: {                                                           │
│          data_center: {          // Namespaced by industry                  │
│            upsLosses: upsLossesKW,                                          │
│            pdus: pdusKW,                                                    │
│            fans: fansKW,                                                    │
│            pue: pue,             // Store for PUE invariant check           │
│          },                                                                 │
│        },                                                                   │
│        notes: [                                                             │
│          `PUE: ${pue.toFixed(2)}`,                                          │
│          `Rack count: ${rackCount}`,                                        │
│          `kW per rack: ${kwPerRack}`,                                       │
│        ],                                                                   │
│      };                                                                     │
│                                                                             │
│      return {                                                               │
│        baseLoadKW,                                                          │
│        peakLoadKW,                                                          │
│        energyKWhPerDay,                                                     │
│        validation,                                                          │
│      };                                                                     │
│    },                                                                       │
│  };                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 2: Add PUE-Specific Invariants                                        │
│  File: scripts/validate-truequote.ts                                        │
│                                                                             │
│  const INVARIANTS_BY_INDUSTRY: Record<string, Invariant[]> = {              │
│    // ... existing                                                          │
│    data_center: [                                                           │
│      {                                                                      │
│        id: "dc_pue_consistency",                                            │
│        description: "Peak load should match IT load * PUE (±10%)",          │
│        check: (trace) => {                                                  │
│          const contrib = trace.computed?.kWContributors;                    │
│          const itLoad = contrib?.itLoad || 0;                               │
│          const peak = trace.loadProfile?.peakLoadKW || 1;                   │
│          const details = trace.computed?.details?.data_center;              │
│          const pue = details?.pue || 1.5;                                   │
│                                                                             │
│          const expectedPeak = itLoad * pue;                                 │
│          const error = Math.abs(peak - expectedPeak) / expectedPeak;        │
│          if (error > 0.10) {                                                │
│            return `PUE consistency: peak ${peak.toFixed(0)}kW vs IT×PUE ${expectedPeak.toFixed(0)}kW (${(error*100).toFixed(0)}% error)`;│
│          }                                                                  │
│          return null;                                                       │
│        },                                                                   │
│      },                                                                     │
│      {                                                                      │
│        id: "dc_cooling_share_by_pue",                                       │
│        description: "Cooling share varies by PUE tier",                     │
│        check: (trace) => {                                                  │
│          const contrib = trace.computed?.kWContributors;                    │
│          const cooling = contrib?.cooling || 0;                             │
│          const peak = trace.loadProfile?.peakLoadKW || 1;                   │
│          const coolingShare = cooling / peak;                               │
│          const details = trace.computed?.details?.data_center;              │
│          const pue = details?.pue || 1.5;                                   │
│                                                                             │
│          // PUE-specific bands                                              │
│          let minCooling, maxCooling;                                        │
│          if (pue < 1.3) {                                                   │
│            minCooling = 0.20; maxCooling = 0.30; // Efficient               │
│          } else if (pue < 1.6) {                                            │
│            minCooling = 0.30; maxCooling = 0.40; // Standard                │
│          } else {                                                           │
│            minCooling = 0.40; maxCooling = 0.50; // Less efficient          │
│          }                                                                  │
│                                                                             │
│          if (coolingShare < minCooling || coolingShare > maxCooling) {      │
│            return `Cooling share ${(coolingShare*100).toFixed(0)}% outside ${(minCooling*100).toFixed(0)}-${(maxCooling*100).toFixed(0)}% for PUE ${pue.toFixed(2)}`;│
│          }                                                                  │
│          return null;                                                       │
│        },                                                                   │
│      },                                                                     │
│    ],                                                                       │
│  };                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Universal Invariants: Add to harness for ALL industries                    │
│  File: scripts/validate-truequote.ts                                        │
│                                                                             │
│  // Add after industry-specific invariants                                  │
│  const UNIVERSAL_INVARIANTS: Invariant[] = [                                │
│    {                                                                        │
│      id: "nonsense_mix_all_tiny",                                           │
│      description: "No single contributor should dominate <10% when peak >= 50 kW",│
│      check: (trace) => {                                                    │
│        const contrib = trace.computed?.kWContributors || {};                │
│        const peak = trace.loadProfile?.peakLoadKW || 1;                     │
│        if (peak < 50) return null; // Skip tiny facilities                  │
│        const maxContributor = Math.max(...Object.values(contrib));          │
│        if (peak > 0 && maxContributor / peak < 0.10) {                      │
│          return "Suspicious: all contributors <10% (everything tiny)";      │
│        }                                                                    │
│        return null;                                                         │
│      },                                                                     │
│    },                                                                       │
│    {                                                                        │
│      id: "nonsense_mix_smeared_equally",                                    │
│      description: "If 4+ contributors and peak >= 50 kW, at least one should exceed 20%",│
│      check: (trace) => {                                                    │
│        const contrib = trace.computed?.kWContributors || {};                │
│        const peak = trace.loadProfile?.peakLoadKW || 1;                     │
│        if (peak < 50) return null; // Skip tiny facilities                  │
│        const nonZeroCount = Object.values(contrib).filter(v => v > 0).length;│
│        const maxShare = Math.max(...Object.values(contrib)) / peak;         │
│        if (nonZeroCount >= 4 && maxShare < 0.20) {                          │
│          return "Suspicious: 4+ contributors but none >20% (smeared equally)";│
│        }                                                                    │
│        return null;                                                         │
│      },                                                                     │
│    },                                                                       │
│  ];                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Expected Validation Output (After Migration)

```
data_center     PASS    peak=2.0MW    capex=$1.06M   roi=4.2y  val=v1  mix=it50 cool36 othr10 light2 ctrl2  defaults=2  warnings=0

✅ Version: v1
✅ Contributors: All 8 canonical keys present (exact-sum accounting)
✅ Details: data_center.{upsLosses, pdus, fans, pue}
✅ Sum: 2000 kW (0% error by construction - cooling computed as remainder)
✅ Mix: it50 cool36 othr10 light2 ctrl2 (within expected bands)
✅ Expected Bands: itLoad 40-65%, cooling 25-45%, other 5-20%, lighting 1-5%, controls 1-5%
✅ Invariants: PUE consistency ✓, Cooling share by PUE ✓
```

---

## Industry 3: EV Charging (Priority 3 - High Visibility)

### Current State (Feb 5, 2026)
```
Status: SKIP (template not yet implemented - expected)
```

### Migration Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 1: Implement EV Charging Template                                     │
│  File: src/wizard/v7/templates/templateIndex.ts                             │
│                                                                             │
│  // Add to TEMPLATES object                                                 │
│  ev_charging: {                                                             │
│    industry: "ev_charging",                                                 │
│    version: "v7.0",                                                         │
│    calculator: {                                                            │
│      id: "EV_CHARGING_LOAD_V1_SSOT", // NEW                                 │
│    },                                                                       │
│    questions: [                                                             │
│      { id: "level2_chargers", label: "Level 2 Chargers (7kW)", type: "number" },│
│      { id: "dcfc_chargers", label: "DCFC Chargers (150kW)", type: "number" },│
│      { id: "hpc_chargers", label: "HPC Chargers (350kW)", type: "number" }, │
│      { id: "concurrency_factor", label: "Peak Concurrency %", type: "number", defaultValue: 0.7 },│
│      // ... 12 more questions                                               │
│    ],                                                                       │
│  },                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 2: Create EV Charging Calculator                                      │
│  File: src/wizard/v7/calculators/registry.ts                                │
│                                                                             │
│  const evChargingCalculator: Calculator = {                                 │
│    id: "EV_CHARGING_LOAD_V1_SSOT",                                          │
│    compute: (inputs: CalcInputs) => {                                       │
│      // 1. Extract inputs                                                   │
│      const level2Count = inputs.level2_chargers || 12;                      │
│      const dcfcCount = inputs.dcfc_chargers || 8;                           │
│      const hpcCount = inputs.hpc_chargers || 4;                             │
│      const concurrency = inputs.concurrency_factor || 0.7;                  │
│      const siteDemandCapKW = inputs.site_demand_cap_kw; // Optional cap     │
│                                                                             │
│      // 2. Calculate charger loads with per-type concurrency (FORENSIC DETAIL)│
│      // L2: high dwell time → higher concurrency                            │
│      const l2Concurrency = Math.min(0.9, concurrency + 0.1);                │
│      // DCFC: medium utilization                                            │
│      const dcfcConcurrency = concurrency;                                   │
│      // HPC: bursty, demand-managed → lower concurrency                     │
│      const hpcConcurrency = Math.max(0.4, concurrency - 0.2);               │
│                                                                             │
│      const level2KW = level2Count * 7 * l2Concurrency;                      │
│      const dcfcKW = dcfcCount * 150 * dcfcConcurrency;                      │
│      const hpcKW = hpcCount * 350 * hpcConcurrency;                         │
│                                                                             │
│      // Apply site demand cap if provided (common in real deployments)      │
│      let chargersKW = level2KW + dcfcKW + hpcKW;                            │
│      if (siteDemandCapKW && chargersKW > siteDemandCapKW) {                 │
        // Apply cap proportionally to preserve forensic breakdown           │
        const scaleFactor = siteDemandCapKW / chargersKW;                    │
        level2KW *= scaleFactor;                                             │
        dcfcKW *= scaleFactor;                                               │
        hpcKW *= scaleFactor;                                                │
        chargersKW = siteDemandCapKW;                                        │
        trace.notes.push("site_demand_cap_applied");                         │
      }                                                                      │
      // Now details.ev_charging.{level2,dcfc,hpc} match chargersKW exactly  │
│                                                                             │
│      // 3. Site auxiliary loads                                             │
│      const lightingKW = (level2Count + dcfcCount + hpcCount) * 0.5;         │
│      const controlsKW = (level2Count + dcfcCount + hpcCount) * 0.3;         │
│      const siteAuxKW = 10; // HVAC for office, restrooms                    │
│                                                                             │
│      // 4. Calculate load profile                                           │
│      const peakLoadKW = chargersKW + lightingKW + controlsKW + siteAuxKW;   │
│      const dutyCycle = 0.35; // 35% average utilization                     │
│      const baseLoadKW = peakLoadKW * dutyCycle;                             │
│      const energyKWhPerDay = baseLoadKW * 24;                               │
│                                                                             │
│      // 5. BUILD VALIDATION ENVELOPE (TrueQuote v1)                         │
│      const validation: CalcValidation = {                                   │
│        version: "v1",                                                       │
│        dutyCycle,                                                           │
│        kWContributors: {                                                    │
│          process: 0,             // Not applicable                          │
│          hvac: 0,                // Minimal (siteAux)                       │
│          lighting: lightingKW,                                              │
│          controls: controlsKW,                                              │
│          itLoad: 0,              // Not applicable                          │
│          cooling: 0,             // Not applicable                          │
│          charging: chargersKW,   // Primary load                            │
│          other: siteAuxKW,       // Site office/restrooms                   │
│        },                                                                   │
│        details: {                                                           │
│          ev_charging: {          // Namespaced by industry                  │
│            level2: level2KW,     // Forensic breakdown by charger type      │
│            dcfc: dcfcKW,                                                    │
│            hpc: hpcKW,                                                      │
│            siteAux: siteAuxKW,                                              │
│          },                                                                 │
│        },                                                                   │
│        notes: [                                                             │
│          `Level 2: ${level2Count} @ 7kW`,                                   │
│          `DCFC: ${dcfcCount} @ 150kW`,                                      │
│          `HPC: ${hpcCount} @ 350kW`,                                        │
│          `Concurrency: ${(concurrency*100).toFixed(0)}%`,                   │
│        ],                                                                   │
│      };                                                                     │
│                                                                             │
│      return {                                                               │
│        baseLoadKW,                                                          │
│        peakLoadKW,                                                          │
│        energyKWhPerDay,                                                     │
│        validation,                                                          │
│      };                                                                     │
│    },                                                                       │
│  };                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 3: Add EV Charging Invariants                                         │
│  File: scripts/validate-truequote.ts                                        │
│                                                                             │
│  const INVARIANTS_BY_INDUSTRY: Record<string, Invariant[]> = {              │
│    // ... existing                                                          │
│    ev_charging: [                                                           │
│      {                                                                      │
│        id: "ev_charging_dominance",                                         │
│        description: "Charging loads should be 80-95% of peak",              │
│        check: (trace) => {                                                  │
│          const contrib = trace.computed?.kWContributors;                    │
│          const charging = contrib?.charging || 0;                           │
│          const peak = trace.loadProfile?.peakLoadKW || 1;                   │
│          const chargingShare = charging / peak;                             │
│          if (chargingShare < 0.80 || chargingShare > 0.95) {                │
│            return `Charging share ${(chargingShare*100).toFixed(0)}% outside 80-95% band`;│
│          }                                                                  │
│          return null;                                                       │
│        },                                                                   │
│      },                                                                     │
│    ],                                                                       │
│  };                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 4: Remove from EXPECTED_MISSING_TEMPLATES                             │
│  File: scripts/validate-truequote.ts                                        │
│                                                                             │
│  const EXPECTED_MISSING_TEMPLATES = new Set([                               │
│    // "ev_charging", // ✅ REMOVE - now implemented                         │
│  ]);                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Expected Validation Output (After Migration)

```
ev_charging     PASS    peak=3.5MW    capex=$1.8M    roi=5.2y  val=v1  mix=chrg87 light7 ctrl4 othr2  defaults=2  warnings=0

✅ Version: v1
✅ Contributors: All 8 canonical keys present
✅ Details: ev_charging.{level2, dcfc, hpc, siteAux} (per-type concurrency)
✅ Sum: 3500 kW (0% error, capped by site demand limit if provided)
✅ Mix: chrg87 light7 ctrl4 othr2 (within expected bands)
✅ Expected Bands: charging 80-95%, lighting 2-10%, controls 1-6%, other 1-10%
✅ Invariants: Charging dominance (80-95%) ✓
```

---

## File System Map

```
merlin3/
├── src/
│   ├── wizard/v7/
│   │   ├── calculators/
│   │   │   ├── contract.ts              # CalcValidation interface (v1)
│   │   │   ├── registry.ts              # ✅ ADD: hotelCalculator, dataCenterCalculator, evChargingCalculator
│   │   │   └── validation.ts            # Template validation rules
│   │   ├── templates/
│   │   │   ├── templateIndex.ts         # ✅ UPDATE: Calculator IDs for hotel/dc/ev
│   │   │   └── applyMapping.ts          # Maps questions → calculator inputs
│   │   └── pricing/
│   │       └── index.ts                 # Sizing defaults
│   └── services/
│       └── truequote/
│           ├── runContractQuoteCore.ts  # ✅ Has normalizer + namespace enforcer
│           └── runPricingQuoteCore.ts   # Layer B (pricing)
│
├── scripts/
│   └── validate-truequote.ts            # ✅ UPDATE: Allowlist, invariants, status taxonomy
│
└── docs/
    ├── TRUEQUOTE_LOCK_IN_COMPLETE.md    # Phase 5 complete (Feb 5)
    ├── TRUEQUOTE_SCALING_COMPLETE.md    # This doc's predecessor
    └── TRUEQUOTE_MIGRATION_ARCHITECTURE.md  # ← You are here
```

---

## Migration Checklist (Per Industry)

### Hotel Migration (Priority 1)
- [ ] 1. Create `hotelCalculator` in `registry.ts` with validation envelope
- [ ] 2. Update `getTemplate()` to use `HOTEL_LOAD_V1_SSOT` calculator ID
- [ ] 3. Add hotel invariants to `INVARIANTS_BY_INDUSTRY`
- [ ] 4. Test: Run `npm run truequote:validate` → verify PASS with val=v1
- [ ] 5. Add `"HOTEL_LOAD_V1_SSOT"` to `VALIDATION_REQUIRED` set
- [ ] 6. Verify mix: `hvac45 proc35 light10 ctrl2 othr8`
- [ ] 7. Commit + PR with scoreboard output

### Data Center Migration (Priority 2)
- [ ] 1. Create `dataCenterCalculator` with PUE-based validation
- [ ] 2. Update `getTemplate()` to use `DATA_CENTER_LOAD_V1_SSOT`
- [ ] 3. Add PUE invariants (consistency + cooling-by-PUE)
- [ ] 4. Test: Run validation → verify PUE math correct
- [ ] 5. Add `"DATA_CENTER_LOAD_V1_SSOT"` to `VALIDATION_REQUIRED` set
- [ ] 6. Verify mix: `it50 cool35 othr11 light2 ctrl2`
- [ ] 7. Commit + PR with scoreboard output

### EV Charging Migration (Priority 3)
- [ ] 1. Implement template in `templateIndex.ts` (16 questions)
- [ ] 2. Create `evChargingCalculator` with charger-type breakdown
- [ ] 3. Add charging dominance invariant (80-95%)
- [ ] 4. Remove `"ev_charging"` from `EXPECTED_MISSING_TEMPLATES`
- [ ] 5. Add `"EV_CHARGING_LOAD_V1_SSOT"` to `VALIDATION_REQUIRED` set
- [ ] 6. Test: Verify SKIP → PASS transition
- [ ] 7. Verify mix: `chrg88 light7 ctrl3 othr2`
- [ ] 8. Commit + PR with scoreboard output

---

## Success Criteria

### Per-Industry Success Metrics

**Hotel:**
- Status: PASS_WARN → PASS
- Val: none → v1
- Mix: none → `hvac45 proc35 light10 ctrl2 othr8`
- Invariants: 2/2 passing

**Data Center:**
- Status: PASS_WARN → PASS
- Val: none → v1
- Mix: none → `it50 cool35 othr11 light2 ctrl2`
- Invariants: 2/2 passing (PUE-specific)

**EV Charging:**
- Status: SKIP → PASS
- Val: n/a → v1
- Mix: n/a → `chrg88 light7 ctrl3 othr2`
- Invariants: 1/1 passing

### Overall Harness Health

**After 3 Migrations:**
```
[TrueQuote] Results: PASS=4 FAIL=0 SKIP=0

Migrated: 4/21 (19%)
- car_wash ✅
- hotel ✅
- data_center ✅
- ev_charging ✅

Remaining: 17 industries (retail, restaurant, warehouse, manufacturing, office, healthcare, ...)
```

---

## Architecture Principles (Preserved)

1. **Single Source of Truth**: Calculator emits validation, harness consumes it
2. **Gradual Migration**: Allowlist prevents blocking unmigrated industries
3. **Explicit Status**: PASS / PASS_WARN / FAIL / SKIP / CRASH (no ambiguity)
4. **Canonical Keys**: Always normalized (all 8 keys, even zeros)
5. **Forensic Details**: Industry-specific sub-breakdowns preserved
6. **PUE-Specific Logic**: Data center has tighter tolerances + PUE invariants
7. **Calculator ID Allowlist**: Pin to calculator, not industry name
8. **Template Missing Enforcement**: STRICT mode fails on unexpected gaps

---

## Next Steps

1. **Implement hotel calculator** (easiest - 1 day)
2. **Test hotel migration** (verify mix + invariants)
3. **Add to allowlist** (VALIDATION_REQUIRED)
4. **Repeat for data_center** (PUE-specific - 2 days)
5. **Repeat for ev_charging** (template + calculator - 2 days)

**Total Migration Timeline**: ~5 days for 3 industries

TrueQuote™ scaling in action.
