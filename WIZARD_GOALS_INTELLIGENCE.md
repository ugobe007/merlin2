# 🎯 Wizard Goals Intelligence System

**Created:** February 10, 2026  
**Status:** ✅ Production-ready  
**Location:** Step 1B (Goals Modal) → Step 4 (MagicFit)

## Overview

User-selected energy goals now **directly influence** system sizing and tier recommendations. This creates a personalized experience where the wizard adapts to what the user cares about most.

---

## How Goals Affect System Sizing

### Goal: **Lower Energy Bills** 💰

**User Intent:** Minimize monthly electricity costs, fast payback

**System Adjustments:**
- BESS: **0.9x** (10% smaller) - Cost-optimized
- Solar: **1.1x** (10% larger) - Maximize self-consumption savings
- Generator: **1.0x** (no change)
- Duration: **1.0x** (4 hours)

**Recommended Tier:** **STARTER** (fast payback focus)

**Why:**
- Smaller battery = lower upfront cost
- More solar = higher savings from avoided grid purchases
- Targets 3-5 year payback vs 5-8 years

**Example:**
- Base: 1,000 kW BESS + 500 kW Solar
- With goal: 900 kW BESS + 550 kW Solar ← More ROI-focused

---

### Goal: **Backup Power** 🔋

**User Intent:** Stay operational during outages, critical load protection

**System Adjustments:**
- BESS: **1.15x** (15% larger) - More backup capacity
- Solar: **1.0x** (no change)
- Generator: **1.2x** (20% larger) - Enhanced backup
- Duration: **1.5x** (6 hours) ← Key differentiator

**Recommended Tier:** **PERFECT FIT** (balanced backup + cost)

**Why:**
- Longer duration = ride through multi-hour outages
- Larger generator = extended operation
- Balances backup needs with budget

**Example:**
- Base: 1,000 kW BESS × 4 hours = 4,000 kWh
- With goal: 1,150 kW BESS × 6 hours = **6,900 kWh** ← 72% more backup

---

### Goal: **Reduce Carbon Footprint** ♻️

**User Intent:** Meet sustainability targets, ESG reporting, net-zero goals

**System Adjustments:**
- BESS: **1.1x** (10% larger) - Store more renewable energy
- Solar: **1.4x** (40% larger) ← Maximize clean energy
- Generator: **0.7x** (30% smaller) - Minimize fossil fuel backup
- Duration: **1.0x** (4 hours)

**Recommended Tier:** **PERFECT FIT** (balanced green approach)

**Why:**
- Maximize solar generation = reduce grid carbon
- Larger battery = store more solar for evening use
- Smaller/no generator = lower Scope 1 emissions

**Example:**
- Base: 1,000 kW BESS + 500 kW Solar + 750 kW Generator
- With goal: 1,100 kW BESS + **700 kW Solar** + 525 kW Generator

**CO2 Impact:**
- Additional 200 kW solar = ~300 MWh/year clean energy
- Avoids ~200 tons CO2/year (vs grid power)

---

### Goal: **Energy Independence** ⚡

**User Intent:** Control own power supply, grid independence, self-sufficiency

**System Adjustments:**
- BESS: **1.3x** (30% larger) ← Maximum capacity
- Solar: **1.5x** (50% larger) ← Maximum generation
- Generator: **1.3x** (30% larger) ← Full backup capability
- Duration: **1.25x** (5 hours)

**Recommended Tier:** **BEAST MODE** (all-in approach)

**Why:**
- Oversized solar = produce more than you consume
- Large battery = store excess for evening/night
- Oversized generator = backup for extended cloudy periods
- Targets 80-100% grid independence

**Example:**
- Base: 1,000 kW BESS + 500 kW Solar + 750 kW Generator
- With goal: **1,300 kW BESS + 750 kW Solar + 975 kW Generator**

**Independence Metrics:**
- Solar self-consumption: 70-85%
- Grid import reduction: 75-90%
- Can island from grid during peaks

---

### Goal: **Reduce Demand Charges** 🎯

**User Intent:** Lower peak demand penalties, reduce utility demand charges

**System Adjustments:**
- BESS: **1.05x** (5% larger) - Better peak shaving
- Solar: **0.9x** (10% smaller) - Battery-focused approach
- Generator: **1.0x** (no change)
- Duration: **1.0x** (4 hours)

**Recommended Tier:** **PERFECT FIT** (demand-focused)

**Why:**
- Slightly larger battery = clip more peak demand
- Less solar emphasis = more budget for battery power
- 4-hour duration ideal for typical demand charge windows

**Example:**
- Facility: 2,500 kW peak demand, $20/kW demand charge
- Base: 1,000 kW BESS can shave 1,000 kW → Save $20K/month
- With goal: 1,050 kW BESS can shave 1,050 kW → **Save $21K/month**

**Annual Savings:**
- Base: $240K/year demand charge reduction
- With goal: $252K/year ← Extra $12K/year

---

## Multiple Goals = Stacked Effects

Users can select **multiple goals**, which **multiplicatively stack**:

### Example: Backup Power + Energy Independence

```typescript
// Individual modifiers:
backup_power: {
  bessMultiplier: 1.15,
  durationMultiplier: 1.5,
  generatorMultiplier: 1.2
}

energy_independence: {
  bessMultiplier: 1.3,
  solarMultiplier: 1.5,
  generatorMultiplier: 1.3,
  durationMultiplier: 1.25
}

// Stacked result:
bessMultiplier: 1.15 × 1.3 = 1.495 (49.5% larger)
durationMultiplier: 1.5 × 1.25 = 1.875 (7.5 hours)
solarMultiplier: 1.0 × 1.5 = 1.5 (50% more solar)
generatorMultiplier: 1.2 × 1.3 = 1.56 (56% larger)
```

**Result:** Massive system optimized for both reliability AND independence

---

## MagicFit 3-Tier Adjustments

The 3 tiers (STARTER / PERFECT FIT / BEAST MODE) are **further modified** by goals:

| Tier | Base Multiplier | With Goals | Total Range |
|------|----------------|------------|-------------|
| STARTER | 0.75x | × goal mods | 0.68x - 0.98x |
| PERFECT FIT | 1.0x | × goal mods | 0.9x - 1.5x |
| BEAST MODE | 1.4x | × goal mods | 1.26x - 2.1x |

### Example: Energy Independence Goal

- **STARTER:** 0.75 × 1.3 = **0.975x** (nearly full size, fast payback)
- **PERFECT FIT:** 1.0 × 1.3 = **1.3x** (30% oversized)
- **BEAST MODE:** 1.4 × 1.3 = **1.82x** (82% oversized!) 🚀

---

## UI Integration

### Goals Modal (Step 1B)

- User selects 1-5 goals
- Checkmarks show selected goals
- Continue button shows: "Continue with X goals"

### MagicFit Header (Step 4)

- Shows goal-based sizing hints:
  ```
  ✨ Extended duration for reliable backup power
  ✨ Oversized system for true grid independence
  ```

### Tier Cards (Step 4)

- Each tier shows goal-aware tagline:
  - STARTER: "Optimized for fast payback with solar self-consumption"
  - PERFECT FIT: "Balanced backup + cost for your {goals}"
  - BEAST MODE: "All-in system sized for {energy_independence}"

---

## Code Architecture

### Location of Logic

**Step 1B:** `src/components/wizard/v7/steps/GoalsModal.tsx`
- User selects goals
- Goals stored in `state.goals: EnergyGoal[]`

**Step 4:** `src/components/wizard/v7/steps/Step4MagicFitV7.tsx`
- `getGoalBasedMultipliers(goals)` function analyzes goals
- Returns multipliers + recommended tier + hints
- Applied to base sizing before tier generation

**State:** `src/wizard/v7/hooks/useWizardV7.ts`
- `goals: EnergyGoal[]` - Selected goals array
- `goalsConfirmed: boolean` - User completed goals modal
- `toggleGoal(goal)` - Toggle goal selection
- `confirmGoals(confirmed)` - Complete goals modal

### Data Flow

```
Step 1: User enters location
    ↓
Step 1B: Goals Modal (NEW)
    ↓
state.goals = ['backup_power', 'energy_independence']
    ↓
Step 2: Industry selection
    ↓
Step 3: Facility profile (16Q)
    ↓
state.peakLoadKW = 1000 kW (from profile)
    ↓
Step 3.5: Add-Ons Modal
    ↓
state.includeSolar = true
    ↓
Step 4: MagicFit
    ↓
getGoalBasedMultipliers(state.goals) → {
  bessMultiplier: 1.495,
  durationMultiplier: 1.875,
  solarMultiplier: 1.5,
  generatorMultiplier: 1.56
}
    ↓
Apply to base sizing:
  baseBESSKW = 1000 × 1.495 = 1,495 kW
  baseDuration = 4 × 1.875 = 7.5 hours
  baseSolarKW = 500 × 1.5 = 750 kW
    ↓
Generate 3 tiers:
  STARTER: 1,495 × 0.75 = 1,121 kW
  PERFECT FIT: 1,495 × 1.0 = 1,495 kW
  BEAST MODE: 1,495 × 1.4 = 2,093 kW
    ↓
User selects tier → Results page
```

---

## Testing Scenarios

### Test 1: Single Goal (Lower Bills)

1. Enter location: San Francisco, CA
2. Select goals: [lower_bills]
3. Complete profile: Office, 50K sqft
4. Skip add-ons
5. **Expected:** STARTER tier highlighted, solar emphasized

### Test 2: Multiple Goals (Backup + Independence)

1. Enter location: Austin, TX
2. Select goals: [backup_power, energy_independence]
3. Complete profile: Hospital, 200 beds
4. Add solar + generator
5. **Expected:** BEAST MODE highlighted, 7+ hour duration, large solar

### Test 3: No Goals (Skip)

1. Enter location: Denver, CO
2. Skip goals modal
3. Complete profile: Manufacturing, 100K sqft
4. **Expected:** Standard sizing (1.0x multipliers), PERFECT FIT highlighted

---

## Future Enhancements

### Phase 2: Advanced Goal Intelligence

- **Goal Conflicts:** Detect incompatible goals (e.g., lower_bills + energy_independence)
- **Budget Constraints:** Adjust goals based on stated budget
- **Industry Alignment:** Pre-select common goals for industry (hospitals → backup_power)
- **Goal Explanations:** Show financial impact of each goal in modal

### Phase 3: Machine Learning

- **Historical Data:** Train on past projects to refine multipliers
- **Success Metrics:** Track which goal combinations → highest customer satisfaction
- **Dynamic Tuning:** Adjust multipliers based on real-world project outcomes

---

## Impact Metrics

### Before Goals Intelligence (Feb 9, 2026)

- All users got same sizing (1.0x multiplier)
- No personalization based on priorities
- Generic "one size fits all" approach

### After Goals Intelligence (Feb 10, 2026)

- Sizing varies -10% to +100% based on goals
- Duration varies 4-7.5 hours based on needs
- Solar/generator sizing optimized per goals
- 5 distinct user archetypes accommodated

### Expected Business Impact

- **Higher conversion:** Personalized quotes feel "right" to users
- **Better retention:** Systems match actual needs → fewer complaints
- **Upsell opportunity:** BEAST MODE more attractive with energy_independence goal
- **Competitive edge:** "Smart wizard that listens to my goals" vs generic calculators

---

## Maintenance Notes

### Updating Goal Modifiers

To adjust how goals affect sizing, edit `getGoalBasedMultipliers()` in `Step4MagicFitV7.tsx`:

```typescript
// Example: Make backup_power even more conservative
if (goals.includes('backup_power')) {
  modifiers.bessMultiplier *= 1.2; // was 1.15
  modifiers.durationMultiplier *= 1.75; // was 1.5
}
```

### Adding New Goals

1. Add to `EnergyGoal` type in `useWizardV7.ts`
2. Add option to `GOAL_OPTIONS` in `GoalsModal.tsx`
3. Add logic to `getGoalBasedMultipliers()` in `Step4MagicFitV7.tsx`
4. Update tests in `src/wizard/v7/__tests__/`

---

## Documentation

- **Architecture:** See `/src/components/wizard/v7/steps/README.md`
- **State Management:** See `WIZARD_STATE_ARCHITECTURE.md`
- **Goals UX:** See `WIZARD_VNEXT_INTELLIGENCE_RESTORATION.md`

---

**Status:** ✅ Ready for production testing  
**Next:** User acceptance testing + A/B test vs old wizard
