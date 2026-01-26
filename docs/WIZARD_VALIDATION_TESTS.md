# Wizard Validation Test Suite
**Created: January 26, 2026**

## Purpose

This automated test suite identifies common bugs in WizardV6 before they waste hours of debugging time. It checks for:

1. **Infinite loops** in useEffect hooks
2. **Pre-fill → validation → Continue button flow** issues
3. **Missing required field mappings**
4. **State synchronization problems**
5. **Database question configuration issues**

## Usage

```bash
# Run the test suite
npm run test:wizard

# Run before committing wizard changes
git add . && npm run test:wizard && git commit -m "wizard: ..."

# Run in CI/CD pipeline
- name: Validate Wizard
  run: npm run test:wizard
```

## What It Tests

### TEST 1: Infinite Loop Detection

**Checks:**
- useEffect hooks that modify state included in their dependency array
- Missing guard refs (e.g., `preFillsAppliedRef`) to prevent re-execution
- Missing early returns that prevent redundant state updates

**Example caught bug:**
```typescript
// ❌ BAD - Infinite loop
useEffect(() => {
  updateState({ useCaseData: { ...state.useCaseData, inputs: merged } });
}, [state.useCaseData, updateState]); // ← Depends on what it modifies!

// ✅ GOOD - Guard prevents loop
const preFillsAppliedRef = useRef(null);
useEffect(() => {
  if (preFillsAppliedRef.current === key) return; // Early exit
  preFillsAppliedRef.current = key;
  updateState({ useCaseData: { ...state.useCaseData, inputs: merged } });
}, [state.industry, updateState]); // ← Does NOT depend on useCaseData
```

### TEST 2: Validation Contract

**Checks:**
- Validator reads from correct state path (`state.useCaseData?.inputs`)
- Industry-specific validations exist (hotel, data-center, car-wash, etc.)

**Why this matters:**
If the validator reads from a different state path than where pre-fills write, validation will never see pre-filled values.

### TEST 3: Pre-fill → Validation Flow

**Checks:**
- WizardV6 uses `validateStep3Contract(state)` correctly
- Validation effect depends on `[state]` so it re-runs when pre-fills update
- Pre-fills write to `state.useCaseData.inputs` (same path validator reads)
- Pre-fill effect has guard ref to prevent infinite loops

**Common failure:**
```typescript
// ❌ BAD - Writes to different path than validator reads
updateState({ facility: { bayCount: 4 } }); // Wrong path!

// ✅ GOOD - Writes to same path validator reads
updateState({ useCaseData: { ...state.useCaseData, inputs: { bayCount: 4 } } });
```

### TEST 4: Continue Button Gating

**Checks:**
- Continue button checks `step3Contract.ok` (not UI-reported validity)
- `_canProceed()` function for Step 3 uses contract validator
- Button `disabled` prop uses `canProceed` state

**Why this matters:**
If the Continue button checks a different validation source than the contract validator, users can get stuck even with valid data.

### TEST 5: Required Field Mappings

**Checks:**
- All industry-required fields have extraction logic in validator
- Examples: `rackCount` for data-center, `bayCount` for car-wash, `roomCount` for hotel

**Example:**
```typescript
// Validator MUST extract all required fields
const rackCount = num(inputs.rackCount || inputs.numberOfRacks);
const bayCount = num(inputs.bayCount || inputs.bays);
const roomCount = num(inputs.roomCount || inputs.numberOfRooms);
```

### TEST 6: Database Question Configuration

**Checks (requires DATABASE_URL):**
- All active use cases have questions configured
- Required questions have defaults OR pre-fills

**Common issue:**
A new industry is added to database but no questions are configured → wizard shows empty Step 3 → users can't proceed.

## Exit Codes

- **Exit 0**: All tests passed (warnings are OK)
- **Exit 1**: Critical issues found - **DO NOT DEPLOY**

## Interpreting Results

### 🚨 CRITICAL Issues (Must Fix Immediately)

These break the wizard and prevent users from completing quotes:

- Infinite loops that crash the browser
- Pre-fills writing to wrong state path
- Validator reading from wrong state path
- Continue button not checking contract validator
- Missing required field extractors

### ⚠️ Warnings (Should Review)

These might cause problems but aren't immediately breaking:

- useEffect without guard ref (might be OK if has early return)
- DATABASE_URL not set (can't check database questions)
- Required questions without defaults (might have pre-fills)

## Integration with Git Hooks

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Run wizard validation before committing wizard changes
if git diff --cached --name-only | grep -q 'components/wizard/'; then
  echo "🧪 Running wizard validation tests..."
  npm run test:wizard || exit 1
fi
```

## Integration with CI/CD

Add to GitHub Actions workflow:
```yaml
- name: Wizard Validation
  run: npm run test:wizard
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Adding New Tests

To add a new test category, edit `/scripts/test-wizard-validation.mjs`:

```javascript
// ==============================================================================
// TEST N: Your New Test
// ==============================================================================
function checkYourNewThing(filePath) {
  log('\n📋 Testing Your New Thing', 'blue');
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Your validation logic here
  if (badPattern.test(content)) {
    logError(
      path.relative(projectRoot, filePath),
      lineNumber,
      'Description of the issue',
      'CRITICAL' // or 'ERROR' or 'WARNING'
    );
  } else {
    logSuccess('Your test passed');
  }
}

// Then add to runTests():
log('\nTEST N: Your New Test', 'magenta');
checkYourNewThing(someFile);
```

## Known Limitations

1. **Static Analysis Only**: Tests check code patterns, not runtime behavior
2. **False Positives Possible**: Complex patterns might not match expected strings
3. **No Type Checking**: Doesn't replace TypeScript compilation
4. **Database Tests Optional**: Requires DATABASE_URL environment variable

## When to Run

**Always run before:**
- Committing wizard changes
- Deploying to production
- Opening PR that touches wizard files

**Also run:**
- After pulling changes that modify wizard
- Before starting wizard debugging session
- When adding new industry/use case

## Troubleshooting

**"Missing files" error:**
Make sure you're running from project root: `cd /path/to/merlin3 && npm run test:wizard`

**"DATABASE_URL not set" warning:**
This is OK for local development. Set `DATABASE_URL` in `.env` to enable database tests.

**False positive on pre-fill check:**
The test looks for specific patterns. If you've refactored the code, update the patterns in the test script.

## History

- **Jan 26, 2026**: Initial version created after spending hours debugging infinite loop + validation flow issues
- Purpose: Never waste hours on these bugs again - catch them in seconds

## Related Documentation

- `/src/components/wizard/WIZARD_ARCHITECTURE.md` - WizardV6 architecture
- `/CALCULATION_FILES_AUDIT.md` - SSOT calculation flow
- `/.github/copilot-instructions.md` - Development standards
