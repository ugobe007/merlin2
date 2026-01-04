# Critical Missing Data Audit - URGENT

**Date:** January 2, 2026  
**Status:** 🔴 **CRITICAL - User Identified Missing Data**

---

## User Feedback

**"we are missing a lot of data. sorry for being picky but this is really important."**

This indicates we are **significantly incomplete** in our equipment breakdown and calculations.

---

## Current Equipment Breakdown Structure

**From `equipmentCalculations.ts` return type:**

```typescript
{
  batteries: {...},
  inverters: {...},
  transformers: {...},
  switchgear: {...},
  generators?: {...},
  fuelCells?: {...},
  solar?: {...},
  wind?: {...},
  evChargers?: {...},
  installation: {
    bos: number,      // Balance of System (lumped)
    epc: number,      // EPC/Integration (lumped)
    contingency: number,
    totalInstallation: number
  },
  commissioning: {
    factoryAcceptanceTest: number,
    siteAcceptanceTest: number,
    scadaIntegration: number,  // ✅ SCADA mentioned but not detailed
    functionalSafetyTest: number,
    performanceTest: number,
    totalCommissioning: number
  },
  certification: {...},
  totals: {...}
}
```

---

## What's Currently MISSING (Not in Equipment Breakdown)

### 1. ❌ **AC Distribution Panels**
- Main AC panel
- Sub-panels
- Bus bars
- **Status:** Not calculated separately (may be in installation?)

### 2. ❌ **DC Distribution Panels**
- DC combiner boxes
- DC bus bars
- DC protection
- **Status:** Not calculated separately

### 3. ❌ **Microgrid Controllers**
- Central controller hardware
- Protection relays
- Grid-forming controls
- **Status:** Not calculated

### 4. ❌ **Energy Management System (EMS) Hardware**
- SCADA hardware (separate from integration cost)
- Monitoring servers
- Control hardware
- **Status:** SCADA integration cost exists, but hardware not broken out

### 5. ❌ **Protection Equipment**
- Circuit breakers (beyond switchgear)
- Fuses
- Surge protection devices (SPD)
- Ground fault protection
- Arc fault protection
- **Status:** Not calculated separately

### 6. ❌ **Metering Equipment**
- Revenue-grade meters
- Power quality meters
- Data loggers
- **Status:** Not calculated

### 7. ❌ **Communication Systems Hardware**
- SCADA communication equipment
- Network switches/routers
- Communication modems
- **Status:** Not calculated separately

### 8. ❌ **Control Systems Hardware**
- BMS integration hardware
- Peak shaving controllers
- Grid services controllers
- **Status:** Not calculated

### 9. ❌ **Cabling/Wiring**
- DC cables (battery to inverter)
- AC cables (inverter to transformer)
- Control wiring
- Conduit/raceway
- **Status:** Not calculated separately (may be in installation?)

### 10. ❌ **Mounting/Infrastructure**
- Battery racks/enclosures
- Inverter mounting structures
- Conduit/raceway
- **Status:** Not calculated separately

### 11. ❌ **Grounding Systems**
- Grounding electrodes
- Grounding conductors
- **Status:** Not calculated

### 12. ❌ **Cooling Systems**
- HVAC for battery rooms
- Cooling for inverters
- **Status:** Not calculated

### 13. ❌ **Fire Suppression Systems**
- Fire detection systems
- Suppression systems (for battery rooms)
- **Status:** Not calculated (may be in certification?)

### 14. ❌ **Grid Interconnection Equipment**
- Interconnection switchgear (beyond main switchgear)
- Net metering equipment
- Islanding detection equipment
- **Status:** Not calculated separately

### 15. ❌ **Battery Management System (BMS)**
- BMS hardware
- Battery monitoring systems
- **Status:** Not calculated separately (may be included in battery cost?)

---

## What's Currently LUMPED (Not Detailed)

### Installation Costs (Lumped):
- Balance of System (BOS) - 8% of equipment
- EPC/Integration - 25% of equipment
- **These may include:**
  - Cabling
  - Mounting/rack systems
  - AC/DC panels
  - Protection equipment
  - Grounding
  - **But we don't know what's included!**

### Commissioning (Partially Detailed):
- ✅ SCADA integration cost exists
- ❌ But SCADA hardware is not broken out
- ❌ Communication equipment not broken out
- ❌ Metering equipment not broken out

---

## Critical Questions for User

To properly complete this audit, we need to know:

1. **What specific components are you seeing as missing?**
   - Please list the exact components you expect to see

2. **Are these components:**
   - Currently included but lumped in installation costs?
   - Not calculated at all?
   - Calculated separately elsewhere in the codebase?

3. **What level of detail is needed?**
   - Component-level breakdown with costs?
   - Just sizing/specifications?
   - Both?

4. **Where should these appear?**
   - In the equipment breakdown structure?
   - In a separate section?
   - In the quote display?

5. **Are there industry standards/references for these components?**
   - NREL/DOE guidelines?
   - Professional quotes showing these components?
   - Industry benchmarks?

---

## Immediate Next Steps

1. ⏳ **Wait for user clarification** - Need specific list of missing components
2. ⏳ **Review installation costs** - See what's actually included in BOS/EPC
3. ⏳ **Add missing components** - Once identified, add to equipment breakdown
4. ⏳ **Update calculations** - Add sizing and costing logic
5. ⏳ **Update UI** - Show new components in quote breakdown

---

## Documentation References Found

From `docs/PRICING_SYSTEM_ANALYSIS.md`:
- ✅ AC/DC Patch Panels mentioned as existing in `systemControlsPricingService.ts`
- ✅ Protection Relays mentioned ($23,500/unit)
- **But these are NOT in the main `equipmentCalculations.ts` breakdown!**

This suggests there may be **OTHER SERVICES** that calculate these components separately, and they're not being integrated into the main equipment breakdown.

---

## Recommendation

**We need to either:**
1. **Add these components to `equipmentCalculations.ts`** (preferred for SSOT)
2. **Integrate existing separate services** (if they exist)
3. **Clarify with user what's missing** (to avoid guessing)
