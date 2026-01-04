# Testing Plan - All Industries TrueQuote Engine

**Date:** January 2, 2026  
**Status:** 🧪 **READY FOR TESTING**

---

## Test Scripts Created

### 1. `tests/validation/TrueQuoteEngineAllIndustries.test.ts`

Comprehensive test suite that validates:
- ✅ All 5 existing industries (data-center, hospital, hotel, ev-charging, car-wash)
- ✅ All 7 new industries (manufacturing, retail, restaurant, office, university, agriculture, warehouse)
- ✅ Error handling (unknown industry, unknown subtype)
- ✅ Field name mapping (squareFootage → facilitySqFt)

---

## Running Tests

### Run All Unit Tests:
```bash
npm run test:unit
```

### Run Specific Test File:
```bash
npm run test:unit -- tests/validation/TrueQuoteEngineAllIndustries.test.ts
```

### Run Calculation Tests:
```bash
npm run test:calculations
```

### Run Industry-Specific Playwright Tests:
```bash
npm run test:manufacturing
npm run test:retail
npm run test:restaurant
npm run test:office
npm run test:university
```

---

## Expected Test Results

### ✅ Should Pass:
- All 12 industries return non-zero BESS power
- All 12 industries return non-zero peak demand
- Error handling works for invalid inputs
- Field name variations are handled

### ⚠️ May Need Adjustment:
- Exact BESS power values (depends on inputs)
- Subtype inference logic (especially university)

---

## Manual Testing Checklist

For each of the 12 industries:

1. **Start Wizard**
   - [ ] Select industry in Step 2
   - [ ] Complete Step 3 questionnaire
   - [ ] Navigate to Step 5

2. **Verify Calculations**
   - [ ] BESS Power > 0 kW
   - [ ] BESS Storage > 0 kWh
   - [ ] Peak Demand > 0 kW
   - [ ] All 3 power level cards show different values

3. **Check Console Logs**
   - [ ] No errors in console
   - [ ] Field mapping logs show correct mappings
   - [ ] TrueQuote Engine calculation logs present

---

## Next: 8 Additional Industries

**Please send the list of 8 additional industries** so I can:
1. Check if they have industry profile files
2. Check if they need TrueQuote Engine configs
3. Check database field names
4. Add configs if needed
