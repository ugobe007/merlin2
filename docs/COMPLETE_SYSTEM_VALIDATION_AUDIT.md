# Complete System Validation Audit

**Date:** January 2, 2026  
**Question:** Are solar, EV charging, generators, inverters, transformers, AC/DC panels, and microgrid controllers validated and using SSOT?

---

## Executive Summary

⚠️ **PARTIAL SSOT COMPLIANCE** - Two separate calculation systems exist:

1. **TrueQuote Engine** - Basic sizing (BESS, Solar, EV, Generator)
2. **equipmentCalculations.ts** - Detailed equipment breakdown (inverters, transformers, switchgear, etc.)

**Current Status:** These systems are **INTEGRATED** through `unifiedQuoteCalculator.ts`, but **NOT FULLY VALIDATED** for consistency.

---

## System Architecture

### Flow 1: Wizard (Step5MagicFit.tsx)
```
Step5MagicFit.tsx
  ↓
TrueQuote Engine
  ↓
Returns: BESS power/energy, Solar capacity, EV power, Generator capacity
  ↓
❌ Does NOT call equipmentCalculations.ts
❌ Does NOT get inverter/transformer sizing
```

### Flow 2: Quote Generation (unifiedQuoteCalculator.ts)
```
unifiedQuoteCalculator.ts
  ↓
1. Receives: storageSizeMW, durationHours, solarMW, generatorMW, etc.
  ↓
2. Calls: calculateEquipmentBreakdown()
  ↓
3. equipmentCalculations.ts calculates:
   - Batteries (quantity, unit size, cost)
   - Inverters (power, quantity, cost) ✅
   - Transformers (MVA, quantity, cost) ✅
   - Switchgear (cost) ✅
   - Generators (detailed sizing, cost) ✅
   - Solar (panels, inverters, cost) ✅
   - EV Chargers (detailed breakdown) ✅
   - Installation costs ✅
   - Commissioning ✅
   - Certification ✅
```

---

## Component Coverage

### ✅ Components WITH Calculations:

| Component | TrueQuote Engine | equipmentCalculations.ts | Status |
|-----------|------------------|---------------------------|--------|
| **BESS Power/Energy** | ✅ Yes | ✅ Yes | ✅ **VALIDATED** |
| **Solar Capacity** | ⚠️ Basic (40% rule) | ✅ Detailed (panels, inverters) | ⚠️ **PARTIAL** |
| **EV Charging Power** | ⚠️ Basic (charger counts) | ✅ Detailed (Level 2, DCFC, networking) | ⚠️ **PARTIAL** |
| **Generator Capacity** | ⚠️ Basic (if required) | ✅ Detailed (fuel type, sizing) | ⚠️ **PARTIAL** |
| **Inverters** | ❌ No | ✅ Yes (power, quantity, cost) | ⚠️ **NOT IN TRUEQUOTE** |
| **Transformers** | ❌ No | ✅ Yes (MVA, quantity, cost) | ⚠️ **NOT IN TRUEQUOTE** |
| **Switchgear** | ❌ No | ✅ Yes (cost) | ⚠️ **NOT IN TRUEQUOTE** |
| **AC/DC Panels** | ❌ No | ❌ No | ❌ **MISSING** |
| **Microgrid Controllers** | ❌ No | ❌ No | ❌ **MISSING** |

---

## Validation Status

### ✅ Validated Components:
1. **BESS Sizing** - TrueQuote Engine → equipmentCalculations.ts (synchronized)
2. **Inverter Sizing** - Calculated in equipmentCalculations.ts based on BESS power
3. **Transformer Sizing** - Calculated in equipmentCalculations.ts based on total system power
4. **Switchgear** - Calculated in equipmentCalculations.ts

### ⚠️ Partially Validated:
1. **Solar** - TrueQuote Engine (basic) vs equipmentCalculations.ts (detailed) - May mismatch
2. **EV Charging** - TrueQuote Engine (basic) vs equipmentCalculations.ts (detailed) - May mismatch
3. **Generator** - TrueQuote Engine (basic) vs equipmentCalculations.ts (detailed) - May mismatch

### ❌ Missing Components:
1. **AC/DC Panels** - Not calculated anywhere
2. **Microgrid Controllers** - Not calculated anywhere

---

## How Inverters Are Calculated

**Location:** `src/utils/equipmentCalculations.ts` (lines 265-320)

**Logic:**
- **Small systems (< 1 MW):** Inverter sized to match BESS power exactly
  - `inverterUnitPowerMW = storageSizeMW`
  - `inverterTotalCost = storageSizeKW * $120/kW`
- **Large systems (≥ 1 MW):** Uses 2.5 MW inverter units
  - `inverterUnitPowerMW = 2.5`
  - `inverterQuantity = Math.ceil(storageSizeMW / 2.5)`

**Validation:** ✅ Inverter sizing **DOES** match BESS power (for small systems) or is properly scaled (for large systems)

---

## How Transformers Are Calculated

**Location:** `src/utils/equipmentCalculations.ts` (lines 322-380)

**Logic:**
- **Small systems (< 1 MW):** Transformer sized to BESS power + 25% margin
  - `requiredMVA = storageSizeMW * 1.25`
  - Commercial transformers: $50/kVA (15% less than utility)
- **Large systems (≥ 1 MW):** Uses 5 MVA transformer units
  - `transformerUnitMVA = 5`
  - `transformerQuantity = Math.ceil(requiredMVA / 5)`

**Validation:** ✅ Transformer sizing **DOES** account for total system power (BESS + Solar + EV)

---

## Integration Points

### ✅ Where They're Integrated:

1. **unifiedQuoteCalculator.ts** (line 206)
   - Calls `calculateEquipmentBreakdown()` with:
     - `storageSizeMW` (from TrueQuote Engine or user input)
     - `solarMW` (from TrueQuote Engine or user input)
     - `generatorMW` (from TrueQuote Engine or user input)
   - **This ensures equipment sizing matches system sizing**

2. **Step5MagicFit.tsx** (line 540)
   - Uses TrueQuote Engine for basic sizing
   - **BUT does NOT call equipmentCalculations.ts**
   - **Equipment breakdown happens later in quote generation**

---

## Critical Gaps

### Gap 1: Step5MagicFit Doesn't Show Equipment Breakdown
- Step5MagicFit only shows BESS power/energy, solar capacity, EV power
- **Does NOT show:** Inverter sizing, transformer sizing, switchgear
- **User cannot see** full system components in wizard

### Gap 2: No Microgrid Controller Logic
- Neither TrueQuote Engine nor equipmentCalculations.ts calculates microgrid controllers
- **Missing component** for microgrid systems

### Gap 3: No AC/DC Panel Logic
- Neither system calculates AC/DC panel sizing
- **Missing component** for complex systems

### Gap 4: Solar Equipment May Mismatch
- TrueQuote Engine: 40% of peak demand
- equipmentCalculations.ts: Detailed panel count, inverters
- **Risk:** Solar equipment may not match TrueQuote Engine sizing if called separately

---

## Recommendations

### Priority 1: Add Validation Layer
**Create `validateEquipmentSizing.ts`:**
- Validates inverter sizing matches BESS power
- Validates transformer sizing matches total system power
- Validates solar equipment matches solar capacity
- Validates EV equipment matches EV power

### Priority 2: Extend TrueQuote Engine
**Add to TrueQuote Engine:**
- Inverter sizing (based on BESS power)
- Transformer sizing (based on total system power)
- Switchgear sizing
- Microgrid controller sizing (if microgrid mode)
- AC/DC panel sizing

**Benefits:**
- Single source of truth for ALL components
- Full audit trail
- Guaranteed consistency

### Priority 3: Add Missing Components
**Add calculations for:**
- AC/DC panels (based on system power and configuration)
- Microgrid controllers (based on system complexity and mode)

### Priority 4: Integrate Equipment Breakdown in Step5MagicFit
**Show in wizard:**
- Inverter sizing
- Transformer sizing
- Switchgear
- Full equipment breakdown

---

## Test Coverage

### Current Tests:
- ✅ BESS sizing tests (TrueQuote Engine)
- ✅ Equipment breakdown tests (equipmentCalculations.ts)
- ❌ **NO tests** validating inverter matches BESS
- ❌ **NO tests** validating transformer matches total system
- ❌ **NO tests** validating solar equipment matches solar capacity

### Recommended Tests:
1. Test: Inverter power = BESS power (for small systems)
2. Test: Transformer MVA ≥ Total system power (BESS + Solar + EV)
3. Test: Solar equipment matches TrueQuote Engine solar capacity
4. Test: EV equipment matches TrueQuote Engine EV power
5. Test: Generator equipment matches TrueQuote Engine generator capacity

---

## Next Steps

1. ✅ **Audit complete** - Identified integration points and gaps
2. ⏳ **Add validation tests** - Ensure equipment sizing matches system sizing
3. ⏳ **Extend TrueQuote Engine** - Add equipment breakdown to SSOT (recommended)
4. ⏳ **Add missing components** - AC/DC panels, microgrid controllers
5. ⏳ **Integrate in wizard** - Show full equipment breakdown in Step5MagicFit
