# Complete System Components Audit

**Date:** January 2, 2026  
**Question:** Are solar, EV charging, generators, inverters, transformers, AC/DC panels, and microgrid controllers validated and using SSOT?

---

## Executive Summary

⚠️ **PARTIAL SSOT COMPLIANCE** - There are **TWO SEPARATE SYSTEMS** that need integration:

1. **TrueQuote Engine** - Handles basic sizing (BESS, Solar, EV, Generator)
2. **equipmentCalculations.ts** - Handles detailed equipment breakdown (inverters, transformers, switchgear, etc.)

**Current Status:** These systems are **NOT FULLY INTEGRATED** and may have inconsistencies.

---

## Current Architecture

### System 1: TrueQuote Engine (`src/services/TrueQuoteEngine.ts`)

**What It Calculates:**
- ✅ BESS Power (kW) and Energy (kWh) - **FULLY INTEGRATED**
- ⚠️ Solar Capacity (kWp) - **BASIC ONLY** (40% of peak demand)
- ⚠️ EV Charging Power (kW) - **BASIC ONLY** (charger counts × power)
- ⚠️ Generator Capacity (kW) - **BASIC ONLY** (if required)

**What It Does NOT Calculate:**
- ❌ Inverter sizing and quantity
- ❌ Transformer sizing and quantity
- ❌ Switchgear sizing
- ❌ AC/DC panel sizing
- ❌ Microgrid controller sizing
- ❌ Detailed solar equipment (panels, inverters, charge controllers)
- ❌ Detailed EV equipment (networking, OCPP compliance)
- ❌ Installation costs breakdown
- ❌ Commissioning costs
- ❌ Certification costs

---

### System 2: Equipment Calculations (`src/utils/equipmentCalculations.ts`)

**What It Calculates:**
- ✅ Batteries (detailed unit sizing, quantity, cost)
- ✅ Inverters (power rating, quantity, cost, manufacturer, model)
- ✅ Transformers (MVA rating, quantity, cost, voltage)
- ✅ Switchgear (cost)
- ✅ Generators (detailed sizing, fuel type, cost)
- ✅ Fuel Cells
- ✅ Solar (detailed panel count, inverters, cost)
- ✅ Wind
- ✅ EV Chargers (Level 2, DCFC, networking, OCPP)
- ✅ Installation costs (logistics, EPC, contingency)
- ✅ Commissioning costs
- ✅ Certification costs

**Status:** ⚠️ **SEPARATE FROM TRUEQUOTE ENGINE**

---

## Integration Flow

### Current Flow in Step5MagicFit.tsx:

```
Step5MagicFit.tsx
  ↓
calculateSystemAsync()
  ↓
1. TrueQuote Engine (BESS sizing)
   - Returns: peakDemandKW, bess.powerKW, bess.energyKWh
   - Returns: solar.capacityKWp (if enabled)
   - Returns: evCharging.totalPowerKW (if enabled)
   - Returns: generator.capacityKW (if enabled)
  ↓
2. unifiedPricingService (pricing)
   - Gets battery pricing
   - Gets solar pricing
   - Gets generator pricing
  ↓
3. ❓ equipmentCalculations.ts (NOT CALLED IN STEP5)
   - This is called separately in other parts of the app
   - May not be synchronized with TrueQuote Engine results
```

---

## Critical Issues

### Issue 1: Inverter Sizing Mismatch Risk
- **TrueQuote Engine** calculates BESS power (e.g., 1,000 kW)
- **equipmentCalculations.ts** calculates inverter sizing separately
- **Risk:** Inverter may not match BESS power requirements

### Issue 2: Transformer Sizing Mismatch Risk
- **TrueQuote Engine** calculates total system power (BESS + Solar + EV)
- **equipmentCalculations.ts** calculates transformer sizing separately
- **Risk:** Transformer may not handle total system load

### Issue 3: Solar Equipment Mismatch Risk
- **TrueQuote Engine** calculates solar capacity (e.g., 400 kWp)
- **equipmentCalculations.ts** calculates solar panels/inverters separately
- **Risk:** Solar equipment may not match TrueQuote Engine sizing

### Issue 4: EV Equipment Mismatch Risk
- **TrueQuote Engine** calculates EV charging power (e.g., 500 kW)
- **equipmentCalculations.ts** calculates EV chargers separately
- **Risk:** EV equipment may not match TrueQuote Engine sizing

### Issue 5: No Microgrid Controller Logic
- **TrueQuote Engine** does not calculate microgrid controllers
- **equipmentCalculations.ts** does not calculate microgrid controllers
- **Risk:** Missing critical component for microgrid systems

---

## Where Equipment Calculations Are Called

### ✅ Called From:
1. `unifiedQuoteCalculator.ts` - Main quote generation
2. `AdvancedQuoteBuilder.tsx` - Advanced quote builder UI
3. `QuoteEngine.ts` - Core quote engine

### ❌ NOT Called From:
1. `Step5MagicFit.tsx` - Only uses TrueQuote Engine (basic sizing)
2. TrueQuote Engine itself - Does not call equipmentCalculations

---

## Recommendations

### Option 1: Extend TrueQuote Engine (Recommended)
**Add to TrueQuote Engine:**
- Inverter sizing (based on BESS power)
- Transformer sizing (based on total system power)
- Switchgear sizing
- AC/DC panel sizing
- Microgrid controller sizing (if microgrid mode)
- Detailed solar equipment breakdown
- Detailed EV equipment breakdown

**Benefits:**
- Single source of truth for ALL calculations
- Guaranteed consistency
- Full audit trail
- TrueQuote compliance for all components

### Option 2: Create Integration Layer
**Create `TrueQuoteEquipmentIntegration.ts`:**
- Takes TrueQuote Engine results
- Calls equipmentCalculations.ts with validated inputs
- Ensures inverter matches BESS power
- Ensures transformer matches total system
- Validates all equipment sizing

**Benefits:**
- Keeps existing systems
- Adds validation layer
- Ensures consistency

### Option 3: Audit Current Integration
**Immediate Actions:**
1. Check if `unifiedQuoteCalculator.ts` properly integrates both systems
2. Add validation tests to ensure inverter sizing matches BESS
3. Add validation tests to ensure transformer sizing matches total system
4. Document any inconsistencies found

---

## Next Steps

1. ✅ **Audit complete** - Identified two separate systems
2. ⏳ **Check unifiedQuoteCalculator** - See how it integrates both systems
3. ⏳ **Add validation tests** - Ensure equipment sizing matches TrueQuote Engine
4. ⏳ **Extend TrueQuote Engine** - Add equipment breakdown to SSOT (recommended)

---

## Files to Review

1. `src/services/unifiedQuoteCalculator.ts` - How it integrates TrueQuote Engine + equipmentCalculations
2. `src/utils/equipmentCalculations.ts` - Detailed equipment breakdown
3. `src/services/TrueQuoteEngine.ts` - Basic sizing only
4. `src/components/wizard/v6/steps/Step5MagicFit.tsx` - Only uses TrueQuote Engine
