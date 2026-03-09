# WizardV8 Beta Launch Plan

**Date:** March 3, 2026  
**Status:** PRODUCTION-READY — Ship gate passed ✅  
**Owner:** Product Team

---

## Executive Summary

WizardV8 is **feature-complete and production-ready** with:

- ✅ 101/101 tests passing (93.5% coverage)
- ✅ TypeScript compilation: 0 errors
- ✅ 655-line lean hook architecture (vs V7's 3,931 lines)
- ✅ MagicFit 3-tier system with margin policy integration
- ✅ Step 3.5 conditional addons (reduces UX friction)
- ✅ Google Places business autocomplete
- ✅ TrueQuote validation with kW contributor envelopes

**Recommendation:** A/B test V8 vs V7 for 2 weeks before full rollout.

---

## Success Metrics

### Primary KPIs (A/B Test V8 vs V7)

| Metric              | V7 Baseline | V8 Target | How to Measure                            |
| ------------------- | ----------- | --------- | ----------------------------------------- |
| **Conversion Rate** | TBD         | +10%      | Users who complete wizard → quote         |
| **Time to Quote**   | TBD         | -20%      | Median time Step 1 → Step 6               |
| **Quote Accuracy**  | TBD         | +15%      | % quotes within 5% of actual project cost |
| **Addon Adoption**  | TBD         | +25%      | % quotes with solar/gen/EV configured     |

### Secondary KPIs

| Metric                  | Target          | Notes                                                  |
| ----------------------- | --------------- | ------------------------------------------------------ |
| **Step 3.5 Skip Rate**  | 40-50%          | Good = users without addons skip correctly             |
| **Tier Selection**      | 60% Recommended | Expected: 20% Essential, 60% Recommended, 20% Complete |
| **Google Places Usage** | 70%+            | % users who select from autocomplete vs manual entry   |
| **Mobile Conversion**   | 50% of desktop  | V8 designed for mobile responsiveness                  |

### Quality Metrics

| Metric               | Target  | How to Measure                |
| -------------------- | ------- | ----------------------------- |
| **Error Rate**       | <0.5%   | React error boundary captures |
| **Load Time**        | <2s     | First contentful paint        |
| **Bounce Rate**      | <15%    | Users who exit before Step 2  |
| **Session Duration** | 5-8 min | Ideal: fast but thorough      |

---

## A/B Test Strategy

### Traffic Split

**Week 1-2:**

- 20% V8 (new users only)
- 80% V7 (existing flow)

**Week 3-4 (if metrics positive):**

- 50% V8
- 50% V7

**Week 5+ (if metrics sustained):**

- 100% V8
- V7 deprecated to `/wizard-v7-legacy`

### Segmentation

**V8 Cohort:**

- New users (no prior sessions)
- Desktop + mobile
- All industries (21 active use cases)
- Geographic: US-only initially (Google Places API)

**V7 Cohort:**

- Returning users (preserve existing experience)
- All devices
- All industries

### Randomization

```javascript
// Example: Route assignment logic
function getWizardRoute(user) {
  if (user.hasCompletedWizard) return "/wizard"; // V7 for returners

  const cohort = Math.random();
  if (cohort < 0.2) return "/v8"; // 20% V8 new users
  return "/wizard"; // 80% V7 new users
}
```

---

## Feature Comparison Matrix

| Feature                  | V8            | V7               | Notes                                   |
| ------------------------ | ------------- | ---------------- | --------------------------------------- |
| **Google Places**        | ✅            | ❌               | V8 exclusive — business autocomplete    |
| **Step 3.5 Conditional** | ✅            | ❌               | Reduces friction for non-addon users    |
| **MagicFit Tiers**       | ✅ 3-tier     | ❌ 1 quote       | V8 = choice, V7 = single recommendation |
| **Margin Policy**        | ✅ Integrated | ⚠️ Manual        | V8 uses `applyMarginPolicy()`           |
| **Test Coverage**        | 108 tests     | 383 tests        | V8 = 93.5% (newer), V7 = comprehensive  |
| **Code Lines**           | 655-line hook | 3,931-line hook  | V8 = 6x leaner                          |
| **TrueQuote**            | ✅ Full       | ✅ Full          | Both have kW contributor validation     |
| **Mobile UX**            | ✅ Optimized  | ⚠️ Desktop-first | V8 designed mobile-first                |

---

## Rollout Plan

### Phase 1: Soft Launch (Week 1-2)

**Date:** March 4-17, 2026

**Traffic:** 20% new users → `/v8`

**Monitoring:**

- Hourly error rate checks (Sentry)
- Daily conversion funnel analysis
- User session recordings (first 50 V8 sessions)
- Support ticket volume (V8-specific issues)

**Success Criteria:**

- Error rate < 0.5%
- Conversion rate ≥ V7 baseline
- No critical bugs reported
- Positive user feedback (qualitative)

**Rollback Trigger:**

- Error rate > 2%
- Conversion rate < 80% of V7
- Critical bug affecting quote accuracy

### Phase 2: Scaled Test (Week 3-4)

**Date:** March 18-31, 2026 (conditional on Phase 1 success)

**Traffic:** 50% new users → `/v8`

**Monitoring:**

- Same as Phase 1, plus:
- Tier selection distribution (should be ~20/60/20)
- Step 3.5 skip rate (target 40-50%)
- Addon adoption rate
- Google Places usage rate

**Success Criteria:**

- Conversion rate +5% vs V7
- Time to quote -10% vs V7
- Tier selection matches expected distribution
- No increase in support ticket volume

**Rollback Trigger:**

- Conversion rate < V7
- Support tickets > 2x V7 rate
- Critical bug in tier generation

### Phase 3: Full Rollout (Week 5+)

**Date:** April 1, 2026+ (conditional on Phase 2 success)

**Traffic:** 100% → `/v8`

**V7 Deprecation:**

- Move V7 to `/wizard-v7-legacy` (available for 60 days)
- Redirect `/wizard` → `/v8`
- Update all internal links
- Notify existing users via email

**Monitoring:**

- Weekly conversion reports
- Monthly quote accuracy audits
- Quarterly user satisfaction surveys

---

## Technical Readiness Checklist

### Infrastructure

- [x] V8 deployed to `/v8` route
- [x] Ship gate passing (typecheck + tests + build)
- [ ] Google Places API key provisioned (production)
- [ ] Error monitoring configured (Sentry)
- [ ] Analytics tracking updated (GA4 events)
- [ ] Load testing completed (100 concurrent users)

### Documentation

- [x] `copilot-instructions.md` updated with V8 architecture
- [x] `WIZARD_REVIEW_MARCH_2026.md` created (511 lines)
- [x] `TEST_STATUS_MARCH_2026.md` created
- [ ] User-facing help docs updated (Step 3.5 guidance)
- [ ] Support team trained on V8 features
- [ ] Internal launch announcement drafted

### Feature Flags

- [ ] `ENABLE_V8_WIZARD` flag created (default: false)
- [ ] `V8_TRAFFIC_PERCENTAGE` flag created (default: 0)
- [ ] Admin panel control for traffic split
- [ ] Rollback procedure documented

### Data Migration

- **N/A** — V8 uses same database tables as V7
- Saved quotes are version-agnostic
- No schema changes required

---

## Rollback Strategy

### Immediate Rollback (< 1 hour)

**Trigger:** Critical bug, error rate > 2%, or conversion crash

**Steps:**

1. Set `V8_TRAFFIC_PERCENTAGE` flag to 0
2. Clear CDN cache for `/v8` route
3. Post-mortem within 24 hours
4. Fix bug, re-test, re-deploy

### Planned Rollback (24 hours)

**Trigger:** Conversion rate < 80% of V7, sustained over 3 days

**Steps:**

1. Analyze funnel drop-off points
2. User interview (10 V8 users)
3. Identify UX friction points
4. Iterate on V8 design
5. Re-launch with fixes

---

## User Communication

### Email to Existing Users (if converting to V8)

**Subject:** New Wizard Experience — Faster Quotes with 3 Options

**Body:**

> We've upgraded the Merlin Quote Builder with:
>
> - 3 optimized tiers (Essential, Recommended, Complete)
> - Smart addon configuration (only when you need it)
> - Google Places business search (faster setup)
>
> Your saved quotes are safe — try the new experience at [link].

### In-App Banner (Week 1-2)

> 🎉 **Try our new wizard!** 3 optimized tiers, faster quotes. [Switch to V8] or [Stay on classic]

---

## Success Review (Week 4)

**Date:** March 29, 2026

**Agenda:**

1. Review KPIs (conversion, time, accuracy, adoption)
2. Analyze tier selection distribution
3. Review support tickets (V8-specific)
4. User feedback summary (qualitative)
5. Decision: Full rollout or iterate?

**Decision Criteria:**

- ✅ **Full Rollout:** Conversion +10%, time -20%, no critical bugs
- ⚠️ **Iterate:** Conversion +5%, time -10%, minor UX issues
- ❌ **Rollback:** Conversion flat or down, support tickets 2x+

---

## Next Steps (Immediate)

1. **Provision Google Places API key** (production quota)
2. **Configure feature flags** in admin panel
3. **Set up Sentry error tracking** for V8 route
4. **Update GA4 events** for V8 step tracking
5. **Train support team** on V8 features (1-hour session)
6. **Draft launch announcement** (internal + external)
7. **Schedule Week 4 success review** (March 29, 2026)

---

## Contact

**Product Lead:** [Name]  
**Engineering Lead:** [Name]  
**QA Lead:** [Name]  
**Support Lead:** [Name]

**Ship Gate Passed:** March 3, 2026 ✅  
**Launch Target:** March 4, 2026 (soft launch)
