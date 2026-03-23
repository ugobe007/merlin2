# Business Goals Migration to Step 3.5

## What Changed

Moved business intelligence questions (primaryGoal, budgetTimeline) from Step 3 (Facility Profile) to Step 3.5 (Add-ons Configuration) to create better sales flow separation.

## Why

1. **Conceptual Separation**: Step 3 should be technical facility inputs. Step 3.5 is consultative configuration.
2. **Calculator Impact**: These questions have ZERO impact on load calculations
   - `primaryGoal`: Marked as impacting "systemSizing" but actually just sales intelligence
   - `budgetTimeline`: Empty `impactsCalculations: []` array - literally nothing
3. **Sales Flow**: Asking "what do you want" BEFORE showing recommendations makes the advisor more consultative

## Flow Before
```
Step 3 (Profile):
├── Facility questions (roomCount, hotelClass...)
├── Amenities (pool, spa, restaurant...)
├── Energy usage (HVAC, lighting...)
└── Solar section:
    ├── roofArea
    ├── existingSolar
    ├── primaryGoal ← BUSINESS GOAL
    └── budgetTimeline ← BUSINESS GOAL

Step 3.5 (Add-ons):
├── Solar capacity slider
├── Generator capacity slider
└── EV charger configuration
```

## Flow After
```
Step 3 (Profile):
├── Facility questions (roomCount, hotelClass...)
├── Amenities (pool, spa, restaurant...)
├── Energy usage (HVAC, lighting...)
└── Solar section:
    ├── roofArea
    └── existingSolar

Step 3.5 (Add-ons):
├── Business Goals Screen:
│   ├── primaryGoal (4 button cards with icons)
│   └── budgetTimeline (4 timeline buttons)
├── [Continue to Configuration]
└── Then addons:
    ├── Solar capacity slider (influenced by primaryGoal)
    ├── Generator capacity slider (emphasized for backup-power goal)
    └── EV charger configuration
```

## Implementation Details

### Files Modified

1. **src/wizard/v8/steps/Step3_5V8.tsx**
   - Added state: `primaryGoal`, `budgetTimeline`, `goalsConfirmed`
   - Added business goals UI section (shows FIRST before addons)
   - Updated configuration summary to show selected goal
   - Conditional rendering: business goals → then addon configs

2. **src/data/hotel-questions-complete.config.ts**
   - Removed `primaryGoal` question object
   - Removed `budgetTimeline` question object
   - Array closes correctly after `solarCapacityKW`

### State Management

Business goals are saved to `state.step3Answers` to maintain backward compatibility:

```typescript
actions.setStep3Answers({
  ...state.step3Answers,
  primaryGoal,
  budgetTimeline,
});
```

This means:
- Existing wizard state code doesn't break
- Values are accessible from any step
- Could be moved to dedicated state keys later

### UI Design

**Primary Goal** (2x2 grid):
- 💰 Cost Savings - "Lower energy bills"
- 🔋 Backup Power - "Prevent downtime"
- 📉 Peak Shaving - "Reduce demand charges"
- 🌍 Sustainability - "Go green"

**Timeline** (1x4 horizontal):
- 🚀 Immediate
- 📅 6 Months
- 📆 12 Months
- 🔍 Just Exploring

**Visual States**:
- Selected: emerald/cyan border, background glow, shadow
- Unselected: slate borders, hover state
- Button cards match addon configuration style

### Configuration Summary Enhancement

After goals are confirmed, the summary banner shows:
```
🧙‍♂️ Your Configuration
Beverly Hills • Hotel • 247 kW peak • Goal: 💰 Cost Savings
                                      ^^^^^^^^^^^^^^^^^^^^^^^^
                                      NEW!
```

## Future Enhancements

1. **Goal-Influenced Recommendations**:
   - `backup-power` → emphasize generator, show higher capacity defaults
   - `sustainability` → increase solar default to 100-150% of daytime load
   - `peak-shaving` → optimize BESS discharge strategy in quote
   - `cost-savings` → focus on ROI metrics in results

2. **Timeline-Based Sales Intelligence**:
   - "Immediate" → flag for sales team priority follow-up
   - "Exploring" → longer email nurture sequence

3. **Progressive Goal Refinement**:
   - Step 3.5: High-level goal selection
   - Step 5 (MagicFit): Show how each tier addresses the goal
   - Step 6 (Quote): Highlight ROI/resilience/sustainability metrics based on goal

## Testing Checklist

- [ ] Step 3 loads without primaryGoal/budgetTimeline questions (hotel industry)
- [ ] Step 3.5 shows business goals screen BEFORE addon configuration
- [ ] Selecting goals and clicking "Continue" reveals addon config
- [ ] Selected goal appears in configuration summary banner
- [ ] Goal values saved to `state.step3Answers.primaryGoal` and `budgetTimeline`
- [ ] Wizard flow continues normally to Step 5 (MagicFit)
- [ ] No TypeScript errors
- [ ] Other industries (datacenter, hospital) unaffected

## Rollout Notes

Only **hotel** config had these questions in the "solar" section. Other industries:
- **Datacenter**: No primaryGoal/budgetTimeline
- **Hospital**: No primaryGoal/budgetTimeline  
- **Car Wash**: To be verified (likely different question IDs)

If other industries also have these questions, they should be removed following the same pattern.

---

**Created**: January 2025  
**Status**: ✅ Implemented (hotel config)  
**Next**: Test in browser, verify wizard flow, consider expanding to other industries
