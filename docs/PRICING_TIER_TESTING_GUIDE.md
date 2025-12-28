# Pricing Tier Testing Guide

**Date**: December 25, 2025  
**Environment**: Testing before Production Deployment

---

## Testing Recommendation: **LOCALHOST FIRST** ✅

### Why Localhost?
- ✅ Safe testing environment
- ✅ Easy to debug with console logs
- ✅ No impact on production users
- ✅ Can verify migration before production
- ✅ Faster iteration cycle

---

## Pre-Testing Checklist

### 1. Database Migration Status

**Check if migration has been run on your local database:**

```sql
-- Check if size columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'pricing_configurations' 
  AND column_name IN ('size_min_kw', 'size_max_kw', 'size_min_mwh', 'size_max_mwh');

-- Check if pricing tiers exist
SELECT config_key, config_category, size_min_kw, size_max_kw 
FROM pricing_configurations 
WHERE config_key LIKE 'bess_%' OR config_key LIKE 'solar_%'
ORDER BY config_category, size_min_kw;
```

**If columns don't exist or tiers are missing:**
- Run migration: `database/migrations/20251225_enhance_pricing_configurations_size_tiers.sql`
- Execute in your local Supabase SQL editor or via psql

### 2. Environment Setup

**Verify `.env` file has correct Supabase credentials:**
```bash
VITE_SUPABASE_URL=your_local_or_prod_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**For localhost testing, use:**
- Local Supabase instance OR
- Development Supabase project (separate from production)

### 3. Start Development Server

```bash
npm run dev
# or
npm run dev --workspace=apps/merlin2
```

Server should start on `http://localhost:5173` (or similar port)

---

## Testing Steps

### Test 1: BESS Pricing Tiers

**Generate quotes for different BESS system sizes:**

1. **5 MW BESS System** (should use 3-10 MW tier)
   - Expected: `$110/kWh` (mid-level)
   - Tier: `bess_utility_3_10mw`
   - Check console log: `🔋 [Pricing Tier] 5.00 MW → bess_utility_3_10mw: $110/kWh`

2. **25 MW BESS System** (should use 10-50 MW tier)
   - Expected: `$110/kWh` (mid-level)
   - Tier: `bess_utility_10_50mw`
   - Check console log: `🔋 [Pricing Tier] 25.00 MW → bess_utility_10_50mw: $110/kWh`

3. **100 MW BESS System** (should use 50+ MW tier)
   - Expected: `$95/kWh` (mid-level)
   - Tier: `bess_utility_50mw_plus`
   - Check console log: `🔋 [Pricing Tier] 100.00 MW → bess_utility_50mw_plus: $95/kWh`

4. **300 kWh BESS System** (should use 100-500 kWh tier)
   - Expected: `$325/kWh` (mid-level)
   - Tier: `bess_commercial_100_500kwh`
   - Check console log: `🔋 [Pricing Tier] 0.30 MW → bess_commercial_100_500kwh: $325/kWh`

5. **10 kWh Residential BESS** (should use 5-20 kWh tier)
   - Expected: `$650/kWh` (mid-level)
   - Tier: `bess_residential_5_20kwh`
   - Check console log: `🔋 [Pricing Tier] 0.01 MW → bess_residential_5_20kwh: $650/kWh`

### Test 2: Solar Pricing Tiers

1. **10 MW Solar System** (should use ≥5 MW tier)
   - Expected: `$0.65/W` (mid-level)
   - Tier: `solar_pv_utility_5mw_plus`
   - Check console log: `☀️ [Solar Pricing Tier] 10.00 MW → solar_pv_utility_5mw_plus: $0.65/W`

2. **2 MW Solar System** (should use 50 kW - 5 MW tier)
   - Expected: `$1.05/W` (mid-level)
   - Tier: `solar_pv_commercial_50kw_5mw`
   - Check console log: `☀️ [Solar Pricing Tier] 2.00 MW → solar_pv_commercial_50kw_5mw: $1.05/W`

3. **20 kW Residential Solar** (should use 5-50 kW tier)
   - Expected: `$3.00/W` (mid-level)
   - Tier: `solar_pv_residential_5_50kw`

### Test 3: Fallback Logic

**Test that fallback works when database is unavailable:**

1. Temporarily break database connection (wrong URL in .env)
2. Generate a quote
3. Should see console warning: `⚠️ [Pricing Tier] Using fallback pricing: $X/kWh`
4. Quote should still generate using market intelligence fallback
5. Restore correct database connection

### Test 4: Price Levels

**Test all 5 price levels** (if admin UI available, or modify code temporarily):

- `low`: Should return lowest price in range
- `low_plus`: Should return low+ price
- `mid`: Should return mid price (default)
- `mid_plus`: Should return mid+ price
- `high`: Should return highest price in range

### Test 5: Quote Metadata

**Verify source tracking in quotes:**

1. Generate a quote
2. Check quote metadata/dataSource field
3. Should show: `Q4 2024 - Q1 2025 Market Reality + Market Intelligence` or similar
4. Should NOT show: `market_intelligence_fallback` (unless fallback was used)

---

## Expected Console Output (Development Mode)

When generating quotes in development mode, you should see:

```
🔋 [Pricing Tier] 5.00 MW → bess_utility_3_10mw: $110/kWh
☀️ [Solar Pricing Tier] 10.00 MW → solar_pv_utility_5mw_plus: $0.65/W
```

**If you see fallback warnings:**
```
⚠️ [Pricing Tier] Using fallback pricing: $110/kWh (error: ...)
```

This indicates the database query failed, and fallback is being used.

---

## Verification Checklist

- [ ] Migration executed on local database
- [ ] Pricing tiers exist in database (9 tiers)
- [ ] Dev server starts without errors
- [ ] BESS pricing uses correct tiers (5 MW, 25 MW, 100 MW, 300 kWh, 10 kWh)
- [ ] Solar pricing uses correct tiers (10 MW, 2 MW, 20 kW)
- [ ] Console logs show tier selection
- [ ] Quote metadata shows correct source
- [ ] Fallback works when database unavailable
- [ ] No console errors
- [ ] Pricing values match expected tier mid-level prices

---

## Production Deployment Checklist

**Before deploying to production:**

1. ✅ All localhost tests pass
2. ✅ Migration tested on local database
3. ✅ No console errors
4. ✅ Pricing values verified
5. ✅ Fallback logic confirmed

**Production deployment steps:**

1. Run migration on production database
2. Verify pricing tiers exist in production
3. Deploy code changes
4. Monitor for errors
5. Generate test quotes on production
6. Verify pricing matches expected values

---

## Troubleshooting

### Issue: "No pricing tier found"

**Cause**: Migration not run or wrong database connection

**Solution**:
- Verify migration has been executed
- Check database connection in .env
- Verify pricing tiers exist: `SELECT * FROM pricing_configurations WHERE config_category = 'bess'`

### Issue: "Using fallback pricing"

**Cause**: Database query failed or pricingTierService import failed

**Solution**:
- Check database connection
- Verify pricingTierService.ts file exists
- Check console for specific error message
- Verify dynamic import path is correct

### Issue: Wrong pricing tier selected

**Cause**: Size range logic issue

**Solution**:
- Verify system size is being converted correctly (MW → kW)
- Check size range matching logic in pricingTierService.ts
- Verify database function `get_pricing_tier()` works correctly

---

## Quick Test Script

You can test the pricing tier service directly:

```typescript
// Test in browser console or Node.js
import { getPricingTier } from './src/services/pricingTierService';

// Test BESS 5 MW
const result = await getPricingTier('bess', 5000, null, 'mid');
console.log(result); // Should return { price: 110, unit: '$/kWh', tier: {...} }

// Test Solar 10 MW
const solarResult = await getPricingTier('solar', 10000, null, 'mid');
console.log(solarResult); // Should return { price: 0.65, unit: '$/W', tier: {...} }
```

---

## Next Steps After Testing

1. **If all tests pass on localhost:**
   - Deploy to production
   - Run migration on production database
   - Test on production
   - Monitor for issues

2. **If issues found:**
   - Fix issues on localhost
   - Re-test
   - Document fixes
   - Deploy once stable



