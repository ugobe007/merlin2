# TRUEQUOTE™ FIELD COVERAGE AUDIT - REMEDIATION PLAN

## Generated: January 2026

## Executive Summary

**Current State:** 46% average field coverage across 23 industries

- ✅ 90%+: 1 industry (restaurant)
- ⚠️ 70-89%: 0 industries
- ❌ Below 70%: 22 industries (CRITICAL)

## Categories of Missing Fields

### 1. DIRECT POWER INPUTS (HIGHEST PRIORITY)

These fields are ALREADY in the database but WizardV6 doesn't read them!

| Field                 | Description            | Impact                                       |
| --------------------- | ---------------------- | -------------------------------------------- |
| `peakDemand`          | User-provided peak kW  | **DIRECT** - User knows their actual demand! |
| `gridCapacity`        | Max grid connection kW | **CEILING** - Can't exceed this              |
| `monthlyElectricBill` | Monthly $ amount       | Can estimate kWh → peak kW                   |
| `hvacType`            | HVAC system type       | 0.9x-1.3x multiplier                         |
| `equipmentTier`       | Equipment efficiency   | 0.85x-1.2x multiplier                        |
| `operatingHours`      | Hours/day              | 0.7x-1.2x multiplier                         |

### 2. INDUSTRY-SPECIFIC ENERGY FIELDS

Fields that affect power but vary by industry:

| Industry          | Missing Power-Relevant Fields                                             |
| ----------------- | ------------------------------------------------------------------------- |
| **microgrid**     | `sitePeakLoad`, `criticalLoads`, `connectedBuildings`, `existingCapacity` |
| **data-center**   | `workloadTypes`, `generatorCapacity`, `upsConfig`, `powerInfrastructure`  |
| **hospital**      | `generatorCapacity`, `upsCoverage`, `centralPlant`                        |
| **cold-storage**  | `tempZones`, `blastFreezing`, `compressorConfig`, `storageCapacity`       |
| **manufacturing** | `compressedAir`, `demandChargePercent`, `powerQualitySensitivity`         |
| **indoor-farm**   | `photoperiod`, `climateControl`, `waterSystem`                            |
| **agricultural**  | `irrigatedAcres`, `farmBuildings`, `seasonalPattern`                      |

### 3. METADATA FIELDS (Lower Priority)

These don't affect power but are useful for context:

- `solarInterest`, `sustainabilityGoals`, `availableSpace`
- `existingInfrastructure`, `primaryBESSApplication`
- `monthlyEnergyCost`, `demandChargeImpact`

---

## PHASE 1: UNIVERSAL FIXES (All Industries)

### 1.1 Add Universal Field Reading

Add these to the TOP of `estimatedPowerMetrics` useMemo, BEFORE industry-specific logic:

```typescript
// UNIVERSAL: Check if user provided direct peak demand
if (inputs.peakDemand && Number(inputs.peakDemand) > 0) {
  const userPeakKW = Number(inputs.peakDemand);
  // User knows their demand - use it directly (with sanity check)
  if (userPeakKW > 10 && userPeakKW < 100000) {
    return {
      peakDemandKW: userPeakKW,
      bessKW: userPeakKW * 0.4,
      source: "user-input" as const,
    };
  }
}

// UNIVERSAL: Estimate from monthly bill if no other data
if (inputs.monthlyElectricBill && Number(inputs.monthlyElectricBill) > 0) {
  const monthlyBill = Number(inputs.monthlyElectricBill);
  // Rough estimate: $0.12/kWh average, 730 hrs/month, 40% load factor
  const estimatedMonthlyKWh = monthlyBill / 0.12;
  const avgKW = estimatedMonthlyKWh / 730;
  const peakKW = avgKW / 0.4; // Load factor
  // Use as fallback multiplier if industry calculation is way off
}
```

### 1.2 Add Grid Capacity Ceiling

Add at the END of every industry handler, before returning:

```typescript
// Apply grid capacity ceiling (user can't draw more than their connection allows)
const gridCapacity = Number(inputs.gridCapacity || inputs.gridCapacityKW || 0);
if (gridCapacity > 0 && estimatedPeakKW > gridCapacity) {
  console.warn(`[PowerGauge] ${industry}: Capped at grid capacity ${gridCapacity} kW`);
  estimatedPeakKW = gridCapacity;
}
```

---

## PHASE 2: INDUSTRY-SPECIFIC FIXES

### 2.1 MICROGRID (28% → Target 80%)

Currently missing critical fields:

```typescript
else if (industry.includes('microgrid')) {
  // READ THESE:
  const sitePeakLoad = Number(inputs.sitePeakLoad || 0);
  const connectedBuildings = Number(inputs.connectedBuildings || 1);
  const criticalLoadPercent = Number(inputs.criticalLoadPercent || 50);
  const microgridScale = String(inputs.microgridScale || 'campus').toLowerCase();
  const islandDuration = Number(inputs.islandDuration || 4); // hours
  const existingCapacity = Number(inputs.existingCapacity || 0);
  const existingStorage = Number(inputs.existingStorage || 0);
  const plannedSolar = Number(inputs.plannedSolar || 0);

  // If user provides peak load directly, trust it
  if (sitePeakLoad > 0) {
    estimatedPeakKW = sitePeakLoad;
  } else {
    // Estimate from scale
    const scaleDefaults = { community: 500, campus: 2000, facility: 1000, utility: 10000 };
    estimatedPeakKW = scaleDefaults[microgridScale] || 1000;
  }

  // Apply multipliers for connected buildings
  estimatedPeakKW *= (1 + (connectedBuildings - 1) * 0.1);

  // Critical load sizing
  const criticalKW = estimatedPeakKW * (criticalLoadPercent / 100);

  // NO diversity factor - microgrids must handle full critical load
  estimatedPeakKW = criticalKW;
}
```

### 2.2 RESIDENTIAL (29% → Target 75%)

Missing fields + wrong field names:

```typescript
else if (industry.includes('apartment') || industry.includes('residential')) {
  // ALSO READ:
  const squareFeet = Number(inputs.squareFeet || inputs.homeSqFt || 0);
  const gridCapacityKW = Number(inputs.gridCapacityKW || inputs.gridCapacity || 0);
  const hasEVCharging = Boolean(inputs.hasEVCharging);
  const gridReliabilityIssues = Boolean(inputs.gridReliabilityIssues);
  const annualOutageHours = Number(inputs.annualOutageHours || 0);

  // Single-family vs multi-unit
  if (squareFeet > 0 && (!inputs.totalUnits || inputs.totalUnits <= 1)) {
    // Single family home
    let basePeakKW = squareFeet * 0.01; // 10 W/sqft
    if (hasEVCharging) basePeakKW += 7.2; // Level 2 charger
    estimatedPeakKW = basePeakKW * 0.6;
  }
  // ... rest unchanged
}
```

### 2.3 DATA-CENTER (31% → Target 85%)

Missing critical data center fields:

```typescript
// ADD TO DATA-CENTER HANDLER:
const workloadTypes = inputs.workloadTypes as string[] | string | undefined;
const generatorCapacity = Number(inputs.generatorCapacity || 0);
const whitespaceSquareFeet = Number(inputs.whitespaceSquareFeet || 0);
const hvacType = inputs.hvacType as string | undefined;
const equipmentTier = inputs.equipmentTier as string | undefined;
const needsBackupPower = Boolean(inputs.needsBackupPower);
const operatingHours = inputs.operatingHours || 24;

// Workload type affects power density
const workloadArray = Array.isArray(workloadTypes)
  ? workloadTypes
  : typeof workloadTypes === "string"
    ? workloadTypes.split(",")
    : [];
let densityMultiplier = 1.0;
if (workloadArray.some((w) => w.toLowerCase().includes("ai") || w.toLowerCase().includes("gpu"))) {
  densityMultiplier = 1.5; // AI/ML = higher power density
}
if (
  workloadArray.some((w) => w.toLowerCase().includes("hpc") || w.toLowerCase().includes("compute"))
) {
  densityMultiplier = Math.max(densityMultiplier, 1.3);
}

basePeakKW *= densityMultiplier;

// Apply standard multipliers
basePeakKW *= getHvacMultiplier(hvacType);
basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
```

---

## PHASE 3: ADD MISSING DB FIELDS TO CODE EXPECTATIONS

Some industries have code expecting fields that don't exist in DB. These need EITHER:

1. Add the field to DB custom_questions, OR
2. Remove expectation from code

### Fields Code Expects But NOT in DB:

| Industry              | Missing Field                        | Action       |
| --------------------- | ------------------------------------ | ------------ |
| residential           | `totalUnits`, `avgUnitSize`, etc.    | Add to DB    |
| shopping-center       | `retailType`, `specialEquipment`     | Add to DB    |
| ev-charging           | `gridCapacityKW`                     | Add to DB ✅ |
| heavy_duty_truck_stop | `hasExistingSolar`, etc.             | Add to DB    |
| restaurant            | `hasWalkInCooler`, `existingSolarKW` | Add to DB    |
| retail                | `mallSqFt`, `glaSqFt`                | Add to DB    |
| apartment             | `homeSqFt`                           | Add to DB    |

---

## Implementation Order

### Week 1: Universal Fixes

1. Add `peakDemand` direct input check at top of useMemo
2. Add `gridCapacity` ceiling at end of each handler
3. Add `monthlyElectricBill` → peak estimation fallback

### Week 2: Critical Industries

1. Fix microgrid (reads almost nothing currently)
2. Fix residential (wrong field names)
3. Fix data-center (missing critical fields)

### Week 3: High-Volume Industries

1. Hotel (41% → 80%)
2. Car-wash (47% → 80%)
3. EV-charging (44% → 85%)

### Week 4: Remaining Industries

1. All others to at least 70% coverage
2. Add missing DB fields for code expectations
3. Final audit to verify 70%+ across all

---

## Verification

After fixes, re-run audit script:

```bash
node scripts/comprehensive-field-audit.mjs
```

Target: ALL industries at 70%+ coverage, with critical power fields at 90%+.
