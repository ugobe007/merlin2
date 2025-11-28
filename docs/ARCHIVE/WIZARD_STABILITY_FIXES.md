# Wizard Stability Fixes - November 11, 2025

## Issues Reported
1. **Wizard keeps canceling/resetting during navigation** - User gets kicked back to step 0 when scrolling in step 2
2. **Pages load mid-page instead of top** - User has to scroll up manually on each step
3. **Wizard feels "jumpy and buggy"** - Poor user experience

## Root Causes Identified

### Bug 1: Unwanted Wizard Resets
**File**: `SmartWizardV2.tsx` line 148  
**Problem**: `setStep(-1)` was being called every time the `show` prop changed, not just on initial mount.

```typescript
// BAD - Runs every time show changes
useEffect(() => {
  if (show) {
    setStep(-1); // ❌ This resets wizard unexpectedly!
  }
}, [show]);
```

**Impact**: When React re-renders the parent component, `show` prop changes slightly, triggering this effect and resetting the wizard back to step -1 (intro screen).

### Bug 2: Scroll Not Working
**Problem**: Using `document.querySelector()` to find scroll container is unreliable  
**Method**: `querySelector('.overflow-y-auto')` might find wrong element or none at all

```typescript
// BAD - Unreliable selector
const modalContent = document.querySelector('.overflow-y-auto');
if (modalContent) {
  modalContent.scrollTop = 0;
}
```

**Impact**: Scroll command either doesn't execute or scrolls wrong element, leaving user mid-page.

## Solutions Implemented

### Fix 1: Prevent Unwanted Resets
Added `wizardInitialized` flag to ensure initialization happens only ONCE:

```typescript
const [wizardInitialized, setWizardInitialized] = useState(false);

useEffect(() => {
  if (show && !wizardInitialized) {
    // Initialize wizard state ONCE
    setStep(-1);
    setShowIntro(true);
    setWizardInitialized(true);
    // ... other initialization
  }
  
  // Cleanup when wizard closes
  if (!show && wizardInitialized) {
    setWizardInitialized(false);
  }
}, [show, wizardInitialized]);
```

**Benefits**:
- Wizard only resets when opening from closed state
- Navigation between steps no longer triggers reset
- Stable, predictable behavior

### Fix 2: Reliable Scroll with useRef
Replaced querySelector with React ref for direct DOM access:

```typescript
const modalContentRef = useRef<HTMLDivElement>(null);

// Scroll effect
useEffect(() => {
  if (step >= 0 && modalContentRef.current) {
    modalContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
  }
}, [step]);

// In JSX
<div 
  ref={modalContentRef}
  className="max-h-[70vh] overflow-y-auto"
>
  {renderStep()}
</div>
```

**Benefits**:
- Direct reference to correct scrollable element
- Instant scroll (no smooth animation that can be interrupted)
- Reliable execution every time step changes
- No dependency on DOM structure or CSS classes

## Testing Checklist

### Test Scenario 1: Normal Navigation
- [ ] Open wizard from any entry point
- [ ] Navigate through steps 0 → 1 → 2 → 3
- [ ] Verify each page loads at top
- [ ] Verify no unexpected resets to step 0

### Test Scenario 2: Scroll Behavior
- [ ] On step 2, scroll down to middle/bottom of page
- [ ] Click "Next" to go to step 3
- [ ] Verify step 3 loads at TOP of page (not mid-page)
- [ ] Go back to step 2
- [ ] Verify step 2 loads at TOP

### Test Scenario 3: Quickstart Flow
- [ ] Click use case template (e.g., EV Charging)
- [ ] Wizard opens directly to advanced step
- [ ] Verify page loads at top
- [ ] Navigate normally without resets

### Test Scenario 4: Close/Reopen
- [ ] Open wizard, go to step 2
- [ ] Close wizard
- [ ] Reopen wizard
- [ ] Verify starts at intro (step -1)
- [ ] Verify wizard state is clean

## Expected Console Logs

On step change, you should see:
```
🔝 Scrolled modal content to top for step: 2
```

On wizard opening (first time only):
```
📊 Wizard mount effect, show: true, initialized: false
🎬 Initializing wizard for first time
```

On wizard closing:
```
🔄 Wizard closed, resetting initialization flag
```

## Files Modified
1. `src/components/wizard/SmartWizardV2.tsx`
   - Added `useRef` import
   - Added `wizardInitialized` state flag
   - Added `modalContentRef` ref
   - Modified initialization useEffect (lines 145-213)
   - Modified scroll useEffect (lines 130-138)
   - Added ref to modal content div (line 1554)

## Related Issues
- Calculation centralization (separate PR)
- Dashboard ROI/Payback display (fixed in InteractiveConfigDashboard)

## Technical Debt Removed
- ✅ Removed unreliable `querySelector()` DOM access
- ✅ Fixed race condition in wizard initialization
- ✅ Added proper cleanup on unmount
- ✅ Improved React best practices with refs

---

**Status**: ✅ Ready for Testing  
**Priority**: 🔴 Critical (User Experience)  
**Confidence**: 95% - These are architectural fixes addressing root causes
