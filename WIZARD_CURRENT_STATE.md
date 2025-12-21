# Wizard Current State & Consolidation Plan

**Date**: December 2025  
**Status**: Needs Consolidation & Performance Fix Completion

---

## 🎯 CURRENT ACTIVE WIZARD

**Name**: `StreamlinedWizard` (also referred to as "Smart Wizard" in UI)  
**File**: `src/components/wizard/StreamlinedWizard.tsx` (1,601 lines)  
**Hook**: `useStreamlinedWizard` (1,510 lines)  
**Entry Points**: 
- Main site: `BessQuoteBuilder.tsx` → `StreamlinedWizard`
- Direct: `/wizard` route
- Verticals: HotelEnergy, CarWashEnergy, EVChargingEnergy → `StreamlinedWizard`

---

## 📊 CURRENT FLOW (5 Steps)

Based on `StreamlinedWizard.tsx`:

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| 0 | `WelcomeLocationSection` | ✅ Active | Location selection |
| 1 | `Step1LocationGoals` | ✅ Active | Location + Goals (new) |
| 2 | `Step2IndustrySize` | ✅ Active | Industry selection |
| 3 | `Step3FacilityDetails` | ✅ Active | Custom questions (has performance optimization) |
| 4 | `Step4MagicFit` | ✅ Active | 3-card scenario selection |
| 5 | `QuoteResultsSectionNew` | ✅ Active | Final quote |

**Note**: There's confusion - Step 0 and Step 1 both handle location. Need clarification.

---

## ⚠️ PERFORMANCE OPTIMIZATION STATUS

### ❌ NOT COMPLETE

**`useOptimizedWizardState.ts` exists but is NOT being used**

**Current State**:
- ✅ `Step3FacilityDetails.tsx` has local state optimization (collects answers, calculates once on Continue)
- ❌ `StreamlinedWizard.tsx` still uses `useStreamlinedWizard` hook
- ❌ `useStreamlinedWizard` hook still has old calculation triggers
- ❌ `useOptimizedWizardState` hook exists but is orphaned

**What Needs to Happen**:
1. Replace `useStreamlinedWizard` with `useOptimizedWizardState` in `StreamlinedWizard.tsx`
2. Update all step components to use `updateStepData()` pattern
3. Ensure calculations only run once when transitioning to Step 4 (Magic Fit)

---

## 🔴 WIZARD CONSOLIDATION ISSUES

### Too Many Wizard Files

**Active Step Components** (in use):
- `Step1LocationGoals.tsx`
- `Step2IndustrySize.tsx`
- `Step3FacilityDetails.tsx` (with V3 variant that's not used)
- `Step4MagicFit.tsx`
- `QuoteResultsSectionNew.tsx`
- `WelcomeLocationSection.tsx` (Step 0, duplicates Step 1?)

**Old Step Components** (likely deprecated):
- `IndustrySection.tsx`
- `FacilityDetailsSection.tsx`
- `FacilityDetailsSectionV2.tsx`
- `GoalsSection.tsx`
- `GoalsSectionV2.tsx`
- `GoalsSectionV3.tsx`
- `ConfigurationSection.tsx`
- `ConfigurationComparison.tsx`
- `ScenarioSection.tsx`
- `ScenarioSectionV2.tsx`
- `MagicFitSection.tsx`
- `CompareConfigureSection.tsx`
- `QuoteResultsSection.tsx` (old version)

**Special Components**:
- `Step3FacilityDetailsV3.tsx` (created but not integrated)

**Total**: ~20+ section files, many duplicates/deprecated

---

## 🎨 DESIGN QUALITY REQUIREMENTS

Based on screenshots provided:

### Design Template Elements:

1. **Top Header** (TO BE REMOVED):
   - Hamburger menu + wizard icon
   - Solar opportunity indicators (sun icons)
   - Energy metrics (kWh, kW)
   - Power gap indicator
   - "Savings Scout™" button
   - "Configure system" button
   - Close button

2. **Left Sidebar** (KEEP):
   - Back arrow
   - TrueQuote button (orange)
   - Merlin Energy button (purple)
   - How to Use button (green)

3. **Merlin Panel** (Top of each step):
   - Compact welcome panel
   - Step-specific instructions
   - **Solar/Power widgets should move HERE or just below it**

4. **Main Content** (Apple-like quality):
   - Clean white cards with rounded corners
   - Clear typography hierarchy
   - Color-coded selection buttons
   - Visual feedback for selections
   - Progress indicators
   - Question-based interface

---

## ✅ ACTION ITEMS

### Priority 1: Widget Placement
- [ ] Remove top nav bar from wizard
- [ ] Move solar/power widgets to Merlin panel or just below it
- [ ] Update `FloatingNavWidget.tsx` or remove if not needed

### Priority 2: Performance Fix
- [ ] Complete migration to `useOptimizedWizardState`
- [ ] Remove old calculation triggers from `useStreamlinedWizard`
- [ ] Update all step components to use `updateStepData()` pattern
- [ ] Test that calculations only run once (Step 3 → Step 4 transition)

### Priority 3: Wizard Consolidation
- [ ] Identify which step components are actually in use
- [ ] Delete or archive deprecated components
- [ ] Standardize naming (Step1, Step2, Step3, Step4, Step5)
- [ ] Clarify Step 0 vs Step 1 (location selection)

### Priority 4: Design Quality
- [ ] Review all step components against screenshot quality standards
- [ ] Apply Apple-like design patterns consistently
- [ ] Ensure consistent spacing, typography, button styles
- [ ] Polish panel designs and question/answer displays

---

## 📝 QUESTIONS FOR CLARIFICATION

1. **What should we call the wizard officially?**
   - "Streamlined Wizard" (technical name)
   - "Smart Wizard" (UI name)
   - "Merlin Wizard" (branded name)
   - Something else?

2. **Step 0 vs Step 1 confusion:**
   - `WelcomeLocationSection` (Step 0) - location selection
   - `Step1LocationGoals` (Step 1) - location + goals
   - Which one is actually used? Should we consolidate?

3. **Old components to delete:**
   - Can we delete `IndustrySection`, `FacilityDetailsSection`, `GoalsSection`, etc.?
   - Or are they used in other entry points?

4. **Solar/Power Widgets:**
   - Should they be IN the Merlin panel (as part of the greeting)?
   - Or BELOW the Merlin panel (separate row)?
   - What exact widgets should show? (Solar opportunity, Power gap, Power profile?)

---

## 🚀 RECOMMENDED CONSOLIDATION PLAN

1. **Standardize on Step naming**:
   - Step 1: Location & Goals → `Step1LocationGoals.tsx`
   - Step 2: Industry → `Step2IndustrySize.tsx`
   - Step 3: Facility Details → `Step3FacilityDetails.tsx`
   - Step 4: Magic Fit → `Step4MagicFit.tsx`
   - Step 5: Quote Results → `QuoteResultsSectionNew.tsx` (rename to `Step5QuoteResults.tsx`)

2. **Remove duplicates**:
   - Delete old `IndustrySection`, `FacilityDetailsSection`, `GoalsSection` variants
   - Archive to `_deprecated/` folder for reference

3. **Complete performance optimization**:
   - Finish `useOptimizedWizardState` migration
   - Remove old hook once migration complete

4. **Update design to match template**:
   - Remove top nav bar
   - Integrate widgets into Merlin panel
   - Apply consistent Apple-like design patterns

