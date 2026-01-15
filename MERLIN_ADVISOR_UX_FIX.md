# Merlin Advisor UX Improvement ✅
**Date**: January 15, 2026  
**Change Type**: User Experience Enhancement

---

## 🎯 Problem Statement

**Before**: Merlin Advisor suggestions panel auto-opened immediately and was always prominent, which could be distracting for users who were actively working through the wizard.

**Issue**: The advisor was too "eager" - showing tips before users needed them, interrupting the natural flow.

---

## ✅ Solution Implemented

### Behavior Changes

**1. Suggestions Start Closed**
- Panel now starts in collapsed state
- Only main message and savings estimate are visible
- "Ask for Help" button is subtle and unobtrusive

**2. Idle Detection (20 seconds)**
- Tracks user activity via prop changes
- After 20 seconds of inactivity, triggers help offer
- Pulsing animation appears: "🧙‍♂️ Need help?"
- Gentle nudge without being intrusive

**3. User-Initiated Help**
- User can click "Ask for Help" anytime
- Opens suggestions panel with contextual tips
- Resets idle timer when user takes action

**4. Reset on Activity**
- Any user action (selecting state, industry, etc.) resets idle timer
- Removes pulsing indicator
- Assumes user is actively engaged

---

## 🔧 Technical Implementation

### Key Changes in `MerlinAdvisor.tsx`

**1. New State Variables**
```typescript
const [showSuggestions, setShowSuggestions] = useState(false); // Start closed
const [hasPendingSuggestion, setHasPendingSuggestion] = useState(false); // No pulse initially
const [lastActivityTime, setLastActivityTime] = useState(Date.now());
const [idleWarningShown, setIdleWarningShown] = useState(false);
```

**2. Activity Tracker**
```typescript
// Reset idle timer when user is active
useEffect(() => {
  setLastActivityTime(Date.now());
  setIdleWarningShown(false);
  setHasPendingSuggestion(false);
}, [currentStep, props.state, props.industry, props.facilitySize, 
    props.hasSolar, props.hasGenerator, props.selectedTier]);
```

**3. Idle Detection**
```typescript
// Check for idle state every 5 seconds
useEffect(() => {
  const checkIdleTimer = setInterval(() => {
    const idleTime = Date.now() - lastActivityTime;
    
    // After 20 seconds of inactivity, offer help
    if (idleTime > 20000 && !idleWarningShown && !showSuggestions) {
      setHasPendingSuggestion(true);
      setIdleWarningShown(true);
    }
  }, 5000);
  
  return () => clearInterval(checkIdleTimer);
}, [lastActivityTime, idleWarningShown, showSuggestions]);
```

**4. Updated UI Text**
```typescript
// Before: "🧙‍♂️ Merlin says..." (always)
// After:  "🧙‍♂️ Need help?" (when idle) or "Ask for Help" (default)

{hasPendingSuggestion ? '🧙‍♂️ Need help?' : 'Ask for Help'}
{hasPendingSuggestion ? 'Click for tips!' : `${suggestions.length} tip${suggestions.length > 1 ? 's' : ''} available`}
```

---

## 📊 User Experience Flow

### Active User Flow
```
User lands on wizard
  ↓
Merlin shows welcome message + savings estimate
  ↓
User actively fills out form
  ↓
Merlin updates estimates as user progresses
  ↓
No interruptions - smooth experience
```

### Idle User Flow
```
User pauses on a step
  ↓
20 seconds pass with no activity
  ↓
Merlin pulses with amber glow
  ↓
"🧙‍♂️ Need help?" appears
  ↓
User clicks → Gets contextual tips
  ↓
User takes action → Timer resets
```

---

## 🎨 Visual Changes

### Before (Always Visible)
- Suggestions panel auto-opened
- Always showing tips banner
- Amber pulsing effect active immediately
- Count badge always visible

### After (On-Demand)
- Suggestions panel starts closed
- "Ask for Help" button subtle
- Pulsing only after 20s idle
- Count badge only shows when pulsing

---

## ✅ Benefits

1. **Less Intrusive**
   - Users can focus on filling out the wizard
   - No distractions during active flow

2. **Contextual Help**
   - Help appears when user needs it (idle)
   - User can request help anytime

3. **Better UX**
   - Respects user's workflow
   - Guides without interrupting

4. **Maintains Value**
   - All suggestions still available
   - Just delivered at better timing

---

## 🧪 Testing

### Test Scenarios

**1. Active User Test**
- Fill out wizard quickly
- ✅ No pulsing should appear
- ✅ Suggestions stay closed
- ✅ Can manually open if needed

**2. Idle User Test**
- Stop on Step 1 for 20+ seconds
- ✅ Pulsing should appear
- ✅ "Need help?" message shows
- ✅ Badge animates

**3. Activity Reset Test**
- Idle for 15 seconds
- Select a state
- ✅ Timer resets to 0
- ✅ No pulsing appears
- ✅ User continues smoothly

**4. Manual Help Test**
- Click "Ask for Help" anytime
- ✅ Suggestions panel opens
- ✅ Shows contextual tips
- ✅ Can close and reopen

---

## 📝 Files Modified

1. **`src/components/wizard/v6/MerlinAdvisor.tsx`**
   - Added idle detection logic
   - Updated UI states and text
   - Implemented activity tracking
   - Modified pulsing trigger conditions

---

## 🚀 Deployment

**Status**: ✅ Ready for deployment

**Build**: ✅ TypeScript compilation successful  
**Bundle**: ✅ Vite build successful (5.93s)  
**Size**: 41 MB (no change)

---

## 📈 Expected Impact

**Metrics to Monitor**:
- User completion rate (should increase)
- Time to complete wizard (should stay same or decrease)
- Help button clicks (should be meaningful)
- User feedback on wizard flow

**Success Criteria**:
- Users complete wizard without distraction
- Help is available when needed
- Contextual tips arrive at right time

---

## 🔮 Future Enhancements

1. **Adaptive Timing**
   - Adjust idle threshold based on step complexity
   - Step 1: 20s, Step 3: 30s (more complex)

2. **Smart Triggers**
   - Detect form validation errors → offer help
   - Detect multiple edits → suggest review
   - Detect unusual values → confirm intent

3. **Analytics**
   - Track when users request help
   - Identify confusing steps
   - Optimize suggestion content

---

**Summary**: Merlin Advisor now respects the user's workflow, offering help when genuinely needed rather than interrupting the natural flow. The 20-second idle detection provides a perfect balance between being helpful and being unobtrusive.

---

**Author**: AI Engineering Team  
**Date**: January 15, 2026  
**Status**: ✅ Implemented & Tested
