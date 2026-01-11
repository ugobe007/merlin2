# Step 3 UX Analysis & Proposed Solution

## Current Problems

### 1. **Unclear Interaction Flow**
- User sees question text: "MCS Chargers (1,250 kW each)"
- User sees prompt: "Select your answer below"
- **But no visible buttons/inputs are shown** (or they're unclear)

### 2. **Question Type Mismatch**
The `transformDatabaseQuestion` function maps:
- `'number'` → `'number_buttons'` (requires options)
- `'select'` → `'buttons'` (requires options)
- `'boolean'` → `'toggle'` (has default options)

**Problem**: If database has `question_type: 'number'` but no `select_options`, it becomes `'number_buttons'` with no options → nothing renders.

### 3. **Design Philosophy Mismatch**

**Vineet's Step 1/2 Design:**
- ✅ Large, prominent visual cards
- ✅ Clear clickable elements with icons
- ✅ Obvious selection states (green highlight, checkmarks)
- ✅ Descriptive text and metrics
- ✅ Split-screen layout (input left, analysis right)

**Current Step 3:**
- ❓ Question text is shown
- ❓ Prompt says "select below"
- ❓ But actual input is unclear or missing
- ❓ No clear visual hierarchy

## Root Cause Analysis

### Scenario 1: Database Question Has No Options
```typescript
// Database question:
{
  question_type: 'number',
  field_name: 'mcsChargerCount',
  question_text: 'How many MCS Chargers?',
  select_options: null  // ❌ No options!
}

// Transformed to:
{
  type: 'number_buttons',  // ❌ Requires options!
  options: undefined  // ❌ Nothing to render!
}
```

### Scenario 2: Database Question Type Not Supported
```typescript
// Database question:
{
  question_type: 'text',  // ❌ Not mapped!
  field_name: 'businessName',
  question_text: 'Business name?'
}

// Transformed to:
{
  type: 'buttons',  // ❌ Wrong type!
  options: undefined  // ❌ Nothing to render!
}
```

### Scenario 3: Options Exist But Format Is Wrong
```typescript
// Database question:
{
  question_type: 'select',
  select_options: '[{"value": "0", "label": "None"}]'  // String, not parsed
}

// transformDatabaseQuestion tries to parse, but if it fails:
options: undefined  // ❌ Nothing to render!
```

## Proposed Solution

### Phase 1: Fix Question Type Mapping

**For `number` type questions without options:**
- If has `min_value` and `max_value` → Use `'slider'`
- If has `min_value` but no `max_value` → Use `'increment_box'`
- Otherwise → Use `'number_buttons'` with auto-generated options (0, 1, 2, 3, 4, 5+)

**For `select` type questions without options:**
- Log warning
- Show error message: "Question configuration error - please contact support"

**For `text` type questions:**
- Map to new `'text_input'` type
- Render as text input field

### Phase 2: Improve Visual Design (Vineet-Style)

**Make it look like Step 1/2:**
1. **Large Visual Cards** for button options (like goal cards)
2. **Clear Icons** for each option
3. **Prominent Selection States** (green highlight, checkmarks)
4. **Smart Defaults** shown prominently (like Vineet's pre-filled values)
5. **Split Screen** (question left, Merlin analysis right)

### Phase 3: Add Fallback Rendering

If question type can't be determined or options are missing:
- Show a **generic input** (text field or number field)
- Show **warning message**: "This question needs configuration"
- Allow user to **skip** or **enter manually**

## Immediate Action Items

1. **Add Debug Logging** to see what questions are being loaded
2. **Check Database** to see actual question structure
3. **Fix Type Mapping** to handle all cases
4. **Add Fallback Rendering** for edge cases
5. **Improve Visual Design** to match Vineet's style

## Questions to Answer

1. What does the database actually return for a "MCS Chargers" question?
2. What `question_type` does it have?
3. Does it have `select_options`?
4. What should the user interaction be? (Click buttons? Enter number? Use slider?)
