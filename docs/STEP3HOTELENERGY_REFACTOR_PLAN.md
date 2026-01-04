# Step3HotelEnergy Refactor Plan - Migrate to SSOT Pattern

**Date:** January 2, 2026  
**Goal:** Remove local `answers` state and use `state.useCaseData` directly (like Step3Details)

---

## Current Issues

1. **Local state sync issues:** `answers` state can get out of sync with `state.useCaseData`
2. **Race conditions:** Sync useEffect runs on every `answers` change, can cause issues
3. **Inconsistency:** Different pattern from Step3Details (which uses SSOT correctly)

---

## Target Pattern (Like Step3Details)

```typescript
// ✅ GOOD: Step3Details pattern
const getValue = (question: CustomQuestion) => {
  const stored = state.useCaseData?.[question.field_name];
  // ... use stored or default
};

const updateAnswer = (fieldName: string, value: any) => {
  updateState(prev => ({
    useCaseData: { ...prev.useCaseData, [fieldName]: value }
  }));
};
```

---

## Changes Required

### 1. Remove Local State
```typescript
// ❌ REMOVE
const [answers, setAnswers] = useState<Record<string, any>>(state.useCaseData || {});
```

### 2. Create getValue Helper (like Step3Details)
```typescript
// ✅ ADD
const getValue = (fieldName: string) => {
  const stored = state.useCaseData?.[fieldName];
  if (stored !== undefined) return stored;
  
  const question = getQuestion(fieldName);
  if (question?.default_value) {
    if (question.question_type === 'number') return parseFloat(question.default_value);
    if (question.question_type === 'boolean') return question.default_value === 'true';
    return question.default_value;
  }
  
  return question?.question_type === 'number' ? 0 : 
         question?.question_type === 'boolean' ? false :
         question?.question_type === 'multiselect' ? [] : '';
};
```

### 3. Create updateAnswer Helper (like Step3Details)
```typescript
// ✅ ADD
const updateAnswer = (fieldName: string, value: any) => {
  updateState(prev => ({
    useCaseData: { ...prev.useCaseData, [fieldName]: value }
  }));
};
```

### 4. Remove Sync useEffect
```typescript
// ❌ REMOVE (lines 244-253)
useEffect(() => {
  const energyEstimate = calculateEnergy();
  updateState({
    useCaseData: {
      ...answers,
      estimatedAnnualKwh: energyEstimate
    }
  });
}, [answers]);
```

### 5. Update calculateEnergy
```typescript
// ✅ CHANGE: Use state.useCaseData instead of answers
const calculateEnergy = (): number => {
  const sqft = (state.useCaseData?.squareFootage || 0) > 0 
    ? state.useCaseData.squareFootage 
    : estimatedSqft;
  // ... rest of function uses state.useCaseData?.[field]
};
```

### 6. Update estimatedSqft
```typescript
// ✅ CHANGE: Use state.useCaseData instead of answers
const estimatedSqft = useMemo(() => {
  const categoryOptions = getOptions('hotelCategory');
  const selectedCategory = categoryOptions.find(o => o.value === state.useCaseData?.hotelCategory);
  const multiplier = selectedCategory?.sqftMultiplier || 500;
  const roomCount = state.useCaseData?.roomCount || (getQuestion('roomCount')?.default_value ? parseFloat(getQuestion('roomCount')!.default_value!) : 150);
  return roomCount * multiplier;
}, [state.useCaseData?.hotelCategory, state.useCaseData?.roomCount, questions]);
```

### 7. Update Handlers
```typescript
// ✅ CHANGE: handleCategoryChange
const handleCategoryChange = (value: string) => {
  updateAnswer('hotelCategory', value);
  setShowAutofillPrompt(true);
};

// ✅ CHANGE: toggleMultiselect
const toggleMultiselect = (field: string, value: string) => {
  const current = state.useCaseData?.[field] || [];
  if (current.includes(value)) {
    updateAnswer(field, current.filter((v: string) => v !== value));
  } else {
    updateAnswer(field, [...current, value]);
  }
};

// ✅ CHANGE: autofillForCategory
const autofillForCategory = () => {
  const presets: Record<string, Record<string, string>> = { /* ... */ };
  if (state.useCaseData?.hotelCategory && presets[state.useCaseData.hotelCategory]) {
    updateState(prev => ({
      useCaseData: { ...prev.useCaseData, ...presets[state.useCaseData.hotelCategory] }
    }));
  }
  setShowAutofillPrompt(false);
};
```

### 8. Update Initialization useEffect
```typescript
// ✅ CHANGE: Only initialize defaults if not in state (like Step3Details)
useEffect(() => {
  async function fetchQuestions() {
    // ... fetch questions
    
    // Only set defaults if fields are missing from state.useCaseData
    const currentData = state.useCaseData || {};
    const defaults: Record<string, any> = {};
    
    data?.forEach(q => {
      if (q.default_value && currentData[q.field_name] === undefined) {
        // ... set defaults
      }
    });
    
    // Only update if defaults were found
    if (Object.keys(defaults).length > 0) {
      updateState(prev => ({
        useCaseData: { ...defaults, ...prev.useCaseData } // defaults first, then SSOT overrides
      }));
    }
  }
  fetchQuestions();
}, []); // Only run once on mount
```

### 9. Update All Render References
```typescript
// ✅ CHANGE: Replace all answers[field] with getValue(field) or state.useCaseData?.[field]
// Examples:
answers.hotelCategory → state.useCaseData?.hotelCategory
answers.roomCount → state.useCaseData?.roomCount || defaultValue
answers.squareFootage → state.useCaseData?.squareFootage
// etc.
```

---

## Testing Checklist

- [ ] Fill form fields, navigate away, come back - values should persist
- [ ] Change category, verify autofill works
- [ ] Change roomCount, verify square footage estimate updates
- [ ] Change multiple fields quickly - all should persist
- [ ] Verify energy calculation updates correctly
- [ ] Refresh page - all values should persist (via localStorage)

---

## Files to Modify

- `src/components/wizard/v6/steps/Step3HotelEnergy.tsx`

---

## Benefits

1. ✅ **Consistency:** Same pattern as Step3Details
2. ✅ **No sync issues:** No local state to sync
3. ✅ **Better persistence:** Works with localStorage automatically
4. ✅ **Fewer bugs:** Simpler code, fewer moving parts
5. ✅ **SSOT compliance:** Single source of truth (state.useCaseData)
