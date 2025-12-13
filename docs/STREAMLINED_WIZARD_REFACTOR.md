# StreamlinedWizard Refactoring Plan

## Current State Analysis (December 2025)

### The Problem: 4,677 Lines of Technical Debt

The `StreamlinedWizard.tsx` component has grown into a monolithic file that violates multiple React best practices:

| Metric | Current | Target | Progress |
|--------|---------|--------|----------|
| Total Lines | 4,677 | ~300 (orchestrator) | ⏳ In Progress |
| Constants extracted | 0 | 294 lines | ✅ Done |
| Types extracted | 0 | 274 lines | ✅ Done |
| Section 0 (Welcome) | inline | separate | ✅ 286 lines |
| Section 1 (Industry) | inline | separate | ✅ 194 lines |
| Section 2 (Facility) | inline | separate | ⏳ Pending |
| Section 3 (Goals) | inline | separate | ⏳ Pending |
| Section 4 (Config) | inline | separate | ⏳ Pending |
| Section 5 (Quote) | inline | separate | ⏳ Pending |

### Files Created So Far (Build Passes ✅)

```
src/components/wizard/
├── StreamlinedWizard.tsx          (4,677 lines - original, unchanged)
├── constants/
│   ├── index.ts
│   └── wizardConstants.ts         (294 lines) ✅
├── types/
│   ├── index.ts
│   └── wizardTypes.ts             (274 lines) ✅
└── sections/
    ├── index.ts
    ├── WelcomeLocationSection.tsx (286 lines) ✅
    └── IndustrySection.tsx        (194 lines) ✅
```

### Current Structure (Problematic)

```
StreamlinedWizard.tsx (4,677 lines)
├── 70 lines: Types & interfaces
├── 100 lines: Constants (GOAL_OPTIONS, FACILITY_PRESETS, US_STATES, etc.)
├── 500 lines: State management (20+ useState, 12 useEffects)
├── 300 lines: Handler functions
├── 3,700 lines: JSX for 6 sections (all inline!)
│   ├── Section 0: Welcome + Location (~400 lines)
│   ├── Section 1: Industry Selection (~450 lines)
│   ├── Section 2: Facility Details (~600 lines)
│   ├── Section 3: Goals & Add-ons (~800 lines)
│   ├── Section 4: System Configuration (~900 lines)
│   └── Section 5: Quote Results (~600 lines)
└── Supporting UI (modals, footer, etc.)
```

### Issues Identified

1. **Monolithic Component** - Single file handles all wizard logic
2. **State Explosion** - 20+ useState declarations with complex interdependencies
3. **Effect Soup** - 12 useEffect hooks with overlapping concerns
4. **No Separation of Concerns** - UI, business logic, state management all mixed
5. **Duplicated Code** - PowerProfileTracker rendered twice (desktop/mobile)
6. **No Testability** - Can't unit test individual sections
7. **Slow Development** - Any change requires navigating 4,677 lines

---

## New Architecture

### Target Structure

```
src/components/wizard/
├── StreamlinedWizard.tsx          (~300 lines - orchestrator only)
├── hooks/
│   └── useStreamlinedWizard.ts    (~400 lines - all state/effects)
├── layout/
│   ├── WizardLayout.tsx           (~150 lines - modal container)
│   └── WizardHeader.tsx           (~50 lines - header bar)
├── sections/
│   ├── WelcomeLocationSection.tsx (~200 lines)
│   ├── IndustrySection.tsx        (~250 lines)
│   ├── FacilityDetailsSection.tsx (~300 lines)
│   ├── GoalsSection.tsx           (~350 lines)
│   ├── ConfigurationSection.tsx   (~400 lines)
│   └── QuoteResultsSection.tsx    (~300 lines)
├── shared/
│   ├── LocationInput.tsx          (~100 lines)
│   ├── IndustryGrid.tsx           (~150 lines)
│   ├── CustomQuestionRenderer.tsx (~200 lines)
│   ├── GoalsGrid.tsx              (~150 lines)
│   ├── SystemConfigurator.tsx     (~250 lines)
│   └── QuoteDisplay.tsx           (~200 lines)
└── constants/
    └── wizardConstants.ts         (~100 lines)
```

### Component Responsibilities

#### 1. `StreamlinedWizard.tsx` (Orchestrator)
- Import and render `WizardLayout`
- Import and conditionally render section components
- Pass props from hook to sections
- Handle section transitions

#### 2. `useStreamlinedWizard.ts` (State & Effects)
- All 20+ useState declarations
- All 12 useEffect hooks
- Handler functions (handleZipChange, handleStateSelect, etc.)
- Integration with useWizardState (centralized state)
- Cost calculation effects
- Quote generation logic

#### 3. Section Components
Each section receives props and renders UI:
- `WelcomeLocationSection` - Zip/state input, location confirmation
- `IndustrySection` - Vertical cards + use case grid
- `FacilityDetailsSection` - Dynamic custom questions from DB
- `GoalsSection` - Goals checkboxes + add-on toggles
- `ConfigurationSection` - Battery, solar, wind, generator, EV sliders
- `QuoteResultsSection` - Quote summary, downloads, RFQ modal

#### 4. Shared Sub-Components
Reusable pieces used across sections:
- `LocationInput` - Zip code + state dropdown
- `IndustryGrid` - Use case selection grid
- `CustomQuestionRenderer` - Renders DB-driven questions
- `GoalsGrid` - Goals checkbox grid
- `SystemConfigurator` - Equipment sizing controls
- `QuoteDisplay` - Quote summary cards

---

## Implementation Plan

### Phase 1: Extract State (Day 1)
1. Create `hooks/useStreamlinedWizard.ts`
2. Move all useState declarations
3. Move all useEffect hooks
4. Move handler functions
5. Export state + handlers as return value

### Phase 2: Extract Sections (Day 2)
1. Create `sections/` directory
2. Extract Section 0 → `WelcomeLocationSection.tsx`
3. Extract Section 1 → `IndustrySection.tsx`
4. Extract Section 2 → `FacilityDetailsSection.tsx`
5. Extract Section 3 → `GoalsSection.tsx`
6. Extract Section 4 → `ConfigurationSection.tsx`
7. Extract Section 5 → `QuoteResultsSection.tsx`

### Phase 3: Extract Layout (Day 2)
1. Create `layout/WizardLayout.tsx` - modal container
2. Create `layout/WizardHeader.tsx` - header bar
3. Consolidate PowerProfileTracker rendering (desktop + mobile)

### Phase 4: Extract Sub-Components (Day 3)
1. Create reusable components in `shared/`
2. Refactor sections to use shared components
3. Extract constants to `constants/wizardConstants.ts`

### Phase 5: Integration & Testing (Day 3)
1. Wire up orchestrator with all components
2. Verify build passes
3. Test all 6 sections manually
4. Verify SSOT compliance (calculateQuote flow)

---

## Code Migration Examples

### Before: Monolithic State
```tsx
// StreamlinedWizard.tsx (lines 365-460)
const [currentSection, setCurrentSection] = useState(0);
const [completedSections, setCompletedSections] = useState<string[]>([]);
const [totalPoints, setTotalPoints] = useState(0);
const [initializedFromVertical, setInitializedFromVertical] = useState(false);
const [wizardState, setWizardState] = useState<WizardState>({ ... });
// ... 15 more useState declarations
```

### After: Custom Hook
```tsx
// hooks/useStreamlinedWizard.ts
export function useStreamlinedWizard(props: StreamlinedWizardProps) {
  // All state here
  const [currentSection, setCurrentSection] = useState(0);
  // ...
  
  // All effects here
  useEffect(() => { /* ... */ }, [deps]);
  
  // All handlers here
  const handleZipChange = useCallback((zip: string) => { /* ... */ }, []);
  
  return {
    // State
    currentSection,
    completedSections,
    wizardState,
    // Handlers
    setCurrentSection,
    handleZipChange,
    handleStateSelect,
    // Computed
    isValid: currentSection < 5,
  };
}
```

### Before: Inline Section JSX
```tsx
// StreamlinedWizard.tsx (~400 lines for Section 0)
{currentSection === 0 && (
  <div ref={el => { sectionRefs.current[0] = el; }}>
    <div className="text-center mb-10">
      <div className="inline-flex...">
        <Sparkles className="w-5 h-5..." />
        ...hundreds of lines of JSX...
      </div>
    </div>
  </div>
)}
```

### After: Section Component
```tsx
// sections/WelcomeLocationSection.tsx
interface Props {
  wizardState: WizardState;
  onZipChange: (zip: string) => void;
  onStateSelect: (state: string) => void;
  onContinue: () => void;
}

export function WelcomeLocationSection({ wizardState, onZipChange, onStateSelect, onContinue }: Props) {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-8">
      <LocationInput
        zipCode={wizardState.zipCode}
        state={wizardState.state}
        onZipChange={onZipChange}
        onStateSelect={onStateSelect}
      />
      {wizardState.state && (
        <button onClick={onContinue}>Continue</button>
      )}
    </div>
  );
}
```

---

## Success Criteria

- [ ] Build passes with no TypeScript errors
- [ ] All 6 sections render correctly
- [ ] PowerProfileTracker shows correct values
- [ ] Quote generation works (calculateQuote flow)
- [ ] Section navigation works
- [ ] Vertical landing pages (hotel, car-wash, ev-charging) still work
- [ ] Export (PDF/Word/Excel) works
- [ ] RFQ modal works
- [ ] Premium comparison works

## Files to Create

1. `src/components/wizard/hooks/useStreamlinedWizard.ts`
2. `src/components/wizard/layout/WizardLayout.tsx`
3. `src/components/wizard/layout/WizardHeader.tsx`
4. `src/components/wizard/sections/WelcomeLocationSection.tsx`
5. `src/components/wizard/sections/IndustrySection.tsx`
6. `src/components/wizard/sections/FacilityDetailsSection.tsx`
7. `src/components/wizard/sections/GoalsSection.tsx`
8. `src/components/wizard/sections/ConfigurationSection.tsx`
9. `src/components/wizard/sections/QuoteResultsSection.tsx`
10. `src/components/wizard/constants/wizardConstants.ts`

## Preserved Functionality

All existing functionality must be preserved:
- Geographic recommendations based on location
- Database-driven custom questions per industry
- SSOT power calculations (useCasePowerCalculations.ts)
- SSOT quote generation (QuoteEngine/calculateQuote)
- Gamification (points, levels)
- PowerProfileTracker sidebar
- Premium configuration comparison
- RFQ vendor submission
- Export to PDF/Word/Excel

---

*Created: December 10, 2025*
*Author: AI Assistant (Claude)*
