# CRITICAL ARCHITECTURE AUDIT - Code Duplication & Inconsistency Issues

## 🔴 CRITICAL ISSUE: Triple Power Density Definitions

**Problem:** `getPowerDensity()` function defined in 3 DIFFERENT files with potentially different values!

### Locations:
1. `/src/components/wizard/SmartWizardV2.tsx` line 94
2. `/src/hooks/wizard/useSystemCalculations.ts` line 37
3. `/src/utils/wizardHelpers.ts` line 19

### Impact:
- Different code paths use different functions
- Changes to power density require updating 3 locations
- Inconsistent with template `multiplierValue` definitions
- Creates bugs like tribal casino (1 MW vs 4 MW)

### Resolution Required:
**DELETE** all getPowerDensity() functions and use ONLY template multiplierValue fields!

---

## 🔴 FOUND BUGS

### Bug #1: Logistics Center - Multiplier Too Low
**File:** `useCaseTemplates.ts` line 3245  
**Issue:** `multiplierValue: 0.000003` = 3 W/sq ft  
**Should Be:** `0.000006` = 6 W/sq ft (logistics with automation)  
**Status:** ✅ FIXED

### Bug #2: Tribal Casino - Multiplier Was Wrong
**File:** `useCaseTemplates.ts` line 2741  
**Issue:** `multiplierValue: 0.00003` = 30 W/sq ft (TOO HIGH!)  
**Should Be:** `0.000015` = 15 W/sq ft (industry standard for casinos)  
**Status:** ✅ FIXED

### Bug #3: Dual Calculation System
**Files:** `SmartWizardV2.tsx` + `centralizedCalculations.ts`  
**Issue:** Two competing price calculation systems  
**Status:** ✅ FIXED (removed centralizedCalculations import)

---

## ⚠️ INCOMPLETE FEATURES

### Issue #1: Backup Power Not Triggered by Duration
**File:** `baselineService.ts` lines 671-689  
**Problem:** Generators only added for off-grid/unreliable/microgrid  
**Missing:** Logic to read `backupDuration` question and add generators

**Example:**
```typescript
// Current (WRONG):
if (gridConnection === 'off_grid') {
  generationRecommendedMW = peakDemandMW * 1.2;
}

// Should Be (CORRECT):
const backupDuration = useCaseData.backupDuration || 0;
if (gridConnection === 'off_grid') {
  generationRecommendedMW = peakDemandMW * 1.2;
} else if (backupDuration > 0) {
  // User wants backup power!
  generationRecommendedMW = peakDemandMW * 0.8; // 80% for backup
  generationReason = `Backup power for ${backupDuration} hours of critical operations`;
}
```

**Affects:** Hospital, casino, datacenter, government buildings with backup requirements

---

## 🔍 ALL MULTIPLIER VALUES AUDIT

### ✅ CORRECT (Verified Math):

| Use Case | Line | Value | Calculation | W/sq ft or Per Unit |
|----------|------|-------|-------------|---------------------|
| EV Charging DC | 265 | 0.83 | 150kW ÷ 180kW | per charger |
| EV Charging L2 | 277 | 0.107 | 19.2kW ÷ 180kW | per charger |
| Hospital | 477 | 0.004 | 4kW | per bed |
| Indoor Farm | 649 | 0.040 | 40W | per sq ft ✅ |
| Hotel | 858 | 0.0068 | 440kW ÷ 150 = 2.93kW | per room ✅ |
| Airport | 1186 | 0.00000064 | 640W | per million passengers ✅ |
| University | 1392 | 0.00012 | 120W | per student ✅ |
| Dental | 1580 | 0.15 | 15% | per chair |
| Office | 1746 | 0.0012 | 1.2 W/sq ft | **⚠️ TOO LOW** |
| Datacenter | 1899 | 0.005 | 5kW | per rack ✅ |
| Cold Storage | 2078 | 0.0044 | 4.4kW | per ton/day ✅ |
| Apartments | 2253 | 0.0015 | 1.5kW | per unit ✅ |
| Convenience | 2573 | 0.05 | 50kW | per store |
| Casino | 2741 | 0.000015 | 15 W/sq ft | **✅ FIXED** |
| Warehouse | 2909 | 0.000004 | 4 W/sq ft | ✅ |
| Warehouse Fleet | 2921 | 0.008 | 8kW | per vehicle ✅ |
| Government | 3081 | 0.000008 | 8 W/sq ft | ✅ |
| Logistics | 3245 | 0.000006 | 6 W/sq ft | **✅ FIXED** |
| Logistics Fleet | 3257 | 0.004 | 4kW | per vehicle ✅ |
| Manufacturing | 3418 | 0.000025 | 25 W/sq ft | ✅ |
| Brewery | 3584 | 0.001 | 1kW | per barrel/year ✅ |
| Restaurant | 3743 | 0.000012 | 12 W/sq ft | ✅ |
| Retail | 3912 | 0.000012 | 12 W/sq ft | ✅ |

### ⚠️ POTENTIAL ISSUES:

**Office Building (line 1746): 1.2 W/sq ft**
- Industry standard: 5-7 W/sq ft
- This is **5x TOO LOW!**
- Should be: 0.000006 (6 W/sq ft)

---

## 🔧 REQUIRED FIXES

### Priority 1 - CRITICAL (Data Errors):
1. ✅ Fix casino multiplier (DONE)
2. ✅ Fix logistics multiplier (DONE)
3. ❌ Fix office building multiplier (1.2 → 6 W/sq ft)
4. ❌ Add backup power logic to baselineService
5. ❌ Remove duplicate getPowerDensity() functions

### Priority 2 - Architecture (Consolidation):
1. ❌ Delete getPowerDensity() from SmartWizardV2.tsx
2. ❌ Delete getPowerDensity() from useSystemCalculations.ts
3. ❌ Make wizardHelpers.ts extract multiplier from template
4. ❌ Update all call sites to use template data

### Priority 3 - Navigation Bug:
1. ❌ Fix Step 3 → blank page crash
2. ❌ Add error boundary around step rendering
3. ❌ Add better error logging for step transitions

---

## 📊 IMPACT ANALYSIS

### Use Cases with Incorrect BESS Sizing:
1. **Tribal Casino** - Was 70% too low (1 MW vs 4 MW) ✅ FIXED
2. **Logistics Center** - Was 50% too low (3 W vs 6 W) ✅ FIXED
3. **Office Building** - Is 80% too low (1.2 W vs 6 W) ❌ NEEDS FIX
4. **Any use case with backup duration** - Generators not added ❌ NEEDS FIX

### Code Paths with Inconsistency:
1. Manual power estimation → Uses getPowerDensity()
2. Smart Wizard → Uses template multiplierValue
3. Both paths should use SAME source!

---

## 🎯 ACTION PLAN

### Step 1: Fix Office Building Multiplier
```typescript
// Line 1746 - WRONG
multiplierValue: 0.0012, // 1.2 W/sq ft

// Should be:
multiplierValue: 0.000006, // 6 W/sq ft (industry standard for office buildings)
```

### Step 2: Add Backup Power Logic
```typescript
// baselineService.ts - Add after line 240
const backupDuration = useCaseData?.backupDuration;
if (backupDuration && typeof backupDuration === 'number' && backupDuration > 0) {
  // User wants backup power capability
  if (generationRecommendedMW === 0) {
    generationRecommendedMW = Math.round(peakDemandMW * 0.8 * 10) / 10;
    generationReason = `Backup power for ${backupDuration} hours of critical operations requires ${generationRecommendedMW} MW generation`;
  }
}
```

### Step 3: Consolidate getPowerDensity()
```typescript
// wizardHelpers.ts - NEW VERSION
export function getPowerDensity(templateSlug: string): number {
  const template = USE_CASE_TEMPLATES.find(t => t.slug === templateSlug);
  if (!template) return 6; // Default fallback
  
  // Find the square footage question with multiplierValue
  const sqFtQuestion = template.customQuestions?.find(
    q => q.unit === 'sq ft' && q.multiplierValue
  );
  
  if (sqFtQuestion?.multiplierValue) {
    // Convert MW/sq ft to W/sq ft
    return sqFtQuestion.multiplierValue * 1000000;
  }
  
  // Fallback to calculated from powerProfile
  return (template.powerProfile.typicalLoadKw * 1000) / 50000; // Assume 50K sq ft default
}
```

### Step 4: Delete Duplicate Functions
- Remove from SmartWizardV2.tsx
- Remove from useSystemCalculations.ts
- Keep only consolidated version in wizardHelpers.ts

---

## ✅ TESTING CHECKLIST

After fixes:
- [ ] Tribal casino: 30K sq ft → ~4 MW recommendation
- [ ] Office building: 50K sq ft → Proper sizing (not 60 kW!)
- [ ] Logistics: 500K sq ft → Proper sizing with 6 W/sq ft
- [ ] Any use case with backup duration → Generators recommended
- [ ] Step 3 navigation → No crashes
- [ ] All calculations consistent across manual/wizard modes
