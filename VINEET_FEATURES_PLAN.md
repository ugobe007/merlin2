# Vineet Features Implementation Plan
## Date: January 4, 2026

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
