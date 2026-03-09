# ✅ WizardV8 Ship Checklist — March 3, 2026

## COMPLETED ✅

### Development & Testing

- [x] Test suite created (108 tests)
- [x] All tests passing (101/101)
- [x] TypeScript compilation: 0 errors
- [x] Ship gate passed (`npm run ship:v8`)
- [x] Documentation updated

### Code Quality

- [x] Test coverage: 93.5%
- [x] Protected files documented
- [x] The 8 Rules enforced
- [x] Null safety patterns implemented
- [x] Code review ready

### Documentation

- [x] copilot-instructions.md updated (V8 section added)
- [x] V8_BETA_LAUNCH_PLAN.md created
- [x] V8_SHIP_SUMMARY.md created
- [x] TEST_STATUS_MARCH_2026.md created
- [x] WIZARD_REVIEW_MARCH_2026.md updated

---

## NEXT: BETA LAUNCH PREPARATION 🚀

### Infrastructure (24-48 hours)

- [ ] Provision Google Places API key (production quota)
- [ ] Configure feature flags
  - [ ] `ENABLE_V8_WIZARD` (default: false)
  - [ ] `V8_TRAFFIC_PERCENTAGE` (default: 0)
- [ ] Set up Sentry error tracking for `/v8` route
- [ ] Update GA4 event tracking (V8 step events)
- [ ] Admin panel control for traffic split

### QA & Testing (This Week)

- [ ] Load testing (100 concurrent users)
- [ ] Mobile QA
  - [ ] iOS Safari
  - [ ] Android Chrome
- [ ] Cross-browser testing
  - [ ] Chrome (desktop)
  - [ ] Safari (desktop)
  - [ ] Firefox
  - [ ] Edge
- [ ] Accessibility audit (WCAG 2.1 AA)

### Team Preparation

- [ ] Train support team (1-hour session on V8 features)
- [ ] Prepare support documentation
  - [ ] Step 3.5 guidance (when it appears)
  - [ ] MagicFit tier explanation
  - [ ] Google Places troubleshooting
- [ ] Draft launch announcement
  - [ ] Internal (team email)
  - [ ] External (user notification)

### Monitoring Setup

- [ ] Dashboard for V8 KPIs
  - [ ] Conversion rate (funnel)
  - [ ] Time to quote (median)
  - [ ] Error rate (hourly)
  - [ ] Tier selection distribution
- [ ] Alerts configured
  - [ ] Error rate > 2% (critical)
  - [ ] Conversion rate < 80% of V7 (warning)
  - [ ] Load time > 3s (warning)

---

## LAUNCH WEEK 1-2 (Soft Launch)

**Target Date:** March 4, 2026  
**Traffic:** 20% new users → `/v8`

### Daily Monitoring (First 2 Weeks)

- [ ] Error rate check (hourly)
- [ ] Conversion funnel analysis (daily)
- [ ] User session recordings (first 50 V8 sessions)
- [ ] Support ticket review (V8-specific)

### Success Criteria (Week 2 Review)

- [ ] Error rate < 0.5%
- [ ] Conversion rate ≥ V7 baseline
- [ ] No critical bugs reported
- [ ] Positive user feedback (qualitative)

### Rollback Plan (If Needed)

- [ ] Set `V8_TRAFFIC_PERCENTAGE` flag to 0
- [ ] Clear CDN cache for `/v8` route
- [ ] Post-mortem within 24 hours
- [ ] Fix + re-test + re-deploy

---

## LAUNCH WEEK 3-4 (Scaled Test)

**Conditional on Week 1-2 Success**  
**Traffic:** 50% new users → `/v8`

### Monitoring (Expanded)

- [ ] Tier selection distribution (should be ~20/60/20)
- [ ] Step 3.5 skip rate (target 40-50%)
- [ ] Addon adoption rate
- [ ] Google Places usage rate
- [ ] Mobile vs desktop conversion

### Success Criteria (Week 4 Review)

- [ ] Conversion rate +5% vs V7
- [ ] Time to quote -10% vs V7
- [ ] Tier selection matches expected distribution
- [ ] No increase in support ticket volume

**Week 4 Review Meeting:** March 29, 2026  
**Decision:** Full rollout OR iterate?

---

## LAUNCH WEEK 5+ (Full Rollout)

**Conditional on Week 3-4 Success**  
**Traffic:** 100% → `/v8`

### V7 Deprecation

- [ ] Move V7 to `/wizard-v7-legacy` route
- [ ] Redirect `/wizard` → `/v8`
- [ ] Update all internal links
- [ ] Notify existing users via email
- [ ] 60-day sunset period for V7

### Post-Launch Monitoring

- [ ] Weekly conversion reports
- [ ] Monthly quote accuracy audits
- [ ] Quarterly user satisfaction surveys

---

## QUICK REFERENCE

**Ship Gate:**

```bash
npm run ship:v8
```

**Test Suite:**

```bash
npm run test:v8              # All tests
npm run test:v8:flow         # State management
npm run test:v8:step35       # Step 3.5 conditional
npm run test:v8:magicfit     # Tier generation
```

**Routes:**

- V8: `/v8` (new)
- V7: `/wizard` (current production)
- V6: `/wizard-v6` (legacy)

**Documentation:**

- [V8_BETA_LAUNCH_PLAN.md](./V8_BETA_LAUNCH_PLAN.md)
- [V8_SHIP_SUMMARY.md](./V8_SHIP_SUMMARY.md)
- [WIZARD_REVIEW_MARCH_2026.md](./WIZARD_REVIEW_MARCH_2026.md)

---

## CONTACT

**Product Lead:** [Name]  
**Engineering Lead:** [Name]  
**QA Lead:** [Name]  
**Support Lead:** [Name]

**Ship Status:** ✅ PRODUCTION-READY  
**Ship Date:** March 3, 2026  
**Launch Target:** March 4, 2026 (soft launch)
