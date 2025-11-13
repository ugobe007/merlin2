# Virtual Quote Document - Integration Guide

## Overview

We've implemented a **Single Source of Truth** architecture for quote management that eliminates:
- ❌ Prop drilling through 7+ wizard steps
- ❌ Duplicate calculations across components
- ❌ Inconsistent data between displays
- ❌ Messy state management

## What Was Created

### 1. Core Infrastructure

**`src/types/QuoteDocument.ts`**
- Complete TypeScript interface for all quote data
- Validation functions
- Helper utilities
- Auto-calculates completion percentage
- Tracks changes via audit log

**`src/contexts/QuoteContext.tsx`**
- React Context for global quote state
- Type-safe update methods
- Automatic validation on every change
- Debug component for development
- Undo/redo foundation (future)

**`src/components/wizard/VirtualQuoteViewer.tsx`**
- Floating modal that shows complete quote status
- Real-time progress tracking (0-100%)
- Edit buttons to jump to specific steps
- Validation errors/warnings display
- Always accessible from anywhere in wizard

**`src/services/quoteAdapter.ts`**
- Bridge between legacy wizard state and new QuoteDocument
- Conversion utilities for gradual migration
- Industry-specific baseline calculations
- Backward compatibility helpers

### 2. Key Features

#### QuoteDocument Structure
```typescript
{
  // Metadata
  id: string
  version: number
  status: 'draft' | 'in-progress' | 'review' | 'completed'
  completionPercentage: number  // Auto-calculated
  
  // Use Case (Steps 1-2)
  useCase: {
    industry: string
    inputs: Record<string, any>  // e.g., { rooms: 150 }
    baseline: {
      powerMW: number
      calculatedFrom: string     // "150 rooms × 2.93 kW/room = 440 kW"
    }
  }
  
  // Configuration (Steps 3-4)
  configuration: {
    battery: { powerMW, durationHours, capacityMWh, ... }
    renewables: { solar, wind, generator }
    totalSystemPowerMW: number   // Auto-calculated
  }
  
  // Location (Step 5)
  location: {
    electricityRate: { energyChargePerKWh, demandChargePerKW }
    incentives: { federal, state, utility }
  }
  
  // Financials (Auto-calculated)
  financials: {
    costs: { ... }
    savings: { ... }
    roi: { paybackPeriod, simpleROI, irr, npv }
  }
  
  // AI Analysis
  aiAnalysis: {
    recommendations: [...]
    optimizationScore: number
  }
  
  // Audit Trail
  changeLog: [
    { timestamp, field, oldValue, newValue, source }
  ]
}
```

#### Context Usage
```typescript
import { useQuote } from '../contexts/QuoteContext';

function MyComponent() {
  const { 
    quote,                    // Current quote document
    updateUseCase,            // Update use case section
    updateConfiguration,      // Update config section
    completionPercentage,     // 0-100 progress
    isValid,                  // Validation status
    validationErrors          // Array of error messages
  } = useQuote();
  
  // Update battery configuration
  updateConfiguration({
    battery: {
      powerMW: 0.5,
      durationHours: 4
    }
  });
  
  // Read total system power (auto-calculated)
  const totalPower = quote.configuration.totalSystemPowerMW;
}
```

## Migration Strategy

### Phase 1: Wrap & Sync ✅ COMPLETE
1. ✅ Created QuoteDocument interface
2. ✅ Created QuoteContext provider
3. ✅ Created VirtualQuoteViewer UI
4. ✅ Created adapter/bridge utilities
5. ⏳ Wrap App with QuoteProvider (NEXT)

### Phase 2: Gradual Integration (IN PROGRESS)
6. Wrap SmartWizardV2 with QuoteProvider
7. Add FloatingQuoteButton to wizard
8. Sync existing wizard state → QuoteContext
9. Test that both systems work in parallel
10. Verify VirtualQuoteViewer displays correct data

### Phase 3: Migrate Steps (UPCOMING)
11. Step 1 (Industry): Read/write from context
12. Step 2 (Use Case): Update to use context
13. Step 3 (Configuration): Migrate to context
14. Step 4 (Renewables): Update to context
15. Step 5 (Location): Migrate to context
16. Step 6 (Summary): Read from context only

### Phase 4: Clean Up (FUTURE)
17. Remove duplicate state from SmartWizardV2
18. Update calculation services to use QuoteDocument
19. Consolidate redundant code
20. Remove prop drilling
21. Test end-to-end with all use cases

## Implementation Steps

### Step 1: Add QuoteProvider to App.tsx

```typescript
// src/App.tsx
import { QuoteProvider } from './contexts/QuoteContext';

function App() {
  return (
    <QuoteProvider>
      {/* Existing app content */}
      <BessQuoteBuilder />
    </QuoteProvider>
  );
}
```

### Step 2: Add Virtual Quote UI to SmartWizardV2

```typescript
// src/components/wizard/SmartWizardV2.tsx
import { FloatingQuoteButton, VirtualQuoteViewer } from './VirtualQuoteViewer';
import { useQuote } from '../../contexts/QuoteContext';

const SmartWizardV2: React.FC<Props> = ({ ... }) => {
  const { quote, updateConfiguration, updateUseCase } = useQuote();
  const [showVirtualQuote, setShowVirtualQuote] = useState(false);
  
  // Sync wizard state to context whenever it changes
  useEffect(() => {
    updateConfiguration({
      battery: {
        powerMW: storageSizeMW,
        durationHours: durationHours
      }
    });
  }, [storageSizeMW, durationHours]);
  
  return (
    <>
      {/* Floating button - always visible */}
      <FloatingQuoteButton onClick={() => setShowVirtualQuote(true)} />
      
      {/* Virtual quote viewer modal */}
      <VirtualQuoteViewer
        isOpen={showVirtualQuote}
        onClose={() => setShowVirtualQuote(false)}
        onNavigateToStep={(step) => {
          setStep(step);
          setShowVirtualQuote(false);
        }}
      />
      
      {/* Existing wizard content */}
    </>
  );
};
```

### Step 3: Update Calculation Services

```typescript
// Instead of:
function calculateSomething(storageMW, solarMW, windMW) {
  return storageMW + solarMW + windMW;
}

// Use:
function calculateSomething(quote: QuoteDocument) {
  return quote.configuration.totalSystemPowerMW; // Already calculated!
}
```

## Benefits

### Before (Current Mess)
```
SmartWizardV2 (2000+ lines)
├─ Step 1 props: onSelect, selectedTemplate
├─ Step 2 props: useCaseData, onUpdate, selectedTemplate, aiRecommendation
├─ Step 3 props: storageMW, duration, onUpdate, useCaseData, template
├─ Step 4 props: solarMW, windMW, generatorMW, storageMW, onUpdate
├─ Step 5 props: electricityRate, demandCharge, onUpdate, state, utility
└─ Step 6 props: ALL THE THINGS (20+ props)

QuoteCompletePage recalculates everything from scratch ❌
InteractiveConfigDashboard has own calculations ❌
aiOptimizationService recalculates baseline ❌
```

### After (Clean Architecture)
```
QuoteProvider
└─ QuoteDocument (single source of truth)
    ├─ SmartWizardV2 reads/writes via useQuote()
    ├─ Step 1 reads/writes via useQuote()
    ├─ Step 2 reads/writes via useQuote()
    ├─ Step 3 reads/writes via useQuote()
    ├─ Step 4 reads/writes via useQuote()
    ├─ Step 5 reads/writes via useQuote()
    ├─ Step 6 reads via useQuote()
    ├─ QuoteCompletePage reads via useQuote() ✅
    ├─ VirtualQuoteViewer reads via useQuote() ✅
    └─ All calculations use same data ✅
```

## Testing Checklist

- [ ] Wrap App.tsx with QuoteProvider
- [ ] Add FloatingQuoteButton to wizard
- [ ] Verify button shows completion percentage
- [ ] Click button opens VirtualQuoteViewer
- [ ] Verify all 6 sections display correct data
- [ ] Test hotel use case: 150 rooms → 0.44 MW baseline
- [ ] Add solar → verify total system power updates
- [ ] Click "Edit" button → navigates to correct step
- [ ] Verify validation errors display when incomplete
- [ ] Check change log in quote metadata
- [ ] Test with multiple use cases
- [ ] Verify 0.3MW bug is fixed (single source of truth prevents recalculation)

## Files Modified

### Created (New Files)
- `src/types/QuoteDocument.ts` - Core interface (450 lines)
- `src/contexts/QuoteContext.tsx` - State management (290 lines)
- `src/components/wizard/VirtualQuoteViewer.tsx` - UI component (380 lines)
- `src/services/quoteAdapter.ts` - Migration utilities (250 lines)
- `VIRTUAL_QUOTE_INTEGRATION.md` - This guide

### To Modify (Next Steps)
- `src/App.tsx` - Add QuoteProvider wrapper
- `src/components/wizard/SmartWizardV2.tsx` - Add virtual quote UI, sync state
- `src/components/wizard/steps/*.tsx` - Gradually migrate to useQuote()
- `src/services/baselineService.ts` - Update to use QuoteDocument
- `src/services/aiOptimizationService.ts` - Update to use QuoteDocument
- `src/services/centralizedCalculations.ts` - Update to use QuoteDocument

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│                    <QuoteProvider>                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ provides QuoteContext
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────┐              ┌──────────────────┐
│ SmartWizardV2 │              │ VirtualQuote     │
│               │              │ Viewer           │
│ - Steps 1-6   │◄────────────►│                  │
│ - Config      │  sync state  │ - Progress: 75%  │
│ - Display     │              │ - Validation     │
│               │              │ - Edit buttons   │
└───────┬───────┘              └──────────────────┘
        │
        │ useQuote()
        │
        ▼
┌─────────────────────────────────────────┐
│         QuoteDocument (State)           │
│                                         │
│  useCase: { industry, baseline, ... }   │
│  configuration: { battery, solar, ... } │
│  location: { rates, incentives, ... }   │
│  financials: { costs, savings, roi }    │
│  aiAnalysis: { recommendations, ... }   │
│  changeLog: [ ... ]                     │
│                                         │
│  ✅ Auto-calculates totalSystemPowerMW  │
│  ✅ Auto-validates on every change      │
│  ✅ Auto-tracks completion %            │
│  ✅ Maintains audit trail               │
└─────────────────────────────────────────┘
```

## Common Patterns

### Reading Data
```typescript
const { quote } = useQuote();
const batteryPower = quote.configuration.battery.powerMW;
const totalPower = quote.configuration.totalSystemPowerMW;
```

### Writing Data
```typescript
const { updateConfiguration } = useQuote();

// Update battery
updateConfiguration({
  battery: { powerMW: 0.5 }
});

// Update renewables
updateConfiguration({
  renewables: {
    solar: { enabled: true, capacityMW: 0.2 }
  }
});
```

### Validation
```typescript
const { isValid, validationErrors, validationWarnings } = useQuote();

if (!isValid) {
  console.log('Errors:', validationErrors);
  // ["Battery power must be greater than 0"]
}
```

## Next Actions

1. **IMMEDIATE**: Update App.tsx to add QuoteProvider wrapper
2. **NEXT**: Add FloatingQuoteButton and VirtualQuoteViewer to SmartWizardV2
3. **THEN**: Test that virtual quote displays correctly
4. **AFTER**: Gradually migrate each step to read/write from context
5. **FINALLY**: Remove duplicate state and calculations

---

**Status**: Phase 1 complete ✅ | Phase 2 in progress ⏳
**Last Updated**: November 12, 2025
**Files Ready**: 4 new files created, tested locally
**Next Step**: Integrate into App.tsx and SmartWizardV2.tsx
