# Architectural Cleanup Plan - Single Source of Truth
**Date:** November 18, 2025  
**Goal:** Eliminate scattered logic, ensure ONE calculation path per use case

---

## Current State Assessment

### ✅ GOOD: Centralized Entry Point
**All calculations flow through:**
```
calculateDatabaseBaseline(template, scale, useCaseData)
  ↓
  Routing logic based on template
  ↓
  SINGLE calculation function per use case
  ↓
  Returns BaselineCalculationResult
```

### ❌ PROBLEMS FOUND:

#### 1. **Data Center Has TWO Calculation Paths**

**Path A: Direct datacenter calculation** (ACTIVE)
```typescript
// Line 103-108 in baselineService.ts
if ((templateKey === 'datacenter' || templateKey === 'data-center') && useCaseData) {
  const dcResult = calculateDatacenterBaseline(useCaseData, scale);
  return dcResult;
}
```

**Path B: Database lookup with special handling** (ALSO ACTIVE!)
```typescript
// Lines 287-292 in baselineService.ts
if (templateKey === 'datacenter' || templateKey === 'data-center') {
  basePowerMW = scale; // Use scale directly as the datacenter capacity in MW
  console.log(`🖥️ [Data Center Calculation] Direct capacity: ${scale} MW (scale = capacity)`);
}
```

**PROBLEM:** Path A returns early, so Path B is **NEVER REACHED**. This is **dead code** that confuses developers.

**Path C: Legacy function** (DEAD CODE)
```typescript
// Line 630 in baselineService.ts
export function calculateDatacenterBESS(
  capacity: number,
  uptimeRequirement: string = 'tier3',
  gridConnection: string = 'reliable'
)
```
**NEVER CALLED** - should be removed.

---

#### 2. **Hotels Have THREE Calculation Paths**

**Path A: User-specified peakLoad** (MOST COMMON - ACTIVE)
```typescript
// Lines 115-180 in baselineService.ts
if (useCaseData && typeof useCaseData.peakLoad === 'number' && useCaseData.peakLoad > 0) {
  // Returns simplified result
  return userResult;
}
```

**Path B: Database lookup** (FALLBACK - RARELY USED)
```typescript
// Lines 200+ in baselineService.ts
const useCase = await useCaseService.getUseCaseBySlug(templateKey);
// Complex logic with defaults
```

**Path C: Hotel-specific scaling** (Lines 243-254)
```typescript
if (referenceMatch && templateKey === 'hotel') {
  // Hotel-specific: Extract reference room count
  const kWPerRoom = defaultConfig.typical_load_kw / referenceRooms;
  const basePowerMW = (actualRooms * kWPerRoom) / 1000;
}
```

**PROBLEM:** Paths can overlap! If hotel provides peakLoad, it skips A and goes to B, but then C might also execute. This creates **inconsistent results**.

---

#### 3. **EV Charger Load Calculation Scattered**

**Location 1: baselineService.ts (lines 115-135)** - EV load added
```typescript
if (useCaseData.evChargingPorts && useCaseData.evChargingPorts > 0) {
  const totalEVLoadMW = (level2LoadMW + dcFastLoadMW) * 0.7;
  userPowerMW += totalEVLoadMW;
}
```

**Location 2: useCaseTemplates.ts (hotel template, line 963)** - EV as amenity
```typescript
{
  id: 'evChargingPorts',
  question: 'How many EV charging ports?',
  impactType: 'power_add',
  additionalLoadKw: 10, // 10kW per Level 2 port
}
```

**PROBLEM:** **TWO DIFFERENT CALCULATIONS!**
- baselineService: 50% Level 2 (7kW) + 50% DC Fast (50kW) × 70% = ~17 kW per port
- template: 10 kW per port

Which one is correct? **They'll give different results!**

---

#### 4. **Grid Connection Logic Duplicated**

**Location 1: calculateDatacenterBaseline()** (lines 510-598)
```typescript
if (gridConnection === 'limited' && gridCapacity > 0) {
  if (tier === 'tier4') {
    bessMultiplier = 0.8;
  } else if (tier === 'tier3') {
    bessMultiplier = 0.6;
  }
}
```

**Location 2: User-input path** (lines 130-145) - JUST ADDED
```typescript
if (gridConnection === 'limited' && gridCapacity > 0 && peakDemandMW > gridCapacity) {
  generationRequired = true;
  generationRecommendedMW = peakDemandMW - gridCapacity;
}
```

**PROBLEM:** **DUPLICATE LOGIC** - if we change grid analysis in one place, must remember to change in both. This is HOW BUGS HAPPEN!

---

## Root Causes

### 1. **Early Returns Create Unreachable Code**
```typescript
if (datacenter) {
  return calculateDatacenterBaseline(); // EARLY RETURN
}

// This code is NEVER reached for datacenters, but still exists!
if (datacenter) {
  basePowerMW = scale;
}
```

### 2. **Multiple Input Sources Without Priority**
- User provides peakLoad → uses one path
- User provides rackCount → uses different path  
- User provides facilitySize → uses third path
- Database fallback → uses fourth path

**NO CLEAR PRIORITY!** Leads to confusion about which input takes precedence.

### 3. **No Input Validation**
- What if user provides BOTH peakLoad AND rackCount?
- What if gridConnection = "limited" but gridCapacity = 0?
- What if tier = "tier_3" vs "tier3" vs "Tier 3"?

Currently: **Silent failures** or **inconsistent behavior**.

### 4. **Business Logic in Templates**
```typescript
// useCaseTemplates.ts - WRONG PLACE FOR CALCULATIONS!
{
  id: 'evChargingPorts',
  additionalLoadKw: 10, // This is a calculation!
}
```

**Templates should be DATA, not LOGIC!**

---

## Cleanup Strategy

### Phase 1: Remove Dead Code ✅
1. Delete `calculateDatacenterBESS()` - never used
2. Delete datacenter special case in lines 287-292 - never reached
3. Delete any other unreachable code paths

### Phase 2: Consolidate Calculations ✅
1. **Data centers:** ONE function `calculateDatacenterBaseline()`
   - All inputs go here
   - All grid logic here
   - Returns complete result

2. **Hotels:** ONE function `calculateHotelBaseline()` (NEW)
   - Extract from user-input path
   - Handle all hotel-specific logic
   - Returns complete result

3. **EV Chargers:** ONE calculation method
   - Remove `additionalLoadKw` from templates
   - Centralize in baselineService

### Phase 3: Establish Input Priority ✅
```
Priority 1: User-specified peakLoad (MW)
Priority 2: Calculated from units (rooms, racks, sq ft)
Priority 3: Database defaults
Priority 4: Hardcoded fallbacks
```

### Phase 4: Add Validation ✅
```typescript
function validateInputs(useCaseData) {
  // Check for conflicting inputs
  // Normalize tier naming (tier_3 → tier3)
  // Validate grid capacity if gridConnection = "limited"
  // Return validated, normalized data
}
```

### Phase 5: Extract Grid Analysis ✅
```typescript
function analyzeGridRequirements(peakDemandMW, gridConnection, gridCapacity, tier?) {
  // ALL grid logic in ONE place
  // Returns: { generationRequired, generationRecommendedMW, generationReason }
  // Used by BOTH datacenters AND hotels
}
```

---

## Target Architecture

```
┌─────────────────────────────────────────────┐
│         calculateDatabaseBaseline()         │
│         (Single Entry Point)                │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼─────────┐
│  Special Cases │   │  General Cases   │
└───────┬────────┘   └────────┬─────────┘
        │                     │
  ┌─────┴─────┐               │
  │           │               │
┌─▼──────┐  ┌─▼───────┐   ┌──▼────────┐
│  Data  │  │   EV    │   │  User     │
│ Center │  │Charging │   │  Input    │
└────┬───┘  └────┬────┘   └──┬────────┘
     │           │            │
     └───────┬───┴────────────┘
             │
    ┌────────▼─────────┐
    │ analyzeGrid      │
    │ Requirements()   │
    └────────┬─────────┘
             │
    ┌────────▼─────────┐
    │ BaselineResult   │
    │ (Complete)       │
    └──────────────────┘
```

**Key Principles:**
1. **ONE function per use case** - no alternatives
2. **Shared utilities** - grid analysis, validation
3. **No early returns** - explicit routing only
4. **Complete results** - always include grid info
5. **Dead code removed** - if it's not called, delete it

---

## Implementation Plan

### Step 1: Create Shared Utilities
```typescript
// NEW: src/services/gridAnalysisService.ts
export function analyzeGridRequirements(
  peakDemandMW: number,
  gridConnection: string,
  gridCapacity: number,
  tier?: string
): GridAnalysisResult {
  // Single source of truth for grid logic
}
```

### Step 2: Extract Hotel Logic
```typescript
// NEW: calculateHotelBaseline() in baselineService.ts
function calculateHotelBaseline(
  useCaseData: Record<string, any>,
  scale: number
): BaselineCalculationResult {
  // All hotel logic consolidated here
}
```

### Step 3: Clean Up Datacenter
```typescript
// KEEP: calculateDatacenterBaseline()
// DELETE: calculateDatacenterBESS()
// DELETE: Lines 287-292 (unreachable datacenter special case)
```

### Step 4: Remove Template Calculations
```typescript
// useCaseTemplates.ts
{
  id: 'evChargingPorts',
  // DELETE: additionalLoadKw: 10
  // DELETE: All calculation-related fields
  // KEEP ONLY: question text, options, type
}
```

### Step 5: Add Validation Layer
```typescript
function validateAndNormalizeInputs(useCaseData: Record<string, any>) {
  // Normalize tier naming
  // Validate grid capacity
  // Check for conflicting inputs
  // Return clean data
}
```

---

## Expected Outcomes

### Before Cleanup:
- ❌ Datacenter: 3 calculation paths (1 dead, 1 unreachable)
- ❌ Hotel: 3 overlapping paths
- ❌ EV chargers: 2 different calculations
- ❌ Grid logic: Duplicated in 2+ places
- ❌ Dead code: `calculateDatacenterBESS()`, unreachable blocks
- ❌ Business logic in templates

### After Cleanup:
- ✅ Datacenter: 1 function (`calculateDatacenterBaseline`)
- ✅ Hotel: 1 function (`calculateHotelBaseline`)
- ✅ EV chargers: 1 calculation (in baselineService)
- ✅ Grid logic: 1 function (`analyzeGridRequirements`)
- ✅ No dead code
- ✅ Templates are pure data
- ✅ Input validation at entry point
- ✅ Clear priority order

---

## Testing Strategy

### Test 1: Data Center Consistency
```
Input: 300 MW, Tier 3, Limited grid 50 MW
Expected: 180 MW BESS (60% multiplier)
Test via:
  - Direct wizard form
  - Advanced quote builder
  - API call
All should return IDENTICAL results
```

### Test 2: Hotel Consistency
```
Input: 500 rooms, full service, limited grid 15 MW, peak 3 MW
Expected: 3 MW BESS, no power gap
Test via:
  - Direct wizard form
  - Different room counts
  - With/without EV chargers
All should use SAME calculation
```

### Test 3: EV Charger Load
```
Input: 12 EV ports
Expected: Consistent load calculation
Verify:
  - baselineService adds correct load
  - Template doesn't override
  - Same result regardless of use case
```

---

## Success Criteria

1. ✅ **No dead code** - every function is called
2. ✅ **No unreachable code** - every line can execute
3. ✅ **No duplicate logic** - each calculation exists once
4. ✅ **Clear routing** - explicit paths, no surprises
5. ✅ **Complete results** - always include grid info
6. ✅ **Testable** - can verify each path independently

---

## Risk Mitigation

**Risk:** Breaking existing functionality  
**Mitigation:** 
- Test each change immediately
- Keep existing tests passing
- Add new tests for edge cases

**Risk:** Introducing new bugs  
**Mitigation:**
- Remove code in small chunks
- Verify nothing breaks after each removal
- Console log results during transition

**Risk:** Performance degradation  
**Mitigation:**
- Caching remains intact
- No additional database calls
- Simpler code = faster execution

---

**Next Step:** Start with Phase 1 - Remove dead code (safe, low-risk)
