# Equipment Calculations Audit

**Date:** January 2, 2026  
**Question:** Are solar, EV charging, generators, inverters, transformers, AC/DC panels, and microgrid controllers also validated and using SSOT?

---

## Current State Analysis

### ✅ TrueQuote Engine Coverage:

**What TrueQuote Engine Currently Handles:**
1. ✅ **BESS Sizing** - Power (kW) and Energy (kWh) - FULLY INTEGRATED
2. ⚠️ **Solar Sizing** - Basic (40% of peak demand) - PARTIAL
3. ⚠️ **EV Charging** - Basic (charger counts) - PARTIAL
4. ⚠️ **Generator** - Basic (if required) - PARTIAL

**What TrueQuote Engine Does NOT Handle:**
- ❌ **Inverters** - Not in TrueQuote Engine
- ❌ **Transformers** - Not in TrueQuote Engine
- ❌ **AC/DC Panels** - Not in TrueQuote Engine
- ❌ **Microgrid Controllers** - Not in TrueQuote Engine
- ❌ **Switchgear** - Not in TrueQuote Engine
- ❌ **Detailed Solar Equipment** - Not in TrueQuote Engine
- ❌ **Detailed EV Charging Equipment** - Not in TrueQuote Engine

---

## Separate Calculation Systems:

### 1. **`equipmentCalculations.ts`** (Separate System)
**Location:** `src/utils/equipmentCalculations.ts`  
**Purpose:** Detailed equipment breakdown and costing

**Handles:**
- ✅ Batteries (detailed unit sizing)
- ✅ Inverters (power rating, quantity, cost)
- ✅ Transformers (sizing, cost)
- ✅ Switchgear (cost)
- ✅ Generators (detailed sizing, fuel type)
- ✅ Fuel Cells
- ✅ Solar (detailed panel count, inverters)
- ✅ Wind
- ✅ EV Chargers (detailed Level 2, DCFC)
- ✅ Installation costs
- ✅ Commissioning
- ✅ Certification

**Status:** ⚠️ **NOT INTEGRATED WITH TRUEQUOTE ENGINE**

### 2. **`solarSizingService.ts`** (Separate System)
**Location:** `src/services/solarSizingService.ts`  
**Purpose:** Detailed solar + BESS system calculations

**Handles:**
- Solar panel sizing
- Charge controllers (MPPT/PWM)
- Inverter sizing
- Battery capacity
- Temperature derating
- Peak sun hours

**Status:** ⚠️ **NOT INTEGRATED WITH TRUEQUOTE ENGINE**

### 3. **`evChargingCalculations.ts`** (Separate System)
**Location:** `src/services/evChargingCalculations.ts`  
**Purpose:** Detailed EV charging calculations

**Handles:**
- Charger type selection
- Power requirements
- BESS sizing for EV
- Grid services
- Solar canopy sizing

**Status:** ⚠️ **NOT INTEGRATED WITH TRUEQUOTE ENGINE**

---

## Integration Status:

### Current Flow:
```
Step5MagicFit.tsx
  ↓
TrueQuote Engine (BESS sizing only)
  ↓
calculateEquipmentBreakdown() (separate call)
  ↓
Equipment breakdown (inverters, transformers, etc.)
```

**Problem:** These are **TWO SEPARATE SYSTEMS** that may not be fully synchronized!

---

## Issues Identified:

1. **TrueQuote Engine** calculates basic BESS sizing
2. **equipmentCalculations.ts** calculates detailed equipment breakdown
3. **No guarantee** that inverter sizing matches BESS sizing
4. **No guarantee** that transformer sizing matches total system
5. **No guarantee** that solar equipment matches solar sizing
6. **No guarantee** that EV equipment matches EV sizing

---

## Recommendations:

### Option 1: Extend TrueQuote Engine (Recommended)
- Add inverter sizing to TrueQuote Engine
- Add transformer sizing to TrueQuote Engine
- Add switchgear to TrueQuote Engine
- Add microgrid controller logic
- Make `equipmentCalculations.ts` a wrapper around TrueQuote Engine

### Option 2: Create Integration Layer
- Create a service that ensures TrueQuote Engine and equipmentCalculations are synchronized
- Validate that inverter sizing matches BESS power
- Validate that transformer sizing matches total system power

### Option 3: Audit Current Integration
- Check if Step5MagicFit properly calls both systems
- Verify that values are consistent
- Add validation tests

---

## Next Steps:

1. ✅ **Audit current integration** - Check how Step5MagicFit uses both systems
2. ⏳ **Add validation** - Ensure inverter/transformer sizing matches BESS sizing
3. ⏳ **Extend TrueQuote Engine** - Add equipment breakdown to SSOT
4. ⏳ **Add tests** - Test that all equipment calculations are consistent
