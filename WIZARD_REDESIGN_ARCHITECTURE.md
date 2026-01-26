# Wizard Redesign Architecture
## Enabling Radical Design Changes Without Breaking Calculations

**Date:** January 22, 2026  
**Purpose:** Document what's stable (can't change) vs flexible (redesign freely)

---

## The Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: DATA (Stable - Database-Driven)                  │
│  ├── custom_questions table (16Q per industry)              │
│  ├── use_cases table (industry metadata)                    │
│  └── Editable via SQL migrations only                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ CONTRACT: Questions JSON
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: LOGIC (Stable - Calculator Services)             │
│  ├── {industry}16QCalculator.ts                             │
│  ├── Input: Record<string, any> (answers)                   │
│  └── Output: { peakKW, bessKWh, confidence, audit }         │
└─────────────────────────┬───────────────────────────────────┘
                          │ CONTRACT: Calculator Interface
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: UI (Flexible - Completely Redesignable!)         │
│  ├── Can be: Wizard, Form, Chat, Mobile App, API           │
│  ├── Only requirement: Call calculator with answers         │
│  └── REDESIGN FREELY - This layer is yours to experiment   │
└─────────────────────────────────────────────────────────────┘
```

---

## Contracts (CANNOT BREAK)

### Contract 1: Question Structure (Database → UI)

**From:** `custom_questions` table  
**To:** Any UI component that renders questions

```typescript
interface CustomQuestion {
  id: string;
  use_case_id: string;
  question_text: string;      // "What type of hotel?"
  field_name: string;          // "hotelClass" (camelCase)
  question_type: string;       // "select" | "multi-select" | "number" | "text"
  options: Array<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
    kWPerRoom?: number;        // Industry-specific metadata
    // ... other metadata
  }>;
  default_value: string;
  is_required: boolean;
  help_text: string;
  display_order: number;       // 1-16
  section_name: string;        // "Topology" | "Infrastructure" | ...
}
```

**UI Must:**
- Read questions from database (via useCaseService)
- Render based on `question_type` (select, multi-select, etc.)
- Collect answers keyed by `field_name`
- Respect `display_order` (or reorder as you wish)

**UI May:**
- Change visual design completely
- Group questions differently
- Hide/show questions conditionally
- Ask questions in any order
- Skip optional questions
- Pre-fill with smart defaults

---

### Contract 2: Calculator Interface (UI → Logic)

**From:** Any UI component  
**To:** Calculator service

```typescript
// EVERY industry calculator MUST implement this interface:
interface Calculator16Q {
  (answers: Record<string, any>): Calculator16QResult;
}

interface Calculator16QResult {
  // REQUIRED: Core sizing
  peakKW: number;              // Peak electrical demand
  bessKWh: number;             // Battery capacity recommended
  bessMW: number;              // Battery power rating
  
  // REQUIRED: Confidence + audit
  confidence: number;          // 0.0-1.0 (how confident in sizing)
  methodology: string;         // "Bottom-up from room count + amenities"
  auditTrail: Source[];        // TrueQuote™ sources
  
  // OPTIONAL: Enhanced metrics
  loadProfile?: {
    peakHour: number;          // Hour of peak (0-23)
    baseLoad: number;          // Minimum load (kW)
    dailyKWh: number;          // Daily energy consumption
  };
  
  // OPTIONAL: Financial preview
  estimatedSavings?: {
    demandChargeReduction: number;
    arbitragePotential: number;
    annualSavings: number;
  };
}

interface Source {
  standard: string;            // "IEEE 4538388"
  value: string | number;      // "0.40" or 0.40
  description: string;         // "BESS/Peak ratio for peak shaving"
  url?: string;                // Link to source
}
```

**UI Must:**
- Collect answers as `Record<string, any>` (keyed by field_name)
- Call calculator: `calculate{Industry}16Q(answers)`
- Display results from calculator output

**UI May:**
- Add extra fields to answers (not used by calculator)
- Transform answer format before passing to calculator
- Cache results for faster re-renders
- Show/hide parts of result object

---

## What You Can Freely Change (UI Layer)

### ✅ Visual Design
- Completely redesign layout, colors, typography
- Use different component libraries (Tailwind, Chakra, Material)
- Make it mobile-first, desktop-first, or responsive

### ✅ Interaction Pattern
- **Current:** 6-step wizard (WizardV6)
- **Alternative 1:** Single-page form
- **Alternative 2:** Conversational chat
- **Alternative 3:** Progressive disclosure (4 questions → 10 → 16)
- **Alternative 4:** Wizard with AI pre-fill

### ✅ Question Presentation
- Show all 16 at once
- Group by section (6 sections)
- Show only relevant questions (conditional logic)
- Reorder questions based on user type
- Use multi-step, accordion, tabs, etc.

### ✅ Smart Features
- AI-powered question pre-fill
- Skip questions with defaults
- Auto-populate from address lookup
- Remember previous answers
- A/B test different flows

---

## What You CANNOT Change (Without Migration)

### ❌ Question Field Names
If calculator expects `hotelClass`, you must collect answer as `hotelClass`.

**Exception:** You can create a mapping layer:
```typescript
// UI uses "hotel_type" but calculator expects "hotelClass"
const answers = {
  hotelClass: formData.hotel_type,  // Map UI field to calculator field
};
```

### ❌ Calculator Input/Output Contract
Calculator expects `Record<string, any>` and returns `Calculator16QResult`.

**Exception:** You can wrap the calculator:
```typescript
function enhancedCalculator(answers) {
  const baseResult = calculateHotel16Q(answers);
  return {
    ...baseResult,
    myCustomField: "extra data",  // Add custom fields
  };
}
```

### ❌ Database Schema
Questions are in `custom_questions` table with specific columns.

**Exception:** You can add NEW columns, but don't remove existing ones:
```sql
-- ✅ OK: Add new column
ALTER TABLE custom_questions ADD COLUMN ui_hint TEXT;

-- ❌ WRONG: Remove required column
ALTER TABLE custom_questions DROP COLUMN field_name;
```

---

## Example: Current WizardV6 Step 3

**Current Implementation:**
```
src/components/wizard/v6/steps/Step3Details.tsx (120 lines)
  └─> calls Step3Integration.tsx (260 lines)
      └─> calls CompleteStep3Component.tsx (1,081 lines)
          └─> renders CompleteQuestionRenderer.tsx (polymorphic)
```

**Contract Points:**
1. Loads questions: `await useCaseService.getQuestionsByIndustry(slug)`
2. Renders questions: `<CompleteQuestionRenderer question={q} />`
3. Collects answers: `{ [field_name]: value }`
4. Calls calculator: `calculateHotel16Q(answers)`

**What Can Change:**
- Replace entire Step3Details with single form
- Use different question renderer
- Skip Step3Integration entirely (just call calculator directly)
- Render questions as chat messages instead of form

---

## Proof: UI is Swappable

Here's the same functionality in 3 different UIs:

### Current: 6-Step Wizard
```tsx
// Step 1: Location
// Step 2: Industry
// Step 3: 16 Questions (current system)
// Step 4: Options
// Step 5: Magic Fit
// Step 6: Quote
```

### Alternative 1: Single Page Form
```tsx
function SinglePageWizard() {
  const questions = await getQuestions('hotel');
  
  return (
    <form onSubmit={handleSubmit}>
      {questions.map(q => (
        <QuestionInput key={q.id} question={q} />
      ))}
      <button>Generate Quote</button>
    </form>
  );
  
  async function handleSubmit(e) {
    const result = calculateHotel16Q(formData);
    // Show results
  }
}
```

### Alternative 2: Conversational Chat
```tsx
function ChatWizard() {
  const [messages, setMessages] = useState([]);
  const [answers, setAnswers] = useState({});
  
  async function handleUserMessage(text) {
    // Extract answer from natural language
    const extracted = await extractAnswer(text, currentQuestion);
    
    // Store answer
    setAnswers({ ...answers, [currentQuestion.field_name]: extracted });
    
    // Ask next question or generate quote
    if (allQuestionsAnswered) {
      const result = calculateHotel16Q(answers);
      showResults(result);
    }
  }
}
```

**All three UIs:**
- ✅ Read questions from same database
- ✅ Call same calculator service
- ✅ Get same results
- ✅ Can coexist in same codebase

---

## Migration Path for Redesign

### Phase 1: Document Current (This Document)
- Map current architecture
- Identify contracts
- List what's flexible vs rigid

### Phase 2: Create Proof-of-Concept
- Build alternative UI alongside WizardV6
- Test with one industry (car wash)
- Validate calculator works with new UI

### Phase 3: A/B Test
- Show 50% users WizardV6
- Show 50% users new UI
- Measure completion rate, accuracy, user satisfaction

### Phase 4: Roll Out Winner
- Keep both if they serve different use cases
- Or deprecate old UI and migrate fully

---

## Next Steps for Your Radical Redesign

**Recommendation:** Start with **Option 2 (Smart Form)** as proof-of-concept

**Why:**
1. Easiest to build (1-2 days)
2. Proves UI is swappable
3. Low risk (existing calculator works)
4. Can iterate to conversational later

**Then Add:**
- Option 1 (Conversational AI) for premium users
- Keep Option 2 (Form) for users who prefer control
- Keep WizardV6 for users who like step-by-step

**Key Insight:** With 16Q framework, you can have MULTIPLE UIs simultaneously, all feeding same calculator services.

---

## Files to Study

**Current Wizard Implementation:**
- `src/components/wizard/v6/WizardV6.tsx` - Main orchestrator
- `src/components/wizard/v6/steps/Step3Details.tsx` - Question step
- `src/components/wizard/CompleteQuestionRenderer.tsx` - Polymorphic renderer

**Calculator Services (when built):**
- `src/services/calculators/carWash16QCalculator.ts` (to be created)
- `src/services/calculators/hotel16QCalculator.ts` (to be created)

**Database Integration:**
- `src/services/useCaseService.ts` - Question loading
- `database/migrations/20260121_carwash_16q_v3.sql` - Example migration

---

## Summary

**Rigid (Don't Break):**
- Question structure from database
- Calculator input/output interface
- Field names in answers object

**Flexible (Redesign Freely):**
- How questions are rendered
- Order questions are asked
- Visual design and interactions
- Number of steps in wizard
- Single page vs multi-step
- Form vs chat vs hybrid

**The 16Q framework gives you architectural flexibility while maintaining calculation accuracy.**
