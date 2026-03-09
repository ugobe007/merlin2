# WizardV8: MagicFit Restructure (March 1, 2026)

## 🎯 Strategic Decision

**User Insight:**

> "Goals really are not needed. We assume savings. The only other question is the quote properly sized for their needs and properly priced."

**Key Points:**

1. ✅ Users always want to **save money** - don't ask them
2. ✅ MagicFit = **3 configurations** optimized for savings (low/medium/high)
3. ✅ Margin policy must be applied to all pricing
4. ✅ Simplify flow - remove redundant "Goals" step

---

## 📊 Old Flow vs New Flow

### OLD (V8 Initial):

```
Step 1: Location + Addon Preferences
Step 2: Industry
Step 3: Questionnaire
Step 4: Goals (REDUNDANT - always "save money")  ← REMOVE
Step 5: Tier Selection (basic cards)
Step 6: Quote Results
```

### NEW (V8 MagicFit):

```
Step 1: Location + Addon Preferences ✅
Step 2: Industry ✅
Step 3: Questionnaire ✅
Step 3.5: Addon Configuration (conditional) 🚧 TODO
Step 4: MagicFit (STARTER/PERFECT FIT/BEAST MODE) 🚧 TODO
Step 5: Quote Results ✅
```

**Benefits:**

- Faster user flow (one less step)
- Clearer value prop (3 savings tiers, not abstract "goals")
- Aligns with user psychology (everyone wants savings)

---

## 🔧 Implementation Changes

### 1. State Structure Updates

**File:** `src/wizard/v8/wizardState.ts`

**Changes:**

```typescript
// OLD:
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;
goalChoice: GoalChoice | null;

// NEW:
export type WizardStep = 1 | 2 | 3 | 3.5 | 4 | 5;
// goalChoice removed - not needed

// Step 4: MagicFit Tiers (was Step 5)
tiersStatus: FetchStatus;
tiers: [QuoteTier, QuoteTier, QuoteTier] | null;
selectedTierIndex: 0 | 1 | 2; // Defaults to 1 (PERFECT FIT)
```

**Actions Removed:**

- `setGoal()` - no longer needed
- `SET_GOAL` action type

**Actions Updated:**

- `setTiers()` - now in Step 4
- `selectTier()` - now in Step 4

---

### 2. Step Files Renumbering

| Old File                | New File                   | Status               |
| ----------------------- | -------------------------- | -------------------- |
| `Step4V8.tsx` (Goals)   | ❌ DELETE                  | Removed              |
| `Step5V8.tsx` (Tiers)   | → `Step4V8.tsx` (MagicFit) | 🚧 Rename + redesign |
| `Step6V8.tsx` (Results) | → `Step5V8.tsx` (Results)  | 🚧 Rename            |

**New File:**

- `Step3_5V8.tsx` - Addon configuration (conditional)

---

### 3. MagicFit Design (Step 4)

**Source:** Copy from `src/components/wizard/v6/steps/Step5MagicFit.tsx`

**Key Design Elements:**

```
┌────────────────────────────────────────────────────────┐
│  🌟 STARTER                                             │
│  Get your feet wet                                      │
│  💰 $15,000/year savings                                │
│  🔋 100 kWh  ☀️ 50 kW  ⚡ 0 chargers                   │
│  Investment: $500K | ITC: $150K | Net: $350K            │
│  Payback: 7.2 years                                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  ⭐ PERFECT FIT                    [BEST VALUE] ✅      │
│  Just right for you                                     │
│  💰 $45,000/year savings                                │
│  🔋 250 kWh  ☀️ 150 kW  ⚡ 4 L2 chargers               │
│  Investment: $1.2M | ITC: $360K | Net: $840K            │
│  Payback: 5.8 years                                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  🏆 BEAST MODE                                          │
│  Go all in                                              │
│  💰 $85,000/year savings                                │
│  🔋 500 kWh  ☀️ 300 kW  ⚡ 8 L2 + 2 DCFC               │
│  Investment: $2.5M | ITC: $750K | Net: $1.75M           │
│  Payback: 6.5 years                                     │
└────────────────────────────────────────────────────────┘
```

**Features:**

- ✅ Bold gradient headlines (STARTER/PERFECT FIT/BEAST MODE)
- ✅ Annual savings as HERO number
- ✅ Equipment strip with emoji icons
- ✅ Full financial summary (Investment, ITC, Net Cost)
- ✅ ROI metrics (Payback, 10-year ROI, 25-year profit)
- ✅ Card hover animations
- ✅ Selected state glow
- ✅ Checkmark animation on selection

---

### 4. Margin Policy Integration

**CRITICAL:** All pricing MUST include Merlin Energy's commercial margin.

**File:** `src/services/marginPolicyEngine.ts` (EXISTS)

**Function:** `applyMarginPolicy()`

**Current Integration:**

- ✅ Already integrated in `truequoteV2Adapter.ts`
- ✅ Called via `generateTrueQuoteV2()`

**Verification Needed:**
Check that `useWizardV8.ts` quote generation calls margin policy:

```typescript
// In generateQuote() or tier building:
import { applyMarginPolicy } from '@/services/marginPolicyEngine';

const result = await calculateQuote({...});  // Base cost from SSOT

// Apply margin policy
const withMargin = applyMarginPolicy({
  lineItems: result.costs.lineItems,
  totalBaseCost: result.costs.baseCostTotal,
  riskLevel: 'standard',
  customerSegment: 'direct',
});

// Use withMargin.sellPriceTotal for customer-facing price
```

**Margin Bands (from marginPolicyEngine.ts):**
| Deal Size | Margin Range | Target |
|-----------|--------------|--------|
| <$500K | 18-25% | 20% |
| $500K-$1.5M | 15-20% | 18% |
| $1.5M-$3M | 10-15% | 12% |
| $3M-$5M | 8-12% | 10% |
| $5M-$10M | 6-9% | 7.5% |
| $10M+ | 2-5% | 3.5% |

---

### 5. Step Flow Logic

**File:** `src/wizard/v8/useWizardV8.ts`

**Update `goToStep()` logic:**

```typescript
const goToStep = useCallback(
  (step: WizardStep) => {
    // Special handling for step transitions

    // After Step 3, check if addon config is needed
    if (step === 4) {
      const needsAddonConfig = state.wantsSolar || state.wantsEVCharging || state.wantsGenerator;

      if (needsAddonConfig) {
        // Go to Step 3.5 (addon config) first
        dispatch({ type: "GO_TO_STEP", step: 3.5 });
        return;
      }
      // Otherwise skip to Step 4 (MagicFit)
    }

    // From Step 3.5, always go to Step 4 (MagicFit)
    if (step === 4 && state.currentStep === 3.5) {
      // Generate tiers with addon configs
      await generateTiers();
    }

    dispatch({ type: "GO_TO_STEP", step });
  },
  [state]
);
```

**Tier Generation:**

```typescript
const generateTiers = useCallback(async () => {
  dispatch({ type: "SET_TIERS_STATUS", status: "loading" });

  try {
    // Generate base quote with addons
    const baseQuote = await calculateQuote({
      storageSizeMW: state.peakLoadKW / 1000,
      durationHours: 4, // Base duration
      location: state.location.state,
      electricityRate: stateData.rate,
      useCase: state.industry,

      // Addons from Step 3.5 (or Step 1 preferences)
      solarMW: state.solarKW / 1000,
      generatorMW: state.generatorKW / 1000,
      generatorFuelType: state.generatorFuelType,
      evChargingKW: state.level2Chargers * 11 + state.dcfcChargers * 150 + state.hpcChargers * 350,
    });

    // Apply margin policy
    const withMargin = applyMarginPolicy({
      lineItems: baseQuote.costs.lineItems,
      totalBaseCost: baseQuote.costs.baseCostTotal,
      riskLevel: "standard",
      customerSegment: "direct",
    });

    // Create 3 tiers (STARTER / PERFECT FIT / BEAST MODE)
    const tiers: [QuoteTier, QuoteTier, QuoteTier] = [
      {
        label: "STARTER",
        multiplier: 0.7, // 70% of base system
        ...baseQuote,
        sellPrice: withMargin.sellPriceTotal * 0.7,
        annualSavings: baseQuote.financials.annualSavings * 0.7,
      },
      {
        label: "PERFECT FIT",
        multiplier: 1.0, // 100% - recommended
        ...baseQuote,
        sellPrice: withMargin.sellPriceTotal,
        annualSavings: baseQuote.financials.annualSavings,
      },
      {
        label: "BEAST MODE",
        multiplier: 1.5, // 150% of base system
        ...baseQuote,
        sellPrice: withMargin.sellPriceTotal * 1.5,
        annualSavings: baseQuote.financials.annualSavings * 1.5,
      },
    ];

    dispatch({ type: "SET_TIERS", tiers });
    dispatch({ type: "SET_TIERS_STATUS", status: "success" });
  } catch (error) {
    dispatch({ type: "SET_TIERS_STATUS", status: "error" });
  }
}, [state]);
```

---

## ✅ Completed

1. ✅ State fields for addon config (solarKW, generatorKW, etc.)
2. ✅ SET_ADDON_CONFIG action + reducer
3. ✅ setAddonConfig() method in useWizardV8
4. ✅ Step 1 addon preference checkboxes

---

## 🚧 TODO

### Priority 1: Critical Path

1. **Remove goalChoice from wizardState.ts**
   - Remove field from WizardState interface
   - Remove from initial state
   - Remove SET_GOAL action type
   - Remove SET_GOAL reducer case
   - Remove setGoal() from WizardActions

2. **Renumber step files**
   - Delete `Step4V8.tsx` (Goals)
   - Rename `Step5V8.tsx` → `Step4V8.tsx`
   - Rename `Step6V8.tsx` → `Step5V8.tsx`

3. **Create Step3_5V8.tsx**
   - Conditional step for addon configuration
   - Only shown if wantsSolar || wantsEVCharging || wantsGenerator
   - Smart defaults based on facility size

4. **Replace Step4V8 with MagicFit design**
   - Copy from `Step5MagicFit.tsx` (V6)
   - Use STARTER/PERFECT FIT/BEAST MODE headlines
   - Equipment strip + full financials
   - Card animations

### Priority 2: Integration

5. **Update step flow logic**
   - Conditional Step 3.5 navigation
   - Auto-generate tiers on Step 4 entry

6. **Ensure margin policy is called**
   - Verify applyMarginPolicy() in tier generation
   - Check sellPriceTotal used in UI (not baseCostTotal)

### Priority 3: Testing

7. **Test full flow**
   - With addons (solar/EV/generator)
   - Without addons (skip Step 3.5)
   - Tier selection persists
   - Margin applied correctly

---

## 🎯 Success Criteria

- [ ] Step 4 (Goals) removed from codebase
- [ ] Step 4 = MagicFit (3 tiers with STARTER/PERFECT FIT/BEAST MODE)
- [ ] Step 5 = Quote results (was Step 6)
- [ ] Addon config shown conditionally (Step 3.5)
- [ ] All pricing includes margin policy
- [ ] Tier selection defaults to PERFECT FIT (index 1)
- [ ] Full flow tested and working

---

**Next Actions:**

1. Complete state cleanup (remove goalChoice)
2. Rename step files
3. Create Step3_5V8.tsx
4. Copy MagicFit design to Step4V8
5. Update navigation logic
6. Verify margin policy integration
