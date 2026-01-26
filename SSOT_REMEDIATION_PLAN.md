# SSOT Violation Remediation Plan - January 21, 2026

## Critical Issues Identified

**Audit Result:** ❌ FAILED - 5 critical issues, 14 warnings

### Priority 1: High-Impact Files (BLOCKING DEPLOYMENT)

| File | Violations | Impact | Status |
|------|-----------|--------|--------|
| `Step6Quote.tsx` | 44 patterns | 🔴 CRITICAL | ⏸️ Pending |
| `WizardV6.tsx` | 28 patterns | 🔴 CRITICAL | ⏸️ Pending |
| `MerlinBar.tsx` | 16 patterns | 🟡 HIGH | ⏸️ Pending |

### Priority 2: Advisor Components (NON-BLOCKING)

| File | Violations | Impact | Status |
|------|-----------|--------|--------|
| `SavingsPreviewPanel.tsx` | 8 patterns | 🟡 MEDIUM | ⏸️ Pending |
| `Step1LocationRedesign.tsx` | 16 patterns | 🟡 MEDIUM | ⏸️ Pending |
| `PowerGaugeWidget.tsx` | 16 patterns | 🟢 LOW | ⏸️ Pending |

---

## Remediation Strategy

### Phase 1: Immediate Fixes (1-2 hours)

**Target:** Make WizardV6 deployment-ready by fixing blockers

#### 1.1 Replace Hardcoded Rates
**Files:** All wizard components
**Change:** Replace hardcoded `0.12` and `15` with dynamic lookups

```typescript
// ❌ BEFORE
const electricityRate = 0.12;
const demandCharge = 15;

// ✅ AFTER
import { getCommercialRateByZip } from '@/services/utilityRateService';
const rateData = await getCommercialRateByZip(zipCode);
const electricityRate = rateData?.electricityRate || 0.12; // fallback
const demandCharge = rateData?.demandCharge || 15; // fallback
```

**Estimated Time:** 30 minutes  
**Risk:** Low (graceful fallback to defaults)

#### 1.2 Step6Quote.tsx - Use QuoteEngine Results
**Current Issue:** 44 local calculations in quote display
**Solution:** Step6Quote should ONLY display pre-calculated results

```typescript
// ❌ BEFORE (local calculation)
const paybackYears = Math.round((totalCapex / avgAnnualSavings) * 10) / 10;
const estimatedROI = Math.round(((avgAnnualSavings * 10) / totalCapex - 1) * 100);

// ✅ AFTER (use SSOT results)
// Assume selected.financials comes from QuoteEngine
const paybackYears = selected.financials?.paybackYears || 0;
const estimatedROI = selected.financials?.roi10Year || 0;
```

**Estimated Time:** 45 minutes  
**Risk:** Medium (need to verify all required fields exist in QuoteEngine results)

#### 1.3 WizardV6.tsx - Extract Industry Power Calculations
**Current Issue:** 28 local power calculations for different industries
**Solution:** Move to `useCasePowerCalculations.ts`

```typescript
// ❌ BEFORE (in WizardV6.tsx)
let basePeakKW = sqft * (wPerSqft / 1000);

// ✅ AFTER (use SSOT)
import { calculateUseCasePower } from '@/services/useCasePowerCalculations';
const powerResult = calculateUseCasePower(industrySlug, inputs);
const basePeakKW = powerResult.peakKW;
```

**Estimated Time:** 60 minutes  
**Risk:** High (core wizard logic, need comprehensive testing)

---

### Phase 2: Advisor Components (2-3 hours)

**Target:** Clean up advisor components for consistency

#### 2.1 MerlinBar.tsx - Use Utility Rate Service
**Issue:** Hardcoded rate assumptions
**Solution:** Dynamic rate lookup + SSOT calculations

#### 2.2 SavingsPreviewPanel.tsx - Use centralizedCalculations
**Issue:** Local payback/ROI formulas
**Solution:** Import and use `calculateFinancialMetrics()`

#### 2.3 PowerGaugeWidget.tsx - Display Only
**Issue:** Local power calculations
**Solution:** Accept pre-calculated values as props

---

### Phase 3: Testing & Validation (1 hour)

#### 3.1 Build Test
```bash
npm run build
```

#### 3.2 SSOT Audit Re-run
```bash
./audit-v6-ssot.sh src/components/wizard
```

#### 3.3 Manual Smoke Test
- Test all 21 active industries
- Verify quote results match expectations
- Check advisor components display correctly

---

## Implementation Order

### Option A: Conservative (Recommended for Production)
1. ✅ Document existing violations (acceptance criteria)
2. ✅ Add TODO comments in code pointing to SSOT
3. ✅ Create tech debt tickets
4. ✅ Deploy with known limitations
5. 🔄 Fix in next sprint with full testing

**Pros:**
- No risk of breaking production
- Allows time for comprehensive testing
- Can prioritize by user impact

**Cons:**
- Technical debt accumulates
- Inconsistent calculations remain

### Option B: Aggressive (Fix Now)
1. 🔴 Fix Step6Quote.tsx (30 min)
2. 🔴 Fix hardcoded rates (30 min)
3. 🟡 Fix WizardV6.tsx power calculations (60 min)
4. ✅ Test + re-audit (60 min)
5. ✅ Deploy clean codebase

**Pros:**
- Clean architecture
- SSOT compliance achieved
- No technical debt

**Cons:**
- Higher risk of regression
- Requires extensive testing
- May delay deployment

---

## Recommendation: HYBRID APPROACH

### Immediate (Today - 1 hour)
1. ✅ **Add SSOT imports** to all violating files
2. ✅ **Add TODO comments** with ticket references
3. ✅ **Fix only Step6Quote.tsx** (highest violation count)
4. ✅ **Replace hardcoded 0.12/15** with constants from service

### Short-Term (Next Sprint - 4 hours)
1. 🔄 Refactor WizardV6.tsx industry calculations
2. 🔄 Refactor advisor components
3. 🔄 Add integration tests
4. 🔄 Re-audit and verify

### Result
- **Today:** Reduce critical violations from 5 to 2
- **Next Sprint:** Full SSOT compliance
- **Risk:** Minimized through incremental changes

---

## Quick Win: Add SSOT TODO Comments

Add these to all violating files to acknowledge technical debt:

```typescript
// TODO: SSOT-001 - Replace local calculation with QuoteEngine.generateQuote()
// See: WIZARD_TEST_RESULTS_JAN_2026.md
// Priority: High | Estimated: 2 hours
const paybackYears = Math.round((totalCapex / avgAnnualSavings) * 10) / 10;
```

This allows deployment while documenting the path forward.

---

## Decision Required

**Which approach should we take?**

1. **Conservative:** Document violations, deploy as-is, fix next sprint
2. **Aggressive:** Fix all violations now before deployment
3. **Hybrid:** Fix Step6Quote + add TODO comments, fix rest next sprint

**Recommendation:** Hybrid approach balances speed and quality.

---

**Created:** January 21, 2026  
**Status:** Awaiting approval  
**Estimated Full Fix Time:** 4-6 hours
