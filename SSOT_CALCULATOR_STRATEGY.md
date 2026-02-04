# SSOT Calculator Strategy - Feb 4, 2026

## 🎯 THE PROBLEM

**Current v7 calculators violate TrueQuote™ principles:**
- ❌ Hardcoded logic in `registry.ts` (equipment power, formulas)
- ❌ Duplicate calculations - reimplementing existing SSOT
- ❌ Not database-driven - constants baked into code
- ❌ Limited to 3 industries (hotel, data-center, car-wash)

## ✅ THE SOLUTION

**Use the existing SSOT: `useCasePowerCalculations.ts`**

This file ALREADY has:
- ✅ 20+ industry calculation functions
- ✅ ASHRAE, CBECS, Energy Star standards
- ✅ Master routing function: `calculateUseCasePower(slug, useCaseData)`
- ✅ Database-driven constants
- ✅ Proven, tested calculations

## 🏗️ CORRECT ARCHITECTURE

```
User fills questionnaire → Database fields (camelCase, arrays, ranges)
    ↓
WizardV7 hook collects answers
    ↓
Calculator Registry (THIN ADAPTER)
    ├── Parses DB field format
    ├── Maps to SSOT parameter names
    └── Delegates to useCasePowerCalculations.ts
        ↓
        calculateUseCasePower(slug, useCaseData)
            ↓
            Routes to industry-specific function:
            - calculateHotelPower()
            - calculateDatacenterPower()
            - calculateCarWashPower()
            - calculateOfficePower()
            - calculateHospitalPower()
            - ... 15+ more industries
                ↓
                Returns PowerCalculationResult
                    ↓
                    Adapter normalizes to CalcRunResult
                        ↓
                        Pricing bridge uses energy loads
```

## 📝 IMPLEMENTATION PATTERN

### Current (Wrong) - Hardcoded Logic
```typescript
// ❌ BAD: Hardcoded calculation in registry
export const CAR_WASH_LOAD_V1_16Q: CalculatorContract = {
  compute: (inputs) => {
    const dryerKW = 40; // Hardcoded!
    const vacuumCount = 8; // Hardcoded!
    let peakLoadKW = 30 * bayCount; // Duplicate logic!
    // ... 100+ lines of hardcoded formulas
  }
};
```

### Correct (Right) - SSOT Delegation
```typescript
// ✅ GOOD: Thin adapter delegates to SSOT
export const CAR_WASH_LOAD_V1_SSOT: CalculatorContract = {
  compute: (inputs) => {
    // 1. Parse database field format
    const bayCount = parseBayTunnel(inputs.bayTunnelCount);
    
    // 2. Map to SSOT parameters
    const useCaseData = {
      bayCount,
      carsPerDay: inputs.averageWashesPerDay,
      operatingHours: inputs.operatingHours,
      equipment: inputs.primaryEquipment,
    };
    
    // 3. Delegate to SSOT (NO calculation logic here!)
    const result = calculateUseCasePower('car-wash', useCaseData);
    
    // 4. Normalize to contract format
    return {
      baseLoadKW: result.powerMW * 1000 * 0.4,  // Base = 40% of peak
      peakLoadKW: result.powerMW * 1000,
      energyKWhPerDay: result.powerMW * 1000 * result.durationHrs,
      assumptions: [result.description],
      warnings: [],
      raw: result,
    };
  }
};
```

## 🎯 BENEFITS OF THIS APPROACH

### 1. Single Source of Truth
- All calculations in ONE place (`useCasePowerCalculations.ts`)
- No duplicate logic across codebase
- Changes propagate everywhere

### 2. Database-Driven
- SSOT already uses database constants
- Field mappings in thin adapter layer only
- Easy to update without code changes

### 3. Industry Coverage
- SSOT supports 20+ industries already
- No need to reimplement for each
- Add new industry = add to SSOT once

### 4. TrueQuote™ Compliant
- SSOT cites ASHRAE, CBECS, Energy Star
- Calculation methods documented
- Source attribution built-in

### 5. Testability
- Test SSOT functions directly
- Adapters are simple parsing (easy to test)
- Full coverage with existing tests

## 📋 IMPLEMENTATION PLAN

### Phase 1: Create Generic SSOT Adapter
```typescript
/**
 * GENERIC SSOT ADAPTER - Works for ANY industry
 * Thin wrapper that delegates to useCasePowerCalculations.ts
 */
export const GENERIC_SSOT_ADAPTER: CalculatorContract = {
  id: "generic_ssot_v1",
  requiredInputs: [] as const, // No requirements - accepts any fields
  
  compute: (inputs: CalcInputs): CalcRunResult => {
    const slug = String(inputs._industrySlug || 'office'); // Pass slug via metadata
    
    // Delegate to SSOT
    const result = calculateUseCasePower(slug, inputs);
    
    // Normalize to contract format
    return {
      baseLoadKW: result.powerMW * 1000 * 0.4,
      peakLoadKW: result.powerMW * 1000,
      energyKWhPerDay: result.powerMW * 1000 * result.durationHrs,
      assumptions: [result.description, result.calculationMethod],
      warnings: [],
      raw: result,
    };
  }
};
```

### Phase 2: Update Existing Calculators
- Car Wash: Delegate to `calculateCarWashPower()`
- Hotel: Delegate to `calculateHotelPower()`
- Data Center: Already has SSOT fallback - use that

### Phase 3: Add All 20+ Industries
No new calculators needed! Generic adapter routes via slug:
- office → `calculateOfficePower()`
- retail → `calculateRetailPower()`
- manufacturing → `calculateManufacturingPower()`
- hospital → `calculateHospitalPower()`
- warehouse → `calculateWarehousePower()`
- ... etc

### Phase 4: Remove Hardcoded Logic
- Delete duplicate calculations from registry
- Keep only parsing/mapping logic
- All formulas live in SSOT

## ✅ VALIDATION

**Run these after implementation:**
```bash
# Test all industries route correctly
npx vite-node scripts/validate-step3-workflow.ts

# Test input sensitivity
npm run quote:diag

# Test SSOT functions directly
npm run test:unit src/services/useCasePowerCalculations.test.ts
```

## 🎯 SUCCESS CRITERIA

- [ ] All calculators delegate to SSOT (no hardcoded formulas)
- [ ] All 20+ industries supported
- [ ] Workflow validator shows 20+ PASS
- [ ] Diagnostic shows proper input sensitivity
- [ ] TrueQuote policy compliant (database = truth)
- [ ] Test coverage > 90%

## 📚 FILES TO MODIFY

**Primary:**
1. `src/wizard/v7/calculators/registry.ts` - Replace with thin adapters
2. `src/services/useCasePowerCalculations.ts` - SSOT (READ ONLY - do not duplicate)

**Secondary:**
3. `scripts/validate-step3-workflow.ts` - Add all 20+ industries
4. `scripts/quote-diag.ts` - Add test cases for each industry

**Documentation:**
5. Update `copilot-instructions.md` with SSOT strategy
6. Document field mappings per industry

## 🚫 DO NOT

- ❌ Duplicate calculation logic from SSOT to registry
- ❌ Hardcode equipment power values in adapters
- ❌ Create separate calculators for similar industries (use SSOT routing)
- ❌ Modify SSOT formulas without consulting industry standards
- ❌ Bypass SSOT for "quick" calculations

## ✅ DO

- ✅ Use thin adapters that parse DB format → SSOT params
- ✅ Leverage existing SSOT functions for all industries
- ✅ Add new industries to SSOT first, then add adapter
- ✅ Document field mappings clearly
- ✅ Test both adapter and SSOT independently

---

**Updated:** Feb 4, 2026  
**Status:** Strategy defined, implementation pending  
**Owner:** Architecture decision for team review
