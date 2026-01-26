# 🧪 Wizard Test Suite - Quick Reference

## Run Tests
```bash
npm run test:wizard
```

## What Gets Checked

| Test | Checks For | Severity |
|------|-----------|----------|
| **Infinite Loops** | useEffect circular dependencies | 🚨 CRITICAL |
| **Pre-fill Flow** | Pre-fills → Validator → Continue button | 🚨 CRITICAL |
| **Field Mappings** | All required fields extracted | ❌ ERROR |
| **Continue Button** | Uses contract validator | 🚨 CRITICAL |
| **DB Questions** | All industries have questions | ⚠️ WARNING |

## Exit Codes

- **0** = ✅ Pass (warnings OK)
- **1** = 🚨 Critical issues - **DO NOT DEPLOY**

## Common Bugs Caught

### 1. Infinite Loop (Most Common)
```typescript
// ❌ BREAKS: Modifies what it depends on
useEffect(() => {
  updateState({ useCaseData: {...state.useCaseData, ...} });
}, [state.useCaseData]); // ← Problem!

// ✅ FIXED: Guard ref + remove circular dep
const ref = useRef(null);
useEffect(() => {
  if (ref.current === key) return;
  ref.current = key;
  updateState({ useCaseData: {...state.useCaseData, ...} });
}, [state.industry]); // ← No useCaseData!
```

### 2. Validation Can't See Pre-fills
```typescript
// ❌ BREAKS: Different paths
updateState({ facility: { bayCount: 4 } }); // Pre-fill here
validator reads: state.useCaseData.inputs.bayCount // But reads here!

// ✅ FIXED: Same path
updateState({ useCaseData: { inputs: { bayCount: 4 } } });
validator reads: state.useCaseData.inputs.bayCount // Matches!
```

### 3. Continue Button Checks Wrong Thing
```typescript
// ❌ BREAKS: UI can lie
const canProceed = step3Valid; // ← From UI component

// ✅ FIXED: Contract is source of truth
const canProceed = step3Contract.ok; // ← From validator
```

## When to Run

- ✅ Before committing wizard changes
- ✅ Before deploying to production
- ✅ After pulling wizard changes
- ✅ When debugging wizard issues

## Quick Fixes

**Test fails with "pre-fills don't write to inputs":**
→ Check that `updateState({ useCaseData: { inputs: ... } })` exists

**Test fails with "infinite loop risk":**
→ Add guard ref:
```typescript
const ref = useRef(null);
if (ref.current === key) return;
ref.current = key;
```

**Test fails with "Continue button doesn't check contract":**
→ Change: `return isValid;` to `return step3Contract.ok;`

**Test fails with "missing extraction for X.Y":**
→ Add: `const Y = num(inputs.Y || inputs.alternativeName);`

## Full Documentation
See: `/docs/WIZARD_VALIDATION_TESTS.md`
