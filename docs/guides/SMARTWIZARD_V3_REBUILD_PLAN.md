# SmartWizard V3 Rebuild Plan
## Based on V2's Proven Architecture

## PROBLEM ANALYSIS

### What V3 Got Wrong:
1. **Step 3 is confusing** - Just shows battery + basic solar/EV toggles
2. **No grid reliability question** - Critical for recommendations
3. **Location & Utility separated** - Should be combined (they're related)
4. **No intelligent recommendations** - V2 showed options, not band-aids
5. **Steps 5 & 6 broken** - Route/path issues

### What V2 Did Right:
1. **Automatic calculation** - useEffect watches answers, calculates immediately
2. **Combined context** - Location + Pricing together (Step 4)
3. **Rich renewables step** - Solar, Wind, Generators, EV all in one place (Step 3)
4. **Grid connection captured** - Part of baseline calculation
5. **Shows preview during questions** - User sees battery size as they answer

## V2 ARCHITECTURE (PROVEN WORKING):

```
Step -1: Intro
Step 0: Industry Template Selection
Step 1: Use Case Questions
        → Calculates baseline AUTOMATICALLY via useEffect
        → Shows power preview on the page
        → Grid connection determined from answers
Step 2: Battery Configuration
        → Shows calculated values
        → User can adjust if needed
        → Simple, clear
Step 3: Add Renewables **[THE MAGIC STEP]**
        → Solar configuration (with space calculator)
        → EV chargers (multiple levels)
        → Wind turbines
        → Backup generators
        → AI recommends based on:
          * Grid reliability (from baseline)
          * Building goals (save money, backup, sustainability)
          * Peak demand
Step 4: Location & Pricing **[COMBINED]**
        → Location selection
        → Electricity rate
        → Both affect calculations together
Step 5: Quote Summary
        → Equipment breakdown
        → Financials
        → Export options
```

## V3 ARCHITECTURE (CURRENTLY BROKEN):

```
Step -1: Intro
Step 0: Use Case Selection
Step 1: Questions
Step 2: Solar & EV Configuration **[TOO SIMPLE]**
        → Only battery + basic toggles
        → No context, no recommendations
        → Missing: Grid reliability
        → Missing: Wind, Generators
Step 3: Location **[SEPARATED]**
Step 4: Power Gap Resolution **[HAPPENS TOO LATE]**
Step 5: Quote **[BROKEN ROUTES]**
Step 6: Complete **[BROKEN ROUTES]**
```

## ROOT CAUSES:

1. **Architecture Deviation**: V3 split things that should be together
2. **Missing Grid Question**: No grid reliability captured
3. **Premature Abstraction**: Tried to "simplify" V2's proven Step 3
4. **Route Issues**: Steps 5-6 have incorrect paths/names

## FIX STRATEGY:

### Option A: Adopt V2 Architecture Exactly
- Keep V2's step flow
- Keep V2's Step3_AddRenewables (the magic step)
- Keep V2's combined Location+Pricing
- Fix only the bugs, don't redesign

### Option B: Fix V3 to Match V2 Logic
- Merge Step 2 & 4 into rich configuration step
- Add grid reliability question to Step 1
- Combine Location + Rate into one step
- Fix Step 5-6 routes

## RECOMMENDATION: **Option A - Adopt V2 Architecture**

### Why?
- V2 is proven working
- V2 has the "magic" the original Claude AI built
- V2 handles complex cases (grid reliability, multiple power sources)
- V2's UX was validated with users
- Less risky than continuing V3 "fixes"

### Implementation:
1. **Restore V2's step components** to V3
2. **Use V3's cleaner hook architecture** (useSmartWizard)
3. **Keep V2's automatic useEffect calculation**
4. **Keep V2's Step3_AddRenewables** (with recommendations)
5. **Keep V2's combined Location+Pricing**

## CRITICAL FIXES NEEDED:

### 1. Grid Reliability Question
**Where**: Add to baseline calculation in Step 1
**Options**: 
- Reliable grid (utility rarely fails)
- Unreliable grid (frequent outages)
- No grid (off-grid)

### 2. Step 3 Rebuild
**Current**: Battery + basic solar/EV
**Should be**: Full power source configuration
- Battery (calculated, adjustable)
- Solar (with space calculator, AI recommendations)
- Wind (if applicable)
- Generators (if grid unreliable OR user wants backup)
- EV chargers (multiple types)
- **AI Recommendations**: Based on goals, grid, budget

### 3. Combine Location + Rate
**Current**: Separate steps
**Should be**: One step (they're related)
- Location affects: Weather, incentives, utility rates
- Rate affects: Savings calculations

### 4. Fix Routes for Steps 5-6
**Issue**: Incorrect component imports/paths
**Fix**: Verify Step5_QuoteSummary and QuoteCompletePage imports

## NEXT ACTIONS:

1. **Audit V2 vs V3 differences** - Document what changed
2. **Test V2 end-to-end** - Verify it still works
3. **Port V2's working steps to V3** - Keep V3's clean architecture, use V2's UX
4. **Add grid reliability question** - Critical missing piece
5. **Test with real user scenario** - 50K sq ft office, save money goal

## SUCCESS CRITERIA:

✅ User completes wizard without confusion
✅ Grid reliability captured
✅ Intelligent recommendations shown (not band-aids)
✅ Location + Rate combined logically
✅ Quote generates successfully
✅ All 6 steps work end-to-end
✅ Math is correct (baseline calculations)
