# Step 2 Navigation File Flow

## When User Clicks "Continue" (Right Arrow) on Step 2:

### 1. **User Interaction**
   - **File**: `src/components/wizard/shared/FloatingNavigationArrows.tsx`
   - **Line**: 53 - `onClick={onForward}`
   - **Action**: User clicks the right arrow button

### 2. **Step 2 Component Handler**
   - **File**: `src/components/wizard/sections/Step2IndustrySize.tsx`
   - **Line**: 565 - `onForward={handleContinue}`
   - **Function**: `handleContinue()` (lines 507-526)
   - **Actions**:
     - Saves size, solar, and EV data to `wizardState`
     - Calls `onContinue()` prop

### 3. **StreamlinedWizard Callback**
   - **File**: `src/components/wizard/StreamlinedWizard.tsx`
   - **Line**: 348-353 - `onContinue` callback
   - **Actions**:
     - Calls `wizard.completeSection('industry')`
     - Calls `wizard.advanceToSection(2)`

### 4. **Wizard Hook - Section Navigation**
   - **File**: `src/components/wizard/hooks/useStreamlinedWizard.ts`
   - **Line**: 1033-1044 - `advanceToSection()` function
   - **Actions**:
     - Sets `isTransitioning = true`
     - Scrolls to top
     - After 150ms: Sets `currentSection = 2`
     - After 100ms: Sets `isTransitioning = false`

### 5. **StreamlinedWizard Renders Step 3**
   - **File**: `src/components/wizard/StreamlinedWizard.tsx`
   - **Line**: 357-373 - `Step3FacilityDetails` component
   - **Condition**: `isHidden={wizard.currentSection !== 2}`
   - **Result**: When `currentSection === 2`, Step3FacilityDetails is shown

### 6. **Step 3 Component Renders**
   - **File**: `src/components/wizard/sections/Step3FacilityDetails.tsx`
   - **Line**: 199 - `Step3FacilityDetails` function component
   - **Features**:
     - Shows `MerlinGreeting` component (line 773)
     - Shows facility questions
     - Shows collapsible bottom estimate bar

---

## Expected Flow:
```
User clicks right arrow
  ↓
FloatingNavigationArrows.tsx (onClick)
  ↓
Step2IndustrySize.tsx (handleContinue)
  ↓
StreamlinedWizard.tsx (onContinue callback)
  ↓
useStreamlinedWizard.ts (advanceToSection)
  ↓
StreamlinedWizard.tsx (renders Step3FacilityDetails)
  ↓
Step3FacilityDetails.tsx (displays Step 3)
```

---

## If AdvancedConfigModal Opens Instead:

This would mean `onOpenAdvanced` is being called somewhere. Check:

1. **File**: `src/components/wizard/StreamlinedWizard.tsx`
   - **Line**: 352 - `onOpenProQuote={onOpenAdvanced}`
   - **Note**: This prop is passed to Step2IndustrySize but should NOT be called by the continue button

2. **File**: `src/components/modals/ModalManager.tsx`
   - **Line**: 301-312 - `onOpenAdvanced` callback
   - **Action**: Closes wizard and opens AdvancedConfigModal

3. **Check for any buttons in Step2IndustrySize that call `onOpenProQuote`**
   - Currently: No buttons in Step2IndustrySize call this prop

---

## Debug Console Logs:

When working correctly, you should see:
1. `🎯 [Step2IndustrySize] handleContinue called`
2. `🎯 [Step2IndustrySize] Calling onContinue to advance to Step 3 (Facility Details)`
3. `🎯 [StreamlinedWizard] Step 2 onContinue called - advancing to Section 2 (Facility Details)`
4. `🎯 [StreamlinedWizard] Current section after advance: 2`

If AdvancedConfigModal opens, you would see:
- `🔥 ModalManager: onOpenAdvanced called`
- `🔥 Setting showAdvancedQuoteBuilderModal to true`

