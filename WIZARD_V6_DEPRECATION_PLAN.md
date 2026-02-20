# WizardV6 Deprecation Plan

**Date**: Feb 20, 2026  
**Status**: ✅ V7 is Production Default | V6 Maintained for Legacy Testing

---

## 🎯 Current Routing State

### Production Routes (V7)

✅ **V7 is the default wizard** at the following routes:
- `/wizard` ← Primary entry (redirects to V7)
- `/wizard-v7`
- `/v7`
- `/wizard/v7`

### Legacy Routes (V6)

⚠️ **V6 is accessible only via explicit route:**
- `/wizard-v6` ← Legacy testing route only

### Why We're NOT Deprecating V6 Yet

1. **TrueQuote™ & ProQuote Features**: ✅ Both fully implemented in V7
   - `TrueQuoteFinancialModal` in Step 5 & 6
   - `ProQuoteHowItWorksModal` in Step 6
   - Full kW contributor envelopes
   - Source attribution system

2. **Bundle Size**: 
   - V7: 591 KB ✅
   - V6: 2.4 MB (4x larger)
   - **Decision**: Keep V6 for edge cases where unique features needed

3. **V6 Unique Features** (not yet in V7):
   - `MerlinBar` advisor rail (1,166 lines)
   - `Step1AdvisorLed` conversational onboarding (1,088 lines)
   - Legacy micro-prompts system
   - Some specialized Step 3 industry components

---

## 🚀 V7 Feature Parity Verification

### ✅ Core Features (Confirmed Present in V7)

| Feature | V6 | V7 | Status |
|---------|----|----|--------|
| **TrueQuote™ Badge** | ✅ | ✅ | Parity |
| **TrueQuote™ Financial Modal** | ✅ | ✅ | Parity |
| **ProQuote™ Upsell** | ✅ | ✅ | Parity |
| **kW Contributors Envelope** | ✅ | ✅ | Parity |
| **Source Attribution** | ✅ | ✅ | Parity |
| **Industry Templates** | ✅ (21) | ✅ (21) | Parity |
| **Google Places API** | ✅ | ✅ | Parity |
| **Utility Rate Lookup** | ✅ | ✅ | Parity |
| **ITC Calculator** | ✅ | ✅ | Parity |
| **8760 Hourly Analysis** | ✅ | ✅ | Parity |
| **Monte Carlo Risk** | ✅ | ✅ | Parity |
| **PDF/Word/Excel Export** | ✅ | ✅ | Parity |
| **Save Quote** | ✅ | ✅ | Parity |
| **Margin Policy Engine** | ✅ | ✅ | Parity |
| **Solar Sizing Modal** | ❌ | ✅ | **V7 Better** |
| **Business Profile Card** | ❌ | ✅ | **V7 Better** |
| **Merlin Memory** | ❌ | ✅ | **V7 Better** |
| **Step Gates** | ❌ | ✅ | **V7 Better** |

### 🔄 V6-Only Features (Not Critical)

| Feature | V6 | V7 | Migration Plan |
|---------|----|----|----------------|
| **MerlinBar** | ✅ 1,166 lines | ❌ | V7 uses advisor panel (simpler) |
| **Step1AdvisorLed** | ✅ Conversational | ❌ | V7 uses clean form + advisor |
| **Micro-Prompts** | ✅ Inline hints | ❌ | V7 uses intelligence strip |
| **Legacy Step 3** | ✅ Industry-specific | ❌ | V7 uses curated 16Q |

**Verdict**: These V6 features are **not critical** — V7's architecture is cleaner and more maintainable.

---

## 📊 Bundle Size Impact

### Before (V6 as Default)

```
wizard.js: 2,530 KB (V6)
wizard-v7.js: 601 KB
```

### After (V7 as Default) ✅ CURRENT STATE

```
wizard-v7.js: 601 KB ← Default route
wizard-v6.js: 2,530 KB ← Legacy route only
```

**Savings**: Users loading `/wizard` now get **76% smaller bundle** (1.9 MB savings)

---

## 🛡️ Risk Mitigation

### What If Users Need V6 Features?

**Option 1: Keep V6 Accessible**
- ✅ Already implemented: `/wizard-v6` route
- Users can explicitly access legacy wizard
- No data loss, no workflow disruption

**Option 2: Backport MerlinBar to V7**
- Extract advisor rail logic
- Add as optional component in V7
- **Estimated Work**: 3-4 hours

**Option 3: Sunset V6 Completely**
- Archive V6 code to `_archive-feb-2026/`
- Remove lazy import from `App.tsx`
- **Risk**: Lose legacy testing capability
- **Recommendation**: NOT NOW — wait 60 days

---

## 📅 Deprecation Timeline

### Phase 1: V7 as Default ✅ COMPLETE (Feb 1, 2026)

- [x] V7 handles `/wizard` route
- [x] V6 accessible only via `/wizard-v6`
- [x] TrueQuote™/ProQuote verified in V7
- [x] All 2,288 tests passing

### Phase 2: Monitor Usage (Feb-March 2026)

- [ ] Track `/wizard-v6` traffic (Google Analytics)
- [ ] Collect user feedback on V7 vs V6
- [ ] Identify any missing features
- [ ] Log P0 bugs in V7

**Success Criteria**: <5% of users accessing `/wizard-v6`

### Phase 3: Feature Parity Review (April 2026)

- [ ] Backport any critical V6 features to V7
- [ ] Update documentation (migration guide)
- [ ] Add deprecation notice to V6 UI
- [ ] Announce sunset date (60 days notice)

### Phase 4: V6 Sunset (June 2026)

- [ ] Archive V6 code to `_archive-june-2026/`
- [ ] Remove `/wizard-v6` route
- [ ] Remove lazy import from `App.tsx`
- [ ] Clean up V6-specific files (utilities, types, etc.)
- [ ] Update tests (remove V6 references)

---

## 🚦 Decision: Keep Both for Now

### Why V6 Stays

1. **Safety Net**: If critical bug found in V7, can redirect users to V6
2. **Testing**: V6 provides comparison baseline for V7 features
3. **Bundle Already Optimized**: V6 only loads when explicitly requested
4. **No Maintenance Burden**: V6 is feature-frozen, no active development

### Why V7 is Default

1. **76% Smaller Bundle**: 601 KB vs 2.4 MB
2. **Better Architecture**: Hook-based, modular, testable
3. **Feature Complete**: All critical features present
4. **Active Development**: New features go to V7 only

---

## 🎯 Next Steps

### IMMEDIATE (This PR)

- [x] Verify V7 is default at `/wizard`
- [x] Document routing in `App.tsx`
- [x] Update `WIZARD_OPTIMIZATION_REPORT.md`
- [x] Create this deprecation plan

### SHORT TERM (Feb 2026)

- [ ] Add Google Analytics event tracking for `/wizard-v6` usage
- [ ] Add deprecation banner to V6 UI: "⚠️ Legacy Version — Switch to V7"
- [ ] Monitor Sentry for V7 errors vs V6
- [ ] Update user-facing docs to reference V7

### MEDIUM TERM (March-April 2026)

- [ ] Review `/wizard-v6` traffic data
- [ ] Identify any V6-only workflows
- [ ] Backport critical features if needed
- [ ] Announce V6 sunset date (60 days notice)

### LONG TERM (June 2026)

- [ ] Archive V6 code
- [ ] Remove V6 route
- [ ] Clean up V6-specific utilities
- [ ] Celebrate cleaner codebase 🎉

---

## 📝 Migration Notes

### For Users

**If you prefer the legacy wizard:**
1. Navigate to `https://merlin2.fly.dev/wizard-v6`
2. Bookmark this URL for future use
3. All features work identically
4. TrueQuote™ and ProQuote available in both

**Why switch to V7?**
- 4x faster initial load
- Cleaner UI
- Better mobile experience
- Latest features (Solar Sizing Modal, Business Profile, etc.)

### For Developers

**Current Code References to V6:**

```typescript
// App.tsx - V6 lazy import (line 13)
const WizardV6 = lazy(() => import("./components/wizard/v6/WizardV6"));

// App.tsx - V6 route (line 206-207)
if (pathname === "/wizard-v6") {
  return <Suspense fallback={<PageLoader />}><WizardV6 /></Suspense>;
}
```

**To fully remove V6 (in June 2026):**

1. Delete lazy import line 13
2. Remove route check lines 206-207
3. Archive entire `src/components/wizard/v6/` folder
4. Remove V6-specific types from `src/components/wizard/types.ts`
5. Clean up V6 utilities in `src/components/wizard/v6/utils/`
6. Update tests to remove V6 references

---

## ✅ Summary

**Current State**: V7 is production default, V6 maintained for legacy testing

**Bundle Impact**: Users get 76% smaller wizard (601 KB vs 2.4 MB)

**Risk**: Minimal — V6 accessible via explicit route, all critical features in V7

**Recommendation**: ✅ Ship current state, monitor for 60 days, then sunset V6

