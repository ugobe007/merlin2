# Step 3 V7 Implementation Plan
**Date:** January 23, 2026  
**Status:** Planning Phase  
**Criticality:** 🔴 HIGH - Core data capture layer, affects all downstream calculations

---

## 🎯 Requirements

### Core Functionality (Non-Negotiable)
1. **Database-Driven Questionnaire** - Load questions from `custom_questions` table (21 active industries)
2. **Calculation Integrity** - Questions must map correctly to SSOT calculation functions
3. **Industry Template Integration** - Use `use_cases` table for industry-specific logic
4. **Real-Time Calculations** - Feed answers into power/BESS calculators (7 top industries)
5. **Data Validation** - No derived fields, clean state management

### UX Requirements (V7-Specific)
1. **Progressive Disclosure** - Step-by-step scrolling prompts (not all at once)
2. **2-Column Advisor Layout** - Match Step 1 V7 design (left=questions, right=advisor)
3. **Live Feedback** - Advisor panel shows calculations as user types
4. **Visual Progress** - Progress indicators, question counter
5. **Smooth Animations** - Scroll-triggered reveals, fade-ins

---

## 🏗️ Architecture

### Reuse Existing (Proven, Battle-Tested)
```
Step3DetailsV7.tsx (NEW - V7 wrapper)
    ↓
Step3Integration.tsx (EXISTING - SSOT enforcement)
    ↓
CompleteStep3Component.tsx (EXISTING - DB questionnaire engine)
```

**Why reuse?**
- `Step3Integration` has 7 industry calculators (car wash, hotel, hospital, etc.)
- `CompleteStep3Component` loads questions from database correctly
- Both are production-tested in WizardV6
- Maintains data integrity (no duplicate/conflicting logic)

### New for V7
- **Step3DetailsV7.tsx** - New 2-column layout wrapper
- **Progressive reveal system** - Scroll-to-next-question UX
- **Live calculation panel** - Right-side advisor with real-time metrics
- **V7 styling** - Match Step 1's purple glow, rounded panels, etc.

---

## 📊 Data Flow

```
User Answers Question
    ↓
Step3DetailsV7 captures input
    ↓
Step3Integration validates & calculates
    ↓ (for 7 industries)
calculateCarWashFromAnswers()
calculateHotelFromAnswers()
[etc]
    ↓
Real-time metrics displayed in Advisor Panel:
- peakDemandKW
- dailyKWh
- recommendedBESSKW
- estimatedSavings
    ↓
On completion → Pass to Step 4 (Goals)
```

---

## 🛠️ Implementation Steps

### Phase 1: Create V7 Wrapper (1-2 hours)
**File:** `src/components/wizard/v7/steps/Step3DetailsV7.tsx`

**Tasks:**
1. ✅ Create 2-column layout (match Step 1 V7)
2. ✅ Integrate `Step3Integration` component
3. ✅ Add progressive disclosure system (show 1-3 questions at a time)
4. ✅ Add scroll-to-next behavior
5. ✅ Style with V7 design system (purple glow, rounded panels)

**Key Props:**
```typescript
interface Step3DetailsV7Props {
  industry: string | null;  // From Step 1 business lookup
  location: LocationData;   // For region-specific calculations
  locationIntel: LocationIntel;  // Rates, solar grade, etc.
  answers: Record<string, unknown>;  // Current questionnaire state
  setAnswers: (answers: Record<string, unknown>) => void;
  onComplete: () => void;
  onBack: () => void;
}
```

### Phase 2: Live Calculation Panel (1 hour)
**Component:** Right-side advisor panel in Step3DetailsV7

**Display:**
- **Facility Snapshot** - Size/scale from answers
- **Power Profile** - Peak demand, daily consumption
- **BESS Recommendation** - Recommended kW/kWh
- **Savings Estimate** - Annual savings preview
- **Confidence Meter** - How complete is the data?

**Data Source:**
- Pull from `Step3Integration` real-time calculations
- Use `calculateXxxFromAnswers()` functions
- Update on every answer change (debounced)

### Phase 3: Progressive Disclosure UX (2 hours)
**Features:**
1. **Question Grouping** - Show 1-3 related questions at a time
2. **Scroll-to-Reveal** - Next group fades in after answering current
3. **Progress Bar** - Show completion % (questions answered / total)
4. **Smart Validation** - Can't proceed until required fields filled
5. **Conditional Logic** - Hide/show based on previous answers

**Logic:**
```typescript
const questionGroups = [
  { questions: ['facilitySize', 'squareFootage'], label: 'Facility Basics' },
  { questions: ['operatingHours', 'peakDemand'], label: 'Operations' },
  { questions: ['hvacType', 'refrigeration'], label: 'Energy Systems', conditional: true },
  // ...
];

const currentGroup = questionGroups[currentGroupIndex];
const canProceed = currentGroup.questions.every(q => answers[q] !== undefined);
```

### Phase 4: Integration with WizardV7 (30 min)
**File:** `src/components/wizard/v7/WizardV7.tsx`

**Changes:**
```typescript
// Replace existing Step3Industry with Step3DetailsV7
import Step3DetailsV7 from './steps/Step3DetailsV7';

// In render:
{currentStep === 3 && (
  <Step3DetailsV7
    industry={industry || location?.business?.industrySlug}
    location={location}
    locationIntel={locationIntel}
    answers={questionnaireAnswers}
    setAnswers={setQuestionnaireAnswers}
    onComplete={() => setCurrentStep(4)}
    onBack={() => setCurrentStep(2)}
  />
)}
```

### Phase 5: Testing & Validation (1 hour)
**Critical Tests:**
1. ✅ Load correct questions for each of 21 industries
2. ✅ Real-time calculations working for 7 top industries
3. ✅ Data flows correctly to Step 4 (Goals)
4. ✅ No derived fields in state
5. ✅ Conditional questions show/hide correctly
6. ✅ Progress can be saved and resumed

---

## ⚠️ Critical Constraints

### DO NOT Break
1. **Database Schema** - `custom_questions` table structure
2. **Calculation Functions** - 7 industry calculators in `Step3Integration`
3. **State Management** - No derived fields (per copilot instructions)
4. **V6 Production** - V6 wizard must continue working

### Must Maintain
1. **Question Order** - Affects conditional logic
2. **Field Names** - Match database column names (snake_case priority)
3. **Data Types** - Number vs string matters for calculations
4. **Validation Rules** - Required/optional field logic

---

## 📝 Files to Create/Modify

### New Files
- `src/components/wizard/v7/steps/Step3DetailsV7.tsx` (main component)
- `src/components/wizard/v7/components/LiveCalculationPanel.tsx` (advisor panel)
- `src/components/wizard/v7/components/ProgressiveQuestionGroup.tsx` (question reveal)

### Modified Files
- `src/components/wizard/v7/WizardV7.tsx` (integrate Step 3)
- `src/components/wizard/v7/types.ts` (add questionnaire state types)

### DO NOT MODIFY (Protected)
- `src/components/wizard/Step3Integration.tsx` ✅ Production-tested
- `src/components/wizard/CompleteStep3Component.tsx` ✅ Production-tested
- `src/services/calculators/*.ts` ✅ Industry calculation SSOT

---

## 🎨 Visual Design (Match Step 1 V7)

### Left Column (Questions)
```
┌─────────────────────────────────────┐
│  📋 Facility Details                │
│  Tell us about your [industry]      │
│                                     │
│  [Question Group 1]                 │
│   ┌─────────────────────────────┐  │
│   │ How many rooms?              │  │
│   │ [  150  ] rooms              │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ What's your occupancy rate?  │  │
│   │ [===|=====] 75%              │  │
│   └─────────────────────────────┘  │
│                                     │
│  [Fade-in animation for next group] │
│                                     │
│  Progress: 6/16 questions ████▒▒▒▒ │
└─────────────────────────────────────┘
```

### Right Column (Live Analysis)
```
┌─────────────────────────────────────┐
│  🤖 Merlin Analysis                 │
│  ┌───────────────────────────────┐ │
│  │ 🏨 150-Room Hotel             │ │
│  │ 75% Occupancy                 │ │
│  ├───────────────────────────────┤ │
│  │ Peak Demand: 420 kW          │ │
│  │ Daily Use: 8,400 kWh         │ │
│  ├───────────────────────────────┤ │
│  │ Recommended BESS:            │ │
│  │ • 300 kW / 1,200 kWh         │ │
│  │ • 4-hour duration            │ │
│  ├───────────────────────────────┤ │
│  │ Est. Annual Savings:         │ │
│  │ $47,200/yr                   │ │
│  │ Payback: 4.2 years           │ │
│  └───────────────────────────────┘ │
│                                     │
│  ✅ Confidence: High (14/16)       │
│     TrueQuote™ Ready               │
└─────────────────────────────────────┘
```

---

## 🚀 Next Steps

1. **Review this plan** with stakeholder
2. **Start Phase 1** - Create Step3DetailsV7 wrapper
3. **Test with 3 industries** - Car wash, hotel, office (most common)
4. **Iterate on UX** - Progressive disclosure timing/animation
5. **Full industry test** - All 21 industries
6. **Production deployment** - After V6 validation

---

## 📚 Reference Files

- Production Step 3: `src/components/wizard/v6/steps/Step3Details.tsx`
- Integration Layer: `src/components/wizard/Step3Integration.tsx`
- Questionnaire Engine: `src/components/wizard/CompleteStep3Component.tsx`
- Industry Calculators: `src/services/calculators/*.ts`
- Database Schema: `database/migrations/*custom_questions*.sql`

---

**Total Estimated Time:** 5-6 hours (surgical precision, not rush job)
**Risk Level:** Medium (reusing proven components reduces risk)
**Dependencies:** Step 1 V7 complete, database migrations applied
