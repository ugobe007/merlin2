# Integration Plan: System Controls & Additional Components

**Date:** January 2, 2026  
**Status:** 🟢 **IN PROGRESS**

---

## User Requirements

1. ✅ **Integrate `systemControlsPricingService.ts`** into `equipmentCalculations.ts`
2. ⏳ **User checking for other missing services**
3. ✅ **Full component breakdown** (not just costs)

---

## Components to Integrate

### From `systemControlsPricingService.ts`:

1. **Controllers**
   - Generator controllers
   - PLCs (Programmable Logic Controllers)
   - RTUs (Remote Terminal Units)
   - Protective relays
   - Energy management controllers

2. **SCADA Systems**
   - HMI (Human Machine Interface)
   - Historian servers
   - SCADA servers/workstations
   - Communication gateways

3. **Energy Management Systems (EMS)**
   - Microgrid controllers
   - Demand response systems
   - Load forecasting
   - Optimization systems
   - Analytics platforms

4. **Automation Systems**
   - Building automation
   - Industrial automation
   - Process control
   - Safety systems

### From `solarPricingService.ts` (Additional Components):

5. **DC Cabling** (for solar systems)
6. **AC Cabling** (for solar systems)
7. **Combiner Boxes** (DC combiner boxes)
8. **Disconnects** (AC/DC disconnects)
9. **Grounding** (grounding systems)
10. **Conduit** (raceway/conduit)

---

## Implementation Plan

### Step 1: Update EquipmentBreakdown Interface

Add new sections to `EquipmentBreakdown`:

```typescript
export interface EquipmentBreakdown {
  // ... existing fields ...
  
  // NEW: System Controls
  systemControls?: {
    controllers?: {
      generatorControllers?: {
        quantity: number;
        model: string;
        manufacturer: string;
        unitCost: number;
        totalCost: number;
      };
      protectiveRelays?: {
        quantity: number;
        model: string;
        manufacturer: string;
        unitCost: number;
        totalCost: number;
      };
      // ... other controller types
    };
    scada?: {
      hardware: {
        quantity: number;
        model: string;
        manufacturer: string;
        unitCost: number;
        totalCost: number;
      };
      software: {
        licenses: string[];
        cost: number;
      };
      totalCost: number;
    };
    ems?: {
      system: {
        model: string;
        manufacturer: string;
        type: string;
      };
      setupCost: number;
      implementationCost: number;
      capacityCost: number;
      totalInitialCost: number;
      monthlyOperatingCost: number;
      annualOperatingCost: number;
    };
  };
  
  // NEW: Additional Solar Components (if not already in solar section)
  solarAdditional?: {
    dcCabling: {
      length: number; // feet or meters
      unitCost: number;
      totalCost: number;
    };
    acCabling: {
      length: number;
      unitCost: number;
      totalCost: number;
    };
    combinerBoxes: {
      quantity: number;
      unitCost: number;
      totalCost: number;
    };
    disconnects: {
      quantity: number;
      unitCost: number;
      totalCost: number;
    };
    grounding: {
      cost: number;
    };
    conduit: {
      length: number;
      unitCost: number;
      totalCost: number;
    };
    totalCost: number;
  };
}
```

### Step 2: Update calculateEquipmentBreakdown Function

1. **Import systemControlsPricingService**
2. **Determine system requirements:**
   - If microgrid/off-grid: Include microgrid controller
   - If generators: Include generator controllers
   - If grid-connected: Include protection relays
   - SCADA/EMS: Always include for systems > certain size
3. **Calculate costs using service methods:**
   - `calculateControllerSystemCost()`
   - `calculateScadaSystemCost()`
   - `calculateEMSCost()`
4. **Add to equipment breakdown**
5. **Update totals**

### Step 3: Integration Logic

**For Controllers:**
- Generator controllers: If `generatorMW > 0`
- Protective relays: Always (grid protection)
- PLCs: For complex systems or automation
- RTUs: For remote monitoring

**For SCADA:**
- Always include for systems > 0.5 MW
- Scale based on system size (tags, historians, users)

**For EMS:**
- Microgrid controller: If `gridConnection === 'off-grid'` or microgrid mode
- Optimization/analytics: For systems > 1 MW
- Scale based on capacity

**For Solar Additional Components:**
- If `solarMW > 0`, calculate from `solarPricingService`
- Use existing breakdown from that service

### Step 4: Update Totals

Ensure all new components are included in:
- `equipmentCost`
- `totalProjectCost`
- Equipment breakdown totals

---

## Next Steps

1. ⏳ **Wait for user to identify other missing services**
2. ✅ **Update EquipmentBreakdown interface** (in progress)
3. ⏳ **Implement integration logic**
4. ⏳ **Add tests**
5. ⏳ **Update UI to display new components**

---

## Files to Modify

1. `src/utils/equipmentCalculations.ts`
   - Update `EquipmentBreakdown` interface
   - Update `calculateEquipmentBreakdown` function
   - Add integration logic

2. (Potentially) `src/components/shared/QuoteCalculationBreakdown.tsx`
   - Add UI for new components

3. (Potentially) `src/services/unifiedQuoteCalculator.ts`
   - Ensure new components are properly passed through
