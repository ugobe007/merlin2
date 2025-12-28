# Quick Pricing Tier Test Guide - Localhost:5178

## Quick Test Checklist

### 1. Verify Migration (Optional)
If you want to verify migration ran, check Supabase SQL Editor:
- Run: `scripts/verify-pricing-tiers.sql`
- Should see 9 pricing tiers (6 BESS + 3 Solar)

### 2. Start Dev Server (if not running)
```bash
npm run dev
```
Server should be available at: http://localhost:5178

### 3. Open Browser Console
- Open http://localhost:5178
- Press `F12` to open DevTools
- Go to "Console" tab
- Look for pricing tier logs when generating quotes

### 4. Generate Test Quotes

#### Test BESS Pricing Tiers:

**Test 1: 5 MW BESS System**
1. Go to Smart Wizard
2. Select any industry (e.g., "Car Wash")
3. Enter: 5 MW storage
4. **Expected Console Log**: `🔋 [Pricing Tier] 5.00 MW → bess_utility_3_10mw: $110/kWh`
5. **Expected Price**: ~$110/kWh

**Test 2: 25 MW BESS System**
1. Enter: 25 MW storage
2. **Expected Console Log**: `🔋 [Pricing Tier] 25.00 MW → bess_utility_10_50mw: $110/kWh`
3. **Expected Price**: ~$110/kWh

**Test 3: 100 MW BESS System**
1. Enter: 100 MW storage
2. **Expected Console Log**: `🔋 [Pricing Tier] 100.00 MW → bess_utility_50mw_plus: $95/kWh`
3. **Expected Price**: ~$95/kWh

**Test 4: 300 kWh BESS System (0.3 MW)**
1. Enter: 0.3 MW storage
2. **Expected Console Log**: `🔋 [Pricing Tier] 0.30 MW → bess_commercial_100_500kwh: $325/kWh`
3. **Expected Price**: ~$325/kWh

#### Test Solar Pricing Tiers:

**Test 5: 10 MW Solar System**
1. Add solar to quote
2. Enter: 10 MW solar
3. **Expected Console Log**: `☀️ [Solar Pricing Tier] 10.00 MW → solar_pv_utility_5mw_plus: $0.65/W`
4. **Expected Price**: ~$0.65/W

**Test 6: 2 MW Solar System**
1. Enter: 2 MW solar
2. **Expected Console Log**: `☀️ [Solar Pricing Tier] 2.00 MW → solar_pv_commercial_50kw_5mw: $1.05/W`
3. **Expected Price**: ~$1.05/W

### 5. Check for Errors

**If you see fallback warnings:**
```
⚠️ [Pricing Tier] Using fallback pricing: $X/kWh (error: ...)
```
This means:
- Database query failed, OR
- Pricing tier not found, OR
- Dynamic import failed

**Action**: Check console for specific error message

**If no console logs appear:**
- Check if `process.env.NODE_ENV === "development"` is true
- Verify browser console is open
- Try generating a quote

### 6. Verify Quote Metadata

In the generated quote, check:
- Pricing source should show: `Q4 2024 - Q1 2025 Market Reality + Market Intelligence`
- Should NOT show: `market_intelligence_fallback` (unless fallback was used)

---

## Quick Success Indicators

✅ **Success**:
- Console shows pricing tier logs
- Pricing values match expected tier mid-level prices
- No error messages in console
- Quote generates successfully

❌ **Issues**:
- Fallback warnings in console
- Wrong pricing values
- Errors in console
- Quote generation fails

---

## Next Steps After Testing

**If all tests pass:**
- Ready to deploy to production
- Run migration on production database
- Deploy code changes

**If issues found:**
- Note the specific error/problem
- Check database connection
- Verify migration was run
- Review console logs for details



