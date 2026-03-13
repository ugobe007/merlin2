# Deployment Status - March 13, 2026

## ✅ Successfully Deployed to Production
**URL:** https://merlin2.fly.dev

---

## [1] Mobile Optimization: ⚠️ PARTIAL

### ✅ What's Working:
- **Responsive grids** in wizard steps: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Step2IndustryV7**: Has responsive text sizing `text-xs sm:text-sm md:text-base`
- **QuestionCard**: Mobile-first grid `grid-cols-1 sm:grid-cols-2`
- **Step5MagicFit**: Responsive layout `grid-cols-1 lg:grid-cols-3`

### ⚠️ Needs Enhancement:
- Most wizard steps lack responsive text sizing (only Step2 has it)
- No mobile-specific touch target sizing (buttons could be larger on mobile)
- Missing responsive padding/spacing patterns in some components

### 📝 Recommendation:
Add responsive utilities to remaining wizard steps:
```tsx
// Example pattern to apply:
className="text-base md:text-lg lg:text-xl px-4 md:px-6 py-3 md:py-4"
```

---

## [2] International Support: ⚠️ INCOMPLETE

### ✅ Step 1 (Location) - WORKING
- **Country selector UI** exists: US / International toggle buttons
- State managed: `const [country, setCountry] = useState<Country>("US")`
- ZIP validation adjusts based on country:
  ```tsx
  if (country === "US") return /^\d{5}$/.test(normalizedZip);
  // International accepts any format
  ```
- Placeholder text changes: "ZIP code (e.g., 89052)" vs "Postal code"

### ❌ Step 6 (Results/Currency) - NOT IMPLEMENTED
- Currency is **HARDCODED to USD**:
  ```tsx
  currency: "USD",  // Line 95 in Step6ResultsV7.tsx
  ```
- No integration with `internationalService.ts` functions:
  - `convertCurrency()` - not used
  - `formatCurrency()` - not used
  - `SUPPORTED_COUNTRIES` - not used
- Country selection in Step 1 **does not persist to quote results**

### 🔧 Required Fixes:
1. **Pass country through wizard state** (Step 1 → Step 6)
2. **Update Step6ResultsV7.tsx**:
   ```tsx
   import { formatCurrency } from '@/services/internationalService';
   
   // Replace hardcoded USD formatter with:
   const formatted = formatCurrency(amount, state.country || 'US');
   ```
3. **Update quote calculation** to apply regional pricing multipliers
4. **Display country flag/currency symbol** in results header

---

## [3] Widget API: ⚠️ DISABLED

### ✅ Infrastructure Ready:
- **Database schema** deployed ✅
  - `widget_partners` table
  - `widget_usage` table
  - 5 functions: `generate_widget_api_key()`, `validate_widget_api_key()`, etc.
  - RLS policies active
  - 3 test partners seeded
- **TypeScript types** defined (`src/api/widget/types.ts`) ✅
- **Embed script** exists (`src/widget/embed.ts`) ✅

### ❌ API Endpoint DISABLED:
- File status: `src/api/widget/quoteEndpoint.ts.disabled`
- Reason: Needs integration with widget validation + usage tracking
- Missing: API route registration in Express/Supabase Edge Function

### 🔧 Required to Activate:
1. **Rename** `quoteEndpoint.ts.disabled` → `quoteEndpoint.ts`
2. **Create Edge Function** or Express route:
   ```bash
   supabase functions new widget-quote
   ```
3. **Wire up validation**:
   ```typescript
   // Validate API key via database function
   const { data } = await supabase.rpc('validate_widget_api_key', {
     p_api_key: req.headers['x-api-key']
   });
   ```
4. **Test with partner keys**:
   - Free: `pk_test_free_demo_12345678901234567890`
   - Pro: `pk_test_pro_demo_98765432109876543210`
   - Enterprise: `pk_test_enterprise_demo_11223344556677889900`

---

## [4] Calculations & Tests: ⚠️ UNKNOWN

### Status:
- Test command exists: `npm test`
- Test output: *[Need to check terminal output]*

### Test Suites Expected:
- `tests/integration/margin-policy.test.ts` (43 tests)
- `src/wizard/v7/templates/__tests__/` (383 tests)
  - goldenTraces.test.ts
  - trueQuoteSanity.test.ts
  - templateDrift.test.ts
  - inputSensitivity.test.ts
  - contractGuards.test.ts
  - adapterHardening.test.ts

### 🔧 Next Step:
Run full test suite and review results:
```bash
npm test 2>&1 | tee test-results.log
```

---

## Priority Action Items

### 🔴 HIGH PRIORITY (Blocks Key Features)
1. **Fix international currency display** in Step 6 (30 min)
2. **Enable widget API endpoint** (1-2 hours)
3. **Pass country through wizard state** (15 min)

### 🟡 MEDIUM PRIORITY (Improves UX)
4. **Add responsive text sizing to wizard steps** (1 hour)
5. **Run and fix failing tests** (time varies)
6. **Add country/currency indicator in quote header** (30 min)

### 🟢 LOW PRIORITY (Polish)
7. Apply regional pricing multipliers to equipment costs
8. Add mobile touch target optimization
9. Create widget demo page at `/widget`

---

## What's Actually Working Right Now

✅ **Core Wizard Flow** (Steps 1-6)  
✅ **Database Schema** (widget system)  
✅ **TypeScript Build** (no errors)  
✅ **Production Deployment** (merlin2.fly.dev)  
✅ **Country Selection UI** (Step 1)  
⚠️ **Currency Display** (hardcoded USD)  
⚠️ **Mobile Responsive** (partial)  
❌ **Widget API** (disabled endpoint)  
❓ **Tests** (need to review)

---

## Testing Checklist

- [ ] Open https://merlin2.fly.dev/v7 on mobile device
- [ ] Test country toggle in Step 1 (US ↔ International)
- [ ] Complete wizard flow and check currency in results
- [ ] Verify responsive layouts on 375px, 768px, 1024px widths
- [ ] Run `npm test` and review failures
- [ ] Test widget embed script (after API enabled)

