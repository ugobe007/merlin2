# Investment/ROI Investigation - March 15, 2026

## User-Reported Issues

**Date**: March 15, 2026  
**Reporter**: User feedback  
**Severity**: HIGH - Potential SSOT calculation errors

---

## 🚨 Critical Issues Identified

### 1. **Federal ITC Applied to International Projects** ✅ FIXED

**Status**: RESOLVED  
**Fix**: Added `isUSProject` check in `unifiedQuoteCalculator.ts`

- IRA 2022 tax credits are US-only
- International projects (Kuwait, etc.) now get ITC = $0
- Metadata includes explanation: 'N/A - International project'

---

### 2. **Hotel Sizing Showing 0 Value**

**Status**: ⚠️ NEEDS INVESTIGATION

**Locations Affected**:

- Kuwait hotel
- US hotel (user's zip code)

**Potential Causes**:

1. **Missing/incorrect room count** in wizard state
2. **Industry data not mapping** correctly to `calculateHotelPower()`
3. **Field name mismatch** between wizard answers and SSOT function
4. **Template/questionnaire issue** - answers not captured

**Investigation Steps**:

```typescript
// Check in browser console (DEV mode enabled):
// 1. What does wizard state contain?
console.log("Wizard state:", state);

// 2. What gets passed to calculateHotelPower()?
// Look for: "🏨 [calculateHotelPower] SSOT calculation"

// 3. What's the room count value?
// Should see: roomCount, hotelClass, basePeakKW, totalPeakKW

// 4. Is roomCount = 0 or undefined?
```

**Files to Check**:

- `src/services/useCasePowerCalculations.ts` - Line 2193 (calculateHotelPower)
- `src/wizard/v8/steps/Step3V8.tsx` - Room count question
- `src/wizard/v8/useWizardV8.ts` - How answers map to calculateHotelPower

---

### 3. **Investment/ROI Numbers Appear Too Low**

**Status**: ⚠️ NEEDS COMPREHENSIVE VERIFICATION

**User Observation**:

> "$92k investment with 2-year payback for BESS+solar for hotel seems quite low"

**Potential Issues**:

#### A. Equipment Pricing Too Low?

Current pricing sources:

- **BESS**: $100-125/kWh (NREL ATB 2024, vendor quotes)
- **Solar**: $0.85/W commercial, $0.65/W utility (NREL Cost Benchmark 2024)
- **Inverter**: Tiered by size (NREL StoreFAST)
- **Installation**: 15-25% of equipment (NREL)

**Need to verify**:

- Are prices still accurate for March 2026?
- Are we missing soft costs?
- Are we missing interconnection fees?
- Are we missing permitting costs?

#### B. Savings Overestimated?

Current savings model:

- Peak shaving: `peakKW × demandCharge × 12 months`
- Energy arbitrage: `kWh × electricityRate × cyclesPerYear`
- Solar self-consumption: `solarKWh × retailRate`

**Need to verify**:

- Are we double-counting savings?
- Are we ignoring degradation in early years?
- Are we using unrealistic electricity rates?
- Are we using unrealistic demand charges?

#### C. Are We Using Placeholder Data?

User mentioned: "Maybe it's because of our dummy numbers we are using"

**Check**:

- Default values in `wizardConstants.ts`
- Default values in `calculation_constants` table
- Are wizard defaults too optimistic?

---

## 🔬 Recommended Testing Protocol

### Test 1: Real-World Hotel Comparison

**Setup**:

- 150-room midscale hotel
- California location (high rates)
- 4 MWh BESS + 1 MW solar
- No generator

**Expected Range** (based on NREL benchmarks):

- Equipment: $4-5M
- Installation: $1-1.5M
- **Total**: $5-6.5M before ITC
- **Net cost**: $3.5-4.5M after 30% ITC
- **Payback**: 7-10 years (not 2 years!)

### Test 2: Car Wash Sanity Check

**Setup**:

- 4-bay tunnel car wash
- 200 kWh BESS
- No solar
- Natural gas generator backup

**Expected Range**:

- Equipment: $80-120k
- Installation: $20-30k
- **Total**: $100-150k before ITC
- **Net cost**: $70-105k after 30% ITC
- **Payback**: 5-8 years

### Test 3: International (Kuwait Hotel)

**Setup**:

- 200-room luxury hotel
- Kuwait City
- 5 MWh BESS + 2 MW solar
- Diesel generator

**Expected**:

- ✅ NO federal ITC
- Equipment: Higher shipping costs
- Installation: International labor rates
- Electricity rates: Different from US

---

## 🛠️ Files to Audit

### Primary Calculation Files (SSOT):

1. **`unifiedQuoteCalculator.ts`** ✅ ITC fix applied
2. **`centralizedCalculations.ts`** ⚠️ Need to verify financial formulas
3. **`equipmentCalculations.ts`** ⚠️ Need to verify pricing
4. **`useCasePowerCalculations.ts`** ⚠️ Need to verify hotel/car wash power calcs

### Database Tables:

1. **`pricing_configurations`** ⚠️ Verify current prices
2. **`calculation_constants`** ⚠️ Verify rates/multipliers
3. **`custom_questions`** ⚠️ Verify default values

### Wizard Files:

1. **`useWizardV8.ts`** ⚠️ How answers map to SSOT
2. **`Step3V8.tsx`** ⚠️ Are answers captured correctly?
3. **`Step5V8.tsx`** ⚠️ Display accuracy

---

## 📊 Suggested Action Items

### Immediate (Today):

1. ✅ Fix ITC for international - DONE
2. ⚠️ Debug hotel sizing = 0 issue
3. ⚠️ Run test suite on real-world hotel scenario
4. ⚠️ Verify car wash calculations

### Short-term (This Week):

1. Create validation tests for all industry types
2. Add sanity checks to SSOT (e.g., payback < 3 years = warning)
3. Compare against 3+ real-world project quotes
4. Audit all database pricing constants

### Medium-term (This Month):

1. Build automated test suite with known-good quotes
2. Add "reasonableness checks" to calculator (warn if outside bounds)
3. Create admin dashboard to compare quotes vs. industry benchmarks
4. Document acceptable ranges for each industry

---

## 💡 Next Steps

1. **Enable DEV mode** and run Kuwait hotel quote - capture all console logs
2. **Run US hotel quote** with known room count - capture console logs
3. **Compare calculations** against spreadsheet (manual verification)
4. **Share findings** in next session

---

## 📝 Notes

- User is right to question these numbers - trust but verify!
- 2-year payback is suspiciously good (industry norm is 7-10 years)
- Need to ensure we're not creating unrealistic expectations
- TrueQuote™ brand depends on accurate, defensible numbers

---

**Status**: Investigation in progress  
**Next Update**: After debugging session with console logs
