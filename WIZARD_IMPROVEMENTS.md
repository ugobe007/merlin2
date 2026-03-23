# Wizard V8 Improvements Plan
**Date:** March 22, 2026
**Objective:** Enhance current WizardV8 with select elements from merlin-energy(1) concept

## Implementation Strategy

### ✅ What We're Keeping (Current V8)
- WizardShellV7 layout with Merlin advisor left rail
- Current step flow and logic
- useWizardV8 state management
- Existing step components structure

### 🎨 What We're Adding (From Concept)

#### 1. **Step 1 (Location) - Google Places Integration**
- **Current**: Basic ZIP input field
- **Enhancement**: 
  - Add Google Places Autocomplete dropdown
  - Show business name suggestions as user types
  - Display selected business card with photo, address, website
  - Auto-detect industry from business type
  - Keep fallback to manual ZIP entry if no match

**Files to modify:**
- `/src/wizard/v8/steps/Step1V8.tsx` - add Places autocomplete
- Consider creating a new component: `/src/wizard/v8/components/PlacesAutocomplete.tsx`

#### 2. **Step 3 (Profile Questions) - Collapsible Sections**
- **Current**: All questions displayed in long list
- **Enhancement**:
  - Group questions by category (Operations, Equipment, Energy Usage)
  - Each category is collapsible with header
  - Show "N questions" count in header
  - Default to first category expanded
  - Add "Industry Default" badges to pre-filled values
  - Add optional "Merlin's Tip" callouts (blue lightbulb icon)

**Files to modify:**
- `/src/wizard/v8/steps/Step3V8.tsx` - restructure with accordions
- Consider creating: `/src/wizard/v8/components/QuestionAccordion.tsx`
- Consider creating: `/src/wizard/v8/components/MerlinTip.tsx`

#### 3. **UI Enhancement Components**

**Industry Default Badge**
```tsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
  <Star className="w-2.5 h-2.5" />
  Industry default
</span>
```

**Merlin's Tip Callout**
```tsx
<div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
    <Lightbulb className="w-3 h-3 text-blue-400" />
  </div>
  <div>
    <span className="text-xs font-bold text-blue-400">Merlin's Tip</span>
    <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{tipText}</p>
  </div>
</div>
```

#### 4. **Question Metadata Enhancement**
Add to wizardData or step4Logic:
- `category`: "Operations" | "Equipment" | "Energy Usage"
- `tip`: Optional helpful explanation text
- `isDefault`: Boolean to show industry default badge

### 📋 Implementation Steps

1. ✅ Create improvement plan document
2. 🔄 Enhance Step1V8 with Google Places autocomplete
3. 🔄 Restructure Step3V8 questions into collapsible categories
4. 🔄 Create reusable UI components (badges, tips)
5. 🔄 Update question metadata with categories and tips
6. 🔄 Test all enhancements in local dev environment

### 🎯 Success Criteria

- Google Places autocomplete works smoothly in Step 1
- Business lookup auto-detects industry correctly
- Step 3 questions grouped logically (3-4 categories max)
- Each category defaults to collapsed except first one
- Industry default badges appear on pre-filled values
- Merlin's Tip callouts provide helpful context
- All existing functionality remains intact
- No breaking changes to wizard flow

### 📝 Notes

- Keep existing WizardShellV7 layout (don't replace with sidebar concept)
- The "sidebar" from concept is already achieved by Merlin advisor rail
- Focus on incremental improvements, not wholesale rewrite
- Maintain compatibility with existing useWizardV8 hook
- Consider performance: lazy load Places API, minimize re-renders

---

**Next Action:** Begin implementation with Step 1 Google Places integration
