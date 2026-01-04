# State Persistence Audit

**Date:** January 2, 2026  
**Issue:** Data not persisting or being corrupted through wizard process

---

## Current State Management

### Architecture

1. **WizardV6.tsx**
   - Uses React `useState` for state management
   - State stored in memory only (no localStorage/sessionStorage)
   - `updateState` uses shallow merge: `setState(prev => ({ ...prev, ...updates }))`

2. **Step3Details.tsx**
   - Updates state via: `updateState({ useCaseData: { ...state.useCaseData, [fieldName]: value } })`
   - Spreads existing `useCaseData` and updates specific field

3. **Step3HotelEnergy.tsx**
   - Has **local state** (`answers`) initialized from `state.useCaseData`
   - Syncs back via `updateState({ useCaseData: merged })`
   - Potential sync issues if component re-renders

---

## Potential Issues

### 1. ⚠️ Shallow Merge Issue

**Problem:** `updateState` does shallow merge:
```typescript
setState(prev => ({ ...prev, ...updates }))
```

If `updates` contains nested objects, this is fine, BUT if two updates happen simultaneously, one might overwrite the other.

**Example:**
```typescript
// Update 1: User changes roomCount
updateState({ useCaseData: { ...state.useCaseData, roomCount: 450 } })

// Update 2 (happens before state updates): User changes hotelCategory
updateState({ useCaseData: { ...state.useCaseData, hotelCategory: 'upscale' } })
// This might overwrite roomCount if state hasn't updated yet!
```

**Fix:** Use functional update with deep merge or ensure updates are batched.

---

### 2. ⚠️ Step3HotelEnergy Local State

**Problem:** Step3HotelEnergy has local `answers` state that might get out of sync:

```typescript
const [answers, setAnswers] = useState<Record<string, any>>(state.useCaseData || {});

// Syncs back, but what if state.useCaseData changes from parent?
useEffect(() => {
  // ... sync logic
  updateState({ useCaseData: merged });
}, []);
```

**Issues:**
- Local state initialized once on mount
- If `state.useCaseData` changes from outside, local state doesn't update
- Sync only happens in `useEffect` on mount
- If user changes answers, local state updates, but sync might not happen immediately

**Fix:** Remove local state, use `state.useCaseData` directly (like Step3Details does).

---

### 3. ⚠️ No Persistence

**Problem:** State is lost on:
- Page refresh
- Browser back/forward navigation
- Component unmount/remount
- Browser crash

**Fix:** Add localStorage/sessionStorage persistence.

---

### 4. ⚠️ State Corruption Risk

**Problem:** If multiple updates happen simultaneously:
```typescript
// User quickly changes multiple fields
updateState({ useCaseData: { ...state.useCaseData, field1: value1 } });
updateState({ useCaseData: { ...state.useCaseData, field2: value2 } });
```

Since React state updates are async, the second update might use stale `state.useCaseData`, overwriting `field1`.

**Fix:** Use functional updates:
```typescript
updateState(prev => ({ 
  useCaseData: { ...prev.useCaseData, field1: value1 } 
}));
```

---

## Recommended Fixes

### Fix 1: Use Functional Updates in updateState

**WizardV6.tsx:**
```typescript
const updateState = useCallback((updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)) => {
  setState(prev => {
    const updatesObj = typeof updates === 'function' ? updates(prev) : updates;
    return { ...prev, ...updatesObj };
  });
}, []);
```

**Step3Details.tsx:**
```typescript
const updateAnswer = (fieldName: string, value: any) => {
  updateState(prev => ({
    useCaseData: { ...prev.useCaseData, [fieldName]: value }
  }));
};
```

### Fix 2: Remove Local State from Step3HotelEnergy

**Step3HotelEnergy.tsx:**
- Remove `answers` local state
- Use `state.useCaseData` directly (like Step3Details)
- Update via `updateState` directly

### Fix 3: Add State Persistence

**WizardV6.tsx:**
```typescript
// Load state from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem('merlin-wizard-state');
  if (saved) {
    try {
      setState(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load saved state:', e);
    }
  }
}, []);

// Save state to localStorage on change
useEffect(() => {
  localStorage.setItem('merlin-wizard-state', JSON.stringify(state));
}, [state]);
```

---

## Testing Checklist

- [ ] Fill Step 3 form, navigate to Step 4, go back - data should persist
- [ ] Fill Step 3 form, refresh page - data should persist (if Fix 3 implemented)
- [ ] Change multiple fields quickly - all changes should persist
- [ ] Change field, navigate away, come back - change should persist
- [ ] Verify no data corruption when updating nested objects

---

## Priority

1. **HIGH:** Fix shallow merge issue (Fix 1)
2. **HIGH:** Remove local state from Step3HotelEnergy (Fix 2)
3. **MEDIUM:** Add state persistence (Fix 3)
