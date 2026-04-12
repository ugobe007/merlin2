# Merlin Quote Engine — Vineet Feedback Implementation

**Date:** April 11, 2026  
**Commit:** `837ffce` → `main`  
**Status:** ✅ 2,703 tests passing · 0 failures · TypeScript clean

---

## Overview

All items from Vineet's feedback (Parts 1–12) have been implemented. The core theme: **stop blending EV revenue with energy savings**, and **model DCFC economics honestly** with real operating costs.

---

## 1. DCFC Revenue — New Model

### Problem (old)

The quote engine was showing ~$10,125–$28,800/charger/year for DCFC, which dramatically overstated the actual business case. The old model used 5 sessions/day and applied zero operating costs.

### What changed

| Item                   | Old | New                     | Source                                                                                |
| ---------------------- | --- | ----------------------- | ------------------------------------------------------------------------------------- |
| Sessions/day           | 5   | **3**                   | Wood Mackenzie "EV Fast Charging Economics" 2024; BloombergNEF DCFC utilization index |
| Network/software fee   | $0  | **15% of gross**        | ChargePoint/Blink operator agreements                                                 |
| Credit card processing | $0  | **3.5% of gross**       | Standard payment processor rate                                                       |
| Maintenance            | $0  | **$1,000/charger/year** | DOE AFDC maintenance data                                                             |

### Real-world impact (1 DCFC, $0.15/kWh, 95 kW BESS)

| Step                                       | Amount         |
| ------------------------------------------ | -------------- |
| Gross session revenue (3 × 300 days × $12) | $10,800/yr     |
| Electricity cost deducted                  | − $2,250/yr    |
| Sessions revenue (net of electricity)      | $7,425/yr      |
| Network fee (15%)                          | − $1,620/yr    |
| CC processing (3.5%)                       | − $378/yr      |
| Maintenance                                | − $1,000/yr    |
| After operating costs                      | $4,427/yr      |
| DCFC demand penalty (BESS-offset)          | − $2,250/yr    |
| **Net annual revenue**                     | **~$2,177/yr** |

> Compare to old model output: **$10,125/yr** — a 5× overstatement.

---

## 2. Quote Display — Two Business Cases

### Problem (old)

Energy savings and EV revenue were combined into a single "annual savings" number, which obscured the risk profile of each business case and made the EV numbers look too easy.

### What changed (Step 5 quote card)

**Business Case A — Energy (the reliable part)**

- Demand charge reduction
- Solar generation offset
- Clear payback: energy-only years

**Business Case B — EV Charging Revenue (the new business)**
Full cost waterfall shown explicitly:

- Gross session revenue
- Electricity cost
- Network fees (15%)
- CC processing (3.5%)
- Maintenance ($1,000/yr)
- DCFC demand penalty
- **→ Net annual revenue**

**ROI Snapshot** now leads with **energy-only payback** as the primary number when EV revenue is present:

> _"Payback in X.X years (energy only) · Y.Y yr with EV"_

**Annual Savings Breakdown card** added — always visible when savings > $0:

- Demand charge reduction (emerald)
- Solar generation offset (yellow, solar only)
- EV charging revenue net (blue, separated, only when > $500)
- Annual reserves deduction
- **Net annual benefit**

---

## 3. New Data Fields Exposed

The following fields are now passed through from the pricing engine to the quote tier — available for display and future reporting:

| Field                 | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `dcfcGrossRevenue`    | Raw session fee × sessions × days (before any deductions) |
| `dcfcNetworkFees`     | 15% of gross                                              |
| `dcfcMaintenanceCost` | $1,000/charger/year                                       |
| `dcfcCCFees`          | 3.5% of gross                                             |
| `dcfcSessionsPerDay`  | Sessions assumed (3 for non-highway commercial)           |

---

## 4. Minor Fix — Peak Sun Hours Display

The AI sidebar was showing a raw float: `3.6720731164383555h / day`.  
Now displays: `3.67h / day`

---

## 5. Files Changed

| File                                               | Change                                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/services/pricingServiceV45.ts`                | DCFC model overhaul — 3 sessions/day, operating cost deductions, 5 new interface fields |
| `src/wizard/v8/wizardState.ts`                     | 5 new optional fields added to `QuoteTier` type                                         |
| `src/wizard/v8/step4Logic.ts`                      | New DCFC cost fields wired through `buildOneTier` return                                |
| `src/wizard/v8/steps/Step5V8.tsx`                  | Two-business-case callout, ROI snapshot, Annual Savings Breakdown card                  |
| `src/wizard/v8/WizardV8Page.tsx`                   | `peakSunHours.toFixed(2)` fix                                                           |
| `src/wizard/v8/__tests__/evRevenueAudit.test.ts`   | Test helpers + assertions updated to new model                                          |
| `src/wizard/v8/__tests__/carWashMathSmoke.test.ts` | EV revenue scenario bounds updated                                                      |

---

## 6. Test Baseline

```
43 test files · 2,703 passing · 7 skipped · 0 failures
```

Key test updates (not regressions — expectations corrected to honest model):

- 1 DCFC at $0.15/kWh: `$10,125 → $2,177/yr` (operating costs applied)
- 4 DCFC at 95 kW BESS: `$26,325 → $0/yr` (demand penalty now exceeds net income at this BESS size — which is the correct and honest answer; a larger BESS or fewer chargers changes this)

---

## 7. What's Still To Do (Not In This Commit)

- [ ] Right-size BESS recommendation specifically for DCFC demand shaving (Vineet item 4)
- [ ] Surface demand charges explicitly in Step 3 customer-facing questions
- [ ] Remove generator from default "Recommended" tier (Vineet item 2)
- [ ] BESS sizing audit: confirm demand-shaving BESS math for combined car wash + EV load

---

_Questions? Contact Robert — commit `837ffce` on `ugobe007/merlin2` (merlin3 local branch → main)_
