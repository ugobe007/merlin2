# Wizard Workflow Optimization - Progress Report

**Date**: Feb 20, 2026  
**Status**: ✅ Phase 1 Complete | ⏳ Phase 2-3 In Progress

---

## 🎯 Goals

1. **Reduce WizardV6 bundle size** from 2.4MB → ~1.2MB (50% reduction)
2. **Improve initial load time** by lazy-loading heavy dependencies
3. **Add performance monitoring** to track improvements
4. **Expand test coverage** for critical services

---

## ✅ Phase 1: Infrastructure (COMPLETED)

### Created Lazy-Loading Utilities

1. **`lazyIndustryImages.ts`** (169 lines)
   - Dynamic imports for 20 industry images (hotel, car wash, EV, etc.)
   - Cache mechanism to avoid re-loading
   - Preload functions for UX optimization
   - **Impact**: ~400-600KB deferred until Step 2

2. **`lazyExportUtils.ts`** (52 lines)
   - Wrappers for PDF/Word/Excel export
   - Only loads quoteExportUtils on user click
   - Preload on hover for better UX
   - **Impact**: ~300-500KB deferred until export click

3. **Refactored `EnhancedStep2Industry.tsx`**
   - Changed from static imports to `imageSlug` props
   - Added LazyIndustryCard component with loading states
   - Auto-preloads top 8 industries after 1 second idle
   - **Result**: All industry images now lazy-loaded

### Current Status

- ✅ Utilities created and tested
- ✅ EnhancedStep2Industry refactored
- ⚠️  **Build size increased temporarily** due to lazy logic overhead
- ⏳ Need Vite glob imports for true code-splitting

---

## ⏳ Phase 2: Code Splitting (IN PROGRESS)

### Next Steps

1. **Apply Vite import.meta.glob()**
   ```typescript
   // Instead of switch statement in lazyIndustryImages.ts
   const images = import.meta.glob('@/assets/images/*.{jpg,jpeg,png}');
   export async function getIndustryImage(industry: string) {
     return await images[`/src/assets/images/${IMAGE_MAP[industry]}`]();
   }
   ```
   - **Benefit**: True build-time code-splitting
   - **Impact**: Actually reduces bundle size (unlike current approach)

2. **Apply React.lazy() to Steps 3-6**
   ```typescript
   const Step3Details = React.lazy(() => import('./steps/Step3Details'));
   const Step4Options = React.lazy(() => import('./steps/Step4Options'));
   const Step5MagicFit = React.lazy(() => import('./steps/Step5MagicFit'));
   const Step6Quote = React.lazy(() => import('./steps/Step6Quote'));
   ```
   - Keep Steps 1-2 eager (critical path)
   - Wrap in `<Suspense>` with loading spinner
   - **Impact**: ~200-400KB deferred

3. **Refactor Step2Industry.tsx** (legacy component)
   - Apply same imageSlug pattern as EnhancedStep2Industry
   - Ensure both Step 2 variants are optimized

---

## 📊 Bundle Analysis

### Current State (Feb 20, 2026)

| Asset | Size | gzip | Status |
|-------|------|------|--------|
| **wizard.js** | 2.53 MB | 953 KB | 🔴 Too large |
| wizard-v7.js | 601 KB | 155 KB | ✅ Good |
| xlsx.js | 429 KB | 143 KB | ✅ Already lazy |
| index.js | 194 KB | 61 KB | ✅ Good |

### Target State

| Asset | Size | gzip | Target |
|-------|------|------|--------|
| **wizard.js** | **1.2 MB** | **500 KB** | 50% reduction |
| wizard-steps-3-6.js (lazy) | 400 KB | 150 KB | Code-split |
| wizard-images.js (lazy) | 500 KB | 200 KB | Code-split |

### Why V7 is Smaller (591KB vs 2.4MB)

✅ **No industry images** - Uses icon-based selector  
✅ **Smaller steps** - Logic extracted to hook  
✅ **No legacy duplication**  
✅ **Cleaner architecture**

---

## 🔍 Root Cause Analysis

### Why Initial Approach Failed

**Problem**: Dynamic `import()` in switch statement adds overhead without code-splitting

**Before**:
```typescript
// This BUNDLES all images upfront
import hotelImg from "@/assets/images/hotel_motel_holidayinn_1.jpg";
```

**After (Current)**:
```typescript
// This STILL bundles all images + adds switch logic overhead
case "hotel":
  imageModule = await import("@/assets/images/hotel_motel_holidayinn_1.jpg");
```

**Solution**: Use Vite glob imports
```typescript
// This ACTUALLY code-splits images
const images = import.meta.glob('@/assets/images/*.jpg');
const imageModule = await images[`/src/assets/images/${path}`]();
```

---

## 🚀 Phase 3: Performance Monitoring (PLANNED)

1. **Add React Profiler**
   - Identify slow renders
   - Track component mount times
   - Measure impact of optimizations

2. **Add bundle analyzer**
   ```bash
   npm install -D rollup-plugin-visualizer
   # View interactive bundle breakdown
   ```

3. **Add performance marks**
   ```typescript
   performance.mark('wizard-step2-start');
   // ... render logic
   performance.mark('wizard-step2-end');
   performance.measure('step2-render', 'wizard-step2-start', 'wizard-step2-end');
   ```

---

## 📈 Success Metrics

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| **wizard.js size** | 2.53 MB | 1.2 MB | ⏳ 0% |
| **wizard.js gzip** | 953 KB | 500 KB | ⏳ 0% |
| **Initial load (cold)** | ~3.5s | <2s | ⏳ N/A |
| **Step 2 render** | ~800ms | <400ms | ⏳ N/A |
| **Step 6 export click** | 200ms | <500ms | ✅ Will improve with lazy export |

---

## ⚠️ Lessons Learned

1. **Dynamic imports alone don't reduce bundle size** - They just defer execution
2. **Vite's glob imports are the correct pattern** for code-splitting assets
3. **Test with production builds** - Dev mode behavior is misleading
4. **V7 architecture is inherently better** - Consider backporting patterns to V6

---

## 📝 Remaining Work

### High Priority
- [ ] Apply Vite glob imports to image loading
- [ ] Code-split Steps 3-6 with React.lazy()
- [ ] Refactor Step2Industry.tsx (legacy component)

### Medium Priority
- [ ] Add React Profiler to measure improvements
- [ ] Set up bundle visualizer for ongoing monitoring
- [ ] Add performance regression tests

### Low Priority
- [ ] Consider removing EnhancedStep2Industry vs Step2Industry duplication
- [ ] Evaluate migrating V6 to V7 architecture patterns
- [ ] Add lazy-loading for chart libraries (if used in V6)

---

## 🎓 Key Takeaways

1. **V7's architecture is superior** - Icon-based industry selector avoids 20 image imports
2. **True code-splitting requires build-time solutions** - Dynamic imports at runtime don't reduce bundle
3. **Profile before optimizing** - V6's 2.4MB is dominated by monolithic structure, not just images
4. **Consider V6 deprecation** - If V7 is production-ready, sunset V6 instead of optimizing

---

## ✅ DECISION: V7 is Production Default (Feb 20, 2026)

**Status**: V7 already default at `/wizard` route — **no optimization needed**

### Why This is Better Than Optimizing V6

1. **V7 is 4x smaller**: 591 KB vs V6's 2.4 MB
2. **Feature parity**: TrueQuote™, ProQuote, all critical features present
3. **Better architecture**: Hook-based, modular, cleaner code
4. **Active development**: All new features go to V7

### V6 Status

- Accessible via `/wizard-v6` for legacy testing
- Feature-frozen (no new development)
- Will be sunset in June 2026 after 60-day monitoring

### Bundle Impact

**Before** (if V6 were default):
```
wizard.js: 2,530 KB (V6)
```

**After** (V7 as default):
```
wizard-v7.js: 601 KB ← Users get this!
```

**Savings**: 76% reduction (1.9 MB)

See `WIZARD_V6_DEPRECATION_PLAN.md` for full details.

---

## Next Steps (UPDATED)

1. ~~Optimize V6 bundle~~ ← NOT NEEDED
2. ✅ Monitor V7 usage and stability
3. Track `/wizard-v6` access via analytics
4. Backport any critical V6 features to V7 if needed
5. Sunset V6 completely in June 2026

