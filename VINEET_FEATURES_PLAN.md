# Vineet Features Implementation Plan
## Date: January 4, 2026

---

## 🧙 MERLIN ADVISOR "CONCIERGE" ENHANCEMENT - January 13, 2026

### The Request
Vineet wants the Merlin Advisor to act like a concierge and help users understand their solar/EV options earlier. He suggested splitting Step 1 (Location + Goals) into Step 1 and Step 1.5.

### Our Recommendation: DON'T Split the Steps

**Why splitting would be problematic:**

| Issue | Impact |
|-------|--------|
| Step renumbering | All 6 steps become 7 steps - header, footer, progress bar, URL routing all change |
| Code changes | Every `currentStep` reference needs updating |
| Test changes | All test files reference step numbers |
| UX regression | Users see more steps = feels longer |
| No real benefit | Goals don't need a separate step - they work fine in the current layout |

**Why we CAN'T show specific solar/EV sizing in Step 1:**

| Data Point | Available at Step 1? | Why It Matters |
|------------|---------------------|----------------|
| Sun hours / Solar grade | ✅ Yes | From location |
| Electricity rate | ✅ Yes | From state data |
| User's goals | ✅ Yes | From goal cards |
| **Industry type** | ❌ No | Step 2 |
| **Facility size/details** | ❌ No | Step 3 |
| **Actual load profile** | ❌ No | Step 3 |

Without industry + facility details, any kW/$ numbers would be guesses:
- A 100-room hotel in Nevada needs ~400 kW solar
- A 4-bay car wash in Nevada needs ~50 kW solar
- A data center in Nevada might need 2 MW solar

Same location, wildly different needs. Showing numbers in Step 1 = misleading.

### Our Solution: Enhanced MerlinGuide "Concierge" ✅ IMPLEMENTED

Instead of splitting steps, we enhanced the MerlinGuide to be more conversational and forward-looking:

**What MerlinGuide now does:**

1. **Goal-Aware Messaging** - Changes message based on selected goals + location
2. **Dynamic Tips** - Tips change based on what user selected
3. **Goal Preview Section** - Shows benefits + "coming attractions" for each goal
4. **Teases Next Steps** - "We'll size your solar in Step 4" without making promises

**Example Messages:**

| User State | Merlin Says |
|------------|-------------|
| No location, no goals | "I'm Merlin, your energy advisor. Let's find the perfect solution..." |
| Location set, no goals | "Nevada has great energy potential! Now tell me your goals..." |
| 1 goal selected | "Good start! Select 1 more goal so I can tailor your solution." |
| 2+ goals + NV + high sun | "Great choices! Based on your goals, I'm already planning your solar + BESS strategy for NV." |

**Goal-Specific Dynamic Tips:**

| Goal Selected | Tip Shows |
|--------------|-----------|
| `reduce_costs` + high rates | "With NV's high rates ($0.12/kWh), BESS pays for itself fast!" |
| `sustainability` + good sun | "NV gets 6.4 hrs/day of sun - solar will crush your carbon footprint!" |
| `backup_power` | "We'll size your backup system in Step 4 based on your critical loads." |
| `generate_revenue` | "I'll show you grid services and arbitrage opportunities in Step 4!" |

**New Goal Preview Section:**
```
📋 Your Goals Preview:
✓ Cut 20-40% off energy bills — I'll calculate exact savings in Step 5
✓ 8-24 hours backup during outages — We'll size your backup in Step 4
✓ Eliminate 30-50% of demand charges — BESS handles this automatically
```

### Why This Is Better

| Approach | Pros | Cons |
|----------|------|------|
| **Split Step 1 → 1 + 1.5** | Goals get dedicated screen | 7 steps feels longer, code churn, can't show real numbers anyway |
| **Enhanced MerlinGuide** ✅ | Concierge feeling, forward-looking, no code churn, accurate promises | Requires creative messaging |

**Key Principle:** We give users the feeling of being guided and understood WITHOUT making promises we can't keep. Actual calculations happen in Step 4/5 where we have the data.

### Files Changed
- `src/components/wizard/v6/MerlinGuide.tsx` - Added goal awareness, dynamic messaging
- `src/components/wizard/v6/steps/Step1Location.tsx` - Passes goals + location data to MerlinGuide

---

## ✅ WORKFLOW AUDIT - January 13, 2026

### Architecture Verified - All Links Working

**The TrueQuote SSOT Flow:**
```
WizardV6.tsx (state management + bufferService auto-save)
   ↓
Step5MagicFit.tsx (calls generateQuote)
   ↓
@/services/merlin/index.ts (public API)
   ↓
MerlinOrchestrator.ts (translateWizardState → MerlinRequest)
   ↓
TrueQuoteEngineV2.ts (processQuote - runs all calculators)
   ├── loadCalculator.ts
   ├── bessCalculator.ts
   ├── solarCalculator.ts
   ├── generatorCalculator.ts
   ├── evCalculator.ts
   └── financialCalculator.ts
   ↓
MagicFit.ts (generateMagicFitProposal - 3 tier options)
   ↓
proposalValidator.ts (authenticateProposal)
   ↓
TrueQuoteAuthenticatedResult (returned to Step5)
   ↓
Step5MagicFit → updateState({ calculations: { base, selected } })
   ↓
Step6Quote.tsx (displays results)
```

### Type Mismatch FIXED

| Issue | Location | Fix Applied |
|-------|----------|-------------|
| Flat vs nested `calculations` | Step5MagicFit.tsx | ✅ Now writes `{ base, selected }` structure |
| `federalITCRate` read from wrong source | Step5MagicFit.tsx | ✅ Now reads from `base.financials` |
| `quoteId` read from `selected` | Step6Quote.tsx | ✅ Now reads from `base.quoteId` |
| `utilityRate/demandCharge` read from `selected` | Step6Quote.tsx | ✅ Now reads from `base` |
| `pricingSources` read from `selected` | Step6Quote.tsx | ✅ Now reads from `base` |
| `bessKW/bessKWh` read flat | trueQuoteMapper.ts | ✅ Now reads from `calculations.selected.*` |

### Buffer Service Status
- ✅ Auto-save working (1s debounce)
- ✅ Immediate save on step change
- ✅ Save on beforeunload
- ✅ Migration support for old buffers
- ⚠️ Supabase backup: TODO (placeholder implemented)

### ValueTicker Flow
- ✅ Reads from `calculations.base.*` for load data
- ✅ Reads from `calculations.selected.*` for tier data
- ✅ Falls back gracefully when calculations not yet available

### Build Status
- 105 TypeScript errors (down from 115)
- Remaining errors are pre-existing `useCaseData` type issues
- Core workflow types are now correctly aligned

---

## Feature 1: EV Charging - Recommended vs Customize Flow

### Current State:
- YES/NO toggle exists ✅
- When YES: Shows 3 sliders (L2, DCFC, Ultra-Fast)

### Vineet's Request:
- YES → then choose "Recommended" OR "Customize"
- If "Recommended": Show 3 preset options (calculated from evCalculator)
- If "Customize": Show current sliders
- Recommended grays out Customize and vice versa

### Implementation:
1. Add `evMode: 'recommended' | 'customize'` state
2. Add `evPreset: 'basic' | 'standard' | 'premium'` state  
3. Create 3 preset tiers from evCalculator:
   - Basic: baseChargers (mostly L2)
   - Standard: baseChargers * 1.5 (mixed)
   - Premium: baseChargers * 2 (more DCFC/Ultra)
4. When "Recommended" selected, show 3 clickable cards
5. When "Customize" selected, show current sliders

### SSOT Compliance:
- Presets calculated from INDUSTRY_EV_CONFIG in evCalculator.ts ✅
- No new hardcoded values

---

## Feature 2: Generator - 4 Options (Fuel × Coverage)

### Current State:
- YES/NO toggle exists ✅
- Diesel/Natural Gas toggle exists ✅
- Single size slider

### Vineet's Request:
- Show 4 options: Standard × Diesel, Standard × NG, Full × Diesel, Full × NG
- Or: First pick Diesel/NG, then show 3 recommendations for that fuel

### Recommended Implementation (Option B - cleaner UX):
1. Keep Diesel/NG toggle at top (flashing until selected)
2. After fuel selected, show 3 tier cards:
   - Standard Backup (criticalLoadPercent from config)
   - Enhanced Backup (criticalLoadPercent * 1.5)
   - Full Backup (100% of peak demand)
3. Add "Customize" option with slider

### SSOT Compliance:
- Use criticalLoadPercent from INDUSTRY_GENERATOR_CONFIG ✅
- Costs from GENERATOR_CONSTANTS ✅
- High-risk states from generatorCalculator.ts ✅

---

## Feature 3: MerlinGuide Sticky Positioning

### Current State:
- MerlinGuide component exists
- May scroll off screen

### Vineet's Request:
- Always visible regardless of scrolling
- Visible on every step

### Implementation:
1. Add `position: fixed` with `bottom-6 right-6`
2. Add `z-index: 50` to stay above content
3. Ensure it's rendered at App level or in each Step

### Files to Check:
- src/components/wizard/v6/MerlinGuide.tsx
- Each Step component's render

---

## Implementation Order:
1. EV Recommended/Customize (most visible change)
2. Generator 4-tier options
3. MerlinGuide positioning

## Rules Checklist:
- [ ] SSOT: All values from calculators/constants
- [ ] TrueQuote: No duplicate calc logic
- [ ] Wizard: State flows correctly
- [ ] Clean: Remove old code
- [ ] Database: No schema changes needed
